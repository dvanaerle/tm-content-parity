/**
 * The matching primitives the Axis A comparison is built on.
 *
 * Ticket 02 settles every number and every fold in here. Nothing in this file
 * decides what a finding is; it only decides which two things are the same
 * thing.
 */

/** Ticket 02: raised from the prototype's 0.55. A wrong pair is worse than none. */
export const PAIR_THRESHOLD = 0.6;

/**
 * Tier 2 from ticket 02: the **visible** differences, folded only to ask
 * "is this difference nothing but letter case or trailing punctuation?".
 *
 * This never touches a key. The grouping key and the finding id carry tier-1
 * text with the case kept, or the `casing` class cannot exist.
 *
 * @param {string} text
 * @returns {string}
 */
export function tier2(text) {
  return text
    .toLowerCase()
    .replace(/[\s.,;:!?…]+$/u, '')
    .trim();
}

/**
 * The number mask from ticket 02. Prices, stock counts and review totals differ
 * between the two environments for legitimate reasons, so `price` is defined as
 * "equal once the numbers are masked" rather than as a currency pattern. The
 * prototype used a `€` regex, which also caught real copy changes that happened
 * to mention a price.
 *
 * @param {string} text
 * @returns {string}
 */
export function maskNumbers(text) {
  return text.replace(/\d[\d.,]*/g, '#');
}

/**
 * Token overlap, 0 to 1. Ticket 02 kept it over edit distance: it is cheap, it
 * needs no dependency, and it separates "same sentence, edited" from "different
 * sentence" well enough at the 0.6 threshold.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function similarity(a, b) {
  const left = new Set(tier2(a).split(' ').filter(Boolean));
  const right = new Set(tier2(b).split(' ').filter(Boolean));
  if (!left.size || !right.size) return 0;

  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return (2 * shared) / (left.size + right.size);
}

/**
 * Longest common subsequence over `norm`, so one insertion on the new site does
 * not cascade into every later unit reading as different.
 *
 * @template {{ norm: string }} T
 * @param {T[]} left
 * @param {T[]} right
 * @returns {Array<[number, number]>} Index pairs into `left` and `right`.
 */
export function lcsPairs(left, right) {
  const n = left.length;
  const m = right.length;
  const table = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));

  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[i][j] =
        left[i].norm === right[j].norm
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  /** @type {Array<[number, number]>} */
  const pairs = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (left[i].norm === right[j].norm) {
      pairs.push([i, j]);
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) i += 1;
    else j += 1;
  }
  return pairs;
}

/**
 * Ticket 02 forbids pairing two headings of a different level. A heading also
 * pairs with a heading only: a paired row puts two texts side by side and asserts
 * they are the same content, and a heading is never the same content as a button
 * label. A heading level is an editorial fact.
 *
 * Ticket 67 removed the test that the two kinds are equal, which held `cta` away
 * from `text`. After the fold the kind says how the unit is wrapped, and a
 * wrapper is not an editorial fact: production leaves the arrow of `Lees meer >`
 * outside the anchor, so the block reads `text`, while the new site keeps a bare
 * `<a>` that reads `cta`. Refusing that pair made one `copy` row into two
 * one-sided rows.
 *
 * @param {import('./contract.mjs').ContentUnit} a
 * @param {import('./contract.mjs').ContentUnit} b
 * @returns {boolean}
 */
export function mayPair(a, b) {
  if ((a.kind === 'heading') !== (b.kind === 'heading')) return false;
  if (a.kind === 'heading' && a.level !== b.level) return false;
  return true;
}

/**
 * ADR 0012's run. Two members at least, four at most, each of four tokens at least.
 *
 * The floor of two is a guard in its own right and not an arithmetic consequence: a run of
 * one is the trailing-token noise editors dismiss by hand — `"… exacte prijs"` against
 * `"… exacte prijs >"` — and 38 of 100 candidates under an early looser rule were
 * exactly that. The cap of four costs nothing on today's corpus, which holds no
 * five-member exact coverage, and it is what keeps the row one a reader can verify at a
 * glance. The four-token floor per member is the other half of the guard the trailing-token
 * case has to fail twice.
 */
