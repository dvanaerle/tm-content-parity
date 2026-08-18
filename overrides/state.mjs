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

/** @typedef {'open' | 'needs-attention' | 'closed'} Bucket */

/**
 * The three groups a finding is read in (ticket 80), over the four states above.
 *
 * A bucket is **a grouping and not a state**. Nothing is stored on a finding to put it in
 * one, no column carries it, and this map is the whole of the rule — which is why it is a
 * pure function here rather than a `switch` in whichever component needed it first.
 *
 * **Needs attention is `contradicted`, and nothing else.** A page review that went stale
 * is a fact about a *page*, so it stays a badge on the page: two scopes in one bucket
 * would count one thing twice. The proposal that started ticket 80 listed "Fix not
 * verified" beside contradicted as if they were two things, and they are one — a fix
 * claim the current snapshot disagrees with.
 *
 * The third bucket is **Closed** and not "Resolved". `CONTEXT.md` retires that word for
 * hiding the difference between a claim of fact and a judgement, and since 2026-08-13 the
 * stopword guard in `web/src/interface-language.test.mjs` enforces it.
 *
 * @type {Record<FindingState, Bucket>}
 */
const BUCKET = {
  open: 'open',
  contradicted: 'needs-attention',
  dismissed: 'closed',
  fixed: 'closed',
};

/**
 * The three buckets, in the order they are read in — worst first and Closed last, which is
 * the reading order on the dashboard and the ledger alike.
 *
 * It lives here rather than beside the interface words because it is **the derivation's own
 * enumeration**: every counter below is built from it, so a fourth bucket cannot be added
 * to `BUCKET` and then missed by a zero literal written out by hand somewhere else.
 * `web/src/lib/buckets.mjs` re-exports it and adds the words.
 *
 * @type {Bucket[]}
 */
export const BUCKETS = ['open', 'needs-attention', 'closed'];

/**
 * A fresh tally with every bucket at zero, which is what "total over the states" needs on
 * the counting side: a bucket nobody counted still has to be a number.
 *
 * @returns {Record<Bucket, number>}
 */
export function emptyBuckets() {
  return Object.fromEntries(BUCKETS.map((bucket) => [bucket, 0]));
}

/**
 * The grouping is **total over the states, and says so out loud**. ADR 0012 asks a
 * regrouping to cover everything it regroups, and `CONTEXT.md` promises that a fifth state
 * cannot fall silently into Closed. A bare lookup kept neither promise: an unmapped state
 * returned `undefined`, and the caller then added one to a bucket named `undefined` and
 * left the three real counts reading `NaN` — a number that says how much work is left,
 * silently saying nothing. So an unmapped state is a throw and not a gap.
 *
 * @param {FindingState} state
 * @returns {Bucket}
 */
export function bucketOf(state) {
  const bucket = BUCKET[state];
  if (!bucket) throw new Error(`No bucket for state '${state}' — the grouping must be total.`);
  return bucket;
}

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
 * @param {Record<string, string[]>} [input.closedWith]  Per finding id, the ids the run
 *   log says stopped being seen in the run that first saw it (ticket 78). Display only.
 */
export function derivePageState({
  report,
  events,
  observationId = report.observationId,
  closedWith = {},
}) {
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
    buckets: bucketsOf(findings),
    review: review(current, report),
    annotations: annotationsOf(current, report),
    history: historyOf(current, place, closedWith),
  };
}

/**
 * What an editor decided about the ids that closed as each finding appeared (ticket 78).
 *
 * It is **beside** `findings` and never on them, because the decision belongs to an id
 * that is not on the page. Held on a finding it would be one field away from a bar, a
 * bucket and a badge — and a note that moves a count has claimed the two ids are one
 * finding, which is the whole of what ADR 0004 refuses.
 *
 * It reads `current`, the derivation's own latest-per-key map, so it walks no event list
 * of its own: the note reports the decision that stands, and a dismissal an editor took
 * back is not one. A closed id with nothing decided about it yields nothing at all —
 * *something closed here* is not a fact an editor can use.
 *
 * A **fix claim is taken as made** and never contradicted here. Contradiction is a later
 * observation that still gives the finding, and this id is not in the snapshot to be
 * given: there is nothing for a run to disagree with.
 *
 * @param {Map<string, OverrideEvent>} current
 * @param {{ store: string, page: string }} place
 * @param {Record<string, string[]>} closedWith
 */
