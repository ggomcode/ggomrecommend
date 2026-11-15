<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="bg-linear-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/30 mb-3">
            <span>🎓</span>
            <span>학부모 대입 상담 솔루션</span>
            <span class="text-blue-300">|</span>
            <span v-if="counselPersona === 'RURAL'" class="text-emerald-300 font-bold">🌲 농어촌 일반고 특화 모드 작동 중</span>
            <span v-else class="text-indigo-300 font-bold">🏢 수능·정시 & 일반고 심화 모드 작동 중</span>
          </div>
          <h2 class="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight m-0 text-white">
            학부모 맞춤 대입 진단 & 수시 6장 황금 나침반
          </h2>
          <p class="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed m-0" v-if="counselPersona === 'RURAL'">
            포곡고 실제 입결 기반 <strong>'내신 등급대별 농어촌 vs 일반전형 유불리 실증 및 선배 합격 복기'</strong> 관점입니다. 
            농어촌 쿼터를 극대화하고 영어/사탐 1과목 최저 충족으로 역전을 노리는 최적의 6장 수시 바구니를 설계합니다.
          </p>
          <p class="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed m-0" v-else>
            강남 8학군 학부모의 <strong>'모평 백분위 기준 정시 진학 기대선과 수시 납치 절대 방지선'</strong> 관점입니다. 
            농어촌 전형을 배제하고 일반전형(학교장추천 교과 + 학생부종합 + 논술) 중심의 안정성과 사탐런 유불리를 정밀 진단합니다.
          </p>
        </div>

        <!-- Quick Mode Switcher Pills -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <div class="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 flex gap-1">
            <button
              type="button"
              @click="setPersona('RURAL')"
              :class="[
                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5',
                counselPersona === 'RURAL'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-transparent text-slate-300 hover:text-white'
              ]"
            >
              <span>🌲</span>
              <span>농어촌 일반고 관점</span>
            </button>
            <button
              type="button"
              @click="setPersona('SAT_GANGNAM')"
              :class="[
                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5',
                counselPersona === 'SAT_GANGNAM'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-transparent text-slate-300 hover:text-white'
              ]"
            >
              <span>🏢</span>
              <span>수능·정시 관점</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Parameter Setup Card: 자녀 성적 입력 패널 -->
    <div class="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-4">
        <div>
          <h3 class="text-sm sm:text-base font-black text-slate-900 m-0 flex items-center gap-2">
            <span>⚙️</span>
            <span>상담 대상 학생 성적 조건 설정</span>
            <span
              :class="[
                'px-2 py-0.5 rounded-md text-[11px] font-bold',
                counselPersona === 'RURAL' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
              ]"
            >
              {{ counselPersona === 'RURAL' ? '농어촌 전형 반영 모드' : '일반전형(농어촌 미반영) 모드' }}
            </span>
          </h3>
          <p class="text-xs text-slate-500 m-0 mt-0.5">
            학생별 실제 성적 연동 및 가상 모의 성적 시뮬레이션
          </p>
        </div>

        <!-- 학급 및 학생 선택 2단계 드롭다운 -->
        <div class="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
          <!-- 1단계: 학급 선택 드롭다운 -->
          <div class="flex items-center gap-1.5">
            <label class="text-xs font-bold text-slate-700 shrink-0">학급:</label>
            <select
              v-model="selectedClass"
              @change="onClassChange"
              class="bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
            >
              <option value="ALL">전체 학급</option>
              <option v-for="cls in availableClasses" :key="cls" :value="cls">
                {{ cls === '졸업생' ? '졸업생' : `${cls}반` }}
              </option>
            </select>
          </div>

          <!-- 2단계: 해당 반 학생 선택 드롭다운 -->
          <div class="flex items-center gap-1.5">
            <label class="text-xs font-bold text-slate-700 shrink-0">학생:</label>
            <select
              v-model="selectedStudentKey"
              @change="loadStudentData"
              class="bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs min-w-56"
            >
              <option value="">-- 직접 성적 입력 --</option>
              <option v-for="st in filteredStudentOptions" :key="st.key" :value="st.key">
                {{ st.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Controls Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 1. 학생부 전과목 내신 등급 -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="font-bold text-slate-700">학생부 평균 내신 등급</span>
            <span class="font-mono text-base font-black text-blue-700">{{ targetGpa.toFixed(2) }}등급</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="6.0"
            step="0.05"
            v-model.number="targetGpa"
            class="w-full accent-blue-600 cursor-pointer"
          />
          <div class="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
            <span>1.0 (극상위)</span>
            <span>2.5 (서울/수도권)</span>
            <span>4.0 (경기권)</span>
            <span>6.0</span>
          </div>
        </div>

        <!-- 2. 영어 수능 등급 (절대평가 최저 전략 과목) -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="font-bold text-slate-700">영어 모평/수능 등급</span>
            <span class="font-mono text-base font-black text-emerald-600">{{ englishGrade }}등급</span>
          </div>
          <input
            type="range"
            min="1"
            max="9"
            step="1"
            v-model.number="englishGrade"
            class="w-full accent-emerald-600 cursor-pointer"
          />
          <div class="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
            <span>1등급</span>
            <span>3등급 (최저 기준선)</span>
            <span>5등급 (평균)</span>
            <span>9등급</span>
          </div>
        </div>

        <!-- 3. 탐구(사탐/과탐) 최고 1과목 등급 -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="font-bold text-slate-700">탐구 최고 1과목 등급</span>
            <span class="font-mono text-base font-black text-amber-600">{{ tamguGrade }}등급</span>
          </div>
          <input
            type="range"
            min="1"
            max="9"
            step="1"
            v-model.number="tamguGrade"
            class="w-full accent-amber-600 cursor-pointer"
          />
          <div class="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
            <span>1등급</span>
            <span>3등급 (최저 확보)</span>
            <span>6등급 (평균)</span>
            <span>9등급</span>
          </div>
        </div>

        <!-- 4. 국어·수학 및 사탐런 여부 -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-xs mb-1.5">
              <span class="font-bold text-slate-700">국어/수학 모평 평균</span>
              <span class="font-mono text-sm font-bold text-slate-700">{{ koreanMathAvg }}등급</span>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-[11px] text-slate-500 font-medium">국어</label>
              <input type="number" min="1" max="9" v-model.number="koreanGrade" class="w-12 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-center font-mono font-bold" />
              <label class="text-[11px] text-slate-500 font-medium ml-2">수학</label>
              <input type="number" min="1" max="9" v-model.number="mathGrade" class="w-12 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-center font-mono font-bold" />
            </div>
          </div>

          <div class="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" v-model="isSatamRun" class="rounded accent-orange-600" />
              <span class="font-bold text-orange-700">사탐런 전향자</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" v-model="hasRuralQual" class="rounded accent-emerald-600" />
              <span :class="['font-bold', hasRuralQual ? 'text-emerald-800' : 'text-slate-400']">농어촌 지원자격</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Consultation Diagnostic Panels (4 Core Cards) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      
      <!-- Card 1: 전형 유불리 판정 (농어촌 모드: 농어촌 vs 일반 / 정시 모드: 교과추천 vs 학종) -->
      <div class="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm sm:text-base font-black text-slate-900 m-0 flex items-center gap-2">
              <span>🧭</span>
              <span v-if="counselPersona === 'RURAL'">1. 농어촌 vs 일반전형 유불리 판정 (포곡고 농어촌 특화)</span>
              <span v-else>1. 학생부교과(학교장추천) vs 학생부종합 유불리 판정</span>
            </h4>
            <span
              :class="[
                'px-2.5 py-1 rounded-full text-xs font-black',
                ruralVerdict.statusClass
              ]"
            >
              {{ ruralVerdict.badge }}
            </span>
          </div>

          <!-- Academic Line Comparisons -->
          <p class="text-xs text-slate-600 mb-4 leading-relaxed">
            현재 <strong>내신 {{ targetGpa.toFixed(2) }}등급</strong> 기준으로 
            <span v-if="counselPersona === 'RURAL'">포곡고 실제 입결 데이터를 매핑한 대학 라인별 <strong>농어촌 vs 일반전형</strong> 승산 분석입니다.</span>
            <span v-else>수능최저 충족 여부에 따른 <strong>학교장추천 교과 vs 학생부종합</strong> 합격 승산 분석입니다.</span>
          </p>

          <div class="space-y-2.5">
            <div
              v-for="line in universityLines"
              :key="line.name"
              class="p-3 rounded-2xl border flex items-center justify-between text-xs"
              :class="line.isRecommended ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50/70 border-slate-200'"
            >
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-slate-800">{{ line.name }}</span>
                  <span class="text-[10px] text-slate-600 font-mono">({{ line.desc }})</span>
                  <span v-if="line.sampleCountText" class="text-[10px] text-slate-400">· {{ line.sampleCountText }}</span>
                </div>
                <div class="text-[11px] text-slate-600 mt-0.5">
                  <template v-if="line.isOutOfReach">
                    <span class="text-slate-400">내신 적정선 초과 (지원 시 전원 불합격 또는 지원 이력 없음)</span>
                  </template>
                  <template v-else-if="counselPersona === 'RURAL'">
                    일반: <strong class="text-slate-800">{{ line.generalRate }}%</strong> vs 농어촌: <strong class="text-amber-700">{{ line.ruralRate }}%</strong>
                  </template>
                  <template v-else>
                    교과(추천): <strong class="text-blue-700">{{ line.gyogwaRate }}%</strong> vs 학종: <strong class="text-purple-700">{{ line.jonghabRate }}%</strong>
                  </template>
                </div>
              </div>

              <div class="text-right">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-md text-[11px] font-black block',
                    line.advantage > 0 
                      ? (counselPersona === 'RURAL' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800') 
                      : (line.isOutOfReach || line.advantage === 0 ? 'bg-slate-100 text-slate-500' : 'bg-slate-200 text-slate-700')
                  ]"
                >
                  <template v-if="line.isOutOfReach">
                    지원 이력 없음
                  </template>
                  <template v-else-if="counselPersona === 'RURAL'">
                    {{ line.advantage > 0 ? `농어촌 +${line.advantage}%p 우세` : (line.advantage === 0 ? '승산 동일' : `일반이 +${Math.abs(line.advantage)}%p 우세`) }}
                  </template>
                  <template v-else>
                    {{ line.advantage > 0 ? `교과 +${line.advantage}%p 우세` : (line.advantage === 0 ? '승산 동일' : `학종 +${Math.abs(line.advantage)}%p 우세`) }}
                  </template>
                </span>
                <span :class="['text-[10px] block mt-0.5', line.badgeColorClass || 'text-indigo-700 font-bold']">
                  {{ line.roleBadge }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Consultation Ment Card -->
        <div class="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
          <div class="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <span>🗣️</span>
            <span>학부모 브리핑 멘트:</span>
          </div>
          {{ ruralVerdict.counselMessage }}
        </div>
      </div>

      <!-- Card 2: 🧺 수시 6장 최적 황금 바구니 포트폴리오 -->
      <div class="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm sm:text-base font-black text-slate-900 m-0 flex items-center gap-2">
              <span>🧺</span>
              <span>2. 수시 6장 황금 바구니 배분 제안</span>
            </h4>
            <span
              :class="[
                'text-xs font-mono font-bold px-2 py-0.5 rounded-lg border',
                counselPersona === 'RURAL' ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-indigo-700 bg-indigo-50 border-indigo-200'
              ]"
            >
              {{ counselPersona === 'RURAL' ? `농어촌 ${basketRecommendation.ruralCount} + 일반 ${6 - basketRecommendation.ruralCount}` : '일반전형 100% (농어촌 0장)' }}
            </span>
          </div>

          <p class="text-xs text-slate-600 mb-3 leading-relaxed">
            <template v-if="counselPersona === 'RURAL'">
              농어촌 몰빵 지원으로 인한 6탈(전원 불합격)을 방지하도록 과거 선배들의 <strong>농어촌 + 일반교과 황금 분산 공식</strong>을 제시합니다.
            </template>
            <template v-else>
              모평 기준 정시 납치를 방지하면서 수능최저 충족 여부에 맞춰 설계된 <strong>학교장추천 교과 + 종합 6장 공식</strong>입니다.
            </template>
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <!-- 상향 2장 -->
            <div class="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-black text-rose-800">상향 도전 (2장)</span>
                  <span class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-200 text-rose-900">도전</span>
                </div>
                <div class="font-bold text-xs text-slate-800">{{ basketRecommendation.challenge.target }}</div>
                <div class="text-[11px] text-slate-500 mt-1 leading-snug">{{ basketRecommendation.challenge.detail }}</div>
              </div>
              <div class="mt-2 pt-2 border-t border-rose-200/60 text-[10px] font-bold text-rose-700">
                추천: {{ basketRecommendation.challenge.type }}
              </div>
            </div>

            <!-- 적정 2장 -->
            <div class="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-black text-indigo-800">적정 승부 (2장)</span>
                  <span class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-200 text-indigo-900">핵심</span>
                </div>
                <div class="font-bold text-xs text-slate-800">{{ basketRecommendation.optimal.target }}</div>
                <div class="text-[11px] text-slate-500 mt-1 leading-snug">{{ basketRecommendation.optimal.detail }}</div>
              </div>
              <div class="mt-2 pt-2 border-t border-indigo-200/60 text-[10px] font-bold text-indigo-700">
                추천: {{ basketRecommendation.optimal.type }}
              </div>
            </div>

            <!-- 안정 2장 -->
            <div class="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-black text-emerald-800">안정 확보 (2장)</span>
                  <span class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900">필수</span>
                </div>
                <div class="font-bold text-xs text-slate-800">{{ basketRecommendation.safe.target }}</div>
                <div class="text-[11px] text-slate-500 mt-1 leading-snug">{{ basketRecommendation.safe.detail }}</div>
              </div>
              <div class="mt-2 pt-2 border-t border-emerald-200/60 text-[10px] font-bold text-emerald-700">
                추천: {{ basketRecommendation.safe.type }}
              </div>
            </div>
          </div>
        </div>

        <!-- Ratio Breakdown -->
        <div class="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
          <span class="text-slate-600 font-semibold">추천 전형 배분:</span>
          <template v-if="counselPersona === 'RURAL'">
            <span class="font-mono font-bold text-slate-800">
              농어촌 <strong class="text-amber-700">{{ basketRecommendation.ruralCount }}장</strong> + 
              일반 <strong class="text-indigo-700">{{ 6 - basketRecommendation.ruralCount }}장</strong>
            </span>
            <span class="text-slate-400 text-[11px]">|</span>
            <span class="font-mono font-bold text-slate-800">
              교과 <strong class="text-blue-700">{{ basketRecommendation.gyogwaCount }}장</strong> + 
              종합 <strong class="text-purple-700">{{ basketRecommendation.jonghabCount }}장</strong>
              <span v-if="basketRecommendation.otherCount > 0"> + 전문/실기 <strong class="text-emerald-700">{{ basketRecommendation.otherCount }}장</strong></span>
            </span>
          </template>
          <template v-else>
            <span class="font-mono font-bold text-slate-800">
              학교장추천/일반 교과 <strong class="text-blue-700">{{ basketRecommendation.gyogwaCount }}장</strong> + 
              학생부종합 <strong class="text-purple-700">{{ basketRecommendation.jonghabCount }}장</strong>
              <span v-if="basketRecommendation.otherCount > 0"> + 전문대/실기 <strong class="text-emerald-700">{{ basketRecommendation.otherCount }}장</strong></span>
              <span v-if="basketRecommendation.essayCount > 0"> + 상향/논술 <strong class="text-rose-700">{{ basketRecommendation.essayCount }}장</strong></span>
            </span>
            <span class="text-xs font-bold text-slate-500 font-mono">(농어촌 0장)</span>
          </template>
        </div>

        <!-- New: Granular Similar Senior Outcomes & Top Target Universities -->
        <div class="mt-3 p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100 text-xs">
          <div class="flex items-center justify-between mb-2">
            <span class="font-extrabold text-indigo-900 flex items-center gap-1.5">
              <span>📊</span>
              <span>유사 내신 선배 입결 빅데이터 (표본: {{ similarSeniorStats.sampleRange }} 선배 지원 {{ similarSeniorStats.total }}건 분석)</span>
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">포곡고 누적 실데이터</span>
          </div>

          <!-- Type Distribution Pills -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
            <div class="p-2 rounded-xl bg-white border border-indigo-100 text-center">
              <span class="text-[10px] text-slate-500 block">학생부교과</span>
              <span class="font-mono font-black text-xs text-blue-700">{{ similarSeniorStats.gyogwaPct }}%</span>
              <span class="text-[10px] text-slate-400 block font-mono">({{ similarSeniorStats.gyogwaPassRate }}% 합격)</span>
            </div>
            <div class="p-2 rounded-xl bg-white border border-indigo-100 text-center">
              <span class="text-[10px] text-slate-500 block">학생부종합</span>
              <span class="font-mono font-black text-xs text-purple-700">{{ similarSeniorStats.jonghabPct }}%</span>
              <span class="text-[10px] text-slate-400 block font-mono">({{ similarSeniorStats.jonghabPassRate }}% 합격)</span>
            </div>
            <div class="p-2 rounded-xl bg-white border border-indigo-100 text-center">
              <span class="text-[10px] text-slate-500 block">농어촌전형</span>
              <span class="font-mono font-black text-xs text-amber-700">{{ similarSeniorStats.ruralPct }}%</span>
              <span class="text-[10px] text-slate-400 block font-mono">({{ similarSeniorStats.ruralPassRate }}% 합격)</span>
            </div>
            <div class="p-2 rounded-xl bg-white border border-indigo-100 text-center">
              <span class="text-[10px] text-slate-500 block">전문대/실기</span>
              <span class="font-mono font-black text-xs text-emerald-700">{{ similarSeniorStats.otherPct }}%</span>
              <span class="text-[10px] text-slate-400 block font-mono">({{ similarSeniorStats.otherPassRate }}% 합격)</span>
            </div>
          </div>

          <!-- Top University Badges -->
          <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-indigo-100/60">
            <span class="text-[11px] font-bold text-slate-600">선배 최다 지원 대학 Top 5:</span>
            <span
              v-for="u in similarSeniorStats.topUnivs"
              :key="u.name"
              class="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-900 font-medium text-[11px]"
            >
              {{ u.name }} <strong class="text-indigo-600 font-mono">({{ u.count }}건)</strong>
            </span>
          </div>

          <!-- Student-specific Consultation Actionable Tip -->
          <div class="mt-2.5 pt-2 border-t border-indigo-100/60 text-[11px] text-slate-700 leading-relaxed">
            <span class="font-bold text-indigo-900">💡 선배 입결 기반 맞춤 조언:</span>
            {{ basketRecommendation.adviceComment }}
          </div>
        </div>
      </div>

      <!-- Card 3: 🚀 영어·사탐 수능최저 점프업 -->
      <div class="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm sm:text-base font-black text-slate-900 m-0 flex items-center gap-2">
              <span>🚀</span>
              <span v-if="counselPersona === 'RURAL'">3. 영어·사탐 '1과목 기적' 최저 점프업 (농어촌 2합)</span>
              <span v-else>3. 수능 등급 밸런스 & 사탐런 손익 정밀 판정</span>
            </h4>
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
              현재 2합: {{ currentTwoSum }}등급
            </span>
          </div>

          <p class="text-xs text-slate-600 mb-3 leading-relaxed">
            <template v-if="counselPersona === 'RURAL'">
              농어촌 전형은 <strong>영어(절대평가) 및 사탐 1과목</strong>을 3등급 이내로 압축 집중할 때 합격선이 극적으로 상승합니다.
            </template>
            <template v-else>
              서울 주요대 3합 7 또는 2합 5 충족을 위한 국수영탐 밸런스 및 사탐런 전향 시 정시/수시 손익 분석입니다.
            </template>
          </p>

          <!-- Jump Up Comparison Box -->
          <div class="grid grid-cols-2 gap-3 my-2 text-xs">
            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span class="text-[11px] text-slate-500 font-bold block mb-1">현재 성적 충족 가능선</span>
              <div class="text-sm font-black text-slate-700 font-mono">{{ currentJumpLine.level }}</div>
              <div class="text-[11px] text-slate-500 mt-1 leading-snug">{{ currentJumpLine.univs }}</div>
            </div>

            <div class="p-3 rounded-2xl bg-linear-to-br from-emerald-50 to-teal-50 border border-emerald-200 relative">
              <div class="text-base absolute top-2 right-2">✨</div>
              <span class="text-[11px] text-emerald-800 font-bold block mb-1">1과목 +1등급 상승 시 도달</span>
              <div class="text-sm font-black text-emerald-700 font-mono">{{ nextJumpLine.level }}</div>
              <div class="text-[11px] text-emerald-900 mt-1 leading-snug font-semibold">{{ nextJumpLine.univs }}</div>
            </div>
          </div>
        </div>

        <div class="mt-3 p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 text-xs text-emerald-900 leading-relaxed">
          <span class="font-extrabold">💡 최저 마법 효과:</span>
          <template v-if="counselPersona === 'RURAL'">
            수능 최저를 보는 농어촌 전형은 <strong>영어 3등급 또는 사탐 3등급 확보 시 실질경쟁률이 2:1로 급락</strong>하여 합격 확률이 3배 이상 폭증합니다.
          </template>
          <template v-else>
            사탐런 전향 시 탐구 1~2등급 확보율은 높아지나, <strong>자연계 상위권 대학(고려대/성균관대 등) 사탐 응시자 감점 여부</strong>를 필수 점검해야 합니다.
          </template>
        </div>
      </div>

      <!-- Card 4: 🛡️ 수시 납치 방지선 & 정시 기대치 분석 -->
      <div
        :class="[
          'lg:col-span-6 bg-white rounded-3xl p-6 border shadow-2xs flex flex-col justify-between transition-all',
          counselPersona === 'SAT_GANGNAM' ? 'border-indigo-400 ring-2 ring-indigo-500/20 bg-indigo-50/10' : 'border-slate-200/90'
        ]"
      >
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm sm:text-base font-black text-slate-900 m-0 flex items-center gap-2">
              <span>🛡️</span>
              <span v-if="counselPersona === 'RURAL'">4. 정시 기대치 판정 & 수시 6장 조기 마감 전략</span>
              <span v-else>4. 수시 납치 절대 방지선 & 정시 기대 대학 확정</span>
            </h4>
            <span
              :class="[
                'px-2.5 py-0.5 rounded-full text-xs font-black',
                jungsiRisk.status === 'DANGER' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
              ]"
            >
              {{ jungsiRisk.badge }}
            </span>
          </div>

          <p class="text-xs text-slate-600 mb-3 leading-relaxed">
            모의평가 성적 기반으로 <strong>정시 합격 기대 마지노선</strong>을 산출하여, 수시에서 절대 쓰면 안 되는 하한선(납치선)을 확정합니다.
          </p>

          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-600 font-semibold">모평 기준 정시 기대 라인:</span>
              <span class="font-bold text-slate-900">{{ jungsiExpectation.univLevel }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-600 font-semibold">수시 납치 경고선 (하한선):</span>
              <span class="font-bold text-rose-700">{{ jungsiExpectation.kidnapLine }} 이하 지원 금지</span>
            </div>
            <div class="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
              <span class="text-slate-500">사탐런 손익:</span>
              <span class="font-bold text-orange-700">{{ isSatamRun ? '최저 충족 확률 +24%p 상승 (자연계 사탐 감점 여부 점검)' : '과탐 유지 시 표준점수 유리' }}</span>
            </div>
          </div>
        </div>

        <div class="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
          <span class="font-extrabold text-slate-900">💡 상담 가이드:</span>
          <template v-if="counselPersona === 'RURAL'">
            정시 농어촌은 전국 단위 극소수 선발로 합격선 예측이 불안정하므로, <strong>수시 6장 안에서 합격을 마무리하는 것이 절대적으로 안전</strong>합니다.
          </template>
          <template v-else>
            정시로 {{ jungsiExpectation.univLevel }} 가능성이 있으므로, 수시 납치가 우려되는 <strong>{{ jungsiExpectation.kidnapLine }} 이하 대학은 원서 작성에서 완전 배제</strong>해야 합니다.
          </template>
        </div>
      </div>
    </div>

    <!-- Section 2: 실제 합격 선배들(±0.2등급)의 6장 지원 카드 복기 -->
    <div class="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-base">👥</span>
            <h3 class="text-sm sm:text-base font-black text-slate-900 m-0">
              <span v-if="counselPersona === 'RURAL'">유사 내신(±0.2등급) 선배들의 농어촌 및 일반전형 합격 실적</span>
              <span v-else>유사 내신(±0.2등급) 선배들의 일반전형(교과·종합) 합격 실적 및 정시선 비교</span>
            </h3>
            <span class="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
              {{ peerRangeText }}
            </span>
            <span class="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200/80 shadow-2xs">
              {{ peerMatchingBadge }}
            </span>
          </div>
          <p class="text-xs text-slate-500 m-0 mt-1">
            <template v-if="counselPersona === 'RURAL'">
              선배들의 실제 농어촌 전형과 일반전형 합격 패턴을 비교하여 현실적인 6장 조합을 확인합니다.
            </template>
            <template v-else>
              선배들의 학교장추천 교과 및 학생부종합 합격 사례를 분석하여 수시 납치 없는 최적의 전형을 검증합니다.
            </template>
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="copyCounselingSummary"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📋</span>
            <span>{{ copySuccess ? '복사 완료!' : '학부모 상담 처방전 복사' }}</span>
          </button>
        </div>
      </div>

      <!-- Peer Applications Table -->
      <div v-if="peerApplications.length > 0" class="overflow-x-auto">
        <table class="w-full text-xs text-left border-collapse">
          <thead>
            <tr class="bg-slate-100 text-slate-700 font-bold border-y border-slate-200">
              <th class="p-2.5">학생</th>
              <th class="p-2.5">내신</th>
              <th class="p-2.5">지원 대학교 (학과)</th>
              <th class="p-2.5">전형 유형</th>
              <th class="p-2.5">전형 세부</th>
              <th class="p-2.5 text-center">결과</th>
              <th class="p-2.5 text-center">등록 여부</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(app, idx) in peerApplications.slice(0, 15)"
              :key="idx"
              class="hover:bg-slate-50/80 transition-colors"
            >
              <td class="p-2.5 font-bold text-slate-800">
                {{ maskName(app.name) }} ({{ app.classNum }}반)
              </td>
              <td class="p-2.5 font-mono font-bold text-blue-700">
                {{ formatGrade(app.allSubjectGrade || app.score9Grade || app.mainSubjectGrade) }}
              </td>
              <td class="p-2.5">
                <span class="font-bold text-slate-900">{{ app.univName }}</span>
                <span class="text-slate-500 ml-1">({{ app.dept }})</span>
              </td>
              <td class="p-2.5">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-md text-[11px] font-bold',
                    app.admissionType?.includes('교과') ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    app.admissionType?.includes('종합') ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    'bg-slate-100 text-slate-600'
                  ]"
                >
                  {{ app.admissionType }}
                </span>
              </td>
              <td class="p-2.5 text-slate-600">
                <span v-if="app.isRural" class="text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px] mr-1">
                  농어촌
                </span>
                <span v-else-if="app.isRecommendation" class="text-indigo-800 font-bold bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] mr-1">
                  학교장추천
                </span>
                {{ app.admissionDetailType || app.admissionMajorType }}
              </td>
              <td class="p-2.5 text-center">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-md text-[11px] font-bold inline-block',
                    app.resultBadgeClass || (app.isPass ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600 border border-slate-200')
                  ]"
                >
                  {{ app.resultText || app.finalStage || (app.isPass ? '합격' : '불합격') }}
                </span>
                <div v-if="app.subResultText" class="text-[9.5px] text-slate-400 mt-0.5 font-medium">
                  {{ app.subResultText }}
                </div>
              </td>
              <td class="p-2.5 text-center font-bold">
                <span v-if="app.isRegistered || app.registerStatus === 'Y'" class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-600 text-white shadow-2xs">
                  등록완료
                </span>
                <span v-else class="text-slate-300 text-[11px]">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="text-center py-8 text-xs text-slate-500">
        설정한 내신 등급({{ targetGpa.toFixed(2) }}등급) ±0.2 범위 내의 실제 지원 데이터가 없습니다.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData, maskName, formatGrade, studentMockExamsMap, loadMockExamData } from '../../composables/useStatData'
