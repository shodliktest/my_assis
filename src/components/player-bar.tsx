import { FormEvent, KeyboardEvent, useRef } from "react";
import {
  ArrowUp,
  List,
  LoaderCircle,
  Pause,
  Play,
  RotateCcw,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUGGESTED_QUESTIONS } from "@/lib/lesson";
import { TUTOR_VOICES, type TutorVoiceId } from "@/lib/tts-phonetics";

export function PlayerBar({
  title,
  step,
  total,
  playing,
  voiceOn,
  tutorVoice,
  caption,
  loading,
  empty,
  onTogglePlay,
  onReplay,
  onToggleVoice,
  onTutorVoice,
  onShare,
  onOpenSteps,
  onSend,
}: {
  title: string;
  step: number;
  total: number;
  playing: boolean;
  voiceOn: boolean;
  tutorVoice: TutorVoiceId;
  caption: string;
  loading: boolean;
  empty?: boolean;
  onTogglePlay: () => void;
  onReplay: () => void;
  onToggleVoice: () => void;
  onTutorVoice: (id: TutorVoiceId) => void;
  onShare: () => void;
  onOpenSteps: () => void;
  onSend: (question: string) => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const ratio = total === 0 ? 0 : Math.min(1, step / total);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const value = String(new FormData(form).get("question") ?? "").trim();
    if (!value || loading) return;
    onSend(value);
    form.reset();
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.focus();
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <div className="player-wrap">
      {caption ? (
        <div className="caption-bubble" role="status">
          {caption}
        </div>
      ) : null}

      <div className="player-card">
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between gap-3 text-xs text-muted">
            <p className="min-w-0 truncate font-medium text-fg">{title}</p>
            <p className="shrink-0 tabular-nums">
              {step} / {total || 1}
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
        </div>


        <div className="flex items-center gap-1.5 px-3 pb-1 pt-2">
          <span className="text-[10px] uppercase tracking-wide text-muted">Ovoz</span>
          {(Object.keys(TUTOR_VOICES) as TutorVoiceId[]).map((id) => {
            const v = TUTOR_VOICES[id];
            const active = tutorVoice === id;
            return (
              <button
                key={id}
                type="button"
                disabled={loading}
                aria-pressed={active}
                onClick={() => onTutorVoice(id)}
                className={
                  active
                    ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                    : "rounded-full bg-paper px-3 py-1 text-xs text-fg shadow-[var(--shadow-border)]"
                }
                title={v.hint}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-1 px-2 py-2">
          <Button type="button" variant="ghost" size="icon" aria-label="Qadamlar" onClick={onOpenSteps}>
            <List />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Qayta o'ynash" onClick={onReplay}>
            <RotateCcw />
          </Button>
          <Button
            type="button"
            size="icon"
            className="size-14 rounded-full"
            aria-label={playing ? "Pauza" : "Davom ettirish"}
            onClick={onTogglePlay}
          >
            {playing ? <Pause /> : <Play />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-pressed={voiceOn}
            aria-label={voiceOn ? "Ovozni o'chirish" : "Ovozni yoqish"}
            onClick={onToggleVoice}
          >
            {voiceOn ? <Volume2 /> : <VolumeX />}
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Ulashish" onClick={onShare}>
            <Share2 />
          </Button>
        </div>

        {empty ? (
          <div className="flex flex-wrap gap-1.5 px-3 pb-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                className="rounded-full bg-paper px-3 py-1.5 text-xs text-fg shadow-[var(--shadow-border)]"
                onClick={() => onSend(q)}
              >
                {q}
              </button>
            ))}
          </div>
        ) : null}

        <form onSubmit={submit} className="border-t border-border p-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
          <label className="sr-only" htmlFor="question">
            Savolingizni yozing
          </label>
          <div className="flex items-end gap-2 rounded-2xl bg-paper px-3 py-1.5 shadow-[var(--shadow-border)]">
            <textarea
              ref={inputRef}
              id="question"
              name="question"
              rows={1}
              placeholder="Savolingizni yozing..."
              disabled={loading}
              onKeyDown={onKeyDown}
              onInput={(event) => {
                const el = event.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
              }}
              className="max-h-24 min-h-11 w-full resize-none bg-transparent py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted"
            />
            <Button type="submit" size="icon" disabled={loading} className="size-11 shrink-0 rounded-xl" aria-label="Yuborish">
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
