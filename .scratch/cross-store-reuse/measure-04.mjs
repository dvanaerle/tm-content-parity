/**
 * What ticket 04 costs and saves, over the corpus on disk.
 *
 * It reads the six built search indexes — every `work` finding in the log, which is exactly
 * the corpus a repeat is grouped over — and counts the repeats under the two keys: the block's
 * first term (ticket 03) and the check's (ticket 04). The difference is how many decisions an
 * editor stops repeating.
 *
 * Run after `npm run build`: node .scratch/cross-store-reuse/measure-04.mjs
 */
import { readFileSync } from 'node:fs';
import { FINDING_CLASSES } from '../../compare/vocabulary.mjs';
import { blockOf } from '../../web/src/lib/language-blocks.mjs';

const STORES = ['nl', 'be', 'be_fr', 'fr', 'de', 'uk'];
const SAME_STRING = new Set(['images', 'links']);

const findings = STORES.flatMap(
  (store) => JSON.parse(readFileSync(`dist/search-index/${store}.json`, 'utf8')).findings,
);

const keyed = (first) => (one) =>
  JSON.stringify([first(one), one.class, one.prod, one.new, one.detail]);

const blockTerm = (one) => blockOf(one.store)?.language ?? one.store;
const checkTerm = (one) =>
  SAME_STRING.has(FINDING_CLASSES[one.class]?.check) ? '*' : blockTerm(one);

/** Each key, and the set of stores its findings are on. */
const groups = (key) => {
  const by = new Map();
  for (const one of findings) {
    const k = key(one);
    if (!by.has(k)) by.set(k, new Set());
    by.get(k).add(one.store);
  }
  return by;
};

const before = groups(keyed(blockTerm));
const after = groups(keyed(checkTerm));

const inSameString = findings.filter((one) => SAME_STRING.has(FINDING_CLASSES[one.class]?.check));

/** The rows keyed on the check rather than on a block: every `images` and `links` repeat. */
const onTheCheck = [...after].filter(([key]) => key.startsWith('["*"'));
const spread = (rows, wider) => rows.filter(([, stores]) => stores.size > wider).length;

console.log(`work findings over six stores       ${findings.length}`);
console.log(`  of them on images or links        ${inSameString.length}`);
console.log(`repeats, keyed on the block         ${before.size}`);
console.log(`repeats, keyed on the check         ${after.size}`);
console.log(`judgements an editor stops making   ${before.size - after.size}`);
console.log(`repeats keyed on the check          ${onTheCheck.length}`);
console.log(`  on more than one store            ${spread(onTheCheck, 1)}`);
console.log(`  on more than two, which is new    ${spread(onTheCheck, 2)}`);
console.log(`  on all six                        ${spread(onTheCheck, 5)}`);
