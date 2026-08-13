// THROWAWAY probe for ticket 86 — the denominator this ticket moved, and the proof
// that it moved nothing else.
//
// The ticket's second acceptance criterion is *"the per-store totals are recorded before
// and after, **and nothing else moves.** Any other class that changes count is a defect in
// this diff."* A claim in a ticket answer is not a measurement anybody can repeat, so this
// is the measurement, committed beside the answer it produced — the same shape ADR 0013
// gave ticket 118.
//
// The trick that makes it cheap: **`data/reports/` does not have to be rebuilt.** Nothing
// about a finding depends on its class's visibility. The visibility is a term of no field
// on a `Finding` and no term of `findingId()`, so the findings on disk are the findings the
// flip produces, byte for byte. Only `summarise()` reads the vocabulary, and it is pure. So
// the probe re-runs `summarise()` over the findings already on disk and compares its answer
// to the `summary` each report carries, which was written under the **old** vocabulary.
//
// That comparison is the whole measurement, and it is stronger than a before-and-after of
// two crawls: a rebuild would also pick up any real change on the two sites, and could not
// then tell a re-triage from a Tuesday. Here nothing but the one word can differ.
//
// What it prints, in order:
//
//   1. per store — the work count the reports carry, the work count now, the
//      `heading-level` count, the pages carrying one, and the factor the bar's percentage
//      is multiplied by;
//   2. every class whose corpus tally changed, which must be **none**;
//   3. every page whose `summary.byClass`, `summary.total` or set of finding ids differs,
//      which must be **none**.
//
// Two and three are the criterion. If either prints a row, the diff is defective.
//
// **A failed read is never zero.** An unreadable or unparsable report exits non-zero with
// the reason rather than being skipped, or the probe would report a clean corpus by reading
// less of it.
//
// Run it against the reports the flip did **not** rebuild. After a rebuild it still passes
// — the numbers are the same — but then it is comparing the new vocabulary with itself and
// the `work before` column becomes the `work after` column, which measures nothing. The
// figures in the ticket answer were taken on 2026-08-13 over 816 files, 722 comparable.
//
//   node crawl/probes/probe-86-heading-level-denominator.mjs
import { readdir, readFile } from 'node:fs/promises';
// A probe is not a stage, so AGENTS.md's one-way arrow does not bind it. It reads the real
// rules rather than copying them: `summarise()` is the subject, and a copy here could agree
// with a version of the tally that does not exist.
import { summarise } from '../../compare/findings.mjs';
import { findingSetHash } from '../../compare/contract.mjs';
import { visibilityOf } from '../../compare/vocabulary.mjs';

const REPORTS = new URL('../../data/reports/', import.meta.url);

/** The class this ticket moved. Named once. */
const SUBJECT = 'heading-level';

