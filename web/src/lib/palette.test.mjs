import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TONES, severityTone } from './palette.mjs';

/**
 * Three rules with judgement in them, and the repo says a rule with no test is not a
 * rule. The thresholds are one. The second is the reservation that makes the diff
 * readable: red and green mean direction and never status. The third is the vocabulary
 * itself — ticket 131 settled which eight words this tool may use, and a ninth is a
 * colour with no stated meaning.
 *
 * **This is the one guard now (ticket 133 part C).** The rules lived in two places while
 * the tone maps and the stylesheet were both live; the maps are deleted, so every
 * assertion here reads `TONES`, `severityTone()` or `app.css`. The stylesheet is the half
 * that cannot check itself, and it is the only half left: a map with two keys refused a
 * third, and a selector that does not match prints nothing and throws nothing.
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
  // A shape may also key on a state the primitive publishes — the ticked checkbox is the one
  // that does, and ticket 133 part B is where that stopped being a hand-written
  // `data-checked:` prefix. It is read as part of the selector and contributes no tone and no
  // shape, so the rule below is parsed rather than skipped.
  const SELECTOR = /\[data-(?:tone|wears)='[a-z-]+'\]|\[data-checked\]/;
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
 * The list is here and the colours are not, so this block asserts *which eight words* and
 * nothing about what they print. The other half of ticket 131's guard — that no **ninth**
 * word is ever given a colour — is `the tones the stylesheet defines` at the foot of this
 * file. It was a sweep over the maps' keys while the maps held the colours; the tone rules
 * in `app.css` hold them now, and that block asserts the two lists are the same set in
 * both directions.
 */
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
});

/**
 * The guard above reads one list, which is only half of ticket 131's *a test fails if a
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
   * The three ways a tone is written at a call site: as a table entry, as a string prop,
   * and — since ticket 132, where a tone became an attribute the stylesheet reads — inside
   * a JSX expression. The last one needs a lookbehind rather than a leading `tone={`, so
   * that a ternary handing over two of them is caught twice and not once.
   *
   * A fourth pattern read a tone off one of the maps by name, `PILL.dark` and its kind. It
   * went with the maps in ticket 133 part C: there is no map to reach a tone off any more,
   * so that spelling is a build error rather than a colour with no meaning. The exception
   * the pattern carried went with it — `FILL.secondary` was a progress track's brand step
   * and never a tone, and the track wears the class itself now.
   */
  const WRITTEN = [
    /\btone:\s*'([^']*)'/g,
    /\btone="([^"]*)"/g,
    /(?<=\btone=\{[^}]*)'([^']*)'/g,
  ];

  const ALLOWED = new Set(TONES);

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
    // two, the four ticket 133 part A moved the dashboard's views onto, and the tick part B
    // moved the fix checkbox onto. `solid` is the one shape with no wearer, and it stays
    // defined for the reason `app.css` gives beside it — a number that must be legible at
    // a distance — so a component asking for it gets pixels rather than silence.
    expect([...seen].sort()).toEqual(['banner', 'cell', 'fill', 'ink', 'pill', 'tick', 'word']);
  }, 30_000);

  // And it has to be able to fail, or emptying the patterns would go on reporting success.
  it('catches the tone a rename would leave behind', () => {
    const stale = [
      '<Banner tone="severe">',
      "  contradicted: { tone: 'attention' },",
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

/**
 * The stylesheet, guarded (ticket 132, and the only form left since ticket 133 part C).
 *
 * `app.css` is where a tone becomes a styleguide colour, and the two rules with judgement
 * in them moved with it: direction is never spent on status, and the two ambers must not
 * print the same pixels. Neither is a rule CSS can enforce about itself, and the failure
 * mode is worse than the maps' was — `SURFACE.warning` was `undefined` and a reader saw
 * it, whereas a selector that matches nothing draws nothing and reports nothing. The
 * assertions the two-key maps used to make are the ones below about which tones a shape
 * is granted to.
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
    // The tick's two are the fix checkbox's three visual states less the unticked one: a
    // claim that stands, and a claim a later observation contradicted. `added` for the first
    // is the interface's one recorded exception to *no status wears a diff hue*, taken on
    // preference in 2026 and written down in `app.css` beside the blue it would otherwise
    // take — so it is asserted here rather than left to look like drift.
    expect(grantedTo('tick').sort()).toEqual(['added', 'caution']);
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
