import { describe, expect, it } from 'vitest';
import {
  NO_FILTER,
  findingsIn,
  isNarrowed,
  onlyDifferencesState,
  outlineFrom,
  pagesWithClasses,
  pagesWithPriorities,
  groupRepeatsByClass,
  prepareRows,
  repeatsInStore,
  repeatsWithClasses,
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
  tag: 'p',
  kind: 'text',
  level: null,
  raw: part.raw ?? 'tekst',
  norm: part.raw ?? 'tekst',
  ...part,
});

const heading = (raw, level = 2, index = 0) =>
  unit({ tag: `h${level}`, kind: 'heading', level, raw, index });

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
    { id: 'copy1', class: 'copy', visibility: 'work', state: 'open', occurrences: 1 },
    { id: 'lost1', class: 'text-missing', visibility: 'work', state: 'open', occurrences: 1 },
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
      'Kleuren',
      'Verkrijgbaar in drie kleuren',
      'Gelijk',
      'Weg',
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

  it('hides a diagnostic class until the noise toggle is on', () => {
    const base = fixture();
    base.rows.push({ class: 'tag-changed', prod: null, new: 2, score: null, finding: 'tag1' });
    base.findings.push({
      id: 'tag1',
      class: 'tag-changed',
      visibility: 'diagnostic',
      state: 'open',
      occurrences: 1,
    });

    expect(prepareRows({ ...base, filter: NO_FILTER, showNoise: false }).rows).toHaveLength(4);
    expect(prepareRows({ ...base, filter: NO_FILTER, showNoise: true }).rows).toHaveLength(5);
  });

  it('draws an information row with the toggle off, because it is not noise', () => {
    // Ticket 75. `information` is the half of the old hidden side that an editor may
    // want to read: it is drawn beside the work and it counts nowhere. Only the
    // `diagnostic` half is behind the toggle, and the toggle never moves this row.
    const base = fixture();
    base.rows.push({ class: 'text-added', prod: null, new: 2, score: null, finding: 'added1' });
    base.findings.push({
      id: 'added1',
      class: 'text-added',
      visibility: 'information',
      state: 'open',
      occurrences: 1,
    });

    expect(prepareRows({ ...base, filter: NO_FILTER, showNoise: false }).rows).toHaveLength(5);
    expect(prepareRows({ ...base, filter: NO_FILTER, showNoise: true }).rows).toHaveLength(5);
  });

  it('hides a row whose class the derivation could not name, as a diagnostic', () => {
    // `visibilityOf()` answers `diagnostic` for a name the vocabulary does not hold, so a
    // row that arrives without a derived finding stays behind the toggle rather than
    // appearing as work. That is what `!finding?.shown` did before ticket 75.
    const base = fixture();
    base.rows.push({ class: 'copy', prod: null, new: 2, score: null, finding: 'gone1' });

    expect(prepareRows({ ...base, filter: NO_FILTER, showNoise: false }).rows).toHaveLength(4);
    expect(prepareRows({ ...base, filter: NO_FILTER, showNoise: true }).rows).toHaveLength(5);
  });

  it('draws a row in a work class whatever the log decided about it', () => {
    // The toggle asks about the **class**, and after ADR 0011 that is all it asks.
    // A diagnostic row stays behind the toggle; a decided row in a work class is not
    // noise and was never behind this toggle to begin with.
    const base = fixture();
    base.findings[0] = { ...base.findings[0], state: 'dismissed' };

    expect(prepareRows({ ...base, filter: NO_FILTER, showNoise: false }).rows).toHaveLength(4);
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
    withInvented.rows.unshift({
      class: 'text-added',
      prod: null,
      new: 0,
      score: null,
      finding: null,
    });
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

  it('says of an information row that it cannot be decided', () => {
    // Ticket 86. `CONTEXT.md` says an `information` finding exactly: **a finding you can
    // link to and cannot decide.** It keeps its id, because somebody may have to be sent
    // to it, and it carries no override control, because a dismissal says "these two
    // exact strings are acceptable" and nothing is being asked.
    //
    // The row reads it off `canDecide()` in `classes.mjs`, which asks the visibility and
    // never the class name. Written as a special case for `heading-level` it would have to
    // be built a second time for ticket 116.
    const base = fixture();
    base.rows.push({ class: 'heading-level', prod: 0, new: 0, score: null, finding: 'level1' });
    base.findings.push({
      id: 'level1',
      class: 'heading-level',
      visibility: 'information',
      state: 'open',
      occurrences: 1,
      detail: 'h2 → h3',
    });

    const { rows } = prepareRows({ ...base, filter: NO_FILTER, showNoise: false });
    const level = rows.find((row) => row.class === 'heading-level');

    expect(level.decidable).toBe(false);
    // It is still on screen, it still has its finding, and the finding still has its
    // detail. Rendered, not counted — and not deleted.
    expect(level.finding.id).toBe('level1');
    expect(level.finding.detail).toBe('h2 → h3');
  });

  it('says of a work row that it can be decided, and of a diagnostic row as well', () => {
    // The gate is `information` and nothing wider. A diagnostic row is behind *Ruis
    // tonen*, and what the author of a rule sees there is not this ticket's subject —
    // it keeps the control it has today.
    const base = fixture();
    base.rows.push({ class: 'tag-changed', prod: null, new: 2, score: null, finding: 'tag1' });
    base.findings.push({
      id: 'tag1',
      class: 'tag-changed',
      visibility: 'diagnostic',
      state: 'open',
      occurrences: 1,
    });

    const { rows } = prepareRows({ ...base, filter: NO_FILTER, showNoise: true });

    expect(rows.find((row) => row.class === 'copy').decidable).toBe(true);
    expect(rows.find((row) => row.class === 'text-missing').decidable).toBe(true);
    expect(rows.find((row) => row.class === 'tag-changed').decidable).toBe(true);
  });

  it('has nothing to decide on a row that carries no finding', () => {
    // A row whose two sides agree is not a finding at all (ticket 02), so there is no
    // decision to offer on it either. Saying so in the same field is what lets ticket
    // 79's context marker read one rule instead of two.
    const { rows } = prepareRows({ ...fixture(), filter: NO_FILTER, showNoise: false });

    expect(rows.filter((row) => row.class === null).map((row) => row.decidable)).toEqual([
      false,
      false,
    ]);
  });

  it('never returns a count a bar could be built from', () => {
    // Decision 25 of spec 32. Two people quoting "the number" must mean the same
    // number, so nothing here may look like a denominator.
    const narrowed = prepareRows({
      ...fixture(),
      filter: { ...NO_FILTER, classes: ['copy'] },
      showNoise: false,
    });

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
    expect(onlyDifferencesState({ onlyDifferences: true, classes: [] })).toEqual({
      checked: true,
      disabled: false,
    });
  });

  it('is on and dead while a class filter implies it', () => {
    expect(onlyDifferencesState({ onlyDifferences: false, classes: ['copy'] })).toEqual({
      checked: true,
      disabled: true,
    });
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
    base.findings.push({
      id: 'added1',
      class: 'text-added',
      visibility: 'information',
      state: 'open',
      occurrences: 1,
    });

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
    expect(pagesWithClasses(pages, ['copy', 'casing']).map((page) => page.page)).toEqual([
      'a',
      'b',
    ]);
  });

  it('drops a page whose count for the class is zero rather than absent', () => {
    const zero = [{ page: 'd', summary: { byClass: { copy: 0 } } }];
    expect(pagesWithClasses(zero, ['copy'])).toEqual([]);
  });
});

