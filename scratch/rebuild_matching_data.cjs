const fs = require('fs');
const zlib = require('zlib');
const XLSX = require('xlsx');

const CAMPUS_ALIASES = {
  "중앙대학교(다빈치)": "중앙대학교(안성)",
  "중앙대(다빈치)": "중앙대학교(안성)",
  "중앙대학교(서울)": "중앙대학교(서울)",
  "한국외국어대학교(서울)-글로벌캠퍼스": "한국외국어대학교(용인)",
  "한국외국어대학교(용인)-글로벌캠퍼스": "한국외국어대학교(용인)",
  "한국외국어대학교(글로벌)": "한국외국어대학교(용인)",
  "한국외대(글로벌)": "한국외국어대학교(용인)",
  "한국외국어대학교(서울)": "한국외국어대학교(서울)",
  "한양대학교(ERICA)": "한양대학교(안산)",
  "한양대학교(에리카)": "한양대학교(안산)",
  "한양대(ERICA)": "한양대학교(안산)",
  "한양대학교(서울)": "한양대학교(서울)",
  "경희대학교(용인)": "경희대학교(국제)",
  "경희대(용인)": "경희대학교(국제)",
  "경희대(국제)": "경희대학교(국제)",
  "경희대학교(국제)": "경희대학교(국제)",
  "경희대학교(서울)": "경희대학교(서울)",
  "경동대학교(원주문막)": "경동대학교(원주문막)",
  "경동대학교(원주)": "경동대학교(원주문막)",
  "경동대학교(문막)": "경동대학교(원주문막)",
  "경동대학교(양주)": "경동대학교(양주)",
  "경동대학교(고성)": "경동대학교(고성)",
  "부산대학교(부산)": "부산대학교(부산)",
  "부산대학교(연제)": "부산대학교(연제)",
  "부산대학교(양산)": "부산대학교(양산)",
  "부산대학교(밀양)": "부산대학교(밀양)",
  "경북대학교(대구)": "경북대학교(대구)",
  "경북대학교(상주)": "경북대학교(상주)",
  "전북대학교(전주)": "전북대학교(전주)",
  "전북대학교(익산)": "전북대학교(익산)",
  "전남대학교(광주)": "전남대학교(광주)",
  "전남대학교(여수)": "전남대학교(여수)",
  "단국대학교(죽전)": "단국대학교(용인)",
  "단국대학교(천안)": "단국대학교(천안)",
  "명지대학교(자연)": "명지대학교(용인)",
  "명지대학교(인문)": "명지대학교(서울)",
  "중부대학교(충남)-고양캠퍼스": "중부대학교(고양)",
  "중부대학교(고양)": "중부대학교(고양)",
  "중부대학교(충남)": "중부대학교(금산)",
  "홍익대학교(세종)": "홍익대학교(세종)",
  "홍익대학교(서울)": "홍익대학교(서울)",
  "고려대학교(세종)": "고려대학교(세종)",
  "고려대학교(서울)": "고려대학교(서울)",
  "연세대학교(미래)": "연세대학교(원주)",
  "연세대학교(원주)": "연세대학교(원주)",
  "연세대학교(서울)": "연세대학교(서울)",
  "동국대학교(바이오메디)": "동국대학교(일산)",
  "동국대학교(일산)": "동국대학교(일산)",
  "동국대학교(서울)": "동국대학교(서울)",
  "동국대학교(WISE)": "동국대학교(경주)",
  "동국대학교(경주)": "동국대학교(경주)",
  "성균관대학교(자연과학)": "성균관대학교(수원)",
  "성균관대학교(인문사회)": "성균관대학교(서울)",
  "건국대학교(GLOCAL)": "건국대학교(글로컬)",
  "건국대학교(글로컬)": "건국대학교(글로컬)",
  "건국대학교(서울)": "건국대학교(서울)",
  "가천대학교(메디컬)": "가천대학교(인천)",
  "가천대학교(글로벌)": "가천대학교(성남)",
  "상명대학교(천안)": "상명대학교(천안)",
  "상명대학교(서울)": "상명대학교(서울)",
  "세한대학교(영암)": "세한대학교(당진)",
  "서울대학교(서울)": "서울대학교(서울)",
  "예원예술대학교(양주)": "예원예술대학교(양주)",
  "예원예술대학교(임실)": "예원예술대학교(임실)",
  "건양대학교(대전)": "건양대학교(대전)",
  "건양대학교(논산)": "건양대학교(논산)",
  "경기대학교(수원)": "경기대학교(수원)",
  "경기대학교(서울)": "경기대학교(서울)",
  "강원대학교(춘천)": "강원대학교(춘천)",
  "강원대학교(삼척)": "강원대학교(삼척)",
  "강원대학교(강릉)": "강원대학교(강릉)",
  "강원대학교(도계)": "강원대학교(삼척)",
  "강원대학교(원주)": "강원대학교(춘천)"
};

