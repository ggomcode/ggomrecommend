import * as XLSX from 'xlsx';

// 테스트할 4개 대학 원본 셀
const testCases = [
  {
    univ: '충북대 Col 3',
    text: `[교과전형]: 국,수,영,탐(1) 중\n 1)2합: [간호]6, [사범]7, [인문/사회과학/경영/농생명\n 환경/생활과학/자연과학/공과/전자정보/인문\n 사회자율전공/창의융합]8\n 2)3합: [의예]4, [약학]6, [수의]7`
  },
  {
    univ: '충북대 Col 7',
    text: `[학생부종합1].[SW우수인재]:\n 최저없음\n [학생부종합2]:국,수,영,탐(1) 중\n 1)2합 8: [인문/사회과학/경영/\n 농생명/생활과학/창의융합,\n 공과,자연과학,전자정보]\n 2)2합 6: [간호]\n 3)3합: [의예]5, [약학]7, [수의]8`
  },
  {
    univ: '경상대 Col 3',
    text: `[학생부교과]\n (1) 국,수,영,탐(1) 중\n 1)2합 5: 항공우주\n 2)2합 6: 사범대(영어/수학(미/기 필수))\n 3)2합 7: 사범대(국어/생물((과 필수)/화학(과 필수))\n 4)2합 8: 사범대(교육학/역사/유아/윤리/일반사회/\n 일어/지리/체육), 간호\n 5)2합 9: 법학\n 6)2합 10: 사회복지/생명과학/수학물리/정보통계/\n 화학/제약공악/환경생명화학/AI정보공학/\n 소프트웨어/반도체/전기/전자/제어로봇/\n 메카트로닉스/사범대(미술교육)\n 7)3합 12: 경제/심리/정치외교/행정/미디어커뮤\n (2)국,수,영,과(2) 중 3합: [의예]4, [약학]5, [수의]6\n (의/약은 미/기 반영)\n (3)나머지: 최저없음`
  },
  {
    univ: '부산대 Col 4',
    text: `[학생부교과]\n 1)국,수,영,탐(1) 2합 5, 한 4:\n [인문/사회/사범/생과/경제/예\n 술/생명자원(일부)/스포츠과학]\n 2)국,수,영,탐(1) 3합 7, 한 4:\n [경영]\n 3)국,수,영,탐(1) 2합 6, 한 4:\n [바이오산업기계/바이오환경/IT\n 응용/조경,식품영양(일부)]\n 4)국,수,영,탐(1) 수 포함 2합 5,\n 한 4: [통계/건축/도시공학/산업\n 공학/자연과학(일부)/공과/사범/\n 간호/나노과학/정보의생명/학부\n 대학/디자인앤테크놀로지]\n 5)국,수,영,탐(2) 수 포함 3합 4,\n 한 4: [의예]`
  },
  {
    univ: '경북대 Col 4',
    text: `[교과우수자]\n 1)국,수,영,탐(1) 수 포함 2합 5:\n [IT대학]\n 2))국,수,영,탐(1) 2합 5: [경상/사\n 범/간호/행정/자율전공]\n 3)국,수,영,탐(1) 수 포함 2합 6:\n [공과/첨단기술융합/공학첨단자\n 율]\n 4)국,수,영,탐(1) 2합 6: [인문/사\n 회/자연/농업생명/생활과학]\n 5)수,과(2) 2합 3: [모바일공학]\n 6)국,수(미/기),영,탐(2) 수 포함\n 3합 4: [의/치]\n 7)국,수(미/기),영,탐(2)수 포함\n 3합 5: [수의/약]\n 8)[생태환경/과학기술/자율미래\n 인재]: 최저없음`
  }
];

function cleanRawCellText(raw) {
  let text = String(raw || '').trim();
  text = text.replace(/DKU인재\(면접형\]/g, 'DKU인재(면접형)');
  text = text.replace(/\{학교장추천\}/g, '[학교장추천]');
  text = text.replace(/\[([^\]]+)\]\s*[,.]\s*\[([^\]]+)\]\s*[,.]\s*\[([^\]]+)\](?::\s*([^\n]+))/g, '[$1]: $4\n[$2]: $4\n[$3]: $4');
  text = text.replace(/\[([^\]]+)\]\s*[,.]\s*\[([^\]]+)\](?::\s*([^\n]+))/g, '[$1]: $3\n[$2]: $3');
  return text;
}

