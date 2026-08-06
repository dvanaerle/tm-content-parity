# 40 — Coverage: missing pages, from the seed file alone

Type: task
Status: ready-for-agent
Blocked by: 39
Parent: ../map.md

## What to build

The first axis B findings, end to end, with **no crawl at all**.

Ticket 11 says a null cell in `data/10-store-seeds.json` makes a `missing-page`
finding, and that you derive it from the seed file with no status logic. The
seed file is on disk now: 1086 cells, of which 635 are null. So the whole path —
data, compare, contract, interface, override — can be cut today.

An editor must be able to open the Coverage view for one store, see the pages
that store does not have, mute one that is absent on purpose, reload the page,
and see the mute again. The axis B bar must move when they do.

This is the tracer bullet for the whole axis. Everything after it adds checks to
a path that already works.

## Rules from ticket 11

- Every absent page is a finding. An editor mutes the ones that are absent on
  purpose. This is deliberate: the alternative hides the one case that matters,
  which is a page that must exist and nobody saw that it does not.
- **A 404 cell is not this axis.** A null cell means nobody ever asked for the
  page in that store. A 404 cell means the store claims the page and the new site
  does not serve it. Ticket 20 owns the 404 cell.
- **If the NL reference answers 404, emit nothing** for that store page. The
  defect is on the NL page, and a finding on the DE page sends the editor to the
  wrong place.
- The axis B bar is **per store** and is **never** summed with the parity bar.
  Show absolute counts beside it, as ticket 09 requires.
- Production is not read at any point.

## Acceptance criteria

- [ ] The de store shows about 136 `missing-page` findings, and be_fr, fr and uk
      show their own counts from the seed file.
- [ ] A page whose NL cell is 404 makes no axis B finding in any store.
- [ ] The Coverage view has its own bar with absolute counts. The axis A bar on
      the dashboard does not change.
- [ ] A mute on one missing page is written to Supabase, and it is still there
      after a reload.
- [ ] The axis A dashboard shows no axis B finding.
- [ ] `npm test` is green. The presence rule has tests.

## Notes

`muteKey()` is already `store|page|class`, so per-store muting needs no change to
the contract. The store in the key is the store that does not have the page. The
page is the NL url key.

Ticket 39 decides where the axis B artifact goes on disk. Do not put it in
`data/reports/`.
