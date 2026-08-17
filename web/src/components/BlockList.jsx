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

  const { store, sibling, rows, census, side } = reading;
  const absentThere = rows.filter((row) => row.kind === 'sibling-absent');
  const absentHere = rows.filter((row) => row.kind === 'only-in-sibling');

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
