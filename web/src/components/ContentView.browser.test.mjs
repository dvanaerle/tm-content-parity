import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import ContentView from './ContentView.jsx';

/**
 * The content view opens on the differences (ticket 79, ADR 0006).
 *
 * `collapseRuns()` is the rule and it is tested in Node, where it belongs. What is left
 * for a browser is the half a pure function cannot answer: that the marker is a control
 * a reader can press, and that **a jump opens the collapsed run holding the row it
 * names** — which is a question about `location.hash`, about `hashchange` and about the
 * row being in the document by the time the browser goes looking for it. Ticket 68 built
 * the other half of that criterion and could not finish this one, because there was no
 * run to open yet.
 *
 * It is also the first test to mount this component at all. Ticket 110 records why that
 * matters: a control that references a component nobody mounted passes every unit test
 * there is and throws on the first press.
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

/**
 * A page shaped like the one this ticket is for: two differences with a run of agreeing
 * blocks between them, and a third agreeing block at the end.
 */
function report() {
  const production = [
    unit('Verkrijgbaar in drie kleuren', 0),
    unit('Gelijk een', 1),
    unit('Gelijk twee', 2),
    unit('Gelijk drie', 3),
    unit('Weg van de nieuwe site', 4),
    unit('Gelijk vier', 5),
  ];
  const next = [
    unit('Beschikbare kleuren', 0),
    unit('Gelijk een', 1),
    unit('Gelijk twee', 2),
    unit('Gelijk drie', 3),
    unit('Gelijk vier', 4),
  ];

  return {
    store: 'nl',
    page: 'overkapping',
    sides: {
      production: { url: 'https://prod.example/overkapping', markdown: '#', elements: production },
      new: { url: 'https://new.example/overkapping', markdown: '#', elements: next },
    },
    rows: [
      { class: 'copy', prod: 0, new: 0, score: 0.7, finding: 'copy1' },
      { class: null, prod: 1, new: 1, score: null, finding: null },
      { class: null, prod: 2, new: 2, score: null, finding: null },
      { class: null, prod: 3, new: 3, score: null, finding: null },
      { class: 'text-missing', prod: 4, new: null, score: null, finding: 'lost1' },
      { class: null, prod: 5, new: 4, score: null, finding: null },
    ],
  };
}

const findings = [
  { id: 'copy1', class: 'copy', check: 'text', visibility: 'work', state: 'open', occurrences: 1 },
  {
    id: 'lost1',
    class: 'text-missing',
    check: 'text',
    visibility: 'work',
    state: 'open',
    occurrences: 1,
  },
];

/** Every agreeing page: the trap this ticket names, and what a finished page looks like. */
function agreeingReport() {
  const elements = [unit('Gelijk een', 0), unit('Gelijk twee', 1)];
  return {
    store: 'nl',
    page: 'gelijk',
    sides: {
      production: { url: 'https://prod.example/g', markdown: '#', elements },
      new: { url: 'https://new.example/g', markdown: '#', elements },
    },
    rows: [
      { class: null, prod: 0, new: 0, score: null, finding: null },
      { class: null, prod: 1, new: 1, score: null, finding: null },
    ],
  };
}

/**
 * A mounted view and a way to render it again — which is what a tick is from this
 * component's side: the log re-derives the findings and hands down new ones.
 */
function mounting(props = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);

  const render = (again = {}) =>
    act(() =>
      root.render(
        createElement(ContentView, {
          report: report(),
          findings,
          showNoise: false,
          control: () => null,
          landing: null,
          ...props,
          ...again,
        }),
      ),
    );

  render();
  return { host, render };
}

const mount = (props = {}) => mounting(props).host;

/**
 * A press, in the idiom the other browser tests here use: the element's own `click()`
 * inside `act()`. Not `userEvent`, which drives a real pointer and therefore needs the
 * element to have a size — and no stylesheet is loaded here, so a `size-4` checkbox is
 * a zero-pixel target. The question these tests ask is what the component does with a
 * click, not whether it can be hit.
 */
const press = (element) => act(() => element.click());

