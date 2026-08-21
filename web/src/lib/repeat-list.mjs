/**
 * A store's work listed as **differences** rather than as pages (ticket 81), and
 * everything the list does to itself: how far a repeat groups, what order it arrives in,
 * what is left in it, and which class group a row is drawn under.
 *
 * A **repeat** is every finding with the same class, the same two texts and the same
 * detail, over the stores the check lets it group across. One footer line that is wrong
 * on thirty pages is one row here, and an editor meets it once instead of thirty times.
 *
 * **This module never sees the override log.** Every rule below that depends on what is
 * still open — the order, the narrowing, the pills — takes an `openOf` accessor from the
 * caller that already draws the row's bar, so a row's position, its presence and its
 * printed *N of N closed* are three readings of one bar and can never disagree.
 */

// The closed vocabulary, for the **order** of the class groups and nothing else. The
// import site is `vocabulary.mjs` for the reason `classes.mjs` states.
// `isWork` is the second thing read out of it, and only for the pill row: the repeat list
// is built out of `work` findings alone, so a class that is not one can never appear in it
// and its pill has to be counted off the snapshot instead (ticket 144).
import { FINDING_CLASSES, isWork } from '../../../compare/vocabulary.mjs';
// Whether a class is the same string on every store, from beside the check vocabulary the
// answer is drawn from. It decides the first term of the key below (ticket 04).
import { spansEveryStore } from './classes.mjs';
// The block a store is in, for the **first term of the repeat key** and nothing else
// (ticket 03). It is derived from `HREFLANG_STORE` and never hand-written, which is what
// keeps `{de, uk}` from ever becoming a block — see ADR 0018. `storesOf()` is beside it
// for the same reason: which stores a set of entries is on is a question about stores.
import { blockOf, storesOf } from './language-blocks.mjs';
// The pills over this list: what a class filter lets through, and the order the pills are
// drawn in. Both are the narrowing rule and neither is this list's to restate.
import { classCounts, classIsOn } from './filter.mjs';

/**
 * One page of a repeat: the page, the store it is on, and the finding that is the
 * difference there.
 *
 * It is named because it is a **seam** and not only a field. A press takes a list of these
 * and nothing else (ticket 138): the entry carries everything an event needs — its own
 * store, so a block-spanning press files each row where its finding id exists — and none
 * of what a repeat carries for drawing a row. That is what lets one press cover a
 * selection spanning 259 differences without learning that differences exist.
 *
 * @typedef {object} RepeatEntry
 * @property {string} store
 * @property {string} page
 * @property {string} id           The finding on that page.
 * @property {number} occurrences  How often the difference is on this one page.
 */

/**
 * The first term of a repeat's key: **which stores this difference may group over**.
 *
 * It is a function of the **check** and no longer of the block (ticket 04). Three answers,
 * and the middle one is the one ticket 03 wrote:
 *
 * - `images` and `links`: a constant, so every store groups together. One press decides
 *   `max.svg` everywhere.
 * - `text` and `meta` in a language block: the block's language, exactly as before.
 * - `text` and `meta` outside one: the store. `de` and `uk` are each alone in their
 *   language, so `blockOf()` gives them nothing and their text repeats are what they were.
 *
 * The term is a **key term** and nothing else. Nothing is keyed on it outside this
 * function: no finding id, no scope, no column and no URL. The table gains rows and never a
 * column, which has been true of a repeat since ticket 31.
 *
 * @param {string} store
 * @param {string} cls
 */
const corpusOf = (store, cls) =>
  spansEveryStore(cls) ? EVERY_STORE : (blockOf(store)?.language ?? store);

/**
 * The constant standing for *every store*, which is a name rather than a store list: the
 * corpus is not six stores that happen to be in the data, it is the absence of a store term
 * in the key. A literal list here would have to be kept in step with `STORES`.
 */
const EVERY_STORE = '*';

