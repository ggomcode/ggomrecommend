import fs from 'fs';
const content = fs.readFileSync('src/components/admin/ReportsTab.vue', 'utf-8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('const roundOptions'));
console.log(lines.slice(idx, idx + 40).join('\n'));

