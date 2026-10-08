import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { BoardThemeMenu } from "@/components/board-theme-menu";
import { NotebookBoard } from "@/components/notebook-board";
import { PlayerBar } from "@/components/player-bar";
import type { PencilMood } from "@/components/tutor-pencil";
import { BOARD_THEME_KEY, DEFAULT_BOARD_THEME, isBoardTheme, type BoardTheme } from "@/lib/board-theme";
import { explainQuestion } from "@/lib/explain";
import {
  EMPTY_LESSON,
  PAGE,
  PAGE_H,
  PENCIL_COLORS,
  appendLesson,
  lessonPageSize,
  nextPencilColor,
  toPageLesson,
  type AnswerMode,
  type DrawItem,
  type Lesson,
  type PencilColorId,
} from "@/lib/lesson";
import {
  estimateSpeechMs,
  initTutorVoiceFromStorage,
  installAudioUnlock,
  setTutorVoice,
  speakText,
  speechWaitCapMs,
  stopSpeech,
} from "@/lib/speech";
import { installBrowserMeasurer } from "@/lib/text-measure";
import { type TutorVoiceId } from "@/lib/tts-phonetics";
import { wait, cn } from "@/lib/utils";

const COLOR_KEY = "daftar-pencil-color";
const MODE_KEY = "daftar-answer-mode";

function itemDuration(item: DrawItem) {
  if (item.kind === "box" || item.kind === "formula" || item.kind === "callout") return 900;
  if (item.kind === "table") return 1100;
  if (item.kind === "rule" || item.kind === "strike" || item.kind === "highlight") return 420;
  if (item.kind === "arrow" || item.kind === "circle") return 640;
  if (item.kind === "check" || item.kind === "cross" || item.kind === "number") return 480;
  if (item.kind === "icon" || item.kind === "badge" || item.kind === "chips") return 520;
  if (item.kind === "title") return 1100;
  if (item.kind === "flow") return 600 + 260 * Math.min(5, item.chips?.length ?? 3);
  if (item.kind === "bars") return 1200;
  if (item.kind === "graph") return 2200;
  if (item.kind === "code") return 500 + 220 * Math.min(14, (item.text ?? "").split("\n").length);
  if (item.kind === "timeline" || item.kind === "icons") return 500 + 380 * Math.min(5, item.rows?.length ?? 3);
  const len = item.text?.length ?? 12;
  return Math.min(1600, Math.max(520, len * 28));
}

function tipFor(item: DrawItem, progress: number) {
  if (item.kind === "box" || item.kind === "formula" || item.kind === "callout" || item.kind === "table") {
    const w = item.w ?? 200;
    const h = item.h ?? 80;
    const peri = 2 * (w + h);
    const d = progress * peri;
    if (d < w) return { x: item.x + d, y: item.y };
    if (d < w + h) return { x: item.x + w, y: item.y + (d - w) };
    if (d < 2 * w + h) return { x: item.x + w - (d - w - h), y: item.y + h };
    return { x: item.x, y: item.y + h - (d - 2 * w - h) };
  }
  if (item.kind === "flow" || item.kind === "bars" || item.kind === "graph" || item.kind === "code" || item.kind === "timeline" || item.kind === "icons") {
    return { x: item.x + (item.w ?? 400) * progress, y: item.y + (item.h ?? 60) / 2 };
  }
  if (item.kind === "arrow") {
    const x2 = item.x2 ?? item.x + (item.w ?? 80);
    const y2 = item.y2 ?? item.y;
    return { x: item.x + (x2 - item.x) * progress, y: item.y + (y2 - item.y) * progress };
  }
  const w =
    item.kind === "rule" || item.kind === "strike" || item.kind === "highlight"
      ? (item.w ?? 200)
      : Math.min(520, (item.text?.length ?? 10) * 11);
  return { x: item.x + w * progress, y: item.y + (item.kind === "title" ? 18 : 14) };
}

