import fs from 'fs';
const content = fs.readFileSync('src/api/admin.js', 'utf-8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('export const getApplications'));
console.log('getApplications found at line:', idx + 1);
if (idx !== -1) {
  console.log(lines.slice(idx, idx + 60).join('\n'));
}

