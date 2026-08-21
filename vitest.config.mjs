import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * What `web/jsconfig.json` calls `@/*`. Vitest runs from the repo root, so it does not read
 * that file, and a component reached from a test still has to resolve the alias shadcn
 * writes into every primitive it ships.
 */
const WEB_SRC = fileURLToPath(new URL('./web/src', import.meta.url));

/**
 * What neither project ever collects.
 *
 * `.claude/worktrees/` is the one that is not obvious. A lane is a git worktree, and
 * `claude --worktree` puts it *inside* this checkout — so every test file in the repo
 * exists again under each open lane, and a recursive include from the repo root finds all
 * of them. Ignoring the directory in git does not help: an include glob does not read
 * `.gitignore`. Excluding it here is what keeps a run counting each test once.
 */
const IGNORED = ['**/node_modules/**', 'dist/**', '**/.claude/**'];

/**
 * Three projects, because this repo has three kinds of seam.
 *
 * Nearly everything here is a pure function and runs in Node: the compare rules, the
 * override derivation, the view filters. That is the `node` project, and it is the
 * suite that existed before this file did.
 *
 * A few seams are the browser itself — an island mirroring its state into the address
 * bar, a jump that has to land on a row. They cannot be tested in Node without
 * pretending to be a browser, and a pretend browser is the wrong thing to test a
 * `history` or a `scrollIntoView` against: what we want to know is whether the real
 * one does it. So those run in a real Chromium under `vitest --browser`, and they are
 * named `*.browser.test.mjs` so the projects never collect each other's files.
 *
 * The third is a `.astro` component's own HTML — a layout, the store switcher. Only
 * Astro's compiler can render one, so that project brings Astro's Vite config with it and
 * lives in `web/vitest.astro.config.mjs`, where `web/node_modules` resolves. Its files are
 * named `*.astro.test.mjs`.
 *
 * `npm test` runs all three.
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          include: ['**/*.test.mjs'],
          exclude: [...IGNORED, '**/*.browser.test.mjs', '**/*.astro.test.mjs'],
        },
      },
      {
        // A component test reaches `.jsx`, so this project needs what Astro's React
        // integration gives the build: the automatic JSX runtime, and the `@/` alias every
        // shadcn primitive imports `cn` through. There is no `@vitejs/plugin-react` here on
        // purpose — esbuild's own transform is all a test needs, and a second React plugin
        // is a second place for the JSX settings to drift from the build's.
        esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
        resolve: { alias: { '@': WEB_SRC } },
        test: {
          name: 'browser',
          include: ['**/*.browser.test.mjs'],
          exclude: IGNORED,
          setupFiles: ['./vitest.browser-setup.mjs'],
          browser: {
            enabled: true,
            provider: 'playwright',
            headless: true,
            // One browser. These tests ask whether `history.replaceState` and
            // `scrollIntoView` do what the code assumes, which is not a question that
            // differs between engines — and a matrix here would cost every run.
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      './web/vitest.astro.config.mjs',
    ],
  },
});
