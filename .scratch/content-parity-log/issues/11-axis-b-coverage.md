# 11 — Axis B: cross-language coverage rules

Type: grilling
Status: resolved
Resolved: 2026-08-06
Assignee: d.aerle
Blocked by: 02, 04
Parent: ../map.md

## Question

What does the coverage axis check when it compares NL to the other five stores,
and how does it avoid drowning in the fact that translated text is, by design,
different text?

Axis A asks "did this store lose something in migration". Axis B asks "did this
store ever get it". Different questions, different task lists, separate tabs.

## What to settle

- **Untranslated content.** Detecting text that is still Dutch on the DE, FR or UK
  store is the highest-value check here. Language detection, or a cheaper signal —
  string identical to the NL original, which for a real translation it would not
  be? Beware of proper nouns and product names that are correctly identical
  (Gumax®, Tuinmaximaal, RAL codes).
- **Missing pages.** A page in NL with no counterpart in DE. Straightforward, once
  ticket 04 produces the lists. Is every gap a defect, or are some stores
  deliberately smaller? The baseline suggests deliberate: be 125, de 44, uk 41,
  be_fr 28, fr 27 against 181 NL pages.
- **Extra pages.** A page that exists only in a non-NL store. hreflang misses
  these, which is why ticket 04 reads the sitemap instead.
- **Structural divergence.** Element count, heading outline shape, or section count
  differing between NL and a store. Which of these is a signal and which is noise?
- **Comparable elements.** Which checks work across languages at all? Image
  filenames and link paths should match; text will not. So Axis B probably runs the
  link and image comparisons plus structure, and only a narrow text check.
- **Alt text in the wrong language** — **settled: this tab owns it.** Ticket 06
  handed it over: the Images tab stays Axis A only, prod against new within one
  store. So Axis B must actually read `alt` attributes, not text nodes alone, or
  an untranslated alt is checked by nobody.
- **Which store is the reference.** NL is the spine, but be_fr and fr are both
  French. Is fr compared to NL, or to be_fr?

## Notes

`tuinmaximaal-translator` holds the approved glossary and is required for any
judgement about whether a translation is correct.

Resolve with `/grilling`. Do not start until ticket 04 has produced the page
lists — the shape of the gaps will change the questions.

## Answer

Axis B compares each store to NL **on the new site only**. It runs five checks,
adds nine classes, and needs no production data at all.

### The reference

**Every store compares to NL, always.** `fr` is not compared to `be_fr`, although
both are French. NL is the only store that has all 181 pages, so NL is the only
complete reference. A French-to-French comparison answers a different question —
near-duplicate detection between two siblings — and it does not tell you if a
store got the content.

**The new site is the only environment.** Production is not read. The destination
of this map is a log that an editor can close, and only the new site can still be
changed, so a finding against production coverage debt is a finding that nobody
can close. Ticket 02 does not permit such a finding. This also makes Axis B the
one axis that can be built on the seed data as it is: all 451 `prodStatus` values
in `data/10-store-seeds.json` are 0, because production was in maintenance mode
for the whole of ticket 04's run.

Consequence, accepted: Axis B cannot tell an editor if a gap is new or inherited.

### The five checks

Axis B runs **page presence**, **untranslated text**, **alt language**, **meta**,
and **heading outline shape**.

Two candidate checks are **removed**:

- **Link paths.** Ticket 04 proved that `de`, `fr`, `uk` and `be_fr` translate the
  category url keys. A path that differs is therefore the normal case, not a
  defect, and the check is almost all noise.
- **Element count and section count.** Charting showed that section structure is
  not comparable, and that was inside one language. German text is longer than
  Dutch, and a translator can put two sentences together, so the counts move for
  correct reasons. The heading outline replaces them.

### Untranslated text: identical strings, not language detection

A string that is **byte-identical to the NL string** is the signal. There is no
language detection, and no confidence score. Ticket 02 removed the confidence
axis from this project, and a probabilistic score is what it removed.