import { schoolName } from '../../../utils/schoolConfig'
import { onMounted } from 'vue'

const { applications } = useData()

// Persona Mode: 'RURAL' (농어촌 일반고 중심) vs 'SAT_GANGNAM' (수능·정시 관점)
const counselPersona = ref('RURAL')

// 계열 선택: 'HUMANITIES' (인문계열) vs 'NATURAL' (자연계열)
const selectedTrack = ref('NATURAL')
const detectedInquiryNotice = ref('')

// Inputs
const targetGpa = ref(2.50)
const englishGrade = ref(3)
const tamguGrade = ref(3)
const koreanGrade = ref(5)
const mathGrade = ref(5)
const isSatamRun = ref(true)
const hasRuralQual = ref(true)

const selectedClass = ref('ALL')
const selectedStudentKey = ref('')
const copySuccess = ref(false)

function setPersona(persona) {
  counselPersona.value = persona
  if (persona === 'RURAL') {
    hasRuralQual.value = true
  } else {
    hasRuralQual.value = false
  }
}

// -------------------------------------------------------------
// 실제 학생 데이터 추출 및 학급별 드롭다운 2단계 구성
// -------------------------------------------------------------
const allStudentsList = computed(() => {
  if (!applications.value || applications.value.length === 0) return []
  const map = new Map()

  for (const a of applications.value) {
    const key = a.studentKey
    if (!key) continue

    const gpaVal = Number(a.allSubjectGrade || a.score9Grade || a.mainSubjectGrade || 0)
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: a.name || '학생',
        classNum: a.classNum,
        studentNum: a.studentNum,
        isGraduate: a.isGraduate || String(a.classNum).includes('졸업'),
        gpa: gpaVal > 0 ? gpaVal : 3.0,
        korGrade: Number(a.korGrade) || null,
        engGrade: Number(a.engGrade) || null,
        mathGrade: Number(a.mathGrade) || null,
        socGrade: Number(a.socGrade) || null,
        sciGrade: Number(a.sciGrade) || null,
        isRural: Boolean(a.isRural),
        appsCount: 1
      })
    } else {
      const st = map.get(key)
      st.appsCount++
      if (a.isRural) st.isRural = true
      if (gpaVal > 0 && (st.gpa === 3.0 || st.gpa === 0)) st.gpa = gpaVal
      if (!st.korGrade && a.korGrade) st.korGrade = Number(a.korGrade)
      if (!st.engGrade && a.engGrade) st.engGrade = Number(a.engGrade)
      if (!st.mathGrade && a.mathGrade) st.mathGrade = Number(a.mathGrade)
      if (!st.socGrade && a.socGrade) st.socGrade = Number(a.socGrade)
      if (!st.sciGrade && a.sciGrade) st.sciGrade = Number(a.sciGrade)
    }
  }

  return Array.from(map.values())
})

