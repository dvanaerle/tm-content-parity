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
  id: 'a',
  page: 'afhalen',
  class: 'copy',
  prod: 'Bekijk deals >',
  new: null,
  detail: null,
  anchorHeading: 'Montage',
  occurrences: 1,
  linkText: [],
  ...part,
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
  index.findings.map((one) => [
    one.id,
    { id: one.id, state: 'open', visibility: 'work', class: one.class },
  ]),
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

  const render = (over) =>
    act(async () =>
      root.render(
        createElement(Search, {
          store: 'nl',
          pages,
          term: 'deals',
          classes: [],
          onClearClasses: () => cleared.push(true),
          byFinding,
          // A log that has been read and holds nothing, which is what every case about
          // the findings half wants: the notes half then draws exactly what it drew
          // before ticket 123, which is nothing.
          log: { events: [], ready: true, error: null, connected: true },
          includeClosed: false,
          onIncludeClosed: () => {},
          bulk: {
            canWrite: false,
            busy: false,
            appendMany: async () => ({}),
            notWritingReason: 'no name',
          },
          link: (store, page) => `/${store}/${page}/`,
          ...props,
          ...over,
        }),
      ),
    );

  await render({});
  return { cleared, rerender: render, unmount: () => act(() => root.unmount()) };
}

/** The amber strip, found by the one action only it carries. */
const strip = () =>
  [...document.querySelectorAll('[data-slot="alert"]')].find((element) =>
    element.textContent.includes('Clear filter'),
  );

