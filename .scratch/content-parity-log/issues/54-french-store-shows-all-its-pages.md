# 54 — The French store shows all of its pages

Type: task
Status: resolved 2026-08-10 — the identity half was built on the day; the crawl
ran when the hosts came back, inside ticket 55's sitting.
Assignee: —
Blocked by: 53
Parent: 50-content-page-discriminator.md

**What to build:** an editor responsible for the French store opens the French
dashboard and sees about 126 pages, where today they see 28. Each page is crawled
on both sides, compared, and browsable. This includes the pages that production
declares in French only, which have no Dutch counterpart and which the log has
never held.

This is the tracer bullet. One store through every layer. If the page list, the
contract, the crawl, the comparison and the dashboard all hold together on
French, nothing in ticket 55 is in doubt.

- [x] The French store is crawled and compared on the new page list, and the
      dashboard shows every page in it. **Done 2026-08-10, once the hosts answered
      200. 123 pages crawled, 117 comparable, and the dashboard holds all 123.**
- [x] A page with no Dutch counterpart is comparable. Axis A is production against
      the new site in one store, so it needs no Dutch page. Such a page is absent
      from axis B, and that is correct: axis B does not compare words across
      languages.
- [x] A page with no declared counterpart carries the finding that production
      declares no hreflang alternate for it. That is a defect of the sitemap
      metadata, not a content difference.
- [x] The page identity in the contract holds a page that has no Dutch url key.
      Today the contract types the identity as the Dutch url key, and more than
      half of the new pages have none. **The contract changes before the code
      that reads it.**
- [x] **The key of a page that has a Dutch url key does not change, byte for
      byte.** This is the whole of the safety story: every stored finding id, every
      mute and every review keys on the page value, and the override table is
      append-only by policy, so a reformatted key can never be repaired. Keep the
      existing 181 keys and nothing detaches. The new pages have no stored state,
      so they cannot be orphaned.
- [x] **The key of a page with no Dutch url key uses a character that is already
      proven safe.** The home-page sentinel is written in parentheses and survives
      the Windows filesystem, the report filename, the static route and the link
      builders. A colon does not: it is the alternate-data-stream separator on
      NTFS, and it breaks the extract writer, the report writer and the static
      build. The unused store-scoped fallback in the old generator uses a colon.
      Do not ship it.
- [x] Do not use a double underscore as a separator. The report filename replaces
      a slash with a double underscore and is not injective, so a page named with
      one already collides with a page path.
- [x] Three places build a link or a fetch URL from the page value with no URL
      encoding. They work today by luck. Encode them.
- [x] The French numbers are measured and recorded here: pages crawled, pages
      comparable, findings, and the median. **Done 2026-08-10. See "The French
      numbers" below.**
- [x] French was 40% of its navigation and footer under the old rule. It must now
      reach the 88% that ticket 50 measured. The remaining 12% is the blog engine
      and the newsletter page, which are in no sitemap.
- [x] `npm test` is green.

## The identity change is narrow. Measured, not assumed.

The page value is used in about 82 places. **Twelve must change.** The other 70
treat it as an opaque string: the hash and key functions, everything rendered to
an editor, every sort and lookup, and about 31 pure pass-throughs. Of the twelve,
one is the producer and is the real decision, four make the string safe for a
filename, three add the missing URL encoding, and four are cosmetic or already
generic. Five test files hold literal page keys and need updating.

**So there is no expand and contract.** That sequence exists to protect stored
keys during a format migration, and there is no migration here as long as
anchored keys keep their current string. Ticket 57 is therefore folded into this
ticket and ticket 55.

## Why French

The defect was found on the French store and French has the largest proportional
gain, from 28 pages to about 126. It is also one of the two stores that mark
content `never`, so it exercises the clause that the old rule missed. A store
that marks content `daily` would not test the new rule at all.

## Answer, 2026-08-10

