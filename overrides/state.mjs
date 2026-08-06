/**
 * The one new tested boundary in spec 29: what a list of override events adds up
 * to, on top of a snapshot.
 *
 * **Pure.** No network, no clock, no `Date.now()`. The observation the reader is
 * looking at comes in as an argument. Everything else in the feature is thin
 * enough to test through this function, and the log's trustworthiness rests on
 * these rules, so they are the crown jewels.
 *
 * A finding has **no stored state** (ticket 09). It has overrides, and `state` is
 * what they add up to. `contradicted` in particular is derived and never written.
 */

import { FINDING_CLASSES } from '../compare/vocabulary.mjs';

/**
 * One row of the append-only `overrides` table, in the shape the port hands over.
 *
 * @typedef {object} OverrideEvent
 * @property {string} [id]
 * @property {string} createdAt      ISO 8601. Latest per key wins; events may arrive unsorted.
 * @property {string} editor         A name from `localStorage`. There is no login.
 * @property {'finding' | 'page-class' | 'page'} scope
 * @property {'fixed' | 'dismissed' | 'muted' | 'reviewed' | 'cleared'} action
 * @property {string} store
 * @property {string} page
 * @property {string | null} [findingId]      When `scope === 'finding'`.
 * @property {string | null} [class]          When `scope === 'page-class'`.
 * @property {string | null} [observationId]  What a `fixed` claim was made against.
 * @property {string | null} [findingSetHash] On `reviewed`, for staleness.
 * @property {string | null} [note]           Required on `dismissed`.
 */

/** @typedef {'open' | 'dismissed' | 'muted' | 'fixed' | 'contradicted'} FindingState */

/**
 * The append-only table is keyed on `(scope, store, page, finding_id ?? class)`,
 * and the `overrides_current` view takes the latest row per key. This is the same
 * key, so the derivation agrees with the view.
 *
 * @param {OverrideEvent} event
 * @returns {string}
 */
export function eventKey(event) {
  const key = event.scope === 'finding' ? event.findingId
    : event.scope === 'page-class' ? event.class
      : '';
  return [event.scope, event.store, event.page, key ?? ''].join('|');
}

/**
 * Latest event per key. Events may arrive in any order — Supabase is asked for
 * them sorted, but a caller that concatenates two reads must still be right.
 *
 * @param {OverrideEvent[]} events
 * @returns {Map<string, OverrideEvent>}
 */
export function latestByKey(events) {
  /** @type {Map<string, OverrideEvent>} */
  const current = new Map();
  for (const event of events) {
    const key = eventKey(event);
    const held = current.get(key);
    if (!held || isLater(event, held)) current.set(key, event);
  }
  return current;
}

/** Two events in the same millisecond are separated by the table's own id. */
const isLater = (/** @type {OverrideEvent} */ a, /** @type {OverrideEvent} */ b) => (
  a.createdAt === b.createdAt ? String(a.id ?? '') > String(b.id ?? '') : a.createdAt > b.createdAt
);

/**
 * Whether a `fixed` claim has been contradicted.
 *
 * Ticket 09 says a fix claim counts as closed until it is contradicted, **and**
 * that the button is worth pressing on a frozen snapshot where nothing can
 * contradict it. Those agree only if a claim knows what it was claimed against:
 * a claim made against the very snapshot the reader is looking at has had nothing
 * new happen to it. A Recheck, or the next build, is a later observation — and
 * then the claim must prove itself.
 *
 * Observation ids sort chronologically by construction (`newObservationId()`), so
 * "later" is a string comparison and needs no clock. A claim carrying no
 * observation at all is treated as older than everything: it is a claim from
 * before this rule existed, and the safe reading is that it must prove itself.
 *
 * @param {OverrideEvent} claim
 * @param {string} observationId  The observation being read.
 */
const isContradicted = (claim, observationId) => (claim.observationId ?? '') < observationId;

/**
 * @param {object} input
 * @param {import('../compare/contract.mjs').ObservedPage} input.report
 * @param {OverrideEvent[]} input.events   Every event for this store page.
 * @param {string} [input.observationId]   Defaults to the report's own.
 */
