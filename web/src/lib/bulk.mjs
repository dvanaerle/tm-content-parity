import { clearedEventFor, muteCoverage } from '../../../overrides/state.mjs';

/**
 * What one press on a repeat row would write, and what it covers (ticket 31).
 *
 * A repeat is a grouping and never a finding, so a decision on one is N decisions on N
 * findings. This file builds those N events and counts what they touch, so the sentence
 * above the button and the events behind it cannot drift apart — the bargain `mute.mjs`
 * already strikes for a single mute.
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
  // offers *Negeren…* on, and no others. A finding a colleague dismissed, muted or
  // claimed fixed keeps their decision — the bar has to move by exactly the number
  // dismissed and by nothing else, and overwriting a `fixed` claim would turn a claim
  // of fact into somebody else's judgement while moving no number at all.
  const on = chosen.filter((entry) => offersDismissal(byFinding.get(entry.id)));

  // Counted off the repeat and never off the events: the interface states the size
  // **before** the press, and until a reason is typed there are no events to count.
  const events = reason
    ? on.map((entry) => ({
      scope: 'finding',
      action: 'dismissed',
      store: repeat.store,
      page: entry.page,
      findingId: entry.id,
      note: reason,
    }))
    : [];

  // Both numbers over the **selection**: *4 pagina's van de 6* is a sentence about the
  // press that is about to be made, and taking its total off the repeat would report a
  // remainder the press was never aimed at.
  return { covers: on.length, decided: chosen.length - on.length, events };
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
const ticked = (repeat, selected) => (
  selected ? repeat.on.filter((entry) => selected.has(entry.id)) : repeat.on
);

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
 * The N mutes of the pages one repeat is on.
 *
 * **A different selection unit from the dismissal above, and the difference is the
 * point.** A dismissal is a judgement about two exact strings and it expires when either
 * changes; a mute is a judgement about a class in one section of one page and it never
 * expires. So this writes `page-class` events keyed on the class and the anchor heading,
 * and it hides more than the difference the editor was looking at — everything of that
 * class in that section, which is why the count it reports is its own and not the
 * repeat's.
 *
 * @param {object} input
 * @param {import('./view.mjs').Repeat} input.repeat
 * @param {Map<string, { anchorHeading?: string | null }>} input.byFinding
 * @param {Map<string, any[]>} input.findingsByPage  Every derived finding per page, keyed
 *   `store/page` the way `log.byPage` is — a page name is unique within a store and not
 *   across six of them. It is what the coverage of a mute is counted over: ADR 0008 has
 *   the count computed before the press, on the snapshot in front of the editor.
 * @param {string} input.note
 * @param {Set<string>} [input.selected]  The ticked pages, as finding ids (ticket 110).
 */
export function bulkMute({ repeat, byFinding, findingsByPage, note, selected }) {
  const reason = note.trim();
  const chosen = ticked(repeat, selected);

  // `anchorHeading` is read off the derivation, which is the same snapshot the coverage
  // is counted over, so the section on the button and the section in the event cannot
  // disagree. A finding the derivation does not hold is `undefined` here and stays
  // `undefined`: *I do not know which section this is* and *this is the content before
  // the first heading* are two different answers, and `?? null` would merge them.
  const on = chosen.map((entry) => ({
    page: entry.page,
    anchorHeading: byFinding.get(entry.id)?.anchorHeading,
  }));

  const unknown = on.filter((entry) => entry.anchorHeading === undefined);
  // Campaign copy carries a null anchor heading — every one of the 1,645 banner findings
  // does — so a bulk mute of the null section would hide that section on hundreds of
  // pages and take every unrelated finding in it along. A single mute may still be
  // pressed on such a page, on the page itself, where one section is in front of the
  // editor. Ticket 90 owns campaign copy.
  const headless = on.filter((entry) => entry.anchorHeading === null);

  const offered = unknown.length === 0 && headless.length === 0;
  const refusal = refusalFor({ unknown, headless, pages: on.length });

  const events = offered && reason
    ? on.map((entry) => ({
      scope: 'page-class',
      action: 'muted',
      store: repeat.store,
      page: entry.page,
      class: repeat.class,
      anchorHeading: entry.anchorHeading,
      note: reason,
    }))
    : [];

  // What the press hides, counted on the snapshot in front of the editor and per page,
  // through the same function a single mute's button uses. It is a **ceiling** and it
  // never understates: `muteCoverage()` counts what the key covers and not what it
  // changes, so a finding already dismissed is in this number.
  const covers = on.reduce((sum, entry) => sum + muteCoverage(
    findingsByPage.get(`${repeat.store}/${entry.page}`) ?? [],
    { class: repeat.class, anchorHeading: entry.anchorHeading },
  ), 0);

  return {
    offered,
    refusal,
    covers,
    pages: on.length,
    /**
     * The findings of the difference itself, so the gap between the two is readable. Over
     * the ticked pages, like everything beside it: an unticked page is neither hidden by
     * this press nor counted by it, and leaving it in this half alone would shrink the
     * very gap the sentence exists to show.
     */
    difference: on.length,
    /** The sections named, so the press says where it lands and not only how much. */
    sections: [...new Set(on.map((entry) => entry.anchorHeading))],
    events,
  };
}

