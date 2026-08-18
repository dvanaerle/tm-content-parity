# Code health — the comment bar, and what the tree actually breaks

Type: prd
Status: ready-for-agent
Written: 2026-08-18
Decided in: a grilling session against `docs/standards/CODING_STANDARDS.md`
Records: no ADR. The record is the amended *Existing code* clause in the standard itself,
where the next reader meets it. Commit `d884d8a`.

## Problem Statement

The tree carries **13,035 comment lines against 15,089 lines of non-test code** — a ratio of
0.67 outside tests, and above 2.0 in `shared/`, `web/src/lib/` and `overrides/`. Read as a
number, that says the codebase is smothered in commentary and wants a sweep.

The number is a trap, and the ticket that opened this work walked into it. A survey of all
192 source files found **none of what the standard calls a violation**:

- **Zero** comments restating the line beneath them. A scan for own-line comments opening
  *Get / Set / Return / Create / Build / Check / Parse / Render / Handle / Update* and twelve
  more verbs, across every non-test file, returned no matches.
- **Zero** `TODO`, `FIXME`, `XXX` or `HACK` markers, case-insensitive, in every tracked file
  of every extension. No `NOTE:`, no `WORKAROUND`, no `@deprecated`.
- **Zero** lines of commented-out code. One candidate turned out to be prose.

What the tree has instead is the *reason* comment, in bulk — the one category the standard
says earns its place. `compare/findings.mjs` explains that an enum is built from a constant
"so the enum is named in one file: a fourth value would arrive here as a zero and never as a
missing key." `compare/meta.mjs` records that a symmetric rule "would have buried" a class of
findings the content team cannot act on. These sentences are the repo's memory of decisions
taken, and a volume-driven sweep would delete them and leave the code exactly as it was.

So the real problems are smaller than the ratio suggests, and three of them are not about
comments at all:

1. **The standard could not answer the tree.** It had no clause for a section divider, no
   statement that JSDoc is exempt from density judgement, and an *Existing code* clause that
   forbade touching untouched files — which made the debt it named unpayable and would have
   blocked even a risk-free deletion.
2. **64 of 192 files open with a module header**, and the standard permits one only "where
   the file's job is not clear from its name." Some of these earn it. Some restate the
   filename in a sentence. Nobody has ever sorted them.
3. **27 section dividers exist in three dialects**, two of which pad a rule out to a fixed
   column so the next rename silently breaks the alignment. This repo refuses two words for
   one thing everywhere in `CONTEXT.md`; it tolerates three punctuation styles for one job.
4. **No lint runs in CI.** `oxlint.config.ts` enables 15 rules and the local plugin under
   `tools/oxlint/anti-slop/` implements them across 1,917 lines of code. The workflows
   directory holds a Supabase backup and a keepalive. The rules fire only when somebody
   remembers, which means `require-safety-comment-for-type-assertion`, set to `error`, is
   enforced by nothing.
5. **A high ratio may still be hiding a code problem.** `web/src/lib/search.mjs` is 604
   comment lines to 187 of code. If those comments are explaining blocks that wanted to be
   named functions, the fix is Fowler's — extract and rename — and it is a *code* change,
   not a comment deletion. Nobody has read them to find out.

## Solution

The standard is amended so it can answer the tree, and the tree is brought to it in the order
of increasing risk: a rule change that touches no code, then a deletion that cannot regress
behaviour, then a judgement per file that can.

The amendment is already committed (`d884d8a`) and turns on a single new distinction:
**whether code moves.** A commit that removes comments and changes nothing else reads at a
glance and cannot break the build, so it may sweep as many files as it likes. An extraction,
a rename or a split is a code change, gets one file per commit, and happens only where
somebody was already working. The old clause forbade both equally, on the file-count axis,
which is the wrong axis.

Two clauses close the gaps the survey found. *Density is not a violation* states that a file
with more comment lines than code is not in breach on that count, that JSDoc never counts as
commentary — so a file of `@typedef` is exactly as it should be — and that the answer to a
genuinely high ratio is extraction, "never to delete the reason and leave the code as it was."
A section divider joins *What goes*, because a divider naming a region says the file has
become two files; until the split happens, one dialect is permitted and the padded forms are
refused with the reason.

Then three pieces of work, which are separate tickets and separate risks:

**The header pass.** Each of the 64 module headers is tested against its own filename. It
survives if it adds a constraint or a reason the name cannot carry; it goes if it only says
the name again in a sentence. This is deletion-only, so it sweeps in one commit.

**The divider conversion.** The two padded dialects become the one permitted form.

