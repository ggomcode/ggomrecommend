import fs from 'fs';

const files = ['README.md', 'run_full_pipeline.py', 'multi_year_matcher.py'];
for (const f of files) {
  const p = 'D:/Cloud/git/ggomcode/ggomrate/' + f;
  if (fs.existsSync(p)) {
    console.log('=== ' + f + ' ===');
    const txt = fs.readFileSync(p, 'utf8');
    console.log(txt.slice(0, 1000));
  }
}

