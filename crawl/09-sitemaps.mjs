// Ticket 52 - fetch the six production sitemaps and commit what the log needs.
//
// The page counts in the log came from a 30 MB sitemap that lived in another
// repository and was committed nowhere, so "the French store has 28 pages" could
// not be tested. This run fetches each store's sitemap once, reduces the six
// files to the entries the log reads, and writes two tracked files:
//
//   data/sitemap-extract.json    the entries, a function of the source alone
//   data/sitemap-manifest.json   the record of this fetch
//
// It is not part of a normal run. The extract is in git, so you only run this to
// take a new measurement of production.
import { writeFileSync } from 'node:fs';

import { MaintenanceError, maintenanceReason } from './fetch-page.mjs';
import {
  SITEMAP_FILES,
  SITEMAP_SOURCES,
  buildManifest,
  manifestDisagreements,
  reduceSitemaps,
  serialiseExtract,
} from './sitemap-extract.mjs';

const EXTRACT = new URL('../data/sitemap-extract.json', import.meta.url);
const MANIFEST = new URL('../data/sitemap-manifest.json', import.meta.url);

/**
 * One sitemap.
 *
 * `maintenanceReason` is the one maintenance rule (ticket 04). It names every 500
 * and every 503 on the status alone, and it reads the body only when the body is
 * small, so a 30 MB sitemap costs one length test. The body is asked for, not an
 * empty string: production can answer **200 with a maintenance page**, and that
 * is the one failure that looks like a success.
 *
 * Anything else that is not a 200 is an error too. A redirect or a 404 in place
 * of a sitemap gives a short extract, and a short extract that looks complete is
 * the defect this ticket exists to stop.
 *
 * @param {string} url
 */
async function fetchSitemap(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (content-parity-sitemaps; internal)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(180000),
  });

  const xml = await response.text();

  const reason = maintenanceReason(response.status, xml);
  if (reason) throw new MaintenanceError(url, reason);
  if (response.status !== 200) {
    throw new Error(`${url} answered ${response.status}, and a sitemap must answer 200`);
  }

  return { xml, status: response.status, bytes: Buffer.byteLength(xml) };
}

const byFile = {};
const sources = [];

for (const file of SITEMAP_FILES) {
  const url = SITEMAP_SOURCES[file];
  process.stdout.write(`  ${file} ${url} `);
  let answer;
  try {
    answer = await fetchSitemap(url);
  } catch (error) {
    // Nothing is written. A partial fetch would give a short extract, and the
    // manifest beside it would say the run succeeded.
    console.error('\n');
    console.error(error instanceof MaintenanceError ? error.message : String(error.message));
    console.error(`The ${file} sitemap at ${new URL(url).host} did not answer with a sitemap.`);
    console.error('Neither file was written. Run this again when the host is up.');
    process.exit(error instanceof MaintenanceError ? 3 : 1);
  }
  console.log(`${answer.status} ${(answer.bytes / 1e6).toFixed(1)} MB`);

  byFile[file] = answer.xml;
  sources.push({ file, url, status: answer.status, bytes: answer.bytes });
}

const extract = reduceSitemaps(byFile);

// A body that is a 200 and is not a sitemap parses to nothing. Each file holds
// about 27,000 locs, so zero is a failed fetch that answered like a good one.
const empty = SITEMAP_FILES.filter((file) => extract.locs[file] === 0);
if (empty.length) {
  console.error(`\nThese sitemaps answered 200 and hold no <url> block: ${empty.join(', ')}.`);
  console.error('Neither file was written.');
  process.exit(1);
}
const manifest = buildManifest({
  fetchedAt: new Date().toISOString().slice(0, 10),
  sources,
  extract,
});

// The manifest is derived from the extract, so this can only fail if the two
// stop being made together. It is cheap, and it is the claim the committed test
// makes against the committed files.
const disagreements = manifestDisagreements(manifest, extract);
if (disagreements.length) {
  console.error('\nThe manifest does not agree with the extract:');
  for (const said of disagreements) console.error(`  ${said}`);
  process.exit(1);
}

// Both strings are made before either write. The two files are one measurement,
// and a failure between two writes would leave an extract beside a manifest that
// does not describe it.
const extractBytes = serialiseExtract(extract);
const manifestBytes = `${JSON.stringify(manifest, null, 2)}\n`;
writeFileSync(EXTRACT, extractBytes);
writeFileSync(MANIFEST, manifestBytes);

const kb = (Buffer.byteLength(extractBytes) / 1024).toFixed(1);
console.log(`\n${extract.entries.length} entries, ${kb} KB`);

// One entry and not six copies is only correct while this is zero. Say the
// number either way, so the reader of the run never has to assume it.
console.log(
  extract.alternateConflicts === 0
    ? 'The six files agree about every alternate block.'
    : `${extract.alternateConflicts} files disagree about an alternate block. The extract keeps the first.`,
);
console.table(
  Object.fromEntries(
    SITEMAP_FILES.map((file) => [
      file,
      { locs: extract.locs[file], kept: manifest.sources.find((s) => s.file === file).kept },
    ]),
  ),
);
