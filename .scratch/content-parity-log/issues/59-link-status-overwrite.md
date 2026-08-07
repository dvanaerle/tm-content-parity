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

**Status:** resolved 2026-08-07

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

## Answer, 2026-08-07

`compare/link-status.mjs` takes no argument. `refusalReason(args)` is pure and
tested, it returns the reason as a string or `null`, and the CLI prints the
reason and exits **2**. `README.md`, `map.md` and `RUNBOOK.md` now describe the
guard. The status file keeps its shape: no store dimension was added.

### The sweep: no third instance

Six writes go into `data/`. The legacy prototype stages `01`–`06` and `10` write
into `_data/` and `pages/`, and the probes `probe-images.mjs` and
`probe-link-leakage.mjs` write into `_data/`. All of them are outside the shape.

| Write | Takes a store? | Verdict |
| --- | --- | --- |
| `20-extract.mjs` → `data/extract/<store>/<page>.json` | yes | keyed on the store. Safe. |
| `21-crawl-store.mjs` → the same extracts, and `data/extract-failures-<store>.json` | yes | the ticket 38 fix. Safe. |
| `30-compare.mjs` → `data/reports/<store>__<page>.json` | optional | keyed on the store. Safe. |
| `30-compare.mjs` → `data/snapshot.json` | optional | global and overwritten, but see below. |
| `probes/probe-tag-changes.mjs` → `data/probe-tag-changes-<store>.json` | yes | keyed on the store. Safe. |
| `probes/probe-extract-v2.mjs` → `data/probe-extract-v2.json` | no | one whole-run summary. Safe. |
| `link-status.mjs` → `data/link-status.json` | no, since this ticket | fixed. |

`data/snapshot.json` is the near miss and it is not a third instance. It is a
summary of one run and not an accumulation, it carries `store: <store>` for a
per-store run, and every number in it is regenerated by the next full run. A
per-store run therefore records a smaller true fact, and it destroys no
measurement.

The destructive shape needs two things at once: a file that holds data from
earlier runs, and a script that takes a store and writes that file at a fixed
path. Only the two known files had both. The shape is not a pattern, and no
third ticket is opened.
