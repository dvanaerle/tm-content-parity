# Triage — `tm-content-parity Production UX Blueprint`

Type: record
Status: closed
Written: 2026-08-18
Decided in: a grilling session against the blueprint, with `CONTEXT.md` and the source as the
authority.

This directory holds a **record and no PRD**, and that is the honest outcome. The blueprint is the
second outside document read against this interface. The first became `.scratch/ui-polish/` and
ADR 0019. This one did not become a stream: the structural half is largely refused or already
ticketed, and what survived is five ordinary issues. The record exists because ADR 0019's session
fixed the rule that **a refusal is written down with its reason, so the next audit gets the same
answer.**

## How it was read

The rule from the first audit was applied unchanged:

- **`CONTEXT.md` wins by default.** A section that argues with the glossary is refused and the
  refusal is recorded here. The glossary is permitted to lose by exception; this time it lost
  nothing.
- **Every claim about current behaviour was verified against source** before it became a decision.
  The first audit invented part of its evidence. This one is written in *should* rather than in
  *is*, which is a safer failure mode — but it does describe as new several things that are
  shipped, and it describes as shipped nothing that is not.
- **Nothing is deleted; a fact may be relocated.** A fact behind a disclosure or at the head of its
  own list is not silently absent. A fact removed is.

## What came out of it

Seven refusals, five new pieces of work, and a large middle that was already shipped or already
ticketed. The blueprint's most valuable single idea — a comparison-scope exclusion that **stopped
matching** should shout — turned out to be `ready-for-agent` in ticket 85 already.

### The seven refusals

1. **The arrow between the two sides.** The blueprint joins production and the new site with an
   arrow in sections 1, 21, 45 and 46, reserving labelled sides for "long content" only. The arrow
   asserts that one text *became* the other, which is the exact claim `CONTEXT.md` refuses when it
   retires the word *Changed*. Refused in every form, including as a caret or the word *to*. This
   was already decided: ui-polish 02 owns the contract and ui-polish 04 applies it to the repeat
   row, which is one of only two places the arrow survives in source.
2. **The word *Undo*** (sections 8 and 46). `CONTEXT.md` names *Undo* as the exact word the
   **Clear** rule refuses. The *affordance* is not new — ticket 110 delivered bulk clearing in
   August — so the blueprint is asking for placement, not capability. The word is refused; the
   placement is a small issue.
3. **A per-check counter strip at the top of the workspace** (section 1). This is the census the
   ui-polish problem statement opens by describing, and it would be a second reading of the class
   pills sitting directly below it — two controls telling one story. ui-polish moves counters *off*
   the top; this document puts new ones on it.
4. **One page-level context disclosure** (section 15, *Show all blocks* and *Hide completed
   context*). It replaces the per-run **context marker** built by tickets 79 and 48 with an
   all-or-nothing toggle over a page that can hold 168 rows, and it collapses the distinction
   between *3 agreeing blocks* and *4 blocks with no open work* that `CONTEXT.md` spends real
   effort defending. The *addition* it seemed to offer — one control that opens every marker at
   once — **is already shipped**: the content view draws a *Show agreeing blocks* checkbox that does
   exactly that, built by ticket 79, whose own source comment says "what replaces it opens every
   marker at once". So this section leaves nothing behind.
5. **A *Needs attention* / *All pages* segmentation of the Pages view** (section 9). The sort
   already answers it, and a default tab that hides clean pages makes a page vanish the moment its
   last finding closes — which is the stated reason `CONTEXT.md` forbids Closed being a filter on
   the finding tables. If the complaint is that a clean page is hard to *reach*, search already
   answers that per page, with five distinguished kinds of nothing.
6. **_View diagnostics_ inside the page menu** (section 33). It is a **view toggle**, not an
   action: it carries a count and an on/off state, and a menu can show neither. It stays beside the
   tabs, renamed *Show diagnostics* by ui-polish 01.
7. **The blueprint's vocabulary.** Each is the glossary's word said slightly differently, which is
   the drift `CONTEXT.md` exists to stop. *Not compared* (section 26) is not a preference but a
   rule violation — the glossary says in terms *do not say "not compared"* for this population, and
   the word is **Not checked**. Also refused: *Not fetched* (the word is *Not crawled*), *Outside
   comparison intentionally* (*Outside the log on purpose*), *Recheck* (*Re-check*), `Under:
   Garantie` (shipped: `under "Garantie"`), *No differences found* (shipped: *Nothing differs on
   this page. Every block agrees with production.*), and *Show 8 completed* against the **Closed**
   bucket.

One phrase was adopted, and it needed no exception: **_Open work_** as a heading over the
non-attention queue. `CONTEXT.md` already uses it — a marker draws *N blocks with no open work* —
so this is the repo's own phrase used as a heading for the first time. The one care it needs is
that it must not read as a fourth bucket beside Open, Needs attention and Closed. It is a heading
over a list, not a name for a group of findings.

### The eighth refusal, reversed

**The overflow menu (section 33) was refused and then adopted**, on the user's decision and for a
better reason than the refusal had. ui-polish story 27 collapses review state, priority and note
onto one quiet line — but the priority toggles and the note input are rendered *inline in the page
header* today, and story 27 gives them nowhere to go. Without the menu, story 27 is a deletion.
With it, it is a relocation, which is the rule this repo holds itself to. ADR 0007 already settles
the cost: *a new primitive is a small decision*, and the list has grown from seven files to
twenty-one without an ADR each time. `dialog.jsx` and `popover.jsx` were both installed and used
nowhere.

### The four survivors

