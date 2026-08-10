// THROWAWAY probe for ticket 67 — the paragraph that named the fold.
//
// The ticket rests on one page. `/overkapping` holds a 190-word paragraph with an
// inline link in it. Under the leaf rule the paragraph made no unit and the log
// compared the link words alone, 35 characters of 190 words, and the paragraph
// held a product-spec regression: production says `6063-T6`, the new site says
// `6036-T6`.
//
// This probe fetches both sides live, extracts them with the extractor as it now
// stands, and answers the ticket's acceptance criterion:
//
//   1. the paragraph is **one** unit on each side;
//   2. the `6036-T6` difference reaches a finding that is **shown**.
//
// It exits non-zero when either answer is no, so it is evidence and not a claim.
// Unlike `probe-fold-detachment.mjs` it imports the extractor rather than copying
// it: this probe asks what the shipped rule does, so a copy would prove nothing.
//
// It reads `crawl/` and `compare/` together. A probe is not a stage, so AGENTS.md's
// one-way arrow does not bind it, and no stage imports a probe. This is the same
// licence `probe-excluded-regions.mjs` and `probe-fold-detachment.mjs` take.
//
//   node crawl/probes/probe-overkapping-fold.mjs
import { readFile } from 'node:fs/promises';

import { FindingCollector } from '../../compare/findings.mjs';
import { diffRows, textFindings } from '../../compare/text.mjs';
import { extractPage } from '../extract.mjs';
import { fetchPage } from '../fetch-page.mjs';
import { FINDING_CLASSES } from '../../compare/vocabulary.mjs';

const ROOT = new URL('../../', import.meta.url);
const STORE = 'nl';
const PAGE = 'overkapping';
/**
 * The regression is one alloy code. The pattern must match **both** codes, or the
 * probe would find the paragraph on one side only.
 */
const ALLOY = /\b60\d\d-T6\b/;
/** The same pattern, for reading every code in one unit. */
const EVERY_ALLOY = new RegExp(ALLOY.source, 'g');

/**
 * Four paragraphs on the page name an alloy, so the ticket's paragraph is named by
 * its opening words rather than by its length.
 */
const PARAGRAPH = /Onder uw aluminium overkapping moet u veilig kunnen genieten/;
const words = (text) => text.split(/\s+/).length;

const stored = JSON.parse(
  await readFile(new URL(`data/extract/${STORE}/${PAGE}.json`, ROOT), 'utf8'),
);

/** @type {Record<string, import('../../compare/contract.mjs').PageExtract>} */
const sides = {};
/** The tier-1 text of the ticket's paragraph, on each side. */
const paragraph = {};
for (const side of ['production', 'new']) {
  const { url } = stored[side];
  const { status, html } = await fetchPage(url);
  if (status !== 200) throw new Error(`${side}: HTTP ${status} on ${url}`);
  sides[side] = extractPage(html, {
    store: STORE,
    page: PAGE,
    side,
    url,
    prodHost: new URL(stored.production.url).host,
    newHost: new URL(stored.new.url).host,
    onWarn: (message) => console.warn(`${side}: ${message}`),
  });
  const units = sides[side].elements.filter((unit) => ALLOY.test(unit.norm));
  console.log(`${side}: ${sides[side].elements.length} units, ${units.length} name an alloy`);
  for (const unit of units) {
    console.log(
      `  <${unit.tag}> ${unit.kind} ${words(unit.norm)} words `
      + `[${unit.norm.match(EVERY_ALLOY)?.join(' ')}]: ${unit.norm.slice(0, 80)}…`,
    );
  }
  const target = sides[side].elements.filter((unit) => PARAGRAPH.test(unit.norm));
  if (target.length !== 1) {
    throw new Error(`${side}: the paragraph is ${target.length} units, and the ticket needs one`);
  }
  paragraph[side] = target[0].norm;
  console.log(
    `  → the ticket's paragraph: one <${target[0].tag}>, ${words(target[0].norm)} words, `
    + `${target[0].norm.length} characters, alloy ${target[0].norm.match(ALLOY)?.[0]}`,
  );
}

if (paragraph.production.match(ALLOY)?.[0] === paragraph.new.match(ALLOY)?.[0]) {
  throw new Error('The two sides name the same alloy. The regression this ticket quotes is gone.');
}

const collector = new FindingCollector({ store: STORE, page: PAGE });
textFindings(diffRows(sides.production, sides.new), collector);

// The paragraph itself, never another paragraph that happens to name an alloy.
const onAlloy = collector.all().filter(
  (finding) => finding.prod === paragraph.production || finding.new === paragraph.new,
);

console.log(`\n${collector.all().length} text findings, ${onAlloy.length} on the ticket's paragraph.`);
for (const finding of onAlloy) {
  const shown = FINDING_CLASSES[finding.class].shown;
  console.log(`  ${finding.class} ${shown ? 'shown' : 'HIDDEN'} ${finding.id}`);
  console.log(`    production: ${finding.prod?.slice(0, 140)}…`);
  console.log(`    new site:   ${finding.new?.slice(0, 140)}…`);
}

const shown = onAlloy.filter((finding) => FINDING_CLASSES[finding.class].shown);
if (shown.length === 0) {
  throw new Error('The alloy difference reaches no shown finding. The ticket is not met.');
}
console.log(`\nThe 6036-T6 difference is reported, as ${shown.map((f) => f.class).join(', ')}.`);
