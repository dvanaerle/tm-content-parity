# 90 — A campaign is a class, not a commit

Type: task
Status: resolved 2026-08-11 — **the goal shipped, the design did not.** No commit per
campaign, but by an id production puts on the block, not by a one-sided text rule. The
rule this ticket specified stays refused on 89's evidence. See `## Answer`.
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

**Six of eight are met, one is moot ×3, and one is not done.** The boxes below are the
machine-readable half of `## Answer`; a `[~]` is a criterion the change made moot, and
the single `[ ]` is real outstanding work.

- [~] The one-sided direction fires, and the both-sides behaviour is unchanged. Both have
      tests. A rule with no test is not a rule. *(Moot: no rule changed. `compare/text.mjs`
      is untouched and `PROMO` still requires both sides.)*
- [~] The measurement from 89 is re-run after the change and matches its prediction. A
      difference between the predicted and the actual count is a defect in this diff.
      *(Moot: it predicted the effect of a rule that was not built.)*
- [x] The banner classifies as `campaign` on every page that carries it, in all six
      stores, without any store-specific pattern. ADR 0003 rejected a Dutch text anchor
      because it is blind in four stores, and that objection applies here too — if the
      pattern only works in `nl` and `be`, say so and scope the ticket to what it can do.
      *(Met by exclusion rather than classification, and by a language-blind anchor —
      which is the route ADR 0003 pointed at.)*
- [x] The link findings the banner carries are handled or explicitly deferred with a
      reason. The measurement of 2026-08-10 found banner link tuples at 299, 239 and 99
      findings, so a text-only fix leaves a large remainder. *(Met: the region is cut at
      extraction, so links and images leave with the text in one cut.)*
- [ ] `compare/text.mjs` and `compare/images.mjs` stop disagreeing about one-sided
      campaign matching, and the answer says which of the two was wrong. **Not done.** 89
      named `compare/images.mjs` as the wrong one and its 24 wrongly-hidden editorial
      images are live. Deliberately out of scope here; needs its own ticket.
- [~] The per-store totals are recorded before and after. Findings move between classes;
      **the total number of findings must not change.** A class change is not a removal.
      *(Moot: no finding moved between classes. The units removed are unchanged, so the
      corpus is too — on the 48 pairs measured.)*
- [x] The committed region entry's fate is decided and recorded. If it is retired, the
      coverage verdict for it reads `left-the-list` and the dashboard says so in one line,
      as ticket 64 required. *(Kept and re-anchored. The next run reads `left-the-list`
      for the old selector and `new-entry` for `#campaign-banner`, which is
      `compare/region-coverage.mjs` working correctly.)*
