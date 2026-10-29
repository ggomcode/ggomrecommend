<template>
  <div class="space-y-6">
    <!-- Top Action & Filter Bar (Screen only) -->
    <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4 no-print">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <!-- Title & Stats Summary -->
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xl">📈</span>
            <h2 class="text-base sm:text-lg font-black text-slate-900 m-0">
              대학별 대입 합불 산점도 (Scatter Plot)
            </h2>
            <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {{ selectedAcademicYear }}학년도
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-1 m-0">
            대학별 수시 지원 학생들의 내신 등급 분포 및 
            <span class="inline-flex items-center gap-1 font-bold text-blue-600"><span class="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> 합격</span> / 
            <span class="inline-flex items-center gap-1 font-bold text-rose-500"><span class="font-black text-sm leading-none">✕</span> 불합격</span> 
            결과 시각화 차트입니다.
            <span class="inline-flex items-center gap-1 text-indigo-700 font-extrabold ml-1 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              💡 대학명 마우스 호버 시 1·2차 합격률 상세 분석
            </span>
          </p>
        </div>

        <!-- Print & Mode Controls -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- View Mode Toggle: Paginated (20 per page) vs All Scroll -->
          <div class="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              @click="viewMode = 'paginated'"
              :class="viewMode === 'paginated' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'"
              class="px-3 py-1.5 rounded-lg border-none cursor-pointer transition-all"
            >
              📄 20개씩 분할 (페이지)
            </button>
            <button
              type="button"
              @click="viewMode = 'all'"
              :class="viewMode === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'"
              class="px-3 py-1.5 rounded-lg border-none cursor-pointer transition-all"
            >
              📜 전체 174개 대학 연속
            </button>
          </div>

          <!-- Print / PDF Button -->
          <button
            type="button"
            @click="triggerPrint"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer border-none"
            title="A4 가로 방향 9페이지 전체 인쇄 또는 PDF 저장"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span>A4 가로 9페이지 인쇄 / PDF</span>
          </button>
        </div>
      </div>

      <!-- Filters & Search Bar -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div class="flex flex-wrap items-center gap-2">
          <!-- Search University -->
          <div class="relative w-48 sm:w-60">
            <input
              v-model="univSearchQuery"
              type="text"
              placeholder="대학명 검색 (예: 강남대, 가천대...)"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button
              v-if="univSearchQuery"
              @click="univSearchQuery = ''"
              class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Admission Type Filter -->
          <select
            v-model="filterAdmissionType"
            class="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 px-3 py-2 focus:outline-none"
          >
            <option value="ALL">전형 전체</option>
            <option value="교과">학생부교과</option>
            <option value="종합">학생부종합</option>
            <option value="실기">실기/실적</option>
            <option value="논술">논술</option>
          </select>

          <!-- Result Filter: Pass vs Stage 1 vs Fail -->
          <select
            v-model="filterResult"
            class="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 px-3 py-2 focus:outline-none"
          >
            <option value="ALL">합불 전체</option>
            <option value="PASS">최종 합격만 (●)</option>
            <option value="STAGE1">1차합격(최종불)만 (▲)</option>
            <option value="FAIL">불합격만 (✕)</option>
          </select>

          <!-- Option Checkbox: 1차합격 표시 (에메랄드 녹색 세모 ▲) -->
          <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition-colors shadow-2xs select-none">
            <input
              type="checkbox"
              v-model="showStage1Pass"
              class="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>1차합격 표시 (</span>
            <span class="inline-flex items-center gap-1 font-bold text-emerald-600">
              <span class="text-xs">▲</span> 녹색 세모
            </span>
            <span>)</span>
          </label>

          <!-- Reset Filter -->
          <button
            v-if="hasActiveFilters"
            @click="resetScatterFilters"
            class="px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200 bg-white cursor-pointer"
          >
            필터 초기화
          </button>
        </div>

        <!-- Legend and Count Info -->
        <div class="flex items-center gap-3 text-xs">
          <div class="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700">
            <span class="inline-flex items-center gap-1 font-bold text-blue-700" title="최종 합격 또는 등록">
              <span class="w-3 h-3 rounded-full bg-blue-600 inline-block"></span> 최종합격 {{ totalPassCount }}건
            </span>
            <span class="text-slate-300">|</span>
            <span 
              class="inline-flex items-center gap-1 font-bold transition-opacity"
              :class="showStage1Pass ? 'text-emerald-700' : 'text-slate-500'"
              title="1단계 합격 후 최종 불합격"
            >
              <span class="text-emerald-600 text-xs">▲</span> 1차합격 {{ totalStage1PassCount }}건
            </span>
            <span class="text-slate-300">|</span>
            <span class="inline-flex items-center gap-1 font-bold text-rose-600" title="최종 불합격">
              <span class="text-rose-500 font-black text-sm">✕</span> 불합격 {{ totalFailCount }}건
            </span>
            <span class="text-slate-300">|</span>
            <span class="text-slate-500">총 {{ totalPlotItemsCount }}건 ({{ filteredUnivNames.length }}개교)</span>
          </div>
        </div>
      </div>

      <!-- Pagination Bar (When viewMode === 'paginated') -->
      <div v-if="viewMode === 'paginated' && !univSearchQuery" class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            @click="prevPage"
            :disabled="currentPage === 1"
            class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            ◀ 이전
          </button>
          
          <div class="flex items-center gap-1 overflow-x-auto py-0.5">
            <button
              v-for="p in totalPages"
              :key="p"
              type="button"
              @click="currentPage = p"
              :class="[
                'w-8 h-8 rounded-lg text-xs font-black transition-colors cursor-pointer border',
                currentPage === p
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              ]"
            >
              {{ p }}
            </button>
          </div>

          <button
            type="button"
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            다음 ▶
          </button>
        </div>

        <div class="text-xs text-slate-500 font-medium">
          현재 페이지: <strong class="text-indigo-700 font-bold">{{ currentPage }}</strong> / {{ totalPages }} 페이지
          <span class="text-slate-400 ml-1">({{ currentDisplayUnivRange }})</span>
        </div>
      </div>
    </div>

    <!-- Empty State Warning if no data -->
    <div v-if="filteredUnivNames.length === 0" class="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
      <div class="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl mx-auto mb-4">
        📊
      </div>
      <h3 class="text-base font-bold text-slate-800 m-0">표시할 대학별 산점도 데이터가 없습니다</h3>
      <p class="text-xs text-slate-500 mt-1">
        선택하신 조건 또는 검색어에 해당하는 대입 지원 결과가 없거나, 구글 시트에서 아직 데이터를 불러오지 못했습니다.
      </p>
    </div>

    <!-- Screen Scatter Container (Paginated Mode or All Mode) -->
    <div v-else class="space-y-8 screen-scatter-wrap">
      <!-- In Paginated Mode, render just the currentPage chunk -->
      <template v-if="viewMode === 'paginated'">
        <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm print-scatter-page">
          <!-- Page Header -->
          <div class="text-center pb-4 border-b border-slate-200 mb-4">
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              {{ selectedAcademicYear }}학년도 {{ displaySchoolName }} 대입 합불 산점도({{ currentPage }})
            </h1>
          </div>

          <!-- Scatter Chart Grid for this Page -->
          <ScatterPlotGrid 
            :universities="currentPageUnivs"
            :applications="applications"
            :isPrivacyMasked="isPrivacyMasked"
            :showStage1Pass="showStage1Pass"
            @point-hover="handlePointHover"
            @univ-hover="handleUnivHover"
          />
        </div>
      </template>

      <!-- In All Mode, render all pages sequentially -->
      <template v-else>
        <div
          v-for="(pageUnivs, pageIdx) in chunkedAllPages"
          :key="pageIdx"
          class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm print-scatter-page"
        >
          <!-- Page Header -->
          <div class="text-center pb-4 border-b border-slate-200 mb-4">
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              {{ selectedAcademicYear }}학년도 {{ displaySchoolName }} 대입 합불 산점도({{ pageIdx + 1 }})
            </h1>
          </div>

          <!-- Scatter Chart Grid for this Page -->
          <ScatterPlotGrid 
            :universities="pageUnivs"
            :applications="applications"
            :isPrivacyMasked="isPrivacyMasked"
            :showStage1Pass="showStage1Pass"
            @point-hover="handlePointHover"
            @univ-hover="handleUnivHover"
          />
        </div>
      </template>
    </div>

    <!-- Print ONLY Container: Renders ALL 9 pages sequentially with page-break-after: always for flawless A4 Landscape output -->
    <div class="print-only-container hidden">
      <div 
        v-for="(pageUnivs, pIdx) in chunkedAllPages" 
        :key="pIdx" 
        class="print-page-a4-landscape"
      >
        <div class="print-page-header">
          <h1 class="print-page-title">
            {{ selectedAcademicYear }}학년도 {{ displaySchoolName }} 대입 합불 산점도({{ pIdx + 1 }})
          </h1>
        </div>

        <ScatterPlotGrid 
          :universities="pageUnivs"
          :applications="applications"
          :isPrintMode="true"
          :isPrivacyMasked="true"
          :showStage1Pass="showStage1Pass"
        />
      </div>
    </div>

    <!-- Floating Interactive Tooltip (on mouseover point) -->
    <Teleport to="body">
      <div
        v-if="hoveredPoint"
        :style="{ top: `${hoveredPoint.clientY + 12}px`, left: `${hoveredPoint.clientX + 12}px` }"
        class="fixed z-50 pointer-events-none bg-slate-900 text-white rounded-xl p-3 shadow-2xl text-xs space-y-1.5 border border-slate-700 max-w-xs animate-in fade-in duration-100"
      >
        <div class="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1.5">
          <span class="font-black text-sm text-amber-300">{{ hoveredPoint.univName }}</span>
          <span 
            :class="[
              'px-1.5 py-0.5 rounded text-[10px] font-black',
              hoveredPoint.isPass ? 'bg-blue-500 text-white' : (hoveredPoint.isStage1Pass ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white')
            ]"
          >
            {{ hoveredPoint.resultBadge || hoveredPoint.resultText }}
          </span>
        </div>
        <div class="space-y-0.5 text-slate-300 text-[11px]">
          <div><strong class="text-white">모집단위:</strong> {{ hoveredPoint.dept || '-' }}</div>
          <div><strong class="text-white">전형명:</strong> {{ hoveredPoint.admissionMajorType }} {{ hoveredPoint.admissionDetailType ? `(${hoveredPoint.admissionDetailType})` : '' }}</div>
          <div><strong class="text-white">학생:</strong> {{ hoveredPoint.studentName }} ({{ hoveredPoint.classNum }}반 {{ hoveredPoint.studentNum }}번)</div>
          <div><strong class="text-white">내신등급:</strong> <span class="font-bold text-amber-300 text-xs">{{ hoveredPoint.grade }}등급</span></div>
          <div v-if="hoveredPoint.stage1">
            <strong class="text-white">1단계:</strong> 
            <span :class="hoveredPoint.stage1.includes('합격') ? 'text-amber-300 font-bold' : 'text-slate-300'">
              {{ hoveredPoint.stage1 }}
            </span>
          </div>
          <div v-if="hoveredPoint.finalStage">
            <strong class="text-white">최종단계:</strong> 
            <span :class="hoveredPoint.isPass ? 'text-blue-300 font-bold' : 'text-rose-300'">
              {{ hoveredPoint.finalStage }}
            </span>
          </div>
          <div v-if="hoveredPoint.registerStatus">
            <strong class="text-white">등록여부:</strong> 
            <span :class="hoveredPoint.registerStatus === 'Y' ? 'text-emerald-400 font-bold' : 'text-slate-400'">
              {{ hoveredPoint.registerStatus === 'Y' ? '최종 등록' : '미등록' }}
            </span>
          </div>
          <div v-if="hoveredPoint.candidateRank" class="text-sky-300">
            <strong>후보순위:</strong> {{ hoveredPoint.candidateRank }}
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Floating Interactive Tooltip (on mouseover university name) -->
    <Teleport to="body">
      <div
        v-if="hoveredUnivData && hoveredUnivData.stats"
        :style="univTooltipStyle"
        class="fixed z-50 pointer-events-none bg-slate-950/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 w-[310px] text-xs space-y-3 transition-opacity duration-150 animate-in fade-in select-none"
      >
        <!-- Top: University Name & Academic Year -->
        <div class="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="text-base shrink-0">🏛️</span>
            <span class="font-black text-sm text-amber-300 truncate" :title="hoveredUnivData.univName">
              {{ hoveredUnivData.univName }}
            </span>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <span v-if="hoveredUnivData.stats.appliedFilterType" class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              {{ hoveredUnivData.stats.appliedFilterType }}
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              {{ selectedAcademicYear }}학년도
            </span>
          </div>
        </div>

        <!-- Metric 1: 전체 최종 합격률 (최종합격 / 지원자) -->
        <div class="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-blue-500 inline-block shrink-0"></span>
              <span>1. 전체 최종 합격률 (지원자 대비)</span>
            </span>
            <span class="text-base font-black text-blue-400 font-mono">
              {{ hoveredUnivData.stats.finalPassRate }}
            </span>
          </div>
          
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span>최종합격 / 전체지원:</span>
            <span class="font-bold text-white font-mono">
              <strong class="text-blue-400 font-black">{{ hoveredUnivData.stats.finalPassCount }}</strong>건 / {{ hoveredUnivData.stats.totalApplyCount }}건
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              class="bg-blue-500 h-full rounded-full transition-all duration-300"
              :style="{ width: hoveredUnivData.stats.finalPassRate !== '-' ? hoveredUnivData.stats.finalPassRate : '0%' }"
            ></div>
          </div>

          <div v-if="hoveredUnivData.stats.registeredCount > 0" class="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
            <span>실제 등록 인원:</span>
            <span class="font-bold text-emerald-400 font-mono">{{ hoveredUnivData.stats.registeredCount }}건 최종등록</span>
          </div>
        </div>

        <!-- Metric 2: 1차 합격자 중 최종 합격률 (최종합격 / 1차합격) -->
        <div class="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <span class="text-emerald-400 text-xs font-bold leading-none shrink-0">▲</span>
              <span>2. 1차 합격자 중 최종 합격률</span>
            </span>
            <span class="text-base font-black text-emerald-400 font-mono">
              {{ hoveredUnivData.stats.stage1ToFinalPassRate }}
            </span>
          </div>

          <template v-if="hoveredUnivData.stats.hasStage1Track">
            <div class="flex items-center justify-between text-[11px] text-slate-400">
              <span>최종합격 / 1차합격:</span>
              <span class="font-bold text-white font-mono">
                <strong class="text-emerald-400 font-black">{{ hoveredUnivData.stats.stage1FinalPassCount }}</strong>건 / {{ hoveredUnivData.stats.stage1PassCount }}건
              </span>
            </div>

            <!-- Progress Bar -->
            <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                class="bg-emerald-500 h-full rounded-full transition-all duration-300"
                :style="{ width: (hoveredUnivData.stats.stage1ToFinalPassRate !== '-' && !hoveredUnivData.stats.stage1ToFinalPassRate.includes('없음')) ? hoveredUnivData.stats.stage1ToFinalPassRate : '0%' }"
              ></div>
            </div>

            <!-- Funnel Step Indicator (더 좋은 방법: 1단계 서류 통과율 요약) -->
            <div class="mt-1 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span>💡 단계별 전형 1차(서류) 통과율:</span>
              <span class="font-bold text-slate-200 font-mono">
                {{ hoveredUnivData.stats.stage1PassCount }}건 / {{ hoveredUnivData.stats.stage1ApplyCount }}건 ({{ hoveredUnivData.stats.stage1PassRate }})
              </span>
            </div>
          </template>

          <template v-else>
            <div class="text-[11px] text-slate-400 italic py-1 text-center bg-slate-900/50 rounded-lg">
              1단계 선발 전형 없음 (일괄 합산 전형 위주)
            </div>
          </template>
        </div>

        <!-- Metric 3: 합격자 내신 등급 통계 (보조 지표) -->
        <div v-if="hoveredUnivData.stats.avgPassGrade" class="bg-indigo-950/40 rounded-xl p-2.5 border border-indigo-900/60 flex items-center justify-between text-[11px]">
          <span class="text-indigo-300 font-bold">최종합격자 평균 내신:</span>
          <span class="font-black text-amber-300 font-mono">
            {{ hoveredUnivData.stats.avgPassGrade }}등급
            <span class="text-[10px] font-normal text-slate-400 ml-1">({{ hoveredUnivData.stats.minPassGrade }} ~ {{ hoveredUnivData.stats.maxPassGrade }})</span>
          </span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData } from '../../composables/useStatData'
