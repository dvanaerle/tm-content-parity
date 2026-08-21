import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Search from "./Search.jsx";
import { listReading } from "../lib/list-reading.mjs";
import { mergeIndexes } from "../lib/search.mjs";

/**
 * A term and the class pills, composed (ticket 102).
 *
 * It is a browser test because what was wrong was a composition and not a derivation:
 * `searchStore()` narrows correctly the moment it is handed the classes, and the whole
 * defect was that nothing handed them to it and the strip that says a filter is on sat
 * behind a `!searching` guard. A node test over `search.mjs` can see neither half.
 *
 * The index arrives as a **prop** since ticket 03: it is fetched by whichever screen is
 * drawing this one — the store dashboard for a store's block, the all-stores screen for all
 * six — and `search-index.browser.test.mjs` is where the fetching itself is tested. So
 * nothing here stubs `fetch`; `sibling` is merged in exactly as `useSearchIndex()` merges it.
 */

/** One entry of the store's search index, as `indexStore()` emits it. */
const entry = (part) => ({
  id: "a",
  store: "nl",
  page: "afhalen",
  class: "copy",
  prod: "Bekijk deals >",
  new: null,
  detail: null,
  anchorHeading: "Montage",
  occurrences: 1,
  linkText: [],
  observationId: "20260811-01",
  ...part,
});

/** A term that finds three differences of three classes, for the pills to cut down. */
const index = {
  store: "nl",
  pages: 4,
  builtAt: "2026-08-11T00:00:00Z",
  findings: [
    entry({ id: "a", page: "afhalen", class: "copy" }),
    entry({
      id: "b",
      page: "garantie",
      class: "casing",
      prod: "bekijk DEALS >",
    }),
    entry({
      id: "c",
      page: "montage",
      class: "text-missing",
      prod: "Bekijk deals nu >",
    }),
  ],
};

/**
 * The page summaries the dashboard hands down, which the by-name half reads.
 *
 * The **whole** store list since ticket 104 — the comparable half and the one-sided half —
 * so every entry says which it is. A fixture of bare names would make each of these pages
 * one-sided, which is a store no build can produce.
 */
const pages = [
  {
    store: "nl",
    page: "deals-afhalen",
    comparable: true,
    skipReason: null,
    findings: [],
    summary: { byClass: { copy: 2 } },
  },
  {
    store: "nl",
    page: "deals-garantie",
    comparable: true,
    skipReason: null,
    findings: [],
    summary: { byClass: { casing: 1 } },
  },
];

/**
 * The derived state of every finding on screen, by id.
 *
 * It has to hold the **sibling's** findings too since ticket 05, and in the app it does:
 * `useStoreOverrides()` builds one index over both lists precisely so a block-spanning row
 * can say what is decided over there and a press can read its eligibility. A fixture over
 * this store's entries alone is a hook that was never widened.
 */
const byFindingOver = (...entries) =>
  new Map(
    entries
      .flat()
      .map((one) => [
        one.id,
        { id: one.id, state: "open", visibility: "work", class: one.class },
      ]),
  );

const byFinding = byFindingOver(index.findings);

/**
 * The sibling's index, which a block store's search now fetches beside its own (ticket 05).
 *
 * Empty by default, so every test written before that ticket asks the same question of the
 * same three entries. The ones that are about the block hand over their own.
 */
const siblingIndex = (findings = []) => ({
  store: "be",
  pages: findings.length,
  builtAt: "2026-08-11T00:00:00Z",
  findings,
});

/** The sibling's half of the corpus, per test. */
let sibling;

beforeEach(() => {
  sibling = siblingIndex();
});

afterEach(() => {
  document.body.innerHTML = "";
});

/**
 * Mounted and awaited. The corpus is `mergeIndexes()`' — the same merge the loader performs,
 * so a fixture cannot describe a corpus the app could not assemble, and a test that set
 * `sibling` gets `nl`'s entries and `be`'s in one index rather than two.
 */
async function mount(props = {}) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const cleared = [];

  const render = (over) => {
    const {
      store = "nl",
      byFinding: log = byFinding,
      ...rest
    } = { ...props, ...over };

    return act(async () =>
      root.render(
        createElement(Search, {
          // The screen this search is of, as one reading of it (ADR 0030): `nl` here, and
          // `null` in the cases that are about the search above the stores.
          reading: listReading({
            store,
            byFinding: log,
            searched: true,
            link: (linkStore, page) => `/${linkStore}/${page}/`,
          }),
          index: mergeIndexes([index, sibling]),
          pages,
          term: "deals",
          classes: [],
          onClearFilters: () => cleared.push(true),
          // A log that has been read and holds nothing, which is what every case about
          // the findings half wants: the notes half then draws exactly what it drew
          // before ticket 123, which is nothing.
          log: { events: [], ready: true, error: null, connected: true },
          includeClosed: false,
          onIncludeClosed: () => {},
          bulk: {
            canWrite: false,
            busy: false,
            appendMany: async () => ({
              stored: [],
              written: 0,
              total: 0,
              error: null,
            }),
            notWritingReason: "no name",
          },
          ...rest,
        }),
      ),
    );
  };

  await render({});
  return {
    cleared,
    rerender: render,
    unmount: () => act(() => root.unmount()),
  };
}

