# Worklist: every open ticket, in the order to build it

Written 2026-08-10. One step for each open ticket, from the first to the last.

This file answers one question: **what do I do next?** `RUNBOOK.md` says *why*
the order is what it is, and `map.md` stays the map. If this file and the map
disagree, the map wins.

**45 of the 90 tickets are closed.** 34 steps are below. Seven tickets are
parked and they are at the end.

## How to use it

Work the steps from the top. Each step is one sitting.

- **`/clear` between every step.** The next ticket is self-contained.
- **One ticket, one gate.** Never batch two tickets that move the same number in
  opposite directions. Step 03 and step 04 are the one exception, and the step
  says why.
- **After every step:** `npm test`, then `node compare/measure.mjs nl`. A step
  that adds no rule must move no number.
- **Before a `data` step:** check that the six `valantic*` hosts answer. On
  2026-08-07 they all answered HTTP 500. That is a measurement, not a memory.
- Tick the box when the ticket file says `Status: resolved`.

**touches** says which shared resource the step writes. `data` runs alone.
`compare` needs its own copy of `data/` if it runs in a worktree. `web` and
`read` and `talk` collide with nothing.

---

## Step 00 — Housekeeping. Two loose ends before any ticket

Neither is a ticket. Both are uncommitted work that can be lost.

### 00a — Commit the runbook revision

`.scratch/` is under version control in this repo. The 2026-08-10 revision of
`RUNBOOK.md` is still only in the working tree.

```powershell
git add .scratch/content-parity-log/RUNBOOK.md .scratch/content-parity-log/WORKLIST.md
git commit -m "The runbook is revised, and the worklist gives the order"
```

### ☐ Step 01 — Ticket 88, the mute says what it hides

**FIRST, and out of dependency order.** touches `web`. Blocked by nothing.

**Why now.** The largest press available today hides 173 findings, asks for no
reason and records no section, and it persists for ever. Ticket 65 counted the
table: 45 events, 14 keys, 5 live overrides, all dismissals, **no live mute in
any store**. The table is append-only, so a mute written under the old key can
never be repaired, only superseded. The migration is free today and impossible
on the day an editor presses the button.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/88-the-mute-says-what-it-hides.md

Read docs/adr/0008-the-mute-key-carries-the-anchor-heading.md first. Every rule
is there and none of them is reopened.

The heading goes in the mute key and NOT in the finding id. Ticket 34 kept it out
of the id and out of the grouping key, and this ticket does not change that. A
mute may drift when a heading changes; an id may not.

Record how many live mutes existed before the change. If it is still zero, say
so, because that is what made the change free.
```

**Gate.** On `nl__terrasoverkapping` the pair `(text-missing, «Gumax® Heavy
Duty»)` covers **64 of 88** and must leave **24** visible. The page-wide form
still works on `nl__fotogalerij/zonwering`, where the section form offers 239
groups.

---

### ☐ Step 02 — Ticket 54, the French store shows all its pages

touches `data` **alone**. Blocked by 53 — **done**.

**Why now.** This is the go/no-go for spec 50. It exists so that a design defect
costs one store and not six. It also carries the identity change merged in from
ticket 57.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/54-french-store-shows-all-its-pages.md

This ticket is French end to end, and it is the go/no-go for the spec. It also
carries the identity change from 57-retire-the-nl-url-key-assumption.md, which
was merged into it. A page that has a Dutch url key keeps its current string,
byte for byte. The override table is append-only, so a reformatted key could
never be repaired.
```

**Gate.** The French dashboard shows about **126** pages, not 28. Navigation and
footer coverage reaches **88%**, from 40%.

---

### ☐ Step 03 — Ticket 55, the other five stores

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

**Gate.** The **NL baseline does not move** — still 181 pages, identical to
ticket 38's numbers. The store total goes from 451 pairs to about **800**.

---

### ☐ Step 04 — Ticket 56, an excluded page says why

touches `web`. Blocked by 54. **Same sitting as step 03.**

**Why batched.** The runbook batches 55 and 56 in one session, and it is allowed
here because 56 changes what the dashboard shows and not what the crawl fetches.
It moves no finding count, so step 03's number stays readable.

```
/implement .scratch/content-parity-log/issues/56-an-excluded-page-says-why.md
```

**Gate.** About **60** of the ~800 discovered pages are excluded. Each one names
the rule that excluded it, in a committed list and not in code, and each is still
counted in the store total.

**After steps 03 and 04, four things fall out:**

- Ticket **04** closes.
- Ticket **49** gets its probe again — it is in `issues/.out-of-scope/` and its
  re-open trigger is exactly this.
