/**
 * The page bar, the review control and the two banners that keep the log honest.
 *
 * Ticket 09: **always show absolute counts**, because the denominator moves. A
 * genuinely corrected difference leaves the snapshot altogether, so the same page
 * can have fewer open findings and the same percentage. The number an editor can
 * trust is the count, and the bar is the glance.
 */

import { useEffect, useId, useRef } from 'react';
import { EllipsisIcon } from 'lucide-react';
import { announce } from '../lib/announce.mjs';
import { logState } from '../lib/log-read.mjs';
import { CHROME } from '../lib/palette.mjs';
import { Alert, AlertDescription } from './ui/alert.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.jsx';
import { Progress } from './ui/progress.jsx';
import { Attribution } from './Attribution.jsx';
import { PriorityPill } from './Chips.jsx';
import { cn } from '../lib/utils.js';

export function PageBar({ bar, ready }) {
  const percent = bar.denominator === 0 ? 100 : Math.round((bar.closed / bar.denominator) * 100);

  return (
    <div className="w-full">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
        <strong className="text-sm tabular-nums">{ready ? `${percent}%` : '—'}</strong>
        {/*
          Every count below the denominator is derived from the override events,
          so none of them may be shown before the log answers. `0 of 41
          closed` is the empty-read lie in another shape. The denominator is
          the snapshot's own and is true either way.
        */}
        <span className="text-muted-foreground tabular-nums">
          {ready ? `${bar.closed} of ${bar.denominator} closed` : `${bar.denominator} differences`}
        </span>
        {ready && <span className="text-muted-foreground tabular-nums">{bar.open} open</span>}
        {ready && bar.contradicted > 0 && (
          <span data-wears="ink" data-tone="caution" className="tabular-nums">
            {bar.contradicted} claimed fixed, still differs
          </span>
        )}
      </div>
      {/* Blue, not green. Work done is status, and ticket 35 keeps green for
          "the new site added this" and nothing else. */}
      <Progress
        value={ready ? percent : 0}
        trackClassName="h-2 rounded"
        /* The brand step, and **not** a tone: a progress track's fill says how far along
           this page is and makes no claim about the content. `app.css` says the same
           where the fill shape is written. */
        indicatorClassName="bg-secondary"
      />
    </div>
  );
}

/**
 * The three annotations a page carries, read on one quiet line.
 *
 * This is what PRD story 27 asked for and what could not be built until there was somewhere
 * for the controls to go. Before it, an editor opening a page to decide the differences on
 * it met a review control, the word *Priority*, three priority toggles, a note input and
 * its save button — all drawn permanently, all at full weight, and none of them the thing
 * they came for. The page key, which is the one fact that says *where am I*, competed with
 * three controls most editors touch on a minority of pages.
 *
 * It **reads** and does not set. The acting lives in the dialog behind the menu, and every
 * fact that was here is still one press away — a fact may be relocated and never removed.
 *
 * **Text, with one exception.** ADR 0019 closes the badge list at four and the priority is
 * already one of them, so it keeps its pill; the review state and the note mark are words.
 * There is no amber on it either: that ADR spends amber on states that are genuinely wrong,
 * and a page whose review went stale is not one. The words carry it.
 *
 * A page with none of the three draws **nothing**, rather than three empty slots, so an
 * unannotated page looks unannotated.
 *
 * @param {object} props
 * @param {import('../lib/page-header.mjs').LinePart[]} props.line  `headerReading().line`.
 */
export function PageLine({ line }) {
  if (line.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {line.map((part) => {
        if (part.kind === 'priority') {
          return <PriorityPill key="priority" priority={part.priority} />;
        }
        if (part.kind === 'note') {
          // That there is one, and never what it says. *Edit page details* is where the
          // note is read in full and where it is changed.
          return <span key="note">has a note</span>;
        }
        return (
          <Attribution
            key="review"
            action={part.fresh ? 'reviewed' : 'changed since review'}
            editor={part.editor}
            at={part.at}
          />
        );
      })}
    </div>
  );
}

