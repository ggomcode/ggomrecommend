import { supabase } from '../utils/supabaseClient';
import * as XLSX from 'xlsx';

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
  const { data: cached } = await supabase
    .from('rural_school_cache')
    .select('*')
    .eq('school_name', cleanName)
    .maybeSingle();

  if (cached) {
    return cached;
  }

  // 2. API 키 동적 조회
  const apiKey = await getSchoolInfoApiKey();
  if (!apiKey) {
    console.warn('[SchoolAPI] API Key가 설정되지 않았습니다. .env (VITE_SCHOOL_INFO_API_KEY) 또는 시스템 설정을 확인하세요.');
  }

  // 3. 캐시에 없으면 학교알리미 API 검색
  let fetchedInfo = null;

  // 고등학교('04') 및 중학교('03') 검색 시도
  const kinds = ['04', '03'];
  
  for (const kind of kinds) {
    if (fetchedInfo) break;

    // 경기/서울 등 주요 시도/시군구 순회 검색 시도
    for (const sido of ['41', '11', '44', '43', '47', '48', '45', '46', '42']) {
      if (fetchedInfo) break;
      const sggList = SGG_CODE_MAP[sido] || [sido + '110'];

      for (const sgg of sggList.slice(0, 10)) { // 성능을 위해 주요 시군구 우선 조회
        try {
          const url = `${API_BASE_URL}?apiKey=${apiKey}&apiType=0&schulKndCode=${kind}&sidoCode=${sido}&sggCode=${sgg}`;
          const res = await fetch(url);
          const json = await res.json();

          if (json && json.list && Array.isArray(json.list)) {
            const matched = json.list.find(item => item.SCHUL_NM && item.SCHUL_NM.trim() === cleanName);
            if (matched) {
              fetchedInfo = {
                school_name: cleanName,
                school_kind: kind,
                bjd_code: matched.ADRCD_ID || matched.ADRCD_CD || '',
                address: matched.ADRES_BRKDN || '',
                detail_address: matched.DTLAD_BRKDN || '',
                road_address: matched.SCHUL_RDNMA || '',
                is_rural: checkIsRuralAddress(matched.ADRES_BRKDN || matched.SCHUL_RDNMA || '')
              };
              break;
            }
          }
        } catch (e) {
          console.warn(`[SchoolAPI] Error querying ${cleanName}:`, e);
        }
      }
    }
  }

  // API에서 검색 실패 시 기본 fallback 생성 (학교명 기반 읍/면 정규식 추정)
  if (!fetchedInfo) {
    fetchedInfo = {
      school_name: cleanName,
      school_kind: cleanName.includes('고등학교') || cleanName.includes('고교') || cleanName.includes('고') ? '04' : '03',
      bjd_code: '',
      address: '주소 정보 미확인 (직접 확인 필요)',
      detail_address: '',
      road_address: '',
      is_rural: checkIsRuralAddress(cleanName) // 학교명에 읍/면이 포함되었는지 fallback 파악
    };
  }

  // DB 캐시에 저장
  const { data: savedCache } = await supabase
    .from('rural_school_cache')
    .upsert(fetchedInfo, { onConflict: 'school_name' })
    .select('*')
    .single();

  return savedCache || fetchedInfo;
}

/**
 * 3학년 전체 학생 프로필 정보 조회
 */
/**
 * 3학년 전교생 목록 조회 (학교장 추천 시스템 통합 DB enrolled_students 마스터 참조)
 */
