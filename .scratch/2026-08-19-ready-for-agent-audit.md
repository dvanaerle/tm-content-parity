# Audit — every open `ready-for-agent` ticket, 2026-08-19

> **Corrected and frozen, 2026-08-19, by the grilling session over this document.**
>
> This is a **dated snapshot**, not a standing queue. It was overtaken the same day it was
> written, and a hand-written ranking of 26 tickets cannot survive as a live artefact. What
> survives is the `Status:` lines it changed — every verdict below has been written onto the
> ticket it concerns, and **the tickets are the record**. Nothing should cite this file as
> authority; cite the ticket.
>
> **Five entries were already stale when this was written**, all four resolved on this branch
> the same day, and this document missed all four because Appendix B says no code and no `git
> log` was read:
>
> | ticket | ranked here | actually |
> |---|---|---|
> | `gallery` 01 — opening links stop becoming link records | **#1, keep and build it first** | **resolved**, `71a6cea` |
> | `ui-polish` 10 — page details move into a dialog | **#9, keep** | **resolved**, `68205c7` |
> | `ui-polish` 07 — the page header is one quiet line | **close as superseded** | **already resolved** |
> | `cross-store` 01 — measure finding churn | **#3, the gate on the other seven** | **resolved** — see `cross-store-reuse/CHURN.md` |
> | `gallery` 02 — are the gallery photos the same bytes | **#2, keep** | **resolved** — see `gallery-opening-links/BYTES.md` |
>
> So the charge this document lays against ticket 58 — *actively misleading while it stays
> open* — applied to this document within hours. The count of 26 is 26 **issues**; the tree
> also holds 4 PRDs at `ready-for-agent`, and after the five resolutions the real figure is
> **21 issues + 4 PRDs**.
>
> **Three factual claims were wrong and are corrected on their tickets:** ticket 129's *36
> `title` attributes* is **11**, over 9 files; the anti-slop plugin is **2,121** lines, not
> 1,917; and `ui/dialog.jsx` is no longer unused — `Annotate.jsx:13` imports it, because
> `ui-polish` 10 landed. Only `ui/tooltip.jsx` still has zero importers.
>
> **Two things this document could not see, found by reading the tree:** number **138 had been
> issued twice** (renumbered — the parked one is now 140), and **ADR 0024 was never written**;
> it was *reserved* by `cross-store-reuse/04` and that ticket was never started. See
> `docs/adr/README.md`, which now forbids a ticket from reserving an ADR number at all.

**What this is.** Every ticket across all five features that carries
`Status: ready-for-agent` today, with a markdown prototype of what it would put on
screen (or of the answer it would produce, where it is a probe), and a judgement of
what it is worth to us. Written so that the `.out-of-scope` decision can be made off
one document.

**What it is not.** It is not a triage of the whole tracker. Tickets on other statuses
are listed in *Appendix A* without prototypes, so the overview is complete.

**The measuring stick — and its limit.** The three routes below are a **rhetorical frame, not
a test.** They are drawn from `content-parity-log/map.md`, which is the only `map.md` in the
repo; the other four features have their own PRDs and their own goals. The strain shows on the
fourth application: `code-health` 01 only passes by inventing *route 3, applied to us rather
than to the corpus*, and `ui-polish` 10 by inventing *route 3 on attention rather than on
data*. Both are kept on grounds outside the frame, and that is stated rather than dressed up.
Read the per-ticket arguments, which stand on their own; do not read the routes as a derivation.

`map.md`'s destination: *an editor opens any page, sees a
trustworthy list of differences, acts on it, presses Recheck, and watches the count
fall to zero.* So a ticket earns its place by one of three routes:

1. **It removes work that was never work** — noise leaving the backlog.
2. **It removes repetition** — the same decision made once instead of six times.
3. **It makes the log trustworthy** — a defect an editor would otherwise be misled by.

A ticket that only **adds** findings, or that serves a reader nobody has, is on the
list of candidates.

## The count

| feature | open `ready-for-agent` |
|---|---|
| `content-parity-log` | 13 (42, 58, 85, 87, 93, 94, 95, 97, 98, 125, 128, 129, 141) |
| `cross-store-reuse` | 8 (01, 02, 03, 04, 06, 07, 09, 10) |
| `gallery-opening-links` | 2 (01, 02) |
| `ui-polish` | 2 (07, 10) |
| `code-health` | 1 (01) |
| **total** | **26** |

> **Corrected.** Four of these were already resolved when this table was written — `gallery`
> 01, `ui-polish` 07 and 10, and `cross-store` 01. The open figure is **22 issues**, plus the
> four PRDs that should never have carried a triage label at all. The counts by feature are
> `content-parity-log` 13, `cross-store-reuse` 7, `gallery-opening-links` 1, `ui-polish` 0,
> `code-health` 1.

Four PRDs also carry `ready-for-agent` (`code-health`, `cross-store-reuse`,
`language-blocks`, `ui-polish`). A PRD takes no triage role — `content-parity-log/PRD.md`
says so outright. Those four status lines are wrong and should read `spec`; they are not
work and they are not audited below.

---

# 1. `gallery-opening-links`

## 01 — Opening links stop becoming link records

**What it does:** the gallery module's own plumbing stops reading as editor work.
4,089 findings go — about a tenth of everything the log reports.

### Prototype — the gallery page, before and after

```
BEFORE   nl__fotogalerij/zonwering              399 shown findings
─────────────────────────────────────────────────────────────────────
  Link missing   /media/lof/gallery/album/c/a/carport_antraciet.jpg    work
  Link missing   /gallery/carport-antraciet-met-spie                   work
  Link added     /nl/gallery/carport-antraciet-met-spie-2024           information
  Link missing   /media/lof/gallery/album/z/o/zonwering_wit.jpg        work
  Link missing   /gallery/zonwering-wit-uitvalscherm                   work
  ...  × 1,878 detail anchors + 1,900 image anchors, corpus-wide
```

```
AFTER    nl__fotogalerij/zonwering               ~40 shown findings
─────────────────────────────────────────────────────────────────────
  Image missing  zonwering_wit_2019.jpg                               work
  Text changed   "Onze zonwering…" → "Zonwering…"                     work

  Not checked on this page
  ▸ Opening link — an <a> whose target is a photo this page shows.
    The gallery module writes two per photo. Nobody edits either.
    The editorial fact is which photo is on the page; the images
    check owns it.
```

| corpus-wide | before | after |
|---|---|---|
| `Link missing` | 4,750 | ~1,577 |
| `Link added` | 2,897 | ~1,981 |
| findings removed | — | **~4,089** |
| stranded overrides | — | **1** (a `broken-link`) |

### Audit

- **Route 1, at the best ratio in the whole set.** One extraction rule, two predicates,
  ~10% of the corpus gone, one stranded override. Nothing else on this list is close.
- **The cost is stated and bounded:** link checking on image-wrapper anchors is given up.
  That is a check on addresses nobody wrote, so it costs nothing an editor was using.
- **The trap work is already done.** Three cheaper predicates were measured and refused,
  with the false-positive count for each (28 editorial links destroyed by basename
  matching). This ticket is not going to discover its design mid-session.
- **Verdict: ~~keep, and build it first~~ — ALREADY BUILT.** Resolved 2026-08-19 in `71a6cea`,
  *"An opening link is not a link, and the gallery goes quiet"*, with ADR 0026. This audit
  ranked it #1 without noticing it was the commit at the head of the branch the audit was
  written on.

## 02 — Measure whether the gallery photos are the same bytes

**What it does:** an hour-long probe that decides which image check to build — byte
digest or perceptual hash.

### Prototype — the answer it writes

```
## Answer — 2026-08-__, 52 gallery pages, 1,900 prod / 900 new images

                                  album pages   general (4)   404 (6)
  pair by filename (today)              17%            0%         —
  pair by content digest                __%           __%         —

  pair by content, NOT by filename      ___   ← the carport case, wrong today
  pair by filename, NOT by content      ___   ← should be near zero

  Conclusion: build a ____ check.
  Open, not settled here: `tuinkamer` is 30 prod photos against 26 new,
  pairing zero, and they look like different photographs. Re-curated
  album = defect or decision is a content judgement.
```

### Audit

- **Route 3.** Today the log tells a German editor that three of four carport photos
  are missing while all four are the same photographs. That is the log lying in the
  direction an editor notices, which is the expensive direction.
- **Filename matching is on a clock.** The new site is moving to English filenames for
  SEO; when that lands, pairing falls toward zero and ~1,700 wrong image findings appear.
  This probe is the only thing standing between us and that.
- **It is a throwaway probe** with a hard scope limit (gallery pages only) and no
  production code.
