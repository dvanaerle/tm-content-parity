/**
 * The measurement gate of ticket 03, run against the committed reports.
 *
 * It asks one question of `repeatsInStore()` — the derivation the ticket changes — and
 * nothing of Supabase, because the gate is about how much work a press can reach and not
 * about how much anybody has pressed.
 *
 * **Before** is `repeatsInStore()` over one store's pages, which is what a dashboard held
 * until this ticket: with only one store's pages in hand no row can span, so this is the old
 * behaviour whether or not the key has been widened. **After** is the same function over the
 * store's pages and its sibling's, which is what the dashboard hands it now.
 *
 *   node .scratch/language-blocks/measure-03.mjs
 */

import { loadSummaries, storesInLog } from '../../web/src/lib/reports.mjs';
import { repeatsInStore } from '../../web/src/lib/view.mjs';
import { siblingOf } from '../../web/src/lib/language-blocks.mjs';

const stores = await storesInLog();

const byStore = new Map(
  await Promise.all(
    stores.map(async (store) => [store, (await loadSummaries(store)).filter((p) => p.comparable)]),
  ),
);

const findings = (pages) => pages.reduce((sum, page) => sum + page.findings.length, 0);
const pad = (value, width) => String(value).padStart(width);

console.log('store   findings  rows before  rows after  spanning rows  own  sibling');
let reachedTotal = 0;
let ownTotal = 0;

for (const store of stores) {
  const sibling = siblingOf(store);
  const mine = byStore.get(store);

  const before = repeatsInStore(mine).length;
  const after = repeatsInStore([...mine, ...(sibling ? byStore.get(sibling) : [])]);
  const spanning = after.filter((repeat) => repeat.stores.length > 1);

  // The numerator sentence, per dashboard: of the findings in a spanning row, how many are
  // this store's (they were always decidable here) and how many are the sibling's (they
  // needed a second press on the other dashboard, and now do not).
  const own = spanning.reduce(
    (sum, repeat) => sum + repeat.on.filter((entry) => entry.store === store).length,
    0,
  );
  const reached = spanning.reduce((sum, repeat) => sum + repeat.on.length, 0) - own;
  reachedTotal += reached;
  ownTotal += own;

  console.log(
    [
      store.padEnd(7),
      pad(findings(mine), 8),
      pad(before, 13),
      pad(after.length, 12),
      pad(spanning.length, 15),
      pad(own, 5),
      pad(reached, 8),
    ].join(''),
  );
}

console.log('');
console.log(`work findings over the six stores:            ${findings([...byStore.values()].flat())}`);
console.log(`decidable from this store's own dashboard:    ${ownTotal}`);
console.log(`...that a press from here now also covers:    ${reachedTotal}`);
console.log('');
console.log('Each block is counted from both of its dashboards, so a Dutch finding appears');
console.log("once as `own` on one store's line and once as `sibling` on the other's.");
