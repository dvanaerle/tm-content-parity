# 11 — Measure the flattening, and the pairing

Type: research
Status: resolved 2026-08-21 — measured; see `## Answer` below and `../FLATTENING.md`. One
criterion is answered as unmeasurable and stated as such: 94% of the fix claims key on a
finding id that no longer exists.
Blocked by: None — can start immediately.
Parent: ../PRD.md

## What to build

Three numbers over the extracts already on disk. No new table, no screen, no editor input, no
crawl, no production code. This is a probe on the same terms as ticket 01.

Tickets 06, 07 and 10 are parked on this. Together they are the largest build in the feature —
a new append-only Supabase table, new RLS policies, a linking screen with a bulk press, a
control on the store page, and a transcription pass through the page pairs of two language
blocks with Magento's admin open beside it. Every one of those costs rests on an assumption
nobody has measured. This ticket measures them, and it is cheap enough that building it before
deciding is obviously right.

### 1. The flattening

Over `{nl, be}` and `{be_fr, fr}`: how many content units **diverge on production's two
stores** and **agree on the new site's**? Per page, ranked, with the text.

These are candidate flattened store differences — a legal text or a regional promise that
production varied per country and the migration made uniform, so one store now shows the
other's words. That is the defect ticket 07 exists to find, and it is a real, customer-facing,
hard-to-find migration defect of exactly the kind this tool is for.

**It is computable today with no link table at all.** Linkedness is what licenses the *why it
differs* label; it is not needed to spot the flattening. If this count is near zero, ticket
07's best half has nothing to show and the link feature loses its strongest justification. If
it is meaningful, 07's flattening half may be worth building on its own, without 10.

### 2. The pairing

The agreement share per page pair, both ways round: how many pairs render identical words?

This is the measured basis for ticket 10's claim that *"the common case is that they are one
page"*, which today is an assumption. It decides whether the transcription pass behind the bulk
press is ten presses or two hundred and fifty.

Report the distribution, not only the mean — a bimodal result (most pairs at 100% or near 0%)
and a flat result mean different things for the bulk press.

### 3. The double claim

How many fix claims in the override log were written on a page whose sibling carries the same
finding?

That is ticket 06's payload in the only unit that counts: how often an editor actually claimed
the same fix twice. The PRD is already candid that a *dismissal* crosses the block, so the
repetition an editor still meets is not in judging — it is in claiming a fix they only made
once. This number says whether that is a real cost or a theoretical one.

## Criteria

- [x] The flattening count over both language blocks, per page, ranked, with the diverging
      production text and the agreeing new-site text quoted.
- [x] The agreement share per page pair over both blocks, as a distribution and not only a mean.
- [~] The count of fix claims written on a page whose sibling carries the same finding, from the
      override log.
      **Answered on 10 claims of 232.** 219 of the 232 standing fix claims key on a finding
      id absent from the whole corpus, so the population cannot be counted. Of the 10 that
      survive, 7 sit on a page whose sibling carries the same finding, and the sibling was
      claimed fixed **0** times.
- [x] The numbers written into this ticket under an `## Answer` heading, with the date, the
      commit and the corpus size, so a later reader knows what was true when.
- [x] A reading that answers the parked tickets directly: build 10, 07 and 06 as written; or
      reduce 07 to the flattening reading with no link and no `store-scoped content` label; or
      leave all three refused.

## Traps

- **This is a probe, not a feature.** Throwaway scripts beside the answer, as ticket 01 did. Do
  not add a screen, a class, a column or a table.
- **Identical words are not evidence of one record.** Ticket 10 says so and it is right: two
  stores rendering the same words are what two *separate* records look like the day before they
  diverge. Measurement 2 sizes the transcription pass. It must never be reported as a list of
  pairs that *are* linked, and this ticket offers no press that links from it.
- **A block difference is not a defect.** ADR 0017 holds. A legal-text divergence between `nl`
  and `be` is **correct**, and nothing in the answer may read as work. The flattening is the
  finding; the divergence is the baseline.
- **Do not pair across language blocks.** `{nl, be}` and `{be_fr, fr}` only.
- **A store-scoped variable appears in no HTML.** Its value is server-side, so a unit that
  differs may differ for a reason the tool can never name. Report the divergence, never the
  cause.
- **Read the code for the field shapes, not this ticket.** Ticket 01's answer had to correct
  the ticket's own field names against `compare/run-log.mjs`. Do the same here.

## Where it came from

