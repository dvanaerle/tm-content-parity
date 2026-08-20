import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * A language declaration is a fact about **content** (ticket 125).
 *
 * ADR 0014 keeps one interface language and ticket 124 made it English. This is the other
 * half of that: the chrome's language and the content's language are two different facts,
 * and only the second one is written on an element. The mounted components pin where the
 * attribute lands; what a sweep can pin is the **shape** of every one of them at once, which
 * is the half that rots — a hand-written `lang="nl"`, an `hreflang` on a store link, a `lang`
 * on an editor's note, a per-store chrome string hung on the same seam.
 *
 * It follows `interface-language.test.mjs` next to it, which is this repo's habit for a rule
 * that can be read off the source rather than paid for with a standing screenshot suite.
 */

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const DRAWN = ['.jsx', '.astro'];

/**
 * The one language a declaration may name **literally**.
 *
 * A `lang={…}` binding is allowed whatever it is called: it is a value the component was
 * handed, and `STORE_LANGUAGE` is the single derivation behind it. A quoted language is the
 * failure this sweeps for — `lang="nl"` on a cell, `lang="de"` on a heading — with the one
 * exception being the interface saying, from inside a content cell, that it is not part of
 * it. So the rule is *derived, or English by name*, and nothing in between.
 */
const SPOKEN_LITERAL = 'en-GB';

/** @param {string} text */
const withoutComments = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '');

/** @type {Promise<[string, string][]> | null} */
let read = null;

/**
 * Every file the interface is drawn in, read once for the whole file. The sweeps below ask
 * two questions of the same bytes, and reading the tree twice is the cost of asking them
 * separately.
 *
 * @returns {Promise<[string, string][]>}
 */
function drawnFiles() {
  read ??= (async () => {
    const entries = await readdir(ROOT, { recursive: true, withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile() && DRAWN.includes(extname(entry.name)))
      .map((entry) => join(entry.parentPath, entry.name));
    // The sweep has to actually sweep.
    expect(files.length).toBeGreaterThan(15);
    return Promise.all(
      files.map(async (file) => /** @type {[string, string]} */ ([
        relative(ROOT, file).split(sep).join('/'),
        withoutComments(await readFile(file, 'utf8')),
      ])),
    );
  })();
  return read;
}

describe('a language declaration is a fact about content', () => {
  it('is derived from the store, or it is the interface naming English', async () => {
    const drawn = await drawnFiles();

    const written = drawn.flatMap(([file, text]) =>
      [...text.matchAll(/\blang=(?:"[^"]*"|\{[^}]*\})/g)].map((match) => `${file} — ${match[0]}`),
    );

    // Declarations exist, so an empty list would mean the matcher broke rather than the rule
    // holding: there are content cells and there is a shell.
    expect(written.length).toBeGreaterThan(6);
    const quoted = written.filter((one) => one.includes('lang="'));
    expect(quoted.filter((one) => !one.endsWith(`lang="${SPOKEN_LITERAL}"`))).toEqual([]);
  });

  /**
   * The prop reaches every caller, which is the half neither a type nor a sweep of the
   * attribute can see: these are `.jsx`, `tsc` does not check a JSX prop here, and a caller
   * that forgot the language would have React omit the attribute and throw nothing — the
   * silent hole the build guard on `STORE_LANGUAGE` exists to refuse one step earlier.
   */
  it('is handed to every caller of the two components that draw compared text', async () => {
    const drawn = await drawnFiles();

    // The opening tag and the 400 characters after it, rather than a match to the closing
    // slash: two callers pass an element as a prop, so the first `/>` after the tag is
    // sometimes an inner one.
    const calls = drawn.flatMap(([file, text]) =>
      [...text.matchAll(/<(?:DiffCells|Comparison)/g)].map(
        (match) => /** @type {[string, string]} */ ([
          `${file} — ${match[0]}`,
          text.slice(match.index, match.index + 400),
        ]),
      ),
    );

    expect(calls.length).toBeGreaterThan(4);
    expect(calls.filter(([, call]) => !call.includes('language=')).map(([at]) => at)).toEqual([]);
  });

  it('is never hung on an hreflang or a locale', async () => {
    const drawn = await drawnFiles();

    // `hreflang` is production's word for the same fact and the temptation is real: the
    // derivation reads it. On an element here it would be a claim about the *linked*
    // document, which is not a claim this log is in a position to make. `locale` is the
    // other direction — the word the i18n machinery this ticket refuses would arrive under.
    const reached = drawn.filter(([, text]) => /hreflang|xml:lang|\blocale\b/i.test(text));
    expect(reached.map(([file]) => file)).toEqual([]);
  });
});

/**
 * The page key, drawn twice and declaring nothing either time (ticket 125).
 *
 * The breadcrumb's last rung and the `<h1>` draw the same string on purpose — one says *you
 * are here* and the other says what the document is called — so tagging one and not the other
 * is a half-implementation. Neither is tagged: a url key is an identifier, not prose.
 * `lang="nl"` would make the one non-content element on a `/de/` page the loudest language
 * claim on it, and `lang="en-GB"` would assert that a Dutch slug is English. The accepted cost
 * is stated rather than hidden — a Dutch slug read with English phonetics is mildly garbled.
 *
 * The rung is asserted where it is drawn, in `PageBreadcrumb.browser.test.mjs`. What is left
 * for source is the `<h1>`, which is Astro's and mounts nowhere, and the half neither test
 * can see alone: that the two draw **one** string.
 */
describe('the page key', () => {
  const PAGE_ROUTE = 'pages/[store]/[...page].astro';

  it('is the same string in the heading and in the breadcrumb, and declares no language', async () => {
    const route = withoutComments(await readFile(join(ROOT, PAGE_ROUTE), 'utf8'));

    expect(route).toMatch(/<h1[^>]*>\{report\.page\}<\/h1>/);
    expect(route).toMatch(/<PageBreadcrumb[^>]*page=\{report\.page\}/);
    expect(route).not.toMatch(/<h1[^>]*lang/);
  });
});
