import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { DROP_RULES, dropReason, unknownDropRules } from './drop-rules.mjs';

const drop = (path, rule = 'product-signature') => ({
  loc: `https://www.tuinmaximaal.nl/${path}`,
  store: 'nl',
  path,
  rule,
});

/**
 * The reasons are the whole point of the ticket: a page the log does not check
 * says why, in words an editor can read. A rule with no reason is the silent
 * exclusion the ticket ends.
 */
describe('the drop vocabulary', () => {
  it('gives every rule a reason', () => {
    for (const [rule, entry] of Object.entries(DROP_RULES)) {
      expect(entry.reason, rule).toBeTruthy();
    }
  });

  it('names a rule it does not know rather than showing an empty reason', () => {
    expect(dropReason({ rule: 'looked-wrong' })).toContain('looked-wrong');
    expect(unknownDropRules([drop('x', 'looked-wrong')])).toHaveLength(1);
  });

  it('adds the detail to the reason, because one sentence cannot hold it', () => {
    const said = dropReason({ rule: 'duplicate-in-store', detail: 'It lost to `overkapping`.' });
    expect(said).toContain(DROP_RULES['duplicate-in-store'].reason);
    expect(said).toContain('It lost to `overkapping`.');
  });

  it('says nothing about a rule that is in the data and in the vocabulary', () => {
    expect(unknownDropRules([drop('spuitbus-mat-wit')])).toEqual([]);
  });
});

/**
 * The committed measurement. The ticket estimated about 60 excluded pages; the
 * corpus that exists holds 105 drops, and every one of them is a product page.
 * These read the file, so a rule that starts dropping something else is a
 * failing test and not a quiet change in a dashboard nobody opened.
 */
describe('the committed drop list', () => {
  const seeds = JSON.parse(readFileSync(new URL('../data/10-store-seeds.json', import.meta.url), 'utf8'));

  it('is a list and not a count', () => {
    expect(Array.isArray(seeds.dropped)).toBe(true);
    expect(seeds.dropped).toHaveLength(105);
  });

  it('gives every entry a reason an editor can read', () => {
    expect(unknownDropRules(seeds.dropped)).toEqual([]);
    for (const entry of seeds.dropped) expect(dropReason(entry).length).toBeGreaterThan(20);
  });

  it('holds only the product signature, which is what this corpus drops', () => {
    expect([...new Set(seeds.dropped.map((entry) => entry.rule))]).toEqual(['product-signature']);
  });

  it('gives each store its own drops, and the ten British ones are there', () => {
    const byStore = {};
    for (const entry of seeds.dropped) byStore[entry.store] = (byStore[entry.store] ?? 0) + 1;
    expect(byStore).toEqual({ nl: 19, be: 19, be_fr: 19, de: 19, fr: 19, uk: 10 });
  });
});
