# 65 — Count the overrides that the fold will detach

**What to build:** the number that ticket 67 is not allowed to ship without.

A finding id is content-addressed. Ticket 67 folds an inline link into its
paragraph, so the text of every affected unit changes, so the id changes. Every
dismissal and every fix claim on such a unit **detaches**, and the page's finding-set
hash flips, so every page review on those pages goes stale at the same time.

This is correct behaviour and not a defect: a dismissal is a judgement about two
exact strings, and the judgement is stale when a string changes. Migration is not
possible, because the old id keys text that is no longer a unit.

But the size of the loss decides how the change is announced, and nobody knows it.

Blocked by: None — can start immediately. Needs Supabase access.

Status: resolved 2026-08-07

**Origin:** the grilling of 2026-08-07 on the content unit, question 9. Required by
`docs/adr/0002-content-unit-is-the-editable-block.md`.

- [x] The count of live overrides, by kind, that sit on a unit which the fold will
      change. A unit is affected when it is an anchor inside a text block, or a text
      block that holds one.
- [x] The count of page reviews that will go stale.
- [x] Both numbers per store, because a store is the unit an editor owns.
- [x] The numbers are written into ticket 67 and into the dated note that goes out
      with the fold.
- [x] If Supabase is not reachable, say so in this ticket and stop. Do not estimate.
      A wrong number here is worse than none: it would be quoted later as measured.

## Resolved, 2026-08-07 — the loss is one dismissal

**Supabase is reachable.** The `overrides` table answered a full anon select over
REST. It held **45 events, 14 keys, 5 live** at 13:40 UTC.

`crawl/probes/probe-fold-detachment.mjs` is the measurement. It reduces the log to
its live state with `latestByKey()`, fetches both sides of every page that carries
a live override, marks each unit the fold changes, and matches the two together.
It reads no cached HTML, because the repository keeps none.

| store | kind | live | detached | undecided |
|---|---|---|---|---|
| nl | dismissed | 5 | **1** | 1 |
| be | — | 0 | 0 | 0 |
| be_fr | — | 0 | 0 | 0 |
| de | — | 0 | 0 | 0 |
| fr | — | 0 | 0 | 0 |
| uk | — | 0 | 0 | 0 |
| **all six** | dismissed | **5** | **1** | 1 |
| **all six** | fixed | **0** | 0 | 0 |
| **all six** | muted | **0** | 0 | 0 |
| **all six** | reviewed | **0** | 0 | 0 |

**Page reviews that go stale: 0.** Not one page review is live, in any store. The
log has never carried one. The fold cannot make a review stale before an editor
writes one. The probe still holds the rule for the day one exists: a review goes
stale when the fold changes the id of a **shown** finding on the page, and a
`copy` that becomes a hidden `restructured` is exactly that, with no text
changed.

**Live overrides that were orphans already: 0.** Every one of the five names a
finding the current report still holds, so ticket 62's 391 lost ids took no
judgement with them. That number counts findings, not judgements.

**The one detachment** is `SjxAomvjUHyhMqOy` on `nl/terrasoverkapping/
productinformatie`: `Lees meer >` against `Lees meer`, a `copy` finding of 4
occurrences, dismissed by `d.aerle`.

**The undecided one** is not the fold's doing. `Xk0WGKuVpSLE1wmN` on
`nl/terrasoverkapping` is dismissed with *"De spatie weggehaald bij de komma"*,
and the new site no longer carries the text the report holds — the editor made
the edit. That dismissal detaches on the next crawl, whatever ticket 67 does.

### Two things the count gets wrong if the rule is read as written

**"An anchor inside a text block" over-counts, by three of five.** The first run
of the probe used this ticket's words as written and said 3 of 5 detach. That is
wrong: the id is content-addressed, and an anchor **alone** in its paragraph
keeps its words. The fold moves the unit one tag up and changes nothing the id
reads. All four `Bekijk … >` and `Lees meer >` anchors here are alone in a `<p>`.
What detaches is a **text** change, not a markup change.

**But the tag still enters the id twice, and that is the one real loss.** `detail`
is `a → p` on `tag-changed` and `heading-level`. And the class itself:
`restructured` fires when the two sides differ in tag, so a pair whose tags move
**apart** changes class, and the class is `rule` in the id. Only `copy` and
`restructured` can move this way — `classifyPair()` asks `casing`, `price` and
`campaign` **before** it asks about the tag, so those three keep their class
however the markup moves. That is exactly the one detachment. Production holds
`Lees meer >` in a `<p>` around an anchor and the new site holds `Lees meer` in a
bare `<a>` with no block around it, so the pair goes from `a` vs `a` to `p` vs
`a`. `copy` becomes `restructured`, which is **hidden**. The editor loses the
dismissal and the finding leaves the shown count on the same day.

### What the fold does to the three pages

Blocks the fold creates, units it swallows, units that only move tag:

| page | production | new site |
|---|---|---|
| `nl/terrasoverkapping` | +18 −23 ~32 | +8 −12 ~46 |
| `nl/terrasoverkapping/productinformatie` | +12 −14 ~8 | +11 −11 ~0 |
| `nl/zonwering/prijzen` | +10 −12 ~2 | +8 −9 ~5 |

The fold is large on a page and small on the override log, because the log is
almost empty. That is the whole answer to "how is this announced".

### Three limits on the number. Read them before you quote it

**It counts text and tag, never re-pairing.** The fold changes the unit list on
both sides, so the LCS match can pair differently, and a finding whose own two
texts are untouched can still come back with a different partner. Only ticket
67's rebuild is certain. The three that hold here are `a` vs `a` becoming `p` vs
`p` on both sides, which is the safest shape there is, but safe is not measured.

**It speaks about the `text` check only.** A `link-target`, an `alt-changed` or a
meta finding holds a target, an alt text or a head field on its two sides, never
a content unit, and ticket 67 does not touch the link record. The probe reports
those as held, and no live override is one today.

**It is a dated number and the log is live.** The table went from 43 events to
45 while this ticket was measured. **Ticket 67 runs the probe again on its own
day, before it changes the extractor** — the rule in the probe is a copy of the
extractor as it stands, so a run after the fold measures nothing. That run gives
the number for the note.
