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
| `POST` | `/jobs/:id/render` | `{ style, position, words }` — subtitrni videoga yozish |
| `GET` | `/jobs/:id/video` | Tayyor video |
| `GET` | `/styles` | Subtitr stillari ro'yxati |

## Keyingi qadamlar

- Keraksiz so'zlar va pauzalarni avtomatik kesish
- Ko'proq stil va shriftlar, emoji
- Foydalanuvchi akkauntlari va bulutda saqlash (S3/R2)
- Backendni serverga joylash (Railway, Fly.io)
