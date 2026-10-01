# Zoom + daftar o'lchami + fonetika heuristika

## Zoom
- Min **28%** (oldingi 55%), max **280%**
- Fit: avval **kenglik** bo'yicha (videodagidek butun daftar kengligi)
- Uzun sahifa — scroll; overview uchun 28% gacha kichraytirish mumkin

## Daftar o'lchami
- PAGE: **840 × 1680** (oldingi 720 × 1480)
- full mode balandlik: **3200**, max **4800**

## Fonetika
1. Lug'at (Python, Quiz, Present Continuous, …)
2. Heuristika: noma'lum inglizcha so'zlar uchun (`tion→shn`, `th→t`, `w→v`, …)

## Vercel TanStack XSS blok (2026-09-30)
`@tanstack/react-start` **1.168.60+** (CVE-2026-102989).
Agar hali eski lock bo'lsa, Vercel Environment Variable:
`DANGEROUSLY_DEPLOY_VULNERABLE_TANSTACK_START_XSS=1`
