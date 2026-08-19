# 01 — Measure finding churn

Type: research
Status: ready-for-agent
Blocked by: None — can start immediately.
Parent: ../PRD.md

## What to build

A number, and the page list behind it: how many findings live only a day or two before their
id expires.

A finding id is content-addressed and expires on purpose when either side's text changes. If a
store-scoped mechanism — a custom variable, a rotating promotion — sits inside the content
boundary, its findings expire on every crawl, every dismissal on them detaches, and the same
question is asked again forever. That is the same complaint this whole effort answers, arriving
from a direction neither original idea anticipated.

Nothing is built. The run log already holds `firstSeen`, `lastSeen`, `seen` and `retiredAt` per
finding id, so this is a probe over data on disk. No crawl, no new source, no production code.

Run this first. A corpus full of one-day findings would change what the rest of this effort is
worth.

## Criteria

- [ ] The distribution of finding lifespans over the corpus, as a table: how many ids lived one
      run, two runs, and so on.
- [ ] The pages that produce the most short-lived findings, ranked, with their store.
- [ ] The classes those findings carry, so that a rule misfire can be told from a moving page.
- [ ] How many **dismissals** in the override log are keyed on an id that no longer exists, and
      how many of those expired within two runs of being written. That is the cost, stated in
      the only unit an editor feels.
- [ ] The numbers written into this ticket under an `## Answer` heading, with the date and the
      corpus size, so that a later reader knows what was true when.
- [ ] A one-paragraph reading: does churn outrank decision repetition, or not.

## Traps

- **This is a probe, not a feature.** Probes in this repo are explicitly throwaway. Do not add a
  screen, a class or a column.
- **A retired id is not a decision.** *No longer seen* is a fact and nobody made it. Do not
  report expiry as if an editor closed something.
- **Do not try to re-attach.** The run log holds no relation between two ids and must not gain
  one. If two ids look like the same defect with edited text, that is a hunch and it stays out
  of the answer.
- **Read the whole corpus, not one store.** Churn on `nl` says nothing about `de`.

## Where it came from

A grilling session, 2026-08-19. The custom-variable objection — that a shared record can render
different words per store, and those words can change daily — raised the question of whether
those units are churning findings today. Nobody has measured it.
