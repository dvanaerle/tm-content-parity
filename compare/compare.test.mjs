import { describe, expect, it } from 'vitest';

import { comparePage, newSitePathsFor, reportFilename, skipReason } from './30-compare.mjs';
import { FindingCollector, summarise } from './findings.mjs';
import { compareImages } from './images.mjs';
import { compareLinks } from './links.mjs';
import { lcsPairs, mayPair, maskNumbers, similarity, tier2 } from './match.mjs';
import { classifyPair, diffRows, textFindings } from './text.mjs';

let seq = 0;

/**
 * @param {string} raw
 * @param {Partial<import('./contract.mjs').TextElement>} [overrides]
 */
function element(raw, overrides = {}) {
  const tag = overrides.tag ?? 'p';
  const heading = /^h[1-6]$/.test(tag);
  return {
    index: seq++,
    tag,
    kind: heading ? 'heading' : tag === 'a' || tag === 'button' ? 'cta' : 'text',
    level: heading ? Number(tag.slice(1)) : null,
    raw,
    norm: raw,
    ...overrides,
  };
}

/**
 * @param {Partial<import('./contract.mjs').PageExtract>} overrides
 * @returns {import('./contract.mjs').PageExtract}
 */
function extract(overrides) {
  seq = 0;
  return {
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
    meta: { title: null, description: null, canonical: null, noindex: false, h1: null },
    markdown: '',
    diagnostics: { imagesWithoutSrc: 0 },
    fetchedAt: '2026-08-06T00:00:00.000Z',
    ...overrides,
  };
}

/** @param {(collector: FindingCollector) => void} run */
function collect(run) {
  const collector = new FindingCollector({ store: 'nl', page: 'overkappingen' });
  run(collector);
  return collector.all();
}

/** @param {string[]} texts */
function elements(texts) {
  seq = 0;
  return texts.map((text) => element(text));
}

describe('tier2', () => {
  it('folds letter case and trailing punctuation, and nothing else', () => {
    expect(tier2('Levering in 5 werkdagen.')).toBe('levering in 5 werkdagen');
    expect(tier2('Gratis  bezorging')).toBe('gratis  bezorging');
  });
});

describe('maskNumbers', () => {
  it('masks a price with a thousands separator as one number', () => {
    expect(maskNumbers('Vanaf € 1.534,00')).toBe('Vanaf € #');
  });
});

describe('similarity', () => {
  it('is 1 for the same tokens and 0 for none shared', () => {
    expect(similarity('gratis bezorging', 'gratis bezorging')).toBe(1);
    expect(similarity('gratis bezorging', 'snelle montage')).toBe(0);
  });

  it('scores an edited sentence above the 0.6 pair threshold', () => {
    expect(similarity(
      'Onze terrasoverkapping wordt gratis bij u thuis bezorgd',
      'Onze terrasoverkapping wordt gratis thuis bezorgd',
    )).toBeGreaterThan(0.6);
  });

  it('scores a replaced sentence below it', () => {
    expect(similarity('Kleuren:', 'Verkrijgbaar in de volgende kleuren:')).toBeLessThan(0.6);
  });

  it('pairs a two-word CTA that swapped its last word', () => {
    // 0.67. Ticket 02 wants this pair: `Bekijk alle deals` → `Bekijk alle FAQs`
    // is a real CTA change and must read as one `copy` row, not as a loss and an
    // addition on opposite ends of the page.
    expect(similarity('Bekijk alle deals', 'Bekijk alle FAQs')).toBeGreaterThan(0.6);
  });
});

describe('lcsPairs', () => {
  it('does not cascade an insertion into every later element', () => {
    const left = elements(['een', 'twee', 'drie']);
    const right = elements(['een', 'nieuw', 'twee', 'drie']);
    expect(lcsPairs(left, right).length).toBe(3);
  });
});

