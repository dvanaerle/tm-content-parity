# 72 — Astro 6, and nothing else

Type: task
Status: ready-for-agent
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

- [ ] `web/package.json` is on Astro 6, and `npm test` passes with no test changed.
- [ ] The built site is compared against a build from before the upgrade, and the
      difference is recorded in the answer. A difference is allowed; an unexplained
      difference is not.
- [ ] The Node floor is stated where a contributor will look for it, and the crawl
      scripts and the re-check service both still run on it.
- [ ] The two `PUBLIC_` environment reads still produce strings, and a missing key
      still degrades to read-only rather than throwing.
- [ ] No product behaviour changes. The dashboard, the content view, the ledger and
      the override controls are untouched in this diff.
- [ ] Nothing else is in the commit.

## Traps

- **`@tailwindcss/vite` is the load-bearing plugin.** Tailwind 4 comes through the
  Vite plugin by ticket 08's decision, not through the storefront's Tailwind 3. A
  Vite major is exactly where that plugin can fail, and it can fail by producing a
  stylesheet that is merely wrong rather than by throwing.
- **Zod 4 changes schema validation.** Check whether anything in the build validates
  with it before assuming this line does not apply.
- `data/` is not in git, so a clean clone builds from nothing. The comparison build
  needs the same `data/` on both sides or it proves nothing.