export async function getGrade3Students() {
  const { data: enrolled, error: enrolledErr } = await supabase
    .from('enrolled_students')
    .select('id, student_code, name, grade, class_no, student_no, seq_no, is_enrolled')
    .eq('is_enrolled', true)
    .eq('grade', 3)
    .order('class_no', { ascending: true })
    .order('student_no', { ascending: true });

  let students = (enrolled || []).map(s => ({
    ...s,
    seq_no: s.seq_no || s.student_no || 0
  }));

  if (students.length === 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, student_code, name, grade, class_no, seq_no, is_enrolled')
      .eq('role', 'student')
      .eq('grade', 3)
      .order('class_no', { ascending: true })
      .order('seq_no', { ascending: true });

    if (profs && profs.length > 0) {
      students = profs.map(s => ({
        ...s,
        seq_no: s.seq_no || 0
      }));
    }
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

        await supabase
          .from('student_rural_addresses')
          .upsert({
            student_id: student.id,
            class_no: st.classNo || student.class_no,
            seq_no: st.seqNo || student.seq_no,
            student_name: st.studentName || student.name,
            raw_address_text: st.rawAddress,
            parsed_addresses: st.parsedAddresses,
            has_rural_address: st.hasRuralAddress,
            notes: st.isMultipleAddress ? '다중 주소 기재 (확인 필요)' : null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'student_id' });
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

        // 기존 학적 기록 삭제 후 재등록
        await supabase
          .from('student_academic_records')
          .delete()
          .eq('student_id', student.id);

        for (const rec of st.records) {
          const schoolName = rec.extractedSchools[0] || null;
          let schoolCache = null;
          if (schoolName) {
            schoolCache = await getOrFetchSchoolInfo(schoolName);
          }

          await supabase
            .from('student_academic_records')
            .insert({
              student_id: student.id,
              class_no: st.classNo || student.class_no,
              seq_no: st.seqNo || student.seq_no,
              student_name: st.studentName || student.name,
              seq_order: rec.seqOrder,
              record_date: rec.recordDate ? parseToIsoDate(rec.recordDate) : null,
              change_type: rec.rawRecordText,
              school_name: schoolName,
              school_cache_id: schoolCache ? schoolCache.id : null,
              raw_record_text: rec.rawRecordText,
              updated_at: new Date().toISOString()
            });
        }
      }
    }
  }

  // 3. 3학년 전체 학생에 대해 농어촌 전형 자격 자동 평가 수행 및 enrolled_students 연동
  for (const student of grade3Students) {
    await evaluateStudentRuralEligibility(student.id);
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
export async function evaluateStudentRuralEligibility(studentId) {
  // 주소 정보 조회
  const { data: addressRec } = await supabase
    .from('student_rural_addresses')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  // 학적 이력 조회 (학교 캐시 join)
  const { data: academicRecs } = await supabase
    .from('student_academic_records')
    .select('*, rural_school_cache(*)')
    .eq('student_id', studentId)
    .order('seq_order', { ascending: true });

  const notes = [];
  const addressRuralValid = addressRec ? addressRec.has_rural_address : false;

  if (!addressRec) {
    notes.push('주소 정보 미등록 (지원불가)');
  } else if (!addressRuralValid) {
    notes.push('주소지에 읍/면/리 미포함 (동지역 주소 - 지원불가)');
  } else {
    notes.push('주소 요건 충족 (읍/면/리 소재)');
  }

  let middleSchoolYears = 0.0;
  let highSchoolYears = 0.0;
  let isMiddleValid = false;
  let isHighValid = false;

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1 ~ 12

  // 고3 재학 시점 산출 (고3 3월~8월: 약 2.0~2.4년, 9월 원서접수시: 약 2.5년)
  let currentHighSchoolAccYears = 2.5; // 기본 원서접수 시점 (2년 6개월)
  if (currentMonth >= 3 && currentMonth <= 5) {
    currentHighSchoolAccYears = 2.0; // 고3 1학기 초 (2년 0개월)
  } else if (currentMonth >= 6 && currentMonth <= 8) {
    currentHighSchoolAccYears = 2.3; // 고3 1학기 기말/여름 (2년 3개월)
  }

  if (!academicRecs || academicRecs.length === 0) {
    notes.push('학적 기록 미등록 (지원불가)');
  } else {
    let ruralMiddleFound = false;
    let ruralHighFound = false;
    let hasNonRuralHighTransfer = false;

    academicRecs.forEach(rec => {
      const cache = rec.rural_school_cache;
      const isRural = cache ? cache.is_rural : checkIsRuralAddress(rec.school_name || '');
      const recText = rec.raw_record_text || '';

      // 중학교 판정
      if (recText.includes('중학교') || (rec.school_name && rec.school_name.includes('중'))) {
        if (isRural) {
          ruralMiddleFound = true;
          middleSchoolYears = 3.0; // 중학교 3년 완수
          isMiddleValid = true;
        } else {
          notes.push(`중학교(${rec.school_name || '미확인'}) 동지역 소재 (지원불가)`);
        }
      }

      // 고등학교 판정
      if (recText.includes('고등학교') || (rec.school_name && rec.school_name.includes('고'))) {
        if (isRural) {
          ruralHighFound = true;
        } else {
          hasNonRuralHighTransfer = true;
          notes.push(`고등학교(${rec.school_name || '미확인'}) 동지역 소재 (지원불가)`);
        }
      }
    });

    if (ruralMiddleFound) {
      notes.push('중학교 3년 읍면 소재 충족');
    } else if (middleSchoolYears === 0) {
      notes.push('읍면 중학교 재학 기록 없음 (지원불가)');
    }

    if (ruralHighFound && !hasNonRuralHighTransfer) {
      isHighValid = true;
      highSchoolYears = currentHighSchoolAccYears; // 고교 현재 누적 연수 (약 2년 6개월 / 3년 예정)
      notes.push(`고등학교 읍면 소재 (현재 약 ${currentHighSchoolAccYears}년 재학 중 / 졸업시 3년 충족 예정)`);
    } else if (!ruralHighFound) {
      notes.push('읍면 고등학교 재학 기록 없음 (지원불가)');
    }
  }

  const totalRuralYears = middleSchoolYears + highSchoolYears;
  const isEligible = addressRuralValid && isMiddleValid && isHighValid;

  if (isEligible) {
    notes.push('최종 판정: 농어촌 전형 지원가능');
  } else {
    notes.push('최종 판정: 농어촌 전형 지원불가');
  }

  // 4. student_rural_eligibility 에 Upsert
  const evalData = {
    student_id: studentId,
    middle_school_years: middleSchoolYears,
    high_school_years: highSchoolYears,
    total_rural_years: totalRuralYears,
    address_rural_valid: addressRuralValid,
    is_eligible: isEligible,
    evaluation_notes: notes.join(' | '),
    updated_at: new Date().toISOString()
  };

  const { data: result } = await supabase
    .from('student_rural_eligibility')
    .upsert(evalData, { onConflict: 'student_id' })
    .select('*')
    .single();

  // enrolled_students 원장에도 is_rural_eligible 동기화
  try {
    const isFinalEligible = isEligible || (result?.is_manual_approved || false);
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
  const { data: enrolledStudents, error: enrolledErr } = await supabase
    .from('enrolled_students')
    .select(`
      id, student_code, name, grade, class_no, student_no, seq_no, is_enrolled,
      student_rural_addresses(*),
      student_rural_eligibility(*)
    `)
    .eq('is_enrolled', true)
    .eq('grade', 3)
    .order('class_no', { ascending: true })
    .order('student_no', { ascending: true });

  let rawList = enrolledStudents || [];

  if (rawList.length === 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select(`
        id, student_code, name, grade, class_no, seq_no, phone_last4,
        student_rural_addresses(*),
        student_rural_eligibility(*)
      `)
      .eq('role', 'student')
      .eq('grade', 3)
      .order('class_no', { ascending: true })
      .order('seq_no', { ascending: true });

    rawList = profilesData || [];
  }

  const list = [];
  for (const s of rawList) {
    const seqNo = s.seq_no || s.student_no || 0;
    const { data: academic } = await supabase
      .from('student_academic_records')
      .select('*, rural_school_cache(*)')
      .eq('student_id', s.id)
      .order('seq_order', { ascending: true });

    list.push({
      ...s,
      seq_no: seqNo,
      academicRecords: academic || [],
      addressInfo: Array.isArray(s.student_rural_addresses) ? s.student_rural_addresses[0] : s.student_rural_addresses,
      eligibility: Array.isArray(s.student_rural_eligibility) ? s.student_rural_eligibility[0] : s.student_rural_eligibility
    });
  }

  return list;
}

/**
 * 교사의 수동 자격 인정/소명 변경 및 enrolled_students 통합 DB 동기화
 */
export async function updateRuralManualApproval(studentId, isManualApproved, manualReason) {
  const { data, error } = await supabase
    .from('student_rural_eligibility')
    .upsert({
      student_id: studentId,
      is_manual_approved: isManualApproved,
      manual_reason: manualReason,
      updated_at: new Date().toISOString()
    }, { onConflict: 'student_id' })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  try {
    await supabase
      .from('enrolled_students')
      .update({ is_rural_eligible: isManualApproved })
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
      configMap[c.key] = c.value;
    });

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

    const isOpen = isSusiOpen || isJungsiOpen;

    if (!isOpen) {
      reason = '현재 농어촌 전형 원서접수 기간이 아닙니다. (수시 마감 완료 또는 정시 시작 전)';
    }

    return {
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
 * 농어촌/기회균형 전형 모집요강 목록 조회
 */
export async function getRuralTracks(termType = null) {
  let query = supabase.from('rural_tracks').select('*').order('univ_name', { ascending: true });
  if (termType) {
    query = query.eq('term_type', termType);
  }
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching rural tracks:', error);
    return [];
  }
  return data || [];
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
  const rowsToInsert = applications.map((app, index) => ({
    student_id: studentId,
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

  // 1. XLSX 바이너리 내보내기 시도 (구글 시트 사본 및 원본 일괄 대응)
  try {
    const xlsxUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=xlsx`;
    const res = await fetch(xlsxUrl);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      workbook = XLSX.read(buffer, { type: 'array' });
    }
  } catch (e) {
    console.warn('XLSX format fetch failed, trying CSV format:', e);
  }

  // 2. CSV 내보내기 폴백 시도
  if (!workbook) {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv`;
    const res = await fetch(csvUrl);
    if (!res.ok) {
      throw new Error(`구글 스프레드시트를 불러올 수 없습니다. (상태 코드: ${res.status}). 구글 시트 공유 설정이 '링크가 있는 모든 사용자에게 공개(웹에 게시 또는 링크 보기 가능)' 상태인지 확인하세요.`);
    }
    const csvText = await res.text();
    workbook = XLSX.read(csvText, { type: 'string' });
  }

  return await parseAndSaveRuralTracksExcel(workbook);
}
