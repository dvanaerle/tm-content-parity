import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { LogBanner, PageMenu, RecheckButton } from './Progress.jsx';
import { headerReading } from '../lib/page-header.mjs';

/**
 * The four things the banner says about one read of the log.
 *
 * These were **written green** and are kept as pins, which is the honest order for the
 * change they were written for: the review of ticket 123 asked that `LogBanner` and
 * `searchNotes()` stop cascading separately over the same five fields, and the banner had
 * no test at all. A refactor of untested words is how the two surfaces came to disagree
 * about them in the first place, so the sentences are nailed down first and the cascade is
 * replaced under them.
 *
 * Ticket 13 is what each case is about: a paused project does not break the page, only the
 * log, and an editor who is not told reads an empty list as *nobody has done anything*.
 */
function draw(log) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(createElement(LogBanner, log)));
  return { text: host.textContent, unmount: () => act(() => root.unmount()) };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('LogBanner', () => {
  it('says nothing about a log that was read and works', () => {
    const { text, unmount } = draw({ connected: true, ready: true, error: null });

    expect(text).toBe('');
    unmount();
  });

  it('says the log is loading before the first read answers', () => {
    const { text, unmount } = draw({ connected: true, ready: false, error: null });

    expect(text).toContain('The override log is loading…');
    unmount();
  });

  it('names the failure and keeps the last good read visible', () => {
    // A failed write over a read that succeeded. The two sentences differ because the
    // states do: telling an editor "no overrides" while their own dismissals are on screen
    // is the same lie as showing an empty list.
    const { text, unmount } = draw({ connected: true, ready: true, error: 'insert failed' });

    expect(text).toContain('The override log does not answer.');
    expect(text).toContain('You see the state that was read last; it can be out of date.');
    expect(text).toContain('(insert failed)');
    unmount();
  });

  it('says the snapshot is bare when the failure is the read itself', () => {
    const { text, unmount } = draw({
      connected: true,
      ready: false,
      error: 'TypeError: Failed to fetch',
    });

    expect(text).toContain('The log was not read, so you see the snapshot without the overrides.');
    unmount();
  });

  it('tells an unconfigured project apart from a failure, and says whose fault it is', () => {
    const { text, unmount } = draw({
      connected: false,
      notConnectedReason: 'PUBLIC_SUPABASE_URL is not set.',
      ready: false,
      error: null,
    });

    expect(text).toContain('No connection to the override log.');
    expect(text).toContain('PUBLIC_SUPABASE_URL is not set.');
    // Not the failure's words. The distinction is this component's whole job, and the
    // notes half is allowed to collapse the two only because this one does not.
    expect(text).not.toContain('does not answer');
    unmount();
  });
});

/**
 * The header's *more* control (ui-polish ticket 09).
 *
 * It is the first menu in this interface, and it is the primitive's because a menu takes
 * the focus — the one thing ADR 0007 bought the dependency for. What is asserted here is
 * therefore not the keyboard behaviour, which is `@base-ui/react`'s job and knowingly
 * unguarded, but the two things the primitive cannot know: that an icon-only trigger says
 * what it is, and that the one action with a real cost never went inside it.
 */
function drawMenu(page = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const reading = headerReading({
    review: null,
    annotations: { priority: null, note: null },
    notWritingReason: null,
    recheckAvailable: true,
    ...page,
  });
  act(() =>
    root.render(createElement(PageMenu, { actions: reading.actions, href: '/nl/overkappingen/' })),
  );
  return { host, unmount: () => act(() => root.unmount()) };
}

/** The menu's items, by the words they show — which means opening it first. */
async function itemsOf(host) {
  await act(async () => {
    host.querySelector('[data-slot="dropdown-menu-trigger"]').click();
  });
  // The content is portalled onto the body, so the menu is not under the host that drew it.
  return [...document.querySelectorAll('[data-slot="dropdown-menu-item"]')].map(
    (item) => item.textContent,
  );
}

function drawRecheck(page = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const reading = headerReading({
    review: null,
    annotations: { priority: null, note: null },
    notWritingReason: null,
    recheckAvailable: true,
    ...page,
  });
  act(() =>
    root.render(
      createElement(RecheckButton, { action: reading.actions.recheck, recheck: { running: false } }),
    ),
  );
  return { host, unmount: () => act(() => root.unmount()) };
}

describe('the page menu', () => {
  it('gives the icon-only trigger a name of its own', () => {
    const { host, unmount } = drawMenu();

    const trigger = host.querySelector('[data-slot="dropdown-menu-trigger"]');
    // The glyph is not the name. A reader who cannot see it hears this.
    expect(trigger.getAttribute('aria-label')).toBe('More about this page');
    unmount();
  });

  it('holds Copy link', async () => {
    const { host, unmount } = drawMenu();

    expect(await itemsOf(host)).toEqual(['Copy link']);
    unmount();
  });

  it('keeps Re-check out of itself, as a button of its own', async () => {
    const { host, unmount } = drawMenu();

    // PRD story 28: the one action with a real cost stays visible. A menu hides its items
    // behind a press, and this is the press an editor must be able to see before making.
    expect(await itemsOf(host)).not.toContain('Re-check');
    unmount();

    const button = drawRecheck();
    expect(button.host.querySelector('button').textContent).toBe('Re-check');
    button.unmount();
  });

  it('draws no Re-check at all where the local service does not answer', () => {
    // Absent and not broken: there is no service on the webhost, and an action that cannot
    // happen must not be offered.
    const button = drawRecheck({ recheckAvailable: false });

    expect(button.host.querySelector('button')).toBeNull();
    button.unmount();
  });
});
