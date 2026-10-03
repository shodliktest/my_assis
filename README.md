# Daftar — interaktiv o‘quv doskasi

Savol yozing (masalan, *Present Simple nima?*). Javob o‘zbekcha tushuntiriladi, o‘ng tomondagi daftarga bosqichma-bosqich chiziladi. Ovozni yoqib-o‘chirish mumkin.

## Imkoniyatlar

- Chat + notebook doska
- AI javobi JSON qadamlari bilan doskaga chiziladi
- Web Speech API orqali o‘zbekcha ovoz
- Birinchi ochilishda Present Simple namoyishi
- Mobilga mos layout

## Lokal ishga tushirish

1. Bog‘liqliklarni o‘rnating:

```bash
npm install
```

2. `.env.example` ni `.env` ga ko‘chirib, kalit qo‘ying:

```bash
cp .env.example .env
```

`.env` ichida:

```
GROQ_API_KEY=gsk_...
```

`GROQ_API_KEY` bo‘lmasa, muhitda `XAI_API_KEY` bo‘lsa u ishlatiladi.

3. Dev server:

```bash
npm run dev
```

Ilova `http://localhost:8080` da ochiladi.

## Github orqali Vercelga deploy

Loyiha Vercel (TanStack Start + Nitro) uchun tayyor.

### 1. Githubga yuklash

```bash
git init
git add .
git commit -m "Initial commit: Daftar app"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

### 2. Vercelda loyiha yaratish

1. [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Github repozitoriyangizni tanlang
3. **Environment Variables** bo‘limiga qo‘shing:
   - `GROQ_API_KEY` = sizning Groq kalitingiz  
     *(yoki `XAI_API_KEY`)*
4. Build sozlamalari avtomatik aniqlanadi (yoki qo‘lda):
   - **Install Command:** `npm install --omit=dev --no-audit --no-fund`
   - **Build Command:** `npm run build`
   - **Output:** Nitro/Vercel preset (avtomatik)
5. **Deploy** tugmasini bosing

### 3. Keyingi o‘zgarishlar

Github `main` branchiga push qilganingizda Vercel avtomatik qayta deploy qiladi.

### Ixtiyoriy: Postgres (Neon)

Agar haqiqiy Postgres kerak bo‘lsa (auth yoki saqlash uchun):

1. [neon.tech](https://neon.tech) da loyiha yarating
2. Connection string ni Vercel Environment Variables ga `DATABASE_URL` nomi bilan qo‘shing
3. Qayta deploy qiling — migratsiyalar avtomatik ishlaydi

`DATABASE_URL` bo‘lmasa ilova ichidagi PGLite (WASM Postgres) ishlatiladi — oddiy ishlatish uchun yetarli.

## Texnik stack

- TanStack Start (React + SSR)
- Vite 8 + Nitro (Vercel preset)
- Tailwind CSS 4
- Better Auth (ixtiyoriy)
- Groq / xAI LLM
