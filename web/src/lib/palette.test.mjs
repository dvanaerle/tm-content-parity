import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ACCENT,
  BANNER,
  FILL,
  INK,
  PILL,
  SOLID,
  SURFACE,
  TOKEN,
  TONES,
  severityTone,
} from './palette.mjs';

/**
 * `palette.mjs` holds three rules with judgement in them, and the repo says a rule
 * with no test is not a rule. The thresholds are one. The second is the reservation
 * that makes the diff readable: red and green mean direction and never status. The
 * third is the vocabulary itself — ticket 131 settled which eight words the file may
 * use, and a ninth is a colour with no stated meaning.
 *
 * **Since ticket 132 those rules live in two places at once**, and this file guards both.
 * The maps below are the old form; `app.css` is the new one, where a tone is a selector
 * and a shape is a rule that consumes it. The stylesheet is the half that cannot check
 * itself: a map with two keys refuses a third, and a selector that does not match prints
 * nothing and throws nothing.
 */

// ---- the stylesheet, read as rules

const STYLESHEET = fileURLToPath(new URL('../styles/app.css', import.meta.url));

/**
 * Comments are stripped first. The block above the tone layer in `app.css` is prose about
 * tones and shapes, and a sweep that reads it would find whatever the prose quotes.
 */
const CSS = (await readFile(STYLESHEET, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * Every rule whose selector is made only of `data-tone` and `data-wears` attributes,
 * which is every rule the tone layer contains and nothing else in the file.
 *
 * It is a regex and not a parser because the shape of what it reads is fixed by the same
 * ticket: no nesting, one attribute vocabulary, and a selector list at most. `[^{}]*` for
 * the body is where that assumption lives, so a rule that ever nests another is skipped
 * rather than read.
 *
 * **Both ways of being skipped fail loud, which is why a regex is enough.** A missed tone
 * rule reads as a tone the stylesheet does not define, and a missed shape rule reads as a
 * shape it has no rule for — so the sweeps below report a valid `data-wears` as unknown
 * rather than passing over it. Every count here is asserted, never merely gathered.
 *
 * @returns {{ tone: string | null, wears: string | null, declarations: string }[]}
 */
function rulesOf(css) {
  const SELECTOR = /\[data-(?:tone|wears)='[a-z-]+'\]/;
  const RULE = new RegExp(
    `((?:${SELECTOR.source})+(?:\\s*,\\s*(?:${SELECTOR.source})+)*)\\s*\\{([^{}]*)\\}`,
    'g',
  );
  const PART = /\[data-(tone|wears)='([a-z-]+)'\]/g;

  return [...css.matchAll(RULE)].flatMap(([, selectors, declarations]) =>
    selectors.split(',').map((selector) => {
      const parts = Object.fromEntries(
        [...selector.matchAll(PART)].map(([, kind, value]) => [kind, value]),
      );
      return { tone: parts.tone ?? null, wears: parts.wears ?? null, declarations };
    }),
  );
}

const RULES = rulesOf(CSS);

/** What a tone declares, by tone. A rule with a shape in it is a shape's and not a tone's. */
const TONE_RULES = new Map(
  RULES.filter((rule) => rule.tone && !rule.wears).map((rule) => [rule.tone, rule.declarations]),
);

/**
 * Which tones each shape is granted to. A shape written without a tone in its selector is
 * **total** over the vocabulary and takes all eight; one written with a tone is sparse and
 * takes the tones it names. A shape can be both — the solid shape is total, and it names
 * `caution` again to say what that one prints instead.
 *
 * The prose here says *shape* and the code says *wears*, because
 * `anti-slop/no-shape-in-symbol-names` bans the substring in an identifier and the concept
 * is ADR 0007's. `app.css` carries the paragraph that reconciles the two.
 *
 * @type {Map<string, { total: boolean, named: Set<string> }>}
 */
const WEARERS = new Map();
for (const rule of RULES.filter((one) => one.wears)) {
  const seen = WEARERS.get(rule.wears) ?? { total: false, named: new Set() };
  if (rule.tone === null) seen.total = true;
  else seen.named.add(rule.tone);
  WEARERS.set(rule.wears, seen);
}

/**
 * A declaration block as the properties it sets, so two blocks can be compared on what they
 * declare rather than on how they are typed out.
 *
 * @returns {Map<string, string>}
 */
const declarationsOf = (block) =>
  new Map(
    [...block.matchAll(/(--[a-z-]+):\s*([^;]+);/g)].map(([, property, value]) => [
      property,
      value.trim(),
    ]),
  );

/** The tones a shape actually prints something for. */
const grantedTo = (wears) => {
  const seen = WEARERS.get(wears);
  if (!seen) return [];
  return seen.total ? [...TONES] : [...seen.named];
};

/**
 * Every map in the file that is **keyed by tone**. `CHROME` is the one that is not — its
 * keys are places in the interface, and it holds the brand colours a tone may never take —
 * so it is out of the guards below rather than missing from them.
 */
const MAPS = { PILL, SOLID, FILL, BANNER, INK, SURFACE, TOKEN, ACCENT };

describe('the tone vocabulary', () => {
  it('is these eight words and no others', () => {
    // Written out rather than counted, because the point of ticket 131 is *which*
    // eight. Four are generic because the hue is free, and four are the domain's
    // because it is not: `lost` and `added` are `CONTEXT.md`'s Direction, `closed`
    // is its bucket, and `total` is worn by any total.
    expect([...TONES]).toEqual([
      'lost',
      'added',
      'warning',
      'caution',
      'closed',
      'info',
      'neutral',
      'total',
    ]);
  });

  it('refuses a key that is not one of the eight', () => {
    // The guard ticket 131 asked for. A ninth tone is a colour with no stated
    // meaning, which is the drift this whole file exists to stop — and the maps are
    // deliberately sparse, so a typo in a key is otherwise a silent `undefined` at
    // the call site rather than a failure here.
    for (const [name, map] of Object.entries(MAPS)) {
      for (const key of Object.keys(map)) {
        // `FILL.secondary` is the one exception in the file: a progress track's brand
        // step, which is a fill and not a judgement about anything.
        if (map === FILL && key === 'secondary') continue;
        expect(TONES, `${name}.${key}`).toContain(key);
      }
    }
  });
});

/**
 * The guard above reads the maps, which is only half of ticket 131's *a test fails if a
 * tone outside the eight is used*: a tone is also **written at the call site**, and three
 * tables produce one without `palette.mjs` ever seeing the word — `BUCKET_TONE`,
 * `STATE` in `OverrideControl.jsx` and `PRIORITY_TONE` in `Chips.jsx`. A wrong word in any
 * of them is a `data-tone` no selector matches: a pill that draws with no colour, and
 * nothing throws.
 *
 * Since ticket 132 a tone is also written as a `data-tone` attribute for the stylesheet to
 * read, which fails the same silent way: a selector that does not match prints nothing and
 * throws nothing.
 *
 * So this sweeps the source text, the way `interface-language.test.mjs` sweeps it for
 * Dutch. Two of the three tables write `tone:` and are caught. **`PRIORITY_TONE` is not**,
 * because it keys its tones on the priority (`{ high: 'caution' }`) and a sweep for bare
 * quoted words would match every string in the interface. Its cover is
 * `data-tone={PRIORITY_TONE[priority]}` being read by a person, and that is the honest
 * limit of this test.
 */
describe('the tones written at a call site', () => {
  const ROOT = fileURLToPath(new URL('..', import.meta.url));
  const DRAWN = ['.jsx', '.mjs', '.astro', '.js'];

  /**
   * A tone reached off one of the maps by name, plus the three ways one is written at a
   * call site: as a table entry, as a string prop, and — since ticket 132, where a tone
   * became an attribute the stylesheet reads — inside a JSX expression. The last one needs
   * a lookbehind rather than a leading `tone={`, so that a ternary handing over two of them
   * is caught twice and not once.
   */
  const WRITTEN = [
    /\b(?:PILL|SOLID|FILL|BANNER|INK|SURFACE|TOKEN|ACCENT)\.([A-Za-z_$][\w$]*)/g,
    /\btone:\s*'([^']*)'/g,
    /\btone="([^"]*)"/g,
    /(?<=\btone=\{[^}]*)'([^']*)'/g,
  ];

  /** `FILL.secondary` is not a tone, and `palette.mjs` says why. */
  const ALLOWED = new Set([...TONES, 'secondary']);

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

  it('never names a tone the palette does not hold', async () => {
    const files = await filesUnder(ROOT);
    // The sweep has to actually sweep, or an empty list passes this whole block.
    expect(files.length).toBeGreaterThan(30);

    const read = await Promise.all(
      files.map(async (file) => /** @type {[string, string]} */ ([file, await readFile(file, 'utf8')])),
    );

    /** @type {string[]} */
    const caught = [];
    for (const [file, text] of read) {
      for (const [index, line] of text.split('\n').entries()) {
        for (const pattern of WRITTEN) {
          for (const [, name] of line.matchAll(pattern)) {
            if (!ALLOWED.has(name)) {
              caught.push(`${relative(ROOT, file)}:${index + 1} — ${name} — ${line.trim()}`);
            }
          }
        }
      }
    }

    expect(caught).toEqual([]);
  }, 30_000);

  /**
   * The same sweep for the other half of the pair. A shape is as silent as a tone when it
   * is wrong: `data-wears="chip"` matches no rule, prints nothing and throws nothing, and
   * the element looks like one somebody forgot to style rather than one they mistyped.
   *
   * It reads the shapes out of `app.css` rather than listing them here, so adding a shape
   * is one rule in one file and this test follows.
   */
  it('never names a shape the stylesheet has no rule for', async () => {
    const WRITTEN = [/\bdata-wears="([^"]*)"/g, /(?<=\bdata-wears=\{[^}]*)'([^']*)'/g];
    const files = await filesUnder(ROOT);
    const read = await Promise.all(
      files.map(async (file) => /** @type {[string, string]} */ ([file, await readFile(file, 'utf8')])),
    );

    /** @type {string[]} */
    const caught = [];
    /** @type {Set<string>} */
    const seen = new Set();
    for (const [file, text] of read) {
      for (const [index, line] of text.split('\n').entries()) {
        for (const pattern of WRITTEN) {
          for (const [, name] of line.matchAll(pattern)) {
            seen.add(name);
            if (!WEARERS.has(name)) {
              caught.push(`${relative(ROOT, file)}:${index + 1} — ${name} — ${line.trim()}`);
            }
          }
        }
      }
    }

    expect(caught).toEqual([]);
    // Listed rather than counted, because a sweep that found nothing at all would pass
    // every assertion above it. These are the shapes the interface wears today: the diff's
    // two, and the four ticket 133 part A moved the dashboard's views onto. The remaining
    // two — `solid`, which has no wearer, and `accent`, which the fix checkbox takes in
    // part B — join this list when they are worn.
    expect([...seen].sort()).toEqual(['banner', 'cell', 'fill', 'ink', 'pill', 'word']);
  }, 30_000);

  // And it has to be able to fail, or emptying the patterns would go on reporting success.
  it('catches the tone a rename would leave behind', () => {
    const stale = [
      '<Banner tone="severe">',
      "  contradicted: { tone: 'attention' },",
      'PILL.dark',
      "        tone={next === null ? 'severe' : null}",
    ];
    for (const line of stale) {
      const names = WRITTEN.flatMap((pattern) => [...line.matchAll(pattern)].map(([, name]) => name));
      expect(names.length, line).toBeGreaterThan(0);
      expect(names.some((name) => !ALLOWED.has(name)), line).toBe(true);
    }
  });

  // And leave the tones that are there alone.
  it('passes the call sites the interface actually has', () => {
    const live = [
      '<Banner tone="caution">',
      "  open: { tone: 'neutral' },",
      'FILL.secondary',
      "        tone={next === null ? 'lost' : null}",
    ];
    for (const line of live) {
      const names = WRITTEN.flatMap((pattern) => [...line.matchAll(pattern)].map(([, name]) => name));
      expect(names.length, line).toBeGreaterThan(0);
      expect(names.every((name) => ALLOWED.has(name)), line).toBe(true);
    }
  });
});

