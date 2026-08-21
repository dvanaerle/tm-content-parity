import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import StoreSwitcher from './StoreSwitcher.astro';

/**
 * The switcher is in the shell of every page, so what it draws when the log holds one
 * store is not a corner: it is what a first crawl looks like, and a single pill reading
 * `nl` beside a logo is a control that cannot be used for anything.
 */

/** @type {AstroContainer} */
let container;

beforeAll(async () => {
  container = await AstroContainer.create();
});

/** @param {string[]} stores */
const render = (stores) =>
  container.renderToString(StoreSwitcher, { props: { stores, store: stores[0] } });

describe('the store switcher', () => {
  it('offers the stores when the log holds more than one', async () => {
    const html = await render(['nl', 'de', 'fr']);
    expect(html).toContain('href="/de/"');
    expect(html).toContain('href="/fr/"');
  });

  it('draws nothing when the log holds one store', async () => {
    expect(await render(['nl'])).toBe('');
  });

  /**
   * Ticket 129. The country name explained the id in a `title`, which a touch reader cannot
   * see and a keyboard reader cannot reach. It is in the link's **name** now — the one hint
   * in the interface that `Hint.jsx` does not draw, because a tooltip here is a React island
   * in the header of every page of the site. The label is the id and the country both, so the
   * word an editor learned is still the word on the screen.
   */
  it('explains each store id in the name of its link, and never in a title', async () => {
    const html = await render(['nl', 'de']);
    expect(html).toContain('aria-label="de — Germany"');
    expect(html).not.toContain('title=');
  });
});
