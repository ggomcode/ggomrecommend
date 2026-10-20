<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
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
            학급과 학생을 선택하여 원클릭으로 실제 성적을 불러오거나, 아래 슬라이더로 모의 성적을 조절할 수 있습니다.
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
                </div>
                <div class="text-[11px] text-slate-600 mt-0.5">
                  <template v-if="counselPersona === 'RURAL'">
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
                      : 'bg-slate-200 text-slate-700'
                  ]"
                >
                  <template v-if="counselPersona === 'RURAL'">
                    {{ line.advantage > 0 ? `농어촌 +${line.advantage}%p 우세` : `일반이 +${Math.abs(line.advantage)}%p 우세` }}
                  </template>
                  <template v-else>
                    {{ line.advantage > 0 ? `교과 +${line.advantage}%p 우세` : `학종 +${Math.abs(line.advantage)}%p 우세` }}
                  </template>
                </span>
                <span class="text-[10px] text-indigo-700 font-bold block mt-0.5" v-if="line.isRecommended">
                  ★ 현 내신 주력 타깃
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
              일반/교과추천 <strong class="text-indigo-700">{{ 6 - basketRecommendation.ruralCount }}장</strong>
            </span>
            <span class="text-slate-400 text-[11px]">|</span>
            <span class="font-mono font-bold text-slate-800">
              교과 <strong class="text-blue-700">{{ basketRecommendation.gyogwaCount }}장</strong> + 
              종합 <strong class="text-purple-700">{{ 6 - basketRecommendation.gyogwaCount }}장</strong>
            </span>
          </template>
          <template v-else>
            <span class="font-mono font-bold text-slate-800">
              학교장추천 교과 <strong class="text-blue-700">{{ basketRecommendation.gyogwaCount }}장</strong> + 
              학생부종합 <strong class="text-purple-700">{{ basketRecommendation.jonghabCount }}장</strong>
              <span v-if="basketRecommendation.essayCount > 0"> + 상향/논술 <strong class="text-rose-700">{{ basketRecommendation.essayCount }}장</strong></span>
            </span>
            <span class="text-xs font-bold text-slate-500 font-mono">(농어촌 0장)</span>
          </template>
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

            <div class="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 relative">
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
                    'px-2 py-0.5 rounded-md text-[11px] font-bold font-mono',
                    isPassApp(app) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  ]"
                >
                  {{ app.finalStage || (isPassApp(app) ? '합격' : '불합격') }}
                </span>
              </td>
              <td class="p-2.5 text-center">
                <span v-if="app.registerStatus === 'Y'" class="px-2 py-0.5 rounded-md text-[11px] font-black bg-indigo-600 text-white">
                  최종등록
                </span>
                <span v-else class="text-slate-500 text-[11px]">-</span>
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
import { useData, maskName, formatGrade } from '../../composables/useStatData'

const { applications } = useData()

// Persona Mode: 'RURAL' (농어촌 일반고 중심) vs 'SAT_GANGNAM' (수능·정시 관점)
const counselPersona = ref('RURAL')

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
// 1. 전형 유불리 계산 로직 (농어촌 vs 일반 / 교과추천 vs 학종)
// -------------------------------------------------------------
const universityLines = computed(() => {
  const gpa = targetGpa.value
  if (counselPersona.value === 'RURAL') {
    return [
      {
        name: '최상위권 (SKYSSHE)',
        desc: '서연고·서성한·이·카·포',
        generalRate: 13.6,
        ruralRate: 42.9,
        advantage: 29.3,
        isRecommended: gpa <= 1.9
      },
      {
        name: '서울 상위권 (JKYSKDHS)',
        desc: '중경외시·건동홍·숙',
        generalRate: 15.1,
        ruralRate: 26.9,
        advantage: 11.8,
        isRecommended: gpa >= 1.8 && gpa <= 2.6
      },
      {
        name: '수도권 주요대 (KSSDAGIEK)',
        desc: '국숭세단·아주·가천·인하·에리카',
        generalRate: 22.9,
        ruralRate: 16.1,
        advantage: -6.8, // 일반이 역전!
        isRecommended: gpa >= 2.4 && gpa <= 3.6
      },
      {
        name: '지방거점국립대 본교',
        desc: '부산·경북·충남·전남 등 9개교',
        generalRate: 48.5,
        ruralRate: 54.2,
        advantage: 5.7,
        isRecommended: gpa >= 2.6 && gpa <= 4.2
      }
    ]
  } else {
    // SAT_GANGNAM (학교장추천 교과 vs 학생부종합)
    return [
      {
        name: '최상위권 (SKYSSHE)',
        desc: '서연고·서성한·이·카·포',
        gyogwaRate: 18.2,
        jonghabRate: 34.5,
        advantage: -16.3, // 학종 우세
        isRecommended: gpa <= 1.9
      },
      {
        name: '서울 상위권 (JKYSKDHS)',
        desc: '중경외시·건동홍·숙',
        gyogwaRate: 28.4,
        jonghabRate: 24.1,
        advantage: 4.3, // 교과추천 우세
        isRecommended: gpa >= 1.8 && gpa <= 2.6
      },
      {
        name: '수도권 주요대 (KSSDAGIEK)',
        desc: '국숭세단·아주·가천·인하·에리카',
        gyogwaRate: 38.6,
        jonghabRate: 19.3,
        advantage: 19.3, // 교과 압도적 우세
        isRecommended: gpa >= 2.4 && gpa <= 3.6
      },
      {
        name: '지방거점국립대 본교',
        desc: '부산·경북·충남·전남 등 9개교',
        gyogwaRate: 56.4,
        jonghabRate: 38.1,
        advantage: 18.3, // 교과 안정
        isRecommended: gpa >= 2.6 && gpa <= 4.2
      }
    ]
  }
})