const JUNIOR_COLLEGES = [
  '강원도립대학교', '경기과학기술대학교', '경복대학교', '경인여자대학교', '국제대학교',
  '대림대학교', '대전보건대학교', '동남보건대학교', '동서울대학교', '동아방송예술대학교',
  '동원대학교', '두원공과대학교', '명지전문대학', '배화여자대학교', '백석문화대학교',
  '서일대학교', '수원여자대학교', '숭의여자대학교', '신구대학교', '신안산대학교',
  '안산대학교', '연성대학교', '오산대학교', '용인예술과학대학교', '인덕대학교',
  '인하공업전문대학', '장안대학교', '재능대학교', '청강문화산업대학교', '한국관광대학교',
  '한국영상대학교', '한양여자대학교', '혜전대학교'
];

function normalizeString(s) {
  if (s === null || s === undefined) return '';
  let t = String(s).trim();
  // 로마자 통일 (전각 포함)
  t = t.replace(/Ⅲ|III/g, '3').replace(/Ⅱ|II/g, '2').replace(/Ⅰ|IV/g, m => (m === 'IV' ? '4' : '1'));
  // [교직] 등 태그 제거
  t = t.replace(/\[교직\]/g, '');
  // 특수문자/공백/가운뎃점(U+00B7, U+30FB, U+FF65) 모두 제거
  t = t.replace(/[\(\)\[\]\{\}\<\>\:_\-\·\・\･•\/\+\s,]+/g, '');
  return t.toLowerCase();
}

function extractBaseName(s) {
  if (!s) return '';
  return String(s).split(' -')[0].replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
}

function smartExtractCoreTrack(trackRaw) {
  if (!trackRaw) return '';
  const text = String(trackRaw).trim();
  const mBracket = text.match(/\[(.*?)\]/);
  if (mBracket) {
    const inner = mBracket[1].split('(')[0].trim();
    if (inner.length >= 2 && !['정원내', '정원외'].includes(inner)) return inner;
  }
  const mParen = text.match(/\((.*?)\)/);
  if (mParen) {
    let inner = mParen[1].trim();
    inner = inner.replace(/^(수시모집|정시모집|수시정원외|수시정원내|수시|정시)[\s\-]*/, '').trim();
    inner = inner.split('(')[0].trim();
    if (inner.length >= 2 && !['수시', '정원외', '정원내'].includes(inner)) return inner;
  }
  if (text.includes(':')) return text.split(':').pop().trim();
  return text;
}

function stripTrackSuffix(name) {
  let n = normalizeString(name);
  n = n.replace(/^(수시모집|정시모집|수시정원외|수시정원내|수시|정시)/, '');
  n = n.replace(/^(학생부교과위주|학생부종합위주|학생부교과|학생부종합|실기실적위주|실기실적|논술위주|교과|종합|실기)/, '');
  n = n.replace(/(특별전형|일반전형|선발전형|우수자전형|전형)$/, '');
  n = n.replace(/^(춘천캠퍼스|서울캠퍼스|수원캠퍼스|천안캠퍼스|글로벌캠퍼스)/, '');
  return n;
}