/** The filter strip, found by the one action only it carries. */
const strip = () =>
  [...document.querySelectorAll('[data-slot="alert"]')].find((element) =>
    element.textContent.includes("Clear filter"),
  );

describe("a search over the language block (ticket 05)", () => {
  it("answers a term typed on nl with a difference `be` carries too", async () => {
    // The ticket in one screen. `repeatsInStore()` has keyed on the block since ticket 03,
    // so the searched row was already *grouped* as though the sibling were there — and the
    // sibling's findings were never in the array being grouped. The row now says which
    // store each of its pages is on, which is the mark the untouched list already draws.
    sibling = siblingIndex([
      entry({ id: "x", store: "be", page: "pergola", class: "copy" }),
    ]);
    const { unmount } = await mount({
      byFinding: byFindingOver(index.findings, sibling.findings),
    });

    // Three differences on three `nl` pages before; the `copy` one now also holds a `be`
    // page, so the result is four findings on four pages in the same three rows. The
    // fourth is the one an editor no longer has to go and find on the other dashboard.
    expect(document.body.textContent).toContain("4 findings on 4 pages");
    expect(document.body.textContent).toContain("in 3 differences");

    // Opened, because a repeat lists its pages when it is opened. The row says which store
    // each page is on — the mark `Repeats` already draws on a spanning row, drawn here for
    // the first time because until now a searched row could not span.
    for (const row of document.querySelectorAll(
      '[data-slot="collapsible-trigger"]',
    )) {
      await act(() => row.click());
    }

    expect(document.body.textContent).toContain("pergola");
    expect(document.body.textContent).toContain("on be");
    expect(document.body.textContent).toContain("on nl");
    unmount();
  });

  it("arms a press over both stores off a searched row, and names them", async () => {
    // The point of the ticket rather than a side effect of it: the reason to reach a
    // difference by typing is to decide it, and a searched row that held one store's pages
    // could only ever decide half of it. The presses were widened by ticket 03 and are
    // untouched here — what changed is that a searched row can now hand them two stores.
    //
    // The sentence names the stores of the **events this press would write**, off the
    // entries it can act on, and never the row's own `stores`. That is ADR 0018's *80% is
    // not 100%* and `bulk.mjs` owns it; this is the assertion that it survives the trip
    // through the search.
    sibling = siblingIndex([
      entry({ id: "x", store: "be", page: "pergola", class: "copy" }),
    ]);
    const { unmount } = await mount({
      byFinding: byFindingOver(index.findings, sibling.findings),
      bulk: {
        canWrite: true,
        busy: false,
        appendMany: async () => ({
          stored: [],
          written: 0,
          total: 0,
          error: null,
        }),
        notWritingReason: null,
      },
    });

    for (const row of document.querySelectorAll(
      '[data-slot="collapsible-trigger"]',
    )) {
      await act(() => row.click());
    }
    // The select-all of the spanning row, which is the two-page one and so the first.
    await act(() =>
      document.querySelector('thead [data-slot="checkbox"]').click(),
    );

    const dismiss = [...document.querySelectorAll("button")].find((element) =>
      element.textContent.trim().startsWith("Dismiss on 2 pages"),
    );
    expect(dismiss).toBeDefined();
    await act(() => dismiss.click());

    expect(document.body.textContent).toContain("Written in be and nl");
    unmount();
  });

  it("scopes into the block, and links a sibling page to the sibling", async () => {
    // The scope crosses because the **corpus** does. Before this, `/pergola` on `nl` reached
    // no `nl` page and answered *check the spelling* about a page that exists and holds rows
    // in the list directly below the sentence.
    sibling = siblingIndex([
      entry({ id: "x", store: "be", page: "pergola", class: "copy" }),
    ]);
    const { unmount } = await mount({
      term: "/pergola",
      byFinding: byFindingOver(index.findings, sibling.findings),
      siblingPages: [
        {
          store: "be",
          page: "pergola",
          comparable: true,
          skipReason: null,
          findings: [],
        },
      ],
    });

    expect(document.body.textContent).not.toContain("Check the spelling");
    expect(document.body.textContent).toContain("1 page in /pergola");
    expect(document.body.textContent).toContain("on be");
    expect(document.querySelector('a[href="/be/pergola/"]')).not.toBeNull();
    unmount();
  });

  it("does not mark this store’s copy of a page key because the sibling’s answered", async () => {
    // `afhalen` is a page of both stores of a block and they are two pages. The one that
    // answered says so and the one that did not says which kind of nothing it is.
    sibling = siblingIndex([
      entry({ id: "x", store: "be", page: "afhalen", class: "copy" }),
    ]);
    const { unmount } = await mount({
      term: "/afhalen",
      byFinding: byFindingOver(index.findings, sibling.findings),
      pages: [
        {
          store: "nl",
          page: "afhalen",
          comparable: false,
          skipReason: "new site: 404",
          findings: [],
          summary: { byClass: {} },
        },
      ],
      siblingPages: [
        {
          store: "be",
          page: "afhalen",
          comparable: true,
          skipReason: null,
          findings: [],
        },
      ],
    });

    expect(document.body.textContent).toContain("2 pages in /afhalen");
    expect(document.body.textContent).toContain(
      "Only one site has this page (new site: 404)",
    );
    unmount();
  });

  it("never answers with a note written on the sibling’s page", async () => {
    // ADR 0018's line, and the half this ticket does not move. The log arriving here is
    // already narrowed to this store by `eventsOfStores()`, so the fixture is the shape the
    // hook hands over — a `be` note in it would mean the narrowing had been undone
    // upstream, which is what this test is watching for.
    sibling = siblingIndex([
      entry({ id: "x", store: "be", page: "pergola", class: "copy" }),
    ]);
    const { unmount } = await mount({
      byFinding: byFindingOver(index.findings, sibling.findings),
      log: {
        events: [
          {
            id: "1",
            store: "nl",
            page: "afhalen",
            scope: "page",
            action: "note",
            note: "The deals run until Friday.",
            at: "2026-08-12T00:00:00Z",
            editor: "ik",
          },
        ],
        ready: true,
        error: null,
        connected: true,
      },
    });

    expect(document.body.textContent).toContain("The deals run until Friday.");

    // `pergola` is in the findings half above — it is a page of the spanning row — and it
    // is nowhere in the notes half, which is what "the notes stay per store" looks like on
    // screen. The narrowing itself is `eventsOfStores()`', one layer up.
    const notes = [...document.querySelectorAll("section")].find((element) =>
      element.textContent.includes("Read from the log now"),
    );
    expect(notes.textContent).not.toContain("pergola");
    unmount();
  });
});

