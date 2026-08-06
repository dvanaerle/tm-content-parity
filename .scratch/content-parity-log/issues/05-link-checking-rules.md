# 05 — Link checking rules

Type: grilling
Status: resolved
Blocked by: —
Parent: ../map.md

## Question

What does the Links tab check, and what counts as a defect?

Links are the highest-signal check available, because a URL either answers or it
does not. Almost no false positives.

## Evidence from the probe

One page, `heavy-duty-terrasoverkapping`:

- 21 unique in-content links on prod, 16 on new.
- **4 link targets missing on new**: `/carport`, `/zwarte-overkapping`,
  `/actievoorwaarden-10-korting-terrasoverkappingen`,
  `/reviews/1038051/tuinmaximaal`.
- **1 broken link**: `valanticnl.intern.systems/showroom-contact` returns **404**.
- 0 links leaking to a live domain on this page.
- 37 unique URLs checked in **1.1 seconds**, so a site-wide sweep is cheap.

## What to settle

- **Scope.** Internal links only, or external too? External links break for
  reasons nobody here controls, and they add flakiness and rate-limit risk.
- **Redirects.** Is a 301 a defect, a warning, or fine? On a migration a redirect
  chain is often intended, but a redirect where prod served 200 is suspicious.
- **Host normalisation for target comparison.** A prod link to
  `www.tuinmaximaal.nl/carport` and a new link to
  `valanticnl.intern.systems/carport` are the same target. Compare on path, and
  decide what to do with query strings, trailing slashes, anchors and casing.
- **Domain leakage.** The new site linking to a live `tuinmaximaal.*` domain is a
  classic migration defect. Always a finding? The probe found 0 on this page, so
  confirm site-wide before deciding how loudly to flag it.
- **Cross-store leakage.** A DE page linking to an NL page is a different defect
  and probably worth its own class.
- **Caching and politeness.** One URL appears on many pages. Deduplicate
  site-wide, cache statuses for a run, cap concurrency, and decide whether HEAD
  is trustworthy or GET is needed. Note the new site's 404 page is 335 KB, so
  status codes matter more than body size.
- **Link text.** Same target, different anchor text — a finding, or noise? It
  overlaps the text diff, so decide which tab owns it.
- **Nofollow, target and rel** attributes — in scope or not?

## Notes

First cut in
`devdva02/.scratch/sitemap-content-overview/_scripts/prototype-links-probe.mjs`.
Run it on any slug: `node prototype-links-probe.mjs <slug>`.

The `/showroom-contact` 404 is a real defect found while charting. It should
become a finding in the log, not be fixed quietly here.

Resolve with `/grilling`.

## Answer

The Links tab compares **targets**, never wording, and it checks the health of
internal targets only.

### Site-wide measurement

Made for this ticket with
`.scratch/sitemap-content-overview/_scripts/probe-link-leakage.mjs`
(writes `_data/probe-link-leakage.json`). New-site hosts only; production was not
contacted. 451 store-page pairs, 415 answered 200.

- **7,543 in-content anchors** inside `<main>`, **4,092 unique http(s) targets**.
- **531 anchors (7%) are non-navigational**: 408 `#`-only, 70 `tel:`, 53 `mailto:`.
  **Zero** protocol-relative and **zero** `javascript:` hrefs, so three simple
  skips cover the whole site.
- **Live-domain leakage: 36 of 415 pages, 20 unique targets.** Four root causes:
  `360tour.tuinmaximaal.com` (a separate live service, no new-site equivalent),
  hardcoded NL storefront links (`/garantie`, `/herroeping`, `/glazen-schuifwand`,
  `/terrasoverkapping`, `/terrasoverkapping/productinformatie#onderhoud`), the
  `disclaimer` page linking to its **own** store's live home on all six stores,
  and one live-domain PDF on `.de`.
- **Cross-store leakage between `valantic*` hosts: 0 pages.** But
  `tuinmaximaalbe.intern.systems` is linked from **4 pages** — a stale internal
  host, a third flavour of leakage.
- **The external surface is tiny: 28 distinct hosts.** YouTube on 38 pages,
  `maps.app.goo.gl` on 36, Instagram 11, review platforms, then a tail of
  ~2-page partner links.
- Incidental: **36 of 451 new-site pages are not 200** — 34 known legacy-only
  pages, and **`faq/offerte` on nl and be is a redirect loop**. Graduated to
  ticket 17.

