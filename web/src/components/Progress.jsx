/**
 * The page bar, the review control and the two banners that keep the log honest.
 *
 * Ticket 09: **always show absolute counts**, because the denominator moves. A
 * genuinely corrected difference leaves the snapshot altogether, so the same page
 * can have fewer open findings and the same percentage. The number an editor can
 * trust is the count, and the bar is the glance.
 */

import { BANNER, CHROME, FILL, INK, PILL } from '../lib/palette.mjs';
import { Alert, AlertDescription } from './ui/alert.jsx';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { cn } from '../lib/utils.js';

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
        <span className="tabular-nums text-muted-foreground">
          {ready ? `${bar.closed} van ${bar.denominator} afgehandeld` : `${bar.denominator} verschillen`}
        </span>
        {ready && <span className="tabular-nums text-muted-foreground">{bar.open} open</span>}
        {ready && bar.contradicted > 0 && (
          <span className={cn('tabular-nums', INK.attention)}>{bar.contradicted} nog niet opgelost</span>
        )}
      </div>
      {/* The bar stays hand-rolled. shadcn's `Progress` builds its own track and
          indicator inside itself and exposes a `className` for the root only, so
          `FILL.info` has nowhere to land — and the fill colour is the whole reason
          this bar is here rather than a plain number. */}
      <div className="h-2 w-full overflow-hidden rounded bg-muted">
        {/* Blue, not green. Work done is status, and ticket 35 keeps green for
            "the new site added this" and nothing else. */}
        <div
          className={cn('h-full transition-[width]', FILL.secondary)}
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
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge className={review.fresh ? PILL.info : PILL.attention}>
          {review.fresh ? 'gecontroleerd' : 'gewijzigd sinds controle'} · {review.editor}
        </Badge>
        {canWrite && (
          <Button
            variant="link"
            size="xs"
            onClick={() => append({ scope: 'page', action: 'cleared' })}
            className="px-0 text-muted-foreground"
          >
            intrekken
          </Button>
        )}
        {canWrite && !review.fresh && (
          <Button
            variant="link"
            size="xs"
            onClick={() => append({ scope: 'page', action: 'reviewed', findingSetHash })}
            className={cn('px-0', CHROME.link)}
          >
            opnieuw markeren
          </Button>
        )}
      </div>
    );
  }

  if (!canWrite) return null;
  return (
    <Button
      variant="outline"
      onClick={() => append({ scope: 'page', action: 'reviewed', findingSetHash })}
    >
      Pagina gecontroleerd
    </Button>
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
      <Input
        name="editor"
        defaultValue={editor}
        placeholder="Je naam"
      />
      {/* Base UI's button is a `type="button"` by default, so the submit is
          declared here rather than assumed. */}
      <Button type="submit" variant="outline">
        {editor ? 'Naam wijzigen' : 'Opslaan'}
      </Button>
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
        <strong>Geen verbinding met het afvinklogboek.</strong> {notConnectedReason} Afvinken
        en negeren zijn uitgeschakeld; de rest van het logboek werkt gewoon.
      </Banner>
    );
  }
  if (!ready) return <Banner tone="neutral">Het afvinklogboek wordt geladen…</Banner>;
  return null;
}

/*
 * shadcn's `Alert` gives the shape; the tone is `BANNER`'s, as ADR 0007 requires,
 * so no `variant` is asked for here. `AlertDescription` paints itself
 * `text-muted-foreground`, which would swallow the banner's own ink, so it is told
 * to inherit instead.
 */
const Banner = ({ tone, children }) => (
  <Alert className={BANNER[tone]}>
    <AlertDescription className="text-inherit">{children}</AlertDescription>
  </Alert>
);
