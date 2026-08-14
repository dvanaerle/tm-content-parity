// Ticket 53, folding in ticket 22 - measure production and the new site again,
// over every store-page pair of the seed list.
//
// The seed list is a page list and it makes no live request. This is the second
// step over that finished list, and it writes its own file:
//
//   data/11-page-status.json
//
// The guard is ticket 51's. A maintenance answer raises `MaintenanceError`, the
// queue is drained so the run does not ask eight hundred more times, and nothing
// is written. That is how 451 phantom status values reached the old seed file.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { MaintenanceError, maintenanceReason } from './fetch-page.mjs';
import { statusDisagreements, statusTargets, summariseStatus } from './page-status.mjs';

const SEEDS = new URL('../data/10-store-seeds.json', import.meta.url);
const OUT = new URL('../data/11-page-status.json', import.meta.url);

if (!existsSync(SEEDS)) {
  console.error('Missing input: data/10-store-seeds.json');
  console.error('  Run `node crawl/10-store-seeds.mjs` first.');
  process.exit(2);
}

const seeds = JSON.parse(readFileSync(SEEDS, 'utf8'));
const targets = statusTargets(seeds.rows);

/**
 * One url, three attempts.
 *
 * The redirect is manual, because the pass records where a url sends the reader.
 * 500 and 503 need no body: `maintenanceReason` names them on the status alone.
 */
async function ask(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 (content-parity-status; internal)' },
        redirect: 'manual',
        signal: AbortSignal.timeout(60000),
      });
      if (response.status >= 500) {
        const reason = maintenanceReason(response.status, await response.text());
        if (reason) throw new MaintenanceError(url, reason);
      } else {
        await response.body?.cancel();
      }
      return { status: response.status, redirect: response.headers.get('location') ?? '' };
    } catch (error) {
      if (error instanceof MaintenanceError) throw error;
      if (attempt === 2)
        return { status: 0, redirect: '', error: String(error.cause?.code ?? error.message) };
    }
  }
}

const results = [];
const queue = targets.slice();
let done = 0;

const workers = Array.from({ length: 8 }, async () => {
  for (let target = queue.shift(); target; target = queue.shift()) {
    let answer;
    try {
      answer = await ask(target.url);
    } catch (error) {
      // Maintenance mode is site-wide. Do not ask eight hundred more times.
      queue.length = 0;
      throw error;
    }
    // A url that redirected nowhere and failed with nothing says so by leaving the
    // column out. `undefined` is how `JSON.stringify` is told to omit a key.
    results.push({
      ...target,
      status: answer.status,
      redirect: answer.redirect || undefined,
      error: answer.error || undefined,
    });
    if (++done % 100 === 0) console.log(`  ${done}/${targets.length}`);
  }
});

const settled = await Promise.allSettled(workers);
const failure = settled.find((r) => r.status === 'rejected')?.reason;
if (failure instanceof MaintenanceError) {
  console.error(`\n${failure.message}`);
  console.error('The status columns would be phantom, so nothing was written.');
  console.error('Run this again when the site is up.');
  process.exit(3);
}
if (failure) throw failure;

results.sort((a, b) =>
  `${a.store} ${a.page} ${a.side}` < `${b.store} ${b.page} ${b.side}` ? -1 : 1,
);

const counts = summariseStatus(results);

const wrong = statusDisagreements(counts);
if (wrong.length) {
  console.error('\nA side of a store answered nothing at all:');
  for (const said of wrong) console.error(`  ${said}`);
  console.table(counts);
  console.error('Nothing was written.');
  process.exit(1);
}

writeFileSync(
  OUT,
  `${JSON.stringify(
    {
      measured: new Date().toISOString().slice(0, 10),
      seedList: seeds.generated,
      counts,
      results,
    },
    null,
    2,
  )}\n`,
);

console.log(`\n${results.length} answers over ${targets.length} urls`);
console.table(counts);
