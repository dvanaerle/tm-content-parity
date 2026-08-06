import { useState } from 'react';

/**
 * The one action control. Spec 29: one control, one place in the code, four call
 * sites — Diff, Links, Afbeeldingen and Taken.
 *
 * The two powers are deliberately unequal, and the inequality is the design:
 * a **judgement** (negeren, dempen) beats a re-check, a **claim of fact**
 * (opgelost) does not. So the control offers all three and then reports back
 * what the derivation made of it, including *claimed fixed, still differs*.
 */

/** @type {Record<string, { label: string, pill: string }>} */
const STATE = {
  open: { label: 'open', pill: 'bg-slate-100 text-slate-600' },
  fixed: { label: 'opgelost', pill: 'bg-emerald-100 text-emerald-800' },
  dismissed: { label: 'genegeerd', pill: 'bg-slate-200 text-slate-700' },
  muted: { label: 'gedempt', pill: 'bg-slate-200 text-slate-500' },
  contradicted: { label: 'nog niet opgelost', pill: 'bg-red-100 text-red-800' },
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
      <span className={`rounded px-1.5 py-0.5 text-[11px] ${STATE[state].pill}`}>
        {STATE[state].label}
      </span>

      {state === 'contradicted' && (
        <span className="text-[11px] text-red-700">
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
          {/* The claim records the observation it was made against, or it could
              never be contradicted by a later one. */}
          <Action onClick={() => act({ action: 'fixed', observationId })}>Opgelost</Action>
          <Action onClick={() => setAsking(true)}>Negeren…</Action>
          <Action onClick={() => append({
            scope: 'page-class', action: 'muted', class: finding.class,
          })}>
            Klasse dempen
          </Action>
        </>
      )}

      {canWrite && state !== 'open' && state !== 'contradicted' && (
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

const Action = ({ children, ...props }) => (
  <button
    type="button"
    {...props}
    className="rounded border border-slate-300 px-1.5 py-0.5 text-[11px] text-slate-700 hover:bg-slate-50 disabled:opacity-40"
  >
    {children}
  </button>
);