// 진짜 전형명 태그인지 검사하는 함수
function isTrueAdmissionTag(text, matchIndex, tagStr) {
  // 1. matchIndex 앞부분의 현재 라인 텍스트 확인
  const lastNewline = text.lastIndexOf('\n', matchIndex);
  const linePrefix = lastNewline === -1 ? text.substring(0, matchIndex) : text.substring(lastNewline + 1, matchIndex);
  
  // 라인 프리픽스에 번호(1), 2), (1) 등)나 콜론(:), 합, 등급이 있으면 학과 대괄호임!
  if (/[0-9]+[)）]/.test(linePrefix) || /[(（][0-9]+[)）]/.test(linePrefix)) return false;
  if (/[:합]|등급/.test(linePrefix)) return false;

  // 1-1. 이전 줄의 끝이 콜론(:)으로 끝났다면, 이 대괄호는 앞선 조건에 해당하는 학과임!
  if (lastNewline !== -1) {
    const prevText = text.substring(0, lastNewline).trim();
    if (prevText.endsWith(':')) return false;
  }
  
  // 2. 대괄호 바로 뒤 텍스트 확인: 뒤에 숫자(등급)가 바로 붙어있으면 학과임 ([간호]6, [의예]4)
  const afterTag = text.substring(matchIndex + tagStr.length).trim();
  if (/^[0-9]+(?:\s*[,.]|\s*$)/.test(afterTag)) return false;

  // 3. 대괄호 안 내용 확인: 학과/단과대명이면 전형명이 아님
  const inner = tagStr.replace(/^[★\s]+/, '').replace(/^\[|\]$/g, '').trim();
  if (/대학$|인문|사회|자연|공과|사범|간호|의예|의\/치|수의|약학|예술|경상|생태환경|경영|바이오|식품|IT|공학/.test(inner)) {
    // 단, 전형명에 들어가는 키워드가 없으면 전형명이 아님
    if (!inner.includes('전형') && !inner.includes('우수자') && !inner.includes('인재') && !inner.includes('교과') && !inner.includes('종합') && !inner.includes('추천') && !inner.includes('논술')) {
      return false;
    }
  }

  return true;
}


function parseJigeogukBlock(bodyText, subDetailType) {
  const results = [];
  let text = bodyText.trim();

  // 상단 공통 접두사 추출 (예: "국,수,영,탐(1) 중")
  let commonPrefix = '';
  const prefixMatch = text.match(/^([^0-9\n(（]+(?::\s*국,수,영[^\n]*|중))\s*(?=\n|\s*[0-9]+[)）]|\s*[(（][0-9]+[)）])/);
  if (prefixMatch) {
    commonPrefix = prefixMatch[1].replace(/^:\s*/, '').trim();
    text = text.substring(prefixMatch[0].length).trim();
  }

  // 먼저 대분류 (1), (2), (3) 이 있는지 확인
  const majorSections = [];
  const majorRegex = /(?:^|\n)\s*[(（]([0-9]+)[)）]\s*([^\n]+)?/g;
  let mMatch;
  while ((mMatch = majorRegex.exec(text)) !== null) {
    majorSections.push({ index: mMatch.index, num: mMatch[1], title: (mMatch[2] || '').trim() });
  }

  // 대분류가 2개 이상 있는 경우 (예: 경상대 Col 3: (1) 국수영탐 중, (2) 국수영과 중 3합, (3) 나머지 최저없음)
  if (majorSections.length >= 2) {
    for (let s = 0; s < majorSections.length; s++) {
      const curSec = majorSections[s];
      const nextIndex = s + 1 < majorSections.length ? majorSections[s + 1].index : text.length;
      let secBody = text.substring(curSec.index, nextIndex).trim();
      
      // 섹션 헤더 제거
      secBody = secBody.replace(/^[(（][0-9]+[)）]\s*/, '').trim();

      // Case: "(3) 나머지: 최저없음"
      if (secBody.includes('최저없음') && secBody.length <= 40) {
        const parts = secBody.split(':');
        results.push({
          subDetailType,
          dept: parts[0].trim(),
          minScore: parts[1] ? parts[1].trim() : '최저없음'
        });
        continue;
      }

      // Case: "(2)국,수,영,과(2) 중 3합: [의예]4, [약학]5, [수의]6"
      if (secBody.includes('[') && secBody.includes(']')) {
        const colonIdx = secBody.indexOf(':');
        if (colonIdx !== -1) {
          const leftP = secBody.substring(0, colonIdx).trim();
          const rightP = secBody.substring(colonIdx + 1).trim();

          const bRegex = /\[([^\]]+)\]\s*([0-9]+)?/g;
          let bm;
          while ((bm = bRegex.exec(rightP)) !== null) {
            let dept = bm[1].trim();
            let scoreVal = bm[2] ? bm[2].trim() : '';
            results.push({
              subDetailType,
              dept,
              minScore: scoreVal ? `${leftP} ${scoreVal}` : leftP
            });
          }
          continue;
        }
      }

      // Case: "(1) 국,수,영,탐(1) 중 \n 1)2합 5: 항공우주 ..."
      const subItems = parseNumberList(secBody, subDetailType, '');
      results.push(...subItems);
    }
    return results;
  }

  return parseNumberList(text, subDetailType, commonPrefix);
}

