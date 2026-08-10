import { describe, expect, it } from 'vitest';
import {
  NO_FILTER,
  isNarrowed,
  onlyDifferencesState,
  outlineFrom,
  pagesWithClasses,
  prepareRows,
  rowKeyFromHash,
  toggleClass,
  toggleIn,
} from './view.mjs';

/**
 * Ticket 36 puts the whole page in one view and then lets an editor narrow it. The
 * narrowing is where the judgement is, so it is a pure module and this file is the
 * rule.
 *
 * The one rule that outranks every other here: **a filter never moves a count.**
 * `prepareRows` is given the derived findings and it reads them; it returns no bar,
 * no denominator and no total that a bar could be built from. The tests below
 * assert that shape as well as the behaviour.
 */

/**
 * `index` is ticket 34's shared counter: the position of the unit in the document,
 * over the images and the links as well. It is deliberately not the position in the
 * `elements` array here, because the anchor key must read the document and not the
 * array.
 *
 * @param {Partial<{ tag: string, kind: string, level: number | null, raw: string, index: number }>} part
 */
const unit = (part) => ({
  tag: 'p', kind: 'text', level: null, raw: part.raw ?? 'tekst', norm: part.raw ?? 'tekst', ...part,
});

const heading = (raw, level = 2, index = 0) => unit({ tag: `h${level}`, kind: 'heading', level, raw, index });

/**
 * Production: a heading, a paragraph that changed, a paragraph that matches, and a
 * paragraph the new site lost. The new site has the first three.
 */
const fixture = () => ({
  elements: {
    production: [
      heading('Kleuren', 2, 3),
      unit({ raw: 'Verkrijgbaar in drie kleuren', index: 5 }),
      unit({ raw: 'Gelijk', index: 8 }),
      unit({ raw: 'Weg', index: 11 }),
    ],
    new: [
      heading('Kleuren', 2, 2),
      unit({ raw: 'Beschikbare kleuren', index: 4 }),
      unit({ raw: 'Gelijk', index: 6 }),
    ],
  },
  rows: [
    { class: null, prod: 0, new: 0, score: null, finding: null },
    { class: 'copy', prod: 1, new: 1, score: 0.7, finding: 'copy1' },
    { class: null, prod: 2, new: 2, score: null, finding: null },
    { class: 'text-missing', prod: 3, new: null, score: null, finding: 'lost1' },
  ],
  findings: [
    { id: 'copy1', class: 'copy', shown: true, state: 'open', occurrences: 1 },
    { id: 'lost1', class: 'text-missing', shown: true, state: 'open', occurrences: 1 },
  ],
});

/**
 * A jump is a request to read one row, so the row it lands on opens (ticket 68).
 * This is the rule at the seam: the browser holds the hash, and the view has to know
 * which row that hash names — and which hash names no row at all.
 */
describe('rowKeyFromHash', () => {
  it('names the row a hash link jumps to', () => {
    expect(rowKeyFromHash('#p11')).toBe('p11');
    expect(rowKeyFromHash('#n4')).toBe('n4');
  });

  it('names no row when the hash is not a row anchor', () => {
    // A page carries other anchors. A hash that is not one of ours must open
    // nothing rather than open the first row.
    expect(rowKeyFromHash('')).toBeNull();
    expect(rowKeyFromHash('#')).toBeNull();
    expect(rowKeyFromHash('#taken')).toBeNull();
    expect(rowKeyFromHash('#r3')).toBeNull();
    expect(rowKeyFromHash(undefined)).toBeNull();
  });
});

