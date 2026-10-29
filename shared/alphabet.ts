// New Uzbek Latin alphabet (law O‘RQ-1184, 2026): o‘ → ö, g‘ → ğ, sh → ş, ch → ç.
// Uzbek captions are written in it automatically. The tutuq belgisi (’) stays.
// Mirrored in backend/src/alphabet.js (the server is plain CommonJS); keep the two in sync.

const APOSTROPHES = "'`’‘ʻʼ";

const upperIf = (upper: boolean, s: string) => (upper ? s.toUpperCase() : s);

export function toNewUzbekLatin(text: string): string {
  return text
    .replace(new RegExp(`([oOgG])[${APOSTROPHES}]`, 'g'), (_, c: string) =>
      upperIf(c === c.toUpperCase(), c.toLowerCase() === 'o' ? 'ö' : 'ğ'))
    // A separating tutuq (Is’hoq) keeps s and h apart, so only adjacent letters become ş / ç.
    .replace(/([sScC])([hH])/g, (_, c: string) => upperIf(c === c.toUpperCase(), c.toLowerCase() === 's' ? 'ş' : 'ç'));
}

export const isUzbek = (language?: string | null) => !!language && /^uz/i.test(language);
