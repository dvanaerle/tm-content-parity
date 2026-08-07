# The fold, and what happens to your judgements

Drafted 2026-08-07 by ticket 65. **It goes out with ticket 67**, on the day the
fold ships. Refresh the numbers below on that day with
`node crawl/probes/probe-fold-detachment.mjs`, and run it **before** the
extractor changes.

The interface is Dutch, so translate this before it goes out. It is written here
in the language of the repository.

## What changes

The log compares a paragraph as a paragraph. Today one link inside a paragraph
throws the rest of the paragraph away, and only the words of the link are
compared. About 3,400 words of body copy on ten measured pages are invisible to
the log because of it. One 190-word paragraph is compared as 35 characters, and
it holds a real product-spec error that the log cannot show you.

After the change a block of text is one block in the log, with its links inside
it. That is also how you edit it: one block at a time.

## What this costs you

**The log shows more findings, not fewer.** Text that was hidden behind a link
becomes visible, so the counts go up on many pages. The log does not get worse.
It stops hiding what it cannot compare.

**A judgement is about two exact texts, so a judgement on changed text expires.**
When you dismiss a difference, the log remembers the two texts you looked at.
When one of those texts changes, your dismissal no longer has a subject and it
comes back as an open difference. This is deliberate. The alternative is to carry
your judgement onto text you never read.

## How large the loss is

Measured on 2026-08-07 over all six stores:

| what | live | lost to the fold |
|---|---|---|
| dismissals | 5 | **1** |
| fix claims | 0 | 0 |
| muted classes | 0 | 0 |
| page reviews | 0 | 0 |

**One dismissal.** It is on `nl/terrasoverkapping/productinformatie`, on
`Lees meer >` against `Lees meer`. Nothing else in the log is touched, and no
page review goes stale, because no page review is live.

The one dismissal is not lost quietly. The difference comes back in the log as an
open finding, and you can dismiss it again in one click.
