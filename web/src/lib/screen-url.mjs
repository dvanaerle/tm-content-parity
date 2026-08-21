/**
 * The dashboard screen, written in the URL (ticket 109).
 *
 * Every control on the dashboard was session state in the island: which of the two
 * views was on screen, which class pills were on, what was typed in the search box.
 * So opening a page threw all of it away. An editor working down a `copy` filter
 * opened the third page on the list, pressed Back, and got the unfiltered
 * *Repeats* queue from the top — and there was no link they could send a
 * colleague that showed what they were looking at.
 *
 * The screen is not a filter's meaning and it is not a count. It is **what is drawn**,
 * and the rules `filter.mjs` states still hold: nothing here moves a bar, a denominator
 * or a roll-up. This module only says where that state is kept.
 *
 * **Only what differs from the default is written.** A dashboard nobody has touched
 * has a clean URL, so a query in a copied link carries a *choice* — and the default
 * can be changed later without stranding every link that was ever sent.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
// The closed vocabulary, to refuse a class name that is not in it. The import site is
// `vocabulary.mjs` for the reason `classes.mjs` states.
import { FINDING_CLASSES } from '../../../compare/vocabulary.mjs';
import { searchHref } from './page-url.mjs';
// The other closed list, for the same reason: ticket 83's priority filter is a control on
// this screen, and a link can name a word the list does not hold.
import { isPriority } from '../../../shared/priorities.mjs';

/**
 * The screen an untouched dashboard draws. *Repeats* lands first, worst-first,
 * nothing typed, no pill on, closed work out of the way.
 *
 * `includeClosed` is `false`, and on *Repeats* that is now the default that **hides** the
 * fully decided differences rather than merely leaving them out of a search result (ticket
 * 144). An editor lands on what is left.
 *
 * @typedef {object} Screen
 * @property {'repeats' | 'pages'} view
 * @property {'worst' | 'name'} sort
 * @property {string} query
 * @property {string[]} classes
 * @property {string[]} priorities
 * @property {boolean} includeClosed
 */

/** @type {Screen} */
export const SCREEN = Object.freeze({
  view: 'repeats',
  sort: 'worst',
  query: '',
  classes: Object.freeze([]),
  priorities: Object.freeze([]),
  includeClosed: false,
});

/**
 * The parameter names, in the language the interface speaks — English, on every store
 * (ADR 0014). They are part of every link an editor copies, so they are as stable as
 * the page keys are. The Dutch names they replace are **not** accepted as aliases: a
 * half-migrated contract is a second contract to keep.
 *
 * `classes` is plural because the parameter has always carried a list. `soort` was the
 * thing that read as one.
 */
const PARAM = Object.freeze({
  view: 'view',
  sort: 'sort',
  query: 'query',
  classes: 'classes',
  // Singular, and the odd one out on purpose. `classes` is plural because that parameter
  // has always carried a list of a 22-word vocabulary; this one carries at most three
  // words, and *the high-priority pages* is how an editor says what it does. The value is
  // still a list, in the same comma-separated shape.
  priorities: 'priority',
  includeClosed: 'closed',
});

/**
 * How long the address bar lags the screen, in milliseconds. It exists for the search
 * box: see the mirror in `useScreen()`.
 *
 * Exported because the browser test has to wait for the mirror, and a test that waited a
 * hard-coded number would go on passing while waiting the wrong amount the moment this
 * changed — either flaking, or asserting on a write that had not happened yet.
 */
export const MIRROR_DELAY = 250;

/** The closed sets. A value outside one of them is not a screen, so the default wins. */
const VIEWS = ['repeats', 'pages'];
const SORTS = ['worst', 'name'];

/**
 * A screen written as a query string, holding **only what differs from the default**.
 * Empty means the untouched dashboard.
 *
 * @param {Screen} screen
 * @returns {string}
 */
