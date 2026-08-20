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
 * A page on the one store whose content is neither Dutch nor the interface's language,
 * with a heading so the jump list has something in it.
 */
function germanReport() {
  const heading = (index) =>
    unit('Farben und Formen', index, { tag: 'h2', kind: 'heading', level: 2 });
  const production = [heading(0), unit('In drei Farben lieferbar', 1)];
  const next = [heading(0), unit('Zwei Farben', 1)];

  return {
    store: 'de',
    page: 'terrassenueberdachung',
    sides: {
      production: { url: 'https://prod.example/t', markdown: '#', elements: production },
      new: { url: 'https://new.example/t', markdown: '#', elements: next },
    },
    rows: [
      { class: null, prod: 0, new: 0, score: null, finding: null },
      { class: 'copy', prod: 1, new: 1, score: 0.7, finding: 'copy1' },
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
          showDiagnostics: false,
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
    // The label and never the key: an editor reads what the class is, not what the
    // contract stores it as. Read off the named cell and not off the first one in the row:
    // the compared content leads now (ADR 0019), so the first cell holds a paragraph.
    expect(
      rows.map((row) => row.querySelector('[data-slot="status"] span')?.textContent),
    ).toEqual(['Copy changed', 'Text missing']);

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
    expect(
      host.querySelector('tbody tr[id="p0"] [data-slot="status"]').textContent.trim(),
    ).toBe('');
  });

  /**
   * The compared content leads the row (ADR 0019).
   *
   * The status column sat first and held a pill, a score, a date and a control — four facts
   * about the block, in front of the block. Nothing left the row; the order says which of it
   * an editor came for.
   */
  it('leads each row with the two compared texts and puts the status after them', () => {
    const host = mount();

    const cells = [...host.querySelectorAll('tbody tr[id="p0"] > *')];
    expect(cells[0].textContent).toContain('Verkrijgbaar in drie kleuren');
    expect(cells[1].textContent).toContain('Beschikbare kleuren');
    expect(cells[2].getAttribute('data-slot')).toBe('status');

    // The heads say the same thing, in the same order, and both sides are still named.
    expect([...host.querySelectorAll('thead th')].map((head) => head.textContent)).toEqual([
      'Production',
      'New site',
      'Status',
    ]);
  });

  /**
   * The block count, at the head of the list of blocks (ADR 0019).
   *
   * It was two of five facts in the page header, beside a status code and a boundary, and a
   * header reciting this tab's business competes with the page key for the one glance an
   * editor has. It is a relocation and not a removal.
   */
  it('says how many blocks each side holds, above the blocks', () => {
    const host = mount();

    // Six against five: production holds the block the new site lost.
    expect(host.textContent).toContain('Production 6 blocks');
    expect(host.textContent).toContain('New site 5 blocks');
  });

  describe('a table with nothing in it says why', () => {
    /** A page nothing was extracted from, which is not the same as a page that agrees. */
    it('names an extraction that found nothing', () => {
      const empty = report();
      empty.rows = [];
      empty.sides.production.elements = [];
      empty.sides.new.elements = [];

      const host = mount({ report: empty, findings: [] });

      expect(host.textContent).toContain('Nothing was extracted from either side');
      expect(host.textContent).toContain('Production 0 blocks');
    });

    /**
     * The filter, which **can** empty this list even though every class it offers has a row.
     *
     * The pills are counted under the diagnostics control and the pick is held in this
     * component; choose a diagnostic class and then switch the control off, and the rows go
     * while the filter stays set. Naming the control there would say *every block on this page
     * is a diagnostic* about a page holding five that are not.
     */
    it('names the filter where the filter is what emptied it', async () => {
      const { host, render } = mounting({
        report: (() => {
          const one = report();
          one.rows = [
            { class: 'copy', prod: 0, new: 0, score: 0.7, finding: 'noise1' },
            ...one.rows.slice(1),
          ];
          return one;
        })(),
        findings: [
          {
            id: 'noise1',
            class: 'copy',
            check: 'text',
            visibility: 'diagnostic',
            state: 'open',
            occurrences: 1,
          },
        ],
        showDiagnostics: true,
      });

      // Pick the one class on screen, which is the diagnostic one.
      const pill = [...host.querySelectorAll('button')].find((one) =>
        one.textContent.includes('Copy changed'),
      );
      await press(pill);

      // Now switch the control off, from outside: it is the ledger's and it is a prop.
      await render({ showDiagnostics: false });

      // The list really is empty, or the sentence below would be asserted about nothing.
      expect(rowIds(host)).toEqual([]);
      expect(host.textContent).toContain('in the classes you filtered on');
      expect(host.textContent).not.toContain('is a diagnostic');
    });

    /** A page whose every block the reader asked not to see, which is one press from undone. */
    it('names the diagnostics control where that is what emptied it', () => {
      const hidden = report();
      hidden.rows = [{ class: 'copy', prod: 0, new: 0, score: 0.7, finding: 'noise1' }];

      const host = mount({
        report: hidden,
        findings: [
          {
            id: 'noise1',
            class: 'copy',
            check: 'text',
            visibility: 'diagnostic',
            state: 'open',
            occurrences: 1,
          },
        ],
      });

      expect(host.textContent).toContain('Every block on this page is a diagnostic');
      expect(host.textContent).toContain('read the 1');
    });
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
    // than the clutter being removed — and they could not check what they had just
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

/**
 * Ticket 77, on the spine. The content view and the ledger wear the same mark, and the
 * reason both are asserted is that they are two tables: one date on one of them is the
 * shape this would regress into.
 */
describe('a content row says when its finding was first seen', () => {
  it('says the day the run log first saw the id', () => {
    const host = mount({
      findings: findings.map((one) =>
        one.id === 'copy1' ? { ...one, firstSeen: '2026-06-03T09:00:00.000Z' } : one,
      ),
    });

    expect(host.textContent).toContain('first seen 03 Jun 2026');
  });

  it('says nothing about a finding the index does not hold', () => {
    expect(mount().textContent).not.toContain('first seen');
  });
});

/**
 * Ticket 78, on the spine. The note is on both tables for the reason the date is: two
 * tables drawing one thing is two chances for one of them to stop drawing it.
 */
describe('a content row says what closed as its finding appeared', () => {
  const note = {
    count: 1,
    decision: {
      action: 'dismissed',
      editor: 'Danielle',
      at: '2026-08-14T12:00:00.000Z',
      note: 'Prijs verschilt per omgeving.',
    },
  };

  it('names what closed, and what an editor decided about it', () => {
    const host = mount({
      findings: findings.map((one) => (one.id === 'copy1' ? { ...one, historyNote: note } : one)),
    });

    expect(host.querySelector('[data-history-note]').textContent).toContain(
      'earlier on this page, a difference of this class closed',
    );
    expect(host.textContent).toContain('dismissed · Danielle · 14 Aug 2026');
  });

  it('says nothing where no id closed as the difference appeared', () => {
    expect(mount().querySelector('[data-history-note]')).toBeNull();
  });
});

/**
 * What language the content is in (ticket 125).
 *
 * The shell says `en-GB` and every cell inherited it, so a German page was announced with
 * English phonetics. The store decides, and the view draws the store — which is why these
 * mount `de` rather than the `nl` every other test here uses.
 */
describe('the language of the content', () => {
  /** The one finding the German page carries, so its row is drawn rather than withheld. */
  const german = findings.filter((finding) => finding.id === 'copy1');

  it('declares it on both texts of a row', () => {
    const host = mount({ report: germanReport(), findings: german });

    const declared = [...host.querySelectorAll('tbody [lang]')];
    expect(declared.map((one) => [one.lang, one.textContent])).toEqual([
      ['de', 'In drei Farben lieferbar'],
      ['de', 'Zwei Farben'],
    ]);
  });

  /** The jump list puts the whole heading in a `title`, and the link owns both. */
  it('declares it on the heading in the jump list, which owns the tooltip', () => {
    const host = mount({ report: germanReport(), findings: german });

    const jump = host.querySelector('nav a');
    expect(jump.lang).toBe('de');
    expect(jump.title).toBe('Farben und Formen');
  });

  it("leaves the interface's own words out of it", () => {
    const host = mount({ report: germanReport(), findings: german });

    const pill = host.querySelector('[data-slot="status"] span');
    expect(pill.textContent).toBe('Copy changed');
    expect([...host.querySelectorAll('[lang]')].some((one) => one.contains(pill))).toBe(false);
  });
});
