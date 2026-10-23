import * as XLSX from 'xlsx';

const testCases = [
  {
    univ: '경희대 논술100',
    text: `[논술우수자전형]\n -인문/자연: 국,수,영,탐(2) 중\n 2합 5, 한 5\n 의/치/한/약: 국,수,영,탐(2) 중\n 3합 4, 한 5\n -체육: 국,수,영,탐(2) 중 3등급\n 1개`
  },
  {
    univ: '동국대 논술+학생부',
    text: `[논술전형]\n -인문: 국,수,영,탐(1) 중 2합 5,\n 한 4\n -자연: 국,수,영,탐(1) 중 2합 5,\n 한 4(수/과 중 1개 포함)\n -컴퓨터AI: 국,수,영,탐(1) 중\n 2합 5, 한 4(인문\n 수학 포함, 자연\n 수/과 중 1개 포함)\n 경찰행정: 국,수,영,탐(1) 중\n 2합 4, 한 4\n 약학: 국,수,영,탐(1) 중 3합 4,\n 한 4(수/과 중 1개 포함)`
  },
  {
    univ: '전남대 고교생활우수자1',
    text: `[고교생활우수자1]\n -일반: 최저없음\n -의과: 국,수(미/기),영,과(2) 중\n 3합 5\n -치의: 국,수(미/기),영,과(2) 중\n 3합 6\n -약학/수의: 국,수(미/기),영,과\n (1) 중 3합 7`
  }
];

function normalizeHyphenHeaders(text) {
  let res = text;
  // 하이픈 리스트가 존재하는 텍스트에서 하이픈이 누락된 학과 헤더 자동 보충
  if (res.includes('-') || res.includes('•')) {
    res = res.replace(/(?:^|\n)\s*([가-힣a-zA-Z0-9/()ㆍ]+):\s*(?=국|수|영|탐|[0-9]합|최저|[0-9]개|등급)/g, (match, p1) => {
      if (match.includes('-')) return match;
      return `\n -${p1}: `;
    });
  }
  return res;
}

testCases.forEach(tc => {
  console.log(`\n=== ${tc.univ} ===`);
  const normalized = normalizeHyphenHeaders(tc.text);
  const rawBlocks = normalized.split(/(?:^|\n)\s*[-∙*•]\s*/).map(b => b.trim()).filter(Boolean);
  
  // 첫 번째 블록이 전형명 태그인 경우 제외
  const deptBlocks = rawBlocks.filter(b => !b.startsWith('['));
  console.log(`총 ${deptBlocks.length}개 학과 분리:`);
  deptBlocks.forEach(b => {
    const colonIdx = b.indexOf(':');
    const dept = b.substring(0, colonIdx).replace(/[\r\n\s]+/g, ' ').trim();
    const score = b.substring(colonIdx + 1).replace(/[\r\n\s]+/g, ' ').trim();
    console.log(`  학과: [${dept}]  ==>  최저: [${score}]`);
  });
});
