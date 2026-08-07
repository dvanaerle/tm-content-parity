# Runbook: how to work the open tickets

Written 2026-08-07, from the triage of the open tail. It gives the order, the
sessions, and the exact commands.

`map.md` stays the map. This file says **in which order to work it**, and
nothing more. If the two disagree, the map wins.

## The rule this order comes from

Tickets batch up to a **measurement gate**. Batch freely inside a gate. Never
batch across one.

Spec 32 shows why. Phase 1 had to be measured before phase 2 started. The
directional split and the two new classes moved the count in opposite
directions. One number would have hidden both.

## The state today

Session 2 is complete, so 23 items were open. The grilling of the content unit added
**10** and resolved ticket 27. So 33 items are open, and they are not 33 pieces of
work.

| kind | count | cost |
| --- | --- | --- |
| Build tickets, agent-ready | 19 | about 10 sittings |
| Close or fold in triage | 4 | **done, session 1** |
| Human decisions | 4 | minutes each — **13 is decided and applied** |
| Deferred, blocked by other tickets | 4 | none yet |
| Opened by the review of ticket 38 | 2 | **done, session 2** — 59 and 60 both landed |
| Opened by the grilling of the content unit | 10 | about 4 sittings, sessions 2A to 2D — **62 landed** |

**Two facts decide what can start today.**

The new environment answers HTTP 500 on all six `valantic*` hosts. No crawl and no
re-check can run, so any ticket that changes **extraction** cannot be measured. The
repository keeps no raw HTML — an extract holds the text and not the markup — so
there is no way to re-extract from what is on disk.

Three of the ten tickets need no crawl. Ticket 62 changes the comparison only, so it
is measured by running the compare stage over the extracts already in `data/`.
Ticket 66 is a rename and no number may move. Ticket 65 reads Supabase. Those three
are session 2A and they can start now.

**62 is done**, and it proved the plan: no crawl, and the compare stage over the
extracts on disk gave the whole measurement. **66 and 65 are done as well, so
session 2A is complete.**

**The corpus total moved.** It is **34,559 findings, 23,570 shown**, over the same
448 pages. Every number below that was measured against 34,910 and 23,961 is a
baseline from before 62.

## The order, and why

1. **Housekeeping.** It costs no crawl. It removes four items and unblocks
   three.
2. **The content unit, sessions 2A to 2D.** They remove noise, and they go before
   spec 50 — see below.
3. **Spec 50, the gate.** It takes the seed list from 451 pages to about 800.
   Almost every other open ticket is measured against that list. Run it first
   or measure everything twice.
4. **Ticket 58, the head check.** It re-crawls all six stores. It must run
   alone.
5. **Axis B.** There are no axis-B classes in the vocabulary today.
6. **Debt and decisions.**

Grillings are conversations. They touch no data. Run them beside a crawl.

### Why the content unit goes before spec 50

It looks like a contradiction: spec 50 is the gate, and almost everything is measured
against its page list. The exception is written into spec 50 itself. **The NL baseline
must not move** — 133 of its 181 rows are in the new set, 48 are carried over, and
none are new.

So `nl` is invariant across spec 50, and `node compare/measure.mjs nl` is the gate for
every one of these ten tickets. A number measured on `nl` before spec 50 is still true
after it. Nothing is measured twice.

Two things are bought by going first. Session 5 is the large crawl, about 1,600
requests, and it bakes the new extraction rules in for free instead of needing a
rebuild for each of them afterwards. And the largest single win in the project —
2,698 findings, 7.7% of the corpus — stops waiting behind three spec sittings.

**One rule holds inside these sessions as everywhere else: one ticket, one gate.**
Ticket 67 moves the count in both directions at once. It removes the one-sided rows
that a dropped paragraph caused, and it adds copy differences that a markup difference
was hiding. Batched with 63 or 64, one number would hide all three effects.

---

## Before session 1: done on 2026-08-07

Two files were numbered `51`. The seed ticket keeps the number, because spec 50
names it. The meta ticket is now `58`.

