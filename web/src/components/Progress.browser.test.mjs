import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { LogBanner } from './Progress.jsx';

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
