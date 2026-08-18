// [DEBUG-9c1e] Read-only: the user's three findings — are their events inside the cap?
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

const IDS = {
  bedrijfsinformatie: '-6SCrFie8RCrGq9R',
  carport: 'p4oWJt61oZ-qfWfo',
  'fotogalerij/upload-fotos': '_F9ZRzWw1oVXZ19V',
};

// The 1000 rows the app can actually see.
const { data: visible } = await client
  .from('overrides')
  .select('finding_id')
  .eq('store', 'nl')
  .order('created_at', { ascending: true })
  .range(0, 999);
const seen = new Set(visible.map((r) => r.finding_id));

for (const [page, id] of Object.entries(IDS)) {
  const { data } = await client
    .from('overrides')
    .select('created_at, action, editor')
    .eq('store', 'nl')
    .eq('finding_id', id);
  for (const row of data) {
    console.log(
      page.padEnd(26),
      row.action.padEnd(10),
      row.created_at,
      seen.has(id) ? 'VISIBLE to the app' : '*** INVISIBLE (past the 1000 cap) ***',
    );
  }
  if (data.length === 0) console.log(page.padEnd(26), 'no event at all');
}
