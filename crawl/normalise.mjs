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
};

const SPACES = /[     ﻿]/g;
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
 * @param {string} text
 * @returns {string}
 */
export function tier1(text) {
  return text
    .replace(/&[a-z]+;|&#\d+;/gi, (entity) => {
      const named = ENTITIES[entity.toLowerCase()];
      if (named !== undefined) return named;
      const numeric = entity.match(/^&#(\d+);$/);
      return numeric ? String.fromCodePoint(Number(numeric[1])) : entity;
    })
    .replace(SPACES, ' ')
    .replace(SINGLE_QUOTES, "'")
    .replace(DOUBLE_QUOTES, '"')
    .replace(DASHES, '-')
    .replace(/\s+/g, ' ')
    .trim();
}
