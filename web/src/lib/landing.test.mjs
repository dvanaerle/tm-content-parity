import { describe, expect, it } from 'vitest';
import { CHECKS } from '../../../compare/vocabulary.mjs';
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
  // the reason `content-view.mjs` gives. The Links and Images tables have no such
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

  /*
   * The sibling tab is unreachable from a link, and this is where that is guaranteed
   * (ticket 04).
   *
   * There is no finding id on it to land on: a block difference is a display-only
   * difference and it is never a finding. So the guarantee is not a rule about the tab,
   * it is a property of this function — it resolves a tab from the finding's **check**,
   * `Check` is a closed family of four, and the sibling tab is not one of them. It is
   * read against `CHECKS` rather than against a second copy of the four names, so the day
   * somebody adds a fifth check this test is what asks whether it should open a tab.
   */
  it('cannot open the sibling tab, whatever a link names', () => {
    const tabs = CHECKS.map(
      (check) =>
        landingFor({
          findings: [finding({ check, class: check === 'meta' ? 'meta-title-changed' : undefined })],
          focus: 'a1',
        }).tab,
    );

    expect(tabs).not.toContain('Sibling');
    // All four checks answer with a tab since ticket 98: the Meta tab draws the five
    // `<head>` rows, and three of them make findings.
    expect(tabs).toEqual(['Text', 'Links', 'Images', 'Meta']);
  });

  // The Meta tab is a checklist of five known slots and three of them are findings, so a
  // link naming one lands on the panel like any other. Before ticket 98 there was nothing
  // there to land on and this answered `unplaced` for every head finding.
  it('opens the Meta tab for a finding the head panel draws', () => {
    const findings = [finding({ id: 'm1', check: 'meta', class: 'robots-index-lost' })];

    expect(landingFor({ findings, focus: 'm1' })).toEqual({
      tab: 'Meta',
      needsDiagnostics: false,
      missing: false,
      unplaced: false,
    });
  });

  // The link can name a finding on any of the four checks, and three of them are not in
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
  // clicked. A `diagnostic` finding is behind *Show diagnostics*, and a landing that did
  // not switch it on would send the reader to an empty screen and say nothing about why.
  it('asks for the diagnostics control when the finding is behind it', () => {
    const open = finding({ id: 'a1' });
    const dismissed = finding({ id: 'b2', state: 'dismissed' });
    const decided = finding({ id: 'c3', state: 'fixed' });
    const information = finding({ id: 'd4', visibility: 'information' });
    const diagnostic = finding({ id: 'e5', visibility: 'diagnostic' });
    const findings = [open, dismissed, decided, information, diagnostic];

    // A decision is not a diagnostic: the row stays on screen whatever the decision was, so
    // the toggle is left where the reader had it. Only the class puts a row behind it,
    // and since ticket 75 only the `diagnostic` third of the vocabulary does — an
    // `information` row is drawn already, so a link to one asks for nothing.
    expect(landingFor({ findings, focus: 'a1' }).needsDiagnostics).toBe(false);
    expect(landingFor({ findings, focus: 'b2' }).needsDiagnostics).toBe(false);
    expect(landingFor({ findings, focus: 'c3' }).needsDiagnostics).toBe(false);
    expect(landingFor({ findings, focus: 'd4' }).needsDiagnostics).toBe(false);
    expect(landingFor({ findings, focus: 'e5' }).needsDiagnostics).toBe(true);
  });

  // Not every finding of a page is drawn on one of the four tabs, and since ticket 98 the
  // gap is one class wide. `no-declared-alternate` is `check: 'meta'` and it is not a row
  // of the `<head>`: it is metadata about the page, reaching the log through the page key,
  // so the panel that draws the five head fields has no row for it. A link naming it has
  // nothing to land on, and the wrong answer is the
  // one this had: a class behind the toggle made it ask for *Ruis tonen*, which floods the
  // page with diagnostic rows on the way to a row that is not there. Asking for the toggle only
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
      needsDiagnostics: false,
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
      needsDiagnostics: false,
      missing: true,
      unplaced: false,
    });
  });

  // The ordinary case, and it must ask for nothing: a reader who opened a page from
  // the page list chose their own tab and their own toggle.
  it('asks for nothing when no link named a finding', () => {
    expect(landingFor({ findings: [finding({ id: 'a1' })], focus: null })).toEqual({
      tab: null,
      needsDiagnostics: false,
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
