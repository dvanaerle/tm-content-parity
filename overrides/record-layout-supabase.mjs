/**
 * The Supabase surface of the record layout: a read and an append, and nothing else.
 *
 * It is a second port beside `supabase.mjs` rather than two more methods on it, for the
 * reason the table is a second table: a fact and a judgement are different things, and a port
 * that read both would be the one place they were confused. `record-layout.mjs` is pure and
 * never imports this — the port is passed in, which is what lets the derivation be tested
 * against hand-written events with no project.
 *
 * **Failure is loud**, on the same terms as the override port. An empty list means the grid
 * has never been read, and a failed read must never be able to say that — because *never
 * read* is what makes the whole complement grant nothing, and a network error must not look
 * like a safe answer.
 */

import { createClient } from '@supabase/supabase-js';
import { readAllRows } from './paged-read.mjs';

const TABLE = 'record_layout';

const COLUMNS = 'id, created_at, editor, kind, store, page, record_id, reason, taken_on';

/**
 * The mapper is exported for its own test.
 *
 * @param {any} row
 * @returns {import('./record-layout.mjs').RecordLayoutEvent}
 */
export const toEvent = (row) => ({
  id: String(row.id),
  createdAt: row.created_at,
  editor: row.editor,
  kind: row.kind,
  store: row.store ?? null,
  page: row.page ?? null,
  recordId: row.record_id ?? null,
  reason: row.reason ?? null,
  takenOn: row.taken_on ?? null,
});

/**
 * @param {object} config
 * @param {string} config.url
 * @param {string} config.anonKey Public by design (ticket 03).
 * @param {any} [config.client]   For a caller that has one already, and for the test.
 */
export function createRecordLayoutPort({ url, anonKey, client: given }) {
  if (!given && (!url || !anonKey)) {
    throw new Error(
      'No Supabase configuration. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  const client =
    given ??
    createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

  return {
    /**
     * Every event, oldest first. The whole table and not `record_layout_current`, because
     * `recordLayoutFrom()` does that reduction and the history underneath is what says who
     * wrote an entry and who withdrew it.
     *
     * @returns {Promise<import('./record-layout.mjs').RecordLayoutEvent[]>}
     */
    async readEvents() {
      const rows = await readAllRows({
        client,
        table: TABLE,
        columns: COLUMNS,
        what: 'the record layout',
      });
      return rows.map(toEvent);
    },

    /**
     * One event, as `separateEventFor()`, `sharedEventFor()` or `readingEventFor()` built it.
     * Those three name the table's own columns, so this adds the editor and nothing else —
     * the editor is known here and nowhere below.
     *
     * @param {Record<string, unknown>} event
     * @param {string} editor
     * @returns {Promise<import('./record-layout.mjs').RecordLayoutEvent>} The row as stored.
     */
    async appendEvent(event, editor) {
      const name = editor?.trim() ?? '';
      if (!name) throw new Error('Say who you are before you write to the record layout.');

      const { data, error } = await client
        .from(TABLE)
        .insert({ ...event, editor: name })
        .select(COLUMNS)
        .single();
      if (error) {
        throw new Error(`Could not save to the record layout: ${error.message}`, { cause: error });
      }
      return toEvent(data);
    },
  };
}