function resolveUnivAlias(name) {
  const raw = String(name || '').replace(/\s+/g, '').trim();
  if (CAMPUS_ALIASES[raw]) return CAMPUS_ALIASES[raw];
  for (const [k, v] of Object.entries(CAMPUS_ALIASES)) {
    if (raw.includes(k) || k.includes(raw)) return v;
  }
  return String(name || '').trim();
}

function isTrackTypeCompatible(kcueTrackRaw, crawlTrackName, crawlSelType) {
  const k = String(kcueTrackRaw || '');
  const c = String(crawlTrackName || '') + ' ' + String(crawlSelType || '');

  // 정원외/사회배려 여부 호환 체크 ('기초체력'/'기초소양' 오탐 방지를 위해 '기초생활|기초수급'으로 명확히 매칭)
  const specialRe = /농어촌|기초생활|기초수급|차상위|한부모|특성화고|장애인|특수교육|국가보훈|보훈대상|서해5도|만학도|재직자/;
  const kSpecial = specialRe.exec(k);
  const cSpecial = specialRe.exec(c);
  if (kSpecial && !c.includes(kSpecial[0]) && !(/기회균형|고른기회|사회적배려|정원외/.test(c))) {
    return false;
  }
  if (cSpecial && !k.includes(cSpecial[0]) && !(/기회균형|고른기회|사회적배려|정원외/.test(k))) {
    return false;
  }

  // 한쪽이 '기회균형/고른기회'인데 다른쪽이 '일반'이면 차단
  const kEqual = /기회균형|고른기회|사회배려/.test(k);
  const cEqual = /기회균형|고른기회|사회배려/.test(c);
  if (kEqual !== cEqual) {
    return false;
  }

  if (k.includes('논술')) {
    return c.includes('논술');
  }
  if (k.includes('교과')) {
    if (c.includes('종합') && !c.includes('교과')) return false;
    if (c.includes('논술')) return false;
    return true;
  }
  if (k.includes('종합')) {
    if (c.includes('교과') && !c.includes('종합')) return false;
    if (c.includes('논술')) return false;
    return true;
  }
  if (k.includes('실기')) {
    // [수정] 용인대 등 실기/실적 위주인데 크롤링 전형명이 '일반학생', '일반전형', '예체능', '실기', '특기' 인 경우 모두 허용!
    if (c.includes('논술')) return false;
    if (c.includes('교과') && !c.includes('실기')) return false;
    return true;
  }
  return true;
}

// 학과명 전처리 (법・행정학부(행정학전공) -> 법행정학부 / 법행정학부행정학전공)
function getDeptVariants(deptRaw) {
  const full = normalizeString(deptRaw);
  const base = normalizeString(extractBaseName(deptRaw));
  // 괄호 안 전공명 추출 (예: '유아교육과(야)' -> '야', '법・행정학부(행정학전공)' -> '행정학전공')
  const m = String(deptRaw || '').match(/\((.*?)\)/);
  const inner = m ? normalizeString(m[1]).replace(/전공$/, '') : '';
  return { full, base, inner };
}

