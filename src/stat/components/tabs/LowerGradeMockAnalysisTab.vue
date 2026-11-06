<template>
  <div class="space-y-6">
    <!-- 1. 상단 안내 헤더 배너 -->
    <div class="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-900/40">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[11px] font-bold">
              학사 {{ academicYear }}학년도 모의고사
            </span>
            <span class="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30 text-[11px] font-bold">
              고등학교 {{ targetGrade }}학년 전용
            </span>
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[11px] font-mono font-bold">
              {{ targetAdmissionYear }}학년도 대입 ({{ targetGrade === 2 ? '예비고3' : '예비고2' }})
            </span>
          </div>
          <h1 class="text-xl sm:text-2xl font-black text-white m-0 tracking-tight flex items-center gap-2">
            <span>📈</span>
            <span>고{{ targetGrade }} 전국연합학력평가 성적 분석 ({{ targetAdmissionYear }}학년도 대입 대비)</span>
          </h1>
          <p class="text-xs text-slate-300 mt-2 m-0 max-w-2xl leading-relaxed">
            해당 학사일정(<strong>{{ academicYear }}학년도</strong>)에 응시한 <strong>고{{ targetGrade }} 전국연합학력평가</strong> 성적표를 바탕으로 회차별(3·6·9·11월) 성적 추이를 분석하고, 직전 대입(<strong>{{ benchmarkAdmissionYear }}학년도 대입</strong>)의 합격선 및 수능최저 충족 기준을 연계하여 진학 설계를 지원합니다.
          </p>
        </div>

        <div class="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 shrink-0 text-right space-y-1">
          <div class="text-[11px] text-slate-300 font-medium">고{{ targetGrade }} 응시 데이터 현황</div>
          <div class="text-lg font-black text-amber-300 font-mono">
            총 {{ gradeRecords.length }}건 (학생 {{ uniqueStudentsCount }}명)
          </div>
          <div class="text-[10px] text-indigo-200 flex items-center justify-end gap-1">
            <span>대입학년도: {{ targetAdmissionYear }}학년도 고정</span>
            <span class="text-amber-300">🔒</span>
          </div>
          <div class="text-[10px] text-slate-400">
            분석 기준: {{ benchmarkAdmissionYear }}학년도 대입 결과 연계
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 필터 및 빠른 액션 바 -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
      <!-- 회차 선택 -->
      <div class="flex flex-wrap items-center gap-2">
        <label class="text-xs font-bold text-slate-700">모의고사 회차:</label>
        <div class="relative">
          <select
            v-model="selectedExamName"
            class="appearance-none pl-3 pr-8 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none cursor-pointer transition-colors"
          >
            <option value="ALL">전체 회차 종합</option>
            <option v-for="ex in availableExamNames" :key="ex" :value="ex">
              {{ ex }}
            </option>
          </select>
          <ChevronDown class="w-3.5 h-3.5 text-slate-500 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
        </div>

        <!-- 반 선택 -->
        <label class="text-xs font-bold text-slate-700 ml-2">학급:</label>
        <div class="relative">
          <select
            v-model="selectedClass"
            class="appearance-none pl-3 pr-8 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none cursor-pointer transition-colors"
          >
            <option value="ALL">전체 학급</option>
            <option v-for="c in availableClasses" :key="c" :value="c">
              {{ c }}반
            </option>
          </select>
          <ChevronDown class="w-3.5 h-3.5 text-slate-500 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>
    </div>

    <!-- 3. 데이터가 없을 때 안내 -->
    <div v-if="filteredRecords.length === 0" class="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
      <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
        📂
      </div>
      <h3 class="text-base font-bold text-slate-800 m-0">
        {{ targetGrade }}학년 모의고사 데이터가 등록되지 않았습니다
      </h3>
      <p class="text-xs text-slate-500 m-0 max-w-md mx-auto">
        [통합 시스템 설정] > [모의고사 성적 업로드] 메뉴에서 {{ targetGrade }}학년 모의고사 엑셀 파일(.xlsx)을 등록해 주세요.
      </p>
    </div>

    <!-- 4. 주요 영역별 평균 등급 카드 그리드 & 직전 대입 연계 벤치마크 -->
    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 국어 -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-500">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              국어 영역
            </span>
            <span>응시 {{ summaryStats.korCount }}명</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-black text-slate-900 font-mono">{{ summaryStats.korAvgGrade }}</span>
            <span class="text-xs font-bold text-slate-500">평균 등급</span>
          </div>
          <div class="text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100">
            <span>평균 표준점수</span>
            <span class="font-bold text-slate-800 font-mono">{{ summaryStats.korAvgScore }}점</span>
          </div>
        </div>

        <!-- 수학 -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-500">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              수학 영역
            </span>
            <span>응시 {{ summaryStats.mathCount }}명</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-black text-slate-900 font-mono">{{ summaryStats.mathAvgGrade }}</span>
            <span class="text-xs font-bold text-slate-500">평균 등급</span>
          </div>
          <div class="text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100">
            <span>평균 표준점수</span>
            <span class="font-bold text-slate-800 font-mono">{{ summaryStats.mathAvgScore }}점</span>
          </div>
        </div>

        <!-- 영어 -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-500">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              영어 영역 (절대평가)
            </span>
            <span>응시 {{ summaryStats.engCount }}명</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-black text-slate-900 font-mono">{{ summaryStats.engAvgGrade }}</span>
            <span class="text-xs font-bold text-slate-500">평균 등급</span>
          </div>
          <div class="text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100">
            <span>1~3등급 비율</span>
            <span class="font-bold text-emerald-700 font-mono">{{ summaryStats.engTopRate }}%</span>
          </div>
        </div>

        <!-- 한국사 -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-500">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              한국사 영역
            </span>
            <span>응시 {{ summaryStats.histCount }}명</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-black text-slate-900 font-mono">{{ summaryStats.histAvgGrade }}</span>
            <span class="text-xs font-bold text-slate-500">평균 등급</span>
          </div>
          <div class="text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100">
            <span>1~4등급 충족률</span>
            <span class="font-bold text-amber-700 font-mono">{{ summaryStats.histPassRate }}%</span>
          </div>
        </div>
      </div>

      <!-- 직전 대입 연계 수능최저 경쟁력 시뮬레이션 요약 카드 -->
      <div class="bg-linear-to-r from-indigo-50/70 via-white to-sky-50/60 rounded-2xl p-5 border border-indigo-100 shadow-sm space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-lg">🎯</span>
            <h3 class="text-sm font-bold text-slate-800 m-0">
              직전 대입({{ benchmarkAdmissionYear }}학년도) 기준 주요 수능최저 모의 충족률
            </h3>
            <span class="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
              {{ targetAdmissionYear }}학년도 대입 경쟁력 진단
            </span>
          </div>
          <div class="text-xs text-slate-500">
            * 국·수·영·탐 상위 등급 조합 기준 (응시 인원 {{ filteredRecords.length }}명)
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div class="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
            <div class="text-xs font-bold text-slate-600 mb-1 flex items-center justify-between">
              <span>상위권 대학 (2합 5 이내)</span>
              <span class="text-[11px] text-indigo-600 font-mono font-bold">{{ csatBenchmark.twoSum5Count }}명</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-xl font-black text-indigo-950 font-mono">{{ csatBenchmark.twoSum5Rate }}%</span>
              <span class="text-[10px] text-slate-400">주요 서울권 수시 충족선</span>
            </div>
          </div>

          <div class="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
            <div class="text-xs font-bold text-slate-600 mb-1 flex items-center justify-between">
              <span>수도권 및 거점국립대 (2합 6 이내)</span>
              <span class="text-[11px] text-sky-600 font-mono font-bold">{{ csatBenchmark.twoSum6Count }}명</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-xl font-black text-sky-950 font-mono">{{ csatBenchmark.twoSum6Rate }}%</span>
              <span class="text-[10px] text-slate-400">수도권 학생부교과/종합 충족선</span>
            </div>
          </div>

          <div class="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
            <div class="text-xs font-bold text-slate-600 mb-1 flex items-center justify-between">
              <span>최상위권 대학 (3합 7 이내)</span>
              <span class="text-[11px] text-purple-600 font-mono font-bold">{{ csatBenchmark.threeSum7Count }}명</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-xl font-black text-purple-950 font-mono">{{ csatBenchmark.threeSum7Rate }}%</span>
              <span class="text-[10px] text-slate-400">서·성·한 등 최상위 수시 충족선</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. 학생별 성적 명단 테이블 -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-800 m-0 flex items-center gap-2">
            <span>📋</span>
            <span>학생별 모의고사 성적 목록 (총 {{ filteredRecords.length }}건)</span>
          </h3>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="이름 또는 학번 검색..."
            class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-44"
          />
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-200 max-h-96 overflow-y-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="bg-slate-50 text-slate-600 font-bold sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-3">학급</th>
                <th class="py-2.5 px-3">성명</th>
                <th class="py-2.5 px-3">회차</th>
                <th class="py-2.5 px-3">국어 (과목/표점/등급)</th>
                <th class="py-2.5 px-3">수학 (과목/표점/등급)</th>
                <th class="py-2.5 px-3 text-center">영어</th>
                <th class="py-2.5 px-3 text-center">한국사</th>
                <th class="py-2.5 px-3">탐구1</th>
                <th class="py-2.5 px-3">탐구2</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-mono text-[11px]">
              <tr
                v-for="(st, idx) in searchedRecords"
                :key="st.studentKey + '_' + idx"
                class="hover:bg-slate-50/80 transition-colors"
              >
                <td class="py-2 px-3 text-slate-600">{{ st.classNum }}반 {{ st.studentNum }}번</td>
                <td class="py-2 px-3 font-sans font-bold text-slate-900">{{ st.name }}</td>
                <td class="py-2 px-3 font-sans text-slate-500">
                  <span class="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-bold">
                    {{ st.examName }}
                  </span>
                </td>
                <td class="py-2 px-3">
                  <span class="text-slate-500 text-[10px] mr-1">{{ st.korSubject }}</span>
                  <span v-if="st.korStandardScore" class="font-bold text-slate-800 mr-1">{{ st.korStandardScore }}</span>
                  <span v-if="st.korGrade" class="px-1 py-0.2 rounded bg-blue-50 text-blue-700 font-black text-[10px]">
                    {{ st.korGrade }}등급
                  </span>
                </td>
                <td class="py-2 px-3">
                  <span class="text-slate-500 text-[10px] mr-1">{{ st.mathSubject }}</span>
                  <span v-if="st.mathStandardScore" class="font-bold text-slate-800 mr-1">{{ st.mathStandardScore }}</span>
                  <span v-if="st.mathGrade" class="px-1 py-0.2 rounded bg-purple-50 text-purple-700 font-black text-[10px]">
                    {{ st.mathGrade }}등급
                  </span>
                </td>
                <td class="py-2 px-3 text-center">
                  <span v-if="st.engGrade" class="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-black text-[10px]">
                    {{ st.engGrade }}등급
                  </span>
                </td>
                <td class="py-2 px-3 text-center">
                  <span v-if="st.histGrade" class="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-black text-[10px]">
                    {{ st.histGrade }}등급
                  </span>
                </td>
                <td class="py-2 px-3">
                  <span class="text-slate-500 text-[10px] mr-1">{{ st.inquiry1 }}</span>
                  <span v-if="st.inq1Grade" class="px-1 py-0.2 rounded bg-slate-100 text-slate-700 font-black text-[10px]">
                    {{ st.inq1Grade }}등급
                  </span>
                </td>
                <td class="py-2 px-3">
                  <span class="text-slate-500 text-[10px] mr-1">{{ st.inquiry2 }}</span>
                  <span v-if="st.inq2Grade" class="px-1 py-0.2 rounded bg-slate-100 text-slate-700 font-black text-[10px]">
                    {{ st.inq2Grade }}등급
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { useStatData, getGradeAdmissionYear, getCurrentAcademicYear } from '../../composables/useStatData'
import { getAcademicSchoolYear } from '../../utils/mockExamReportParser'

