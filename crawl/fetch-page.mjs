/**
 * One HTTP fetch of one page, with the maintenance guard from ticket 04.
 *
 * Production can be in maintenance mode with no warning. It answered the
 * maintenance page on 446 of 451 urls for a whole session, first as a 500
 * bootstrap exception and then as a 503. A run that records those as pages
 * records phantom defects, so a maintenance page is an error, never a page.
 */

const MAINTENANCE_PATTERNS = [
  /Service\s+Temporarily\s+Unavailable/i,
  /maintenance/i,
  /There has been an error processing your request/i,
  /Error log record number/i,
  /autoload\.php/i,
];

export class MaintenanceError extends Error {
  /**
   * @param {string} url
   * @param {string} reason
   */
  constructor(url, reason) {
    super(`Maintenance page at ${url}: ${reason}`);
    this.name = 'MaintenanceError';
    this.url = url;
    this.reason = reason;
  }
}

/**
 * @param {number} status
 * @param {string} html
 * @returns {string | null}
 */
export function maintenanceReason(status, html) {
  if (status === 503) return 'HTTP 503';
  if (status === 500) return 'HTTP 500';
  // A real page is far larger. The word "maintenance" also lives in body copy.
  if (html.length < 8000) {
    for (const pattern of MAINTENANCE_PATTERNS) {
      if (pattern.test(html)) return `body matches ${pattern}`;
    }
  }
  return null;
}

/**
 * @param {string} url
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<{ status: number, html: string, finalUrl: string, redirected: boolean }>}
 */
export async function fetchPage(url, { timeoutMs = 60000 } = {}) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (content-parity; internal)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
  });
  const html = await response.text();

  const reason = maintenanceReason(response.status, html);
  if (reason) throw new MaintenanceError(url, reason);

  return {
    status: response.status,
    html,
    finalUrl: response.url,
    redirected: response.redirected,
  };
}
