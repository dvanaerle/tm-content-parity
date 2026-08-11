# 72 — Astro 6, and nothing else

Type: task
Status: resolved 2026-08-11 — on Astro 6.4.8; all 823 pages byte-identical.
Blocked by: None — can start immediately.
Parent: ../map.md

**What to build:** the log builds and behaves exactly as it does today, on Astro 6.
Nothing an editor can see changes. This ticket exists so that the ticket after it,
and every product ticket after that, is not read through the noise of a major
upgrade.

The front end is on Astro 5.14. Astro 7 is the current major. The v7 upgrade guide
sends an older project through **v6 first**, so the path is 5 → 6 → 7, one major to a
ticket.

## Why the diff holds nothing else

An upgrade that carries a product change cannot be reviewed. A regression in the
build and a deliberate change of behaviour look the same in the output, and the
person who finds it a week later has no way to tell which one it is.

The build is static and deterministic, so there is a real gate available: the
generated site should be the same site. Use it.

## What Astro 6 takes away

- **Node 18 and Node 20 support.** The floor becomes **22.12.0**. This binds the
  build, the local re-check service and every crawl script, not only `web/`.
- `Astro.glob()`, the legacy content collections API, `<ViewTransitions />`,
  client-side `getImage()`, and **CommonJS config files**.
- Vite goes to 7. Zod goes to 4. Shiki goes to 4.
- `import.meta.env` is always inlined with **no type coercion**. The Supabase URL and
  the anon key are read this way.
- Endpoints with a file extension no longer resolve with a trailing slash. Images are
  never upscaled by default. Markdown heading ids keep a trailing hyphen.

## Acceptance criteria

- [x] `web/package.json` is on Astro 6, and `npm test` passes with no test changed.
- [x] The built site is compared against a build from before the upgrade, and the
      difference is recorded in the answer. A difference is allowed; an unexplained
      difference is not.
- [x] The Node floor is stated where a contributor will look for it, and the crawl
      scripts and the re-check service both still run on it.
- [x] The two `PUBLIC_` environment reads still produce strings, and a missing key
      still degrades to read-only rather than throwing.
- [x] No product behaviour changes. The dashboard, the content view, the ledger and
      the override controls are untouched in this diff.
- [x] Nothing else is in the commit.

## Resolved 2026-08-11

Astro 5.14 → **6.4.8**, with `@astrojs/react` 4.4 → **5.0.7** (the integration major
that shipped the same day as Astro 6.0.0; `@astrojs/react@6` belongs to Astro 7).
Vite 7.3.6, Zod 4.4.3, Shiki 4.4.3 came with it. 533 tests pass in 22 files, and no
test changed.

**The comparison holds.** All **823** pages are byte-identical between the Astro 5
and Astro 6 builds once three values that are nondeterministic on any version are
normalised: asset content hashes, `astro-island uid`, and the `blob:nodedata:` UUIDs
on the Markdown download links. The stylesheet is a superset by 44 utility classes
and 6 custom properties, and every one of them traces to untracked prototype
sources that appeared in `web/src/` during the session, not to the upgrade — the
tracked sources contain none of them. Tailwind was already 4.3.3 on both sides, so
the `@tailwindcss/vite` trap did not fire across the Vite major. Client JS
excluding the prototype chunk is 458,413 bytes against 459,454; `palette.js` is a
re-chunked shared React runtime, not new code. Astro 6 no longer writes the legacy
content-collection artefacts (`content-modules.mjs`, `data-store.json`,
`settings.json`) into `outDir`; this project declares no collections.

**One real regression, found and fixed.** Astro 6 bundles server modules into
`web/.astro/.prerender/chunks/`, so `../../../data/` against `import.meta.url` — a
count that was only ever true of the source file — resolved to `web/data/`. Every
route asked for reports, `reportFiles()` swallowed the ENOENT as an empty list, and
**the build produced 1 page instead of 823 while exiting 0**. `web/src/lib/repo-root.mjs`
now *finds* the root by walking up to the one ancestor holding `compare/contract.mjs`,
which is right from a source file, from a bundled chunk and from a test.

Node floor **22.12.0**, in both `engines` fields and in the README's Install
section. The re-check service serves `dist/` and answers `/api/health` 200,
`/api/recheck/nl/veranda` 404 `{"reason":"Geen bewaarde hercontrole."}`.

Both `PUBLIC_` reads inline as quoted strings, byte-identical to the Astro 5 build.
With the keys removed the build still exits 0 and every page server-renders
*"Geen verbinding met het afvinklogboek"* — read-only, not a throw.

### Left for a follow-up ticket

`reportFiles()` treats ENOENT as an empty list, which is what let a 1-page build go
green. That silence is the reason this regression was invisible, and a build that
finds no reports at all is never a real state. Not changed here: it is behaviour,
and this diff carries none.

## Traps

- **`@tailwindcss/vite` is the load-bearing plugin.** Tailwind 4 comes through the
  Vite plugin by ticket 08's decision, not through the storefront's Tailwind 3. A
  Vite major is exactly where that plugin can fail, and it can fail by producing a
  stylesheet that is merely wrong rather than by throwing.
- **Zod 4 changes schema validation.** Check whether anything in the build validates
  with it before assuming this line does not apply.
- `data/` is not in git, so a clean clone builds from nothing. The comparison build
  needs the same `data/` on both sides or it proves nothing.
