<template>
  <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm transition-all duration-300">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80 mb-2">
          <span>🏛️</span>
          <span>대학 그룹별 전형 심층 분석</span>
          <span class="text-blue-300">|</span>
          <span class="text-slate-500 font-semibold">그룹별 비교 대시보드</span>
        </div>
        <h3 class="text-lg sm:text-xl font-black text-slate-900 tracking-tight m-0">
          주요 대학 그룹별 합격률 & 전형 유불리 분석
        </h3>
        <p class="text-xs text-slate-500 m-0 mt-1 leading-relaxed">
          주요 대학 그룹별 일반 vs 농어촌, 학생부교과 vs 종합, 수능최저 충족 여부 및 충원율을 비교 분석합니다.
        </p>
      </div>

      <!-- Quick Metrics Summary -->
      <div class="flex items-center gap-2 shrink-0 self-start md:self-center">
        <div class="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-right">
          <span class="text-[10px] text-slate-600 block">선택 그룹 총 지원</span>
          <span class="text-sm font-black text-indigo-700 font-mono">{{ activeGroupStats.total }}건</span>
        </div>
        <div class="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-right">
          <span class="text-[10px] text-emerald-800 block">최종 합격률</span>
          <span class="text-sm font-black text-emerald-700 font-mono">{{ activeGroupStats.overallRate }}%</span>
        </div>
      </div>
    </div>

    <!-- University Group Hover Selector Bar -->
    <div class="pt-5 pb-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
          <span>⚡</span>
          <span>대학 그룹 라인 선택</span>
        </span>
        <span v-if="isLocked" class="text-[11px] font-bold text-blue-600 flex items-center gap-1">
          <span>🔒 {{ activeGroup.title }} 고정됨</span>
          <button
            @click="unlockGroup"
            class="ml-1 text-slate-400 hover:text-slate-600 underline cursor-pointer bg-transparent border-none text-[11px]"
          >
            고정 해제
          </button>
        </span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <button
          v-for="group in UNIV_GROUPS_CONFIG"
          :key="group.id"
          type="button"
          @mouseenter="handleMouseEnter(group.id)"
          @mouseleave="handleMouseLeave"
          @click="handleClick(group.id)"
          :class="[
            'p-3 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between cursor-pointer border',
            activeGroupId === group.id
              ? 'bg-gradient-to-b from-blue-600 to-indigo-700 text-white border-blue-700 shadow-md scale-[1.02] ring-2 ring-blue-300'
              : 'bg-slate-50 hover:bg-blue-50/70 text-slate-800 border-slate-200/90 hover:border-blue-300'
          ]"
        >
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-base">{{ group.emoji }}</span>
              <span
                :class="[
                  'text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full',
                  activeGroupId === group.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                ]"
              >
                {{ groupStatsMap[group.id]?.total || 0 }}건
              </span>
            </div>
            <div class="font-black text-xs tracking-tight leading-tight">{{ group.title }}</div>
            <div
              :class="[
                'text-[10px] mt-0.5 truncate font-medium',
                activeGroupId === group.id ? 'text-blue-100' : 'text-slate-600'
              ]"
              :title="group.univsSummary"
            >
              {{ group.univsSummary }}
            </div>
          </div>

          <div
            :class="[
              'mt-2 pt-1.5 border-t text-[11px] font-bold flex justify-between items-center',
              activeGroupId === group.id ? 'border-white/20 text-white' : 'border-slate-200 text-slate-600'
            ]"
          >
            <span>합격률</span>
            <span class="font-mono text-xs font-black">{{ groupStatsMap[group.id]?.overallRate || 0 }}%</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Main Content: Charts & Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 pt-4 border-t border-slate-100 items-stretch">
      <!-- Left: Two Comparison Bar Charts (일반 vs 농어촌+기회 / 교과 vs 종합) -->
      <div class="lg:col-span-7 flex flex-col gap-5">
        <!-- 1) 일반전형 vs 농어촌+기회균형 합격률 -->
        <div class="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-black text-slate-900">
                  ① 일반전형 vs 농어촌·기회균형 합격률
                </span>
                <span class="text-[11px] text-slate-600">({{ activeGroup.title }})</span>
              </div>
              <p class="text-[11px] text-slate-600 m-0">특별전형 수혜에 따른 합격률 상승 폭 비교</p>
            </div>
            <span
              :class="[
                'px-2.5 py-1 rounded-lg text-xs font-black self-start sm:self-center',
                ruralAdvantageDelta >= 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-200 text-slate-700'
              ]"
            >
              {{ ruralAdvantageText }}
            </span>
          </div>

          <div class="h-36">
            <Bar :data="generalVsRuralChartData" :options="horizontalBarOptions" />
          </div>

          <!-- Bottom Metric Row -->
          <div class="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200 text-xs">
            <div class="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
              <span class="text-slate-600 font-semibold">일반전형</span>
              <span class="font-mono font-bold text-slate-800">
                <span class="text-sm text-slate-900">{{ activeGroupStats.general.rate }}%</span>
                <span class="text-[11px] text-slate-600 ml-1">({{ activeGroupStats.general.passed }}/{{ activeGroupStats.general.total }}건)</span>
              </span>
            </div>
            <div class="bg-white p-2.5 rounded-xl border border-amber-200 flex justify-between items-center">
              <span class="text-amber-700 font-bold">농어촌+기회균형</span>
              <span class="font-mono font-bold text-slate-800">
                <span class="text-sm text-amber-600">{{ activeGroupStats.ruralOrOpp.rate }}%</span>
                <span class="text-[11px] text-slate-600 ml-1">({{ activeGroupStats.ruralOrOpp.passed }}/{{ activeGroupStats.ruralOrOpp.total }}건)</span>
              </span>
            </div>
          </div>
        </div>

        <!-- 2) 학생부교과 vs 학생부종합 합격률 -->
        <div class="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-black text-slate-900">
                  ② 학생부교과 vs 학생부종합 합격률
                </span>
                <span class="text-[11px] text-slate-600">({{ activeGroup.title }})</span>
              </div>
              <p class="text-[11px] text-slate-600 m-0">정량평가(교과)와 정성평가(종합)의 실질 합격 유불리</p>
            </div>
            <span
              :class="[
                'px-2.5 py-1 rounded-lg text-xs font-black self-start sm:self-center',
                gyogwaAdvantageDelta >= 0 ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
              ]"
            >
              {{ gyogwaAdvantageText }}
            </span>
          </div>

          <div class="h-36">
            <Bar :data="gyogwaVsJonghapChartData" :options="horizontalBarOptions" />
          </div>

          <!-- Bottom Metric Row -->
          <div class="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200 text-xs">
            <div class="bg-white p-2.5 rounded-xl border border-blue-200 flex justify-between items-center">
              <span class="text-blue-700 font-bold">학생부교과</span>
              <span class="font-mono font-bold text-slate-800">
                <span class="text-sm text-blue-600">{{ activeGroupStats.gyogwa.rate }}%</span>
                <span class="text-[11px] text-slate-600 ml-1">({{ activeGroupStats.gyogwa.passed }}/{{ activeGroupStats.gyogwa.total }}건)</span>
              </span>
            </div>
            <div class="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
              <span class="text-slate-600 font-semibold">학생부종합</span>
              <span class="font-mono font-bold text-slate-800">
                <span class="text-sm text-amber-600">{{ activeGroupStats.jonghap.rate }}%</span>
                <span class="text-[11px] text-slate-600 ml-1">({{ activeGroupStats.jonghap.passed }}/{{ activeGroupStats.jonghap.total }}건)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: 수능최저 영향도 & 충원율 게이지 + 합격 대학 현황 (페이지 1, 6 연계) -->
      <div class="lg:col-span-5 flex flex-col gap-4">
        <!-- 3) 수능최저 유/무 및 충원율 듀얼 카드 -->
        <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 class="text-xs font-bold text-slate-800 m-0 flex items-center gap-1.5">
              <span>🎯</span>
              <span>수능최저 유/무 & 충원 합격 비중</span>
            </h4>
            <span class="text-[10px] text-slate-600 font-semibold">2026학년도 입결</span>
          </div>

          <!-- Indicator 1: 수능최저 유/무 합격률 -->
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-slate-700 flex items-center gap-1">
                <span>수능최저 영향도</span>
                <span class="text-[10px] text-slate-600 font-normal">(반영 전형 vs 미반영 전형)</span>
              </span>
              <span class="font-bold text-slate-800 text-[11px]">
                최저 반영이 {{ minScoreRateDelta }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div class="text-[10px] text-slate-600 font-medium">수능최저 있음(O)</div>
                <div class="text-base font-black text-slate-800 font-mono mt-0.5">
                  {{ activeGroupStats.hasMinScore.rate }}%
                </div>
                <div class="text-[10px] text-slate-600">({{ activeGroupStats.hasMinScore.passed }}/{{ activeGroupStats.hasMinScore.total }}건)</div>
              </div>
              <div class="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
                <div class="text-[10px] text-indigo-700 font-medium">수능최저 없음(X)</div>
                <div class="text-base font-black text-indigo-700 font-mono mt-0.5">
                  {{ activeGroupStats.noMinScore.rate }}%
                </div>
                <div class="text-[10px] text-slate-600">({{ activeGroupStats.noMinScore.passed }}/{{ activeGroupStats.noMinScore.total }}건)</div>
              </div>
            </div>
          </div>

          <!-- Indicator 2: 최초합격 vs 충원합격(추합) 비율 -->
          <div class="space-y-2 pt-2 border-t border-slate-100">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-slate-700 flex items-center gap-1">
                <span>합격 유형 구성비</span>
                <span class="text-[10px] text-slate-600 font-normal">(합격자 중 최초 vs 충원)</span>
              </span>
              <span class="font-mono font-bold text-indigo-600 text-xs">
                충원 합격 비중 {{ activeGroupStats.candidateRate }}%
              </span>
            </div>

            <!-- Two-color Stacked Ratio Bar -->
            <div class="space-y-1">
              <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  class="h-full bg-slate-700 transition-all duration-500"
                  :style="{ width: `${activeGroupStats.initialPassRate}%` }"
                  title="최초합격"
                ></div>
                <div
                  class="h-full bg-amber-500 transition-all duration-500"
                  :style="{ width: `${activeGroupStats.candidateRate}%` }"
                  title="충원합격(추합)"
                ></div>
              </div>
              <div class="flex justify-between text-[10px] font-semibold text-slate-500 px-0.5">
                <span class="flex items-center gap-1 text-slate-700">
                  <span class="w-2 h-2 rounded-full bg-slate-700"></span> 최초합격 {{ activeGroupStats.initialPassRate }}% ({{ activeGroupStats.initialPassCount }}건)
                </span>
                <span class="flex items-center gap-1 text-amber-700">
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span> 충원합격 {{ activeGroupStats.candidateRate }}% ({{ activeGroupStats.candidateCount }}건)
                </span>
              </div>
            </div>
          </div>

          <!-- Dynamic Group Insight Box -->
          <div class="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-slate-700 leading-relaxed">
            <div class="font-extrabold text-blue-900 flex items-center gap-1 mb-1">
              <span>💡</span>
              <span>입결 분석 코멘트</span>
            </div>
            <p class="m-0 text-[11px] text-slate-600 leading-normal">
              {{ groupInsightComment }}
            </p>
          </div>
        </div>

        <!-- 4) 세부 대학별 합격 건수 (페이지 1 연계) -->
        <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-xs font-bold text-slate-800 m-0">
                {{ activeGroup.title }} 실제 합격 대학 명단
              </h4>
              <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                총 {{ activeGroupStats.passed }}건 합격
              </span>
            </div>

            <div v-if="activeGroupUnivList.length > 0" class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
              <div
                v-for="u in activeGroupUnivList"
                :key="u.name"
                class="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center gap-2 text-xs"
              >
                <span class="font-bold text-slate-800">{{ u.cleanName }}</span>
                <span class="font-mono text-[11px] font-black px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-blue-700">
                  {{ u.passCount }}건 합격
                </span>
                <span class="text-[10px] text-slate-600">({{ u.applyCount }}건 지원)</span>
              </div>
            </div>
            <div v-else class="text-center py-6 text-xs text-slate-600 font-medium">
              해당 대학 그룹에 합격한 데이터가 없습니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { useData } from '../composables/useStatData'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
)

