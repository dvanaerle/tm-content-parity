# UI and copy polish — the interface is quiet by default

Type: prd
Status: live — 2026-08-21: issues 01 to 05, 07 to 10 and **13** are resolved; 06 is
`needs-triage` and duplicates `content-parity-log` 77, which is resolved, so it is probably
closeable; 11 and 12 are `needs-info`. **Nothing under this PRD is `ready-for-agent`.** 13 came
out of `content-parity-log` 87 on 2026-08-19 — the touch-target floor and the header wrap, the
two criteria worth keeping when the three-widths programme was parked. A PRD carries no triage label (see `docs/agents/triage-labels.md`).
Written: 2026-08-17
Decided in: a grilling session against an outside audit, `UI and Copy Polish Blueprint`
Records: `docs/adr/0019-the-interface-is-quiet-by-default.md`

## Problem Statement

An editor opens a store dashboard to answer one question — *what do I decide next* — and the
screen answers with a census. Eight counters compete for the top of the page, four of them
repeating lists that are already further down it. Every category wears a filled badge, so
none of them stands out. A filter is styled as a warning, which means the colour that should
say *something is wrong* says *you clicked a pill*. Labels shout in capitals, and the loudest
of them is not even a word an editor knows: the class pill draws the raw contract key, so a
missing image reads as `IMAGE-MISSING`.

Underneath the noise are four defects that hurt more than the styling:

- A row **moves 273 pixels** when the override log answers, which is measured and documented
  in the log's own source. An editor about to tick *Fixed* has the row jump out from under
  the cursor.
- **Nothing is announced.** There is no `aria-live` region anywhere, so a bulk decision over
  40 pages, a failed re-check and a read-only log are all silent to a screen reader.
- A one-page repeat reads **`on 1 pages`**.
- A page note has **no clamp** and sits in a cell that does not wrap, so one long note
  stretches a table row across the screen.

The interface is also inconsistent with itself in ways that cost an editor confidence rather
than pixels: two date formats, three shapes of attribution, a floating bar that repeats the
text already on screen beside another floating bar that names nothing at all, and a *Clear*
that sometimes says what it clears and sometimes does not.

## Solution

The interface becomes quiet by default. Every device that adds visual weight — a card, a
border, a shadow, a badge, a capital letter — must be earned, and ADR 0019 says what earns
each one. Content becomes the loudest thing on every surface, and the palette's amber is
reserved for the three states that are genuinely wrong: **Needs attention**, a failed
**re-check**, and **read-only**.

Nothing is deleted. Where a screen carries more than it can say at once, a fact is **moved**
— to a disclosure, to a wider width, or to the head of the list it describes — because this
log's standing rule is that a fact is never silently absent. The four corpus counters at the
top of the dashboard join the lists they are about, which removes a duplication rather than
information.

Three things an editor reads gain words they did not have: a **class** says *Copy changed*
instead of `COPY`, a **comparison** shows two labelled sides instead of one line joined by an
arrow, and a **bulk write** that succeeds says so.

The mechanical half of the standard becomes tests, following the habit this repo already has
with the stopword sweep and the palette guard. A rule that can be grepped is a rule that
holds for years; a rule that is only prose lasts one sprint.

## User Stories

**Reading a class**

1. As a content editor, I want a class to say *Copy changed* rather than `COPY`, so that I do not have to learn a contract key to use the log.
2. As a content editor, I want a class label in sentence case, so that a category is not shouted at me on every row of a 168-row page.
3. As a content editor, I want *Image missing* to read as words, so that I can tell at a glance which of thirty-one classes I am looking at.
4. As a rule author, I want a class label to live beside its `meaning` in the vocabulary, so that inventing a class forces me to name it for an editor.
5. As a maintainer, I want a class without a label to fail the test suite, so that the thirty-second class cannot arrive unnamed.

**Comparing two sides**

