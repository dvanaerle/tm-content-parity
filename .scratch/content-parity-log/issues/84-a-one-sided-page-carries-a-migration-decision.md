# 84 — A one-sided page carries a migration decision

Type: task
Status: ready-for-agent
Blocked by: None — can start immediately.
Parent: ../map.md

**What to build:** the migration checklist `CONTEXT.md` has always promised. A page that
exists on production and answers 404 on the new site is a scope decision waiting for
somebody, and today it is a name in a list on the dashboard with nothing to press.

## The decision this ticket carries

A **migration decision** is a fifth override kind, on page scope, with a closed
vocabulary: **migrate**, **not migrated**, **replaced**, **redirected**.

The four do not behave the same way, and this is the part to get right:

- **replaced** and **redirected** are **claims of fact** about the new site. By ticket
  09's own test a claim of fact **loses** to re-check, so a page claimed as redirected
  that still answers 404 is **contradicted**, and the interface says so with the name of
  the person who claimed it.
- **not migrated** is a **judgement**: nobody will rebuild this page. It **beats**
  re-check.
- **migrate** is an intention. It closes nothing and needs no note.

Everything except *migrate* needs a note.

## Why this is cheap

The crawl already knows the status code on both sides, so *redirected* is checkable with
machinery that exists. That is the whole reason this kind can carry a claim of fact at
all — a claim nothing can contradict would be a judgement wearing a fact's clothes.

## What must stay true

- **Out of the progress bar.** `CONTEXT.md` is explicit: neither a legacy-only nor a
  new-only page can make a finding, because the comparison needs 200 on both sides. They
  are scope decisions and not editor work.
- **One append-only table.** Ticket 09 put four kinds on it and this is the fifth. No
  second table, no mutation.
- **Legacy-only and new-only are different.** Production has and the new site lost is a
  defect direction. The new site invented is usually not. The four decisions may not both
  fit both directions, and the answer says which apply where.

## Acceptance criteria

- [ ] A one-sided page on the dashboard carries a control offering the four decisions,
      and a note is mandatory on all but *migrate*.
- [ ] The four values are a closed list, refused outside it before the write.
- [ ] A page claimed *redirected* or *replaced* whose new-side status is still 404 reads
      as contradicted, with the claimer's name. The derivation is pure and tested.
- [ ] *Not migrated* survives a re-check that still finds the page missing. It is a
      judgement.
- [ ] No migration decision moves the parity bar, the denominator or any finding bucket.
      A test pins it.
- [ ] The one-sided list stops being an aside and becomes a checklist with counts:
      decided, and waiting.
- [ ] `CONTEXT.md`'s `Migration decision` entry describes what shipped. It was written
      for this ticket; check it.
- [ ] The store dashboard still shows the crawled-versus-comparable gap, and the two
      numbers still agree with each other.

## Traps

- **A 404 and a null cell are different absences.** `CONTEXT.md` says so: a null cell
  means the store does not have the page, and a page that answers 404 is not null. Only
  one of the two is a one-sided page.
- **An application page is not a one-sided page.** Ticket 19 decided that: an application
  page waits for nothing and is out of the log by definition, while a one-sided page waits
  for somebody. The excluded-pages list already holds the first kind, and this control must
  not appear on it.
- Tickets 54 and 55 change which pages are one-sided, because half the new seed pages have
  no Dutch counterpart. Expect this list to grow and do not hard-code its size anywhere.
- A `redirected` claim is about the new site's status code, which the re-check service can
  read on demand. The hosted build has no service, so the contradiction must be derived
  from the built snapshot too, not only from a live check.