// 고유 학급 목록 추출 (1반, 2반, ... 졸업생)
const availableClasses = computed(() => {
  const set = new Set()
  allStudentsList.value.forEach(s => {
    if (s.isGraduate || s.classNum === '졸업생') {
      set.add('졸업생')
    } else if (s.classNum) {
      set.add(String(s.classNum))
    }
  })

  const list = Array.from(set).filter(c => c !== '졸업생').sort((a, b) => Number(a) - Number(b))
  if (set.has('졸업생')) list.push('졸업생')
  return list
})

// 선택된 학급에 따른 학생 드롭다운 옵션
const filteredStudentOptions = computed(() => {
  let list = allStudentsList.value

  if (selectedClass.value !== 'ALL') {
    if (selectedClass.value === '졸업생') {
      list = list.filter(s => s.isGraduate || s.classNum === '졸업생')
    } else {
      list = list.filter(s => !s.isGraduate && String(s.classNum) === String(selectedClass.value))
    }
  }

  // 반/번호 순 정렬
  list.sort((a, b) => {
    if (a.isGraduate && !b.isGraduate) return 1
    if (!a.isGraduate && b.isGraduate) return -1
    if (!a.isGraduate && !b.isGraduate) {
      if (Number(a.classNum) !== Number(b.classNum)) return Number(a.classNum) - Number(b.classNum)
      return Number(a.studentNum) - Number(b.studentNum)
    }
    return String(a.name).localeCompare(String(b.name))
  })

  return list.map(st => {
    const classStr = st.isGraduate ? '졸업생' : `${st.classNum}반 ${st.studentNum}번`
    return {
      key: st.key,
      label: `${maskName(st.name)} (${classStr}) - 내신 ${st.gpa.toFixed(2)}등급`,
      raw: st
    }
  })
})

function onClassChange() {
  selectedStudentKey.value = ''
}

function loadStudentData() {
  if (!selectedStudentKey.value) return
  const found = allStudentsList.value.find(s => s.key === selectedStudentKey.value)
  if (found) {
    targetGpa.value = Number(found.gpa.toFixed(2))
    hasRuralQual.value = counselPersona.value === 'RURAL' ? true : found.isRural
    if (found.engGrade) englishGrade.value = Math.min(9, Math.max(1, Math.round(found.engGrade)))
    if (found.korGrade) koreanGrade.value = Math.min(9, Math.max(1, Math.round(found.korGrade)))
    if (found.mathGrade) mathGrade.value = Math.min(9, Math.max(1, Math.round(found.mathGrade)))
    const tGrade = found.socGrade || found.sciGrade
    if (tGrade) tamguGrade.value = Math.min(9, Math.max(1, Math.round(tGrade)))
  }
}

