import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('Testing insert to rural_applications...');
  
  // Get an enrolled student
  const { data: st, error: stErr } = await supabase.from('enrolled_students').select('id, student_code').limit(1);
  if (stErr || !st || st.length === 0) {
    console.error('Failed to fetch student:', stErr);
    return;
  }
  const studentId = st[0].id;
  console.log(`Using student: ${st[0].student_code} (${studentId})`);
  
  const payload = {
    student_id: studentId,
    choice_number: 1,
    term_type: '수시',
    medical_type: '없음',
    region: '서울',
    univ_name: '테스트대학',
    department: '테스트학과',
    track_type: '테스트유형',
    track_name: '테스트전형',
    recruitment_quota: '10',
    eval_method: '서류',
    suneung_minimum: '없음',
    remarks: '테스트비고',
    is_warning_acknowledged: false,
    status: 'submitted',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('rural_applications').insert([payload]);
  
  if (error) {
    console.error('Insert Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Insert Success:', data);
    
    // clean up
    await supabase.from('rural_applications').delete().eq('student_id', studentId).eq('univ_name', '테스트대학');
  }
}

testInsert();
