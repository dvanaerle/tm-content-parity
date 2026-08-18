import { describe, expect, it } from 'vitest';
import { day, moment } from './dates.mjs';

// Noon UTC, so the calendar day is the same one in every zone an editor of this log
// sits in. The time of day is not: what the interface promises is the reader's own
// clock, so a test that pinned `14:03` would only be asserting the machine's zone.
const AT = '2026-08-17T12:00:00.000Z';

describe('one date, two lengths', () => {
  it('writes a day', () => {
    expect(day(AT)).toBe('17 Aug 2026');
  });

  it('writes a moment as the day and the time of day', () => {
    expect(moment(AT)).toMatch(/^17 Aug 2026, \d{2}:\d{2}$/);
  });

  // The one thing a moment must not carry. A decision is not recorded to the second,
  // and a timestamp more precise than the thing it describes reads as an assertion.
  it('drops the seconds', () => {
    expect(moment('2026-08-17T12:00:27.000Z')).toBe(moment('2026-08-17T12:00:41.000Z'));
  });
});
