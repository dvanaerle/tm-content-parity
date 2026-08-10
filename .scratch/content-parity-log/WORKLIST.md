# Worklist: every open ticket, in the order to build it

Written 2026-08-10. One step for each open ticket, from the first to the last.

This file answers one question: **what do I do next?** `RUNBOOK.md` says *why*
the order is what it is, and `map.md` stays the map. If this file and the map
disagree, the map wins.

**49 of the 90 tickets are closed**, counted from the `Status:` line of every
ticket file on 2026-08-10. 41 are open. 35 steps are below and **steps 01 to 06
are done**, except that step 05 shipped its rule without its crawl, so **step 05b
is the next step**. Seven tickets are parked and they are at the end.

The count went 47 to 49: tickets **56** and **67** closed. A closed ticket that
comes back is why this line is counted and never incremented by hand.

**Count 90 in two folders.** 89 ticket files sit in `issues/` and the ninetieth,
ticket **49**, sits in `issues/.out-of-scope/`. A count that reads one folder
gives 89 and misses an open ticket.

**The corpus is 816 store pages**, from 451, since step 03 landed on 2026-08-10.
Every count taken against 448 reports or 451 pairs is stale, and steps 12 and 13
exist to restate them.

**⚠ The reports on disk are older than the extractor. Read no number until they
are rebuilt.** Step 05 changed how a content unit is extracted on 2026-08-10 and
**did not re-crawl**. So `data/extract/` and `data/reports/` still hold the
pre-fold corpus, and `node compare/measure.mjs nl` answers with numbers no
current code produces. Step 05b is that rebuild and it is the next step.

The steps are **not renumbered** as they close. Step 24 says "blocked by step 22"
and a renumbering would make every such line a lie.

## How to use it

Work the steps from the top. Each step is one sitting.

- **`/clear` between every step.** The next ticket is self-contained.
- **One ticket, one gate.** Never batch two tickets that move the same number in
  opposite directions. Step 03 and step 04 were written as the one exception.
  **They were not batched**: step 03 ran alone on 2026-08-10 and step 04 is still
  open. Nothing was lost, so the exception is now a permission nobody needs.
- **After every step:** `npm test`, then `node compare/measure.mjs nl`. A step
  that adds no rule must move no number.
- **Before a `data` step:** check that the six `valantic*` hosts answer. That is a
  measurement, not a memory, and 2026-08-10 shows why: all five answered HTTP 500
  in the morning and all five answered **200** at 11:59. Production answers 200
  throughout. Ticket 51's guard stops a run on any 500, so a crawl started on a
  memory of yesterday is a crawl that aborts.

  ```powershell
  node -e "for (const h of ['valanticnl','valanticbe','valanticde','valanticfr','valanticuk']) { const r = await fetch('https://'+h+'.intern.systems/'); console.log(h, r.status) }"
  ```

  The network needs the sandbox disabled in this environment.
- Tick the box when the ticket file says `Status: resolved`.

**touches** says which shared resource the step writes. `data` runs alone.
`compare` and `web` write code, so they hold the first session on their own.
`read` and `talk` collide with nothing. "Two sessions at once" below says what
may run beside the first session.

---

## Two sessions at once

**There are no worktrees.** One checkout, and a second session opens in the same
directory. Two sessions are safe only when their **write sets do not overlap**.

`RUNBOOK.md` still describes lanes as one worktree each. That section is
superseded for this worklist. It stays true for the parked axis B stream, where
four independent classifiers really are four lanes.

That leaves one safe kind of work: the step that writes **markdown only** — a
ticket file, `CONTEXT.md`, an ADR. A grilling is that, and a triage is that. A
step that touches `data` or `compare` or `web` writes code, so it stays in the
first session.

**"Blocked by nothing" is not "safe beside".** Steps 14, 17, 18, 20, 21, 26 and
27 have no blocker and they still collide, because they write the same tree.

What can run in the second session today:

| step | what | why it is safe |
| --- | --- | --- |
| **32** | Ticket 34, the deep link | `talk`. No blocker. It writes one ticket file. |
| **33** | The re-triage of 04, 16, 20 and 48 | `talk`. **Joined on 2026-08-10**, when step 03 landed. |
| **13** | Ticket 89, the campaign rule | `read`. No blocker. It **reads** `data/`, so see rule 2. |
| **00b** | The first real mute | A browser. Nothing in git. |
| **23** | Ticket 30, wire Supabase | A browser and `web/.env`. Nothing in git. |

**Step 33 has joined the list.** Step 03 unblocked it on 2026-08-10, and three of
its four tickets already carry their new numbers. Step 34 never joins: it is on
hold and it waits for a person.

**Rule 1. The second session does not tick a box.** `WORKLIST.md`, `map.md`,
`CONTEXT.md` and `docs/adr/` are the four files that both sessions want. The
first session owns them. The second session reports, and you write the tick.

**Rule 2. Nothing measures while a crawl runs.** Steps **05b, 10 and 11** rewrite
`data/` — 02 and 03 did and are done, and 05 shipped a rule without a crawl, which
is why 05b exists. A number read in the middle of a crawl looks
correct and is not. While a crawl runs, the second session talks. It does not
measure.

**Prefer a background command to a second session.** A crawl started in the
background keeps the one session free, and it needs no second window and no
second `npm install`.

**What this buys.** The longest chain of blocked steps is about 23 of the 34, and
the workspace stream alone holds 12 that cannot overlap at all. A second session
saves about 2.5 hours of the 8.5. It buys nothing after step 19, so close it
there.

**One reviewer.** Two diffs that arrive together are two diffs read badly, and a
diff read badly is how a number moves in silence.

---

## Step 00 — Three loose ends. **YOU, not an agent**

None is a ticket. All three fell out of step 01 and none can be done by an agent.

### ☑ 00a — The mute migration is applied

`supabase/mute-anchor-heading.sql` ran on 2026-08-10. `select anchor_heading,
names_section from overrides limit 1` returns a row, and the log reads again.

It exposed a defect that no test could catch, now fixed: the mute key had been put
in `compare/contract.mjs`, which imports `node:crypto`, so **the React island
stopped building and every control in it died** — including *Je naam*, which has
nothing to do with mutes. The key is `shared/mute-key.mjs` now, per ADR 0001. The
lesson is in the gate below: a green `npm test` says nothing about the bundle.

