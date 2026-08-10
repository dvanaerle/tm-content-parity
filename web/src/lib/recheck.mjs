/**
 * The front end's side of the local re-check service.
 *
 * **Feature detection, not configuration.** The same static files are the hosted
 * snapshot and the local copy, so there is no build flag and no environment
 * variable: the page probes `/api/health` once, and the button renders only if
 * something answers. On the webhost nothing does, and the button is *absent*
 * rather than broken — and no saved re-check is asked for either, because
 * nothing there could answer.
 *
 * **The page view only** (ticket 71). The store dashboard and the home page are
 * built from the crawl reports and keep the built snapshot until the next
 * `npm run build`. That is a deliberate limit: those two read hundreds of
 * reports, and a saved re-check is one editor's look at one page.
 */

import { useCallback, useEffect, useState } from 'react';

import { chooseReport } from './recheck-choice.mjs';
import { recheckPath } from './page-url.mjs';

/** A local service answers in milliseconds. Anything slower is not one. */
const PROBE_TIMEOUT_MS = 1500;

export async function probeHealth() {
  try {
    const response = await fetch('/api/health', {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function useRecheckAvailable() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let live = true;
    probeHealth().then((ok) => { if (live) setAvailable(ok); });
    return () => { live = false; };
  }, []);
  return available;
}

/**
 * `recheckPath()` builds the path and the service parses it the same way, so a
 * key that holds a slash stays two segments and a key that holds anything else is
 * encoded (ticket 54).
 *
 * @param {string} store
 * @param {string} page
 * @returns {Promise<import('../../../compare/contract.mjs').PageReport>}
 */
export async function recheckPage(store, page) {
  const response = await fetch(recheckPath(store, page), { method: 'POST' });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    // Ticket 04: production can be in maintenance mode without warning, and a run
    // that records the maintenance page records phantom defects. The service
    // refuses rather than answering, and the reason is shown as written.
    throw new Error(body?.reason ?? `De hercontrole mislukte (${response.status}).`);
  }
  return body;
}

/**
 * The saved re-check of one page, or `null` when there is none.
 *
 * The service answers with the **overlay** or with nothing. It never answers
 * with the crawl report, which the built page already carries and which holds
 * both extracts. A page key can hold a slash, and the service splits the path
 * for GET exactly as it does for POST.
 *
 * @param {string} store
 * @param {string} page
 * @returns {Promise<import('../../../compare/contract.mjs').PageReport | null>}
 */
export async function savedRecheck(store, page) {
  try {
    const response = await fetch(recheckPath(store, page));
    if (!response.ok) return null;
    return await response.json();
  } catch {
    // No saved re-check is the normal case, so a page that cannot read one shows
    // the crawl report it was built with and says nothing about it.
    return null;
  }
}

/**
 * The report the page shows, and which of the two folders it came from.
 *
 * The build put the crawl report in the page. On a local copy the island then
 * asks once for a saved re-check and `chooseReport()` decides, so a press that
 * happened before a reload is still on the screen after it. On the webhost the
 * probe fails, no request is made, and the built report stands.
 *
 * @param {import('../../../compare/contract.mjs').PageReport} built
 * @param {boolean} available  Whether the local service answered `/api/health`.
 */
export function usePageReport(built, available) {
  const [chosen, setChosen] = useState(() => ({ source: 'crawl', report: built }));

  useEffect(() => {
    if (!available) return undefined;
    let live = true;
    savedRecheck(built.store, built.page).then((saved) => {
      const pick = chooseReport(built, saved);
      if (!live || !pick) return;
      // A press that lands first wins. The saved file is older than it by
      // definition, and a slow read must not put an earlier observation back on
      // a page the editor has already re-checked.
      setChosen((current) => (current.source === 'recheck' ? current : pick));
    });
    return () => { live = false; };
  }, [available, built]);

  // A press is by definition the newest look at the page, so it needs no rule.
  const onReport = useCallback((fresh) => setChosen({ source: 'recheck', report: fresh }), []);

  return { report: chosen.report, source: chosen.source, onReport };
}

/**
 * A Recheck that fails leaves the page exactly as it was: the report is replaced
 * only on success, so a network problem never loses the editor's place.
 *
 * @param {(report: import('../../../compare/contract.mjs').PageReport) => void} onReport
 */
export function useRecheck(onReport) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  const run = useCallback(async (store, page) => {
    setRunning(true);
    setError(null);
    try {
      onReport(await recheckPage(store, page));
    } catch (failure) {
      setError(/** @type {Error} */ (failure).message);
    } finally {
      setRunning(false);
    }
  }, [onReport]);

  return { run, running, error };
}
