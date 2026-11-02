<template>
  <div class="bg-slate-950/95 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 text-white shadow-xl space-y-4">
    
    <!-- 1. 아코디언 상단 헤더: 종합 점수 요약 & 빠른 필터 탭 & 닫기 버튼 -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
      <div class="flex items-center space-x-2.5">
        <span class="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0">
          🔍
        </span>
        <div>
          <div class="flex items-center space-x-2">
            <h4 class="text-sm sm:text-base font-black text-white m-0 tracking-tight">
              안전도 점수 <strong class="text-indigo-400">{{ safetyScore }}점</strong> 산출 정밀 근거
            </h4>
            <span :class="['text-[11px] font-bold px-2 py-0.5 rounded-full border', balanceColor]">
              {{ gradeRank }}등급
            </span>
          </div>
          <div class="text-[11px] text-slate-400 mt-0.5">
            7대 입체 평가 지표의 정량·정성 데이터 배점 및 가/감점 사유를 투명하게 공개합니다.
          </div>
        </div>
      </div>

      <!-- 우측: 닫기 버튼 -->
      <div class="flex items-center space-x-2 self-end md:self-auto shrink-0">
        <button
          type="button"
          @click="$emit('close')"
          class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-700 flex items-center space-x-1"
        >
          <span>▲</span>
          <span>접기</span>
        </button>
      </div>
    </div>

    <!-- 2. 빠른 지표 선택 필터 칩스 (전체 / 1~7개별) -->
    <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
      <button
        type="button"
        @click="activeMetricKey = 'ALL'"
        :class="[
          'px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border shrink-0 text-xs',
          activeMetricKey === 'ALL'
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
        ]"
      >
        🌟 전체 7대 지표 일람
      </button>

      <button
        v-for="item in metricTabs"
        :key="item.key"
        type="button"
        @click="activeMetricKey = item.key"
        :class="[
          'px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer border shrink-0 text-xs flex items-center space-x-1',
          activeMetricKey === item.key
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
        ]"
      >
        <span>{{ item.icon }}</span>
        <span>{{ item.label }}</span>
        <span class="text-[10px] opacity-80">({{ scoreBreakdown[item.key]?.score }}/{{ scoreBreakdown[item.key]?.max }})</span>
      </button>
    </div>

    <!-- 3. 7대 지표별 세부 산출 근거 카드 목록 -->
    <div class="space-y-3.5">
      
      <!-- 지표 1: 내신 실질 마진 -->
      <div 
        v-if="shouldShow('gpaMargin')" 
        class="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all space-y-3"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div class="flex items-center space-x-2">
            <span class="text-base">📐</span>
            <div>
              <span class="text-xs font-black text-indigo-300">1. 내신 실질 마진 지표</span>
              <span class="text-[11px] text-slate-400 ml-2">합격선 대비 안전거리</span>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-xs font-black text-white bg-indigo-950/80 border border-indigo-500/40 px-2.5 py-0.5 rounded-lg">
              <strong class="text-indigo-400 text-sm">{{ scoreBreakdown.gpaMargin.score }}</strong> / 25점
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {{ scoreBreakdown.gpaMargin.statusText }}
            </span>
          </div>
        </div>

        <div class="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
          <strong class="text-indigo-300">💡 배점 기준:</strong> {{ scoreBreakdown.gpaMargin.ruleDescription }}
        </div>

        <!-- 산출 근거 리스트 -->
        <div class="space-y-1 text-xs">
          <div class="text-[11px] font-bold text-slate-400">📊 적용된 근거:</div>
          <ul class="m-0 pl-4 space-y-1 text-slate-200 text-xs">
            <li v-for="(r, rIdx) in scoreBreakdown.gpaMargin.reasons" :key="rIdx">
              {{ r }}
            </li>
          </ul>
        </div>

        <!-- 개별 지원 카드 6장 매칭 세부표 -->
        <div v-if="scoreBreakdown.gpaMargin.evaluatedCards?.length > 0" class="pt-1">
          <div class="text-[11px] font-bold text-slate-400 mb-1.5">📋 카드별 내신 격차 및 획득 배점:</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            <div 
              v-for="(c, cIdx) in scoreBreakdown.gpaMargin.evaluatedCards" 
              :key="c.id || cIdx"
              class="bg-slate-950/80 border border-slate-800/90 rounded-lg p-2.5 flex flex-col justify-between"
            >
              <div class="flex items-start justify-between">
                <div>
                  <span class="font-bold text-white text-xs">#{{ cIdx + 1 }} {{ c.univName }}</span>
                  <div class="text-[10px] text-slate-400 truncate max-w-37.5">{{ c.dept }}</div>
                </div>
                <span :class="[
                  'text-[10px] font-bold px-1.5 py-0.5 rounded',
                  c.deltaGpa >= 0.45 ? 'bg-slate-800 text-slate-200 border border-slate-600' :
                  c.deltaGpa >= 0.15 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  c.deltaGpa >= -0.15 ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                  c.deltaGpa >= -0.45 ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                  'bg-rose-950 text-rose-300 border border-rose-800'
                ]">
                  {{ c.verdict || (c.deltaGpa >= 0.45 ? '하향' : c.deltaGpa >= 0.15 ? '안정' : c.deltaGpa >= -0.15 ? '적정' : c.deltaGpa >= -0.45 ? '상향' : '과상향') }} ({{ c.gpaMarginPts }}점)
                </span>
              </div>
              <div class="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>합격컷 {{ c.passCut }} vs 학생 {{ c.studentGpa }}</span>
                <strong :class="c.deltaGpa >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                  {{ c.deltaGpa >= 0 ? `+${c.deltaGpa}` : c.deltaGpa }}등급
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 지표 2: 수능최저 & 사탐런 최적화 -->
      <div 
        v-if="shouldShow('csatSatam')" 
        class="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all space-y-3"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div class="flex items-center space-x-2">
            <span class="text-base">🎯</span>
            <div>
              <span class="text-xs font-black text-sky-300">2. 수능최저 & 사탐런 최적화 지표</span>
              <span class="text-[11px] text-slate-400 ml-2">충족 버퍼 & 자격 검증</span>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-xs font-black text-white bg-sky-950/80 border border-sky-500/40 px-2.5 py-0.5 rounded-lg">
              <strong class="text-sky-400 text-sm">{{ scoreBreakdown.csatSatam.score }}</strong> / 20점
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {{ scoreBreakdown.csatSatam.statusText }}
            </span>
          </div>
        </div>

        <div class="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
          <strong class="text-sky-300">💡 배점 기준:</strong> {{ scoreBreakdown.csatSatam.ruleDescription }}
        </div>

        <!-- 산출 근거 리스트 -->
        <div class="space-y-1 text-xs">
          <div class="text-[11px] font-bold text-slate-400">📊 적용된 근거:</div>
          <ul class="m-0 pl-4 space-y-1 text-slate-200 text-xs">
            <li v-for="(r, rIdx) in scoreBreakdown.csatSatam.reasons" :key="rIdx">
              {{ r }}
            </li>
          </ul>
        </div>

        <!-- 카드별 최저 기준 & 판정 -->
        <div v-if="scoreBreakdown.csatSatam.cardDetails?.length > 0" class="pt-1">
          <div class="text-[11px] font-bold text-slate-400 mb-1.5">📋 카드별 최저 기준 및 획득 배점:</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            <div 
              v-for="(c, cIdx) in scoreBreakdown.csatSatam.cardDetails" 
              :key="c.id || cIdx"
              class="bg-slate-950/80 border border-slate-800/90 rounded-lg p-2.5 flex flex-col justify-between"
            >
              <div class="flex items-start justify-between">
                <div>
                  <span class="font-bold text-white text-xs">#{{ cIdx + 1 }} {{ c.univName }}</span>
                  <div class="text-[10px] text-slate-400 truncate max-w-37.5">{{ c.dept }}</div>
                </div>
                <span class="text-[10px] font-bold text-sky-400">
                  {{ c.pts }}점
                </span>
              </div>
              <div class="mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400 space-y-0.5">
                <div class="truncate text-slate-300" :title="c.reqText">{{ c.reqText }}</div>
                <div class="font-bold text-sky-300">{{ c.status }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 지표 3: 학교장추천 쿼터 프리미엄 -->
      <div 
        v-if="shouldShow('schoolRec')" 
        class="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all space-y-3"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div class="flex items-center space-x-2">
            <span class="text-base">🏫</span>
            <div>
              <span class="text-xs font-black text-purple-300">3. 학교장추천(학추) 쿼터 프리미엄 지표</span>
              <span class="text-[11px] text-slate-400 ml-2">허수 지원자 배제 효과</span>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-xs font-black text-white bg-purple-950/80 border border-purple-500/40 px-2.5 py-0.5 rounded-lg">
              <strong class="text-purple-400 text-sm">{{ scoreBreakdown.schoolRec.score }}</strong> / 15점
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {{ scoreBreakdown.schoolRec.statusText }}
            </span>
          </div>
        </div>

        <div class="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
          <strong class="text-purple-300">💡 배점 기준:</strong> {{ scoreBreakdown.schoolRec.ruleDescription }}
        </div>

        <!-- 산출 근거 리스트 -->
        <div class="space-y-1 text-xs">
          <div class="text-[11px] font-bold text-slate-400">📊 적용된 근거:</div>
          <ul class="m-0 pl-4 space-y-1 text-slate-200 text-xs">
            <li v-for="(r, rIdx) in scoreBreakdown.schoolRec.reasons" :key="rIdx">
              {{ r }}
            </li>
          </ul>
        </div>

        <!-- 학추 활용 카드 목록 -->
        <div v-if="scoreBreakdown.schoolRec.recCards?.length > 0" class="pt-1">
          <div class="text-[11px] font-bold text-slate-400 mb-1.5">📋 학추/지균 지원 카드:</div>
          <div class="flex flex-wrap gap-2 text-xs">
            <div 
              v-for="c in scoreBreakdown.schoolRec.recCards" 
              :key="c.id"
              class="bg-purple-950/60 border border-purple-500/30 rounded-lg px-2.5 py-1.5 text-purple-200"
            >
              <span class="font-bold text-white">{{ c.univName }}</span>
              <span class="text-[10px] text-purple-300 ml-1">({{ c.dept }})</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 지표 4: 농어촌 쿼터 유불리 -->
      <div 
        v-if="shouldShow('ruralQuota')" 
        class="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all space-y-3"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div class="flex items-center space-x-2">
            <span class="text-base">🌾</span>
            <div>
              <span class="text-xs font-black text-emerald-300">4. 농어촌 쿼터 유불리 지표</span>
              <span class="text-[11px] text-slate-400 ml-2">성적대별 실질 유불리</span>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-xs font-black text-white bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-lg">
              <strong class="text-emerald-400 text-sm">{{ scoreBreakdown.ruralQuota.score }}</strong> / 10점
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {{ scoreBreakdown.ruralQuota.statusText }}
            </span>
          </div>
        </div>

        <div class="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
          <strong class="text-emerald-300">💡 배점 기준:</strong> {{ scoreBreakdown.ruralQuota.ruleDescription }}
        </div>

        <!-- 산출 근거 리스트 -->
        <div class="space-y-1 text-xs">
          <div class="text-[11px] font-bold text-slate-400">📊 적용된 근거:</div>
          <ul class="m-0 pl-4 space-y-1 text-slate-200 text-xs">
            <li v-for="(r, rIdx) in scoreBreakdown.ruralQuota.reasons" :key="rIdx">
              {{ r }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 지표 5: 3개년 경쟁률 추이 및 과열도 -->
      <div 
        v-if="shouldShow('compTrend')" 
        class="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all space-y-3"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div class="flex items-center space-x-2">
            <span class="text-base">📈</span>
            <div>
              <span class="text-xs font-black text-amber-300">5. 3개년 경쟁률 추이 및 과열도 지표</span>
              <span class="text-[11px] text-slate-400 ml-2">변화 기울기 & 안정 소외 학과</span>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-xs font-black text-white bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-lg">
              <strong class="text-amber-400 text-sm">{{ scoreBreakdown.compTrend.score }}</strong> / 10점
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {{ scoreBreakdown.compTrend.statusText }}
            </span>
          </div>
        </div>

        <div class="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
          <strong class="text-amber-300">💡 배점 기준:</strong> {{ scoreBreakdown.compTrend.ruleDescription }}
        </div>

        <!-- 산출 근거 리스트 -->
        <div class="space-y-1 text-xs">
          <div class="text-[11px] font-bold text-slate-400">📊 적용된 근거:</div>
          <ul class="m-0 pl-4 space-y-1 text-slate-200 text-xs">
            <li v-for="(r, rIdx) in scoreBreakdown.compTrend.reasons" :key="rIdx">
              {{ r }}
            </li>
          </ul>
        </div>

        <!-- 카드별 경쟁률 기울기 리스트 -->
        <div v-if="scoreBreakdown.compTrend.trendCards?.length > 0" class="pt-1">
          <div class="text-[11px] font-bold text-slate-400 mb-1.5">📋 카드별 3개년 경쟁률 추이:</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            <div 
              v-for="(c, cIdx) in scoreBreakdown.compTrend.trendCards" 
              :key="c.id || cIdx"
              class="bg-slate-950/80 border border-slate-800/90 rounded-lg p-2.5 flex flex-col justify-between"
            >
              <div class="flex items-start justify-between">
                <div>
                  <span class="font-bold text-white text-xs">#{{ cIdx + 1 }} {{ c.univName }}</span>
                  <div class="text-[10px] text-slate-400 truncate max-w-35">{{ c.dept }}</div>
                </div>
                <span class="text-[10px] font-bold text-amber-300">{{ c.curRate }}</span>
              </div>
              <div class="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>3년 전 {{ c.prevRate }}</span>
                <span class="font-bold text-slate-300">{{ c.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 지표 6: 전형 유형 위험 분산도 -->
      <div 
        v-if="shouldShow('typeDiversify')" 
        class="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all space-y-3"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div class="flex items-center space-x-2">
            <span class="text-base">⚖️</span>
            <div>
              <span class="text-xs font-black text-blue-300">6. 전형 유형 위험 분산도 지표</span>
              <span class="text-[11px] text-slate-400 ml-2">정량 교과 vs 정성 학종 황금 밸런스</span>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-xs font-black text-white bg-blue-950/80 border border-blue-500/40 px-2.5 py-0.5 rounded-lg">
              <strong class="text-blue-400 text-sm">{{ scoreBreakdown.typeDiversify.score }}</strong> / 10점
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {{ scoreBreakdown.typeDiversify.statusText }}
            </span>
          </div>
        </div>

        <div class="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
          <strong class="text-blue-300">💡 배점 기준:</strong> {{ scoreBreakdown.typeDiversify.ruleDescription }}
        </div>

        <!-- 산출 근거 리스트 -->
        <div class="space-y-1 text-xs">
          <div class="text-[11px] font-bold text-slate-400">📊 적용된 근거:</div>
          <ul class="m-0 pl-4 space-y-1 text-slate-200 text-xs">
            <li v-for="(r, rIdx) in scoreBreakdown.typeDiversify.reasons" :key="rIdx">
              {{ r }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 지표 7: 정시선 쿠션 & 고사일정 충돌 -->
      <div 
        v-if="shouldShow('jungsiConflict')" 
        class="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all space-y-3"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div class="flex items-center space-x-2">
            <span class="text-base">🛡️</span>
            <div>
              <span class="text-xs font-black text-rose-300">7. 정시선 쿠션 & 고사일정 충돌 지표</span>
              <span class="text-[11px] text-slate-400 ml-2">수시 납치 & 원서 증발 방지</span>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-xs font-black text-white bg-rose-950/80 border border-rose-500/40 px-2.5 py-0.5 rounded-lg">
              <strong class="text-rose-400 text-sm">{{ scoreBreakdown.jungsiConflict.score }}</strong> / 10점
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {{ scoreBreakdown.jungsiConflict.statusText }}
            </span>
          </div>
        </div>

        <div class="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
          <strong class="text-rose-300">💡 배점 기준:</strong> {{ scoreBreakdown.jungsiConflict.ruleDescription }}
        </div>

        <!-- 산출 근거 리스트 -->
        <div class="space-y-1 text-xs">
          <div class="text-[11px] font-bold text-slate-400">📊 적용된 근거:</div>
          <ul class="m-0 pl-4 space-y-1 text-slate-200 text-xs">
            <li v-for="(r, rIdx) in scoreBreakdown.jungsiConflict.reasons" :key="rIdx">
              {{ r }}
            </li>
          </ul>
        </div>

        <!-- 납치 주의 카드 or 충돌 상세 -->
        <div v-if="scoreBreakdown.jungsiConflict.captureCards?.length > 0 || scoreBreakdown.jungsiConflict.conflictDetails?.length > 0" class="pt-1 space-y-2">
          <div v-if="scoreBreakdown.jungsiConflict.captureCards?.length > 0" class="bg-rose-950/50 border border-rose-800/60 rounded-lg p-2.5 text-xs text-rose-200">
            <div class="font-bold text-rose-300 mb-1">⚠️ 수시 납치 감지 카드:</div>
            <div v-for="c in scoreBreakdown.jungsiConflict.captureCards" :key="c.id" class="text-[11px]">
              • <strong>{{ c.univName }} {{ c.dept }}</strong>: {{ c.reason }}
            </div>
          </div>

          <div v-if="scoreBreakdown.jungsiConflict.conflictDetails?.length > 0" class="bg-rose-950/50 border border-rose-800/60 rounded-lg p-2.5 text-xs text-rose-200">
            <div class="font-bold text-rose-300 mb-1">📅 고사일 중복 경고 (동일 날짜):</div>
            <div v-for="(det, dIdx) in scoreBreakdown.jungsiConflict.conflictDetails" :key="dIdx" class="text-[11px]">
              • {{ det }}
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 4. 아코디언 하단: 종합 상담 가이드 & 점수 상승 전략 팁 -->
    <div class="bg-indigo-950/80 border border-indigo-500/40 rounded-xl p-3 text-xs text-indigo-200 flex items-start justify-between gap-3">
      <div class="flex items-start space-x-2">
        <span class="text-base shrink-0">🎯</span>
        <div class="leading-relaxed">
          <strong class="text-white font-bold">안전도 점수 올리는 상담 팁:</strong>
          <span v-if="scoreBreakdown.gpaMargin.safeCardsCount === 0" class="ml-1 text-amber-200">
            안정 마진 카드를 1~2장 보강하면 기본 +15점 이상 상승합니다.
          </span>
          <span v-else-if="scoreBreakdown.csatSatam.killerErrors.length > 0" class="ml-1 text-rose-300">
            사탐 응시 불가 과탐 필수 대학을 교체하면 즉시 +10점 이상 회복됩니다.
          </span>
          <span v-else-if="scoreBreakdown.schoolRec.recCount < 2" class="ml-1 text-purple-200">
            학교장추천 카드를 1장 더 활용하면 허수 배제 효과로 +4점이 추가 부여됩니다.
          </span>
          <span v-else class="ml-1 text-indigo-100">
            현재 7대 지표가 우수하게 분산되어 있습니다. 수능 최저 페이스 유지와 면접 준비에 집중하세요.
          </span>
        </div>
      </div>

      <button
        type="button"
        @click="$emit('close')"
        class="text-[11px] font-bold text-indigo-300 hover:text-white underline cursor-pointer shrink-0 bg-transparent border-none p-0"
      >
        상세 접기 ▲
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  scoreBreakdown: {
    type: Object,
    required: true
  },
  safetyScore: {
    type: Number,
    default: 0
  },
  gradeRank: {
    type: String,
    default: 'B'
  },
  balanceType: {
    type: String,
    default: ''
  },
  balanceColor: {
    type: String,
    default: ''
  },
  prescription: {
    type: String,
    default: ''
  },
  initialMetricKey: {
    type: String,
    default: 'ALL'
  }
})

const emit = defineEmits(['close'])

const activeMetricKey = ref(props.initialMetricKey || 'ALL')

const metricTabs = [
  { key: 'gpaMargin', label: '1. 내신마진', icon: '📐' },
  { key: 'csatSatam', label: '2. 수능최저', icon: '🎯' },
  { key: 'schoolRec', label: '3. 학교장추천', icon: '🏫' },
  { key: 'ruralQuota', label: '4. 농어촌', icon: '🌾' },
  { key: 'compTrend', label: '5. 경쟁률추이', icon: '📈' },
  { key: 'typeDiversify', label: '6. 전형분산', icon: '⚖️' },
  { key: 'jungsiConflict', label: '7. 정시선·일정', icon: '🛡️' }
]

function shouldShow(key) {
  if (activeMetricKey.value === 'ALL') return true
  return activeMetricKey.value === key
}

// 외부에서 특정 지표 탭을 열 수 있도록 노출
function setMetricKey(key) {
  activeMetricKey.value = key
}

defineExpose({
  setMetricKey
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

