import { describe, expect, it } from 'vitest';

import { noteEventFor, priorityEventFor } from './state.mjs';
import { createOverridesPort, toEvent, toRow } from './supabase.mjs';

/**
 * The port is thin, and what these tests pin is the one asymmetry left in it: the app
 * **writes** four actions on two scopes, and it **reads** a table that is append-only and
 * older than that. ADR 0011 withdrew the override keyed on a class in a section, and the
 * eleven rows it left stay on disk for ever. So `toEvent()` has to map a shape `toRow()` can
 * no longer produce, and it must do it without asking what the shape is.
 *
 * This file tested that override's three anchor states until ticket 114 — the port was where
 * *absent* had to stay distinguishable from *null*, because flattening the two turned a
 * judgement about a page into a judgement about the content before its first heading. There
 * is no key left that reads either, and the two columns are no longer selected.
 *
 * There is no test Supabase project, so the mappers are tested against hand-written rows.
 * `createOverridesPort()` **is** constructed in the last block, over a faked
 * `@supabase/supabase-js` — because the one thing left in this file that is not a mapper
 * is the read's paging, and paging is only observable against a server that caps.
 */

/**
 * The live withdrawn row, as Supabase hands it over: `nl` · `downloads` · `text-missing` ·
 * the content before the first heading, 2026-08-10 11:07, note `"Negeren"` (ADR 0011).
 *
 * It still carries `anchor_heading` and `names_section`, because the columns are still on
 * the table — the port simply stopped selecting them. A fixture that dropped them would
 * be testing a row Postgres does not hold.
 */
const withdrawnRow = {
  id: 311,
  created_at: '2026-08-10T11:07:00.000Z',
  editor: 'Danielle',
  scope: 'page-class',
  action: 'muted',
  store: 'nl',
  page: 'downloads',
  finding_id: null,
  class: 'text-missing',
  anchor_heading: null,
  names_section: true,
  observation_id: null,
  finding_set_hash: null,
  note: 'Negeren',
};

describe('a withdrawn row still crosses the port', () => {
  it('does not throw, and keeps the row readable', () => {
    expect(() => toEvent(withdrawnRow)).not.toThrow();
    expect(toEvent(withdrawnRow)).toMatchObject({
      id: '311',
      scope: 'page-class',
      action: 'muted',
      store: 'nl',
      page: 'downloads',
      class: 'text-missing',
      note: 'Negeren',
    });
  });

  it('carries no anchor heading, because nothing selects the column', () => {
    // The finding's own `anchorHeading` is a locator off the snapshot and survives ADR
    // 0011. It never came from this table, and an override that carried one would be a
    // key nothing writes.
    expect(toEvent(withdrawnRow)).not.toHaveProperty('anchorHeading');
  });

  it('survives a row that has neither retired column, as the oldest four do', () => {
    // Four of the eleven predate ticket 88 and were written before the columns existed.
    const { anchor_heading: _a, names_section: _n, ...older } = withdrawnRow;
    expect(() => toEvent(older)).not.toThrow();
    expect(toEvent(older).action).toBe('muted');
  });
});

describe('what the app writes', () => {
  const dismissal = {
    createdAt: '2026-08-13T10:00:00.000Z',
    editor: 'Danielle',
    scope: 'finding',
    action: 'dismissed',
    store: 'nl',
    page: 'terrasoverkapping',
    findingId: 'a1b2c3d4e5f6a7b8',
    note: 'Prijs verschilt per omgeving.',
  };

  const roundTrip = (event) => toEvent({ id: 1, created_at: event.createdAt, ...toRow(event) });

  it('round-trips a dismissal through the row shape', () => {
    expect(roundTrip(dismissal)).toMatchObject({
      scope: 'finding',
      action: 'dismissed',
      findingId: 'a1b2c3d4e5f6a7b8',
      note: 'Prijs verschilt per omgeving.',
    });
  });

  it('leaves the retired columns out of the row entirely', () => {
    // Not `null`: absent. Both columns keep their table defaults, and an insert that named
    // them would be the app writing to a shape ADR 0011 retired.
    const row = toRow(dismissal);
    expect(row).not.toHaveProperty('anchor_heading');
    expect(row).not.toHaveProperty('names_section');
  });

  it('nulls the key column the scope does not use', () => {
    // `override_key` in the schema wants exactly one of the two, and a missing property
    // and an explicit null are not the same thing to Postgres.
    expect(toRow(dismissal).class).toBeNull();
  });

  it('round-trips a page review', () => {
    expect(
      roundTrip({
        ...dismissal,
        scope: 'page',
        action: 'reviewed',
        findingId: undefined,
        findingSetHash: 'h1',
        note: undefined,
      }),
    ).toMatchObject({ scope: 'page', action: 'reviewed', findingSetHash: 'h1' });
  });

  const annotation = {
    ...dismissal,
    findingId: undefined,
    note: undefined,
    ...priorityEventFor('high'),
  };

  it('round-trips a page priority', () => {
    expect(roundTrip(annotation)).toMatchObject({
      scope: 'page',
      action: 'prioritised',
      priority: 'high',
    });
  });

  it('carries a cleared priority as an explicit null and not as an absent column', () => {
    // The clearing **is** the value here: a row with no `priority` column named would take
    // the column default, and the derivation reads the latest `prioritised` event's value
    // whatever it is. Absent and null are not the same thing to Postgres.
    const row = toRow({ ...annotation, ...priorityEventFor(null) });
    expect(row).toHaveProperty('priority');
    expect(row.priority).toBeNull();
  });

  it('round-trips a page note without it becoming a dismissal note', () => {
    // Both live in the `note` column, and the action is what tells them apart.
    expect(roundTrip({ ...annotation, ...noteEventFor('Campagne-update') })).toMatchObject({
      scope: 'page',
      action: 'noted',
      note: 'Campagne-update',
    });
  });
});

