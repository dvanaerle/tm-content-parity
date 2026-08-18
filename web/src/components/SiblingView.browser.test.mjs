import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import SiblingView from './SiblingView.jsx';
import { SURFACE } from '../lib/palette.mjs';

/**
 * A page against its sibling page (ticket 04).
 *
 * `siblingReading()` is the rule and it is tested in Node, where it belongs. What is
 * left for a browser is the half a pure function cannot answer: that the tab draws two
 * stores and no third column, that the marker is a control a reader can press, and — the
 * criteria that are about **absence** — that no row carries a decision, a class pill or a
 * tint. A missing control passes every unit test there is, so the only place to ask is a
 * mounted component.
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

const sibling = (units = THERE, part = {}) => ({
  store: 'be',
  page: 'carport',
  rule: 'alternate',
  units,
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

const markers = (host) => [...host.querySelectorAll('tbody tr[id^="run-"]')];
const rowIds = (host) =>
  [...host.querySelectorAll('tbody tr[id]')]
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
    const heads = [...host.querySelectorAll('thead th')].map((th) => th.textContent);
    expect(heads).toEqual(['nl — Netherlands', 'be — Belgium (Dutch)']);
    expect(host.textContent).not.toContain('source of truth');
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
      sibling: sibling([unit('Alleen daar', 0)]),
    });

    expect(rowIds(host)).toEqual(['b0', 's0']);
    const tinted = [...host.querySelectorAll('td')].filter(
      (cell) => cell.classList.contains(SURFACE.lost) || cell.classList.contains(SURFACE.added),
    );
    expect(tinted).toEqual([]);
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
    const host = mount({ sibling: sibling(null) });

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
      sibling: sibling([unit(long('tweede'), 0)]),
    });

    expect(host.textContent).toContain('This block is too large for the word comparison');
    expect(host.textContent).toContain(long('eerste'));
    expect(host.textContent).toContain(long('tweede'));
    expect(host.querySelectorAll('del, ins')).toHaveLength(0);
  });

  it('draws nothing at all where no sibling was matched', () => {
    // The tab is absent on such a page and `Ledger.jsx` is where that is decided. This
    // is the same answer said where the reading is, so the component cannot be mounted
    // into a state it has no words for.
    expect(mount({ sibling: null }).textContent).toBe('');
  });
});
