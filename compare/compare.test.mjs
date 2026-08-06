import { describe, expect, it } from 'vitest';

import { comparePage, newSitePathsFor, reportFilename, skipReason } from './30-compare.mjs';
import { FindingCollector, median, summarise, summariseReports } from './findings.mjs';
import { compareImages } from './images.mjs';
import { compareLinks } from './links.mjs';
import { textFragmentUrl } from './locate.mjs';
import { lcsPairs, mayPair, maskNumbers, similarity, tier2 } from './match.mjs';
import { metaRows } from './meta.mjs';
import { classifyPair, diffRows, textFindings } from './text.mjs';
import { spansFor, wordDiff } from './worddiff.mjs';

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

/** @param {Array<[string, string]>} spec `[raw, tag]`, in document order. */
function outline(spec) {
  seq = 0;
  return spec.map(([raw, tag]) => element(raw, { tag }));
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

  // Ticket 34. A new-only row used to sort by its index in the **new** document
  // against **production** indices. The two index spaces only coincide while the
  // documents are about the same length, and on `fotogalerij` production holds 178
  // text elements against the new site's 9.
  const LONG = [
    'Overkappingen', 'Aluminium profielen', 'Glazen dak', 'Zonwering', 'Montage',
    'Levertijd', 'Garantie', 'Kleuren en RAL', 'Onderhoud', 'Contact',
  ];

  it('anchors a new-only row to the production position of the nearest matched pair', () => {
    const rows = diffRows(
      extract({ elements: elements(LONG) }),
      extract({ side: 'new', elements: elements(['Kleuren en RAL', 'Nieuw fotoblok', 'Onderhoud']) }),
    );

    // Under the old rule the addition carried new index 1 and landed second, six
    // paragraphs above the content it follows.
    expect(rows.map((row) => row.prod?.raw ?? `+${row.new?.raw}`)).toEqual([
      ...LONG.slice(0, 8), '+Nieuw fotoblok', ...LONG.slice(8),
    ]);
  });

  it('puts a new-only row above the first agreement, not at the top of the page', () => {
    const rows = diffRows(
      extract({ elements: elements(LONG) }),
      extract({ side: 'new', elements: elements(['Nieuw fotoblok', 'Kleuren en RAL']) }),
    );
    expect(rows.map((row) => row.prod?.raw ?? `+${row.new?.raw}`)).toEqual([
      ...LONG.slice(0, 7), '+Nieuw fotoblok', ...LONG.slice(7),
    ]);
  });

  it('reads a page the two sides agree nowhere on as production first, then the new site', () => {
    const rows = diffRows(
      extract({ elements: elements(['Overkappingen', 'Aluminium profielen']) }),
      extract({ side: 'new', elements: elements(['Nieuw fotoblok', 'Tweede fotoblok']) }),
    );
    expect(rows.map((row) => row.prod?.raw ?? `+${row.new?.raw}`)).toEqual([
      'Overkappingen', 'Aluminium profielen', '+Nieuw fotoblok', '+Tweede fotoblok',
    ]);
  });

  it('keeps two additions after one pair in the order the new site has them', () => {
    const rows = diffRows(
      extract({ elements: elements(LONG) }),
      extract({ side: 'new', elements: elements(['Kleuren en RAL', 'Eerste fotoblok', 'Tweede fotoblok']) }),
    );
    expect(rows.slice(8, 10).map((row) => row.new?.raw)).toEqual(['Eerste fotoblok', 'Tweede fotoblok']);
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
    // finding: 467 of the 762 are a heading-level change. It does **not** make a
    // dropped `h1` visible — that needs the text to be identical on both sides,
    // and a page that lost the words as well is `text-missing`. See ticket 33,
    // "Left for another ticket".
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

  it('says what changed when the two sides of text are equal', () => {
    // Without a detail the record reads `prod` and `new` as the same string, so
    // the finding says "identical" about a finding.
    const text = 'Kleuren en afwerking';
    const findings = collect((collector) => textFindings(
      diffRows(
        extract({ elements: [element(text, { tag: 'h2' })] }),
        extract({ side: 'new', elements: [element(text, { tag: 'h3' })] }),
      ),
      collector,
    ));
    expect(findings.map((finding) => [finding.class, finding.detail])).toEqual([
      ['heading-level', 'h2 → h3'],
    ]);
  });

  it('separates two demotions of the same words, so a worse one detaches', () => {
    const text = 'Kleuren en afwerking';
    /** @param {string} newTag */
    const idFor = (newTag) => collect((collector) => textFindings(
      diffRows(
        extract({ elements: [element(text, { tag: 'h2' })] }),
        extract({ side: 'new', elements: [element(text, { tag: newTag })] }),
      ),
      collector,
    ))[0].id;
    expect(idFor('h3')).not.toBe(idFor('h4'));
  });

  it('carries no detail on a class whose two sides already differ', () => {
    const findings = collect((collector) => textFindings(
      diffRows(
        extract({ elements: elements(['Vanaf € 799']) }),
        extract({ side: 'new', elements: elements(['Vanaf € 849']) }),
      ),
      collector,
    ));
    expect(findings.map((finding) => [finding.class, finding.detail])).toEqual([['price', null]]);
  });

  it('groups two occurrences of one demotion into one finding', () => {
    const text = 'Kleuren en afwerking';
    const findings = collect((collector) => textFindings(
      diffRows(
        extract({ elements: [element(text, { tag: 'h2' }), element(text, { tag: 'h2' })] }),
        extract({ side: 'new', elements: [element(text, { tag: 'h3' }), element(text, { tag: 'h3' })] }),
      ),
      collector,
    ));
    expect(findings.map((finding) => [finding.class, finding.occurrences])).toEqual([
      ['heading-level', 2],
    ]);
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
 * @param {{ key?: string, internal?: boolean, index?: number }} [overrides]
 */
function link(url, text, overrides = {}) {
  const parsed = new URL(url);
  const self = ['www.tuinmaximaal.nl', 'valanticnl.intern.systems'].includes(parsed.host);
  return {
    index: overrides.index ?? 0,
    href: url,
    url,
    key: overrides.key
      ?? `${self ? 'self' : parsed.host}${parsed.pathname.toLowerCase().replace(/\/+$/, '')}`,
    text,
    internal: overrides.internal ?? /intern\.systems$|tuinmaximaal\./.test(parsed.host),
  };
}

/**
 * The one new seam in spec 32. It is a pure function of two strings, which is why
 * it is a module and not a component: every rule with judgement in it has to be
 * testable in Node, and there is no browser test stack in this repo.
 *
 * The assertions are about **spans**, never about markup. A span list is the
 * shape the renderer consumes, so these survive a rewrite of the renderer.
 */
describe('wordDiff', () => {
  /** @param {import('./worddiff.mjs').DiffSpan[]} spans */
  const shape = (spans) => spans.map((span) => `${span.type}:${span.text}`);

  it('gives two identical strings one unchanged span', () => {
    expect(wordDiff('Gratis bezorging', 'Gratis bezorging'))
      .toEqual([{ type: 'same', text: 'Gratis bezorging' }]);
  });

  it('gives a one-word substitution exactly one removed and one added span', () => {
    const spans = wordDiff(
      'Onze terrasoverkapping wordt gratis bezorgd',
      'Onze terrasoverkapping wordt snel bezorgd',
    );
    expect(spans.filter((span) => span.type === 'removed')).toEqual([{ type: 'removed', text: 'gratis' }]);
    expect(spans.filter((span) => span.type === 'added')).toEqual([{ type: 'added', text: 'snel' }]);
  });

  it('keeps the unchanged words around a substitution in place', () => {
    expect(shape(wordDiff('een twee drie', 'een vier drie')))
      .toEqual(['same:een ', 'removed:twee', 'added:vier', 'same: drie']);
  });

  it('reports an insertion at the head', () => {
    expect(shape(wordDiff('twee drie', 'een twee drie')))
      .toEqual(['added:een ', 'same:twee drie']);
  });

  it('reports an insertion at the tail', () => {
    expect(shape(wordDiff('een twee', 'een twee drie')))
      .toEqual(['same:een twee', 'added: drie']);
  });

  it('picks out the changed segment of a link target', () => {
    // The reason the four surfaces share one component: two link keys are two
    // word lists, and this is what makes a changed path segment jump out
    // instead of reading as "the whole target changed".
    expect(shape(wordDiff('self/overkappingen/veranda', 'self/overkappingen/tuinkamer')))
      .toEqual(['same:self/overkappingen/', 'removed:veranda', 'added:tuinkamer']);
  });

  it('reproduces each side exactly when its spans are joined', () => {
    // The renderer never puts a separator back, so the spans must carry every
    // one. Anything else silently rewrites what production said.
    const prod = 'Verkrijgbaar in de volgende kleuren:';
    const next = 'Beschikbare kleuren:';
    const spans = wordDiff(prod, next);
    const join = (side) => spansFor(spans, side).map((span) => span.text).join('');
    expect(join('production')).toBe(prod);
    expect(join('new')).toBe(next);
  });

  it('reports a whole string as added when production is empty', () => {
    expect(wordDiff('', 'Nieuwe kop')).toEqual([{ type: 'added', text: 'Nieuwe kop' }]);
  });

  it('reports a whole string as removed when the new site is empty', () => {
    expect(wordDiff('Oude kop', '')).toEqual([{ type: 'removed', text: 'Oude kop' }]);
  });

  it('gives two empty strings no spans at all', () => {
    expect(wordDiff('', '')).toEqual([]);
    expect(wordDiff(null, null)).toEqual([]);
  });

  it('runs a word at a time and not a character at a time', () => {
    // Ticket 35: character-level on a Dutch compound produces confetti.
    // `terrasoverkapping` and `tuinoverkapping` share eleven letters and the
    // whole word is what changed.
    expect(shape(wordDiff('Onze terrasoverkapping', 'Onze tuinoverkapping')))
      .toEqual(['same:Onze ', 'removed:terrasoverkapping', 'added:tuinoverkapping']);
  });

  it('shows each side only its own words', () => {
    const spans = wordDiff('een twee drie', 'een vier drie');
    expect(shape(spansFor(spans, 'production'))).toEqual(['same:een ', 'removed:twee', 'same: drie']);
    expect(shape(spansFor(spans, 'new'))).toEqual(['same:een ', 'added:vier', 'same: drie']);
  });

  it('merges neighbouring words of the same kind into one span', () => {
    // Two removed words in a row are one edit to a reader, so they are one
    // highlight and not two boxes with a gap between them.
    expect(shape(wordDiff('een twee drie vier', 'een vier')))
      .toEqual(['same:een ', 'removed:twee drie ', 'same:vier']);
  });
});

const newUrl = 'https://valanticnl.intern.systems/overkappingen';

/**
 * The `<head>` panel (ticket 35, phase 6 of spec 32). It emits **no findings** —
 * ticket 21 has not decided what a parity defect in the head is — so these rules
 * exist only to decide what an editor is shown. That is why they live in a pure
 * module and are tested here rather than asserted through the panel.
 */
describe('metaRows', () => {
  /**
   * @param {Partial<import('./contract.mjs').PageMeta>} prodMeta
   * @param {Partial<import('./contract.mjs').PageMeta>} newMeta
   */
  const rows = (prodMeta, newMeta) => metaRows(
    extract({ url: 'https://www.tuinmaximaal.nl/overkappingen', meta: { title: null, description: null, canonical: null, noindex: false, h1: null, ...prodMeta } }),
    extract({ url: newUrl, meta: { title: null, description: null, canonical: null, noindex: false, h1: null, ...newMeta } }),
  );

  /** @param {string} field */
  const row = (all, field) => all.find((candidate) => candidate.field === field);

  it('does not carry h1 — the content view owns it', () => {
    // Spec 32, decision 34: 93 pages differ on the `h1`, and it is an element
    // inside the content boundary. Reporting it here as well would report the
    // same difference twice on two tabs.
    expect(row(rows({ h1: 'Overkappingen' }, { h1: 'Veranda' }), 'h1')).toBeUndefined();
    expect(rows({}, {}).map((each) => each.field))
      .toEqual(['title', 'description', 'canonical', 'noindex']);
  });

  it('reads a changed title as changed and an equal one as equal', () => {
    expect(row(rows({ title: 'Overkappingen' }, { title: 'Veranda' }), 'title').state).toBe('changed');
    expect(row(rows({ title: 'Overkappingen' }, { title: 'Overkappingen' }), 'title').state).toBe('same');
  });

  it('folds the two hosts before it compares a canonical', () => {
    // 18 of 179 nl pages differ on the canonical by hostname alone, and the
    // hostname is the environment rather than a content difference.
    const canonical = row(rows(
      { canonical: 'https://www.tuinmaximaal.nl/overkappingen' },
      { canonical: 'https://valanticnl.intern.systems/overkappingen/' },
    ), 'canonical');
    expect(canonical.state).toBe('same');
    // It compares the folded pair and reports the raw one, so `state` is the only
    // place the fold is readable. A panel that diffs `prod` against `new` paints
    // the hostname on all 18 pages, which is why the cells key on `state` and not
    // on the two strings they show.
    expect(canonical.prod).toBe('https://www.tuinmaximaal.nl/overkappingen');
    expect(canonical.new).toBe('https://valanticnl.intern.systems/overkappingen/');
  });

  it('still reports a canonical that points at another page', () => {
    const canonical = row(rows(
      { canonical: 'https://www.tuinmaximaal.nl/overkappingen' },
      { canonical: 'https://valanticnl.intern.systems/veranda' },
    ), 'canonical');
    expect(canonical.state).toBe('changed');
  });

  it('hides the canonical row when production has none and the new site has one', () => {
    // 147 of 179 nl pages. The content team cannot set a canonical, so it was
    // never a difference an editor could act on.
    expect(row(rows({ canonical: null }, { canonical: 'https://valanticnl.intern.systems/overkappingen' }), 'canonical'))
      .toBeUndefined();
  });

  it('keeps the canonical row when the new site lost one', () => {
    // The other direction, on 2 pages. The suppression above must not bury it.
    const canonical = row(rows({ canonical: 'https://www.tuinmaximaal.nl/overkappingen' }, { canonical: null }), 'canonical');
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
    expect(row(rows({ description: 'Overkappingen op maat' }, { description: null }), 'description').state)
      .toBe('lost');
  });

  it('reads a description production never had as added', () => {
    expect(row(rows({ description: null }, { description: 'Veranda op maat' }), 'description').state)
      .toBe('added');
  });
});

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

/** @param {string} key @param {string | null} alt @param {number} [index] */
const image = (key, alt, index = 0) => ({ index, key, src: `/media/wysiwyg/${key}`, alt });

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

// --- Position ------------------------------------------------------------

/**
 * Ticket 34. A finding that reads `hier` or `carports` used to send an editor
 * hunting through the page by eye. It now names the section it sits in.
 */
describe('the heading a finding sits under', () => {
  const PAGE = outline([
    ['Onze overkappingen', 'h1'],
    ['Voor de eerste kop', 'p'],
    ['Kleuren en RAL', 'h2'],
    ['Antraciet en creme', 'p'],
    ['Montage', 'h2'],
    ['Wij monteren zelf', 'p'],
  ]);

  /** @param {import('./contract.mjs').TextElement[]} elements */
  const prod = (elements) => extract({ elements });

  it('names the nearest heading before the element', () => {
    const next = outline([
      ['Onze overkappingen', 'h1'],
      ['Voor de eerste kop', 'p'],
      ['Kleuren en RAL', 'h2'],
      ['Antraciet en creme', 'p'],
      ['Montage', 'h2'],
      ['Wij monteren graag zelf', 'p'],
    ]);
    const findings = collect((collector) => textFindings(
      diffRows(prod(PAGE), extract({ side: 'new', elements: next })),
      collector,
    ));
    expect(findings.map((finding) => [finding.class, finding.anchor]))
      .toEqual([['copy', 'Montage']]);
  });

  it('is null when the element precedes every heading', () => {
    const findings = collect((collector) => textFindings(
      diffRows(
        prod(outline([['Kruimelpad naar de winkel', 'p'], ['Kleuren en RAL', 'h2']])),
        extract({ side: 'new', elements: outline([['Kleuren en RAL', 'h2']]) }),
      ),
      collector,
    ));
    expect(findings.map((finding) => [finding.class, finding.anchor]))
      .toEqual([['text-missing', null]]);
  });

  it('takes the heading above a heading, never the heading itself', () => {
    const after = outline([
      ['Onze overkappingen', 'h1'],
      ['Voor de eerste kop', 'p'],
      ['Kleuren en RAL', 'h3'],
      ['Antraciet en creme', 'p'],
      ['Montage', 'h2'],
      ['Wij monteren zelf', 'p'],
    ]);
    const findings = collect((collector) => textFindings(
      diffRows(prod(PAGE), extract({ side: 'new', elements: after })),
      collector,
    ));
    expect(findings.map((finding) => [finding.class, finding.anchor]))
      .toEqual([['heading-level', 'Onze overkappingen']]);
  });

  it('falls back to the new site when the finding has no production side', () => {
    const next = outline([['Kleuren en RAL', 'h2'], ['Ook in gepoedercoat wit', 'p']]);
    const findings = collect((collector) => textFindings(
      diffRows(prod(outline([['Kleuren en RAL', 'h2']])), extract({ side: 'new', elements: next })),
      collector,
    ));
    expect(findings.map((finding) => [finding.class, finding.anchor]))
      .toEqual([['text-added', 'Kleuren en RAL']]);
  });

  it('positions an image finding, so "which of the eleven images" has an answer', () => {
    const findings = collect((collector) => compareImages(
      extract({ elements: PAGE, images: [image('dak.jpg', 'Glazen dak', 5)] }),
      extract({ side: 'new', images: [] }),
      collector,
    ));
    expect(findings.map((finding) => [finding.class, finding.anchor]))
      .toEqual([['image-missing', 'Montage']]);
  });

  it('positions a link finding', () => {
    const findings = collect((collector) => compareLinks({
      production: extract({
        elements: PAGE,
        links: [link('https://www.tuinmaximaal.nl/carport', 'Carports', { index: 3 })],
      }),
      new: extract({ side: 'new', url: newUrl, links: [] }),
      collector,
    }));
    expect(findings.map((finding) => [finding.class, finding.anchor]))
      .toEqual([['missing-link', 'Kleuren en RAL']]);
  });

  it('stays out of the finding id, so a heading edit never detaches a dismissal', () => {
    const words = outline([['Kleuren en RAL', 'h2'], ['Antraciet en creme', 'p']]);
    const renamed = outline([['Kleuren en kleurkeuze', 'h2'], ['Antraciet en creme', 'p']]);
    const withoutHeading = outline([['Antraciet en creme', 'p']]);

    const id = (prodElements, newElements) => collect((collector) => textFindings(
      diffRows(extract({ elements: prodElements }), extract({ side: 'new', elements: newElements })),
      collector,
    )).find((finding) => finding.prod === 'Antraciet en creme' && finding.new === null)?.id;

    expect(id(words, [])).toBe(id(withoutHeading, []));
    expect(id(words, [])).toBe(id(renamed, []));
  });
});

describe('textFragmentUrl', () => {
  const PROD = 'https://www.tuinmaximaal.nl/overkappingen';

  it('points at the words, so a one-word finding stops being a hunt', () => {
    expect(textFragmentUrl(PROD, 'hier')).toBe(`${PROD}#:~:text=hier`);
  });

  it('takes the two ends of a long text, because the middle adds nothing', () => {
    const long = 'een twee drie vier vijf zes zeven acht negen tien elf twaalf dertien';
    expect(textFragmentUrl(PROD, long))
      .toBe(`${PROD}#:~:text=een%20twee%20drie%20vier%20vijf%20zes,acht%20negen%20tien%20elf%20twaalf%20dertien`);
  });

  it('escapes the hyphen, which separates a prefix from a suffix in the directive', () => {
    expect(textFragmentUrl(PROD, 'RAL-7016')).toBe(`${PROD}#:~:text=RAL%2D7016`);
  });

  it('has nothing to point at without a url or without text', () => {
    expect(textFragmentUrl(PROD, '')).toBe(null);
    expect(textFragmentUrl(PROD, '   ')).toBe(null);
    expect(textFragmentUrl(null, 'hier')).toBe(null);
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

describe('median', () => {
  it('takes the middle of an odd list and the mean of the two middles of an even one', () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('is 0 for no pages at all, so the gate prints a number', () => {
    expect(median([])).toBe(0);
  });

  it('does not sort the caller its array, and does not sort as text', () => {
    const values = [10, 9, 100];
    expect(median(values)).toBe(10);
    expect(values).toEqual([10, 9, 100]);
  });
});

describe('summariseReports', () => {
  /**
   * @param {boolean} comparable
   * @param {Record<string, number>} byClass
   * @param {{ shown: number, total: number }} counts
   */
  const report = (comparable, byClass, counts) => ({
    comparable,
    summary: { ...counts, hidden: counts.total - counts.shown, byClass, byCheck: {} },
  });

  it('counts every crawled page but measures only the comparable ones', () => {
    // Ticket 07: a page that fails the 200 gate carries no findings by design, so
    // counting its zero would drag the median down for a reason that has nothing
    // to do with the rules.
    const result = summariseReports([
      report(true, { copy: 4 }, { shown: 4, total: 4 }),
      report(true, { copy: 40 }, { shown: 40, total: 40 }),
      report(false, {}, { shown: 0, total: 0 }),
    ]);
    expect(result).toMatchObject({
      crawled: 3,
      comparable: 2,
      findings: 44,
      shown: 44,
      medianShown: 22,
      cleanPages: 0,
    });
  });

  it('adds the class tally over the pages', () => {
    const result = summariseReports([
      report(true, { copy: 2, 'text-added': 1 }, { shown: 2, total: 3 }),
      report(true, { copy: 3 }, { shown: 3, total: 3 }),
    ]);
    expect(result.byClass).toEqual({ copy: 5, 'text-added': 1 });
  });

  it('counts a page with only hidden findings as clean', () => {
    // The gate reads `shown`, because a hidden class is not work for an editor.
    const result = summariseReports([report(true, { 'text-added': 6 }, { shown: 0, total: 6 })]);
    expect(result).toMatchObject({ cleanPages: 1, shown: 0, findings: 6 });
  });

  it('gives zeroes rather than NaN when nothing is comparable', () => {
    const result = summariseReports([report(false, {}, { shown: 0, total: 0 })]);
    expect(result).toMatchObject({ crawled: 1, comparable: 0, medianShown: 0, medianTotal: 0 });
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
