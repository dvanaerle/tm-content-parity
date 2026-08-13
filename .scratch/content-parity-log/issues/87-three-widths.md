# 87 — Three widths

Type: task
Status: ready-for-agent
Blocked by: 79, 81
Parent: ../map.md

> **Part of this arrived on the way to other tickets, verified 2026-08-13 in a triage sweep
> of every open ticket.**
>
> **Already in the tree.** Every data table has a horizontal scroll wrapper —
> `web/src/components/ui/table.jsx:12` wraps in `overflow-x-auto`, and its users pass
> `table-fixed min-w-3xl` / `min-w-2xl` (`ContentView.jsx:271`, `Ledger.jsx:329,396`), so
> the fixed pixel columns became **minimum** widths while `table-fixed` was kept. That is
> this ticket's *a wide table scrolls sideways rather than crushing itself*, delivered by
> ticket 74's primitive. Some responsive utilities also now exist beyond the two `lg:` ones
> this ticket describes — `Shell.astro:41,55,60`, `Dashboard.jsx:250`,
> `ContentView.jsx:68,194`.
>
> **What is left.** The **three widths are named nowhere** — no doc, constant or comment in
> `web/src`, `docs/` or `CONTEXT.md` states the targets, so there is nothing to build
> against. The **header does not wrap**, and `Shell.astro:35-41` says so outright: *nothing
> here can wrap without breaking the `h-16`*. The touch-target rule is unmet and currently
> pointed the wrong way — override controls, the bulk buttons and the clamp control use
> `size="xs"` (`BulkControl.jsx:122,133`), which is smaller than a touch target, not larger.
> And the *expand and collapse by touch* criterion is still **unverifiable**, because 79's
> context markers do not exist yet. Both blocks — 79 and 81 — should be re-read before this
> starts; 81 is resolved, 79 is not.

**What to build:** the log is usable on a laptop, on a tablet and on a phone. An editor
standing in a showroom with a phone can read a page's findings, and the side-by-side diff
scrolls sideways instead of crushing itself into two unreadable columns.

## Why it goes last

It is blocked by the two tickets that change the shape of the screen. Done before them,
the work is done twice.

## The honest starting point

This is a build, not a keep. `web/src/` holds exactly **two** responsive utilities today,
both at the `lg` breakpoint, both in the content view's outline column. There is no `sm:`,
no `md:`, no `xl:`, no container query, and no `@media` rule in the stylesheet.

What carries the adaptation instead is `flex-wrap` in eleven places and a handful of
`min-w-*` floors. The three data tables are `table-fixed w-full` with fixed pixel column
widths and **no horizontal scroll wrapper**, so on a phone they compress rather than
scroll. The header is a fixed-height flex row with the store switcher pushed right and no
wrap.

## Acceptance criteria

- [ ] Three widths are named as the targets and stated in one place, so the next person
      adds a fourth deliberately or not at all.
- [ ] Every data table has a horizontal scroll wrapper, and the side-by-side diff scrolls
      sideways rather than compressing. Fixed pixel columns become minimum widths.
- [ ] The header wraps. The brand, the store switcher and the page title all remain
      reachable at the narrowest width.
- [ ] The page groups collapse, and the context markers from
      [79](79-the-content-view-opens-on-the-differences.md) still expand and collapse by
      touch.
- [ ] The repeat list from [81](81-the-repeat-is-the-queue.md) is usable at the narrowest
      width. It carries two counts and two texts per row, and it is the row most likely to
      break.
- [ ] Every interactive control meets a touch-target size, including the override
      controls, the checkboxes and the class pills.
- [ ] Checked at all three widths on: a store dashboard, the worst page
      (`nl__fotogalerij/zonwering`, 399 shown findings), a page with two findings, and a
      non-comparable page.
- [ ] The interface stays compact and quiet: clear hierarchy, restrained badges, low
      visual noise. Nothing is added that only exists to fill a wide screen.
- [ ] The palette is unchanged. This ticket moves things; it does not re-tone them.

## Traps

- **A side-by-side diff on a phone is two narrow columns or one scrolling pair.** Choose,
  say which, and do not stack the two sides vertically — a diff whose sides are not
  adjacent is not a diff.
- **`table-fixed` is load-bearing** for the column alignment the diff depends on. Removing
  it to gain flexibility will misalign the two sides.
- The canonical viewport is desktop and the log does not check the mobile version of a
  page. That is about what is compared, not about what the interface runs on, and the two
  must not get confused in the answer.
- The store switcher renders only when more than one store is in the log. Test the narrow
  header in both cases.
