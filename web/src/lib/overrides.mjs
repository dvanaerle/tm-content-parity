/**
 * The browser's side of the override log.
 *
 * The derivation (`overrides/state.mjs`) is pure and knows nothing about this
 * file; the port (`overrides/supabase.mjs`) is created here and passed in. That
 * split is what lets the precedence rules be tested without a Supabase project.
 *
 * Two rules from spec 29 shape everything here:
 *
 * - **A failed read is never an empty list.** `events` stays `null` until a read
 *   succeeds, and the interface shows a banner instead of a bar. An empty list
 *   means "nobody has done anything", and a failure must never say that.
 * - **A failed write goes read-only rather than silently dropping the click.**
 *   There is no optimistic update: the event is stored, and only then does it
 *   enter the list.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { appendEach } from '../../../overrides/bulk.mjs';
import { derivePageState, deriveStoreState } from '../../../overrides/state.mjs';
import { createOverridesPort } from '../../../overrides/supabase.mjs';
import { logState } from './log-read.mjs';

const EDITOR_KEY = 'tm-content-parity.editor';

/**
 * An editor is a name in `localStorage`. Ticket 03 ruled out Anonymous
 * Sign-In: attribution must cost nothing, and there is nothing here worth
 * protecting behind a login that RLS does not already protect.
 */
export function readEditor() {
  try {
    return localStorage.getItem(EDITOR_KEY) ?? '';
  } catch {
    return '';
  }
}

/** @param {string} name */
export function writeEditor(name) {
  try {
    localStorage.setItem(EDITOR_KEY, name.trim());
  } catch {
    // A browser with storage disabled still reads the log. It just cannot act.
  }
}

export function useEditor() {
  const [editor, setEditor] = useState('');
  useEffect(() => setEditor(readEditor()), []);

  const save = useCallback((name) => {
    writeEditor(name);
    setEditor(name.trim());
  }, []);

  return { editor, save };
}

/**
 * One port for the whole page. Creating it throws when the project is not
 * configured, and that is not an error the editor caused — it renders as
 * "the log is not connected", not as a failure.
 */
function usePort() {
  return useMemo(() => {
    try {
      return {
        port: createOverridesPort({
          url: import.meta.env.PUBLIC_SUPABASE_URL,
          anonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
        }),
        reason: null,
      };
    } catch (error) {
      return { port: null, reason: /** @type {Error} */ (error).message };
    }
  }, []);
}

/**
 * @param {object} input
 * @param {import('../../../compare/contract.mjs').PageReport} input.report
 * @param {string} input.editor
 */
