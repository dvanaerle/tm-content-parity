import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, it } from 'vitest';
import Shell from './Shell.astro';

/**
 * The header used to be a fixed `h-16` with a comment saying nothing in it could wrap.
 * Six store pills, a logo and an inset are a fixed cost in a fixed-height bar, so the
 * bar's own answer to running out of room was to overflow — and the switcher is the
 * control every page reaches the rest of the log through.
 */
const header = async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Shell, { props: { title: 'Dashboard' } });
  return html.match(/<header[\s\S]*?<\/header>/)?.[0] ?? '';
};

it('lets the header run onto a second line', async () => {
  expect(await header()).toContain('flex-wrap');
});

it('keeps the bar sixteen units tall as a floor and not as a ceiling', async () => {
  const drawn = await header();
  expect(drawn).toContain('min-h-16');
  // `min-h-16` contains `h-16`, and a word boundary does not see the hyphen in front of it.
  expect(drawn).not.toMatch(/(?<![\w-])h-16\b/);
});
