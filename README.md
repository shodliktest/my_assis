# Daftar

Interactive Uzbek-English grammar tutor built with React, TanStack Start, Vite and Nitro for Vercel.

## Features
- Full and short AI lessons
- Groq AI with xAI/Grok fallback
- Animated notebook/whiteboard interface
- Teacher-pencil animation
- Uzbek + English text-to-speech
- Installable PWA manifest and iOS install helper
- Responsive mobile/desktop interface

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set `GROQ_API_KEY` in `.env`. `XAI_API_KEY` is optional.

## Vercel

Import this repository into Vercel. The project uses Vite + TanStack Start + Nitro with the Vercel preset. Add the environment variables in Vercel Project Settings.

PWA manifest: `/manifest.webmanifest`.
Install helper: `/?install=1`.
