import { act, createElement, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Section } from './Annotations.jsx';
import { PageDetailsDialog } from './Annotate.jsx';
import { PageMenu } from './Progress.jsx';
import { headerReading } from '../lib/page-header.mjs';

/**
 * The two deep links a finding row offers, mounted and read (ticket 34, criterion 9).
 *
 * It is a browser test rather than a unit test because the defect is in the *call site*:
 * `locate.mjs` builds a correct fragment from whatever text it is handed, and every unit
 * test of it passes. What is wrong is which text each link is handed, and that decision
 * lives in the `.jsx`. This repo has been here before — ticket 31 shipped 628 green unit
 * tests over an island that threw on render.
 *
 * The invariant, and the reason a link exists at all: **a link opens a page at some text,
 * so the text it carries has to be on the page it opens.** A fragment that names text the
 * page does not contain resolves to nothing and scrolls nowhere, and the browser reports
 * no error — so a broken link and a working one look identical to the editor until they
 * click it.
 */

const PROD_URL = 'https://www.tuinmaximaal.nl/overkappingen';
const NEW_URL = 'https://new.tuinmaximaal.nl/overkappingen';

const sides = { production: { url: PROD_URL }, new: { url: NEW_URL } };

/**
 * The page as each side words it. Production's `Kleuren en RAL` became `Kleuren en
 * kleurkeuze` on the new site — the case the criterion is about, and the case the compare
 * stage really produces: verified against `textFindings()` on this outline, which gives a
 * `copy` finding on the paragraph below with `anchorHeading: 'Kleuren en RAL'`.
 */
const RENDERED = {
  [PROD_URL]: ['Onze overkappingen', 'Kleuren en RAL', 'Antraciet en creme'],
  [NEW_URL]: ['Onze overkappingen', 'Kleuren en kleurkeuze', 'Antraciet en cremewit'],
};

/** The element the component under test was rendered into, for asking what it drew. */
let host = null;

function mount(props) {
  host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(createElement(Section, { sides, ...props })));
  return () => {
    act(() => root.unmount());
    host.remove();
  };
}

/**
 * Every deep link on the row, as `{ url, text }` — the page it opens and the words it
 * asks that page to scroll to, pulled back out of the `#:~:text=` directive.
 *
 * The `start,end` form is split on the comma so a long fragment is checked at both ends,
 * which is the form `textFragmentUrl()` emits above twelve words.
 */
const links = () =>
  [...document.querySelectorAll('a')].map((anchor) => {
    const [url, fragment] = anchor.getAttribute('href').split('#:~:text=');
    // A link with no fragment opens the page itself, which is what a finding above the
    // first heading with no words of its own gets. It asks for no text, so it names none.
    return {
      url,
      text: fragment ? fragment.split(',').map(decodeURIComponent) : [],
      title: anchor.title,
    };
  });

let unmount = () => {};
afterEach(() => unmount());

describe('the deep links on a finding row', () => {
  it('carries text that is on the page it opens, for production and for the new site', () => {
    // The finding is the changed paragraph under the renamed heading.
    unmount = mount({
      anchorHeading: 'Kleuren en RAL',
      locations: {
        production: { heading: 'Kleuren en RAL', text: 'Antraciet en creme' },
        new: { heading: 'Kleuren en kleurkeuze', text: 'Antraciet en cremewit' },
      },
    });

    const found = links();
    expect(found).toHaveLength(2);

    for (const link of found) {
      for (const words of link.text) {
        expect(
          RENDERED[link.url],
          `“${words}” is not on ${link.url}, so ${link.title} scrolls nowhere`,
        ).toContain(words);
      }
    }
  });

  it('still offers both links for a finding that sits above the first heading', () => {
    // The 1,522 rows that used to render nothing at all: `Section` gated the whole
    // block on the heading, so a finding above the page's first one lost its links
    // along with its section name. It has words of its own, and they are what the link
    // was always meant to aim at.
    unmount = mount({
      anchorHeading: null,
      locations: {
        production: { heading: null, text: 'Onze overkappingen' },
        new: { heading: null, text: 'Onze overkappingen' },
      },
    });

    expect(links().map((link) => link.url)).toEqual([PROD_URL, NEW_URL]);
    // No section to name, so the row says nothing about one rather than saying `under
    // “null”`.
    expect(document.body.textContent).not.toContain('under');
  });

  it('draws nothing at all when it has nothing to say', () => {
    // A report written before `locations` existed, which is the shape the ticket's own
    // note warns about: both links fall away and there is no section to name. The row
    // must then render **nothing**, not an empty strip holding two absent links.
    unmount = mount({ anchorHeading: null, locations: null });

    // The host itself, not `document.body`: the row must draw **nothing**, and an empty
    // strip is a `<div>` with no text in it, so text alone would not catch one.
    expect(host.innerHTML).toBe('');
  });

  it('offers no link for a side the finding is not on', () => {
    // A paragraph production has and the new site does not. The row still names the
    // section it was in, because that is where an editor goes looking for it.
    unmount = mount({
      anchorHeading: 'Kleuren en RAL',
      locations: {
        production: { heading: 'Kleuren en RAL', text: 'Antraciet en creme' },
        new: null,
      },
    });

    expect(links().map((link) => link.url)).toEqual([PROD_URL]);
    expect(document.body.textContent).toContain('under “Kleuren en RAL”');
  });
});

