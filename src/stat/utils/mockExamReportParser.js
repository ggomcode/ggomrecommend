import * as pdfjsLib from 'pdfjs-dist'
// worker를 인라인 번들링하여 브라우저 환경, 오프라인, 스쿨넷 방화벽, CDN 차단 환경에서도 100% 안전하게 동작하도록 보장
import 'pdfjs-dist/build/pdf.worker.min.js'
import * as XLSX from 'xlsx'

// PDF.js 워커 설정 (CDN 최신 안정 버전 및 인라인 번들 워커 이중화)
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  } catch (_) {
    // fallback
  }
}

export const MOCK_RESULT_STANDARD_HEADERS = [
  '학년',
  '반',
  '번호',
  '성명',
  '시험명',
  '국어(선택)',
  '국어(등급)',
  '국어(표준점수)',
  '국어(백분위)',
  '수학(선택)',
  '수학(등급)',
  '수학(표준점수)',
  '수학(백분위)',
  '영어(등급)',
  '한국사(등급)',
  '탐구1(선택)',
  '탐구1(등급)',
  '탐구1(표준점수)',
  '탐구1(백분위)',
  '탐구2(선택)',
  '탐구2(등급)',
  '탐구2(표준점수)',
  '탐구2(백분위)',
  '제2외국어(과목)',
  '제2외국어(등급)'
]

// 구글 시트 '2027모의결과' 표준 44개 컬럼(A~AR) 1행/2행 복합 헤더 표준
export const KCUE_MOCK_44_HEADERS_ROW1 = [
  '월', '계열번호', '학년', '반', '번호', '이름',
  '국어', '', '', '', '', '', '',
  '수학', '', '', '', '', '', '',
  '영어', '', '', '',
  '탐구영역',
  '선택1', '', '', '', '',
  '선택2', '', '', '', '',
  '한국사', '', '', '',
  '제2외국어', '', '', '', ''
]

export const KCUE_MOCK_44_HEADERS_ROW2 = [
  '', '', '', '', '', '',
  '국어선택', '공통원점수', '선택원점수', '원점수총점', '표준점수', '백분위', '등급',
  '수학선택', '공통원점수', '선택원점수', '원점수총점', '표준점수', '백분위', '등급',
  '원점수', '표준점수', '백분위', '등급',
  '',
  '과목명', '원점수', '표준점수', '백분위', '등급',
  '과목명', '원점수', '표준점수', '백분위', '등급',
  '원점수', '표준점수', '백분위', '등급',
  '과목명', '원점수', '표준점수', '백분위', '등급'
]

// 하위 호환성을 위한 별칭
export const KCUE_MOCK_54_HEADERS_ROW1 = KCUE_MOCK_44_HEADERS_ROW1
export const KCUE_MOCK_54_HEADERS_ROW2 = KCUE_MOCK_44_HEADERS_ROW2


/**
 * PDF 본문 텍스트 레이어로부터 학년, 반, 응시 월(시험명), 학교명, 실시일 정밀 추출
 * - 교육청 전국연합학력평가 표준 성적일람표 양식 (상단 학년/반/학교명 테이블)
 * - 평가원 모의평가 양식 (제목 및 학생 9자리 수험번호 체계)
 * - 일반 텍스트 라인 (학년/반 표기)
 * @param {Array} allRowCells Y좌표별 클러스터링된 행 셀 목록
 * @param {Array} allTextItems 원시 PDF 텍스트 아이템 배열
 * @returns {Object} { grade, classNum, schoolName, examName, year, examDate }
 */
export function extractMetaFromPdfContent(allRowCells = [], allTextItems = []) {
  const meta = {
    grade: null,
    classNum: null,
    schoolName: '',
    examName: '',
    year: '',
    examDate: ''
  }

  // 1. 공백 제거 전체 텍스트에서 시험명 및 학년도 정규식 추출
  const fullTextClean = allTextItems.map(it => it.str || '').join('').replace(/\s+/g, '')

  // 1-1. 표준 시험명 매칭 (예: '2026학년도 10월 전국연합학력평가', '2027학년도 대학수학능력시험 6월 모의평가')
  const mExam = fullTextClean.match(/(\d{4})학년도.*?(\d{1,2})월.*?(전국연합학력평가|모의평가|학력평가|대학수학능력시험)/)
  if (mExam) {
    meta.year = mExam[1]
    const month = mExam[2]
    const type = mExam[3].includes('모의평가') ? '모평' : '학평'
    meta.examName = `${month}월 ${type}`
  } else {
    // 3월, 4월, 6월, 7월, 9월, 10월, 11월 단순 탐색
    const mSimple = fullTextClean.match(/(\d{1,2})월(전국연합학력평가|모의평가|학평|모평)/)
    if (mSimple) {
      meta.examName = `${mSimple[1]}월 ${mSimple[2].includes('모평') || mSimple[2].includes('모의평가') ? '모평' : '학평'}`
    }
  }

  // 2. 교육청 학평 표준 헤더 테이블 탐색: [학년, 반, 학교명, 학급인원, 실시일]
  // Y좌표 내림차순(상단 -> 하단) 정렬된 allRowCells를 순회
  for (let idx = 0; idx < allRowCells.length; idx++) {
    const row = allRowCells[idx]
    const cleanLine = (row.lineStr || '').replace(/\s+/g, '')

    if (cleanLine.includes('학년') && cleanLine.includes('반') && cleanLine.includes('학교명')) {
      // 헤더 행 발견 -> 바로 아래 1~4개 행 내에서 [학년, 반, 학교명] 데이터 행 탐색
      for (let offset = 1; offset <= 4 && (idx + offset) < allRowCells.length; offset++) {
        const nextRow = allRowCells[idx + offset]
        const c = nextRow.cells || []

        // c: ["3", "1", "포곡고등학교", "11", "11/255902", ..., "2026.10.20."]
        if (c.length >= 3 && /^[1-3]$/.test(c[0]) && /^\d{1,2}$/.test(c[1])) {
          meta.grade = Number(c[0])
          meta.classNum = String(parseInt(c[1], 10))
          meta.schoolName = c[2]

          const dateCell = c.find(val => /\d{4}\.\s*\d{1,2}\.\s*\d{1,2}/.test(val))
          if (dateCell) meta.examDate = dateCell
          break
        }
      }
      if (meta.classNum) break
    }
  }

  // 3. 평가원 모의평가(6모/9모) 양식 감지 및 학교명·반 추출
  // 예: '학교명(학원명):경기포곡고등학교1반'
  for (const row of allRowCells) {
    const clean = (row.lineStr || '').replace(/\s+/g, '')
    const mKice = clean.match(/학교명.*?[:：]([가-힣\s]+?)(\d{1,2})반/)
    if (mKice) {
      meta.schoolName = mKice[1].trim()
      meta.classNum = String(parseInt(mKice[2], 10))
      meta.grade = 3
      break
    }
  }

  // 만약 헤더에서 반을 못 찾았을 경우: 평가원 9자리 수험번호(예: 178350103) 분석
  if (!meta.classNum) {
    for (const row of allRowCells) {
      const examineeCell = row.cells.find(c => /^\d{9}$/.test(c))
      if (examineeCell) {
        // 수험번호 6~7번째 자리가 반
        meta.classNum = String(parseInt(examineeCell.slice(5, 7), 10))
        meta.grade = 3 // 평가원 모평은 고3
        break
      }
    }
  }

  // 4. 일반 텍스트 내에서 "3학년 1반" 또는 "제 1 반" 형태 감지
  if (!meta.classNum) {
    for (const row of allRowCells) {
      const clean = row.lineStr.replace(/\s+/g, '')
      const m = clean.match(/([1-3])학년\s*(\d{1,2})반/)
      if (m) {
        meta.grade = Number(m[1])
        meta.classNum = String(parseInt(m[2], 10))
        break
      }
    }
  }

  return meta
}