describe('mayPair', () => {
  it('refuses two headings of a different level', () => {
    expect(mayPair(element('Kleuren', { tag: 'h2' }), element('Kleuren', { tag: 'h3' }))).toBe(false);
  });

  it('refuses a heading against a button label', () => {
    expect(mayPair(element('Kleuren', { tag: 'h2' }), element('Kleuren', { tag: 'button' }))).toBe(false);
  });
});

describe('classifyPair', () => {
  it('calls a case-only difference casing, not copy', () => {
    expect(classifyPair(
      element('Stijl Modern of Klassiek'),
      element('Stijl modern of klassiek'),
    )).toBe('casing');
  });

  it('calls a trailing full stop casing', () => {
    expect(classifyPair(element('Gratis bezorging'), element('Gratis bezorging.'))).toBe('casing');
  });

  it('calls a number-only difference price', () => {
    expect(classifyPair(element('Vanaf € 799'), element('Vanaf € 849'))).toBe('price');
  });

  it('needs the promotional pattern on both sides', () => {
    // The prototype matched the two sides joined, so one keyword was enough and
    // `Bekijk alle deals` → `Bekijk alle FAQs` was hidden as a campaign. It is a
    // real CTA change.
    expect(classifyPair(element('Bekijk alle deals'), element('Bekijk alle FAQs'))).toBe('copy');
    expect(classifyPair(
      element('Nu 10% korting op alle overkappingen'),
      element('Nu 15% korting op alle overkappingen en zonwering'),
    )).toBe('campaign');
  });

  it('does not hide a wrong value in a table cell', () => {
    // The old rule was "the tag is td or th", which hid every specification
    // defect. The tag must differ across the sides, so two `td` cells that
    // disagree stay visible as `copy`.
    expect(classifyPair(
      element('Dakdikte 16 mm gehard glas', { tag: 'td' }),
      element('Dakdikte 8 mm gehard glas', { tag: 'td' }),
    )).toBe('price');
    expect(classifyPair(
      element('Dakdikte gehard glas', { tag: 'td' }),
      element('Dakdikte gelaagd glas', { tag: 'td' }),
    )).toBe('copy');
  });

  it('calls the same content in a moved element restructured', () => {
    expect(classifyPair(
      element('Verkrijgbaar in RAL 7016 antraciet', { tag: 'p' }),
      element('Verkrijgbaar in RAL 7016 antracietgrijs', { tag: 'td' }),
    )).toBe('restructured');
  });
});