6. As a content editor, I want a comparison to show two labelled sides, so that I always know which text is production and which is the new site.
7. As a content editor, I want the two sides never joined by an arrow, so that the log does not imply that one text became the other — which it cannot know.
8. As a content editor, I want long Dutch paragraphs and German compound words to wrap naturally in both sides, so that I can read the difference I am deciding about.
9. As a content editor on a narrow screen, I want the two sides to stack rather than shrink, so that neither side becomes too narrow to read.
10. As a content editor, I want the two sides to keep equal width on a wide screen, so that metadata cannot squeeze the content I am comparing.
11. As a content editor, I want *Production* and *New site* to be the only two words used for the two sides anywhere, so that I never wonder whether *Old* means production.

**The dashboard header**

12. As a content editor, I want the dashboard header to lead with open work and what needs attention, so that it answers what I came for.
13. As a content editor, I want the count of one-sided pages at the head of the one-sided list, so that the number and the list it describes are in one place.
14. As a content editor, I want the count of not-checked pages at the head of the not-checked list, for the same reason.
15. As a content editor, I want the diagnostics count on the diagnostics disclosure, so that a number I cannot act on is not competing with my queue.
16. As a content editor, I want no prominent success styling for a healthy system, so that a banner means something when it appears.
17. As a content editor, I want the header to stop explaining the log's design to me while I am working, so that the sentences left are ones I can act on.

**The pages table**

18. As a content editor, I want the page key to be the most prominent thing in its row, so that I can scan for the page I mean.
19. As a content editor, I want open work as the second column, so that worst-first is legible without reading four count columns.
20. As a content editor, I want the block count out of the page cell and into its own column, so that the page cell is not carrying five things.
21. As a content editor on a narrow screen, I want the per-check counts to drop out rather than crush the row, so that the table stays readable.
22. As a content editor on a wide screen, I want the per-check counts to remain, so that I lose nothing I have today.
23. As a content editor, I want a long page note shown as a mark in a list and in full where the note lives, so that one note cannot stretch a table row.
24. As a content editor, I want priority to read *High* rather than `HIGH`, so that a priority is information and not an alarm.

**The page header**

25. As a content editor, I want the breadcrumb kept whole, so that I can see where the page sits as well as the way out.
26. As a content editor, I want the progress bar to keep its absolute counts beside its percentage, so that a growing corpus does not read as a regression.
27. As a content editor, I want review state, priority and note collapsed onto one quiet line, so that they do not compete with the page key.
28. As a content editor, I want *Re-check* to stay a visible button, so that the one action with a cost is not hidden in a menu.
29. As a content editor, I want the block count where the blocks are, so that the header is not reciting the content view's business.

**Findings and decisions**

30. As a content editor, I want the state of a finding as plain words rather than a badge, so that badges mean something where they remain.
31. As a content editor, I want *Needs attention* to stay loud, so that the one bucket that is wrong looks wrong.
32. As a content editor, I want *claimed fixed, still differs* as a sentence naming the person, so that I know whose claim I am about to overturn.
33. As a content editor, I want attribution in one shape everywhere — action, editor, date — so that I am not reading three layouts for one event.
34. As a content editor, I want a dismissal reason on its own line under the state, so that the judgement and its reason read as one thing.
35. As a content editor, I want secondary actions on a finding row available but quieter, so that content dominates the row.

**Bulk decisions**

36. As a content editor, I want the floating bar to name what I selected and its class, not repeat the text already on screen, so that the bar does not duplicate the row above it.
37. As a content editor, I want the annotate bar to name its object too, so that *2 pages selected* says which pages.
38. As a content editor, I want a bulk write that fully succeeds to say so, so that silence does not look like a no-op after I decided on 40 pages.
39. As a content editor, I want a partial failure to keep saying *N of M saved*, so that I know how far an append-only write got.
40. As a content editor, I want the bulk dialog to be one title, one task and one action, so that a decision is not buried in explanation.
41. As a content editor, I want the tooltip that tells me which selected pages a *Clear* will skip, so that I keep the one piece of prose that tells me what my press does.

**Filters and search**