**Nine of eleven criteria hold. The two that do not are one thing: the new site
answers HTTP 500 on all five hosts, so nothing can be crawled today.**

The identity change is built, the encoding is closed, the sitemap-metadata finding
exists, and the navigation coverage is measured against the seed list ticket 53
actually built rather than against a set that lived inside ticket 50's session.
`npm test` is green at **472 tests**, 20 new.

### The new site is down, and that is a measurement

Checked before any `data` step, as the runbook orders:

| host | answered |
|---|---|
| `www.tuinmaximaal.fr` | **200** |
| `valanticnl.intern.systems` | **500** |
| `valanticbe.intern.systems` | **500** |
| `valanticde.intern.systems` | **500** |
| `valanticfr.intern.systems` | **500** |
| `valanticuk.intern.systems` | **500** |

It is a Magento bootstrap exception — a 945-byte `errors/customtheme/` page titled
*There has been an error processing your request* — on `/` and on
`/terrasoverkapping` alike. It is **not** a maintenance page.

The crawler would refuse anyway. Ticket 51 widened the guard so that every 500 and
503 aborts the run, where the old private regex needed a matching body. So the two
open criteria are not skipped work; they are work the tool declines to do against a
server that fails. **A crawl now would record 123 phantom French pages.**

`crawl/probes/probe-navigation-coverage.mjs` was written to read **production
only**, which is why the coverage criterion could close on the same day.

### The navigation and the footer, re-measured against the built list

Ticket 50 read the French navigation and footer inside its own session and scored
88.5% against a page set nobody can open again. This is the same measurement
against `data/10-store-seeds.json`, and it repeats:

| rule | paths | in the seed list | coverage |
|---|---|---|---|
| the old `changefreq=daily` rule | 51 | 18 | **35.3%** |
| the rule ticket 53 built | 51 | 46 | **90.2%** |

**One denominator for both rows**, which ticket 50 did not have: it compared 40.4%
against 88.5% over two slightly different path sets. The gain is 18 pages to 46.

The five misses are exactly the two things this ticket predicted, and nothing else:
`/blog`, three blog posts, and `/newsletter`. Every one is absent from all six
sitemaps.

**The denominator is a stated choice.** The French home page links **59** internal
paths from its chrome. Eight are not candidates for the log, and the probe names
them: three `/media/…pdf` files, and `/checkout/cart`, `/customer/account`,
`/customer/account/login`, `/customer/account/logout` and `/dealer/account/login`.
A file is an asset and an account route is an application route, which `CONTEXT.md`
already puts outside the log. Counting them gives 46 of 59, or 78%, and it measures
the wrong thing. Both numbers are in `data/probe-navigation-coverage.json` with the
full path list, because ticket 22 exists precisely because 451 numbers were
recorded and nobody could check them.

A navigation crawl stays a **floor and not an answer**. Ticket 50 found 11 pages in
the set that are in no navigation and no footer.

### The identity change was narrower than the ticket estimated

The ticket says twelve of about 82 readers must change: one producer, four that
make the string safe for a filename, three that add URL encoding, four cosmetic.
Measured against the code as ticket 53 left it:

- **The producer had already changed.** `pageKey()` in `crawl/seed-list.mjs` and the
  `page` field of `compare/contract.mjs` were both done by ticket 53, which settled
  the parenthesis and kept the 181 anchored keys byte-identical. Two criteria of
  this ticket were closed before it opened.
- **The four filename writers needed no change at all**, and that is the point of
  the parenthesis rather than a piece of luck. Proved end to end below.
- **The three encoders did need the change.** They are `Dashboard.jsx` twice and
  `web/src/lib/recheck.mjs` twice.

So the real work was smaller than twelve places, and the ticket's estimate was
counted against the pre-53 tree.

### The encoding changes no live link, and that is measured

`web/src/lib/page-url.mjs` holds `pageHref()` and `recheckPath()`. The encoding is
**per segment**, because a page key holds a slash (`faq/productinformatie`) and the
Astro route is a rest parameter — `encodeURIComponent` on the whole key would write
`%2F` and the link would 404.

