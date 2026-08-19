import { useState } from 'react';
import { clearedEventFor } from '../../../overrides/state.mjs';
import { classInfo } from '../lib/classes.mjs';
import { storeHref } from '../lib/page-url.mjs';
import { searchForRepeat } from '../lib/screen-url.mjs';
import { Attribution } from './Attribution.jsx';
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
  contradicted: { label: 'claimed fixed, still differs', tone: 'caution' },
};

/**
 * How loud an attribution of a decision is drawn, wherever one is drawn.
 *
 * `null` for every state but one. The contradiction is the only decision the interface
 * reports **on**, because it names a person whose claim the next reader is about to
 * overturn (ADR 0019); handing over each state's own tone instead would put a green
 * sentence under every closed finding and take that emphasis straight back.
 *
 * It is a function here rather than the condition written at each of the two call sites,
 * so the ledger and the repeat list cannot come to disagree about which decision is loud.
 * The tone is **read from `STATE`** and not spelled again, because `palette.test.mjs`
 * sweeps the source for tone words and that map is where it already finds this one.
 *
 * @param {string} state
 * @returns {import('../lib/palette.mjs').Tone | null}
 */
export const attributionTone = (state) =>
  state === 'contradicted' ? STATE.contradicted.tone : null;

export default function OverrideControl({ finding, observationId, append, canWrite }) {
  /** @type {['dismiss' | null, Function]} */
  const [asking, setAsking] = useState(null);
  const [note, setNote] = useState('');
  const { state, override } = finding;

  // Whether the *controls* below are offered, which is a different question from how the
  // attribution is drawn: a contradicted claim can still be dismissed.
  const contradicted = state === 'contradicted';

  const act = (partial) => append({ scope: 'finding', findingId: finding.id, ...partial });

  const close = () => {
    setAsking(null);
    setNote('');
  };

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
        <Action type="submit" disabled={!note.trim()}>
          Dismiss
        </Action>
        <Repeat finding={finding} />
        <Action onClick={close}>Cancel</Action>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <FixCheckbox
        finding={finding}
        canWrite={canWrite}
        onTick={(ticked) =>
          ticked
            ? // The claim records the observation it was made against, or it could
              // never be contradicted by a later one.
              act({ action: 'fixed', observationId })
            : act({ action: 'cleared' })
        }
      />

      {/* An open finding has nothing to attribute: nobody has decided it. It is a word and
          not a badge (ADR 0019) — the bucket it sits under already says *open*, so the
          badge was a second copy of the surrounding structure. */}
      {state === 'open' ? (
        <span className="text-xs text-muted-foreground">{STATE[state].label}</span>
      ) : (
        <Attribution
          action={STATE[state].label}
          editor={override.editor}
          at={override.at}
          reason={override.note}
          tone={attributionTone(state)}
        />
      )}

      {canWrite && (state === 'open' || contradicted) && (
        <Action onClick={() => setAsking('dismiss')}>Dismiss…</Action>
      )}

      {/* `fixed` is not here: its own checkbox unticks it. A second control for the
          same event would let the two disagree about what is on screen.

          Which event this is, is `clearedEventFor()`'s to say, and it stays that way now
          there is one shape to return. It was written out here until ticket 110 gave the
          same press to a whole difference; two copies of that rule would be two places
          for the next change to a key to land, and it would land in one of them. */}
      {canWrite && state === 'dismissed' && (
        <Action onClick={() => append(clearedEventFor(finding))}>Clear the decision</Action>
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
 * native `<input type="checkbox">`. That is why the ticked tone is a ground and a border
 * rather than an `accent-color`, which paints a native control and nothing else.
 *
 * The two ticked tones are `added` and `caution`, and the green is an exception to the rule
 * that a work state never takes a diff hue. It was decided on preference (2026-08-13);
 * `app.css`'s tick shape records it, names the blue it would otherwise take, and says what
 * putting that blue back costs now the shape is a rule rather than a class name.
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
      data-wears="tick"
      data-tone={contradicted ? 'caution' : 'added'}
      checked={state === 'fixed' || contradicted}
      disabled={!canWrite || closedByJudgement}
      onCheckedChange={(ticked) => onTick(ticked)}
      aria-label={`Fixed — ${classInfo(finding.class).label}`}
      title={
        contradicted
          ? `You claimed this as fixed, but a later observation still sees the difference.${grouped}`
          : `I corrected this.${grouped}`
      }
    />
  );
}

/**
 * The way out of a single judgement and into the one that covers every page holding the
 * same words — the store's *Repeats* view, which is where a difference is decided across
 * pages and where a decision may cross a language block (ADR 0018).
 *
 * It lives **in the form** and not on the row. A control on the row would be weight on
 * every open finding an editor scrolls past, which ADR 0019 refuses; in the form it costs
 * nothing until somebody has decided to make a judgement, which is the only moment the
 * question *and everywhere else?* is being asked.
 *
 * It is a link and not a press. Nothing here writes, so a repeat that turns out to hold
 * one page has cost a glance, and the note is typed once on the surface that spends it.
 */
const Repeat = ({ finding }) => {
  const search = searchForRepeat(finding);
  if (!search) return null;

  return <Action render={<a href={storeHref(finding.store, search)} />}>Open the repeat</Action>;
};

const Action = ({ children, ...props }) => (
  <Button variant="outline" size="xs" {...props}>
    {children}
  </Button>
);
