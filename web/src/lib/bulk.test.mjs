import { describe, expect, it } from 'vitest';
import { bulkClear, bulkDismissal } from './bulk.mjs';

/** A repeat as `repeatsInStore()` returns it, narrowed to what this file reads. */
const repeat = (on) => ({
  key: '["nl","copy","oud","nieuw",null]',
  store: 'nl',
  class: 'copy',
  prod: 'oud',
  new: 'nieuw',
  detail: null,
  occurrences: on.length,
  on,
});

const on = (page, id) => ({ page, id, occurrences: 1 });

/**
 * The derivation's answer about each finding, which is what `byFinding` holds.
 *
 * It carried an `anchorHeading` until ticket 114, because the withdrawn bulk press was
 * keyed on one. The heading is still a field on a finding and is still rendered — it is how
 * a difference says where it is — but no press here reads it.
 */
const byFinding = (states) => new Map(
  Object.entries(states).map(([id, state]) => [
    id, { id, state, visibility: 'work', class: 'copy' },
  ]),
);

describe('bulkDismissal', () => {
  it('writes one dismissal per page of the repeat, aimed at that page', () => {
    const { events } = bulkDismissal({
      repeat: repeat([on('overkapping', 'f1'), on('veranda', 'f2')]),
      byFinding: byFinding({ f1: 'open', f2: 'open' }),
      note: 'de footer is bewust anders',
    });

    expect(events).toEqual([
      {
        scope: 'finding',
        action: 'dismissed',
        store: 'nl',
        page: 'overkapping',
        findingId: 'f1',
        note: 'de footer is bewust anders',
      },
      {
        scope: 'finding',
        action: 'dismissed',
        store: 'nl',
        page: 'veranda',
        findingId: 'f2',
        note: 'de footer is bewust anders',
      },
    ]);
  });

  it('says what the press covers before there is a note to press with', () => {
    const decision = bulkDismissal({
      repeat: repeat([on('overkapping', 'f1'), on('veranda', 'f2')]),
      byFinding: byFinding({ f1: 'open', f2: 'open' }),
      note: '   ',
    });

    // The count is stated before the press, so it cannot be read off the events: a
    // dismissal without a note is refused by the SQL constraint, so there are none.
    expect(decision.covers).toBe(2);
    expect(decision.events).toEqual([]);
  });

  it('leaves a finding another editor already decided alone', () => {
    const decision = bulkDismissal({
      repeat: repeat([on('overkapping', 'f1'), on('veranda', 'f2'), on('carport', 'f3')]),
      byFinding: byFinding({ f1: 'open', f2: 'fixed', f3: 'dismissed' }),
      note: 'de footer is bewust anders',
    });

    // The bar must move by exactly the number dismissed and by nothing else. Writing
    // over `fixed` would turn a colleague's claim of fact into this editor's judgement
    // and move nothing in the numerator, which is the one press that changes the log
    // and not the count.
    expect(decision.events.map((event) => event.page)).toEqual(['overkapping']);
    expect(decision.covers).toBe(1);
    expect(decision.decided).toBe(2);
  });
});

/**
 * Ticket 110: the press covers the pages that were ticked, and the seam below the
 * component line is one narrowed list of pages.
 *
 * `selected` is a set of **finding ids** and not of page names. A page name is unique
 * within a repeat, but the id is what a row is keyed on and what an event is aimed at, so
 * keying the selection on it is one lookup fewer between the tick and the write.
 *
 * An absent `selected` still means every page of the repeat. That is not a fallback for
 * the interface — nothing there presses without a selection any more — it is what keeps
 * the twelve tests above about the same functions these are about.
 */