**Encoding changes 0 of the 550 committed page keys.** So it is a guard against the
input widening and not a repair of a broken link, exactly as the ticket says: they
work today by luck. `encodeURIComponent` leaves a parenthesis alone, which is a
second reason it is the right sentinel.

### The parenthesis survives all four writers, proved and not reasoned about

A synthetic report was written under the key `(fr)heavy-duty-veranda`, the static
build was run, and the artefacts were read:

| | |
|---|---|
| the report filename | `fr__(fr)heavy-duty-veranda.json` |
| the built page | `dist/fr/(fr)heavy-duty-veranda/index.html` |
| the dashboard href | `href="/fr/(fr)heavy-duty-veranda/"` |
| pages built | 455, and 456 with the synthetic page |

The href is the built directory byte for byte. The synthetic report was then
removed. **No unit test can say this**, which is why it was done against the real
build: the ticket stakes the whole sentinel choice on the static route accepting
the character.

`storeOfFile()` reads `be_fr` out of `be_fr__(be_fr)fr__pergola.json` and not `fr`,
and that is now pinned. A reader that took the store from the sentinel would file
the Belgian French pages under the French store, and the two dashboards would
disagree about which store owns a page.

### The shape of the key is read in one place

`shared/page-key.mjs` is new, and it is the named exception to the contract's
sentence that every reader treats the page value as an opaque string. That sentence
must stay true of the other readers — the key is in the finding id, the mute key
and the append-only override table — but it was already false in spirit, because
`crawl/seed-list.mjs` held its own colon guard and its own `(home)` literal while
the contract promised the shape was nobody's business.

It holds `HOME`, `unanchoredStore()` and `unsafeReason()`. ADR 0001's three
questions all answer yes: it is pure, it is a leaf, and `crawl/` writes the form
while `compare/` reads it back. It is the fourth resident of `shared/` and the
second to be born there rather than moved into it.

`unsafeReason()` refuses two characters, and the schema check reads it, so the
generator asks the question of its own output before it writes:

- **A colon**, for the reason the ticket gives. The old generator's unused
  store-scoped fallback went with the generator ticket 51 deleted, so there was
  nothing left to delete here — only a guard to keep.
- **A double underscore**, which the ticket asked for and which nothing checked.
  `reportFilename()` writes one in place of a slash, so `a__b` and `a/b` are one
  filename. No key holds one today.

### The twenty-second class, and the first `meta` class

`no-declared-alternate`, `check: 'meta'`, **hidden**.

`CONTEXT.md` separates *no NL page* from *no declared alternate* and says the log
must not name the second as the first. This is the second. It is hidden because it
is a defect of the sitemap and there is nothing on the page for an editor to
change — and because 95 of the 123 French pages are unanchored, so a shown class
would hand every French editor 95 open findings they cannot close.

It fires on a one-sided page too: the alternate is missing either way, and a
one-sided page is the case most likely to need the sentence.

A test pins that an unanchored page and an anchored page have the **same**
`summary.shown` and the **same** `findingSetHash`, so the bar does not move and no
page review goes stale.

`CHECKS` has declared a `meta` check since ticket 08 with nothing using it. Ticket
21 recorded that as an open observation; this is its first user. Ticket 58 adds the
nine head classes and does not collide with this one.

**The vocabulary is 21 classes to 22, so the class-count gate of WORKLIST step 17
(ticket 75) must now read 22.** The tone table needed no entry: a hidden class is
grey by rule, so the colour cannot come apart from the meaning.

### ADR 0001's two open rows are closed

The record said `crawl/excluded-pages.mjs` and `crawl/seed-rows.mjs` move with the
change that opens `web/src/lib/reports.mjs`, and this ticket opens it. Both are in
`shared/` now and nine importers changed. `web/` no longer reaches into `crawl/`.

