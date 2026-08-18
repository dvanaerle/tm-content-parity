import { describe, expect, it } from 'vitest';
import {
  NO_FILTER,
  collapseRuns,
  collapseState,
  collapsedKeys,
  collapses,
  findingsIn,
  isNarrowed,
  outlineFrom,
  pagesWithClasses,
  pagesWithPriorities,
  groupRepeatsByClass,
  prepareRows,
  repeatsInStore,
  repeatsWithClasses,
  rowKeyFromHash,
  runKeyHolding,
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

describe('prepareRows', () => {
  it('shows the whole page in document order, matched rows included', () => {
    // Decision 18 of spec 32. A tint only reads as a signal against untinted
    // baseline, so the default view is the page and not the complaints.
    const { rows } = prepareRows({ ...fixture(), filter: NO_FILTER, showDiagnostics: false });

    expect(rows.map((row) => row.prod?.raw ?? null)).toEqual([
      'Kleuren',
      'Verkrijgbaar in drie kleuren',
      'Gelijk',
      'Weg',
    ]);
  });

  it('resolves each side to its unit, and to null where the side has none', () => {
    const { rows } = prepareRows({ ...fixture(), filter: NO_FILTER, showDiagnostics: false });
    const lost = rows.at(-1);

    expect(lost.prod.raw).toBe('Weg');
    expect(lost.new).toBeNull();
  });

  it('attaches the derived finding, so a row can be ticked off', () => {
    const { rows } = prepareRows({ ...fixture(), filter: NO_FILTER, showDiagnostics: false });

    expect(rows[1].finding.id).toBe('copy1');
    expect(rows[0].finding).toBeNull();
  });

  it('narrows to the selected classes, and to those only', () => {
    // The whole point: a pass of nothing but copy edits.
    const filter = { ...NO_FILTER, classes: ['copy'] };
    const { rows } = prepareRows({ ...fixture(), filter, showDiagnostics: false });

    expect(rows.map((row) => row.class)).toEqual(['copy']);
  });

  it('takes several classes at once', () => {
    const filter = { ...NO_FILTER, classes: ['copy', 'text-missing'] };
    const { rows } = prepareRows({ ...fixture(), filter, showDiagnostics: false });

    expect(rows).toHaveLength(2);
  });

  /**
   * Ticket 116. Production divides the words over two blocks and the new site sends them
   * as one, so one row holds a **run** on the left. It is appended to the fixture rather
   * than given its own fixture, because what has to be true is that it is one row among
   * the others: the run resolves, and every row beside it still resolves the way it did.
   */
  const withRun = () => {
    const base = fixture();
    base.elements.production.push(
      unit({ raw: 'Bedankt voor het aanvragen van een samplepakket', index: 14 }),
      unit({ raw: 'Het pakket past door de brievenbus', index: 17 }),
    );
    base.elements.new.push(
      unit({
        raw: 'Bedankt voor het aanvragen van een samplepakket Het pakket past door de brievenbus',
        index: 12,
      }),
    );
    base.rows.push({
      class: 'regrouped',
      prod: 4,
      prodRun: [4, 5],
      new: 3,
      score: null,
      finding: 'run1',
    });
    base.findings.push({
      id: 'run1',
      class: 'regrouped',
      visibility: 'information',
      state: 'open',
      occurrences: 1,
      detail: 'p + p → p',
    });
    return base;
  };

  it('reads the run of a regrouped row into its units', () => {
    const { rows } = prepareRows({ ...withRun(), filter: NO_FILTER, showDiagnostics: false });
    const merged = rows.at(-1);

    expect(merged.prodRun.map((one) => one.index)).toEqual([14, 17]);
    // The row is anchored at the **first** member, so a hash link and the jump list name
    // where the run begins.
    expect(merged.prod.index).toBe(14);
    expect(merged.key).toBe('p14');
  });

  it('leaves every other row without a run', () => {
    const { rows } = prepareRows({ ...withRun(), filter: NO_FILTER, showDiagnostics: false });

    expect(rows.slice(0, -1).map((row) => row.prodRun)).toEqual([null, null, null, null]);
  });

  it('drops a run one of whose members is not on the page', () => {
    // The class asserts **total** coverage. A row drawing three members of four would say
    // the words on the right are the words on the left while showing less than all of
    // them, which is the silence ADR 0012 refuses. Absent, the row falls back to its
    // first member and is visibly not a whole answer.
    const base = withRun();
    base.rows.at(-1).prodRun = [4, 5, 99];

    const { rows } = prepareRows({ ...base, filter: NO_FILTER, showDiagnostics: false });
    expect(rows.at(-1).prodRun).toBeNull();
    expect(rows.at(-1).prod.index).toBe(14);
  });

  /**
   * Ticket 120, the mirror. Production sends one block and the new site divides it over
   * three, so the **right** cell holds the run and the row is positioned at production's
   * one unit. Appended to the same fixture and for the same reason.
   */
  const withSplit = () => {
    const base = fixture();
    base.elements.production.push(
      unit({ raw: 'Hulp bij uw keuze? Lees hier hoe u de juiste maatvoering kiest', index: 14 }),
    );
    base.elements.new.push(
      unit({ raw: 'Hulp bij uw keuze?', index: 12 }),
      unit({ raw: 'Lees hier hoe u de juiste', index: 13 }),
      unit({ raw: 'maatvoering kiest', index: 14 }),
    );
    base.rows.push({
      class: 'regrouped',
      prod: 4,
      new: 3,
      newRun: [3, 4, 5],
      score: null,
      finding: 'split1',
    });
    base.findings.push({
      id: 'split1',
      class: 'regrouped',
      visibility: 'information',
      state: 'open',
      occurrences: 1,
      detail: 'p → 3×p',
    });
    return base;
  };

  it('reads the new site’s run of a split row into its units', () => {
    const { rows } = prepareRows({ ...withSplit(), filter: NO_FILTER, showDiagnostics: false });
    const split = rows.at(-1);

    expect(split.newRun.map((one) => one.index)).toEqual([12, 13, 14]);
    // The row is positioned at production's unit, which is the only one on that side, so
    // the anchor is where production put the words and `prodRun` is not the row's to hold.
    expect(split.prodRun).toBeNull();
    expect(split.key).toBe('p14');
  });

  it('drops a split run one of whose members is not on the page', () => {
    const base = withSplit();
    base.rows.at(-1).newRun = [3, 4, 99];

    const { rows } = prepareRows({ ...base, filter: NO_FILTER, showDiagnostics: false });
    expect(rows.at(-1).newRun).toBeNull();
    expect(rows.at(-1).new.index).toBe(12);
  });

  it('leaves every other row without a run on either side', () => {
    const { rows } = prepareRows({ ...withSplit(), filter: NO_FILTER, showDiagnostics: false });

    expect(rows.slice(0, -1).map((row) => row.newRun)).toEqual([null, null, null, null]);
  });

  it('collapses a regrouped row into a context marker, and opens it on a landing', () => {
    // Spec 119's second seam. Both behaviours are ticket 86's and neither is written for
    // `regrouped` anywhere — `collapses()` reads `decidable` and `runKeyHolding()` reads the
    // collapse set. That is exactly why they are pinned here: a row nothing asks about
    // belongs behind a marker, and a link to it has to open the marker it is behind, or the
    // finding has an id that leads nowhere.
    const { rows } = prepareRows({ ...withRun(), filter: NO_FILTER, showDiagnostics: false });
    const merged = rows.at(-1);

    expect(collapses(merged)).toBe(true);
    expect(runKeyHolding(rows, merged.key)).toBe(collapseRuns(rows).at(-1).key);
  });

  it('keeps a heading the run absorbed in the jump-list', () => {
    // Spec 119: *"keeps an absorbed heading in the jump-list"*. It holds for a run whose
    // **first** member is the heading, which is what `prod` is, so the outline reads the
    // heading it always read and a landmark does not vanish because the new site inlined it.
    // A heading in a **later** member is ticket 121's, and this asserts nothing about it.
    const base = withRun();
    base.elements.production[4] = heading('Bedankt voor het aanvragen van een samplepakket', 2, 14);

    const { rows } = prepareRows({ ...base, filter: NO_FILTER, showDiagnostics: false });
    expect(outlineFrom(rows).map((entry) => entry.key)).toContain('p14');
  });

  it('draws a regrouped row with the diagnostics control off, and offers no decision', () => {
    // It inherits ticket 86's information-row behaviour whole: it is drawn, it carries a
    // finding an editor can link to, and there is nothing to ask about it.
    const { rows } = prepareRows({ ...withRun(), filter: NO_FILTER, showDiagnostics: false });
    const merged = rows.at(-1);

    expect(merged.class).toBe('regrouped');
    expect(merged.finding.id).toBe('run1');
    expect(merged.decidable).toBe(false);
  });

  it('hides a diagnostic class until the diagnostics control is on', () => {
    const base = fixture();
    base.rows.push({ class: 'tag-changed', prod: null, new: 2, score: null, finding: 'tag1' });
    base.findings.push({
      id: 'tag1',
      class: 'tag-changed',
      visibility: 'diagnostic',
      state: 'open',
      occurrences: 1,
    });

    expect(prepareRows({ ...base, filter: NO_FILTER, showDiagnostics: false }).rows).toHaveLength(
      4,
    );
    expect(prepareRows({ ...base, filter: NO_FILTER, showDiagnostics: true }).rows).toHaveLength(5);
  });

  it('draws an information row with the toggle off, because it is not a diagnostic', () => {
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

    expect(prepareRows({ ...base, filter: NO_FILTER, showDiagnostics: false }).rows).toHaveLength(
      5,
    );
    expect(prepareRows({ ...base, filter: NO_FILTER, showDiagnostics: true }).rows).toHaveLength(5);
  });

  it('hides a row whose class the derivation could not name, as a diagnostic', () => {
    // `visibilityOf()` answers `diagnostic` for a name the vocabulary does not hold, so a
    // row that arrives without a derived finding stays behind the toggle rather than
    // appearing as work. That is what `!finding?.shown` did before ticket 75.
    const base = fixture();
    base.rows.push({ class: 'copy', prod: null, new: 2, score: null, finding: 'gone1' });

    expect(prepareRows({ ...base, filter: NO_FILTER, showDiagnostics: false }).rows).toHaveLength(
      4,
    );
    expect(prepareRows({ ...base, filter: NO_FILTER, showDiagnostics: true }).rows).toHaveLength(5);
  });

  it('draws a row in a work class whatever the log decided about it', () => {
    // The toggle asks about the **class**, and after ADR 0011 that is all it asks.
    // A diagnostic row stays behind the toggle; a decided row in a work class is not
    // a diagnostic and was never behind this control to begin with.
    const base = fixture();
    base.findings[0] = { ...base.findings[0], state: 'dismissed' };

    expect(prepareRows({ ...base, filter: NO_FILTER, showDiagnostics: false }).rows).toHaveLength(
      4,
    );
    expect(prepareRows({ ...base, filter: NO_FILTER, showDiagnostics: true }).rows).toHaveLength(4);
  });

  it('says of a row that the two sides are already equal', () => {
    // Ticket 68, and the largest saving in the content view: 78% of the whole word
    // diff over 448 reports was rows that agree, because the view asked for a diff
    // of two identical strings. They are also the longest rows, because they hold
    // the untouched paragraphs.
    const { rows } = prepareRows({ ...fixture(), filter: NO_FILTER, showDiagnostics: false });

    expect(rows.map((row) => row.equal)).toEqual([true, false, true, false]);
  });

  it('keys a row on the position of its unit in the document', () => {
    // Ticket 68. The key was the index in the row list, so a row that appeared
    // above this one — a paragraph the new site invented — renamed every anchor
    // below it and carried every hash link to the wrong row. Ticket 79 changes
    // which rows the view holds, so the key has to name something the view does
    // not decide: where the unit is in the document.
    const before = prepareRows({ ...fixture(), filter: NO_FILTER, showDiagnostics: false });

    const withInvented = fixture();
    withInvented.rows.unshift({
      class: 'text-added',
      prod: null,
      new: 0,
      score: null,
      finding: null,
    });
    const after = prepareRows({ ...withInvented, filter: NO_FILTER, showDiagnostics: true });

    const keyOf = (rows, raw) => rows.find((row) => row.prod?.raw === raw).key;
    expect(keyOf(after.rows, 'Weg')).toBe(keyOf(before.rows, 'Weg'));
  });

  it('keeps a production key and a new-site key apart', () => {
    // A row the new site invented has no production position, and the two
    // documents count on their own. Two rows must never take one anchor.
    const base = fixture();
    base.rows.push({ class: 'text-added', prod: null, new: 0, score: null, finding: null });

    const { rows } = prepareRows({ ...base, filter: NO_FILTER, showDiagnostics: true });
    expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
  });

  it('reports how much of the page is on screen, so a filter is never invisible', () => {
    const filter = { ...NO_FILTER, classes: ['copy'] };
    const narrowed = prepareRows({ ...fixture(), filter, showDiagnostics: false });

    expect(narrowed.rows).toHaveLength(1);
    expect(narrowed.total).toBe(4);
  });

  it('offers every class on the page as a filter, whatever the filter already is', () => {
    // The chips must not disappear as they are ticked, or the filter cannot be
    // widened again without clearing it first.
    const filter = { ...NO_FILTER, classes: ['copy'] };
    const { classes } = prepareRows({ ...fixture(), filter, showDiagnostics: false });

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

    const { rows } = prepareRows({ ...base, filter: NO_FILTER, showDiagnostics: false });
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

    const { rows } = prepareRows({ ...base, filter: NO_FILTER, showDiagnostics: true });

    expect(rows.find((row) => row.class === 'copy').decidable).toBe(true);
    expect(rows.find((row) => row.class === 'text-missing').decidable).toBe(true);
    expect(rows.find((row) => row.class === 'tag-changed').decidable).toBe(true);
  });

  it('has nothing to decide on a row that carries no finding', () => {
    // A row whose two sides agree is not a finding at all (ticket 02), so there is no
    // decision to offer on it either. Saying so in the same field is what lets ticket
    // 79's context marker read one rule instead of two.
    const { rows } = prepareRows({ ...fixture(), filter: NO_FILTER, showDiagnostics: false });

    expect(rows.filter((row) => row.class === null).map((row) => row.decidable)).toEqual([
      false,
      false,
    ]);
  });

  it('hands back the whole page beside the narrowed one', () => {
    // What the collapse set is taken from (ticket 48). A filter decides what is drawn
    // and never what holds open work, so a set taken from the narrowed rows would
    // leave every other row on the page unable to collapse for as long as the view
    // stands — and clearing the filter would show a page of finished work as open.
    const narrowed = prepareRows({
      ...fixture(),
      filter: { ...NO_FILTER, classes: ['copy'] },
      showDiagnostics: false,
    });

    expect(narrowed.rows).toHaveLength(1);
    expect(narrowed.all.map((row) => row.key)).toEqual(['p3', 'p5', 'p8', 'p11']);
  });

  it('never returns a count a bar could be built from', () => {
    // Decision 25 of spec 32. Two people quoting "the number" must mean the same
    // number, so nothing here may look like a denominator.
    const narrowed = prepareRows({
      ...fixture(),
      filter: { ...NO_FILTER, classes: ['copy'] },
      showDiagnostics: false,
    });

    // `all` is a row **list** and not a number. It is here so the collapse set can be
    // taken from the whole page, and a caller wanting a denominator would still have to
    // count it — which is the same refusal `total` already carries.
    expect(Object.keys(narrowed).sort()).toEqual(['all', 'classes', 'rows', 'total']);
    // `total` is rows on the page, and the page has 4 rows against 2 findings. A
    // reader cannot mistake it for the bar's denominator.
    expect(narrowed.total).not.toBe(fixture().findings.length);
  });
});

describe('the filter itself', () => {
  it('starts as no filter at all', () => {
    expect(isNarrowed(NO_FILTER)).toBe(false);
  });

  it('is narrowed by a class, which is the only narrowing left', () => {
    // *Differences only* was the other one until ticket 79. It is gone: the marker
    // makes the default a differences view already, so a box that removed the equal
    // rows outright was a control that took away the answer to *where does this text
    // belong*.
    expect(isNarrowed({ ...NO_FILTER, classes: ['copy'] })).toBe(true);
  });

  it('adds and removes a class without touching the rest of the filter', () => {
    const on = toggleClass({ classes: [] }, 'copy');
    expect(on).toEqual({ classes: ['copy'] });

    expect(toggleClass(on, 'copy').classes).toEqual([]);
  });

  it('leaves the filter it was given alone', () => {
    const held = { ...NO_FILTER };
    toggleClass(held, 'copy');
    expect(held.classes).toEqual([]);
  });
});

/**
 * The context marker (ticket 79, ADR 0006).
 *
 * The rows here are the two fields the rule reads and a key, because those two fields
 * are what the rule actually stands on. A whole `prepareRows` row would say that this
 * function needs one, and it does not.
 */
const differs = (key, cls = 'copy') => ({
  key,
  equal: false,
  class: cls,
  finding: { state: 'open', visibility: 'work' },
  decidable: true,
});
const agrees = (key) => ({ key, equal: true, class: null, finding: null, decidable: false });

/** A row an editor decided: `fixed` and `dismissed` are Closed, `contradicted` is not. */
const decided = (key, state) => ({ ...differs(key), finding: { state, visibility: 'work' } });

describe('collapses', () => {
  it('collapses a row whose two sides agree and which carries no class', () => {
    expect(collapses(agrees('p1'))).toBe(true);
  });

  it('keeps a row with an open finding, even when every word agrees', () => {
    // The 68/79 disagreement, and the rule that settled it. Ticket 68 set `equal` as
    // `prod.norm === next.norm` and said a row "can carry `heading-level` or
    // `tag-changed` and agree about every word" — right for a clamp, which compacts a
    // row with nothing to read, and wrong for a marker, which **removes** it. *No open
    // work* answers both from one rule: the words are not the question, the decision
    // is. `tag-changed` is the example left standing — ticket 86 moved `heading-level`
    // to `information`, where it collapses under the third rule instead — and it is
    // `diagnostic`, which is still something an editor decides.
    expect(collapses({ ...differs('p2', 'tag-changed'), equal: true })).toBe(false);
  });

  it('keeps a row whose two sides differ', () => {
    expect(collapses(differs('p3'))).toBe(false);
  });

  it('collapses a row whose finding is Closed', () => {
    // Ticket 48. *Afgerond* is the Closed bucket as ticket 80 defines it and nothing
    // narrower: claims-only was refused, because it would leave a dismissed row in the
    // open list forever, which is the same defect the widening exists to fix.
    expect(collapses(decided('p4', 'fixed'))).toBe(true);
    expect(collapses(decided('p5', 'dismissed'))).toBe(true);
  });

  it('keeps a contradicted row: it is Needs attention and not Closed', () => {
    // Open work wearing a tick. The claim is ticked and the snapshot disagrees with
    // it, so this is the one row on the page an editor most needs left where it is.
    expect(collapses(decided('p6', 'contradicted'))).toBe(false);
  });

  it('collapses a row that holds nothing to decide, whatever its words do', () => {
    // Ticket 48 has to say in words whether an `information` finding is *open*, and
    // the answer is **no**: `CONTEXT.md` defines it as a finding you can link to and
    // cannot decide, so there is no work on this row to be left with. Its two sides
    // differ here on purpose — that is what makes this the third rule and not the
    // first one said twice.
    const row = {
      ...differs('p7', 'text-added'),
      finding: { state: 'open', visibility: 'information' },
      decidable: false,
    };

    expect(collapses(row)).toBe(true);
  });

  it('keeps a row whose class the derivation did not reach', () => {
    // A diagnostic an editor asked to see, with no derived finding behind it — the case
    // `prepareRows` describes as a class the vocabulary does not hold. Nobody decided
    // it and nothing says it is closed, so it is drawn exactly as ticket 79 drew it.
    // `decidable` is false here for want of a finding and must not be read as *this
    // holds no work*.
    const row = { ...differs('p8', 'invented'), finding: null, decidable: false };

    expect(collapses(row)).toBe(false);
  });
});

/**
 * The collapse set, taken **once** (ticket 48).
 *
 * The content view asks for it when the page opens and hands the same keys back on
 * every render after that. A tick that moved a row under the reader on a 168-row page
 * would be worse than the clutter it removed: the fold answers *what did I arrive with*
 * and never *what am I doing now*, so the row an editor just ticked stays where they
 * can check it.
 */
describe('collapsedKeys', () => {
  it('names the rows that hold no open work, in document order', () => {
    const rows = [agrees('p1'), differs('p2'), decided('p3', 'fixed')];

    expect(collapsedKeys(rows)).toEqual(['p1', 'p3']);
  });
});

describe('collapseRuns', () => {
  it('opens on the differences, with each run of agreeing rows one marker', () => {
    const items = collapseRuns([differs('p1'), agrees('p2'), agrees('p3'), differs('p4')]);

    expect(items.map((item) => item.kind)).toEqual(['row', 'marker', 'row']);
    expect(items[1].blocks).toBe(2);
  });

  it('names a marker apart from any row, so the two anchors cannot collide', () => {
    const [marker] = collapseRuns([agrees('p1'), agrees('p2')]);

    expect(marker.key).toBe('run-p1');
  });

  it('leaves document order untouched: no row moves and none is dropped', () => {
    const rows = [agrees('p1'), differs('p2'), agrees('p3'), differs('p4'), agrees('p5')];
    const items = collapseRuns(rows);

    const drawn = items.flatMap((item) => (item.kind === 'marker' ? item.rows : [item.row]));
    expect(drawn).toEqual(rows);
  });

  it('is one marker for a page that agrees everywhere', () => {
    // The trap: a run of agreeing rows can be the whole page. The marker is right
    // here — what the component must not do is draw it alone with no sentence.
    const items = collapseRuns([agrees('p1'), agrees('p2'), agrees('p3')]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: 'marker', blocks: 3, open: false });
  });

  it('opens the marker the reader opened, and no other', () => {
    const items = collapseRuns([agrees('p1'), differs('p2'), agrees('p3')], {
      open: ['run-p1'],
    });

    expect(items.filter((item) => item.kind === 'marker').map((item) => item.open)).toEqual([
      true,
      false,
    ]);
  });

  it('gives an open run the same rows it was given, unchanged', () => {
    const rows = [agrees('p1'), agrees('p2')];
    const [marker] = collapseRuns(rows, { open: ['run-p1'] });

    expect(marker.rows).toEqual(rows);
  });

  it('reads one answer about a run, and never two', () => {
    // A marker is open because it is in `open` and for no other reason. A jump used to
    // be a second answer here — `open: opened.has(key) || run.some(...)` — and a second
    // answer is a state a press cannot reach: the reader pressed the chevron, `open`
    // lost the key, and the run stayed open because the hash still named a row inside
    // it. `runKeyHolding()` is the same jump said as a seed instead.
    const rows = [differs('p1'), agrees('p2'), agrees('p3')];

    expect(collapseRuns(rows, { open: [] })[1].open).toBe(false);
    expect(collapseRuns(rows, { open: ['run-p2'] })[1].open).toBe(true);
  });

  it('collapses every position of one finding together', () => {
    // Occurrence count is not part of a finding id, so one finding can be drawn at
    // several rows. One decision closes every place it is drawn — the rule reads the
    // finding, so the positions cannot come apart, and there is nothing left to read at
    // any of them.
    const finding = { state: 'dismissed', visibility: 'work' };
    const items = collapseRuns([
      { ...differs('p1'), finding },
      { ...differs('p2'), finding },
      differs('p3'),
    ]);

    expect(items.map((item) => item.kind)).toEqual(['marker', 'row']);
    expect(items[0].blocks).toBe(2);
  });

  it('says which kind of run it holds, so the marker can say it in words', () => {
    // Ticket 79 proposed no copy and left the strings to 48. There are two: a run
    // nobody found anything in **agrees** with production, and a run holding a decision
    // somebody made holds no open work. A **mixed** run does not split into two
    // markers — a run is a unit of skipping and not of reading — so it says the second,
    // which is the true thing about all of its rows.
    const [plain] = collapseRuns([agrees('p1'), agrees('p2')]);
    const [done] = collapseRuns([decided('p1', 'fixed'), decided('p2', 'dismissed')]);
    const [mixed] = collapseRuns([agrees('p1'), decided('p2', 'fixed')]);

    expect([plain.agrees, done.agrees, mixed.agrees]).toEqual([true, false, false]);
  });

  it('takes the collapse set it is given rather than asking the rule again', () => {
    // What keeps a tick from moving a row under the reader. The set was taken when the
    // page opened, and the row ticked since is still drawn — where the editor left it,
    // and where they can check what they claimed.
    const rows = [agrees('p1'), differs('p2'), decided('p3', 'fixed')];

    const items = collapseRuns(rows, { collapsed: ['p1'] });

    expect(items.map((item) => item.kind)).toEqual(['marker', 'row', 'row']);
  });

  it('moves no count: it returns the rows it was given and nothing else', () => {
    // The rule that outranks every other in this module. A marker states the size of
    // the run it holds, which is a distance between two findings — never a
    // denominator, and `blocks` counts rows and not findings. `agrees` is the one
    // thing ticket 48 added and it is deliberately a **kind and not a count**: it
    // chooses which sentence the marker says, and nothing can be divided by it.
    const items = collapseRuns([differs('p1'), agrees('p2')]);

    expect(Object.keys(items[1]).sort()).toEqual([
      'agrees',
      'blocks',
      'key',
      'kind',
      'open',
      'rows',
    ]);
  });
});

