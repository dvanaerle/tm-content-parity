/**
 * Landing on the difference the link named (ticket 109).
 *
 * A page link from the dashboard carries a finding id, and the page has to put that
 * finding in front of the reader: on the right tab, with the noise toggle on if that
 * is what it takes to draw it, scrolled to and marked.
 *
 * It is a **landing** and never a filter. The row arrives with the rows around it in
 * document order, because that is the question a one-sided difference asks and the
 * reason ADR 0006 keeps the content view whole. Nothing here removes a row.
 */

import { useEffect, useState } from 'react';
import { CHROME } from './palette.mjs';

/**
 * The element id a finding is reachable by.
 *
 * The content view already anchors its rows on the **document position** (`p12`), for
 * the reason `view.mjs` gives: a position in a row list moves when a filter moves. So
 * this is for the two tables that have no such position — Links and Afbeeldingen,
 * whose rows are findings and nothing else — and the content view lands on its own
 * anchor instead.
 *
 * The prefix keeps the two schemes from colliding in one document, and it is also what
 * makes the id legal: a finding id is a digest and a digest can begin with a digit.
 *
 * @param {string} id
 * @returns {string}
 */
export const findingAnchor = (id) => `bevinding-${id}`;

/**
 * The tab each check lives on. `Ledger.jsx` owns the strip; this owns which of its
 * tabs answers for a finding, because a landing has to choose one before the reader
 * sees anything — and two of the three checks are not in the content view at all.
 *
 * **The fourth tab is not in here, and that is not an omission.** Meta is `metaRows()`,
 * which is display only and holds no findings — ticket 21 has not decided what a parity
 * defect in the `<head>` is. So the one `meta` rule, `no-declared-alternate`, is a
 * finding no tab draws, and `landingFor()` answers for it rather than pretending Meta
 * would show it.
 */
const TAB_OF_CHECK = { text: 'Inhoud', links: 'Links', images: 'Afbeeldingen' };

/**
 * What the page has to do about the finding a link named.
 *
 * @typedef {object} Landing
 * @property {string | null} tab  The tab that must be on screen, or null when there is
 *                                nothing to land on and the reader's own choice stands.
 * @property {boolean} needsNoise Whether *Ruis en gedempt tonen* has to be on for the
 *                                finding to be drawn at all.
 * @property {boolean} missing    A link named a finding and this snapshot has no such
 *                                finding. A finding id is a term of the text, so it
 *                                expires when the text does: the difference was fixed,
 *                                or the page was measured again. The page says so
 *                                rather than landing nowhere in silence.
 * @property {boolean} unplaced   This snapshot **has** the finding and no tab draws it:
 *                                a `meta` finding, which the display-only Meta tab does
 *                                not list. The other half of the same courtesy — the
 *                                link was good and there is still nothing to look at.
 *
 * @param {object} input
 * @param {object[]} input.findings   The **derived** findings of the page.
 * @param {string | null} input.focus The finding id the link named, or null.
 * @returns {Landing}
 */
export function landingFor({ findings, focus }) {
  const target = focus ? findings.find((finding) => finding.id === focus) ?? null : null;
  const tab = target ? TAB_OF_CHECK[target.check] ?? null : null;

  return {
    tab,
    // The same test `Ledger.jsx` and `prepareRows()` already apply, asked the other way
    // round: those two decide what to hide, and this decides whether what the reader
    // was sent to is one of them. A dismissal is a decision and not noise, so a
    // `genegeerd` row is on screen already and the toggle is left where it was.
    //
    // **Only when a tab would draw it.** The toggle is asked for so that the row the
    // reader was sent to appears, so with no such row there is nothing to ask for, and
    // switching it on would only fill the page with rows nobody asked to see.
    needsNoise: Boolean(tab) && !(target.shown && target.state !== 'muted'),
    missing: Boolean(focus) && target === null,
    unplaced: Boolean(target) && tab === null,
  };
}

/**
 * What marks the row a landing arrived on. Two tables draw one — the content view's rows
 * and the finding table's — and this is the one rule they share rather than the same three
 * attributes written out in both.
 *
 * All three say the same thing to a different reader. The outline is for the reader who
 * can see it; `aria-current` is what makes the mark an announcement rather than a colour;
 * and `tabIndex` is what lets `useLandOn()` hand the row the keyboard, `-1` because
 * exactly one row is a landing and 399 Tab stops would be the alternative.
 *
 * The className is the caller's to merge, because each table has its own row classes to
 * merge it with.
 *
 * @param {boolean} landed
 */
