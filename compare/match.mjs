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
  return text.toLowerCase().replace(/[\s.,;:!?…]+$/u, '').trim();
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
      table[i][j] = left[i].norm === right[j].norm
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
 * Ticket 02 forbids pairing two headings of a different level. The `kind` test
 * beside it is not in the ticket, but it follows the ticket's own rule that a
 * wrong pair is worse than no pair: a paired row puts two texts side by side and
 * asserts they are the same content, and a heading is never the same content as
 * a button label.
 *
 * @param {import('./contract.mjs').ContentUnit} a
 * @param {import('./contract.mjs').ContentUnit} b
 * @returns {boolean}
 */
export function mayPair(a, b) {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'heading' && a.level !== b.level) return false;
  return true;
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
