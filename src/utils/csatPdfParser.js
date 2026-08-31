/**
 * 대학수학능력시험 응시원서 접수대장 PDF 클라이언트 파서
 * - pdfjs-dist 기반 텍스트 추출 및 14개 컬럼 데이터 파싱
 * - 1페이지 좌측 하단 저장 일시(YYYY-MM-DD HH:mm:ss) 추출
 * - 엣지 케이스: 국어+수학 분리, 탐구 줄바꿈 정규화, 졸업생 빈번호 보정
 */

import * as pdfjsLib from 'pdfjs-dist'

// PDF.js 워커 설정
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

// 국어 선택과목 키워드
const KOREAN_SUBJECTS = ['화법과 작문', '언어와 매체']
// 수학 선택과목 키워드
const MATH_SUBJECTS = ['확률과 통계', '미적분', '기하']
// 탐구 유형 키워드 (7종) - 긴 것부터 매칭
const INQUIRY_TYPES = [
  '사회·과학탐구', '사회·직업탐구', '과학·직업탐구',
  '사회탐구', '과학탐구', '직업탐구', 'X'
]

/**
 * PDF 파일에서 접수대장 데이터를 파싱합니다.
 * @param {File} file - 업로드된 PDF File 객체
 * @returns {Promise<{ records: Array, batchTime: string, stats: object }>}
 */
export async function parseCsatPdf(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const totalPages = pdf.numPages

  let batchTime = null
  const allRecords = []

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    const items = textContent.items

    // 1페이지에서 저장 일시 추출 (좌측 하단)
    if (pageNum === 1) {
      batchTime = extractBatchTime(items)
    }

    // 텍스트 아이템을 행(row) 단위로 그룹핑
    const rows = groupTextItemsToRows(items)

    // 각 행에서 데이터 레코드 파싱
    for (const row of rows) {
      const record = parseRecordFromRow(row)
      if (record) {
        allRecords.push(record)
      }
    }
  }

  // 통계 계산
  const stats = computeStats(allRecords)

  return {
    records: allRecords,
    batchTime,
    stats
  }
}

/**
 * 1페이지 좌측 하단에서 저장 일시(YYYY-MM-DD HH:mm:ss) 추출
 */
function extractBatchTime(items) {
  const dateRegex = /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/
  // 하단 영역의 텍스트에서 검색 (y좌표가 작을수록 하단)
  const sortedByY = [...items].sort((a, b) => a.transform[5] - b.transform[5])
  
  for (const item of sortedByY) {
    const match = item.str.match(dateRegex)
    if (match) {
      return `${match[1]} ${match[2]}`
    }
  }

  // 전체 텍스트에서 폴백 검색
  const fullText = items.map(i => i.str).join(' ')
  const match = fullText.match(dateRegex)
  if (match) {
    return `${match[1]} ${match[2]}`
  }

  return null
}

/**
 * 텍스트 아이템을 Y좌표 기준으로 행(row) 단위로 그룹핑
 */
function groupTextItemsToRows(items) {
  if (!items || items.length === 0) return []

  // Y좌표 기준 그룹핑 (같은 행은 Y좌표가 거의 동일)
  const yThreshold = 3 // 같은 행으로 판단하는 Y좌표 차이 허용치
  const rowMap = new Map()

  for (const item of items) {
    const y = Math.round(item.transform[5] / yThreshold) * yThreshold
    if (!rowMap.has(y)) rowMap.set(y, [])
    rowMap.get(y).push({
      text: item.str,
      x: item.transform[4],
      y: item.transform[5],
      width: item.width
    })
  }

  // Y좌표 역순(위에서 아래로) 정렬 후 각 행 내부는 X좌표순 정렬
  return [...rowMap.entries()]
    .sort(([a], [b]) => b - a)
    .map(([, rowItems]) => rowItems.sort((a, b) => a.x - b.x))
}

/**
 * 단일 행에서 접수대장 데이터 레코드를 파싱합니다.
 * 일련번호로 시작하는 행만 데이터 레코드로 인식합니다.
 */
function parseRecordFromRow(rowItems) {
  if (!rowItems || rowItems.length < 3) return null

  // 행의 전체 텍스트 조합
  const texts = rowItems.map(r => r.text.trim()).filter(t => t.length > 0)
  if (texts.length < 3) return null

  // 첫 번째 셀이 숫자(일련번호)가 아니면 헤더/비데이터 행
  const firstText = texts[0]
  if (!/^\d+$/.test(firstText)) return null
  const seqNo = parseInt(firstText, 10)
  if (seqNo < 1 || seqNo > 9999) return null

  // 두 번째 셀이 접수번호(6자리 숫자)인지 확인
  const secondText = texts[1]
  if (!/^\d{5,8}$/.test(secondText)) return null
  const receiptNo = secondText

  // 나머지 필드들을 위치 기반으로 파싱
  return parseColumnsFromTexts(seqNo, receiptNo, texts.slice(2), rowItems)
}