describe('a press narrowed to the ticked pages', () => {
  const three = repeat([on('overkapping', 'f1'), on('veranda', 'f2'), on('carport', 'f3')]);
  const open3 = byFinding({ f1: 'open', f2: 'open', f3: 'open' });

  it('dismisses the ticked pages and no others', () => {
    const decision = bulkDismissal({
      repeat: three,
      byFinding: open3,
      note: 'geen defect',
      selected: new Set(['f1', 'f3']),
    });

    expect(decision.covers).toBe(2);
    expect(decision.events.map((event) => event.page)).toEqual(['overkapping', 'carport']);
  });

  // The second number is counted over the **selection** and not over the repeat: it says
  // how many of the pages this press was aimed at are already decided, so it has to be
  // out of the same total the first number is.
  it('counts the already-decided against the selection, not against the repeat', () => {
    const decision = bulkDismissal({
      repeat: three,
      byFinding: byFinding({ f1: 'open', f2: 'dismissed', f3: 'fixed' }),
      note: 'geen defect',
      selected: new Set(['f1', 'f2']),
    });

    expect(decision.covers).toBe(1);
    expect(decision.decided).toBe(1);
  });

  // The select-all ticks every page since round two, so the press is the only place the
  // rule lives — and these are the states it lets through. `contradicted` is one of them:
  // a colleague claimed it fixed and the re-check disagreed, so it is open work again.
  //
  // A dismissal **skips a colleague's decision and counts it as skipped**. That rule is
  // the dismissal's own: it belonged to the press and never to the comparison with the
  // override ADR 0011 withdrew, which is why it outlived it.
  it('presses on the two states it is offered on and on no others', () => {
    const decision = bulkDismissal({
      repeat: repeat([on('a', 'f1'), on('b', 'f2'), on('c', 'f3'), on('d', 'f4')]),
      byFinding: byFinding({
        f1: 'open', f2: 'contradicted', f3: 'dismissed', f4: 'fixed',
      }),
      note: 'geen defect',
    });

    expect(decision.events.map((event) => event.page)).toEqual(['a', 'b']);
    expect(decision.decided).toBe(2);
  });

  // A finding the log has no answer about reads as open, which is what a search result is
  // before the derivation has caught up with it.
  it('reads a finding it has never heard of as open', () => {
    const decision = bulkDismissal({
      repeat: repeat([on('overkapping', 'f1')]),
      byFinding: new Map(),
      note: 'geen defect',
    });

    expect(decision.covers).toBe(1);
  });

  // An empty set is a selection and not a missing one, so it narrows to nothing. The bar
  // above it is not drawn at all in that state, and this is what makes that safe rather
  // than merely tidy: were it to read as *no selection given*, an editor unticking their
  // last page would arm a press over the whole repeat.
  it('presses nothing at all on an empty selection', () => {
    const empty = new Set();

    expect(bulkDismissal({
      repeat: three, byFinding: open3, note: 'geen defect', selected: empty,
    })).toMatchObject({ covers: 0, decided: 0, events: [] });

    expect(bulkClear({
      repeat: three,
      byFinding: byFinding({ f1: 'dismissed', f2: 'dismissed', f3: 'dismissed' }),
      selected: empty,
    })).toMatchObject({ covers: 0, skipped: 0, events: [] });
  });
});

/**
 * Taking a bulk press back (ticket 110, round two).
 *
 * `OverrideControl.jsx` has offered *Ongedaan maken* on a dismissed finding since
 * ticket 29, and the bulk press offered nothing at all there. If one press can put ten
 * pages in a state, something has to be able to take them out of it — otherwise the bulk
 * tool is a one-way door and the way back is ten pages, which is the work this whole
 * ticket exists to remove.
 */
