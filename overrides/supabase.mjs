/**
 * The whole Supabase surface: three functions, and nothing else.
 *
 * The port is **passed in**, never imported by `state.mjs`. The derivation is
 * pure and is tested against hand-written event lists. There is no test Supabase
 * project: `createOverridesPort()` takes an optional `client`, so the one behaviour
 * here that is not a mapper — the read's paging — is tested by handing it a client
 * that caps the way PostgREST does. The real client is never constructed in a test.
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

/**
 * Rows asked for per request. Supabase's own `max-rows` is 1,000 by default, so this is
 * the largest page that is ever served whole — but the loop must not depend on that
 * number, because a project is free to lower it and the client is never told what it is.
 * `read()` therefore stops on an **empty** page and never on a short one.
 */
const PAGE = 1000;

/**
 * The columns, in the order `state.mjs` wants them named.
 *
 * `anchor_heading` and `names_section` are **not** selected. The withdrawn override of
 * ADR 0011 was keyed on a section, and those two columns existed to carry it — the three
 * anchor states of ADR 0008, and the second null needed to say them with. They stay on the
 * table, holding what the eleven historical rows put there; nothing reads them.
 *
 * `anchorHeading` survives on a **finding**, where it says where on the page a difference
 * sits. That comes off the snapshot and never off this table.
 */
const COLUMNS =
  'id, created_at, editor, scope, action, store, page, finding_id, class, observation_id, finding_set_hash, note, priority';

/**
 * The two mappers are exported for their own test.
 *
 * `toEvent()` maps every row the same way and asks nothing about its scope, so a
 * historical `page-class` row becomes an event like any other and the derivation is left
 * to not look it up. A mapper that switched on the scope is where reading one of those
 * eleven rows would start to throw.
 *
 * @param {any} row
 * @returns {import('./state.mjs').OverrideEvent}
 */
export const toEvent = (row) => ({
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
  priority: row.priority ?? null,
});

/**
 * @param {import('./state.mjs').OverrideEvent} event
 */
export const toRow = (event) => ({
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
  // Named on every row, including as an explicit null. On a `prioritised` event the null
  // **is** the value — it is how ticket 83 clears the annotation — so this column is one
  // the app writes rather than one it leaves to a default.
  priority: event.priority ?? null,
});

/**
 * @param {object} config
 * @param {string} config.url      The project URL.
 * @param {string} config.anonKey  Public by design (ticket 03).
 * @param {any} [config.client]
 *   The Postgrest client, for a caller that has one already. It exists for the paging
 *   test: the read loops until a page comes back empty, and *how many rows a request is
 *   served* is the server's own behaviour — so the only way to test the loop is to hand
 *   the port a client that caps. It is the same seam the app already uses one level up,
 *   where `overrides.mjs` creates this port and `state.mjs` never imports it.
 */
export function createOverridesPort({ url, anonKey, client: given }) {
  if (!given && (!url || !anonKey)) {
    throw new Error(
      'No Supabase configuration. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  // No Realtime, no session: there is no login, so there is nothing to persist.
  const client =
    given ??
    createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

  /**
   * The full history, not `overrides_current`. `latestByKey()` does the same
   * reduction, and the history is what answers "who dismissed this, and who
   * cleared it" in the interface without a second round trip.
   *
   * **Paged, because PostgREST caps a select.** Supabase serves at most `max-rows`
   * (1,000 by default) per request and says nothing when it truncates: the response is
   * a valid, complete-looking array. This read is ordered oldest-first, so the rows the
   * cap drops are the **newest** ones — and the newest rows are exactly the decisions an
   * editor just made. On 2026-08-17 the `nl` store held 1,148 events and the app could
   * see 1,000 of them, so 148 decisions were invisible and every check-off made after
   * the cap was reached appeared to do nothing. That is the whole of the defect.
   *
   * `id` is the second sort key. Paging needs a total order, and `created_at` alone is
   * not one: two rows written in the same microsecond could otherwise swap between two
   * requests, which is how a paged read loses a row and repeats another. It is the same
   * tiebreak `isLater()` in `state.mjs` uses, for the same reason.
   *
   * An **empty** page ends it, never a short one. A short page does not mean the end of
   * the table: it also means the server's cap is below the page this asks for, and a loop
   * that stopped there would truncate exactly as the unpaged read did — quietly, and
   * worse on the projects that configured the smallest cap. Ending on empty costs one
   * extra request per read and cannot lose a row.
   *
   * @param {(query: any) => any} narrow
   * @returns {Promise<import('./state.mjs').OverrideEvent[]>}
   */
  async function read(narrow) {
    /** @type {any[]} */
    const rows = [];

    for (;;) {
      const { data, error } = await narrow(
        client
          .from(TABLE)
          .select(COLUMNS)
          .order('created_at', { ascending: true })
          .order('id', { ascending: true })
          .range(rows.length, rows.length + PAGE - 1),
      );
      // Loud on purpose. An empty list is an answer; a failure is not.
      if (error)
        throw new Error(`Could not read the override log: ${error.message}`, { cause: error });

      const page = data ?? [];
      rows.push(...page);
      if (page.length === 0) break;
    }

    return rows.map(toEvent);
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
        .from(TABLE)
        .insert(toRow(event))
        .select(COLUMNS)
        .single();
      if (error) {
        throw new Error(`Could not save to the override log: ${error.message}`, { cause: error });
      }
      return toEvent(data);
    },
  };
}
