# 06 — A fix claim travels over a link

Type: task
Status: wontfix — **parked 2026-08-19** by the audit of every open `ready-for-agent` ticket.
Not refused on its merits and not disproven: parked because its payload is unmeasured. The
PRD is candid that a dismissal already crosses the language block, so the repetition an editor
still meets here is not in judging — it is in claiming a fix they only made once, and nobody
has counted how often that happens. It also cannot be built before 10, which is parked with it.
**Re-open trigger: reported against, 2026-08-21.** Ticket
[11](../11-measure-the-flattening-and-the-pairing.md) resolved and found the count
**unmeasurable and 0 of the 10 that survive** — 94% of standing fix claims key on a finding id
absent from the corpus, 7 of 10 survivors had the opportunity to be claimed twice, and 0 of 7
were. `be` carries 8 standing fix claims to `nl`'s 185: nobody is working the second store, so
nobody is paying the cost this ticket removes. **Ticket 10 is now refused outright**, so this
one has no link to travel over either.
**The new trigger, from ticket 11:** a fortnight of somebody actually working `be` or `fr`,
**and** finding ids that survive long enough for a claim to be compared with its sibling's.
Re-run probe 3 when both are true.
Blocked by: 10 — nothing may travel until an editor can declare a link. 07 — the reading that says whether a link was right must exist before its claims go out.
Parent: ../../PRD.md

## What to build

One edit becomes one claim.

`CONTEXT.md` says that only a judgement crosses a language block, because *correcting one store's
page does not correct the other's*. Where an editor has said the two store pages are one page,
that is false: one edit corrects both. The claim was right and its stated reason was not — which
is the same correction ADR 0018 already applied to the repeat rule one level up.

This is the **only** thing a link buys. A dismissal already crosses the block on the strength of
the repeat alone and is unchanged by this ticket. What an editor still repeats today is claiming
a fix they only made once, and after this they do not.

After this ticket an editor who corrected one record once claims it once, and both stores show it.

## Criteria

- [ ] A fix claim may be written for **both** stores of a block when **both** conditions hold: the
      two store pages are **linked**, and the finding is a **repeat over that block**.
- [ ] A linked page whose finding is **not** a repeat offers no travelling claim — that finding is
      store-scoped, and the difference is the tell.
- [ ] A repeat on a pair that is **not** linked offers no travelling claim.
- [ ] The press **states which stores it will write to before it writes**, off its own events.
- [ ] The write is **two ordinary events**, one per store, each carrying its own observation, so
      each is contradicted by its own store's next crawl.
- [ ] A store whose finding a colleague **already decided** is skipped and counted, and the press
      says so — exactly as a wide dismissal does today.
- [ ] A contradicted travelling claim names the editor who pressed, as any claim does.
- [ ] **No denominator moves.** Each store's bar keeps counting its own findings against its own
      reports. A travelling claim closes one finding in each store, never one finding twice.
- [ ] The **dismissal is unchanged**. A link grants it no permission it does not already have
      under ADR 0018, and removes none.
- [ ] **Unlinking retracts nothing.** Events already written stand.
- [ ] The `CONTEXT.md` amendment to *Bulk decision* — the claim kept, its reason corrected and
      dated, in the manner of the *Repeat* amendment.
- [ ] `npm test`.

## Traps

- **Both conditions, always.** The repeat condition is what handles a custom variable: if the two
  stores render the same two strings the words come from one place, and if they do not, no repeat
  exists. Dropping it lets a claim land in a store where a variable, not the shared record, holds
  the text — and it is now also the only check on a link that was simply wrong.
- **A variable holding equal values today is the residual risk, and it is accepted.** So is a
  mistaken link. A fix claim loses to re-check, so each store's next crawl contradicts it and
  names the presser. That is precisely why this is safe for a claim of fact and would **not** be
  safe for a judgement. Do not extend the same reasoning to a dismissal.
- **Reuse the existing press seam.** A travelling claim is a two-entry press over the flat entry
  list ticket 138 introduced, in the module that already decides which events a press writes and
  what it reports. If a new write path appears, the seam is being duplicated. That module's
  docblock currently says a fix claim has no bulk press *because correcting one store's page does
  not correct the other's* — amend the sentence where it lives.
- **No provenance column.** The claim is the presser's, in their own name. There is no
  *inherited*, no *copied from `nl`* field, and no schema change to a table whose append-only
  shape is the reason it can be trusted.
- **Do not travel a page review.** It is keyed on store and page and covers what a human read. One
  person did not read two stores.
- **Do not travel outside a block.** A link reaches inside a block only, so a partner outside one
  does not exist.
- **Do not let a link retract or reopen anything.** Keeping a ledger of what a link authorised
  would be a new relationship between two tables, and it would retract claims that were correct —
  an editor may well have fixed both stores by hand.

## Where it came from

A grilling session, 2026-08-19. This corrects a claim made twice in that session: first that a fix
claim can never cross a store, which is false where one edit corrects both; then that a shared
record implies shared content, which is false where a custom variable is in play. The two
conditions are what is left standing after both corrections.

The second session, the same day, established that this is the feature's whole payload. A sweep
of the code found that repeats already key on the language block for all four checks and that a
wide dismissal already writes one event per store and names them — so dismissing across `nl` and
`be` needs no link and never did. The refusal that remained was the fix claim's, and the reason
given for it is the sentence this ticket amends.
