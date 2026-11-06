const fs = require('fs');
const path = require('path');

function search(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') search(full);
    } else {
      const c = fs.readFileSync(full, 'utf8');
      if (c.includes('createClient(')) {
        console.log('createClient in:', full);
      }
    }
  }
}
search('src');