**The extraction judgement.** The files above ratio 2.0 are read, one at a time, and asked
whether the comments are carrying what the code should say. Where yes, extract and rename
until the explanation is unnecessary. Where no — the expected answer for most of them — the
file passes and nothing changes. The deliverable of this ticket is allowed to be *"seven
files read, one changed."*

**And the CI gap is fixed**, because it is the largest defect the survey turned up and it has
nothing to do with comments.

## User Stories

1. As an agent about to edit a comment-heavy file, I want the standard to tell me that
   density alone is not a violation, so that I do not delete a reason to hit a ratio.
2. As an agent reading the standard, I want the *Existing code* clause to turn on whether
   code moves, so that I know a deletion-only sweep is permitted and an extraction is not.
3. As an agent that has finished a feature, I want to know the bar applies to the files I
   touched, so that cleanup lands with the work rather than accumulating.
4. As a reviewer, I want a comment-removal commit to contain no code changes, so that I can
   approve it by reading the diff once without checking behaviour.
5. As a reviewer, I want an extraction to arrive one file at a time, so that I can judge the
   code change on its merits instead of hunting it inside a sweep.
6. As a reviewer, I want a deletion-only diff to contain no test file, so that a test file
   appearing in one tells me the commit is not what it claims.
7. As a maintainer, I want the standard tracked in git, so that `AGENTS.md` stops citing a
   file that does not exist.
8. As a maintainer, I want `AGENTS.md` to describe the tree accurately, so that an agent is
   not told comments are sparse in a repo with a 0.67 ratio.
9. As a newcomer opening a file whose name does not say what it does, I want a one-line
   header, so that I can orient without reading the whole module.
10. As a newcomer, I want the headers that only restate the filename gone, so that the
    remaining ones are worth reading.
11. As an agent navigating by filename, I want a header that states a constraint — that a
    list is exhaustive, that a map is the only one — so that I do not add the second one.
12. As an agent reading a long file, I want a section divider to be a signal that the file
    should be split, so that I treat it as debt rather than as furniture.
13. As an agent writing a divider because the split cannot happen yet, I want exactly one
    permitted form, so that I do not have to choose between three.
14. As an agent renaming a section, I want the divider not to be padded to a column, so that
    the rename does not silently leave a broken rule behind.
15. As a reader of a declaration file, I want its `@typedef` blocks not to be counted against
    it as commentary, so that nobody proposes stripping a file whose comments are its content.
16. As an agent judging a high-ratio file, I want the question to be whether the code says
    what it does, so that I reach for extraction before deletion.
17. As an agent that extracts a function, I want the module's existing tests to pass
    unchanged, so that I know I moved code and did not change behaviour.
18. As an agent whose extraction broke a test, I want that treated as a finding about the
    test, so that a test coupled to the implementation gets fixed rather than accommodated.
19. As a reviewer of a high-ratio file that turned out to be fine, I want "read, no change"
    to be an acceptable outcome, so that the ticket does not pressure anyone into a
    cosmetic edit.
20. As a maintainer of a component with nine labelled markup regions, I want that read as a
    statement about the component, so that the fix is a subcomponent and not a tidier comment.
21. As a contributor pushing a branch, I want `oxlint` to run, so that the 15 configured
    rules mean something.
22. As the author of the anti-slop plugin, I want its rules enforced automatically, so that
    1,917 lines of rule implementation are not optional.
23. As a maintainer, I want the type-assertion safety rule enforced on every push, so that an
    unexplained assertion cannot land.
24. As a maintainer, I want no lint rule added to guard a violation that does not exist, so
    that the rule set stays about real defects.
25. As a maintainer, I want the header pass measured before and after, so that its claim is
    checkable rather than asserted.
26. As a maintainer, I want no test asserting comment counts, so that the suite does not break
    on every unrelated edit.
27. As an agent picking up this work later, I want the reasoning recorded where the rule lives,
    so that I do not re-run the survey and repeat the mistake of reading volume as breach.

## Implementation Decisions

**The standard is the first deliverable and it is already committed.** `d884d8a` lands
`docs/standards/CODING_STANDARDS.md` — previously untracked while `AGENTS.md` cited it — with
the `AGENTS.md` line that references it, in one commit, because separating them guarantees a
window where the repo points at a missing file. The same commit corrects that line's claim
that comments are sparse here.

**The amended clauses.** Three, all inside the `## Comments` section:

- *What goes* gains the section divider, with `// ---- lowercase label` as the only permitted
  form and no right-padding, and the reason: padding aligns to a column, so a rename breaks
  it and no formatter repairs it. Lowercase because `CONTEXT.md` already rules that sentence
  case wins and that a column heading is the one place capitals earn their keep.
