import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { userEvent } from '@vitest/browser/context';
import { afterEach, describe, expect, it } from 'vitest';
import Repeats, { ClassGroups } from './Repeats.jsx';
import { appendEach } from '../../../overrides/bulk.mjs';
import { repeatsInStore } from '../lib/view.mjs';

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

/**
 * A finding as `loadSummaries()` indexes one, and a page holding some.
 *
 * The repeats below are built by **`repeatsInStore()` itself** and are not written out as
 * literals. They were literals until ticket 03, and the shape drifted the moment the
 * derivation gained a field: three of these fixtures claimed a shape the real function had
 * stopped producing, and seventeen browser tests went down on the one field they lacked.
 * Built this way, a fixture cannot say something the derivation does not.
 */
const finding = (id, prod, next) => ({
  id,
  class: 'copy',
  prod,
  new: next,
  detail: null,
  occurrences: 1,
});
const on = (store, page, ...findings) => ({ store, page, findings });

/** A repeat on three pages of one store. */
const [repeat] = repeatsInStore([
  on('nl', 'overkapping', finding('f1', 'oud', 'nieuw')),
  on('nl', 'veranda', finding('f2', 'oud', 'nieuw')),
  on('nl', 'carport', finding('f3', 'oud', 'nieuw')),
]);

/** A second difference in the same list, for the questions that need two of them. */
const [other] = repeatsInStore([on('nl', 'tuinhuis', finding('g1', 'links', 'rechts'))]);

/**
 * A repeat spanning one language block: the same words on `nl/afhalen` and on `be/afhalen`
 * (ticket 03). `nl` and `be` share Dutch, so this is one row and one press.
 */
const acrossBlock = repeatsInStore([
  on('nl', 'afhalen', finding('f1', 'oud', 'nieuw')),
  on('be', 'afhalen', finding('f2', 'oud', 'nieuw')),
])[0];

const derived = (id, extra = {}) => {
  const { state = 'open', ...rest } = extra;
  return {
    id,
    state,
    visibility: 'work',
    class: 'copy',
    anchorHeading: 'Afmetingen',
    occurrences: 1,
    // A decided finding carries the event that decided it, the way `derivePageState()`
    // hands one over — the row draws the editor and the day, not the bare word.
    override:
      state === 'open'
        ? null
        : { action: state, editor: 'Danielle', at: '2026-08-14T12:00:00.000Z', note: null },
    ...rest,
  };
};

const byFinding = (overrides = {}) =>
  new Map(repeat.on.map((entry) => [entry.id, derived(entry.id, overrides[entry.id] ?? {})]));

/** The same, over several differences: the log the dashboard hands a whole list. */
const logOver = (repeats, overrides = {}) =>
  new Map(
    repeats.flatMap((one) =>
      one.on.map((entry) => [entry.id, derived(entry.id, overrides[entry.id] ?? {})]),
    ),
  );

/** Closed, in the words the bar counts in the numerator. */
const closed = { state: 'dismissed' };

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
      // `stored` is what the log echoed back, the way the real port does: the bar reads
      // it to take the ticks off the pages that were written.
      return {
        stored: events,
        written: events.length,
        total: events.length,
        stoppedOn: null,
        aborted: false,
        error: null,
      };
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
  const render = (over = {}) =>
    act(() =>
      root.render(
        createElement(props.component ?? Repeats, {
          repeats: [repeat],
          byFinding: byFinding(),
          logRead: true,
          bulk,
          link: (store, page) => `/${store}/${page}/`,
          ...props,
          ...over,
        }),
      ),
    );
  render();
  // `rerender` is a **decision landing under the editor**, which is the only way a mounted
  // list's log changes: the dashboard rebuilds `byFinding` and hands the new one down.
  return { bulk, rerender: render, unmount: () => act(() => root.unmount()) };
}

/** Every button whose words start with these, which is how the two presses are found. */
const button = (words) =>
  [...document.querySelectorAll('button')].find((element) =>
    element.textContent.trim().startsWith(words),
  );

const press = (element) => act(() => element.click());

/** A press that writes, which is awaited: `appendMany()` is a promise. */
const pressAndWait = (element) =>
  act(async () => {
    element.click();
  });

/**
 * Typing the note, with the browser's own keyboard rather than a synthesised event. The
 * note is what makes a press possible at all, so it is worth pressing keys for.
 */
const type = (value) => userEvent.fill(document.querySelector('[data-slot="input"]'), value);

/** The row that opens the difference, which is the whole row again since round two. */
const differenceRow = () => document.querySelector('[data-row="difference"]');

/** Every difference row's words, top-down, which is the order an editor reads. */
const rowOrder = () =>
  // A difference's own row, by the name the markup gives it. `ClassGroups` draws a second kind
  // of trigger for its headings, and the two were told apart by the tick beside one of them
  // until ticket 03 moved the class label out of the button and in between.
  [...document.querySelectorAll('[data-row="difference"]')].map((trigger) =>
    trigger.textContent.trim(),
  );

/**
 * A difference carrying a detail and a matched field, which is the row a search draws: the two
 * words beside the class label. They are what ticket 03 took out of the trigger along with the
 * label, and they belong back inside it.
 */
const detailed = {
  ...repeatsInStore([
    on('nl', 'afhalen', { ...finding('d1', 'oud', 'nieuw'), detail: 'IMAGE-MISSING' }),
  ])[0],
  fields: ['page'],
};

/** The words beside the class label, found by what they say rather than by a hook. */
const beside = (words) =>
  [...document.querySelectorAll('li span')].find((span) => span.textContent.trim() === words);

/** The tick in the selection column's header, which is one of the two a difference has. */
const selectAll = () => document.querySelector('thead [data-slot="checkbox"]');

/**
 * The ticks on the difference rows themselves (ticket 138): every checkbox in the list
 * that is not inside a page table, which is what makes a collapsed difference tickable.
 */
const rowTicks = () =>
  [...document.querySelectorAll('li [data-slot="checkbox"]')].filter(
    (tick) => !tick.closest('table'),
  );

/** The page checkboxes, which are the ones on the rows and not the one in the header. */
const pageTicks = () => [...document.querySelectorAll('tbody [data-slot="checkbox"]')];

/** The tick beside the result's count, which a search draws and *Repeats* does not. */
const selectResult = () =>
  document.querySelector('[data-slot="select-result"] [data-slot="checkbox"]');

