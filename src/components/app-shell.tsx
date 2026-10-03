import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Eraser, Volume2, VolumeX } from "lucide-react";
import { ChatPanel } from "@/components/chat-panel";
import { NotebookBoard } from "@/components/notebook-board";
import { Button } from "@/components/ui/button";
import { explainQuestion } from "@/lib/explain";
import {
  DEMO_LESSON,
  DEMO_QUESTION,
  type BoardStep,
  type ChatMessage,
  type Lesson,
} from "@/lib/lesson";
import { speakUzbek, stopSpeech } from "@/lib/speech";
import { wait } from "@/lib/utils";

type Mood = "idle" | "think" | "point";

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AppShell() {
  const titleId = useId();
  const playGen = useRef(0);
  const voiceRef = useRef(true);

  const [voiceOn, setVoiceOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<BoardStep[]>([]);
  const [mood, setMood] = useState<Mood>("idle");
  const [character, setCharacter] = useState({ x: 88, y: 78 });
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "demo-user",
      role: "user",
      content: DEMO_QUESTION,
    },
  ]);

  useEffect(() => {
    voiceRef.current = voiceOn;
    if (!voiceOn) stopSpeech();
  }, [voiceOn]);

  const playLesson = useCallback(async (lesson: Lesson, speak: boolean) => {
    const gen = ++playGen.current;
    setSteps([]);
    setMood("point");
    setCharacter({ x: 18, y: 10 });
    if (speak && voiceRef.current) {
      speakUzbek(lesson.explanation);
    }

    for (const step of lesson.steps) {
      await wait(step.delay);
      if (playGen.current !== gen) return;
      setSteps((prev) => [...prev, step]);
      setCharacter({ x: step.x, y: step.y });
      setMood("point");
    }

    if (playGen.current === gen) {
      setMood("idle");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === "demo-assistant")) return prev;
        return [
          ...prev,
          {
            id: "demo-assistant",
            role: "assistant",
            content: DEMO_LESSON.explanation,
          },
        ];
      });
      void playLesson(DEMO_LESSON, true);
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [playLesson]);

  const sendQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || loading) return;

      playGen.current += 1;
      stopSpeech();
      setLoading(true);
      setMood("think");
      setMessages((prev) => [
        ...prev,
        { id: newId("u"), role: "user", content: trimmed },
      ]);

      try {
        const result = await explainQuestion({ data: { question: trimmed } });
        if (!result.ok) {
          setMessages((prev) => [
            ...prev,
            {
              id: newId("e"),
              role: "assistant",
              content: result.error,
              error: true,
            },
          ]);
          setMood("idle");
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: newId("a"),
            role: "assistant",
            content: result.lesson.explanation,
          },
        ]);
        await playLesson(result.lesson, true);
      } catch {
        const fallback =
          "Tarmoq xatosi yuz berdi. Birozdan so'ng qayta urinib ko'ring.";
        setMessages((prev) => [
          ...prev,
          {
            id: newId("e"),
            role: "assistant",
            content: fallback,
            error: true,
          },
        ]);
        setMood("idle");
      } finally {
        setLoading(false);
      }
    },
    [loading, playLesson],
  );

  function clearBoard() {
    playGen.current += 1;
    stopSpeech();
    setSteps([]);
    setMood("idle");
    setCharacter({ x: 88, y: 78 });
  }

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-bg text-fg">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-3 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative grid size-10 place-items-center rounded-2xl bg-ink">
            <span className="block size-5 rounded-full bg-ball shadow-[inset_-2px_-2px_0_rgba(255,255,255,0.12)]" />
          </span>
          <div className="min-w-0">
            <h1
              id={titleId}
              className="truncate text-base font-semibold tracking-tight sm:text-lg"
            >
              Daftar
            </h1>
            <p className="truncate text-xs text-muted sm:text-sm">
              Interaktiv o'quv doskasi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="min-w-11"
            aria-pressed={voiceOn}
            aria-label={voiceOn ? "Ovozni o'chirish" : "Ovozni yoqish"}
            onClick={() => setVoiceOn((v) => !v)}
          >
            {voiceOn ? <Volume2 /> : <VolumeX />}
            <span className="hidden sm:inline">
              {voiceOn ? "Ovoz yoqilgan" : "Ovoz o'chirilgan"}
            </span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="min-w-11"
            aria-label="Doskani tozalash"
            onClick={clearBoard}
          >
            <Eraser />
            <span className="hidden sm:inline">Tozalash</span>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col-reverse lg:flex-row">
        <ChatPanel
          messages={messages}
          loading={loading}
          onSend={(q) => void sendQuestion(q)}
        />
        <NotebookBoard steps={steps} character={character} mood={mood} />
      </div>
    </div>
  );
}