- **Verdict: ~~keep~~ — ALREADY RUN.** Resolved 2026-08-19; the answer is
  `gallery-opening-links/BYTES.md`. **Build the byte digest.** Pairing goes from 19.6% by
  filename to **70.3% by content** on the album pages the new site renders, every original is
  `image/jpeg` with no sign of a re-encode, and — the number that settles the design — **not one
  pair matches by filename and differs by content, zero across all 52 pages**. So a perceptual
  hash has no work to do, no threshold has to be chosen or defended, and the digest strictly
  contains what filename matching already finds. **402 of the album pages' 557 content pairs
  match by content but not by filename** — the carport case, reported today as an *Image
  missing* plus an *Image added* that an editor can see are the same photo. The planned English
  rename also stops being a scheduled problem.
  **This changes `cross-store` 02**, which is sequenced after it: a digest pairs a renamed image
  directly, so that ticket's arity-and-position matcher must be re-read before it is built. The
  note is on the ticket.

---

# 2. `code-health`

## 01 — Lint runs on every push

**What it does:** the 15 anti-slop rules and the type-check, which run nowhere, start
deciding whether a branch passes.

### Prototype — the workflow's two outcomes

```
  ✓ checks / lint-and-typecheck            clean branch
    oxlint --deny-warnings .               0 diagnostics, exit 0
    tsc --noEmit                           exit 0

  ✗ checks / lint-and-typecheck            branch with a warning-level violation
    oxlint --deny-warnings .
      web/src/lib/x.mjs:12  warning  no-debugger
      → 1 warning, denied
    exit 1
```

The trap the ticket names: `oxlint` **exits 0 on a warning**. A bare `npm run lint`
would enforce fifteen rules and tick green over every built-in correctness rule.

### Audit

- **Route 3, applied to us rather than to the corpus.** 1,917 lines of local plugin
  implementing 15 rules, plus a `strict: true` tsconfig, and nothing calls either. A
  push that breaks every rule in the set goes green today.
- **It lands green.** Measured 2026-08-18: `oxlint .` and `tsc --noEmit` both emit
  nothing over the tracked tree. So no cleanup precedes it and the workflow does not
  arrive red — which is the usual reason a CI ticket rots.
- **Smallest ticket in the set.** One workflow file, one verification branch.
- **Verdict: keep.** Cheap, and it protects every ticket after it.

---

# 3. `content-parity-log` — the meta chain

Five tickets descend from **58**, which is the umbrella: **93** (the prefactor), **94**
(the extract), **95** (the re-crawl), **97** (the producer), **98** (the panel). 96 has
landed.

## 58 — The head becomes a check *(umbrella)*

### Prototype — what it is now

```
  58  The head becomes a check
      +- 93  no-route leaves the log          ready-for-agent
      +- 94  the extract carries the head     ready-for-agent
      +- 95  re-crawl six stores              ready-for-agent
      +- 96  nine meta classes                resolved 2026-08-14
      +- 97  the producer                     ready-for-agent
      +- 98  the meta tab becomes a checklist ready-for-agent

  Every criterion in 58 now lives in one of the six. Its own numbers are
  stale and its children say so: 58 says no-route emits ~150 findings over
  six stores; 93 measured 85. 58 says meta adds ~130; 97 measured 197.
```

### Audit

- **Not a candidate for `.out-of-scope` — a candidate for `resolved — superseded`.**
  Every rule it carries has been split out, re-measured and in one case corrected. It
  holds no work of its own and its arithmetic is wrong in two places.
- **It is actively misleading while it stays open.** An agent that picks it up builds the
  whole slice in one session, against two stale numbers, in a repo whose rule is one
  ticket per session.
- **Verdict: close it as superseded by 93 to 98.** Bookkeeping, not deprecation.

## 93 — `no-route` leaves the log, and an aborted run writes its failures

### Prototype — the store dashboard, and the abort

```
  Not checked                                          nl
  ---------------------------------------------------------
  no-route     Production's 404 page against the new site's
               404 page. Both sides answer 200, so the status
               gate cannot see it.
```

```
  Run aborts on MaintenanceError
  ---------------------------------------------------------
  BEFORE   data/failures/nl.json holds LAST run's failures.
           The file lies about the run that just happened.
  AFTER    the write moves above the early return, and a test
           pins it - not the order of two statements.
```

| store | findings | work | comparable |
|---|---|---|---|
| all six, before | 40,947 | 22,003 | 722 |
| all six, after | **40,862** | **21,969** | **716** |

### Audit

- **The headline collapsed under measurement, and the ticket says so.** 85 findings, not
  ~150. That is **0.21%** of findings. As a noise-removal ticket it is now marginal.
- **The second half is the real one.** A failure log that describes the previous run makes
  every aborted crawl unreadable - and production has served the maintenance page on 446 of
  451 URLs for a whole session, so an abort is the normal case, not the edge case. That is
  route 3 and it is worth the session on its own.
- **It also unblocks 95**, and 95 unblocks 97 and 98.
- **Verdict: keep** - but re-frame it honestly. It is *the failure log tells the truth*,
  with an exclusion worth 0.21% attached. Do not sell it as the 150-finding prefactor.

## 94 — The extract carries the head, and a stale one refuses to compare

### Prototype — the refusal, which is the point

```
$ node compare/measure.mjs nl

  ExtractVersionError: data/extract/nl__bedrijfsinformatie.json is
  extractVersion 1; this build needs 2. Re-crawl with --force.
```

Without the version marker: a new field yields `undefined`, folds to `null` on **both**
sides, `stateOf()` calls it `same`, and the head panel is **silently green**.

| field | verdict | measured basis (ticket 92) |
|---|---|---|
| `robots` raw string | **add** | `noindex` is a regex test; the string is destroyed today |
| `keywords` | **add** | 356/777 prod page-sides, 224 distinct strings; 54 pages lose it |
| `metaTitle` | **drop** | byte-identical to `<title>` on **1,539 of 1,539** page-sides |

### Audit

- **Route 3, and the sharpest instance of it in the tracker.** *Silently green* is the
  worst shape a defect in this tool can take: the log says clean and the head is broken.
  The version marker guards a whole class of future mistake, not only this one.
- **The field list is measured, not guessed.** 92 already killed one of the two candidate
  fields on a 1,539-of-1,539 count, so the session has no design left to do.
- **Verdict: keep.** Even if the meta *check* were parked, `extractVersion` should ship,
  because every future extractor change carries the same silent-green risk.

## 95 — Re-crawl all six stores with the new head

### Prototype — the log it writes into itself

```
  store   extracts written   run
  -----------------------------------------
  nl      ___                clean / retried
  be      ___                clean / retried
  be_fr   ___                clean / retried
  de      ___                clean / retried
  fr      ___                clean / retried
  uk      ___                clean / retried

  no-route absent from the new extracts:  yes / no
  (the proof that 93's exclusion reached the crawl)
```

### Audit

- **It writes no code.** It exists because a build ticket holds no criterion beginning
  with *re-run*, and because it can abort halfway and needs its own retry budget. That is
  a good reason for a ticket to exist.
- **It is not optional if 94 ships**, because after 94 `measure.mjs` refuses every extract
  on disk. 94 and 95 are one decision.
- **Verdict: keep, welded to 94.** Nothing else may run against `data/` while it does.

## 97 — The producer: one finding per head row

### Prototype — what arrives in the backlog

| class | nl | be | be_fr | de | fr | uk | total |
|---|---|---|---|---|---|---|---|
| `meta-title-changed` | 16 | 17 | 10 | 7 | 10 | 7 | **67** |
| `meta-description-changed` | 27 | 33 | 14 | 14 | 15 | 17 | **120** |
| `meta-casing` | 2 | 2 | 0 | 0 | 0 | 0 | **4** |
| `robots-index-lost` | 0 | 1 | 0 | 1 | 0 | 0 | **2** |
| `robots-noindex-lost` | 1 | 1 | 1 | 0 | 1 | 0 | **4** |
| the four `lost`/`added` classes | 0 | 0 | 0 | 0 | 0 | 0 | **0** |
| **meta findings** | 46 | 54 | 25 | 22 | 26 | 24 | **197** |
| pages with **no** meta row | 86 | 81 | 97 | 107 | 99 | 101 | **571** |

All 197 are `work`. Share of work: **0.90%**. 79% of pages get no meta row at all.

### Audit

- **This is the one ticket on the list whose job is to *add* findings.** 197 rows onto a
  22,003-row backlog nobody can drain. On route 1 or 2 it fails.
- **On consequence per row it passes, but only just.** `robots-index-lost` fires **twice**
  and each one is a page that has left Google. 67 changed titles and 120 changed
  descriptions are SEO-facing text an editor owns and can fix in the named Magento field.
- **The honest justification is the 2 robots findings and the named field, not the count.**
  The ticket's own table shows the share nearly doubling for two reasons that have nothing
  to do with meta - ticket 86 moved 2,846 `heading-level` findings out of `work`, so the
  denominator fell. Read it as 6 severe findings, 191 SEO-text findings, 0 noisy classes.
- **Four dead classes ship anyway** (zero fires). The two-direction pair is argued to be
  mandatory for a one-sided check. Accepted - but note four of the nine classes are
  vocabulary we carry and never see.
