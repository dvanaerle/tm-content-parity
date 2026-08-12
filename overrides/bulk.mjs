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
 * Write the events one at a time, and stop at the first refusal.
 *
 * **Sequential, and that is the design.** `Promise.all` would fire several hundred
 * inserts at a log that may already be refusing, and `Promise.allSettled` would report
 * a scatter of holes rather than a number an editor can read. One at a time gives the
 * only report that is honest in one sentence — *23 of 30 saved, it stopped at
 * `overkapping`* — and it leaves the log alone as soon as it complains.
 *
 * Nothing is rolled back. The table is append-only by design (`CONTEXT.md`), so the 23
 * that were written are decisions that were made, and the interface says so instead of
 * pretending the press did not happen.
 *
 * @param {{ appendEvent: (event: any) => Promise<any> }} port
 * @param {any[]} events  Each one carries its own `store`, `page` and `editor`.
 * @returns {Promise<{
 *   stored: any[], written: number, total: number,
 *   failedOn: string | null, error: string | null,
 * }>} `failedOn` is the **page** of the event that was refused, which is what the
 *   editor is looking at. `stored` holds the rows the log assigned ids to.
 */
export async function appendEach(port, events) {
  /** @type {any[]} */
  const stored = [];

  for (const event of events) {
    try {
      stored.push(await port.appendEvent(event));
    } catch (failure) {
      return {
        stored,
        written: stored.length,
        total: events.length,
        failedOn: event.page,
        error: /** @type {Error} */ (failure).message,
      };
    }
  }

  return { stored, written: stored.length, total: events.length, failedOn: null, error: null };
}
