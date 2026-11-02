import fs from 'fs';

['check_issues.js', 'check_patterns.js', 'test_parser.js'].forEach(f => {
  const p = 'scratch/' + f;
  if (fs.existsSync(p)) {
    console.log('=== ' + f + ' ===');
    const txt = fs.readFileSync(p, 'utf8');
    console.log(txt.slice(0, 500));
  }
});

