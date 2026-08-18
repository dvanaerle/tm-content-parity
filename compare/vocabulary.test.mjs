import { describe, expect, it } from 'vitest';
import { FINDING_CLASSES } from './vocabulary.mjs';

/**
 * The label is what an editor reads; the key is what the contract stores. ADR 0019 puts
 * the label here rather than in the web layer, so these three assertions are what stops
 * the thirty-second class arriving unnamed, keyed or ambiguous.
 */
describe('every class is named for an editor', () => {
  const entries = Object.entries(FINDING_CLASSES);

  it('carries a label', () => {
    const unnamed = entries.filter(([, record]) => !record.label?.trim()).map(([cls]) => cls);
    expect(unnamed).toEqual([]);
  });

  // A label equal to its key is a class that was never named — the field was filled to
  // pass the test above, and an editor still reads the contract key.
  it('never labels a class with its own key', () => {
    const keyed = entries
      .filter(([cls, record]) => record.label.toLowerCase() === cls.toLowerCase())
      .map(([cls]) => cls);
    expect(keyed).toEqual([]);
  });

  // Two classes reading the same words is worse than a key: the editor cannot tell which
  // of the two they are deciding, and nothing on the row says.
  it('gives no two classes the same label', () => {
    const seen = new Map();
    const shared = [];
    for (const [cls, record] of entries) {
      const already = seen.get(record.label);
      if (already) shared.push(`${record.label} — ${already} and ${cls}`);
      seen.set(record.label, cls);
    }
    expect(shared).toEqual([]);
  });

  // Sentence case, because ADR 0019 spends capitals on a table's own heading row and
  // nowhere else. A label is drawn mid-sentence in the filter strip as well as in a pill.
  it('writes a label in sentence case', () => {
    const shouted = entries
      .filter(
        ([, record]) => record.label !== record.label.replace(/\B[A-Z]/g, (c) => c.toLowerCase()),
      )
      .map(([cls]) => cls);
    expect(shouted).toEqual([]);
  });
});
