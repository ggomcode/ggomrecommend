import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let envText = '';
try {
  envText = fs.readFileSync('.env', 'utf8');
} catch (e) {
  console.log('Cannot read .env:', e.message);
}

const env = envText.split('\n').reduce((acc, line) => { 
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      acc[k] = v;
    }
  }
  return acc; 
}, {});

console.log('Supabase URL present:', !!env.VITE_SUPABASE_URL);
if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) {
  const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  
  // 1. Check timeline_rounds
  const { data: rounds, error: rErr } = await sb.from('timeline_rounds').select('*').order('id');
  console.log('Timeline rounds in DB:', rounds, 'error:', rErr?.message);

  // 2. Check applications count by round
  const { data: apps, error: aErr } = await sb.from('applications').select('id, round, is_recommended, is_abandoned');
  console.log('Total applications in DB:', apps ? apps.length : 0, 'error:', aErr?.message);
  if (apps && apps.length > 0) {
    const roundCount = {};
    apps.forEach(a => {
      roundCount[a.round] = (roundCount[a.round] || 0) + 1;
    });
    console.log('Applications by round:', roundCount);
    const recCount = apps.filter(a => a.is_recommended).length;
    console.log('Confirmed/recommended count:', recCount);
  }

  // 3. Check config
  const { data: configs } = await sb.from('config').select('*');
  console.log('Configs in DB:', configs);
}

