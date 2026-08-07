import { supabase } from '../utils/supabaseClient';
import * as XLSX from 'xlsx';
import { encryptText, decryptText } from '../utils/cryptoUtils';

const API_BASE_URL = 'https://www.schoolinfo.go.kr/openApi.do';

/**
 * 학교알리미 API 키 동적 로드 (환경변수 VITE_SCHOOL_INFO_API_KEY 우선, 없으면 Supabase config 테이블)
 */
export async function getSchoolInfoApiKey() {
  const envKey = import.meta.env.VITE_SCHOOL_INFO_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }

  try {
    const { data } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'school_info_api_key')
      .maybeSingle();

    if (data && data.value && data.value.trim()) {
      return data.value.trim();
    }
  } catch (e) {
    console.warn('Error fetching school_info_api_key from config:', e);
  }

  return '';
}

// 주요 시도 코드 목록 (경기: 41, 서울: 11, 인천: 28, 강원: 42, 충북: 43, 충남: 44, 전북: 45, 전남: 46, 경북: 47, 경남: 48, 세종: 50, 제주: 50)
const MAJOR_SIDO_CODES = ['41', '11', '28', '44', '43', '47', '48', '45', '46', '42', '50'];

// 시도별 주요 시군구 코드 캐시/맵핑 (필수 인자 대응)
const SGG_CODE_MAP = {
  '41': ['41111', '41113', '41115', '41117', '41131', '41133', '41135', '41171', '41173', '41190', '41210', '41220', '41250', '41271', '41273', '41281', '41285', '41287', '41360', '41370', '41390', '41410', '41430', '41450', '41461', '41463', '41465', '41480', '41500', '41550', '41570', '41590', '41610', '41630', '41650', '41670', '41800', '41820', '41830'], // 경기 용인/수원/포천/화성 등 주요 시군구
  '11': ['11110', '11140', '11170', '11200', '11215', '11230', '11260', '11290', '11305', '11320', '11350', '11380', '11410', '11440', '11470', '11500', '11530', '11545', '11560', '11590', '11620', '11650', '11680', '11710', '11740']
};

/**
 * 학교 주소 내 읍/면 포함 여부 판단
 */
export function checkIsRuralAddress(addressStr) {
  if (!addressStr) return false;
  return /([가-힣]+(읍|면))\b/.test(addressStr);
}

/**
 * 학교알리미 Open API를 통한 학교 정보 검색 및 DB 캐싱
 */