describe('diffRows', () => {
  const production = extract({
    elements: elements(['Overkappingen', 'Gratis bezorging', 'Onze prijzen zijn scherp']),
  });
  const next = extract({
    side: 'new',
    elements: elements(['Overkappingen', 'Gratis bezorging', 'Onze prijzen zijn heel scherp', 'Nieuw blok']),
  });
  const rows = diffRows(production, next);

  it('gives an exact match no class, so it is never a finding', () => {
    expect(rows.filter((row) => row.class === null).length).toBe(2);
  });

  it('pairs the edited paragraph instead of reporting a loss and an addition', () => {
    const edited = rows.find((row) => row.class === 'copy');
    expect(edited?.prod?.raw).toBe('Onze prijzen zijn scherp');
    expect(edited?.new?.raw).toBe('Onze prijzen zijn heel scherp');
    expect(edited?.score).toBeGreaterThan(0.6);
  });

  it('reports unchanged text that moved into another element', () => {
    // Before ticket 33 the LCS anchored on `norm` alone and this was an exact
    // match that emitted nothing. 762 elements on 80 nl pages were reported as
    // identical while their element had changed.
    const rows = diffRows(
      extract({ elements: [element('Verkrijgbaar in RAL 7016', { tag: 'p' })] }),
      extract({ side: 'new', elements: [element('Verkrijgbaar in RAL 7016', { tag: 'td' })] }),
    );
    expect(rows.map((row) => row.class)).toEqual(['tag-changed']);
  });

  it('keeps production document order and places an addition in place', () => {
    expect(rows.map((row) => row.prod?.raw ?? `+${row.new?.raw}`)).toEqual([
      'Overkappingen',
      'Gratis bezorging',
      'Onze prijzen zijn scherp',
      '+Nieuw blok',
    ]);
  });

  /** @param {string} prodTag @param {string} newTag */
  function samePairedText(prodTag, newTag) {
    const text = 'Kleuren en afwerking';
    const rows = diffRows(
      extract({ elements: [element(text, { tag: prodTag })] }),
      extract({ side: 'new', elements: [element(text, { tag: newTag })] }),
    );
    return rows.map((row) => row.class);
  }

  it('reports a heading demoted from h2 to h3 with the text unchanged', () => {
    // The one rule in spec 32 that turns a currently-silent match into a
    // finding. 467 of the 762 are a heading-level change, and it is what makes
    // the missing `h1` on 16 pages visible.
    expect(samePairedText('h2', 'h3')).toEqual(['heading-level']);
  });

  it('reports a heading on one side only as heading-level, in both directions', () => {
    // "Either side is a heading" — a paragraph promoted to a heading and a
    // heading demoted to a paragraph are both an outline change.
    expect(samePairedText('p', 'h3')).toEqual(['heading-level']);
    expect(samePairedText('h3', 'p')).toEqual(['heading-level']);
  });

  it('parks a tag change between two non-headings as hidden', () => {
    expect(samePairedText('p', 'div')).toEqual(['tag-changed']);
    expect(samePairedText('li', 'p')).toEqual(['tag-changed']);
  });

  it('keeps the same text in the same tag an exact match that emits nothing', () => {
    expect(samePairedText('p', 'p')).toEqual([null]);
    expect(samePairedText('h2', 'h2')).toEqual([null]);

    const findings = collect((collector) => textFindings(
      diffRows(
        extract({ elements: [element('Kleuren', { tag: 'h2' })] }),
        extract({ side: 'new', elements: [element('Kleuren', { tag: 'h2' })] }),
      ),
      collector,
    ));
    expect(findings).toEqual([]);
  });

  it('splits a one-sided element by direction', () => {
    // Ticket 33 retires `structure`. A dropped paragraph and an invented one
    // carried the same word, and the invented side is mostly a PageBuilder
    // rebuild rather than a defect.
    const rows = diffRows(
      extract({ elements: elements(['Wij leveren door heel Nederland']) }),
      extract({ side: 'new', elements: elements(['Bekijk onze showrooms in de buurt']) }),
    );
    expect(rows.map((row) => row.class).sort()).toEqual(['text-added', 'text-missing']);
    expect(rows.find((row) => row.class === 'text-missing')?.new).toBe(null);
    expect(rows.find((row) => row.class === 'text-added')?.prod).toBe(null);
  });
});

describe('textFindings', () => {
  it('counts one rename repeated four times as one finding', () => {
    const before = 'Verkrijgbaar in de volgende kleuren';
    const after = 'Verkrijgbaar in deze kleuren';
    const production = extract({ elements: elements([before, before, before, before]) });
    const next = extract({ side: 'new', elements: elements([after, after, after, after]) });

    const findings = collect((collector) => textFindings(diffRows(production, next), collector));
    expect(findings.length).toBe(1);
    expect(findings[0].occurrences).toBe(4);
  });

  it('reports a rename below the pair threshold as a loss and an addition', () => {
    // `Kleuren:` → `Verkrijgbaar in de volgende kleuren:` scores 0.33, so it does
    // not pair at ticket 02's 0.6 — nor would it have at the prototype's 0.55.
    // Ticket 02 quotes it as its example of one change counted many times, but
    // it is one loss and one addition, each grouped to four occurrences. The
    // grouping still does the work the ticket wanted; the pairing cannot.
    const production = extract({ elements: elements(['Kleuren:', 'Kleuren:', 'Kleuren:', 'Kleuren:']) });
    const label = 'Verkrijgbaar in de volgende kleuren:';
    const next = extract({ side: 'new', elements: elements([label, label, label, label]) });

    const findings = collect((collector) => textFindings(diffRows(production, next), collector));
    expect(findings.map((finding) => [finding.class, finding.occurrences])).toEqual([
      ['text-missing', 4],
      ['text-added', 4],
    ]);
  });

  it('leaves the invented side out of the shown count', () => {
    // Ticket 33: `text-added` is hidden, so a PageBuilder rebuild cannot bury
    // the content that was actually lost.
    const findings = collect((collector) => textFindings(
      diffRows(
        extract({ elements: elements(['Wij leveren door heel Nederland']) }),
        extract({ side: 'new', elements: elements(['Bekijk onze showrooms in de buurt']) }),
      ),
      collector,
    ));
    expect(summarise(findings)).toMatchObject({ shown: 1, hidden: 1, total: 2 });
  });

  it('gives every occurrence one id, so the count cannot detach a dismissal', () => {
    const production = extract({ elements: elements(['Kleuren:', 'Kleuren:']) });
    const next = extract({ side: 'new', elements: elements(['Kleur:', 'Kleur:']) });
    const [finding] = collect((collector) => textFindings(diffRows(production, next), collector));
    expect(finding.id).toMatch(/^[A-Za-z0-9_-]{16}$/);
  });
});

