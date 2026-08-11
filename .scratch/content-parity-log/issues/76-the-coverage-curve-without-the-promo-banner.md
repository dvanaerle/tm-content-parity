# 76 — The coverage curve without the promo banner

Type: research
Status: ready-for-agent
Blocked by: None — can start immediately.
Parent: ../map.md

> **Partly overtaken, 2026-08-11.** Ticket 81 was built without waiting for this one and
> measured the corpus itself, because by then the disk held **816 reports** and not the
> 448 this ticket is written against — tickets 50 and 54 landed in between, so this
> ticket's own accusation had come to apply to its own table. The per-store curve, the
> repeat counts and the singleton shares are in
> [81's answer](81-the-repeat-is-the-queue.md). **Every number below the line is stale.**
>
> What is left for this ticket is the part 81 did not need: the corpus-wide coverage
> curve at 25/50/75/90, the before-and-after of the promo-banner removal, the
> distribution of findings per page, and the bulk-dismissal verdict for ticket 31. On
> that last one 81's numbers already argue **no**: the largest repeat in the largest
> store is on 22 pages and 79–91% of every store's repeats are singletons, so a bulk
> tool would idle.

**What to answer:** how many decisions does an editor have to make to close a quarter,
a half and three quarters of the work, once the promo banner is out of the corpus?

Tickets [81](81-the-repeat-is-the-queue.md), [31](31-bulk-dismissal.md) and
[86](86-heading-level-becomes-information.md) all rest on this number. It is a script
over the reports that exist. **No crawl.**

## Why the measurement has to be redone

The corpus was measured on 2026-08-10 and the numbers are these: 448 reports, 373
comparable, 33,507 findings, 22,990 shown, and **8,229** distinct
`(class, prod, new, detail)` tuples.

| cover | tuples needed |
| --- | --- |
| 25% | 116 |
| 50% | 903 |
| 75% | 3,393 |
| 90% | 5,930 |

The head of that distribution is the promo banner. Of the 40 largest tuples, 35 are
the 10%-discount block and its links — `carports`, `Bekijk alle deals`,
`actievoorwaarden`, `_model=6039%2C6040`, and the German, French and English
translations of the same strings. Ticket 64 excluded that block, and the reports on
disk pre-date the exclusion.

So the table above describes a corpus that no longer exists, and the tail — 3,925
singletons, 17.1% of shown findings — is the part that does not move. Designing a
queue on the old head is designing for work that is already gone.

## What to produce

- The same coverage curve with every promo-banner tuple removed. Removal is by the
  excluded-region entry's own definition, not by matching the words, so that the
  filter and the exclusion agree.
- The tuple count and the singleton share, before and after.
- The per-store curve for `nl` on its own. Before removal, 49 nl tuples covered 25% of
  nl's 6,747 shown findings.
- The distribution of shown findings per page after removal. Before removal: median
  37, p90 151, worst 399 on `nl__fotogalerij/zonwering`.
- A one-line answer to the question ticket 31 asked three years of sessions ago:
  **is bulk dismissal worth building, or does a mute already do this job?**

## Acceptance criteria

- [ ] The script is a throwaway and it is **not** committed. `crawl/probes/` is for
      measurements kept as evidence; the numbers go in this ticket's answer, which is
      where a reader will look.
- [ ] Every number above is restated after removal, in one table, beside the number
      before it.
- [ ] The answer says plainly whether the 25% figure got better or worse. Ticket 50
      takes the corpus from 451 to about 800 store-pages, concentrated in the four
      thin stores, and the new pages are the ones that carry the banner — so state
      the direction the curve moves as the corpus grows.
- [ ] The answer names the grouping key ticket 31 asked for, or says that no key is
      worth building.
- [ ] No file in `data/` is written or moved.

## Traps

- **Do not re-crawl.** The question is about the reports on disk and a filter over
  them. A crawl would also change the page keys under ticket 54 and make the two
  measurements incomparable.
- **A tuple is within one store.** The same banner is six languages, so a key on the
  literal text multiplies by six. Report the cross-store number if it is interesting,
  but the designable number is the per-store one.
- 75 shown-finding counts of zero belong to non-comparable pages. Do not let them
  flatten the median.
