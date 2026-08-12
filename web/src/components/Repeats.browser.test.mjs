import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { userEvent } from '@vitest/browser/context';
import { afterEach, describe, expect, it } from 'vitest';
import Repeats from './Repeats.jsx';

/**
 * The selection and the two presses, mounted and clicked (ticket 110).
 *
 * It is a browser test and it is an acceptance criterion rather than a nicety. Ticket 31
 * shipped a `BulkControl` that referenced a `MuteForm` it never defined: 628 unit tests
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
    findingsByPage: new Map(repeat.on.map((entry) => [
      `nl/${entry.page}`, [derived(entry.id)],
    ])),
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

/** The row that opens the difference, which is the trigger and no longer the whole row. */
const differenceRow = () => document.querySelector('[data-slot="collapsible-trigger"]');

/** The tick that belongs to the difference itself, found the way a screen reader finds it. */
const selectAll = () => document.querySelector('[aria-label^="Kies de"]');

/** The page checkboxes, which are the ones inside the table. */
const pageTicks = () => [...document.querySelectorAll('table [data-slot="checkbox"]')];

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
    expect(button('Dempen')).toBeUndefined();
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

    // Both actions state the **selected** count and not the repeat's size.
    expect(button("Negeren op 2 pagina's")).toBeDefined();
    expect(button("Dempen op 2 pagina's")).toBeDefined();
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

  // The other press, walked the same way. The two are different judgements and not two
  // sizes of one, so neither is covered by the other's test.
  it('mutes the ticked pages, in the section each of them carries the difference under', async () => {
    const { bulk, unmount } = mount();

    press(differenceRow());
    press(pageTicks()[0]);
    press(pageTicks()[1]);
    press(button("Dempen op 2 pagina's"));

    await type('deze soort hoort hier niet');
    await pressAndWait(button("Dempen op 2 pagina's"));

    expect(bulk.calls).toHaveLength(1);
    expect(bulk.calls[0].map((event) => event.page)).toEqual(['overkapping', 'veranda']);
    expect(bulk.calls[0].every((event) => event.scope === 'page-class')).toBe(true);
    expect(bulk.calls[0].every((event) => event.anchorHeading === 'Afmetingen')).toBe(true);
    unmount();
  });

  /**
   * The trap this ticket names as its own: the difference row used to be a
   * `CollapsibleTrigger` from edge to edge, so a checkbox drawn inside it is swallowed —
   * the click opens the difference instead of ticking it, or does both. The tick is a
   * control of its own beside the trigger, which is also the only markup that is valid:
   * both are buttons, and a button inside a button is not.
   */
  it('selects every page from the difference row without opening it', () => {
    const { unmount } = mount();

    press(selectAll());

    // Still closed: the tick ticked, and the click never reached the trigger.
    expect(document.querySelector('table')).toBeNull();
    expect(differenceRow().getAttribute('aria-expanded')).toBe('false');

    // And it selected the pages the row says it is on, seen or not. That is the point of
    // it, and it is why the bar states a count and the difference it belongs to.
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

  it('leaves a page a colleague already decided out of the select-all', () => {
    const { unmount } = mount({ byFinding: byFinding({ f2: { state: 'dismissed' } }) });

    press(selectAll());
    press(differenceRow());

    // Two of the three, and the decided one is drawn with its state instead.
    expect(document.querySelector('[data-slot="bulk-bar"]').textContent).toContain("2 van 3 pagina's");
    expect(pageTicks().map((tick) => tick.getAttribute('aria-checked')))
      .toEqual(['true', 'false', 'true']);
    expect(document.querySelector('table').textContent).toContain('genegeerd');

    // And it reads *mixed*, because a page of this difference is not ticked. Saying
    // *ticked* over an unticked row would be the one thing a tri-state exists to avoid.
    expect(selectAll().getAttribute('aria-checked')).toBe('mixed');

    // From mixed, the tick clears — it is a control and never a summary, so it must never
    // be a control that cannot be pressed back.
    press(selectAll());
    expect(document.querySelector('[data-slot="bulk-bar"]')).toBeNull();
    unmount();
  });

  /**
   * A difference whose every finding is decided has nothing left to dismiss, and a mute is
   * still a live judgement there: it is about the class in the section rather than about
   * these two strings, and it is the one that does not expire. A select-all that ticked
   * nothing would take the mute off screen in exactly the place it is the only tool left —
   * the failure ticket 31 already fixed once, and the reason the rule bends here.
   */
  it('ticks every page of a difference that is already decided throughout', () => {
    const { unmount } = mount({
      byFinding: byFinding({
        f1: { state: 'dismissed' }, f2: { state: 'dismissed' }, f3: { state: 'fixed' },
      }),
    });

    press(selectAll());

    expect(document.querySelector('[data-slot="bulk-bar"]').textContent).toContain("3 van 3 pagina's");
    expect(selectAll().getAttribute('aria-checked')).toBe('true');

    // Nothing to dismiss, and the mute is on screen.
    expect(button('Negeren')).toBeUndefined();
    expect(button("Dempen op 3 pagina's")).toBeDefined();
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
   * The wall this ticket turns into *not this page*. One page of the repeat carries the
   * difference before its first heading, and that refuses the bulk mute for all of them —
   * correctly, since muting there hides everything before the first heading on every page.
   * The granularity was the problem, so the row is marked and unticking it is the answer.
   */
  it('marks the ticked pages that refuse a mute, and offers it once they are unticked', () => {
    const { unmount } = mount({ byFinding: byFinding({ f2: { anchorHeading: null } }) });

    press(differenceRow());

    // On the row, before anything is ticked: *untick exactly those* is only an instruction
    // if the rows say which they are before the ticking.
    const rows = () => [...document.querySelectorAll('tbody tr')];
    expect(rows()[1].textContent).toContain('niet te dempen');
    expect(rows()[0].textContent).not.toContain('niet te dempen');

    press(selectAll());

    press(button("Dempen op 3 pagina's"));
    expect(document.querySelector('[data-slot="bulk-bar"]').textContent)
      .toContain('vóór de eerste kop');

    press(button('Terug'));
    press(pageTicks()[1]);
    press(button("Dempen op 2 pagina's"));

    // No refusal left, so the note field is on screen and the press is a press.
    expect(document.querySelector('[data-slot="input"]')).not.toBeNull();
    unmount();
  });

  it('clears the selection from the bar', () => {
    const { unmount } = mount();

    press(differenceRow());
    press(pageTicks()[0]);
    press(button('Selectie wissen'));

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

  // And the bar says it too, because the select-all works on a **closed** row: an editor
  // can arm a press on ten matching pages having seen no page list at all, and the caption
  // under a table nobody opened is the silent sentence the trap names.
  it('says so in the bar as well, where a closed row was ticked', () => {
    const { unmount } = mount({ searched: true });

    press(selectAll());

    expect(document.querySelector('[data-slot="bulk-bar"]').textContent).toContain('zoekterm');
    unmount();
  });

  /**
   * One selection, two presses, two eligibilities. A dismissal may not touch a finding a
   * colleague decided; a mute's coverage deliberately **includes** it, because
   * `muteCoverage()` counts what a key covers and not what it changes (ADR 0008). So the
   * same ticked row is skipped by one press and counted by the other. The interface says
   * so; it does not resolve it by making the two agree, because they are not measuring the
   * same thing.
   */
  it('says that the mute counts a ticked page the dismissal would skip', () => {
    const { unmount } = mount({ byFinding: byFinding({ f2: { state: 'dismissed' } }) });

    press(differenceRow());
    press(pageTicks()[0]);
    press(pageTicks()[1]);
    press(button("Dempen op 2 pagina's"));

    const bar = document.querySelector('[data-slot="bulk-bar"]');
    expect(bar.textContent).toContain('1 van deze');
    expect(bar.textContent).toContain('telt dempen die mee');
    unmount();
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
