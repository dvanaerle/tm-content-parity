/**
 * Search over the content of a **set of stores** (ticket 82, widened by ticket 03).
 *
 * An editor types `Bekijk deals >` and sees every finding that holds those words,
 * across every page, with the pages they are on. Before this, the only
 * search was a box that matched a page name.
 *
 * **One index per store, emitted at build time, scanned linearly.** No search library.
 * A store holds a few thousand work findings, and a linear pass over that many
 * objects is fast enough that a dependency would be paid for nothing. `web/probes/
 * probe-search-index.mjs` is the measurement that says so, and it is what a later
 * reader re-runs before adding one. A block store scans **two** indexes since ticket 05
 * and the all-stores screen scans **six**, which multiplies the pass and does not change
 * that answer — ADR 0021 holds the numbers for two.
 *
 * **The corpus is the caller's, and it may be any set of stores** (ticket 03).
 * `mergeIndexes()` takes a list, so the same function answers the per-store screen — this
 * store and its sibling, unchanged — and the screen above the stores, which names all six.
 * Nothing here knows which of the two it is answering; a store is a term of an entry and
 * never a bound of this module.
 *
 * **A search corpus is not a repeat corpus.** Reading may cross any store, because reading
 * moves no count; pressing may cross only where the **check** makes the two sides the same
 * string. So the widening lands here and stops: the grouping is still `repeatsInStore()`'s
 * and this module decides none of it. Since ticket 04 that grouping keys on the check, so
 * one link target on six stores is one row and one sentence of Dutch is four —
 * and the same call answers both. `CONTEXT.md` holds the two words.
 *
 * **The notes half crosses too, and stays its own block.** It was narrowed to one store by
 * `eventsOfStores()`, on the reasoning that a cross-store search is the back door to a
 * cross-store surface. A screen **above** the stores is not that door — it reads — so the
 * caller decides which stores' events reach `searchNotes()`, exactly as it decides which
 * indexes reach `searchStore()`. The per-store screen still hands over one store's.
 * See `docs/adr/0021-the-search-reaches-the-language-block-in-one-half.md`.
 *
 * **Two sources, two freshnesses.** The index is as old as the last build; the notes
 * are live. `searchStore()` answers about the snapshot and `searchNotes()` answers
 * about the log, and they are two functions rather than one merged list, so no caller
 * can present both halves as one moment by accident.
 *
 * **A search composes with the class filter** (ticket 102). The classes are the filter and
 * the term is a search, and the two narrow one result together: `searchStore()` takes the
 * pills and applies them through `repeatsWithClasses()`, the same derivation the two views
 * narrow by. There is no second answer here to what a class filter means: the selection ticket
 * 09 adds below asks the same membership question, through the `classIsOn()` that derivation
 * asks it with.
 *
 * **A class on its own is a query** (ticket 09). With nothing typed and no page scope, the
 * classes on are the corpus and every finding they hold is a hit — a class an editor can
 * name is a list they can open. It widens what reaches the grouping and nothing else: the
 * pills still narrow after it, through the derivation above, and a row selected that way
 * reports **no matched field**, because what it matched on is the pill and not a field.
 *
 * **A leading slash is a page scope** (ticket 103). `/downloads` is the repeats on that
 * page, and `/downloads knop` is the repeats on that page whose words hold *knop*. The
 * slash is structure in first position and an ordinary letter everywhere else, because a
 * page key can hold one. See `docs/adr/0016-a-leading-slash-is-a-page-scope.md`.
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
 * along with the withdrawn override that was keyed on it, and it stays a searchable field
 * here because it is a **locator** — *onder "…"* is how an editor finds a difference on a
 * long page, which never had anything to do with any judgement.
 *
 * **3. A search result must not extend `Repeat.on`.** The grouping is ticket 81's
 * `repeatsInStore()` and it is reused rather than rewritten, as this ticket's trap
 * demands. `view.test.mjs` pins `Object.keys(repeat.on[0])` to exactly
 * `['id', 'occurrences', 'page', 'store']`, so which field matched is carried on the
 * **repeat** and never on its per-page entries.
 */

import { latestByKey } from '../../../overrides/state.mjs';
import { FINDING_CLASSES, isWork } from '../../../compare/vocabulary.mjs';
import { logState } from './log-read.mjs';
import { classIsOn, findingsIn, repeatsInStore, repeatsWithClasses } from './view.mjs';