### Scope

- **Status-check internal targets only** — the production host, the five
  `valantic*.intern.systems` hosts, and live `tuinmaximaal.*`. External targets
  are extracted and compared for presence, but **never fetched**: 28 hosts of
  YouTube, Google Maps and review platforms would add flakiness and rate-limit
  risk for defects nobody here can fix.
- **Skip `mailto:`, `tel:` and `#`-only hrefs.** No other shapes exist.
- All anchors inside `<main>` count, per ticket 02.

### Target identity (`prodNorm` / `newNorm`)

1. Fold the page's own production host and its own new-site host to a single
   token, so `www.tuinmaximaal.nl/carport` and
   `valanticnl.intern.systems/carport` are the same target.
2. Lowercase the path and strip the trailing slash.
3. **Keep the query string** — a filter link with different params is a
   different target.
4. **Drop the fragment** for identity; keep it for display.

### Classes

`class` is the only axis and it is the mute key (ticket 01), so link findings
carry a granular set rather than one `link` class — otherwise an editor must
mute genuine 404s to silence intended redirects.

| class | shown | fires when |
| --- | --- | --- |
| `broken-link` | yes | a new-site internal target answers ≥400, or the redirect lands on a 404 or loops. **Absolute, not comparative** — actionable with near-zero false positives even when production is broken too. |
| `missing-link` | yes | a target present on production is absent on the new site. **Comparative.** Suppressed when production's own counterpart is also broken. |
| `link-target` | yes | the same anchor points at a different normalised target on each side. |
| `leakage` | yes | a link to a live `tuinmaximaal.*` domain **whose path exists as a page on the new site** — the "should have been rewritten" case. Host allowlist: `360tour.tuinmaximaal.com`. Bare-home targets fall out naturally, which excludes the `disclaimer` boilerplate. Live-domain **media** is the Images tab's problem, not this one. |
| `cross-store-link` | yes | a link to a `*.intern.systems` host other than the page's own store host. Widened from the original store-based idea to **host**-based, because `be` and `be_fr` share `valanticbe.intern.systems` and a store-based test would report every be_fr page against itself. Its first real findings are the 4 stale `tuinmaximaalbe.intern.systems` links. |
| `redirect` | **no** | production served 200 on the counterpart and the new site's link redirects. On a migration a redirect is usually intended. Never a finding when both sides redirect alike. |
| `extra-link` | **no** | a new-site in-content link production does not have. Recorded so the difference count stays complete, but quiet — an added link is often deliberate, and flagging it invites editors to delete good work. Mirrors `restructured` in ticket 02. |

### Method and politeness

- **HEAD first, GET fallback** on 405, 501 or anything ≥400, so a "broken"
  verdict is always confirmed by a GET. Magento and CDNs mishandle HEAD often
  enough to invent phantom 404s. The new site's 404 page is 335 KB, so the
  fallback is only paid on suspected failures.
- Deduplicate site-wide on the normalised URL, cache statuses for the whole run,
  cap concurrency at 8. Plain `fetch`; no Playwright.
- Follow redirects, and record the final status plus the hop count.

### Out of scope for this check

- **Anchor text belongs to the Diff tab.** Links matches on the normalised
  target and stays silent on wording. Reporting it in both places is exactly the
  "never make a finding it then hides" problem from ticket 02.
- **`rel`, `target` and `nofollow`** are not findings. They are invisible to a
  content editor, they come from the template rather than the content, and they
  would add a class nobody acts on. Revisit only if an SEO owner asks — and then
  as its own effort, since phase-2 SEO is already out of scope.
- **Non-200 pages in the log are not Links findings.** They are page-level
  status, not link targets. The 34 legacy-only 404s wait on the legacy-only
  question in the fog; the `faq/offerte` redirect loop is ticket 17.

### Recheck behaviour

Recheck fetches the two page HTMLs, then status-checks **only that page's
targets**, deduplicated within the page, with a cold cache. No site-wide sweep
from the button. `leakage`, `cross-store-link`, `missing-link`, `extra-link` and
`link-target` need no network beyond the two page fetches, so only `broken-link`
and `redirect` pay for requests — and 37 unique URLs took 1.1 seconds in the
probe, so one page stays inside a button press.
