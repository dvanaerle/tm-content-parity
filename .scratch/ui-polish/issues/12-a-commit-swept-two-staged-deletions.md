# 12 — A commit swept two staged deletions that were not its own

Type: defect, in the history rather than in the code
Status: needs-info — the call is the author of the other branch's to make

## What happened

Commit `8e33cf5` ("The header decides as a value") contains two file deletions that have
nothing to do with ui-polish 08:

- `.scratch/cross-store-reuse/issues/06-a-fix-claim-travels-over-a-shared-page.md`
- `.scratch/cross-store-reuse/issues/07-a-shared-page-says-what-is-store-scoped.md`

They were already **staged in the index** before ui-polish 08 was started, as the deletion
half of a rename: the replacements — `06-a-fix-claim-travels-over-a-link.md` and
`07-a-linked-page-says-what-is-store-scoped.md` — sit untracked in the working tree still.

The cause is `git add <paths>` followed by a bare `git commit`. A bare commit writes the
**whole index**, not the paths that were just added, so anything a previous session left
staged rides along. `git commit -- <paths>` is the form that cannot do this, and it is what
the next commit touching a dirty index should use.

## What is not wrong

No content is lost. The old text is in history at `d01eeaa`, the new text is in the working
tree, and the deletion is what the other branch's author had already decided on — the commit
landed their intent, in the wrong commit.

## Why this is not simply fixed here

The three ui-polish commits are local (the branch is 17 ahead of `origin`), so a rewrite is
available. It was not taken for one reason: `PageView.jsx` and `Progress.jsx` are each
touched by more than one of the three commits, so a path-limited replay would collapse the
incremental history it was written to keep, and a restoring commit on top would add a
delete-then-restore pair for two files their author is deleting anyway.

## The decision this needs

Whoever owns the cross-store-reuse rename says which they would rather have:

- **Leave it.** The deletion is theirs and it has happened; they commit the two new files and
  the rename reads as two commits instead of one.
- **Rewrite.** `8e33cf5` is amended to drop the two deletions and they are put back in the
  index, at the cost of replaying three commits by hand.
