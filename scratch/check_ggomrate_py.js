import fs from 'fs';

const files = fs.readdirSync('D:/Cloud/git/ggomcode/ggomrate').filter(f => f.endsWith('.py'));
for (const f of files) {
  const content = fs.readFileSync('D:/Cloud/git/ggomcode/ggomrate/' + f, 'utf8');
  if (content.includes('CE') || content.includes('DR') || content.includes('1hkgi') || content.includes('gspread') || content.includes('update_cells')) {
    console.log(`ggomrate/${f} matches!`);
  }
}

