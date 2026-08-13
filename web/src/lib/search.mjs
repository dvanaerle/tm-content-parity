/**
 * Search over one store's content (ticket 82).
 *
 * An editor types `Bekijk deals >` and sees every finding that holds those words,
 * across every page of the store, with the pages they are on. Before this, the only
 * search was a box that matched a page name.
 *
 * **One index per store, emitted at build time, scanned linearly.** No search library.
 * A store holds a few thousand shown findings, and a linear pass over that many
 * objects is fast enough that a dependency would be paid for nothing. `web/probes/
 * probe-search-index.mjs` is the measurement that says so, and it is what a later
 * reader re-runs before adding one.
 *
 * **Per store only.** Ticket 38 settled that there is no all-stores surface, and a
 * cross-store search is the back door to one. Nothing here takes a list of stores.
 *
 * **Two sources, two freshnesses.** The index is as old as the last build; the notes
 * are live. `searchStore()` answers about the snapshot and `searchNotes()` answers
 * about the log, and they are two functions rather than one merged list, so no caller
 * can present both halves as one moment by accident.
 *
 * **A search composes with the class filter** (ticket 102). The classes are the filter and
 * the term is a search, and the two narrow one result together: `searchStore()` takes the
 * pills and applies them through `repeatsWithClasses()`, the same derivation the two views
 * narrow by. There is no second answer here to what a class filter means.
 *
 * **Search narrows; it moves no count.** The rule ticket 36 pinned holds here as it
 * holds in `view.mjs`: this module returns what is on screen and never what it adds up
 * to. It says how many findings on how many pages — a count *of the result*, in the
 * manner of `prepareRows`' `total` — and no bar, no denominator and no closed count.
 *
 * ## Three decisions that are not obvious from the code
 *
 * Written here because each one is a trap that costs a rewrite to rediscover.
 *
 * **1. The six searchable fields are six, and two of them are the same two columns.**
 * The ticket asks for production text, new-site text, link text, link target, anchor
 * heading and page key. But a finding has only `prod` and `new`, and on a `links` check
 * **those two hold the target** — `linkKey()`'s host-folded string, not words. So the
 * field a match is reported under is decided by the class's check: on a links finding
 * `prod`/`new` are the *link target*, and everywhere else they are the *two texts*.
 * Four names over two columns. Without this split, typing a URL would report a hit in
 * "production text", and typing a sentence would claim to have matched a target.
 *
 * **2. Two fields are why this index is emitted at build time.** If a later reader wonders
 * why the search does not simply reuse the dashboard's array, which the dashboard already
 * has in memory: that array does not hold everything the search looks in.
 *
 * `linkText` is the older half and the sharper case. The anchor text is not on a finding at
 * all — it is on `report.sides.*.links[].text`, in the extract, which is the half
 * `loadSummaries()` throws away. A browser cannot derive it, so the build resolves it by
 * target key. `anchorHeading` is the newer half: ADR 0011 took it off the dashboard's index
 * with the mute that put it there, and it stays a searchable field here because it is a
 * **locator** — *onder "…"* is how an editor finds a difference on a long page, which never
 * had anything to do with the judgement.
 *
 * **3. A search result must not extend `Repeat.on`.** The grouping is ticket 81's
 * `repeatsInStore()` and it is reused rather than rewritten, as this ticket's trap
 * demands. `view.test.mjs` pins `Object.keys(repeat.on[0])` to exactly
 * `['id', 'occurrences', 'page']`, so which field matched is carried on the **repeat**
 * and never on its per-page entries.
 */

import { latestByKey } from '../../../overrides/state.mjs';
import { FINDING_CLASSES } from '../../../compare/vocabulary.mjs';
import { findingsIn, repeatsInStore, repeatsWithClasses } from './view.mjs';

