# PRD — The log becomes a workspace

Type: prd
Status: live, half delivered — 2026-08-13: of the twenty tickets it names, **eleven have
landed** (31, 72, 73, 74, 75, 76, 81, 82, 88, 89, 90), **one is parked** (84, `wontfix`
with 20), and **eight are open** (77, 78, 79, 80, 83, 85, 86, 87) — of which **85 and 87
are part-built**; see the notes at the top of those two. (First written as *ten landed,
nine open*, counting 74 as open. A triage sweep the same day found 74 built in commit
`34a9e96` with its status line never moved.) A PRD is not an agent
task and takes no triage role; the roles in `docs/agents/triage-labels.md` belong to the
tickets. **This document does not track the tickets opened after it** — 91 onwards are in
`map.md`, which is where the working order lives.
Parent: map.md
Origin: the product proposal of 2026-08-10, and the grilling session that read it
against the code and the corpus.

This document **supersedes** `content-parity-product-improvements.md`. That draft used
words this repo has retired and asked for several things that were refused with reasons.
The corrections are in **Further notes**. Where this document and the draft disagree,
this one is live.

Nineteen tickets carry the work — **72 to 90**, opened together in commit `11d4f4b`.
**Ticket 31 makes a twentieth**: it pre-dates this document and was folded into the list
rather than reopened, which is why *The tickets* below names twenty. Five ADRs carry the
decisions. This document says why.

> **The mute is withdrawn, 2026-08-13.** [ADR
> 0011](../../docs/adr/0011-the-mute-is-withdrawn.md) supersedes ADR 0008 and removes the
> `muted` override and the `page-class` scope from the model; a dismissal is the only
> judgement an editor can make. Every passage below that promises a mute is annotated where
> it stands, and stories **18 to 22** are struck. Nothing is deleted: this document is the
> record of what was asked for on 2026-08-10, and the refusal it recorded at *Remove Class
> Mute* is what the ADR reverses. Tickets 111 to 115 carry the withdrawal. The one thing
> the mute was wanted for — a whole class — is **class visibility** and ticket 86.

---

## Problem statement

An editor opens the log and it tells them what differs. It does not help them work.

- **The volume is not a queue.** 22,990 shown findings over 373 comparable pages. A page
  holds a median of 37, 151 at the 90th percentile, and 399 at worst. Ninety per cent
  coverage costs about 5,930 decisions, and 3,925 differences occur exactly once. There
  is no version of this that an editor drains.
- **The same difference arrives hundreds of times.** One footer line, one banner, one
  shared block. 8,229 distinct differences make 22,990 findings, and the editor meets
  each repeat once per page.
- **A decision does not survive the content.** A dismissal is keyed on the text, so
  production edits a word and last month's judgement is gone with no trace of what was
  decided or why.
- **The one durable decision is too blunt to use.** *Klasse dempen* can hide 173
  findings in one press. It asks for no reason, records no section, names no scope, and
  persists for ever.
- **The words for "done" hide the difference that matters.** A claim of fact and a
  judgement behave oppositely against a re-check, and one word for both loses that.
- **Reading the page costs more than deciding about it.** The view shows every block in
  document order, so the editor scrolls past agreement to reach work.
- **Campaign content needs a developer.** The banner leaves the log through a selector
  anchored on this campaign's option ids, so the next campaign needs a new commit.

## Solution

Three levels, and each answers one question.

- **The backlog** answers *where is the work*. Per store, two views over one derivation:
  a list of **repeats** worst-first, and a list of pages. The repeat is the unit of
  decision, so one shared block is one row.
- **The content view** answers *what is different, and where*. It stays the whole page in
  document order and it opens on the differences, with runs of agreeing blocks collapsed
  into a **context marker** that expands.
- **History** answers *what did we already decide*. A **run log** says when each finding
  was first seen and when it was last seen. A closed finding leaves a display-only
  **history note** beside its successor. Nothing is ever re-attached.

Three rules hold the shape:

- **Crawls observe. Humans decide. Neither writes the other's record.**
- **A judgement that never expires must be auditable**: it names its scope, states how
  much it hides, and carries a reason.
