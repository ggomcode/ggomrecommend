import * as pdfjsLib from 'pdfjs-dist/build/pdf.js'
import * as XLSX from 'xlsx'

// PDF.js 워커 설정 (Vite 브라우저 환경)
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url
  ).toString()
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
  const uploadDate = options.uploadDate || new Date()
  const targetAdmissionYear = getTargetCollegeAdmissionYear(uploadDate)
  const targetAcademicYear = getAcademicSchoolYear(uploadDate)
  const targetSheetName = getTargetMockResultSheetName(uploadDate)

  if (isPdf) {
    return await parseMockExamPdf(arrayBuffer, {
      fileName,
      defaultGrade,
      targetAdmissionYear,
      targetAcademicYear,
      targetSheetName
    })
  } else if (isExcel) {
    return await parseMockExamExcel(arrayBuffer, {
      fileName,
      defaultGrade,
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
      cMapPacked: true
    })
    doc = await loadingTask.promise
  } catch (err) {
    console.error('PDF 로드 실패:', err)
    throw new Error('PDF 파일을 열 수 없습니다: ' + (err.message || '파일 손상 또는 미지원 형식'))
  }

  const allRowCells = []
  let totalTextItems = 0
  let detectedTitle = ''
  let detectedSchool = ''
  let detectedGrade = options.defaultGrade
  let detectedClass = ''
  let detectedExamName = ''

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()
    totalTextItems += content.items.length

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

      // 제목 및 시험명 감지
      if (!detectedTitle && (lineStr.includes('전국연합학력평가') || lineStr.includes('모의평가') || lineStr.includes('대학수학능력시험'))) {
        detectedTitle = lineStr
        const mExam = lineStr.match(/([0-9]{1,2})\s*월\s*(전국연합학력평가|모의평가|학평|모평)?/)
        if (mExam) {
          detectedExamName = `${mExam[1]}월 학평`
          if (lineStr.includes('모의평가')) detectedExamName = `${mExam[1]}월 모평`
        }
      }

      // 학년·반·학교 감지 (예: "3 1 포곡고등학교", cells: ["3", "1", "포곡고등학교", ...])
      if (!detectedClass && cells.length >= 3) {
        if (/^[1-3]$/.test(cells[0]) && /^\d{1,2}$/.test(cells[1]) && /고등학교|고|학교/.test(cells[2])) {
          detectedGrade = Number(cells[0])
          detectedClass = String(cells[1])
          detectedSchool = cells[2]
        }
      }
    }
  }

  // 1. 텍스트 레이어가 비어있는 경우
  if (totalTextItems === 0) {
    return {
      success: false,
      formatType: 'IMAGE_OR_OUTLINE_PDF',
      error: 'PDF 파일에 디지털 텍스트 레이어가 없습니다. 한컴PDF 인쇄본 대신 나이스(NEIS) 또는 평가원 시스템에서 직접 다운로드한 텍스트 PDF나 엑셀(.xlsx) 파일로 업로드해 주세요.',
      students: []
    }
  }

  // 2. 양식 자동 분류
  const isMoeReport = allRowCells.some(r => r.lineStr.includes('전국연합학력평가') || r.lineStr.includes('성적일람표1(학급별)'))
  const isKiceReport = allRowCells.some(r => r.lineStr.includes('대학수학능력시험') || r.lineStr.includes('모의평가 성적일람표'))

  let students = []
  let formatType = 'UNKNOWN'

  if (isMoeReport || (!isKiceReport && allRowCells.some(r => r.cells.length >= 20 && /^\d{1,2}$/.test(r.cells[0]) && /^[가-힣]{2,4}$/.test(r.cells[1])))) {
    formatType = 'MOE_ACADEMIC_EVALUATION' // 교육청 학평 (가로 1행)
    students = parseMoeClusteredRows(allRowCells, {
      grade: detectedGrade || options.defaultGrade,
      classNum: detectedClass || '1',
      examName: detectedExamName || '10월 학평'
    })
  } else if (isKiceReport) {
    formatType = 'KICE_MOCK_EVALUATION' // 평가원 모평 (수험번호 9자리 + 4행 블록)
    students = parseKiceClusteredRows(allRowCells, {
      grade: detectedGrade || options.defaultGrade,
      classNum: detectedClass || '1',
      examName: detectedExamName || '6월 모평'
    })
  } else {
    // 범용
    formatType = 'GENERAL_REPORT'
    students = parseMoeClusteredRows(allRowCells, {
      grade: detectedGrade || options.defaultGrade,
      classNum: detectedClass || '1',
      examName: detectedExamName || '모의고사'
    })
  }

  return {
    success: students.length > 0,
    formatType,
    meta: {
      fileName: options.fileName,
      totalTextItems,
      detectedTitle: detectedTitle || detectedExamName,
      examName: detectedExamName || (formatType === 'KICE_MOCK_EVALUATION' ? '6월 모평' : '10월 학평'),
      grade: detectedGrade || options.defaultGrade,
      classNum: detectedClass || '1',
      schoolName: detectedSchool,
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
    const c = rowObj.cells
    if (!c || c.length < 15) continue

    // 번호와 성명 검사: cells[0] 번호, cells[1] 성명
    if (!/^\d{1,2}$/.test(c[0]) || !/^[가-힣]{2,4}$/.test(c[1])) {
      continue
    }

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
 * 평가원 모의평가 클러스터링 셀 파싱
 */
function parseKiceClusteredRows(allRowCells, defaultMeta) {
  const students = []

  for (let i = 0; i < allRowCells.length; i++) {
    const row = allRowCells[i]
    // cells에서 9자리 수험번호 탐색
    const examineeCell = row.cells.find(c => /^\d{9}$/.test(c))
    if (examineeCell) {
      const examineeNum = examineeCell
      const classNum = String(parseInt(examineeNum.slice(5, 7), 10))
      const studentNum = parseInt(examineeNum.slice(7, 9), 10)
      const name = row.cells.find(c => /^[가-힣]{2,4}$/.test(c)) || ''

      // 이후 4행 블록
      const block = allRowCells.slice(i, i + 6)
      const parseNum = (v) => {
        if (!v || v === '-') return null
        const n = Number(String(v).replace(/[^0-9.]/g, ''))
        return isNaN(n) ? null : n
      }

      let korSubject = '화법과작문'
      let korStandardScore = null
      let korPercentile = null
      let korGrade = null

      let mathSubject = '확률과통계'
      let mathStandardScore = null
      let mathPercentile = null
      let mathGrade = null

      let engGrade = null
      let histGrade = null

      let inq1Subject = ''
      let inq1StandardScore = null
      let inq1Percentile = null
      let inq1Grade = null

      let inq2Subject = ''
      let inq2StandardScore = null
      let inq2Percentile = null
      let inq2Grade = null

      for (const b of block) {
        const text = b.lineStr
        if (text.includes('등 급') || /등급/.test(text)) {
          const digits = b.cells.map(c => parseNum(c)).filter(n => n !== null && n >= 1 && n <= 9)
          if (digits.length >= 4) {
            histGrade = digits[0]
            korGrade = digits[1]
            mathGrade = digits[2]
            engGrade = digits[3]
            if (digits[4]) inq1Grade = digits[4]
            if (digits[5]) inq2Grade = digits[5]
          }
        }
        if (text.includes('표준점수') || /표 준 점 수/.test(text)) {
          const scores = b.cells.map(c => parseNum(c)).filter(n => n !== null && n >= 10)
          if (scores.length >= 2) {
            korStandardScore = scores[0]
            mathStandardScore = scores[1]
            if (scores[2]) inq1StandardScore = scores[2]
            if (scores[3]) inq2StandardScore = scores[3]
          }
        }
        if (text.includes('백분위') || /백 분 위/.test(text)) {
          const pcts = b.cells.map(c => parseNum(c)).filter(n => n !== null)
          if (pcts.length >= 2) {
            korPercentile = pcts[0]
            mathPercentile = pcts[1]
            if (pcts[2]) inq1Percentile = pcts[2]
            if (pcts[3]) inq2Percentile = pcts[3]
          }
        }
        if (text.includes('선택과목') || /선 택 과 목/.test(text)) {
          if (text.includes('언어와매체')) korSubject = '언어와매체'
          if (text.includes('미적분')) mathSubject = '미적분'
          if (text.includes('기하')) mathSubject = '기하'
          const inqs = b.cells.filter(c => /생활과윤리|윤리와사상|한국지리|세계지리|세계사|동아시아사|경제|정치와법|사회문화|물리학|화학|생명과학|지구과학/.test(c))
          if (inqs[0]) inq1Subject = inqs[0]
          if (inqs[1]) inq2Subject = inqs[1]
        }
      }

      students.push({
        grade: defaultMeta.grade || 3,
        classNum,
        studentNum,
        name,
        studentKey: `${defaultMeta.grade || 3}-${classNum}-${studentNum}_${name}`,
        legacyStudentKey: `${classNum}-${studentNum}_${name}`,
        examName: defaultMeta.examName,
        korSubject,
        korStandardScore,
        korPercentile,
        korGrade,
        mathSubject,
        mathStandardScore,
        mathPercentile,
        mathGrade,
        engGrade,
        histGrade,
        inquiry1: inq1Subject,
        inq1StandardScore,
        inq1Percentile,
        inq1Grade,
        inquiry2: inq2Subject,
        inq2StandardScore,
        inq2Percentile,
        inq2Grade,
        secondLangSubject: '-',
        secondLangGrade: null
      })
    }
  }

  return students
}

/**
 * 엑셀 성적일람표 파싱
 */
async function parseMockExamExcel(arrayBuffer, options) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 })

  if (!rawRows || rawRows.length < 2) {
    throw new Error('엑셀 파일에 데이터가 존재하지 않습니다.')
  }

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
    const grade = Number(getVal('학년')) || options.defaultGrade
    const examName = getVal('시험명', '회차', '모의고사', '구분') || '모의고사'

    students.push({
      grade,
      classNum,
      studentNum,
      name,
      studentKey: `${grade}-${classNum}-${studentNum}_${name}`,
      legacyStudentKey: `${classNum}-${studentNum}_${name}`,
      examName,
      korSubject: getVal('국어(과목)', '국어선택', '국어과목') || '화법과작문',
      korStandardScore: Number(getVal('국어(표준점수)', '국어표점')) || null,
      korPercentile: Number(getVal('국어(백분위)', '국어백분위')) || null,
      korGrade: Number(getVal('국어(등급)', '국어등급')) || null,
      mathSubject: getVal('수학(과목)', '수학선택', '수학과목') || '확률과통계',
      mathStandardScore: Number(getVal('수학(표준점수)', '수학표점')) || null,
      mathPercentile: Number(getVal('수학(백분위)', '수학백분위')) || null,
      mathGrade: Number(getVal('수학(등급)', '수학등급')) || null,
      engGrade: Number(getVal('영어(등급)', '영어등급')) || null,
      histGrade: Number(getVal('한국사(등급)', '한국사등급')) || null,
      inquiry1: getVal('탐구1(과목)', '탐구1과목', '사탐1', '과탐1') || '',
      inq1StandardScore: Number(getVal('탐구1(표준점수)', '탐구1표점')) || null,
      inq1Percentile: Number(getVal('탐구1(백분위)', '탐구1백분위')) || null,
      inq1Grade: Number(getVal('탐구1(등급)', '탐구1등급')) || null,
      inquiry2: getVal('탐구2(과목)', '탐구2과목', '사탐2', '과탐2') || '',
      inq2StandardScore: Number(getVal('탐구2(표준점수)', '탐구2표점')) || null,
      inq2Percentile: Number(getVal('탐구2(백분위)', '탐구2백분위')) || null,
      inq2Grade: Number(getVal('탐구2(등급)', '탐구2등급')) || null,
      secondLangSubject: getVal('제2외국어(과목)', '제2외국어') || '-',
      secondLangGrade: Number(getVal('제2외국어(등급)')) || null
    })
  }

  return {
    success: students.length > 0,
    formatType: 'EXCEL_SHEET',
    meta: {
      fileName: options.fileName,
      examName: students[0]?.examName || '모의고사',
      grade: options.defaultGrade,
      studentCount: students.length,
      targetAdmissionYear: options.targetAdmissionYear,
      targetAcademicYear: options.targetAcademicYear,
      targetSheetName: options.targetSheetName
    },
    students
  }
}

/**
 * 2027모의가채점 / 2027모의결과 표준 컬럼 헤더 목록
 */
export const MOCK_RESULT_STANDARD_HEADERS = [
  '학년',
  '반',
  '번호',
  '이름',
  '시험명',
  '국어(과목)',
  '국어(등급)',
  '국어(표준점수)',
  '국어(백분위)',
  '수학(과목)',
  '수학(등급)',
  '수학(표준점수)',
  '수학(백분위)',
  '영어(등급)',
  '한국사(등급)',
  '탐구1(과목)',
  '탐구1(등급)',
  '탐구1(표준점수)',
  '탐구1(백분위)',
  '탐구2(과목)',
  '탐구2(등급)',
  '탐구2(표준점수)',
  '탐구2(백분위)',
  '제2외국어(과목)',
  '제2외국어(등급)'
]

/**
 * 파싱된 학생 레코드 배열을 구글 시트 규격 2차원 배열로 변환
 */
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
