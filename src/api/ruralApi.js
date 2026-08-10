import { supabase } from '../utils/supabaseClient';
import * as XLSX from 'xlsx';
import { encryptText, decryptText } from '../utils/cryptoUtils';
import { clearAllRuralStorage } from '../utils/storageUtils';

const API_BASE_URL = 'https://www.schoolinfo.go.kr/openApi.do';



// 주요 시도 코드 목록 (경기: 41, 서울: 11, 인천: 28, 강원: 42, 충북: 43, 충남: 44, 전북: 45, 전남: 46, 경북: 47, 경남: 48, 세종: 50, 제주: 50)
const MAJOR_SIDO_CODES = ['41', '11', '28', '44', '43', '47', '48', '45', '46', '42', '50'];

// 시도별 주요 시군구 코드 캐시/맵핑 (필수 인자 대응)
const SGG_CODE_MAP = {
  '41': ['41111', '41113', '41115', '41117', '41131', '41133', '41135', '41171', '41173', '41190', '41210', '41220', '41250', '41271', '41273', '41281', '41285', '41287', '41360', '41370', '41390', '41410', '41430', '41450', '41461', '41463', '41465', '41480', '41500', '41550', '41570', '41590', '41610', '41630', '41650', '41670', '41800', '41820', '41830'], // 경기 용인/수원/포천/화성 등 주요 시군구
  '11': ['11110', '11140', '11170', '11200', '11215', '11230', '11260', '11290', '11305', '11320', '11350', '11380', '11410', '11440', '11470', '11500', '11530', '11545', '11560', '11590', '11620', '11650', '11680', '11710', '11740']
};

/**
 * 학교 주소 내 읍/면 포함 여부 판단 (읍/면/리 수식어 및 주요 읍면 지역명 정규식)
 */
export function checkIsRuralAddress(addressStr) {
  if (!addressStr || typeof addressStr !== 'string') return false;
  const clean = addressStr.trim();

  // 1. 주소 텍스트에 읍/면/리가 포함된 경우 (단, 동지역 제외)
  const ruralRegex = /(?:[가-힣]+(?:읍|면|리))(?:\s|[0-9,()!]|$)/;
  if (ruralRegex.test(clean)) return true;

  // 2. 주요 읍/면 지역명 사전 체크 (학교명/주소에 읍/면 명칭이 포함되어 있는 경우)
  const ruralKeywords = [
    '포곡', '모현', '이동', '남사', '원삼', '백암', '양지',
    '가평', '양평', '연천', '강화', '옹진', '소흘', '포천', '청평',
    '설악', '조종', '지평', '용문', '청운', '단월', '양동', '개군'
  ];
  return ruralKeywords.some(kw => clean.includes(kw));
}

/**
 * 학교알리미 / NEIS Open API를 통한 학교 정보 검색 및 DB 캐싱 (rural_school_cache)
 */
export async function getOrFetchSchoolInfo(schoolName) {
  if (!schoolName) return null;

  const cleanName = schoolName.trim();

  // 1. DB 캐시 확인 — 실제 주소가 이미 있으면 그대로 반환
  try {
    const { data: cached } = await supabase
      .from('rural_school_cache')
      .select('*')
      .eq('school_name', cleanName)
      .maybeSingle();

    if (cached && cached.address && !cached.address.includes('자동 판정') && (cached.road_address || cached.detail_address)) {
      return cached;
    }
  } catch (e) {
    // ignore
  }

  // 2. NEIS 공공 Open API로 실제 학교 주소 조회
  let realAddress = '';
  let roadAddress = '';
  let detailAddress = '';
  let totalMatchCount = 0;
  let schoolKind = cleanName.includes('고등학교') || cleanName.includes('고교') || cleanName.includes('고') ? '04' : '03';

  try {
    const res = await fetch(`https://open.neis.go.kr/hub/schoolInfo?Type=json&pIndex=1&pSize=10&SCHUL_NM=${encodeURIComponent(cleanName)}`);
    if (res.ok) {
      const json = await res.json();
      const rows = json?.schoolInfo?.[1]?.row || [];
      totalMatchCount = rows.length;

      // 동명 학교가 전국에 여러 개 있을 경우 (예: 서울 백암고 vs 용인 백암고)
      // 경기도 및 읍/면 지역 소재 학교 우선 매칭
      let matchedRow = null;
      if (rows.length > 0) {
        // 1순위: 정확한 학교명 & 경기/용인 지역 & 읍/면 주소
        matchedRow = rows.find(r =>
          r.SCHUL_NM === cleanName &&
          (r.LCTN_SC_NM?.includes('경기') || r.ORG_RDNMA?.includes('경기') || r.ATPT_OFCDC_SC_NM?.includes('경기')) &&
          checkIsRuralAddress(`${r.ORG_RDNMA || ''} ${r.ORG_RDNDA || ''}`)
        );

        // 2순위: 정확한 학교명 & 경기/용인 지역
        if (!matchedRow) {
          matchedRow = rows.find(r =>
            r.SCHUL_NM === cleanName &&
            (r.LCTN_SC_NM?.includes('경기') || r.ORG_RDNMA?.includes('경기') || r.ATPT_OFCDC_SC_NM?.includes('경기'))
          );
        }

        // 3순위: 정확한 학교명 & 읍/면 주소
        if (!matchedRow) {
          matchedRow = rows.find(r =>
            r.SCHUL_NM === cleanName &&
            checkIsRuralAddress(`${r.ORG_RDNMA || ''} ${r.ORG_RDNDA || ''}`)
          );
        }

        // 4순위: 정확한 학교명 일치
        if (!matchedRow) {
          matchedRow = rows.find(r => r.SCHUL_NM === cleanName);
        }

        // 5순위: 첫 번째 검색 결과 fallback
        if (!matchedRow) {
          matchedRow = rows[0];
        }
      }

      if (matchedRow) {
        roadAddress = matchedRow.ORG_RDNMA || '';
        detailAddress = matchedRow.ORG_RDNDA || '';
        realAddress = roadAddress || detailAddress || '';
        if (matchedRow.SCHUL_KND_SC_NM === '고등학교') schoolKind = '04';
        else if (matchedRow.SCHUL_KND_SC_NM === '중학교') schoolKind = '03';
      }
    }
  } catch (e) {
    console.warn('NEIS API fetch error for school:', cleanName, e);
  }

  const fullAddrText = `${cleanName} ${realAddress} ${roadAddress} ${detailAddress}`;
  const isRural = checkIsRuralAddress(fullAddrText);

  // DB 스키마에 존재하는 실제 컬럼만 페이로드로 준비 (has_multiple_matches 등 임시 속성 제외하여 400 에러 방지)
  const dbInsertPayload = {
    school_name: cleanName,
    school_kind: schoolKind,
    address: realAddress || (isRural ? '읍/면 소재 학교' : '동지역 소재 학교'),
    detail_address: detailAddress,
    road_address: roadAddress,
    is_rural: isRural,
    fetched_at: new Date().toISOString()
  };

  // 3. DB 저장: 기존 행 삭제 후 INSERT
  let cacheRow = null;
  try {
    await supabase.from('rural_school_cache').delete().eq('school_name', cleanName);

    const { data: inserted, error: insErr } = await supabase
      .from('rural_school_cache')
      .insert(dbInsertPayload)
      .select('*')
      .maybeSingle();

    if (insErr) {
      console.warn('rural_school_cache insert error:', insErr);
    }
    if (inserted) cacheRow = inserted;
  } catch (e) {
    console.warn('rural_school_cache save error:', cleanName, e);
  }

  const result = cacheRow ? { ...cacheRow } : { ...dbInsertPayload };
  result.has_multiple_matches = totalMatchCount > 1;
  result.total_matches = totalMatchCount;

  return result;
}

/**
 * 3학년 전교생 목록 조회 (학교장 추천 시스템 통합 DB enrolled_students 마스터 참조)
 */
/**
 * 3학년 전교생 목록 및 별도 가입 프로필(졸업생 등) 조회
 */