/**
 * The N clearings of the pages one repeat is on (ticket 110, round two).
 *
 * The word is **cleared** and not *undo*: `CONTEXT.md` gives that one action the job of
 * revoking the last override on a key, and it says there are no `un-` words. The button an
 * editor presses says *Ongedaan maken*, which is the same word the single control has worn
 * since ticket 29 — the Dutch label and the vocabulary are two different things.
 *
 * The event itself comes from `clearedEventFor()`, beside the derivation that attached the
 * key. This press does not know how a mute is cleared and must not learn: the single
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

  const events = on.map((entry) => ({
    store: repeat.store,
    page: entry.page,
    ...clearedEventFor(byFinding.get(entry.id)),
  }));

  // Both numbers over the **selection**, the way the dismissal states its two: a ticked
  // page this press leaves alone is a page the editor aimed at and did not hit, and the
  // gap between the count on the strip and the count on the button is not self-evident.
  return { covers: on.length, skipped: chosen.length - on.length, events };
}

/**
 * The two states a clearing is offered on, which are `OverrideControl.jsx`'s two.
 *
 * `fixed` is not among them, and that is the same refusal the single control makes: a
 * claim of fact has its own checkbox, and a second control for one event would let the two
 * disagree about what is on screen.
 */
const CLEARABLE = new Set(['dismissed', 'muted']);

const offersClear = (finding) => CLEARABLE.has(finding?.state);

/**
 * The pages of a repeat a bulk mute cannot be pressed on, and **why** (ticket 110).
 *
 * `bulkMute()` already refuses those pages and says how many there are; this names them,
 * so the page list can mark the rows and *untick the ones that refuse* is a thing an
 * editor can see rather than work out. One rule, asked twice, and never written twice: a
 * second copy of *which heading is mutable* would be the copy that ages.
 *
 * The reason travels with the row because the two obstacles are two different answers and
 * call for different work — `refusalFor()` below spends two sentences on exactly that — so
 * a mark that said one thing for both would tell one of the two rows something untrue.
 *
 * It is asked over the whole repeat and not over a selection, because the mark belongs to
 * a row of the list and the row is drawn whether it is ticked or not. It is keyed on the
 * finding id, like the selection it is drawn beside: one row, one identity.
 *
 * @param {{ repeat: import('./view.mjs').Repeat, byFinding: Map<string, { anchorHeading?: string | null }> }} input
 * @returns {Map<string, 'unknown' | 'headless'>} By finding id, for the refusing rows only.
 */
export function refusesMute({ repeat, byFinding }) {
  return new Map(repeat.on
    .map((entry) => [entry.id, refusalOn(byFinding.get(entry.id)?.anchorHeading)])
    .filter(([, reason]) => reason !== null));
}

/**
 * Why one page refuses a bulk mute, or `null` when it does not.
 *
 * `undefined` is *I do not know which section this is* and `null` is *this is before the
 * first heading*: two different answers, two different refusals, and neither of them is a
 * section to mute.
 */
const refusalOn = (anchorHeading) => {
  if (anchorHeading === undefined) return 'unknown';
  if (anchorHeading === null) return 'headless';
  return null;
};

/**
 * Why a bulk mute is not offered, in the words that name the actual obstacle.
 *
 * Two obstacles and two sentences, because they call for different work. An unknown
 * section means the screen is older than the log and a reload answers it; a null
 * section means the difference genuinely sits before the first heading, and muting
 * there is a judgement to make one page at a time.
 */
function refusalFor({ unknown, headless, pages }) {
  if (unknown.length > 0) {
    return `Van ${unknown.length} van deze ${pages} pagina's is niet bekend onder welk `
      + 'kopje dit verschil staat — deze lijst is ouder dan het logboek. Herlaad de '
      + 'pagina, of demp per pagina op de pagina zelf.';
  }

  if (headless.length > 0) {
    return `${headless.length} van deze ${pages} pagina's draagt dit verschil in de inhoud `
      + 'vóór de eerste kop. Daar dempt dit niet één sectie maar alles wat vóór de eerste '
      + 'kop staat, op elke pagina. Demp dat per pagina, op de pagina zelf.';
  }

  return null;
}