/**
 * The read pages, because PostgREST caps a select and says nothing when it does.
 *
 * This is the defect of 2026-08-17, and it is worth stating in full because nothing on
 * the response distinguishes it from a complete answer. Supabase serves at most
 * `max-rows` — 1,000 by default — and returns a valid array of exactly that length. The
 * read is ordered oldest-first, so the rows the cap drops are the newest: an editor's
 * own decisions, the moment the store's log passes the cap. On that day the `nl` store
 * held 1,148 events, the app read 1,000, and 91 decisions were invisible — so checking a
 * finding off moved no count and the press read as broken.
 *
 * A `PostgrestBuilder` is a thenable that collects its own query, so the fake is the same
 * shape: every method returns the builder, and awaiting it applies the filters, then the
 * range, then the server's cap — in that order, which is the order PostgREST applies them.
 */
const fakeSupabase = (rows, cap) => ({
  from: () => {
    const filters = {};
    let window = [0, Number.MAX_SAFE_INTEGER];

    const builder = {
      select: () => builder,
      order: () => builder,
      eq: (column, value) => {
        filters[column] = value;
        return builder;
      },
      range: (from, to) => {
        window = [from, to];
        return builder;
      },
      // Deliberate: a `PostgrestBuilder` is a thenable that collects its query and runs
      // it on await, and `read()` awaits the builder. A fake without `then` would be a
      // client shape this port never meets.
      // oxlint-disable-next-line unicorn/no-thenable
      then: (resolve) => {
        const matched = rows.filter((row) =>
          Object.entries(filters).every(([column, want]) => row[column] === want),
        );
        const [from, to] = window;
        // The range first, then the cap over what the range asked for. A server that caps
        // at `cap` never returns more than that, however wide the window.
        resolve({ data: matched.slice(from, to + 1).slice(0, cap), error: null });
      },
    };
    return builder;
  },
});

/** `n` events on one store, oldest first, so the newest are the ones a cap would drop. */
const manyRows = (n, store = 'nl') =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    created_at: `2026-08-17T${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00.000Z`,
    editor: 'Danielle',
    scope: 'finding',
    action: 'dismissed',
    store,
    page: `page-${i}`,
    finding_id: `f${i}`,
    class: null,
    observation_id: null,
    finding_set_hash: null,
    note: 'x',
    priority: null,
  }));

/** The port over a given client. The config is unused when a client is handed in. */
const portOver = (client) => createOverridesPort({ url: null, anonKey: null, client });

describe('a read past the server cap', () => {
  it('returns every event of a store, and not the first page of them', async () => {
    // The shape of the defect: 1,148 rows behind a 1,000-row cap.
    const events = await portOver(fakeSupabase(manyRows(1148), 1000)).readEventsForStore('nl');

    expect(events).toHaveLength(1148);
  });

  it('reaches the newest event, which is the one a decision just wrote', async () => {
    // The whole symptom in one assertion. Oldest-first ordering means the cap drops the
    // newest rows, so an editor's own check-off is the first thing to become invisible.
    const events = await portOver(fakeSupabase(manyRows(1148), 1000)).readEventsForStore('nl');

    expect(events.at(-1).findingId).toBe('f1147');
  });

  it('pages a project whose cap is lower than the page it asks for', async () => {
    // A short page must not end the loop: it also means the server caps below `PAGE`, and
    // stopping there would truncate exactly as the unpaged read did.
    const events = await portOver(fakeSupabase(manyRows(1148), 500)).readEventsForStore('nl');

    expect(events).toHaveLength(1148);
  });

  it('ends on an exact multiple of the page size without losing or repeating a row', async () => {
    const events = await portOver(fakeSupabase(manyRows(2000), 1000)).readEventsForStore('nl');

    expect(events).toHaveLength(2000);
    expect(new Set(events.map((one) => one.id)).size).toBe(2000);
  });

  it('keeps the store filter on every page, not only on the first', async () => {
    // The filter is applied by the caller's `narrow`, and the loop calls it once per page.
    // A page that dropped it would pull another store's log in behind the first thousand.
    const client = fakeSupabase([...manyRows(1100, 'nl'), ...manyRows(50, 'uk')], 1000);

    const events = await portOver(client).readEventsForStore('nl');

    expect(events).toHaveLength(1100);
    expect(events.every((one) => one.store === 'nl')).toBe(true);
  });

  it('still throws on a failure rather than resolving to a short list', async () => {
    // The module's first rule. A failed read must never look like an answer, and paging
    // gives it a second place to go wrong: a page that errors must not end the loop.
    const failing = {
      from: () => {
        const builder = {
          select: () => builder,
          order: () => builder,
          eq: () => builder,
          range: () => builder,
          // A thenable for the same reason as above: the read awaits the builder.
          // oxlint-disable-next-line unicorn/no-thenable
          then: (resolve) => resolve({ data: null, error: { message: 'nope' } }),
        };
        return builder;
      },
    };

    await expect(portOver(failing).readEventsForStore('nl')).rejects.toThrow(
      'Could not read the override log',
    );
  });
});
