# Ticket workflow — how a ticket becomes a session

Type: process
Status: ready-for-human
Parent: map.md
Origin: the review of 2026-08-11, which read the tickets, the map, the PRD and the
`tdd` and `implement` skills against the cost of one build session.

A build session costs 150,000 to 250,000 tokens today. Research costs 80,000 to
100,000 of it before the first test. This document says why, and it gives the
workflow that lowers it.

`WORKLIST.md` says **what to do next**. `RUNBOOK.md` says **why the order is what it
is**. This file says **how one step is worked**. `map.md` stays the map.

---

## The diagnosis

### 1. The tests are not the problem, and neither is the skill

The `tdd` skill already refuses horizontal slicing. It names it an anti-pattern, and
it states the rule twice:

> Work in **vertical slices** — one test → one implementation → repeat, each test a
> **tracer bullet**.

> **One slice at a time.** One seam, one test, one minimal implementation per cycle.

`AGENTS.md` says the same. So the rule is written down twice and it does not happen.
Two things override it.

- **`implement` is fifteen lines.** Its whole instruction is *"Use /tdd where
  possible, at pre-agreed seams."* There is no cadence and no gate.
- **A ticket looks like a batch.** Ticket 68 carries **sixteen** acceptance criteria
  in one flat list. An agent that reads sixteen boxes plans across sixteen boxes.
  That is horizontal slicing, whatever the skill says.

The correction goes in the ticket shape and in a local wrapper. It does not go in
`tdd`.

### 2. A ticket is too large because it is **mixed-kind**, not because it is long

Ticket 68 held four jobs with four different cost profiles.

| what it held | kind | cost |
| --- | --- | --- |
| n·m over 448 reports, and again after 67 | measurement | large read, no write |
| LCP and TBT on two pages, before and after | measurement | large read, no write |
| the cap number, the word *uncompared*, whether `blokken` stays | decision → ADR 0009 | conversation |
| the trim, the cap, the clamp, the anchor key, six tests | build | normal |

The 80,000 to 100,000 tokens of "research" is **measurement work that was scheduled
inside a build session**. It is not exploration of the codebase.

### 3. The standing context is 60,000 tokens, and no ticket says which part applies

```
map.md       16,417 words      RUNBOOK.md    9,602 words
WORKLIST.md   9,663 words      PRD.md        4,553 words
CONTEXT.md    3,806 words      9 ADRs       ~54 KB
```

That is about 40,000 words, or about 60,000 tokens, before an agent opens a source
file. Ticket 68 holds one line that controls this — *"Read ADR 0009 before you change
`compare/worddiff.mjs`"* — and it is the only such line in the file.

### What is **not** wrong

The map, the PRD and the ADRs are why the decisions have stayed stable over ninety
tickets. Do not change them. The problem is only at the boundary between a ticket and
a session.

---

## The three kinds of ticket

Split a ticket by **kind**, not by size.

| kind | it delivers | where it runs | cost |
| --- | --- | --- | --- |
| **measure** | one number or one table | a probe script, or a background subagent | ~2k in the main window |
| **decide** | an ADR | a grilling | conversation |
| **build** | code and tests | one session, `/clear` before it | 40k–70k |

### The rule that separates them

> **A build ticket holds no criterion that starts with *measure*, *re-run*, *count*
> or *verify in the browser*.**

If it does, that criterion is a different ticket, and that ticket runs first.

A build ticket carries **every number it needs, already written in it**. It measures
nothing.

### Ticket 68 under this rule

| | what | kind |
| --- | --- | --- |
| 68a | the diff cost over the corpus, before anything changes | measure |
| 68b | the trim and the cap in `compare/worddiff.mjs`, pure, five tests | build |
| 68c | the clamp and the anchor key in `web/` | build |
| 68d | first paint on the two named pages, before and after | measure |

Each build ticket is 40,000 to 70,000 tokens. Each measure ticket costs the main
window almost nothing.

---

## Phase 0 — fix the machinery, once

One session. It is not ticket work. **No new skill.** `tdd` is already correct and
`implement` is already the wrapper. What is missing is the rule about what a ticket
may contain, and that belongs in this repository.

```
/writing-for-agents
```

### Two files do not change

- **`AGENTS.md` is kept clean and gains nothing.** It is read at the start of every
  session, so every line in it is paid for in every window.

  Until 2026-08-11 it held the rule *"Write tests in vertical slices. One test, then
  the implementation that makes it pass, then the next test."* That rule was correct
  and it still lost, which is the point: **a standing rule competes with a work
  order, and the work order wins.** An agent that reads sixteen checkboxes plans
  across sixteen checkboxes. More prose in `AGENTS.md` would not have fixed it.