/**
 * Ticket 83. The priority is an annotation an editor wrote, not a property of the
 * snapshot, so it does not come off `summary` the way a class count does — it is derived
 * from the log and reaches this filter as an accessor.
 *
 * It is a second filter over the same list, and the rule above outranks it too: it narrows
 * what is drawn and moves no count.
 */
describe('pagesWithPriorities', () => {
  const pages = [
    { page: 'a', summary: { byClass: { copy: 3 } } },
    { page: 'b', summary: { byClass: { casing: 2 } } },
    { page: 'c', summary: { byClass: { copy: 1 } } },
  ];
  const priorityOf = (page) => ({ a: 'high', b: 'high' })[page.page] ?? null;

  it('is every page when nothing is selected', () => {
    expect(pagesWithPriorities(pages, [], priorityOf)).toHaveLength(3);
  });

  it('keeps the pages carrying any of the selected priorities', () => {
    expect(pagesWithPriorities(pages, ['high'], priorityOf).map((p) => p.page)).toEqual(['a', 'b']);
  });

  it('drops every page when the selected priority is on none of them', () => {
    expect(pagesWithPriorities(pages, ['low'], priorityOf)).toEqual([]);
  });

  it('never keeps an unannotated page, because absence is not a priority', () => {
    expect(
      pagesWithPriorities(pages, ['high', 'medium', 'low'], priorityOf).map((p) => p.page),
    ).toEqual(['a', 'b']);
  });

  /**
   * The acceptance criterion in one test: the two filters are **and**, not or. An editor
   * asking for the high-priority `copy` pages is asking one question, and a list that
   * answered it with the union would be answering a different one.
   */
  it('combines with the class filter, narrowing to the pages that satisfy both', () => {
    const both = pagesWithPriorities(pagesWithClasses(pages, ['copy']), ['high'], priorityOf);
    expect(both.map((p) => p.page)).toEqual(['a']);
    // And in the other order, because two pure filters over one list have to commute.
    expect(pagesWithClasses(pagesWithPriorities(pages, ['high'], priorityOf), ['copy'])).toEqual(
      both,
    );
  });
});

