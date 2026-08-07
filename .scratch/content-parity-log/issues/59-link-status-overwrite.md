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

**Status:** ready-for-agent

**Session:** 2, and before session 3. See `../RUNBOOK.md`.

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

## Triage, 2026-08-07: ready-for-agent, session 2

**Refuse the argument. Do not merge the file.**

The two candidate fixes are not equal in cost. **Refusing needs no new
information**: the script takes no store, and it exits 2 with a message if it is
given one. **Merging needs a decision nobody has taken** — a kept status was
measured on an earlier date, so the file would have to carry a date for each
target, and somebody would have to say how old a kept status may be before the
merge is lying. That is a second ticket hiding inside this one.

Refusing also matches what the code is for. A per-store run of this script is not
a thing anybody wants; it is a thing somebody types by mistake, because the four
scripts beside it all take a store. Making the mistake impossible to type is the
whole fix.

**Build it in session 2, before session 3.** Session 3 and session 5 both run
`compare/link-status.mjs`, and session 5 is the 1,600-request crawl of spec 50.
Today the only guard is a paragraph in `README.md` and a line in `map.md`, and
prose does not stop a keystroke. If the destructive call happens during those
sessions, the next compare reports **no `broken-link` and no `redirect` at all**
and every number of the sitting is wrong in the quietest possible way.

### What to build

- `compare/link-status.mjs` takes no positional argument. Given one, it prints
  why and exits **2**. The message names the reason: the file is keyed on the
  target url and holds every store, so a per-store run erases the rest.
- The refusal is a **pure, tested function**. A rule with no test is not a rule
  (`AGENTS.md`), and this rule's whole job is to fire on an input nobody sends on
  purpose.
- `README.md` and `map.md` keep their sentence, but it now describes a guard
  rather than being the guard.

### The third question is in scope

**Sweep every `writeFile` into `data/` and say whether the shape is a pattern.**
Two instances have been found by hand — the extract failure log, which ticket 38
fixed with a per-store filename, and this one. Two is not yet a pattern and a
sweep is cheap. Record the answer in this ticket. If a third is found, it gets
its own ticket rather than growing this one.
