import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        results = results.concat(walk(full));
      }
    } else if (file.endsWith('.js') || file.endsWith('.vue')) {
      results.push(full);
    }
  });
  return results;
}

const files = walk('src');
for (const f of files) {
  const code = fs.readFileSync(f, 'utf-8');
  if (code.includes("getCurrentRound")) {
    console.log('File calling getCurrentRound:', f);
  }
}

