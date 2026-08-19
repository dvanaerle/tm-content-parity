# 01 — Lint runs on every push

**What to build:** a contributor pushes a branch and the lint rules this repo already owns
decide whether it passes. Today they decide nothing: `oxlint.config.ts` enables 15 rules and
the local plugin under `tools/oxlint/anti-slop/` implements them across 2,121 lines, while
`.github/workflows/` holds a Supabase backup and a keepalive and nothing that runs them. A
push that breaks every rule in the set goes green.

**Blocked by:** none — can start immediately.

**Status:** needs-info — **2026-08-19**. The half of this ticket that was a defect has landed;
the half that is left is a decision the maintainer has not made yet.

**Landed, outside a session.** `package.json`'s `lint` script is now
`oxlint --deny-warnings .` and exits 0 over the tracked tree. That closes the trap this ticket
named, and it closed it **at the source rather than in CI** — which matters, because the
warnings hole was never a CI problem. The linter is already run by hand before every commit,
so a bare `oxlint .` had been reporting every built-in correctness rule and returning success
on all of them. Anyone running the script now gets the answer the 15 anti-slop rules were
already getting.

**What is left is enforcement, and it is a real question rather than an oversight.** There is
no pre-commit hook in this repo — no `husky`, `lefthook`, `lint-staged` or `simple-git-hooks`
in `package.json`, nothing in `.git/hooks/`, and `core.hooksPath` unset. Linting before a
commit is a discipline that is kept, not a gate. Three answers are open:

1. **A pre-commit hook.** Closest to how the work is actually done, catches it before the
   commit rather than after the push, and covers agent commits because they run locally here.
   Bypassable with `--no-verify`, and absent from a fresh clone.
2. **The workflow this ticket describes.** The backstop a hook cannot be. Verified to land
   green, with the four caveats below.
3. **Neither.** *We lint by hand and we know it* is a legitimate answer now that the warnings
   hole is closed. If this is the answer, close the ticket `wontfix` with that reason rather
   than leaving it open as a reproach.

Until that is decided this is `needs-info` and not `ready-for-agent`: an agent picking it up
would build the workflow because the ticket says to, and the workflow may not be wanted.

> **Verified 2026-08-19, by the audit of every open `ready-for-agent` ticket.** The premise and
> the green landing both hold, measured by running the commands rather than reading them:
> `npm run lint` exits **0** with no output, `npx oxlint --deny-warnings .` exits **0**, and
> `npm run typecheck` exits **0**. `.github/workflows/` holds only `supabase-backup.yml` and
> `supabase-keepalive.yml`, so nothing enforces either today. Four things the ticket should
> carry before it is built:
>
> 1. **The type-check reaches 19 files, not the tree.** `tsconfig.json` is the only one in the
>    repo and its `include` is `["oxlint.config.ts", "tools/oxlint/**/*.ts"]`, with `allowJs`
>    and `checkJs` both defaulting to false. `--listFiles` gives exactly 19 files. **`web/`,
>    `api/`, `compare/`, `crawl/`, `shared/` and `overrides/` are type-checked by nothing**, and
>    the JSDoc `@param` / `@type` annotations throughout them are checked by nothing. `oxlint`,
>    by contrast, lints **249** files. Do not let the workflow's green tick be read as repo-wide
>    type coverage; say in the workflow or the ticket what it actually covers.
> 2. **Do not raise the oxlint categories in this ticket.** `oxlint . -D correctness -D suspicious`
>    exits **1** today with dozens of diagnostics (`unicorn(no-array-sort)`,
>    `unicorn(consistent-function-scoping)`, …). `--deny-warnings` alone stays green. Raising
>    categories is its own ticket with its own cleanup.
> 3. **Unknown rule names fail open.** `oxlint -D anti-slop/does-not-exist .` exits 0 with no
>    message. A typo in a future CI invocation silently enforces nothing — which is the exact
>    failure this ticket exists to end. Pin the invocation and test that a deliberate violation
>    fails the workflow.
> 4. **`npm test` needs a browser.** `vitest run` passes (60 files, 1,304 tests, ~26 s) but drives
>    real Chromium through Playwright, so adding it to the workflow means adding
>    `playwright install`. Decide that deliberately rather than discovering it in CI.
>
> Not covered and deliberately out of scope: the 7 `.astro` files are linted but type-checked by
> nothing, and covering them needs `@astrojs/check`, `typescript` and a `web/tsconfig.json` in
> `web/` — new dependencies, and near-certain to arrive red on code that has never been checked.

**The trap to avoid.** `oxlint` exits **0 on a warning**. Measured 2026-08-18: a file with a
`no-debugger` violation reports the diagnostic and still exits 0. The 15 anti-slop rules are
all set to `error` and would fail a run, but every built-in correctness rule fires at warning
level, so a workflow running a bare `npm run lint` would enforce fifteen rules and tick green
over all the rest. Deny warnings.

**The type-check is in the same hole.** `tsconfig.json` and a `typecheck` script arrived on
`ticket-104-search-page-scope` after this ticket was written, covering `oxlint.config.ts` and
the plugin sources under `tools/oxlint/` at `strict: true`. Nothing runs it either. The plugin
that implements the 15 rules is now type-checked by a script no workflow calls, which is the
same defect twice, so this ticket runs both checks.

**This lands green.** Measured 2026-08-18: `oxlint .` over the tracked tree emits no
diagnostic at all — not an error, not a warning — and exits 0. `tsc --noEmit` emits nothing and
exits 0. So no cleanup precedes this ticket, and the workflow does not arrive red.

- [ ] A workflow runs the repo's lint script on push and on pull request.
- [ ] The same workflow runs the type-check script.
- [ ] A warning fails the run, not only an error.
- [ ] Verified end to end: a branch carrying a deliberate warning-level violation goes red,
      and a clean branch goes green. The test branch is deleted, not merged.
- [ ] The type-assertion safety rule is among the rules the run enforces.
- [ ] No lint rule is added. A rule banning `TODO`/`FIXME`/`XXX`/`HACK` was considered and
      refused: a case-insensitive scan of every tracked file found none, so it would guard
      nothing. Revisit only once this ticket has landed and lint actually runs.