const props = defineProps({
  grade: {
    type: Number,
    default: 2
  }
})

const targetGrade = computed(() => Number(props.grade) || 2)
// 해당 학사일정 연도 (예: 2026.11 기준 2026학년도 학사, 2027.05 기준 2027학년도 학사)
const academicYear = computed(() => getAcademicSchoolYear(new Date()))
// 해당 학년의 대입 학년도 (예: 2026.11 기준 고2는 2028학년도, 고1은 2029학년도 대입)
const targetAdmissionYear = computed(() => getGradeAdmissionYear(targetGrade.value))
// 연계 분석 기준이 되는 직전 대입 학년도 (예: 2027학년도 대입)
const benchmarkAdmissionYear = computed(() => selectedAcademicYear.value || getCurrentAcademicYear())

const { mockExamRecords, loadMockExamData, selectedAcademicYear } = useStatData()

onMounted(() => {
  if (!mockExamRecords.value || mockExamRecords.value.length === 0) {
    loadMockExamData().catch(() => {})
  }
})

// 대상 학년 데이터만 선별
const gradeRecords = computed(() => {
  return (mockExamRecords.value || []).filter(r => Number(r.grade) === targetGrade.value)
})

const uniqueStudentsCount = computed(() => {
  const set = new Set(gradeRecords.value.map(r => r.studentKey))
  return set.size
})

