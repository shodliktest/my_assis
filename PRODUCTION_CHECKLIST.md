# Production checklist — Daftar

## Deploy
- [ ] GitHub repo root contains `package.json`.
- [ ] Vercel uses Node 22.
- [ ] `npm run build` succeeds.
- [ ] Vercel no longer reports the old TanStack Start warning.
- [ ] `GROQ_API_KEY` is configured.
- [ ] `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` are configured for production TTS.

## Quality
- [ ] Uzbek voice: Madina/Sardor.
- [ ] English examples use an English neural voice.
- [ ] 10–15 step full lessons render without overlap.
- [ ] Pencil animation follows each board item.
- [ ] Play / pause / replay / voice / share work on mobile.
- [ ] TTS failures fall back gracefully.

## Before public launch
- [ ] Add persistent database (Neon/Postgres) if user accounts/progress are enabled.
- [ ] Add server-side rate limiting for `/api/tts` and AI endpoints.
- [ ] Add durable TTS cache/object storage for high traffic.
- [ ] Add error monitoring and uptime monitoring.
- [ ] Add automated browser smoke tests against the Vercel preview.
