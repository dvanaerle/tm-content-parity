import { useState } from 'react';
import { clearedEventFor } from '../../../overrides/state.mjs';
import { INK, PILL } from '../lib/palette.mjs';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Checkbox } from './ui/checkbox.jsx';
import { Input } from './ui/input.jsx';

/**
 * The one action control. Spec 29: one control, one place in the code, three call
 * sites — Text, Links and Images. It was four until ticket 81 removed the
 * Taken tab; the control it wore was the same one these three wear, which is the
 * point of there being one.
 *
 * The two powers are deliberately unequal, and the inequality is the design:
 * a **judgement** (dismiss) beats a re-check, a **claim of fact** (fixed) does
 * not. So the control offers both and then reports back what the derivation made
 * of it, including *claimed fixed, still differs*.
 *
 * Ticket 36 makes the claim of fact a **checkbox**, and only the claim of fact.
 * Ticking off a pass is then one click per row instead of a menu. Dismissal keeps
 * its menu because a dismissal carries a mandatory note and a checkbox cannot.
 *
 * There was a second judgement here until ticket 112, and ADR 0011 withdrew it
 * entirely: a dismissal, keyed on the finding and expiring the moment either text
 * changes, is the only judgement left. A fully decided difference therefore offers
 * only *Clear*, and that case is correctly empty — a second judgement on
 * top of a colleague's is how two people disagree invisibly in an append-only table.
 */

/**
 * The one word for each state, and the tone it wears. Every surface that names a
 * state reads it from here — `CONTEXT.md` gives each of these words one meaning in
 * the code and in the interface, and a second copy of this map is how a state comes
 * to be called two things.
 *
 * Ticket 35 took the colours out of here. `fixed` was green and
 * `claimed fixed, still differs` was red, which spent both diff hues on a work state — an
 * editor scanning a page would have read "done" and "lost content" in the same
 * two colours. Both are status now: blue for done, amber for a claim the re-check
 * contradicted.
 *
 * @type {Record<string, { label: string, tone: import('../lib/palette.mjs').Tone }>}
 */
export const STATE = {
  open: { label: 'open', tone: 'neutral' },
  fixed: { label: 'fixed', tone: 'added' },
  dismissed: { label: 'dismissed', tone: 'neutral' },
  contradicted: { label: 'claimed fixed, still differs', tone: 'attention' },
};

