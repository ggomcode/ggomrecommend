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
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
}

// 국어 과목 키워드 (현행 선택과목 및 2028+ 통합형 공통 국어)
const KOREAN_SUBJECTS = ['화법과 작문', '언어와 매체', '공통', '국어']
// 수학 과목 키워드 (현행 선택과목 및 2028+ 통합형 공통 수학)
const MATH_SUBJECTS = ['확률과 통계', '미적분', '기하', '공통', '수학']
// 탐구 유형 키워드 (현행 선택형 및 2028+ 통합사회·통합과학) - 긴 것부터 매칭
const INQUIRY_TYPES = [
  '통합사회·통합과학', '통합사회/통합과학', '통합사회', '통합과학',
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
  let pdf = null
  try {
    pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true
    }).promise
  } catch (err) {
    console.warn('PDF getDocument with cMaps failed, retrying simple getDocument:', err)
    pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  }

  const totalPages = pdf.numPages
  console.log(`[CSAT Parser] PDF 로드 완료: 총 ${totalPages}페이지`)

  let batchTime = null
  const allRecords = []

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1.0 })
    const textContent = await page.getTextContent()
    const items = textContent.items

    console.log(`[CSAT Parser] 페이지 ${pageNum}: items=${items.length}, rotation=${viewport.rotation}`)

    // ★ 핵심: 글자 단위 PDF → 단어 재조립 후 토큰 스트림 파싱
    const rowTexts = reassembleCharacters(items, viewport)
    if (pageNum === 1) {
      console.log('[CSAT Parser] 1페이지 재조립 행(처음 5줄):', rowTexts.slice(0, 5))
    }

    // 저장 일시 추출 (미발견 시 다음 페이지에서도 계속 탐색)
    if (!batchTime) {
      batchTime = extractBatchTime(rowTexts)
      if (batchTime) {
        console.log(`[CSAT Parser] PDF 저장일시 추출 성공: ${batchTime}`)
      }
    }

    let pageRecords = parseRecordsFromReassembledRows(rowTexts)

    // 폴백: 재조립 실패 시 기존 토큰 스트림/행 클러스터링
    if (pageRecords.length === 0) {
      pageRecords = parseRecordsFromPageTokens(items, viewport)
    }
    if (pageRecords.length === 0) {
      const rows = groupTextItemsToRows(items, viewport)
      for (const row of rows) {
        const record = parseRecordFromRow(row)
        if (record) pageRecords.push(record)
      }
    }

    console.log(`[CSAT Parser] ${pageNum}/${totalPages}페이지: ${pageRecords.length}명`)
    allRecords.push(...pageRecords)
  }

  // 중복 접수번호 제거 (혹시 모를 중복 방지)
  const uniqueMap = new Map()
  for (const r of allRecords) {
    if (!uniqueMap.has(r.receipt_no)) {
      uniqueMap.set(r.receipt_no, r)
    }
  }
  const finalRecords = [...uniqueMap.values()]

  // 통계 계산
  const stats = computeStats(finalRecords)
  console.log(`[CSAT Parser] 파싱 완료: 총 ${finalRecords.length}명 (재학생: ${stats.enrolledCount}명, 졸업생: ${stats.graduatedCount}명), PDF 저장일시: ${batchTime || '미추출'}`)

  return {
    records: finalRecords,
    batchTime,
    stats,
    totalCount: stats.total,
    enrolledCount: stats.enrolledCount,
    gradCount: stats.graduatedCount
  }
}

/**
 * 재조립된 행 텍스트들에서 PDF 저장/출력 일시(예: 2026-09-01 16:03:00)를 추출
 */
function extractBatchTime(rowTexts) {
  if (!rowTexts || rowTexts.length === 0) return null
  for (const text of rowTexts) {
    // 1. 표준 YYYY-MM-DD HH:mm:ss 또는 YYYY.MM.DD HH:mm:ss
    const m1 = text.match(/(\d{4}[-./]\d{1,2}[-./]\d{1,2})\s+(\d{1,2}:\d{2}:\d{2})/)
    if (m1) {
      const datePart = m1[1].replace(/[./]/g, '-')
      return `${datePart} ${m1[2]}`
    }

    // 2. YYYY-MM-DD HH:mm (초 생략)
    const m2 = text.match(/(\d{4}[-./]\d{1,2}[-./]\d{1,2})\s+(\d{1,2}:\d{2})/)
    if (m2) {
      const datePart = m2[1].replace(/[./]/g, '-')
      return `${datePart} ${m2[2]}:00`
    }

    // 3. 공백 없이 붙은 경우 (예: 2026-09-0116:03:00)
    const m3 = text.match(/(\d{4}[-./]\d{1,2}[-./]\d{1,2})(\d{2}:\d{2}(?::\d{2})?)/)
    if (m3) {
      const datePart = m3[1].replace(/[./]/g, '-')
      const timePart = m3[2].length === 5 ? `${m3[2]}:00` : m3[2]
      return `${datePart} ${timePart}`
    }
  }
  return null
}