export async function getGrade3Students() {
  const { data: enrolled } = await supabase
    .from('enrolled_students')
    .select('id, student_code, name, grade, class_no, student_no, seq_no, is_enrolled, apply_school_recommend, apply_rural, rural_type, rural_self_check')
    .eq('is_enrolled', true)
    .eq('grade', 3)
    .order('class_no', { ascending: true })
    .order('student_no', { ascending: true });

  const { data: allProfs } = await supabase
    .from('profiles')
    .select('*');

  const profs = (allProfs || []).filter(p => p.role !== 'teacher' && p.role !== 'admin');

  const enrolledSet = new Set((enrolled || []).map(e => e.id));
  const enrolledCodeSet = new Set((enrolled || []).filter(e => e.student_code).map(e => String(e.student_code).trim()));
  const enrolledClassSeqSet = new Set((enrolled || []).filter(e => e.class_no && (e.seq_no || e.student_no)).map(e => `${e.class_no}_${e.seq_no || e.student_no}`));

  const profSet = new Set((profs || []).map(p => p.id));
  const profMapByCode = new Map();
  const profMapByClassSeq = new Map();
  (profs || []).forEach(p => {
    if (p.student_code) profMapByCode.set(String(p.student_code).trim(), p);
    if (p.class_no && p.seq_no) profMapByClassSeq.set(`${p.class_no}_${p.seq_no}`, p);
  });

  const rawStudents = (enrolled || []).map(s => ({
    ...s,
    seq_no: s.seq_no || s.student_no || 0
  }));

  // 별도 가입한 졸업생/프로필 학생 병합
  const separateProfs = (profs || []).filter(p => {
    if (enrolledSet.has(p.id)) return false;
    if (p.student_code && enrolledCodeSet.has(String(p.student_code).trim())) return false;
    if (p.class_no && p.seq_no && enrolledClassSeqSet.has(`${p.class_no}_${p.seq_no}`)) return false;
    return true;
  });

  separateProfs.forEach(sp => {
    rawStudents.push({
      ...sp,
      seq_no: sp.seq_no || 0,
      is_separate_applicant: true,
      is_graduated: sp.is_graduated || sp.grade !== 3
    });
  });

  const students = [];
  for (const s of rawStudents) {
    const decryptedName = await decryptText(s.name);
    let matchedProfId = s.is_separate_applicant ? s.id : null;
    if (!matchedProfId) {
      if (profSet.has(s.id)) {
        matchedProfId = s.id;
      } else if (s.student_code && profMapByCode.has(String(s.student_code).trim())) {
        matchedProfId = profMapByCode.get(String(s.student_code).trim()).id;
      } else if (s.class_no && s.seq_no && profMapByClassSeq.has(`${s.class_no}_${s.seq_no}`)) {
        matchedProfId = profMapByClassSeq.get(`${s.class_no}_${s.seq_no}`).id;
      }
    }

    students.push({
      ...s,
      name: decryptedName,
      profile_id: matchedProfId
    });
  }

  return students;
}

/**
 * 파싱된 주소 및 학적 데이터 DB 저장 및 자동 농어촌 자격 판정 수행 (학교장 추천 DB 학생 매칭)
 */
