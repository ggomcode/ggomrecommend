import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

async function generateNormalizedExcel() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const url = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('2027수능최저');
  const res = await fetch(url);
  const text = await res.text();
  const wb = XLSX.read(text, { type: 'string' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const colMeta = {
    3: { broadType: '교과', detailType: '교과100' },
    4: { broadType: '교과', detailType: '교과+학생부' },
    5: { broadType: '교과', detailType: '교과+면접' },
    6: { broadType: '종합', detailType: '학종 면접형' },
    7: { broadType: '종합', detailType: '학종 서류형' },
    8: { broadType: '논술', detailType: '논술+학생부' },
    9: { broadType: '논술', detailType: '논술100' }
  };

  const flattened = [];

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
      const parsedItems = parseCellUnified(cellVal, {
        seq,
        region,
        univName,
        defaultBroadType: meta.broadType,
        detailType: meta.detailType
      });

      flattened.push(...parsedItems);
    }
  }

  // 텍스트 정제 함수: 앞뒤 불필요한 구두점(',', ':', '.', ';', '-', '/', 불릿 등) 및 개행 제거
  function sanitizeCell(val) {
    if (val === undefined || val === null) return '';
    let str = String(val).trim();
    // 줄바꿈 및 연속 공백을 단일 공백으로 치환
    str = str.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
    // 앞부분의 불필요한 기호 제거
    str = str.replace(/^[,\s.:;/\-∙*•~]+/, '');
    // 뒷부분의 불필요한 기호 제거 (쉼표, 콜론, 마침표, 세미콜론, 슬래시, 하이픈 등)
    str = str.replace(/[,\s.:;/\-∙*•~]+$/, '');
    return str.trim();
  }

  // 엑셀 시트용 데이터 생성
  const excelData = flattened.map((item, index) => {
    let univName = sanitizeCell(item.univName);
    let subDetailType = sanitizeCell(item.subDetailType);
    let dept = sanitizeCell(item.dept);
    let minScore = sanitizeCell(item.minScore);

    // 1. 교대 및 초등교육과 처리
    if (univName.includes('교대') || univName.includes('초등교육')) {
      if (!dept || dept === '전체' || dept === '일반' || /^\([0-9]+명\)$/.test(dept)) {
        dept = '초등교육';
      }
      dept = dept.replace(/초등\([0-9]+명\)/g, '초등교육');
    }

    // 2. 과기원(카이스트, 지스트, 디지스트, 유니스트, 켄텍, 포스텍) 모집인원 정제
    if (/카이스트|한국과학기술원|포스텍|지스트|디지스트|유니스트|켄텍/.test(univName)) {
      if (/^\(일반[0-9]+명\)$/.test(minScore) || /^\([0-9]+명\)$/.test(minScore)) {
        minScore = '최저없음';
      }
      if (/^\([0-9]+명\)$/.test(dept)) {
        dept = '전체';
      }
      // 디지스트 / 유니스트 / 지스트 / 켄텍 학과명 정제
      dept = dept.replace(/[0-9]+[\r\n\s]*명/g, '').replace(/[()+]/g, '/').replace(/[,]/g, '/').replace(/\/+/g, '/').replace(/^\/|\/$/g, '').trim();
      if (!dept) dept = '전체';
      if (subDetailType.includes('(')) {
        subDetailType = subDetailType.replace(/\([0-9]+[\r\n\s]*명\)/g, '').trim();
      }
    }

    // 3. 일반적인 학과명 및 전형명 뒤의 (XX명) 제거
    dept = dept.replace(/\([0-9]+[\r\n\s]*명\)/g, '').trim();
    subDetailType = subDetailType.replace(/\([0-9]+[\r\n\s]*명\)/g, '').trim();

    // 4. 수능최저가 비어있거나 불완전한 경우 보정
    if (!minScore || minScore === '최저' || minScore === '-') {
      minScore = '최저없음';
    }

    return {
      '연번': index + 1,
      '대학순번': item.seq,
      '지역': sanitizeCell(item.region),
      '대학명(캠퍼스)': univName,
      '전형': sanitizeCell(item.broadType),
      '세부전형': sanitizeCell(item.detailType),
      '세세부전형': subDetailType,
      '학부 또는 학과': dept.replace(/\s+/g, ''),
      '수능최저학력기준': minScore
    };
  });



  const outWb = XLSX.utils.book_new();
  const outWs = XLSX.utils.json_to_sheet(excelData);

  // 컬럼 너비 설정
  outWs['!cols'] = [
    { wch: 8 },  // 연번
    { wch: 10 }, // 대학순번
    { wch: 10 }, // 지역
    { wch: 18 }, // 대학명(캠퍼스)
    { wch: 10 }, // 전형
    { wch: 14 }, // 세부전형
    { wch: 22 }, // 세세부전형
    { wch: 30 }, // 학부 또는 학과
    { wch: 45 }  // 수능최저학력기준
  ];

  XLSX.utils.book_append_sheet(outWb, outWs, '2027수능최저_정규화');

  const outPath = path.resolve('scratch/2027_수시_대학별_수능최저_정규화목록.xlsx');
  XLSX.writeFile(outWb, outPath);

  console.log('Excel file successfully created:', outPath);
  console.log('Total flattened records:', flattened.length);

  const broadTypeCount = {};
  flattened.forEach(f => {
    broadTypeCount[f.broadType] = (broadTypeCount[f.broadType] || 0) + 1;
  });
  console.log('Broad Type Breakdown:', broadTypeCount);
}