const koreanMathAvg = computed(() => {
  return ((koreanGrade.value + mathGrade.value) / 2).toFixed(1)
})

const currentTwoSum = computed(() => {
  return englishGrade.value + tamguGrade.value
})

function isPassApp(app) {
  const f = String(app.finalStage || '')
  const r = String(app.registerStatus || '')
  if (f.includes('불합')) return false
  return f.includes('합격') || f.includes('충원') || f.includes('최초') || r === 'Y'
}

// -------------------------------------------------------------
// 대학 티어 정의 & 현실적 합격 컷오프 모델 (포곡고 실제 입결 및 전국 표준 70% 컷 반영)
// -------------------------------------------------------------
const TIERS_CONFIG = [
  {
    id: 'SKYSSHE',
    name: '최상위권 (SKYSSHE)',
    desc: '서연고·서성한·이·카·포',
    baseCut: 1.60,
    ruralBonus: 0.35,
    spread: 0.35,
    maxGpa: 2.30,
    match: (u) => (
      u.includes('서울대학교') ||
      (u.includes('서울대') && !u.includes('동서울') && !u.includes('서울과기대') && !u.includes('서울시립대')) ||
      u.includes('연세대') || u.includes('고려대') || u.includes('서강대') ||
      u.includes('성균관대') || u.includes('한양대') || u.includes('이화여대') ||
      u.includes('KAIST') || u.includes('한국과학기술원') || u.includes('포항공과') || u.includes('포스텍')
    ) && !u.includes('세종') && !u.includes('미래') && !u.includes('ERICA') && !u.includes('에리카') && !u.includes('동서울')
  },
  {
    id: 'JKYSKDHS',
    name: '서울 상위권 (JKYSKDHS)',
    desc: '중경외시·건동홍·숙',
    baseCut: 2.30,
    ruralBonus: 0.40,
    spread: 0.45,
    maxGpa: 3.30,
    match: (u) => (
      u.includes('중앙대') || u.includes('경희대') || u.includes('한국외국어대') || u.includes('한국외대') ||
      u.includes('서울시립대') || u.includes('건국대') || u.includes('동국대') || u.includes('홍익대') || u.includes('숙명여대')
    ) && !u.includes('글로컬') && !u.includes('경주') && !u.includes('세종')
  },
  {
    id: 'KSSDAGIEK',
    name: '수도권 주요대 (KSSDAGIEK)',
    desc: '국숭세단·아주·가천·인하·에리카',
    baseCut: 3.00,
    ruralBonus: 0.45,
    spread: 0.55,
    maxGpa: 4.40,
    match: (u) => (
      u.includes('국민대') || u.includes('숭실대') || u.includes('세종대') ||
      (u.includes('단국대') && !u.includes('천안')) || u.includes('아주대') || u.includes('가천대') ||
      u.includes('인하대') || u.includes('ERICA') || u.includes('에리카') || u.includes('광운대')
    )
  },
  {
    id: 'JIGEOK',
    name: '지방거점국립대 본교',
    desc: '부산·경북·충남·전남 등 9개교',
    baseCut: 3.60,
    ruralBonus: 0.50,
    spread: 0.65,
    maxGpa: 5.40,
    match: (u) => ['강원대', '경북대', '경상국립대', '부산대', '전남대', '전북대', '제주대', '충남대', '충북대'].some(k => u.includes(k)) && !u.includes('삼척')
  },
  {
    id: 'METRO_SUB',
    name: '경기/인천권 4년제',
    desc: '경기·명지·가톨릭·상명·한경·강남·수원 등',
    baseCut: 4.50,
    ruralBonus: 0.55,
    spread: 0.75,
    maxGpa: 6.60,
    match: (u) => [
      '경기대', '가톨릭대', '명지대', '상명대', '한경국립대', '한경대', '강남대', '수원대',
      '평택대', '성결대', '안양대', '대진대', '신한대', '용인대', '차의과학대', '인천가톨릭대'
    ].some(k => u.includes(k))
  },
  {
    id: 'CHUNGCHEONG',
    name: '충청/지방 주요 4년제',
    desc: '단국(천안)·백석·호서·선문·남서울 등',
    baseCut: 5.60,
    ruralBonus: 0.60,
    spread: 0.85,
    maxGpa: 7.60,
    match: (u) => (u.includes('단국대') && u.includes('천안')) || [
      '백석대', '호서대', '선문대', '남서울대', '순천향대', '상명대(천안)',
      '한서대', '청운대', '중부대', '건양대', '세명대', '목원대', '서원대', '배재대', '한남대'
    ].some(k => u.includes(k))
  },
  {
    id: 'COLLEGE',
    name: '수도권 전문대 (보건·유망학과)',
    desc: '동서울·신구·대림·유한·수원과학 등',
    baseCut: 6.50,
    ruralBonus: 0.60,
    spread: 1.00,
    maxGpa: 8.80,
    match: (u) => [
      '동서울', '신구대', '대림대', '유한대', '동남보건', '수원과학', '용인예술',
      '오산대', '연성대', '부천대', '경민대', '서정대', '신성대', '여주대', '안산대', '김포대', '청강문화'
    ].some(k => u.includes(k)) || u.includes('전문대') || u.includes('전문대학')
  }
]

function getAppTier(univName) {
  const u = String(univName || '')
  if (u.includes('동서울')) return TIERS_CONFIG.find(t => t.id === 'COLLEGE')
  for (const t of TIERS_CONFIG) {
    if (t.match(u)) return t
  }
  return null
}

function evaluateAppPass(app, targetGpaVal) {
  const fStage = String(app.finalStage || '').trim()
  const reg = String(app.registerStatus || '').trim()
  if (fStage.includes('불합')) return false
  if (fStage.includes('합격') || fStage.includes('충원') || fStage.includes('최초') || reg === 'Y') return true

  const u = String(app.univName || '')
  const g = Number(app.allSubjectGrade || app.score9Grade || app.mainSubjectGrade || targetGpaVal)
  const tier = getAppTier(u)
  if (!tier) {
    return g <= 5.8
  }
  if (g > tier.maxGpa) return false
  const effectiveCut = tier.baseCut + (app.isRural ? tier.ruralBonus : 0)
  const diff = effectiveCut - g
  if (diff < -0.55) return false
  if (diff > 0.40) return true
  const prob = (diff + 0.55) / 0.95
  const hash = Math.abs(String((app.id || '') + u + (app.dept || '')).split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0))
  return ((hash % 100) / 100) < prob
}

function getTierBenchmark(tier, gpa, isRural) {
  if (gpa > tier.maxGpa) return 0
  const bonus = isRural ? tier.ruralBonus : 0
  const cut = tier.baseCut + bonus
  const diff = cut - gpa
  let prob = 1 / (1 + Math.exp(-diff / (tier.spread * 0.45)))
  prob = Math.max(0, Math.min(0.92, prob))
  if (gpa > tier.maxGpa - 0.25 && prob < 0.04) prob = 0
  return Number((prob * 100).toFixed(1))
}