The audit of every open `ready-for-agent` ticket, 2026-08-19
(`.scratch/2026-08-19-ready-for-agent-audit.md`), and the grilling session over it. The audit's
reading of 06, 07 and 10: the designs are genuinely good and the chain's payload is that an
editor clicks *fixed* once instead of twice on paired pages, plus 07's reading — for which we
would take on a new table, new RLS policies, a new screen, a bulk press, an ADR pair and an
unpriced transcription pass. Ticket 10 also widens who can grant a permission, since anyone who
can open the site can write to that table and that table is what authorises a claim to travel.

Ticket 01 cleared this feature's premise — churn does not outrank decision repetition — so the
question is no longer *is repetition the right problem*. It is *is the link table the right
answer to it*, and these three numbers are what settle that.

## Answer

**Measured 2026-08-21 at commit `cf50c63`.** Full working, with every source and code path
cited, in [`../FLATTENING.md`](../FLATTENING.md). Independently verified at commit `ff263b8`
in [`../VERIFY-11.md`](../VERIFY-11.md): every load-bearing number reproduces from a recount;
the five presentation-level corrections it found are applied here and in `FLATTENING.md`. Scripts:
`.scratch/cross-store-reuse/flatten-probe-1.mjs`, `-2.mjs`, `-3.mjs`; the 111 units with
their text in `flattening.json`.

**Corpus size.** 816 reports in `data/reports`, **35,604 findings**, all on observation
`2026-08-19T15:15:18.599Z-135ccd35`, built 2026-08-20. `history/run-log.jsonl`: 41,316
rows. 550 seed rows. Override log `data/overrides-backup-2026-08-18T09-46-51-393Z.json`:
1,618 events, 1,294 standing after `latestByKey()`. **This is not ticket 01's corpus** —
that answer counted 40,824 findings and 132 detached dismissals two days ago; the same log
now detaches 152.

**Two field corrections, as ticket 01 had to make.** An override row on disk is
snake_case (`finding_id`, `observation_id`) while `overrides/state.mjs` reads camelCase, so
a probe must decode before `latestByKey()`. And nothing needed to be written for
measurement 2: it **is** `blockReading()` in `web/src/lib/blocks.mjs`, whose `share` and
`mutual` are this measurement already.

### 1. The flattening — 111 units on 42 page pairs