async function run() {
  console.log('1. Reading existing MatchingData.gs...');
  const gsText = fs.readFileSync('scratch/MatchingData.gs', 'utf8');
  const b64 = gsText.split('compressedBase64 = "')[1].split('"')[0];
  const oldDict = JSON.parse(zlib.gunzipSync(Buffer.from(b64, 'base64')).toString('utf8'));
  const oldKeys = Object.keys(oldDict);
  console.log('   Existing dict keys:', oldKeys.length);

  console.log('2. Fetching live 2027수시 sheet to include any newly added rows...');
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('2027수시')}`;
  const res = await fetch(url);
  const csv = await res.text();
  const sheetWb = XLSX.read(csv, { type: 'string' });
  const sheetRows = XLSX.utils.sheet_to_json(sheetWb.Sheets[sheetWb.SheetNames[0]], { header: 1 });
  const headers = (sheetRows[0] || []).map(h => String(h || '').trim());
  const findCol = (names) => headers.findIndex(h => names.some(n => h.replace(/\s+/g, '') === n.replace(/\s+/g, '')));
  const idxSchool = findCol(['학교유형']);
  const idxUniv = findCol(['대학명', '대학']);
  const idxTrackType = findCol(['전형유형']);
  const idxTrackDetail = findCol(['세부유형', '전형명(소)', '세부전형']);
  const idxDept = findCol(['모집단위', '학과']);

  // 모든 대상 키 수집 (기존 1195 + 시트 최신)
  const keyMetaMap = new Map();
  for (const k of oldKeys) {
    const parts = k.split('__');
    keyMetaMap.set(k, {
      univ: parts[0] || '',
      track: parts[1] || '',
      dept: parts[2] || '',
      schoolType: oldDict[k][0] || ''
    });
  }
  for (let i = 1; i < sheetRows.length; i++) {
    const r = sheetRows[i];
    if (!r) continue;
    const univ = String(r[idxUniv] || '').trim();
    if (!univ) continue;
    const schoolType = String(r[idxSchool] || '').trim();
    const tType = String(r[idxTrackType] || '').trim();
    const tDetail = String(r[idxTrackDetail] || '').trim();
    const track = tDetail || tType || '';
    const dept = String(r[idxDept] || '').trim();
    const key = `${univ}__${track}__${dept}`.replace(/[\r\n\s]+/g, '');
    if (!keyMetaMap.has(key)) {
      keyMetaMap.set(key, { univ, track, dept, schoolType, tType });
    } else if (tType) {
      keyMetaMap.get(key).tType = tType;
    }
  }
  console.log('   Total unique keys (old + live sheet):', keyMetaMap.size);

  console.log('3. Loading crawl xlsx and 3-year comparison xlsx...');
  const crawlWb = XLSX.readFile('D:/Cloud/git/ggomcode/ggomrate/2027_수시경쟁률_전수조사.xlsx');
  const crawlRows = XLSX.utils.sheet_to_json(crawlWb.Sheets[crawlWb.SheetNames[0]]);
  const compWb = XLSX.readFile('D:/Cloud/git/ggomcode/ggomrate/3개년_수시경쟁률_비교분석.xlsx');
  const compRows = XLSX.utils.sheet_to_json(compWb.Sheets[compWb.SheetNames[0]]);

  // 크롤링 대학별 인덱싱
  const crawlByUniv = new Map();
  const addCrawlIndex = (uKey, row) => {
    if (!uKey) return;
    if (!crawlByUniv.has(uKey)) crawlByUniv.set(uKey, []);
    crawlByUniv.get(uKey).push(row);
  };
  for (const c of crawlRows) {
    const uOrig = String(c['대학명'] || '');
    const uNorm = normalizeString(uOrig);
    const uBase = normalizeString(extractBaseName(uOrig));
    const uNoNat = uBase.replace(/^국립/, '');
    addCrawlIndex(uNorm, c);
    if (uBase !== uNorm) addCrawlIndex(uBase, c);
    if (uNoNat !== uBase) addCrawlIndex(uNoNat, c);
  }

  // 3개년 비교 인덱싱
  const compBySeq = new Map();
  const compByKey = new Map();
  for (const r of compRows) {
    const seq = r['전체크롤링번호'];
    if (seq !== undefined && seq !== null && String(seq).trim() !== '') {
      compBySeq.set(String(seq).trim(), r);
    }
    const uk = normalizeString(r['대학명']);
    const tk = normalizeString(r['2027_전형명']);
    const dk = normalizeString(r['2027_모집단위']);
    if (uk && dk) compByKey.set(`${uk}__${tk}__${dk}`, r);
  }

  console.log('4. Running enhanced matching...');
  const newDict = {};
  const stats = { exact: 0, fuzzy: 0, group: 0, fallbackTrack: 0, fail: 0, junior: 0 };
  const newlyMatchedExamples = [];
  const stillUnmatched = [];

  for (const [key, meta] of keyMetaMap.entries()) {
    const uRaw = meta.univ;
    const uBaseRaw = extractBaseName(uRaw);
    const isJunior = meta.schoolType.includes('전문') ||
      JUNIOR_COLLEGES.some(j => uRaw.includes(j) || uBaseRaw.includes(j));

    let matchedData = null;
    let matchStatus = '미매칭';

    if (isJunior) {
      stats.junior++;
      matchStatus = '[전문대학]';
    } else {
      const uAlias = resolveUnivAlias(uRaw);
      const uNorm = normalizeString(uAlias);
      const uBase = normalizeString(extractBaseName(uAlias));
      const uNoNat = uBase.replace(/^국립/, '');

      const candidates = crawlByUniv.get(uNorm) || crawlByUniv.get(uBase) || crawlByUniv.get(uNoNat) || [];
      const tRaw = meta.track;
      const tCore = smartExtractCoreTrack(tRaw);
      const tCoreStem = stripTrackSuffix(tCore);
      const tFullStem = stripTrackSuffix(tRaw);
      const tType = meta.tType || '';

      const { full: dNorm, base: dBaseNorm, inner: dInner } = getDeptVariants(meta.dept);

      const validCandidates = candidates.filter(c => isTrackTypeCompatible(tRaw || tType, c['전형명'], c['선발유형']));

      // 1단계: 핵심 전형명 + 학과명 완전 일치
      for (const cand of validCandidates) {
        const cTrackStem = stripTrackSuffix(cand['전형명']);
        const cDept = normalizeString(cand['모집단위']);
        const cDeptBase = normalizeString(extractBaseName(cand['모집단위']));

        const trackMatch = (tCoreStem && (cTrackStem.includes(tCoreStem) || tCoreStem.includes(cTrackStem))) ||
                           (cTrackStem && tFullStem.includes(cTrackStem));
        const deptMatch = (dNorm && (dNorm === cDept || dNorm === cDeptBase)) ||
                          (dBaseNorm && (dBaseNorm === cDept || dBaseNorm === cDeptBase));

        if (trackMatch && deptMatch) {
          matchedData = cand;
          matchStatus = '완전일치';
          stats.exact++;
          break;
        }
      }

      // 2단계: 전형명 일치 + 학과명 상호 포함(또는 세부전공 포함)
      if (!matchedData) {
        for (const cand of validCandidates) {
          const cTrackStem = stripTrackSuffix(cand['전형명']);
          const cDept = normalizeString(cand['모집단위']);
          const cDeptBase = normalizeString(extractBaseName(cand['모집단위']));

          const trackMatch = (tCoreStem && (cTrackStem.includes(tCoreStem) || tCoreStem.includes(cTrackStem))) ||
                             (cTrackStem && tFullStem.includes(cTrackStem));
          if (trackMatch) {
            const cDeptInnerMatch = String(cand['모집단위'] || '').match(/\((.*?)\)/);
            const cInner = cDeptInnerMatch ? normalizeString(cDeptInnerMatch[1]).replace(/전공$/, '') : '';
            // 양쪽 다 세부전공(괄호)이 있는데 서로 다르면(예: 피아노 vs 성악) 오매칭 방지
            if (dInner && cInner && dInner !== cInner && !cInner.includes(dInner) && !dInner.includes(cInner)) {
              continue;
            }
            const deptMatch = (dBaseNorm && (cDept.includes(dBaseNorm) || dBaseNorm.includes(cDeptBase))) ||
                              (dInner && dInner.length >= 2 && cDept.includes(dInner)) ||
                              (cDept && dNorm.includes(cDept));
            if (deptMatch) {
              matchedData = cand;
              matchStatus = '유사일치';
              stats.fuzzy++;
              break;
            }
          }
        }
      }

      // 3단계: 통합모집 학과군 포함 매칭
      if (!matchedData) {
        for (const cand of validCandidates) {
          const cTrackStem = stripTrackSuffix(cand['전형명']);
          const trackMatch = (tCoreStem && (cTrackStem.includes(tCoreStem) || tCoreStem.includes(cTrackStem))) ||
                             (cTrackStem && tFullStem.includes(cTrackStem));
          if (trackMatch) {
            const groupDepts = cand['통합모집학과군'];
            if (groupDepts && groupDepts !== '-') {
              const gNorm = normalizeString(groupDepts);
              if ((dBaseNorm && gNorm.includes(dBaseNorm)) || (dNorm && gNorm.includes(dNorm))) {
                matchedData = cand;
                matchStatus = '통합모집매칭';
                stats.group++;
                break;
              }
            }
          }
        }
      }

      // 4단계: 같은 대학 + 학과명 정확 일치 + 전형유형 호환 (예: 서원대 '교과80%+면접20%' vs '학생부교과(일반전형)')
      if (!matchedData) {
        const deptMatchedCands = validCandidates.filter(cand => {
          const cDept = normalizeString(cand['모집단위']);
          const cDeptBase = normalizeString(extractBaseName(cand['모집단위']));
          return (dNorm && (dNorm === cDept || dNorm === cDeptBase)) ||
                 (dBaseNorm && (dBaseNorm === cDept || dBaseNorm === cDeptBase));
        });
        if (deptMatchedCands.length === 1) {
          matchedData = deptMatchedCands[0];
          matchStatus = '유사일치';
          stats.fallbackTrack++;
        } else if (deptMatchedCands.length > 1) {
          // '일반' 또는 '인문'/'자연' 키워드 우선 선택
          const isGeneral = /일반|인문계|우수/.test(tRaw);
          const picked = deptMatchedCands.find(c => isGeneral ? /일반|교과|우수|인문/.test(String(c['전형명'])) : false) || deptMatchedCands[0];
          matchedData = picked;
          matchStatus = '유사일치';
          stats.fallbackTrack++;
        }
      }

      if (!matchedData) {
        stats.fail++;
        stillUnmatched.push(`${key} (cands=${candidates.length}, valid=${validCandidates.length})`);
      } else if (oldDict[key] && oldDict[key][1] === '미매칭') {
        newlyMatchedExamples.push({ key, rate: matchedData['경쟁률(표시용)'], crawlTrack: matchedData['전형명'], crawlDept: matchedData['모집단위'] });
      }
    }

    // 3개년 데이터 조회
    let matched3y = null;
    if (matchedData) {
      const seqVal = String(matchedData['전체크롤링번호'] || '').trim();
      if (seqVal && compBySeq.has(seqVal)) {
        matched3y = compBySeq.get(seqVal);
      } else {
        const uk = normalizeString(matchedData['대학명']);
        const tk = normalizeString(matchedData['전형명']);
        const dk = normalizeString(matchedData['모집단위']);
        matched3y = compByKey.get(`${uk}__${tk}__${dk}`);
      }
    }

    const row40 = [
      isJunior ? '전문대학' : '4년제대학',
      matchStatus,
      matchedData ? (matchedData['전형명'] ?? '') : '',
      matchedData ? (matchedData['모집단위'] ?? '') : '',
      matchedData ? (matchedData['모집인원(표시용)'] ?? '') : '',
      matchedData ? (matchedData['모집인원(합산용)'] ?? '') : '',
      matchedData ? (matchedData['지원인원'] ?? '') : '',
      matchedData ? (matchedData['경쟁률(표시용)'] ?? '') : '',
      matchedData ? (matchedData['경쟁률(수치)'] ?? '') : '',
      matchedData ? (matchedData['선발유형'] ?? '') : '',
      matchedData ? (matchedData['통합그룹명'] ?? '') : '',
      matchedData ? (matchedData['통합모집학과군'] ?? '') : '',
      matchedData ? (matchedData['기준일시'] ?? '') : '',
      matchedData ? (matchedData['URL'] ?? '') : '',
      matched3y ? (matched3y['2026_전형명'] ?? '-') : '-',
      matched3y ? (matched3y['2026_모집단위'] ?? '-') : '-',
      matched3y ? (matched3y['2026_모집인원'] ?? '-') : '-',
      matched3y ? (matched3y['2026_지원인원'] ?? '-') : '-',
      matched3y ? (matched3y['2026_경쟁률'] ?? '-') : '-',
      matched3y ? (matched3y['2026_매칭유형'] ?? '-') : '-',
      matched3y ? (matched3y['2025_전형명'] ?? '-') : '-',
      matched3y ? (matched3y['2025_모집단위'] ?? '-') : '-',
      matched3y ? (matched3y['2025_모집인원'] ?? '-') : '-',
      matched3y ? (matched3y['2025_지원인원'] ?? '-') : '-',
      matched3y ? (matched3y['2025_경쟁률'] ?? '-') : '-',
      matched3y ? (matched3y['2025_매칭유형'] ?? '-') : '-',
      matched3y ? (matched3y['경쟁률추이'] ?? '-') : '-',
      matched3y ? (matched3y['최근1개년_경쟁률증감(26->27)'] ?? '-') : '-',
      matchedData ? (matchedData['경쟁률(수치)'] ?? '') : '',
      matchedData ? (matchedData['경쟁률(표시용)'] ?? '') : '',
      matchedData ? (matchedData['모집인원(합산용)'] ?? '') : '',
      matchedData ? (matchedData['모집인원(표시용)'] ?? '') : '',
      matchedData ? (matchedData['지원인원'] ?? '') : '',
      matchedData ? (matchedData['선발유형'] ?? '') : '',
      matchedData ? (matchedData['통합그룹명'] ?? '') : '',
      matchedData ? (matchedData['통합모집학과군'] ?? '') : '',
      matchedData ? (matchedData['전형명'] ?? '') : '',
      matchedData ? (matchedData['모집단위'] ?? '') : '',
      matchedData ? (matchedData['기준일시'] ?? '') : '',
      matchedData ? (matchedData['URL'] ?? '') : ''
    ];
    newDict[key] = row40;
  }

  console.log('\n=== Matching Summary ===');
  console.log('Stats:', stats);
  const total4y = keyMetaMap.size - stats.junior;
  const matched4y = total4y - stats.fail;
  console.log(`4년제 매칭률: ${matched4y} / ${total4y} (${((matched4y / total4y) * 100).toFixed(1)}%)`);
  console.log(`기존 미매칭(197건) 중 추가 복구된 건수: ${newlyMatchedExamples.length}건`);
  console.log('복구 샘플 15건:');
  newlyMatchedExamples.slice(0, 15).forEach(x => console.log(`  ✅ ${x.key} -> ${x.crawlTrack} | ${x.crawlDept} (${x.rate})`));
  console.log('\n잔여 미매칭 샘플 15건:');
  stillUnmatched.slice(0, 15).forEach(x => console.log(`  ❌ ${x}`));

  // MatchingData.gs 재생성
  const jsonStr = JSON.stringify(newDict);
  const gz = zlib.gzipSync(Buffer.from(jsonStr, 'utf8'));
  const newB64 = gz.toString('base64');
  const outGs = `/**
 * 2027 수시 경쟁률 40개 매칭 컬럼 내장 데이터베이스 (총 ${Object.keys(newDict).length}개 모집단위)
 * 별도의 마스터 시트 없이 메모리에서 초고속 압축 해제(0.05초)하여 매칭합니다.
 */
function getMatchingDictionary() {
  const compressedBase64 = "${newB64}";
  const decodedBytes = Utilities.base64Decode(compressedBase64);
  const blob = Utilities.newBlob(decodedBytes, 'application/x-gzip');
  const unzippedBlob = Utilities.ungzip(blob);
  const jsonString = unzippedBlob.getDataAsString('UTF-8');
  return JSON.parse(jsonString);
}
`;
  fs.writeFileSync('scratch/MatchingData.gs', outGs, 'utf8');
  console.log('\n✅ Saved updated scratch/MatchingData.gs!');
}

run().catch(console.error);