// --- Links ---------------------------------------------------------------

/**
 * @param {string} url
 * @param {string} text
 * @param {{ key?: string, internal?: boolean }} [overrides]
 */
function link(url, text, overrides = {}) {
  const parsed = new URL(url);
  const self = ['www.tuinmaximaal.nl', 'valanticnl.intern.systems'].includes(parsed.host);
  return {
    href: url,
    url,
    key: overrides.key
      ?? `${self ? 'self' : parsed.host}${parsed.pathname.toLowerCase().replace(/\/+$/, '')}`,
    text,
    internal: overrides.internal ?? /intern\.systems$|tuinmaximaal\./.test(parsed.host),
  };
}

const newUrl = 'https://valanticnl.intern.systems/overkappingen';

describe('compareLinks', () => {
  it('reports a live-domain link only when the path is a page on the new site', () => {
    const production = extract({ links: [] });
    const next = extract({
      side: 'new',
      url: newUrl,
      links: [
        link('https://www.tuinmaximaal.nl/garantie', 'Garantie'),
        link('https://www.tuinmaximaal.nl/', 'Home'),
        link('https://360tour.tuinmaximaal.com/tour', 'Bekijk de tour'),
      ],
    });
    const findings = collect((collector) => compareLinks({
      production,
      new: next,
      collector,
      newSitePaths: new Set(['/garantie']),
    }));

    // The bare home target has no path, which is what spares the `disclaimer`
    // boilerplate; `360tour` is an allowlisted separate service.
    expect(findings.filter((f) => f.class === 'leakage').length).toBe(1);
  });

  it('is host-based for cross-store links, because be and be_fr share a host', () => {
    const next = extract({
      side: 'new',
      url: newUrl,
      links: [link('https://tuinmaximaalbe.intern.systems/garantie', 'BE garantie')],
    });
    const findings = collect((collector) => compareLinks({ production: extract({}), new: next, collector }));
    expect(findings.some((f) => f.class === 'cross-store-link')).toBe(true);
  });

  it('reports a retargeted anchor once, not as a missing plus an extra link', () => {
    const production = extract({ links: [link('https://www.tuinmaximaal.nl/carport', 'Bekijk carports')] });
    const next = extract({
      side: 'new',
      url: newUrl,
      links: [link('https://valanticnl.intern.systems/carports', 'Bekijk carports')],
    });
    const findings = collect((collector) => compareLinks({ production, new: next, collector }));
    expect(findings.map((f) => f.class)).toEqual(['link-target']);
  });

  it('will not pair two anchors that share their text', () => {
    // `Lees meer` twice on each side carries no identity, and a wrong pair
    // asserts a target change that did not happen.
    const production = extract({
      links: [
        link('https://www.tuinmaximaal.nl/a', 'Lees meer'),
        link('https://www.tuinmaximaal.nl/b', 'Lees meer'),
      ],
    });
    const next = extract({
      side: 'new',
      url: newUrl,
      links: [
        link('https://valanticnl.intern.systems/a', 'Lees meer'),
        link('https://valanticnl.intern.systems/c', 'Lees meer'),
      ],
    });
    const findings = collect((collector) => compareLinks({ production, new: next, collector }));
    expect(findings.some((f) => f.class === 'link-target')).toBe(false);
    expect(findings.map((f) => f.class).sort()).toEqual(['extra-link', 'missing-link']);
  });

  it('fires broken-link even when production is broken too', () => {
    const target = 'https://valanticnl.intern.systems/weg';
    const next = extract({ side: 'new', url: newUrl, links: [link(target, 'Weg')] });
    const findings = collect((collector) => compareLinks({
      production: extract({ links: [link('https://www.tuinmaximaal.nl/weg', 'Weg')] }),
      new: next,
      collector,
      statuses: new Map([
        [target, { status: 404, hops: 0 }],
        ['https://www.tuinmaximaal.nl/weg', { status: 404, hops: 0 }],
      ]),
    }));
    expect(findings.some((f) => f.class === 'broken-link')).toBe(true);
  });

  it('does not guess about a broken link without a status map', () => {
    const next = extract({ side: 'new', url: newUrl, links: [link('https://valanticnl.intern.systems/weg', 'Weg')] });
    const findings = collect((collector) => compareLinks({ production: extract({}), new: next, collector }));
    expect(findings.some((f) => f.class === 'broken-link')).toBe(false);
  });

  it('suppresses missing-link when production its own target is broken', () => {
    const target = 'https://www.tuinmaximaal.nl/weg';
    const findings = collect((collector) => compareLinks({
      production: extract({ links: [link(target, 'Weg')] }),
      new: extract({ side: 'new', url: newUrl, links: [] }),
      collector,
      statuses: new Map([[target, { status: 404, hops: 0 }]]),
    }));
    expect(findings.length).toBe(0);
  });

  it('deduplicates a target the page links eight times', () => {
    const production = extract({
      links: Array.from({ length: 8 }, () => link('https://www.tuinmaximaal.nl/carport', 'Carport')),
    });
    const findings = collect((collector) => compareLinks({
      production,
      new: extract({ side: 'new', url: newUrl, links: [] }),
      collector,
    }));
    expect(findings.length).toBe(1);
  });
});

