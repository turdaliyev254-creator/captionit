const fs = require('fs');
const OpenAI = require('openai');

let client;
function getClient() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set (see backend/.env.example)');
  client ??= new OpenAI();
  return client;
}

// Returns [{ word, start, end }] with timestamps in seconds.
async function transcribe(audioFile, language) {
  const res = await getClient().audio.transcriptions.create({
    file: fs.createReadStream(audioFile),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
    ...(language && language !== 'auto' ? { language } : {}),
  });
  return {
    text: res.text,
    language: res.language,
    words: (res.words || []).map((w) => ({ word: w.word, start: w.start, end: w.end })),
  };
}

module.exports = { transcribe };