- **`docs/agents/triage-labels.md` is generated** by
  `mattpocock-skills:setup-matt-pocock-skills`. Anything written there is lost on the
  next run. It cannot hold a repo-local label.

So the rules go where they are read at the moment they apply.

| where | what it holds | why there |
| --- | --- | --- |
| `docs/agents/issue-tracker.md` | the ticket template, and the status vocabulary | not generated; `AGENTS.md` already points at it |
| the ticket file itself | the red-green cadence | it is read at the moment the agent plans |

### 0.1 `docs/agents/issue-tracker.md` gains the ticket rules

```markdown
## What a build ticket may contain

- It carries its numbers. No criterion starts with *measure*, *re-run*, *count* or
  *verify in the browser*. That criterion is a measure ticket, and it runs first.
- Six acceptance criteria at most.
- It names the three to five files it may read.

A ticket that breaks one of these is refused, not absorbed.

## Status vocabulary

`triage-labels.md` is generated and defines five words. It carries no terminal state
for work that **was** actioned — `wontfix` says the opposite — so this repo adds one:

    resolved <date> — <reason>

`resolved` is the only word for done. `closed`, `merged` and `claimed` are retired.
A status value outside this list makes the ticket count wrong.
```

### 0.2 `docs/agents/issue-tracker.md` gains the template

```markdown
# NN — <title>

**What to build:** the end-to-end behaviour, from the editor's view.

**Blocked by:** the ticket numbers, or "None".

**Status:** ready-for-agent

## Reading list

Read these and nothing else. If you need more, the ticket is wrong: say so and
stop.

- docs/adr/NNNN-....md
- <the module and its test file>
- CONTEXT.md § <the two or three words that apply>

## Slices

In build order. **Criterion 1 is your first failing test.** Run
`npm test -- <file>` and show the red before you write the implementation. Then
the next criterion. Do not plan across all six.

- [ ] 1 ...
- [ ] 2 ...
```

The cadence rule is **inside the template**, so it is copied into every ticket file.
It is then in the document the agent is reading when it plans, and not in a file it
skimmed at session start. This is why no skill is needed.

**`map.md`, `RUNBOOK.md` and `WORKLIST.md` are never on a reading list.** They are
navigation surfaces for a human. A build agent does not open them.

---

## Phase 1 — re-slice what exists, once for each stream

### The chain already ran. This is the second cut, not the first

`map.md` carries `Labels: wayfinder:map` and the `wayfinder` section structure, so the
map is a wayfinder map. `PRD.md` carries `Parent: map.md`, which is the collapse from
the map to a buildable plan. Tickets 72 to 90 came out of `to-tickets` against it.

```
wayfinder  →  map.md  →  PRD.md  →  to-tickets  →  tickets 72–90     ← all done
                                    to-tickets  →  re-slice          ← this phase
```

So **do not grill again, and do not run `to-spec`**. The decisions are settled and
recorded in five ADRs. A second pass would decide them again, and `to-spec` would
collapse a plan that is already collapsed.

This phase re-cuts tickets that exist. Run it **one stream at a time**, not over all
nineteen: the streams are already separated in `map.md` under **Working order**.

```
/to-tickets .scratch/content-parity-log/PRD.md
```

Give the skill the instruction directly:

> Tickets 72 to 90 exist and their decisions are settled. Re-slice each one into
> vertical slices of six criteria at most, numbered from 91. Every measurement
> criterion becomes its own measure ticket, and that ticket blocks the build ticket.
> Every ticket gets a reading list of five files at most.

Step 4 of `to-tickets` quizzes you on granularity. That is the lever. Push on it until
no build ticket holds a measurement.

Keep the old numbers. `WORKLIST.md` already says why: a step that says "blocked by
step 22" becomes a lie under a renumbering.

---

## Phase 1b — the nine tickets the PRD does not cover

Nineteen open tickets come from `PRD.md`. Seven are parked axis B, and three want a
human. That leaves **nine**, and they are not one group. Read on 2026-08-11.

### Two are done, and the status word hides it

| | what it says | what to do |
| --- | --- | --- |
| 57 | *"Merged into 54 and 55 on 2026-08-07. **Do not build this ticket.**"* | close it |
| 50 | `map.md`: *"Done on 2026-08-10 by ticket 55. The spec is delivered and the number is 816."* | close it |

Both hold a `Status:` value that `docs/agents/triage-labels.md` does not define —
**`merged`** and **`claimed`**. Ticket 04 holds **`reopened`**, which is also not in the
vocabulary. So a count of open tickets reads three tickets wrongly.

`WORKLIST.md` already guards the count against a second folder. This is the same fault
through the status line. **Use the five words, or the count is not a measurement.**

Fixing the three words takes the open count from 39 to 37. It costs no session.