**Reload a store page after any change that moves an import.** The island either
hydrates or it does not, and only a browser can say which.

### ☐ 00b — Make the first real mute. **Nobody has made one yet**

The control renders and the log writes, but no mute has been pressed under the new
key. The table is append-only, so the first press is permanent — which is why this
is a deliberate step and not a thing to try in passing.

On `nl/terrasoverkapping`, *Dempen…* on a `text-missing` finding under «Gumax®
Heavy Duty».

**Gate.** The section button reads **64 bevindingen onder "Gumax® Heavy Duty"** and
the page button reads **86 bevindingen op de hele pagina**. Neither can be pressed
until a reason is typed. After the section press, **64** go and **22** stay. Then
*Ongedaan maken* brings them back, and the row it wrote is `cleared` with the
heading on it.

### ☑ 00c — Repair `web/node_modules`

Repaired on 2026-08-10. Reverting the half-applied Astro upgrade had left
`web/node_modules` on the newer tree, so `npm --prefix web run build` failed on a
missing Astro file. `npm install` could not repair it while the dev server held
the file locks, so the dev server was stopped first.

The build gate is green again. It carries three steps that cannot start without
it: 14, 15 and 16 each gate on `npm run build`.

---

### ☑ Step 01 — Ticket 88, the mute says what it hides — **DONE**

Resolved 2026-08-10. `Status: resolved`. Commit `b8c8538`.

*Klasse dempen* is gone. *Dempen…* offers the section form first and the
page-wide form second, each stating its finding count, and neither can be pressed
without a note. The mute key is `store | page | class | anchorHeading`, with an
absent heading for the page-wide form and `null` for the content before the first
heading — a real section, and the third state the key had to spell out.

**Live mutes before the change: zero**, measured on the day and not quoted from
ticket 65. Four live `page-class` keys, every one of them `cleared`. Nothing was
orphaned, so the migration was free, exactly as ADR 0008 predicted.

**The gate held, with one number corrected.** `(text-missing, «Gumax® Heavy
Duty»)` covers **64**, as predicted. The page-wide total is **86** today where
ADR 0008 measured 88, so the section press leaves **22** visible and not 24: two
findings left the snapshot between the two measurements. `nl__fotogalerij/zonwering`
reproduces exactly — 399 shown, 4 class groups, **239** heading groups at 1.7
each, so the page-wide form is still the only usable one there.

**One defect was caught in review, not in test.** The first draft stopped at the
section key, so clearing a section and then pressing *Hele pagina dempen* left
that section open for ever, under a button that had just counted it in. A cleared
section now falls through to the page-wide mute, which is the fall-through a
cleared dismissal already has onto a class mute. Both directions are tested.

**Step 00b is the unfinished half of this step.** Nobody has pressed a mute yet.

---

## The corpus stream — steps 02 to 11

`data/` has one writer. No two of these steps may be in flight together.

---

### ☑ Step 02 — Ticket 54, the French store shows all its pages — **DONE**

Resolved 2026-08-10. The identity half landed on the day; the crawl was blocked by
HTTP 500 on all five `valantic*` hosts and ran later, inside step 03's sitting,
once they answered 200 again. **123 pages crawled, 117 comparable, 8,154 findings,
5,495 shown, median 25.** Coverage 90.2%, exactly as predicted. The prescribed
delete of the stale 28-key extracts was not needed and the reports were checked for
strays: zero.

The original step is kept below.

---

#### Step 02 as it was written, kept for the record

touches `data` **alone**. Blocked by 53 — **done**.

**Why now.** This is the go/no-go for spec 50. It exists so that a design defect
costs one store and not six. It also carries the identity change merged in from
ticket 57.

**The code is done. Only the crawl is left.** Commit `90c5e7a` on 2026-08-10, and
`npm test` is green at 472. `Status: ready-for-agent`, and **nine of the eleven
criteria are ticked**. The two that are open are one blockage: the five
`valantic*` hosts answered HTTP 500 all that day, so the French crawl and the
French comparison numbers could not be taken. **They answer 200 again at 11:59 on
2026-08-10, so this step can now finish.** The ticket file holds every number and
every command.

```
/clear
```

```
Finish ticket 54. Read
.scratch/content-parity-log/issues/54-french-store-shows-all-its-pages.md, and the
section "What is left, and what it needs" holds the commands. No code is needed.
Two criteria are open and both want one French crawl and one comparison.

Check the five valantic hosts first. They answered 500 all morning on 2026-08-10.

Delete data/extract/fr/ and data/reports/fr__*.json BEFORE the crawl. The 28
extracts on disk are keyed on the old page keys, and 95 of the 123 new keys did
not exist when they were written. All 28 old French paths are in the new list, so
nothing is lost.

compare/link-status.mjs takes no store. It writes one global file and it refuses
an argument with exit 2, per ticket 59.
```

**Gate.** The French dashboard shows **123** pages, not 28, of which about **117**
are comparable. Ticket 53 settled the count at 123, and six pages answer 404 on
the new side, so the ticket's older headline of "about 126" is superseded.
Navigation and footer coverage reaches **90.2%**, from 35.3%, measured by
`data/probe-navigation-coverage.json`.

**The 35.3% before-value is the thinner half of that row.** The probe measures the
current rule. The old number came from looking the same 51 candidate paths up in
the seed list of commit `f640567`.

Then run `node compare/measure.mjs nl` and confirm that `nl` has not moved from
**179 / 124 / 9,635 / 6,747 / median 37**.

---

### ☑ Step 03 — Ticket 55, the other five stores — **DONE**

Resolved 2026-08-10. `Status: resolved`.

**816 store pages against 451.** nl 179, be 130, be_fr 122, de 134, fr 123, uk 128,
and each dashboard was counted in the built HTML and holds its whole store. 722
comparable, 54,723 findings, 37,329 shown, 823 pages built.

**The NL baseline held byte for byte** — 179 / 124 / 9,635 / 6,747 / median 37.
`node crawl/21-crawl-store.mjs nl` wrote **0** extracts, which is why: without
`--force` the crawler skips a page that already has an extract, so nl could not
drift. That is the check that the new rule did not over-collect.

**The crawl was 368 requests, not 1,600.** `fr` and `be_fr` were already on disk
against the new key set and `be` needed 5 pages, so only `de` (89) and `uk` (86)
were large. The estimate was right for the work and wrong for this sitting.

