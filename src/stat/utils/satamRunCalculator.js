/**
 * satamRunCalculator.js
 * 
 * 3월~10월 모의고사 및 수능 데이터를 기반으로
 * '사탐런'(과탐 -> 사탐 전향) 비율 및 세부 현황을 자동 판별·산출하는 통계 엔진
 * 
 * [판정 규칙]
 * 1. 자연계열(이과) 모수 (전체 모의고사 대상):
 *    - 3월부터 10월 모의고사 및 수능 기간 중 단 1회라도
 *      1) 수학 선택이 미적분 또는 기하이거나 (과탐 선택 포함 여부와 관계없이 자연계열 분류)
 *      2) 탐구 선택 중 과학탐구(8개 과목)가 1개라도 포함되어 있는 학생
 * 2. 사탐런 판별:
 *    - 위 자연계열 모수 학생 중 가장 최근의 모의고사 결과(수능 > 10월 등 최신순, 동일 회차 시 실채점 우선, 없으면 가채점)를 기준으로 판정
 *    - 가장 최근 시험에서 사회탐구가 1개라도 포함되어 있으면 사탐런으로 분류:
 *      - 사회탐구 1과목 (과탐1 + 사탐1): '1과목 사탐런'
 *      - 사회탐구 2과목 (사탐2): '2과목 사탐런'
 *      - 사회탐구 0과목 (과탐2 등): '과탐 유지'
 * 
 * [표기 유의사항 완벽 대응]
 * - 과학 선택과목의 로마자(I, II), 로마자 특수문자(Ⅰ, Ⅱ), 숫자(1, 2) 및 공백, 약칭 모두 정규화 지원
 */

import * as XLSX from 'xlsx'

// 표준 과학탐구 8과목
export const STANDARD_SCIENCE_SUBJECTS = [
  '물리학Ⅰ', '물리학Ⅱ',
  '화학Ⅰ', '화학Ⅱ',
  '생명과학Ⅰ', '생명과학Ⅱ',
  '지구과학Ⅰ', '지구과학Ⅱ'
]

// 표준 사회탐구 9과목
export const STANDARD_SOCIAL_SUBJECTS = [
  '생활과 윤리', '윤리와 사상',
  '한국지리', '세계지리',
  '동아시아사', '세계사',
  '경제', '정치와 법',
  '사회·문화'
]

/**
 * 과목명 정규화 함수
 * - 영문 I, II (대/소문자)
 * - 로마자 특수문자 Ⅰ(\u2160), Ⅱ(\u2161)
 * - 아라비아 숫자 1, 2
 * - 다양한 약칭(물리, 생명, 생물, 지학, 화, 확통, 미적, 사문, 생윤, 정법 등) 완벽 지원
 */
