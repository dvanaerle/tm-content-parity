# 119 — Spec: the same words, divided differently

Type: spec
Status: resolved — the spec is written and its decisions are recorded in
[ADR 0012](../../../docs/adr/0012-regrouped-requires-total-coverage.md) and
[ADR 0013](../../../docs/adr/0013-the-finding-set-hash-ignores-visibility.md).
118 and 86 are built; 116, 120 and 121 carry the rest and read this file as
their governing spec. A spec decides; it is not itself implemented.
Parent: ../map.md

Implementation tickets, in dependency order:
[118](118-the-finding-set-hash-ignores-visibility.md) →
[86](86-heading-level-becomes-information.md) →
[116](116-a-merged-paragraph-is-one-row.md) →
[120](120-a-split-paragraph-is-one-row.md) →
[121](121-a-run-may-hold-a-heading.md).
[117](117-the-page-keeps-one-h1.md) is held at `needs-triage` and gates nothing.

Decisions: [ADR 0012](../../../docs/adr/0012-regrouped-requires-total-coverage.md),
[ADR 0013](../../../docs/adr/0013-the-finding-set-hash-ignores-visibility.md).

## Problem Statement

An editor opens a store page in the log and is told about work that does not exist.

On `nl/proefpakket/succes` the log reports a `copy` finding scored 0.84 and a `text-missing`
finding. Every word of both is on the new site. Production sends two paragraphs; the new site
sends one paragraph holding both, in order, unchanged. The tool cannot see that, because the
matcher pairs one content unit with one content unit and nothing else, so production's first
paragraph pairs with the merged one at 0.84 and production's second paragraph is left over and
reported as lost. The mirror shape is more common still: production sends one paragraph with a
numbered list inside it, the new site sends a heading and four `li`, and the log reports one
`text-missing` and five `text-added`.

Editors have been absorbing this by hand for months. **Roughly 59 live dismissals sit on
exactly this shape**, in their own words — *"de content staat een regel erboven"*, *"Staat
hetzelfde op beide sites"*, *"De nieuwe website is correct, semantic HTML, door twee paragraaf
teksten te gebruiken."* Nobody should have to write that sentence 59 times.

Separately and larger: **`heading-level` is 10.00% of every shown finding in the log** — 2,846
findings across 392 of 722 comparable pages — and **no editor has ever decided one**. In 898
override events there is not a single judgement on the class. 70.7% of it is `h4 → h3`, one FAQ
accordion component levelling its own headings across every store. The log has been asking a
question for months that nobody answers, and it is a tenth of the work everybody is measured
on.

## Solution

Two changes, each of which removes work that was never work.

**A demoted heading stops counting.** `heading-level` keeps its place in the vocabulary and its
`detail`, and its **visibility** becomes `information`: rendered, readable, not counted, no
override control. This is ticket 86, written months ago and blocked until now.

**The same words divided differently get their own name.** A new class, `regrouped`, says that
one side's content unit is exactly the other side's run of content units, with nothing left
over — so a merge or a split produces **one row that says what happened** instead of two or six
rows that each say something false. It is `information` too: nobody has to re-divide a
paragraph.

The editor's experience is that the page stops lying. The screenshot's two rows become one row
reading `REGROUPED · p + p → p`, collapsed by default with the rest of the agreement, and the
FAQ pages stop presenting 26 heading demotions as outstanding work.

## User Stories

1. As an editor, I want a merged paragraph reported as one difference rather than a `copy` and
   a `text-missing`, so that I am not asked twice about content that is entirely present.
2. As an editor, I want a paragraph the new site split into a heading and four list items
   reported as one difference, so that a rebuild in PageBuilder does not read as five losses.
3. As an editor, I want the tool to say *which* blocks became *which* block, so that I can
   confirm the claim by eye in a second without opening both sites.
4. As an editor, I want a regrouping to carry no checkbox and no *Negeren*, so that the
   interface stops implying there is a decision I owe it.
5. As an editor, I want a regrouping to leave the progress bar alone, so that the percentage
   means migration work and only migration work.
6. As an editor, I want regroupings collapsed into a context marker by default, so that every
   row I actually see is work.
7. As an editor, I want to be able to expand that marker and read the regrouping, so that I can
   still find out what happened to a page's structure when I am asking that question.