Coverage: nl 94.2%, be 90.6%, be_fr **92.0%**, de **90.6%**, fr 90.2%, uk
**88.5%**. `de` and `uk` hit ticket 50's numbers exactly. A probe defect was fixed
on the way — `NOT_A_PAGE` is anchored at the store root and `be_fr`'s root is
`fr/`, so four Magento routes sat in its denominator. `be_fr` moved 85.2 to 92.0
and **no other store moved**.

**Two pages of 820 cannot be crawled, and both are storefront defects**, not tool
failures: `faq/offerte` on nl and be (ticket 17's redirect loop, on the new side
now) and `(uk)measuring-tool` (production 301s to a 404; the new site serves a
456-byte empty page).

**Ticket 49 is re-opened.** Its own first trigger fired: `be_fr` went 29 pages to
122 and the in-scope count that made it wontfix went from **1 to 12**. Ticket 38's
per-store table and its map entry are re-measured. Ticket 04 closes, and 16 and 20
come back to step 33.

The original step is kept below.

---

#### Step 03 as it was written, kept for the record

touches `data` **alone**. Blocked by 54.

**Why now.** The rollout. About **1,600 requests**, and it is the largest crawl
in the project. Nothing else may touch `data/` while it runs.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/55-five-stores-show-all-their-pages.md

This is the large crawl, about 1,600 requests. Give compare/link-status.mjs no
store argument. It writes one global file. Ticket 59 landed, so the script
refuses an argument and exits 2, and this line is a reminder and not the guard.
```

**Gate.** The **NL baseline does not move**. The number to hold it against is
today's, not ticket 38's: `node compare/measure.mjs nl` reads **179 crawled, 124
comparable, 9,635 findings, 6,747 shown, median 37** on 2026-08-10. Ticket 38's
181 is the older count and it is not the gate. The store total goes from 451 pairs
to about **800**.

---

### ☑ Step 04 — Ticket 56, an excluded page says why

**Done 2026-08-10.** The gate below read right: the surface was the **105** seed
drops, not the report folder's 1. `crawl/` now emits the drop list instead of
counting it, `data/10-store-seeds.json` carries all 105 with a named rule, and
the dashboard states `pagina's gevonden` with the not-checked pages inside the
total. All 105 are `product-signature`; none of the seven kinds the ticket named
is in the corpus, because the sitemaps never declared them. The three uncrawled
pages are a third kind now and no longer silently absent. `npm test` 472 → 507.


touches `web`. Blocked by 54. **Was to be the same sitting as step 03, and it was
not.** Step 03 was run on its own, so this step is still open and it is now the
next one. Nothing is lost: 56 moves no finding count, so step 03's number stays
readable whenever this lands.

**One number for it is measured already.** 820 seed store pages give **816**
reports: 1 excluded (`veranda-configurator`, nl only) and 3 that cannot be
crawled — `faq/offerte` on nl and be, and `(uk)measuring-tool`. The gate below
expects about 60 excluded pages and the real figure is **1**, so read the gate
again before building to it. The exclusions the spec meant are the ones the seed
rule never admitted, and those are counted in `data/10-store-seeds.json` under
`dropped`, not in the report folder.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/56-an-excluded-page-says-why.md

The corpus is built already: 816 reports from 820 seed store pages. Read the gate
below before you build to it — the "about 60" was an estimate and the report
folder holds 1 excluded page, not 60.
```

**Gate, and it needs re-reading.** As written: about **60** of the ~800 discovered
pages are excluded, each naming the rule that excluded it, in a committed list and
not in code, and each still counted in the store total.

**The 60 is two different populations, and only one of them is this ticket's.**
Step 03 measured both.

| population | count | where it lives |
| --- | --- | --- |
| excluded by `shared/excluded-pages.mjs` | **1** | `veranda-configurator`, nl only |
| cannot be crawled | **3** | `faq/offerte` ×2, `(uk)measuring-tool` |
| **dropped by the seed rule** | **105** | `data/10-store-seeds.json` |

876 candidates − 105 dropped + 49 carried over = the 820 seed store pages, and 816
of those reach the report folder.

**The 105 is the ticket's surface**, and "about 60" was the estimate for it. But
`dropped` is a **number and not a list**: the generator counts what it discards and
records nothing about which page or which rule. So the first half of this ticket is
making `crawl/` emit the list at all. Nothing downstream can name a reason that
nothing upstream wrote down.

**It inherits a class with no surface.** Ticket 54 added `no-declared-alternate`.
The finding is in the report JSON and it is correct there, but nobody can see it:
`web/src/components/Ledger.jsx` returns the *Niet te vergelijken* panel before any
finding renders, so a one-sided page shows nothing, and on a comparable page the
class sits behind the hidden-class filter. This step and ticket 20, at step 33, own
that surface between them. The code comment in `compare/30-compare.mjs` says so.

**After steps 03 and 04, four things fall out.** Step 03 landed on 2026-08-10 and
three of the four are done already:

- Ticket **04** closes. **Still open** — it goes to step 33 with the other three.
- Ticket **49** gets its probe again — **done**. Its trigger fired and it is
  re-opened as `needs-triage`: 1 in-scope anchor became **12**.
- Tickets **16** and **20** come back for triage. That is step 33.
- Ticket 38's per-store counts need a new measurement — **done**, in the ticket
  and in `map.md`.

---

### ☑ Step 05 — Ticket 67, a content unit folds its inline links — **CODE DONE, CORPUS NOT REBUILT**

Resolved 2026-08-10. `Status: resolved`. Commit `79b9985`. `npm test` 507 → **512**.

A content unit is the block an editor edits. A block folds the `a` and the
`button` inside it, and a nested block still breaks it. `kind: 'cta'` reads the
content and not the tag that emitted the unit, and `mayPair()` permits `cta`
against `text`.

**The gate held on the part that matters and its override number was wrong.**

- **The `/overkapping` paragraph is one `<p>` on each side**, 190 words against
  188, and the `6063-T6` against `6036-T6` difference is a **shown `copy`**
  finding. The log compared 35 of that paragraph's 1,232 characters before.
  `crawl/probes/probe-overkapping-fold.mjs` asserts both halves and exits
  non-zero when either fails, so this is evidence and not a claim.
- **Seven live judgements detached, not one.** The gate said "exactly 1
  dismissal", which was ticket 65's 2026-08-07 measurement. Re-run on 2026-08-10
  before the extractor changed: **33 live judgements**, of which 4 dismissals and
  3 fix claims detach. Three more were expiring anyway, because an editor had
  changed the text. No page review went stale and no muted class moved. The
  worklist's own rule earned its keep here: the log is written to daily, so a
  number in a ticket is a number from the day it was taken.
- **The fold recovers a fifth of production.** nl went from 9,293 content units
  to **7,424** on the same 179 pages, and the new site from 6,855 to 6,486.

**One thing it broke that it did not fix.** `ABSOLUTE_MAX_UNITS` is 100, and
ticket 63 justified it as above the widest entry (50) and below a near-miss of
139 units on `/overkapping`. After the fold that near-miss measures **91**, under
the ceiling. `/downloads` is still excluded, at 190. The ceiling is a resolved
ticket's decision, so it is recorded in `shared/excluded-regions.mjs` and not
moved. **It needs a ticket** — see the loose end below.

The original step is kept below.

---

### ☐ Step 05b — Rebuild the corpus the fold changed. **The next step**

touches `data` **alone**. Blocked by nothing. It is the second half of step 05.

**Why it is its own step.** Ticket 67 changed the extractor and every extract on
disk was written by the old rule. Nothing downstream is readable until the crawl
runs again: the reports, the finding ids, the shown counts and the override
attachments all come from `data/`. Step 05 shipped the rule and left the numbers,
which is why the two numbers the ticket asked for — the one-sided rows that go and
the copy differences that arrive — are still uncounted.

It is a full six-store crawl with `--force`, so it collides with everything.

```
/clear
```

```
Rebuild the corpus for ticket 67's fold. No code changes.

