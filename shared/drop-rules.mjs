/**
 * The rules that drop a production URL before it is a store page, and what each
 * one means (ticket 56).
 *
 * A rule is a **name** in the data and its words are here. `crawl/seed-list.mjs`
 * writes the name when it drops a URL and the web build reads it back to show
 * the reason, so the sentence can be corrected without a new seed list and
 * without a new crawl.
 *
 * Two stages read this and `crawl/` cannot import `web/`, so it is a resident of
 * `shared/` under ADR 0001. The merge that builds the *Not checked* list is
 * **not** here: only `web/` needs it.
 */

/** @type {Record<string, { reason: string }>} */
export const DROP_RULES = {
  'product-signature': {
    reason: 'Product page generated from the catalogue.',
  },
  'six-alternates-never-daily': {
    reason: 'Catalogue page generated for all stores.',
  },
  'foreign-host': {
    reason:
      'The host is not one of the five production hosts. The log can say nothing ' +
      'about such a URL, because it belongs to no store.',
  },
  'duplicate-in-store': {
    reason: 'Duplicate production URL. Another URL is used for this page.',
  },
};

/**
 * The words for one dropped URL: the rule's reason, and the detail the rule
 * needs when one sentence cannot hold it.
 *
 * @param {{ rule: string, detail?: string }} entry
 * @returns {string}
 */
export function dropReason({ rule, detail }) {
  const reason = DROP_RULES[rule]?.reason ?? `Unknown rule \`${rule}\`.`;
  return detail ? `${reason} ${detail}` : reason;
}

/**
 * Every drop whose rule is not in the vocabulary. `crawl/10-store-seeds.mjs`
 * asks this of its own output before it writes: a rule with no reason is the
 * silent exclusion this ticket exists to end.
 *
 * @param {{ loc: string, rule: string }[]} dropped
 * @returns {string[]}
 */
export function unknownDropRules(dropped) {
  return dropped
    .filter((entry) => !DROP_RULES[entry.rule])
    .map((entry) => `${entry.loc}: no reason for rule \`${entry.rule}\``);
}
