/**
 * Ticket 11, measurement 3 — the double claim. How many fix claims in the override log
 * were written on a page whose **sibling page carries the same finding**, and how many
 * of those siblings were claimed too. Throwaway probe over the override backup and
 * `data/reports/`.
 *
 * *The same finding* is `repeatsInStore()`'s key held to exactly — block, class, the two
 * texts and the detail — because that grouping is what a block-spanning press acts on.
 */
import { readFileSync } from 'node:fs';
import { reportFilename } from '../../compare/contract.mjs';
import { latestByKey } from '../../overrides/state.mjs';
import { siblingPages } from '../../web/src/lib/blocks.mjs';
import { blockOf, siblingOf } from '../../web/src/lib/language-blocks.mjs';

const ROOT = new URL('../../', import.meta.url);
const LOG = 'data/overrides-backup-2026-08-18T09-46-51-393Z.json';

// The backup is the table's own snake_case; `state.mjs` reads the app's camelCase.
const decode = (row) => ({
  id: row.id,
  createdAt: row.created_at,
  editor: row.editor,
  scope: row.scope,
  action: row.action,
  store: row.store,
  page: row.page,
  findingId: row.finding_id,
  class: row.class,
  observationId: row.observation_id,
});

const events = JSON.parse(readFileSync(new URL(LOG, ROOT), 'utf8')).map(decode);
const standing = [...latestByKey(events).values()];
const claims = standing.filter((one) => one.scope === 'finding' && one.action === 'fixed');
const dismissals = standing.filter((one) => one.scope === 'finding' && one.action === 'dismissed');

const rows = JSON.parse(readFileSync(new URL('data/10-store-seeds.json', ROOT), 'utf8')).rows;
/** This store's page → its sibling page, over both blocks. */
const siblings = new Map();
for (const store of ['nl', 'be', 'be_fr', 'fr']) {
  for (const one of siblingPages({ rows, store })) {
    if (one.sibling) siblings.set(`${store}|${one.page}`, one.sibling.page);
  }
}

const reports = new Map();
const findingsOf = (store, page) => {
  const key = `${store}|${page}`;
  if (reports.has(key)) return reports.get(key);
  let report = null;
  try {
    report = JSON.parse(readFileSync(new URL(`data/reports/${reportFilename(store, page)}`, ROOT), 'utf8'));
  } catch {
    report = null;
  }
  reports.set(key, report?.findings ?? null);
  return reports.get(key);
};

/** `repeatsInStore()`'s key: the block, the class, the two texts and the detail. */
const repeatKey = (store, finding) =>
  JSON.stringify([
    blockOf(store)?.language ?? store,
    finding.class,
    finding.prod,
    finding.new,
    finding.detail,
  ]);

const claimedIds = new Set(claims.map((one) => `${one.store}|${one.page}|${one.findingId}`));
const decidedIds = new Set(
  [...claims, ...dismissals].map((one) => `${one.store}|${one.page}|${one.findingId}`),
);

const tally = {
  standingClaims: claims.length,
  inABlock: 0,
  findingStillOnThePage: 0,
  pageHasASibling: 0,
  siblingHasAReport: 0,
  siblingCarriesTheSameFinding: 0,
  siblingAlsoClaimed: 0,
  siblingAlsoDecided: 0,
};
const doubles = [];

for (const claim of claims) {
  const other = siblingOf(claim.store);
  if (!other) continue;
  tally.inABlock += 1;

  const here = findingsOf(claim.store, claim.page);
  const finding = here?.find((one) => one.id === claim.findingId);
  // A claim whose finding is not in the snapshot cannot be compared with a sibling's:
  // the class and the two texts are inside the digest and cannot be read back.
  if (!finding) continue;
  tally.findingStillOnThePage += 1;

  const siblingPage = siblings.get(`${claim.store}|${claim.page}`);
  if (!siblingPage) continue;
  tally.pageHasASibling += 1;

  const there = findingsOf(other, siblingPage);
  if (!there) continue;
  tally.siblingHasAReport += 1;

  const key = repeatKey(claim.store, finding);
  const twin = there.find((one) => repeatKey(other, one) === key);
  if (!twin) continue;
  tally.siblingCarriesTheSameFinding += 1;

  const twinId = `${other}|${siblingPage}|${twin.id}`;
  if (claimedIds.has(twinId)) tally.siblingAlsoClaimed += 1;
  if (decidedIds.has(twinId)) tally.siblingAlsoDecided += 1;
  doubles.push({
    store: claim.store,
    page: claim.page,
    sibling: `${other} ${siblingPage}`,
    class: finding.class,
    editor: claim.editor,
    when: claim.createdAt.slice(0, 10),
    twinClaimed: claimedIds.has(twinId),
    twinDecided: decidedIds.has(twinId),
    prod: (finding.prod ?? '').slice(0, 70),
    new: (finding.new ?? '').slice(0, 70),
  });
}

console.log('standing events:', standing.length);
console.log(JSON.stringify(tally, null, 1));
const perStore = {};
for (const claim of claims) perStore[claim.store] = (perStore[claim.store] ?? 0) + 1;
console.log('standing fix claims per store:', JSON.stringify(perStore));
const byClass = {};
for (const one of doubles) byClass[one.class] = (byClass[one.class] ?? 0) + 1;
console.log('the classes of the doubles:', JSON.stringify(byClass));
for (const one of doubles) {
  console.log(
    `${one.store} ${one.page} → ${one.sibling} · ${one.class} · ${one.when} ${one.editor}` +
      ` · twin claimed ${one.twinClaimed} decided ${one.twinDecided}`,
  );
}