export async function saveAndEvaluateRuralData(parsedAddressData, parsedAcademicData) {
  const allStudents = await getGrade3Students();
  // 엑셀 파싱 및 자동 자격 검증 대상은 3학년 '재학생' (졸업생/별도신청자 제외)
  const grade3Students = allStudents.filter(s => !s.is_separate_applicant && !s.is_graduated);

  // 다중 키 지원 매칭용 맵 작성
  const mapClassSeqName = new Map(); // ${classNo}_${seqNo}_${name}
  const mapClassSeq = new Map(); // ${classNo}_${seqNo}
  const mapClassName = new Map(); // ${classNo}_${name}
  const mapCode = new Map(); // ${studentCode}
  const mapName = new Map(); // ${name} -> array

  grade3Students.forEach(s => {
    const classNo = s.class_no;
    const seqNo = s.seq_no || s.student_no;
    const name = (s.name || '').trim();

    if (classNo && seqNo && name) {
      mapClassSeqName.set(`${classNo}_${seqNo}_${name}`, s);
    }
    if (classNo && seqNo) {
      mapClassSeq.set(`${classNo}_${seqNo}`, s);
    }
    if (classNo && name) {
      mapClassName.set(`${classNo}_${name}`, s);
    }
    if (s.student_code) {
      mapCode.set(String(s.student_code).trim(), s);
    }
    if (name) {
      if (!mapName.has(name)) mapName.set(name, []);
      mapName.get(name).push(s);
    }
  });

  function findMatchedStudent(st) {
    const cNo = st.classNo;
    const sNo = st.seqNo;
    const sName = (st.studentName || '').trim();
    const sCode = st.studentCode ? String(st.studentCode).trim() : null;

    if (cNo && sNo && sName && mapClassSeqName.has(`${cNo}_${sNo}_${sName}`)) {
      return mapClassSeqName.get(`${cNo}_${sNo}_${sName}`);
    }
    if (cNo && sName && mapClassName.has(`${cNo}_${sName}`)) {
      return mapClassName.get(`${cNo}_${sName}`);
    }
    if (cNo && sNo && mapClassSeq.has(`${cNo}_${sNo}`)) {
      return mapClassSeq.get(`${cNo}_${sNo}`);
    }
    if (sCode && mapCode.has(sCode)) {
      return mapCode.get(sCode);
    }
    if (sName && mapName.has(sName)) {
      const candidates = mapName.get(sName);
      if (candidates.length === 1) return candidates[0];
    }
    return null;
  }

  const logs = [];

  // 1. 주소 데이터 일괄(Batch) 저장 (DELETE + INSERT)
  // student_rural_addresses.student_id → enrolled_students.id FK 참조
  if (parsedAddressData && parsedAddressData.length > 0) {
    // 1-a. 저장 대상 학생의 enrolled_students.id 수집
    const targetIdSet = new Set();
    for (const item of parsedAddressData) {
      for (const st of item.students) {
        const student = findMatchedStudent(st);
        if (!student) continue;
        targetIdSet.add(student.id); // 항상 enrolled_students.id 사용
      }
    }

    // 1-b. 기존 레코드 삭제 (50개씩 청크)
    const targetIdArr = Array.from(targetIdSet);
    for (let i = 0; i < targetIdArr.length; i += 50) {
      const chunk = targetIdArr.slice(i, i + 50);
      const { error: delErr } = await supabase
        .from('student_rural_addresses')
        .delete()
        .in('student_id', chunk);
      if (delErr) {
        console.error('[주소 삭제 실패]', delErr);
        logs.push(`[주소 삭제 실패] ${delErr.message}`);
      }
    }

    // 1-c. 새 데이터 INSERT
    const addrPayloads = [];
    for (const item of parsedAddressData) {
      for (const st of item.students) {
        const student = findMatchedStudent(st);
        if (!student) {
          logs.push(`[주소 매칭 실패] 3학년 ${st.classNo}반 ${st.seqNo}번 ${st.studentName}`);
          continue;
        }

        const encName = await encryptText(st.studentName || student.name);
        const encRawAddress = await encryptText(st.rawAddress);

        addrPayloads.push({
          student_id: student.id, // enrolled_students.id (항상 존재, profiles FK 불필요)
          class_no: st.classNo || student.class_no,
          seq_no: st.seqNo || student.seq_no,
          student_name: encName,
          raw_address_text: encRawAddress,
          has_rural_address: st.hasRuralAddress,
          notes: st.isMultipleAddress ? '다중 주소 기재 (확인 필요)' : null,
          updated_at: new Date().toISOString()
        });
      }
    }

    // student_id 중복 제거
    const uniqueAddrMap = new Map();
    addrPayloads.forEach(p => uniqueAddrMap.set(p.student_id, p));
    const finalAddrPayloads = Array.from(uniqueAddrMap.values());

    // 1) 기존 student_id 주소 행 미리 삭제 (23505 UNIQUE 중복 키 에러 방지)
    const targetAddrIds = finalAddrPayloads.map(p => p.student_id);
    for (let i = 0; i < targetAddrIds.length; i += 50) {
      const chunk = targetAddrIds.slice(i, i + 50);
      const { error: delErr } = await supabase
        .from('student_rural_addresses')
        .delete()
        .in('student_id', chunk);
      if (delErr) {
        console.error('[주소 DELETE 실패]', delErr);
      }
    }

    // 2) 50개 청크 UPSERT
    for (let i = 0; i < finalAddrPayloads.length; i += 50) {
      const chunk = finalAddrPayloads.slice(i, i + 50);
      const { error: insErr } = await supabase
        .from('student_rural_addresses')
        .upsert(chunk, { onConflict: 'student_id' });
      if (insErr) {
        console.error('[주소 UPSERT 실패]', insErr);
        logs.push(`[주소 UPSERT 실패] ${insErr.message} (code: ${insErr.code})`);
      }
    }
  }

  // 2. 학적 데이터 일괄(Batch) 저장 & 학교 정보 API 캐싱 (50개 청크 분할)
  if (parsedAcademicData && parsedAcademicData.length > 0) {
    const targetIdsToDelete = new Set();
    const academicRowsToInsert = [];

    // 학교 캐시 미리 프리패치
    const allSchoolNames = new Set();
    for (const item of parsedAcademicData) {
      for (const st of item.students) {
        for (const rec of st.records) {
          if (rec.extractedSchools[0]) allSchoolNames.add(rec.extractedSchools[0].trim());
        }
      }
    }

    const schoolCacheMap = new Map();
    for (const sName of allSchoolNames) {
      const info = await getOrFetchSchoolInfo(sName);
      if (info) schoolCacheMap.set(sName, info);
    }

    const warnedSchools = new Set();

    for (const item of parsedAcademicData) {
      for (const st of item.students) {
        const student = findMatchedStudent(st);
        if (!student) {
          logs.push(`[학적 매칭 실패] 3학년 ${st.classNo}반 ${st.seqNo}번 ${st.studentName}`);
          continue;
        }

        const targetId = student.id; // enrolled_students.id 사용
        targetIdsToDelete.add(targetId);

        const encName = await encryptText(st.studentName || student.name);

        for (const rec of st.records) {
          const schoolName = rec.extractedSchools[0] || null;
          const schoolCache = schoolName ? schoolCacheMap.get(schoolName.trim()) : null;
          const encRecordText = await encryptText(rec.rawRecordText);

          if (schoolCache && schoolCache.has_multiple_matches) {
            const warnKey = `${student.id}_${schoolName}`;
            if (!warnedSchools.has(warnKey)) {
              warnedSchools.add(warnKey);
              const addrText = schoolCache.road_address || schoolCache.address || '주소 정보';
              const isRuralText = schoolCache.is_rural ? '읍/면 소재 학교 (적격)' : '동지역 소재 학교 (미달)';
              logs.push(`⚠️ [동일명 학교 주의] 3학년 ${st.classNo || student.class_no}반 ${st.seqNo || student.seq_no}번 ${st.studentName || student.name} 학생: 전국에 동일한 이름의 학교가 ${schoolCache.total_matches}개 검색되어 '${addrText}' [${isRuralText}]로 자동 매칭되었습니다. 정확히 맞는지 확인이 필요합니다.`);
            }
          }

          academicRowsToInsert.push({
            student_id: targetId,
            class_no: st.classNo || student.class_no,
            seq_no: st.seqNo || student.seq_no,
            student_name: encName,
            seq_order: rec.seqOrder,
            record_date: rec.recordDate ? parseToIsoDate(rec.recordDate) : null,
            change_type: encRecordText,
            school_name: schoolName,
            school_cache_id: schoolCache ? schoolCache.id : null,
            raw_record_text: encRecordText,
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    const targetIdsArr = Array.from(targetIdsToDelete);
    for (let i = 0; i < targetIdsArr.length; i += 50) {
      const chunk = targetIdsArr.slice(i, i + 50);
      const { error: delErr } = await supabase
        .from('student_academic_records')
        .delete()
        .in('student_id', chunk);
      if (delErr) {
        console.error('[학적 삭제 실패]', delErr);
        logs.push(`[학적 삭제 실패] ${delErr.message}`);
      }
    }

    for (let i = 0; i < academicRowsToInsert.length; i += 50) {
      const chunk = academicRowsToInsert.slice(i, i + 50);
      const { error: insErr } = await supabase
        .from('student_academic_records')
        .insert(chunk);
      if (insErr) {
        console.error('[학적 INSERT 실패]', insErr);
        logs.push(`[학적 INSERT 실패] ${insErr.message} (code: ${insErr.code})`);
      }
    }
  }

  // 3. 3학년 전체 학생에 대해 농어촌 전형 자격 자동 평가 수행 (배치 처리로 1초 내 완성)
  await evaluateAllRuralEligibility(grade3Students);

  return { success: true, logs };
}

/**
 * 농어촌 전형 서명 정보(student_signature, parent_signature, parent_name) 조회
 */
export async function getRuralSignatures(studentId) {
  if (!studentId) return null;

  let targetStudentId = studentId;
  const isUuid = typeof studentId === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(studentId);

  try {
    let query = supabase.from('enrolled_students').select('id, user_id, student_code');
    if (isUuid) {
      query = query.or(`id.eq.${studentId},user_id.eq.${studentId}`);
    } else {
      query = query.eq('student_code', String(studentId).trim());
    }
    const { data: st } = await query.maybeSingle();
    if (st?.id) {
      targetStudentId = st.id;
    }
  } catch (e) {
    console.warn('Student lookup failed in getRuralSignatures:', e);
  }

  const { data, error } = await supabase
    .from('rural_signatures')
    .select('*')
    .eq('student_id', targetStudentId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching rural signatures:', error);
    return null;
  }
  return data;
}

/**
 * 농어촌 전형 서명 정보(student_signature, parent_signature, parent_name) 저장
 */
export async function saveRuralSignatures(studentId, studentSignature, parentSignature, parentName) {
  if (!studentId) throw new Error('학생 식별 ID가 필요합니다.');

  let targetStudentId = studentId;
  const isUuid = typeof studentId === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(studentId);

  try {
    let query = supabase.from('enrolled_students').select('id, user_id, student_code');
    if (isUuid) {
      query = query.or(`id.eq.${studentId},user_id.eq.${studentId}`);
    } else {
      query = query.eq('student_code', String(studentId).trim());
    }
    const { data: st } = await query.maybeSingle();
    if (st?.id) {
      targetStudentId = st.id;
    }
  } catch (e) {
    console.warn('Student lookup failed in saveRuralSignatures:', e);
  }

  const payload = {
    student_id: targetStudentId,
    student_signature: studentSignature || null,
    parent_signature: parentSignature || null,
    parent_name: parentName || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('rural_signatures')
    .upsert(payload, { onConflict: 'student_id' });

  if (error) {
    console.error('Error saving rural signatures:', error);
    throw error;
  }

  return { success: true };
}

/**
 * 3학년 전체 학생에 대해 일괄(Batch) 자격 평가 수행 및 enrolled_students 동기화
 */
export async function evaluateAllRuralEligibility(grade3Students) {
  if (!grade3Students || grade3Students.length === 0) return;

  const [addrRes, acadRes, eligRes, profRes] = await Promise.all([
    supabase.from('student_rural_addresses').select('*'),
    supabase.from('student_academic_records').select('*, rural_school_cache(*)').order('seq_order', { ascending: true }),
    supabase.from('student_rural_eligibility').select('*'),
    supabase.from('profiles').select('id')
  ]);

  const profSet = new Set((profRes.data || []).map(p => p.id));

  const addrMap = new Map();
  (addrRes.data || []).forEach(a => addrMap.set(a.student_id, a));

  const acadMap = new Map();
  (acadRes.data || []).forEach(ar => {
    if (!acadMap.has(ar.student_id)) acadMap.set(ar.student_id, []);
    acadMap.get(ar.student_id).push(ar);
  });

  const eligMap = new Map();
  (eligRes.data || []).forEach(e => eligMap.set(e.student_id, e));

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  let currentHighSchoolAccYears = 2.5;
  if (currentMonth >= 3 && currentMonth <= 5) currentHighSchoolAccYears = 2.0;
  else if (currentMonth >= 6 && currentMonth <= 8) currentHighSchoolAccYears = 2.3;

  const eligUpserts = [];
  const enrolledUpdates = [];

  for (const s of grade3Students) {
    const studentId = s.id;
    const profileId = s.profile_id;
    const candidateIds = [profileId, studentId].filter(Boolean);

    let addressRec = null;
    for (const cid of candidateIds) {
      if (addrMap.has(cid)) { addressRec = addrMap.get(cid); break; }
    }

    let academicRecs = [];
    for (const cid of candidateIds) {
      if (acadMap.has(cid)) { academicRecs = acadMap.get(cid); break; }
    }

    const hasAddress = !!addressRec;
    const hasAcademic = academicRecs && academicRecs.length > 0;
    const bothUploaded = hasAddress && hasAcademic;
    const addressRuralValid = hasAddress ? addressRec.has_rural_address : false;

    let middleSchoolYears = 0.0;
    let highSchoolYears = 0.0;
    let isMiddleValid = false;
    let isHighValid = false;

    if (hasAcademic) {
      let ruralMiddleFound = false;
      let ruralHighFound = false;

      for (const rec of academicRecs) {
        const cache = rec.rural_school_cache;
        const isRural = cache ? cache.is_rural : checkIsRuralAddress(rec.school_name);
        const schoolKind = cache ? cache.school_kind : (rec.school_name?.includes('고등학교') || rec.school_name?.includes('고교') || rec.school_name?.includes('고') ? '04' : '03');

        if (schoolKind === '03' && isRural) {
          ruralMiddleFound = true;
          middleSchoolYears = 3.0;
        } else if (schoolKind === '04' && isRural) {
          ruralHighFound = true;
          highSchoolYears = currentHighSchoolAccYears;
        }
      }

      isMiddleValid = ruralMiddleFound || middleSchoolYears >= 3.0;
      isHighValid = ruralHighFound || highSchoolYears >= 2.0;
    }

    const totalRuralYears = middleSchoolYears + highSchoolYears;
    const academicRuralValid = isMiddleValid && isHighValid;
    const isType1Eligible = bothUploaded && addressRuralValid && academicRuralValid;

    const notes = [];
    if (hasAddress) {
      notes.push(addressRuralValid ? '인적사항(주소): 읍/면/리 거주 요건 충족 (적격)' : '인적사항(주소): 동지역 주소 (미달)');
    } else {
      notes.push('인적사항(주소): 미등록 (주소 엑셀 업로드 필요)');
    }

    if (hasAcademic) {
      notes.push(academicRuralValid ? `학적사항(학교): 중·고교 읍/면 재학 요건 충족 (적격, 중학교 ${middleSchoolYears}년/고교 ${highSchoolYears}년)` : '학적사항(학교): 읍/면 재학 요건 미달');
    } else {
      notes.push('학적사항(학교): 미등록 (학적 엑셀 업로드 필요)');
    }

    if (bothUploaded) {
      notes.push(isType1Eligible ? '유형I(6년) 최종 판정: 지원가능 (인적사항 & 학적사항 모두 충족)' : '유형I(6년) 최종 판정: 지원불가 (인적/학적 요건 미달)');
    } else {
      notes.push('최종 판정: 대기 중 (인적사항과 학적사항 엑셀 2개가 모두 올바르게 업로드되어야 자동 자격 판정이 완료됩니다)');
    }
    notes.push('유형II(12년) 판정: 교사 수동 확인 필요');

    const evalNotesText = notes.join(' | ');
    const nowIso = new Date().toISOString();

    let existingElig = null;
    for (const cid of candidateIds) {
      if (eligMap.has(cid)) { existingElig = eligMap.get(cid); break; }
    }

    let isFinal = isType1Eligible;
    if (existingElig) {
      isFinal = bothUploaded
        ? (isType1Eligible || (existingElig.is_type2_eligible || false) || (existingElig.is_manual_approved || false))
        : ((existingElig.is_type2_eligible || false) || (existingElig.is_manual_approved || false));
    }

    // manual_reason (미달 사유 / 수동 승인 사유) 자동 작성
    let autoReason = existingElig ? existingElig.manual_reason : null;
    if (!autoReason) {
      if (!isFinal) {
        const reasonParts = [];
        if (hasAddress && !addressRuralValid) reasonParts.push('동지역 주소 거주 (인적 요건 미달)');
        if (hasAcademic && !academicRuralValid) reasonParts.push('중·고교 읍면 재학 기간 미달');
        if (!hasAddress) reasonParts.push('인적사항(주소) 엑셀 미등록');
        if (!hasAcademic) reasonParts.push('학적사항(학교) 엑셀 미등록');
        autoReason = reasonParts.join(' / ');
      } else {
        autoReason = '자동자격검증 충족 (적격)';
      }
    }

    eligUpserts.push({
      student_id: studentId,
      middle_school_years: middleSchoolYears,
      high_school_years: highSchoolYears,
      total_rural_years: totalRuralYears,
      address_rural_valid: addressRuralValid,
      is_eligible: isFinal,
      is_manual_approved: existingElig ? (existingElig.is_manual_approved || false) : false,
      manual_reason: autoReason,
      ineligible_reason: !isFinal ? autoReason : null,
      evaluation_notes: evalNotesText,
      updated_at: nowIso
    });

    enrolledUpdates.push({
      id: studentId,
      is_rural_eligible: isFinal
    });
  }

  // 1) student_rural_eligibility 중복 제거 후 50개 청크 UPSERT (student_id PK/ON CONFLICT)
  const uniqueEligMap = new Map();
  eligUpserts.forEach(u => uniqueEligMap.set(u.student_id, u));
  const finalEligUpserts = Array.from(uniqueEligMap.values());

  for (let i = 0; i < finalEligUpserts.length; i += 50) {
    const chunk = finalEligUpserts.slice(i, i + 50);
    try {
      const { error: eligErr } = await supabase.from('student_rural_eligibility').upsert(chunk, { onConflict: 'student_id' });
      if (eligErr) {
        console.error('[student_rural_eligibility upsert 실패]', eligErr);
      }
    } catch (e) {
      console.warn('Batch eligUpserts chunk error:', e);
    }
  }

  // 2) enrolled_students 병렬 UPDATE (NOT NULL 제약조건 안전 방식)
  if (enrolledUpdates.length > 0) {
    try {
      const updatePromises = enrolledUpdates.map(u =>
        supabase
          .from('enrolled_students')
          .update({ is_rural_eligible: u.is_rural_eligible })
          .eq('id', u.id)
      );
      await Promise.all(updatePromises);
    } catch (e) {
      console.warn('Batch enrolledUpdates error:', e);
    }
  }
}

/**
 * 날짜 문자열 YYYY-MM-DD 변환 헬퍼
 */
function parseToIsoDate(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{4})[-.\s/]?(\d{1,2})[-.\s/]?(\d{1,2})/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return null;
}

/**
 * 단일 학생의 농어촌 전형 자격(6년 읍면 중고교 재학 & 주소) 계산 및 enrolled_students 동기화
 */
export async function evaluateStudentRuralEligibility(studentId, profileId = null) {
  const targetId = profileId || studentId;
  const candidateIds = [profileId, studentId].filter(Boolean);

  // 주소 정보 조회
  const { data: addressRec } = await supabase
    .from('student_rural_addresses')
    .select('*')
    .in('student_id', candidateIds)
    .maybeSingle();

  // 학적 이력 조회 (학교 캐시 join)
  const { data: academicRecs } = await supabase
    .from('student_academic_records')
    .select('*, rural_school_cache(*)')
    .in('student_id', candidateIds)
    .order('seq_order', { ascending: true });

  const hasAddress = !!addressRec;
  const hasAcademic = academicRecs && academicRecs.length > 0;
  const bothUploaded = hasAddress && hasAcademic;

  const notes = [];
  const addressRuralValid = hasAddress ? addressRec.has_rural_address : false;

  if (hasAddress) {
    if (addressRuralValid) {
      notes.push('인적사항(주소): 읍/면/리 거주 요건 충족 (적격)');
    } else {
      notes.push('인적사항(주소): 동지역 주소 (미달)');
    }
  } else {
    notes.push('인적사항(주소): 미등록 (주소 엑셀 업로드 필요)');
  }

  let middleSchoolYears = 0.0;
  let highSchoolYears = 0.0;
  let isMiddleValid = false;
  let isHighValid = false;

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1 ~ 12

  let currentHighSchoolAccYears = 2.5; // 기본 원서접수 시점 (2년 6개월)
  if (currentMonth >= 3 && currentMonth <= 5) {
    currentHighSchoolAccYears = 2.0;
  } else if (currentMonth >= 6 && currentMonth <= 8) {
    currentHighSchoolAccYears = 2.3;
  }

  if (hasAcademic) {
    let ruralMiddleFound = false;
    let ruralHighFound = false;
    let hasNonRuralHighTransfer = false;

    for (const rec of academicRecs) {
      const cache = rec.rural_school_cache;
      const isRural = cache ? cache.is_rural : checkIsRuralAddress(rec.school_name || '');
      const recText = (await decryptText(rec.raw_record_text)) || '';

      // 중학교 판정
      if (recText.includes('중학교') || (rec.school_name && rec.school_name.includes('중'))) {
        if (isRural) {
          ruralMiddleFound = true;
          middleSchoolYears = 3.0;
          isMiddleValid = true;
        } else {
          notes.push(`중학교(${rec.school_name || '미확인'}) 동지역 소재 (미달)`);
        }
      }

      // 고등학교 판정
      if (recText.includes('고등학교') || (rec.school_name && rec.school_name.includes('고'))) {
        if (isRural) {
          ruralHighFound = true;
        } else {
          hasNonRuralHighTransfer = true;
          notes.push(`고등학교(${rec.school_name || '미확인'}) 동지역 소재 (미달)`);
        }
      }
    }

    if (ruralMiddleFound) {
      notes.push('중학교 3년 읍면 소재 충족');
    } else if (middleSchoolYears === 0) {
      notes.push('읍면 중학교 재학 기록 없음 (미달)');
    }

    if (ruralHighFound && !hasNonRuralHighTransfer) {
      isHighValid = true;
      highSchoolYears = currentHighSchoolAccYears;
      notes.push(`고등학교 읍면 소재 (적격)`);
    } else if (!ruralHighFound) {
      notes.push('읍면 고등학교 재학 기록 없음 (미달)');
    }
  } else {
    notes.push('학적사항(학교): 미등록 (학적 엑셀 업로드 필요)');
  }

  const totalRuralYears = middleSchoolYears + highSchoolYears;
  const academicRuralValid = isMiddleValid && isHighValid;
  const isType1Eligible = bothUploaded && addressRuralValid && academicRuralValid;

  if (bothUploaded) {
    if (isType1Eligible) {
      notes.push('유형I(6년) 최종 판정: 지원가능 (인적사항 & 학적사항 모두 충족)');
    } else {
      notes.push('유형I(6년) 최종 판정: 지원불가 (인적/학적 요건 미달)');
    }
  } else {
    notes.push('최종 판정: 대기 중 (인적사항과 학적사항 엑셀 2개가 모두 올바르게 업로드되어야 자동 자격 판정이 완료됩니다)');
  }
  notes.push('유형II(12년) 판정: 교사 수동 확인 필요');

  // 4. student_rural_eligibility 에 저장 (테이블에 실제로 존재하는 10개 컬럼만 사용)
  const evalData = {
    student_id: studentId,
    middle_school_years: middleSchoolYears,
    high_school_years: highSchoolYears,
    total_rural_years: totalRuralYears,
    address_rural_valid: addressRuralValid,
    is_eligible: isType1Eligible,
    evaluation_notes: await encryptText(notes.join(' | ')),
    updated_at: new Date().toISOString()
  };

  let result = null;
  try {
    const { data: existing } = await supabase
      .from('student_rural_eligibility')
      .select('*')
      .in('student_id', candidateIds)
      .maybeSingle();

    const isFinal = existing
      ? (bothUploaded ? (isType1Eligible || existing.is_manual_approved) : existing.is_manual_approved)
      : isType1Eligible;

    const payload = {
      ...evalData,
      student_id: studentId,
      is_eligible: isFinal,
      is_manual_approved: existing ? (existing.is_manual_approved || false) : false,
      manual_reason: existing ? (existing.manual_reason || null) : (isFinal ? '자동자격검증 충족' : null),
      ineligible_reason: !isFinal ? (existing?.ineligible_reason || '농어촌 자격 요건 미달') : null
    };

    const { data: saved, error: saveErr } = await supabase
      .from('student_rural_eligibility')
      .upsert(payload, { onConflict: 'student_id' })
      .select('*')
      .maybeSingle();

    if (saveErr) console.error('[student_rural_eligibility upsert error]', saveErr);
    if (saved) result = saved;
  } catch (e) {
    console.warn('student_rural_eligibility save warning:', e);
  }

  // enrolled_students 원장에도 is_rural_eligible 동기화
  try {
    const isFinalEligible = result ? (result.is_eligible || false) : isType1Eligible;
    await supabase
      .from('enrolled_students')
      .update({ is_rural_eligible: isFinalEligible })
      .eq('id', studentId);
  } catch (e) {
    console.warn('Failed to sync is_rural_eligible in enrolled_students:', e);
  }

  return result;
}

/**
 * 전체 3학년 농어촌 추천 현황 목록 조회 (enrolled_students 통합 DB 연동)
 */
export async function getRuralEligibilityList() {
  const { data: enrolledStudents } = await supabase
    .from('enrolled_students')
    .select('id, user_id, student_code, name, grade, class_no, student_no, seq_no, is_enrolled, is_rural_eligible, apply_school_recommend, apply_rural, rural_type, rural_self_check')

  const { data: allProfs } = await supabase
    .from('profiles')
    .select('*');

  const profs = (allProfs || []).filter(p => p.role !== 'teacher' && p.role !== 'admin');

  const enrolledSet = new Set((enrolledStudents || []).map(e => e.id));
  const enrolledCodeSet = new Set((enrolledStudents || []).filter(e => e.student_code).map(e => String(e.student_code).trim()));

  const profSet = new Set((profs || []).map(p => p.id));
  const profMapByCode = new Map();
  const profMapByClassSeq = new Map();
  (profs || []).forEach(p => {
    if (p.student_code) profMapByCode.set(String(p.student_code).trim(), p);
    if (p.class_no && p.seq_no) profMapByClassSeq.set(`${p.class_no}_${p.seq_no}`, p);
  });

  const separateProfs = (profs || []).filter(p => {
    if (enrolledSet.has(p.id)) return false;
    if (p.student_code && enrolledCodeSet.has(String(p.student_code).trim())) return false;
    return true;
  });

  const [addrRes, eligRes, acadRes] = await Promise.all([
    supabase.from('student_rural_addresses').select('*'),
    supabase.from('student_rural_eligibility').select('*'),
    supabase.from('student_academic_records').select('*, rural_school_cache(*)').order('seq_order', { ascending: true })
  ]);

  const addrMap = new Map();
  (addrRes.data || []).forEach(a => addrMap.set(a.student_id, a));

  const eligMap = new Map();
  (eligRes.data || []).forEach(e => eligMap.set(e.student_id, e));

  const acadMap = new Map();
  (acadRes.data || []).forEach(ar => {
    if (!acadMap.has(ar.student_id)) acadMap.set(ar.student_id, []);
    acadMap.get(ar.student_id).push(ar);
  });

  const list = [];
  const rawList = [...(enrolledStudents || [])];

  separateProfs.forEach(sp => {
    rawList.push({
      ...sp,
      is_separate_applicant: true,
      is_graduated: sp.is_graduated || sp.grade !== 3
    });
  });

  for (const s of rawList) {
    const seqNo = s.seq_no || s.student_no || 0;
    const decryptedStudentName = await decryptText(s.name);

    let profileId = s.is_separate_applicant ? s.id : null;
    if (!profileId) {
      if (s.student_code && profMapByCode.has(String(s.student_code).trim())) {
        profileId = profMapByCode.get(String(s.student_code).trim()).id;
      } else if (s.class_no && seqNo && profMapByClassSeq.has(`${s.class_no}_${seqNo}`)) {
        profileId = profMapByClassSeq.get(`${s.class_no}_${seqNo}`).id;
      }
    }

    const candidateIds = [profileId, s.id].filter(Boolean);

    let rawAcad = null;
    for (const cid of candidateIds) {
      if (acadMap.has(cid)) { rawAcad = acadMap.get(cid); break; }
    }
    const decryptedAcademic = [];
    for (const ar of (rawAcad || [])) {
      decryptedAcademic.push({
        ...ar,
        student_name: await decryptText(ar.student_name),
        change_type: await decryptText(ar.change_type),
        raw_record_text: await decryptText(ar.raw_record_text)
      });
    }

    let rawAddr = null;
    for (const cid of candidateIds) {
      if (addrMap.has(cid)) { rawAddr = addrMap.get(cid); break; }
    }
    let decryptedAddress = null;
    if (rawAddr) {
      decryptedAddress = {
        ...rawAddr,
        student_name: await decryptText(rawAddr.student_name),
        raw_address_text: await decryptText(rawAddr.raw_address_text)
      };
    }

    let rawElig = null;
    for (const cid of candidateIds) {
      if (eligMap.has(cid)) { rawElig = eligMap.get(cid); break; }
    }

    // 학적 이력 기반 중/고교 읍면 재학 자격 계산
    let middleSchoolYears = 0.0;
    let highSchoolYears = 0.0;
    let ruralMiddleFound = false;
    let ruralHighFound = false;

    if (decryptedAcademic && decryptedAcademic.length > 0) {
      for (const rec of decryptedAcademic) {
        const cache = rec.rural_school_cache;
        const isRural = cache ? cache.is_rural : checkIsRuralAddress(rec.school_name || '');
        const schoolKind = cache ? cache.school_kind : (rec.school_name?.includes('고등학교') || rec.school_name?.includes('고교') || rec.school_name?.includes('고') ? '04' : '03');

        if (schoolKind === '03' && isRural) {
          ruralMiddleFound = true;
          middleSchoolYears = 3.0;
        } else if (schoolKind === '04' && isRural) {
          ruralHighFound = true;
          highSchoolYears = 2.5;
        }
      }
    }

    const isGradStudent = s.is_separate_applicant || s.is_graduated || s.is_enrolled === false;
    const isSelfChecked = s.apply_rural !== false && (s.rural_self_check === true || isGradStudent);
    const selectedType = s.rural_type || '유형I';

    let finalEligibility = null;
    if (rawElig) {
      const midYears = Number(rawElig.middle_school_years || 0);
      const highYears = Number(rawElig.high_school_years || 0);
      const acadValid = midYears >= 3.0 && highYears >= 2.0;
      const addrValid = rawElig.address_rural_valid === true;
      const type1Valid = acadValid && addrValid;

      finalEligibility = {
        ...rawElig,
        address_rural_valid: isGradStudent ? (addrValid || isSelfChecked) : addrValid,
        academic_rural_valid: isGradStudent ? (acadValid || isSelfChecked) : acadValid,
        is_type1_eligible: isGradStudent ? (type1Valid || isSelfChecked) : type1Valid,
        is_type2_eligible: rawElig.is_type2_eligible || (isGradStudent && isSelfChecked && selectedType === '유형II'),
        is_manual_approved: rawElig.is_manual_approved || (isGradStudent && isSelfChecked),
        is_eligible: rawElig.is_eligible || (isGradStudent && isSelfChecked),
        manual_reason: await decryptText(rawElig.manual_reason),
        evaluation_notes: await decryptText(rawElig.evaluation_notes)
      };
    } else if (isGradStudent) {
      const isEligible = isSelfChecked && s.apply_rural !== false;
      finalEligibility = {
        address_rural_valid: isEligible,
        academic_rural_valid: isEligible,
        is_type1_eligible: isEligible && selectedType === '유형I',
        is_type2_eligible: isEligible && selectedType === '유형II',
        is_manual_approved: isEligible,
        is_eligible: isEligible,
        evaluation_notes: isEligible ? `졸업생 자가 확인 (${selectedType}): 농어촌 전형 지원가능` : '졸업생: 미지원 설정'
      };
    } else {
      // student_rural_eligibility DB 테이블에 기록이 없으면 미등록(null) 처리
      finalEligibility = null;
    }

    list.push({
      ...s,
      name: decryptedStudentName,
      seq_no: seqNo,
      academicRecords: decryptedAcademic,
      addressInfo: decryptedAddress,
      eligibility: finalEligibility
    });
  }

  const isGrad = (s) => s.is_separate_applicant || s.is_graduated || s.is_enrolled === false;
  list.sort((a, b) => {
    const gradA = isGrad(a) ? 1 : 0;
    const gradB = isGrad(b) ? 1 : 0;
    if (gradA !== gradB) {
      return gradA - gradB;
    }

    const codeA = String(a.student_code || (a.class_no ? `3${String(a.class_no).padStart(2, '0')}${String(a.seq_no || a.student_no || 0).padStart(2, '0')}` : '99999'));
    const codeB = String(b.student_code || (b.class_no ? `3${String(b.class_no).padStart(2, '0')}${String(b.seq_no || b.student_no || 0).padStart(2, '0')}` : '99999'));

    return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
  });

  return list;
}

/**
 * 학생/졸업생 전형 지원 신청 설정 (학교장추천 / 농어촌 전형 & 유형I/II) 업데이트
 */
export async function updateStudentApplicationPreference(studentId, { applySchoolRecommend, applyRural, ruralType, ruralSelfCheck }, studentCode = null) {
  if (!studentId && !studentCode) throw new Error('학생 식별 ID가 필요합니다.');

  const updatePayload = {
    apply_school_recommend: applySchoolRecommend !== false,
    apply_rural: Boolean(applyRural),
    rural_type: applyRural ? (ruralType || '유형I') : null,
    rural_self_check: Boolean(ruralSelfCheck)
  };

  const { data: userAuth } = await supabase.auth.getUser();
  const authUser = userAuth?.user;
  if (authUser?.id) {
    updatePayload.user_id = authUser.id;
  }

  let isUpdated = false;

  // 1-1. studentId로 id 일치건 업데이트 시도
  if (studentId) {
    const { data: d1 } = await supabase
      .from('enrolled_students')
      .update(updatePayload)
      .eq('id', studentId)
      .select('id');
    if (d1 && d1.length > 0) isUpdated = true;
  }

  // 1-2. user_id로 일치건 업데이트 시도
  if (!isUpdated && authUser?.id) {
    const { data: d2 } = await supabase
      .from('enrolled_students')
      .update(updatePayload)
      .eq('user_id', authUser.id)
      .select('id');
    if (d2 && d2.length > 0) isUpdated = true;
  }

  // 1-3. studentCode로 일치건 업데이트 시도
  const codeToMatch = studentCode || authUser?.user_metadata?.student_code || authUser?.user_metadata?.studentCode;
  if (!isUpdated && codeToMatch) {
    const cleanCode = String(codeToMatch).trim();
    const { data: d3 } = await supabase
      .from('enrolled_students')
      .update(updatePayload)
      .eq('student_code', cleanCode)
      .select('id');
    if (d3 && d3.length > 0) isUpdated = true;
  }

  // 2. 만약 어떤 조건으로도 업데이트되지 않은 경우 업서트 (졸업생 등)
  if (!isUpdated) {
    const sName = authUser?.user_metadata?.name || authUser?.user_metadata?.studentName || '졸업생';
    const sCode = codeToMatch || '';

    const targetId = studentId || authUser?.id;
    if (targetId) {
      const { error: upsertErr } = await supabase
        .from('enrolled_students')
        .upsert({
          id: targetId,
          user_id: authUser?.id || targetId,
          name: sName,
          student_code: sCode,
          grade: 3,
          is_enrolled: false,
          ...updatePayload
        }, { onConflict: 'id' });

      if (upsertErr) {
        console.warn('Failed to upsert enrolled_students:', upsertErr);
      }
    }
  }
}

/**
 * 교사의 수동 자격 인정/소명 변경 (유형 I/II 수동 승인 및 지원불가 수동 지정 지원)
 */
export async function updateRuralManualApproval(studentId, isManualApproved, isType2Eligible = false, manualReason = '', overrideIneligible = false) {
  const encReason = manualReason ? await encryptText(manualReason) : null;

  const { data: existing } = await supabase
    .from('student_rural_eligibility')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  let isType1 = false;
  let isType2 = false;
  let isFinalEligible = false;

  if (overrideIneligible) {
    isType1 = false;
    isType2 = false;
    isFinalEligible = false;
  } else if (isType2Eligible) {
    isType1 = false;
    isType2 = true;
    isFinalEligible = true;
  } else if (isManualApproved) {
    isType1 = true;
    isType2 = false;
    isFinalEligible = true;
  } else {
    // 기존 자동 검증 결과 유지
    isType1 = existing ? (existing.is_type1_eligible || false) : false;
    isType2 = existing ? (existing.is_type2_eligible || false) : false;
    isFinalEligible = isType1 || isType2 || (existing ? (existing.is_eligible || false) : false);
  }

  const payload = {
    address_rural_valid: !overrideIneligible,
    academic_rural_valid: !overrideIneligible,
    is_type1_eligible: isType1,
    is_type2_eligible: isType2,
    is_manual_approved: Boolean(isManualApproved || isType2Eligible || overrideIneligible),
    is_eligible: isFinalEligible,
    manual_reason: encReason,
    evaluation_notes: overrideIneligible
      ? (encReason ? await encryptText(`관리자 수동 지정: 지원불가 | 사유: ${manualReason}`) : await encryptText('관리자 수동 지정: 지원불가 (요건 미달)'))
      : (existing?.evaluation_notes || null),
    updated_at: new Date().toISOString()
  };

  let data = null;

  if (existing) {
    const res = await supabase
      .from('student_rural_eligibility')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .maybeSingle();
    data = res.data;
  } else {
    const res = await supabase
      .from('student_rural_eligibility')
      .insert({ ...payload, student_id: studentId })
      .select('*')
      .maybeSingle();
    data = res.data;
  }

  try {
    await supabase
      .from('enrolled_students')
      .update({
        is_rural_eligible: isFinalEligible,
        rural_type: isType2 ? '유형II' : (isType1 ? '유형I' : null),
        apply_rural: isFinalEligible
      })
      .eq('id', studentId);
  } catch (e) {
    console.warn('Failed to sync is_rural_eligible in enrolled_students:', e);
  }

  return data;
}

/**
 * 농어촌 전형 시스템 수시/정시 원서접수 마감일 기준 오픈/마감 상태 검사
 */
export async function checkRuralSystemOpenStatus() {
  try {
    const { data: configs } = await supabase.from('config').select('key, value');
    const configMap = {};
    (configs || []).forEach(c => {
      if (c && c.key) {
        configMap[String(c.key).trim().toLowerCase()] = c.value !== null && c.value !== undefined ? String(c.value).trim() : '';
      }
    });

    const isEnabled = configMap['enable_rural_system'] === 'true';
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('pcm_enable_rural_system', String(isEnabled));
    }

    const now = new Date();

    const susiStartStr = configMap['susi_apply_start_date'];
    const susiEndStr = configMap['susi_apply_end_date'];
    const jungsiStartStr = configMap['jungsi_apply_start_date'];
    const jungsiEndStr = configMap['jungsi_apply_end_date'];

    let isSusiOpen = false;
    let isJungsiOpen = false;
    let activeTerm = '수시';
    let reason = '';

    // 1. 수시 원서접수 기간 검사 (수시 시작일 15일 전부터 마감일까지)
    if (susiStartStr && susiEndStr) {
      const susiStart = new Date(`${susiStartStr}T00:00:00`);
      const susiEnd = new Date(`${susiEndStr}T23:59:59`);

      if (!isNaN(susiStart.getTime()) && !isNaN(susiEnd.getTime())) {
        const susiOpenStart = new Date(susiStart);
        susiOpenStart.setDate(susiOpenStart.getDate() - 15);

        if (now >= susiOpenStart && now <= susiEnd) {
          isSusiOpen = true;
          activeTerm = '수시';
        }
      }
    } else if (susiEndStr) {
      const susiEnd = new Date(`${susiEndStr}T23:59:59`);
      if (!isNaN(susiEnd.getTime()) && now <= susiEnd) {
        isSusiOpen = true;
        activeTerm = '수시';
      }
    } else {
      // 마감일/시작일 미설정 시 기본 오픈
      isSusiOpen = true;
      activeTerm = '수시';
    }

    // 2. 정시 원서접수 기간 검사 (시작일 15일 전부터 마감일까지 오픈)
    if (jungsiStartStr && jungsiEndStr) {
      const jungsiStart = new Date(`${jungsiStartStr}T00:00:00`);
      const jungsiEnd = new Date(`${jungsiEndStr}T23:59:59`);

      if (!isNaN(jungsiStart.getTime()) && !isNaN(jungsiEnd.getTime())) {
        const jungsiOpenStart = new Date(jungsiStart);
        jungsiOpenStart.setDate(jungsiOpenStart.getDate() - 15); // 15일 전부터

        if (now >= jungsiOpenStart && now <= jungsiEnd) {
          isJungsiOpen = true;
          if (!isSusiOpen) {
            activeTerm = '정시';
          }
        }
      }
    }

    const isOpen = isEnabled && (isSusiOpen || isJungsiOpen);

    let periodState = 'open';
    let statusText = `🟢 접수 진행 중 (${activeTerm})`;

    if (!isOpen) {
      let isBeforeSusi = false;
      let isAfterSusi = false;
      let isBeforeJungsi = false;

      if (susiStartStr) {
        const susiStart = new Date(`${susiStartStr}T00:00:00`);
        if (!isNaN(susiStart.getTime())) {
          const susiOpenStart = new Date(susiStart);
          susiOpenStart.setDate(susiOpenStart.getDate() - 15);
          if (now < susiOpenStart) {
            isBeforeSusi = true;
          }
        }
      }

      if (susiEndStr) {
        const susiEnd = new Date(`${susiEndStr}T23:59:59`);
        if (!isNaN(susiEnd.getTime()) && now > susiEnd) {
          isAfterSusi = true;
        }
      }

      if (jungsiStartStr) {
        const jungsiStart = new Date(`${jungsiStartStr}T00:00:00`);
        if (!isNaN(jungsiStart.getTime())) {
          const jungsiOpenStart = new Date(jungsiStart);
          jungsiOpenStart.setDate(jungsiOpenStart.getDate() - 15);
          if (now < jungsiOpenStart) {
            isBeforeJungsi = true;
          }
        }
      }

      if (isBeforeSusi) {
        periodState = 'before';
        statusText = '⚪ 접수 전';
      } else if (isAfterSusi) {
        if (jungsiStartStr && isBeforeJungsi) {
          periodState = 'before';
          statusText = '⚪ 접수 전 (정시)';
        } else {
          periodState = 'closed';
          statusText = '🔒 접수 마감';
        }
      } else {
        periodState = 'closed';
        statusText = '🔒 접수 마감';
      }
    }

    if (!isEnabled) {
      reason = '농어촌 전형 추천자 관리 시스템이 비활성화되어 있습니다.';
    } else if (!isOpen) {
      reason = periodState === 'before'
        ? '현재 농어촌 전형 원서접수 전 기간입니다.'
        : '현재 농어촌 전형 원서접수가 마감되었습니다.';
    }

    return {
      isEnabled,
      isOpen,
      isSusiOpen,
      isJungsiOpen,
      activeTerm,
      periodState,
      statusText,
      susiStartDate: susiStartStr || null,
      susiEndDate: susiEndStr || null,
      jungsiStartDate: jungsiStartStr || null,
      jungsiEndDate: jungsiEndStr || null,
      reason
    };
  } catch (e) {
    console.error('Failed to check rural system open status:', e);
    return { isOpen: true, activeTerm: '수시', periodState: 'open', statusText: '🟢 접수 진행 중 (수시)', reason: '' };
  }
}

/**
 * 관리자 엑셀 (2027학년도 농어촌 및 기회균형(농어촌) 전형.xlsx) 파싱 및 DB 저장
 */
export async function parseAndSaveRuralTracksExcel(workbook) {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rows || rows.length <= 1) {
    throw new Error('엑셀 파일에 데이터가 존재하지 않습니다.');
  }

  const tracksToInsert = [];

  // 2번째 행(인덱스 1)부터 데이터 파싱
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const termType = String(row[0] || '').trim(); // A컬럼: 구분 ('수시', '정시')
    if (termType !== '수시' && termType !== '정시') {
      continue; // A컬럼이 수시 또는 정시인 행만 저장
    }

    const medicalType = String(row[1] || '없음').trim(); // B컬럼: 메디컬
    const region = String(row[2] || '').trim();         // C컬럼: 지역
    const univName = String(row[3] || '').trim();       // D컬럼: 대학 (지역)
    const trackType = String(row[4] || '').trim();      // E컬럼: 전형 유형 (교과/종합/가/나/다)
    const trackName = String(row[5] || '').trim();      // F컬럼: 전형명
    const quota = String(row[6] || '').trim();          // G컬럼: 모집인원
    const evalMethod = String(row[7] || '').trim();     // H컬럼: 전형방법
    const suneungMin = String(row[8] || '').trim();     // I컬럼: 수능최저
    const remarks = String(row[9] || '').trim();        // J컬럼: 비고

    if (!univName || !trackName) continue;

    tracksToInsert.push({
      term_type: termType,
      medical_type: medicalType || '없음',
      region,
      univ_name: univName,
      track_type: trackType,
      track_name: trackName,
      recruitment_quota: quota,
      eval_method: evalMethod,
      suneung_minimum: suneungMin,
      remarks,
      updated_at: new Date().toISOString()
    });
  }

  if (tracksToInsert.length === 0) {
    throw new Error('수시/정시 구분(A컬럼)이 유효한 전형 데이터가 존재하지 않습니다.');
  }

  // 기존 전형 데이터 삭제 후 재등록
  const { error: delErr } = await supabase.from('rural_tracks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) {
    console.warn('Error deleting old rural_tracks:', delErr);
  }

  const { data, error } = await supabase.from('rural_tracks').insert(tracksToInsert).select('*');
  if (error) {
    throw error;
  }

  return data;
}

/**
 * 농어촌 전형 모집요강 정렬 (지역: 서울 -> 경기 -> 인천 -> 기타 가나다순, 지역 내: 대학 -> 전형유형 -> 전형명)
 */
export function sortRuralTracks(rows) {
  const REGION_PRIORITY = { '서울': 1, '경기': 2, '인천': 3 };

  return [...rows].sort((a, b) => {
    const regA = String(a.region || '').trim();
    const regB = String(b.region || '').trim();

    const prioA = REGION_PRIORITY[regA] ?? 999;
    const prioB = REGION_PRIORITY[regB] ?? 999;

    if (prioA !== prioB) {
      return prioA - prioB;
    }

    if (prioA === 999 && prioB === 999 && regA !== regB) {
      if (!regA) return 1;
      if (!regB) return -1;
      const regComp = regA.localeCompare(regB, 'ko');
      if (regComp !== 0) return regComp;
    }

    const univA = String(a.univ_name || '').trim();
    const univB = String(b.univ_name || '').trim();
    const univComp = univA.localeCompare(univB, 'ko');
    if (univComp !== 0) return univComp;

    const trackTypeA = String(a.track_type || '').trim();
    const trackTypeB = String(b.track_type || '').trim();
    const trackTypeComp = trackTypeA.localeCompare(trackTypeB, 'ko');
    if (trackTypeComp !== 0) return trackTypeComp;

    const trackNameA = String(a.track_name || '').trim();
    const trackNameB = String(b.track_name || '').trim();
    return trackNameA.localeCompare(trackNameB, 'ko');
  });
}

/**
 * 정시 원서접수 일정 기준 농어촌 모집요강 기본 구분 (수시/정시/전체) 반환
 * - 정시원서접수 16일전까지: '수시'
 * - 정시원서접수 15일전부터 마감일까지: '정시'
 * - 정시원서접수 마감일 다음날부터: 'all' (전체)
 */
export async function getRuralDefaultTerm() {
  try {
    const { data: configs } = await supabase.from('config').select('key, value');
    const configMap = {};
    (configs || []).forEach(c => {
      if (c && c.key) {
        configMap[String(c.key).trim().toLowerCase()] = c.value !== null && c.value !== undefined ? String(c.value).trim() : '';
      }
    });

    const jungsiStartStr = configMap['jungsi_apply_start_date'];
    const jungsiEndStr = configMap['jungsi_apply_end_date'];

    const now = new Date();
    const todayStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

    if (jungsiStartStr && jungsiEndStr) {
      const jungsiStart = new Date(`${jungsiStartStr}T00:00:00`);
      const jungsiEnd = new Date(`${jungsiEndStr}T23:59:59`);

      if (!isNaN(jungsiStart.getTime()) && !isNaN(jungsiEnd.getTime())) {
        const fifteenDaysBefore = new Date(jungsiStart);
        fifteenDaysBefore.setDate(fifteenDaysBefore.getDate() - 15);
        const fifteenDaysBeforeStr = fifteenDaysBefore.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

        const dayAfterEnd = new Date(jungsiEnd);
        dayAfterEnd.setDate(dayAfterEnd.getDate() + 1);
        const dayAfterEndStr = dayAfterEnd.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

        if (todayStr < fifteenDaysBeforeStr) {
          return '수시';
        } else if (todayStr >= fifteenDaysBeforeStr && todayStr <= jungsiEndStr) {
          return '정시';
        } else if (todayStr >= dayAfterEndStr) {
          return 'all';
        }
      }
    }
  } catch (e) {
    console.error('Failed to compute rural default term:', e);
  }
  return '수시';
}

export async function fetchRuralTracksFromGoogleSheetCsv() {
  try {
    const sheetId = '1SBW1v1B02enRpDcEmIc98wOtyRgnthYkZbONS_byYaU';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.split(/\r?\n/);
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = [];
      let inQuotes = false;
      let cur = '';
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cols.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      cols.push(cur.trim());

      const termType = cols[0] ? cols[0].replace(/^"|"$/g, '').trim() : '';
      if (termType !== '수시' && termType !== '정시') continue;

      const univName = cols[3] ? cols[3].replace(/^"|"$/g, '').trim() : '';
      const trackName = cols[5] ? cols[5].replace(/^"|"$/g, '').trim() : '';
      if (!univName || !trackName) continue;

      result.push({
        id: `csv_${i}`,
        term_type: termType,
        medical_type: cols[1] ? cols[1].replace(/^"|"$/g, '').trim() : '없음',
        region: cols[2] ? cols[2].replace(/^"|"$/g, '').trim() : '',
        univ_name: univName,
        track_type: cols[4] ? cols[4].replace(/^"|"$/g, '').trim() : '',
        track_name: trackName,
        recruitment_quota: cols[6] ? cols[6].replace(/^"|"$/g, '').trim() : '',
        eval_method: cols[7] ? cols[7].replace(/^"|"$/g, '').trim() : '',
        suneung_minimum: cols[8] ? cols[8].replace(/^"|"$/g, '').trim() : '',
        remarks: cols[9] ? cols[9].replace(/^"|"$/g, '').trim() : ''
      });
    }
    return result;
  } catch (e) {
    console.error('Failed fallback Google Sheet fetch:', e);
    return [];
  }
}

/**
 * 농어촌/기회균형 전형 모집요강 목록 조회
 */
export async function getRuralTracks(termType = null) {
  let list = [];
  try {
    let query = supabase.from('rural_tracks').select('*');
    if (termType) {
      query = query.eq('term_type', termType);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      list = data;
    }
  } catch (e) {
    console.warn('DB fetch error, falling back to sheet:', e);
  }

  if (list.length === 0) {
    const csvList = await fetchRuralTracksFromGoogleSheetCsv();
    list = termType ? csvList.filter(t => t.term_type === termType) : csvList;
  }

  return sortRuralTracks(list || []);
}

/**
 * 특정 학생의 농어촌 신청 지망 목록 (1~6지망) 조회
 */
export async function getStudentRuralApplications(studentId) {
  if (!studentId) return [];
  const { data, error } = await supabase
    .from('rural_applications')
    .select('*')
    .eq('student_id', studentId)
    .order('choice_number', { ascending: true });

  if (error) {
    console.error('Error fetching student rural applications:', error);
    return [];
  }
  return data || [];
}

/**
 * 학생 농어촌 신청 지망 목록 (1~6지망) 및 서명 저장
 */
export async function saveStudentRuralApplications(studentId, applications) {
  if (!studentId) throw new Error('학생 식별 ID가 필요합니다.');

  let targetStudentId = studentId;
  const isUuid = typeof studentId === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(studentId);

  // 1. enrolled_students에서 유효한 UUID ID 검색
  try {
    let query = supabase.from('enrolled_students').select('id, user_id, student_code');
    if (isUuid) {
      query = query.or(`id.eq.${studentId},user_id.eq.${studentId}`);
    } else {
      query = query.eq('student_code', String(studentId).trim());
    }
    const { data: st } = await query.maybeSingle();
    if (st?.id) {
      targetStudentId = st.id;
    }
  } catch (e) {
    console.warn('Student lookup failed in saveStudentRuralApplications:', e);
  }

  // 2. 만약 여전히 targetStudentId가 UUID가 아니면 학번 전체 검색 시도
  const isTargetUuid = typeof targetStudentId === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(targetStudentId);
  if (!isTargetUuid) {
    try {
      const { data: stList } = await supabase.from('enrolled_students').select('id, student_code');
      const found = (stList || []).find(s => String(s.student_code).trim() === String(studentId).trim());
      if (found?.id) {
        targetStudentId = found.id;
      }
    } catch (e) {
      console.warn('Fallback student lookup failed:', e);
    }
  }

  const nowIso = new Date().toISOString();

  // 기존 신청 내역 삭제 후 재등록
  try {
    await supabase.from('rural_applications').delete().eq('student_id', targetStudentId);
  } catch (e) {
    console.warn('Delete existing rural_applications failed:', e);
  }

  const rowsToInsert = [];

  if (applications && applications.length > 0) {
    applications.forEach((app, index) => {
      const isCustom = Boolean(app.is_custom_entry || (app.remarks && String(app.remarks).includes('[미등록')));
      const formattedRemarks = isCustom && !String(app.remarks || '').includes('[미등록')
        ? `[미등록 직접입력] ${app.remarks || ''}`.trim()
        : (app.remarks || '');

      const rawTrackId = app.track_id ? String(app.track_id) : '';
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawTrackId);
      const validTrackId = isUuid ? rawTrackId : null;

      rowsToInsert.push({
        student_id: targetStudentId,
        choice_number: index + 1,
        track_id: validTrackId,
        term_type: app.term_type || '수시',
        medical_type: app.medical_type || '없음',
        region: app.region || '',
        univ_name: app.univ_name || '',
        department: app.department || '',
        track_type: app.track_type || '',
        track_name: app.track_name || '',
        recruitment_quota: app.recruitment_quota || '',
        eval_method: app.eval_method || '',
        suneung_minimum: app.suneung_minimum || '',
        remarks: formattedRemarks,
        is_warning_acknowledged: Boolean(app.is_warning_acknowledged),
        signed_at: app.signed_at || null,
        status: app.status || 'submitted',
        updated_at: nowIso
      });
    });
  }

  if (rowsToInsert.length === 0) {
    return [];
  }

  const { data, error } = await supabase.from('rural_applications').insert(rowsToInsert).select('*');
  if (error) {
    console.error('Error in saveStudentRuralApplications insert:', error);
    throw error;
  }
  return data;
}

