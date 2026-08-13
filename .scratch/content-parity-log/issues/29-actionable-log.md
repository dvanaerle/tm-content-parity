# 29 — Spec: make the log actionable (overrides and re-check)

Type: task
Status: resolved — built 2026-08-06
Blocked by: 26
Parent: ../map.md
Implements: 03, 09, 10
Supersedes as the build instruction for: 10

> **The mute is withdrawn, 2026-08-13, [ADR
> 0011](../../../docs/adr/0011-the-mute-is-withdrawn.md).** This is the spec that **built**
> the mute, so the word runs through it — the precedence rule, user stories 6, 7 and 27, the
> `bar` shape, the five derived states, the schema. Read all of it as the record of
> 2026-08-06 and not as the model. It is not struck line by line: what it describes is what
> shipped, and it shipped correctly.
>
> Four things to carry across. There are **four** derived states, not five. **Nothing leaves
> the denominator** — story 27 asked for exactly the arithmetic that ADR 0011 removes, and
> `barOf()` no longer subtracts. The precedence rule *a finding-scope override beats a
> page-class mute* has nothing left to rank, so a `cleared` dismissal now falls back to
> nothing. And story 7 — *a muted finding stays visible behind a toggle* — is the claim that
> did not survive contact: the toggle showed the rows, and the count they had left was gone,
> which is what *hidden* turned out to mean in practice.
>
> Everything else in this spec is untouched and is still the tool: the pure derivation in
> `overrides/state.mjs`, the append-only table, latest-event-per-key, the claim-of-fact
> against judgement split, the contradiction rule, the local re-check service and the
> feature detection that hides its button.

## Resolution

Built. 141 tests green (was 101), 180 pages built, the service answers a live
re-check. `npm start` gives the whole tool.

`overrides/state.mjs` is the pure derivation and carries 34 of the new tests.
`overrides/supabase.mjs` is the port, three functions wide, faked in tests and
never constructed in one. `api/server.mjs` is the service and also serves
`dist/`. The contract gained `observationId` and `findingSetHash`, and
`supabase/schema.sql` was replaced.

**Five decisions the spec left implicit**, each now carrying a test:

1. **The bar is computed over the current snapshot only.** Ticket 09's "closed =
   absent + dismissed + uncontradicted fixed" cannot mean that an absent finding
   enters the numerator, because "absence beats everything" and a dismissal whose
   id is absent contributes nothing. So a corrected difference leaves the
   snapshot and leaves **both** sides of the fraction. The number that moves is
   the absolute open count, which is why ticket 09 insisted the counts are always
   shown.
2. **A finding-scope override beats a page-class mute** — the more specific key
   wins. A `cleared` finding override falls back to the mute underneath it.
3. **Observation ids are lexicographically sortable** (`ISO 8601 + random tail`),
   so "a *later* observation" is a string comparison and the derivation stays
   pure. A `fixed` claim carrying no observation is treated as older than
   everything and must prove itself.
4. **A `DiffRow` gained a `finding` id.** A row is a position and a finding is
   grouped, so they cannot be the same record — but an override control on a row
   must act on the finding, and the browser cannot recompute the id, because
   `findingId()` needs `node:crypto`. `FindingCollector.add()` now returns the id.
5. **The dashboard's `PageSummary` carries a compact finding index** (id and
   class, shown classes only). That is exactly what `deriveStoreState()` reads, so
   the dashboard and the page agree by construction rather than by two
   implementations of the same rules.

**Not done, and deliberately:** the Supabase project is not wired. `web/.env` does
not exist, so the log runs in its not-connected state — which is the designed
behaviour and is visible as a banner. Ticket 13 remains open and remains the one
real risk.

## Problem Statement

The log runs. Ticket 26 built the comparison and the interface, so an editor can
open any of the 124 comparable NL pages and read a list of differences against
production.

Then it stops. The editor can read, and can do nothing else.

- They correct a heading on the new site, and the log still shows the difference.
  Nothing they do changes any number, so the only way to see progress is to ask a
  developer to run three commands again.
- They meet a difference that is not a defect — a price that the two environments
  hold differently, one footer line that will never match — and they have no way to
  say so. The difference comes back on every snapshot.
- They finish a whole page, including the parts the tool cannot see, and there is
  nowhere to record that a human looked at it.