`compare/vocabulary.mjs` and `compare/worddiff.mjs` stay where they are. They break
no arrow, so the ADR's rule applies to them unchanged.

### The gate

| | before | after |
|---|---|---|
| `npm test` | 452 | **472** |
| nl crawled | 179 | **179** |
| nl comparable | 124 | **124** |
| nl findings | 9,635 | **9,635** |
| nl shown | 6,747 | **6,747** |
| nl median shown | 37 | **37** |
| pages built | 455 | **455** |

**Not one nl number moved.** The five other stores were not re-compared, which is
the whole reason this ticket is one store: their reports are still the pre-54
snapshot, and ticket 55 rebuilds them.

`web/node_modules` is repaired, so WORKLIST step 00c is done. The build ran green
twice, which also says the React island still hydrates after the two new imports.
Step 00a's lesson holds: a green `npm test` says nothing about the bundle.

## The French numbers, 2026-08-10

**The server came back the same day, and the crawl ran inside ticket 55's
sitting.** All five `valantic*` hosts answer 200. The two criteria above are
closed, and this ticket is resolved.

| | predicted | measured |
|---|---|---|
| rows | 123 | **123** |
| crawled | 123 | **123** |
| comparable | about 117 | **117** |
| findings | — | **8,154** |
| shown | — | **5,495** |
| median shown | — | **25 a page** |
| navigation and footer coverage | 90.2% | **90.2%** |

**Every prediction in the section below held.** 123 of 123 crawled with no
failure, and the six that are not comparable are the six the seed list said would
404 on the new side. The dashboard was counted in the built HTML: **123 page
links**.

The clean-up the section below prescribes was **not needed**. It says to delete the
28 old French extracts and reports first, because they are keyed on superseded page
keys. By the time the crawl ran, `data/extract/fr/` already held 123 files on the
new keys, and `compare/30-compare.mjs` writes reports from the extracts, so no
stale report survived: 816 reports on disk against 820 seed pages, and **zero** of
them keyed outside the current seed list. Checked, not assumed.

Ticket 55 holds the rest of the measurement, including the whole-corpus table.

### What was left, and what it needed

Nothing here waited on a decision. It waited on a server, and the server came back.

When the five `valantic*` hosts answer 200:

```powershell
Remove-Item data/extract/fr -Recurse -Force      # the 28 old keys, superseded
Remove-Item data/reports/fr__*.json
node crawl/21-crawl-store.mjs fr                 # about 246 requests
node compare/link-status.mjs                     # no store. It refuses one
node compare/30-compare.mjs fr
node compare/measure.mjs fr
node compare/measure.mjs nl                      # must not move
```

The stale French extracts go first: they are keyed on the 28 old page keys, and 96
of the 123 new keys did not exist when they were written. **All 28 old French paths
are in the new list of 123**, so nothing is lost by deleting them — checked against
the seed list of commit `f640567`.

What the French store should then show, from the seed list:

| | |
|---|---|
| rows | **123** |
| anchored, keyed on a Dutch url key | 27 |
| the home row, `(home)` | 1 |
| unanchored, keyed `(fr)path` | **95** |
| admitted by `sitemap-low-alternates` | 91 |
| admitted by `sitemap-daily` | 32 |
| production answered 200 on 2026-08-10 | 123 of 123 |
| the new site answered 200 on 2026-08-10 | 117 of 123 |

So **about 117 comparable** is the number to expect and not 123, and the six 404s
are axis A's real backlog. The ticket's "about 126" was ticket 50's estimate, made
before the product signature was measured; ticket 53 settled the count at 123.

### One thing this ticket says that the code does not

The ticket says the identity change touches about 82 places of which twelve must
change. That was counted against the tree before ticket 53. Six of the twelve were
already done, and the four filename writers turned out to need nothing. Recorded
here rather than settled quietly, per `AGENTS.md`.

### What the review changed

