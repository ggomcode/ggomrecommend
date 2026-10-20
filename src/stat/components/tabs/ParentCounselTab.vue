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
            <span class="text-slate-300 font-semibold">농어촌 일반고 vs 수능·정시 관점 융합</span>
          </div>
          <h2 class="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight m-0 text-white">
            학부모 맞춤 대입 진단 & 수시 6장 황금 나침반
          </h2>
          <p class="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed m-0">
            강남 8학군 학부모의 <strong>'수능·정시 기준선과 사탐런 유불리'</strong> 관점과, 
            농어촌 학부모의 <strong>'내신 등급별 농어촌 vs 일반전형 유불리 및 선배 합격 복기'</strong> 관점을 모두 담아 
            학부모의 불안을 해소하고 최적의 6장 수시 바구니를 설계합니다.
          </p>
        </div>

        <!-- Quick Mode Switcher Pills -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <div class="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 flex gap-1">
            <button
              type="button"
              @click="counselPersona = 'RURAL'"
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
              @click="counselPersona = 'SAT_GANGNAM'"
              :class="[
                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5',
                counselPersona === 'SAT_GANGNAM'
                  ? 'bg-indigo-500 text-white shadow-md'
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
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div>
          <h3 class="text-sm sm:text-base font-black text-slate-900 m-0 flex items-center gap-2">
            <span>⚙️</span>
            <span>상담 대상 학생 성적 조건 설정</span>
          </h3>
          <p class="text-xs text-slate-500 m-0 mt-0.5">
            자녀의 내신과 모평 등급을 조절하거나, 등록된 실제 재학생을 선택하여 원클릭으로 세팅할 수 있습니다.
          </p>
        </div>

        <!-- Quick Preset Dropdown: 실제 학생 데이터 불러오기 -->
        <div class="flex items-center gap-2">
          <label class="text-xs font-bold text-slate-600 shrink-0">실제 학생 불러오기:</label>
          <select
            v-model="selectedStudentKey"
            @change="loadStudentData"
            class="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-48"
          >
            <option value="">-- 직접 성적 입력 --</option>
            <option v-for="st in sampleStudentOptions" :key="st.key" :value="st.key">
              {{ st.label }} (내신 {{ st.grade }}등급)
            </option>
          </select>
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
              <span class="font-bold text-emerald-800">농어촌 지원자격</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Consultation Diagnostic Panels (4 Core Cards) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      
      <!-- Card 1: 🧭 농어촌 vs 일반전형 유불리 나침반 (포곡고 농어촌 특화) -->
      <div class="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm sm:text-base font-black text-slate-900 m-0 flex items-center gap-2">
              <span>🧭</span>
              <span>1. 농어촌 vs 일반전형 유불리 판정</span>
            </h4>
            <span
              :class="[
                'px-2.5 py-1 rounded-full text-xs font-black',
                ruralVerdict.status === 'RURAL_SUPER' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                ruralVerdict.status === 'MIXED' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                'bg-slate-100 text-slate-700 border border-slate-300'
              ]"
            >
              {{ ruralVerdict.badge }}
            </span>
          </div>

          <!-- Academic Line Comparisons -->
          <p class="text-xs text-slate-600 mb-4 leading-relaxed">
            현재 <strong>내신 {{ targetGpa.toFixed(2) }}등급</strong> 기준으로 포곡고 실제 입결 데이터를 매핑한 대학 라인별 농어촌 승산 분석입니다.
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
                  일반: <strong class="text-slate-800">{{ line.generalRate }}%</strong> vs 농어촌: <strong class="text-amber-700">{{ line.ruralRate }}%</strong>
                </div>
              </div>

              <div class="text-right">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-md text-[11px] font-black block',
                    line.advantage > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                  ]"
                >
                  {{ line.advantage > 0 ? `농어촌 +${line.advantage}%p 우세` : `일반이 +${Math.abs(line.advantage)}%p 우세` }}
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
            <span class="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
              상향 2 + 적정 2 + 안정 2
            </span>
          </div>

          <p class="text-xs text-slate-600 mb-3 leading-relaxed">
            한쪽에 몰빵 지원하여 6탈(전원 불합격)을 겪지 않도록 과거 합격 선배들의 <strong>합격 바구니 공식</strong>을 제시합니다.
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
        <div class="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <span class="text-slate-600 font-semibold">추천 전형 배분:</span>
          <span class="font-mono font-bold text-slate-800">
            농어촌 <strong class="text-amber-700">{{ basketRecommendation.ruralCount }}장</strong> + 
            일반/교과추천 <strong class="text-indigo-700">{{ 6 - basketRecommendation.ruralCount }}장</strong>
          </span>
          <span class="text-slate-400 text-[11px]">|</span>
          <span class="font-mono font-bold text-slate-800">
            교과 <strong class="text-blue-700">{{ basketRecommendation.gyogwaCount }}장</strong> + 
            종합 <strong class="text-purple-700">{{ 6 - basketRecommendation.gyogwaCount }}장</strong>
          </span>
        </div>
      </div>

      <!-- Card 3: 🚀 영어·사탐 '1과목 기적' 점프업 시뮬레이터 -->
      <div class="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm sm:text-base font-black text-slate-900 m-0 flex items-center gap-2">
              <span>🚀</span>
              <span>3. 영어·사탐 '1과목 기적' 최저 점프업</span>
            </h4>
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
              현재 2합: {{ currentTwoSum }}등급
            </span>
          </div>

          <p class="text-xs text-slate-600 mb-3 leading-relaxed">
            전과목 정시 대비가 아닌 <strong>영어(절대평가) 및 사탐 1과목</strong>을 3등급 이내로 압축 집중할 때 도달 가능한 대학 라인입니다.
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
          수능 최저 기준을 맞추는 학생은 30%에 불과하므로, <strong>영어 3등급 또는 사탐 3등급 확보 시 실질경쟁률이 6:1에서 2:1로 급락</strong>하여 
          합격 확률이 3배 이상 폭증합니다.
        </div>
      </div>

      <!-- Card 4: 🛡️ 수시 납치 방지선 & 정시 기대치 분석 (8학군 관점) -->
      <div class="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm sm:text-base font-black text-slate-900 m-0 flex items-center gap-2">
              <span>🛡️</span>
              <span>4. 수시 납치 방지선 & 정시 기대치 판정</span>
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
            모의평가 성적 기반으로 <strong>정시로 합격 가능한 기대 대학 마지노선</strong>을 산출하여, 수시에서 절대 쓰면 안 되는 하한선을 확정합니다.
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
          재학생의 정시 파이터 합격 확률은 극히 희박하므로, 수시 납치선을 지키면서 <strong>수시 6장 안에서 승부를 끝내는 것이 절대적으로 안전</strong>합니다.
        </div>
      </div>
    </div>

    <!-- Section 2: 실제 합격 선배들(±0.2등급)의 6장 지원 카드 복기 (가장 학부모 신뢰도 높음) -->
    <div class="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-base">👥</span>
            <h3 class="text-sm sm:text-base font-black text-slate-900 m-0">
              유사 내신(±0.2등급) 선배들의 실제 6장 지원 조합 및 최종 합격 실적
            </h3>
            <span class="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
              {{ peerRangeText }}
            </span>
          </div>
          <p class="text-xs text-slate-500 m-0 mt-1">
            학부모 상담 시 선배들의 실제 지원 패턴을 보여주면 막연한 불안감이 사라지고 현실적인 바구니 조합에 동의하게 됩니다.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="copyCounselingSummary"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📋</span>
            <span>{{ copySuccess ? '복사 완료!' : '학부모 상담 요약표 복사' }}</span>
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
                {{ app.displayStudentName || app.studentName }}
              </td>
              <td class="p-2.5 font-mono font-bold text-blue-700">
                {{ formatGrade(app.grade) }}
              </td>
              <td class="p-2.5">
                <span class="font-bold text-slate-900">{{ app.univName }}</span>
                <span class="text-slate-500 ml-1">({{ app.deptName }})</span>
              </td>
              <td class="p-2.5">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-md text-[11px] font-bold',
                    app.admissionType === '학생부교과' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    app.admissionType === '학생부종합' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    'bg-slate-100 text-slate-600'
                  ]"
                >
                  {{ app.admissionType }}
                </span>
              </td>
              <td class="p-2.5 text-slate-600">
                <span v-if="app.isRural" class="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded text-[10px] mr-1">
                  농어촌
                </span>
                {{ app.admissionDetail || app.admissionMajorType }}
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
import { useData, formatGrade } from '../../composables/useStatData'

