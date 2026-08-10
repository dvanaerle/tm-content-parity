# 81 — The repeat is the queue

Type: task
Status: ready-for-agent
Blocked by: 76
Parent: ../map.md

**What to build:** a store's work, listed as differences rather than as pages. One
footer line that is wrong on thirty pages is **one row** in the list, saying it is on
thirty pages, and opening it shows them. An editor stops meeting the same difference
thirty times.

## The decision this ticket carries

A **repeat** is every finding in **one store** with the same class, the same two texts
and the same detail. It is not a thing the data holds — it is a grouping the interface
makes, and it is the grouping key ticket 31 asked for and could not name.

**A repeat never crosses a store.** The stores translate the text, so the same defect
in six stores is six repeats. Measured: the promo banner is one Magento block and it
appears as about thirty language-specific tuples, so a key on the literal text
multiplies by six and a key on the block does not exist — an element carries no DOM
path by ticket 01, and ticket 34 confirmed it.

This is also where the quick-filter want lands. A class pill that lists its findings
directly **is** this view with a class pre-selected, so it is not a second surface.
There is no all-stores repeat view, for the same reason ticket 38 gave: a store is the
unit an editor is responsible for.

## Why this shape and not a page list

Measured on 448 reports: 22,990 shown findings in 8,229 distinct repeats. 116 repeats
covered a quarter of the corpus and 903 covered half — and 3,925 repeats are
singletons, 17.1%, so the tail is real. Ticket 76 restates all of these with the promo
banner removed, and its numbers are the ones this ticket builds against.

The consequence has to be visible in the design: **the backlog is not drained.** Ninety
per cent coverage costs thousands of decisions, so progress reads as how much is decided
and never as how much is left.

## What it delivers

- A repeat list per store, worst-first, over `(class, prod, new, detail)` within the
  store. Each row: the class, the two texts, the number of findings and the number of
  pages.
- A page list beside it, which is what the dashboard is today. Two views over one
  derivation.
- The class pills become entry points into the repeat list. The **Taken** tab goes:
  Inhoud, Links, Afbeeldingen and Meta already show the work with better context, and
  this view shows it grouped.
- Opening a repeat lists its pages, and a page name opens the full content view.

## Acceptance criteria

- [ ] The repeat list is derived in `web/src/lib/view.mjs` as a pure function, with a
      test that pins the grouping key and pins that the function returns nothing else.
- [ ] Grouping is within one store. A test asserts that two identical strings in two
      stores are two repeats.
- [ ] The list is worst-first by finding count, and each row states both the finding
      count and the page count. They are different numbers and both matter.
- [ ] A repeat opens to its pages. A page name opens the full content view for that
      page, not a filtered fragment of it.
- [ ] The `Taken` tab is gone, and nothing an editor could reach through it is now
      unreachable. Say in the answer where each of its affordances went.
- [ ] The class filter pills are the entry points, and no separate quick-filter surface
      is added. `web/src/lib/view.mjs` stays the only thing that decides what is on
      screen.
- [ ] A filter still moves no count. The existing test for that rule passes unchanged.
- [ ] Progress language says how much is decided. No wording anywhere implies the list
      will empty.
- [ ] Measured against ticket 76's numbers: the answer records how many repeats the `nl`
      list holds and what share of `nl`'s findings the first fifty rows cover.

## Traps

- **The head of the old measurement is the promo banner, and it is already excluded.**
  Do not design against the pre-64 numbers in this file. Ticket 76's table is the one.
- **A repeat is not a finding.** It has no id, no override and no history. It is a
      grouping, and every decision on it is still N decisions on N findings —
      [31](31-bulk-dismissal.md) builds that.
- **`occurrences` already exists** and it is the count of the same difference *on one
  page*. A repeat counts across pages. Two different numbers, and confusing them will
  produce a row that says 60 when it means 30.
- Ticket [48](48-open-and-done-board.md) wants a grouping **within** one page by done
  and not-done. That is a different want and this ticket does not answer it.
- Ticket 54 raises `fr` from 28 pages to about 126 and ticket 55 does the other four
  thin stores. The list must not assume a store is small.
