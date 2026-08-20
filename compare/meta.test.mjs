import { describe, expect, it } from 'vitest';

import { FindingCollector } from './findings.mjs';
import { HEAD_CLASSES, compareMeta, metaRows } from './meta.mjs';
import { EXTRACT_VERSION } from '../shared/extract-version.mjs';

const newUrl = 'https://m2stagingnl.intern.systems/overkappingen';

/**
 * @param {Partial<import('./contract.mjs').PageExtract>} overrides
 * @returns {import('./contract.mjs').PageExtract}
 */
function extract(overrides) {
  return {
    extractVersion: EXTRACT_VERSION,
    store: 'nl',
    page: 'overkappingen',
    side: 'production',
    url: 'https://www.tuinmaximaal.nl/overkappingen',
    status: 200,
    boundary: 'main',
    pageType: 'cms-page',
    elements: [],
    links: [],
    images: [],
    meta: {
      title: null,
      description: null,
      canonical: null,
      robots: null,
      noindex: false,
      keywords: null,
      h1: null,
    },
    markdown: '',
    diagnostics: { imagesWithoutSrc: 0 },
    fetchedAt: '2026-08-06T00:00:00.000Z',
    ...overrides,
  };
}

/**
 * The `<head>` panel (ticket 35, phase 6 of spec 32): which rows an editor is shown.
 * These rules live in a pure module and are tested here rather than asserted through
 * the panel, and since ticket 97 they are also what `compareMeta` below reads.
 */
describe('metaRows', () => {
  /**
   * @param {Partial<import('./contract.mjs').PageMeta>} prodMeta
   * @param {Partial<import('./contract.mjs').PageMeta>} newMeta
   */
  const rows = (prodMeta, newMeta) =>
    metaRows(
      extract({
        url: 'https://www.tuinmaximaal.nl/overkappingen',
        meta: {
          title: null,
          description: null,
          canonical: null,
          noindex: false,
          h1: null,
          ...prodMeta,
        },
      }),
      extract({
        url: newUrl,
        meta: {
          title: null,
          description: null,
          canonical: null,
          noindex: false,
          h1: null,
          ...newMeta,
        },
      }),
    );

  /** @param {string} field */
  const row = (all, field) => all.find((candidate) => candidate.field === field);

  it('does not carry h1 — the content view owns it', () => {
    // Spec 32, decision 34: 93 pages differ on the `h1`, and it is a unit
    // inside the content boundary. Reporting it here as well would report the
    // same difference twice on two tabs.
    expect(row(rows({ h1: 'Overkappingen' }, { h1: 'Veranda' }), 'h1')).toBeUndefined();
  });

  it('reads a changed title as changed and an equal one as equal', () => {
    expect(row(rows({ title: 'Overkappingen' }, { title: 'Veranda' }), 'title').state).toBe(
      'changed',
    );
    expect(row(rows({ title: 'Overkappingen' }, { title: 'Overkappingen' }), 'title').state).toBe(
      'same',
    );
  });

  it('folds the two hosts before it compares a canonical', () => {
    // 18 of 179 nl pages differ on the canonical by hostname alone, and the
    // hostname is the environment rather than a content difference.
    const canonical = row(
      rows(
        { canonical: 'https://www.tuinmaximaal.nl/overkappingen' },
        { canonical: 'https://m2stagingnl.intern.systems/overkappingen/' },
      ),
      'canonical',
    );
    expect(canonical.state).toBe('same');
    // It compares the folded pair and reports the raw one, so `state` is the only
    // place the fold is readable. A panel that diffs `prod` against `new` paints
    // the hostname on all 18 pages, which is why the cells key on `state` and not
    // on the two strings they show.
    expect(canonical.prod).toBe('https://www.tuinmaximaal.nl/overkappingen');
    expect(canonical.new).toBe('https://m2stagingnl.intern.systems/overkappingen/');
  });

  it('still reports a canonical that points at another page', () => {
    const canonical = row(
      rows(
        { canonical: 'https://www.tuinmaximaal.nl/overkappingen' },
        { canonical: 'https://m2stagingnl.intern.systems/veranda' },
      ),
      'canonical',
    );
    expect(canonical.state).toBe('changed');
  });

  it('hides the canonical row when production has none and the new site has one', () => {
    // 147 of 179 nl pages. The content team cannot set a canonical, so it was
    // never a difference an editor could act on.
    expect(
      row(
        rows(
          { canonical: null },
          { canonical: 'https://m2stagingnl.intern.systems/overkappingen' },
        ),
        'canonical',
      ),
    ).toBeUndefined();
  });

  it('keeps the canonical row when the new site lost one', () => {
    // The other direction, on 2 pages. The suppression above must not bury it.
    const canonical = row(
      rows({ canonical: 'https://www.tuinmaximaal.nl/overkappingen' }, { canonical: null }),
      'canonical',
    );
    expect(canonical.state).toBe('lost');
  });

  it('keeps a canonical row that neither side has', () => {
    expect(row(rows({ canonical: null }, { canonical: null }), 'canonical').state).toBe('same');
  });

  it('keeps noindex visible', () => {
    // Four pages differ, and a page indexable on production and noindex on the
    // new site is a launch blocker.
    const noindex = row(rows({ noindex: false }, { noindex: true }), 'noindex');
    expect(noindex.state).toBe('changed');
    expect(noindex.new).toBe('noindex');
    expect(noindex.prod).toBe('index');
  });

  it('reads a description the new site never wrote as lost', () => {
    expect(
      row(rows({ description: 'Overkappingen op maat' }, { description: null }), 'description')
        .state,
    ).toBe('lost');
  });

  it('reads a description production never had as added', () => {
    expect(
      row(rows({ description: null }, { description: 'Veranda op maat' }), 'description').state,
    ).toBe('added');
  });
});

