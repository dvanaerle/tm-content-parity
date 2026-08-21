import { Hint } from './Hint.jsx';
import { Button } from './ui/button.jsx';
import { Card } from './ui/card.jsx';
import { Separator } from './ui/separator.jsx';
import { cn } from '../lib/utils.js';

/**
 * The panel both floating bars are drawn in: fixed to the bottom of the viewport and
 * centred.
 *
 * **Why it floats** (ticket 31, round three). Round two made it a strip under the
 * difference, which is where a selection's toolbar goes wrong twice: it pushed the rest of
 * the queue down the instant a tick was made, and it scrolled away with the difference it
 * belonged to — so an editor reading page forty of a repeat had the presses off screen
 * while the pages they act on were in front of them. Fixed, it is where the selection is,
 * for as long as the selection is. It is not a `Dialog` and not a `Popover`: a modal would
 * trap the focus over the list the editor has to keep reading, and this bar is anchorless
 * and persistent.
 *
 * `w-fit` with a max: the bar is as wide as its own words, up to the width of the page, so
 * a two-page selection does not draw a strip across an empty screen. It stops at the
 * viewport edge and wraps rather than being clipped.
 *
 * **It is one component because it was two, twice over** (ticket 128). Each bar has two
 * states of its own — a selection to press on, and a press that has just reported — so one
 * shell drawn twice inside a file was already one place for those two to drift; and ticket
 * 31's press bar and ticket 83's annotation bar then spelled the same border, corner,
 * background and shadow in two *files*, with nothing saying either was a copy of the other.
 * That is the failure ADR 0007's amendment names by name — *a dozen panels that each
 * redefined a border and a corner* — and the second hand-rolled panel that same ADR says to
 * read as evidence rather than as licence for a third.
 *
 * So the surface is `Card`: the corner, the ground and the hairline ring are the theme's,
 * and the two callers pass their own name for it. `className` carries the rest, and all of
 * it is layout — where the bar sits, how wide it may get, the tighter spacing a strip of
 * controls wants instead of a card's, and the elevation a thing floating over a list needs
 * and a card in the flow does not.
 *
 * @param {object} props
 * @param {string} props.slot  What this bar is, published as `data-slot` for the tests that
 *   reach for it by name. It overrides the card's own slot rather than sitting beside it:
 *   there is one element and it is a bar first.
 * @param {import('react').ReactNode} props.children
 */
export const Floating = ({ slot, children }) => (
  <Card
    data-slot={slot}
    className={cn(
      'fixed inset-x-4 bottom-4 z-50 mx-auto w-fit max-w-[min(64rem,calc(100vw-2rem))]',
      'gap-2 px-3 py-2 shadow-lg',
      // `Card` clips itself so a full-bleed image can take its corner. There is no image
      // here, there is a focus ring on the last control, and this repo has been caught by an
      // ancestor's `overflow` once already — the sticky outline works because one of them is
      // `visible`. A clip that earns nothing does not get to be the second time.
      'overflow-visible',
    )}
  >
    {children}
  </Card>
);

/**
 * The way to put the selection — or the report that outlived it — down.
 *
 * Unticking ten rows one at a time is the work the bars exist to remove, so putting the
 * selection down costs one press as well. It is offered whether or not the log can be
 * written to: it is not a decision.
 *
 * It is the cross at the end of the bar, behind a rule, where a floating bar of this kind
 * puts it — and never a word among the presses, where *clear* sits one tab stop from
 * *dismiss* and reads like a third thing to decide. A glyph names nothing, so the words it
 * replaced are its label.
 *
 * The rule is a `Separator` and not a one-pixel span: a divider is in ADR 0007's list of
 * shapes shadcn owns, and the primitive publishes the role the hand-rolled span had to hide
 * behind `aria-hidden` — this rule genuinely divides the presses from the dismissal, which
 * is what the cross's position is meant to say. `h-4` stays because the primitive's vertical
 * default is `self-stretch`, and a rule as tall as the whole bar would read as a column.
 *
 * @param {object} props
 * @param {() => void} props.onClear
 */
export const Dismiss = ({ onClear }) => (
  <>
    <Separator orientation="vertical" className="ml-auto h-4" />
    {/* The hint is this button's own name made visible, and nothing more, so it is not
        announced a second time (ticket 129). A glyph needs the words on the screen for a
        reader who can see one and not the other. */}
    <Hint text="Clear the selection" announce={false}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClear}
        aria-label="Clear the selection"
      >
        <span aria-hidden>✕</span>
      </Button>
    </Hint>
  </>
);
