<template>
  <div v-if="univ" class="fixed inset-0 z-50 overflow-y-auto no-print" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" @click="$emit('close')"></div>

    <div class="flex min-h-full items-center justify-center p-3 text-center sm:p-4">
      <div class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-6 sm:w-full sm:max-w-5xl lg:max-w-6xl border border-slate-200 flex flex-col max-h-[92vh]">
        <!-- Modal Header -->
        <div class="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4.5 text-white flex items-center justify-between shrink-0 border-b border-indigo-900/40">
          <div class="flex items-center space-x-3.5">
            <div class="w-11 h-11 rounded-xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-white font-extrabold text-base shadow-inner shrink-0">
              {{ univ.name.slice(0, 2) }}
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-1.5">
                <h3 class="text-lg font-black text-white m-0 tracking-tight">{{ univ.name }}</h3>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/90 border border-white/20">
                  {{ univ.region }}
                </span>
                <span v-if="univ.isTopTier" class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  주요대/과기원
                </span>
                <span v-if="univ.isMedical" class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-400/20 text-rose-300 border border-rose-400/30" title="의·치·한·약·수 지원 건 포함">
                  의·약학 지원
                </span>
              </div>

              <!-- Top KPI Summary Bar -->
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mt-1">
                <span>
                  총 <strong class="text-white font-bold">{{ univStats.total }}건</strong> 지원 ({{ univ.uniqueStudents }}명)
                </span>
                <span class="text-slate-600">•</span>
                <span class="inline-flex items-center gap-1">
                  최종 합격: 
                  <strong class="text-emerald-400 font-extrabold font-mono">
                    {{ univStats.finalPassCount }}건 ({{ univStats.passRate }}%)
                  </strong>
                </span>
                <template v-if="univStats.stage1PassCount > 0">
                  <span class="text-slate-600">•</span>
                  <span class="inline-flex items-center gap-1 text-purple-300">
                    1차 합격: <strong class="font-bold font-mono">{{ univStats.stage1PassCount }}건</strong>
                  </span>
                </template>
                <template v-if="univStats.failCount > 0">
                  <span class="text-slate-600">•</span>
                  <span class="inline-flex items-center gap-1 text-rose-300">
                    불합격: <strong class="font-bold font-mono">{{ univStats.failCount }}건</strong>
                  </span>
                </template>
                <span class="text-slate-600">•</span>
                <span>
                  합격자 평균: 
                  <strong v-if="univStats.avgPassedGrade" class="text-amber-300 font-bold font-mono">{{ univStats.avgPassedGrade }}등급</strong>
                  <span v-else class="text-slate-400">-</span>
                </span>
                <span class="text-slate-600">•</span>
                <span>
                  전체 평균: 
                  <strong class="text-slate-200 font-mono">{{ univ.avgGrade }}등급</strong>
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button 
              type="button"
              @click="exportUnivToExcel"
              class="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-colors cursor-pointer"
              title="이 대학교 지원 현황 엑셀 다운로드"
            >
              <span>📥</span>
              <span>엑셀 저장</span>
            </button>
            <button 
              type="button"
              @click="$emit('close')" 
              class="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="닫기"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <!-- Filter & Info Toolbar -->
        <div class="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <!-- Filter Buttons (All, Final Pass, Stage 1 Pass, Fail) -->
          <div class="flex items-center bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              @click="resultFilter = 'ALL'"
              :class="[
                'px-3 py-1 rounded-lg font-bold transition-all cursor-pointer border-none text-xs',
                resultFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'bg-transparent text-slate-600 hover:text-slate-900'
              ]"
            >
              전체 ({{ univStats.total }})
            </button>
            <button
              type="button"
              @click="resultFilter = 'FINAL_PASS'"
              :class="[
                'px-3 py-1 rounded-lg font-bold transition-all cursor-pointer border-none text-xs flex items-center gap-1',
                resultFilter === 'FINAL_PASS'
                  ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                  : 'bg-transparent text-emerald-800 hover:bg-emerald-100/60'
              ]"
            >
              <span>●</span>
              <span>최종합격 ({{ univStats.finalPassCount }})</span>
            </button>
            <button
              v-if="univStats.stage1PassCount > 0"
              type="button"
              @click="resultFilter = 'STAGE1_PASS'"
              :class="[
                'px-3 py-1 rounded-lg font-bold transition-all cursor-pointer border-none text-xs flex items-center gap-1',
                resultFilter === 'STAGE1_PASS'
                  ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                  : 'bg-transparent text-purple-800 hover:bg-purple-100/60'
              ]"
            >
              <span>▲</span>
              <span>1차합격 ({{ univStats.stage1PassCount }})</span>
            </button>
            <button
              v-if="univStats.failCount > 0"
              type="button"
              @click="resultFilter = 'FAIL'"
              :class="[
                'px-3 py-1 rounded-lg font-bold transition-all cursor-pointer border-none text-xs flex items-center gap-1',
                resultFilter === 'FAIL'
                  ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                  : 'bg-transparent text-rose-800 hover:bg-rose-100/60'
              ]"
            >
              <span>✕</span>
              <span>최종불합격 ({{ univStats.failCount }})</span>
            </button>
          </div>

          <!-- Grade Ranges -->
          <div class="text-slate-500 flex items-center gap-3">
            <span v-if="univStats.avgPassedGrade" class="hidden sm:inline">
              합격자 평균: <strong class="text-emerald-700 font-bold font-mono">{{ univStats.avgPassedGrade }}등급</strong>
            </span>
            <span>
              내신 범위: 최고 <strong class="text-indigo-600 font-mono">{{ univ.bestGrade }}</strong> ~ 
              최저 <strong class="text-slate-700 font-mono">{{ univ.worstGrade }}</strong>
            </span>
          </div>
        </div>

        <!-- Applications Table -->
        <div class="p-6 overflow-y-auto flex-1">
          <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
            <table class="min-w-full divide-y divide-slate-200 text-xs">
              <thead class="bg-slate-50/90 font-semibold text-slate-700 select-none">
                <tr>
                  <th class="px-3 py-2.5 text-left whitespace-nowrap">학생</th>
                  <th class="px-3 py-2.5 text-left whitespace-nowrap">모집단위 (학과)</th>
                  <th class="px-3 py-2.5 text-left whitespace-nowrap">전형명</th>
                  <th class="px-3 py-2.5 text-center whitespace-nowrap bg-slate-100/70 font-bold text-slate-800">
                    전형결과
                  </th>
                  <th class="px-3 py-2.5 text-center whitespace-nowrap">계열</th>
                  <th class="px-3 py-2.5 text-center whitespace-nowrap">전교과(100)</th>
                  <th class="px-3 py-2.5 text-center whitespace-nowrap">국영수사/과</th>
                  <th class="px-3 py-2.5 text-center whitespace-nowrap">환산점수</th>
                  <th class="px-3 py-2.5 text-left whitespace-nowrap">최저학력기준</th>
                  <th class="px-3 py-2.5 text-center whitespace-nowrap">면접/발표일</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                <tr 
                  v-for="app in filteredApps" 
                  :key="app.id" 
                  :class="[
                    'transition-colors',
                    getResultInfo(app).rowClass
                  ]"
                >
                  <!-- 1. 학생 -->
                  <td class="px-3 py-2.5 whitespace-nowrap font-medium text-slate-800">
                    <span v-if="app.isGraduate || app.classNum === '졸업생'" class="inline-block px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] mr-1.5 font-bold">졸업 {{ app.studentNum }}</span>
                    <span v-else class="inline-block w-8 text-slate-400 text-[11px]">{{ app.classNum }}-{{ app.studentNum }}</span>
                    <span class="font-semibold">{{ maskName(app.name) }}</span>
                  </td>

                  <!-- 2. 모집단위 (학과) -->
                  <td class="px-3 py-2.5 font-medium text-slate-900 whitespace-nowrap">
                    {{ app.dept }}
                    <span v-if="app.quota" class="text-[10px] text-slate-400 ml-1 font-mono">({{ app.quota }}명)</span>
                  </td>

                  <!-- 3. 전형명 -->
                  <td class="px-3 py-2.5">
                    <div class="text-indigo-700 font-semibold">{{ app.admissionDetailType || app.admissionMajorType }}</div>
                    <div class="text-[10px] text-slate-400">{{ app.admissionType }}</div>
                  </td>

                  <!-- 4. [핵심] 전형결과 (1차합격, 최종합격, 최초/충원, 불합격, 등록 등) -->
                  <td class="px-3 py-2.5 text-center whitespace-nowrap bg-slate-50/40">
                    <div class="inline-flex flex-col items-center justify-center gap-0.5">
                      <div class="flex items-center gap-1">
                        <span 
                          :class="[
                            'px-2 py-0.5 rounded text-[11px] border leading-tight font-extrabold inline-block shadow-2xs',
                            getResultInfo(app).badgeClass
                          ]"
                        >
                          {{ getResultInfo(app).text }}
                        </span>
                        <span 
                          v-if="getResultInfo(app).isRegistered" 
                          class="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-indigo-600 text-white shadow-2xs"
                          title="최종 등록 완료"
                        >
                          등록
                        </span>
                      </div>
                      <span 
                        v-if="getResultInfo(app).sub" 
                        class="text-[10px] text-slate-500 font-medium"
                      >
                        {{ getResultInfo(app).sub }}
                      </span>
                    </div>
                  </td>

                  <!-- 5. 계열 -->
                  <td class="px-3 py-2.5 text-center whitespace-nowrap">
                    <span :class="[
                      'px-1.5 py-0.5 rounded text-[10px] font-medium',
                      app.field === '자연' ? 'bg-indigo-50 text-indigo-700' :
                      app.field === '인문' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
                    ]">
                      {{ app.field }}
                    </span>
                  </td>

                  <!-- 6. 전교과(100) -->
                  <td class="px-3 py-2.5 text-center font-mono">
                    <span :class="getResultInfo(app).type === 'FINAL_PASS' ? 'text-emerald-700 font-black text-[13px]' : 'text-slate-700 font-bold'">
                      {{ formatGrade(app.allSubjectGrade) }}
                    </span>
                  </td>

                  <!-- 7. 국영수사/과 -->
                  <td class="px-3 py-2.5 text-center text-slate-600 font-mono">
                    {{ formatGrade(app.mainSubjectGrade) }}
                  </td>

                  <!-- 8. 환산점수 -->
                  <td class="px-3 py-2.5 text-center text-slate-500 font-mono text-[11px]">
                    {{ app.univConvertedScore ? Number(app.univConvertedScore).toFixed(1) : '-' }}
                  </td>

                  <!-- 9. 최저학력기준 -->
                  <td class="px-3 py-2.5 text-[11px] text-slate-600 max-w-47.5 truncate" :title="app.minScoreReq">
                    <span v-if="app.hasMinScore" class="inline-block px-1 py-0.2 rounded bg-rose-50 text-rose-600 text-[10px] font-medium mr-1">최저</span>
                    {{ app.minScoreReq || '없음' }}
                  </td>

                  <!-- 10. 면접/발표일 -->
                  <td class="px-3 py-2.5 text-center whitespace-nowrap text-[10px] text-slate-500">
                    <div v-if="app.interviewDate" class="text-purple-600 font-semibold">면접: {{ app.interviewDate.slice(5) }}</div>
                    <div v-if="app.finalAnnounceDate">발표: {{ app.finalAnnounceDate.slice(5, 10) }}</div>
                    <div v-if="!app.interviewDate && !app.finalAnnounceDate">-</div>
                  </td>
                </tr>

                <!-- Empty State -->
                <tr v-if="filteredApps.length === 0">
                  <td colspan="10" class="px-4 py-12 text-center text-xs text-slate-400 bg-slate-50/50">
                    해당 결과 조건(필터)에 해당하는 지원 내역이 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="bg-slate-50 px-6 py-3.5 flex items-center justify-between border-t border-slate-200 shrink-0">
          <span class="text-xs text-slate-500">
            총 {{ univStats.total }}건 중 
            <strong class="text-slate-700 font-bold">{{ filteredApps.length }}건</strong> 표시 
            (최종 합격 <strong class="text-emerald-700">{{ univStats.finalPassCount }}건</strong>, 
            <template v-if="univStats.stage1PassCount > 0">1차 합격 <strong class="text-purple-700">{{ univStats.stage1PassCount }}건</strong>, </template>
            불합격 <strong class="text-rose-700">{{ univStats.failCount }}건</strong>)
          </span>
          <button 
            type="button"
            @click="$emit('close')" 
            class="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import { maskName, formatGrade } from '../composables/useStatData'

