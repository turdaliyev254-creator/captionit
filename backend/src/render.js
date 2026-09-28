const path = require('path');
const os = require('os');
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
    concurrency: Math.max(1, Math.floor(os.cpus().length / 2)),
    chromiumOptions: { gl: 'angle' },
    onProgress: ({ progress }) => onProgress?.(progress),
  });
}

module.exports = { renderCaptioned, getBundle };
