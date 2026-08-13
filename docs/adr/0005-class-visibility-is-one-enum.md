# Class visibility is one enum, and not a second axis

Ticket 02 removed a confidence axis with one sentence: the class is the only axis,
~~and it is also the mute key~~. The product then asked for each class to be classified
as migration work, optional information, or a diagnostic.

> **The mute clause is struck, 2026-08-13, [ADR 0011](0011-the-mute-is-withdrawn.md).** The
> class keys nothing now. It is still the only axis, so every argument below holds; where
> the text leans on the key, read it as the record of 2026-08-10. The amendment further down
> is the one that changes a conclusion.

We decided that this **replaces** the `shown` boolean on a class. It is one field
with three values — `work`, `information`, `diagnostic` — and the class stays the
only axis.

## Why one field, and not a field beside `shown`

`shown: false` today says two different things, and nothing in the code says which.
`text-added` is hidden because content the new site invented is usually not a defect,
so an editor may want to read it. `redirect` is hidden because it tells the author of
a rule what the rule saw. The first is information for an editor. The second is a
diagnostic for a developer. One enum says which; a boolean beside an enum would let a
class be hidden and also be work, which has no meaning.

A second field would also be a second axis, which is exactly what ticket 02 removed.
~~The mute key is the class, and it must stay one thing.~~ — **struck 2026-08-13, ADR
0011.** The class must stay one thing for its own sake; it is no longer a key, and the
argument never needed it to be one. What the withdrawal adds is that this enum is now the
only way to say *this is not work at all*.

## Why "excluded from comparison" is not a value

The proposal listed a fourth value. It does not belong. A region leaves the log **at
extraction** (ADR 0003), so an excluded region never reaches a check and never
carries a class. A fourth value would suggest that the log can see inside an excluded
region and chooses not to report it. The log is blind there, and the interface must
not imply otherwise. An excluded region is named in its own committed list, with its
reason, beside the excluded pages.

## The migration does not move the bar

Every class that is `shown: true` today becomes `work`. Each hidden class is triaged
once, in git, into `information` or `diagnostic`. So the denominator is unchanged on
the day the field lands, and the change is legible: it renames a boolean and splits
the false side.

> **Landed 2026-08-13, ticket 75, and the migration held.** Twelve classes are `work`,
> five `information`, five `diagnostic` — ten on the false side and not the nine this ADR
> counted, because ticket 54 added `no-declared-alternate` in between. Re-measured over
> the same 816 reports: **28,462 work findings before and after, on every store**, no
> `findingSetHash` and no class tally changed. What did change is that **11,643 findings
> left the noise toggle** and are drawn by default, which is the split doing its job.

`work` counts. `information` renders and does not count. `diagnostic` stays behind
the noise toggle. A dismissal moves findings into the numerator.

> **Amended by [ADR 0011](0011-the-mute-is-withdrawn.md), 2026-08-13.** This section read
> *"a mute still takes findings out of the denominator"*. Nothing takes findings out of it
> any more: the denominator is the shown findings on the snapshot, and whether something is
> work at all is decided by the visibility this ADR designs and by nothing else. That makes
> the enum the **only** answer to that question, which is what 0011 relies on.

## Consequences

- A class that later moves between values re-bases the bar. Ticket 29 fixed the bar
  to the current snapshot, and this is one more reason the absolute counts stay next
  to each percentage.
- Twelve of the 21 classes are shown today. Three one-sided classes carry 82% of all
  shown findings: `text-missing` 49.3%, `missing-link` 21.0%, `image-missing` 12.1%.
  A single class moved out of `work` is therefore a large move, and a proposal to move
  one belongs in a ticket with the measurement in it.
- `restructured` is hidden today and it is the class that separates *moved* from
  *gone*. ADR 0006 gives a reason to triage it deliberately rather than by inheriting
  `shown: false`.
- `heading-level` is `work` today and carries 5.3% of shown findings. The proposal to
  remove it as SEO work is a move out of `work`, not a deletion, and it moves the
  denominator.

  > **Landed 2026-08-13, ticket 86, and it is the first move this ADR enabled.** Re-measured
  > over the 816 reports: **2,846 findings, 10.00% of the work findings** on the 722
  > comparable pages — not 5.3%, because that figure was taken over 448 reports. The
  > denominator went **28,462 → 25,616**, and no other class tally moved by a single
  > finding. Not a deletion: the class renders, keeps its `detail` and keeps its id.
  > Two things this ADR did not foresee, and both are why the move needed its own ticket
  > rather than a line in 75. First, the evidence is not the volume — of 682 live override
  > events, **zero** sit on a `heading-level` finding, so the class had been shown for
  > months and skipped, and nothing detached. Second, the hash had to move first: ADR 0013
  > took the visibility filter out of `findingSetHash()`, or this one word would have
  > printed *"changed since review"* on all 392 pages carrying the class on a day when no
  > page changed. **A re-triage is therefore not free, and the cost is not in the bar.**

## Scope

Axis A only. Axis B keeps its own tab and its own bar.
