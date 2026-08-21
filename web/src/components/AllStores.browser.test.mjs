import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AllStores from './AllStores.jsx';

/**
 * The search above the stores (ticket 03).
 *
 * A browser test because the ticket's criteria are a **composition**: the merge, the class
 * selector and the grouping each have their own node tests in `search.test.mjs` and
 * `view.test.mjs`, and what is only visible here is what the screen does with them — whose
 * store a row says it is on, that the class label is a link and not a control, and which rows
 * carry a tick (ticket 04).
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
 * Two differences on all six stores, one page each: a **broken link** and a **copy** change.
 *
 * `/max.svg` is the ticket's own example — a link target and an image basename are the same
 * string on every store, so this is the search an editor was running six times. The `copy`
 * entry beside it carries the same two strings on all six as well, which is the fixture that
 * can tell the two corpora apart: if the grouping keyed on the block for both, the link would
 * be four rows; if it keyed on the check for both, the text would be one.
 */
const index = (store) => ({
  store,
  pages: 1,
  builtAt: '2026-08-11T00:00:00Z',
  findings: [
    entry({ id: store, store, page: 'afhalen' }),
    entry({
      id: `${store}-copy`,
      store,
      page: 'afhalen',
      class: 'copy',
      prod: 'Bekijk deals >',
      new: 'Bekijk de deals >',
    }),
  ],
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

/**
 * Every tick that **selects**, by the name it announces.
 *
 * It reads the label rather than counting checkboxes, because *Include closed* is a checkbox
 * too and is not a press: it says what counts as a result.
 */
const selectLabels = () =>
  [...document.querySelectorAll('[data-slot="checkbox"]')]
    .map((tick) => tick.getAttribute('aria-label'))
    .filter((label) => label?.startsWith('Select'));

/** The reasons drawn on the rows a press is refused on, one per refused row. */
const refusals = () => [...document.querySelectorAll('[data-slot="no-press"]')];

/** The class labels on the rows, which are links here and not controls. */
const classLabels = () => [...document.querySelectorAll('a[data-badge="class"]')];

describe('a class label opens a queue over every store', () => {
  it('answers a class with nothing typed', async () => {
    // Ticket 09 made a bare class a query and this is the press it was built for. Six findings
    // and no word typed: the class is the thing the editor means.
    const { unmount } = await mount('classes=broken-link');

    expect(document.body.textContent).toContain('on 6 pages');
    unmount();
  });

  it('groups a link target on six stores into one difference', async () => {
    // The corpus split, on screen, and ticket 04's headline. Reading crosses every store and
    // so does the **grouping**, because a link target is host-folded and an image basename has
    // the path stripped: the same string on every store, in every language. It was four rows
    // — `{nl, be}`, `{be_fr, fr}`, `de` and `uk` — while the key was the block's.
    const { unmount } = await mount('classes=broken-link');

    expect(rows()).toHaveLength(1);
    expect(document.body.textContent).toContain('1 difference on 6 pages');
    unmount();
  });

  it('keeps a text difference on six stores as four, one per language block', async () => {
    // The other half of the same rule, and the boundary ADR 0018 drew still standing: these
    // are words, the stores translate them, and `de` and `uk` are each alone in a language.
    const { unmount } = await mount('classes=copy');

    expect(rows()).toHaveLength(4);
    expect(document.body.textContent).toContain('in 4 differences');
    unmount();
  });

  it('says which store every result line is on before it is opened', async () => {
    // Every store carries `afhalen`, so a merged list that did not say this would be
    // ambiguous on every line of it. **On the collapsed line**, which is the one an editor
    // scans: a store named only inside an expanded difference is four expansions asked for
    // one word, and the criterion says every result line.
    const { unmount } = await mount('classes=broken-link');

    // The four groupings the block keying produces, each naming its own stores. Read off the
    // rows joined rather than in order, because which difference sorts first is not the
    // question here.
    const scanned = rows().join(' | ');
    expect(scanned).toContain('on be, be_fr, de, fr, nl, uk');
    unmount();
  });

  it('says which store each page of an opened result is on', async () => {
    // The page list inside a difference names them one by one, because a row grouping two
    // stores says which two and a page says which of them it is.
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

  it('offers a tick on a six-store difference, named page by page', async () => {
    // One press decides `max.svg` everywhere (ticket 04). What a browser test can say is that
    // the control is there and announced; how many events it writes is `bulk.test.mjs`'s, and
    // the log is not connected here.
    const { unmount } = await mount('classes=broken-link');

    for (const row of document.querySelectorAll('[data-row="difference"]')) {
      await act(() => row.click());
    }

    // Every page of the difference is tickable, and each tick names its own store: six pages
    // called `afhalen` are six ticks a screen reader could not otherwise tell apart.
    for (const store of STORES) {
      expect(selectLabels()).toContain(`Select afhalen on ${store}`);
    }
    expect(document.body.textContent).toContain('Select every difference found');
    unmount();
  });

  it('draws a text difference without a tick, and says why', async () => {
    // Shown, not tickable, and it says why. The row is a difference an editor found and is
    // entitled to read; what it is not is a press an editor makes from above the stores, where
    // one gesture over this list would judge words in four languages.
    const { unmount } = await mount('classes=copy');

    expect(rows()).toHaveLength(4);
    // That a reason is drawn, and not what it says: the sentence is the reading's and is
    // asserted whole in `list-reading.test.mjs`, where a rewording fails loudly rather than
    // slipping past a substring match here (ADR 0030).
    expect(refusals()).toHaveLength(4);
    // No tick anywhere on the list, on the rows or in their pages, and no select-all either:
    // the refusal is one answer and not a per-control one.
    for (const row of document.querySelectorAll('[data-row="difference"]')) {
      await act(() => row.click());
    }
    expect(selectLabels()).toHaveLength(0);
    expect(document.body.textContent).not.toContain('Select every difference found');

    // *Include closed* is a checkbox and stays one: it says what counts as a result, which is
    // a reading and not a press.
    expect(document.body.textContent).toContain('Include closed');
    unmount();
  });

  it('ticks only what may be pressed, where the two kinds of row are on one list', async () => {
    // Both classes at once, which is what a bare term answers. The select-all reaches the
    // link difference's six pages and none of the text rows', because the selection is
    // narrowed once for the whole list — a result-wide tick that reached further would arm a
    // press the rows themselves refuse.
    const { unmount } = await mount('query=afhalen');

    for (const row of document.querySelectorAll('[data-row="difference"]')) {
      await act(() => row.click());
    }

    expect(rows()).toHaveLength(5);
    // The **page** ticks, which are the ones a store can be read off. Every one of the five
    // rows is `afhalen` on the same six stores, so a tickable text row would double this
    // number rather than add an unrelated one.
    expect(selectLabels().filter((label) => label.startsWith('Select afhalen on'))).toHaveLength(6);
    // The four text rows each say why, and the link row says nothing of the kind.
    expect(refusals()).toHaveLength(4);
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
    // One difference and not six findings, because `/max.svg` is a link target: the term
    // reaches all six stores and the grouping now brings them together (ticket 04). A
    // one-difference result says how many pages, for the reason the count itself gives — the
    // page is a term of the finding id, so the two numbers are one number.
    const { unmount } = await mount('query=max.svg');

    expect(document.body.textContent).toContain('1 difference on 6 pages');
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
