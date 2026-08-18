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
    state === 'open'
      ? null
      : { action: 'fixed', editor: 'Danielle', at: '2026-08-14T12:00:00.000Z', note: null },
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

describe('a decided finding says who decided it, and when', () => {
  /**
   * One shape for every attribution (ticket 01): the action, the editor and the day on one
   * line. Two of the three shapes this replaced had a date to draw and drew neither, so an
   * editor could not tell a judgement made this morning from one made in June.
   */
  it('reads as the action, the editor and the day', async () => {
    const unmount = mount();
    await userEvent.click(button('Links'));
    await userEvent.click(button('Closed'));

    expect(document.body.textContent).toContain('fixed · Danielle · 14 Aug 2026');
    unmount();
  });

  // The contradiction is the one state that stays loud, and it stays a sentence naming the
  // person whose claim the reader is about to overturn (ADR 0019).
  it('names the person whose claim a re-check contradicted', async () => {
    const unmount = mount();
    await userEvent.click(button('Links'));

    expect(document.body.textContent).toContain(
      'claimed fixed, still differs · Danielle · 14 Aug 2026',
    );
    unmount();
  });
});

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

/**
 * The fifth tab (ticket 04).
 *
 * The reading is `siblingReading()`'s and the panel is `SiblingView`'s, both tested where
 * they live. What is left for the strip is the one thing neither can answer: that the tab
 * is **absent and not empty** on a page with no sibling, and that it is reachable where
 * there is one.
 */
describe('the sibling tab on the ledger', () => {
  const unit = (raw, index) => ({ tag: 'p', kind: 'text', level: null, raw, norm: raw, index });

  /** A page with an extract on both stores, which is what the panel compares. */
  const comparing = {
    ...report,
    sides: {
      production: { ...report.sides.production, elements: [unit('Gelijk een', 0)] },
      new: report.sides.new,
    },
  };

  const sibling = {
    store: 'be',
    page: 'overkappingen',
    rule: 'alternate',
    units: [unit('Gelijk een', 0)],
  };

  /** The words on the tab strip, in order. A badge is read as part of its trigger, so
      a name with no number after it is a tab carrying no badge. */
  const tabs = () =>
    [...document.querySelectorAll('[role="tab"]')].map((one) => one.textContent.trim());

  it('is absent, and not empty, on a page with no sibling', () => {
    // A tab that draws itself to say there is nothing to compare is a tab an editor
    // opens once per page to learn nothing. `de` and `uk` are in no block at all.
    const unmount = mount({ report: comparing, sibling: null });

    expect(tabs()).toEqual(['Text0', 'Links4', 'Images0', 'Meta']);

    unmount();
  });

  it('is the fifth tab where the page has a sibling, and it carries no badge', () => {
    // No badge, because a badge here counts findings and a block difference is never a
    // finding. **Sibling** and not a store name: the tab is drawn on both stores of the
    // block, so `BE` here and `NL` over there would be two labels for one tab.
    const unmount = mount({ report: comparing, sibling });

    expect(tabs()).toEqual(['Text0', 'Links4', 'Images0', 'Meta', 'Sibling']);

    unmount();
  });

  it('opens the sibling comparison when it is pressed', async () => {
    const unmount = mount({ report: comparing, sibling });
    await userEvent.click(button('Sibling'));

    expect(document.body.textContent).toContain('It compares production on both sides');

    unmount();
  });
});

/**
 * Ticket 77. The run log makes the *history* visible, and this is the whole of what it
 * says on a row: how long the difference has been there.
 *
 * A browser test because the question is what an editor reads. That a finding with no row
 * in the index gets no date is settled purely in `lib/run-log.test.mjs`; that the row it
 * lands on draws the words rather than an empty mark is only answerable here.
 */
describe('a finding says when it was first seen', () => {
  const rowOf = (id) => document.querySelector(`tr[id="finding-${id}"]`);

  it('says the day the run log first saw the id', async () => {
    const unmount = mount({
      findings: [finding('a', 'open', { firstSeen: '2026-06-03T09:00:00.000Z' })],
    });
    await userEvent.click(button('Links'));

    expect(rowOf('a').textContent).toContain('first seen 03 Jun 2026');
    unmount();
  });

  // The index is committed and the reports are not, so a report newer than the index is
  // the normal case. Nothing is the honest answer; *first seen today* would be a guess.
  it('says nothing about a finding the index does not hold', async () => {
    const unmount = mount({ findings: [finding('a', 'open')] });
    await userEvent.click(button('Links'));

    expect(rowOf('a').textContent).not.toContain('first seen');
    unmount();
  });
});