### Three are decision tickets, and they hold no criteria at all

Tickets **16**, **20** and **25** each hold a list of questions under *"What to
settle"* and **zero acceptance criteria**. In `wayfinder` vocabulary they are decision
tickets: they deliver a decision and not code. Slicing them would slice nothing.

- **16** and **20** want `/grilling`, one per session, ending in a decision written into
  the ticket, and an ADR if the decision is hard to reverse.
- **25** wants a human first. It says so: *"a human who knows what the gallery was meant
  to become."* If that human is not you, it is `/to-questionnaire` and not a grilling.

### Four wait on a re-triage, and the map already says so

`map.md` § Working order: *"the re-triage of 04, 16, 20 and 25 that ticket 50 asks for
after 55."*

All four reason from a corpus of 451 pairs. Ticket 55 made it **816 store pages**. A
decision taken against a dead number is a decision taken twice, so the re-triage comes
before the grilling and before any slice. Ticket **04** is a measure ticket with no
criteria; run its measurement and let the counts decide whether it stays open.

### Three are build tickets, and one is worse than 68

| ticket | criteria | what breaks the rule |
| --- | --- | --- |
| **58** meta check | **26** | *"All six stores are re-crawled with `--force`"*, and the comparison is re-run and re-baselined |
| **70** shared regions | 6 | criterion 1: *"**Measure first**, and put the number in this ticket"* |
| **69** one viewport | 5 | *"Measure the residual duplication after ticket 64"* |

**58 is the largest ticket in the repository** — 26 criteria against ticket 68's
sixteen — and it owns a six-store re-crawl. Under the six-criterion rule it is about
five tickets: one measure, then Step 1, Step 2, the panel, and the glossary.

**69 and 70 are almost free.** Each already puts its measurement in the first
criterion, so the cut is along a line that is drawn. Ticket 70 also carries a blocker
outside its edges: *"It answered HTTP 500 on all six hosts while this was written."*

### The order

```
1.  Fix three status words. Close 50 and 57.          minutes, no session
2.  /triage  04, 16, 20, 25                           against the 816-page corpus
3.  /grilling  16, then 20                            one per session
    /to-questionnaire  25                             if the gallery owner is not you
4.  /to-tickets  58                                   the 26-criterion split
    /to-tickets  69 + 70                              cheap
```

Steps 1 and 2 gate the rest. Step 1 gates nothing and costs nothing, so it goes first.

---

## Phase 2 — work one ticket

```
/clear
/implement .scratch/content-parity-log/issues/91-....md
```

`implement` drives `tdd`, then calls `code-review`, then commits. The stock skill is
enough: the ticket's own `## Slices` section carries the cadence, and its
`## Reading list` carries the budget.

`/clear` between **every** ticket. The last ticket's context is disposable, because the
next ticket is self-contained.

After every ticket, as `WORKLIST.md` already requires:

```
npm test
node compare/measure.mjs nl
```

A ticket that adds no rule must move no number.

### A measure ticket gets no session

Run it as a probe script or as a background subagent. The deliverable is a table. Paste
the table into the build ticket that waits on it.

```
Agent(subagent_type: "Explore" | a probe under crawl/probes/ or web/probes/)
```

`crawl/probes/` holds crawl measurements. `web/probes/` holds front-end measurements.
A probe measures the stage it sits in.

### A ticket that may refuse itself gets `/research`

Ticket 89 may refuse ticket 90. That is a valid outcome, and it is reading work.

```
/research
```

It runs in the background, it reads primary sources, and it leaves a cited file. It
does not spend the main window.

---

## Phase 3 — close the ticket

Keep a **short** `Resolved` paragraph in the ticket: what now works, and the one or two
numbers that prove it.

The rest goes elsewhere.

- **Measurement tables** go to the probe output. Ticket 68 duplicated its tables into
  ADR 0009 already.
- **Decisions and rejected alternatives** go to the ADR.
- **What the review found** goes to the commit body.

Ticket 68 is 3,200 words, and about 1,700 of them were written after the work. The next
agent reads all of them. A ticket file stays at about 800 words.

---

## The gates, in one list

| gate | check |
| --- | --- |
| a build ticket holds no measurement | no criterion starts with *measure*, *re-run*, *count*, *verify in the browser* |
| a build ticket holds six criteria at most | count them |
| a build ticket names what it may read | three to five files, and none of them is the map |
| one criterion is one red-green cycle | a pasted failing test stands before each implementation |
| a ticket file stays short | about 800 words; the long answer is in the ADR or the probe |
| `/clear` between tickets | the window is empty when `implement` starts |

## What this is expected to buy

A build session of 40,000 to 70,000 tokens, against 150,000 to 250,000 today. The
measurement work does not go away. It moves into windows that are thrown away.