async function main() {
  const names = (await readdir(REPORTS)).filter((name) => name.endsWith('.json'));
  if (names.length === 0) throw new Error(`No reports in ${REPORTS.pathname}`);

  /** @type {Map<string, { work: [number, number], info: [number, number], subject: number, pages: number }>} */
  const perStore = new Map();
  /** @type {Map<string, [number, number]>} */
  const corpusByClass = new Map();
  /** @type {string[]} */
  const driftedPages = [];
  let comparable = 0;
  let staleHashes = 0;

  for (const name of names) {
    // No try/catch: a report that cannot be read or parsed must stop the probe. A skip
    // here would print a clean corpus because it read less of it.
    const report = JSON.parse(await readFile(new URL(name, REPORTS), 'utf8'));
    if (!report.comparable) continue;
    comparable += 1;

    const before = report.summary;
    const after = summarise(report.findings);

    const store = perStore.get(report.store) ?? { work: [0, 0], info: [0, 0], subject: 0, pages: 0 };
    store.work[0] += before.work;
    store.work[1] += after.work;
    store.info[0] += before.information;
    store.info[1] += after.information;
    const subject = after.byClass[SUBJECT] ?? 0;
    store.subject += subject;
    if (subject > 0) store.pages += 1;
    perStore.set(report.store, store);

    // Every class tally, both readings, over the corpus and over this page.
    for (const cls of new Set([...Object.keys(before.byClass), ...Object.keys(after.byClass)])) {
      const tally = corpusByClass.get(cls) ?? [0, 0];
      tally[0] += before.byClass[cls] ?? 0;
      tally[1] += after.byClass[cls] ?? 0;
      corpusByClass.set(cls, tally);
      if ((before.byClass[cls] ?? 0) !== (after.byClass[cls] ?? 0)) {
        driftedPages.push(`${name}: ${cls} ${before.byClass[cls]} → ${after.byClass[cls]}`);
      }
    }
    if (before.total !== after.total) {
      driftedPages.push(`${name}: total ${before.total} → ${after.total}`);
    }
    // Page-review staleness. This is **counted and not asserted**, and the reason is the
    // whole of why ticket 118 had to go first.
    //
    // The hash on disk was written by a build that filtered on `shown`, and `data/reports/`
    // has not been rebuilt since ADR 0013 removed that filter. So a page carrying any
    // finding that is not work already has a stale stored hash, and that movement is
    // **118's one-time landing** — measured by `probe-118-review-staleness.mjs`, which is
    // the probe that owns it. Attributing it to this ticket would be reading 118's cost
    // off 86's diff.
    //
    // What ticket 86 has to be true is the other thing, and it cannot be measured here
    // because it is not measurable: `findingSetHash()` no longer reads `FINDING_CLASSES` at
    // all, so a re-triage cannot move it however hard it tries. `contract.test.mjs` pins
    // that by re-importing the module with every class flipped at once and asserting the
    // hash is byte-identical. A probe cannot say more than that test does.
    if (report.findingSetHash !== findingSetHash(report.findings)) staleHashes += 1;
  }

  console.log(`${names.length} reports, ${comparable} comparable.`);
  console.log(`${SUBJECT} is now '${visibilityOf(SUBJECT)}'.\n`);

  console.log('store   work before   work after   ' + SUBJECT + '   pages   bar × ');
  let work = [0, 0];
  let info = [0, 0];
  let subject = 0;
  let pages = 0;
  for (const [store, one] of [...perStore].sort((a, b) => b[1].subject - a[1].subject)) {
    const factor = (one.work[0] / one.work[1]).toFixed(3);
    console.log(
      `${store.padEnd(8)}${String(one.work[0]).padEnd(14)}${String(one.work[1]).padEnd(13)}`
      + `${String(one.subject).padEnd(16)}${String(one.pages).padEnd(8)}× ${factor}`,
    );
    work = [work[0] + one.work[0], work[1] + one.work[1]];
    info = [info[0] + one.info[0], info[1] + one.info[1]];
    subject += one.subject;
    pages += one.pages;
  }
  console.log(
    `${'all'.padEnd(8)}${String(work[0]).padEnd(14)}${String(work[1]).padEnd(13)}`
    + `${String(subject).padEnd(16)}${String(pages).padEnd(8)}× ${(work[0] / work[1]).toFixed(3)}`,
  );
  console.log(`\ninformation ${info[0]} → ${info[1]}, which is the same ${subject} findings arriving.`);
  console.log(`${SUBJECT} is ${(subject / work[0] * 100).toFixed(2)}% of the work findings it left.`);

  // The criterion. Only the three tallies named after the visibilities may move.
  const movedClasses = [...corpusByClass]
    .filter(([, [b, a]]) => b !== a)
    .map(([cls, [b, a]]) => `${cls} ${b} → ${a}`);

  console.log(`\nclasses whose corpus tally moved: ${movedClasses.length === 0 ? 'none' : movedClasses.join(', ')}`);
  console.log(`pages whose class tallies moved: ${driftedPages.length === 0 ? 'none' : driftedPages.length}`);
  for (const line of driftedPages.slice(0, 20)) console.log(`  ${line}`);

  // Reported, never asserted. See the note at the write site above: this is ticket 118's
  // landing waiting for the next crawl, and it is printed here only so that a reader of
  // this probe does not go looking for it as though 86 had hidden it.
  console.log(`\n${staleHashes} pages carry a stored hash from before ADR 0013 — that is 118's, not this ticket's.`);

  if (movedClasses.length > 0 || driftedPages.length > 0) {
    throw new Error('Something other than the visibility tallies moved. The diff is defective.');
  }
  console.log('Nothing but the visibility tallies moved.');
}

await main();
