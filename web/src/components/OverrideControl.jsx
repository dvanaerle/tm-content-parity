import { useState } from 'react';
import { ACCENT, INK, PILL } from '../lib/palette.mjs';

/**
 * The one action control. Spec 29: one control, one place in the code, four call
 * sites — Inhoud, Links, Afbeeldingen and Taken.
 *
 * The two powers are deliberately unequal, and the inequality is the design:
 * a **judgement** (negeren, dempen) beats a re-check, a **claim of fact**
 * (opgelost) does not. So the control offers all three and then reports back
 * what the derivation made of it, including *claimed fixed, still differs*.
 *
 * Ticket 36 makes the claim of fact a **checkbox**, and only the claim of fact.
 * Ticking off a pass is then one click per row instead of a menu. Dismissal keeps
 * its menu because a dismissal carries a mandatory note and a checkbox cannot, and
 * mute keeps its menu because it acts on a whole class and a mis-click would take a
 * class off the page.
 */

/**
 * Ticket 35 took the colours out of here. `opgelost` was green and
 * `nog niet opgelost` was red, which spent both diff hues on a work state — an
 * editor scanning a page would have read "done" and "lost content" in the same
 * two colours. Both are status now: blue for done, amber for a claim the re-check
 * contradicted.
 *
 * @type {Record<string, { label: string, tone: import('../lib/palette.mjs').Tone }>}
 */
const STATE = {
  open: { label: 'open', tone: 'neutral' },
  fixed: { label: 'opgelost', tone: 'info' },
  dismissed: { label: 'genegeerd', tone: 'neutral' },
  muted: { label: 'gedempt', tone: 'neutral' },
  contradicted: { label: 'nog niet opgelost', tone: 'attention' },
};

export default function OverrideControl({ finding, observationId, append, canWrite }) {
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState('');
  const { state, override } = finding;

  const act = (partial) => append({ scope: 'finding', findingId: finding.id, ...partial });

  if (asking) {
    return (
      <form
        className="flex flex-wrap items-center gap-1"
        onSubmit={async (submit) => {
          submit.preventDefault();
          if (!note.trim()) return;
          if (await act({ action: 'dismissed', note: note.trim() })) {
            setAsking(false);
            setNote('');
          }
        }}
      >
        {/* A note is required on a dismissal and only on a dismissal: accepting a
            real difference for good must tell the next reader why. */}
        <input
          autoFocus
          value={note}
          onChange={(change) => setNote(change.target.value)}
          placeholder="Waarom is dit geen defect?"
          className="w-52 rounded border border-slate-300 px-2 py-1 text-xs"
        />
        <Action type="submit" disabled={!note.trim()}>Negeren</Action>
        <Action onClick={() => setAsking(false)}>Annuleren</Action>
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

      <span className={`rounded px-1.5 py-0.5 text-[11px] ${PILL[STATE[state].tone]}`}>
        {STATE[state].label}
      </span>

      {state === 'contradicted' && (
        <span className={`text-[11px] ${INK.attention}`}>
          geclaimd opgelost door {override.editor}, verschilt nog
        </span>
      )}
      {(state === 'fixed' || state === 'dismissed' || state === 'muted') && (
        <span className="text-[11px] text-slate-500" title={override.note ?? undefined}>
          {override.editor}
          {override.note ? ` — ${override.note}` : ''}
        </span>
      )}

      {canWrite && (state === 'open' || state === 'contradicted') && (
        <>
          <Action onClick={() => setAsking(true)}>Negeren…</Action>
          <Action onClick={() => append({
            scope: 'page-class', action: 'muted', class: finding.class,
          })}>
            Klasse dempen
          </Action>
        </>
      )}

      {/* `fixed` is not here: its own checkbox unticks it. A second control for the
          same event would let the two disagree about what is on screen. */}
      {canWrite && (state === 'dismissed' || state === 'muted') && (
        <Action onClick={() => append(
          state === 'muted'
            ? { scope: 'page-class', action: 'cleared', class: finding.class }
            : { scope: 'finding', action: 'cleared', findingId: finding.id },
        )}>
          Ongedaan maken
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
 * A dismissal and a mute also close a finding, and neither is a claim of fact.
 * Their checkbox is disabled rather than ticked: ticking it would say the editor
 * corrected something they in fact accepted.
 */
function FixCheckbox({ finding, canWrite, onTick }) {
  const { state, occurrences } = finding;
  const closedByJudgement = state === 'dismissed' || state === 'muted';
  const contradicted = state === 'contradicted';

  // One rename repeated six times is one finding, and one event closes all six.
  // The editor is told so before the click, not after it.
  const grouped = occurrences > 1 ? ` Eén vinkje vinkt alle ${occurrences} regels af.` : '';

  return (
    <input
      type="checkbox"
      className={`size-4 shrink-0 disabled:opacity-40 ${contradicted ? ACCENT.attention : ACCENT.info}`}
      checked={state === 'fixed' || contradicted}
      disabled={!canWrite || closedByJudgement}
      onChange={(change) => onTick(change.target.checked)}
      aria-label={`Opgelost — ${finding.class}`}
      title={
        contradicted
          ? `Je claimde dit als opgelost, maar een latere waarneming ziet het verschil nog.${grouped}`
          : `Ik heb dit gecorrigeerd.${grouped}`
      }
    />
  );
}

const Action = ({ children, ...props }) => (
  <button
    type="button"
    {...props}
    className="rounded border border-slate-300 px-1.5 py-0.5 text-[11px] text-slate-700 hover:bg-slate-50 disabled:opacity-40"
  >
    {children}
  </button>
);
