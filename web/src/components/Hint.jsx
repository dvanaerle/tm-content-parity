'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import { Tooltip, TooltipContent } from './ui/tooltip.jsx';

/*
 * A hint, and the one way this interface attaches one (ticket 129).
 *
 * Every hint in the log was a native `title` until this ticket. A `title` is invisible on a
 * touch screen, unreachable by keyboard, unstyleable, and announced by screen readers when
 * they feel like it — so a hint written for an editor reached the subset of editors holding a
 * mouse. `Tooltip` had been installed since ticket 74 with no importer anywhere, which is the
 * accessibility work ADR 0007 bought the dependency for and had not yet done.
 *
 * **It adds JavaScript, deliberately.** A `title` costs nothing and this is Base UI with
 * positioning behind it. The CSS-only routes — the Popover API, anchor positioning,
 * `interestfor` — are refused by ticket 127 for years yet, and the trade is accepted because
 * zero JavaScript was never the goal: a hint a touch user cannot see is not a cheap hint, it
 * is a hidden one.
 *
 * **Two halves, because the primitive is only the visible one.** Base UI's tooltip wires no
 * ARIA at all — no `role`, no `aria-describedby` — which is defensible for a thing that
 * exists to be looked at, and useless for the reader this ticket is about. So the words are
 * given twice from one string: the popup draws them, and a hidden span carries them as the
 * element's **description**, which is what a screen reader reads after the name. The popup is
 * `aria-hidden` so a reader is not told the same sentence twice in two shapes — the same
 * mistake as leaving a `title` on a tooltip trigger, from the other side.
 *
 * The description is rendered whether the popup is open or not. A description that appeared
 * only while the tooltip was would be computed by the reader at the moment focus arrives and
 * the popup has not mounted yet, which is a race no test can pin and no editor can retry.
 *
 * It is **portalled to the body** rather than left beside the element it describes, and that
 * is not tidiness. A hidden node is still in its parent's `textContent`, so a hint left inline
 * puts its sentence inside the column head, the table cell or the strip it sits in — where a
 * test reading a heading reads the hint as well, and so does anything else that walks the
 * text. `aria-describedby` reaches across the document, so the words can live where they are
 * in nobody's way. The portal waits for the mount because the server has no `document`, and
 * a description that arrives with the hydration is a description in time: nothing on the
 * server-rendered screen answers a keyboard yet either.
 *
 * **A disabled control cannot carry its own hint**, and this is the one rule a caller has to
 * remember. A `disabled` element fires no pointer events and takes no focus, so neither hover
 * nor a tab stop ever reaches it — and a hint that explains *why the control is off* is
 * exactly the hint an editor needs most. So it goes on an enabled element **around** it: a
 * `TextHint` on the span that holds the control, which is a tab stop the control itself
 * refuses to be. A read-only control needs none of this; it is focusable and takes events, so
 * it is a control like any other.
 *
 * **What it is not.** A tooltip is not a place for something an editor must read to act: this
 * makes a hint reachable, it does not make it prominent, and Base UI's hover is `mouseOnly`,
 * so the touch reader's route to these words is the description and not a box on the screen.
 * Text that is required to act belongs on screen, and moving such a sentence in here would
 * keep it hidden while looking like a fix.
 */

/**
 * The words a reader is given after an element's own name.
 *
 * Exported because a hint cannot always be drawn: a tab stop inside a `role="listbox"` breaks
 * the combobox that owns it, so the search box's suggestion rows carry the description alone.
 * That is a surface refusing the tooltip, not a second pattern — the sentence a reader gets is
 * the same sentence, reached the same way.
 *
 * `hidden` and not `sr-only`: the accessible-name spec includes a hidden element that is
 * *directly* referenced by `aria-describedby`, and a hidden element cannot be selected by
 * hand, cannot be found by the browser's own text search, and takes no space in any layout.
 *
 * @param {object} props
 * @param {string} props.id       What the described element's `aria-describedby` points at.
 * @param {string} props.text
 */
export function Description({ id, text }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <span hidden id={id}>
      {text}
    </span>,
    document.body,
  );
}

/**
 * @typedef {object} HintProps
 * @property {string|false} text  The sentence, unchanged from the `title` it replaces. Falsy
 *   draws nothing at all, so a caller that sometimes carries a hint and sometimes does not
 *   stays one expression.
 * @property {import('react').ReactElement} children The element the hint is about. The
 *   trigger is **merged onto it** rather than wrapped around it, so no element is added to
 *   the document and no row can grow a pixel from a hint arriving.
 * @property {'top'|'bottom'|'left'|'right'} [side]
 * @property {boolean} [announce] Off where the hint says what the element's own name already
 *   says — an icon button whose `aria-label` is these very words. There the popup is the
 *   name made visible, and a description would be the name said twice.
 */

/**
 * A hint on a control: something that already answers to the keyboard and already has a name.
 *
 * No tab stop is added. A button is a tab stop already, and an item inside a composite — a
 * toggle group, a select — is deliberately not one, because the group moves focus with the
 * arrow keys and holds the single tab stop itself. Forcing `tabIndex` there would break the
 * very keyboard reach this component exists for.
 *
 * **Never on a plain element.** A description hung on a `span` with no role and no focus is
 * read by nothing, and Base UI's hover is mouse-only, so such a hint would reach neither a
 * keyboard nor a reader. Text takes `TextHint`, or it takes no hint at all.
 *
 * @param {HintProps} props
 */
export function Hint({ text, children, side = 'top', announce = true }) {
  return (
    <Attached text={text} side={side} announce={announce}>
      {children}
    </Attached>
  );
}

/**
 * A hint on text: a count in the store strip, a class pill, the word a scope narrowed to.
 *
 * Text is not focusable, so the element becomes a tab stop — the ARIA practices' own answer
 * for a tooltip on something that is not a control. It stays a `span` and gains no role: it
 * is a reading and not a button, and a press on it does nothing because there is nothing for
 * a press to do.
 *
 * @param {HintProps} props
 */
export function TextHint({ text, children, side = 'top', announce = true }) {
  return (
    <Attached text={text} side={side} announce={announce} tabIndex={0}>
      {children}
    </Attached>
  );
}

/** @param {HintProps & { tabIndex?: number }} props */
function Attached({ text, children, side, announce, tabIndex }) {
  const id = useId();

  // No sentence, no hint. A caller draws the same pill inside a filter that carries its own
  // hint and outside one that does not, and the alternative is the same three-line conditional
  // wrapped around five components — with three copies of this comment beside them.
  if (!text) return children;

  return (
    <Tooltip>
      {/* The library's trigger and not `ui/tooltip.jsx`'s, which stamps
          `data-slot="tooltip-trigger"` onto whatever it renders — and what it renders here is
          the control itself, whose own slot every stylesheet and every test knows it by. The
          wrapper stays exactly as shadcn ships it, so a re-add can never drop a local fix. */}
      <TooltipPrimitive.Trigger
        render={children}
        tabIndex={tabIndex}
        aria-describedby={announce ? id : undefined}
      />
      <TooltipContent side={side} aria-hidden>
        {text}
      </TooltipContent>
      {announce && <Description id={id} text={text} />}
    </Tooltip>
  );
}
