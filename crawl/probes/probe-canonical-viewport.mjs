/**
 * THROWAWAY probe, kept as evidence. Ticket: 69.
 *
 * `probe-responsive-duplicates.mjs` found where the duplication is. This one prices
 * it. It applies a **prototype** canonical-viewport rule — drop the copy that
 * Magezon marks as hidden at a desktop width — to both hosts, and reports the units
 * it removes and the findings it moves.
 *
 * The rule is prototyped here rather than in `crawl/extract.mjs`, because ticket 69
 * asks for the measurement **before** it asks for the rule: if the number is small,
 * the ticket closes instead of shipping one.
 *
 *   node crawl/probes/probe-canonical-viewport.mjs
 *
 * Do not import this file.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'node-html-parser';
import { comparePage } from '../../compare/30-compare.mjs';
import { extractPage } from '../extract.mjs';
import { fetchPage } from '../fetch-page.mjs';

const SEEDS = new URL('../../data/10-store-seeds.json', import.meta.url);
const OUT = new URL('../../data/probe-canonical-viewport.json', import.meta.url);

const STORES = ['nl', 'be', 'be_fr', 'de', 'fr', 'uk'];

/**
 * `/downloads` is where the first probe found the duplication, and the page key
 * differs in the two French stores. The rest are the pages the region entries were
 * measured on, as controls: a rule that removes anything there is too wide.
 */
const PAGES = [
  'downloads',
  '(fr)telechargements',
  '(be_fr)fr/telechargements',
  'overkapping',
  'carport',
  'veranda',
  '(home)',
  'betaalmethoden',
  'showroom-contact',
  'schuifwand',
];

/**
 * Magezon's breakpoint utilities. A block marked hidden at `lg` or `xl` is the copy
 * a desktop reader never sees, so it is the copy the canonical viewport drops.
 */
const HIDDEN_AT_DESKTOP = '[class*="mgz-hidden-lg"],[class*="mgz-hidden-xl"]';

const seeds = JSON.parse(await readFile(SEEDS, 'utf8'));

const cellsFor = (page) => {
  const row = seeds.rows.find((r) => r.page === page);
  if (!row) return [];
  return STORES.map((store) => ({ store, cell: row.stores?.[store] }))
    .filter(({ cell }) => cell?.prodUrl && cell?.newUrl)
    .map(({ store, cell }) => ({ store, page, prodUrl: cell.prodUrl, newUrl: cell.newUrl }));
};

/**
 * @param {string} html
 * @returns {{ html: string, matches: number }}
 */
function withoutMobileCopies(html) {
  const root = parse(html, { closeAllByClosing: true });
  const matches = root.querySelectorAll(HIDDEN_AT_DESKTOP);
  for (const node of matches) node.remove();
  return { html: root.toString(), matches: matches.length };
}

/**
 * @param {string} side
 * @param {{ store: string, page: string }} where
 * @param {string} url
 */
async function bothWays(side, where, url) {
  const { status, html } = await fetchPage(url);
  const context = { ...where, side, url, status, onWarn: () => {} };
  const cut = withoutMobileCopies(html);
  return {
    kept: extractPage(html, context),
    cut: extractPage(cut.html, context),
    matches: cut.matches,
  };
}

const key = (f) => `${f.class}|${f.new ?? ''}|${f.production ?? ''}`;

/**
 * The question that decides whether the rule is safe: does it drop any text the
 * page then holds nowhere?
 *
 * A copy with a twin is duplication, and dropping it is the point. A unit whose
 * words survive nowhere is **mobile-only content**, and dropping it is the log
 * ceasing to check something an editor wrote. The canonical viewport permits that
 * by definition, so the number must be measured and stated rather than assumed to
 * be zero.
 *
 * @param {import('../../compare/contract.mjs').PageExtract} kept
 * @param {import('../../compare/contract.mjs').PageExtract} cut
 * @returns {string[]}
 */
function textsLostEntirely(kept, cut) {
  const surviving = new Set(cut.elements.map((unit) => unit.norm));
  return [...new Set(kept.elements.map((unit) => unit.norm))].filter(
    (text) => !surviving.has(text),
  );
}

const rows = [];
for (const page of PAGES) {
  for (const { store, prodUrl, newUrl } of cellsFor(page)) {
    try {
      const production = await bothWays('production', { store, page }, prodUrl);
      const next = await bothWays('new', { store, page }, newUrl);
      const run = (a, b) =>
        comparePage({
          sides: { production: a, new: b },
          newSitePaths: new Set(),
          statuses: new Map(),
        });
      const before = run(production.kept, next.kept);
      const after = run(production.cut, next.cut);
      const seenBefore = new Set(before.findings.map(key));

      rows.push({
        store,
        page,
        matches: { production: production.matches, new: next.matches },
        unitsRemoved: {
          production: production.kept.elements.length - production.cut.elements.length,
          new: next.kept.elements.length - next.cut.elements.length,
        },
        units: { production: production.kept.elements.length, new: next.kept.elements.length },
        lostEntirely: {
          production: textsLostEntirely(production.kept, production.cut),
          new: textsLostEntirely(next.kept, next.cut),
        },
        findingsBefore: before.findings.length,
        findingsAfter: after.findings.length,
        workBefore: before.summary.work,
        workAfter: after.summary.work,
        appeared: after.findings
          .filter((f) => !seenBefore.has(key(f)))
          .map((f) => `${f.class}: ${String(f.new ?? f.production).slice(0, 60)}`),
      });
      const last = rows.at(-1);
      console.log(
        `${store}/${page}: −${last.unitsRemoved.production}/−${last.unitsRemoved.new} units, ` +
          `${last.findingsBefore}→${last.findingsAfter} findings, +${last.appeared.length} appeared, ` +
          `${last.lostEntirely.production.length} lost`,
      );
    } catch (error) {
      rows.push({ store, page, error: String(error.message ?? error) });
      console.log(`${store}/${page}: ${error.message ?? error}`);
    }
  }
}

const totals = rows.reduce(
  (t, r) =>
    r.error
      ? t
      : {
          unitsProduction: t.unitsProduction + r.unitsRemoved.production,
          unitsNew: t.unitsNew + r.unitsRemoved.new,
          findingsBefore: t.findingsBefore + r.findingsBefore,
          findingsAfter: t.findingsAfter + r.findingsAfter,
          appeared: t.appeared + r.appeared.length,
          lostEntirely: t.lostEntirely + r.lostEntirely.production.length,
        },
  {
    unitsProduction: 0,
    unitsNew: 0,
    findingsBefore: 0,
    findingsAfter: 0,
    appeared: 0,
    lostEntirely: 0,
  },
);
console.log('\ntotals', totals);

await writeFile(
  OUT,
  `${JSON.stringify({ measuredAt: new Date().toISOString(), totals, rows }, null, 2)}\n`,
);
console.log(`Wrote ${OUT.pathname}`);