const { applications, isPass } = useData()

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

const selectedStudentKey = ref('')
const copySuccess = ref(false)

// Sample student presets from real data
const sampleStudentOptions = computed(() => {
  if (!applications.value || applications.value.length === 0) return []
  const map = new Map()
  for (const a of applications.value) {
    if (a.studentKey && a.grade && !map.has(a.studentKey)) {
      map.set(a.studentKey, {
        key: a.studentKey,
        label: `${a.displayStudentName || a.studentName} (${a.classNum || ''}반)`,
        grade: Number(a.grade).toFixed(2),
        rawGrade: Number(a.grade),
        isRural: a.isRural || false
      })
    }
  }
  return Array.from(map.values())
    .sort((a, b) => a.rawGrade - b.rawGrade)
    .slice(0, 30) // 상위 30명 대표 프리셋
})

function loadStudentData() {
  if (!selectedStudentKey.value) return
  const found = sampleStudentOptions.value.find(s => s.key === selectedStudentKey.value)
  if (found) {
    targetGpa.value = found.rawGrade
    hasRuralQual.value = found.isRural
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
// 1. 농어촌 vs 일반전형 유불리 계산 로직
// -------------------------------------------------------------
const universityLines = computed(() => {
  const gpa = targetGpa.value
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
})

const ruralVerdict = computed(() => {
  const gpa = targetGpa.value
  if (gpa <= 2.2) {
    return {
      status: 'RURAL_SUPER',
      badge: '농어촌 절대 유리 (합격률 3배)',
      counselMessage: '어머님, 1~2등급대 상위권은 농어촌 전형 합격률이 42.9%로 일반(13.6%) 대비 3배 이상 폭증합니다. 상위권 대학은 농어촌 카드를 3~4장 적극적으로 담아 상향 기회를 극대화해야 합니다.'
    }
  } else if (gpa <= 3.5) {
    return {
      status: 'MIXED',
      badge: '농어촌·일반 혼합 분산 필수 (중위권 몰림 역전 주의)',
      counselMessage: '어머님, 2.5~3.5등급 수도권 주요대 라인은 중위권 학생들의 농어촌 몰림 현상으로 오히려 일반전형(22.9%)이 농어촌(16.1%)보다 합격률이 높습니다! 농어촌 2장 + 일반 교과 4장으로 분산해야 안전합니다.'
    }
  } else {
    return {
      status: 'SAFE_FIRST',
      badge: '정량 일반교과 & 충원합격 안정 우선',
      counselMessage: '어머님, 3.5등급 이하 구간은 농어촌 컷이 예상보다 높게 튈 수 있습니다. 일반전형 중 수능최저가 있거나 충원율(추합)이 2~3바퀴 도는 정량 교과 전형을 안정선으로 최소 2장 확보해야 합니다.'
    }
  }
})

// -------------------------------------------------------------
// 2. 수시 6장 황금 바구니 공식
// -------------------------------------------------------------
const basketRecommendation = computed(() => {
  const gpa = targetGpa.value
  if (gpa <= 1.8) {
    return {
      challenge: { target: 'SKY (서울·연세·고려)', detail: '농어촌 종합/일반 교과추천 2장', type: '학종/교과' },
      optimal: { target: '서성한이 (서강·성균관·한양·이화)', detail: '농어촌 전형 2장 (수능 최저 충족 승부)', type: '농어촌 교과/종합' },
      safe: { target: '중경외시 (중앙·경희·시립)', detail: '학교장추천 교과 2장 (안정 확보)', type: '일반 교과' },
      ruralCount: 3,
      gyogwaCount: 4
    }
  } else if (gpa <= 2.7) {
    return {
      challenge: { target: '서성한이 & 중경외시', detail: '농어촌 종합 2장 (상향 스나이핑)', type: '농어촌 학종' },
      optimal: { target: '건동홍숙 & 단국·아주·인하', detail: '농어촌 1장 + 일반 교과 1장', type: '혼합 승부' },
      safe: { target: '지거국 본교 & 경기권 주요대', detail: '일반 학생부교과 2장 (안전 벨트)', type: '일반 교과' },
      ruralCount: 3,
      gyogwaCount: 4
    }
  } else if (gpa <= 3.8) {
    return {
      challenge: { target: '국숭세단 & 가천·아주', detail: '농어촌 교과 1장 + 학종 1장', type: '도전 2장' },
      optimal: { target: '경기·명지·상명·가톨릭', detail: '일반 학생부교과 2장 (충원율 노림)', type: '일반 교과' },
      safe: { target: '한경국립대·강남대·수원대', detail: '일반 교과 2장 (확실한 합격선)', type: '안정 교과' },
      ruralCount: 2,
      gyogwaCount: 5
    }
  } else {
    return {
      challenge: { target: '경기권 4년제 (경기·명지·수원)', detail: '일반 교과/농어촌 2장', type: '도전 2장' },
      optimal: { target: '한경국립대·백석대·평택대', detail: '정량 학생부교과 2장', type: '적정 교과' },
      safe: { target: '수도권 전문대 유망학과/지방대', detail: '전문대 수시 2장 / 일반 2장', type: '안정 확보' },
      ruralCount: 1,
      gyogwaCount: 5
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
  const sum = Math.max(2, currentTwoSum.value - 1) // 1등급 올렸을 때
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
  return applications.value.filter(a => {
    if (!a.grade) return false
    const diff = Math.abs(Number(a.grade) - gpa)
    return diff <= 0.2
  })
})

function copyCounselingSummary() {
  const text = `
[포곡고등학교 대입 맞춤 상담 처방전]
------------------------------------------------
■ 학생 기준 성적: 학생부 내신 ${targetGpa.value.toFixed(2)}등급 / 모평 영어 ${englishGrade.value}등급, 탐구 ${tamguGrade.value}등급
■ 농어촌 유불리 진단: ${ruralVerdict.value.badge}
 - ${ruralVerdict.value.counselMessage}
■ 추천 수시 6장 황금 바구니:
 1) 상향(2장): ${basketRecommendation.value.challenge.target} (${basketRecommendation.value.challenge.detail})
 2) 적정(2장): ${basketRecommendation.value.optimal.target} (${basketRecommendation.value.optimal.detail})
 3) 안정(2장): ${basketRecommendation.value.safe.target} (${basketRecommendation.value.safe.detail})
 - 추천 배분: 농어촌 ${basketRecommendation.value.ruralCount}장 + 일반/교과 ${6 - basketRecommendation.value.ruralCount}장
■ 수능 최저 1과목 기적:
 - 현재 2합 ${currentTwoSum.value}등급 (${currentJumpLine.value.univs})
 - 1과목 1등급 상승 시: ${nextJumpLine.value.level} (${nextJumpLine.value.univs})
■ 정시 및 수시 납치 기준: ${jungsiExpectation.value.univLevel} / ${jungsiExpectation.value.kidnapLine} 이하 수시 지원 주의
------------------------------------------------
포곡고등학교 진로진학상담부
`.trim()

  navigator.clipboard.writeText(text).then(() => {
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2500)
  })
}
</script>
