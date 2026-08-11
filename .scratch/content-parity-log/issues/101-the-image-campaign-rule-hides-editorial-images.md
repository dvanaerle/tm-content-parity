# 101 — The image campaign rule hides editorial images

Type: task
Status: ready-for-agent
Blocked by: None — can start immediately.
Parent: ../map.md

**What to build:** `IMAGE_CAMPAIGN` in `compare/images.mjs` stops matching `deal` inside
`ideale`. Today it hides an editorial image on 24 pages and nobody sees it, because the
class it hides into is hidden.

## Why the question exists

Ticket [89](89-what-a-one-sided-campaign-rule-would-catch.md) measured the campaign
patterns over 816 reports and found this on the way past. `IMAGE_CAMPAIGN` fires when
either side matches, which is correct for images — an image identity is a filename, and
under a both-sides rule production's campaign artwork would have been the largest single
source of findings in the dataset. The rule is right. **The pattern has no word
boundary.**

Of the 530 shown-as-hidden `image-campaign` findings:

- **24 are `ontwerp_je_ideale_overkapping.jpg`** — an editorial image, hidden because
  `ideale` contains `deal`.
- 2 are `actie-updates_nl.jpg` and `actie-updates_uk.jpg`, plausibly a newsletter block
  rather than a campaign.

**4.9% of the rule's output is collateral**, and it went unnoticed for the reason that
makes it worth fixing: a hidden class has no reader. Ticket 90 was going to import the
same defect into the text check, where the class it displaces is *shown*; 89 refused it
partly on this evidence.

The text pattern's guard is `actie(?!f)`, one character rather than a boundary. 89 found
`interactieve` slips past it. Any change here needs the same care in the other direction:
the near-miss list is in 89 §6 and it is long.

## What it delivers

- A word boundary on `deal` and `sale` in `IMAGE_CAMPAIGN`, or a stated reason why a
  boundary is the wrong tool for a filename, where `_` and `-` are the word separators
  and `\b` does not treat them alike.
- The count of `image-campaign` findings before and after, per store. It must fall by
  about 26, and **nothing else may move**.
- The two `actie-updates_*.jpg` files decided: campaign or not.

## Acceptance criteria

- [ ] `ontwerp_je_ideale_overkapping.jpg` is no longer `image-campaign` on any page.
- [ ] The campaign artwork the rule exists for is still caught, in all six stores. Name
      the filenames it still matches, per store, or the fix is unmeasured.
- [ ] The before and after counts are recorded per store. A change larger than the ~26
      predicted is a defect in the diff, not a bonus.
- [ ] A test with a filename that contains `deal` inside a word and is not a campaign. A
      rule with no test is not a rule.
- [ ] `alt-lost` and `alt-changed` on campaign images are unaffected — they are shown, and
      6 of them exist.

## Traps

- **`\b` and the underscore.** `ontwerp_je_ideale_overkapping` is one word to `\b` on both
  sides of `_`. A naive `\bdeal\b` may not do what it looks like it does on filenames.
  Measure, do not assume.
- **The class is hidden, so no dashboard number moves.** The only evidence this ticket can
  produce is the count and the filename list. Produce both.
- **89's near-miss list is the input, not a starting point to re-derive.** `winactie` 38,
  `ideale` 31, `ideal` 27, `saleté` 10, `idealisierend` 6, `idealen` 5, `antractiet` 2,
  `interactieve` 2, `wholesale` 1, `dealing` 1.