/**
 * Ticket 81. A repeat is every finding in **one store** with the same class, the same
 * two texts and the same detail. It is a grouping the interface makes and never a
 * thing the data holds, so the whole of it is these tests and the function they pin.
 */
describe('repeatsInStore', () => {
  /**
   * @param {string} id
   * @param {Partial<{ class: string, prod: string | null, new: string | null, detail: string | null, occurrences: number }>} part
   */
  const finding = (id, part) => ({
    id,
    class: 'text-missing',
    prod: 'Montage',
    new: null,
    detail: null,
    occurrences: 1,
    ...part,
  });

  const page = (store, name, findings) => ({ store, page: name, findings });

  it('is one row for the same class, the same two texts and the same detail', () => {
    // The want in one sentence: one footer line wrong on three pages is one row,
    // and the editor meets it once instead of three times.
    const repeats = repeatsInStore([
      page('nl', 'afhalen', [finding('a', {})]),
      page('nl', 'garantie', [finding('b', {})]),
      page('nl', 'montage', [finding('c', {})]),
    ]);

    expect(repeats).toHaveLength(1);
    expect(repeats[0].on.map((entry) => entry.page)).toEqual(['afhalen', 'garantie', 'montage']);
  });

  it('never crosses a store, because the stores translate the text', () => {
    // The measured reason: the promo banner is one Magento block and it reaches the
    // log as language-specific tuples, so a key on the literal text multiplies by
    // six — and an element carries no DOM path to key on instead (tickets 01, 34).
    const repeats = repeatsInStore([
      page('nl', 'afhalen', [finding('a', {})]),
      page('be', 'afhalen', [finding('b', {})]),
    ]);

    expect(repeats).toHaveLength(2);
    expect(repeats.map((repeat) => repeat.store).sort()).toEqual(['be', 'nl']);
  });

  it('is worst-first by the number of pages', () => {
    const repeats = repeatsInStore([
      page('nl', 'a', [finding('a1', { prod: 'Zelden' }), finding('a2', { prod: 'Vaak' })]),
      page('nl', 'b', [finding('b1', { prod: 'Vaak' })]),
      page('nl', 'c', [finding('c1', { prod: 'Vaak' })]),
    ]);

    expect(repeats.map((repeat) => repeat.prod)).toEqual(['Vaak', 'Zelden']);
    expect(repeats.map((repeat) => repeat.on.length)).toEqual([3, 1]);
  });

  it('sums the occurrences without letting them become the page count', () => {
    // The trap this ticket names: `occurrences` counts the same difference on **one
    // page**, and the page count counts pages. A row that says 5 when it means 2 is
    // the failure. Both numbers are here, and they have two names.
    const repeats = repeatsInStore([
      page('nl', 'afhalen', [finding('a', { occurrences: 3 })]),
      page('nl', 'garantie', [finding('b', { occurrences: 2 })]),
    ]);

    expect(repeats[0].on.length).toBe(2);
    expect(repeats[0].occurrences).toBe(5);
  });

  it('returns the grouping and nothing a bar could be built from', () => {
    // The same rule that governs `prepareRows`: this module says what is on screen
    // and never what it adds up to. No open count, no closed count, no denominator.
    //
    // There is no finding count beside the page count either, and that is not an
    // omission. `page` is a term of the finding id, so one page can hold at most one
    // finding with this key — measured over the whole corpus, 25,657 repeats and not
    // one exception. The shape says it: an entry in `on` is a page **and** its
    // finding, so the two numbers cannot come apart.
    const [repeat] = repeatsInStore([page('nl', 'afhalen', [finding('a', {})])]);

    expect(Object.keys(repeat).sort()).toEqual([
      'class',
      'detail',
      'key',
      'new',
      'occurrences',
      'on',
      'prod',
      'store',
    ]);
    expect(Object.keys(repeat.on[0]).sort()).toEqual(['id', 'occurrences', 'page']);
  });
});

