import { describe, expect, it, vi } from 'vitest';

import { CHECKS, FINDING_CLASSES, findingId, muteKey, newObservationId } from './contract.mjs';

const base = {
  store: 'nl',
  page: 'overkappingen',
  check: 'text',
  rule: 'copy',
  prodNorm: 'Levering in 5 werkdagen',
  newNorm: 'Levering in 5 werkdagen.',
};

// `isContradicted()` in overrides/state.mjs compares two of these with `<` and
// calls the result "later". That is a rule, so it has a test: it holds only
// while the format is fixed-width and time-ordered, and nothing else here would
// fail if the format changed.
describe('newObservationId', () => {
  it('sorts later than an id made a millisecond before it', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-08-06T10:00:00.000Z'));
      const earlier = newObservationId();
      vi.setSystemTime(new Date('2026-08-06T10:00:00.001Z'));
      const later = newObservationId();
      expect(earlier < later).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('sorts by time, not by the random tail', () => {
    const ids = ['2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.001Z', '2026-02-01T00:00:00.000Z']
      .map((at) => `${at}-${'zzzzzzzz'}`);
    expect([...ids].reverse().sort()).toEqual(ids);
  });

  it('is a fixed-width ISO 8601 UTC stamp and a tail', () => {
    expect(newObservationId()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z-[0-9a-f]{8}$/);
  });

  it('separates two runs in the same millisecond', () => {
    const many = new Set(Array.from({ length: 50 }, () => newObservationId()));
    expect(many.size).toBe(50);
  });
});

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