describe("a search under the class pills", () => {
  it("keeps the filter strip up, in the words it uses everywhere else", async () => {
    // The defect this ticket names: the strip was behind a `!searching` guard, so an
    // editor who typed got a narrowed answer with nothing on screen saying it was
    // narrowed — and a narrowed list that looks whole is read as whole.
    const { unmount } = await mount({ classes: ["copy"] });

    expect(strip().textContent).toContain("Filtered on Copy changed.");
    expect(strip().textContent).toContain("1 of 3 differences.");
    expect(strip().textContent).toContain("The counts above do not change.");
    unmount();
  });

  it("clears the filters on Clear filter, in one call the caller owns", async () => {
    // The press hands back one thing and decides nothing: which narrowings *are* filters
    // is settled above this component, and since part C of ticket 104 the answer is the
    // classes **and** the page scope. What that does to the box is the dashboard's, which
    // owns the box; from here it is one call.
    const { cleared, unmount } = await mount({ classes: ["copy"] });

    const button = [...strip().querySelectorAll("button")].find(
      (one) => one.textContent.trim() === "Clear filter",
    );
    await act(async () => button.click());

    expect(cleared).toEqual([true]);
    unmount();
  });

  it("re-answers the same term against a new selection, without a retype", async () => {
    const { rerender, unmount } = await mount({ classes: ["copy"] });
    expect(document.body.textContent).toContain("Bekijk deals >");

    await rerender({ classes: ["text-missing"] });

    expect(document.body.textContent).toContain("Bekijk deals nu >");
    expect(strip().textContent).toContain("Filtered on Text missing.");
    unmount();
  });

  it("narrows the pages named after the term as well", async () => {
    // The by-page reading of the same term answers the same filter, or the block would
    // go on offering pages with nothing of the filtered kind on them — the bypass
    // again, one section lower.
    const { rerender, unmount } = await mount();
    expect(document.body.textContent).toContain("deals-garantie");

    await rerender({ classes: ["copy"] });

    expect(document.body.textContent).toContain("deals-afhalen");
    expect(document.body.textContent).not.toContain("deals-garantie");
    unmount();
  });
});

