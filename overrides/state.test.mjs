import { describe, expect, it } from 'vitest';

import { findingSetHash } from '../compare/contract.mjs';
import {
  derivePageState, deriveStoreState, eventKey, latestByKey, muteCoverage,
} from './state.mjs';

/**
 * Observation ids sort chronologically by construction, so these three are simply
 * "before", "the one being read" and "after".
 */
const EARLIER = '2026-08-06T09:00:00.000Z-aaaaaaaa';
const CURRENT = '2026-08-06T10:00:00.000Z-bbbbbbbb';
const LATER = '2026-08-06T11:00:00.000Z-cccccccc';

let seq = 0;

/**
 * @param {string} id
 * @param {string} [cls] `copy` is shown, `restructured` is hidden (ticket 02).
 * @returns {import('../compare/contract.mjs').Finding}
 */
const finding = (id, cls = 'copy', anchorHeading = null) => ({
  id,
  store: 'nl',
  page: 'overkappingen',
  check: cls === 'copy' || cls === 'restructured' ? 'text' : 'links',
  class: cls,
  prod: 'Levering in 5 werkdagen',
  new: 'Levering in vijf werkdagen',
  anchorHeading,
  occurrences: 1,
  score: null,
});

/**
 * @param {import('../compare/contract.mjs').Finding[]} findings
 * @param {Partial<import('../compare/contract.mjs').PageReport>} [overrides]
 * @returns {import('../compare/contract.mjs').PageReport}
 */
const report = (findings, overrides = {}) => ({
  store: 'nl',
  page: 'overkappingen',
  sides: /** @type {any} */ ({}),
  comparable: true,
  skipReason: null,
  findings,
  rows: [],
  summary: /** @type {any} */ ({ shown: 0, hidden: 0, total: 0, byClass: {}, byCheck: {} }),
  observationId: CURRENT,
  findingSetHash: findingSetHash(findings),
  builtAt: '2026-08-06T10:00:00.000Z',
  ...overrides,
});

/** @param {Partial<import('./state.mjs').OverrideEvent>} parts */
const event = (parts) => ({
  id: String(++seq).padStart(4, '0'),
  // Ordered by construction. The counter sits in the milliseconds, so a file with
  // more than sixty events still sorts the way it reads.
  createdAt: `2026-08-06T12:00:00.${String(seq).padStart(3, '0')}Z`,
  editor: 'Danielle',
  store: 'nl',
  page: 'overkappingen',
  ...parts,
});

const fix = (id, observationId = CURRENT) => event({
  scope: 'finding', action: 'fixed', findingId: id, observationId,
});
const dismiss = (id) => event({
  scope: 'finding', action: 'dismissed', findingId: id, note: 'Prijs verschilt per omgeving.',
});
/** The page-wide form: the same key with the heading absent (ADR 0008). */
const mute = (cls) => event({
  scope: 'page-class', action: 'muted', class: cls, note: 'De hele pagina roteert.',
});
/** The section form. `null` is a real section: the content before the first heading. */
const muteSection = (cls, anchorHeading) => event({
  scope: 'page-class', action: 'muted', class: cls, anchorHeading, note: 'Deze sectie roteert.',
});
const clearFinding = (id) => event({ scope: 'finding', action: 'cleared', findingId: id });

/** @param {import('../compare/contract.mjs').PageReport} r */
const stateOf = (r, events, observationId) => {
  const derived = derivePageState({ report: r, events, observationId });
  return Object.fromEntries(derived.findings.map((f) => [f.id, f.state]));
};

describe('the precedence matrix', () => {
  const one = report([finding('A')]);

  it.each([
    // Ticket 09: a judgement beats the snapshot, a claim of fact does not.
    ['dismissed beats the snapshot', [dismiss('A')], 'dismissed'],
    ['muted beats the snapshot', [mute('copy')], 'muted'],
    ['a fix claimed against this same observation is closed', [fix('A', CURRENT)], 'fixed'],
    ['a fix claimed against an earlier observation is contradicted', [fix('A', EARLIER)], 'contradicted'],
    ['no events leaves the finding open', [], 'open'],
    ['cleared revokes, so the finding is open again', [dismiss('A'), clearFinding('A')], 'open'],
  ])('%s', (_name, events, expected) => {
    expect(stateOf(one, events).A).toBe(expected);
  });

  it('treats a fix claim carrying no observation as one that must prove itself', () => {
    const legacy = event({ scope: 'finding', action: 'fixed', findingId: 'A' });
    expect(stateOf(one, [legacy]).A).toBe('contradicted');
  });

  it('does not contradict a claim made against a later observation than the one being read', () => {
    expect(stateOf(one, [fix('A', LATER)], CURRENT).A).toBe('fixed');
  });
});