/**
 * The head as the fourth check (ticket 97). Each of the three checking rows holds at
 * most one finding, which is what lets the panel stay a table of fields rather than
 * become a list of defects.
 */
describe('compareMeta', () => {
  /**
   * @param {Partial<import('./contract.mjs').PageMeta>} prodMeta
   * @param {Partial<import('./contract.mjs').PageMeta>} newMeta
   */
  const findings = (prodMeta, newMeta) => {
    const collector = new FindingCollector({ store: 'nl', page: 'overkappingen' });
    compareMeta(
      extract({ meta: { ...extract({}).meta, ...prodMeta } }),
      extract({ side: 'new', url: newUrl, meta: { ...extract({}).meta, ...newMeta } }),
      collector,
    );
    return collector.all();
  };

  /** @param {Array<import('./contract.mjs').Finding>} all */
  const classes = (all) => all.map((finding) => finding.class);

  it('reports a rewritten title once', () => {
    expect(classes(findings({ title: 'Overkappingen' }, { title: 'Veranda' }))).toEqual([
      'meta-title-changed',
    ]);
  });

  it('reports a title the new site never wrote as lost', () => {
    expect(classes(findings({ title: 'Overkappingen' }, { title: null }))).toEqual([
      'meta-title-lost',
    ]);
  });

  it('reports a title production never had as added', () => {
    expect(classes(findings({ title: null }, { title: 'Veranda' }))).toEqual(['meta-title-added']);
  });

  it('reads a title that lost only its full stop as casing, and not as a rewrite', () => {
    expect(classes(findings({ title: 'Overkappingen.' }, { title: 'overkappingen' }))).toEqual([
      'meta-casing',
    ]);
  });

  it('leaves an equal head alone', () => {
    expect(findings({ title: 'Overkappingen' }, { title: 'Overkappingen' })).toEqual([]);
  });

  it('reports a rewritten description once', () => {
    expect(
      classes(
        findings({ description: 'Overkappingen op maat' }, { description: 'Veranda op maat' }),
      ),
    ).toEqual(['meta-description-changed']);
  });

  it('reports a description the new site never wrote as lost', () => {
    expect(
      classes(findings({ description: 'Overkappingen op maat' }, { description: null })),
    ).toEqual(['meta-description-lost']);
  });

  it('reports a description production never had as added', () => {
    expect(classes(findings({ description: null }, { description: 'Veranda op maat' }))).toEqual([
      'meta-description-added',
    ]);
  });

  it('reads a description that lost only its full stop as casing', () => {
    // All 4 of these on the corpus are a dropped trailing full stop on a description,
    // and `meta-description-changed` must not also be claiming them.
    expect(
      classes(
        findings(
          { description: 'Overkappingen op maat.' },
          { description: 'Overkappingen op maat' },
        ),
      ),
    ).toEqual(['meta-casing']);
  });

  it('reports a page that leaves the index', () => {
    // The severe direction: indexable on production, noindex on the new site, so the
    // page leaves Google. Nobody finds this by eye.
    expect(classes(findings({ noindex: false }, { noindex: true }))).toEqual(['robots-index-lost']);
  });

  it('reports a page that enters the index', () => {
    expect(classes(findings({ noindex: true }, { noindex: false }))).toEqual([
      'robots-noindex-lost',
    ]);
  });

  it('reads the derived boolean and not the raw robots string', () => {
    // The panel shows the string; the rule reads the boolean. Two spellings of the
    // same directive are not a finding.
    expect(
      findings(
        { robots: 'noindex, nofollow', noindex: true },
        { robots: 'noindex', noindex: true },
      ),
    ).toEqual([]);
  });

  it('makes no finding from a canonical, in either direction', () => {
    // The content team cannot set a canonical, and the host fold in `metaRows()` is
    // about display. A lost one keeps its row and still makes no work.
    expect(
      findings({ canonical: 'https://www.tuinmaximaal.nl/overkappingen' }, { canonical: null }),
    ).toEqual([]);
    expect(
      findings({ canonical: null }, { canonical: 'https://m2stagingnl.intern.systems/veranda' }),
    ).toEqual([]);
  });

  it('makes no finding from the h1 — the content view owns it', () => {
    expect(findings({ h1: 'Overkappingen' }, { h1: 'Veranda' })).toEqual([]);
  });

  it('makes no finding from keywords, whichever way the field moved', () => {
    // Ticket 92 named no class for it: on the 722 comparable pairs 54 pages lose the field,
    // 12 change it and 4 gain it, and all 70 are shown and not counted.
    expect(findings({ keywords: 'overkapping' }, { keywords: null })).toEqual([]);
    expect(findings({ keywords: 'overkapping' }, { keywords: 'veranda' })).toEqual([]);
    expect(findings({ keywords: null }, { keywords: 'veranda' })).toEqual([]);
  });

  it('can emit exactly the nine classes HEAD_CLASSES names', () => {
    // The set is what the interface reads to place a head finding: the Meta tab draws these
    // and draws nothing else. So a class the producer emits and the set does not hold is a
    // finding that lands nowhere, and a class in the set that nothing emits sends a reader
    // to a row that cannot exist. Both directions are asserted at once, by driving all nine
    // out of the producer — which two fields and three states between them reach.
    const emitted = new Set([
      ...classes(findings({ title: 'Overkappingen' }, { title: 'Veranda' })),
      ...classes(findings({ title: 'Overkappingen' }, { title: null })),
      ...classes(findings({ title: null }, { title: 'Veranda' })),
      ...classes(findings({ title: 'Overkappingen.' }, { title: 'overkappingen' })),
      ...classes(findings({ description: 'Op maat' }, { description: 'Op maat gemaakt' })),
      ...classes(findings({ description: 'Op maat' }, { description: null })),
      ...classes(findings({ description: null }, { description: 'Op maat' })),
      ...classes(findings({ noindex: false }, { noindex: true })),
      ...classes(findings({ noindex: true }, { noindex: false })),
    ]);

    expect(emitted).toEqual(HEAD_CLASSES);
  });

  it('carries no score and no anchor heading', () => {
    // `score` is a `copy` field and a head row has no similarity pairing. `anchorHeading`
    // is defined by document order inside the content boundary, and the head is outside it.
    const [finding] = findings({ title: 'Overkappingen' }, { title: 'Veranda' });
    expect(finding.score).toBeNull();
    expect(finding.anchorHeading).toBeNull();
  });
});