/**
 * Ticket 103. A scope may hold several pages, and a result over several has to say which
 * ones — otherwise an editor reads a merged list as one page's work. This is a browser
 * case because the header is what says it: `searchStore()` answers the scope, and only
 * the screen can be asked what it told anybody.
 */
describe("a search narrowed to a page scope", () => {
  /** The store's pages, one of which is clean and in no result above. */
  const compared = (name, byClass) => ({
    store: "nl",
    page: name,
    comparable: true,
    skipReason: null,
    findings: [],
    summary: { byClass },
  });

  const scoped = [
    compared("afhalen", { copy: 1 }),
    compared("afhalen-pdf", {}),
    compared("garantie", { casing: 1 }),
  ];

  it("names the pages the scope matched, over the one list", async () => {
    const { unmount } = await mount({ term: "/afhalen", pages: scoped });

    expect(document.body.textContent).toContain("2 pages in /afhalen");
    expect(document.body.textContent).toContain("afhalen-pdf");
    unmount();
  });

  it("keeps a page with no open work reachable by its name", async () => {
    // The capability the by-name block carries under an ordinary term: a clean page is
    // in no finding result, and it is still the page somebody is looking for.
    const { unmount } = await mount({ term: "/afhalen", pages: scoped });

    const link = [...document.querySelectorAll("a")].find(
      (one) => one.textContent.trim() === "afhalen-pdf",
    );
    expect(link.getAttribute("href")).toBe("/nl/afhalen-pdf/");
    unmount();
  });

  it("draws the pages once, and not twice under two headings", async () => {
    // The by-name block is what the header replaces. Both would list the same pages
    // under two sentences that disagree about which question was asked.
    const { unmount } = await mount({ term: "/afhalen", pages: scoped });

    expect(document.body.textContent).not.toContain("have this name");
    unmount();
  });

  it("names the pages but promises no list when the scope found nothing", async () => {
    // A scope can reach pages and find no open difference on them — a clean family is the
    // ordinary case. The pages are still worth naming; the sentence about *the differences
    // below* is not, because there are none and the line under it says so.
    const { unmount } = await mount({ term: "/afhalen-pdf", pages: scoped });

    expect(document.body.textContent).toContain("1 page in /afhalen-pdf");
    expect(document.body.textContent).toContain(
      "No difference with these words.",
    );
    expect(document.body.textContent).not.toContain("The differences below");
    unmount();
  });

  it("says nothing about a scope when there is none", async () => {
    const { unmount } = await mount({ term: "deals" });

    expect(document.body.textContent).not.toContain("pages in /");
    expect(document.body.textContent).toContain("have this name");
    unmount();
  });
});

/**
 * Ticket 104 part A. Four different nothings used to be one blank. `search.mjs` decides
 * which of them a scope found; these are the sentences it is drawn as, and they are
 * browser cases for the reason the ones above are — what an editor is *told* is a
 * composition, and a node test over the classifier cannot see a word of it.
 */
describe("what a scoped search says when it finds nothing", () => {
  /** The store's whole page list — the comparable half and the one-sided half. */
  const store = [
    {
      store: "nl",
      page: "afhalen",
      comparable: true,
      skipReason: null,
      findings: [{ id: "a", class: "copy" }],
      summary: { byClass: { copy: 1 } },
    },
    {
      store: "nl",
      page: "afhalen-pdf",
      comparable: true,
      skipReason: null,
      findings: [],
      summary: { byClass: {} },
    },
    {
      store: "nl",
      page: "kerstactie",
      comparable: false,
      skipReason: "new site answered 404",
      findings: [],
      summary: { byClass: {} },
    },
  ];

  it("says a scope that reaches no page at all is a typo, not an empty page", async () => {
    const { unmount } = await mount({ term: "/dwonloads", pages: store });

    expect(document.body.textContent).toContain(
      "No page the search reaches has dwonloads in its key",
    );
    unmount();
  });

  it("says a one-sided page exists, why it was not compared, and where it is listed", async () => {
    // Search staying silent here contradicts the one-sided pages aside on the same screen.
    // The reason is the aside's own `skipReason`, carried through and not restated.
    const { unmount } = await mount({ term: "/kerst", pages: store });

    expect(document.body.textContent).toContain("Only one site has this page");
    expect(document.body.textContent).toContain("new site answered 404");

    const aside = [...document.querySelectorAll("a")].find(
      (one) => one.getAttribute("href") === "#one-sided-pages",
    );
    expect(aside.textContent).toContain("One-sided pages");
    unmount();
  });

  it("says a compared page with no difference on it is clean", async () => {
    // The answer an editor most wants, and the one that was indistinguishable from the
    // typo above until this ticket.
    const { unmount } = await mount({ term: "/afhalen-pdf", pages: store });

    expect(document.body.textContent).toContain(
      "Compared, and no difference on it.",
    );
    unmount();
  });

  it("says a second term found nothing on a page that does hold differences", async () => {
    const { unmount } = await mount({ term: "/afhalen zzzqx", pages: store });

    expect(document.body.textContent).toContain(
      "none of them holds these words",
    );
    unmount();
  });

  it("gives one answer per page, so mixed kinds do not collapse to one verdict", async () => {
    // `/afhalen` reaches two pages; one of them answers and one is clean, and the screen
    // has to say both. A single sentence over the family is false about most of it.
    const { unmount } = await mount({ term: "/afhalen", pages: store });

    expect(document.body.textContent).toContain("2 pages in /afhalen");
    expect(document.body.textContent).toContain(
      "Compared, and no difference on it.",
    );
    // The page the rows below are about says nothing here: the rows are what it has to say.
    expect(document.body.textContent).not.toContain(
      "none of them holds these words",
    );
    unmount();
  });
});