describe('runKeyHolding', () => {
  // Handed over by ticket 68, which built the other half: a jump already lands on the
  // row it names. The run holding that row must open with it, or a hash link and an
  // outline entry land on a marker.
  it('names the run that holds the row a jump names', () => {
    const rows = [differs('p1'), agrees('p2'), agrees('p3')];

    expect(runKeyHolding(rows, 'p3')).toBe('run-p2');
  });

  it('names no run for a row that is on screen already', () => {
    expect(runKeyHolding([differs('p1'), agrees('p2')], 'p1')).toBeNull();
  });

  it('reads the collapse set the markers were drawn from', () => {
    // The two must agree about which rows are behind a marker. A jump seeded from the
    // live rule after a tick would name a run that is not in the document, and a key
    // nothing carries opens nothing and says nothing.
    const rows = [differs('p1'), decided('p2', 'fixed'), decided('p3', 'fixed')];

    expect(runKeyHolding(rows, 'p3', ['p2', 'p3'])).toBe('run-p2');
    expect(runKeyHolding(rows, 'p3', [])).toBeNull();
  });

  it('names no run for a key no row carries, and for no key at all', () => {
    const rows = [differs('p1'), agrees('p2')];

    expect(runKeyHolding(rows, 'p9')).toBeNull();
    expect(runKeyHolding(rows, null)).toBeNull();
  });
});