const { filteredApplications } = useData()

// -------------------------------------------------------------
// University Group Definitions (보고서 페이지 1, 5, 6 기준)
// -------------------------------------------------------------

const UNIV_GROUPS_CONFIG = [
  {
    id: 'ALL',
    emoji: '🌟',
    title: '전체 주요대 통합',
    univsSummary: '수시 지원 상위 4년제 대학 전체',
    matcher: () => true
  },
  {
    id: 'SKYSSHE',
    emoji: '🏛️',
    title: 'SKYSSHE (최상위권)',
    univsSummary: '서연고·서성한·이 + 카이스트·포스텍',
    matcher: (name) => {
      const u = String(name || '')
      return (
        u.includes('서울대') || u.includes('연세대') || u.includes('고려대') ||
        u.includes('서강대') || u.includes('성균관대') || u.includes('한양대') || u.includes('이화여대') ||
        u.includes('KAIST') || u.includes('한국과학기술원') || u.includes('포항공과대') || u.includes('포스텍')
      ) && !u.includes('세종') && !u.includes('미래') && !u.includes('ERICA') && !u.includes('에리카')
    }
  },
  {
    id: 'JKYSKDHS',
    emoji: '🏢',
    title: 'JKYSKDHS (서울 상위권)',
    univsSummary: '중앙대·경희대·외대·시립대·건국대·동국대·홍익대·숙명여대',
    matcher: (name) => {
      const u = String(name || '')
      return (
        u.includes('중앙대') || u.includes('경희대') || u.includes('한국외국어대') || u.includes('한국외대') ||
        u.includes('서울시립대') || u.includes('건국대') || u.includes('동국대') || u.includes('홍익대') || u.includes('숙명여대')
      ) && !u.includes('글로컬') && !u.includes('세종') && !u.includes('경주')
    }
  },
  {
    id: 'KSSDAGIEK',
    emoji: '🏫',
    title: 'KSSDAGIEK (수도권 주요대)',
    univsSummary: '국민·숭실·세종·단국·아주·가천·인하·에리카·광운',
    matcher: (name) => {
      const u = String(name || '')
      return (
        u.includes('국민대') || u.includes('숭실대') || u.includes('세종대') ||
        u.includes('단국대') || u.includes('아주대') || u.includes('가천대') ||
        u.includes('인하대') || u.includes('ERICA') || u.includes('에리카') || u.includes('광운대')
      )
    }
  },
  {
    id: 'JIGEOK_EDU',
    emoji: '🌲',
    title: '지거국 & 교대',
    univsSummary: '지방거점국립대 본교 9개교 & 전국 교육대학교',
    matcher: (name) => {
      const u = String(name || '')
      const isJigeoguk = ['강원대', '경북대', '경상국립대', '부산대', '전남대', '전북대', '제주대', '충남대', '충북대'].some(k => u.includes(k))
      const isEdu = u.includes('교육대') || u.includes('교대') || u.includes('한국교원대')
      return isJigeoguk || isEdu
    }
  },
  {
    id: 'SPECIAL',
    emoji: '🩺',
    title: '의치한약수 & 과기원',
    univsSummary: '의치한약수 계열 & GIST·UNIST·DGIST·한국에너지공대',
    matcher: (name, dept) => {
      const u = String(name || '')
      const d = String(dept || '')
      // 카이스트 및 포스텍은 SKYSSHE로 분리/이동 완료
      const isTech = ['GIST', '광주과학기술원', 'UNIST', '울산과학기술원', 'DGIST', '대구경북과학기술원', '한국에너지공과대'].some(k => u.includes(k))
      const isMed = !d.includes('스포츠의학') && !d.includes('식물의학') && !d.includes('바이오의약') && !d.includes('창의') &&
                    ['의예', '치의', '한의', '약학', '수의', '의학'].some(m => d.includes(m))
      return isTech || isMed
    }
  }
]

