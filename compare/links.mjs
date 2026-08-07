/**
 * The links check (ticket 05). Targets only — anchor wording belongs to the Diff
 * tab, and reporting it in both places is exactly the "never make a finding it
 * then hides" problem from ticket 02.
 *
 * Two families of class live here:
 *
 * - **Comparative**: `missing-link`, `extra-link`, `link-target`. These need
 *   both sides and no network.
 * - **Absolute**: `leakage`, `cross-store-link`, `broken-link`, `redirect`.
 *   These judge the new site on its own. The first two need no network; the last
 *   two need a status map, and are simply not emitted without one, because a
 *   guess about a 404 is worse than silence.
 */

import { anchorHeadingFor } from './locate.mjs';
import { tier2 } from './match.mjs';

/**
 * A separate live service with no new-site equivalent (ticket 05). A link to it
 * is correct, so it is not leakage.
 */
const LEAKAGE_ALLOWED_HOSTS = new Set(['360tour.tuinmaximaal.com']);

const LIVE_HOST = /(^|\.)tuinmaximaal\.[a-z.]+$/i;
const INTERNAL_HOST = /\.intern\.systems$/i;

/**
 * Ticket 05: deduplicate on the target identity. A page that links the same
 * target eight times has one target.
 *
 * @param {import('./contract.mjs').LinkRecord[]} links
 * @returns {Map<string, import('./contract.mjs').LinkRecord>}
 */
function byKey(links) {
  const map = new Map();
  for (const link of links) if (!map.has(link.key)) map.set(link.key, link);
  return map;
}

/**
 * Anchor text is the only identity available for "the same anchor now points
 * somewhere else": an element carries no DOM path. So a text that occurs once on
 * each side is a usable anchor identity, and a text that repeats is not — two
 * `Lees meer` links cannot be told apart, and a wrong pair asserts a target
 * change that did not happen.
 *
 * @param {import('./contract.mjs').LinkRecord[]} links
 * @returns {Map<string, import('./contract.mjs').LinkRecord>} Unique texts only.
 */
function byUniqueText(links) {
  /** @type {Map<string, import('./contract.mjs').LinkRecord | null>} */
  const map = new Map();
  for (const link of links) {
    const text = tier2(link.text);
    if (!text) continue;
    map.set(text, map.has(text) ? null : link);
  }
  for (const [text, link] of map) if (!link) map.delete(text);
  return /** @type {Map<string, import('./contract.mjs').LinkRecord>} */ (map);
}

/**
 * @param {object} input
 * @param {import('./contract.mjs').PageExtract} input.production
 * @param {import('./contract.mjs').PageExtract} input.new
 * @param {import('./findings.mjs').FindingCollector} input.collector
 * @param {Set<string>} [input.newSitePaths]  Lowercased paths that exist as a new-site
 *   page. `leakage` needs it: a live-domain link whose path is not a page here is
 *   not a link that should have been rewritten.
 * @param {Map<string, { status: number, hops: number }>} [input.statuses]  Keyed on the
 *   absolute url. Absent means `broken-link` and `redirect` are not checked.
 */
export function compareLinks({ production, new: next, collector, newSitePaths, statuses }) {
  const prodLinks = byKey(production.links);
  const newLinks = byKey(next.links);
  const newHost = new URL(next.url).host.toLowerCase();

  // Ticket 34. An anchor and its words share one position on the document-order
  // counter, so a link finding names the same section the content view would.
  const prodHeading = anchorHeadingFor(production.elements);
  const newHeading = anchorHeadingFor(next.elements);

  // --- Absolute checks on the new site -----------------------------------
  // These run first, because a leaked or cross-store link is already fully
  // explained. Reporting it a second time as `extra-link` would inflate the
  // count with no new instruction for the editor.
  const explained = new Set();

  for (const link of newLinks.values()) {
    const host = new URL(link.url).host.toLowerCase();
    const path = new URL(link.url).pathname.toLowerCase().replace(/\/+$/, '');
    const anchorHeading = newHeading(link.index);

    if (LIVE_HOST.test(host) && !LEAKAGE_ALLOWED_HOSTS.has(host) && path && newSitePaths?.has(path)) {
      // A bare-home target has no path and falls out here, which is what spares
      // the `disclaimer` boilerplate on all six stores.
      collector.add({ class: 'leakage', prod: null, new: link.key, anchorHeading });
      explained.add(link.key);
    }

    if (INTERNAL_HOST.test(host) && host !== newHost) {
      // Host-based, not store-based: `be` and `be_fr` share one host, and a
      // store-based test would report every be_fr page against itself.
      collector.add({ class: 'cross-store-link', prod: null, new: link.key, anchorHeading });
      explained.add(link.key);
    }

    if (!statuses || !link.internal) continue;

    const state = statuses.get(link.url);
    if (!state) continue;

    if (state.status >= 400 || state.status === 0) {
      // Absolute, not comparative: it fires even when production is broken too,
      // because a dead link is actionable with near-zero false positives.
      collector.add({ class: 'broken-link', prod: null, new: link.key, anchorHeading });
      continue;
    }

    if (state.hops > 0) {
      const counterpart = prodLinks.get(link.key);
      const prodState = counterpart ? statuses.get(counterpart.url) : undefined;
      // Never a finding when both sides redirect alike.
      if (prodState?.status === 200 && prodState.hops === 0) {
        collector.add({ class: 'redirect', prod: counterpart?.key ?? null, new: link.key, anchorHeading });
      }
    }
  }

  // --- Comparative checks ------------------------------------------------
  const prodByText = byUniqueText(production.links);
  const newByText = byUniqueText(next.links);
  const retargeted = new Set();

  for (const [text, prodLink] of prodByText) {
    const newLink = newByText.get(text);
    if (!newLink || newLink.key === prodLink.key) continue;
    // The same anchor, a different target.
    collector.add({
      class: 'link-target', prod: prodLink.key, new: newLink.key, anchorHeading: prodHeading(prodLink.index),
    });
    retargeted.add(prodLink.key);
    retargeted.add(newLink.key);
  }

  for (const [key, link] of prodLinks) {
    if (newLinks.has(key) || retargeted.has(key)) continue;
    // Ticket 05 suppresses `missing-link` when production's own counterpart is
    // broken: the new site did not lose anything worth having.
    const state = link.internal ? statuses?.get(link.url) : undefined;
    if (state && (state.status >= 400 || state.status === 0)) continue;
    collector.add({ class: 'missing-link', prod: key, new: null, anchorHeading: prodHeading(link.index) });
  }

  for (const [key, link] of newLinks) {
    if (prodLinks.has(key) || retargeted.has(key) || explained.has(key)) continue;
    // Hidden by default: the new site legitimately gained content, and flagging
    // an added link invites editors to delete good work.
    collector.add({ class: 'extra-link', prod: null, new: key, anchorHeading: newHeading(link.index) });
  }
}
