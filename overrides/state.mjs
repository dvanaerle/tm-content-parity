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

import { visibilityOf } from '../compare/vocabulary.mjs';
import { isPriority, PRIORITIES } from '../shared/priorities.mjs';

/**
 * One row of the append-only `overrides` table, in the shape the port hands over.
 *
 * The unions below are what the app **writes**. The table is append-only and older
 * than they are, so it also holds shapes they do not name: eleven `page-class` rows
 * carrying the withdrawn action of ADR 0011. Those rows still load — the port
 * maps them and `eventKey()` gives them a key of their own — and the derivation
 * simply never looks that key up. Skipping what it no longer understands is the
 * contract here; failing on it would make eleven rows unreadable for ever.
 *
 * @typedef {object} OverrideEvent
 * @property {string} [id]
 * @property {string} createdAt      ISO 8601. Latest per key wins; events may arrive unsorted.
 * @property {string} editor         A name from `localStorage`. There is no login.
 * @property {'finding' | 'page'} scope
 * @property {'fixed' | 'dismissed' | 'reviewed' | 'cleared' | 'prioritised' | 'noted'} action
 * @property {string} store
 * @property {string} page
 * @property {string | null} [findingId]      When `scope === 'finding'`.
 * @property {string | null} [class]          Only on the historical rows above.
 * @property {string | null} [observationId]  What a `fixed` claim was made against.
 * @property {string | null} [findingSetHash] On `reviewed`, for staleness.
 * @property {string | null} [note]           Required on `dismissed`; the page note on `noted`.
 * @property {import('../shared/priorities.mjs').Priority | null} [priority]
 *   On `prioritised`. One of the closed list, or `null`, which is how the annotation is
 *   cleared. The two annotations of ticket 83 are the only `page`-scope actions that carry
 *   a value, and they are keyed apart from the review — see `eventKey()`.
 */

/** @typedef {'open' | 'dismissed' | 'fixed' | 'contradicted'} FindingState */

/**
 * The append-only table is keyed on `(scope, store, page, finding_id ?? class)`, and
 * `overrides_current` takes the latest row per key.
 *
 * **The view's key carries one column more than this one** — `anchor_heading_slot` — and
 * the two still agree on everything the app writes, because nothing sets `names_section`
 * any more, so the slot is the constant `*page` on every new row and cannot separate two
 * of them. On the eleven retired `page-class` rows the view can split what this merges.
 * That is not a drift to fix: those rows are only ever reduced and sorted here, and no
 * lookup asks for their key. Adding the slot back would be carrying a column for them.
 *
 * @param {OverrideEvent} event
 * @returns {string}
 */
export function eventKey(event) {
  const key = event.scope === 'finding' ? event.findingId : (pageScopeKey(event) ?? event.class);
  return [event.scope, event.store, event.page, key ?? ''].join('|');
}

/**
 * Which of the page's three things an event is about (ticket 83).
 *
 * The page scope carried exactly one key until this ticket, so the review owned it
 * outright. Two annotations arriving on the same scope have to be keyed apart from it or
 * `latestByKey()` would let a priority be the newest event on the review's key — and
 * `review()` reads null the moment that event is not a `reviewed`, so annotating a page
 * would have withdrawn the review of it.
 *
 * The review's own key term stays the **empty string** it has always been, so every row
 * already on disk keeps the key it was written under and `cleared` goes on keying to the
 * review, which is the one thing it has ever revoked on this scope.
 */
const PAGE_KEY = { prioritised: 'priority', noted: 'note' };

/** @param {OverrideEvent} event */
const pageScopeKey = (event) => (event.scope === 'page' ? (PAGE_KEY[event.action] ?? '') : null);

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
const isLater = (/** @type {OverrideEvent} */ a, /** @type {OverrideEvent} */ b) =>
  a.createdAt === b.createdAt ? String(a.id ?? '') > String(b.id ?? '') : a.createdAt > b.createdAt;

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

  // **One key reaches one finding**, and it is the finding's own. ADR 0011 withdrew the
  // override keyed on a class, so there is no second, wider key underneath this one — and
  // with it went the precedence order between the two, and the fall-through a `cleared`
  // finding override used to have onto the wider key. A cleared finding is now simply open.
  const findings = report.findings.map((finding) => {
    const own = current.get(eventKey({ ...place, scope: 'finding', findingId: finding.id }));

    if (own?.action === 'dismissed') return decided(finding, 'dismissed', own);
    if (own?.action === 'fixed') {
      const state = isContradicted(own, observationId) ? 'contradicted' : 'fixed';
      return decided(finding, state, own);
    }
    return decided(finding, 'open', null);
  });

  return {
    findings,
    bar: barOf(findings),
    review: review(current, report),
    annotations: annotationsOf(current, report),
  };
}

/**
 * The two annotations a page carries (ticket 83): a priority from a closed list, and a
 * free-text note. Both describe the page and neither describes a finding.
 *
 * @param {Map<string, OverrideEvent>} current
 * @param {import('../compare/contract.mjs').PageReport} report
 */
