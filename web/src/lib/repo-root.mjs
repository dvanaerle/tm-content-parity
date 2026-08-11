/**
 * Where the repository root is, asked from inside the front end.
 *
 * `data/` sits at the repo root and `web/src/lib/` is three levels below it, so
 * these paths were written as `../../../data/` against `import.meta.url`. That was
 * only ever true of the source file. The Astro 6 build bundles server modules into
 * `web/.astro/.prerender/chunks/`, and from there the same three steps up land on
 * `web/data/`, which does not exist — so every route asked for reports, got an
 * empty list, and the build produced 1 page instead of 823 while exiting 0
 * (ticket 72).
 *
 * So the root is **found rather than counted**: walk up until an ancestor holds a
 * file only the root has. That answer is the same from the source tree, from a
 * bundled chunk, and from a test — and it does not move the next time the bundler
 * changes where it puts things.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * A git-tracked file that only the repo root holds. `package.json` would not do:
 * `web/` has one too, and it is the wrong answer by exactly one level.
 */
const MARKER = join('compare', 'contract.mjs');

/** @param {string} from A `file:` URL to start from. */
function findRoot(from) {
  let dir = dirname(fileURLToPath(from));
  while (!existsSync(join(dir, MARKER))) {
    const parent = dirname(dir);
    // `dirname` of the filesystem root is itself, which is where the walk ends.
    if (parent === dir) {
      throw new Error(
        `Could not find the repository root above ${fileURLToPath(from)}: no ${MARKER} in any parent.`,
      );
    }
    dir = parent;
  }
  return dir;
}

/**
 * Loud on purpose, and at import time. A root that cannot be found is not a
 * missing report — it is a broken build, and the silence is what cost ticket 72 a
 * build that looked like it worked.
 */
const ROOT = findRoot(import.meta.url);

/**
 * A trailing separator survives, so a caller that needs a `file:` directory URL
 * can still pass the result to `pathToFileURL` and then to `new URL(name, dir)`.
 *
 * @param {string} path A repo-root-relative path, `/`-separated.
 * @returns {string} An absolute filesystem path.
 */
export const fromRoot = (path) => join(ROOT, path);
