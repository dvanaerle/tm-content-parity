# 02 — A renamed image is one finding

Type: task
Status: ready-for-agent
Re-read before building — **2026-08-19**. This ticket was sequenced after
`gallery-opening-links/02`, on the reasoning that if the gallery photos turn out to be the same
bytes then a content digest pairs a renamed image **directly**, which is a stronger answer than
this ticket's arity-and-position heuristic. **That probe has now reported**
(`../../gallery-opening-links/BYTES.md`) and the answer is the strong one:
- Pairing rises from **19.6% by filename to 70.3% by content** on the album pages the new site
  renders.
- **Not one pair matches by filename and differs by content — zero, across all 52 pages.** So a
  digest match is exact, needs no threshold, and strictly contains what filename matching finds.
- **402 of 557 content pairs on the album pages match by content but not by filename** — the
  same photograph under a localised name. Those are exactly the *Image missing* + *Image added*
  rows this ticket exists to fold into one.
So the matcher below — *exactly one unclaimed `image-missing` and exactly one unclaimed
`image-added` at the same index in document order* — is probably the wrong design now. A digest
pairs without arity, without position and without an alt-text tiebreak. **Re-read the matcher
against the digest before building**, and if the digest wins, this ticket's *Traps* about
one-to-one pairing and document order lose their subject.
Blocked by: None — can start immediately.
Parent: ../PRD.md

## What to build

A rename becomes one row.

Today a renamed image makes two findings: `image-missing` on the old basename, which is `work`
and is in the search index, and `image-added` on the new one, which is `information` and is not.
So an editor reads two rows and joins them in their head, and a search for the **new** filename
finds nothing in any store. The one image change most worth tracing is the one the log describes
worst.

After this ticket, `max.svg → max-new.svg` is a single decidable finding that names both
filenames, and both names are searchable.

Write **a new ADR** before starting — the next free number at the time. (0023 was reserved
here and has since been taken by an unrelated decision; see `docs/adr/README.md`.) This is the first class in a closed vocabulary whose matcher
is not textual equality, and that is the decision the ADR carries.

## Criteria

- [ ] The ADR is written: the class, its test, the alternatives refused, and why the run log's
      no-re-attachment rule is not implicated — the pairing is a rule over one page's data from
      one crawl, and never a match between finding ids over time.
- [ ] One new class in `compare/vocabulary.mjs`, taking it from 32 to 33, with a key, a label in
      sentence case, a meaning and a visibility. Visibility is **`work`**.
- [ ] The **detail is the arrow**, in the manner of `heading-level`'s `h2 → h3`, so it joins the
      finding id and a second rename asks again.
- [ ] The class carries **no direction**: nothing is lost and nothing is added.
- [ ] Pairing requires **arity and position, both**: exactly one unclaimed `image-missing` and
      exactly one unclaimed `image-added` on the page, at the same index in document order.
      One-to-one only, never many-to-many.
- [ ] Equal `alt` text raises the row's **score**. It does not gate the pairing, because `alt` is
      often empty.
- [ ] The rename **resolves before the singles are emitted**, so no image record is on two rows.
- [ ] A search for the new basename returns the finding.
- [ ] The `CONTEXT.md` entry for the class and its label.
- [ ] `npm test`.

## Traps

- **Do not pair across pages or across stores.** The rule reads one page's two sides. Cross-store
  corroboration would make a finding depend on another store's crawl, and every finding here is
  page-scoped and store-scoped by construction. Let corroboration be what the search shows.
- **Do not make it `information`.** An undecidable rename cannot be dismissed and is not indexed,
  which kills both halves of the point. The denominator grows the day this ships; absolute counts
  already sit beside every percentage, which is exactly why.
- **Do not touch the basename key.** The comparison is set-based on the basename because
  full-path matching scored 2.8%. Parked ticket 45 records the asset convention that makes the
  key language-independent — the locale is a path segment and filenames are always English and
  semantic.
- **This is not parked ticket 45.** That ticket compares one store's image set against another's,
  on axis B, and stays parked. This makes no cross-store comparison at all.
- **Do not offer the pairing as a suggestion an editor confirms.** It is measured or it is not.

## Where it came from

A grilling session, 2026-08-19. The arrow `max.svg → max-new.svg` was load-bearing in two
prototypes and existed nowhere in the data. The choice was between deriving it from prior
dismissals — which ADR 0004 forbids in writing — and measuring it from the images check. This is
the second.