/**
 * 일련번호, 접수번호 이후의 텍스트 배열에서 14개 컬럼 데이터를 파싱
 */
function parseColumnsFromTexts(seqNo, receiptNo, texts, rowItems) {
  // 텍스트 배열을 결합하여 패턴 매칭
  let idx = 0

  // 성명 (한글 2~5자)
  const name = texts[idx] || ''
  idx++

  // 주민등록번호 (숫자-숫자 패턴)
  let residentNo = ''
  const residentParts = []
  while (idx < texts.length) {
    const t = texts[idx]
    if (/^\d{6}$/.test(t) || /^-$/.test(t) || /^\d{7}$/.test(t) || /^\d{6}\s*-\s*\d{7}$/.test(t.replace(/\s/g, ''))) {
      residentParts.push(t)
      idx++
      // 주민번호가 완성되었는지 확인
      const joined = residentParts.join('')
      if (/\d{6}.*\d{7}/.test(joined.replace(/\s/g, ''))) break
      if (residentParts.length >= 3) break
    } else {
      break
    }
  }
  residentNo = residentParts.join('').replace(/\s+/g, ' ').trim()
  if (!residentNo && idx < texts.length) {
    // 주민번호가 파싱 안 된 경우 fallback
    residentNo = texts[idx - 1] || ''
  }

  // 성별
  let gender = ''
  if (idx < texts.length && (texts[idx] === '남자' || texts[idx] === '여자')) {
    gender = texts[idx]
    idx++
  }

  // 반(년) - 숫자
  let classOrGradYear = 0
  if (idx < texts.length && /^\d+$/.test(texts[idx])) {
    classOrGradYear = parseInt(texts[idx], 10)
    idx++
  }

  const isEnrolled = classOrGradYear < 1000

  // 번호 - 재학생은 출석번호, 졸업생은 빈칸
  let studentNo = null
  if (isEnrolled && idx < texts.length && /^\d+$/.test(texts[idx])) {
    studentNo = parseInt(texts[idx], 10)
    idx++
  }

  // 재학생 학번 자동 생성 (3 + 반(2자리) + 번호(2자리))
  let studentCode = null
  if (isEnrolled && classOrGradYear > 0 && studentNo > 0) {
    studentCode = `3${String(classOrGradYear).padStart(2, '0')}${String(studentNo).padStart(2, '0')}`
  }

  // 나머지 텍스트 합쳐서 과목 정보 파싱
  const remaining = texts.slice(idx).join(' ')

  // 국어/수학 파싱
  const { korean, math, restAfterKorMath } = parseKoreanMath(remaining)

  // 영어 (O/X)
  const { value: english, rest: restAfterEng } = extractOX(restAfterKorMath)

  // 한국사 (O/X)
  const { value: history, rest: restAfterHist } = extractOX(restAfterEng)

  // 탐구 유형
  const { inquiryType, rest: restAfterInquiry } = extractInquiryType(restAfterHist)

  // 탐구 선택과목
  const { subjects: inquirySubjects, rest: restAfterSubjects } = extractInquirySubjects(restAfterInquiry)

  // 제2외국어/한문
  const foreignLanguage = restAfterSubjects.trim() || 'X'

  return {
    seq_no: seqNo,
    receipt_no: receiptNo,
    name,
    resident_no: residentNo,
    gender,
    class_or_grad_year: classOrGradYear,
    student_no: studentNo,
    student_code: studentCode,
    is_enrolled: isEnrolled,
    subject_korean: korean || 'X',
    subject_math: math || 'X',
    subject_english: english || 'X',
    subject_history: history || 'X',
    inquiry_type: inquiryType || 'X',
    inquiry_subjects: inquirySubjects || 'X / X',
    foreign_language: cleanForeignLanguage(foreignLanguage)
  }
}

/**
 * 국어/수학 과목 파싱 (텍스트가 붙어있는 경우 분리 처리)
 */
function parseKoreanMath(text) {
  let korean = 'X'
  let math = 'X'
  let rest = text.trim()

  // 국어 키워드 매칭
  for (const kw of KOREAN_SUBJECTS) {
    if (rest.includes(kw)) {
      korean = kw
      rest = rest.replace(kw, '').trim()
      break
    }
  }

  // 수학 키워드 매칭
  for (const kw of MATH_SUBJECTS) {
    if (rest.includes(kw)) {
      math = kw
      rest = rest.replace(kw, '').trim()
      break
    }
  }

  // X 처리 (국어가 X인 경우)
  if (korean === 'X' && rest.startsWith('X')) {
    rest = rest.substring(1).trim()
  }
  if (math === 'X' && rest.startsWith('X')) {
    rest = rest.substring(1).trim()
  }

  return { korean, math, restAfterKorMath: rest }
}

/**
 * O/X 값 추출
 */
function extractOX(text) {
  const trimmed = text.trim()
  if (trimmed.startsWith('O')) {
    return { value: 'O', rest: trimmed.substring(1).trim() }
  }
  if (trimmed.startsWith('X')) {
    return { value: 'X', rest: trimmed.substring(1).trim() }
  }
  return { value: 'X', rest: trimmed }
}

