# Daftar

O‘zbekcha interaktiv o‘quv daftari. Savol yozing — qalam-o‘qituvchi doskada chizib, ovozda tushuntiradi
(ovoz: **Shukrona** — qiz, **Saidumar** — erkak).

## 1. GitHub ga yuklash

1. Yangi **bo‘sh** repo oching (README / license / .gitignore qo‘shmang).
2. Zip ichidagi `daftar/` papka **ichidagi** fayllarni repo ildiziga qo‘ying (`package.json` ildizda bo‘lishi shart).
3. Push:

```bash
git init
git add .
git commit -m "Daftar: Vercel-ready"
git branch -M main
git remote add origin https://github.com/<USER>/<REPO>.git
git push -u origin main
```

`.env` fayllari `.gitignore` da — kalitlar GitHub ga chiqmaydi.

## 2. Vercel ga deploy

1. [vercel.com](https://vercel.com) → **Add New → Project** → GitHub repo ni import qiling.
2. Hech narsani o‘zgartirmang: `vercel.json` Framework = **Other**, Install = `npm install --omit=dev`, Build = `npm run build` ni o‘zi belgilaydi.
   Nitro (`preset: vercel`) `.vercel/output` ni o‘zi yaratadi. Node **22**.
3. **Environment Variables** (Production + Preview):

| Nom | Majburiy | Izoh |
|---|---|---|
| `GROQ_API_KEY` | Ha | [console.groq.com](https://console.groq.com) dan. AI dars shu kalit bilan ishlaydi. |
| `GROQ_API_KEY1` … `GROQ_API_KEY10` | Yo‘q | Har so‘rov boshqa kalitdan boshlanadi (yuk bir tekis taqsimlanadi). Kalit 429 bersa u model bilan `retry-after` muddatiga chetga olinadi, 401/403 bersa kalit 10 daqiqaga o‘chiriladi. **Muhim:** Groq limiti *organization* (akkaunt) bo‘yicha, kalit bo‘yicha emas — bitta akkauntdan olingan 10 ta kalit limitni oshirmaydi; har bir kalit alohida akkauntdan bo‘lsa, limitlar qo‘shiladi. |
| `GROQ_TPM_LIMIT` | Yo‘q | Groq bir so‘rovda ruxsat beradigan token chegarasi (bepul tarifda 8000). Qo‘ysangiz, javob uzunligi so‘rovdan oldin shunga moslanadi. Qo‘ymasangiz, Groq 413 (“Request too large”) qaytarganda tizim o‘zi moslaydi va chegarani eslab qoladi. Pullik tarifda katta qiymat qo‘ying (masalan `250000`) — to‘liq darslar uzunroq chiqadi. |
| `GROQ_MODELS` | Yo‘q | Vergul bilan model ro‘yxati (kod o‘zgartirmasdan modelni almashtirish uchun). |
| `GROQ_PARALLEL` | Yo‘q | To‘liq darsni **ikki so‘rovga** bo‘ladi: asosiy qism (nazariya) va amaliy qism (qizil ruchka bilan xatolarni tuzatish, nozik joylar, mini-test) bir vaqtda, **turli kalitlarda**. Kamida 2 ta kalit bo‘lsa o‘zi yoqiladi; `0` / `off` — o‘chirish, `1` / `on` — bitta kalit bilan ham majburan yoqish. Amaliy qism xato bersa ham dars baribir chiqadi (jimgina). **Diqqat:** bitta darsga ikki baravar token ketadi, kunlik limit tezroq tugaydi; bitta akkauntdan olingan kalitlar limitni bo‘lishadi — ular uchun paralel rejim tezlikni oshiradi, limitni emas. |
| `XAI_API_KEY`, `XAI_MODEL` | Yo‘q | Groq umuman ishlamasa zaxira. |
| `VITE_SITE_URL` | Yo‘q | Telegram/X havola rasmi uchun asosiy manzil. Vercel da avtomatik; faqat o‘z domeningiz bo‘lsa yozing. |

4. **Deploy**. Kalit qo‘yilmasa faqat ichki Present Simple / Present Continuous namunalari ishlaydi.

Kalitni keyin qo‘shsangiz: Settings → Environment Variables → **Redeploy**.

## 3. Lokal ishga tushirish

```bash
cp .env.example .env     # GROQ_API_KEY ni yozing
npm install
npm run dev              # http://localhost:8080
npm run build            # Vercel dagi bilan bir xil build
npm test                 # birlik testlar
npm run typecheck
```

## 4. Qanday ishlaydi

- `POST /api/explain` — savol → Groq (avval eng yaxshi model barcha kalitlar bilan, keyin keyingi model → xAI) → JSON dars. Umumiy vaqt byudjeti **50 s**
  (funksiya limiti 60 s), shuning uchun sekin provayder 504 bermaydi. Model javobi uzun/noaniq bo‘lsa ham
  kesib-tuzatib olinadi (`src/lib/explain-sanitize.ts`), rad etilmaydi.
- `POST /api/tts` — Microsoft Edge neyron ovozi (Madina / Sardor), uzun matn gap chegarasida bo‘linadi, 3 ta parallel.
  Vaqtincha xatoda bir marta qayta uriniladi. Zaxira faqat qurilmaning **haqiqiy o‘zbek** ovozi (turk va boshqa tillar
  ovozi hech qachon ishlatilmaydi); o‘zbek ovozi bo‘lmasa dars ovozsiz davom etadi va sababi ko‘rsatiladi.
  Pleyerdagi “Ovoz” qatorida qaysi ovoz haqiqatan gapirayotgani yozib turiladi: yashil — Microsoft ovozi, sariq — zaxira
  qurilma ovozi, qizil — ovoz ulanmadi (sababi bilan). Yonida `v…` — deploy raqami (`src/lib/build-info.ts`).
  Pauza/o‘chirish ovozni darhol to‘xtatadi (Microsoft ovozi ham, qurilma ovozi ham).
- `GET /api/tts` — sog‘liq tekshiruvi: Microsoft ovozidan “Salom” ni jonli so‘raydi va `{ok, engine, ms, bytes, build}` qaytaradi
  (xatoda 502 va sababi). Deploydan keyin brauzerda `https://<domen>/api/tts` ni oching: `ok:true` bo‘lsa Vercel Microsoft
  ovoziga yeta oladi. Daqiqasiga 6 ta so‘rov bilan cheklangan.
- AI promti: `src/lib/explain-prompt.ts`. Barcha fanlar uchun alohida dars rejasi bor (biologiya, kimyo, matematika, fizika,
  ona tili, adabiyot, tarix, falsafa, geografiya, informatika, dasturlash, mantiq, chet tili). Model avval `plan` yozadi
  (savolni qanday tushundi, qanday taxmin qildi, qaysi chizma kerak), keyin darsni tuzadi. Matematik/hisob savollarida
  qo‘shimcha qoidalar qo‘shiladi va model chuqurroq fikrlaydi (`reasoning_effort: medium`).
- Professor rejimi (“To‘liq”): har fikr “nima → nega → qanday → misol → istisno” tartibida ochiladi, qoida ishlangan misolda
  qadamma-qadam ko‘rsatiladi, istisnolar aytiladi. **Qizil ruchka** (`fix` elementi): qalam gapni yozadi, so‘ng xatoni qizil
  chiziq bilan o‘chiradi va to‘g‘risini tepasiga yashil yozadi; ovozda qoida tushuntiriladi. Belgilanishi `[[xato>>to‘g‘ri]]`:
  almashtirish `She [[go>>goes]] to school.`, yetishmagan so‘z `I [[>>am]] happy.`, ortiqcha so‘z `He [[is>>]] plays.`
  Grammatikadan tashqari hisob qatori, kod va faktlar ham shunday tuzatiladi. Foydalanuvchi o‘z matnini berib “tekshir /
  to‘g‘rila / check my …” desa, matn aynan ko‘chiriladi va xatolari shu usulda belgilanadi (`src/lib/fix-markup.ts`).
- Doska chizmalari: `flow` (zanjir), `icons` (rasmli bosqichlar, o‘q bilan), `timeline` (vaqt chizig‘i), `bars` (ustunli diagramma),
  `graph` (koordinata grafigi: funksiya, nuqtalar, siniq chiziq, aylana), `code` (kod), `table`, `chips`, `callout`, `formula`.
  Chizma va izoh yonma-yon ustunlarda joylashadi (`box` ga `side:"left"|"right"`). Joylashtirish: `src/lib/layout-metrics.ts` va
  `stabilizeLessonLayout` — hamma o‘lcham pikselda, matn qatorlari soniga qarab hisoblanadi, sahifa kerak bo‘lganicha cho‘ziladi. Grafikda model faqat formulani beradi
  (`(x-10)^2-10`), egri chiziqni brauzer o‘zi chizadi (`math-expr.ts` — `eval`siz xavfsiz hisoblagich; `graph-plot.ts`).
- Ovoz: faqat o‘zbek ovozlari (Shukrona, Saidumar). Inglizcha so‘z/gaplar promtda `{{to‘g‘ri yozuv|talaffuz}}` ko‘rinishida
  yoziladi, masalan `{{I am work|ay em vork}}`: doskada va matnda **to‘g‘ri inglizcha** ko‘rinadi, ovozga esa o‘zbek
  harflaridagi talaffuz (“ay em vork”) boradi (`src/lib/spoken.ts`). Model belgilamay qoldirgan so‘zlarga eski qoidali
  moslash (`tts-phonetics.ts`) zaxira bo‘lib ishlaydi.
- Doska: balandligi cheksiz, savollar bir doskada ketma-ket davom etadi (keyingi savol oldingisining **tagidan** yoziladi, hech
  narsa ustiga yozilmaydi; qadam hisobi umumiy). Kamera qalamni kuzatadi; barmoq/g‘ildirak bilan siljitsangiz to‘xtaydi va
  “Kuzatish” tugmasi qaytaradi. Sarlavhadagi tugmalar: “Yangi doska” (tozalash) va fon tanlash — Toza, Nuqtali, Katak,
  Chiziqli, Doska (qora doska; tanlov saqlanadi).
- Qutilar faqat ichidagi matnga mos: matn shriftning haqiqiy kengligi bilan o‘lchanadi (`src/lib/text-measure.ts`,
  `layout-metrics.ts`), shuning uchun qator va qutilar ustma-ust tushmaydi.
- Foydalanuvchi savolda bergan raqam/ro‘yxat/kod o‘zgarmasdan chiziladi. Promtdagi namunalar testda haqiqiy sanitayzer va
  joylashtirish bilan tekshiriladi (`npm test`).
- Hozircha chizilmaydi: geometrik shakllar (uchburchak), molekula tuzilishi, xarita. Ular jadval/zanjir/matn bilan beriladi.
- Ichki namuna darslar (Present Simple/Continuous) faqat AI ishlamasa **va** savol aynan shu mavzu bo‘lsagina chiqadi.
- iPhone/Safari: audio birinchi bosishda “ochiladi”, shuning uchun dars ovozi keyin ham chiqadi.
- Himoya: bir saytdan tashqari so‘rovlar rad etiladi, har IP uchun daqiqasiga limit (har funksiya nusxasida alohida —
  qat’iy global limit kerak bo‘lsa Vercel Firewall rate limit qo‘shing).
- Auth/DB kodi (`src/lib/auth`, `src/lib/db.ts`) o‘chirilgan holatda (`VITE_AUTH_ENABLED=false`,
  `.grok/app-env.json`); `DATABASE_URL` kerak emas.

## 5. Muammolar

| Belgi | Sabab / yechim |
|---|---|
| “AI kaliti ulanmagan” | `GROQ_API_KEY` yo‘q yoki deploydan keyin qo‘shilgan — Redeploy qiling. |
| “So‘rovlar ko‘payib ketdi” | Groq limiti (429). Bepul tarifda limit organization bo‘yicha (taxminan 8K token/daqiqa, 200K token/kun — [Groq limitlari](https://console.groq.com/docs/rate-limits)). Boshqa akkauntlardan olingan kalitlarni `GROQ_API_KEY1…` ga qo‘shing yoki pullik tarifga o‘ting. |
| Ovoz yo‘q yoki boshqacha | Pleyerdagi “Ovoz” qatoriga qarang: yashil — Microsoft ovozi ishlayapti; sariq — Microsoft ulanmadi, qurilma ovozi; qizil — ovoz yo‘q (sababi yozilgan). Keyin `https://<domen>/api/tts` ni oching: `ok:false` bo‘lsa xato matni sababni ko‘rsatadi (Vercel → Logs → `[tts] synthesis failed`). Pleyerdagi `v…` raqami yangi deploy ishlayotganini tasdiqlaydi. Agar Microsoft Vercel IP manzillarini bloklasa, boshqa ovoz provayderi kerak bo‘ladi. |
| Dars qizil ruchka qismisiz chiqdi | Faqat bitta kalit bo‘lsa va javob uzunlik chegarasiga yetgan bo‘lsa shunday bo‘ladi: ikkinchi kalit qo‘shing (`GROQ_API_KEY1`) — amaliy qism alohida so‘rovda yoziladi. |
| Build xato | Vercel → Deployment → Build Logs ning oxirgi 30 qatorini yuboring. |

## Texnologiya

TanStack Start + Vite 8 + Nitro (Vercel preset) + React 19 + Tailwind v4.