const props = defineProps({
  univ: {
    type: Object,
    default: null
  }
})

defineEmits(['close'])

const resultFilter = ref('ALL') // 'ALL', 'FINAL_PASS', 'STAGE1_PASS', 'FAIL'

/**
 * 전형 결과(1차합격, 최종합격, 최종불합격, 등록여부 등) 정밀 판정 로직
 */
function getResultInfo(app) {
  const s1 = String(app.stage1 || '').trim()
  const finalRes = String(app.finalStage || '').trim()
  let candRank = String(app.candidateRank || '').trim()
  if (candRank && !candRank.includes('예비') && !candRank.includes('후보') && !isNaN(candRank)) {
    candRank = `예비 ${candRank}번`
  } else if (candRank && !candRank.includes('번') && !candRank.includes('순위')) {
    candRank = `${candRank}번`
  }

  const isRegistered = app.registerStatus === 'Y' || String(app.registerStatus || '').trim() === '등록'
  const failReason = String(app.failReason || '').trim()

  // 1. 최종합격 여부
  const isFinalPass = (
    finalRes.includes('합격') || 
    finalRes.includes('충원') || 
    finalRes.includes('최초') || 
    finalRes.includes('추합') ||
    isRegistered
  ) && !finalRes.includes('불합')

  // 2. 1단계(1차) 합격 여부
  const isStage1Passed = (
    s1.includes('합격') || 
    s1.includes('통과') || 
    s1.includes('선발')
  ) && !s1.includes('불합')

  // Case 1: 최종합격 (최초합격 또는 충원합격)
  if (isFinalPass) {
    let text = '최종합격'
    let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300'
    let sub = ''

    if (finalRes.includes('최초')) {
      text = '최초합격'
      badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300'
    } else if (finalRes.includes('충원') || finalRes.includes('추합') || finalRes.includes('추가')) {
      text = '충원합격'
      badgeClass = 'bg-blue-100 text-blue-800 border-blue-300'
      if (candRank) sub = candRank
    } else {
      text = finalRes || '최종합격'
      if (candRank) sub = candRank
    }

    return {
      type: 'FINAL_PASS',
      text,
      sub,
      badgeClass,
      isRegistered,
      rowClass: 'bg-emerald-50/25 hover:bg-emerald-50/50'
    }
  }

  // Case 2: 1차 합격 (1단계 통과 후 최종 대기 또는 최종 불합격)
  if (isStage1Passed) {
    const isFinalFailed = finalRes.includes('불합') || failReason
    let text = '1차합격'
    let sub = ''
    if (isFinalFailed) {
      sub = candRank ? `최종불합 (${candRank})` : '최종 불합격'
    } else if (finalRes) {
      sub = candRank ? `${finalRes} (${candRank})` : finalRes
    } else {
      sub = '최종 대기'
    }

    return {
      type: 'STAGE1_PASS',
      text,
      sub,
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
      isRegistered: false,
      rowClass: 'bg-purple-50/20 hover:bg-purple-50/40'
    }
  }

  // Case 3: 불합격 (1차 불합격 또는 최종 불합격)
  const isFail = finalRes.includes('불합') || s1.includes('불합') || failReason
  if (isFail) {
    let text = '최종불합격'
    let sub = ''
    if (s1.includes('불합') && (!finalRes || finalRes.includes('1단계'))) {
      text = '1차불합격'
    }
    if (candRank) {
      sub = candRank
    } else if (failReason && !failReason.includes('불합격')) {
      sub = failReason
    }

    return {
      type: 'FAIL',
      text,
      sub,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      isRegistered: false,
      rowClass: 'hover:bg-slate-50'
    }
  }

  // Case 4: 미입력 or 대기
  return {
    type: 'PENDING',
    text: finalRes || s1 || '-',
    sub: candRank || '',
    badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
    isRegistered: false,
    rowClass: 'hover:bg-slate-50'
  }
}