describe('severityTone', () => {
  it('reads no difference as closed, not as success', () => {
    // A page with nothing to answer for is blue. Green is `added` and it must not
    // also mean "done", or the dashboard and the diff disagree about the hue.
    expect(severityTone(0)).toBe('closed');
  });

  it('reads a minority of the page as caution and a majority as warning', () => {
    expect(severityTone(0.01)).toBe('caution');
    expect(severityTone(0.5)).toBe('caution');
    expect(severityTone(0.51)).toBe('warning');
    expect(severityTone(1)).toBe('warning');
  });

  it('never reads a share as a direction', () => {
    // However much of a page differs, the share is a status. An editor who saw the
    // bar go red would read the whole page as lost content.
    const shares = [0, 0.25, 0.5, 0.75, 1];
    for (const share of shares) {
      expect(['lost', 'added']).not.toContain(severityTone(share));
    }
  });
});

describe('the tone maps', () => {
  /** The six that are not a direction. `lost` and `added` are the other two. */
  const STATUS = ['warning', 'caution', 'closed', 'info', 'neutral', 'total'];

  /** The maps that answer for every tone. `INK` and the three below it are sparse. */
  const TOTAL = { PILL, SOLID, FILL, BANNER };

  it('answers for every tone in the maps that are total over them', () => {
    // Without this the guard above passes on an empty map, and so does the direction
    // rule below it — `map[tone] ?? ''` matches nothing when the tone is not there,
    // which is how a renamed key could go missing and still read as green.
    //
    // It is deliberately **not** a rule that every map is total. Ticket 131's trap says
    // the sparse maps are sparse on purpose and are not a bug to tidy, so `INK`, `SURFACE`,
    // `TOKEN` and `ACCENT` are outside this and stay the length their callers need.
    for (const [name, map] of Object.entries(TOTAL)) {
      expect(Object.keys(map).filter((key) => key !== 'secondary').sort(), name).toEqual(
        [...TONES].sort(),
      );
    }
  });

  it('spends the diff colours on direction only', () => {
    for (const map of [PILL, SOLID, FILL, BANNER, INK, ACCENT]) {
      for (const tone of STATUS) {
        expect(map[tone] ?? '').not.toMatch(/lost|added/);
      }
    }
  });

  it('gives warning and caution different pixels', () => {
    // They were the same string, so an error banner and a not-connected banner
    // printed the same shape and a reader could not tell which one they had.
    expect(BANNER.warning).not.toBe(BANNER.caution);
  });

  it('gives the fix checkbox two ticked colours and no direction', () => {
    // Ticket 36: ticked, and ticked-but-contradicted. A checkbox reports work, so
    // neither of the two may be the red or the green of the diff.
    expect(Object.keys(ACCENT)).toEqual(['closed', 'caution']);
  });

  it('tints a whole cell for the two directions and for nothing else', () => {
    // `SURFACE` is the row layer of the diff. A tinted cell claims the content is
    // missing on the other side, which only `lost` and `added` claim.
    expect(Object.keys(SURFACE)).toEqual(['lost', 'added']);
    expect(Object.keys(TOKEN)).toEqual(['lost', 'added']);
  });
});