/**
 * 전체 학생의 농어촌 신청 현황 조회 (교사/관리자용, 학급별/전체 통계)
 */
export async function getAllRuralApplications() {
  const { data: apps, error } = await supabase
    .from('rural_applications')
    .select('*')
    .order('choice_number', { ascending: true });

  if (error) {
    console.error('Error fetching all rural applications:', error);
    return [];
  }

  return apps || [];
}

/**
 * 교사/관리자가 학생 농어촌 신청 항목 직접 수정
 */
export async function updateRuralApplicationByTeacher(applicationId, updatePayload) {
  const { data, error } = await supabase
    .from('rural_applications')
    .update({
      ...updatePayload,
      status: 'teacher_edited',
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
}

/**
 * 교사/관리자가 학생 농어촌 신청 항목 삭제
 */
export async function deleteRuralApplicationByTeacher(applicationId) {
  const { error } = await supabase
    .from('rural_applications')
    .delete()
    .eq('id', applicationId);

  if (error) {
    throw error;
  }
  return true;
}

/**
 * 구글 스프레드시트 ID로 농어촌 및 기회균형(농어촌) 전형 모집요강 실시간 동기화
 */
export async function syncRuralTracksFromGoogleSheet(sheetId) {
  if (!sheetId || !sheetId.trim()) {
    throw new Error('구글 스프레드시트 ID가 입력되지 않았습니다.');
  }

  const cleanId = sheetId.trim();
  let workbook = null;

  // 1. Google Visualization API (out:csv) — 가장 신뢰성 높은 CORS 허용 방식
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv`;
    const res = await fetch(gvizUrl);
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 20) {
        workbook = XLSX.read(text, { type: 'string' });
      }
    }
  } catch (e) {
    console.warn('GViz CSV fetch failed, trying direct export / proxy:', e);
  }

  // 2. Direct export & Proxy Fallbacks
  if (!workbook) {
    const urlsToTry = [
      `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv`,
      `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=xlsx`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv`)}`
    ];

    for (const u of urlsToTry) {
      try {
        const res = await fetch(u);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          if (buffer.byteLength > 50) {
            const isXlsx = u.includes('format=xlsx');
            if (isXlsx) {
              workbook = XLSX.read(buffer, { type: 'array' });
            } else {
              const text = new TextDecoder().decode(buffer);
              workbook = XLSX.read(text, { type: 'string' });
            }
            break;
          }
        }
      } catch (e) {
        console.warn(`Fetch from ${u} failed:`, e);
      }
    }
  }

  if (!workbook) {
    throw new Error(`구글 스프레드시트를 불러올 수 없습니다. 구글 시트 공유 설정이 '링크가 있는 모든 사용자에게 공개(웹에 게시 또는 링크 보기 가능)' 상태인지 확인하세요.`);
  }

  return await parseAndSaveRuralTracksExcel(workbook);
}

/**
 * 1. 전형 요강 DB 초기화 (rural_tracks 전체 삭제)
 */
export async function resetRuralTracksDB() {
  const { error } = await supabase.from('rural_tracks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
  return true;
}

/**
 * 2. 학적 및 자격 검증 DB 초기화 (student_rural_addresses, student_academic_records, student_rural_eligibility 삭제 및 enrolled_students 초기화)
 */
export async function resetRuralAcademicDB() {
  const { error: err1 } = await supabase.from('student_rural_addresses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: err2 } = await supabase.from('student_academic_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: err3 } = await supabase.from('student_rural_eligibility').delete().neq('student_id', '00000000-0000-0000-0000-000000000000');
  const { error: err4 } = await supabase.from('rural_school_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  try {
    await supabase.from('enrolled_students').update({ is_rural_eligible: false }).eq('is_enrolled', true);
  } catch (e) {
    console.warn('Reset is_rural_eligible warning:', e);
  }
  if (err1) throw err1;
  if (err2) throw err2;
  if (err3) throw err3;
  if (err4) throw err4;
  return true;
}

/**
 * 3. 학생 신청 현황 DB 초기화 (rural_applications 전체 삭제 및 서명 스토리지 초기화)
 */
export async function resetRuralApplicationsDB() {
  await clearAllRuralStorage();
  const { error } = await supabase.from('rural_applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: sigErr } = await supabase.from('rural_signatures').delete().neq('student_id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
  if (sigErr) console.warn('Reset rural_signatures warning:', sigErr);
  return true;
}

/**
 * 4. 농어촌 시스템 전체 DB 일괄 초기화
 */
export async function resetAllRuralDBs() {
  await clearAllRuralStorage();
  await resetRuralTracksDB();
  await resetRuralAcademicDB();
  await resetRuralApplicationsDB();
  return true;
}
