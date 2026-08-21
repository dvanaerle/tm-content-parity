import { describe, expect, it } from 'vitest';
import { findingsIn, repeatList, repeatsInStore, repeatsWithClasses } from './repeat-list.mjs';

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
 * Ticket 03 of the deepening pass. **One entry** over everything the repeat list does to
 * itself once the log is in scope: which rows are drawn, where they sit, which class group
 * they are drawn under, what the pills say, and which pages *Include closed* took away.
 *
 * It exists for the rule three callers used to keep by remembering it: **a pill counts a
 * class over the whole list, and the rows are the narrowed one.** A pill that fell to its
 * own count when you pressed it would be a control that lies about what it holds, and the
 * order of six exported functions was the only thing enforcing it. ADR 0029's *the same list
 * the rows come from* means the same corpus and the same log — not the same narrowing — and
 * this is the one place that sentence is enforced.
 *
 * The cases below are tickets 141, 144 and 100's, rewritten against the entry: the four
 * functions they used to call one at a time are this function's steps now, and a test that
 * called them in an order of its own would be proving the shape this ticket deleted.
 *
 * The reading is handed in, in the manner ticket 141 established: this module never sees the
 * override log, and the caller that draws a row already reads that row's bar. So a test hands
 * over a `stateOf` — a finding's state as the caller has it — rather than building a log, and
 * that is the whole of what makes these pure tests.
 */
