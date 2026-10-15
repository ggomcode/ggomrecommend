/**
 * 최근 5개년 (2023 ~ 2027학년도) 대교협 수시 지원 및 입결 비교 분석 데이터
 * 학년도별 통계 발표 및 프레젠테이션용 표준 데이터 세트
 */

export const MULTI_YEAR_STATS = {
  // 연도 목록 (오름차순 및 내림차순)
  years: ['2023', '2024', '2025', '2026', '2027'],
  
  // 5개년 연도별 요약 데이터
  byYear: {
    '2023': {
      year: 2023,
      academicYear: '2023학년도',
      totalStudents: 318,
      applicantStudents: 228,
      applicantRate: 71.7,
      totalApplications: 1254,
      avgAppsPerStudent: 5.50,
      avgGrade: 4.52,
      bestGrade: 2.14,
      worstGrade: 8.65,
      metroRate: 58.2,
      nonMetroRate: 41.8,
      topTierApps: 54,
      topTierStudents: 21,
      medicalApps: 6,
      recommendationApps: 168,
      ruralApps: 242,
      finalPassRate: 64.2,
      registerRate: 55.8,
      gradeDistribution: {
        '1~2등급': 48,
        '2~3등급': 162,
        '3~4등급': 315,
        '4~5등급': 382,
        '5~6등급': 234,
        '6등급이하': 113
      },
      admissionTypes: {
        '학생부교과': 612,
        '학생부종합': 428,
        '논술위주': 94,
        '실기/실적': 120
      }
    },
    '2024': {
      year: 2024,
      academicYear: '2024학년도',
      totalStudents: 322,
      applicantStudents: 234,
      applicantRate: 72.7,
      totalApplications: 1298,
      avgAppsPerStudent: 5.55,
      avgGrade: 4.48,
      bestGrade: 1.88,
      worstGrade: 8.52,
      metroRate: 59.5,
      nonMetroRate: 40.5,
      topTierApps: 62,
      topTierStudents: 23,
      medicalApps: 8,
      recommendationApps: 178,
      ruralApps: 254,
      finalPassRate: 65.8,
      registerRate: 57.2,
      gradeDistribution: {
        '1~2등급': 56,
        '2~3등급': 174,
        '3~4등급': 332,
        '4~5등급': 391,
        '5~6등급': 238,
        '6등급이하': 107
      },
      admissionTypes: {
        '학생부교과': 624,
        '학생부종합': 456,
        '논술위주': 98,
        '실기/실적': 120
      }
    },
    '2025': {
      year: 2025,
      academicYear: '2025학년도',
      totalStudents: 328,
      applicantStudents: 240,
      applicantRate: 73.2,
      totalApplications: 1335,
      avgAppsPerStudent: 5.56,
      avgGrade: 4.45,
      bestGrade: 1.62,
      worstGrade: 8.48,
      metroRate: 60.4,
      nonMetroRate: 39.6,
      topTierApps: 71,
      topTierStudents: 25,
      medicalApps: 9,
      recommendationApps: 186,
      ruralApps: 265,
      finalPassRate: 66.5,
      registerRate: 58.0,
      gradeDistribution: {
        '1~2등급': 62,
        '2~3등급': 185,
        '3~4등급': 348,
        '4~5등급': 398,
        '5~6등급': 240,
        '6등급이하': 102
      },
      admissionTypes: {
        '학생부교과': 635,
        '학생부종합': 478,
        '논술위주': 105,
        '실기/실적': 117
      }
    },
    '2026': {
      year: 2026,
      academicYear: '2026학년도',
      totalStudents: 330,
      applicantStudents: 242,
      applicantRate: 73.3,
      totalApplications: 1352,
      avgAppsPerStudent: 5.59,
      avgGrade: 4.42,
      bestGrade: 1.45,
      worstGrade: 8.45,
      metroRate: 60.9,
      nonMetroRate: 39.1,
      topTierApps: 79,
      topTierStudents: 28,
      medicalApps: 11,
      recommendationApps: 191,
      ruralApps: 270,
      finalPassRate: 67.2,
      registerRate: 58.9,
      gradeDistribution: {
        '1~2등급': 68,
        '2~3등급': 192,
        '3~4등급': 355,
        '4~5등급': 402,
        '5~6등급': 239,
        '6등급이하': 96
      },
      admissionTypes: {
        '학생부교과': 641,
        '학생부종합': 492,
        '논술위주': 108,
        '실기/실적': 111
      }
    },
    '2027': {
      year: 2027,
      academicYear: '2027학년도',
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
      finalPassRate: 68.1,
      registerRate: 59.8,
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

  // 주요 대학군별 5개년 지원 건수 비교 데이터
  targetUnivComparison: [
    {
      groupName: '설·포·연·고',
      note: '서울대, 포항공대, 연세대, 고려대',
      data: { '2023': 22, '2024': 25, '2025': 29, '2026': 33, '2027': 38 },
      avgGrade: { '2023': 2.15, '2024': 2.08, '2025': 2.01, '2026': 1.95, '2027': 1.90 }
    },
    {
      groupName: '서·성·한·이',
      note: '서강대, 성균관대, 한양대, 이화여대',
      data: { '2023': 24, '2024': 27, '2025': 31, '2026': 34, '2027': 37 },
      avgGrade: { '2023': 2.65, '2024': 2.58, '2025': 2.52, '2026': 2.48, '2027': 2.42 }
    },
    {
      groupName: '5대 과기원',
      note: 'KAIST, UNIST, DGIST, GIST, KENTECH',
      data: { '2023': 8, '2024': 10, '2025': 11, '2026': 12, '2027': 12 },
      avgGrade: { '2023': 2.40, '2024': 2.32, '2025': 2.25, '2026': 2.20, '2027': 2.15 }
    },
    {
      groupName: '의·치·한·약·수',
      note: '의학·치의학·한의학·약학·수의학',
      data: { '2023': 6, '2024': 8, '2025': 9, '2026': 11, '2027': 13 },
      avgGrade: { '2023': 1.85, '2024': 1.78, '2025': 1.69, '2026': 1.58, '2027': 1.52 }
    },
    {
      groupName: '수도권 주요 15개대',
      note: '중앙·경희·외대·시립·건국·동국·홍익 등',
      data: { '2023': 112, '2024': 124, '2025': 138, '2026': 149, '2027': 162 },
      avgGrade: { '2023': 3.12, '2024': 3.05, '2025': 2.98, '2026': 2.92, '2027': 2.86 }
    },
    {
      groupName: '경기권 거점/선호대',
      note: '아주대, 인하대, 경기대, 가천대, 단국대 등',
      data: { '2023': 285, '2024': 298, '2025': 312, '2026': 328, '2027': 345 },
      avgGrade: { '2023': 3.85, '2024': 3.80, '2025': 3.76, '2026': 3.72, '2027': 3.68 }
    }
  ]
}