- A manager cannot answer "how far are we", because the only number is 8,573 and it
  never moves.

The destination says: *done when an editor can open any page in the log, see a
trustworthy list of differences, act on it, press Recheck, and watch the count fall
to zero.* Two of those five verbs are missing. **Act** and **Recheck**.

## Solution

An editor gets two powers, and a manager gets a number that moves.

**Act.** On any finding an editor can make a **fix claim** ("I corrected this"), a
**dismissal** ("these two exact strings are acceptable", with a note), or a
**mute** on a class for that page ("this class is never a defect here"). On a whole
page they can record a **page review** ("a human looked at all of this"). Every
action is an append to one table in Supabase, written straight from the browser, so
it works on the hosted snapshot with no server.

**Re-check.** When the local Node service is running, a **Recheck** button crawls
that one store-page pair again, on both sites, and returns fresh findings within a
button press. A difference the editor really corrected disappears. A difference
they only claimed to have corrected comes back as **contradicted** — *claimed
fixed, still differs* — with their name on it.

The two powers are deliberately unequal, and that inequality is the whole design:
a **judgement** beats re-check, a **claim of fact** does not.

## User Stories

### Acting on one finding

1. As a content editor, I want to mark one finding as fixed, so that the page count
   falls as I work instead of after somebody rebuilds the log.
2. As a content editor, I want my fix claim to survive a page reload, so that I do
   not lose an afternoon of work.
3. As a content editor, I want to dismiss a finding that is not a defect, so that
   it stops reappearing on every snapshot.
4. As a content editor, I want to be required to write a note when I dismiss, so
   that the next reader knows why a real difference was accepted.
5. As a content editor, I want **not** to be asked for a note when I claim a fix,
   so that a one-line copy correction does not cost me a sentence of prose.
6. As a content editor, I want to mute a whole class on a page, so that I do not
   click forty times to silence one thing that repeats.
7. As a content editor, I want a muted finding to stay visible behind a toggle, so
   that muting is not the same as deleting.
8. As a content editor, I want to clear any override I made, so that a mistake is
   one click to undo and not a call to a developer.
9. As a content editor, I want to see who made an override and when, so that I do
   not overturn a colleague's judgement without knowing it was theirs.
10. As a content editor, I want to dismiss the same difference on all thirty pages
    that carry it, so that one footer line is one decision.
11. As a content editor, I want my name attached to my overrides without logging
    in, so that attribution costs me nothing.

### Re-checking

12. As a content editor, I want to press Recheck on the page I just corrected, so
    that I see immediately whether my correction landed.
13. As a content editor, I want Recheck to take about as long as a button press, so
    that I stay in the flow of correcting a page.
14. As a content editor, I want the findings I claimed fixed and did not fix to come
    back after a Recheck, so that the log does not let me lie to myself.
15. As a content editor, I want a contradicted claim to say who claimed it, so that
    I can ask them what they actually changed.
16. As a content editor, I want my dismissals to survive a Recheck, so that the
    tool does not ask me the same question twice.
17. As a content editor, I want the Recheck button to be absent rather than broken
    when I read the log on the webhost, so that I do not press a button that
    cannot work.
18. As a content editor, I want everything else on the hosted snapshot to work
    normally without the service, so that the hosted copy is a real tool and not a
    degraded one.
19. As a content editor, I want to be told plainly when production is in
    maintenance mode during a Recheck, so that I do not read a maintenance page as
    a hundred new defects.
20. As a content editor, I want a Recheck that fails to leave the page as it was,
    so that a network problem does not lose my place.

### Reviewing a page

21. As a content editor, I want to mark a page reviewed while findings are still
    open, so that I can record "I looked at everything here, including what the
    tool cannot see".
22. As a content editor, I want a page I reviewed to say *changed since review*
    when its findings change, so that the words do not blame me for my own
    corrections.
23. As a content editor, I want a page review never to expire on its own, so that
    the log does not manufacture work.
24. As a migration manager, I want to see how many pages have a fresh review, so
    that I know how much of the site a human has actually read.

### Reading progress

25. As a migration manager, I want a progress bar for a page, so that I can see at
    a glance whether it is nearly done.