describe('repeatList', () => {
  /** Page ids for a difference that is on `count` pages, unique per difference. */
  const pages = (prefix, count) => Array.from({ length: count }, (_, at) => `${prefix}-${at}`);

  /**
   * A difference over the named pages. The key is the grouping made printable, as
   * `repeatsInStore()` returns it, and it is passed in only where a test is about the
   * tie-break that reads it.
   */
  const repeat = (cls, ids, key = `${cls}|${ids.join(',')}`) => ({
    key,
    class: cls,
    on: ids.map((id) => ({ id })),
  });

  /**
   * The caller's reading of the log: every finding open, except the ones named. `work` is
   * the visibility a repeat is built out of, so it is the default here for the same reason.
   */
  const reading =
    (states = {}) =>
    (id) => ({ visibility: 'work', state: states[id] ?? 'open' });

  /** Every page of a difference closed, which is what takes its row off the list. */
  const allFixed = (ids) => Object.fromEntries(ids.map((id) => [id, 'fixed']));

  it('returns rows, groups, class counts, totals, findings and closed pages from one call', () => {
    const copy = repeat('copy', pages('copy', 3));
    const casing = repeat('casing', pages('casing', 1));

    const list = repeatList({
      repeats: [copy, casing],
      classes: ['copy'],
      stateOf: reading(),
    });

    expect(list.rows).toEqual([copy]);
    expect(list.groups.map((group) => group.class)).toEqual(['copy']);
    expect(list.classCounts).toEqual([
      { class: 'copy', count: 3 },
      { class: 'casing', count: 1 },
    ]);
    expect(list.total).toBe(2);
    expect(list.shown).toBe(1);
    expect(list.findings).toBe(3);
    expect(list.closedPages).toEqual(new Set());
  });

  it('counts a class over the whole list while the rows narrow to it', () => {
    // The rule this entry exists for. A pill says how much of its kind there is, which is
    // not a question about what is drawn — so pressing `copy` must not take `casing`'s
    // number off the strip, and it must not change `copy`'s own.
    const repeats = [repeat('copy', pages('copy', 2)), repeat('casing', pages('casing', 1))];
    const list = (classes) => repeatList({ repeats, classes, stateOf: reading() });

    expect(list(['copy']).classCounts).toEqual(list([]).classCounts);
    expect(list(['copy']).rows.map((row) => row.class)).toEqual(['copy']);
    expect(list([]).rows).toHaveLength(2);
  });

  it('leads with the difference holding the most open findings, not the most pages', () => {
    // Ticket 141, and user story 33 of ticket 29 over the list ticket 81 built: the worst
    // difference is the worst **remaining** one. Twenty closed pages and two open is still
    // twenty-two, so the page count stops answering the moment the log closes some of them.
    const footer = repeat('copy', pages('footer', 4));
    const price = repeat('copy', pages('price', 3));

    const list = repeatList({
      repeats: [footer, price],
      stateOf: reading({ 'footer-0': 'dismissed', 'footer-1': 'fixed' }),
    });

    expect(list.rows).toEqual([price, footer]);
  });

  it('sinks a wholly decided difference below every difference with work left', () => {
    // It is only on the list at all while *Include closed* holds it there (ticket 144);
    // where it is, ticket 141's order still decides where it sits, and last is where.
    const settled = repeat('copy', pages('settled', 4));
    const one = repeat('copy', pages('one', 1));

    const list = repeatList({
      repeats: [settled, one],
      includeClosed: true,
      stateOf: reading(allFixed(pages('settled', 4))),
    });

    expect(list.rows).toEqual([one, settled]);
  });

  it('falls back to the page count and then to the key, so two renders never disagree', () => {
    // Equal open counts is the common case rather than the corner: a store where nothing is
    // decided has every row equal on that term. The fallback is ticket 81's whole order, so
    // an undecided list arrives exactly as it always did.
    const wide = repeat('copy', pages('wide', 9), 'a-wide');
    const narrow = repeat('copy', pages('narrow', 2), 'z-narrow');
    const twin = repeat('copy', pages('twin', 2), 'a-twin');

    const list = repeatList({
      repeats: [narrow, twin, wide],
      stateOf: reading(allFixed([...pages('wide', 8), 'narrow-1', 'twin-1'])),
    });

    expect(list.rows).toEqual([wide, twin, narrow]);
  });

  it('takes a difference with nothing open off the list', () => {
    // Ticket 144. Fifteen `casing` rows all reading *2 of 2 closed* is the list answering
    // *what did this crawl find* to an editor asking *what is left*.
    const settled = repeat('casing', pages('settled', 2));
    const left = repeat('casing', pages('left', 1));

    const list = repeatList({
      repeats: [settled, left],
      stateOf: reading({ 'settled-0': 'fixed', 'settled-1': 'dismissed' }),
    });

    expect(list.rows).toEqual([left]);
  });

  it('keeps a partly closed difference, however little is left of it', () => {
    // One page of four is still work, and the row it draws still says *3 of 4 closed* —
    // which is the sentence that tells an editor the work landed.
    const partly = repeat('casing', pages('partly', 4));

    const list = repeatList({
      repeats: [partly],
      stateOf: reading({ 'partly-0': 'fixed', 'partly-1': 'fixed', 'partly-2': 'dismissed' }),
    });

    expect(list.rows).toEqual([partly]);
  });

  it('brings every dropped difference back with include closed, and hides no page with it', () => {
    // The control decides **membership** and the closed-page reading together, because they
    // are the same question asked of a row and of a page: with it on nothing is hidden, so
    // there is no set of hidden pages to hold and `closedPages` is `null` rather than empty.
    const settled = repeat('casing', pages('settled', 2));
    const stateOf = reading({ 'settled-0': 'fixed', 'settled-1': 'dismissed' });

    expect(repeatList({ repeats: [settled], stateOf }).rows).toEqual([]);

    const included = repeatList({ repeats: [settled], stateOf, includeClosed: true });
    expect(included.rows).toEqual([settled]);
    expect(included.closedPages).toBeNull();
  });

  it('reads the closed pages of the rows it draws, as findings and off one reading', () => {
    // One set over the whole list rather than a question each page asks the live log, so a
    // page cannot leave the table under the editor who just decided it. A contradicted claim
    // is not closed — it reads as open everywhere else, so its page is still drawn.
    const partly = repeat('casing', pages('partly', 4));

    const list = repeatList({
      repeats: [partly],
      stateOf: reading({
        'partly-0': 'fixed',
        'partly-1': 'dismissed',
        'partly-2': 'contradicted',
      }),
    });

    expect(list.closedPages).toEqual(new Set(['partly-0', 'partly-1']));
  });

  it('counts the open findings of a class and not its rows', () => {
    // Two rows, four findings between them, three of them still open. A pill saying *2*
    // would tell an editor they have less work than they have.
    const one = repeat('casing', pages('one', 2));
    const two = repeat('casing', pages('two', 2));

    const list = repeatList({ repeats: [one, two], stateOf: reading({ 'two-1': 'fixed' }) });

    expect(list.classCounts).toEqual([{ class: 'casing', count: 3 }]);
  });

  it('draws no pill for a class with nothing open left', () => {
    // A class the log has emptied draws no pill, so pressing one can no longer answer *No
    // difference found*.
    const settled = repeat('casing', pages('settled', 2));
    const left = repeat('copy', pages('left', 1));

    const list = repeatList({
      repeats: [settled, left],
      stateOf: reading(allFixed(pages('settled', 2))),
    });

    expect(list.classCounts).toEqual([{ class: 'copy', count: 1 }]);
  });

  it('draws a zero pill for a wholly closed class while include closed is on', () => {
    // The only way into a fully decided class's rows. The **number** does not depend on the
    // control — it is still the open count — only a zero pill's presence does.
    const settled = repeat('casing', pages('settled', 2));

    const list = repeatList({
      repeats: [settled],
      includeClosed: true,
      stateOf: reading(allFixed(pages('settled', 2))),
    });

    expect(list.classCounts).toEqual([{ class: 'casing', count: 0 }]);
  });

  it('keeps a class the repeat list cannot hold, whatever the log says', () => {
    // A repeat is built out of the `work` findings a summary carries, so `text-added` has no
    // row here at all. It is a finding you can link to and cannot decide, so no decision can
    // close it and the snapshot's figure is the live one. The tally's `work` entries are
    // ignored on purpose: the list is the answer for those, and taking the larger of two
    // numbers is how the pill and the rows would come apart again.
    const list = repeatList({
      repeats: [],
      stateOf: reading(),
      tally: { 'text-added': 4, casing: 40 },
    });

    expect(list.classCounts).toEqual([{ class: 'text-added', count: 4 }]);
  });

  it('orders the pills the way every other pill row is ordered', () => {
    // `classCounts()`'s own order — the biggest first, ties by name — so the strip does not
    // resequence when it starts reading the log instead of the snapshot.
    const wide = repeat('copy', pages('wide', 5));
    const twin = repeat('casing', pages('twin', 1));
    const other = repeat('leakage', pages('other', 1));

    const list = repeatList({ repeats: [twin, wide, other], stateOf: reading() });

    expect(list.classCounts.map((pill) => pill.class)).toEqual(['copy', 'casing', 'leakage']);
  });

  it("is one group for a class, carrying that class's rows", () => {
    // Ticket 100. One wall of rows asks an editor to read it before it says anything; six or
    // so numbers, one per kind of difference, is a choice instead.
    const list = repeatList({
      repeats: [
        repeat('copy', pages('wide', 3)),
        repeat('casing', pages('one', 1)),
        repeat('copy', pages('narrow', 2)),
      ],
      stateOf: reading(),
    });

    const of = (cls) => list.groups.find((group) => group.class === cls).repeats;
    expect(of('copy').map((one) => one.on.length)).toEqual([3, 2]);
    expect(of('casing')).toHaveLength(1);
  });

  it('orders the groups by the closed vocabulary and never by the counts', () => {
    // A group that moves position as work is done is a group nobody can learn. The
    // vocabulary declares `copy` before `casing`, and one repeat against forty does not
    // change that. A group is a place on the screen; a row is the work in it.
    const list = repeatList({
      repeats: [repeat('casing', pages('casing', 40)), repeat('copy', pages('copy', 1))],
      stateOf: reading(),
    });

    const order = list.groups.map((group) => group.class);
    expect(order.indexOf('copy')).toBeLessThan(order.indexOf('casing'));
  });

  it('holds the rows of a group in the order the whole list is in', () => {
    // A group is a slice of the ungrouped list and never a second opinion about its order,
    // which since ticket 141 is worst-first on what is left. That is why the grouping is
    // inside this entry: the two cannot be composed the wrong way round.
    const settled = repeat('copy', pages('settled', 3));
    const left = repeat('copy', pages('left', 1));

    const list = repeatList({
      repeats: [settled, left],
      includeClosed: true,
      stateOf: reading(allFixed(pages('settled', 3))),
    });

    const [group] = list.groups;
    expect(group.repeats).toEqual(list.rows);
    expect(group.repeats).toEqual([left, settled]);
  });

  it('draws no group for a work class that has no rows', () => {
    // The empty group used to be drawn and to say so, keeping *nothing wrong here* apart
    // from *this class does not exist*. It costs a row apiece in the list an editor reads to
    // find work, and a store where most rules come back clean pays it on every line. Which
    // rules ran is a property of the run and not of this queue.
    const list = repeatList({ repeats: [repeat('copy', pages('copy', 2))], stateOf: reading() });

    expect(list.groups.map((group) => group.class)).toEqual(['copy']);
  });

  it('gives a class that is not work a group of its own rather than mixing it into one', () => {
    // `text-added` is `information` and `copy` is `work`, and a row of the first inside the
    // `copy` group would be drawn as if the editor had been asked to look at it. A class that
    // is not work and holds nothing is drawn nowhere: an empty group is the answer *the rule
    // ran and found none*, and that is only owed for the work.
    const list = repeatList({
      repeats: [repeat('copy', pages('copy', 1)), repeat('text-added', pages('added', 2))],
      // Nothing an `information` finding holds is work, so nothing in it reads as open: such
      // a row is on this list only because the control that keeps the decided rows is on.
      includeClosed: true,
      stateOf: (id) => ({
        visibility: id.startsWith('added') ? 'information' : 'work',
        state: 'open',
      }),
    });

    const of = (cls) => list.groups.find((group) => group.class === cls);
    expect(of('text-added').repeats).toHaveLength(1);
    expect(of('copy').repeats).toHaveLength(1);
    expect(of('tag-changed')).toBeUndefined();
  });

  it('draws a class wherever it holds something, whatever its visibility', () => {
    // Ticket 86 asked whether a class that has left `work` still has an empty group owed to
    // it. No class has one now, so the question is closed from the other side: the rule reads
    // the rows and never the vocabulary. A class changing sides moves nothing here.
    const list = repeatList({
      repeats: [repeat('copy', pages('copy', 2)), repeat('heading-level', pages('heading', 1))],
      stateOf: reading(),
    });

    const groups = list.groups.map((group) => group.class);
    expect(groups).toContain('heading-level');
    expect(groups).not.toContain('casing');
  });

  it('draws only the selected classes when a class pill is on', () => {
    // The pills stay the one filter, and the two controls must not tell different stories: an
    // unselected class is not drawn at all, rather than drawn and closed.
    const list = repeatList({
      repeats: [repeat('copy', pages('copy', 2)), repeat('casing', pages('casing', 1))],
      classes: ['casing'],
      stateOf: reading(),
    });

    expect(list.groups.map((group) => group.class)).toEqual(['casing']);
    expect(list.groups[0].repeats).toHaveLength(1);
  });

  it('starts closed, unless one group is the only one holding anything', () => {
    // A closed single group is a click that asks nothing. Two of them is the case ticket 100
    // exists for: the editor chooses, and nothing is chosen for them.
    const opens = (repeats) =>
      repeatList({ repeats, stateOf: reading() })
        .groups.filter((group) => group.opensOnLoad)
        .map((group) => group.class);

    expect(opens([repeat('copy', pages('copy', 2))])).toEqual(['copy']);
    expect(opens([repeat('copy', pages('copy', 2)), repeat('casing', pages('casing', 1))])).toEqual(
      [],
    );
  });

  it('opens the selected groups, because the editor already chose them', () => {
    // Two pills open two groups, which ticket 100 also asks to be one at a time. The pills
    // win where the two rules meet: the queue must not answer a two-class filter with one
    // class drawn open. One-at-a-time governs the clicks.
    const list = repeatList({
      repeats: [
        repeat('copy', pages('copy', 2)),
        repeat('casing', pages('casing', 1)),
        repeat('link-target', pages('link', 1)),
      ],
      classes: ['copy', 'casing'],
      stateOf: reading(),
    });

    expect(list.groups.map((group) => group.opensOnLoad)).toEqual([true, true]);
  });

  it('draws nothing at all when a pill is on and nothing is under it', () => {
    // There is no empty group left to open or to keep shut. The selected class holds nothing,
    // so it forms no group, and `shown` is what tells the caller to say *no difference found*
    // rather than *no open work here* — nothing **there** and nothing **left** are two
    // answers, and the count of the narrowed list is what keeps them apart.
    const list = repeatList({
      repeats: [repeat('casing', pages('casing', 1))],
      classes: ['copy'],
      stateOf: reading(),
    });

    expect(list.groups).toEqual([]);
    expect(list.shown).toBe(0);
    expect(list.total).toBe(1);
  });

  it('draws a class the vocabulary does not name, last rather than nowhere', () => {
    // The vocabulary is closed, so today nothing reaches here that is not in it. The guard is
    // for the failure being **silent**: a group list built from the vocabulary alone would
    // drop the row off the screen while the footer below kept counting it, and the reader
    // would meet *40 differences* over 38 rows.
    const list = repeatList({
      repeats: [repeat('copy', pages('copy', 1)), repeat('invented', pages('invented', 1))],
      stateOf: reading(),
    });

    expect(list.groups.at(-1).class).toBe('invented');
    expect(list.groups.at(-1).repeats).toHaveLength(1);
  });

  it('moves no count: the groups hold the rows it drew, whole', () => {
    // Grouping is drawing, so the repeat total across the groups is the ungrouped total —
    // and a group carries rows, a name and its initial state, and nothing a bar could be
    // built from. The footer's two numbers are one reading: `findings` is counted off the
    // rows and not off the corpus, so a row count and a finding count cannot disagree.
    const list = repeatList({
      repeats: [
        repeat('copy', pages('wide', 2)),
        repeat('casing', pages('one', 1)),
        repeat('copy', pages('wider', 5)),
      ],
      stateOf: reading(),
    });

    const inside = list.groups.flatMap((group) => group.repeats);
    expect(inside).toHaveLength(list.rows.length);
    expect(findingsIn(inside)).toBe(list.findings);
    expect(list.findings).toBe(8);
    expect(Object.keys(list.groups[0]).sort()).toEqual(['class', 'opensOnLoad', 'repeats']);
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
