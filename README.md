# Daftar

O‘zbekcha interaktiv o‘quv daftari. Savol yozing — qalam-o‘qituvchi doskada chizib, ovozda tushuntiradi.

## GitHub ga yuklash

1. Yangi **bo‘sh** GitHub repo oching (README/license qo‘shmang).
2. Shu zip ni oching va ichidagi papkani repo ildiziga qo‘ying (`package.json` ildizda bo‘lishi shart).
3. Push:

```bash
git init
git add .
git commit -m "Initial commit: Daftar"
git branch -M main
git remote add origin https://github.com/<USER>/<REPO>.git
git push -u origin main
```

Zip ichida `node_modules`, `.vercel`, `.grok/skills` va 50MB+ dump **yo‘q**. Shular GitHub/Vercel ni buzardi.

## Vercel deploy

1. [vercel.com](https://vercel.com) → **Add New Project** → GitHub repostan import.
2. Framework Preset: **Other** (Nitro `vite build` o‘zi `.vercel/output` yozadi).
3. Build Command: `npm run build` (vercel.json da allaqachon bor).
4. Install Command: `npm install --no-audit --no-fund`.
5. **Environment Variables** qo‘shing (Production + Preview):

| Nom | Majburiy | Izoh |
|---|---|---|
| `GROQ_API_KEY` | Ha | [console.groq.com](https://console.groq.com) dan oling. AI dars shu kalit bilan ishlaydi. |
| `GROQ_API_KEY1` … `GROQ_API_KEY10` | Yo‘q | Rate-limit / 401 bo‘lsa navbatdagi kalit. |
| `XAI_API_KEY` | Yo‘q | Groq umuman ishlamasa zaxira. |
| `AZURE_SPEECH_KEY` | Tavsiya | Production TTS uchun Microsoft Speech kaliti. |
| `AZURE_SPEECH_REGION` | Tavsiya | Speech resource region, masalan `eastus`. |

Kalit qo‘yilmasa faqat ichki Present Simple / Present Continuous namunalari ishlaydi.

6. Deploy. Node **22**.

### Deploy da nima tuzatilgan

- Ichki 54MB zip, `.vercel/output`, preview loglar, screenshots olib tashlandi.
- Serverless function: Node 22, **60s** timeout (AI + TTS uchun).
- TTS `ws` paketi ESM import (Vercel bundle da `createRequire` ishlamasdi).
- TTS retry 60s dan oshmasligi uchun qisqartirildi; ovoz ishlamasa brauzer TTS ga tushadi.
- `DATABASE_URL` yo‘q — migratsiya skip, PGLite serverless ga tushmaydi.
- Build uchun kerakli `devDependencies` Vercel install vaqtida o‘rnatiladi.

## Lokal ishga tushirish

```bash
cp .env.example .env
# .env ga GROQ_API_KEY yozing
npm install
npm run dev
```

Brauzer: `http://localhost:8080`

```bash
npm run build      # Vercel bilan bir xil production build
npm run typecheck
```

## Texnologiya

TanStack Start + Vite + Nitro (Vercel preset) + React 19 + Tailwind v4.


## Production TTS

Productionda `AZURE_SPEECH_KEY` va `AZURE_SPEECH_REGION` berilsa, `/api/tts` Microsoft Azure Speech REST API orqali ishlaydi; Uzbek uchun `uz-UZ-MadinaNeural` va `uz-UZ-SardorNeural` ishlatiladi. Azure sozlanmagan bo‘lsa, mavjud Edge TTS fallback saqlanadi.

## Video-darajadagi dars oqimi

To‘liq rejim 10–15 ta qadamga mo‘ljallangan: har qadamda doska elementi, qalam animatsiyasi, caption va ovoz sinxron yuradi. Inglizcha misollar alohida English neural voice bilan, o‘zbekcha izohlar Uzbek neural voice bilan o‘qiladi.

### Vercel xavfsizlik yangilanishi

`@tanstack/react-start` 1.168.60 ga ko‘tarildi. Vercel logida ko‘rsatilgan 1.168.58 ogohlantirishini bartaraf etish uchun dependency yangilanishi va yangi install kerak.
