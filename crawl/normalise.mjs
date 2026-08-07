/**
 * Tier-1 normalisation from ticket 02: invisible equivalence.
 *
 * A reader cannot see these differences, so they fold silently and never make a
 * finding. Letter case and trailing punctuation are tier 2. They stay, because
 * the grouping key carries them and the `casing` class is built on them.
 */

const ENTITIES = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&euro;': '€',
  '&hellip;': '…',
  '&ndash;': '-',
  '&mdash;': '-',
  '&rsquo;': "'",
  '&lsquo;': "'",
  '&ldquo;': '"',
  '&rdquo;': '"',
  '&shy;': '\u00ad',
  '&zwnj;': '\u200c',
  '&zwj;': '\u200d',
};

// The browser draws nothing for these, and an editor cannot see or delete them.
const INVISIBLE = /[\u00ad\u200b\u200c\u200d]/g;

const SPACES = /[\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/g;
const SINGLE_QUOTES = /[‘’‚‛]/g;
const DOUBLE_QUOTES = /[“”„]/g;
const DASHES = /[–—]/g;

/**
 * Whitespace only. Use it where the text must stay as the page sends it, but
 * must not carry the source indentation.
 *
 * @param {string} text
 * @returns {string}
 */
export function collapse(text) {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * A code point a browser cannot draw is left as it was written. `fromCodePoint()`
 * throws above U+10FFFF, and one malformed entity in one paragraph must not stop a
 * crawl of the whole corpus. A lone surrogate is no better as text than as source.
 *
 * @param {string} entity  The whole entity, returned when the number is no character.
 * @param {number} code
 * @returns {string}
 */
function character(entity, code) {
  if (code > 0x10ffff) return entity;
  if (code >= 0xd800 && code <= 0xdfff) return entity;
  return String.fromCodePoint(code);
}

/**
 * @param {string} text
 * @returns {string}
 */
export function tier1(text) {
  return text
    .replace(/&[a-z]+;|&#\d+;|&#x[0-9a-f]+;/gi, (entity) => {
      const named = ENTITIES[entity.toLowerCase()];
      if (named !== undefined) return named;
      const decimal = entity.match(/^&#(\d+);$/);
      if (decimal) return character(entity, Number(decimal[1]));
      const hex = entity.match(/^&#x([0-9a-f]+);$/i);
      return hex ? character(entity, Number.parseInt(hex[1], 16)) : entity;
    })
    .replace(INVISIBLE, '')
    .replace(SPACES, ' ')
    .replace(SINGLE_QUOTES, "'")
    .replace(DOUBLE_QUOTES, '"')
    .replace(DASHES, '-')
    .replace(/\s+/g, ' ')
    .trim();
}