/**
 * What the drawn items say about themselves (ticket 79).
 *
 * The three questions the content view asks of `collapseRuns()`'s answer: which items
 * are markers, whether every one of them is open, and whether the page is markers and
 * nothing else. They are here rather than in the component for the reason the module
 * header gives — what is on screen is this module's decision — and because the third
 * one has an edge the component cannot state: a page with **no items at all** is not a
 * page where nothing differs.
 */
describe('collapseState', () => {
  const items = (...rows) => collapseRuns(rows);

  it('picks out the markers and leaves the rows', () => {
    const state = collapseState(items(differs('p1'), agrees('p2'), differs('p3')));

    expect(state.markers.map((marker) => marker.key)).toEqual(['run-p2']);
  });

  it('says every run is open only when every one of them is', () => {
    const rows = [agrees('p1'), differs('p2'), agrees('p3')];

    expect(collapseState(collapseRuns(rows)).allOpen).toBe(false);
    expect(collapseState(collapseRuns(rows, { open: ['run-p1'] })).allOpen).toBe(false);
    expect(collapseState(collapseRuns(rows, { open: ['run-p1', 'run-p3'] })).allOpen).toBe(true);
  });

  it('says no run is open on a page that has none, so no control is drawn over nothing', () => {
    expect(collapseState(items(differs('p1')))).toMatchObject({ markers: [], allOpen: false });
  });

  it('says nothing differs on a page that is markers and nothing else', () => {
    expect(collapseState(items(agrees('p1'), agrees('p2'))).everythingCollapsed).toBe(true);
    expect(collapseState(items(agrees('p1'), differs('p2'))).everythingCollapsed).toBe(false);
  });

  it('says whether the markers are agreement or closed work', () => {
    // Which sentence a finished page gets (ticket 48). *Nothing differs* is true of a
    // page nobody found anything on and false of a page an editor worked through, and
    // the second is what finishing looks like — so the two must not share a sentence.
    expect(collapseState(items(agrees('p1'), agrees('p2'))).everythingAgrees).toBe(true);
    expect(collapseState(items(agrees('p1'), decided('p2', 'fixed'))).everythingAgrees).toBe(false);
  });

  it('does not say nothing differs about a page with nothing on it', () => {
    // An empty item list is a filter that matched no row, and the component says so in
    // its own words. `markers.length === items.length` is true of it, which is how a
    // page with nothing on it would have claimed every block agrees with production.
    expect(collapseState([]).everythingCollapsed).toBe(false);
  });
});

