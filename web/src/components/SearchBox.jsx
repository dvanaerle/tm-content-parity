import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Hint, Description } from './Hint.jsx';
import { Badge } from './ui/badge.jsx';
import { Input } from './ui/input.jsx';
import { cn } from '../lib/utils.js';
import { scopeSuggestions, withScope } from '../lib/search.mjs';

/**
 * The one search box of the store dashboard, offering the store's page keys while a page
 * scope is being typed (ticket 104 part D).
 *
 * **Not `Search.jsx`**, which is imported beside it and draws the *answer*. This is the
 * control that asks: one box, one list of keys under it, and nothing about a result.
 *
 * It is a component of its own and not eight lines more of `Dashboard`, because a
 * suggestion list is a small machine: what is open, which row is active, what Escape put
 * down. All of that belongs beside the box it is about, and none of it is screen state —
 * ADR 0010 puts the screen in the URL, and *which row my arrow key is on* is not a screen
 * anybody links to.
 *
 * **The box is still the source of truth.** This holds no copy of the term: `value` comes
 * down and every choice goes back up through `onChange`, so a scope chosen from the list and
 * a scope typed by hand are the same write and cannot behave differently. What to offer and
 * what to write back are both `search.mjs`'s answers — see `scopeSuggestions()` and
 * `withScope()`; the rule an offer narrows by has to be the rule the scope matches by.
 *
 * **A hand-rolled listbox and not the `Popover` primitive.** A popover takes the focus,
 * and this list must never: the editor is typing, the box keeps the caret the whole time,
 * and the list is read with the arrow keys from inside it. It is the same reason the
 * suggestions are dismissed with Escape rather than by a click somewhere else.
 *
 * @param {object} props
 * @param {string} props.value What is in the box.
 * @param {(next: string) => void} props.onChange
 * @param {{ page: string, comparable: boolean }[]} props.pages The store's **whole** page
 *   list, as the store page loaded it — one-sided pages and all. It is in memory before the
 *   search index is fetched, which is what lets the first keystroke be answered.
 */
