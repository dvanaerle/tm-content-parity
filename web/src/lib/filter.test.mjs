import { describe, expect, it } from 'vitest';
import {
  NO_FILTER,
  isNarrowed,
  pagesWithClasses,
  pagesWithPriorities,
  toggleClass,
  toggleIn,
} from './filter.mjs';

/**
 * Narrowing, over every shape it is asked of.
 *
 * The one rule that outranks every other here: **a filter never moves a count.** Each
 * function below decides what is on screen and none of them touches a denominator, a bar
 * or a roll-up (spec 32, decision 25).
 */

describe('the filter itself', () => {
  it('starts as no filter at all', () => {
    expect(isNarrowed(NO_FILTER)).toBe(false);
  });

  it('is narrowed by a class, which is the only narrowing left', () => {
    // *Differences only* was the other one until ticket 79. It is gone: the marker
    // makes the default a differences view already, so a box that removed the equal
    // rows outright was a control that took away the answer to *where does this text
    // belong*.
    expect(isNarrowed({ ...NO_FILTER, classes: ['copy'] })).toBe(true);
  });

  it('adds and removes a class without touching the rest of the filter', () => {
    const on = toggleClass({ classes: [] }, 'copy');
    expect(on).toEqual({ classes: ['copy'] });

    expect(toggleClass(on, 'copy').classes).toEqual([]);
  });

  it('leaves the filter it was given alone', () => {
    const held = { ...NO_FILTER };
    toggleClass(held, 'copy');
    expect(held.classes).toEqual([]);
  });
});

describe('toggleIn', () => {
  // The dashboard holds a bare class list and the content view holds a whole filter.
  // The set operation is shared so that the dashboard does not have to invent the
  // wrapper it has no use for.
  it('adds an absent item and removes a held one', () => {
    expect(toggleIn(['copy'], 'casing')).toEqual(['copy', 'casing']);
    expect(toggleIn(['copy', 'casing'], 'copy')).toEqual(['casing']);
  });

  it('leaves the list it was given alone', () => {
    const held = ['copy'];
    toggleIn(held, 'casing');
    expect(held).toEqual(['copy']);
  });
});

describe('pagesWithClasses', () => {
  const pages = [
    { page: 'a', summary: { byClass: { copy: 3, casing: 1 } } },
    { page: 'b', summary: { byClass: { casing: 2 } } },
    { page: 'c', summary: { byClass: {} } },
  ];

  it('is every page when nothing is selected', () => {
    expect(pagesWithClasses(pages, [])).toHaveLength(3);
  });

  it('keeps a page that carries any of the selected classes', () => {
    expect(pagesWithClasses(pages, ['copy']).map((page) => page.page)).toEqual(['a']);
    expect(pagesWithClasses(pages, ['copy', 'casing']).map((page) => page.page)).toEqual([
      'a',
      'b',
    ]);
  });

  it('drops a page whose count for the class is zero rather than absent', () => {
    const zero = [{ page: 'd', summary: { byClass: { copy: 0 } } }];
    expect(pagesWithClasses(zero, ['copy'])).toEqual([]);
  });
});

/**
 * Ticket 83. The priority is an annotation an editor wrote, not a property of the
 * snapshot, so it does not come off `summary` the way a class count does — it is derived
 * from the log and reaches this filter as an accessor.
 *
 * It is a second filter over the same list, and the rule above outranks it too: it narrows
 * what is drawn and moves no count.
 */
describe('pagesWithPriorities', () => {
  const pages = [
    { page: 'a', summary: { byClass: { copy: 3 } } },
    { page: 'b', summary: { byClass: { casing: 2 } } },
    { page: 'c', summary: { byClass: { copy: 1 } } },
  ];
  const priorityOf = (page) => ({ a: 'high', b: 'high' })[page.page] ?? null;

  it('is every page when nothing is selected', () => {
    expect(pagesWithPriorities(pages, [], priorityOf)).toHaveLength(3);
  });

  it('keeps the pages carrying any of the selected priorities', () => {
    expect(pagesWithPriorities(pages, ['high'], priorityOf).map((p) => p.page)).toEqual(['a', 'b']);
  });

  it('drops every page when the selected priority is on none of them', () => {
    expect(pagesWithPriorities(pages, ['low'], priorityOf)).toEqual([]);
  });

  it('never keeps an unannotated page, because absence is not a priority', () => {
    expect(
      pagesWithPriorities(pages, ['high', 'medium', 'low'], priorityOf).map((p) => p.page),
    ).toEqual(['a', 'b']);
  });

  /**
   * The acceptance criterion in one test: the two filters are **and**, not or. An editor
   * asking for the high-priority `copy` pages is asking one question, and a list that
   * answered it with the union would be answering a different one.
   */
  it('combines with the class filter, narrowing to the pages that satisfy both', () => {
    const both = pagesWithPriorities(pagesWithClasses(pages, ['copy']), ['high'], priorityOf);
    expect(both.map((p) => p.page)).toEqual(['a']);
    // And in the other order, because two pure filters over one list have to commute.
    expect(pagesWithClasses(pagesWithPriorities(pages, ['high'], priorityOf), ['copy'])).toEqual(
      both,
    );
  });
});
