// Server-side mirror of the parts of shared/transitions.ts the API needs (the server is plain
// CommonJS and doesn't load the TypeScript in shared/). Keep in sync.
const TRANSITION_MODES = ['none', 'intro', 'sentences'];
const SFX_FILES = ['slider_04.wav', 'whoosh_01.wav', 'whoosh_18.wav'];

module.exports = { TRANSITION_MODES, SFX_FILES };