describe('prepareRows', () => {
  it('shows the whole page in document order, matched rows included', () => {
    // Decision 18 of spec 32. A tint only reads as a signal against untinted
    // baseline, so the default view is the page and not the complaints.
    const { rows } = prepareRows({ ...fixture(), filter: NO_FILTER, showNoise: false });

    expect(rows.map((row) => row.prod?.raw ?? null)).toEqual([
      'Kleuren', 'Verkrijgbaar in drie kleuren', 'Gelijk', 'Weg',
    ]);
  });

  it('resolves each side to its unit, and to null where the side has none', () => {
    const { rows } = prepareRows({ ...fixture(), filter: NO_FILTER, showNoise: false });
    const lost = rows.at(-1);

    expect(lost.prod.raw).toBe('Weg');
    expect(lost.new).toBeNull();
  });

  it('attaches the derived finding, so a row can be ticked off', () => {
    const { rows } = prepareRows({ ...fixture(), filter: NO_FILTER, showNoise: false });

    expect(rows[1].finding.id).toBe('copy1');
    expect(rows[0].finding).toBeNull();
  });

  it('drops the matched rows when the editor asks for differences only', () => {
    const filter = { ...NO_FILTER, onlyDifferences: true };
    const { rows } = prepareRows({ ...fixture(), filter, showNoise: false });

    expect(rows.map((row) => row.class)).toEqual(['copy', 'text-missing']);
  });

  it('narrows to the selected classes, and to those only', () => {
    // The whole point: a pass of nothing but copy edits.
    const filter = { ...NO_FILTER, classes: ['copy'] };
    const { rows } = prepareRows({ ...fixture(), filter, showNoise: false });

    expect(rows.map((row) => row.class)).toEqual(['copy']);
  });

  it('takes several classes at once', () => {
    const filter = { ...NO_FILTER, classes: ['copy', 'text-missing'] };
    const { rows } = prepareRows({ ...fixture(), filter, showNoise: false });

    expect(rows).toHaveLength(2);
  });

  it('hides a class the tool does not show, until the noise toggle is on', () => {
    const base = fixture();
    base.rows.push({ class: 'text-added', prod: null, new: 2, score: null, finding: 'added1' });
    base.findings.push({ id: 'added1', class: 'text-added', shown: false, state: 'open', occurrences: 1 });

    expect(prepareRows({ ...base, filter: NO_FILTER, showNoise: false }).rows).toHaveLength(4);
    expect(prepareRows({ ...base, filter: NO_FILTER, showNoise: true }).rows).toHaveLength(5);
  });

  it('keeps a muted row behind the same toggle, because muting is not deleting', () => {
    const base = fixture();
    base.findings[0] = { ...base.findings[0], state: 'muted' };

    expect(prepareRows({ ...base, filter: NO_FILTER, showNoise: false }).rows).toHaveLength(3);
    expect(prepareRows({ ...base, filter: NO_FILTER, showNoise: true }).rows).toHaveLength(4);
  });

  it('says of a row that the two sides are already equal', () => {
    // Ticket 68, and the largest saving in the content view: 78% of the whole word
    // diff over 448 reports was rows that agree, because the view asked for a diff
    // of two identical strings. They are also the longest rows, because they hold
    // the untouched paragraphs.
    const { rows } = prepareRows({ ...fixture(), filter: NO_FILTER, showNoise: false });

    expect(rows.map((row) => row.equal)).toEqual([true, false, true, false]);
  });

  it('keys a row on the position of its unit in the document', () => {
    // Ticket 68. The key was the index in the row list, so a row that appeared
    // above this one — a paragraph the new site invented — renamed every anchor
    // below it and carried every hash link to the wrong row. Ticket 79 changes
    // which rows the view holds, so the key has to name something the view does
    // not decide: where the unit is in the document.
    const before = prepareRows({ ...fixture(), filter: NO_FILTER, showNoise: false });

    const withInvented = fixture();
    withInvented.rows.unshift({ class: 'text-added', prod: null, new: 0, score: null, finding: null });
    const after = prepareRows({ ...withInvented, filter: NO_FILTER, showNoise: true });

    const keyOf = (rows, raw) => rows.find((row) => row.prod?.raw === raw).key;
    expect(keyOf(after.rows, 'Weg')).toBe(keyOf(before.rows, 'Weg'));
  });

  it('keeps a production key and a new-site key apart', () => {
    // A row the new site invented has no production position, and the two
    // documents count on their own. Two rows must never take one anchor.
    const base = fixture();
    base.rows.push({ class: 'text-added', prod: null, new: 0, score: null, finding: null });

    const { rows } = prepareRows({ ...base, filter: NO_FILTER, showNoise: true });
    expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
  });

  it('reports how much of the page is on screen, so a filter is never invisible', () => {
    const filter = { ...NO_FILTER, classes: ['copy'] };
    const narrowed = prepareRows({ ...fixture(), filter, showNoise: false });

    expect(narrowed.rows).toHaveLength(1);
    expect(narrowed.total).toBe(4);
  });

  it('offers every class on the page as a filter, whatever the filter already is', () => {
    // The chips must not disappear as they are ticked, or the filter cannot be
    // widened again without clearing it first.
    const filter = { ...NO_FILTER, classes: ['copy'] };
    const { classes } = prepareRows({ ...fixture(), filter, showNoise: false });

    expect(classes).toEqual([
      { class: 'copy', rows: 1 },
      { class: 'text-missing', rows: 1 },
    ]);
  });

  it('never returns a count a bar could be built from', () => {
    // Decision 25 of spec 32. Two people quoting "the number" must mean the same
    // number, so nothing here may look like a denominator.
    const narrowed = prepareRows({ ...fixture(), filter: { ...NO_FILTER, classes: ['copy'] }, showNoise: false });

    expect(Object.keys(narrowed).sort()).toEqual(['classes', 'rows', 'total']);
    // `total` is rows on the page, and the page has 4 rows against 2 findings. A
    // reader cannot mistake it for the bar's denominator.
    expect(narrowed.total).not.toBe(fixture().findings.length);
  });
});

