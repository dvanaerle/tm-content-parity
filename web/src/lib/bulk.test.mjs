import { describe, expect, it } from 'vitest';
import { bulkAnnotation, bulkClear, bulkDismissal } from './bulk.mjs';
import { noteEventFor, priorityEventFor } from '../../../overrides/state.mjs';

/**
 * A repeat as `repeatsInStore()` returns it, narrowed to what this file reads.
 *
 * `stores` is derived from the entries here exactly as the derivation derives it, because
 * a fixture that could name a store its own entries are not on would let these tests pass
 * a shape the real function never produces.
 */
const repeat = (on) => ({
  key: '["nl","copy","oud","nieuw",null]',
  stores: [...new Set(on.map((entry) => entry.store))].sort(),
  class: 'copy',
  prod: 'oud',
  new: 'nieuw',
  detail: null,
  occurrences: on.length,
  on,
});

/** One page of a repeat. The store defaults to `nl`, so the store-scoped tests read as they did. */
const on = (page, id, store = 'nl') => ({ store, page, id, occurrences: 1 });

/**
 * The derivation's answer about each finding, which is what `byFinding` holds.
 *
 * It carried an `anchorHeading` until ticket 114, because the withdrawn bulk press was
 * keyed on one. The heading is still a field on a finding and is still rendered — it is how
 * a difference says where it is — but no press here reads it.
 */
const byFinding = (states) =>
  new Map(
    Object.entries(states).map(([id, state]) => [
      id,
      { id, state, visibility: 'work', class: 'copy' },
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

  it('writes each event under the store of its own page, across a block', () => {
    // Ticket 03's whole want: one press, and the events for both stores of the block.
    // The store comes off the **entry** and never off the repeat, because a repeat that
    // spans `nl` and `be` has no single store to take it from — and reading one would
    // file `be`'s event under `nl`, where its finding id does not exist.
    const { events } = bulkDismissal({
      repeat: repeat([on('afhalen', 'f1'), on('afhalen', 'f2', 'be')]),
      byFinding: byFinding({ f1: 'open', f2: 'open' }),
      note: 'het telefoonnummer hoort te verschillen',
    });

    expect(events.map((event) => [event.store, event.page, event.findingId])).toEqual([
      ['nl', 'afhalen', 'f1'],
      ['be', 'afhalen', 'f2'],
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
    // The stores are stated before the press for the same reason and off the same array,
    // so *how many, and where* is one answer with no events behind it yet (ticket 03).
    expect(decision.stores).toEqual(['nl']);
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
        f1: 'open',
        f2: 'contradicted',
        f3: 'dismissed',
        f4: 'fixed',
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

    expect(
      bulkDismissal({
        repeat: three,
        byFinding: open3,
        note: 'geen defect',
        selected: empty,
      }),
    ).toMatchObject({ covers: 0, decided: 0, events: [] });

    expect(
      bulkClear({
        repeat: three,
        byFinding: byFinding({ f1: 'dismissed', f2: 'dismissed', f3: 'dismissed' }),
        selected: empty,
      }),
    ).toMatchObject({ covers: 0, skipped: 0, events: [] });
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
      byFinding: new Map([
        [
          'f1',
          {
            id: 'f1',
            state: 'dismissed',
            class: 'copy',
            override: { action: 'dismissed' },
          },
        ],
      ]),
    });

    expect(events).toEqual([
      {
        scope: 'finding',
        action: 'cleared',
        store: 'nl',
        page: 'overkapping',
        findingId: 'f1',
      },
    ]);
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
        [
          'f1',
          {
            id: 'f1',
            state: 'dismissed',
            class: 'copy',
            anchorHeading: 'Afmetingen',
            override: { action: 'dismissed' },
          },
        ],
        ['f2', { id: 'f2', state: 'dismissed', class: 'copy', override: { action: 'dismissed' } }],
      ]),
    });

    expect(events).toEqual([
      {
        scope: 'finding',
        action: 'cleared',
        store: 'nl',
        page: 'overkapping',
        findingId: 'f1',
      },
      {
        scope: 'finding',
        action: 'cleared',
        store: 'nl',
        page: 'veranda',
        findingId: 'f2',
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
    expect(bulkClear({ ...input, selected: new Set(['f2', 'f3']) })).toMatchObject({
      covers: 0,
      events: [],
    });
  });

  // No note, unlike the other two presses, and the same as the single control it mirrors:
  // a `cleared` event carries no reason. Inventing a mandatory one here would make taking
  // ten decisions back harder than taking one back.
  it('writes without a note, because a cleared event has none to carry', () => {
    const { events } = bulkClear({
      repeat: repeat([on('overkapping', 'f1')]),
      byFinding: new Map([
        [
          'f1',
          {
            id: 'f1',
            state: 'dismissed',
            class: 'copy',
            override: { action: 'dismissed' },
          },
        ],
      ]),
    });

    expect(events[0]).not.toHaveProperty('note');
  });
});

/**
 * Ticket 03: one selection spanning a language block, and the two presses keeping the
 * different eligibilities they already had. Neither press learns anything about a block —
 * they read the entries they are given — which is the point: the widening happened in the
 * key, so there is one definition of *repeat* and both writers inherit it.
 */