describe('rowKeyFromHash', () => {
  // Ticket 68 wrote this rule for the clamp and it went out with the clamp on
  // 2026-08-14. It comes back for the marker, which is the criterion 68 could not
  // finish: the run holding this key has to open before the browser can land on it.
  it('reads the row a hash link names', () => {
    expect(rowKeyFromHash('#p12')).toBe('p12');
    expect(rowKeyFromHash('#n4')).toBe('n4');
  });

  it('answers nothing for a hash that names something else', () => {
    // `finding-<digest>` is the other anchor scheme in this document, and the Links
    // and Images tables own it. A row key is `p<n>` or `n<n>` and nothing else.
    expect(rowKeyFromHash('#finding-a1b2')).toBeNull();
    expect(rowKeyFromHash('')).toBeNull();
    expect(rowKeyFromHash(null)).toBeNull();
  });
});

describe('toggleIn', () => {
  // The dashboard holds a bare class list and the content view holds a whole filter.
  // The set operation is shared so that the dashboard does not have to invent the
  // wrapper it has no use for.
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
    const { rows } = prepareRows({ ...fixture(), filter: NO_FILTER, showDiagnostics: false });
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

    const { rows } = prepareRows({ ...base, filter: NO_FILTER, showDiagnostics: true });
    expect(outlineFrom(rows).map((entry) => entry.text)).toEqual(['Kleuren', 'Nieuw kopje']);
  });

  it('gives an unlevelled heading the deepest level rather than none', () => {
    const base = fixture();
    base.elements.production[0] = { ...base.elements.production[0], level: null };

    const { rows } = prepareRows({ ...base, filter: NO_FILTER, showDiagnostics: false });
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

  it('spans the two stores of one language block, where the text is the same', () => {
    // Ticket 03. `nl` and `be` are one block, so they do **not** translate the text
    // between them — they share a language. Where the two carry the same string, the
    // repeat is one row and the decision on it is one press.
    const repeats = repeatsInStore([
      page('nl', 'afhalen', [finding('a', {})]),
      page('be', 'afhalen', [finding('b', {})]),
    ]);

    expect(repeats).toHaveLength(1);
    expect(repeats[0].stores).toEqual(['be', 'nl']);
    // The store is on the **entry**, because the events a press writes are one per
    // page and each carries the store of its own page.
    expect(repeats[0].on.map((entry) => `${entry.store}/${entry.page}`)).toEqual([
      'nl/afhalen',
      'be/afhalen',
    ]);
  });

  it('crosses one block and never a store outside one, and never all six', () => {
    // The trap ticket 03 names: `de` and `uk` are in no block at all, and the mistake
    // here would move counts on two stores this feature is not about. Each of the six
    // pages below carries the same class, the same two texts and the same detail, so
    // the **only** thing keeping them apart is the block.
    const repeats = repeatsInStore([
      page('nl', 'afhalen', [finding('a', {})]),
      page('be', 'afhalen', [finding('b', {})]),
      page('be_fr', 'afhalen', [finding('c', {})]),
      page('fr', 'afhalen', [finding('d', {})]),
      page('de', 'afhalen', [finding('e', {})]),
      page('uk', 'afhalen', [finding('f', {})]),
    ]);

    // Four rows and not one: six identical strings over six stores are the two blocks
    // and the two stores that are in none. `de` and `uk` are alone because each is the
    // only store of its language, which is the whole answer to "may they be a block".
    expect(repeats.map((repeat) => repeat.stores)).toEqual([
      ['be_fr', 'fr'],
      ['be', 'nl'],
      ['de'],
      ['uk'],
    ]);
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
      'stores',
    ]);
    expect(Object.keys(repeat.on[0]).sort()).toEqual(['id', 'occurrences', 'page', 'store']);
    // `stores` is a list even on a row that spans nothing, so the reader that says *in
    // which stores* has one shape to read and no single-store special case (ticket 03).
    expect(repeat.stores).toEqual(['nl']);
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