// -------------------------------------------------------------
// Interactive Hover / Lock State Management
// -------------------------------------------------------------

const hoveredGroupId = ref(null)
const lockedGroupId = ref(null)

const activeGroupId = computed(() => {
  return hoveredGroupId.value || lockedGroupId.value || 'ALL'
})

const isLocked = computed(() => !!lockedGroupId.value)

function handleMouseEnter(groupId) {
  if (!lockedGroupId.value) {
    hoveredGroupId.value = groupId
  }
}

function handleMouseLeave() {
  if (!lockedGroupId.value) {
    hoveredGroupId.value = null
  }
}

function handleClick(groupId) {
  if (lockedGroupId.value === groupId) {
    lockedGroupId.value = null // Toggle unlock
  } else {
    lockedGroupId.value = groupId
    hoveredGroupId.value = null
  }
}

function unlockGroup() {
  lockedGroupId.value = null
  hoveredGroupId.value = null
}

// -------------------------------------------------------------
// Data Aggregation & Stat Calculation Engine
// -------------------------------------------------------------

function isPass(app) {
  const final = String(app.finalStage || '').trim()
  const reg = String(app.registerStatus || '').trim()
  if (final.includes('불합')) return false
  return final.includes('합격') || final.includes('충원') || final.includes('최초') || reg === 'Y'
}

