/**
 * 대학수학능력시험 응시원서 접수대장 PDF 클라이언트 파서
 * - pdfjs-dist 기반 텍스트 추출 및 14개 컬럼 정밀 파싱
 * - Y좌표 클러스터링 기반 행 그룹핑 (경계값 분할 버그 완전 방지)
 * - 텍스트 토큰화 기반 다중 포맷 파싱 (공백 분리, 주민번호 마스킹, 기호 정규화)
 * - 1페이지 좌측 하단 저장 일시(YYYY-MM-DD HH:mm:ss) 및 전 페이지 다중 포맷 탐색
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
// 제2외국어/한문 후보 키워드 (아스키 I 및 유니코드 Ⅰ 모두 대응)
const FOREIGN_LANGUAGES = [
  '독일어I', '프랑스어I', '스페인어I', '중국어I', '일본어I', '러시아어I', '아랍어I', '베트남어I', '한문I',
  '독일어Ⅰ', '프랑스어Ⅰ', '스페인어Ⅰ', '중국어Ⅰ', '일본어Ⅰ', '러시아어Ⅰ', '아랍어Ⅰ', '베트남어Ⅰ', '한문Ⅰ'
]

/**
 * PDF 파일에서 접수대장 데이터를 파싱합니다.
 * @param {File} file - 업로드된 PDF File 객체
 * @returns {Promise<{ records: Array, batchTime: string, stats: object, totalCount: number, enrolledCount: number, gradCount: number }>}
 */
export async function parseCsatPdf(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const totalPages = pdf.numPages

  let batchTime = null
  const allRecords = []

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1.0 })
    const textContent = await page.getTextContent()
    const items = textContent.items

    // 저장 일시 추출 (미발견 시 다음 페이지에서도 계속 탐색)
    if (!batchTime) {
      batchTime = extractBatchTime(items, viewport)
    }

    // 텍스트 아이템을 뷰포트 시각 좌표(Visual Coordinate) 기준 Y좌표 클러스터링으로 행 그룹핑
    const rows = groupTextItemsToRows(items, viewport)

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
    stats,
    totalCount: stats.total,
    enrolledCount: stats.enrolledCount,
    gradCount: stats.graduatedCount
  }
}

/**
 * 텍스트 아이템들에서 저장 일시(YYYY-MM-DD HH:mm:ss 등) 추출
 * 날짜와 시각이 분리된 텍스트 아이템으로 추출되는 경우도 통합 대응
 */
function extractBatchTime(items, viewport) {
  if (!items || items.length === 0) return null

  const combinedRegex = /(\d{4}[-./]\d{1,2}[-./]\d{1,2})\s+(\d{1,2}:\d{2}(?::\d{2})?)/
  const dateOnlyRegex = /(\d{4}[-./]\d{1,2}[-./]\d{1,2})/
  const timeOnlyRegex = /(\d{1,2}:\d{2}(?::\d{2})?)/

  // 1. 단일 아이템 내에 일시가 모두 있는 경우
  for (const item of items) {
    const match = item.str.match(combinedRegex)
    if (match) {
      const normalizedDate = match[1].replace(/[./]/g, '-')
      const normalizedTime = match[2].length === 5 ? `${match[2]}:00` : match[2]
      return `${normalizedDate} ${normalizedTime}`
    }
  }

  // 2. 전체 텍스트에서 결합 검색
  const fullText = items.map(i => i.str).join(' ')
  const match = fullText.match(combinedRegex)
  if (match) {
    const normalizedDate = match[1].replace(/[./]/g, '-')
    const normalizedTime = match[2].length === 5 ? `${match[2]}:00` : match[2]
    return `${normalizedDate} ${normalizedTime}`
  }

  // 3. 하단 영역에서 날짜 아이템과 시각 아이템 분리 검색
  let foundDate = null
  let foundTime = null

  // 하단 텍스트(뷰포트 하단 20%) 우선 탐색
  for (const item of items) {
    const text = item.str.trim()
    if (!foundDate && dateOnlyRegex.test(text)) {
      const dMatch = text.match(dateOnlyRegex)
      // 기간(YYYY.MM.DD ~ YYYY.MM.DD)의 시작일이 아닌 하단 단독 날짜인지 확인
      if (!text.includes('~') && !text.includes('기간')) {
        foundDate = dMatch[1].replace(/[./]/g, '-')
      }
    }
    if (!foundTime && timeOnlyRegex.test(text)) {
      const tMatch = text.match(timeOnlyRegex)
      foundTime = tMatch[1].length === 5 ? `${tMatch[1]}:00` : tMatch[1]
    }
  }

  if (foundDate && foundTime) {
    return `${foundDate} ${foundTime}`
  }

  return null
}

