/**
 * Where is it? Ticket 34.
 *
 * A finding used to carry no position at all — id, store, page, check, class, the
 * two strings, an occurrence count and a score. So a finding reading `hier` or
 * `carports` sent an editor hunting through the page by eye. Two answers live
 * here: the section a position sits in, and a url that opens the live page
 * scrolled to it.
 *
 * Browser-safe on purpose, like `vocabulary.mjs`: no `node:crypto` and no
 * `node:*` at all, so a React island imports it directly and the compare stage
 * and the screen cannot disagree about where something is.
 *
 * Ticket 01 stands: **no DOM path**. Both answers are made from the document
 * order the extractor already records and from the text itself.
 */

/**
 * The section an editor should scroll to.
 *
 * A heading is not its own anchor heading. The nearest heading **before** the
 * position is the section it lives in, and a heading demoted from `h2` to `h3` is
 * reported under the heading above it, which is where a reader finds it.
 *
 * @param {import('./contract.mjs').ContentUnit[]} units  In document order.
 * @returns {(index: number | null | undefined) => string | null} `null` when the
 *   position precedes every heading, and on a page with no heading at all.
 */
export function anchorHeadingFor(units) {
  const headings = units.filter((unit) => unit.kind === 'heading');

  return (index) => {
    if (index == null) return null;
    let found = null;
    for (const heading of headings) {
      if (heading.index >= index) break;
      found = heading;
    }
    return found ? found.raw : null;
  };
}

/**
 * How many words each end of a long text fragment carries. A whole paragraph in
 * the url is unreadable and breaks on the first invisible character the browser
 * and the extractor disagree about; the `start,end` form asks the browser to
 * match the two ends and takes everything between.
 */
const FRAGMENT_WORDS = 6;

/**
 * A url that opens the live page scrolled to this text, on production and on the
 * new site alike.
 *
 * The text is matched by the browser against what it rendered, so this takes the
 * **literal** text, never the tier-1 normalisation: normalisation folds curly
 * quotes, NBSP and dashes deliberately, and a folded string is not on the page.
 *
 * @param {string | null | undefined} url
 * @param {string | null | undefined} text
 * @returns {string | null} `null` when there is nothing to point at.
 */
export function textFragmentUrl(url, text) {
  if (!url || !text) return null;

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;

  const fragment =
    words.length > FRAGMENT_WORDS * 2
      ? `${term(words.slice(0, FRAGMENT_WORDS))},${term(words.slice(-FRAGMENT_WORDS))}`
      : term(words);

  return `${url}#:~:text=${fragment}`;
}

/**
 * `-` separates a prefix and a suffix inside a text directive, so a hyphen in the
 * words themselves has to be escaped. `encodeURIComponent` leaves it alone and
 * already handles the comma and the ampersand.
 *
 * @param {string[]} words
 */
const term = (words) => encodeURIComponent(words.join(' ')).replaceAll('-', '%2D');
