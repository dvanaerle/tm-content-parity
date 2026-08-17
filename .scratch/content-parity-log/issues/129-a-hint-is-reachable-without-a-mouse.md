# 129 — A hint is reachable without a mouse, on every surface

Type: task
Status: ready-for-agent
Blocked by: None — can start immediately.
Parent: ../map.md

> **Merged 2026-08-17.** This ticket absorbed **130**. One pattern, one primitive, one guard,
> and the guard cannot pass until every surface has moved — which is exactly the shape ticket
> 124 ruled on: *a half-Dutch application is worse than either end state, and the guard cannot
> pass until the labels are done, so the split is a commit per area and not a second ticket.*
> 130's own words make the same case against itself — *the same shape means two different
> things depending on which screen it is on* — and it moves no count.
>
> **130's stated reason for the split was a context window, not a principle**, and it says so.
> That reason is honoured and not dismissed: the two parts below are **two commits landed in
> two passes**, and part B may be a second session. What changes is that the guard, the pattern
> and the two dozen attributes stop being two tickets that can drift apart in the queue.
>
> The filename keeps 129's slug so the inbound links in `map.md`, 128 and 130 still resolve.

**What to build:** every hover hint in the log reaches an editor who is not holding a mouse.
Every one of them is a native `title` attribute, and a `title` is invisible on a touch screen,
unreachable by keyboard, unstyleable, and announced unreliably by screen readers. The `Tooltip`
primitive has been installed since ticket 74 and **has no importer anywhere** — not in a
component, not in a page.

That is the largest undocumented gap in the interface: 36 real `title` attributes against a
primitive with zero imports, and no comment anywhere acknowledging the choice. Several comments
discuss "the tooltip" as a designed thing — the caller owning the tooltip that names the unit,
the tooltip that keeps two rows apart, the tooltip that says what each view answers — while the
thing they describe is an attribute the browser draws however it likes.

ADR 0007 bought this dependency for exactly this reason. Its own case for taking the library is
the accessibility work the interface was not doing, and `title` is the textbook example.

**It adds JavaScript, deliberately, and that is worth stating.** A `title` costs nothing and a
`Tooltip` is Base UI with positioning behind it. The CSS-only replacements — the Popover API,
anchor positioning, `interestfor` — are all refused by 127 for years yet. The trade is accepted
because "zero JavaScript" was never the goal: a hint a touch user cannot see is not a cheap
hint, it is a hidden one.

---

## A — The dashboard, and the pattern

The dashboard is done first because it holds the largest share of the hints and the widest
variety of them — a hint on a pill, on a column head, on a checkbox, on a count — so a pattern
that survives the dashboard survives everywhere.

- [ ] A hint on the dashboard is reachable by keyboard and announced, and it is drawn by the
      primitive rather than by the browser's own box.
- [ ] The pattern is established once — how a hint is attached, what it does to the control's
      accessible name, and how a hint on a disabled or read-only control behaves — so part B is
      an application of it and not a second design.
- [ ] A hint never becomes the control's only accessible name. A control whose meaning lived
      in its `title` gets a real label, and the hint says the extra thing.
- [ ] Hints that are decoration rather than meaning are identified and left as they are, or
      removed. This does not promote a nicety into a component.
- [ ] The words are unchanged. This is about reach, not copy, and ADR 0014 already fixed the
      language.
- [ ] Browser tests assert reach and not markup: a hint is available to a keyboard user and
      carries its text. The assertion is about what a reader can get to.
- [ ] The dashboard's screenshot baselines are reviewed for layout movement. A tooltip
      trigger inside a table cell can change a row's height, and a moved baseline is a real
      change that needs looking at rather than accepting.
- [ ] No `title` attribute is left on the dashboard carrying meaning an editor needs.

## B — Every other surface, and the guard

The rest of the log's hints follow the dashboard's, so an editor learns one behaviour and it
holds wherever they are. With part A alone the dashboard's hints are reachable and the others
are not, which is worse than either state on its own: the same shape means two different things
depending on which screen it is on.

The remaining hints sit on the content view, the diff, the page ledger, the override control,
the annotate bar, the bulk control and the search result — six components and roughly two dozen
attributes. Each is an application of part A's pattern. Nothing here is a new decision.

**Land this as its own pass, and possibly its own session.** Six components, two dozen hints and
the screenshot baselines of five browser suites do not fit one context window beside the work of
establishing the pattern, and a refactor that runs out of room with baselines half regenerated
is worse than one that lands in two passes.

- [ ] Every hint on the content view, the diff, the ledger, the override control, the annotate
      bar, the bulk control and the search result is reachable by keyboard and announced.
- [ ] The pattern is part A's, unchanged. If a surface cannot follow it, the reason is a comment
      in that file and not a second pattern.
- [ ] No `title` attribute carrying meaning is left anywhere in the interface.
- [ ] A guard fails if a `title` attribute returns to a component. The interface-language test
      is the shape to follow — a static sweep over the drawn extensions, `ui/` included, because
      a primitive that starts writing a `title` is exactly the day a guard that trusted `ui/`
      cannot see.
- [ ] Screenshot baselines are reviewed per surface, not accepted in bulk. The diff cells and
      the content view rows are where a trigger is most likely to move a layout.
- [ ] The words are unchanged, per part A.

---

## Traps

**On the pattern (A)**

- **A tooltip is not a place to put something an editor must read.** If the hidden text is
  required to act, the text belongs on screen. Moving an essential sentence from a `title` into
  a `Tooltip` makes it reachable but keeps it hidden, and some of these 36 hints are carrying
  more than a hint.
- **Do not wrap a `title` in a `Tooltip` and leave both.** The browser will draw its own box
  over the primitive's, and a reader gets the same words twice in two shapes.
- Do not reach for the Popover API, anchor positioning or `interestfor` as a CSS-only route.
  All three are refused by 127, and the unguarded fallback for the Popover API renders the
  content inline and always visible, which is worse than the problem.
- A hint attached to a checkbox must not swallow the press. The tri-state select-all controls
  already answer a mixed press by clearing, and that behaviour is pinned; a trigger wrapped
  around the wrong element breaks it.
- The four `title` **props** on the local aside and class-strip components are not DOM
  attributes and are not this ticket's subject. Do not convert them.

**On the rest of the surfaces (B)**

- **The diff's copy button is the delicate one.** Its hint sits on a control whose flash 128
  moved into CSS, and wrapping it changes what the animation is attached to. Check the flash
  still runs after the swap.
- The override control's hint explains a tri-state checkbox — one of the two places the mixed
  press is answered by clearing. Do not let a trigger take the press.
- A hint inside a `CollapsibleTrigger` must not become a button inside a button. The repeats
  queue already met that failure once, when a checkbox was put inside the trigger, and its
  comment records that it is neither valid nor clickable.
- Do not extend the guard to the four local `title` **props**. They are component props, not
  attributes, and a guard that cannot tell them apart will be switched off by whoever it first
  annoys.

**On the merge itself**

- **The guard lands with part B and not before.** A guard added in part A fails the moment it
  is written, because six components still hold their attributes. This is why the two parts are
  one ticket: the guard has no ticket of its own to belong to.
- **Two commits, and two passes if the context asks for it.** Merging the tickets did not merge
  the work. If part B runs out of room, stop at a reviewed baseline rather than regenerating in
  bulk to finish.