import { schoolName } from '../../../utils/schoolConfig'
import ScatterPlotGrid from './ScatterPlotGrid.vue'

const { 
  applications, 
  selectedAcademicYear,
  isPrivacyMasked 
} = useData()

const displaySchoolName = computed(() => {
  return (schoolName.value && schoolName.value !== '우리학교') ? schoolName.value : '포곡고'
})

// View Mode: 'paginated' (20 per page) vs 'all' (continuous view)
const viewMode = ref('paginated')
const currentPage = ref(1)
const itemsPerPage = 20

// Search and Filters
const univSearchQuery = ref('')
const filterAdmissionType = ref('ALL') // ALL, 교과, 종합, 실기, 논술
const filterResult = ref('ALL') // ALL, PASS, STAGE1, FAIL
const showStage1Pass = ref(false) // 1차합격 후 불합격 사례를 주황색 원으로 표시하는 옵션

// Helper: Determine Pass, Stage 1 Pass, and Fail status
function evaluateResult(app) {
  const s1 = String(app.stage1 || '').trim()
  const isStage1Passed = (s1.includes('합격') || s1.includes('통과')) && !s1.includes('불합')

  const finalRes = String(app.finalStage || '').trim()
  const isFinalPass = (finalRes.includes('합격') || finalRes.includes('충원') || finalRes.includes('최초') || app.registerStatus === 'Y') && !finalRes.includes('불합')

  const isStage1PassFinalFail = !isFinalPass && isStage1Passed

  return {
    isFinalPass,
    isStage1PassFinalFail,
    isStage1Passed,
    isFail: !isFinalPass
  }
}

