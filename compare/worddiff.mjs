/**
 * The word-level diff (ticket 35). Two normalised strings in, a list of
 * unchanged / removed / added spans out.
 *
 * **Browser-safe and pure.** It imports nothing, so a React island imports it
 * directly — the same rule that split `vocabulary.mjs` out of `contract.mjs`.
 * This is the one new seam spec 32 adds, and it is a module rather than a
 * component precisely so Node can test it: there is no browser test stack in this
 * repo, and a rule with judgement in it that only a component can run is a rule
 * with no test.
 *
 * **Words, not characters.** A Dutch compound shares most of its letters with the
 * compound that replaced it — `terrasoverkapping` against `tuinoverkapping` — so a
 * character-level diff paints confetti inside one word instead of saying that the
 * word changed. The whole word is the unit.
 *
 * **A link target is a word list too.** The panel diffs two link keys with this
 * same function, so the separators inside a url — `/ ? & = #` — count as
 * boundaries beside whitespace. Without them a target is a single token, the diff
 * says only "it changed", and the changed **path segment** is what an editor needs
 * to see.
 *
 * **The caller passes `norm`, never `raw`.** Tier 1 folds curly quotes, NBSP,
 * dashes and entities deliberately, and diffing `raw` would paint differences that
 * the tool classifies as equal in the same breath. `raw` reaches an editor through
 * a copy button instead.
 */

/**
 * @typedef {object} DiffSpan
 * @property {'same' | 'removed' | 'added'} type  `removed` is production's, `added` is the
 *                                                new site's. A `same` span belongs to both.
 * @property {string} text
 */

/**
 * Runs of separator and runs of content, alternating. The separators are kept as
 * tokens of their own rather than glued to a neighbour, so that concatenating one
 * side's spans reproduces that side's input character for character — a renderer
 * that has to insert the spaces back would be guessing where they were.
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
 * @returns {DiffSpan[]} In reading order. Neighbouring tokens of the same type are
 *   one span, because two removed words in a row are one edit to a reader.
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

  // Longest common subsequence, the same backbone `lcsPairs` uses on elements, so
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