- **Progress reads as how much is decided**, never as how much is left.

## User stories

### Finding the work

1. As a content editor, I want the store's differences listed worst-first as repeats, so
   that one shared block is one decision instead of three hundred.
2. As a content editor, I want each repeat row to show both how many findings and how
   many pages it covers, so that I can tell a wide problem from a deep one.
3. As a content editor, I want to open a repeat and see its pages, so that I can check a
   sample before I decide about all of them.
4. As a content editor, I want a page name in that list to open the whole page, so that I
   can see a difference in its context rather than as a fragment.
5. As a content editor, I want a page list beside the repeat list, so that I can still
   work a single page from beginning to end when that is the job.
6. As a content editor, I want the class pills to be the way into the repeat list, so
   that I do not learn two filtering mechanisms.
7. As a content editor, I want to search the content of both sides, the link text, the
   link targets and the anchor headings, so that I can find a phrase I remember rather
   than a page name I do not.
8. As a content editor, I want search to cover active work by default and to offer closed
   work, so that the common case needs no options.
9. As a content editor, I want the store's counts to say how much is decided, so that a
   growing corpus does not read as a regression.
10. As a migration lead, I want absolute counts beside every percentage, so that a moving
    denominator cannot flatter or alarm.

### Deciding

11. As a content editor, I want three buckets — Open, Needs attention and Closed — so
    that I can see what waits for me without reading five state words.
12. As a content editor, I want Needs attention to hold exactly the findings somebody
    claimed to have fixed that still differ, so that the bucket means one thing.
13. As a content editor, I want Closed kept out of my working view, so that finished work
    does not sit between unfinished work.
14. As a content editor, I want to dismiss a whole repeat with one reason, so that one
    footer line is one decision.
15. As a content editor, I want to be told, before I press, how many findings a bulk
    decision covers, so that I never bury work by accident.
16. As a content editor, I want a partial failure reported honestly as "23 of 30 saved",
    so that I know what to do again.
17. As a content editor, I want to be told that a bulk dismissal covers only these
    findings, so that I am not surprised when a new page brings the difference back.
**Stories 18 to 22 are struck, 2026-08-13, ADR 0011.** All five were built by ticket 88 and
all five are withdrawn with their subject. They are kept numbered so that the mapping in
`RUNBOOK.md` — *81 → PRD 1–6, 82 → 7–8*, and the rest — does not shift under a reader.
Story 20's *reason* and story 21's *who, where and why* are what made the measurement in
ADR 0011 possible, so they were answered before they were retired.

18. ~~As a content editor, I want to mute a class **under one heading**, so that I can
    silence a section without hiding half the page.~~
19. ~~As a content editor, I want the page-wide mute still available, so that a gallery
    page whose headings are captions does not cost me 239 presses.~~
20. ~~As a content editor, I want a mute to require a reason, so that the one decision that
    never expires can be reviewed later.~~
21. ~~As a reviewer, I want to see who muted what, where and why, so that a silent page can
    be explained a year from now.~~
22. ~~As a content editor, I want to choose between a dismissal and a mute knowing that one
    expires and one does not, so that I pick the behaviour I mean.~~ — the choice is gone
    because one of the two is gone. What survives of this story is that a dismissal says
    plainly that it expires with the text.

### History

23. As a content editor, I want each finding to say when it was first seen, so that new
    work is distinguishable from work that has been waiting.
24. As a content editor, I want a finding that is no longer in the snapshot marked as no
    longer seen, so that I do not look for something that is gone.
25. As a content editor, I want a new finding to show what closed on the same page in the
    same run and what was decided about it, so that I can see my own earlier reasoning.
26. As a content editor, I want that note to be plainly not actionable, so that I do not
    mistake an old decision for a current one.
27. As a rule author, I want the tool never to assert that two findings are the same
    finding, so that a dismissal can never land on text nobody dismissed.
28. As a migration lead, I want the history of the record itself available, so that I can
    ask what changed between two runs.

### Reading a page

29. As a content editor, I want the page to open on the differences, so that I start on
    the work.
30. As a content editor, I want runs of agreeing blocks collapsed into one row that says
    how many they are, so that I can see how far apart two findings sit.
