require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { probe, extractAudio, burnSubtitles } = require('./media');
const { transcribe } = require('./transcribe');
const { STYLES, buildAss } = require('./subtitles');

const PORT = Number(process.env.PORT || 4000);
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));
fs.mkdirSync(DATA_DIR, { recursive: true });

// In-memory job store; fine for the MVP, swap for a DB later.
const jobs = new Map();

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
  limits: { fileSize: 500 * 1024 * 1024 },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

function publicJob(job) {
  const { input, dir, ...rest } = job;
  return rest;
}

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/styles', (req, res) => {
  res.json(Object.entries(STYLES).map(([id, s]) => ({ id, label: s.label, primary: s.primary, highlight: s.highlight })));
});

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
});

app.get('/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'job not found' });
  res.json(publicJob(job));
});

// 2) Render: burn styled captions into the video. Accepts edited words.
app.post('/jobs/:id/render', async (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'job not found' });
  if (!['transcribed', 'done', 'error'].includes(job.status) || !job.width) {
    return res.status(409).json({ error: `job is ${job.status}` });
  }
  const { style = 'classic', position = 'bottom', words } = req.body || {};
  if (Array.isArray(words)) job.words = words;

  Object.assign(job, { status: 'rendering', style, position, error: null });
  res.json(publicJob(job));

  try {
    const assFile = path.join(job.dir, 'captions.ass');
    fs.writeFileSync(assFile, buildAss(job.words, { width: job.width, height: job.height, styleId: style, position }));
    await burnSubtitles(job.input, assFile, path.join(job.dir, 'output.mp4'));
    Object.assign(job, { status: 'done', videoUrl: `/jobs/${job.id}/video` });
  } catch (err) {
    console.error(`[${job.id}] render failed`, err);
    Object.assign(job, { status: 'error', error: err.message.split('\n')[0] });
  }
});

app.get('/jobs/:id/video', (req, res) => {
  const job = jobs.get(req.params.id);
  const file = job && path.join(job.dir, 'output.mp4');
  if (!file || !fs.existsSync(file)) return res.status(404).json({ error: 'video not ready' });
  res.sendFile(file);
});

app.listen(PORT, '0.0.0.0', () => console.log(`Caption backend on http://localhost:${PORT}`));
