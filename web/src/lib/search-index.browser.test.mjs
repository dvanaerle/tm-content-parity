import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useSearchIndex } from './search-index.mjs';

/**
 * Which files a search fetches, and what a missing one does (ticket 05, generalised by
 * ticket 03).
 *
 * It is a browser test because the whole of it is the fetch: the merge is a pure function
 * with its own tests in `search.test.mjs`, and what these cases pin is the one rule around it
 * — **every named store or an error**, never the four that happened to answer.
 *
 * The tests lived in `Search.browser.test.mjs` while that component did the fetching. They
 * moved with the hook rather than being rewritten, because they are the same three questions.
 */

/** One store's index, as the build wrote the file. */
const index = (store) => ({ store, pages: 1, builtAt: '2026-08-11T00:00:00Z', findings: [] });

let fetched;
let asked;

beforeEach(() => {
  fetched = globalThis.fetch;
  asked = [];
});

afterEach(() => {
  globalThis.fetch = fetched;
  document.body.innerHTML = '';
});

/**
 * The hook, drawn as the two things it answers. A hook needs a component and this is the
 * smallest one that says which of the two states it is in.
 */
function Probe({ stores }) {
  const { index: held, error } = useSearchIndex(stores);
  if (error) return `error: ${error}`;
  return held ? `stores: ${held.findings.length}, pages: ${held.pages}` : 'loading';
}

async function mount(stores) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(createElement(Probe, { stores })));
  return { unmount: () => act(() => root.unmount()) };
}

describe('useSearchIndex', () => {
  beforeEach(() => {
    globalThis.fetch = async (url) => {
      asked.push(String(url));
      return { ok: true, json: async () => index(String(url).split('/').at(-1).split('.')[0]) };
    };
  });

  it('fetches one file per store it was given, in that order', async () => {
    // A store dashboard names its block and this screen names all six. The list is the
    // caller's, which is the whole of ticket 03's change here — it took one sibling before,
    // because `siblingOf()` answers with one store or with nothing.
    const { unmount } = await mount(['nl', 'be']);

    expect(asked).toEqual(['/search-index/nl.json', '/search-index/be.json']);
    unmount();
  });

  it('fetches six on the screen above the stores', async () => {
    const { unmount } = await mount(['nl', 'be', 'be_fr', 'de', 'fr', 'uk']);

    expect(asked).toHaveLength(6);
    expect(document.body.textContent).toContain('pages: 6');
    unmount();
  });

  it('fetches one file on a store that is in no block', async () => {
    // `de` is the only store of its language, so it pays nothing for the block — the shape of
    // ADR 0018's trade, and the half of ticket 05's criteria that says `de` and `uk` are
    // unchanged. Nothing about the all-stores screen moves that either.
    const { unmount } = await mount(['de']);

    expect(asked).toEqual(['/search-index/de.json']);
    unmount();
  });
});

describe('a store that did not answer', () => {
  it('is an error and never a narrower search', async () => {
    // A narrower answer with nothing on screen saying it is narrower is the bug ticket 05
    // closed, and six files are five more chances at it: an editor searching `max.svg` over
    // six stores and getting four has no way to tell that from the string being on four.
    globalThis.fetch = async (url) =>
      String(url).includes('/uk.json')
        ? { ok: false, status: 404 }
        : { ok: true, json: async () => index('nl') };
    const { unmount } = await mount(['nl', 'uk']);

    expect(document.body.textContent).toContain('uk: HTTP 404');
    unmount();
  });

  it('leaves no index behind for a caller to draw over', async () => {
    // The failure is not a partial corpus: `index` is null, so the caller draws its own
    // sentence about a search it cannot run rather than an empty result over half a corpus.
    globalThis.fetch = async () => ({ ok: false, status: 500 });
    const { unmount } = await mount(['nl']);

    expect(document.body.textContent).not.toContain('stores:');
    unmount();
  });
});
