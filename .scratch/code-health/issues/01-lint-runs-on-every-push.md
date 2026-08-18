# 01 — Lint runs on every push

**What to build:** a contributor pushes a branch and the lint rules this repo already owns
decide whether it passes. Today they decide nothing: `oxlint.config.ts` enables 15 rules and
the local plugin under `tools/oxlint/anti-slop/` implements them across 1,917 lines, while
`.github/workflows/` holds a Supabase backup and a keepalive and nothing that runs them. A
push that breaks every rule in the set goes green.

**Blocked by:** none — can start immediately.

**Status:** ready-for-agent

**The trap to avoid.** `oxlint` exits **0 on a warning**. Measured 2026-08-18: a file with a
`no-debugger` violation reports the diagnostic and still exits 0. The 15 anti-slop rules are
all set to `error` and would fail a run, but every built-in correctness rule fires at warning
level, so a workflow running a bare `npm run lint` would enforce fifteen rules and tick green
over all the rest. Deny warnings.

**This lands green.** Measured 2026-08-18: `oxlint .` over the tracked tree emits no
diagnostic at all — not an error, not a warning — and exits 0. So no cleanup precedes this
ticket, and the workflow does not arrive red.

- [ ] A workflow runs the repo's lint script on push and on pull request.
- [ ] A warning fails the run, not only an error.
- [ ] Verified end to end: a branch carrying a deliberate warning-level violation goes red,
      and a clean branch goes green. The test branch is deleted, not merged.
- [ ] The type-assertion safety rule is among the rules the run enforces.
- [ ] No lint rule is added. A rule banning `TODO`/`FIXME`/`XXX`/`HACK` was considered and
      refused: a case-insensitive scan of every tracked file found none, so it would guard
      nothing. Revisit only once this ticket has landed and lint actually runs.
