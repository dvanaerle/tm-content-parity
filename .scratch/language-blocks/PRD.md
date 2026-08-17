# Language blocks — two stores that share a language, compared

Status: ready-for-agent
Written: 2026-08-17, from a grilling session. Vocabulary is in `CONTEXT.md` → **Language blocks**.

## Problem Statement

There are six stores, and two of them are usually the same content. `nl` and `be` are both
Dutch and are usually equal to each other; `be_fr` and `fr` are both French and the same. An
editor believes the only intended difference is legal text that has to vary by country, and
has no way to check that belief: the log shows one store at a time, against production, and
never one store against another.

So two things are invisible today:

1. **Where the two stores of a language actually diverge.** Nobody can see that
   `algemene-fotogalerij` has a completely different set of captions in `be`, or that `be` has
   a `pergola` page `nl` has not, or that `fr` has `galerie/eclairaige` where `be_fr` has
   `galerie/eclairage`.
2. **How much of the work is the same work twice.** An editor working `be` is asked about
   thousands of differences that are word-for-word the differences they already decided in
   `nl`. Measured: **80.3%** of `be`'s work findings on shared pages have a repeat key that also
   occurs in `nl` on the same page, and **74.7%** for `fr` against `be_fr` — about **5,256 work
   findings, 24% of the 22,048 pile**, asked twice.

Axis A answers "does this store match production". Axis B was specified to answer "does NL's
content exist in the other stores" and compares presence only, because translated text is
different text on purpose — and it is unbuilt and parked. Neither answers "do these two stores,
which speak the same language, say the same thing", and that question is answerable with words
precisely because the language is shared.

## Solution

Two stores that share a language become a **language block**, and the log gains one reading and
one shortcut:

- **A block list on the store dashboard.** Under `/<store>/`, the store's pages that have a
  **sibling page**, ranked worst-first by how much they diverge, plus the pages whose sibling is
  absent. It compares **production** — the reference side — and says so. The editor gets the
  overview they asked for: the four sub-50% pages in the NL block are the answer to "where do the
  differences lie".
- **A sibling tab on the store page.** `/<store>/<page>` gains a fifth tab showing this page
  against its sibling in document order, so the overview has somewhere to land.
- **A bulk decision may cross a block.** Where two findings carry the same text in both stores of
  a block, one press writes the events for both. The 24% stops being asked twice.

A **block difference** is a **display-only difference**: no id, no override, no place in a bar. It
moves no count, no denominator and no percentage, and it is never called a finding. A block is
**not an axis** and there is no axis C. What crosses a block in the third part is a decision about
an ordinary **axis-A finding** that happens to be identical in two stores — not a decision about a
block difference.

## User Stories

1. As an editor of `be`, I want to see which of my pages differ from their `nl` sibling, so that I
   can tell whether the two stores have drifted apart.
2. As an editor of `nl`, I want that same list from `nl`'s side, so that the reading does not
   belong to one store of the block.
3. As an editor, I want the list ranked by how much the two pages diverge, so that a page somebody
   rewrote in one store sorts above a page whose phone number differs.
4. As an editor, I want a page whose sibling is byte-identical to say so plainly, so that agreement
   is an answer and not an empty screen.
5. As an editor, I want a page my sibling store does not have at all to appear in the list, so that
   a missing `klantenservice` is as visible as a changed sentence.
6. As an editor, I want a page I have that my sibling has not to be distinguished from a page we
   both have that differs, so that I know whether the work is building or editing.
7. As an editor, I want to know that this list is not a census, so that I never read "everything
   agrees" out of it.
8. As an editor, I want the list to say which side it compares, so that I do not confuse a
   production divergence with a migration defect.
9. As an editor, I want to open a diverging page and see where on it the two stores differ, so that
   the overview leads somewhere.
10. As an editor, I want the sibling comparison in document order, so that I can see where a
    missing block belongs.
11. As an editor, I want runs of agreeing blocks collapsed into a context marker, so that a page
    that mostly agrees is short.
12. As an editor, I want no decision control on the sibling tab, so that I am never asked to
    triage a difference that carries no work.
13. As an editor, I want the sibling tab absent on a page that has no sibling, so that its absence
    is a fact and not an empty tab.
14. As an editor of `de` or `uk`, I want no block anywhere in my store, so that a feature that
    cannot apply to me does not appear half-working.
15. As an editor, I want `be_fr` and `fr` paired even though most of their pages declare no Dutch
    counterpart, so that the French block is as complete as the Dutch one.
16. As an editor, I want the `fr/` path prefix that `be_fr` carries to be invisible in the pairing,
    so that `fr/carport` and `carport` are recognised as one page.
