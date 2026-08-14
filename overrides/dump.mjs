/**
 * A copy of the override log on disk, before a schema change touches the table.
 *
 * The table is append-only and it is the **only** thing in this project that cannot be
 * rebuilt: a snapshot can be re-crawled and a report re-compared, but a judgement an editor
 * made is gone for good. The project is on the free plan (ticket 13), which has no automated
 * backups to fall back on, so this is the copy.
 *
 * It reads with the **anon key**, which is all that is needed: RLS gives `anon` a select
 * policy over every row (ticket 03), and the key is public by design. Nothing here can
 * write — there is no update or delete policy to write with.
 *
 * Usage, from the repo root:
 *
 *   PUBLIC_SUPABASE_URL=… PUBLIC_SUPABASE_ANON_KEY=… node overrides/dump.mjs
 *
 * The two values are in `web/.env.local`. Output goes to `data/`, which `.gitignore`
 * excludes — the dump carries editor names and belongs on disk, not in the history.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const url = process.env.PUBLIC_SUPABASE_URL;
const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error('Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY. Both are in web/.env.local.');
  process.exit(1);
}

/**
 * `select('*')` and not the port's column list, on purpose. `overrides/supabase.mjs` selects
 * the columns the app understands; a backup wants the columns it does **not** — the three
 * retired ones ADR 0011 left behind, and any column a later ticket adds without telling this
 * file. A dump that filtered would quietly stop being a backup.
 */
const client = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * How many rows to ask for at a time. The server may hand back **fewer** than this: a
 * project sets its own ceiling on a response — 100 on this one — and PostgREST silently
 * clamps the range rather than refusing it.
 */
const PAGE = 1000;

/**
 * Every row, and a check that it really is every row.
 *
 * **The page size cannot be the termination condition**, and this is the trap worth naming
 * because the first version of this file fell into it. Stopping when a page comes back
 * shorter than requested assumes the server honours the size asked for; against a project
 * that clamps responses to 100, the first request returns 100, `100 < 1000` reads as *the
 * end*, and the dump stops at 100 rows while reporting success. A backup that lies about
 * being complete is worse than no backup.
 *
 * So the count comes from the server — `count: 'exact'` is a `count(*)` over the table,
 * unaffected by the response ceiling — and the loop runs until it has that many. A page
 * that returns nothing breaks the loop rather than spinning for ever, and the mismatch is
 * then thrown rather than written.
 *
 * @returns {Promise<any[]>}
 */
async function readAll() {
  /** @type {any[]} */
  const rows = [];
  let total = null;

  while (total === null || rows.length < total) {
    const { data, error, count } = await client
      .from('overrides')
      .select('*', { count: 'exact' })
      // Ordered by the primary key, so the pages tile the table exactly. Ordering on
      // `created_at` would risk a row landing in two pages or in none, because it is not
      // unique — two events in the same millisecond are what the table id exists to separate.
      .order('id', { ascending: true })
      .range(rows.length, rows.length + PAGE - 1);

    // Loud, for the reason the port is loud: an empty list means "the log is empty", and a
    // failed read must never be able to say that — least of all to a backup.
    if (error) throw new Error(`Could not read the override log: ${error.message}`, { cause: error });
    if (count !== null) total = count;

    const page = data ?? [];
    if (page.length === 0) break;
    rows.push(...page);
  }

  // The one assertion that makes this a backup rather than a sample.
  if (total !== null && rows.length !== total) {
    throw new Error(
      `Read ${rows.length} rows but the table holds ${total}. Nothing was written. `
      + 'The read stopped early — do not treat a partial dump as a backup.',
    );
  }

  return rows;
}

const rows = await readAll();

// The date in the name, so a second run never overwrites the first. A backup you can
// overwrite by accident is a backup with one slot.
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const path = `data/overrides-backup-${stamp}.json`;

await mkdir('data', { recursive: true });
await writeFile(path, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');

// The counts worth reading back: the total, and the two that answer "did I lose anything".
const withNote = rows.filter((row) => row.note !== null && String(row.note).trim() !== '').length;
const dismissals = rows.filter((row) => row.action === 'dismissed').length;

console.log(`${rows.length} rows written to ${path}`);
console.log(`  ${withNote} carry a note`);
console.log(`  ${dismissals} are dismissals`);
console.log(`  highest id ${rows.at(-1)?.id ?? '—'}`);
console.log('Hold these numbers. They must be unchanged after the migration, which has no');
console.log('update, delete or truncate in it. The row count is checked against the table');
console.log('before anything is written, so a short read throws instead of saving.');
