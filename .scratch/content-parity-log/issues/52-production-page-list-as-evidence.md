# 52 — The production page list becomes committed evidence

Type: task
Status: resolved
Assignee: —
Blocked by: —
Parent: 50-content-page-discriminator.md

**What to build:** a reader of this log, a year from now, can check every number
in it against the production data it came from. Today the log's page counts come
from a 30 MB sitemap file that lives in another repository and is not committed
anywhere. The claim "the French store has 28 pages" cannot be tested.

Each store's production sitemap is fetched once and reduced to the entries the
log needs, with the hreflang alternates kept. A manifest records what was
fetched. The whole set is a few hundred kilobytes, against 181 MB of source, so
it belongs in git.

- [x] Each of the six store sitemaps is fetched once, and the fetch is recorded:
      the URL, the date, the HTTP status, the byte count and the entry count.
- [x] The committed extract holds one entry for each URL, with its alternates and
      its `changefreq` for each of the six files. The `changefreq` differs between
      files and that difference is the signal ticket 53 needs, so it must survive
      the reduction.
- [x] The reduction is repeatable: a second run over the same source gives the
      same bytes.
- [x] The extract is small enough to read and to review. Ticket 50 measured about
      290 KB for all six stores.
- [x] A run stops loudly on a 500 or a 503, and says which host failed. It must
      never write a short extract from a failed fetch.
- [x] The manifest's entry counts agree with the committed extract. A test proves
      it.

## Answer

Two tracked files, made by one run:

| File | Bytes | Holds |
|---|---|---|
| `data/sitemap-extract.json` | 296,158 | 876 entries: the loc, the alternates, the `changefreq` of each of the six files |
| `data/sitemap-manifest.json` | 1,122 | The url, the date, the status, the byte count and the loc count of each of the six |

289 KB against 181,171,264 bytes of source. Ticket 50 predicted about 290 KB.

`crawl/sitemap-extract.mjs` is the reduction and it is pure, so `npm test` reads
it. `crawl/09-sitemaps.mjs` is the run. `npm test` is green at 361 tests, 14 of
them new.

### The fetch, 2026-08-10

All six answered 200.

| file | url | bytes | locs | kept |
|---|---|---|---|---|
| nl | `www.tuinmaximaal.nl/sitemap.xml` | 30,235,358 | 27,043 | 493 |
| be | `www.tuinmaximaal.be/sitemap.xml` | 30,234,703 | 27,040 | 490 |
| be_fr | `www.tuinmaximaal.be/fr/sitemap.xml` | 30,210,514 | 26,994 | 444 |
| de | `www.tuinmaximaal.de/sitemap.xml` | 30,187,160 | 26,958 | 408 |
| fr | `www.tuinmaximaal.fr/sitemap.xml` | 30,208,830 | 26,992 | 442 |
| uk | `www.tuinmaximaal.co.uk/sitemap.xml` | 30,094,699 | 26,845 | 295 |

**The six urls were written down nowhere.** Ticket 50 measured the six files and
named them `nl.xml`, `be.xml` and so on, and no repository held the addresses.
They were recovered from the `robots.txt` of each host. Only five hosts exist,
and **the Belgian host declares two sitemaps**: that is the sixth. It is the same
`/fr/` prefix that `crawl/10-store-seeds.mjs:54` already uses for `be_fr`. This
is exactly the provenance the manifest now holds.

### What survives, and what does not

The rule is ticket 50's first clause, **without the product signature**: a loc
survives when it carries fewer than six hreflang alternates, or when any one of
the six files marks it `changefreq=daily`.

The product signature is left out on purpose. It is ticket 53's rule, and an
extract that had already applied it could not be used to test it. So the extract
holds candidates and the seed generator holds the rule. That is why 876 entries
is larger than the roughly 845 store pages ticket 50 predicts.

The 876 entries by their count of alternates:

| alternates | 0 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| entries | 197 | 334 | 36 | 60 | 135 | 114 |

**Both clauses are necessary, and now that is measured and not asserted.** 114
entries carry all six alternates and are in the extract only because one file
marks them `daily`. The alternate count alone would drop all 114.

197 entries carry no alternate at all. 182 of them are on the `de` and `uk`
hosts, which agrees with ticket 50: those two stores declare no alternate on
their store-local content. **The other 15 are not on those hosts** — 6 on `nl`,
6 on `be` and 3 on `fr` — so "the `de` and `uk` stores carry no alternates" is
true of those two stores and is not the whole of the no-alternate set. Ticket 53
must not read the two as the same thing.

