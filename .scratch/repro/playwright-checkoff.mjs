/**
 * [DEBUG-9c1e] End-to-end, in a real browser, against the real override log.
 *
 *   node .scratch/repro/playwright-checkoff.mjs
 *
 * Read-only: it opens the NL dashboard on the reported difference and reads back what
 * the screen says about the three pages. It writes nothing to the log.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:4321';
const TICKED = ['bedrijfsinformatie', 'carport', 'fotogalerij/upload-fotos'];

const browser = await chromium.launch();
const page = await browser.newPage();

/** Every request the app makes to the override table, so the paging is visible. */
const reads = [];
page.on('response', (response) => {
  const url = response.url();
  if (url.includes('/rest/v1/overrides')) {
    // The query string only — the auth headers are not quoted.
    reads.push({
      range: response.request().headers().range ?? new URL(url).searchParams.get('offset') ?? '—',
      status: response.status(),
      contentRange: response.headers()['content-range'] ?? '—',
    });
  }
});

await page.goto(`${BASE}/nl/?query=showroom-contact&classes=broken-link`, {
  waitUntil: 'networkidle',
});

// The store strip: the counts at the top.
const strip = await page.$$eval('[data-bucket]', (chips) =>
  Object.fromEntries(
    chips.map((chip) => [chip.dataset.bucket, chip.querySelector('strong').textContent]),
  ),
);

console.log('overrides requests:', reads.length);
for (const read of reads) console.log('  ', read.status, 'content-range:', read.contentRange);
console.log('store strip:', strip);

// Open the one difference and read the status of each page in it.
const trigger = page.locator('button', { hasText: 'self/showroom-contact' }).first();
await trigger.click();
console.log('difference:', (await trigger.textContent()).replace(/\s+/g, ' ').trim());

// A page that was checked off leaves the open result entirely, so "not on the list" is
// the answer and not a missing element.
for (const key of TICKED) {
  const row = page.locator('tr', { has: page.getByRole('link', { name: key, exact: true }) });
  const status = (await row.count())
    ? (await row.locator('td').last().textContent()).trim()
    : 'gone from the open result — checked off';
  console.log(`  ${key.padEnd(26)} ${status}`);
}

// The same three with closed work included, which is where a decided page is readable.
await page.goto(`${BASE}/nl/?query=showroom-contact&classes=broken-link&closed=1`, {
  waitUntil: 'networkidle',
});
await page.locator('button', { hasText: 'self/showroom-contact' }).first().click();
console.log('\nwith closed included:');
for (const key of TICKED) {
  const row = page.locator('tr', { has: page.getByRole('link', { name: key, exact: true }) });
  const status = (await row.count())
    ? (await row.locator('td').last().textContent()).trim()
    : 'absent';
  console.log(`  ${key.padEnd(26)} ${status}`);
}

await browser.close();
