# 52 — The production page list becomes committed evidence

Type: task
Status: ready-for-agent
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

- [ ] Each of the six store sitemaps is fetched once, and the fetch is recorded:
      the URL, the date, the HTTP status, the byte count and the entry count.
- [ ] The committed extract holds one entry for each URL, with its alternates and
      its `changefreq` for each of the six files. The `changefreq` differs between
      files and that difference is the signal ticket 53 needs, so it must survive
      the reduction.
- [ ] The reduction is repeatable: a second run over the same source gives the
      same bytes.
- [ ] The extract is small enough to read and to review. Ticket 50 measured about
      290 KB for all six stores.
- [ ] A run stops loudly on a 500 or a 503, and says which host failed. It must
      never write a short extract from a failed fetch.
- [ ] The manifest's entry counts agree with the committed extract. A test proves
      it.

## Why the alternates must be kept

Ticket 50 measured that the alternate blocks are the same in all six files, and
that a product page carries all six alternates while a content page does not. The
count of alternates is the discriminator that ticket 53 uses. An extract that
drops the alternates makes ticket 53 impossible.

## Why one entry, not six copies

The alternate blocks are byte-identical in all six files. Only `changefreq`
differs, and only for 234 entries. So one merged entry with six flags is correct
and is six times smaller than six copies.
