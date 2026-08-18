// [DEBUG-9c1e] Read-only: the true row count per store, paged past the cap.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of readFileSync('web/.env.local', 'utf8').split(/\r?\n/)) {
  if (!line.trim() || line.startsWith('#')) continue;
  const i = line.indexOf('=');
  process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

const client = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

for (const store of ['nl', 'be', 'uk']) {
  const { count } = await client
    .from('overrides')
    .select('id', { count: 'exact', head: true })
    .eq('store', store);
  console.log(store.padEnd(4), 'true rows:', count);
}

// What the app cannot see on nl: everything after the 1000th oldest row.
const { data } = await client
  .from('overrides')
  .select('created_at, action, page, finding_id')
  .eq('store', 'nl')
  .order('created_at', { ascending: true })
  .range(1000, 1400);
console.log('\nnl rows beyond the cap:', data.length);
console.log('first invisible:', data[0]?.created_at, data[0]?.action, data[0]?.page);
console.log('last  invisible:', data.at(-1)?.created_at, data.at(-1)?.action, data.at(-1)?.page);