function isCandidatePass(app) {
  const final = String(app.finalStage || '').trim()
  return isPass(app) && (final.includes('충원') || final.includes('추가') || final.includes('후보'))
}

function calcRate(passed, total) {
  if (!total || total === 0) return 0
  return Number(((passed / total) * 100).toFixed(1))
}

const groupStatsMap = computed(() => {
  const apps = filteredApplications.value || []
  const result = {}

  UNIV_GROUPS_CONFIG.forEach(cfg => {
    const groupApps = cfg.id === 'ALL'
      ? apps
      : apps.filter(a => cfg.matcher(a.univName, a.dept))

    const total = groupApps.length
    const passedApps = groupApps.filter(isPass)
    const passed = passedApps.length
    const overallRate = calcRate(passed, total)

    // 1. 일반전형 vs 농어촌+기회균형
    const generalApps = groupApps.filter(a => !a.isRural && !a.isOpportunity)
    const generalPassed = generalApps.filter(isPass).length
    const generalRate = calcRate(generalPassed, generalApps.length)

    const ruralOrOppApps = groupApps.filter(a => a.isRural || a.isOpportunity)
    const ruralOrOppPassed = ruralOrOppApps.filter(isPass).length
    const ruralOrOppRate = calcRate(ruralOrOppPassed, ruralOrOppApps.length)

    // 2. 학생부교과 vs 학생부종합
    const gyogwaApps = groupApps.filter(a => String(a.admissionType || '').includes('교과'))
    const gyogwaPassed = gyogwaApps.filter(isPass).length
    const gyogwaRate = calcRate(gyogwaPassed, gyogwaApps.length)

    const jonghapApps = groupApps.filter(a => String(a.admissionType || '').includes('종합'))
    const jonghapPassed = jonghapApps.filter(isPass).length
    const jonghapRate = calcRate(jonghapPassed, jonghapApps.length)

    // 3. 수능최저 유/무
    const hasMinScoreApps = groupApps.filter(a => a.hasMinScore || (a.minScoreReq && a.minScoreReq.trim() !== ''))
    const hasMinScorePassed = hasMinScoreApps.filter(isPass).length
    const hasMinScoreRate = calcRate(hasMinScorePassed, hasMinScoreApps.length)

    const noMinScoreApps = groupApps.filter(a => !a.hasMinScore && (!a.minScoreReq || a.minScoreReq.trim() === ''))
    const noMinScorePassed = noMinScoreApps.filter(isPass).length
    const noMinScoreRate = calcRate(noMinScorePassed, noMinScoreApps.length)

    // 4. 최초 vs 충원
    const candidateCount = passedApps.filter(isCandidatePass).length
    const initialPassCount = Math.max(0, passed - candidateCount)
    const candidateRate = passed > 0 ? Number(((candidateCount / passed) * 100).toFixed(1)) : 0
    const initialPassRate = passed > 0 ? Number(((initialPassCount / passed) * 100).toFixed(1)) : 0

    // 5. 대학별 합격 건수 맵
    const univCounts = {}
    groupApps.forEach(a => {
      const u = a.univName || '기타'
      if (!univCounts[u]) univCounts[u] = { applyCount: 0, passCount: 0 }
      univCounts[u].applyCount++
      if (isPass(a)) univCounts[u].passCount++
    })

    const univList = Object.entries(univCounts)
      .map(([name, stat]) => ({
        name,
        cleanName: name.replace(/대학교|\(.*\)/g, '').trim(),
        applyCount: stat.applyCount,
        passCount: stat.passCount
      }))
      .filter(u => u.passCount > 0)
      .sort((a, b) => b.passCount - a.passCount || b.applyCount - a.applyCount)

    result[cfg.id] = {
      total,
      passed,
      overallRate,
      general: { total: generalApps.length, passed: generalPassed, rate: generalRate },
      ruralOrOpp: { total: ruralOrOppApps.length, passed: ruralOrOppPassed, rate: ruralOrOppRate },
      gyogwa: { total: gyogwaApps.length, passed: gyogwaPassed, rate: gyogwaRate },
      jonghap: { total: jonghapApps.length, passed: jonghapPassed, rate: jonghapRate },
      hasMinScore: { total: hasMinScoreApps.length, passed: hasMinScorePassed, rate: hasMinScoreRate },
      noMinScore: { total: noMinScoreApps.length, passed: noMinScorePassed, rate: noMinScoreRate },
      initialPassCount,
      candidateCount,
      initialPassRate,
      candidateRate,
      univList
    }
  })

  return result
})

