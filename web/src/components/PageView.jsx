import Ledger from './Ledger.jsx';
import { EditorPrompt, LogBanner, PageBar, ReviewControl } from './Progress.jsx';
import { Alert, AlertDescription } from './ui/alert.jsx';
import { Button } from './ui/button.jsx';
import { BANNER, CHROME } from '../lib/palette.mjs';
import { useEditor, useOverrides } from '../lib/overrides.mjs';
import { usePageReport, useRecheck, useRecheckAvailable } from '../lib/recheck.mjs';
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
export default function PageView({ report: built }) {
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
          message is the palette's to say, and this one is `attention` — a condition
          an editor decides about, not a loss. */}
      {recheck.error && (
        <Alert className={BANNER.attention}>
          {/* `text-current` because `AlertDescription` hard-codes `text-muted-foreground`,
              which would repaint the banner's ink in the interface's grey and lose the
              tone. The structure is worth keeping over dropping the description entirely:
              it is what puts the message in the alert's accessible name. */}
          <AlertDescription className="text-current">
            <strong>The re-check did not run.</strong> {recheck.error} The page is
            unchanged.
          </AlertDescription>
        </Alert>
      )}

      {log.connected && !editor && (
        <Alert className="bg-muted">
          <AlertDescription>
            Give your name to decide. Each action carries a name, so nobody overturns the
            judgement of a colleague without knowing whose it was.
          </AlertDescription>
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
      />

      {/* A restored re-check must not look like a crawl result. */}
      <p className="text-xs text-muted-foreground">
        {source === 'recheck' ? 'Re-check of ' : 'Snapshot of '}
        {new Date(report.builtAt).toLocaleString('en-GB')}
        {' · '}observation <code>{report.observationId}</code>
        {!recheckAvailable && ' · a re-check needs the local service'}
      </p>
    </div>
  );
}
