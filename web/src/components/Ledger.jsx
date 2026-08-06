import { useState } from 'react';

// Variant A: a tabbed ledger, production and the new site side by side.
// This is the scaffold only. Ticket 12 tests whether seven tabs still read
// well, and the panels get their content after that.
const TABS = ['Diff', 'Outline', 'Links', 'Images', 'Content', 'Meta', 'Tasks'];

export default function Ledger({ report }) {
  const [tab, setTab] = useState(TABS[0]);

  return (
    <section className="rounded border border-slate-200 bg-white">
      <nav className="flex gap-1 border-b border-slate-200 px-2" role="tablist">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={name === tab}
            onClick={() => setTab(name)}
            className={`px-3 py-2 text-sm ${
              name === tab ? 'border-b-2 border-blue-700 font-semibold' : 'text-slate-600'
            }`}
          >
            {name}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-2 gap-4 p-4" role="tabpanel">
        <Column side="Productie" extract={report.sides.production} />
        <Column side="Nieuw" extract={report.sides.new} />
      </div>

      <p className="border-t border-slate-200 px-4 py-2 text-sm text-slate-500">
        {report.findings.length} findings. The {tab} panel is not built yet.
      </p>
    </section>
  );
}

function Column({ side, extract }) {
  return (
    <div>
      <h2 className="mb-1 text-sm font-semibold">{side}</h2>
      <a className="text-sm text-blue-700 underline" href={extract.url}>
        {extract.url}
      </a>
      <p className="text-sm text-slate-500">{extract.elements.length} elements</p>
    </div>
  );
}