/**
 * ★ 핵심 함수: 글자 단위(character-level) PDF의 개별 문자 아이템들을
 *   X좌표 근접성 기반으로 단어/토큰으로 재조립합니다.
 *   정부 시스템 PDF(수능접수시스템 등)는 각 글자를 별도 텍스트 아이템으로 출력하므로 필수.
 * @returns {string[]} 재조립된 행 텍스트 배열 (상단→하단 순서)
 */
function reassembleCharacters(items, viewport) {
  if (!items || items.length === 0) return []

  const charItems = []
  for (const item of items) {
    if (item.str === undefined || item.str === null) continue
    if (item.str.length === 0) continue

    const tx = item.transform[4]
    const ty = item.transform[5]
    let screenX = tx
    let screenY = ty
    if (viewport && typeof viewport.convertToViewportPoint === 'function') {
      const pt = viewport.convertToViewportPoint(tx, ty)
      screenX = pt[0]
      screenY = pt[1]
    }

    // 폰트 크기 추출 (transform 매트릭스에서)
    const fontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 10

    charItems.push({
      str: item.str,
      x: screenX,
      y: screenY,
      width: item.width || 0,
      fontSize
    })
  }

  // Y좌표 기준 정렬 (상단→하단), 같은 행이면 X 기준 (좌→우)
  charItems.sort((a, b) => {
    if (Math.abs(a.y - b.y) <= 4) return a.x - b.x
    return a.y - b.y
  })

  // Y좌표 클러스터링으로 행 그룹핑 (tolerance 5pt)
  const rows = []
  const yTol = 5
  for (const ch of charItems) {
    let matched = null
    for (const r of rows) {
      if (Math.abs(r.avgY - ch.y) <= yTol) {
        matched = r
        break
      }
    }
    if (matched) {
      matched.items.push(ch)
      matched.avgY = (matched.avgY * (matched.items.length - 1) + ch.y) / matched.items.length
    } else {
      rows.push({ avgY: ch.y, items: [ch] })
    }
  }

  // 각 행 내에서 인접 문자를 단어로 병합
  const result = []
  for (const row of rows.sort((a, b) => a.avgY - b.avgY)) {
    const sorted = row.items.sort((a, b) => a.x - b.x)
    let text = ''

    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        const prev = sorted[i - 1]
        const curr = sorted[i]

        // 이전 아이템의 유효 너비 계산
        let prevWidth = prev.width
        if (!prevWidth || prevWidth <= 0.1) {
          // 폰트 크기 기반 추정: CJK ≈ fontSize, 숫자/영문 ≈ fontSize * 0.6
          const ch = prev.str
          if (ch.length === 1 && ch.charCodeAt(0) > 0x2E80) {
            prevWidth = prev.fontSize * 0.95
          } else if (ch === ' ') {
            prevWidth = prev.fontSize * 0.25
          } else {
            prevWidth = prev.str.length * prev.fontSize * 0.55
          }
        }

        // 실질 간격 = 다음 문자 X위치 - (이전 문자 X위치 + 이전 문자 너비)
        const gap = curr.x - (prev.x + prevWidth)

        // 간격이 폰트 크기의 30% 이상이면 단어/컬럼 경계 → 공백 삽입
        if (gap > Math.max(3, prev.fontSize * 0.3)) {
          text += ' '
        }
      }
      text += sorted[i].str
    }

    const trimmed = text.trim()
    if (trimmed) result.push(trimmed)
  }

  return result
}

/**
 * 재조립된 행 텍스트에서 [일련번호, 접수번호] 경계 기준으로 레코드 추출
 */
