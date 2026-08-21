# 10 — An editor links two store pages, and the log keeps it

Type: task
Status: wontfix — **refused 2026-08-21**, and the refusal is now measured rather than priced.
Parked 2026-08-19 by the audit of every open `ready-for-agent` ticket; the re-open trigger
below fired and reported against it. See *## The decision* under the criteria.
**Re-open trigger: spent.** Ticket [11](../11-measure-the-flattening-and-the-pairing.md)
resolved 2026-08-21 and read it directly — *refuse 10*. A new trigger would have to be a new
argument, not this one again.
The design is good and it is the second design: the first made this an import from Magento,
the user objected that the feature should be controllable in our interface tool, and the
reversal is argued properly — with no record id and no reading date the imported claim carried
no evidence, and ADR 0025's own central argument is that no crawl can see record sharing. None
of that is in doubt. What was in doubt was the price, and ticket 11 priced it.
**The consequence is discharged.** This ticket's criteria included removing everything ticket
08 built, and that removal was parked with it, leaving 08's code in the tree with no ticket
owning it. It was removed on its own terms on 2026-08-21 in commit `b7557d0` — twelve files,
1,938 lines, 41 tests, nothing migrated because nothing was ever held. ADR 0025 was **kept and
not superseded**, so a rebuilder inherits its argument instead of making it again.
Blocked by: None — can start immediately.
Parent: ../../PRD.md
Supersedes: 05, 08

## What to build

The person who knows says so, with a press.

Two store pages of one language block can be one page. Nothing the log crawls can see that —
two pages that are one record and two pages that are separate records holding identical words
give the same response and behave oppositely the moment somebody fixes one. So somebody has to
say it, and the only people who can are the ones with Magento's admin open.

After this ticket an editor presses **Link page** on `nl/bedrijfsinformatie` and `be` is linked
to it. One more press unlinks. A bulk press links every paired page of a block at once, because
the common case is that they are one page and it must not cost a hundred presses.

**A link is a judgement, not a transcription.** It says *somebody decided these two store pages
are one page*. It is informed by Magento's store-view tree and it does not claim to copy it —
which is why it carries no record id, no reading and no date, and why it can never be out of
date with a configuration it never copied. This is the whole of the revision that superseded
tickets 05 and 08; a new ADR argues it and supersedes ADR 0025.

Nothing consumes the rule yet. Tickets 07 and 06 are its first two readers.

## Criteria

- [ ] A **link** is an editor's declaration that two store pages of one language block are one
      page. It is **affirmative**: nothing is linked until somebody pressed, and an empty table
      means nothing is linked.
- [ ] A link reaches **inside a language block only** — `{nl, be}` and `{be_fr, fr}`. It is a
      property of the **pair**, so one event links both sides and either store may press it.
- [ ] A store page with **no sibling page** offers no link. The control is **absent**, not
      present and refusing, in the manner the sibling tab is absent rather than empty.
- [ ] It is **symmetric**. No base store, no canonical side, no direction.
- [ ] `page_links` is **append-only** on the same terms as `overrides`: RLS on, an insert policy
      and a select policy, **no UPDATE policy and no DELETE policy**. Two kinds and no third —
      `linked` and `unlinked` — and the newest event per pair wins.
- [ ] A **reason** is **optional** when linking and **expected** when unlinking. Linking is the
      common case and needs no defence; unlinking says *I know something you do not*.
- [ ] Every link carries **who pressed it and when**, and the interface shows both.
- [ ] A **list screen** works through the pairs of a block, so the transcription pass can be done
      with Magento's admin open beside it. It carries the **bulk press**.
- [ ] The **same control on the store page**, so an exception discovered while reading is one
      press away.
- [ ] **Link candidates**: a derived reading of the pairs that are **not** linked and whose two
      stores already render the same words, from the agreement share asked both ways round. It
      carries the caution that identical words are **not evidence** of one record, and it offers
      no press that links from the list.
- [ ] A link naming a store page the corpus no longer holds is a **stray**: named by the screen,
      granting nothing, and never a reason to stop answering.
- [ ] The rule is a **pure function** over the corpus and the links, at the layer
      `shared-pages.mjs` occupied. The derivation from events is a **pure function** with the
      port passed in, at the layer `record-layout.mjs` occupied.
