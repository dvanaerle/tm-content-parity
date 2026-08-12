/**
 * The dashboard screen, written in the URL (ticket 109).
 *
 * Every control on the dashboard was session state in the island: which of the two
 * views was on screen, which class pills were on, what was typed in the search box.
 * So opening a page threw all of it away. An editor working down a `copy` filter
 * opened the third page on the list, pressed Back, and got the unfiltered
 * *Verschillen* queue from the top — and there was no link they could send a
 * colleague that showed what they were looking at.
 *
 * The screen is not a filter's meaning and it is not a count. It is **what is drawn**,
 * and the rules `view.mjs` states still hold: nothing here moves a bar, a denominator
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

/**
 * The screen an untouched dashboard draws. *Verschillen* lands first, worst-first,
 * nothing typed, no pill on, closed work out of the way.
 *
 * @typedef {object} Screen
 * @property {'repeats' | 'pages'} view
 * @property {'worst' | 'name'} sort
 * @property {string} query
 * @property {string[]} classes
 * @property {boolean} includeClosed
 */

/** @type {Screen} */
export const SCREEN = Object.freeze({
  view: 'repeats',
  sort: 'worst',
  query: '',
  classes: Object.freeze([]),
  includeClosed: false,
});

/**
 * The parameter names, in the language the interface speaks. They are part of every
 * link an editor copies, so they are as stable as the page keys are.
 */
const PARAM = Object.freeze({
  view: 'weergave',
  sort: 'sortering',
  query: 'zoek',
  classes: 'soort',
  includeClosed: 'afgesloten',
});

/**
 * How long the address bar lags the screen, in milliseconds. It exists for the search
 * box: see the mirror in `useScreen()`.
 */
const MIRROR_DELAY = 250;

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
  // view. Otherwise a reader switching to *Verschillen* would carry an order that
  // orders nothing on screen, in a link that promises it does.
  if (screen.view === 'pages' && screen.sort !== SCREEN.sort) written.set(PARAM.sort, screen.sort);
  if (screen.query.trim()) written.set(PARAM.query, screen.query);
  if (screen.classes.length > 0) written.set(PARAM.classes, screen.classes.join(','));
  // *Inclusief afgesloten* belongs to the search, and there is no search without a
  // term, so it goes the same way the sort does.
  if (screen.query.trim() && screen.includeClosed) written.set(PARAM.includeClosed, '1');

  return written.toString();
}

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
      window.history.replaceState(window.history.state, '', search ? `?${search}` : window.location.pathname);
    }, MIRROR_DELAY);

    return () => clearTimeout(write);
  }, [restored, search]);

  const patch = useCallback((part) => setScreen((held) => ({ ...held, ...part })), []);

  return { screen, patch, search };
}