/**
 * 파일명에서 학년, 반, 응시 월, 시험명 보조 추출 (최후의 비상용 Fallback)
 */
export function parseMetaFromFileName(fileName = '') {
  const meta = { grade: null, classNum: null, month: null, examName: null }
  if (!fileName) return meta

  // 반 탐색: '1반', '_1반', '10반' 등
  const classMatch = fileName.match(/(?:^|[^\d])(\d{1,2})\s*반/)
  if (classMatch) {
    meta.classNum = String(parseInt(classMatch[1], 10))
  }

  // 월 탐색: '3월', '6월', '9월', '10월', '11월'
  const monthMatch = fileName.match(/(?:^|[^\d])(\d{1,2})\s*월/)
  if (monthMatch) {
    meta.month = Number(monthMatch[1])
    const isMopyeong = fileName.includes('모평') || fileName.includes('모의평가')
    meta.examName = `${meta.month}월 ${isMopyeong ? '모평' : '학평'}`
  }

  // 학년 탐색: '1학년', '2학년', '3학년' 또는 '고1', '고2', '고3'
  const gradeMatch = fileName.match(/([1-3])\s*학년|고\s*([1-3])/i)
  if (gradeMatch) {
    meta.grade = Number(gradeMatch[1] || gradeMatch[2])
  }

  return meta
}

/**
 * 업로드 날짜 기준 대입 학년도 계산
 * - 3월 1일 ~ 12월 31일: 당해 연도 + 1 (예: 2026년 11월 -> 2027 대입)
 * - 1월 1일 ~ 2월 28/29일: 당해 연도 (예: 2027년 1월 -> 2027 대입)
 */
export function getTargetCollegeAdmissionYear(uploadDate = new Date()) {
  const d = new Date(uploadDate)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  return month >= 3 ? String(year + 1) : String(year)
}

/**
 * 업로드 날짜 기준 일반 학사 학년도 계산 (고1, 2용)
 * - 3월 1일 ~ 12월 31일: 당해 연도 (예: 2026년 11월 -> 2026 학사년도)
 * - 1월 1일 ~ 2월 28/29일: 당해 연도 - 1 (예: 2027년 1월 -> 2026 학사년도)
 */
export function getAcademicSchoolYear(uploadDate = new Date()) {
  const d = new Date(uploadDate)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  return month >= 3 ? String(year) : String(year - 1)
}

/**
 * 대상 구글 시트 탭 명칭 자동 산출 (항상 대입 학년도 기준)
 * 예: 2026년 11월 업로드 시 '2027모의결과'
 */
export function getTargetMockResultSheetName(uploadDate = new Date()) {
  const admissionYear = getTargetCollegeAdmissionYear(uploadDate)
  return `${admissionYear}모의결과`
}

/**
 * 성적일람표 파일(PDF 또는 엑셀) 파싱 메인 진입점
 * @param {File|Blob} file 
 * @param {Object} options { defaultGrade: 1|2|3, uploadDate: Date }
 * @returns {Promise<{ success: boolean, formatType: string, meta: Object, students: Array, error?: string }>}
 */
export async function parseMockExamReportFile(file, options = {}) {
  const fileName = file.name || '성적일람표'
  const isPdf = fileName.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'
  const isExcel = fileName.toLowerCase().endsWith('.xlsx') || 
                  fileName.toLowerCase().endsWith('.xls') || 
                  fileName.toLowerCase().endsWith('.csv')

  let arrayBuffer
  if (typeof file.arrayBuffer === 'function') {
    arrayBuffer = await file.arrayBuffer()
  } else {
    arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }
  const defaultGrade = Number(options.defaultGrade) || 3
  const examName = options.examName || ''
  const uploadDate = options.uploadDate || new Date()
  const targetAdmissionYear = getTargetCollegeAdmissionYear(uploadDate)
  const targetAcademicYear = getAcademicSchoolYear(uploadDate)
  const targetSheetName = getTargetMockResultSheetName(uploadDate)

  if (isPdf) {
    return await parseMockExamPdf(arrayBuffer, {
      fileName,
      defaultGrade,
      examName,
      targetAdmissionYear,
      targetAcademicYear,
      targetSheetName
    })
  } else if (isExcel) {
    return await parseMockExamExcel(arrayBuffer, {
      fileName,
      defaultGrade,
      examName,
      targetAdmissionYear,
      targetAcademicYear,
      targetSheetName
    })
  } else {
    throw new Error('지원되지 않는 파일 형식입니다. PDF 또는 엑셀(.xlsx, .xls, .csv) 파일을 업로드해 주세요.')
  }
}

/**
 * PDF 성적일람표 파싱
 */
