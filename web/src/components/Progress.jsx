/**
 * The page bar, the review control and the two banners that keep the log honest.
 *
 * Ticket 09: **always show absolute counts**, because the denominator moves. A
 * genuinely corrected difference leaves the snapshot altogether, so the same page
 * can have fewer open findings and the same percentage. The number an editor can
 * trust is the count, and the bar is the glance.
 */

import { BANNER, CHROME, FILL, PILL } from '../lib/palette.mjs';

export function PageBar({ bar, ready }) {
  const percent = bar.denominator === 0 ? 100 : Math.round((bar.closed / bar.denominator) * 100);

  return (
    <div className="w-full">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
        <strong className="text-sm tabular-nums">{ready ? `${percent}%` : '—'}</strong>
        {/*
          Every count below the denominator is derived from the override events,
          so none of them may be shown before the log answers. `0 van 41
          afgehandeld` is the empty-read lie in another shape. The denominator is
          the snapshot's own and is true either way.
        */}
        <span className="tabular-nums text-slate-600">
          {ready ? `${bar.closed} van ${bar.denominator} afgehandeld` : `${bar.denominator} verschillen`}
        </span>
        {ready && <span className="tabular-nums text-slate-500">{bar.open} open</span>}
        {ready && bar.contradicted > 0 && (
          <span className="tabular-nums text-attention-ink">{bar.contradicted} nog niet opgelost</span>
        )}
        {ready && bar.muted > 0 && (
          // A mute leaves the denominator, so it is reported beside the bar and
          // never inside it: "this is not a defect here" is not work done.
          <span className="tabular-nums text-slate-400">{bar.muted} gedempt (buiten de teller)</span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-slate-200">
        {/* Blue, not green. Work done is status, and ticket 35 keeps green for
            "the new site added this" and nothing else. */}
        <div
          className={`h-full ${FILL.info} transition-[width]`}
          style={{ width: ready ? `${percent}%` : '0%' }}
        />
      </div>
    </div>
  );
}

/**
 * A page review records that a human looked at everything here, **including what
 * the tool cannot see**. It goes stale when the finding set changes and never
 * expires on its own — so the words are *gewijzigd sinds controle*, never
 * *moet gecontroleerd worden*. The log does not manufacture work.
 */
export function ReviewControl({ review, findingSetHash, append, canWrite }) {
  if (review) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className={`rounded px-2 py-1 ${review.fresh ? PILL.info : PILL.attention}`}>
          {review.fresh ? 'gecontroleerd' : 'gewijzigd sinds controle'} · {review.editor}
        </span>
        {canWrite && (
          <button
            type="button"
            onClick={() => append({ scope: 'page', action: 'cleared' })}
            className="text-slate-500 hover:underline"
          >
            intrekken
          </button>
        )}
        {canWrite && !review.fresh && (
          <button
            type="button"
            onClick={() => append({ scope: 'page', action: 'reviewed', findingSetHash })}
            className={`hover:underline ${CHROME.link}`}
          >
            opnieuw markeren
          </button>
        )}
      </div>
    );
  }

  if (!canWrite) return null;
  return (
    <button
      type="button"
      onClick={() => append({ scope: 'page', action: 'reviewed', findingSetHash })}
      className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
    >
      Pagina gecontroleerd
    </button>
  );
}

/** No name, no writing. Attribution must cost nothing, so it is one field. */
export function EditorPrompt({ editor, save }) {
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(submit) => {
        submit.preventDefault();
        const value = new FormData(submit.currentTarget).get('editor');
        if (String(value).trim()) save(String(value));
      }}
    >
      <input
        name="editor"
        defaultValue={editor}
        placeholder="Je naam"
        className="w-36 rounded border border-slate-300 px-2 py-1 text-xs"
      />
      <button type="submit" className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">
        {editor ? 'Naam wijzigen' : 'Opslaan'}
      </button>
    </form>
  );
}

/**
 * The banner that stops the worst failure this tool has.
 *
 * Ticket 13: a paused or unreachable project does not show an error — the page is
 * static and still loads, and only the override log stops working. An editor
 * would read an empty list as "nobody has done anything" and a dropped click as
 * "saved". Both destroy trust in the log, and both look exactly like a bug in the
 * comparison rules. So the failure is loud, and the page says so.
 */
export function LogBanner({ connected, notConnectedReason, ready, error }) {
  if (error) {
    // Amber, not red. An unreachable log is a status, however bad it is, and
    // ticket 35 keeps red for "production had this and the new site lost it".
    return (
      <Banner tone="severe">
        <strong>Het afvinklogboek reageert niet.</strong> De pagina staat op alleen-lezen,
        zodat je geen wijzigingen kwijtraakt die je denkt te hebben opgeslagen.{' '}
        {/*
          A failed read keeps the last good one, so the two cases say different
          things. Telling an editor "no overrides" while their own dismissals are
          on screen is the same lie as showing an empty list.
        */}
        {ready
          ? 'Je ziet de laatst gelezen stand; die kan verouderd zijn.'
          : 'Het logboek is niet gelezen, dus je ziet de momentopname zonder overrides.'}{' '}
        ({error})
      </Banner>
    );
  }
  if (!connected) {
    return (
      <Banner tone="attention">
        <strong>Geen verbinding met het afvinklogboek.</strong> {notConnectedReason} Afvinken,
        negeren en dempen zijn uitgeschakeld; de rest van het logboek werkt gewoon.
      </Banner>
    );
  }
  if (!ready) return <Banner tone="neutral">Het afvinklogboek wordt geladen…</Banner>;
  return null;
}

const Banner = ({ tone, children }) => (
  <p className={`rounded border px-3 py-2 text-sm ${BANNER[tone]}`}>{children}</p>
);
