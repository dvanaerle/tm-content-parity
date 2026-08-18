# 03 — The high-ratio files get read

**What to build:** an answer, in writing, to the question nobody has asked of the tree's
comment-heaviest files: is the comment carrying what the code should have said? Where it is,
the fix is Fowler's — extract and rename until the explanation is unnecessary. Where it is not,
the file passes and nothing changes.

**This ticket changes no code.** It produces a finding per file. Extractions become their own
tickets, blocked by this one, and only for the files whose findings call for them.

**Blocked by:** none for the files outside `ticket-104-search-page-scope`. Two candidates —
`web/src/lib/view.mjs` and `overrides/state.mjs` — plus `web/src/components/BulkControl.jsx`
are modified on that branch, and their findings wait for it to land.

**Status:** resolved — 2026-08-18, findings only, no source commit. On `ticket-104-search-page-scope`, which is why `view.mjs`, `state.mjs` and `BulkControl.jsx` were readable.

The candidates, measured 2026-08-18 over the tracked tree:

| candidate | comment | code | ratio |
| --------- | ------- | ---- | ----- |
| `web/src/lib/search.mjs` | 604 | 187 | 3.23 |
| `web/src/lib/landing.mjs` | 151 | 50 | 3.02 |
| `web/src/lib/view.mjs` | 577 | 194 | 2.97 |
| `web/src/lib/blocks.mjs` | 191 | 85 | 2.25 |
| `overrides/state.mjs` | 316 | 150 | 2.11 |

Plus one JSX candidate on the same reasoning: `web/src/components/BulkControl.jsx` carries
nine `{/* … */}` labelled markup regions in 200 lines of code. Nine labelled regions is a
statement about the component, and the remedy is a subcomponent, not a tidier comment.

**What a finding must not do.** It must not propose deleting a reason. These files hold the
repo's memory of decisions taken — *"a fourth value would arrive here as a zero and never as a
missing key"* — and the standard's *Density is not a violation* clause exists precisely to
refuse the reading that a high ratio licenses deletion. A finding either names an extraction
or clears the file.

**"Read, five pass, one needs work" is a complete delivery.** That is the expected outcome, and
the ticket must not pressure anyone into a cosmetic edit to look productive.

- [x] Each candidate has a written finding appended to this file: does the code fail to say
      what it does?
- [x] Each finding either names the specific extraction, with the function it would become, or
      states that the file passes and why.
- [x] Comment-vs-code counts are re-measured and dated, so drift from the table above is
      visible.
- [x] No source file is changed by this ticket.
- [x] Extraction tickets are created only for the files whose findings call for one, each
      blocked by this ticket, one file per ticket.
- [x] The declaration file carrying 385 comment lines to 29 of code is **not** assessed. It is
      almost entirely `@typedef`, JSDoc is a signature, and the file is as it should be.

## Answer

Six files read, six pass, no extraction ticket. The comments are the repo's memory of
decisions; the code already names the blocks they sit on. Density is not a violation, and
deleting any of this would leave the code exactly as it was.

Re-measured 2026-08-18 on this branch (own-line `//` / `/*` / `{/*` vs non-blank code):

| candidate | comment | code | ratio | 2026-08-18 earlier |
| --------- | ------- | ---- | ----- | ------------------ |
| `web/src/lib/search.mjs` | 671 | 200 | 3.35 | 604 / 187 / 3.23 |
| `web/src/lib/landing.mjs` | 151 | 50 | 3.02 | unchanged |
| `web/src/lib/view.mjs` | 633 | 219 | 2.89 | 577 / 194 / 2.97 |
| `web/src/lib/blocks.mjs` | 191 | 85 | 2.25 | unchanged |
| `overrides/state.mjs` | 316 | 150 | 2.11 | unchanged |
| `web/src/components/BulkControl.jsx` | 205 | 203 | 1.01 | (JSX regions, not in the table) |

`search.mjs` and `view.mjs` grew on this branch (page scope; regrouped runs). The ratio on
`view.mjs` fell slightly because the new code outpaced the new comments. Neither drift
changes the finding.

### `web/src/lib/search.mjs` — passes

The code says what it does. The named functions already *are* the extractions a high ratio
would have asked for: `storePage`, `indexStore`, `indexOverBlock`, `addPage`,
`linkTextByKey`, `matchedFields`, `parseTerm`, `splitScope`, `scopeSuggestions`, `withScope`,
`inScope`, `searchStore`, `explainScope`, `kindOf`, `searchNotes`. What the comments carry
is what those names cannot: why six field names sit on two columns, why the index is emitted
at build time, why a result must not extend `Repeat.on`, why a slash is structure in first
position only. That is *a reason*. No extraction.

### `web/src/lib/landing.mjs` — passes

`findingAnchor`, `landingFor`, `landedRowProps`, `useLanding`, `landingRow`, `useLandOn` are
already the named units. The comments refuse the obvious alternatives: a landing is never a
filter; Meta is absent from `TAB_OF_CHECK` on purpose; two borrow-flags exist because one
flag made the two controls hand each other back; the scroll is not smooth because this is a
navigation. No extraction.

### `web/src/lib/view.mjs` — passes

Read on this branch, where the file is already moving. `prepareRows`, `runOf`, `anchorKey`,
`collapses`, `collapsedKeys`, `markerRule`, `collapseRuns`, `repeatsInStore`,
`repeatsWithClasses`, `groupRepeatsByClass` are the named units. The comments are why
`equal` is not `collapses`, why the collapse set is taken once, why a filter never moves a
count, why a regrouped run that misses a member is absent rather than partial (ADR 0012).
No extraction.

### `web/src/lib/blocks.mjs` — passes

`comparablePath`, `siblingPages`, `unmeasuredRow`, `agreementOf`, `blockReading` already
name the work. The comments are why the `fr/` prefix comes off here and nowhere else, why
alternate outranks path, why `mutual` and not `share === 1`, why the file stays in `web/`
(ADR 0001, third question). No extraction.

### `overrides/state.mjs` — passes

Read on this branch. `bucketOf` throws so a fifth state cannot fall into Closed;
`eventKey` / `pageScopeKey` keep the review's key apart from the two annotations;
`isContradicted` compares observation ids as strings because they sort by construction;
`clearedEventFor` exists so two callers write the same event. Every one of those is a
reason a rename would not carry. No extraction.

### `web/src/components/BulkControl.jsx` — passes

The nine `{/* … */}` comments are not labelled markup regions. They are reasons: why the
bar is not `role="toolbar"`, why the two presses are offered independently, why Clear has
no ellipsis, why cancel is `type="button"`, why an explicit space sits between the count
and the sentence. The subcomponents the ticket would have asked for are already here —
`Selection`, `Covers`, `ClearCrossesBlock`, `NothingToDismiss`, `NotWriting`, `Report`.
Extracting further would split a 200-line bar into files that still needed the same
reasons next to the same presses. No extraction ticket.