- [x] No selector, option id, campaign name or year appears anywhere in the code this
      ticket adds. *(Tested, not promised: `crawl/extract.test.mjs`, "names no campaign,
      so the entry outlives the campaign it was written for".)*

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

---

## Answer

**Shipped 2026-08-11, and not as this ticket specified it.** The title's claim was that
a campaign should be a class rather than a commit. It is neither: it is a **hook in the
CMS block**. The outcome the ticket wanted — *the next campaign banner classifies itself,
nobody writes a selector, nobody opens a pull request* — holds. The mechanism it proposed
stays refused, on 89's evidence and unchanged by this.

### What changed

Production now marks the banner block with `id="campaign-banner"`, applied in the Magento
admin by the content team. The entry in `shared/excluded-regions.mjs` anchors on that
instead of on the campaign option ids:

```
- .mgz-element-section:has(a[href*="_model=6039,6040"]),
-   .mgz-element-section:has(a[href*="_model=6039%2C6040"])
+ #campaign-banner
```

The entry's `reason` no longer names a campaign, a percentage, a month or a year, and a
test asserts that it cannot: `crawl/extract.test.mjs`, *"names no campaign, so the entry
outlives the campaign it was written for"*. That test is the acceptance criterion **"no
selector, option id, campaign name or year appears anywhere in the code this ticket adds"**,
kept as a rule rather than as a promise.

### Measured, against live production, six stores, 48 page-store pairs

**The scope of this measurement is 48 pairs, not the 816-page corpus.** Six stores × the
three pages below plus `overkapping` and four controls. On all 48 the new selector is
identical to the old one, so the swap is **not believed to** move any number — which is
weaker than "moves no number", and the difference is the 768 pairs nobody measured.
`crawl/probes/probe-promo-banner-corpus.mjs` is what would close that gap; it last ran
2026-08-10 against the **retired** selector and was not re-run here.

Two matches on production on every pair — the desktop and the mobile copy of one block —
and zero on the new site:

| store | matches | units | links | images | vs. the option-id selector |
| --- | ---: | ---: | ---: | ---: | --- |
| nl | 2 | 8 | −9 | −1 | identical |
| be | 2 | 7 | −8 | −1 | identical |
| be_fr | 2 | 7 | −8 | −2 | identical |
| de | 2 | 7 | −8 | −2 | identical |
| fr | 2 | 7 | −8 | −2 | identical |
| uk | 2 | 7 | −8 | −2 | identical |

`crawl/probes/probe-promo-banner.mjs`, re-run 2026-08-11 and now reading the selector
from the committed list rather than retyping it. `unitsRemoved` and `matches` are
**constant** across all 48 pairs, which is question 3 of the ADR asked at that scope.
Findings
gone per page: 11 in `fr`, 12 in `uk`, and so on; **findings appeared: 0**, except one
`restructured` row on `nl`/`be` `/downloads` (`Bekijk de informatievideo` →
`Bekijk de installatievideo`). That row is **pre-existing**: the retired selector produces
it identically, verified by running both against the same fetch. It is a pairing effect of
cutting the region, not of this change.

Nothing in `data/` is tracked, so re-running the probe committed no artifact.

### Against this ticket's acceptance criteria

The criteria were written for a text rule and most of them are moot. Recorded honestly:

- **One-sided direction fires, both-sides unchanged, both tested** — n/a. No rule changed.
  `compare/text.mjs` is untouched; `PROMO` still requires both sides.
- **89's measurement re-run and matching its prediction** — n/a for the same reason, and
  the prediction was of a change that was not made.
- **The banner classifies in all six stores without a store-specific pattern** — **met**,
  and by the route ADR 0003 pointed at. A DOM hook is language-blind where the Dutch
  pattern matched 0 lines in `de`, `fr` and `be_fr`.
- **The link findings handled or deferred with a reason** — **met**. The region is cut at
  extraction, so the 1,175 shown link findings and the images leave with the text in one
  cut. This is the criterion the proposed text rule could not have satisfied.
- **`compare/text.mjs` and `compare/images.mjs` stop disagreeing** — **not done, and not
  attempted.** 89 named `compare/images.mjs` as the wrong one: 24 of its 530 one-sided
  `image-campaign` findings are `ontwerp_je_ideale_overkapping.jpg`, an editorial image
  hidden because `ideale` contains `deal`. That defect is live and is **not** fixed here.
  It needs its own ticket.
- **Per-store totals before and after; the total must not change** — n/a. No finding moved
  between classes. The units removed are identical to before, so the corpus is unchanged.
- **The committed region entry's fate** — **it stays, re-anchored.** Not retired. The
  coverage check will read `left-the-list` for the old selector and `new-entry` for
  `#campaign-banner` on the next run, which is `compare/region-coverage.mjs` behaving
  correctly and is the one line ticket 64 asked for.
- **No selector, option id, campaign name or year in the code** — **met**, and tested.

### What this does not solve

- **The `IMAGE_CAMPAIGN` collateral.** 24 hidden findings on an editorial image, unnoticed
  because the class is hidden. Live, and now the only campaign-matching regex left doing
  harm. It predates this ticket and survives it:
  [101](101-the-image-campaign-rule-hides-editorial-images.md).
- **The hook is a contract with a system this repo cannot see.** The dependency moved from
  a developer to whoever builds the next banner: a fresh CMS block without the hook silently
  matches nothing and the banner returns as findings. That is the over-reporting direction
  and it is safe, but it is **silent at the point of failure**. The list's guards are
  asymmetric — `capBreachMessage` fails the crawl when an entry matches *too much*, and
  nothing at all fires when a committed entry matches *nothing*. **No ticket, deliberately:**
  ticket 64's coverage already says `stopped-matching` in one line with words that name this
  cause. It is a run late — compare time, against a snapshot, rather than at the crawl — and
  that gap is judged acceptable rather than tracked. Recorded in ADR 0003.
- **The duplicate id.** Production ships `id="campaign-banner"` **twice per page**, for the
  desktop and mobile copies. That is invalid HTML. It works here because the extractor uses
  `querySelectorAll` semantics and counts both, and a test pins that behaviour, but
  `getElementById` would see one of the two and a validator will flag it. A class would be
  correct markup and would need no change on this side.
- **The owner.** 89's closing recommendation was a named owner for the list. Still nobody.
