import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { Comparison, DiffCells } from './Diff.jsx';

/**
 * The diff's two layers, as tones (ticket 132).
 *
 * The layers used to be class strings looked up in two maps of two keys, and the maps
 * were the guard: `SURFACE.warning` was `undefined` and a reviewer saw it. They are
 * selectors now, and **a selector that does not match fails silently** — a status tone on
 * a diff cell would print no colour and throw nothing. So the refusal moves here, to a
 * mounted component, and it is the assertion the stylesheet cannot make about itself.
 *
 * What it does **not** assert is the colour. Nothing mounts `app.css` in this project, so
 * a computed background would be transparent for every tone alike and the test would pass
 * on a stylesheet that defined nothing. `palette.test.mjs` reads the stylesheet for the
 * other half — that the cell and word shapes are granted to these two tones and to no
 * other — and the pair of them is the guard the two-key map used to be.
 */

/** @type {(() => void)[]} */
const teardown = [];

afterEach(() => {
  for (const undo of teardown.splice(0)) undo();
});

/** Renders one element into a host of its own and hands the host back. */
function render(element) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(element));
  teardown.push(() => {
    act(() => root.unmount());
    host.remove();
  });
  return host;
}

/** `DiffCells` returns two `<td>`, so it needs a row to be legal in. */
const mount = (props) =>
  render(
    createElement(
      'table',
      null,
      createElement('tbody', null, createElement('tr', null, createElement(DiffCells, props))),
    ),
  );

/** Every element in the document that has asked the stylesheet for a shape. */
const worn = (host) =>
  [...host.querySelectorAll('[data-wears]')].map((one) => [
    one.dataset.wears,
    one.dataset.tone ?? null,
  ]);

/**
 * A pair over the rendering budget (ticket 68, ADR 0009). `DIFF_CELL_CAP` is 50,000
 * cells of `n · m` after the trim, so two runs of 250 words that share nothing reach it.
 */
const long = (word) => Array.from({ length: 250 }, (_, index) => `${word}${index}`).join(' ');

describe('the row layer', () => {
  it('tints the side that has the content, and only that side', () => {
    const host = mount({ prod: 'Alleen op productie', new: null });
    expect(worn(host)).toEqual([['cell', 'lost']]);

    const other = mount({ prod: null, new: 'Alleen op de nieuwe site' });
    expect(worn(other)).toEqual([['cell', 'added']]);
  });

  it('leaves both cells plain when the caller says the two sides are equals', () => {
    // `tinted={false}` is the sibling tab: two stores of a language block, neither of
    // which lost anything to the other.
    const host = mount({ prod: 'Alleen hier', new: null, tinted: false });
    expect(worn(host)).toEqual([]);
  });

  it('leaves both cells plain when the caller compared them itself and got equal', () => {
    const host = mount({ prod: 'https://prod.example/x', new: null, equal: true });
    expect(worn(host)).toEqual([]);
  });
});

describe('the word layer', () => {
  it('marks the words each side has, and tints no cell', () => {
    const host = mount({ prod: 'Verkrijgbaar in drie kleuren', new: 'Beschikbare drie kleuren' });

    // No `cell` anywhere: the two layers never stack, which is what lets the word take
    // the same pale ground the cell would have taken.
    expect(worn(host).filter(([wears]) => wears === 'cell')).toEqual([]);

    const marks = [...host.querySelectorAll('[data-wears="word"]')];
    expect(marks.map((one) => [one.tagName.toLowerCase(), one.dataset.tone])).toEqual([
      ['del', 'lost'],
      ['ins', 'added'],
    ]);
  });

  it('marks nothing when the pair was too large to compare', () => {
    const host = mount({ prod: long('een'), new: long('twee') });

    expect(host.textContent).toContain('Nothing was compared');
    expect(worn(host)).toEqual([]);
  });
});

describe('the two tones a diff may carry', () => {
  /**
   * The assertion the two-key map used to make. It sweeps every state the component has
   * rather than the one a rewrite would be likeliest to touch, because the failure it
   * catches is a *third* tone appearing somewhere — and a third tone would arrive in
   * whichever branch somebody was editing.
   */
  const STATES = [
    { prod: 'Alleen op productie', new: null },
    { prod: null, new: 'Alleen op de nieuwe site' },
    { prod: 'Verkrijgbaar in drie kleuren', new: 'Beschikbare drie kleuren' },
    { prod: 'Gelijke tekst', new: 'Gelijke tekst' },
    { prod: 'Alleen hier', new: null, tinted: false },
    { prod: 'https://prod.example/x', new: 'https://new.example/x', equal: true },
    { prod: long('een'), new: long('twee') },
    { prod: null, new: null },
  ];

  it('is lost and added, in every state the diff has', () => {
    const seen = STATES.flatMap((state) => worn(mount(state)));

    // The sweep has to actually sweep, or a component that emitted nothing would pass.
    expect(seen.length).toBeGreaterThan(3);
    for (const [wears, tone] of seen) {
      expect(['cell', 'word'], `${wears}/${tone}`).toContain(wears);
      expect(['lost', 'added'], `${wears}/${tone}`).toContain(tone);
    }
  });
});

/**
 * The contract every surface that draws a comparison inherits (ADR 0019, ticket 02).
 *
 * The words are asserted here and not at each surface on purpose: `SIDES` is the one place
 * they are written, so a test per surface would prove only that four files import the same
 * constant. What is worth pinning is that the pair reaches the screen, and that the arrow
 * the two flow surfaces used instead does not come back.
 */
describe('a comparison names its two sides', () => {
  /** `Comparison` is ordinary flow content and needs no table around it. */
  const flow = (props) => render(createElement(Comparison, props));

  it('labels production and the new site, in the words CONTEXT.md fixes', () => {
    const host = flow({ prod: 'Verkrijgbaar in drie kleuren', new: 'Beschikbare kleuren' });
    expect([...host.querySelectorAll('[data-side]')].map((one) => one.textContent)).toEqual([
      'Production',
      'New site',
    ]);
  });

  /**
   * `CONTEXT.md` retires *Changed* because the tool cannot know that one text became
   * another, and an arrow asserts exactly that. The caret and the word *to* are the same
   * claim in another glyph, so all three are refused together.
   */
  it('joins them with no arrow, in any of its states', () => {
    const drawn = [
      { prod: 'Oud', new: 'Nieuw' },
      { prod: 'Alleen op productie', new: null },
      { prod: null, new: 'Alleen op de nieuwe site' },
    ].map((state) => flow(state).textContent);

    for (const text of drawn) {
      expect(text, text).not.toMatch(/[→⟶➞>]|\bto\b/);
    }
  });

  it('says which side is absent, rather than drawing a dash for it', () => {
    expect(flow({ prod: 'Alleen op productie', new: null }).textContent).toContain('not present');
  });
});
