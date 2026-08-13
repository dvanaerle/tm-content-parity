import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { userEvent } from '@vitest/browser/context';
import { afterEach, describe, expect, it } from 'vitest';
import Repeats from './Repeats.jsx';

/**
 * The selection and the presses it arms, mounted and clicked (ticket 110). Two of them
 * since ticket 112 took the second judgement out of the interface: a dismissal and its undo.
 *
 * It is a browser test and it is an acceptance criterion rather than a nicety. Ticket 31
 * shipped a `BulkControl` that referenced a form component it never defined: 628 unit tests
 * passed, the build was clean, and the press threw during render and took the dashboard
 * island down with it — because every decision lived in `.mjs` and nothing mounted the
 * `.jsx`. This ticket adds a control to that same component, so the path from a checkbox
 * to `appendMany()` is walked here by clicking it.
 */

/** A repeat as `repeatsInStore()` returns it, on three pages. */
const repeat = {
  key: '["nl","copy","oud","nieuw",null]',
  store: 'nl',
  class: 'copy',
  prod: 'oud',
  new: 'nieuw',
  detail: null,
  occurrences: 3,
  on: [
    { page: 'overkapping', id: 'f1', occurrences: 1 },
    { page: 'veranda', id: 'f2', occurrences: 1 },
    { page: 'carport', id: 'f3', occurrences: 1 },
  ],
};

/** A second difference in the same list, for the questions that need two of them. */
const other = {
  key: '["nl","copy","links","rechts",null]',
  store: 'nl',
  class: 'copy',
  prod: 'links',
  new: 'rechts',
  detail: null,
  occurrences: 1,
  on: [{ page: 'tuinhuis', id: 'g1', occurrences: 1 }],
};

const derived = (id, extra = {}) => ({
  id, state: 'open', shown: true, class: 'copy', anchorHeading: 'Afmetingen', occurrences: 1, ...extra,
});

const byFinding = (overrides = {}) => new Map(
  repeat.on.map((entry) => [entry.id, derived(entry.id, overrides[entry.id] ?? {})]),
);

/**
 * The `bulk` bag the dashboard hands down, with a spy where the log is. `written` is what
 * `appendMany()` answers, so the component's own report reads a success.
 */
function bulkBag(over = {}) {
  const calls = [];
  return {
    calls,
    canWrite: true,
    busy: false,
    appendMany: async (events) => {
      calls.push(events);
      return { written: events.length, total: events.length, failedOn: null, error: null };
    },
    notWritingReason: null,
    ...over,
  };
}

function mount(props = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const bulk = props.bulk ?? bulkBag();
  act(() => root.render(createElement(Repeats, {
    repeats: [repeat],
    byFinding: byFinding(),
    bulk,
    link: (store, page) => `/${store}/${page}/`,
    ...props,
  })));
  return { bulk, unmount: () => act(() => root.unmount()) };
}

/** Every button whose words start with these, which is how the two presses are found. */
const button = (words) => [...document.querySelectorAll('button')]
  .find((element) => element.textContent.trim().startsWith(words));

const press = (element) => act(() => element.click());

/** A press that writes, which is awaited: `appendMany()` is a promise. */
const pressAndWait = (element) => act(async () => { element.click(); });

/**
 * Typing the note, with the browser's own keyboard rather than a synthesised event. The
 * note is what makes a press possible at all, so it is worth pressing keys for.
 */
const type = (value) => userEvent.fill(document.querySelector('[data-slot="input"]'), value);

/** The row that opens the difference, which is the whole row again since round two. */
const differenceRow = () => document.querySelector('[data-slot="collapsible-trigger"]');

/** The tick in the selection column's header, which is where the select-all lives. */
const selectAll = () => document.querySelector('thead [data-slot="checkbox"]');

/** The page checkboxes, which are the ones on the rows and not the one in the header. */
const pageTicks = () => [...document.querySelectorAll('tbody [data-slot="checkbox"]')];

afterEach(() => { document.body.innerHTML = ''; });

