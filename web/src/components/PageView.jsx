import { useMemo, useRef, useState } from 'react';
import { PageDetailsDialog } from './Annotate.jsx';
import Ledger from './Ledger.jsx';
import {
  EditorPrompt,
  LogBanner,
  PageBar,
  PageLine,
  PageMenu,
  RecheckButton,
} from './Progress.jsx';
import { Alert, AlertDescription } from './ui/alert.jsx';
import { logState } from '../lib/log-read.mjs';
import { NO_EDITOR, useEditor, useOverrides } from '../lib/overrides.mjs';
import { usePageReport, useRecheck, useRecheckAvailable } from '../lib/recheck.mjs';
import { moment } from '../lib/dates.mjs';
import { headerReading } from '../lib/page-header.mjs';
import { pageHref } from '../lib/page-url.mjs';

/**
 * The island that owns one store page.
 *
 * It holds the **report** in state rather than reading the prop directly,
 * because a Recheck replaces it: the same component then re-derives every state
 * and every number against a new observation, and a fix claim made against the
 * old one has to prove itself. A Recheck that fails replaces nothing.
 *
 * A saved re-check from an earlier press replaces it the same way (ticket 71),
 * and the footer says which of the two the reader is looking at.
 */
export default function PageView({
  report: built,
  sibling = null,
  firstSeen = {},
  closedWith = {},
}) {
  const { editor, save } = useEditor();
  const recheckAvailable = useRecheckAvailable();
  const { report, source, onReport } = usePageReport(built, recheckAvailable);
  const log = useOverrides({ report, editor, closedWith });

  const recheck = useRecheck(onReport);
  const [detailsOpen, setDetailsOpen] = useState(false);
  /* Where the dialog hands the focus back to. The menu item that opened it has unmounted by
     the time it closes, so without this an editor lands on the body. */
  const menuTrigger = useRef(null);

  const { derived, append, canWrite } = log;

  /*
   * What the header may offer, decided before anything is drawn (ui-polish 08). It used to
   * be worked out in the four places that drew it, so the only way to ask whether an
   * editor could act on this page was to render the page.
   */
  const header = headerReading({
    review: derived.review,
    annotations: derived.annotations,
    notWritingReason: log.notWritingReason,
    recheckAvailable,
  });

  /*
   * The run log's dates, joined on here rather than in each table, so the ledger and the
   * content view cannot come to disagree about which date belongs to which id. It is a
   * display field: no bar counts it, and a re-check mints ids the committed index has
   * never seen, which is why a finding may carry no date at all.
   */
  const findings = useMemo(
    () =>
      derived.findings.map((finding) => ({
        ...finding,
        firstSeen: firstSeen[finding.id],
        historyNote: derived.history[finding.id],
      })),
    [derived.findings, derived.history, firstSeen],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-64 flex-1">
          <PageBar bar={derived.bar} ready={log.ready} />
        </div>

        {/* The review, the priority and the note **read** on one line (PRD story 27). Each
            of them used to be a control drawn open here on every page. */}
        <PageLine line={header.line} />

        <RecheckButton
          action={header.actions.recheck}
          recheck={recheck}
          store={report.store}
          page={report.page}
        />

        {/* Everything an editor touches on a minority of pages, in one place they can look
            for it. `Re-check` stays outside it, above. */}
        <PageMenu
          actions={header.actions}
          refusal={header.refusal}
          href={pageHref(report.store, report.page)}
          triggerRef={menuTrigger}
          onEditDetails={() => setDetailsOpen(true)}
          onMarkReviewed={() =>
            append({ scope: 'page', action: 'reviewed', findingSetHash: report.findingSetHash })
          }
        />

        <EditorPrompt editor={editor} save={save} />
      </div>

      <PageDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        annotations={derived.annotations}
        findingSetHash={report.findingSetHash}
        append={append}
        actions={header.actions}
        finalFocus={menuTrigger}
        busy={log.busy}
      />

      <LogBanner
        connected={log.connected}
        notConnectedReason={log.notConnectedReason}
        ready={log.ready}
        error={log.error}
      />

      {/* An `Alert` and not the library's `variant="destructive"`: the tone of a
          message is the palette's to say, and this one is `caution` — a condition
          an editor decides about, not a loss. */}
      {recheck.error && (
        <Alert variant={null} data-wears="banner" data-tone="caution">
          {/* `text-current` because `AlertDescription` hard-codes `text-muted-foreground`,
              which would repaint the banner's ink in the interface's grey and lose the
              tone. The structure is worth keeping over dropping the description entirely:
              it is what puts the message in the alert's accessible name. */}
          <AlertDescription className="text-current">
            <strong>The re-check did not run.</strong> {recheck.error} The page is unchanged.
          </AlertDescription>
        </Alert>
      )}

      {log.connected && !editor && (
        <Alert className="bg-muted">
          <AlertDescription>{NO_EDITOR}</AlertDescription>
        </Alert>
      )}

      <Ledger
        report={report}
        findings={findings}
        /* Whether the page has stopped changing shape, which is what a landing has to
           wait for: the override log arrives a beat after the first paint and adds a
           control to every decided row, so a scroll taken before it lands is measured
           against a layout that is about to grow. An unconnected log settles
           immediately — it is never going to answer. */
        settled={log.ready || !log.connected}
        append={append}
        canWrite={canWrite}
        /* *Not yet*, and never *not ever*: the override log is connected and has not
           answered. It is what lets a row reserve the space its control will need, and it
           is deliberately narrower than `!canWrite` — a log that will never answer must
           not leave a dead button on every row. `logState()` is the one reading of the
           log's four states, so this cannot come to disagree with the banner above. */
        pending={logState(log).state === 'reading'}
        observationId={report.observationId}
        /* The sibling page and its production blocks, matched and read at build time
           (ticket 04). `null` where this store is in no language block, or where the
           block has no counterpart for this page — and the tab is then absent rather
           than empty. It is **not** replaced by a re-check: a re-check crawls this
           store's page, and the sibling is a different store's. */
        sibling={sibling}
      />

      {/* A restored re-check must not look like a crawl result. */}
      <p className="text-xs text-muted-foreground">
        {source === 'recheck' ? 'Re-check of ' : 'Snapshot of '}
        {moment(report.builtAt)}
        {' · '}observation <code>{report.observationId}</code>
        {!recheckAvailable && ' · a re-check needs the local service'}
      </p>
    </div>
  );
}
