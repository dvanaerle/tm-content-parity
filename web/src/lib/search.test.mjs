import { describe, expect, it } from 'vitest';
import { SEARCH_FIELDS, indexStore, matchedFields } from './search.mjs';

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

/** One index entry, as `indexStore` emits it. */
const entry = (part) => ({
  id: 'a', page: 'afhalen', class: 'text-missing', prod: 'Bekijk deals >', new: null,
  detail: null, anchorHeading: 'Montage', occurrences: 1, linkText: [], ...part,
});

describe('matchedFields', () => {
  it('names six fields and no more', () => {
    // The ticket asks for six, and the answer says which of the six matched. A
    // seventh name would be a field an editor was never told they could search.
    expect(SEARCH_FIELDS).toEqual(
      ['page', 'prodText', 'newText', 'linkTarget', 'linkText', 'anchorHeading'],
    );
  });

  it('finds a finding by its production text', () => {
    expect(matchedFields(entry({ prod: 'Bekijk deals >' }), 'bekijk deals >')).toEqual(['prodText']);
  });

  it('finds a finding by its new-site text', () => {
    expect(matchedFields(entry({ prod: null, new: 'Bekijk aanbiedingen' }), 'aanbiedingen'))
      .toEqual(['newText']);
  });

  it('finds a finding by the link target, and does not call that production text', () => {
    // Decision 1: on a links check `prod` and `new` hold `linkKey()`'s host-folded
    // target and not words. Reporting a URL hit as *production text* would tell an
    // editor a sentence is on the page when what is on the page is a link.
    const links = entry({ class: 'link-target', prod: 'self/terrasoverkapping', new: null });
    expect(matchedFields(links, 'terrasoverkapping')).toEqual(['linkTarget']);
  });

  it('finds a finding by the words on the link', () => {
    // The field only the build can fill, and the reason the index is emitted at all.
    const links = entry({
      class: 'link-target', prod: 'self/deals', new: null, linkText: ['Bekijk deals >'],
    });
    expect(matchedFields(links, 'bekijk')).toEqual(['linkText']);
  });

  it('finds a finding by the heading it sits under', () => {
    expect(matchedFields(entry({ prod: null, anchorHeading: 'Montage' }), 'montage'))
      .toEqual(['anchorHeading']);
  });

  it('finds a finding by its page key', () => {
    expect(matchedFields(entry({ prod: null, anchorHeading: null }), 'afhal')).toEqual(['page']);
  });

  it('matches a page key that holds a slash, without splitting on it', () => {
    // The named trap. A key like `blog/montage-tips` is one opaque string, so the term
    // is matched against the whole of it and the slash is an ordinary letter. Plain
    // substring gets this for free — the test is here to stop a later tokeniser
    // breaking it, not because the first attempt failed.
    const nested = entry({ page: 'blog/montage-tips', prod: null, anchorHeading: null });
    expect(matchedFields(nested, 'blog/montage')).toEqual(['page']);
    expect(matchedFields(nested, 'montage-tips')).toEqual(['page']);
  });

  it('matches the words as typed, ignoring case and keeping punctuation', () => {
    // `Bekijk deals >` is what an editor reads on the page, so it is what they type,
    // and the `>` has to survive being searched for. Not tokens: two words with
    // something between them are not a match for the pair.
    expect(matchedFields(entry({}), 'DEALS >')).toEqual(['prodText']);
    expect(matchedFields(entry({}), 'deals montage')).toEqual([]);
  });

  it('matches nothing on an empty term, because an empty box is not a search', () => {
    // Without this every finding in the store would match, and the result would read
    // as a search that found everything rather than as a box nobody has typed in.
    expect(matchedFields(entry({}), '  ')).toEqual([]);
  });

  it('names every field that matched, in the order the fields are listed', () => {
    // One word can hit the text and the heading at once. Naming both is how a result
    // explains itself; naming only the first would hide half the reason it is there.
    const both = entry({ prod: 'Montage inbegrepen', anchorHeading: 'Montage' });
    expect(matchedFields(both, 'montage')).toEqual(['prodText', 'anchorHeading']);
  });
});
