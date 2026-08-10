/**
 * The mute key, and nothing else.
 *
 * The derivation, the port and the control must build one key the same way. One
 * building, and not three that become different. Three stages read this file,
 * thus it is in `shared/`: pure, and it imports nothing. See ADR 0001.
 *
 * It lived in `compare/contract.mjs` until ticket 88 made it live in the browser.
 * That file imports `node:crypto` for `findingId()`, and a Vite build of an island
 * that reaches it fails on that import — so the key cannot live there and be
 * pressed by an editor. It is **not** re-exported from the contract, because a
 * second import path is the same trap again.
 */

/**
 * Whether a mute names a section at all.
 *
 * The one place the difference between an absent heading and a null one is
 * decided, so that the key, the port, the count and the undo button cannot each
 * decide it differently.
 *
 * @param {{ anchorHeading?: string | null }} parts
 * @returns {boolean}
 */
export function namesSection(parts) {
  return parts.anchorHeading !== undefined;
}

/**
 * The heading part of the mute key, as one unambiguous string.
 *
 * ADR 0008 gives the heading **three** states and two of them are empty in a
 * payload, so they cannot both encode to nothing: **absent** is the page-wide
 * form, and `null` is the content before the first heading, which is a real
 * section. A named heading is prefixed, and the prefix is what stops a heading
 * spelled `*page` from landing in the page-wide slot.
 *
 * `anchor_heading_slot` in `supabase/schema.sql` is a generated column holding
 * the same expression in SQL, and `overrides_current` keys on it. The two must
 * agree.
 *
 * @param {{ anchorHeading?: string | null }} parts
 * @returns {string}
 */
export function anchorHeadingSlot(parts) {
  if (!namesSection(parts)) return '*page';
  return parts.anchorHeading === null ? '*none' : `#${parts.anchorHeading}`;
}

/**
 * The mute key from ticket 01, with the section ticket 88 added: store, page,
 * class and anchor heading. A mute persists, and it covers rotating content such
 * as campaigns and prices. It holds no content of its own.
 *
 * @param {{ store: string, page: string, class: string, anchorHeading?: string | null }} parts
 * @returns {string}
 */
export function muteKey(parts) {
  return [parts.store, parts.page, parts.class, anchorHeadingSlot(parts)].join('|');
}
