/**
 * The front end's side of the local re-check service.
 *
 * **Feature detection, not configuration.** The same static files are the hosted
 * snapshot and the local copy, so there is no build flag and no environment
 * variable: the page probes `/api/health` once, and the button renders only if
 * something answers. On the webhost nothing does, and the button is *absent*
 * rather than broken.
 */

import { useCallback, useEffect, useState } from 'react';

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
 * A page key can hold a slash (`faq/productinformatie`), so the rest of the path
 * is the page. The service parses it the same way.
 *
 * @param {string} store
 * @param {string} page
 * @returns {Promise<import('../../../compare/contract.mjs').PageReport>}
 */
export async function recheckPage(store, page) {
  const response = await fetch(`/api/recheck/${store}/${page}`, { method: 'POST' });
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
