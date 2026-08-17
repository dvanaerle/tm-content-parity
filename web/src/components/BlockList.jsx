import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { STORE_NAME } from '../lib/stores.mjs';

/**
 * The **language block** panel on a store dashboard: this store's pages against the
 * other store of its language (`CONTEXT.md` → *Language blocks*).
 *
 * It **decides nothing**. Every word of the reading — which side is compared, which
 * rule matched a sibling, which pages are absent and which way round — arrives as a
 * value from `blockReading()`, in the manner `explainScope()` set. This file chooses
 * markup and tone and nothing else.
 *
 * Two things it deliberately does not draw:
 *
 * - **No decision control, no class pill, no bar.** A block difference is a
 *   display-only difference: it has no id, no override and no place in a bar, and it
 *   is never called a finding. The precedent is the Meta tab, which shares the diff
 *   colours and withholds the control for the same reason.
 * - **No link.** These pages come from the seed list, and a page in the seed list can
 *   have no report and therefore no route. The *Not checked* aside states its pages
 *   as text for exactly that reason, and this follows it.
 *
 * It renders on the server and ships no JavaScript: nothing here has state, so the
 * Astro page mounts it without a `client:` directive.
 */
export default function BlockList({ reading }) {
  // A store in no block gets no panel. `de` and `uk` are each alone in their
  // language, and a feature that cannot apply to them must not appear half-working.
  if (!reading) return null;

  // Every grouping and the count arrive as values. This file re-derives none of them:
  // a second definition of *a page both stores have* is a second thing to keep true.
  const { store, sibling, census, side, shared, absentThere, absentHere, identical } = reading;

  return (
    <Card id="language-block">
      <CardHeader className="gap-2">
        {/* `CardTitle` renders a div, and the heading is what puts this panel in the
            page's outline, so the h2 stays inside it — as the three asides do. */}
        <CardTitle>
          <h2 className="font-semibold">
            Language block: {STORE_NAME[store]} and {STORE_NAME[sibling]}
          </h2>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          These two stores speak the same language, so their words can be compared. It compares{' '}
          <strong>{side}</strong> on both sides, which is the reference side: a difference here is a
          difference between the two stores, and not a defect on the new site.
        </p>
        {/* The carried-over count is the evidence and not the claim, so it is stated
            only where there is some. On `be` it is 0, and *0 pages are carried over
            for that reason* would read as an argument against the sentence it is
            support for. The caveat itself holds on every store. */}
        <p className="text-sm text-muted-foreground">
          This list is <strong>not a census</strong>. A page that no sitemap declares is absent from
          it, so read a short list as a short list and never as agreement.
          {census.carriedOver > 0 &&
            ` ${census.carriedOver} pages of this store had to be carried over for that reason.`}
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <section>
          <h3 className="font-medium">Pages both stores have ({shared.length})</h3>
          <p className="text-muted-foreground">
            Worst first, by how much of this store's text appears in {sibling}'s.{' '}
            {identical > 0 && `${identical} of them agree word for word.`}
          </p>
          {shared.length === 0 ? (
            <p className="mt-1 text-muted-foreground">
              No page of this store has a counterpart in {sibling}.
            </p>
          ) : (
            <ul className="mt-1">
              {shared.map((row) => (
                <SharedRow key={row.page} row={row} />
              ))}
            </ul>
          )}
        </section>
      </CardContent>
      <CardContent className="grid gap-4 text-sm md:grid-cols-2">
        <Absent
          title={`Absent from ${sibling} (${absentThere.length})`}
          note={`This store has these pages and ${sibling} has no counterpart.`}
          rows={absentThere}
          empty={`Each page of this store has a counterpart in ${sibling}.`}
        />
        <Absent
          title={`Absent here (${absentHere.length})`}
          note={`${sibling} has these pages and this store has no counterpart.`}
          rows={absentHere}
          empty={`This store has a counterpart for each page of ${sibling}.`}
        />
      </CardContent>
    </Card>
  );
}

/**
 * One page both stores have.
 *
 * Each kind gets its **own words**. A page whose sibling says the same words is the
 * common case — 66 of the Dutch block's 125 — so it says that it agrees, and it never
 * reads as a comparison that failed to run. *Agrees word for word* is said only where
 * the agreement is **mutual**: a short page wholly inside a long sibling is not two
 * pages that agree. A page the log could not measure says that instead of showing a
 * share of zero, which would accuse it of diverging when what happened is that nobody
 * looked.
 *
 * The share is a **ranking key** and it carries no tone: it is not a score on a
 * finding, and colouring it would make a display-only difference look like work.
 */
function SharedRow({ row }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 py-0.5">
      <code>{row.page}</code>
      {row.kind === 'identical' && (
        <span className="text-muted-foreground">
          agrees with {row.sibling?.page} word for word
        </span>
      )}
      {row.kind === 'diverged' && (
        <span className="text-muted-foreground">
          {/* **Content units** and not *blocks*. This panel is titled *Language
              block*, and one word for the two things is what the glossary exists to
              stop. */}
          {row.found} of {row.units} content units appear in the sibling —{' '}
          {Math.round(row.share * 100)}%
        </span>
      )}
      {row.kind === 'unmeasured' && (
        <span className="text-muted-foreground">
          not compared: production did not answer 200 on both sides, or one side has no content
          units
        </span>
      )}
      {/* The rule that matched, carried through rather than restated. It is data, so a
          wrong pairing can be diagnosed on the screen that drew it. It is guarded
          because the type says `Sibling | null`, and a render site is not the place to
          know which kinds happen to exclude the null. */}
      {row.sibling && (
        <span className="text-xs text-muted-foreground">matched by {row.sibling.rule}</span>
      )}
    </li>
  );
}

/**
 * One direction of absence.
 *
 * The two directions are two facts and they are drawn apart, because they are
 * different work: a page this store has and the sibling has not is a page somebody
 * over there builds, and the other way round is a page somebody here builds.
 */
function Absent({ title, note, rows, empty }) {
  return (
    <section>
      <h3 className="font-medium">{title}</h3>
      <p className="text-muted-foreground">{note}</p>
      {rows.length === 0 ? (
        <p className="mt-1 text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-1">
          {rows.map((row) => (
            <li key={row.page} className="py-0.5">
              <code>{row.page}</code>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
