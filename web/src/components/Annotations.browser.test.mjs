import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { Section } from './Annotations.jsx';

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

function mount(props) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(createElement(Section, { sides, ...props })));
  return () => act(() => root.unmount());
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
    // The 1,622 findings that used to render nothing at all: `Section` gated the whole
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
