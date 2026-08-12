# 81 — The repeat is the queue

Type: task
Status: resolved 2026-08-11 — built, and one acceptance criterion refused. See the answer.
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

## Answer — 2026-08-11

Built. `repeatsInStore()` and `repeatsWithClasses()` in `web/src/lib/view.mjs`,
`web/src/components/Repeats.jsx` beside the page list on the store dashboard, and the
`Taken` tab is gone.

### One acceptance criterion is refused

> *The list is worst-first by finding count, and each row states both the finding count
> and the page count. They are different numbers and both matter.*

**They are the same number, always, and not by accident.** The finding id is
`sha256(store | page | check | rule | prodNorm | newNorm | detail)`. `page` is a term of
it and the grouping key is a subset of the rest, so two findings on one page with the
same key would be the same finding. Measured over the whole corpus: **25,657 repeats,
zero exceptions**.

So a row states its size in **pages** and prints no second figure. Printing both would
be the doubled number this ticket's own third trap warns about, one step over. The
number that genuinely differs is `occurrences` — the same difference more than once on
a single page — and the row names it apart, only when it exceeds the page count.
`CONTEXT.md`'s *Repeat* entry now carries the proof so nobody re-asks.

The list is worst-first **by pages**, which is worst-first by findings.

### Measured — and ticket 76's table is superseded, not restated

Ticket 76 was open at the time and its numbers describe **448 reports** — it has since
closed on this measurement, 2026-08-12, because the corpus it named no longer exists. The disk
now holds **816 reports, 722 comparable, 35,503 shown findings** — tickets 50 and 54
landed in between. Measuring against 76's table would have measured a corpus that no
longer exists, in exactly the way 76 accuses the pre-64 numbers of doing. So the
numbers below come from the shipped function over the reports on disk.

| store | shown findings | repeats | singleton share | top 50 rows cover | top 100 | largest repeat |
| --- | --- | --- | --- | --- | --- | --- |
| `nl` | 6,004 | **4,152** | 78.8% | **9.6%** | 15.8% | 22 pages |
| `be` | 5,412 | 4,115 | 91.4% | 10.5% | 17.4% | 22 |
| `be_fr` | 6,225 | 4,399 | 88.5% | 9.6% | 16.7% | 23 |
| `de` | 5,743 | 4,125 | 83.1% | 10.0% | 15.6% | 22 |
| `fr` | 6,175 | 4,388 | 88.7% | 9.7% | 16.7% | 22 |
| `uk` | 5,944 | 4,478 | 90.7% | 10.3% | 16.6% | 30 |

The two figures this ticket asked for: **the `nl` list holds 4,152 repeats, and its
first fifty rows cover 9.6% of `nl`'s 6,004 shown findings.**

**The premise is weaker than the ticket assumed, and the design must not oversell it.**
The opening sentence imagines a footer line wrong on thirty pages; the largest repeat
in the largest store is on **22**, and 78.8% of `nl`'s repeats are singletons. Grouping
turns 6,004 rows into 4,152 — a 31% saving in reading, and none in deciding. The head
that 76 predicted would be flat after the banner exclusion is flat. That is not a
reason not to build this — 31% fewer rows and the top 100 covering a sixth of the store
is worth the screen — but it is a reason the interface says, in the sentence under the
list, that the grouping saves reading and not work, and that the list does not empty.

This also answers most of what 76 was for. What it still owes is the bulk-dismissal
verdict for ticket 31, and these numbers argue against it: a 22-page maximum is a
manageable click-through, and 88% singletons means a bulk tool would idle.

### Where each of `Taken`'s affordances went

| In `Taken` | Now |
| --- | --- |
| every text finding | **Inhoud**, in document order, beside the production text — which is the question a one-sided finding asks |
| every link finding | **Links**, with the two targets word-diffed |
| every image finding | **Afbeeldingen**, the same |
| the override control on each | on every row of all three tabs, unchanged |
| the class pill, `detail`, `×occurrences`, the section line | on every row of all three tabs, unchanged |
| *work down a page without changing tabs* | **not replaced, and deliberately.** It bought that by removing the context the other three add. The grouped reading of the work is the dashboard's *Verschillen*, which groups across pages — which is where the repetition actually is |

Nothing an editor could reach through `Taken` is unreachable. The badge counts moved
with the findings: `Inhoud`, `Links` and `Afbeeldingen` each counted their own check
already, and `Taken`'s badge was their sum.

### The other criteria

- The grouping is a pure function with a test that pins the key and pins that the
  return holds nothing a bar could be built from — the same rule `prepareRows` obeys.
  A test asserts two identical strings in two stores are two repeats.
- A repeat opens to its pages; a page name opens `/<store>/<page>/`, the whole content
  view, with no filter or fragment on it.
- The class pills are the entry points and there is no second surface: one pill set,
  one filter, both views. `repeatsWithClasses()` narrows the list and moves no count,
  and the existing *a filter moves no count* tests pass unchanged.
- Progress reads as how much is **decided**: each row says *N van M afgehandeld* from
  `barOf()` — the page bar's own four rules, now exported rather than restated — and the
  sentence under the list says the list does not empty.

### Two costs, stated

- **Wire.** The repeat grouping needs the two texts, so `loadSummaries()` now carries
  `prod`, `new`, `detail` and `occurrences` in its finding index. On `nl` that takes the
  index from **118 kB to 228 kB gzipped**. It is paid once: the repeat list is derived
  in the browser from that array, so no second copy of the text is serialised.
- **Rows.** 4,152 rows is more React than a dashboard should mount at once, so 100 are
  drawn and a button draws the next 100. It is a rendering budget in the manner of the
  clamp — the count above it says how many rows there are, so no row is hidden, only
  not yet drawn.