// 가용 회차 목록
const availableExamNames = computed(() => {
  const set = new Set()
  gradeRecords.value.forEach(r => {
    if (r.examName) set.add(r.examName)
  })
  return Array.from(set)
})

// 가용 반 목록
const availableClasses = computed(() => {
  const set = new Set()
  gradeRecords.value.forEach(r => {
    if (r.classNum) set.add(String(r.classNum))
  })
  return Array.from(set).sort((a, b) => Number(a) - Number(b))
})

const selectedExamName = ref('ALL')
const selectedClass = ref('ALL')
const searchQuery = ref('')

// 필터링된 레코드
const filteredRecords = computed(() => {
  return gradeRecords.value.filter(r => {
    if (selectedExamName.value !== 'ALL' && r.examName !== selectedExamName.value) return false
    if (selectedClass.value !== 'ALL' && String(r.classNum) !== selectedClass.value) return false
    return true
  })
})

const searchedRecords = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return filteredRecords.value
  return filteredRecords.value.filter(r => {
    return (r.name && r.name.toLowerCase().includes(q)) ||
           (r.studentKey && r.studentKey.includes(q))
  })
})

// 요약 통계 계산
const summaryStats = computed(() => {
  const recs = filteredRecords.value
  const calcAvg = (getter) => {
    const vals = recs.map(getter).filter(v => v !== null && v !== undefined && !isNaN(v))
    if (vals.length === 0) return { count: 0, avg: '-' }
    const sum = vals.reduce((a, b) => a + Number(b), 0)
    return { count: vals.length, avg: (sum / vals.length).toFixed(2) }
  }

  const korGrade = calcAvg(r => r.korGrade)
  const korScore = calcAvg(r => r.korStandardScore)
  const mathGrade = calcAvg(r => r.mathGrade)
  const mathScore = calcAvg(r => r.mathStandardScore)
  const engGrade = calcAvg(r => r.engGrade)
  const histGrade = calcAvg(r => r.histGrade)

  // 영어 1~3등급 비율
  const engValid = recs.filter(r => r.engGrade !== null && !isNaN(r.engGrade))
  const engTop = engValid.filter(r => Number(r.engGrade) <= 3)
  const engTopRate = engValid.length > 0 ? ((engTop.length / engValid.length) * 100).toFixed(1) : '-'

  // 한국사 1~4등급 충족률
  const histValid = recs.filter(r => r.histGrade !== null && !isNaN(r.histGrade))
  const histPass = histValid.filter(r => Number(r.histGrade) <= 4)
  const histPassRate = histValid.length > 0 ? ((histPass.length / histValid.length) * 100).toFixed(1) : '-'

  return {
    korCount: korGrade.count,
    korAvgGrade: korGrade.avg,
    korAvgScore: korScore.avg,
    mathCount: mathGrade.count,
    mathAvgGrade: mathGrade.avg,
    mathAvgScore: mathScore.avg,
    engCount: engGrade.count,
    engAvgGrade: engGrade.avg,
    engTopRate,
    histCount: histGrade.count,
    histAvgGrade: histGrade.avg,
    histPassRate
  }
})