17. As a maintainer, I want to know which rule matched a sibling — the declared alternate or the
    path — so that a wrong pairing can be diagnosed without re-deriving it.
18. As a maintainer, I want the blocks derived from the stores' hreflang languages rather than
    hand-listed, so that "may `de` and `uk` be a block" has an answer without a debate.
19. As an editor, I want the legal pages in the list rather than excluded from it, so that a real
    change to my terms page is not hidden by a rule about phone numbers.
20. As an editor working `be`, I want to dismiss a difference once and have it cover `nl` as well
    when the text is identical, so that I am not asked the same question twice.
21. As an editor, I want to be told before I press how many events will be written and in which
    stores, so that I never discover afterwards that I decided for a store I do not own.
22. As an editor, I want a bulk decision to skip the findings whose sibling text differs, so that
    the shortcut never covers something I did not look at.
23. As an editor, I want a bulk decision to skip a finding a colleague already decided, so that the
    existing eligibility rule still holds when the selection spans two stores.
24. As an editor, I want a bulk clearing to revoke dismissals and nothing else, so that the two
    presses keep their different eligibilities on one selection.
25. As an editor, I want a partial failure reported as *N of M saved*, so that an append-only table
    tells me how far it got.
26. As an editor, I want my "I corrected this" claim **not** to travel to the sibling store, so
    that a claim of fact is never made on my behalf about a page I did not touch.
27. As an editor, I want a dismissal to expire in each store independently when that store's text
    changes, so that two stores agreeing today is not a claim that they will agree tomorrow.
28. As an editor, I want the roughly one fifth of my findings with no sibling counterpart to stay
    visible as my own work, so that the shortcut never implies my store is done.
29. As a reviewer, I want no progress bar, count or percentage to move because of the block list or
    the sibling tab, so that the numbers still mean what they meant.
30. As a future reader, I want an ADR explaining why a block is a view and not an axis, so that
    nobody has to argue later about why the third axis has no progress bar.
31. As a future reader, I want the amended sentence about repeats never crossing a store struck
    and dated rather than rewritten, so that the change is visible in the house style.
32. As a maintainer, I want the seed list and the page keys untouched, so that no finding id
    expires and no existing link into `be_fr` or `fr` breaks.
33. As a maintainer, I want no new class in the class vocabulary, so that it stays closed.
34. As an editor, I want the untranslated new-site theme labels the block view exposes to be
    recognised as evidence for the `untranslated` check, so that a real defect is not lost in a
    display-only view.

## Implementation Decisions

**The block vocabulary is pure, derived, and lives in `shared/`.** A new pure module holds the
blocks, the block of a store and the sibling of a store, derived from the store→hreflang map so
that no list of blocks is written by hand. `nl-NL`/`nl-BE` give `{nl, be}` and `fr-BE`/`fr-FR` give
`{be_fr, fr}`; `de-DE` and `en-GB` are alone in their languages, so `de` and `uk` are in no block.

**`HREFLANG_STORE` moves out of `crawl/` and into `shared/`, beside `STORES`.** It is today the only
place any language fact is recorded, and the web layer must not import from `crawl/`. The crawl
imports it from its new home. This makes the block vocabulary a constant in git with a test, rather
than a build artefact. The duplicate flat list of the same codes in the sitemap extractor collapses
into the same import.

**Sibling matching has two rules and records which one matched.** First the **hreflang alternate
production declares** between the two pages — production's own claim that they are the same page.
Second, only where neither declares one, **path equality**, with `be_fr`'s leading `fr/` stripped
for the comparison alone. Both are needed: the Dutch block already aligns on the seed row (126 rows
carry both cells and all 126 have equal paths) while the French block does not (28 of 122), and the
path rule recovers 120 of 122. Which rule matched is carried on the sibling in the manner of a
cell's `provenance`, not as a comment.

**The join lives in the derivation, never in the seed list.** `pageKey()` and
`data/10-store-seeds.json` are untouched. Merging `be_fr` and `fr` upstream is the tidier model and
it expires every finding id on those two stores and breaks every link into them, to make a
display-only view cheaper.

**One new derivation module under `web/src/lib/` returns the block reading as values.** It takes the
seed rows and the two stores' reports and returns: the matched siblings with the matching rule, the
identity share per page, the sibling-absent rows, and the ordered unit rows the tab draws. The
components render and decide nothing — the precedent is `explainScope()`, which `CONTEXT.md` cites as
"decided as a value … and only rendered by the component".

**Identity is measured over the production side's content units, on normalised text**, as the share
of one store's unit texts that appear exactly in the sibling's. It is a ranking key and not a score
on a finding.