async function parseMockExamPdf(arrayBuffer, options) {
  let doc
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      stopAtErrors: false
    })
    // 4초 타임아웃 레이스로 워커 먹통/Hang 완벽 차단
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PDF 로드 시간 초과 (4초)')), 4000)
    )
    doc = await Promise.race([loadingTask.promise, timeoutPromise])
  } catch (err) {
    console.warn('[mockExamReportParser] PDF 로드 1차 실패, fallback 재시도:', err)
    try {
      const fallbackTask = pdfjsLib.getDocument({ 
        data: new Uint8Array(arrayBuffer),
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        disableFontFace: true,
        stopAtErrors: false
      })
      const timeoutPromise2 = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF 로드 최종 시간 초과 (3초)')), 3000)
      )
      doc = await Promise.race([fallbackTask.promise, timeoutPromise2])
    } catch (err2) {
      console.error('[mockExamReportParser] PDF 로드 최종 실패:', err2)
      return {
        success: false,
        formatType: 'PDF_LOAD_FAILED',
        error: 'PDF 파일을 열 수 없습니다: ' + (err2.message || '파일 손상 또는 미지원 형식'),
        students: []
      }
    }
  }

  const allRowCells = []
  const allRawTextItems = []
  const pageItemsList = []
  let totalTextItems = 0

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    let content = null
    try {
      const page = await doc.getPage(pageNum)
      const pageTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`PDF ${pageNum}페이지 텍스트 추출 시간 초과 (5초)`)), 5000)
      )
      content = await Promise.race([page.getTextContent(), pageTimeout])
    } catch (pageErr) {
      console.warn(`[mockExamReportParser] ${pageNum}페이지 텍스트 추출 건너뜀:`, pageErr)
      continue
    }

    if (!content || !content.items) continue

    totalTextItems += content.items.length
    allRawTextItems.push(...content.items)
    pageItemsList.push(content.items)

    // Y 좌표별로 항목 수집
    const rows = {}
    for (const item of content.items) {
      if (!item.str) continue
      const y = Math.round(item.transform[5])
      if (!rows[y]) rows[y] = []
      rows[y].push({ x: Math.round(item.transform[4]), str: item.str.trim() })
    }

    const sortedY = Object.keys(rows).map(Number).sort((a, b) => b - a)

    for (const y of sortedY) {
      const rawItems = rows[y].filter(it => it.str !== '').sort((a, b) => a.x - b.x)
      if (rawItems.length === 0) continue

      // X 간격 클러스터링: gap <= 8 이면 동일 셀 글자 병합
      const cells = []
      let curCell = rawItems[0].str
      let lastX = rawItems[0].x

      for (let i = 1; i < rawItems.length; i++) {
        const item = rawItems[i]
        const gap = item.x - lastX
        if (gap <= 8) {
          curCell += item.str
        } else {
          cells.push(curCell)
          curCell = item.str
        }
        lastX = item.x
      }
      cells.push(curCell)

      const lineStr = cells.join(' ')
      allRowCells.push({ page: pageNum, y, cells, lineStr })
    }
  }

  // 1. 텍스트 레이어가 비어있는 경우 (인쇄용 Print to PDF 등 곡선 그래픽 PDF 감지)
  if (totalTextItems === 0) {
    return {
      success: false,
      formatType: 'IMAGE_OR_OUTLINE_PDF',
      error: 'PDF에 텍스트 데이터가 없습니다. (인쇄 메뉴의 Microsoft Print to PDF로 출력되어 글자가 선/곡선 그래픽으로 변환됨) 엑셀(.xlsx) 파일이나 뷰어 자체 [저장] PDF를 업로드해 주세요.',
      students: []
    }
  }

  // 2. ★ 핵심: 파일명이 아닌 PDF 본문 텍스트에서 학년, 반, 응시 월(시험명), 학교명 우선 추출!
  const pdfMeta = extractMetaFromPdfContent(allRowCells, allRawTextItems)
  const fileMeta = parseMetaFromFileName(options.fileName) // 최후의 보루 fallback

  const effectiveGrade = pdfMeta.grade || fileMeta.grade || options.defaultGrade || 3
  const effectiveClass = pdfMeta.classNum || fileMeta.classNum || '1'
  const effectiveExamName = pdfMeta.examName || fileMeta.examName || '전국연합 학평'
  const effectiveSchool = pdfMeta.schoolName || ''

  // 3. 양식 자동 분류 (공백 제거 텍스트 기준 판별)
  const fullTextClean = allRawTextItems.map(it => it.str || '').join('').replace(/\s+/g, '')
  const isExplicitMoe = fullTextClean.includes('전국연합학력평가') || fullTextClean.includes('성적일람표1(학급별)')
  const isExplicitKice = fullTextClean.includes('대학수학능력시험') || fullTextClean.includes('모의평가성적일람표')

  const isKiceReport = !isExplicitMoe && (isExplicitKice || allRawTextItems.some(it => /^\d{9}$/.test(it.str?.trim())))
  const isMoeReport = isExplicitMoe || (!isKiceReport && allRowCells.some(r => r.cells.length >= 10 && /^\d{1,2}$/.test(r.cells[0]) && /^[가-힣]{2,4}$/.test(r.cells[1])))

  let students = []
  let formatType = 'UNKNOWN'

  if (isKiceReport) {
    formatType = 'KICE_MOCK_EVALUATION' // 평가원 모평 (6모·9모: 수험번호 9자리 + 4행 블록 구조)
    students = parseKicePages(pageItemsList, {
      grade: effectiveGrade,
      classNum: effectiveClass,
      examName: effectiveExamName
    })
  } else if (isMoeReport) {
    formatType = 'MOE_ACADEMIC_EVALUATION' // 교육청 학평 (3모·4모·7모·10모: 가로 1행 구조)
    students = parseMoeClusteredRows(allRowCells, {
      grade: effectiveGrade,
      classNum: effectiveClass,
      examName: effectiveExamName
    })
  } else {
    // 범용
    formatType = 'GENERAL_REPORT'
    students = parseMoeClusteredRows(allRowCells, {
      grade: effectiveGrade,
      classNum: effectiveClass,
      examName: effectiveExamName
    })
  }

  // Promise인 경우 안전하게 await
  if (students instanceof Promise) {
    students = await students
  }

  return {
    success: students.length > 0,
    formatType,
    error: students.length === 0 ? '성적 데이터(학생 행)를 추출하지 못했습니다. 파일 양식을 확인해 주세요.' : undefined,
    meta: {
      fileName: options.fileName,
      totalTextItems,
      detectedTitle: effectiveExamName,
      examName: effectiveExamName,
      grade: effectiveGrade,
      classNum: effectiveClass,
      schoolName: effectiveSchool,
      examDate: pdfMeta.examDate,
      studentCount: students.length,
      targetAdmissionYear: options.targetAdmissionYear,
      targetAcademicYear: options.targetAcademicYear,
      targetSheetName: options.targetSheetName
    },
    students
  }
}

/**
 * 교육청 전국연합학력평가 클러스터링 셀 파싱 (1행 = 1학생)
 * - 1학년 양식: 국/수 선택과목 없음(공통), 영어, 한국사, 사회, 과학 (20개 컬럼, 직탐·제2외국어 없음)
 * - 2학년 양식: 국/수 선택과목 없음(공통), 영어, 한국사, 사탐, 과탐, 직탐, 제2외국어 (26개 컬럼)
 * - 3학년 양식: 국어(선택), 수학(선택), 영어, 한국사, 제1선택, 제2선택, 제2외국어 (26개 컬럼)
 */