/**
 * The stylesheet, guarded (ticket 132).
 *
 * `app.css` is where a tone becomes a styleguide colour now, and the two rules with
 * judgement in them moved with it: direction is never spent on status, and the two ambers
 * must not print the same pixels. Neither is a rule CSS can enforce about itself, and the
 * failure mode is worse than the maps' — `SURFACE.warning` was `undefined` and a reader
 * saw it, whereas a selector that matches nothing draws nothing and reports nothing.
 */
describe('the tones the stylesheet defines', () => {
  /** The six that are not a direction. `lost` and `added` are the other two. */
  const STATUS = ['warning', 'caution', 'closed', 'info', 'neutral', 'total'];

  it('is the same eight words the palette holds', () => {
    // Both directions: a tone in the stylesheet that the vocabulary does not hold is a
    // colour with no stated meaning, and a tone in the vocabulary the stylesheet has no
    // rule for is a component that will ask for it and get nothing.
    expect([...TONE_RULES.keys()].sort()).toEqual([...TONES].sort());
  });

  it('gives every tone a ground and an ink, so the shapes that are total answer for all eight', () => {
    // The pill and the banner have no per-tone rule to fall back on. A tone missing either
    // half of the pair is a label with no colour, or one with no legible words on it.
    for (const [tone, declarations] of TONE_RULES) {
      expect(declarations, `${tone} ground`).toMatch(/--tone-ground:/);
      expect(declarations, `${tone} ink`).toMatch(/--tone-ink:/);
    }
  });

  it('spends the direction colours on direction only', () => {
    // The rule that makes the diff readable, checked on the new form: red shows a loss and
    // nothing else. It reads the whole declaration block, so a status tone reaching for
    // `--color-danger` at any weight is caught, not only one taking it as a ground.
    for (const tone of STATUS) {
      expect(TONE_RULES.get(tone), tone).not.toMatch(/danger|success/);
    }
  });

  it('gives warning and caution different pixels', () => {
    /*
     * A banner reporting a failure and a banner reporting a condition must not print the
     * same shape, or a reader cannot tell which of the two they have.
     *
     * It compares the two blocks **property by property** and not as text. Comparing the
     * declaration strings would go green on two blocks that differ only in whitespace or
     * in a property no shape reads, which is a test that says *pixels* and checks
     * formatting. So the difference has to be in a property a shape actually consumes, and
     * the two named below are where it is: the bar fill, and the ink that decides whether
     * the banner may take the solid ground at all.
     */
    const warning = declarationsOf(TONE_RULES.get('warning'));
    const caution = declarationsOf(TONE_RULES.get('caution'));

    const differ = [...warning.keys(), ...caution.keys()].filter(
      (property) => warning.get(property) !== caution.get(property),
    );
    expect([...new Set(differ)].sort()).toEqual(['--tone-fill', '--tone-line', '--tone-on-solid']);
  });

  it('leaves the quiet amber no ink for its solid step, and says so by omission', () => {
    // The irregularity, written as an absence rather than as a lie. `caution` has a solid
    // step — a banner borders with it and a bar fills with it — and nothing legible sits on
    // it, so the solid shape has its own rule for this one tone.
    expect(TONE_RULES.get('caution')).toMatch(/--tone-solid:/);
    expect(TONE_RULES.get('caution')).not.toMatch(/--tone-on-solid:/);
    expect(WEARERS.get('solid').named).toEqual(new Set(['caution']));
  });
});

