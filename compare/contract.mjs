/**
 * The data contract between `crawl/`, `compare/`, `web/` and `api/`.
 *
 * Ticket 01 fixes the finding id, ticket 02 the classes and the normalisation
 * tiers, ticket 05 the link classes, ticket 06 the image classes.
 */

import { createHash, randomUUID } from 'node:crypto';
import { STORES } from './vocabulary.mjs';

/**
 * The class vocabulary lives in `vocabulary.mjs` and is re-exported here, so a
 * Node consumer still has one import site for the whole contract. The browser
 * imports `vocabulary.mjs` directly: `findingId()` needs `node:crypto`, and a
 * Vite build of an island that reaches this file fails on that import. Ids are
 * made in `compare/`, never in the browser.
 */
export {
  CHECKS,
  FINDING_CLASSES,
  isWork,
  STORES,
  VISIBILITIES,
  visibilityOf,
} from './vocabulary.mjs';

/** @typedef {import('./vocabulary.mjs').Store} Store */

/** @typedef {import('./vocabulary.mjs').Side} Side */

/** @typedef {import('./vocabulary.mjs').Check} Check */

/** @typedef {import('./vocabulary.mjs').FindingClass} FindingClass */

/** @typedef {import('./vocabulary.mjs').Visibility} Visibility */

/**
 * One content unit inside the content boundary, in document order. This is the
 * content outline and the diff input. It is one structure, not two. `CONTEXT.md`
 * gives the word and `docs/adr/0002` gives the decision.
 *
 * Ticket 67: a unit is a block, and a block folds the `a` and the `button` inside
 * it. A nested block still breaks it. So a unit is no longer one HTML element, and
 * one element is no longer at most one unit.
 *
 * @typedef {object} ContentUnit
 * @property {number} index         Position in document order. Ticket 34 put text,
 *                                  images and links on **one** counter, so this is
 *                                  no longer the position in `elements` as well.
 *                                  A folded anchor makes no unit and keeps its own
 *                                  position for its link record.
 * @property {string} tag           The tag that emitted the unit, which is the block,
 *                                  never a tag the block folded.
 * @property {'heading' | 'text' | 'cta'} kind  `cta` is a label only, and ticket 67
 *                                  derives it from the content: a unit whose whole
 *                                  text is one anchor or one button, whatever tag
 *                                  emitted it. All anchors still count.
 * @property {number | null} level  1 to 6 for a heading, else null.
 * @property {string} raw
 * @property {string} norm          Tier-1 text. Letter case and trailing punctuation stay.
 */

/**
 * @typedef {object} LinkRecord
 * @property {number} index         Position in document order, on the same counter as
 *                                  `ContentUnit` and `ImageRecord` (ticket 34). An
 *                                  anchor's words and its target share one position.
 * @property {string} href          The href as the page sends it.
 * @property {string} url           Resolved and absolute.
 * @property {string} key           Target identity: the two hosts of the page folded to one
 *                                  token, path lowercased, trailing slash removed, query kept,
 *                                  fragment dropped.
 * @property {string} text          The anchor text. The content view owns it, not the Links tab.
 * @property {boolean} internal
 */

/**
 * Ticket 34 adds `index` and nothing else. Ticket 06's rules are untouched: the
 * dedupe stays, the basename key stays, the set comparison stays, and `index` is
 * **not** in the finding id — so no id moves and no override detaches.
 *
 * @typedef {object} ImageRecord
 * @property {number} index         Position in document order. For a deduplicated
 *                                  record it is the **first** occurrence.
 * @property {string} key           The basename, lowercased, with a true size suffix
 *                                  (`-1292x729`) removed. Never a bare `_N`.
 * @property {string} src
 * @property {string | null} alt    `null` if the attribute is absent. An empty alt is
 *                                  compared for parity only.
 * @property {string | null} fullSrc The target of the opening link that wraps this image,
 *                                  as the page sends it. Production's `src` is a resized
 *                                  variant and that anchor is the only place the original
 *                                  url appears; the anchor makes no link record, so the
 *                                  url is carried here or lost. `null` when no opening
 *                                  link wraps the image.
 */

/**
 * @typedef {object} PageMeta
 * @property {string | null} title
 * @property {string | null} description
 * @property {string | null} canonical
 * @property {boolean} noindex
 * @property {string | null} h1
 */

/**
 * What one entry of `shared/excluded-regions.mjs` did on **one page**. The entry
 * is the rule; this is the occurrence. Ticket 63: an exclusion is visible on the
 * page it cut, never silent.
 *
 * @typedef {object} RegionRemoval
 * @property {string} selector
 * @property {'non-editorial' | 'legacy-only'} kind
 * @property {string} reason    The prose the web build shows.
 * @property {number} matches   How many times the selector matched inside the boundary.
 * @property {number} units     Content units the matches held, counted before removal.
 */