/**
 * One finding, cut to what a search reads.
 *
 * The named trap: **the index must not become the report.** A `PageReport` holds both
 * extracts — 54 MB across the corpus — and shipping it twice is not a search index.
 * These eleven fields are the searchable text, the two halves of the finding's address and
 * the observation it was seen in, and a twelfth has to be argued for in `search.test.mjs`
 * before it is added.
 *
 * @typedef {object} IndexEntry
 * @property {string} id            The finding. A repeat has none, so this is the only
 *                                 identity in the file.
 * @property {string} store         The store this finding is on (ticket 05). Redundant
 *                                 inside one file, where it is `index.store` on every
 *                                 entry — and load-bearing the moment two files are
 *                                 merged, which a block search does with two and the
 *                                 all-stores screen does with six. Without it the store
 *                                 lives only on the index, and a merge then files every
 *                                 other store's findings under the first one's name.
 * @property {string} page          The page key. Opaque, and it can hold a slash.
 * @property {string} observationId The run that saw this page, carried so the index can be
 *                                 read back as the store pages it came off — see
 *                                 `pagesOfIndex()`. It is a fact about the **page** and it
 *                                 rides on the entry for the reason the store does: the
 *                                 entries are a flat array, and a merge of six files has
 *                                 nowhere else to keep a per-page fact.
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
 * @property {string | null} store The one store this index is of, or `null` where it is a
 *                                 merge of several — see `mergeIndexes()`. Nothing reads it
 *                                 to decide where a finding is; the entries say that.
 * @property {number} pages
 * @property {string} builtAt       The newest report in the store. The finding half of
 *                                 a result is this old, and the note half is live.
 * @property {IndexEntry[]} findings
 */

/**
 * One page of one store, as the key every map inside this module is built on.
 *
 * Written once because the stores carry the **same page keys**: `nl/afhalen` and `be/afhalen`
 * are two pages, and a map keyed on the bare key would merge them into one. It was the two
 * stores of a language block that made this necessary; it is all six that make it
 * unavoidable. Five maps here answer that question and a sixth would be a sixth chance to
 * ask it with the store left off.
 *
 * @param {{ store: string, page: string }} one
 */
const storePage = (one) => `${one.store}/${one.page}`;

/**
 * The index for one store, from the reports the build already read.
 *
 * `linkText` is why this runs at build time and not in the browser. A links finding
 * carries the **target** in `prod` and `new` — `linkKey()`'s host-folded string — and
 * the anchor text is nowhere on it. The words an editor types are the words on the
 * page, so they have to come off the extract's link records, and the extract is the
 * half that the dashboard's own finding index throws away.
 *
 * Classes that are not `work` are left out, for the reason ticket 09 keeps them out of
 * the bar: a result that offered them would offer work the log does not count.
 *
 * @param {string} store
 * @param {import('../../../compare/contract.mjs').PageReport[]} reports
 * @returns {SearchIndex}
 */
export function indexStore(store, reports) {
  return reports.reduce(addPage, emptyIndex(store));
}

/**
 * An arbitrary set of indexes, as the one index a search scans (ticket 05, ticket 03).
 *
 * It took **one** sibling until ticket 03, because `siblingOf()` answers with one store or
 * with nothing, and there was no screen above the stores for a wider set to be about. There
 * is one now, so this takes a list: two files on a block store, six on the all-stores
 * screen, one on `de` and `uk`. Which half of a search crosses a block and why is ADR 0021;
 * what a set of stores may and may not do is the module header above.
 *
 * Nothing here knows what a block *is*, and nothing here knows what *all* is either. The
 * caller names the stores — through `siblingOf()` on a store dashboard, and off the log's
 * own store list on the screen above them — so no second reading of the hreflang codes is
 * added, which is the trap ticket 05 named and this one inherits.
 *
 * @param {SearchIndex[]} indexes In the order the result should scan them, which is the
 *   order a caller names its stores in. One index comes back untouched, so a store out of a
 *   block pays nothing for the block — the shape of ADR 0018's trade.
 * @returns {SearchIndex}
 */
export function mergeIndexes(indexes) {
  // A screen with no store to search draws its own empty answer. Throwing would make *the
  // log holds no store yet* a broken screen rather than an empty one.
  if (indexes.length === 0) return emptyIndex(null);
  if (indexes.length === 1) return indexes[0];

  return {
    // **No store**, because a merge of several is of none. It was the dashboard's store
    // while the merge was a block's two files — a label on the index and never a claim
    // about its entries, which is precisely why an entry carries its own — and over six
    // stores there is no such store to name. Nothing downstream reads this to decide
    // where a finding is, and the null is what keeps it that way.
    store: null,
    pages: indexes.reduce((sum, one) => sum + one.pages, 0),
    // The newest, which is the rule `addPage()` follows one level down over two reports.
    // One answer to *when was this snapshot taken* and not six. In practice one build
    // writes every file and they carry the same moment.
    builtAt: indexes.reduce((newest, one) => (one.builtAt > newest ? one.builtAt : newest), ''),
    findings: indexes.flatMap((one) => one.findings),
  };
}

/**
 * The index read back as the store pages it came off, which is what the override
 * derivation takes (ticket 03).
 *
 * The all-stores screen has **no page summaries**: six stores of them is seven megabytes of
 * HTML in one island, against a corpus that is already in six static files. So the index is
 * the corpus *and* the list of pages a decision can be about, and this is the one place the
 * flat entries are read as the pages they belong to.
 *
 * The shape is deliberately a `PageReport`'s as far as `derivePageState()` reads one: the
 * store, the page, the observation and the findings. It is a **second reading of one array**
 * and never a second derivation — `deriveStoreState()` decides what is dismissed, what is
 * fixed and what a later observation has contradicted, exactly as it does over the
 * summaries a store dashboard loads.
 *
 * `findingSetHash` is `null` and says so. It is read by the **review** mark alone, which is
 * a fact about a page an editor looked at and is drawn on no search result; a hash invented
 * here would make an unreviewed page claim a fresh review.
 *
 * Keyed on `store/page`, because the stores share page keys: `afhalen` is a page of all six,
 * and one report holding two stores' findings would put `be`'s behind `nl`'s events.
 *
 * @param {SearchIndex} index
 * @returns {{ store: string, page: string, observationId: string, findingSetHash: null,
 *   findings: IndexEntry[] }[]} In the order the pages first appear in the index, which is
 *   the order the build wrote them.
 */