Three alignments, all `diffRows()`: production `nl` against production `be` (which is
`siblingReading()`'s own comparison), then production against the new site inside each
store (which is `comparePage()`'s).

| | |
|---|---|
| page pairs measured | **230** |
| cross-store unit pairs | 9,675 |
| diverging on production | **311** |
| …with a counterpart on both new sites | 214 |
| …**agreeing on the new site — the flattening** | **111**, on **42 page pairs** (40 distinct page keys) |

Divergence class by `classifyPair()`: copy 94, casing 15, price 1, campaign 1 — so 109 of
111 are in **work** classes. Whose words the new site kept: `nl` 46, `fr` 24, `be_fr` 13,
`be` 7, neither 21.

Ranked head: `schuifpui` 16 · `terrasoverkapping/productinformatie` 13 ·
`portes-coulissantes/information-produit` 8 · `verandas/information-produit` 6 ·
`garantie` 5 · `avantages`, `verandas/paroi-laterale`, `lighting-system`, `voordelen` 4 ·
`(home)` 3, then a tail of 2 and 1 including `levergebied`, `betaalmethoden`, `afhalen`,
`zone-de-livraison` and `modes-de-paiement`.

Three of them, quoted:

- **`garantie`, `nl`/`be`.** `nl` production: "…**Voor alle artikelen die je bij ons koopt,
  geldt de wettelijke garantie.**" `be` production: "…**Deze garantie geldt voor producten
  die u als consument rechtstreeks bij Tuinmaximaal heeft gekocht.**" Both new sites: `be`'s
  sentence. The Dutch store now states Belgium's warranty scope.
- **`levergebied`, `nl`/`be`.** Production orders the countries by the store's own country
  — `nl` "…in **Nederland** (m.u.v. de Waddeneilanden), België, …", `be` "…in **België**,
  Nederland, …". Both new sites: `nl`'s ordering.
- **`zone-de-livraison`, `be_fr`/`fr`.** `be_fr` production carries a sentence restricting
  how an order may be collected that `fr` does not; the new site shows `fr`'s shorter text
  on both.

**The finding that matters most here is that 109 of the 111 are already an ordinary axis-A
finding today** — 58 on `be`, 34 on `be_fr`, 28 on `fr`, 17 on `nl`. Nothing is hidden from
an editor. What ticket 07 would add is a **reason** beside a difference the log already
reports, and a ranking that puts these 42 page pairs first.

### 2. The pairing — 246 pairs, 113 identical

| | `nl`→`be` | `be`→`nl` | `be_fr`→`fr` | `fr`→`be_fr` |
|---|---|---|---|---|
| pages with a sibling | 126 | 126 | 120 | 120 |
| measured | 125 | 125 | 120 | 120 |
| **identical (mutual)** | **66** | **66** | **47** | **47** |
| mean · median share | 0.923 · 1.000 | 0.922 · 1.000 | 0.936 · 0.970 | 0.938 · 0.972 |
| 1.00 not mutual | 0 | 1 | 1 | 0 |
| 0.90–0.99 | 33 | 35 | 43 | 42 |
| 0.75–0.89 | 16 | 12 | 25 | 27 |
| 0.50–0.74 | 6 | 7 | 4 | 4 |
| 0.25–0.49 | 1 | 1 | 0 | 0 |
| 0.01–0.24 | 3 | 3 | 0 | 0 |
| 0.00 | 0 | 0 | 0 | 0 |

**246 page pairs, 245 measured, 113 of them identical word for word (46% of the
measured).** The distribution is **not bimodal**: nothing at all sits at 0.00, and the 0.75–0.99 band holds 49 of the 125 Dutch
rows and 68 of the 120 French — in the French block that band is larger than the identical
one. So ticket 10's *"the common case is that they are one page"* is **half true and
half false**: the pairing is dense, but the pairs mostly nearly agree rather than agree,
and the transcription pass behind the bulk press is **two hundred and forty-six, not ten**.
Both directions of a block agree to within one row.

**And identical words are not evidence of one record.** The 113 sizes a transcription pass;
it is not a list of pairs that are linked, and nothing here offers a press that links from
it.

### 3. The double claim — unmeasurable, and 0 of the 10 that survive

| | count |
|---|---|
| standing fix claims | **232** (`nl` 185, `uk` 38, `be` 8, `de` 1) |
| …in a store with a block | 193 |
| …whose finding id is still in the corpus | **10** |
| …whose sibling carries the same finding (`repeatsInStore()`'s key) | **7** |
| …where the sibling was **also claimed fixed** | **0** |
| …where the sibling was decided at all | 1 (a dismissal) |

**219 of 232 standing fix claims — 94% — key on a finding id absent from the whole corpus**,
against 152 of 829 dismissals (18%). The population cannot be counted, so the honest
number is the 10 that survive: **7 of 10 had the opportunity to be claimed twice and 0 of 7
were.** Four of the seven are `broken-link`, whose input is an HTTP status and not page
text, so one fix at the target closes both stores with no second press at all. The plainer
fact is beside them: `be` carries **8** standing fix claims against `nl`'s 185. Nobody is
working the second store yet, so nobody is paying the cost ticket 06 removes.

### The reading

**Reduce 07 to its flattening half, refuse 10, and refuse 06 for now.**

**07, the flattening half, is worth building and needs no link table.** It is computable
today from `data/extract/` with three calls to `diffRows()` and no new column: 111 units on
42 page pairs, 109 of them in work classes, and among them a warranty scope and a delivery-area
promise that production varied per country and the new site made uniform. That is the
customer-facing, hard-to-find migration defect this tool exists for, and a reader would
never find it by opening one store at a time. Build it as a **reason on a finding the log
already reports** — 109 of the 111 are open axis-A findings now — and as an ordering that
lifts these 42 page pairs. Do **not** ship the `store-scoped content` label: a store-scoped
variable renders no HTML, so the cause is unnameable and 21 of the 111 are a new-site
rewrite rather than one store's words winning. The label the evidence supports is
*production varied here and the new site does not*, which is a divergence and not a cause.
ADR 0017 holds throughout: the production divergence itself is the baseline and is never
work.

**Refuse 10.** Its premise is measured and it does not hold. The derived pairing already
covers 126 of `be`'s 131 pages and 120 of `fr`'s 123 without a table, an RLS policy or a
screen; the linking screen's pass is 246 pairs rather than ten; and only 46% of the
measured pairs render identical words, so a bulk press taken off identity would be transcribing a
judgement it cannot verify — two separate records holding one string are exactly what a
pair looks like the day before it diverges. Add to that what the ticket itself concedes:
that table widens who may grant a permission. The one thing 10 was needed for — knowing
which pairs are one Magento record — is already answered by the **imported** shared-page
fact (ADR 0025), and the flattening reading above needs no link at all.

**Refuse 06, and say what would reopen it.** Its payload is an editor clicking *fixed* once
instead of twice, and that click has never been made twice in the recorded history of this
log: 0 of the 7 measurable opportunities, on a second store carrying 8 claims to `nl`'s
185. It is a real cost in theory and a theoretical one in the data. Two things would change
that: a fortnight of somebody actually working `be` or `fr`, and finding ids that survive
long enough for a claim to be compared with its sibling's — with 94% of claims detached,
06's own bookkeeping would be built on keys that expire faster than the work does. Re-run
probe 3 when both are true.
