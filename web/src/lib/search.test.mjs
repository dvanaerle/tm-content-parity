import { describe, expect, it } from 'vitest';
import { indexStore } from './search.mjs';

/**
 * Ticket 82. An editor types the words and sees every finding that holds them, across
 * every page of the store. The index is what the build emits so that can happen with
 * no service and no search library.
 */

/** @param {Partial<import('../../../compare/contract.mjs').Finding>} part */
const finding = (part) => ({
  id: 'a', store: 'nl', page: 'afhalen', check: 'text', class: 'text-missing',
  prod: 'Bekijk deals >', new: null, detail: null, anchorHeading: 'Montage', occurrences: 1,
  score: null, ...part,
});

/**
 * A report as `compare/30-compare.mjs` writes it, cut to what the index reads. The
 * extracts are the large half — 54 MB over the corpus — and the point of the index is
 * that it holds none of them.
 */
const report = ({ page = 'afhalen', store = 'nl', findings = [finding({})], links = {} } = {}) => ({
  store,
  page,
  comparable: true,
  skipReason: null,
  findings,
  rows: [{ prod: 0, new: null, class: 'text-missing', score: null, finding: 'a' }],
  summary: { shown: findings.length, hidden: 0, total: findings.length, byClass: {}, byCheck: {} },
  observationId: '2026-08-11T00:00:00Z-1',
  findingSetHash: 'hash',
  builtAt: '2026-08-11T00:00:00Z',
  sides: {
    production: {
      url: 'https://www.tuinmaximaal.nl/afhalen',
      status: 200,
      elements: [{ index: 0, tag: 'p', kind: 'text', level: null, raw: 'Bekijk deals >', norm: 'Bekijk deals >' }],
      links: links.production ?? [],
      images: [],
      markdown: '',
      meta: {},
      diagnostics: {},
    },
    new: {
      url: 'https://m2stagingnl.intern.systems/afhalen',
      status: 200,
      elements: [],
      links: links.new ?? [],
      images: [],
      markdown: '',
      meta: {},
      diagnostics: {},
    },
  },
});

describe('indexStore', () => {
  it('holds the searchable fields and the finding id, and never the report', () => {
    // The named trap: a report holds both extracts and is large. Shipping searchable
    // text plus ids is a fraction of it; shipping the report twice is not. So the
    // shape is pinned, and a field that creeps in has to be argued for here first.
    const index = indexStore('nl', [report()]);

    expect(Object.keys(index).sort()).toEqual(['builtAt', 'findings', 'pages', 'store']);
    expect(index.store).toBe('nl');
    expect(index.pages).toBe(1);
    expect(Object.keys(index.findings[0]).sort()).toEqual(
      ['anchorHeading', 'class', 'detail', 'id', 'linkText', 'new', 'occurrences', 'page', 'prod'],
    );
  });

  it('carries the page of every finding, because the result says which pages', () => {
    const index = indexStore('nl', [report({ page: 'garantie' })]);
    expect(index.findings[0].page).toBe('garantie');
  });

  it('leaves out a hidden class, for the reason the bar leaves it out', () => {
    // `text-added` is content the new site invented, and ticket 33 hides it. A search
    // that returned it would offer work the log does not count.
    const index = indexStore('nl', [report({
      findings: [finding({ id: 'a' }), finding({ id: 'b', class: 'text-added', prod: null, new: 'Bekijk deals >' })],
    })]);

    expect(index.findings.map((entry) => entry.id)).toEqual(['a']);
  });

  it('resolves the link text a links finding does not carry', () => {
    // A links finding holds the **target** in `prod` and `new` — the host-folded
    // `linkKey` — and the anchor text is nowhere on it. The words an editor types are
    // the words on the page, so the build reads them off the extract's link records.
    // This is the one field the dashboard's own finding index cannot derive, and it is
    // why the index is emitted rather than assembled in the browser.
    const index = indexStore('nl', [report({
      findings: [finding({
        check: 'links', class: 'link-target', prod: 'self/terrasoverkapping', new: 'other/terrasoverkapping',
      })],
      links: {
        production: [{ index: 3, href: '/terrasoverkapping', url: '', key: 'self/terrasoverkapping', text: 'Bekijk deals >', internal: true }],
        new: [{ index: 3, href: '/terrasoverkapping', url: '', key: 'other/terrasoverkapping', text: 'Bekijk aanbiedingen', internal: true }],
      },
    })]);

    expect(index.findings[0].linkText).toEqual(['Bekijk deals >', 'Bekijk aanbiedingen']);
  });

  it('has no link text on a finding that is not about a link', () => {
    // An empty list and not `null`: every reader then scans the same shape, and no
    // caller has to remember which findings carry the field.
    expect(indexStore('nl', [report()]).findings[0].linkText).toEqual([]);
  });

  it('says when the snapshot was built, because the finding half is not live', () => {
    // Two sources, two freshnesses. The index is as old as the last build and the
    // notes are live, so the index has to be able to say which moment it is.
    expect(indexStore('nl', [report()]).builtAt).toBe('2026-08-11T00:00:00Z');
  });
});
