require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { probe, extractAudio, makeThumbnail, makeAvatar } = require('./media');
const { transcribe } = require('./transcribe');
const heicConvert = require('heic-convert');
const { renderCaptioned, getBundle } = require('./render');
const { openDb } = require('./db');
const { createAuth, HttpError } = require('./auth');
const { mountLegal } = require('./legal');
const { TRANSITION_MODES, SFX_FILES } = require('./transitions');

const PORT = Number(process.env.PORT || 4000);
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = openDb(DATA_DIR);
const auth = createAuth({ db, dataDir: DATA_DIR });

// The renderer (headless Chrome on this machine) fetches media with this per-process key.
const INTERNAL_KEY = crypto.randomBytes(24).toString('hex');

// Jobs live in memory and are mirrored to data/<id>/job.json so a server restart keeps them.
const jobs = new Map();
for (const id of fs.readdirSync(DATA_DIR)) {
  try {
    const job = JSON.parse(fs.readFileSync(path.join(DATA_DIR, id, 'job.json'), 'utf8'));
    // Work interrupted by a restart can't resume; let the client retry.
    if (job.status === 'transcribing' || job.status === 'rendering') Object.assign(job, { status: 'error', error: 'Server qayta ishga tushdi, qaytadan urinib ko‘ring' });
    jobs.set(id, job);
  } catch {}
}
function save(job) {
  fs.writeFileSync(path.join(job.dir, 'job.json'), JSON.stringify(job));
}
function removeJob(job) {
  jobs.delete(job.id);
  fs.rmSync(job.dir, { recursive: true, force: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const id = crypto.randomUUID();
      req.jobId = id;
      const dir = path.join(DATA_DIR, id);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, 'input' + (path.extname(file.originalname) || '.mp4')),
  }),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
});

// Images / clips placed over the video, stored next to the job.
const assetUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(req.job.dir, 'assets');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + (path.extname(file.originalname) || '')),
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
mountLegal(app);

// async route helper: forwards rejections to the error handler.
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function publicJob(job) {
  const { input, dir, userId, ...rest } = job;
  return rest;
}

// Loads :id and makes sure it belongs to the signed-in user (404 otherwise, so ids don't leak).
function ownJob(req, res, next) {
  const job = jobs.get(req.params.id);
  if (!job || job.userId !== req.user.id) return next(new HttpError(404, 'Video topilmadi', 'not_found'));
  req.job = job;
  next();
}

// Media files: the owner (token in header or ?token=) or the local renderer (?k=).
function mediaAccess(req, res, next) {
  if (req.query.k === INTERNAL_KEY) {
    req.job = jobs.get(req.params.id);
    return req.job ? next() : next(new HttpError(404, 'Video topilmadi'));
  }
  auth.requireUser(req, res, (err) => (err ? next(err) : ownJob(req, res, next)));
}

app.get('/health', (req, res) => res.json({ ok: true }));

// Transition sounds (licensed separately, kept out of git) for the renderer only.
const SFX_DIR = path.join(__dirname, '..', 'sfx');
app.get('/sfx/:file', (req, res, next) => {
  if (req.query.k !== INTERNAL_KEY) return next(new HttpError(404, 'Not found'));
  const file = path.join(SFX_DIR, path.basename(req.params.file));
  if (!fs.existsSync(file)) return next(new HttpError(404, 'Not found'));
  res.sendFile(file);
});

// ---------- auth ----------

app.post('/auth/otp/start', h(async (req, res) => res.json(await auth.startOtp(req.body?.phone))));
app.post('/auth/otp/verify', h(async (req, res) => res.json(await auth.verifyOtp(req.body?.phone, req.body?.code, req.body?.name))));
app.post('/auth/google', h(async (req, res) => res.json(await auth.signInGoogle(req.body?.idToken))));
app.post('/auth/apple', h(async (req, res) => res.json(await auth.signInApple(req.body?.identityToken, req.body?.fullName))));

app.get('/me', auth.requireUser, (req, res) => {
  const videos = [...jobs.values()].filter((j) => j.userId === req.user.id && j.status === 'done').length;
  res.json({ user: auth.publicUser(req.user), videos });
});

app.patch('/me', auth.requireUser, (req, res) => {
  if (typeof req.body?.name === 'string') auth.updateName(req.user.id, req.body.name.slice(0, 60));
  if (typeof req.body?.email === 'string') auth.updateEmail(req.user.id, req.body.email.slice(0, 120));
  res.json({ user: auth.publicUser(auth.getUser(req.user.id)) });
});

// Change phone: send a code to the new number, then confirm it.
app.post('/me/phone/start', auth.requireUser, h(async (req, res) => res.json(await auth.startOtp(req.body?.phone))));
app.post('/me/phone/verify', auth.requireUser, (req, res) => {
  res.json({ user: auth.publicUser(auth.changePhone(req.user.id, req.body?.phone, req.body?.code)) });
});

