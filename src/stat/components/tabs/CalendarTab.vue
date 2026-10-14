<template>
  <div class="space-y-6">
    <!-- Top Filter Controls -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <!-- Month & Type Filters -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button 
            v-for="m in ['ALL', '10', '11', '12']" 
            :key="m"
            @click="selectedMonth = m"
            :class="[
              'px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
              selectedMonth === m ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            {{ m === 'ALL' ? '전체 일정' : `${m}월` }}
          </button>
        </div>

        <div class="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button 
            v-for="t in examTypes" 
            :key="t.id"
            @click="selectedExamType = t.id"
            :class="[
              'px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
              selectedExamType === t.id ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            {{ t.label }}
          </button>
        </div>
      </div>

      <!-- Duplicate Alert Indicator -->
      <div v-if="duplicateSchedules.length > 0" class="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs">
        <span class="text-sm">⚠️</span>
        <span class="font-medium">동일 일자 중복 시험 의심 학생: <strong class="text-amber-900 font-bold">{{ duplicateSchedules.length }}건</strong></span>
      </div>
    </div>

    <!-- Duplicate Schedule Warning Box (If any) -->
    <div v-if="duplicateSchedules.length > 0" class="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 shadow-xs">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-bold flex items-center text-sm text-amber-900">
          <svg class="w-4 h-4 mr-1.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          대학별고사 일정 중복 주의 학생 목록 (지도교사 확인 필요)
        </h4>
        <span class="text-[11px] text-amber-700">같은 날짜에 2개 이상의 대학 면접/실기가 배정된 경우입니다.</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        <div v-for="d in duplicateSchedules" :key="d.key" class="p-2.5 rounded-xl bg-white border border-amber-200/60 shadow-2xs">
          <div class="flex items-center justify-between font-semibold text-slate-800">
            <span>
              <span v-if="d.student.isGraduate" class="px-1 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] mr-1">졸업</span>
              <span v-else class="text-slate-500 mr-1">{{ d.student.classNum }}-{{ d.student.studentNum }}</span>
              {{ maskName(d.student.name) }}
            </span>
            <span class="text-rose-600 font-mono text-[11px]">{{ d.date }}</span>
          </div>
          <div class="mt-1.5 space-y-1">
            <div v-for="(app, idx) in d.apps" :key="idx" class="text-[11px] text-slate-600 flex items-center justify-between">
              <span class="truncate font-medium">{{ app.univName }} ({{ app.dept }})</span>
              <span class="text-[10px] text-purple-600 whitespace-nowrap ml-1 font-semibold">{{ app.type }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline Schedule Cards -->
    <div class="space-y-4">
      <div 
        v-for="group in dateGroups" 
        :key="group.date"
        class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
      >
        <!-- Date Header Banner -->
        <div class="bg-slate-50/80 px-5 py-3 border-b border-slate-200/70 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex flex-col items-center justify-center font-bold">
              <span class="text-[10px] uppercase opacity-80">{{ getMonthLabel(group.date) }}</span>
              <span class="text-sm leading-none">{{ getDayLabel(group.date) }}</span>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="font-bold text-slate-900 text-sm">{{ group.date }}</h3>
                <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                  {{ group.univs.length }}개 대학
                </span>
                <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700">
                  {{ group.apps.length }}명 응시
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                해당 대학: {{ group.univs.join(', ') }}
              </p>
            </div>
          </div>

          <button 
            @click="toggleGroup(group.date)"
            class="text-xs font-medium text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            {{ isGroupOpen(group.date) ? '접기' : '명단 보기' }}
          </button>
        </div>

        <!-- Applications Table under Date (Expandable) -->
        <div v-if="isGroupOpen(group.date)" class="p-4 border-t border-slate-100">
          <div class="overflow-x-auto rounded-xl border border-slate-200">
            <table class="min-w-full divide-y divide-slate-200 text-xs">
              <thead class="bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th class="px-3 py-2 text-left">학생</th>
                  <th class="px-3 py-2 text-left">대학교</th>
                  <th class="px-3 py-2 text-left">모집단위</th>
                  <th class="px-3 py-2 text-left">전형명</th>
                  <th class="px-3 py-2 text-center">유형</th>
                  <th class="px-3 py-2 text-center">전교과(100)</th>
                  <th class="px-3 py-2 text-left">최저학력기준</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                <tr v-for="app in group.apps" :key="app.id" class="hover:bg-slate-50">
                  <td class="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                    <span v-if="app.isGraduate || app.classNum === '졸업생'" class="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] mr-1 border border-amber-300 font-bold">졸업 {{ app.studentNum }}</span>
                    <span v-else class="text-slate-500 mr-1">{{ app.classNum }}-{{ app.studentNum }}</span>
                    {{ maskName(app.name) }}
                  </td>
                  <td class="px-3 py-2 font-semibold text-indigo-700 whitespace-nowrap">
                    {{ app.univName }}
                  </td>
                  <td class="px-3 py-2 font-medium text-slate-900">
                    {{ app.dept }}
                  </td>
                  <td class="px-3 py-2 text-slate-600">
                    {{ app.admissionDetailType || app.admissionMajorType }}
                  </td>
                  <td class="px-3 py-2 text-center whitespace-nowrap">
                    <span :class="[
                      'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                      app.examType === '면접' ? 'bg-purple-50 text-purple-700' :
                      app.examType === '실기' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    ]">
                      {{ app.examType }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-center font-bold text-slate-800">
                    {{ formatGrade(app.allSubjectGrade) }}
                  </td>
                  <td class="px-3 py-2 text-[11px] text-slate-500 max-w-[200px] truncate" :title="app.minScoreReq">
                    {{ app.minScoreReq || '없음' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-if="dateGroups.length === 0" class="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <div class="text-3xl mb-2">🗓️</div>
        <div class="text-sm font-bold text-slate-700">해당 조건에 등록된 시험 일정이 없습니다.</div>
        <div class="text-xs text-slate-400 mt-1">상단 월별 및 전형 유형 필터를 변경해보세요.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData, maskName, formatGrade } from '../../composables/useStatData'

const { filteredApplications } = useData()

const selectedMonth = ref('ALL')
const selectedExamType = ref('ALL')
const openGroups = ref(new Set())

const examTypes = [
  { id: 'ALL', label: '전체 (면접/실기/논술)' },
  { id: 'interview', label: '🎙️ 면접고사' },
  { id: 'practical', label: '🎨 실기고사' },
  { id: 'essay', label: '✍️ 논술고사' }
]

const toggleGroup = (date) => {
  if (openGroups.value.has(date)) {
    openGroups.value.delete(date)
  } else {
    openGroups.value.add(date)
  }
}

const isGroupOpen = (date) => openGroups.value.has(date)

const getMonthLabel = (dateStr) => {
  const parts = dateStr.split('-')
  return parts.length >= 2 ? `${parts[1]}월` : '일정'
}

const getDayLabel = (dateStr) => {
  const parts = dateStr.split('-')
  return parts.length >= 3 ? parts[2].slice(0, 2) : ''
}

// Extract all exam instances
const examEvents = computed(() => {
  const events = []

  filteredApplications.value.forEach(app => {
    // 1. Interview
    if (app.interviewDate && app.interviewDate.trim()) {
      const dates = extractDates(app.interviewDate)
      dates.forEach(d => {
        events.push({
          ...app,
          date: d,
          rawDate: app.interviewDate,
          examType: '면접'
        })
      })
    }
    // 2. Practical
    if (app.practicalDate && app.practicalDate.trim()) {
      const dates = extractDates(app.practicalDate)
      dates.forEach(d => {
        events.push({
          ...app,
          date: d,
          rawDate: app.practicalDate,
          examType: '실기'
        })
      })
    }
    // 3. Essay
    if (app.essayDate && app.essayDate.trim()) {
      const dates = extractDates(app.essayDate)
      dates.forEach(d => {
        events.push({
          ...app,
          date: d,
          rawDate: app.essayDate,
          examType: '논술'
        })
      })
    }
  })

  return events
})

function extractDates(dateStr) {
  // e.g. "2026-10-17 ~ 2026-10-17" -> ["2026-10-17"]
  const matches = dateStr.match(/\d{4}-\d{2}-\d{2}/g)
  if (!matches) return [dateStr.trim()]
  return Array.from(new Set(matches))
}

// Duplicate Schedule Detector
const duplicateSchedules = computed(() => {
  const studentDateMap = new Map()

  examEvents.value.forEach(ev => {
    const key = `${ev.studentKey}_${ev.date}`
    if (!studentDateMap.has(key)) {
      studentDateMap.set(key, {
        key,
        date: ev.date,
        student: { name: ev.name, classNum: ev.classNum, studentNum: ev.studentNum, isGraduate: ev.isGraduate || ev.classNum === '졸업생' },
        apps: []
      })
    }
    studentDateMap.get(key).apps.push({
      univName: ev.univName,
      dept: ev.dept,
      type: ev.examType
    })
  })

  return Array.from(studentDateMap.values()).filter(item => {
    // Check if applied to multiple distinct universities on the same day
    const univSet = new Set(item.apps.map(a => a.univName))
    return univSet.size > 1
  })
})

// Group Events by Date
const dateGroups = computed(() => {
  let list = examEvents.value

  // Month filter
  if (selectedMonth.value !== 'ALL') {
    list = list.filter(e => e.date.includes(`-${selectedMonth.value}-`))
  }

  // Exam type filter
  if (selectedExamType.value === 'interview') {
    list = list.filter(e => e.examType === '면접')
  } else if (selectedExamType.value === 'practical') {
    list = list.filter(e => e.examType === '실기')
  } else if (selectedExamType.value === 'essay') {
    list = list.filter(e => e.examType === '논술')
  }

  const map = new Map()
  list.forEach(item => {
    if (!map.has(item.date)) {
      map.set(item.date, {
        date: item.date,
        apps: [],
        univsSet: new Set()
      })
    }
    const grp = map.get(item.date)
    grp.apps.push(item)
    grp.univsSet.add(item.univName.replace(/대학교|\(.*\)/g, ''))
  })

  return Array.from(map.values())
    .map(g => ({
      ...g,
      univs: Array.from(g.univsSet)
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
})
</script>