function parseNumberList(text, subDetailType, commonPrefix) {
  const results = [];
  let curCommonPrefix = commonPrefix;

  // 번호 목록 분할: 1), 2), 3) 등
  const numRegex = /(?:^|\n)\s*[0-9]+[)）]+/g;
  let match;
  const numPoints = [];
  while ((match = numRegex.exec(text)) !== null) {
    numPoints.push({ index: match.index, len: match[0].length });
  }

  if (numPoints.length === 0) {
    return [{ subDetailType, dept: '전체', minScore: text }];
  }

  // 번호 목록 시작 전의 머리말이 있다면 공통 prefix로 취급
  const preText = text.substring(0, numPoints[0].index).trim();
  if (preText && !curCommonPrefix) {
    curCommonPrefix = preText.replace(/^:\s*/, '').trim();
  }

  for (let i = 0; i < numPoints.length; i++) {
    const cur = numPoints[i];
    const nextIndex = i + 1 < numPoints.length ? numPoints[i + 1].index : text.length;
    let line = text.substring(cur.index + cur.len, nextIndex).trim();
    line = line.replace(/^[)）\s]+/, '').replace(/[\r\n\s]+/g, ' ').trim();

    // 1. [학과]: 최저없음 (예: "8)[생태환경/과학기술/자율미래인재]: 최저없음")
    const caseDirect = line.match(/^\[([^\]]+)\]:\s*(.+)$/);
    if (caseDirect) {
      results.push({
        subDetailType,
        dept: caseDirect[1].trim(),
        minScore: caseDirect[2].trim()
      });
      continue;
    }

    // 2. 콜론 분리
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      let leftPart = line.substring(0, colonIdx).trim();
      let rightPart = line.substring(colonIdx + 1).trim();

      // Case 2-A: 학과: 최저없음
      if (rightPart.includes('최저없음') || rightPart.includes('미적용')) {
        results.push({
          subDetailType,
          dept: leftPart.replace(/^\[|\]$/g, '').trim(),
          minScore: rightPart.trim()
        });
        continue;
      }

      // Case 2-B: rightPart에 [학과] 또는 [학과]숫자 가 포함된 경우
      // 예: 1)2합: [간호]6, [사범]7, ...
      // 예: 1)국수영탐 2합 5: [IT대학]
      if (rightPart.includes('[') && rightPart.includes(']')) {
        const bRegex = /\[([^\]]+)\]\s*([0-9]+)?/g;
        let bm;
        const bItems = [];
        while ((bm = bRegex.exec(rightPart)) !== null) {
          bItems.push({
            dept: bm[1].trim(),
            numScore: bm[2] ? bm[2].trim() : ''
          });
        }

        if (bItems.length > 0) {
          bItems.forEach(b => {
            let finalScore = curCommonPrefix ? `${curCommonPrefix} ${leftPart}` : leftPart;
            if (b.numScore) {
              finalScore += ` ${b.numScore}`;
            }
            results.push({
              subDetailType,
              dept: b.dept,
              minScore: finalScore.replace(/^:\s*/, '').trim()
            });
          });
          continue;
        }
      }

      // Case 2-C: 대괄호 없는 일반 학과명: "1)2합 5: 항공우주"
      if (!rightPart.includes('중') && rightPart.length <= 60) {
        let finalScore = curCommonPrefix ? `${curCommonPrefix} ${leftPart}` : leftPart;
        results.push({
          subDetailType,
          dept: rightPart.trim(),
          minScore: finalScore.replace(/^:\s*/, '').trim()
        });
        continue;
      }
    }

    results.push({
      subDetailType,
      dept: '전체',
      minScore: line
    });
  }

  return results;
}

// 5개 케이스 테스트 실행
testCases.forEach(tc => {
  console.log(`\n=================== ${tc.univ} ===================`);
  const cleaned = cleanRawCellText(tc.text);
  
  // splitPoints
  const regex = /(?:★?\s*\[[^\]]+\]|★\s*[^:\n]+(?=:|\n))/g;
  let match;
  const splitPoints = [];
  while ((match = regex.exec(cleaned)) !== null) {
    if (isTrueAdmissionTag(cleaned, match.index, match[0].trim())) {
      splitPoints.push({ index: match.index, tag: match[0].trim() });
    }
  }

  console.log('True admission tags:', splitPoints.map(s => s.tag));

  splitPoints.forEach((cur, idx) => {
    const nextIdx = idx + 1 < splitPoints.length ? splitPoints[idx + 1].index : cleaned.length;
    let block = cleaned.substring(cur.index, nextIdx).trim();
    let rawTag = cur.tag;
    let subDetailType = rawTag.replace(/^[★\s]+/, '').replace(/^\[|\]$/g, '').trim();
    let body = block.substring(rawTag.length).trim();
    if (body.startsWith(':')) body = body.substring(1).trim();

    const items = parseJigeogukBlock(body, subDetailType);
    console.log(`-- [${subDetailType}] (${items.length}개 항목) --`);
    items.forEach(it => {
      console.log(`   Dept: [${it.dept}]  ==>  Score: [${it.minScore}]`);
    });
  });
});

