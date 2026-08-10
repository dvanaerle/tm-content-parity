# Class visibility is one enum, and not a second axis

Ticket 02 removed a confidence axis with one sentence: the class is the only axis,
and it is also the mute key. The product then asked for each class to be classified
as migration work, optional information, or a diagnostic.

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
The mute key is the class, and it must stay one thing.

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

`work` counts. `information` renders and does not count. `diagnostic` stays behind
the noise toggle. A mute still takes findings out of the denominator, and a dismissal
still moves them into the numerator.

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

## Scope

Axis A only. Axis B keeps its own tab and its own bar.