31. As a content editor, I want to expand any collapsed run, so that I can tell whether
    missing text is gone or moved.
32. As a content editor, I want the class named on each row rather than implied by a
    colour, so that a screen of differences still tells me what kind each one is.
33. As a content editor, I want document order preserved, so that a difference stays
    findable by scanning and the heading list still works.
34. As a content editor, I want the word-level diff where two texts both exist, and
    something more useful where one side is simply missing.

### Organising

35. As a content editor, I want to set a priority on a page, so that a campaign deadline
    is visible in the list.
36. As a content editor, I want to write a note on a page, so that I can say why it
    matters.
37. As a content editor, I want to set either on many selected pages at once, so that a
    campaign is one action.
38. As a content editor, I want to filter the store by priority together with the class
    filter, so that I can reach one slice of work.
39. As a content editor, I want my page notes to be findable by search, so that a phrase I
    wrote is as findable as a phrase production wrote.

### Scope

> **Stories 40, 41, 42 and 44 are parked, 2026-08-11.** Tickets
> [20](issues/.out-of-scope/20-one-sided-pages-checklist.md) and
> [84](issues/.out-of-scope/84-a-one-sided-page-carries-a-migration-decision.md) closed
> `wontfix` together. The four decisions in story 40 came from
> `content-parity-product-improvements.md` §14 — a draft whose own header says "do not
> build from it" — and were restated here as wants of a "migration lead" in the same pass
> that invented the role. No person and no measurement asked for them. The user refused
> both the vocabulary (*"usually, every page needs to be built"*) and the prototype of the
> surface, because the store dashboards already show one-sided pages. The stories are kept,
> not withdrawn, because other tickets cite story numbers. **Story 43 is unaffected and
> already holds**: `web/src/components/Dashboard.jsx:33-36` keeps one-sided pages out of the
> bar, with a test.

40. As a migration lead, I want a one-sided page to carry a decision — migrate, not
    migrated, replaced or redirected — so that scope work has a record.
41. As a migration lead, I want a page claimed as redirected that still answers 404 to
    read as contradicted, with the claimer's name, so that a claim of fact is checked.
42. As a migration lead, I want "intentionally not migrated" to survive a re-check, so
    that a judgement is not overturned by a crawl.
43. As a migration lead, I want one-sided pages kept out of the parity bar, so that scope
    work does not read as editor work.
44. As a migration lead, I want the one-sided list to show how many are decided and how
    many wait, so that it is a checklist and not an aside.

### Knowing what the tool is blind to

45. As a migration lead, I want the excluded pages listed with their reasons, so that an
    excluded page is visibly excluded and never silently absent.
46. As a migration lead, I want the excluded regions listed with their coverage, so that I
    can see what left the log and how much.
47. As a migration lead, I want a warning the day an exclusion stops matching, so that
    thousands of returning findings are not a mystery.
48. As a rule author, I want to draft an exclusion entry by measuring a selector, so that
    adding one costs a paste rather than an afternoon.
49. As a rule author, I want every class listed with what it is for and how many findings
    it makes, so that the vocabulary is reviewable.
50. As a content editor, I want campaign copy classified as campaign whichever campaign it
    is, so that a new campaign needs no developer.

### Working conditions

51. As a content editor, I want the interface usable on a phone and a tablet, so that I
    can check a page away from my desk.
52. As a content editor, I want a wide table to scroll sideways rather than crush itself,
    so that a diff stays readable.
53. As a content editor using a keyboard, I want dialogs, menus and tabs to behave
    correctly, so that I can work without a mouse.
54. As a rule author, I want the log on a current framework, so that a security or
    dependency problem is not blocked by two major upgrades.

---

## Implementation decisions

### Identity and history

- **A finding id stays content-addressed and expiring.** Ticket 01 stands. There is no
  durable per-element key: an element carries no DOM path, and `anchorHeading` is out of
  the id on purpose.
- **The run log is a committed index, keyed on the finding id alone.** `crawl/` writes it,
  `compare/` and `web/` read it. It is rewritten each run, and **git history is the
  archive**. Shape, which is the decision:

  ```
  findingId → { store, page, class, firstSeen: observationId, lastSeen: observationId }
  ```

  No text, no decision, no relation between two ids.
