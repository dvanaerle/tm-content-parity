import { describe, expect, it } from 'vitest';

import { CHECKS, FINDING_CLASSES, findingId, muteKey } from './contract.mjs';

const base = {
  store: 'nl',
  page: 'overkappingen',
  check: 'text',
  rule: 'copy',
  prodNorm: 'Levering in 5 werkdagen',
  newNorm: 'Levering in 5 werkdagen.',
};

describe('findingId', () => {
  it('is deterministic', () => {
    expect(findingId(base)).toBe(findingId({ ...base }));
  });

  it('is 16 base64url characters', () => {
    expect(findingId(base)).toMatch(/^[A-Za-z0-9_-]{16}$/);
  });

  it.each(['store', 'page', 'check', 'rule', 'prodNorm', 'newNorm'])(
    'changes when %s changes',
    (part) => {
      expect(findingId({ ...base, [part]: 'different' })).not.toBe(findingId(base));
    },
  );

  it('keeps letter case, so a casing finding can exist', () => {
    expect(findingId({ ...base, newNorm: base.newNorm.toUpperCase() })).not.toBe(findingId(base));
  });

  it('treats a missing side as an empty side', () => {
    expect(findingId({ ...base, newNorm: null })).toBe(findingId({ ...base, newNorm: '' }));
  });

  it('does not collide on a leading status string', () => {
    // The prototype cut the key itself, not a hash. The leading status string
    // used the whole 16-character budget, and 156 findings fell to 88 ids.
    const ids = new Set(
      Array.from({ length: 200 }, (_, n) =>
        findingId({ ...base, prodNorm: `Onze prijs is nu ${n} euro per stuk` }),
      ),
    );
    expect(ids.size).toBe(200);
  });
});

describe('muteKey', () => {
  it('is store, page and class, and holds no content', () => {
    expect(muteKey({ store: 'nl', page: 'overkappingen', class: 'price' })).toBe(
      'nl|overkappingen|price',
    );
  });
});

describe('FINDING_CLASSES', () => {
  it('gives every class a check that exists and a default', () => {
    for (const [name, cls] of Object.entries(FINDING_CLASSES)) {
      expect(CHECKS, name).toContain(cls.check);
      expect(typeof cls.shown, name).toBe('boolean');
    }
  });

  it('shows copy, structure and casing, and hides restructured, price and campaign', () => {
    const shown = Object.entries(FINDING_CLASSES)
      .filter(([, cls]) => cls.check === 'text' && cls.shown)
      .map(([name]) => name);
    expect(shown.sort()).toEqual(['casing', 'copy', 'structure']);
  });
});
