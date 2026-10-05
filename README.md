# Captionit

Videolarga avtomatik, so'zma-so'z animatsiyali subtitr qo'shadigan mobil ilova (Captions ilovasiga o'xshash).

```
mobile/   Expo (React Native) ilova — video tanlash, matnni tahrirlash, stil tanlash, galereyaga saqlash
backend/  Node.js API — ElevenLabs Scribe (o‘zbek tili) orqali transkripsiya, Remotion bilan eksport
shared/   Subtitr dvigateli, stillar va overlaylar (ilova va eksport uchun umumiy)
```

## Server (Railway)

Backend **https://backend-production-fc51.up.railway.app** manzilida ishlaydi (Railway, `captionit` loyihasi, `/data` volume).
Mobil ilova standart holatda shu serverga ulanadi.

Yangilash:

```bash
railway up --no-gitignore --detach
```

`--no-gitignore` litsenziyali Gilroy shriftlarini (`shared/fonts/gilroy`, gitda yo'q) serverga yetkazadi; qolgan keraksiz fayllar `.railwayignore` orqali chiqarib tashlanadi.
API kalitlar Railway'da `ELEVENLABS_API_KEY` va `OPENAI_API_KEY` o'zgaruvchilari sifatida saqlanadi.

## Lokal ishga tushirish

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # ELEVENLABS_API_KEY ni yozing (Speech to Text ruxsati bilan)
npm run dev            # http://localhost:4000
```

### 2. Mobil ilova

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=local npx expo start   # lokal backend bilan; o'zgaruvchisiz — Railway serveri
```

Telefon va kompyuter bitta Wi‑Fi tarmog'ida bo'lishi kerak. Ilova backend manzilini Expo dev server manzilidan avtomatik oladi (port 4000). Boshqa manzil kerak bo'lsa: `EXPO_PUBLIC_API_URL=http://192.168.x.x:4000 npx expo start`.

## API

| Method | Yo'l | Vazifasi |
|---|---|---|
| `POST` | `/jobs` | Video yuklash (`video` fayl, `language`: `auto`/`uz`/`ru`/`en`) — transkripsiya boshlanadi |
| `GET` | `/jobs/:id` | Holat: `transcribing` → `transcribed` → `rendering` → `done` |
| `POST` | `/jobs/:id/render` | `{ style, trim, phrases, overlays, transition }` — subtitrni videoga yozish; `transition = { mode: 'none' \| 'intro' \| 'sentences', sfx }` |
| `GET` | `/jobs/:id/video` | Tayyor video |
| `GET` | `/styles` | Subtitr stillari ro'yxati |

## Shisha o'tish effekti (glass transition)

Muharrirdagi **O'tish** bo'limida: *Yo'q* / *Boshida* / *Har gapda* (eng ko'pi bilan 3 soniyada bir marta) va whoosh ovozi.

- Eksport: `backend/renderer/GlassLayer.tsx` — panel ostidagi video SVG filtr orqali sindiriladi
  (qovurg'ali shisha, linza, rang ajralishi, yengil xiralik), chekka va yorug'lik chiziqlari CSS bilan.
  Subtitrlar panel ustida qoladi.
- Vaqtlar va ovozlar: `shared/transitions.ts` (ilova preview'i va eksport uchun umumiy).
- Ilovadagi preview soddalashtirilgan (`mobile/src/editor/GlassPreview.tsx`); to'liq effekt va ovoz eksportda.
- **Ovoz fayllari gitda yo'q** (Gilroy kabi alohida litsenziyali): `backend/sfx/` papkasiga
  `slider_04.wav`, `whoosh_01.wav`, `whoosh_18.wav` nomlari bilan qo'ying. `railway up --no-gitignore`
  ularni serverga yuklaydi. Fayl bo'lmasa, effekt ovozsiz ishlaydi.

## Keyingi qadamlar

- Keraksiz so'zlar va pauzalarni avtomatik kesish
- Ko'proq stil va shriftlar, emoji
- Foydalanuvchi akkauntlari va bulutda saqlash (S3/R2)
- Backendni serverga joylash (Railway, Fly.io)
