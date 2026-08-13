# 113 — The displays stop reading the mute, and the toggle gets its name back

Type: build
Status: ready-for-agent
Blocked by: 112
Parent: ../map.md

**What to build:** nothing on screen consults the muted state any more. The progress bar
counts open against closed with nothing outside it, the noise toggle is *Ruis tonen* and
does one job, and the dashboard index stops carrying a field whose only reader was the
mute key.

This is the middle of an outside-in removal: 112 took the writers, this takes the readers,
114 takes the thing they were reading. Every step is green because nothing is deleted until
it has no callers.

## What changes

- **The progress bar.** The *N gedempt (buiten de teller)* line goes, and the denominator
  stops subtracting. `CONTEXT.md` is already level with this: a difference in a shown class
  is either open work or work an editor closed, and whether something is work at all is a
  property of the **class** and never of a place on a page.
- **The noise toggle** becomes *Ruis tonen*: the classes whose visibility is `diagnostic`,
  and nothing else. Every predicate that kept a row when `noise || (shown && state !==
  'muted')` loses its second clause. A landing no longer turns the toggle on because its
  target is muted.
- **The search** stops excluding `muted` from *still work*.
- **The dashboard index** drops `anchorHeading` from its finding entries. `reports.mjs`
  states its own reason for carrying it — *"because ticket 88 put it in the mute key.
  Without it a section mute would read on the dashboard as a mute of the whole class"* — and
  that failure cannot occur once mutes do not exist.

## Acceptance criteria

- [ ] The bar draws open, needs-attention and closed, and no fourth number. The denominator
      is the shown findings on the snapshot, full stop.
- [ ] The toggle reads *Ruis tonen* and shows only `diagnostic` classes. Its independence
      from the tab — each borrowed by a landing and released on its own — still holds, and
      its browser test still passes.
- [ ] `anchorHeading` is gone from the index payload, and the index gets smaller. Record
      the gzipped size of `nl`'s index before and after; the comment that justified the
      field also documented the payload as the costly one.
- [ ] The anchor heading is **untouched as a locator**. A finding on a page still says
      *onder "…"* with its jump links, from the page's own report. If that line changes,
      this ticket is wrong.
- [ ] No screen changes what it draws for any finding that is not muted — and after 111
      there are none.
- [ ] The derivation still produces `muted`. It has no readers after this and that is the
      point; 114 deletes it.

## Traps

- **`state !== 'muted'` is not the same as `shown`.** The predicates are two conditions and
  only one of them goes. A row that is hidden by class must stay hidden by class.
- **The landing's toggle-borrowing has its own browser test**, and it uses a muted target to
  prove the toggle and the tab are released separately. That test needs a new subject —
  a `diagnostic` class — not deletion. Losing it would lose the rule.
- **Two size numbers, one direction.** The index shrinks here and `nl`'s open count rose in
  111. Do not report them together; ticket 86's reasoning applies — one number hiding two
  movements is how a measurement stops meaning anything.