Crawl all six stores with --force, because every extract on disk was written by
the leaf rule that ticket 67 replaced. Check the five valantic hosts answer 200
first.

Then report TWO numbers separately, which is what ticket 67 asked for and step 05
could not answer: how many one-sided rows GO, because a discarded paragraph no
longer makes them, and how many copy differences ARRIVE, because a markup
difference was hiding them. One net number hides both.

Expect the shown count to RISE. Ticket 67's note says so: the log becoming
honest, not a regression.
```

**Gate.** Every store re-crawled and re-compared, and the two numbers are
recorded separately in ticket 67. The nl baseline **must move** here — it is the
one step in the corpus stream that is expected to, and the fold's 9,293 → 7,424
unit change is the reason. Seven overrides detach and the interface shows them as
open findings again.

**The dated note goes out with this**, not with step 05:
`notes/2026-08-07-the-fold-and-your-judgements.md` carries the 2026-08-10 numbers
already. It is written in the language of the repository and **the interface is
Dutch, so it needs translating before it goes to an editor.**

---

### ☐ Loose end from step 05 — the region ceiling needs a ticket

touches `talk`. Nobody owns it yet, and it is not a step.

`ABSOLUTE_MAX_UNITS = 100` rests on a near-miss that the fold moved from 139 to
**91**. The ceiling now admits the wrong selector it was written to refuse. Three
outcomes are possible and none is this step's to pick: lower the ceiling, re-anchor
it on `/downloads` at 190, or accept that the near-miss is no longer the bound.
The product-grid entry declares `maxUnits: 80`, so any new ceiling must stay above
80. **Step 28 gates on this number**, so it should be decided before step 28.

---

#### Step 05 as it was written, kept for the record

touches `data`. Blocked by 66 — **done**. Needs ticket 65's number — **measured**.

**Why now.** The fold. It rebuilds every report and it detaches overrides. 62
blocks and about 3,400 words are uncompared today, and `/overkapping` alone loses
928 words.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/67-a-content-unit-folds-its-inline-links.md

Read docs/adr/0002-content-unit-is-the-editable-block.md first. The decision and
the rejected alternatives are recorded there and are not reopened.

Measure it TWICE and report the two numbers separately. It removes the one-sided
rows that a discarded paragraph caused, and it adds copy differences that a
markup difference was hiding. One number would hide both.

Re-run `node crawl/probes/probe-fold-detachment.mjs` on the day, and send
notes/2026-08-07-the-fold-and-your-judgements.md with that day's number in it.
The table is written to daily, so 2026-08-07's number is not today's number.
```

**Gate.** The `/overkapping` paragraph is one unit on each side, and the
`6063-T6` against `6036-T6` difference is reported. That defect is invisible
today. **Exactly 1 dismissal detaches** and no page review goes stale.

---

### ☑ Step 06 — Ticket 68, the grilling. Four numbers are chosen

touched `talk`. Done 2026-08-10.

The clamp is **four lines**. The cap is **50,000 cells of n·m**, after the trim. The
diff cost must **fall by 70%** in total LCS cells on `nl__privacy-beleid`, which is the
gate, because Node can count it and a test can hold it. First paint is **LCP 2.5 s and
TBT 200 ms** on two pages, as a target and as evidence.

The ticket is renamed to
[68 the clamp](issues/68-the-content-view-clamps-a-tall-row.md), because "fold" is now
reserved: a unit folds its inline links, tier 1 folds a character to nothing, and a run
of equal rows **collapses**. `CONTEXT.md` gained **clamp** and **uncompared**.

**Two things the grilling found that this worklist had wrong.**

- **`nl__fotogalerij/zonwering` is the wrong page for the diff.** 7 two-sided rows and
  15 LCS cells: its new side has 9 elements against production's 178, so almost every
  row is one-sided and a one-sided row costs the diff nothing. The worst page for the
  diff is `nl__privacy-beleid` at 287,971 cells. It stays the right page for the clamp
  and the jump.
- **78% of the diff cost is rows that already agree.** `ContentView.jsx` passes no
  `equal` prop, so the browser builds a full LCS table for 8,461 identical rows — 11.5
  of the corpus's 14.8 million cells, and they are the longest rows. One prop, and it
  is worth more than the trim and the cap together.

Two criteria also changed shape. The one that said the quiet rows stay short says
nothing after 79, so the clamp keys on **length**. And the jump criterion needs **no
code**: nothing above the table is sticky, so the row height was the whole complaint.

---

### ☐ Step 07 — Ticket 68, the build

touches `web`. Blocked by step 06 and **by 79**.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/68-the-content-view-clamps-a-tall-row.md

