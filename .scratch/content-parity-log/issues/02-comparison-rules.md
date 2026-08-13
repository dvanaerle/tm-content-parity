# 02 — Comparison and normalisation rules

Type: grilling
Status: resolved
Resolved: 2026-08-06
Blocked by: —
Parent: ../map.md

## Question

What counts as a finding? Settle the normalisation, the exclusion set, the
element matching, the grouping key and the confidence model.

This is the other half of "the error rate must be reduced". These rules decide
whether an editor trusts the log or ignores it.

## Evidence from the prototype

One page, `heavy-duty-terrasoverkapping`: **90 raw differences → 61 after
grouping → 47 worth acting on**, against 95 matched elements. So roughly half the
raw diff is noise, and grouping alone removes a third of it.

Five noise sources, all confirmed on real data:

| Source | Example | First-cut handling |
| --- | --- | --- |
| One change counted many times | `Kleuren:` → `Verkrijgbaar in de volgende kleuren:`, 4× and 5× | Group on `status + prodNorm + newNorm`, badge `×4` |
| Structural rewrite, same content | Colour prose on prod became a `<table>` of `<td>RAL 7016` on new | Class `restructured`, low confidence |
| Prices | `€ 799`, `€ 1.534` | Class `price`, low confidence, number-masked compare |
| Campaign copy | `10% korting…`, `Bekijk deals` | Class `campaign`, low confidence |
| Formatting only | `Stijl Modern of Klassiek` vs `Stijl modern of klassiek` | Class `formatting`, low confidence |

A known misclassification to fix: `Bekijk alle deals` → `Bekijk alle FAQs` is
classed `campaign` only because it contains the word "deals". It is a real CTA
change. The keyword approach is too blunt.

## What to settle

- **Normalisation**: case, whitespace, non-breaking spaces, curly quotes, dashes,
  HTML entities, trailing punctuation. Which of these may hide a real defect?
- **The chrome exclusion set.** The prototype strips header, footer, nav, form,
  breadcrumb, cookie, newsletter, menu, modal, drawer, usp-bar, trustpilot and
  `[role=dialog]`. Too aggressive? Not enough? Boilerplate is the biggest single
  false-positive source, and over-stripping hides real defects.
- **Element matching.** LCS on normalised text, then similarity pairing of the
  leftovers at a 0.55 threshold. Is that threshold right, and is token overlap
  good enough or is edit distance needed?
- **Which text elements count.** The prototype takes `h1-h6, p, li, blockquote,
  dt, dd, button, a, figcaption, th, td`, skipping any node that contains another
  such node. Anchors only count as CTAs.
- **The confidence model.** Three levels today: likely real, worth a look, likely
  noise. Does an editor need three, or is the hide-noise toggle enough?
- **Dynamic content.** Stock counts, review totals, dates and prices differ
  between environments for legitimate reasons. Rule-based, or an explicit
  ignore-list per page?

## Notes

The first cut lives in
`devdva02/.scratch/sitemap-content-overview/_scripts/prototype-parity-data.mjs`
(functions `normalise`, `classify`, `group`, `compare`). Re-run against any slug:
`node prototype-parity-data.mjs <slug>`.

Resolve with `/grilling`. Tickets 05, 08, 11 and 12 wait on this.

## Answer

A finding is an **actionable difference**. The tool must not make a finding that
it then hides. This changes the counts: the first cut made 61 grouped findings,
but it counted `match-normalised` rows. These rows are not findings.

### Normalisation — two tiers

Tier 1 is **invisible equivalence**. A reader cannot see these differences.
Fold them silently. Do not report them.

- non-breaking space to space
- curly quotation marks to straight quotation marks
- en dash and em dash to hyphen
- collapse all whitespace
- HTML entities to their characters

Tier 2 is **visible difference**. Do not fold these. Report them.

- letter case
- trailing punctuation

Production made its letter case on purpose. If the tool folds case, the new
site can drift and no person sees it. The risk is volume. If letter case is
different across the full site, the log fills with these findings. ~~The per-page
mute is the wrong tool for a site-wide difference.~~ Watch this after the first
full run. — **2026-08-13, ADR 0011: this sentence was right and it is the whole argument.**
*The per-page mute is the wrong tool for a site-wide difference* was written on 2026-08-06,
four days before ADR 0008 hardened the key and seven before the ADR that withdrew it. The
right tool for a site-wide difference is the class's visibility (ADR 0005).

### The class vocabulary

`class` is the only axis. The confidence axis is removed, because it was
calculated from the class and gave no more data. Keep the similarity score as a
number on `copy` findings. Do not put it in a bucket.

~~`class` is also the mute key from ticket 01.~~ Thus each class must have a name an
editor knows. — **the key clause is struck 2026-08-13, [ADR
0011](../../../docs/adr/0011-the-mute-is-withdrawn.md); the conclusion stands.** A class
still names a pill an editor filters on and a word they read, so it still needs a name they
know. It keys nothing.

| class | meaning | default |
| --- | --- | --- |
| `copy` | text changed, both sides are present | shown |
| `structure` | present on one side only | shown |
| `casing` | only letter case or trailing punctuation is different | shown |
| `restructured` | same content, but built with a different element | hidden |
| `price` | only numbers are different | hidden |
| `campaign` | promotional copy on **both** sides | hidden |

The list is closed, but a ticket can add to it. Tickets 05 and 06 will add link
and image classes. Each new class must give its default.

