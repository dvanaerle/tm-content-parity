/**
 * The Dutch name of each store view, for the one place a reader needs the id
 * explained. The id itself stays the label everywhere (`CONTEXT.md`).
 *
 * The interface is Dutch on every store, including `de` and `uk`. The log's
 * question is whether two strings match, which needs no comprehension of either
 * (ticket 38).
 *
 * @type {Record<string, string>}
 */
export const STORE_NAME = {
  nl: 'Nederland',
  be: 'België (Nederlands)',
  be_fr: 'België (Frans)',
  de: 'Duitsland',
  fr: 'Frankrijk',
  uk: 'Verenigd Koninkrijk',
};