/**
 * Ticket 123. The two halves arrive from two places, and the notes half used to draw its
 * absence as an answer. These are browser cases because the question is what is *on
 * screen* in a state nobody can reach by hand — `search.mjs` names the three states and
 * this is where the block that reads them lives.
 */
/**
 * Ticket 141. A search result is ordered by what is **left** in each difference, and in the
 * default search that is the order it always had.
 *
 * `searchStore()` drops any finding that is not active unless *Include closed* is on, so a
 * fully-closed difference is already absent from a result and a partly-closed one arrives
 * smaller. Every surviving row is therefore open on every page, the open count equals the
 * page count, and the new rule agrees with the old one row for row. That is the case worth
 * pinning rather than working around: the two places the reorder bites are the unsearched
 * repeat list and a search with *Include closed* on.
 */
describe("the order of a search result (ticket 141)", () => {
  /** Three differences of three, two and one page, all of them found by *deals*. */
  const threeSizes = {
    store: "nl",
    pages: 6,
    builtAt: "2026-08-11T00:00:00Z",
    findings: [
      entry({ id: "p1", page: "afhalen" }),
      entry({ id: "p2", page: "garantie" }),
      entry({ id: "p3", page: "montage" }),
      entry({ id: "q1", page: "levering", prod: "Bekijk deals vandaag >" }),
      entry({ id: "q2", page: "retour", prod: "Bekijk deals vandaag >" }),
      entry({ id: "r1", page: "contact", prod: "Bekijk deals nu >" }),
    ],
  };

  const log = (states) =>
    new Map(
      threeSizes.findings.map((one) => [
        one.id,
        {
          id: one.id,
          state: states[one.id] ?? "open",
          visibility: "work",
          class: one.class,
        },
      ]),
    );

  /** Every difference row's words, top-down. A row is the trigger with its own tick beside it. */
  const rowOrder = () =>
    // A difference's own row, by the name the markup gives it (ticket 03). It was the tick
    // beside the trigger until the class label moved in between the two.
    [...document.querySelectorAll('[data-row="difference"]')].map((trigger) =>
      trigger.textContent.trim(),
    );

  /** How big each drawn row says it is, which is the order ticket 81 put them in. */
  const sizes = () => rowOrder().map((row) => row.match(/on (\d+) pages/)[1]);

  it("is the order it always was in the searched default, because every row there is open", async () => {
    const { unmount } = await mount({
      index: threeSizes,
      byFinding: log({ p1: "dismissed" }),
    });

    // Largest first, which is ticket 81's order and no coincidence: `searchStore()` drops
    // what is not active, so the dismissed page is not in the result at all and every row
    // that survived is open on every page it states. The open count **is** the page count
    // here, so the new rule cannot disagree with the old one.
    expect(sizes()).toEqual(["2", "2", "1"]);
    expect(rowOrder().every((row) => row.includes("0 of"))).toBe(true);
    unmount();
  });

  it("sinks a settled difference under the smaller open ones when closed rows are included", async () => {
    const { unmount } = await mount({
      index: threeSizes,
      includeClosed: true,
      byFinding: log({ p1: "dismissed", p2: "dismissed", p3: "dismissed" }),
    });

    // Two open, one open, and the three-page difference with nothing left of it below both.
    expect(sizes()).toEqual(["2", "1", "3"]);
    expect(rowOrder().at(-1)).toContain("3 of 3 closed");
    unmount();
  });
});

