const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { sendSms } = require('./sms');

const OTP_TTL = 5 * 60 * 1000;
const OTP_RESEND = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const TOKEN_TTL = '90d';

// jose is ESM-only; load it lazily from CommonJS.
let josePromise;
const jose = () => (josePromise ??= import('jose'));

const APPLE_JWKS_URL = new URL('https://appleid.apple.com/auth/keys');
const GOOGLE_JWKS_URL = new URL('https://www.googleapis.com/oauth2/v3/certs');
let appleJwks;
let googleJwks;

class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function createAuth({ db, dataDir }) {
  // Signing secret: env var, or generated once and kept on the volume.
  const secretFile = path.join(dataDir, '.jwt_secret');
  let secretValue = process.env.JWT_SECRET;
  if (!secretValue) {
    if (!fs.existsSync(secretFile)) fs.writeFileSync(secretFile, crypto.randomBytes(48).toString('hex'), { mode: 0o600 });
    secretValue = fs.readFileSync(secretFile, 'utf8').trim();
  }
  const secret = new TextEncoder().encode(secretValue);
  const hashCode = (phone, code) => crypto.createHmac('sha256', secretValue).update(`${phone}:${code}`).digest('hex');

  const q = {
    userById: db.prepare('SELECT * FROM users WHERE id = ?'),
    userByPhone: db.prepare('SELECT * FROM users WHERE phone = ?'),
    userByGoogle: db.prepare('SELECT * FROM users WHERE google_sub = ?'),
    userByApple: db.prepare('SELECT * FROM users WHERE apple_sub = ?'),
    insertUser: db.prepare('INSERT INTO users (id, phone, email, name, google_sub, apple_sub, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    updateName: db.prepare('UPDATE users SET name = ? WHERE id = ?'),
    updateEmail: db.prepare('UPDATE users SET email = ? WHERE id = ?'),
    updatePhone: db.prepare('UPDATE users SET phone = ? WHERE id = ?'),
    setAvatar: db.prepare('UPDATE users SET avatar_at = ? WHERE id = ?'),
    setConsent: db.prepare('UPDATE users SET ai_consent_at = ? WHERE id = ?'),
    deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),
    otpGet: db.prepare('SELECT * FROM otp_codes WHERE phone = ?'),
    otpPut: db.prepare('INSERT OR REPLACE INTO otp_codes (phone, code_hash, expires_at, attempts, sent_at) VALUES (?, ?, ?, 0, ?)'),
    otpAttempt: db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = ?'),
    otpDelete: db.prepare('DELETE FROM otp_codes WHERE phone = ?'),
  };

  function publicUser(u) {
    return {
      id: u.id, phone: u.phone, email: u.email, name: u.name, aiConsent: !!u.ai_consent_at, createdAt: u.created_at,
      avatarUrl: u.avatar_at ? `/me/avatar?v=${u.avatar_at}` : null,
      providers: { phone: !!u.phone, google: !!u.google_sub, apple: !!u.apple_sub },
    };
  }

  async function issueToken(user) {
    const { SignJWT } = await jose();
    return new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(user.id).setIssuedAt().setExpirationTime(TOKEN_TTL).sign(secret);
  }

  async function session(user) {
    return { token: await issueToken(user), user: publicUser(user) };
  }

  function createUser({ phone = null, email = null, name = null, googleSub = null, appleSub = null }) {
    const id = crypto.randomUUID();
    q.insertUser.run(id, phone, email, name, googleSub, appleSub, Date.now());
    return q.userById.get(id);
  }

  // Uzbek numbers only for now: +998 and 9 digits.
  function normalizePhone(raw) {
    const digits = String(raw || '').replace(/\D/g, '');
    const full = digits.length === 9 ? `998${digits}` : digits;
    if (!/^998\d{9}$/.test(full)) throw new HttpError(400, "Telefon raqam noto‘g‘ri. Masalan: +998 90 123 45 67", 'bad_phone');
    return `+${full}`;
  }

  // Fixed demo login for App Store review (reviewers can't receive SMS): REVIEW_PHONE + REVIEW_CODE.
  const reviewPhone = process.env.REVIEW_PHONE ? normalizePhone(process.env.REVIEW_PHONE) : null;
  const reviewCode = process.env.REVIEW_CODE;
  const isReview = (phone) => reviewPhone && reviewCode && phone === reviewPhone;

  async function startOtp(rawPhone) {
    const phone = normalizePhone(rawPhone);
    if (isReview(phone)) return { phone };
    const existing = q.otpGet.get(phone);
    if (existing && Date.now() - existing.sent_at < OTP_RESEND) {
      throw new HttpError(429, 'Kod yaqinda yuborildi. Bir daqiqadan keyin qayta urinib ko‘ring.', 'otp_throttled');
    }
    const code = String(crypto.randomInt(100000, 1000000));
    q.otpPut.run(phone, hashCode(phone, code), Date.now() + OTP_TTL, Date.now());
    const delivered = await sendSms(phone, `Captionit tasdiqlash kodi: ${code}`);
    // Without an SMS provider the code only goes to the server log (development/testing).
    const exposeCode = !delivered && process.env.OTP_DEV_CODES === '1';
    return { phone, ...(exposeCode ? { devCode: code } : {}) };
  }

