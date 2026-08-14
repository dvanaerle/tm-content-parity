import { describe, expect, it } from 'vitest';
import { logState } from './log-read.mjs';

/**
 * One read of the override log, named once (ticket 123's review).
 *
 * Three places used to cascade over the same five fields in three orders and three
 * vocabularies: `LogBanner`, `whyNotWriting()` and `searchNotes()`. These cases are the
 * one answer they now share.
 */
describe('logState', () => {
  it('names a log a read succeeded on', () => {
    const read = logState({ events: [], ready: true, error: null, connected: true });

    expect(read.state).toBe('read');
    expect(read.reason).toBeNull();
  });

  it('names the moment before the first read answers', () => {
    const read = logState({ events: null, ready: false, error: null, connected: true });

    expect(read.state).toBe('reading');
    expect(read.reason).toBeNull();
  });

  it('names a log that answered with a failure, and carries its reason', () => {
    const read = logState({
      events: null,
      ready: false,
      error: 'TypeError: Failed to fetch',
      connected: true,
    });

    expect(read.state).toBe('failed');
    expect(read.reason).toBe('TypeError: Failed to fetch');
  });

  it('tells a log there is no connection to apart from one that failed', () => {
    // `LogBanner` says whose fault each one is, and the two sentences differ. So the two
    // states differ here, and a reader that does not care collapses them itself.
    const read = logState({
      events: null,
      ready: false,
      error: null,
      connected: false,
      notConnectedReason: 'PUBLIC_SUPABASE_URL is not set.',
    });

    expect(read.state).toBe('disconnected');
    expect(read.reason).toBe('PUBLIC_SUPABASE_URL is not set.');
  });

  it('keeps saying a read succeeded when a later write failed', () => {
    // The one combination both readers turn on. A failed write leaves the last good read
    // standing: the banner says it can be out of date rather than absent, and the notes
    // half still answers from it.
    const read = logState({
      events: [{}],
      ready: true,
      error: 'insert failed',
      connected: true,
    });

    expect(read.state).toBe('failed');
    expect(read.ready).toBe(true);
  });
});