- *Density is not a violation* is new. It exempts JSDoc from any density judgement and names
  extraction as the only remedy for a genuinely high ratio.
- *Existing code* is rewritten onto the code-moves axis, replacing the file-count axis.

**No ADR.** Two of the three ADR criteria hold — surprising without context, and the result of
a real trade-off — but it is not hard to reverse, and the amended clause is a place the next
reader arrives at by reading the rule they are following. An ADR is a place they would have to
think to look. The existing ADRs are all domain and interface decisions, and that boundary is
worth keeping.

**No `CONTEXT.md` entry for "comment".** The glossary holds words the system models —
production, new site, page, cell, provenance — and says of itself that each has one meaning in
the code, the interface and the tickets. *Comment* is a thing this repo writes, not a thing it
models. The existing mention of the word in `CONTEXT.md` is a use, not a definition.

**The header test is constraint-or-reason.** A header survives if it carries something the
filename cannot: an exhaustiveness claim, a uniqueness claim, a reason. It goes if it expands
the name into a sentence. Two worked examples set the line: a header reading "The words a
page's priority can be, and nothing else" **survives**, because *and nothing else* asserts
exhaustiveness; one reading "The one colour map" **survives**, because *the one* forbids a
second. Expect materially fewer than 64 to fall.

**The header pass sweeps in one commit, on a fresh branch off `main`.** It qualifies under the
new deletion-only clause. It does not land on top of `ticket-104-search-page-scope`, which has
ten modified source files including four of the ten most comment-heavy files in the tree; the
two diffs would be unreadable together.

**The divider conversion is separated from the file splits.** Converting the two padded
dialects is mechanical but is not deletion-only, so it needs either a reason to be touching
each file or an explicit decision that the conversion earns its own commit. Splitting the
files the dividers confess about is a code change, one file per commit, and is a genuinely
open question in `crawl/probes/` — 21 files and 3,484 lines of code with no test coverage to
catch a split going wrong.

**The extraction judgement is per file, one commit each, and may conclude "no change."** The
candidates are the files above ratio 2.0, and the JSX equivalent: a component carrying nine
labelled markup regions in 200 lines of code is a candidate for subcomponent extraction, not
for comment editing.

| candidate | comment | code | ratio |
| --------- | ------- | ---- | ----- |
| `web/src/lib/search.mjs` | 604 | 187 | 3.23 |
| `web/src/lib/landing.mjs` | 151 | 50 | 3.02 |
| `web/src/lib/view.mjs` | 577 | 194 | 2.97 |
| `web/src/lib/blocks.mjs` | 191 | 85 | 2.25 |
| `overrides/state.mjs` | 316 | 150 | 2.11 |

**One file is exempt by rule, not by judgement.** The tree's highest ratio, 385 comment lines
to 29 of code, belongs to a file that is almost entirely `@typedef`. JSDoc is a signature, so
the file is as it should be and is not a candidate.

**Comments that carry domain reasoning become pointers; local mechanics stay in full.** Where
a comment restates reasoning that lives in `CONTEXT.md` or an ADR, it shortens to a citation
of the **ADR number only** — never a section heading, which renames and rots. Where the reason
is local mechanics with no home in a glossary, it stays inline verbatim.

**Nothing is added.** This work never writes new JSDoc, even where an export lacks it. Mixing
removal and addition destroys the reviewability that justifies the sweep, and a rule requiring
JSDoc on every export would fight the deep-modules principle by rewarding wide interfaces with
paperwork instead of pressuring them to narrow. If that is wanted, it is separate work.

**Off-limits by kind, not by name.** Licence and attribution headers stay regardless of the
bar, because they are legal text and not commentary. Generated and vendored files are excluded
because editing them is pointless — which covers the shadcn components under
`web/src/components/ui/`, already at a 0.01 ratio.

**Tests answer to the same bar, with no new exception.** A fixture comment explaining why the
fixture is shaped as it is already qualifies under *a reason*; adding a named exception for it
would be read as a licence.

**The CI gap is fixed by running the script that already exists, and the run denies warnings.**
A workflow runs `npm run lint` on push and on pull request. Failing on a non-zero exit is not
enough on its own: measured 2026-08-18, `oxlint` reports a `no-debugger` violation and still
**exits 0**, because the built-in correctness rules fire at warning level. The 15 anti-slop
rules are all `error` and would fail a run, so a bare script would enforce those fifteen and
tick green over everything else. Warnings are denied.

