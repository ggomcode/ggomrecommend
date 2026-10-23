import fs from 'fs';

// Test the improvements on target problematic universities
const rawRows = JSON.parse(fs.readFileSync('scratch/raw_rows.json', 'utf-8'));

function cleanRawCellTextTest(raw) {
  let text = String(raw || '').trim();

  // 1. 단국대 오타: [DKU인재(면접형]): -> [DKU인재(면접형)]:
  text = text.replace(/\[DKU인재\(면접형\]\)/g, '[DKU인재(면접형)]');
  text = text.replace(/DKU인재\(면접형\]/g, 'DKU인재(면접형)]');

  // 2. 경기대 오타: ★{학교장추천} -> ★[학교장추천]
  text = text.replace(/\{학교장추천\}/g, '[학교장추천]');

  // 3. 서경대 오타: [교과균형) -> [교과균형]
  text = text.replace(/\[교과균형\)/g, '[교과균형]');

  // 4. 상명대(천안) 오타: [상명인재전형(...): 닫는 대괄호 누락 교정
  text = text.replace(/\[상명인재전형\(([^)]+)\):/g, '[상명인재전형($1)]:');

  // 5. 아주대 논술 오타: [논술우수자전형} -> [논술우수자전형]
  text = text.replace(/\[([^\]}\r\n]+)[}]/g, '[$1]');
  text = text.replace(/\{([^}\]\r\n]+)\]/g, '[$1]');

  // 6. 대괄호 내부의 개행 정리 (에리카 [조\n 기취업형계약] 등)
  text = text.replace(/\[([^\]\n]*)[\r\n]+([^\]]*)\]/g, '[$1 $2]');

  // 7. 공주대 등 붙어있는 대괄호 전형 통합: [일반전형][자율전공전형] -> [일반전형/자율전공전형]
  text = text.replace(/\[([^\]]+)\]\s*\[([^\]]+)\]/g, '[$1/$2]');

  // 8. 복수 전형 쉼표/마침표 병렬 나열 정규화:
  text = text.replace(/\[([^\]]+)\]\s*[,.]\s*\[([^\]]+)\]\s*[,.]\s*\[([^\]]+)\](?::\s*([^\n]+))/g, '[$1]: $4\n[$2]: $4\n[$3]: $4');
  text = text.replace(/\[([^\]]+)\]\s*[,.]\s*\[([^\]]+)\](?::\s*([^\n]+))/g, '[$1]: $3\n[$2]: $3');

  // 9. 포스텍 오타: [일반전형1](220명),반도체공학인재전형](40명)
  text = text.replace(/,반도체공학인재전형\]/g, '\n[반도체공학인재]');

  // 10. 하이픈/불릿 뒤부터 콜론 전까지의 학과명 내부 줄바꿈 정리
  text = text.replace(/([-∙*•][^:[\]\-∙*•]+):/g, (match, p1) => {
    return p1.replace(/[\r\n\s]+/g, ' ').trim() + ':';
  });

  // 11. 하이픈 리스트가 존재하는 텍스트에서 하이픈이 누락된 학과 헤더 자동 보충
  if (text.includes('-') || text.includes('•')) {
    text = text.replace(/(?:^|\n)\s*([가-힣a-zA-Z0-9/()ㆍ]+):\s*(?=국|수|영|탐|[0-9]합|최저|[0-9]개|등급)/g, (match, p1) => {
      if (match.includes('-')) return match;
      return `\n -${p1}: `;
    });
  }

  return text;
}

// Test Kongju R73 C3
const kongju = rawRows.find(r => (r[2] || '').includes('공주대'));
console.log('--- Cleaned Kongju Col 3 ---');
console.log(cleanRawCellTextTest(kongju[3]));

// Test Ajou R39 C8
const ajou = rawRows.find(r => (r[2] || '').includes('아주대'));
console.log('\n--- Cleaned Ajou Col 8 ---');
console.log(cleanRawCellTextTest(ajou[8]));

// Test Chungnam R70 C5
const chungnam = rawRows.find(r => (r[2] || '').includes('충남대'));
console.log('\n--- Cleaned Chungnam Col 5 ---');
console.log(cleanRawCellTextTest(chungnam[5]));