| what | home |
|---|---|
| The `⋯` menu, *Edit page details* in a dialog, *Copy link* | `ui-polish/07`, new spec |
| The row-level `⋯`, holding *View history* and *Copy link* | amend `ui-polish/05` |
| The store-with-no-open-work empty state | amend `ui-polish/04` |
| Re-check outcomes — *Updated* / *No changes found* / failed | ticket 136, new |
| Coming back to where you were (scroll position) | new issue, `content-parity-log` |

An eighth refusal was found while the menu was being specified: **_Export Markdown_ as a menu
item**. The export exists — two downloads in the content view's toolbar — and it exports the two
sides of the spine, so moving it to the page header would separate a control from the thing it acts
on. That is the same reason *View diagnostics* was refused from the same menu, and it leaves the
blueprint's four-item menu with two items it actually contributes.

### One thing the session did not triage

Section 37 offers a **retry** control after a partial bulk failure. The *sentence* is shipped and
ui-polish 05 owns its wording, but a retry control is new and was never put to the user. It is
noted here rather than decided, because an append-only table makes a retry a second write and that
needs an argument.

## Section by section

| section | subject | verdict |
|---|---|---|
| 1 | Store workspace | Repeats/Pages toggle **shipped**; counter strip **refused (3)** |
| 2 | Exceptional work | ordering is `ui-polish/04`; *Open work* heading **adopted** |
| 3 | Active filters | already `ui-polish/02` — the strip becomes neutral |
| 4 | Repeat, collapsed | **refused (1)**; two labelled sides already `ui-polish/02` and `04` |
| 5 | Repeat, expanded | **shipped** — page table, tri-state select-all |
| 6 | Repeat with many pages | **shipped** — budget of 100, *Show the next 100* |
| 7 | Bulk selection | already `ui-polish/05` — the bar names its object, not its content |
| 8 | Bulk dismissal | already `ui-polish/05`; *Undo* **refused (2)** |
| 9 | Pages workspace | sort **shipped**; segmentation **refused (5)** |
| 10 | Page organization | **shipped** — the annotate bar |
| 11 | Page detail | quiet line and menu **adopted** as `ui-polish/07`; *Recheck* **refused (7)** |
| 12 | Finding details | *First seen* to ticket 77, behind *View history*; *Copy link* **adopted** |
| 13 | Finding history | **adopted** into `ui-polish/05`'s row menu; the note itself is ticket 78 |
| 14 | Finding after reality changes | **shipped** (contradicted); wording **refused (7)** |
| 15 | Full page context | **refused (4)**; expand-all already **shipped** — *Show agreeing blocks* |
| 16 | Finished page | both states **shipped**; the tick **refused** |
| 17 | Links | **shipped** |
| 18 | Images | **shipped** |
| 19 | Meta | ticket 98 |
| 20 | Meta unavailable | ticket 98 — it has no empty state today |
| 21 | Search | premise void — nothing is being removed; the placeholder is `ui-polish/01` |
| 22 | Page search | **shipped** — ticket 104 |
| 23 | Search completed work | **shipped** — *Include closed* |
| 24 | Search, clean page | **shipped** — `explainScope()` |
| 25 | Search, no matching content | **shipped** |
| 26 | Search, one-sided page | **shipped**; *Not compared* **refused (7)** |
| 27 | Search unavailable | **shipped** |
| 28 | Comparison scope | panels are ticket 85; the **route is refused** |
| 29 | Comparison scope exception | **already ticket 85** — the best idea here, and it is written |
| 30 | Shared content | the repeat is **shipped**, and it is the whole answer — content-hash regions (70) **parked `wontfix` 2026-08-18**: `repeatsInStore()` already keys on the content |
| 31 | Regrouped | tickets 116, 119, 120, 121 — decided and unbuilt |
| 32 | Page note | `ui-polish/07` — it moves into the dialog the menu opens |
| 33 | Page actions | menu **adopted** as `ui-polish/07`; *View diagnostics* and *Export Markdown* **refused** |
| 34 | Recheck | **adopted** — new issue, defined off the ticket-118 hash |
| 35 | Read-only state | **shipped** |
| 36 | Save failure | **shipped** |
| 37 | Partial bulk failure | sentence **shipped**; the retry control **untriaged**, see above |
| 38 | Store with no work | **adopted** into `ui-polish/04`, without the tick |
| 39–41 | Mobile | ticket 87; the stacking rule is `ui-polish/02`'s container query |
| 42 | Long page navigation | ticket 121 |
| 43 | Deep link | **shipped** — tickets 109 and 34, including two stale-link banners |
| 44 | Back navigation | **adopted** — new issue; filters restore today, position does not |
| 45 | Visual hierarchy | already `ui-polish/02` and `05` |
| 46 | Product rhythm | *Undo* **refused (2)**; the rest is `ui-polish/05`, and no toast |

## What the glossary and the ADRs gained

- `CONTEXT.md`: the two sides are never joined by an arrow; **Re-check** gains its outcomes and a
  testable definition of *no changes found*; **Landing** gains its return half.
- **ADR 0019** gains a fourth amber — an exclusion that stopped matching — which is an amendment
  and not a new decision, in the shape 0019 fixed for a fifth badge.
- **ADR 0007** gains `dropdown-menu` as a recorded consequence.

## A note on the document itself

It is fluent about this domain and it is written in *should*. That makes it useful for aesthetics
and hierarchy, where a picture is honest, and unreliable about scope, where it repeatedly proposes
as new what is already built — the two-view toggle, the rendering budget, the five kinds of empty
search answer, the deep link and its failure banners. A future audit gets the same treatment: every
"Before" verified against source before it becomes a decision.