Measure the cell count and first paint on both named pages, before and after, and
put the numbers in the ticket. Bank the equal-row skip on its own, before the trim
and the cap land.
```

**Gate.** A row clamps to four lines with one control, the cap fires at 50,000 cells
and reports the cell as uncompared without touching a class, and the total LCS cell
count on `nl__privacy-beleid` has fallen by 70% or more.

**A loose end this step cannot decide.** 68 is sequenced after 79, and `map.md` puts 68
in the corpus stream (`54 → 55 + 56 → 67 → 68 → 58`) with 79 in the workspace stream
that runs two streams later. The edge crosses the streams. Either 68 leaves the corpus
stream and goes beside 79, or 79 comes forward, or the two are decoupled. Ticket 37 is
"after 68", so it moves with whatever is chosen.

---

### ☐ Step 08 — Ticket 37, leesweergave

touches `web`. Blocked by 68.

**Why here.** It moved. It was a free `web` lane, and it is not one any more: it
builds view modes onto a content view that ticket 67's fold has now rewritten and
that ticket 68 clamps.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/37-leesweergave.md
```

**Gate.** Three distinct alt renderings: an alt with content, an alt that is
present but empty, and an absent alt attribute with a visible marker. Production
carries **50** images with no alt attribute.

**Ticket 48 unblocks here**, and it goes to triage at step 33.

---

### ☐ Step 09 — Ticket 69, one canonical viewport

touches `compare`. Blocked by 64 — **done**.

**Measure before you build.** Ticket 64 removed the promo banner, which was most
of the duplication this ticket was written against.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/69-one-canonical-viewport.md

Measure the residual duplication AFTER ticket 64. The banner was most of it. If
what is left is one label on a category page, say so and CLOSE this ticket rather
than build a rule for one label.
```

**Gate.** The residual count is recorded. `/downloads` held 40 duplicated
strings, 28 of them under a hiding class, and each category page held 4, 3 of
them in the banner. Closing the ticket is a valid outcome.

---

### ☐ Step 10 — Ticket 70, shared regions by content hash

touches `data`. Blocked by 64 — **done** — and 67, step 05 — **done**. It reads
the corpus, so it waits for step 05b as well.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/70-shared-regions-by-content-hash.md

Measure first: how many differing units are shared across pages. If the share is
small, only the exclusion half ships.

If the measurement shows that most findings are shared-block findings, STOP and
say so. That reorders the roadmap, and it is not this ticket's decision to make
quietly.
```

**Gate.** The shared-unit count is recorded. Ticket 64's campaign anchor guards
about **4,055** findings that a hash would judge once instead of 446 times — and
both of those were counted over 448 pages. The corpus is 816 now, so re-measure
the guard before you size the ticket against it.

---

### ☐ Step 11 — Ticket 58, the head becomes a check

touches `data` **alone**. Blocked by nothing. Read 21 first.

**Why last in the corpus stream.** It re-crawls all six stores with `--force`.
Nothing else may run against `data/` at the same time.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/58-axis-a-meta-check.md

Read 21-axis-a-meta-check.md first. It holds the decisions.

This re-crawls all six stores, so nothing else may run against data/ at the same
time. Measure it TWICE and report the two numbers separately.
```

**Gate, two numbers.** Excluding `no-route` removes about **150** findings over
six stores. The nine meta classes add about **130** over 373 comparable pages,
which is 0.54% of shown. `robots-index-lost` fires **exactly once**, on `be`.

**Both numbers were counted over 373 comparable pages and there are now 722**, so
scale them before you gate on them: about **250** and about **250** if the rate
holds, and 0.54% of shown is the figure to check rather than either count. The
`robots-index-lost` "exactly once" is the one claim that does not scale — it is a
fact about one store's head, and if it fires more than once now, that is a finding
and not a drift.

**The corpus is now settled. Do not re-open it before step 12.**

---

## The re-measurement — steps 12 and 13

Both are research tickets. They write numbers, not features. touches `read`, so
they collide with nothing and they can run beside each other.

**Every number designed against must be re-stated before it is designed against.**
Ticket 55 took the corpus from 451 pairs to **816** on 2026-08-10, and tickets 64,
67 and 58 each moved the finding count.

**The scale of what needs restating, now that step 03 has landed:** 448 reports
became **816**, 373 comparable pages became **722**, and 34,559 findings with
23,570 shown became **54,723 and 37,329**. Every gate in this file that quotes a
number over 448 reports or 373 comparable pages is stale until these two steps run.
Steps 11, 29 and 32 each carry one, and each says so.

**Step 05 moved the numbers again, and nothing has counted it yet.** The fold takes
the unit corpus down by a fifth on the production side, and it turns hidden markup
differences into shown copy differences. So the 54,723 and 37,329 above are already
history too. **Both of these steps are worthless before step 05b**, for the same
reason they were worthless before step 11: they read `data/`.

---

### ☐ Step 12 — Ticket 76, the coverage curve without the promo banner

touches `read`. Blocked by nothing, but worthless before step 11.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/76-the-coverage-curve-without-the-promo-banner.md
```

**Gate.** Every prior number is restated in one table beside its before value.
The baseline is **8,229** distinct repeats: 25% of the corpus costs 116
decisions, 50% costs 903, 75% costs 3,393 and 90% costs **5,930**.

**Ticket 81 and ticket 86 both wait on this.**

---

### ☐ Step 13 — Ticket 89, what a one-sided campaign rule would catch

touches `read`. Blocked by nothing. **It may refuse ticket 90.**
**Runs in the second session**, but not while a crawl runs.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/89-what-a-one-sided-campaign-rule-would-catch.md

A refusal is a valid outcome and it is not a failure. The campaign pattern is
Dutch, which is the objection ADR 0003 used against a Dutch text anchor, and the
banner carries link findings that a text rule cannot reach.
```

**Gate.** Every non-banner match is listed with its page, class and production
text, if there are fewer than about **200** of them. More than 200 is itself the
answer, and **ticket 90 is refused** — which deletes step 30.

---

## The stack — steps 14 to 16

Alone. An upgrade that carries a product change cannot be reviewed. Nothing else
is in this stream, and each step is its own commit.

Astro 7.2.0 is current. The documented path from 5.14 is 5 to 6 to 7. **Astro 6
raises the Node floor to 22.12.0** — for `crawl/` and the re-check service as
well as for the build.

**Gate for all three steps:** `npm test` green, `npm run build` builds the same
page count, and **no finding count moves at any of the three**.

---

### ☐ Step 14 — Ticket 72, Astro 6

touches `web` **alone**. Blocked by nothing.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/72-upgrade-to-astro-6.md
```