/**
 * A store's work listed as differences rather than as pages (ticket 81).
 *
 * A **repeat** is every finding in **one store** with the same class, the same two
 * texts and the same detail. One footer line that is wrong on thirty pages is one row
 * here, and an editor meets it once instead of thirty times.
 *
 * **How far a repeat crosses a store is decided by the check** (ticket 04), and
 * `corpusOf()` above is the whole of it. On `images` and `links` the two sides are basenames
 * and host-folded targets — the same strings on every store, in every language — so a repeat
 * spans all six and one press decides `max.svg` everywhere. On `text` and `meta` the two
 * sides are words the stores translate, so a repeat stays inside a **language block**: six
 * stores, four languages, and `{nl, be}` share Dutch while `{be_fr, fr}` share French. `de`
 * and `uk` are each alone in their language, so they join the first group and stay alone in
 * the second.
 *
 * That is the block's stated reason held to exactly what it covers. There is nothing better
 * to key on either way — an element carries no DOM path (tickets 01 and 34), so a key on the
 * literal string is the only key there is.
 *
 * The block is **derived** from the hreflang codes and never a hand-written list, which is
 * what stops `{de, uk}` from becoming a block because both are "the other ones". ADR 0018
 * records that boundary and ADR 0028 records why a filename is outside it; ADR 0017 records
 * why neither is an axis: this widens a **selection** over ordinary axis-A findings and
 * promotes nothing to a finding.
 *
 * **A repeat is not a finding.** It has no id, no override and no history, and every
 * decision on it is still N decisions on N findings. `key` is the grouping made
 * printable, for React and for the row an editor opened; it expires with the text in
 * the same way a finding id does.
 *
 * The row states **pages** and never a separate finding count. `page` is a term of
 * `sha256(store | page | check | rule | prodNorm | newNorm | detail)`, so one page can
 * hold at most one finding with this key — measured over the corpus, 25,657 repeats
 * and no exception. `on` says it in its shape: one entry is a page and its finding.
 *
 * The caller decides which findings reach here. `loadSummaries()` keeps the `work`
 * classes only, so a class that is not work is out of this list for the same reason
 * ticket 09 keeps it out of the bar.
 *
 * @typedef {object} Repeat
 * @property {string} key       The grouping, printable. Not an identity.
 * @property {string[]} stores  The stores its pages are on, sorted. It is derived from
 *                             `on`, so it can only be as wide as the key's first term lets
 *                             the grouping be: one store or a language block's two on a
 *                             `text` or `meta` row, and up to all six on an `images` or
 *                             `links` one (ticket 04).
 * @property {string} class
 * @property {string | null} prod
 * @property {string | null} new
 * @property {string | null} detail
 * @property {number} occurrences  Summed over the pages. **Not** the page count: a
 *                                 page can hold the same difference several times,
 *                                 and `on.length` is what counts pages.
 * @property {RepeatEntry[]} on
 *                             One entry is a page, its store and its finding. The store is
 *                             here and not only on the repeat because a press writes one
 *                             event per entry, and each event carries its own store.
 *
 * @param {{ store: string, page: string, findings: { id: string, class: string, prod: string | null, new: string | null, detail: string | null, occurrences?: number }[] }[]} pages
 * @returns {Repeat[]}
 */
export function repeatsInStore(pages) {
  /** @type {Map<string, Repeat>} */
  const groups = new Map();

  for (const page of pages) {
    for (const finding of page.findings) {
      const key = JSON.stringify([
        corpusOf(page.store, finding.class),
        finding.class,
        finding.prod,
        finding.new,
        finding.detail,
      ]);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          class: finding.class,
          prod: finding.prod,
          new: finding.new,
          detail: finding.detail,
          occurrences: 0,
          on: [],
        });
      }
      const repeat = groups.get(key);
      const occurrences = finding.occurrences ?? 1;
      repeat.occurrences += occurrences;
      repeat.on.push({ store: page.store, page: page.page, id: finding.id, occurrences });
    }
  }

  // `stores` is **derived from the entries** and never accumulated beside them, so the
  // row's answer to *in which stores* and the events a press writes cannot disagree. It
  // is one store on all but the block-spanning rows.
  const repeats = [...groups.values()].map((repeat) => ({
    ...repeat,
    stores: storesOf(repeat.on),
  }));

  // It is **size** and not worst-first: this derivation never sees the override log, so it
  // cannot know what is left in a row. `repeatsByOpenWork()` below takes the order an
  // editor reads, off the same bar the row prints, and falls back to this one where two
  // rows have equally much left (ticket 141).
  return repeats.sort(bySize);
}

/**
 * The largest difference first, with the key as the last word so two renders of one list
 * never disagree. Ticket 81's whole order, and the fallback of ticket 141's.
 *
 * It lives in one place because two spellings of it could drift, and a list whose two
 * orders disagree about a tie is a list that re-seats a row for no reason an editor can see.
 *
 * @param {Repeat} a
 * @param {Repeat} b
 */
