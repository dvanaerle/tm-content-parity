# 01 — Finding identity: stable ids across re-crawls

Type: grilling
Status: resolved
Resolved: 2026-08-06
Blocked by: —
Parent: ../map.md

> **The mute is withdrawn, 2026-08-13, [ADR
> 0011](../../../docs/adr/0011-the-mute-is-withdrawn.md).** This ticket invented the two
> override kinds, so it is where every later *the class is the mute key* comes from. **One
> kind is left**: a dismissal, keyed on the finding id, expiring the moment either text
> changes. The *Mute* column of the table below, and the paragraph under it, are the record
> of 2026-08-06 and are struck in place.
>
> The reasoning in them is not what failed. *A dismissal expiring is correct, not a defect*
> is still the spine of the model, and *a mute is a judgement, an id is an identity* is the
> distinction ADR 0008 was built on. What failed is the claim in the last line — *muted
> findings stay visible behind a toggle, so nothing is truly hidden.* Ticket 88 measured the
> reach: one press covered 173 findings the editor had never seen, and none of the eleven
> mutes anybody wrote survived its own author's second thoughts.
>
> Everything else here stands: the id is still content-addressed, still page-scoped, still
> excludes the occurrence count, and still deliberately expires.

## Question

How does a finding keep a stable id across re-crawls, so that a dismissal or a
manual tick recorded in Supabase stays attached to the right thing?

This is the load-bearing decision in the whole design. Overrides are keyed on the
id. If a re-crawl changes ids, every dismissal silently detaches and all the
false positives an editor already judged come back.

## Why it is hard

The prototype uses `slug:status:base64(status|prodNorm|newNorm)`. That is
content-addressed, and it breaks in both directions:

- **Content changes on purpose.** An editor rewrites the paragraph on the new
  site. The id changes. If the finding was dismissed as a false positive, the
  dismissal is lost and the finding returns.
- **Production changes.** Campaign copy and prices change on prod without anyone
  touching the new site. Same detachment.
- **Position is not stable either.** A positional id (`section 5, element 3`)
  moves the moment a paragraph is inserted above it, which is exactly what the
  LCS alignment exists to absorb.

## What to settle

- The id scheme: content hash, positional, a composite, or a surrogate id with a
  fuzzy re-attachment pass on each re-crawl.
- What an override is actually attached to — the finding, the element, or the
  page-plus-rule pair.
- What happens when re-attachment is ambiguous. Silently drop the override, or
  surface it as "this dismissal no longer matches anything, please re-judge"?
- Whether a dismissal should expire, so a stale judgement cannot hide a real
  regression forever.

## Notes

Resolve with `/grilling` and `/domain-modeling`. The answer names a domain
concept, so it probably belongs in the new repo's `CONTEXT.md`.

Ticket 03 (Supabase schema) and ticket 10 (task lifecycle) both wait on this.

## Answer

**Ids are content-addressed and deliberately expire. The problem the ticket feared
dissolves, because two override kinds carry two different lifetimes.**

### The reframe that shrank the problem

"Resolved" needs no stable id. If an editor really fixes a page, re-check finds no
difference and the finding is gone — there is nothing to re-attach. Only the
**dismissal of a false positive** has to survive a re-crawl. That is the whole
problem.

### Two override kinds

**The `Mute` column is struck, 2026-08-13, ADR 0011.** One override kind is left.

| | Dismissal | ~~Mute~~ |
| --- | --- | --- |
| Keyed on | content | ~~page (or store) + class~~ |
| Lifetime | expires when either side's text changes | ~~persists~~ |
| Means | "these two exact strings are acceptable" | ~~"this class is never a defect here"~~ |
| Example | `Levering in 5 werkdagen.` — trailing dot, fine | ~~`price` on this page; `campaign` site-wide~~ |

A dismissal expiring is **correct**, not a defect. The editor judged *this prod
text* against *this new text*. If either changes, the judgement is stale and must
be re-asked. This is what stops a dismissal from silently absorbing a later
regression — the risk flagged when charting.

~~Mutes cover rotating content (campaigns, prices, stock), which would otherwise
demand a fresh dismissal every cycle and train editors to click without reading.
Muted findings stay visible behind a toggle, so nothing is truly hidden.~~
— **struck 2026-08-13, ADR 0011.** The rotating-content case was real and it got a better
answer than a mute: the campaign banner leaves the log **at extraction**, as an excluded
region anchored on an id (ADR 0003, tickets 64 and 90), which costs no editor judgement at
all and cannot expire with the copy.

### The id

```
id = sha256(store | page | check | rule | prodNorm | newNorm)
```

- **Page-scoped.** The same wording can be fine on one page and wrong on another.
  Evidence supports this: the `Kleuren:` rename assumed to be site-wide appears on
  one page only, 0 of 7 other content-rich pages.
- **Store is in the id.** The same text on NL and BE are separate findings.
- **Check and rule are in the id.** A link finding and a text finding on one URL
  are different things.
- **Normalised text, the same form the comparison uses.** So id stability matches
  "is this the same difference": a whitespace or casing change on the new site does
  not detach a dismissal.
- **Occurrence count is not in the id.** A repeat count moving from 4 to 3 must not
  detach anything.
- **No fuzzy re-attachment pass, and no expiry rule.** Ids are deterministic, so
  the "ambiguous re-attachment" question in the ticket does not arise, and
  expiry is implicit in content-addressing.

### Use a real hash — a bug found while resolving this

The prototype used `base64url(key).slice(0, 16)`, which truncates the **content**,
not a hash. Measured on real data: **156 distinct findings collapsed to 88 ids, 16
colliding buckets, one id covering 30 unrelated findings.** The leading status
string consumed the whole 16-character budget.

Dismissing one campaign string would therefore have dismissed 22 unrelated
findings, real defects included — exactly the failure this ticket exists to
prevent. sha256 truncated to 16 base64url characters gives 156 distinct ids and
zero collisions.

Those ids were also React keys, so duplicates suppressed rows in the UI. Fixed in
`prototype-parity-data.mjs`; the rendered content roughly doubled afterwards.