- **It never re-attaches.** No threshold, score or suggestion. The word **"Changed"** is
  refused. ADR 0004.
- **The history note is derived at render time** from the run log and the current derived
  override state. It is a display-only difference: no id, no override, no place in a bar,
  and no control.
- **A re-check does not write the run log.** Ticket 71 established that a press of
  *Hercontroleer* is one editor's observation of one page and must never move a corpus
  measurement. The run log is a corpus measurement. A page showing a re-check therefore
  shows first-seen dates from the last crawl, which is slightly stale and honest.

### State, buckets and overrides

- **A finding still has no stored state.** ~~Five~~ **Four** derived states stay: `open`,
  `dismissed`, ~~`muted`,~~ `fixed`, `contradicted`. Ticket 09 stands. — **2026-08-13, ADR
  0011.** Ticket 114 took `muted` out of the derivation.
- **A bucket is a grouping over those five**, derived and never stored. Three buckets,
  named with words the glossary already holds:

  ```
  Open            → open
  Needs attention → contradicted
  Closed          → absent from snapshot | dismissed | fixed and not contradicted
  ```

  **`| muted` struck from Closed, 2026-08-13, ADR 0011.** The three buckets are unchanged
  and the fourth term is simply gone. See ticket 80, which is sequenced behind this.

  A stale page review is a **page badge**, not a finding bucket. Two scopes in one bucket
  would count one thing twice.
- ~~**The mute key gains the anchor heading.** A page-wide mute is the same key with the
  heading absent — one key shape, not two mechanisms. A null heading is a real section:
  the content before the first heading.~~

  ```
  store | page | class | anchorHeading?
  ```

  **Struck 2026-08-13, ADR 0011.** Built by ticket 88, applied to the table by
  `supabase/mute-anchor-heading.sql` on 2026-08-10, and withdrawn with the key it narrowed.
  The over-reach was never in the heading: it was in the key covering what the editor had
  not selected, which is why narrowing it did not save it. **The anchor heading survives**
  as a locator — it is how a finding says where it is on the page — and that role never
  depended on the mute.
- ~~**A mute states its finding count before the press and requires a note.** The count is
  computed on the current snapshot. The note is enforced in the database, as a dismissal's
  is, so the rule does not live in the browser alone. ADR 0008.~~ — **struck 2026-08-13,
  ADR 0011.** The database check on the note survives for the dismissal, which is the only
  judgement left; `supabase/schema.sql` marks the `muted` half retired rather than dropping
  it, because eleven rows in the table contradict any constraint saying a mute is
  impossible.
- **The overrides table stays one append-only table.** New actions, no new scopes beyond
  what each already needs, no mutation, no delete. Action vocabulary after this work:

  ```
  finding     : fixed | dismissed | cleared
  page        : reviewed | noted | prioritised
              | migrate | not-migrated | replaced | redirected
              | cleared
  ```

  **The `page-class : muted | cleared` line is struck, 2026-08-13, ADR 0011.** The scope
  leaves the vocabulary. It stays in `supabase/schema.sql`'s `check` constraints, marked
  retired, because the table holds eleven `page-class` rows and they are not deleted.
- **Bulk is N events, never a key.** One seam change makes it possible: the append path
  must take a target page instead of reading it from the report on screen. That one change
  serves bulk dismissal ~~and bulk mute~~ both. — **2026-08-13, ADR 0011: it serves one
  press, not two.** Ticket 112 removed `bulkMute()`. The seam is unchanged, which is the
  point of it.
- **`PRIORITIES` is a closed list in `shared/`**, not in the database — a browser island
  must read it without `node:crypto`, and a closed list in git cannot drift.
- **There is no owner field and no login.** An editor is a name in `localStorage`.
- **Migration decisions split by kind.** `replaced` and `redirected` are claims of fact and
  lose to re-check, so a page claimed redirected that still answers 404 is contradicted.
  `not-migrated` is a judgement and beats re-check. `migrate` closes nothing. A note is
  required on all but `migrate`.

### Classification