/**
 * 텍스트 전처리: 오타 및 복수 전형 병렬 표기 분리
 */
function cleanRawCellText(raw) {
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

  // 6. 포스텍 오타: [일반전형1](220명),반도체공학인재전형](40명)
  text = text.replace(/,반도체공학인재전형\]/g, '\n[반도체공학인재]');

  // 7. 대괄호 내부의 개행 정리 (에리카 [조\n 기취업형계약], 충남대 등)
  text = text.replace(/\[([^\]\n]*)[\r\n]+([^\]]*)\]/g, '[$1 $2]');

  // 8. 공주대 등 붙어있는 대괄호 전형 통합: [일반전형][자율전공전형] -> [일반전형/자율전공전형]
  text = text.replace(/\[([^\]]+)\]\s*\[([^\]]+)\]/g, '[$1/$2]');

  // 9. 복수 전형 쉼표/마침표 병렬 나열 정규화:
  text = text.replace(/\[([^\]]+)\]\s*[,.]\s*\[([^\]]+)\]\s*[,.]\s*\[([^\]]+)\](?::\s*([^\n]+))/g, '[$1]: $4\n[$2]: $4\n[$3]: $4');
  text = text.replace(/\[([^\]]+)\]\s*[,.]\s*\[([^\]]+)\](?::\s*([^\n]+))/g, '[$1]: $3\n[$2]: $3');

  // 10. 하이픈/불릿 뒤부터 콜론 전까지의 학과명 내부 줄바꿈 정리 (다른 하이픈이나 대괄호를 건너뛰지 않도록 제한)
  text = text.replace(/([-∙*•][^:[\]\-∙*•]+):/g, (match, p1) => {
    return p1.replace(/[\r\n\s]+/g, ' ').trim() + ':';
  });

  // 11. 하이픈 리스트가 존재하는 텍스트에서 하이픈이 누락된 학과 헤더 자동 보충 (경희대 의/치/한/약:, 동국대 경찰행정:, 약학: 등)
  if (text.includes('-') || text.includes('•')) {
    text = text.replace(/(?:^|\n)\s*([가-힣a-zA-Z0-9/()ㆍ]+):\s*(?=국|수|영|탐|[0-9]합|최저|[0-9]개|등급)/g, (match, p1) => {
      if (match.includes('-')) return match;
      return `\n -${p1}: `;
    });
  }

  return text;
}

/**
 * 전형명 태그 판정 함수:
 * 본문 중간에 나오는 [학과] 또는 [단과대] 대괄호와 진짜 [전형명] 대괄호를 구별
 */