describe('the selection on a difference', () => {
  it('opens with nothing ticked and nothing to press', () => {
    const { unmount } = mount();

    press(differenceRow());

    // The three pages are a table now, each with its own tick, and none of them is on.
    expect(pageTicks()).toHaveLength(3);
    expect(pageTicks().every((tick) => tick.getAttribute('aria-checked') === 'false')).toBe(true);

    // Nothing is selected, so there is nothing for an action to act on and no action is
    // offered. A bar carrying buttons that would write nothing is the thing this replaces.
    expect(button('Negeren')).toBeUndefined();
    unmount();
  });

  /**
   * The bar floats over the screen and does not sit in the list (ticket 110, round three).
   *
   * It was a strip below the difference, which pushed everything under it down the moment a
   * tick was made and scrolled off the top as soon as the editor read further into a long
   * page list — the presses gone while the selection they act on is still on screen.
   *
   * The rule is read off the class list because **no stylesheet is loaded here**: this
   * project mounts components without the app's CSS, so `getComputedStyle` answers `static`
   * for every element in it and would pass whatever this said.
   */
  it('floats the bar at the bottom of the screen rather than in the list', () => {
    const { unmount } = mount();

    press(differenceRow());
    press(pageTicks()[0]);

    const bar = document.querySelector('[data-slot="bulk-bar"]');
    expect(bar.className).toContain('fixed');
    expect(bar.className).toContain('bottom-');
    unmount();
  });

  /**
   * One selection in the whole list, because there is one place for the bar to be.
   *
   * Two differences could each hold ticks while the bar was a strip under each of them, and
   * each strip said which difference it belonged to. Fixed to the bottom of the screen,
   * two of them are one bar on top of another — so ticking in a second difference takes the
   * selection, and the first puts its ticks down.
   */
  it('holds one selection across the list, and the newest difference takes it', () => {
    const map = new Map([...byFinding(), ['g1', derived('g1')]]);
    const { unmount } = mount({ repeats: [repeat, other], byFinding: map });

    const rows = () => [...document.querySelectorAll('[data-slot="collapsible-trigger"]')];
    press(rows()[0]);
    press(rows()[1]);

    press(pageTicks()[0]);
    expect(document.querySelectorAll('[data-slot="bulk-bar"]')).toHaveLength(1);

    // The fourth tick is the other difference's only page: three above it, then this one.
    press(pageTicks()[3]);

    const bars = document.querySelectorAll('[data-slot="bulk-bar"]');
    expect(bars).toHaveLength(1);
    expect(bars[0].textContent).toContain('links');
    expect(pageTicks()[0].getAttribute('aria-checked')).toBe('false');
    unmount();
  });

  it('raises a bar that counts the ticks and names the difference they belong to', () => {
    const { unmount } = mount();

    press(differenceRow());
    press(pageTicks()[0]);
    press(pageTicks()[1]);

    // Two open differences with ticks in both must never produce one count that does not
    // say what it counts, so the bar carries the words of its own difference.
    const bar = document.querySelector('[data-slot="bulk-bar"]');
    expect(bar.textContent).toContain("2 van 3 pagina's");
    expect(bar.textContent).toContain('oud');
    expect(bar.textContent).toContain('nieuw');

    // The press states the **selected** count and not the repeat's size.
    expect(button("Negeren op 2 pagina's")).toBeDefined();
    unmount();
  });

  it('dismisses the ticked pages, one event each, and no others', async () => {
    const { bulk, unmount } = mount();

    press(differenceRow());
    press(pageTicks()[0]);
    press(pageTicks()[2]);
    press(button("Negeren op 2 pagina's"));

    // Ticking writes nothing: the press still costs a button, a note and a submit, and
    // there is no path from a checkbox to the log without all three.
    expect(bulk.calls).toHaveLength(0);

    await type('afgesproken met de redactie');
    await pressAndWait(button("Negeren op 2 pagina's"));

    expect(bulk.calls).toHaveLength(1);
    expect(bulk.calls[0].map((event) => event.page)).toEqual(['overkapping', 'carport']);
    expect(bulk.calls[0].every((event) => event.action === 'dismissed')).toBe(true);
    unmount();
  });

  /**
   * Round one put the select-all on the difference row, so a closed difference could be
   * ticked whole. It bought a checkbox inside a `CollapsibleTrigger` — a button inside a
   * button, which is neither valid nor clickable — and a press an editor could arm over
   * pages they had never seen. **A selection is made in the list of things being
   * selected**, so the tick is the selection column's header and the row is a trigger
   * from edge to edge again.
   */
  it('carries the select-all in the table header and nothing on the difference row', () => {
    const { unmount } = mount();

    // Closed, there is no tick anywhere: nothing to select until the list is on screen.
    expect(document.querySelector('[data-slot="checkbox"]')).toBeNull();

    press(differenceRow());

    expect(selectAll()).not.toBeNull();
    press(selectAll());
    expect(document.querySelector('[data-slot="bulk-bar"]').textContent).toContain("3 van 3 pagina's");
    unmount();
  });

  it('reads as mixed while some of its pages are ticked', () => {
    const { unmount } = mount();

    press(differenceRow());
    expect(selectAll().getAttribute('aria-checked')).toBe('false');

    press(pageTicks()[0]);
    expect(selectAll().getAttribute('aria-checked')).toBe('mixed');

    press(pageTicks()[1]);
    press(pageTicks()[2]);
    expect(selectAll().getAttribute('aria-checked')).toBe('true');

    // It is a control and never a summary: the same tick that says *mixed* clears it.
    press(selectAll());
    expect(pageTicks().every((tick) => tick.getAttribute('aria-checked') === 'false')).toBe(true);
    unmount();
  });

  /**
   * Round one ticked only the pages a dismissal could act on, and left a decided one
   * unticked — while that same row stayed tickable by hand. One control refusing what the
   * other allows, on the same rows, for no reason an editor can see. The ticks say *these
   * pages*; what each press does with them is the press's own business, and it says so.
   */
  it('ticks every page, including one a colleague already decided', () => {
    const { unmount } = mount({ byFinding: byFinding({ f2: { state: 'dismissed' } }) });

    press(differenceRow());
    press(selectAll());

    expect(document.querySelector('[data-slot="bulk-bar"]').textContent).toContain("3 van 3 pagina's");
    expect(pageTicks().map((tick) => tick.getAttribute('aria-checked')))
      .toEqual(['true', 'true', 'true']);
    expect(selectAll().getAttribute('aria-checked')).toBe('true');

    // The decided page is still drawn with its state, and the dismissal still leaves it
    // alone: two of the three, not three.
    expect(document.querySelector('table').textContent).toContain('genegeerd');
    expect(button("Negeren op 2 pagina's")).toBeDefined();
    unmount();
  });

  /**
   * A difference whose every finding is decided has nothing left to dismiss, and one press
   * is left standing: an undo is what a decided page is *for*. A second judgement used to be
   * the other tool here (ticket 110), and ADR 0011 took it — so this is the case most likely
   * to read as a broken screen, and the bar has to say why the press is gone rather than
   * merely be missing it.
   */
  it('offers only the undo where every finding is decided, and says why', () => {
    const { unmount } = mount({
      byFinding: byFinding({
        f1: { state: 'dismissed', override: { action: 'dismissed' } },
        f2: { state: 'dismissed', override: { action: 'dismissed' } },
        f3: { state: 'fixed', override: { action: 'fixed' } },
      }),
    });

    press(differenceRow());
    press(selectAll());

    const bar = document.querySelector('[data-slot="bulk-bar"]');
    expect(bar.textContent).toContain("3 van 3 pagina's");
    expect(selectAll().getAttribute('aria-checked')).toBe('true');

    expect(button('Negeren')).toBeUndefined();
    // *Afgehandeld* and never *beslist*: `f3` is a claim of fact and not a judgement, and
    // the third page is why the looser word would be a lie about a colleague's tick.
    expect(bar.textContent).toContain('Elke bevinding hier is al afgehandeld, dus er is niets te negeren');
    // Two of the three: a claim of fact is not this control's to take back — `fixed` has
    // its own checkbox on the page, and two controls for one event would let them disagree.
    expect(button("Ongedaan maken op 2 pagina's")).toBeDefined();
    unmount();
  });

  // The sentence above the button counts the same pages the events do, so its total is the
  // selection and never the repeat. *1 van de 3* on a two-page selection would report a
  // remainder the press was never aimed at.
  it('says how many of the ticked pages it leaves alone, out of the ticked ones', () => {
    const { unmount } = mount({ byFinding: byFinding({ f2: { state: 'dismissed' } }) });

    press(differenceRow());
    press(pageTicks()[0]);
    press(pageTicks()[1]);
    press(button('Negeren op deze pagina'));

    const bar = document.querySelector('[data-slot="bulk-bar"]');
    expect(bar.textContent).toContain('1 pagina van de 2');
    unmount();
  });

  /**
   * If one press can put ten pages in a state, something has to take them out of it. Round
   * one drew the state badge and stopped, so a bulk dismissal was a one-way door and the
   * way back was ten pages — the work this ticket exists to remove.
   */
  it('clears a decision on the ticked pages that carry one', async () => {
    const { bulk, unmount } = mount({
      byFinding: byFinding({
        f1: { state: 'dismissed', override: { action: 'dismissed' } },
        f2: { state: 'dismissed', override: { action: 'dismissed' } },
      }),
    });

    press(differenceRow());
    press(selectAll());

    // Over the ticked pages it can act on: the third is open and has nothing to undo.
    await pressAndWait(button("Ongedaan maken op 2 pagina's"));

    expect(bulk.calls).toHaveLength(1);
    // No note and no second press: a `cleared` event carries no reason, and the single
    // control it mirrors asks for none either.
    expect(bulk.calls[0]).toEqual([
      {
        scope: 'finding', action: 'cleared', store: 'nl', page: 'overkapping', findingId: 'f1',
      },
      {
        scope: 'finding', action: 'cleared', store: 'nl', page: 'veranda', findingId: 'f2',
      },
    ]);
    unmount();
  });

  it('offers no undo where nothing is decided', () => {
    const { unmount } = mount();

    press(differenceRow());
    press(selectAll());

    expect(button('Ongedaan maken')).toBeUndefined();
    unmount();
  });

  /**
   * Putting the selection down costs one press, and on a floating bar that press is the
   * cross at its end — the one control every bar of this kind puts there. It is a glyph, so
   * the words it would have said are its label: a button whose accessible name is `✕` names
   * nothing.
   */
  it('clears the selection from the bar', () => {
    const { unmount } = mount();

    press(differenceRow());
    press(pageTicks()[0]);
    press(document.querySelector('[aria-label="Selectie wissen"]'));

    expect(document.querySelector('[data-slot="bulk-bar"]')).toBeNull();
    expect(pageTicks().every((tick) => tick.getAttribute('aria-checked') === 'false')).toBe(true);
    unmount();
  });

  // It is a question about one press and not a state of the queue, so closing the
  // difference puts it down.
  it('forgets the selection when the difference is closed', () => {
    const { unmount } = mount();

    press(differenceRow());
    press(pageTicks()[0]);
    press(differenceRow());

    expect(document.querySelector('[data-slot="bulk-bar"]')).toBeNull();

    press(differenceRow());
    expect(pageTicks().every((tick) => tick.getAttribute('aria-checked') === 'false')).toBe(true);
    unmount();
  });

  // The sentence used to stand where the buttons would be; it must not be lost with them
  // now that the bar is what carries them. A control that vanishes without a reason reads
  // as a missing feature.
  it('still raises a bar with no editor name, and the bar says a name is needed', () => {
    const { unmount } = mount({
      bulk: bulkBag({ canWrite: false, notWritingReason: 'Vul je naam in om te beslissen.' }),
    });

    press(differenceRow());
    press(pageTicks()[0]);

    const bar = document.querySelector('[data-slot="bulk-bar"]');
    expect(bar).not.toBeNull();
    expect(bar.textContent).toContain('Vul je naam in om te beslissen.');
    expect(button('Negeren')).toBeUndefined();
    unmount();
  });

  /**
   * `searchStore()` builds its repeats out of matched findings only, and a term can be in
   * one page's key and not another's. So a searched row saying *op 3 pagina's* means three
   * **matching** pages, and ticking all of them leaves any unmatched page of the same
   * difference open. That is the right behaviour and the wrong sentence if the sentence is
   * silent, so the list says it and the unsearched list does not.
   */
  it('says its pages are the ones the search found, when a search found them', () => {
    const found = mount({ searched: true });

    press(differenceRow());
    expect(document.querySelector('table').textContent).toContain('zoekterm');
    found.unmount();

    document.body.innerHTML = '';
    const all = mount();

    press(differenceRow());
    expect(document.querySelector('table').textContent).not.toContain('zoekterm');
    all.unmount();
  });

  // `aria-checked="mixed"` is the whole of the third state for a screen reader and none of
  // it for an eye. A tick that draws the same glyph for *all of them* and *some of them*
  // says one of the two things wrongly.
  it('draws the mixed state as its own mark and not as a tick', () => {
    const { unmount } = mount();

    press(differenceRow());
    press(pageTicks()[0]);
    const mixed = document.querySelector('[data-slot="checkbox-indicator"] svg').getAttribute('class');

    press(selectAll());
    const all = document.querySelector('[data-slot="checkbox-indicator"] svg').getAttribute('class');

    expect(mixed).not.toBe(all);
    unmount();
  });
});