The reason is that an editor must understand the finding: "this DE page shows the
exact Dutch sentence from NL" is actionable at a glance.

The check is **set membership**, not element pairing. `PageExtract.elements`
carries no DOM path and no selector — only `{ index, tag, kind, level, raw, norm }`
— so a positional comparison across languages is impossible. It is also not
necessary: the test is if the store page holds a `norm` value that the NL page
also holds. There is no pair threshold, no alignment, and no sensitivity to
reordering.

**Suppression is a skip rule, not an allowlist of pages.** A string is skipped if,
after you remove digits, punctuation and units, it holds **fewer than 3 words**,
or if it matches a brand token. This covers `Gumax®`, `Tuinmaximaal`, `RAL 7016`,
model names and dimensions, which are correctly identical in all languages.

**The skip-token list lives in the repo**, in `compare/`, next to the other
comparison rules. Read the `tuinmaximaal-translator` glossary once and commit the
list. The glossary is the authority on what a brand token is, but it is a skill,
not a machine-readable file. The list is **not** in Supabase: an editor who
records a judgement and an editor who changes the rules hold two different
powers, and ticket 03 made that table append-only and unauthenticated on purpose.

**Three classes, not one**: `untranslated`, `alt-untranslated`,
`meta-untranslated`. The reason is mechanical, not taxonomic. `class` is ticket
01's mute key and ticket 02's shown/hidden switch. Alt text and meta are much
more likely to be muted for a whole store than body copy is, and one shared class
would make an editor hide visible copy to silence a `<title>`. All three are
shown.

### Page presence

A **null cell** in the seed data — the page is not in that store's sitemap — makes
a `missing-page` finding. There are 635 null cells of 1086. Only 20 of 181 rows
hold all six stores, and 53 rows are NL only.

Every absent page is a finding, and an editor **mutes** the pages that are absent
on purpose. `muteKey()` is already `store|page|class`, so per-store muting needs
no change to the contract. The UI gives a "mute for all stores" bulk action that
writes five events, as ticket 09 already set the pattern for bulk dismissal.

The two alternatives were worse. If a human must first mark each NL page as
in-scope per store, the tab shows nothing until 905 decisions are made. If a
missing page is only a row in a matrix and never a finding, the one case that
matters — a page that must exist, and nobody saw that it does not — is hidden.

Consequence, accepted: the DE tab opens with about 136 missing pages on day one.

A page that exists **only** in a non-NL store is an `orphan-page` finding against
the **NL** store, not against the store that holds it. Ticket 04 found no such
page: hreflang clustering resolved all 446 non-NL pages onto an NL key, with zero
uses of the store-scoped fallback key. Ticket 16 keeps the hard half — the new
site serves no sitemap, so finding a page that nothing links to is a crawl
problem, not a rules problem.

**A 404 cell is not this axis.** The seed data holds two different absences. A
null cell means that nobody ever asked for the page in that store, which is
coverage. A 404 cell means that the store claims the page in its own sitemap and
the new site does not serve it (nl 14, be 8, be_fr 4, de 3, fr 3, uk 2 — 34 in
all), which is a migration defect on a page that exists. **Ticket 20 owns the 404
cell.** This also keeps `missing-page` derivable from the seed file with no status
logic in it.

**If the NL reference itself answers 404, Axis B emits nothing** for that page and
ticket 20 owns it. A DE page can answer 200 while its NL reference answers 404. A
finding on the DE page would send the editor to the wrong page, because the defect
is on the NL page. Production is not used as a fallback reference: that would
break the single-environment rule for exactly the pages where production is least
trustworthy.

### Images

**`image-missing-store`** (shown) is the valuable half: an image identity that NL
holds and the store does not. Ticket 06's `imageKey()` is the basename,
lowercased, so it matches across languages, because the media is shared.

**`image-store-variant`** (hidden) is a basename that differs. A DE page can
correctly carry a German banner with German text in the image. A differing
basename cannot be told apart from the wrong photo, so ticket 02's rule applies:
the tool must not make a finding that it then hides, therefore the class is hidden
by default and an editor turns it on per store.

