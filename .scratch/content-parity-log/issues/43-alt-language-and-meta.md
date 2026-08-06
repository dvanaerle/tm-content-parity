# 43 — Alt language and meta

Type: task
Status: ready-for-agent
Blocked by: 42
Parent: ../map.md

## What to build

Two more checks on the membership machinery that ticket 42 builds.

**Alt language.** Ticket 06 handed alt text to this axis: the Images tab stays
axis A only, production against the new site in one store. So axis B must read
the `alt` attribute, or an untranslated alt is checked by nobody. `ImageRecord`
carries `alt`, with `null` for an absent attribute and `""` for one that is
present and empty. The class is `alt-untranslated`.

**Meta.** `meta-presence` when a title or a description is absent.
`meta-untranslated` when the value is identical to the NL value. `PageMeta` is
`{ title, description, canonical, noindex, h1 }` and holds no hreflang, so read
title, description, canonical and h1 only.

Axis B is the first consumer of the `meta` check. `CHECKS` declares it and no
class has used it until now. **Ticket 21 owns the axis A meta rules** — what a
changed `<title>` means for parity is a real question with SEO weight, and it is
not this ticket.

## Why three classes and not one

The reason is mechanical, not taxonomic. `class` is ticket 01's mute key and
ticket 02's shown or hidden switch. Alt text and meta are much more likely to be
muted for a whole store than body copy is. One shared class would make an editor
hide visible copy to silence a `<title>`.

All three classes are shown.

## Acceptance criteria

- [ ] A de image with the nl alt text makes one `alt-untranslated` finding.
- [ ] An absent `alt` and an empty `alt` are told apart.
- [ ] A de page with the nl `<title>` makes one `meta-untranslated` finding.
- [ ] A page with no `<title>` or no description makes one `meta-presence`
      finding.
- [ ] A mute on `meta-untranslated` does not hide an `untranslated` finding.
- [ ] The same skip rule applies: a brand token in an alt or a title makes no
      finding.
- [ ] `npm test` is green.

## Notes

Production's `nieuwsbrief` page has no `<title>`, which is the only page with
none on either site. That is axis A, and it is evidence that the presence check
finds something real.
