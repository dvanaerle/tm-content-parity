/**
 * The word-level diff (ticket 35). Two normalised strings in, a list of
 * unchanged / removed / added spans out.
 *
 * **Browser-safe and pure.** It imports nothing, thus a React island can import it
 * directly. This is the same rule that made `vocabulary.mjs` a separate file from
 * `contract.mjs`. It is the one new seam spec 32 adds. It is a module and not a
 * component, so that Node can test it. There is no browser test stack in this
 * repo. A rule that has judgement in it, and that only a component can run, is a
 * rule with no test.
 *
 * **Words, not characters.** A Dutch compound has almost the same letters as the
 * compound that replaced it. An example is `terrasoverkapping` against
 * `tuinoverkapping`. A character-level diff marks small changes inside such a
 * word. It does not show that the word changed. Therefore the unit is the word.
 *
 * **A link target is also a list of words.** The panel diffs two link keys with
 * this same function. Therefore the separators in a url — `/ ? & = #` — are
 * boundaries, together with whitespace. Without them, a target is one token and
 * the diff shows only that the target changed. An editor must see which **path
 * segment** changed.
 *
 * **The caller gives `norm`, and never `raw`.** Tier 1 folds curly quotes, NBSP,
 * dashes and entities on purpose. Thus a diff of `raw` marks differences that the
 * tool classifies as equal. A copy button gives `raw` to the editor instead.
 *
 * **A trim and a cap keep it affordable** (ticket 68, ADR 0009). After ticket 67 a
 * row holds a whole block, so one cell pair can be 1,250 characters a side. The
 * shared prefix and the shared suffix leave the table first, which makes one changed
 * word in a long paragraph almost free, and a pair still over `DIFF_CELL_CAP` is
 * **uncompared**: no table, both texts in full, and no claim about the content.
 */

/**
 * @typedef {object} DiffSpan
 * @property {'same' | 'removed' | 'added' | 'uncompared'} type
 *   `removed` is production's, `added` is the new site's. A `same` span belongs to
 *   both. `uncompared` is neither side's and both: the pair was over the budget, so
 *   there are exactly two of them, production's text and the new site's, and no
 *   other type is in the array. A consumer that does not know the type renders the
 *   text of a span it cannot colour, which is degraded and never wrong.
 * @property {string} text
 */

/**
 * Runs of separator and runs of content, in alternation. A separator is a token of
 * its own, and is not part of a neighbour token. Thus a join of one side's spans
 * gives that side's input, character for character. A renderer that must put the
 * spaces back cannot know where they were.
 */