const ruralVerdict = computed(() => {
  const gpa = targetGpa.value
  const isRuralMode = counselPersona.value === 'RURAL'

  if (isRuralMode) {
    if (gpa <= 2.2) {
      return {
        status: 'RURAL_SUPER',
        statusClass: 'bg-amber-100 text-amber-900 border border-amber-300',
        badge: '농어촌 절대 유리 (합격률 3배)',
        counselMessage: '어머님, 1~2등급대 상위권은 농어촌 전형 합격률이 42.9%로 일반(13.6%) 대비 3배 이상 폭증합니다. 상위권 대학은 농어촌 카드를 3~4장 적극적으로 담아 상향 기회를 극대화해야 합니다.'
      }
    } else if (gpa <= 3.5) {
      return {
        status: 'MIXED',
        statusClass: 'bg-blue-100 text-blue-900 border border-blue-300',
        badge: '농어촌·일반 혼합 분산 필수 (중위권 몰림 역전 주의)',
        counselMessage: '어머님, 2.5~3.5등급 수도권 주요대 라인은 중위권 학생들의 농어촌 몰림 현상으로 오히려 일반전형(22.9%)이 농어촌(16.1%)보다 합격률이 높습니다! 농어촌 2장 + 일반 교과 4장으로 분산해야 안전합니다.'
      }
    } else {
      return {
        status: 'SAFE_FIRST',
        statusClass: 'bg-slate-100 text-slate-700 border border-slate-300',
        badge: '정량 일반교과 & 충원합격 안정 우선',
        counselMessage: '어머님, 3.5등급 이하 구간은 농어촌 컷이 예상보다 높게 튈 수 있습니다. 일반전형 중 수능최저가 있거나 충원율(추합)이 2~3바퀴 도는 정량 교과 전형을 안정선으로 최소 2장 확보해야 합니다.'
      }
    }
  } else {
    // SAT_GANGNAM (수능·정시 & 일반고 심화 관점)
    if (gpa <= 2.0) {
      return {
        status: 'RURAL_SUPER',
        statusClass: 'bg-indigo-100 text-indigo-900 border border-indigo-300',
        badge: '수능최저 교과추천 + 서류형 학종 복합 공략',
        counselMessage: '어머님, 수능·정시 관점에서는 상위권 대학 교과전형의 수능최저 충족 여부가 당락을 가릅니다. 모평 2합 5~6선 최저를 확보하면 학교장추천 교과 2장 + 학종 3장으로 서울 상위권을 공략해야 합니다.'
      }
    } else if (gpa <= 3.2) {
      return {
        status: 'MIXED',
        statusClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
        badge: '학교장추천 교과 우선 (실질경쟁률 급락 구간)',
        counselMessage: '어머님, 2~3등급 일반전형은 모평 최저 기준을 가진 학교장추천 교과의 실질경쟁률이 학종보다 훨씬 낮습니다. 교과 추천 3장 + 학종 2장 + 정시선 고려 상향 1장이 최적 공식입니다.'
      }
    } else {
      return {
        status: 'SAFE_FIRST',
        statusClass: 'bg-slate-100 text-slate-700 border border-slate-300',
        badge: '수시 납치 배제 & 정량 교과 4장 안정',
        counselMessage: '어머님, 3등급 중후반은 학종 정성평가 역전 가능성이 낮으므로, 정시 기대선을 확인한 후 수시 납치가 되지 않는 수도권 4년제 정량 교과 위주로 4장을 깔아두어야 합니다.'
      }
    }
  }
})