**Gate.** The Node floor is **22.12.0**, stated where contributors look, and the
crawl scripts and the re-check service still run on it.

---

### ☐ Step 15 — Ticket 73, Astro 7

touches `web` **alone**. Blocked by 72.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/73-upgrade-to-astro-7.md
```

**Gate.** `web/package.json` is on Astro **7**, and `npm test` passes with no
test changed.

---

### ☐ Step 16 — Ticket 74, seven accessible primitives

touches `web` **alone**. Blocked by 73.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/74-seven-accessible-primitives.md

Read docs/adr/0007-shadcn-is-taken-for-behaviour-only.md first. This takes shadcn
on Base UI for BEHAVIOUR only — focus traps and keyboard menus. Seven primitives
and no more. web/src/lib/palette.mjs keeps meaning, and Chips.jsx and Diff.jsx
are not rebuilt out of library parts.
```

**Gate.** Exactly **7** primitives: Dialog, Popover, Tooltip, Select, Checkbox,
Tabs, Table. The dependency count is recorded before and after, about **2** to
about **9**.

---

## The contract — steps 17 and 18

Two tickets on `compare/`. The runbook batches them in one session. They are
listed apart because each has its own gate.

---

### ☐ Step 17 — Ticket 75, class visibility replaces the shown boolean

touches `compare`. Blocked by nothing.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/75-class-visibility-replaces-shown.md

Read docs/adr/0005-class-visibility-is-one-enum.md. The shown-or-hidden boolean
becomes work / information / diagnostic. It is NOT a second axis — ticket 02
removed that, and the class stays the only axis and the mute key.
```

**Gate.** The class count stays **22**. All **12** shown classes become `work`
and the **10** hidden ones split. **The denominator shows no movement on any
store.** Expect no movement at all.

The count was 21 in every earlier draft of this step. Ticket 54 added
`no-declared-alternate`, hidden, which took the vocabulary to 22 — measured from
`compare/vocabulary.mjs` on 2026-08-10, not quoted.

**Tickets 85 and 86 both wait on this.**

---

### ☐ Step 18 — Ticket 77, a finding says when it was first seen

touches `compare`. Blocked by nothing.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/77-a-finding-says-when-it-was-first-seen.md

Read docs/adr/0004-history-is-a-run-log-that-never-re-attaches.md. Ids stay
content-addressed and they expire, so ticket 01 stands. The word "Changed" is
refused. A committed index keyed on the finding id records first seen and last
seen, and git history is the archive.

It implements PRD.md user story 23. Review the diff against it.
```

**Gate.** A second run over the same corpus with no site change moves **zero**
first-seen dates.

---

## The workspace — steps 19 to 31

Twelve tickets on one shared surface. `compare/vocabulary.mjs`,
`overrides/state.mjs` and `web/src/lib/view.mjs` are each read by several of
them, so this is the opposite of a lane: **one ticket in each sitting, and the
order below is the order.**

```
78 → 79 → 80 → 81 → 31 → 82 → 83 → 84 → 85 → 86 → 90 → 87
```

**No ticket holds a user story.** `/implement` closes by running
`/code-review`, whose Spec axis reads the diff against what the spec asked for,
and with no story reference that axis has nothing to anchor on. So the known
mapping is written into each prompt below: 81 → PRD 1–6, 82 → 7–8, 80 → 11–13,
31 → 14–19, 77 → 23, 78 → 25–26, 79 → 29–31, 83 → 35–39, 84 → 40–44, 85 → 45–49.

---

### ☐ Step 19 — Ticket 78, a closed finding leaves a history note

touches `web`. Blocked by 77.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/78-a-closed-finding-leaves-a-history-note.md

Read docs/adr/0004-history-is-a-run-log-that-never-re-attaches.md first. The note
is display-only and it claims no identity.

It implements PRD.md user stories 25 and 26. Review the diff against them.
```

**Gate.** A test pins that the bar, the denominator and the tab badges are
identical with and without the notes. **Zero** count change.

---

### ☐ Step 20 — Ticket 79, the content view opens on the differences

touches `web`. Blocked by nothing. **Read this one first of the twelve.**

**Why it carries the view decision.** Measured: **82% of shown findings are
one-sided** — `text-missing` 49.3%, `missing-link` 21.0%, `image-missing` 12.1% —
and `copy`, the only class with a score, is **3.4%**. A comparable page holds a
median of 37 shown findings, 151 at p90 and 399 at worst.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/79-the-content-view-opens-on-the-differences.md

Read docs/adr/0006-the-content-view-is-the-spine.md first.

It implements PRD.md user stories 29 to 31. Review the diff against them.
```

**Gate.** Checked on `nl__fotogalerij/zonwering`, the worst page at **399** shown
findings, and on a page with **2** findings.

---

### ☐ Step 21 — Ticket 80, three buckets, and the third is Closed

touches `web`. Blocked by nothing.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/80-three-buckets-and-the-third-is-closed.md

It implements PRD.md user stories 11 to 13. Review the diff against them.
```

**Gate.** The buckets are derived in `overrides/state.mjs` as a pure function
over the **5** states, with a test for each state. The word "Resolved" appears
**zero** times in the code and in the interface.

---

### ☐ Step 22 — Ticket 81, the repeat is the queue

touches `compare`. Blocked by 76, step 12.

**Why it matters most.** The backlog does not drain: 3,925 of the 8,229 repeats
are singletons, and 90% coverage costs about 5,930 decisions. Progress must read
as how much is decided, never as how much is left.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/81-the-repeat-is-the-queue.md

It implements PRD.md user stories 1 to 6. Review the diff against them.
```

**Gate.** The repeat list is derived in `web/src/lib/view.mjs` as a pure function
with a test pinning the grouping key. The answer records the `nl` repeat count
and the share of `nl` findings that the first **50** rows cover.

**Tickets 31, 82 and 87 all wait on this.**

---

### ☐ Step 23 — Ticket 30, wire the Supabase project. **YOU, not an agent**

touches nothing in git. `Status: ready-for-human`.