describe('repeatsWithClasses', () => {
  const repeats = [
    { class: 'copy', on: [{}, {}] },
    { class: 'casing', on: [{}] },
  ];

  it('is every repeat when no class pill is on', () => {
    expect(repeatsWithClasses(repeats, [])).toHaveLength(2);
  });

  it('is what a class pill opens, so no second quick-filter surface is needed', () => {
    // A pill that lists its findings directly **is** this view with a class
    // pre-selected. That is the whole of the quick-filter want.
    expect(repeatsWithClasses(repeats, ['copy'])).toEqual([repeats[0]]);
  });

  it('moves no count: it narrows a list and returns the rows it was given', () => {
    expect(repeatsWithClasses(repeats, ['copy', 'casing'])).toEqual(repeats);
  });
});

/**
 * Ticket 100. The repeat list arrives in a **class group** for each class, so an editor
 * meets six or so numbers instead of one undifferentiated column, and chooses which kind
 * of difference to work through.
 *
 * The word is group and never *section*: `CONTEXT.md` gives "section" to a run of one page
 * under an anchor heading, which is still how a difference says where it is. Ticket 100
 * asked for "sections" and the name is refused; the concept it describes is this.
 *
 * It is a **pure derivation over the repeats ticket 81 already makes**: no second grouping
 * of findings, and the rows in a group are the very objects `repeatsInStore()` returned.
 */
