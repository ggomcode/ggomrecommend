import fs from 'fs';
import path from 'path';

function findSupabaseUrlInDist(repoPath) {
  const distPath = path.join(repoPath, 'dist');
  if (!fs.existsSync(distPath)) return 'dist not found';

  let foundUrls = new Set();
  function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (f.endsWith('.js')) {
        const c = fs.readFileSync(p, 'utf-8');
        const matches = c.match(/https:\/\/[a-z0-9\-]+\.supabase\.co/g);
        if (matches) {
          matches.forEach(m => foundUrls.add(m));
        }
      }
    }
  }
  walk(distPath);
  return Array.from(foundUrls);
}

console.log('ggomrecommend dist URLs:', findSupabaseUrlInDist('d:/Cloud/git/ggomcode/ggomrecommend'));
console.log('pogokrecommend dist URLs:', findSupabaseUrlInDist('d:/Cloud/git/pogokhi/pogokrecommend'));

