import fs from 'fs';

const txt = fs.readFileSync('D:/Cloud/git/ggomcode/ggomrate/matcher.py', 'utf8');
console.log('matcher.py length:', txt.length);
// matcher.py의 main 함수나 마지막 100줄 출력
const lines = txt.split('\n');
console.log(lines.slice(-80).join('\n'));

