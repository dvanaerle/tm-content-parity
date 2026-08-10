# Finding history is a run log, and it never re-attaches

Ticket 01 made the finding id content-addressed, so the id expires when either side
of the text changes. The product wants a finding to say when it was first seen, that
it is still seen, and that it is seen no more.

We decided to keep the expiring id and to add a **run log**: a committed index,
keyed on the finding id alone, that records the first observation and the last
observation which saw that id. The index is rewritten at each run, and **git history
is the archive**. `crawl/` writes it, `compare/` and `web/` read it, so the arrow
still points one way.

The run log answers three questions and no more: when was this id first seen, is it
in the current snapshot, and when was it last seen. It holds no text, no decision
and no relation between two ids.

## Why it does not re-attach

The proposal asked for a `Changed` label: when production edits the text of a
dismissed finding, show the new finding beside the old decision, and use `Changed`
"when the historical relation is strong" and `New` "when the relation is uncertain".

That is a matcher with a threshold, and ticket 01 refused a fuzzy re-attachment pass
by name. The reason is the direction of the failure. A matcher that is wrong carries
a dismissal onto text that nobody dismissed, which is the one thing the
content-addressed id exists to make impossible. It also fails **silently**: a
wrongly attached dismissal reads as a decision an editor made, and nothing in the
pipeline can report it. An expired id fails in the other direction — it asks a
question that is already answered, which costs a minute and is visible.

The same argument rules out offering a stale note as a suggestion. A human matcher
with an accept button is the same matcher with a slower threshold.

What replaces the label is a **history note**: beside a new finding, the log may say
that a finding of the same class closed on the same page in the same run, and what
was decided about it. The note is display-only. It has no id, no override and no
place in a bar, and it asserts no identity. It reports what the run log saw.

## Considered options

- **A Supabase table the crawl writes to.** Rejected. The overrides table holds
  editors' judgements, and ticket 09 rests on the separation between an observation
  and a judgement. A crawl that writes into that table makes the crawl an author.
- **One file per run per store.** Rejected. It grows without bound, and the archive
  already exists: a committed index that is rewritten gives the same history through
  `git log`, at the size of one run.
- **Retain the last N sets of reports and derive.** Rejected. It has the same growth,
  and it turns a key lookup into a scan of every report in every retained run.
- **A durable finding id, ignoring ticket 01.** Rejected. No stable key is
  available. An element carries no DOM path, `anchorHeading` is out of the id on
  purpose, and the only remaining candidates are the two texts, which is the
  content-addressed id we already have.

## Consequences

- When production edits the text of a finding, the old id closes as *no longer seen*
  and a **new** finding appears with no history of its own. This is correct and it
  must read as correct in the interface.
- A dismissal still detaches when either side changes. That is ticket 01, and this
  decision does not amend it.
- The index holds one row for every finding id ever seen, so it grows monotonically.
  Measured today: 33,507 findings, 22,990 of them shown, over 448 reports. Ticket 50
  takes the corpus to about 800 store-pages, so the index starts near 60,000 rows and
  then grows with text churn. It needs no pruning at that size. It will need a rule
  eventually, and that rule is a new decision here and not a smaller file.
- The run log makes *first seen* cheap and makes *why did this change* impossible.
  The second question is answered by `git log` on the index, and that is the intended
  answer.

## Scope

Axis A only. Axis B keeps its own tab and its own bar, and it is not summed with
parity.
