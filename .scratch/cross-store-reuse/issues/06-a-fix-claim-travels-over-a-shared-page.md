# 06 — A fix claim travels over a shared page

Type: task
Status: ready-for-agent
Blocked by: 05 — nothing may travel until the shared-page fact exists and its file fails loud.
Parent: ../PRD.md

## What to build

One edit becomes one claim.

`CONTEXT.md` says that only a judgement crosses a language block, because *correcting one store's
page does not correct the other's*. Where the two store pages are one Magento record that is
false: one edit corrects both. The claim was right and its stated reason was not — which is the
same correction ADR 0018 already applied to the repeat rule one level up.

After this ticket an editor who corrected record 543 once claims it once, and both stores show it.

## Criteria

- [ ] A fix claim may be written for **both** stores of a block when **both** conditions hold: the
      store page's new-site record is **shared**, and the finding is a **repeat over that block**.
- [ ] A shared page whose finding is **not** a repeat offers no travelling claim — that finding is
      store-scoped, and the difference is the tell.
- [ ] A repeat on a page that is **not** shared offers no travelling claim.
- [ ] The press **states which stores it will write to before it writes**, off its own events.
- [ ] The write is **two ordinary events**, one per store, each carrying its own observation, so
      each is contradicted by its own store's next crawl.
- [ ] A contradicted travelling claim names the editor who pressed, as any claim does.
- [ ] The **dismissal is unchanged**. Sharing grants it no permission it does not already have
      under ADR 0018, and removes none.
- [ ] The `CONTEXT.md` amendment to *Bulk decision* — the claim kept, its reason corrected and
      dated, in the manner of the *Repeat* amendment.
- [ ] `npm test`.

## Traps

- **Both conditions, always.** The repeat condition is what handles a custom variable: if the two
  stores render the same two strings the words come from the record, and if they do not, no repeat
  exists. Dropping it lets a claim land in a store where a variable, not the record, holds the
  text.
- **A variable holding equal values today is the residual risk, and it is accepted.** A fix claim
  loses to re-check, so each store's next crawl contradicts it. That is precisely why this is safe
  for a claim of fact and would **not** be safe for a judgement. Do not extend the same reasoning
  to a dismissal.
- **Reuse the existing press seam.** A travelling claim is a two-entry press over the flat entry
  list ticket 138 introduced. If a new write path appears, the seam is being duplicated.
- **No provenance column.** The claim is the presser's, in their own name. There is no
  *inherited*, no *copied from `nl`* field, and no schema change to a table whose append-only
  shape is the reason it can be trusted.
- **Do not travel a page review.** It is keyed on store and page and covers what a human read. One
  person did not read two stores.
- **Do not travel outside a block.** Sharing happens only inside the two blocks, so a partner
  outside one does not exist.

## Where it came from

A grilling session, 2026-08-19. This corrects a claim made twice in that session: first that a fix
claim can never cross a store, which is false where the record is shared; then that a shared
record implies shared content, which is false where a custom variable is in play. The two
conditions are what is left standing after both corrections.