// --- Images --------------------------------------------------------------

/** @param {string} key @param {string | null} alt */
const image = (key, alt) => ({ key, src: `/media/wysiwyg/${key}`, alt });

describe('compareImages', () => {
  it('hides production its campaign banner instead of calling it missing', () => {
    // 252 instances across 123 of 124 pages, with no new-site counterpart. Under
    // the both-sides rule this is the largest source of findings in the dataset.
    const findings = collect((collector) => compareImages(
      extract({ images: [image('2026-07-23-kortingactie-nl-16aug.svg', '')] }),
      extract({ side: 'new', images: [] }),
      collector,
    ));
    expect(findings.map((f) => f.class)).toEqual(['image-campaign']);
  });

  it('reports a lost alt but not an empty alt on both sides', () => {
    const findings = collect((collector) => compareImages(
      extract({ images: [image('dak.jpg', 'Glazen dak'), image('zij.jpg', '')] }),
      extract({ side: 'new', images: [image('dak.jpg', ''), image('zij.jpg', '')] }),
      collector,
    ));
    expect(findings.map((f) => f.class)).toEqual(['alt-lost']);
  });

  it('is silent when the new site gains an alt production never had', () => {
    const findings = collect((collector) => compareImages(
      extract({ images: [image('dak.jpg', null)] }),
      extract({ side: 'new', images: [image('dak.jpg', 'Glazen dak')] }),
      collector,
    ));
    expect(findings.length).toBe(0);
  });

  it('sends a case-only alt difference to the shared casing class', () => {
    // A separate `alt-casing` would mean an editor who mutes casing on a page
    // still receives casing findings from a second tab, so the mute would not
    // mean what it says.
    const findings = collect((collector) => compareImages(
      extract({ images: [image('dak.jpg', 'Glazen Dak')] }),
      extract({ side: 'new', images: [image('dak.jpg', 'Glazen dak')] }),
      collector,
    ));
    expect(findings.map((f) => f.class)).toEqual(['casing']);
  });
});

