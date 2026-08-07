import { classInfo } from '../lib/classes.mjs';
import { BANNER, FILL, SOLID, severityTone } from '../lib/palette.mjs';

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
 * The class filter, wherever it is. The content view narrows a page to a class and
 * the dashboard narrows the page list to the same class, and ticket 36 asks for the
 * **same semantics** in both — so it is one component. Two copies of *narrow to this
 * class* would drift, and the drift would land on the one word an editor reads the
 * affordance by.
 *
 * The count beside each pill is whatever the caller counts — regels on a page, pagina's
 * on the dashboard — so the caller owns the tooltip that names the unit.
 */
export function ClassFilterPills({ counts, selected, onToggle, title }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {counts.map(({ class: cls, count }) => {
        const on = selected.includes(cls);
        return (
          <button
            key={cls}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(cls)}
            title={title(cls, count)}
            className={`inline-flex items-center gap-1 rounded ${on ? 'ring-2 ring-brand-lighter-green' : 'opacity-70 hover:opacity-100'}`}
          >
            <ClassPill class={cls} />
            <span className="pr-1 text-xs tabular-nums text-slate-500">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * A filter says so for as long as it is on. A narrowed view that looks like the whole
 * thing is read as the whole thing, and the editor stops early — so the strip is amber
 * and it carries the one action that clears it.
 */
export function FilterBanner({ onClear, className = '', children }) {
  return (
    <p className={`flex flex-wrap items-center gap-2 text-sm ${BANNER.attention} ${className}`}>
      {children}
      <button
        type="button"
        onClick={onClear}
        className="rounded border border-current px-1.5 py-0.5 text-xs"
      >
        Filter wissen
      </button>
    </p>
  );
}

/**
 * The parity bar. Ticket 09: shown classes on this snapshot only, and a hidden
 * class is not in it at all — a bar that counts what the editor was never asked
 * to look at cannot be read.
 */
export function Bar({ shown, units }) {
  // The unit count is the only honest denominator available before overrides
  // exist: it is how many things the page says.
  const scale = Math.max(units, shown, 1);
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
