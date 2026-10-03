import { FormEvent, KeyboardEvent, useEffect, useRef } from "react";
import { ArrowUp, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUGGESTED_QUESTIONS, type ChatMessage } from "@/lib/lesson";
import { cn } from "@/lib/utils";

export function ChatPanel({
  messages,
  loading,
  onSend,
}: {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (question: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  function submitFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = String(data.get("question") ?? "").trim();
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
    <aside className="flex h-[42dvh] min-h-[260px] w-full shrink-0 flex-col bg-ink text-ink-foreground lg:h-auto lg:min-h-0 lg:w-[380px] lg:shrink-0">
      <div className="border-b border-ink-foreground/10 px-5 py-4">
        <p className="text-xs font-medium tracking-wide text-ink-foreground/55 uppercase">
          Suhbat
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Savolingizni yozing</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-foreground/65">
          Grammatika savolini bering — javob daftarga chiziladi.
        </p>
      </div>

      <div
        ref={listRef}
        className="chat-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words",
                message.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : message.error
                    ? "rounded-bl-md bg-danger/15 text-ink-foreground"
                    : "rounded-bl-md bg-ink-foreground/8 text-ink-foreground",
              )}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-ink-foreground/8 px-3.5 py-2.5 text-sm text-ink-foreground/80">
              <LoaderCircle className="size-4 animate-spin" />
              <span className="shimmer bg-clip-text text-transparent">
                O'qituvchi o'ylamoqda...
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <Button
            key={q}
            type="button"
            size="chip"
            variant="ghost"
            disabled={loading}
            onClick={() => onSend(q)}
            className="shrink-0 border border-ink-foreground/12 bg-ink-foreground/6 text-ink-foreground hover:bg-ink-foreground/12"
          >
            {q}
          </Button>
        ))}
      </div>

      <form
        onSubmit={submitFromForm}
        className="border-t border-ink-foreground/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <label className="sr-only" htmlFor="question">
          Yana so'rang
        </label>
        <div className="flex items-end gap-2 rounded-2xl bg-ink-foreground/8 p-1.5 pl-3 shadow-[inset_0_0_0_1px_rgba(243,238,228,0.08)]">
          <textarea
            ref={inputRef}
            id="question"
            name="question"
            rows={1}
            placeholder="Yana so'rang..."
            disabled={loading}
            onKeyDown={onKeyDown}
            onInput={(event) => {
              const el = event.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
            className="max-h-28 min-h-11 w-full resize-none bg-transparent py-2.5 text-sm leading-relaxed text-ink-foreground outline-none placeholder:text-ink-foreground/40"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading}
            className="size-11 shrink-0 rounded-xl"
            aria-label="Yuborish"
          >
            {loading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <ArrowUp className="size-4" />
            )}
          </Button>
        </div>
      </form>
    </aside>
  );
}
