# 07 — A shared page says what is store-scoped, and which pages are ready to merge

Type: task
Status: ready-for-agent
Blocked by: 05 — both readings are inferences from the shared-page fact.
Parent: ../PRD.md

## What to build

Two readings, both derived, neither decidable.

**Store-scoped content.** On a shared page a divergence between the block's two stores can only
come from a store-scoped mechanism — a custom variable, a store-scoped block, or a translation.
The record is one, so nothing else can produce it. Today the sibling tab can show that two stores
differ and can never say why; after this it can, and only on a shared page.

That matters most in the other direction. The sibling tab compares **production** on both sides.
If production's two stores diverge on a shared page and the **new site's** do not, the migration
flattened a store difference and one store now shows the other's words — the legal text, the
regional promise. Drawing the new site's two stores beside production's is what makes that
visible.

**Merge candidates.** The store pages in the not-shared file whose two stores already render the
same words are the ones safe to consolidate into one record. The agreement share already measures
that, asked both ways round, so the list is derived and never kept by hand.

## Criteria

- [ ] The sibling tab gains a **second reading**: production's two stores as today, and the new
      site's two stores beside it. It is a second reading and not a fourth comparison.
- [ ] A divergence on a **shared** page is named **`store-scoped content`**.
- [ ] The row where **production diverges and the new site does not** is the one that stands out,
      because that is a store difference the migration lost.
- [ ] Where that produces a defect it is already an ordinary axis-A finding on the affected store,
      and the decision stays there. This tab offers none.
- [ ] Both readings carry **no id, no override, no class pill and no place in any bar**.
- [ ] The tool never names the variable. Its value is server-side and appears in no HTML.
- [ ] The block list gains the **merge-candidate** reading: pages in the not-shared file whose two
      stores agree word for word.
- [ ] The merge-candidate list carries its caution — two records rendering the same words today can
      be merged only if they never need to diverge later.
- [ ] Both readings are decided **as values** by the existing reading functions and rendered dumbly.
- [ ] The `CONTEXT.md` entry for **store-scoped content**.
- [ ] `npm test`.

## Traps

- **Nothing here becomes a finding.** ADR 0017 holds: a block difference is display-only, and
  promoting one is its own ADR and the day *axis C* becomes available. A legal-text divergence
  between `nl` and `be` is correct, not defective, and must never read as work.
- **The inference needs the shared fact.** On a page that is *not* shared, the same divergence says
  nothing — two records may simply hold different words. Do not draw the marker there.
- **Do not name or guess the variable.** *A variable lives here* is the whole claim. `zonweringUSP`
  is knowledge the tool does not have and must not appear to have.
- **The merge list is a reading, not a backlog.** The tool does not track whether a merge happened;
  removing the entry from the file is what says so.
- **Do not tint a row by direction.** `lost` and `added` are the tones of a class. Neither store
  lost anything — they differ.
- **The tab stays absent, not empty, on a page with no sibling**, as it is today.

## Where it came from

A grilling session, 2026-08-19. The custom-variable objection looked at first like it killed the
shared-page feature. It turned out to add the most useful thing in it: on a shared page, a
divergence has exactly one possible cause, so the tool can finally say why two stores differ — and
say where a difference went missing.