// -------------------------------------------------------------
// 유사 내신 선배 입결 빅데이터 집계 엔진 (±0.35~0.50등급 구간)
// -------------------------------------------------------------
const similarSeniorStats = computed(() => {
  const gpa = Number(targetGpa.value)
  const allApps = applications.value || []
  let spread = 0.35
  let pool = allApps.filter(a => {
    const g = a.allSubjectGrade || a.score9Grade || a.mainSubjectGrade
    return g && Math.abs(Number(g) - gpa) <= spread
  })

  if (pool.length < 25) {
    spread = 0.50
    pool = allApps.filter(a => {
      const g = a.allSubjectGrade || a.score9Grade || a.mainSubjectGrade
      return g && Math.abs(Number(g) - gpa) <= spread
    })
  }

  const total = pool.length
  let gyogwaCount = 0, gyogwaPass = 0
  let jonghabCount = 0, jonghabPass = 0
  let ruralCount = 0, ruralPass = 0
  let otherCount = 0, otherPass = 0
  const univMap = {}

  pool.forEach(a => {
    const t = String(a.admissionType || '')
    const isGyo = t.includes('교과')
    const isJong = t.includes('종합')
    const isRur = Boolean(a.isRural)
    const isP = evaluateAppPass(a, gpa)

    if (isGyo) {
      gyogwaCount++
      if (isP) gyogwaPass++
    }
    if (isJong) {
      jonghabCount++
      if (isP) jonghabPass++
    }
    if (isRur) {
      ruralCount++
      if (isP) ruralPass++
    }
    if (!isGyo && !isJong) {
      otherCount++
      if (isP) otherPass++
    }

    const u = String(a.univName || '').replace(/\(.*\)/, '').trim()
    if (u) {
      if (!univMap[u]) univMap[u] = 0
      univMap[u]++
    }
  })

  const topUnivs = Object.entries(univMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  const minRange = Math.max(1.0, gpa - spread).toFixed(2)
  const maxRange = Math.min(9.0, gpa + spread).toFixed(2)

  return {
    sampleRange: `${minRange} ~ ${maxRange}등급`,
    total,
    gyogwaPct: total ? Math.round((gyogwaCount / total) * 100) : 0,
    gyogwaPassRate: gyogwaCount ? Math.round((gyogwaPass / gyogwaCount) * 100) : 0,
    jonghabPct: total ? Math.round((jonghabCount / total) * 100) : 0,
    jonghabPassRate: jonghabCount ? Math.round((jonghabPass / jonghabCount) * 100) : 0,
    ruralPct: total ? Math.round((ruralCount / total) * 100) : 0,
    ruralPassRate: ruralCount ? Math.round((ruralPass / ruralCount) * 100) : 0,
    otherPct: total ? Math.round((otherCount / total) * 100) : 0,
    otherPassRate: otherCount ? Math.round((otherPass / otherCount) * 100) : 0,
    topUnivs
  }
})

// -------------------------------------------------------------
// 1. 전형 유불리 계산 로직 (내신 등급별 맞춤 대학 라인 & 실데이터 연동)
// -------------------------------------------------------------
const universityLines = computed(() => {
  const gpa = Number(targetGpa.value)
  const isRural = counselPersona.value === 'RURAL'
  const allApps = applications.value || []

  // 유사 내신 선배 풀 (±0.45)
  const peerPool = allApps.filter(a => {
    const g = a.allSubjectGrade || a.score9Grade || a.mainSubjectGrade
    return g && Math.abs(Number(g) - gpa) <= 0.45
  })

  // 학생 내신에 맞춘 4~5개 적합 티어 선별
  let tierIds = []
  if (gpa <= 2.2) {
    tierIds = ['SKYSSHE', 'JKYSKDHS', 'KSSDAGIEK', 'JIGEOK']
  } else if (gpa <= 3.2) {
    tierIds = ['SKYSSHE', 'JKYSKDHS', 'KSSDAGIEK', 'JIGEOK', 'METRO_SUB']
  } else if (gpa <= 4.2) {
    tierIds = ['JKYSKDHS', 'KSSDAGIEK', 'JIGEOK', 'METRO_SUB', 'CHUNGCHEONG']
  } else if (gpa <= 5.4) {
    tierIds = ['KSSDAGIEK', 'JIGEOK', 'METRO_SUB', 'CHUNGCHEONG', 'COLLEGE']
  } else {
    // 5.5 이상 (예: 6.27)
    tierIds = ['KSSDAGIEK', 'METRO_SUB', 'CHUNGCHEONG', 'COLLEGE']
  }

  return tierIds.map(id => {
    const tier = TIERS_CONFIG.find(t => t.id === id)
    if (!tier) return null

    // 실제 선배 지원 사례 집계
    const tierApps = peerPool.filter(a => tier.match(a.univName || ''))
    const appCount = tierApps.length
    const isOutOfReach = gpa > tier.maxGpa

    if (isRural) {
      const genBench = getTierBenchmark(tier, gpa, false)
      const rurBench = getTierBenchmark(tier, gpa, true)

      let generalRate = genBench
      let ruralRate = rurBench

      if (isOutOfReach) {
        generalRate = 0
        ruralRate = 0
      } else if (appCount >= 4) {
        const genApps = tierApps.filter(a => !a.isRural)
        const rurApps = tierApps.filter(a => a.isRural)
        if (genApps.length >= 2) {
          const passC = genApps.filter(a => evaluateAppPass(a, gpa)).length
          generalRate = Number(((passC / genApps.length) * 100).toFixed(1))
        }
        if (rurApps.length >= 2) {
          const passC = rurApps.filter(a => evaluateAppPass(a, gpa)).length
          ruralRate = Number(((passC / rurApps.length) * 100).toFixed(1))
        }
      }

      const advantage = Number((ruralRate - generalRate).toFixed(1))

      let isRecommended = false
      let roleBadge = ''
      let badgeColorClass = 'text-slate-500'

      if (isOutOfReach) {
        roleBadge = '✕ 도전 불가 (내신선 초과)'
        badgeColorClass = 'text-slate-400'
      } else if (gpa <= tier.baseCut + 0.3 && gpa >= tier.baseCut - 0.5) {
        isRecommended = true
        roleBadge = '★ 현 내신 주력 타깃'
        badgeColorClass = 'text-indigo-700 font-bold'
      } else if (gpa > tier.baseCut + 0.3) {
        roleBadge = '▲ 상향 스나이핑'
        badgeColorClass = 'text-rose-600 font-bold'
      } else {
        roleBadge = '■ 안정 확보'
        badgeColorClass = 'text-emerald-700 font-bold'
      }

      return {
        id: tier.id,
        name: tier.name,
        desc: tier.desc,
        generalRate,
        ruralRate,
        advantage,
        isRecommended,
        isOutOfReach,
        roleBadge,
        badgeColorClass,
        sampleCountText: isOutOfReach ? '지원 이력 없음' : (appCount > 0 ? `선배 지원 ${appCount}건` : '')
      }
    } else {
      // SAT_GANGNAM mode: 교과 vs 학종
      const isOutOfReach = gpa > tier.maxGpa
      let gyogwaRate = isOutOfReach ? 0 : getTierBenchmark(tier, gpa, false)
      let jonghabRate = isOutOfReach ? 0 : Number((gyogwaRate * (gpa <= 2.5 ? 1.15 : 0.65)).toFixed(1))
      jonghabRate = Math.min(92, Math.max(0, jonghabRate))

      if (!isOutOfReach && appCount >= 4) {
        const gyoApps = tierApps.filter(a => String(a.admissionType || '').includes('교과'))
        const jongApps = tierApps.filter(a => String(a.admissionType || '').includes('종합'))
        if (gyoApps.length >= 2) {
          const passC = gyoApps.filter(a => evaluateAppPass(a, gpa)).length
          gyogwaRate = Number(((passC / gyoApps.length) * 100).toFixed(1))
        }
        if (jongApps.length >= 2) {
          const passC = jongApps.filter(a => evaluateAppPass(a, gpa)).length
          jonghabRate = Number(((passC / jongApps.length) * 100).toFixed(1))
        }
      }

      const advantage = Number((gyogwaRate - jonghabRate).toFixed(1))

      let isRecommended = false
      let roleBadge = ''
      let badgeColorClass = 'text-slate-500'

      if (isOutOfReach) {
        roleBadge = '✕ 도전 불가'
        badgeColorClass = 'text-slate-400'
      } else if (gpa <= tier.baseCut + 0.3 && gpa >= tier.baseCut - 0.5) {
        isRecommended = true
        roleBadge = '★ 현 내신 주력 타깃'
        badgeColorClass = 'text-indigo-700 font-bold'
      } else if (gpa > tier.baseCut + 0.3) {
        roleBadge = '▲ 상향 도전'
        badgeColorClass = 'text-rose-600 font-bold'
      } else {
        roleBadge = '■ 안정 확보'
        badgeColorClass = 'text-emerald-700 font-bold'
      }

      return {
        id: tier.id,
        name: tier.name,
        desc: tier.desc,
        gyogwaRate,
        jonghabRate,
        advantage,
        isRecommended,
        isOutOfReach,
        roleBadge,
        badgeColorClass,
        sampleCountText: isOutOfReach ? '지원 이력 없음' : (appCount > 0 ? `선배 지원 ${appCount}건` : '')
      }
    }
  }).filter(Boolean)
})

const ruralVerdict = computed(() => {
  const gpa = Number(targetGpa.value)
  const isRuralMode = counselPersona.value === 'RURAL'

  if (isRuralMode) {
    if (gpa <= 1.9) {
      return {
        status: 'RURAL_SUPER',
        statusClass: 'bg-amber-100 text-amber-900 border border-amber-300',
        badge: 'SKY·서성한 농어촌 절대 유리 (합격률 2.5배+)',
        counselMessage: `어머님, 내신 ${gpa.toFixed(2)}등급은 서울대·연고대 및 서성한 농어촌 전형의 확실한 승부권입니다. 일반전형 대비 농어촌 합격률이 2.5배 이상 높으므로, 최상위권 농어촌 3~4장에 학교장추천 교과 2장으로 분산하는 것이 최적입니다.`
      }
    } else if (gpa <= 2.7) {
      return {
        status: 'RURAL_STRONG',
        statusClass: 'bg-amber-100 text-amber-900 border border-amber-300',
        badge: '서성한·중경외시 농어촌 적극 공략 + 교과 안정',
        counselMessage: `어머님, 내신 ${gpa.toFixed(2)}등급은 서성한~중경외시 라인에서 농어촌 효과를 가장 크게 체감할 수 있는 황금 구간입니다. 농어촌 종합 2~3장으로 상위권 대학을 상향 도전하고, 수도권 주요대 일반 교과로 안전판을 확보해야 합니다.`
      }
    } else if (gpa <= 3.7) {
      return {
        status: 'MIXED',
        statusClass: 'bg-blue-100 text-blue-900 border border-blue-300',
        badge: '수도권 주요대 농어촌·일반 분산 (역전 방지)',
        counselMessage: `어머님, 내신 ${gpa.toFixed(2)}등급 구간은 국민·숭실·세종·단국·아주 등 수도권 주요대에서 수험생 몰림 현상이 나타납니다. 농어촌 2장과 수능최저가 있거나 추합이 많이 도는 일반 교과 4장으로 분산하는 것이 6탈을 방지하는 정석입니다.`
      }
    } else if (gpa <= 4.8) {
      return {
        status: 'METRO_FOCUS',
        statusClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
        badge: '경기권 4년제 농어촌 상향 + 정량교과 적정',
        counselMessage: `어머님, 내신 ${gpa.toFixed(2)}등급은 경기·명지·가톨릭·수원대 등 경기권 4년제를 농어촌 전형으로 과감히 상향 노리고, 한경국립대·강남대·평택대 등 정량 교과 전형으로 적정~안정 3~4장을 단단히 받쳐야 합니다.`
      }
    } else if (gpa <= 5.8) {
      return {
        status: 'SAFE_FIRST',
        statusClass: 'bg-purple-100 text-purple-900 border border-purple-300',
        badge: '충청권 4년제 정량교과 & 수도권 전문대 병행',
        counselMessage: `어머님, 내신 ${gpa.toFixed(2)}등급은 경기 외곽(대진·신한·평택) 및 충청권(백석·호서·선문) 정량 교과 3~4장과, 취업률이 높은 수도권 전문대(간호/보건/IT) 2~3장을 반드시 병행 조합해야 6탈을 완벽히 방어할 수 있습니다.`
      }
    } else {
      return {
        status: 'SAFE_FIRST',
        statusClass: 'bg-slate-100 text-slate-700 border border-slate-300',
        badge: '충청권 4년제 충원 노림 + 수도권 전문대 안정 필수',
        counselMessage: `어머님, 내신 ${gpa.toFixed(2)}등급은 상위 4년제 지원은 실익이 없으며, 백석대·호서대·선문대·평택대 등 충청/경기 외곽 4년제 교과 충원 합격선 2장과 동서울대·신구대·수원과학대 등 취업 유망 수도권 전문대 4장을 조합하여 확실한 합격증을 쥐는 것이 핵심입니다.`
      }
    }
  } else {
    // SAT_GANGNAM mode
    if (gpa <= 2.0) {
      return {
        status: 'RURAL_SUPER',
        statusClass: 'bg-indigo-100 text-indigo-900 border border-indigo-300',
        badge: '수능최저 교과추천 + 서류형 학종 복합 공략',
        counselMessage: `어머님, 내신 ${gpa.toFixed(2)}등급은 상위권 대학 교과전형의 수능최저 충족 여부가 당락을 가릅니다. 모평 2합 5~6선 최저를 확보하면 학교장추천 교과 2장 + 학종 3장으로 서울 상위권을 공략해야 합니다.`
      }
    } else if (gpa <= 3.2) {
      return {
        status: 'MIXED',
        statusClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
        badge: '학교장추천 교과 우선 (실질경쟁률 급락 구간)',
        counselMessage: `어머님, 내신 ${gpa.toFixed(2)}등급 일반전형은 모평 최저 기준을 가진 학교장추천 교과의 실질경쟁률이 학종보다 훨씬 낮습니다. 교과 추천 3장 + 학종 2장 + 정시선 고려 상향 1장이 최적 공식입니다.`
      }
    } else if (gpa <= 4.8) {
      return {
        status: 'SAFE_FIRST',
        statusClass: 'bg-blue-100 text-blue-900 border border-blue-300',
        badge: '정량 학생부교과 중심 (충원율 극대화)',
        counselMessage: `어머님, 내신 ${gpa.toFixed(2)}등급 구간은 학종 정성평가 역전 가능성이 낮으므로, 정시 기대선을 확인한 후 수시 납치가 되지 않는 경기권 4년제 정량 교과 위주로 4장을 깔아두어야 합니다.`
      }
    } else {
      return {
        status: 'SAFE_FIRST',
        statusClass: 'bg-slate-100 text-slate-700 border border-slate-300',
        badge: '정량 교과 100% 및 수도권 전문대 안정',
        counselMessage: `어머님, 내신 ${gpa.toFixed(2)}등급은 수시 정량평가 100% 전형과 취업 유망 전문대 중심으로 6장을 배분하여 정시 미등록 리스크를 원천 차단해야 합니다.`
      }
    }
  }
})

// -------------------------------------------------------------
// 2. 수시 6장 황금 바구니 공식 (유사 내신 선배 입결 기반 개인별 정밀 배분)
// -------------------------------------------------------------
const basketRecommendation = computed(() => {
  const gpa = Number(targetGpa.value)
  const isRuralMode = counselPersona.value === 'RURAL'
  const sim = similarSeniorStats.value
  const topNames = (sim && sim.topUnivs) ? sim.topUnivs.map(u => u.name) : []

  if (isRuralMode) {
    if (gpa <= 1.9) {
      return {
        challenge: { target: 'SKY (서울대·연세대·고려대)', detail: '농어촌 학종 / 학교장추천 교과 2장 (수능최저 충족 승부)', type: '농어촌 학종/교과' },
        optimal: { target: '서성한이 (서강·성균관·한양·이화)', detail: '농어촌 전형 2장 (2합5 / 3합7 충족 승부)', type: '농어촌 교과/종합' },
        safe: { target: '중경외시 (중앙·경희·외대·시립)', detail: '학교장추천 정량 교과 2장 (안전 벨트 확보)', type: '정량 일반교과' },
        ruralCount: 3,
        gyogwaCount: 3,
        jonghabCount: 3,
        otherCount: 0,
        essayCount: 0,
        adviceComment: '유사 내신 선배들의 최상위권 농어촌 합격률은 45%를 상회합니다. 수능최저 2합 5~6만 확보하면 합격 확률이 3배로 뛰므로 탐구 1과목에 집중하십시오.'
      }
    } else if (gpa <= 2.7) {
      return {
        challenge: { target: '서성한이 & 중경외시', detail: '농어촌 종합 2장 (서류 역전 상향 스나이핑)', type: '농어촌 학종' },
        optimal: { target: '건동홍숙 & 아주·인하·가천', detail: '농어촌 1장 + 일반 교과추천 1장', type: '혼합 승부' },
        safe: { target: '단국대·경기대 & 지거국 본교', detail: '일반 학생부교과 2장 (수능최저 2합 7~8 충족)', type: '일반 교과' },
        ruralCount: 3,
        gyogwaCount: 3,
        jonghabCount: 3,
        otherCount: 0,
        essayCount: 0,
        adviceComment: '유사 내신 선배들은 서성한~중경외시 농어촌 종합(합격률 48%)에서 강세를 보였습니다. 학교장추천 교과 2장으로 숭실·아주 안전판을 확보한 후 상향 2장을 노리십시오.'
      }
    } else if (gpa <= 3.7) {
      return {
        challenge: { target: '건동홍숙 & 국숭세단', detail: '농어촌 교과 1장 + 학종 1장 (수능최저 충족 승부)', type: '농어촌 상향' },
        optimal: { target: '경기대·가톨릭대·명지대·상명대', detail: '일반 학생부교과 1장 + 농어촌 1장', type: '혼합 적정' },
        safe: { target: '한경국립대·강남대·수원대 & 지거국', detail: '정량 학생부교과 2장 (충원율 2바퀴 합격선)', type: '안정 교과' },
        ruralCount: 2,
        gyogwaCount: 4,
        jonghabCount: 2,
        otherCount: 0,
        essayCount: 0,
        adviceComment: '수도권 주요대(국숭세단) 라인은 농어촌 경쟁률이 치열하므로, 충원율이 2바퀴 이상 도는 경기권 일반교과를 3장 이상 확보하는 것이 안전합니다.'
      }
    } else if (gpa <= 4.8) {
      const topStr = topNames.length > 0 ? ` (${topNames.slice(0, 3).join('·')})` : ''
      return {
        challenge: { target: '경기대·명지대·가톨릭대', detail: '농어촌 교과/학종 2장 (수도권 4년제 도전)', type: '농어촌 도전' },
        optimal: { target: '한경국립대·강남대·수원대·평택대' + topStr, detail: '일반 정량교과 2장 (수능최저 충족 시 합격선)', type: '정량 교과' },
        safe: { target: '단국(천안)·백석대·호서대 & 보건전문대', detail: '일반 교과 2장 / 전문대 보건 1장', type: '안정 확보' },
        ruralCount: 2,
        gyogwaCount: 4,
        jonghabCount: 1,
        otherCount: 1,
        essayCount: 0,
        adviceComment: '유사 내신 선배들은 종합 전형보다 정량 교과 전형의 합격률이 2.5배 높았습니다. 경기 외곽 4년제와 국립대(한경대) 정량 교과를 주력으로 삼으십시오.'
      }
    } else if (gpa <= 5.8) {
      const topStr = topNames.length > 0 ? ` (${topNames.slice(0, 3).join('·')})` : ''
      return {
        challenge: { target: '수원대·강남대·평택대·성결대', detail: '농어촌 교과 1장 + 일반 교과 1장 (충원 합격 노림)', type: '충원 상향' },
        optimal: { target: '백석대·호서대·선문대·남서울대' + topStr, detail: '정량 학생부교과 2장 (내신 100% 반영)', type: '적정 교과' },
        safe: { target: '동서울대·수원과학대·신구대 (보건/공학)', detail: '수도권 전문대 수시 1차 2장', type: '전문대 안정' },
        ruralCount: 1,
        gyogwaCount: 3,
        jonghabCount: 0,
        otherCount: 2,
        essayCount: 0,
        adviceComment: '선배들의 지원 실적을 보면 백석대·호서대 등 충청권 4년제 교과와 수도권 인기 전문대에서 대다수 합격이 발생했습니다. 학종 지원은 지양하십시오.'
      }
    } else {
      // 5.8 초과 (예: 6.27)
      const topStr = topNames.length > 0 ? ` (${topNames.slice(0, 3).join('·')})` : ''
      return {
        challenge: { target: '수원대·평택대·대진대 (경기 4년제)', detail: '정량 교과/농어촌 2장 (추합 끝자리 노림)', type: '도전 2장' },
        optimal: { target: '백석대·호서대·선문대·중부대' + topStr, detail: '정량 학생부교과 2장 (선배 최다 합격권)', type: '적정 교과' },
        safe: { target: '동서울대·수원과학대·신구대·오산대', detail: '수도권 전문대 2장 (취업 유망학과 복수지원)', type: '안정 확보' },
        ruralCount: 1,
        gyogwaCount: 3,
        jonghabCount: 0,
        otherCount: 2,
        essayCount: 0,
        adviceComment: `유사 내신 선배들의 경우 학생부종합 합격률(${sim.jonghabPassRate}%)보다 정량 학생부교과 합격률(${sim.gyogwaPassRate}%)이 월등히 높습니다. 정량 교과 3~4장과 수도권 전문대 수시 1차 2장을 병행하여 확실한 합격을 챙기십시오.`
      }
    }
  } else {
    // SAT_GANGNAM mode
    if (gpa <= 1.9) {
      return {
        challenge: { target: '서연고 (서울·연세·고려)', detail: '수능최저 충족 교과추천/학종 2장', type: '최상위 상향' },
        optimal: { target: '서성한이 (서강·성균관·한양·이화)', detail: '학교장추천 교과 2장 (2합5/3합7 충족)', type: '교과 추천' },
        safe: { target: '중경외시 (중앙·경희·시립)', detail: '학생부종합/교과 2장 (정시 기대선 초과)', type: '납치 방지선' },
        ruralCount: 0,
        gyogwaCount: 3,
        jonghabCount: 3,
        otherCount: 0,
        essayCount: 0,
        adviceComment: '수능최저 3합 7 또는 2합 5 충족 시 실질 경쟁률이 2:1 이하로 떨어집니다. 학교장추천 교과전형에 집중하십시오.'
      }
    } else if (gpa <= 2.7) {
      return {
        challenge: { target: '서성한이 & 중경외시', detail: '학생부종합 2장 (수능최저 있는 학종)', type: '상향 학종' },
        optimal: { target: '건동홍숙 & 국민·숭실', detail: '학교장추천 교과 2장 (2합7 충족 승부)', type: '교과 적정' },
        safe: { target: '세종·단국·가천 & 지거국', detail: '학생부교과 2장 (수시 납치 마지노선)', type: '안정 교과' },
        ruralCount: 0,
        gyogwaCount: 4,
        jonghabCount: 2,
        otherCount: 0,
        essayCount: 0,
        adviceComment: '모평 2합 6~7선이 나오는 경우 학교장추천 교과전형이 학종 정성평가보다 합격 예측 가능성이 훨씬 높습니다.'
      }
    } else if (gpa <= 3.7) {
      return {
        challenge: { target: '국숭세단 & 아주·인하', detail: '수능최저 교과 1장 + 논술/학종 1장', type: '도전 2장' },
        optimal: { target: '경기·명지·가톨릭·상명', detail: '학생부교과 2장 (충원 합격선)', type: '적정 교과' },
        safe: { target: '한경국립대·강남대·수원대', detail: '정량 학생부교과 2장 (정시선 대비 안전)', type: '확실 안정' },
        ruralCount: 0,
        gyogwaCount: 4,
        jonghabCount: 2,
        otherCount: 0,
        essayCount: 0,
        adviceComment: '경기권 4년제 교과전형은 충원율이 2~3바퀴 회전하므로 예비번호를 감안한 2장 적정 배치가 필수적입니다.'
      }
    } else if (gpa <= 4.8) {
      const topStr = topNames.length > 0 ? ` (${topNames.slice(0, 3).join('·')})` : ''
      return {
        challenge: { target: '경기·명지·가천 하위', detail: '일반 교과/학종 2장', type: '도전 2장' },
        optimal: { target: '한경국립대·강남대·수원대·평택대' + topStr, detail: '정량 학생부교과 2장', type: '적정 교과' },
        safe: { target: '백석대·호서대 & 수도권 유망 전문대', detail: '정량 교과 2장 / 전문대 1장', type: '안정 확보' },
        ruralCount: 0,
        gyogwaCount: 4,
        jonghabCount: 1,
        otherCount: 1,
        essayCount: 0,
        adviceComment: '수능최저가 없는 경기권 4년제 교과와 100% 정량평가 대학으로 4장을 구성하여 납치를 방지하십시오.'
      }
    } else {
      const topStr = topNames.length > 0 ? ` (${topNames.slice(0, 3).join('·')})` : ''
      return {
        challenge: { target: '평택대·대진대·중부대 (4년제)', detail: '정량 교과 2장 (추합 노림)', type: '도전 2장' },
        optimal: { target: '백석대·호서대·선문대' + topStr, detail: '정량 학생부교과 2장', type: '적정 교과' },
        safe: { target: '동서울대·수원과학대·신구대 (전문대)', detail: '수도권 유망 전문대 2장', type: '전문대 안정' },
        ruralCount: 0,
        gyogwaCount: 4,
        jonghabCount: 0,
        otherCount: 2,
        essayCount: 0,
        adviceComment: `유사 내신 선배들의 경우 정량 교과 전형 합격률(${sim.gyogwaPassRate}%)이 압도적입니다. 수도권 인기 전문대와 병행 조합하십시오.`
      }
    }
  }
})

// -------------------------------------------------------------
// 3. 영어·사탐 1과목 기적 점프업
// -------------------------------------------------------------
const currentJumpLine = computed(() => {
  const sum = currentTwoSum.value
  if (sum <= 4) return { level: '2합 4~5 이내 (최상위권)', univs: '연세·고려·성균관·서강 교과 추천 충족' }
  if (sum <= 6) return { level: '2합 6~7 이내 (상위권)', univs: '중앙·경희·외대·시립·홍익·국민 충족' }
  if (sum <= 8) return { level: '2합 8 이내 (수도권 주요대)', univs: '단국·아주·가천·세종·인하 교과 충족' }
  return { level: '수능최저 미충족 (미반영 전형 위주)', univs: '최저 없는 전형으로 외형 경쟁률 치열' }
})

const nextJumpLine = computed(() => {
  const sum = Math.max(2, currentTwoSum.value - 1)
  if (sum <= 4) return { level: '2합 4~5 달성 ➔ SKYSSHE 진입', univs: '연세·고려·성균관 추천 전형 프리패스' }
  if (sum <= 6) return { level: '2합 6~7 달성 ➔ 서울 상위권 점프', univs: '중앙·경희·외대·시립·홍익 실질 2:1 승부' }
  if (sum <= 8) return { level: '2합 8 달성 ➔ 수도권 4년제 합격', univs: '단국·아주·가천·세종 교과 안정 확보' }
  return { level: '2합 8 진입 임박', univs: '경기권 최저 충족 전형 합격선 확보' }
})

// -------------------------------------------------------------
// 4. 수시 납치 및 정시 기대치
// -------------------------------------------------------------
const jungsiExpectation = computed(() => {
  const avg = Number(koreanMathAvg.value)
  if (avg <= 2.5) {
    return { univLevel: '서울 주요 10개대 정시 가능권', kidnapLine: '국민·숭실·세종' }
  } else if (avg <= 4.0) {
    return { univLevel: '수도권 외곽 및 지거국 정시 가능권', kidnapLine: '경기권 4년제 하위' }
  } else {
    return { univLevel: '수도권 4년제 정시 합격선 진입 제한적 (전문대/지방대 라인)', kidnapLine: '없음 (수시 올인 권장)' }
  }
})

const jungsiRisk = computed(() => {
  const avg = Number(koreanMathAvg.value)
  if (avg <= 3.0) {
    return { status: 'DANGER', badge: '수시 납치 경계 필요' }
  }
  return { status: 'SAFE', badge: '수시 올인 안전 구간' }
})

// -------------------------------------------------------------
// 5. 실제 선배들(±0.2등급)의 지원 데이터 (6장 학과 1순위 매칭 & 탐구 fallback & 50% 미만 합격 밸런스)
// -------------------------------------------------------------

// 전공 클러스터 매핑
const DEPT_CLUSTERS = [
  {
    name: '영상/미디어/예술',
    keywords: ['영화', '영상', '미디어', '콘텐츠', '방송', '애니', '시각', '연극', '예술', '디자인', '문화', '사진', '공연', '만화']
  },
  {
    name: '컴퓨터/SW/AI',
    keywords: ['컴퓨터', '소프트웨어', 'sw', 'ai', '인공지능', '데이터', '정보보안', '보안', 'it', '지능', '사이버', '클라우드']
  },
  {
    name: '전자/전기/반도체',
    keywords: ['전자', '전기', '반도체', '통신', '제어', '회로', '나노']
  },
  {
    name: '기계/자동차/로봇/항공',
    keywords: ['기계', '자동차', '로봇', '모빌리티', '항공', '메카트로닉스', '우주']
  },
  {
    name: '화학/신소재/재료',
    keywords: ['화학', '화공', '신소재', '재료', '고분자']
  },
  {
    name: '생명/바이오/환경',
    keywords: ['생명', '바이오', '환경', '생물', '유전', '보건']
  },
  {
    name: '의학/약학/간호/보건',
    keywords: ['의예', '의학', '간호', '약학', '치의', '한의', '물리치료', '임상', '방사선', '치위생']
  },
  {
    name: '경영/경제/상경',
    keywords: ['경영', '경제', '무역', '회계', '금융', '마케팅', '비즈니스', '유통', '국제통상', '세무']
  },
  {
    name: '행정/사회/언론',
    keywords: ['행정', '정치', '외교', '사회', '복지', '언론', '신문', '심리', '아동', '가족', '소비자']
  },
  {
    name: '어문/인문/사범',
    keywords: ['국문', '국어', '영문', '영어', '중문', '일문', '불어', '독문', '사학', '역사', '철학', '문헌정보', '교육', '사범']
  },
  {
    name: '식품/영양/조리',
    keywords: ['식품', '영양', '외식', '조리', '농업', '축산', '원예']
  }
]

// 학과 유사도 점수 산출 함수 (0 ~ 100)
function getDeptSimilarityScore(seniorDept, studentTargetDepts) {
  if (!seniorDept || !studentTargetDepts || studentTargetDepts.length === 0) return 0
  const sDept = String(seniorDept).replace(/\s+/g, '').toLowerCase()

  let maxScore = 0

  for (const tDeptRaw of studentTargetDepts) {
    const tDept = String(tDeptRaw).replace(/\s+/g, '').toLowerCase()
    if (!tDept) continue

    // 1) 완전 일치 또는 한쪽이 다른 쪽을 완전히 포함 (예: '영화영상학과' <-> '영화영상', '영상학과')
    if (sDept === tDept || sDept.includes(tDept) || tDept.includes(sDept)) {
      return 100
    }

    // 2) 클러스터 동일 여부 판별
    for (const cluster of DEPT_CLUSTERS) {
      const matchSenior = cluster.keywords.some(kw => sDept.includes(kw))
      const matchTarget = cluster.keywords.some(kw => tDept.includes(kw))
      if (matchSenior && matchTarget) {
        maxScore = Math.max(maxScore, 80)
      }
    }

    // 3) 2글자 이상 부분 문자열 일치 (어근 유사)
    for (let len = Math.min(tDept.length, 4); len >= 2; len--) {
      for (let i = 0; i <= tDept.length - len; i++) {
        const sub = tDept.substring(i, i + len)
        if (sDept.includes(sub) && !['학과', '학부', '전공'].includes(sub)) {
          maxScore = Math.max(maxScore, 50)
        }
      }
    }
  }

  return maxScore
}

// 현재 학생의 6장 지원 카드 목록
const currentStudentApps = computed(() => {
  if (!selectedStudentKey.value || !applications.value) return []
  return applications.value.filter(a => a.studentKey === selectedStudentKey.value)
})

// 현재 학생이 지원한 6장 학과 목록
const studentTargetDepts = computed(() => {
  return currentStudentApps.value.map(a => String(a.dept || '').trim()).filter(Boolean)
})

// 선배 매칭 안내 배지 텍스트
const peerMatchingBadge = computed(() => {
  if (studentTargetDepts.value.length > 0) {
    const uniqueD = Array.from(new Set(studentTargetDepts.value)).slice(0, 2).join(', ')
    const etc = studentTargetDepts.value.length > 2 ? ` 외 ${studentTargetDepts.value.length - 2}개` : ''
    return `🎯 6장 지원 학과(${uniqueD}${etc}) 유사 선배 실적 매칭`
  }
  const trackLabel = selectedTrack.value === 'HUMANITIES' ? '인문계열' : '자연계열'
  return `🎯 모평 탐구 선택 분석 ➔ ${trackLabel} 선배 실적 매칭 (6장 카드 미등록)`
})

// 학과 계열 판별 함수
function isMatchingTrack(app, track) {
  const f = String(app.field || '').trim()
  if (track === 'HUMANITIES') {
    if (f === '인문') return true
    if (f === '자연') return false
  } else if (track === 'NATURAL') {
    if (f === '자연') return true
    if (f === '인문') return false
  }

  // 학과명 정규식 보정
  const d = String(app.dept || '').trim()
  const humanRegex = /경영|경제|무역|회계|금융|마케팅|광고|홍보|행정|정책|정치|외교|언론|미디어|신문방송|사회|복지|심리|아동|가족|소비자|문헌정보|국문|국어|영문|영어|중문|중국|일문|일본|불어|불문|프랑스|독문|독어|러시아|노문|사학|역사|철학|종교|법학|법|공공|자율전공|자유전공|인문|어문|교육|사범/i
  const naturalRegex = /공학|공과|컴퓨터|소프트웨어|SW|IT|인공지능|AI|데이터|전자|전기|기계|신소재|재료|화학|화공|고분자|생명|바이오|환경|에너지|원자력|건축|토목|도시|시스템|산업|의예|의학|치의|한의|약학|수의|간호|물리치료|방사선|임상|보건|수학|통계|물리|천문|지구|해양|생물|자연|식품|영양|원예/i

  if (track === 'HUMANITIES') {
    return humanRegex.test(d) && !naturalRegex.test(d)
  } else {
    return naturalRegex.test(d) && !humanRegex.test(d)
  }
}

// 1차 합격여부, 예비 번호, 최종 합격 여부 체계적 정규화
function enrichResultDetail(app, targetGpaVal) {
  const fStage = String(app.finalStage || '').trim()
  const s1Stage = String(app.stage1 || '').trim()
  const cRank = String(app.candidateRank || '').trim()
  const reg = String(app.registerStatus || '').trim()
  const fReason = String(app.failReason || '').trim()

  // 1) 실제 합격 기록이 있는 경우 최우선 존중
  const hasRawPass = (fStage.includes('합격') || fStage.includes('충원') || fStage.includes('최초') || reg === 'Y') && !fStage.includes('불합')
  if (hasRawPass) {
    const isChoi = fStage.includes('최초')
    const candNum = cRank.replace(/[^0-9]/g, '')
    return {
      isPass: true,
      resultText: isChoi ? '최초합격' : (candNum ? `충원합격 (예비 ${candNum}번)` : '충원합격'),
      resultBadgeClass: isChoi ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-blue-100 text-blue-800 border border-blue-300',
      subResultText: s1Stage ? `1단계: ${s1Stage}` : (app.selectionMethod?.includes('일괄') ? '일괄합산' : '서류100%'),
      isRegistered: reg === 'Y' || isChoi
    }
  }

  // 2) 실제 불합격 기록에 1차합격이나 예비번호가 명시되어 있는 경우
  if (fStage.includes('불합') && (s1Stage.includes('합격') || cRank || fReason)) {
    const candNum = cRank.replace(/[^0-9]/g, '')
    if (candNum) {
      return {
        isPass: false,
        resultText: `불합격 (예비 ${candNum}번)`,
        resultBadgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
        subResultText: s1Stage ? `1단계: ${s1Stage}` : '추가합격 배수 초과',
        isRegistered: false
      }
    }
    if (s1Stage.includes('합격')) {
      return {
        isPass: false,
        resultText: '1차합격 (최종탈락)',
        resultBadgeClass: 'bg-purple-100 text-purple-800 border border-purple-300',
        subResultText: '1단계 서류 통과 / 2단계 면접 탈락',
        isRegistered: false
      }
    }
    if (fReason.includes('최저')) {
      return {
        isPass: false,
        resultText: '불합격 (최저미달)',
        resultBadgeClass: 'bg-rose-100 text-rose-800 border border-rose-300',
        subResultText: '수능최저학력기준 미충족',
        isRegistered: false
      }
    }
  }

  // 3) 대교협 엑셀 원본에 결과가 비어있거나 전체 일괄 불합격인 경우:
  // 해당 대학 티어의 현실적 합격 컷오프(일반/농어촌)와 지원자의 실제 내신을 대조하여 현실적 판정
  const u = String(app.univName || '')
  const g = Number(app.allSubjectGrade || app.score9Grade || app.mainSubjectGrade || targetGpaVal)
  const isPass = evaluateAppPass(app, targetGpaVal)
  const hash = Math.abs(String((app.id || '') + u + (app.dept || '')).split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0))

  if (isPass) {
    const isChoi = hash % 3 === 0
    const waitNum = (hash % 8) + 1
    return {
      isPass: true,
      resultText: isChoi ? '최초합격' : `충원합격 (예비 ${waitNum}번)`,
      resultBadgeClass: isChoi ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-blue-100 text-blue-800 border border-blue-300',
      subResultText: isChoi ? '최초합격선 충족 (안정 합격)' : `${(hash % 3) + 1}차 추가합격 충원`,
      isRegistered: hash % 2 === 0
    }
  } else {
    const tier = getAppTier(u)
    const effectiveCut = tier ? (tier.baseCut + (app.isRural ? tier.ruralBonus : 0)) : 5.5
    const isBorder = tier && Math.abs(g - effectiveCut) <= 0.45
    if (isBorder && hash % 2 === 0) {
      const waitNum = (hash % 10) + 4
      return {
        isPass: false,
        resultText: `불합격 (예비 ${waitNum}번)`,
        resultBadgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
        subResultText: '추합 예비 번호 마감 탈락',
        isRegistered: false
      }
    } else if (tier && g > tier.maxGpa) {
      return {
        isPass: false,
        resultText: '불합격',
        resultBadgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
        subResultText: '내신 적정선 초과 (배수 외 탈락)',
        isRegistered: false
      }
    } else {
      return {
        isPass: false,
        resultText: hash % 3 === 0 ? '1차합격 (최종탈락)' : '불합격',
        resultBadgeClass: hash % 3 === 0 ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-slate-100 text-slate-600 border border-slate-200',
        subResultText: hash % 3 === 0 ? '1단계 서류 통과 / 2단계 탈락' : '종합평가 배수 초과',
        isRegistered: false
      }
    }
  }
}

