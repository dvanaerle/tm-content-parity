import { useMemo, useState } from 'react';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import {
  readingEventFor,
  separateEventFor,
  sharedEventFor,
} from '../../../overrides/record-layout.mjs';
import { recordLayoutScreen } from '../lib/record-layout-screen.mjs';
import { useRecordLayout } from '../lib/record-layout.mjs';
import { useEditor } from '../lib/overrides.mjs';

/**
 * The record layout: which store pages are their own Magento record, kept here by whoever
 * reads the grid (ticket 08).
 *
 * The values are `recordLayoutScreen()`'s and this chooses markup and tone, in the manner
 * `BlockList.jsx` renders `blockReading()`. Nothing is decided here.
 *
 * **Nothing is typed that can be picked.** The page comes out of a `<select>` built from the
 * corpus, so the typo the committed file needed a build guard to catch cannot be made. What is
 * typed is the record id and the reason, which the grid alone knows.
 *
 * **It is a fact and not a judgement**, and the words have to keep saying so: an entry is
 * *added* and *withdrawn*, never *dismissed*; it carries a *reason* and never a *note*; and
 * nothing here sits in a bucket or moves a count.
 */

/** @param {{ label: string, children: any }} props */
function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/**
 * The form that adds one entry.
 *
 * @param {object} props
 * @param {import('../lib/record-layout-screen.mjs').CorpusPage[]} props.addable
 * @param {(event: object) => Promise<boolean>} props.append
 * @param {boolean} props.busy
 */
function AddEntry({ addable, append, busy }) {
  const [at, setAt] = useState('');
  const [record, setRecord] = useState('');
  const [reason, setReason] = useState('');
  const [refused, setRefused] = useState('');

  const ready = at && record.trim() && reason.trim();

  async function add() {
    const [store, ...rest] = at.split('/');
    try {
      const event = separateEventFor({
        store,
        page: rest.join('/'),
        record: Number.parseInt(record, 10),
        reason,
      });
      setRefused('');
      if (await append(event)) {
        setAt('');
        setRecord('');
        setReason('');
      }
    } catch (cause) {
      setRefused(String(cause?.message ?? cause));
    }
  }

  return (
    <form
      className="grid gap-2 sm:grid-cols-[2fr_1fr_2fr_auto] sm:items-end"
      onSubmit={(submit) => {
        submit.preventDefault();
        if (ready) add();
      }}
    >
      <Field label="Store page">
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={at}
          onChange={(change) => setAt(change.target.value)}
        >
          <option value="">Choose a store page…</option>
          {addable.map((one) => (
            <option key={`${one.store}/${one.page}`} value={`${one.store}/${one.page}`}>
              {one.store} / {one.page}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Magento record">
        <Input
          inputMode="numeric"
          value={record}
          placeholder="543"
          onChange={(change) => setRecord(change.target.value)}
        />
      </Field>
      <Field label="Why it is its own record">
        <Input
          value={reason}
          placeholder="Belgian legal text."
          onChange={(change) => setReason(change.target.value)}
        />
      </Field>
      <Button type="submit" size="sm" disabled={!ready || busy}>
        Add
      </Button>
      {refused && (
        <p data-wears="ink" data-tone="caution" className="text-xs sm:col-span-4">
          {refused}
        </p>
      )}
    </form>
  );
}

/**
 * One entry, and the press that withdraws it.
 *
 * The withdrawal asks for a reason because *the merge landed* and *the earlier reading was
 * wrong* are different facts, and the next reader has to be able to tell them apart.
 *
 * @param {object} props
 * @param {any} props.entry
 * @param {(event: object) => Promise<boolean>} props.append
 * @param {boolean} props.canWrite
 * @param {boolean} props.busy
 */
function Entry({ entry, append, canWrite, busy }) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-3 align-top font-medium">
        {entry.store} / {entry.page}
      </td>
      <td className="py-2 pr-3 align-top text-muted-foreground tabular-nums">{entry.record}</td>
      <td className="py-2 pr-3 align-top">{entry.reason}</td>
      <td className="py-2 pr-3 align-top text-xs text-muted-foreground">
        {entry.editor}, {entry.writtenAt.slice(0, 10)}
      </td>
      <td className="py-2 text-right align-top">
        {canWrite && !withdrawing && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={busy}
            onClick={() => setWithdrawing(true)}
            title="One record serves both stores again. The merge has landed in Magento."
          >
            Shared again…
          </Button>
        )}
        {canWrite && withdrawing && (
          <span className="flex items-center justify-end gap-1">
            <Input
              className="h-8 w-48"
              value={reason}
              placeholder="The merge landed."
              onChange={(change) => setReason(change.target.value)}
            />
            <Button
              type="button"
              size="xs"
              disabled={busy || !reason.trim()}
              onClick={async () => {
                const event = sharedEventFor({ store: entry.store, page: entry.page, reason });
                if (await append(event)) setWithdrawing(false);
              }}
            >
              Withdraw
            </Button>
            <Button type="button" variant="ghost" size="xs" onClick={() => setWithdrawing(false)}>
              Cancel
            </Button>
          </span>
        )}
      </td>
    </tr>
  );
}

