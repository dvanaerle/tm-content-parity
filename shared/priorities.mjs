/**
 * The words a page's priority can be, and nothing else.
 *
 * **A closed list in git, not a table.** Ticket 83 refused the schema editor the proposal
 * asked for — add, rename, reorder, hide, remove, edit the options — because a rename and
 * a reorder are mutations, and the overrides table has insert and select policies only. A
 * list nobody can edit at runtime cannot drift, and a list *in* the database would need
 * authentication to be safe: an editor here is a name in `localStorage`.
 *
 * It is in `shared/` for the reason ticket 08 gave the class vocabulary: a browser island
 * reads it, and `compare/contract.mjs` pulls `node:crypto` for `findingId()`, which a Vite
 * island build fails on. Pure, imports nothing, read by more than one stage — the
 * derivation validates against it and the dashboard draws it. See ADR 0001.
 *
 * **There is no `normal`.** Absence is not a value: a page with no priority carries no
 * `prioritised` event, or carries one that cleared it. A word for the state every page is
 * already in would be a fourth thing to filter by that means "no filter".
 */

/** @typedef {'high' | 'medium' | 'low'} Priority */

/** Most urgent first, which is the order the picker and the filter draw them in. */
export const PRIORITIES = /** @type {Priority[]} */ (['high', 'medium', 'low']);

/**
 * Whether this is one of the three.
 *
 * The table holds no list of these words to check a row against, so this is the only
 * thing standing between a typo and a permanent row — and the table is append-only, so a
 * refused write is the only kind of undo there is.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export const isPriority = (value) => (
  typeof value === 'string' && /** @type {string[]} */ (PRIORITIES).includes(value)
);
