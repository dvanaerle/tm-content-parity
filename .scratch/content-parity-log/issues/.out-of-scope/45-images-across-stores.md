# 45 — Images across stores

Type: task
Status: wontfix — **parked 2026-08-13**. Refused on value, and on the stability of its
own key. The check compares image identities across the stores, and the identity is the
basename. Store-specific images are going to be made and filenames are going to be
renamed, so the key moves under the check: during the migration it would spend its output
on churn and not on defects, and it would arrive as noise exactly when the log is being
learnt. Nothing else waits on it — 45 is a leaf on the axis B graph.
Blocked by: 39, 38
Parent: ../../map.md

## What to build

The last of the five checks. Compare the image identities on a store page against
the NL page.

Ticket 06's `imageKey()` is the basename, lowercased, with a true size suffix
removed. The media is shared between the stores, so the key matches across
languages with no change.

**`image-missing-store`** (shown) is the valuable half: an image identity that NL
holds and the store does not.

**`image-store-variant`** (hidden) is a basename that differs. A de page can
correctly carry a German banner with German text in the image. A basename that
differs cannot be told apart from the wrong photo, so ticket 02's rule applies:
the tool must not make a finding that it then hides. The class is therefore
hidden by default, and an editor turns it on per store.

Compare as a **set**, not a multiset. Ticket 06 measured that the new site emits
411 srcs twice on one page.

## Acceptance criteria

- [ ] An image on the nl page that the de page does not have makes one
      `image-missing-store` finding.
- [ ] A basename that differs makes an `image-store-variant` finding, and it is
      hidden until an editor turns the class on.
- [ ] A duplicated src makes one finding, not two.
- [ ] The axis A image classes on the same page do not change.
- [ ] `npm test` is green.

## Notes

This ticket does **not** read alt text. Ticket 43 owns `alt-untranslated`.

Ticket 06 measured 357 image pairs with 1 collision over 124 pages, on the
basename key. Expect a similar rate across the stores, and record the real number
here.

## Why this is parked

Four things came out of the review of 2026-08-13, and they are kept because the third
one is the only thing that could revive this.

**The counted class fires on the legitimate case.** A set difference cannot tell a
replacement from an omission plus an addition. A store page that swaps one image for
another makes `image-missing-store`, which is `work`. That is the misfire the roll-up
rule warns about: a class that grows across many pages means a rule misfires, not that
editors are behind. A narrower test — the store's keys are a **strict subset** of NL's,
in the manner of `regrouped`'s total coverage — repairs it, and shrinks the ticket to one
`information` class.

**Two of the ticket's sentences had already expired.** *Hidden by default, and an editor
turns it on per store* has no mechanism: ADR 0005 replaced the shown-or-hidden boolean
with **visibility** on the class, and ADR 0011 withdrew the mute, which was the nearest
thing to a per-store control. The correct reading was `information` for both classes.

**`image-store-variant` was built for a naming convention this site does not use.** The
asset path is `/media/wysiwyg/tm/<locale>/<bucket>/[<page-slug>/]<filename>`, `<locale>`
is a closed set with `global` for an asset that is identical everywhere, and the rule is
that filenames are always English and semantic — *language is carried by the `<locale>`
segment and never by folder words*. So a multi-language image is the same basename in
another locale folder, the keys match, and the class's own motivating example (a German
banner on a `de` page) makes no finding at all.

**The defect worth catching is the locale segment, and it is a different check.** A `de`
store page pointing at `/tm/nl/.../montage-drawing.jpg` shows the Dutch-labelled drawing
on a German page. The basename agrees, so this ticket is blind to it, and axis A is blind
too because production and the new site carry the same wrong src. That check reads **one
store page** and needs no NL page, so it also reaches the **unanchored** pages, which are
more than half of them. It is not a coverage comparison and it does not belong on axis B.

## Re-open trigger

Not the images. **A locale-segment check**, as its own ticket, and only after a
measurement over the image data already on disk says it is worth one: how many srcs match
`/media/wysiwyg/tm/<locale>/`, how many are `global`, how many are the legacy Dutch-named
trees (`tm/nl-nl/afbeeldingen/...`, which predate the convention and are migrated
deliberately, so they are a third kind and not wrong-locale), how many match nothing —
and how many resolve to a locale that is not the page's own store. If that last number is
small, there is no ticket here either.

The set comparison in this file does not come back. Renaming and store-specific images
are what park it, and both make the basename key worse over time, not better.
