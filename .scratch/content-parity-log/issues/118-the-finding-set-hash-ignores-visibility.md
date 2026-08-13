# 118 — The finding-set hash ignores visibility

Type: task
Status: resolved 2026-08-13 — the filter is gone and the hash is independent of
`FINDING_CLASSES`. Criterion 3's number is **84 of 133 live page reviews**, not the 121 the
ticket predicted; the trap that says *all* of them go stale is wrong and is corrected below.
Parent: ../map.md
Spec: [119](119-spec-the-same-words-divided-differently.md)

**What to build:** `findingSetHash()` stops filtering on class visibility and hashes every
finding on the page, shown or hidden. The reasoning is in
[ADR 0013](../../../docs/adr/0013-the-finding-set-hash-ignores-visibility.md).

## Why it goes first

It is a prerequisite for both [86](86-heading-level-becomes-information.md) and
[116](116-the-regrouped-class.md), and for the same reason. The hash is what a **page
review**'s staleness is measured against. Filtered on visibility, it makes a vocabulary edit
look like a change to the page: flipping `heading-level` to `information` would print
**"changed since review"** on all **392** pages that carry one, on a day when not a word on
any of those pages moved. `CONTEXT.md` defines `Stale` as a review *"made against a page whose
findings changed after it"*. Under the old hash the interface would be lying about the one
fact it exists to report.

Land it on its own, so the churn it causes is attributable to it and not to the two tickets
that follow.

## Acceptance criteria

- [x] `findingSetHash()` is computed over every finding of the page, in a stable order,
      independent of `FINDING_CLASSES`. `compare/contract.mjs:303` — the `isWork()` filter is
      gone and the function no longer reads `finding.class`, so its parameter narrowed from
      `Pick<Finding, 'id' | 'class'>[]` to `Pick<Finding, 'id'>[]`. The sort is unchanged.
- [x] A test pins that changing a class's visibility leaves every page's hash **byte-identical**.
      This is the assertion the whole ticket exists for. `compare/contract.test.mjs`, the
      `findingSetHash` block: the vocabulary is re-triaged through a module mock and the hash
      of a page carrying one finding per class is asserted equal, three times over — every
      class to `work`, to `information`, to `diagnostic` — plus the exact flip ticket 86 makes.
- [x] The count of live `page/reviewed` events that go stale on the landing run is recorded in
      the answer. **84**, re-read on 2026-08-13, of **133** live reviews. Not 121, and not all
      of them — see *The number is 84, not 121* below.
- [x] The announcement note is written before the run lands, in the shape of
      `notes/2026-08-07-the-fold-and-your-judgements.md`. Editors must not discover this by
      finding their reviews flagged.
      `notes/2026-08-13-your-page-reviews-go-stale-once.md`, drafted before the run.
- [x] No finding id changes. `shown` was never a term of `findingId()` and this ticket must not
      make it one. Pinned: the `findingId` under a re-triaged vocabulary is asserted equal to
      the one under the real vocabulary, and the ticket-33 literal `7i2HEm3xn0h-9hr1` still
      holds. No override detaches.

## Traps

- **Every hash changes once.** ~~All 121 live page reviews go stale~~, not just the 392-page
  subset the old behaviour would have churned. That is the worse number today and the better
  one permanently, and the answer should say so in words rather than leave the spike
  unexplained. — **struck 2026-08-13 on the measurement: 84 of 133 go stale, 6 pages hash
  identically under both rules, and 43 were already stale.** The rest of the trap stands, and
  the answer says so in words.
- A **hidden** class changing now marks a review stale. That is intended: a human reviewed the
  page, not the shown subset of it.
- Do not confuse this with the **run log**, which is keyed on the finding id alone and is
  untouched. This is page-review staleness only.

## Answer

Built 2026-08-13. The filter is one line and it is gone; 662 tests pass. The number the
ticket asked for is **84**, and the ticket's own prediction of it was wrong in two ways.

### What changed

- **`compare/contract.mjs`** — `findingSetHash()` drops `.filter((finding) => isWork(...))`.
  Its doc comment now carries ADR 0013's reasoning and its `@param` narrowed to
  `Pick<Finding, 'id'>[]`, which is the type-level statement that the class is not read.
- **`overrides/state.mjs`** — `review()`'s comment said the hash covers the `work` classes
  only. It says what it now does.
- No call site moved. The filter lived inside the function, and `30-compare.mjs`,
  `web/src/lib/reports.mjs` and `overrides/supabase.mjs` only ever passed the result through.

### The number is 84, not 121