export function useOverrides({ report, editor }) {
  const { port, reason } = usePort();
  const [events, setEvents] = useState(/** @type {any[] | null} */ (null));
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [busy, setBusy] = useState(false);

  const { store, page } = report;

  const reload = useCallback(async () => {
    if (!port) return;
    try {
      setEvents(await port.readEvents({ store, page }));
      setError(null);
    } catch (failure) {
      // Deliberately does not clear `events`: the last good read is still the
      // truest thing we have, and replacing it with `[]` would be a lie.
      setError(/** @type {Error} */ (failure).message);
    }
  }, [port, store, page]);

  useEffect(() => {
    reload();
  }, [reload]);

  /**
   * The store, the page and the editor of the page on screen, unless the caller names
   * another one. The spread is after the defaults on purpose: ticket 31 needs an event
   * aimed at a page that is **not** the one being looked at, and a caller that passes a
   * `page` is aiming it. Nothing in a page view does, and the seam no longer forbids it.
   *
   * @param {Partial<import('../../../overrides/state.mjs').OverrideEvent>} partial
   * @returns {Promise<boolean>} Whether it was stored.
   */
  const append = useCallback(
    async (partial) => {
      if (!port || !editor) return false;
      setBusy(true);
      try {
        const stored = await port.appendEvent({ store, page, editor, ...partial });
        setEvents((held) => [...(held ?? []), stored]);
        setError(null);
        return true;
      } catch (failure) {
        setError(/** @type {Error} */ (failure).message);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [port, store, page, editor],
  );

  const derived = useMemo(
    () => derivePageState({ report, events: events ?? [] }),
    [report, events],
  );

  return {
    derived,
    append,
    reload,
    busy,
    error,
    /** The log answered. Until it does, the numbers are not to be trusted. */
    ready: events !== null,
    connected: Boolean(port),
    notConnectedReason: reason,
    /** No name, no writing: every event carries an author. */
    canWrite: Boolean(port) && Boolean(editor) && events !== null && !error,
  };
}

/**
 * The one sentence a bulk control shows in place of its buttons, and the message a press
 * with no name reports. Both are here so the words and the flag they explain sit
 * together.
 *
 * The order is the order an editor can act on: a name is the one thing they can fix here
 * and now, so it is asked for before anything they cannot.
 */
function whyNotWriting({ port, editor, events, error }) {
  // The log's own four states come from `logState()`, which is the one reading of them in
  // this repo since the review of ticket 123. What is different here is the **fifth**
  // condition, which is not about the log at all: a name. It keeps its place in the order —
  // it is the one thing an editor can fix here and now, so it is asked for before anything
  // they cannot — and that is why this is still a cascade and not a lookup.
  const { state } = logState({ ready: events !== null, error, connected: Boolean(port) });

  if (state === 'disconnected') return 'No connection to the log, so a decision cannot be made.';
  if (state === 'failed') return 'The log does not answer, so this is read-only.';
  if (!editor) return NO_EDITOR;
  if (state === 'reading') return 'The log is still loading.';
  return null;
}

const NO_EDITOR = 'Give your name at the top to decide here. Each decision carries a name.';

/**
 * The dashboard's side: every event for the store, reduced to a bar per page and
 * one roll-up **summed over findings, never over pages**.
 *
 * A `PageSummary` is a valid input to the derivation — it carries the store, the
 * page, the work findings, the observation and the finding-set hash, which is
 * everything `derivePageState()` reads. So the dashboard and the page agree by
 * construction rather than by two implementations of the same rules.
 *
 * It **writes** since ticket 31, and only in bulk. A repeat row is the one control the
 * store list hosts, and the page ledger stays the only place a single finding is decided
 * — the two surfaces do not both need to offer every action, and a dashboard that could
 * write one event at a time would be the second override control this project has spent
 * two tickets reducing to one.
 *
 * @param {{ pages: import('./reports.mjs').PageSummary[], editor?: string }} input
 */
export function useStoreOverrides({ pages, editor = '' }) {
  const { port, reason } = usePort();
  const [events, setEvents] = useState(/** @type {any[] | null} */ (null));
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [busy, setBusy] = useState(false);

  const stores = useMemo(
    () => [...new Set(pages.map((page) => page.store))].sort().join(','),
    [pages],
  );

  useEffect(() => {
    // **No store to read is an answer, not a wait**, and it is decided before the port:
    // whether the log could be reached does not come into it, because there is nothing to
    // ask it about. Both early returns used to be one, which left `events` null with no
    // request outstanding — and the notes half reads that as *still reading*, a sentence
    // that would then never stop being said (the review of ticket 123).
    if (!stores) {
      setEvents([]);
      setError(null);
      return;
    }
    if (!port) return;
    let live = true;
    Promise.all(stores.split(',').map((store) => port.readEventsForStore(store)))
      .then((lists) => {
        if (live) {
          setEvents(lists.flat());
          setError(null);
        }
      })
      .catch((failure) => {
        if (live) setError(failure.message);
      });
    return () => {
      live = false;
    };
  }, [port, stores]);

  const derived = useMemo(
    () => deriveStoreState({ reports: pages, events: events ?? [] }),
    [pages, events],
  );

  const byPage = useMemo(
    () => new Map(derived.pages.map((page) => [`${page.store}/${page.page}`, page])),
    [derived],
  );

  /**
   * One press, N events, each aimed at its own page (ticket 31).
   *
   * The **editor** is injected here and per event, because attribution is per row. The
   * store and the page are not: a bulk press spans pages and this hook is not bound to
   * one, so every event has to carry its own. `appendEach()` holds the rule about a
   * partial failure; this holds nothing but the wiring, because there is no DOM test in
   * this repo and anything with a decision in it belongs below that line.
   *
   * A failure sets the same `error` a single write does, so the log goes read-only and
   * the banner appears. The rows that *were* written still enter the list: they are in
   * the table, and a list that dropped them would disagree with the log it reports on.
   */
  const appendMany = useCallback(
    async (toWrite) => {
      if (!port || !editor) {
        return {
          stored: [],
          written: 0,
          total: toWrite.length,
          failedOn: null,
          error: NO_EDITOR,
        };
      }

      setBusy(true);
      try {
        const result = await appendEach(
          port,
          toWrite.map((event) => ({ ...event, editor })),
        );
        if (result.stored.length > 0) setEvents((held) => [...(held ?? []), ...result.stored]);
        setError(result.error);
        return result;
      } finally {
        setBusy(false);
      }
    },
    [port, editor],
  );

  return {
    derived,
    byPage,
    // The events themselves, for the one reader that needs the log and not the state
    // derived from it: searching the **notes** (ticket 82). A note is a sentence an
    // editor wrote, and the derivation keeps the decision and drops the words.
    //
    // **`null` until a read succeeds**, which is this module's first rule and which this
    // one field used to break for its one reader: it handed down `events ?? []` while a
    // read was in flight, and the notes half of a search drew "no notes" from it (ticket
    // 123). The derivation below still coerces, because a state derived from no events
    // is the same state as one derived from none — but a *list of what an editor wrote*
    // is not, and that is the reader this field has.
    events,
    appendMany,
    busy,
    ready: events !== null,
    error,
    connected: Boolean(port),
    notConnectedReason: reason,
    /** The same four conditions the page view writes under. No name, no writing. */
    canWrite: Boolean(port) && Boolean(editor) && events !== null && !error,
    /**
     * Which of those four is missing, in one sentence. It lives here and not in a
     * component for the reason this hook exists: the conditions are derived in one
     * place, and a second cascade over the same four would be a second implementation
     * of the same rule, free to drift from the flag it is explaining.
     */
    notWritingReason: whyNotWriting({ port, editor, events, error }),
  };
}