- [ ] **A new ADR**, superseding ADR 0025 and restating what survives of it: sharing cannot be
      derived from a crawl, and identical text is never evidence in either direction.
- [ ] `CONTEXT.md` gains **linked page** and **retires shared page** and **record layout**. The
      word *link* is un-refused for this relation, and `links` stays a Check.
- [ ] Everything ticket 08 built for the complement is **removed**: the `record_layout` table and
      its SQL, the reading kind, the date guard, the record id, the complement's polarity, and
      the screen's copy about it. It was never applied to a project, so there is no data.
- [ ] `npm test`, `npm run lint`, and the build.

## Traps

- **Do not import anything.** There is no grid to read, no date to record and no staleness to
  guard against. Every one of those existed only because the old model claimed to copy Magento.
  If a `taken_on`, a `reading` or a record id appears, the old design has come back.
- **Do not state the complement.** Nothing is linked until pressed. The bulk press is what makes
  that affordable; it is not a licence to make *linked* the default.
- **Identical words are never evidence.** They are what two separate records look like on the day
  before they diverge. This is why link candidates suggest where to look and never what is true,
  and why the travelling claim in ticket 06 keeps the repeat as a second condition.
- **`links` is a Check and this is not one.** A Check is a family of comparisons with finding ids
  in it. A link between two store pages has no id, no bucket and no bar. The two words live
  together because they name different things and the interface never lets them touch.
- **Do not put it in the `overrides` table.** It decides nothing about a finding. In that table it
  would gain a bucket, a bar and a `cleared` verb, and it would read as a judgement about content.
- **Do not name the table after Magento.** It holds no copy of Magento. `record_layout` was named
  for a thing this no longer claims to be.
- **Nothing is keyed on anything Magento holds.** Every id in this repo is content-addressed and
  expires on purpose.
- **Anyone who can open the site can write here**, as with `overrides`. That widens who can grant
  a permission, and the new ADR must record it rather than let it be discovered.
- **A stray must not white-screen the log.** Live data edited by several people will carry stale
  rows, and a stray grants nothing anyway.

## The decision

**Refused, 2026-08-21, on ticket 11's measurement.** Three numbers settled it.

- **The pairing is already derived.** The pairing this table would transcribe covers 126 of
  `be`'s 131 pages and 120 of `fr`'s 123 with no table, no RLS policy and no screen. The
  transcription pass is **246 pairs**, not the handful the ticket assumed.
- **The bulk press has nothing sound to key on.** Only **113 of 246** measured pairs render
  identical words. A bulk press taken off identity would transcribe a judgement it cannot
  verify — which is this ticket's own trap, turned against its own affordance.
- **Nothing downstream is paying the cost.** Ticket 06, this table's payload, is an editor
  clicking *fixed* once instead of twice. That click has never been made twice in the
  recorded history of the log: 0 of 7 measurable opportunities, on a second store carrying 8
  fix claims to `nl`'s 185.

And the permission cost stands as written here: anyone who can open the site could write to
this table, and this table is what authorises a claim to travel. Refusing it means no write on
a permission is widened beyond whoever can push to git.

**What survives.** Ticket 07's flattening half — 111 units on 42 page pairs, 109 of them in
work classes, including a warranty scope and a delivery-area promise that production varied per
country and the new site made uniform — is the defect worth finding, and ticket 11 shows it
needs **no link, no table and no editor input**. That is where this feature's value went.

## Where it came from

The second grilling session, 2026-08-19, on the user's objection that the feature had become an
import when what was asked for was a link — *"I wanted this feature to be controllable in our
interface tool, not in the code itself."*

The first session had turned the link into an import on the grounds that the fact is Magento's
and not an editor's. What broke that argument: with no record id and no reading date the claim
carried **no evidence**, and ADR 0025's own central argument is that **no crawl can see record
sharing**. Nothing in the system could ever contradict it. Calling it an imported fact described
something that was, operationally, an editor's decision — so it should be one, owned and
withdrawable, and then it needs no date, no id and no guard.

Ticket 08 was right that the surface was wrong and kept the polarity the file's shape had forced.
Ticket 05's *Alternatives* in ADR 0025 already named both halves of this design and rejected them.
