# 20 — Pages that exist on only one side: the migration checklist

Type: grilling
Status: wontfix — **parked 2026-08-11**. Not blocked and not disproven: parked because
the decision vocabulary it was built to settle was never asked for by anybody. Read
*Parked — 2026-08-11* at the bottom before specifying this again.
Blocked by: Nothing. 22 and 55 are both resolved. See "The sizing has landed" below.
Parent: ../../map.md

## Question

A store page that answers 404 on one side makes no finding, because ticket 07
gates the compare stage on `status === 200` on both sides. Ticket 09 kept these
pages out of the parity bar and gave them a separate migration checklist with its
own count, on its own tab. What is on that checklist, and what closes a row?

## Handed here by ticket 11

The coverage axis gave two populations back to this checklist, so that Axis B
never reasons about status:

- **The 404 cell is this ticket, not Axis B.** The seed data holds two different
  absences. A **null cell** means that nobody ever asked for the page in that
  store, which is coverage, and ticket 11 makes it a `missing-page` finding. A
  **404 cell** means that the store claims the page in its own sitemap and the new
  site does not serve it, which is a migration defect on a page that exists. New
  site 404s per store, as ticket 11 measured them: nl 14, be 8, be_fr 4, de 3,
  fr 3, uk 2 — 34 in all. **Re-measured after the rebuild: nl 14, de 11, be 8,
  be_fr 7, uk 7, fr 6 — 53 in all.** The distinction this bullet draws is what
  survives; the six numbers are not.
- **A store page whose NL reference answers 404.** A DE page can answer 200 while
  its NL counterpart answers 404. Axis B emits nothing there, because a finding on
  the DE page sends the editor to the wrong page. The defect is on the NL page, so
  this checklist owns it.

## What to settle

- **The two populations are not the same problem.** 53 of 816 crawled store pages
  answer 404 on the new site (legacy-only: the page exists on production and is
  not rebuilt). 41 of 179 NL pages answer 404 on production and 200 on the new
  site (new-only: the `*/onderdelen` tree). One is missing work, the other is
  added scope. Do they share a tab, or are they two lists? And a third population
  arrived on 2026-08-11 — see the ticket 16 handover below.
- **What closes a row.** A legacy-only page closes when it is rebuilt (re-check
  sees 200) or when somebody rules it retired. The second is a judgement with no
  measurement behind it, so it needs an override kind — is it ticket 09's
  `dismissed` on a page-scoped key, or a fifth kind?
- **Is `*/onderdelen` one decision or 41?** If the whole tree is intended, one
  rule closes 41 rows. If it is per page, the list is 41 judgements. Nothing
  anywhere has answered this, and ticket 84's control is per page, so on today's
  spec that tree is 41 identical judgements typed one at a time.
- **Redirects.** A legacy-only page that production redirects to a surviving new
  page is not missing, it is renamed. Ticket 05 measured redirects and hid the
  `redirect` class. Does the checklist detect this, or does a human?
- **The five other stores.** 53 legacy-only rows across six stores may be far fewer
  distinct pages. Does the checklist work per store page, or per page with a store
  breakdown? Unanswered, and it matters more now than at first triage: the seed
  list holds 550 rows behind its 820 pairs, so one page can be six decisions.
- **Who reads it.** Ticket 09 ruled these are scope decisions, not editor work.
  If the reader is a manager and not an editor, the tab needs a different shape
  from the ledger.

## Notes

Graduated from the map's fog by ticket 09, which measured both populations.

Depends on ticket 04 for the store-page seed lists, on ticket 05 for the redirect
measurement, and on ticket 09 for the override model.

**Blocked by ticket 22.** This ticket reasons from page status, and every
`prodStatus` in the seed data is 0, because production was in maintenance mode for
the whole of ticket 04's run. The "42 NL pages answer 404 on production" figure
comes from ticket 07's own measurement, not from the seed file, and the legacy-only
population cannot be counted at all until 22 re-measures.

Resolve with `/grilling` and `/domain-modeling`.

## Also blocked by ticket 55, from the triage of 2026-08-07

**Ticket 22 is folded, not done.** Its re-measurement of `prodStatus` and
`prodRedirect` now happens inside
[53](../53-every-content-page-in-the-seed-list.md), on the rebuilt seed list. The
edge on 22 stays, because 22 is where a reader learns why the number is missing,
but the work is in spec [50](../50-content-page-discriminator.md) now.

**A second edge is added, on [55](../55-five-stores-show-all-their-pages.md).** Both
populations this ticket counts are counted **out of the seed list**, and spec 50
rebuilds it:

| what this ticket says today | why it moves |
|---|---|
| 34 of 451 store-page pairs answer 404 on the new side | 451 pairs become about 800 |
| per store: nl 14, be 8, be_fr 4, de 3, fr 3, uk 2 | every non-NL store grows, `fr` from 28 pages to about 110 |
| 42 of 181 NL pages are new-only, the `*/onderdelen` tree | the NL baseline holds at 181, so this half is stable |

The NL half is the one number that does **not** move: ticket 50 matched all 181
NL rows and none are new. Everything about the five other stores does.

