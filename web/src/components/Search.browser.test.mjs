import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Search from './Search.jsx';

/**
 * A term and the class pills, composed (ticket 102).
 *
 * It is a browser test because what was wrong was a composition and not a derivation:
 * `searchStore()` narrows correctly the moment it is handed the classes, and the whole
 * defect was that nothing handed them to it and the strip that says a filter is on sat
 * behind a `!searching` guard. A node test over `search.mjs` can see neither half.
 *
 * The index is fetched — it is a static file the build writes, over a megabyte, and
 * deliberately not an island prop — so `fetch` is the one seam this test stubs.
 */

/** One entry of the store's search index, as `indexStore()` emits it. */
const entry = (part) => ({
  id: 'a', page: 'afhalen', class: 'copy', prod: 'Bekijk deals >', new: null,
  detail: null, anchorHeading: 'Montage', occurrences: 1, linkText: [], ...part,
});

/** A term that finds three differences of three classes, for the pills to cut down. */
const index = {
  store: 'nl',
  pages: 4,
  builtAt: '2026-08-11T00:00:00Z',
  findings: [
    entry({ id: 'a', page: 'afhalen', class: 'copy' }),
    entry({ id: 'b', page: 'garantie', class: 'casing', prod: 'bekijk DEALS >' }),
    entry({ id: 'c', page: 'montage', class: 'text-missing', prod: 'Bekijk deals nu >' }),
  ],
};

/** The page summaries the dashboard hands down, which the by-name half reads. */
const pages = [
  { store: 'nl', page: 'deals-afhalen', summary: { byClass: { copy: 2 } } },
  { store: 'nl', page: 'deals-garantie', summary: { byClass: { casing: 1 } } },
];

const byFinding = new Map(
  index.findings.map((one) => [one.id, { id: one.id, state: 'open', visibility: 'work', class: one.class }]),
);

let fetched;

beforeEach(() => {
  fetched = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => index });
});

afterEach(() => {
  globalThis.fetch = fetched;
  document.body.innerHTML = '';
});

/**
 * Mounted and awaited: the index arrives in a promise, so the first paint is *Zoekindex
 * wordt geladen…* and every question here is about the one after it.
 */
async function mount(props = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const cleared = [];

  const render = (over) => act(async () => root.render(createElement(Search, {
    store: 'nl',
    pages,
    term: 'deals',
    classes: [],
    onClearClasses: () => cleared.push(true),
    byFinding,
    events: [],
    includeClosed: false,
    onIncludeClosed: () => {},
    bulk: { canWrite: false, busy: false, appendMany: async () => ({}), notWritingReason: 'geen naam' },
    link: (store, page) => `/${store}/${page}/`,
    ...props,
    ...over,
  })));

  await render({});
  return { cleared, rerender: render, unmount: () => act(() => root.unmount()) };
}

/** The amber strip, found by the one action only it carries. */
const strip = () => [...document.querySelectorAll('[data-slot="alert"]')]
  .find((element) => element.textContent.includes('Filter wissen'));

describe('a search under the class pills', () => {
  it('keeps the amber strip up, in the words it uses everywhere else', async () => {
    // The defect this ticket names: the strip was behind a `!searching` guard, so an
    // editor who typed got a narrowed answer with nothing on screen saying it was
    // narrowed — and a narrowed list that looks whole is read as whole.
    const { unmount } = await mount({ classes: ['copy'] });

    expect(strip().textContent).toContain('Gefilterd op copy.');
    expect(strip().textContent).toContain('1 van 3 verschillen.');
    expect(strip().textContent).toContain('De getallen hierboven tellen alles.');
    unmount();
  });

  it('clears the classes on Filter wissen and asks nothing about the term', async () => {
    // The press hands back one thing: the classes. The term is not the strip's to touch
    // — that is ticket 106's business, and only for a scope.
    const { cleared, unmount } = await mount({ classes: ['copy'] });

    const button = [...strip().querySelectorAll('button')]
      .find((one) => one.textContent.trim() === 'Filter wissen');
    await act(async () => button.click());

    expect(cleared).toEqual([true]);
    unmount();
  });

  it('re-answers the same term against a new selection, without a retype', async () => {
    const { rerender, unmount } = await mount({ classes: ['copy'] });
    expect(document.body.textContent).toContain('Bekijk deals >');

    await rerender({ classes: ['text-missing'] });

    expect(document.body.textContent).toContain('Bekijk deals nu >');
    expect(strip().textContent).toContain('Gefilterd op text-missing.');
    unmount();
  });

  it('narrows the pages named after the term as well', async () => {
    // The by-page reading of the same term answers the same filter, or the block would
    // go on offering pages with nothing of the filtered kind on them — the bypass
    // again, one section lower.
    const { rerender, unmount } = await mount();
    expect(document.body.textContent).toContain('deals-garantie');

    await rerender({ classes: ['copy'] });

    expect(document.body.textContent).toContain('deals-afhalen');
    expect(document.body.textContent).not.toContain('deals-garantie');
    unmount();
  });
});