/**
 * Numbers that explain a page, and that must never become a finding. Ticket 06
 * counts the new site's 76 Alpine-bound icons here: they carry no identity, so
 * they cannot be matched, missed or fixed.
 *
 * Ticket 63 adds the regions. `regionsExcluded` is empty on a page no entry
 * matched, so a region that stops matching reads as a change and not as absence.
 *
 * Ticket 69 adds `hiddenAtViewport`. It is a count and not a list, because the
 * conventions are markup and not a scope decision: a reader asks how much of the
 * page the chosen width dropped, never which utility class did it.
 *
 * @typedef {object} PageDiagnostics
 * @property {number} imagesWithoutSrc
 * @property {RegionRemoval[]} regionsExcluded
 * @property {number} unitsExcluded  Sum of `units` over `regionsExcluded`.
 * @property {{ matches: number, units: number }} [hiddenAtViewport]  Absent on an
 *   extract written before ticket 69, which reads as "nothing dropped here".
 */

/**
 * What `crawl/` gives for one URL. `compare/` reads nothing else.
 *
 * @typedef {object} PageExtract
 * @property {Store} store
 * @property {string} page          The page key. It is the NL url key on a page that
 *                                  production declares in Dutch, and `(store)path` on
 *                                  a page with no `nl-NL` alternate. More than half of
 *                                  the pages are of the second kind (ticket 53). Every
 *                                  reader treats it as an opaque string, with one named
 *                                  exception: `shared/page-key.mjs` owns the shape, and
 *                                  it is where `crawl/` writes the form and `compare/`
 *                                  reads it back (ticket 54).
 * @property {Side} side
 * @property {string} url
 * @property {number} status
 * @property {'main' | 'body'} boundary  `body` says that the page has no `<main>`.
 * @property {string | null} pageType    From the `<body class>`, read with a regex on the
 *                                       raw HTML, because the parser drops the tag.
 * @property {ContentUnit[]} elements
 * @property {LinkRecord[]} links
 * @property {ImageRecord[]} images
 * @property {PageMeta} meta
 * @property {string} markdown      A rendering for reading and export. Never the diff spine.
 * @property {PageDiagnostics} diagnostics
 * @property {string} fetchedAt     ISO 8601.
 */

/**
 * Where a finding is on **one** side, and what a link should aim at to get there.
 *
 * The two fields are tried in order, best first. `text` is the finding's own literal
 * words as that side renders them — the closest a link can get. `heading` is the
 * section it sits in, which is as close as a link target or an image key can get,
 * because neither is words on the page. When both are null the link opens the page
 * with no fragment, which is what a finding above the page's first heading gets: it
 * is in the opening block by definition, so the top of the page is near enough, and
 * a bare url can never be a dead one.
 *
 * @typedef {object} FindingLocation
 * @property {string | null} heading  The nearest heading before it, this side's wording.
 * @property {string | null} text     Its own words, literal — never the normalisation.
 */

/**
 * One location per side, `null` where the finding is not on that side **at all** — a
 * paragraph production has and the new site does not is not on the new site to be
 * scrolled to, so that side offers no link rather than a link to the wrong place.
 *
 * That distinction is why this replaced a bare pair of headings. A null heading meant
 * two different things at once — *not on this side* and *above the first heading* —
 * and the second reading was served the first's answer, so 1,522 rows offered no link
 * at all. The side entry now carries absence and the fields carry precision.
 *
 * @typedef {object} FindingLocations
 * @property {FindingLocation | null} production
 * @property {FindingLocation | null} new
 */