describe('the shapes the stylesheet defines', () => {
  it('keeps the sparse shapes sparse', () => {
    /*
     * The irregularity is the decision, and this is the test that says so. A tidy
     * eight-by-eight product would give the ink shape four tones nobody asked for and the
     * diff's two shapes six tones they must never have, and it would look tidier for it.
     */
    expect(grantedTo('ink').sort()).toEqual(['added', 'caution', 'info', 'lost']);
    expect(grantedTo('accent').sort()).toEqual(['caution', 'closed']);
  });

  it('grants a cell tint and a word mark to the two directions and to nothing else', () => {
    // This is the assertion the two-key map used to make. A tinted cell claims the content
    // is missing on the other side, and only `lost` and `added` claim that.
    // `Diff.browser.test.mjs` holds the other half: that the component emits no third word.
    expect(grantedTo('cell').sort()).toEqual(['added', 'lost']);
    expect(grantedTo('word').sort()).toEqual(['added', 'lost']);
  });

  it('answers for every tone in the shapes that are total over them', () => {
    // Without this the guards above pass on a shape that lost its rule: a pill with no
    // declaration matches nothing for all eight tones equally.
    for (const wears of ['pill', 'solid', 'fill', 'banner']) {
      expect(WEARERS.get(wears)?.total, wears).toBe(true);
    }
  });
});