So the questions stay exactly as written — they are about what a checklist is and
what closes a row, and no rebuild answers those. What must wait is the sizing.
"Do they share a tab, or are they two lists?" is a different answer at 34 rows
than at the number 55 produces.

Re-triage after 55. **Done — 55 resolved 2026-08-10 and the sizing is below.**

## Handed over from ticket 16 on 2026-08-11

> *This was generated by AI during triage.*

[16](../16-new-site-page-discovery.md) closed on a decision — **production is the
source of truth, and the new site is expected to match it** — so a page only the
new site has is not content to preserve. It is a deletion candidate, which makes it
one-sided-page work and therefore this ticket's.

**14 pages are live on the new site and 404 on production**, measured 2026-08-11.
None is in the seed list, so none appears in any store's dashboard today.

| store | path |
| --- | --- |
| nl | `algemene-voorwaarden` |
| be | `algemene-voorwaarden`, `herroeping-geleverd-webformulier`, `gazellen-awards` |
| be_fr | `fr/formulaire-de-retrait`, `fr/conditions-generales`, `fr/distributeur` |
| de | `allgemeine-geschaftsbedingungen`, `ruckruf-webformular-kein`, `gottingen`, `weser-ems`, `ostwestfalen`, `willkommen-bei-tuinmaximaal` |
| fr | `distributeur` |

They came from the new site's own sitemap, a file generated once with 2024 content,
which ticket 16 rejected as a discovery source. The German six look like real 2024
pages — `gottingen`, `weser-ems` and `ostwestfalen` are regional pages and
`willkommen-bei-tuinmaximaal` carries the title *Willkommen bei Tuinmaximaal |
Bestpreisgarantie*.

**Two cautions before any of these is called new content.** "404 on production"
means 404 at that path, not absent from production: `be/gazellen-awards` sits
beside a seeded `gazellen-award` in all six stores, `be_fr/fr/conditions-generales`
is seeded in the `fr` store, and `be/herroeping-geleverd-webformulier` has four
seeded siblings. Several of the 14 are near-name variants or a sibling store's
page. And this list is only what that sitemap declared — a page created on the new
site since 2024 is in no source at all.

**This does not change the sizing questions above.** It adds a third population to
the checklist — *lives only on the new side* — beside the 53-of-816 not-migrated
pairs and the 41 nl new-only rows. The grilling has to say whether that third one
shares the tab, and what closes such a row, given the closing action is a deletion
on the new site rather than an edit.

One number in `WORKLIST.md` step 33 must not be trusted here: "the new-only
population is entirely nl — all 41 of it, and no other store has a single one."
Thirteen of these 14 are non-nl. The zero was the shape of an nl-only crawl, never
a measurement.

## The sizing has landed, 2026-08-11

> *This was generated by AI during triage.*

Both edges are clear: **22** is resolved (folded into 51 and 53) and **55** resolved
2026-08-10. Nothing structural blocks the grilling.

**Read these three numbers as three different things**, because the rebuild left the
ticket with a pairs count, a rows count and a crawled count that are all correct:

| number | what it counts | source |
|---|---|---|
| 820 pairs | the seed list, two urls per store page | [53](../53-every-content-page-in-the-seed-list.md) |
| 550 rows | distinct pages behind those pairs | [53](../53-every-content-page-in-the-seed-list.md) |
| 816 crawled | 820 less the configurator, two `faq/offerte` and the measuring tool | [55](../55-five-stores-show-all-their-pages.md) |

The three populations, on today's reports: **53 legacy-only**, **41 new-only nl**, and
**14 live-on-new-only** — 94 one-sided reports in `data/reports/`, against 722 comparable.

### The measurement half shipped; the decision half did not

This is the thing to be clear about before grilling, because the dashboard looks finished.
One-sided pages are already **visible** in three places — the `eenzijdig` chip
(`web/src/components/Dashboard.jsx:89`), the store header sentence
(`web/src/pages/[store]/index.astro:52`) and a read-only aside listing each page with its
`skipReason` (`Dashboard.jsx:187`). Nothing there can be pressed, and the code says why:

- `Dashboard.jsx:33` — "One-sided pages are out of the bar from the first day: ticket 20 owns them."
- `Dashboard.jsx:89` — the chip's tooltip: "Ticket 20 beslist wat hiermee gebeurt."
- `compare/30-compare.mjs:64` — "No view states it yet… tickets 20 and 56 own that surface."

What is absent: the override vocabulary is scopes `finding | page-class | page` and actions
`fixed | dismissed | muted | reviewed | cleared` (`overrides/state.mjs:24-25`), enforced as
a closed list in `supabase/schema.sql:90-95` — so no migration verb can be written today.
And `Ledger.jsx:71` short-circuits on `!report.comparable`, so opening a one-sided page
returns a dead-end panel before any tab or control renders. The two directions are also
collapsed into one array (`Dashboard.jsx:36`); only the raw `skipReason` sentence tells them
apart on screen.

### What the grilling still has to decide