/**
 * @typedef {object} Finding
 * @property {string} id
 * @property {Store} store
 * @property {string} page
 * @property {Check} check
 * @property {keyof FINDING_CLASSES} class
 * @property {string | null} prod   The production side, normalised. `null` if absent.
 * @property {string | null} new    The new side, normalised. `null` if absent.
 * @property {string | null} detail What changed when the two sides of text are equal.
 *                                  `h2 → h3` on `heading-level` and `tag-changed`.
 *                                  Part of the id. See `findingId()`.
 * @property {string | null} anchorHeading
 *                                  The heading the finding sits under: the nearest
 *                                  heading before it in document order, `null` when
 *                                  it precedes every heading (ticket 34). Taken from
 *                                  the production side when there is one, else from
 *                                  the new site. On a grouped finding it is the
 *                                  **first** occurrence; `occurrences` says there are
 *                                  more. **Not part of the id**, like `occurrences`:
 *                                  an edit to the heading above must not detach an
 *                                  editor's dismissal of the words below it.
 *                                  Named in full because `anchor` alone is the `<a>`
 *                                  element everywhere else. See `CONTEXT.md`.
 * @property {FindingLocations} locations
 *                                  Where the finding is **on each side**, for aiming the
 *                                  two deep links. A row offers a link per side, and a
 *                                  link opens a page at some text, so the text it carries
 *                                  has to be on the page it opens. One shared heading
 *                                  could not do that: where the new site reworded the
 *                                  heading, the side that did not supply it got a fragment
 *                                  matching nothing — which scrolls nowhere and reports no
 *                                  error, so a dead link and a live one looked the same
 *                                  until clicked. `anchorHeading` above is still the
 *                                  section's *name*, production-preferred, and is what the
 *                                  row displays. This is for aiming. **Not part of the id
 *                                  or the grouping key**, for the same reason
 *                                  `anchorHeading` is not.
 * @property {number} occurrences   Not part of the id.
 * @property {number | null} score  The similarity score. On `copy` findings only.
 */

/**
 * One aligned position in the content view, in production's document order.
 *
 * A finding is **grouped** — one rename repeated six times is one finding — and a
 * row is a **position**, so the two cannot be the same record. The rows are
 * derived from the same alignment pass as the findings, and they hold unit
 * indices rather than copies of the text: the units are already in
 * `sides`, and duplicating them roughly doubles a report on disk.
 *
 * `class: null` is an exact tier-1 match. Ticket 02: that is not a finding.
 *
 * The two numbers are positions in the `elements` **array**, and since ticket 34
 * that is no longer the same number as `ContentUnit.index`: the document-order
 * counter now runs over images and links as well. The array position is what the
 * browser needs, because it reads the unit back with `elements[row.prod]`.
 *
 * @typedef {object} DiffRow
 * @property {keyof FINDING_CLASSES | null} class
 * @property {number | null} prod   Position in `sides.production.elements`.
 * @property {number[]} [prodRun]   On a `regrouped` merge only (ticket 116): every position of
 *                                  the production run the new site sends as one block, in
 *                                  document order. `prod` is the **first** of them, so the row
 *                                  sits and links where the run begins and a reader that
 *                                  knows nothing about runs still draws a unit. The key is
 *                                  **absent** and not null on the other rows: some 200 rows
 *                                  corpus-wide carry a run, and a null on every other row
 *                                  is bytes in all 816 reports.
 * @property {number | null} new    Position in `sides.new.elements`.
 * @property {number[]} [newRun]    On a `regrouped` split only (ticket 120): the same, on the
 *                                  new site's side, with `new` the first of them. A row
 *                                  carries one run or the other and never both — that would
 *                                  be the many-to-many ADR 0012 refuses.
 * @property {number | null} score
 * @property {string | null} finding  The grouped finding this position belongs to.
 *                                    `null` on an exact match. Six positions that
 *                                    grouped into one finding share one id, so an
 *                                    override on any of them acts on all six. The
 *                                    browser cannot recompute it — `findingId()`
 *                                    needs `node:crypto`.
 */

/**
 * The counts the dashboard and the page bar read. Ticket 09: a class that is not work
 * is not in the bar, and absolute numbers are always shown, because the denominator
 * moves.
 *
 * **The count is named after the visibility it counts.** Ticket 75 kept `shown` as a
 * candidate name and refused it: `information` is shown and is not in this number, so
 * the old name would have become false on the day the enum landed. One tally per
 * visibility, and `total` is their sum.
 *
 * @typedef {object} ReportSummary
 * @property {number} work         The denominator, and nothing else is.
 * @property {number} information  Rendered, not counted.
 * @property {number} diagnostic   Behind the diagnostics control.
 * @property {number} total
 * @property {Record<string, number>} byClass
 * @property {Record<string, number>} byCheck
 */

/**
 * What `web/` reads, one file per store page.
 *
 * Ticket 07: the compare stage **gates on `status === 200`**, because a 404 page
 * still extracts — the 404 page has a `<main>`. A page that fails the gate is
 * still a report, so the dashboard can show it and say why, but it carries no
 * findings. One-sided pages are ticket 20's subject, not a wall of `structure`.
 *
 * @typedef {object} PageReport
 * @property {Store} store
 * @property {string} page
 * @property {{ production: PageExtract, new: PageExtract }} sides
 * @property {boolean} comparable
 * @property {string | null} skipReason
 * @property {Finding[]} findings
 * @property {DiffRow[]} rows
 * @property {ReportSummary} summary
 * @property {string} observationId  The run that produced this report. See `newObservationId()`.
 * @property {string} findingSetHash Over every finding id on the page. Page-review staleness.
 * @property {string} builtAt       ISO 8601.
 */

