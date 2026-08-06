/**
 * The whole Supabase surface: three functions, and nothing else.
 *
 * The port is **passed in**, never imported by `state.mjs`. The derivation is
 * pure and is tested against hand-written event lists; this file is faked in
 * tests, and the real client is never constructed in one. There is no test
 * Supabase project.
 *
 * **Failure is loud.** A read that fails throws. It must never resolve to an
 * empty list, because an empty list means "nobody has done anything" and a
 * failed read must never be able to say that. This is the requirement ticket 13
 * forced; it does not answer ticket 13's own question, which is how to stop a
 * free project pausing in the first place.
 *
 * Ticket 03: the anon key is meant to be public, RLS is the whole protection,
 * and Realtime is ruled out.
 */

import { createClient } from '@supabase/supabase-js';

const TABLE = 'overrides';

/** The columns, in the order `state.mjs` wants them named. */
const COLUMNS = 'id, created_at, editor, scope, action, store, page, finding_id, class, observation_id, finding_set_hash, note';

/**
 * @param {any} row
 * @returns {import('./state.mjs').OverrideEvent}
 */
const toEvent = (row) => ({
  id: String(row.id),
  createdAt: row.created_at,
  editor: row.editor,
  scope: row.scope,
  action: row.action,
  store: row.store,
  page: row.page,
  findingId: row.finding_id,
  class: row.class,
  observationId: row.observation_id,
  findingSetHash: row.finding_set_hash,
  note: row.note,
});

/**
 * @param {import('./state.mjs').OverrideEvent} event
 */
const toRow = (event) => ({
  editor: event.editor,
  scope: event.scope,
  action: event.action,
  store: event.store,
  page: event.page,
  finding_id: event.findingId ?? null,
  class: event.class ?? null,
  observation_id: event.observationId ?? null,
  finding_set_hash: event.findingSetHash ?? null,
  note: event.note ?? null,
});

/**
 * @param {object} config
 * @param {string} config.url      The project URL.
 * @param {string} config.anonKey  Public by design (ticket 03).
 */
export function createOverridesPort({ url, anonKey }) {
  if (!url || !anonKey) {
    throw new Error(
      'No Supabase configuration. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  // No Realtime, no session: there is no login, so there is nothing to persist.
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  /**
   * The full history, not `overrides_current`. `latestByKey()` does the same
   * reduction, and the history is what answers "who dismissed this, and who
   * cleared it" in the interface without a second round trip.
   *
   * @param {(query: any) => any} narrow
   * @returns {Promise<import('./state.mjs').OverrideEvent[]>}
   */
  async function read(narrow) {
    const { data, error } = await narrow(
      client.from(TABLE).select(COLUMNS).order('created_at', { ascending: true }),
    );
    // Loud on purpose. An empty list is an answer; a failure is not.
    if (error) throw new Error(`Could not read the override log: ${error.message}`, { cause: error });
    return (data ?? []).map(toEvent);
  }

  return {
    /** @param {{ store: string, page: string }} where */
    readEvents: ({ store, page }) => read((q) => q.eq('store', store).eq('page', page)),

    /** @param {string} store */
    readEventsForStore: (store) => read((q) => q.eq('store', store)),

    /**
     * @param {import('./state.mjs').OverrideEvent} event
     * @returns {Promise<import('./state.mjs').OverrideEvent>} The row as stored.
     */
    async appendEvent(event) {
      const { data, error } = await client
        .from(TABLE).insert(toRow(event)).select(COLUMNS).single();
      if (error) {
        throw new Error(`Could not save to the override log: ${error.message}`, { cause: error });
      }
      return toEvent(data);
    },
  };
}
