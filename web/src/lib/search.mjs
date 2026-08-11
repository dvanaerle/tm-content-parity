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

/** Whether `prod` and `new` on this class hold a link target rather than words. */
const isAboutALink = (/** @type {string} */ cls) => FINDING_CLASSES[cls]?.check === 'links';
