# Ovoz: Shukrona / Saidumar + fonetik moslashtirish

## Tutor ovozlari
| UI nomi   | Edge TTS              | Tavsif        |
|-----------|-----------------------|---------------|
| Shukrona  | uz-UZ-MadinaNeural    | Qiz ovozi     |
| Saidumar  | uz-UZ-SardorNeural    | Erkak ovoz    |

Tanlov pastki panelda **Ovoz** qatorida. `localStorage` da saqlanadi.

## Fonetika (`tts-phonetics.ts`)
Inglizcha / texnik so'zlar Madina-Sardor uchun o'zbekcha talaffuzga o'giriladi
(masalan: Python → payton, Quiz → kuiz). **Ekrandagi matn o'zgarmaydi** — faqat TTS.

## Vercel
Qo'shimcha env kerak emas. `/api/tts` avvalgidek Edge WebSocket orqali ishlaydi.