42. As a content editor, I want the filter strip to be quiet, so that amber still means something is wrong.
43. As a content editor, I want the filter strip to keep naming all three kinds of narrowing in one sentence, so that I can never misread an empty list.
44. As a content editor, I want *Clear filter* to wear the same colour as the pressed pill, so that the strip and its control read as one thing.
45. As a content editor, I want the search placeholder to describe what search actually reaches, so that I do not assume it searches something it does not.
46. As a content editor, I want an empty result to say which kind of nothing it is, so that a typo and a finished page are different answers.
47. As a content editor, I want search results to look like findings, so that search does not feel like a separate product.

**Words**

48. As a content editor, I want *Show diagnostics* rather than *Show noise*, so that the control and the thing it reveals are one word.
49. As a rule author, I want *diagnostics* to mean *what a rule saw* and never the health of the build, so that one word keeps one meaning.
50. As a content editor, I want every *Clear* to name what disappears, so that I know what I am about to lose.
51. As a content editor, I want one date format everywhere, so that I am not comparing `17/08/2026` with something else.
52. As a content editor, I want a date without seconds, so that a timestamp is not more precise than the decision it describes.
53. As a content editor, I want no uppercase except a table's own headings, so that nothing in the interface is shouted at me.
54. As a content editor, I want an ellipsis only where another interaction follows, so that I can tell *Dismiss…* from an action that happens at once.
55. As a content editor, I want shorter copy where the interface is explaining its own reasoning, so that the sentences left are consequences I can act on.
56. As a content editor, I want the honesty banners kept in full, so that I still know what happened to my data when the log cannot be read.

**Stability, feedback and access**

57. As a content editor, I want a row not to move when the override log answers, so that the control does not jump out from under my cursor.
58. As a content editor, I want a banner appearing not to push my queue down, so that opening a page does not move what I was reading.
59. As a screen-reader user, I want a saved decision announced, so that I know a write happened.
60. As a screen-reader user, I want a failed re-check announced, so that I am not left waiting for a result that already failed.
61. As a screen-reader user, I want read-only state announced, so that I do not attempt a decision that cannot be saved.
62. As a keyboard user, I want every interactive element to have a visible focus state, so that I can see where I am.
63. As a keyboard user, I want an icon-only control to have an accessible name, so that `×` tells me it clears the selection.
64. As a touch user, I want a comfortable hit area on small controls, so that a compact glyph is not a compact target.
65. As a content editor, I want hover never to move or resize a row, so that the page does not shift as my pointer crosses it.
66. As a content editor, I want a selected row marked by a tick and a tint alone, so that selection is one statement rather than four.

**Correctness found along the way**

67. As a content editor, I want a one-page repeat to read *on 1 page*, so that the log's own arithmetic is not visibly wrong.
68. As a content editor, I want a page note visible while I edit it, so that the page does not hide the note it is asking me about.
69. As a maintainer, I want the stale docstring claiming a module holds "the Dutch label an editor reads" corrected, so that a reader is not sent looking for something that left with ADR 0014.

## Implementation Decisions

**Authority when the audit and the glossary disagree.** `CONTEXT.md` wins by default and a
refused section is recorded as a refusal with its reason, so the next audit gets the same
answer. The glossary is permitted to lose by exception, and it did twice: the filter strip's
amber and the *noise* / *diagnostics* collision. Both are already amended in `CONTEXT.md`.

**Nothing is deleted; a fact may be relocated.** A fact behind a disclosure, at a wider
breakpoint, or moved to the head of its own list is not silently absent. A fact removed is.
This is the test to apply to any section of the audit that reduces what a screen carries.

**A closed badge vocabulary.** Four badges: the class pill, the priority, *Needs attention*,
and the one-sided chip. A fifth is an amendment to ADR 0019. Everything else becomes text,
including `Open` and `Closed`, every count, and every date. The class pill is deliberately
**kept** — ticket 79 removed the row tint on the grounds that the pill carries the signal, and
converting it to text would re-create what 79 solved.

**A class gains a label, and the label is a domain fact.** It lives beside `meaning` in the
comparison vocabulary, not in the web layer, because what a class *is* does not depend on who
draws it. `classInfo()` already returns a `pill`; the label joins it. The label is never the
key, and the key remains what the finding id is made of.