26. As a migration manager, I want the absolute counts beside every percentage, so
    that a larger crawl does not read as a regression.
27. As a migration manager, I want a mute to leave the denominator and a dismissal
    to enter the numerator, so that the bar distinguishes "not a defect here" from
    "I read this and accepted it".
28. As a migration manager, I want hidden classes in neither the numerator nor the
    denominator, so that the bar can reach zero.
29. As a migration manager, I want the store roll-up summed over findings and never
    over pages, so that a page with one casing nit does not weigh as much as a page
    with forty.
30. As a migration manager, I want the roll-up to cover axis A only, so that "done"
    stays definable.
31. As a migration manager, I want one-sided pages out of the bar, so that
    seventy-six undecidable rows do not poison it from the first day.
32. As a rule maintainer, I want a per-class breakdown as a filter and not as a bar,
    so that a class spiking across pages reads as a misfiring rule rather than as
    editor backlog.
33. As a migration manager, I want to sort the dashboard by open findings after
    overrides are applied, so that the worst page is the worst remaining page and
    not the worst page of last week.

### Trusting the tool

34. As a content editor, I want to be told when the override log is unreachable, so
    that I never read an empty override list as "nobody has done anything".
35. As a content editor, I want the log to go read-only rather than silently drop
    my clicks when Supabase is unreachable, so that I do not lose work I believe I
    saved.
36. As a developer, I want the override precedence rules to be a pure function with
    tests, so that the one rule the log's trustworthiness rests on cannot drift.
37. As a developer, I want one command to run the whole tool locally, so that I do
    not need three terminals to look at it.

## Implementation Decisions

### One new seam

**`overrides/state.mjs`** holds the only new tested boundary:

```
derivePageState({ report, events, observationId }) →
  {
    findings: [{ ...finding, state, override }],   // state, not stored anywhere
    bar:      { closed, denominator, muted, dismissed, fixed, contradicted },
    review:   { at, editor, fresh } | null,
  }
```

Pure. No network, no clock, no `Date.now()` — an observation identifier goes in as
an argument. It takes a `PageReport` from `compare/30-compare.mjs` and the raw
append-only event list, and it applies every rule ticket 09 settled. Everything
else in this spec is thin enough to test through this function.

A store-level `deriveStoreState({ reports, events })` reuses it and sums over
findings, never over pages.

### The state of a finding is derived, never stored

`state` is one of `open`, `dismissed`, `muted`, `fixed`, `contradicted`. A finding
still has **no** stored state; it has overrides, and this enum is what they add up
to. `contradicted` in particular is derived and never written.

Precedence, from ticket 09:

- **`dismissed` and `muted` win over the snapshot.** Re-check cannot decide what is
  acceptable.
- **`fixed` loses to the snapshot** — but only to a *later* one. See below.
- Absence beats everything: a finding the snapshot no longer gives is gone,
  whatever anybody clicked.

### Contradiction needs an observation identifier

Ticket 09 says a fix claim "counts as closed until it is contradicted", and that
this is what makes the button worth pressing on a frozen snapshot "where nothing
can contradict it". Those two sentences only agree if a claim knows **what it was
claimed against**.

So: **a `fixed` event records the observation it was made against, and it is
contradicted only when a *later* observation still gives the finding id.** A claim
made against the snapshot the reader is looking at is not contradicted by that same
snapshot — nothing new has been seen. A Recheck, or the next build, is a new
observation, and then the claim must prove itself.

An **observation** is therefore a first-class thing:

- A build of the log is one observation. `compare/30-compare.mjs` generates one
  identifier per run and writes it into every `PageReport`, plus a
  `data/snapshot.json` describing the run.
- A Recheck is one observation, generated by the service per request.

This is the one place where prose could not carry the decision, so it is stated as
the rule the tests are written against.

### Contract additions

`compare/contract.mjs` changes first, then the code, per the repo rule.
`PageReport` gains:

- `observationId` — identifies the run that produced this report.
- `findingSetHash` — a hash over the sorted finding ids of the **shown** classes.
  Page-review staleness is derived by comparing this to the hash recorded on the
  review event. It must be the shown set only, or muting something makes every
  review stale.

`builtAt` stays and keeps its current meaning.

### The Supabase table is respecified, not migrated

