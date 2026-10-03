import { createHash, randomUUID } from "node:crypto";
import WebSocket from "ws";
import { adaptForUzbekTts } from "@/lib/tts-phonetics";

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const WSS_URL =
  "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";
const SEC_MS_GEC_VERSION = "1-153.0.4234.32";
const WIN_EPOCH = 11644473600;
const OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";
const DEFAULT_VOICE = "uz-UZ-MadinaNeural";
const UA =
  "Daftar/production";

export const ALLOWED_VOICES = new Set([
  "uz-UZ-MadinaNeural",
  "uz-UZ-SardorNeural",
  "en-US-JennyNeural",
  "en-US-AriaNeural",
  "en-US-GuyNeural",
  "en-GB-SoniaNeural",
]);

function env(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

function azureConfigured(): boolean {
  return Boolean(env("AZURE_SPEECH_KEY") && env("AZURE_SPEECH_REGION"));
}

function azureEndpoint(): string {
  const region = env("AZURE_SPEECH_REGION")!;
  return `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
}

function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function langForVoice(voice: string): string {
  if (voice.startsWith("uz-")) return "uz-UZ";
  if (voice.startsWith("en-GB")) return "en-GB";
  return "en-US";
}

function toSsml(text: string, voice: string): string {
  const lang = langForVoice(voice);
  const rate = voice.startsWith("uz-") ? "-4%" : "-1%";
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${voice}" xml:lang="${lang}"><prosody rate="${rate}" pitch="+0Hz">${escapeXml(text)}</prosody></voice></speak>`;
}

async function synthesizeAzureOnce(text: string, voice: string): Promise<Buffer> {
  const key = env("AZURE_SPEECH_KEY");
  if (!key) throw new Error("Azure Speech kaliti sozlanmagan");

  const res = await fetch(azureEndpoint(), {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": OUTPUT_FORMAT,
      "User-Agent": UA,
    },
    body: toSsml(text, voice),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Azure TTS ${res.status}${detail ? `: ${detail.slice(0, 180)}` : ""}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

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

function extractAudio(payload: Buffer): Buffer | null {
  const needle = Buffer.from("Path:audio\r\n");
  const idx = payload.indexOf(needle);
  if (idx === -1) return null;
  const audio = payload.subarray(idx + needle.length);
  return audio.length ? audio : null;
}

function asBuffer(data: unknown): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (Array.isArray(data)) return Buffer.concat(data as Buffer[]);
  return Buffer.from(String(data));
}

function synthesizeEdgeOnce(
  text: string,
  voice: string,
  skewSec: number,
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
      } catch {}
      if (err) reject(err);
      else if (!chunks.length) reject(new Error("Ovoz bosh qaytdi"));
      else resolve(Buffer.concat(chunks));
    };

    const timer = setTimeout(() => {
      if (chunks.length) finish();
      else finish(new Error("TTS vaqt tugadi"));
    }, 12000);

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
      if (buf.toString("utf8").includes("Path:turn.end")) finish();
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
const CACHE_LIMIT = 64;

function remember(key: string, audio: Buffer) {
  if (cache.size >= CACHE_LIMIT) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, audio);
}

export function resolveVoice(voice?: string, _lang?: string): string {
  const v = (voice ?? "").trim();
  if (ALLOWED_VOICES.has(v)) return v;
  if (v === "saidumar" || v === "Saidumar") return "uz-UZ-SardorNeural";
  if (v === "shukrona" || v === "Shukrona") return "uz-UZ-MadinaNeural";
  return DEFAULT_VOICE;
}

async function synthesizeOne(text: string, voice: string): Promise<Buffer> {
  const safeVoice = resolveVoice(voice);
  const trimmed =
    safeVoice.startsWith("uz-") ? adaptForUzbekTts(text).slice(0, 900) : text.trim().slice(0, 900);
  if (!trimmed) throw new Error("Matn bosh");

  const key = `${azureConfigured() ? "azure" : "edge"}:${safeVoice}:${trimmed}`;
  const hit = cache.get(key);
  if (hit) return hit;

  if (azureConfigured()) {
    try {
      const audio = await synthesizeAzureOnce(trimmed, safeVoice);
      remember(key, audio);
      return audio;
    } catch (azureErr) {
      // Keep a compatibility fallback for deployments that have not configured Azure yet.
      if (safeVoice.startsWith("en-")) throw azureErr;
    }
  }

  const skews = [0, 300, -300];
  let lastErr: unknown;
  for (const skew of skews) {
    try {
      const audio = await synthesizeEdgeOnce(trimmed, safeVoice, skew);
      remember(key, audio);
      return audio;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Ovoz yaratilmadi");
}

export async function synthesizeUtterance(
  text: string,
  voice: string = DEFAULT_VOICE,
): Promise<Buffer> {
  return synthesizeOne(text, voice);
}

export async function synthesizeParts(
  parts: { text: string; voice?: string; lang?: string }[],
): Promise<Buffer> {
  const cleaned = parts
    .map((part) => {
      const voice =
        part.voice ||
        (part.lang === "en" ? "en-US-JennyNeural" : DEFAULT_VOICE);
      return { text: String(part.text ?? "").trim(), voice };
    })
    .filter((part) => part.text.length >= 1);

  if (!cleaned.length) throw new Error("Matn bosh");

  const key = cleaned.map((p) => `${resolveVoice(p.voice)}:${p.text}`).join("||");
  const hit = cache.get(`parts:${key}`);
  if (hit) return hit;

  const chunks: Buffer[] = [];
  for (const part of cleaned) {
    chunks.push(await synthesizeOne(part.text, part.voice));
  }

  // MP3 frames can be concatenated safely for playback by modern browsers.
  const audio = Buffer.concat(chunks);
  remember(`parts:${key}`, audio);
  return audio;
}

export const synthesizeUzbek = synthesizeUtterance;
