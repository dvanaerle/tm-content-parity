import { describe, expect, it } from 'vitest';

import { refusalReason } from './link-status.mjs';

// Ticket 59. The rule fires on an input nobody sends on purpose, so a run of the
// script is not a test of it. The four scripts beside this one all take a store,
// so the mistake is a keystroke away, and the cost of it is a compare that
// reports no `broken-link` and no `redirect` at all.
describe('refusalReason', () => {
  it('lets a run with no argument through', () => {
    expect(refusalReason([])).toBe(null);
  });

  it('refuses every store name, and any other word', () => {
    for (const argument of ['nl', 'be', 'be_fr', 'de', 'fr', 'uk', '--store=nl', 'overkappingen']) {
      expect(refusalReason([argument])).toContain(argument);
    }
  });

  it('refuses more than one argument, and names each one', () => {
    const message = refusalReason(['nl', 'be']);
    expect(message).toContain('`nl`');
    expect(message).toContain('`be`');
  });

  // The message is the whole guard: it stops a person who typed the argument on
  // purpose, and only the reason does that.
  it('gives the reason, and the way to run it', () => {
    const message = refusalReason(['be']);
    expect(message).toContain('data/link-status.json');
    expect(message).toMatch(/keyed on the target url/i);
    expect(message).toMatch(/every store/i);
    expect(message).toMatch(/no broken-link and no redirect/i);
    expect(message).toMatch(/run it with no argument/i);
  });
});