8. As an editor, I want a regrouped row to sit where production put the text, so that I can
   read the page in the order the reference has it.
9. As an editor, I want a heading that the new site folded into a paragraph to stay in the
   heading jump-list, so that I do not lose a landmark I navigate by.
10. As an editor, I want the row's explanation in the words I already use — *dezelfde tekst,
    anders verdeeld* — so that the log speaks the language of the notes I have been writing.
11. As an editor, I want content that the new site genuinely **dropped** to stay a counted
    finding even when the words that remain are a subset, so that a lost sentence is never
    filed as a layout difference.
12. As an editor, I want content the new site genuinely **added** to stay reportable, so that
    an invented phone number is never filed as a layout difference.
13. As an editor, I want a paragraph that gained one word to stay a `copy` finding, so that a
    real edit is never mistaken for a re-division.
14. As an editor, I want a demoted heading to stop counting as work, so that the number I am
    measured on is a number I can act on.
15. As an editor, I want a demoted heading still visible on the page, so that nothing is
    silently absent and I can read the change if I care about it.
16. As an editor, I want the `h4 → h3` detail to survive, so that I can tell one demotion from
    another when I do look.
17. As an editor, I want to be told the percentage jumped because the denominator shrank, so
    that I do not read a vocabulary change as a fortnight of progress.
18. As an editor, I want absolute counts printed beside every percentage, so that a smaller
    denominator cannot be mistaken for completed work.
19. As an editor, I want my page reviews to stay fresh when the tool changes its own
    vocabulary, so that *"changed since review"* keeps meaning that the page changed.
20. As an editor, I want to be told in advance and in writing when a change will make my
    reviews stale or detach my dismissals, so that I do not discover it by finding my work
    missing.
21. As s.schouten, who dismissed ~59 of these by hand, I want the tool to stop asking rather
    than to preserve my dismissals, so that the effort is retired rather than archived.
22. As an editor, I want a link to a regrouped row to still work, so that I can send a
    colleague to a structural change even though neither of us can decide it.
23. As an editor, I want the class pill to name the class, so that I can tell a regrouping from
    a rewrite at a glance in a list of rows.
24. As an editor filtering the content view, I want `regrouped` to behave like every other class
      under a filter, so that one control does not have two rules.
25. As an editor on the dashboard, I want no `regrouped` group in *Verschillen*, so that
    everything on the screen that promises a decision has one.
26. As an editor, I want a regrouping across a heading boundary still anchored to a heading, so
    that the row can say where on the page it is.
27. As an agent building this, I want the criterion recorded with the alternatives priced, so
    that I do not loosen it next quarter and silence a defect.
28. As an agent building this, I want the exact rejection cases as tests, so that a future
    relaxation fails loudly.
29. As an agent building this, I want the pass to sit ahead of the greedy matcher, so that a
    0.84 pair cannot consume a run before the exact test sees it.
30. As an agent building this, I want the finding id built over the whole run, so that editing
    half a merged paragraph expires the finding rather than carrying a stale judgement.
31. As an agent building this, I want the re-pairing collateral counted before it lands, so
    that I know how many unrelated findings changed identity.
32. As the person accountable for the log, I want each of these changes to land on its own run,
    so that one number never hides two opposite movements.
33. As the person accountable for the log, I want it recorded that this is a `copy` cleanup and
    not a `text-missing` cleanup, so that the 9,783 `text-missing` findings stay an open
    question.
34. As whoever owns SEO, I want the fourteen pages whose `h1` count changed handed over as a
    list, so that dropping `heading-level` from the count does not drop the outline on the
    floor.

## Implementation Decisions

**Where the change goes.** In the comparison, not in extraction. ADR 0002 makes the content
unit the editable block, and the finding id, document order and the `li`-level rows of the
content view are built on it. Flattening a `ul` or splitting a `p` on sentence boundaries was
considered and refused: this is a matching problem.

**The alignment gains a pass, and it goes second.** Today: exact-equality LCS, then greedy
similarity at 0.6. `regrouped` detection becomes the **middle** pass. Greedy would otherwise
claim the 0.84 pair and destroy the run before the exact test ran — the same argument that
already puts LCS ahead of greedy. Pass 3 then sees fewer, cleaner leftovers.