/**
 * One finding, cut to what a search reads.
 *
 * The named trap: **the index must not become the report.** A `PageReport` holds both
 * extracts — 54 MB across the corpus — and shipping it twice is not a search index.
 * These nine fields are the searchable text plus the id, and a tenth has to be argued
 * for in `search.test.mjs` before it is added.
 *
 * @typedef {object} IndexEntry
 * @property {string} id            The finding. A repeat has none, so this is the only
 *                                 identity in the file.
 * @property {string} page          The page key. Opaque, and it can hold a slash.
 * @property {keyof FINDING_CLASSES} class
 * @property {string | null} prod
 * @property {string | null} new
 * @property {string | null} detail
 * @property {string | null} anchorHeading
 * @property {number} occurrences
 * @property {string[]} linkText    The anchor words of the link this finding is about,
 *                                 production's side first. Empty on every finding that
 *                                 is not about a link — an empty list rather than
 *                                 `null`, so every reader scans one shape.
 *
 * @typedef {object} SearchIndex
 * @property {string} store
 * @property {number} pages
 * @property {string} builtAt       The newest report in the store. The finding half of
 *                                 a result is this old, and the note half is live.
 * @property {IndexEntry[]} findings
 */

/**
 * The index for one store, from the reports the build already read.
 *
 * `linkText` is why this runs at build time and not in the browser. A links finding
 * carries the **target** in `prod` and `new` — `linkKey()`'s host-folded string — and
 * the anchor text is nowhere on it. The words an editor types are the words on the
 * page, so they have to come off the extract's link records, and the extract is the
 * half that the dashboard's own finding index throws away.
 *
 * Hidden classes are left out, for the reason ticket 09 keeps them out of the bar: a
 * result that offered them would offer work the log does not count.
 *
 * @param {string} store
 * @param {import('../../../compare/contract.mjs').PageReport[]} reports
 * @returns {SearchIndex}
 */
export function indexStore(store, reports) {
  return reports.reduce(addPage, emptyIndex(store));
}

/**
 * An index with nothing in it yet, to add pages to.
 *
 * The emitter cannot hold a store's reports at once — a full report carries both
 * extracts, and reading them all is the thing `loadSummaries()` refuses to do — so it
 * reads one file, adds it, and lets it go. `indexStore()` is the same accumulator over an
 * array, and one test pins the two paths equal so the streaming one cannot grow a second,
 * divergent merge.
 *
 * @param {string} store
 * @returns {SearchIndex}
 */
export const emptyIndex = (store) => ({ store, pages: 0, builtAt: '', findings: [] });

/**
 * One report's searchable findings, added to the index.
 *
 * `builtAt` is the newest report's, because the whole index is only as fresh as its
 * freshest part is old: a result says *from the snapshot*, and the sentence has to be
 * true of every row in it.
 *
 * @param {SearchIndex} index
 * @param {import('../../../compare/contract.mjs').PageReport} report
 * @returns {SearchIndex}
 */
export function addPage(index, report) {
  // A one-sided page is out of the bar from the first day (ticket 20) and 19 of them in
  // this corpus still carry a finding. Indexing those would put ids in a result the
  // dashboard's derived state has never heard of, and a repeat row is written to throw on
  // a missing one rather than quietly shrink its denominator.
  if (!report.comparable) return index;

  const linkText = linkTextByKey(report);

  for (const finding of report.findings) {
    if (!FINDING_CLASSES[finding.class]?.shown) continue;
    index.findings.push({
      id: finding.id,
      page: report.page,
      class: finding.class,
      prod: finding.prod ?? null,
      new: finding.new ?? null,
      detail: finding.detail ?? null,
      anchorHeading: finding.anchorHeading ?? null,
      occurrences: finding.occurrences ?? 1,
      linkText: isAboutALink(finding.class)
        ? [finding.prod, finding.new].flatMap((key) => linkText.get(key) ?? [])
        : [],
    });
  }

  index.pages += 1;
  if (report.builtAt > index.builtAt) index.builtAt = report.builtAt;
  return index;
}

/**
 * Every anchor text in the page, by the target key the links check compares on.
 *
 * One key can carry several texts: a page that links to the same target from a heading
 * and from a button has two, and both are words an editor might type. So the value is
 * a list, deduplicated — the same words twice would make one finding read as two hits.
 *
 * @param {import('../../../compare/contract.mjs').PageReport} report
 * @returns {Map<string, string[]>}
 */
function linkTextByKey(report) {
  /** @type {Map<string, string[]>} */
  const byKey = new Map();
  for (const side of [report.sides.production, report.sides.new]) {
    for (const link of side.links ?? []) {
      const text = link.text?.trim();
      if (!text) continue;
      const held = byKey.get(link.key);
      if (!held) byKey.set(link.key, [text]);
      else if (!held.includes(text)) held.push(text);
    }
  }
  return byKey;
}