export default function SearchBox({ value, onChange, pages }) {
  const listId = useId();
  const oneSidedId = useId();
  const [focused, setFocused] = useState(false);
  /**
   * The fragment Escape put down, so the list stays down while that fragment stands and
   * comes back the moment it changes. A boolean would either reopen on the next keystroke —
   * which is Escape doing nothing — or stay down for the rest of the session, which is a
   * control an editor cannot get back.
   */
  const [dismissed, setDismissed] = useState(null);
  /** The row the arrow keys are on, or `-1`. Read through `active` and never directly. */
  const [held, setHeld] = useState(-1);

  const suggestion = useMemo(() => scopeSuggestions({ pages, term: value }), [pages, value]);
  const offered = suggestion?.pages ?? [];
  const open = focused && offered.length > 0 && suggestion.scope !== dismissed;
  // The active row, clamped rather than reset by an effect: the list narrows on every
  // keystroke, and a held index past the end of the shortened list would either point at
  // another page than the one it highlighted or offer nothing to Enter.
  const active = held >= 0 && held < offered.length ? held : -1;

  /**
   * The row the arrow keys are on, kept in view.
   *
   * `aria-activedescendant` moves the **screen reader's** cursor and scrolls nothing: only
   * real focus does that, and the focus stays in the box on purpose. The list is
   * `max-h-64 overflow-y-auto` and a store's list is long enough to scroll, so without this
   * an arrow key past the visible window highlights a row nobody can see.
   *
   * A block body and not an expression: an effect that *returns* anything is an effect
   * promising React a cleanup function, and `scrollIntoView`'s own return value is not one.
   */
  const activeRow = useRef(null);
  useEffect(() => {
    activeRow.current?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  /**
   * The chosen key, written back through the box.
   *
   * The list is put down by the same state Escape uses, because choosing is settling: a
   * chosen key can still be the prefix of a sibling — `veranda` beside `veranda-hout` — and
   * `scopeSuggestions()` rightly keeps offering there, so a choice that left the list open
   * would answer a press with a list that had not moved.
   */
  const choose = (page) => {
    onChange(withScope(value, page));
    setDismissed(page);
    setHeld(-1);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape' && open) {
      // The default is the browser's own: Escape in a `type="search"` box empties it. An
      // editor putting a suggestion list down has not asked for their term back.
      event.preventDefault();
      setDismissed(suggestion.scope);
      setHeld(-1);
      return;
    }

    if (offered.length === 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      // The caret would otherwise run to one end of the term, which is what the arrow keys
      // do in a text box — and the editor is reading a list with them.
      event.preventDefault();
      // An arrow key asks for the list, so it takes back an Escape rather than being
      // swallowed by one.
      setDismissed(null);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setHeld((from) => {
        const on = from >= 0 && from < offered.length ? from : -1;
        if (on === -1) return step === 1 ? 0 : offered.length - 1;
        return (on + step + offered.length) % offered.length;
      });
      return;
    }

    if (event.key === 'Enter' && open && active >= 0) {
      event.preventDefault();
      choose(offered[active].page);
    }
  };

  return (
    // The wrapper carries no width of its own, so the box is measured exactly as it was
    // when it sat in the header row directly — it is a flex item there, and a width added
    // here would take the sort and the switch off the side of a narrow card, which is the
    // trap the header's comment already records. All the wrapper is for is `relative`: the
    // list is positioned off the box, so the two read as one control.
    <div className="relative">
      {/* One box, and it searches the content (ticket 82). It used to match a page name and
          nothing else, and it lived with the page list because that was the only list it
          could narrow. The page key is one of the six fields it now searches, so the old
          question is still asked — and there is one box on the screen rather than the two
          ticket 12 already cleaned up once. */}
      <Hint text="Searches the text, the links, the headings and the page names of this store. A leading slash narrows it to one page: type / for the list.">
        <Input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setHeld(-1);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search the content"
          role="combobox"
          // A placeholder is not a name — it is gone the moment anything is typed — and every
          // other control in this interface carries one.
          aria-label="Search the content"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        />
      </Hint>
      {open && (
        <ul
          id={listId}
          data-scope-suggestions={suggestion.scope}
          role="listbox"
          aria-label="Pages in this store"
          // The whole panel and not only its rows: a press landing on the padding between two
          // rows, or on the scrollbar of a list long enough to have one, would otherwise blur
          // the box and unmount the list from under the finger doing the dragging.
          onMouseDown={(event) => event.preventDefault()}
          className="absolute top-full left-0 z-50 mt-1 max-h-64 w-full min-w-64 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {offered.map((one, index) => (
            <li
              key={one.page}
              id={`${listId}-${index}`}
              data-suggestion={one.page}
              role="option"
              aria-selected={index === active}
              // The row and not the badge carries the sentence, and it is a description with
              // no tooltip on it — the one place in the interface that refuses the primitive
              // (ticket 129). A tooltip trigger is a tab stop, and a tab stop inside a
              // `role="listbox"` takes the arrow keys away from the combobox that owns the
              // list. So the words reach the reader through the row they are about, which is
              // the thing a reader arrows onto anyway.
              aria-describedby={one.comparable ? undefined : oneSidedId}
              ref={index === active ? activeRow : null}
              // `mousedown` and not `click`: a click lands after the box has already lost
              // the focus, which closes the list from under the press. The default is
              // refused for the same reason — the caret stays in the box.
              onMouseDown={(event) => {
                event.preventDefault();
                choose(one.page);
              }}
              onMouseEnter={() => setHeld(index)}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1 text-sm',
                index === active && 'bg-accent text-accent-foreground',
              )}
            >
              <span className="truncate text-xs">/{one.page}</span>
              {/* Offered **and marked**: a one-sided page is the one kind a search cannot
                  otherwise reach — it has no findings and can never have any, so nothing
                  indexes it — and a scope onto one lands on part A's explanation rather
                  than on silence. The words are the aside's own, because two names for one
                  situation is how a vocabulary rots. */}
              {!one.comparable && (
                <Badge
                  data-badge="one-sided"
                  variant={null}
                  data-wears="pill"
                  data-tone="neutral"
                  className="h-auto shrink-0 px-1.5 py-0 text-xs"
                >
                  one-sided
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
      {/* One sentence for however many one-sided rows the list is offering: they all say the
          same thing, so they all point at the same words. */}
      <Description id={oneSidedId} text="Only one site has this page." />
    </div>
  );
}