**The criterion is total coverage.** One side's unit is *exactly* the space-joined
concatenation of the other side's run, after tier-1 normalisation, nothing left over. A run is
adjacent and uninterrupted; at most four members; each member at least four tokens; each member
is a unit nothing else claims **or** the unit's own counterpart. Arity is one-to-many or
many-to-one, never many-to-many. Comparison is on token sequences, so all boundaries are word
boundaries. ADR 0012 prices every rejected alternative — containment (1,653 findings, refused),
a three-token leftover (+22, refused), punctuation tolerance on the seam (+1, refused),
similarity on the concatenation (refused), many-to-many (refused).

**Tags are not part of eligibility.** A change of structure is the phenomenon, so the existing
heading-versus-non-heading wall in the leftover matcher must not apply here; a run may contain
a heading. Tags are reported in `detail`.

**The class.** `regrouped`, check `text`, visibility `information`, no `direction` field —
nothing is lost and nothing is added, so arity is a fact the reader sees rather than a class.
`detail` carries the shape (`p + p → p`, `h3 + p → p`, `p → h2 + 4×li`). `score` is null; the
score belongs to `copy`.

**Identity.** `prodNorm` and `newNorm` in the finding id are the space-joined run — the same
join the test uses — so the id expires if any member is edited. Using the first member only was
refused as ADR 0004's silent-carry failure. `detail` joins the id as it does for
`heading-level`.

**The row.** One wide row holding the run on one side and the unit on the other, positioned at
the **first production unit** of the run, in production document order. This bends the
one-unit-per-row reading of the content view deliberately; ADR 0006's reason for the view
existing is that a one-sided row asks *where does this text belong*, and a regrouping's answer
is *here, together*. Two narrow rows printing the merged text twice was refused as the doubled
figure the `Repeat` entry exists to stop.

**Interface consequences.** The row collapses into a context marker by default, so the
invariant that every visible row is work survives. It carries no override control, because a
dismissal says *"these two exact strings are acceptable"* and nothing is being asked. It keeps
a finding id, because `Landing` needs one. It gets no class group in *Verschillen*, and forms no
`Repeat`. No word diff runs and the clamp budget never applies — the words are identical and
only the seams differ. A heading absorbed into a run stays in the heading jump-list and still
anchors; jumping to it opens the row.

**This sharpens `information` in the glossary** to *a finding you can link to and cannot
decide*, and qualifies *"the tool never makes a finding that it then hides"* — hidden means
never rendered, and a collapsed finding is not hidden, because the marker says it is there and
expands.

**`heading-level` becomes `information` and keeps its name.** Ticket 86's specification stands;
the merge into `tag-changed` considered during design is **not** done, because `detail` alone
would leave a reader unable to say *which* differences are heading shape, and the detachment
cost of merging was zero either way, so there was nothing to buy. Visibility is not a term of
`findingId()`, so no finding id changes and no override detaches.

**An `h1` carve-out was designed and refused.** ADR 0005 allows a class exactly one visibility,
so "information except for `h1`" is not expressible and would need a second class. Measured, it
would fire on 30 findings of which 11 are the new site *adding* a page title — an improvement —
and would miss the four pages that gain a second `h1` and the one that loses its only `h1`
while the text also changes. *"Does this page still have exactly one `h1`"* is a fact about a
page, not a difference between two texts, so it goes to ticket 117 at `needs-triage`.

**`findingSetHash()` stops filtering on visibility** (ADR 0013, ticket 118), landing first and
alone so its churn is attributable.

**Sequence.** 118, then 86, then 116. Each moves a number, and ticket 33 established that one
number hiding two opposite movements is how a measurement stops meaning anything.

## Testing Decisions

A good test here asserts what an editor would see: given these content units on each side,
these findings come out, with these classes, details and ids. It does not name a pass, a
threshold or a helper — the alignment's internal shape is exactly what we may want to change
next, and a test that freezes it converts a refactor into a rewrite.

**Three existing seams. No new ones.**