/** What the one bar says, or nothing at all when there is no bar. */
const barText = () => document.querySelector('[data-slot="bulk-bar"]')?.textContent ?? null;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('what opens a difference', () => {
  /**
   * The detail and the matched fields are **inside** the trigger (ticket 03, round two).
   *
   * Only the class label had to leave it, because only the label is a link. Round one moved
   * all three out together and paid for one anchor with two dead words: on a searched list the
   * matched fields are the row's own explanation of why it is there, and a click on them did
   * nothing at all.
   */
  it('opens when the detail beside the class is pressed', () => {
    const { unmount } = mount({ repeats: [detailed], byFinding: logOver([detailed]) });

    press(beside('IMAGE-MISSING'));

    expect(pageTicks()).toHaveLength(1);
    unmount();
  });

  it('opens when the matched fields beside the class are pressed', () => {
    const { unmount } = mount({ repeats: [detailed], byFinding: logOver([detailed]) });

    press(beside('in the page name'));

    expect(pageTicks()).toHaveLength(1);
    unmount();
  });

  /**
   * And the label itself still does not, because it is a link. An anchor that also toggled the
   * row would be one press with two verbs, which is the distinction this ticket drew.
   */
  it('stays shut when the class label is pressed, because that is a link', () => {
    const { unmount } = mount({
      repeats: [detailed],
      byFinding: logOver([detailed]),
      classLink: (cls) => `/search/?classes=${cls}`,
    });

    const label = document.querySelector('a[data-badge="class"]');
    expect(label.getAttribute('href')).toBe('/search/?classes=copy');
    expect(label.closest('button')).toBeNull();
    expect(pageTicks()).toHaveLength(0);
    unmount();
  });
});

