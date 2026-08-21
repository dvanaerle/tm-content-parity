import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import SiblingView from './SiblingView.jsx';

/**
 * A page against its sibling page (ticket 04).
 *
 * `siblingReading()` is the rule and it is tested in Node, where it belongs. What is
 * left for a browser is the half a pure function cannot answer: that the tab draws two
 * stores and no third column, that it draws **two readings** and not a fifth comparison
 * (ticket 07), that the marker is a control a reader can press, and — the criteria that
 * are about **absence** — that no row carries a decision, a class pill or a tint. A
 * missing control passes every unit test there is, so the only place to ask is a mounted
 * component.
 */

const unit = (raw, index, part = {}) => ({
  tag: 'p',
  kind: 'text',
  level: null,
  raw,
  norm: raw,
  index,
  ...part,
});

/** A page shaped like the common one: a run of agreeing blocks with one difference. */
const HERE = [
  unit('Verkrijgbaar in drie kleuren', 0),
  unit('Gelijk een', 1),
  unit('Gelijk twee', 2),
  unit('Gelijk drie', 3),
];
const THERE = [
  unit('Verkrijgbaar in vier kleuren', 0),
  unit('Gelijk een', 1),
  unit('Gelijk twee', 2),
  unit('Gelijk drie', 3),
];

/*
 * The same page on the new site, in the shape the flattening is: both stores say `be`'s
 * production words, so the one block the two stores differ on has been flattened and
 * every other block still agrees.
 */
const BOTH_NEW = THERE.map((one) => ({ ...one }));

const sibling = (units = THERE, part = {}) => ({
  store: 'be',
  page: 'carport',
  rule: 'alternate',
  units,
  newUnits: BOTH_NEW,
  ...part,
});

function mount(props = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() =>
    root.render(
      createElement(SiblingView, {
        store: 'nl',
        here: HERE,
        hereNew: BOTH_NEW,
        sibling: sibling(),
        ...props,
      }),
    ),
  );
  return host;
}

/**
 * A press in the idiom the other browser tests here use: the element's own `click()`
 * inside `act()`. No stylesheet is loaded, so a real pointer would be aiming at a
 * zero-pixel target.
 */
const press = (element) => act(() => element.click());

/*
 * The two readings are two tables, so every row query names which one it asks. They are
 * told apart by position and not by their anchors: *the second table is the new site's* is
 * the criterion, and reading it back through the `n` prefix would be the test asserting
 * the anchor scheme twice and the layout not at all.
 */