1. **`diffRows()`, tested in `compare/compare.test.mjs`** — the primary seam and the highest
   one that takes plain data. Two arrays of content units in, rows and findings out. Everything
   behavioural lives here: merge and split detection, total coverage, the four-token and
   two-member guards, `detail` shaping, null `score`, the wide row's position, and the
   rejections. Prior art in the same file already pins the matcher's behaviour through this
   seam (the reorder case from ticket 62, the `mayPair` heading rule) and the classification
   order, so `regrouped` is pinned by the same tests that pin `copy` and `text-missing`.
   `pairLeftovers()`, `mayPair()` and `similarity()` are exported but must **not** be tested
   directly for this feature.
2. **`web/src/lib/view.test.mjs`** — that a regrouped row collapses into a context marker,
   carries no override control, keeps an absorbed heading in the jump-list, and opens on
   landing. Existing seam for row derivation; keeps these questions out of the browser tests,
   where `landing.browser.test.mjs` and `Repeats.browser.test.mjs` are prior art for the cases
   that genuinely need a DOM.
3. **`compare/contract.test.mjs` and `overrides/state.test.mjs`** — the two identity changes:
   the finding id over the space-joined run, and `findingSetHash()` ignoring visibility. Both
   already pin today's behaviour, so these are **edited assertions**, which is the clearest
   record that identity moved on purpose. `contract.test.mjs` already has a `findingId` case to
   extend.

**The four regression cases are the point of the exercise**, all at seam 1, all named in ticket
116: `/proefpakket/succes` accepted; `/fr/avantages` (16 dropped tokens) rejected;
`/fr/faq/collecte-livraison` (changed phone number) rejected; trailing-`>` `copy` rejected. A
future relaxation must fail on these loudly.

For ticket 118 the load-bearing test is that **changing a class's visibility leaves every
page's hash byte-identical** — that single assertion is the whole ticket.

The vocabulary flip needs no test beyond what already asserts the shape of `FINDING_CLASSES`.
Its evidence is a **measurement**, recorded per store before and after in ticket 86's answer,
with the requirement that no other class moves.

## Out of Scope

- **The 9,783 `text-missing` findings.** This clears 47 of them, 0.48%. An earlier containment
  measurement suggested 16.9% and that figure belongs to a rule we refused. The mountain is
  unexplained and stays open.
- **Many-to-many regrouping.** Unverifiable by a reader, unsupported by any measurement.
- **Migrating the ~59 detaching overrides.** Impossible honestly: the class change is not
  recorded anywhere the old key can be reached from. They are announced, not rescued.
- **The `h1` outline check** — ticket 117, `needs-triage`, and it may yet be answered with a
  one-off list to whoever owns SEO rather than a permanent check.
- **`restructured`.** Once `regrouped` takes the verbatim cases, what remains is *paired at
  ≥ 0.6, text genuinely differs, tag changed* — a real rewrite in a hidden class, counting
  nothing. Suspicious, out of scope, and worth its own ticket once we can see what lands there.
- **Re-tuning the 0.6 pairing threshold.** Ticket 28 ruled that out until the split question
  settles, and it has not.
- **Tickets 39 and 44**, both `needs-triage` on arguments ADR 0011 voided. They should be closed
  against these decisions rather than left parked, but not here.
- Mobile rendering, product grids, and every other excluded region. Unchanged.

## Further Notes

The measurements behind this are dated **2026-08-12** for `data/reports/` (816 snapshots, 722
comparable) and **2026-08-13** for the live `overrides` table (888–898 rows; it moved while
being read). Re-read rather than quote.

Two numbers to hold together, because they set the priority: `regrouped` is **233 shown
findings (2.09%)** and `heading-level` is **2,846 (10.00%)**. The class that took nine rounds of
design is worth a twelfth of the one-word change, and the one-word change was already specified
in ticket 86 and blocked. The order of the tickets reflects that.

`PRD.md`'s *Classification* rule — *measures the false positives first and may refuse the
change* — is what allowed
containment to be refused on price rather than argued about, and it is why ticket 116 carries a
gate rather than an estimate.

One correction worth carrying forward, because it was believed for part of this design: on
`/fr/avantages` it is **production** that holds the `6061-T6` sentence and the new site that
drops it. That case is not invented content being silenced; it is lost content being silenced,
which is worse, and it is the strongest single argument for total coverage.
