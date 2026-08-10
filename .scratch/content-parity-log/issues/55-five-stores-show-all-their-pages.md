# 55 — The other five stores show all of their pages

Type: task
Status: resolved 2026-08-10
Assignee: —
Blocked by: 54
Parent: 50-content-page-discriminator.md

**What to build:** every one of the six dashboards holds every record. An editor
of the German store sees about 137 pages where they see 45 today. An editor of the
British store sees about 138 where they see 42. This is the condition the whole
effort was asked for.

Ticket 54 proved the path on one store. This ticket repeats it on the other five
and corrects the numbers that the old page list produced.

- [x] The `nl`, `be`, `be_fr`, `de` and `uk` stores are crawled and compared on
      the new page list, and each dashboard shows every page in it.
- [x] The store page total is recorded. Ticket 50 expects about 800, against 451
      today, so the crawl is about 1,600 requests.
- [x] **The NL baseline does not move.** Its 181 pages, and the numbers ticket 38
      recorded for it, must be the same. NL is the one store where the new rule
      finds nothing new, and that is the check that the rule did not over-collect.
      **Held byte for byte, against the pre-55 measurement. See the correction
      below: ticket 38's own numbers are not the right target any more.**
- [x] The link check runs once over all six stores, with no store named. It
      overwrites one global file, so a run for one store erases the store before
      it. Ticket 38 found this the hard way.
- [x] Ticket 38's per-store table is re-measured and corrected, and so is its
      entry in the map. Its counts read the old page list, so every non-NL number
      in it is a floor and not a measurement. This is bookkeeping: it decides
      nothing and it does not reopen ticket 38.
- [x] Ticket 49's measurement of the Belgian-French blind spot is re-checked. It
      was scoped to 29 pages and the store now holds about 125. **It is 122, and
      the re-check re-opens the ticket.**
- [x] The German and British stores reach the navigation coverage ticket 50
      measured: 90.6% and 88.5%. Each miss must be a page that is in no sitemap.
      **Both hit exactly. One British miss is a defect and not an absent page.**
- [x] The contract and `CONTEXT.md` agree, and the contract no longer promises
      that a page is identified by its Dutch url key. `CONTEXT.md` was corrected on
      2026-08-07 and the contract was not. This came from ticket 57, which is
      merged. **Closed by ticket 54 before this ticket opened. Verified, not
      rebuilt.**
- [x] `npm test` is green, and the regression gate passes for each store.

## Answer, 2026-08-10

**Every criterion holds. The log is 816 store pages, against 451.** An editor of
the German store sees **134** pages where they saw 45, and an editor of the
British store sees **128** where they saw 42.

### The hosts answered, and that is what unblocked it

Ticket 54 was stopped by HTTP 500 on all five `valantic*` hosts. Checked again
before any `data` step, as the runbook orders: **all five answer 200**, and
`valanticnl.intern.systems/terrasoverkapping` returns a 739 KB page with its real
title. `fr` and `uk` answer 404 for a Dutch url key, which is right — they hold
their own.

So ticket 54's two open criteria were unblocked by the same measurement, and its
French crawl ran as part of this sitting.

### The corpus

| | before | after |
|---|---|---|
| store pages crawled | 448 | **816** |
| comparable | 373 | **722** |
| findings | 34,559 | **54,723** |
| shown by default | 23,570 | **37,329** |
| link targets checked | 9,119 | **13,406** |
| pages built | 455 | **823** |

| store | crawled | comparable | findings | shown | median shown |
|---|---|---|---|---|---|
| nl | 179 | 124 | 9,635 | 6,747 | 37 |
| be | 130 | 122 | 9,744 | 6,572 | 34 |
| be_fr | 122 | 115 | 8,231 | 5,546 | 26 |
| de | 134 | 123 | 8,932 | 6,149 | 29 |
| fr | 123 | 117 | 8,154 | 5,495 | 25 |
| uk | 128 | 121 | 10,027 | 6,820 | 30 |
| **all six** | **816** | **722** | **54,723** | **37,329** | |

Each dashboard was counted in the built HTML and holds exactly its store's row:
179, 130, 122, 134, 123, 128.

**The crawl was 368 requests and not 1,600.** The estimate was right for the work
and wrong for this sitting: `fr` and `be_fr` were already on disk against the new
key set, and `be` needed 5 pages. Only `de` (89) and `uk` (86) were large. 184
pages, both sides.

### The NL baseline held, and the criterion that asks for it is now stale

`node compare/measure.mjs nl` gives **179 / 124 / 9,635 / 6,747 / median 37 /
median total 56**, identical in every field to the measurement taken before the
crawl. `node crawl/21-crawl-store.mjs nl` wrote **0** extracts, which is the
mechanism: without `--force` the crawler skips a page that already has an extract,
so the 179 nl extracts were never re-fetched and could not drift.

**But the criterion says "the numbers ticket 38 recorded", and that target is
wrong now.** Ticket 38 recorded nl at 10,796 findings and 7,456 shown. Tickets 62,
63 and 64 all landed afterwards and all removed findings on purpose. The nl
baseline that must not move is the **pre-55** one, 9,635 and 6,747, and that is
what was checked. Recorded here rather than quietly re-pointed, per `AGENTS.md`.

This is also exactly why ticket 38's table needed re-measuring, so the two halves
of this ticket answer each other.

### Two pages of 820 cannot be crawled, and both are storefront defects

Neither is a tool failure and neither is new work for the log.

- **`faq/offerte`, on nl and be.** The new site 302s it into a redirect loop at
  `/freequote/payment/index/data/offerte/`, so `fetch` gives up. This is ticket 17,
  recorded in `devdva02` already, and it is why nl is 179 of 181 and not 180.