function isTrueAdmissionTag(text, matchIndex, rawMatch) {
  const tagStr = rawMatch.trim();

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

  // 2. 대괄호 바로 뒤 텍스트 확인 (rawMatch.length 사용으로 정확한 끝 위치 보장)
  const afterTag = text.substring(matchIndex + rawMatch.length).trim();
  if (/^[0-9]+(?:\s*[,.]|\s*$)/.test(afterTag)) return false;

  // 3. 바로 뒤에 콜론 + 최저없음 이면 무조건 전형 태그로 인정 (개행 포함)
  if (/^:[\r\n\s]*최저\s*없음/.test(afterTag)) return true;

  // 4. 대괄호 안 내용 확인: 순수 학과/단과대명이면 전형명이 아님
  const inner = tagStr.replace(/^[★\s]+/, '').replace(/^\[|\]$/g, '').trim();
  if (/대학$|인문|사회|자연|공과|사범|간호|의예|의\/치|수의|약학|예술|경상|생태환경|경영|바이오|식품|IT|공학/.test(inner)) {
    // 단, 전형명에 들어가는 키워드가 없으면 전형명이 아님
    if (!inner.includes('전형') && !inner.includes('우수자') && !inner.includes('인재') && !inner.includes('교과') && !inner.includes('종합') && !inner.includes('추천') && !inner.includes('논술') && !inner.includes('계약') && !inner.includes('일반')) {
      return false;
    }
  }

  return true;
}

/**
 * 셀 통합 파서: 전형 블록 분할 후 각 블록에 적합한 파서 적용
 */
function parseCellUnified(cellVal, baseInfo) {
  let text = cleanRawCellText(cellVal);

  const defaultInfo = {
    ...baseInfo,
    broadType: baseInfo.defaultBroadType
  };

  // 강원대 교과100 전담 처리
  if (baseInfo.univName.includes('강원대') && (text.includes('[의]5') || baseInfo.detailType === '교과100')) {
    return parseKangwonCol3(text, defaultInfo);
  }

  // 대괄호나 별표가 전혀 없는 순수 단일 텍스트인 경우
  if (!text.includes('[') && !text.includes('★')) {
    return parseSubDepts(text, '일반', defaultInfo);
  }


  // 1. 전형명 블록 분할
  const regex = /(?:★?\s*\[[^\]]+\]|★\s*[^:\n]+(?=:|\n))/g;
  let match;
  const splitPoints = [];
  while ((match = regex.exec(text)) !== null) {
    const rawMatch = match[0];
    if (isTrueAdmissionTag(text, match.index, rawMatch)) {
      splitPoints.push({ index: match.index, tag: rawMatch.trim() });
    }
  }


  if (splitPoints.length === 0) {
    // 전형명 대괄호가 없는 경우 (예: 본문에만 대괄호가 있는 경우)
    return parseSubDepts(text, '일반', defaultInfo);
  }

  const results = [];

  for (let i = 0; i < splitPoints.length; i++) {
    const cur = splitPoints[i];
    const nextIndex = i + 1 < splitPoints.length ? splitPoints[i + 1].index : text.length;
    let blockContent = text.substring(cur.index, nextIndex).trim();

    let rawTag = cur.tag;
    let subDetailType = rawTag
      .replace(/^[★\s]+/, '')
      .replace(/^\[|\]$/g, '')
      .trim();

    let body = blockContent.substring(rawTag.length).trim();
    if (body.startsWith(':')) body = body.substring(1).trim();

    // 학추 여부 판정
    let broadType = baseInfo.defaultBroadType;
    if (rawTag.includes('★') || subDetailType.includes('지역균형') || subDetailType.includes('학교장추천') || subDetailType.includes('학교추천') || subDetailType.includes('추천형')) {
      broadType = '학추';
    }

    const currentBase = {
      ...baseInfo,
      broadType
    };

    // 하이픈 리스트가 2개 이상 있으면 지거국 스타일이 아닌 표준 하이픈 서브학과 목록임
    const hasMultipleHyphens = (body.match(/(?:^|\n)\s*[-∙*•]\s*[^:\n]+:/g) || []).length >= 2;

    // 이 블록이 지거국 스타일(번호 목록 + 최저: [학과])인지 확인
    const isBlockJigeoguk = !hasMultipleHyphens && (
      /:\s*\[[^\]]+\]/.test(body) || 
      /(?:^|\n)\s*[0-9]+[)）][^:\n]+:\s*\[/.test(body) || 
      /(?:^|\n)\s*[0-9]+[)）]\s*[1-4]합/.test(body) ||
      /(?:^|\n)\s*[(（][0-9]+[)）]/.test(body)
    );



    if (isBlockJigeoguk) {
      const jItems = parseJigeogukBlock(body, subDetailType, currentBase);
      results.push(...jItems);
    } else {
      const sItems = parseSubDepts(body, subDetailType, currentBase);
      results.push(...sItems);
    }
  }

  return results;
}

