import { classInfo } from '../lib/classes.mjs';
import { FILL, SOLID, severityTone } from '../lib/palette.mjs';

/**
 * The count row from the won prototype: a number in bold, its label beside it.
 * Ticket 09 requires absolute counts everywhere, because the denominator moves as
 * soon as an editor mutes a class.
 */
export function Chip({ value, label, tone = 'neutral', title }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs ${SOLID[tone]}`} title={title}>
      <strong className="font-semibold">{value}</strong>
      <span className="opacity-80">{label}</span>
    </span>
  );
}

/** One finding class, coloured by whether it is shown by default. */
export function ClassPill({ class: cls }) {
  const info = classInfo(cls);
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${info.pill}`}
      title={info.meaning}
    >
      {cls}
    </span>
  );
}

/**
 * The parity bar. Ticket 09: shown classes on this snapshot only, and a hidden
 * class is not in it at all — a bar that counts what the editor was never asked
 * to look at cannot be read.
 */
export function Bar({ shown, elements }) {
  // The element count is the only honest denominator available before overrides
  // exist: it is how many things the page says.
  const scale = Math.max(elements, shown, 1);
  const share = Math.min(1, shown / scale);
  return (
    <span className="inline-flex h-1.5 w-24 overflow-hidden rounded bg-slate-200 align-middle">
      <span
        className={`h-full ${FILL[severityTone(share)]}`}
        style={{ width: `${Math.round(share * 100)}%` }}
      />
    </span>
  );
}
