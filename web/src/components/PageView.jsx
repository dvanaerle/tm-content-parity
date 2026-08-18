import { PageAnnotations } from './Annotate.jsx';
import Ledger from './Ledger.jsx';
import { EditorPrompt, LogBanner, PageBar, ReviewControl } from './Progress.jsx';
import { Alert, AlertDescription } from './ui/alert.jsx';
import { Button } from './ui/button.jsx';
import { BANNER, CHROME } from '../lib/palette.mjs';
import { NO_EDITOR, useEditor, useOverrides } from '../lib/overrides.mjs';
import { usePageReport, useRecheck, useRecheckAvailable } from '../lib/recheck.mjs';
import { moment } from '../lib/dates.mjs';
import { cn } from '../lib/utils.js';

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
export default function PageView({ report: built, sibling = null }) {
  const { editor, save } = useEditor();
  const recheckAvailable = useRecheckAvailable();
  const { report, source, onReport } = usePageReport(built, recheckAvailable);
  const log = useOverrides({ report, editor });

  const recheck = useRecheck(onReport);

  const { derived, append, canWrite } = log;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-64 flex-1">
          <PageBar bar={derived.bar} ready={log.ready} />
        </div>

        <ReviewControl
          review={derived.review}
          findingSetHash={report.findingSetHash}
          append={append}
          canWrite={canWrite}
        />

        {/* Ticket 83. Beside the review because both are about **this page** rather than
            about a finding on it — and unlike the review, neither of them moves a count. */}
        <PageAnnotations
          annotations={derived.annotations}
          append={append}
          canWrite={canWrite}
          busy={log.busy}
        />

        {/* Feature detection: absent on the webhost, never broken. */}
        {recheckAvailable && (
          <Button
            disabled={recheck.running}
            onClick={() => recheck.run(report.store, report.page)}
            className={cn('text-white', CHROME.button)}
          >
            {recheck.running ? 'Re-checking…' : 'Re-check'}
          </Button>
        )}

        <EditorPrompt editor={editor} save={save} />
      </div>

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
        <Alert className={BANNER.caution}>
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
        findings={derived.findings}
        /* Whether the page has stopped changing shape, which is what a landing has to
           wait for: the override log arrives a beat after the first paint and adds a
           control to every decided row, so a scroll taken before it lands is measured
           against a layout that is about to grow. An unconnected log settles
           immediately — it is never going to answer. */
        settled={log.ready || !log.connected}
        append={append}
        canWrite={canWrite}
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
