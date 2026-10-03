function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const rank = (v: SpeechSynthesisVoice) => {
    const lang = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    if (lang.startsWith("uz")) return 0;
    if (name.includes("uzbek")) return 1;
    if (lang.startsWith("tr")) return 2;
    if (lang.startsWith("ru")) return 3;
    if (name.includes("microsoft") && lang.startsWith("en")) return 4;
    return 8;
  };
  const sorted = [...voices].sort((a, b) => rank(a) - rank(b));
  return sorted[0] ?? null;
}

export function stopSpeech() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

export function speakUzbek(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const trimmed = text.trim();
  if (!trimmed) return;

  window.speechSynthesis.cancel();

  const speakNow = () => {
    const utter = new SpeechSynthesisUtterance(trimmed);
    utter.lang = "uz-UZ";
    utter.rate = 0.95;
    utter.pitch = 1;
    const voice = pickVoice(window.speechSynthesis.getVoices());
    if (voice) utter.voice = voice;
    window.speechSynthesis.speak(utter);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    speakNow();
    return;
  }

  const onVoices = () => {
    window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
    speakNow();
  };
  window.speechSynthesis.addEventListener("voiceschanged", onVoices);
  window.setTimeout(speakNow, 250);
}
