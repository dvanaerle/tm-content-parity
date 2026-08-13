# 117 — The page keeps one h1

Type: task
Status: needs-triage
Parent: ../map.md
Spec: [119](119-spec-the-same-words-divided-differently.md)

**What to build:** a check that says whether a store page still has exactly one `h1`. It is a
fact about a **page** and not a difference between two texts, which is why no class in the
text check can express it and why this is its own ticket.

## Why it exists

Ticket 86 makes `heading-level` `information`, so a demoted heading stops being counted. That
is right for `h4 → h3`, which is 70.7% of the class and is one FAQ component levelling its own
headings. It is **not** right for the page's one document title, and the measurement showed
that carving `h1` out of `heading-level` would have caught the wrong pages.

Measured over `data/reports/` at 2026-08-12, 722 comparable pages:

- **685 pages have exactly one `h1` on production.** **14 of them differ on the new site** —
  10 fall to zero, 4 rise to two.
- The `heading-level` class holds only **30** `h1`-touching findings, and **11 of those are
  `p → h1`** on `logo-update`, `copyright` and `reviews`: the new site *adding* a page title,
  which is an improvement.
- It **misses** the four pages that gain a second `h1` — they produce no `h1`-side finding at
  all — and it misses `uk/(uk)privacy-policy`, which loses its only `h1` while the text also
  changes, so the difference lands in another class.

So the class fires on eleven improvements and stays silent on five real regressions. The
question "how many `h1` does this page have" is the one that separates them, and it is not a
question about two strings.

The pages, for the answer to work from:

- **`h1` → 0:** `be_fr/(be_fr)fr/paroi-laterale-en-aluminium/information-produit`,
  `be/glazen-schuifwand/hor-schuifdeur`, `be/privacy-beleid`,
  `de/(de)aluminium-seitenwand/produktinformationen`,
  `de/(de)glasschiebewand/fliegengitter-schiebetur`,
  `fr/(fr)paroi-laterale-en-aluminium/information-produit`,
  `nl/glazen-schuifwand/hor-schuifdeur`, `uk/(uk)aluminium-sidewall/product-information`,
  `uk/(uk)glass-sliding-door/insect-screen`, `uk/(uk)privacy-policy`
- **`h1` → 2:** `uk/(uk)sliding-door`, `uk/losse-onderdelen`,
  `uk/terrasoverkapping/onderdelen/dak-vervangen`, `uk/verlichting`

Note the shape of the population: the same page in several stores, which is the signature of a
template and not of an editor's mistake.

## Open questions for triage

- **Is it a finding at all?** It is scoped to a page, and `Finding id` is page-scoped already,
  so it can be one. But `Priority` and `Note` are the two things that describe a page today,
  and a page-scoped *difference* would be new. Settle this before building.
- **Is heading hierarchy this log's job?** Ticket 86 states plainly that heading hierarchy is
  SEO work the log has always said belongs to another phase. Fourteen pages is a small,
  concrete, template-shaped list — small enough that a one-off list handed to whoever owns SEO
  may be worth more than a permanent check. Ticket 86's acceptance criteria require the answer
  to say where heading hierarchy is handled instead, or to state plainly that it is nowhere.
  **This ticket is that answer, or it is the reason there is no answer.** An unowned hand-off
  is worse than a stated gap.
- If it becomes a check, `meta` is the nearest neighbour — a check that is display-only and
  page-scoped.