describe('a search under the class pills', () => {
  it('keeps the amber strip up, in the words it uses everywhere else', async () => {
    // The defect this ticket names: the strip was behind a `!searching` guard, so an
    // editor who typed got a narrowed answer with nothing on screen saying it was
    // narrowed — and a narrowed list that looks whole is read as whole.
    const { unmount } = await mount({ classes: ['copy'] });

    expect(strip().textContent).toContain('Filtered on copy.');
    expect(strip().textContent).toContain('1 of 3 differences.');
    expect(strip().textContent).toContain('The counts above count everything.');
    unmount();
  });

  it('clears the classes on Clear filter and asks nothing about the term', async () => {
    // The press hands back one thing: the classes. The term is not the strip's to touch
    // — that is ticket 106's business, and only for a scope.
    const { cleared, unmount } = await mount({ classes: ['copy'] });

    const button = [...strip().querySelectorAll('button')].find(
      (one) => one.textContent.trim() === 'Clear filter',
    );
    await act(async () => button.click());

    expect(cleared).toEqual([true]);
    unmount();
  });

  it('re-answers the same term against a new selection, without a retype', async () => {
    const { rerender, unmount } = await mount({ classes: ['copy'] });
    expect(document.body.textContent).toContain('Bekijk deals >');

    await rerender({ classes: ['text-missing'] });

    expect(document.body.textContent).toContain('Bekijk deals nu >');
    expect(strip().textContent).toContain('Filtered on text-missing.');
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

/**
 * Ticket 103. A scope may hold several pages, and a result over several has to say which
 * ones — otherwise an editor reads a merged list as one page's work. This is a browser
 * case because the header is what says it: `searchStore()` answers the scope, and only
 * the screen can be asked what it told anybody.
 */
describe('a search narrowed to a page scope', () => {
  /** The store's pages, one of which is clean and in no result above. */
  const scoped = [
    { store: 'nl', page: 'afhalen', summary: { byClass: { copy: 1 } } },
    { store: 'nl', page: 'afhalen-pdf', summary: { byClass: {} } },
    { store: 'nl', page: 'garantie', summary: { byClass: { casing: 1 } } },
  ];

  it('names the pages the scope matched, over the one list', async () => {
    const { unmount } = await mount({ term: '/afhalen', pages: scoped });

    expect(document.body.textContent).toContain('2 pages in /afhalen');
    expect(document.body.textContent).toContain('afhalen-pdf');
    unmount();
  });

  it('keeps a page with no open work reachable by its name', async () => {
    // The capability the by-name block carries under an ordinary term: a clean page is
    // in no finding result, and it is still the page somebody is looking for.
    const { unmount } = await mount({ term: '/afhalen', pages: scoped });

    const link = [...document.querySelectorAll('a')].find(
      (one) => one.textContent.trim() === 'afhalen-pdf',
    );
    expect(link.getAttribute('href')).toBe('/nl/afhalen-pdf/');
    unmount();
  });

  it('draws the pages once, and not twice under two headings', async () => {
    // The by-name block is what the header replaces. Both would list the same pages
    // under two sentences that disagree about which question was asked.
    const { unmount } = await mount({ term: '/afhalen', pages: scoped });

    expect(document.body.textContent).not.toContain('have this name');
    unmount();
  });

  it('names the pages but promises no list when the scope found nothing', async () => {
    // A scope can reach pages and find no open difference on them — a clean family is the
    // ordinary case. The pages are still worth naming; the sentence about *the differences
    // below* is not, because there are none and the line under it says so.
    const { unmount } = await mount({ term: '/afhalen-pdf', pages: scoped });

    expect(document.body.textContent).toContain('1 page in /afhalen-pdf');
    expect(document.body.textContent).toContain('No difference with these words.');
    expect(document.body.textContent).not.toContain('The differences below');
    unmount();
  });

  it('says nothing about a scope when there is none', async () => {
    const { unmount } = await mount({ term: 'deals' });

    expect(document.body.textContent).not.toContain('pages in /');
    expect(document.body.textContent).toContain('have this name');
    unmount();
  });
});

/**
 * Ticket 123. The two halves arrive from two places, and the notes half used to draw its
 * absence as an answer. These are browser cases because the question is what is *on
 * screen* in a state nobody can reach by hand — `search.mjs` names the three states and
 * this is where the block that reads them lives.
 */
describe('the notes half, before the log has answered', () => {
  it('says it is still reading, rather than drawing no notes at all', async () => {
    const { unmount } = await mount({ log: { events: null, ready: false, connected: true } });

    expect(document.body.textContent).toContain('Notes in the log');
    // The banner's own sentence about the same state, and not a third phrasing of it
    // (ADR 0014, and the review of this ticket): one log, one vocabulary.
    expect(document.body.textContent).toContain('The override log is loading…');
    unmount();
  });

  it('says a log that could not be read was not read, and why', async () => {
    const { unmount } = await mount({
      log: { events: null, ready: false, error: 'TypeError: Failed to fetch', connected: true },
    });

    expect(document.body.textContent).toContain('The override log was not read');
    expect(document.body.textContent).toContain('TypeError: Failed to fetch');
    unmount();
  });

  it('does not promise that a failed read will fill itself in', async () => {
    // The review's first finding. The block used to say *it fills in by itself once the
    // log answers*, and nothing re-reads the log: `useStoreOverrides()` reads once per
    // store list and never retries, so on screen that moment does not come. What is
    // offered is the thing that does work.
    const { unmount } = await mount({
      log: { events: null, ready: false, error: 'TypeError: Failed to fetch', connected: true },
    });

    expect(document.body.textContent).toContain('Reload the page to try again.');
    expect(document.body.textContent).not.toContain('fills in by itself');
    unmount();
  });

  it('recovers when the log arrives, with no reload', async () => {
    // Green when it was written, and kept as the pin for it: the state is derived from
    // the read on every call and never latched, so nothing here remembers having
    // failed. A retry, a second request or a reload would all be a heavier answer to a
    // question the shape already answers.
    const note = {
      createdAt: '2026-08-12T09:00:00Z',
      editor: 'Dennis',
      scope: 'finding',
      action: 'dismissed',
      store: 'nl',
      page: 'afhalen',
      findingId: 'a',
      note: 'deals blijft zo staan',
    };
    const { rerender, unmount } = await mount({
      log: { events: null, ready: false, error: 'TypeError: Failed to fetch', connected: true },
    });
    expect(document.body.textContent).toContain('The override log was not read');

    await rerender({ log: { events: [note], ready: true, error: null, connected: true } });

    expect(document.body.textContent).toContain('1 note with these words');
    expect(document.body.textContent).toContain('deals blijft zo staan');
    expect(document.body.textContent).not.toContain('The override log was not read');
    unmount();
  });

  it('keeps answering about the findings while the log is still reading', async () => {
    // Also green when it was written. It is here because the findings half's two
    // branches are early returns over the *whole* component, and the obvious way to
    // give the notes half the same two would have been two more of those — which would
    // make a slow log hold up the half that is already in memory.
    const { unmount } = await mount({ log: { events: null, ready: false, connected: true } });

    expect(document.body.textContent).toContain('Bekijk deals >');
    expect(document.body.textContent).toContain('3 findings on 3 pages');
    unmount();
  });

  it('draws no notes block at all for a log that was read and holds none', async () => {
    // The one silence that is true, and the ticket's own limit: this changes what is
    // said when none match, not which ones match. A read log with no matching note says
    // nothing, exactly as it did before.
    const { unmount } = await mount();

    expect(document.body.textContent).not.toContain('Notes in the log');
    expect(document.body.textContent).not.toContain('with these words');
    unmount();
  });
});
