# 01 — The words are consistent

**What to build:** an editor reads one word for one thing, everywhere. A class says *Copy
changed* instead of drawing the contract key `COPY`. The control that reveals what a rule saw
says *Show diagnostics*, and so does the counter that used to say *Hidden noise*. Every date
reads the same way. Every *Clear* says what disappears. Every decision reads as one event —
the action, who made it, when — rather than three labelled fields. And the sentences in which
the interface explains its own design decisions to somebody who is trying to work are gone,
while the sentences that say what happened to their data stay.

**Blocked by:** None — can start immediately. It touches neither of the two files ticket 133
is rewriting.

**Status:** ready-for-agent

**Parent:** ../PRD.md

- [ ] Every finding class carries a **label** in the comparison vocabulary, beside its
  `meaning`, in sentence case. An editor never sees a contract key.
- [ ] A test asserts every class has a label, that no label equals its key, and that labels are
  unique — so the thirty-second class cannot arrive unnamed.
- [ ] The class pill and every other reading of a class draw the label, not the key.
- [ ] The diagnostics control says *Show diagnostics*; the dashboard counter says
  *Diagnostics*. The word *noise* is gone from the interface.
- [ ] `noise` joins the stopword guard that already enforces the interface language, so the
  rename cannot rot.
- [ ] One date helper offers a **day** (`17 Aug 2026`) and a **moment** (`17 Aug 2026, 14:03`).
  Seconds are dropped. No other call site formats a date, and a guard refuses one.
- [ ] A unit test proves both formats.
- [ ] Every control labelled *Clear* names its object — the search, the filters, the selection,
  the note, the decision, the page scope. A guard refuses a bare *Clear* on a control.
- [ ] Attribution has one shape everywhere: the action, the editor and the date on one line,
  with a reason on the line below where there is one. This replaces the three shapes in use.
- [ ] Explanatory prose is cut by the rule **the interface says what is true and what happens
  next; the glossary says why the log decided that.** A sentence defending a design decision
  against a reader who is not asking goes.
- [ ] The honesty banners survive **intact** — the read-only sentences, the log-not-answering
  sentences, and the tooltip that says which selected pages a *Clear* will skip. Those are
  consequences, not justifications.
- [ ] `npm test` passes, including the existing language and palette guards.

## Traps

- **The label is not the key, and the key does not change.** The finding id is made of the
  class key. Renaming a key would expire every override in the database.
- **Do not put the label in the web layer.** What a class *is* does not depend on who draws it,
  and ADR 0019 records this as a domain fact. It lives beside `meaning`.
- **Do not touch the two `<head>` classes' visibility or the vocabulary's shape.** This ticket
  adds a field; it re-triages nothing.
- **`diagnostics` means *what a rule saw*, and never the health of the build, the crawl or the
  log.** `CONTEXT.md` says so; a new sentence that uses it the other way is the collision this
  rename exists to close.
- **Cutting prose is where this ticket can do damage.** When in doubt whether a sentence is a
  consequence or a justification, keep it. A lost warning about unsaved data costs more than a
  long tooltip.
