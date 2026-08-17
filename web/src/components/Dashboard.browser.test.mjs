import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import Dashboard from './Dashboard.jsx';

/**
 * The three buckets, on the store dashboard (ticket 80).
 *
 * The question this ticket actually asked was **whether one grouping reads the same on the
 * dashboard and in the ledger** — that is why the throwaway prototype put both on one
 * route. A pure test of `bucketsOf()` cannot answer it: two screens can agree on every
 * number and still call the middle bucket two different things. So the words are read back
 * off the rendered dashboard here, through the same `data-bucket` hook
 * `Ledger.browser.test.mjs` reads its strip through.
 *
 * No override log is connected in a test, so `useStoreOverrides()` derives over an empty
 * event list and every finding is `open` — which is the honest starting state of a store
 * and enough to pin the words and their order.
 */

const finding = (id, cls = 'copy') => ({
  id,
  store: 'nl',
  page: 'overkappingen',
  check: cls === 'copy' ? 'text' : 'links',
  class: cls,
  prod: 'Levering in 5 werkdagen',
  new: 'Levering in vijf werkdagen',
  anchorHeading: null,
  occurrences: 1,
  score: null,
});

const page = (name, findings) => ({
  store: 'nl',
  page: name,
  comparable: true,
  skipReason: null,
  findings,
  rows: [],
  sides: {
    production: { url: `https://www.tuinmaximaal.nl/${name}`, units: 40 },
    new: { url: `https://new.tuinmaximaal.nl/${name}`, units: 40 },
  },
  summary: {
    work: findings.length,
    information: 0,
    diagnostic: 0,
    total: findings.length,
    byClass: {},
    byCheck: {},
  },
  observationId: '2026-08-14T10:00:00.000Z-aaaaaaaa',
  // A literal, because `findingSetHash()` hashes with `node:crypto` and this runs in a
  // browser. Nothing here reads it: the hash decides whether a *review* went stale, and no
  // page in this fixture is reviewed.
  findingSetHash: `hash-${name}`,
  builtAt: '2026-08-14T10:00:00.000Z',
});

const PAGES = [
  page('overkappingen', [finding('a'), finding('b')]),
  page('schuttingen', [finding('c', 'link-target')]),
];

function mount(props = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(createElement(Dashboard, { store: 'nl', pages: PAGES, ...props })));
  return () => act(() => root.unmount());
}

/**
 * The store strip's three chips, as `{ 'needs-attention': { count, label }, … }`.
 *
 * The count and the word are read apart rather than as one string: a chip draws them as two
 * elements with the gap in CSS, so a joined `textContent` would assert on whitespace that
 * is not in the markup and say nothing about either half.
 */
const strip = () =>
  Object.fromEntries(
    [...document.querySelectorAll('[data-bucket]')].map((element) => [
      element.dataset.bucket,
      {
        count: element.querySelector('strong').textContent,
        label: element.querySelector('span').textContent,
      },
    ]),
  );

afterEach(() => {
  history.replaceState(null, '', location.pathname);
  document.body.innerHTML = '';
});

describe('the three buckets on the store dashboard', () => {
  /**
   * The words are `CONTEXT.md`'s three, in its own casing — **Open**, **Needs attention**
   * and **Closed** — and they are asserted as literals rather than read out of
   * `BUCKET_LABEL`, which would only prove the map equals itself. A bucket is a glossary
   * term, so it keeps the glossary's capitals wherever it is drawn: lowercasing it to match
   * the sentence-shaped chips beside it is how one term comes to read three ways.
   */
  it('names the three buckets the way the glossary and the ledger name them', () => {
    const unmount = mount();

    expect(strip()).toEqual({
      open: { count: '3', label: 'Open' },
      'needs-attention': { count: '0', label: 'Needs attention' },
      closed: { count: '0', label: 'Closed' },
    });

    unmount();
  });

  /** The per-page column head names the three, so the three numbers under it need no legend. */
  it('heads the per-page column with the same three words', () => {
    // *Repeats* lands first, and the screen is the URL (ADR 0010) — so the per-page table
    // is asked for the way a reader's own link asks for it.
    history.replaceState(null, '', '?view=pages');
    const unmount = mount();

    const head = [...document.querySelectorAll('th')].map((cell) => cell.textContent.trim());
    expect(head).toContain('Open · Needs attention · Closed');

    unmount();
  });
});

