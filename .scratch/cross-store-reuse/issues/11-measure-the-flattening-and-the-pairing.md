# 11 — Measure the flattening, and the pairing

Type: research
Status: ready-for-agent
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

- [ ] The flattening count over both language blocks, per page, ranked, with the diverging
      production text and the agreeing new-site text quoted.
- [ ] The agreement share per page pair over both blocks, as a distribution and not only a mean.
- [ ] The count of fix claims written on a page whose sibling carries the same finding, from the
      override log.
- [ ] The numbers written into this ticket under an `## Answer` heading, with the date, the
      commit and the corpus size, so a later reader knows what was true when.
- [ ] A reading that answers the parked tickets directly: build 10, 07 and 06 as written; or
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
