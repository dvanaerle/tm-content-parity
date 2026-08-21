import { fileURLToPath } from 'node:url';
import { getViteConfig } from 'astro/config';

/**
 * The third seam: a `.astro` component's own HTML.
 *
 * A layout and a switcher are neither a pure function nor a browser question — what we
 * want to know is what the build writes, and only Astro's own compiler can say. So this
 * project hands Vitest the Vite config Astro builds with (`getViteConfig`), which is what
 * makes `import Shell from './Shell.astro'` resolve to a component the container can
 * render.
 *
 * It is a separate file because `root` has to be `web/`: `astro` and every dependency a
 * component imports live in `web/node_modules`, and a config at the repo root resolves
 * from the repo root.
 */
const ROOT = fileURLToPath(new URL('.', import.meta.url));

export default getViteConfig(
  {
    root: ROOT,
    test: {
      name: 'astro',
      include: ['src/**/*.astro.test.mjs'],
    },
  },
  { root: ROOT },
);