const activeGroup = computed(() => {
  return UNIV_GROUPS_CONFIG.find(g => g.id === activeGroupId.value) || UNIV_GROUPS_CONFIG[0]
})

const activeGroupStats = computed(() => {
  return groupStatsMap.value[activeGroupId.value] || {
    total: 0,
    passed: 0,
    overallRate: 0,
    general: { rate: 0, passed: 0, total: 0 },
    ruralOrOpp: { rate: 0, passed: 0, total: 0 },
    gyogwa: { rate: 0, passed: 0, total: 0 },
    jonghap: { rate: 0, passed: 0, total: 0 },
    hasMinScore: { rate: 0, passed: 0, total: 0 },
    noMinScore: { rate: 0, passed: 0, total: 0 },
    initialPassRate: 0,
    candidateRate: 0,
    univList: []
  }
})

const activeGroupUnivList = computed(() => {
  return activeGroupStats.value.univList || []
})

// Advatnage Texts
const ruralAdvantageDelta = computed(() => {
  const r = activeGroupStats.value.ruralOrOpp?.rate || 0
  const g = activeGroupStats.value.general?.rate || 0
  return Number((r - g).toFixed(1))
})

const ruralAdvantageText = computed(() => {
  const d = ruralAdvantageDelta.value
  if (d > 0) return `농어촌+기회가 +${d}%p 유리`
  if (d < 0) return `일반전형이 +${Math.abs(d)}%p 유리`
  return '일반·특별 동률 (0%p)'
})