**`supabase/schema.sql` as committed is stale.** It encodes ticket 03's earlier
two-kind model — `kind in ('dismissal','mute')` with an `active` boolean — and
ticket 09 resolved afterwards and replaced it with three scopes and five actions.
The project holds no data yet, so this is a replacement and not a migration.

One append-only table, `overrides`:

| column | notes |
| --- | --- |
| `id`, `created_at` | identity and the ordering `overrides_current` uses |
| `editor` | the name from `localStorage`. There is no login. |
| `scope` | `finding` · `page-class` · `page` |
| `action` | `fixed` · `dismissed` · `muted` · `reviewed` · `cleared` |
| `store`, `page` | always present |
| `finding_id` | present when `scope = 'finding'` |
| `class` | present when `scope = 'page-class'` |
| `observation_id` | the observation the event was made against |
| `finding_set_hash` | on `reviewed`, for staleness |
| `note` | **required** when `action = 'dismissed'` |

Constraints carry the shape: a check tying each `scope` to its key column, and a
check tying each `scope` to the actions it allows. `cleared` is valid on every
scope, which is what replaces four `un-` verbs and the `active` flag.

Row level security stays exactly as ticket 03 argued: `insert` and `select`
policies for `anon`, and **no `update` policy and no `delete` policy**. The absence
of the policy is the protection. The anon key is meant to be public.

The `overrides_current` view keeps its shape — `DISTINCT ON (scope, store, page,
COALESCE(finding_id, class)) ORDER BY ... created_at DESC` — so the latest event
per key wins and the history underneath answers "who dismissed this, and who
cleared it".

### The Supabase port is narrow and injected

**`overrides/supabase.mjs`** exposes three functions and nothing else:

- `readEvents({ store, page })`
- `readEventsForStore(store)`
- `appendEvent(event)`

It is passed in, never imported by the derivation, and it is faked in tests. It
uses `@supabase/supabase-js` against the anon key, with no Realtime — ticket 03
ruled Realtime out.

**Failure is loud.** A read that fails surfaces a banner and puts the page in
read-only, and it never resolves to an empty event list: an empty list means "no
overrides", and a failed read must never be able to say that. This is the
requirement ticket 13 forced; it does not decide ticket 13's own question, which is
how to stop the pause happening.

### Bulk is a UI action that writes N events

"Dismiss on all thirty pages" writes thirty events. A third, site-wide key is
refused, because it would carry its own lifetime rules and re-open the risk ticket
01 closed — a dismissal quietly absorbing a later regression — this time site-wide.

### The re-check service

**`api/`** becomes a small Node HTTP server, no framework, no Playwright:

- `POST /api/recheck/:store/:page` → a fresh `PageReport` with a new
  `observationId`. It calls `extractStorePage()` from `crawl/20-extract.mjs` and
  `comparePage()` from `compare/30-compare.mjs`. Neither is re-implemented.
- Link status: `checkAll()` from `compare/link-status.mjs`, on **that page's**
  targets only, deduplicated within the page, with a cold cache. Ticket 05 forbids
  a site-wide sweep from the button; the probe did 37 targets in 1.1 seconds.
- A `MaintenanceError` becomes a plain refusal with the reason, never a result.
  Ticket 04: a run that records the maintenance page records phantom defects.
- `GET /api/health` → the endpoint the front end probes. Its only job is to exist.
- It also serves `dist/`, so one command gives the whole tool locally.

### Feature detection, not configuration

The front end probes `GET /api/health` once on load. Present: the Recheck button
renders. Absent: it does not, and nothing else changes. No build flag and no
environment variable, because the same static files are the hosted snapshot and the
local copy.

Overrides work in both, because they go straight to Supabase from the browser.

### What the interface gains

- A per-finding action control in the Diff, Links, Images and Tasks panels. One
  control, one place in the code, four call sites.
- A `contradicted` finding renders as open, in its class colour, with *claimed
  fixed, still differs* and the claimant's name.
- The page bar replaces the two count chips, with absolute counts beside the
  percentage.
- A page-review control in the page header, showing *changed since review* when
  stale — never "needs review".
- An editor-name prompt on first use, kept in `localStorage`.
- The dashboard sorts and counts on the derived state, so the worst page is the
  worst *remaining* page.

## Testing Decisions

