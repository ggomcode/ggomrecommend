import fs from 'fs';
import path from 'path';

function searchSupabaseCo(dir, depth = 0) {
  if (depth > 4) return;
  try {
    for (const f of fs.readdirSync(dir)) {
      if (f === 'node_modules' || f === '.git' || f === 'dist' || f === '.gemini') continue;
      const p = path.join(dir, f);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        searchSupabaseCo(p, depth + 1);
      } else if (f.endsWith('.js') || f.endsWith('.env') || f.endsWith('.json') || f.endsWith('.sql') || f.endsWith('.md') || f.endsWith('.html') || f.endsWith('.txt')) {
        const c = fs.readFileSync(p, 'utf-8');
        const m = c.match(/https:\/\/[a-z0-9\-]+\.supabase\.co/g);
        if (m) {
          console.log(`Found in ${p}:`, m);
        }
      }
    }
  } catch (e) {}
}

console.log('Searching d:/Cloud/git ...');
searchSupabaseCo('d:/Cloud/git');