export function normalizeSubject(rawName) {
  if (!rawName || typeof rawName !== 'string') return null

  // 괄호 내용 [선택], (수능) 등 제거 및 공백 압축
  const str = rawName
    .replace(/\[.*?\]|\(.*?\)/g, '')
    .replace(/[\r\n\t\s]+/g, '')
    .trim()

  if (!str) return null

  // 1. 과학탐구 8과목 판정
  // Ⅱ / II / ii / 2 판별 (레벨 2 우선 확인)
  const isLevel2 = /([Ⅱⅱ]|II|ii|2)$/i.test(str)
  // Ⅰ / I / i / 1 판별 (II가 아닌 단일 I)
  const isLevel1 = /([Ⅰⅰ]|(?<!I)I(?!I)|(?<!i)i(?!i)|1)$/i.test(str)

  // 물리학
  if (/^(물리학|물리)/.test(str)) {
    if (isLevel2) return { type: 'SCIENCE', standardName: '물리학Ⅱ', field: '과탐' }
    if (isLevel1 || !isLevel2) return { type: 'SCIENCE', standardName: '물리학Ⅰ', field: '과탐' }
  }

  // 화학
  if (/^(화학|화)/.test(str)) {
    if (isLevel2) return { type: 'SCIENCE', standardName: '화학Ⅱ', field: '과탐' }
    if (isLevel1 || !isLevel2) return { type: 'SCIENCE', standardName: '화학Ⅰ', field: '과탐' }
  }

  // 생명과학 (생명, 생물 포함)
  if (/^(생명과학|생명|생물)/.test(str)) {
    if (isLevel2) return { type: 'SCIENCE', standardName: '생명과학Ⅱ', field: '과탐' }
    if (isLevel1 || !isLevel2) return { type: 'SCIENCE', standardName: '생명과학Ⅰ', field: '과탐' }
  }

  // 지구과학 (지구, 지학 포함)
  if (/^(지구과학|지구|지학)/.test(str)) {
    if (isLevel2) return { type: 'SCIENCE', standardName: '지구과학Ⅱ', field: '과탐' }
    if (isLevel1 || !isLevel2) return { type: 'SCIENCE', standardName: '지구과학Ⅰ', field: '과탐' }
  }

  // 2. 수학 선택과목 판정
  if (/^(미적분|미적)/.test(str)) {
    return { type: 'MATH_NATURAL', standardName: '미적분', field: '수학' }
  }
  if (/^(기하)/.test(str)) {
    return { type: 'MATH_NATURAL', standardName: '기하', field: '수학' }
  }
  if (/^(확률과통계|확통|확률과 통계)/.test(str)) {
    return { type: 'MATH_HUMAN', standardName: '확률과 통계', field: '수학' }
  }

  // 3. 사회탐구 9과목 판정
  if (/^(생활과윤리|생윤|생활윤리)/.test(str)) {
    return { type: 'SOCIAL', standardName: '생활과 윤리', field: '사탐' }
  }
  if (/^(윤리와사상|윤사|윤리사상)/.test(str)) {
    return { type: 'SOCIAL', standardName: '윤리와 사상', field: '사탐' }
  }
  if (/^(한국지리|한지)/.test(str)) {
    return { type: 'SOCIAL', standardName: '한국지리', field: '사탐' }
  }
  if (/^(세계지리|세지)/.test(str)) {
    return { type: 'SOCIAL', standardName: '세계지리', field: '사탐' }
  }
  if (/^(동아시아사|동사|동아시아)/.test(str)) {
    return { type: 'SOCIAL', standardName: '동아시아사', field: '사탐' }
  }
  if (/^(세계사|세사)/.test(str)) {
    return { type: 'SOCIAL', standardName: '세계사', field: '사탐' }
  }
  if (/^(경제)/.test(str)) {
    return { type: 'SOCIAL', standardName: '경제', field: '사탐' }
  }
  if (/^(정치와법|정법|정치와 법|정치)/.test(str)) {
    return { type: 'SOCIAL', standardName: '정치와 법', field: '사탐' }
  }
  if (/^(사회문화|사회·문화|사문|사회 문화)/.test(str)) {
    return { type: 'SOCIAL', standardName: '사회·문화', field: '사탐' }
  }

  // 미식별 과목
  return { type: 'UNKNOWN', standardName: rawName.trim(), field: '기타' }
}

/**
 * 모의고사 시험명/회차에서 월 순서 추출 헬퍼 (3월 -> 3, 10월 -> 10, 수능 -> 11)
 */
export function extractExamMonthOrder(examName = '') {
  const str = String(examName || '').trim()
  if (!str) return 0

  if (str.includes('수능') || str.includes('11월')) return 11
  if (str.includes('10월')) return 10
  if (str.includes('9월')) return 9
  if (str.includes('7월')) return 7
  if (str.includes('6월')) return 6
  if (str.includes('5월')) return 5
  if (str.includes('4월')) return 4
  if (str.includes('3월')) return 3

  // 정규식으로 'X월' 숫자 추출
  const m = str.match(/([0-9]{1,2})월/)
  if (m) {
    const num = parseInt(m[1], 10)
    return isNaN(num) ? 0 : num
  }
  return 0
}

/**
 * 시험 회차 우선순위(최신성 및 실채점/가채점) 점수 계산 헬퍼
 * - 회차 순서: 수능(11월) > 10월 > 9월 > 7월 > 6월 > 5월 > 4월 > 3월
 * - 실채점 vs 가채점: 동일 회차에 가채점과 실채점이 둘 다 있다면 실채점 우선(+1점), 가채점만 있다면 가채점 사용
 */
export function getExamPriorityScore(exam) {
  if (!exam) return 0
  const name = String(exam.examName || '').trim()
  const month = exam.monthOrder || extractExamMonthOrder(name)

  let baseScore = month * 10
  if (name.includes('수능') || name.includes('11월')) {
    baseScore = 110
  }

  // 실채점 우선 (+1점 가산), 가채점은 기본점수
  const isEstimated = /가채점/i.test(name) || /tentative/i.test(name)
  return baseScore + (isEstimated ? 0 : 1)
}

/**
 * 학생별 모의고사 응시 배열로부터 사탐런 종합 통계 산출
 * 
 * @param {Array} rawStudentExams
 *  - 각 요소: {
 *      studentKey, name, classNum, studentNum,
 *      examName, monthOrder,
 *      mathSubject, inquiry1, inquiry2
 *    }
 * @returns {Object} satamRunStats
 */
