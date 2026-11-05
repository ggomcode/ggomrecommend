<template>
  <div class="space-y-6">
    <!-- 1. 상단 안내 헤더 배너 -->
    <div class="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-900/40">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[11px] font-bold">
              일반 학사 {{ academicYear }}학년도 기준
            </span>
            <span class="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30 text-[11px] font-bold">
              고등학교 {{ targetGrade }}학년 전용
            </span>
            <span v-if="targetGrade === 2" class="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[11px] font-mono font-bold">
              2028학년도 대입 예비고3
            </span>
          </div>
          <h1 class="text-xl sm:text-2xl font-black text-white m-0 tracking-tight flex items-center gap-2">
            <span>📈</span>
            <span>고{{ targetGrade }} 전국연합학력평가 성적 분석</span>
          </h1>
          <p class="text-xs text-slate-300 mt-2 m-0 max-w-2xl leading-relaxed">
            구글 시트 <code class="px-1.5 py-0.5 rounded bg-indigo-800/80 text-amber-300 font-mono font-bold">2027모의결과</code> 시트에서 <strong>{{ targetGrade }}학년</strong> 데이터만 선별하여 회차별(3·6·9·11월) 성적 추이와 영역별 평균 등급을 종합 분석합니다.
          </p>
        </div>

        <div class="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 shrink-0 text-right space-y-1">
          <div class="text-[11px] text-slate-300 font-medium">{{ targetGrade }}학년 응시 데이터</div>
          <div class="text-lg font-black text-amber-300 font-mono">
            총 {{ gradeRecords.length }}건 (학생 {{ uniqueStudentsCount }}명)
          </div>
          <div class="text-[10px] text-indigo-200">
            상단 학년도: {{ academicYear }}학년도 고정 모드
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 필터 및 빠른 액션 바 -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
      <!-- 회차 선택 -->
      <div class="flex items-center gap-2">
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

      <!-- 성적일람표 등록 바로가기 -->
      <div class="flex items-center gap-2">
        <router-link
          to="/system-settings"
          class="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl no-underline transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <span>📤</span>
          <span>고{{ targetGrade }} 성적일람표 업로드</span>
        </router-link>
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
        [통합 시스템 설정] > [모의고사 성적 업로드] 메뉴에서 {{ targetGrade }}학년을 선택하고 성적일람표(PDF/엑셀)를 업로드해 주세요.
      </p>
    </div>

    <!-- 4. 주요 영역별 평균 등급 카드 그리드 -->
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
import { useStatData } from '../../composables/useStatData'
import { getAcademicSchoolYear } from '../../utils/mockExamReportParser'

const props = defineProps({
  grade: {
    type: Number,
    default: 2
  }
})

const targetGrade = computed(() => Number(props.grade) || 2)
const academicYear = computed(() => getAcademicSchoolYear(new Date()))

const { mockExamRecords, loadMockExamData } = useStatData()

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
</script>