- **`shown` becomes one visibility field.** `work | information | diagnostic`. It replaces
  the boolean; it is not a second axis, because the class is the only axis ~~and it is the
  mute key~~. ADR 0005. — **2026-08-13, ADR 0011: the class is the only axis and it keys
  nothing.** The conclusion is unchanged and one of its two reasons is gone; ADR 0005 is
  amended in place. Visibility is now also the mechanism that does the job the mute could
  not: one word, applied once, covering every store and every future crawl.

  ```
  work        → counts
  information → renders, does not count
  diagnostic  → behind the noise toggle
  ```

- **The migration is count-neutral.** Every currently shown class becomes `work`; the nine
  hidden classes are triaged once, in git. A class that later moves is its own ticket with
  its own measurement.
- **"Excluded from comparison" is not a visibility.** A region leaves at extraction, so it
  never reaches a class.
- **`heading-level` moves to `information`** in a separate, measured ticket. It is 1,215
  findings, 5.3% of shown, and it re-bases the bar.
- **The campaign rule fires one-sided.** The pattern is generic; the current selector
  anchors on this campaign's option ids and needs a commit per campaign. A research ticket
  measures the false positives first **and may refuse the change** — the pattern is Dutch,
  which is the objection ADR 0003 used against a Dutch text anchor, and the banner also
  carries link findings a text rule cannot reach.

### The interface

- **The content view is the spine; the word diff is a cell renderer.** 82% of shown
  findings are one-sided and `copy` is 3.4%. ADR 0006.
- **The context marker** collapses a run of equal rows and states its block count. Document
  order is untouched: it folds, it does not reorder, so it is not a view mode and ticket 37
  keeps that question.
- **The row tint goes while runs are collapsed**, and the class pill carries the class. A
  tint on every visible row is what killed the retired *Diff* tab.
- **`view.mjs` remains the only module that decides what is on screen.** The repeat
  grouping, the marker and the search query all live there, and a filter still moves no
  count.
- **A repeat is a grouping the interface makes**, not data. Key: `class`, `prod`, `new`,
  `detail`, **within one store**. It never crosses a store, because the stores translate
  the text.
- **Search is one index per store, emitted at build time, scanned linearly.** No search
  library. Notes come from the database and are filtered separately, and the two halves are
  never presented as one moment.
- **The Tasks tab goes.** The four check tabs and the repeat view cover it.
- **The `pagina's gelijk` chip goes.** The equal **rows** stay, behind the markers.

### Scope and exclusions

- **Exclusion lists stay committed and read-only from the browser.** ADR 0003 and ticket 19
  stand: extraction-time removal, exact keys, measured caps, no pattern typed into a
  browser, and no authentication to protect it.
- **Drafting an entry belongs to the local service.** No stage retains markup, so a selector
  can only be measured against live pages. The drafting endpoint fetches the three pages
  ADR 0003 requires and returns the counts. The hosted build shows no control, because
  nothing answers the health probe. The panel writes nothing anywhere.
- **A stale exclusion is surfaced as a warning**, not as a row. An entry removed on zero
  pages is either a dead anchor or a fixed site, and either way somebody must look.

### Stack

- **Astro 5.14 → 6 → 7, one major per ticket, nothing else in either diff.** The gate is a
  build compared against the build before it, with every difference explained. Node floor
  rises to 22.12.0 and binds the crawl scripts and the local service too.
- **shadcn on Base UI, seven primitives, behaviour only.** Dialog, Popover, Tooltip, Select,
  Checkbox, Tabs, Table. `palette.mjs` stays the source of truth for tone; the chips and the
  diff renderer are not rebuilt. `jsconfig.json` provides the `@/*` alias and no TypeScript
  is introduced. ADR 0007.

---

## Testing decisions

### What a good test is here

A test names external behaviour: given this data, the derivation returns this. It does not
reach the network or the disk, and it does not assert how a component renders.

Two rules from the repo carry more weight than the rest:

- **A rule with no test is not a rule.** The comparison rules are the crown jewels.
- **A filter never moves a count.** This is pinned today and every interface ticket here
  must leave that pin passing unchanged.

### Seams

