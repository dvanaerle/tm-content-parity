# 03 — A bulk decision crosses a language block

**What to build:** an editor dismisses a repeat in `be` and, where the two stores carry the same
text, the same decision covers `nl` — one press, events written for both. The editor is told before
they press how many events will be written and in which stores.

**Why this is second and not last:** on shared pages, **80.3%** of `be`'s work findings (2,631 of
3,276) have a repeat key that also occurs in `nl` on the same page, and **74.7%** for `fr` against
`be_fr` (2,625 of 3,512). That is about **5,256 work findings — 24% of the 22,048 pile — that an
editor is asked about twice.** Measured 2026-08-17.

**Blocked by:** 02 — the sibling match. It does not need the ranked list or the sibling tab.

**Status:** ready-for-agent

This ticket is **alone in its measurement gate**: a dismissal moves the numerator, and the rule is
never to batch across a gate.

- [ ] A repeat may span the two stores of one block, and only of one block — never `de`, never `uk`,
      never all six.
- [ ] The change lands on the **existing repeat key**, so the class grouping and both bulk writers
      inherit it and no second definition of "repeat" exists in the codebase.
- [ ] Nothing new is stored: no new scope, no new column, no change to the finding id. A bulk press
      still writes N ordinary events, one per page — the **selection** is what widened.
- [ ] Eligibility is read per finding off the **text**: two findings join only when class, both texts
      and detail are equal. A page whose sibling text differs is not in the selection.
- [ ] The two presses keep their **different eligibilities on one selection** — a bulk dismissal
      expires with the text and skips a finding a colleague decided; a bulk clearing revokes a
      dismissal and touches nothing else.
- [ ] Only the **judgement** travels. A dismissal may cross a block; a **fix claim** may not, because
      correcting one store's page does not correct the other's.
- [ ] A dismissal still expires **per store** when that store's text changes.
- [ ] The selection states, before the press, how many events it will write **and in which stores**.
- [ ] A partial failure reports *N of M saved*: the table is append-only, so what was written stands.
- [ ] The numerator movement is **measured before and after** and the number is written into this
      file. This is the gate.
- [ ] `CONTEXT.md`'s sentence *"A repeat never crosses a store, because the stores translate the
      text"* is amended in the house style — struck, dated, with this ticket's number — because its
      stated reason does not hold inside a block.
- [ ] ADR 0018 records the decision: what it buys, what it costs, and the boundary that keeps it
      safe — a block is derived from a shared language and never from a hand-written list.
- [ ] The existing store-scoped assertions still pass everywhere no block is involved.
- [ ] The full suite passes, including the stopword guard.

## Traps

- **This does not make a block difference decidable.** What crosses the block is a decision about an
  ordinary **axis-A finding** that happens to be identical in two stores. A block difference stays
  display-only and is never a finding; ADR 0017 is the boundary and this must not erode it.
- **Do not key anything on a block.** A repeat is a grouping the interface makes and has no identity
  to key on: the table gains rows and no column. A `block` scope is the mute's mistake with a new
  name.
- **80% is not 100%.** About 645 of `be`'s work findings on shared pages have no `nl` counterpart. A
  surface implying the block is decided when `nl` is decided is wrong about a fifth of it.
- **Do not extend a dismissal past the text.** Two stores agreeing today is not a claim that they
  will agree tomorrow.
- **Do not let this revive axis C.** The counted, class-carrying version of block differences was
  refused, and this ticket is the reason the refusal can hold rather than a step toward it.
- **The repeat key is the highest-traffic derivation in the app.** A mistake there moves counts on
  every store, including `de` and `uk`, which are in no block at all.
