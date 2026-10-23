import * as XLSX from 'xlsx';

const text = `[학생부종합]
 의예/약학: 국,수(미/기),영,과(2)
 중 3합 6
 수의: 국,수,영,과(2) 중 3합 7
 사회/심리/정치외교/미디어커
 뮤/사범대: 최저없음`;

function parseSubDeptsTest(bodyText, subDetailType) {
  const items = [];
  const lines = bodyText.split('\n').map(l => l.trim()).filter(Boolean);

  let curDept = null;
  let curScores = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 콜론 매칭
    const m = line.match(/^([-∙*•]?\s*[^:\n]+):\s*([\s\S]*)$/);

    if (m && !m[1].includes('중') && !/^[0-9]+합/.test(m[1]) && !/등급/.test(m[1]) && m[1].length <= 60) {
      let deptPrefix = '';
      if (curScores.length > 0) {
        const lastScoreLine = curScores[curScores.length - 1];
        const isPureDeptWords = /^[가-힣a-zA-Z0-9/()ㆍ\s]+$/.test(lastScoreLine) &&
          !/합|등급|중|포함|이내|대체|반영|필수|응시|택|또는|이상|이하/.test(lastScoreLine);

        if (isPureDeptWords) {
          deptPrefix = curScores.pop();
        }
      }

      if (curDept !== null) {
        items.push({
          subDetailType,
          dept: curDept,
          minScore: curScores.join(' ').trim()
        });
        curScores = [];
      }

      let rawDept = m[1].replace(/^[-∙*•\s]+/, '').trim();
      if (deptPrefix) {
        curDept = (deptPrefix + rawDept).trim();
      } else {
        curDept = rawDept;
      }

      if (m[2].trim()) curScores.push(m[2].trim());
    } else {
      curScores.push(line);
    }
  }

  if (curDept !== null) {
    items.push({
      subDetailType,
      dept: curDept,
      minScore: curScores.join(' ').trim()
    });
  }

  return items;
}

const res = parseSubDeptsTest(text, '학생부종합');
console.log('Result count:', res.length);
res.forEach(r => {
  // H열 공백 제거 적용
  const deptNoSpace = r.dept.replace(/\s+/g, '');
  console.log(`학과 (공백제거): [${deptNoSpace}]  ==>  최저: [${r.minScore}]`);
});
