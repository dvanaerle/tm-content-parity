import { describe, expect, it } from 'vitest';
import {
  classCountsByOpenWork,
  findingsIn,
  groupRepeatsByClass,
  repeatsByOpenWork,
  repeatsInStore,
  repeatsWithClasses,
  repeatsWithWorkLeft,
} from './repeat-list.mjs';

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

  it('keeps a text difference inside its language block, so six stores are four rows', () => {
    // The boundary ticket 03 drew and ticket 04 leaves standing: these are **words**, the
    // stores translate them, and `de` and `uk` are in no block at all. Each of the six
    // pages below carries the same class, the same two texts and the same detail, so the
    // **only** thing keeping them apart is the block.
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

  it('spans all six stores on an images check, where a basename is one string', () => {
    // Ticket 04. The block's stated reason is that the stores translate the text, and that
    // reason does not reach a filename: the images check compares basenames with the path
    // stripped, so `max.svg` is the same string on every store, in every language. One
    // press decides it everywhere.
    const repeats = repeatsInStore([
      page('nl', 'afhalen', [finding('a', { class: 'image-missing', prod: 'max.svg' })]),
      page('be', 'afhalen', [finding('b', { class: 'image-missing', prod: 'max.svg' })]),
      page('be_fr', 'afhalen', [finding('c', { class: 'image-missing', prod: 'max.svg' })]),
      page('fr', 'afhalen', [finding('d', { class: 'image-missing', prod: 'max.svg' })]),
      page('de', 'afhalen', [finding('e', { class: 'image-missing', prod: 'max.svg' })]),
      page('uk', 'afhalen', [finding('f', { class: 'image-missing', prod: 'max.svg' })]),
    ]);

    expect(repeats).toHaveLength(1);
    expect(repeats[0].stores).toEqual(['be', 'be_fr', 'de', 'fr', 'nl', 'uk']);
    // `de` and `uk` are **in** it. Each is alone in its language, which is what keeps them
    // out of a text repeat; a filename has no language for them to be alone in.
    expect(repeats[0].on).toHaveLength(6);
  });

  it('spans all six stores on a links check too, because the corpus is the check', () => {
    // The rule is a property of the **check** and not of one class, so `links` inherits it
    // beside `images`: a link target is host-folded and is the same string on every store.
    // Without this the rule would be a list of classes, and the next class added to either
    // check would arrive with a corpus nobody chose.
    const repeats = repeatsInStore([
      page('nl', 'afhalen', [finding('a', { class: 'broken-link', prod: '/oud-pad' })]),
      page('de', 'afhalen', [finding('b', { class: 'broken-link', prod: '/oud-pad' })]),
      page('uk', 'afhalen', [finding('c', { class: 'broken-link', prod: '/oud-pad' })]),
    ]);

    expect(repeats).toHaveLength(1);
    expect(repeats[0].stores).toEqual(['de', 'nl', 'uk']);
  });

  it('is largest-first by the number of pages, which is the order it can see', () => {
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
 * Ticket 141. The list leads with the difference holding the most work **left**.
 *
 * Ticket 81 proved that a repeat's page count is its finding count, and ordered on pages
 * for that reason. The proof is about **total** findings and stops holding the moment the
 * log closes some of them: twenty closed pages and two open is still twenty-two. So the
 * order is taken on the open count instead, which is user story 33 of ticket 29 — *the
 * worst page is the worst remaining page* — applied to the list ticket 81 built.
 */
describe('repeatsByOpenWork', () => {
  const repeat = (key, pages) => ({ key, on: Array(pages).fill({}) });

  it('leads with the difference holding the most open findings, not the most pages', () => {
    const footer = repeat('footer', 30);
    const price = repeat('price', 5);
    const open = new Map([
      [footer, 2],
      [price, 5],
    ]);

    expect(repeatsByOpenWork([footer, price], (row) => open.get(row))).toEqual([price, footer]);
  });

  it('sinks a difference with nothing left below every difference with work left', () => {
    const settled = repeat('settled', 30);
    const one = repeat('one', 1);
    const open = new Map([
      [settled, 0],
      [one, 1],
    ]);

    expect(repeatsByOpenWork([settled, one], (row) => open.get(row))).toEqual([one, settled]);
  });

  it('falls back to the page count and then to the key, so two renders never disagree', () => {
    // Equal open counts is the common case rather than the corner: a store where nothing is
    // decided yet has every row equal on this term. The fallback is ticket 81's order, so
    // an undecided list arrives exactly as it did before this ticket.
    const wide = repeat('a-wide', 9);
    const narrow = repeat('z-narrow', 2);
    const twin = repeat('a-twin', 2);

    expect(repeatsByOpenWork([narrow, twin, wide], () => 1)).toEqual([wide, twin, narrow]);
  });

  it('narrows nothing: a settled difference stays on the list it was given', () => {
    // The backlog is not drained — ticket 81's own progress-language criterion. A
    // difference settled on all thirty pages stays on screen reading *30 of 30 closed*;
    // it only stops leading.
    const repeats = [repeat('a', 3), repeat('b', 1)];

    expect(repeatsByOpenWork(repeats, () => 0)).toHaveLength(2);
  });
});

/**
 * Ticket 144. A pill says how much open work of its class is **left**, and a difference
 * with nothing left is off the list.
 *
 * Both functions take the open count as an argument, in the manner `repeatsByOpenWork()`
 * established: this module never sees the override log, and the component that draws a row
 * already reads that row's bar. So these tests hand a reading in rather than building a log,
 * which is also the whole of what makes them pure tests.
 *
 * **No figure is pinned.** A test asserting `32` teaches nothing about the rule and breaks
 * when a fixture gains a page, so the claims below are relational: the tally is over findings
 * and not rows, a class the log emptied is absent, and the order is `classCounts()`'s.
 */
describe('repeatsWithWorkLeft', () => {
  const repeat = (key, pages) => ({ key, class: 'casing', on: Array(pages).fill({}) });

  it('takes a difference with nothing open off the list', () => {
    const settled = repeat('settled', 2);
    const left = repeat('left', 1);
    const open = new Map([
      [settled, 0],
      [left, 1],
    ]);

    expect(repeatsWithWorkLeft([settled, left], (row) => open.get(row))).toEqual([left]);
  });

  it('keeps a partly closed difference, however little is left of it', () => {
    // One page of thirty is still work, and the row it draws still says *29 of 30 closed*.
    const partly = repeat('partly', 30);

    expect(repeatsWithWorkLeft([partly], () => 1)).toEqual([partly]);
  });

  it('brings every dropped difference back while include closed is on', () => {
    const repeats = [repeat('a', 3), repeat('b', 1)];

    expect(repeatsWithWorkLeft(repeats, () => 0, { includeClosed: true })).toEqual(repeats);
  });
});

describe('classCountsByOpenWork', () => {
  const repeat = (cls, key, pages) => ({ key, class: cls, on: Array(pages).fill({}) });

  /** The open count of a row, read the way the component reads it: off the row's own bar. */
  const openIn = (open) => (row) => open.get(row);

  it('counts the open findings of a class and not its rows', () => {
    // Two rows, four findings between them, three of them still open. A pill saying *2*
    // would tell an editor they have less work than they have.
    const one = repeat('casing', 'one', 2);
    const two = repeat('casing', 'two', 2);

    expect(
      classCountsByOpenWork(
        [one, two],
        openIn(
          new Map([
            [one, 2],
            [two, 1],
          ]),
        ),
      ),
    ).toEqual([{ class: 'casing', count: 3 }]);
  });

  it('draws no pill for a class with nothing open left', () => {
    const settled = repeat('casing', 'settled', 2);
    const left = repeat('copy', 'left', 1);

    expect(
      classCountsByOpenWork(
        [settled, left],
        openIn(
          new Map([
            [settled, 0],
            [left, 1],
          ]),
        ),
      ),
    ).toEqual([{ class: 'copy', count: 1 }]);
  });

  it('draws a zero pill for a wholly closed class while include closed is on', () => {
    // The only way into a fully decided class's rows. The **number** does not depend on the
    // control — it is still the open count — only a zero pill's presence does.
    const settled = repeat('casing', 'settled', 2);

    expect(classCountsByOpenWork([settled], () => 0, { includeClosed: true })).toEqual([
      { class: 'casing', count: 0 },
    ]);
  });

  it('keeps a class the repeat list cannot hold, whatever the log says', () => {
    // A repeat is built out of the `work` findings a summary carries, so `text-added` has no
    // row here at all. It is a finding you can link to and cannot decide, so no decision can
    // close it and the snapshot's figure is the live one.
    expect(classCountsByOpenWork([], () => 0, { tally: { 'text-added': 4, casing: 40 } })).toEqual([
      { class: 'text-added', count: 4 },
    ]);
  });

  it('orders the pills the way every other pill row is ordered', () => {
    // `classCounts()`'s own order — the biggest first, ties by name — so the strip does not
    // resequence when it starts reading the log instead of the snapshot.
    const wide = repeat('copy', 'wide', 5);
    const twin = repeat('casing', 'twin', 1);
    const other = repeat('leakage', 'other', 1);

    expect(
      classCountsByOpenWork(
        [twin, wide, other],
        openIn(
          new Map([
            [twin, 1],
            [wide, 5],
            [other, 1],
          ]),
        ),
      ).map((pill) => pill.class),
    ).toEqual(['copy', 'casing', 'leakage']);
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

  it('keeps the order inside a group exactly as it was given', () => {
    // The list arrives sorted, so this ticket changes nothing about which work is on top —
    // only how much of it arrives at once. A group is a slice of the ungrouped list and
    // never a second opinion about its order, which since ticket 141 is worst-first on
    // what is left and is taken where the log is in scope.
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