const RUN_MIN = 2;
const RUN_MAX = 4;
const MEMBER_MIN_TOKENS = 4;

/** @param {string} text */
const tokensOf = (text) => text.split(/\s+/u).filter(Boolean);

/**
 * The run as one string.
 *
 * The finding id's `prodNorm` is this join and so is the left side of the coverage test,
 * from this one function — so the id can never be keyed on a string the test did not
 * compare. Keying it on the first member alone is ADR 0004's silent carry: an edit to the
 * second member would leave an editor's judgement attached to text nobody judged.
 *
 * @param {{ norm: string }[]} run
 * @returns {string}
 */
export const joinRun = (run) => run.map((unit) => unit.norm).join(' ');

/**
 * ADR 0012's criterion, and the whole of it: is `merged` **exactly** the space-joined run,
 * with nothing left over?
 *
 * The comparison is on **token sequences**, so every boundary the test accepts is a word
 * boundary and a leftover token is a leftover. Containment — production's text appearing
 * verbatim inside the new-site block — is four times cheaper and was refused at 1,653
 * findings against 233, because it is evidence of containment and not of regrouping: on
 * `/fr/avantages` production's block ends with a sentence the new site drops, and
 * containment would move those 16 tokens of lost copy into a class that is not counted and
 * cannot be decided.
 *
 * It is **not exported**, and neither are the three numbers above. Spec 119 forbids the only
 * caller it could have — the guards are pinned through `diffRows()`, because the pass order is
 * what we may want to change next — so an export would be surface for nobody. Ticket 120
 * reuses it from inside this file, with the sides swapped.
 *
 * @param {{ norm: string }[]} run
 * @param {{ norm: string }} merged
 * @returns {boolean}
 */
function coversExactly(run, merged) {
  if (run.length < RUN_MIN || run.length > RUN_MAX) return false;
  if (run.some((unit) => tokensOf(unit.norm).length < MEMBER_MIN_TOKENS)) return false;
  const left = tokensOf(joinRun(run));
  const right = tokensOf(merged.norm);
  return left.length === right.length && left.every((token, at) => token === right[at]);
}

/**
 * Pass 2: the production runs the new site sends as one unit.
 *
 * It runs between the LCS and the greedy matcher, and the order is the point. Greedy would
 * claim `P1 ↔ N1` at 0.84 on `nl/proefpakket/succes` and the run would be gone
 * before the exact test ever saw it — the same argument that already puts the LCS ahead of
 * greedy. Exact beats fuzzy.
 *
 * `prodUnits` is **all** of production's units and not the leftovers, because adjacency is
 * a fact about the document: two blocks with a matched block between them are not a run,
 * however their text reads once it is joined.
 *
 * The arity is many-to-one and never many-to-many, so a unit that one run claims is out of
 * reach of the next. Nothing here reads `kind`: a run may hold a heading
 * (`be/laagste-prijs-garantie`), and ticket 121 owns the jump-list consequence of that.
 *
 * @template {import('./contract.mjs').ContentUnit} T
 * @param {T[]} prodUnits  Production's units, in document order, all of them.
 * @param {T[]} newLeft    The new-site units the LCS left over, in document order.
 * @param {(unit: T) => boolean} claimed  Whether an earlier pass already took a unit.
 * @returns {Array<{ run: T[], new: T }>}
 */
export function mergeRuns(prodUnits, newLeft, claimed) {
  /** @type {Set<T>} */
  const taken = new Set();
  const free = (/** @type {T} */ unit) => !claimed(unit) && !taken.has(unit);
  /** @type {Array<{ run: T[], new: T }>} */
  const merges = [];

  for (const merged of newLeft) {
    const run = runCovering(prodUnits, merged, free, newLeft);
    if (!run) continue;
    for (const unit of run) taken.add(unit);
    merges.push({ run, new: merged });
  }
  return merges;
}

