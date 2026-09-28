# Captionit

Videolarga avtomatik, so'zma-so'z animatsiyali subtitr qo'shadigan mobil ilova (Captions ilovasiga o'xshash).

```
mobile/   Expo (React Native) ilova — video tanlash, matnni tahrirlash, stil tanlash, galereyaga saqlash
backend/  Node.js API — Whisper orqali transkripsiya, FFmpeg bilan subtitrni videoga yozish
```

## Ishga tushirish

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # OPENAI_API_KEY ni yozing
npm run dev            # http://localhost:4000
```

### 2. Mobil ilova

```bash
cd mobile
npm install
npx expo start
```

Telefon va kompyuter bitta Wi‑Fi tarmog'ida bo'lishi kerak. Ilova backend manzilini Expo dev server manzilidan avtomatik oladi (port 4000). Boshqa manzil kerak bo'lsa: `EXPO_PUBLIC_API_URL=http://192.168.x.x:4000 npx expo start`.

## API

| Method | Yo'l | Vazifasi |
|---|---|---|
| `POST` | `/jobs` | Video yuklash (`video` fayl, `language`: `auto`/`uz`/`ru`/`en`) — transkripsiya boshlanadi |
| `GET` | `/jobs/:id` | Holat: `transcribing` → `transcribed` → `rendering` → `done` |
| `POST` | `/jobs/:id/render` | `{ style, position, words }` — subtitrni videoga yozish |
| `GET` | `/jobs/:id/video` | Tayyor video |
| `GET` | `/styles` | Subtitr stillari ro'yxati |

## Keyingi qadamlar

- Keraksiz so'zlar va pauzalarni avtomatik kesish
- Ko'proq stil va shriftlar, emoji
- Foydalanuvchi akkauntlari va bulutda saqlash (S3/R2)
- Backendni serverga joylash (Railway, Fly.io)
