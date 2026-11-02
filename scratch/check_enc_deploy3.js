import fs from 'fs';

const txt = fs.readFileSync('scratch/step4770_code_gs.txt', 'utf8');
const idx = txt.indexOf('function executeEncryptedDeploy');
console.log(txt.slice(idx + 3500, idx + 5500));