describe('the selection on a difference', () => {
  it('opens with nothing ticked and nothing to press', () => {
    const { unmount } = mount();

    press(differenceRow());

    // The three pages are a table now, each with its own tick, and none of them is on.
    expect(pageTicks()).toHaveLength(3);
    expect(pageTicks().every((tick) => tick.getAttribute('aria-checked') === 'false')).toBe(true);

    // Nothing is selected, so there is nothing for an action to act on and no action is
    // offered. A bar carrying buttons that would write nothing is the thing this replaces.
    expect(button('Dismiss')).toBeUndefined();
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
   * One selection over the whole list, and it is flat (ticket 138).
   *
   * It was one difference's until then: ticking in a second silently took the ticks away
   * from the first, so an editor who wanted one sentence over 259 differences paid 259
   * presses for it. The ticks now coexist, and there is still exactly **one** bar —
   * because the bar is the list's and not a difference's.
   */
  it('holds ticks in two differences at once, and one bar says so', () => {
    const map = new Map([...byFinding(), ['g1', derived('g1')]]);
    const { unmount } = mount({ repeats: [repeat, other], byFinding: map });

    const rows = () => [...document.querySelectorAll('[data-slot="collapsible-trigger"]')];
    press(rows()[0]);
    press(rows()[1]);

    press(pageTicks()[0]);
    expect(document.querySelectorAll('[data-slot="bulk-bar"]')).toHaveLength(1);

    // The fourth tick is the other difference's only page: three above it, then this one.
    press(pageTicks()[3]);

    // Both ticks stand, and the one bar counts them over the whole list. There is no second
    // text to print, so it names the result instead of one difference's words.
    expect(document.querySelectorAll('[data-slot="bulk-bar"]')).toHaveLength(1);
    expect(pageTicks()[0].getAttribute('aria-checked')).toBe('true');
    expect(barText()).toContain('2');
    expect(barText()).toContain('of 4 pages');
    expect(barText()).toContain('2 differences');
    expect(barText()).not.toContain('links');
    unmount();
  });

  /**
   * A dismissal over a selection that spans differences: one note, N ordinary events, one
   * per page, and nothing new in the table. The whole of ticket 138 below the component
   * line is that this is possible at all.
   */
  it('dismisses across differences with one note and one press', async () => {
    const map = new Map([...byFinding(), ['g1', derived('g1')]]);
    const { bulk, unmount } = mount({ repeats: [repeat, other], byFinding: map });

    const rows = () => [...document.querySelectorAll('[data-slot="collapsible-trigger"]')];
    press(rows()[0]);
    press(rows()[1]);
    press(pageTicks()[0]);
    press(pageTicks()[3]);

    press(button('Dismiss on 2 pages'));
    await type('Links hebben geen ">" meer.');
    await pressAndWait(button('Dismiss on 2 pages'));

    expect(bulk.calls).toHaveLength(1);
    expect(bulk.calls[0].map((event) => [event.page, event.findingId])).toEqual([
      ['overkapping', 'f1'],
      ['tuinhuis', 'g1'],
    ]);
    // No repeat scope and no new action: N ordinary events is what a bulk press has
    // written since ticket 31, however many differences the selection reached.
    expect(bulk.calls[0].every((event) => event.scope === 'finding')).toBe(true);
    expect(bulk.calls[0].every((event) => event.note === 'Links hebben geen ">" meer.')).toBe(true);
    unmount();
  });

  /**
   * The bar names its **object** and its **scope**, and never its content (ADR 0019).
   *
   * It drew the two compared texts in full until the polish pass, pinned over the rows that
   * were already drawing them — so an editor read the same pair twice and the number they
   * were about to press on was the smaller half of it. What replaces the texts is the
   * class, which says which difference the ticks are in without repeating a word of it.
   */
  it('raises a bar that counts the ticks and names the difference they belong to', () => {
    const { unmount } = mount();

    press(differenceRow());
    press(pageTicks()[0]);
    press(pageTicks()[1]);

    // Two open differences with ticks in both must never produce one count that does not
    // say what it counts, so the bar names its own difference.
    const bar = document.querySelector('[data-slot="bulk-bar"]');
    expect(bar.textContent).toContain('2 of 3 pages');
    expect(bar.textContent).toContain('Copy changed');
    expect(bar.textContent).not.toContain('oud');
    expect(bar.textContent).not.toContain('nieuw');
    // And no comparison at all: the labelled sides are the row's to draw, not the bar's.
    expect(bar.querySelectorAll('[data-side]')).toHaveLength(0);

    // The press states the **selected** count and not the repeat's size.
    expect(button('Dismiss on 2 pages')).toBeDefined();
    unmount();
  });

  it('dismisses the ticked pages, one event each, and no others', async () => {
    const { bulk, unmount } = mount();

    press(differenceRow());
    press(pageTicks()[0]);
    press(pageTicks()[2]);
    press(button('Dismiss on 2 pages'));

    // Ticking writes nothing: the press still costs a button, a note and a submit, and
    // there is no path from a checkbox to the log without all three.
    expect(bulk.calls).toHaveLength(0);

    await type('afgesproken met de redactie');
    await pressAndWait(button('Dismiss on 2 pages'));

    expect(bulk.calls).toHaveLength(1);
    expect(bulk.calls[0].map((event) => event.page)).toEqual(['overkapping', 'carport']);
    expect(bulk.calls[0].every((event) => event.action === 'dismissed')).toBe(true);
    unmount();
  });

  /**
   * A press that wrote everything says so, and the bar stays to say it (ADR 0019).
   *
   * This is the one place silence is genuinely ambiguous: the press takes the ticks of what
   * it wrote, which empties the selection and used to unmount the bar with its own answer
   * inside it — forty pages decided and not a word. For a single row the state flipping is
   * the feedback, which is why no row draws this, and there is no toast either.
   */
  it('says the whole press was saved, and keeps the bar until it is put down', async () => {
    const { unmount } = mount();

    press(differenceRow());
    press(pageTicks()[0]);
    press(pageTicks()[1]);
    press(button('Dismiss on 2 pages'));
    await type('afgesproken met de redactie');
    await pressAndWait(button('Dismiss on 2 pages'));

    // The selection is spent, so the bar names none: what is left is the outcome and the
    // way to put it down.
    expect(barText()).toContain('Saved on 2 pages');
    expect(barText()).not.toContain('selected');
    expect(button('Dismiss')).toBeUndefined();

    // And it is in the live region, because a bulk write's result is an outcome a screen
    // reader has to hear (ticket 03).
    const said = document.querySelector('[data-slot="bulk-progress"]');
    expect(said.getAttribute('aria-live')).toBe('polite');
    expect(said.textContent).toContain('Saved on 2 pages');

    press(document.querySelector('[aria-label="Clear the selection"]'));
    expect(barText()).toBeNull();
    unmount();
  });

  /** A shortfall is the louder half and keeps its own sentence. */
  it('says how far a press got when it did not get all the way', async () => {
    const bulk = bulkBag({
      appendMany: async (events) => ({
        stored: events.slice(0, 1).map((event) => ({ findingId: event.findingId })),
        written: 1,
        total: events.length,
        stoppedOn: 'veranda',
        aborted: false,
        error: null,
      }),
    });
    const { unmount } = mount({ bulk });

    press(differenceRow());
    press(pageTicks()[0]);
    press(pageTicks()[1]);
    press(button('Dismiss on 2 pages'));
    await type('afgesproken met de redactie');
    await pressAndWait(button('Dismiss on 2 pages'));

    expect(barText()).toContain('1 of 2 saved');
    expect(barText()).not.toContain('Saved on');
    unmount();
  });

  /**
   * The tick is on the difference row **and** in the table header, and they are one control
   * (ticket 138).
   *
   * Round one of ticket 110 put a checkbox inside the `CollapsibleTrigger` — a button
   * inside a button — and the fix was to move it into the table it selects. That left a
   * collapsed difference untickable, which is 259 expansions for one sentence. It is back
   * on the row as a **sibling** of the trigger, so it is clickable, and the two draw one
   * tri-state rule read off one selection.
   */
  it('ticks a collapsed difference whole from its own row, without opening it', () => {
    const { unmount } = mount();

    // Closed, and tickable: one tick on the row and none anywhere else, because there is
    // no page table on screen yet.
    expect(rowTicks()).toHaveLength(1);
    expect(document.querySelector('table')).toBeNull();

    press(rowTicks()[0]);

    // Every page of the difference is ticked, and the difference is still closed. The page
    // table inside one is unbudgeted, and 259 opened differences is thousands of rows.
    expect(barText()).toContain('3 of 3 pages');
    expect(document.querySelector('table')).toBeNull();

    // And the two ticks agree, because they read the same selection.
    press(differenceRow());
    expect(selectAll().getAttribute('aria-checked')).toBe('true');
    expect(rowTicks()[0].getAttribute('aria-checked')).toBe('true');
    unmount();
  });

  it('reads the row tick as mixed while some of the difference is ticked', () => {
    const { unmount } = mount();

    press(differenceRow());
    press(pageTicks()[0]);

    expect(rowTicks()[0].getAttribute('aria-checked')).toBe('mixed');

    // From mixed a press clears, the same way the header's does: a control that cannot be
    // pressed back is not a control.
    press(rowTicks()[0]);
    expect(barText()).toBeNull();
    unmount();
  });

  /**
   * A tick in another difference is not this one's *mixed*. The selection spans differences
   * now, so a row asking "is any of me ticked" has to ask about its own pages — the old
   * `selected.size > 0` would have drawn every row in the list as mixed.
   */
  it('leaves a difference unticked while the ticks are all in another one', () => {
    const map = new Map([...byFinding(), ['g1', derived('g1')]]);
    const { unmount } = mount({ repeats: [repeat, other], byFinding: map });

    press(rowTicks()[1]);

    expect(rowTicks()[1].getAttribute('aria-checked')).toBe('true');
    expect(rowTicks()[0].getAttribute('aria-checked')).toBe('false');
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

    expect(document.querySelector('[data-slot="bulk-bar"]').textContent).toContain('3 of 3 pages');
    expect(pageTicks().map((tick) => tick.getAttribute('aria-checked'))).toEqual([
      'true',
      'true',
      'true',
    ]);
    expect(selectAll().getAttribute('aria-checked')).toBe('true');

    // The decided page is still drawn with its state, and the dismissal still leaves it
    // alone: two of the three, not three.
    expect(document.querySelector('table').textContent).toContain('dismissed');
    expect(button('Dismiss on 2 pages')).toBeDefined();
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
    expect(bar.textContent).toContain('3 of 3 pages');
    expect(selectAll().getAttribute('aria-checked')).toBe('true');

    expect(button('Dismiss')).toBeUndefined();
    // *Afgehandeld* and never *beslist*: `f3` is a claim of fact and not a judgement, and
    // the third page is why the looser word would be a lie about a colleague's tick.
    expect(bar.textContent).toContain(
      'Every finding here is closed already, so there is nothing to dismiss',
    );
    // Two of the three: a claim of fact is not this control's to take back — `fixed` has
    // its own checkbox on the page, and two controls for one event would let them disagree.
    expect(button('Clear the decision on 2 pages')).toBeDefined();
    unmount();
  });

  // The sentence above the button counts the same pages the events do, so its total is the
  // selection and never the repeat. *1 of the 3* on a two-page selection would report a
  // remainder the press was never aimed at.
  it('says how many of the ticked pages it leaves alone, out of the ticked ones', () => {
    const { unmount } = mount({ byFinding: byFinding({ f2: { state: 'dismissed' } }) });

    press(differenceRow());
    press(pageTicks()[0]);
    press(pageTicks()[1]);
    press(button('Dismiss on this page'));

    const bar = document.querySelector('[data-slot="bulk-bar"]');
    expect(bar.textContent).toContain('1 page of the 2');
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
    await pressAndWait(button('Clear the decision on 2 pages'));

    expect(bulk.calls).toHaveLength(1);
    // No note and no second press: a `cleared` event carries no reason, and the single
    // control it mirrors asks for none either.
    expect(bulk.calls[0]).toEqual([
      {
        scope: 'finding',
        action: 'cleared',
        store: 'nl',
        page: 'overkapping',
        findingId: 'f1',
      },
      {
        scope: 'finding',
        action: 'cleared',
        store: 'nl',
        page: 'veranda',
        findingId: 'f2',
      },
    ]);
    unmount();
  });

  it('offers no undo where nothing is decided', () => {
    const { unmount } = mount();

    press(differenceRow());
    press(selectAll());

    expect(button('Clear')).toBeUndefined();
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
    press(document.querySelector('[aria-label="Clear the selection"]'));

    expect(document.querySelector('[data-slot="bulk-bar"]')).toBeNull();
    expect(pageTicks().every((tick) => tick.getAttribute('aria-checked') === 'false')).toBe(true);
    unmount();
  });

  /**
   * Closing a difference no longer puts its ticks down (ticket 138).
   *
   * It did while the selection was one difference's: the ticks were that difference's
   * state, so closing it was putting them down. They are the list's now, a collapsed
   * difference can be ticked whole from its own row, and ticks that vanished on a close
   * would be ticks an editor cannot keep — which is the whole complaint the ticket answers.
   */
  it('keeps the selection when the difference is closed', () => {
    const { unmount } = mount();

    press(differenceRow());
    press(pageTicks()[0]);
    press(differenceRow());

    expect(barText()).toContain('1 of 3 pages');
    expect(rowTicks()[0].getAttribute('aria-checked')).toBe('mixed');

    press(differenceRow());
    expect(pageTicks()[0].getAttribute('aria-checked')).toBe('true');
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
    expect(button('Dismiss')).toBeUndefined();
    unmount();
  });

  /**
   * `searchStore()` builds its repeats out of matched findings only, and a term can be in
   * one page's key and not another's. So a searched row saying *on 3 pages* means three
   * **matching** pages, and ticking all of them leaves any unmatched page of the same
   * difference open. That is the right behaviour and the wrong sentence if the sentence is
   * silent, so the list says it and the unsearched list does not.
   */
  it('says its pages are the ones the search found, when a search found them', () => {
    const found = mount({ searched: true });

    press(differenceRow());
    expect(document.querySelector('table').textContent).toContain('search term');
    found.unmount();

    document.body.innerHTML = '';
    const all = mount();

    press(differenceRow());
    expect(document.querySelector('table').textContent).not.toContain('search term');
    all.unmount();
  });

  // `aria-checked="mixed"` is the whole of the third state for a screen reader and none of
  // it for an eye. A tick that draws the same glyph for *all of them* and *some of them*
  // says one of the two things wrongly.
  it('draws the mixed state as its own mark and not as a tick', () => {
    const { unmount } = mount();

    press(differenceRow());
    press(pageTicks()[0]);
    const mixed = document
      .querySelector('[data-slot="checkbox-indicator"] svg')
      .getAttribute('class');

    press(selectAll());
    const all = document
      .querySelector('[data-slot="checkbox-indicator"] svg')
      .getAttribute('class');

    expect(mixed).not.toBe(all);
    unmount();
  });
});

/**
 * Ticket 03, clicked. The path from a tick on a block-spanning difference to the events
 * `appendMany()` receives, walked in a browser for the reason this file exists at all: the
 * two presses read a field the derivation gained, and a shape that is right in a unit test
 * and wrong in a render is exactly the failure ticket 31 shipped.
 */
/**
 * Ticket 141. The list leads with the difference holding the most work **left**.
 *
 * It cannot be answered in `view.mjs`: `repeatsInStore()` is a pure derivation over the
 * page summaries and never sees the override log, so the open count exists only here,
 * where the row already reads its own bar. That is why this is a mounted test and not a
 * second unit test beside `repeatsByOpenWork()`.
 */
describe('the order of the list', () => {
  const both = [repeat, other];

  it('leads with the difference holding the most open findings, not the most pages', () => {
    const { unmount } = mount({
      repeats: both,
      byFinding: logOver(both, { f1: closed, f2: closed, f3: closed }),
    });

    // Three pages against one, and nothing left in the three: the one-page difference is
    // the work, so it is on top. Nothing is removed — the settled row is still below it.
    expect(rowOrder()[0]).toContain('links');
    unmount();
  });

  it('leaves an undecided list in the order it was given', () => {
    const { unmount } = mount({ repeats: both, byFinding: logOver(both) });

    expect(rowOrder()[0]).toContain('oud');
    unmount();
  });

  it('does not move a row under the editor working in it', () => {
    // The order is taken when the list arrives and held. An editor who closes the three
    // pages of the difference they are inside must not have it seat itself elsewhere while
    // they are reading it — the row's own count is what says the work landed.
    const { rerender, unmount } = mount({ repeats: both, byFinding: logOver(both) });

    rerender({ byFinding: logOver(both, { f1: closed, f2: closed, f3: closed }) });

    expect(rowOrder()[0]).toContain('oud');
    expect(rowOrder()[0]).toContain('3 of 3 closed');
    unmount();
  });

  it('takes the order when the log arrives, and not from the paint before it', () => {
    // `byFinding` reports every finding **open** until the log has been read — the events
    // start as `null` and the derivation runs over an empty list — and the dashboard mounts
    // this list on that first paint. An order held from there is ticket 81's order for the
    // life of the list, which is this ticket built and inert.
    const { rerender, unmount } = mount({
      repeats: both,
      byFinding: logOver(both),
      logRead: false,
    });

    rerender({
      logRead: true,
      byFinding: logOver(both, { f1: closed, f2: closed, f3: closed }),
    });

    expect(rowOrder()[0]).toContain('links');
    unmount();
  });

  it('orders the rows inside a class group the same way', () => {
    const { unmount } = mount({
      component: ClassGroups,
      repeats: both,
      classes: [],
      byFinding: logOver(both, { f1: closed, f2: closed, f3: closed }),
    });

    // The lone group opens on load, so its rows are on screen. The **groups** keep the
    // vocabulary order they have; this is about the rows inside one.
    expect(rowOrder()[0]).toContain('links');
    unmount();
  });
});

describe('a difference that spans a language block', () => {
  const across = () => ({
    repeats: [acrossBlock],
    byFinding: new Map(acrossBlock.on.map((entry) => [entry.id, derived(entry.id)])),
  });

  it('says which store each page is on, because two of them share a name', () => {
    const { unmount } = mount(across());

    press(differenceRow());

    // Both pages are called `afhalen`. Without the store they are two identical rows of
    // one difference, and the editor cannot tell which tick is which.
    const table = document.querySelector('table').textContent;
    expect(table).toContain('on nl');
    expect(table).toContain('on be');

    // And the link goes to each page's **own** store, not to the store of the row.
    const hrefs = [...document.querySelectorAll('tbody a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/nl/afhalen/', '/be/afhalen/']);
    unmount();
  });

  it('tells the editor how many events and in which stores, before the press', () => {
    const { unmount } = mount(across());

    press(differenceRow());
    press(selectAll());
    press(button('Dismiss on 2 pages'));

    // The sentence above the note field, which is the last thing read before the press.
    const bar = document.querySelector('[data-slot="bulk-bar"]').textContent;
    expect(bar).toContain('2 pages');
    expect(bar).toContain('Written in be and nl');
    unmount();
  });

  it('writes one event per page, each under its own store', async () => {
    const { bulk, unmount } = mount(across());

    press(differenceRow());
    press(selectAll());
    press(button('Dismiss on 2 pages'));
    await type('het telefoonnummer hoort te verschillen');
    await pressAndWait(button('Dismiss on 2 pages'));

    // One press, two ordinary events, one per page — and `be`'s event filed under `be`.
    // Nothing new is stored: the scope is `finding` and the action is `dismissed`, which
    // is what a press has written since ticket 31.
    expect(bulk.calls).toHaveLength(1);
    expect(
      bulk.calls[0].map((event) => [event.store, event.page, event.scope, event.action]),
    ).toEqual([
      ['nl', 'afhalen', 'finding', 'dismissed'],
      ['be', 'afhalen', 'finding', 'dismissed'],
    ]);
    unmount();
  });

  /**
   * The **clearing** says it too, and on screen (the review of ticket 03).
   *
   * It shipped in the button's `title`, which is a sentence an editor sees only by hovering:
   * absent on touch, and absent to anyone who arrived at the button by keyboard. The ticket
   * asks that the selection *states, before the press, how many events it will write and in
   * which stores*, and a tooltip does not state anything. The dismissal has a form to say it
   * in; this press writes on the first click, so the sentence is a line on the bar.
   */
  const decidedAcross = () => ({
    repeats: [acrossBlock],
    byFinding: new Map(
      acrossBlock.on.map((entry) => [entry.id, derived(entry.id, { state: 'dismissed' })]),
    ),
  });

  it('says in which stores a clearing writes, on the bar and not in a tooltip', () => {
    const { unmount } = mount(decidedAcross());

    press(differenceRow());
    press(selectAll());

    // No press yet, and no hover: the words are on the bar as it stands.
    const bar = document.querySelector('[data-slot="bulk-bar"]').textContent;
    expect(bar).toContain('Clearing on 2 pages');
    expect(bar).toContain('Written in be and nl');
    unmount();
  });

  it('leaves the clearing quiet where it writes in one store', () => {
    const { unmount } = mount(decidedAcross());

    press(differenceRow());
    // One page ticked, so the clearing lands in `nl` alone and there is nothing to warn
    // about. ADR 0019: the interface is quiet by default, and this sentence earns its place
    // only by saying a decision is leaving the store.
    press(pageTicks()[0]);

    const bar = document.querySelector('[data-slot="bulk-bar"]').textContent;
    expect(button('Clear the decision on this page')).toBeTruthy();
    expect(bar).not.toContain('Written in');
    unmount();
  });

  it('says one store where the press reaches one, however wide the difference is', () => {
    const { unmount } = mount(across());

    press(differenceRow());
    // Only the `nl` page is ticked, so only `nl` is written in. 80% is not 100%, and a
    // sentence naming the block here would claim a decision the press is not making.
    press(pageTicks()[0]);
    press(button('Dismiss on this page'));

    const bar = document.querySelector('[data-slot="bulk-bar"]').textContent;
    expect(bar).toContain('1 page');
    expect(bar).not.toContain('Written in');
    unmount();
  });
});

/**
 * Ticket 138: a narrowed result ticked whole, and decided in one press.
 *
 * An editor searches, gets 472 findings in 259 differences, and every one of them wants
 * the same sentence. Before this the ticks lived inside an expanded difference and belonged
 * to one, so that was 259 expansions and 259 presses. Here it is one tick and one press,
 * and the condition on offering it — that the list is an **answer to something** — is
 * clicked at as well, because it is the restriction a later reader deletes as an oversight.
 */
describe('a wide selection over a narrowed result', () => {
  /** A second and a third difference, so a result is a result and not one row. */
  const [links] = repeatsInStore([on('nl', 'tuinhuis', finding('g1', 'links', 'rechts'))]);
  const [prijs] = repeatsInStore([on('nl', 'prijzen', finding('h1', 'vanaf', 'va.'))]);

  const result = [repeat, links, prijs];
  const states = (overrides = {}) =>
    new Map(
      result
        .flatMap((one) => one.on)
        .map((entry) => [entry.id, derived(entry.id, overrides[entry.id] ?? {})]),
    );

  const found = (props = {}) =>
    mount({
      repeats: result,
      byFinding: states(),
      searched: true,
      builtAt: '2026-08-18T09:14:00.000Z',
      ...props,
    });

  it('ticks every page of every difference from one control', () => {
    const { unmount } = found();

    press(selectResult());

    // Five pages over three differences, and not one difference was opened to do it.
    expect(barText()).toContain('5');
    expect(barText()).toContain('of 5 pages');
    expect(barText()).toContain('3 differences');
    expect(document.querySelector('table')).toBeNull();
    expect(rowTicks().every((tick) => tick.getAttribute('aria-checked') === 'true')).toBe(true);
    unmount();
  });

  /**
   * The condition, clicked. A wide press needs a proposition to be about (ADR 0022): a term,
   * a page scope or a class pill is one, and the bare *Repeats* list — every difference in
   * the store, 25,657 of them — is not. The control is absent there, and the per-difference
   * ticks are not.
   */
  it('offers no such control where no search narrowed the list', () => {
    const { unmount } = mount({ repeats: result, byFinding: states() });

    expect(document.querySelector('[data-slot="select-result"]')).toBeNull();
    expect(rowTicks()).toHaveLength(3);
    unmount();
  });

  it('reads as mixed while some of the result is ticked, and clears from there', () => {
    const { unmount } = found();

    expect(selectResult().getAttribute('aria-checked')).toBe('false');

    press(rowTicks()[1]);
    expect(selectResult().getAttribute('aria-checked')).toBe('mixed');

    press(selectResult());
    expect(barText()).toBeNull();
    expect(selectResult().getAttribute('aria-checked')).toBe('false');
    unmount();
  });

  /**
   * The rows below the render budget are in the press too. The list draws a hundred at a
   * time, and a select-all that reached only the drawn ones would be a control whose
   * meaning changes with how far the editor scrolled.
   */
  it('reaches the differences the render budget has not drawn', () => {
    const many = repeatsInStore(
      Array.from({ length: 120 }, (draw, index) =>
        on('nl', `pagina-${index}`, finding(`x${index}`, `oud-${index}`, `nieuw-${index}`)),
      ),
    );
    const { unmount } = mount({
      repeats: many,
      byFinding: new Map(
        many.flatMap((one) => one.on).map((entry) => [entry.id, derived(entry.id)]),
      ),
      searched: true,
      builtAt: '2026-08-18T09:14:00.000Z',
    });

    // A hundred rows drawn of a hundred and twenty, and the tick takes all of them.
    expect(rowTicks()).toHaveLength(100);
    press(selectResult());

    expect(barText()).toContain('of 120 pages');
    expect(barText()).toContain('120 differences');
    unmount();
  });

  /**
   * The one press writes one event per **eligible** ticked finding and skips the page a
   * colleague decided — the same rule the press has always had, over a longer list. The
   * ticks say *these pages*; the press filters and reports what it did.
   */
  it('writes one event per eligible ticked finding and says what it left alone', async () => {
    const { bulk, unmount } = found({ byFinding: states({ g1: { state: 'dismissed' } }) });

    press(selectResult());
    press(button('Dismiss on 4 pages'));

    // Four of the five, and the fifth named as already decided.
    expect(barText()).toContain('4 pages of the 5');
    expect(barText()).toContain('the other 1 is decided already');

    await type('Links hebben geen ">" meer.');
    await pressAndWait(button('Dismiss on 4 pages'));

    expect(bulk.calls).toHaveLength(1);
    expect(bulk.calls[0].map((event) => event.page)).toEqual([
      'overkapping',
      'veranda',
      'carport',
      'prijzen',
    ]);
    unmount();
  });

  it('revokes only the dismissals when the whole result is cleared', async () => {
    const { bulk, unmount } = found({
      byFinding: states({
        f1: { state: 'dismissed', override: { action: 'dismissed' } },
        g1: { state: 'dismissed', override: { action: 'dismissed' } },
        h1: { state: 'fixed', override: { action: 'fixed' } },
      }),
    });

    press(selectResult());
    await pressAndWait(button('Clear the decision on 2 pages'));

    // The `fixed` claim is not this control's to take back, and the two open pages have
    // nothing to revoke. Two events, both `cleared`.
    expect(bulk.calls[0].map((event) => [event.page, event.action])).toEqual([
      ['overkapping', 'cleared'],
      ['tuinhuis', 'cleared'],
    ]);
    unmount();
  });

  /**
   * The selection straddles two clocks: it is built over the build's snapshot, while
   * eligibility and the *closed* count read the live log. At four rows nobody notices; at
   * 472 it is the one place staleness can do damage, so the wide bar says the date out loud.
   */
  it('names the snapshot the ticks were made over, once, on a wide selection', () => {
    const { unmount } = found();

    press(selectResult());
    expect(barText()).toContain('18 Aug 2026');

    // And not on a selection inside one difference of a wider result, which is the narrow
    // press ticket 110 shipped. The interface is quiet by default.
    press(selectResult());
    press(rowTicks()[0]);
    expect(barText()).not.toContain('18 Aug 2026');
    unmount();
  });

  /**
   * A result holding **one** difference, ticked whole, is a wide press too.
   *
   * The gate is the shape of the selection and never a count of differences: a search that
   * answers one difference on 472 pages is exactly the case the ticket opens with, and a
   * date drawn only where the ticks span differences would have missed it.
   */
  it('names the snapshot on a one-difference result ticked whole', () => {
    const { unmount } = mount({
      repeats: [repeat],
      byFinding: byFinding(),
      searched: true,
      builtAt: '2026-08-18T09:14:00.000Z',
    });

    press(selectResult());

    expect(barText()).toContain('3 of 3 pages');
    expect(barText()).toContain('18 Aug 2026');
    unmount();
  });

  /**
   * A wide press still says which stores it wrote in, and drops the clause explaining why.
   *
   * *The same words are one decision* is what makes a block-spanning row one row. Over a
   * selection spanning differences the strings are not the same, so that clause would be a
   * false reason for a true fact: the press does reach two stores, and it reaches them
   * because the pages ticked are on both.
   */
  it('names the stores a wide press writes in, without the same-words reason', () => {
    const wide = [acrossBlock, links];
    const { unmount } = mount({
      repeats: wide,
      byFinding: new Map(
        wide.flatMap((one) => one.on).map((entry) => [entry.id, derived(entry.id)]),
      ),
      searched: true,
      builtAt: '2026-08-18T09:14:00.000Z',
    });

    press(selectResult());
    press(button('Dismiss on 3 pages'));

    expect(barText()).toContain('Written in be and nl');
    expect(barText()).not.toContain('share a language');
    unmount();
  });

  // Two surfaces must not claim the same ticks. There is one bar over the result, and no
  // second one under the difference that happens to hold some of them.
  it('draws one bar over the result and none under a difference', () => {
    const { unmount } = found();

    press(selectResult());
    press(differenceRow());

    expect(document.querySelectorAll('[data-slot="bulk-bar"]')).toHaveLength(1);
    unmount();
  });
});

/**
 * A press long enough to watch, to stop and to carry on (ticket 139).
 *
 * A dismissal over 329 pages is 329 inserts one after another, and it used to be a button
 * reading *Saving…* with no way to tell a slow log from a stuck one and no way out. The
 * questions below are about that wait, so the write has to be **paused mid-run** — which is
 * why this bag runs the real `appendEach()` over a log that answers one insert at a time,
 * rather than a fake that invents a result.
 */
/**
 * A press through the **real** sequential write, against a log that answers one insert at a
 * time. The questions about a run in flight can only be asked of a run that can be paused,
 * so this bag runs `appendEach()` itself rather than a fake that invents a result.
 */
function paced() {
  /** @type {Function[]} */
  const waiting = [];
  const written = [];

  const port = {
    appendEvent: (event) =>
      new Promise((resolve) => {
        waiting.push(() => {
          written.push(event);
          resolve({ ...event, id: `row-${written.length}` });
        });
      }),
  };

  return {
    written,
    /** Lets the insert in flight answer, and the loop reach the next one. */
    answer: () => act(async () => waiting.shift()?.()),
    bulk: {
      canWrite: true,
      busy: false,
      notWritingReason: null,
      appendMany: (events, watching) => appendEach(port, events, watching),
    },
  };
}

describe('a long press', () => {
  /** The three pages of the difference, ticked, with the note typed and the press made. */
  const started = async (log) => {
    const mounted = mount({ bulk: log.bulk });
    press(differenceRow());
    press(selectAll());
    press(button('Dismiss on 3 pages'));
    await type('afgesproken met de redactie');
    press(button('Dismiss on 3 pages'));
    return mounted;
  };

  it('says how far it has got while it is still going', async () => {
    const log = paced();
    const { unmount } = await started(log);

    expect(barText()).toContain('Saving 0 of 3');

    await log.answer();
    expect(barText()).toContain('Saving 1 of 3');
    unmount();
  });

  /**
   * *Stop* is not an undo. It stops between events, so what it leaves behind is whole rows
   * in an append-only table — and the report says how many, and where it got to.
   */
  it('stops between events and reports how far it got', async () => {
    const log = paced();
    const { unmount } = await started(log);

    await log.answer();
    press(button('Stop'));
    await log.answer();

    // The insert in flight finished; the third was never begun.
    expect(log.written.map((event) => event.page)).toEqual(['overkapping', 'veranda']);
    expect(barText()).toContain('2 of 3 saved');
    expect(barText()).toContain('carport');
    unmount();
  });

  it('leaves the unwritten remainder ticked and takes the ticks off what was written', async () => {
    const log = paced();
    const { unmount } = await started(log);

    await log.answer();
    press(button('Stop'));
    await log.answer();

    expect(pageTicks().map((tick) => tick.getAttribute('aria-checked'))).toEqual([
      'false',
      'false',
      'true',
    ]);
    // The run is over, so the bar is a report and not a reading of a press in flight.
    expect(barText()).not.toContain('Saving');
    unmount();
  });

  /**
   * Pressing again **resumes**: the remainder is what is still ticked, so the same press
   * over the same selection is the rest of the run rather than the whole of it again.
   */
  it('carries on from where it stopped when it is pressed again', async () => {
    const log = paced();
    const { unmount } = await started(log);

    await log.answer();
    press(button('Stop'));
    await log.answer();

    press(button('Dismiss on 1 page'));
    await log.answer();

    expect(log.written.map((event) => event.page)).toEqual(['overkapping', 'veranda', 'carport']);
    // Nothing was written twice, and the note the run began with is the note it ended with.
    expect(new Set(log.written.map((event) => event.note)).size).toBe(1);
    unmount();
  });
});

/**
 * The clearing's gate (ticket 139).
 *
 * The dismissal costs a form and a mandatory reason, so a wide one is already restated by
 * being written out. The clearing carries no reason and throws decisions away, so past a
 * handful of pages the count has to be typed back.
 */
describe('a clearing over many pages', () => {
  const [long] = repeatsInStore(
    Array.from({ length: 8 }, (draw, index) =>
      on('nl', `pagina-${index}`, finding(`p${index}`, 'oud', 'nieuw')),
    ),
  );

  const dismissed = new Map(
    long.on.map((entry) => [
      entry.id,
      derived(entry.id, { state: 'dismissed', override: { action: 'dismissed' } }),
    ]),
  );

  const eight = (props = {}) => {
    const mounted = mount({ repeats: [long], byFinding: dismissed, ...props });
    press(differenceRow());
    press(selectAll());
    return mounted;
  };

  it('writes nothing until the count is restated', async () => {
    const { bulk, unmount } = eight();

    press(button('Clear the decision on 8 pages'));

    expect(bulk.calls).toHaveLength(0);
    expect(barText()).toContain('to clear the decision on 8 pages');
    unmount();
  });

  it('refuses a number that is not the count, and takes the one that is', async () => {
    const { bulk, unmount } = eight();

    press(button('Clear the decision on 8 pages'));
    await type('7');
    expect(button('Clear the decision on 8 pages').disabled).toBe(true);

    await type('8');
    await pressAndWait(button('Clear the decision on 8 pages'));

    expect(bulk.calls[0].map((event) => event.page)).toEqual(long.on.map((entry) => entry.page));
    unmount();
  });

  /**
   * The dismissal needs no such gate over the same eight pages: its mandatory note is one,
   * and a second thing to type would be the same press asked for twice.
   */
  it('asks the dismissal for no count, however wide it is', async () => {
    const open = new Map(long.on.map((entry) => [entry.id, derived(entry.id)]));
    const { bulk, unmount } = eight({ byFinding: open });

    press(button('Dismiss on 8 pages'));
    await type('de redactie wil het zo');
    await pressAndWait(button('Dismiss on 8 pages'));

    expect(bulk.calls[0]).toHaveLength(8);
    unmount();
  });
  /**
   * The gate is spent by the press it gated. A run that stopped leaves a **smaller**
   * remainder, so the count that was typed is no longer the count on screen — and below a
   * handful there is nothing left to restate at all.
   */
  it('drops the gate when a stopped run leaves less than a handful', async () => {
    const log = paced();
    const { unmount } = eight({ bulk: log.bulk });

    press(button('Clear the decision on 8 pages'));
    await type('8');
    press(button('Clear the decision on 8 pages'));

    for (let answered = 0; answered < 5; answered += 1) await log.answer();
    press(button('Stop'));
    await log.answer();

    // Six written, two still ticked: one press again, and nothing to type.
    expect(button('Clear the decision on 2 pages')).toBeDefined();
    expect(barText()).not.toContain('to clear the decision on');
    unmount();
  });
});

/**
 * What language the two quoted strings are in (ticket 125).
 *
 * The rows are the one surface with no report and no store of its own, so the language
 * arrives as a prop from the list that owns it. It is **not** read from a module-level
 * store: a per-cell fact kept in application state is a fact that outlives the cell.
 */
describe('the language of a difference', () => {
  it('declares it on both quoted strings of a row', () => {
    mount({ language: 'de' });

    const declared = [...document.querySelectorAll('[data-slot="collapsible-trigger"] [lang]')];
    expect(declared.map((one) => [one.lang, one.textContent])).toEqual([
      ['de', 'oud'],
      ['de', 'nieuw'],
    ]);
  });
});

/**
 * Ticket 144. A difference with **nothing open left in it** is off the *Repeats* list, and so
 * are the settled pages inside one that stays.
 *
 * Ticket 141 sank such a row instead, deliberately — the safe direction to be wrong in — and
 * the measurement since is that a sunk row is still a row an editor scrolls. That is what
 * these tests overturn, for this list and for nothing else.
 *
 * `ClassGroups` and not the flat list: this is the queue an editor lands on, and it is the one
 * reading that hides anything. A search hides nothing of its own — `searchStore()` has dropped
 * an inactive finding before it groups since ticket 09.
 */
describe('a difference with nothing left in it', () => {
  const both = [repeat, other];
  const settled = { f1: closed, f2: closed, f3: closed };

  const groups = (over = {}) => ({ component: ClassGroups, classes: [], repeats: both, ...over });

  it('stays where it is while the editor is working in it, and re-counts itself', () => {
    // **Numbers are readings and move; membership is a position and is held.** The row an
    // editor has just finished must not leave under their hand — its own words are what say
    // the work landed.
    const { rerender, unmount } = mount(groups({ byFinding: logOver(both) }));

    rerender({ byFinding: logOver(both, settled) });

    expect(rowOrder()[0]).toContain('oud');
    expect(rowOrder()[0]).toContain('3 of 3 closed');
    unmount();
  });

  it('is gone the next time the list opens', () => {
    const { unmount } = mount(groups({ byFinding: logOver(both, settled) }));

    expect(rowOrder()).toHaveLength(1);
    expect(rowOrder()[0]).toContain('links');
    unmount();
  });

  it('comes back with include closed on', () => {
    const { unmount } = mount(groups({ byFinding: logOver(both, settled), includeClosed: true }));

    expect(rowOrder()).toHaveLength(2);
    unmount();
  });

  it('stays while it is only partly closed, and says how much of it is', () => {
    const { unmount } = mount(groups({ byFinding: logOver(both, { f1: closed }) }));

    const settledRow = rowOrder().find((row) => row.includes('oud'));
    // Nothing leaves the denominator: two of the three pages are left to do, and the row
    // goes on counting all three.
    expect(settledRow).toContain('1 of 3 closed');
    unmount();
  });

  it('hides nothing until the log has been read, and hides it when the log arrives', () => {
    // The named trap, from the direction it actually fails in. On the first paint the events
    // are `null`, the derivation runs over an empty list, and `byFinding` reports **every**
    // finding open — so nothing is hidden, which is the correct answer: an unread log means
    // *nothing decided*, never *nothing left*. A reading held from there would be an all-open
    // one for the life of the list, and this whole ticket would be built and inert.
    //
    // It would also be **silent**, because a pill showing its full count on an unread log is
    // right — the pills would look correct while the hiding never engaged. So the guard is
    // asserted by watching the hiding start.
    const { rerender, unmount } = mount(groups({ byFinding: logOver(both), logRead: false }));

    expect(rowOrder()).toHaveLength(2);

    rerender({ logRead: true, byFinding: logOver(both, settled) });

    expect(rowOrder()).toHaveLength(1);
    expect(rowOrder()[0]).toContain('links');
    unmount();
  });

  it('draws no group for a class the log has emptied, and counts what is drawn', () => {
    // Asserted and not built: `groupRepeatsByClass()` already draws only the classes that hold
    // something, over the list it is given — so this falls out of the row rule. The header's
    // *N differences* counts the differences **drawn**, which is the same fall-out read from
    // the other side.
    const [linkRepeat] = repeatsInStore([
      on('nl', 'tuinhuis', { ...finding('h1', 'oud', 'nieuw'), class: 'link-target' }),
    ]);
    const two = [repeat, linkRepeat];
    const { unmount } = mount(groups({ repeats: two, byFinding: logOver(two, settled) }));

    const headings = [...document.querySelectorAll('[data-slot="collapsible-trigger"]')]
      .filter((trigger) => trigger.dataset.row !== 'difference')
      .map((trigger) => trigger.textContent.trim());

    expect(headings).toHaveLength(1);
    expect(headings[0]).toContain('Link target changed');
    expect(headings[0]).toContain('1 difference');
    unmount();
  });

  it('says there is no open work left, in the glossary’s own words for it', () => {
    // Not *No difference found*: that sentence says the snapshot found nothing, and this one
    // says an editor finished it. The words are `CONTEXT.md`'s own for the second — **no open
    // work**, which a scoped search already says about a page holding differences it has
    // closed every one of — and it names the control the rows are behind.
    const { unmount } = mount(groups({ repeats: [repeat], byFinding: logOver([repeat], settled) }));

    expect(document.body.textContent).toContain('No open work here');
    expect(document.body.textContent).toContain('Include closed');
    unmount();
  });
});

describe('the pages inside a difference that is partly closed', () => {
  const partly = { f1: closed };
  const groups = (over = {}) => ({
    component: ClassGroups,
    classes: [],
    repeats: [repeat],
    byFinding: logOver([repeat], partly),
    ...over,
  });

  /** The page names in the open difference's table, which is what an editor reads down. */
  const pageNames = () =>
    [...document.querySelectorAll('tbody a')].map((link) => link.textContent.trim());

  it('draws only the pages with work left on them', () => {
    const { unmount } = mount(groups());
    press(differenceRow());

    expect(pageNames()).toEqual(['veranda', 'carport']);
    unmount();
  });

  it('draws all of them with include closed on', () => {
    const { unmount } = mount(groups({ includeClosed: true }));
    press(differenceRow());

    expect(pageNames()).toEqual(['overkapping', 'veranda', 'carport']);
    unmount();
  });

  /**
   * The select-all reaches the pages that are **drawn** and its label counts the same ones. A
   * tick that quietly armed a press on a page off the screen is the trap ADR 0022 states, and
   * a label saying *3* over two rows is the same trap read out loud.
   */
  it('ticks the drawn pages and says how many that is', () => {
    const { unmount } = mount(groups());
    press(differenceRow());
    press(selectAll());

    expect(selectAll().getAttribute('aria-label')).toBe('Select all 2 pages of this difference');
    expect(document.querySelector('[data-slot="bulk-bar"]').textContent).toContain('2 of 2 pages');
    unmount();
  });
});

/**
 * Ticket 129 part B. The repeats list and the bar over it kept their hints in native `title`
 * attributes — the clearing's page count, the reason a dismissal cannot be pressed yet, the
 * ×N beside a difference — and a `title` is a sentence for whoever is holding a mouse. What is
 * asserted is the reach: the words a reader is given, and no box left for the browser to draw.
 */
describe('a hint on the repeats list, reached without a mouse', () => {
  /** What a reader is given after the element's own name, resolved as the accname spec does. */
  const description = (element) =>
    (element.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .filter(Boolean)
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .join(' ');

  it('explains the clearing press beside its own words, and not instead of them', () => {
    const { unmount } = mount({
      repeats: [repeat],
      byFinding: new Map(
        repeat.on.map((entry) => [entry.id, derived(entry.id, { state: 'dismissed' })]),
      ),
    });

    press(differenceRow());
    press(selectAll());

    const clear = button('Clear the decision');
    expect(clear.textContent).toContain('Clear the decision on');
    expect(description(clear)).toBe('Removes the decision and puts the difference back to open.');
    unmount();
  });

  /**
   * The one press whose hint is *why this is off*, on the one control that cannot carry it:
   * a disabled button takes no focus and hovers nothing, so the hint sits on the element
   * around it, which is a tab stop.
   */
  it('keeps the reason a dismissal cannot be pressed reachable while the press is off', () => {
    const { unmount } = mount();

    press(differenceRow());
    press(selectAll());
    press(button('Dismiss on'));

    const submit = [...document.querySelectorAll('button[type="submit"]')][0];
    expect(submit.disabled).toBe(true);
    const around = submit.closest('[aria-describedby]');
    expect(around.tabIndex).toBe(0);
    expect(description(around)).toBe('A decision needs a reason.');
    unmount();
  });

  it('leaves no title for the browser to draw its own box from', () => {
    const { unmount } = mount();

    press(differenceRow());
    press(selectAll());

    expect([...document.querySelectorAll('[title]')].map((one) => one.title)).toEqual([]);
    unmount();
  });
});
