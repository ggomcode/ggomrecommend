import fs from 'fs';

const files = fs.readdirSync('scratch').filter(f => f.endsWith('.js'));
for (const f of files) {
  const content = fs.readFileSync('scratch/' + f, 'utf8');
  if (content.includes('CE') || content.includes('DR') || content.includes('1hk') || content.includes('수시') || content.includes('매칭')) {
    console.log(`scratch/${f} has keyword matches!`);
  }
}