/**
 * Ticket 144, and a **regression asserting no change**.
 *
 * That ticket takes a fully decided difference off the *Repeats* list and hides the settled
 * pages inside one that stays. This surface already did the first half and does not want the
 * second: `searchStore()` has dropped an inactive finding **before it groups** since ticket
 * 09, so a fully closed difference is already absent from a result, and a result asked for
 * with *Include closed* on is the editor asking for exactly the rows the other list hides.
 *
 * The value of this block is that a reader sees the surface was considered and deliberately
 * left alone, rather than finding a third rule here and having to work out whether it was
 * meant.
 */
describe("closed work in a search result (ticket 144)", () => {
  const settled = {
    store: "nl",
    pages: 4,
    builtAt: "2026-08-11T00:00:00Z",
    findings: [
      entry({ id: "p1", page: "afhalen" }),
      entry({ id: "p2", page: "garantie" }),
      entry({ id: "r1", page: "contact", prod: "Bekijk deals nu >" }),
    ],
  };

  const log = (states) =>
    new Map(
      settled.findings.map((one) => [
        one.id,
        {
          id: one.id,
          state: states[one.id] ?? "open",
          visibility: "work",
          class: one.class,
        },
      ]),
    );

  const rows = () =>
    [...document.querySelectorAll('[data-row="difference"]')].map((trigger) =>
      trigger.textContent.trim(),
    );

  it("drops it before it groups, which is where it has always been dropped", async () => {
    const { unmount } = await mount({
      index: settled,
      byFinding: log({ p1: "dismissed", p2: "dismissed" }),
    });

    // One row left, and not two with one of them hidden afterwards. The gap ticket 144 closes
    // is on the third surface.
    expect(rows()).toHaveLength(1);
    unmount();
  });

  it("keeps it whole when the editor asked for closed work, pages and all", async () => {
    const { unmount } = await mount({
      index: settled,
      includeClosed: true,
      byFinding: log({ p1: "dismissed", p2: "dismissed" }),
    });

    const decided = rows().find((row) => row.includes("on 2 pages"));
    // Present, and still counting both of its pages: *Include closed* here is the question
    // the editor asked, so nothing narrows the answer to it.
    expect(decided).toContain("2 of 2 closed");
    unmount();
  });
});

describe("the notes half, before the log has answered", () => {
  it("says it is still reading, rather than drawing no notes at all", async () => {
    const { unmount } = await mount({
      log: { events: null, ready: false, connected: true },
    });

    expect(document.body.textContent).toContain("Notes in the log");
    // The banner's own sentence about the same state, and not a third phrasing of it
    // (ADR 0014, and the review of this ticket): one log, one vocabulary.
    expect(document.body.textContent).toContain("The override log is loading…");
    unmount();
  });

  it("says a log that could not be read was not read, and why", async () => {
    const { unmount } = await mount({
      log: {
        events: null,
        ready: false,
        error: "TypeError: Failed to fetch",
        connected: true,
      },
    });

    expect(document.body.textContent).toContain(
      "The override log was not read",
    );
    expect(document.body.textContent).toContain("TypeError: Failed to fetch");
    unmount();
  });

  it("does not promise that a failed read will fill itself in", async () => {
    // The review's first finding. The block used to say *it fills in by itself once the
    // log answers*, and nothing re-reads the log: `useStoreOverrides()` reads once per
    // store list and never retries, so on screen that moment does not come. What is
    // offered is the thing that does work.
    const { unmount } = await mount({
      log: {
        events: null,
        ready: false,
        error: "TypeError: Failed to fetch",
        connected: true,
      },
    });

    expect(document.body.textContent).toContain(
      "Reload the page to try again.",
    );
    expect(document.body.textContent).not.toContain("fills in by itself");
    unmount();
  });

  it("recovers when the log arrives, with no reload", async () => {
    // Green when it was written, and kept as the pin for it: the state is derived from
    // the read on every call and never latched, so nothing here remembers having
    // failed. A retry, a second request or a reload would all be a heavier answer to a
    // question the shape already answers.
    const note = {
      createdAt: "2026-08-12T09:00:00Z",
      editor: "Dennis",
      scope: "finding",
      action: "dismissed",
      store: "nl",
      page: "afhalen",
      findingId: "a",
      note: "deals blijft zo staan",
    };
    const { rerender, unmount } = await mount({
      log: {
        events: null,
        ready: false,
        error: "TypeError: Failed to fetch",
        connected: true,
      },
    });
    expect(document.body.textContent).toContain(
      "The override log was not read",
    );

    await rerender({
      log: { events: [note], ready: true, error: null, connected: true },
    });

    expect(document.body.textContent).toContain("1 note with these words");
    expect(document.body.textContent).toContain("deals blijft zo staan");
    expect(document.body.textContent).not.toContain(
      "The override log was not read",
    );
    unmount();
  });

  it("keeps answering about the findings while the log is still reading", async () => {
    // Also green when it was written. It is here because the findings half's two
    // branches are early returns over the *whole* component, and the obvious way to
    // give the notes half the same two would have been two more of those — which would
    // make a slow log hold up the half that is already in memory.
    const { unmount } = await mount({
      log: { events: null, ready: false, connected: true },
    });

    expect(document.body.textContent).toContain("Bekijk deals >");
    expect(document.body.textContent).toContain("3 findings on 3 pages");
    unmount();
  });

  it("draws no notes block at all for a log that was read and holds none", async () => {
    // The one silence that is true, and the ticket's own limit: this changes what is
    // said when none match, not which ones match. A read log with no matching note says
    // nothing, exactly as it did before.
    const { unmount } = await mount();

    expect(document.body.textContent).not.toContain("Notes in the log");
    expect(document.body.textContent).not.toContain("with these words");
    unmount();
  });
});

