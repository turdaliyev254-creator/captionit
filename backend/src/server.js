require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { probe, extractAudio } = require('./media');
const { transcribe } = require('./transcribe');
const heicConvert = require('heic-convert');
const { renderCaptioned, getBundle } = require('./render');

const PORT = Number(process.env.PORT || 4000);
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));
fs.mkdirSync(DATA_DIR, { recursive: true });

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
      const job = jobs.get(req.params.id);
      if (!job) return cb(Object.assign(new Error('job not found'), { status: 404 }));
      const dir = path.join(job.dir, 'assets');
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

function publicJob(job) {
  const { input, dir, ...rest } = job;
  return rest;
}

app.get('/health', (req, res) => res.json({ ok: true }));

// 1) Upload a video -> starts transcription.
app.post('/jobs', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'video file is required (field "video")' });
  const id = req.jobId;
  const job = {
    id,
    status: 'transcribing',
    language: req.body.language || 'auto',
    dir: path.dirname(req.file.path),
    input: req.file.path,
    words: [],
    error: null,
    createdAt: Date.now(),
  };
  jobs.set(id, job);
  res.status(201).json(publicJob(job));

  try {
    Object.assign(job, await probe(job.input));
    const audio = path.join(job.dir, 'audio.mp3');
    await extractAudio(job.input, audio);
    const result = await transcribe(audio, job.language);
    Object.assign(job, { status: 'transcribed', text: result.text, detectedLanguage: result.language, words: result.words });
  } catch (err) {
    console.error(`[${id}] transcription failed`, err);
    Object.assign(job, { status: 'error', error: err.message.split('\n')[0] });
  }
  save(job);
});

app.get('/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'job not found' });
  res.json(publicJob(job));
});

// Source video, read by the Remotion renderer.
app.get('/jobs/:id/input', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'job not found' });
  res.sendFile(job.input);
});

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

app.post('/jobs/:id/assets', assetUpload.single('file'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'file is required (field "file")' });
  try {
    let name = req.file.filename;
    // iPhone photos may arrive as HEIC, which the export renderer (Chrome) can't draw.
    if (/\.hei[cf]$/i.test(name)) {
      name = path.basename(await toJpeg(req.file.path));
      fs.rmSync(req.file.path);
    }
    res.status(201).json({ src: `/jobs/${req.params.id}/assets/${name}` });
  } catch (err) {
    next(err);
  }
});

app.get('/jobs/:id/assets/:file', (req, res) => {
  const job = jobs.get(req.params.id);
  const file = job && path.join(job.dir, 'assets', path.basename(req.params.file));
  if (!file || !fs.existsSync(file)) return res.status(404).json({ error: 'asset not found' });
  res.sendFile(file);
});

// 2) Export: render the edited phrases with the chosen (already resolved) style.
// Phrases and overlays arrive already shifted to the trimmed timeline (0 = trim.start).
app.post('/jobs/:id/render', async (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'job not found' });
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

  Object.assign(job, { status: 'rendering', progress: 0, error: null });
  res.json(publicJob(job));

  const output = path.join(job.dir, 'output.mp4');
  const started = Date.now();
  try {
    await renderCaptioned({
      output,
      inputProps: {
        videoSrc: `http://localhost:${PORT}/jobs/${job.id}/input`,
        width: job.width,
        height: job.height,
        fps: job.fps,
        duration: trim.end - trim.start,
        trim,
        phrases,
        style,
        // Asset paths become absolute URLs the renderer can fetch.
        overlays: await Promise.all(overlays.map(async (o) => ({ ...o, src: o.src ? `http://localhost:${PORT}${await ensureDrawable(job, o.src)}` : undefined }))),
      },
      onProgress: (p) => (job.progress = p),
    });
    Object.assign(job, { status: 'done', progress: 1, videoUrl: `/jobs/${job.id}/video` });
    console.log(`[${job.id}] rendered in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  } catch (err) {
    console.error(`[${job.id}] render failed`, err);
    Object.assign(job, { status: 'error', error: err.message.split('\n')[0] });
  }
  save(job);
});

app.get('/jobs/:id/video', (req, res) => {
  const job = jobs.get(req.params.id);
  const file = job && path.join(job.dir, 'output.mp4');
  if (!file || !fs.existsSync(file)) return res.status(404).json({ error: 'video not ready' });
  res.sendFile(file);
});

// Always answer with JSON so the app can show a readable message.
app.use((err, req, res, next) => {
  if (req.jobId) fs.rmSync(path.join(DATA_DIR, req.jobId), { recursive: true, force: true });
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Video juda katta (maksimum 2 GB). Qisqaroq video tanlang.' });
  }
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server xatosi' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Caption backend on http://localhost:${PORT}`);
  getBundle().then(() => console.log('Remotion bundle ready'), (err) => console.error('Remotion bundle failed', err));
});