function historyOf(current, place, closedWith) {
  /** @type {Record<string, { count: number, decision: ReturnType<typeof judgement> | null }>} */
  const history = {};
  for (const [id, closed] of Object.entries(closedWith)) {
    const decided = closed
      .map((one) => current.get(eventKey({ ...place, scope: 'finding', findingId: one })))
      .filter(decides);

    // Where several closed at once the count is the answer and the decision is not. One
    // of several is a pick, a pick is a match, and the note asserts no identity.
    if (decided.length > 0) {
      history[id] = {
        count: decided.length,
        decision:
          decided.length === 1 ? judgement(/** @type {OverrideEvent} */ (decided[0])) : null,
      };
    }
  }
  return history;
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
  // in one place. `work` counts, `information` renders, `diagnostic` is what a rule saw.
  visibility: visibilityOf(finding.class),
  override: override ? judgement(override) : null,
});

/**
 * Whether an event on a finding records a decision. `cleared` revokes one and is not one,
 * which is what makes a dismissal an editor took back invisible to the history note.
 *
 * @param {OverrideEvent | undefined} event
 */
const decides = (event) => event?.action === 'dismissed' || event?.action === 'fixed';

/**
 * One decision, as every surface that draws one reads it. `Attribution.jsx` is the shape:
 * the action, the editor and the day, and the reason under them where there is one.
 *
 * It is a function because there are two callers and they name different ids — a finding's
 * own decision, and the decision on an id that closed (ticket 78). Two copies of the four
 * fields is how one of them comes to omit the date, which is what `Attribution.jsx` was
 * written to end.
 *
 * @param {OverrideEvent} event
 */
const judgement = (event) => ({
  action: event.action,
  editor: event.editor,
  at: event.createdAt,
  note: event.note ?? null,
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
 *   nowhere, `diagnostic` stays behind the diagnostics control.
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
 * The three counts the dashboard and the ledger group by, over one set of findings.
 *
 * It counts the **`work` findings only**, which is the denominator `barOf()` already
 * uses, so the three numbers add up to the bar they are drawn beside rather than to some
 * other total. An `information` finding is in no bucket at all.
 *
 * This is a **reading of the same states the bar reads** and never a second arithmetic:
 * Open plus Needs attention is the bar's own `open`, because a contradicted claim reads
 * as open there too. A bucket therefore does not determine the bar — an absent finding is
 * Closed and is in neither of its terms.
 *
 * Keyed on the bucket names themselves so there is one spelling of each, rather than a
 * camel-cased second set for callers to translate between.
 *
 * @param {ReturnType<typeof decided>[]} findings
 * @returns {Record<Bucket, number>}
 */
export function bucketsOf(findings) {
  const counts = emptyBuckets();
  for (const finding of findings) {
    if (finding.visibility === 'work') counts[bucketOf(finding.state)] += 1;
  }
  return counts;
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
  // Summed over **findings, never over pages** — the same rule the bar beside it obeys, so
  // a page with one casing nit does not weigh as much as a page with forty.
  const buckets = emptyBuckets();
  let reviewed = 0;
  let reviewedFresh = 0;

  for (const page of pages) {
    for (const key of Object.keys(totals)) totals[key] += page.bar[key];
    for (const key of Object.keys(buckets)) buckets[key] += page.buckets[key];
    if (page.review) {
      reviewed += 1;
      if (page.review.fresh) reviewedFresh += 1;
    }
  }

  return { pages, bar: totals, buckets, pagesTotal: pages.length, reviewed, reviewedFresh };
}

/**
 * The events of the named stores, and no others (ticket 03).
 *
 * Since a bulk decision may cross a language block, a dashboard reads the log of **two**
 * stores: a press writes in both, and a repeat row has to say what is already decided over
 * there. Every derivation downstream is safe under that widening, because each one is given
 * the reports it is about and `derivePageState()` matches on `event.store` — so a `be` event
 * cannot land on an `nl` page's bar however wide the list of events is.
 *
 * The **log itself** is the exception, and it has one reader: searching the notes. A note is
 * a sentence an editor wrote, and that half filters on the words and on the page scope and
 * never on a store, so handing it both stores' events answers `nl`'s search with notes
 * written on `be` pages. `search.mjs` opens by refusing exactly that — *per store only* — and
 * a cross-store search is the back door to a cross-store surface.
 *
 * So this narrows the log back to the store whose screen it is, and it lives here, beside the
 * derivations, because it is the same question they ask of the same field: **which store is
 * this event about**. `null` is passed through rather than coerced. A read in flight is not an
 * empty log, which is this module's first rule and the one its one bug was about.
 *
 * @param {object} input
 * @param {OverrideEvent[] | null} input.events
 * @param {Iterable<string>} input.stores
 * @returns {OverrideEvent[] | null}
 */
export function eventsOfStores({ events, stores }) {
  if (events === null) return null;
  const named = new Set(stores);
  return events.filter((event) => named.has(event.store));
}