/**
 * Ticket 104 part B. A scope narrows both halves of the screen, and these are browser cases
 * because the question is whether the *screen* narrows: `search.mjs` decides what the notes
 * half holds, and this is the block that has to say which page it is holding them about.
 */
describe("the notes half, under a page scope", () => {
  /** A dismissal note, in the shape the log appends them. */
  const note = (part) => ({
    createdAt: "2026-08-12T09:00:00Z",
    editor: "Dennis",
    scope: "finding",
    action: "dismissed",
    store: "nl",
    page: "deals-afhalen",
    findingId: "a",
    note: "deals blijft zo staan",
    ...part,
  });

  /** A log that was read, holding these events. */
  const held = (...events) => ({
    events,
    ready: true,
    error: null,
    connected: true,
  });

  it("narrows to the notes on the pages the scope reached, and says which scope", async () => {
    const { unmount } = await mount({
      term: "/afhalen",
      log: held(
        note({}),
        note({
          page: "deals-garantie",
          findingId: "b",
          note: "garantie blijft zo staan",
        }),
      ),
    });

    expect(document.body.textContent).toContain("1 note on /afhalen");
    expect(document.body.textContent).toContain("deals blijft zo staan");
    expect(document.body.textContent).not.toContain("garantie blijft zo staan");
    unmount();
  });

  it("keeps the two halves two blocks, each with its own freshness", async () => {
    // The scope narrows both and merges neither. The line that says which moment this half
    // is read from is the whole reason it is a second block.
    const { unmount } = await mount({ term: "/afhalen", log: held(note({})) });

    expect(document.body.textContent).toContain(
      "Read from the log now, not from the snapshot.",
    );
    expect(document.body.textContent).toContain("From the snapshot of");
    unmount();
  });

  it("says a note is the answer about a one-sided page, beside the reason there are none", async () => {
    // The case part A can only explain and this part can answer. A one-sided page has no
    // findings and can never have any, so a note is the only thing search can truthfully
    // say about it — and before this the block was not narrowed to it.
    const { unmount } = await mount({
      term: "/brochure",
      pages: [
        {
          store: "nl",
          page: "deals-brochure",
          comparable: false,
          skipReason: "only nl answered",
          findings: [],
          summary: { byClass: {} },
        },
      ],
      log: held(
        note({
          scope: "page",
          action: "noted",
          findingId: null,
          page: "deals-brochure",
          note: "BE-versie volgt",
        }),
      ),
    });

    expect(document.body.textContent).toContain(
      "Only one site has this page (only nl answered)",
    );
    expect(document.body.textContent).toContain("1 note on /brochure");
    expect(document.body.textContent).toContain("BE-versie volgt");
    // Ticket 83's distinction, and the one place the two kinds of note first sit together.
    expect(document.body.textContent).toContain("page note");
    unmount();
  });

  it("draws a page note and a dismissal note apart when the scope puts them together", async () => {
    // Ticket 83's trap, in the situation that first creates it: a scope is what puts one
    // page's page note and one page's dismissal note in one short list. Drawn identically,
    // *BE-versie volgt* under a page name reads as somebody's reason for accepting a
    // difference. `NoteKind` is 83's and untouched here; this is the case that pins it
    // against the screen this part built.
    const { unmount } = await mount({
      term: "/afhalen",
      log: held(
        note({}),
        note({
          scope: "page",
          action: "noted",
          findingId: null,
          note: "BE-versie volgt",
          createdAt: "2026-08-13T09:00:00Z",
        }),
      ),
    });

    expect(document.body.textContent).toContain("2 notes on /afhalen");
    // The newer first, and each said in its own word — a note **on this page**, and a
    // **dismissal** — in the one attribution shape: the action, the editor and the day.
    expect(document.body.textContent).toContain(
      "page note · Dennis · 13 Aug 2026",
    );
    expect(document.body.textContent).toContain(
      "dismissed · Dennis · 12 Aug 2026",
    );
    // The page note is quoted the way it is drawn everywhere else, and never labelled as a
    // reason for anything.
    expect(document.body.textContent).toContain("“BE-versie volgt”");
    unmount();
  });

  it("says the words as well when a second term was typed", async () => {
    const { unmount } = await mount({
      term: "/afhalen deals",
      log: held(note({}), note({ findingId: "b", note: "wacht op copy" })),
    });

    expect(document.body.textContent).toContain(
      "1 note with these words on /afhalen",
    );
    expect(document.body.textContent).not.toContain("wacht op copy");
    unmount();
  });

  it("never says none about a log it has not read, scope or no scope", async () => {
    // Ticket 123's rule survives the narrowing: a scoped block that drew nothing here
    // would read as *no notes about this page*, which is the lie one narrowing deeper.
    const { unmount } = await mount({
      term: "/afhalen",
      log: { events: null, ready: false, connected: true },
    });

    expect(document.body.textContent).toContain("Notes in the log");
    expect(document.body.textContent).toContain("The override log is loading…");
    unmount();
  });
});