**A comparison is two labelled sides.** Never one line, never an arrow. The arrow asserts that
one text became the other, which is exactly the reading `CONTEXT.md` refuses when it retires
the word *Changed*. Whether the sides sit beside each other or stack is decided by the space
available, expressed as a **container** size query — permitted by ADR 0015 and owned as a
subject by ticket 87 — so the same component stacks inside a narrow group and sits side by
side in the content view.

**The filter strip becomes neutral, with primary as its only colour.** Amber was carrying
`--destructive` and the `caution` tone and a normal state at the same time. The strip's
sentence, its enumeration of all three kinds of narrowing, and its single *Clear filter* do
not change: those exist so an empty list cannot be misread, which is the sentence's job and
never the colour's.

**The diagnostics toggle is renamed.** *Show noise* becomes *Show diagnostics* and the
`Hidden noise` counter becomes `Diagnostics`. The label and the visibility value it reveals
were two words for one thing. *Noise* joins the stopword guard so the rename cannot rot.

**The interface stops arguing, by a rule rather than a length limit.** The interface says what
is true and what happens next; the glossary says why the log decided that. A sentence that
defends a design decision against a reader who is not asking goes. A sentence that tells an
editor what their press will and will not touch stays, however long. The honesty banners
survive intact — they are the best copy in the application.

**One date helper, two functions.** A day and a moment, `17 Aug 2026` and
`17 Aug 2026, 14:03`. Seconds are dropped. Every other formatting call site goes.

**Attribution has one shape:** the action, the editor and the date on one line, with a reason
on the line below where there is one. This replaces the three shapes in use and satisfies the
audit's request to prefer *Dismissed* + *Reason:* over a `[DISMISSED]` badge.

**A floating bar names its object and its scope, never its content.** The bulk bar names the
count and the class; it stops repeating the two texts that are already on screen above it. The
annotate bar gains the same shape, which fixes its under-labelling. The count bubble currently
duplicated verbatim in both bars becomes one component.

**A bulk write that fully succeeds renders one line.** The existing report component returns
nothing on total success; it gains a success line in the place it already renders failures. No
toast, and no new primitive: for a single row the state flipping is the feedback, and silence
is only wrong when the write covered pages the editor cannot all see.

**Space is reserved for the per-row override control.** The measured 273-pixel shift is the
worst defect in the audit's territory and it is documented in the log's own source. The
existing mitigation delays the scroll; it does not prevent the shift. The control's height is
reserved per row instead. The banners shift once and above the fold, and they are left alone.

**One `aria-live` region.** Not requested by the audit, and a defect regardless. It carries
save results, re-check outcomes and read-only state.

**Sequencing.** This pass is **blocked by ticket 133**, which is migrating the tone maps from
JavaScript into CSS selectors across the dashboard and the ledger — the two largest files here.
133's whole value is that it can prove nothing moved; folding a taste-driven repaint into it
would destroy that proof. The two issues that touch neither file — the class labels and the
mechanical guards — ship first and unblocked.

**Boundaries with issues already open.** The responsive sections are appended to ticket 87
(*Three widths*) as acceptance criteria rather than opened as rivals. The accessibility hints
belong to ticket 129. The class labels are **pulled out** of ticket 98, which absorbed them as
part of the Meta tab: the labels are needed by the class pill on every surface, and 98 is a
feature build that may sit for weeks.

## Testing Decisions

**What makes a good test here.** It asserts what a reader or an editor can observe — a word on
screen, a shape of markup, a height that does not change — and never how a component reached
it. Two of this pass's rules are about *absence* (no uppercase, no second date formatter), and
absence is best asserted over the source as text rather than over a rendered tree, because a
rendered tree only proves the one case that was rendered.

**Seam A — the source sweep.** Prior art is `interface-language.test.mjs`, which reads every
`.jsx`, `.mjs` and `.astro` file under the web source and refuses a word list, and
`palette.test.mjs`, which greps call sites so a tone used in a component but absent from the
palette fails. This pass adds one guard per ADR:

