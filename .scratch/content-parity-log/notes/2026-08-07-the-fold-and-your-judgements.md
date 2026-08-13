# The fold, and what happens to your judgements

Drafted 2026-08-07 by ticket 65. Measured again on **2026-08-10**, the day the
fold ships, with `node crawl/probes/probe-fold-detachment.mjs` and before the
extractor changed. The numbers below are that run.

~~The interface is Dutch, so translate this before it goes out.~~ **Struck 2026-08-13**:
the interface speaks English (UK) on all six stores (ADR 0014), so this note and the
screen no longer need a translator between them. It is written here in the language of
the repository.

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

Measured on 2026-08-10 over all six stores. The log holds 107 events and 33 live
judgements:

| what | live | lost to the fold | needs a look |
|---|---|---|---|
| dismissals | 18 | **4** | 1 |
| fix claims | 13 | **3** | 2 |
| muted classes | 1 | 0 | 0 |
| page reviews | 1 | 0 | 0 |

**Seven judgements of 33.** All of them are on the `nl` store; the other five
stores hold none. No page review goes stale, and the muted class holds, because a
mute key carries no text.

The seven are of two shapes:

- **Four sit on text that goes into its block.** Three fix claims on
  `nl/inspiratiemagazine` and one dismissal on `nl/terrasoverkapping`. The words
  they were about are now part of a larger paragraph.
- **Three sit on a wrapper that moved on one side only.** One dismissal on
  `nl/terrasoverkapping/productinformatie` — the `Lees meer >` case ticket 65
  found — and two on `nl/over-ons`. Production folds the anchor into a block and
  the new site does not, so the class of the finding changes with it.

**Three more need a look, and the fold is not the reason.** One dismissal and two
fix claims sit on findings that the current report no longer holds: the live page
does not carry that text any more, because somebody edited it. They would have
expired without this change.

A judgement is not lost quietly. The difference comes back in the log as an open
finding, and you can dismiss it again in one click.
