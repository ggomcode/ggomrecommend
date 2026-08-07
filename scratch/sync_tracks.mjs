import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import XLSX from 'xlsx';

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function sync() {
  const sheetId = '1SBW1v1B02enRpDcEmIc98wOtyRgnthYkZbONS_byYaU';
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
  console.log('Fetching XLSX from:', exportUrl);
  const res = await fetch(exportUrl);
  const arrayBuffer = await res.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  console.log('Parsed rows count:', rows.length);
  const tracksToInsert = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const termType = String(row[0] || '').trim();
    if (termType !== '수시' && termType !== '정시') continue;

    tracksToInsert.push({
      term_type: termType,
      medical_type: String(row[1] || '없음').trim(),
      region: String(row[2] || '').trim(),
      univ_name: String(row[3] || '').trim(),
      track_type: String(row[4] || '').trim(),
      track_name: String(row[5] || '').trim(),
      recruitment_quota: String(row[6] || '').trim(),
      eval_method: String(row[7] || '').trim(),
      suneung_minimum: String(row[8] || '').trim(),
      remarks: String(row[9] || '').trim()
    });
  }

  console.log('Valid tracks to insert:', tracksToInsert.length);
  if (tracksToInsert.length > 0) {
    const { error: delErr } = await supabase.from('rural_tracks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Delete error:', delErr);
    const { data, error } = await supabase.from('rural_tracks').insert(tracksToInsert).select('*');
    console.log('Inserted count:', data?.length, 'Error:', error);
  }
}

sync();
