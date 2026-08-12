import { describe, expect, it } from 'vitest';
import { bulkDismissal, bulkMute, offersDismissal, refusesMute } from './bulk.mjs';

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

/** The derivation's answer about each finding, which is what `byFinding` holds. */
const byFinding = (states, anchorHeading = 'Afmetingen') => new Map(
  Object.entries(states).map(([id, state]) => [
    id, { id, state, shown: true, class: 'copy', anchorHeading },
  ]),
);

/** A page's derived findings, which is what a mute's coverage is counted over. */
const finding = (id, cls, anchorHeading) => ({
  id, class: cls, anchorHeading, shown: true, state: 'open',
});

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
      byFinding: byFinding({ f1: 'open', f2: 'fixed', f3: 'muted' }),
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

describe('bulkMute', () => {
  it('writes one mute per page, for the class and the section that page carries it under', () => {
    const { events } = bulkMute({
      repeat: repeat([on('overkapping', 'f1'), on('veranda', 'f2')]),
      byFinding: byFinding({ f1: 'open', f2: 'open' }, 'Afmetingen'),
      findingsByPage: new Map([
        ['nl/overkapping', [finding('f1', 'copy', 'Afmetingen')]],
        ['nl/veranda', [finding('f2', 'copy', 'Afmetingen')]],
      ]),
      note: 'deze winkel schrijft de maten anders op',
    });

    expect(events).toEqual([
      {
        scope: 'page-class',
        action: 'muted',
        store: 'nl',
        page: 'overkapping',
        class: 'copy',
        anchorHeading: 'Afmetingen',
        note: 'deze winkel schrijft de maten anders op',
      },
      {
        scope: 'page-class',
        action: 'muted',
        store: 'nl',
        page: 'veranda',
        class: 'copy',
        anchorHeading: 'Afmetingen',
        note: 'deze winkel schrijft de maten anders op',
      },
    ]);
  });

  it('refuses a page that carries the difference before its first heading', () => {
    const decision = bulkMute({
      repeat: repeat([on('overkapping', 'f1'), on('veranda', 'f2')]),
      byFinding: byFinding({ f1: 'open', f2: 'open' }, null),
      findingsByPage: new Map([
        ['nl/overkapping', [finding('f1', 'copy', null), finding('x', 'copy', null)]],
        ['nl/veranda', [finding('f2', 'copy', null)]],
      ]),
      note: 'campagnetekst',
    });

    // Campaign copy carries a null anchor heading — all 1,645 banner findings do — so
    // this press would mute the null section on hundreds of pages and take every
    // unrelated finding there with it. Ticket 90 owns campaign copy; this is not it.
    expect(decision.offered).toBe(false);
    expect(decision.events).toEqual([]);
    expect(decision.refusal).toMatch(/eerste kop/);
  });

  it('counts coverage under the store and the page, never the page alone', () => {
    const decision = bulkMute({
      repeat: repeat([on('overkapping', 'f1')]),
      byFinding: byFinding({ f1: 'open' }, 'Afmetingen'),
      // Keyed the way `log.byPage` is keyed. A page name is unique within a store and
      // not across six of them, and `overkapping` exists in every store.
      findingsByPage: new Map([['nl/overkapping', [
        finding('f1', 'copy', 'Afmetingen'),
        finding('z', 'copy', 'Afmetingen'),
      ]]]),
      note: 'een reden',
    });

    expect(decision.covers).toBe(2);
  });

  it('refuses a repeat whose section it does not know, and says so differently', () => {
    const decision = bulkMute({
      repeat: repeat([on('overkapping', 'f1')]),
      // The log has no answer for `f1`: a search result can outlive the index it came
      // from, so an id on screen is not always an id the derivation holds.
      byFinding: new Map(),
      findingsByPage: new Map(),
      note: 'een reden',
    });

    // *I do not know which section this is in* and *this is the content before the
    // first heading* are two different answers, and a refusal that gives the second
    // for the first tells the editor something false about their page.
    expect(decision.offered).toBe(false);
    expect(decision.events).toEqual([]);
    expect(decision.refusal).toMatch(/niet bekend/);
    expect(decision.refusal).not.toMatch(/eerste kop/);
  });

  it('counts every finding it would hide, which is more than the difference pressed on', () => {
    const decision = bulkMute({
      repeat: repeat([on('overkapping', 'f1'), on('veranda', 'f2')]),
      byFinding: byFinding({ f1: 'open', f2: 'open' }, 'Afmetingen'),
      findingsByPage: new Map([
        ['nl/overkapping', [
          finding('f1', 'copy', 'Afmetingen'),
          finding('a', 'copy', 'Afmetingen'),
          finding('b', 'copy', 'Levertijd'),
          finding('c', 'casing', 'Afmetingen'),
        ]],
        ['nl/veranda', [
          finding('f2', 'copy', 'Afmetingen'),
          finding('d', 'copy', 'Afmetingen'),
        ]],
      ]),
      note: 'deze winkel schrijft de maten anders op',
    });

    // Two findings of this difference, four findings hidden: `a` and `d` are other
    // `copy` differences in the same section, and they go too. That gap is the whole
    // reason a mute states its own count before the press (ADR 0008), and it is what
    // makes this a different judgement from the dismissal and not a bigger one.
    expect(decision.covers).toBe(4);
    expect(decision.pages).toBe(2);
    expect(decision.difference).toBe(2);
  });

  it('needs a note, and still says what it would cover without one', () => {
    const decision = bulkMute({
      repeat: repeat([on('overkapping', 'f1')]),
      byFinding: byFinding({ f1: 'open' }, 'Afmetingen'),
      findingsByPage: new Map([['nl/overkapping', [finding('f1', 'copy', 'Afmetingen')]]]),
      note: '  ',
    });

    // Ticket 88: a mute is the one judgement that never expires, so it is the one that
    // must be auditable. The count is still stated — the press has to be readable
    // before there is anything to press with.
    expect(decision.events).toEqual([]);
    expect(decision.offered).toBe(true);
    expect(decision.covers).toBe(1);
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
      byFinding: byFinding({ f1: 'open', f2: 'dismissed', f3: 'muted' }),
      note: 'geen defect',
      selected: new Set(['f1', 'f2']),
    });

    expect(decision.covers).toBe(1);
    expect(decision.decided).toBe(1);
  });

  it('mutes only the sections the ticked pages carry it under', () => {
    const decision = bulkMute({
      repeat: three,
      byFinding: new Map([
        ['f1', { id: 'f1', state: 'open', shown: true, class: 'copy', anchorHeading: 'Afmetingen' }],
        ['f2', { id: 'f2', state: 'open', shown: true, class: 'copy', anchorHeading: 'Levering' }],
        ['f3', { id: 'f3', state: 'open', shown: true, class: 'copy', anchorHeading: 'Montage' }],
      ]),
      findingsByPage: new Map([
        ['nl/overkapping', [finding('f1', 'copy', 'Afmetingen')]],
        ['nl/veranda', [finding('f2', 'copy', 'Levering')]],
        ['nl/carport', [finding('f3', 'copy', 'Montage')]],
      ]),
      note: 'hoort hier niet',
      selected: new Set(['f1', 'f2']),
    });

    expect(decision.pages).toBe(2);
    expect(decision.covers).toBe(2);
    expect(decision.sections).toEqual(['Afmetingen', 'Levering']);
    expect(decision.events.map((event) => event.page)).toEqual(['overkapping', 'veranda']);
    // The gap between the two numbers is what makes a mute a mute, and both halves of it
    // are over the selection: the unticked third page is neither hidden nor counted.
    expect(decision.difference).toBe(2);
  });

  // The wall ticket 110 exists to turn into *not this page*: one page of twelve carries
  // the difference before the first heading and refuses the mute for all twelve. Unticking
  // exactly that page offers the press.
  it('offers a mute the unticked page was refusing', () => {
    const input = {
      repeat: three,
      byFinding: new Map([
        ['f1', { id: 'f1', state: 'open', shown: true, class: 'copy', anchorHeading: 'Afmetingen' }],
        ['f2', { id: 'f2', state: 'open', shown: true, class: 'copy', anchorHeading: null }],
        ['f3', { id: 'f3', state: 'open', shown: true, class: 'copy', anchorHeading: 'Montage' }],
      ]),
      findingsByPage: new Map(),
      note: 'hoort hier niet',
    };

    expect(bulkMute(input).offered).toBe(false);
    expect(bulkMute({ ...input, selected: new Set(['f1', 'f3']) }).offered).toBe(true);
  });

  // The refusal names a count and the list has to name the rows, or *untick the ones that
  // refuse* is a puzzle. It is asked over the whole repeat and not over the selection: the
  // mark is on a row of the list, and the row is there whether it is ticked or not.
  //
  // It is keyed on the finding id, like the selection beside it, and it carries **which**
  // of the two obstacles the row has. `bulkMute()` refuses the two in different words
  // because they call for different work — a reload against a judgement made per page —
  // and a mark that merged them would tell one of the two rows something untrue.
  it('names the pages that refuse a mute and why, so the list can mark them', () => {
    const marks = refusesMute({
      repeat: three,
      byFinding: new Map([
        ['f1', { id: 'f1', anchorHeading: 'Afmetingen' }],
        ['f2', { id: 'f2', anchorHeading: null }],
        // `f3` is absent: the screen is older than the log, so its section is unknown.
      ]),
    });

    expect(marks.get('f1')).toBeUndefined();
    expect(marks.get('f2')).toBe('headless');
    expect(marks.get('f3')).toBe('unknown');
  });

  // The select-all ticks what a dismissal is offered on, so the checkbox and the press
  // read one rule. A page a colleague decided is drawn with its state and left alone.
  it('agrees with the dismissal about which findings a select-all may tick', () => {
    expect(offersDismissal({ state: 'open' })).toBe(true);
    expect(offersDismissal({ state: 'contradicted' })).toBe(true);
    expect(offersDismissal({ state: 'dismissed' })).toBe(false);
    expect(offersDismissal({ state: 'fixed' })).toBe(false);
    // A finding the log has not decided, which is what a search result is before the log
    // has an answer about it.
    expect(offersDismissal(undefined)).toBe(true);
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

    expect(bulkMute({
      repeat: three,
      byFinding: open3,
      findingsByPage: new Map(),
      note: 'hoort hier niet',
      selected: empty,
    })).toMatchObject({ pages: 0, covers: 0, events: [] });
  });
});