/**
 * Ticket 104 part A. A scope has to be able to *reach* a one-sided page before it can say
 * anything about one, and the sentence it says points at the aside that lists them. Both
 * halves live here and not in `Search.browser.test.mjs`: what `Search` is handed is the
 * dashboard's decision, and the anchor it points at is the dashboard's markup.
 */
describe('a scope over a one-sided page', () => {
  const ONE_SIDED = {
    ...page('kerstactie', []),
    comparable: false,
    skipReason: 'new site answered 404',
  };

  let fetched;

  const mountSearching = (term) => {
    fetched = globalThis.fetch;
    // The index holds compared pages only, which is the whole reason this case is blank
    // without the page list: the answer cannot come from here.
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        store: 'nl',
        pages: 2,
        builtAt: '2026-08-14T10:00:00.000Z',
        findings: [],
      }),
    });
    history.replaceState(null, '', `?query=${encodeURIComponent(term)}`);
    return mount({ pages: [...PAGES, ONE_SIDED] });
  };

  afterEach(() => {
    globalThis.fetch = fetched;
  });

  it('reaches a one-sided page, which the compared half of the list cannot answer for', async () => {
    // The dashboard used to hand `Search` the comparable pages only, so a scope onto a
    // one-sided page was silence — the search contradicting the aside on the same screen.
    const unmount = mountSearching('/kerst');
    await act(async () => {});

    expect(document.body.textContent).toContain('Only one site has this page');
    expect(document.body.textContent).toContain('new site answered 404');

    unmount();
  });

  it('points at the aside that lists them, which the page can be scrolled to', async () => {
    const unmount = mountSearching('/kerst');
    await act(async () => {});

    expect(document.querySelector('#one-sided-pages')).not.toBe(null);

    unmount();
  });
});

/**
 * Ticket 104 part C. A page scope stops being invisible punctuation inside a text box and
 * becomes a chip beside the class pills, named in the amber strip like every other
 * narrowing and cleared by the clear-filter control.
 *
 * These live here and not in `Search.browser.test.mjs` because the **box** is the
 * dashboard's: the chip is a reading of it, and every clear is a write back to it. What
 * the strip says about a scope is asked for over `Search`, which owns the strip.
 */
describe('a page scope worn as a chip', () => {
  let fetched;

  const mountSearching = (search) => {
    fetched = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        store: 'nl',
        pages: 2,
        builtAt: '2026-08-14T10:00:00.000Z',
        findings: [],
      }),
    });
    history.replaceState(null, '', `?${search}`);
    return mount();
  };

  afterEach(() => {
    globalThis.fetch = fetched;
  });

  const box = () => document.querySelector('input[type="search"]');
  const chip = () => document.querySelector('[data-scope-chip]');
  const strip = () =>
    [...document.querySelectorAll('[data-slot="alert"]')].find((element) =>
      element.textContent.includes('Clear filter'),
    );
  const press = (root, label) =>
    act(async () =>
      [...root.querySelectorAll('button')]
        .find((one) => one.textContent.trim() === label || one.getAttribute('title') === label)
        .click(),
    );

  it('draws the scope beside the pills, in the shape it was typed', async () => {
    const unmount = mountSearching('query=%2Foverkap%20deals&classes=copy');
    await act(async () => {});

    expect(chip().textContent).toContain('/overkap');
    // **Beside the pills** is the criterion and not a paraphrase of *somewhere in the
    // header*: the chip sat over by the search box until the review of this part, which on
    // a wide viewport is a header's width from the pills it belongs with. Asserted as one
    // shared parent, which is what adjacency is in a flex row — a test measuring pixels
    // would pin the layout instead of the grouping.
    const pills = document.querySelector('[data-slot="toggle-group"]');
    expect(chip().parentElement).toBe(pills.parentElement);
    unmount();
  });

  it('draws no chip when the box holds no scope', async () => {
    const unmount = mountSearching('query=deals');
    await act(async () => {});

    expect(chip()).toBe(null);
    unmount();
  });

  it('dismisses the scope alone, leaving the term and the classes where they were', async () => {
    const unmount = mountSearching('query=%2Foverkap%20deals&classes=copy');
    await act(async () => {});

    await press(chip(), 'Clear the page scope');

    expect(box().value).toBe('deals');
    expect(chip()).toBe(null);
    // The classes are not the chip's to touch, and the strip is still up for them.
    expect(strip().textContent).toContain('Filtered on copy.');
    unmount();
  });

  it('clears the scope and the classes together, keeping the rest of the term', async () => {
    // The price the ticket accepts: clearing the filters rewrites the box, because the
    // chip owns a fragment of an input. An editor clearing the filters is asking for the
    // whole store back, and a scope surviving that is the more surprising outcome.
    const unmount = mountSearching('query=%2Foverkap%20deals&classes=copy');
    await act(async () => {});

    await press(strip(), 'Clear filter');

    expect(box().value).toBe('deals');
    expect(chip()).toBe(null);
    expect(strip()).toBe(undefined);
    unmount();
  });

  it('follows the box when the scope is edited, so the two never disagree', async () => {
    // Two sources of truth for the scope is this part's failure mode. The box is the
    // source and the chip is a reading of it, so editing one moves the other by
    // construction rather than by a second write.
    const unmount = mountSearching('query=%2Foverkap');
    await act(async () => {});
    expect(chip().textContent).toContain('/overkap');

    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(box(), '/schutting');
    await act(async () => box().dispatchEvent(new Event('input', { bubbles: true })));

    expect(chip().textContent).toContain('/schutting');
    expect(chip().textContent).not.toContain('/overkap');
    unmount();
  });
});