export const landedRowProps = (landed) => ({
  tabIndex: landed ? -1 : undefined,
  'aria-current': landed ? 'location' : undefined,
  className: landed ? CHROME.landed : undefined,
});

/**
 * The two controls a landing borrows, and the reader taking either one back.
 *
 * A landing needs a tab on screen and, sometimes, *Ruis en gedempt tonen* switched on.
 * Both are the reader's controls, so the landing only borrows them: it holds until the
 * reader touches that control, and from then on their choice stands.
 *
 * **One flag per control, and this is the whole reason the hook exists.** A single
 * "the reader has chosen" flag made the two controls hand each other back: switching
 * tabs released the toggle, so the row the reader landed on disappeared, and ticking
 * the toggle released the tab, so a reader who landed on Links was thrown to Inhoud.
 * Two controls, two answers.
 *
 * It is not a one-shot either. A finding's `state` arrives with the override log a beat
 * after the tab has to be chosen, so `asked` can change under the reader — which is why
 * this holds an *untaken* flag rather than seeding state from the first answer.
 *
 * @param {{ tab: string | null, needsNoise: boolean }} asked  From `landingFor()`.
 * @param {string} defaultTab  The tab a reader who was sent nowhere gets.
 */
export function useLanding(asked, defaultTab) {
  const [chosenTab, setChosenTab] = useState(defaultTab);
  const [tabTaken, setTabTaken] = useState(false);
  const [showNoise, setShowNoise] = useState(false);
  const [noiseTaken, setNoiseTaken] = useState(false);

  return {
    tab: !tabTaken && asked.tab ? asked.tab : chosenTab,
    noise: noiseTaken ? showNoise : asked.needsNoise,
    chooseTab: (name) => { setTabTaken(true); setChosenTab(name); },
    chooseNoise: (on) => { setNoiseTaken(true); setShowNoise(on); },
  };
}

/**
 * The row of the content view a landing puts on screen.
 *
 * The link names a finding and the view is a list of rows, so this is the translation.
 * It lands on the **row's own anchor** and not on `findingAnchor()`: a row already has
 * a position in the document, and that is the anchor the outline links to and the one
 * a reader copies out of the address bar.
 *
 * A grouped finding covers several rows and the reader is sent to the first of them,
 * which is where the difference starts.
 *
 * @param {{ key: string, finding: { id: string } | null }[]} rows  From `prepareRows()`.
 * @param {string | null} focus
 * @returns {string | null}
 */
export function landingRow(rows, focus) {
  if (!focus) return null;
  return rows.find((row) => row.finding?.id === focus)?.key ?? null;
}

/**
 * Land on an element: scroll to it the way a hash link would, and give it the keyboard.
 *
 * Not smooth, on purpose: this is the arrival of a navigation and not a movement inside
 * a page the reader is already looking at. `scroll-mt-*` on the target is honoured
 * either way, which is what keeps the row clear of anything above it.
 *
 * **It takes the focus as well as the scroll**, because a coloured outline is a landing
 * only for a reader who can see it. Focus is what puts a keyboard reader on the row
 * instead of at the top of the document, and what makes a screen reader say the row out
 * loud. `preventScroll` because the line above already placed it, and a second scroll
 * would fight the first.
 *
 * **The wait is the hook's, not the caller's.** Both callers have the same reason to
 * wait: a decided row grows an override control when the log answers, so a landing taken
 * before that is measured against a layout about to move — 273 pixels of it, measured on
 * `nl/carport`. Two callers carrying the same three-line comment was one rule written
 * twice.
 *
 * @param {string | null} anchor  An element id, or null for "the reader asked for
 *                                nothing", which is the ordinary case.
 * @param {boolean} [settled]     Whether the page has stopped changing shape. Nothing
 *                                happens until it has.
 */
export function useLandOn(anchor, settled = true) {
  useEffect(() => {
    if (!anchor || !settled) return;
    // The effect runs after the commit that drew the row, so the element is here. If it
    // is not, the finding is on a tab or behind a filter that is not on screen, and
    // `landingFor()` is what tells the reader about it — landing nowhere is the right
    // amount of noise for this function to make.
    const element = document.getElementById(anchor);
    if (!element) return;

    element.scrollIntoView({ block: 'start' });
    element.focus({ preventScroll: true });
  }, [anchor, settled]);
}
