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

33 items are open. They are not 33 pieces of work.

| kind | count | cost |
| --- | --- | --- |
| Build tickets, agent-ready | 19 | about 10 sittings |
| Close or fold in triage | 4 | **done, session 1** |
| Human decisions | 4 | minutes each |
| Deferred, blocked by other tickets | 4 | none yet |
| Opened by the review of ticket 38 | 2 | **triaged, both build in session 2** |

## The order, and why

1. **Housekeeping.** It costs no crawl. It removes four items and unblocks
   three.
2. **Spec 50, the gate.** It takes the seed list from 451 pages to about 800.
   Almost every other open ticket is measured against that list. Run it first
   or measure everything twice.
3. **Ticket 58, the head check.** It re-crawls all six stores. It must run
   alone.
4. **Axis B.** There are no axis-B classes in the vocabulary today.
5. **Debt and decisions.**

Grillings are conversations. They touch no data. Run them beside a crawl.

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
- **59 and 60 are `ready-for-agent`, session 2.** 59 refuses the store argument.
  60 names the filename shape in `compare/contract.mjs` and keeps the filename.
- **Three blocking edges recorded**: 16 by 55, 20 by 22 and 55, 48 by 37.
- `map.md` agrees.

**Ticket 13 is decided and built. Two human steps are left — see below.**

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
- 59-link-status-overwrite.md — link-status.mjs erases the other stores.
  Recommendation: ready-for-agent, session 2, because session 3 and session 5
  both run that script and session 5 is the 1,600-request crawl. Triage picks
  between refusing the store argument and merging the file. Merging needs an
  answer about per-target staleness, so refusing is the cheaper call.
- 60-report-filename-in-the-contract.md — <store>__<page>.json is crawl-to-web
  data that web/ parses and compare/contract.mjs does not name. Decide it
  BEFORE spec 50: that spec takes the seed list from 451 to about 800 pages, so
  it multiplies the files this shape names. Reading the store out of each JSON
  instead costs the payload win of ticket 38, so that option needs the
  measurement first.

BLOCKING EDGES:
- 16-new-site-page-discovery.md — Blocked by: 55
- 20-one-sided-pages-checklist.md — Blocked by: 22, 55
- 48-open-and-done-board.md — Blocked by: 37

Update map.md to agree.

The 51-to-58 rename is DONE already, in both the file name and every reference.
Do not redo it. The three remaining "51" references in map.md are the seed
ticket 51-runnable-tracked-seed-pipeline.md and are correct.
```

### Ticket 13: two steps at a dashboard

Decided on 2026-08-07: **the plan stays free**, and a daily GitHub Action writes
one row to a `keepalive` table. Pro was refused. The code is committed. Three
things need a human, and nothing works until all three are done.

1. **Get the workflow onto `main`.** GitHub runs a `schedule` **only** from the
   default branch, and it shows `workflow_dispatch` only for a workflow that is
   on the default branch. On a feature branch the keep-alive does not appear in
   the Actions tab at all. This is a second quiet way for it to never start.
2. **Apply the table.** Supabase → SQL editor → run `supabase/keepalive.sql`.
   Run **that file**, not `schema.sql`: `schema.sql` begins with
   `drop table overrides` and would delete the override log.
3. **Add two repository secrets.** GitHub → Settings → Secrets and variables →
   Actions:
   - `PUBLIC_SUPABASE_URL` — Project Settings → API → Project URL
   - `PUBLIC_SUPABASE_ANON_KEY` — the **anon public** key. Never the
     `sb_secret_…` one.

   The same two values are in `web/.env.local`. They are not secret — the key is
   baked into the static build — but a secret makes a rotation one field.

Then run **Actions → Supabase keep-alive → Run workflow**. A green run means the
insert works. It does **not** mean the cron works: ticket 30 unblocks only after
a **scheduled** run has written a row, which is the next morning.

**If the project is ever paused anyway**, and it can be — see below — open the
Supabase dashboard and press **Resume project**. It takes a few minutes and the
data is intact. A paused free project stays restorable for **up to a year**.

Two things this does not fix, both accepted, not solved:

- **GitHub disables a scheduled workflow after 60 days with no repository
  activity.** It sends an e-mail and does not fail. So the keep-alive can stop
  as quietly as the fault it prevents.
- Nothing prevents a lost network or a Supabase outage.

For all three, the detection is the same, and it is built already. A failed
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

Build 59 before session 3. Session 3 and session 5 both run
`compare/link-status.mjs`, and today the wrong argument silently erases every
other store's link statuses.

Gate: `npm test` is green, `npm run build` builds 455 pages, and no number
moves. It is a move, not a change of behaviour.

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

## At any time — the two grillings that remove work

These are conversations. They touch no data. Run them while a crawl runs.

### Ticket 27, the category grid

```
/clear
```

```
/grilling .scratch/content-parity-log/issues/27-category-page-product-listings.md
```

**Do this one early.** 17 pages carry 2,838 shown findings. That is 33% of
everything shown. The decision is about a rule, not about the data, so spec 50
does not change it.

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
node compare/link-status.mjs       # give it NO store, it writes one global file
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
| 13 | Supabase pause | session 1 | **decided and built** — three human steps below |
| 30 | Wire Supabase | after 13 | you, one click, once a scheduled run has landed |
| 47 | Shared keys layering | session 2 | `/implement` |
| 59 | link-status erases the other stores | session 2 | **triaged** → `/implement` |
| 60 | Report filename in the contract | session 2 | **triaged** → `/implement` |
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
| 27 | Category page grid | any time, early | `/grilling` |
| 25 | fotogalerij | any time | `/grilling` |
| 34 | Position, the deep link | last | `/grill-with-docs` |
| 31 | Bulk dismissal | last | `/implement` |
| 16 | New site page discovery | after 55 | `/triage` — edge recorded |
| 20 | One-sided pages | after 22 and 55 | `/grilling` — edge recorded |
| 48 | Task board | after 37 | `/triage` — edge recorded |
| 32, 50 | The two specs | not work | none |
