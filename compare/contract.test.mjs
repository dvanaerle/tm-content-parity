import { describe, expect, it, vi } from 'vitest';

import {
  CHECKS,
  FINDING_CLASSES,
  findingId,
  muteKey,
  newObservationId,
  reportFilename,
  storeOfFile,
} from './contract.mjs';

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

/**
 * The report filename carries the store, and `web/` reads it back out. That makes
 * it contract data, so the pair is tested here and not beside either caller.
 */
describe('reportFilename', () => {
  it('flattens a page key that holds a slash', () => {
    expect(reportFilename('nl', 'faq/productinformatie')).toBe('nl__faq__productinformatie.json');
  });

  it('round-trips the store it wrote', () => {
    expect(storeOfFile(reportFilename('be_fr', 'carports'))).toBe('be_fr');
  });
});

/**
 * One rule with judgement in it: the store is read back from the name so that one
 * store's dashboard opens one store's files. The judgement is that a prefix match
 * is safe here.
 */
describe('storeOfFile', () => {
  it('reads the store from the report filename', () => {
    expect(storeOfFile('nl__overkappingen.json')).toBe('nl');
    expect(storeOfFile('de__faq__productinformatie.json')).toBe('de');
  });

  it('does not read be_fr as be', () => {
    // `be` is a prefix of `be_fr`, and the two stores share a host as well. The
    // separator is what makes the match exact, so it is part of the match.
    expect(storeOfFile('be_fr__carports.json')).toBe('be_fr');
    expect(storeOfFile('be__carports.json')).toBe('be');
  });

  it('claims no store for a name it does not recognise', () => {
    expect(storeOfFile('snapshot.json')).toBeNull();
    expect(storeOfFile('nlx__overkappingen.json')).toBeNull();
  });
});

describe('FINDING_CLASSES', () => {
  it('gives every class a check that exists and a default', () => {
    for (const [name, cls] of Object.entries(FINDING_CLASSES)) {
      expect(CHECKS, name).toContain(cls.check);
      expect(typeof cls.shown, name).toBe('boolean');
    }
  });

  it('is closed at 21 classes', () => {
    // Ticket 33 took it from 18 to 21: `structure` out, `text-missing`,
    // `text-added`, `heading-level` and `tag-changed` in.
    expect(Object.keys(FINDING_CLASSES).length).toBe(21);
  });

  it('has retired structure', () => {
    // The word said only "the element is on one side only", which is a statement
    // about the alignment and not about the sites. Ticket 33 replaced it with a
    // directional pair, and any override keyed on it detaches (ticket 08).
    expect(FINDING_CLASSES).not.toHaveProperty('structure');
  });

  it('splits every one-sided text class by direction, shown lost and hidden added', () => {
    expect(FINDING_CLASSES['text-missing']).toMatchObject({ check: 'text', shown: true });
    expect(FINDING_CLASSES['text-added']).toMatchObject({ check: 'text', shown: false });
  });

  it('shows a heading-level change and hides a plain tag change', () => {
    expect(FINDING_CLASSES['heading-level']).toMatchObject({ check: 'text', shown: true });
    expect(FINDING_CLASSES['tag-changed']).toMatchObject({ check: 'text', shown: false });
  });

  it('gives the same direction the same default on all three checks', () => {
    // `missing-link`, `image-missing` and `text-missing` are one idea on three
    // checks, and an editor who learns the rule on one must not be surprised on
    // the next. The test reads `direction` rather than a list of names, so a
    // fourth one-sided class is covered on the day it is added.
    for (const [name, cls] of Object.entries(FINDING_CLASSES)) {
      if (cls.direction === 'lost') expect(cls.shown, name).toBe(true);
      if (cls.direction === 'added') expect(cls.shown, name).toBe(false);
    }
  });

  it('names a direction on every one-sided class, and on no other', () => {
    const withDirection = Object.entries(FINDING_CLASSES)
      .filter(([, cls]) => cls.direction)
      .map(([name]) => name)
      .sort();
    expect(withDirection).toEqual([
      'extra-link', 'image-added', 'image-missing', 'missing-link', 'text-added', 'text-missing',
    ]);
  });

  it('shows copy, casing, text-missing and heading-level, and hides the rest of text', () => {
    const byDefault = (shown) => Object.entries(FINDING_CLASSES)
      .filter(([, cls]) => cls.check === 'text' && cls.shown === shown)
      .map(([name]) => name)
      .sort();
    expect(byDefault(true)).toEqual(['casing', 'copy', 'heading-level', 'text-missing']);
    expect(byDefault(false)).toEqual([
      'campaign', 'price', 'restructured', 'tag-changed', 'text-added',
    ]);
  });
});

describe('findingId across ticket 33', () => {
  it('does not move for a class the ticket did not touch', () => {
    // Ticket 08: `rule` is the class id, so a re-classification detaches an
    // override. That cost is paid by `structure` alone and must not spread.
    expect(findingId(base)).toBe('7i2HEm3xn0h-9hr1');
  });

  it('is the same id with no detail as without the field at all', () => {
    // `detail` joins the key only when it is present, which is what keeps the
    // literal above true for the 19 classes that never carry one.
    expect(findingId({ ...base, detail: null })).toBe(findingId(base));
    expect(findingId({ ...base, detail: '' })).toBe(findingId(base));
  });

  it('separates two heading demotions of the same words', () => {
    // The whole reason `detail` exists. Both sides of text are equal on
    // `heading-level`, so without it an `h2` → `h3` and an `h2` → `h4` are one
    // id, and making the demotion worse would keep the editor's dismissal.
    const level = { ...base, rule: 'heading-level', newNorm: base.prodNorm };
    const toH3 = findingId({ ...level, detail: 'h2 → h3' });
    const toH4 = findingId({ ...level, detail: 'h2 → h4' });
    expect(toH3).not.toBe(toH4);
    expect(toH3).not.toBe(findingId(level));
  });
});