export function searchFromScreen(screen) {
  const written = new URLSearchParams();

  if (screen.view !== SCREEN.view) written.set(PARAM.view, screen.view);
  // The sort belongs to the page list, so it is written only while that list is the
  // view. Otherwise a reader switching to *Repeats* would carry an order that
  // orders nothing on screen, in a link that promises it does.
  if (screen.view === 'pages' && screen.sort !== SCREEN.sort) written.set(PARAM.sort, screen.sort);
  if (screen.query.trim()) written.set(PARAM.query, screen.query);
  if (screen.classes.length > 0) written.set(PARAM.classes, screen.classes.join(','));
  // Ticket 83's filter belongs to the page list, so it goes the way the sort does: a
  // priority annotates a page, and a repeat is a difference across pages rather than a
  // page, so on *Repeats* this would narrow nothing while the link promised it did.
  if (screen.view === 'pages' && screen.priorities.length > 0) {
    written.set(PARAM.priorities, screen.priorities.join(','));
  }
  // *Include closed* belongs to whatever it narrows, and since ticket 144 that is **two**
  // surfaces. It has always belonged to the search — and a **term or a class** is one since
  // ticket 09, because a class on its own is a whole query — and it is now the control that
  // decides whether a fully decided difference is on the *Repeats* list as well.
  //
  // The guard is not dropped, only widened: with nothing searched and *Pages* the view, there
  // is nothing for it to narrow, and this would be a parameter promising a narrowing it does
  // not do. That is the same rule the sort and the priorities keep from the other side.
  const narrows = screen.view === 'repeats' || screen.query.trim() || screen.classes.length > 0;
  if (narrows && screen.includeClosed) {
    written.set(PARAM.includeClosed, '1');
  }

  return written.toString();
}

/**
 * The dashboard screen that shows one finding's repeat: the store's *Repeats* list,
 * narrowed to the finding's words and to its class.
 *
 * It is a **search and not an address**, because a repeat has nothing to address. The key
 * is a grouping the interface makes and has no identity to key on (ADR 0018), which row is
 * open is session state and never the screen, and no row carries an anchor. So the two
 * terms of the repeat key an editor could have typed — the text and the class — are the
 * two this writes. A link therefore outlives the repeat it was made for and lands on the
 * words, in the manner a stale finding link lands on the page.
 *
 * @param {import('../../../compare/contract.mjs').Finding} finding
 * @returns {string | null} A query string for `storeHref()`, or null when the finding has
 *   no words to search for.
 */
export function searchForRepeat(finding) {
  const query = wordsOf(finding);
  if (!query) return null;

  return searchFromScreen({
    ...SCREEN,
    query,
    // The class is a term of the repeat key, so the same words in two classes are two
    // repeats. Without the pill the link lands on both and asks the editor to pick,
    // which is the one thing it exists to save them.
    classes: [finding.class],
  });
}

/**
 * The screen a **class** opens: that class on, and nothing typed (ticket 03).
 *
 * It is `searchForRepeat()` above with the words left out, and that is the gesture it is
 * for: an editor looking straight at a *Broken link* row has no word to type, because the
 * class is the thing they mean. `searchStore()` has answered a bare class since ticket 09,
 * so what this adds is only the press.
 *
 * **No new parameter.** `classes` is already in the contract and already survives a copy, so
 * a class query is this screen with `classes` set and `query` empty — which the contract can
 * write and read today.
 *
 * It is handed to `searchHref()` and not to `storeHref()`, and that is the half of the
 * gesture that makes it worth having: a class is a queue over **every** store, and six
 * per-store queues is what an editor was opening by hand.
 *
 * @param {string} cls
 * @returns {string | null} `null` for a word the vocabulary does not hold. A row cannot
 *   produce one — the label is drawn off the vocabulary — and a link landing on the
 *   unnarrowed queue would be worse than no link, which is the rule above.
 */
export function searchForClass(cls) {
  if (!FINDING_CLASSES[cls]) return null;

  return searchFromScreen({ ...SCREEN, classes: [cls] });
}

/**
 * Where a class label goes: the class's own screen, at the address that screen lives at.
 *
 * The pair was written out at both callers and it is one gesture, so it is one function. A
 * class label on an `nl` dashboard row and the same label on the all-stores screen must land
 * on the same URL — they are the same press — and two copies of `searchForClass()` handed to
 * `searchHref()` are two places for that to stop being true.
 *
 * No back-query rides with it, and that is the point of the press rather than a detail of
 * it: *Broken link* is one queue and not six, so an editor pressing it on an `nl` row is
 * asking about the string and not about `nl`. A way back *into* a store's filters, from a
 * screen above the stores, would be the store creeping upward.
 *
 * @param {string} cls
 * @returns {string | null} `null` for a class the vocabulary does not hold, which is
 *   `searchForClass()`'s rule and not a second one: a row cannot produce one.
 */
