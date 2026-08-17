import { clearedEventFor } from '../../../overrides/state.mjs';

/**
 * What one press on a repeat row would write, and what it covers (ticket 31).
 *
 * A repeat is a grouping and never a finding, so a decision on one is N decisions on N
 * findings. This file builds those N events and counts what they touch, so the sentence
 * above the button and the events behind it cannot drift apart.
 *
 * There were **three** presses here until ADR 0011. The second judgement, keyed on a class
 * in a section rather than on a finding, went with the action it wrote — and so did the rule
 * naming which pages refused it. A dismissal and a clearing are what a press can now be.
 */

/**
 * The N dismissals of one repeat.
 *
 * @param {object} input
 * @param {import('./view.mjs').Repeat} input.repeat
 * @param {Map<string, { state: string }>} input.byFinding  The derivation's answer per id.
 * @param {string} input.note  Mandatory: the SQL constraint refuses a dismissal without
 *   one, and one note copied to all N rows is the correct shape.
 * @param {Set<string>} [input.selected]  The ticked pages, as finding ids (ticket 110).
 */
export function bulkDismissal({ repeat, byFinding, note, selected }) {
  const reason = note.trim();
  const chosen = ticked(repeat, selected);

  // The findings this press is allowed to touch: the two states the single control
  // offers *Negeren…* on, and no others. A finding a colleague dismissed or claimed
  // fixed keeps their decision, and is counted as skipped — the bar has to move by
  // exactly the number dismissed and by nothing else, and overwriting a `fixed` claim
  // would turn a claim of fact into somebody else's judgement while moving no number at
  // all. That rule is the dismissal's own and never a comparison with anything wider.
  const on = chosen.filter((entry) => offersDismissal(byFinding.get(entry.id)));

  // Counted off the repeat and never off the events: the interface states the size
  // **before** the press, and until a reason is typed there are no events to count.
  // The store comes off the **entry** and never off the repeat (ticket 03). A repeat may
  // span the two stores of one language block, so there is no single store to take it
  // from — and taking one would file the sibling's event under this store, where that
  // finding id does not exist. Only the **judgement** travels: this is the dismissal, and
  // a fix claim has no bulk press at all, because correcting one store's page does not
  // correct the other's.
  const events = reason
    ? on.map((entry) => ({
        scope: 'finding',
        action: 'dismissed',
        store: entry.store,
        page: entry.page,
        findingId: entry.id,
        note: reason,
      }))
    : [];

  // Both numbers over the **selection**: *4 pages of the 6* is a sentence about the
  // press that is about to be made, and taking its total off the repeat would report a
  // remainder the press was never aimed at.
  return { covers: on.length, decided: chosen.length - on.length, stores: storesOf(on), events };
}

/**
 * The N annotations of the ticked pages (ticket 83).
 *
 * It **reuses the selection seam** the two presses above sit on rather than adding a second
 * one, and takes the difference the ticket forced: a priority and a note annotate the
 * **page**, so the selection is a set of `store/page` keys and not of finding ids. There is
 * no finding to key on here, and no eligibility to ask about either — a page an editor
 * ticked takes the value, whatever anybody decided about the findings on it.
 *
 * The event is built by the caller through `priorityEventFor()` / `noteEventFor()`, so the
 * value is validated once, in one place, and this function stays the thing that spreads one
 * decision over N pages. It carries **one number** and not two: the presses above skip a
 * colleague's decision and have to report what they left alone, and this one skips nothing.
 *
 * @param {object} input
 * @param {{ store: string, page: string }[]} input.pages  The list under the selection.
 * @param {Set<string>} input.selected  The ticked pages, as `store/page`.
 * @param {{ scope: string, action: string }} input.event  One built annotation event.
 */
export function bulkAnnotation({ pages, selected, event }) {
  const chosen = pages.filter((page) => selected.has(`${page.store}/${page.page}`));

  // Each event carries its own store and page: `appendEach()` reports `failedOn` as the
  // event's page, and the hook adds the editor per event, so attribution and the failure
  // report are both per row rather than per press.
  const events = chosen.map((page) => ({ store: page.store, page: page.page, ...event }));

  return { covers: chosen.length, events };
}