function annotationsOf(current, report) {
  const place = { scope: /** @type {const} */ ('page'), store: report.store, page: report.page };
  /** @param {'prioritised' | 'noted'} action */
  const held = (action) => current.get(eventKey({ ...place, action }));

  // Each annotation is read off **its own key**, so a note cannot be picked up from a
  // dismissal and a priority cannot be picked up from anything. The `note` column is
  // shared with the reason a dismissal carries; the key is what tells the two apart.
  return {
    priority: held('prioritised')?.priority ?? null,
    note: held('noted')?.note || null,
  };
}

/**
 * @param {import('../compare/contract.mjs').Finding} finding
 * @param {FindingState} state
 * @param {OverrideEvent | null} override
 */
const decided = (finding, state, override) => ({
  ...finding,
  state,
  // The class's visibility, carried on the finding so that every reader of a derived
  // finding — the bar, the ledger's toggle, a landing — asks the vocabulary once and
  // in one place. `work` counts, `information` renders, `diagnostic` is noise.
  visibility: visibilityOf(finding.class),
  override: override
    ? {
        action: override.action,
        editor: override.editor,
        at: override.createdAt,
        note: override.note ?? null,
      }
    : null,
});

/**
 * The one event that revokes one decision (ticket 110, round two).
 *
 * **Two callers must write the same event**, and that is the whole of why this is a
 * function: `OverrideControl.jsx` for the single finding in front of an editor, and
 * `bulk.mjs` for the ticked pages of a difference. Neither may answer it for itself.
 *
 * It returns one shape now. A dismissal is keyed on the finding, so it is cleared on the
 * finding, and the override ADR 0011 withdrew was the only other thing a clearing could
 * ever aim at — so this no longer reads a key back off the finding, because `decided()`
 * no longer attaches one. That narrowing is **not** a reason to inline it into the two
 * callers: the next change to what a clearing names must have one place to land, not two,
 * and it was made one function in ticket 110 precisely because it had been two.
 *
 * `store` and `page` are the caller's to add — the single control's hook puts the page it
 * is on into every event, and the bulk press names the page per row.
 *
 * @param {ReturnType<typeof decided>} finding  A finding the derivation has decided.
 */
export function clearedEventFor(finding) {
  return { scope: 'finding', action: 'cleared', findingId: finding.id };
}

/**
 * The two events an annotation is written as (ticket 83).
 *
 * They are functions for the reason `clearedEventFor()` is one: **two callers must write
 * the same event** — the control on the page in front of an editor, and the bulk press
 * over the ticked pages of the store list. Neither may answer it for itself, and the
 * validation below must not be a thing one of the two remembers to do.
 *
 * `store` and `page` are the caller's to add. The single control's hook puts the page it
 * is on into every event; the bulk press names the page per row.
 *
 * **Clearing is a new event carrying no value**, never an edit and never a delete. It is
 * deliberately not the `cleared` action: on `scope: 'page'` that already means *withdraw
 * the review*, and reusing it for three annotation families on one scope would make one
 * action mean three things and need a fourth column to say which one it meant.
 *
 * @param {import('../shared/priorities.mjs').Priority | null} priority  `null` clears it.
 */
export function priorityEventFor(priority) {
  if (priority !== null && !isPriority(priority)) {
    throw new Error(
      `Not a priority: ${JSON.stringify(priority)}. ` +
        `The list is ${PRIORITIES.join(', ')}, and it is closed.`,
    );
  }
  return { scope: 'page', action: 'prioritised', priority };
}

/**
 * A page note is **optional and explains nothing in particular**, which is the whole of
 * how it differs from the note a dismissal carries: that one is mandatory and explains one
 * judgement about two strings. So there is no non-blank check here — an empty note is how
 * an editor takes the note back.
 *
 * @param {string} note
 */
export function noteEventFor(note) {
  return { scope: 'page', action: 'noted', note: note.trim() };
}

/**
 * The page bar, from ticket 09.
 *
 * - **Only `work` is in the bar.** Anything else is in neither the numerator nor the
 *   denominator, or the bar could never reach zero. Since ticket 75 that is one word
 *   on the class and not a boolean: `information` renders beside the work and counts
 *   nowhere, `diagnostic` stays behind the noise toggle.
 * - **Nothing leaves the denominator.** It is the `work` findings on this snapshot,
 *   full stop. The one override that used to take findings out of it was withdrawn by
 *   ADR 0011, and whether something is work at all is now a property of the class alone
 *   and never of a place on a page. So there is no count of findings that are *outside*
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
  const work = findings.filter((finding) => finding.visibility === 'work');
  const count = (/** @type {FindingState} */ state) => work.filter((f) => f.state === state).length;

  const dismissed = count('dismissed');
  const fixed = count('fixed');
  const contradicted = count('contradicted');
  const denominator = work.length;

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
 * The hash covers every finding on the page (`findingSetHash()`), in any class. Ticket 118
 * took the visibility filter out so that a vocabulary edit cannot stale a review: the
 * question the flag answers is whether the **page** changed, and a class is not the page.
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
