import { describe, expect, it } from 'vitest';

import { comparePage, newSitePathsFor, skipReason } from './30-compare.mjs';
import { FindingCollector, median, summarise, summariseReports } from './findings.mjs';
import { compareImages, IMAGE_CAMPAIGN } from './images.mjs';
import { compareLinks } from './links.mjs';
import { locationUrl, textFragmentUrl, unitLocation } from './locate.mjs';
import { lcsPairs, mayPair, maskNumbers, similarity, tier2 } from './match.mjs';
import { metaRows } from './meta.mjs';
import { classifyPair, diffRows, textFindings } from './text.mjs';
import { diffCost, isUncompared, spansFor, wordDiff } from './worddiff.mjs';

let seq = 0;

/**
 * @param {string} raw
 * @param {Partial<import('./contract.mjs').ContentUnit>} [overrides]
 */
function unit(raw, overrides = {}) {
  // The `kind` below reads the tag, and the extractor reads the content: after
  // ticket 67 a `<p>` that holds nothing but one anchor is a `cta` too. There is no
  // DOM here to ask, so a test that needs that shape passes `kind` itself.
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
function units(texts) {
  seq = 0;
  return texts.map((text) => unit(text));
}

/** @param {Array<[string, string]>} spec `[raw, tag]`, in document order. */
function outline(spec) {
  seq = 0;
  return spec.map(([raw, tag]) => unit(raw, { tag }));
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
    expect(
      similarity(
        'Onze terrasoverkapping wordt gratis bij u thuis bezorgd',
        'Onze terrasoverkapping wordt gratis thuis bezorgd',
      ),
    ).toBeGreaterThan(0.6);
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
  it('does not cascade an insertion into every later unit', () => {
    const left = units(['een', 'twee', 'drie']);
    const right = units(['een', 'nieuw', 'twee', 'drie']);
    expect(lcsPairs(left, right).length).toBe(3);
  });
});

describe('mayPair', () => {
  it('refuses two headings of a different level', () => {
    expect(mayPair(unit('Kleuren', { tag: 'h2' }), unit('Kleuren', { tag: 'h3' }))).toBe(false);
  });

  it('refuses a heading against a button label', () => {
    expect(mayPair(unit('Kleuren', { tag: 'h2' }), unit('Kleuren', { tag: 'button' }))).toBe(false);
  });

  it('permits a call to action against a block that is not wholly one link', () => {
    // Ticket 67. Production wraps `Lees meer >` in a `<p>` and leaves the arrow
    // outside the anchor, so the block is not wholly one link and reads `text`.
    // The new site keeps a bare `<a>`, which reads `cta`. The kind now records
    // how the unit is wrapped, and a wrapper is not an editorial fact. Refusing
    // this pair made one `copy` row into two one-sided rows.
    expect(mayPair(unit('Lees meer >', { tag: 'p' }), unit('Lees meer >', { tag: 'a' }))).toBe(
      true,
    );
  });
});

describe('classifyPair', () => {
  it('calls a case-only difference casing, not copy', () => {
    expect(classifyPair(unit('Stijl Modern of Klassiek'), unit('Stijl modern of klassiek'))).toBe(
      'casing',
    );
  });

  it('calls a trailing full stop casing', () => {
    expect(classifyPair(unit('Gratis bezorging'), unit('Gratis bezorging.'))).toBe('casing');
  });

  it('calls a number-only difference price', () => {
    expect(classifyPair(unit('Vanaf € 799'), unit('Vanaf € 849'))).toBe('price');
  });

  it('needs the promotional pattern on both sides', () => {
    // The prototype matched the two sides joined, so one keyword was enough and
    // `Bekijk alle deals` → `Bekijk alle FAQs` was hidden as a campaign. It is a
    // real CTA change.
    expect(classifyPair(unit('Bekijk alle deals'), unit('Bekijk alle FAQs'))).toBe('copy');
    expect(
      classifyPair(
        unit('Nu 10% korting op alle overkappingen'),
        unit('Nu 15% korting op alle overkappingen en zonwering'),
      ),
    ).toBe('campaign');
  });

  it('does not hide a wrong value in a table cell', () => {
    // The old rule was "the tag is td or th", which hid every specification
    // defect. The tag must differ across the sides, so two `td` cells that
    // disagree stay visible as `copy`.
    expect(
      classifyPair(
        unit('Dakdikte 16 mm gehard glas', { tag: 'td' }),
        unit('Dakdikte 8 mm gehard glas', { tag: 'td' }),
      ),
    ).toBe('price');
    expect(
      classifyPair(
        unit('Dakdikte gehard glas', { tag: 'td' }),
        unit('Dakdikte gelaagd glas', { tag: 'td' }),
      ),
    ).toBe('copy');
  });

  it('calls the same content in a moved unit restructured', () => {
    expect(
      classifyPair(
        unit('Verkrijgbaar in RAL 7016 antraciet', { tag: 'p' }),
        unit('Verkrijgbaar in RAL 7016 antracietgrijs', { tag: 'td' }),
      ),
    ).toBe('restructured');
  });

  it('names no class for two texts that are equal character for character', () => {
    // Ticket 62. `casing` was the first test, so a pair the matching left over
    // with identical text was asked to name a difference that does not exist.
    const text = 'Download de montagehandleiding';
    expect(classifyPair(unit(text), unit(text))).toBe(null);
  });

  it('still reads the moved unit on two texts that are equal', () => {
    // Only `tag-changed`. `mayPair` holds a leftover pair to one heading level,
    // so no heading reaches this rule against a paragraph.
    const text = 'Download de montagehandleiding';
    expect(classifyPair(unit(text, { tag: 'p' }), unit(text, { tag: 'td' }))).toBe('tag-changed');
  });
});

