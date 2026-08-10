# 49 — The be/be_fr shared-host blind spot, measured

**What this is:** the measurement ticket 38 ordered, and the decision it hands to
a human. `cross-store-link` compares hosts and not stores, because `be` and
`be_fr` share `valanticbe.intern.systems` and a store-based test would report
every be_fr page against itself (ticket 05). The cost is a blind spot: a French
page that links into the Dutch Belgian half of the same host is not flagged.

Ticket 38 said to open a follow-up **only if the number is not zero**. It is not
zero, so this ticket exists. But it is 1.

**Status:** needs-triage — **re-opened 2026-08-10 by ticket
[55](../55-five-stores-show-all-their-pages.md).** The first re-open trigger below
fired. The number that made this wontfix was **1**; it is **12** now. The wontfix
answer is kept below, unedited, because the reasoning is still sound and only the
number under it moved.

**Origin:** ticket [38](../38-six-stores.md), measured on 2026-08-07 by
`crawl/probes/probe-be-fr-shared-host.mjs` over all 29 crawled be_fr pages.

## The measurement

A be_fr page lives under `/fr/`. So a be_fr anchor is in the blind spot when its
target is on the page's own host and its path is not `/fr` and does not start
with `/fr/`.

| side | anchors | on the shared host | outside `/fr` | pages | to a **page** | to a `/media/` file |
|---|---|---|---|---|---|---|
| new | 508 | 501 | 14 | 5 | **1** | 13 |
| production | 1050 | 1039 | 45 | 29 | 30 | 15 |

`cross-store-link` runs on the **new side only**, so the new row is the number
that decides. It is **14 anchors on 5 pages**, and 13 of those are files under
`/media/`, which the two stores share and which are not a page of the other
store. The 13 are French files as well — `..._fr.pdf`,
`conditions-de-garantie-be-fr.pdf`.

**The one page link is `/blog`**, and the blog is out of scope for the log
(104 posts and 4 categories, `README.md` and the map's *Out of scope*).

## What triage has to settle

- **Is one out-of-scope anchor worth a rule?** Ticket 38 said not to write a rule
  against a hypothetical. One `/blog` link is very near a hypothetical. The
  recommendation is **wontfix**, and to re-run the probe when the blog re-enters
  scope or when be_fr grows past 29 pages.
- **If a rule is wanted, what is it?** Not a store-based host test — ticket 05
  ruled that out for a reason that has not changed. It would be a path test on
  `be_fr` alone: an internal target on the page's own host whose path is outside
  `/fr/`. It would need `/media/` excluded, or it reports 13 shared files as
  cross-store leaks.

## Found on the way, and not this ticket

**Production links out of the French store on all 29 be_fr pages.** 29 of the 30
production page anchors are one target,
`self/terrasoverkapping?terrasoverkapping_model=6039%2C6040`, which is the Dutch
category page; the thirtieth is `self/fotogalerij/glazen-schuifwand`.

That is a **storefront defect on production**, so it is the log's output and not
a ticket on the route to the destination — the map closed tickets 15, 17 and 18
on exactly that ground. It needs an owner in `devdva02`, recorded beside them in
`devdva02/docs/storefront-defects.md`.

## Answer: wontfix

Triaged 2026-08-07. **No rule is written, and the blind spot stays.** The
recommendation this ticket carried is taken as given.

The number decides it. `cross-store-link` reads the new side only, and the new
side is **14 anchors on 5 pages**. **13 of the 14 are files under `/media/`**,
which the two Belgian stores share and which are not a page of the other store —
a rule would report all 13 as leaks unless it excluded `/media/`, so 13 of 14 are
noise by construction. **The fourteenth is one link to `/blog`**, and the blog is
out of scope for the log (104 posts and 4 categories).

So the whole surface a rule would catch is **one anchor to an out-of-scope
page**. Ticket 38 said not to write a rule against a hypothetical. One link is
not a hypothetical, but it is near enough that a rule costs more than it finds:
it needs a `/media/` exception, it applies to one store only, and it has one
instance that nobody would act on.

Ticket 05's host-based test stands. Do not make it store-based.

### Re-open trigger

Re-run `crawl/probes/probe-be-fr-shared-host.mjs` and re-open this ticket when
either of these happens:

- **After ticket [55](../55-five-stores-show-all-their-pages.md).** Spec
  [50](../50-content-page-discriminator.md) takes `be_fr` from 29 pages to about
  110. The measurement above covers 29 pages. Roughly four times the pages can be
  roughly four times the anchors, and the number that made this wontfix is 1.
- **When the blog re-enters scope.** The one page link is to `/blog`. If the blog
  becomes a page of the log, that anchor stops being out of scope and the count
  is no longer near zero.

Neither trigger changes the reasoning above. Both change the number the reasoning
rests on, which is why the probe is kept.

## The re-measurement, 2026-08-10, after ticket 55

The first trigger fired. `be_fr` went from 29 pages to **122**, and the probe was
run again over all of them. The number the wontfix rests on is no longer near
zero.

| side | anchors | on the shared host | outside `/fr` | pages | to a **page** | to a `/media/` file |
|---|---|---|---|---|---|---|
| new, 29 pages | 508 | 501 | 14 | 5 | **1** | 13 |
| new, **122 pages** | 1663 | 1545 | 140 | 23 | **16** | 124 |
| production, 122 pages | 2732 | 2570 | 124 | 43 | 34 | 90 |

`cross-store-link` reads the **new side only**, so the new row still decides. It
is **16 anchors to a page of the other store**, and **4 of the 16 are blog posts**,
which stay out of scope. So the surface a rule would catch is **12 in-scope Dutch
pages linked from French pages**, on the shared host:

```
2  self/shading-panel          1  self/glazen-schuifwand/montage
2  self/garantie               1  self/glazen-schuifwand
1  self/steel-look-glazen-schuifwand?acc_composition=6035
1  self/steel-look-glazen-schuifwand?acc_composition=6034
1  self/questions-frequemment-posees
1  self/terrasoverkapping      1  self/glazen-schuifwanden
1  self/zonwering
```

**The wontfix reasoning is not refuted, and it is not confirmed either.** Both of
its two grounds have moved:

- *"13 of 14 are noise by construction."* The `/media/` share is still the bulk —
  124 of 140 — so a rule still needs the `/media/` exception. That ground holds.
- *"The whole surface is one anchor to an out-of-scope page."* This one is gone.
  Twelve in-scope pages is not a hypothetical, and it is not one link that nobody
  would act on.

One of the twelve is its own oddity and not a cross-store leak of the usual kind:
`self/questions-frequemment-posees` is a **French** path served outside `/fr`.

**This ticket decides nothing here.** Ticket 55 owed the re-check and this is it.
Whether 12 buys the rule that ticket 05 refused is triage's call, and
`WORKLIST.md` step 33 is where it is booked.
