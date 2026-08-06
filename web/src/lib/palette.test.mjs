import { describe, expect, it } from 'vitest';
import { BANNER, FILL, INK, PILL, SOLID, SURFACE, TOKEN, severityTone } from './palette.mjs';

/**
 * `palette.mjs` holds two rules with judgement in them, and the repo says a rule
 * with no test is not a rule. The thresholds are one. The other is the reservation
 * that makes the diff readable: red and green mean direction and never status.
 */

describe('severityTone', () => {
  it('reads no difference as information, not as success', () => {
    // A page with nothing to answer for is blue. Green is `added` and it must not
    // also mean "done", or the dashboard and the diff disagree about the hue.
    expect(severityTone(0)).toBe('info');
  });

  it('reads a minority of the page as attention and a majority as severe', () => {
    expect(severityTone(0.01)).toBe('attention');
    expect(severityTone(0.5)).toBe('attention');
    expect(severityTone(0.51)).toBe('severe');
    expect(severityTone(1)).toBe('severe');
  });

  it('never reads a share as a direction', () => {
    // However much of a page differs, the share is a status. An editor who saw the
    // bar go red would read the whole page as lost content.
    const shares = [0, 0.25, 0.5, 0.75, 1];
    for (const share of shares) {
      expect(['lost', 'added']).not.toContain(severityTone(share));
    }
  });
});

describe('the tone maps', () => {
  const STATUS = ['severe', 'attention', 'info', 'neutral', 'dark'];

  it('spends the diff colours on direction only', () => {
    for (const map of [PILL, SOLID, FILL, BANNER, INK]) {
      for (const tone of STATUS) {
        expect(map[tone] ?? '').not.toMatch(/lost|added/);
      }
    }
  });

  it('gives severe and attention different pixels', () => {
    // They were the same string, so an error banner and a not-connected banner
    // printed the same shape and a reader could not tell which one they had.
    expect(BANNER.severe).not.toBe(BANNER.attention);
  });

  it('tints a whole cell for the two directions and for nothing else', () => {
    // `SURFACE` is the row layer of the diff. A tinted cell claims the content is
    // missing on the other side, which only `lost` and `added` claim.
    expect(Object.keys(SURFACE)).toEqual(['lost', 'added']);
    expect(Object.keys(TOKEN)).toEqual(['lost', 'added']);
  });
});