function parseMoeClusteredRows(allRowCells, defaultMeta) {
  const students = []
  const targetGrade = Number(defaultMeta.grade) || 3

  for (const rowObj of allRowCells) {
    const rawC = rowObj.cells
    if (!rawC || rawC.length < 10) continue

    // 번호와 성명 시작 인덱스(offset) 탐색: 통상 c[0]=번호, c[1]=성명
    let startIdx = -1
    for (let k = 0; k <= Math.min(3, rawC.length - 2); k++) {
      if (/^\d{1,2}$/.test(rawC[k]) && /^[가-힣]{2,4}$/.test(rawC[k + 1])) {
        startIdx = k
        break
      }
    }
    if (startIdx === -1) continue

    const c = rawC.slice(startIdx)
    const studentNum = Number(c[0])
    const name = c[1]

    const parseNum = (v) => {
      if (v === undefined || v === null || v === '-' || v === '') return null
      const clean = String(v).replace(/[^0-9.]/g, '')
      const n = Number(clean)
      return isNaN(n) ? null : n
    }

    // 학년별 양식 판별:
    // 1) targetGrade가 지정되어 있으면 해당 학년 표준 양식을 최우선 적용 (결시 과목이 있어도 양식 왜곡 방지)
    // 2) 미지정 시 행별 셀 구조(국어 선택과목명 존재 여부, 컬럼 수)로 자동 판별
    const isGrade3Format = targetGrade === 3 || (c[2] && /[가-힣]/.test(c[2]))
    const isGrade1Format = !isGrade3Format && (targetGrade === 1 || c.length <= 22)

    let studentData = null

    if (isGrade3Format) {
      // ─────────────────────────────────────────────────────────────
      // [3학년 양식] (26개 컬럼 규격)
      // c[0]: 번호, c[1]: 성명
      // c[2~6]: 국어 선택과목, 표점, 석차, 백분위, 등급
      // c[7~11]: 수학 선택과목, 표점, 석차, 백분위, 등급
      // c[12]: 영어등급, c[13]: 한국사등급
      // c[14~18]: 탐구1 과목명, 표점, 석차, 백분위, 등급
      // c[19~23]: 탐구2 과목명, 표점, 석차, 백분위, 등급
      // c[24~25]: 제2외국어 과목명, 등급
      // ─────────────────────────────────────────────────────────────
      studentData = {
        grade: defaultMeta.grade || 3,
        classNum: defaultMeta.classNum,
        studentNum,
        name,
        studentKey: `${defaultMeta.grade || 3}-${defaultMeta.classNum}-${studentNum}_${name}`,
        legacyStudentKey: `${defaultMeta.classNum}-${studentNum}_${name}`,
        examName: defaultMeta.examName,
        korSubject: c[2] || '',
        korStandardScore: parseNum(c[3]),
        korSchoolRank: parseNum(c[4]),
        korPercentile: parseNum(c[5]),
        korGrade: parseNum(c[6]),
        mathSubject: c[7] || '',
        mathStandardScore: parseNum(c[8]),
        mathSchoolRank: parseNum(c[9]),
        mathPercentile: parseNum(c[10]),
        mathGrade: parseNum(c[11]),
        engGrade: parseNum(c[12]),
        histGrade: parseNum(c[13]),
        inquiry1: c[14] || '',
        inq1StandardScore: parseNum(c[15]),
        inq1SchoolRank: parseNum(c[16]),
        inq1Percentile: parseNum(c[17]),
        inq1Grade: parseNum(c[18]),
        inquiry2: c[19] || '',
        inq2StandardScore: parseNum(c[20]),
        inq2SchoolRank: parseNum(c[21]),
        inq2Percentile: parseNum(c[22]),
        inq2Grade: parseNum(c[23]),
        secondLangSubject: (c[24] && c[24] !== '-') ? c[24] : '',
        secondLangGrade: parseNum(c[25])
      }
    } else if (isGrade1Format) {
      // ─────────────────────────────────────────────────────────────
      // [1학년 양식] (20개 컬럼 규격)
      // c[0]: 번호, c[1]: 성명
      // c[2~5]: 국어 표점, 석차, 백분위, 등급 (선택과목 없음 -> 빈칸)
      // c[6~9]: 수학 표점, 석차, 백분위, 등급 (선택과목 없음 -> 빈칸)
      // c[10]: 영어등급, c[11]: 한국사등급
      // c[12~15]: 사회 표점, 석차, 백분위, 등급 (제1선택 -> '통합사회')
      // c[16~19]: 과학 표점, 석차, 백분위, 등급 (제2선택 -> '통합과학')
      // (직탐 없음, 제2외국어 없음)
      // ─────────────────────────────────────────────────────────────
      studentData = {
        grade: defaultMeta.grade || 1,
        classNum: defaultMeta.classNum,
        studentNum,
        name,
        studentKey: `${defaultMeta.grade || 1}-${defaultMeta.classNum}-${studentNum}_${name}`,
        legacyStudentKey: `${defaultMeta.classNum}-${studentNum}_${name}`,
        examName: defaultMeta.examName,
        korSubject: '', // 국어 선택과목 빈칸
        korStandardScore: parseNum(c[2]),
        korSchoolRank: parseNum(c[3]),
        korPercentile: parseNum(c[4]),
        korGrade: parseNum(c[5]),
        mathSubject: '', // 수학 선택과목 빈칸
        mathStandardScore: parseNum(c[6]),
        mathSchoolRank: parseNum(c[7]),
        mathPercentile: parseNum(c[8]),
        mathGrade: parseNum(c[9]),
        engGrade: parseNum(c[10]),
        histGrade: parseNum(c[11]),
        inquiry1: '통합사회', // 제1선택: 사회 성적
        inq1StandardScore: parseNum(c[12]),
        inq1SchoolRank: parseNum(c[13]),
        inq1Percentile: parseNum(c[14]),
        inq1Grade: parseNum(c[15]),
        inquiry2: '통합과학', // 제2선택: 과학 성적
        inq2StandardScore: parseNum(c[16]),
        inq2SchoolRank: parseNum(c[17]),
        inq2Percentile: parseNum(c[18]),
        inq2Grade: parseNum(c[19]),
        secondLangSubject: '',
        secondLangGrade: null
      }
    } else {
      // ─────────────────────────────────────────────────────────────
      // [2학년 양식] (26개 컬럼 규격)
      // c[0]: 번호, c[1]: 성명
      // c[2~5]: 국어 표점, 석차, 백분위, 등급 (선택과목 없음 -> 빈칸)
      // c[6~9]: 수학 표점, 석차, 백분위, 등급 (선택과목 없음 -> 빈칸)
      // c[10]: 영어등급, c[11]: 한국사등급
      // c[12~15]: 사회탐구 표점, 석차, 백분위, 등급 (제1선택 -> '사회탐구')
      // c[16~19]: 과학탐구 표점, 석차, 백분위, 등급 (제2선택 -> '과학탐구')
      // c[20~23]: 직업탐구 표점, 석차, 백분위, 등급
      // c[24~25]: 제2외국어/한문 선택과목, 등급
      // ─────────────────────────────────────────────────────────────
      studentData = {
        grade: defaultMeta.grade || 2,
        classNum: defaultMeta.classNum,
        studentNum,
        name,
        studentKey: `${defaultMeta.grade || 2}-${defaultMeta.classNum}-${studentNum}_${name}`,
        legacyStudentKey: `${defaultMeta.classNum}-${studentNum}_${name}`,
        examName: defaultMeta.examName,
        korSubject: '', // 국어 선택과목 빈칸
        korStandardScore: parseNum(c[2]),
        korSchoolRank: parseNum(c[3]),
        korPercentile: parseNum(c[4]),
        korGrade: parseNum(c[5]),
        mathSubject: '', // 수학 선택과목 빈칸
        mathStandardScore: parseNum(c[6]),
        mathSchoolRank: parseNum(c[7]),
        mathPercentile: parseNum(c[8]),
        mathGrade: parseNum(c[9]),
        engGrade: parseNum(c[10]),
        histGrade: parseNum(c[11]),
        inquiry1: '사회탐구', // 제1선택: 사회 성적
        inq1StandardScore: parseNum(c[12]),
        inq1SchoolRank: parseNum(c[13]),
        inq1Percentile: parseNum(c[14]),
        inq1Grade: parseNum(c[15]),
        inquiry2: '과학탐구', // 제2선택: 과학 성적
        inq2StandardScore: parseNum(c[16]),
        inq2SchoolRank: parseNum(c[17]),
        inq2Percentile: parseNum(c[18]),
        inq2Grade: parseNum(c[19]),
        secondLangSubject: (c[24] && c[24] !== '-') ? c[24] : '',
        secondLangGrade: parseNum(c[25])
      }
    }

    if (studentData) {
      students.push(studentData)
    }
  }

  return students
}

/**
 * 평가원 모의평가(6월·9월 모의평가) 전용 4행 블록 파서
 * - 1페이지당 약 10명의 학생이 4개 행(선택과목 / 표준점수 / 백분위 / 등급) 블록으로 배치됨
 * - 9자리 수험번호(시도학교+반2자리+번호2자리) 및 성명, 7개 영역 정밀 추출
 */
