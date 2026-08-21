/**
 * Landing on the difference the link named (ticket 109).
 *
 * A page link from the dashboard carries a finding id, and the page has to put that
 * finding in front of the reader: on the right tab, with the diagnostics control on if that
 * is what it takes to draw it, scrolled to and marked.
 *
 * It is a **landing** and never a filter. The row arrives with the rows around it in
 * document order, because that is the question a one-sided difference asks and the
 * reason ADR 0006 keeps the content view whole. Nothing here removes a row.
 */

import { useEffect, useState } from 'react';
import { HEAD_CLASSES } from '../../../compare/meta.mjs';
import { CHROME } from './palette.mjs';

/**
 * The element id a finding is reachable by.
 *
 * The content view already anchors its rows on the **document position** (`p12`), for
 * the reason `content-view.mjs` gives: a position in a row list moves when a filter moves. So
 * this is for the two tables that have no such position — Links and Images,
 * whose rows are findings and nothing else — and the content view lands on its own
 * anchor instead.
 *
 * The prefix keeps the two schemes from colliding in one document, and it is also what
 * makes the id legal: a finding id is a digest and a digest can begin with a digit.
 *
 * @param {string} id
 * @returns {string}
 */
export const findingAnchor = (id) => `finding-${id}`;

/**
 * The tab each check lives on. `Ledger.jsx` owns the strip; this owns which of its
 * tabs answers for a finding, because a landing has to choose one before the reader
 * sees anything — and three of the four checks are not in the content view at all.
 *
 * **The `meta` check is on the strip since ticket 98, and it is still not enough on its
 * own.** The Meta tab draws the five `<head>` rows, and `no-declared-alternate` is a
 * `meta` finding that is not one of them: it is metadata about the page, reaching the log
 * through the page key rather than through the `<head>`. So the check answers for the tab
 * and `HEAD_CLASSES` answers for the check — a landing that read the check alone would
 * send a reader to a panel with no row for what they were sent to, which is the silent
 * nothing-happens `unplaced` exists to say out loud.
 */
const TAB_OF_CHECK = { text: 'Text', links: 'Links', images: 'Images', meta: 'Meta' };

/**
 * Whether the tab that answers for this finding's check would actually draw it.
 *
 * One check, and it is the head's: `HEAD_CLASSES` is the producer's own set, imported
 * rather than restated, so a tenth head class cannot become a finding the panel draws and
 * the landing calls unplaced.
 *
 * @param {{ check: string, class: string }} finding
 */
const drawnByItsTab = (finding) =>
  finding.check === 'meta' ? HEAD_CLASSES.has(finding.class) : true;

/**
 * What the page has to do about the finding a link named.
 *
 * @typedef {object} Landing
 * @property {string | null} tab  The tab that must be on screen, or null when there is
 *                                nothing to land on and the reader's own choice stands.
 * @property {boolean} needsDiagnostics  Whether *Show diagnostics* has to be on for the
 *                                finding to be drawn at all.
 * @property {boolean} missing    A link named a finding and this snapshot has no such
 *                                finding. A finding id is a term of the text, so it
 *                                expires when the text does: the difference was fixed,
 *                                or the page was measured again. The page says so
 *                                rather than landing nowhere in silence.
 * @property {boolean} unplaced   This snapshot **has** the finding and no tab draws it:
 *                                `no-declared-alternate`, which is metadata about the page
 *                                rather than a row of its `<head>`, so the Meta tab has no
 *                                row for it. The other half of the same courtesy — the
 *                                link was good and there is still nothing to look at.
 *
 * @param {object} input
 * @param {object[]} input.findings   The **derived** findings of the page.
 * @param {string | null} input.focus The finding id the link named, or null.
 * @returns {Landing}
 */
export function landingFor({ findings, focus }) {
  const target = focus ? (findings.find((finding) => finding.id === focus) ?? null) : null;
  const tab = target && drawnByItsTab(target) ? (TAB_OF_CHECK[target.check] ?? null) : null;

  return {
    tab,
    // The same test `Ledger.jsx` and `prepareRows()` already apply, asked the other way
    // round: those two decide what to hide, and this decides whether what the reader
    // was sent to is one of them. It is a question about the **class** only — a
    // decision is not a diagnostic, so a `genegeerd` row is on screen already and the toggle
    // is left where it was.
    //
    // Since ticket 75 only a `diagnostic` is behind the toggle. A link to an
    // `information` finding lands on a row that is already drawn, so it asks for
    // nothing.
    //
    // **Only when a tab would draw it.** The toggle is asked for so that the row the
    // reader was sent to appears, so with no such row there is nothing to ask for, and
    // switching it on would only fill the page with rows nobody asked to see.
    needsDiagnostics: Boolean(tab) && target.visibility === 'diagnostic',
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
 * A landing needs a tab on screen and, sometimes, *Show diagnostics* switched on.
 * Both are the reader's controls, so the landing only borrows them: it holds until the
 * reader touches that control, and from then on their choice stands.
 *
 * **One flag per control, and this is the whole reason the hook exists.** A single
 * "the reader has chosen" flag made the two controls hand each other back: switching
 * tabs released the toggle, so the row the reader landed on disappeared, and ticking
 * the toggle released the tab, so a reader who landed on Links was thrown to Text.
 * Two controls, two answers.
 *
 * It is not a one-shot either. The finding id arrives in an effect, a beat after the
 * first render, so `asked` changes under the reader — which is why this holds an
 * *untaken* flag rather than seeding state from the first answer.
 *
 * @param {{ tab: string | null, needsDiagnostics: boolean }} asked  From `landingFor()`.
 * @param {string} defaultTab  The tab a reader who was sent nowhere gets.
 */
export function useLanding(asked, defaultTab) {
  const [chosenTab, setChosenTab] = useState(defaultTab);
  const [tabTaken, setTabTaken] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticsTaken, setDiagnosticsTaken] = useState(false);

  return {
    tab: !tabTaken && asked.tab ? asked.tab : chosenTab,
    diagnostics: diagnosticsTaken ? showDiagnostics : asked.needsDiagnostics,
    chooseTab: (name) => {
      setTabTaken(true);
      setChosenTab(name);
    },
    chooseDiagnostics: (on) => {
      setDiagnosticsTaken(true);
      setShowDiagnostics(on);
    },
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
 * wait: until the log answers, a decided row is drawn as an open one, and what a landing
 * scrolls to is then a row whose neighbours are about to say something else. Two callers
 * carrying the same three-line comment was one rule written twice.
 *
 * It is **not** what stops the row moving, and it never was. The 273 pixels this comment
 * used to cite — measured on `nl/carport` — were the override control appearing into space
 * nothing had reserved, and `OverrideControl.jsx` reserves it since ticket 03 of the polish
 * pass. This answers the other question, *when* to scroll, and it stays for that.
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
    // amount of fuss for this function to make.
    const element = document.getElementById(anchor);
    if (!element) return;

    element.scrollIntoView({ block: 'start' });
    element.focus({ preventScroll: true });
  }, [anchor, settled]);
}