const avatarDir = path.join(DATA_DIR, 'avatars');
fs.mkdirSync(avatarDir, { recursive: true });
const avatarUpload = multer({ dest: path.join(avatarDir, 'tmp'), limits: { fileSize: 25 * 1024 * 1024 } });

app.post('/me/avatar', auth.requireUser, avatarUpload.single('file'), h(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required (field "file")' });
  try {
    let src = req.file.path;
    if (/hei[cf]/i.test(req.file.mimetype) || /\.hei[cf]$/i.test(req.file.originalname)) {
      const output = await heicConvert({ buffer: fs.readFileSync(src), format: 'JPEG', quality: 0.9 });
      src = `${req.file.path}.jpg`;
      fs.writeFileSync(src, Buffer.from(output));
    }
    await makeAvatar(src, path.join(avatarDir, `${req.user.id}.jpg`));
    if (src !== req.file.path) fs.rmSync(src, { force: true });
  } finally {
    fs.rmSync(req.file.path, { force: true });
  }
  auth.setAvatar(req.user.id, Date.now());
  res.json({ user: auth.publicUser(auth.getUser(req.user.id)) });
}));

app.delete('/me/avatar', auth.requireUser, (req, res) => {
  fs.rmSync(path.join(avatarDir, `${req.user.id}.jpg`), { force: true });
  auth.setAvatar(req.user.id, null);
  res.json({ user: auth.publicUser(auth.getUser(req.user.id)) });
});

app.get('/me/avatar', auth.requireUser, (req, res) => {
  const file = path.join(avatarDir, `${req.user.id}.jpg`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'no avatar' });
  res.sendFile(file);
});

// Explicit permission to send audio to the third-party AI (App Store guideline 5.1.2(i)).
app.post('/me/consent', auth.requireUser, (req, res) => {
  auth.giveConsent(req.user.id);
  res.json({ user: auth.publicUser(auth.getUser(req.user.id)) });
});

// In-app account deletion (App Store guideline 5.1.1(v)): user row and all their files.
app.delete('/me', auth.requireUser, (req, res) => {
  for (const job of [...jobs.values()]) if (job.userId === req.user.id) removeJob(job);
  fs.rmSync(path.join(avatarDir, `${req.user.id}.jpg`), { force: true });
  auth.deleteUser(req.user.id);
  res.json({ ok: true });
});

app.get('/me/videos', auth.requireUser, (req, res) => {
  const list = [...jobs.values()]
    .filter((j) => j.userId === req.user.id && j.status === 'done')
    .sort((a, b) => (b.renderedAt ?? b.createdAt) - (a.renderedAt ?? a.createdAt))
    .map((j) => ({
      id: j.id,
      title: j.title || 'Video',
      duration: j.outputDuration ?? j.duration,
      createdAt: j.renderedAt ?? j.createdAt,
      width: j.width,
      height: j.height,
      videoUrl: `/jobs/${j.id}/video`,
      thumbUrl: `/jobs/${j.id}/thumb`,
    }));
  res.json({ videos: list });
});

// ---------- jobs ----------

function requireConsent(req, res, next) {
  if (!req.user.ai_consent_at) return next(new HttpError(403, 'Avval audio yuborishga rozilik bering.', 'consent_required'));
  next();
}

// 1) Upload a video -> starts transcription.
app.post('/jobs', auth.requireUser, requireConsent, upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'video file is required (field "video")' });
  const id = req.jobId;
  const job = {
    id,
    userId: req.user.id,
    status: 'transcribing',
    language: req.body.language || 'auto',
    dir: path.dirname(req.file.path),
    input: req.file.path,
    words: [],
    error: null,
    createdAt: Date.now(),
  };
  jobs.set(id, job);
  save(job);
  res.status(201).json(publicJob(job));

  try {
    Object.assign(job, await probe(job.input));
    const audio = path.join(job.dir, 'audio.mp3');
    await extractAudio(job.input, audio);
    const result = await transcribe(audio, job.language);
    const title = result.words.slice(0, 6).map((w) => w.word).join(' ');
    Object.assign(job, { status: 'transcribed', text: result.text, title, detectedLanguage: result.language, words: result.words });
  } catch (err) {
    console.error(`[${id}] transcription failed`, err);
    Object.assign(job, { status: 'error', error: err.message.split('\n')[0] });
  }
  save(job);
});

app.get('/jobs/:id', auth.requireUser, ownJob, (req, res) => res.json(publicJob(req.job)));

app.delete('/jobs/:id', auth.requireUser, ownJob, (req, res) => {
  removeJob(req.job);
  res.json({ ok: true });
});

// Source video, read by the renderer and by the app when re-opening a project.
app.get('/jobs/:id/input', mediaAccess, (req, res) => res.sendFile(req.job.input));

async function toJpeg(file) {
  const jpg = file.replace(/\.hei[cf]$/i, '.jpg');
  if (!fs.existsSync(jpg)) {
    const output = await heicConvert({ buffer: fs.readFileSync(file), format: 'JPEG', quality: 0.9 });
    fs.writeFileSync(jpg, Buffer.from(output));
  }
  return jpg;
}