export function pagesOfIndex(index) {
  /** @type {Map<string, { store: string, page: string, observationId: string,
   *   findingSetHash: null, findings: IndexEntry[] }>} */
  const byPage = new Map();

  for (const entry of index.findings) {
    const key = storePage(entry);
    const held = byPage.get(key);
    if (held) held.findings.push(entry);
    else {
      byPage.set(key, {
        store: entry.store,
        page: entry.page,
        observationId: entry.observationId,
        findingSetHash: null,
        findings: [entry],
      });
    }
  }

  return [...byPage.values()];
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
 * @param {string | null} store `null` where there is no one store this index is of, which
 *   is what `mergeIndexes()` answers with over a set of them and over none.
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
    // `work` only, as before ticket 75: the index is what the dashboard's derived state
    // can name, and that is the bar's set. Widening it to `information` is a payload
    // decision and not a rename, so it is not this ticket's to make.
    if (!isWork(finding.class)) continue;
    index.findings.push({
      id: finding.id,
      // The **report's** store and never `index.store`. They are the same string while an
      // index is built out of one store's reports, and they are not while two indexes are
      // merged through this accumulator — which is what `mergeIndexes()` does. Reading
      // the accumulator's here is ticket 05's first trap, and it files `be`'s findings
      // under `nl`, where a press would write an event against an id that does not exist.
      store: report.store,
      page: report.page,
      // The **page's** observation, for the same reason and one step further on: it is what
      // `pagesOfIndex()` reads the entries back as pages by, and a page re-checked on its own
      // carries a later one than the store's last full run. Read off the accumulator there
      // would be no accumulator to read it off — this is the only place it is known.
      observationId: report.observationId,
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
export const SEARCH_FIELDS = [
  'page',
  'prodText',
  'newText',
  'linkTarget',
  'linkText',
  'anchorHeading',
];

/**
 * What a **bare scope** matched on: the page, and nothing else.
 *
 * A frozen list rather than a fresh array per entry, because it is the same answer for
 * every row of such a result — the editor typed a page and the page is what was found.
 */
const SCOPE_FIELDS = Object.freeze(['page']);

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
    value?.toLowerCase().includes(needle) ?? false;

  // The two columns are read under one name or two, by the class's check. This is
  // decision 1, and it is the whole reason the field list is six names and not four.
  const target = isAboutALink(entry.class);

  return SEARCH_FIELDS.filter((field) => {
    switch (field) {
      case 'page':
        return holds(entry.page);
      case 'prodText':
        return !target && holds(entry.prod);
      case 'newText':
        return !target && holds(entry.new);
      case 'linkTarget':
        return target && (holds(entry.prod) || holds(entry.new));
      case 'linkText':
        return entry.linkText.some(holds);
      case 'anchorHeading':
        return holds(entry.anchorHeading);
      default:
        return false;
    }
  });
}

/**
 * A term, divided into the page scope it opens with and the words after it.
 *
 * Pure, and tested apart from matching, because it is the whole of what the slash rule
 * says: `/downloads knop` is *that page* and *those words*, and nothing about which
 * findings either half then reaches.
 *
 * **First position only.** A page key can hold a slash — `faq/productinformatie` is one —
 * so anywhere else the character is an ordinary letter and the term keeps it. That is the
 * reasoning ticket 82 pinned, and it is overturned for exactly one position: at the front,
 * before any word, there is nothing a slash could be part of.
 *
 * A slash with no word after it is **not** a scope. An empty scope would hold every page
 * key by substring, so the first keystroke of a scope would answer with the whole store.
 * It is left as an ordinary term, which is what it was before this ticket and what still
 * finds the keys that hold one.
 *
 * @param {string} raw What is in the box.
 * @returns {{ scope: string | null, text: string }} `scope` is the page scope without its
 *   slash, or `null` when there is none. `text` is what is left to search for, and it is
 *   empty on a bare scope — which is a search for the page and not for nothing.
 */
export function parseTerm(raw) {
  const split = splitScope(raw);
  // An empty fragment holds every page key by substring, so the first keystroke would answer
  // with the whole store. The slash stays the ordinary character it was before ticket 103.
  if (!split || !split.fragment) return { scope: null, text: raw.trim() };

  return { scope: split.fragment, text: split.rest };
}

/**
 * The slash rule itself, in the one place it is written.
 *
 * Position 0 of the term is the only structural slash, the fragment ends at the first
 * space, and the words after it are a search. Three readers need exactly that division —
 * `parseTerm()` for the answer, `scopeSuggestions()` for what to offer, `withScope()` for
 * what to write back — and three copies of it would be three chances for the offer to name
 * a page the scope then misses.
 *
 * It divides without judging: a bare `/` is a fragment of nothing rather than no scope,
 * which is the distinction its callers part company over. `parseTerm()` refuses it and the
 * suggestions are built on it.
 *
 * @param {string} raw What is in the box.
 * @returns {{ fragment: string, rest: string } | null} `null` when the term opens with no
 *   slash, so there is no scope in it and none being typed.
 */
function splitScope(raw) {
  const term = raw.trim();
  if (!term.startsWith('/')) return null;

  const after = term.slice(1);
  const space = after.search(/\s/);
  return space === -1
    ? { fragment: after, rest: '' }
    : { fragment: after.slice(0, space), rest: after.slice(space).trim() };
}

/**
 * The store's page keys, offered while a scope is being typed (ticket 104 part D).
 *
 * **The keys are not guessable.** They carry store prefixes and parentheses — `(home)`,
 * `(be)pergola`, `faq/productinformatie` — and no editor produces one from memory, so
 * without an offer the scope is a feature only someone who has read the source can use.
 *
 * It is a value here and not a list assembled in the box for the same reason part A's four
 * kinds are: the narrowing is `inScope()`, the scope's own rule, so what is offered is
 * exactly what would match. A component filtering the keys itself would eventually offer a
 * page the scope then misses, and an offer that lies is worse than none.
 *
 * **The whole page list and never the indexed half.** A clean page contributes no index
 * entry and a one-sided page can never contribute one, and those are most of what a
 * spot-check is for. The list arrives with the store page, before the index is fetched, so
 * the offer is there from the first keystroke.
 *
 * @param {object} args
 * @param {{ page: string, comparable: boolean }[]} args.pages The store's whole page list.
 * @param {string} args.term What is in the box.
 * @returns {{ scope: string, pages: { page: string, comparable: boolean }[] } | null} `null`
 *   when nothing is being offered: no leading slash, or a **settled** scope — a fragment that
 *   is a key of the store and the only key it reaches. That second case is what keeps the
 *   list from hanging over the result while the words after a settled scope are typed. An
 *   **empty** `pages` is a different answer: a fragment no key holds, which is part A's *no
 *   such page* and is the result's sentence to say, not this list's.
 */
export function scopeSuggestions({ pages, term }) {
  const split = splitScope(term);
  if (!split) return null;

  const { fragment } = split;
  const offered = pages
    .filter((one) => inScope(one.page, fragment))
    // Alphabetical, and not the order the store loaded in. On a real store this list is
    // long enough to scroll, and a scroll through an order nobody can predict is a list an
    // editor has to read rather than aim at.
    .map((one) => ({ page: one.page, comparable: one.comparable }))
    .sort((a, b) => a.page.localeCompare(b.page));

  // Settled: the fragment names a key, **and it is the only key it reaches**. Both halves
  // are needed. A key can be the prefix of a sibling — a store holding `veranda` and
  // `veranda-hout` is the ordinary case, not the odd one — and there `/veranda` has a page
  // left to offer, so closing on the exact match alone would break the one rule this list
  // lives under: what is offered is what would match. It would go silent on the sibling
  // exactly when the sibling is one-sided, which is the page no index entry can offer.
  //
  // The test is read off `offered` rather than asked of `pages` a second time, so the
  // exact-match twin of `inScope()` is not written out here beside it.
  if (offered.length === 1 && fold(offered[0].page) === fold(fragment)) return null;

  return { scope: fragment, pages: offered };
}

/**
 * The box, with this page as its scope and the search already typed left alone.
 *
 * Choosing a suggestion replaces the **fragment** and nothing else: `/overkap deals` with
 * `overkappingen` chosen is `/overkappingen deals`, because a half-named page and a term
 * are two things an editor typed and only one of them is being answered.
 *
 * @param {string} term What is in the box.
 * @param {string} page The key that was chosen.
 * @returns {string} What the box should hold.
 */
export function withScope(term, page) {
  const split = splitScope(term);
  const rest = split ? split.rest : term.trim();
  return rest ? `/${page} ${rest}` : `/${page}`;
}

/**
 * Whether this page key is in the scope.
 *
 * **Substring, and not an exact key.** It is how every other field in this search is
 * matched, and it is what lets `/faq` reach the family, `/home` reach `(home)` and
 * `/pergola` reach `(be)pergola` with no special case for any of them. A scope may
 * therefore hold several pages, and often does — which is why a result says which ones.
 *
 * It never splits on a slash, for the reason `matchedFields()` never does: the key is one
 * opaque string. Position 0 of the *term* is the only place a slash is read as structure.
 *
 * @param {string} page
 * @param {string} scope
 */
export const inScope = (page, scope) => page.toLowerCase().includes(fold(scope));

/**
 * What the index answers about a term.
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
 * A term that opens with a slash carries a **page scope** (ticket 103), which narrows the
 * corpus this runs over before any of the above. It is a narrowing and not a second kind of
 * result: the rows are the same repeats, the counts are the same counts of them, and a bare
 * scope answers with that page's repeats rather than with a reading of the page — the
 * ledger has one home and it is not here.
 *
 * **Three things can open a result** (ticket 09): words, a page scope, a class. Any one of
 * them on its own returns what it selects, and none of them on still returns nothing. So the
 * classes are a selector as well as a filter — with the box empty, they are the corpus — and
 * a class an editor can name is a list they can open.
 *
 * @param {object} args
 * @param {SearchIndex} args.index
 * @param {string} args.term
 * @param {(id: string) => import('../../../overrides/state.mjs').FindingState} [args.stateOf]
 *   The log's answer about one finding. It defaults to `open`, which is what an
 *   unconnected log knows: no decision has been read, so nothing is closed yet.
 * @param {boolean} [args.includeClosed] *Include closed*.
 * @param {string[]} [args.classes] The class pills that are on (ticket 102). Empty means
 *   every class, which is what an untouched filter says — not a filter matching nothing.
 *   It is a second narrowing over the same result and not a second search: the term
 *   decides what matched, the classes decide which of it is on screen. With **nothing else
 *   asked** they are also what asks (ticket 09): no words and no scope, and the classes on
 *   are the corpus every finding of which is a hit.
 * @returns {{
 *   repeats: (import('./view.mjs').Repeat & { fields: string[] })[],
 *   total: number,
 *   pages: number,
 *   matchedRepeats: number,
 *   matchedPages: { store: string, page: string }[],
 *   scope: string | null,
 *   text: string,
 * }} The two `matched*` fields are the answer **before the pills cut it**, which is the
 *   reading the amber strip is built on: `matchedRepeats` is its denominator, and
 *   `matchedPages` is that same moment read by page, added for ticket 104. Which kind of
 *   nothing a page is has to be decided there and never on `repeats` — a `casing` pill over
 *   a page whose open work is all `copy` would otherwise have the screen say *every
 *   difference on it is closed*, and CONTEXT.md gives a filter no power to make that
 *   sentence true.
 *   On a **class query** they are the answer the classes produced, so `matchedRepeats` equals
 *   the row count and the strip reads *n of n*: there the pill selected rather than cut, and a
 *   denominator counting the whole store would tell the editor their filter threw away rows no
 *   question of theirs ever found.
 *   `scope` is the page scope this term carried, or `null` for an ordinary one, and
 *   `text` is the words after it. The whole parse rides back here so a caller reads it off
 *   the answer rather than running it a second time over the same string. `text` joined
 *   `scope` for ticket 104: which kind of nothing a scope found turns on whether a second
 *   term was typed, and a caller deciding that from the raw term would be the second
 *   reading of the slash rule this return exists to prevent.
 */
export function searchStore({
  index,
  term,
  stateOf = () => 'open',
  includeClosed = false,
  classes = [],
}) {
  /** @type {Map<string, { store: string, page: string, findings: IndexEntry[] }>} */
  const byPage = new Map();
  /** @type {Map<string, string[]>} */
  const fieldsById = new Map();

  // The scope is taken off the term before anything is matched, so the words that are
  // left are matched exactly as they were before this ticket. A bare scope is a hit on
  // the **page name**, which is the one field the editor typed — and it is why the term
  // being empty here is not the empty box `matchedFields()` refuses.
  const { scope, text } = parseTerm(term);

  // The third thing that can open a result (ticket 09). With no words and no scope, the
  // classes on **are** the corpus: an editor looking at a *Broken link* row and wanting the
  // rest of them has no word to type, because the class is the thing they mean.
  //
  // Only then, because a term or a scope decides what matched and the classes go back to
  // cutting that answer through the narrowing ticket 102 put after the grouping.
  //
  // It selects through `classIsOn()`, which is what `repeatsWithClasses()` narrows by, so the
  // selector and the filter are one answer to what a pressed pill means and not two. No
  // visibility is asked, here or there: an `information` class opens as a `work` one does, and
  // the index holding `work` only stays `addPage()`'s decision rather than a second one here.
  const selectedByClass = !text && !scope && classes.length > 0;

  for (const entry of index.findings) {
    if (scope && !inScope(entry.page, scope)) continue;
    const fields = text ? matchedFields(entry, text) : scope ? SCOPE_FIELDS : [];
    // What the empty box still refuses, since ticket 09 narrowed this guard: nothing asked at
    // all. The empty box keeps meaning the empty box — an untouched filter is no filter and
    // never one matching everything — and a row that gets past it with no field is a row its
    // class selected, which is why the list stays empty rather than being filled with a field
    // the row did not match.
    if (fields.length === 0 && !selectedByClass) continue;
    if (selectedByClass && !classIsOn(classes, entry.class)) continue;
    if (!includeClosed && !isActive(stateOf(entry.id))) continue;
    fieldsById.set(entry.id, fields);
    const key = storePage(entry);
    const held = byPage.get(key);
    if (held) held.findings.push(entry);
    else byPage.set(key, { store: entry.store, page: entry.page, findings: [entry] });
  }

  // The store rides on each one, for the reason it rides on the entry: a page of this
  // result is a page **of a store**, and the reader that classifies them (`explainScope`)
  // has both stores' page lists in front of it.
  const matchedPages = [...byPage.values()].map(({ store, page }) => ({ store, page }));
  const pages = [...byPage.values()];

  // The matched fields ride **on the repeat** — decision 3. The union over its
  // findings, because the page key is a searchable field and the members differ in
  // exactly that one: a term can be in one page's key and not another's.
  const matchedRepeats = repeatsInStore(pages).map((repeat) => ({
    ...repeat,
    fields: SEARCH_FIELDS.filter((field) =>
      repeat.on.some((one) => fieldsById.get(one.id)?.includes(field)),
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
  // `matchedRepeats` is the other half of the amber strip's sentence — *n of m
  // differences*, in the words the two views say it. It counts what the term found
  // before the pills cut it, so the strip describes the filter and not the term. Its
  // unit is in its name on purpose: `total` beside it counts **findings**, and two
  // numbers of two units under one vague word is the doubled figure CONTEXT.md forbids.
  // The scope rides on the **result** and not on a repeat, for the reason `fields` rides
  // on the repeat and not on its pages: which pages a scope reached is a fact about the
  // answer, and `view.test.mjs` pins what a repeat carries.
  return {
    repeats,
    total: findingsIn(repeats),
    // Counted as `store/page`, because a repeat's pages can be on two stores since this
    // ticket and `afhalen` exists on both of them. The bare key would count two pages as
    // one and print *2 findings on 1 page*, which is a row contradicting its own footer.
    pages: new Set(repeats.flatMap((repeat) => repeat.on.map(storePage))).size,
    matchedRepeats: matchedRepeats.length,
    matchedPages,
    scope,
    text,
  };
}

/**
 * Which kind of nothing a scoped search found (ticket 104 part A).
 *
 * An editor scopes to a page and gets a blank, and the blank is four different answers
 * wearing one face. A parity tool that cannot tell **clean** from **I don't know** is
 * arguing against its own purpose, and it is what makes a scope useless as the spot-check
 * it is most likely to be used as.
 *
 * The classification is decided **here, as a value**, and the component renders one. It is
 * the rule ticket 103 already follows for the scope itself: one string, one parse, one
 * place the answer is decided, and no second copy of it free to drift.
 *
 * **Every kind is answerable from data the browser already holds.** The store page loads
 * the full page list, each entry carrying whether it is comparable and why not, and the
 * result says what the term reached. Nothing is fetched and the index gains no field.
 *
 * The two named traps, both from the ticket:
 *
 * - **Clean and unindexed are not the same.** A compared page with no shown finding
 *   contributes no index entry at all, so absence from the index proves nothing on its
 *   own. The page list is what tells the two apart, and it is why this takes one.
 * - **The count of indexed pages is a number and not a list of keys**, and it counts
 *   compared pages only. It can answer none of this.
 *
 * **It answers per page and never over all of them.** A scope is a substring and often
 * reaches a family, whose members can be of different kinds — one clean, one one-sided —
 * and a single verdict over that is false about most of it.
 *
 * @param {object} args
 * @param {{ page: string, comparable: boolean, skipReason: string | null,
 *   findings: { class: string }[] }[]} args.pages The store's **whole** page list, as the
 *   store page loaded it. The whole of it and not the comparable half: a one-sided page is
 *   exactly one of the answers, and a list that left it out could not give that answer.
 * @param {ReturnType<typeof searchStore>} args.result What the term answered. The scope
 *   and the words after it are read off it rather than parsed again, for the reason
 *   `Search.jsx` reads the scope off it: one string, one parse.
 * @returns {null | ScopeAnswer} `null` when the term carries no scope, because the four
 *   kinds are a scope's kinds — an ordinary term answers over the whole store, where
 *   *nothing found* is the whole of what can truthfully be said.
 *
 * @typedef {object} ScopeAnswer
 * @property {string} scope
 * @property {'no-such-page' | 'found'} state `no-such-page` is the typo: the scope matches
 *   no key in the store. It is a state of the **answer** and not of a page, because there
 *   is no page it is about.
 * @property {ScopedPage[]} pages Every page the scope reached, classified. Empty on
 *   `no-such-page`.
 *
 * @typedef {object} ScopedPage
 * @property {string} store The store this page is on (ticket 05). A scope reaches the whole
 *   block, so a listed page is a page **of a store** and the line that draws it says which.
 * @property {string} page
 * @property {'matched' | 'one-sided' | 'clean' | 'no-open-work' | 'no-match'} kind
 * @property {string | null} skipReason The aside's own words for why the comparison did
 *   not run, carried through rather than restated. Two names for one situation is how a
 *   vocabulary rots, and the aside had this one first.
 */
export function explainScope({ pages, result }) {
  const { scope, text } = result;
  if (!scope) return null;

  // The pages the **term** reached, before the class pills cut them. `result.repeats` is
  // the narrowed list, and reading the kinds off it would let a filter decide a verdict: a
  // `casing` pill over a page whose open work is all `copy` would have this say *every
  // difference on it is closed*, which is false and which the editor's own filter made
  // true-looking. CONTEXT.md gives a filter no power over a bar, a denominator or a count,
  // and a sentence about the page is not the exception. The strip above says what the
  // classes cut; this says what the term found, and they are two jobs.
  // Keyed by store **and** page, because the two stores of a language block carry the same
  // page keys: `be/afhalen` answering would otherwise mark `nl/afhalen` as matched, and the
  // editor would be told a page holds rows it holds none of.
  const answered = new Set(result.matchedPages.map(storePage));

  const found = pages
    .filter((one) => inScope(one.page, scope))
    .map((one) => ({
      store: one.store,
      page: one.page,
      kind: kindOf(one, answered, text),
      skipReason: one.skipReason ?? null,
    }));

  if (found.length === 0) return { scope, state: 'no-such-page', pages: [] };

  return { scope, state: 'found', pages: found };
}

/**
 * Which kind of nothing this one page is.
 *
 * The order is the order the answers exclude each other, and each line is one of the
 * ticket's sentences:
 *
 * - **One-sided** — it exists, it is in the store, and one side did not answer, so it is
 *   compared nowhere and indexed nowhere. Search staying silent here is search
 *   contradicting the one-sided pages aside on the same screen.
 * - **Matched** — the result holds rows on it. Not a kind of nothing; it is here so the
 *   four are told apart from the case that answered as well as from each other.
 * - **Clean** — compared, and the snapshot holds no `work` finding on it at all. The
 *   answer an editor most wants, and the one that is today indistinguishable from a typo.
 * - **No open work** — it holds differences and every one of them is closed. This is the
 *   fifth, which the ticket's four do not name: *clean* is "nothing is wrong with it", and
 *   a page whose every difference somebody accepted had something wrong and is finished.
 *   CONTEXT.md's context marker already tells *3 agreeing blocks* from *nothing left to
 *   do*, so the split is the vocabulary's own and not a new one.
 * - **No match** — it holds differences and the second term is on none of them. Which of
 *   the last two applies turns on whether a second term was typed, which is why the parse
 *   rides back on the result.
 *
 * `findings` is the snapshot's `work` findings and knows nothing of the log, in the same
 * manner as the by-name block: a page is clean because nothing was ever wrong with it, and
 * a reading that consulted the log would call a finished page clean and lose the
 * distinction above.
 *
 * @param {{ store: string, page: string, comparable: boolean, findings: object[] }} page
 * @param {Set<string>} answered The pages the result holds rows on, as `store/page`.
 * @param {string} text The words after the scope, empty on a bare one.
 */
function kindOf(page, answered, text) {
  if (!page.comparable) return 'one-sided';
  if (answered.has(storePage(page))) return 'matched';
  // `page.findings` and not `page.findings ?? []`. `loadSummaries()` always writes the
  // list, and a fallback here would answer *clean* on behalf of a caller that handed over
  // a page shape this cannot read — the quietest possible way to say *nothing is wrong*.
  if (page.findings.length === 0) return 'clean';
  return text ? 'no-match' : 'no-open-work';
}

/**
 * The notes in the log that hold the term — the other half of the answer, and the other
 * freshness.
 *
 * A note is not in the index and cannot be: it is written in the log after the build, so
 * indexing it would be indexing a moment that has already passed. It is filtered from the
 * events the screen has already loaded, which makes this half as new as the last read
 * while the finding half is as old as the last build.
 *
 * **Which stores' events those are is the caller's** (ticket 03). This function narrows on
 * the words and on the page scope and never on a store, so a store screen hands over its own
 * store's log and the screen above the stores hands over all six. That the second one is
 * allowed at all is the corpus split `CONTEXT.md` records: reading may cross any store,
 * because reading moves no count.
 *
 * That is why it is a second function and not a merged list. `live` is on the result so a
 * caller drawing both halves has to say which is which — presenting them as one moment is
 * what this ticket forbids, and a shape that cannot describe itself is how it would happen
 * by accident.
 *
 * **Two kinds of note live in that column** since ticket 83, and this function returns both:
 * the sentence an editor gives when dismissing a finding, and the free-text note on a page.
 * They are searched the same way and must not be *drawn* the same way — a dismissal note is
 * mandatory and explains one judgement about two strings, and a page note is optional and
 * explains nothing in particular. The event carries its own `scope` and `action`, which is
 * what lets the caller tell them apart; this function does not decide for it.
 *
 * **A page scope narrows this half too** (ticket 104 part B). One typing, one narrowing:
 * `/downloads` answering about the downloads page above the fold and about the whole store
 * below it is one screen giving two answers to one question, and the note is often the only
 * thing there is to say — a one-sided page has no findings and can never have any, so
 * without this the block that *could* speak about it is the one that stayed silent.
 *
 * The scope is matched against the event's own `page` through `inScope()`, the same
 * substring rule the findings half runs. A bare scope is a search **for the page**, so it
 * answers with every note on it; an empty box is still nothing asked and nothing answered.
 *
 * A page note an editor took back is not found, and that falls out of `latestByKey()`
 * rather than being a rule here: the clearing is a later `noted` event carrying an empty
 * note, so the words that were withdrawn are no longer the current event on their key.
 *
 * **The answer names its own state** (ticket 123). Live means read *at some moment*, and
 * before that moment there is nothing to be live about. The half this function answers
 * for used to return a bare array whatever the log was doing, so the first instant of a
 * store page — and every visit to one whose log does not answer — drew an empty block,
 * which an editor reads as *there are no notes about this*. That is a false statement
 * wearing the same clothes as a true one, and it is the one the findings half has had a
 * loading branch and an error branch against since 82.
 *
 * So this takes the **whole read** and not the events alone, and it returns one of three
 * things: it is `reading`, it `failed` and says why, or it is `answered` and carries the
 * matches. `notes` exists on the third alone. That is deliberate, and it is what keeps
 * the fix from moving one layer down: a caller that forgets the state gets `undefined`
 * and breaks where it stands, rather than quietly drawing nothing.
 *
 * Two of the branches follow `LogBanner`, because the two must not tell an editor
 * different stories about one log — and since the review of this ticket they do not merely
 * agree by hand: `logState()` is the one reading of the five fields, and this function and
 * the banner are two readers of it. What is left here is what this half *says* about that
 * state, which is its own:
 *
 * - **No connection is a log that could not be read.** It is not the editor's fault and
 *   the banner says so in its own words; down here the two failures collapse into one,
 *   because the truth about the notes half is the same either way — there is no log to
 *   read — and the state's `reason` is the why.
 * - **An error over a log that *was* read still answers.** A failed write leaves the last
 *   good read standing, and the banner already says it can be out of date. Throwing away
 *   notes that are on screen would be the second lie in the other direction.
 *
 * Nothing latches. The state is derived from the read on every call, so the moment the
 * log arrives the same term is answered — no retry here, no second request, no reload.
 *
 * **That is a property of this function and not a promise about the screen**, and the
 * review of this ticket caught the block above making the second claim out of the first.
 * `useStoreOverrides()` reads once per `[port, stores]` and never retries, so a read that
 * failed is not re-attempted while the page is open. The words in `Search.jsx` say what is
 * true of that: the log was not read, and a reload is what tries again. A retry is a new
 * request, which this ticket's last trap forbids, so it stays a ticket of its own.
 *
 * @param {object} args
 * @param {object} args.log The store page's read of the override log.
 * @param {import('../../../overrides/state.mjs').OverrideEvent[] | null} args.log.events
 * @param {boolean} args.log.ready Whether a read has succeeded. The signal that already
 *   sits beside the events, and the one this function is here to consult.
 * @param {string | null} [args.log.error]
 * @param {boolean} [args.log.connected]
 * @param {string | null} [args.log.notConnectedReason]
 * @param {string} args.term
 * @returns {{ live: true, state: 'reading' }
 *   | { live: true, state: 'failed', reason: string }
 *   | { live: true, state: 'answered', scope: string | null, text: string,
 *       notes: import('../../../overrides/state.mjs').OverrideEvent[] }}
 *   `scope` and `text` are the parse this answer was narrowed by, and they ride back for
 *   the reason they ride back on `searchStore()`: a caller naming the scope over the block
 *   reads it off the answer it is drawing rather than parsing the slash a third time. They
 *   are on the answered branch alone, because a half that has not read its log has narrowed
 *   nothing.
 */
export function searchNotes({ log, term }) {
  const read = logState(log);

  // `ready` first, and the state after it: a write that failed over a good read leaves the
  // events standing, and this half depends on the read, which succeeded.
  if (!read.ready) {
    if (read.state === 'reading') return { live: true, state: 'reading' };
    return { live: true, state: 'failed', reason: read.reason };
  }

  // The same parse the findings half ran, and not a reading of the raw string: without it
  // `/downloads knop` is matched against the notes **with its slash on**, so the half that
  // is supposed to narrow to a page instead finds nothing at all.
  const { scope, text } = parseTerm(term);
  const needle = fold(text);

  // An empty box has been asked nothing. A **bare scope** has been asked about a page, so
  // it is not this branch: its answer is every note on that page, which is the one thing
  // search can truthfully say about a one-sided page.
  if (!scope && !needle) return { live: true, state: 'answered', scope, text, notes: [] };

  // Only the events that still stand. The table is append-only, so the words an editor
  // withdrew are still in it, and returning them would offer a reason for a decision
  // that has since been taken back. `latestByKey()` is the log's own answer to which
  // event counts, so search asks it rather than deciding for itself.
  // `log.events` and not `log.events ?? []`. A read has succeeded, so there is a list; a
  // caller that says otherwise is contradicting itself, and coercing here would answer
  // *no notes* on its behalf — the ticket's own bug, one layer down.
  const notes = [...latestByKey(log.events).values()]
    // `one.note` first, and truthiness rather than a match. Under a bare scope the needle
    // is empty and `''.includes('')` holds, so a cleared note — which is an empty note on
    // the newest event of its key — would come back as a note with nothing in it.
    .filter((one) => one.note)
    // The event's **own** page: it records where it was written, and that is what a page
    // scope is about. Narrowing on the page a finding sits on would be a different
    // question, asked of a field this half does not have.
    //
    // `scope` here is the **page scope** the editor typed. An event carries a field of the
    // same name meaning something else — which of `finding` or `page` it is about — and
    // this filter does not read it: `one.page` is on both kinds.
    .filter((one) => !scope || inScope(one.page, scope))
    .filter((one) => one.note.toLowerCase().includes(needle))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { live: true, state: 'answered', scope, text, notes };
}

/**
 * Whether this finding is still work, in the log's own terms.
 *
 * `dismissed` and `fixed` are what `barOf` counts as closed, and they are the whole of
 * what an editor is not looking for. A `contradicted` claim is a fix the newest
 * observation did not agree with, and the bar reads it as open, so search does too. Since
 * ADR 0011 those two are the whole list — nothing else closes anything or leaves the
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