const hasActiveFilters = computed(() => {
  return univSearchQuery.value.trim() !== '' ||
    filterAdmissionType.value !== 'ALL' ||
    filterResult.value !== 'ALL' ||
    showStage1Pass.value
})

function resetScatterFilters() {
  univSearchQuery.value = ''
  filterAdmissionType.value = 'ALL'
  filterResult.value = 'ALL'
  showStage1Pass.value = false
  currentPage.value = 1
}

// 1. Gather all unique university names from current applications
const allUniversityNames = computed(() => {
  const set = new Set()
  applications.value.forEach(app => {
    if (app.univName && app.univName.trim()) {
      set.add(app.univName.trim())
    }
  })
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'))
})

// 2. Filter university list based on search and filters
const filteredUnivNames = computed(() => {
  let list = allUniversityNames.value

  if (univSearchQuery.value.trim()) {
    const q = univSearchQuery.value.trim().toLowerCase()
    list = list.filter(u => u.toLowerCase().includes(q))
  }

  // If type or result filter is active, only show universities that have matching applications
  if (filterAdmissionType.value !== 'ALL' || filterResult.value !== 'ALL') {
    list = list.filter(u => {
      return applications.value.some(app => {
        if (app.univName !== u) return false
        if (filterAdmissionType.value !== 'ALL') {
          if (!app.admissionType || !app.admissionType.includes(filterAdmissionType.value)) return false
        }
        if (filterResult.value !== 'ALL') {
          const res = evaluateResult(app)
          if (filterResult.value === 'PASS' && !res.isFinalPass) return false
          if (filterResult.value === 'STAGE1' && !res.isStage1PassFinalFail) return false
          if (filterResult.value === 'FAIL' && !res.isFail) return false
        }
        return true
      })
    })
  }

  return list
})

