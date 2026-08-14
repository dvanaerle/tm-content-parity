/**
 * The page bar, the review control and the two banners that keep the log honest.
 *
 * Ticket 09: **always show absolute counts**, because the denominator moves. A
 * genuinely corrected difference leaves the snapshot altogether, so the same page
 * can have fewer open findings and the same percentage. The number an editor can
 * trust is the count, and the bar is the glance.
 */

import { logState } from '../lib/log-read.mjs';
import { BANNER, CHROME, FILL, INK, PILL } from '../lib/palette.mjs';
import { Alert, AlertDescription } from './ui/alert.jsx';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Progress } from './ui/progress.jsx';
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
          <span className={cn('tabular-nums', INK.attention)}>
            {bar.contradicted} claimed fixed, still differs
          </span>
        )}
      </div>
      {/* Blue, not green. Work done is status, and ticket 35 keeps green for
          "the new site added this" and nothing else. */}
      <Progress
        value={ready ? percent : 0}
        trackClassName="h-2 rounded"
        indicatorClassName={FILL.secondary}
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
        <Badge className={review.fresh ? PILL.info : PILL.attention}>
          {review.fresh ? 'reviewed' : 'changed since review'} · {review.editor}
        </Badge>
        {canWrite && (
          <Button
            variant="link"
            size="xs"
            onClick={() => append({ scope: 'page', action: 'cleared' })}
            className="px-0 text-muted-foreground"
          >
            Clear
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

  if (state === 'failed') {
    // Amber, not red. An unreachable log is a status, however bad it is, and
    // ticket 35 keeps red for "production had this and the new site lost it".
    return (
      <Banner tone="severe">
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
      <Banner tone="attention">
        <strong>No connection to the override log.</strong> {reason} The Fixed tick and Dismiss are
        off; the rest of the log works.
      </Banner>
    );
  }
  if (state === 'reading') return <Banner tone="neutral">The override log is loading…</Banner>;
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