/**
 * The pages a press is aimed at: the ticked ones (ticket 110).
 *
 * The selection is a set of **finding ids** and not of page names. A page name is unique
 * within a repeat, so either would identify a row, but the id is what the row is keyed on
 * and what the event is aimed at — keying on it puts no lookup between the tick and the
 * write.
 *
 * No selection means every page. Nothing in the interface presses without one since
 * ticket 110, so this is not a fallback an editor can reach: it is what lets a caller
 * that has no selection to make — a test, a future caller with a whole repeat in hand —
 * ask the same question of the same function.
 */
const ticked = (repeat, selected) =>
  selected ? repeat.on.filter((entry) => selected.has(entry.id)) : repeat.on;

/**
 * The states a dismissal is offered on, which are `OverrideControl.jsx`'s two. An
 * absent finding reads as `open`, the way a search result reads one the log has not
 * decided.
 */
const OFFERED = new Set(['open', 'contradicted']);

/**
 * Whether a dismissal is offered on one finding — the rule above, asked about a single one.
 *
 * It was exported for the select-all in round one of ticket 110, which ticked only the
 * pages this press could act on. Round two ticks every page, so the rule has one reader
 * again: the press. A tick says *this page*; what the press does with it, the press says.
 *
 * @param {{ state?: string } | undefined} finding  The derivation's answer, or none.
 */
const offersDismissal = (finding) => OFFERED.has(finding?.state ?? 'open');

/**
 * The N clearings of the pages one repeat is on (ticket 110, round two).
 *
 * The word is **cleared** and not *undo*: `CONTEXT.md` gives that one action the job of
 * revoking the last override on a key, and it says there are no `un-` words. The button an
 * editor presses says *Clear*, which is the same word the single control has worn
 * since ticket 29 — the Dutch label and the vocabulary are two different things.
 *
 * The event itself comes from `clearedEventFor()`, beside the derivation that decided the
 * finding. This press does not work out which key to aim at and must not learn: the single
 * control asks the same function, so the two cannot come to disagree.
 *
 * @param {object} input
 * @param {import('./view.mjs').Repeat} input.repeat
 * @param {Map<string, { state: string, class: string, override?: object }>} input.byFinding
 * @param {Set<string>} [input.selected]  The ticked pages, as finding ids.
 */
export function bulkClear({ repeat, byFinding, selected }) {
  const chosen = ticked(repeat, selected);
  const on = chosen.filter((entry) => offersClear(byFinding.get(entry.id)));

  // Per entry, for the reason the dismissal states: the selection is one, and a block-
  // spanning one has two stores in it. The clearing inherits the widening rather than
  // opting into it — that is what "one selection, two eligibilities" means.
  const events = on.map((entry) => ({
    store: entry.store,
    page: entry.page,
    ...clearedEventFor(byFinding.get(entry.id)),
  }));

  // Both numbers over the **selection**, the way the dismissal states its two: a ticked
  // page this press leaves alone is a page the editor aimed at and did not hit, and the
  // gap between the count on the strip and the count on the button is not self-evident.
  return { covers: on.length, skipped: chosen.length - on.length, stores: storesOf(on), events };
}

/**
 * The stores a press will write in, said before it is made (ticket 03).
 *
 * It is off the entries this press **can act on** and never off the repeat's own `stores`,
 * and that is the ticket's *80% is not 100%* trap answered in one line: a selection whose
 * sibling page a colleague already dismissed writes in one store, and a sentence naming
 * two would imply the block is being decided when a fifth of it is not.
 *
 * It is derived here and not in the bar, for this file's own reason: the sentence above the
 * button and the events behind it come off one array. Like `covers`, it is over the
 * eligible entries rather than the events, so it is true before a reason has been typed.
 */
const storesOf = (on) => [...new Set(on.map((entry) => entry.store))].sort();

/**
 * The one state a clearing is offered on, which is `OverrideControl.jsx`'s one.
 *
 * `fixed` is not among them, and that is the same refusal the single control makes: a
 * claim of fact has its own checkbox, and a second control for one event would let the two
 * disagree about what is on screen. It was a set of two until ADR 0011 withdrew the second
 * judgement; a clearing now only ever revokes a dismissal, and it stays a set because the
 * question this asks — *is this state clearable* — is the one the control asks too.
 */
const CLEARABLE = new Set(['dismissed']);

const offersClear = (finding) => CLEARABLE.has(finding?.state);
