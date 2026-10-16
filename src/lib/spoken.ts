/**
 * Spoken text vs. shown text.
 *
 * The voice is always an Uzbek voice, so English has to be written the way an
 * Uzbek reader would say it. The model marks each foreign fragment as
 *
 *     {{shown|said}}        e.g.  {{I am work|ay em vork}}
 *
 * - `shown` is the correct spelling: it goes on the board, in captions, anywhere text is displayed;
 * - `said`  is the pronunciation in Uzbek letters: it is the only thing sent to the voice.
 *
 * Text outside the markup is ordinary Uzbek and still gets the rule-based English
 * respelling (tts-phonetics.ts) as a safety net for words the model forgot to mark.
 * Pure and dependency-free, so it is shared by the client, the sanitizer and the tests.
 */

export type SpokenSegment = {
  /** What is displayed (the correct spelling). */
  text: string;
  /** Pronunciation in Uzbek letters; undefined for ordinary text. */
  said?: string;
};

const PAIR = /\{\{([^{}|]*)\|{1,2}([^{}]*)\}\}/g;

export function segments(input: string): SpokenSegment[] {
  const out: SpokenSegment[] = [];
  const plain = (s: string) => {
    // Leftover braces are a broken marker (for example a cut-off pair): show the words, drop the braces.
    const broken = /\{\{|\}\}/.test(s);
    let t = s.replace(/\{\{|\}\}/g, "");
    if (broken) t = t.replace(/\|/g, " ");
    if (t) out.push({ text: t });
  };
  let last = 0;
  for (const m of input.matchAll(PAIR)) {
    const start = m.index ?? 0;
    plain(input.slice(last, start));
    const shown = m[1].trim();
    const said = m[2].trim();
    if (shown && said) out.push({ text: shown, said });
    else if (shown) out.push({ text: shown });
    else if (said) out.push({ text: said });
    last = start + m[0].length;
  }
  plain(input.slice(last));
  return out;
}

/** The correct, displayable text: markers resolved to their `shown` side. */
export function displayText(input: string): string {
  return segments(input).map((s) => s.text).join("");
}

/**
 * What the voice should read. Marked fragments use the model's own pronunciation;
 * everything else goes through `adapt` (the rule-based respelling).
 */
export function renderSpoken(input: string, adapt: (s: string) => string = (s) => s): string {
  return segments(input)
    .map((s) => (s.said !== undefined ? ` ${s.said} ` : adapt(s.text)))
    .join("")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:…])/g, "$1")
    .trim();
}

/** Clamp to `max` characters without leaving half a marker behind. */
export function clampSpeech(input: string, max: number): string {
  let t = input.trim().slice(0, max);
  if (t.lastIndexOf("{{") > t.lastIndexOf("}}")) t = t.slice(0, t.lastIndexOf("{{"));
  return t.trim();
}
