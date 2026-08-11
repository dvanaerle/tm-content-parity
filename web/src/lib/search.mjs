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
 * **2. `linkText` is the whole reason this index is emitted at build time.** Every other
 * searchable field is already in `loadSummaries()`'s finding index, which the dashboard
 * has in memory. The anchor text is not on a finding at all — it is on
 * `report.sides.*.links[].text`, in the extract, which is the half `loadSummaries()`
 * throws away. A browser cannot derive it, so the build resolves it by target key. If a
 * later reader wonders why the search does not simply reuse the dashboard's array: this
 * one field is why.
 *
 * **3. A search result must not extend `Repeat.on`.** The grouping is ticket 81's
 * `repeatsInStore()` and it is reused rather than rewritten, as this ticket's trap
 * demands. `view.test.mjs` pins `Object.keys(repeat.on[0])` to exactly
 * `['id', 'occurrences', 'page']`, so which field matched is carried on the **repeat**
 * and never on its per-page entries.
 */

import { FINDING_CLASSES } from '../../../compare/vocabulary.mjs';
import { repeatsInStore } from './view.mjs';

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
 * @property {string} class
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
  /** @type {IndexEntry[]} */
  const findings = [];
  let builtAt = '';

  for (const report of reports) {
    if (report.builtAt > builtAt) builtAt = report.builtAt;
    const linkText = linkTextByKey(report);

    for (const finding of report.findings) {
      if (!FINDING_CLASSES[finding.class]?.shown) continue;
      findings.push({
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
  }

  return { store, pages: reports.length, builtAt, findings };
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
  const needle = term.trim().toLowerCase();
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
 * @returns {{
 *   repeats: (import('./view.mjs').Repeat & { fields: string[] })[],
 *   total: number,
 *   pages: number,
 * }}
 */
export function searchStore({ index, term, stateOf = () => 'open', includeClosed = false }) {
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
  const repeats = repeatsInStore(pages).map((repeat) => ({
    ...repeat,
    fields: SEARCH_FIELDS.filter(
      (field) => repeat.on.some((one) => fieldsById.get(one.id)?.includes(field)),
    ),
  }));

  // Both numbers are counted off **this** list, so they cannot disagree about what
  // they are counting — the same reason `Repeats.jsx` sums its own rows rather than
  // taking a total from elsewhere.
  return {
    repeats,
    total: repeats.reduce((sum, repeat) => sum + repeat.on.length, 0),
    pages: byPage.size,
  };
}

/**
 * Whether this finding is still work, in the log's own terms.
 *
 * `dismissed` and `fixed` are what `barOf` counts as closed, and `muted` is what it
 * takes out of the denominator — none of the three is work an editor is looking for.
 * A `contradicted` claim is a fix the newest observation did not agree with, and the bar
 * reads it as open, so search does too. It asks the same question rather than forming a
 * fifth opinion: a finding that is open in the bar must be findable by the search meant
 * to find it.
 *
 * @param {import('../../../overrides/state.mjs').FindingState} state
 */
const isActive = (state) => state === 'open' || state === 'contradicted';

/** Whether `prod` and `new` on this class hold a link target rather than words. */
const isAboutALink = (/** @type {string} */ cls) => FINDING_CLASSES[cls]?.check === 'links';
