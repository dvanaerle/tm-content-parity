# 130 — Every surface hints the same way

Type: task
Status: resolved 2026-08-17 — merged into 129 as part B. Not built; the work is unchanged and it moved.
Blocked by: 129 — the pattern a hint follows.
Parent: ../map.md

**What to build:** the rest of the log's hints follow the dashboard's, so an editor learns
one behaviour and it holds wherever they are. After 129 the dashboard's hints are reachable
and the others are not, which is worse than either state on its own: the same shape means two
different things depending on which screen it is on.

The remaining hints sit on the content view, the diff, the page ledger, the override control,
the annotate bar, the bulk control and the search result — six components and roughly two
dozen attributes. Each is an application of 129's pattern. Nothing here is a new decision.

**It is split from 129 on size and not on principle.** Six components, two dozen hints and
the screenshot baselines of five browser suites do not fit one context window beside the work
of establishing the pattern, and a refactor that runs out of room with baselines half
regenerated is worse than one that lands in two passes.

- [ ] Every hint on the content view, the diff, the ledger, the override control, the
      annotate bar, the bulk control and the search result is reachable by keyboard and
      announced.
- [ ] The pattern is 129's, unchanged. If a surface cannot follow it, the reason is a comment
      in that file and not a second pattern.
- [ ] No `title` attribute carrying meaning is left anywhere in the interface.
- [ ] A guard fails if a `title` attribute returns to a component. The interface-language
      test is the shape to follow — a static sweep over the drawn extensions, `ui/` included,
      because a primitive that starts writing a `title` is exactly the day a guard that
      trusted `ui/` cannot see.
- [ ] Screenshot baselines are reviewed per surface, not accepted in bulk. The diff cells and
      the content view rows are where a trigger is most likely to move a layout.
- [ ] The words are unchanged, per 129.

## Traps

- **The diff's copy button is the delicate one.** Its hint sits on a control whose flash 128
  moved into CSS, and wrapping it changes what the animation is attached to. Check the flash
  still runs after the swap.
- The override control's hint explains a tri-state checkbox — one of the two places the mixed
  press is answered by clearing. Do not let a trigger take the press.
- A hint inside a `CollapsibleTrigger` must not become a button inside a button. The repeats
  queue already met that failure once, when a checkbox was put inside the trigger, and its
  comment records that it is neither valid nor clickable.
- Do not extend the guard to the four local `title` **props**. They are component props, not
  attributes, and a guard that cannot tell them apart will be switched off by whoever it
  first annoys.

## Answer

**Merged into [129](129-a-hint-is-reachable-without-a-mouse.md) as part B, 2026-08-17.**
Nothing here is withdrawn and nothing is built. This is one pattern, one primitive and one
guard, and **the guard cannot pass until every surface has moved** — so it had no ticket of
its own to belong to. Ticket 124 already ruled on this exact shape: the guard it installed
could not pass until the labels were done, so the split was *a commit per area and not a
second ticket*.

**This ticket's own reason for existing was a context window, and it says so** — *split from
129 on size and not on principle*. That reason is honoured rather than dismissed: 129 keeps
part B as its own commit and its own pass, with the instruction to stop at a reviewed
baseline rather than regenerate in bulk to finish. What the merge removes is two tracker
entries that could drift apart in the queue while the interface hints two different ways.

Read 129. This file is kept as the record of where the work was written.