describe('diffRows', () => {
  const production = extract({
    elements: units(['Overkappingen', 'Gratis bezorging', 'Onze prijzen zijn scherp']),
  });
  const next = extract({
    side: 'new',
    elements: units([
      'Overkappingen',
      'Gratis bezorging',
      'Onze prijzen zijn heel scherp',
      'Nieuw blok',
    ]),
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

  it('reports unchanged text that moved into another unit', () => {
    // Before ticket 33 the LCS anchored on `norm` alone and this was an exact
    // match that emitted nothing. 762 units on 80 nl pages were reported as
    // identical while their unit had changed.
    const rows = diffRows(
      extract({ elements: [unit('Verkrijgbaar in RAL 7016', { tag: 'p' })] }),
      extract({ side: 'new', elements: [unit('Verkrijgbaar in RAL 7016', { tag: 'td' })] }),
    );
    expect(rows.map((row) => row.class)).toEqual(['tag-changed']);
  });

  it('gives a call to action that is wrapped on one side only one row', () => {
    // Ticket 67. Production folds `Lees meer >` into a `<p>` and leaves the arrow
    // outside the anchor, so the block reads `text`; the new site keeps a bare
    // `<a>`, which reads `cta`. While the kinds had to be equal to pair, this was
    // one loss and one addition, and the reader had to find the two halves.
    const rows = diffRows(
      extract({ elements: [unit('Lees meer > over onze carports', { tag: 'p' })] }),
      extract({ side: 'new', elements: [unit('Lees meer over onze carports', { tag: 'a' })] }),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].class).toBe('restructured');
    expect(rows[0].prod?.raw).toBe('Lees meer > over onze carports');
    expect(rows[0].new?.raw).toBe('Lees meer over onze carports');
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
  // documents are about the same length, and on `fotogalerij` production holds 163
  // content units against the new site's 47 (2026-08-10, after the fold).
  const LONG = [
    'Overkappingen',
    'Aluminium profielen',
    'Glazen dak',
    'Zonwering',
    'Montage',
    'Levertijd',
    'Garantie',
    'Kleuren en RAL',
    'Onderhoud',
    'Contact',
  ];

  it('anchors a new-only row to the production position of the nearest matched pair', () => {
    const rows = diffRows(
      extract({ elements: units(LONG) }),
      extract({ side: 'new', elements: units(['Kleuren en RAL', 'Nieuw fotoblok', 'Onderhoud']) }),
    );

    // Under the old rule the addition carried new index 1 and landed second, six
    // paragraphs above the content it follows.
    expect(rows.map((row) => row.prod?.raw ?? `+${row.new?.raw}`)).toEqual([
      ...LONG.slice(0, 8),
      '+Nieuw fotoblok',
      ...LONG.slice(8),
    ]);
  });

  it('puts a new-only row above the first agreement, not at the top of the page', () => {
    const rows = diffRows(
      extract({ elements: units(LONG) }),
      extract({ side: 'new', elements: units(['Nieuw fotoblok', 'Kleuren en RAL']) }),
    );
    expect(rows.map((row) => row.prod?.raw ?? `+${row.new?.raw}`)).toEqual([
      ...LONG.slice(0, 7),
      '+Nieuw fotoblok',
      ...LONG.slice(7),
    ]);
  });

  it('reads a page the two sides agree nowhere on as production first, then the new site', () => {
    const rows = diffRows(
      extract({ elements: units(['Overkappingen', 'Aluminium profielen']) }),
      extract({ side: 'new', elements: units(['Nieuw fotoblok', 'Tweede fotoblok']) }),
    );
    expect(rows.map((row) => row.prod?.raw ?? `+${row.new?.raw}`)).toEqual([
      'Overkappingen',
      'Aluminium profielen',
      '+Nieuw fotoblok',
      '+Tweede fotoblok',
    ]);
  });

  it('holds that order when the page is long enough to sort by merge', () => {
    // The agree-nowhere rows all claim one base position, so the comparator
    // decides between them on the new-document index alone. Twelve rows put the
    // sort past the insertion-sort threshold, where an inconsistent comparator
    // stops being harmless.
    const additions = Array.from({ length: 12 }, (_, index) => `Fotoblok ${index}`);
    const rows = diffRows(
      extract({ elements: units(['Overkappingen', 'Aluminium profielen']) }),
      extract({ side: 'new', elements: units(additions) }),
    );
    expect(rows.map((row) => row.prod?.raw ?? `+${row.new?.raw}`)).toEqual([
      'Overkappingen',
      'Aluminium profielen',
      ...additions.map((raw) => `+${raw}`),
    ]);
  });

  it('keeps two additions after one pair in the order the new site has them', () => {
    const rows = diffRows(
      extract({ elements: units(LONG) }),
      extract({
        side: 'new',
        elements: units(['Kleuren en RAL', 'Eerste fotoblok', 'Tweede fotoblok']),
      }),
    );
    expect(rows.slice(8, 10).map((row) => row.new?.raw)).toEqual([
      'Eerste fotoblok',
      'Tweede fotoblok',
    ]);
  });

  /** @param {string} prodTag @param {string} newTag */
  function samePairedText(prodTag, newTag) {
    const text = 'Kleuren en afwerking';
    const rows = diffRows(
      extract({ elements: [unit(text, { tag: prodTag })] }),
      extract({ side: 'new', elements: [unit(text, { tag: newTag })] }),
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

  it('parks a tag change between two non-headings as a diagnostic', () => {
    expect(samePairedText('p', 'div')).toEqual(['tag-changed']);
    expect(samePairedText('li', 'p')).toEqual(['tag-changed']);
  });

  it('keeps the same text in the same tag an exact match that emits nothing', () => {
    expect(samePairedText('p', 'p')).toEqual([null]);
    expect(samePairedText('h2', 'h2')).toEqual([null]);

    const findings = collect((collector) =>
      textFindings(
        diffRows(
          extract({ elements: [unit('Kleuren', { tag: 'h2' })] }),
          extract({ side: 'new', elements: [unit('Kleuren', { tag: 'h2' })] }),
        ),
        collector,
      ),
    );
    expect(findings).toEqual([]);
  });

  it('makes no finding when the same line repeats in another order', () => {
    // Ticket 62, the `/downloads` defect. The LCS keeps document order, so a
    // reorder of identical links leaves one copy unmatched on **both** sides.
    // The leftovers then pair at score 1.0, and the classifier called that
    // `casing` — a difference between two strings that are equal.
    const link = 'Download de montagehandleiding';
    const rows = diffRows(
      extract({ elements: units([link, 'Zonwering', link]) }),
      extract({ side: 'new', elements: units([link, link, 'Zonwering']) }),
    );
    expect(rows.map((row) => row.class)).toEqual([null, null, null]);
    expect(collect((collector) => textFindings(rows, collector))).toEqual([]);
  });

  it('still reports the moved unit when the repeated line changed tag', () => {
    // The other half of ticket 62: 40 of the 391 phantom `casing` findings are
    // this row. The words are equal; the markup is not, and the finding carries
    // the tag change as its detail.
    const link = 'Download de montagehandleiding';
    const rows = diffRows(
      extract({ elements: [unit(link), unit('Zonwering'), unit(link)] }),
      extract({
        side: 'new',
        elements: [unit(link), unit(link, { tag: 'div' }), unit('Zonwering')],
      }),
    );
    expect(rows.map((row) => row.class)).toEqual([null, null, 'tag-changed']);
    expect(collect((collector) => textFindings(rows, collector))).toMatchObject([
      { class: 'tag-changed', prod: link, new: link, detail: 'p → div' },
    ]);
  });

  it('splits a one-sided unit by direction', () => {
    // Ticket 33 retires `structure`. A dropped paragraph and an invented one
    // carried the same word, and the invented side is mostly a PageBuilder
    // rebuild rather than a defect.
    const rows = diffRows(
      extract({ elements: units(['Wij leveren door heel Nederland']) }),
      extract({ side: 'new', elements: units(['Bekijk onze showrooms in de buurt']) }),
    );
    expect(rows.map((row) => row.class).sort()).toEqual(['text-added', 'text-missing']);
    expect(rows.find((row) => row.class === 'text-missing')?.new).toBe(null);
    expect(rows.find((row) => row.class === 'text-added')?.prod).toBe(null);
  });
});

// --- ticket 116: the same words, divided differently

/**
 * `nl/proefpakket/succes`, the case ADR 0012 was written from and this ticket's demo.
 * Production sends two paragraphs and the new site sends one paragraph holding both, in
 * order, unchanged. The corpus units are 42 and 22 tokens against the merged 64; they are
 * shortened here, and what a shorter version has to keep is the seam and the fact that the
 * **first member alone** already scores above `PAIR_THRESHOLD` against the merged unit —
 * 0.67 here, 0.84 on the page. That is why the pass has to run ahead of the greedy matcher.
 */
const THANKS = 'Bedankt voor het aanvragen van een samplepakket';
const BOX = 'Het pakket past door de gemiddelde brievenbus';
const MERGED = `${THANKS} ${BOX}`;

/**
 * @param {string[]} prodTexts
 * @param {string[]} newTexts
 */
const rowsOf = (prodTexts, newTexts) =>
  diffRows(
    extract({ elements: units(prodTexts) }),
    extract({ side: 'new', elements: units(newTexts) }),
  );

/** @param {import('./text.mjs').AlignedRow[]} rows */
const classesOf = (rows) => rows.map((row) => row.class);

describe('a merged paragraph', () => {
  it('is one row, and not a false copy beside a false loss', () => {
    // Today's log shows `COPY 0.84` and `TEXT-MISSING` on this page, and both are false:
    // no word was edited and no word was lost. The greedy matcher would claim
    // `THANKS ↔ MERGED` at 0.67 and the run would be gone before the exact test ran, so
    // this assertion is also the proof that the pass sits ahead of it.
    expect(classesOf(rowsOf([THANKS, BOX], [MERGED]))).toEqual(['regrouped']);
  });

  it('holds the whole run on the left and sits at its first unit', () => {
    const [row] = rowsOf([THANKS, BOX], [MERGED]);
    expect(row.prodRun?.map((one) => one.raw)).toEqual([THANKS, BOX]);
    expect(row.prod?.raw).toBe(THANKS);
    expect(row.new?.raw).toBe(MERGED);
  });

  it('reads in production document order, at the first unit of the run', () => {
    const rows = rowsOf(
      ['Bedankt voor uw aanvraag', THANKS, BOX, 'Terug naar de homepage'],
      ['Bedankt voor uw aanvraag', MERGED, 'Terug naar de homepage'],
    );
    expect(classesOf(rows)).toEqual([null, 'regrouped', null]);
  });

  it('accepts a heading as a member of the run', () => {
    // `be/laagste-prijs-garantie` merges a heading and the paragraph after it. Ticket 121
    // owns the heading jump-list consequence; this ticket must not add the rule that
    // would forbid the case before 121 can have it.
    const [row] = diffRows(
      extract({
        elements: [unit('Waarom kiest u voor Tuinmaximaal', { tag: 'h2' }), unit(BOX)],
      }),
      extract({ side: 'new', elements: units([`Waarom kiest u voor Tuinmaximaal ${BOX}`]) }),
    );
    expect(row.class).toBe('regrouped');
    expect(row.prodRun).toHaveLength(2);
  });

  it('refuses a merge the new site did not cover completely', () => {
    // The criterion that matters most. Production's `/fr/avantages` block ends with a
    // sentence about aluminium that the new site drops — 16 tokens of lost copy — and
    // containment would have called that `regrouped`, which is `information` and
    // undecidable. Total coverage keeps it a finding somebody has to decide.
    const kept = `${THANKS} Het pakket past door de brievenbus`;
    expect(classesOf(rowsOf([THANKS, BOX], [kept]))).not.toContain('regrouped');
  });

  it('keeps a merge that added a word a copy', () => {
    const andMore = `${MERGED} altijd`;
    const rows = classesOf(rowsOf([THANKS, BOX], [andMore]));
    expect(rows).toContain('copy');
    expect(rows).not.toContain('regrouped');
  });

  it('refuses a pair that differs by a trailing token', () => {
    // `"… exacte prijs"` inside `"… exacte prijs >"` is the trailing-token noise editors
    // dismiss by hand, and 38 of 100 candidates under an early looser rule were this. Two
    // guards refuse it independently: the leftover token fails total coverage, and one
    // unit is not a run of two.
    const rows = rowsOf(['Bekijk hier de exacte prijs'], ['Bekijk hier de exacte prijs >']);
    expect(classesOf(rows)).toEqual(['copy']);
  });

  it('refuses a run holding a member of under four tokens', () => {
    const short = 'Kleuren en afwerking';
    expect(classesOf(rowsOf([short, BOX], [`${short} ${BOX}`]))).not.toContain('regrouped');
  });

  it('refuses a run the new site interrupted', () => {
    // A run is adjacent and uninterrupted in production's document order. The paragraph
    // between the two members is matched in place, so the two are not a run — whatever
    // their text does when it is joined.
    const between = 'Wij gaan direct aan de slag';
    const rows = rowsOf([THANKS, between, BOX], [between, MERGED]);
    expect(classesOf(rows)).not.toContain('regrouped');
  });

  it('refuses a run whose member another block on the new site claims', () => {
    // ADR 0012's third guard, and the corpus names the page:
    // `de/(de)shading-panel/produktinformationen` sends its two height rows both as
    // themselves and as one joined block. The run covers the joined block exactly, and
    // taking it would leave the two blocks that hold the same words with no counterpart, so
    // the page would say the words were regrouped and invented at once. A member has to be
    // unspoken-for.
    const variant = 'Het pakket past door de gemiddelde bus';
    const rows = classesOf(rowsOf([THANKS, BOX], [MERGED, variant]));
    expect(rows).not.toContain('regrouped');
    expect(rows).not.toContain('text-added');
  });

  it('refuses a run of five members', () => {
    // The cap of four is free today — the corpus holds no five-member exact coverage — and
    // it is what makes a row a reader can verify at a glance.
    const five = [
      'Bedankt voor het aanvragen',
      'van een gratis samplepakket',
      'Wij gaan direct aan de slag',
      'Het pakket past door de brievenbus',
      'U hoeft er niet voor thuis te blijven',
    ];
    expect(classesOf(rowsOf(five, [five.join(' ')]))).not.toContain('regrouped');
  });
});

describe('a merged paragraph as a finding', () => {
  /**
   * @param {string[]} prodTexts
   * @param {string[]} newTexts
   */
  const findingsOf = (prodTexts, newTexts) =>
    collect((collector) => textFindings(rowsOf(prodTexts, newTexts), collector));

  it('carries the shape as its detail and no score', () => {
    // The score belongs to `copy`, which is the class that claims two texts are the same
    // content edited. Nothing here was edited.
    expect(findingsOf([THANKS, BOX], [MERGED])).toMatchObject([
      { class: 'regrouped', detail: 'p + p → p', score: null },
    ]);
  });

  it('names the tag of every member in the shape', () => {
    const [finding] = collect((collector) =>
      textFindings(
        diffRows(
          extract({ elements: [unit(THANKS, { tag: 'h3' }), unit(BOX)] }),
          extract({ side: 'new', elements: units([`${THANKS} ${BOX}`]) }),
        ),
        collector,
      ),
    );
    expect(finding.detail).toBe('h3 + p → p');
  });

  it('keys the finding on the whole run, so an edit to any member expires it', () => {
    // ADR 0004: a key built from the first member only would carry an editor's judgement
    // across an edit to the second, silently. This is the same join the coverage test
    // compared.
    const [finding] = findingsOf([THANKS, BOX], [MERGED]);
    expect(finding.prod).toBe(MERGED);
    expect(finding.new).toBe(MERGED);
  });

  it('keeps a finding id, and counts nowhere', () => {
    // `Landing` needs an id: the row is a finding an editor can link to and cannot decide.
    const findings = findingsOf([THANKS, BOX], [MERGED]);
    expect(findings[0].id).toMatch(/^[A-Za-z0-9_-]{16}$/);
    expect(summarise(findings)).toMatchObject({ work: 0, information: 1, total: 1 });
  });
});

describe('textFindings', () => {
  it('counts one rename repeated four times as one finding', () => {
    const before = 'Verkrijgbaar in de volgende kleuren';
    const after = 'Verkrijgbaar in deze kleuren';
    const production = extract({ elements: units([before, before, before, before]) });
    const next = extract({ side: 'new', elements: units([after, after, after, after]) });

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
    const production = extract({
      elements: units(['Kleuren:', 'Kleuren:', 'Kleuren:', 'Kleuren:']),
    });
    const label = 'Verkrijgbaar in de volgende kleuren:';
    const next = extract({ side: 'new', elements: units([label, label, label, label]) });

    const findings = collect((collector) => textFindings(diffRows(production, next), collector));
    expect(findings.map((finding) => [finding.class, finding.occurrences])).toEqual([
      ['text-missing', 4],
      ['text-added', 4],
    ]);
  });

  it('leaves the invented side out of the work count', () => {
    // Ticket 33: `text-added` does not count, so a PageBuilder rebuild cannot bury
    // the content that was actually lost. Ticket 75 named what it is instead —
    // `information`, drawn and not counted — and moved neither number.
    const findings = collect((collector) =>
      textFindings(
        diffRows(
          extract({ elements: units(['Wij leveren door heel Nederland']) }),
          extract({ side: 'new', elements: units(['Bekijk onze showrooms in de buurt']) }),
        ),
        collector,
      ),
    );
    expect(summarise(findings)).toMatchObject({ work: 1, information: 1, total: 2 });
  });

  it('says what changed when the two sides of text are equal', () => {
    // Without a detail the record reads `prod` and `new` as the same string, so
    // the finding says "identical" about a finding.
    const text = 'Kleuren en afwerking';
    const findings = collect((collector) =>
      textFindings(
        diffRows(
          extract({ elements: [unit(text, { tag: 'h2' })] }),
          extract({ side: 'new', elements: [unit(text, { tag: 'h3' })] }),
        ),
        collector,
      ),
    );
    expect(findings.map((finding) => [finding.class, finding.detail])).toEqual([
      ['heading-level', 'h2 → h3'],
    ]);
  });

  it('separates two demotions of the same words, so a worse one detaches', () => {
    const text = 'Kleuren en afwerking';
    /** @param {string} newTag */
    const idFor = (newTag) =>
      collect((collector) =>
        textFindings(
          diffRows(
            extract({ elements: [unit(text, { tag: 'h2' })] }),
            extract({ side: 'new', elements: [unit(text, { tag: newTag })] }),
          ),
          collector,
        ),
      )[0].id;
    expect(idFor('h3')).not.toBe(idFor('h4'));
  });

  it('carries no detail on a class whose two sides already differ', () => {
    const findings = collect((collector) =>
      textFindings(
        diffRows(
          extract({ elements: units(['Vanaf € 799']) }),
          extract({ side: 'new', elements: units(['Vanaf € 849']) }),
        ),
        collector,
      ),
    );
    expect(findings.map((finding) => [finding.class, finding.detail])).toEqual([['price', null]]);
  });

  it('groups two occurrences of one demotion into one finding', () => {
    const text = 'Kleuren en afwerking';
    const findings = collect((collector) =>
      textFindings(
        diffRows(
          extract({ elements: [unit(text, { tag: 'h2' }), unit(text, { tag: 'h2' })] }),
          extract({
            side: 'new',
            elements: [unit(text, { tag: 'h3' }), unit(text, { tag: 'h3' })],
          }),
        ),
        collector,
      ),
    );
    expect(findings.map((finding) => [finding.class, finding.occurrences])).toEqual([
      ['heading-level', 2],
    ]);
  });

  it('gives every occurrence one id, so the count cannot detach a dismissal', () => {
    const production = extract({ elements: units(['Kleuren:', 'Kleuren:']) });
    const next = extract({ side: 'new', elements: units(['Kleur:', 'Kleur:']) });
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
  const self = ['www.tuinmaximaal.nl', 'm2stagingnl.intern.systems'].includes(parsed.host);
  return {
    index: overrides.index ?? 0,
    href: url,
    url,
    key:
      overrides.key ??
      `${self ? 'self' : parsed.host}${parsed.pathname.toLowerCase().replace(/\/+$/, '')}`,
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
  const labels = (spans) => spans.map((span) => `${span.type}:${span.text}`);

  it('gives two identical strings one unchanged span', () => {
    expect(wordDiff('Gratis bezorging', 'Gratis bezorging')).toEqual([
      { type: 'same', text: 'Gratis bezorging' },
    ]);
  });

  it('gives a one-word substitution exactly one removed and one added span', () => {
    const spans = wordDiff(
      'Onze terrasoverkapping wordt gratis bezorgd',
      'Onze terrasoverkapping wordt snel bezorgd',
    );
    expect(spans.filter((span) => span.type === 'removed')).toEqual([
      { type: 'removed', text: 'gratis' },
    ]);
    expect(spans.filter((span) => span.type === 'added')).toEqual([
      { type: 'added', text: 'snel' },
    ]);
  });

  it('keeps the unchanged words around a substitution in place', () => {
    expect(labels(wordDiff('een twee drie', 'een vier drie'))).toEqual([
      'same:een ',
      'removed:twee',
      'added:vier',
      'same: drie',
    ]);
  });

  it('reports an insertion at the head', () => {
    expect(labels(wordDiff('twee drie', 'een twee drie'))).toEqual([
      'added:een ',
      'same:twee drie',
    ]);
  });

  it('reports an insertion at the tail', () => {
    expect(labels(wordDiff('een twee', 'een twee drie'))).toEqual(['same:een twee', 'added: drie']);
  });

  it('picks out the changed segment of a link target', () => {
    // The reason the four surfaces share one component: two link keys are two
    // word lists, and this is what makes a changed path segment jump out
    // instead of reading as "the whole target changed".
    expect(labels(wordDiff('self/overkappingen/veranda', 'self/overkappingen/tuinkamer'))).toEqual([
      'same:self/overkappingen/',
      'removed:veranda',
      'added:tuinkamer',
    ]);
  });

  it('reproduces each side exactly when its spans are joined', () => {
    // The renderer never puts a separator back, so the spans must carry every
    // one. Anything else silently rewrites what production said.
    const prod = 'Verkrijgbaar in de volgende kleuren:';
    const next = 'Beschikbare kleuren:';
    const spans = wordDiff(prod, next);
    const join = (side) =>
      spansFor(spans, side)
        .map((span) => span.text)
        .join('');
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
    expect(labels(wordDiff('Onze terrasoverkapping', 'Onze tuinoverkapping'))).toEqual([
      'same:Onze ',
      'removed:terrasoverkapping',
      'added:tuinoverkapping',
    ]);
  });

  it('shows each side only its own words', () => {
    const spans = wordDiff('een twee drie', 'een vier drie');
    expect(labels(spansFor(spans, 'production'))).toEqual([
      'same:een ',
      'removed:twee',
      'same: drie',
    ]);
    expect(labels(spansFor(spans, 'new'))).toEqual(['same:een ', 'added:vier', 'same: drie']);
  });

  it('merges neighbouring words of the same kind into one span', () => {
    // Two removed words in a row are one edit to a reader, so they are one
    // highlight and not two boxes with a gap between them.
    expect(labels(wordDiff('een twee drie vier', 'een vier'))).toEqual([
      'same:een ',
      'removed:twee drie ',
      'same:vier',
    ]);
  });
});

/**
 * The trim and the cap (ticket 68, ADR 0009). After ticket 67 a row holds a whole
 * block, so a 1,250-character paragraph is one cell pair and the table over its
 * tokens is what the content view costs.
 */
describe('the word diff trims and caps', () => {
  it('costs almost nothing when one word changed in a long paragraph', () => {
    const body = Array.from({ length: 200 }, (_, at) => `woord${at}`).join(' ');

    // Untrimmed this is 400 × 400 cells. Both sides agree on all of it but one
    // token, and that token is the only work the diff has.
    expect(diffCost(`${body} slot`, `${body} einde`)).toEqual({
      n: 1,
      m: 1,
      cells: 1,
      capped: false,
    });
  });

  it('gives the spans the untrimmed diff gives, token for token', () => {
    // **The test that lets the trim be trusted.** A trim that moves a span is a
    // second opinion about the content, and the eleven tests above would not see
    // it. The reference is the implementation from before the trim, kept in this
    // file, and the pairs are generated with a shared head, a shared tail and a
    // changed middle, which is the shape the trim exists for. The generator is
    // seeded: a guard that passes on one seed and fails on the next guards
    // nothing.
    //
    // No word repeats inside one side. That is the condition under which the two
    // are provably equal — see the test below, which holds the case where it does
    // repeat.
    for (const [prod, next] of tiePairs(500)) {
      expect(wordDiff(prod, next), `${prod} / ${next}`).toEqual(untrimmedWordDiff(prod, next));
    }
  });

  it('agrees as much as it can when one word appears twice in a side', () => {
    // **The limit of the equivalence, found by the test above.** A word that
    // appears twice gives two alignments of the same length, and the trim takes
    // the later one where the untrimmed walk took the earlier: on `de` against
    // `kap de zwart kap de kap de`, both call one `de` shared and they disagree
    // about which one. Neither reading is better and neither loses a word.
    //
    // So the two properties that carry the meaning are asserted instead, over
    // pairs built from five words that repeat constantly. **The diff stays
    // optimal** — the same number of words is called shared, so the trim never
    // reports a change the untrimmed diff did not — and **each side still rejoins
    // to its own input**.
    const sameWords = (spans) =>
      spans
        .filter((span) => span.type === 'same')
        .reduce((count, span) => count + (span.text.match(/\S+/g) ?? []).length, 0);

    for (const [prod, next] of repeatingPairs(500)) {
      const spans = wordDiff(prod, next);
      const note = `${prod} / ${next}`;

      expect(sameWords(spans), note).toBe(sameWords(untrimmedWordDiff(prod, next)));
      expect(
        spansFor(spans, 'production')
          .map((span) => span.text)
          .join(''),
        note,
      ).toBe(prod);
      expect(
        spansFor(spans, 'new')
          .map((span) => span.text)
          .join(''),
        note,
      ).toBe(next);
    }
  });

  it('keeps an identical prefix and suffix as one span each', () => {
    expect(wordDiff('de kap is zwart en mooi', 'de kap is wit en mooi')).toEqual([
      { type: 'same', text: 'de kap is ' },
      { type: 'removed', text: 'zwart' },
      { type: 'added', text: 'wit' },
      { type: 'same', text: ' en mooi' },
    ]);
  });

  it('reports one side that is a strict prefix of the other as one addition', () => {
    expect(wordDiff('de kap', 'de kap is zwart')).toEqual([
      { type: 'same', text: 'de kap' },
      { type: 'added', text: ' is zwart' },
    ]);
  });

  it('compares a pair just under the cap', () => {
    // 112 words a side is 223 tokens and 49,729 cells. One word fewer than the
    // test below, and the whole comparison runs.
    const [prod, next] = wordsApart(112);
    expect(diffCost(prod, next)).toEqual({ n: 223, m: 223, cells: 49_729, capped: false });

    // Every word differs and every space is shared, so a compared pair reads as
    // 112 losses and 112 additions between them.
    const spans = wordDiff(prod, next);
    expect(spans.filter((span) => span.type === 'removed')).toHaveLength(112);
    expect(spans.filter((span) => span.type === 'added')).toHaveLength(112);
  });

  it('refuses a pair just over the cap and gives each side one span', () => {
    // 113 words a side is 225 tokens a side and 50,625 cells. The cell is
    // uncompared: both texts in full, and nothing about the content is claimed.
    const [prod, next] = wordsApart(113);
    expect(diffCost(prod, next).cells).toBe(50_625);
    expect(wordDiff(prod, next)).toEqual([
      { type: 'uncompared', text: prod },
      { type: 'uncompared', text: next },
    ]);
  });

  it('never allocates the table for a pair far over the cap', () => {
    // Asserted by input size, never by a clock. 3,000 words a side is 36 million
    // cells, which is 144 MB of `Int32Array` for one cell pair. A run that
    // allocates it does not finish this test; a run that reads the cap first
    // returns two spans.
    const [prod, next] = wordsApart(3_000);
    expect(diffCost(prod, next).cells).toBe(35_988_001);
    expect(wordDiff(prod, next)).toHaveLength(2);
  });

  it('reads the cap after the trim and not before it', () => {
    // The cap is a budget over the work that is left. A long paragraph both sides
    // agree on is not too large to compare; it is already compared.
    const body = Array.from({ length: 3_000 }, (_, at) => `woord${at}`).join(' ');
    expect(diffCost(body, body)).toEqual({ n: 0, m: 0, cells: 0, capped: false });
    expect(wordDiff(body, body)).toEqual([{ type: 'same', text: body }]);
  });

  it('says of a span list whether the comparison ran', () => {
    // The renderer must not read the fourth type out of the array itself. A cell
    // that shows an uncompared pair shows both texts plain, and the question it
    // asks is this one.
    expect(isUncompared(wordDiff(...wordsApart(113)))).toBe(true);
    expect(isUncompared(wordDiff('de kap', 'de tuin'))).toBe(false);
    expect(isUncompared([])).toBe(false);
    expect(isUncompared(null)).toBe(false);
  });
});

/**
 * Two strings that share no word, so the trim removes nothing and `n · m` is the
 * whole product. One word and one separator run each, thus `2 · count - 1` tokens a
 * side.
 *
 * @param {number} count
 * @returns {[string, string]}
 */
function wordsApart(count) {
  return [
    Array.from({ length: count }, (_, at) => `woord${at}`).join(' '),
    Array.from({ length: count }, (_, at) => `ander${at}`).join(' '),
  ];
}

/**
 * Pairs over five words, so a word repeats in almost every one of them. This is the
 * corpus shape: Dutch prose reuses `de`, `en` and `van`, and every separator run is
 * one space.
 *
 * @param {number} count
 * @returns {[string, string][]}
 */
function repeatingPairs(count) {
  const words = ['de', 'kap', 'zwart', 'wit', 'groot'];
  let seed = 12_345;
  const step = () => (seed = (seed * 1_103_515 + 12_345) % 2_147_483_648);
  const sentence = () =>
    Array.from({ length: step() % 9 }, () => words[step() % words.length]).join(' ');

  return Array.from({ length: count }, () => [sentence(), sentence()]);
}

/**
 * Pairs with a shared head, a changed middle and a shared tail, and **no word twice
 * inside one side**. Every word is unique, so the two sides can be aligned in one
 * best way only.
 *
 * @param {number} count
 * @returns {[string, string][]}
 */
function tiePairs(count) {
  let seed = 12_345;
  const step = () => (seed = (seed * 1_103_515 + 12_345) % 2_147_483_648);

  let word = 0;
  const run = (length) => Array.from({ length }, () => `woord${word++}`);

  return Array.from({ length: count }, () => {
    const head = run(step() % 5);
    const tail = run(step() % 5);
    const left = run(step() % 4);
    const right = run(step() % 4);
    return [[...head, ...left, ...tail].join(' '), [...head, ...right, ...tail].join(' ')];
  });
}

/**
 * `wordDiff` as it was before ticket 68: one table over every token of both sides,
 * no edges removed and no cap. It exists so that the trim has something to be equal
 * to. It is a test fixture and never an export.
 *
 * @param {string | null} prod @param {string | null} next
 */
function untrimmedWordDiff(prod, next) {
  const split = (text) => (text ?? '').match(/[\s/?&=#]+|[^\s/?&=#]+/g) ?? [];
  const left = split(prod);
  const right = split(next);

  const spans = [];
  const push = (type, token) => {
    const last = spans.at(-1);
    if (last?.type === type) last.text += token;
    else spans.push({ type, text: token });
  };

  const n = left.length;
  const m = right.length;
  const table = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[i][j] =
        left[i] === right[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (left[i] === right[j]) {
      push('same', left[i]);
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      push('removed', left[i]);
      i += 1;
    } else {
      push('added', right[j]);
      j += 1;
    }
  }
  while (i < n) push('removed', left[i++]);
  while (j < m) push('added', right[j++]);
  return spans;
}

const newUrl = 'https://m2stagingnl.intern.systems/overkappingen';

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
    expect(rows({}, {}).map((each) => each.field)).toEqual([
      'title',
      'description',
      'canonical',
      'noindex',
    ]);
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
    const findings = collect((collector) =>
      compareLinks({
        production,
        new: next,
        collector,
        newSitePaths: new Set(['/garantie']),
      }),
    );

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
    const findings = collect((collector) =>
      compareLinks({ production: extract({}), new: next, collector }),
    );
    expect(findings.some((f) => f.class === 'cross-store-link')).toBe(true);
  });

  it('reports a retargeted anchor once, not as a missing plus an extra link', () => {
    const production = extract({
      links: [link('https://www.tuinmaximaal.nl/carport', 'Bekijk carports')],
    });
    const next = extract({
      side: 'new',
      url: newUrl,
      links: [link('https://m2stagingnl.intern.systems/carports', 'Bekijk carports')],
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
        link('https://m2stagingnl.intern.systems/a', 'Lees meer'),
        link('https://m2stagingnl.intern.systems/c', 'Lees meer'),
      ],
    });
    const findings = collect((collector) => compareLinks({ production, new: next, collector }));
    expect(findings.some((f) => f.class === 'link-target')).toBe(false);
    expect(findings.map((f) => f.class).sort()).toEqual(['extra-link', 'missing-link']);
  });

  it('fires broken-link even when production is broken too', () => {
    const target = 'https://m2stagingnl.intern.systems/weg';
    const next = extract({ side: 'new', url: newUrl, links: [link(target, 'Weg')] });
    const findings = collect((collector) =>
      compareLinks({
        production: extract({ links: [link('https://www.tuinmaximaal.nl/weg', 'Weg')] }),
        new: next,
        collector,
        statuses: new Map([
          [target, { status: 404, hops: 0 }],
          ['https://www.tuinmaximaal.nl/weg', { status: 404, hops: 0 }],
        ]),
      }),
    );
    expect(findings.some((f) => f.class === 'broken-link')).toBe(true);
  });

  it('does not guess about a broken link without a status map', () => {
    const next = extract({
      side: 'new',
      url: newUrl,
      links: [link('https://m2stagingnl.intern.systems/weg', 'Weg')],
    });
    const findings = collect((collector) =>
      compareLinks({ production: extract({}), new: next, collector }),
    );
    expect(findings.some((f) => f.class === 'broken-link')).toBe(false);
  });

  it('suppresses missing-link when production its own target is broken', () => {
    const target = 'https://www.tuinmaximaal.nl/weg';
    const findings = collect((collector) =>
      compareLinks({
        production: extract({ links: [link(target, 'Weg')] }),
        new: extract({ side: 'new', url: newUrl, links: [] }),
        collector,
        statuses: new Map([[target, { status: 404, hops: 0 }]]),
      }),
    );
    expect(findings.length).toBe(0);
  });

  it('deduplicates a target the page links eight times', () => {
    const production = extract({
      links: Array.from({ length: 8 }, () =>
        link('https://www.tuinmaximaal.nl/carport', 'Carport'),
      ),
    });
    const findings = collect((collector) =>
      compareLinks({
        production,
        new: extract({ side: 'new', url: newUrl, links: [] }),
        collector,
      }),
    );
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
    const findings = collect((collector) =>
      compareImages(
        extract({ images: [image('2026-07-23-kortingactie-nl-16aug.svg', '')] }),
        extract({ side: 'new', images: [] }),
        collector,
      ),
    );
    expect(findings.map((f) => f.class)).toEqual(['image-campaign']);
  });

  /**
   * Ticket 101: the class a production-only image of this key lands in. The
   * campaign rule is one-sided, so one key on one side is the whole input.
   *
   * @param {string} key
   */
  const soleClass = (key) =>
    collect((collector) =>
      compareImages(
        extract({ images: [image(key, '')] }),
        extract({ side: 'new', images: [] }),
        collector,
      ),
    )[0].class;

  it('reads a campaign word only where the filename has one, not inside another word', () => {
    // Ticket 89 §6's near-miss list, which is the input to ticket 101 and not a
    // list to re-derive. Every one of these matched before the boundary landed,
    // and on the corpus on disk they were the rule's entire output: 29 findings,
    // 29 collateral. `ideal-wero.svg` is the sharpest of them — a payment-provider
    // logo, hidden by a campaign rule.
    for (const key of [
      'ontwerp_je_ideale_overkapping.jpg',
      'ideal-wero.svg',
      'actie-updates_nl.jpg',
      'winactie-terrasverwarmer.jpg',
      'interactieve-configurator.png',
      'wholesale-partners.jpg',
      'idealisierend.jpg',
      'idealen.png',
      'antractiet.jpg',
      'salete.jpg',
      'dealing.png',
    ])
      expect(soleClass(key), key).toBe('image-missing');
  });

  it('hides campaign artwork whichever character separates the campaign word', () => {
    // The first two entries are the ones `\b` would wrongly drop — see the rule's own
    // comment for why. The plurals are the other half of that trap: campaign filenames.
    for (const key of [
      'summer_sale_2026.svg',
      'sales_uk.png',
      'deals-overzicht.jpg',
      '2026-07-23-kortingactie-nl-16aug.svg',
      'deal.svg',
      'black_friday_nl.jpg',
      'aanbieding-van-de-week.png',
    ])
      expect(soleClass(key), key).toBe('image-campaign');
  });

  it('applies the same rule to the new site its images', () => {
    const findings = collect((collector) =>
      compareImages(
        extract({ images: [] }),
        extract({
          side: 'new',
          images: [
            image('summer_sale_2026.svg', ''),
            image('ontwerp_je_ideale_overkapping.jpg', ''),
          ],
        }),
        collector,
      ),
    );
    expect(findings.map((f) => f.class)).toEqual(['image-campaign', 'image-added']);
  });

  it('carries no digit and no month, so it outlives the campaign it was written for', () => {
    // Ticket 90's constraint, in the shape `crawl/extract.test.mjs:919-926` enforces it
    // on the region entry. This one reads the pattern's text rather than its behaviour,
    // and that is the point: "names nothing dated" is a claim about what the rule says,
    // and no input observes it.
    //
    // Every dated thing a campaign filename carries — `2026`, `16aug`, a version suffix
    // — is a digit, and the vocabulary this rule needs has none. A month is the one
    // dated thing spellable without a digit, so it gets the second assertion. A campaign
    // *name* cannot be enumerated at all, which is why the digit rule carries the weight.
    expect(IMAGE_CAMPAIGN.source).not.toMatch(/\d/);
    expect(IMAGE_CAMPAIGN.source).not.toMatch(
      /januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december/i,
    );
  });

  it('leaves the alt path alone, campaign word or not', () => {
    // Structural, not measured: `IMAGE_CAMPAIGN` has no call site below the alt
    // comparison. This pins that, so moving the rule down there fails a test.
    const findings = collect((collector) =>
      compareImages(
        extract({ images: [image('summer_sale_2026.svg', 'Zomeractie')] }),
        extract({ side: 'new', images: [image('summer_sale_2026.svg', 'Sale')] }),
        collector,
      ),
    );
    expect(findings.map((f) => f.class)).toEqual(['alt-changed']);
  });

  it('reports a lost alt but not an empty alt on both sides', () => {
    const findings = collect((collector) =>
      compareImages(
        extract({ images: [image('dak.jpg', 'Glazen dak'), image('zij.jpg', '')] }),
        extract({ side: 'new', images: [image('dak.jpg', ''), image('zij.jpg', '')] }),
        collector,
      ),
    );
    expect(findings.map((f) => f.class)).toEqual(['alt-lost']);
  });

  it('is silent when the new site gains an alt production never had', () => {
    const findings = collect((collector) =>
      compareImages(
        extract({ images: [image('dak.jpg', null)] }),
        extract({ side: 'new', images: [image('dak.jpg', 'Glazen dak')] }),
        collector,
      ),
    );
    expect(findings.length).toBe(0);
  });

  it('sends a case-only alt difference to the shared casing class', () => {
    // Casing is one kind of difference and it gets one visibility decision. A separate
    // `alt-casing` would split that decision across two classes and let it drift.
    const findings = collect((collector) =>
      compareImages(
        extract({ images: [image('dak.jpg', 'Glazen Dak')] }),
        extract({ side: 'new', images: [image('dak.jpg', 'Glazen dak')] }),
        collector,
      ),
    );
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

  /** @param {import('./contract.mjs').ContentUnit[]} elements */
  const prod = (elements) => extract({ elements });

  it('names the nearest heading before the unit', () => {
    const next = outline([
      ['Onze overkappingen', 'h1'],
      ['Voor de eerste kop', 'p'],
      ['Kleuren en RAL', 'h2'],
      ['Antraciet en creme', 'p'],
      ['Montage', 'h2'],
      ['Wij monteren graag zelf', 'p'],
    ]);
    const findings = collect((collector) =>
      textFindings(diffRows(prod(PAGE), extract({ side: 'new', elements: next })), collector),
    );
    expect(findings.map((finding) => [finding.class, finding.anchorHeading])).toEqual([
      ['copy', 'Montage'],
    ]);
  });

  it('is null when the unit precedes every heading', () => {
    const findings = collect((collector) =>
      textFindings(
        diffRows(
          prod(
            outline([
              ['Kruimelpad naar de winkel', 'p'],
              ['Kleuren en RAL', 'h2'],
            ]),
          ),
          extract({ side: 'new', elements: outline([['Kleuren en RAL', 'h2']]) }),
        ),
        collector,
      ),
    );
    expect(findings.map((finding) => [finding.class, finding.anchorHeading])).toEqual([
      ['text-missing', null],
    ]);
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
    const findings = collect((collector) =>
      textFindings(diffRows(prod(PAGE), extract({ side: 'new', elements: after })), collector),
    );
    expect(findings.map((finding) => [finding.class, finding.anchorHeading])).toEqual([
      ['heading-level', 'Onze overkappingen'],
    ]);
  });

  it('falls back to the new site when the finding has no production side', () => {
    const next = outline([
      ['Kleuren en RAL', 'h2'],
      ['Ook in gepoedercoat wit', 'p'],
    ]);
    const findings = collect((collector) =>
      textFindings(
        diffRows(
          prod(outline([['Kleuren en RAL', 'h2']])),
          extract({ side: 'new', elements: next }),
        ),
        collector,
      ),
    );
    expect(findings.map((finding) => [finding.class, finding.anchorHeading])).toEqual([
      ['text-added', 'Kleuren en RAL'],
    ]);
  });

  // A row has two deep links and used to hold one heading, so whichever side did not
  // supply that heading got a link naming text that side does not have. A text
  // fragment that matches nothing scrolls nowhere and reports no error, so the row
  // looked identical to a working one until an editor clicked it.
  it('words the section as each side words it, so neither deep link is a dead one', () => {
    const before = outline([
      ['Kleuren en RAL', 'h2'],
      ['Antraciet en creme', 'p'],
    ]);
    const after = outline([
      ['Kleuren en kleurkeuze', 'h2'],
      ['Antraciet en cremewit', 'p'],
    ]);
    const findings = collect((collector) =>
      textFindings(diffRows(prod(before), extract({ side: 'new', elements: after })), collector),
    );

    const copy = findings.find(
      (finding) => finding.class === 'copy' && finding.prod === 'Antraciet en creme',
    );
    expect(copy.locations).toEqual({
      production: { heading: 'Kleuren en RAL', text: 'Antraciet en creme' },
      new: { heading: 'Kleuren en kleurkeuze', text: 'Antraciet en cremewit' },
    });
    // The displayed section keeps naming production, which is the source of truth.
    expect(copy.anchorHeading).toBe('Kleuren en RAL');
  });

  it('gives a finding above the first heading a location, and not no location', () => {
    // The 1,522. A null heading used to mean two things at once — *above the first
    // heading* and *not on this side* — and this one was served the other's answer, so
    // the row offered no link at all. The side is present; only its heading is absent,
    // and the words are still there to aim at.
    const findings = collect((collector) =>
      textFindings(
        diffRows(
          prod(outline([['Antraciet en creme', 'p']])),
          extract({ side: 'new', elements: [] }),
        ),
        collector,
      ),
    );

    expect(findings[0].anchorHeading).toBe(null);
    expect(findings[0].locations.production).toEqual({
      heading: null,
      text: 'Antraciet en creme',
    });
  });

  it('offers no heading for a side the finding is not on', () => {
    const findings = collect((collector) =>
      textFindings(
        diffRows(
          prod(
            outline([
              ['Kleuren en RAL', 'h2'],
              ['Antraciet en creme', 'p'],
            ]),
          ),
          extract({ side: 'new', elements: outline([['Kleuren en kleurkeuze', 'h2']]) }),
        ),
        collector,
      ),
    );

    // A paragraph production has and the new site does not is not on the new site to
    // be scrolled to, so that side offers nothing rather than a link to the wrong place.
    // The renamed heading is a finding of its own here, and it is on both sides.
    const dropped = findings.find((finding) => finding.class === 'text-missing');
    expect(dropped.locations).toEqual({
      production: { heading: 'Kleuren en RAL', text: 'Antraciet en creme' },
      new: null,
    });
  });

  it('positions an image finding, so "which of the eleven images" has an answer', () => {
    const findings = collect((collector) =>
      compareImages(
        extract({ elements: PAGE, images: [image('dak.jpg', 'Glazen dak', 5)] }),
        extract({ side: 'new', images: [] }),
        collector,
      ),
    );
    expect(findings.map((finding) => [finding.class, finding.anchorHeading])).toEqual([
      ['image-missing', 'Montage'],
    ]);
  });

  it('positions a link finding', () => {
    const findings = collect((collector) =>
      compareLinks({
        production: extract({
          elements: PAGE,
          links: [link('https://www.tuinmaximaal.nl/carport', 'Carports', { index: 3 })],
        }),
        new: extract({ side: 'new', url: newUrl, links: [] }),
        collector,
      }),
    );
    expect(findings.map((finding) => [finding.class, finding.anchorHeading])).toEqual([
      ['missing-link', 'Kleuren en RAL'],
    ]);
  });

  it("words a retargeted link's section as each side words it", () => {
    // The same anchor, a different target — the one link class that is on both sides,
    // so the one that offers two links. The new site both reworded the heading and
    // moved the anchor into a later section, so each side has to be read on its own
    // terms: production's heading against production's index, the new site's against
    // the new site's.
    const findings = collect((collector) =>
      compareLinks({
        production: extract({
          elements: outline([
            ['Onze overkappingen', 'h1'],
            ['Kleuren en RAL', 'h2'],
          ]),
          links: [link('https://www.tuinmaximaal.nl/carport', 'Bekijk carports', { index: 2 })],
        }),
        new: extract({
          side: 'new',
          url: newUrl,
          elements: outline([
            ['Onze overkappingen', 'h1'],
            ['Kleuren en kleurkeuze', 'h2'],
            ['Montage', 'h2'],
          ]),
          links: [
            link('https://m2stagingnl.intern.systems/carports', 'Bekijk carports', { index: 3 }),
          ],
        }),
        collector,
      }),
    );

    const retarget = findings.find((finding) => finding.class === 'link-target');
    // The same anchor wording on both sides — that is what paired them — under two
    // different headings, so each link is aimed with its own side's section.
    expect(retarget.locations).toEqual({
      production: { heading: 'Kleuren en RAL', text: 'Bekijk carports' },
      new: { heading: 'Montage', text: 'Bekijk carports' },
    });
  });

  it('gives a one-sided link finding no heading on the side it is not on', () => {
    // A link production has and the new site does not is not on the new site to be
    // scrolled to, and the reverse for one the new site gained. Both sides of that
    // rule in one comparison, because it is one rule.
    const findings = collect((collector) =>
      compareLinks({
        production: extract({
          elements: outline([['Kleuren en RAL', 'h2']]),
          links: [link('https://www.tuinmaximaal.nl/carport', 'Carports', { index: 1 })],
        }),
        new: extract({
          side: 'new',
          url: newUrl,
          elements: outline([['Montage', 'h2']]),
          links: [link('https://m2stagingnl.intern.systems/veranda', 'Veranda dak', { index: 1 })],
        }),
        collector,
      }),
    );

    // The comparative pass reports what production lost before what the new site gained.
    // A link finding aims at its **anchor wording**, which is what a reader sees on the
    // page — its target is a folded key and no browser can match that against anything.
    expect(findings.map((finding) => [finding.class, finding.locations])).toEqual([
      [
        'missing-link',
        {
          production: { heading: 'Kleuren en RAL', text: 'Carports' },
          new: null,
        },
      ],
      [
        'extra-link',
        {
          production: null,
          new: { heading: 'Montage', text: 'Veranda dak' },
        },
      ],
    ]);
  });

  it("words a changed alt's section as each side words it", () => {
    // The image is on both sides, so it has a position on both — and the new site put
    // it under a different heading. The alt is what changed; where to go and look at
    // it differs per side.
    const findings = collect((collector) =>
      compareImages(
        extract({
          elements: outline([['Kleuren en RAL', 'h2']]),
          images: [image('dak.jpg', 'Glazen dak', 1)],
        }),
        extract({
          side: 'new',
          elements: outline([
            ['Onze overkappingen', 'h1'],
            ['Montage', 'h2'],
          ]),
          images: [image('dak.jpg', 'Glazen dakplaat', 2)],
        }),
        collector,
      ),
    );

    expect(findings.map((finding) => [finding.class, finding.locations])).toEqual([
      [
        'alt-changed',
        {
          production: { heading: 'Kleuren en RAL', text: null },
          new: { heading: 'Montage', text: null },
        },
      ],
    ]);
  });

  it('gives a one-sided image finding no heading on the side it is not on', () => {
    const findings = collect((collector) =>
      compareImages(
        extract({
          elements: outline([['Kleuren en RAL', 'h2']]),
          images: [image('dak.jpg', 'Glazen dak', 1)],
        }),
        extract({
          side: 'new',
          elements: outline([['Montage', 'h2']]),
          images: [image('zijwand.jpg', 'Zijwand', 1)],
        }),
        collector,
      ),
    );

    // An image finding carries no text to aim at. Its key is a basename and its alt is
    // an attribute, so neither is rendered words a browser could match — the section
    // heading is as close as this tab can get, and `text` says so by being null.
    expect(findings.map((finding) => [finding.class, finding.locations])).toEqual([
      ['image-missing', { production: { heading: 'Kleuren en RAL', text: null }, new: null }],
      ['image-added', { production: null, new: { heading: 'Montage', text: null } }],
    ]);
  });

  it("words a redirect's section from production's own copy of the link", () => {
    // `redirect` is reported walking the **new** site's links, so production's heading
    // has to come from the counterpart it looks up rather than from the link in hand.
    const prodTarget = 'https://www.tuinmaximaal.nl/carport';
    const newTarget = 'https://m2stagingnl.intern.systems/carport';
    const findings = collect((collector) =>
      compareLinks({
        production: extract({
          // A second production heading *between* the two links' positions, so reading
          // the new link's index against production answers `Montage` and the test can
          // tell the two apart. Without it both indices land in the same section and a
          // wrong lookup goes unnoticed.
          elements: [
            unit('Kleuren en RAL', { tag: 'h2', index: 0 }),
            unit('Montage', { tag: 'h2', index: 2 }),
          ],
          links: [link(prodTarget, 'Carports', { index: 1 })],
        }),
        new: extract({
          side: 'new',
          url: newUrl,
          elements: outline([
            ['Onze overkappingen', 'h1'],
            ['Dakgoot', 'h2'],
          ]),
          links: [link(newTarget, 'Carports', { index: 3 })],
        }),
        collector,
        statuses: new Map([
          [newTarget, { status: 200, hops: 1 }],
          [prodTarget, { status: 200, hops: 0 }],
        ]),
      }),
    );

    const redirect = findings.find((finding) => finding.class === 'redirect');
    expect(redirect.locations).toEqual({
      production: { heading: 'Kleuren en RAL', text: 'Carports' },
      new: { heading: 'Dakgoot', text: 'Carports' },
    });
  });

  it('stays out of the finding id, so a heading edit never detaches a dismissal', () => {
    const words = outline([
      ['Kleuren en RAL', 'h2'],
      ['Antraciet en creme', 'p'],
    ]);
    const renamed = outline([
      ['Kleuren en kleurkeuze', 'h2'],
      ['Antraciet en creme', 'p'],
    ]);
    const withoutHeading = outline([['Antraciet en creme', 'p']]);

    const id = (prodUnits, newUnits) =>
      collect((collector) =>
        textFindings(
          diffRows(extract({ elements: prodUnits }), extract({ side: 'new', elements: newUnits })),
          collector,
        ),
      ).find((finding) => finding.prod === 'Antraciet en creme' && finding.new === null)?.id;

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
    expect(textFragmentUrl(PROD, long)).toBe(
      `${PROD}#:~:text=een%20twee%20drie%20vier%20vijf%20zes,acht%20negen%20tien%20elf%20twaalf%20dertien`,
    );
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

describe('locationUrl', () => {
  const PROD = 'https://www.tuinmaximaal.nl/overkappingen';

  it('aims at the words, which is the closest a link can get', () => {
    // A `link-target` finding knows the anchor a reader sees. The heading is also in
    // hand and is not used: the words are nearer.
    const url = locationUrl(PROD, { heading: 'Kleuren en RAL', text: 'Bekijk carports' });
    expect(url).toBe(`${PROD}#:~:text=Bekijk%20carports`);
  });

  it('falls back to the section, for a finding whose own text is not on the page', () => {
    // An image key and a link target are not words a browser can match, so the section
    // heading is as close as those two tabs can get.
    expect(locationUrl(PROD, { heading: 'Montage', text: null })).toBe(`${PROD}#:~:text=Montage`);
  });

  it('opens the page itself for a finding above the first heading', () => {
    // The 1,522 rows that used to offer no link at all. They sit in the opening
    // block by definition, so the top of the page is near enough — and a bare url
    // cannot be a dead one, which a fragment matching nothing silently is.
    expect(locationUrl(PROD, { heading: null, text: null })).toBe(PROD);
  });

  it('offers nothing for a side the finding is not on', () => {
    // Absence is the side's own answer. A `missing-link` has no position on the new
    // site, so the alternative to no link is a link to the wrong place.
    expect(locationUrl(PROD, null)).toBe(null);
    // A report written before this field says `undefined`, and there is no honest
    // answer to give for it. Deliberately not a fallback to the page: that would put a
    // link on the side a one-sided finding is not on, which is the bug this replaced.
    expect(locationUrl(PROD, undefined)).toBe(null);
    expect(locationUrl(null, { heading: 'Montage', text: null })).toBe(null);
  });

  it('reads a content unit as its own words, with no use for the heading', () => {
    expect(unitLocation(unit('Antraciet en creme'))).toEqual({
      heading: null,
      text: 'Antraciet en creme',
    });
    expect(unitLocation(null)).toBe(null);
  });

  it('offers a blank content cell no link, rather than falling back to the page', () => {
    // The fallback is for a finding that has somewhere to be and no way to name it. An
    // empty cell has nowhere to be, so it keeps the answer it had before this existed.
    expect(locationUrl(PROD, unitLocation(unit('   ')))).toBe(null);
  });
});

// --- The report ----------------------------------------------------------

describe('skipReason', () => {
  it('gates on 200, because a 404 page still extracts', () => {
    expect(skipReason(extract({ status: 404 }), extract({ side: 'new' }))).toMatch(
      /exists only on the new site/,
    );
    expect(skipReason(extract({}), extract({ side: 'new', status: 404 }))).toMatch(
      /not been migrated/,
    );
    expect(skipReason(extract({}), extract({ side: 'new' }))).toBe(null);
  });
});

describe('comparePage', () => {
  it('makes no findings for a one-sided page, and says why', () => {
    const report = comparePage({
      sides: {
        production: extract({ status: 404 }),
        new: extract({ side: 'new', elements: units(['Onderdelen', 'Bekijk alles']) }),
      },
    });
    expect(report.comparable).toBe(false);
    expect(report.findings).toEqual([]);
    expect(report.skipReason).toBeTruthy();
  });

  it('says that production declares no alternate for an unanchored page', () => {
    // `CONTEXT.md`: "no NL page" and "no declared alternate" are two different
    // things, and the log must not name the second as the first. This is the
    // second, and it is a defect of the sitemap metadata.
    const report = comparePage({
      sides: {
        production: extract({ store: 'fr', page: '(fr)heavy-duty-veranda' }),
        new: extract({ store: 'fr', page: '(fr)heavy-duty-veranda', side: 'new' }),
      },
    });
    const finding = report.findings.find((one) => one.class === 'no-declared-alternate');
    expect(finding).toMatchObject({ check: 'meta', prod: null, new: null });
  });

  it('says it on a one-sided page too, because the alternate is missing either way', () => {
    const report = comparePage({
      sides: {
        production: extract({ store: 'fr', page: '(fr)heavy-duty-veranda', status: 404 }),
        new: extract({ store: 'fr', page: '(fr)heavy-duty-veranda', side: 'new' }),
      },
    });
    expect(report.comparable).toBe(false);
    expect(report.findings.map((one) => one.class)).toEqual(['no-declared-alternate']);
  });

  it('says nothing about the alternate on a page production declares in Dutch', () => {
    const report = comparePage({
      sides: { production: extract({}), new: extract({ side: 'new' }) },
    });
    expect(report.findings.map((one) => one.class)).not.toContain('no-declared-alternate');
  });

  it('leaves the bar alone, because the metadata is not a content difference', () => {
    // A class that is not work is out of the denominator (ticket 09), so 96 of the 123
    // French pages do not each arrive carrying an open finding an editor cannot close.
    //
    // It is **not** out of the finding-set hash. That half of this pin was true until
    // ticket 118 and ADR 0013, which took the visibility filter out: the hash answers
    // *did this page change*, and a page that gained a `no-declared-alternate` did
    // change. The bar and the hash have stopped answering the same question, which is
    // the point — one is what an editor must close, the other is what they last read.
    const anchored = comparePage({
      sides: { production: extract({}), new: extract({ side: 'new' }) },
    });
    const unanchored = comparePage({
      sides: {
        production: extract({ store: 'fr', page: '(fr)heavy-duty-veranda' }),
        new: extract({ store: 'fr', page: '(fr)heavy-duty-veranda', side: 'new' }),
      },
    });
    expect(unanchored.summary.work).toBe(anchored.summary.work);
    expect(unanchored.findingSetHash).not.toBe(anchored.findingSetHash);
  });

  it('holds rows as unit indices, not copies of the text', () => {
    const report = comparePage({
      sides: {
        production: extract({ elements: units(['Overkappingen']) }),
        new: extract({ side: 'new', elements: units(['Overkappingen']) }),
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
        production: extract({ elements: units(['Levering in 5 werkdagen']) }),
        new: extract({ side: 'new', elements: units(['Levering in vijf werkdagen']) }),
      },
    });
    const row = report.rows.find((candidate) => candidate.class);
    expect(row.finding).toBe(report.findings[0].id);
  });

  it('counts the three visibilities apart', () => {
    const report = comparePage({
      sides: {
        production: extract({ elements: units(['Vanaf € 799', 'Gratis bezorging']) }),
        new: extract({ side: 'new', elements: units(['Vanaf € 849', 'Snelle bezorging vandaag']) }),
      },
    });
    // `Gratis bezorging` → `Snelle bezorging vandaag` scores 0.4, so it does not
    // pair: it is a loss and an addition, and ticket 33 keeps the addition out of the
    // count. `price` and `text-added` are both `information` since ticket 75.
    expect(report.summary.byClass).toEqual({
      price: 1,
      'text-missing': 1,
      'text-added': 1,
    });
    expect(report.summary).toMatchObject({
      work: 1,
      information: 2,
      diagnostic: 0,
      total: 3,
    });
  });
});

describe('summarise', () => {
  it('tallies one count per visibility, and totals them', () => {
    expect(
      summarise([
        { class: 'copy', check: 'text' },
        { class: 'extra-link', check: 'links' },
        { class: 'redirect', check: 'links' },
      ]),
    ).toMatchObject({ work: 1, information: 1, diagnostic: 1, total: 3 });
  });

  it('refuses a class the vocabulary does not name', () => {
    // The writer fails the run loudly rather than tallying an unknown class as *not
    // work*: a report on disk that quietly holds a name nothing can render is worse
    // than a compare that stops. The browser's `visibilityOf()` is the tolerant half,
    // and it reads what this refused to write.
    expect(() => summarise([{ class: 'invented', check: 'text' }])).toThrow();
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
   * @param {{ work: number, total: number }} counts
   */
  const report = (comparable, byClass, counts) => ({
    comparable,
    summary: {
      ...counts,
      information: counts.total - counts.work,
      diagnostic: 0,
      byClass,
      byCheck: {},
    },
  });

  it('counts every crawled page but measures only the comparable ones', () => {
    // Ticket 07: a page that fails the 200 gate carries no findings by design, so
    // counting its zero would drag the median down for a reason that has nothing
    // to do with the rules.
    const result = summariseReports([
      report(true, { copy: 4 }, { work: 4, total: 4 }),
      report(true, { copy: 40 }, { work: 40, total: 40 }),
      report(false, {}, { work: 0, total: 0 }),
    ]);
    expect(result).toMatchObject({
      crawled: 3,
      comparable: 2,
      findings: 44,
      work: 44,
      medianWork: 22,
      cleanPages: 0,
    });
  });

  it('adds the class tally over the pages', () => {
    const result = summariseReports([
      report(true, { copy: 2, 'text-added': 1 }, { work: 2, total: 3 }),
      report(true, { copy: 3 }, { work: 3, total: 3 }),
    ]);
    expect(result.byClass).toEqual({ copy: 5, 'text-added': 1 });
  });

  it('counts a page with no work on it as clean', () => {
    // The gate reads `work`, because nothing else is work for an editor.
    const result = summariseReports([report(true, { 'text-added': 6 }, { work: 0, total: 6 })]);
    expect(result).toMatchObject({ cleanPages: 1, work: 0, findings: 6 });
  });

  it('gives zeroes rather than NaN when nothing is comparable', () => {
    const result = summariseReports([report(false, {}, { work: 0, total: 0 })]);
    expect(result).toMatchObject({ crawled: 1, comparable: 0, medianWork: 0, medianTotal: 0 });
  });
});

describe('newSitePathsFor', () => {
  it('reads the paths from the seeds, with no network', () => {
    const seeds = {
      rows: [
        {
          page: 'garantie',
          stores: { nl: { newUrl: 'https://m2stagingnl.intern.systems/garantie' } },
        },
        {
          page: 'alleen-be',
          stores: { be: { newUrl: 'https://m2stagingbe.intern.systems/waarborg' } },
        },
      ],
    };
    expect(newSitePathsFor(seeds, 'nl')).toEqual(new Set(['/garantie']));
  });
});
