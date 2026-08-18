import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
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
 * and English; `niet` is not. **`resolved`** and **`noise`** are the two English words on
 * the list. `resolved` is here because `CONTEXT.md` retires it: it hid the difference
 * between a claim of fact and a judgement, ticket 80 banned it, and until now nothing
 * enforced that. `noise` is here because ticket 01 renamed the control to *Show
 * diagnostics*, and one word for what a rule saw is the whole point of that rename — a
 * new label, a new prop or a new comment reaching for the old word would undo it
 * quietly.
 */
const STOPWORDS = ['pagina', 'winkel', 'verschil', 'wissen', 'geen', 'niet', 'resolved', 'noise'];

// `fileURLToPath` and not `.pathname`, which keeps the percent-encoding: a checkout under
// a path holding a space would then be a directory name `readdir` cannot find. It is also
// the idiom `repo-root.mjs` and `api/server.mjs` use.
const ROOT = fileURLToPath(new URL('.', import.meta.url));

/**
 * The extensions the interface is written in. `ui/` is swept as well: those files are
 * shadcn's and they *should* hold no label, and a guard that takes that on trust is a
 * guard that cannot see the day one does.
 */
const DRAWN = ['.jsx', '.mjs', '.astro', '.js'];

/** @returns {Promise<string[]>} */
async function filesUnder(directory) {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });
  return entries
    .filter(
      (entry) =>
        entry.isFile() && DRAWN.includes(extname(entry.name)) && !entry.name.endsWith('.test.mjs'),
    )
    .map((entry) => join(entry.parentPath, entry.name));
}

/**
 * A word inside a word is not the word. Without the boundary `geen` fires inside
 * `Nijmegen`, and a guard that cries wolf is a guard somebody switches off.
 */
const holds = (text, word) => new RegExp(`\\b${word}`, 'i').test(text);

describe('the interface speaks one language', () => {
  // The sweep reads every file the interface is written in, so it is given room: under a
  // full `npm test` it shares a machine with two vitest projects, and vitest's five-second
  // default made it a flake rather than a guard.
  it('draws no Dutch stopword anywhere under web/src', async () => {
    const files = await filesUnder(ROOT);
    // The sweep has to actually sweep. A path that resolved to nothing would make this
    // whole file pass by finding no file to read.
    expect(files.length).toBeGreaterThan(30);

    // Read together rather than one after the other. The files are small and there are
    // hundreds of them, so the cost is the round trips and not the bytes.
    const read = await Promise.all(
      files.map(async (file) => /** @type {[string, string]} */ ([
        file,
        await readFile(file, 'utf8'),
      ])),
    );

    /** @type {string[]} */
    const caught = [];
    for (const [file, text] of read) {
      for (const [index, line] of text.split('\n').entries()) {
        for (const word of STOPWORDS) {
          if (holds(line, word)) {
            caught.push(`${relative(ROOT, file)}:${index + 1} — ${word} — ${line.trim()}`);
          }
        }
      }
    }

    expect(caught).toEqual([]);
    // The five-second default is what made this a flake instead of a guard: standalone the
    // sweep takes under a second, and under a full `npm test` it shares the machine with
    // two vitest projects.
  }, 30_000);

  // The guard has to be able to fail. Without this the list could be emptied, or the
  // matcher could be broken, and the file would go on reporting success.
  it('catches the label a regression would write', () => {
    expect(STOPWORDS.some((word) => holds('Geen pagina gevonden.', word))).toBe(true);
    expect(STOPWORDS.some((word) => holds('Filter wissen', word))).toBe(true);
    expect(STOPWORDS.some((word) => holds('nog niet opgelost', word))).toBe(true);
    expect(STOPWORDS.some((word) => holds('Resolved', word))).toBe(true);
    expect(STOPWORDS.some((word) => holds('Show noise (12)', word))).toBe(true);
  });

  // And it has to leave the interface's own words alone.
  it('leaves an English label alone', () => {
    for (const label of ['Choose a store', 'Repeats', 'Clear filter', 'Show diagnostics', 'Text']) {
      expect(STOPWORDS.some((word) => holds(label, word))).toBe(false);
    }
  });
});
