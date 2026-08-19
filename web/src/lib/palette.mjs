/**
 * The tone vocabulary, and the one rule that reads a number as a tone.
 *
 * A **tone** is a meaning and not a hue, there are eight of them (ticket 35), and this
 * file holds the list. It does not hold a colour: `app.css` is where a tone becomes one,
 * as a selector publishing `--tone-*` properties for a shape to read. What is here is the
 * part that was never a colour — the vocabulary, the threshold that reads a share as a
 * tone, and the chrome a tone may never take. **ADR 0023** records the eight maps of
 * Tailwind class names this file used to hold, why they left, and what it cost.
 *
 * The eight words, which is what `TONES` below is:
 *
 * | tone      | meaning                                                        |
 * |-----------|----------------------------------------------------------------|
 * | `lost`    | production has this and the new site does not                  |
 * | `added`   | the new site has this and production does not                  |
 * | `warning` | the new site is wrong on its own terms — a dead or leaked link  |
 * | `caution` | something changed and an editor decides what to do about it    |
 * | `closed`  | done                                                           |
 * | `info`    | information the editor did not ask for                         |
 * | `neutral` | carrying no judgement                                          |
 * | `total`   | a total                                                        |
 *
 * **The vocabulary is generic where the hue is free and the domain's where it is
 * not** (ticket 131). `warning`, `caution`, `info` and `neutral` are ordinary words
 * because amber, blue and grey are this tool's to spend. The other four are not.
 * `lost` and `added` are `CONTEXT.md`'s **Direction** — which side a one-sided
 * difference is missing from — and `error` and `success` were refused for them:
 * `error` promises red over an amber tone, and new-only content is a difference an
 * editor still has to resolve, so green claiming *this went well* would be a false
 * statement in the interface. `closed` is the real success state and it is blue,
 * which is the second reason `success` would mislead. `total` is worn by any total
 * and so is not the glossary's **Roll-up**, which is a summed number of a particular
 * kind.
 *
 * `lost` and `added` are the only red and the only green in the interface. No status
 * uses them. This rule is what makes the diff readable: red shows a loss, and nothing
 * else. `warning` and `caution` are two weights of one amber for the same reason. A
 * third loud hue must be the brand orange, and brand colour is for chrome only.
 *
 * **Which styleguide colour a tone takes is `app.css`'s answer and not this file's.** The
 * reasoning went there whole, so a question about a colour is asked of the file that
 * draws it.
 */

/**
 * The eight, in the order the table above reads. It is exported so the guard in
 * `palette.test.mjs` has something to check the stylesheet's tone rules against, and
 * `Tone` is derived from it so the union and the list cannot come apart.
 */
export const TONES = /** @type {const} */ ([
  'lost',
  'added',
  'warning',
  'caution',
  'closed',
  'info',
  'neutral',
  'total',
]);

/** @typedef {(typeof TONES)[number]} Tone */

/**
 * Chrome. The brand colours are in this object and nowhere else. A component that
 * reads a colour from here shows structure, and not a finding.
 */
export const CHROME = {
  header: 'bg-brand text-on-brand',
  headerMuted: 'text-surface-raised',
  // `Link/link` and not `Brand/brand`: the styleguide publishes a link colour, and
  // it is a step darker than `Primary/primary` because `#809700` on white is 3.0:1.
  link: 'text-link hover:text-link-hover',
  tabActive: 'border-secondary text-primary',
  button: 'bg-primary hover:bg-primary-strong',
  // The store switcher sits on the green header, so both of its states are chrome
  // (ticket 38). The current store reads as ink on white. The other stores are
  // sand on green, which is `headerMuted` given a hover.
  storeCurrent: 'bg-background text-brand',
  storeOther: 'text-surface-raised hover:bg-brand-dark hover:text-on-brand',
  // The row a link landed on (ticket 109). It is chrome and not a finding: it says
  // *this is the one you clicked*, which is a fact about the navigation and not a
  // claim about the content — so it must not borrow a diff hue, and it must not
  // borrow `caution` either, which would read as a condition to decide about. An
  // outline and not a ground, because the cells inside it carry the diff tints and a
  // second ground would sit underneath them and change what they print.
  landed: 'outline outline-2 -outline-offset-2 outline-primary',
};

/**
 * How much of a page differs, as a tone. Amber in two weights, and blue for none.
 * Never red, however bad the page is. A page that differs everywhere is still a
 * status, and not a direction. An editor who sees the diff red here reads the
 * whole page as lost content.
 *
 * @param {number} share 0 to 1.
 * @returns {Tone}
 */
export function severityTone(share) {
  if (share === 0) return 'closed';
  return share > 0.5 ? 'warning' : 'caution';
}