/**
 * 텍스트 아이템을 뷰포트 시각 좌표계(Visual Coordinate) 기준으로 변환 후
 * Y좌표 클러스터링(Tolerance 6pt) 기반으로 행(row) 단위 그룹핑
 */
function groupTextItemsToRows(items, viewport) {
  if (!items || items.length === 0) return []

  const validItems = []
  for (const item of items) {
    if (!item.str || item.str.trim().length === 0) continue
    const tx = item.transform[4]
    const ty = item.transform[5]
    
    // PDF 회전 및 가로/세로 매트릭스에 관계없이 화면 기준 시각 좌표(x: 좌->우, y: 상->하)로 변환
    let screenX = tx
    let screenY = ty
    if (viewport && typeof viewport.convertToViewportPoint === 'function') {
      const pt = viewport.convertToViewportPoint(tx, ty)
      screenX = pt[0]
      screenY = pt[1]
    }

    validItems.push({
      text: item.str.trim(),
      x: screenX,
      y: screenY,
      width: item.width
    })
  }

  // 화면 상단(작은 screenY)부터 하단(큰 screenY)으로 정렬
  validItems.sort((a, b) => a.y - b.y)

  const rows = []
  const yTolerance = 6 // 동일 행 Y좌표 허용 오차 (point)

  for (const item of validItems) {
    // 기존 행 중 screenY가 yTolerance 이내인 행 탐색
    let matchedRow = null
    for (const r of rows) {
      if (Math.abs(r.avgY - item.y) <= yTolerance) {
        matchedRow = r
        break
      }
    }

    if (matchedRow) {
      matchedRow.items.push(item)
      // 평균 Y좌표 갱신
      matchedRow.avgY = (matchedRow.avgY * (matchedRow.items.length - 1) + item.y) / matchedRow.items.length
    } else {
      rows.push({
        avgY: item.y,
        items: [item]
      })
    }
  }

  // Y좌표 상->하 순서 유지 및 각 행 내부는 X좌표 좌->우(오름차순) 정렬
  return rows
    .sort((a, b) => a.avgY - b.avgY)
    .map(r => r.items.sort((a, b) => a.x - b.x))
}

/**
 * 단일 행에서 접수대장 데이터 레코드를 파싱합니다.
 * 일련번호로 시작하고 접수번호가 있는 행만 유효 레코드로 판정합니다.
 */
function parseRecordFromRow(rowItems) {
  if (!rowItems || rowItems.length === 0) return null

  // 행 내 텍스트들을 토큰 단위로 평탄화
  const tokens = []
  for (const item of rowItems) {
    const parts = item.text.split(/\s+/).filter(p => p.length > 0)
    tokens.push(...parts)
  }

  if (tokens.length < 3) return null

  // 첫 번째 토큰이 숫자(일련번호)인지 확인
  const firstToken = tokens[0]
  if (!/^\d+$/.test(firstToken)) return null
  const seqNo = parseInt(firstToken, 10)
  if (seqNo < 1 || seqNo > 9999) return null

  // 두 번째 토큰이 접수번호(5~8자리 숫자)인지 확인
  const secondToken = tokens[1]
  if (!/^\d{5,8}$/.test(secondToken)) return null
  const receiptNo = secondToken

  // 나머지 토큰들로 14개 컬럼 데이터 파싱
  return parseColumnsFromTokens(seqNo, receiptNo, tokens.slice(2))
}

/**
 * 일련번호, 접수번호 이후의 토큰 배열에서 14개 컬럼 데이터를 파싱
 */
