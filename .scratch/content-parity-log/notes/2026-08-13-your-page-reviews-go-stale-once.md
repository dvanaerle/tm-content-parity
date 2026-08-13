# Your page reviews go stale once, and then stop doing it

Drafted 2026-08-13 by ticket 118, before the run lands. Measured with
`node crawl/probes/probe-118-review-staleness.mjs` against the live override log and
`data/reports/` as it stands. The numbers below are that run.

~~The interface is Dutch, so translate this before it goes out.~~ **Struck 2026-08-13**:
the interface speaks English (UK) on all six stores (ADR 0014), so this note and the
screen no longer need a translator between them. It is written here in the language of
the repository.

## What changes

When you review a page, the log remembers which differences the page held. It says
**changed since review** when that set is not the set you looked at.

Until now it remembered the *counted* differences only. Differences in a class the log
does not count — a rewritten element, an added image, a redirect — were left out of that
memory. So the sentence meant *the work on this page changed*, not *this page changed*.

After this change it remembers every difference on the page.

## Why

The log is about to change two words in its own vocabulary. `heading-level` stops
counting, and a new class for the same text divided differently is added. Under the old
memory, those two edits alone would have said **changed since review** on 392 pages on a
day when not a word on any of them had moved.

That sentence has to mean the page changed. You reviewed a page, not the counted part of
it.

## What this costs you

**84 of your 133 live page reviews go stale on the run this lands.** They are not wrong
and you did not miss anything. The log is re-measuring what it remembers, and the first
measurement disagrees with the old one by construction.

The 84 are almost all s.schouten's, across `nl` and `be`. Six reviews survive, on pages
that happen to carry counted differences only. A further 43 reviews were already stale
before this change, because the pages moved under them.

**This is the last time a vocabulary change can do this.** After the run, a review goes
stale when the page changes and for no other reason. The two edits that follow this week —
and every future decision about what the log counts — will leave your reviews alone.

One thing worth knowing: a difference the log does not count can now stale your review.
That is deliberate. If a paragraph on the page turned into a heading, you would want to
know, even though nobody is being asked to fix it.

Nothing is deleted. A stale review keeps your name and its date, and re-reviewing the page
is one click.
