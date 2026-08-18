import { describe, expect, it, vi } from 'vitest';

import {
  CHECKS,
  FINDING_CLASSES,
  findingId,
  findingSetHash,
  newObservationId,
  reportFilename,
  storeOfFile,
  VISIBILITIES,
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
    const ids = [
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.001Z',
      '2026-02-01T00:00:00.000Z',
    ].map((at) => `${at}-${'zzzzzzzz'}`);
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

  it('separates a run from its first member, so an edit to any member expires it', () => {
    // Ticket 116 and ADR 0004. A `regrouped` finding's `prodNorm` is the **space-joined run**,
    // and the reason is here rather than at the matcher: keyed on the first member alone, an
    // edit to the second would leave an editor's judgement attached to text nobody judged.
    // `joinRun()` in `compare/match.mjs` is the join both this id and the coverage test read.
    const first = 'Bedankt voor het aanvragen van een samplepakket';
    const second = 'Het pakket past door de gemiddelde brievenbus';
    const run = { ...base, rule: 'regrouped', prodNorm: `${first} ${second}`, detail: 'p + p → p' };

    expect(findingId(run)).not.toBe(findingId({ ...run, prodNorm: first }));
    expect(findingId(run)).not.toBe(findingId({ ...run, prodNorm: `${first} edited` }));
    // And the detail is a term of it, so a run of two and a run of three over the same words
    // are two findings — the same reason ticket 33 gave `heading-level` its own.
    expect(findingId(run)).not.toBe(findingId({ ...run, detail: 'p + p + p → p' }));
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

/**
 * Ticket 118 and ADR 0013. The hash is what a page review's staleness is measured
 * against, so the question it must answer is *did the page change*, and the vocabulary
 * is not the page.
 */
describe('findingSetHash', () => {
  /** One finding per class, which is the widest page the vocabulary can produce. */
  const everyClass = Object.keys(FINDING_CLASSES).map((cls) => ({ id: `id-${cls}`, class: cls }));

  /*
   * These tests used to re-import `contract.mjs` over a mocked `vocabulary.mjs` with
   * every class re-triaged. The property they were reaching for is simpler and is
   * asserted directly here: the hash survives *every* future edit to `FINDING_CLASSES`
   * exactly when the vocabulary is not a term of it. Mocking the module asserted that
   * one indirection further away, and it kept a standing hazard — the mock had to
   * rebuild each vocabulary export by hand, so a new derived export would have left it
   * silently no longer modelling the edit it claimed to.
   */

  // The assertion the whole ticket exists for. Under the old hash, flipping
  // `heading-level` printed "changed since review" on all 392 pages that carry one, on a
  // day when not a word on any of those pages had moved.
  it('reads the ids, and nothing the vocabulary knows', () => {
    // A class the vocabulary has never heard of hashes to the same bytes. If the hash
    // ever consulted `FINDING_CLASSES`, this is where it would show.
    const unknown = everyClass.map((finding) => ({ ...finding, class: 'no-such-class' }));
    expect(findingSetHash(unknown)).toBe(findingSetHash(everyClass));
  });

  it.each(VISIBILITIES)('is byte-identical when every class reads as %s', (visibility) => {
    const retriaged = everyClass.map((finding) => ({ ...finding, visibility }));
    expect(findingSetHash(retriaged)).toBe(findingSetHash(everyClass));
  });

  it('is byte-identical across a flip of one single class', () => {
    // The flip this ticket unblocked has landed: ticket 86 moved `heading-level` out of
    // `work` on 2026-08-13. One class moving is the case that matters beside the sweep
    // above, because it is the shape every future re-triage has.
    expect(FINDING_CLASSES['heading-level'].visibility).toBe('information');
    const flipped = everyClass.map((finding) =>
      finding.class === 'heading-level' ? { ...finding, visibility: 'work' } : finding,
    );
    expect(findingSetHash(flipped)).toBe(findingSetHash(everyClass));
  });

  it('does not move a finding id when a class changes visibility', () => {
    // Visibility was never a term of `findingId()` and this ticket must not make it
    // one: no override detaches on the vocabulary flips this run enables.
    expect(findingId({ ...base, class: 'heading-level', visibility: 'information' })).toBe(
      findingId({ ...base, class: 'heading-level', visibility: 'work' }),
    );
  });

  it('covers a finding in a class that is not work', () => {
    // The old hash filtered these out. A human reviewed the page, not the shown
    // subset of it, so a hidden class changing now marks the review stale.
    const work = [{ id: 'A', class: 'copy' }];
    expect(findingSetHash([...work, { id: 'B', class: 'tag-changed' }])).not.toBe(
      findingSetHash(work),
    );
    expect(findingSetHash([...work, { id: 'C', class: 'text-added' }])).not.toBe(
      findingSetHash(work),
    );
  });

  it('is stable under the order the findings arrive in', () => {
    expect(findingSetHash([...everyClass].reverse())).toBe(findingSetHash(everyClass));
  });

  it('is 16 base64url characters', () => {
    expect(findingSetHash(everyClass)).toMatch(/^[A-Za-z0-9_-]{16}$/);
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

  it('keeps the unanchored sentinel, which a Windows filename may hold', () => {
    // The parenthesis is the sentinel because it survives all three writers. A
    // colon would not: it is the NTFS alternate-data-stream separator. More than
    // half of the pages carry this shape (ticket 53).
    expect(reportFilename('fr', '(fr)heavy-duty-veranda')).toBe('fr__(fr)heavy-duty-veranda.json');
    expect(reportFilename('be_fr', '(be_fr)fr/pergola')).toBe('be_fr__(be_fr)fr__pergola.json');
  });

  it('takes the store from the name it wrote, never from the sentinel', () => {
    // `(be_fr)fr/pergola` names `be_fr` in the sentinel and `fr` in its path, and
    // the store of the report is neither of those readings: it is the store the
    // crawl wrote. A reader that parsed the sentinel would file `be`'s French
    // pages under `fr` and the two dashboards would disagree.
    expect(storeOfFile(reportFilename('be_fr', '(be_fr)fr/pergola'))).toBe('be_fr');
    expect(storeOfFile(reportFilename('fr', '(fr)heavy-duty-veranda'))).toBe('fr');
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
  it('gives every class a check that exists and one visibility', () => {
    for (const [name, cls] of Object.entries(FINDING_CLASSES)) {
      expect(CHECKS, name).toContain(cls.check);
      expect(VISIBILITIES, name).toContain(cls.visibility);
      // Ticket 75: one field replacing one field. A boolean beside the enum would put
      // back the second axis ticket 02 removed, and a class that is hidden and also
      // work has no meaning.
      expect(cls, name).not.toHaveProperty('shown');
    }
  });

  it('has no fourth visibility for an excluded region', () => {
    // ADR 0005: a region leaves the log at extraction (ADR 0003), so it never reaches
    // a class. A fourth value would claim the log can see inside one and chose not to
    // report it. The log is blind there.
    expect(VISIBILITIES).toEqual(['work', 'information', 'diagnostic']);
  });

  it('is closed at 32 classes', () => {
    // Ticket 33 took it from 18 to 21: `structure` out, `text-missing`,
    // `text-added`, `heading-level` and `tag-changed` in. Ticket 54 added the
    // twenty-second, `no-declared-alternate`, and it is the first `meta` class:
    // `CHECKS` had declared the check since ticket 08 with nothing using it.
    // Ticket 96 adds the nine the head check will emit. It says 21 → 30, which was
    // written before ticket 54 landed the twenty-second class; the nine are the nine,
    // so the pin was 31. Ticket 116 adds `regrouped`, and it is the thirty-second.
    expect(Object.keys(FINDING_CLASSES).length).toBe(32);
  });

  it('has retired structure', () => {
    // The word said only "the unit is on one side only", which is a statement
    // about the alignment and not about the sites. Ticket 33 replaced it with a
    // directional pair, and any override keyed on it detaches (ticket 08).
    expect(FINDING_CLASSES).not.toHaveProperty('structure');
  });

  it('splits every one-sided text class by direction, lost is work and added is information', () => {
    expect(FINDING_CLASSES['text-missing']).toMatchObject({ check: 'text', visibility: 'work' });
    expect(FINDING_CLASSES['text-added']).toMatchObject({
      check: 'text',
      visibility: 'information',
    });
  });

  it('reads a heading-level change and diagnoses a plain tag change', () => {
    // Ticket 86: `heading-level` left `work`. A demoted heading is a heading-hierarchy
    // question, and heading hierarchy is SEO work the log has always said is somebody
    // else's phase. It is not deleted — a real difference nobody has decided about
    // would be thrown away — so it renders and it counts nowhere.
    expect(FINDING_CLASSES['heading-level']).toMatchObject({
      check: 'text',
      visibility: 'information',
    });
    expect(FINDING_CLASSES['tag-changed']).toMatchObject({
      check: 'text',
      visibility: 'diagnostic',
    });
  });

  it('gives the same direction the same visibility on all three checks', () => {
    // `missing-link`, `image-missing` and `text-missing` are one idea on three
    // checks, and an editor who learns the rule on one must not be surprised on
    // the next. The test reads `direction` rather than a list of names, so a
    // fourth one-sided class is covered on the day it is added.
    for (const [name, cls] of Object.entries(FINDING_CLASSES)) {
      if (cls.direction === 'lost') expect(cls.visibility, name).toBe('work');
      if (cls.direction === 'added') expect(cls.visibility, name).toBe('information');
    }
  });

  it('names a direction on every one-sided class, and on no other', () => {
    const withDirection = Object.entries(FINDING_CLASSES)
      .filter(([, cls]) => cls.direction)
      .map(([name]) => name)
      .sort();
    expect(withDirection).toEqual([
      'extra-link',
      'image-added',
      'image-missing',
      'meta-description-added',
      'meta-description-lost',
      'meta-title-added',
      'meta-title-lost',
      'missing-link',
      'text-added',
      'text-missing',
    ]);
  });

  it("gives no meta class an axis, which is ticket 39's question", () => {
    // Ticket 33 dropped `axis` on purpose so that ticket 39, the prefactor, would
    // still have one. Ticket 96 hands 39 a wider table and answers nothing about
    // axes, so the nine arrive without the field rather than with a guess at it.
    for (const [name, cls] of Object.entries(FINDING_CLASSES)) {
      if (cls.check === 'meta') expect(cls, name).not.toHaveProperty('axis');
    }
  });

  /*
   * The regression gate of ticket 75. It used to pin the sorted list of hidden classes,
   * and the enum splits that list in two rather than deleting it — so the pin is the
   * three groups, whole. The twelve in `work` were exactly the twelve that were
   * `shown: true`, which is what made that migration count-neutral: the denominator is
   * every finding in a `work` class and nothing else. Two tickets have moved the group
   * since — 86 took `heading-level` out, 96 put the seven head classes in — so it is
   * eighteen now, and the pin is what makes each of those moves say so out loud.
   *
   * Ticket 116 is the third move, and the first that adds to a group instead of moving
   * between them: `regrouped` arrives `information`, so `work` is untouched and the
   * denominator does not move by the class existing. What it takes **out** of `work` is 74
   * findings of `copy` and `text-missing`, one page at a time, and no list here can pin that
   * — `crawl/probes/probe-116-regrouped-collateral.mjs` is where that number lives.
   */
  it('pins the three visibility groups', () => {
    const group = (visibility) =>
      Object.entries(FINDING_CLASSES)
        .filter(([, cls]) => cls.visibility === visibility)
        .map(([name]) => name)
        .sort();

    expect(group('work')).toEqual([
      'alt-changed',
      'alt-lost',
      'broken-link',
      'casing',
      'copy',
      'cross-store-link',
      'image-missing',
      'leakage',
      'link-target',
      'meta-casing',
      'meta-description-changed',
      'meta-description-lost',
      'meta-title-changed',
      'meta-title-lost',
      'missing-link',
      'robots-index-lost',
      'robots-noindex-lost',
      'text-missing',
    ]);
    expect(group('information')).toEqual([
      'extra-link',
      'heading-level',
      'image-added',
      'meta-description-added',
      'meta-title-added',
      'price',
      'regrouped',
      'restructured',
      'text-added',
    ]);
    expect(group('diagnostic')).toEqual([
      'campaign',
      'image-campaign',
      'no-declared-alternate',
      'redirect',
      'tag-changed',
    ]);
  });

  it('counts eighteen classes as work, seven of them the head check', () => {
    // Twelve until 2026-08-13. Ticket 75 landed the enum count-neutral at twelve, and
    // ticket 86 is the first move that was **meant** to move the denominator: one class
    // out of `work`, on its own commit, so that one number never hides two movements.
    // Ticket 96 adds seven, and moves no number: nothing emits them yet.
    const work = Object.values(FINDING_CLASSES).filter((cls) => cls.visibility === 'work');
    expect(work.length).toBe(18);
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
