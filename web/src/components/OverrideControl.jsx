import { useMemo, useState } from 'react';
import { namesSection } from '../../../shared/mute-key.mjs';
import { muteForms } from '../lib/mute.mjs';
import { ACCENT, INK, PILL } from '../lib/palette.mjs';

/**
 * The one action control. Spec 29: one control, one place in the code, three call
 * sites — Inhoud, Links and Afbeeldingen. It was four until ticket 81 removed the
 * Taken tab; the control it wore was the same one these three wear, which is the
 * point of there being one.
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
 *
 * Ticket 88 took the one silent press away. *Dempen* was a single button that could
 * hide 173 findings, asked for no reason and recorded no section. It now opens the
 * two forms of ADR 0008 — a section and the whole page — each saying how many
 * findings it covers, and neither can be pressed without a note.
 */

/**
 * The one word for each state, and the tone it wears. Every surface that names a
 * state reads it from here — `CONTEXT.md` gives each of these words one meaning in
 * the code and in the interface, and a second copy of this map is how a state comes
 * to be called two things.
 *
 * Ticket 35 took the colours out of here. `opgelost` was green and
 * `nog niet opgelost` was red, which spent both diff hues on a work state — an
 * editor scanning a page would have read "done" and "lost content" in the same
 * two colours. Both are status now: blue for done, amber for a claim the re-check
 * contradicted.
 *
 * @type {Record<string, { label: string, tone: import('../lib/palette.mjs').Tone }>}
 */
export const STATE = {
  open: { label: 'open', tone: 'neutral' },
  fixed: { label: 'opgelost', tone: 'info' },
  dismissed: { label: 'genegeerd', tone: 'neutral' },
  muted: { label: 'gedempt', tone: 'neutral' },
  contradicted: { label: 'nog niet opgelost', tone: 'attention' },
};

/**
 * `findings` are the derived findings of the whole page. The mute needs them:
 * ADR 0008 says the count is computed **before** the press, on the snapshot in
 * front of the editor, and one finding cannot count its own section.
 */
export default function OverrideControl({
  finding, findings = [], observationId, append, canWrite,
}) {
  /** @type {['dismiss' | 'mute' | null, Function]} */
  const [asking, setAsking] = useState(null);
  const [note, setNote] = useState('');
  const { state, override } = finding;

  const act = (partial) => append({ scope: 'finding', findingId: finding.id, ...partial });

  const close = () => { setAsking(null); setNote(''); };

  if (asking === 'mute') {
    return <MuteForms
      finding={finding}
      findings={findings}
      note={note}
      setNote={setNote}
      onCancel={close}
      onPress={async (key) => {
        if (await append({ scope: 'page-class', action: 'muted', ...key, note: note.trim() })) close();
      }}
    />;
  }

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
        {/* A note is required on the two judgements: accepting a real difference
            for good, or hiding a class, must tell the next reader why. */}
        <input
          autoFocus
          value={note}
          onChange={(change) => setNote(change.target.value)}
          placeholder="Waarom is dit geen defect?"
          className="w-52 rounded border border-slate-300 px-2 py-1 text-xs"
        />
        <Action type="submit" disabled={!note.trim()}>Negeren</Action>
        <Action onClick={close}>Annuleren</Action>
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
          <Action onClick={() => setAsking('dismiss')}>Negeren…</Action>
          <Action onClick={() => setAsking('mute')}>Dempen…</Action>
        </>
      )}

      {/* `fixed` is not here: its own checkbox unticks it. A second control for the
          same event would let the two disagree about what is on screen.

          A mute is undone on the key that made it, which is the key the derivation
          handed back. Clearing the page-wide key would leave a section mute
          standing, and the row would not move. */}
      {canWrite && (state === 'dismissed' || state === 'muted') && (
        <Action onClick={() => append(
          state === 'muted'
            ? {
              scope: 'page-class',
              action: 'cleared',
              class: finding.class,
              ...(namesSection(override) ? { anchorHeading: override.anchorHeading } : {}),
            }
            : { scope: 'finding', action: 'cleared', findingId: finding.id },
        )}>
          Ongedaan maken
        </Action>
      )}
    </div>
  );
}

/**
 * The two forms of ADR 0008, side by side with their counts, and one note field
 * over both.
 *
 * Neither button submits the form implicitly. A mute is the largest press in the
 * log, and an editor typing a reason must not be able to hide a section with the
 * Enter key before they have chosen which one.
 */
function MuteForms({ finding, findings, note, setNote, onCancel, onPress }) {
  const forms = useMemo(() => muteForms(findings, finding), [findings, finding]);
  const ready = Boolean(note.trim());

  return (
    <div className="flex flex-col gap-1 rounded border border-slate-200 p-2">
      <input
        autoFocus
        value={note}
        onChange={(change) => setNote(change.target.value)}
        placeholder={`Waarom is ${finding.class} hier nooit een defect?`}
        className="w-64 rounded border border-slate-300 px-2 py-1 text-xs"
      />
      {/* The count is the guard, so it is in the button and not beside it. There
          is no threshold that hides the section form on a page with many
          headings: the two numbers teach that on their own. */}
      {forms.map((form, index) => (
        <Action
          key={form.where}
          disabled={!ready}
          title={ready ? undefined : 'Een demping heeft een reden nodig.'}
          onClick={() => onPress(form.key)}
        >
          {index === 0 ? 'Deze sectie dempen' : 'Hele pagina dempen'} — {form.says}
        </Action>
      ))}
      <Action onClick={onCancel}>Annuleren</Action>
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