  // Checks and consumes an SMS code; throws on failure.
  function checkOtp(phone, code) {
    const row = q.otpGet.get(phone);
    if (!row || row.expires_at < Date.now()) throw new HttpError(400, 'Kod eskirgan. Yangi kod so‘rang.', 'otp_expired');
    if (row.attempts >= OTP_MAX_ATTEMPTS) throw new HttpError(429, 'Urinishlar ko‘p bo‘ldi. Yangi kod so‘rang.', 'otp_locked');
    const given = hashCode(phone, String(code || '').trim());
    if (!crypto.timingSafeEqual(Buffer.from(given), Buffer.from(row.code_hash))) {
      q.otpAttempt.run(phone);
      throw new HttpError(400, 'Kod noto‘g‘ri.', 'otp_wrong');
    }
    q.otpDelete.run(phone);
  }

  // Change (or add) the phone number of a signed-in user after verifying a code sent to it.
  function changePhone(userId, rawPhone, code) {
    const phone = normalizePhone(rawPhone);
    const owner = q.userByPhone.get(phone);
    if (owner && owner.id !== userId) throw new HttpError(409, 'Bu raqam boshqa akkauntga bog‘langan.', 'phone_taken');
    checkOtp(phone, code);
    q.updatePhone.run(phone, userId);
    return q.userById.get(userId);
  }

  function updateEmail(userId, raw) {
    const email = String(raw || '').trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Email noto‘g‘ri.', 'bad_email');
    q.updateEmail.run(email || null, userId);
  }

  async function verifyOtp(rawPhone, code, name) {
    const phone = normalizePhone(rawPhone);
    if (isReview(phone)) {
      const given = String(code || '').trim();
      if (given.length !== reviewCode.length || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(reviewCode))) {
        throw new HttpError(400, 'Kod noto‘g‘ri.', 'otp_wrong');
      }
      return session(q.userByPhone.get(phone) ?? createUser({ phone, name: 'App Review' }));
    }
    checkOtp(phone, code);
    const user = q.userByPhone.get(phone) ?? createUser({ phone, name: name?.trim() || null });
    return session(user);
  }

  async function signInGoogle(idToken) {
    const audiences = (process.env.GOOGLE_CLIENT_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!audiences.length) throw new HttpError(503, 'Google orqali kirish hali sozlanmagan.', 'google_disabled');
    const { createRemoteJWKSet, jwtVerify } = await jose();
    googleJwks ??= createRemoteJWKSet(GOOGLE_JWKS_URL);
    const { payload } = await jwtVerify(idToken, googleJwks, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: audiences,
    }).catch(() => {
      throw new HttpError(401, 'Google tokeni yaroqsiz.', 'google_invalid');
    });
    const user = q.userByGoogle.get(payload.sub) ?? createUser({ googleSub: payload.sub, email: payload.email ?? null, name: payload.name ?? null });
    return session(user);
  }

  async function signInApple(identityToken, fullName) {
    // Bundle IDs allowed as audience: the app itself, plus Expo Go during development.
    const audiences = (process.env.APPLE_AUDIENCES || 'com.captionit.app,host.exp.Exponent').split(',').map((s) => s.trim());
    const { createRemoteJWKSet, jwtVerify } = await jose();
    appleJwks ??= createRemoteJWKSet(APPLE_JWKS_URL);
    const { payload } = await jwtVerify(identityToken, appleJwks, { issuer: 'https://appleid.apple.com', audience: audiences }).catch(() => {
      throw new HttpError(401, 'Apple tokeni yaroqsiz.', 'apple_invalid');
    });
    const user = q.userByApple.get(payload.sub) ?? createUser({ appleSub: payload.sub, email: payload.email ?? null, name: fullName?.trim() || null });
    return session(user);
  }

  // Express middleware. Media endpoints also accept ?token= (video players can't send headers).
  function requireUser(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token;
    if (!token) return next(new HttpError(401, 'Avval tizimga kiring.', 'unauthorized'));
    jose()
      .then(({ jwtVerify }) => jwtVerify(String(token), secret))
      .then(({ payload }) => {
        const user = q.userById.get(payload.sub);
        if (!user) throw new Error('user gone');
        req.user = user;
        next();
      })
      .catch(() => next(new HttpError(401, 'Sessiya tugagan. Qaytadan kiring.', 'unauthorized')));
  }

  return {
    HttpError,
    publicUser,
    startOtp,
    verifyOtp,
    signInGoogle,
    signInApple,
    requireUser,
    updateName: (id, name) => q.updateName.run(name?.trim() || null, id),
    updateEmail,
    changePhone,
    setAvatar: (id, at) => q.setAvatar.run(at, id),
    giveConsent: (id) => q.setConsent.run(Date.now(), id),
    deleteUser: (id) => q.deleteUser.run(id),
    getUser: (id) => q.userById.get(id),
  };
}

module.exports = { createAuth, HttpError };
