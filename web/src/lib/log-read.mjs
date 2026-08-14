/**
 * One read of the override log, named once.
 *
 * The hooks in `overrides.mjs` hand out five fields about the log they opened — `events`,
 * `ready`, `error`, `connected` and `notConnectedReason` — and three readers used to
 * cascade over them separately: the banner at the top of the screen, the sentence a bulk
 * control shows in place of its buttons, and the notes half of a search. Three cascades
 * over one type, in three orders and three vocabularies, is the drift this module exists
 * to stop: they disagreed about whether *the log did not answer* and *there is no
 * connection to the log* are one thing or two, and about which of them wins when both are
 * true.
 *
 * So the five fields are read here, once, and what comes back is a **state and a reason**.
 * What each reader then *says* is still its own: the banner names whose fault it is,
 * because that is what the top of a screen is for, and `searchNotes()` collapses the two
 * failures into one, because down there the truth about the notes half is the same either
 * way — there is no log to read.
 *
 * It is a `web/` module rather than a shared one because the four flags are the browser's:
 * they describe a fetch a hook made, and nothing in `overrides/` has ever heard of them.
 * It is pure and holds no React, so `search.mjs` can read it without pulling a renderer
 * into the node suite.
 *
 * @param {object} log The store page's or the page view's read of the log.
 * @param {boolean} log.ready Whether a read has succeeded. Not *whether it is current*: a
 *   later write can fail over a good read, which is the one combination both readers turn
 *   on, so this rides beside the state rather than being folded into it.
 * @param {string | null} [log.error]
 * @param {boolean} [log.connected]
 * @param {string | null} [log.notConnectedReason]
 * @returns {{
 *   state: 'read' | 'reading' | 'failed' | 'disconnected',
 *   ready: boolean,
 *   reason: string | null,
 * }}
 */
export function logState({ ready, error = null, connected = true, notConnectedReason = null }) {
  // The order is `LogBanner`'s, which is the reader that has had to be right about this
  // since ticket 13: a log that answered with an error is a failure whatever the
  // connection says, and an unconfigured project cannot fail because it never asked.
  if (error) return { state: 'failed', ready, reason: error };
  if (!connected) return { state: 'disconnected', ready, reason: notConnectedReason };
  if (!ready) return { state: 'reading', ready, reason: null };
  return { state: 'read', ready, reason: null };
}