/**
 * The panel's five rows (ticket 98). The order is the order an editor reads them in, and
 * `metaRows()` owns it — the panel iterates what it is given.
 */
describe('the five rows the panel draws', () => {
  const meta = {
    title: null,
    description: null,
    canonical: null,
    robots: null,
    noindex: false,
    keywords: null,
    h1: null,
  };

  /**
   * @param {Partial<import('./contract.mjs').PageMeta>} prodMeta
   * @param {Partial<import('./contract.mjs').PageMeta>} newMeta
   */
  const rows = (prodMeta = {}, newMeta = {}) =>
    metaRows(
      extract({ meta: { ...meta, ...prodMeta } }),
      extract({ side: 'new', url: newUrl, meta: { ...meta, ...newMeta } }),
    );

  it('reads Meta Title, Meta Keywords, Meta Description, Robots, then Canonical', () => {
    expect(rows().map((row) => row.field)).toEqual([
      'title',
      'keywords',
      'description',
      'noindex',
      'canonical',
    ]);
  });

  it('shows a lost keywords field on the row, in the state that says so', () => {
    // Ticket 92: keywords is on 356 of 777 production page-sides and 291 of 764 new ones,
    // and 54 pages lose it. The row carries the loss; `compareMeta` below is where it is
    // established that nothing counts it.
    const [, keywords] = rows({ keywords: 'terrasoverkapping' }, { keywords: null });
    expect(keywords).toEqual({
      field: 'keywords',
      prod: 'terrasoverkapping',
      new: null,
      state: 'lost',
    });
  });
});
