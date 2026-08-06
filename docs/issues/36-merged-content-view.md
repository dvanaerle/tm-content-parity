# 36 — The content view: the whole page, filtered, tickable

**What to build:** one tab that is the page. Every element in document order,
production and the new site side by side, matched rows calm and changed rows
coloured — so a difference is found by scanning rather than by reading. The
editor narrows it to one class to do a pass of nothing but copy edits, and ticks
each row off as they go.

Today Diff and Content are two tabs that answer half a question each: Diff shows
only the differences, so after the tinting lands every row would be coloured and
the colour would carry no signal; Content shows two blocks of flat Markdown with
no diff at all. The only controls are one noise checkbox and the tab-per-check
split, so `copy` — 270 findings — stays buried under thousands.

**Blocked by:** [34](34-position-and-ordering.md) and
[35](35-diff-rendering-and-design-system.md). 35 gives the rendering; 34 is
required because the moment this view claims to show the whole document in
order, the new-only row-ordering defect becomes a visible lie.

**Status:** ready-for-agent

**Implements:** spec [32](32-scannable-log-and-six-stores.md), phases 4 and 5,
minus Leesweergave.

- [ ] Diff and Content merge into one tab. The element table is the spine;
      Markdown is demoted from a tab to an export. Markdown is never the diff
      spine — it flattens the element identity the finding id depends on.
- [ ] **Matched rows are shown by default.** A tint only reads as a signal
      against untinted baseline. The inverse control — show only differences —
      remains.
- [ ] Outline is retired as a tab and returns as a sticky heading jump-list
      beside the content view.
- [ ] **Five tabs**: Inhoud, Links, Afbeeldingen, Meta, Taken. Inhoud lands
      first.
- [ ] A multi-select class filter on the content view: session-only, and it
      **never** moves a bar, a denominator or a count. A filterable denominator
      would make two people quoting "the number" mean different things.
- [ ] Filter state is visible while it is on, so a filtered view is never
      mistaken for a finished page, and clears in one action.
- [ ] The dashboard's class pills become clickable with the same semantics,
      filtering the page list to pages carrying that class.
- [ ] A **checkbox** replaces the "Opgelost" button only. Dismissal and mute keep
      their menu — a dismissal carries a mandatory note and a checkbox cannot.
- [ ] The checkbox has **three** visual states: unticked, ticked, and
      **ticked-but-contradicted**. A fix claim is a claim of fact that loses to
      re-check; a two-state checkbox is the affordance that made the superseded
      "the tick always wins" model feel natural.
- [ ] A tick on one row of a grouped finding ticks **every** row of it, visibly,
      and the row shows its occurrence count. Bulk stays a UI action writing N
      events, never a third override key.
- [ ] The view holds at the extremes: a median page of 41 findings, and
      `fotogalerij/zonwering` at 401.