function parseKicePages(pageItemsList = [], defaultMeta = {}) {
  const students = []
  const parseNum = (v) => {
    if (!v || v === '-') return null
    const n = Number(String(v).replace(/[^0-9.]/g, ''))
    return isNaN(n) ? null : n
  }

  const isLabel = (w) => ['선','택','과','목','선택과목','표','준','점','수','표준점수','백','분','위','백분위','등','급','등급'].includes(w)

  for (let pageIdx = 0; pageIdx < pageItemsList.length; pageIdx++) {
    const rawItems = pageItemsList[pageIdx] || []
    const items = rawItems.filter(it => it.str && it.str.trim() !== '')

    // Y좌표 그룹핑 (tolerance 4pt)
    const rows = []
    for (const it of items) {
      const y = it.transform[5]
      const x = it.transform[4]
      let row = rows.find(r => Math.abs(r.y - y) <= 4)
      if (!row) {
        row = { y, items: [] }
        rows.push(row)
      }
      row.items.push({ x, str: it.str.trim() })
    }
    rows.sort((a, b) => b.y - a.y)

    // 행별 단어 병합 (X gap <= 10pt)
    const rowWords = rows.map(r => {
      r.items.sort((a, b) => a.x - b.x)
      const words = []
      let cur = r.items[0].str
      let lastX = r.items[0].x
      for (let i = 1; i < r.items.length; i++) {
        const it = r.items[i]
        if (it.x - lastX <= 10) {
          cur += it.str
        } else {
          words.push(cur)
          cur = it.str
        }
        lastX = it.x
      }
      words.push(cur)
      return { y: r.y, words }
    })

    // 4행 블록 탐색
    for (let i = 0; i < rowWords.length; i++) {
      const rw = rowWords[i]
      // 9자리 수험번호가 있는 행 탐색 (표준점수 행에 위치)
      const exNum = rw.words.find(w => /^\d{9}$/.test(w))
      if (exNum) {
        const subjRow = i > 0 ? rowWords[i - 1] : null
        const scoreRow = rw
        const pctRow = (i + 1 < rowWords.length) ? rowWords[i + 1] : null
        const gradeRow = (i + 2 < rowWords.length) ? rowWords[i + 2] : null

        // 성명 추출: pctRow에서 성명 후보 탐색
        let name = ''
        if (pctRow) {
          const candidate = pctRow.words.find(w => /^[가-힣]{2,4}$/.test(w) && !isLabel(w))
          if (candidate) name = candidate
        }

        const classNum = String(parseInt(exNum.slice(5, 7), 10))
        const studentNum = parseInt(exNum.slice(7, 9), 10)

        const subjs = subjRow ? subjRow.words.filter(w => !isLabel(w)) : []
        const scores = scoreRow.words.filter(w => w !== exNum && !isLabel(w))
        const pcts = pctRow ? pctRow.words.filter(w => w !== name && !isLabel(w)) : []
        const grades = gradeRow ? gradeRow.words.filter(w => !isLabel(w)) : []

        // 7개 과목 슬롯: [0]=한국사, [1]=국어, [2]=수학, [3]=영어, [4]=탐구1, [5]=탐구2, [6]=제2외국어
        students.push({
          grade: defaultMeta.grade || 3,
          classNum: classNum || defaultMeta.classNum || '1',
          studentNum,
          name,
          studentKey: `${defaultMeta.grade || 3}-${classNum}-${studentNum}_${name}`,
          legacyStudentKey: `${classNum}-${studentNum}_${name}`,
          examName: defaultMeta.examName || '6월 모평',
          korSubject: subjs[1] || '화법과작문',
          korStandardScore: parseNum(scores[1]),
          korPercentile: parseNum(pcts[1]),
          korGrade: parseNum(grades[1]),
          mathSubject: subjs[2] || '확률과통계',
          mathStandardScore: parseNum(scores[2]),
          mathPercentile: parseNum(pcts[2]),
          mathGrade: parseNum(grades[2]),
          engGrade: parseNum(grades[3]),
          histGrade: parseNum(grades[0]),
          inquiry1: subjs[4] || '',
          inq1StandardScore: parseNum(scores[4]),
          inq1Percentile: parseNum(pcts[4]),
          inq1Grade: parseNum(grades[4]),
          inquiry2: subjs[5] || '',
          inq2StandardScore: parseNum(scores[5]),
          inq2Percentile: parseNum(pcts[5]),
          inq2Grade: parseNum(grades[5]),
          secondLangSubject: subjs[6] || '-',
          secondLangGrade: parseNum(grades[6])
        })
      }
    }
  }

  return students
}

/**
 * 엑셀 성적일람표 파싱
 */
