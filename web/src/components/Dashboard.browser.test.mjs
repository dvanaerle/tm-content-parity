import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import Dashboard from './Dashboard.jsx';

/**
 * The three buckets, on the store dashboard (ticket 80).
 *
 * The question this ticket actually asked was **whether one grouping reads the same on the
 * dashboard and in the ledger** — that is why the throwaway prototype put both on one
 * route. A pure test of `bucketsOf()` cannot answer it: two screens can agree on every
 * number and still call the middle bucket two different things. So the words are read back
 * off the rendered dashboard here, through the same `data-bucket` hook
 * `Ledger.browser.test.mjs` reads its strip through.
 *
 * No override log is connected in a test, so `useStoreOverrides()` derives over an empty
 * event list and every finding is `open` — which is the honest starting state of a store
 * and enough to pin the words and their order.
 */

const finding = (id, cls = 'copy') => ({
  id,
  store: 'nl',
  page: 'overkappingen',
  check: cls === 'copy' ? 'text' : 'links',
  class: cls,
  prod: 'Levering in 5 werkdagen',
  new: 'Levering in vijf werkdagen',
  anchorHeading: null,
  occurrences: 1,
  score: null,
});

const page = (name, findings) => ({
  store: 'nl',
  page: name,
  comparable: true,
  skipReason: null,
  findings,
  rows: [],
  sides: {
    production: { url: `https://www.tuinmaximaal.nl/${name}`, units: 40 },
    new: { url: `https://new.tuinmaximaal.nl/${name}`, units: 40 },
  },
  summary: {
    work: findings.length,
    information: 0,
    diagnostic: 0,
    total: findings.length,
    byClass: {},
    byCheck: {},
  },
  observationId: '2026-08-14T10:00:00.000Z-aaaaaaaa',
  // A literal, because `findingSetHash()` hashes with `node:crypto` and this runs in a
  // browser. Nothing here reads it: the hash decides whether a *review* went stale, and no
  // page in this fixture is reviewed.
  findingSetHash: `hash-${name}`,
  builtAt: '2026-08-14T10:00:00.000Z',
});

const PAGES = [
  page('overkappingen', [finding('a'), finding('b')]),
  page('schuttingen', [finding('c', 'link-target')]),
];

function mount(props = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(createElement(Dashboard, { store: 'nl', pages: PAGES, ...props })));
  return () => act(() => root.unmount());
}

/**
 * The store strip's three chips, as `{ 'needs-attention': { count, label }, … }`.
 *
 * The count and the word are read apart rather than as one string: a chip draws them as two
 * elements with the gap in CSS, so a joined `textContent` would assert on whitespace that
 * is not in the markup and say nothing about either half.
 */
const strip = () =>
  Object.fromEntries(
    [...document.querySelectorAll('[data-bucket]')].map((element) => [
      element.dataset.bucket,
      {
        count: element.querySelector('strong').textContent,
        label: element.querySelector('span').textContent,
      },
    ]),
  );

afterEach(() => {
  history.replaceState(null, '', location.pathname);
  document.body.innerHTML = '';
});

describe('the three buckets on the store dashboard', () => {
  /**
   * The words are `CONTEXT.md`'s three, in its own casing — **Open**, **Needs attention**
   * and **Closed** — and they are asserted as literals rather than read out of
   * `BUCKET_LABEL`, which would only prove the map equals itself. A bucket is a glossary
   * term, so it keeps the glossary's capitals wherever it is drawn: lowercasing it to match
   * the sentence-shaped chips beside it is how one term comes to read three ways.
   */
  it('names the three buckets the way the glossary and the ledger name them', () => {
    const unmount = mount();

    expect(strip()).toEqual({
      open: { count: '3', label: 'Open' },
      'needs-attention': { count: '0', label: 'Needs attention' },
      closed: { count: '0', label: 'Closed' },
    });

    unmount();
  });

  /** The per-page column head names the three, so the three numbers under it need no legend. */
  it('heads the per-page column with the same three words', () => {
    // *Repeats* lands first, and the screen is the URL (ADR 0010) — so the per-page table
    // is asked for the way a reader's own link asks for it.
    history.replaceState(null, '', '?view=pages');
    const unmount = mount();

    const head = [...document.querySelectorAll('th')].map((cell) => cell.textContent.trim());
    expect(head).toContain('Open · Needs attention · Closed');

    unmount();
  });
});
