/**
 * The page bar, the review control and the two banners that keep the log honest.
 *
 * Ticket 09: **always show absolute counts**, because the denominator moves. A
 * genuinely corrected difference leaves the snapshot altogether, so the same page
 * can have fewer open findings and the same percentage. The number an editor can
 * trust is the count, and the bar is the glance.
 */

import { useEffect, useRef } from 'react';
import { announce } from '../lib/announce.mjs';
import { logState } from '../lib/log-read.mjs';
import { CHROME } from '../lib/palette.mjs';
import { Alert, AlertDescription } from './ui/alert.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Progress } from './ui/progress.jsx';
import { Attribution } from './Attribution.jsx';
import { cn } from '../lib/utils.js';

export function PageBar({ bar, ready }) {
  const percent = bar.denominator === 0 ? 100 : Math.round((bar.closed / bar.denominator) * 100);

  return (
    <div className="w-full">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
        <strong className="text-sm tabular-nums">{ready ? `${percent}%` : '—'}</strong>
        {/*
          Every count below the denominator is derived from the override events,
          so none of them may be shown before the log answers. `0 of 41
          closed` is the empty-read lie in another shape. The denominator is
          the snapshot's own and is true either way.
        */}
        <span className="text-muted-foreground tabular-nums">
          {ready ? `${bar.closed} of ${bar.denominator} closed` : `${bar.denominator} differences`}
        </span>
        {ready && <span className="text-muted-foreground tabular-nums">{bar.open} open</span>}
        {ready && bar.contradicted > 0 && (
          <span data-wears="ink" data-tone="caution" className="tabular-nums">
            {bar.contradicted} claimed fixed, still differs
          </span>
        )}
      </div>
      {/* Blue, not green. Work done is status, and ticket 35 keeps green for
          "the new site added this" and nothing else. */}
      <Progress
        value={ready ? percent : 0}
        trackClassName="h-2 rounded"
        /* The brand step, and **not** a tone: a progress track's fill says how far along
           this page is and makes no claim about the content. `app.css` says the same
           where the fill shape is written. */
        indicatorClassName="bg-secondary"
      />
    </div>
  );
}

/**
 * A page review records that a human looked at everything here, **including what
 * the tool cannot see**. It goes stale when the finding set changes and never
 * expires on its own — so the words are *changed since review*, never
 * *needs review*. The log does not manufacture work.
 */
export function ReviewControl({ review, findingSetHash, append, canWrite }) {
  if (review) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Attribution
          action={review.fresh ? 'reviewed' : 'changed since review'}
          editor={review.editor}
          at={review.at}
        />
        {canWrite && (
          <Button
            variant="link"
            size="xs"
            onClick={() => append({ scope: 'page', action: 'cleared' })}
            className="px-0 text-muted-foreground"
          >
            Clear the review
          </Button>
        )}
        {canWrite && !review.fresh && (
          <Button
            variant="link"
            size="xs"
            onClick={() => append({ scope: 'page', action: 'reviewed', findingSetHash })}
            className={cn('px-0', CHROME.link)}
          >
            Mark again
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
      Page reviewed
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
      <Input name="editor" defaultValue={editor} placeholder="Your name" />
      {/* Base UI's button is a `type="button"` by default, so the submit is
          declared here rather than assumed. */}
      <Button type="submit" variant="outline">
        {editor ? 'Change the name' : 'Save'}
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
 *
 * **What state the log is in is read by `logState()`, and what to say about it is decided
 * here.** The two used to be one cascade, and there were three of them over the same five
 * fields — this one, `whyNotWriting()` and the notes half of a search — free to disagree
 * about whether an unreachable log and an unconfigured one are one thing or two. They are
 * two, and this is the component that says so; the notes half collapses them, which it may
 * do only because this one does not.
 */
export function LogBanner(log) {
  const { state, ready, reason } = logState(log);
  useLogFailureAnnounced(state, reason);

  if (state === 'failed') {
    // Amber, not red. An unreachable log is a status, however bad it is, and
    // ticket 35 keeps red for "production had this and the new site lost it".
    return (
      <Banner tone="warning">
        <strong>The override log does not answer.</strong> The page is read-only, so you cannot lose
        a change that you think is saved.{' '}
        {/*
          A failed read keeps the last good one, so the two cases say different
          things. Telling an editor "no overrides" while their own dismissals are
          on screen is the same lie as showing an empty list.
        */}
        {ready
          ? 'You see the state that was read last; it can be out of date.'
          : 'The log was not read, so you see the snapshot without the overrides.'}{' '}
        ({reason})
      </Banner>
    );
  }
  if (state === 'disconnected') {
    return (
      <Banner tone="caution">
        <strong>No connection to the override log.</strong> {reason} The Fixed tick and Dismiss are
        off; the rest of the log works.
      </Banner>
    );
  }
  if (state === 'reading') return <Banner tone="neutral">The override log is loading…</Banner>;
  return null;
}

/**
 * The banner said out loud, once, when it starts saying it.
 *
 * A log that cannot be written to is the one state in this interface nobody presses their
 * way into: it simply stops answering, or was never configured, and an editor who cannot
 * see the banner goes on ticking rows that are not being written. So it is announced on
 * the **transition**, which is what the ref holds — a render is not an event, and
 * re-announcing on every one of them would leave a screen reader talking over the page.
 *
 * **Two states and not one.** The ticket asks for *read-only*, which is `failed`; an
 * unconfigured project is `disconnected` and is just as unwritable. `LogBanner` above
 * draws both and words them apart, because `log-read.mjs` insists they are two things —
 * and this is that same pair, said out loud.
 *
 * `reading` is not announced. It is progress, and ADR 0019's live-region rule is that the
 * region says outcomes; the loading banner is already on screen for anyone who can see it,
 * and the outcome — read, or read-only — is a beat away either way.
 *
 * @param {ReturnType<typeof logState>['state']} state
 * @param {string | null} reason
 */
function useLogFailureAnnounced(state, reason) {
  const said = useRef(/** @type {string | null} */ (null));

  useEffect(() => {
    if (state === said.current) return;
    said.current = state;
    if (state === 'failed') {
      announce(`The override log does not answer, so this page is read-only. ${reason ?? ''}`.trim());
    }
    if (state === 'disconnected') {
      announce('There is no connection to the override log, so no decision can be made here.');
    }
  }, [state, reason]);
}

/*
 * shadcn's `Alert` gives the shape and the banner shape gives the tone, as ADR 0007
 * requires — so `variant` is refused rather than left at its default, which would paint
 * `bg-card` over the tone. `AlertDescription` paints itself `text-muted-foreground`,
 * which would swallow the banner's own ink, so it is told to inherit instead.
 */
const Banner = ({ tone, children }) => (
  <Alert variant={null} data-wears="banner" data-tone={tone}>
    <AlertDescription className="text-inherit">{children}</AlertDescription>
  </Alert>
);
