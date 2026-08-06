// Stage 1 - read the production sitemap and build the NL seed list.
// PDPs are dropped here: Magento writes changefreq=never for products and
// changefreq=daily for categories and CMS pages.
import { readFileSync, writeFileSync } from 'node:fs';

const XML = readFileSync(new URL('../_data/sitemap-prod.xml', import.meta.url), 'utf8');
const NL = 'https://www.tuinmaximaal.nl/';

const HREFLANG_COLUMN = {
  'nl-BE': 'be',
  'fr-BE': 'be_fr',
  'de-DE': 'de',
  'fr-FR': 'fr',
  'en-GB': 'uk',
};

const rows = [];
const skipped = { pdp: 0, otherStore: 0 };

for (const block of XML.split('<url>').slice(1)) {
  const loc = block.match(/<loc>([^<]*)<\/loc>/)?.[1];
  if (!loc) continue;
  if (!loc.startsWith(NL)) {
    skipped.otherStore++;
    continue;
  }

  const changefreq = block.match(/<changefreq>([^<]*)<\/changefreq>/)?.[1] ?? '';
  if (changefreq !== 'daily') {
    skipped.pdp++;
    continue;
  }

  const alternates = {};
  for (const [, lang, href] of block.matchAll(/hreflang="([^"]+)"[^>]*href="([^"]+)"/g)) {
    const column = HREFLANG_COLUMN[lang];
    if (column) alternates[column] = href;
  }

  rows.push({ url_key: loc.slice(NL.length), alternates });
}

rows.sort((a, b) => a.url_key.localeCompare(b.url_key));
writeFileSync(
  new URL('../_data/01-sitemap.json', import.meta.url),
  JSON.stringify({ fetched: '2026-08-05', rows, skipped }, null, 2)
);

console.log(`kept ${rows.length} NL non-PDP urls`);
console.log(`dropped ${skipped.pdp} NL PDPs, ${skipped.otherStore} other-store rows`);
