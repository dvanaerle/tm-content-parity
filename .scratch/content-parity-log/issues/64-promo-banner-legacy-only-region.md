# 64 — The promo banner is a legacy-only region

**What to build:** the campaign banner stops making findings on every page it loads
on, and the log says loudly if the rule ever stops matching.

The banner is one shared Magento block. It is editor work, so it is not a
non-editorial region — but the new site will not get it, which makes it
**legacy-only**, in the same manner as a legacy-only page. Measured over the whole
corpus: **2,698 findings, 7.7% of 34,910, on 371 of 448 pages.** By class: 1,635
`text-missing`, 1,036 `missing-link`, and a small tail. By store: nl 1,239, be 1,043,
de 121, uk 120, be_fr 100, fr 75.

One authored block makes 7.7% of the work list. It is the largest single removal
available.

The banner has no stable markup hook: its wrapper class is generic and its inner
classes are generated hashes. It also has no stable **text**, because it is
translated in each store. What is stable across stores is the campaign option ids in
a link target — Magento attribute codes and option ids are global. Measured in `nl`,
`be`, `de` and `uk`, that signal matched the banner and matched nothing else.

**Blocked by:** 63.

**Status:** ready-for-agent

**Origin:** the grilling of 2026-08-07 on the content unit. The user asked for the
banner to be ignored, and then asked what happens when the content changes.

- [ ] One entry in the excluded-region list, reason `legacy-only`, anchored on the
      campaign option ids in a link target.
- [ ] The entry names the campaign and the date, because the anchor is
      campaign-specific by construction.
- [ ] The entry is verified in all six stores. `fr` and `be_fr` are **not** verified
      yet: the URLs used while grilling answered 404, which proves only that they were
      guessed. Take the real URLs from the seed list.
- [ ] Both responsive versions of the banner leave together. They sit inside one
      wrapper, so one match removes both.
- [ ] **Coverage is compared against the previous snapshot.** If the region was
      removed on 371 pages and is now removed on none, the log says that in one line.
      The reader must never have to infer it from 2,698 rows that came back.
- [ ] The 2,698 findings are gone, and no page loses a unit that an editor wrote.

## Not to decide again

Excluding a campaign banner is an exception to the resolved decision behind the
`campaign` class and the promo pattern, which exist because a promotional difference
is one of the most valuable findings the log makes. The exception is narrow, and it
stays narrow: `campaign` keeps working on promotional copy **inside** a content unit.
Only a whole region that is declared legacy-only leaves the log.

If the new site ever gets its own banner, it will not match a production anchor and
it appears as added content. That class is hidden by default, so it arrives behind
the noise toggle rather than announcing itself. Accepted, and recorded here so the
next reader is not surprised.