const bySize = (a, b) => b.on.length - a.on.length || a.key.localeCompare(b.key);

/**
 * The repeat list **worst-first**, which is the difference with the most work left in it
 * (ticket 141).
 *
 * User story 33 of ticket 29 — *the worst page is the worst remaining page and not the
 * worst page of last week* — over the list ticket 81 built. That story says *page* because
 * it predates this list; 81 added the list afterwards and the rule never followed it across.
 *
 * It does not overturn 81's proof that a repeat's page count **is** its finding count: that
 * proof is about the findings a repeat *holds*, `page` being a term of the finding id, and
 * it holds. It says nothing about how many of them are still open, which is what an editor
 * reading top-down is looking for — twenty closed pages and two open is still twenty-two.
 *
 * So the open count is asked for rather than derived here: this module never sees the
 * override log, and the caller that draws a row already reads that row's bar. Handing the
 * same reading in is what keeps a row's position and its *N of N closed* from being two
 * counts of one thing.
 *
 * Nothing is removed and no number moves. A difference settled on all thirty pages stays
 * on the list reading *30 of 30 closed*; it sinks below every difference with work left.
 *
 * This is about **rows**. `groupRepeatsByClass()` refuses a count-based order for the
 * **groups** — a group that moves as the work is done is a group nobody can learn where to
 * look for — and that refusal stands: a group is a place on the screen and a row is the
 * work in it.
 *
 * @param {Repeat[]} repeats
 * @param {(repeat: Repeat) => number} openOf  How many of the repeat's findings are still
 *                                             open, off the bar the row prints.
 * @returns {Repeat[]}
 */
export function repeatsByOpenWork(repeats, openOf) {
  // Counted once per row and not inside the comparator, which would read the log O(n log n)
  // times over a 25,657-row list.
  const seats = repeats.map((repeat) => ({ repeat, open: openOf(repeat) }));

  // The fallback is ticket 81's whole order, so a list where nothing is decided arrives
  // exactly as it did before this ticket — and two renders of one list cannot disagree.
  seats.sort((a, b) => b.open - a.open || bySize(a.repeat, b.repeat));

  return seats.map((seat) => seat.repeat);
}

/**
 * The repeat list with the **fully decided differences off it** (ticket 144).
 *
 * The name is *with work left* and not *by open work*: `repeatsByOpenWork()` above **orders**
 * the list and this **narrows** it, `useWorstFirst()` calls the two on adjacent lines, and two
 * names a preposition apart would be two things a reader has to keep straight.
 *
 * Ticket 141 sank such a row instead of removing it, deliberately — sinking is the safe
 * direction to be wrong in, and the measurement since is that a sunk row is still a row an
 * editor scrolls. Fifteen `casing` rows all reading *2 of 2 closed* is the list answering
 * *what did this crawl find* to an editor asking *what is left*.
 *
 * It is the **same `openOf`** the order is taken with, and it is asked for rather than
 * derived here for the same reason: this module never sees the override log, and the caller
 * that draws a row already reads that row's bar. So a row's presence, its position and its
 * printed *N of N closed* are three readings of **one** bar and can never disagree.
 *
 * A difference is dropped whole or kept whole. **A partly closed one stays and keeps its
 * denominator** — its own row still says how many of it are closed, which is the sentence
 * that tells an editor the work landed.
 *
 * `information` needs no case here. A repeat is built out of the `work` findings a summary
 * carries (`loadSummaries()`), so a class that cannot be decided is not in this list to be
 * removed from it. The pill row below is where that class has to be answered for.
 *
 * @param {Repeat[]} repeats
 * @param {(repeat: Repeat) => number} openOf  How many of the repeat's findings are still
 *                                             open, off the bar the row prints.
 * @param {{ includeClosed?: boolean }} [options]  *Include closed*, which brings every
 *   dropped row back. It is the one control that decides this, and it decides **membership
 *   only**: no count below moves with it.
 * @returns {Repeat[]}
 */
export function repeatsWithWorkLeft(repeats, openOf, { includeClosed = false } = {}) {
  if (includeClosed) return repeats;
  return repeats.filter((repeat) => openOf(repeat) > 0);
}

