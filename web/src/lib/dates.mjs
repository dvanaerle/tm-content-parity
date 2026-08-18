/**
 * Every date the interface draws, in one of two lengths.
 *
 * There were three formats before ticket 01 — `dd/mm/yyyy` in two places and
 * `dd/mm/yyyy, hh:mm:ss` in a third — and an editor comparing a note's date with a
 * snapshot's was comparing two spellings of the same fact. The numeric form is also
 * the one that reads differently on either side of the Atlantic; `17 Aug 2026` cannot.
 *
 * `en-GB` and not the reader's locale: the interface speaks one language (ADR 0014),
 * and a date is part of what it says.
 *
 * A guard in `interface-words.test.mjs` refuses a second date format anywhere under `web/src`.
 */

const LOCALE = 'en-GB';

/** @type {Intl.DateTimeFormatOptions} */
const DAY = { day: '2-digit', month: 'short', year: 'numeric' };

/**
 * A calendar day: `17 Aug 2026`.
 *
 * @param {string} at  An ISO 8601 stamp.
 * @returns {string}
 */
export const day = (at) => new Date(at).toLocaleDateString(LOCALE, DAY);

/**
 * A day and a time of day: `17 Aug 2026, 14:03`.
 *
 * **No seconds.** Nothing this log records happens to the second — a decision, a note
 * and a crawl are all events an editor places in an afternoon — so a second is
 * precision the reader cannot use and would have to read past.
 *
 * @param {string} at  An ISO 8601 stamp.
 * @returns {string}
 */
export const moment = (at) =>
  new Date(at).toLocaleString(LOCALE, { ...DAY, hour: '2-digit', minute: '2-digit' });
