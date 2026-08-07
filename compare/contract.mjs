/**
 * The data contract between `crawl/`, `compare/`, `web/` and `api/`.
 *
 * Ticket 01 fixes the finding id, ticket 02 the classes and the normalisation
 * tiers, ticket 05 the link classes, ticket 06 the image classes.
 */

import { createHash, randomUUID } from 'node:crypto';
import { FINDING_CLASSES as CLASSES, STORES } from './vocabulary.mjs';

/**
 * The class vocabulary lives in `vocabulary.mjs` and is re-exported here, so a
 * Node consumer still has one import site for the whole contract. The browser
 * imports `vocabulary.mjs` directly: `findingId()` needs `node:crypto`, and a
 * Vite build of an island that reaches this file fails on that import. Ids are
 * made in `compare/`, never in the browser.
 */
export { CHECKS, FINDING_CLASSES, STORES } from './vocabulary.mjs';

/** @typedef {import('./vocabulary.mjs').Store} Store */

/** @typedef {import('./vocabulary.mjs').Side} Side */

/** @typedef {import('./vocabulary.mjs').Check} Check */

/** @typedef {import('./vocabulary.mjs').FindingClass} FindingClass */

/**
 * One leaf text element inside the content boundary, in document order. This
 * is the content outline and the diff input. It is one structure, not two.
 *
 * @typedef {object} TextElement
 * @property {number} index         Position in document order. Ticket 34 put text,
 *                                  images and links on **one** counter, so this is
 *                                  no longer the position in `elements` as well.
 * @property {string} tag
 * @property {'heading' | 'text' | 'cta'} kind  `cta` is a label only. All anchors count.
 * @property {number | null} level  1 to 6 for a heading, else null.
 * @property {string} raw
 * @property {string} norm          Tier-1 text. Letter case and trailing punctuation stay.
 */

/**
 * @typedef {object} LinkRecord
 * @property {number} index         Position in document order, on the same counter as
 *                                  `TextElement` and `ImageRecord` (ticket 34). An
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
 * Numbers that explain a page, and that must never become a finding. Ticket 06
 * counts the new site's 76 Alpine-bound icons here: they carry no identity, so
 * they cannot be matched, missed or fixed.
 *
 * @typedef {object} PageDiagnostics
 * @property {number} imagesWithoutSrc
 */

/**
 * What `crawl/` gives for one URL. `compare/` reads nothing else.
 *
 * @typedef {object} PageExtract
 * @property {Store} store
 * @property {string} page          The NL url key.
 * @property {Side} side
 * @property {string} url
 * @property {number} status
 * @property {'main' | 'body'} boundary  `body` says that the page has no `<main>`.
 * @property {string | null} pageType    From the `<body class>`, read with a regex on the
 *                                       raw HTML, because the parser drops the tag.
 * @property {TextElement[]} elements
 * @property {LinkRecord[]} links
 * @property {ImageRecord[]} images
 * @property {PageMeta} meta
 * @property {string} markdown      A rendering for reading and export. Never the diff spine.
 * @property {PageDiagnostics} diagnostics
 * @property {string} fetchedAt     ISO 8601.
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
 * @property {number} occurrences   Not part of the id.
 * @property {number | null} score  The similarity score. On `copy` findings only.
 */

/**
 * One aligned position in the content view, in production's document order.
 *
 * A finding is **grouped** — one rename repeated six times is one finding — and a
 * row is a **position**, so the two cannot be the same record. The rows are
 * derived from the same alignment pass as the findings, and they hold element
 * indices rather than copies of the text: the elements are already in
 * `sides`, and duplicating them roughly doubles a report on disk.
 *
 * `class: null` is an exact tier-1 match. Ticket 02: that is not a finding.
 *
 * The two numbers are positions in the `elements` **array**, and since ticket 34
 * that is no longer the same number as `TextElement.index`: the document-order
 * counter now runs over images and links as well. The array position is what the
 * browser needs, because it reads the element back with `elements[row.prod]`.
 *
 * @typedef {object} DiffRow
 * @property {keyof FINDING_CLASSES | null} class
 * @property {number | null} prod   Position in `sides.production.elements`.
 * @property {number | null} new    Position in `sides.new.elements`.
 * @property {number | null} score
 * @property {string | null} finding  The grouped finding this position belongs to.
 *                                    `null` on an exact match. Six positions that
 *                                    grouped into one finding share one id, so an
 *                                    override on any of them acts on all six. The
 *                                    browser cannot recompute it — `findingId()`
 *                                    needs `node:crypto`.
 */

/**
 * The counts the dashboard and the page bar read. Ticket 09: a hidden class is
 * not in the bar, and absolute numbers are always shown, because the denominator
 * moves.
 *
 * @typedef {object} ReportSummary
 * @property {number} shown
 * @property {number} hidden
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
 * @property {string} findingSetHash Over the **shown** finding ids only. Page-review staleness.
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
 * A hash over the sorted ids of the findings in **shown** classes.
 *
 * A page review records this, and goes stale when it stops matching. It must be
 * the shown set only: over every class, muting something would change the hash
 * and make every review on the page stale, which is the opposite of what a mute
 * is for.
 *
 * @param {Pick<Finding, 'id' | 'class'>[]} findings
 * @returns {string} 16 base64url characters.
 */
export function findingSetHash(findings) {
  const ids = findings
    .filter((finding) => CLASSES[finding.class]?.shown)
    .map((finding) => finding.id)
    .sort();
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
 * The mute key from ticket 01: store, page and class. A mute persists, and it
 * covers rotating content such as campaigns and prices.
 *
 * @param {{ store: Store, page: string, class: string }} parts
 * @returns {string}
 */
export function muteKey({ store, page, class: cls }) {
  return [store, page, cls].join('|');
}