Two axes, run against the working tree before the commit. Six things came back and
five were fixed in the same sitting.

- **The probe could not read the Belgian French store.** `PROD_HOST` maps a host to
  a store and holds five hosts for six stores, because `be` and `be_fr` share one.
  Inverting it left `be_fr` undefined, so the probe would have fetched
  `https://undefined/fr/` after passing its own store filter. The store that the
  ticket's own gain is largest on after French. It also reported `NaN` where the
  chrome held no page link, and a `NaN` in a table reads like a measurement, so it
  throws now.
- **The sentinel had two definitions.** `shared/page-key.mjs` claims to own the
  shape, and `crawl/seed-list.mjs` still wrote `` `(${store})${path}` `` inline.
  The reader and the writer were in two files and could drift, which is the one
  thing the module exists to stop. `unanchoredKey()` is the writer now, and a test
  pins that `unanchoredStore()` reads back what it writes.
- **ADR 0001's third question was asserted, not answered.** Each function in
  `shared/page-key.mjs` has exactly one caller, so "two stages need it" holds of
  the **shape** and not of any symbol. That is the weakest of the three answers and
  the module header says so, with the condition that would move it back.
- **`encodePage` was exported with no caller outside its own file**, which is
  speculative generality. It is private now.
- **`const only` named nothing** in the one-sided branch of `comparePage()`.
- **95, not 96.** The unanchored French pages are 27 anchored + 1 home + **95**
  unanchored. The first count in this answer said 96, because the one-liner that
  produced it read `(home)` as unanchored — the exact confusion that
  `unanchoredStore(HOME) === null` exists to prevent, made while writing the
  module that prevents it. Corrected above.

### Three things the review found that are recorded and not fixed

- **The finding has no surface.** `no-declared-alternate` is in the report JSON and
  is correct there, but no view states it: `Ledger.jsx` returns the *Niet te
  vergelijken* panel before any finding renders, so on the six one-sided French
  pages nothing can show it, and on a comparable page it sits behind the hidden-class
  filter. The record must exist before a view can read it, and the one-sided page
  surface belongs to tickets [20](20-one-sided-pages-checklist.md) and
  [56](56-an-excluded-page-says-why.md). **The code comment that called a one-sided
  page "the case most likely to need the sentence" overstated what ships.**
- **The 35.3% row is thinner evidence than the 90.2% row.** The probe measures the
  current rule only. The old-rule number was derived by looking the same 51
  candidate paths up in the seed list of commit `f640567`, and the probe records
  `candidatePaths` so the row can be re-derived:

  ```powershell
  git show f640567:data/10-store-seeds.json > old.json
  # look each candidatePath of data/probe-navigation-coverage.json up in old.json
  ```

  It is not a number the probe reproduces on its own, and the definition matters:
  the same 51 paths against the old **list** gives 18, while counting the
  `sitemap-daily` provenance instead gives 21. The row above is the first.
- **"Five test files hold literal page keys and need updating"** was not honoured as
  written, and that is correct rather than skipped: no literal needed updating,
  because no anchored key moved. Five files gained unanchored **cases** instead —
  `shared/page-key.test.mjs`, `web/src/lib/page-url.test.mjs`,
  `compare/contract.test.mjs`, `compare/compare.test.mjs` and `api/server.test.mjs`.
  The ticket's sentence assumed a format migration that ticket 53 had already made
  unnecessary.

### The move to `shared/` was a decision, not a criterion

No criterion of this ticket asks for it. ADR 0001 says the two modules move with
the change that opens `web/src/lib/reports.mjs`, and the only edit this ticket
makes to that file is the import rewrite the move itself causes — so the trigger is
circular if it is read strictly. It was taken deliberately, with the alternative
(leave both in `crawl/`, leave the back-arrow) put and refused, because the arrow
was broken and ADR 0001 has named that debt across three tickets. Recorded here so
the next reader sees a choice and not a rule.
