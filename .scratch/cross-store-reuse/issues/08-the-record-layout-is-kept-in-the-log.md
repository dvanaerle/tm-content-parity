# 08 — The record layout is kept in the log, by whoever reads the grid

Type: task
Status: claimed
Blocked by: 05 — the seam and ADR 0025 land first, and this moves where the fact comes from.
Parent: ../PRD.md

## What to build

More than one person keeps the fact, so the fact leaves git.

Ticket 05 put the shared-page fact in a committed file, `web/src/lib/not-shared-pages.mjs`,
compiled by hand. The file is a fine transcription surface for one maintainer with a clone. It
is a bad one for a content manager with a browser, and it turns out that is who keeps this
fact. So the entries move into the log's own database and the log's own interface, and the
file is retired.

**What does not change is that the fact is imported.** Nobody derives it and nobody asserts
it. A person reads Magento's admin grid and writes down what it says, and the only thing this
ticket changes is where they write it. The PRD's refusal — *an editor-declared link between
pages* — still holds: this is not an editor's claim about two pages, it is a transcription of
a store-view assignment, and it is **never called a link**.

**It is a fact and not a judgement**, and that is the line this ticket must not cross. A
judgement carries a note, sits in a bucket, moves a bar and is a decision somebody owns. This
carries a reason, sits in no bucket, moves no count, and a later crawl can contradict it. So
it does **not** go in the `overrides` table beside dismissals and fix claims. It gets its own
table.

## Criteria

- [ ] **ADR 0025 is amended, not replaced.** Its argument — the fact cannot be derived, the
      file states the complement, it is taken from the new site, an out-of-date reading grants
      nothing — survives whole. The sentence that placed the fact in a committed file is
      struck, dated, with this ticket's number, in the manner ADR 0023 strikes ADR 0007.
- [ ] One new table, **append-only**, with row level security on and **no UPDATE and no DELETE
      policy** — the absence of the policy is the protection, exactly as `overrides` has it.
      An entry is withdrawn by a later event and never by an edit.
- [ ] Three kinds of event and no fourth: a store page is a **separate record** (carrying its
      Magento record id and its reason), a store page is **shared** again (the merge landed),
      and the grid was **read** on a day (which is what `TAKEN_ON` was).
- [ ] A `_current` view, newest row per store page, in the manner of `overrides_current`. The
      history underneath answers *who wrote this, and when*.
- [ ] One pure derivation, tested against hand-written event lists with no Supabase project,
      that turns the events into the two values `sharedPageIndex()` already takes.
- [ ] `web/src/lib/shared-pages.mjs` keeps its interface. `notShared` and `takenOn` stop
      defaulting to a file and become **required inputs**, so no caller can read the rule
      without saying where the fact came from.
- [ ] `web/src/lib/not-shared-pages.mjs` is **deleted**. One source for one fact.
- [ ] A screen where the entries are read, added and withdrawn, reachable without a clone.
      Adding one **picks a store page out of the corpus** rather than typing a key, so the
      typo the build guard used to catch cannot be made.
- [ ] **The housekeeping survives the move.** An entry naming a store page the corpus no
      longer holds can no longer fail `npm test`, because the data is not in git. The screen
      names every such entry instead, and says the record is one to disable. Losing this is
      losing the reason suffix-stripping was refused.
- [ ] The screen says **the day the grid was last read**, and how long ago that was, because
      the age of the reading is what bounds every permission it grants.
- [ ] The `CONTEXT.md` entry for **shared page** is rewritten to say where the fact now lives,
      and gains **record layout** for the thing the table holds.
- [ ] `npm test`.

## Traps

- **Do not put it in the `overrides` table.** It is a fact, not a judgement. In that table it
  would gain a bucket, a bar and a `cleared` verb, and the first reader to see it beside a
  dismissal would read a transcription as somebody's decision.
- **Do not add UPDATE or DELETE.** Ticket 83 refused a schema editor for exactly this reason:
  the policies it needs are the ones this project deliberately does not have, and there is no
  authentication to hang them on. A withdrawal is a new event.
- **Anyone with the page can write.** There is no login — an editor is a name in
  `localStorage`, and the anon key identifies the project and not a person. This ticket
  therefore widens who can change a permission-granting fact from *whoever can push to git*
  to *whoever can open the site*. That is the cost of the thing being asked for, it is stated
  here rather than discovered, and it is the argument that belongs in the ADR amendment. It is
  **not** mitigated by an owner column, which ticket 83 also refused.
- **The date is not `created_at`.** An entry's `created_at` is when somebody typed it. The
  reading's date is when the grid was looked at, and it is what the complement is valid as of.
  Two different facts, and the bound is the second.
- **The static build never reads Supabase.** It is read in the browser, in one file, by one
  hook. `PageView` is already a `client:load` island, so both consumers can be given the
  answer — but any reading rendered at build time would be as fresh as the last build, and a
  reading that quietly went stale is worse than one that is absent.
- **Nothing is keyed on the Magento record id**, and that survives the move unchanged.
- **The complement still needs its date.** Without a reading event, nothing is shared. An
  empty table must not mean *everything is shared*.

## Where it came from

The user, 2026-08-19, on ticket 05: *"I want it in the log's web interface. Others also needs
to control it."* The PRD had ruled the interface out, and the reason it gave was about the
fact being Magento's rather than an editor's — which this design keeps. What the PRD had not
weighed is that the keeper of the fact is not the person with the clone.

Two decisions were taken with the user at the time: the table is the **only** source, so the
committed file goes rather than becoming a baseline the table overlays; and this lands
**before** tickets 06 and 07, so their consumers are written once against the final source.