describe('the filter itself', () => {
  it('starts as no filter at all', () => {
    expect(isNarrowed(NO_FILTER)).toBe(false);
  });

  it('is narrowed by a class and by the differences-only switch alike', () => {
    expect(isNarrowed({ ...NO_FILTER, classes: ['copy'] })).toBe(true);
    expect(isNarrowed({ ...NO_FILTER, onlyDifferences: true })).toBe(true);
  });

  it('adds and removes a class without touching the rest of the filter', () => {
    const on = toggleClass({ onlyDifferences: true, classes: [] }, 'copy');
    expect(on).toEqual({ onlyDifferences: true, classes: ['copy'] });

    expect(toggleClass(on, 'copy').classes).toEqual([]);
  });

  it('leaves the filter it was given alone', () => {
    const held = { ...NO_FILTER };
    toggleClass(held, 'copy');
    expect(held.classes).toEqual([]);
  });
});

describe('onlyDifferencesState', () => {
  // The control must report the view it is over. `prepareRows` drops every matched
  // row as soon as a class is on, so an unticked box beside a class pill would say
  // "you are seeing the whole page" over a differences-only view.
  it('is off and live when no class is on', () => {
    expect(onlyDifferencesState(NO_FILTER)).toEqual({ checked: false, disabled: false });
  });

  it('is on and live when the editor ticked it', () => {
    expect(onlyDifferencesState({ onlyDifferences: true, classes: [] }))
      .toEqual({ checked: true, disabled: false });
  });

  it('is on and dead while a class filter implies it', () => {
    expect(onlyDifferencesState({ onlyDifferences: false, classes: ['copy'] }))
      .toEqual({ checked: true, disabled: true });
  });

  it('matches what prepareRows does: a class filter leaves no matched row', () => {
    const filter = { onlyDifferences: false, classes: ['copy'] };
    const { rows } = prepareRows({ ...fixture(), filter, showNoise: false });

    expect(rows.every((row) => row.class)).toBe(true);
    expect(onlyDifferencesState(filter).checked).toBe(true);
  });
});

describe('toggleIn', () => {
  // The dashboard holds a bare class list and the content view holds a whole filter.
  // The set operation is shared so that the dashboard does not have to invent an
  // `onlyDifferences` it has no use for.
  it('adds an absent item and removes a held one', () => {
    expect(toggleIn(['copy'], 'casing')).toEqual(['copy', 'casing']);
    expect(toggleIn(['copy', 'casing'], 'copy')).toEqual(['casing']);
  });

  it('leaves the list it was given alone', () => {
    const held = ['copy'];
    toggleIn(held, 'casing');
    expect(held).toEqual(['copy']);
  });
});

describe('outlineFrom', () => {
  it('is the headings of what is on screen, in order', () => {
    // Decision 19: Outline stops being a tab and becomes navigation. It is derived
    // from the rendered rows, so a narrowed view never offers a jump to a row that
    // is filtered away.
    const { rows } = prepareRows({ ...fixture(), filter: NO_FILTER, showNoise: false });
    const outline = outlineFrom(rows);

    expect(outline).toEqual([{ key: rows[0].key, level: 2, text: 'Kleuren' }]);
  });

  it('takes a heading the new site alone has, so an invented section is reachable', () => {
    const base = fixture();
    base.elements.new.push(heading('Nieuw kopje', 3));
    base.rows.push({ class: 'text-added', prod: null, new: 3, score: null, finding: 'added1' });
    base.findings.push({ id: 'added1', class: 'text-added', shown: false, state: 'open', occurrences: 1 });

    const { rows } = prepareRows({ ...base, filter: NO_FILTER, showNoise: true });
    expect(outlineFrom(rows).map((entry) => entry.text)).toEqual(['Kleuren', 'Nieuw kopje']);
  });

  it('gives an unlevelled heading the deepest level rather than none', () => {
    const base = fixture();
    base.elements.production[0] = { ...base.elements.production[0], level: null };

    const { rows } = prepareRows({ ...base, filter: NO_FILTER, showNoise: false });
    expect(outlineFrom(rows)[0].level).toBe(6);
  });
});

describe('pagesWithClasses', () => {
  const pages = [
    { page: 'a', summary: { byClass: { copy: 3, casing: 1 } } },
    { page: 'b', summary: { byClass: { casing: 2 } } },
    { page: 'c', summary: { byClass: {} } },
  ];

  it('is every page when nothing is selected', () => {
    expect(pagesWithClasses(pages, [])).toHaveLength(3);
  });

  it('keeps a page that carries any of the selected classes', () => {
    expect(pagesWithClasses(pages, ['copy']).map((page) => page.page)).toEqual(['a']);
    expect(pagesWithClasses(pages, ['copy', 'casing']).map((page) => page.page)).toEqual(['a', 'b']);
  });

  it('drops a page whose count for the class is zero rather than absent', () => {
    const zero = [{ page: 'd', summary: { byClass: { copy: 0 } } }];
    expect(pagesWithClasses(zero, ['copy'])).toEqual([]);
  });
});
