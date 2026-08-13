# 70 — Shared regions are found by content hash

**What to build:** the log knows which regions are shared across many pages, so a
block that is authored once is not counted many times, and a **new** shared block
arrives as one item to judge instead of thousands of rows.

Two problems have the same cause.

**Ticket 64's anchor is campaign-specific.** It keys on the option ids of this
promotion. The next campaign changes them, the entry stops matching, and 2,698
findings return at once. That direction is safe, but it reads on the dashboard as a
collapse in every store when nothing regressed.

**A shared block inflates the count.** A finding id is page-scoped, so one authored
block that differs is one finding on each page that loads it. The roll-up sums over
findings and never over pages, so it counts the same edit many times, and one fix
closes many findings that nobody can see are the same thing.

The durable property is the one the user named: the banner is a **shared element**,
loaded on every page it is put on. That is true of the next campaign as well, and of
every store, and it needs no knowledge of what the block says.

Blocked by: 64, 67.

Status: ready-for-agent

**Origin:** the grilling of 2026-08-07 on the content unit, questions 22 and 24. It
is the deferred half of both.

- [ ] A region carries a hash of its normalised content, and the corpus records on
      how many pages of a store each hash occurs.
- [ ] The excluded-region list can name a shared block by hash instead of by a
      campaign anchor. Ticket 64's entry moves over, and the campaign anchor is
      retired.
- [ ] A hash that appears on many pages and is not in the list is surfaced **once**,
      for a person to classify as legacy-only, non-editorial, or real work.
- [ ] Measure first, and put the number in this ticket: how many differing units are
      shared across pages. If the share is small, the identity half of this ticket is
      not worth building and only the exclusion half ships.
- [ ] If the measurement shows most findings are shared-block findings, stop and say
      so. That reorders the roadmap, and it is not this ticket's decision to make
      quietly.
- [ ] Needs the new environment. It answered HTTP 500 on all six hosts while this was
      written.
