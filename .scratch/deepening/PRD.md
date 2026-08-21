# Deepening — the interface side of the tree

Type: prd
Status: live — 2026-08-21: 01, 02, 03 and 04 written, none started. 01 is unblocked.
Written: 2026-08-21
Decided in: an architecture review of 2026-08-21, then a grilling session per candidate
Records: `docs/adr/0030-the-list-reading-states-what-a-press-may-cross.md`, and the **List
reading** entry in `CONTEXT.md`

## Problem Statement

The repo already contains the shape it wants. `crawl/extract.mjs` is 664 lines of
implementation behind three exports; `compare/30-compare.mjs` puts one page's whole comparison
behind `comparePage()`. Nobody has to learn either one to change a rule inside it.

The friction is all on the interface side, in the browser half:

- `web/src/lib/view.mjs` is 1,210 lines behind **26 exports**, holding four unrelated groups —
  the content view, the repeat list, the page list, and narrowing helpers imported by six
  modules that have nothing else in common. Nine of the repeat exports have an **ordering** that
  is part of the interface and unenforced, kept by three callers each composing correctly.
- The repeat list's facts about its screen travel as ten props through four levels of drawing
  code, while the one fact of the same kind that already sits at a seam — the selection — is
  read by context.

Neither is a bug. Both are a tax on the next change, and the rules involved moved twice in the
month before this was written.

## Solution

Three tickets, in order, each deepening one module: a screen states one fact and the list
derives the rest (01); one file stops holding four views (02); the repeat pipeline gets one
entry that enforces its own ordering (03).

**The measure is not the width of a signature.** It is that the next move of a rule lands in
one function with one test file, instead of in five sites that have to be found.

## The queue

| # | Ticket | Blocked by | Candidate |
| - | ------ | ---------- | --------- |
| 01 | A list is handed one reading of its screen | none | 1 of the review, *Strong* |
| 02 | Three views stop sharing one file | 01 | 2 of the review, *Strong* |
| 03 | A repeat list counts before it narrows | 02 | 2 of the review, *Strong* |
| 04 | A page is read once, and the queue counts first | 03 | 3 of the review, *Worth exploring* |

All four touch `Dashboard.jsx`, so **no two of them may share a slot.** All four may run beside
`cpl` 129 part B and `cross-store` 07 — checked 2026-08-21 against both reading lists, no file
in common.

**03 and 04 enforce one rule on two lists.** *Count before you narrow* is the class pill's rule
above the repeat list and the priority chip's rule above the page queue, and both were kept by a
caller remembering it. They are separate tickets because they are separate modules, and they
should read as the same change said twice.

## Not scheduled

**Candidate 4 of the review — make the press its own test surface.** Refused as a deepening.
`BulkControl` already takes everything it needs as arguments, so the missing thing is a test at
its own interface, not a refactor; extracting its sentences for testability alone would move
complexity without concentrating it. 01 dissolves most of the reason it looked like a candidate.

## Out of Scope

- The `crawl/` and `compare/` halves. They are the model of depth this PRD is measured against,
  and the review deliberately listed no candidate in either.
- Any change to what a press may cross, to the ordering of a repeat list, to the class pills'
  counts, or to *Include closed*. Every rule here keeps its meaning; what moves is where it is
  stated.
- The comment-bar work of `.scratch/code-health/`, which is a different question about the same
  files.
