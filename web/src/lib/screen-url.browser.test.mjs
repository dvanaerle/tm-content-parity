import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { MIRROR_DELAY, useScreen } from './screen-url.mjs';

/**
 * `useScreen` in a real browser (ticket 109).
 *
 * The two questions here are about `window.history` and about hydration, and neither
 * can be answered by a pretend browser: what we want to know is whether the real one
 * does what the hook assumes. So this file runs under `vitest --browser`.
 *
 * There is no component library involved. The hook is mounted in a throwaway component
 * that reports what it was handed, which keeps the seam the hook's own return value
 * rather than some markup drawn around it.
 */

/** Mount `useScreen` and hand back a handle on what it returned. */
function mount() {
  const seen = { screen: null, patch: null, search: null, renders: 0 };

  function Probe() {
    const held = useScreen();
    seen.screen = held.screen;
    seen.patch = held.patch;
    seen.search = held.search;
    seen.renders += 1;
    return null;
  }

  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(createElement(Probe)));

  return { seen, unmount: () => act(() => root.unmount()) };
}

afterEach(() => {
  history.replaceState(null, '', location.pathname);
  document.body.innerHTML = '';
});

/**
 * Wait for the mirror. It is debounced, for the reason `useScreen()` gives — the search
 * box would otherwise write once per keystroke — so every assertion about the address bar
 * has to be taken after it has fired rather than in the same tick as the change.
 */
const mirrored = () => act(async () => {
  await new Promise((done) => setTimeout(done, MIRROR_DELAY * 2));
});

describe('useScreen', () => {
  // The case the ticket exists for, from the receiving end: an editor presses Back onto
  // a dashboard whose URL carries a filter, and the pills have to come back on.
  it('restores the screen the address bar carries', () => {
    history.replaceState(null, '', '?weergave=pages&soort=copy');

    const { seen, unmount } = mount();

    expect(seen.screen.view).toBe('pages');
    expect(seen.screen.classes).toEqual(['copy']);
    unmount();
  });

  // The guard that is easy to get wrong and silent when it is: the URL is read in an
  // effect, so the mirror must not fire before that read or it writes the default
  // screen over the query it was about to restore.
  it('does not wipe the query it is about to read', () => {
    history.replaceState(null, '', '?soort=copy');

    const { seen, unmount } = mount();

    expect(location.search).toBe('?soort=copy');
    expect(seen.screen.classes).toEqual(['copy']);
    unmount();
  });

  it('writes a change into the address bar', async () => {
    const { seen, unmount } = mount();
    expect(location.search).toBe('');

    act(() => seen.patch({ classes: ['casing'] }));
    await mirrored();

    expect(location.search).toBe('?soort=casing');
    unmount();
  });

  // The reason the mirror is debounced: typing a word is one screen per keystroke, and
  // Safari throttles `replaceState` and starts dropping the calls. What must survive is
  // the **last** write, so the address bar agrees with the screen once the typing stops.
  it('writes once for a burst of changes, and writes the last one', async () => {
    const { seen, unmount } = mount();

    for (const query of ['t', 'te', 'ter', 'terras']) act(() => seen.patch({ query }));
    expect(location.search).toBe('');

    await mirrored();

    expect(location.search).toBe('?zoek=terras');
    unmount();
  });

  // Clearing the last filter clears the `?` as well, rather than leaving an empty one
  // behind for every reader to copy.
  it('leaves no empty question mark behind', async () => {
    const { seen, unmount } = mount();
    act(() => seen.patch({ classes: ['casing'] }));
    await mirrored();

    act(() => seen.patch({ classes: [] }));
    await mirrored();

    expect(location.search).toBe('');
    expect(location.href.endsWith('?')).toBe(false);
    unmount();
  });

  // `replaceState` and never `pushState`. Toggling a pill is not a place to go back to,
  // and ten presses would put ten entries between the editor and the screen they came
  // from — which is the whole thing this hook exists to protect.
  it('adds no history entry, however many times the screen changes', async () => {
    const before = history.length;
    const { seen, unmount } = mount();

    act(() => seen.patch({ classes: ['casing'] }));
    await mirrored();
    act(() => seen.patch({ view: 'pages' }));
    await mirrored();
    act(() => seen.patch({ query: 'veranda' }));
    await mirrored();

    expect(history.length).toBe(before);
    unmount();
  });
});