/**
 * The part of a `PageReport` that the override derivation reads, and nothing
 * else. A `PageReport` satisfies it, and so does the dashboard's much smaller
 * `PageSummary` — which is why one derivation serves the page and the store, and
 * the two can never disagree about a bar.
 *
 * @typedef {object} ObservedPage
 * @property {Store} store
 * @property {string} page
 * @property {Finding[]} findings
 * @property {string} observationId
 * @property {string} findingSetHash
 */

/**
 * An **observation** is one look at the two sites: a build of the log, or one
 * Recheck. Ticket 09 says a fix claim counts as closed until it is contradicted,
 * and that it is worth pressing on a frozen snapshot "where nothing can
 * contradict it". Those two sentences only agree if a claim knows what it was
 * claimed against — so a `fixed` event records its observation, and it is
 * contradicted only by a **later** one that still gives the finding.
 *
 * "Later" has to be decidable without a clock, because `derivePageState()` is
 * pure. So the identifier is **lexicographically sortable**: a fixed-width ISO
 * 8601 UTC timestamp, then a random tail to separate two runs in the same
 * millisecond. Comparing two ids with `<` is comparing their times.
 *
 * @returns {string}
 */
export function newObservationId() {
  return `${new Date().toISOString()}-${randomUUID().slice(0, 8)}`;
}

/**
 * The calendar moment an observation id names, as an ISO 8601 stamp.
 *
 * The id is that stamp with a random tail joined on, and the tail is there to separate
 * two runs of the same millisecond — so reading the date back is taking the stamp off
 * the front and never parsing the id. `newObservationId()` above is the only writer of
 * the shape, and this is the only reader of it.
 *
 * @param {string} observationId
 * @returns {string}
 */
export function observedAt(observationId) {
  return observationId.slice(0, STAMP);
}

/** The length of an ISO 8601 UTC stamp with milliseconds: `2026-08-18T09:36:17.824Z`. */
const STAMP = 24;

/**
 * What one finding is, to an index keyed on the id alone: the id, and the three facts
 * that say where it is. There is no fourth. No text, no decision, and no relation
 * between two ids — ADR 0004 rules all three out, and the shape is where that is
 * enforced rather than remembered.
 *
 * @typedef {object} FindingRef
 * @property {string} id
 * @property {Store} store
 * @property {string} page
 * @property {keyof FINDING_CLASSES} class
 */

/**
 * One row of the run log.
 *
 * `firstSeen` and `lastSeen` are observation ids, which sort chronologically by
 * construction, so comparing two of them is a string comparison and never a parsed date.
 *
 * `seen` says the snapshot of the run that **last covered this row's store** held the id.
 * It is not a decision and nobody made it: a run compares two sites and reports what it
 * saw, and an editor's judgement about this finding lives in the overrides and nowhere
 * near here.
 *
 * `retiredAt` is the run that stopped seeing the id, which `lastSeen` is one run short of:
 * a row records its last **sighting**, and the note of ticket 78 asks which run ended it. It
 * is recorded and not reconstructed, because a run that retires an id without introducing
 * one names itself on no row and would drop out of any sequence a reader rebuilt. It is
 * `null` while the row is seen, and on a row written before the field existed.
 *
 * @typedef {FindingRef & { firstSeen: string, lastSeen: string, seen: boolean,
 *   retiredAt: string | null }} RunLogRow
 */

/**
 * The whole index: one committed file for the corpus, rewritten at each run, with git
 * history as the archive. `crawl/run-log.mjs` owns it; `compare/` and `web/` read it.
 *
 * `stores` is what makes a one-store run safe. `node compare/30-compare.mjs nl` looks at
 * one store, and *not looked at* is not *gone* — so `seen` is asked against the
 * observation that last covered the row's own store, never against the file's.
 *
 * @typedef {object} RunLog
 * @property {string} observationId  The run that wrote the file. It carries its own
 *                                   moment, so the index keeps no separate build stamp.
 * @property {Record<string, string>} stores  Store to the observation that last covered it.
 * @property {RunLogRow[]} rows      Sorted by id.
 */

