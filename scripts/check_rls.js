import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envText = fs.readFileSync(resolve(__dirname, '../.env'), 'utf8');
const env = envText.split('\n').reduce((acc, line) => { 
  const [k, v] = line.split('='); 
  if(k) acc[k] = v?.trim(); 
  return acc; 
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { error } = await supabase.from('rural_applications').insert([{
    student_id: '6fbaaf91-4cf5-4e31-897b-89da59dbddc8',
    choice_number: 99,
    term_type: '수시',
    medical_type: '없음',
    region: '서울',
    univ_name: 'test',
    department: 'test',
    track_type: 'test',
    track_name: 'test',
    recruitment_quota: '1',
    eval_method: 'test',
    suneung_minimum: 'test',
    remarks: 'test',
    is_warning_acknowledged: false,
    status: 'submitted'
  }]);
  console.log('Error with 99:', error);
}
check();
