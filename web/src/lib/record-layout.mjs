/**
 * The browser's side of the record layout (ticket 08).
 *
 * It is the shape `overrides.mjs` has, for the reasons that file gives: the derivation
 * (`overrides/record-layout.mjs`) is pure and knows nothing about this file, the port
 * (`overrides/record-layout-supabase.mjs`) is created here and passed nowhere, and the two
 * rules of spec 29 hold unchanged.
 *
 * - **A failed read is never an empty list.** `events` stays `null` until a read succeeds.
 *   An empty list means the grid has never been read, and that answer makes the whole
 *   complement grant nothing — so a network error saying it would be a network error that
 *   silently withdrew every permission the log has.
 * - **A failed write goes read-only rather than dropping the press.** There is no optimistic
 *   update: the event is stored, and only then does it enter the list.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { recordLayoutFrom } from '../../../overrides/record-layout.mjs';
import { createRecordLayoutPort } from '../../../overrides/record-layout-supabase.mjs';

/** @typedef {import('../../../overrides/record-layout.mjs').RecordLayout} RecordLayout */

/** The layout of a log nobody has read yet, so that no caller has to test for `null`. */
const NOTHING = /** @type {RecordLayout} */ ({ notShared: [], takenOn: null, readings: [] });

/**
 * The port, or `null` where the project is not configured — a clone with no `.env` reads the
 * log and cannot write to it, which is the behaviour the override hook already has.
 */
function portOrNull() {
  try {
    return createRecordLayoutPort({
      url: import.meta.env.PUBLIC_SUPABASE_URL,
      anonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    });
  } catch {
    return null;
  }
}

/**
 * The record layout as the screen reads it, and one way to add to it.
 *
 * @param {object} input
 * @param {string} input.editor The name from `localStorage`. Without one there is no write.
 */
export function useRecordLayout({ editor }) {
  const port = useMemo(portOrNull, []);
  /** @type {[import('../../../overrides/record-layout.mjs').RecordLayoutEvent[] | null, Function]} */
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!port) return;
    let live = true;
    port
      .readEvents()
      .then((rows) => live && setEvents(rows))
      .catch((cause) => live && setError(String(cause?.message ?? cause)));
    return () => {
      live = false;
    };
  }, [port]);

  /**
   * Write one event and take it into the list. It answers whether it wrote, so the form
   * knows whether to clear itself — a form that emptied on a failed write would have thrown
   * away what the editor typed and told them nothing.
   *
   * @param {Record<string, unknown>} event
   * @returns {Promise<boolean>}
   */
  const append = useCallback(
    async (event) => {
      if (!port || !editor) return false;
      setBusy(true);
      try {
        const stored = await port.appendEvent(event, editor);
        setEvents((rows) => [...(rows ?? []), stored]);
        return true;
      } catch (cause) {
        setError(String(cause?.message ?? cause));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [port, editor],
  );

  const layout = useMemo(() => (events ? recordLayoutFrom(events) : NOTHING), [events]);

  return {
    layout,
    append,
    /** `true` only once a read has succeeded. A screen must not draw an empty list before. */
    read: events !== null,
    error,
    busy,
    canWrite: Boolean(port) && Boolean(editor) && events !== null && !error,
  };
}
