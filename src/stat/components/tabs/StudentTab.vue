<template>
  <div class="space-y-6">
    <!-- Student Search & Class Filter Header -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center space-x-2">
        <!-- Class Selector -->
        <select 
          v-model="studentClassFilter" 
          class="bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="ALL">전체 학급 (재학생 + 졸업생)</option>
          <option value="ENROLLED">재학생 전체 (1~11반)</option>
          <option v-for="c in 11" :key="c" :value="c">{{ c }}반</option>
          <option value="졸업생">🎓 졸업생</option>
        </select>

        <!-- Search Input -->
        <div class="relative w-56 sm:w-64">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="학생 이름 또는 번호 검색..." 
            class="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
      </div>

      <div class="text-xs text-slate-500">
        검색된 학생: <strong class="text-indigo-600 font-bold">{{ studentList.length }}</strong>명 / 전체 246명
      </div>
    </div>

    <!-- Main Content: Student Master-Detail Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left: Student List Sidebar -->
      <div class="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col max-h-[780px]">
        <div class="p-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>학생 명단</span>
          <span>반-번호 순 정렬</span>
        </div>

        <div class="overflow-y-auto divide-y divide-slate-100 flex-1">
          <button 
            v-for="st in studentList" 
            :key="st.key"
            @click="activeStudentKey = st.key"
            :class="[
              'w-full text-left p-3.5 transition-all flex items-center justify-between cursor-pointer',
              activeStudentKey === st.key 
                ? 'bg-indigo-50/80 border-l-4 border-indigo-600' 
                : 'hover:bg-slate-50'
            ]"
          >
            <div class="flex items-center space-x-3">
              <div :class="[
                'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0',
                st.isGraduate 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : (activeStudentKey === st.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700')
              ]">
                {{ st.isGraduate ? '졸업' : `${st.classNum}-${st.studentNum}` }}
              </div>
              <div class="truncate">
                <div class="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>{{ maskName(st.name) }}</span>
                  <span v-if="st.isGraduate" class="px-1.5 py-0.2 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-semibold">졸업생</span>
                  <span v-if="st.hasRec" class="px-1 py-0.2 rounded text-[10px] bg-purple-50 text-purple-700 border border-purple-200">추천</span>
                  <span v-if="st.hasRural" class="px-1 py-0.2 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">농어촌</span>
                </div>
                <div class="text-[11px] text-slate-400 mt-0.5 truncate">
                  <span v-if="st.isGraduate" class="text-slate-600 font-medium mr-1.5">학번 {{ st.studentNum }}</span>
                  전교과 <strong class="text-slate-600">{{ formatGrade(st.allSubjectGrade) }}</strong> | 국영수사과 <strong class="text-slate-600">{{ formatGrade(st.mainSubjectGrade) }}</strong>
                </div>
              </div>
            </div>

            <div class="text-right shrink-0">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700">
                {{ st.apps.length }}건
              </span>
            </div>
          </button>

          <div v-if="studentList.length === 0" class="p-8 text-center text-xs text-slate-400">
            검색 조건에 맞는 학생이 없습니다.
          </div>
        </div>
      </div>

      <!-- Right: Detailed Portfolio View for Selected Student -->
      <div v-if="currentStudent" class="lg:col-span-8 space-y-5">
        <!-- Student Overview Profile Card -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div class="flex items-center space-x-4">
              <div :class="[
                'w-14 h-14 rounded-2xl text-white flex items-center justify-center font-bold text-lg shadow-md',
                currentStudent.isGraduate 
                  ? 'bg-gradient-to-tr from-amber-600 to-amber-400 shadow-amber-500/20' 
                  : 'bg-gradient-to-tr from-indigo-600 to-sky-400 shadow-indigo-500/20'
              ]">
                {{ currentStudent.isGraduate ? '졸' : currentStudent.name.slice(0, 1) }}
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-1.5">
                  <h3 class="text-lg font-bold text-slate-900">{{ maskName(currentStudent.name) }}</h3>
                  <span v-if="currentStudent.isGraduate" class="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                    졸업생 (학번: {{ currentStudent.studentNum }}{{ currentStudent.grade ? ' / ' + currentStudent.grade + '년 졸업' : '' }})
                  </span>
                  <span v-else class="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                    3학년 {{ currentStudent.classNum }}반 {{ currentStudent.studentNum }}번
                  </span>
                  <span v-if="currentStudent.hasRec" class="px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    학교장추천 배정
                  </span>
                  <span v-if="currentStudent.hasRural" class="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    농어촌전형 출원
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-1">
                  총 <span class="font-bold text-indigo-600">{{ currentStudent.apps.length }}건</span> 수시 지원 (수도권 {{ currentStudent.metroAppsCount }}건 / {{ currentStudent.metroRate }}%)
                </p>
              </div>
            </div>

            <!-- Grade Badges -->
            <div class="flex items-center space-x-2">
              <div class="text-right bg-indigo-50/70 border border-indigo-100 rounded-xl px-3 py-2">
                <div class="text-[10px] text-indigo-600 font-medium">전교과(100) 등급</div>
                <div class="text-base font-bold text-indigo-700">{{ formatGrade(currentStudent.allSubjectGrade) }}</div>
              </div>
              <div class="text-right bg-sky-50/70 border border-sky-100 rounded-xl px-3 py-2">
                <div class="text-[10px] text-sky-600 font-medium">국영수사/과 등급</div>
                <div class="text-base font-bold text-sky-700">{{ formatGrade(currentStudent.mainSubjectGrade) }}</div>
              </div>
            </div>
          </div>

          <!-- Subject Specific Grades Breakdown -->
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4 text-center">
            <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div class="text-[10px] text-slate-400">국어</div>
              <div class="text-xs font-bold text-slate-800">{{ formatGrade(currentStudent.korGrade) }}</div>
            </div>
            <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div class="text-[10px] text-slate-400">영어</div>
              <div class="text-xs font-bold text-slate-800">{{ formatGrade(currentStudent.engGrade) }}</div>
            </div>
            <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div class="text-[10px] text-slate-400">수학</div>
              <div class="text-xs font-bold text-slate-800">{{ formatGrade(currentStudent.mathGrade) }}</div>
            </div>
            <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div class="text-[10px] text-slate-400">사회</div>
              <div class="text-xs font-bold text-slate-800">{{ formatGrade(currentStudent.socGrade) }}</div>
            </div>
            <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div class="text-[10px] text-slate-400">과학</div>
              <div class="text-xs font-bold text-slate-800">{{ formatGrade(currentStudent.sciGrade) }}</div>
            </div>
            <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div class="text-[10px] text-slate-400">국영수</div>
              <div class="text-xs font-bold text-slate-800">{{ formatGrade(currentStudent.koreanMathEnglish) }}</div>
            </div>
          </div>
        </div>

        <!-- 6 Application Cards Grid -->
        <div>
          <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>수시 지원 카드 (총 {{ currentStudent.apps.length }}장)</span>
            <span class="text-[11px] font-normal text-slate-400">대교협 제출 최종 원서 내역</span>
          </h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="(app, index) in currentStudent.apps" 
              :key="app.id"
              class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-colors flex flex-col justify-between relative overflow-hidden"
            >
              <!-- Card Index Ribbon -->
              <div class="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-700 font-bold text-xs rounded-bl-xl border-l border-b border-indigo-100">
                #{{ index + 1 }}
              </div>

              <div>
                <!-- Univ & Dept Header -->
                <div class="flex items-center space-x-2 pr-6">
                  <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {{ app.region }}
                  </span>
                  <span :class="[
                    'text-[11px] font-medium px-2 py-0.5 rounded-full',
                    app.admissionType.includes('교과') ? 'bg-indigo-50 text-indigo-700' :
                    app.admissionType.includes('종합') ? 'bg-sky-50 text-sky-700' :
                    app.admissionType.includes('실기') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  ]">
                    {{ app.admissionType }}
                  </span>
                </div>

                <div class="mt-2.5">
                  <h5 class="text-base font-bold text-slate-900 leading-snug">{{ app.univName }}</h5>
                  <div class="text-xs font-semibold text-indigo-600 mt-0.5">
                    {{ app.dept }}
                    <span v-if="app.quota" class="text-slate-400 font-normal">({{ app.quota }}명 모집)</span>
                  </div>
                </div>

                <!-- Admission Detail Name -->
                <div class="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div class="font-medium text-slate-800">{{ app.admissionDetailType || app.admissionMajorType }}</div>
                  <div class="text-[11px] text-slate-400 mt-0.5">{{ app.selectionMethod || '전형 방식 미지정' }}</div>
                </div>

                <!-- Minimum Criteria -->
                <div class="mt-2 text-[11px] p-2 rounded-lg bg-amber-50/50 border border-amber-200/60 text-amber-900">
                  <span class="font-semibold text-amber-800">최저기준: </span>
                  <span>{{ app.minScoreReq || '수능최저학력기준 없음' }}</span>
                </div>
              </div>

              <!-- Footer: Converted Scores & Key Exam Dates -->
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div>
                  대학환산: <strong class="text-slate-800">{{ app.univConvertedScore ? Number(app.univConvertedScore).toFixed(1) : '-' }}점</strong>
                  <span v-if="app.univConvertedGrade" class="ml-1 text-slate-400">({{ app.univConvertedGrade }}등급)</span>
                </div>
                <div v-if="app.interviewDate" class="text-purple-600 font-semibold">
                  면접: {{ app.interviewDate.slice(5) }}
                </div>
                <div v-else-if="app.finalAnnounceDate" class="text-slate-400">
                  발표: {{ app.finalAnnounceDate.slice(5, 10) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData, maskName, formatGrade } from '../../composables/useStatData'

const { applications } = useData()

const studentClassFilter = ref('ALL')
const searchQuery = ref('')
const activeStudentKey = ref('')

// Aggregate all applications by student
const studentsMap = computed(() => {
  const map = new Map()

  applications.value.forEach(app => {
    const isGraduate = app.isGraduate || app.classNum === '졸업생'
    const key = app.studentKey
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: app.name,
        classNum: app.classNum,
        studentNum: app.studentNum,
        grade: app.grade,
        isGraduate,
        korGrade: app.korGrade,
        engGrade: app.engGrade,
        mathGrade: app.mathGrade,
        socGrade: app.socGrade,
        sciGrade: app.sciGrade,
        allSubjectGrade: app.allSubjectGrade,
        mainSubjectGrade: app.mainSubjectGrade,
        koreanMathEnglish: app.koreanMathEnglish,
        hasRec: false,
        hasRural: false,
        apps: []
      })
    }
    const st = map.get(key)
    st.apps.push(app)
    if (app.isRecommendation) st.hasRec = true
    if (app.isRural) st.hasRural = true
  })

  return map
})