const gyogwaAdvantageDelta = computed(() => {
  const g = activeGroupStats.value.gyogwa?.rate || 0
  const j = activeGroupStats.value.jonghap?.rate || 0
  return Number((g - j).toFixed(1))
})

const gyogwaAdvantageText = computed(() => {
  const d = gyogwaAdvantageDelta.value
  if (d > 0) return `학생부교과가 +${d}%p 유리`
  if (d < 0) return `학생부종합이 +${Math.abs(d)}%p 유리`
  return '교과·종합 동률 (0%p)'
})

const minScoreRateDelta = computed(() => {
  const has = activeGroupStats.value.hasMinScore?.rate || 0
  const no = activeGroupStats.value.noMinScore?.rate || 0
  const diff = Number((has - no).toFixed(1))
  if (diff > 0) return `+${diff}%p 더 높음`
  if (diff < 0) return `${Math.abs(diff)}%p 더 낮음(경쟁완화)`
  return '동일'
})

// Dynamic Group Insights Comment (보고서 5~6페이지 분석 내용 매핑)
const groupInsightComment = computed(() => {
  switch (activeGroupId.value) {
    case 'SKYSSHE':
      return '최상위권 SKYSSHE 라인은 일반전형(13.6%) 대비 농어촌+기회균형 전형(42.9%)의 합격률이 3배 이상 폭증합니다. 특히 교과 전형(38.5%)이 종합(23.8%)보다 약 15%p 높아 수능 최저 충족이 가능한 교과 추천 전형이 핵심 승부처입니다.'
    case 'JKYSKDHS':
      return '서울 상위권 JKYSKDHS 라인 역시 농어촌+기회(26.9%)가 일반(15.1%)보다 우세하며, 교과 전형 합격률(40.9%)이 종합(16.9%)보다 무려 24%p 높아 충원합격을 노린 교과 전형의 공격적 지원이 주효했습니다.'
    case 'KSSDAGIEK':
      return '수도권 주요대 KSSDAGIEK 라인은 일반전형(22.9%) 합격률이 농어촌+기회(16.1%)보다 오히려 소폭 높은 역전 현상이 나타납니다. 중위권 학생들의 농어촌 경쟁이 치열해지므로 정량 교과 전형(34.3%)을 우선 검토해야 합니다.'
    case 'JIGEOK_EDU':
      return '지방거점국립대 및 교대는 지역인재 및 일반 교과 전형의 안정 합격률이 50%를 상회합니다. 면접 및 수능최저 충족 시 실질 합격률이 대폭 상승합니다.'
    case 'SPECIAL':
      return '의치한약수 및 과기원은 극상위권 성적과 높은 수능 최저학력기준이 필수입니다. 수능 최저를 충족한 소수 정예 학생들의 충원 합격 비중이 매우 높습니다.'
    default:
      return '대학 라인이 올라갈수록 농어촌+기회균형 전형의 혜택이 극대화되며, 모든 대학군에서 학생부교과 전형의 합격률이 학생부종합 전형을 일관되게 앞서는 경향을 보입니다.'
  }
})