Seventeen of the nineteen tickets test at seams that already exist. Existing seams are
preferred, and the highest available one is used.

| seam | what it takes |
| --- | --- |
| `compare/contract.mjs` | ~~the mute key gaining the anchor heading~~ (struck 2026-08-13, ADR 0011 — `shared/mute-key.mjs` is deleted); the class pins moving to the visibility groups |
| `compare/vocabulary.mjs`, `compare/text.mjs`, `compare/images.mjs` | the visibility field; the one-sided campaign rule, in both directions |
| `overrides/state.mjs` | the three buckets, the history note, the two annotations, the migration decisions and their contradiction rule, ~~mute precedence under the new key~~ (struck 2026-08-13, ADR 0011 — `muteCoverage()` and the `page-class` branch are gone; the eleven historical rows still load as events) |
| `web/src/lib/view.mjs` | the context marker, the repeat grouping, the search query |
| the overrides **port** | the write boundary for bulk, exercised with a fake port |
| `web/src/lib/reports.mjs` | the build-time search index, and the run-log read |

**One new seam**, and only one: the run-log derivation, a pure function of the previous
index, the finding ids in this snapshot and this observation id, returning the next index.
It goes in `shared/`, because `crawl/` writes it and `web/` reads it — ADR 0001's rule for
a pure rule that two stages need. Everything else about the run log is file access and
rendering around that function.

### Prior art

- `compare/contract.test.mjs` pins the literal class count and the sorted class sets. The
  visibility change rewrites those pins rather than deleting them.
- `web/src/lib/view.test.mjs` pins that the filter derivation returns nothing else. The
  marker and the repeat grouping extend it in the same style.
- `web/src/lib/recheck-choice.test.mjs` is the model for a pure decision with no clock: a
  string comparison stands in for a time comparison. The run-log derivation follows it.
- `web/src/lib/palette.test.mjs` pins the token maps, and it must stay green through the
  shadcn work.
- The HTTP layer keeps smoke tests that reach neither the network nor the disk. The
  drafting endpoint joins them.

### Regression gates worth naming

- **The run log must not churn.** Two runs over an unchanged site move no first-seen date.
- **The visibility migration must move nothing.** Per-store totals identical before and
  after.
- **Class changes are not removals.** The one-sided campaign rule moves findings between
  classes and the total must not change.
- **Two measurements where two effects oppose each other**, per ticket 33 and ticket 58: a
  single number would hide both.

### Verified by hand, and recorded in the ticket answer

Two areas get no automated seam, deliberately. **No browser automation is added**: ticket
19 ruled it out and the line stays whole.

- The Astro build comparison, twice.
- Keyboard behaviour, and the three widths, checked on a store dashboard, the worst page,
  a two-finding page and a non-comparable page, with the pages named in the answer.

---

## Out of scope

- **Axis B.** Every decision here is axis A. Axis B keeps its own tab and its own bar and
  is never summed, per ticket 11. This is stated so the silence is not read as a decision.
- **Any all-stores surface.** A store is the unit an editor is responsible for, per ticket
  38. That includes cross-store search and cross-store repeats.
- **Editable exclusion lists.** Read-only, plus a drafting aid.
- **User-defined columns.** Add, rename, reorder, hide, remove and edit-options is a schema
  editor. Two fixed annotations instead.
- **Ownership and authentication.** No owner field. If ownership is wanted it is its own
  effort.
- **The Meta check.** Ticket 58 already owns it, already written. Keywords and a raw robots
  string are not extracted today, and `h1` already belongs to the head extract.
- **Grouping a page's rows by done and not-done.** Ticket 48's want, still live, still
  blocked by ticket 37. This work does not deliver it.
- **Re-attachment of a decision across a text change**, in any form, including a
  human-accepted suggestion.
- **Browser automation**, in the crawl and in the tests.
- Everything the map already rules out: CRO advice, Magento write-back, product detail
  pages, blogs, phase-2 rewrites, and fixing the storefront defects the log finds.

---

## Further notes

### Corrections to the superseded draft