/**
 * The one action with a real cost, and the reason it is not in the menu.
 *
 * A re-check crawls two live pages and writes a report, so it takes seconds and it is felt.
 * PRD story 28 keeps it visible for exactly that: a menu hides its items behind a press,
 * and this is the press an editor should be able to see before making it.
 *
 * It is **absent** rather than disabled where the local service does not answer — the
 * distinction `headerReading()` keeps, and the reason it keeps it. There is no service on
 * the webhost, so there is nothing to explain and nothing an editor could do about it.
 *
 * @param {object} props
 * @param {import('../lib/page-header.mjs').Offer} props.action  `actions.recheck`.
 * @param {{ running: boolean, run?: (store: string, page: string) => void }} props.recheck
 * @param {string} [props.store]
 * @param {string} [props.page]
 */
export function RecheckButton({ action, recheck, store, page }) {
  if (action.state !== 'offered') return null;

  return (
    <Button
      disabled={recheck.running}
      onClick={() => recheck.run(store, page)}
      className={cn('text-white', CHROME.button)}
    >
      {recheck.running ? 'Re-checking…' : 'Re-check'}
    </Button>
  );
}

/**
 * The one place the header keeps everything that is not the page and not *Re-check*.
 *
 * **A menu and not four more controls.** The header's most prominent row used to hold a
 * review control, three priority toggles, a note input with its own save button, a
 * *Re-check* and a name field, all drawn at full weight on every page and none of them the
 * thing an editor came for. This is where the ones an editor touches on a minority of pages
 * go, and the page key gets the row back.
 *
 * *Re-check* is deliberately **not** in here. PRD story 28 keeps the one action with a real
 * cost visible, and a browser assertion holds it there.
 *
 * The menu is the installed primitive and not a panel of our own. ADR 0007 records one
 * hand-rolled panel — the search suggestion list — and says a second should be read as
 * evidence this repo wants a focus-free panel primitive rather than as licence for a third.
 * That list is hand-rolled *because* it must never take the focus; a menu's whole job is to
 * take it, so it is the primitive's case and not the exception's.
 *
 * @param {object} props
 * @param {Record<string, import('../lib/page-header.mjs').Offer>} props.actions
 *   `headerReading().actions`.
 * @param {string} props.href  This page's own path, from `pageHref()`.
 * @param {() => void} props.onEditDetails  Opens the dialog holding the annotations.
 * @param {() => void} props.onMarkReviewed
 * @param {import('react').RefObject<HTMLElement | null>} [props.triggerRef]
 *   Where the dialog this menu opens should hand the focus back to. The item an editor
 *   pressed is gone by the time the dialog closes, so the way back has to be named.
 */
