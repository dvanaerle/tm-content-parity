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
 * Tailwind finds class names in the source text. Therefore each value in this
 * file is a literal, and no value is assembled from parts.
 */

/** @typedef {'lost' | 'added' | 'severe' | 'attention' | 'info' | 'neutral' | 'dark'} Tone */

/** A tinted label. The default shape for a class name or a state. */
export const PILL = {
  lost: 'bg-lost-surface text-lost',
  added: 'bg-added-surface text-added',
  severe: 'bg-severe text-white',
  attention: 'bg-attention text-attention-ink',
  info: 'bg-info text-info-ink',
  neutral: 'bg-slate-100 text-slate-600',
  dark: 'bg-slate-900 text-white',
};

/** A filled chip. Use it for a number that must be legible at a distance. */
export const SOLID = {
  lost: 'bg-lost text-white',
  added: 'bg-added text-white',
  severe: 'bg-severe text-white',
  attention: 'bg-attention text-attention-ink',
  info: 'bg-info-ink text-white',
  neutral: 'bg-slate-100 text-slate-700',
  dark: 'bg-slate-900 text-white',
};

/** A bar fill or a dot. One flat colour, no ink. */
export const FILL = {
  lost: 'bg-lost',
  added: 'bg-added',
  severe: 'bg-severe',
  attention: 'bg-attention-fill',
  info: 'bg-info-ink',
  neutral: 'bg-slate-300',
  dark: 'bg-slate-900',
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
  lost: 'border-lost-token bg-lost-surface text-lost',
  added: 'border-added-token bg-added-surface text-added',
  severe: 'border-severe bg-attention-fill text-attention-ink',
  attention: 'border-attention-fill bg-attention text-attention-ink',
  info: 'border-info bg-info text-info-ink',
  neutral: 'border-slate-200 bg-slate-50 text-slate-600',
  dark: 'border-slate-900 bg-slate-900 text-white',
};

/**
 * Ink on the page ground, for a word or a number beside other text. No border and
 * no fill: a tinted label is `PILL`.
 *
 * It holds the tones a caller asks for, like `TOKEN` and unlike `SURFACE`. An
 * entry is added when a component needs it.
 */
export const INK = {
  lost: 'text-lost',
  attention: 'text-attention-ink',
  info: 'text-info-ink',
};

/**
 * The row layer of the diff: a whole cell whose content exists on one side only.
 *
 * It holds two tones and no more. A tinted cell is a claim that the content is
 * missing on the other side, and only `lost` and `added` make that claim.
 */
export const SURFACE = {
  lost: 'bg-lost-surface',
  added: 'bg-added-surface',
};

/**
 * The word layer of the diff: a changed token inside a cell that is otherwise
 * calm. Stronger than `SURFACE` so the two layers stay apart when one sits inside
 * the other.
 */
export const TOKEN = {
  lost: 'bg-lost-token text-lost',
  added: 'bg-added-token text-added',
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
  info: 'accent-info-ink',
  attention: 'accent-attention-fill',
};

/**
 * Chrome. The brand colours are in this object and nowhere else. A component that
 * reads a colour from here shows structure, and not a finding.
 */
export const CHROME = {
  header: 'bg-brand-green text-white',
  headerMuted: 'text-brand-sand',
  link: 'text-brand-green hover:text-brand-lighter-green',
  tabActive: 'border-brand-lighter-green text-brand-green',
  button: 'bg-brand-green hover:bg-brand-medium-green',
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
