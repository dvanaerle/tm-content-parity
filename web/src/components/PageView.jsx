import { useCallback, useState } from 'react';
import Ledger from './Ledger.jsx';
import { EditorPrompt, LogBanner, PageBar, ReviewControl } from './Progress.jsx';
import { useEditor, useOverrides } from '../lib/overrides.mjs';
import { useRecheck, useRecheckAvailable } from '../lib/recheck.mjs';

/**
 * The island that owns one store page.
 *
 * It holds the **report** in state rather than reading the prop directly,
 * because a Recheck replaces it: the same component then re-derives every state
 * and every number against a new observation, and a fix claim made against the
 * old one has to prove itself. A Recheck that fails replaces nothing.
 */
export default function PageView({ report: built }) {
  const [report, setReport] = useState(built);
  const { editor, save } = useEditor();
  const log = useOverrides({ report, editor });
  const recheckAvailable = useRecheckAvailable();

  const onReport = useCallback((fresh) => setReport(fresh), []);
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
          <button
            type="button"
            disabled={recheck.running}
            onClick={() => recheck.run(report.store, report.page)}
            className="rounded bg-blue-700 px-3 py-1.5 text-sm text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {recheck.running ? 'Bezig met hercontrole…' : 'Hercontroleer'}
          </button>
        )}

        <EditorPrompt editor={editor} save={save} />
      </div>

      <LogBanner
        connected={log.connected}
        notConnectedReason={log.notConnectedReason}
        ready={log.ready}
        error={log.error}
      />

      {recheck.error && (
        <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <strong>De hercontrole is niet uitgevoerd.</strong> {recheck.error} De pagina is
          onveranderd gebleven.
        </p>
      )}

      {log.connected && !editor && (
        <p className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Vul je naam in om af te vinken. Elke actie krijgt een naam, zodat niemand het
          oordeel van een collega omgooit zonder te weten van wie het was.
        </p>
      )}

      <Ledger
        report={report}
        findings={derived.findings}
        append={append}
        canWrite={canWrite}
        observationId={report.observationId}
      />

      <p className="text-xs text-slate-500">
        Momentopname van {new Date(report.builtAt).toLocaleString('nl-NL')}
        {' · '}waarneming <code>{report.observationId}</code>
        {!recheckAvailable && ' · hercontrole vereist de lokale service'}
      </p>
    </div>
  );
}
