/**
 * N events, one press (ticket 31).
 *
 * An editor decides once about a difference that is on many pages, and the log records
 * one decision **per finding**. There is no bulk scope and there is no repeat scope: a
 * repeat is a grouping the interface makes, it has no identity to key on, and ticket 09
 * is explicit that a bulk write is N page-scoped events. So this file writes N ordinary
 * events and adds nothing to the vocabulary.
 *
 * It is here rather than in the browser's hook because it is a rule about the log and
 * not about a screen, and because it is then testable against a fake port with no
 * Supabase project — which is the one thing `supabase.mjs` cannot offer.
 */

/**
 * What one press did, which is the one shape every bulk bar reports and every caller of
 * this seam receives.
 *
 * @typedef {object} PressReport
 * @property {any[]} stored  The rows the log assigned ids to, in the order it took them.
 * @property {number} written
 * @property {number} total
 * @property {string | null} stoppedOn  The **page** of the first event that was not
 *   written — the one the editor is looking at, whether the log refused it or the run was
 *   stopped before it.
 * @property {boolean} aborted  Which of those two it was. Only a refusal carries an
 *   `error`, and only a stop leaves a log that will still take the remainder.
 * @property {string | null} error
 */

/**
 * Write the events one at a time, saying how far it has got and stopping when asked.
 *
 * **Sequential, and that is the design.** `Promise.all` would fire several hundred
 * inserts at a log that may already be refusing, and `Promise.allSettled` would report
 * a scatter of holes rather than a number an editor can read. One at a time gives the
 * only report that is honest in one sentence — *23 of 30 saved, it stopped at
 * `overkapping`* — and it leaves the log alone as soon as it complains.
 *
 * The same loop is what makes the run **watchable and stoppable** (ticket 139). A press
 * on 329 pages is a wait with nothing to read and no way out unless the one thing that
 * knows how far it has got says so, so it reports after every written row and reads the
 * signal before every unwritten one. The check is between events and never inside one:
 * the insert in flight is finished, so a stopped run leaves whole events behind it, and
 * nothing is retried.
 *
 * Nothing is rolled back — on a refusal or on a stop. The table is append-only by design
 * (`CONTEXT.md`), so the 23 that were written are decisions that were made, and the
 * interface says so instead of pretending the press did not happen.
 *
 * @param {{ appendEvent: (event: any) => Promise<any> }} port
 * @param {any[]} events  Each one carries its own `store`, `page` and `editor`.
 * @param {object} [watching]
 * @param {(step: { written: number, total: number }) => void} [watching.onProgress]  Called
 *   after every row the log accepted, and never for one it has not.
 * @param {{ aborted: boolean } | null} [watching.signal]  Read before every event.
 * @returns {Promise<PressReport>}
 */
export async function appendEach(port, events, { onProgress, signal } = {}) {
  /** @type {any[]} */
  const stored = [];

  /** @param {{ stoppedOn: string | null, aborted: boolean, error: string | null }} how */
  const report = (how) => ({ stored, written: stored.length, total: events.length, ...how });

  for (const event of events) {
    if (signal?.aborted) return report({ stoppedOn: event.page, aborted: true, error: null });

    try {
      stored.push(await port.appendEvent(event));
    } catch (failure) {
      return report({
        stoppedOn: event.page,
        aborted: false,
        error: /** @type {Error} */ (failure).message,
      });
    }

    onProgress?.({ written: stored.length, total: events.length });
  }

  return report({ stoppedOn: null, aborted: false, error: null });
}