// --- The report ----------------------------------------------------------

describe('skipReason', () => {
  it('gates on 200, because a 404 page still extracts', () => {
    expect(skipReason(extract({ status: 404 }), extract({ side: 'new' })))
      .toMatch(/exists only on the new site/);
    expect(skipReason(extract({}), extract({ side: 'new', status: 404 })))
      .toMatch(/not been migrated/);
    expect(skipReason(extract({}), extract({ side: 'new' }))).toBe(null);
  });
});

describe('comparePage', () => {
  it('makes no findings for a one-sided page, and says why', () => {
    const report = comparePage({
      sides: {
        production: extract({ status: 404 }),
        new: extract({ side: 'new', elements: elements(['Onderdelen', 'Bekijk alles']) }),
      },
    });
    expect(report.comparable).toBe(false);
    expect(report.findings).toEqual([]);
    expect(report.skipReason).toBeTruthy();
  });

  it('holds rows as element indices, not copies of the text', () => {
    const report = comparePage({
      sides: {
        production: extract({ elements: elements(['Overkappingen']) }),
        new: extract({ side: 'new', elements: elements(['Overkappingen']) }),
      },
    });
    // `finding` is null on an exact match: spec 29 links a row to the grouped
    // finding it belongs to, and a match is not a finding.
    expect(report.rows).toEqual([{ class: null, prod: 0, new: 0, score: null, finding: null }]);
  });

  it('links a row to the grouped finding it belongs to', () => {
    // A row is a position and a finding is grouped, so the two cannot be the same
    // record — but an override control on a row has to act on the finding, and
    // the browser cannot recompute the id: `findingId()` needs `node:crypto`.
    const report = comparePage({
      sides: {
        production: extract({ elements: elements(['Levering in 5 werkdagen']) }),
        new: extract({ side: 'new', elements: elements(['Levering in vijf werkdagen']) }),
      },
    });
    const row = report.rows.find((candidate) => candidate.class);
    expect(row.finding).toBe(report.findings[0].id);
  });

  it('counts a shown and a hidden class apart', () => {
    const report = comparePage({
      sides: {
        production: extract({ elements: elements(['Vanaf € 799', 'Gratis bezorging']) }),
        new: extract({ side: 'new', elements: elements(['Vanaf € 849', 'Snelle bezorging vandaag']) }),
      },
    });
    // `Gratis bezorging` → `Snelle bezorging vandaag` scores 0.4, so it does not
    // pair: it is a loss and an addition, and ticket 33 hides the addition.
    expect(report.summary.byClass).toEqual({
      price: 1, 'text-missing': 1, 'text-added': 1,
    });
    expect(report.summary).toMatchObject({ shown: 1, hidden: 2, total: 3 });
  });
});

describe('summarise', () => {
  it('leaves a hidden class out of the shown count', () => {
    expect(summarise([
      { class: 'copy', check: 'text' },
      { class: 'extra-link', check: 'links' },
    ])).toMatchObject({ shown: 1, hidden: 1, total: 2 });
  });
});

describe('reportFilename', () => {
  it('flattens a page key that holds a slash', () => {
    expect(reportFilename('nl', 'faq/productinformatie')).toBe('nl__faq__productinformatie.json');
  });
});

describe('newSitePathsFor', () => {
  it('reads the paths from the seeds, with no network', () => {
    const seeds = {
      rows: [
        { page: 'garantie', stores: { nl: { newUrl: 'https://valanticnl.intern.systems/garantie' } } },
        { page: 'alleen-be', stores: { be: { newUrl: 'https://valanticbe.intern.systems/waarborg' } } },
      ],
    };
    expect(newSitePathsFor(seeds, 'nl')).toEqual(new Set(['/garantie']));
  });
});
