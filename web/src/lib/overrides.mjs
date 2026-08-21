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
import { derivePageState, deriveStoreState, eventsOfStores } from '../../../overrides/state.mjs';
import { createOverridesPort } from '../../../overrides/supabase.mjs';
import { announce, pressMessage, savedMessage } from './announce.mjs';
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

/** One object for every caller that names none. A fresh `{}` per render is a new
    dependency, and the page would re-derive on every one of them. */
const NO_CLOSINGS = {};

/**
 * @param {object} input
 * @param {import('../../../compare/contract.mjs').PageReport} input.report
 * @param {string} input.editor
 * @param {Record<string, string[]>} [input.closedWith]  Per finding id, the ids the run log
 *   says stopped being seen in the run that first saw it (ticket 78). Read at build time,
 *   because the index is a committed file and this hook runs in the browser.
 */
export function useOverrides({ report, editor, closedWith = NO_CLOSINGS }) {
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
        // Announced from the seam every single decision passes through, and not from the
        // six controls that make one: a control announcing its own success would be six
        // vocabularies for one outcome, and the seventh control would be silent.
        announce(savedMessage(partial));
        return true;
      } catch (failure) {
        const { message } = /** @type {Error} */ (failure);
        setError(message);
        announce(`Not saved. ${message}`);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [port, store, page, editor],
  );

  const derived = useMemo(
    () => derivePageState({ report, events: events ?? [], closedWith }),
    [report, events, closedWith],
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
    /**
     * Why not, in the one wording. `canWrite` says whether, and a control that has to tell
     * an editor *why* had nowhere to read it before ui-polish 08 — the store's side has
     * published this since ticket 31 and the page's side composed nothing, which is how a
     * second set of sentences would have started.
     */
    notWritingReason: whyNotWriting({ port, editor, events, error }),
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

/** Asked for in three wordings before ticket 01; one sentence, and it lives here. */
export const NO_EDITOR = 'Give your name at the top to decide. Each decision carries a name.';

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
 * Since ticket 03 it takes **two** lists, and the split is the whole of how a
 * block-spanning press stays out of a store's numbers:
 *
 * - `pages` is what this store's **numbers** are about — the bar, the roll-up, the review
 *   counts. It is this store's pages and nothing else, which is what keeps the dashboard's
 *   promise that it carries only that store's progress numbers.
 * - `siblingPages` is what a **press** can touch and no number may read: the sibling
 *   store's pages, where this store is in a language block. Their events are fetched and
 *   their findings are derived, so a repeat spanning the block can say what is decided over
 *   there and a press can write there — and `derived.bar` never sees them.
 *
 * A single list would have been less code and would have put `be`'s findings into `nl`'s
 * denominator, which is the one thing ADR 0018 promises this feature does not do.
 *
 * The second list is called what `CONTEXT.md` calls it — a **sibling page** — and not
 * *reached* or *reachable*. One concept had picked up three names between the page that
 * loads it, the dashboard that filters it and this hook, and the glossary has owned the
 * word since ticket 02.
 *
 * @param {object} input
 * @param {import('./reports.mjs').PageSummary[]} input.pages
 * @param {import('./reports.mjs').PageSummary[]} [input.siblingPages]
 * @param {string} [input.editor]
 */
/**
 * What a **bulk press** is built with, off a log this hook returned.
 *
 * Four of the hook's own fields and nothing derived: whether it may write, whether it is
 * writing, the write itself, and the hook's one sentence about why it may not. It is a
 * function here rather than the same `useMemo` on every screen that presses, because there are
 * two of them now — a store dashboard and the search above the stores (ticket 04) — and a
 * second copy is where a fifth field would arrive on one screen and not the other.
 *
 * @param {ReturnType<typeof useStoreOverrides>} log
 */
export function useBulk(log) {
  return useMemo(
    () => ({
      canWrite: log.canWrite,
      busy: log.busy,
      appendMany: log.appendMany,
      // The hook's own sentence about its own flag, not a second reading of the four
      // conditions behind it.
      notWritingReason: log.notWritingReason,
    }),
    [log.canWrite, log.busy, log.appendMany, log.notWritingReason],
  );
}

export function useStoreOverrides({ pages, siblingPages = [], editor = '' }) {
  const { port, reason } = usePort();
  const [events, setEvents] = useState(/** @type {any[] | null} */ (null));
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [busy, setBusy] = useState(false);

  // Every store either list names, because a press writes in both and an event read for
  // only one of them would leave the other's decisions invisible — the state a repeat row
  // shows and the eligibility a press reads are the same lookup.
  const stores = useMemo(
    () => [...new Set([...pages, ...siblingPages].map((page) => page.store))].sort().join(','),
    [pages, siblingPages],
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

  /**
   * The sibling pages, derived by the **same function** over the same events. Nothing here
   * is summed: only `pages` is a store's work, and this list exists so a press can see and
   * write past the store's edge. It is a second call and not a second implementation, so a
   * sibling page's `dismissed` means what a page's `dismissed` means.
   */
  const siblingState = useMemo(
    () => deriveStoreState({ reports: siblingPages, events: events ?? [] }),
    [siblingPages, events],
  );

  /**
   * Both derivations' pages as one list, which is what the two indexes below are built over.
   *
   * Spread **once**. Two indexes ask the same *every page either list holds* question, and
   * two spreads is two chances for one of them to be built over `derived.pages` alone — the
   * failure `byFinding` documents below, arrived at by a typo rather than by a decision.
   */
  const everyPage = useMemo(
    () => [...derived.pages, ...siblingState.pages],
    [derived, siblingState],
  );

  const byPage = useMemo(
    () => new Map(everyPage.map((page) => [`${page.store}/${page.page}`, page])),
    [everyPage],
  );

  /**
   * Every derived finding either list holds, by id — what a repeat row reads to say what is
   * decided, and what both presses read for their eligibility.
   *
   * It lives here rather than in the dashboard because it is the one index over **both**
   * lists, and a component rebuilding it off `derived.pages` alone would silently make a
   * block-spanning press treat the sibling's decided findings as `open`.
   */
  const byFinding = useMemo(() => {
    const index = new Map();
    for (const page of everyPage) {
      for (const finding of page.findings) index.set(finding.id, finding);
    }
    return index;
  }, [everyPage]);

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
  /**
   * The events of **this store's** pages, which is the whole of what leaves this hook as a
   * log rather than as a derived state (ticket 03).
   *
   * The fetch above reads both stores of a block, because a press writes in both and a repeat
   * row has to say what is decided over there. That widening is for the **press and the row**:
   * `derived.bar` is insulated from it by taking only `pages`, and so is every other
   * derivation, but `events` is handed out raw to the one reader that is neither — the notes
   * half of a search. `eventsOfStores()` holds why that reader may not have the sibling's, and
   * it is asked here, where the two lists are told apart, rather than in the search, which has
   * no business knowing a block exists.
   *
   * The stores come off `pages` and never off the `stores` the effect read: that one is both
   * of them by design, and narrowing with it would narrow to everything.
   */
  const ownEvents = useMemo(
    () => eventsOfStores({ events, stores: pages.map((page) => page.store) }),
    [events, pages],
  );

  const appendMany = useCallback(
    async (toWrite, watching) => {
      if (!port || !editor) {
        const refused = {
          stored: [],
          written: 0,
          total: toWrite.length,
          stoppedOn: null,
          aborted: false,
          error: NO_EDITOR,
        };
        announce(pressMessage(refused));
        return refused;
      }

      setBusy(true);
      try {
        const result = await appendEach(
          port,
          toWrite.map((event) => ({ ...event, editor })),
          watching,
        );
        if (result.stored.length > 0) setEvents((held) => [...(held ?? []), ...result.stored]);
        // A stop is not a refusal. The log answered every row it was given, so it stays
        // writable and the remainder can be pressed again — clearing the error here would
        // also lose a **previous** press's, which no press of this one has repaired.
        if (!result.aborted) setError(result.error);
        // Including the press that wrote everything. `PressReport` draws nothing on a
        // whole success, so a reader who cannot see the rows update has no other way to
        // learn that 40 pages were written.
        announce(pressMessage(result));
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
    byFinding,
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
    //
    // **This store's** events and not both stores' — `ownEvents` above holds why.
    events: ownEvents,
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
