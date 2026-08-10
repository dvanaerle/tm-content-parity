# 56 — An excluded page says why

Type: task
Status: resolved
Assignee: —
Blocked by: 54
Parent: 50-content-page-discriminator.md

**What to build:** an editor sees every page the log found, including the ones it
does not compare, and each of those says why. About 60 of the roughly 800 new
pages have nothing to compare: a form confirmation page, a gallery photo page, a
cookie toggle, a logout path. Comparing them would add findings for ever that no
editor can act on. Dropping them silently would break the rule that this log never
hides a page.

So they are counted and shown, and they are not compared.

- [x] Every page found by the rule reaches the dashboard. Nothing is silently
      absent.
- [x] A page that the log does not compare says which rule excluded it, in words
      an editor can read.
- [ ] The excluded pages are: gallery photo pages, form confirmation pages, form
      endpoints, store roots, cookie toggles, logout paths, and the ten British
      product pages the alternate clause admits. Ticket 50 measured about 60 in
      total, and a false-positive rate of 3% to 21% for each store before the
      exclusions. **This line is wrong against the corpus. See below.**
- [x] The exclusion list is a committed list with a reason for each entry, not a
      rule buried in the code. A wrong exclusion is then reversed by editing a
      list, and never by crawling again.
- [x] An excluded page is counted in the store total. The dashboard must not show
      a total that hides them, because ticket 38 already found that an editor
      reads the comparable count as the size of the store.
- [x] The existing excluded-page path in the front end carries these, rather than
      a second mechanism beside it. It holds one Dutch page today.
- [x] `npm test` is green.

## Resolved 2026-08-10

### The one gate that failed is the list of kinds

The ticket names seven kinds of excluded page and estimates 60. The corpus that
exists holds **106**, and they are of two kinds and not seven:

| kind | count | where it is decided |
| --- | --- | --- |
| dropped by the seed rule | **105** | `data/10-store-seeds.json`, all `product-signature` |
| excluded by key | **1** | `shared/excluded-pages.mjs`, `veranda-configurator`, nl only |
| not crawled | **3** | no report; `faq/offerte` on nl and be, and `(uk)measuring-tool` |

Every one of the 105 is a product page. There is **no** gallery photo page, form
confirmation page, form endpoint, store root, cookie toggle or logout path among
them. Those pages are not in the drop list because they were never candidates:
the six production sitemaps do not declare them, so the seed rule never saw one.
Ticket 50 measured them against the **new-site crawl**, which is a different
population and is not an input to this stage.

The ten British product pages are real and they are there: `uk` drops exactly 10,
and the other five stores drop 19 each.

The third row is the ticket's own sentence — "nothing is silently absent" — turned
on the log itself. Three pages are in the seed list on both sides and have no
report. Nothing decided that; the fetch failed. Before this ticket they were in no
list at all, so the dashboard now names them, and names them as an accident and
not as a decision.

### What was built

- **`shared/drop-rules.mjs`** is new. It holds `DROP_RULES` — the named rules
  with their words. `crawl/` writes the name and `web/` reads it back, so two
  stages read one pure rule and neither imports the other. ADR 0001 records it as
  the fifth resident.
- **`web/src/lib/not-checked.mjs`** is new. It merges the three kinds into one
  list per store, folds the list onto its reasons, and does the store arithmetic.
  Only `web/` reads it, so it stays in `web/`.
- **`crawl/seed-list.mjs`** emits a `DropRecord` — `{loc, store, path, rule}` —
  in place of the sentence fragment it used to write. The rule is a **name**, so
  the sentence can be rewritten without a new seed list.
- **`data/10-store-seeds.json`** carries `dropped` as the **list** it counted
  before. 105 entries, tracked by git. `schemaDisagreements()` refuses a drop
  whose rule no vocabulary explains.
- **The dashboard** states `pagina's gevonden` and the pages it does not check
  are inside it. `storeTotals()` does that arithmetic, so ticket 38's defect has
  a test. The *Niet gecontroleerd* aside is one list now, folded onto its
  reasons, with the three kinds kept apart in words.
- **`CONTEXT.md`** widens **Not checked** to the three kinds and says plainly not
  to call any of them "not compared", because **Uncompared** is taken and means a
  row inside a page.

### The review moved two things

The first draft put the whole of `not-checked.mjs` in `shared/` and called the
concept *not compared*. Both were wrong and the review caught both.

- ADR 0001 says `shared/` is for pure code that **two** stages read, not for pure
  code. Only the drop vocabulary has two readers, so the merge went back to
  `web/`, and `excludedInStore` went back with it rather than being re-exported
  through `reports.mjs` to keep an old import path alive.
- *Not compared* collided with **Uncompared**, which `CONTEXT.md` already gives
  to a row that is too large for a word comparison. **Not checked** was already
  the word for this concept and it was already in `CONTEXT.md`; the draft had
  renamed a term that did not need renaming.

### Reversing a wrong exclusion needs no crawl

It already worked and nothing claimed it. The generator reads its own committed
output and carries forward any row the sitemap no longer declares. A page put
back into `data/10-store-seeds.json` by hand therefore survives every later run,
even though the rule still drops its loc. That is now a test rather than a
property nobody had noticed.

No re-admit override list was added. The product signature has **zero** measured
false positives — `crawl/probes/probe-product-signature.mjs` read all 876
candidates and the signature names the 105 `catalog-product-view` pages and none
of the other 771 — so a second mechanism would have had no entries.

### The gate

| | before | after |
|---|---|---|
| `npm test` | 472 | **507** |
| test files | 20 | **22** |
| drops recorded in the seed list | a count, `105` | **a list of 105** |
| pages a store dashboard admits it found | crawled only | **crawled + not checked** |

The finding counts do not move. This ticket compares nothing new; it says what the
log already left out.

### Not verified here

`npm run build` in `web/` was not run: this checkout has no `web/node_modules`.
The three import paths were resolved on disk instead, and every pure module the
page and the component now import loads under Node.

### Two things recorded and not fixed

**A `foreign-host` drop reaches no dashboard.** It belongs to no store, and every
dashboard is a store's, so there is nowhere to put it. The corpus holds **zero**
of them today, so this is latent. `data/10-store-seeds.md` lists every drop
whatever its store, which is the only surface it has.

**The reasons are English in a Dutch dashboard.** That is the convention the two
lists before this one set: `shared/excluded-pages.mjs` and
`shared/excluded-regions.mjs` both carry English reasons that the aside renders,
and only the labels are Dutch. This ticket followed it rather than changing three
lists at once. Whether an editor reads them is a fair question, and it is one
question for all three.

### Still open, and handed on

`no-declared-alternate` still has no surface. `Ledger.jsx` returns the *Niet te
vergelijken* panel before any finding renders, so a one-sided page shows nothing.
That is a page-level view and this ticket changed the store-level one; it goes to
ticket 20 at step 33, as the worklist says.

## Why this is not part of ticket 55

It hangs off ticket 54, not ticket 55, so it can be built while the five stores
are crawled. It changes what the dashboard shows, not what the crawl fetches.