Ticket 06 handed alt text to this axis. Axis B therefore reads `alt` attributes,
not text nodes alone, or nobody checks an untranslated alt. `ImageRecord` carries
`alt`, with `null` for an absent attribute and `""` for present and empty.

### Heading outline shape

One narrow structural check: the **sequence of heading levels inside `<main>`**,
with the heading text ignored. A section that is absent shows as an absent `h2` in
the sequence. A translator who puts two sentences together does not touch it. The
extract makes this directly available: elements carry `kind: 'heading'` and
`level: 1-6`.

**One finding per divergent position** in a sequence alignment against NL, not one
finding per page. A per-page finding is not actionable ("something about the
headings differs"), and worse, its content-addressed id changes when any unrelated
heading is edited, so every dismissal expires. A per-position finding reads "DE
has no third-level heading after `h2` #2", which is a task.

**Cap: if more than 0.5 of the positions diverge**, emit one `restructured`
finding instead, reusing ticket 02's hidden class. The page is then restructured,
not incomplete. A tie goes to `outline-shape`, which is the more actionable of the
two.

### Meta

Axis B defines **only its own two meta classes**: `meta-presence` (a title or a
description is absent) and `meta-untranslated`. `CHECKS` in the contract declares
a `meta` check, but no class carries `check: 'meta'` today, so Axis B is the first
consumer of a check that Axis A has not specified. **The Axis A meta rules go to a
new ticket** — what a changed `<title>` or a lost canonical means for parity is a
real question with SEO weight, and this session gathered no evidence for it.

Meta is not dropped from Axis B meanwhile: a DE page with the Dutch `<title>` is a
common and cheap defect to find.

`PageMeta` is `{ title, description, canonical, noindex, h1 }` and holds **no
hreflang**, so the meta check reads title, description, canonical and h1 only.

### Progress and rendering

**Axis B gets its own bar, per store, never summed with the parity bar.** This
**amends ticket 09**, which scoped the roll-up to axis A only. Ticket 09's reason
was that a moving denominator plus a second axis makes one number meaningless —
that argues against one combined number, not against measuring Axis B. Two
labelled bars, with absolute counts beside them, per ticket 09's rule.

**Axis B renders in two places, and that is the point.** A **store-level Coverage
view** owns the presence checks and the matrix. The per-page checks —
untranslated, alt, meta, outline — are one more tab on the pages that exist.
Presence findings have nowhere else to live: to put them in a page ledger means to
render a ledger for a page that is absent.

### The nine new classes

The contract goes from 18 classes to 27.

| class | shown | surface |
|---|---|---|
| `missing-page` | true | presence |
| `orphan-page` | true | presence |
| `untranslated` | true | text |
| `alt-untranslated` | true | images |
| `meta-untranslated` | true | meta |
| `meta-presence` | true | meta |
| `outline-shape` | true | text |
| `image-missing-store` | true | images |
| `image-store-variant` | false | images |

**Consequence for the build, not settled by grilling**: the class table now spans
two axes, and the two axes have separate tabs, separate bars and separate task
lists. The class records therefore need an `axis` field. This follows from
decisions already made; the build ticket records it and does not re-open it.

### Numbers to put in `compare/contract.mjs`

Beside ticket 02's 0.6 pair threshold, so that every tunable number is in one
file:

- skip a string of **fewer than 3 words** after digits, punctuation and units are
  removed
- **0.5** divergent positions is the `restructured` cap, tie to `outline-shape`

### Graduated

- Ticket 21 — the Axis A meta check classes (from the meta decision)
- Ticket 22 — re-measure `prodStatus` with production live (raised in session)
- Ticket 23 — the store-level Coverage view prototype
- Ticket 24 — build the Axis B compare stage
- Ticket 12 is re-worded: eight tabs, not seven
- Ticket 20 gains the 404 cell and the absent-NL-reference case
- Ticket 16 is unblocked, and it inherits the `orphan-page` rule