| the draft said | the decision |
| --- | --- |
| Current website / New website | **Production** / **New site** — they are in the data as `side` |
| Store Backlog | **Dashboard**, which the glossary already defines |
| Finding *states*: Open, Needs attention, Resolved | **Buckets** over five derived states, and the third is **Closed**. "Resolved" stays retired |
| `Changed` findings, with previous decisions carried across | **refused.** A history note instead, display-only, asserting no identity |
| Remove Class Mute | **refused.** The key narrows; the tool is the only one that survives a text change. — **Reversed 2026-08-13: the draft's answer was right, and this refusal was wrong.** Not because the argument above is unsound — a dismissal does still expire with the text — but because the feature was measured after it was hardened. Eleven `muted` rows in the table, all `nl`, all one editor, ten revoked by their own author, six noted `Test`; and the one job anybody wanted it for, a whole class, is hundreds of presses it can never finish. That is the class's job, not a page's. See [ADR 0011](../../docs/adr/0011-the-mute-is-withdrawn.md), which supersedes ADR 0008, and tickets 111 to 115 |
| Remove the campaign exclusion, editors dismiss instead | **refused.** It was 4,055 findings, and a dismissal expires with the campaign copy. The rule becomes one-sided instead |
| Remove Equal | the dashboard **chip** goes; the equal **rows** stay, collapsed |
| Custom columns, add / rename / reorder / hide / remove | two fixed annotations, and no owner |
| Comparison settings, editable from the dashboard | read-only, plus a drafting aid on the local service |
| Meta: Keywords display-only, `h1` in Inhoud | neither is extracted today; `h1` is already in the head. Ticket 58 |
| Remove Heading Level | it becomes `information`, measured, and it re-bases the bar |
| shadcn, `pnpm dlx` | the repo is npm |
| Upgrade to Astro 7 | two majors, 5 → 6 → 7 |

### The numbers this rests on

Measured 2026-08-10 over 448 reports: **33,507 findings, 22,990 shown**, 373 comparable
pages. `text-missing` 49.3%, `missing-link` 21.0%, `image-missing` 12.1%, `heading-level`
5.3%, `link-target` 4.7%, `copy` 3.4%. **8,229 repeats**; 116 covered a quarter and 903
covered half; 3,925 are singletons. Per page: median 37, p90 151, max 399. ~~Mute keys:
2,101 `page + class` groups at median 4 and p90 25, against 7,639 with the heading at
median 1; largest single press 173.~~ — **the mute-key row is spent, 2026-08-13, ADR
0011.** It is kept because it is the measurement ADR 0008 was argued from, and the 173 is
the number that made ticket 88 urgent. Every other figure in this paragraph still stands.

Two caveats travel with all of it. The head of the repeat distribution was the promo
banner, which ticket 64 has excluded and the reports on disk pre-date — so one ticket
re-runs the curve before anything is designed against it. And tickets 50, 54 and 55 take
the corpus from 451 to about 800 store-pages, concentrated in the four thin stores, so no
surface may assume a store is small.

### Sequencing risks

- ~~**The mute change is free now and will not stay free.** No mute is live in any store. The
  table is append-only, so a mute written under the old key can never be repaired, only
  superseded.~~ — **struck 2026-08-13, ADR 0011, and the risk it named came true the same
  day it was written.** *No mute is live in any store* rested on ticket 65's read of
  2026-08-07. On **2026-08-10 at 11:07** an editor wrote the mute that ticket 111 had to
  revoke by hand — `nl` · `downloads` · `text-missing`, note `"Negeren"`. So the window this
  paragraph said would close did close, and ticket 88 landed inside it. What the row bought
  in the end was not a repair but the evidence: eleven `muted` rows to measure, which is
  what ADR 0011 is argued from.
- **The campaign research may refuse the campaign build**, and that is a valid outcome.
- **The two Astro majors must carry no product change**, or a regression and a redesign
  become indistinguishable in the diff.
- **The responsive work goes last**, after the two tickets that change the shape of the
  screen.

### The tickets

Stack: 72, 73, 74. Contract and measurement: 75, 76, 77, 88, 89. Interface and the rest:
78, 79, 80, 81, 31, 82, 83, 84, 85, 86, 90, 87. Edges and reasons are in **Ready to
build** in `map.md`.
