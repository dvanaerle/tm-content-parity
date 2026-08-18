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
 * entry is one of eight **tones**. A tone is a meaning, and not a hue:
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
 * because amber, blue and grey are this file's to spend. The other four are not.
 * `lost` and `added` are `CONTEXT.md`'s **Direction** — which side a one-sided
 * difference is missing from — and `error` and `success` were refused for them:
 * `error` promises red over an amber tone, and new-only content is a difference an
 * editor still has to resolve, so green claiming *this went well* would be a false
 * statement in the interface. `closed` is the real success state and it is blue,
 * which is the second reason `success` would mislead. `total` is worn by any total
 * and so is not the glossary's **Roll-up**, which is a summed number of a particular
 * kind.
 *
 * `lost` and `added` are the only red and the only green in the interface. No
 * status uses them. This rule is what makes the diff readable: red shows a loss,
 * and nothing else. `warning` and `caution` are two weights of one amber for the
 * same reason. A third loud hue must be the brand orange, and brand colour is
 * for chrome only.
 *
 * **This file is where a tone becomes a styleguide colour.** Since the palette was
 * rebuilt from the Figma styleguide, `app.css` holds styleguide names only —
 * `danger-subtle`, `on-warning`, `info-text` — and the tone names above are this
 * tool's, not the styleguide's. The translation happens here and nowhere else, so
 * the answer to "which styleguide colour is `caution`?" is one grep away. The
 * mapping is:
 *
 * | tone      | styleguide group                                    |
 * |-----------|-----------------------------------------------------|
 * | `lost`    | `Danger` — spent on direction, not on status        |
 * | `added`   | `Success` — likewise                                |
 * | `warning` | `Warning`, solid step                               |
 * | `caution` | `Warning`, subtle step                              |
 * | `closed`  | `Info`                                              |
 * | `info`    | `Info`                                              |
 * | `neutral` | `Surface/surface-strong` ground, `Text/text-muted`  |
 * | `total`   | `Border/border-strong`                              |
 *
 * Two tones on one styleguide group is not new — `warning` and `caution` have always
 * shared `Warning`. Those two take **different steps** of it and must print different
 * pixels, because one reports a failure and the other a condition. `closed` and `info`
 * take the **same** step on purpose: they were one tone until ticket 131, the split is
 * about which of two meanings a reader is being handed, and it moved no pixel.
 *
 * Tailwind finds class names in the source text. Therefore each value in this
 * file is a literal, and no value is assembled from parts.
 *
 * **The same eight tones are also in `app.css` now, as selectors (ticket 132, 2026-08-18).**
 * Both forms are live and both work: this is the **expand** half of the move, and ticket
 * 133 migrates the surfaces and then deletes the maps below. The sentence one paragraph up
 * is why the move is happening — a tone that depends on a state cannot be a literal, and
 * everything here has to be a literal — and it stops being true of a tone the moment the
 * tone is a rule instead of a class name. The reasoning in this docblock has been carried
 * across to `app.css` whole; when the two disagree, the stylesheet is the one that draws.
 *
 * The diff moved first, 133 part A moved the dashboard's two views after it, and part B
 * moved the page's ledger and the controls beside it — so **none of the eight maps below has
 * a caller left**. Nothing here draws anything any more. They stay for one more commit
 * because part C is where the deletion happens, once, and a map deleted early is a surface
 * with no colour and a build that succeeds.
 */

/**
 * The eight, in the order the tables above read. It is exported so the guard in
 * `palette.test.mjs` has something to check every map against, and `Tone` is derived
 * from it so the union and the list cannot come apart.
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

/** A tinted label. The default shape for a class name or a state. */
export const PILL = {
  lost: 'bg-danger-subtle text-danger-text',
  added: 'bg-success-subtle text-success-text',
  warning: 'bg-warning-subtle text-on-warning',
  caution: 'bg-warning-subtle text-on-warning',
  closed: 'bg-info-subtle text-info-text',
  info: 'bg-info-subtle text-info-text',
  neutral: 'bg-muted text-muted-foreground',
  total: 'bg-border-strong text-white',
};

