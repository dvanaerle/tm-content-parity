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
import { muteKey, namesSection } from '../shared/mute-key.mjs';

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
 * @property {string | null} [anchorHeading]  The section a mute names. **Absent
 *   is the page-wide form**, and `null` is the content before the first heading,
 *   which is a section of its own (ADR 0008).
 * @property {string | null} [observationId]  What a `fixed` claim was made against.
 * @property {string | null} [findingSetHash] On `reviewed`, for staleness.
 * @property {string | null} [note]           Required on `dismissed`.
 */

/** @typedef {'open' | 'dismissed' | 'muted' | 'fixed' | 'contradicted'} FindingState */

/**
 * The append-only table is keyed on `(scope, store, page, finding_id ?? class)`,
 * and on the anchor slot as well when the scope is `page-class`. The
 * `overrides_current` view takes the latest row per key. This is the same key, so
 * the derivation agrees with the view.
 *
 * The mute half is `muteKey()` from the contract, which is where that key is
 * written down. Two spellings of one key is how a mute starts hiding something
 * other than what the interface said it would.
 *
 * @param {OverrideEvent} event
 * @returns {string}
 */
export function eventKey(event) {
  if (event.scope === 'page-class') {
    return ['page-class', muteKey(/** @type {any} */ (event))].join('|');
  }
  const key = event.scope === 'finding' ? event.findingId : '';
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

    // Two mute keys can reach one finding: the section it sits in, and the page.
    // A mute that named a heading the snapshot no longer has reaches nothing, and
    // that is the whole of ADR 0008's drift rule — there is no fallback to write.
    const section = current.get(eventKey({
      ...place, scope: 'page-class', class: finding.class, anchorHeading: finding.anchorHeading ?? null,
    }));
    const wide = current.get(eventKey({ ...place, scope: 'page-class', class: finding.class }));

    // A finding-scope override is the more specific key, so it beats a class mute.
    // A `cleared` one matches neither branch and falls through to the mute.
    if (own?.action === 'dismissed') return decided(finding, 'dismissed', own);
    if (own?.action === 'fixed') {
      const state = isContradicted(own, observationId) ? 'contradicted' : 'fixed';
      return decided(finding, state, own);
    }

    // The same rule again, one level down, including the fall-through: a cleared
    // section matches neither branch and lands on the page-wide mute underneath
    // it. Stopping there instead would leave a section that no press could reach
    // again, under a page-wide button that had just counted it in.
    if (section?.action === 'muted') return decided(finding, 'muted', section);
    if (wide?.action === 'muted') return decided(finding, 'muted', wide);
    return decided(finding, 'open', null);
  });

  return { findings, bar: barOf(findings), review: review(current, report) };
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
    ? {
      action: override.action,
      editor: override.editor,
      at: override.createdAt,
      note: override.note ?? null,
      // The key that decided this, so *ongedaan maken* can clear that one key and
      // not a wider one. Absent means the page-wide form, as it does on the event.
      ...(namesSection(override) ? { anchorHeading: override.anchorHeading } : {}),
    }
    : null,
});

/**
 * The one event that revokes one decision (ticket 110, round two).
 *
 * It lives beside `decided()` because the key does: that function attaches the key that
 * decided a finding **so that clearing can aim at that one key**, and how to read it back
 * belongs next to how it was written. Two callers ask — `OverrideControl.jsx` for the
 * single finding in front of an editor, and `bulk.mjs` for the ticked pages of a
 * difference — and neither may answer it for itself, or a change to how a mute is cleared
 * lands in one of the two and not the other.
 *
 * A dismissal is keyed on the finding, so it is cleared on the finding. A mute is cleared
 * on the key that made it, section or page-wide: clearing the section where a page-wide
 * mute is what decided the finding would leave that mute standing, and the row would not
 * move.
 *
 * `store` and `page` are the caller's to add — the single control's hook puts the page it
 * is on into every event, and the bulk press names the page per row.
 *
 * @param {ReturnType<typeof decided>} finding  A finding the derivation has decided.
 */
export function clearedEventFor(finding) {
  if (finding.state !== 'muted') {
    return { scope: 'finding', action: 'cleared', findingId: finding.id };
  }

  return {
    scope: 'page-class',
    action: 'cleared',
    class: finding.class,
    ...(namesSection(finding.override) ? { anchorHeading: finding.override.anchorHeading } : {}),
  };
}

/**
 * How many findings a mute would cover, on the snapshot in front of the editor.
 *
 * ADR 0008: the count is the guard. It is what stops a press on the null section
 * from reading as a press on the page, and it is what teaches an editor that the
 * section form is the wrong tool on a page of per-photo captions — with no
 * threshold to argue about.
 *
 * The **key is the argument**, in the same shape the press writes, so the number
 * on the button and the event behind it cannot drift apart. Hidden classes are
 * left out: they are in no bar, so muting them hides nothing.
 *
 * This counts what the mute covers, not what it changes. A finding already
 * dismissed keeps its dismissal, because the finding key is the more specific
 * one — so the number is a ceiling, and it never understates the press.
 *
 * @param {ReturnType<typeof decided>[]} findings  Derived findings, for `shown`.
 * @param {{ class: string, anchorHeading?: string | null }} key
 * @returns {number}
 */
export function muteCoverage(findings, key) {
  const section = namesSection(key);
  return findings.filter((finding) => finding.shown
    && finding.class === key.class
    && (!section || (finding.anchorHeading ?? null) === key.anchorHeading)).length;
}

/**
 * The page bar, from ticket 09.
 *
 * - A **hidden class is in neither** the numerator nor the denominator, or the bar
 *   could never reach zero.
 * - **Nothing leaves the denominator.** It is the shown findings on this snapshot,
 *   full stop. The mute took findings out of it until ADR 0011 withdrew the mute,
 *   and whether something is work at all is now a property of the class alone and
 *   never of a place on a page. So there is no count of findings that are *outside*
 *   the bar for the bar to report beside itself.
 * - A **dismissal enters the numerator**: "I read this and accepted it" is work.
 * - **`contradicted` reads as open.** A claim that did not survive a later
 *   observation has closed nothing.
 *
 * Absolute counts are always carried, because the denominator moves: a genuinely
 * corrected difference leaves the snapshot altogether, so the same page can have
 * fewer open findings and the same percentage.
 *
 * It is exported because ticket 81 draws a bar over a **repeat** — the findings of
 * one difference across the pages it is on. That is a different set of findings and
 * the same four rules, so the rules stay in one place rather than being restated in
 * a component where they could drift from this one.
 *
 * @param {ReturnType<typeof decided>[]} findings
 */
export function barOf(findings) {
  const shown = findings.filter((finding) => finding.shown);
  const count = (/** @type {FindingState} */ state) => shown.filter((f) => f.state === state).length;

  const dismissed = count('dismissed');
  const fixed = count('fixed');
  const contradicted = count('contradicted');
  const denominator = shown.length;

  return {
    closed: dismissed + fixed,
    denominator,
    open: denominator - dismissed - fixed,
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
 * The hash covers the shown classes only (`findingSetHash()`), so a change confined to
 * what the tool does not put up as work does not stale every review on the page.
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

  const totals = { closed: 0, denominator: 0, open: 0, dismissed: 0, fixed: 0, contradicted: 0 };
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
