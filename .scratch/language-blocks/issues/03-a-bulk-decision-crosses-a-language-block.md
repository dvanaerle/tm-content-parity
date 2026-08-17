# 03 — A bulk decision crosses a language block

**What to build:** an editor dismisses a repeat in `be` and, where the two stores carry the same
text, the same decision covers `nl` — one press, events written for both. The editor is told before
they press how many events will be written and in which stores.

**Why this is second and not last:** on shared pages, **80.3%** of `be`'s work findings (2,631 of
3,276) have a repeat key that also occurs in `nl` on the same page, and **74.7%** for `fr` against
`be_fr` (2,625 of 3,512). That is about **5,256 work findings — 24% of the 22,048 pile — that an
editor is asked about twice.** Measured 2026-08-17.

**Blocked by:** 02 — the sibling match. It does not need the ranked list or the sibling tab.

**Status:** ready-for-human

## The measurement gate

Measured 2026-08-17 with `.scratch/language-blocks/measure-03.mjs`, over the committed
reports. *Before* is `repeatsInStore()` over one store's pages, which is what a dashboard
held until this ticket; *after* is the same function over the store's pages and its
sibling's, which is what the dashboard hands it now.

| store   | work findings | rows before | rows after | spanning rows | own | sibling |
| ------- | ------------- | ----------- | ---------- | ------------- | --- | ------- |
| `nl`    | 3,850 | 2,656 | 3,264 | 2,064 | 3,123 | 2,698 |
| `be`    | 3,316 | 2,672 | 3,264 | 2,064 | 2,698 | 3,123 |
| `be_fr` | 3,651 | 2,912 | 3,722 | 2,095 | 2,676 | 2,665 |
| `fr`    | 3,619 | 2,905 | 3,722 | 2,095 | 2,665 | 2,676 |
| `de`    | 3,859 | 2,789 | 2,789 | **0** | 0 | 0 |
| `uk`    | 3,753 | 2,947 | 2,947 | **0** | 0 | 0 |

**The numerator movement.** Distinct decisions over the six stores go **16,881 → 12,722, a
drop of 4,159 — 24.6%**. The Dutch block's two dashboards held 5,328 rows between them and
now mirror 3,264; the French block's 5,817 become 3,722. **11,162 of the 22,048 work
findings (50.6%)** sit in a repeat that spans its block, so half the pile is now reachable
in one press rather than two.

`de` and `uk` are unmoved to the row: 2,789 and 2,947 before and after, zero spanning rows.
That is the ticket's own trap answered by measurement rather than by argument.

**The prediction was low, and for a stateable reason.** The ticket predicted about 5,256
findings and 24% of the pile. That figure counted a repeat key co-occurring **on the same
page**; a repeat groups *across* pages, so the shipped grouping joins `nl/afhalen` with
`be/pergola` where the words agree and the per-page measure did not. The 24% turned out to
be the right number about **rows** and about half the right number about findings.

The row count per dashboard **rises** (2,656 → 3,264 on `nl`), which is not a regression: the
sibling's pages bring their own unshared differences onto the list, and the two dashboards of
a block now show one mirrored set of rows. What fell is the number of decisions.

This ticket is **alone in its measurement gate**: a dismissal moves the numerator, and the rule is
never to batch across a gate.

- [x] A repeat may span the two stores of one block, and only of one block — never `de`, never `uk`,
      never all six.
- [x] The change lands on the **existing repeat key**, so the class grouping and both bulk writers
      inherit it and no second definition of "repeat" exists in the codebase.
- [x] Nothing new is stored: no new scope, no new column, no change to the finding id. A bulk press
      still writes N ordinary events, one per page — the **selection** is what widened.
- [x] Eligibility is read per finding off the **text**: two findings join only when class, both texts
      and detail are equal. A page whose sibling text differs is not in the selection.
- [x] The two presses keep their **different eligibilities on one selection** — a bulk dismissal
      expires with the text and skips a finding a colleague decided; a bulk clearing revokes a
      dismissal and touches nothing else.
- [x] Only the **judgement** travels. A dismissal may cross a block; a **fix claim** may not, because
      correcting one store's page does not correct the other's.
- [x] A dismissal still expires **per store** when that store's text changes.
- [x] The selection states, before the press, how many events it will write **and in which stores**.
- [x] A partial failure reports *N of M saved*: the table is append-only, so what was written stands.
- [x] The numerator movement is **measured before and after** and the number is written into this
      file. This is the gate.
- [x] `CONTEXT.md`'s sentence *"A repeat never crosses a store, because the stores translate the
      text"* is amended in the house style — struck, dated, with this ticket's number — because its
      stated reason does not hold inside a block.
- [x] ADR 0018 records the decision: what it buys, what it costs, and the boundary that keeps it
      safe — a block is derived from a shared language and never from a hand-written list.
- [x] The existing store-scoped assertions still pass everywhere no block is involved.
- [x] The full suite passes, including the stopword guard.

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
