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
      topTierApps: 73,
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
      avgAppsPerStudent: 5.59,
      avgGrade: 3.96,
      bestGrade: 1.00,
      worstGrade: 8.71,
      metroRate: 61.4,
      nonMetroRate: 38.6,
      topTierApps: 101,
      topTierStudents: 26,
      medicalApps: 1,
      recommendationApps: 144,
      ruralApps: 137,
      finalPassRate: null, // 대입 전형 진행 중 (미발표 -> '-')
      registerRate: null,  // 미발표 -> '-'
      gradeDistribution: {
        '1~2등급': 141,
        '2~3등급': 178,
        '3~4등급': 360,
        '4~5등급': 396,
        '5~6등급': 200,
        '6등급이하': 101
      },
      admissionTypes: {
        '학생부교과': 632,
        '학생부종합': 503,
        '논술위주': 41,
        '실기/실적': 121
      }
    }
  },

  // 주요 대학군별 5개년 지원 건수 비교 데이터 (데이터 없는 연도는 null)
  targetUnivComparison: [
    {
      groupName: '설·카·포·연·고',
      note: '서울대, KAIST, 포항공대, 연세대, 고려대',
      data: { '2023': null, '2024': null, '2025': null, '2026': 14, '2027': 33 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': 1.89, '2027': 1.69 }
    },
    {
      groupName: '서·성·한·이',
      note: '서강대, 성균관대, 한양대, 이화여대',
      data: { '2023': null, '2024': null, '2025': null, '2026': 53, '2027': 44 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': 2.11, '2027': 1.79 }
    },
    {
      groupName: '과기원',
      note: 'GIST, UNIST, DGIST, 한국에너지공대 (KAIST제외)',
      data: { '2023': null, '2024': null, '2025': null, '2026': 6, '2027': 24 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': 1.68, '2027': 1.60 }
    },
    {
      groupName: '의·치·한·약·수',
      note: '의학·치의학·한의학·약학·수의학',
      data: { '2023': null, '2024': null, '2025': null, '2026': 19, '2027': 1 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': 1.59, '2027': 1.52 }
    },
    {
      groupName: '수도권 주요 15개대',
      note: '중앙·경희·외대·시립·건국·동국·홍익·국민·숭실·세종 등',
      data: { '2023': null, '2024': null, '2025': null, '2026': 299, '2027': 213 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': 3.35, '2027': 3.26 }
    },
    {
      groupName: '경기권 거점/선호대',
      note: '아주대·인하대·한양대(에리카)·경기대·가천대·강남대·명지대·수원대·용인대 등',
      data: { '2023': null, '2024': null, '2025': null, '2026': 408, '2027': 315 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': 4.07, '2027': 3.85 }
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

  const g5Univs = ['중앙대학교', '경희대학교', '한국외국어대학교', '서울시립대학교', '건국대학교', '동국대학교', '홍익대학교', '숙명여자대학교', '국민대학교', '숭실대학교', '세종대학교', '단국대학교']
  const isG5 = u => g5Univs.some(name => u.includes(name)) && !u.includes('동국대학교(WISE)')

  const g6Univs = ['아주대학교', '인하대학교', '한양대학교(ERICA)', '한양대학교(에리카)', '경기대학교', '가천대학교', '강남대학교', '명지대학교', '상명대학교', '수원대학교', '용인대학교', '성결대학교', '안양대학교', '평택대학교', '한신대학교', '한국공학대학교', '한국항공대학교']
  const isG6 = u => g6Univs.some(name => u.includes(name)) || u.includes('ERICA') || u.includes('에리카')

  const targetStats = {
    '설·카·포·연·고': { count: 0, grades: [] },
    '서·성·한·이': { count: 0, grades: [] },
    '과기원': { count: 0, grades: [] },
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

    // Target university groups (정밀 본교 매칭)
    const u = String(r.univName || '').trim()
    const d = String(r.dept || '').trim()
    
    // 의치한약수 엄격 필터링 (스포츠의학, 식물의학, 바이오의약, 문화창의학 등 비의료계열 제외)
    const isMed = !d.includes('스포츠의학') && !d.includes('식물의학') && !d.includes('바이오의약') && !d.includes('창의') &&
                  ['의예', '치의', '한의', '약학', '수의', '의학'].some(m => d.includes(m))

    // KAIST 식별
    const isKaist = u.includes('한국과학기술원') || u.includes('KAIST')

    // 1. 설·카·포·연·고 (서울대, KAIST, 포항공대, 연세대, 고려대 본교)
    const isG1 = isKaist || (((u === '서울대학교' || u.startsWith('서울대학교(') ||
                  u === '포항공과대학교' || u.startsWith('포항공과대학교(') ||
                  u === '연세대학교(서울)' || u === '연세대학교' ||
                  u === '고려대학교(서울)' || u === '고려대학교') &&
                 !u.includes('미래') && !u.includes('세종') && !u.includes('동서울') && !u.includes('남서울')))

    // 2. 서·성·한·이 (서강대, 성균관대, 한양대 서울, 이화여대)
    const isG2 = (u === '서강대학교' || u.startsWith('서강대학교(') ||
                  u.includes('성균관대학교') ||
                  u === '한양대학교(서울)' || u === '한양대학교' ||
                  u.includes('이화여자대학교')) &&
                 !u.includes('ERICA') && !u.includes('에리카') && !u.includes('한양여')

    // 3. 과기원 (KAIST 제외, GIST, UNIST, DGIST, KENTECH)
    const isG3 = !isKaist && ['광주과학기술원', 'GIST', '울산과학기술원', 'UNIST', '대구경북과학기술원', 'DGIST', '한국에너지공과대학교', 'KENTECH'].some(name => u.includes(name))
    const isG5Val = isG5(u)
    const isG6Val = isG6(u) && !isG5Val && !isG1 && !isG2

    const validG = (g !== null && !isNaN(g) && g > 0) ? g : null

    if (isG1) {
      targetStats['설·카·포·연·고'].count++
      if (validG) targetStats['설·카·포·연·고'].grades.push(validG)
      if (r.studentKey) topTierStudentKeys.add(r.studentKey)
    }
    if (isG2) {
      targetStats['서·성·한·이'].count++
      if (validG) targetStats['서·성·한·이'].grades.push(validG)
      if (r.studentKey) topTierStudentKeys.add(r.studentKey)
    }
    if (isG3) {
      targetStats['과기원'].count++
      if (validG) targetStats['과기원'].grades.push(validG)
      if (r.studentKey) topTierStudentKeys.add(r.studentKey)
    }
    if (isMed) {
      targetStats['의·치·한·약·수'].count++
      if (validG) targetStats['의·치·한·약·수'].grades.push(validG)
    }
    if (isG5Val) {
      targetStats['수도권 주요 15개대'].count++
      if (validG) targetStats['수도권 주요 15개대'].grades.push(validG)
    }
    if (isG6Val) {
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

  const topTierApps = targetStats['설·카·포·연·고'].count + targetStats['서·성·한·이'].count + targetStats['과기원'].count
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

