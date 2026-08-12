import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { useLandOn } from './landing.mjs';

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