- **`(uk)measuring-tool`.** Production 301s `/measuring-tool` and the chain ends on
  `/en`, a **404**. The new site serves a **456-byte page with no `<main>` and no
  visible text at all**. The extractor refused it, which is the guard working: it
  says an HTTP 200 page with no content is either a broken parse or an application
  page. Here it is neither — the page is empty on one side and gone on the other.

So 820 seed pages give 816 reports: 820 − 1 excluded (`veranda-configurator`) − 2
`faq/offerte` − 1 `measuring-tool`.

### Navigation and footer coverage, all six stores

The probe reads production only. Ticket 50 predicted 90.6% for `de` and 88.5% for
`uk`, and **both land exactly**.

| store | in the seed list | coverage |
|---|---|---|
| nl | 49 of 52 | 94.2% |
| be | 48 of 53 | 90.6% |
| be_fr | 46 of 50 | **92.0%** |
| de | 48 of 53 | **90.6%** |
| fr | 46 of 51 | 90.2% |
| uk | 46 of 52 | **88.5%** |

Every miss is `/blog`, a blog post, or the newsletter page, and every one of those
is absent from all six sitemaps — **with one exception**. The British chrome links
`/Separate-parts` with a capital letter, and only the lower-case path is in the
sitemap. That miss is a defect and not an absent page, and it is the first of the
two handed over below. The probe found it independently of the footer read that
went looking for it.

**A probe defect was fixed on the way, and it moved one number.** `NOT_A_PAGE` is
anchored at the store root, and `be_fr` is the one store whose root is not `/`. Its
paths carry the `fr/` prefix, so `fr/checkout/cart` and three account routes never
matched the application-route rule and sat in its denominator as content pages.
`be_fr` reads **92.0%** and not 85.2%. **No other store moved by a thousandth**,
which is what says the fix is the fix and not a new rule. This is the same class of
defect ticket 54's review found in the same probe: `be_fr` is the store that every
per-store assumption forgets.

### The 19-finding gap between two true numbers

`compare/30-compare.mjs` reports **54,742** findings and the six `measure.mjs` runs
sum to **54,723**. Both are right. The 19 are `no-declared-alternate` findings on
**one-sided** pages — be_fr 3, de 8, fr 3, uk 5 — and `measure.mjs` counts over
comparable pages. `shown` is **37,329** either way, because the class is hidden.

It is written down because a 19 that nobody explains is how a real defect hides
next time.

### The link check ran once, over all six stores

`node compare/link-status.mjs`, no store argument. **13,406 unique targets: 214
broken, 1,417 redirected, 11,775 ok**, against 9,119 targets before. Ticket 59's
refusal was never tested by hand, because the correct call is the one that was
typed.

### The contract was already right

The criterion asks the contract to stop promising that a page is its Dutch url key.
**Ticket 54 closed this before this ticket opened.** `compare/contract.mjs:117-124`
types the page key as the NL url key *or* `(store)path`, says more than half are
the second kind, and names `shared/page-key.mjs` as the one reader that knows the
shape. `CONTEXT.md:18-21` says the same thing in the same words. Verified and left
alone — a rewrite of correct prose is a diff that costs a review and buys nothing.

### What falls out, and it is four things

- **Ticket 04** closes. It is `reopened` today.
- **Ticket 49 is re-opened**, `needs-triage`. Its own first trigger fired: `be_fr`
  went 29 pages to 122, and the new-side count that made it wontfix went from **1
  in-scope anchor to 12**. The `/media/` half of its reasoning still holds; the
  "one link nobody would act on" half does not. The new table is in the ticket.
- **Tickets 16 and 20** come back for triage, at `WORKLIST.md` step 33.
- **Ticket 38's table** is re-measured, in the ticket and in the map.

### The gate

| | before | after |
|---|---|---|
| `npm test` | 472 | **472** |
| nl crawled / comparable | 179 / 124 | **179 / 124** |
| nl findings / shown | 9,635 / 6,747 | **9,635 / 6,747** |
| nl median shown | 37 | **37** |
| pages built | 455 | **823** |

No test was added. This ticket adds no rule: it runs the pipeline the earlier
tickets built over a page list they had already settled, and the one code change is
four lines in a throwaway probe. 823 pages is 816 store pages, 6 dashboards and the
doorway.

## Two defects to hand over, not to fix

Neither belongs in the map. Both are the log's output, so record them in the
storefront defect list in `devdva02`:

- The British footer links a page with a capital letter that the site serves in
  lower case. The lower-case page exists and is in all six sitemaps.
- The French store and the Belgian-French store spell the same gallery url key
  two ways. One of the two is a typing defect.

### Both are measured, and both are handed over

Written to `devdva02/docs/storefront-defects.md`, beside the four already there.
**Uncommitted in that repo**, because a commit there is not this ticket's to make.

**One correction to the first line above.** The capitalised page is **not** in all
six sitemaps, and neither is the lower-case one. `/Separate-parts` 301s to
`/separate-parts`, which answers 200, and **only the lower-case form is in the uk
sitemap**. The other five stores hold their own url key for the page — nl and be
carry `losse-onderdelen` — so "all six sitemaps" was never the right test. The
defect is real and the link is wrong; the sentence describing it was not.

The second is exact. `fr` spells it **`galerie/eclairaige`** and `be_fr` spells it
**`fr/galerie/eclairage`**. `éclairage` is the French for lighting, so the French
store carries the typo. Every other gallery key matches between the two stores —
`carport`, `piece-de-jardin`, `portes-coulissantes`, `protection-solaire`,
`telecharger-des-photos` — which is what makes it a slip. Both URLs answer 200, and
the misspelling is the real address of the French page, so a repair needs a
redirect.
