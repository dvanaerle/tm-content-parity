// [DEBUG-9c1e] The store strip, derived from the capped 1000 events vs all of them.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { deriveStoreState } from '../../overrides/state.mjs';
import { toEvent } from '../../overrides/supabase.mjs';
import { loadSummaries } from '../../web/src/lib/reports.mjs';

for (const line of readFileSync('web/.env.local', 'utf8').split(/\r?\n/)) {
  if (!line.trim() || line.startsWith('#')) continue;
  const i = line.indexOf('=');
  process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

const client = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const all = [];
for (let from = 0; ; from += 1000) {
  const { data } = await client
    .from('overrides')
    .select('*')
    .eq('store', 'nl')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .range(from, from + 999);
  if (!data.length) break;
  all.push(...data.map(toEvent));
}

const pages = (await loadSummaries('nl')).filter((p) => p.comparable);
const strip = (events) => deriveStoreState({ reports: pages, events }).buckets;

console.log('events the app could see before the fix:', 1000, '  after:', all.length);
console.log('before (capped) :', strip(all.slice(0, 1000)));
console.log('after  (paged)  :', strip(all));