async function parseMockExamExcel(arrayBuffer, options = {}) {
  try {
    const data = new Uint8Array(arrayBuffer)
    const wb = XLSX.read(data, { type: 'array' })
    
    // 1. 학교 모의고사 표준 '점수입력' 시트 또는 첫 번째 시트 탐색
    const sheetName = wb.SheetNames.includes('점수입력') 
      ? '점수입력' 
      : wb.SheetNames[0]
    const ws = wb.Sheets[sheetName]
    const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 })

    if (!rawRows || rawRows.length < 2) {
      return {
        success: false,
        formatType: 'EMPTY_EXCEL',
        error: '엑셀 파일에 데이터가 존재하지 않습니다.',
        students: []
      }
    }

    // 파일명 및 옵션에서 시험명과 학년 감지 (사용자가 드롭다운에서 선택한 options.examName이 최우선 1순위!)
    const fileMeta = parseMetaFromFileName(options.fileName)
    let defaultExamName = options.examName || fileMeta.examName
    if (!defaultExamName) {
      const fn = options.fileName || ''
      if (fn.includes('03월') || fn.includes('3월')) defaultExamName = '3월 학평'
      else if (fn.includes('05월') || fn.includes('5월')) defaultExamName = '5월 학평'
      else if (fn.includes('04월') || fn.includes('4월')) defaultExamName = '4월 학평'
      else if (fn.includes('06월') || fn.includes('6월')) defaultExamName = '6월 모평'
      else if (fn.includes('07월') || fn.includes('7월')) defaultExamName = '7월 학평'
      else if (fn.includes('08월') || fn.includes('8월')) defaultExamName = '8월 모평'
      else if (fn.includes('09월') || fn.includes('9월')) defaultExamName = '9월 모평'
      else if (fn.includes('10월') || fn.includes('10월')) defaultExamName = '10월 학평'
      else if (fn.includes('11월') || fn.includes('11월')) defaultExamName = '11월 수능'
      else defaultExamName = '3월 학평'
    }

    const parseNum = (v) => {
    if (v === undefined || v === null || v === '' || v === '-') return null
    const n = Number(String(v).replace(/[^0-9.]/g, ''))
    return isNaN(n) ? null : n
  }

  // A. [최우선 1순위] 대교협 상담프로그램 '선택회차 입력내용 엑셀다운' 2행 복합 헤더 양식 감지
  // 1행: 학년도, 학년, 반, 번호, 이름, 한국사, 국어, 수학, 영어, 탐구영역1, 탐구영역2, 제2외국어
  // 2행: 원점수, 등급, 선택, 표준점수, 백분위, 등급 ...
  const r0Str = (rawRows[0] || []).join(' ')
  const r1Str = (rawRows[1] || []).join(' ')

  const isKcueMockExcel = (r0Str.includes('학년도') || r0Str.includes('한국사') || r0Str.includes('탐구영역1')) &&
                          (r1Str.includes('표준점수') || r1Str.includes('원점수') || r1Str.includes('백분위') || r1Str.includes('선택'))

  if (isKcueMockExcel) {
    // Forward-fill 알고리즘으로 1행 영역명과 2행 세부항목명을 결합하여 정확한 컬럼 맵 생성
    let currentArea = ''
    const colMap = {}
    const maxCols = Math.max(rawRows[0]?.length || 0, rawRows[1]?.length || 0)
    for (let c = 0; c < maxCols; c++) {
      const top = String(rawRows[0]?.[c] || '').trim()
      if (top) currentArea = top
      const sub = String(rawRows[1]?.[c] || '').trim()
      const full = (sub ? `${currentArea}_${sub}` : currentArea).replace(/\s+/g, '')
      colMap[full] = c
    }

    const getVal = (row, ...keys) => {
      for (const k of keys) {
        const cleanK = k.replace(/\s+/g, '')
        const idx = colMap[cleanK]
        if (idx !== undefined && row[idx] !== undefined && row[idx] !== null && String(row[idx]).trim() !== '') {
          return String(row[idx]).trim()
        }
      }
      return ''
    }

    const students = []
    for (let r = 2; r < rawRows.length; r++) {
      const row = rawRows[r]
      if (!row || row.length === 0) continue
      const name = getVal(row, '이름', '성명', '학생명')
      if (!name) continue

      const grade = Number(getVal(row, '학년')) || fileMeta.grade || options.defaultGrade || 3
      const classNum = String(getVal(row, '반') || '1')
      const studentNum = Number(getVal(row, '번호')) || (r - 1)

      students.push({
        grade,
        classNum,
        studentNum,
        name,
        studentKey: `${grade}-${classNum}-${studentNum}_${name}`,
        legacyStudentKey: `${classNum}-${studentNum}_${name}`,
        examName: defaultExamName,
        korSubject: getVal(row, '국어_선택') || '화법과 작문',
        korRawScore: parseNum(getVal(row, '국어_원점수')),
        korStandardScore: parseNum(getVal(row, '국어_표준점수')),
        korPercentile: parseNum(getVal(row, '국어_백분위')),
        korGrade: parseNum(getVal(row, '국어_등급')),
        mathSubject: getVal(row, '수학_선택') || '확률과 통계',
        mathRawScore: parseNum(getVal(row, '수학_원점수')),
        mathStandardScore: parseNum(getVal(row, '수학_표준점수')),
        mathPercentile: parseNum(getVal(row, '수학_백분위')),
        mathGrade: parseNum(getVal(row, '수학_등급')),
        engRawScore: parseNum(getVal(row, '영어_원점수')),
        engGrade: parseNum(getVal(row, '영어_등급')),
        histRawScore: parseNum(getVal(row, '한국사_원점수')),
        histGrade: parseNum(getVal(row, '한국사_등급')),
        inquiry1: getVal(row, '탐구영역1_선택', '탐구1_선택') || '',
        inq1RawScore: parseNum(getVal(row, '탐구영역1_원점수', '탐구1_원점수')),
        inq1StandardScore: parseNum(getVal(row, '탐구영역1_표준점수', '탐구1_표준점수')),
        inq1Percentile: parseNum(getVal(row, '탐구영역1_백분위', '탐구1_백분위')),
        inq1Grade: parseNum(getVal(row, '탐구영역1_등급', '탐구1_등급')),
        inquiry2: getVal(row, '탐구영역2_선택', '탐구2_선택') || '',
        inq2RawScore: parseNum(getVal(row, '탐구영역2_원점수', '탐구2_원점수')),
        inq2StandardScore: parseNum(getVal(row, '탐구영역2_표준점수', '탐구2_표준점수')),
        inq2Percentile: parseNum(getVal(row, '탐구영역2_백분위', '탐구2_백분위')),
        inq2Grade: parseNum(getVal(row, '탐구영역2_등급', '탐구2_등급')),
        secondLangSubject: getVal(row, '제2외국어_과목명', '제2외국어_선택') || '',
        secondLangRawScore: parseNum(getVal(row, '제2외국어_원점수')),
        secondLangGrade: parseNum(getVal(row, '제2외국어_등급'))
      })
    }

    if (students.length > 0) {
      return {
        success: true,
        formatType: 'KCUE_MOCK_EXCEL',
        meta: {
          fileName: options.fileName,
          examName: defaultExamName,
          grade: students[0]?.grade || options.defaultGrade,
          studentCount: students.length,
          targetAdmissionYear: options.targetAdmissionYear,
          targetAcademicYear: options.targetAcademicYear,
          targetSheetName: options.targetSheetName
        },
        students
      }
    }
  }

  // B. 일반 1행 헤더 엑셀 처리 (기존 로직)
  const header = rawRows[0] || []
  const colMap = {}
  header.forEach((h, idx) => {
    if (h) colMap[String(h).replace(/[\r\n\s]+/g, '')] = idx
  })

  const students = []
  for (let r = 1; r < rawRows.length; r++) {
    const row = rawRows[r]
    if (!row || row.length === 0) continue

    const getVal = (...keys) => {
      for (const k of keys) {
        const cleanK = k.replace(/[\r\n\s]+/g, '')
        if (colMap[cleanK] !== undefined && row[colMap[cleanK]] !== undefined) {
          return String(row[colMap[cleanK]]).trim()
        }
      }
      return ''
    }

    const name = getVal('이름', '성명', '학생명')
    if (!name) continue

    const classNum = getVal('반', '학급') || '1'
    const studentNum = Number(getVal('번호', '출석번호')) || r
    const grade = Number(getVal('학년')) || fileMeta.grade || options.defaultGrade
    const examName = getVal('시험명', '회차', '모의고사', '구분') || defaultExamName

    students.push({
      grade,
      classNum,
      studentNum,
      name,
      studentKey: `${grade}-${classNum}-${studentNum}_${name}`,
      legacyStudentKey: `${classNum}-${studentNum}_${name}`,
      examName,
      korSubject: getVal('국어(과목)', '국어(선택)', '국어선택', '국어과목') || '화법과작문',
      korStandardScore: parseNum(getVal('국어(표준점수)', '국어표점')),
      korPercentile: parseNum(getVal('국어(백분위)', '국어백분위')),
      korGrade: parseNum(getVal('국어(등급)', '국어등급')),
      mathSubject: getVal('수학(과목)', '수학(선택)', '수학선택', '수학과목') || '확률과통계',
      mathStandardScore: parseNum(getVal('수학(표준점수)', '수학표점')),
      mathPercentile: parseNum(getVal('수학(백분위)', '수학백분위')),
      mathGrade: parseNum(getVal('수학(등급)', '수학등급')),
      engGrade: parseNum(getVal('영어(등급)', '영어등급')),
      histGrade: parseNum(getVal('한국사(등급)', '한국사등급')),
      inquiry1: getVal('탐구1(과목)', '탐구1(선택)', '탐구1과목', '사탐1', '과탐1') || '',
      inq1StandardScore: parseNum(getVal('탐구1(표준점수)', '탐구1표점')),
      inq1Percentile: parseNum(getVal('탐구1(백분위)', '탐구1백분위')),
      inq1Grade: parseNum(getVal('탐구1(등급)', '탐구1등급')),
      inquiry2: getVal('탐구2(과목)', '탐구2(선택)', '탐구2과목', '사탐2', '과탐2') || '',
      inq2StandardScore: parseNum(getVal('탐구2(표준점수)', '탐구2표점')),
      inq2Percentile: parseNum(getVal('탐구2(백분위)', '탐구2백분위')),
      inq2Grade: parseNum(getVal('탐구2(등급)', '탐구2등급')),
      secondLangSubject: getVal('제2외국어(과목)', '제2외국어') || '-',
      secondLangGrade: parseNum(getVal('제2외국어(등급)'))
    })
  }

  return {
      success: students.length > 0,
      formatType: 'EXCEL_SHEET',
      meta: {
        fileName: options.fileName,
        examName: students[0]?.examName || defaultExamName,
        grade: options.defaultGrade,
        studentCount: students.length,
        targetAdmissionYear: options.targetAdmissionYear,
        targetAcademicYear: options.targetAcademicYear,
        targetSheetName: options.targetSheetName
      },
      students
    }
  } catch (err) {
    console.error('[mockExamReportParser] 엑셀 파싱 중 치명적 예외:', err)
    return {
      success: false,
      formatType: 'ERROR_EXCEL',
      error: '엑셀 파싱 오류: ' + (err.message || '알 수 없는 형식 오류'),
      students: []
    }
  }
}