Ticket [84](84-a-one-sided-page-carries-a-migration-decision.md) already answers three of
the six questions above — the fifth override kind and its closed vocabulary
(migrate / not migrated / replaced / redirected), redirects as a contradictable claim of
fact, and a checklist with decided-and-waiting counts. It sits at `ready-for-agent`, so
an agent could build it before this grilling happens. Four questions are genuinely open:

1. **One tab, two, or three.** 84 defers this by name: "the four decisions may not both fit
   both directions, and the answer says which apply where" (84:42-44). The third population's
   closing action is a **deletion on the new site**, which none of the four values expresses.
2. **`*/onderdelen`: one rule or 41 rows.**
3. **Per store page, or per page with a store breakdown.**
4. **The 14 need verifying before they are acted on.** The two cautions above stand: 404 at a
   path is not absence from production, and several of the 14 are near-name variants or a
   sibling store's page.

Resolve with `/grilling` and `/domain-modeling`. The output feeds 84's vocabulary, so 84
should not be built until question 1 lands.

## Parked — 2026-08-11

> *This was generated by AI during triage.*

**The grilling ran and its answer was rejected.** Seven rounds resolved every question
above, and `/prototype` built three variants of the surface those answers describe. The
user reviewed them and refused both halves: the surface ("we already have the store views
on top, this is more like a downgrade") and the vocabulary ("usually, every page needs to
be built"). The decision record from that grilling is therefore **not written down
anywhere**, deliberately. It was superseded before it landed.

**The vocabulary had no requester.** Traced on 2026-08-11:

1. `content-parity-product-improvements.md` §14 lists four decisions — *migrate*,
   *intentionally not migrated*, *replaced*, *redirected* — as a brainstorm, with no
   measurement and no stated need. That file's own header says **"do not build from it."**
2. `PRD.md` stories 40–44 promote the four to *"As a migration lead, I want…"*. No
   migration lead asked; the role and the want were written in the same pass.
3. Ticket 84 hardens them into a closed override kind with a `supabase/schema.sql`
   constraint.
4. The grilling added three more — *renamed*, *keep*, *delete*. *Renamed* was forced only
   by `showroom-muechen` / `showroom-muenchen`, which the other six could describe solely
   as "delete a working page and rebuild it".

Each step read the previous one as a requirement rather than as the sketch it was labelled.

**The population does not justify a taxonomy.** Of the 94 one-sided reports: the **53
legacy-only** rows are a build backlog — the answer is *build it*, which needs no verb.
The **41 new-only nl** rows are the `*/onderdelen` tree, already live on the new site, so
there is nothing to build and nothing to decide. The **14 sitemap rows** are unverified,
and the cautions above say several are near-name variants or a sibling store's page. What
remains needing a judgement rather than a build: `showroom-contact` and
`vrijstaande-terrasoverkapping` (absent in all six stores), the München typo pair, and
three broken redirect chains. A fifth override kind, a schema migration and a new surface
would serve about six rows.

**A checklist here can never reach zero.** The one-sided population is not a census: a page
created on the new site since 2024 appears in no source at all. Any "0 remaining" reading
would be false, which makes this a poor shape for a manager's checklist regardless of the
vocabulary.

**Nothing regresses by parking this.** One-sided pages stay visible in the three places
they already are — the `eenzijdig` chip (`web/src/components/Dashboard.jsx:96`), the store
header sentence (`web/src/pages/[store]/index.astro:52`) and the read-only aside listing
each page with its `skipReason` (`Dashboard.jsx:187`). What is given up is *recording*: a
decision not to rebuild a page is not kept, so the row returns on every crawl.

### Re-open trigger

Any one of these:

- **The same row is questioned twice.** Somebody asks "why is `showroom-contact` still on
  this list" a second time — that is the missing record making itself felt, stated by a
  person rather than inferred from a draft.
- A **build** decision is actually taken not to build a page, and somebody needs it to
  survive the next crawl.
- The legacy-only count stops falling. If the 53 are a build backlog, they should shrink as
  pages ship. A flat count over several crawls means they are not being built, and *why*
  becomes a real question.

Not a trigger: the number growing because a new crawl finds more one-sided pages. That is
measurement working.

### Evidence to keep

Two numbers in this ticket read tighter than they are, both established 2026-08-11 and
never corrected in the body above:

- The strict "production 200 **and** new site 404" cross-tab is **50, not 53**. Three nl
  pairs are 301/302→404 — broken redirect chains, not un-migrated pages.
- The **41 vs 39** discrepancy is `redirect: 'manual'` in `crawl/11-page-status.mjs:40`
  against `redirect: 'follow'` in `crawl/fetch-page.mjs:56`, plus `veranda-configurator`
  sitting on the exclusion list. **41 is the defensible count.**

Also measured: only **15 of 1,640** urls carry a redirect target, 10 of them
production-side. Automatic redirect retirement was worth about ten rows, never a
meaningful slice of 50.

### The prototype

Three throwaway variants were built on 2026-08-11 and are what the user reviewed:
`web/src/lib/prototype-one-sided.mjs`, `web/src/pages/prototype/one-sided.astro` and
`web/src/components/prototype/`. They are untracked and stay in the working tree for now;
disposal was deferred. They are not a specification of anything — they are the artefact
that got this ticket parked.
