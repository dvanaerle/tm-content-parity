# 07 — A linked page says what is store-scoped

Type: task
Status: ready-for-agent — **re-triaged 2026-08-21, reduced to its flattening half.** Ticket
[11](11-measure-the-flattening-and-the-pairing.md) has reported and it decided in this ticket's
favour on the half that needs no link table, and against the half that does. **The flattening
reading survives and is unblocked; the `store-scoped content` label is refused.** See *What 11
decided* below for what is in and what is out. The heading keeps its old slug so inbound links
still resolve, but the ticket is no longer about a *linked* page — the reading it builds needs no
link at all.

It was `needs-triage` from 2026-08-19, by the audit of every open `ready-for-agent` ticket, held
there so it would not be parked with 06 and 10 while half of it might need neither.
Blocked by: None. 11 is resolved, and nothing that survives here waits on 10, which is refused.
Parent: ../PRD.md

## What 11 decided, 2026-08-21

Measured at `cf50c63`, verified at `ff263b8`; the working is in
[`../FLATTENING.md`](../FLATTENING.md) and the reading is quoted in 11 itself.

**In — the flattening, and it is worth building.** **111 units on 42 page pairs** diverge on
production's two stores and agree on the new site's, over `{nl, be}` and `{be_fr, fr}`. 109 of
the 111 are in work classes, and among them are a warranty scope (`garantie`) and a delivery-area
promise (`levergebied`, `zone-de-livraison`) that production varied per country and the migration
made uniform. It is computable today from `data/extract/` with three calls to `diffRows()`, no new
column and no link table.

**In — but as a reason and an ordering, not a new surface.** **109 of the 111 are already open
axis-A findings** — 58 on `be`, 34 on `be_fr`, 28 on `fr`, 17 on `nl`. Nothing here is hidden from
an editor. What this ticket adds is a reason beside a difference the log already reports, and an
ordering that lifts those 42 page pairs.

**Out — the `store-scoped content` label.** A store-scoped variable renders no HTML, so the cause
is unnameable, and **21 of the 111** are a new-site rewrite rather than one store's words winning.
The label the evidence supports is *production varied here and the new site does not*, which is a
divergence and not a cause.

**Out — everything that needed a link.** Ticket 10 is refused outright, so linkedness is not a
fact this ticket may read. The one thing 10 was needed for — which pairs are one Magento record —
is already answered by the imported shared-page fact (ADR 0025), and the flattening reading needs
no link either way.

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
- [ ] ~~A divergence on a **linked** page is named **`store-scoped content`**.~~ — **refused by
      11.** The cause is unnameable and 21 of the 111 are a new-site rewrite. What a row may say
      is *production varied here and the new site does not*, which is the divergence and not its
      cause.
- [ ] The row where **production diverges and the new site does not** is the one that stands out,
      because that is a store difference the migration lost. **This is the ticket now** — 111
      units on 42 page pairs, and the reason belongs beside the axis-A finding 109 of them
      already are.
- [ ] Those 42 page pairs are ordered ahead of the rest, so the reading is met and not hunted for.
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
- ~~**The inference needs the link.**~~ — **moot.** There is no link to read, so the trap it
  guarded cannot fire. What replaces it: **a divergence on production is never work.** ADR 0017
  holds, and the thing this ticket reports is the *agreement* on the new site, not the divergence
  on production.
- ~~**A divergence on a linked page is not evidence the link was wrong.**~~ — **moot**, with 10.
- **Do not name or guess the variable.** Still holds, and 11 sharpened it: the tool may not say a
  variable is the cause at all. `zonweringUSP` is knowledge the tool does not have, and *store-
  scoped* is a claim the HTML cannot support.
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

**And 11 took it back, 2026-08-21.** The custom-variable objection turned out to be right twice
over: it added the flattening reading, and then it removed the label the same reading was supposed
to license, because a mechanism that renders no HTML cannot be named from the HTML. The relation
is an import again — ADR 0025 — so the reading is once more derived from somebody else's fact,
which is why it needs no ticket 10 and no permission.