export function PageMenu({ actions, href, onEditDetails, onMarkReviewed, triggerRef }) {
  /*
   * The one sentence, said once at the foot of the menu rather than on each item that
   * carries it. Every refusal here has the same cause — the log, or a missing name — so
   * `whyNotWriting()`'s sentence is one fact about the page, and repeating it per item would
   * say it twice and tell a reader nothing the second time.
   */
  const refusal = Object.values(actions).find((offer) => offer.state === 'refused')?.reason ?? null;
  /* Named, so a refused item can point at the sentence rather than only look disabled. A
     page may draw more than one menu, so the id is the hook's and not a constant. */
  const refusalId = useId();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            ref={triggerRef}
            variant="ghost"
            /* The glyph stays small and the target does not: `size-9` is a comfortable
               thing for a finger to land on, which is the half of ui-polish 03 a guard
               cannot check. */
            className="size-9"
            /* An icon is not a name. The guard in `interface-reach.test.mjs` refuses a
               control whose whole content is a glyph, and it is right to: this is the only
               thing a reader who cannot see the `⋯` is told. */
            aria-label="More about this page"
          />
        }
      >
        <EllipsisIcon aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {/* One press and no form, so it stays here rather than going behind the dialog —
              making an editor open one to reach a single button would be ceremony. It is
              **absent** once a review exists, because a page cannot be reviewed twice. */}
          <MenuAction action={actions.markReviewed} onClick={onMarkReviewed} refusalId={refusalId}>
            Mark page reviewed
          </MenuAction>

          {/* Never refused, because opening it is a read: a note a colleague wrote is worth
              reading by an editor who cannot write one. What a read-only log stops is the
              saving, and the dialog says so where the saving is. */}
          <MenuAction action={actions.editDetails} onClick={onEditDetails} refusalId={refusalId}>
            Edit page details
          </MenuAction>

          <MenuAction
            action={actions.copyLink}
            onClick={() => copyLink(href)}
            refusalId={refusalId}
          >
            Copy link
          </MenuAction>
        </DropdownMenuGroup>

        {refusal && (
          <>
            <DropdownMenuSeparator />
            {/* A plain node and not `DropdownMenuLabel`, which is the primitive's
                `GroupLabel` and names the group of items above it. This names no group: it
                is why one of them cannot be pressed, and the refused items point at it. */}
            <p id={refusalId} className="max-w-64 px-1.5 py-1 text-xs text-muted-foreground">
              {refusal}
            </p>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * One item, drawn for what the reading says about it.
 *
 * **Absent and refused are drawn differently, and that is the whole reason the reading
 * distinguishes them.** An absent action is not here at all, because there is nothing to
 * offer — a page cannot be reviewed twice. A refused one is here and cannot be pressed,
 * because there *is* something to offer and the log will not take it right now: an editor
 * who finds the item disabled with a reason under it learns the state, and an editor who
 * finds it gone concludes the interface lost a feature.
 *
 * @param {object} props
 * @param {import('../lib/page-header.mjs').Offer} props.action
 * @param {() => void} props.onClick
 * @param {string} props.refusalId  The node holding the reason, for a refused item to name.
 * @param {import('react').ReactNode} props.children
 */
function MenuAction({ action, onClick, refusalId, children }) {
  if (action.state === 'absent') return null;

  const refused = action.state === 'refused';
  return (
    <DropdownMenuItem
      disabled={refused}
      // Disabled is not a reason. A reader who cannot see the sentence at the foot of the
      // menu hears it here, on the item it is about.
      aria-describedby={refused ? refusalId : undefined}
      onClick={onClick}
    >
      {children}
    </DropdownMenuItem>
  );
}

/**
 * This page's address on the clipboard.
 *
 * The deep link has been shipped since ticket 109 and no control in this interface has ever
 * offered it, so an editor who wants to send a colleague to a page reads the address bar.
 *
 * The path is made whole against `location` **here rather than by the caller**, because the
 * caller renders on the server too and there is no address there to be relative to. The
 * clipboard wants the whole address: a colleague is being sent this page, and a path is not
 * somewhere a person can be sent.
 *
 * @param {string} href  A path, from `pageHref()`.
 */
async function copyLink(href) {
  const link = new URL(href, location.href).href;
  try {
    await navigator.clipboard.writeText(link);
    announce('The link to this page is copied.');
  } catch (failure) {
    // A clipboard write is refused outright by a browser that has not been given
    // permission, and it fails silently otherwise — which is the one outcome an editor
    // must not read as success, because they will paste the last thing they copied.
    announce(`The link is not copied. ${/** @type {Error} */ (failure).message}`);
  }
}

/** No name, no writing. Attribution must cost nothing, so it is one field. */
export function EditorPrompt({ editor, save }) {
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(submit) => {
        submit.preventDefault();
        const value = new FormData(submit.currentTarget).get('editor');
        if (String(value).trim()) save(String(value));
      }}
    >
      <Input name="editor" defaultValue={editor} placeholder="Your name" />
      {/* Base UI's button is a `type="button"` by default, so the submit is
          declared here rather than assumed. */}
      <Button type="submit" variant="outline">
        {editor ? 'Change the name' : 'Save'}
      </Button>
    </form>
  );
}

