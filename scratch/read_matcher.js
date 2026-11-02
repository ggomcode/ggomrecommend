import fs from 'fs';

['matcher.py', 'decryptor.py', 'run_full_pipeline.py'].forEach(f => {
  const p = 'D:/Cloud/git/ggomcode/ggomrate/' + f;
  if (fs.existsSync(p)) {
    console.log('=== ' + f + ' ===');
    const txt = fs.readFileSync(p, 'utf8');
    console.log(txt.slice(0, 1500));
  }
});