describe('bulkClear', () => {
  it('clears a dismissal on the finding it was made on', () => {
    const { events } = bulkClear({
      repeat: repeat([on('overkapping', 'f1')]),
      byFinding: new Map([['f1', {
        id: 'f1', state: 'dismissed', class: 'copy', override: { action: 'dismissed' },
      }]]),
    });

    expect(events).toEqual([{
      scope: 'finding', action: 'cleared', store: 'nl', page: 'overkapping', findingId: 'f1',
    }]);
  });

  /**
   * A clearing now only ever revokes a dismissal (ADR 0011), so there is one shape and it
   * is aimed at the finding. The event still comes from `clearedEventFor()` and this press
   * still does not work out the key for itself — the single control asks the same function,
   * and one place is where the next change to a key has to land.
   */
  it('aims at the finding and never at anything wider', () => {
    const { events } = bulkClear({
      repeat: repeat([on('overkapping', 'f1'), on('veranda', 'f2')]),
      byFinding: new Map([
        ['f1', {
          id: 'f1',
          state: 'dismissed',
          class: 'copy',
          anchorHeading: 'Afmetingen',
          override: { action: 'dismissed' },
        }],
        ['f2', { id: 'f2', state: 'dismissed', class: 'copy', override: { action: 'dismissed' } }],
      ]),
    });

    expect(events).toEqual([
      {
        scope: 'finding', action: 'cleared', store: 'nl', page: 'overkapping', findingId: 'f1',
      },
      {
        scope: 'finding', action: 'cleared', store: 'nl', page: 'veranda', findingId: 'f2',
      },
    ]);
    // Neither the class nor the section rides along. No override is keyed on either.
    for (const event of events) {
      expect(event).not.toHaveProperty('class');
      expect(event).not.toHaveProperty('anchorHeading');
    }
  });

  /**
   * Three eligibilities on one selection now, and this is the third. An open page has
   * nothing to undo and a claim of fact is not this control's to take back — `fixed` has
   * its own checkbox on the page, and a second control for one event would let the two
   * disagree about what is on screen. So the count is over the ticked pages this press can
   * act on, the way the other two report theirs.
   */
  it('counts the ticked pages it can act on, and leaves the rest alone', () => {
    const input = {
      repeat: repeat([on('overkapping', 'f1'), on('veranda', 'f2'), on('carport', 'f3')]),
      byFinding: new Map([
        ['f1', { id: 'f1', state: 'dismissed', class: 'copy', override: { action: 'dismissed' } }],
        ['f2', { id: 'f2', state: 'open', class: 'copy', override: null }],
        ['f3', { id: 'f3', state: 'fixed', class: 'copy', override: { action: 'fixed' } }],
      ]),
    };

    expect(bulkClear(input).covers).toBe(1);
    expect(bulkClear({ ...input, selected: new Set(['f2', 'f3']) }))
      .toMatchObject({ covers: 0, events: [] });
  });

  // No note, unlike the other two presses, and the same as the single control it mirrors:
  // a `cleared` event carries no reason. Inventing a mandatory one here would make taking
  // ten decisions back harder than taking one back.
  it('writes without a note, because a cleared event has none to carry', () => {
    const { events } = bulkClear({
      repeat: repeat([on('overkapping', 'f1')]),
      byFinding: new Map([['f1', {
        id: 'f1', state: 'dismissed', class: 'copy', override: { action: 'dismissed' },
      }]]),
    });

    expect(events[0]).not.toHaveProperty('note');
  });
});

/**
 * Ticket 09 and ticket 31 both say it: a bulk write is N **ordinary** events. No
 * site-wide scope, no "repeat" scope — a repeat is a grouping the interface makes and it
 * has no identity to key on — and no new action. The table gains N rows and nothing else.
 */
describe('the vocabulary a bulk press writes in', () => {
  // The two scopes and four actions ADR 0011 left. The withdrawn pair is still *readable* —
  // eleven rows carry it — but nothing here may write one again.
  const SCOPES = ['finding', 'page'];
  const ACTIONS = ['fixed', 'dismissed', 'reviewed', 'cleared'];

  const all = [
    bulkDismissal({
      repeat: repeat([on('overkapping', 'f1'), on('veranda', 'f2')]),
      byFinding: byFinding({ f1: 'open', f2: 'open' }),
      note: 'een reden',
    }),
    bulkClear({
      repeat: repeat([on('overkapping', 'f1'), on('veranda', 'f2')]),
      byFinding: byFinding({ f1: 'dismissed', f2: 'dismissed' }),
    }),
  ].flatMap((decision) => decision.events);

  it('writes nothing outside the scopes the table already has', () => {
    expect(all.length).toBeGreaterThan(0);
    for (const event of all) expect(SCOPES).toContain(event.scope);
  });

  it('writes nothing outside the actions the table already has', () => {
    for (const event of all) expect(ACTIONS).toContain(event.action);
  });

  it('uses only the finding scope and the dismissed action for a bulk dismissal', () => {
    const { events } = bulkDismissal({
      repeat: repeat([on('overkapping', 'f1'), on('veranda', 'f2')]),
      byFinding: byFinding({ f1: 'open', f2: 'open' }),
      note: 'een reden',
    });

    expect(new Set(events.map((event) => event.scope))).toEqual(new Set(['finding']));
    expect(new Set(events.map((event) => event.action))).toEqual(new Set(['dismissed']));
  });

  it('gives every row its own note, so attribution and reason are per row', () => {
    const { events } = bulkDismissal({
      repeat: repeat([on('overkapping', 'f1'), on('veranda', 'f2')]),
      byFinding: byFinding({ f1: 'open', f2: 'open' }),
      note: '  een reden  ',
    });

    // The editor is added by the hook, per event, which is what makes attribution
    // per row rather than per press. The note is trimmed once and copied.
    expect(events.every((event) => event.note === 'een reden')).toBe(true);
  });
});