describe('absence beats everything', () => {
  // Ticket 01: the id is content-addressed and expires on purpose. A finding the
  // snapshot no longer gives is gone, whatever anybody clicked — the derivation
  // walks the snapshot, so a stale override has nothing to attach to.
  it.each([
    ['a dismissal', dismiss('GONE')],
    ['a fix claim', fix('GONE', EARLIER)],
  ])('%s whose finding id is absent contributes nothing', (_name, stale) => {
    const derived = derivePageState({ report: report([finding('A')]), events: [stale] });
    expect(derived.findings).toHaveLength(1);
    expect(derived.findings[0].state).toBe('open');
    expect(derived.bar).toMatchObject({ closed: 0, denominator: 1, open: 1 });
  });
});

describe('the more specific key wins', () => {
  const one = report([finding('A')]);

  it('a dismissal on the finding beats a mute on its class', () => {
    expect(stateOf(one, [mute('copy'), dismiss('A')]).A).toBe('dismissed');
  });

  it('a cleared finding override falls back to the class mute underneath it', () => {
    expect(stateOf(one, [mute('copy'), dismiss('A'), clearFinding('A')]).A).toBe('muted');
  });

  it('a mute on another class does not touch this finding', () => {
    expect(stateOf(one, [mute('casing')]).A).toBe('open');
  });
});

describe('latest wins per key', () => {
  it('resolves the latest event when they are supplied out of order', () => {
    const first = dismiss('A');
    const second = clearFinding('A');
    expect(stateOf(report([finding('A')]), [second, first]).A).toBe('open');
  });

  it('separates two events in the same millisecond by the table id', () => {
    const earlier = { ...dismiss('A'), id: '0001', createdAt: '2026-08-06T12:00:00.000Z' };
    const later = { ...fix('A', CURRENT), id: '0002', createdAt: '2026-08-06T12:00:00.000Z' };
    expect(stateOf(report([finding('A')]), [later, earlier]).A).toBe('fixed');
  });

  it('clears only its own key', () => {
    const events = [dismiss('A'), dismiss('B'), clearFinding('A')];
    expect(stateOf(report([finding('A'), finding('B')]), events)).toEqual({ A: 'open', B: 'dismissed' });
  });

  it('keys a mute on the class and a dismissal on the finding, never the same slot', () => {
    expect(eventKey(mute('copy'))).not.toBe(eventKey(dismiss('copy')));
  });

  it('keeps one entry per key', () => {
    expect(latestByKey([dismiss('A'), clearFinding('A'), mute('copy')]).size).toBe(2);
  });
});

describe('the mute key carries the anchor heading', () => {
  // ADR 0008: one key shape, `store | page | class | anchorHeading`, where the
  // page-wide form is the same key with the heading absent.
  it('separates two sections of the same class', () => {
    expect(eventKey(muteSection('copy', 'Gumax® Heavy Duty')))
      .not.toBe(eventKey(muteSection('copy', 'Zonwering')));
  });

  it('separates a section mute from the page-wide form', () => {
    expect(eventKey(muteSection('copy', 'Gumax® Heavy Duty'))).not.toBe(eventKey(mute('copy')));
  });

  it('separates the null section from the page-wide form, which is the trap', () => {
    // Both are "no heading" in the payload. They are different judgements: one
    // covers the content before the first heading, the other covers the page.
    expect(eventKey(muteSection('copy', null))).not.toBe(eventKey(mute('copy')));
  });

  it('gives one key to one section, whatever the heading is spelled with', () => {
    expect(eventKey(muteSection('copy', '*page'))).toBe(eventKey(muteSection('copy', '*page')));
    expect(eventKey(muteSection('copy', '*page'))).not.toBe(eventKey(mute('copy')));
  });

  it('leaves the finding key and the page key untouched', () => {
    expect(eventKey(dismiss('A'))).toBe('finding|nl|overkappingen|A');
    expect(eventKey(event({ scope: 'page', action: 'reviewed' }))).toBe('page|nl|overkappingen|');
  });
});