// -------------------------------------------------------------
// Chart.js Horizontal Bar Chart Data & Options
// -------------------------------------------------------------

const horizontalBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  animation: {
    duration: 350,
    easing: 'easeOutQuart'
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      titleFont: { family: 'Pretendard', size: 12, weight: 'bold' },
      bodyFont: { family: 'Pretendard', size: 11 },
      padding: 8,
      cornerRadius: 8,
      callbacks: {
        label: (ctx) => ` 합격률: ${ctx.formattedValue}%`
      }
    }
  },
  scales: {
    x: {
      min: 0,
      max: 100,
      grid: { color: '#f1f5f9' },
      ticks: {
        font: { family: 'Pretendard', size: 10 },
        callback: (v) => `${v}%`
      }
    },
    y: {
      grid: { display: false },
      ticks: {
        font: { family: 'Pretendard', size: 11, weight: 'bold' },
        color: '#334155'
      }
    }
  }
}

// Chart 1: 일반 vs 농어촌+기회
const generalVsRuralChartData = computed(() => {
  const g = activeGroupStats.value.general?.rate || 0
  const r = activeGroupStats.value.ruralOrOpp?.rate || 0

  return {
    labels: ['일반전형', '농어촌+기회'],
    datasets: [
      {
        data: [g, r],
        backgroundColor: ['#64748b', '#f59e0b'],
        borderRadius: 8,
        barThickness: 24
      }
    ]
  }
})

// Chart 2: 학생부교과 vs 학생부종합
const gyogwaVsJonghapChartData = computed(() => {
  const g = activeGroupStats.value.gyogwa?.rate || 0
  const j = activeGroupStats.value.jonghap?.rate || 0

  return {
    labels: ['학생부교과', '학생부종합'],
    datasets: [
      {
        data: [g, j],
        backgroundColor: ['#2563eb', '#f97316'],
        borderRadius: 8,
        barThickness: 24
      }
    ]
  }
})
</script>
