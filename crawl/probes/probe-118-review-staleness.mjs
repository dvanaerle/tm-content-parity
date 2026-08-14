// THROWAWAY probe for ticket 118 — the page reviews that dropping the visibility
// filter stales.
//
// `findingSetHash()` used to hash the `work` findings only and now hashes every
// finding on the page (ADR 0013). Every page that carries at least one finding in
// a class that is not work therefore gets a new hash on the run this lands, and
// every live review of such a page goes stale in one step. The ticket forbids an
// estimate, so this counts it.
//
// What it does, in order:
//
//   1. reads the whole override log from Supabase and reduces it to the live
//      state — latest event per key, `cleared` removed;
//   2. keeps the `page` / `reviewed` events, which are the only ones that carry a
//      `finding_set_hash`;
//   3. reads each reviewed page's report off disk and compares the review's hash
//      against the hash the report **carries** (the old rule, computed at build
//      time) and against the hash the same findings produce **now**.
//
// It needs no network beyond Supabase: `data/reports/` holds the findings, and the
// new hash is a pure function of them.
//
// **A failed read is never zero.** Any failure exits non-zero with the reason and
// prints no count at all. A missing report is a counted outcome, not a crash: a
// review can outlive its page.
//
// Run it **before** the landing run rebuilds `data/reports/`. After the rebuild
// both hashes are the new one and the probe measures nothing.
//
//   node crawl/probes/probe-118-review-staleness.mjs
import { readFile } from 'node:fs/promises';
// A probe is not a stage, so AGENTS.md's one-way arrow does not bind it. It reads
// the crown jewels rather than copying them: `latestByKey()` is ticket 09's
// precedence rule, `reportFilename()` is ticket 60's, and `findingSetHash()` is the
// subject — copying it here would let the probe agree with a version of the rule
// that does not exist.
import { latestByKey } from '../../overrides/state.mjs';
import { findingSetHash, reportFilename } from '../../compare/contract.mjs';
import { isWork } from '../../compare/vocabulary.mjs';

const ROOT = new URL('../../', import.meta.url);

// --- the override log ------------------------------------------------------
//
// `supabaseConfig()` and `readOverrideLog()` are copied from
// `probe-fold-detachment.mjs`. There is no day-specific reason for the copy — a
// Supabase reader means the same thing every day — and the honest fix is one shared
// helper. It is not taken because the older probe is **spent** evidence of what the
// corpus looked like on 2026-08-10, and editing a spent probe to serve a live one
// changes a record nobody can re-measure. If a third probe wants this reader, extract
// it then, from this file, and leave the fold probe alone.

async function supabaseConfig() {
  const fromEnv = {
    url: process.env.PUBLIC_SUPABASE_URL,
    anonKey: process.env.PUBLIC_SUPABASE_ANON_KEY,
  };
  if (fromEnv.url && fromEnv.anonKey) return fromEnv;

  // The values are public by design (ticket 03) and live in a gitignored file.
  const text = await readFile(new URL('web/.env.local', ROOT), 'utf8');
  const read = (name) => text.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1]?.trim();
  const url = read('PUBLIC_SUPABASE_URL');
  const anonKey = read('PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !anonKey) throw new Error('web/.env.local carries no Supabase configuration.');
  return { url, anonKey };
}

async function readOverrideLog() {
  const { url, anonKey } = await supabaseConfig();
  const endpoint = `${url}/rest/v1/overrides?select=*&order=created_at.asc`;
  const response = await fetch(endpoint, {
    headers: { apikey: anonKey, authorization: `Bearer ${anonKey}` },
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Supabase answered ${response.status}: ${body.slice(0, 300)}`);

  return JSON.parse(body).map((row) => ({
    id: String(row.id),
    createdAt: row.created_at,
    editor: row.editor,
    scope: row.scope,
    action: row.action,
    store: row.store,
    page: row.page,
    findingId: row.finding_id,
    class: row.class,
    findingSetHash: row.finding_set_hash,
    note: row.note,
  }));
}

// --- the measurement -------------------------------------------------------

const events = await readOverrideLog();
const live = [...latestByKey(events).values()].filter((event) => event.action !== 'cleared');
const reviews = live.filter((event) => event.scope === 'page' && event.action === 'reviewed');

/**
 * Where one review lands.
 *
 * - `goes-stale` — fresh today and not fresh after. This is the ticket's number.
 * - `stays-fresh` — fresh today and fresh after, so the page carries work findings
 *   and nothing else.
 * - `already-stale` — the page moved under the review before this ticket. It is
 *   not churn this ticket causes and must not be counted as any.
 * - `no-report` — the page is not on disk. A review can outlive its page.
 */
const outcomes = new Map();
const tally = (outcome, line) => {
  if (!outcomes.has(outcome)) outcomes.set(outcome, []);
  outcomes.get(outcome).push(line);
};

for (const review of reviews) {
  const file = new URL(`data/reports/${reportFilename(review.store, review.page)}`, ROOT);
  /** @type {any} */
  let report;
  try {
    report = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    tally('no-report', `${review.store}/${review.page} — ${review.editor}`);
    continue;
  }

  const findings = report.findings ?? [];
  // What the report carries is the old rule's answer, written at build time. It is
  // read rather than recomputed, because the old rule no longer exists in the tree.
  const before = report.findingSetHash;
  const after = findingSetHash(findings);
  const notWork = findings.filter((finding) => !isWork(finding.class));

  const wasFresh = review.findingSetHash === before;
  const staysFresh = review.findingSetHash === after;

  const line = `${review.store}/${review.page} — ${review.editor}, ${findings.length} findings, ${notWork.length} not work`;
  if (!wasFresh) tally('already-stale', line);
  else if (staysFresh) tally('stays-fresh', line);
  else tally('goes-stale', line);
}

// --- the report ------------------------------------------------------------

console.log(
  `\n${events.length} events, ${live.length} live, ${reviews.length} live page reviews.\n`,
);

console.log('| outcome | reviews |');
console.log('| --- | --- |');
for (const outcome of ['goes-stale', 'stays-fresh', 'already-stale', 'no-report']) {
  console.log(`| ${outcome} | ${outcomes.get(outcome)?.length ?? 0} |`);
}

const stale = outcomes.get('goes-stale') ?? [];
console.log(`\n**${stale.length} live page reviews go stale on the landing run.**\n`);
for (const line of stale) console.log(`- ${line}`);

const byStore = new Map();
for (const review of reviews) byStore.set(review.store, (byStore.get(review.store) ?? 0) + 1);
console.log(
  `\nLive reviews per store: ${[...byStore]
    .sort()
    .map(([s, n]) => `${s} ${n}`)
    .join(', ')}`,
);
