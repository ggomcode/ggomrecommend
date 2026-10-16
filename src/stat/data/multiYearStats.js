/**
 * 최근 5개년 (2023 ~ 2027학년도) 대교협 수시 지원 및 입결 비교 분석 데이터
 * 실제 데이터가 등록되지 않은 연도는 null로 보관하며, UI에서 '-'로 정직하게 표시합니다.
 */

export const MULTI_YEAR_STATS = {
  // 연도 목록 (오름차순)
  years: ['2023', '2024', '2025', '2026', '2027'],
  
  // 5개년 연도별 요약 데이터 (미등록 연도는 hasData: false 및 null 처리)
  byYear: {
    '2023': {
      year: 2023,
      academicYear: '2023학년도',
      hasData: false,
      totalStudents: 303,
      applicantStudents: null,
      applicantRate: null,
      totalApplications: null,
      avgAppsPerStudent: null,
      avgGrade: null,
      bestGrade: null,
      worstGrade: null,
      metroRate: null,
      nonMetroRate: null,
      topTierApps: null,
      topTierStudents: null,
      medicalApps: null,
      recommendationApps: null,
      ruralApps: null,
      finalPassRate: null,
      registerRate: null,
      gradeDistribution: null,
      admissionTypes: null
    },
    '2024': {
      year: 2024,
      academicYear: '2024학년도',
      hasData: false,
      totalStudents: 273,
      applicantStudents: null,
      applicantRate: null,
      totalApplications: null,
      avgAppsPerStudent: null,
      avgGrade: null,
      bestGrade: null,
      worstGrade: null,
      metroRate: null,
      nonMetroRate: null,
      topTierApps: null,
      topTierStudents: null,
      medicalApps: null,
      recommendationApps: null,
      ruralApps: null,
      finalPassRate: null,
      registerRate: null,
      gradeDistribution: null,
      admissionTypes: null
    },
    '2025': {
      year: 2025,
      academicYear: '2025학년도',
      hasData: false,
      totalStudents: 284,
      applicantStudents: null,
      applicantRate: null,
      totalApplications: null,
      avgAppsPerStudent: null,
      avgGrade: null,
      bestGrade: null,
      worstGrade: null,
      metroRate: null,
      nonMetroRate: null,
      topTierApps: null,
      topTierStudents: null,
      medicalApps: null,
      recommendationApps: null,
      ruralApps: null,
      finalPassRate: null,
      registerRate: null,
      gradeDistribution: null,
      admissionTypes: null
    },
    '2026': {
      year: 2026,
      academicYear: '2026학년도',
      hasData: true,
      totalStudents: 352,
      applicantStudents: 274,
      applicantRate: 77.8,
      totalApplications: 1488,
      avgAppsPerStudent: 5.43,
      avgGrade: 4.00,
      bestGrade: 1.00,
      worstGrade: 8.29,
      metroRate: 64.5,
      nonMetroRate: 35.5,
      topTierApps: 132,
      topTierStudents: 45,
      medicalApps: 17,
      recommendationApps: 72,
      ruralApps: 189,
      finalPassRate: 32.9,
      registerRate: 8.4,
      gradeDistribution: {
        '1~2등급': 88,
        '2~3등급': 260,
        '3~4등급': 407,
        '4~5등급': 387,
        '5~6등급': 227,
        '6등급이하': 109
      },
      admissionTypes: {
        '학생부교과': 714,
        '학생부종합': 566,
        '논술위주': 37,
        '실기/실적': 170
      }
    },
    '2027': {
      year: 2027,
      academicYear: '2027학년도',
      hasData: true,
      totalStudents: 334,
      applicantStudents: 246,
      applicantRate: 73.7,
      totalApplications: 1376,
      avgAppsPerStudent: 5.60,
      avgGrade: 4.40,
      bestGrade: 1.32,
      worstGrade: 8.41,
      metroRate: 61.4,
      nonMetroRate: 38.6,
      topTierApps: 87,
      topTierStudents: 31,
      medicalApps: 13,
      recommendationApps: 195,
      ruralApps: 276,
      finalPassRate: null, // 대입 전형 진행 중 (미발표 -> '-')
      registerRate: null,  // 미발표 -> '-'
      gradeDistribution: {
        '1~2등급': 74,
        '2~3등급': 201,
        '3~4등급': 364,
        '4~5등급': 408,
        '5~6등급': 238,
        '6등급이하': 91
      },
      admissionTypes: {
        '학생부교과': 652,
        '학생부종합': 508,
        '논술위주': 112,
        '실기/실적': 104
      }
    }
  },

  // 주요 대학군별 5개년 지원 건수 비교 데이터 (데이터 없는 연도는 null)
  targetUnivComparison: [
    {
      groupName: '설·포·연·고',
      note: '서울대, 포항공대, 연세대, 고려대',
      data: { '2023': null, '2024': null, '2025': null, '2026': 51, '2027': 38 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': 3.93, '2027': 1.90 }
    },
    {
      groupName: '서·성·한·이',
      note: '서강대, 성균관대, 한양대, 이화여대',
      data: { '2023': null, '2024': null, '2025': null, '2026': 75, '2027': 37 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': 2.73, '2027': 2.42 }
    },
    {
      groupName: '5대 과기원',
      note: 'KAIST, UNIST, DGIST, GIST, KENTECH',
      data: { '2023': null, '2024': null, '2025': null, '2026': 6, '2027': 12 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': 1.68, '2027': 2.15 }
    },
    {
      groupName: '의·치·한·약·수',
      note: '의학·치의학·한의학·약학·수의학',
      data: { '2023': null, '2024': null, '2025': null, '2026': 17, '2027': 13 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': 1.38, '2027': 1.52 }
    },
    {
      groupName: '수도권 주요 15개대',
      note: '중앙·경희·외대·시립·건국·동국·홍익 등',
      data: { '2023': null, '2024': null, '2025': null, '2026': 308, '2027': 162 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': 3.38, '2027': 2.86 }
    },
    {
      groupName: '경기권 거점/선호대',
      note: '아주대, 인하대, 경기대, 가천대, 단국대 등',
      data: { '2023': null, '2024': null, '2025': null, '2026': 318, '2027': 345 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': 4.07, '2027': 3.68 }
    }
  ]
}

/**
 * 대교협 수시 원서접수 raw applications 배열로부터 5개년 비교 통계용 연도별 요약 지표 자동 계산
 * @param {string|number} year 학년도 (예: '2025')
 * @param {Array} rows 파싱된 applications 행 배열
 * @param {number|null} totalStudents 기본통계 시트 기준 재학생 총원
 */
export function computeYearMultiYearStats(year, rows, totalStudents = null) {
  if (!rows || rows.length === 0) return null

  const studentKeys = new Set()
  let validGrades = []
  let metroCount = 0
  let recCount = 0
  let ruralCount = 0
  let finalPassCount = 0
  let registerCount = 0

  const types = { '학생부교과': 0, '학생부종합': 0, '논술위주': 0, '실기/실적': 0 }
  const bands = { '1~2등급': 0, '2~3등급': 0, '3~4등급': 0, '4~5등급': 0, '5~6등급': 0, '6등급이하': 0 }

  const g1Univs = ['서울대학교', '포항공과대학교', '포항공대', '포스텍', '연세대학교', '고려대학교']
  const g2Univs = ['서강대학교', '성균관대학교', '한양대학교', '이화여자대학교']
  const g3Univs = ['한국과학기술원', 'KAIST', '울산과학기술원', 'UNIST', '대구경북과학기술원', 'DGIST', '광주과학기술원', 'GIST', '한국에너지공과대학교', 'KENTECH']
  const g5Univs = ['중앙대학교', '경희대학교', '한국외국어대학교', '서울시립대학교', '건국대학교', '동국대학교', '홍익대학교', '숙명여자대학교', '국민대학교', '숭실대학교', '세종대학교', '단국대학교']
  const g6Univs = ['아주대학교', '인하대학교', '경기대학교', '가천대학교', '강남대학교', '명지대학교', '상명대학교', '수원대학교', '용인대학교']

  const targetStats = {
    '설·포·연·고': { count: 0, grades: [] },
    '서·성·한·이': { count: 0, grades: [] },
    '5대 과기원': { count: 0, grades: [] },
    '의·치·한·약·수': { count: 0, grades: [] },
    '수도권 주요 15개대': { count: 0, grades: [] },
    '경기권 거점/선호대': { count: 0, grades: [] }
  }

  const topTierStudentKeys = new Set()

  rows.forEach(r => {
    if (r.studentKey) studentKeys.add(r.studentKey)
    else if (r.name) studentKeys.add(`${r.classNum || ''}-${r.studentNum || ''}_${r.name}`)

    if (r.isMetro) metroCount++

    const aType = String(r.admissionType || '')
    if (aType.includes('교과')) types['학생부교과']++
    else if (aType.includes('종합')) types['학생부종합']++
    else if (aType.includes('논술')) types['논술위주']++
    else if (aType.includes('실기')) types['실기/실적']++

    const g = typeof r.score9Grade === 'number' ? r.score9Grade : (typeof r.allSubjectGrade === 'number' ? r.allSubjectGrade : null)
    if (g !== null && !isNaN(g) && g >= 1.0 && g <= 9.0) {
      validGrades.push(g)
      if (g < 2.0) bands['1~2등급']++
      else if (g < 3.0) bands['2~3등급']++
      else if (g < 4.0) bands['3~4등급']++
      else if (g < 5.0) bands['4~5등급']++
      else if (g < 6.0) bands['5~6등급']++
      else bands['6등급이하']++
    }

    if (r.isRecommendation) recCount++
    if (r.isRural) ruralCount++

    const final = String(r.finalStage || '')
    const reg = String(r.registerStatus || '')
    if ((final.includes('합격') || final.includes('충원') || final.includes('최초') || reg === 'Y') && !final.includes('불합')) {
      finalPassCount++
    }
    if (reg === 'Y') registerCount++

    // Target university groups
    const u = String(r.univName || '')
    const d = String(r.dept || '')
    const isMed = ['의예', '치의', '한의', '약학', '수의', '의학'].some(m => d.includes(m))
    const isG1 = g1Univs.some(name => u.includes(name))
    const isG2 = g2Univs.some(name => u.includes(name))
    const isG3 = g3Univs.some(name => u.includes(name))
    const isG5 = g5Univs.some(name => u.includes(name))
    const isG6 = g6Univs.some(name => u.includes(name))

    const validG = (g !== null && !isNaN(g) && g > 0) ? g : null

    if (isG1) {
      targetStats['설·포·연·고'].count++
      if (validG) targetStats['설·포·연·고'].grades.push(validG)
      if (r.studentKey) topTierStudentKeys.add(r.studentKey)
    }
    if (isG2) {
      targetStats['서·성·한·이'].count++
      if (validG) targetStats['서·성·한·이'].grades.push(validG)
      if (r.studentKey) topTierStudentKeys.add(r.studentKey)
    }
    if (isG3) {
      targetStats['5대 과기원'].count++
      if (validG) targetStats['5대 과기원'].grades.push(validG)
      if (r.studentKey) topTierStudentKeys.add(r.studentKey)
    }
    if (isMed) {
      targetStats['의·치·한·약·수'].count++
      if (validG) targetStats['의·치·한·약·수'].grades.push(validG)
    }
    if (isG5) {
      targetStats['수도권 주요 15개대'].count++
      if (validG) targetStats['수도권 주요 15개대'].grades.push(validG)
    }
    if (isG6) {
      targetStats['경기권 거점/선호대'].count++
      if (validG) targetStats['경기권 거점/선호대'].grades.push(validG)
    }
  })

  validGrades.sort((a, b) => a - b)
  const totalApps = rows.length
  const applicantCount = studentKeys.size
  const avgGrade = validGrades.length ? Number((validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(2)) : null
  const bestGrade = validGrades.length ? validGrades[0].toFixed(2) : null
  const worstGrade = validGrades.length ? validGrades[validGrades.length - 1].toFixed(2) : null
  const metroRate = totalApps > 0 ? Number(((metroCount / totalApps) * 100).toFixed(1)) : null
  const nonMetroRate = metroRate != null ? Number((100 - metroRate).toFixed(1)) : null

  const topTierApps = targetStats['설·포·연·고'].count + targetStats['서·성·한·이'].count + targetStats['5대 과기원'].count
  const medicalApps = targetStats['의·치·한·약·수'].count

  const targetUnivSummary = {}
  Object.keys(targetStats).forEach(key => {
    const item = targetStats[key]
    const avg = item.grades.length ? Number((item.grades.reduce((a, b) => a + b, 0) / item.grades.length).toFixed(2)) : null
    targetUnivSummary[key] = { count: item.count, avgGrade: avg }
  })

  return {
    year: Number(year),
    academicYear: `${year}학년도`,
    hasData: true,
    totalStudents: totalStudents || null,
    applicantStudents: applicantCount,
    applicantRate: totalStudents ? Number(((applicantCount / totalStudents) * 100).toFixed(1)) : null,
    totalApplications: totalApps,
    avgAppsPerStudent: applicantCount > 0 ? Number((totalApps / applicantCount).toFixed(2)) : null,
    avgGrade,
    bestGrade,
    worstGrade,
    metroRate,
    nonMetroRate,
    topTierApps,
    topTierStudents: topTierStudentKeys.size,
    medicalApps,
    recommendationApps: recCount,
    ruralApps: ruralCount,
    finalPassRate: totalApps > 0 ? Number(((finalPassCount / totalApps) * 100).toFixed(1)) : null,
    registerRate: totalApps > 0 ? Number(((registerCount / totalApps) * 100).toFixed(1)) : null,
    gradeDistribution: bands,
    admissionTypes: types,
    targetUnivSummary
  }
}

