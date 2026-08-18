import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The two rules of ticket 01 that can be grepped.
 *
 * ADR 0019 refuses a screenshot suite and says why: the enforcement follows the habit
 * this repo already has — a sweep of the source that names every site at once. This file
 * is the third such sweep and it copies the shape of `interface-language.test.mjs`.
 */

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const DRAWN = ['.jsx', '.mjs', '.astro', '.js'];

/** @returns {Promise<[string, string][]>} */
async function drawnFiles() {
  const entries = await readdir(ROOT, { recursive: true, withFileTypes: true });
  const files = entries
    .filter(
      (entry) =>
        entry.isFile() && DRAWN.includes(extname(entry.name)) && !entry.name.endsWith('.test.mjs'),
    )
    .map((entry) => join(entry.parentPath, entry.name));
  // The sweep has to actually sweep: a path that resolved to nothing would make this
  // whole file pass by finding no file to read.
  expect(files.length).toBeGreaterThan(30);
  return Promise.all(
    files.map(async (file) => /** @type {[string, string]} */ ([
      file,
      await readFile(file, 'utf8'),
    ])),
  );
}

/** @param {[string, string][]} read @param {RegExp[]} patterns @param {(file: string) => boolean} [except] */
function sweep(read, patterns, except = () => false) {
  /** @type {string[]} */
  const caught = [];
  for (const [file, text] of read) {
    if (except(relative(ROOT, file).split(sep).join('/'))) continue;
    for (const [index, line] of text.split('\n').entries()) {
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          caught.push(`${relative(ROOT, file)}:${index + 1} — ${line.trim()}`);
        }
      }
    }
  }
  return caught;
}

/**
 * Every date reads the same way, so `lib/dates.mjs` is the only place one is formatted.
 * Three call sites spelled a date two ways before this, and one of them carried seconds.
 */
const FORMATS_A_DATE = [
  /\btoLocaleDateString\b/,
  /\btoLocaleTimeString\b/,
  /\bIntl\.DateTimeFormat\b/,
];

/**
 * `toLocaleString` is the same offence on a `Date` and a legitimate call on a number, so
 * it is caught only where a date is what is being formatted.
 */
const FORMATS_A_MOMENT = [/\bnew Date\([^)]*\)\.toLocaleString\b/, /\bAt\.toLocaleString\b/];

/** `lib/dates.mjs` is the exception, because it is the answer. */
const THE_DATE_HELPER = (file) => file === 'lib/dates.mjs';

/**
 * A control whose whole label is the bare word. `CONTEXT.md`: *a Clear says what
 * disappears* — an editor pressing one is asking what they are about to lose, and the
 * bare word answers with the name of the action rather than with its object.
 */
const A_BARE_CLEAR = [
  />\s*Clear\s*</,
  /(?:aria-label|title|label)=(["'])Clear\1/,
  /[:(=]\s*(["'])Clear\1/,
];

describe('the interface says the same thing the same way', () => {
  it('formats a date in one place', async () => {
    expect(
      sweep(await drawnFiles(), [...FORMATS_A_DATE, ...FORMATS_A_MOMENT], THE_DATE_HELPER),
    ).toEqual([]);
  }, 30_000);

  it('leaves no control labelled with a bare Clear', async () => {
    expect(sweep(await drawnFiles(), A_BARE_CLEAR)).toEqual([]);
  }, 30_000);

  // Both guards have to be able to fail, or the patterns could be broken and this file
  // would go on reporting success.
  it('catches what a regression would write', () => {
    const dates = [
      "  {new Date(note.createdAt).toLocaleDateString('en-GB')}",
      "  {new Date(report.builtAt).toLocaleString('en-GB')}",
      '  const fmt = new Intl.DateTimeFormat(LOCALE);',
    ];
    for (const line of dates) {
      expect(
        [...FORMATS_A_DATE, ...FORMATS_A_MOMENT].some((p) => p.test(line)),
        line,
      ).toBe(true);
    }

    const clears = [
      '      <Action onClick={undo}>Clear</Action>',
      '  aria-label="Clear"',
      "  title: 'Clear',",
    ];
    for (const line of clears) {
      expect(
        A_BARE_CLEAR.some((p) => p.test(line)),
        line,
      ).toBe(true);
    }
  });

  it('leaves the interface alone', () => {
    const kept = [
      '  {moment(report.builtAt)}',
      '  {day(note.createdAt)}',
      '  <Button onClick={onClear}>Clear filter</Button>',
      '  aria-label="Clear the selection"',
      '  {`Clear the decision on ${covers} pages`}',
      "  const total = count.toLocaleString('en-GB');",
    ];
    for (const line of kept) {
      expect(
        [...FORMATS_A_DATE, ...FORMATS_A_MOMENT, ...A_BARE_CLEAR].some((p) => p.test(line)),
        line,
      ).toBe(false);
    }
  });
});
