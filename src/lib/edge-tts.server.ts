import { createHash, randomUUID } from "node:crypto";
import WebSocket from "ws";
import { adaptForUzbekTts } from "@/lib/tts-phonetics";
import { createDeadline, mapLimit, splitIntoChunks, type Deadline } from "@/lib/server-guards";

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const WSS_URL =
  "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";
const SEC_MS_GEC_VERSION = "1-153.0.4234.32";
const WIN_EPOCH = 11644473600;
const OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";
const DEFAULT_VOICE = "uz-UZ-MadinaNeural";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0";

export const ALLOWED_VOICES = new Set([
  "uz-UZ-MadinaNeural",
  "uz-UZ-SardorNeural",
  "en-US-JennyNeural",
  "en-US-AriaNeural",
  "en-US-GuyNeural",
  "en-GB-SoniaNeural",
]);

const AUDIO_NEEDLE = Buffer.from("Path:audio\r\n");

function generateSecMsGec(skewSec = 0): string {
  const unix = Math.floor(Date.now() / 1000) + skewSec;
  const ticks = unix + WIN_EPOCH;
  const rounded = ticks - (ticks % 300);
  const windowsTicks = rounded * 10_000_000;
  return createHash("sha256")
    .update(`${windowsTicks}${TRUSTED_CLIENT_TOKEN}`)
    .digest("hex")
    .toUpperCase();
}

function escapeXml(text: string): string {
  return text
    .replaceAll("&", "\u0026amp;")
    .replaceAll("<", "\u0026lt;")
    .replaceAll(">", "\u0026gt;")
    .replaceAll('"', "\u0026quot;")
    .replaceAll("'", "\u0026apos;");
}

function langForVoice(voice: string): string {
  if (voice.startsWith("uz-")) return "uz-UZ";
  if (voice.startsWith("en-GB")) return "en-GB";
  return "en-US";
}

function toSsml(text: string, voice: string): string {
  const lang = langForVoice(voice);
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${voice}"><prosody rate="-4%" pitch="+0Hz">${escapeXml(text)}</prosody></voice></speak>`;
}

function extractAudio(payload: Buffer): Buffer | null {
  const idx = payload.indexOf(AUDIO_NEEDLE);
  if (idx === -1) return null;
  const audio = payload.subarray(idx + AUDIO_NEEDLE.length);
  return audio.length ? audio : null;
}

function asBuffer(data: unknown): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (Array.isArray(data)) return Buffer.concat(data as Buffer[]);
  return Buffer.from(String(data));
}

function synthesizeOnce(
  text: string,
  voice: string,
  skewSec: number,
  timeoutMs = 12000,
): Promise<Buffer> {
  const requestId = randomUUID().replaceAll("-", "");
  const url =
    `${WSS_URL}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}` +
    `&Sec-MS-GEC=${generateSecMsGec(skewSec)}` +
    `&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}` +
    `&ConnectionId=${requestId}`;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let settled = false;
    const ws = new WebSocket(url, {
      headers: {
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
        Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        "User-Agent": UA,
      },
    });

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      if (err) reject(err);
      else if (!chunks.length) reject(new Error("Ovoz bosh qaytdi"));
      else resolve(Buffer.concat(chunks));
    };

    const timer = setTimeout(() => {
      if (chunks.length) finish();
      else finish(new Error("TTS vaqt tugadi"));
    }, timeoutMs);

    ws.on("open", () => {
      const ts = new Date().toUTCString();
      ws.send(
        `X-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"${OUTPUT_FORMAT}"}}}}`,
      );
      ws.send(
        `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${ts}Z\r\nPath:ssml\r\n\r\n${toSsml(text, voice)}`,
      );
    });

    ws.on("message", (data: unknown, isBinary: boolean) => {
      const buf = asBuffer(data);
      if (isBinary) {
        const audio = extractAudio(buf);
        if (audio) chunks.push(audio);
        return;
      }
      const textMsg = buf.toString("utf8");
      if (textMsg.includes("Path:turn.end")) finish();
    });

    ws.on("error", (err) =>
      finish(err instanceof Error ? err : new Error(String(err))),
    );
    ws.on("close", () => {
      if (!settled) {
        if (chunks.length) finish();
        else finish(new Error("TTS ulanishi yopildi"));
      }
    });
  });
}

const cache = new Map<string, Buffer>();
const CACHE_LIMIT = 48;

function remember(key: string, audio: Buffer) {
  if (cache.size >= CACHE_LIMIT) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, audio);
}

export function resolveVoice(voice?: string, _lang?: string): string {
  // Tutor personas: Shukrona=Madina, Saidumar=Sardor. Ignore EN neural voices.
  const v = (voice ?? "").trim();
  if (v === "uz-UZ-SardorNeural" || v === "saidumar" || v === "Saidumar") {
    return "uz-UZ-SardorNeural";
  }
  if (v === "uz-UZ-MadinaNeural" || v === "shukrona" || v === "Shukrona") {
    return "uz-UZ-MadinaNeural";
  }
  if (v.startsWith("uz-") && ALLOWED_VOICES.has(v)) return v;
  // Default girl voice
  return "uz-UZ-MadinaNeural";
}

/** Whole-request budget; must stay well below `maxDuration` (60s). */
const TTS_BUDGET_MS = 45_000;
const PARALLEL_CHUNKS = 3;

export async function synthesizeUtterance(
  text: string,
  voice: string = DEFAULT_VOICE,
  deadline: Deadline = createDeadline(TTS_BUDGET_MS),
): Promise<Buffer> {
  const trimmed = adaptForUzbekTts(text).slice(0, 900);
  if (!trimmed) throw new Error("Matn bosh");
  const safeVoice = resolveVoice(voice);

  const key = `${safeVoice}:${trimmed}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const skews = [0, 300, -300];
  let lastErr: unknown;
  for (const skew of skews) {
    const left = deadline.remaining();
    if (left < 2500) break; // not enough time for another attempt
    try {
      const audio = await synthesizeOnce(trimmed, safeVoice, skew, Math.min(12000, left - 500));
      remember(key, audio);
      return audio;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Ovoz yaratilmadi");
}

export async function synthesizeParts(
  parts: { text: string; voice?: string; lang?: string }[],
): Promise<Buffer> {
  // Long text is split on sentence boundaries (never mid-word), so nothing is cut off.
  const cleaned = parts.flatMap((part) => {
    const voice = resolveVoice(part.voice, part.lang);
    return splitIntoChunks(adaptForUzbekTts(part.text), 900).map((text) => ({ text, voice }));
  });
  if (!cleaned.length) throw new Error("Matn bosh");

  const key = cleaned.map((p) => `${p.voice}:${p.text}`).join("||");
  const hit = cache.get(key);
  if (hit) return hit;

  const deadline = createDeadline(TTS_BUDGET_MS);
  const chunks = await mapLimit(cleaned, PARALLEL_CHUNKS, (part) =>
    synthesizeUtterance(part.text, part.voice, deadline),
  );
  const audio = Buffer.concat(chunks);
  remember(key, audio);
  return audio;
}

export const synthesizeUzbek = synthesizeUtterance;