/**
 * The dialog the page's annotations moved into (ui-polish ticket 10).
 *
 * It sits in this file rather than in a new one because the ticket opens no new browser
 * seam, and the components it drives — `PageAnnotations`' priority picker and note input —
 * are the page-annotation surface these assertions are about. The module they live in is
 * `Annotate.jsx`; the assertions are here.
 *
 * **A dialog and not a popover, and one test says why.** A popover dismisses on an outside
 * click, and an editor halfway through typing a note about a page is exactly the person who
 * clicks away to check something. The surviving note below is that reason written as an
 * assertion, and it is the one test in here that is not optional.
 */
const NOTHING = { priority: null, note: null };

function openDialog({ page = {}, annotations = NOTHING, review = null, append, closed } = {}) {
  const dialogHost = document.createElement('div');
  document.body.append(dialogHost);
  const root = createRoot(dialogHost);
  const { actions } = headerReading({
    review,
    annotations,
    notWritingReason: null,
    recheckAvailable: true,
    ...page,
  });
  act(() =>
    root.render(
      createElement(PageDetailsDialog, {
        open: true,
        onOpenChange: (next) => closed?.(next),
        annotations,
        findingSetHash: 'abc',
        append: append ?? (async () => true),
        actions,
      }),
    ),
  );
  return {
    // Portalled onto the body, so the dialog is not under the host that drew it.
    popup: () => document.querySelector('[data-slot="dialog-content"]'),
    noteBox: () => document.querySelector('input[aria-label="A note about this page"]'),
    button: (words) =>
      [...document.querySelectorAll('[data-slot="dialog-content"] button')].find(
        (control) => control.textContent === words,
      ),
    unmount: () => {
      act(() => root.unmount());
      dialogHost.remove();
    },
  };
}

/**
 * What the browser does when an editor types, so React's own handler runs.
 *
 * The value goes through the **prototype's** setter rather than the element's own. React
 * replaces `value` on the instance with a tracked property, so a plain `input.value = …`
 * updates the node and leaves React's cache agreeing with it — the change event then looks
 * like no change and `onChange` never fires. This is the same node the browser writes to.
 */