// Compute university statistics for modal header
const univStats = computed(() => {
  if (!props.univ || !props.univ.apps) {
    return {
      total: 0,
      finalPassCount: 0,
      stage1PassCount: 0,
      failCount: 0,
      passRate: '0.0',
      avgPassedGrade: null,
      passedGrades: []
    }
  }

  const apps = props.univ.apps
  let finalPassCount = 0
  let stage1PassCount = 0
  let failCount = 0
  const passedGrades = []

  apps.forEach(app => {
    const info = getResultInfo(app)
    if (info.type === 'FINAL_PASS') {
      finalPassCount++
      const g = Number(app.allSubjectGrade)
      if (!isNaN(g) && g > 0) passedGrades.push(g)
    } else if (info.type === 'STAGE1_PASS') {
      stage1PassCount++
    } else if (info.type === 'FAIL') {
      failCount++
    }
  })

  const total = apps.length
  const passRate = total > 0 ? ((finalPassCount / total) * 100).toFixed(1) : '0.0'
  const avgPassedGrade = passedGrades.length > 0 
    ? (passedGrades.reduce((a, b) => a + b, 0) / passedGrades.length).toFixed(2)
    : null

  return {
    total,
    finalPassCount,
    stage1PassCount,
    failCount,
    passRate,
    avgPassedGrade,
    passedGrades
  }
})