const table = (host, at = 0) => host.querySelectorAll('table')[at];
const markers = (host, at = 0) => [...(table(host, at)?.querySelectorAll('tbody tr[id^="run-"]') ?? [])];
const rowIds = (host, at = 0) =>
  [...(table(host, at)?.querySelectorAll('tbody tr[id]') ?? [])]
    .map((row) => row.id)
    .filter((id) => !id.startsWith('run-'));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('a page against its sibling', () => {
  it('draws the two stores side by side, and no third column', () => {
    const host = mount();

    // The store id is the label, as it is everywhere in this log, with the name once
    // beside it. Neither head says *source of truth*: the two stores are equals.
    const heads = [...table(host).querySelectorAll('thead th')].map((th) => th.textContent);
    expect(heads).toEqual(['nl — Netherlands', 'be — Belgium (Dutch)']);
    expect(host.textContent).not.toContain('source of truth');
  });

  // Two readings and not a fifth comparison: the same two stores, once on each side. The
  // second is what makes the flattening checkable — a reader who cannot see both sides
  // cannot see that production varied and the new site does not.
  it('draws the new site as a second reading of the same two stores', () => {
    const host = mount();

    const headings = [...host.querySelectorAll('h3')].map((one) => one.textContent);
    expect(headings).toEqual(['Production, on both stores', 'The new site, on both stores']);

    const columns = [...host.querySelectorAll('table')].map((one) =>
      [...one.querySelectorAll('thead th')].map((th) => th.textContent),
    );
    expect(columns).toEqual([
      ['nl — Netherlands', 'be — Belgium (Dutch)'],
      ['nl — Netherlands', 'be — Belgium (Dutch)'],
    ]);
  });

  it('collapses the agreeing run into one marker, which a press opens', () => {
    const host = mount();

    expect(rowIds(host)).toEqual(['b0']);
    // **Agreeing** is the interface's one word for this, and the marker is the one place
    // it is written — the content view draws the same row from the same component.
    expect(markers(host).map((marker) => marker.textContent)).toEqual(['3 agreeing blocks']);

    press(markers(host)[0].querySelector('button'));
    expect(rowIds(host)).toEqual(['b0', 'b1', 'b2', 'b3']);
  });

  it('offers no decision anywhere: no control, no class pill and no finding anchor', () => {
    const host = mount();
    // Every run open, so this covers the agreeing rows too and not only the differing
    // one.
    press(markers(host)[0].querySelector('button'));

    /*
     * Every control on the tab is a **disclosure**, and this reads them all back to say
     * so: one opens every run at once and one opens this run. Neither decides anything.
     *
     * It is counted rather than asked about by name because the criterion is an absence,
     * and an absence is only proved by naming what is present. An `OverrideControl` has
     * no test hook of its own, so a query for one would pass on a tab that had grown two.
     */
    const controls = [...host.querySelectorAll('button, select, input, [role="radiogroup"]')];
    expect(controls.map((one) => (one.closest('label') ?? one).textContent)).toEqual([
      'Show agreeing blocks',
      '3 agreeing blocks',
      'Show agreeing blocks',
      '4 agreeing blocks',
    ]);

    // A class pill is a `Badge`, and there is no class here for one to name. A finding
    // anchor is the other id scheme in this document, and no row carries one.
    expect(host.querySelector('[data-slot="badge"]')).toBe(null);
    expect(host.querySelector('[id^="finding-"]')).toBe(null);
  });

  it('tints no row by direction, because neither store lost anything', () => {
    // A block only one store has is exactly the row the content view tints — red where
    // production has it, green where the new site invented it. Here the two stores are
    // equals: `lost` and `added` are tones of a class, and a block difference has none.
    const host = mount({
      here: [unit('Alleen hier', 0)],
      hereNew: null,
      sibling: sibling([unit('Alleen daar', 0)], { newUnits: null }),
    });

    expect(rowIds(host)).toEqual(['b0', 's0']);
    /*
     * The row layer is a shape and not a class since ticket 132, so the absence to check is
     * the attribute the stylesheet reads.
     *
     * It reads the attribute **off the cells** rather than selecting by it, and that is the
     * point. `querySelectorAll('td[data-wears="cell"]')` returns nothing when the attribute
     * is misspelled in the selector *and* when the tab is correct, and the two are the same
     * empty array — so the first draft of this line asked for `data-shape` and passed while
     * proving nothing. Finding the cells first makes the query's own failure visible.
     */
    const cells = [...host.querySelectorAll('tbody td')];
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.filter((cell) => cell.dataset.wears ?? cell.dataset.tone)).toEqual([]);
  });

  it('says a page whose sibling says the same words agrees, rather than drawing one marker alone', () => {
    // Half the pages of a block are byte-identical, so this is the common case and not an
    // edge. One marker over an empty table reads as a comparison that failed to run.
    const host = mount({ sibling: sibling(HERE.map((one) => ({ ...one }))) });

    expect(rowIds(host)).toEqual([]);
    expect(host.textContent).toContain('Nothing differs between these two pages');
    // The blocks are still there and still worth opening, so the marker stays below.
    expect(markers(host).map((marker) => marker.textContent)).toEqual(['4 agreeing blocks']);
  });

  it('says a page nothing was compared on is not compared, and never that it agrees', () => {
    // The sibling page has no production report. Nobody looked, which is a different fact
    // from finding nothing — and an empty table under an *agrees* sentence would be the
    // tab claiming the second.
    const host = mount({ hereNew: null, sibling: sibling(null, { newUnits: null }) });

    expect(host.textContent).toContain('Not compared');
    expect(host.textContent).not.toContain('agree');
    expect(host.querySelector('table')).toBe(null);
    // The sibling is still named: it was matched, and only the comparison is missing.
    expect(host.textContent).toContain('Matched by alternate');
  });

  it('shows a block too large for the word comparison in full on both sides, uncompared', () => {
    // The cap is a **size**, so a long pair reaches it however little of it changed. The
    // word is the existing one and so is the meaning: both versions whole, neither
    // coloured, and a line saying nothing was compared.
    /*
     * Two blocks that **pair** and are then too large to compare, which is the only way
     * to reach this state: a pair below the similarity threshold is not one row at all,
     * and a pair sharing a long head and tail has both trimmed off and fits under the cap.
     * So three words in four agree — enough to pair, and not enough to trim.
     */
    const long = (stem) =>
      Array.from({ length: 400 }, (_, at) => (at % 4 === 1 ? `${stem}${at}` : `woord${at}`)).join(
        ' ',
      );
    const host = mount({
      here: [unit(long('eerste'), 0)],
      hereNew: null,
      sibling: sibling([unit(long('tweede'), 0)], { newUnits: null }),
    });

    expect(host.textContent).toContain('This block is too large for the word comparison');
    expect(host.textContent).toContain(long('eerste'));
    expect(host.textContent).toContain(long('tweede'));
    expect(host.querySelectorAll('del, ins')).toHaveLength(0);
  });

  // The row this whole reading is for: production varied and the new site does not, so a
  // store difference the migration lost. It is **words**, because the fact is about four
  // cells and no tone can carry it.
  it('says of a flattened block that production varied and the new site does not', () => {
    const host = mount();

    expect(host.textContent).toContain('Production varied here and the new site does not');
    // And the count above the readings, which is why the second one is drawn at all.
    expect(host.textContent).toContain('1 content unit');
  });

  it('names no cause for it, because a store-scoped variable renders no HTML', () => {
    const host = mount();

    for (const word of ['variable', 'customVar', 'store-scoped', 'store scoped']) {
      expect(host.textContent).not.toContain(word);
    }
  });

  it('offers no decision on a flattened block, and tints it no colour', () => {
    // Where a flattening is a defect it is an ordinary axis-A finding on the store that
    // lost its words, and it is decided there. This tab grows no control for it.
    const host = mount();

    const controls = [...host.querySelectorAll('button, select, input, [role="radiogroup"]')];
    expect(controls.map((one) => (one.closest('label') ?? one).textContent)).toEqual([
      'Show agreeing blocks',
      '3 agreeing blocks',
      'Show agreeing blocks',
      '4 agreeing blocks',
    ]);
    expect(host.querySelector('[data-slot="badge"]')).toBe(null);

    const cells = [...host.querySelectorAll('tbody td')];
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.filter((cell) => cell.dataset.wears ?? cell.dataset.tone)).toEqual([]);
  });

  it('says nothing of a flattening on a page whose new site was never read', () => {
    // The tab as it stood before the second reading: production on both stores and no
    // new-site units at all. Nobody looked, so nothing is claimed.
    const host = mount({ hereNew: null, sibling: sibling(THERE, { newUnits: null }) });

    expect(host.textContent).not.toContain('the new site does not');
    expect(host.querySelectorAll('table')).toHaveLength(1);
  });

  it('draws nothing at all where no sibling was matched', () => {
    // The tab is absent on such a page and `Ledger.jsx` is where that is decided. This
    // is the same answer said where the reading is, so the component cannot be mounted
    // into a state it has no words for.
    expect(mount({ sibling: null }).textContent).toBe('');
  });
});

/**
 * The one language two columns can share (ticket 125).
 *
 * A block is two stores of one language, which is why the tab exists at all — the words
 * can be compared because they are in the same language. So one declaration covers both
 * columns, and it is the store's rather than either cell's.
 */
describe('the language of the two stores', () => {
  it('declares one language over both columns', () => {
    const host = mount({ store: 'be_fr', sibling: sibling(THERE, { store: 'fr' }) });

    const declared = new Set([...host.querySelectorAll('tbody [lang]')].map((one) => one.lang));
    expect([...declared]).toEqual(['fr']);
  });
});
