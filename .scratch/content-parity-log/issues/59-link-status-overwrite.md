# 59 — `link-status.mjs` erases the other stores

**What this is:** a CLI that destroys data when it is given an argument, and today
the guard against it is a paragraph of prose.

`compare/link-status.mjs` writes one file keyed on the absolute target URL, and it
**overwrites** that file. So `node compare/link-status.mjs be` erases every other
store's statuses. The next `nl` compare then reports no `broken-link` and no
`redirect` at all — it reads an empty status file and finds nothing wrong, which is
the worst shape a defect in this tool can take. The log's whole job is to say what
is broken.

Ticket 38 met the same shape in the extract failure log and fixed it with a per
store filename. This one cannot take that fix: a target's status is a fact about
the target and not about a store, so the file has no store dimension to give it.
Ticket 38 fixed it **by usage** — run the script over every crawled store at once —
and wrote the rule into `README.md` and the map. The review of ticket 38 asked for
more than that, because usage is not a guard.

**Status:** needs-triage

**Origin:** the review of ticket [38](38-six-stores.md), 2026-08-07.

## What triage has to settle

- **Refuse the argument, or merge into the file?** The two candidate fixes are
  different in kind. Refusing means the script takes no store and exits 2 if it is
  given one, which makes the destructive call impossible to type. Merging means the
  script reads the file it is about to write and keeps the targets it did not
  check, which makes a per store run safe and useful.
- **Merging needs an answer about staleness.** A kept status was measured on an
  earlier date. The file would have to carry the date for each target, or the merge
  hides an old measurement behind a fresh run. Refusing the argument needs no such
  answer, which is the argument for refusing.
- **Is there a third overwrite?** Two have been found by hand — the extract failure
  log and this one. A sweep of every `writeFile` into `data/` would say whether the
  shape is a pattern.

## Not to decide again

Ticket 38 settled that the status file has no store dimension. Do not add one.
