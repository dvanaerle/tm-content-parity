import { describe, expect, it } from 'vitest';

import { anchorHeadingSlot, muteKey, namesSection } from './mute-key.mjs';

describe('muteKey', () => {
  const place = { store: 'nl', page: 'overkappingen', class: 'price' };

  it('is store, page, class and the section, and holds no content', () => {
    expect(muteKey({ ...place, anchorHeading: 'Prijzen' })).toBe(
      'nl|overkappingen|price|#Prijzen',
    );
  });

  it('is the same key with the heading absent for the page-wide form', () => {
    expect(muteKey(place)).toBe('nl|overkappingen|price|*page');
  });

  it('gives the content before the first heading a slot of its own', () => {
    // ADR 0008: a null anchor heading is a real section, and it must not read as
    // the whole page. Both are "no heading" in the payload.
    expect(muteKey({ ...place, anchorHeading: null })).toBe('nl|overkappingen|price|*none');
    expect(muteKey({ ...place, anchorHeading: null })).not.toBe(muteKey(place));
  });

  it('cannot be reached by a heading spelled like a slot', () => {
    expect(muteKey({ ...place, anchorHeading: '*page' })).not.toBe(muteKey(place));
    expect(muteKey({ ...place, anchorHeading: '*none' })).not.toBe(
      muteKey({ ...place, anchorHeading: null }),
    );
  });
});

describe('namesSection', () => {
  it.each([
    ['a named heading', { anchorHeading: 'Prijzen' }, true],
    ['a null heading, which is a real section', { anchorHeading: null }, true],
    ['an absent heading, which is the page-wide form', {}, false],
    ['an explicit undefined, which is the same as absent', { anchorHeading: undefined }, false],
  ])('%s', (_name, parts, expected) => {
    expect(namesSection(parts)).toBe(expected);
  });
});

describe('the file it lives in', () => {
  it('imports nothing, so an island that reaches it still builds', async () => {
    // Ticket 88 put this key in the browser. It lived in compare/contract.mjs,
    // which imports node:crypto for findingId(), and a Vite build of an island
    // that reaches that file fails. ADR 0001 puts a rule three stages read here.
    const source = await import('node:fs/promises')
      .then((fs) => fs.readFile(new URL('./mute-key.mjs', import.meta.url), 'utf8'));
    expect(source).not.toMatch(/^import /m);
  });

  it('gives the same slot as the generated column in supabase/schema.sql', async () => {
    const schema = await import('node:fs/promises')
      .then((fs) => fs.readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'));

    // The SQL case expression, read back as the three literals it can return.
    expect(schema).toMatch(/anchor_heading_slot text generated always as \(/);
    for (const slot of ['*page', '*none', "'#' || anchor_heading"]) {
      expect(schema).toContain(slot);
    }
    expect(anchorHeadingSlot({})).toBe('*page');
    expect(anchorHeadingSlot({ anchorHeading: null })).toBe('*none');
    expect(anchorHeadingSlot({ anchorHeading: 'Kop' })).toBe('#Kop');
  });
});
