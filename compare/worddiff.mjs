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
 */

/**
 * @typedef {object} DiffSpan
 * @property {'same' | 'removed' | 'added'} type  `removed` is production's, `added` is the
 *                                                new site's. A `same` span belongs to both.
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
 * @param {string | null} prod  Production's normalised text.
 * @param {string | null} next  The new site's normalised text.
 * @returns {DiffSpan[]} In reading order. Adjacent tokens of the same type make one
 *   span, because a reader sees two removed words in sequence as one change.
 */
export function wordDiff(prod, next) {
  const left = tokens(prod);
  const right = tokens(next);

  /** @type {DiffSpan[]} */
  const spans = [];
  /** @param {DiffSpan['type']} type @param {string} token */
  const push = (type, token) => {
    const last = spans.at(-1);
    if (last?.type === type) last.text += token;
    else spans.push({ type, text: token });
  };

  const n = left.length;
  const m = right.length;

  // Longest common subsequence, the same backbone `lcsPairs` uses on units, so
  // one inserted word does not report every later word as changed. `table[i][j]`
  // is the length of the LCS of `left[i..]` and `right[j..]`.
  const table = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[i][j] = left[i] === right[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (left[i] === right[j]) {
      push('same', left[i]);
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      // The loss is reported before the addition that replaced it, on every
      // substitution, so production stays the left-hand reference everywhere.
      push('removed', left[i]);
      i += 1;
    } else {
      push('added', right[j]);
      j += 1;
    }
  }
  while (i < n) push('removed', left[i++]);
  while (j < m) push('added', right[j++]);

  return spans;
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