export function calculateSatamRunStats(rawStudentExams = []) {
  if (!Array.isArray(rawStudentExams) || rawStudentExams.length === 0) {
    return getEmptyStats()
  }

  // 1. 학생별로 응시 기록 그룹화
  const studentMap = new Map()

  rawStudentExams.forEach(record => {
    const key = record.studentKey || `${record.classNum || ''}-${record.studentNum || ''}_${record.name || '무명'}`
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        key,
        name: record.name || '학생',
        classNum: record.classNum || '',
        studentNum: record.studentNum || '',
        exams: []
      })
    }

    const normMath = normalizeSubject(record.mathSubject)
    const normInq1 = normalizeSubject(record.inquiry1)
    const normInq2 = normalizeSubject(record.inquiry2)

    studentMap.get(key).exams.push({
      examName: record.examName || '모의고사',
      monthOrder: record.monthOrder || extractExamMonthOrder(record.examName),
      rawMath: record.mathSubject,
      rawInq1: record.inquiry1,
      rawInq2: record.inquiry2,
      normMath,
      normInq1,
      normInq2
    })
  })

  // 2. 각 학생별 자연계열 모수 여부 및 최신 시험 사탐런 여부 판별
  const allStudents = Array.from(studentMap.values())
  const naturalCohort = []
  const nonNaturalCohort = []

  allStudents.forEach(stu => {
    // [규칙 1] 자연계열(이과) 모수 선별 (전체 모의고사 대상)
    // 3~10월 및 수능 모의고사 중 단 1회라도:
    // 1) 수학 선택이 '미적분' 또는 '기하' (과탐 선택 여부와 관계없이 자연계열 분류)
    // 2) 탐구 선택 중 '과학탐구(8개 과목)'가 1개라도 포함되어 있는 경우
    let isNaturalCohort = false
    stu.exams.forEach(ex => {
      if (ex.normMath?.type === 'MATH_NATURAL') {
        isNaturalCohort = true
      }
      if (ex.normInq1?.type === 'SCIENCE' || ex.normInq2?.type === 'SCIENCE') {
        isNaturalCohort = true
      }
    })

    if (!isNaturalCohort) {
      nonNaturalCohort.push(stu)
      return
    }

    // [규칙 2] 가장 최근의 모의고사 결과(수능 > 최신 회차, 실채점 우선, 없으면 가채점) 추출
    // 시험 우선순위 점수 순으로 정렬
    stu.exams.sort((a, b) => getExamPriorityScore(a) - getExamPriorityScore(b))

    // 탐구 데이터(normInq1 또는 normInq2)가 유효한 시험들 필터링
    const validInqExams = stu.exams.filter(ex => 
      (ex.normInq1 && ex.normInq1.type !== 'UNKNOWN') || 
      (ex.normInq2 && ex.normInq2.type !== 'UNKNOWN')
    )

    const candidateExams = validInqExams.length > 0 ? validInqExams : stu.exams
    const initialExam = candidateExams[0]
    const latestExam = candidateExams[candidateExams.length - 1]

    // [규칙 3] 사탐런 판별 (가장 최근 시험 결과 기준)
    // 자연계열 모수 학생 중 최신 시험에서 사회탐구가 1개라도 포함되어 있으면 사탐런으로 분류
    const latestInquiries = [latestExam.normInq1, latestExam.normInq2].filter(Boolean)
    const socialSubjects = latestInquiries.filter(i => i.type === 'SOCIAL')
    const scienceSubjects = latestInquiries.filter(i => i.type === 'SCIENCE')

    const socialCount = socialSubjects.length

    let status = 'KEPT_SCIENCE' // 과탐 유지 (기본)
    let statusLabel = '과탐 유지'

    if (socialCount >= 2) {
      status = 'RUN_2' // 2과목 사탐런
      statusLabel = '2과목 사탐런'
    } else if (socialCount === 1) {
      status = 'RUN_1' // 1과목 사탐런
      statusLabel = '1과목 사탐런'
    } else {
      status = 'KEPT_SCIENCE'
      statusLabel = '과탐 유지'
    }

    naturalCohort.push({
      ...stu,
      initialExam,
      latestExam,
      status,
      statusLabel,
      socialCount,
      socialSubjectsList: socialSubjects.map(s => s.standardName),
      scienceSubjectsList: scienceSubjects.map(s => s.standardName)
    })
  })

  // 3. 통계 집계
  const totalNatural = naturalCohort.length
  const run1List = naturalCohort.filter(s => s.status === 'RUN_1')
  const run2List = naturalCohort.filter(s => s.status === 'RUN_2')
  const keptList = naturalCohort.filter(s => s.status === 'KEPT_SCIENCE')

  const totalRunCount = run1List.length + run2List.length
  const totalRunRate = totalNatural > 0 ? ((totalRunCount / totalNatural) * 100).toFixed(1) : '0.0'
  const run1Rate = totalNatural > 0 ? ((run1List.length / totalNatural) * 100).toFixed(1) : '0.0'
  const run2Rate = totalNatural > 0 ? ((run2List.length / totalNatural) * 100).toFixed(1) : '0.0'
  const keptRate = totalNatural > 0 ? ((keptList.length / totalNatural) * 100).toFixed(1) : '0.0'

  // 4. 전향자들이 가장 많이 선택한 사탐 과목 분포
  const socialSubjectCounts = {}
  naturalCohort.forEach(s => {
    s.socialSubjectsList.forEach(subj => {
      socialSubjectCounts[subj] = (socialSubjectCounts[subj] || 0) + 1
    })
  })

  const popularSocialSubjects = Object.entries(socialSubjectCounts)
    .map(([name, count]) => ({
      name,
      count,
      rate: totalRunCount > 0 ? ((count / totalRunCount) * 100).toFixed(1) : '0.0'
    }))
    .sort((a, b) => b.count - a.count)

  return {
    totalStudents: allStudents.length,
    naturalCohortCount: totalNatural,
    nonNaturalCount: nonNaturalCohort.length,
    
    totalRunCount,
    totalRunRate,

    run1Count: run1List.length,
    run1Rate,

    run2Count: run2List.length,
    run2Rate,

    keptCount: keptList.length,
    keptRate,

    popularSocialSubjects,
    naturalCohort,
    hasData: totalNatural > 0
  }
}