/**
 * 지거국 스타일 블록 전담 파서
 */
function parseJigeogukBlock(bodyText, subDetailType, baseInfo) {
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
          ...baseInfo,
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
              ...baseInfo,
              subDetailType,
              dept,
              minScore: scoreVal ? `${leftP} ${scoreVal}` : leftP
            });
          }
          continue;
        }
      }

      // Case: "(1) 국,수,영,탐(1) 중 \n 1)2합 5: 항공우주 ..."
      const subItems = parseNumberList(secBody, subDetailType, '', baseInfo);
      results.push(...subItems);
    }
    return attachExceptNamoji(results);
  }

  return attachExceptNamoji(parseNumberList(text, subDetailType, commonPrefix, baseInfo));
}

/**
 * 번호 목록 파서 (1), 2), 3) 등)
 */
function parseNumberList(text, subDetailType, commonPrefix, baseInfo) {
  const results = [];
  let curCommonPrefix = commonPrefix;

  const numRegex = /(?:^|\n)\s*[0-9]+[)）]+/g;
  let match;
  const numPoints = [];
  while ((match = numRegex.exec(text)) !== null) {
    numPoints.push({ index: match.index, len: match[0].length });
  }

  if (numPoints.length === 0) {
    return [{
      ...baseInfo,
      subDetailType,
      dept: '전체',
      minScore: text
    }];
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
        ...baseInfo,
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
          ...baseInfo,
          subDetailType,
          dept: leftPart.replace(/^\[|\]$/g, '').trim(),
          minScore: rightPart.trim()
        });
        continue;
      }

      // Case 2-B: rightPart에 [학과] 또는 [학과]숫자 가 포함된 경우
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
              ...baseInfo,
              subDetailType,
              dept: b.dept,
              minScore: finalScore.replace(/^:\s*/, '').trim()
            });
          });
          continue;
        }
      }

      // Case 2-C: 대괄호 없는 일반 학과명: "1)2합 5: 항공우주"
      if (!rightPart.includes('중') && rightPart.length <= 300) {
        let finalScore = curCommonPrefix ? `${curCommonPrefix} ${leftPart}` : leftPart;
        results.push({
          ...baseInfo,
          subDetailType,
          dept: rightPart.trim(),
          minScore: finalScore.replace(/^:\s*/, '').trim()
        });
        continue;
      }
    }

    results.push({
      ...baseInfo,
      subDetailType,
      dept: '전체',
      minScore: line
    });
  }

  return results;
}


/**
 * 강원대 교과100 전담 파서 (17개 세부학과 완전 분리)
 */
function parseKangwonCol3(rawText, baseInfo) {
  const results = [];
  let text = rawText.replace(/\[동물\s+생활\]/g, '[동물생활]');

  let subDetailType = '일반';
  const tagMatch = text.match(/^\s*\[([^\]]+)\]/);
  if (tagMatch) {
    subDetailType = tagMatch[1].trim();
    text = text.substring(tagMatch[0].length).trim();
  }

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
      const hyphenLines = secBody.split(/(?:^|\n)\s*-\s*/).map(l => l.trim()).filter(Boolean);
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

/**
 * '나머지' / '일반' 학과명 처리 헬퍼:
 * 동일 전형 블록 내에 앞서 나온 특정 학과 목록이 있으면 '[앞선 학과들] 제외 나머지'로 변환
 */
