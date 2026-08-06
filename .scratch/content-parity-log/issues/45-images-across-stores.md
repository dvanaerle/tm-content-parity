# 45 — Images across stores

Type: task
Status: ready-for-agent
Blocked by: 39, 38
Parent: ../map.md

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
