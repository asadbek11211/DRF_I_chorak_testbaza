# DRF ACADEMY — Masofaviy hostingga joylash qo‘llanmasi

## 1. Supabase bazasini sozlash (barcha o‘quvchilar va natijalar umumiy ko‘rinishi uchun)
1. [supabase.com](https://supabase.com) da bepul loyiha yarating.
2. **SQL Editor** bo‘limida `supabase_schema.sql` faylidagi kodni ishga tushiring (`drf_users` va `drf_attempts` jadvallari + ruxsatlar yaratiladi).
3. **Settings -> API** bo‘limidan `Project URL` va `anon public` kalitni nusxalab oling.

## 2. Vercel yoki Netlify ga joylash
1. Loyihani GitHub repozitoriyga yuklang.
2. [vercel.com](https://vercel.com) (yoki [netlify.com](https://netlify.com)) da repozitoriyni ulang.
3. **Environment Variables** bo‘limiga quyidagi 2 ta o‘zgaruvchini kiriting:
   - `VITE_SUPABASE_URL` = Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = Supabase Anon Public Key
4. **Deploy** tugmasini bosing.

Endi istalgan o‘quvchi o‘z telefoni yoki kompyuteridan ro‘yxatdan o‘tganda va test ishlaganda, barcha ma’lumotlar avtomatik Supabase ga tushadi va **Mentor panelida** jonli ko‘rinadi!

## Standart Mentor kirishi
- Login: `mentor`
- Parol: `mentor2026`
