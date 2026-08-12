/**
 * The one colour map (ticket 35).
 *
 * There were four colour maps before this file: a class tone table, a chip tone
 * table, a finding-state table and a banner table. Three colour pairs were also
 * written inline. The maps put different names onto overlapping values, and
 * `bg-emerald-100 text-emerald-800` had three of those names. Thus the question
 * "what does green mean here?" had no answer.
 *
 * It has an answer now. Each colour in a component comes from this file. Each
 * entry is one of seven **tones**. A tone is a meaning, and not a hue:
 *
 * | tone        | meaning                                                     |
 * |-------------|-------------------------------------------------------------|
 * | `lost`      | production has this and the new site does not                |
 * | `added`     | the new site has this and production does not                |
 * | `severe`    | the new site is wrong on its own terms — a dead or leaked link |
 * | `attention` | something changed and an editor decides what to do about it  |
 * | `info`      | done, or information the editor did not ask for              |
 * | `neutral`   | hidden, muted, or switched off                               |
 * | `dark`      | a total, which is not a judgement at all                     |
 *
 * `lost` and `added` are the only red and the only green in the interface. No
 * status uses them. This rule is what makes the diff readable: red shows a loss,
 * and nothing else. `severe` and `attention` are two weights of one amber for the
 * same reason. A third loud hue must be the brand orange, and brand colour is
 * for chrome only.
 *
 * **This file is where a tone becomes a styleguide colour.** Since the palette was
 * rebuilt from the Figma styleguide, `app.css` holds styleguide names only —
 * `danger-subtle`, `on-warning`, `info-text` — and the tone names above are this
 * tool's, not the styleguide's. The translation happens here and nowhere else, so
 * the answer to "which styleguide colour is `attention`?" is one grep away. The
 * mapping is:
 *
 * | tone        | styleguide group                                    |
 * |-------------|-----------------------------------------------------|
 * | `lost`      | `Danger` — spent on direction, not on status        |
 * | `added`     | `Success` — likewise                                |
 * | `severe`    | `Warning`, solid step                               |
 * | `attention` | `Warning`, subtle step                              |
 * | `info`      | `Info`                                              |
 * | `neutral`   | `Surface/surface-strong` ground, `Text/text-muted`  |
 * | `dark`      | `Border/border-strong`                              |
 *
 * Tailwind finds class names in the source text. Therefore each value in this
 * file is a literal, and no value is assembled from parts.
 */

/** @typedef {'lost' | 'added' | 'severe' | 'attention' | 'info' | 'neutral' | 'dark'} Tone */

/** A tinted label. The default shape for a class name or a state. */
export const PILL = {
  lost: 'bg-danger-subtle text-danger-text',
  added: 'bg-success-subtle text-success-text',
  severe: 'bg-warning-subtle text-on-warning',
  attention: 'bg-warning-subtle text-on-warning',
  info: 'bg-info-subtle text-info-text',
  neutral: 'bg-secondary text-secondary-foreground',
  dark: 'bg-border-strong text-white',
};

/** A filled chip. Use it for a number that must be legible at a distance. */
export const SOLID = {
  lost: 'bg-danger text-white',
  added: 'bg-success text-white',
  severe: 'bg-warning text-white',
  attention: 'bg-warning-subtle text-on-warning',
  info: 'bg-info text-white',
  neutral: 'bg-surface-strong text-text-muted',
  dark: 'bg-border-strong text-white',
};

/**
 * A bar fill or a dot. One flat colour, no ink.
 *
 * `severe` takes `warning-text` and `attention` takes `warning`, which is the one
 * place the two amber weights run darker rather than lighter. With no ink on top,
 * the subtle step is invisible against the page, so the pair has to come from the
 * other end of the ramp — and the deeper of the two is still the louder of the two.
 */
export const FILL = {
  lost: 'bg-danger',
  added: 'bg-success',
  severe: 'bg-warning-text',
  attention: 'bg-warning',
  info: 'bg-info',
  neutral: 'bg-border',
  dark: 'bg-border-strong',
};

/**
 * A whole-width message. Border, ground and ink.
 *
 * `severe` gets the deeper amber ground and `attention` the pale one. The two
 * tones must not print the same pixels: a `severe` banner reports a failure, an
 * `attention` banner reports a condition, and a reader who sees one shape cannot
 * tell which of the two they have.
 */
export const BANNER = {
  lost: 'border-danger bg-danger-subtle text-danger-text',
  added: 'border-success bg-success-subtle text-success-text',
  severe: 'border-warning-text bg-warning text-white',
  attention: 'border-warning bg-warning-subtle text-on-warning',
  info: 'border-info bg-info-subtle text-info-text',
  neutral: 'border-border bg-surface text-text-muted',
  dark: 'border-border-strong bg-border-strong text-white',
};

/**
 * Ink on the page ground, for a word or a number beside other text. No border and
 * no fill: a tinted label is `PILL`.
 *
 * It holds the tones a caller asks for, like `TOKEN` and unlike `SURFACE`. An
 * entry is added when a component needs it.
 */
export const INK = {
  lost: 'text-danger-text',
  attention: 'text-on-warning',
  info: 'text-info-text',
};

/**
 * The row layer of the diff: a whole cell whose content exists on one side only.
 *
 * It holds two tones and no more. A tinted cell is a claim that the content is
 * missing on the other side, and only `lost` and `added` make that claim.
 */
export const SURFACE = {
  lost: 'bg-danger-subtle',
  added: 'bg-success-subtle',
};

/**
 * The word layer of the diff: a changed token inside a cell that is otherwise
 * calm. Stronger than `SURFACE` so the two layers stay apart when one sits inside
 * the other.
 *
 * It used to be a mid tint under dark ink, which the styleguide has no step for —
 * its ramps go subtle → solid → text → on-subtle, and nothing in between. So the
 * word inverts instead: the `*-text` step as a ground, white on top. That reads
 * louder than the tinted cell around it, which is what the layer is for, and it
 * needs no colour the styleguide does not publish.
 */
export const TOKEN = {
  lost: 'bg-danger-subtle text-on-danger-subtle',
  added: 'bg-success-subtle text-on-success-subtle',
};

/**
 * A native form control's own colour. The fix checkbox (ticket 36) has three
 * visual states, and two of them are ticked: `info` for a claim that stands, and
 * `attention` for a claim a later observation contradicted.
 *
 * It holds status tones only. A checkbox is a work state, and a work state never
 * wears the diff hues.
 */
export const ACCENT = {
  info: 'accent-info',
  attention: 'accent-warning',
};

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
  tabActive: 'border-primary text-brand',
  button: 'bg-primary hover:bg-primary-strong',
  // The store switcher sits on the green header, so both of its states are chrome
  // (ticket 38). The current store reads as ink on white. The other stores are
  // sand on green, which is `headerMuted` given a hover.
  storeCurrent: 'bg-background text-brand',
  storeOther: 'text-surface-raised hover:bg-brand-dark hover:text-on-brand',
  // The row a link landed on (ticket 109). It is chrome and not a finding: it says
  // *this is the one you clicked*, which is a fact about the navigation and not a
  // claim about the content — so it must not borrow a diff hue, and it must not
  // borrow `attention` either, which would read as a condition to decide about. An
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
  if (share === 0) return 'info';
  return share > 0.5 ? 'severe' : 'attention';
}