function type(input, text) {
  const { set } = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  act(() => {
    set.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

/**
 * The menu and the dialog wired the way the page wires them, because the connection between
 * them is the thing being asserted and neither component holds it alone.
 */
function PageWithMenu() {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const { actions } = headerReading({
    review: null,
    annotations: NOTHING,
    notWritingReason: null,
    recheckAvailable: true,
  });

  return createElement(
    'div',
    null,
    createElement(PageMenu, {
      actions,
      href: '/nl/overkappingen/',
      triggerRef: trigger,
      onEditDetails: () => setOpen(true),
      onMarkReviewed: () => {},
    }),
    createElement(PageDetailsDialog, {
      open,
      onOpenChange: setOpen,
      annotations: NOTHING,
      findingSetHash: 'abc',
      append: async () => true,
      actions,
      finalFocus: trigger,
    }),
  );
}

describe('the page details dialog', () => {
  it('carries the priority and the note, and shows the note while it is edited', () => {
    const dialog = openDialog({
      annotations: { priority: 'high', note: 'The hero image is still the old one.' },
    });

    // The three priorities, relocated and not redesigned.
    expect(dialog.popup().textContent).toContain('High');
    // The note is in the box, so the page does not hide the note it is asking about.
    expect(dialog.noteBox().value).toBe('The hero image is still the old one.');
    dialog.unmount();
  });

  it('keeps a half-typed note through a click outside itself', () => {
    const dialog = openDialog();

    type(dialog.noteBox(), 'The footer still says 2024 and the');
    act(() => {
      document.body.click();
    });

    // Still open, and still holding what was typed. This is the whole reason it is a dialog.
    expect(dialog.popup()).not.toBeNull();
    expect(dialog.noteBox().value).toBe('The footer still says 2024 and the');
    dialog.unmount();
  });

  it('closes on a stored note and stays open when the write fails', async () => {
    const shut = [];
    const stored = openDialog({ append: async () => true, closed: (next) => shut.push(next) });
    type(stored.noteBox(), 'The footer still says 2024.');
    await act(async () => stored.button('Save note').click());

    expect(shut).toEqual([false]);
    stored.unmount();

    const dropped = [];
    const failing = openDialog({ append: async () => false, closed: (next) => dropped.push(next) });
    type(failing.noteBox(), 'The footer still says 2024.');
    await act(async () => failing.button('Save note').click());

    // A dialog that closed either way would report a dropped write as a saved one.
    expect(dropped).toEqual([]);
    expect(failing.popup()).not.toBeNull();
    failing.unmount();
  });

  it('stays put when a priority is pressed, so one visit is one task', async () => {
    const shut = [];
    const dialog = openDialog({ closed: (next) => shut.push(next) });

    await act(async () => dialog.button('High').click());

    // A priority is a toggle and not a submission. Closing here would throw an editor out
    // between setting a priority and writing the note they came to write.
    expect(shut).toEqual([]);
    dialog.unmount();
  });

  it('says it cannot save before anything is typed, when the log is read-only', () => {
    const READ_ONLY = 'The log does not answer, so this is read-only.';
    const dialog = openDialog({ page: { notWritingReason: READ_ONLY } });

    // The reason `whyNotWriting()` gives, and not a second wording of it.
    expect(dialog.popup().textContent).toContain(READ_ONLY);
    expect(dialog.noteBox().disabled).toBe(true);
    dialog.unmount();
  });

  it('acts on the review beside the annotations, and only where there is one to act on', () => {
    const none = openDialog();
    expect(none.button('Clear the review')).toBeUndefined();
    expect(none.button('Mark again')).toBeUndefined();
    none.unmount();

    const fresh = openDialog({
      review: { editor: 'Dylan', at: '2026-08-19T09:00:00.000Z', fresh: true },
    });
    expect(fresh.button('Clear the review')).toBeDefined();
    // Nothing to mark again on a review that still matches the page.
    expect(fresh.button('Mark again')).toBeUndefined();
    fresh.unmount();

    const stale = openDialog({
      review: { editor: 'Dylan', at: '2026-08-19T09:00:00.000Z', fresh: false },
    });
    expect(stale.button('Mark again')).toBeDefined();
    stale.unmount();
  });

  it('opens the dialog from the menu, and hands the focus back on close', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    act(() => root.render(createElement(PageWithMenu)));

    const trigger = host.querySelector('[data-slot="dropdown-menu-trigger"]');
    await act(async () => trigger.click());
    const item = [...document.querySelectorAll('[data-slot="dropdown-menu-item"]')].find(
      (each) => each.textContent === 'Edit page details',
    );
    await act(async () => item.click());

    expect(document.querySelector('[data-slot="dialog-content"]')).not.toBeNull();

    await act(async () => {
      document.querySelector('[data-slot="dialog-close"]').click();
    });

    // The trigger an editor came from, and not the body. The menu item they pressed is gone
    // by now, so the focus has to be aimed rather than restored — which is what `finalFocus`
    // is for and why the dialog is handed the trigger.
    //
    // Waited for, because the close is animated and the focus moves when it finishes. A bare
    // assertion here would read the frame in which the dialog is still on screen.
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    act(() => root.unmount());
    host.remove();
  });
});