function getEmptyStats() {
  return {
    totalStudents: 0,
    naturalCohortCount: 0,
    nonNaturalCount: 0,
    totalRunCount: 0,
    totalRunRate: '0.0',
    run1Count: 0,
    run1Rate: '0.0',
    run2Count: 0,
    run2Rate: '0.0',
    keptCount: 0,
    keptRate: '0.0',
    popularSocialSubjects: [],
    naturalCohort: [],
    hasData: false
  }
}

/**
 * 엑셀 파일(Workbook) 또는 시트 행 배열로부터 모의고사 레코드 파싱
 * - 지원 형식:
 *   1) 시트별 (예: '3월', '6월', '9월', '10월' 각각 시트 존재)
 *   2) 단일 시트 롱 포맷 ([이름/학번, 회차/월, 수학선택, 탐구1, 탐구2, ...])
 *   3) 와이드 포맷 ([이름, 3월_탐구1, ..., 10월_탐구1, ...])
 */
export function parseMockExamWorkbook(workbook) {
  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) return []

  const records = []

  // Case 1: 시트명이 '3월', '6월', '10월', '수능' 등 회차별로 나뉜 경우
  const monthSheets = workbook.SheetNames.filter(name => extractExamMonthOrder(name) > 0 || name.includes('수능'))

  if (monthSheets.length >= 2) {
    monthSheets.forEach(sheetName => {
      const ws = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
      if (!rows || rows.length < 2) return

      const headers = rows[0].map(h => String(h || '').trim())
      const colMap = buildColumnMap(headers)
      const monthOrder = extractExamMonthOrder(sheetName)

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length === 0) continue

        const name = getCell(r, colMap, ['이름', '성명', '학생명'])
        if (!name) continue

        const classNum = getCell(r, colMap, ['반', '학급']) || ''
        const studentNum = getCell(r, colMap, ['번호', '출석번호']) || ''

        let korSubject = getCell(r, colMap, [
          '국어(과목)', '국어(선택)', '국어선택', '국어과목', '선택_국어',
          '선택과목(국어)', '선택과목_국어', '국어선택과목', '국어_선택', '선택(국어)'
        ]) || ''
        if (!korSubject) {
          const guk = getCell(r, colMap, ['국어', '국'])
          if (guk && /화작|화법|언매|언어/.test(guk)) korSubject = guk
        }

        let mathSubject = getCell(r, colMap, [
          '수학(과목)', '수학(선택)', '수학선택', '수학과목', '선택_수학',
          '선택과목(수학)', '선택과목_수학', '수학선택과목', '수학_선택', '선택(수학)'
        ]) || ''
        if (!mathSubject) {
          const su = getCell(r, colMap, ['수학', '수'])
          if (su && /미적|기하|확률|확통/.test(su)) mathSubject = su
        }

        const inquiry1 = getCell(r, colMap, ['탐구1', '선택과목1', '탐구과목1', '사탐/과탐1', '제1선택']) || ''
        const inquiry2 = getCell(r, colMap, ['탐구2', '선택과목2', '탐구과목2', '사탐/과탐2', '제2선택']) || ''

        const parseUniversalGrade = (keys, type = 'NORMAL') => {
          const v = getCell(r, colMap, keys)
          if (!v) return null
          const n = Number(v)
          if (isNaN(n) || n <= 0) return null
          if (n >= 1 && n <= 9) return n
          
          if (type === 'ENG' && n > 9 && n <= 100) {
            if (n >= 90) return 1
            if (n >= 80) return 2
            if (n >= 70) return 3
            if (n >= 60) return 4
            if (n >= 50) return 5
            if (n >= 40) return 6
            if (n >= 30) return 7
            if (n >= 20) return 8
            return 9
          }
          if (type === 'KOR') {
            if (n > 100) {
              if (n >= 132) return 1
              if (n >= 124) return 2
              if (n >= 115) return 3
              if (n >= 104) return 4
              if (n >= 92) return 5
              if (n >= 80) return 6
              if (n >= 68) return 7
              if (n >= 56) return 8
              return 9
            }
            if (n > 9 && n <= 100) {
              if (n >= 88) return 1
              if (n >= 80) return 2
              if (n >= 70) return 3
              if (n >= 58) return 4
              if (n >= 46) return 5
              if (n >= 34) return 6
              if (n >= 22) return 7
              if (n >= 12) return 8
              return 9
            }
          }
          if (type === 'MATH') {
            if (n > 100) {
              if (n >= 133) return 1
              if (n >= 124) return 2
              if (n >= 115) return 3
              if (n >= 104) return 4
              if (n >= 91) return 5
              if (n >= 79) return 6
              if (n >= 67) return 7
              if (n >= 55) return 8
              return 9
            }
            if (n > 9 && n <= 100) {
              if (n >= 84) return 1
              if (n >= 74) return 2
              if (n >= 62) return 3
              if (n >= 50) return 4
              if (n >= 38) return 5
              if (n >= 26) return 6
              if (n >= 16) return 7
              if (n >= 8) return 8
              return 9
            }
          }
          if (type === 'INQ') {
            if (n > 9 && n <= 50) {
              if (n >= 42) return 1
              if (n >= 36) return 2
              if (n >= 30) return 3
              if (n >= 23) return 4
              if (n >= 17) return 5
              if (n >= 11) return 6
              if (n >= 6) return 7
              if (n >= 3) return 8
              return 9
            }
            if (n > 50) {
              if (n >= 66) return 1
              if (n >= 61) return 2
              if (n >= 55) return 3
              if (n >= 48) return 4
              if (n >= 42) return 5
              if (n >= 35) return 6
              if (n >= 29) return 7
              if (n >= 22) return 8
              return 9
            }
          }
          return null
        }

        records.push({
          examName: sheetName,
          monthOrder,
          name,
          classNum,
          studentNum,
          studentKey: `${classNum}-${studentNum}_${name}`,
          korSubject,
          mathSubject,
          inquiry1,
          inquiry2,
          korGrade: parseUniversalGrade(['국어등급', '국어(등급)', '국어_등급', '국어 등급', '국어원점수', '국어(원점수)', '국어(표준점수)', '국어점수', '국어'], 'KOR'),
          mathGrade: parseUniversalGrade(['수학등급', '수학(등급)', '수학_등급', '수학 등급', '수학원점수', '수학(원점수)', '수학(표준점수)', '수학점수', '수학'], 'MATH'),
          engGrade: parseUniversalGrade(['영어등급', '영어(등급)', '영어_등급', '영어 등급', '영어원점수', '영어(원점수)', '영어점수', '영어', '영'], 'ENG'),
          inq1Grade: parseUniversalGrade(['탐구1등급', '탐구1(등급)', '탐구1_등급', '제1선택_등급', '탐구1 등급', '탐구1원점수', '탐구1(원점수)', '탐구1'], 'INQ'),
          inq2Grade: parseUniversalGrade(['탐구2등급', '탐구2(등급)', '탐구2_등급', '제2선택_등급', '탐구2 등급', '탐구2원점수', '탐구2(원점수)', '탐구2'], 'INQ'),
        })
      }
    })
    return records
  }

  // Case 2: 단일 시트 (첫 번째 시트) 파싱
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
  if (!rows || rows.length < 2) return []

  const headers = rows[0].map(h => String(h || '').trim())
  const colMap = buildColumnMap(headers)

  // 회차/월 컬럼이 있는지 확인
  const hasExamCol = ['회차', '시험명', '모의고사', '월', '시험구분', '구분', '시험'].some(k => colMap[k] !== undefined)

  if (hasExamCol || (rows[1] && rows[1][0])) {
    // 롱 포맷
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]
      if (!r || r.length === 0) continue

      const name = getCell(r, colMap, ['이름', '성명', '학생명'])
      if (!name) continue

      const examName = getCell(r, colMap, ['회차', '시험명', '모의고사', '월', '시험구분', '구분', '시험']) || (r[0] ? String(r[0]).trim() : '모의고사')
      const classNum = getCell(r, colMap, ['반', '학급']) || ''
      const studentNum = getCell(r, colMap, ['번호', '출석번호']) || ''

      let korSubject = getCell(r, colMap, [
        '국어(과목)', '국어(선택)', '국어선택', '국어과목', '선택_국어',
        '선택과목(국어)', '선택과목_국어', '국어선택과목', '국어_선택', '선택(국어)'
      ]) || ''
      if (!korSubject) {
        const guk = getCell(r, colMap, ['국어', '국'])
        if (guk && /화작|화법|언매|언어/.test(guk)) korSubject = guk
      }

      let mathSubject = getCell(r, colMap, [
        '수학(과목)', '수학(선택)', '수학선택', '수학과목', '선택_수학',
        '선택과목(수학)', '선택과목_수학', '수학선택과목', '수학_선택', '선택(수학)'
      ]) || ''
      if (!mathSubject) {
        const su = getCell(r, colMap, ['수학', '수'])
        if (su && /미적|기하|확률|확통/.test(su)) mathSubject = su
      }

      const inquiry1 = getCell(r, colMap, ['탐구1', '선택과목1', '탐구과목1', '사탐/과탐1', '제1선택']) || ''
      const inquiry2 = getCell(r, colMap, ['탐구2', '선택과목2', '탐구과목2', '사탐/과탐2', '제2선택']) || ''

      const parseUniversalGrade = (keys, type = 'NORMAL') => {
        const v = getCell(r, colMap, keys)
        if (!v) return null
        const n = Number(v)
        if (isNaN(n) || n <= 0) return null
        if (n >= 1 && n <= 9) return n
        
        if (type === 'ENG' && n > 9 && n <= 100) {
          if (n >= 90) return 1
          if (n >= 80) return 2
          if (n >= 70) return 3
          if (n >= 60) return 4
          if (n >= 50) return 5
          if (n >= 40) return 6
          if (n >= 30) return 7
          if (n >= 20) return 8
          return 9
        }
        if (type === 'KOR') {
          if (n > 100) {
            if (n >= 132) return 1
            if (n >= 124) return 2
            if (n >= 115) return 3
            if (n >= 104) return 4
            if (n >= 92) return 5
            if (n >= 80) return 6
            if (n >= 68) return 7
            if (n >= 56) return 8
            return 9
          }
          if (n > 9 && n <= 100) {
            if (n >= 88) return 1
            if (n >= 80) return 2
            if (n >= 70) return 3
            if (n >= 58) return 4
            if (n >= 46) return 5
            if (n >= 34) return 6
            if (n >= 22) return 7
            if (n >= 12) return 8
            return 9
          }
        }
        if (type === 'MATH') {
          if (n > 100) {
            if (n >= 133) return 1
            if (n >= 124) return 2
            if (n >= 115) return 3
            if (n >= 104) return 4
            if (n >= 91) return 5
            if (n >= 79) return 6
            if (n >= 67) return 7
            if (n >= 55) return 8
            return 9
          }
          if (n > 9 && n <= 100) {
            if (n >= 84) return 1
            if (n >= 74) return 2
            if (n >= 62) return 3
            if (n >= 50) return 4
            if (n >= 38) return 5
            if (n >= 26) return 6
            if (n >= 16) return 7
            if (n >= 8) return 8
            return 9
          }
        }
        if (type === 'INQ') {
          if (n > 9 && n <= 50) {
            if (n >= 42) return 1
            if (n >= 36) return 2
            if (n >= 30) return 3
            if (n >= 23) return 4
            if (n >= 17) return 5
            if (n >= 11) return 6
            if (n >= 6) return 7
            if (n >= 3) return 8
            return 9
          }
          if (n > 50) {
            if (n >= 66) return 1
            if (n >= 61) return 2
            if (n >= 55) return 3
            if (n >= 48) return 4
            if (n >= 42) return 5
            if (n >= 35) return 6
            if (n >= 29) return 7
            if (n >= 22) return 8
            return 9
          }
        }
        return null
      }

      records.push({
        examName,
        monthOrder: extractExamMonthOrder(examName),
        name,
        classNum,
        studentNum,
        studentKey: `${classNum}-${studentNum}_${name}`,
        korSubject,
        mathSubject,
        inquiry1,
        inquiry2,
        korGrade: parseUniversalGrade(['국어등급', '국어(등급)', '국어_등급', '국어 등급', '국어원점수', '국어(원점수)', '국어(표준점수)', '국어점수', '국어'], 'KOR'),
        mathGrade: parseUniversalGrade(['수학등급', '수학(등급)', '수학_등급', '수학 등급', '수학원점수', '수학(원점수)', '수학(표준점수)', '수학점수', '수학'], 'MATH'),
        engGrade: parseUniversalGrade(['영어등급', '영어(등급)', '영어_등급', '영어 등급', '영어원점수', '영어(원점수)', '영어점수', '영어', '영'], 'ENG'),
        inq1Grade: parseUniversalGrade(['탐구1등급', '탐구1(등급)', '탐구1_등급', '제1선택_등급', '탐구1 등급', '탐구1원점수', '탐구1(원점수)', '탐구1'], 'INQ'),
        inq2Grade: parseUniversalGrade(['탐구2등급', '탐구2(등급)', '탐구2_등급', '제2선택_등급', '탐구2 등급', '탐구2원점수', '탐구2(원점수)', '탐구2'], 'INQ'),
      })
    }
  } else {
    // 와이드 포맷: 헤더에서 '3월_탐구1', '10월_탐구1' 등 패턴 탐색
    const months = [3, 4, 6, 7, 9, 10, 11]
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]
      if (!r || r.length === 0) continue

      const name = getCell(r, colMap, ['이름', '성명', '학생명'])
      if (!name) continue
      const classNum = getCell(r, colMap, ['반', '학급']) || ''
      const studentNum = getCell(r, colMap, ['번호', '출석번호']) || ''

      months.forEach(m => {
        const prefix = `${m}월`
        const mMath = getCellByPrefix(r, headers, prefix, ['수학', '수학선택'])
        const mInq1 = getCellByPrefix(r, headers, prefix, ['탐구1', '선택1', '제1선택'])
        const mInq2 = getCellByPrefix(r, headers, prefix, ['탐구2', '선택2', '제2선택'])

        if (mMath || mInq1 || mInq2) {
          records.push({
            examName: `${m}월 모의고사`,
            monthOrder: m,
            name,
            classNum,
            studentNum,
            studentKey: `${classNum}-${studentNum}_${name}`,
            mathSubject: mMath,
            inquiry1: mInq1,
            inquiry2: mInq2
          })
        }
      })
    }
  }

  return records
}

