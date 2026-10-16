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
      hasData: false,
      totalStudents: 352,
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
      data: { '2023': null, '2024': null, '2025': null, '2026': null, '2027': 38 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': null, '2027': 1.90 }
    },
    {
      groupName: '서·성·한·이',
      note: '서강대, 성균관대, 한양대, 이화여대',
      data: { '2023': null, '2024': null, '2025': null, '2026': null, '2027': 37 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': null, '2027': 2.42 }
    },
    {
      groupName: '5대 과기원',
      note: 'KAIST, UNIST, DGIST, GIST, KENTECH',
      data: { '2023': null, '2024': null, '2025': null, '2026': null, '2027': 12 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': null, '2027': 2.15 }
    },
    {
      groupName: '의·치·한·약·수',
      note: '의학·치의학·한의학·약학·수의학',
      data: { '2023': null, '2024': null, '2025': null, '2026': null, '2027': 13 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': null, '2027': 1.52 }
    },
    {
      groupName: '수도권 주요 15개대',
      note: '중앙·경희·외대·시립·건국·동국·홍익 등',
      data: { '2023': null, '2024': null, '2025': null, '2026': null, '2027': 162 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': null, '2027': 2.86 }
    },
    {
      groupName: '경기권 거점/선호대',
      note: '아주대, 인하대, 경기대, 가천대, 단국대 등',
      data: { '2023': null, '2024': null, '2025': null, '2026': null, '2027': 345 },
      avgGrade: { '2023': null, '2024': null, '2025': null, '2026': null, '2027': 3.68 }
    }
  ]
}
