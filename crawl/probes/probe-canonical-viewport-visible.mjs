/**
 * THROWAWAY probe, kept as evidence. Ticket 69.
 *
 * The one question the other two probes cannot answer. They count units and
 * findings, and they take on faith the thing the whole rule rests on: **that a block
 * the convention list matches is really invisible at the canonical viewport.** The
 * extraction has no computed style, so it cannot check its own premise.
 *
 * A browser can. This probe renders the page at `CANONICAL_VIEWPORT_WIDTH` and reads
 * computed style, in both directions:
 *
 * 1. **Is everything the rule drops invisible?** A visible match is a defect: the log
 *    would stop checking copy a reader can see.
 * 2. **What is invisible and still reaches the log?** The rule's remaining blind spot.
 *    It over-reports, so it is safe — but it should be a number and not a shrug.
 *
 *   node crawl/probes/probe-canonical-viewport-visible.mjs
 *
 * Playwright is a dev dependency, for `web/`'s component tests. Rendering belongs in a
 * probe and never in `crawl/`: ADR 0020 rejected a browser in the crawl path on cost.
 *
 * Do not import this file.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import {
  CANONICAL_VIEWPORT_WIDTH,
  HIDDEN_AT_CANONICAL_VIEWPORT,
} from '../../shared/canonical-viewport.mjs';
import { cellWithBothSides } from '../../shared/seed-rows.mjs';

const SEEDS = new URL('../../data/10-store-seeds.json', import.meta.url);
const OUT = new URL('../../data/probe-canonical-viewport-visible.json', import.meta.url);

/**
 * The pages the corpus run found the most removals on, plus two controls that remove
 * nothing. `shading-panel` is the widest page in the corpus at 40 units.
 */
const PAGES = [
  'shading-panel',
  'lighting-system/productinformatie',
  'downloads',
  'overkapping',
  'carport',
  '(home)',
  'showroom-contact',
];

const STORES = ['nl', 'de', 'uk'];

/** One selector, so the page-side script needs no list. */
const SELECTOR = HIDDEN_AT_CANONICAL_VIEWPORT.map((c) => c.selector).join(',');

/** The tags a content unit can be, from `crawl/extract.mjs`. */
const TEXT_TAGS = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,dt,dd,figcaption,th,td,a,button';

const seeds = JSON.parse(await readFile(SEEDS, 'utf8'));

const browser = await chromium.launch();
const rows = [];

for (const page of PAGES) {
  const row = seeds.rows.find((r) => r.page === page);
  if (!row) continue;

  for (const store of STORES) {
    const cell = cellWithBothSides(row, store);
    if (!cell) continue;

    const tab = await browser.newPage({
      viewport: { width: CANONICAL_VIEWPORT_WIDTH, height: 1000 },
    });
    try {
      await tab.goto(cell.prodUrl, { waitUntil: 'load', timeout: 60000 });
      const result = await tab.evaluate(
        ({ selector, textTags }) => {
          const main = document.querySelector('main') ?? document.body;

          const visible = (el) => {
            for (let n = el; n && n !== main.parentElement; n = n.parentElement) {
              const s = getComputedStyle(n);
              if (s.display === 'none' || s.visibility === 'hidden') return false;
            }
            return true;
          };

          const matched = [...main.querySelectorAll(selector)];
          const visibleMatches = [];
          for (const el of matched) {
            if (!visible(el)) continue;
            visibleMatches.push({
              className: String(el.className).slice(0, 120),
              text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80),
            });
          }

          // The other direction: a unit that is invisible and that no convention
          // matched, so it still reaches the log.
          const inAMatch = (el) => matched.some((m) => m === el || m.contains(el));
          let invisibleUnmatched = 0;
          const invisibleUnmatchedSample = [];
          for (const el of main.querySelectorAll(textTags)) {
            if (visible(el) || inAMatch(el)) continue;
            const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
            if (!text) continue;
            invisibleUnmatched += 1;
            if (invisibleUnmatchedSample.length < 6) {
              invisibleUnmatchedSample.push({
                tag: el.tagName,
                text: text.slice(0, 60),
                hiddenBy: hidingAncestor(el),
              });
            }
          }

          function hidingAncestor(el) {
            for (let n = el; n && n !== main.parentElement; n = n.parentElement) {
              const s = getComputedStyle(n);
              if (s.display === 'none' || s.visibility === 'hidden') {
                return String(n.className || n.tagName).slice(0, 100);
              }
            }
            return null;
          }

          return {
            matches: matched.length,
            visibleMatches,
            invisibleUnmatched,
            invisibleUnmatchedSample,
          };
        },
        { selector: SELECTOR, textTags: TEXT_TAGS },
      );

      rows.push({ store, page, url: cell.prodUrl, ...result });
      console.log(
        `${store}/${page}: ${result.matches} matches, ` +
          `${result.visibleMatches.length} of them VISIBLE, ` +
          `${result.invisibleUnmatched} invisible units the rule does not reach`,
      );
    } catch (error) {
      rows.push({ store, page, url: cell.prodUrl, error: String(error.message ?? error) });
      console.log(`${store}/${page}: ${error.message ?? error}`);
    } finally {
      await tab.close();
    }
  }
}

await browser.close();

const ok = rows.filter((r) => !r.error);
const totals = {
  pages: ok.length,
  matches: ok.reduce((t, r) => t + r.matches, 0),
  visibleMatches: ok.reduce((t, r) => t + r.visibleMatches.length, 0),
  invisibleUnmatched: ok.reduce((t, r) => t + r.invisibleUnmatched, 0),
};
console.log('\ntotals', totals);
console.log(`viewport: ${CANONICAL_VIEWPORT_WIDTH}px`);

await writeFile(
  OUT,
  `${JSON.stringify(
    { measuredAt: new Date().toISOString(), width: CANONICAL_VIEWPORT_WIDTH, totals, rows },
    null,
    2,
  )}\n`,
);
console.log(`Wrote ${OUT.pathname}`);