/**
 * The class pills over a repeat list: how much **open work of that class is left** in it
 * (ticket 144).
 *
 * The pill counted `summary.byClass` until this ticket, which is a snapshot tally over this
 * store's comparable pages, and the list under it is `repeatsInStore()` over the language
 * block. Neither number was stale with respect to the other — `Case or punctuation 40` over
 * a group header saying *52 differences* is two units over two corpora — and a second count
 * made to agree with the first would have drifted again the next time either moved. So the
 * pill reads **the same list the rows come from** and the agreement is by construction. ADR
 * 0029 argues the two decisions that span it.
 *
 * The unit is the **finding**, because that is the unit of a decision and it is what the row's
 * *N of N closed* and the page bar already speak. 52 rows can hide 104 decisions, and *52*
 * would tell an editor they have half the work they have.
 *
 * It returns `classCounts()`'s own shape and order, so the pill component takes no new prop
 * and a class with nothing left is **absent** rather than a zero the component has to know
 * to hide.
 *
 * @param {Repeat[]} repeats
 * @param {(repeat: Repeat) => number} openOf  The same reading the rows are drawn from.
 * @param {{ tally?: Record<string, number>, includeClosed?: boolean }} [options]
 * @param {Record<string, number>} [options.tally] The snapshot's findings per class, for the
 *   classes this list **cannot hold**: a repeat is built out of `work` findings, so an
 *   `information` class has no row here and would silently lose its pill. Such a finding is
 *   one you can link to and cannot decide, so no decision can close it and the snapshot's
 *   figure is the live figure. Its `work` entries are ignored — those are what the list
 *   answers for.
 *
 *   Those pills therefore count whatever **corpus the caller's tally is over**, which on the
 *   dashboard is the store and not the block. It is a difference worth naming and not one
 *   worth removing: a number nothing can move cannot come to disagree with a list, and the
 *   store's own tally is the only one that screen holds — the sibling's summaries are there
 *   for the press and for this list, and ADR 0021 keeps every other number the store's.
 * @param {boolean} [options.includeClosed] Whether a class with nothing left still draws a
 *   pill. It reads `0`, and that is the only way into a fully decided class's rows. **The
 *   number never depends on this**; only a zero pill's presence does.
 * @returns {{ class: string, count: number }[]}
 */
export function classCountsByOpenWork(repeats, openOf, { tally = {}, includeClosed = false } = {}) {
  /** @type {Map<string, number>} */
  const open = new Map();
  for (const repeat of repeats) {
    open.set(repeat.class, (open.get(repeat.class) ?? 0) + openOf(repeat));
  }

  // A class the log has emptied draws no pill, so pressing one can no longer answer *No
  // difference found*. With *Include closed* on it stays, reading `0`.
  const counted = [...open].filter(([, count]) => includeClosed || count > 0);

  // The classes the repeat list cannot hold, off the snapshot. A `work` entry here is
  // ignored on purpose: the list above is the answer for those, and taking the larger of two
  // numbers is how the pill and the rows would come apart again.
  const undecidable = Object.entries(tally).filter(([cls, count]) => count > 0 && !isWork(cls));

  return classCounts(Object.fromEntries([...counted, ...undecidable]));
}

/**
 * The class filter over the repeat list, and the same rule as everywhere: it narrows
 * what is on screen and it moves no count.
 *
 * This is where the quick-filter want lands. A class pill that lists its findings
 * directly **is** the repeat list with a class pre-selected, so no second surface is
 * added (ticket 81).
 *
 * @param {Repeat[]} repeats
 * @param {string[]} classes  Empty means every class.
 * @returns {Repeat[]}
 */
export function repeatsWithClasses(repeats, classes) {
  if (classes.length === 0) return repeats;
  return repeats.filter((repeat) => classIsOn(classes, repeat.class));
}

/**
 * How many findings a list of repeats holds.
 *
 * Counted off the list it is given and never from elsewhere, so a number beside a list
 * cannot disagree with it — a filtered row count over an unfiltered finding count is
 * exactly the mismatched pair ticket 81 exists to stop. Two callers ask (the repeats
 * footer and a search result), and one of them asking differently is how they would drift.
 *
 * It is not a count of *work*: a repeat is a grouping, so this says how much the rows add
 * up to and never how much is left to do.
 *
 * @param {Repeat[]} repeats
 * @returns {number}
 */
export const findingsIn = (repeats) => repeats.reduce((sum, repeat) => sum + repeat.on.length, 0);