function attachExceptNamoji(items) {
  const namedDepts = items
    .map(it => it.dept)
    .filter(d => d && d !== '전체' && d !== '일반' && !d.includes('나머지') && !d.includes('제외'));

  items.forEach(it => {
    let deptName = String(it.dept || '').trim();
    const isNamoji = deptName === '나머지' || deptName.replace(/^[0-9]+[)）\s]+/, '').trim() === '나머지';
    const isGeneral = deptName === '일반';

    // 특정 학과들이 명시되어 있고 현재 행이 '나머지' 또는 '일반'인 경우
    if ((isNamoji || isGeneral) && namedDepts.length > 0) {
      if (namedDepts.length > 6) {
        const mainDepts = namedDepts.slice(0, 5).join(', ');
        it.dept = `${mainDepts} 등 기재 학과 제외 나머지`;
      } else {
        it.dept = `${namedDepts.join(', ')} 제외 나머지`;
      }
    } else if (/(?:^|\s)[^()]+제외\s*$/.test(deptName)) {
      it.dept = `${deptName} 나머지`;
    }
  });

  return items;
}


/**
 * 표준 스타일 하위 학과 분기 파서 (향상된 버전)
 */
function parseSubDepts(bodyText, subDetailType, baseInfo) {
  const items = [];
  let text = bodyText.trim();

  if (!text) {
    items.push({
      ...baseInfo,
      subDetailType,
      dept: '전체',
      minScore: '최저없음'
    });
    return items;
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
          ...baseInfo,
          subDetailType,
          dept: deptPart,
          minScore: scorePart
        });
      } else {
        // 콜론이 없는 블록: 만약 이것이 앞선 헤더/전형 설명(대괄호로 둘러싸여 있거나 전형/해당 키워드 포함)인 경우 행을 만들지 않음!
        const cleaned = block.replace(/^\[|\]$/g, '').trim();
        if (cleaned.includes('전형') || cleaned.includes('우수자') || cleaned.includes('해당') || cleaned.includes('인재') || cleaned.includes('일반')) {
          continue;
        }
        items.push({
          ...baseInfo,
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

    // 만약 단일 문장에 '제외 나머지:' 가 있거나 콜론이 1개만 있는 경우 (예: 경상대 Col 7)
    const singleMerged = text.replace(/[\r\n\s]+/g, ' ').trim();
    if (singleMerged.includes('제외 나머지:') || (singleMerged.match(/:/g) || []).length === 1) {
      const colonIdx = singleMerged.indexOf(':');
      if (colonIdx !== -1) {
        let leftP = singleMerged.substring(0, colonIdx).trim();
        let rightP = singleMerged.substring(colonIdx + 1).trim();
        if (!leftP.includes('중') && leftP.length <= 80) {
          items.push({
            ...baseInfo,
            subDetailType,
            dept: leftP,
            minScore: rightP
          });
          return attachExceptNamoji(items);
        }
      }
    }

    // 여러 줄로 된 경우
    let curDept = null;
    let curScores = [];
    for (const line of lines) {
      const m = line.match(/^([^:\n]+):\s*([\s\S]*)$/);
      if (m && !m[1].includes('중') && !/^[0-9]+합/.test(m[1]) && !/등급/.test(m[1]) && m[1].length <= 60) {
        // 새로운 학과 헤더를 만났을 때, 직전 줄이 최저기준이 아닌 쪼개진 학과명 접두사인지 검사
        let deptPrefix = '';
        if (curScores.length > 0) {
          const lastScoreLine = curScores[curScores.length - 1];
          const isPureDeptWords = /^[가-힣a-zA-Z0-9/()ㆍ\s]+$/.test(lastScoreLine) &&
            !/최저|없음|미적용|합|등급|중|포함|이내|대체|반영|필수|응시|택|또는|이상|이하/.test(lastScoreLine);

          if (isPureDeptWords) {
            deptPrefix = curScores.pop();
          }

        }

        if (curDept !== null) {
          items.push({
            ...baseInfo,
            subDetailType,
            dept: curDept,
            minScore: curScores.join(' ').trim()
          });
          curScores = [];
        }

        let rawDept = m[1].trim();
        curDept = deptPrefix ? (deptPrefix + rawDept).trim() : rawDept;
        if (m[2].trim()) curScores.push(m[2].trim());
      } else {
        curScores.push(line);
      }
    }

    if (curDept !== null) {
      items.push({
        ...baseInfo,
        subDetailType,
        dept: curDept,
        minScore: curScores.join(' ').trim()
      });
    } else {
      items.push({
        ...baseInfo,
        subDetailType,
        dept: '전체',
        minScore: singleMerged
      });
    }
  }

  return attachExceptNamoji(items);
}

generateNormalizedExcel().catch(console.error);
