# The finding-set hash ignores visibility

`findingSetHash()` filters on `isWork(finding.class)`, so the hash a page review's
staleness is measured against is computed over the **work** findings only. It will now be
computed over **every** finding, whatever its visibility.

*The first draft of this line said the filter read `CLASSES[finding.class]?.shown`. That was
the rule until ticket 75, which replaced the `shown` boolean with the three-value visibility
enum of ADR 0005 without moving the set. Corrected 2026-08-13 so the decision names the code
it supersedes.*

## Why

Visibility is a property of the vocabulary, not of the page. Under the old hash, changing one
word in `FINDING_CLASSES` marks page reviews stale: flipping `heading-level` to `information`
would say **"changed since review"** on all 392 pages that carry one, on a day when not a
single word on any of those pages moved. `CONTEXT.md` defines `Stale` as *"a page review made
against a page whose findings changed after it"*. The findings did not change. The interface
would be lying about the only fact it is there to report.

The vocabulary has moved three times in a fortnight — ADR 0011 withdrew the mute, ticket 86
flips `heading-level`, ADR 0012 adds `regrouped` — so this is not a one-off. And a human who
reviewed a page reviewed *the page*, not the shown subset of it, which makes the unfiltered
hash the more faithful reading of what a review claims.

## Cost, accepted

Every hash on a page carrying a finding that is not work changes once, so **84 of the 133
live page reviews go stale on the run this lands**, rather than the 392-page subset the
alternative would have churned. That is the worse short-term number and the better permanent
one: after this, no visibility decision ever churns a review again. It is announced in the
same note as the `regrouped` detachment rather than discovered.

*Measured 2026-08-13 when ticket 118 landed, with `crawl/probes/probe-118-review-staleness.mjs`.
This paragraph first said "all 121 live page reviews", on both counts wrong: the log held 133
live reviews by then, 43 of them already stale for reasons that predate this decision, and 6
pages carry work findings only and so hash the same under either rule. The decision is
unaffected — it was taken against the larger number.*

## Consequences

- A change in a **hidden** class now marks a review stale. That is correct under the same
  reasoning: the page's differences changed, and the reviewer looked at the page.
- Staleness stops being a signal about work and becomes a signal about the page, which is
  what `CONTEXT.md` already says it is — *"a page also becomes stale when an editor corrects
  things."*
