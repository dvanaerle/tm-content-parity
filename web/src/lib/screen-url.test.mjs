import { describe, expect, it } from 'vitest';
import { parseTerm } from './search.mjs';
import {
  SCREEN,
  screenFromSearch,
  searchForClass,
  searchForRepeat,
  searchFromScreen,
} from './screen-url.mjs';

/**
 * The dashboard screen, written in the URL (ticket 109).
 *
 * Every control on the dashboard was session state in the island, so opening a page
 * threw all of it away: an editor working down a `copy` filter opened the third page
 * on the list, pressed Back, and got the unfiltered queue from the top.
 */

describe('searchFromScreen', () => {
  // The rule that protects every link ever copied off this dashboard: a query means
  // somebody **chose** something. Without it the default is baked into every link,
  // and the default can never be changed again without stranding them all.
  it('writes nothing for the screen an untouched dashboard draws', () => {
    expect(searchFromScreen(SCREEN)).toBe('');
  });
});

describe('the class pills', () => {
  // The case the ticket exists for: an editor working down a `copy` filter opens the
  // third page, comes back, and the pills are still on.
  it('survive the trip out to a link and back', () => {
    const filtered = { ...SCREEN, classes: ['copy', 'casing'] };

    expect(searchFromScreen(filtered)).toBe('classes=copy%2Ccasing');
    expect(screenFromSearch(searchFromScreen(filtered))).toEqual(filtered);
  });

  // A link outlives the vocabulary it was written against. Filtering on a name the
  // rules no longer have would narrow the list to nothing, and the screen would look
  // broken rather than looking like the link was stale.
  it('drop a class the vocabulary does not name', () => {
    expect(screenFromSearch('classes=copy,invented,casing').classes).toEqual(['copy', 'casing']);
  });
});

/**
 * Ticket 83. The priority filter is a control on this screen, so it is in the URL for the
 * same reason the pills are: an editor working down the high-priority pages opens one of
 * them and presses Back.
 *
 * It **belongs to the page list**, exactly as the sort does. A priority annotates a page,
 * and a repeat is a difference across pages rather than a page — so on *Repeats* the filter
 * would narrow nothing while a link promised it did.
 */
describe('the priority filter', () => {
  const pages = { ...SCREEN, view: 'pages' };

  it('survives the trip out to a link and back', () => {
    const filtered = { ...pages, priorities: ['high'] };

    expect(searchFromScreen(filtered)).toBe('view=pages&priority=high');
    expect(screenFromSearch(searchFromScreen(filtered))).toEqual(filtered);
  });

  it('carries more than one, because the filter is a list like the pills are', () => {
    const filtered = { ...pages, priorities: ['high', 'low'] };
    expect(screenFromSearch(searchFromScreen(filtered))).toEqual(filtered);
  });

  // The sort's own rule, for the same reason: a link that promised a narrowing it does
  // not do is worse than a link that carries one control less.
  it('is not written while the differences list is the view', () => {
    expect(searchFromScreen({ ...SCREEN, view: 'repeats', priorities: ['high'] })).toBe('');
  });

  // The closed list is closed here too. A link outlives the words it was written
  // against, and the class pills already answer this the same way.
  it('drops a priority the closed list does not name', () => {
    expect(screenFromSearch('priority=high,Hoog,urgent,low').priorities).toEqual(['high', 'low']);
  });

  it('combines with the class pills in one link', () => {
    const both = { ...pages, classes: ['copy'], priorities: ['high'] };
    expect(screenFromSearch(searchFromScreen(both))).toEqual(both);
  });
});

describe('the view and the search term', () => {
  it('survive the trip out to a link and back', () => {
    const screen = { ...SCREEN, view: 'pages', query: 'bekijk alle deals' };

    expect(searchFromScreen(screen)).toBe('view=pages&query=bekijk+alle+deals');
    expect(screenFromSearch(searchFromScreen(screen))).toEqual(screen);
  });

  // There are two views and a link can name a third. The default wins, because a
  // dashboard drawing neither list is not a state this screen has.
  it('refuse a view this screen does not have', () => {
    expect(screenFromSearch('view=taken').view).toBe('repeats');
  });
});