/**
 * ADR 0012's third guard: a member of a run is a block that **nothing else claims**, or is
 * the merged block's own counterpart.
 *
 * Without it the pass takes words that were never regrouped. On
 * `de/(de)shading-panel/produktinformationen` the new site sends the two height rows both
 * as themselves *and* as one joined block. Production's two rows cover the joined block
 * exactly, so the criterion so far accepts — and the two blocks that hold those same words
 * on the new site are left with no counterpart and read as `text-added`. The page then says
 * the words were regrouped and invented in the same breath, which is not a reading of
 * anything. Measured: it was the whole of the movement outside the three classes ticket 116
 * permits, on 1 page of 722.
 *
 * The test is deliberately the conservative one — *any* other candidate at the pair
 * threshold, not merely a better one than the merged block. A member has to be unspoken-for,
 * and a pass that runs ahead of the greedy matcher cannot ask the greedy matcher who it
 * would have chosen without becoming the thing it runs ahead of.
 *
 * @template {import('./contract.mjs').ContentUnit} T
 * @param {T} member
 * @param {T} merged
 * @param {T[]} newLeft
 * @returns {boolean}
 */
function claimedElsewhere(member, merged, newLeft) {
  return newLeft.some(
    (candidate) =>
      candidate !== merged &&
      mayPair(member, candidate) &&
      similarity(member.norm, candidate.norm) >= PAIR_THRESHOLD,
  );
}

/**
 * @template {import('./contract.mjs').ContentUnit} T
 * @param {T[]} prodUnits
 * @param {T} merged
 * @param {(unit: T) => boolean} free
 * @param {T[]} newLeft
 * @returns {T[] | null}
 */
function runCovering(prodUnits, merged, free, newLeft) {
  for (let start = 0; start < prodUnits.length; start += 1) {
    if (!free(prodUnits[start])) continue;
    for (let members = RUN_MIN; members <= RUN_MAX; members += 1) {
      const run = prodUnits.slice(start, start + members);
      // Past the end of the document, or across a unit an earlier pass took: a longer run
      // from this start holds the same unit, so there is nothing further to try here.
      if (run.length < members) break;
      if (!run.every(free)) break;
      if (!coversExactly(run, merged)) continue;
      // Asked last, because it is the only guard that reads the rest of the document, and
      // the coverage test has already thrown away all but a handful of candidates.
      if (run.some((member) => claimedElsewhere(member, merged, newLeft))) continue;
      return run;
    }
  }
  return null;
}

/**
 * Greedy best-match pairing of the units the LCS left over. Each new-site
 * unit is claimed once, so two production paragraphs can never both point at
 * the same replacement.
 *
 * @template {import('./contract.mjs').ContentUnit} T
 * @param {T[]} prodLeft
 * @param {T[]} newLeft
 * @returns {{ pairs: Array<{ prod: T, new: T, score: number }>, prodOnly: T[], newOnly: T[] }}
 */
export function pairLeftovers(prodLeft, newLeft) {
  /** @type {Array<{ prod: T, new: T, score: number }>} */
  const pairs = [];
  const claimed = new Set();
  /** @type {T[]} */
  const prodOnly = [];

  for (const prod of prodLeft) {
    let best = null;
    let bestScore = 0;
    for (const candidate of newLeft) {
      if (claimed.has(candidate)) continue;
      if (!mayPair(prod, candidate)) continue;
      const score = similarity(prod.norm, candidate.norm);
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    if (best && bestScore >= PAIR_THRESHOLD) {
      claimed.add(best);
      pairs.push({ prod, new: best, score: Number(bestScore.toFixed(2)) });
    } else {
      prodOnly.push(prod);
    }
  }

  return { pairs, prodOnly, newOnly: newLeft.filter((el) => !claimed.has(el)) };
}
