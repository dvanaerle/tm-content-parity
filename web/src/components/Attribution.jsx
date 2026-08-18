import { day } from '../lib/dates.mjs';
import { cn } from '../lib/utils.js';

/**
 * One decision, said the same way everywhere.
 *
 * There were three shapes before ticket 01 — a badge with a trailing name, a badge with
 * the name fused into it, and an uppercase tag with a trailing *name, date* — and none of
 * them agreed on the separator, on whether the action was a colour or a word, or on
 * whether a date appeared at all. Two of the three had a date to draw and drew neither.
 *
 * The shape is: **the action, the editor and the day on one line, and the reason on the
 * line below where there is one.** The reason belongs under the judgement rather than
 * beside it because it is the longer half — inline, it pushed the date off the row and
 * had to be hidden in a `title` to fit.
 *
 * @param {object} props
 * @param {string} props.action    What was done, in the vocabulary's own words.
 * @param {string} props.editor    Who did it.
 * @param {string} props.at        When, as an ISO 8601 stamp.
 * @param {import('react').ReactNode} [props.reason]  Why, where the action has one.
 * @param {import('../lib/palette.mjs').Tone | null} [props.tone]  Louder than the grey,
 *   where the decision itself is the thing being reported on. It is worn as ink, and the
 *   grey is dropped rather than overridden: a tone is a rule in `app.css` and the grey is a
 *   utility, which would outrank it.
 * @param {string} [props.className]
 */
export function Attribution({ action, editor, at, reason = null, tone = null, className = '' }) {
  return (
    <div
      data-wears={tone ? 'ink' : null}
      data-tone={tone}
      className={cn('text-xs', !tone && 'text-muted-foreground', className)}
    >
      <span>
        {action} · {editor} · {day(at)}
      </span>
      {reason ? <div>{reason}</div> : null}
    </div>
  );
}
