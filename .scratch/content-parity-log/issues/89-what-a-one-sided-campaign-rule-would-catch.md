# 89 — What a one-sided campaign rule would catch

Type: research
Status: ready-for-agent
Blocked by: None — can start immediately.
Parent: ../map.md

**What to answer:** if the campaign rule fired when the pattern is on production and the
new side is missing, how much real editorial content would it sweep up with the banner?

[90](90-a-campaign-is-a-class-not-a-commit.md) is only worth building if the answer is
"almost none". This ticket is a script over the reports that exist. **No crawl.**

## Why the question exists

The `campaign` class already exists, hidden, with a generic pattern in `compare/text.mjs`:

```
korting | deal | actie(?!f) | aanbieding | black\s*friday | sale | nu\s+vanaf | op\s+voorraad
```

It does not fire on the promo banner. The rule requires the pattern on **both** sides,
and the banner is absent from the new site, so the finding falls through to
`text-missing`.

That is why the banner needed a hand-written selector anchored on the campaign option ids
`6039,6040` — and why **every new campaign needs a new commit**. The regex does not care
which campaign it is. The selector does.

Measured: 1,645 shown findings match the banner strings, **7.2% of all shown findings**,
and every one carries `anchorHeading: null`.

## What to produce

- The count of shown `text-missing`, `casing` and `copy` findings whose **production**
  side matches `PROMO` and whose new side is missing or does not match.
- Of those, how many are the banner. Use the excluded-region entry's own definition to
  separate them, not a list of strings, so the filter and the exclusion agree.
- **The remainder, listed in full if it is small.** This is the whole point: the false
  positives are the answer. A paragraph that says *"Actie: vraag een gratis proefmontage
  aan"* is editorial content and a rule that hides it is worse than a per-campaign commit.
- The same counts per store, because the pattern is Dutch and four stores are not.
  `uk`, `de` and `fr` copy will match `sale` and `deal` differently, or not at all.
- A recommendation: build 90, build 90 with a narrower pattern, or keep the selector.

## Acceptance criteria

- [ ] The script is a throwaway and is not committed. The numbers go in this ticket's
      answer.
- [ ] The banner and the non-banner matches are reported separately, with the totals per
      store.
- [ ] Every non-banner match is listed with its page, its class and its production text,
      if there are fewer than about 200. If there are more, that is the answer and the
      ticket recommends against 90.
- [ ] The four non-Dutch stores are reported separately. A Dutch-only pattern that is
      blind in `de`, `fr` and `uk` is a finding about the rule, and ADR 0003 already
      rejected a Dutch text anchor for exactly this reason.
- [ ] The answer states what happens to the committed region entry if 90 ships: whether it
      is retired, kept as a belt-and-braces measure, or kept for the links and images the
      text rule cannot reach.
- [ ] No file in `data/` is written or moved, and `shared/excluded-regions.mjs` is not
      touched.

## Traps

- **The banner is not only text.** It carries `missing-link` findings too — the
  measurement of 2026-08-10 found link tuples on `_model=6039%2C6040` at 299, 239 and 99
  findings. A text-only rule leaves those behind, so report the link and image side as
  well or 90 will look complete when it is not.
- **`IMAGE_CAMPAIGN` in `compare/images.mjs` already matches on either side.** So the
  images check has the behaviour the text check lacks. Say why they differ, because one of
  the two is wrong and the answer should name which.
- **`actie(?!f)` exists to avoid `actief`.** Any pattern change needs the same care, and
  the answer should list the near-misses it found.
- The exclusion currently removes the banner, so the reports on disk may or may not still
  hold it depending on when they were written. Check before counting, and say which corpus
  the numbers describe. Ticket 76 has the same problem and the same obligation.
