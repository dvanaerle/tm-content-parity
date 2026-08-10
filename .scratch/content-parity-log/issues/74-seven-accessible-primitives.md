# 74 — Seven accessible primitives, and a palette that keeps meaning

Type: task
Status: ready-for-agent
Blocked by: 73
Parent: ../map.md

**What to build:** the interface gains seven interactive primitives that behave
correctly for a keyboard and a screen reader — a dialog that traps focus and gives it
back, a menu that answers arrow keys, a tooltip that does not trap a pointer. Nothing
that carries domain meaning changes.

Every rule is in
[ADR 0007](../../../docs/adr/0007-shadcn-is-taken-for-behaviour-only.md). **Read it
first.** This ticket builds what the ADR decided and adds no decisions.

## Why it is a prefactor and goes early

Six later tickets build interface — the repeat view, the buckets, the context marker,
the annotations, the migration decision, the settings panels. Each of them needs a
popover, a select or a dialog. Written before this, each one hand-rolls its own focus
handling, and the sixth is where somebody notices that none of them agree.

It goes after 73 so the install meets Vite 8 and Tailwind 4 once instead of twice.

## What it delivers

- **Seven primitives and no more:** Dialog, Popover, Tooltip, Select, Checkbox, Tabs,
  Table. shadcn on Base UI, which is the shadcn default and is post-1.0 at
  `@base-ui/react` 1.7.0.
- A `jsconfig.json` giving the `@/*` alias the install requires. **No TypeScript.**
- `web/src/lib/palette.mjs` unchanged and still the source of truth for tone.
- `Chips.jsx` and `Diff.jsx` unchanged. They encode a class tone and a deletion, and
  no library has an opinion about a `text-missing` on production.

## Acceptance criteria

- [ ] The seven primitives are installed and one of them is in use, so the ticket is
      demoable rather than a dependency bump. The ledger's tab strip is the honest
      first user, because it already exists and its keyboard behaviour is wrong today.
- [ ] `jsconfig.json` provides `@/*` → `./src/*`. No `tsconfig.json` appears, and no
      file gains a type annotation.
- [ ] `palette.mjs` and its test are untouched. Where a shadcn variable and a palette
      token disagree, the palette wins, and the mechanism by which it wins is written
      down in one comment.
- [ ] `Chips.jsx` and `Diff.jsx` are not in the diff.
- [ ] A dialog traps focus, closes on escape, and returns focus to the control that
      opened it. Checked by hand with a keyboard only, and the check is described in
      the answer.
- [ ] The dependency count is recorded before and after. About two to about nine is
      the expected move, and the list of seven is the bound on it.
- [ ] The commands in the answer use `npx`, not `pnpm dlx`. This repo is npm.
- [ ] `npm test` passes, and the built site still works with JavaScript enabled and
      degrades no worse than today without it.

## Traps

- **The tempting next step is the wrong one.** Once the primitives are there, the
  diff renderer and the chips look like they should be rebuilt out of them. They must
  not be. That is the failure mode ADR 0007 exists to prevent.
- **Two theming systems.** shadcn arrives with its own CSS variables. Do not let a
  class tone start coming from them, or the next person has two places to look and
  the test pins only one.
- The Tailwind starter shadcn documents loads globals through a layout file. This repo
  has `Shell.astro` and `app.css` already; keep them and do not adopt the starter's
  layout.
- Every island is `client:*`. A primitive that assumes a full React app rather than an
  island is where this breaks.