/**
 * A hash over the sorted ids of **every** finding on the page, in any class.
 *
 * A page review records this, and goes stale when it stops matching. Ticket 118 and
 * ADR 0013 took the visibility filter out: visibility is a property of the vocabulary
 * and not of the page, so under the filter one word changed in `FINDING_CLASSES` marked
 * reviews stale on pages where not a word had moved — flipping `heading-level` to
 * `information` would have said *"changed since review"* on all 392 pages that carry
 * one. `CONTEXT.md` defines stale as a review made against a page whose findings
 * changed, and the findings had not changed.
 *
 * So the hash is independent of `FINDING_CLASSES`, and a change in a class that is not
 * work now marks a review stale. That is the same reading: a human reviewed the page,
 * not the shown subset of it.
 *
 * This is page-review staleness only. The run log is keyed on the finding id alone and
 * is untouched.
 *
 * @param {Pick<Finding, 'id'>[]} findings
 * @returns {string} 16 base64url characters.
 */
export function findingSetHash(findings) {
  const ids = findings.map((finding) => finding.id).sort();
  return createHash('sha256').update(ids.join('|'), 'utf8').digest('base64url').slice(0, 16);
}

/**
 * The finding id from ticket 01.
 *
 * Content-addressed, page-scoped and store-scoped. It expires on purpose: if
 * either side's text changes, the id changes and the dismissal detaches,
 * because the editor's judgement is now stale.
 *
 * `prodNorm` and `newNorm` are tier-1 text with letter case kept. A truncated
 * hash, not truncated content: the prototype cut the key itself, and 156
 * findings collapsed to 88 ids.
 *
 * `detail` says what changed when the two texts are equal (ticket 33). Without it
 * an `h2` → `h3` and an `h2` → `h4` on the same words are one id, so a fix that
 * makes the demotion worse keeps the editor's dismissal. It joins the key **only
 * when it is present**, so every id in the 19 classes that have no detail is the
 * id it was before ticket 33 — `contract.test.mjs` pins one with a literal.
 *
 * @param {object} parts
 * @param {Store} parts.store
 * @param {string} parts.page
 * @param {Check} parts.check
 * @param {string} parts.rule      The class id.
 * @param {string | null} parts.prodNorm
 * @param {string | null} parts.newNorm
 * @param {string | null} [parts.detail]
 * @returns {string} 16 base64url characters.
 */
export function findingId({ store, page, check, rule, prodNorm, newNorm, detail = null }) {
  const parts = [store, page, check, rule, prodNorm ?? '', newNorm ?? ''];
  if (detail) parts.push(detail);
  return createHash('sha256').update(parts.join('|'), 'utf8').digest('base64url').slice(0, 16);
}

const SEPARATOR = '__';

/**
 * The name of the file that holds one `PageReport`.
 *
 * The store is in the name so that the store dashboard does not open every report
 * to find its own: the build reads 45 files for `de`, not 448 (ticket 38). That
 * makes the name data the web build parses, so the shape is stated here, once,
 * with `storeOfFile()` beside it — and nowhere else (ticket 60).
 *
 * A page key can hold a slash (`faq/productinformatie`), and the report folder is
 * flat because `web/` reads it with one non-recursive listing. So the separator
 * serves twice: it joins the store to the page, and it replaces the slashes.
 *
 * Two folders use this name. The crawl writes `data/reports/` and a press of
 * Recheck writes `data/rechecks/` beside it, so one page has at most one file in
 * each. `chooseReport()` in `web/src/lib/recheck-choice.mjs` says which of the
 * two a reader sees (ticket 71).
 *
 * @param {Store} store
 * @param {string} page
 * @returns {string}
 */
export function reportFilename(store, page) {
  return `${store}${SEPARATOR}${page.replaceAll('/', SEPARATOR)}.json`;
}

/**
 * The store `reportFilename()` wrote into a name.
 *
 * No two store ids are prefixes of one another once the separator is counted —
 * `be__` does not match `be_fr__` — so the match is exact.
 *
 * @param {string} name
 * @returns {Store | null} `null` for a name no store claims.
 */
export function storeOfFile(name) {
  return STORES.find((store) => name.startsWith(`${store}${SEPARATOR}`)) ?? null;
}

/**
 * A note about what is deliberately **not** in this file, because the reason outlived the
 * thing it was written about.
 *
 * Ticket 88 moved a key builder out of this file and into `shared/`, so that a browser
 * island could import it without dragging `node:crypto` in behind it — this file imports
 * that for `findingId()`, and a Vite build of an island that reaches this file fails on it.
 * ADR 0011 withdrew the override that key belonged to, and ticket 114 deleted the module;
 * the constraint that put it there is untouched by any of that. **Anything an island has to
 * compute must not be reached through this file.** `shared/` is where it goes, pure and
 * importing nothing (ADR 0001).
 */
