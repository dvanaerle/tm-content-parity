# 73 — Astro 7, and nothing else

Type: task
Status: ready-for-agent
Blocked by: 72
Parent: ../map.md

**What to build:** the same site again, on Astro 7. Ticket 72's rule holds without
change: no product behaviour in this diff, and a build compared against the build
before it.

Astro 7.2.0 is current. The Node floor does not move again — v6 raised it to 22.12.0
and v7 keeps it.

## What Astro 7 changes

- **Vite 8 and Rolldown.** This is the largest single risk in both upgrade tickets.
- **A Rust `.astro` compiler.** It no longer silently corrects invalid HTML, and it
  is JSX-strict about an unclosed tag or an unterminated attribute. The three route
  files and the two `.astro` components are what it reads.
- **`compressHTML: 'jsx'` is the new default** for whitespace.
- **A new default Markdown processor**, in Rust, replacing the remark and rehype
  pipeline.
- `src/fetch.ts` becomes a reserved file name.
- `@astrojs/db` is removed. It is not used here.
- Several experimental flags became stable defaults, so any flag still set may now be
  redundant or renamed.

## Acceptance criteria

- [ ] `web/package.json` is on Astro 7, and `npm test` passes with no test changed.
- [ ] The built site is compared against the Astro 6 build and the difference is
      recorded. **Expect a whitespace difference** from the new `compressHTML`
      default, and say so rather than waving it through.
- [ ] Every `.astro` file passes the strict compiler with no markup loosened to
      make it pass. An unclosed tag it finds is a real defect and gets fixed.
- [ ] The Markdown export is unchanged in content. It is an export beside the content
      view and a new processor must not silently change what an editor downloads.
- [ ] `output: 'static'` and `outDir: '../dist'` still hold, and the assets-only
      Cloudflare configuration still serves the result.
- [ ] The local re-check service still answers, and the hosted build still makes no
      request when nothing answers `/api/health`.
- [ ] No product behaviour changes. Nothing else is in the commit.

## Traps

- **Tailwind through the Vite plugin, again, and harder.** Rolldown is not Rollup.
  Check the produced stylesheet, not only that the build exits zero.
- **The strict compiler is a feature, not an obstacle.** If it rejects markup, the
  markup was wrong and the old compiler was hiding it. Do not reach for a
  compatibility flag first.
- The React islands are `client:load`. A bundler change is where hydration breaks
  quietly, so open a page and use the override control before calling this done.
