import { describe, expect, it } from 'vitest';
import { NO_EDITOR } from './overrides.mjs';
import { headerReading } from './page-header.mjs';

/**
 * What the page header offers, asked without a browser (ui-polish ticket 08).
 *
 * The header used to work this out in several places at once — whether there is a review
 * and whether it went stale, whether there is a priority and a note, whether the log can
 * be written to, whether a name has been given, whether the local re-check service
 * answers. Each reading was made where it was drawn, so the only way to ask *what may an
 * editor do to this page* was to render a page.
 *
 * The interesting half is not the reading, it is the **refusals**, and this is where they
 * are checkable: an absent action and a refused one are different answers, and the
 * sentence a refusal carries is `whyNotWriting()`'s and never a second copy of it.
 */

const NOTHING = { priority: null, note: null };

describe('what the page header offers', () => {
  it('draws a short line for a page nobody has annotated or reviewed', () => {
    const { line } = headerReading({
      review: null,
      annotations: NOTHING,
      notWritingReason: null,
      recheckAvailable: true,
    });

    expect(line).toEqual([]);
  });

  it('offers Mark page reviewed on a page with no review', () => {
    const { actions } = headerReading({
      review: null,
      annotations: NOTHING,
      notWritingReason: null,
      recheckAvailable: true,
    });

    expect(actions.markReviewed).toEqual({ state: 'offered' });
  });

  it('stops offering Mark page reviewed once the page has one', () => {
    const { actions } = headerReading({
      review: { editor: 'Dylan', at: '2026-08-19T09:00:00.000Z', fresh: true },
      annotations: NOTHING,
      notWritingReason: null,
      recheckAvailable: true,
    });

    // Absent and not refused. The menu never offers something that has already happened,
    // and a refusal would be the menu saying no to a thing there is nothing to say no to.
    expect(actions.markReviewed).toEqual({ state: 'absent' });
  });

  it('takes Re-check away when the local service does not answer, rather than refusing it', () => {
    const { actions } = headerReading({
      review: null,
      annotations: NOTHING,
      notWritingReason: null,
      recheckAvailable: false,
    });

    // Feature detection, not permission. There is no service to ask, so there is nothing
    // to explain to an editor and nothing they could do about it if there were.
    expect(actions.recheck).toEqual({ state: 'absent' });
  });

  it('keeps Re-check offered on a read-only log, because a re-check writes nothing', () => {
    const { actions } = headerReading({
      review: null,
      annotations: NOTHING,
      notWritingReason: 'The log does not answer, so this is read-only.',
      recheckAvailable: true,
    });

    expect(actions.recheck).toEqual({ state: 'offered' });
  });

  it('refuses the writes with no name given, and never Copy link', () => {
    const { actions } = headerReading({
      review: null,
      annotations: NOTHING,
      notWritingReason: NO_EDITOR,
      recheckAvailable: true,
    });

    expect(actions.markReviewed).toEqual({ state: 'refused', reason: NO_EDITOR });
    expect(actions.annotate).toEqual({ state: 'refused', reason: NO_EDITOR });
    // The one item that is never refused: a link is this page's address, and reading it
    // out needs no log, no name and no connection to anything.
    expect(actions.copyLink).toEqual({ state: 'offered' });
  });

  it('borrows the read-only sentence rather than writing a second one', () => {
    const READ_ONLY = 'The log does not answer, so this is read-only.';
    const { actions } = headerReading({
      review: null,
      annotations: NOTHING,
      notWritingReason: READ_ONLY,
      recheckAvailable: true,
    });

    // The sentence is `whyNotWriting()`'s and not a second copy of it. Two surfaces
    // explaining read-only differently is the failure the glossary exists to stop.
    expect(actions.annotate).toEqual({ state: 'refused', reason: READ_ONLY });
  });

  it('offers nothing to do to a review that is not there', () => {
    const { actions } = headerReading({
      review: null,
      annotations: NOTHING,
      notWritingReason: null,
      recheckAvailable: true,
    });

    expect(actions.clearReview).toEqual({ state: 'absent' });
    expect(actions.markAgain).toEqual({ state: 'absent' });
  });

  it('offers Mark again only once the review has gone stale', () => {
    const stale = (fresh) =>
      headerReading({
        review: { editor: 'Dylan', at: '2026-08-19T09:00:00.000Z', fresh },
        annotations: NOTHING,
        notWritingReason: null,
        recheckAvailable: true,
      }).actions;

    // A fresh review has nothing to mark again, and *changed since review* is the one
    // state where marking it again means something.
    expect(stale(true).markAgain).toEqual({ state: 'absent' });
    expect(stale(false).markAgain).toEqual({ state: 'offered' });
    // Withdrawing one is offered either way; it is the review that is being withdrawn,
    // not its freshness.
    expect(stale(true).clearReview).toEqual({ state: 'offered' });
  });

  it('still opens the details of a page it cannot let anybody change', () => {
    const READ_ONLY = 'The log does not answer, so this is read-only.';
    const { actions } = headerReading({
      review: null,
      annotations: { priority: 'high', note: 'The hero image is the old one.' },
      notWritingReason: READ_ONLY,
      recheckAvailable: true,
    });

    // Opening the dialog is a read, and the note a colleague wrote is worth reading by
    // somebody who cannot write one. The refusal belongs to the controls inside it, which
    // is what `annotate` above carries — relocating a fact must not delete it.
    expect(actions.editDetails).toEqual({ state: 'offered' });
  });

  it('reads the three annotations in order, and the note only as a note', () => {
    const { line } = headerReading({
      review: { editor: 'Dylan', at: '2026-08-19T09:00:00.000Z', fresh: false },
      annotations: { priority: 'high', note: 'The hero image is still the old one, and the' },
      notWritingReason: null,
      recheckAvailable: true,
    });

    expect(line).toEqual([
      { kind: 'priority', priority: 'high' },
      // That there is one, and not what it says. A note has no length limit, so a line
      // that carried the words would let one page set the width of the header.
      { kind: 'note' },
      { kind: 'review', editor: 'Dylan', at: '2026-08-19T09:00:00.000Z', fresh: false },
    ]);
  });

  it('leaves the slots out rather than empty for each annotation a page lacks', () => {
    const { line } = headerReading({
      review: null,
      annotations: { priority: null, note: 'Checked the footer by hand.' },
      notWritingReason: null,
      recheckAvailable: true,
    });

    expect(line).toEqual([{ kind: 'note' }]);
  });
});
