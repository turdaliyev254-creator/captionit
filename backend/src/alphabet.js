// Server copy of shared/alphabet.ts (the server is plain CommonJS and doesn't load the
// TypeScript in shared/). Keep the two in sync.
// New Uzbek Latin alphabet (law O‘RQ-1184, 2026): o‘ → ö, g‘ → ğ, sh → ş, ch → ç.

const APOSTROPHES = "'`’‘ʻʼ";

const upperIf = (upper, s) => (upper ? s.toUpperCase() : s);

function toNewUzbekLatin(text) {
  return text
    .replace(new RegExp(`([oOgG])[${APOSTROPHES}]`, 'g'), (_, c) =>
      upperIf(c === c.toUpperCase(), c.toLowerCase() === 'o' ? 'ö' : 'ğ'))
    // A separating tutuq (Is’hoq) keeps s and h apart, so only adjacent letters become ş / ç.
    .replace(/([sScC])([hH])/g, (_, c) => upperIf(c === c.toUpperCase(), c.toLowerCase() === 's' ? 'ş' : 'ç'));
}

module.exports = { toNewUzbekLatin };