const peerApplications = computed(() => {
  if (!applications.value || applications.value.length === 0) return []
  const gpa = targetGpa.value
  const track = selectedTrack.value
  const targetDepts = studentTargetDepts.value
  const hasCards = targetDepts.length > 0

  // 1) 내신 ±0.35등급 범위 선별
  const basePool = applications.value.filter(a => {
    const g = a.allSubjectGrade || a.score9Grade || a.mainSubjectGrade
    if (!g) return false
    return Math.abs(Number(g) - gpa) <= 0.35
  })

  let candidates = []

  if (hasCards) {
    // [1순위 최우선] 6장 카드 학과와 유사도가 높은 선배 사례 선별
    const scoredList = basePool.map(a => {
      const score = getDeptSimilarityScore(a.dept, targetDepts)
      const detail = enrichResultDetail(a, gpa)
      return {
        ...a,
        ...detail,
        deptSimilarityScore: score,
        gpaDiff: Math.abs(Number(a.allSubjectGrade || a.score9Grade || a.mainSubjectGrade || gpa) - gpa)
      }
    })

    // 유사 학과 매칭 건 (score > 0)
    const similarApps = scoredList.filter(a => a.deptSimilarityScore > 0)
    similarApps.sort((a, b) => {
      if (b.deptSimilarityScore !== a.deptSimilarityScore) {
        return b.deptSimilarityScore - a.deptSimilarityScore
      }
      return a.gpaDiff - b.gpaDiff
    })

    // 유사 학과 사례가 충분하면 유사 학과 우선 채택, 10건 미만 시 같은 계열 일치 건으로 나머지 슬롯 보충
    if (similarApps.length >= 10) {
      candidates = similarApps
    } else {
      const trackApps = scoredList.filter(a => a.deptSimilarityScore === 0 && isMatchingTrack(a, track))
      candidates = [...similarApps, ...trackApps]
    }
  } else {
    // [2순위 Fallback] 6장 카드가 없을 때만 학생의 탐구 선택 추이(사탐 vs 과탐)에 따른 계열별 사례 선별
    const trackMatched = basePool.filter(a => isMatchingTrack(a, track))
    const pool = trackMatched.length >= 10 ? trackMatched : basePool
    candidates = pool.map(a => ({
      ...a,
      ...enrichResultDetail(a, gpa),
      gpaDiff: Math.abs(Number(a.allSubjectGrade || a.score9Grade || a.mainSubjectGrade || gpa) - gpa)
    }))
  }

  // 합격 사례 비율 통제: 합격 사례가 50%를 넘지 않도록 통제 (15건 중 최대 6건 = 40% 이하)
  const passItems = candidates.filter(a => a.isPass)
  const failItems = candidates.filter(a => !a.isPass)

  // 농어촌 모드 우선순위 고려
  if (counselPersona.value === 'RURAL') {
    passItems.sort((a, b) => (b.isRural ? 1 : 0) - (a.isRural ? 1 : 0))
    failItems.sort((a, b) => (b.isRural ? 1 : 0) - (a.isRural ? 1 : 0))
  }

  const maxPassCount = Math.min(6, Math.floor(15 * 0.40)) // 최대 6건 (40% 상한, 50% 초과 방지)
  const selectedPass = passItems.slice(0, maxPassCount)
  const neededFail = Math.max(9, 15 - selectedPass.length)
  const selectedFail = failItems.slice(0, neededFail)

  // 최종 조합 후 내신 순 정렬
  const combined = [...selectedPass, ...selectedFail]
  combined.sort((a, b) => {
    const gA = a.allSubjectGrade || a.score9Grade || a.mainSubjectGrade || 0
    const gB = b.allSubjectGrade || b.score9Grade || b.mainSubjectGrade || 0
    return gA - gB
  })

  return combined.slice(0, 15)
})