/**
 * The repeat list in a **class group** for each class (ticket 100).
 *
 * One wall of rows asks an editor to read it before it says anything. Six or so numbers,
 * one for each kind of difference, is a choice instead: *which kind do I work through*.
 * It changes nothing about which work is on top — the rows in a group arrive in the order
 * they were given, which is `repeatsByOpenWork()`'s worst-first since ticket 141.
 *
 * The word is **group** and never *section*: `CONTEXT.md` spends "section" on a run of one
 * page under an anchor heading, and one word with two meanings is what that glossary exists
 * to stop. That the override keyed on a section is withdrawn (ADR 0011) does not free the
 * word — the anchor heading is still how a difference says where it is. Ticket 100 asked
 * for "sections"; the concept it describes is this, and the name is refused.
 *
 * Opening a group is **not** a filter: it changes what is drawn and never what is
 * included, so it stays out of the amber strip and *clear filter* does not touch it. The
 * class pills stay the one filter, and this function reads them — with a pill on, only the
 * selected groups exist and they are open, so the two controls cannot tell different
 * stories.
 *
 * A class that holds nothing gets **no group**. It used to get an empty one saying so, to
 * keep *nothing wrong here* apart from *this class does not exist*; that is a row of
 * clutter apiece in the list an editor reads to find work, and a store where most rules
 * come back clean paid it on every line. Which rules ran is a property of the run and not
 * of this queue.
 *
 * @typedef {object} ClassGroup
 * @property {string} class
 * @property {Repeat[]} repeats
 * @property {boolean} opensOnLoad  The **initial** state, not the state. Which group is
 *                                  open is session state in the component.
 *
 * @param {Repeat[]} repeats
 * @param {string[]} classes  The pills that are on. Empty means every class.
 * @returns {ClassGroup[]}
 */
export function groupRepeatsByClass(repeats, classes = []) {
  /** @type {Map<string, Repeat[]>} */
  const byClass = new Map();
  for (const repeat of repeats) {
    if (!byClass.has(repeat.class)) byClass.set(repeat.class, []);
    byClass.get(repeat.class).push(repeat);
  }

  // Which classes are drawn: the ones that **hold something**. Every `work` class used to
  // be drawn with no pill on, empty ones as well, saying *no difference of this class in
  // this store* — *nothing wrong here* kept apart from *this class does not exist*. That
  // answer costs a row apiece in the list an editor reads to find work, and a store where
  // most rules come back clean pays it on every line. Which rules ran is a property of the
  // run, and this queue is for what is there.
  //
  // With a pill on the selected classes narrow it further: opening a group is not a
  // filter, so the two controls must not be able to tell different stories about what is
  // included.
  const isDrawn = (cls) => byClass.has(cls) && (classes.length === 0 || classes.includes(cls));

  // A class the closed vocabulary does not name cannot be ordered by it, so it goes last
  // rather than nowhere. Nothing reaches here today that is not in the vocabulary; the
  // guard is for the failure being silent, because the row would leave the screen while
  // the footer below kept counting it.
  const unnamed = [...byClass.keys()].filter((cls) => !FINDING_CLASSES[cls]).sort();

  // The vocabulary's order and never the counts. A group that changes position as the
  // work is done is a group nobody can learn where to look for.
  const groups = [...Object.keys(FINDING_CLASSES), ...unnamed]
    .filter(isDrawn)
    .map((cls) => ({ class: cls, repeats: byClass.get(cls) ?? [] }));

  // Groups start closed, and two of them is the case this ticket exists for: the editor
  // chooses. A lone group opens, because a closed single group is a click that asks
  // nothing — and so does a selected one, because the pill was that choice already. There
  // is no empty group to keep shut any more: every group here holds something.
  //
  // Two pills therefore open two groups, which the ticket also asks to be one at a time.
  // The two rules meet only here, and the pills win: they are the control that chose those
  // classes, so the queue must not answer a two-class filter with one class drawn open.
  // One-at-a-time governs the **clicks** — the component collapses the rest on a click —
  // and re-toggling a pill is what restores the pair.
  //
  // `opensOnLoad` is the **initial** state and not the state itself. Which group is open
  // is session state in the component, it is not a filter, and it never enters the amber
  // strip.
  const chosen = classes.length > 0 ? groups.map((group) => group.class) : [];
  const lone = groups.length === 1 ? [groups[0].class] : [];
  const opening = new Set([...chosen, ...lone]);

  return groups.map((group) => ({ ...group, opensOnLoad: opening.has(group.class) }));
}