- the existing language guard gains `noise`, which is its own subject
- a new guard enforces ADR 0019's mechanical rules: no `uppercase` utility outside a table
  heading selector, no badge outside the closed list of four, no date formatted outside the
  helper, an accessible name on every icon-only control, and a qualified object on every
  *Clear* that labels a control

One guard per ADR, so a reader arriving from either decision finds its enforcement.

**Seam B — the vocabulary object.** A data-level test over the finding classes: every class
has a label, no label equals its key, and labels are unique. No rendering and no component,
in the shape `palette.test.mjs` uses to refuse a ninth tone.

**Seam C — the date helper.** A unit test proving the two formats. Singleness is Seam A's
business; this proves correctness.

**Seam D — the existing browser tests.** `ContentView`, `Repeats`, `Dashboard`, `Ledger` and
`Progress` each already have a `*.browser.test.mjs` running in real Chromium. Extend them
rather than adding files. What lands here:

- a comparison renders two labelled sides and no arrow
- the floating bar names the class and not the two texts
- a live region exists and receives the save result
- a page note is clamped in a list context
- **the row does not change height when the override log resolves** — render with the log
  pending, measure, resolve, measure again, assert equal. This is the 273-pixel defect written
  as a test, and it fails today.

**Knowingly unguarded.** The *computed* responsive behaviour of the container queries. Browser
mode could measure it, but width assertions are brittle and the subject belongs to ticket 87.
The markup contract is asserted — both sides labelled, the container context declared — and the
layout itself is left to a reader. Stated here so the gap is a decision and not an oversight.

Also unguarded, and for the reason ADR 0019 gives: the rules that need taste. No
visual-regression suite is adopted. There are no snapshot tests in this repo by choice, and
buying a standing cost to support one polish pass is refused.

## Out of Scope

- **`First seen` on a finding row.** The audit asks to polish it; nothing renders it today,
  though the run log holds the fact. Rendering it is a feature, and putting a date on a row
  invites reading age as priority — which the run log is careful never to assert. Parked as its
  own `needs-triage` issue.
- **A toast primitive.** Success stays quiet; the report line covers the one case where silence
  is genuinely ambiguous.
- **Any change to what the log counts.** No bar, denominator, percentage or bucket rule moves.
  A filter has never moved a number and this pass does not change that.
- **The comparison itself.** No class is added, retired or re-triaged; no visibility changes;
  no extraction rule moves. `regrouped` and `untranslated` remain decided-and-unbuilt, which is
  now noted in the glossary.
- **The responsive widths themselves**, which are ticket 87's. This pass hands 87 acceptance
  criteria and consumes its container-query answer.
- **Screenshot or visual-regression testing.**
- **A reading view, a coverage matrix, or a migration checklist.** All three are parked
  `wontfix` and nothing here reopens them.

## Further Notes

**The audit invented part of its own evidence, and that shaped how it was used.** Several
strings it quotes as "Before" do not exist in this repo: a long dismissal prompt (the actual
placeholder is *Why is this not a defect?*), `Log connected successfully`, a permanent
`✓ Decision successfully saved`, and `LOADING...`. There is no success feedback anywhere, so
three of its sections polish copy that was never written. Its *aesthetic* observations survive
this — visual weight is something a screenshot shows honestly — but every copy section had its
"Before" verified against source before it became a decision here. A future audit gets the same
treatment.

**Two of its sections were already satisfied and guarded.** One radius with a derived scale,
and colour-by-meaning asserted in the palette test. A third — a shared primitive layer — was
satisfied by ADR 0007's twenty-one components.

**The audit contradicts itself once, and the glossary settled it.** It asks for the page
breadcrumb to be replaced by a back-link, and it also demands that every screen answer *Where
am I?*. A back-link says where you would go. The breadcrumb is kept whole.

**Four defects came out of the fact-finding rather than the audit**, and they are listed in the
problem statement. Three ride along inside issues that already touch those files; the note
clamp is a design decision and sits with the pages table.

**A stray file** exists at `.scratch/language-blocks/issues/Untitled`, holding one line naming
another issue file. Noted for deletion.