export function derivePageState({ report, events, observationId = report.observationId }) {
  const current = latestByKey(
    events.filter((event) => event.store === report.store && event.page === report.page),
  );

  // Keyed on the **report's** store and page, never the finding's. They should
  // agree, and a finding that disagrees is a bug upstream — but the events were
  // filtered on the report, so the lookup has to be filtered on the same thing or
  // it silently misses every override.
  const place = { store: report.store, page: report.page };

  const findings = report.findings.map((finding) => {
    const own = current.get(eventKey({ ...place, scope: 'finding', findingId: finding.id }));
    const mute = current.get(eventKey({ ...place, scope: 'page-class', class: finding.class }));

    // A finding-scope override is the more specific key, so it beats a class mute.
    // A `cleared` one matches neither branch and falls through to the mute.
    if (own?.action === 'dismissed') return decided(finding, 'dismissed', own);
    if (own?.action === 'fixed') {
      const state = isContradicted(own, observationId) ? 'contradicted' : 'fixed';
      return decided(finding, state, own);
    }
    if (mute?.action === 'muted') return decided(finding, 'muted', mute);
    return decided(finding, 'open', null);
  });

  return { findings, bar: bar(findings), review: review(current, report) };
}

/**
 * @param {import('../compare/contract.mjs').Finding} finding
 * @param {FindingState} state
 * @param {OverrideEvent | null} override
 */
const decided = (finding, state, override) => ({
  ...finding,
  state,
  shown: Boolean(FINDING_CLASSES[finding.class]?.shown),
  override: override
    ? { action: override.action, editor: override.editor, at: override.createdAt, note: override.note ?? null }
    : null,
});

/**
 * The page bar, from ticket 09.
 *
 * - A **hidden class is in neither** the numerator nor the denominator, or the bar
 *   could never reach zero.
 * - A **mute leaves the denominator**: "this class is never a defect here" is a
 *   statement that the work does not exist, not that it is done.
 * - A **dismissal enters the numerator**: "I read this and accepted it" is work.
 * - **`contradicted` reads as open.** A claim that did not survive a later
 *   observation has closed nothing.
 *
 * Absolute counts are always carried, because the denominator moves: a genuinely
 * corrected difference leaves the snapshot altogether, so the same page can have
 * fewer open findings and the same percentage.
 *
 * @param {ReturnType<typeof decided>[]} findings
 */
function bar(findings) {
  const shown = findings.filter((finding) => finding.shown);
  const count = (/** @type {FindingState} */ state) => shown.filter((f) => f.state === state).length;

  const muted = count('muted');
  const dismissed = count('dismissed');
  const fixed = count('fixed');
  const contradicted = count('contradicted');
  const denominator = shown.length - muted;

  return {
    closed: dismissed + fixed,
    denominator,
    open: denominator - dismissed - fixed,
    muted,
    dismissed,
    fixed,
    contradicted,
  };
}

/**
 * A page review records the finding set it was made against and goes **stale**
 * when that set stops matching — *changed since review*, never *needs review*.
 * Ticket 09: a review never expires on its own, or the log manufactures work.
 *
 * The hash covers the shown classes only (`findingSetHash()`), so muting
 * something does not stale every review on the page.
 *
 * @param {Map<string, OverrideEvent>} current
 * @param {import('../compare/contract.mjs').PageReport} report
 */
function review(current, report) {
  const event = current.get(`page|${report.store}|${report.page}|`);
  if (event?.action !== 'reviewed') return null;
  return {
    at: event.createdAt,
    editor: event.editor,
    fresh: event.findingSetHash === report.findingSetHash,
  };
}

/**
 * The store roll-up. Ticket 09: summed over **findings, never over pages**, so a
 * page with one casing nit does not weigh as much as a page with forty. Axis A
 * only — ticket 11 forbids summing the coverage bar into this one.
 *
 * @param {object} input
 * @param {import('../compare/contract.mjs').ObservedPage[]} input.reports
 * @param {OverrideEvent[]} input.events
 * @param {string} [input.observationId]
 */
export function deriveStoreState({ reports, events, observationId }) {
  const pages = reports.map((report) => ({
    store: report.store,
    page: report.page,
    ...derivePageState({ report, events, observationId }),
  }));

  const totals = { closed: 0, denominator: 0, open: 0, muted: 0, dismissed: 0, fixed: 0, contradicted: 0 };
  let reviewed = 0;
  let reviewedFresh = 0;

  for (const page of pages) {
    for (const key of Object.keys(totals)) totals[key] += page.bar[key];
    if (page.review) {
      reviewed += 1;
      if (page.review.fresh) reviewedFresh += 1;
    }
  }

  return { pages, bar: totals, pagesTotal: pages.length, reviewed, reviewedFresh };
}
