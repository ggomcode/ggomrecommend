import { execSync } from 'child_process';

function checkGitHistory(path) {
  try {
    const out = execSync(`git -C "${path}" log -G"supabase" --oneline -n 5`, { encoding: 'utf-8' });
    console.log(`History for ${path}:\n`, out);
  } catch (e) {
    console.log(`No match for ${path}`);
  }
}

checkGitHistory('d:/Cloud/git/ggomcode/ggomrecommend');
checkGitHistory('d:/Cloud/git/pogokhi/pogokrecommend');

