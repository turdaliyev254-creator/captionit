const fs = require('fs');
const OpenAI = require('openai');

// Returns { text, language, words: [{ word, start, end }] } with timestamps in seconds.
// ElevenLabs Scribe is preferred: it supports Uzbek (the OpenAI Whisper API rejects 'uz').
async function transcribe(audioFile, language) {
  let result;
  if (process.env.ELEVENLABS_API_KEY) result = await transcribeElevenLabs(audioFile, language);
  else if (process.env.OPENAI_API_KEY) result = await transcribeOpenAI(audioFile, language);
  else throw new Error('ELEVENLABS_API_KEY yoki OPENAI_API_KEY sozlanmagan (backend/.env)');

  if (language === 'uz' || /^uz/.test(result.language || '')) {
    result.text = fixUzbekLatin(result.text || '');
    result.words = result.words.map((w) => ({ ...w, word: fixUzbekLatin(w.word) }));
  }
  return result;
}

const CYR_TO_LAT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'x', ц: 's', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '’', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
  ў: 'o‘', қ: 'q', ғ: 'g‘', ҳ: 'h',
};

// Scribe sometimes emits loanwords in Cyrillic ("гепатит") inside Latin Uzbek text.
function cyrillicToLatin(text) {
  return text.replace(/[Ѐ-ӿ]+/g, (word) =>
    [...word]
      .map((ch, i) => {
        const lower = ch.toLowerCase();
        // "е" at the start of a word sounds like "ye" (e.g. "ер" -> "yer").
        let lat = lower === 'е' && i === 0 ? 'ye' : CYR_TO_LAT[lower] ?? ch;
        if (ch !== lower && lat) lat = lat[0].toUpperCase() + lat.slice(1);
        return lat;
      })
      .join(''),
  );
}

// Official Uzbek Latin: o‘ / g‘ use a turned comma (‘), the glottal stop (tutuq belgisi) uses ’.
// STT models mix ', `, ’ and ʻ, so normalize them.
function fixUzbekLatin(text) {
  return cyrillicToLatin(text)
    .replace(/([oOgG])['`’ʻʼ‘]/g, '$1‘')
    .replace(/(\p{L})['`ʻʼ]/gu, '$1’');
}

async function transcribeElevenLabs(audioFile, language) {
  const form = new FormData();
  form.append('model_id', process.env.ELEVENLABS_MODEL || 'scribe_v2');
  form.append('file', await fs.openAsBlob(audioFile), 'audio.mp3');
  form.append('timestamps_granularity', 'word');
  form.append('tag_audio_events', 'false');
  if (language && language !== 'auto') form.append('language_code', language);

  const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body.detail?.message || body.detail || res.statusText;
    throw new Error(`ElevenLabs ${res.status}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }
  return {
    text: body.text,
    language: body.language_code,
    words: (body.words || [])
      .filter((w) => w.type === 'word')
      .map((w) => ({ word: w.text, start: w.start, end: w.end })),
  };
}

let openai;
async function transcribeOpenAI(audioFile, language) {
  openai ??= new OpenAI();
  const res = await openai.audio.transcriptions.create({
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
