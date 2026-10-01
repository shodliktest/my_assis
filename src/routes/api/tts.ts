import { createFileRoute } from "@tanstack/react-router";
import { synthesizeParts, synthesizeUtterance } from "@/lib/edge-tts.server";

type TtsBody = {
  text?: string;
  voice?: string;
  lang?: string;
  parts?: { text?: string; voice?: string; lang?: string }[];
};

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: TtsBody = {};
        try {
          body = (await request.json()) as TtsBody;
        } catch {
          return Response.json({ error: "JSON kerak" }, { status: 400 });
        }
        try {
          const audio = body.parts?.length
            ? await synthesizeParts(
                body.parts.map((part) => ({
                  text: String(part.text ?? ""),
                  voice: part.voice,
                  lang: part.lang,
                })),
              )
            : await synthesizeUtterance(String(body.text ?? "").trim(), body.voice);
          const bytes = Uint8Array.from(audio);
          return new Response(bytes, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "no-store",
            },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Ovoz yaratilmadi";
          const status = message === "Matn bosh" || message === "Matn juda qisqa" ? 400 : 502;
          return Response.json({ error: message }, { status });
        }
      },
    },
  },
});