/** The markers on screen, in document order. */
const markers = (host) => [...host.querySelectorAll('tbody tr[id^="run-"]')];
const rowIds = (host) =>
  [...host.querySelectorAll('tbody tr[id]')]
    .map((row) => row.id)
    .filter((id) => !id.startsWith('run-'));

afterEach(() => {
  document.body.innerHTML = '';
  // The hash outlives the document, and a test that left one would decide the next one's
  // opening state for it.
  history.replaceState(null, '', location.pathname);
});

describe('the content view opens on the differences', () => {
  it('draws the differing rows and collapses each run of agreeing blocks into one marker', () => {
    const host = mount();

    expect(rowIds(host)).toEqual(['p0', 'p4']);
    // **Agree** is the interface's one word for this, and `CONTEXT.md` records it.
    // The marker said *unchanged*, the status cell said *equal* and the sentence on an
    // all-agreeing page said *agrees* — three words on one screen for one thing, and
    // *unchanged* is spent elsewhere on a finding id that survives a re-measure.
    expect(markers(host).map((marker) => marker.textContent)).toEqual([
      '3 agreeing blocks',
      '1 agreeing block',
    ]);
  });

  it('puts the class pill on every differing row, and no tint on any row', () => {
    // Ticket 12 retired the *Diff* tab because it showed the differing rows only, "so
    // once every row was tinted the tint said nothing". Every visible row here is a
    // difference, so the pill carries the class and the row carries no colour.
    const host = mount();

    const rows = [...host.querySelectorAll('tbody tr[id]')].filter(
      (row) => !row.id.startsWith('run-'),
    );
    expect(rows.map((row) => row.querySelector('td span')?.textContent)).toEqual([
      'copy',
      'text-missing',
    ]);

    // Two rows of two different classes, dressed the same. Nothing at row level reads
    // the class, so there is no tint to say nothing — and the assertion is written as
    // *these two agree* rather than as a list of colours this row must not have,
    // because a new tone would slip past that list on the day it was added.
    expect(rows[0].className).toBe(rows[1].className);
    expect(rows[0].className).not.toMatch(/subtle/);
  });

  it('says a row agrees because its two sides do, and not because it carries no class', () => {
    // The status cell used to print the word whenever `row.class` was falsy, which reads
    // the wrong field: a row agrees because `prod.norm === next.norm`, and the row
    // carries that answer in `equal`. The comparer cannot hand this shape over today — a
    // null class is an exact tier-1 pair and nothing else — so this is the guard on the
    // cell's rule rather than a difference a reader has met. Ticket 48 widens
    // `collapses()` to rows that do not agree, and a cell inferring the word from the
    // same absence would start saying they do on the day it lands.
    const differing = report();
    differing.rows = [{ class: null, prod: 0, new: 0, score: null, finding: null }];

    const host = mount({ report: differing, findings: [] });

    // The row is drawn, and its status cell says nothing rather than saying the wrong
    // thing: there is no class to put in a pill and the two sides do not agree.
    expect(rowIds(host)).toEqual(['p0']);
    expect(host.querySelector('tbody tr[id="p0"] td').textContent.trim()).toBe('');
  });

  it('expands a marker on a press, and collapses it again', async () => {
    const host = mount();
    const control = markers(host)[0].querySelector('button');

    expect(control.getAttribute('aria-expanded')).toBe('false');

    await press(control);
    expect(rowIds(host)).toEqual(['p0', 'p1', 'p2', 'p3', 'p4']);

    await press(markers(host)[0].querySelector('button'));
    expect(rowIds(host)).toEqual(['p0', 'p4']);
  });

  it('opens every run at once from the one control the filter left behind', async () => {
    // *Differences only* narrowed the view; this widens it. The same want, said as a
    // collapse instead of a filter, so no control is left that could be mistaken for one
    // that moves a count.
    const host = mount();
    // The visible control, not the hidden input Base UI keeps beside it for the form.
    const box = [...host.querySelectorAll('label')]
      .find((label) => label.textContent.includes('Show agreeing blocks'))
      .querySelector('[data-slot="checkbox"]');

    await press(box);
    expect(rowIds(host)).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);
  });

  it('opens the collapsed run that holds the row a hash link names', async () => {
    // The criterion ticket 68 handed over. `p2` is the middle of a run of three, so a
    // link to it lands on a marker unless the run opens with it.
    history.replaceState(null, '', '#p2');
    const host = mount();

    await act(async () => {});
    expect(rowIds(host)).toContain('p2');
    expect(markers(host)[0].querySelector('button').getAttribute('aria-expanded')).toBe('true');
  });

  it('lets a press close the run a hash link opened', async () => {
    // A jump **seeds** the open runs; it does not hold them open. Holding them was a
    // second answer about one marker, and a second answer is a state the chevron cannot
    // leave: the press took the key out of the open set and the hash put it straight
    // back, so the run could never be shut again for as long as the address stood.
    history.replaceState(null, '', '#p2');
    const host = mount();

    await act(async () => {});
    expect(rowIds(host)).toContain('p2');

    await press(markers(host)[0].querySelector('button'));
    expect(rowIds(host)).toEqual(['p0', 'p4']);
  });

  it('opens the run a jump reaches after the first, which is what an outline click is', async () => {
    const host = mount();
    expect(rowIds(host)).not.toContain('p5');

    await act(async () => {
      location.hash = '#p5';
    });

    expect(rowIds(host)).toContain('p5');
  });

  it('says a run holds no open work when somebody closed the finding in it', () => {
    // Ticket 48. Ticket 79 proposed no copy and left the strings here, and there are
    // two: blocks nobody found anything in **agree** with production, and a run holding
    // work an editor closed says what is true of every row in it. The ticked row joins
    // the run above it, so this is one marker of four and not two markers — a run is a
    // unit of skipping, not of reading.
    const host = mount({ findings: [{ ...findings[0], state: 'fixed' }, findings[1]] });

    expect(markers(host).map((marker) => marker.textContent)).toEqual([
      '4 blocks with no open work',
      '1 agreeing block',
    ]);
  });

  it('leaves a row where the editor left it when they tick it', async () => {
    // The collapse set is taken **when the page opens**. On a 168-row page an editor
    // working top-down would otherwise lose their place at every tick, which is worse
    // than the noise being removed — and they could not check what they had just
    // claimed. The fold answers *what did I arrive with*, so the ticked row stays and
    // joins the run the next time the page is opened.
    const { host, render } = mounting();
    expect(rowIds(host)).toEqual(['p0', 'p4']);

    await render({ findings: [{ ...findings[0], state: 'fixed' }, findings[1]] });

    expect(rowIds(host)).toEqual(['p0', 'p4']);
  });

  it('says so on a page where nothing differs, rather than drawing one marker alone', () => {
    const host = mount({ report: agreeingReport(), findings: [] });

    expect(host.textContent).toContain('Nothing differs on this page');
    expect(markers(host)).toHaveLength(1);
  });

  it('leaves a contradicted row on screen while the rows around it collapse', () => {
    // The three states the ticket asks to see on one page: `copy1` is dismissed and
    // goes behind a marker, `lost1` is a claim the snapshot disagrees with and stays.
    // It is Needs attention and not Closed — open work wearing a tick, and the one row
    // an editor most needs left where it is.
    const host = mount({
      findings: [
        { ...findings[0], state: 'dismissed' },
        { ...findings[1], state: 'contradicted' },
      ],
    });

    expect(rowIds(host)).toEqual(['p4']);
    expect(markers(host).map((marker) => marker.textContent)).toEqual([
      '4 blocks with no open work',
      '1 agreeing block',
    ]);
  });

  it('says a page is finished, rather than saying its blocks agree', () => {
    // Ticket 48 makes this state common and desirable: it is what finishing a page
    // looks like. *Nothing differs* would be a lie about it — the differences are all
    // still there, an editor closed them — and an empty table would be worse.
    const host = mount({
      findings: findings.map((finding) => ({ ...finding, state: 'dismissed' })),
    });

    expect(rowIds(host)).toEqual([]);
    expect(host.textContent).toContain('Nothing left to do on this page');
    expect(host.textContent).not.toContain('Nothing differs');
  });
});