export function classHref(cls) {
  const screen = searchForClass(cls);

  return screen && searchHref(screen);
}

/**
 * A finding's words, as the search box would have to hold them.
 *
 * Production is the reference, so it is read first; a finding the new site invented has
 * only the other side. The **leading slash is dropped** because position 0 of the box is
 * the page-scope marker (ADR 0016), and a `links` finding's text is a path — `/downloads`
 * typed whole is a scope over page keys and finds no words at all. Matching is substring,
 * so the shortened term still reaches the text it came from.
 */
const wordsOf = (finding) => (finding.prod ?? finding.new ?? '').replace(/^\/+/, '').trim();

/**
 * A query string read as a screen.
 *
 * @param {string | null | undefined} search  `location.search`, with or without the `?`.
 * @returns {Screen}
 */
export function screenFromSearch(search) {
  const asked = new URLSearchParams(search ?? '');
  const view = asked.get(PARAM.view);
  const sort = asked.get(PARAM.sort);

  return {
    ...SCREEN,
    view: VIEWS.includes(view) ? /** @type {'repeats' | 'pages'} */ (view) : SCREEN.view,
    sort: SORTS.includes(sort) ? /** @type {'worst' | 'name'} */ (sort) : SCREEN.sort,
    query: asked.get(PARAM.query) ?? SCREEN.query,
    includeClosed: asked.get(PARAM.includeClosed) === '1',
    // A class the vocabulary does not name is dropped rather than filtered on. A link
    // outlives the rules it was written against, and narrowing the list to nothing
    // would make the screen look broken rather than the link look stale.
    classes: (asked.get(PARAM.classes) ?? '')
      .split(',')
      .filter((cls) => Boolean(FINDING_CLASSES[cls])),
    // The same laundering against the other closed list. `Hoog` is the word the ticket
    // writes and the value the list does not hold, and a link carrying it is a stale link
    // rather than a broken screen.
    priorities: (asked.get(PARAM.priorities) ?? '').split(',').filter(isPriority),
  };
}

/**
 * The screen, held in React state and mirrored into the address bar.
 *
 * The URL is read in an **effect** and not in the initial state, because this island is
 * rendered to static HTML at build time and hydrated in the browser: a first render
 * that read `location` would render one thing on the server and another in the browser,
 * and React would throw the markup away. So the first paint is the default screen and
 * the URL arrives a beat later, on the same tick as hydration.
 *
 * Nothing is written back until that read has happened. Without the guard the mirror
 * fires once with the default screen and wipes the query it was about to read — which
 * is silent, and costs exactly the thing the ticket is fixing.
 *
 * **`replaceState`, never `pushState`.** Toggling a pill is not a place to go back to.
 * Ten pill presses would be ten history entries between the editor and the screen they
 * came from, and Back would stop meaning *the screen I came from*.
 *
 * @returns {{ screen: Screen, patch: (part: Partial<Screen>) => void, search: string }}
 */
export function useScreen() {
  const [screen, setScreen] = useState(/** @type {Screen} */ (SCREEN));
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    setScreen(screenFromSearch(window.location.search));
    setRestored(true);
  }, []);

  const search = useMemo(() => searchFromScreen(screen), [screen]);

  useEffect(() => {
    if (!restored) return;

    // **Debounced, because the search box is one of the five controls.** Typing
    // `terrasoverkapping` is eighteen screens and would be eighteen `replaceState` calls;
    // Safari throttles that API and starts dropping them, so the address bar would end up
    // holding a prefix of what is on screen. A quarter of a second is under the pause
    // between two words and far above the gap between two keystrokes.
    //
    // Nothing is lost by waiting. The screen the reader is looking at comes from React
    // state; this only mirrors it, and a navigation taken mid-word carries the last write
    // rather than none — the timer is cleared and re-armed, never skipped.
    const write = setTimeout(() => {
      // The bare path when there is nothing to write, so clearing the last filter clears
      // the `?` as well rather than leaving an empty one behind to be copied.
      window.history.replaceState(
        window.history.state,
        '',
        search ? `?${search}` : window.location.pathname,
      );
    }, MIRROR_DELAY);

    return () => clearTimeout(write);
  }, [restored, search]);

  const patch = useCallback((part) => setScreen((held) => ({ ...held, ...part })), []);

  return { screen, patch, search };
}
