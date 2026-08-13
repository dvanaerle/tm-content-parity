import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The interface speaks one language, and it is English (ADR 0014).
 *
 * The rule is ticket 38's and it survives untouched: **one** language on all six
 * stores, on the grounds that matching two strings needs no comprehension of either.
 * Only the value changed. So this guard is not about English being better — it is
 * about the log having one language, which a half-migrated screen quietly loses.
 *
 * It is a **stopword** guard and not a translation check. A word list cannot tell that
 * a sentence is Dutch, and it does not try: it catches the words that were on the
 * screen before this ticket, which is exactly the shape a regression takes here — a new
 * control written in the language the file next to it used to speak.
 *
 * **Its job is labels, not fixtures.** `*.test.mjs` is excluded, because a test stands
 * a recorded note in for an editor's judgement and a note is never rewritten
 * (`CONTEXT.md`); so is this file, which has to hold the words to refuse them.
 *
 * A word here has to be one that cannot be an English label. `text` is Dutch-adjacent
 * and English; `niet` is not. **`resolved`** is the one English word on the list, and it
 * is here because `CONTEXT.md` retires it: it hid the difference between a claim of fact
 * and a judgement, ticket 80 banned it, and until now nothing enforced that.
 */
const STOPWORDS = ['pagina', 'winkel', 'verschil', 'wissen', 'geen', 'niet', 'resolved'];

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/** The files the interface is written in. `ui/` is shadcn's and it holds no label. */
const DRAWN = ['.jsx', '.mjs', '.astro', '.js'];

/** @returns {Promise<string[]>} */
async function filesUnder(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await filesUnder(path));
    else if (DRAWN.includes(extname(entry.name)) && !entry.name.endsWith('.test.mjs')) {
      found.push(path);
    }
  }
  return found;
}

/**
 * A word inside a word is not the word. `verschil` must not fire on nothing, but
 * `geen` inside `Nijmegen` would be a hit no reader could act on, and a guard that
 * cries wolf is a guard somebody switches off.
 */
const holds = (text, word) => new RegExp(`\\b${word}`, 'i').test(text);

describe('the interface speaks one language', () => {
  it('draws no Dutch stopword anywhere under web/src', async () => {
    const files = await filesUnder(ROOT);
    // The sweep has to actually sweep. A path that resolved to nothing would make this
    // whole file pass by finding no file to read.
    expect(files.length).toBeGreaterThan(30);

    /** @type {string[]} */
    const caught = [];
    for (const file of files) {
      const text = await readFile(file, 'utf8');
      for (const [index, line] of text.split('\n').entries()) {
        for (const word of STOPWORDS) {
          if (holds(line, word)) {
            caught.push(`${relative(ROOT, file)}:${index + 1} — ${word} — ${line.trim()}`);
          }
        }
      }
    }

    expect(caught).toEqual([]);
  });

  // The guard has to be able to fail. Without this the list could be emptied, or the
  // matcher could be broken, and the file would go on reporting success.
  it('catches the label a regression would write', () => {
    expect(STOPWORDS.some((word) => holds("Geen pagina gevonden.", word))).toBe(true);
    expect(STOPWORDS.some((word) => holds('Filter wissen', word))).toBe(true);
    expect(STOPWORDS.some((word) => holds('nog niet opgelost', word))).toBe(true);
    expect(STOPWORDS.some((word) => holds('Resolved', word))).toBe(true);
  });

  // And it has to leave the interface's own words alone.
  it('leaves an English label alone', () => {
    for (const label of ['Choose a store', 'Repeats', 'Clear filter', 'Show noise', 'Text']) {
      expect(STOPWORDS.some((word) => holds(label, word))).toBe(false);
    }
  });
});