// -------------------------------------------------------------
// 2. 수시 6장 황금 바구니 공식 (농어촌 모드 vs 정시 모드)
// -------------------------------------------------------------
const basketRecommendation = computed(() => {
  const gpa = targetGpa.value
  const isRuralMode = counselPersona.value === 'RURAL'

  if (isRuralMode) {
    if (gpa <= 1.8) {
      return {
        challenge: { target: 'SKY (서울·연세·고려)', detail: '농어촌 종합/일반 교과추천 2장', type: '학종/교과' },
        optimal: { target: '서성한이 (서강·성균관·한양·이화)', detail: '농어촌 전형 2장 (수능 최저 충족 승부)', type: '농어촌 교과/종합' },
        safe: { target: '중경외시 (중앙·경희·시립)', detail: '학교장추천 교과 2장 (안정 확보)', type: '일반 교과' },
        ruralCount: 3,
        gyogwaCount: 4,
        jonghabCount: 2,
        essayCount: 0
      }
    } else if (gpa <= 2.7) {
      return {
        challenge: { target: '서성한이 & 중경외시', detail: '농어촌 종합 2장 (상향 스나이핑)', type: '농어촌 학종' },
        optimal: { target: '건동홍숙 & 단국·아주·인하', detail: '농어촌 1장 + 일반 교과 1장', type: '혼합 승부' },
        safe: { target: '지거국 본교 & 경기권 주요대', detail: '일반 학생부교과 2장 (안전 벨트)', type: '일반 교과' },
        ruralCount: 3,
        gyogwaCount: 4,
        jonghabCount: 2,
        essayCount: 0
      }
    } else if (gpa <= 3.8) {
      return {
        challenge: { target: '국숭세단 & 가천·아주', detail: '농어촌 교과 1장 + 학종 1장', type: '도전 2장' },
        optimal: { target: '경기·명지·상명·가톨릭', detail: '일반 학생부교과 2장 (충원율 노림)', type: '일반 교과' },
        safe: { target: '한경국립대·강남대·수원대', detail: '일반 교과 2장 (확실한 합격선)', type: '안정 교과' },
        ruralCount: 2,
        gyogwaCount: 5,
        jonghabCount: 1,
        essayCount: 0
      }
    } else {
      return {
        challenge: { target: '경기권 4년제 (경기·명지·수원)', detail: '일반 교과/농어촌 2장', type: '도전 2장' },
        optimal: { target: '한경국립대·백석대·평택대', detail: '정량 학생부교과 2장', type: '적정 교과' },
        safe: { target: '수도권 전문대 유망학과/지방대', detail: '전문대 수시 2장 / 일반 2장', type: '안정 확보' },
        ruralCount: 1,
        gyogwaCount: 5,
        jonghabCount: 1,
        essayCount: 0
      }
    }
  } else {
    // SAT_GANGNAM (일반고 / 수능정시 중심 바구니: 농어촌 0장)
    if (gpa <= 1.8) {
      return {
        challenge: { target: '서연고 (서울·연세·고려)', detail: '수능최저 충족 교과추천/학종 2장', type: '최상위 상향' },
        optimal: { target: '서성한이 (서강·성균관·한양·이화)', detail: '학교장추천 교과 2장 (2합5/3합7 충족)', type: '교과 추천' },
        safe: { target: '중경외시 (중앙·경희·시립)', detail: '학생부종합/교과 2장 (정시 기대선 초과)', type: '납치 방지선' },
        ruralCount: 0,
        gyogwaCount: 3,
        jonghabCount: 2,
        essayCount: 1
      }
    } else if (gpa <= 2.7) {
      return {
        challenge: { target: '서성한이 & 중경외시', detail: '학생부종합 2장 (수능최저 있는 학종)', type: '상향 학종' },
        optimal: { target: '건동홍숙 & 국민·숭실', detail: '학교장추천 교과 2장 (2합7 충족 승부)', type: '교과 적정' },
        safe: { target: '세종·단국·가천 & 지거국', detail: '학생부교과 2장 (수시 납치 마지노선)', type: '안정 교과' },
        ruralCount: 0,
        gyogwaCount: 4,
        jonghabCount: 2,
        essayCount: 0
      }
    } else if (gpa <= 3.8) {
      return {
        challenge: { target: '국숭세단 & 아주·인하', detail: '수능최저 교과 1장 + 논술/학종 1장', type: '도전 2장' },
        optimal: { target: '경기·명지·가톨릭·상명', detail: '학생부교과 2장 (충원 합격선)', type: '적정 교과' },
        safe: { target: '한경국립대·강남대·수원대', detail: '정량 학생부교과 2장 (정시선 대비 안전)', type: '확실 안정' },
        ruralCount: 0,
        gyogwaCount: 4,
        jonghabCount: 2,
        essayCount: 0
      }
    } else {
      return {
        challenge: { target: '경기·명지·가천 하위', detail: '일반 교과/학종 2장', type: '도전 2장' },
        optimal: { target: '평택·백석·한경국립대', detail: '정량 학생부교과 2장', type: '적정 교과' },
        safe: { target: '수도권 유망 전문대 / 지선대', detail: '일반 교과 2장 (수시 납치 없는 선)', type: '안정 확보' },
        ruralCount: 0,
        gyogwaCount: 5,
        jonghabCount: 1,
        essayCount: 0
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
// 5. 실제 선배들(±0.2등급)의 지원 데이터
// -------------------------------------------------------------
const peerRangeText = computed(() => {
  const min = Math.max(1.0, targetGpa.value - 0.2).toFixed(2)
  const max = (targetGpa.value + 0.2).toFixed(2)
  return `내신 ${min} ~ ${max}등급 합격 사례`
})

const peerApplications = computed(() => {
  if (!applications.value || applications.value.length === 0) return []
  const gpa = targetGpa.value
  let list = applications.value.filter(a => {
    const g = a.allSubjectGrade || a.score9Grade || a.mainSubjectGrade
    if (!g) return false
    const diff = Math.abs(Number(g) - gpa)
    return diff <= 0.25
  })

  if (counselPersona.value === 'RURAL') {
    // 농어촌 모드: 농어촌 전형 지원 선배를 상단에 배치
    list.sort((a, b) => {
      if (a.isRural && !b.isRural) return -1
      if (!a.isRural && b.isRural) return 1
      const gA = a.allSubjectGrade || a.score9Grade || a.mainSubjectGrade || 0
      const gB = b.allSubjectGrade || b.score9Grade || b.mainSubjectGrade || 0
      return gA - gB
    })
  } else {
    // 수능정시 모드: 일반전형(교과/학종) 합격자 우선 배치
    list.sort((a, b) => {
      if (!a.isRural && b.isRural) return -1
      if (a.isRural && !b.isRural) return 1
      const passA = isPassApp(a) ? 1 : 0
      const passB = isPassApp(b) ? 1 : 0
      if (passA !== passB) return passB - passA
      const gA = a.allSubjectGrade || a.score9Grade || a.mainSubjectGrade || 0
      const gB = b.allSubjectGrade || b.score9Grade || b.mainSubjectGrade || 0
      return gA - gB
    })
  }

  return list
})

function copyCounselingSummary() {
  const isRural = counselPersona.value === 'RURAL'
  const modeTitle = isRural ? '농어촌 일반고 특화 관점' : '수능·정시 및 일반전형 심화 관점'
  const text = `
[포곡고등학교 대입 맞춤 상담 처방전 - ${modeTitle}]
------------------------------------------------
■ 학생 기준 성적: 학생부 내신 ${targetGpa.value.toFixed(2)}등급 / 모평 영어 ${englishGrade.value}등급, 탐구 ${tamguGrade.value}등급 (국수평균 ${koreanMathAvg.value}등급)
■ 진단 판정: ${ruralVerdict.value.badge}
 - ${ruralVerdict.value.counselMessage}
■ 추천 수시 6장 황금 바구니:
 1) 상향(2장): ${basketRecommendation.value.challenge.target} (${basketRecommendation.value.challenge.detail})
 2) 적정(2장): ${basketRecommendation.value.optimal.target} (${basketRecommendation.value.optimal.detail})
 3) 안정(2장): ${basketRecommendation.value.safe.target} (${basketRecommendation.value.safe.detail})
 - 추천 전형 배분: ${isRural ? `농어촌 ${basketRecommendation.value.ruralCount}장 + 일반/교과 ${6 - basketRecommendation.value.ruralCount}장` : `학교장추천 교과 ${basketRecommendation.value.gyogwaCount}장 + 학종 ${basketRecommendation.value.jonghabCount}장 (농어촌 0장)`}
■ 수능 최저 및 사탐런 진단:
 - 현재 2합 ${currentTwoSum.value}등급 (${currentJumpLine.value.univs})
 - 1과목 1등급 상승 시: ${nextJumpLine.value.level} (${nextJumpLine.value.univs})
 - 사탐런 상태: ${isSatamRun.value ? '사탐런 전향 (최저 충족 유리, 자연계열 상위권 감점 여부 점검)' : '과탐 유지'}
■ 정시 기대치 & 수시 납치 방지선:
 - 모평 기준 정시 가능 대학: ${jungsiExpectation.value.univLevel}
 - 수시 납치 절대 경고선: ${jungsiExpectation.value.kidnapLine} 이하 지원 금지
------------------------------------------------
포곡고등학교 진로진학상담부
`.trim()

  navigator.clipboard.writeText(text).then(() => {
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2500)
  })
}
</script>
