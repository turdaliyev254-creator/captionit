const { execFile } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;

function run(bin, args) {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`${err.message}\n${stderr.slice(-2000)}`));
      resolve(stdout);
    });
  });
}

async function probe(file) {
  const out = await run(ffprobePath, [
    '-v', 'error', '-select_streams', 'v:0', '-show_streams', '-show_format', '-of', 'json', file,
  ]);
  const data = JSON.parse(out);
  const s = data.streams[0] || {};
  let { width, height } = s;
  // Phone videos are often stored landscape with a rotation flag.
  const sideRotation = (s.side_data_list || []).find((d) => d.rotation !== undefined)?.rotation;
  const rotation = Math.abs(Number(sideRotation ?? s.tags?.rotate ?? 0)) % 360;
  if (rotation === 90 || rotation === 270) [width, height] = [height, width];
  return { width, height, duration: Number(data.format?.duration || 0) };
}

// 16 kHz mono mp3 keeps uploads to the transcription API small.
function extractAudio(input, output) {
  return run(ffmpegPath, ['-y', '-i', input, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '48k', output]);
}

function burnSubtitles(input, assFile, output) {
  // The subtitles filter needs ':' and '\' escaped in the path.
  const escaped = assFile.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
  return run(ffmpegPath, [
    '-y', '-i', input,
    '-vf', `subtitles='${escaped}'`,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart',
    output,
  ]);
}

module.exports = { probe, extractAudio, burnSubtitles };