**Both surfaces live under `/<store>/`.** There is no `/block/nl-be/` route: one screen per block
instead of two mirrored ones is cheaper and it is a third kind of dashboard belonging to no store,
which is what the repo settled against — a store is the unit an editor is responsible for. Every
block page therefore appears on two dashboards as two readings of one fact, and there is nothing to
keep in sync **because a block difference carries no decision**.

**The sibling tab is not a fifth check.** `Check` stays the closed family `text | links | images |
meta`. The reserved "fifth tab" comment in the page's tab list refers to axis B and needs correcting
rather than reusing. Rows carry no override control, no finding id and no class pill, and are not
tinted by direction — `lost` and `added` are fields on a class, and a block difference has no class.
Landing cannot reach this tab, because there is no finding id to land on.

**Nothing is excluded.** No list of legal or ephemeral pages exists. Legal pages carry 4.5% of the
Dutch block's difference volume and 8.6% of the French block's, so an exclusion buys almost nothing
— and it would exclude at page granularity what varies at unit granularity, the mistake ADR 0003
avoided by excluding *regions* rather than pages. If the list ever becomes unreadable, the upgrade is
detecting the ephemera — phone numbers, VAT/CCI numbers, host names, currency amounts — at unit
level.

**The cross-block bulk decision changes the repeat key and nothing else about storage.** The existing
repeat grouping drops its bare store term for a block term, so every consumer — the class grouping
and both bulk writers — inherits it with no second definition of "repeat" in the codebase. Nothing
new is stored: a bulk decision already writes N ordinary events, one per page, and this widens the
**selection** from one store to two. Both finding ids are computable because they differ only in the
`store` term of the hash and the text either side is the same string. No new scope, no new column, no
change to the finding id function.

**A repeat may cross a block and only a block.** The glossary sentence *"A repeat never crosses a
store, because the stores translate the text"* is amended in the house style — struck, dated, with
the ticket number — because its stated reason does not hold inside a block. It never crosses `de`,
never `uk`, and never all six.

**Only the judgement travels.** A **dismissal** may cross a block, because it is a judgement about
two exact strings and those strings are the same in both stores. A **fix claim** may not: it is a
claim of fact, and correcting one store's page does not correct the other's. A dismissal still
expires per store when that store's text changes.

**Eligibility is read per finding, off the text.** Two findings join only when class, both texts and
detail are equal. The two presses keep their different eligibilities on one selection: a bulk
dismissal expires with the text and skips a finding a colleague decided; a bulk clearing revokes a
dismissal and touches nothing else.

**Two ADRs.** One records the model — a block is a view and not an axis, and why the word "axis" is
refused, since an axis here means a tab, a task and in the end a count. One records the cross-block
bulk decision: what it buys, what it costs, and the boundary that keeps it safe, which is that a
block is derived from a shared language and never from a hand-written list.

**Sequencing and gates.** The block vocabulary, the sibling match and the dashboard list are one
piece of work: a block with no surface is a glossary entry for a panel that does not exist. The
sibling tab is a second surface and separate. The cross-block bulk decision is separate and alone,
because a dismissal moves the numerator and the repo's rule is never to batch across a measurement
gate — the numerator movement is measured before and after and written down.

## Testing Decisions

A good test here states external behaviour and never the shape of the derivation: given seed rows
and reports, what does the block reading *say*. The repo's own precedent is a pure `.mjs` module with
a `.test.mjs` beside it and the component left untested for logic — `search.test.mjs`,
`view.test.mjs`, `not-checked.test.mjs`, `buckets.test.mjs`, `seed-rows.test.mjs`.

- **The block vocabulary module** is tested as a vocabulary: the two blocks exist, `de` and `uk` are
  in no block, every store resolves to at most one block, and the blocks are derived from the
  hreflang map rather than compared against a copy of themselves. One test states *why* `de` and `uk`
  have none — each is alone in its language — so the answer survives the next person who asks.
- **The sibling match** is tested on both rules and on their order: a page whose alternate declares
  its sibling matches by alternate; a `be_fr`/`fr` page that declares none matches by path with the
  prefix stripped; a page that would match by path but declares a *different* alternate follows the
  alternate. The matching rule is asserted on the result, since it is data.
- **The derivation module** is tested on the answers a reader gets: a byte-identical page reports
  full identity, a page with a rewritten section reports a low share and ranks above it, a page whose
  sibling is absent is its own kind of row, and the side compared is stated. Prior art:
  `search.test.mjs`'s treatment of `explainScope()`'s five kinds of nothing — a value per case,
  asserted as a value.
- **The repeat key change** is tested at the existing seam, in `view.test.mjs`: two findings with
  equal text in `nl` and `be` group into one repeat; the same two in `nl` and `de` do not; a repeat
  never spans two stores that share no block. The existing store-scoped assertions are the regression
  net and must keep passing where no block is involved.
