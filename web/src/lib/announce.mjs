/**
 * The one live region: what a reader who cannot see the screen is told happened.
 *
 * Nothing in this interface was announced before ticket 03 of the polish pass. A bulk
 * decision over 40 pages, a re-check that failed and a log gone read-only were all
 * silent — the screen said so and the screen was the only thing that did.
 *
 * **One region, and not one per surface.** That is ADR 0019's trap and it is the reason
 * this module exists at all: several regions announcing at once is worse than none,
 * because a screen reader interleaves them and the editor hears fragments. A page here is
 * several Astro islands — the page view, the dashboard, the search — each its own React
 * root, so a component rendering `aria-live` would give a page as many regions as it has
 * islands that had something to say. The region is therefore a plain node on `document.body`,
 * made the first time anything is announced, and there is exactly one of it per document
 * whichever island speaks.
 *
 * **It announces outcomes and never progress.** *Saving…* is already on the button that
 * was pressed; the thing a person needs to hear is whether it worked.
 */

/**
 * `role="status"` as well as `aria-live="polite"`, which is not a belt-and-braces pair:
 * the role is what several screen readers map their announcement handling off, and the
 * attribute is what the rest read. `aria-atomic` so the sentence is read whole rather
 * than as the words that changed.
 */
const REGION = {
  id: 'announcements',
  role: 'status',
  'aria-live': 'polite',
  'aria-atomic': 'true',
};

/**
 * Off-screen and not hidden. `display: none` and `visibility: hidden` take a node out of
 * the accessibility tree, which would make this region silent — the classic way to ship a
 * live region that announces nothing. This is the same clip-rect `sr-only` draws, written
 * out here because the node is made in script and never passes through Tailwind.
 */
const OFF_SCREEN =
  'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;' +
  'clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0';

function region() {
  const held = document.getElementById(REGION.id);
  if (held) return held;

  const made = document.createElement('p');
  for (const [name, value] of Object.entries(REGION)) made.setAttribute(name, value);
  made.setAttribute('style', OFF_SCREEN);
  document.body.append(made);
  return made;
}

/**
 * Say one outcome out loud.
 *
 * The region is **cleared and then written on the next turn**, because setting the same
 * text a second time is not a mutation and a screen reader would say nothing. Two
 * decisions saved in a row is the ordinary case and the two outcomes are the same
 * sentence, so an announcement that only fired on a change would go quiet exactly when an
 * editor is working fastest.
 *
 * @param {string} message  What happened, in the past tense. Never what is happening.
 */
export function announce(message) {
  if (!message) return;
  const node = region();
  node.textContent = '';
  setTimeout(() => {
    node.textContent = message;
  }, 0);
}

/**
 * The one word each decision is announced by, keyed on the log's own action.
 *
 * The vocabulary is `overrides/state.mjs`'s and it is not restated: these are sentences
 * *about* an action, in the past tense, because a live region says what happened. The two
 * actions that can also take a value away — a priority and a note — are not in the table,
 * because their sentence turns on the value rather than on the action.
 *
 * @type {Record<string, string>}
 */
const SAID = {
  fixed: 'Saved: this difference is fixed.',
  dismissed: 'Saved: this difference is dismissed.',
  cleared: 'Saved: the decision is cleared.',
  reviewed: 'Saved: this page is reviewed.',
};

/**
 * What one stored decision is announced as.
 *
 * **A decision's** wording lives here and not at the six controls that make one, because
 * six controls is six chances to word one outcome differently and the seventh would be
 * silent. It is pure, so the words are checkable without a browser.
 *
 * It is not a claim on every sentence this region says. A failed write, a re-check and a
 * log gone read-only are each one condition owned by one surface, and each says its own
 * sentence where that condition is known — the split `log-read.mjs` already draws when it
 * says the state is read once and *what each reader then says is still its own*.
 *
 * @param {{ action?: string, priority?: string | null, note?: string }} event  The event
 *   that was appended, as the surface aimed it.
 * @returns {string}
 */
export function savedMessage({ action, priority = null, note = '' }) {
  if (action === 'prioritised') {
    return priority
      ? `Saved: the priority of this page is ${priority}.`
      : 'Saved: this page has no priority.';
  }
  if (action === 'noted') {
    return note.trim() ? 'Saved: the note on this page.' : 'Saved: this page has no note.';
  }
  // A decision the table does not hold is still a decision that was stored, and silence
  // about it would be worse than a plain word. This is the same fallback `classInfo()`
  // makes for a class the vocabulary does not carry.
  return SAID[action] ?? 'Saved.';
}

/**
 * What one bulk press is announced as.
 *
 * It says the **count that was written** first, whether or not anything failed, because
 * that is the number an editor needs either way — and a press that wrote everything says so.
 * The screen used to imply that only by the report not appearing; since ui-polish 05 it says
 * it too, and it says it by drawing **this** sentence, so the heard and the seen outcome are
 * one string rather than two that agree today.
 *
 * The shortfall half is `PressReport.jsx`'s sentence said shorter: a live region is heard
 * once and cannot be re-read, so what is left out is the part a reader can go and look at.
 *
 * @param {import('../../../overrides/bulk.mjs').PressReport} report
 * @returns {string}
 */
export function pressMessage({ written, total, stoppedOn = null, error = null }) {
  const pages = (count) => `${count} ${count === 1 ? 'page' : 'pages'}`;
  if (written === total && !error) return `Saved on ${pages(total)}.`;

  const where = stoppedOn ? `It stopped on ${stoppedOn}.` : 'Nothing is written.';
  return `Saved on ${written} of ${pages(total)}. ${where}${error ? ` ${error}` : ''}`;
}