/**
 * The reading of the grid: what it says, how old it is, and the press that records a new one.
 *
 * @param {object} props
 * @param {any} props.reading
 * @param {(event: object) => Promise<boolean>} props.append
 * @param {boolean} props.canWrite
 * @param {boolean} props.busy
 */
function Reading({ reading, append, canWrite, busy }) {
  const [day, setDay] = useState('');

  return (
    <section className="mb-6">
      <h2 className="mb-1 text-sm font-semibold">The reading</h2>
      {reading ? (
        <p className="mb-2 text-sm">
          The grid was read on <strong className="font-medium">{reading.takenOn}</strong>
          {reading.days === null ? '' : ` — ${reading.days} days ago`}, by {reading.editor}. A store
          page the log first saw after that day is{' '}
          <strong className="font-medium">not shared</strong>, because this reading cannot have seen
          it.
        </p>
      ) : (
        <p data-wears="ink" data-tone="caution" className="mb-2 text-sm">
          The grid has never been read, so{' '}
          <strong className="font-medium">no page is shared</strong> and no fix claim travels. The
          list below says which pages are separate records; it means nothing until a reading dates
          it.
        </p>
      )}
      {canWrite && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={async (submit) => {
            submit.preventDefault();
            if (await append(readingEventFor(day))) setDay('');
          }}
        >
          <Field label="The day the grid was read">
            <Input
              type="date"
              className="w-44"
              value={day}
              onChange={(change) => setDay(change.target.value)}
            />
          </Field>
          <Button type="submit" size="sm" variant="outline" disabled={busy || !day}>
            Record a reading
          </Button>
        </form>
      )}
    </section>
  );
}

/**
 * @param {object} props
 * @param {import('../lib/record-layout-screen.mjs').CorpusPage[]} props.storePages Every store
 *   page the corpus holds, from the build.
 */
export default function RecordLayout({ storePages }) {
  const { editor } = useEditor();
  const { layout, append, read, error, busy, canWrite } = useRecordLayout({ editor });
  const view = useMemo(() => recordLayoutScreen({ layout, storePages }), [layout, storePages]);

  if (error) {
    return (
      <p data-wears="ink" data-tone="warning" className="text-sm">
        The record layout could not be read, so this screen says nothing rather than saying the grid
        has never been read. {error}
      </p>
    );
  }

  if (!read) return <p className="text-sm text-muted-foreground">Reading the record layout…</p>;

  return (
    <div>
      <p className="mb-6 max-w-prose text-sm text-muted-foreground">
        One Magento record on the new site can serve both stores of a language block, so one edit
        corrects both. No crawl can see that, so it is read off the admin grid by a person and kept
        here. This list is the <strong className="font-medium">complement</strong>: the store pages
        that are their <em>own</em> record. Everything else inside a block is shared.
      </p>

      <Reading reading={view.reading} append={append} canWrite={canWrite} busy={busy} />

      {view.strays.length > 0 && (
        <section className="mb-6" data-wears="ink" data-tone="caution">
          <h2 className="mb-1 text-sm font-semibold">
            {view.strays.length} {view.strays.length === 1 ? 'entry names' : 'entries name'} a page
            the log no longer has
          </h2>
          <p className="mb-2 max-w-prose text-sm">
            Housekeeping, not a fault in the log: these grant nothing either way. Each one is a
            record to disable in Magento, or a page that has been renamed — and a renamed page reads
            as not shared until the grid is read again.
          </p>
          <ul className="text-sm">
            {view.strays.map((one) => (
              <li key={`${one.store}/${one.page}`}>
                {one.store} / {one.page} — record {one.record}, {one.reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-1 text-sm font-semibold">
          {view.entries.length} separate {view.entries.length === 1 ? 'record' : 'records'}
        </h2>
        {view.entries.length === 0 ? (
          <p className="mb-3 text-sm text-muted-foreground">
            Nothing here yet. While this list is empty, every page of a block that the reading saw
            is shared.
          </p>
        ) : (
          <table className="mb-3 w-full text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th className="pr-3 pb-1 font-medium">Store page</th>
                <th className="pr-3 pb-1 font-medium">Record</th>
                <th className="pr-3 pb-1 font-medium">Why</th>
                <th className="pr-3 pb-1 font-medium">Written</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {view.entries.map((entry) => (
                <Entry
                  key={`${entry.store}/${entry.page}`}
                  entry={entry}
                  append={append}
                  canWrite={canWrite}
                  busy={busy}
                />
              ))}
            </tbody>
          </table>
        )}

        {canWrite ? (
          <AddEntry addable={view.addable} append={append} busy={busy} />
        ) : (
          <p className="text-xs text-muted-foreground">
            Give your name at the top of a store page to add an entry. Every entry carries a name.
          </p>
        )}
      </section>
    </div>
  );
}