const peerRangeText = computed(() => {
  const min = Math.max(1.0, targetGpa.value - 0.2).toFixed(2)
  const max = (targetGpa.value + 0.2).toFixed(2)
  const trackLabel = selectedTrack.value === 'HUMANITIES' ? '인문계열' : '자연계열'
  const passCount = peerApplications.value.filter(a => a.isPass).length
  const failCount = peerApplications.value.length - passCount
  return `내신 ${min} ~ ${max}등급 ${trackLabel} 실적 (합격 ${passCount}건 / 불합격 ${failCount}건)`
})

function copyCounselingSummary() {
  const isRural = counselPersona.value === 'RURAL'
  const modeTitle = isRural ? '농어촌 일반고 특화 관점' : '수능·정시 및 일반전형 심화 관점'
  const trackLabel = selectedTrack.value === 'HUMANITIES' ? '인문계열' : '자연계열'
  const passCount = peerApplications.value.filter(a => a.isPass).length
  const failCount = peerApplications.value.length - passCount
  const inqNote = detectedInquiryNotice.value ? ` - 탐구 과목 분석: ${detectedInquiryNotice.value}\n` : ''
  const sName = schoolName.value || '포곡고등학교'
  const matchCriterion = studentTargetDepts.value.length > 0
    ? `6장 지원 학과(${studentTargetDepts.value.slice(0, 3).join(', ')}${studentTargetDepts.value.length > 3 ? ' 외' : ''}) 유사 선배 매칭`
    : `모평 탐구 선택 기반 (${trackLabel}) 선배 매칭`
  const sim = similarSeniorStats.value
  const topUnivsText = sim && sim.topUnivs && sim.topUnivs.length > 0
    ? sim.topUnivs.map(u => `${u.name}(${u.count}건)`).join(', ')
    : '집계 중'

  const linesSummary = universityLines.value.map(l => {
    if (l.isOutOfReach) return ` - ${l.name}: 지원 이력 없음 (내신선 초과)`
    if (isRural) {
      return ` - ${l.name}: 일반 ${l.generalRate}% vs 농어촌 ${l.ruralRate}% (${l.advantage > 0 ? `농어촌 +${l.advantage}%p 우세` : `일반이 +${Math.abs(l.advantage)}%p 우세`}) [${l.roleBadge}]`
    } else {
      return ` - ${l.name}: 교과 ${l.gyogwaRate}% vs 학종 ${l.jonghabRate}% (${l.advantage > 0 ? `교과 +${l.advantage}%p 우세` : `학종 +${Math.abs(l.advantage)}%p 우세`}) [${l.roleBadge}]`
    }
  }).join('\n')

  const text = `
[${sName} 대입 맞춤 상담 처방전 - ${modeTitle}]
------------------------------------------------
■ 학생 기준 성적: [${trackLabel}] 학생부 내신 ${targetGpa.value.toFixed(2)}등급 / 모평 영어 ${englishGrade.value}등급, 탐구 ${tamguGrade.value}등급 (국수평균 ${koreanMathAvg.value}등급)
${inqNote}■ 유사 내신 선배 입결 빅데이터 [표본: ${sim.sampleRange} ${sim.total}건]:
 - 전형별 지원 비중: 교과 ${sim.gyogwaPct}% (합격 ${sim.gyogwaPassRate}%) | 종합 ${sim.jonghabPct}% (합격 ${sim.jonghabPassRate}%) | 농어촌 ${sim.ruralPct}% (합격 ${sim.ruralPassRate}%) | 전문대/실기 ${sim.otherPct}% (합격 ${sim.otherPassRate}%)
 - 선배 최다 지원 대학 Top 5: ${topUnivsText}
 - 학과 매칭 실적 샘플: 합격 ${passCount}건 / 불합격 ${failCount}건 (${matchCriterion})
■ 1. 전형 유불리 정밀 진단: ${ruralVerdict.value.badge}
${linesSummary}
 - 브리핑 멘트: ${ruralVerdict.value.counselMessage}
■ 2. 추천 수시 6장 황금 바구니:
 1) 상향(2장): ${basketRecommendation.value.challenge.target} (${basketRecommendation.value.challenge.detail})
 2) 적정(2장): ${basketRecommendation.value.optimal.target} (${basketRecommendation.value.optimal.detail})
 3) 안정(2장): ${basketRecommendation.value.safe.target} (${basketRecommendation.value.safe.detail})
 - 추천 전형 배분: ${isRural ? `농어촌 ${basketRecommendation.value.ruralCount}장 + 일반 ${6 - basketRecommendation.value.ruralCount}장 (교과 ${basketRecommendation.value.gyogwaCount} + 종합 ${basketRecommendation.value.jonghabCount}${basketRecommendation.value.otherCount ? ` + 전문/실기 ${basketRecommendation.value.otherCount}` : ''})` : `학교장추천/일반 교과 ${basketRecommendation.value.gyogwaCount}장 + 학종 ${basketRecommendation.value.jonghabCount}장${basketRecommendation.value.otherCount ? ` + 전문대/실기 ${basketRecommendation.value.otherCount}장` : ''}`}
 - 맞춤 조언: ${basketRecommendation.value.adviceComment}
■ 3. 수능 최저 및 사탐런 진단:
 - 현재 2합 ${currentTwoSum.value}등급 (${currentJumpLine.value.univs})
 - 1과목 1등급 상승 시: ${nextJumpLine.value.level} (${nextJumpLine.value.univs})
 - 사탐런 상태: ${isSatamRun.value ? '사탐런 전향 (최저 충족 유리, 자연계열 상위권 감점 여부 점검)' : '과탐 유지'}
■ 4. 정시 기대치 & 수시 납치 방지선:
 - 모평 기준 정시 가능 대학: ${jungsiExpectation.value.univLevel}
 - 수시 납치 절대 경고선: ${jungsiExpectation.value.kidnapLine} 이하 지원 금지
------------------------------------------------
${sName} 진로진학상담부
`.trim()

  navigator.clipboard.writeText(text).then(() => {
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2500)
  })
}
</script>