/**
 * The fields a term is matched against, and the names a result reports a hit under.
 *
 * Six, as the ticket asks, over the index's two text columns — see decision 1 above.
 * The order is the order a result lists them in: the page first, because it is where
 * the words are, then the words themselves.
 */
export const SEARCH_FIELDS = ['page', 'prodText', 'newText', 'linkTarget', 'linkText', 'anchorHeading'];

/**
 * Which of the six fields on this entry hold the term.
 *
 * Plain lowercased substring, not tokens: `Bekijk deals >` is what an editor reads on
 * the page, so it is what they type, and the `>` has to survive being searched for. It
 * is also what keeps the named trap shut — a page key can hold a slash, and a substring
 * match over the whole opaque key never splits on one.
 *
 * @param {IndexEntry} entry
 * @param {string} term Folded by this function, so folding it twice is harmless.
 * @returns {string[]} A subset of `SEARCH_FIELDS`, in that order. Empty on no match.
 */
export function matchedFields(entry, term) {
  const needle = fold(term);
  if (!needle) return [];

  const holds = (/** @type {string | null} */ value) =>
    typeof value === 'string' && value.toLowerCase().includes(needle);

  // The two columns are read under one name or two, by the class's check. This is
  // decision 1, and it is the whole reason the field list is six names and not four.
  const target = isAboutALink(entry.class);

  return SEARCH_FIELDS.filter((field) => {
    switch (field) {
      case 'page': return holds(entry.page);
      case 'prodText': return !target && holds(entry.prod);
      case 'newText': return !target && holds(entry.new);
      case 'linkTarget': return target && (holds(entry.prod) || holds(entry.new));
      case 'linkText': return entry.linkText.some(holds);
      case 'anchorHeading': return holds(entry.anchorHeading);
      default: return false;
    }
  });
}

/**
 * What one store's index answers about a term.
 *
 * The rows are **repeats** and not findings, which is this ticket's second trap: a term
 * matching one difference that is on 329 pages must not read as 329 unrelated results.
 * The grouping is ticket 81's `repeatsInStore()`, reused rather than written a second
 * time, so a search row and a repeats row are the same row.
 *
 * The two numbers are a count of the result and nothing more: how many findings, on how
 * many pages. Search narrows and moves no count, so there is no bar here, no denominator
 * and no closed count.
 *
 * @param {object} args
 * @param {SearchIndex} args.index
 * @param {string} args.term
 * @param {(id: string) => import('../../../overrides/state.mjs').FindingState} [args.stateOf]
 *   The log's answer about one finding. It defaults to `open`, which is what an
 *   unconnected log knows: no decision has been read, so nothing is closed yet.
 * @param {boolean} [args.includeClosed] *Inclusief afgesloten*.
 * @param {string[]} [args.classes] The class pills that are on (ticket 102). Empty means
 *   every class, which is what an untouched filter says — not a filter matching nothing.
 *   It is a second narrowing over the same result and not a second search: the term
 *   decides what matched, the classes decide which of it is on screen.
 * @returns {{
 *   repeats: (import('./view.mjs').Repeat & { fields: string[] })[],
 *   total: number,
 *   pages: number,
 *   matchedRepeats: number,
 * }}
 */