export default function OverrideControl({
  finding, observationId, append, canWrite,
}) {
  /** @type {['dismiss' | null, Function]} */
  const [asking, setAsking] = useState(null);
  const [note, setNote] = useState('');
  const { state, override } = finding;

  const act = (partial) => append({ scope: 'finding', findingId: finding.id, ...partial });

  const close = () => { setAsking(null); setNote(''); };

  if (asking === 'dismiss') {
    return (
      <form
        className="flex flex-wrap items-center gap-1"
        onSubmit={async (submit) => {
          submit.preventDefault();
          if (!note.trim()) return;
          if (await act({ action: 'dismissed', note: note.trim() })) close();
        }}
      >
        {/* A note is required on the judgement: accepting a real difference must
            tell the next reader why. */}
        <Input
          autoFocus
          value={note}
          onChange={(change) => setNote(change.target.value)}
          placeholder="Why is this not a defect?"
          className="w-52"
        />
        <Action type="submit" disabled={!note.trim()}>Dismiss</Action>
        <Action onClick={close}>Cancel</Action>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <FixCheckbox
        finding={finding}
        canWrite={canWrite}
        onTick={(ticked) => (ticked
          // The claim records the observation it was made against, or it could
          // never be contradicted by a later one.
          ? act({ action: 'fixed', observationId })
          : act({ action: 'cleared' }))}
      />

      <Badge className={PILL[STATE[state].tone]}>{STATE[state].label}</Badge>

      {state === 'contradicted' && (
        <span className={`text-xs ${INK.attention}`}>
          claimed fixed by {override.editor}, still differs
        </span>
      )}
      {(state === 'fixed' || state === 'dismissed') && (
        <span className="text-xs text-muted-foreground" title={override.note ?? undefined}>
          {override.editor}
          {override.note ? ` — ${override.note}` : ''}
        </span>
      )}

      {canWrite && (state === 'open' || state === 'contradicted') && (
        <Action onClick={() => setAsking('dismiss')}>Dismiss…</Action>
      )}

      {/* `fixed` is not here: its own checkbox unticks it. A second control for the
          same event would let the two disagree about what is on screen.

          Which event this is, is `clearedEventFor()`'s to say, and it stays that way now
          there is one shape to return. It was written out here until ticket 110 gave the
          same press to a whole difference; two copies of that rule would be two places
          for the next change to a key to land, and it would land in one of them. */}
      {canWrite && state === 'dismissed' && (
        <Action onClick={() => append(clearedEventFor(finding))}>
          Clear
        </Action>
      )}
    </div>
  );
}

/**
 * The claim of fact, with **three** visual states: unticked, ticked, and
 * ticked-but-contradicted.
 *
 * The third state is the whole reason this is not a plain two-state checkbox. A fix
 * claim loses to re-check, and a two-state checkbox is the affordance that made the
 * superseded "the tick always wins" model feel natural. So a contradicted claim
 * stays ticked — the editor did claim it — and turns amber.
 *
 * A dismissal also closes a finding, and it is not a claim of fact. Its checkbox is
 * disabled rather than ticked: ticking it would say the editor corrected something
 * they in fact accepted.
 *
 * It is shadcn's checkbox on Base UI since the library came in, and no longer a
 * native `<input type="checkbox">`. That is why the tone below is a fill and no
 * longer an `accent-*` utility.
 */
function FixCheckbox({ finding, canWrite, onTick }) {
  const { state, occurrences } = finding;
  const closedByJudgement = state === 'dismissed';
  const contradicted = state === 'contradicted';

  // One rename repeated six times is one finding, and one event closes all six.
  // The editor is told so before the click, not after it.
  const grouped = occurrences > 1 ? ` One tick closes all ${occurrences} rows.` : '';

  return (
    <Checkbox
      className={contradicted ? TICK.attention : TICK.added}
      checked={state === 'fixed' || contradicted}
      disabled={!canWrite || closedByJudgement}
      onCheckedChange={(ticked) => onTick(ticked)}
      aria-label={`Fixed — ${finding.class}`}
      title={
        contradicted
          ? `You claimed this as fixed, but a later observation still sees the difference.${grouped}`
          : `I corrected this.${grouped}`
      }
    />
  );
}

/**
 * The ticked tone of the checkbox above, and the one place in these two files where
 * the palette has to out-shout shadcn rather than merely sit beside it.
 *
 * shadcn paints its own ticked state with `data-checked:bg-primary`. An attribute
 * selector outranks a plain class, so a palette value handed over as `bg-info`
 * would lose, and `tailwind-merge` cannot dedupe the pair either — the two carry
 * different variant modifiers and it reads them as different properties. So the
 * tone is written with the **same** `data-checked:` prefix, and it wins on
 * source order.
 *
 * The entries are literals for the reason `palette.mjs` gives: Tailwind reads
 * class names out of the source text, and a prefix assembled around a palette value
 * at runtime is not in the source text.
 *
 * **A standing claim is green, decided 2026-08-13, and it is the one exception to
 * the rule that `added` is direction and never status.** `palette.mjs` reserves the
 * only green in the interface for *the new site has this and production does not*,
 * and this checkbox spends it on *I corrected this*. It was `info` blue in the
 * design and the colour is a preference, taken deliberately and recorded here so
 * the next reader does not read it as the drift the one colour map exists to stop.
 * `attention` is unchanged and still means a claim a later observation contradicted.
 * `info` stays defined and unused, so restoring the blue is a one-word change.
 */
const TICK = {
  added: 'data-checked:border-success data-checked:bg-success data-checked:text-white dark:data-checked:bg-success',
  info: 'data-checked:border-info data-checked:bg-info data-checked:text-white dark:data-checked:bg-info',
  attention: 'data-checked:border-warning data-checked:bg-warning data-checked:text-white dark:data-checked:bg-warning',
};

const Action = ({ children, ...props }) => (
  <Button variant="outline" size="xs" {...props}>
    {children}
  </Button>
);