const TOKENS = /[\s/?&=#]+|[^\s/?&=#]+/g;

/**
 * @param {string | null | undefined} text
 * @returns {string[]}
 */
const tokens = (text) => (text ?? '').match(TOKENS) ?? [];

/**
 * The token count of one side, which is what a measurement of the diff is in. It is
 * exported so that a probe counts the tokens this module counts, rather than keeping a
 * second copy of `TOKENS`.
 *
 * @param {string | null | undefined} text
 * @returns {number}
 */
export const tokenCount = (text) => tokens(text).length;

/**
 * The rendering budget, in cells of `n · m` after the trim (ticket 68, ADR 0009).
 *
 * It is a **size** limit and never a judgement. Above it the two versions are shown
 * in full and neither is coloured. The class stays what the comparison said, and no
 * count moves.
 *
 * Measured over 816 reports and 22,571 two-sided rows on 2026-08-10, after the fold:
 * the worst row costs **44,523 cells after the trim**, so this budget catches **no row
 * in the log**. That is what it is for. It bounds the tail, where one bad pairing of
 * two long blocks reaches millions of cells and tens of megabytes of `Int32Array`, and
 * a number below the observed maximum would be a rendering limit that reaches into text
 * an editor can read. `web/probes/probe-diff-cost.mjs` is the measurement.
 */
export const DIFF_CELL_CAP = 50_000;

/**
 * The one place the budget is compared against, so `diffCost` and `wordDiff` cannot
 * come to two answers about one pair.
 *
 * @param {number} n @param {number} m
 */
const overBudget = (n, m) => n * m > DIFF_CELL_CAP;

/**
 * How many tokens at the head and at the tail the two sides share.
 *
 * The untrimmed table consumed these as `same` itself, because a match is always
 * taken. Removing them first is therefore a speed-up and not a second opinion.
 *
 * @param {string[]} left @param {string[]} right
 * @returns {{ head: number, tail: number }}
 */
function commonEdges(left, right) {
  const shortest = Math.min(left.length, right.length);

  let head = 0;
  while (head < shortest && left[head] === right[head]) head += 1;

  let tail = 0;
  while (tail < shortest - head && left[left.length - 1 - tail] === right[right.length - 1 - tail])
    tail += 1;

  return { head, tail };
}

/**
 * What the table for this pair costs, after the trim (ticket 68).
 *
 * The probe in `web/probes/` and the cap read one function, so the number a test
 * holds is the number the corpus was measured with.
 *
 * @param {string | null} prod @param {string | null} next
 * @returns {{ n: number, m: number, cells: number, capped: boolean }}
 */
export function diffCost(prod, next) {
  const left = tokens(prod);
  const right = tokens(next);
  const { head, tail } = commonEdges(left, right);

  const n = left.length - head - tail;
  const m = right.length - head - tail;
  return { n, m, cells: n * m, capped: overBudget(n, m) };
}

/**
 * @param {string | null} prod  Production's normalised text.
 * @param {string | null} next  The new site's normalised text.
 * @returns {DiffSpan[]} In reading order. Adjacent tokens of the same type make one
 *   span, because a reader sees two removed words in sequence as one change.
 */
export function wordDiff(prod, next) {
  const left = tokens(prod);
  const right = tokens(next);
  const { head, tail } = commonEdges(left, right);

  /** @type {DiffSpan[]} */
  const spans = [];
  /** @param {DiffSpan['type']} type @param {string} token */
  const push = (type, token) => {
    const last = spans.at(-1);
    if (last?.type === type) last.text += token;
    else spans.push({ type, text: token });
  };

  const middleLeft = left.slice(head, left.length - tail);
  const middleRight = right.slice(head, right.length - tail);
  const n = middleLeft.length;
  const m = middleRight.length;

  // Above the budget the table is never allocated. One span for each side, so the
  // information is all there for a consumer that does not know the type.
  if (overBudget(n, m)) {
    return [
      { type: 'uncompared', text: prod ?? '' },
      { type: 'uncompared', text: next ?? '' },
    ];
  }

  for (let at = 0; at < head; at += 1) push('same', left[at]);

  // Longest common subsequence, the same backbone `lcsPairs` uses on units, so
  // one inserted word does not report every later word as changed. `table[i][j]`
  // is the length of the LCS of `middleLeft[i..]` and `middleRight[j..]`.
  const table = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[i][j] =
        middleLeft[i] === middleRight[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (middleLeft[i] === middleRight[j]) {
      push('same', middleLeft[i]);
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      // The loss is reported before the addition that replaced it, on every
      // substitution, so production stays the left-hand reference everywhere.
      push('removed', middleLeft[i]);
      i += 1;
    } else {
      push('added', middleRight[j]);
      j += 1;
    }
  }
  while (i < n) push('removed', middleLeft[i++]);
  while (j < m) push('added', middleRight[j++]);

  for (let at = right.length - tail; at < right.length; at += 1) push('same', right[at]);

  return spans;
}

/**
 * Did the comparison run? A renderer asks this and never reads the fourth type out
 * of the array, because an uncompared pair is not a list of spans to paint: it is
 * two texts to show plain.
 *
 * @param {DiffSpan[] | null | undefined} spans
 * @returns {boolean}
 */
export function isUncompared(spans) {
  return spans?.[0]?.type === 'uncompared';
}

/**
 * One side of a diff. Production reads the words it has, the new site reads the
 * words it has, and neither is shown the other's.
 *
 * @param {DiffSpan[]} spans
 * @param {'production' | 'new'} side
 * @returns {DiffSpan[]}
 */
export function spansFor(spans, side) {
  const theirs = side === 'production' ? 'added' : 'removed';
  return spans.filter((span) => span.type !== theirs);
}
