import fs from 'fs';

function checkRepo(name, basePath) {
  console.log(`=== Repository: ${name} (${basePath}) ===`);
  
  // Check .env
  try {
    const env = fs.readFileSync(`${basePath}/.env`, 'utf-8');
    const lines = env.split('\n').filter(l => l.includes('VITE_SUPABASE_URL'));
    console.log('  .env SUPABASE_URL:', lines.join('; '));
  } catch (e) {
    console.log('  .env: Not found');
  }

  // Check .github/workflows/deploy.yml
  try {
    const wf = fs.readFileSync(`${basePath}/.github/workflows/deploy.yml`, 'utf-8');
    const lines = wf.split('\n').filter(l => l.includes('VITE_SUPABASE') || l.includes('repository:'));
    console.log('  deploy.yml secrets:', lines.map(l => l.trim()).join('; '));
  } catch (e) {
    console.log('  deploy.yml: Not found');
  }

  // Check git remote
  try {
    const gitConfig = fs.readFileSync(`${basePath}/.git/config`, 'utf-8');
    const remotes = gitConfig.split('\n').filter(l => l.includes('url = '));
    console.log('  git remote:', remotes.map(l => l.trim()).join('; '));
  } catch (e) {
    console.log('  git config: Not found');
  }

  // Check supabaseClient.js
  try {
    const client = fs.readFileSync(`${basePath}/src/utils/supabaseClient.js`, 'utf-8');
    console.log('  supabaseClient.js exists, length:', client.length);
  } catch (e) {
    console.log('  supabaseClient.js: Not found');
  }
}

checkRepo('ggomrecommend', 'd:/Cloud/git/ggomcode/ggomrecommend');
checkRepo('pogokrecommend', 'd:/Cloud/git/pogokhi/pogokrecommend');