/**
 * Ticket 09 and ticket 31 both say it: a bulk write is N **ordinary** events. No
 * site-wide scope, no "repeat" scope — a repeat is a grouping the interface makes and it
 * has no identity to key on — and no new action. The table gains N rows and nothing else.
 */
describe('the vocabulary a bulk press writes in', () => {
  const SCOPES = ['finding', 'page-class', 'page'];
  const ACTIONS = ['fixed', 'dismissed', 'muted', 'reviewed', 'cleared'];

  const both = [
    bulkDismissal({
      repeat: repeat([on('overkapping', 'f1'), on('veranda', 'f2')]),
      byFinding: byFinding({ f1: 'open', f2: 'open' }),
      note: 'een reden',
    }),
    bulkMute({
      repeat: repeat([on('overkapping', 'f1')]),
      byFinding: byFinding({ f1: 'open' }, 'Afmetingen'),
      findingsByPage: new Map([['nl/overkapping', [finding('f1', 'copy', 'Afmetingen')]]]),
      note: 'een reden',
    }),
  ].flatMap((decision) => decision.events);

  it('writes nothing outside the scopes the table already has', () => {
    expect(both.length).toBeGreaterThan(0);
    for (const event of both) expect(SCOPES).toContain(event.scope);
  });

  it('writes nothing outside the actions the table already has', () => {
    for (const event of both) expect(ACTIONS).toContain(event.action);
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