**It has one precondition that is still unproven.** Ticket 13 is applied and one
**manual** keepalive run went green. That proves the insert. It does not prove
the cron. Open Actions and confirm that a **scheduled** run has written a row.
The schedule is `17 4 * * *` UTC and GitHub runs it when it can, so one or two
hours late is usual and is not a fault.

Then apply the schema and the two public env values to `web/.env`.

**`schema.sql` drops the override log.** It is the whole-file version, for a new
project. The live project already holds dismissals, so if step 00a has run this
step must not re-apply `schema.sql` over it.

**Gate.** `overrides` has exactly **two** RLS policies: insert for `anon` and
select for `anon`. No update and no delete. The connected bundle is
`_astro/overrides.*.js` at about **228 KB**, against about 11 KB when it is not
connected.

**Ticket 31 cannot ship without this.**

---

### ☐ Step 24 — Ticket 31, one reason, many findings

touches `web`. Blocked by 30, 76, 81 and 88 — steps 23, 12, 22, and 88 is
**done**.

**It was rewritten on 2026-08-10, not duplicated.** The grouping key it asked for
three sessions ago is ticket 81's *repeat*, so it is no longer a measurement that
might empty itself. The instruction to measure first is spent.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/31-bulk-dismissal.md

It implements PRD.md user stories 14 to 19. Review the diff against them.
```

**Gate.** The bar and the denominator move by exactly the number of findings
dismissed and by nothing else. A partial failure reports how many were written,
in the form "23 of 30 saved". The largest repeat measured holds **329** findings.

---

### ☐ Step 25 — Ticket 82, search reaches the content

touches `web`. Blocked by 81.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/82-search-reaches-the-content.md

It implements PRD.md user stories 7 and 8. Review the diff against them.
```

**Gate.** Search finds a finding by **6** fields, each with a test: production
text, new-site text, link text, link target, anchor heading and page key. `nl`
holds 6,747 shown findings.

---

### ☐ Step 26 — Ticket 83, a page carries a priority and a note

touches `web`. Blocked by nothing.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/83-a-page-carries-a-priority-and-a-note.md

Exactly two page-scope annotations and no more: a closed-list priority and a
free-text note.

It implements PRD.md user stories 35 to 39. Review the diff against them.
```

**Gate.** Setting a value on **N** selected pages writes N events, one for each
page. A partial failure reports how many were written.

---

### ☐ Step 27 — Ticket 84, a one-sided page carries a migration decision

touches `web`. Blocked by nothing.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/84-a-one-sided-page-carries-a-migration-decision.md

It implements PRD.md user stories 40 to 44. Review the diff against them.
```

**Gate.** A fifth page-scope override kind with **4** values: migrate, not
migrated, replaced, redirected. A page claimed *redirected* or *replaced* whose
new-side status is still **404** reads as contradicted, and it names the claimer.
The derivation is pure and tested.

---

### ☐ Step 28 — Ticket 85, the comparison scope is legible

touches `web`. Blocked by 75, step 17.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/85-the-comparison-scope-is-legible.md

Read docs/adr/0003-regions-are-excluded-at-extraction.md first. The three-page
evidence rule and the ceiling are there.

It implements PRD.md user stories 45 to 49. Review the diff against them.
```

**Gate.** A selector plus **3** page keys returns live unit counts, for each side
and for each page. A proposed `maxUnits` is **never above the ceiling of 100**.

**The ceiling is in question, and this step gates on it.** Ticket 67 took the
near-miss that justified 100 down to 91, so the ceiling now admits the selector it
was written to refuse. See the loose end under step 05. Read the decision before
building the check, or the check enforces a number nobody believes.

---

### ☐ Step 29 — Ticket 86, heading level becomes information

touches `compare`. Blocked by 75 and 76 — steps 17 and 12.

**This is the first deliberate move of the denominator.** Every other step in
this file must not move it. This one must, and by a known amount.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/86-heading-level-becomes-information.md
```

**Gate.** `heading-level` carries `visibility: 'information'`. Per-store totals
before and after show that **nothing else moved**.

**The size is stale and step 12 restates it.** 1,215 shown findings at 5.3% was
counted over 448 reports. `nl` alone holds **469** today, so re-measure the class
across the 816 before you move the denominator by it — this is the one step that
moves the denominator on purpose, so it is the one step that must know the amount
first.

---

### ☐ Step 30 — Ticket 90, a campaign is a class, not a commit

touches `data`. Blocked by 89, step 13. **Step 13 may have deleted this step.**

If ticket 89 found more than about 200 non-banner matches, ticket 90 is refused.
Read 89's answer before you start.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/90-a-campaign-is-a-class-not-a-commit.md

Read docs/adr/0003-regions-are-excluded-at-extraction.md first.
```

**Gate.** Per-store totals are recorded before and after. Findings move between
classes, but **the total number of findings must not change**. Retiring the
region entry re-adds about **4,055** findings, and the new rule must take all of
them back.

---

### ☐ Step 31 — Ticket 87, three widths. **LAST**

touches `web`. Blocked by 79 and 81 — steps 20 and 22.

**Why last.** Every step above changes the interface. Done earlier, it is done
twice.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/87-three-widths.md
```

**Gate.** Checked at all **3** widths — laptop, tablet, phone — on a store
dashboard, on `nl__fotogalerij/zonwering` at **399** shown findings, on a
two-finding page and on a non-comparable page. Tables scroll, they are not
compressed.

---

## The debt — steps 32 to 34

---

### ☐ Step 32 — Ticket 34, the deep link

touches `talk`. A conversation, so it can run beside any crawl. 8 of its 9
criteria are done. **This is the first choice for the second session**, because
it writes one ticket file and it reads no number.

```
/clear
```

```
/grill-with-docs .scratch/content-parity-log/issues/34-position-and-ordering.md

Only the deep link is open. 1,622 of 10,796 nl findings have no anchor heading, so
they carry no link. That ratio is 15% and it is the number that matters; the two
counts are ticket 38's nl figures and nl is 9,635 findings now, over a corpus of
54,723. Do not quote either count as current.

Where a link does show, both sides are built from the PRODUCTION heading, which
cannot resolve on the new site where that heading changed. What a finding with no
heading gives instead has never been decided.
```

**Gate.** The ticket says what a finding with no anchor heading links to.

---

