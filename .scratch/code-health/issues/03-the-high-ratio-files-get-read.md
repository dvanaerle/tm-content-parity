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

**Status:** ready-for-agent

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

- [ ] Each candidate has a written finding appended to this file: does the code fail to say
      what it does?
- [ ] Each finding either names the specific extraction, with the function it would become, or
      states that the file passes and why.
- [ ] Comment-vs-code counts are re-measured and dated, so drift from the table above is
      visible.
- [ ] No source file is changed by this ticket.
- [ ] Extraction tickets are created only for the files whose findings call for one, each
      blocked by this ticket, one file per ticket.
- [ ] The declaration file carrying 385 comment lines to 29 of code is **not** assessed. It is
      almost entirely `@typedef`, JSDoc is a signature, and the file is as it should be.