export async function getOrFetchSchoolInfo(schoolName) {
  if (!schoolName) return null;

  const cleanName = schoolName.trim();

  // 1. DB 캐시 확인
  try {
    const { data: cached } = await supabase
      .from('rural_school_cache')
      .select('*')
      .eq('school_name', cleanName)
      .maybeSingle();

    if (cached) {
      return cached;
    }
  } catch (e) {
    // ignore cache query error
  }

  // 2. 학교명 및 주소 정규식으로 읍/면 소재 여부 즉시 판정 (무한루프 방지)
  const isRural = checkIsRuralAddress(cleanName);
  const fetchedInfo = {
    school_name: cleanName,
    school_kind: cleanName.includes('고등학교') || cleanName.includes('고교') || cleanName.includes('고') ? '04' : '03',
    bjd_code: '',
    address: isRural ? '읍/면 소재 학교 (자동 판정)' : '동지역 소재 학교 (자동 판정)',
    detail_address: '',
    road_address: '',
    is_rural: isRural
  };

  // DB 캐시에 저장
  try {
    const { data: savedCache } = await supabase
      .from('rural_school_cache')
      .upsert(fetchedInfo, { onConflict: 'school_name' })
      .select('*')
      .maybeSingle();

    if (savedCache) return savedCache;
  } catch (e) {
    console.warn('rural_school_cache save warning:', e);
  }

  return fetchedInfo;
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
  const grade3Students = await getGrade3Students();

  // 다중 키 지원 매칭용 맵 작성
  const mapClassSeqName = new Map(); // ${classNo}_${seqNo}_${name}
  const mapClassSeq     = new Map(); // ${classNo}_${seqNo}
  const mapClassName    = new Map(); // ${classNo}_${name}
  const mapCode         = new Map(); // ${studentCode}
  const mapName         = new Map(); // ${name} -> array

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

  // 1. 주소 데이터 저장
  if (parsedAddressData && parsedAddressData.length > 0) {
    for (const item of parsedAddressData) {
      for (const st of item.students) {
        const student = findMatchedStudent(st);

        if (!student) {
          logs.push(`[주소 매칭 실패] 3학년 ${st.classNo}반 ${st.seqNo}번 ${st.studentName}`);
          continue;
        }

        const targetId = student.profile_id || student.id;
        const encName = await encryptText(st.studentName || student.name);
        const encRawAddress = await encryptText(st.rawAddress);

        const addrPayload = {
          student_id: targetId,
          class_no: st.classNo || student.class_no,
          seq_no: st.seqNo || student.seq_no,
          student_name: encName,
          raw_address_text: encRawAddress,
          parsed_addresses: st.parsedAddresses,
          has_rural_address: st.hasRuralAddress,
          notes: st.isMultipleAddress ? '다중 주소 기재 (확인 필요)' : null,
          updated_at: new Date().toISOString()
        };

        try {
          const { data: existingAddr } = await supabase
            .from('student_rural_addresses')
            .select('id')
            .eq('student_id', targetId)
            .maybeSingle();

          if (existingAddr) {
            await supabase
              .from('student_rural_addresses')
              .update(addrPayload)
              .eq('id', existingAddr.id);
          } else {
            await supabase
              .from('student_rural_addresses')
              .insert(addrPayload);
          }
        } catch (e) {
          console.warn('student_rural_addresses save warning:', e);
        }
      }
    }
  }

  // 2. 학적 데이터 저장 & 학교 정보 API 캐싱
  if (parsedAcademicData && parsedAcademicData.length > 0) {
    for (const item of parsedAcademicData) {
      for (const st of item.students) {
        const student = findMatchedStudent(st);

        if (!student) {
          logs.push(`[학적 매칭 실패] 3학년 ${st.classNo}반 ${st.seqNo}번 ${st.studentName}`);
          continue;
        }

        const targetId = student.profile_id || student.id;

        try {
          // 기존 학적 기록 삭제 후 재등록
          await supabase
            .from('student_academic_records')
            .delete()
            .eq('student_id', targetId);

          for (const rec of st.records) {
            const schoolName = rec.extractedSchools[0] || null;
            let schoolCache = null;
            if (schoolName) {
              schoolCache = await getOrFetchSchoolInfo(schoolName);
            }

            const encName = await encryptText(st.studentName || student.name);
            const encRecordText = await encryptText(rec.rawRecordText);

            await supabase
              .from('student_academic_records')
              .insert({
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
        } catch (e) {
          console.warn('student_academic_records insert error:', e);
        }
      }
    }
  }

  // 3. 3학년 전체 학생에 대해 농어촌 전형 자격 자동 평가 수행 및 enrolled_students 연동
  for (const student of grade3Students) {
    await evaluateStudentRuralEligibility(student.id, student.profile_id);
  }

  return { success: true, logs };
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

  // 4. student_rural_eligibility 에 저장
  const evalData = {
    middle_school_years: middleSchoolYears,
    high_school_years: highSchoolYears,
    total_rural_years: totalRuralYears,
    address_rural_valid: addressRuralValid,
    academic_rural_valid: academicRuralValid,
    is_type1_eligible: isType1Eligible,
    is_eligible: isType1Eligible,
    evaluation_notes: await encryptText(notes.join(' | ')),
    updated_at: new Date().toISOString()
  };

  let result = null;
  try {
    const { data: existing } = await supabase
      .from('student_rural_eligibility')
      .select('*')
      .eq('student_id', targetId)
      .maybeSingle();

    if (existing) {
      const isFinal = bothUploaded
        ? (isType1Eligible || (existing.is_type2_eligible || false) || (existing.is_manual_approved || false))
        : ((existing.is_type2_eligible || false) || (existing.is_manual_approved || false));

      const { data: updated } = await supabase
        .from('student_rural_eligibility')
        .update({
          ...evalData,
          is_type2_eligible: existing.is_type2_eligible || false,
          is_eligible: isFinal
        })
        .eq('id', existing.id)
        .select('*')
        .maybeSingle();
      if (updated) result = updated;
    } else {
      const { data: inserted } = await supabase
        .from('student_rural_eligibility')
        .insert({ ...evalData, is_type2_eligible: false, student_id: targetId })
        .select('*')
        .maybeSingle();
      if (inserted) result = inserted;
    }
  } catch (e) {
    console.warn('student_rural_eligibility save warning:', e);
  }

  // enrolled_students 원장에도 is_rural_eligible 동기화
  try {
    const isFinalEligible = result?.is_eligible || false;
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
    let decryptedEligibility = null;
    if (rawElig) {
      decryptedEligibility = {
        ...rawElig,
        manual_reason: await decryptText(rawElig.manual_reason),
        evaluation_notes: await decryptText(rawElig.evaluation_notes)
      };
    }

    const isSelfChecked = s.apply_rural !== false && s.rural_self_check === true;
    const selectedType = s.rural_type || '유형I';

    const finalEligibility = decryptedEligibility || {
      address_rural_valid: decryptedAddress?.has_rural_address || isSelfChecked,
      academic_rural_valid: decryptedAcademic.length > 0 || isSelfChecked,
      is_type1_eligible: isSelfChecked ? selectedType === '유형I' : ((decryptedAddress?.has_rural_address || false) && decryptedAcademic.length > 0),
      is_type2_eligible: isSelfChecked ? selectedType === '유형II' : false,
      is_manual_approved: isSelfChecked,
      is_eligible: isSelfChecked ? true : (s.is_rural_eligible || false),
      evaluation_notes: isSelfChecked ? `본인 자격 직접 확인 (${selectedType}): 자동 지원가능` : (s.is_rural_eligible ? '최종 판정: 농어촌 전형 지원가능' : '학적 및 주소 정보 미등록')
    };

    list.push({
      ...s,
      name: decryptedStudentName,
      seq_no: seqNo,
      academicRecords: decryptedAcademic,
      addressInfo: decryptedAddress,
      eligibility: finalEligibility
    });
  }

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
 * 교사의 수동 자격 인정/소명 변경 (유형 I 수동승인 및 유형 II 수동지정 지원)
 */
export async function updateRuralManualApproval(studentId, isManualApproved, isType2Eligible = false, manualReason = '') {
  const encReason = manualReason ? await encryptText(manualReason) : null;

  const { data: existing } = await supabase
    .from('student_rural_eligibility')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  const isFinalEligible = (existing?.is_type1_eligible || false) || isType2Eligible || isManualApproved;

  const payload = {
    is_manual_approved: isManualApproved,
    is_type2_eligible: isType2Eligible,
    is_eligible: isFinalEligible,
    manual_reason: encReason,
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
      .update({ is_rural_eligible: isFinalEligible })
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

    const susiEndStr = configMap['susi_apply_end_date'];
    const jungsiStartStr = configMap['jungsi_apply_start_date'];
    const jungsiEndStr = configMap['jungsi_apply_end_date'];

    let isSusiOpen = false;
    let isJungsiOpen = false;
    let activeTerm = '수시';
    let reason = '';

    // 1. 수시 원서접수 기간 검사 (마감일 당일까지 접근 허용)
    if (susiEndStr) {
      const susiEnd = new Date(`${susiEndStr}T23:59:59`);
      if (!isNaN(susiEnd.getTime()) && now <= susiEnd) {
        isSusiOpen = true;
        activeTerm = '수시';
      }
    } else {
      // 마감일 미설정 시 기본 오픈
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

    if (!isEnabled) {
      reason = '농어촌 전형 추천자 관리 시스템이 비활성화되어 있습니다.';
    } else if (!isOpen) {
      reason = '현재 농어촌 전형 원서접수 기간이 아닙니다. (수시 마감 완료 또는 정시 시작 전)';
    }

    return {
      isEnabled,
      isOpen,
      isSusiOpen,
      isJungsiOpen,
      activeTerm,
      susiEndDate: susiEndStr || null,
      jungsiStartDate: jungsiStartStr || null,
      jungsiEndDate: jungsiEndStr || null,
      reason
    };
  } catch (e) {
    console.error('Failed to check rural system open status:', e);
    return { isOpen: true, activeTerm: '수시', reason: '' };
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
export async function saveStudentRuralApplications(studentId, applications, studentSignature = null, parentSignature = null) {
  if (!studentId) throw new Error('학생 식별 ID가 필요합니다.');

  // 기존 신청 내역 삭제 후 재등록
  await supabase.from('rural_applications').delete().eq('student_id', studentId);

  if (!applications || applications.length === 0) {
    return [];
  }

  const nowIso = new Date().toISOString();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id || null;

  const rowsToInsert = applications.map((app, index) => ({
    student_id: studentId,
    user_id: userId,
    choice_number: index + 1,
    track_id: app.track_id || null,
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
    remarks: app.remarks || '',
    is_warning_acknowledged: Boolean(app.is_warning_acknowledged),
    student_signature: studentSignature || app.student_signature || null,
    parent_signature: parentSignature || app.parent_signature || null,
    signed_at: (studentSignature || parentSignature) ? nowIso : (app.signed_at || null),
    status: app.status || 'submitted',
    updated_at: nowIso
  }));

  const { data, error } = await supabase.from('rural_applications').insert(rowsToInsert).select('*');
  if (error) {
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
  const { error: err3 } = await supabase.from('student_rural_eligibility').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  try {
    await supabase.from('enrolled_students').update({ is_rural_eligible: false }).eq('is_enrolled', true);
  } catch (e) {
    console.warn('Reset is_rural_eligible warning:', e);
  }
  if (err1) throw err1;
  if (err2) throw err2;
  if (err3) throw err3;
  return true;
}

/**
 * 3. 학생 신청 현황 DB 초기화 (rural_applications 전체 삭제)
 */
export async function resetRuralApplicationsDB() {
  const { error } = await supabase.from('rural_applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
  return true;
}

/**
 * 4. 농어촌 시스템 전체 DB 일괄 초기화
 */
export async function resetAllRuralDBs() {
  await resetRuralTracksDB();
  await resetRuralAcademicDB();
  await resetRuralApplicationsDB();
  return true;
}
