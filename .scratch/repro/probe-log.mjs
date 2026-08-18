// [DEBUG-9c1e] Read-only probe: how many events does the port actually return per store?
import { readFileSync } from 'node:fs';
import { createOverridesPort } from '../../overrides/supabase.mjs';

for (const line of readFileSync('web/.env.local', 'utf8').split(/\r?\n/)) {
  if (!line.trim() || line.startsWith('#')) continue;
  const i = line.indexOf('=');
  process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

const port = createOverridesPort({
  url: process.env.PUBLIC_SUPABASE_URL,
  anonKey: process.env.PUBLIC_SUPABASE_ANON_KEY,
});

for (const store of ['nl', 'be', 'be_fr', 'de', 'fr', 'uk']) {
  const events = await port.readEventsForStore(store);
  const newest = events.at(-1);
  console.log(
    store.padEnd(6),
    String(events.length).padStart(5),
    'newest:',
    newest?.createdAt ?? '—',
  );
}
