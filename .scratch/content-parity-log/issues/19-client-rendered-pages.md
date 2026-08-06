# 19 — Pages that plain `fetch` cannot read

Type: grilling
Status: resolved
Blocked by: —
Parent: ../map.md

## Question

What does the log do with a page whose content is not in the HTML that the
server sends?

## Why this is a sharp question

Ticket 07 extracted all 181 nl pages. **`veranda-configurator` gives 0 text
elements inside `<main>` on the new site.** The page is client-rendered: plain
`fetch` receives an empty shell. Production sends a full page.

The comparison is not yet built, so nothing is wrong today. But a page with 0
elements on one side and a full page on the other makes **every** production
element a `structure` finding. One page would carry more findings than the rest
of the store, and all of it false. It also breaks the promise of the Recheck
button on that page: the count can never fall.

The map records "plain `fetch` is enough for both sites, so Playwright is not
needed". That fact is true for 180 of 181 pages, and this is the exception.

## What to settle

- Is an empty-on-one-side page **excluded** from the log, or is it rendered with
  a browser?
- If it is excluded, how does an editor learn that the page is not checked? A
  page that is silently absent is worse than a page that says why.
- Is there a **guard**? "One side has 0 elements and the other has many" is
  cheap to detect and it must never become a wall of findings — the same shape
  as ticket 14's assert-loudly rule.
- Are there more of these? Only the nl store is measured. The other five stores
  and their configurator pages are not.

## Notes

Graduated from ticket 07. Evidence in `data/probe-extract-v2.json` in
`tm-content-parity`, re-made with `node crawl/probes/probe-extract-v2.mjs`.

## Answer

**The premise of this ticket was wrong, and the correction is the answer.** The
page is not a content page that plain `fetch` cannot read. It is an
**application page**, and it is out of the log by definition.

### What the measurement said

- `veranda-configurator` is the **only** page with 0 text elements in ticket 07's
  362 extractions.
- **Production answers 404 on it.** Re-probed live: `/veranda-configurator`,
  `/configurator`, `/veranda/configurator` and `/veranda-op-maat` all answer 404
  on `www.tuinmaximaal.nl`, and the seed row's `source` is `new-site-crawl`, not
  the production sitemap. The page is new-only, so the wall of false `structure`
  findings this ticket feared **cannot happen**: ticket 07's `status === 200`
  gate already excludes it.
- It is **nl only**. All five other store cells are `null`, and no other seed row
  matches `configurator|konfigurator`. The fourth question — "are there more of
  these in the other stores?" — is answered by the seed data, with no crawl
  needed.
- Inside `<main>` there is one PageBuilder `html` block that mounts
  `Dinoxi_ConfiguratorBff` on `<div id="configurator-root" data-url-key="veranda">`
  plus a module script. **0 text elements is the correct extraction, not a
  failure.** A browser render would give configurator UI state, not content an
  editor writes. The `<title>` is the literal string `veranda-configurator`.
- `pageType` does **not** separate it: the body class says `cms-page`, the same
  as every other page. No automatic discriminator exists.

### The decisions

1. **An application page is a page kind, not a fetch problem.** A page whose
   content boundary holds a mounted JavaScript application has no content unit,
   so it is outside the log by definition. This is not ticket 20's business:
   ticket 20's rows close when somebody rebuilds or retires a page, and the
   configurator will never be "rebuilt as content", so its row would stay open
   for ever. The exclusion must also survive production gaining a configurator
   url later, which a one-sided-page rule would not.
2. **The exclusion is a committed list of exact page keys**, each with its
   reason: `crawl/excluded-pages.mjs`. Not a pattern — `/configurator/` would
   also swallow a future `configurator-vergelijken` content page. Not a
   detection rule on `#configurator-root` — that breaks when the module renames
   its root div, and it buries the decision inside the extractor. Not a Supabase
   override — this is a scope decision by an engineer, and ticket 11 already
   chose a committed list over Supabase for brand tokens on the same reasoning.
   The list holds exactly one entry today.
3. **An excluded page stays visible.** It appears in a short **Not checked**
   list with its reason, outside every bar and both axes. A silently absent page
   is worse than a page that says why. It is never a normal page row with empty
   tabs, which would be a row that can never close.
4. **Browser rendering is ruled out for good.** No Playwright in the crawl or in
   the re-check service. It would make the Recheck button slow, and the guard
   below is what catches a future application page: a fast, loud failure that a
   human then adds to the exclusion list. The map's fact upgrades from "true on
   180 of 181 pages" to "true for every page in scope".
5. **The guard is absolute emptiness, never a ratio** — and implementing it
   corrected the shape the grilling had agreed. "Zero text elements" was wrong:
   five extractor tests fail under it, because an **image-only `<main>` is a
   legitimate page shape** and a photo page has no text. The invariant is
   therefore *no text element **and** no image **and** no link* inside the
   boundary on an HTTP 200 response. The configurator scores 0 on all three.
   Measured on the whole nl store: **1** page hits the strict guard
   (the configurator) and **0** pages are image-or-link-only, so the guard has
   no other victim. It throws, like ticket 14's missing `<body>`; it is not a
   finding, because an undeclared application page or a broken parse is an
   engineering fault and no editor can act on it.
   A ratio guard was rejected because `fotogalerij` is 9 elements against
   production's 178 on two live 200 pages — the threshold band is already
   occupied by a real page.

### Built

`tm-content-parity`, tests **58 green**:

- `crawl/excluded-pages.mjs` — `EXCLUDED_PAGES` with the reason,
  `isExcludedPage()`, `exclusionReason()`.
- `crawl/extract.mjs` — `assertHasContent()`, called at the end of
  `extractPage()`.
- `crawl/20-extract.mjs` — `extractStorePage()` refuses an excluded page loudly,
  so neither a run nor the re-check service can fetch one by accident.
- `crawl/probes/probe-extract-v2.mjs` — filters the exclusion list.
- Two existing test fixtures used `<h1>x</h1>`, which `norm.length < 2` drops, so
  they were empty pages by accident. Now `<h1>Kop</h1>`.

**Validated live**, whole nl store re-probed with the guard in place: 180 pages
after the exclusion, production **180 extracted, 0 failed**, the new site **179
extracted, 1 failed**. The guard fired **0 times** in 359 extractions. The one
failure is `faq/offerte` with `TypeError: fetch failed` — ticket 17's known
redirect loop, a network fault, not the guard.

The web build's **Not checked** list is not built — it belongs with the front end.

### Handed on

- **Ticket 25** — `fotogalerij`: production 178 text elements and 81 images
  against the new site's 9 elements, 38 images and 45 links, both sides 200.
  Either the largest genuine parity defect in the nl store or a deliberate
  redesign, and one page able to emit ~170 findings tests the bar, the dismissal
  model and the tab UI at once.