### Repeatability

The extract carries **no date**. Its bytes are a function of the six source files
alone, so a git diff shows only the pages that moved. The date is in the
manifest, which is the record of one fetch and not a function of it.

Two independent runs against production, each one a fresh 181 MB fetch, gave
**byte-identical** extracts. Three unit tests hold the same property from the
other side: the entries sort by codepoint and not by locale, and neither the
order inside a file nor the key order of the argument reaches the output.

### Failing loudly, verified against a server that fails

Four branches, each one run against a local server that fails, not reasoned
about:

| The host answers | Exit | Says |
|---|---|---|
| 503 | 3 | `Maintenance page at …: HTTP 503` |
| 200 with a maintenance page | 3 | `… body matches /Service\s+Temporarily\s+Unavailable/i` |
| 404 | 1 | `… answered 404, and a sitemap must answer 200` |
| 200 with no `<url>` block | 1 | `These sitemaps answered 200 and hold no <url> block: nl.` |

The first two are `maintenanceReason()` from `crawl/fetch-page.mjs`, the one
maintenance rule (ticket 04). No second copy of it was written, which is the
defect ticket 51 deleted. The third exists because a redirect or a 404 in place
of a sitemap also gives a short extract, so any non-200 aborts and not only the
two statuses ticket 04 names.

**The second row is the one that nearly shipped.** The first version of the run
asked `maintenanceReason` with an empty body, so it read the status only. A host
that answers **200 with a maintenance page** would have passed that check, parsed
to zero locs, and written a two-line extract that looked like a successful run.
The body is now passed in. It costs nothing: `maintenanceReason` tests the
patterns only when the body is under 8,000 characters, so a 30 MB sitemap is one
length test. The fourth row is the belt to that brace.

In all four runs **neither file was written**. The six fetches all complete
before the reduction starts, so a failure at the sixth cannot leave five files'
worth of extract on disk. Both output strings are also built before either write,
so the extract cannot reach disk beside a manifest that does not describe it.

### One assumption that is now a number

"One entry, not six copies" is only correct because the alternate blocks are the
same in all six files. The merge keeps the first block and drops five, so that
measurement was load-bearing and invisible. The extract now carries
`alternateConflicts`, and the run prints it either way.

**It is 0 over all 876 entries.** Ticket 50's measurement holds, and it is
re-checked by every run instead of being trusted.

## What this ticket found that ticket 53 must handle

**All six store home pages are in the sitemaps.** `crawl/10-store-seeds.mjs:143`
says "No store's home page is in the sitemap - the NL one came from the crawl -
so seed all six by hand", and it hand-seeds all six with `source: 'store-home'`.
The extract disagrees:

| home | in the files, as |
|---|---|
| `nl/` | `daily` in nl and uk |
| `be/` | `daily` in be |
| `be/fr/` | `never` in be_fr and fr |
| `de/` | `never` in de |
| `fr/` | `never` in be_fr and fr |
| `co.uk/` | `daily` in nl and uk |

So the hand-seeding is either stale or was never right. Ticket 53 decides which,
and whether the `store-home` provenance survives. This ticket does not touch the
generator.

**There are now two sitemap parsers.** `crawl/sitemap-extract.mjs` holds one, and
`crawl/10-store-seeds.mjs:62-88` holds the older one. They use the same regexes
on the same file shape. Two copies of one rule is the shape that ticket 51
deleted from the maintenance guard, so it must not stay. It is left here on
purpose: ticket 53 rewrites the generator against the extract, and that deletes
the second parser rather than moving it. **If ticket 53 slips, this is two
parsers to keep in step.**

## What this ticket does not do

**It does not wire the extract into the seed generator.** `crawl/10-store-seeds.mjs`
still reads `data/sitemap-prod.xml` and `data/03-merged.json`, still finds
neither, and still exits 2. The extract is a different shape and a different
name on purpose: ticket 53 rewrites the generator against it, and it also has to
carry over the 48 Dutch rows that no sitemap declares. `README.md` says this
where an engineer will meet it.

## Why the alternates must be kept

Ticket 50 measured that the alternate blocks are the same in all six files, and
that a product page carries all six alternates while a content page does not. The
count of alternates is the discriminator that ticket 53 uses. An extract that
drops the alternates makes ticket 53 impossible.

## Why one entry, not six copies

The alternate blocks are byte-identical in all six files. Only `changefreq`
differs, and only for 234 entries. So one merged entry with six flags is correct
and is six times smaller than six copies.
