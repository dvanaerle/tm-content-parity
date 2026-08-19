/**
 * What the extractor reads, as one number, and the gate that refuses an extract
 * written by an older reading of it (ticket 94).
 *
 * A field added to `PageMeta` does not reach an extract that is already on disk. It
 * reads back as `undefined`, which folds to `null` on **both** sides, and a compare
 * of two nulls is `same` — so the head panel goes green on a page whose head nobody
 * has looked at since the field existed. That is silence about a difference, which is
 * the one failure this tool cannot have.
 *
 * So the extract says which reading produced it, and a reader that wants a newer one
 * stops. The number is bumped whenever the extractor starts or stops reading
 * something a comparison uses. It is **not** a schema version for the whole file: a
 * change that only adds a diagnostic tells a comparison nothing, and bumping for it
 * would make everyone re-crawl for a number nobody reads.
 *
 * Pure and importing nothing, because both `crawl/` (which writes the stamp) and
 * `compare/` (which refuses on it) need it, and neither may reach the other.
 */

/**
 * 1 was every extract up to ticket 94: five fields from the head, with the robots
 * string thrown away by the `noindex` test.
 *
 * 2 is ticket 94: `robots` kept beside the boolean, and `keywords` added. Ticket 92
 * refused `metaTitle`.
 */
export const EXTRACT_VERSION = 2;

/**
 * An extract too old for the comparison that is reading it.
 *
 * Named, because the crawl and the compare stage are two commands and this one is
 * answered by running the other, so the message has to name the command.
 *
 * **Not `Stale`.** `CONTEXT.md` gives that word one meaning — a page review made
 * against a page whose findings changed after it — and this is not that. An extract
 * is not a judgement and nothing here goes stale on a person's behalf.
 */
export class ExtractTooOldError extends Error {
  name = 'ExtractTooOldError';

  /**
   * @param {string} where    `store/page side`, so a run of 448 pages names the file.
   * @param {number} version  What the extract declares.
   */
  constructor(where, version) {
    super(
      `${where}: extract version ${version}, and this build reads ${EXTRACT_VERSION}. ` +
        'The head fields it lacks would compare as equal and report the page as clean. ' +
        'Re-crawl it: node crawl/21-crawl-store.mjs <store> --force',
    );
  }
}

/**
 * Refuse an extract below the current version.
 *
 * An extract written before the stamp existed carries no version at all, and that is
 * the case this exists for — it is read as 1, which is what it is.
 *
 * Below, and not *other than*. A **newer** extract carries every field this build
 * reads and then some, so nothing it holds can compare as equal by being absent —
 * which is the whole failure this gate is for. It passes.
 *
 * @param {import('../compare/contract.mjs').PageExtract} extract
 * @returns {void}
 */
export function assertExtractCurrent(extract) {
  const version = extract.extractVersion ?? 1;
  if (version >= EXTRACT_VERSION) return;
  throw new ExtractTooOldError(`${extract.store}/${extract.page} ${extract.side}`, version);
}
