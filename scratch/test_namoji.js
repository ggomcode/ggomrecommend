import * as XLSX from 'xlsx';

const testCases = [
  {
    univ: '한국교원대 Col 6',
    text: `초등(62명): 최저없음\n 나머지: 국,수,영,탐(2) 합 14`
  },
  {
    univ: '부산대 Col 6',
    text: `치의: 국,수,영 ,탐(2) 중 수 포함\n 3합 5, 한4\n 나머지: 최저없음`
  },
  {
    univ: '경상대 Col 7',
    text: `사회(사회/심리/정치외교/미디\n 어커뮤)/사범/수의/의예/간호/약\n 학 제외 나머지: 최저없음`
  },
  {
    univ: '전북대 Col 6',
    text: `-간호: 국,수,영,탐(1) 중 2합 6\n -치: 국,수(미/기),영,과(1) 중\n 수학 포함 3합 6\n -수의,약: 국,수(미/기),영,탐(1)\n 수학 포함 3합 7\n -의: 국,수(미/기),영,과(2) 중\n 4합 6\n -나머지: 최저없음`
  },
  {
    univ: '충남대 Col 7',
    text: `-간호: 국,수,영,탐(1) 중 3합 12\n -의: 국,수(미/기),영,과(2)\n 수 포함 3합 5\n -약: 국,수(미/기),영,과(2)\n 수 포함 3합 6\n -수의: 국,수(미/기),영,과(2)\n 수 포함 3합 7\n -나머지: 최저없음`
  },
  {
    univ: '성균관대 Col 4',
    text: `-의예: 국,수,영,탐(2) 중 4합 5\n -자유전공/글로벌(리더,경제,\n 경영,바이오메디컬)/전기전자/\n 소프트웨어/반도체융합/에너\n 지: 국,수,영,탐(2) 중 3합 6(제2\n 외국어/한문 탐구 1개 대체)\n -나머지: 국,수,영,탐(2) 중\n 3합 7(제2외국어/한문 탐구\n 1개 대체)`
  },
  {
    univ: '공주대 Col 7',
    text: `사범대 제외: 최저없음`
  }
];

function parseSubDeptsImproved(bodyText, subDetailType) {
  const items = [];
  let text = bodyText.trim();

  if (!text) {
    return [{ subDetailType, dept: '전체', minScore: '최저없음' }];
  }

  // 1. 하이픈/불릿으로 분기되는 경우 (-의예: ..., -자유전공: ..., -나머지: ...)
  if (/(?:^|\n)\s*[-∙*•]\s*[^:\n]+:/.test(text)) {
    const rawBlocks = text.split(/(?:^|\n)\s*[-∙*•]\s*/).map(b => b.trim()).filter(Boolean);
    for (const block of rawBlocks) {
      const colonIdx = block.indexOf(':');
      if (colonIdx !== -1) {
        let deptPart = block.substring(0, colonIdx).replace(/[\r\n\s]+/g, ' ').trim();
        let scorePart = block.substring(colonIdx + 1).replace(/[\r\n\s]+/g, ' ').trim();
        items.push({
          subDetailType,
          dept: deptPart,
          minScore: scorePart
        });
      } else {
        items.push({
          subDetailType,
          dept: '전체',
          minScore: block.replace(/[\r\n\s]+/g, ' ').trim()
        });
      }
    }
  } else {
    // 2. 하이픈 없이 학과: 최저 가 나열되는 경우 (예: 초등: 최저없음 \n 나머지: ..., 치의: ... \n 나머지: ...)
    // 또는 'xxx 제외 나머지: 최저없음'
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    // 만약 줄바꿈이 학과명 중간에 발생한 단일 문장인 경우 (예: 경상대 Col 7)
    const singleMerged = text.replace(/[\r\n\s]+/g, ' ').trim();
    if (singleMerged.includes('제외 나머지:') || (singleMerged.match(/:/g) || []).length === 1) {
      const colonIdx = singleMerged.indexOf(':');
      if (colonIdx !== -1) {
        let leftP = singleMerged.substring(0, colonIdx).trim();
        let rightP = singleMerged.substring(colonIdx + 1).trim();
        if (!leftP.includes('중') && leftP.length <= 80) {
          items.push({
            subDetailType,
            dept: leftP,
            minScore: rightP
          });
          return items;
        }
      }
    }

    // 여러 줄로 된 경우
    let curDept = null;
    let curScores = [];
    for (const line of lines) {
      const m = line.match(/^([^:\n]+):\s*([\s\S]*)$/);
      // 만약 콜론이 있고, 앞부분이 학과명다운 경우 (최저기준 키워드가 없고 길이가 적당)
      if (m && !m[1].includes('중') && !/^[0-9]+합/.test(m[1]) && !/등급/.test(m[1]) && m[1].length <= 50) {
        if (curDept !== null) {
          items.push({
            subDetailType,
            dept: curDept,
            minScore: curScores.join(' ').trim()
          });
          curScores = [];
        }
        curDept = m[1].trim();
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
    } else {
      items.push({
        subDetailType,
        dept: '전체',
        minScore: singleMerged
      });
    }
  }


  // 이제 '나머지' 처리: 앞서 나온 학과 목록을 모아서 '[학과들] 제외 나머지'로 변환
  const namedDepts = items.map(it => it.dept).filter(d => d !== '전체' && d !== '일반' && !d.includes('나머지') && !d.includes('제외'));

  items.forEach(it => {
    if (it.dept === '나머지' || it.dept.trim() === '나머지') {
      if (namedDepts.length > 0) {
        // 앞선 학과 목록 구성
        const deptStr = namedDepts.join(', ');
        it.dept = `${deptStr} 제외 나머지`;
      }
    } else if (it.dept.includes('제외') && !it.dept.includes('나머지')) {
      // 예: "사범대 제외" -> "사범대 제외 나머지"
      it.dept = `${it.dept} 나머지`;
    }
  });

  return items;
}

testCases.forEach(tc => {
  console.log(`\n=== ${tc.univ} ===`);
  const items = parseSubDeptsImproved(tc.text, '테스트전형');
  items.forEach(it => {
    console.log(`  Dept: [${it.dept}]  ==>  Score: [${it.minScore}]`);
  });
});