The tree needs no cleanup first. Measured 2026-08-18, `oxlint .` over the tracked tree emits no
diagnostic of either severity and exits 0, so the workflow lands green on arrival.

**No marker lint rule.** A rule banning `TODO`/`FIXME`/`XXX`/`HACK` was considered and
rejected: the scan found none in the tree, so it would guard nothing, and adding it to a lint
run that nothing executes would guard nothing twice. It is worth revisiting only after CI runs
lint. The rest of the bar — "every comment answers a question the code cannot" — is not
machine-decidable, and a linter attempting it produces noise that trains people to disable it,
costing the bright-line rules too.

## Testing Decisions

A good test here exercises behaviour through a public interface and survives an internal
refactor. That principle is not just the standard this work is measured against — for the
extraction tickets it *is* the test. Almost none of this work is verified by a new assertion;
it is verified by existing assertions continuing to hold.

**Seam 1 — the suite, unchanged, for every deletion-only change.** Acceptance for the header
pass and the divider conversion is that `vitest run` is green **and no test file appears in
the diff**. A test file in a deletion-only diff is the failure signal: it means the commit
changed something it claimed not to. No new seam; this is the highest available.

**Seam 2 — each module's existing public-interface tests, for the extraction work.** The
candidate modules already have test files exercising the interfaces the extractions sit
behind, and those tests are the acceptance gate. The rule is asymmetric on purpose: an
extraction that forces a test edit has changed behaviour and is reverted, not accommodated —
unless inspection shows the test was coupled to the implementation, in which case the finding
is about the test and is fixed as its own change. Zero new seams.

**Seam 3 — `npm run lint`'s exit code, executed by a workflow.** The one genuinely new seam,
and it is a new execution point rather than a new interface: the script, the config and the
plugin all exist already. Acceptance is that a push carrying a known **warning-level** violation
fails the run and a clean push passes it — the warning level is the acceptance case precisely
because it is the one a bare exit-code check would miss.

**Seam 4 — measurement, and explicitly not a test.** The header pass and the reading ticket each
report dated before/after counts, following the prior art of
`.scratch/language-blocks/measure-03.mjs`, whose output was pasted into its ticket as a
measurement-gate table. The counting is evidence inside the ticket that needs it rather than a
tracked tool or a shared prefactor — the header inventory is a single grep, and the ratio counts
are wanted only by whoever is already reading those files.

**Ruled out: any `vitest` test asserting comment counts, ratios, header presence or divider
form.** Such a test asserts on the source's style rather than the system's behaviour, breaks
on every unrelated edit, and is a red flag by the repo's own testing section. The standard is
enforced by review, by the one lint rule that is machine-decidable, and by measurement pasted
into tickets.

**The anti-slop plugin's own rules are prior art for Seam 3**, and the browser tests under
`web/src/components/` (`*.browser.test.mjs`, run through `@vitest/browser`) are the seam for
any JSX subcomponent extraction — they exercise rendered behaviour, which is what a component
split must preserve.

## Out of Scope

- **Deleting reason comments to reduce volume.** Explicitly refused. The tree's high ratio is
  not a breach, and the reasons are the repo's memory.
- **Adding JSDoc anywhere**, including to exports that lack it.
- **A JSDoc or comment-density lint ruleset**, and the marker rule described above.
- **Splitting the `crawl/probes/` files.** The dividers point at it, the standard names it as
  the real remedy, and it stays open because the area has no test coverage. It needs its own
  decision.
- **`ticket-104-search-page-scope`.** This work does not touch its ten modified files, and the
  header pass waits for that branch to land.
- **Any `CONTEXT.md` or ADR change.** Both were considered and both were declined.
- **Rewriting the testing or interface-design sections of the standard.** Only `## Comments`
  is amended.
- **Comment work in generated, vendored or licence-bearing files.**

## Further Notes

The template for this spec says not to name file paths, because they go stale. This spec names
them anyway: the path *is* the unit of work here, and a ticket that says "the high-ratio files"
without saying which cannot be picked up. The counts are dated instead — all figures measured
2026-08-18 over the tracked tree, excluding `node_modules/`, worktrees and skills — so a reader
can tell when they have drifted.

Two of this spec's decisions reverse a position taken earlier in the session that produced it,
and both reversals came from the survey rather than from argument. A blanket amnesty for
comment removal was proposed and then withdrawn once it was clear the work was extraction
rather than deletion; it returned in the narrower deletion-only form, because the distinction
that matters turned out to be whether code moves, not how many files a commit touches. And the
premise that opened the work — that the codebase has too many comments — is the thing the
survey disproved. The volume is real. The breach is not.
