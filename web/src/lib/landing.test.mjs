import { describe, expect, it } from 'vitest';
import { findingAnchor, landedRowProps, landingFor, landingRow } from './landing.mjs';
import { CHROME } from './palette.mjs';

/**
 * Landing on the difference the link named (ticket 109).
 *
 * A page link from the dashboard carries a finding id, and the page has to put that
 * finding in front of the reader. It is a **landing** and never a filter: the row
 * arrives with the rows around it in document order, because that is the question a
 * one-sided difference asks and the reason ADR 0006 keeps the content view whole.
 */

describe('findingAnchor', () => {
  // The content view anchors its rows on production's document position (`p12`), for
  // the reason `view.mjs` gives. The Links and Images tables have no such
  // position — their rows are findings — so they anchor on the id, and the two schemes
  // share one document. The prefix is what keeps them apart, and it is also what makes
  // the id legal: a digest can begin with a digit.
  it('cannot collide with a row anchor, and survives a digest starting with a digit', () => {
    expect(findingAnchor('9f2c1a')).toBe('finding-9f2c1a');
    expect(findingAnchor('p12')).not.toBe('p12');
  });
});

describe('landingFor', () => {
  /** A derived finding, as `derivePageState()` hands them over. */
  const finding = (part) => ({
    id: 'a1',
    check: 'text',
    class: 'text-missing',
    visibility: 'work',
    state: 'open',
    ...part,
  });

  // The link can name a finding on any of the three checks, and two of them are not in
  // the content view at all. A landing that only ever opened Text would send an
  // editor to a tab that does not hold what they clicked.
  it('names the tab the finding lives on', () => {
    const findings = [
      finding({ id: 'a1', check: 'text' }),
      finding({ id: 'b2', check: 'links' }),
      finding({ id: 'c3', check: 'images' }),
    ];

    expect(landingFor({ findings, focus: 'a1' }).tab).toBe('Text');
    expect(landingFor({ findings, focus: 'b2' }).tab).toBe('Links');
    expect(landingFor({ findings, focus: 'c3' }).tab).toBe('Images');
  });

  // The dashboard lists a `dismissed` row as well as an open one, so both can be
  // clicked. A `diagnostic` finding is behind *Show noise*, and a landing that did
  // not switch it on would send the reader to an empty screen and say nothing about why.
  it('asks for the noise toggle when the finding is behind it', () => {
    const open = finding({ id: 'a1' });
    const dismissed = finding({ id: 'b2', state: 'dismissed' });
    const decided = finding({ id: 'c3', state: 'fixed' });
    const information = finding({ id: 'd4', visibility: 'information' });
    const diagnostic = finding({ id: 'e5', visibility: 'diagnostic' });
    const findings = [open, dismissed, decided, information, diagnostic];

    // A decision is not noise: the row stays on screen whatever the decision was, so
    // the toggle is left where the reader had it. Only the class puts a row behind it,
    // and since ticket 75 only the `diagnostic` third of the vocabulary does — an
    // `information` row is drawn already, so a link to one asks for nothing.
    expect(landingFor({ findings, focus: 'a1' }).needsNoise).toBe(false);
    expect(landingFor({ findings, focus: 'b2' }).needsNoise).toBe(false);
    expect(landingFor({ findings, focus: 'c3' }).needsNoise).toBe(false);
    expect(landingFor({ findings, focus: 'd4' }).needsNoise).toBe(false);
    expect(landingFor({ findings, focus: 'e5' }).needsNoise).toBe(true);
  });

  // Not every finding of a page is drawn on one of the four tabs. `no-declared-alternate`
  // is the one `meta` rule, and the Meta tab is `metaRows()` — display only, no findings
  // in it at all. So a link naming it has nothing to land on, and the wrong answer is the
  // one this had: a class behind the toggle made it ask for *Ruis tonen*, which floods the
  // page with noise rows on the way to a row that is not there. Asking for the toggle only
  // makes sense when switching it on would draw the thing.
  it('asks for nothing and says so when no tab draws the finding', () => {
    const findings = [
      finding({
        id: 'm1',
        check: 'meta',
        class: 'no-declared-alternate',
        visibility: 'diagnostic',
      }),
    ];

    expect(landingFor({ findings, focus: 'm1' })).toEqual({
      tab: null,
      needsNoise: false,
      missing: false,
      unplaced: true,
    });
  });

  // A finding id is a term of the text, so it expires the moment the text changes: a
  // link sent on Monday can name a finding this snapshot does not have, because the
  // difference was fixed or the page was re-measured. That is not an error and it is
  // not nothing either — the page has to be able to say so, so the caller gets told
  // rather than left to infer it from a tab that did not move.
  it('reports a finding this snapshot does not have', () => {
    const findings = [finding({ id: 'a1' })];

    expect(landingFor({ findings, focus: 'gone' })).toEqual({
      tab: null,
      needsNoise: false,
      missing: true,
      unplaced: false,
    });
  });

  // The ordinary case, and it must ask for nothing: a reader who opened a page from
  // the page list chose their own tab and their own toggle.
  it('asks for nothing when no link named a finding', () => {
    expect(landingFor({ findings: [finding({ id: 'a1' })], focus: null })).toEqual({
      tab: null,
      needsNoise: false,
      missing: false,
      unplaced: false,
    });
  });
});

describe('landedRowProps', () => {
  // Two tables draw a landed row — the content view's and the finding table's — and the
  // three things that mark one are one rule, not two: the outline so it can be seen, the
  // `-1` so a landing can hand it the keyboard without putting every row in the Tab
  // order, and `aria-current` so the mark is an announcement and not only a colour. It
  // was written out twice, which is two places for a landing to become colour-only again.
  it('marks a landed row so it can be seen, focused and announced', () => {
    expect(landedRowProps(true)).toEqual({
      tabIndex: -1,
      'aria-current': 'location',
      className: CHROME.landed,
    });
  });

  // Every other row in the table, which is nearly all of them: no outline, and above all
  // no Tab stop. 399 findings on the worst page would be 399 presses to get past.
  it('leaves every other row alone', () => {
    expect(landedRowProps(false)).toEqual({
      tabIndex: undefined,
      'aria-current': undefined,
      className: undefined,
    });
  });
});

describe('landingRow', () => {
  // The content view is a list of **rows** and the link names a **finding**, so the
  // one thing it has to do is translate. It lands on the row's own anchor and not on
  // `findingAnchor`, because a row already has a position in the document and that is
  // the anchor an outline link and a copied hash both use.
  it('translates the finding into the row that carries it', () => {
    const rows = [
      { key: 'p11', finding: null },
      { key: 'p12', finding: { id: 'a1' } },
      { key: 'n7', finding: { id: 'b2' } },
    ];

    expect(landingRow(rows, 'a1')).toBe('p12');
    expect(landingRow(rows, 'b2')).toBe('n7');
  });

  // A grouped finding covers several rows and the reader is sent to the first of them,
  // which is where the difference starts. Landing halfway down a run would put the
  // beginning of it above the fold.
  it('lands on the first row a grouped finding covers', () => {
    const rows = [
      { key: 'p12', finding: { id: 'a1' } },
      { key: 'p13', finding: { id: 'a1' } },
    ];

    expect(landingRow(rows, 'a1')).toBe('p12');
  });

  // Nothing to land on is the ordinary case, and it must not be a row.
  it('lands nowhere when the rows do not hold it', () => {
    expect(landingRow([{ key: 'p12', finding: { id: 'a1' } }], 'gone')).toBe(null);
    expect(landingRow([{ key: 'p12', finding: { id: 'a1' } }], null)).toBe(null);
  });
});
