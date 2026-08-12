# 109 — A difference opens the page at the difference

Type: task
Status: ready-for-agent
Parent: ../map.md

**What to build:** an editor who clicks a difference on the dashboard arrives at that
difference, and can get back to the screen they left.

The ask was for a modal: *if you open `lighting-system/productinformatie genegeerd` it
goes to the page, but wouldn't a popup be more user-friendly, so you never get lost on a
page?* The complaint is real and the modal is the wrong tool for it, because the thing
that would have to go in the modal is the whole content view — a one-sided difference asks
*where does this text belong*, and only the rows around it in document order answer that
(`docs/adr/0006-the-content-view-is-the-spine.md`). A modal holding one difference is the
Diff tab ticket 12 retired, with a backdrop.

Being lost is two separate losses, and both are navigation:

1. **Lost inside the page.** The link named the page and nothing else, so the reader
   landed at the top of a view holding a median of 37 findings and 399 on the worst page,
   and found the difference again by eye.
2. **Lost on the way back.** Every dashboard control was session state in the island, so
   opening a page threw away the pills, the view, the search term and the open group.
   Back returned an unfiltered queue from the top, and there was no link to send a
   colleague.

- [ ] A page link from a repeat row names the finding it was clicked from.
- [ ] Following it opens the page on the tab that finding lives on, opens its row, marks
      it, and scrolls to it.
- [ ] The rows around it are untouched. Nothing is filtered and nothing is removed —
      ADR 0006 stands, and this is a landing and not a fragment.
- [ ] A finding behind *Ruis en gedempt tonen* switches the toggle on rather than landing
      on an empty screen. A `genegeerd` finding does not: a dismissal is a decision, not
      noise, and the row is already drawn.
- [ ] The reader taking the tab strip or the noise box back keeps their choice.
- [ ] The dashboard screen lives in the query string, so Back restores it and a copied
      link shows it.
- [ ] An untouched dashboard has a clean URL. Only a choice is written.
- [ ] The page header's way back returns to that screen rather than to the bare store.
- [ ] A link naming a finding this snapshot no longer has says so, and the page stays
      usable.

## Traps

- **A finding id expires with the text it names.** It is a term of `sha256(store | page |
  check | rule | prodNorm | newNorm | detail)`, so a link sent last week can name nothing.
  That is the ordinary end of a link's life, not an error.
- **The dashboard holds finding ids; the page holds row anchors.** `p12` is production's
  document position and only the page's own report knows it, so the link carries the id and
  the page translates. It is also what lets a link reach a `links` or `images` finding,
  which no row anchor covers.
- **`replaceState`, never `pushState`.** Ten pill presses must not put ten entries between
  the editor and the screen they came from.
- **The scroll waits for the log.** A decided row grows an override control when the log
  answers, so a scroll taken before that is measured against a layout about to move —
  measured on `nl/carport`, 273 pixels of it.
- **`terug` arrives off the address bar.** It is laundered through `screenFromSearch()`,
  which keeps the five keys the dashboard has and drops the rest.
- This ticket adds no new page data and no new endpoint. The dashboard already holds every
  finding id it needs.
