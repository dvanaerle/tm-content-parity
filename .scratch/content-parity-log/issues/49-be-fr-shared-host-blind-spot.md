# 49 — The be/be_fr shared-host blind spot, measured

**What this is:** the measurement ticket 38 ordered, and the decision it hands to
a human. `cross-store-link` compares hosts and not stores, because `be` and
`be_fr` share `valanticbe.intern.systems` and a store-based test would report
every be_fr page against itself (ticket 05). The cost is a blind spot: a French
page that links into the Dutch Belgian half of the same host is not flagged.

Ticket 38 said to open a follow-up **only if the number is not zero**. It is not
zero, so this ticket exists. But it is 1.

**Status:** needs-triage

**Origin:** ticket [38](38-six-stores.md), measured on 2026-08-07 by
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