/** A filled chip. Use it for a number that must be legible at a distance. */
export const SOLID = {
  lost: 'bg-danger text-white',
  added: 'bg-success text-white',
  warning: 'bg-warning text-white',
  // Not solid, and not a mistake: the quiet amber has no solid step that keeps its ink
  // legible, so the pair stays apart here by the subtle one staying subtle.
  caution: 'bg-warning-subtle text-on-warning',
  closed: 'bg-info text-white',
  info: 'bg-info text-white',
  neutral: 'bg-surface-strong text-text-muted',
  total: 'bg-border-strong text-white',
};

/**
 * A bar fill or a dot. One flat colour, no ink.
 *
 * `warning` takes `warning-text` and `caution` takes `warning`, which is the one
 * place the two amber weights run darker rather than lighter. With no ink on top,
 * the subtle step is invisible against the page, so the pair has to come from the
 * other end of the ramp — and the deeper of the two is still the louder of the two.
 *
 * `secondary` is not a tone. It is the brand step a progress track fills with, and it
 * is here because a fill is what it is; `TONES` does not hold it and the guard in
 * `palette.test.mjs` names it as the one exception.
 */
export const FILL = {
  lost: 'bg-danger',
  added: 'bg-success',
  warning: 'bg-warning-text',
  caution: 'bg-warning',
  closed: 'bg-info',
  info: 'bg-info',
  neutral: 'bg-border',
  total: 'bg-border-strong',
  secondary: 'bg-secondary',
};

/**
 * A whole-width message. Border, ground and ink.
 *
 * `warning` gets the deeper amber ground and `caution` the pale one. The two
 * tones must not print the same pixels: a `warning` banner reports a failure, a
 * `caution` banner reports a condition, and a reader who sees one shape cannot
 * tell which of the two they have.
 */
export const BANNER = {
  lost: 'border-danger bg-danger-subtle text-danger-text',
  added: 'border-success bg-success-subtle text-success-text',
  warning: 'border-warning-text bg-warning text-white',
  caution: 'border-warning bg-warning-subtle text-on-warning',
  closed: 'border-info bg-info-subtle text-info-text',
  info: 'border-info bg-info-subtle text-info-text',
  neutral: 'border-border bg-surface text-text-muted',
  total: 'border-border-strong bg-border-strong text-white',
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
  added: 'text-success-text',
  caution: 'text-on-warning',
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
 * calm. It takes the same ground as `SURFACE` under a darker ink.
 *
 * It takes the styleguide's own pairing: the `*-subtle` ground under `on-*-subtle`, a step
 * darker than the pill's ink. That is loud enough because **the word layer only ever
 * appears on an untinted cell.** A one-sided pair has nothing to diff against, so it gets
 * the row layer and no words; a two-sided pair gets the words and no tint. The two layers
 * never stack, so the word only has to stand off the page.
 */
export const TOKEN = {
  lost: 'bg-danger-subtle text-on-danger-subtle',
  added: 'bg-success-subtle text-on-success-subtle',
};

/**
 * A native form control's own colour. The fix checkbox (ticket 36) has three
 * visual states, and two of them are ticked: `closed` for a claim that stands, and
 * `caution` for a claim a later observation contradicted.
 *
 * It holds status tones only. A checkbox is a work state, and a work state never
 * wears the diff hues.
 *
 * **It stopped drawing anything before the tone move reached it.** `accent-color` paints a
 * native control, and the checkbox has been shadcn's on Base UI since the library came in —
 * so the ticked colour has been a ground and a border for longer than this file has said so,
 * and the pair on screen is the one `app.css`'s tick shape holds, `added` and `caution`, with
 * the green recorded there as the exception it is. Deleted in ticket 133 part C with the rest.
 */
export const ACCENT = {
  closed: 'accent-info',
  caution: 'accent-warning',
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