export function AppShell() {
  const playGen = useRef(0);
  const voiceRef = useRef(true);
  const pausedRef = useRef(false);
  const modeRef = useRef<AnswerMode>("full");
  const lessonRef = useRef<Lesson>(EMPTY_LESSON);
  const loadingRef = useRef(false);

  const [voiceOn, setVoiceOn] = useState(true);
  const [tutorVoice, setTutorVoiceState] = useState<TutorVoiceId>("shukrona");
  const [mode, setMode] = useState<AnswerMode>("full");
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [mood, setMood] = useState<PencilMood>("idle");
  const [caption, setCaption] = useState("");
  const [title, setTitle] = useState(EMPTY_LESSON.title);
  const [lesson, setLesson] = useState<Lesson>(EMPTY_LESSON);
  const [visible, setVisible] = useState<DrawItem[]>([]);
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [drawProgress, setDrawProgress] = useState(0);
  const [character, setCharacter] = useState({ x: 320, y: 640 });
  const [beatIndex, setBeatIndex] = useState(0);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [shareNote, setShareNote] = useState("");
  const [colorId, setColorId] = useState<PencilColorId>("sun");
  const [theme, setTheme] = useState<BoardTheme>(DEFAULT_BOARD_THEME);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLOR_KEY) as PencilColorId | null;
      if (saved && PENCIL_COLORS.some((c) => c.id === saved)) setColorId(saved);
      const savedTheme = localStorage.getItem(BOARD_THEME_KEY);
      if (isBoardTheme(savedTheme)) setTheme(savedTheme);
      const savedMode = localStorage.getItem(MODE_KEY);
      if (savedMode === "short" || savedMode === "full") {
        setMode(savedMode);
        modeRef.current = savedMode;
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Measure text with the real handwriting font so boxes hug their text.
  useEffect(() => {
    void installBrowserMeasurer();
  }, []);

  // iOS/Safari: unlock audio on the first tap so lesson speech can start later.
  useEffect(() => installAudioUnlock(), []);

  useEffect(() => {
    voiceRef.current = voiceOn;
    if (!voiceOn) {
      stopSpeech();
      setSpeaking(false);
    }
  }, [voiceOn]);

  useEffect(() => {
    initTutorVoiceFromStorage();
    try {
      const v = window.localStorage.getItem("daftar.tutorVoice");
      if (v === "saidumar" || v === "shukrona") {
        setTutorVoiceState(v);
        setTutorVoice(v);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const changeMode = useCallback((next: AnswerMode) => {
    setMode(next);
    modeRef.current = next;
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const changeTheme = useCallback((next: BoardTheme) => {
    setTheme(next);
    try {
      localStorage.setItem(BOARD_THEME_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const recolor = useCallback(() => {
    setColorId((id) => {
      const next = nextPencilColor(id);
      try {
        localStorage.setItem(COLOR_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const animateItem = useCallback(async (item: DrawItem, gen: number) => {
    setDrawingId(item.id);
    setMood("write");
    const duration = itemDuration(item);
    let elapsed = 0;
    let last = performance.now();
    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        if (playGen.current !== gen) {
          resolve();
          return;
        }
        if (pausedRef.current) {
          last = now;
          requestAnimationFrame(tick);
          return;
        }
        elapsed += now - last;
        last = now;
        const t = Math.min(1, elapsed / duration);
        setDrawProgress(t);
        const tip = tipFor(item, t);
        setCharacter({
          x: Math.min(PAGE.w - 70, Math.max(8, tip.x - 40)),
          y: Math.max(8, tip.y - 160),
        });
        if (t >= 1) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    if (playGen.current !== gen) return;
    setVisible((prev) => (prev.some((p) => p.id === item.id) ? prev : [...prev, item]));
    setDrawingId(null);
    setDrawProgress(1);
  }, []);

  const playLesson = useCallback(
    async (nextLesson: Lesson, fromBeat = 0) => {
      const gen = ++playGen.current;
      pausedRef.current = false;
      lessonRef.current = nextLesson;
      setLesson(nextLesson);
      setTitle(nextLesson.title);
      setPlaying(true);
      setPlanning(false);
      const keep = nextLesson.beats.slice(0, fromBeat).flatMap((b) => b.items);
      setVisible(keep);
      setDrawingId(null);
      setCaption("");

      for (let i = fromBeat; i < nextLesson.beats.length; i++) {
        if (playGen.current !== gen) return;
        while (pausedRef.current) {
          if (playGen.current !== gen) return;
          await wait(80);
        }
        const beat = nextLesson.beats[i];
        setBeatIndex(i + 1);
        setCaption(beat.caption);
        setMood("write");

        let speechDone = Promise.resolve();
        if (voiceRef.current) {
          speechDone = speakText(beat.speech, {
            onSpeaking: (value) => {
              if (playGen.current === gen) setSpeaking(value);
            },
          }).finally(() => {
            if (playGen.current === gen) setSpeaking(false);
          });
        }

        for (const item of beat.items) {
          if (playGen.current !== gen) return;
          while (pausedRef.current) {
            if (playGen.current !== gen) return;
            await wait(80);
          }
          await animateItem(item, gen);
        }

        if (!voiceRef.current) {
          await wait(Math.min(1400, estimateSpeechMs(beat.speech) * 0.25));
        } else {
          // Let the voice finish; the cap only guards against a speech engine that never reports "ended".
          await Promise.race([speechDone, wait(speechWaitCapMs(beat.speech))]);
        }
      }

      if (playGen.current === gen) {
        setPlaying(false);
        setMood("idle");
        setSpeaking(false);
        setBeatIndex(nextLesson.beats.length);
      }
    },
    [animateItem],
  );

  const sendQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || loadingRef.current) return;
      loadingRef.current = true;
      // A follow-up continues the same board, below what is already there.
      const base = lessonRef.current;
      const continuing = base.beats.length > 0;
      playGen.current += 1;
      stopSpeech();
      setLoading(true);
      setPlanning(true);
      setPlaying(false);
      setSpeaking(false);
      setDrawingId(null);
      if (!continuing) setVisible([]);
      setCaption(
        modeRef.current === "full"
          ? "To‘liq darsni tayyorlayapman…"
          : "Qisqa javobni rejalashtiryapman…",
      );
      setMood("think");
      if (!continuing) setCharacter({ x: 310, y: 420 });

      try {
        const result = await explainQuestion({
          data: { question: trimmed, mode: modeRef.current },
        });
        if (!result.ok) {
          setCaption(result.error);
          setMood("idle");
          setPlanning(false);
          return;
        }
        // Measure with the real font before laying the lesson out.
        await installBrowserMeasurer();
        const laid = toPageLesson(result.lesson, PAGE_H[result.mode]);
        const merged = continuing ? appendLesson(base, laid) : laid;
        await playLesson(merged, continuing ? base.beats.length : 0);
      } catch {
        setCaption("Tarmoq xatosi yuz berdi. Birozdan so'ng qayta urinib ko'ring.");
        setMood("idle");
        setPlanning(false);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [playLesson],
  );

  /** Wipes the board and starts a fresh one. */
  const newBoard = useCallback(() => {
    playGen.current += 1;
    stopSpeech();
    lessonRef.current = EMPTY_LESSON;
    setLesson(EMPTY_LESSON);
    setTitle(EMPTY_LESSON.title);
    setVisible([]);
    setDrawingId(null);
    setDrawProgress(0);
    setPlaying(false);
    setPlanning(false);
    setSpeaking(false);
    setMood("idle");
    setCaption("");
    setBeatIndex(0);
    setCharacter({ x: 320, y: 640 });
  }, []);

  function togglePlay() {
    if (!lesson.beats.length) return;
    if (playing) {
      pausedRef.current = true;
      setPlaying(false);
      stopSpeech();
      setSpeaking(false);
      setMood("idle");
      return;
    }
    if (beatIndex >= lesson.beats.length) {
      void playLesson(lesson, 0);
      return;
    }
    pausedRef.current = false;
    void playLesson(lesson, Math.max(0, beatIndex - 1));
  }

  async function share() {
    const text = `${lesson.title} — Daftar`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Daftar", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareNote("Nusxa olindi");
      window.setTimeout(() => setShareNote(""), 1600);
    } catch {
      /* user cancelled */
    }
  }

  const allItems = useMemo(
    () =>
      visible.concat(
        drawingId ? lesson.beats.flatMap((b) => b.items).filter((i) => i.id === drawingId) : [],
      ),
    [visible, drawingId, lesson],
  );

  const page = useMemo(() => lessonPageSize(lesson, PAGE_H[mode]), [lesson, mode]);
  const empty = !planning && lesson.beats.length === 0 && visible.length === 0;

  return (
    <div className={cn("flex h-dvh min-h-0 flex-col bg-bg text-fg", theme === "chalk" && "app-chalk")}>
      <header className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-2xl bg-ink text-ink-foreground">
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path d="M9 3h6l1.2 3H20v2.2l-8 15.8L4 8.2V6h3.8L9 3z" fill="#E8B923" />
              <path d="M12 21 8.4 13h7.2L12 21z" fill="#2A241C" />
            </svg>
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight">Daftar</h1>
            <p className="truncate text-xs text-muted">Qalam og‘zi faqat ovozda qimirlaydi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {shareNote ? <p className="text-xs font-medium text-primary">{shareNote}</p> : null}
          <button
            type="button"
            className="icon-btn"
            aria-label="Yangi doska"
            title="Yangi doska"
            disabled={empty && !planning}
            onClick={newBoard}
          >
            <Eraser aria-hidden="true" />
          </button>
          <BoardThemeMenu theme={theme} onChange={changeTheme} />
          <div className="mode-toggle" role="group" aria-label="Javob hajmi">
            <button
              type="button"
              className={cn(mode === "short" && "is-on")}
              aria-pressed={mode === "short"}
              onClick={() => changeMode("short")}
            >
              Qisqa
            </button>
            <button
              type="button"
              className={cn(mode === "full" && "is-on")}
              aria-pressed={mode === "full"}
              onClick={() => changeMode("full")}
            >
              To‘liq
            </button>
          </div>
        </div>
      </header>

      <NotebookBoard
        items={allItems}
        drawingId={drawingId}
        drawProgress={drawProgress}
        character={character}
        mood={mood}
        speaking={speaking}
        colorId={colorId}
        onRecolor={recolor}
        planning={planning}
        empty={empty}
        page={page}
        theme={theme}
      />

      <PlayerBar
        title={empty ? "Savol bering" : title}
        step={beatIndex}
        total={lesson.beats.length}
        playing={playing}
        voiceOn={voiceOn}
        tutorVoice={tutorVoice}
        caption={caption}
        loading={loading}
        empty={empty}
        onTogglePlay={togglePlay}
        onReplay={() => {
          if (lesson.beats.length) void playLesson(lesson, 0);
        }}
        onToggleVoice={() => setVoiceOn((v) => !v)}
        onTutorVoice={(id) => {
          setTutorVoiceState(id);
          setTutorVoice(id);
        }}
        onShare={() => void share()}
        onOpenSteps={() => setStepsOpen(true)}
        onSend={(q) => void sendQuestion(q)}
      />

      {stepsOpen ? (
        <div className="sheet-scrim" onClick={() => setStepsOpen(false)}>
          <div
            className="sheet-panel"
            role="dialog"
            aria-label="Qadamlar"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-base font-semibold">Qadamlar</h2>
              <button type="button" className="text-sm text-muted" onClick={() => setStepsOpen(false)}>
                Yopish
              </button>
            </div>
            {lesson.beats.length ? (
              <ol className="space-y-2 px-4 pb-6">
                {lesson.beats.map((beat, i) => (
                  <li key={beat.id}>
                    <button
                      type="button"
                      className="w-full rounded-xl bg-paper px-3.5 py-3 text-left text-sm shadow-[var(--shadow-border)]"
                      onClick={() => {
                        setStepsOpen(false);
                        void playLesson(lesson, i);
                      }}
                    >
                      <span className="mr-2 tabular-nums text-muted">{i + 1}.</span>
                      {beat.caption}
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-5 pb-8 text-sm text-muted">Avval savol yozing — qadamlar shu yerda chiqadi.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
