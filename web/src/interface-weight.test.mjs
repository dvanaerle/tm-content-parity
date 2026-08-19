import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The two rules of ADR 0019 that can be grepped.
 *
 * The ADR refuses a screenshot suite and says why: a standing snapshot cost paid for one
 * polish pass. The enforcement follows the habit this repo already has instead — a sweep
 * of the source that names every site at once. This file is the fourth such sweep and it
 * copies the shape of `interface-words.test.mjs`.
 *
 * The rest of ADR 0019 — what earns a card, a border, a shadow — is left to a reader on
 * purpose. Those need taste. A capital letter and a badge do not: each is a closed list,
 * and a closed list is exactly what rots without a test.
 */

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const DRAWN = ['.jsx', '.mjs', '.astro', '.js'];

/**
 * The primitive is not a call site. `ui/badge.jsx` is shadcn's, it defines the thing
 * rather than spending it, and it is the one file that may name a badge without being one.
 */
const THE_BADGE_PRIMITIVE = 'components/ui/badge.jsx';

/**
 * Comments are stripped before the sweep, keeping the line count, because this repo
 * explains its decisions in prose beside them: `Attribution.jsx` describes the uppercase
 * tag it *stopped* drawing, and a guard that read that as a violation would push the
 * reason out of the file it belongs in. `palette.test.mjs` strips the stylesheet the same
 * way and for the same reason.
 *
 * @param {string} text
 */
const withoutComments = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '');

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
      withoutComments(await readFile(file, 'utf8')),
    ])),
  );
}

/** @param {string} file */
const named = (file) => relative(ROOT, file).split(sep).join('/');

/** @param {[string, string][]} read @param {RegExp[]} patterns @param {(file: string) => boolean} [except] */
function sweep(read, patterns, except = () => false) {
  /** @type {string[]} */
  const caught = [];
  for (const [file, text] of read) {
    if (except(named(file))) continue;
    for (const [index, line] of text.split('\n').entries()) {
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          caught.push(`${named(file)}:${index + 1} — ${line.trim()}`);
        }
      }
    }
  }
  return caught;
}

/**
 * A capital letter is earned by a table's own heading row and by nothing else, so the
 * only spelling that passes is the descendant selector that reaches a `th`. That is a
 * stricter rule than "on a heading row", and deliberately: `<TableRow className="uppercase">`
 * shouts a heading row today and shouts whatever a later edit puts in the row tomorrow,
 * while `[&_th]:uppercase` cannot come to mean anything else.
 */
const A_SHOUTED_LABEL = [/(?<!\[&_th\]:)\buppercase\b/];

/**
 * Every badge says which of the four it is, because the list is closed and a list that is
 * only prose lasts one sprint. The attribute is what makes the list checkable: a sweep can
 * find `<Badge`, but only the badge itself can say what it is a badge *of*.
 *
 * It joins `data-wears`, `data-tone` and `data-bucket` as a name the interface publishes
 * for a thing it already draws — so an assertion does not depend on the class names or on
 * which element the badge happens to be.
 */
const BADGES = ['class', 'needs-attention', 'one-sided', 'priority'];

/** @param {string} text */
const badgeElements = (text) => text.match(/<Badge\b[\s\S]*?\/?>/g) ?? [];

describe('nothing carries weight it has not earned', () => {
  it('shouts only in a table heading', async () => {
    expect(sweep(await drawnFiles(), A_SHOUTED_LABEL)).toEqual([]);
  }, 30_000);

  it('names every badge it draws', async () => {
    const unnamed = (await drawnFiles())
      .filter(([file]) => named(file) !== THE_BADGE_PRIMITIVE)
      .flatMap(([file, text]) =>
        badgeElements(text)
          .filter((element) => !/\sdata-badge=/.test(element))
          .map(() => named(file)),
      );
    expect(unnamed).toEqual([]);
  }, 30_000);

  it('draws the four badges ADR 0019 holds, and no fifth', async () => {
    const drawn = new Set(
      (await drawnFiles()).flatMap(([, text]) =>
        [...text.matchAll(/\sdata-badge="([^"]+)"/g)].map(([, name]) => name),
      ),
    );
    // Listed rather than counted, because a sweep that found nothing at all would pass
    // an assertion about a length.
    expect([...drawn].sort()).toEqual(BADGES);
  }, 30_000);

  // Each guard has to be able to fail, or a pattern could be broken and this file would go
  // on reporting success.
  it('catches the shout a regression would write', () => {
    const shouted = [
      '  className="text-xs tracking-wide uppercase"',
      '  <TableRow className="uppercase">',
      "  cn('h-auto px-1.5 py-0.5 text-xs uppercase', className)",
    ];
    for (const line of shouted) {
      expect(
        A_SHOUTED_LABEL.some((p) => p.test(line)),
        line,
      ).toBe(true);
    }
  });

  it('leaves a heading-cell selector alone', () => {
    const kept = [
      '  <TableHeader className="[&_th]:text-xs [&_th]:tracking-wide [&_th]:uppercase">',
      "  const HEAD_TONE = '[&_th]:uppercase [&_th]:tracking-wide';",
      '  <span className="normal-case opacity-70">a head that undoes its own capitals</span>',
    ];
    for (const line of kept) {
      expect(
        A_SHOUTED_LABEL.some((p) => p.test(line)),
        line,
      ).toBe(false);
    }
  });

  // A badge spelled over several lines is the ordinary case in this interface, so the one
  // thing worth pinning about the matcher is that it does not stop at the first newline.
  it('finds a badge however many lines it is spelled over', () => {
    const drawn = `
      <Badge
        data-badge="class"
        variant={null}
      >
        {info.label}
      </Badge>`;
    expect(badgeElements(drawn)).toHaveLength(1);
  });
});