- **Verdict: keep, last of the meta chain.** It is the only ticket here I would not defend
  if the backlog were all we cared about. But *a page has left Google and the log cannot
  say so* is not a thing to leave standing.

## 98 — The Meta tab becomes a checklist an editor can tick

### Prototype — the five rows

```
  Meta  (5)                        Production            New site
  ----------------------------------------------------------------------
  Meta Title       [v][...]        Bedrijfsinformatie    Bedrijfsinformatie | Tuinmaximaal
  Meta Keywords                    terrasoverkapping...  terrasoverkapping...
  Meta Description [v][...]        ...beschutting.       ...beschutting
  Robots           [v][...]        index                 noindex
  ----------------------------------------------------------------------
  Display only, not in the counter.
  Canonical                        -                     https://.../bedrijfsinformatie
```

- Labels are **English** on purpose: they name the Magento admin field the editor goes to.
- **No class pill on the row.** With the field fixed and both values side by side, a
  `META-CASING` pill next to `...beschutting.` against `...beschutting` says nothing.
- `uk` is where this looks emptiest: 91 of 121 pairs have keywords on neither side.

### Audit

- **This is where 97's findings become usable.** 97 without 98 is 197 findings with no
  surface, and the dashboard Meta column keeps printing a dash.
- **The design is settled to an unusual depth** - the five-row shape, the inline controls,
  the display-only rule, the English-label rule, the accepted bar distortion, and slice 7
  absorbed from ticket 100. Seven slices, no open questions.
- **Verdict: keep, welded to 97.** The two are one deliverable split for context-window
  reasons; neither is worth shipping alone.

### The meta chain as one decision

```
  93 --+
       +--> 95 --> 97 --> 98
  94 --+
```

Five sittings, one six-store re-crawl, +197 findings, -85 findings, one silent-green class
of defect closed, two pages found to have left Google. **Keep the chain, sequence it after
the gallery work**, and re-frame 93 and 97 on their measured numbers rather than their
written ones.

---

# 4. `content-parity-log` — the rest

## 141 — A difference is ordered by what is left

**What it does:** the repeat list stops leading with finished work.

### Prototype — the same list, re-ordered

```
BEFORE   Differences on nl                    (ordered by pages)
  ---------------------------------------------------------------
  "Bel ons op 040..."          on 30 pages    30 of 30 closed   <- finished
  "Levertijd 4-6 weken"        on 22 pages    22 of 22 closed   <- finished
  "Vanaf 1.299,-"              on  5 pages     0 of 5 closed    <- the work
  "Gratis montage"             on  4 pages     1 of 4 closed

AFTER    Differences on nl                    (ordered by what is left)
  ---------------------------------------------------------------
  "Vanaf 1.299,-"              on  5 pages     0 of 5 closed
  "Gratis montage"             on  4 pages     1 of 4 closed
  "Bel ons op 040..."          on 30 pages    30 of 30 closed
  "Levertijd 4-6 weken"        on 22 pages    22 of 22 closed
```

Nothing is removed. A fully-closed difference stays on screen reading *30 of 30 closed* -
the backlog is not drained, which is ticket 81's own progress-language criterion.

### Audit

- **Route 2, and it is already written down.** Ticket 29 user story 33 asks for exactly
  this - *the worst page is the worst remaining page and not the worst page of last week* -
  and it says **page** because it predates the repeat list. 81 built the list and the story
  never followed it across. This is not a new want; it is an unfinished one.
- **It does not overturn 81**, and the ticket is careful about that. 81's proof (25,657
  repeats, zero exceptions) is about *total* findings and holds at derivation time; it stops
  holding the moment the log closes some of them.
- **In the searched default it is a no-op** - every surviving row has a closed count of
  zero - so the two places it bites are the unsearched list and *Include closed*. The ticket
  says to test that rather than work around it.
- **The one real cost:** `repeatsInStore()` cannot do it, so the order moves to the layer
  where the override log is in scope. That is the same memo the page list already sorts in,
  so the seam exists.
- **Verdict: keep.** Small, already-decided, felt every day.

## 125 — A content cell says which language it is in

**What it does:** a screen reader announces a German paragraph on `/de/` as German.

### Prototype — the markup

```
BEFORE   <html lang="nl">                     <- wrong on 5 of 6 stores
           <td>Une pergola sur mesure...</td>  <- announced as Dutch
           <td>Eine Pergola nach Mass...</td>  <- announced as Dutch

AFTER    <html lang="en-GB">                  <- chrome, after 124
           <td lang="fr">Une pergola sur mesure...</td>
           <td lang="de">Eine Pergola nach Mass...</td>
           <h1>bedrijfsinformatie</h1>         <- NO lang. A url key is an
                                                  identifier, not prose.
           <p class="note">mijn aantekening</p><- NO lang. Free text, no fact
                                                  to derive from.
```

Store to language, the mapping that does not exist yet:
`nl`,`be` -> `nl` | `be_fr`,`fr` -> `fr` | `de` -> `de` | `uk` -> `en`

### Audit

- **It fixes a defect that predates the language decision.** `lang="nl"` has been wrong on
  five of six stores since the shell was written. It is not a nice-to-have layered on 124;
  it is a bug 124 makes more visible.
- **Small and closed.** One derivation, applied at every place scraped text is drawn. No
  count, bar or layout moves.
- **The hard cases are already decided in triage**, with reasons: the page key carries no
  `lang` on any store (and a test pins that the breadcrumb and the `h1` agree), a `nl` store
  states its attribute explicitly, and notes stay untagged. Nothing left to argue.
- **Honest about the reader.** This serves an editor using a screen reader. We do not know
  that we have one. Against that: the cost is one session, the defect is real, and the
  accepted cost of the page-key decision is written down rather than hidden.
- **Verdict: keep.** Cheap and correct. If the list has to be shortened, this is a
  defensible thing to defer - but not to park, because it is a wrong fact in our markup.

## 129 — A hint is reachable without a mouse, on every surface

**What it does:** 36 native `title` attributes become the `Tooltip` primitive we bought in
ticket 74 and have never imported.

### Prototype — the same hint, two ways

```
BEFORE   <abbr title="Aantal pagina's met dit verschil">30</abbr>

         mouse       hover, after a delay, in the browser's own styling
         keyboard    unreachable
         touch       invisible
         screen rdr  announced unreliably
         our design  three code comments discuss "the tooltip" as a
                     designed thing. It is an attribute the browser
                     draws however it likes.

AFTER    <Tooltip>                                    (part A: dashboard)
           <TooltipTrigger>30</TooltipTrigger>        (part B: the rest)
           <TooltipContent>Pages with this difference</TooltipContent>
         </Tooltip>

         + a guard that fails the build on a new `title` attribute,
           and cannot pass until every surface has moved.
```

Two parts, two commits, two sessions. A establishes the pattern; B applies it and adds the
guard. Screenshot criteria are struck - no screenshot matcher exists anywhere in this repo.

### Audit

- **It is the largest undocumented gap in the interface**, and the ticket proves it: 36 real
  `title` attributes against a primitive with **zero** importers, verified twice, and no
  comment anywhere acknowledging the choice. Meanwhile three comments describe "the tooltip"
  as designed.
- **ADR 0007 bought the dependency for exactly this.** The library's own case is the
  accessibility work the interface was not doing, and `title` is the textbook example. We
  are paying for the library and not taking the thing we bought it for.
- **It adds JavaScript, deliberately, and says so.** The CSS-only replacements (Popover API,
  anchor positioning, `interestfor`) are refused by 127 for years yet. *Zero JavaScript* was
  never the goal.
- **The guard is what makes it stick.** Without it, `title` number 37 arrives next month.
- **Cost: two sessions, 13 files.** That is the second-largest UI spend on the list.
- **Verdict: keep.** A hint a touch user cannot see is not a cheap hint, it is a hidden one -
  and this is the one a11y ticket where the primitive is already installed and paid for.

## 128 — The carve-out reaches for CSS and primitives first

**What it does:** an internal refactor. Six presentational behaviours move to CSS, three
hand-rolled shapes become the primitives they shadow, two disclosures get a comment, and
ADR 0007 gains the rule that decides which.

### Prototype — the rule, and the eleven moves

```
  The rule, into ADR 0007 next to the carve-out it governs:
    primitive first, CSS second, JavaScript last.
    A tone that depends on a state is a selector, not a token.

  To CSS (6)                     To a primitive (3)      To a comment (2)
  -----------------------------  ----------------------  ------------------
  disclosure glyph from          count badge (copied     both table-bound
    aria-expanded                  byte-for-byte into      disclosures: why
  heading indent from an           two files)              Collapsible cannot
    attribute, not a px style    vertical rule             wrap sibling rows
  landed row outline from        annotate bar's panel
    aria-current                   shape (a silent copy
  floating bar shape, one rule     of the bulk bar's)
    for two wearers
  sparkline width via calc()
  copy flash duration in CSS
```

