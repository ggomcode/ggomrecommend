import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import rawAppsData from '../data/applications.json'
import officialStatsData from '../data/officialStats.json'
import * as XLSX from 'xlsx'

// Global state
const applications = ref(rawAppsData)
const officialStats = ref(officialStatsData)

// Filters
const selectedClass = ref('ALL') // ALL, ENROLLED, 1..11, 졸업생
const selectedField = ref('ALL') // ALL, 인문, 자연, 예체능
const selectedType = ref('ALL') // ALL, 교과, 종합, 실기, 논술
const selectedMajorType = ref('ALL') // ALL, 일반학생, GROUP_RURAL, GROUP_OPP_NON_RURAL, or specific admissionMajorType
const selectedRegion = ref('ALL') // ALL, METRO, NON_METRO, or specific region
const searchKeyword = ref('')
const adminMaskToggle = ref(false) // Admin toggleable

// Standalone Helper: Mask student name (e.g. "홍길동" -> "홍*동", "고윤" -> "고*")
export function maskName(name, forceMask = null) {
  if (!name) return ''
  let isMasked = false
  try {
    const auth = useAuthStore()
    isMasked = forceMask !== null ? forceMask : (auth.isTeacher || adminMaskToggle.value)
  } catch (e) {
    isMasked = forceMask !== null ? forceMask : adminMaskToggle.value
  }
  if (!isMasked) return name
  if (name.length <= 1) return name
  if (name.length === 2) return name[0] + '*'
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}

// Standalone Helper: Format grade
export function formatGrade(val) {
  if (val === null || val === undefined || isNaN(val)) return '-'
  return Number(val).toFixed(2)
}

export const TOP_TIER_TARGET_UNIVS = [
  '서울대학교(서울)', '포항공과대학교(포항)', '연세대학교(서울)', '고려대학교(서울)',
  '서강대학교(서울)', '성균관대학교(서울)', '성균관대학교(수원)', '한양대학교(서울)',
  '이화여자대학교(서울)', '한국과학기술원', '울산과학기술원', '대구경북과학기술원',
  '광주과학기술원', '한국에너지공과대학교'
]

export const CLASS_STUDENT_COUNTS = {
  1: 31,
  2: 31,
  3: 29,
  4: 30,
  5: 31,
  6: 26,
  7: 27,
  8: 29,
  9: 30,
  10: 28,
  11: 31
}

export const REGION_ORDER = ['경기', '서울', '충남', '강원', '충북', '대전', '전북', '인천', '경북', '세종', '대구', '울산', '광주', '경남', '전남', '부산', '제주']
export const METRO_REGIONS = new Set(['경기', '서울', '인천'])