```powershell
Move-Item .scratch\content-parity-log\issues\51-axis-a-meta-check.md .scratch\content-parity-log\issues\58-axis-a-meta-check.md
```

The references were corrected at the same time: the heading of the moved file,
and four lines in `map.md` (502, 600, 844, 853). The three remaining `51`
references in `map.md` (683, 687, 691) are the seed ticket and are correct.
`21-axis-a-meta-check.md` holds no reference to the file name.

The review of ticket 38 was acted on in commit `837d5b8`, after this file was
first written. Seven findings were fixed, and two became tickets 59 and 60. The
condition for "this store has this page" now lives in one place,
`crawl/seed-rows.mjs`, and both the crawler and the web build read it. Spec 50
rewrites the seed list, so that is the file its new rule belongs beside.

**Nothing is left to do here. Start at session 1.**

---

## Session 1 — Housekeeping — DONE on 2026-08-07

The triage below was applied. What it did:

- **10 and 12 are resolved.** Both were built and neither ticket said so.
- **49 is `wontfix`**, and it moved to `issues/.out-of-scope/`, which is new. That
  folder holds `wontfix` tickets and each one states its re-open trigger. 49's
  trigger is ticket 55, which takes be_fr from 29 pages to about 110.
- **22 is `folded`**, not closed. Its criteria are in 53 (measure `prodStatus` and
  `prodRedirect`, clear the stale flags) and in 51 (use the shared maintenance
  guard instead of the generator's private copy).
- **59 and 60 are resolved, session 2.** 59 refuses the store argument. 60 names
  the filename shape in `compare/contract.mjs` and keeps the filename.
- **Three blocking edges recorded**: 16 by 55, 20 by 22 and 55, 48 by 37.
- `map.md` agrees.

**Ticket 13 is decided, built and applied.** One check is left on the next day.

No crawl. About 30 minutes.

```
/clear
```

```
/triage

Apply this triage outcome to .scratch/content-parity-log/issues/. It is
verified against the code already. Do not investigate again. Apply it.

CLOSE as resolved, each with a pointer to the code that built it:
- 10-recheck-service.md — built by ticket 29: api/server.mjs (POST
  /api/recheck/<store>/<page>, /api/health, serves dist/), npm start in
  package.json, feature detection in web/src/lib/recheck.mjs:16.
- 12-variant-a-seven-tabs.md — answered by ticket 36. Diff is no longer a tab.
  Record the one remnant: whether the dashboard wants a sitemap tree. It is
  dropped unless somebody asks for it.

CLOSE as wontfix:
- 49-be-fr-shared-host-blind-spot.md — 14 anchors, 13 of them /media/ files,
  and 1 page link to /blog, which is out of scope. Create .out-of-scope/. It
  does not exist yet. Add the re-open trigger: spec 50 takes be_fr from 29 to
  about 110 pages, so run the probe again after ticket 55.

FOLD. Do not close:
- 22-remeasure-prod-status.md — move its two criteria into
  53-every-content-page-in-the-seed-list.md: measure prodStatus and
  prodRedirect during the rebuild, and clear the stale prodMaintenance flags.
  Add to 51-runnable-tracked-seed-pipeline.md: the generator must use
  maintenanceReason() and MaintenanceError from crawl/fetch-page.mjs. Today it
  uses its own raw fetch and a local regex at crawl/10-store-seeds.mjs:164-183.
  Mark 22 as folded. Point at both tickets.

TRIAGE, both opened 2026-08-07 by the review of ticket 38 and both
needs-triage. Neither is in the order above yet. Give each a label and a
session:
- 59-link-status-overwrite.md — **resolved 2026-08-07**. Triage took refusal over
  merging, and the script now exits 2 on any argument. Nothing is left to triage.
- 60-report-filename-in-the-contract.md — **resolved 2026-08-07**. Triage kept
  the filename and named its shape in the contract. reportFilename() and
  storeOfFile() are in compare/contract.mjs, so the __ separator is written
  once. Nothing is left to triage.

BLOCKING EDGES:
- 16-new-site-page-discovery.md — Blocked by: 55
- 20-one-sided-pages-checklist.md — Blocked by: 22, 55
- 48-open-and-done-board.md — Blocked by: 37

Update map.md to agree.

The 51-to-58 rename is DONE already, in both the file name and every reference.
Do not redo it. The three remaining "51" references in map.md are the seed
ticket 51-runnable-tracked-seed-pipeline.md and are correct.
```

### Ticket 13: applied on 2026-08-07

Decided: **the plan stays free**, and a daily GitHub Action writes one row to a
`keepalive` table. Pro was refused.

All three human steps are done. The workflow is on `main` (commit `b6dcf01`,
which carries only the workflow and `supabase/keepalive.sql`), the table and its
insert policy are applied, the two repository secrets are set, and a manual
**Run workflow** finished green. So the insert works from end to end: the
secrets are readable, the `anon` role can insert under the policy, and PostgREST
accepts the empty-object insert.

**One check is left, on the next day.** A green manual run proves the insert. It
does not prove the cron. Open Actions and confirm that a **scheduled** run has
written a row. The schedule is `17 4 * * *` UTC and GitHub runs it when it can,
so one or two hours late is usual and is not a fault. **Ticket 30 unblocks
then**, not before.

Nothing else in this runbook waits on it. Session 2 can start now.

**If the project is ever paused anyway**, and it can be — see below — open the
Supabase dashboard and press **Resume project**. It takes a few minutes and the
data is intact. A paused free project stays restorable for **up to a year**.

Two things this does not fix, both accepted, not solved:

- **GitHub disables a scheduled workflow after 60 days with no repository
  activity.** It sends an e-mail and does not fail. So the keep-alive can stop
  as quietly as the fault it prevents.
- Nothing prevents a lost network or a Supabase outage.

A pause, a lost network and an outage look the same to an editor, and the
detection for all three is the same. It is built already. A failed
write tells the editor: `overrides/supabase.mjs:106` throws,
`web/src/lib/overrides.mjs:110` writes to local state only after the insert
resolves, `canWrite` makes the controls read-only rather than dropping clicks,
and `LogBanner` shows the error.

---

## Session 2 — Ticket 47, the layering ADR, and the two review tickets

Do this before spec 50 changes `crawl/`. All three are about where code lives,
none of them crawls, and spec 50 rewrites the files they touch.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/47-shared-keys-layering.md
```

Then, if triage made them ready-for-agent in session 1:

```
/implement .scratch/content-parity-log/issues/59-link-status-overwrite.md
```

```
/implement .scratch/content-parity-log/issues/60-report-filename-in-the-contract.md
```

59 is done: `compare/link-status.mjs` refuses an argument and exits 2, so the
call that erased every other store's link statuses cannot be typed. Session 3
and session 5 both run that script.

60 is done as well: `reportFilename()` and `storeOfFile()` live in
`compare/contract.mjs`, and spec 50 can multiply the report files without
multiplying the places the `__` separator is written.

Gate: `npm test` is green, `npm run build` builds 455 pages, and no number
moves. It is a move, not a change of behaviour.

---

## Session 2A — The three that need no crawl

**Start here today.** The new environment is down, and none of these three touches it.
**All three have landed**: 62, then 66, then 65. Session 2A is complete.

### Ticket 62 — DONE on 2026-08-07

`classifyPair()` hands a pair of equal `norm` strings to `classifyExactPair()`, so
the tier-2 classifier names a visible difference only when there is one. `casing`
was its first test.

No crawl was needed, exactly as planned. The compare stage over the extracts on disk
gave every number, before and after.

| | before | after |
| --- | --- | --- |
| findings | 34,910 | **34,559** |
| shown by default | 23,961 | **23,570** |
| `casing` | 662 | **271** |

391 findings were the defect, all of them shown. 351 disappear and **40 become
`tag-changed`** — equal text in a tag that moved, which the phantom finding hid.
`/downloads` is clean on nl and uk. The two `casing` findings left on that page
across the six stores are real letter-case differences, on be and de.

Two things came out of it. `heading-level` is **not** reachable from tier 2, because
`mayPair()` holds a leftover pair to one `kind` and one heading level; the ticket's
second criterion is met by `tag-changed` alone. And **391 finding ids leave the log**,
so an override keyed on one is an orphan — ticket 65 counts them, and that count is
now 391 larger.

Nothing is left to do here. 66 and 65 are next.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/66-rename-text-element-to-content-unit.md

A rename and nothing else. TextElement becomes ContentUnit. Read
docs/adr/0002-content-unit-is-the-editable-block.md and CONTEXT.md first: both are
written already, and the code must agree with them.

Gate: every count and every finding id is identical before and after. If a number
moves, behaviour came in with the rename and must come out.
```

Then ticket 65, which is a measurement and not a build:

```
/clear
```

```
/implement .scratch/content-parity-log/issues/65-count-the-overrides-the-fold-detaches.md

Read Supabase. Count the live overrides that sit on a unit the fold will change, and
the page reviews that will go stale, per store. Write the numbers into ticket 67.

If Supabase is not reachable, say so in the ticket and stop. Do not estimate. A
wrong number here would be quoted later as measured.
```

### Ticket 65 — DONE on 2026-08-07

**One dismissal.** Supabase answered, and the whole log is 45 events, 14 keys and
**5 live overrides**: all dismissals, all on `nl`. 1 detaches, 3 hold, and 1 is
detached already by an edit on the new site. **No page review is live**, in any
store, so the fold makes none stale. Ticket 62's 391 lost ids orphaned **0** live
overrides — that number counts findings, not judgements.

`crawl/probes/probe-fold-detachment.mjs` is the measurement and it is one command.
**Session 2C runs it again on its own day, before it touches the extractor**: the
table is written to daily and it grew by two events while this was measured, and
the probe holds a copy of today's extraction rule, so a run after the fold
measures nothing.

**Session 2C now has ticket 65's number**, and the note is drafted at
`notes/2026-08-07-the-fold-and-your-judgements.md`.

---

## Session 2B — The invisible characters, and the regions

Needs the new environment. Three tickets, **three gates**. Do not batch them.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/61-tier-one-normalisation-gaps.md

Tier 1 folds invisible equivalence, and three characters a browser never draws are
outside it. This changes extraction, so it needs a crawl.

Gate: crawl nl, compare, measure. The findings these characters caused are gone and
no other count moves.
```

```
/clear
```

```
/implement .scratch/content-parity-log/issues/63-regions-excluded-at-extraction.md

This resolves ticket 27, which is already answered in the ticket file. Read that
answer and docs/adr/0003-regions-are-excluded-at-extraction.md. Do not decide it
again.

The size cap is not a nicety. The obvious wrapper selector on production would have
removed 358 of 359 units on /downloads. An exclusion above 20 content units must
throw.

Gate: the nine phantom text-added rows on each category page are gone, and no page
loses a unit an editor wrote.
```

```
/clear
```

```
/implement .scratch/content-parity-log/issues/64-promo-banner-legacy-only-region.md

The largest single removal in the project: 2,698 findings, on 371 of 448 pages.

The 7.7% was 2,698 of 34,910, and ticket 62 took the corpus to 34,559. Re-measure the
banner count itself as well. Some of the 391 findings ticket 62 removed may have sat
on the banner, so neither the count nor the share carries over.

Two things must not be skipped. The anchor is verified in ALL SIX stores — fr and
be_fr are unverified, because the URLs used while grilling answered 404, which proves
only that they were guessed. Take the real URLs from the seed list. And the coverage
check reports in one line when the entry stops matching, because the anchor is
campaign-specific by construction.

Gate: measure nl, and report the count for every store separately.
```

---

## Session 2C — The fold

The big one. It rebuilds every report and it detaches overrides.

Blocked by 66 (session 2A). Needs ticket 65's number before it ships.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/67-a-content-unit-folds-its-inline-links.md

Read docs/adr/0002-content-unit-is-the-editable-block.md first. The decision and the
rejected alternatives are recorded there and are not reopened.

Measure it TWICE and report the two numbers separately. It removes the one-sided rows
that a discarded paragraph caused, and it adds copy differences that a markup
difference was hiding. One number would hide both.

The checkable output: the /overkapping paragraph is one unit on each side, and the
6063-T6 against 6036-T6 difference is reported. That defect is invisible today.

Ticket 65 gave the number on 2026-08-07: **one dismissal detaches, no page review
goes stale.** Re-run `node crawl/probes/probe-fold-detachment.mjs` on the day, and
send `notes/2026-08-07-the-fold-and-your-judgements.md` with that day's number in
it.
```

```
/clear
```

```
/implement .scratch/content-parity-log/issues/68-the-content-view-survives-a-folded-unit.md

Nothing clamps a row today, and after 67 one row is 450 to 550 pixels tall on a page
of up to 288 rows. Measure first paint on the worst page before and after, and put
both numbers in the ticket.
```

---

## Session 2D — The tail

```
/clear
```

```
/implement .scratch/content-parity-log/issues/69-one-canonical-viewport.md

Measure the residual duplication AFTER ticket 64. The banner is most of it. If what
is left is one label on a category page, say so and close this ticket rather than
build a rule for one label.
```

```
/clear
```

```
/implement .scratch/content-parity-log/issues/70-shared-regions-by-content-hash.md

Blocked by 64 and 67. Measure first: how many differing units are shared across
pages. If the share is small, only the exclusion half ships.

If the measurement shows that most findings are shared-block findings, STOP and say
so. That reorders the roadmap, and it is not this ticket's decision to make quietly.
```

---

## Session 3 — Spec 50, sitting A

The input and the rule.

```
/clear
```

```powershell
git checkout -b spec-50-content-page-discriminator
```

```
/implement Build these three tickets in order, in this one session. They are
one measurement gate.

1. .scratch/content-parity-log/issues/51-runnable-tracked-seed-pipeline.md
2. .scratch/content-parity-log/issues/52-production-page-list-as-evidence.md
3. .scratch/content-parity-log/issues/53-every-content-page-in-the-seed-list.md

Read .scratch/content-parity-log/issues/50-content-page-discriminator.md first.
It is the spec. Ticket 53 now also carries ticket 22's re-measurement of
prodStatus and prodRedirect.

Stop and report the per-store page counts before you commit. They are the
checkable output of this sitting.
```

**Check the counts before session 4.** Compare them against the Magento
store-view grid.

| | expected |
| --- | --- |
| all stores | 451 to about 800 |
| French | 28 to about 110 |
| NL baseline | must not move |

The NL detail: 133 of its 181 rows are in the new set, 48 are in no sitemap and
are carried over, and none are new.

---

## Session 4 — Spec 50, sitting B

French, end to end. This is the go/no-go.

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

This ticket exists so that a design defect costs one store and not six.

---

## Session 5 — Spec 50, sitting C

The rollout.

```
/clear
```

```
/implement Build these two tickets in one session:

1. .scratch/content-parity-log/issues/55-five-stores-show-all-their-pages.md
2. .scratch/content-parity-log/issues/56-an-excluded-page-says-why.md

This is the large crawl, about 1,600 requests. Give compare/link-status.mjs no
store argument. It overwrites one global file, so a run for one store erases
the store before it. If ticket 59 landed in session 2 the script refuses the
argument itself, and this warning is then a reminder and not the only guard.
```

After this sitting:

- Ticket 04 closes.
- Ticket 49 gets its probe again.
- Tickets 16 and 20 come back for triage.
- Ticket 38's counts for each store need a new measurement.

---

## In parallel — ticket 37, in a worktree

Ticket 37 changes `web/` only. It cannot collide with the crawl. Use a second
terminal, at any time after session 2.

```powershell
git worktree add ..\tm-content-parity-37 -b ticket-37-leesweergave
Set-Location ..\tm-content-parity-37\web
npm install
```

Open a new session **in that directory**:

```
/implement .scratch/content-parity-log/issues/37-leesweergave.md
```

---

## Session 6 — Ticket 58, the head becomes a check

It re-crawls all six stores. Nothing else may run against `data/`.

```
/clear
```

```
/implement .scratch/content-parity-log/issues/58-axis-a-meta-check.md

Read 21-axis-a-meta-check.md first. It holds the decisions.

This re-crawls all six stores, so nothing else may run against data/ at the
same time. Measure it TWICE and report the two numbers separately. Excluding
no-route removes about 150 findings, and the meta classes add about 130. One
number would hide both.
```

---

## Sessions 7 to 9 — Axis B

All 21 classes in the vocabulary are axis A today. There are no coverage
classes at all. Ticket 11 holds every rule.

### Session 7

```
/clear
```

```
/implement Build both tickets in one session. They are the prefactor and the
tracer bullet.

1. .scratch/content-parity-log/issues/39-class-vocabulary-axes.md
2. .scratch/content-parity-log/issues/40-coverage-missing-pages.md

Ticket 11 (11-axis-b-coverage.md) holds every rule. Ticket 39 must reach 30
classes, because ticket 58 has landed.
```

### Session 8

```
/clear
```

```
/implement Build both tickets in one session:

1. .scratch/content-parity-log/issues/41-coverage-matrix-bulk-mute.md
2. .scratch/content-parity-log/issues/45-images-across-stores.md
```

### Session 9

```
/clear
```

```
/implement Build these three tickets in one session:

1. .scratch/content-parity-log/issues/42-untranslated-text.md
2. .scratch/content-parity-log/issues/43-alt-language-and-meta.md
3. .scratch/content-parity-log/issues/44-heading-outline-shape.md

Ticket 44 is also the nearest owner for spec 32's user story 24: pages whose
first heading is not an h1 (11 pages), and pages with no h1 (3).
```

---

## At any time — the grilling that removes work

A conversation. It touches no data. Run it while a crawl runs.

### Ticket 27, the category grid — DONE on 2026-08-07

Resolved by the grilling of the content unit. **A category page stays in the log and
the grid leaves it as a region.** The ticket's own objection decided where: the extract
carries no DOM path, so the exclusion runs at extraction and a check stays ignorant of
regions.

The grilling went well past the question. It found that the leaf rule discards a whole
paragraph when one inline link sits in it, that production hides 614 words in tags the
extraction never read, and that the promo banner alone makes 7.7% of the corpus. Ten
tickets came out of it, 61 to 70, in sessions 2A to 2D. Two ADRs hold the decisions.

Nothing is left to do here. Ticket 63 builds it.

### Ticket 25, fotogalerij

```
/grilling .scratch/content-parity-log/issues/25-fotogalerij-worst-case-page.md
```

It needs a person who knows what the gallery was to become. Ticket 36 proved
that the view holds at 401 findings. Only "defect or redesign" is left.

---

## Last — the debt

### Ticket 34, the deep link

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

### Ticket 31, bulk dismissal

```
/clear
```

```
/implement .scratch/content-parity-log/issues/31-bulk-dismissal.md

Do the measurement first. The ticket says the measurement can make this ticket
empty.
```

### Then triage again

Tickets 16, 20 and 48 come back when their blockers land.

---

## The gate between every session

```powershell
npm test
node compare/measure.mjs nl
```

A phase that adds no rule must not move a number. This check found every real
defect in the project so far.

The full pipeline, when a session needs fresh data:

```powershell
node crawl/21-crawl-store.mjs nl   # about 2 min for each store, --force to crawl again
node compare/link-status.mjs       # no store. It refuses one, it writes one file
node compare/30-compare.mjs
node compare/measure.mjs nl
Set-Location web
npm run dev                        # or npm run build
```

Crawl each of `nl be be_fr de fr uk`.

## A note on the shell

The commands here are Windows PowerShell 5.1, which is the shell in this
environment.

`&&` and `||` do not work. They give a parser error. To run two commands, put
them on two lines, or separate them with `;`. To run the second command only
after the first one succeeds:

```powershell
npm test; if ($?) { node compare/measure.mjs nl }
```

`ls`, `cd` and `cat` are aliases and they work. `head`, `tail`, `which` and
`touch` do not exist.

---

## The full list

| # | ticket | where | skill |
| --- | --- | --- | --- |
| 10 | Re-check service | session 1 | **done** — resolved |
| 12 | Variant A tabs | session 1 | **done** — resolved |
| 49 | be/be_fr blind spot | session 1 | **done** — wontfix, `.out-of-scope/` |
| 22 | Re-measure prod status | session 1 | **done** — folded into 53 and 51 |
| 13 | Supabase pause | session 1 | **done** — applied, one green run, cron unproven |
| 30 | Wire Supabase | after a scheduled run | you, one click |
| 47 | Shared keys layering | session 2 | **done** — ADR 0001, `shared/keys.mjs` |
| 59 | link-status erases the other stores | session 2 | **done** — the script refuses an argument and exits 2 |
| 60 | Report filename in the contract | session 2 | **done** — the shape is in `compare/contract.mjs` |
| 62 | Two identical units make no finding | session 2A | **done** — 391 phantom `casing` findings gone, no crawl |
| 66 | Rename to `ContentUnit` | session 2A | **done** — 0 of 448 reports differ |
| 65 | Count the overrides the fold detaches | session 2A | **done** — 5 live overrides, **1** detaches, 0 reviews |
| 61 | Tier-1 invisible characters | session 2B | `/implement` — needs the new site |
| 63 | Regions excluded at extraction | session 2B | `/implement` — resolves 27 |
| 64 | The promo banner, 7.7% | session 2B | `/implement` — after 63 |
| 67 | A content unit folds its links | session 2C | `/implement` — after 66, needs 65 |
| 68 | The content view survives a fold | session 2C | `/implement` — after 67 |
| 69 | One canonical viewport | session 2D | `/implement` — after 64 |
| 70 | Shared regions by content hash | session 2D | `/implement` — after 64 and 67 |
| 51 | Runnable seed pipeline | session 3 | `/implement` |
| 52 | Production page list | session 3 | `/implement` |
| 53 | Every content page | session 3 | `/implement` |
| 54 | French store | session 4 | `/implement` |
| 55 | Five stores | session 5 | `/implement` |
| 56 | An excluded page says why | session 5 | `/implement` |
| 04 | Six store page lists | closes with 55 | none |
| 37 | Leesweergave | worktree | `/implement` |
| 58 | Head becomes a check | session 6 | `/implement` |
| 39 | Class vocabulary axes | session 7 | `/implement` |
| 40 | Coverage, missing pages | session 7 | `/implement` |
| 41 | Coverage matrix | session 8 | `/implement` |
| 45 | Images across stores | session 8 | `/implement` |
| 42 | Untranslated text | session 9 | `/implement` |
| 43 | Alt language and meta | session 9 | `/implement` |
| 44 | Heading outline shape | session 9 | `/implement` |
| 27 | Category page grid | any time, early | **done** — resolved, built by 63 |
| 25 | fotogalerij | any time | `/grilling` |
| 34 | Position, the deep link | last | `/grill-with-docs` |
| 31 | Bulk dismissal | last | `/implement` |
| 16 | New site page discovery | after 55 | `/triage` — edge recorded |
| 20 | One-sided pages | after 22 and 55 | `/grilling` — edge recorded |
| 48 | Task board | after 37 | `/triage` — edge recorded |
| 32, 50 | The two specs | not work | none |