describe('a mute names a section', () => {
  // The page of ADR 0008: one heading carries most of the class, and the rest of
  // the page carries the same class under other headings.
  const HEAVY = 'Gumax® Heavy Duty';
  const page = report([
    finding('A', 'copy', HEAVY),
    finding('B', 'copy', HEAVY),
    finding('C', 'copy', 'Zonwering'),
    finding('D', 'copy', null),
  ]);

  it('mutes its own section and leaves the same class visible elsewhere', () => {
    expect(stateOf(page, [muteSection('copy', HEAVY)]))
      .toEqual({ A: 'muted', B: 'muted', C: 'open', D: 'open' });
  });

  it('mutes the null section only, and never the page through it', () => {
    // The null bucket is heterogeneous, so this is the trap ADR 0008 names.
    expect(stateOf(page, [muteSection('copy', null)]))
      .toEqual({ A: 'open', B: 'open', C: 'open', D: 'muted' });
  });

  it('mutes the whole class when the heading is absent', () => {
    expect(stateOf(page, [mute('copy')]))
      .toEqual({ A: 'muted', B: 'muted', C: 'muted', D: 'muted' });
  });

  it('holds a section mute and a page-wide mute at once, on their own keys', () => {
    const events = [muteSection('copy', HEAVY), mute('casing')];
    expect(stateOf(page, events)).toEqual({ A: 'muted', B: 'muted', C: 'open', D: 'open' });
    expect(latestByKey(events).size).toBe(2);
  });

  it('falls through from a cleared section to the page-wide mute underneath it', () => {
    // The same fall-through a cleared dismissal already has onto a class mute. An
    // editor who undoes a section mute and then mutes the page means the page: the
    // button counted that section in, so it must take it.
    const events = [
      muteSection('copy', HEAVY),
      event({ scope: 'page-class', action: 'cleared', class: 'copy', anchorHeading: HEAVY }),
      mute('copy'),
    ];
    expect(stateOf(page, events)).toEqual({ A: 'muted', B: 'muted', C: 'muted', D: 'muted' });
  });

  it('leaves a cleared section open when nothing wider is muted', () => {
    const events = [
      muteSection('copy', HEAVY),
      event({ scope: 'page-class', action: 'cleared', class: 'copy', anchorHeading: HEAVY }),
    ];
    expect(stateOf(page, events)).toEqual({ A: 'open', B: 'open', C: 'open', D: 'open' });
  });

  it('stops applying when the heading it named is gone', () => {
    // ADR 0008: the judgement was about a section that is no longer there, so the
    // editor is asked again. It must never widen to the page.
    const renamed = report([finding('A', 'copy', 'Gumax® Heavy Duty Plus')]);
    expect(stateOf(renamed, [muteSection('copy', HEAVY)]).A).toBe('open');
  });

  it('takes its own section out of the denominator and no more', () => {
    expect(derivePageState({ report: page, events: [muteSection('copy', HEAVY)] }).bar)
      .toMatchObject({ muted: 2, denominator: 2, open: 2, closed: 0 });
  });

  it('leaves a muted finding shown, because muting is not deleting', () => {
    const derived = derivePageState({ report: page, events: [muteSection('copy', HEAVY)] });
    expect(derived.findings.find((f) => f.id === 'A')).toMatchObject({ shown: true, state: 'muted' });
  });

  it('tells the interface which key muted a finding, so undo can clear that key', () => {
    const bySection = derivePageState({ report: page, events: [muteSection('copy', HEAVY)] });
    expect(bySection.findings[0].override).toMatchObject({ anchorHeading: HEAVY });

    const byPage = derivePageState({ report: page, events: [mute('copy')] });
    expect(byPage.findings[0].override).not.toHaveProperty('anchorHeading');
  });
});

describe('what a mute would cover, before the press', () => {
  const HEAVY = 'Gumax® Heavy Duty';
  // The shape of nl__terrasoverkapping in ADR 0008, in miniature: one heading
  // carries most of the class, and the null bucket holds unrelated findings.
  const findings = derivePageState({
    report: report([
      finding('A', 'copy', HEAVY),
      finding('B', 'copy', HEAVY),
      finding('C', 'copy', 'Zonwering'),
      finding('D', 'copy', null),
      finding('E', 'casing', HEAVY),
      finding('H', 'restructured', HEAVY),
    ]),
    events: [],
  }).findings;

  it('counts the section the press would take', () => {
    expect(muteCoverage(findings, { class: 'copy', anchorHeading: HEAVY })).toBe(2);
  });

  it('counts the whole class when the heading is absent, which is the larger press', () => {
    expect(muteCoverage(findings, { class: 'copy' })).toBe(4);
  });

  it('counts the null section as a section and not as the page', () => {
    expect(muteCoverage(findings, { class: 'copy', anchorHeading: null })).toBe(1);
  });

  it('counts one class only, because the class is still the only axis', () => {
    expect(muteCoverage(findings, { class: 'casing', anchorHeading: HEAVY })).toBe(1);
  });

  it('leaves a hidden class out, because it is in no bar and hiding it hides nothing', () => {
    expect(muteCoverage(findings, { class: 'restructured', anchorHeading: HEAVY })).toBe(0);
  });

  it('counts nothing for a heading the snapshot does not have', () => {
    expect(muteCoverage(findings, { class: 'copy', anchorHeading: 'Weg' })).toBe(0);
  });
});