describe('groupRepeatsByClass', () => {
  const repeat = (cls, pages) => ({
    key: `${cls}|${pages}`,
    class: cls,
    on: Array(pages).fill({}),
  });

  it("is one group for a class, carrying that class's repeats", () => {
    const groups = groupRepeatsByClass([repeat('copy', 3), repeat('casing', 1), repeat('copy', 2)]);

    const of = (cls) => groups.find((group) => group.class === cls).repeats;
    expect(of('copy').map((one) => one.on.length)).toEqual([3, 2]);
    expect(of('casing')).toHaveLength(1);
  });

  it('orders the groups by the closed vocabulary and never by the counts', () => {
    // A group that moves position as work is done is a group nobody can learn. The
    // vocabulary declares `copy` before `casing`, and one repeat against forty does not
    // change that.
    const order = groupRepeatsByClass([repeat('casing', 40), repeat('copy', 1)]).map(
      (group) => group.class,
    );

    expect(order.indexOf('copy')).toBeLessThan(order.indexOf('casing'));
  });

  it('keeps the worst-first order inside a group exactly as it was given', () => {
    // The list is already sorted worst-first, so this ticket changes nothing about which
    // work is on top — only how much of it arrives at once. A group is a slice of today's
    // ungrouped list and never a second opinion about its order.
    const finding = (id, prod) => ({
      id,
      class: 'copy',
      prod,
      new: 'x',
      detail: null,
      occurrences: 1,
    });
    const repeats = repeatsInStore([
      { store: 'nl', page: 'a', findings: [finding('a1', 'Zelden'), finding('a2', 'Vaak')] },
      { store: 'nl', page: 'b', findings: [finding('b1', 'Vaak')] },
    ]);

    const [group] = groupRepeatsByClass(repeats);

    expect(group.repeats).toEqual(repeats);
    expect(group.repeats.map((one) => one.prod)).toEqual(['Vaak', 'Zelden']);
  });

  it('draws no group for a work class that has no repeats', () => {
    // The empty group used to be drawn and to say so, keeping *nothing wrong here* apart
    // from *this class does not exist*. It costs a row apiece in the list an editor reads
    // to find work, and a store where most rules come back clean pays it on every line.
    // Which rules ran is a property of the run and not of this queue.
    const groups = groupRepeatsByClass([repeat('copy', 2)]);

    expect(groups.map((group) => group.class)).toEqual(['copy']);
  });

  it('gives a class that is not work a group of its own rather than mixing it into one', () => {
    // `text-added` is `information` and `copy` is `work`, and a row of the first inside
    // the `copy` group would be drawn as if the editor had been asked to look at it. A
    // class that is not work and holds nothing is drawn nowhere: an empty group is the
    // answer *the rule ran and found none*, and that is only owed for the work.
    const groups = groupRepeatsByClass([repeat('copy', 1), repeat('text-added', 2)]);
    const of = (cls) => groups.find((group) => group.class === cls);

    expect(of('text-added').repeats).toHaveLength(1);
    expect(of('copy').repeats).toHaveLength(1);
    expect(of('tag-changed')).toBeUndefined();
  });

  it('draws a class wherever it holds something, whatever its visibility', () => {
    // Ticket 86 asked whether a class that has left `work` still has an empty group owed
    // to it. No class has one now, so the question is closed from the other side: the rule
    // is `byClass.has(cls)`, which reads the repeats and never the vocabulary. A class
    // changing sides moves nothing here, and ticket 116 will need no edit either.
    const groups = groupRepeatsByClass([repeat('copy', 2), repeat('heading-level', 1)]).map(
      (group) => group.class,
    );

    expect(groups).toContain('heading-level');
    expect(groups).not.toContain('casing');
  });

  it('draws only the selected classes when a class pill is on', () => {
    // The pills stay the one filter, and the two controls must not tell different
    // stories: an unselected class is not drawn at all, rather than drawn and closed.
    const groups = groupRepeatsByClass([repeat('copy', 2), repeat('casing', 1)], ['casing']);

    expect(groups.map((group) => group.class)).toEqual(['casing']);
    expect(groups[0].repeats).toHaveLength(1);
  });

  it('starts closed, unless one group is the only one holding anything', () => {
    // A closed single group is a click that asks nothing. Two of them is the case this
    // ticket exists for: the editor chooses, and nothing is chosen for them.
    const opens = (groups) => groups.filter((one) => one.opensOnLoad).map((one) => one.class);

    expect(opens(groupRepeatsByClass([repeat('copy', 2)]))).toEqual(['copy']);
    expect(opens(groupRepeatsByClass([repeat('copy', 2), repeat('casing', 1)]))).toEqual([]);
  });

  it('opens the selected groups, because the editor already chose them', () => {
    // Two pills open two groups, which the ticket also asks to be one at a time. The
    // pills win where the two rules meet: the queue must not answer a two-class filter
    // with one class drawn open. One-at-a-time governs the clicks.
    const groups = groupRepeatsByClass(
      [repeat('copy', 2), repeat('casing', 1), repeat('link-target', 1)],
      ['copy', 'casing'],
    );

    expect(groups.map((group) => group.opensOnLoad)).toEqual([true, true]);
  });

  it('draws nothing at all when a pill is on and nothing is under it', () => {
    // There is no empty group left to open or to keep shut. The selected class holds
    // nothing, so it forms no group, and the list says *no difference found* above it.
    expect(groupRepeatsByClass([], ['copy'])).toEqual([]);
  });

  it('draws a class the vocabulary does not name, last rather than nowhere', () => {
    // The vocabulary is closed, so today nothing reaches here that is not in it. The
    // guard is for the failure being **silent**: a group list built from the vocabulary
    // alone would drop the row off the screen while the footer below kept counting it,
    // and the reader would meet *40 verschillen* over 38 rows. This list never gets to
    // decide that a repeat is not work.
    const groups = groupRepeatsByClass([repeat('copy', 1), repeat('invented', 1)]);

    expect(groups.at(-1).class).toBe('invented');
    expect(groups.at(-1).repeats).toHaveLength(1);
  });

  it('moves no count: the groups hold the list it was given, whole', () => {
    // The rule that outranks the rest of this ticket. Grouping is drawing, so the repeat
    // total across the groups is the ungrouped total — and a group carries rows, a name
    // and its initial state, and nothing a bar could be built from.
    const repeats = [repeat('copy', 2), repeat('casing', 1), repeat('copy', 5)];
    const groups = groupRepeatsByClass(repeats);
    const inside = groups.flatMap((group) => group.repeats);

    expect(inside).toHaveLength(repeats.length);
    expect(findingsIn(inside)).toBe(findingsIn(repeats));
    expect(Object.keys(groups[0]).sort()).toEqual(['class', 'opensOnLoad', 'repeats']);
  });
});

describe('findingsIn', () => {
  const repeats = [
    { class: 'copy', on: [{}, {}] },
    { class: 'casing', on: [{}] },
  ];

  it('counts the findings of the list it is given, and of no other list', () => {
    // Two callers ask this — the repeats footer and a search result — and one of them
    // asking differently is how a row count and a finding count start to disagree.
    expect(findingsIn(repeats)).toBe(3);
    expect(findingsIn(repeatsWithClasses(repeats, ['casing']))).toBe(1);
    expect(findingsIn([])).toBe(0);
  });
});