- Tickets **16** and **20** come back for triage. That is step 33.
- Ticket 38's per-store counts need a new measurement.

---

### ☐ Step 05 — Ticket 67, a content unit folds its inline links

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

### ☐ Step 06 — Ticket 68, the grilling. Three numbers are unchosen

touches `talk`. Blocked by 67.

**Why a grilling and not a build.** Three of the six acceptance criteria carry a
number nobody has chosen: "a cell clamps to about three lines", "a cap for the
genuinely rewritten paragraph", and a first-paint measurement with no target. A
criterion with an unchosen number is a decision, and a decision goes to
`/grill-with-docs`. An agent asked to build this invents all three values, and
the review is then of its taste and not of its work.

```
/clear
```

```
/grill-with-docs .scratch/content-parity-log/issues/68-the-content-view-survives-a-folded-unit.md

Settle the three unspecified numbers: the clamp height, the cap for a rewritten
paragraph, and an acceptable first paint. Name the worst page — tickets 79 and 87
both name nl__fotogalerij/zonwering at 399 findings. Then write all four into the
acceptance criteria.

Nothing clamps a row today, and after 67 one row is 450 to 550 pixels tall on a
page of up to 288 rows.
```

**Gate.** Four numbers are in the ticket file, and each one can be tested.

---

### ☐ Step 07 — Ticket 68, the build

touches `web`. Blocked by step 06.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/68-the-content-view-survives-a-folded-unit.md

Measure first paint on the named page before and after, and put both numbers in
the ticket.
```

**Gate.** A cell clamps to the height chosen in step 06 and carries an expand
control. The worst page holds up to 288 rows and stays scannable.

---

### ☐ Step 08 — Ticket 37, leesweergave

touches `web`. Blocked by 68.

**Why here.** It moved. It was a free `web` lane, and it is not one any more: it
builds view modes onto a content view that ticket 67's fold rewrites and ticket
68 clamps.

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

touches `data`. Blocked by 64 — **done** — and 67, step 05.

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
about **4,055** findings that a hash would judge once instead of 446 times.

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

**The corpus is now settled. Do not re-open it before step 12.**

---

## The re-measurement — steps 12 and 13

Both are research tickets. They write numbers, not features. touches `read`, so
they collide with nothing and they can run beside each other.

**Every number designed against must be re-stated before it is designed against.**
Ticket 55 took the corpus from 451 pairs to about 800, and tickets 64, 67 and 58
each moved the finding count.

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

**Gate.** The class count stays **21**. All **12** shown classes become `work`
and the **9** hidden ones split. **The denominator shows no movement on any
store.** Expect no movement at all.

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

**Gate.** `overrides` has exactly **two** RLS policies: insert for `anon` and
select for `anon`. No update and no delete. The connected bundle is
`_astro/overrides.*.js` at about **228 KB**, against about 11 KB when it is not
connected.

**Ticket 31 cannot ship without this.**

---

### ☐ Step 24 — Ticket 31, one reason, many findings

touches `web`. Blocked by 30, 76, 81 and 88 — steps 23, 12, 22 and 01.

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
before and after show that **nothing else moved**. It is **1,215** shown
findings, 5.3% of shown.

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
criteria are done.

```
/clear
```

```
/grill-with-docs .scratch/content-parity-log/issues/34-position-and-ordering.md

Only the deep link is open. 1,622 of 10,796 findings have no anchor heading, so
they carry no link. Where a link does show, both sides are built from the
PRODUCTION heading, which cannot resolve on the new site where that heading
changed. What a finding with no heading gives instead has never been decided.
```

**Gate.** The ticket says what a finding with no anchor heading links to.

---

### ☐ Step 33 — Triage again: tickets 16, 20, 48 and 04

touches `talk`. Each one waited for a blocker that has now landed.

- **04** — closes with step 03. `Status: reopened` today.
- **16** — blocked by 55, step 03. Its premise needs correcting first: 283
  clusters have no NL member, so ticket 04's "no page exists without an NL
  counterpart" is false.
- **20** — blocked by 22, done, and 55, step 03. Two populations: **34 of 451**
  store-page pairs 404 on the new side, and **42 of 181** NL pages are new-only.
  Only the NL 42 stays stable, so re-size both after step 03.
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

Ticket 49 in issues/.out-of-scope/ also gets its probe again. Its re-open trigger
is 55, which took be_fr from 29 pages to about 110.
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
step 03 takes to about 800, so every one of them must be re-stated when the
stream restarts.

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
