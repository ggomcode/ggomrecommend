import * as pdfjsLib from 'pdfjs-dist'
import * as XLSX from 'xlsx'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url'

// PDF.js 워커 설정 (Vite 번들 로컬 워커 우선 적용)
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker
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

  const arrayBuffer = await file.arrayBuffer()
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
      cMapPacked: true,
      stopAtErrors: false
    })
    // 3.5초 타임아웃 레이스로 워커 먹통/Hang 완벽 차단
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PDF 로드 시간 초과 (3.5초)')), 3500)
    )
    doc = await Promise.race([loadingTask.promise, timeoutPromise])
  } catch (err) {
    console.warn('[mockExamReportParser] PDF 로드 1차 실패, 메인 스레드 모드로 재시도:', err)
    try {
      const fallbackTask = pdfjsLib.getDocument({ 
        data: new Uint8Array(arrayBuffer),
        disableFontFace: true,
        stopAtErrors: false
      })
      const timeoutPromise2 = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF 로드 최종 시간 초과 (2.5초)')), 2500)
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
  let totalTextItems = 0

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()
    totalTextItems += content.items.length
    allRawTextItems.push(...content.items)

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
  const isKiceReport = fullTextClean.includes('대학수학능력시험') || 
                       fullTextClean.includes('모의평가성적일람표') || 
                       allRawTextItems.some(it => /^\d{9}$/.test(it.str?.trim()))
  const isMoeReport = fullTextClean.includes('전국연합학력평가') || 
                      fullTextClean.includes('성적일람표1(학급별)') ||
                      (!isKiceReport && allRowCells.some(r => r.cells.length >= 10 && /^\d{1,2}$/.test(r.cells[0]) && /^[가-힣]{2,4}$/.test(r.cells[1])))

  let students = []
  let formatType = 'UNKNOWN'

  if (isKiceReport) {
    formatType = 'KICE_MOCK_EVALUATION' // 평가원 모평 (6모·9모: 수험번호 9자리 + 4행 블록 구조)
    students = parseKicePages(doc, {
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

  // parseKicePages가 비동기이므로 await 처리 필요
  if (students instanceof Promise) {
    students = await students
  }

  return {
    success: students.length > 0,
    formatType,
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
 */
function parseMoeClusteredRows(allRowCells, defaultMeta) {
  const students = []

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

    // 인덱스 기반 과목 매핑
    // [0]: 번호, [1]: 성명
    // [2]: 국어과목, [3]: 국어표점, [4]: 국어석차, [5]: 국어백분위, [6]: 국어등급
    // [7]: 수학과목, [8]: 수학표점, [9]: 수학석차, [10]: 수학백분위, [11]: 수학등급
    // [12]: 영어등급, [13]: 한국사등급
    // [14]: 탐구1과목, [15]: 탐구1표점, [16]: 탐구1석차, [17]: 탐구1백분위, [18]: 탐구1등급
    // [19]: 탐구2과목, [20]: 탐구2표점, [21]: 탐구2석차, [22]: 탐구2백분위, [23]: 탐구2등급
    // [24]: 제2외과목, [25]: 제2외등급

    const parseNum = (v) => {
      if (v === undefined || v === null || v === '-' || v === '') return null
      const clean = String(v).replace(/[^0-9.]/g, '')
      const n = Number(clean)
      return isNaN(n) ? null : n
    }

    students.push({
      grade: defaultMeta.grade,
      classNum: defaultMeta.classNum,
      studentNum,
      name,
      studentKey: `${defaultMeta.grade || 3}-${defaultMeta.classNum}-${studentNum}_${name}`,
      legacyStudentKey: `${defaultMeta.classNum}-${studentNum}_${name}`,
      examName: defaultMeta.examName,
      korSubject: c[2] || '화법과작문',
      korStandardScore: parseNum(c[3]),
      korSchoolRank: parseNum(c[4]),
      korPercentile: parseNum(c[5]),
      korGrade: parseNum(c[6]),
      mathSubject: c[7] || '확률과통계',
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
      secondLangSubject: c[24] || '-',
      secondLangGrade: parseNum(c[25])
    })
  }

  return students
}

/**
 * 평가원 모의평가(6월·9월 모의평가) 전용 4행 블록 파서
 * - 1페이지당 약 10명의 학생이 4개 행(선택과목 / 표준점수 / 백분위 / 등급) 블록으로 배치됨
 * - 9자리 수험번호(시도학교+반2자리+번호2자리) 및 성명, 7개 영역 정밀 추출
 */
async function parseKicePages(doc, defaultMeta) {
  const students = []
  const parseNum = (v) => {
    if (!v || v === '-') return null
    const n = Number(String(v).replace(/[^0-9.]/g, ''))
    return isNaN(n) ? null : n
  }

  const isLabel = (w) => ['선','택','과','목','선택과목','표','준','점','수','표준점수','백','분','위','백분위','등','급','등급'].includes(w)

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()
    const items = content.items.filter(it => it.str && it.str.trim() !== '')

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
        korStandardScore: parseNum(getVal(row, '국어_표준점수')),
        korPercentile: parseNum(getVal(row, '국어_백분위')),
        korGrade: parseNum(getVal(row, '국어_등급')),
        mathSubject: getVal(row, '수학_선택') || '확률과 통계',
        mathStandardScore: parseNum(getVal(row, '수학_표준점수')),
        mathPercentile: parseNum(getVal(row, '수학_백분위')),
        mathGrade: parseNum(getVal(row, '수학_등급')),
        engGrade: parseNum(getVal(row, '영어_등급')),
        histGrade: parseNum(getVal(row, '한국사_등급')),
        inquiry1: getVal(row, '탐구영역1_선택', '탐구1_선택') || '',
        inq1StandardScore: parseNum(getVal(row, '탐구영역1_표준점수', '탐구1_표준점수')),
        inq1Percentile: parseNum(getVal(row, '탐구영역1_백분위', '탐구1_백분위')),
        inq1Grade: parseNum(getVal(row, '탐구영역1_등급', '탐구1_등급')),
        inquiry2: getVal(row, '탐구영역2_선택', '탐구2_선택') || '',
        inq2StandardScore: parseNum(getVal(row, '탐구영역2_표준점수', '탐구2_표준점수')),
        inq2Percentile: parseNum(getVal(row, '탐구영역2_백분위', '탐구2_백분위')),
        inq2Grade: parseNum(getVal(row, '탐구영역2_등급', '탐구2_등급')),
        secondLangSubject: getVal(row, '제2외국어_과목명', '제2외국어_선택') || '-',
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

export function convertStudentsToSheetRows(students = []) {
  const rows = [MOCK_RESULT_STANDARD_HEADERS]
  for (const s of students) {
    rows.push([
      s.grade ?? 3,
      s.classNum ?? '',
      s.studentNum ?? '',
      s.name ?? '',
      s.examName ?? '',
      s.korSubject ?? '',
      s.korGrade ?? '',
      s.korStandardScore ?? '',
      s.korPercentile ?? '',
      s.mathSubject ?? '',
      s.mathGrade ?? '',
      s.mathStandardScore ?? '',
      s.mathPercentile ?? '',
      s.engGrade ?? '',
      s.histGrade ?? '',
      s.inquiry1 ?? '',
      s.inq1Grade ?? '',
      s.inq1StandardScore ?? '',
      s.inq1Percentile ?? '',
      s.inquiry2 ?? '',
      s.inq2Grade ?? '',
      s.inq2StandardScore ?? '',
      s.inq2Percentile ?? '',
      s.secondLangSubject ?? '-',
      s.secondLangGrade ?? ''
    ])
  }
  return rows
}