// Filtered student list
const studentList = computed(() => {
  let list = Array.from(studentsMap.value.values())

  // Class filter
  if (studentClassFilter.value === 'ENROLLED') {
    list = list.filter(s => !s.isGraduate && s.classNum !== '졸업생')
  } else if (studentClassFilter.value === '졸업생' || studentClassFilter.value === 'GRADUATE') {
    list = list.filter(s => s.isGraduate || s.classNum === '졸업생')
  } else if (studentClassFilter.value !== 'ALL') {
    list = list.filter(s => String(s.classNum) === String(studentClassFilter.value))
  }

  // Search query
  if (searchQuery.value.trim()) {
    const kw = searchQuery.value.trim().toLowerCase()
    list = list.filter(s => {
      const matchName = s.name.toLowerCase().includes(kw)
      const matchNum = String(s.studentNum).includes(kw)
      const matchTag = s.isGraduate ? '졸업생'.includes(kw) : `${s.classNum}-${s.studentNum}`.includes(kw)
      return matchName || matchNum || matchTag
    })
  }

  // Sort by Class then Student Number (Current students first, graduates grouped at end)
  list.sort((a, b) => {
    if (a.isGraduate && !b.isGraduate) return 1
    if (!a.isGraduate && b.isGraduate) return -1
    if (!a.isGraduate && !b.isGraduate) {
      if (a.classNum !== b.classNum) return a.classNum - b.classNum
      return a.studentNum - b.studentNum
    }
    return String(a.studentNum).localeCompare(String(b.studentNum))
  })

  return list
})

// Current selected student
const currentStudent = computed(() => {
  if (activeStudentKey.value && studentsMap.value.has(activeStudentKey.value)) {
    const st = studentsMap.value.get(activeStudentKey.value)
    const metroAppsCount = st.apps.filter(a => a.isMetro).length
    const metroRate = st.apps.length > 0 ? ((metroAppsCount / st.apps.length) * 100).toFixed(0) : '0'
    return {
      ...st,
      metroAppsCount,
      metroRate
    }
  }
  // Default to first student in list
  if (studentList.value.length > 0) {
    const first = studentList.value[0]
    const metroAppsCount = first.apps.filter(a => a.isMetro).length
    const metroRate = first.apps.length > 0 ? ((metroAppsCount / first.apps.length) * 100).toFixed(0) : '0'
    return {
      ...first,
      metroAppsCount,
      metroRate
    }
  }
  return null
})
</script>
