/**
 * What a floating bar says it is about: the count of ticked pages, and the sentence
 * naming them.
 *
 * The two bars — ticket 31's presses and ticket 83's annotation — drew this bubble
 * **verbatim**, down to the same nine utility classes, and the copies had already begun to
 * mean different things: one carried a denominator and a subject, the other read *2 pages
 * selected* and named nothing at all. So the mark is one component and the sentence is the
 * caller's, which is the only half that legitimately differs.
 *
 * The bubble is **not a badge**. ADR 0019 closes that list at four values an editor scans a
 * list for, and this is a count of the reader's own ticks on a control that exists only
 * while they are ticked — the same argument that took the page scope chip out of the list.
 * So it carries no `data-badge` and no tone: it wears the brand step, as chrome does.
 *
 * @param {object} props
 * @param {number} props.count  How many are ticked, in the unit the caller's own sentence
 *   counts in — page rows on the dashboard, and a difference's pages on the bulk bar, where
 *   one page ticked in two differences is two ticks and the denominator counts it twice too.
 * @param {import('react').ReactNode} props.children  What they are ticked in, which is the
 *   object and the scope of the press. A count with no subject is what this shape exists to
 *   prevent, so there is no default.
 */
export function Selected({ count, children }) {
  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      {/* The count as a mark rather than as the first word of a sentence: the bars float
          over the page, and what one is *about* has to be readable before the sentence
          is. */}
      <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground tabular-nums">
        {count}
      </span>
      {/* An explicit space, so the count and the sentence are one string when read aloud —
          *2of 3 pages* is what adjacent boxes concatenate to. A whitespace-only run is not
          rendered as a flex item, so it costs nothing beside the gap. */}{' '}
      {children}
    </p>
  );
}

/**
 * *of N pages*, in the one wording both bars state a scope in.
 *
 * The denominator is every page **under the selection** — the list the ticks were made in —
 * and never the ticked pages counted again. *2 of 472* answers *how much of what I am
 * looking at*, which is the question a selection is a step in; *2 of 2* answers nothing.
 *
 * @param {{ pages: number }} props
 */
export function OfPages({ pages }) {
  return (
    <strong className="font-medium text-foreground tabular-nums">
      of {pages} {pages === 1 ? 'page' : 'pages'}
    </strong>
  );
}