// Overlays added before HEIC conversion existed may still point at a .heic file.
async function ensureDrawable(job, src) {
  if (!/\.hei[cf]$/i.test(src)) return src;
  const file = path.join(job.dir, 'assets', path.basename(src));
  if (!fs.existsSync(file)) return src;
  return src.replace(/[^/]+$/, path.basename(await toJpeg(file)));
}

app.post('/jobs/:id/assets', auth.requireUser, ownJob, assetUpload.single('file'), h(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required (field "file")' });
  let name = req.file.filename;
  // iPhone photos may arrive as HEIC, which the export renderer (Chrome) can't draw.
  if (/\.hei[cf]$/i.test(name)) {
    name = path.basename(await toJpeg(req.file.path));
    fs.rmSync(req.file.path);
  }
  res.status(201).json({ src: `/jobs/${req.params.id}/assets/${name}` });
}));

app.get('/jobs/:id/assets/:file', mediaAccess, (req, res) => {
  const file = path.join(req.job.dir, 'assets', path.basename(req.params.file));
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'asset not found' });
  res.sendFile(file);
});

// 2) Export: render the edited phrases with the chosen (already resolved) style.
// Phrases and overlays arrive already shifted to the trimmed timeline (0 = trim.start).
app.post('/jobs/:id/render', auth.requireUser, ownJob, async (req, res) => {
  const job = req.job;
  if (job.status === 'transcribing' || job.status === 'rendering' || !job.width) {
    return res.status(409).json({ error: `job is ${job.status}` });
  }
  const { phrases, style, overlays = [] } = req.body || {};
  const trim = {
    start: Math.max(0, Number(req.body?.trim?.start) || 0),
    end: Math.min(job.duration, Number(req.body?.trim?.end) || job.duration),
  };
  if (trim.end - trim.start < 0.5) return res.status(400).json({ error: 'trim is too short' });
  if (!Array.isArray(phrases) || !style?.font) return res.status(400).json({ error: 'phrases and style are required' });
  const transition = {
    mode: TRANSITION_MODES.includes(req.body?.transition?.mode) ? req.body.transition.mode : 'none',
    sfx: req.body?.transition?.sfx !== false,
  };

  Object.assign(job, { status: 'rendering', progress: 0, error: null });
  res.json(publicJob(job));

  const output = path.join(job.dir, 'output.mp4');
  const started = Date.now();
  const internal = (p) => `http://localhost:${PORT}${p}?k=${INTERNAL_KEY}`;
  try {
    await renderCaptioned({
      output,
      inputProps: {
        videoSrc: internal(`/jobs/${job.id}/input`),
        width: job.width,
        height: job.height,
        fps: job.fps,
        duration: trim.end - trim.start,
        trim,
        phrases,
        style,
        overlays: await Promise.all(overlays.map(async (o) => ({ ...o, src: o.src ? internal(await ensureDrawable(job, o.src)) : undefined }))),
        transition,
        // Only sounds actually on this server; missing ones are skipped silently.
        sfx: Object.fromEntries(SFX_FILES.filter((f) => fs.existsSync(path.join(SFX_DIR, f))).map((f) => [f, internal(`/sfx/${f}`)])),
      },
      onProgress: (p) => (job.progress = p),
    });
    await makeThumbnail(output, path.join(job.dir, 'thumb.jpg')).catch((err) => console.error(`[${job.id}] thumbnail failed`, err));
    Object.assign(job, {
      status: 'done', progress: 1, videoUrl: `/jobs/${job.id}/video`, renderedAt: Date.now(), outputDuration: trim.end - trim.start,
    });
    console.log(`[${job.id}] rendered in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  } catch (err) {
    console.error(`[${job.id}] render failed`, err);
    Object.assign(job, { status: 'error', error: err.message.split('\n')[0] });
  }
  save(job);
});

app.get('/jobs/:id/video', mediaAccess, (req, res) => {
  const file = path.join(req.job.dir, 'output.mp4');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'video not ready' });
  res.sendFile(file);
});

app.get('/jobs/:id/thumb', mediaAccess, (req, res) => {
  const file = path.join(req.job.dir, 'thumb.jpg');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'no thumbnail' });
  res.sendFile(file);
});

// Always answer with JSON so the app can show a readable message.
app.use((err, req, res, next) => {
  if (req.jobId && !jobs.has(req.jobId)) fs.rmSync(path.join(DATA_DIR, req.jobId), { recursive: true, force: true });
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Fayl juda katta. Qisqaroq video tanlang.' });
  }
  if (!(err instanceof HttpError)) console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server xatosi', code: err.code });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Caption backend on http://localhost:${PORT}`);
  getBundle().then(() => console.log('Remotion bundle ready'), (err) => console.error('Remotion bundle failed', err));
});
