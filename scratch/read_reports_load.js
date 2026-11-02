import fs from 'fs';
const content = fs.readFileSync('src/components/admin/ReportsTab.vue', 'utf-8');
const lines = content.split('\n');
console.log(lines.slice(1210, 1275).join('\n'));