export function extractMonthNum(examName) {
  const m = String(examName || '').match(/(\d{1,2})월?/)
  return m ? Number(m[1]) : 3
}

/**
 * 학생 성적 객체 배열을 구글 시트 '2027모의결과' 44개 컬럼 규격(A~AR)으로 변환
 * @param {Array} students 
 * @param {Object} options { includeHeaders: boolean, defaultExamMonth: number|string }
 * - includeHeaders: true 면 1행/2행 복합 헤더 포함 (엑셀 백업 다운로드용)
 * - includeHeaders: false 면 순수 학생 데이터 행만 반환 (3행 A3 셀에 붙여넣기용)
 */
export function convertStudentsToSheetRows(students = [], options = {}) {
  const { includeHeaders = false, defaultExamMonth = null } = options

  const rows = []
  if (includeHeaders) {
    rows.push(KCUE_MOCK_44_HEADERS_ROW1)
    rows.push(KCUE_MOCK_44_HEADERS_ROW2)
  }

  for (const s of students) {
    const month = defaultExamMonth ? Number(defaultExamMonth) : extractMonthNum(s.examName)
    const seriesNum = 1 // 계열번호 기본값 1
    rows.push([
      month,                                      // A: 월
      seriesNum,                                  // B: 계열번호
      s.grade ?? 3,                               // C: 학년
      s.classNum ?? '',                           // D: 반
      s.studentNum ?? '',                         // E: 번호
      s.name ?? '',                               // F: 이름
      s.korSubject ?? '',                         // G: 국어 국어선택
      '',                                         // H: 공통원점수
      '',                                         // I: 선택원점수
      s.korRawScore ?? '',                        // J: 원점수총점
      s.korStandardScore ?? '',                   // K: 표준점수
      s.korPercentile ?? '',                      // L: 백분위
      s.korGrade ?? '',                           // M: 등급
      s.mathSubject ?? '',                        // N: 수학 수학선택
      '',                                         // O: 공통원점수
      '',                                         // P: 선택원점수
      s.mathRawScore ?? '',                       // Q: 원점수총점
      s.mathStandardScore ?? '',                  // R: 표준점수
      s.mathPercentile ?? '',                     // S: 백분위
      s.mathGrade ?? '',                          // T: 등급
      s.engRawScore ?? '',                        // U: 영어 원점수
      '',                                         // V: 영어 표준점수
      '',                                         // W: 영어 백분위
      s.engGrade ?? '',                           // X: 영어 등급
      '',                                         // Y: 탐구영역
      s.inquiry1 ?? '',                           // Z: 선택1 과목명
      s.inq1RawScore ?? '',                       // AA: 선택1 원점수
      s.inq1StandardScore ?? '',                  // AB: 선택1 표준점수
      s.inq1Percentile ?? '',                     // AC: 선택1 백분위
      s.inq1Grade ?? '',                          // AD: 선택1 등급
      s.inquiry2 ?? '',                           // AE: 선택2 과목명
      s.inq2RawScore ?? '',                       // AF: 선택2 원점수
      s.inq2StandardScore ?? '',                  // AG: 선택2 표준점수
      s.inq2Percentile ?? '',                     // AH: 선택2 백분위
      s.inq2Grade ?? '',                          // AI: 선택2 등급
      s.histRawScore ?? '',                       // AJ: 한국사 원점수
      '',                                         // AK: 한국사 표준점수
      '',                                         // AL: 한국사 백분위
      s.histGrade ?? '',                          // AM: 한국사 등급
      (s.secondLangSubject && s.secondLangSubject !== '-') ? s.secondLangSubject : '', // AN: 제2외국어 과목명
      s.secondLangRawScore ?? '',                 // AO: 제2외국어 원점수
      '',                                         // AP: 제2외국어 표준점수
      '',                                         // AQ: 제2외국어 백분위
      s.secondLangGrade ?? ''                     // AR: 제2외국어 등급
    ])
  }
  return rows
}

// -----------------------------------------------------------------------------
// [SEN진학 전용 29개 컬럼 규격] 서울시교육청 진학상담프로그램 호환 엑셀 내보내기
// -----------------------------------------------------------------------------

export const SEN_MOCK_29_HEADERS_ROW1 = [
  '계열번호', '학년', '반', '번호', '이름',
  '국어', '', '', '',
  '수학', '', '', '',
  '영어', '', '', '',
  '사회탐구', '', '', '',
  '과학탐구', '', '', '',
  '한국사', '', '', ''
]

export const SEN_MOCK_29_HEADERS_ROW2 = [
  '계열번호', '학년', '반', '번호', '이름',
  '원점수', '표준점수', '백분위', '등급',
  '원점수', '표준점수', '백분위', '등급',
  '원점수', '표준점수', '백분위', '등급',
  '원점수', '표준점수', '백분위', '등급',
  '원점수', '표준점수', '백분위', '등급',
  '원점수', '표준점수', '백분위', '등급'
]

const SOCIAL_SUBJECT_NAMES = [
  '통합사회', '생활과 윤리', '윤리와 사상', '한국지리', '세계지리',
  '동아시아사', '세계사', '경제', '정치와 법', '사회·문화', '사회문화',
  '생윤', '윤사', '한지', '세지', '동사', '세사', '정법', '사문'
]

const SCIENCE_SUBJECT_NAMES = [
  '통합과학',
  '물리학Ⅰ', '물리학I', '물리학1', '물리Ⅰ', '물리I', '물리1',
  '화학Ⅰ', '화학I', '화학1', '화1',
  '생명과학Ⅰ', '생명과학I', '생명과학1', '생명Ⅰ', '생명I', '생명1', '생물Ⅰ', '생물I', '생물1',
  '지구과학Ⅰ', '지구과학I', '지구과학1', '지구Ⅰ', '지구I', '지구1', '지학Ⅰ', '지학I', '지학1',
  '물리학Ⅱ', '물리학II', '물리학2', '물리Ⅱ', '물리II', '물리2',
  '화학Ⅱ', '화학II', '화학2', '화2',
  '생명과학Ⅱ', '생명과학II', '생명과학2', '생명Ⅱ', '생명II', '생명2', '생물Ⅱ', '생물II', '생물2',
  '지구과학Ⅱ', '지구과학II', '지구과학2', '지구Ⅱ', '지구II', '지구2', '지학Ⅱ', '지학II', '지학2'
]

export function isSocialSubject(sub) {
  if (!sub || typeof sub !== 'string') return false
  const c = sub.replace(/[\s·./]/g, '')
  return SOCIAL_SUBJECT_NAMES.some(s => c.includes(s.replace(/[\s·./]/g, '')))
}

export function isScienceSubject(sub) {
  if (!sub || typeof sub !== 'string') return false
  const c = sub.replace(/[\s·./]/g, '')
  return SCIENCE_SUBJECT_NAMES.some(s => c.includes(s.replace(/[\s·./]/g, '')))
}