- **The bulk press** is tested in `bulk.test.mjs` and `overrides/bulk.test.mjs`: a selection spanning
  a block writes one event per store page; a finding whose sibling text differs is not written; a
  finding a colleague decided is skipped by the dismissal and not by the clearing; a fix claim never
  crosses; a partial failure reports *N of M saved*.
- **No count moves** is itself a test obligation for the first two pieces: the existing progress,
  denominator and roll-up assertions pass unchanged, and the screenshot baselines move only where a
  new surface is drawn.
- The stopword guard and the full suite gate every part.

## Out of Scope

- **Axis B.** It stays parked and unbuilt. This is not axis B, does not revive it, and must not
  borrow its `missing-page`/`orphan-page` classes for the sibling-absent row.
- **Axis C.** Block differences are not promoted to findings: no class, no bucket, no id, no
  override, no bar. If that promotion ever happens it is its own ADR, and this work is the reason it
  can stay refused rather than a step toward it.
- **A block route or an all-stores surface.** No `/block/nl-be/`, no all-stores dashboard, no
  all-stores repeat view.
- **Grouping the other four stores.** `de` and `uk` get no block. The sixteen alternate shapes the
  seed list mentions, including `{de, nl, uk}`, are cross-language and their words are not
  comparable.
- **Comparing the new-site side, and the block as a migration-defect detector.** The first version
  compares production only. The case where production agrees and the new site does not is real — 24
  pages in the Dutch block, 4 in the French — and it is a later question.
- **Excluding ephemera.** No list of expected divergences, and no phone/VAT/host/currency detector in
  this version.
- **The `untranslated` check.** The finding below belongs in that check's own ticket; nothing about it
  is built here.
- **Any change to the finding id, the seed list, `pageKey()`, or the class vocabulary.**

## Further Notes

**The measurement, 2026-08-17.** Production `norm` texts of content units, over pages where both
stores answered 200.

| | `nl`/`be` (125 pages) | `be_fr`/`fr` (120 pages) |
|---|---|---|
| units, A / B | 5,722 / 5,631 | 5,221 / 5,210 |
| A units found in B | 5,150 — **90.0%** | 4,952 — **94.8%** |
| pages 100% identical | 66 | 48 |
| 90–99% / 50–89% / <50% | 33 / 22 / 4 | 43 / 29 / 0 |
| A work findings on shared pages | 3,129 | 3,573 |
| B work findings on shared pages | 3,276 | 3,512 |
| B findings whose key occurs in A, same page | 2,631 — **80.3%** | 2,625 — **74.7%** |

**The original premise was wrong in a useful way.** The request predicted the divergence would be
legal text. It is not: legal pages carry 4.5% and 8.6% of the two blocks' difference volume. The
divergence is **real editorial drift** in the tail — `algemene-fotogalerij` at 3.7% identity (6 of 163
units), `fotogalerij/glazen-schuifwand` 6.1%, `fotogalerij/tuinkamer` 7.3%, `schuifpui` 29% with
different customer quotes — and **localisation ephemera** above ~60%: phone numbers, company
addresses, KvK/CCI numbers, `Tuinmaximaal.nl` against `.be` in the disclaimer, and country-specific
payment lists such as `Bancontact` and `Belfius` on `modes-de-paiement`.

**Presence.** `nl` has 55 paths `be` has not, including `blog`, `klantenservice` and
`contactformulier`. `be` has 5 `nl` has not: four `herroeping-*` webforms and `pergola`. The French
block differs on 5 paths, one of which is the typo split `galerie/eclairage` against
`galerie/eclairaige`.

**Three defects this measurement found, which belong to other tickets and not to this one.**

1. **Untranslated new-site theme labels.** On 24 Dutch-block and 4 French-block pages, production's
   text is identical and the new site's differs — almost entirely theme chrome: `Filteren & Sorteren`
   on `nl` against `Filter and Sort` on `be`, `Bekijk alle FAQs` against `View all FAQs`, `Lees
   verder` against `Show more`. This is the `untranslated` check's subject, and it changes that
   check's design: a sibling store is a better detector than a language test, because it does not
   guess the language — it shows the words the other store used for the same string. Note it in that
   ticket; do not fold this work into it.
2. **Per-store service phone numbers on the new site.** On the "not received / change" withdrawal
   page the new site serves a different number per store, and the French block reads `+32 11 127 262`
   against `+33 41 2399 960` — a Belgian number where its sibling suggests otherwise, and a French
   number that does not look real.
3. **`lighting-system`** has 14 units on the `nl` new site that `be`'s has not, the only large
   one-sided new-site block in the set.

**Why the word "pair" is refused.** A **store-page pair** is production against the new site for one
store page. A block is two stores on one side. The grilling that produced this spec made that
collision before catching it.
