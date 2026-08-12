import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { useLanding, useLandOn } from './landing.mjs';

/**
 * `useLandOn` in a real browser (ticket 109).
 *
 * The question is whether the reader ends up looking at the row, which is a question
 * about `scrollIntoView` and about layout. A pretend browser answers it by definition —
 * it has no layout — so this file runs under `vitest --browser`.
 */

/** A page with a target far below the fold, so a scroll is the only way to see it. */
function pageWithTargetBelowTheFold(id = 'bevinding-a1') {
  const spacer = document.createElement('div');
  spacer.style.height = '4000px';

  const target = document.createElement('div');
  target.id = id;
  target.textContent = 'the row the link named';
  // The clamp offset the content view puts on every row, so this pins that a landing
  // honours it rather than putting the row flush against the top edge.
  target.style.scrollMarginTop = '16px';
  // Only the landed row is focusable, which is what the two tables do to their rows.
  target.tabIndex = -1;

  const tail = document.createElement('div');
  tail.style.height = '4000px';

  document.body.append(spacer, target, tail);
  return target;
}

function mount(anchor, settled = true) {
  function Probe() {
    useLandOn(anchor, settled);
    return null;
  }

  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(createElement(Probe)));
  return () => act(() => root.unmount());
}

afterEach(() => {
  document.body.innerHTML = '';
  window.scrollTo(0, 0);
});

/**
 * The two controls a landing borrows, and the reader taking either one back.
 *
 * `asked` is what `landingFor()` decided. The hook holds the reader's own tab and their
 * own toggle beside it, and the question these tests exist for is that the two are
 * **independent**: taking one back must not hand the other one back as well.
 */
function mountControls(asked) {
  const seen = /** @type {{ tab: string, noise: boolean }} */ ({});

  function Probe() {
    const { tab, noise, chooseTab, chooseNoise } = useLanding(asked, 'Inhoud');
    seen.tab = tab;
    seen.noise = noise;

    return createElement('div', null,
      createElement('button', { id: 'take-tab', onClick: () => chooseTab('Inhoud') }, 'Inhoud'),
      createElement('button', { id: 'take-noise', onClick: () => chooseNoise(false) }, 'ruis uit'),
    );
  }

  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(createElement(Probe)));

  return {
    seen,
    press: (id) => act(() => document.getElementById(id).click()),
    unmount: () => act(() => root.unmount()),
  };
}

/** A muted `links` finding: the tab has to change **and** the toggle has to come on. */
const askedForBoth = { tab: 'Links', needsNoise: true, missing: false, unplaced: false };

describe('useLanding', () => {
  // The reader landed on Links and then looked at something else. The noise toggle is
  // still the only reason the row they came for is drawable, so switching tabs must not
  // switch it off — that used to make the landed row vanish the moment they clicked a tab.
  it('keeps the borrowed noise toggle when the reader takes the tab strip', () => {
    const { seen, press, unmount } = mountControls(askedForBoth);
    expect(seen).toEqual({ tab: 'Links', noise: true });

    press('take-tab');

    expect(seen).toEqual({ tab: 'Inhoud', noise: true });
    unmount();
  });

  // And the other way round. The reader landed on Links and switched the noise off,
  // which is their business — but it is not a request to be sent back to Inhoud, which
  // is what one shared flag did.
  it('keeps the borrowed tab when the reader takes the noise box', () => {
    const { seen, press, unmount } = mountControls(askedForBoth);

    press('take-noise');

    expect(seen).toEqual({ tab: 'Links', noise: false });
    unmount();
  });

  // The ordinary page, opened from the page list: nothing was asked for, so the reader
  // gets the first tab and a toggle that is off, and both answer to them alone.
  it('is the reader´s own two controls when no link named a finding', () => {
    const { seen, press, unmount } = mountControls({
      tab: null, needsNoise: false, missing: false, unplaced: false,
    });
    expect(seen).toEqual({ tab: 'Inhoud', noise: false });

    press('take-noise');

    expect(seen).toEqual({ tab: 'Inhoud', noise: false });
    unmount();
  });
});

describe('useLandOn', () => {
  // The whole point of the ticket, at the last inch: the editor clicked a difference
  // and has to be looking at it.
  it('brings the row the link named onto the screen', () => {
    const target = pageWithTargetBelowTheFold();
    expect(target.getBoundingClientRect().top).toBeGreaterThan(window.innerHeight);

    const unmount = mount('bevinding-a1');

    const { top } = target.getBoundingClientRect();
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top).toBeLessThan(window.innerHeight);
    unmount();
  });

  // `scroll-mt-4` on the row is 16 pixels, and a landing that ignored it would put the
  // row flush against the top edge with nothing above it to read against.
  it('honours the row scroll margin', () => {
    const target = pageWithTargetBelowTheFold();

    const unmount = mount('bevinding-a1');

    expect(Math.round(target.getBoundingClientRect().top)).toBe(16);
    unmount();
  });

  // A landing is not only a colour. Without this a keyboard reader arrives at the top of
  // the document and a screen reader says nothing, whatever the outline shows.
  it('gives the row the keyboard', () => {
    const target = pageWithTargetBelowTheFold();

    const unmount = mount('bevinding-a1');

    expect(document.activeElement).toBe(target);
    unmount();
  });

  // The page is still changing shape until the override log answers: a decided row grows a
  // control, and a landing taken before that is measured against a layout about to move.
  // Measured on `nl/carport`: the row ended up 273 pixels below where it was put.
  it('waits until the page has stopped changing shape', () => {
    pageWithTargetBelowTheFold();

    const unmount = mount('bevinding-a1', false);

    expect(window.scrollY).toBe(0);
    unmount();
  });

  // The ordinary case: a reader who opened a page from the page list asked for no row,
  // and the page must not move under them.
  it('does not move the page when no row was named', () => {
    pageWithTargetBelowTheFold();

    const unmount = mount(null);

    expect(window.scrollY).toBe(0);
    unmount();
  });

  // A finding id expires with the text it names, so a link can point at a row this
  // snapshot does not draw. `landingFor()` is what says so to the reader; this must
  // simply not throw on the way past.
  it('does nothing when the row is not on the page', () => {
    pageWithTargetBelowTheFold();

    const unmount = mount('bevinding-verdwenen');

    expect(window.scrollY).toBe(0);
    unmount();
  });
});
