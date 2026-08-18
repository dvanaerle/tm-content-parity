# 04 — A header that only repeats the filename goes home

**What to build:** a newcomer opening a file gets a module header only where the header tells
them something the filename could not. 64 of the 192 source files open with a `/**` block, and
`docs/standards/CODING_STANDARDS.md` permits one only "where the file's job is not clear from
its name." Nobody has ever sorted them. The ones that only expand the filename into a sentence
go, and the survivors become worth reading.

**Blocked by:** `ticket-104-search-page-scope` landing. That branch has ten modified source
files, four of them among the tree's ten most comment-heavy, and a 64-file sweep cannot dodge
them cleanly — the two diffs would be unreadable together. This ticket lands on a fresh branch
off `main` afterwards.

**Status:** ready-for-agent

**The test is constraint-or-reason.** A header survives if it carries something the filename
cannot: an exhaustiveness claim, a uniqueness claim, or a reason. It goes if it says the name
again in a sentence.

- *"The words a page's priority can be, and nothing else."* — **survives.** *And nothing else*
  asserts exhaustiveness, which the filename cannot state, and which stops a sixteenth word
  being added.
- *"The one colour map (ticket 35)."* — **survives.** *The one* forbids a second map.
- A header reading *"Helpers for parsing the seed list"* over a file named for the seed list —
  **goes.**

Expect materially fewer than 64 to fall.

**Why this may sweep.** It is deletion-only: it removes comment lines and moves no code, so it
reads at a glance and cannot regress behaviour. That is exactly the case the amended *Existing
code* clause permits to touch files it is not otherwise changing. If any header's removal turns
out to need a code change — a rename to carry what the header said — that file leaves this
ticket and becomes an extraction ticket instead.

- [ ] Every file opening with a `/**` header is inventoried with its first line.
- [ ] Each header is judged by the constraint-or-reason test, and the survivors are listed here
      with the constraint each one carries.
- [ ] The redundant headers are deleted in one commit on a branch off `main`.
- [ ] No code moves. No test file appears in the diff. `vitest run` is green.
- [ ] Licence and attribution headers are untouched regardless of the bar — they are legal
      text, not commentary.
- [ ] Generated and vendored files are untouched, including the shadcn components under
      `web/src/components/ui/`.
- [ ] The before and after header counts are recorded in this file.