Nothing an editor can see changes. No count, bar or denominator moves.

### Audit

- **The defect it names is real and specific.** Two disclosures hand-write `aria-expanded`
  beside a third that credits the primitive for writing it; a count badge is duplicated
  byte-for-byte while six other components import `Badge`; the annotate bar's panel is an
  uncommented copy of the bulk bar's, free to drift.
- **The ADR clause is the durable half.** ADR 0007 says what stays custom and has never said
  what to reach for *inside* the carve-out. That silence is what produced the inconsistency,
  and one clause closes it. That part is worth doing on its own.
- **The eleven moves are the deprecatable half.** They are yield-per-hour poor: a sparkline
  width and a 1200ms flash duration are not costing us anything today, and the ticket admits
  the copy-flash one is not JavaScript being deleted at all.
- **It is the only ticket on the list with no external reader.** Every other one serves an
  editor, a screen-reader user, or us-in-CI.
- **Verdict: split.** Keep the ADR amendment and the three primitive dedups (badge, divider,
  panel) plus the two comments - that is the drift-prevention, and it is cheap. **Move the
  six CSS conversions to `.out-of-scope`** with a re-open trigger: when a component next
  needs one of those behaviours, the rule is already in the ADR and it gets written the new
  way. We do not need to convert the six retroactively.

## 85 — The comparison scope is legible, and the exclusion list has an owner

**What it does:** two halves. A read-only half that says what the comparison is blind to,
and a **drafting endpoint** that measures a selector live so an exclusion entry is cheap to
write. About half of the read-only half is already in the tree.

### Prototype A — the read-only half (the part that is left)

```
  What this comparison is blind to                            nl
  ==========================================================================

  !  The promo banner exclusion matched NOTHING this run.
     It matched 446 of 448 pages last run. Either the anchor
     is stale or the site is fixed. Somebody must look.
     ~2,100 findings are back in the backlog.        <- hoisted, not a row

  Excluded pages          reason                        stores
  --------------------------------------------------------------------------
  no-route                both sides answer 200          6
  ...                                                             [existing]

  Excluded regions        kind          removed   verdict
  --------------------------------------------------------------------------
  .promo-banner-2024      legacy-only   0 / 448   stopped-matching  [existing]
  .magezon-builder                                                  [existing]

  Class visibility        21 classes                            <- MISSING
  --------------------------------------------------------------------------
  work (11)         text-missing 8,204   image-missing 1,204  ...
  information (7)   text-added 6,102     extra-link 812       ...
  diagnostic (3)    heading-level 2,846  ...

  To change any of these: open a pull request against the committed list.
```

### Prototype B — the drafting endpoint (the part I would park)

```
  Draft an exclusion entry                    [local service only]
  --------------------------------------------------------------------------
  Selector   .magezon-builder___________________
  Pages      /downloads   /over-ons   /contact       (three, as ADR 0003 demands)

                                     [Measure]   <- 6 live fetches

  units removed        prod   new
    /downloads          287    286   !! 99.7% of the page
    /over-ons            12     12
    /contact              9      9

  !  This selector takes almost the whole page. The .magezon-builder
     near-miss is why this panel exists.
  !  Anchors on nothing campaign-shaped.

  Proposed entry, to paste into shared/excluded-regions.mjs:
    { selector: '.magezon-builder', kind: 'both', maxUnits: 300, ... }
    -> REFUSED: 300 is above the ceiling of 100. That needs a new
       decision in ADR 0003, not a larger number.

  The panel writes nothing. Not to the list, not to the database, not to disk.
```

### Audit

- **Prototype A is route 3 and cheap.** The verdicts already exist and are computed
  (`stopped-matching`, `narrowed`, `widened`, ...). What is missing is that a reader has to go
  looking. The promo-banner sentence in `shared/excluded-regions.mjs` - *the next campaign has
  different option ids, the entry stops matching, the banner returns as findings, the list
  needs an owner* - has been true and inert since ticket 64. A hoisted warning plus the
  class-visibility panel closes it.
- **Prototype B is a lot of machinery for a two-entry list.** A live-fetching endpoint, a
  `maxUnits` proposer, a ceiling refusal, a share-of-page warning, a campaign-anchor warning,
  and a failed-fetch-is-not-a-zero guard - so that a human can then paste the result into a
  file and open a pull request. The exclusion list has **two** entries. We add to it perhaps
  once a campaign.
- **And its own environment fights it.** Production has served the maintenance page on 446 of
  451 URLs for a whole session, so the measurement it exists to provide is the measurement
  most likely to come back as *failed*.
- **The ticket's own closing note is the tell:** *the visibility panel is not a control. Once
  all 21 classes are on one screen with their counts, a toggle beside each will look obvious.*
  It knows the read-only half is the load-bearing part.