// 직전 대입 연계 수능최저 충족 시뮬레이션 지표
const csatBenchmark = computed(() => {
  const recs = filteredRecords.value
  if (recs.length === 0) {
    return {
      twoSum5Count: 0, twoSum5Rate: '-',
      twoSum6Count: 0, twoSum6Rate: '-',
      threeSum7Count: 0, threeSum7Rate: '-'
    }
  }

  let twoSum5 = 0
  let twoSum6 = 0
  let threeSum7 = 0

  recs.forEach(r => {
    // 국, 수, 영, 탐1, 탐2 등급 추출
    const grades = [r.korGrade, r.mathGrade, r.engGrade, r.inq1Grade, r.inq2Grade]
      .filter(g => g !== null && g !== undefined && !isNaN(g) && Number(g) > 0)
      .map(Number)
      .sort((a, b) => a - b) // 최우수 등급 오름차순 정렬

    if (grades.length >= 2) {
      const sum2 = grades[0] + grades[1]
      if (sum2 <= 5) twoSum5++
      if (sum2 <= 6) twoSum6++
    }
    if (grades.length >= 3) {
      const sum3 = grades[0] + grades[1] + grades[2]
      if (sum3 <= 7) threeSum7++
    }
  })

  return {
    twoSum5Count: twoSum5,
    twoSum5Rate: ((twoSum5 / recs.length) * 100).toFixed(1),
    twoSum6Count: twoSum6,
    twoSum6Rate: ((twoSum6 / recs.length) * 100).toFixed(1),
    threeSum7Count: threeSum7,
    threeSum7Rate: ((threeSum7 / recs.length) * 100).toFixed(1)
  }
})
</script>
