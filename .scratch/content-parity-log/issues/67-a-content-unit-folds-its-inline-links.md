# 67 — A content unit folds its inline links

**What to build:** a paragraph is compared as a paragraph. Today one inline link
discards the whole block it sits in, and only the link words are compared.

Measured on ten production pages: 62 blocks and about 3,400 words of body copy are
never compared, on 10 of 10 pages. `/overkapping` loses 928 words. In one 190-word
paragraph the log compares 35 characters — 81% of the paragraph is invisible — and
that paragraph holds a product-spec regression: production says `6063-T6`, the new
site says `6036-T6`. Nobody can find that with the tool as it stands.

The rule that causes it is the leaf rule: a node that holds another node from the tag
list is skipped, because "the children speak". The list holds `a` and `button`, and
those are the only two tags that can break a paragraph. Headings already fold their
children, so this ticket makes the general case behave like the case that was right.

See `docs/adr/0002-content-unit-is-the-editable-block.md` for the decision and the
rejected alternatives.

Blocked by: 66.

Status: resolved 2026-08-10

**Origin:** the grilling of 2026-08-07 on the content unit. The user's argument
decided it: the unit must be the thing that is edited, and content is edited one
block at a time in PageBuilder and in the WYSIWYG editor.

- [x] A text block folds the words of an `a` or a `button` inside it. A nested
      **block** still breaks it: an `li` gives way to a `p` inside it.
- [x] A folded link no longer makes a unit of its own. **Generalise the swallow
      set**, which only headings fill today, or every folded link is counted twice.
- [x] A link still makes its link record. The links check compares targets and is
      not touched by this.
- [x] `kind` is `cta` when the whole unit is one anchor or one button, whatever tag
      emitted it. Without this a CTA that moved between a bare anchor and a paragraph
      stops pairing, and one `copy` row becomes two one-sided rows.
- [x] Pairing permits `cta` against `text`. The heading rule stays: a heading level
      is an editorial fact, a wrapper is not.
- [x] The `/overkapping` paragraph is one unit on each side, and the `6036-T6`
      difference is reported. `crawl/probes/probe-overkapping-fold.mjs` asserts both
      and exits non-zero when either fails. One `<p>` on each side, 190 words against
      188, reported as a shown `copy`. The log compared 35 characters of it and now
      compares 1,232.
- [x] Tests for a nested anchor in a paragraph, for the position it takes, and for a
      CTA that is wrapped on one side only. The test that pins "an anchor inside a
      paragraph makes its own element" is inverted, not deleted quietly.
- [x] The probes whose numbers are quoted in the code comments are re-run, and the
      comments are rewritten. The corpus they measured no longer exists. See "what the
      re-runs found" below: three of the four probes are re-run and their numbers are
      fresh; the numbers no committed probe produces are dated instead of invented.
- [x] The override count from ticket 65 exists, and the dated note goes out with the
      change. The fold does not ship without it. **The count exists — see below.**
      Run `node crawl/probes/probe-fold-detachment.mjs` again on the day, because
      the log is written to daily, and put that day's number in the note. Run it
      **before** you change the extractor: the probe holds a copy of the extraction
      rule as it stands, so a run after the fold measures nothing. Run on 2026-08-10
      before the change: 33 live judgements, **seven** detached.

## What the re-runs found, 2026-08-10

The fold takes the nl store from **9,293** production content units to **7,424** on
the same 179 pages, and the new site from 6,855 to 6,486. A fifth of production's
units were fragments of a block.

Re-run, with fresh numbers in the comments beside them:

- `probe-extract-v2.mjs` — the corpus. `fotogalerij` is 163 units against the new
  site's 47, where it was 178 against 9.
- `probe-excluded-regions.mjs` — the product grid removes **50** and **21** units,
  unchanged. Each tile title is already one block with one link in it.
- `probe-promo-banner.mjs` and `probe-promo-banner-corpus.mjs` — the banner removes
  **8** units on `nl` and 7 elsewhere, where it removed 9 and 8. The corpus holds 7,
  8 or 16, so the cap of 30 still has room for a third placement.

Not re-run, and dated in the comment instead: the 151-unit `<style>` leak, the
337-unit accordion heading and the 762 exact-tag pairs. No committed probe measures
the first two, and `probe-tag-changes.mjs` reads `data/extract/`, which is the
pre-fold corpus. Rewriting them as counts of today would be inventing a measurement.

**One thing the fold breaks that this ticket does not fix.** `ABSOLUTE_MAX_UNITS` is
100, and ticket 63 justified it as sitting above the widest entry (50) and below a
near-miss of 139 units on `/overkapping`. After the fold that near-miss measures
**91**, under the ceiling. The wrapper on `/downloads` is still excluded, at 190. The
ceiling is a resolved ticket's decision and is not moved here; the comment on it in
`shared/excluded-regions.mjs` records the problem and asks for a ticket.

## The loss, measured by ticket 65 on 2026-08-07

**One dismissal detaches. No page review goes stale.**

| kind | live, all six stores | detached |
|---|---|---|
| dismissed | 5 | **1** |
| fixed | 0 | 0 |
| muted | 0 | 0 |
| reviewed | 0 | 0 |

All five live overrides are on `nl`; the other five stores hold none. One more
dismissal is detached already, by an edit the editor made on the new site, and
the fold cannot be charged with it.

Two things ticket 65 found that this ticket must build against:

- **An anchor alone in its paragraph keeps its id.** The words do not move, and
  the id reads the words. Do not expect the fold to detach every dismissal on a
  folded link — it detaches the ones whose **text** changes.
- **A tag that moves on one side only changes the class.** `restructured` fires
  when the two sides differ in tag, and the class is in the id. The single
  detachment is that shape: production folds `Lees meer >` into a `<p>` while
  the new site keeps a bare `<a>`, so `copy` becomes `restructured` — and
  `restructured` is hidden, so the finding also leaves the shown count. Watch
  this class in the two measurements this ticket takes. It is the most likely
  place for the count to move for a reason that is not editorial.

The announcement is drafted at
[`notes/2026-08-07-the-fold-and-your-judgements.md`](../notes/2026-08-07-the-fold-and-your-judgements.md).

## Known and accepted

- Two changes in one paragraph become one finding with one id. Accepted, because the
  fix is one edit of one paragraph.
- A production block that the new site splits in two gives one `copy` row and one
  `text-added` row. Accepted for now. Many-to-one matching waits for a measurement,
  which this ticket makes possible for the first time.
- Findings that were hidden as a markup difference become shown copy differences. The
  shown count rises, and that is the log becoming honest, not a regression.