### ☐ Step 33 — Triage again: tickets 16, 20, 48 and 04

touches `talk`. Each one waited for a blocker that has now landed.

- **04** — **step 03 has landed, so it closes here.** `Status: reopened` today.
- **16** — unblocked by 55, step 03 — **done**. Its premise needs correcting
  first: 283 clusters have no NL member, so ticket 04's "no page exists without an
  NL counterpart" is false.
- **20** — unblocked by 22 and 55, both **done**. **Both populations are
  re-measured**, over 816 pairs instead of 451:

  | population | was | is |
  | --- | --- | --- |
  | pairs whose new side 404s — not migrated | 34 of 451 | **53 of 816** |
  | nl pages that exist only on the new site | 42 of 181 | **41 of 179** |
  | non-comparable pairs, all six stores | — | **94 of 816** |

  New-side 404s by store: nl 14, de 11, be 8, be_fr 7, uk 7, fr 6. **The new-only
  population is entirely nl** — all 41 of it, and no other store has a single one.
  That is worth a sentence in the re-triage: it says the 41 are the carried-over
  pages that no sitemap declares any more, and not a migration surplus.

  It also owns half of the missing surface for `no-declared-alternate`. Step 04
  says which half.
- **48** — blocked by 37, step 08. Question one is answered already by ADR 0006
  and ticket 79. Two are left: what counts as *afgerond*, and whether a `×6`
  finding is one task or six.

```
/clear
```

```
/triage

Re-triage these four. Each one's blocker has landed, and each number in them was
counted against a corpus that has since moved.

- 04-six-store-page-lists.md — closes with 55
- 16-new-site-page-discovery.md — unblocked by 55
- 20-one-sided-pages-checklist.md — unblocked by 22 and 55
- 48-open-and-done-board.md — unblocked by 37

Ticket 49 is re-opened already. Ticket 55 re-ran its probe on 2026-08-10: be_fr is
122 pages, and the new-side count that made it wontfix went from 1 in-scope anchor
to 12. The new table is in the ticket. Decide whether 12 buys the rule ticket 05
refused. Do not re-run the probe.
```

---

### ☐ Step 34 — Ticket 25, fotogalerij. **A person, not an agent**

touches `talk`. `Status: needs-info`. **ON HOLD.**

**Do not grill it again.** The text half is settled: production renders each tile
three times and the new site renders it once, as the `alt`, so the 155
`text-missing` findings are a lost duplicate and not lost copy.

The image half is open and one crawl cannot close it. There is a third state the
ticket did not have: the migration can be **unfinished**, which looks the same as
broken in a snapshot. Empty alts on 4 of 7 pages, `serre` and `tuinkamer`
identical, and counts that move in both directions all point that way.

**The owner will rebuild the page by hand and compare.** Until then, **mute
nothing on these pages** — a mute on `image-missing` hides the number to watch.

The one measurement named, if it is wanted: perceptual hashing of the unpaired
images on the parent page, **69 production against 26 new**, about 95 fetches, as
a probe in `crawl/probes/` and not in the pipeline.

---

## Parked — axis B, tickets 39 to 45

**Nobody starts these.** The grilling of 2026-08-10 put axis B out of scope for
the workspace work, and this line makes that a decision instead of a silence.
Ticket 11 holds every rule and none of them expires.

Two reasons to leave them. Every ADR from 0004 to 0008 is axis A, and axis B
keeps its own bar that is never summed with the parity bar, per ticket 11. And
the numbers in tickets 40 to 45 are counted against a 451-pair seed list that
step 03 took to **816** on 2026-08-10, so every one of them must be re-stated when
the stream restarts.

When it restarts: **land ticket 39 alone.** It is the class vocabulary and every
other ticket reads it, so two lanes that both widen it collide in meaning and not
only in text. It must reach 30 classes, because ticket 58 has landed. **Then 42,
43, 44 and 45 are four independent classifiers, and they are four lanes with four
numbers.**

| ticket | what | touches |
| --- | --- | --- |
| 39 | Class vocabulary axes | `compare` **alone**, first |
| 40 | Coverage, missing pages | `compare` |
| 41 | Coverage matrix, bulk mute | `web` |
| 42 | Untranslated text | `compare` |
| 43 | Alt language and meta | `compare` |
| 44 | Heading outline shape | `compare` |
| 45 | Images across stores | `compare` |

Ticket 44 is also the nearest owner for spec 32's user story 24: pages whose
first heading is not an h1 (11 pages), and pages with no h1 (3).

---

## Not work

- **32** and **50** are the two specs. `50` holds no user story; it is a
  measurement and a rule. `32` holds stories 1 to 55.
- **`PRD.md`** holds stories 1 to 49.

---

## The gate between every step

```powershell
npm test
node compare/measure.mjs nl
```

A step that adds no rule must not move a number. This check found every real
defect in the project so far.

**`measure.mjs` answers from `data/`, so it is not a gate until step 05b runs.**
Ticket 67 changed the extractor and left the reports as they were. Until the crawl
runs again, the second command reads a corpus the code cannot reproduce, and "the
number did not move" would prove only that nothing re-read the site.

**The baseline is 512 tests green in 22 files, 0 failing**, measured on 2026-08-10
after commit `79b9985`. Ticket 56 took it from 472 to 507 and ticket 67 added 5.
Ticket 54 took it from 452, and ticket 55 added none: it
runs the pipeline the earlier tickets built and adds no rule. It is worth
stating because it was not true until that day: `crawl/sitemap-extract.test.mjs`
failed on every Windows checkout. The committed evidence is compared byte for
byte, `core.autocrlf=true` rewrote the working copy to CRLF, and the bytes on
disk stopped being the bytes the reduction gives. `.gitattributes` pins `data/`
to LF. A red suite that everyone learns to ignore is how the next real defect
gets through.

The full pipeline, when a step needs fresh data:

```powershell
node crawl/21-crawl-store.mjs nl   # about 2 min for each store, --force to crawl again
node compare/link-status.mjs       # no store. It refuses one, it writes one file
node compare/30-compare.mjs
node compare/measure.mjs nl
Set-Location web
npm run dev                        # or npm run build
```

Crawl each of `nl be be_fr de fr uk`.

The shell is Windows PowerShell 5.1. `&&` and `||` give a parser error. Use `;`,
or `npm test; if ($?) { node compare/measure.mjs nl }`.