// Pagination Calculations
const totalPages = computed(() => {
  return Math.ceil(filteredUnivNames.value.length / itemsPerPage) || 1
})

const currentPageUnivs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredUnivNames.value.slice(start, start + itemsPerPage)
})

const chunkedAllPages = computed(() => {
  const chunks = []
  for (let i = 0; i < filteredUnivNames.value.length; i += itemsPerPage) {
    chunks.push(filteredUnivNames.value.slice(i, i + itemsPerPage))
  }
  return chunks.length > 0 ? chunks : [[]]
})

const currentDisplayUnivRange = computed(() => {
  if (currentPageUnivs.value.length === 0) return ''
  const first = currentPageUnivs.value[0]
  const last = currentPageUnivs.value[currentPageUnivs.value.length - 1]
  return `${first} ~ ${last}`
})

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

// Summary Statistics for current filtered view
const currentFilteredApplications = computed(() => {
  return applications.value.filter(app => {
    if (!filteredUnivNames.value.includes(app.univName)) return false
    if (filterAdmissionType.value !== 'ALL') {
      if (!app.admissionType || !app.admissionType.includes(filterAdmissionType.value)) return false
    }
    if (filterResult.value !== 'ALL') {
      const res = evaluateResult(app)
      if (filterResult.value === 'PASS' && !res.isFinalPass) return false
      if (filterResult.value === 'STAGE1' && !res.isStage1PassFinalFail) return false
      if (filterResult.value === 'FAIL' && !res.isFail) return false
    }
    return true
  })
})