The ticket predicted 121, and its Traps section says *"all 121 live page reviews go stale"*.
Measured with `crawl/probes/probe-118-review-staleness.mjs` against the live log and
`data/reports/` as it stands:

| outcome | reviews |
| --- | --- |
| goes stale on the landing run | **84** |
| stays fresh | 6 |
| already stale before this ticket | 43 |
| page not on disk | 0 |
| **live page reviews** | **133** |

958 events, 740 live. Three corrections fall out of it:

- **133 live reviews, not 121.** The log moved between the ticket being written and being
  built, which is why the criterion said to re-read it.
- **43 were already stale**, because the pages moved under them. Those are not churn this
  ticket causes and counting them as such would have inflated the announcement by half.
- **6 stay fresh.** The trap's *every hash changes once* is false as written: a page whose
  findings are all in `work` classes hashes the same under both rules. It is a small number
  because most pages carry at least one `text-added`, `redirect` or `tag-changed`, but it is
  not zero, and the claim should have been *every hash on a page carrying a finding that is
  not work*.

The spike is real and it is smaller than advertised. The permanent property is unchanged:
after this, no visibility decision churns a review again.

### One pin the ticket did not name

`compare/compare.test.mjs` held a third assertion of the old behaviour — *"leaves the bar
alone, because the metadata is not a content difference"* — which pinned a
`no-declared-alternate` page to the **same** hash as a page without one. Spec 119 named two
seams and this was a third. Its bar half still holds and is untouched; its hash half is now
inverted, with the reason in place. It is worth saying why the test can keep its name: the
bar and the hash have stopped answering the same question. The bar is what an editor must
close, the hash is what they last read, and this ticket is the moment those two come apart.

### The traps

- **Every hash changes once** — corrected above. 84 of 133, not 121 of 121.
- **A hidden class now stales a review** — intended, and pinned as an edited assertion in
  `overrides/state.test.mjs`, which used to assert the opposite. The old test is not deleted:
  it is rewritten to state the new behaviour with the withdrawn reading named in place, so
  the record shows staleness moved on purpose.
- **The run log is untouched** — confirmed by inspection. It keys on the finding id, and no
  finding id moved.

### What the review found, and what was done

Both axes ran against the working tree. Six findings, five fixed:

- **`compare/vocabulary.mjs`** — `isWork()`'s docblock said it is *"the one question the bar,
  the summary and the finding-set hash ask"*. The hash no longer asks it. Fixed, and the
  docblock now names the place where counting and identity deliberately come apart. This is
  the one the ticket's own answer had missed while claiming no call site moved.
- **`compare/contract.mjs`** — the removed filter left `isWork` imported and unused on line 9.
  Removed. `STORES` on the same line is still live.
- **ADR 0013's opening line** said the filter read `CLASSES[finding.class]?.shown`. Neither
  symbol has existed since ticket 75 replaced the boolean with the visibility enum. Corrected,
  with the correction dated in place, so the decision names the code it supersedes.
- **`crawl/probes/probe-fold-detachment.mjs`** carries the old rule in a comment and an
  `isWork` filter. **Not rewritten**: ticket 67 landed 2026-08-10 and the probe's own header
  says a run after the fold measures the wrong thing, so it is spent evidence rather than
  live code. Annotated instead, including what a reviver must take out with it.
- **This ticket's Traps section** still asserted the 121. Struck through in place with the
  measurement beside it, and the map's claim that both records were corrected is now true of
  both rather than of the ADR alone.

**One refused.** The duplicated `supabaseConfig()` and `readOverrideLog()` between the two
probes is real duplication with no day-specific excuse, and extracting it would mean editing
a spent probe to serve a live one — changing a record nobody can re-measure. The reason is
written at the copy, with the instruction to extract from the new file if a third probe wants
it.

**One finding was misattributed and is left alone.** The spec axis read CONTEXT.md's
`Regrouped`, `Detail`, `Information` and `Finding` entries as this ticket's scope creep. They
are ticket 116's in-flight work, uncommitted in the same tree. It is a fair observation about
the tree — the glossary currently documents a class `compare/vocabulary.mjs` does not have —
and it belongs to 116, not here. Only the `Stale` entry is this ticket's, and ADR 0013 argues
from that definition, so sharpening it here is the change and not creep.

### One judgement call

The byte-identity test re-triages the **whole vocabulary** at once rather than looping over
the 22 classes one at a time. The loop was written first and timed out under the full suite
at 22 module reloads × 3 visibilities. Flipping every class together is both faster and a
stronger statement, and the one flip anybody actually cares about — ticket 86's
`heading-level` → `information` — keeps its own named test beside it.
