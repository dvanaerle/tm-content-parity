/**
 * One paged read of a Supabase table, and the reason it is paged.
 *
 * It was inside `createOverridesPort()` until ticket 08 gave the log a second table. The
 * loop is four lines; what is worth having in one place is the **reasoning**, because a
 * second copy is a second chance to write the version that stops on a short page.
 *
 * **PostgREST caps a select and says nothing when it truncates.** Supabase serves at most
 * `max-rows` — 1,000 by default — per request, and the response is a valid, complete-looking
 * array. A read ordered oldest-first therefore loses its **newest** rows, which are exactly
 * the events somebody just wrote. On 2026-08-17 the `nl` store held 1,148 override events and
 * the app could see 1,000 of them, so 148 decisions were invisible and every check-off made
 * after the cap appeared to do nothing. That is the defect this exists to prevent, and it is
 * why a small table gets the same loop as a large one: the table that is small today is the
 * one nobody re-reads this comment for.
 *
 * **An empty page ends it, never a short one.** A short page does not mean the end of the
 * table — it also means the server's cap is below the page this asks for, and a loop that
 * stopped there would truncate exactly as the unpaged read did, quietly, and worst on the
 * projects with the smallest cap. Ending on empty costs one request per read and cannot lose
 * a row.
 *
 * **`id` is the second sort key.** Paging needs a total order and `created_at` is not one:
 * two rows written in the same microsecond could swap between requests, which is how a paged
 * read loses one row and repeats another. It is the tiebreak `isLater()` in `state.mjs` uses,
 * for the same reason.
 */

/** Rows asked for per request. The loop must not depend on it — see the note above. */
const PAGE = 1000;

/**
 * Every row of a table, oldest first.
 *
 * **Loud on purpose.** A failure throws. An empty list is an answer — *nobody has done
 * anything* — and a failed read must never be able to say that.
 *
 * @param {object} input
 * @param {any} input.client                  The Postgrest client.
 * @param {string} input.table
 * @param {string} input.columns
 * @param {string} input.what                 What to call the table in a failure, in words a
 *                                            reader of the interface would recognise.
 * @param {(query: any) => any} [input.narrow] Applied to each request, for a caller reading
 *                                            one store page rather than the whole table.
 * @returns {Promise<any[]>}
 */
export async function readAllRows({ client, table, columns, what, narrow = (query) => query }) {
  /** @type {any[]} */
  const rows = [];

  for (;;) {
    const { data, error } = await narrow(
      client
        .from(table)
        .select(columns)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(rows.length, rows.length + PAGE - 1),
    );
    if (error) throw new Error(`Could not read ${what}: ${error.message}`, { cause: error });

    const page = data ?? [];
    rows.push(...page);
    if (page.length === 0) break;
  }

  return rows;
}
