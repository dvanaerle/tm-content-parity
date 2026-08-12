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
            {recheck.running ? 'Bezig met hercontrole…' : 'Hercontroleer'}
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
            <strong>De hercontrole is niet uitgevoerd.</strong> {recheck.error} De pagina is
            onveranderd gebleven.
          </AlertDescription>
        </Alert>
      )}

      {log.connected && !editor && (
        <Alert className="bg-muted">
          <AlertDescription>
            Vul je naam in om af te vinken. Elke actie krijgt een naam, zodat niemand het
            oordeel van een collega omgooit zonder te weten van wie het was.
          </AlertDescription>
        </Alert>
      )}

      <Ledger
        report={report}
        findings={derived.findings}
        append={append}
        canWrite={canWrite}
        observationId={report.observationId}
      />

      {/* A restored re-check must not look like a crawl result. */}
      <p className="text-xs text-muted-foreground">
        {source === 'recheck' ? 'Hercontrole van ' : 'Momentopname van '}
        {new Date(report.builtAt).toLocaleString('nl-NL')}
        {' · '}waarneming <code>{report.observationId}</code>
        {!recheckAvailable && ' · hercontrole vereist de lokale service'}
      </p>
    </div>
  );
}
