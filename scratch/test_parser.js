import * as XLSX from 'xlsx';

async function test() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const url = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('2027수능최저');
  const res = await fetch(url);
  const text = await res.text();
  const wb = XLSX.read(text, { type: 'string' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log('Total Rows:', rows.length);
  
  // 파서 로직 프로토타입
  const flattened = [];
  
  const colMeta = {
    3: { broadType: '교과', detailType: '교과100' },
    4: { broadType: '교과', detailType: '교과+학생부' },
    5: { broadType: '교과', detailType: '교과+면접' },
    6: { broadType: '종합', detailType: '학종 면접형' },
    7: { broadType: '종합', detailType: '학종 서류형' },
    8: { broadType: '논술', detailType: '논술+학생부' },
    9: { broadType: '논술', detailType: '논술100' }
  };

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const seq = row[0];
    const region = String(row[1] || '').trim();
    const univRaw = String(row[2] || '').trim();
    const univName = univRaw.replace(/[\r\n\s]+/g, ' ');

    for (let c = 3; c <= 9; c++) {
      const cellVal = String(row[c] || '').trim();
      if (!cellVal || cellVal === 'Ⅹ' || cellVal === 'X' || cellVal === 'x' || cellVal === '-') {
        continue;
      }

      const meta = colMeta[c];
      const parsedItems = parseCellToRecords(cellVal, {
        seq,
        region,
        univName,
        defaultBroadType: meta.broadType,
        detailType: meta.detailType
      });

      flattened.push(...parsedItems);
    }
  }

  console.log('Flattened Total Rows:', flattened.length);
  console.log('\n--- Sample 20 Rows ---');
  flattened.slice(0, 20).forEach((item, idx) => {
    console.log(`[${idx+1}] 순번:${item.seq} | 지역:${item.region} | 대학:${item.univName} | 전형:${item.broadType} | 세부:${item.detailType} | 세세부:${item.subDetailType} | 학과:${item.dept} | 최저:${item.minScore}`);
  });
}

function parseCellToRecords(cellVal, baseInfo) {
  const results = [];
  
  // 1. 전형 블록 분리
  // 전형 구분 패턴: [전형명] 또는 ★[전형명] 또는 ★전형명:
  // 정규식으로 [전형명] 위치들을 찾아 블록으로 분할
  
  // 먼저 줄바꿈 정규화
  let text = cellVal.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // 블록 분할: [ 또는 ★[ 또는 줄 시작의 ★로 시작하는 지점 탐색
  // 만약 대괄호가 하나도 없다면?
  if (!text.includes('[') && !text.includes('★')) {
    // 단일 전형
    results.push(...parseSubDepts(text, '일반전형', baseInfo));
    return results;
  }

  // 대괄호 [ ... ] 또는 ★... 패턴 분할
  // 예: "[가천바람개비전형]: 최저없음 \n [가천의약학전형] \n -의예:..."
  const regex = /(?:★?\s*\[[^\]]+\]|★\s*[^:\n]+(?=:|\n))/g;
  let match;
  const splitPoints = [];
  while ((match = regex.exec(text)) !== null) {
    splitPoints.push({ index: match.index, tag: match[0].trim() });
  }

  if (splitPoints.length === 0) {
    results.push(...parseSubDepts(text, '일반전형', baseInfo));
    return results;
  }

  for (let i = 0; i < splitPoints.length; i++) {
    const cur = splitPoints[i];
    const nextIndex = i + 1 < splitPoints.length ? splitPoints[i + 1].index : text.length;
    let blockContent = text.substring(cur.index, nextIndex).trim();

    // 전형명 태그 추출
    let rawTag = cur.tag;
    let subDetailType = rawTag
      .replace(/^[★\s]+/, '')
      .replace(/^\[|\]$/g, '')
      .trim();

    // blockContent에서 tag 제거
    let body = blockContent.substring(rawTag.length).trim();
    if (body.startsWith(':')) body = body.substring(1).trim();

    // 전형 대분류(학추 여부 판별)
    let broadType = baseInfo.defaultBroadType;
    if (rawTag.includes('★') || subDetailType.includes('지역균형') || subDetailType.includes('학교장추천') || subDetailType.includes('학교추천') || subDetailType.includes('추천형')) {
      broadType = '학추';
    }

    const items = parseSubDepts(body, subDetailType, { ...baseInfo, broadType });
    results.push(...items);
  }

  return results;
}

function parseSubDepts(bodyText, subDetailType, baseInfo) {
  const items = [];
  const text = bodyText.trim();

  if (!text) {
    items.push({
      ...baseInfo,
      subDetailType,
      dept: '전체',
      minScore: '최저없음'
    });
    return items;
  }

  // 학과 구분 분기 패턴:
  // -학과명: 기준
  // 예: "-일반: ... \n -의예: ... \n -약학: ..."
  // 또는 "1) 인문: ... 2) 자연: ..."
  // 만약 '-'나 학과 구분이 전혀 없고 바로 최저기준인 경우 (예: "최저없음", "국,수,영,탐(1) 중 2합 6")
  const hyphenLines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const hasDeptPrefix = hyphenLines.some(l => /^[-∙*•]\s*[^:\n]+:/.test(l));

  if (!hasDeptPrefix) {
    // 학과 구분이 단일한 경우
    // 혹시 "-일반: " 없이 "인문: ... 자연: ..." 형태가 있는지 확인
    const colonMatch = text.match(/^([^:\n]+):\s*([\s\S]+)$/);
    if (colonMatch && !colonMatch[1].includes('중') && colonMatch[1].length <= 15) {
      items.push({
        ...baseInfo,
        subDetailType,
        dept: colonMatch[1].replace(/^[-∙*•\s]+/, '').trim(),
        minScore: colonMatch[2].replace(/[\r\n\s]+/g, ' ').trim()
      });
    } else {
      items.push({
        ...baseInfo,
        subDetailType,
        dept: '전체',
        minScore: text.replace(/[\r\n\s]+/g, ' ').trim()
      });
    }
    return items;
  }

  // 하이픈 또는 불릿으로 여러 학과가 나뉜 경우 파싱
  // 정규식으로 (줄 시작 또는 공백 뒤의) '[-∙*•]\s*학과명:' 패턴 분할
  const deptRegex = /(?:^|\n)\s*[-∙*•]\s*([^:\n]+):/g;
  let dMatch;
  const dPoints = [];
  while ((dMatch = deptRegex.exec(text)) !== null) {
    dPoints.push({
      index: dMatch.index,
      deptName: dMatch[1].trim(),
      matchLen: dMatch[0].length
    });
  }

  if (dPoints.length === 0) {
    items.push({
      ...baseInfo,
      subDetailType,
      dept: '전체',
      minScore: text.replace(/[\r\n\s]+/g, ' ').trim()
    });
    return items;
  }

  for (let i = 0; i < dPoints.length; i++) {
    const cur = dPoints[i];
    const nextIndex = i + 1 < dPoints.length ? dPoints[i + 1].index : text.length;
    const content = text.substring(cur.index + cur.matchLen, nextIndex).trim();

    items.push({
      ...baseInfo,
      subDetailType,
      dept: cur.deptName,
      minScore: content.replace(/[\r\n\s]+/g, ' ').trim() || '최저없음'
    });
  }

  return items;
}

test().catch(console.error);
