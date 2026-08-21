# Out of scope

A ticket in this folder is closed `wontfix`. It is kept, not deleted, because the design and
the measurement in it are evidence, and because each one carries a **re-open trigger** — the
condition that would make it worth looking at again.

The rules are the ones set out for `content-parity-log/issues/.out-of-scope/`:

- The folder holds `wontfix` tickets only. A resolved ticket stays in `issues/`.
- Every file states its re-open trigger, or says that there is none.
- A file here keeps its number. Numbers are never reused.
- The PRD still links to it. Moving a ticket here does not hide it.
- Links inside a moved file need one more `../`, because the file went one level down.

Made on 2026-08-19 by the audit of every open `ready-for-agent` ticket, for tickets 06 and 10.

Both were closed on 2026-08-21 when issue 11 reported. Ticket 10's trigger is **spent** — 11
read it directly and refused it, so re-opening needs a new argument and not that one again.
Ticket 06 carries a **new** trigger, because 11 answered its old one against it.