export function searchStore({
  index, term, stateOf = () => 'open', includeClosed = false, classes = [],
}) {
  /** @type {Map<string, IndexEntry[]>} */
  const byPage = new Map();
  /** @type {Map<string, string[]>} */
  const fieldsById = new Map();

  for (const entry of index.findings) {
    const fields = matchedFields(entry, term);
    if (fields.length === 0) continue;
    if (!includeClosed && !isActive(stateOf(entry.id))) continue;
    fieldsById.set(entry.id, fields);
    const held = byPage.get(entry.page);
    if (held) held.push(entry);
    else byPage.set(entry.page, [entry]);
  }

  const pages = [...byPage].map(([page, findings]) => ({ store: index.store, page, findings }));

  // The matched fields ride **on the repeat** — decision 3. The union over its
  // findings, because the page key is a searchable field and the members differ in
  // exactly that one: a term can be in one page's key and not another's.
  const matchedRepeats = repeatsInStore(pages).map((repeat) => ({
    ...repeat,
    fields: SEARCH_FIELDS.filter(
      (field) => repeat.on.some((one) => fieldsById.get(one.id)?.includes(field)),
    ),
  }));

  // The class pills, applied **after** the grouping and through the derivation the two
  // views already narrow by (ticket 102). After, because a search row is a repeat and
  // must stay one: narrowing the entries first and grouping the survivors would be a
  // second place for what a repeat is. It is safe here — a repeat's key holds its class,
  // so every member of one shares it and no repeat is ever half-filtered.
  const repeats = repeatsWithClasses(matchedRepeats, classes);

  // Both numbers are counted off **this** list, so they cannot disagree about what they
  // are counting — the narrowed list is what is drawn, so it is what is counted, and the
  // page count comes off the rows rather than off the wider bucketing above.
  // `findingsIn` is the counter the repeats footer uses, asked here rather than
  // rewritten, for the same reason the grouping is.
  //
  // `matchedRepeats` is the other half of the amber strip's sentence — *n van m
  // verschillen*, in the words the two views say it. It counts what the term found
  // before the pills cut it, so the strip describes the filter and not the term. Its
  // unit is in its name on purpose: `total` beside it counts **findings**, and two
  // numbers of two units under one vague word is the doubled figure CONTEXT.md forbids.
  return {
    repeats,
    total: findingsIn(repeats),
    pages: new Set(repeats.flatMap((repeat) => repeat.on.map((one) => one.page))).size,
    matchedRepeats: matchedRepeats.length,
  };
}

/**
 * The notes in the log that hold the term — the other half of the answer, and the other
 * freshness.
 *
 * A note is not in the index and cannot be: it is written in the log after the build, so
 * indexing it would be indexing a moment that has already passed. It is filtered from the
 * events the store page has already loaded, which makes this half as new as the last read
 * while the finding half is as old as the last build.
 *
 * That is why it is a second function and not a merged list. `live` is on the result so a
 * caller drawing both halves has to say which is which — presenting them as one moment is
 * what this ticket forbids, and a shape that cannot describe itself is how it would happen
 * by accident.
 *
 * There is no page-note feature in the log yet: `note` is the sentence an editor gives
 * when dismissing or muting, and a page review can carry one too. Those are the notes
 * there are, so those are the notes searched.
 *
 * @param {object} args
 * @param {import('../../../overrides/state.mjs').OverrideEvent[]} args.events
 * @param {string} args.term
 * @returns {{ live: true, notes: import('../../../overrides/state.mjs').OverrideEvent[] }}
 */
export function searchNotes({ events, term }) {
  const needle = fold(term);
  if (!needle) return { live: true, notes: [] };

  // Only the events that still stand. The table is append-only, so the words an editor
  // withdrew are still in it, and returning them would offer a reason for a decision
  // that has since been taken back. `latestByKey()` is the log's own answer to which
  // event counts, so search asks it rather than deciding for itself.
  const notes = [...latestByKey(events).values()]
    .filter((one) => one.note?.toLowerCase().includes(needle))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { live: true, notes };
}

/**
 * Whether this finding is still work, in the log's own terms.
 *
 * `dismissed` and `fixed` are what `barOf` counts as closed, and they are the whole of
 * what an editor is not looking for. A `contradicted` claim is a fix the newest
 * observation did not agree with, and the bar reads it as open, so search does too — as
 * does the mute, which after ADR 0011 closes nothing and takes nothing out of the
 * denominator. Search asks the bar's question rather than forming a second opinion: a
 * finding that is open in the bar must be findable by the search meant to find it.
 *
 * @param {import('../../../overrides/state.mjs').FindingState} state
 */
const isActive = (state) => state !== 'dismissed' && state !== 'fixed';

/**
 * A term and a field, folded to the one form they are compared in.
 *
 * The two searches fold the same way because they answer about the same typing. An empty
 * string is what an untouched box holds, and both callers read it as *no search* rather
 * than as a term that matches everything.
 *
 * @param {string} text
 */
const fold = (text) => text.trim().toLowerCase();

/**
 * Whether `prod` and `new` on this class hold a link target rather than words.
 *
 * @param {keyof FINDING_CLASSES} cls
 */
const isAboutALink = (cls) => FINDING_CLASSES[cls]?.check === 'links';