describe('reading a query that came from outside', () => {
  // This is the boundary. `back` is a query string that travelled through a link and
  // came back off the address bar, and the page draws a link out of it — so what comes
  // out of here has to be a screen this dashboard has and nothing else. A round trip
  // through both functions is what the back link does, and it is what launders it.
  it('keeps the keys it knows and drops everything else', () => {
    const outside = 'view=pages&unknown=x&script=%3Cimg+src%3Dx+onerror%3Dalert(1)%3E';

    expect(screenFromSearch(outside)).toEqual({ ...SCREEN, view: 'pages' });
    expect(searchFromScreen(screenFromSearch(outside))).toBe('view=pages');
  });
});

describe('a control that belongs to one view', () => {
  // The sort orders the page list. Carried into *Repeats* it would be a link
  // promising an order that orders nothing on screen.
  it('writes the sort only while the page list is the view', () => {
    expect(searchFromScreen({ ...SCREEN, sort: 'name' })).toBe('');
    expect(searchFromScreen({ ...SCREEN, view: 'pages', sort: 'name' })).toBe(
      'view=pages&sort=name',
    );
  });

  // *Include closed* belongs to the search, and there is no search without a
  // term. `Dashboard.jsx` says as much: the views answer about the work that is left.
  it('writes include closed only while something is typed', () => {
    expect(searchFromScreen({ ...SCREEN, includeClosed: true })).toBe('');
    expect(searchFromScreen({ ...SCREEN, query: 'deals', includeClosed: true })).toBe(
      'query=deals&closed=1',
    );
    expect(screenFromSearch('query=deals&closed=1').includeClosed).toBe(true);
  });

  // A class on its own **is** a search since ticket 09, so the option that says what counts
  // as a result has something to belong to with nothing typed. Without this a link to a class
  // query showing closed work arrived showing none of it.
  it('writes include closed over a class query, which has no term', () => {
    expect(
      searchFromScreen({ ...SCREEN, classes: ['broken-link'], includeClosed: true }),
    ).toBe('classes=broken-link&closed=1');
  });
});

/**
 * The bridge out of a page and into the surface where a difference is decided across
 * pages. A repeat has nothing to address, so the link is a search — which means it has
 * to survive the search's own rules about what a term is.
 */
describe('the link to a finding’s repeat', () => {
  // The rule the link has to live under: position 0 of the box is the page-scope marker
  // (ADR 0016), and a links finding's text is a path. Sent whole, `/downloads` would be a
  // scope over page keys and would find no words at all.
  it('reads as words and not as a page scope when the text is a path', () => {
    const search = searchForRepeat({ store: 'nl', class: 'link-target', prod: '/downloads' });

    expect(parseTerm(screenFromSearch(search).query)).toEqual({ scope: null, text: 'downloads' });
  });

  // The class is a term of the repeat key, so the same words in two classes are two
  // repeats and the link would land on both.
  it('narrows to the class the repeat key holds', () => {
    const search = searchForRepeat({ store: 'nl', class: 'casing', prod: 'lopende acties' });

    expect(screenFromSearch(search).classes).toEqual(['casing']);
  });

  // A finding the search box could not be made to hold. Offering a link that lands on the
  // unnarrowed queue would be worse than offering none.
  it('offers nothing when the finding has no words', () => {
    expect(searchForRepeat({ store: 'nl', class: 'image-missing', prod: null, new: null })).toBe(
      null,
    );
  });
});

/**
 * The other half of the same gesture (ticket 03). `searchForRepeat()` writes a repeat's
 * words **and** its class; this writes the class with the words left out, which is what
 * makes a class label on a row a list an editor can open.
 */
describe('the link to a class', () => {
  it('writes the class and nothing else', () => {
    // No new parameter: `classes` is already in the contract and already survives a copy, so
    // a class query is this screen with `classes` set and `query` empty.
    expect(searchForClass('broken-link')).toBe('classes=broken-link');
  });

  it('reads back as a class query — the class on, and nothing typed', () => {
    const screen = screenFromSearch(searchForClass('broken-link'));

    expect(screen.classes).toEqual(['broken-link']);
    expect(screen.query).toBe('');
  });

  it('offers nothing for a word the vocabulary does not hold', () => {
    // The label is drawn off the vocabulary, so this cannot happen from a row — and a link
    // that would land on the unnarrowed queue is worse than no link, which is the rule
    // `searchForRepeat()` keeps for a finding with no words.
    expect(searchForClass('type')).toBe(null);
  });
});