function parseRecordsFromReassembledRows(rowTexts) {
  if (!rowTexts || rowTexts.length === 0) return []

  // 전체 행을 하나의 토큰 스트림으로 평탄화
  const allTokens = []
  for (const rowText of rowTexts) {
    const tokens = rowText.split(/\s+/).filter(Boolean)
    allTokens.push(...tokens)
  }

  // [연번(1~4자리), 접수번호(5~8자리)] 시작 인덱스 탐색
  const markers = []
  for (let i = 0; i < allTokens.length - 1; i++) {
    const t1 = allTokens[i]
    const t2 = allTokens[i + 1]
    if (/^\d{1,4}$/.test(t1) && /^\d{5,8}$/.test(t2)) {
      const seqNo = parseInt(t1, 10)
      if (seqNo >= 1 && seqNo <= 9999) {
        markers.push({ idx: i, seqNo, receiptNo: t2 })
      }
    }
  }

  if (markers.length === 0) return []

  const records = []
  for (let m = 0; m < markers.length; m++) {
    const current = markers[m]
    const nextIdx = (m < markers.length - 1) ? markers[m + 1].idx : allTokens.length
    const columns = allTokens.slice(current.idx + 2, nextIdx)
    const rec = parseColumnsFromTokens(current.seqNo, current.receiptNo, columns)
    if (rec) records.push(rec)
  }

  return records
}

/**
 * 페이지 내 전체 텍스트 토큰 스트림에서 [일련번호, 접수번호] 경계 기준으로 레코드 추출
 */
function parseRecordsFromPageTokens(items, viewport) {
  if (!items || items.length === 0) return []

  // 1. 뷰포트 시각 좌표 변환 및 상->하, 좌->우 정렬
  const validItems = []
  for (const item of items) {
    if (!item.str || item.str.trim().length === 0) continue
    const tx = item.transform[4]
    const ty = item.transform[5]
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
      y: screenY
    })
  }

  // 상단->하단 (Y), 동일 라인 좌측->우측 (X) 정렬
  validItems.sort((a, b) => {
    if (Math.abs(a.y - b.y) <= 4) {
      return a.x - b.x
    }
    return a.y - b.y
  })

  // 전체 토큰 평탄화
  const allTokens = []
  for (const it of validItems) {
    const parts = it.text.split(/\s+/).filter(Boolean)
    allTokens.push(...parts)
  }

  // [연번(1~9999), 접수번호(5~8자리)] 시작 인덱스 탐색
  const markers = []
  for (let i = 0; i < allTokens.length - 1; i++) {
    const t1 = allTokens[i]
    const t2 = allTokens[i + 1]
    if (/^\d{1,4}$/.test(t1) && /^\d{5,8}$/.test(t2)) {
      const seqNo = parseInt(t1, 10)
      if (seqNo >= 1 && seqNo <= 9999) {
        markers.push({ idx: i, seqNo, receiptNo: t2 })
      }
    }
  }

  if (markers.length === 0) return []

  const records = []
  for (let m = 0; m < markers.length; m++) {
    const current = markers[m]
    const nextIdx = (m < markers.length - 1) ? markers[m + 1].idx : allTokens.length
    const recordTokens = allTokens.slice(current.idx, nextIdx)
    
    const columns = recordTokens.slice(2)
    const rec = parseColumnsFromTokens(current.seqNo, current.receiptNo, columns)
    if (rec) {
      records.push(rec)
    }
  }

  return records
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

  // 일련번호와 접수번호 위치 동적 탐색 (앞쪽 5개 토큰 내에서 검색)
  let startIdx = -1
  let seqNo = null
  let receiptNo = null

  for (let i = 0; i < Math.min(tokens.length - 1, 5); i++) {
    if (/^\d{1,4}$/.test(tokens[i]) && /^\d{5,8}$/.test(tokens[i + 1])) {
      const sNum = parseInt(tokens[i], 10)
      if (sNum >= 1 && sNum <= 9999) {
        startIdx = i
        seqNo = sNum
        receiptNo = tokens[i + 1]
        break
      }
    }
  }

  if (startIdx === -1) return null

  // 나머지 토큰들로 14개 컬럼 데이터 파싱
  return parseColumnsFromTokens(seqNo, receiptNo, tokens.slice(startIdx + 2))
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
  if (!trimmed || trimmed === 'X' || /^[Xx×✕\s\d\-/]+$/.test(trimmed)) {
    subjects = 'X / X'
  } else if (trimmed.includes('/')) {
    const parts = trimmed.split('/').map(p => p.trim())
    const sub1 = parts[0] || 'X'
    const sub2 = parts[1] || 'X'
    subjects = `${sub1} / ${sub2}`
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
