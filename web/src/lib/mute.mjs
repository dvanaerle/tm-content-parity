import { muteCoverage } from '../../../overrides/state.mjs';

/**
 * What *dempen* offers, and what each form says before it is pressed.
 *
 * ADR 0008: the mute is the one override that hides the most and explained the
 * least. The two things that fix it are a **count** and a **note**, and the count
 * has to be on the button — not in a confirmation afterwards, because by then the
 * press has already been made.
 *
 * The section form is first because it is the judgement an editor usually means.
 * The page-wide form stays second and is never hidden: on a page of per-photo
 * captions the section form is useless, and the two counts say so on their own.
 * There is no threshold here on purpose.
 *
 * Each form carries the **key it would write**, so the number on the button and
 * the event behind it cannot drift apart. An absent `anchorHeading` is the
 * page-wide form; `null` is the content before the first heading.
 *
 * @param {{ class: string, anchorHeading?: string | null, shown?: boolean }[]} findings
 *   The derived findings of the page, which is the snapshot the editor sees.
 * @param {{ class: string, anchorHeading?: string | null }} pressedOn  The finding
 *   the editor pressed on. It gives the class and the section, and nothing else.
 */
export function muteForms(findings, pressedOn) {
  const anchorHeading = pressedOn.anchorHeading ?? null;
  const section = { class: pressedOn.class, anchorHeading };
  const wide = { class: pressedOn.class };

  return [
    { key: section, where: sectionName(anchorHeading), count: muteCoverage(findings, section) },
    { key: wide, where: 'op de hele pagina', count: muteCoverage(findings, wide) },
  ].map((form) => ({ ...form, says: `${howMany(form.count)} ${form.where}` }));
}

/**
 * A null heading is a section with a name, not an absence. "de inhoud vóór de
 * eerste kop" is what it is, and an editor who reads that does not press it
 * thinking they muted the page.
 *
 * Exported because a bulk mute names sections too (ticket 31), and one phrase for one
 * concept is what keeps the two presses describing the same thing the same way.
 *
 * @param {string | null} anchorHeading
 */
export const sectionName = (anchorHeading) => (
  anchorHeading === null ? 'in de inhoud vóór de eerste kop' : `onder “${anchorHeading}”`
);

/** @param {number} n */
const howMany = (n) => `${n} ${n === 1 ? 'bevinding' : 'bevindingen'}`;
