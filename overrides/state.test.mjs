import { describe, expect, it } from 'vitest';

import { findingSetHash } from '../compare/contract.mjs';
import { PRIORITIES } from '../shared/priorities.mjs';
import {
  clearedEventFor,
  derivePageState,
  deriveStoreState,
  eventKey,
  latestByKey,
  noteEventFor,
  priorityEventFor,
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
 * @param {string} [cls] `copy` is `work`, `restructured` is `information` (ticket 75).
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
  summary: /** @type {any} */ ({
    work: 0,
    information: 0,
    diagnostic: 0,
    total: 0,
    byClass: {},
    byCheck: {},
  }),
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

const fix = (id, observationId = CURRENT) =>
  event({
    scope: 'finding',
    action: 'fixed',
    findingId: id,
    observationId,
  });
const dismiss = (id) =>
  event({
    scope: 'finding',
    action: 'dismissed',
    findingId: id,
    note: 'Prijs verschilt per omgeving.',
  });
const clearFinding = (id) => event({ scope: 'finding', action: 'cleared', findingId: id });

/**
 * A row carrying the scope and action ADR 0011 withdrew, in the shape the port hands one
 * over. Eleven of these are on disk for ever, so the derivation has to walk past them
 * rather than fail on them.
 *
 * The live one is `nl` · `downloads` · `text-missing` · the content before the first
 * heading, 2026-08-10 11:07, note `"Negeren"`. Its **page and class are the fixture's**
 * here, on purpose: the derivation filters events on the report's store and page, so a row
 * for another page would be dropped before reaching anything and the test would pass
 * without having asked its question. Everything else is the row as stored — including
 * `findingId: null`, which is what makes it a row the finding lookup can never match.
 */
const withdrawnRow = () => ({
  id: '0311',
  createdAt: '2026-08-10T11:07:00.000Z',
  editor: 'Danielle',
  scope: 'page-class',
  action: 'muted',
  store: 'nl',
  page: 'overkappingen',
  findingId: null,
  class: 'copy',
  observationId: null,
  findingSetHash: null,
  note: 'Negeren',
});

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
    ['a fix claimed against this same observation is closed', [fix('A', CURRENT)], 'fixed'],
    [
      'a fix claimed against an earlier observation is contradicted',
      [fix('A', EARLIER)],
      'contradicted',
    ],
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

/**
 * ADR 0011 withdrew the one override that was keyed on anything but a finding, so there is
 * no longer a wider key for a finding-scope one to beat, and no fall-through under a
 * cleared one. What is left to prove is that the eleven rows the table still holds are
 * walked past rather than fallen over — the trap ticket 114 names, because nothing looks
 * wrong until a parse or a switch statement meets one.
 */
describe('a withdrawn override still on the table', () => {
  const one = report([finding('A')]);

  it('loads and leaves the finding open', () => {
    expect(stateOf(one, [withdrawnRow()]).A).toBe('open');
  });

  it('is keyed on its own scope and never lands in a finding or page slot', () => {
    const key = eventKey(withdrawnRow());
    expect(key).toBe('page-class|nl|overkappingen|copy');
    expect(key).not.toBe(eventKey(dismiss('A')));
    expect(key).not.toBe(eventKey(event({ scope: 'page', action: 'reviewed' })));
  });

  it('leaves the bar and the review untouched', () => {
    const derived = derivePageState({ report: one, events: [withdrawnRow()] });
    expect(derived.bar).toMatchObject({ closed: 0, denominator: 1, open: 1 });
    expect(derived.review).toBeNull();
  });

  it('does not stop a dismissal on the same page being read', () => {
    expect(stateOf(one, [withdrawnRow(), dismiss('A')]).A).toBe('dismissed');
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
    expect(stateOf(report([finding('A'), finding('B')]), events)).toEqual({
      A: 'open',
      B: 'dismissed',
    });
  });

  it('keeps one entry per key', () => {
    expect(latestByKey([dismiss('A'), clearFinding('A'), dismiss('B')]).size).toBe(2);
  });

  it('gives the finding key and the page key the shapes the derivation looks up', () => {
    expect(eventKey(dismiss('A'))).toBe('finding|nl|overkappingen|A');
    expect(eventKey(event({ scope: 'page', action: 'reviewed' }))).toBe('page|nl|overkappingen|');
  });
});

describe('the anchor heading survives as a locator', () => {
  // It is how a difference says where it is, it is rendered on a page, and ADR 0011 did
  // not take it: only the withdrawn key that used to read it, and the index entry.
  const HEAVY = 'Gumax® Heavy Duty';
  const page = report([finding('A', 'copy', HEAVY), finding('D', 'copy', null)]);

  it('is carried through the derivation on every finding', () => {
    const derived = derivePageState({ report: page, events: [] });
    expect(derived.findings.map((f) => f.anchorHeading)).toEqual([HEAVY, null]);
  });

  it('is not attached to an override, because no override is keyed on it', () => {
    const derived = derivePageState({ report: page, events: [dismiss('A')] });
    expect(derived.findings[0].override).not.toHaveProperty('anchorHeading');
    expect(derived.findings[0].anchorHeading).toBe(HEAVY);
  });
});

/**
 * The one event that revokes one decision, asked of the derivation that made it.
 *
 * Two callers must write the same event — the single control on a page and the bulk press
 * on a difference — and neither may answer it for itself. ADR 0011 left it one shape to
 * return, and it stays **one function** for the same reason it became one in ticket 110:
 * the next change to what a clearing names gets one place to land, not two.
 */
describe('the event that clears one decision', () => {
  it('clears a dismissal on the finding it was made on', () => {
    expect(clearedEventFor({ id: 'f1', state: 'dismissed', class: 'copy', override: {} })).toEqual({
      scope: 'finding',
      action: 'cleared',
      findingId: 'f1',
    });
  });

  it('names the finding and nothing wider, whatever else the finding carries', () => {
    // The class and the anchor heading are on a finding and are not on this event. No
    // override is keyed on either any more, so a clearing that mentioned them would be
    // aiming at a key nothing writes.
    const event_ = clearedEventFor({
      id: 'f1',
      state: 'dismissed',
      class: 'copy',
      anchorHeading: 'Afmetingen',
      override: {},
    });
    expect(event_).toEqual({ scope: 'finding', action: 'cleared', findingId: 'f1' });
  });
});

describe('bar arithmetic', () => {
  const four = report(['A', 'B', 'C', 'D'].map((id) => finding(id)));

  it('counts every work finding in the denominator when nothing is overridden', () => {
    expect(derivePageState({ report: four, events: [] }).bar).toMatchObject({
      closed: 0,
      denominator: 4,
      open: 4,
    });
  });

  it('a dismissal enters the numerator', () => {
    expect(derivePageState({ report: four, events: [dismiss('A')] }).bar).toMatchObject({
      closed: 1,
      denominator: 4,
      open: 3,
      dismissed: 1,
    });
  });

  it('nothing leaves the denominator, and there is no fourth number', () => {
    // ADR 0011 withdrew the one override that used to take findings out of the
    // denominator, so a difference in a `work` class is now either open work or work an
    // editor closed. The historical rows cannot put the subtraction back.
    const bar = derivePageState({ report: four, events: [withdrawnRow()] }).bar;

    expect(bar).toMatchObject({ closed: 0, denominator: 4, open: 4 });
    expect(Object.keys(bar).sort()).toEqual([
      'closed',
      'contradicted',
      'denominator',
      'dismissed',
      'fixed',
      'open',
    ]);
  });

  it('a class that is not work is in neither the numerator nor the denominator', () => {
    // Ticket 75 triaged `restructured` to `information`: it is drawn and it counts
    // nowhere. If it counted, the bar could never reach zero.
    const mixed = report([finding('A'), finding('H', 'restructured')]);
    expect(derivePageState({ report: mixed, events: [] }).bar).toMatchObject({ denominator: 1 });
  });

  it('carries the class visibility onto every derived finding', () => {
    // One reader asks the vocabulary — `decided()` — and the bar, the ledger's toggle
    // and a landing all read the answer off the finding. Two readers would be two
    // chances to disagree about what an editor is being asked to do.
    const mixed = report([finding('A'), finding('H', 'restructured'), finding('R', 'redirect')]);
    const { findings } = derivePageState({ report: mixed, events: [] });

    expect(findings.map((one) => one.visibility)).toEqual(['work', 'information', 'diagnostic']);
  });

  it('a contradicted claim reads as open and closes nothing', () => {
    expect(derivePageState({ report: four, events: [fix('A', EARLIER)] }).bar).toMatchObject({
      closed: 0,
      denominator: 4,
      open: 4,
      contradicted: 1,
    });
  });

  it('an uncontradicted fix claim closes', () => {
    expect(derivePageState({ report: four, events: [fix('A', CURRENT)] }).bar).toMatchObject({
      closed: 1,
      open: 3,
      fixed: 1,
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
  const reviewOf = (r, hash) =>
    derivePageState({
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

  it('goes stale on a class that is not work, because a reviewer read the page', () => {
    // Ticket 118 and ADR 0013 took the visibility filter out of the hash. This pin used
    // to hold the two hashes equal, so that a change confined to what the tool does not
    // put up as work left every review fresh. That reading is withdrawn: a human
    // reviewed the page, not the shown subset of it, so `restructured` appearing on it
    // is the page changing. What the trade buys is the other direction — a vocabulary
    // edit can no longer stale a review, which `findingSetHash` pins in contract.test.mjs.
    const withInformation = report([finding('A'), finding('H', 'restructured')]);
    expect(reviewOf(withInformation, one.findingSetHash).fresh).toBe(false);
  });

  it('is revoked by a clear on the page scope', () => {
    const events = [
      event({ scope: 'page', action: 'reviewed', findingSetHash: one.findingSetHash }),
      event({ scope: 'page', action: 'cleared' }),
    ];
    expect(derivePageState({ report: one, events }).review).toBeNull();
  });
});

describe('the two page annotations', () => {
  const one = report([finding('A')]);

  it('gives the page the priority an editor set on it', () => {
    const events = [event({ scope: 'page', action: 'prioritised', priority: 'high' })];
    expect(derivePageState({ report: one, events }).annotations.priority).toBe('high');
  });

  /**
   * The page scope had exactly one key until this ticket, so a third page-scope action
   * arriving after a review would have been the latest event on the review's own key —
   * and `review()` returns null the moment that event is not a `reviewed`. Annotating a
   * page would have silently withdrawn the review of it.
   */
  it('does not withdraw a page review, because an annotation is not a review', () => {
    const events = [
      event({ scope: 'page', action: 'reviewed', findingSetHash: one.findingSetHash }),
      event({ scope: 'page', action: 'prioritised', priority: 'high' }),
    ];
    const derived = derivePageState({ report: one, events });
    expect(derived.review).toMatchObject({ fresh: true });
    expect(derived.annotations.priority).toBe('high');
  });

  it('takes the later of two priorities on one page', () => {
    const events = [
      event({ scope: 'page', action: 'prioritised', priority: 'low' }),
      event({ scope: 'page', action: 'prioritised', priority: 'high' }),
    ];
    // Handed over in both orders: the events are reduced by their own timestamps, and a
    // caller that concatenates two reads does not hand them over sorted.
    expect(derivePageState({ report: one, events }).annotations.priority).toBe('high');
    expect(
      derivePageState({ report: one, events: [...events].reverse() }).annotations.priority,
    ).toBe('high');
  });

  /**
   * A cleared annotation is a **new event**, never an edit and never a delete: the table
   * has insert and select policies only.
   *
   * It is not the `cleared` action, and that is this ticket's one refusal to explain. On
   * `scope: 'page'`, `cleared` already means *withdraw the review* — it is the only thing
   * it has ever revoked there. Reusing it for three annotation families on one scope would
   * make one action mean three things and need a fourth column to say which, so instead
   * the value-carrying action clears itself by carrying nothing.
   */
  it('is cleared by a later event carrying no value, and not by `cleared`', () => {
    const events = [
      event({ scope: 'page', action: 'reviewed', findingSetHash: one.findingSetHash }),
      event({ scope: 'page', action: 'prioritised', priority: 'high' }),
      event({ scope: 'page', action: 'prioritised', priority: null }),
    ];
    const derived = derivePageState({ report: one, events });
    expect(derived.annotations.priority).toBeNull();
    // The clearing aimed at the priority, so the review is untouched by it.
    expect(derived.review).toMatchObject({ fresh: true });
  });

  it('carries a note beside the priority, and each one keeps its own value', () => {
    const events = [
      event({ scope: 'page', action: 'prioritised', priority: 'high' }),
      event({ scope: 'page', action: 'noted', note: 'Campagne-update' }),
    ];
    expect(derivePageState({ report: one, events }).annotations).toMatchObject({
      priority: 'high',
      note: 'Campagne-update',
    });
  });

  /**
   * The ticket's first trap. A dismissal note is mandatory and explains one judgement
   * about two strings; a page note is optional and explains nothing in particular. They
   * share a column, so a derivation that read the column without asking what the event
   * was would put a colleague's reason for dismissing one finding up as the note on the
   * whole page.
   */
  it('does not read a dismissal note as the page note', () => {
    const derived = derivePageState({ report: one, events: [dismiss('A')] });
    expect(derived.annotations.note).toBeNull();
    expect(derived.findings[0].override.note).toBe('Prijs verschilt per omgeving.');
  });

  it('clears a note with an empty one, the same way a priority is cleared', () => {
    const events = [
      event({ scope: 'page', action: 'noted', note: 'Campagne-update' }),
      event({ scope: 'page', action: 'noted', note: '' }),
    ];
    expect(derivePageState({ report: one, events }).annotations.note).toBeNull();
  });
});

/**
 * Ticket 83: *neither annotation moves any count*. An annotation describes a page; the bar
 * counts decisions about findings. The two are not the same thing, and the moment an
 * annotation could move a number it would become a fifth way to close work.
 */
describe('an annotation is not work', () => {
  const four = report(['A', 'B', 'C', 'D'].map((id) => finding(id)));
  const annotated = [
    event({ scope: 'page', action: 'prioritised', priority: 'high' }),
    event({ scope: 'page', action: 'noted', note: 'Campagne-update' }),
  ];

  it('moves neither the bar, nor the denominator, nor a bucket', () => {
    const before = derivePageState({ report: four, events: [] });
    const after = derivePageState({ report: four, events: annotated });
    expect(after.bar).toEqual(before.bar);
    expect(after.bar).toMatchObject({ denominator: 4, open: 4, closed: 0 });
  });

  it('puts no finding of the page into a different state', () => {
    expect(stateOf(four, annotated)).toEqual(stateOf(four, []));
  });

  it('moves nothing in the store roll-up, and adds no fourth number to it', () => {
    const before = deriveStoreState({ reports: [four], events: [] });
    const after = deriveStoreState({ reports: [four], events: annotated });
    expect(after.bar).toEqual(before.bar);
    // Annotating a page is not reviewing it, so the two page counts stay put as well.
    expect(after).toMatchObject({ pagesTotal: 1, reviewed: 0, reviewedFresh: 0 });
  });
});

describe('the events an annotation is written as', () => {
  /**
   * The closed list is in `shared/`, not in the table: the schema holds no list of these
   * words to check a row against, on purpose, so **this builder is the only thing standing
   * between a typo and a permanent row.** The table is append-only, so a refused write is
   * the only kind of undo there is.
   */
  it('refuses a priority outside the closed list', () => {
    for (const value of ['Hoog', 'HIGH', 'urgent', 'normal']) {
      expect(() => priorityEventFor(value)).toThrow(/priority/i);
    }
  });

  it('builds the event for each word the list does hold', () => {
    expect(priorityEventFor('high')).toEqual({
      scope: 'page',
      action: 'prioritised',
      priority: 'high',
    });
    expect(PRIORITIES.map((one) => priorityEventFor(one).priority)).toEqual(PRIORITIES);
  });

  it('builds the clearing of a priority, which is the one absent value it accepts', () => {
    expect(priorityEventFor(null)).toEqual({
      scope: 'page',
      action: 'prioritised',
      priority: null,
    });
  });

  it('builds a note, trimmed, and an empty note is the clearing of one', () => {
    expect(noteEventFor('  Campagne-update  ')).toEqual({
      scope: 'page',
      action: 'noted',
      note: 'Campagne-update',
    });
    expect(noteEventFor('   ')).toEqual({ scope: 'page', action: 'noted', note: '' });
  });
});

describe('deriveStoreState', () => {
  const heavy = report(
    Array.from({ length: 40 }, (_, i) => finding(`H${i}`)),
    { page: 'fotogalerij' },
  );
  const light = report([finding('L0')], { page: 'meettool' });

  const events = [
    ...Array.from({ length: 40 }, (_, i) =>
      event({
        scope: 'finding',
        action: 'dismissed',
        page: 'fotogalerij',
        findingId: `H${i}`,
        note: 'ok',
      }),
    ),
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
      event({
        scope: 'page',
        action: 'reviewed',
        page: 'fotogalerij',
        findingSetHash: heavy.findingSetHash,
      }),
      event({ scope: 'page', action: 'reviewed', page: 'meettool', findingSetHash: 'stale-hash' }),
    ];
    const store = deriveStoreState({ reports: [heavy, light], events: reviews });
    expect(store).toMatchObject({ pagesTotal: 2, reviewed: 2, reviewedFresh: 1 });
  });
});
