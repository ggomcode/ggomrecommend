import * as XLSX from 'xlsx';

const col3Text = `[일반]
 1)수,과(1) 포함 3합: [의]5 [수/약]7 [수학교육]11
 [공학계열/IT]14
 2)과(1) 포함 3합: [과학교육]11 [의생명/자연과학]14
 3)국,수,영,탐(1) 중 3합
 -10: [간호] [사범(인문사회계열)]
 -13: [경영] [식품자원경제학] [사회과학대] [인문대]
 [영상문화학]
 -14: [자유전공(인문/자연)] [농생명과(자연계열)] [동물
 생활] [산림환경]`;

const col7Text = `[미래인재서류]
 -일반: 최저없음
 -간호: 국,수,영,탐(1) 중 3합 11
 -수의: 국,수,영,과(1) 중 3합 8`;

function parseKangwonCol3(rawText, baseInfo) {
  const results = [];
  let text = rawText.replace(/\[동물\s+생활\]/g, '[동물생활]');

  // 세세부전형 태그 추출: [일반]
  let subDetailType = '일반';
  const tagMatch = text.match(/^\s*\[([^\]]+)\]/);
  if (tagMatch) {
    subDetailType = tagMatch[1].trim();
    text = text.substring(tagMatch[0].length).trim();
  }

  // 번호 목록 분할: 1), 2), 3)
  const numRegex = /(?:^|\n)\s*([1-3])[)）]\s*/g;
  let match;
  const numPoints = [];
  while ((match = numRegex.exec(text)) !== null) {
    numPoints.push({ index: match.index, num: match[1], len: match[0].length });
  }

  for (let i = 0; i < numPoints.length; i++) {
    const cur = numPoints[i];
    const nextIndex = i + 1 < numPoints.length ? numPoints[i + 1].index : text.length;
    let secBody = text.substring(cur.index + cur.len, nextIndex).trim();

    if (cur.num === '1' || cur.num === '2') {
      // 패턴: 조건: [학과]점수 [학과]점수 ...
      const colonIdx = secBody.indexOf(':');
      if (colonIdx !== -1) {
        const cond = secBody.substring(0, colonIdx).replace(/[\r\n\s]+/g, ' ').trim();
        const rightPart = secBody.substring(colonIdx + 1);

        const bRegex = /\[([^\]]+)\]\s*([0-9]+)/g;
        let bm;
        while ((bm = bRegex.exec(rightPart)) !== null) {
          const dept = bm[1].replace(/\s+/g, '');
          const scoreNum = bm[2];
          results.push({
            ...baseInfo,
            subDetailType,
            dept,
            minScore: `${cond} ${scoreNum}`
          });
        }
      }
    } else if (cur.num === '3') {
      // 패턴: 공통조건 \n -숫자: [학과] [학과] \n -숫자: ...
      const hyphenLines = secBody.split(/(?:^|\n)\s*-\s*/).map(l => l.trim()).filter(Boolean);
      // 첫 번째는 공통조건 (예: "국,수,영,탐(1) 중 3합")
      const commonCond = hyphenLines[0].replace(/[\r\n\s]+/g, ' ').trim();

      for (let j = 1; j < hyphenLines.length; j++) {
        const hLine = hyphenLines[j];
        const colonIdx = hLine.indexOf(':');
        if (colonIdx !== -1) {
          const scoreNum = hLine.substring(0, colonIdx).trim();
          const deptPart = hLine.substring(colonIdx + 1);

          const bRegex = /\[([^\]]+)\]/g;
          let bm;
          while ((bm = bRegex.exec(deptPart)) !== null) {
            const dept = bm[1].replace(/\s+/g, '');
            results.push({
              ...baseInfo,
              subDetailType,
              dept,
              minScore: `${commonCond} ${scoreNum}`
            });
          }
        }
      }
    }
  }

  return results;
}

console.log('=== 강원대 Col 3 파싱 테스트 ===');
const baseInfo = { broadType: '교과', detailType: '교과100' };
const items3 = parseKangwonCol3(col3Text, baseInfo);
function testCol7() {
  console.log('\n=== 강원대 Col 7 (미래인재서류) 테스트 ===');
  const items = [
    { subDetailType: '미래인재서류', dept: '일반', minScore: '최저없음' },
    { subDetailType: '미래인재서류', dept: '간호', minScore: '국,수,영,탐(1) 중 3합 11' },
    { subDetailType: '미래인재서류', dept: '수의', minScore: '국,수,영,과(1) 중 3합 8' }
  ];

  const namedDepts = items
    .map(it => it.dept)
    .filter(d => d && d !== '전체' && d !== '일반' && !d.includes('나머지') && !d.includes('제외'));

  items.forEach(it => {
    let deptName = String(it.dept || '').trim();
    if (deptName === '나머지' || deptName.replace(/^[0-9]+[)）\s]+/, '').trim() === '나머지') {
      if (namedDepts.length > 0) {
        it.dept = `${namedDepts.join(',')}제외나머지`;
      }
    } else if (deptName === '일반' && String(it.minScore).includes('최저없음')) {
      if (namedDepts.length > 0) {
        it.dept = `${namedDepts.join(',')}제외나머지`;
      }
    }
  });

  items.forEach(it => {
    console.log(`  [${it.subDetailType}] 학과: [${it.dept.replace(/\s+/g, '')}]  ==>  최저: [${it.minScore}]`);
  });
}

testCol7();