describe('the two eligibilities on one block-spanning selection', () => {
  // `nl/afhalen` and `be/afhalen` carry the same string; `be/pergola` carries it too, and
  // a colleague has already dismissed it.
  const across = repeat([
    on('afhalen', 'f1'),
    on('afhalen', 'f2', 'be'),
    on('pergola', 'f3', 'be'),
  ]);

  const states = new Map([
    ['f1', { id: 'f1', state: 'open', class: 'copy', visibility: 'work', override: null }],
    ['f2', { id: 'f2', state: 'open', class: 'copy', visibility: 'work', override: null }],
    [
      'f3',
      {
        id: 'f3',
        state: 'dismissed',
        class: 'copy',
        visibility: 'work',
        override: { action: 'dismissed' },
      },
    ],
  ]);

  it('dismisses across the block and skips the page a colleague decided', () => {
    const decision = bulkDismissal({ repeat: across, byFinding: states, note: 'bewust anders' });

    expect(decision.events.map((event) => `${event.store}/${event.page}`)).toEqual([
      'nl/afhalen',
      'be/afhalen',
    ]);
    expect(decision.covers).toBe(2);
    // `be/pergola` is the one it left alone, and it is counted as decided rather than
    // silently dropped: the editor ticked it and the press did not hit it.
    expect(decision.decided).toBe(1);
  });

  it('clears across the block and touches nothing but the dismissal', () => {
    const decision = bulkClear({ repeat: across, byFinding: states });

    // The mirror image of the press above on the very same selection: where the dismissal
    // acted, this one skips, and where the dismissal skipped, this one acts. That is what
    // "different eligibilities on one selection" has to mean, and the store still comes
    // off the entry.
    expect(decision.events.map((event) => `${event.store}/${event.page}`)).toEqual([
      'be/pergola',
    ]);
    expect(decision.covers).toBe(1);
    expect(decision.skipped).toBe(2);
  });

  it('names the stores it will write in, off the events and not off the block', () => {
    // The trap: 80% is not 100%. A press states the stores **its own events** are in, so a
    // selection whose sibling page is already decided says `nl` and does not imply the
    // block is being decided. Each press answers for itself, on the one selection.
    expect(bulkDismissal({ repeat: across, byFinding: states, note: 'x' }).stores).toEqual([
      'be',
      'nl',
    ]);
    expect(bulkClear({ repeat: across, byFinding: states }).stores).toEqual(['be']);

    // And a selection narrowed to one store names one store, however wide the row is.
    expect(
      bulkDismissal({
        repeat: across,
        byFinding: states,
        note: 'x',
        selected: new Set(['f1']),
      }).stores,
    ).toEqual(['nl']);
  });

  it('is the judgement travelling and never a claim of fact', () => {
    // A fix claim may not cross a block, because correcting one store's page does not
    // correct the other's. There is no bulk fix claim to test — the module exports two
    // presses — so what this pins is that neither of them can write one.
    const all = [
      bulkDismissal({ repeat: across, byFinding: states, note: 'bewust anders' }),
      bulkClear({ repeat: across, byFinding: states }),
    ].flatMap((decision) => decision.events);

    expect(all.length).toBeGreaterThan(0);
    for (const event of all) expect(event.action).not.toBe('fixed');
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

/**
 * Ticket 83: one press, N annotated pages.
 *
 * The selection here is a set of **pages** and not of finding ids, which is the one way
 * this differs from the two presses above. A priority annotates the page, so there is no
 * finding to key on and no eligibility to ask about: every ticked page takes the value.
 */
describe('bulkAnnotation', () => {
  const pages = [
    { store: 'nl', page: 'overkapping' },
    { store: 'nl', page: 'veranda' },
    { store: 'nl', page: 'schuur' },
  ];
  const selected = new Set(['nl/overkapping', 'nl/veranda']);

  it('writes one event per selected page, and none for a page nobody ticked', () => {
    const { events, covers } = bulkAnnotation({
      pages,
      selected,
      event: priorityEventFor('high'),
    });

    expect(covers).toBe(2);
    expect(events).toEqual([
      { store: 'nl', page: 'overkapping', scope: 'page', action: 'prioritised', priority: 'high' },
      { store: 'nl', page: 'veranda', scope: 'page', action: 'prioritised', priority: 'high' },
    ]);
  });

  it('aims each event at its own page, so the editor lands on every row', () => {
    // `appendEach()` reports `failedOn` as the event's page, and the hook adds the editor
    // per event. Both need the page on the event rather than on the press.
    const { events } = bulkAnnotation({ pages, selected, event: noteEventFor('Campagne-update') });
    expect(events.map((one) => one.page)).toEqual(['overkapping', 'veranda']);
    expect(events.every((one) => one.action === 'noted')).toBe(true);
  });

  it('writes nothing when nothing is ticked', () => {
    const { events, covers } = bulkAnnotation({
      pages,
      selected: new Set(),
      event: priorityEventFor('high'),
    });
    expect(events).toEqual([]);
    expect(covers).toBe(0);
  });

  it('clears the annotation on N pages, because a clearing is a press like any other', () => {
    const { events } = bulkAnnotation({ pages, selected, event: priorityEventFor(null) });
    expect(events.every((one) => one.priority === null)).toBe(true);
    expect(events).toHaveLength(2);
  });
});
