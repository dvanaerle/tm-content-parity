import { useEffect, useState } from 'react';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from './ui/breadcrumb.jsx';
import { CHROME } from '../lib/palette.mjs';
import { backInSearch, storeHref } from '../lib/page-url.mjs';
import { screenFromSearch, searchFromScreen } from '../lib/screen-url.mjs';

/**
 * Where this page sits, and the way back out of it (ticket 109).
 *
 * The header carried one link — *← alle pagina's van nl* — and it pointed at the bare
 * store, so it threw away the pills, the view and the search term. That is the same loss
 * Back suffered before the screen went into the URL, and it is the second half of *never
 * get lost on a page*: knowing where you are, and getting back to where you were.
 *
 * The trail is the routes this log actually has: the store picker at `/`, the store's
 * dashboard at `/<store>/`, and this page. The middle rung carries `terug`, so it returns
 * to the **screen** that was left rather than to an unfiltered queue.
 *
 * The `<h1>` below it still names the page, and this repeats it on purpose: the heading is
 * what the document is called and the last rung is what says *you are here*. It is the one
 * place in this interface where saying a thing twice is the convention rather than a smell,
 * and the component marks the difference — `BreadcrumbPage` is not a link.
 *
 * **It renders the bare trail first and upgrades it.** Astro renders this to static HTML at
 * build time, where there is no `location` to read, so the store rung arrives as
 * `/<store>/` and the query is added on hydration. A reader with no JavaScript therefore
 * keeps exactly the link that was here before, and nobody gets a hydration mismatch.
 *
 * The `terug` value came off the address bar, so it is **laundered** on the way through:
 * `screenFromSearch()` keeps the five keys the dashboard has and drops everything else, and
 * `searchFromScreen()` writes it back out. Nothing a stranger puts in a URL reaches the
 * href.
 */
export default function PageBreadcrumb({ store, page }) {
  const [back, setBack] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    setBack(searchFromScreen(screenFromSearch(backInSearch(window.location.search))) || null);
  }, []);

  return (
    <Breadcrumb aria-label="Kruimelpad" className="mb-1">
      <BreadcrumbList className="text-xs">
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className={CHROME.link}>Alle winkels</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href={storeHref(store, back)} className={CHROME.link}>{store}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{page}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