const totalPlotItemsCount = computed(() => currentFilteredApplications.value.length)

const totalPassCount = computed(() => {
  return currentFilteredApplications.value.filter(app => evaluateResult(app).isFinalPass).length
})

const totalStage1PassCount = computed(() => {
  return currentFilteredApplications.value.filter(app => evaluateResult(app).isStage1PassFinalFail).length
})

const totalFailCount = computed(() => {
  return currentFilteredApplications.value.filter(app => evaluateResult(app).isFail).length
})

// Tooltip Management
const hoveredPoint = ref(null)

function handlePointHover(pointData) {
  hoveredPoint.value = pointData
}

// University Hover Tooltip Management
const hoveredUnivData = ref(null)

function getUnivAdmissionStats(univName) {
  if (!univName) return null
  const uName = univName.trim()

  // 해당 대학의 지원 건 (전형 필터가 적용되어 있다면 해당 전형 기준)
  const univApps = applications.value.filter(app => {
    if ((app.univName || '').trim() !== uName) return false
    if (filterAdmissionType.value !== 'ALL') {
      if (!app.admissionType || !app.admissionType.includes(filterAdmissionType.value)) return false
    }
    return true
  })

  const totalApplyCount = univApps.length

  if (totalApplyCount === 0) {
    return {
      univName: uName,
      totalApplyCount: 0,
      finalPassCount: 0,
      finalPassRate: '0.0%',
      registeredCount: 0,
      hasStage1Track: false,
      stage1ApplyCount: 0,
      stage1PassCount: 0,
      stage1FinalPassCount: 0,
      stage1PassRate: '-',
      stage1ToFinalPassRate: '-',
      avgPassGrade: null,
      minPassGrade: null,
      maxPassGrade: null,
      appliedFilterType: filterAdmissionType.value !== 'ALL' ? filterAdmissionType.value : null
    }
  }

  let finalPassCount = 0
  let registeredCount = 0
  let stage1ApplyCount = 0
  let stage1PassCount = 0
  let stage1FinalPassCount = 0
  const passGrades = []

  for (const app of univApps) {
    const res = evaluateResult(app)

    if (res.isFinalPass) {
      finalPassCount++
      if (app.registerStatus === 'Y') {
        registeredCount++
      }
      const rawGrade = app.allSubjectGrade || app.score9Grade || app.mainSubjectGrade
      if (rawGrade != null && !isNaN(rawGrade)) {
        const g = Number(rawGrade)
        if (g >= 1.0 && g <= 9.0) passGrades.push(g)
      }
    }

    // 1단계 전형 여부 판정 (stage1 결과가 입력되어 있거나 1차 합격한 경우)
    const s1 = String(app.stage1 || '').trim()
    const hasS1 = (s1 !== '' && s1 !== '-' && s1 !== '해당없음') || res.isStage1Passed
    if (hasS1) {
      stage1ApplyCount++
    }

    if (res.isStage1Passed) {
      stage1PassCount++
      if (res.isFinalPass) {
        stage1FinalPassCount++
      }
    }
  }

  // 지표 1: 전체 최종 합격률 = 최종합격 / 지원자
  const finalPassRate = totalApplyCount > 0
    ? ((finalPassCount / totalApplyCount) * 100).toFixed(1) + '%'
    : '0.0%'

  // 지표 2: 1차 합격자 중 최종 합격자 비율 = 최종합격 / 1차합격
  const stage1ToFinalPassRate = stage1PassCount > 0
    ? ((stage1FinalPassCount / stage1PassCount) * 100).toFixed(1) + '%'
    : (stage1ApplyCount > 0 ? '0.0%' : '해당 전형 없음')

  // 지표 2 보조: 단계별 전형 1차(서류) 통과율 = 1차합격 / 1단계 지원자
  const stage1PassRate = stage1ApplyCount > 0
    ? ((stage1PassCount / stage1ApplyCount) * 100).toFixed(1) + '%'
    : '-'

  // 내신 평균 및 범위
  let avgPassGrade = null
  let minPassGrade = null
  let maxPassGrade = null
  if (passGrades.length > 0) {
    const sum = passGrades.reduce((acc, v) => acc + v, 0)
    avgPassGrade = (sum / passGrades.length).toFixed(2)
    minPassGrade = Math.min(...passGrades).toFixed(2)
    maxPassGrade = Math.max(...passGrades).toFixed(2)
  }

  return {
    univName: uName,
    totalApplyCount,
    finalPassCount,
    finalPassRate,
    registeredCount,
    hasStage1Track: stage1ApplyCount > 0 || stage1PassCount > 0,
    stage1ApplyCount,
    stage1PassCount,
    stage1FinalPassCount,
    stage1PassRate,
    stage1ToFinalPassRate,
    avgPassGrade,
    minPassGrade,
    maxPassGrade,
    appliedFilterType: filterAdmissionType.value !== 'ALL' ? filterAdmissionType.value : null
  }
}