### Classification rules

- **Campaign**: the promotional pattern must match **both** sides. The first cut
  matched the two sides together, so a keyword on one side was sufficient. This
  made `Bekijk alle deals` to `Bekijk alle FAQs` a campaign difference. It is a
  real CTA change, and it is the most important kind of finding.
  **Amended by ticket 06 for images only**: `image-campaign` fires on a pattern
  match on **either** side. An image identity is a filename carrying an ISO date
  and a campaign word, so the ambiguity that justifies both-sides for text does not
  exist. Under the both-sides rule, one production banner would have fired as
  `image-missing` on 123 of 124 pages.
- **Restructured**: the tag must be different **across the two sides**, for
  example production `p` to new `td`. The first cut used "the tag is `td` or
  `th`". Because `restructured` is now hidden, that rule hid every difference in
  a table cell. Wrong values in a specification table are a defect that this log
  must find.

### Element matching

- Keep the token-overlap score. It is cheap and needs no new dependency.
- Raise the pair threshold from 0.55 to **0.6**.
- Never pair two headings of a different level.

A wrong pair is worse than no pair. A wrong pair shows two unrelated sentences
side by side and gives the editor false data. A missed pair only makes two rows
instead of one, and both rows are true.

### Dynamic content

Use the number mask only. Do not build a per-page ignore list in configuration.
Ticket 01 gives the **mute**, which is keyed on page and class and is kept in
Supabase. That is the ignore list, and an editor can change it. A second list in
a file will not agree with the first, and only a developer could change it.

### Which elements count

- Tags: `h1-h6, p, li, blockquote, dt, dd, button, a, figcaption, th, td`.
- Skip a node that contains another node from this list. The children speak.
- **Count all anchors**, not only the CTAs. The first cut removed every anchor
  that did not look like a button, so no comparison saw the text of a link in
  the body. Keep `kind: 'cta'` as a label only. Ticket 05 compares link targets;
  this rule compares link text.

### The content boundary

Measured on all 181 pages, both sides, 288 requests, all HTTP 200:

| | checked | one `<main>` | zero |
| --- | --- | --- | --- |
| production | 138 | 135 | 3 |
| new | 150 | 149 | 1 |

No page has more than one `<main>`. The pages with zero are
`faq/productinformatie`, `faq/wijzigingen-retour` and `tuinhuis-met-overkapping`
on production, and `blog` on the new site. `blog` is out of scope.

`<main>` is the content boundary. **Inside `<main>`, the 16-selector chrome list
removes zero text elements on both sites** (production 145 to 145, new 159 to
159). On the page examined, every class-substring selector matched nothing.

Keep the chrome list, but use it only on the `body` fallback path, and trim it
to the selectors that do work:

`header, footer, nav, form, script, style, noscript, [class*="breadcrumb"],
[class*="menu"], [role="dialog"]`

Removed: `cookie`, `modal`, `drawer`, `usp-bar`, `trustpilot`. Together they
removed 0 or 1 text elements across both sites.

> **Amended 2026-08-06 by ticket 14.** `[class*="breadcrumb"]` is **restored**.
> The measurement that removed it looked at one page. Across 147 production
> pages, its removal leaks one breadcrumb `<li>` on **104** of them.

Do not delete the list. Three production pages have no `<main>`. The difference
between the `body` root and the `main` root is approximately 105 elements on
production and 130 on the new site. Without the list, each of those three pages
makes about one hundred false findings.

No over-stripping was found. Even at the `body` root, all the removed samples
were true chrome: header controls, footer link columns, the mobile menu panel
and the account drawer.

### The grouping key

The key is `status | prodNorm | newNorm`. `prodNorm` and `newNorm` are the
**tier-1 text, with letter case and trailing punctuation kept**.

Tier 2 is a comparison concept. It is never a key concept. If the key folds
case, two texts that differ only in case make one group, and the `casing`
finding cannot exist. Ticket 01 builds the finding id on this key, so the
extractor must obey this rule.

### Facts found

- The premise that production runs the old theme looks wrong on this page.
  Production sends Tailwind classes with Hyvä breakpoint prefixes
  (`z-40 sticky laptop:relative top-0 mb-4`). Both sites use the class
  `page-footer`. The class vocabulary is shared. The **structure** is different:
  production has a `<header>` element, and the new site has none inside `body`.
  Confirm this before any decision depends on it.
- The new site holds about 8 text elements outside `<main>` that the chrome
  rules do not remove. Production shows no such difference. Graduated to
  ticket 14.

> **Amended 2026-08-06 by ticket 14.** Two statements above are **wrong**, and
> both have the same cause.
>
> The claim that the new site has no `<header>` element inside `body` is a
> **parser artefact**, not a difference between the themes. The new site sends
> malformed HTML, and `node-html-parser` deletes the `<body>` and the `<header>`
> while it parses. The raw bytes hold one of each, the same as production.
>
> The 8 elements are all chrome inside `header.page-header`. Parse with
> `closeAllByClosing: true` and the gap falls to 0 on 149 of 149 pages. The
> `<main>` boundary rule is correct and does not change.
>
> The measurements above were made with the defective parse. The counts inside
> `<main>` are unaffected — the fix changes the `<main>` leaf count on 0 of 147
> healthy production pages — but any statement here about **structure outside
> `<main>`** must not be trusted.