function parseColumnsFromTokens(seqNo, receiptNo, tokens) {
  let idx = 0

  // 1. 성명 (한글 2~5자 또는 영문)
  const name = (tokens[idx] || '').trim()
  idx++

  // 2. 주민등록번호 (숫자, '-', 마스킹 '*' 등 지원)
  const residentParts = []
  while (idx < tokens.length) {
    const t = tokens[idx].trim()
    if (/^[\d*]{6}$/.test(t) || t === '-' || /^[\d*]{7}$/.test(t) || /^[\d*]{6}-[\d*]{7}$/.test(t) || /^[\d*]{13}$/.test(t)) {
      residentParts.push(t)
      idx++
      const joined = residentParts.join('')
      if (/[\d*]{6}-?[\d*]{7}/.test(joined) || /^[\d*]{13}$/.test(joined)) break
      if (residentParts.length >= 3) break
    } else {
      break
    }
  }

  let rawResident = residentParts.join('').replace(/\s+/g, '')
  if (rawResident.length === 13 && !rawResident.includes('-')) {
    rawResident = `${rawResident.slice(0, 6)}-${rawResident.slice(6)}`
  } else if (residentParts.length === 3 && residentParts[1] === '-') {
    rawResident = `${residentParts[0]}-${residentParts[2]}`
  } else if (!rawResident && idx < tokens.length) {
    rawResident = tokens[idx - 1] || ''
  }
  const residentNo = rawResident

  // 3. 성별 (남자/여자, 남/여)
  let gender = ''
  if (idx < tokens.length) {
    const gToken = tokens[idx]
    if (gToken === '남자' || gToken === '남') {
      gender = '남자'
      idx++
    } else if (gToken === '여자' || gToken === '여') {
      gender = '여자'
      idx++
    }
  }

  // 4. 반(년) - 숫자 (재학생: 학급번호 1~12, 졸업생: 졸업연도 2025 등)
  let classOrGradYear = 0
  if (idx < tokens.length && /^\d+$/.test(tokens[idx])) {
    classOrGradYear = parseInt(tokens[idx], 10)
    idx++
  }

  const isEnrolled = classOrGradYear < 1000

  // 5. 번호 - 재학생은 출석번호, 졸업생은 빈칸(null)
  let studentNo = null
  if (isEnrolled && idx < tokens.length && /^\d+$/.test(tokens[idx])) {
    studentNo = parseInt(tokens[idx], 10)
    idx++
  }

  // 재학생 학번 자동 생성 (3 + 반(2자리) + 번호(2자리))
  let studentCode = null
  if (isEnrolled && classOrGradYear > 0 && studentNo > 0) {
    studentCode = `3${String(classOrGradYear).padStart(2, '0')}${String(studentNo).padStart(2, '0')}`
  }

  // 6. 나머지 토큰들을 결합하여 교과목 선택 정보 파싱
  const remainingText = tokens.slice(idx).join(' ')

  // 국어/수학 파싱
  const { korean, math, restAfterKorMath } = parseKoreanMath(remainingText)

  // 영어 (O/X)
  const { value: english, rest: restAfterEng } = extractOX(restAfterKorMath)

  // 한국사 (O/X)
  const { value: history, rest: restAfterHist } = extractOX(restAfterEng)

  // 탐구 유형
  const { inquiryType, rest: restAfterInquiry } = extractInquiryType(restAfterHist)

  // 탐구 선택과목 & 제2외국어 분리
  const { subjects: inquirySubjects, foreignLanguage } = extractInquiryAndForeign(restAfterInquiry)

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
 * 국어/수학 과목 파싱 (텍스트가 붙어있거나 미응시 'X'인 경우 분리 처리)
 */
function parseKoreanMath(text) {
  let korean = 'X'
  let math = 'X'
  let rest = text.trim()

  // 1. 국어 키워드 매칭
  for (const kw of KOREAN_SUBJECTS) {
    if (rest.includes(kw)) {
      korean = kw
      rest = removeFirstOccurrence(rest, kw).trim()
      break
    }
  }

  // 국어가 미선택(X)인 경우
  if (korean === 'X' && /^[Xx×✕]/.test(rest)) {
    rest = rest.replace(/^[Xx×✕]\s*/, '').trim()
  }

  // 2. 수학 키워드 매칭
  for (const kw of MATH_SUBJECTS) {
    if (rest.includes(kw)) {
      math = kw
      rest = removeFirstOccurrence(rest, kw).trim()
      break
    }
  }

  // 수학이 미선택(X)인 경우
  if (math === 'X' && /^[Xx×✕]/.test(rest)) {
    rest = rest.replace(/^[Xx×✕]\s*/, '').trim()
  }

  return { korean, math, restAfterKorMath: rest }
}

/**
 * O/X 기호 추출 (원형 문자 ○, 엑스 문자 ×, ✕ 등 호환)
 */
function extractOX(text) {
  const trimmed = text.trim()
  if (/^[Oo○◯ㅇ0〇]/.test(trimmed)) {
    return { value: 'O', rest: trimmed.replace(/^[Oo○◯ㅇ0〇]\s*/, '').trim() }
  }
  if (/^[Xx×✕\-–—]/.test(trimmed)) {
    return { value: 'X', rest: trimmed.replace(/^[Xx×✕\-–—]\s*/, '').trim() }
  }
  return { value: 'X', rest: trimmed }
}

/**
 * 탐구 유형 추출 (줄바꿈 및 점·기호 정규화 처리)
 */
function extractInquiryType(text) {
  const normalized = text.replace(/\s+/g, ' ').trim()

  for (const type of INQUIRY_TYPES) {
    const cleanType = type.replace(/[\s·./]/g, '')
    const cleanNorm = normalized.replace(/[\s·./]/g, '')
    const idx = cleanNorm.indexOf(cleanType)
    if (idx !== -1) {
      const rest = removeFirstOccurrence(normalized, type)
      return { inquiryType: type, rest }
    }
  }

  return { inquiryType: 'X', rest: normalized }
}

/**
 * 탐구 선택과목 및 제2외국어 분리 추출
 */
function extractInquiryAndForeign(text) {
  let trimmed = text.trim()
  if (!trimmed || trimmed === 'X' || trimmed === 'X / X') {
    return { subjects: 'X / X', foreignLanguage: 'X' }
  }

  let foreignLanguage = 'X'

  // 뒤쪽에서 제2외국어 과목명 매칭 검사
  for (const fl of FOREIGN_LANGUAGES) {
    if (trimmed.endsWith(fl)) {
      foreignLanguage = fl
      trimmed = trimmed.substring(0, trimmed.length - fl.length).trim()
      break
    }
  }

  // 제2외국어가 'X' 또는 '-' 로 끝나는 경우
  if (foreignLanguage === 'X') {
    if (/[\s/]+[Xx×✕]$/.test(trimmed)) {
      foreignLanguage = 'X'
      trimmed = trimmed.replace(/[\s/]+[Xx×✕]$/, '').trim()
    } else if (/[\s/]+-$/.test(trimmed)) {
      foreignLanguage = 'X'
      trimmed = trimmed.replace(/[\s/]+-$/, '').trim()
    }
  }

  // 탐구 선택과목 형태 정리
  let subjects = trimmed
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/').map(p => p.trim())
    const sub1 = parts[0] || 'X'
    const sub2 = parts[1] || 'X'
    subjects = `${sub1} / ${sub2}`
  } else if (!trimmed || trimmed === 'X') {
    subjects = 'X / X'
  }

  return {
    subjects,
    foreignLanguage
  }
}

/**
 * 제2외국어/한문 정리
 */
function cleanForeignLanguage(text) {
  const trimmed = text.trim()
  if (!trimmed || trimmed === 'X' || trimmed === '-' || trimmed === 'x') return 'X'
  return trimmed
}

/**
 * 문자열에서 첫 번째 발생 키워드를 제거
 */
function removeFirstOccurrence(text, keyword) {
  const idx = text.indexOf(keyword)
  if (idx === -1) {
    const cleanKw = keyword.replace(/[\s·./]/g, '')
    let result = text
    let pos = 0
    let matchStart = -1
    let matchLen = 0

    for (let i = 0; i < cleanKw.length; i++) {
      while (pos < result.length && /[\s·./]/.test(result[pos])) pos++
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