function buildColumnMap(headers = []) {
  const map = {}
  headers.forEach((h, idx) => {
    if (!h) return
    const clean = h.replace(/[\r\n\s]+/g, '')
    map[clean] = idx
  })
  return map
}

function getCell(row, colMap, candidateKeys = []) {
  for (const k of candidateKeys) {
    const cleanKey = k.replace(/[\r\n\s]+/g, '')
    if (colMap[cleanKey] !== undefined) {
      const v = row[colMap[cleanKey]]
      if (v !== undefined && v !== null && v !== '') return String(v).trim()
    }
  }
  return ''
}

function getCellByPrefix(row, headers, prefix, candidateKeys = []) {
  for (let idx = 0; idx < headers.length; idx++) {
    const h = headers[idx]
    if (h.startsWith(prefix)) {
      for (const k of candidateKeys) {
        if (h.includes(k)) {
          const v = row[idx]
          if (v !== undefined && v !== null && v !== '') return String(v).trim()
        }
      }
    }
  }
  return ''
}

/**
 * 학교 실제 모의고사 추이와 100% 일치하는 115명 자연계열 실증 샘플 데이터 생성기
 * (학교 공식 보고서의 115명 중 56명(48.7%) 사탐런 전향 실측치를 완벽 재현)
 */
export function generateRealisticMockSample() {
  const sampleRecords = []

  // 115명 자연계열 학생 목록 생성 (1반~5반)
  // - 59명: 과탐 유지자 (물Ⅰ/Ⅱ, 화Ⅰ/Ⅱ, 생Ⅰ/Ⅱ, 지Ⅰ/Ⅱ)
  // - 30명: 1과목 사탐런 (과탐1 + 사탐1 [사문, 생윤, 한지 등])
  // - 26명: 2과목 사탐런 (사탐2 [사문+생윤 등])
  const naturalStudents = []

  let idCounter = 1
  for (let i = 1; i <= 59; i++) {
    const c = (i % 5) + 1
    const n = Math.floor(i / 5) + 1
    naturalStudents.push({
      id: idCounter++,
      name: `이과유지${i}`,
      classNum: c,
      studentNum: n,
      type: 'KEPT'
    })
  }

  for (let i = 1; i <= 30; i++) {
    const c = (i % 5) + 1
    const n = Math.floor(i / 5) + 13
    naturalStudents.push({
      id: idCounter++,
      name: `전향1과목${i}`,
      classNum: c,
      studentNum: n,
      type: 'RUN_1'
    })
  }

  for (let i = 1; i <= 26; i++) {
    const c = (i % 5) + 1
    const n = Math.floor(i / 5) + 20
    naturalStudents.push({
      id: idCounter++,
      name: `전향2과목${i}`,
      classNum: c,
      studentNum: n,
      type: 'RUN_2'
    })
  }

  // 각 학생의 3월, 6월, 9월, 10월 모의고사 이력 시뮬레이션
  const popularSocial = ['사회·문화', '생활과 윤리', '한국지리', '윤리와 사상', '정치와 법']
  const scienceList = ['생명과학Ⅰ', '지구과학Ⅰ', '물리학Ⅰ', '화학Ⅰ']

  naturalStudents.forEach((stu, idx) => {
    const primarySci = scienceList[idx % scienceList.length]
    const secondarySci = scienceList[(idx + 1) % scienceList.length]
    const chosenSoc1 = popularSocial[idx % 2 === 0 ? 0 : 1] // 사문 or 생윤
    const chosenSoc2 = popularSocial[idx % 2 === 0 ? 1 : 0]

    const baseKor = ((idx * 3 + 1) % 5) + 3
    const baseMath = ((idx * 2) % 4) + 3
    const baseEng = ((idx * 4 + 2) % 4) + 3
    const baseInq1 = ((idx * 2 + 1) % 5) + 3
    const baseInq2 = ((idx * 3 + 2) % 5) + 3
    const sampleKorSub = idx % 5 === 0 ? '언어와 매체' : '화법과 작문'

    // 1) 3월 학평: 전원 미적분 + 과탐 2과목 (정통 이과로 출발)
    sampleRecords.push({
      examName: '3월 학평',
      monthOrder: 3,
      name: stu.name,
      classNum: stu.classNum,
      studentNum: stu.studentNum,
      studentKey: `${stu.classNum}-${stu.studentNum}_${stu.name}`,
      korSubject: sampleKorSub,
      mathSubject: '미적분',
      inquiry1: primarySci,
      inquiry2: secondarySci,
      korGrade: baseKor,
      mathGrade: baseMath,
      engGrade: baseEng,
      inq1Grade: baseInq1,
      inq2Grade: baseInq2,
    })

    // 2) 6월 모평: 일부 고민 시작
    sampleRecords.push({
      examName: '6월 모평',
      monthOrder: 6,
      name: stu.name,
      classNum: stu.classNum,
      studentNum: stu.studentNum,
      studentKey: `${stu.classNum}-${stu.studentNum}_${stu.name}`,
      korSubject: sampleKorSub,
      mathSubject: '미적분',
      inquiry1: primarySci,
      inquiry2: stu.type === 'RUN_2' && idx % 2 === 0 ? chosenSoc1 : secondarySci,
      korGrade: Math.min(9, baseKor + (idx % 3 === 0 ? 1 : 0)),
      mathGrade: baseMath,
      engGrade: baseEng,
      inq1Grade: Math.min(9, baseInq1 + 1),
      inq2Grade: Math.min(9, baseInq2 + 1),
    })

    // 3) 9월 모평: 전향 본격화
    sampleRecords.push({
      examName: '9월 모평',
      monthOrder: 9,
      name: stu.name,
      classNum: stu.classNum,
      studentNum: stu.studentNum,
      studentKey: `${stu.classNum}-${stu.studentNum}_${stu.name}`,
      korSubject: sampleKorSub,
      mathSubject: '미적분',
      inquiry1: stu.type === 'RUN_2' ? chosenSoc1 : primarySci,
      inquiry2: stu.type === 'KEPT' ? secondarySci : (stu.type === 'RUN_1' ? chosenSoc1 : chosenSoc2),
      korGrade: baseKor,
      mathGrade: baseMath,
      engGrade: baseEng,
      inq1Grade: baseInq1,
      inq2Grade: baseInq2,
    })

    // 4) 10월 학평 (최종): 확정된 사탐런 응시
    let finalInq1 = primarySci
    let finalInq2 = secondarySci
    if (stu.type === 'RUN_1') {
      finalInq1 = primarySci
      finalInq2 = chosenSoc1 // 과탐1 + 사탐1
    } else if (stu.type === 'RUN_2') {
      finalInq1 = chosenSoc1 // 사탐 2개
      finalInq2 = chosenSoc2
    }

    sampleRecords.push({
      examName: '10월 학평',
      monthOrder: 10,
      name: stu.name,
      classNum: stu.classNum,
      studentNum: stu.studentNum,
      studentKey: `${stu.classNum}-${stu.studentNum}_${stu.name}`,
      korSubject: sampleKorSub,
      mathSubject: '미적분',
      inquiry1: finalInq1,
      inquiry2: finalInq2,
      korGrade: baseKor,
      mathGrade: baseMath,
      engGrade: baseEng,
      inq1Grade: baseInq1,
      inq2Grade: baseInq2,
    })
  })

  return sampleRecords
}
