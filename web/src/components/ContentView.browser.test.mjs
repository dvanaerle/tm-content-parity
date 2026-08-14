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

function mount(props = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);

  act(() =>
    root.render(
      createElement(ContentView, {
        report: report(),
        findings,
        showNoise: false,
        control: () => null,
        landing: null,
        ...props,
      }),
    ),
  );

  return host;
}

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
  it('draws the differing rows and folds each run of agreeing blocks into one marker', () => {
    const host = mount();

    expect(rowIds(host)).toEqual(['p0', 'p4']);
    expect(markers(host).map((marker) => marker.textContent)).toEqual([
      '3 unchanged blocks',
      '1 unchanged block',
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
    // fold instead of a filter, so no control is left that could be mistaken for one
    // that moves a count.
    const host = mount();
    // The visible control, not the hidden input Base UI keeps beside it for the form.
    const box = [...host.querySelectorAll('label')]
      .find((label) => label.textContent.includes('Show unchanged blocks'))
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

  it('opens the run a jump reaches after the first, which is what an outline click is', async () => {
    const host = mount();
    expect(rowIds(host)).not.toContain('p5');

    await act(async () => {
      location.hash = '#p5';
    });

    expect(rowIds(host)).toContain('p5');
  });

  it('says so on a page where nothing differs, rather than drawing one marker alone', () => {
    const host = mount({ report: agreeingReport(), findings: [] });

    expect(host.textContent).toContain('Nothing differs on this page');
    expect(markers(host)).toHaveLength(1);
  });
});
