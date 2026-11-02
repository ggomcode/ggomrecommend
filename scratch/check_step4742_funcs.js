import fs from 'fs';

const txt = fs.readFileSync('scratch/step4742_code_gs.txt', 'utf8');
console.log('step4742 txt length:', txt.length);

// 함수 목록 추출
const fnMatches = txt.match(/function\s+[a-zA-Z0-9_]+/g);
console.log('Functions in step4742:', fnMatches);