/**
 * Ticket 104 part C. A page scope is a narrowing of what is on screen that moves no bar, no
 * denominator and no count, which is `CONTEXT.md`'s definition of a **filter** word for
 * word — so it says so in the filter strip, beside the classes and in one sentence with
 * them. A strip that enumerates the small narrowings and omits the largest one is worse
 * than no strip.
 *
 * The strip is this component's, so the sentence is asked for here. The chip and what
 * clearing does to the search box belong to the dashboard, which owns the box, and are
 * asked for there.
 */
describe("the filter strip over a scoped search", () => {
  it("names the scope while it is on, with no pill pressed at all", async () => {
    // The strip used to need a pill to exist. A scope alone narrows the screen more than
    // any pill does, so it raises the strip on its own.
    const { unmount } = await mount({ term: "/afhalen", classes: [] });

    expect(strip().textContent).toContain("Filtered on page /afhalen.");
    expect(strip().textContent).toContain("The counts above do not change.");
    unmount();
  });

  it("names the scope and the classes in one sentence, under one clear", async () => {
    // Two strips would be two denominators over one list, which is the pair
    // `ClassFilterBanner` exists to prevent — the same reason ticket 83's priorities
    // joined the sentence rather than starting a second one.
    const { unmount } = await mount({
      term: "/garantie deals",
      classes: ["casing"],
    });

    expect(strip().textContent).toContain(
      "Filtered on page /garantie and Case or punctuation.",
    );
    expect([
      ...strip().parentElement.querySelectorAll('[data-slot="alert"]'),
    ]).toHaveLength(1);
    unmount();
  });

  it("draws no strip at all when neither is on", async () => {
    const { unmount } = await mount({ term: "deals", classes: [] });

    expect(strip()).toBe(undefined);
    unmount();
  });

  it("composes a scope with a class filter — the result is what both agree on", async () => {
    // Ticket 102 established this for the term. A scope is the same kind of thing one
    // narrowing wider, so the two compose rather than one replacing the other.
    const { rerender, unmount } = await mount({
      term: "/garantie deals",
      classes: ["casing"],
    });

    expect(document.body.textContent).toContain("bekijk DEALS >");
    expect(strip().textContent).toContain("1 of 1 differences.");

    // The one class the scoped page has nothing of. The scope still holds — the strip
    // still names it — and the intersection is empty rather than the scope being dropped.
    await rerender({ classes: ["copy"] });

    expect(document.body.textContent).not.toContain("bekijk DEALS >");
    expect(document.body.textContent).toContain(
      "No difference with these words.",
    );
    expect(strip().textContent).toContain(
      "Filtered on page /garantie and Copy changed.",
    );
    expect(strip().textContent).toContain("0 of 1 differences.");
    unmount();
  });

  it("moves no count with the scope: the denominator is the scope, not the store", async () => {
    // The strip's denominator has always been *what the term found before the pills cut
    // it*, and a scope is part of what the term found. The counts at the top of the
    // dashboard are the ones that must not move, and the strip says so in its last line.
    const { unmount } = await mount({ term: "/garantie", classes: ["casing"] });

    expect(strip().textContent).toContain("1 of 1 differences.");
    expect(strip().textContent).toContain("The counts above do not change.");
    unmount();
  });
});