/**
 * The banner that stops the worst failure this tool has.
 *
 * Ticket 13: a paused or unreachable project does not show an error — the page is
 * static and still loads, and only the override log stops working. An editor
 * would read an empty list as "nobody has done anything" and a dropped click as
 * "saved". Both destroy trust in the log, and both look exactly like a bug in the
 * comparison rules. So the failure is loud, and the page says so.
 *
 * **What state the log is in is read by `logState()`, and what to say about it is decided
 * here.** The two used to be one cascade, and there were three of them over the same five
 * fields — this one, `whyNotWriting()` and the notes half of a search — free to disagree
 * about whether an unreachable log and an unconfigured one are one thing or two. They are
 * two, and this is the component that says so; the notes half collapses them, which it may
 * do only because this one does not.
 */
export function LogBanner(log) {
  const { state, ready, reason } = logState(log);
  useLogFailureAnnounced(state, reason);

  if (state === 'failed') {
    // Amber, not red. An unreachable log is a status, however bad it is, and
    // ticket 35 keeps red for "production had this and the new site lost it".
    return (
      <Banner tone="warning">
        <strong>The override log does not answer.</strong> The page is read-only, so you cannot lose
        a change that you think is saved.{' '}
        {/*
          A failed read keeps the last good one, so the two cases say different
          things. Telling an editor "no overrides" while their own dismissals are
          on screen is the same lie as showing an empty list.
        */}
        {ready
          ? 'You see the state that was read last; it can be out of date.'
          : 'The log was not read, so you see the snapshot without the overrides.'}{' '}
        ({reason})
      </Banner>
    );
  }
  if (state === 'disconnected') {
    return (
      <Banner tone="caution">
        <strong>No connection to the override log.</strong> {reason} The Fixed tick and Dismiss are
        off; the rest of the log works.
      </Banner>
    );
  }
  if (state === 'reading') return <Banner tone="neutral">The override log is loading…</Banner>;
  return null;
}

/**
 * The banner said out loud, once, when it starts saying it.
 *
 * A log that cannot be written to is the one state in this interface nobody presses their
 * way into: it simply stops answering, or was never configured, and an editor who cannot
 * see the banner goes on ticking rows that are not being written. So it is announced on
 * the **transition**, which is what the ref holds — a render is not an event, and
 * re-announcing on every one of them would leave a screen reader talking over the page.
 *
 * **Two states and not one.** The ticket asks for *read-only*, which is `failed`; an
 * unconfigured project is `disconnected` and is just as unwritable. `LogBanner` above
 * draws both and words them apart, because `log-read.mjs` insists they are two things —
 * and this is that same pair, said out loud.
 *
 * `reading` is not announced. It is progress, and ADR 0019's live-region rule is that the
 * region says outcomes; the loading banner is already on screen for anyone who can see it,
 * and the outcome — read, or read-only — is a beat away either way.
 *
 * @param {ReturnType<typeof logState>['state']} state
 * @param {string | null} reason
 */
function useLogFailureAnnounced(state, reason) {
  const said = useRef(/** @type {string | null} */ (null));

  useEffect(() => {
    if (state === said.current) return;
    said.current = state;
    if (state === 'failed') {
      announce(`The override log does not answer, so this page is read-only. ${reason ?? ''}`.trim());
    }
    if (state === 'disconnected') {
      announce('There is no connection to the override log, so no decision can be made here.');
    }
  }, [state, reason]);
}

/*
 * shadcn's `Alert` gives the shape and the banner shape gives the tone, as ADR 0007
 * requires — so `variant` is refused rather than left at its default, which would paint
 * `bg-card` over the tone. `AlertDescription` paints itself `text-muted-foreground`,
 * which would swallow the banner's own ink, so it is told to inherit instead.
 */
const Banner = ({ tone, children }) => (
  <Alert variant={null} data-wears="banner" data-tone={tone}>
    <AlertDescription className="text-inherit">{children}</AlertDescription>
  </Alert>
);
