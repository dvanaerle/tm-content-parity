import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AllStores from './AllStores.jsx';

/**
 * The search above the stores (ticket 03).
 *
 * A browser test because the ticket's criteria are a **composition**: the merge, the class
 * selector and the grouping each have their own node tests in `search.test.mjs`, and what is
 * only visible here is what the screen does with them — whose store a row says it is on, that
 * the class label is a link and not a control, and that nothing on it can be pressed.
 *
 * The URL is the screen (`useScreen()`), so a case that is about a link arriving sets
 * `location.search` and mounts, which is what an editor pressing a class label produces.
 */

const STORES = ['nl', 'be', 'be_fr', 'de', 'fr', 'uk'];

/** One entry of a store's index, as `indexStore()` emits it. */
const entry = (part) => ({
  id: 'a',
  store: 'nl',
  page: 'afhalen',
  class: 'broken-link',
  prod: '/max.svg',
  new: null,
  detail: null,
  anchorHeading: null,
  occurrences: 1,
  linkText: [],
  observationId: '20260811-01',
  ...part,
});

/**
 * The same broken link on all six stores, one page each.
 *
 * `/max.svg` is the ticket's own example: an image basename is the same string on every store,
 * so this is the search an editor was running six times.
 */
const index = (store) => ({
  store,
  pages: 1,
  builtAt: '2026-08-11T00:00:00Z',
  findings: [entry({ id: store, store, page: 'afhalen' })],
});

let fetched;
let held;

beforeEach(() => {
  fetched = globalThis.fetch;
  held = window.location.search;
  globalThis.fetch = async (url) => {
    const store = String(url).split('/').at(-1).split('.')[0];
    return { ok: true, json: async () => index(store) };
  };
});

afterEach(() => {
  globalThis.fetch = fetched;
  window.history.replaceState({}, '', held || window.location.pathname);
  document.body.innerHTML = '';
});

/**
 * Mounted on the screen a link carried, and awaited: the six files arrive in a promise, and
 * `useScreen()` reads the address bar in an effect, so the first paint is neither.
 */
async function mount(search = '') {
  window.history.replaceState({}, '', search ? `?${search}` : window.location.pathname);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(createElement(AllStores, { stores: STORES })));
  return { unmount: () => act(() => root.unmount()) };
}

/** Every difference row's words, top-down. */
const rows = () =>
  [...document.querySelectorAll('[data-row="difference"]')].map((row) => row.textContent.trim());

/** The class labels on the rows, which are links here and not controls. */
const classLabels = () => [...document.querySelectorAll('a[data-badge="class"]')];

describe('a class label opens a queue over every store', () => {
  it('answers a class with nothing typed', async () => {
    // Ticket 09 made a bare class a query and this is the press it was built for. Six findings
    // and no word typed: the class is the thing the editor means.
    const { unmount } = await mount('classes=broken-link');

    expect(document.body.textContent).toContain('6 findings on 6 pages');
    unmount();
  });

  it('groups them as the repeat corpus does, and not as one row', async () => {
    // The corpus split, on screen. Reading crosses every store; the **grouping** is still
    // keyed on the language block, so one string on six stores is four differences —
    // `{nl, be}`, `{be_fr, fr}`, `de` and `uk`. Ticket 04 is what makes this one.
    const { unmount } = await mount('classes=broken-link');

    expect(document.body.textContent).toContain('in 4 differences');
    expect(rows()).toHaveLength(4);
    unmount();
  });

  it('says which store every result line is on', async () => {
    // Every store carries `afhalen`, so a merged list that did not say this would be
    // ambiguous on every line of it.
    const { unmount } = await mount('classes=broken-link');

    for (const row of document.querySelectorAll('[data-row="difference"]')) {
      await act(() => row.click());
    }

    for (const store of STORES) {
      expect(document.body.textContent).toContain(`on ${store}`);
    }
    unmount();
  });

  it('draws the class on a row as a link back to this screen', async () => {
    // Two presses, two verbs: the label on a row **opens** and the pill in the strip
    // **toggles**, so the label is an anchor and the pill stays a control.
    const { unmount } = await mount('classes=broken-link');

    expect(classLabels()).not.toHaveLength(0);
    for (const label of classLabels()) {
      expect(label.getAttribute('href')).toBe('/search/?classes=broken-link');
    }
    unmount();
  });

  it('has no press on it at all', async () => {
    // The ticket widens reading only. A wide press here would be offered over a list spanning
    // six stores and could act on two of them, which is a control lying about its reach — so
    // the screen offers none until ticket 04 moves the repeat corpus.
    const { unmount } = await mount('classes=broken-link');

    for (const row of document.querySelectorAll('[data-row="difference"]')) {
      await act(() => row.click());
    }

    // No tick that **selects**. *Include closed* is a checkbox and stays one: it says what
    // counts as a result, which is a reading and not a press, and the ticket keeps its
    // present meaning by name.
    const ticks = [...document.querySelectorAll('[data-slot="checkbox"]')].map((tick) =>
      tick.getAttribute('aria-label'),
    );
    expect(ticks.filter((label) => label?.startsWith('Select'))).toHaveLength(0);
    expect(document.body.textContent).not.toContain('Select every difference found');
    expect(document.body.textContent).toContain('Include closed');
    unmount();
  });
});

describe('the screen above the stores', () => {
  it('draws nothing until something is asked', async () => {
    // The empty box keeps meaning the empty box. A screen landing on an empty result reads as
    // a broken screen, so it says what it searches instead.
    const { unmount } = await mount();

    expect(document.body.textContent).toContain('Search every store');
    expect(rows()).toHaveLength(0);
    unmount();
  });

  it('narrows an all-stores result with the class pills', async () => {
    // The narrowing an editor already knows, over the wider result. It is the same
    // `repeatsWithClasses()` the two views narrow by.
    const { unmount } = await mount('query=max.svg&classes=copy');

    expect(document.body.textContent).toContain('0 findings on 0 pages');
    expect(document.body.textContent).toContain('Clear filter');
    unmount();
  });

  it('answers a typed term over every store', async () => {
    const { unmount } = await mount('query=max.svg');

    expect(document.body.textContent).toContain('6 findings on 6 pages');
    unmount();
  });

  it('says the index was not read when one store did not answer', async () => {
    // A partial read is an error and not a narrower search: four stores answering out of six
    // is indistinguishable, on screen, from the string being on four.
    globalThis.fetch = async (url) =>
      String(url).includes('/uk.json')
        ? { ok: false, status: 404 }
        : { ok: true, json: async () => index('nl') };
    const { unmount } = await mount('classes=broken-link');

    expect(document.body.textContent).toContain('uk: HTTP 404');
    unmount();
  });
});
