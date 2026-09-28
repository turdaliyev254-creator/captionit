const path = require('path');
const { bundle } = require('@remotion/bundler');
const { selectComposition, renderMedia } = require('@remotion/renderer');

// Bundling the Remotion project takes a few seconds, so do it once and reuse.
let bundlePromise;
function getBundle() {
  bundlePromise ??= bundle({
    entryPoint: path.join(__dirname, '..', 'renderer', 'index.ts'),
    publicDir: path.join(__dirname, '..', '..', 'shared', 'fonts'),
  }).catch((err) => {
    bundlePromise = undefined;
    throw err;
  });
  return bundlePromise;
}

// "2" -> 2, "50%" stays a percentage (Remotion sizes it from usable cores). Default: half the cores.
function parseConcurrency(value) {
  if (!value) return '50%';
  return value.endsWith('%') ? value : Number(value);
}

async function renderCaptioned({ inputProps, output, onProgress }) {
  const serveUrl = await getBundle();
  const composition = await selectComposition({ serveUrl, id: 'Captioned', inputProps });
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    crf: 20,
    audioCodec: 'aac',
    outputLocation: output,
    inputProps,
    // A percentage lets Remotion size it from the cores it can actually use (containers report the host's).
    concurrency: parseConcurrency(process.env.RENDER_CONCURRENCY),
    // 'angle' uses the Mac GPU; servers without a GPU need software rendering ('swangle').
    chromiumOptions: { gl: process.env.REMOTION_GL || 'angle' },
    // Keep memory bounded on small servers: capped video frame cache, generous per-frame timeout.
    offthreadVideoCacheSizeInBytes: 512 * 1024 * 1024,
    timeoutInMilliseconds: 120000,
    onProgress: ({ progress }) => onProgress?.(progress),
  });
}

module.exports = { renderCaptioned, getBundle };