A good test here asserts **external behaviour**: given a report and a list of
events, what state does a finding have and what do the numbers say. It never
asserts on how the derivation loops, and it never reaches the network.

**Prior art in this repo**, and the style to follow: `compare/compare.test.mjs` and
`crawl/extract.test.mjs`. Both are table-driven Vitest, each test named as the rule
it protects rather than as the function it calls, with a comment giving the
measurement or the ticket behind the rule. `npm test`. The repo rule stands: a rule
with no test is not a rule, and these precedence rules are the crown jewels now.

**`overrides/state.mjs` carries almost all of it:**

- The precedence matrix, every cell: each of the five actions against present and
  absent in the snapshot.
- `dismissed` and `muted` beat the snapshot; `fixed` does not.
- A `fixed` claim against the current observation is **closed**; the same claim
  against an earlier observation, with the finding still present, is
  **contradicted**. This is the test that stops the two halves of ticket 09
  contradicting each other.
- `cleared` revokes the latest event on its key, and only on its key.
- Latest-wins per key, with events supplied out of order.
- A dismissal whose finding id is absent from the snapshot contributes nothing —
  ticket 01's expiry, arriving for free.
- Bar arithmetic: a mute leaves the denominator, a dismissal enters the numerator,
  a hidden class is in neither, and the counts stay absolute.
- Review freshness in **both** directions: stale when the finding set grew, and
  stale when it shrank, because an editor un-freshens their own review by
  correcting things.
- A review with no later change is fresh.
- `deriveStoreState` sums over findings and not over pages: two pages, one with
  forty findings and one with one, must not weigh alike.

**The Supabase port is faked** — an array of events in, the appended event
captured. The real client is never constructed in a test, and there is no test
Supabase project.

**The re-check handler gets one smoke test each way**: a stubbed extract-and-compare
returning the expected response shape, and a `MaintenanceError` becoming a refusal
with its reason rather than a report. The extraction and the comparison are already
covered by their own suites and are not re-tested through HTTP.

**No browser tests.** The React panels are thin renderings of the derived state,
and a test of them would assert on markup.

## Out of Scope

- **Axis B.** Coverage is tickets 24 and 23, with its own bar that ticket 11
  forbids summing with this one.
- **Meta findings.** Ticket 21 has not decided what a parity defect in the head is,
  so the Meta tab stays display-only.
- **Ticket 13's own question** — how to stop a free Supabase project pausing after
  seven days idle. This spec requires that the failure is **loud**; it does not
  decide whether the answer is a paid tier, a scheduled ping or accepting the
  pause.
- **Tickets 27 and 28** — the category-page product grids, and whether 41 findings
  on a median page is usable at all. Both change what the numbers *are*; this spec
  only makes them movable. Neither blocks it, and it does not block them.
- **The upload procedure.** How a built snapshot reaches the webhost is still fog
  on the map.
- **Magento write-back.** Editing content from this tool is ruled out on the map.
- **`in progress` and `reopened`.** Ticket 09 refused both, and this spec does not
  reintroduce them.
- **A site-wide dismissal key.** Refused above, on ticket 01's grounds.
- **Login.** An editor is a name in `localStorage`. Ticket 03 ruled out Anonymous
  Sign-In.
- **Ticket 20's migration checklist** for one-sided pages. This spec only keeps them
  out of the bar, which they already are.

## Further Notes

**The Supabase project may not exist yet.** The map records ticket 03's access model
as decided and the schema as written, but nothing in the repo shows a project having
been created. Confirm before building, and if it must be created, that is a task for
a human at a dashboard, not for an agent.

**Ticket 13 is the one real risk to this whole feature.** A free project pauses
after about seven days idle and fails silently, and every override an editor makes
lives in it. The loud-failure requirement above is a mitigation and not an answer.
Resolve 13 before this goes in front of an editor.

**The order to build in.** Contract additions, then `overrides/state.mjs` with its
tests, then the schema, then the port, then the interface, then the service. The
derivation is worth building against hand-written event lists before any Supabase
project exists; it is a pure function, so it needs nothing else.

**Do not re-tune the comparison while doing this.** Ticket 28 warns that moving the
same rows twice makes the second change unmeasurable, and applying overrides moves
every number on the dashboard once already.
