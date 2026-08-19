# 03 — Four galleries render nothing and six URLs are gone

**What to build:** nothing in the log. This is a record of new-site defects that the log
found and cannot express well, written down so they are not rediscovered in a month as
"more false positives on the gallery pages".

Four **general** gallery pages render no album at all on the new site, against full sets on
production:

| store | page | production photos | new site |
| --- | --- | --- | --- |
| de | `allgemeine-fotogalerie` | 72 | 0 |
| de | `galerie` | 57 | 1 |
| fr | `galerie` | 61 | 0 |
| be_fr | `fr/galerie` | 61 | 0 |
| uk | `general-photo-gallery` | 76 | 0 |

**`uk` `general-photo-gallery` was added on 2026-08-19** by ticket 02's measurement
(`../BYTES.md`), which re-crawled all 52 gallery pages live. The title still says four; the
table is now five, and the count in the title is the one to trust least.

One album page is a genuine regression rather than a general-page gap: `fr` `galerie/eclairaige`
renders 0 against 24, while its `be_fr` twin `galerie/eclairage` renders 22.

Six gallery URLs return **404** on the new site: `be` and `nl` `algemene-fotogalerij`, `be` and
`nl` `fotogalerij/fotogalerij-zonwering`, `de` `galerie/fotogalerie-sonnenschutz`, and `uk`
`photo-gallery/photo-gallery-sun-shading`.

These are not editorial work. Reporting them as several hundred *Image missing* findings tells
an editor to re-upload photos that a module is failing to render or a URL is failing to serve.
The instruction an editor would need is "this page is broken", and the log has no way to say
that today.

Note what this ticket corrects: an earlier reading of the same data said de, fr and be_fr
render no album at all. That is wrong. Their **per-album** pages render full sets —
`(de)galerie/glasschiebewande` 50 photos, `(fr)galerie/portes-coulissantes` 50. Only the
general pages are empty.

**Blocked by:** None — can start immediately.

**Status:** needs-triage

**Parent:** ../PRD.md

- [ ] The four empty general galleries, the one empty album, and the six 404 URLs are raised
      with whoever owns the new site, as platform defects rather than content work.
- [ ] A decision is recorded on whether the log should say "this page is broken" as one
      statement instead of several hundred image findings — or whether the existing page
      status is already carrying that and the pages simply need excluding until it is fixed.

## Traps

- **Do not fix this by excluding the pages and forgetting.** An excluded page is invisible,
  and these are real defects that somebody has to repair on the new site.
- **Do not treat the empty general pages and the 404s as one thing.** A 404 is a URL that does
  not exist; an empty general gallery is a page that serves fine and renders no album. They
  will have different causes and probably different owners.