// Filtered apps based on toolbar filter
const filteredApps = computed(() => {
  if (!props.univ || !props.univ.apps) return []
  if (resultFilter.value === 'ALL') return props.univ.apps
  return props.univ.apps.filter(app => {
    const info = getResultInfo(app)
    return info.type === resultFilter.value
  })
})

// Excel Export function for this university's applicants
function exportUnivToExcel() {
  if (!props.univ || !props.univ.apps || props.univ.apps.length === 0) return
  const data = props.univ.apps.map(app => {
    const res = getResultInfo(app)
    return {
      '학생': `${app.classNum || ''}-${app.studentNum || ''} ${maskName(app.name)}`,
      '모집단위': app.dept,
      '전형명': app.admissionDetailType || app.admissionMajorType || app.admissionType,
      '전형결과': res.text + (res.sub ? ` (${res.sub})` : '') + (res.isRegistered ? ' [등록]' : ''),
      '계열': app.field,
      '전교과(100)': app.allSubjectGrade,
      '국영수사/과': app.mainSubjectGrade,
      '환산점수': app.univConvertedScore || '-',
      '최저학력기준': app.minScoreReq || '없음',
      '1단계': app.stage1 || '-',
      '최종단계': app.finalStage || '-',
      '최초후보순위': app.candidateRank || '-',
      '등록여부': app.registerStatus || '-',
      '면접일자': app.interviewDate || '-',
      '최종발표일': app.finalAnnounceDate || '-'
    }
  })
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `${props.univ.name.slice(0, 25)}_지원상세`)
  XLSX.writeFile(wb, `${props.univ.name}_지원결과상세_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
</script>