- **Verdict: split.** **Keep prototype A** (the warning hoist, the per-entry store count, the
  class-visibility panel, the named pull-request route, and the answer recording who owns the
  list - that last one is the ADR's actual ask). **Move prototype B, the drafting endpoint, to
  `.out-of-scope`**, re-open trigger: the next campaign, or the third time somebody hand-writes
  a selector and measures three pages by hand.

## 87 — Three widths

**What it does:** the log becomes usable on a laptop, a tablet and a phone. Part arrived on
the way to other tickets; ticket 74's table primitive already gave every table a horizontal
scroll wrapper.

### Prototype — what is left, at the narrowest width

```
  What is already in the tree
  ---------------------------------------------------------------
  [x] every data table has overflow-x-auto (ui/table.jsx:12)
  [x] fixed px columns became min-widths, table-fixed kept
  [x] some responsive utilities beyond the two original lg: ones

  What is left
  ---------------------------------------------------------------
  [ ] the three widths are NAMED NOWHERE - no doc, constant or
      comment states the targets, so there is nothing to build against
  [ ] the header does not wrap. Shell.astro:35-41 says so outright:
      "nothing here can wrap without breaking the h-16"
  [ ] touch targets - and currently pointed the WRONG WAY: the override
      controls, bulk buttons and clamp control use size="xs", which is
      smaller than a touch target, not larger
  [ ] "expand and collapse by touch" is UNVERIFIABLE - it depends on
      ticket 79's context markers, which do not exist

  Narrow header, wrapped:
  +-------------------------------------+
  | Tuinmaximaal parity      [nl  v]    |
  | bedrijfsinformatie                  |
  +-------------------------------------+
```

### Audit

- **The stated reader is speculative.** *An editor standing in a showroom with a phone.* We
  have no evidence anybody reads the log on a phone. The canonical viewport was settled as
  desktop by ticket 69, and the log does not check the mobile version of a page - a
  distinction the ticket has to warn about because it is easy to confuse.
- **One criterion is unverifiable today.** It depends on ticket 79's context markers, and 79
  is not resolved. A ticket with an unbuildable criterion is not `ready-for-agent`.
- **But two of its criteria are not about phones at all.** Touch-target sizing is a WCAG
  target-size question that applies to a mouse user with poor motor control on a desktop, and
  `size="xs"` on the override controls - the most-pressed control in the app - is wrong at any
  width. The header not being able to wrap is a real constraint written into `Shell.astro`.
- **Verdict: split, and park the programme.** **Move 87 to `.out-of-scope`** as *three widths*,
  re-open trigger: evidence that an editor reads the log on a phone or tablet, or a request
  for it. **Carve the two width-independent criteria into `ui-polish`**: touch-target sizing on
  the override controls, checkboxes and class pills, and the header wrap. Those two are worth
  doing and do not need a responsive programme around them.

## 42 — Untranslated text

**What it does:** opens **axis B**. A `de` page showing the exact Dutch sentence from the `nl`
page says so. It also builds the axis B tab on a store page.

### Prototype — the tab it would add

```
  Differences   Content   Meta   [Axis B  (?)]        <- a new tab, new axis
  ==========================================================================
  Untranslated                                        de / bedrijfsinformatie

  "Wij leveren en monteren uw overkapping in heel Nederland en Belgie."
       byte-identical to the nl page. work.

  "Neem contact op voor een vrijblijvende offerte op maat."
       byte-identical to the nl page. work.

  Skipped, by rule, not by list:
    Gumax(R)          brand token
    Tuinmaximaal      brand token
    RAL 7016          brand token
    "Meer info"       fewer than 3 words after digits/punctuation/units
```

The rule: set membership on `norm`, not element pairing - a `TextElement` carries no DOM path,
so a positional cross-language comparison is not possible. No language detection, no
confidence score (ticket 02 removed that axis).

### Audit

- **Its own blockers are demoted.** `Blocked by: 39, 38, 124`. **39 is `needs-triage`**, moved
  off `ready-for-agent` on 2026-08-13 with the note that its conclusion may still be right but
  its reasoning needs re-reading. A ticket blocked by an untriaged ticket is not ready.
- **Its surface may not exist.** It builds *the axis B tab*, and says *ticket 12 owns the ledger
  tabs*. Since then ticket 81 removed the Taken tab and 98 restructures the panel. The tab
  layout this ticket draws against is two rewrites old.
- **Its own volume note is the argument against it.** *If one shared page footer is untranslated
  on every de page, the tab fills with the same finding.* The answer the ticket gives is one
  bulk dismissal over its pages - which is to say the most likely outcome is a large number of
  findings whose correct disposition is a single press. That is a lot of new axis for that.
- **It opens a second axis while the first is 22,000 findings from drained.** Axis A work is
  what the editors are measured on. A new axis adds a denominator, a tab and a vocabulary
  before the existing one is usable.
- **The value is not zero.** An untranslated sentence on a live foreign-language store is a
  genuine customer-facing defect, and it is the kind of thing that gets noticed from outside.
- **Verdict: move to `.out-of-scope`.** Re-open trigger, stated in two parts: (a) ticket 39 is
  re-triaged and its axis conclusion holds, **and** (b) axis A `work` on the non-`nl` stores is
  low enough that a second axis is readable - or a store is going live and untranslated copy
  becomes a launch blocker rather than a backlog item. Keep the file: the skip rule and the
  set-membership argument are settled design worth not re-deriving.

---

# 5. `cross-store-reuse`

Eight open tickets in two groups. **01, 02, 03, 04, 09 need no new data.** **06, 07, 10 rest
on one new thing an editor declares** - a link between two store pages, with a new Supabase
table behind it. The two groups deserve opposite verdicts.

## 01 — Measure finding churn *(probe)*

**What it does:** a number. How many findings live a day or two before their content-addressed
id expires, and how many dismissals are stranded when they do.

### Prototype — the answer it writes

```
## Answer - 2026-08-__, __ runs, __ finding ids

  lifespan     ids      %
  ---------------------------
  1 run        ____    __%    <- if this is large, the whole effort changes
  2 runs       ____    __%
  3-5 runs     ____    __%
  6+ runs      ____    __%

  Pages producing the most short-lived findings
  ---------------------------------------------------------
  1. nl__?????            ___ ids     classes: ____
  2. de__?????            ___ ids     classes: ____

  Dismissals keyed on an id that no longer exists:   ____
    of which the id expired within two runs:         ____
    <- the cost, in the only unit an editor feels

  Reading: does churn outrank decision repetition?  yes / no
```

### Audit

- **It is the cheapest way to find out whether we are building the right feature.** The whole
  `cross-store-reuse` effort answers *an editor decides the same thing many times*. If the
  corpus is full of one-day findings, the same complaint is arriving from a completely
  different direction and the fix is elsewhere. Nobody has measured it.
- **Zero build cost.** The run log already holds `firstSeen`, `lastSeen`, `seen` and
  `retiredAt`. No crawl, no new source, no production code.
- **The traps keep it honest:** a retired id is not a decision (nobody closed it), and do not
  try to re-attach two ids - which ADR 0004 forbids in writing.
- **Verdict: ~~keep, and run it first~~ — ALREADY RUN.** Resolved 2026-08-19; the answer is
  `.scratch/cross-store-reuse/CHURN.md`, which this audit did not read.
  **What it says:** *churn does not outrank decision repetition — not on this corpus, and not by
  an order of magnitude.* So the feature's premise survives. But the number that would settle it
  either way **does not exist yet**: `history/run-log.jsonl` holds two observation ids **21
  minutes apart**, so nothing in the corpus has had the chance to live a day. Of the 132 detached
  dismissals it did find over twelve days, **70 are claimed outright by two commit subjects that
  changed the comparison rules** — that is rule-change detachment, not content churn, and it stops
  when the rules settle. The probe's own prescription is to do nothing and re-run in a fortnight.
  One finding worth carrying: 21 of the 132 orphans sit on one page, `nl glazen-schuifwand`, so
  the cost of expiry is concentrated on pages an editor has actually worked.

## 09 — A class on its own is a query

**What it does:** the class pill stops being only a filter and becomes a selector. Empty box +
*Broken link* returns that class's repeats.

### Prototype — the empty box, before and after

```
BEFORE   Search nl                          AFTER    Search nl
  +------------------------------+            +------------------------------+
  | (empty)                      |            | (empty)                      |
  +------------------------------+            +------------------------------+
  [Broken link*] [Text changed]                [Broken link*] [Text changed]

  Nothing to show.                             45 findings on 38 pages
  <- an entry whose matched fields are          --------------------------------
     empty is skipped, and with nothing         /over-ons/team    Broken link
     typed every entry's are                    /contact          Broken link
                                                /downloads        Broken link
  So an editor looking straight at a            ...
  "Broken link" row and wanting the             <- matched fields: NONE. It
  rest of them has to type a word,                 matched no field; what it
  and there is no word - the class                 matched on is the pill,
  is the thing they mean.                          which is on screen.
```

Three things can open a result: **words**, **a page scope**, **a class**. None of them on still
draws nothing - the empty-box refusal is narrowed, never removed, and its comment is rewritten
rather than deleted.

### Audit

- **It came from the user, in these words:** *"If I press on 'Broken link', does it search every
  store for broken links?"* The PRD did not say so. That is the shortest path from a stated want
  to a shipped change on this whole list.
- **No new URL parameter, no new derivation.** `classes` is already in the contract and already
  survives a copy. Only which entries reach the grouping changes.
- **It unblocks 03**, which inherits the behaviour for free.
- **Verdict: keep.** Smallest useful change in the feature, and it is the half of the user's
  question we can answer without touching the corpus rule.

## 03 — The search reaches every store

**What it does:** one screen searches all six stores, and the class label on a finding row
becomes a press that opens it. **Reading only** - nothing about what may be pressed changes.

### Prototype — the screen, and the gesture

```
  On an nl finding row:            Broken link   /over-ons/team
                                   ^^^^^^^^^^^ a link, not a pill

  lands on ->

  Search - all stores                                    /search?classes=broken-link
  ==========================================================================
  |                              |   [Broken link*] [Text changed] [Image missing]
  +------------------------------+
                                     [ ] Include closed

  267 findings on 198 pages, in 6 stores

  "Broken link"  ->  /over-ons/team                             on 6 pages
     nl     /over-ons/team                    open
     be     /over-ons/team                    30 of 30 closed
     be_fr  /fr/a-propos/equipe               open
     de     /ueber-uns/team                   open
     fr     /a-propos/equipe                  open
     uk     /about-us/team                    open
     <- the store is a grouping INSIDE a difference, not a flat page list

  Six static index files. No backend. A partial read is an ERROR, not a
  narrower search.
```

Two presses, two verbs, one class: **the label on a row opens** (a link), **the pill in the
strip toggles** (a control). A press that navigates never looks like a press that filters.

### Audit

- **Route 2, on a measured pain:** *six stores are four searches, and the same false positive is
  written up four times.* An editor who finds `max.svg` on `nl` cannot see from there that `de`,
  `fr` and `uk` hold it too.
- **It is deliberately the safe half.** Reading is widened; deciding is not. *A control may narrow
  what is read. What may be pressed is a property of the check and never a preference.* That split
  is what makes this ticket cheap and the corpus-widening ticket (04) expensive.
- **No backend, no new data.** Six static files fetched together, a static build.
- **Verdict: keep.** With 09, this is the whole answer to the user's question, and neither ticket
  needs the link table.

## 02 — A renamed image is one finding

**What it does:** `max.svg -> max-new.svg` becomes one decidable row that names both filenames,
and both names are searchable.

### Prototype — two rows become one

```
BEFORE
  Image missing   max.svg          work         <- in the search index
  Image added     max-new.svg      information  <- NOT in the search index

  So an editor reads two rows and joins them in their head, and a search
  for the NEW filename finds nothing in any store. The one image change
  most worth tracing is the one the log describes worst.

AFTER
  Image renamed   max.svg -> max-new.svg        work
                  ^ the detail is the arrow, in the manner of
                    heading-level's "h2 -> h3", so it joins the finding
                    id and a second rename asks again

  Pairing needs arity AND position: exactly one unclaimed image-missing
  and exactly one unclaimed image-added, at the same index in document
  order. One-to-one only, never many-to-many. Equal alt text raises the
  score; it does not gate the pairing, because alt is often empty.
```

Vocabulary 32 -> 33. ADR 0023 first, because this is the first class in a closed vocabulary
whose matcher is not textual equality.

### Audit

- **Route 3 with a route-1 side effect.** It does not remove findings so much as stop two rows
  lying about being two problems, and it repairs a real hole: the new filename is unsearchable
  today because `image-added` is `information` and `information` is not indexed.
- **One sequencing risk, and it is worth naming.** `gallery-opening-links/02` is measuring
  whether the gallery photos are the **same bytes**. If they are, a content digest pairs a
  renamed image directly - which is a stronger answer than an arity-and-position heuristic, and
  it would change what this class's matcher should be. **Do not build 02 before that probe
  reports.**
- **The traps are right.** Do not pair across pages or stores; do not make it `information` (an
  undecidable rename cannot be dismissed and is not indexed, which kills both halves of the
  point); do not touch the basename key (full-path matching scored 2.8%).
- **Verdict: keep, sequenced after `gallery-opening-links/02`.** If the digest pairs cleanly, come
  back and re-read this ticket's matcher before building it.

## 04 — An image repeat crosses all six stores

**What it does:** the repeat corpus becomes a function of the **check** rather than of the
language block. `images` and `links` span all six stores; `text` and `meta` stay inside the block.

### Prototype — one press instead of four

```
BEFORE   "max.svg is missing" is 4 repeats
  {nl, be}        on 12 pages    [dismiss]  + a mandatory note
  {be_fr, fr}     on 12 pages    [dismiss]  + the same note, typed again
  {de}            on 12 pages    [dismiss]  + the same note, typed again
  {uk}            on 12 pages    [dismiss]  + the same note, typed again

AFTER    "max.svg is missing" is 1 repeat
  6 stores        on 72 pages    [dismiss]  + one note

  The press writes SIX ORDINARY EVENTS, one per store, each carrying its
  own store off its own entry and never off the row. It states in which
  stores it wrote. A finding a colleague already decided is skipped and
  counted. The note stays mandatory, however wide the press.

  A text row from another language block:
  de   "Wij leveren in heel Nederland"   shown, NOT tickable, and says why
```

The measured basis: the images check compares basenames with the path stripped, and the asset
convention keeps filenames English and semantic - so a basename is the same string on every
store **by design**. The block's stated reason (*the stores translate the text*) is true of
`text` and `meta` and **false of `images` and `links`**.

### Audit

- **This is the actual decision multiplier in the feature**, and unlike the link tickets it needs
  no new data, no new table and no editor declaration. It corrects a rule whose stated reason is
  demonstrably wrong for two of the four checks.
- **It reuses the seam ticket 138 built.** A six-store press is a longer flat entry list to the
  same code. *If the arithmetic gains a case, something is being keyed on the block that should
  not be* - a good self-check.
- **The one thing to watch is press width.** The ticket notes it plainly: with 09 landed, a class
  pill alone is a narrowed result, so the widest press becomes *a whole class over six stores* -
  some 45 broken links per store, hundreds on a hidden class. Every existing rule still holds and
  the note stays mandatory. No cap, and the ticket says a cap would be its own decision.
- **Verdict: keep.** With 03 and 09 this is the whole no-new-data half of the feature, and it is
  where the repetition actually goes away.

## 10 — An editor links two store pages, and the log keeps it

**What it does:** the largest new build on this list. A new append-only Supabase table, a linking
screen with a bulk press, a control on the store page, a derived *link candidates* reading, ADR
0026 superseding ADR 0025, and the removal of everything ticket 08 built.

### Prototype — the screen and the control

```
  Link pages - nl / be                                    /links/nl-be
  ==========================================================================
  Two store pages of one language block can be one page. Nothing the log
  crawls can see that. Somebody has to say so.

  [Link all 124 pairs]     <- the bulk press. The common case is that they
                              are one page and it must not cost 124 presses.

  page                  linked   by            when       words agree
  --------------------------------------------------------------------------
  bedrijfsinformatie    yes      d.aerle       12:04      100%
  contact               yes      d.aerle       12:04       98%
  algemene-voorwaarden  no       -             -          100%  <- candidate
  showroom-eindhoven    no       -             -           61%
  offerte               [Link]                             94%  <- candidate

  Link candidates: pairs NOT linked whose two stores already render the
  same words. Identical words are NOT EVIDENCE of one record - they are
  what two separate records look like the day before they diverge. The
  list offers no press that links from it.

  On the store page:   [...] menu -> Link page / Unlink page
                       Reason optional when linking, expected when unlinking.
```

`page_links` is append-only on the same terms as `overrides`: RLS on, insert and select policies,
**no UPDATE and no DELETE**. Two kinds, `linked` and `unlinked`, newest event per pair wins. No
record id, no reading, no date taken - a link is a judgement, not a transcription, so it can never
be out of date with a configuration it never copied.

### Audit

- **The design is genuinely good, and it is the second design.** The first session made this an
  import from Magento; the user objected - *I wanted this feature to be controllable in our
  interface tool, not in the code itself* - and the reversal is argued properly: with no record id
  and no reading date the imported claim carried **no evidence**, and ADR 0025's own central
  argument is that no crawl can see record sharing. Nothing in the system could ever contradict it.
  So it is an editor's decision. That is right.
- **But look at what it costs and what it buys.** It buys nothing on its own - *nothing consumes
  the rule yet*. Its two readers are 07 and 06. And the PRD is candid about how narrow 06 is: *a
  dismissal already crosses the block ... so the repetition an editor still meets is not in
  judging; it is in claiming a fix they only made once.*
- **So the three-ticket chain's payload is:** an editor clicks *fixed* once instead of twice on
  paired pages, plus 07's reading. For that we take on a new table, new RLS policies, a new screen,
  a bulk press, an ADR pair, and a transcription pass through the page pairs of two blocks with
  Magento's admin open beside it.
- **It also widens who can grant a permission.** *Anyone who can open the site can write here*, as
  with `overrides` - and this table is what authorises a claim to travel. The ticket requires ADR
  0026 to record that rather than let it be discovered, which is correct, and is also a statement
  of how much this table is trusted to do.
- **The transcription pass is unpriced.** The bulk press makes it affordable *if* the common case
  really is that the pairs are one page - which nobody has measured.
- **Verdict: park behind a measurement.** See the recommendation after 07.

## 07 — A linked page says what is store-scoped

**What it does:** on a **linked** page, a divergence between the block's two stores can only come
from a store-scoped mechanism - so the sibling tab can finally say *why* two stores differ. And, in
the other direction, where **production** diverges and **the new site** does not, the migration
flattened a store difference and one store now shows the other's words.

### Prototype — the second reading

```
  Sibling                                    nl / be, LINKED by d.aerle
  ==========================================================================
                              PRODUCTION            NEW SITE
                              nl        be          nl        be
  --------------------------------------------------------------------------
  "Levertijd 4-6 weken"       same      same        same      same
  "Garantie 10 jaar"          differ    differ      same      same    <<<<
       ^ store-scoped content in production, FLATTENED on the new site.
         be now shows nl's words. This is the row that stands out.
  "Bel ons op 040..."         differ    differ      differ    differ
       ^ store-scoped content. A variable lives here. The tool never
         names it - its value is server-side and appears in no HTML.

  No id, no override, no class pill, no place in any bar. ADR 0017 holds:
  a block difference is display-only. A legal-text divergence between nl
  and be is CORRECT, not defective, and must never read as work.
```

### Audit

- **The second reading is the most valuable idea in the whole feature**, and the ticket says where
  it came from: the custom-variable objection looked at first like it killed the feature and turned
  out to add this. *Nothing in the log says where a store difference was deliberate, so nothing says
  where one went missing.* A flattened legal text or a flattened regional promise is a real,
  customer-facing, hard-to-find migration defect - exactly what this tool exists for.
- **It ships before anything travels, deliberately.** *Granting the permission first and building
  the check afterwards leaves a window in which a wrong link cannot be looked at.* Good ordering.
- **But it is gated on 10.** The inference needs the link: on an unlinked page the same divergence
  says nothing, because two records may simply hold different words.
- **Here is the thing worth noticing.** The *flattened* half - production's two stores diverge and
  the new site's do not - is computable **today, with no link table at all**. Linkedness is what
  licenses the *why* label; it is not needed to spot the flattening. And the flattening is where the
  defect is.
- **Verdict: measure first.** See below.

## The recommendation for 06, 07 and 10

**Add a probe, and park all three behind it.**

```
  Proposed ticket 11 - Measure the flattening, and the pairing
  ==========================================================================
  A probe over data on disk. No new table, no screen, no editor input.

  [ ] Over {nl, be} and {be_fr, fr}: how many content units DIVERGE on
      production's two stores and AGREE on the new site's? Per page,
      ranked, with the text.
      <- these are candidate flattened store differences: the defect
         ticket 07 exists to find. If the number is near zero, ticket
         07's best half has nothing to show, and the link feature loses
         its strongest justification.

  [ ] The agreement share per pair, both ways round - how many pairs
      render identical words? <- the measured basis for ticket 10's claim
      that "the common case is that they are one page", which is today an
      assumption, and which decides whether the transcription pass is ten
      presses or two hundred and fifty.

  [ ] How many fix claims in the log were written on a page whose sibling
      carries the same finding? <- ticket 06's payload, in the only unit
      that counts: how often an editor actually claimed the same fix twice.
```

- If the flattening count is meaningful **and** the double-claim count is meaningful, build **10,
  07, 06** in that order, as written. The designs are ready and they are good.
- If either is near zero, **move 06 and 10 to `.out-of-scope`** and reduce 07 to the flattening
  reading with no link and no `store-scoped content` label - a display-only column on the sibling
  tab, at a fraction of the cost.
- **Either way, do not build 10 first on the current evidence.** It buys nothing on its own, its two
  consumers rest on unmeasured assumptions, and it is the only ticket on this list that adds a
  database table.

---

# 6. `ui-polish`

## 07 — The page header is one quiet line *(spec, two thirds delivered)*

### Prototype — what is left of it

```
  07  The page header is one quiet line, and the rest is behind a menu
      +- 08  the header decides as a value     resolved 2026-08-19
      +- 09  the page offers a link to copy    resolved 2026-08-19
      +- 10  page details move into a dialog   ready-for-agent
```

### Audit

- **It is a spec, and it says so** - `Type: spec`, *built as three tickets*. Two of the three
  landed on 2026-08-19 (commits `8e33cf5` and `866a9c0`). All that is left of it is ticket 10.
- **Verdict: ~~close as superseded~~ — ALREADY CLOSED.** It was `resolved — 2026-08-19, built as
  08, 09 and 10` before this audit was written. The point stands as a rule and is now in
  `docs/agents/triage-labels.md`: a PRD or spec carries no triage label.

## 10 — Page details move into a dialog, and the header goes quiet

**What it does:** the annotation form leaves the header. The header becomes one quiet line that
**reads** three facts; the controls that **set** them move into a dialog.

### Prototype — the header, before and after

```
BEFORE
  +--------------------------------------------------------------------+
  | bedrijfsinformatie                                                 |
  | [########------] 62%  118/190                                      |
  | Priority  (Low) (Med) (High)                                       |
  | Note  [__________________________________]  [Save]                 |
  | Reviewed by [_________]  [Mark reviewed]         [Re-check]        |
  +--------------------------------------------------------------------+
      ^ a form that is usually not being filled in, at full weight,
        on every page, competing with the one fact that says WHERE AM I

AFTER
  +--------------------------------------------------------------------+
  | bedrijfsinformatie                              [Re-check]  [...]  |
  | High - note - reviewed 12 Aug, changed since review                 |
  | [########------] 62%  118/190                                      |
  +--------------------------------------------------------------------+
      ^ the line READS the three facts. Text, not badges - except the
        priority, which ADR 0019 already allows.

  [...] menu                     Edit page details ->  a DIALOG
  --------------------------      +---------------------------------+
   Mark page reviewed             | Priority  (Low) (Med) (High)    |
     (only when none exists -     | Note  [_____________________]   |
      one press, no form)         | Clear review   Mark again       |
   Edit page details              |            [Cancel]  [Save]     |
   Copy link                      +---------------------------------+
                                    A half-typed note SURVIVES a
                                    click outside. That assertion is
                                    why it is a dialog and not a
                                    popover, and it is not optional.
```

A page with no priority, no note and no review draws a **shorter line**, not three empty slots.
Nothing is deleted: every control is one press away.

### Audit

- **Route 3 on attention rather than on data.** The header spends its most prominent row on a form
  most editors touch on a small minority of pages, while the page key - the one fact that answers
  *where am I* - competes with it. Editors open pages all day.
- **It finishes PRD story 27**, which could not be built before because the collapse had nowhere to
  put the controls it displaced. That is the whole reason 09 (the menu) came first.
- **It is the first user of `ui/dialog.jsx`**, installed since ticket 74 and used nowhere - the same
  shape as 129's unused `Tooltip`. Two paid-for primitives sitting idle.
- **Relocate, do not delete** is the standing rule of this pass and the ticket restates it. The risk
  in a ticket like this is a fact quietly disappearing behind a disclosure; the criteria guard it.
- **Blocked externally by ui-polish 02**, which is **resolved** as of 2026-08-19, so it is unblocked
  now. 09 is also resolved.
- **Verdict: ~~keep~~ — ALREADY BUILT.** Resolved 2026-08-19 in `68205c7`, *"Page details move
  into a dialog, and the header goes quiet"*. It is also why the *two paid-for primitives sitting
  idle* observation below is now one: `ui/dialog.jsx` has an importer, `Annotate.jsx:13`.

---

# 7. The overview

## Every open `ready-for-agent` ticket, ranked

| # | ticket | route | cost | verdict |
|---|---|---|---|---|
| 1 | `gallery` 01 — opening links stop becoming link records | 1 | — | ~~keep, first~~ **done, `71a6cea`** |
| 2 | `gallery` 02 — are the gallery photos the same bytes | 3 | — | ~~keep~~ **done, see `BYTES.md`** |
| 3 | `cross-store` 01 — measure finding churn | gate | — | ~~keep, first~~ **done, see `CHURN.md`** |
| 4 | `code-health` 01 — lint runs on every push | 3 | ~~1 workflow~~ | **split** — `--deny-warnings` landed; enforcement undecided, now `needs-info` |
| 5 | `cross-store` 09 — a class on its own is a query | 2 | small | **keep** |
| 6 | `cpl` 141 — a difference is ordered by what is left | 2 | small | **keep** |
| 7 | `cross-store` 03 — the search reaches every store | 2 | 1 session | **keep** |
| 8 | `cross-store` 04 — an image repeat crosses six stores | 2 | 1 session | **keep** |
| 9 | `ui-polish` 10 — page details move into a dialog | 3 | — | ~~keep~~ **done, `68205c7`** |
| 10 | `cpl` 94 — the extract carries the head | 3 | 1 session | **keep** |
| 11 | `cpl` 95 — re-crawl six stores | — | a run | **keep, welded to 94** |
| 12 | `cpl` 93 — `no-route` leaves, the abort writes its failures | 1+3 | 1 session | **keep, re-framed** |
| 13 | `cpl` 129 — a hint is reachable without a mouse | 3 | ~~2 sessions~~ re-price: **11** hints, 9 files | **keep** |
| 14 | `cross-store` 02 — a renamed image is one finding | 3 | 1 session | **keep** — `gallery` 02 has reported; **re-read the matcher** |
| 15 | `cpl` 125 — a content cell says which language | 3 | 1 session | **keep** |
| 16 | `cpl` 98 — the meta tab becomes a checklist | 3 | 1 session | **keep, welded to 97** |
| 17 | `cpl` 97 — the meta producer | — | 1 session | **keep, last of the chain** |
| 18 | `cpl` 85 — the comparison scope is legible | 3 | 2 sessions | **split** — keep the panels, park the drafting endpoint |
| 19 | `cpl` 128 — the carve-out reaches for CSS first | — | 1 session | **split** — keep the ADR clause and the primitives, park the six CSS moves |
| 20 | `cross-store` 07 — a linked page says what is store-scoped | 3 | 1 session | **park behind a probe** |
| 21 | `cross-store` 06 — a fix claim travels over a link | 2 | 1 session | **park behind a probe** |
| 22 | `cross-store` 10 — an editor links two store pages | — | 2+ sessions, a table | **park behind a probe** |
| 23 | `cpl` 87 — three widths | — | 2 sessions | **park** — carve out touch targets and the header wrap |
| 24 | `cpl` 42 — untranslated text | — | 2 sessions, a new axis | **`.out-of-scope`** |
| 25 | `cpl` 58 — the head becomes a check | — | — | **close, superseded by 93–98** |
| 26 | `ui-polish` 07 — the page header is one quiet line | — | — | ~~close~~ **already resolved** |

## What was actually done, 2026-08-19

Every verdict below was executed onto the tickets. The record is the tickets; this list is the
index.

| ticket | what happened |
|---|---|
| `cpl` 42 | → `.out-of-scope/`, `wontfix`, two-part re-open trigger |
| `cpl` 87 | → `.out-of-scope/`, `wontfix`; two criteria carved out first |
| `ui-polish` 13 | **new**, `ready-for-agent` — touch targets and the header wrap, out of 87 |
| `cpl` 85 | narrowed to the read-only panels; the owner criterion moved back into them |
| `cpl` 142 | **new**, `wontfix` in `.out-of-scope/` — the drafting endpoint, out of 85 |
| `cpl` 128 | narrowed to the ADR clause, three primitive dedups and two comments |
| `cpl` 143 | **new**, `wontfix` in `.out-of-scope/` — the six CSS conversions, out of 128 |
| `cpl` 58 | → `resolved — superseded by 93–98` |
| `cross-store` 06, 10 | → a new `.out-of-scope/`, `wontfix`, re-open on ticket 11 |
| `cross-store` 07 | → `needs-triage`, blocked by 11 — half of it may not need 10 at all |
| `cross-store` 11 | **new**, `ready-for-agent` — the flattening, the pairing, the double claim |
| `cpl` 49 | moved **out** of `.out-of-scope/` — it is `needs-triage` and that folder is `wontfix` only |
| `cpl` 138 → 140 | renumbered; 138 had been issued to two different tickets |
| `cpl` 129 | *36* corrected to **11**; re-price part B |
| `code-health` 01 | verified green by running it; four caveats recorded on the ticket |
| `cross-store` 02, 04, 10 | stale pre-assigned ADR numbers removed |
| four PRDs | triage labels removed; `language-blocks` → `resolved` |
| `cross-store` 05, 08; `ux-blueprint` | out-of-vocabulary statuses corrected |

Three documents changed to stop this recurring: `docs/agents/triage-labels.md` (a PRD carries no
triage label; `wontfix` covers a park and names its trigger; the words that are not labels),
`docs/agents/issue-tracker.md` (the `.out-of-scope` convention, and the two traps that make a
status sweep lie), and the new `docs/adr/README.md` (a ticket must not reserve an ADR number).

## What was to move to `.out-of-scope`

The folder holds `wontfix` only, every file states its re-open trigger, the number is kept, and
`map.md` keeps linking to it. Five moves, and none of them is a whole feature.

| move | what goes | re-open trigger |
|---|---|---|
| **1** | `content-parity-log/42` — untranslated text, whole ticket | Ticket 39 is re-triaged and its axis conclusion holds, **and** axis A `work` on the non-`nl` stores is low enough that a second axis is readable — or a store goes live and untranslated copy becomes a launch blocker. |
| **2** | `content-parity-log/87` — three widths, the programme. Carve the touch-target sizing and the header wrap into `ui-polish` first. | Evidence that an editor reads the log on a phone or a tablet, or a request for it. |
| **3** | `content-parity-log/85` — **the drafting endpoint only**. The read-only panels stay in `issues/` as the ticket. | The next campaign, or the third time somebody hand-writes a selector and measures three pages by hand. |
| **4** | `content-parity-log/128` — **the six CSS conversions only**. The ADR clause, the three primitive dedups and the two comments stay. | Never, as retroactive work. The clause in ADR 0007 makes the next component do it the new way, which is the whole point. |
| **5** | `cross-store-reuse/06` and `/10`, **conditionally** — after the proposed probe reports. `07` reduces to the flattening reading rather than moving. | The probe finds a meaningful flattening count or a meaningful double-claim count. |

Two more files change status without moving, because `.out-of-scope` is for `wontfix` and these
are neither refused nor parked — they are **done, in their children**:

- `content-parity-log/58` -> `resolved — superseded by 93, 94, 95, 96, 97, 98`
- `ui-polish/07` -> `resolved — superseded by 08, 09, 10`

And four PRDs should stop carrying a triage role: `code-health`, `cross-store-reuse`,
`language-blocks`, `ui-polish`. `content-parity-log/PRD.md` already says why — *a PRD is not an
agent task and takes no triage role*.

## What that leaves

**15 live tickets**, in this order — corrected for the four that had already landed, and for
the three new ones:

```
  now        cross-store 11 (probe)                  the flattening and the pairing
             (code-health 01 is no longer queued: its `--deny-warnings` half landed
              in package.json on 2026-08-19, and whether the rest is a pre-commit
              hook, a CI workflow or nothing is an open decision. `needs-info`.)

  then       cross-store 09  ->  03  ->  04          the no-new-data half
             cpl 141                                 order by what is left
             ui-polish 13                            touch targets, header wrap

  then       cpl 93  ->  94  ->  95  ->  97  ->  98  the meta chain
             cross-store 02                          re-read the matcher: BYTES.md
                                                     says a digest pairs directly

  then       cpl 129                                 tooltips - re-price, it is 11 not 36
             cpl 125                                 lang on content cells
             cpl 85 (panels only)                    what the log is blind to
             cpl 128 (ADR + primitives)              drift prevention

  when 11    cross-store 07                          re-triage: which half survives
  reports    cross-store 10, 06                      un-park, or leave refused

  calendar   re-run the churn probe ~2026-09-02      the run log needs to be older
             than 21 minutes before its own question can be answered
```

`cross-store-reuse/CHURN.md` is `ready-for-human` and stays that way: the human decision it is
waiting on is whether to accept *do nothing for a fortnight* as the answer. This audit's reading
is that we should.

## The one pattern worth naming

Three tickets on this list exist because a dependency was bought and never used:
`Tooltip` (129, zero importers since ticket 74), `dialog.jsx` (ui-polish 10, used nowhere since
ticket 74), and the anti-slop plugin plus the type-check (`code-health` 01, **2,121** lines that
decide nothing). ADR 0007 bought the first two for the accessibility work the interface was not
doing. **That is not a coincidence, it is a habit** — and all three of those tickets are cheap,
which is the good news.

> **Corrected 2026-08-19.** One of the three has since been taken up: `ui-polish` 10 landed and
> `Annotate.jsx:13` imports `ui/dialog.jsx`. `ui/tooltip.jsx` is the one that is still dead, at
> zero importers over 53 lines. The habit is real; the count is two, not three.

---

# Appendix A — the other open tickets

Not `ready-for-agent`, so not prototyped above. Listed so the overview is complete.

> **It was not complete.** A full census on 2026-08-19 found three things missing from this
> appendix: `ui-polish` **12** (*a commit swept two staged deletions*, `needs-info`), and two
> whole folders — **`ux-blueprint`** (a `TRIAGE.md` record, which carried the retired status
> `closed`) and **`repro`** (throwaway scripts, no tickets). The reason is the one Appendix B
> half-names: `.out-of-scope` is dot-prefixed, so a plain glob skips it, and two spellings of
> the status line are in use. `docs/agents/issue-tracker.md` now records both traps.
>
> Also found: `cpl` **104** is indeed stale as suspected here — it reads `ready-for-human — all
> five parts landed`, which is a `resolved` line wearing a triage label. It is the branch we are
> on and it should be closed properly with its commit.

## `ready-for-human`

| ticket | note |
|---|---|
| `cpl` 104 — a scoped search says which kind of nothing | *all five parts landed.* The status line looks stale; this is probably `resolved`. Worth checking — it is the branch we are on. |
| `cpl` 133 — the dashboard wears its tone | absorbed 134 and 135. Rewrites the dashboard and the ledger, which is why `ui-polish` 07 states it is *not* blocked by it. |

## `needs-triage`

| ticket | note |
|---|---|
| `cpl` 39 — class vocabulary axes | Demoted from `ready-for-agent` on 2026-08-13. **It blocks 42**, which is why 42 is not ready. |
| `cpl` 40 — coverage, missing pages | Demoted 2026-08-13; its interaction model was overtaken. |
| `cpl` 43 — alt language and meta | Demoted 2026-08-13; its reason for being separate no longer holds. |
| `cpl` 44 — heading outline shape | Demoted 2026-08-13; its class-split argument is stale. |
| `cpl` 117 — the page keeps one h1 | |
| `cpl` 136 — a recheck says whether anything changed | |
| `cpl` 137 — hidden for a reason that is not a width | |
| `cpl` 49 — be/fr shared-host blind spot | Sits in `.out-of-scope` and was **re-opened**. A `needs-triage` file in a `wontfix`-only folder breaks that folder's first rule; it should move back to `issues/` or go back to `wontfix`. |
| `gallery` 03 — four galleries render nothing, six URLs are gone | |
| `ui-polish` 06 — a finding says when it was first seen | Duplicates `cpl` 77, which is **resolved**. Likely closeable. |

**39, 40, 43 and 44 are one decision, not four.** All four were demoted on the same day for the
same kind of reason — their class-and-axis reasoning was overtaken by tickets 75, 86 and ADR 0005.
They should be triaged together, and 42's fate follows from 39's.

## `needs-info`

| ticket | note |
|---|---|
| `ui-polish` 11 — the high-priority pill is a fourth amber | Blocks nothing; `ui-polish` 04 shipped *resolved except the priority's colour, which is issue 11's to decide*. |
| `cross-store-reuse/PROTOTYPE.md` | Not a ticket. |

## Superseded, already recorded

`cross-store-reuse` 05 and 08, both superseded 2026-08-19 by ticket 10. Ticket 10's criteria
include removing everything 08 built — the `record_layout` table and its SQL, the reading kind, the
date guard, the record id, the complement's polarity. **If 10 is parked, that removal is parked
with it**, and 08's code stays in the tree with no ticket owning it. That is worth a line in
whichever decision gets made.

---

# Appendix B — method

- Statuses read from the `Status:` line of every markdown file under `.scratch/`, per
  `docs/agents/issue-tracker.md`. Two conventions are in use — `Status:` and `**Status:**` — which
  is why a naive scan misses about a third of the files. Worth standardising.
- Every one of the 26 tickets was read in full or, for the four longest, down to and including its
  acceptance criteria and traps.
- Numbers quoted are the tickets' own measured figures, taken from the ticket that measured them
  rather than the ticket that cites them. Where those disagree — `no-route` at ~150 against 85, meta
  at ~130 against 197 — the later measurement is used and the discrepancy is named.
- No code was read. Where a ticket carries a *verified in the tree* note (85, 87), that note is
  taken at its word and dated.