/**
 * Ticket 104 part D. The keys are not guessable — `(home)`, `(be)pergola`,
 * `faq/productinformatie` — so a scope nobody is offered is a feature only a reader of the
 * source can use. What is offered is decided in `search.mjs` and pinned there; these cases
 * ask the questions only a browser can answer: whether the box offers it, whether the arrow
 * keys walk it, and whether it is there before the index is.
 */
describe('the page keys offered while a scope is typed', () => {
  const ONE_SIDED = {
    ...page('kerstactie', []),
    comparable: false,
    skipReason: 'new site answered 404',
  };

  let fetched;

  const mountFresh = () => {
    fetched = globalThis.fetch;
    // **Never resolves.** The suggestions have to be there before the index is, so a test
    // that let the index land could not tell the two apart.
    globalThis.fetch = () => new Promise(() => {});
    // `overkappingen-hout` is here because a key that is the prefix of a sibling is the
    // ordinary shape of a real store, not the odd one — and it is the case an exact match
    // read as settlement gets wrong.
    return mount({ pages: [...PAGES, ONE_SIDED, page('overkappingen-hout', [finding('d')])] });
  };

  afterEach(() => {
    globalThis.fetch = fetched;
  });

  const box = () => document.querySelector('input[type="search"]');
  const list = () => document.querySelector('[data-scope-suggestions]');
  const offered = () =>
    [...document.querySelectorAll('[data-suggestion]')].map((one) => one.dataset.suggestion);
  const activeRow = () => document.querySelector('[data-suggestion][aria-selected="true"]');

  /** What an editor typing does, which is what the box answers: a value and an `input`. */
  const type = async (text) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    await act(async () => box().focus());
    setter.call(box(), text);
    await act(async () => box().dispatchEvent(new Event('input', { bubbles: true })));
  };

  const press = (name) => {
    const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
    return act(async () => box().dispatchEvent(event));
  };

  it('offers every key of the store on the slash alone, before the index has arrived', async () => {
    const unmount = mountFresh();
    await type('/');

    expect(offered()).toEqual([
      'kerstactie',
      'overkappingen',
      'overkappingen-hout',
      'schuttingen',
    ]);
    // The index is still in flight, which is the point: the page list answered this and it
    // was in memory from the moment the store page loaded.
    expect(document.body.textContent).toContain('loading');
    unmount();
  });

  it('narrows what is offered as the key is typed', async () => {
    const unmount = mountFresh();
    await type('/overk');

    expect(offered()).toEqual(['overkappingen', 'overkappingen-hout']);
    unmount();
  });

  it('offers nothing for a slash that is not in first position', async () => {
    // 103's rule: a key can hold a slash, so anywhere but the front it is an ordinary
    // character and no scope is being typed.
    //
    // The term is `faq/overk` and not `overkappingen/deals` on purpose. The second one is
    // silent under a **wrong** rule as well — a rule scanning for any slash would read a
    // fragment no key holds, and an empty offer draws nothing either — so it would pass
    // while proving nothing. Here the words after the slash *do* name a page, so a rule
    // reading structure anywhere but position 0 opens the list and is caught.
    const unmount = mountFresh();
    await type('faq/overk');

    expect(list()).toBe(null);
    unmount();
  });

  it('walks the list with the arrow keys and chooses with Enter, keeping the second term', async () => {
    const unmount = mountFresh();
    await type('/ deals');

    await press('ArrowDown');
    await press('ArrowDown');
    expect(activeRow().dataset.suggestion).toBe('overkappingen');

    await press('Enter');

    expect(box().value).toBe('/overkappingen deals');
    // Choosing is settling, so the list goes down on the press — and it has to be said here
    // rather than left to the offer, because `overkappingen` is the prefix of a sibling and
    // the offer is right to keep standing for one.
    expect(list()).toBe(null);
    expect(document.querySelector('[data-scope-chip]').textContent).toContain('/overkappingen');
    unmount();
  });

  it('goes on offering a sibling when the key typed is the prefix of one', async () => {
    // What is offered is what would match: `/overkappingen` reaches two pages, so a list
    // that closed on the exact match would go quiet with a page still to offer — and would
    // do it silently on a one-sided sibling, the page nothing else can reach.
    const unmount = mountFresh();
    await type('/overkappingen');

    expect(offered()).toEqual(['overkappingen', 'overkappingen-hout']);
    unmount();
  });

  it('wires the box to the list the way a combobox is read', async () => {
    // The browser is what these tests are for, and a `data-` hook says nothing to a screen
    // reader. The list is read from inside the box, so the box keeps the focus and the
    // active row is named by `aria-activedescendant` rather than focused.
    const unmount = mountFresh();
    await type('/overk');

    expect(box().getAttribute('role')).toBe('combobox');
    expect(box().getAttribute('aria-expanded')).toBe('true');
    expect(box().getAttribute('aria-controls')).toBe(list().id);
    expect(box().getAttribute('aria-activedescendant')).toBe(null);

    await press('ArrowDown');

    expect(document.activeElement).toBe(box());
    expect(box().getAttribute('aria-activedescendant')).toBe(activeRow().id);
    unmount();
  });

  it('puts the list down on Escape without emptying the box', async () => {
    // Dismissable without leaving the box, and the browser's own Escape — which empties a
    // `type="search"` input — is refused: an editor putting a list down has not asked for
    // their term back.
    const unmount = mountFresh();
    await type('/overk');
    expect(list()).not.toBe(null);

    await press('Escape');

    expect(list()).toBe(null);
    expect(box().value).toBe('/overk');
    unmount();
  });

  it('brings the list back when the fragment changes after an Escape', async () => {
    const unmount = mountFresh();
    await type('/overk');
    await press('Escape');

    await type('/schut');

    expect(offered()).toEqual(['schuttingen']);
    unmount();
  });

  it('marks the one-sided pages, which no index entry could offer', async () => {
    const unmount = mountFresh();
    await type('/kerst');

    expect(document.querySelector('[data-suggestion="kerstactie"]').textContent).toContain(
      'one-sided',
    );
    unmount();
  });

  it('behaves the same for a scope typed out by hand', async () => {
    // Choosing is never required. A key typed in full is a settled scope, so the list has
    // nothing left to offer and the screen is the one the list would have produced.
    // `schuttingen` and not `overkappingen`: the second reaches a sibling as well, and the
    // case being pinned here is the hand-typed key that is finished.
    const unmount = mountFresh();
    await type('/schuttingen deals');

    expect(list()).toBe(null);
    expect(box().value).toBe('/schuttingen deals');
    expect(document.querySelector('[data-scope-chip]').textContent).toContain('/schuttingen');
    unmount();
  });
});
