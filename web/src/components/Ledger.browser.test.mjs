import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { userEvent } from '@vitest/browser/context';
import { afterEach, describe, expect, it } from 'vitest';
import Ledger from './Ledger.jsx';

/**
 * The three buckets, on the ledger (ticket 80).
 *
 * It is a browser test for the reason `Repeats.browser.test.mjs` gives: the grouping is
 * pure and tested in `overrides/state.mjs`, and what is left to prove is that the words
 * an editor reads come off that derivation and that Closed is reachable without being
 * the first thing on screen. Neither question can be asked of a `.mjs`.
 */

/** A derived finding, as `derivePageState()` hands one over. */
const finding = (id, state, extra = {}) => ({
  id,
  store: 'nl',
  page: 'overkappingen',
  check: 'links',
  class: 'link-target',
  state,
  visibility: 'work',
  prod: '/overkappingen/',
  new: '/overkapping/',
  detail: null,
  anchorHeading: null,
  locations: null,
  occurrences: 1,
  score: null,
  override:
    state === 'open' ? null : { action: 'fixed', editor: 'Danielle', at: '2026-08-14', note: null },
  ...extra,
});

/** Two open, one contradicted and one closed, so each bucket has a number of its own. */
const FOUR = [
  finding('a', 'open'),
  finding('b', 'open'),
  finding('c', 'contradicted'),
  finding('d', 'fixed'),
];

const report = {
  store: 'nl',
  page: 'overkappingen',
  comparable: true,
  skipReason: null,
  rows: [],
  sides: {
    production: { url: 'https://www.tuinmaximaal.nl/overkappingen', units: 4 },
    new: { url: 'https://new.tuinmaximaal.nl/overkappingen', units: 4 },
  },
};

function mount(props = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() =>
    root.render(
      createElement(Ledger, {
        report,
        findings: FOUR,
        append: async () => true,
        canWrite: true,
        observationId: '2026-08-14T10:00:00.000Z-aaaaaaaa',
        settled: true,
        ...props,
      }),
    ),
  );
  return () => act(() => root.unmount());
}

/** The strip's three items, read as `{ 'needs-attention': '1', … }`. */
const strip = () =>
  Object.fromEntries(
    [...document.querySelectorAll('[data-bucket]')].map((element) => [
      element.dataset.bucket,
      element.textContent,
    ]),
  );

afterEach(() => {
  history.replaceState(null, '', location.pathname);
  document.body.innerHTML = '';
});

/** The finding ids the Links table currently draws a row for, in order. */
const rows = () =>
  [...document.querySelectorAll('tbody tr[id^="finding-"]')].map((row) =>
    row.id.replace('finding-', ''),
  );

/** A button whose words start with `words`, which is how the disclosure is found. */
const button = (words) =>
  [...document.querySelectorAll('button')].find((element) =>
    element.textContent.trim().startsWith(words),
  );

describe('the three buckets on the ledger', () => {
  it('counts the page into Open, Needs attention and Closed', () => {
    const unmount = mount();

    // The words are the ones `CONTEXT.md` defines, and the third is Closed — never the
    // retired "Resolved". A contradicted claim is the whole of Needs attention.
    expect(strip()).toEqual({
      open: 'Open 2',
      'needs-attention': 'Needs attention 1',
      closed: 'Closed 1',
    });

    unmount();
  });

  /**
   * *Closed is reachable and it is not the default view.* It is a disclosure and not a
   * filter, which is the trap this ticket walks past: hiding Closed behind a filter that
   * is off by default would make a row vanish the instant an editor ticked it fixed, with
   * the tick still under their cursor. So the closed work collapses into a section that
   * says how much of it there is, and opens on a press.
   */
  it('keeps Closed out of the way on Links, and one press reaches it', async () => {
    const unmount = mount();
    await userEvent.click(button('Links'));

    // Open and Needs attention are the work in front of the editor, in that order.
    expect(rows()).toEqual(['a', 'b', 'c']);

    await userEvent.click(button('Closed'));
    expect(rows()).toEqual(['a', 'b', 'c', 'd']);

    unmount();
  });

  /**
   * A link that names a closed finding opens the section on the way in, or the landing
   * would scroll to a row that is not on screen. The press has to keep working afterwards:
   * an editor who arrives on one closed finding and then wants the closed work out of the
   * way again is pressing a control that says it is expanded, and a control that says so
   * and does nothing is the silent nothing-happens ticket 109 wrote its banners to stop.
   */
  it('collapses the section a landing opened, on the first press', async () => {
    history.replaceState(null, '', `?finding=d`);
    const unmount = mount();
    await userEvent.click(button('Links'));

    // Open on the way in, because the landing named a closed finding.
    expect(rows()).toEqual(['a', 'b', 'c', 'd']);

    await userEvent.click(button('Closed'));
    expect(rows()).toEqual(['a', 'b', 'c']);

    unmount();
  });
});
