# 90 — A campaign is a class, not a commit

Type: task
Status: ready-for-agent
Blocked by: 89
Parent: ../map.md

**What to build:** the next campaign banner classifies itself. Nobody writes a selector,
nobody measures three pages, nobody opens a pull request. Campaign copy that production
has and the new site does not becomes a `campaign` finding, which is not counted as
migration work.

**Read [89](89-what-a-one-sided-campaign-rule-would-catch.md)'s answer first. It can
refuse this ticket**, and refusing it is a valid outcome.

## The decision this ticket carries

The `campaign` class exists and its pattern is generic:

```
korting | deal | actie(?!f) | aanbieding | black\s*friday | sale | nu\s+vanaf | op\s+voorraad
```

It does not fire on the banner because the rule requires the pattern on **both** sides,
and the banner is absent from the new site. So the finding falls through to
`text-missing`, and the only way to remove it was a selector anchored on this campaign's
option ids — `6039,6040`. **That anchor is the problem.** The next campaign has different
ids, the entry stops matching, and 4,055 findings come back. The list says so in its own
prose, and it says the list needs an owner.

A pattern on the production side survives a campaign change. An option id does not.

## Why this is not the same as excluding it

A region exclusion removes content from the corpus: the denominator moves and nothing is
ever counted. A hidden or `information` class keeps the finding, so it is visible, it is
attributable to a rule rather than to a hand-written selector, and it is countable if
anyone ever wants the number.

Both are legitimate. This ticket claims only that the **classification** is the cheaper
and more durable of the two for content whose defining property is a repeating pattern in
the words.

## What it delivers

- The campaign rule fires when the pattern is on the production side and the new side is
  missing. The both-sides case keeps working exactly as it does.
- `campaign` carries a visibility from [75](75-class-visibility-replaces-shown.md). It is
  `information`, not `diagnostic`: an editor may legitimately want to read what campaign
  copy the new site lost.
- The same treatment for the links and images the banner carries, or a stated reason why
  not.
- A decision, recorded, about the committed region entry: retired, or kept.

## Acceptance criteria

- [ ] The one-sided direction fires, and the both-sides behaviour is unchanged. Both have
      tests. A rule with no test is not a rule.
- [ ] The measurement from 89 is re-run after the change and matches its prediction. A
      difference between the predicted and the actual count is a defect in this diff.
- [ ] The banner classifies as `campaign` on every page that carries it, in all six
      stores, without any store-specific pattern. ADR 0003 rejected a Dutch text anchor
      because it is blind in four stores, and that objection applies here too — if the
      pattern only works in `nl` and `be`, say so and scope the ticket to what it can do.
- [ ] The link findings the banner carries are handled or explicitly deferred with a
      reason. The measurement of 2026-08-10 found banner link tuples at 299, 239 and 99
      findings, so a text-only fix leaves a large remainder.
- [ ] `compare/text.mjs` and `compare/images.mjs` stop disagreeing about one-sided
      campaign matching, and the answer says which of the two was wrong.
- [ ] The per-store totals are recorded before and after. Findings move between classes;
      **the total number of findings must not change.** A class change is not a removal.
- [ ] The committed region entry's fate is decided and recorded. If it is retired, the
      coverage verdict for it reads `left-the-list` and the dashboard says so in one line,
      as ticket 64 required.
- [ ] No selector, option id, campaign name or year appears anywhere in the code this
      ticket adds.

## Traps

- **The failure direction must over-report.** A pattern that stops matching brings the
  banner back as findings, which is noisy and safe. A pattern that widens hides editorial
  content, which is silent and not safe. If 89 found any real false positive, the pattern
  is narrowed before this ships, not after.
- **`text-missing` is 49.3% of shown findings.** A rule that moves some of them is a large
  move by definition, and the two measurements are how it stays honest.
- **Retiring the region entry is not free.** The region left at extraction, so the units
  never reached a report. Classifying instead means they do reach it, and the corpus grows
  by whatever the exclusion was removing — about 4,055 findings by ticket 64's count. Say
  that number in the answer beside the class counts, or the dashboard will look like a
  regression.
- The `campaign` and `image-campaign` classes are hidden today. After 75 they carry a
  visibility, and this ticket must not be the place where that value is decided by
  accident.