// Composable
export function useStatData() {
  const auth = useAuthStore()

  // Privacy Mask Rule:
  // - Teacher: ALWAYS masked (true). Student names are permanently protected.
  // - Admin: can toggle on/off.
  const isPrivacyMasked = computed(() => {
    if (auth.isTeacher) return true
    return adminMaskToggle.value
  })

  // Reset all filters
  const resetFilters = () => {
    selectedClass.value = 'ALL'
    selectedField.value = 'ALL'
    selectedType.value = 'ALL'
    selectedMajorType.value = 'ALL'
    selectedRegion.value = 'ALL'
    searchKeyword.value = ''
  }

  // Filtered applications
  const filteredApplications = computed(() => {
    return applications.value.filter(app => {
      // Class filter
      if (selectedClass.value === 'ENROLLED') {
        if (app.isGraduate || app.classNum === '졸업생') return false
      } else if (selectedClass.value === '졸업생' || selectedClass.value === 'GRADUATE') {
        if (!app.isGraduate && app.classNum !== '졸업생') return false
      } else if (selectedClass.value !== 'ALL') {
        if (String(app.classNum) !== String(selectedClass.value)) return false
      }
      // Field filter
      if (selectedField.value !== 'ALL' && app.field !== selectedField.value) {
        return false
      }
      // Admission type filter
      if (selectedType.value !== 'ALL') {
        if (!app.admissionType.includes(selectedType.value)) return false
      }
      // Major Type (전형명(대) - 대교협 구글시트 J열) filter
      if (selectedMajorType.value !== 'ALL') {
        if (selectedMajorType.value === 'GROUP_RURAL') {
          // 농어촌 (기회균형 및 고른기회 포함)
          if (!app.isRural && !app.admissionMajorType?.includes('농어촌') && !app.admissionDetailType?.includes('농어촌')) {
            return false
          }
        } else if (selectedMajorType.value === 'GROUP_OPP_NON_RURAL') {
          // 농어촌 외 기회균형 및 고른기회
          const isRuralApp = app.isRural || app.admissionMajorType?.includes('농어촌') || app.admissionDetailType?.includes('농어촌')
          const isOppApp = app.isOpportunity || 
            app.admissionMajorType?.includes('기회균형') || 
            app.admissionMajorType?.includes('고른기회') || 
            app.admissionMajorType?.includes('사회배려') ||
            app.admissionMajorType?.includes('수급자')
          if (isRuralApp || !isOppApp) {
            return false
          }
        } else if (selectedMajorType.value === 'GROUP_REC') {
          // 지역균형/학교장추천
          if (!app.isRecommendation && app.admissionMajorType !== '지역균형선발' && !app.admissionMajorType?.includes('추천')) {
            return false
          }
        } else {
          // Exact match with admissionMajorType
          if (app.admissionMajorType !== selectedMajorType.value) {
            return false
          }
        }
      }
      // Region filter
      if (selectedRegion.value === 'METRO') {
        if (!app.isMetro) return false
      } else if (selectedRegion.value === 'NON_METRO') {
        if (app.isMetro) return false
      } else if (selectedRegion.value !== 'ALL') {
        if (app.region !== selectedRegion.value) return false
      }
      // Search keyword
      if (searchKeyword.value.trim()) {
        const kw = searchKeyword.value.trim().toLowerCase()
        const text = `${app.name} ${app.univName} ${app.dept} ${app.admissionMajorType} ${app.admissionDetailType} ${app.classNum}반`.toLowerCase()
        if (!text.includes(kw)) return false
      }
      return true
    })
  })

  // Target total student count for current selection (Class-specific or overall)
  const currentTargetTotalStudents = computed(() => {
    const cls = Number(selectedClass.value)
    if (!isNaN(cls) && cls >= 1 && cls <= 11) {
      return CLASS_STUDENT_COUNTS[cls] || 30
    }
    if (selectedClass.value === '졸업생' || selectedClass.value === 'GRADUATE') {
      return currentStats.value.totalStudents
    }
    return officialStats.value.totalStudents || 334
  })

  // Dynamic label for enrolled card
  const enrolledLabel = computed(() => {
    const cls = Number(selectedClass.value)
    if (!isNaN(cls) && cls >= 1 && cls <= 11) {
      return `${cls}반 재학생`
    }
    if (selectedClass.value === 'ENROLLED') {
      return '3학년 재학생 (1~11반)'
    }
    if (selectedClass.value === '졸업생' || selectedClass.value === 'GRADUATE') {
      return '졸업생 지원자'
    }
    return '3학년 재학생'
  })

  // Dynamic subtitle for enrolled card
  const enrolledSubText = computed(() => {
    const cls = Number(selectedClass.value)
    if (!isNaN(cls) && cls >= 1 && cls <= 11) {
      return `포곡고 3학년 ${cls}반 총원`
    }
    if (selectedClass.value === '졸업생' || selectedClass.value === 'GRADUATE') {
      return '수시 지원 졸업생 총원'
    }
    return '포곡고 3학년 총원'
  })

  // Dynamic applicant rate (based on current target students)
  const currentApplicantRate = computed(() => {
    const target = currentTargetTotalStudents.value
    if (!target || target === 0) return '0.0'
    return ((currentStats.value.totalStudents / target) * 100).toFixed(1)
  })

  // Dynamic statistics based on filtered data
  const currentStats = computed(() => {
    const list = filteredApplications.value
    const totalApps = list.length
    
    // Unique students in filtered set
    const studentKeys = new Set(list.map(a => a.studentKey))
    const totalStudents = studentKeys.size

    // Average applications per student
    const avgApps = totalStudents > 0 ? (totalApps / totalStudents).toFixed(1) : '0.0'

    // Metropolitan count
    const metroApps = list.filter(a => a.isMetro).length
    const metroRate = totalApps > 0 ? ((metroApps / totalApps) * 100).toFixed(1) : '0.0'
    const nonMetroApps = totalApps - metroApps
    const nonMetroRate = totalApps > 0 ? ((nonMetroApps / totalApps) * 100).toFixed(1) : '0.0'

    // Specific metro regions
    const gyeonggiApps = list.filter(a => a.region === '경기').length
    const seoulApps = list.filter(a => a.region === '서울').length
    const incheonApps = list.filter(a => a.region === '인천').length

    // Recommendation count
    const recApps = list.filter(a => a.isRecommendation).length
    const recRate = totalApps > 0 ? ((recApps / totalApps) * 100).toFixed(1) : '0.0'
    const recStudents = new Set(list.filter(a => a.isRecommendation).map(a => a.studentKey)).size
    const recStudentRate = totalStudents > 0 ? ((recStudents / totalStudents) * 100).toFixed(1) : '0.0'

    // Rural count
    const ruralApps = list.filter(a => a.isRural).length
    const ruralRate = totalApps > 0 ? ((ruralApps / totalApps) * 100).toFixed(1) : '0.0'
    const ruralStudents = new Set(list.filter(a => a.isRural).map(a => a.studentKey)).size
    const ruralStudentRate = totalStudents > 0 ? ((ruralStudents / totalStudents) * 100).toFixed(1) : '0.0'

    // Top tier Sky & Tech
    const topTierAppsList = list.filter(a => TOP_TIER_TARGET_UNIVS.some(u => a.univName.includes(u) || a.univName === u))
    const topTierApps = topTierAppsList.length
    const topTierStudents = new Set(topTierAppsList.map(a => a.studentKey)).size
    const topTierRate = totalApps > 0 ? ((topTierApps / totalApps) * 100).toFixed(1) : '0.0'

    // Dynamic Regional Breakdown
    const regionCountsMap = {}
    list.forEach(a => {
      if (a.region) {
        regionCountsMap[a.region] = (regionCountsMap[a.region] || 0) + 1
      }
    })
    const regionalBreakdown = REGION_ORDER.map(region => {
      const count = regionCountsMap[region] || 0
      const rate = totalApps > 0 ? Number(((count / totalApps) * 100).toFixed(1)) : 0
      return {
        region,
        count,
        rate,
        metro: METRO_REGIONS.has(region)
      }
    })

    // Type counts
    const typeCounts = {
      gyogwa: list.filter(a => a.admissionType.includes('교과')).length,
      jonghap: list.filter(a => a.admissionType.includes('종합')).length,
      silgi: list.filter(a => a.admissionType.includes('실기')).length,
      nonsul: list.filter(a => a.admissionType.includes('논술')).length,
      other: 0
    }
    typeCounts.other = totalApps - (typeCounts.gyogwa + typeCounts.jonghap + typeCounts.silgi + typeCounts.nonsul)

    // Field counts
    const fieldCounts = {
      humanities: list.filter(a => a.field === '인문').length,
      natural: list.filter(a => a.field === '자연').length,
      arts: list.filter(a => a.field === '예체능').length
    }

    // Average grade of applied students
    const validGrades = list.map(a => a.allSubjectGrade).filter(g => g !== null && g > 0)
    const avgGrade = validGrades.length > 0 
      ? (validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(2)
      : '-'

    return {
      totalApps,
      totalStudents,
      avgApps,
      metroApps,
      metroRate,
      nonMetroApps,
      nonMetroRate,
      gyeonggiApps,
      seoulApps,
      incheonApps,
      recApps,
      recRate,
      recStudents,
      recStudentRate,
      ruralApps,
      ruralRate,
      ruralStudents,
      ruralStudentRate,
      topTierApps,
      topTierStudents,
      topTierRate,
      typeCounts,
      fieldCounts,
      regionalBreakdown,
      avgGrade
    }
  })

  // Export filtered applications to Excel
  const exportToExcel = (customList = null, filename = '포곡고_2027수시지원통계') => {
    const list = customList || filteredApplications.value
    const exportData = list.map(app => ({
      '학년': app.grade,
      '반': app.classNum,
      '번호': app.studentNum,
      '이름': maskName(app.name),
      '학교유형': app.schoolType,
      '지역': app.region,
      '대학명': app.univName,
      '모집시기': app.period,
      '전형유형': app.admissionType,
      '전형명(대)': app.admissionMajorType,
      '세부유형': app.admissionDetailType,
      '계열': app.field,
      '모집단위': app.dept,
      '모집인원': app.quota,
      '선발유형': app.selectionMethod,
      '최저학력기준': app.minScoreReq,
      '전교과등급(100)': app.allSubjectGrade,
      '국영수사/과(100)': app.mainSubjectGrade,
      '대학환산점수': app.univConvertedScore,
      '대학환산등급': app.univConvertedGrade,
      '1단계': app.stage1,
      '최종단계': app.finalStage,
      '비고': app.note,
      '면접일자': app.interviewDate,
      '실기일자': app.practicalDate,
      '논술일자': app.essayDate,
      '최종발표일': app.finalAnnounceDate
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '수시지원현황')
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // File upload parser
  const loadCustomData = (parsedApps) => {
    if (Array.isArray(parsedApps) && parsedApps.length > 0) {
      applications.value = parsedApps
    }
  }

  return {
    auth,
    applications,
    officialStats,
    selectedClass,
    selectedField,
    selectedType,
    selectedMajorType,
    selectedRegion,
    searchKeyword,
    adminMaskToggle,
    isPrivacyMasked,
    filteredApplications,
    currentStats,
    currentTargetTotalStudents,
    enrolledLabel,
    enrolledSubText,
    currentApplicantRate,
    resetFilters,
    exportToExcel,
    loadCustomData,
    maskName,
    formatGrade
  }
}

// Aliases for seamless imports across all components
export { useStatData as useData }
