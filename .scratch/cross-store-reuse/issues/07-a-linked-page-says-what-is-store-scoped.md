# 07 — A linked page says what is store-scoped

Type: task
Status: needs-triage — **2026-08-19**, by the audit of every open `ready-for-agent` ticket.
Was `ready-for-agent`. Not parked with 06 and 10, because half of it may not need them. The
second reading — production's two stores diverge and the new site's do not, so the migration
flattened a store difference and one store now shows the other's words — is **computable today
with no link table at all**. Linkedness is what licenses the *why it differs* label; it is not
needed to spot the flattening, and the flattening is where the defect is. Ticket
[11](11-measure-the-flattening-and-the-pairing.md) measures exactly that count and decides
which of two tickets this becomes: this one as written, gated on 10, or a display-only
flattening column on the sibling tab at a fraction of the cost. Re-triage when 11 reports.
Blocked by: 11 — the flattening count decides which half of this survives. 10, only if this
stays as written.
Parent: ../PRD.md

## What to build

One reading, derived, not decidable — and the check on whether a link was right.

**Store-scoped content.** On a linked page a divergence between the block's two stores can only
come from a store-scoped mechanism — a custom variable, a store-scoped block, or a translation.
Somebody asserted the two pages are one, so nothing else can produce it. Today the sibling tab can
show that two stores differ and can never say why; after this it can, and only on a linked page.

That matters most in the other direction. The sibling tab compares **production** on both sides.
If production's two stores diverge on a linked page and the **new site's** do not, the migration
flattened a store difference and one store now shows the other's words — the legal text, the
regional promise. Drawing the new site's two stores beside production's is what makes that
visible.

**This ships before anything travels.** Ticket 06 lets a fix claim cross a link, and the question
*are these two really the same on the new site* is what tells an editor whether a link deserved
to be made. Granting the permission first and building the check afterwards leaves a window in
which a wrong link cannot be looked at. That is the whole of why 06 is blocked by this and not
merely by 10.

The old *merge candidates* reading left this ticket. Its polarity inverted along with everything
else — it is now **link candidates**, and it ships with the linking screen in ticket 10, because
a list of pairs worth linking belongs where the linking happens.

## Criteria

- [ ] The sibling tab gains a **second reading**: production's two stores as today, and the new
      site's two stores beside it. It is a second reading and not a fifth comparison.
- [ ] A divergence on a **linked** page is named **`store-scoped content`**.
- [ ] The row where **production diverges and the new site does not** is the one that stands out,
      because that is a store difference the migration lost.
- [ ] Where that produces a defect it is already an ordinary axis-A finding on the affected store,
      and the decision stays there. This tab offers none.
- [ ] Both readings carry **no id, no override, no class pill and no place in any bar**.
- [ ] The tool never names the variable. Its value is server-side and appears in no HTML.
- [ ] Both readings are decided **as values** by the existing reading functions and rendered dumbly.
- [ ] The `CONTEXT.md` entry for **store-scoped content**.
- [ ] `npm test`.

## Traps

- **Nothing here becomes a finding.** ADR 0017 holds: a block difference is display-only, and
  promoting one is its own ADR and the day *axis C* becomes available. A legal-text divergence
  between `nl` and `be` is correct, not defective, and must never read as work.
- **The inference needs the link.** On a page that is *not* linked, the same divergence says
  nothing — two records may simply hold different words. Do not draw the marker there.
- **A divergence on a linked page is not evidence the link was wrong.** It is exactly what a
  custom variable looks like. What the reading gives an editor is somewhere to look, not a verdict
  — and the same caution as link candidates, running the other way round.
- **Do not name or guess the variable.** *A variable lives here* is the whole claim. `zonweringUSP`
  is knowledge the tool does not have and must not appear to have.
- **Do not tint a row by direction.** `lost` and `added` are the tones of a class. Neither store
  lost anything — they differ.
- **The tab stays absent, not empty, on a page with no sibling**, as it is today.
- **The static build never reads the log.** The links are read in the browser. `PageView` is
  already a `client:load` island, so the reading takes linkedness as a value from the island and
  never computes it at build time, where it would be as fresh as the last build.

## Where it came from

A grilling session, 2026-08-19. The custom-variable objection looked at first like it killed the
whole feature. It turned out to add the most useful thing in it: on a linked page, a divergence
has exactly one possible cause, so the tool can finally say why two stores differ — and say where
a difference went missing.

The second session, the same day, moved this ahead of ticket 06. When the relation was an import
it was somebody else's fact and the reading was a convenience. Now that an editor declares it,
the reading is the only way to find out that a declaration was wrong before its claims go out.