describe('bar arithmetic', () => {
  const four = report(['A', 'B', 'C', 'D'].map((id) => finding(id)));

  it('counts every shown finding in the denominator when nothing is overridden', () => {
    expect(derivePageState({ report: four, events: [] }).bar).toMatchObject({
      closed: 0, denominator: 4, open: 4,
    });
  });

  it('a dismissal enters the numerator', () => {
    expect(derivePageState({ report: four, events: [dismiss('A')] }).bar).toMatchObject({
      closed: 1, denominator: 4, open: 3, dismissed: 1,
    });
  });

  it('a mute leaves the denominator', () => {
    // "This class is never a defect here" says the work does not exist, not that
    // it is done — so it cannot be the numerator.
    expect(derivePageState({ report: four, events: [mute('copy')] }).bar).toMatchObject({
      closed: 0, denominator: 0, open: 0, muted: 4,
    });
  });

  it('a hidden class is in neither the numerator nor the denominator', () => {
    // Ticket 02 defaults `restructured` to hidden. If it counted, the bar could
    // never reach zero.
    const mixed = report([finding('A'), finding('H', 'restructured')]);
    expect(derivePageState({ report: mixed, events: [] }).bar).toMatchObject({ denominator: 1 });
  });

  it('a contradicted claim reads as open and closes nothing', () => {
    expect(derivePageState({ report: four, events: [fix('A', EARLIER)] }).bar).toMatchObject({
      closed: 0, denominator: 4, open: 4, contradicted: 1,
    });
  });

  it('an uncontradicted fix claim closes', () => {
    expect(derivePageState({ report: four, events: [fix('A', CURRENT)] }).bar).toMatchObject({
      closed: 1, open: 3, fixed: 1,
    });
  });

  it('carries absolute counts, because the denominator moves', () => {
    const bar = derivePageState({ report: four, events: [] }).bar;
    expect(bar.denominator).toBe(4);
    expect(bar).not.toHaveProperty('percent');
  });
});

describe('page review', () => {
  const one = report([finding('A')]);
  const reviewOf = (r, hash) => derivePageState({
    report: r,
    events: [event({ scope: 'page', action: 'reviewed', findingSetHash: hash })],
  }).review;

  it('is null when nobody has reviewed the page', () => {
    expect(derivePageState({ report: one, events: [] }).review).toBeNull();
  });

  it('is fresh when the finding set has not changed since the review', () => {
    expect(reviewOf(one, one.findingSetHash)).toMatchObject({ fresh: true, editor: 'Danielle' });
  });

  it('goes stale when the finding set grew', () => {
    const grown = report([finding('A'), finding('B')]);
    expect(reviewOf(grown, one.findingSetHash).fresh).toBe(false);
  });

  it('goes stale when the finding set shrank', () => {
    // An editor un-freshens their own review by correcting things. That is
    // "changed since review", never "needs review" — ticket 09.
    const grown = report([finding('A'), finding('B')]);
    expect(reviewOf(one, grown.findingSetHash).fresh).toBe(false);
  });

  it('survives a mute, because the hash covers the shown classes only', () => {
    const withHidden = report([finding('A'), finding('H', 'restructured')]);
    expect(withHidden.findingSetHash).toBe(one.findingSetHash);
  });

  it('is revoked by a clear on the page scope', () => {
    const events = [
      event({ scope: 'page', action: 'reviewed', findingSetHash: one.findingSetHash }),
      event({ scope: 'page', action: 'cleared' }),
    ];
    expect(derivePageState({ report: one, events }).review).toBeNull();
  });
});

describe('deriveStoreState', () => {
  const heavy = report(Array.from({ length: 40 }, (_, i) => finding(`H${i}`)), { page: 'fotogalerij' });
  const light = report([finding('L0')], { page: 'meettool' });

  const events = [
    ...Array.from({ length: 40 }, (_, i) => event({
      scope: 'finding', action: 'dismissed', page: 'fotogalerij', findingId: `H${i}`, note: 'ok',
    })),
  ];

  it('sums over findings and never over pages', () => {
    // Two pages, one with forty findings and one with one. Summed over pages this
    // would read as 50% done; summed over findings it is 40 of 41.
    const store = deriveStoreState({ reports: [heavy, light], events });
    expect(store.bar).toMatchObject({ closed: 40, denominator: 41, open: 1 });
  });

  it('scopes events to their own page', () => {
    const store = deriveStoreState({ reports: [heavy, light], events });
    expect(store.pages.find((p) => p.page === 'meettool').bar.closed).toBe(0);
  });

  it('counts reviewed pages and how many of those reviews are fresh', () => {
    const reviews = [
      event({ scope: 'page', action: 'reviewed', page: 'fotogalerij', findingSetHash: heavy.findingSetHash }),
      event({ scope: 'page', action: 'reviewed', page: 'meettool', findingSetHash: 'stale-hash' }),
    ];
    const store = deriveStoreState({ reports: [heavy, light], events: reviews });
    expect(store).toMatchObject({ pagesTotal: 2, reviewed: 2, reviewedFresh: 1 });
  });
});
