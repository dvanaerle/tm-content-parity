# shadcn on Base UI is taken for behaviour only, and the palette keeps meaning

This repo has two runtime dependencies. A shadcn install on Base UI adds about seven
packages, and it arrives with its own theme of CSS variables.

We decided to take **seven primitives and nothing else** — Dialog, Popover, Tooltip,
Select, Checkbox, Tabs, Table — and to keep `web/src/lib/palette.mjs` as the source of
truth for anything that carries meaning.

## Why behaviour, and not appearance

What the repo lacks is accessible interactive behaviour: a focus trap, a keyboard
menu, a roving tabindex, a dismiss on escape that also restores focus. That work is
subtle, it is easy to get wrong without noticing, and it is worth a dependency.

What the repo does not lack is a way to say what a finding class means. `Chips.jsx`
and `Diff.jsx` encode domain signal — a class tone, a deletion and an insertion — and
no library has an opinion about a `text-missing` on production. A test pins the token
maps. Rebuilding those two out of library parts would lose the test and buy nothing.

Two theming systems in one application is how an interface stops being coherent. So
shadcn's variables are the surface and the palette decides the tone. Where the two
disagree, the palette wins, because the palette is the one that knows what the colour
is for.

## The facts this rests on

- Base UI is the **default** primitive set for shadcn since the July 2026 changelog,
  and it is post-1.0: `@base-ui/react` 1.7.0. Radix stays supported behind
  `-b radix`, so a retreat is available.
- Astro is a documented shadcn install target, and Tailwind v4 and React 19 are both
  supported. The repo is on Astro 5.14, Tailwind 4.1 and React 19.2.
- The install needs the `@/*` alias. The repo has no TypeScript, and this decision
  does not introduce it, so a `jsconfig.json` provides the alias.
- The repo is npm. Every shadcn command in the documentation is written with
  `pnpm dlx`, and here it is `npx`.

## Considered options

- **Full adoption, shadcn's theme as the source of truth.** Rejected. It would
  rewrite the components that carry domain meaning, and it puts the definition of a
  class tone in a place that knows nothing about classes.
- **No library.** Rejected. Focus management is the one part of this interface that
  is hard to write correctly and invisible when it is wrong.
- **Radix instead of Base UI.** Not rejected on merit. Base UI is simply the default
  now, and the migration path between them is documented in both directions.

## Consequences

- The dependency count goes from two to about nine. That is a real change of posture
  and it is deliberate, bounded by the list of seven primitives. A new primitive is a
  small decision; a new theming system is a decision here.
- Custom UI stays custom for the content-parity concepts: the finding diff, the page
  group, the repeat, the history note and the bulk selection. No library has them, and
  the failure mode of adopting shadcn is rebuilding the diff out of parts that are
  there.

## Scope

The upgrade to Astro 7 is a separate decision and a separate pair of tickets, and it
goes first. The documented path from 5.14 is 5 → 6 → 7, one major at a time, with a
Node floor of 22.12.0. No product change belongs in either diff.