function handleUnivHover(data) {
  if (!data) {
    hoveredUnivData.value = null
    return
  }
  const stats = getUnivAdmissionStats(data.univName)
  hoveredUnivData.value = {
    ...data,
    stats
  }
}

const univTooltipStyle = computed(() => {
  if (!hoveredUnivData.value) return {}
  const x = hoveredUnivData.value.clientX + 16
  const y = hoveredUnivData.value.clientY - 20

  const tooltipWidth = 320
  const tooltipHeight = 280
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800

  let left = x
  let top = y

  if (x + tooltipWidth > viewportWidth - 20) {
    left = hoveredUnivData.value.clientX - tooltipWidth - 16
  }
  if (y + tooltipHeight > viewportHeight - 20) {
    top = Math.max(10, viewportHeight - tooltipHeight - 20)
  }

  return {
    left: `${Math.max(10, left)}px`,
    top: `${Math.max(10, top)}px`
  }
})

function triggerPrint() {
  window.print()
}
</script>

<style scoped>
/* Print Styles for A4 Landscape */
@media print {
  @page {
    size: A4 landscape;
    margin: 8mm 8mm 8mm 8mm;
  }

  .no-print {
    display: none !important;
  }

  .screen-scatter-wrap {
    display: none !important;
  }

  .print-only-container {
    display: block !important;
  }

  .print-page-a4-landscape {
    page-break-after: always;
    break-after: page;
    page-break-inside: avoid;
    break-inside: avoid;
    width: 100%;
    box-sizing: border-box;
    padding: 0;
  }

  .print-page-header {
    text-align: center;
    margin-bottom: 8px;
  }

  .print-page-title {
    font-size: 16pt;
    font-weight: 900;
    color: #111827;
    margin: 0 0 6px 0;
    letter-spacing: -0.5px;
  }
}
</style>