/**
 * 학생 성적 객체 배열을 서울시교육청 SEN진학 양식(29개 컬럼, 1·2행 복합 헤더, 3행부터 데이터)으로 변환
 * @param {Array} students 
 * @param {number|string} selectedGrade 
 * @returns {Array[]} rows
 */
export function convertStudentsToSenExcelRows(students = [], selectedGrade = 3) {
  const row1 = [...SEN_MOCK_29_HEADERS_ROW1]
  const row2 = [...SEN_MOCK_29_HEADERS_ROW2]

  const dataRows = []
  for (const s of students) {
    const socialInqs = []
    const scienceInqs = []

    if (s.inquiry1 || s.inq1Grade || s.inq1RawScore || s.inq1StandardScore) {
      const item1 = {
        name: s.inquiry1 || '',
        raw: s.inq1RawScore,
        std: s.inq1StandardScore,
        pct: s.inq1Percentile,
        grade: s.inq1Grade
      }
      if (s.inquiry1 && isSocialSubject(s.inquiry1)) socialInqs.push(item1)
      else if (s.inquiry1 && isScienceSubject(s.inquiry1)) scienceInqs.push(item1)
      else if (Number(s.seriesNum) === 2 || Number(s.trackNum) === 2) scienceInqs.push(item1)
      else socialInqs.push(item1)
    }

    if (s.inquiry2 || s.inq2Grade || s.inq2RawScore || s.inq2StandardScore) {
      const item2 = {
        name: s.inquiry2 || '',
        raw: s.inq2RawScore,
        std: s.inq2StandardScore,
        pct: s.inq2Percentile,
        grade: s.inq2Grade
      }
      if (s.inquiry2 && isSocialSubject(s.inquiry2)) socialInqs.push(item2)
      else if (s.inquiry2 && isScienceSubject(s.inquiry2)) scienceInqs.push(item2)
      else if (scienceInqs.length > 0 || Number(s.seriesNum) === 2 || Number(s.trackNum) === 2) scienceInqs.push(item2)
      else socialInqs.push(item2)
    }

    // 계열번호 산출 (1: 인문, 2: 자연)
    let seriesNum = 1
    if (s.seriesNum) {
      seriesNum = Number(s.seriesNum)
    } else if (s.trackNum) {
      seriesNum = Number(s.trackNum)
    } else if (scienceInqs.length > 0 || (s.mathSubject && (s.mathSubject.includes('미적') || s.mathSubject.includes('기하')))) {
      seriesNum = 2
    }

    // 탐구 성적 집계 함수 (2과목 합산/평균)
    const aggregateInquiry = (inqs) => {
      if (!inqs || inqs.length === 0) return ['', '', '', '']
      if (inqs.length === 1) {
        return [
          inqs[0].raw != null && inqs[0].raw !== '' ? inqs[0].raw : '',
          inqs[0].std != null && inqs[0].std !== '' ? inqs[0].std : '',
          inqs[0].pct != null && inqs[0].pct !== '' ? inqs[0].pct : '',
          inqs[0].grade != null && inqs[0].grade !== '' ? inqs[0].grade : ''
        ]
      }
      const a = inqs[0]
      const b = inqs[1]

      // 원점수
      let raw = ''
      if (a.raw != null && a.raw !== '' && b.raw != null && b.raw !== '') {
        raw = Number(a.raw) + Number(b.raw)
      } else if (a.raw != null && a.raw !== '') {
        raw = a.raw
      } else if (b.raw != null && b.raw !== '') {
        raw = b.raw
      }

      // 표준점수 (2과목 합산)
      let std = ''
      if (a.std != null && a.std !== '' && b.std != null && b.std !== '') {
        std = Number(a.std) + Number(b.std)
      } else if (a.std != null && a.std !== '') {
        std = a.std
      } else if (b.std != null && b.std !== '') {
        std = b.std
      }

      // 백분위 (2과목 평균)
      let pct = ''
      if (a.pct != null && a.pct !== '' && b.pct != null && b.pct !== '') {
        pct = Math.round(((Number(a.pct) + Number(b.pct)) / 2) * 10) / 10
      } else if (a.pct != null && a.pct !== '') {
        pct = a.pct
      } else if (b.pct != null && b.pct !== '') {
        pct = b.pct
      }

      // 등급 (2과목 평균)
      let grade = ''
      if (a.grade != null && a.grade !== '' && b.grade != null && b.grade !== '') {
        grade = Math.round(((Number(a.grade) + Number(b.grade)) / 2) * 10) / 10
      } else if (a.grade != null && a.grade !== '') {
        grade = a.grade
      } else if (b.grade != null && b.grade !== '') {
        grade = b.grade
      }

      return [raw, std, pct, grade]
    }

    const [socRaw, socStd, socPct, socGrade] = aggregateInquiry(socialInqs)
    const [sciRaw, sciStd, sciPct, sciGrade] = aggregateInquiry(scienceInqs)

    dataRows.push([
      seriesNum,                                              // A: 계열번호
      Number(s.grade) || Number(selectedGrade) || 3,          // B: 학년
      Number(s.classNum) || s.classNum || '',                 // C: 반
      Number(s.studentNum) || s.studentNum || '',             // D: 번호
      s.name || '',                                           // E: 이름
      s.korRawScore != null && s.korRawScore !== '' ? s.korRawScore : '',               // F: 국어 원점수
      s.korStandardScore != null && s.korStandardScore !== '' ? s.korStandardScore : '', // G: 국어 표준점수
      s.korPercentile != null && s.korPercentile !== '' ? s.korPercentile : '',          // H: 국어 백분위
      s.korGrade != null && s.korGrade !== '' ? s.korGrade : '',                         // I: 국어 등급
      s.mathRawScore != null && s.mathRawScore !== '' ? s.mathRawScore : '',             // J: 수학 원점수
      s.mathStandardScore != null && s.mathStandardScore !== '' ? s.mathStandardScore : '', // K: 수학 표준점수
      s.mathPercentile != null && s.mathPercentile !== '' ? s.mathPercentile : '',        // L: 수학 백분위
      s.mathGrade != null && s.mathGrade !== '' ? s.mathGrade : '',                       // M: 수학 등급
      s.engRawScore != null && s.engRawScore !== '' ? s.engRawScore : '',                // N: 영어 원점수
      s.engStandardScore != null && s.engStandardScore !== '' ? s.engStandardScore : '', // O: 영어 표준점수
      s.engPercentile != null && s.engPercentile !== '' ? s.engPercentile : '',          // P: 영어 백분위
      s.engGrade != null && s.engGrade !== '' ? s.engGrade : '',                         // Q: 영어 등급
      socRaw,                                                 // R: 사회탐구 원점수
      socStd,                                                 // S: 사회탐구 표준점수
      socPct,                                                 // T: 사회탐구 백분위
      socGrade,                                               // U: 사회탐구 등급
      sciRaw,                                                 // V: 과학탐구 원점수
      sciStd,                                                 // W: 과학탐구 표준점수
      sciPct,                                                 // X: 과학탐구 백분위
      sciGrade,                                               // Y: 과학탐구 등급
      s.histRawScore != null && s.histRawScore !== '' ? s.histRawScore : '',             // Z: 한국사 원점수
      s.histStandardScore != null && s.histStandardScore !== '' ? s.histStandardScore : '', // AA: 한국사 표준점수
      s.histPercentile != null && s.histPercentile !== '' ? s.histPercentile : '',        // AB: 한국사 백분위
      s.histGrade != null && s.histGrade !== '' ? s.histGrade : ''                        // AC: 한국사 등급
    ])
  }

  return [row1, row2, ...dataRows]
}