/**
 * 탐구 유형 추출 (줄바꿈 정규화 처리 포함)
 */
function extractInquiryType(text) {
  // 줄바꿈/공백 정규화
  const normalized = text.replace(/\s+/g, ' ').trim()

  for (const type of INQUIRY_TYPES) {
    const cleanType = type.replace(/\s+/g, '')
    const cleanNorm = normalized.replace(/\s+/g, '')
    const idx = cleanNorm.indexOf(cleanType)
    if (idx !== -1) {
      // 원본 텍스트에서 해당 부분 제거
      const rest = removeFirstOccurrence(normalized, type)
      return { inquiryType: type, rest }
    }
  }

  return { inquiryType: 'X', rest: normalized }
}

/**
 * 탐구 선택과목 추출 (예: '생활과 윤리 / 세계사', '사회·문화 / X')
 */
function extractInquirySubjects(text) {
  const trimmed = text.trim()
  
  // '/' 로 구분된 2개 과목 패턴 찾기
  const slashMatch = trimmed.match(/^(.+?)\s*\/\s*(.+?)(?:\s+(.*))?$/)
  if (slashMatch) {
    const sub1 = slashMatch[1].trim()
    const sub2 = slashMatch[2].trim()
    // sub2에서 제2외국어 후보를 분리해야 할 수 있음
    const foreignCandidates = ['일본어I', '중국어I', '프랑스어I', '스페인어I', '독일어I', '러시아어I', '아랍어I', '베트남어I', '한문I']
    
    let actualSub2 = sub2
    let restText = slashMatch[3] || ''
    
    for (const fc of foreignCandidates) {
      if (sub2.includes(fc) && sub2 !== fc) {
        actualSub2 = sub2.replace(fc, '').trim()
        restText = fc + ' ' + restText
        break
      }
    }
    
    return {
      subjects: `${sub1} / ${actualSub2}`,
      rest: restText.trim()
    }
  }

  // X / X 패턴
  if (trimmed.startsWith('X') || trimmed === '') {
    return { subjects: 'X / X', rest: trimmed.replace(/^X\s*\/?\s*X?\s*/, '').trim() }
  }

  return { subjects: trimmed, rest: '' }
}

/**
 * 제2외국어/한문 정리
 */
function cleanForeignLanguage(text) {
  const trimmed = text.trim()
  if (!trimmed || trimmed === 'X' || trimmed === '-') return 'X'
  return trimmed
}

/**
 * 문자열에서 첫 번째 발생 키워드를 제거
 */
function removeFirstOccurrence(text, keyword) {
  const idx = text.indexOf(keyword)
  if (idx === -1) {
    // 공백 제거 후 재시도
    const cleanKw = keyword.replace(/\s+/g, '')
    let result = text
    let pos = 0
    let matchStart = -1
    let matchLen = 0
    
    for (let i = 0; i < cleanKw.length; i++) {
      while (pos < result.length && result[pos] === ' ') pos++
      if (pos < result.length && result[pos] === cleanKw[i]) {
        if (matchStart === -1) matchStart = pos
        pos++
        matchLen = pos - matchStart
      } else {
        return result
      }
    }
    
    if (matchStart !== -1) {
      return (result.substring(0, matchStart) + result.substring(matchStart + matchLen)).trim()
    }
    return result
  }
  return (text.substring(0, idx) + text.substring(idx + keyword.length)).trim()
}

/**
 * 파싱 결과 통계 계산
 */
function computeStats(records) {
  const total = records.length
  const enrolled = records.filter(r => r.is_enrolled)
  const graduated = records.filter(r => !r.is_enrolled)

  // 반별 인원수 (재학생)
  const classCounts = {}
  for (const r of enrolled) {
    const c = r.class_or_grad_year
    classCounts[c] = (classCounts[c] || 0) + 1
  }

  // 졸업연도별 인원수
  const gradYearCounts = {}
  for (const r of graduated) {
    const y = r.class_or_grad_year
    gradYearCounts[y] = (gradYearCounts[y] || 0) + 1
  }

  // 국어 선택과목 분포
  const koreanDist = {}
  for (const r of records) {
    koreanDist[r.subject_korean] = (koreanDist[r.subject_korean] || 0) + 1
  }

  // 수학 선택과목 분포
  const mathDist = {}
  for (const r of records) {
    mathDist[r.subject_math] = (mathDist[r.subject_math] || 0) + 1
  }

  // 탐구 유형 분포
  const inquiryDist = {}
  for (const r of records) {
    inquiryDist[r.inquiry_type] = (inquiryDist[r.inquiry_type] || 0) + 1
  }

  return {
    total,
    enrolledCount: enrolled.length,
    graduatedCount: graduated.length,
    classCounts,
    gradYearCounts,
    koreanDist,
    mathDist,
    inquiryDist
  }
}
