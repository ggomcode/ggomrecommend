<template>
  <div class="space-y-6">
    <!-- 1. 상단 히어로 배너 -->
    <div class="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
      <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-10 -top-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-bold flex items-center gap-1.5">
              <span>🧭</span>
              <span>2028·2029·2030 진학 나침반</span>
            </span>
            <span class="px-3 py-1 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30 text-xs font-bold">
              2028 대입 개편 첫 세대(현 고2) 종합 분석
            </span>
            <span class="px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-xs font-mono font-bold">
              상담 현장 즉시 활용
            </span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-black text-white m-0 tracking-tight leading-snug">
            2028 대입 개편 & 예비 수험생 진학 지도 전략
          </h1>
          <p class="text-xs sm:text-sm text-slate-300 m-0 max-w-3xl leading-relaxed">
            2028 수능의 <strong>선택과목 폐지</strong> 및 <strong>통합사회·통합과학 전원 필수 응시</strong>에 따라 현행의 '수능 사탐런'은 제도적으로 사라집니다. 그러나 사탐런이 증명한 <strong>학생들의 실리적 생존 심리와 과탐 기피 현상</strong>은 2028 체제에서 새로운 대입 변수로 전이됩니다. 본 탭에서는 그 핵심 시사점과 학년별 맞춤 전략을 체계적으로 제공합니다.
          </p>
        </div>

        <!-- 빠른 요약 배지 카드 -->
        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0 lg:w-72 space-y-2 text-right">
          <div class="text-[11px] text-slate-300 font-medium">대입 체제 핵심 지형 변화</div>
          <div class="text-base font-black text-amber-300">
            수능 탐구 공통화 ➔ 학생부 과탐 정밀 평가
          </div>
          <div class="text-[11px] text-indigo-200 leading-tight">
            내신 사탐런(과탐 기피) 경계령 & 수능최저 체감 난이도 급상승
          </div>
        </div>
      </div>

      <!-- 타겟 학년 탭 버튼 -->
      <div class="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-2">
        <span class="text-xs font-bold text-slate-400 mr-1">대상 학년별 보기:</span>
        <button
          v-for="target in gradeTargets"
          :key="target.id"
          type="button"
          @click="activeGrade = target.id"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeGrade === target.id
              ? 'bg-amber-400 text-slate-950 font-black shadow-md scale-102'
              : 'bg-white/10 text-white hover:bg-white/20'
          ]"
        >
          <span>{{ target.icon }}</span>
          <span>{{ target.label }}</span>
          <span class="text-[10px] opacity-80">({{ target.year }}대입)</span>
        </button>
      </div>
    </div>

    <!-- 2. 핵심 분석: 사탐런(71.9%)이 2028 대입에 던지는 4대 심층 시사점 -->
    <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 class="text-lg sm:text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <span>💡</span>
            <span>'사탐런(과탐 기피)' 현상이 2028 대입에 던지는 4대 시사점</span>
          </h2>
          <p class="text-xs text-slate-500 m-0 mt-1">
            수능 시험지에서 선택과목은 사라지지만, 수험생들의 '고효율 생존 본능'은 고교 교육과정과 학생부로 전이됩니다.
          </p>
        </div>
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200 text-xs font-black shrink-0">
          <span>🔥</span>
          <span>진학 교사 핵심 브리핑 포인트</span>
        </span>
      </div>

      <!-- 4대 시사점 카드 그리드 (기본 4개 그리드 뷰) -->
      <div v-if="expandedInsightIndex === null" class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <div
          v-for="(item, idx) in insightsList"
          :key="item.num"
          @click="expandedInsightIndex = idx"
          class="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 hover:border-indigo-400 hover:shadow-md hover:bg-white transition-all space-y-2.5 cursor-pointer group relative"
          title="클릭하여 발표용으로 확대"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center font-mono" :class="item.badgeBg">{{ item.num }}</span>
              <h3 class="text-sm font-black text-slate-900 m-0 group-hover:text-indigo-600 transition-colors">{{ item.title }}</h3>
            </div>
            <span class="text-[10px] font-bold text-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              <span>🔍</span>
              <span>확대</span>
            </span>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed m-0" v-html="item.descHtml"></p>
          <div class="p-2.5 rounded-xl bg-white border text-[11px] font-medium" :class="item.alertBorder">
            {{ item.alertIcon }} <strong>{{ item.alertTitle }}</strong> {{ item.alertText }}
          </div>
        </div>
      </div>

      <!-- 4대 시사점 프레젠테이션 확대 모드 (단일 카드 전면 확대 뷰) -->
      <div
        v-else
        class="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-slate-50 via-white to-indigo-50/40 border-2 border-indigo-400 shadow-xl space-y-5"
      >
        <!-- 프레젠테이션 컨트롤 툴바 -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-100">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center gap-1 shadow-2xs">
              <span>📺</span>
              <span>프레젠테이션 발표 모드</span>
            </span>
            <span class="text-xs font-bold text-slate-500">
              시사점 <strong class="text-indigo-600 font-mono">{{ expandedInsightIndex + 1 }}</strong> / 4
            </span>
          </div>

          <!-- 번호 직접 이동 탭 & 이전/다음 & 축소 버튼 -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <div class="flex items-center gap-1 mr-2">
              <button
                v-for="(_, idx) in insightsList"
                :key="idx"
                type="button"
                @click="expandedInsightIndex = idx"
                :class="[
                  'w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer font-mono',
                  expandedInsightIndex === idx
                    ? 'bg-indigo-600 text-white shadow-xs scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                ]"
              >
                0{{ idx + 1 }}
              </button>
            </div>

            <button
              type="button"
              :disabled="expandedInsightIndex <= 0"
              @click="expandedInsightIndex--"
              class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              ◀ 이전
            </button>
            <button
              type="button"
              :disabled="expandedInsightIndex >= insightsList.length - 1"
              @click="expandedInsightIndex++"
              class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              다음 ▶
            </button>
            <button
              type="button"
              @click="expandedInsightIndex = null"
              class="px-3.5 py-1.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white shadow-sm cursor-pointer transition-colors flex items-center gap-1 ml-1"
            >
              <span>✕</span>
              <span>원래 크기로 축소</span>
            </button>
          </div>
        </div>

        <!-- 본문 내용 (프레젠테이션용 대형 타이포그래피) -->
        <div class="space-y-4 py-2">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl font-black text-base flex items-center justify-center font-mono shadow-xs" :class="insightsList[expandedInsightIndex].badgeBg">
              {{ insightsList[expandedInsightIndex].num }}
            </span>
            <h3 class="text-xl sm:text-2xl font-black text-slate-950 m-0 tracking-tight">
              {{ insightsList[expandedInsightIndex].title }}
            </h3>
          </div>

          <p class="text-base sm:text-lg text-slate-700 leading-relaxed font-normal m-0" v-html="insightsList[expandedInsightIndex].descHtml"></p>

          <div class="p-4 sm:p-5 rounded-2xl bg-white border-2 text-sm sm:text-base font-medium shadow-xs" :class="insightsList[expandedInsightIndex].alertBorder">
            <div class="flex items-start gap-2.5">
              <span class="text-xl sm:text-2xl shrink-0 mt-0.5">{{ insightsList[expandedInsightIndex].alertIcon }}</span>
              <div>
                <strong class="font-black text-slate-950 mr-1.5 text-base sm:text-lg">{{ insightsList[expandedInsightIndex].alertTitle }}</strong>
                <span class="text-slate-800 leading-relaxed">{{ insightsList[expandedInsightIndex].alertText }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 하단 안내 바 -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>💡 발표 팁: [ESC] 키를 누르거나 [원래 크기로 축소]를 누르면 4개 카드 그리드로 돌아갑니다.</span>
          <button
            type="button"
            @click="expandedInsightIndex = null"
            class="text-indigo-600 font-bold hover:underline cursor-pointer"
          >
            전체 카드 한눈에 보기
          </button>
        </div>
      </div>
    </div>

    <!-- 3. 학년별 맞춤 입시 로드맵 (고2 vs 고1 vs 중3) -->
    <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 class="text-lg sm:text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <span>🎯</span>
            <span>학년별 맞춤 진학 지도 가이드: {{ currentTargetData.gradeTitle }}</span>
          </h2>
          <p class="text-xs text-slate-500 m-0 mt-1">
            적용 대입 제도: <strong>{{ currentTargetData.systemLabel }}</strong> (입시 로드맵 및 상담 액션 플랜)
          </p>
        </div>
        <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            v-for="target in gradeTargets"
            :key="target.id"
            type="button"
            @click="activeGrade = target.id"
            :class="[
              'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeGrade === target.id ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            {{ target.shortLabel }}
          </button>
        </div>
      </div>

      <!-- 선택된 학년의 3단 상세 전략 카드 (기본 3개 그리드 뷰) -->
      <div v-if="expandedGradeCardIndex === null" class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div
          v-for="(card, cIdx) in gradeStrategyCards"
          :key="card.type"
          @click="expandedGradeCardIndex = cIdx"
          :class="[
            'p-5 rounded-2xl border transition-all space-y-3 cursor-pointer group hover:shadow-md hover:border-indigo-400',
            card.borderClass,
            card.bgClass
          ]"
          title="클릭하여 발표용으로 확대"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="p-2 rounded-xl text-xs font-black" :class="card.badgeClass">{{ card.icon }}</span>
              <h4 class="text-sm font-black m-0" :class="card.titleClass">{{ card.title }}</h4>
            </div>
            <span class="text-[10px] font-bold text-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0 bg-white/80 px-2 py-0.5 rounded-full border border-indigo-200">
              <span>🔍</span>
              <span>확대</span>
            </span>
          </div>
          <ul class="text-xs text-slate-700 space-y-2 list-disc list-inside pl-1 leading-relaxed">
            <li v-for="(item, idx) in card.items" :key="idx">
              <span class="font-bold text-slate-900">{{ item.title }}:</span> {{ item.desc }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 학년별 3단 전략 프레젠테이션 확대 모드 (단일 카드 전면 확대 뷰) -->
      <div
        v-else
        class="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-slate-50 via-white to-amber-50/30 border-2 border-indigo-400 shadow-xl space-y-5"
      >
        <!-- 프레젠테이션 컨트롤 툴바 -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-100">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center gap-1 shadow-2xs">
              <span>📺</span>
              <span>학년별 맞춤 전략 발표 모드</span>
            </span>
            <span class="text-xs font-bold text-slate-600">
              {{ currentTargetData.gradeTitle }}
            </span>
          </div>

          <!-- 전략별 탭 버튼 & 이전/다음 & 축소 버튼 -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <div class="flex items-center gap-1 mr-2">
              <button
                v-for="(c, cIdx) in gradeStrategyCards"
                :key="c.type"
                type="button"
                @click="expandedGradeCardIndex = cIdx"
                :class="[
                  'px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1',
                  expandedGradeCardIndex === cIdx
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                ]"
              >
                <span>{{ c.icon }}</span>
                <span>{{ c.title.split(' ')[0] }}</span>
              </button>
            </div>

            <button
              type="button"
              :disabled="expandedGradeCardIndex <= 0"
              @click="expandedGradeCardIndex--"
              class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              ◀ 이전
            </button>
            <button
              type="button"
              :disabled="expandedGradeCardIndex >= gradeStrategyCards.length - 1"
              @click="expandedGradeCardIndex++"
              class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              다음 ▶
            </button>
            <button
              type="button"
              @click="expandedGradeCardIndex = null"
              class="px-3.5 py-1.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white shadow-sm cursor-pointer transition-colors flex items-center gap-1 ml-1"
            >
              <span>✕</span>
              <span>원래 크기로 축소</span>
            </button>
          </div>
        </div>

        <!-- 본문 내용 (프레젠테이션용 대형 텍스트) -->
        <div class="space-y-4 py-2">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl text-lg font-black flex items-center justify-center shadow-xs" :class="gradeStrategyCards[expandedGradeCardIndex].badgeClass">
              {{ gradeStrategyCards[expandedGradeCardIndex].icon }}
            </span>
            <div>
              <h3 class="text-xl sm:text-2xl font-black text-slate-950 m-0 tracking-tight">
                {{ gradeStrategyCards[expandedGradeCardIndex].title }}
              </h3>
              <div class="text-xs text-slate-500 font-medium mt-0.5">
                대상: {{ currentTargetData.gradeTitle }} ({{ currentTargetData.systemLabel }})
              </div>
            </div>
          </div>

          <!-- 세부 전략 항목 (대형 독립 카드 리스트) -->
          <div class="grid grid-cols-1 gap-3.5 pt-2">
            <div
              v-for="(item, idx) in gradeStrategyCards[expandedGradeCardIndex].items"
              :key="idx"
              class="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5"
            >
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center font-mono shrink-0">
                  {{ idx + 1 }}
                </span>
                <h5 class="text-base sm:text-lg font-black text-slate-900 m-0">
                  {{ item.title }}
                </h5>
              </div>
              <p class="text-sm sm:text-base text-slate-700 leading-relaxed m-0 pl-8.5 font-normal">
                {{ item.desc }}
              </p>
            </div>
          </div>
        </div>

        <!-- 하단 안내 바 -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>💡 발표 팁: [ESC] 키를 누르거나 [원래 크기로 축소]를 누르면 3개 카드 그리드로 돌아갑니다.</span>
          <button
            type="button"
            @click="expandedGradeCardIndex = null"
            class="text-indigo-600 font-bold hover:underline cursor-pointer"
          >
            전체 3개 전략 한눈에 보기
          </button>
        </div>
      </div>

      <!-- 2022 개정 교육과정 탐구 선택과목 쏠림 & 회피 정밀 분석 (현 고2 2028 대입 전용) -->
      <div class="p-5 sm:p-6 rounded-2xl bg-slate-900 text-white space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px]">2022 개정 교육과정 편제</span>
              <h4 class="text-sm sm:text-base font-black text-amber-300 m-0 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>내신 탐구 선택과목 쏠림(물·화 회피, 생·지 및 윤리·사문 집중) 경계령</span>
              </h4>
            </div>
            <p class="text-[11px] text-slate-400 m-0 mt-1">
              현 고2부터는 '물리학Ⅰ, 사회문화'가 아닌 <strong>2022 개정 과목명(물리학, 화학, 현대사회와 윤리, 사회와 문화 등)</strong>이 적용되며, 등급 유불리에 따른 극단적 수강 쏠림이 예상됩니다.
            </p>
          </div>
          <span class="text-[11px] text-indigo-300 font-mono">서울대·연고대 학종 평가 핵심 기준</span>
        </div>

        <!-- 2개 교과 쏠림 vs 회피 카드 (기본 2개 그리드 뷰) -->
        <div v-if="expandedSubjectSkewIndex === null" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <!-- 과학 교과 쏠림 vs 회피 -->
          <div
            @click="expandedSubjectSkewIndex = 0"
            class="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-400 hover:bg-white/10 transition-all space-y-2.5 cursor-pointer group relative"
            title="클릭하여 발표용으로 확대"
          >
            <div class="flex items-center justify-between">
              <span class="font-black text-emerald-300 flex items-center gap-1.5 group-hover:text-emerald-200 transition-colors">
                <span>🔬</span>
                <span>과학 교과: [물리·화학 회피 ➔ 생명·지구 쏠림]</span>
              </span>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">공대 결격 위험</span>
                <span class="text-[10px] font-bold text-emerald-300 opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/40">
                  <span>🔍</span>
                  <span>확대</span>
                </span>
              </div>
            </div>
            <div class="space-y-1.5 text-[11px] leading-relaxed">
              <div class="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-200">
                <strong>❌ 학생들의 회피 과목 (수식·역학 부담):</strong><br>
                일반선택: <code>물리학</code>, <code>화학</code><br>
                진로선택: <code>역학과 에너지</code>, <code>전자기와 양자</code>, <code>물질과 에너지</code>, <code>화학 반응의 세계</code>
              </div>
              <div class="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                <strong>⚠️ 학생들의 쏠림 과목 (개념·암기 위주):</strong><br>
                일반선택: <code>생명과학</code>, <code>지구과학</code><br>
                진로선택: <code>세포와 물질대사</code>, <code>생물의 유전</code>, <code>지구시스템과학</code>, <code>행성우주과학</code>
              </div>
              <div class="text-slate-300 text-[10px] bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                💡 <strong>진학 상담 팩트:</strong> 컴퓨터, 반도체, 전기전자, 기계공학 등 상위권 공대는 <code>물리학</code>, <code>화학</code>, <code>역학과 에너지</code> 미이수 시 내신이 1.0이어도 서류평가에서 치명적 감점을 부여합니다.
              </div>
            </div>
          </div>

          <!-- 사회 교과 쏠림 vs 회피 -->
          <div
            @click="expandedSubjectSkewIndex = 1"
            class="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400 hover:bg-white/10 transition-all space-y-2.5 cursor-pointer group relative"
            title="클릭하여 발표용으로 확대"
          >
            <div class="flex items-center justify-between">
              <span class="font-black text-amber-300 flex items-center gap-1.5 group-hover:text-amber-200 transition-colors">
                <span>⚖️</span>
                <span>사회 교과: [윤리·사문 집중 ➔ 경제·정치·역사 회피]</span>
              </span>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">상경계열 차별화</span>
                <span class="text-[10px] font-bold text-amber-300 opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40">
                  <span>🔍</span>
                  <span>확대</span>
                </span>
              </div>
            </div>
            <div class="space-y-1.5 text-[11px] leading-relaxed">
              <div class="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200">
                <strong>⚠️ 학생들의 쏠림 과목 (과거 생윤·사문 유사군):</strong><br>
                일반선택: <code>현대사회와 윤리</code>, <code>사회와 문화</code><br>
                진로/융합: <code>윤리문제 탐구</code>, <code>사회문제 탐구</code>
              </div>
              <div class="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-200">
                <strong>💎 대학이 높게 평가하는 도전 과목:</strong><br>
                일반선택: <code>경제</code>, <code>정치</code>, <code>법과 사회</code>, <code>세계사</code><br>
                진로선택: <code>금융과 경제생활</code>, <code>국제관계의 이해</code>, <code>역사로 탐구하는 현대 세계</code>
              </div>
              <div class="text-slate-300 text-[10px] bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                💡 <strong>진학 상담 팩트:</strong> 경영·경제·통계·사회과학 최상위권은 남들 다 듣는 윤리 과목만으로는 서류 차별화가 불가합니다. 수강자 수가 적더라도 <code>경제</code>, <code>정치</code>를 이수한 학생이 학종 가산점을 독식합니다.
              </div>
            </div>
          </div>
        </div>

        <!-- 탐구 쏠림 경계령 프레젠테이션 확대 모드 (단일 카드 전면 확대 뷰) -->
        <div
          v-else
          class="p-5 sm:p-7 rounded-2xl bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-400/90 shadow-2xl space-y-5"
        >
          <!-- 상단 컨트롤 툴바 -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/15">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1">
                <span>📺</span>
                <span>탐구 쏠림 경계령 발표 모드</span>
              </span>
              <span class="text-xs font-bold text-slate-300">
                {{ expandedSubjectSkewIndex === 0 ? '과학 교과 쏠림 심층 분석' : '사회 교과 쏠림 심층 분석' }}
              </span>
            </div>

            <!-- 교과 선택 탭 & 축소 버튼 -->
            <div class="flex items-center gap-2 flex-wrap">
              <div class="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                <button
                  type="button"
                  @click="expandedSubjectSkewIndex = 0"
                  :class="[
                    'px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1',
                    expandedSubjectSkewIndex === 0
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  ]"
                >
                  <span>🔬</span>
                  <span>과학 교과</span>
                </button>
                <button
                  type="button"
                  @click="expandedSubjectSkewIndex = 1"
                  :class="[
                    'px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1',
                    expandedSubjectSkewIndex === 1
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  ]"
                >
                  <span>⚖️</span>
                  <span>사회 교과</span>
                </button>
              </div>

              <button
                type="button"
                @click="expandedSubjectSkewIndex = null"
                class="px-3.5 py-1.5 rounded-xl text-xs font-black bg-white/20 hover:bg-white/30 text-white shadow-sm cursor-pointer transition-colors flex items-center gap-1"
              >
                <span>✕</span>
                <span>원래 크기로 축소</span>
              </button>
            </div>
          </div>

          <!-- 과학 교과 쏠림 확대 내용 -->
          <div v-if="expandedSubjectSkewIndex === 0" class="space-y-4 py-1">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 class="text-xl sm:text-2xl font-black text-emerald-300 m-0 flex items-center gap-2">
                <span>🔬</span>
                <span>과학 교과: [물리·화학 회피 ➔ 생명·지구 쏠림]</span>
              </h3>
              <span class="text-xs px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shrink-0 self-start sm:self-auto">
                공대 결격 위험 경계령
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 sm:p-5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 space-y-2.5">
                <div class="text-sm sm:text-base font-black text-rose-300 flex items-center gap-1.5">
                  <span>❌</span>
                  <span>학생들의 회피 과목 (수식·역학 부담)</span>
                </div>
                <div class="text-xs sm:text-sm leading-relaxed space-y-1.5 font-sans">
                  <div><strong class="text-rose-100">일반선택:</strong> <code class="bg-rose-900/70 px-2 py-0.5 rounded text-rose-100 font-mono text-xs">물리학</code>, <code class="bg-rose-900/70 px-2 py-0.5 rounded text-rose-100 font-mono text-xs">화학</code></div>
                  <div><strong class="text-rose-100">진로선택:</strong> <code class="bg-rose-900/70 px-2 py-0.5 rounded text-rose-100 font-mono text-xs">역학과 에너지</code>, <code class="bg-rose-900/70 px-2 py-0.5 rounded text-rose-100 font-mono text-xs">전자기와 양자</code>, <code class="bg-rose-900/70 px-2 py-0.5 rounded text-rose-100 font-mono text-xs">물질과 에너지</code>, <code class="bg-rose-900/70 px-2 py-0.5 rounded text-rose-100 font-mono text-xs">화학 반응의 세계</code></div>
                </div>
              </div>

              <div class="p-4 sm:p-5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 space-y-2.5">
                <div class="text-sm sm:text-base font-black text-emerald-300 flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>학생들의 쏠림 과목 (개념·암기 위주)</span>
                </div>
                <div class="text-xs sm:text-sm leading-relaxed space-y-1.5 font-sans">
                  <div><strong class="text-emerald-100">일반선택:</strong> <code class="bg-emerald-900/70 px-2 py-0.5 rounded text-emerald-100 font-mono text-xs">생명과학</code>, <code class="bg-emerald-900/70 px-2 py-0.5 rounded text-emerald-100 font-mono text-xs">지구과학</code></div>
                  <div><strong class="text-emerald-100">진로선택:</strong> <code class="bg-emerald-900/70 px-2 py-0.5 rounded text-emerald-100 font-mono text-xs">세포와 물질대사</code>, <code class="bg-emerald-900/70 px-2 py-0.5 rounded text-emerald-100 font-mono text-xs">생물의 유전</code>, <code class="bg-emerald-900/70 px-2 py-0.5 rounded text-emerald-100 font-mono text-xs">지구시스템과학</code>, <code class="bg-emerald-900/70 px-2 py-0.5 rounded text-emerald-100 font-mono text-xs">행성우주과학</code></div>
                </div>
              </div>
            </div>

            <div class="text-slate-100 text-sm sm:text-base bg-slate-800/90 p-4 sm:p-5 rounded-2xl border border-slate-700 leading-relaxed shadow-sm">
              💡 <strong class="text-amber-300 font-black">진학 상담 팩트:</strong> 컴퓨터, 반도체, 전기전자, 기계공학 등 상위권 공대는 <code class="text-amber-300 font-black bg-slate-900 px-1.5 py-0.5 rounded">물리학</code>, <code class="text-amber-300 font-black bg-slate-900 px-1.5 py-0.5 rounded">화학</code>, <code class="text-amber-300 font-black bg-slate-900 px-1.5 py-0.5 rounded">역학과 에너지</code> 미이수 시 내신이 1.0이어도 서류평가에서 치명적 감점을 부여합니다.
            </div>
          </div>

          <!-- 사회 교과 쏠림 확대 내용 -->
          <div v-else-if="expandedSubjectSkewIndex === 1" class="space-y-4 py-1">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 class="text-xl sm:text-2xl font-black text-amber-300 m-0 flex items-center gap-2">
                <span>⚖️</span>
                <span>사회 교과: [윤리·사문 집중 ➔ 경제·정치·역사 회피]</span>
              </h3>
              <span class="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shrink-0 self-start sm:self-auto">
                상경계열 차별화 포인트
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 sm:p-5 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-200 space-y-2.5">
                <div class="text-sm sm:text-base font-black text-amber-300 flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>학생들의 쏠림 과목 (과거 생윤·사문 유사군)</span>
                </div>
                <div class="text-xs sm:text-sm leading-relaxed space-y-1.5 font-sans">
                  <div><strong class="text-amber-100">일반선택:</strong> <code class="bg-amber-900/70 px-2 py-0.5 rounded text-amber-100 font-mono text-xs">현대사회와 윤리</code>, <code class="bg-amber-900/70 px-2 py-0.5 rounded text-amber-100 font-mono text-xs">사회와 문화</code></div>
                  <div><strong class="text-amber-100">진로/융합:</strong> <code class="bg-amber-900/70 px-2 py-0.5 rounded text-amber-100 font-mono text-xs">윤리문제 탐구</code>, <code class="bg-amber-900/70 px-2 py-0.5 rounded text-amber-100 font-mono text-xs">사회문제 탐구</code></div>
                </div>
              </div>

              <div class="p-4 sm:p-5 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 text-indigo-200 space-y-2.5">
                <div class="text-sm sm:text-base font-black text-indigo-300 flex items-center gap-1.5">
                  <span>💎</span>
                  <span>대학이 높게 평가하는 도전 과목</span>
                </div>
                <div class="text-xs sm:text-sm leading-relaxed space-y-1.5 font-sans">
                  <div><strong class="text-indigo-100">일반선택:</strong> <code class="bg-indigo-900/70 px-2 py-0.5 rounded text-indigo-100 font-mono text-xs">경제</code>, <code class="bg-indigo-900/70 px-2 py-0.5 rounded text-indigo-100 font-mono text-xs">정치</code>, <code class="bg-indigo-900/70 px-2 py-0.5 rounded text-indigo-100 font-mono text-xs">법과 사회</code>, <code class="bg-indigo-900/70 px-2 py-0.5 rounded text-indigo-100 font-mono text-xs">세계사</code></div>
                  <div><strong class="text-indigo-100">진로선택:</strong> <code class="bg-indigo-900/70 px-2 py-0.5 rounded text-indigo-100 font-mono text-xs">금융과 경제생활</code>, <code class="bg-indigo-900/70 px-2 py-0.5 rounded text-indigo-100 font-mono text-xs">국제관계의 이해</code>, <code class="bg-indigo-900/70 px-2 py-0.5 rounded text-indigo-100 font-mono text-xs">역사로 탐구하는 현대 세계</code></div>
                </div>
              </div>
            </div>

            <div class="text-slate-100 text-sm sm:text-base bg-slate-800/90 p-4 sm:p-5 rounded-2xl border border-slate-700 leading-relaxed shadow-sm">
              💡 <strong class="text-amber-300 font-black">진학 상담 팩트:</strong> 경영·경제·통계·사회과학 최상위권은 남들 다 듣는 윤리 과목만으로는 서류 차별화가 불가합니다. 수강자 수가 적더라도 <code class="text-amber-300 font-black bg-slate-900 px-1.5 py-0.5 rounded">경제</code>, <code class="text-amber-300 font-black bg-slate-900 px-1.5 py-0.5 rounded">정치</code>를 이수한 학생이 학종 가산점을 독식합니다.
            </div>
          </div>

          <!-- 하단 안내 바 -->
          <div class="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>💡 발표 팁: [ESC] 키를 누르거나 [원래 크기로 축소]를 누르면 2개 카드 그리드로 돌아갑니다.</span>
            <button
              type="button"
              @click="expandedSubjectSkewIndex = null"
              class="text-amber-300 font-bold hover:underline cursor-pointer"
            >
              전체 2개 교과 한눈에 보기
            </button>
          </div>
        </div>
      </div>

      <!-- 추천 과목 이수 매트릭스 (2028 체제 전용 안내) -->
      <div class="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-xs sm:text-sm font-black text-amber-300 m-0 flex items-center gap-2">
            <span>🛡️</span>
            <span>2028 개편 체제 핵심 전공별 필수 권장 이수 과목 가이드 (2022 개정 과목명)</span>
          </h4>
          <span class="text-[11px] text-slate-400">서울대·주요 15개대 발표안 기준</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div class="p-3 rounded-xl bg-white/10 space-y-1">
            <div class="font-bold text-emerald-300">컴퓨터·전기전자·기계공학</div>
            <div class="text-[11px] text-slate-300">미적분Ⅱ, 기하, 물리학, 화학, 역학과 에너지 필수</div>
            <div class="text-[10px] text-slate-400">※ 물리학·역학과 에너지 미이수 시 서류 치명적 감점</div>
          </div>
          <div class="p-3 rounded-xl bg-white/10 space-y-1">
            <div class="font-bold text-sky-300">의약학·생명공학·화학계열</div>
            <div class="text-[11px] text-slate-300">미적분Ⅱ, 화학, 생명과학, 세포와 물질대사 필수</div>
            <div class="text-[10px] text-slate-400">※ 화학 반응의 세계 등 심화 실험과목 적극 이수</div>
          </div>
          <div class="p-3 rounded-xl bg-white/10 space-y-1">
            <div class="font-bold text-rose-300">경영·경제·사회과학계열</div>
            <div class="text-[11px] text-slate-300">대수, 미적분Ⅰ, 확률과 통계, 경제, 금융과 경제생활</div>
            <div class="text-[10px] text-slate-400">※ 수리적 정량 분석력 및 경제 데이터 세특 필수</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 학부모 & 학생 실전 상담 Q&A 아코디언 -->
    <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 class="text-lg sm:text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <span>❓</span>
            <span>상담 현장에서 학부모·학생이 가장 많이 묻는 핵심 질문 TOP 5</span>
          </h2>
          <p class="text-xs text-slate-500 m-0 mt-1">
            질문을 클릭하면 상담 현장에서 바로 인용할 수 있는 전문가 표준 답변을 확인하실 수 있습니다.
          </p>
        </div>
        <span class="text-xs font-bold text-slate-400 font-mono">Q&A 총 5문항</span>
      </div>

      <!-- 질문 목록 뷰 (기본 리스트 뷰) -->
      <div v-if="expandedFaqIndex === null" class="space-y-2.5">
        <div
          v-for="(qa, idx) in faqList"
          :key="idx"
          @click="expandedFaqIndex = idx"
          class="border border-slate-200 hover:border-indigo-400 hover:shadow-md rounded-2xl overflow-hidden transition-all bg-slate-50/70 hover:bg-white cursor-pointer group"
          title="클릭하여 발표용으로 크게 확대"
        >
          <div class="w-full p-4 text-left flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0 font-mono group-hover:scale-105 transition-transform">
                Q{{ idx + 1 }}
              </span>
              <span class="text-xs sm:text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                {{ qa.question }}
              </span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-[11px] font-bold text-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                <span>🔍</span>
                <span>발표용 확대</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 핵심 Q&A 프레젠테이션 확대 모드 (질문 + 답변 전면 대형 뷰) -->
      <div
        v-else
        class="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-slate-50 via-white to-indigo-50/30 border-2 border-indigo-400 shadow-xl space-y-5"
      >
        <!-- 프레젠테이션 컨트롤 툴바 -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-100">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center gap-1 shadow-2xs">
              <span>📺</span>
              <span>핵심 Q&A 프레젠테이션 모드</span>
            </span>
            <span class="text-xs font-bold text-slate-500">
              질문 <strong class="text-indigo-600 font-mono">{{ expandedFaqIndex + 1 }}</strong> / {{ faqList.length }}
            </span>
          </div>

          <!-- Q1~Q5 직접 이동 탭 & 이전/다음 & 축소 버튼 -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <div class="flex items-center gap-1 mr-2">
              <button
                v-for="(_, idx) in faqList"
                :key="idx"
                type="button"
                @click="expandedFaqIndex = idx"
                :class="[
                  'w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer font-mono',
                  expandedFaqIndex === idx
                    ? 'bg-indigo-600 text-white shadow-xs scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                ]"
              >
                Q{{ idx + 1 }}
              </button>
            </div>

            <button
              type="button"
              :disabled="expandedFaqIndex <= 0"
              @click="expandedFaqIndex--"
              class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              ◀ 이전 질문
            </button>
            <button
              type="button"
              :disabled="expandedFaqIndex >= faqList.length - 1"
              @click="expandedFaqIndex++"
              class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              다음 질문 ▶
            </button>
            <button
              type="button"
              @click="expandedFaqIndex = null"
              class="px-3.5 py-1.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white shadow-sm cursor-pointer transition-colors flex items-center gap-1 ml-1"
            >
              <span>✕</span>
              <span>목록으로 축소</span>
            </button>
          </div>
        </div>

        <!-- 본문 내용: 질문 + 핵심 요약 + 상세 답변 (프레젠테이션용 대형 텍스트) -->
        <div class="space-y-4 py-2">
          <!-- 대형 질문 헤더 -->
          <div class="flex items-start gap-3">
            <span class="w-10 h-10 rounded-xl bg-indigo-600 text-white text-base font-black flex items-center justify-center shrink-0 font-mono shadow-xs mt-0.5">
              Q{{ expandedFaqIndex + 1 }}
            </span>
            <h3 class="text-xl sm:text-2xl font-black text-slate-950 m-0 tracking-tight leading-snug">
              {{ faqList[expandedFaqIndex].question }}
            </h3>
          </div>

          <!-- 대형 핵심 요약 박스 -->
          <div class="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border-2 border-amber-300 text-amber-950 font-bold text-base sm:text-lg shadow-xs leading-relaxed">
            💬 <strong class="text-amber-900">상담 핵심 한 줄 요약:</strong> {{ faqList[expandedFaqIndex].summary }}
          </div>

          <!-- 대형 상세 답변 박스 -->
          <div class="p-6 sm:p-7 rounded-2xl bg-slate-50/80 border border-slate-200 text-base sm:text-lg text-slate-700 leading-relaxed font-normal whitespace-pre-line shadow-xs">
            {{ faqList[expandedFaqIndex].answer }}
          </div>
        </div>

        <!-- 하단 액션 바 -->
        <div class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span class="text-xs text-slate-400">
            💡 발표 팁: [ESC] 키를 누르거나 [목록으로 축소]를 누르면 5개 질문 목록으로 돌아갑니다.
          </span>

          <div class="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              @click="copyFaqScript(faqList[expandedFaqIndex])"
              class="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>📋</span>
              <span>답변 스크립트 복사</span>
            </button>
            <button
              type="button"
              @click="expandedFaqIndex = null"
              class="text-indigo-600 font-bold text-xs hover:underline cursor-pointer"
            >
              전체 질문 목록 보기
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. 1:1 상담용 맞춤 요약 스크립트 생성 및 인쇄 도구 -->
    <div class="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-md space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-base sm:text-lg font-black text-white m-0 flex items-center gap-2">
            <span>🖨️</span>
            <span>1:1 진학 상담용 맞춤 요약 카드 출력 도구</span>
          </h3>
          <p class="text-xs text-slate-300 m-0 mt-0.5">
            학생·학부모 상담 시 출력하거나 알림톡/문자로 발송할 수 있는 맞춤형 전략 요약지를 즉시 생성합니다.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="copyCounselSummary"
            class="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📋</span>
            <span>전략 요약 복사</span>
          </button>
          <button
            type="button"
            @click="printCounselCard"
            class="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span>🖨️</span>
            <span>상담 자료 인쇄</span>
          </button>
        </div>
      </div>

      <!-- 상담 요약 프리뷰 박스 -->
      <div id="counsel-preview-card" class="bg-white text-slate-900 p-5 rounded-2xl shadow-inner text-xs space-y-3 font-sans">
        <div class="flex items-center justify-between border-b pb-2.5 border-slate-200">
          <div class="font-black text-sm text-indigo-950">
            [포곡고등학교] {{ currentTargetData.gradeTitle }} 진학 지도 상담 핵심 전략 요약지
          </div>
          <span class="text-[11px] text-slate-500 font-mono">{{ new Date().toLocaleDateString('ko-KR') }} 발행</span>
        </div>

        <div class="space-y-1.5 text-slate-700 leading-relaxed">
          <p class="m-0"><strong>■ 대상 학년 및 제도:</strong> {{ currentTargetData.gradeTitle }} ({{ currentTargetData.systemLabel }})</p>
          <p class="m-0"><strong>■ 수능 대비 핵심:</strong> {{ currentTargetData.csatStrategy[0]?.desc }}</p>
          <p class="m-0"><strong>■ 학생부/내신 핵심:</strong> {{ currentTargetData.gpaStrategy[0]?.desc }}</p>
          <p class="m-0"><strong>■ 사탐런 시사점 반영:</strong> 2028 수능 공통화에 따라 고교 내신 단계의 과탐 이수 여부가 대입 당락의 핵심 변수로 작용하므로, 이공계 지망 시 절대 핵심 과탐(물리·화학)을 기피하지 말 것.</p>
        </div>

        <div class="pt-2 border-t border-dashed border-slate-200 text-[11px] text-slate-500 flex justify-between items-center">
          <span>지도 교사 소견: 수능 최저학력기준 조기 안착 및 전공 연계 위계성 과목 철저 이수 권고</span>
          <span class="font-bold text-indigo-700">진학상담실</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const activeGrade = ref('grade2') // 'grade2' (2028 개편 첫세대) | 'grade1' (2029) | 'middle3' (2030)
const openedFaqIndex = ref(0)

// 프레젠테이션 카드 확대 모드 상태 관리 (null: 기본 그리드, number: 해당 인덱스 카드 전면 확대)
const expandedInsightIndex = ref(null) // 0..3: 4대 시사점
const expandedGradeCardIndex = ref(null) // 0..2: 학년별 3개 전략
const expandedSubjectSkewIndex = ref(null) // 0..1: 탐구 쏠림 2개 카드
const expandedFaqIndex = ref(null) // 0..4: Q&A TOP 5

// ESC 키 입력 시 모든 확대 모드 닫기
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    expandedInsightIndex.value = null
    expandedGradeCardIndex.value = null
    expandedSubjectSkewIndex.value = null
    expandedFaqIndex.value = null
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// 4대 시사점 데이터
const insightsList = [
  {
    num: '01',
    badgeBg: 'bg-rose-100 text-rose-700',
    alertBorder: 'border-rose-100 text-rose-900',
    title: "수능 사탐런 ➔ 고교 내신의 '과탐 기피(내신 사탐런)'로 전이",
    descHtml: "학생들이 사탐런을 감행한 본질은 사회가 좋아서가 아니라 <strong>과탐의 극심한 학습량과 의대생·N수생에 의한 등급 분쇄 공포</strong> 때문이었습니다. 2028 수능에서는 수능 과목을 피할 수 없게 되자, 역으로 <strong>고2~3 내신에서 성적 따기 쉬운 과목만 찾고 물리·화학 등 핵심 과탐을 기피하는 '내신 사탐런'</strong> 현상이 심화될 위험이 큽니다.",
    alertIcon: '⚠️',
    alertTitle: '지도 경계령:',
    alertText: '내신 5등급제 상대평가에서 불리할까 봐 이공계 핵심 과목을 회피하면, 대입 서류평가에서 치명적인 불이익을 받게 됩니다.'
  },
  {
    num: '02',
    badgeBg: 'bg-indigo-100 text-indigo-700',
    alertBorder: 'border-indigo-100 text-indigo-900',
    title: '대학의 필연적 반격: 학생부(과탐 이수·세특) 정밀 평가',
    descHtml: "2028 수능 탐구가 1학년 수준의 공통과목(통합과학·통합사회)으로 축소되면, <strong>상위권 이공계 대학(서울대, 연고대, 카이스트 등)은 수능 성적표만으로 이과 역량을 검증할 수 없습니다.</strong> 따라서 <strong>정시에서도 학생부 교과평가(정성평가)를 전면 도입</strong>하고, 수시 학종에서 <strong>고2~3 물리/화학/미적분II/기하 이수 여부</strong>를 절대적 당락 요소로 반영합니다.",
    alertIcon: '🎯',
    alertTitle: '진학 팩트:',
    alertText: '"수능 탐구가 쉬워진 만큼, 대학은 고교 3년간 학생이 어떤 과목에 과감히 도전했는지를 매섭게 검증합니다."'
  },
  {
    num: '03',
    badgeBg: 'bg-amber-100 text-amber-800',
    alertBorder: 'border-amber-100 text-amber-950',
    title: "수시 수능 최저학력기준의 '체감 난이도 급상승'",
    descHtml: "기존 일반고의 주효한 전략은 \"과탐은 놔두고 사문·생윤 1과목을 집중 공략해 2등급을 따서 수시 최저(2합5, 3합7)를 맞추는 것\"이었습니다. 그러나 2028에는 <strong>[통합사회 1과목 + 통합과학 1과목]</strong>이 고정되어 우회로가 차단됩니다. 문과생에게는 <code>통합과학</code>이, 이과생에게는 1문항 실수로 등급이 추락하는 <code>통합사회</code>가 최저 미충족의 거대한 덫이 됩니다.",
    alertIcon: '📊',
    alertTitle: '충격 예측:',
    alertText: '편법성 1과목 몰입이 불가능해져, 일반고 학생들의 실질 수능 최저 충족률이 전반적으로 하락할 전망입니다.'
  },
  {
    num: '04',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    alertBorder: 'border-emerald-100 text-emerald-950',
    title: "고1 통합사회·통합과학의 위상 '수능 코어 과목' 격상",
    descHtml: "과거 통합사회·통합과학은 1학년 때 지나가는 교양·내신 과목으로 여겨졌습니다. 그러나 2028 체제에서는 <strong>고3 수능 당일까지 수능 성적표의 절반을 차지하는 메인 수능 과목</strong>으로 격상됩니다. 1학년 1학기 첫 시험부터 수능 실전 연계형 사고력을 길러두지 않으면 고3 때 다시 1학년 교과서를 뒤적여야 하는 촌극이 빚어집니다.",
    alertIcon: '🚀',
    alertTitle: '현장 대응:',
    alertText: '고1 단계의 통사·통과를 "고3 수능 직결 과목"으로 프레이밍하여 조기 학습 몰입도를 높여야 합니다.'
  }
]

const gradeTargets = [
  { id: 'grade2', label: '예비 고3 (현 고2)', shortLabel: '고2 (2028 대입)', year: '2028', icon: '🚀' },
  { id: 'grade1', label: '예비 고2 (현 고1)', shortLabel: '고1 (2029 대입)', year: '2029', icon: '⚡' },
  { id: 'middle3', label: '예비 고1 (현 중3)', shortLabel: '중3 (2030 대입)', year: '2030', icon: '🌱' }
]

const targetDetails = {
  grade2: {
    gradeTitle: '예비 고3 / 현 고2 (2028학년도 대입 - 개편 첫 세대!)',
    systemLabel: '2028 개편 수능(선택과목 폐지 & 통합사회·통합과학 공통 필수 응시)',
    csatStrategy: [
      {
        title: '수능 사탐런 불가! 통합과학 정면돌파',
        desc: '수능 시험지에서 탐구 선택과목이 폐지되므로, 과탐을 피해 사탐으로 도망치는 우회 전략이 불가능합니다. 문·이과 모든 학생이 통합과학을 필수 응시해야 하므로 1학년 통합과학의 물리·화학 핵심 개념을 조기에 완벽 복습해야 합니다.'
      },
      {
        title: '통합사회 만점 싸움 (실수 방어)',
        desc: '자연계열 학생들에게 통합사회는 난이도가 상대적으로 평이할 수 있으나, 1문항 실수로 2등급으로 추락하는 초접전이 벌어집니다. 만점을 목표로 실수 없는 꼼꼼한 개념 정리가 필수입니다.'
      },
      {
        title: '공통수학(대수·미적분Ⅰ·확통) 심층 변별',
        desc: '심화수학(미적분Ⅱ·기하)이 수능에서 제외되면서, 공통수학 전 범위에서 변별력을 확보하기 위한 까다로운 킬러/준킬러 문항이 출제되므로 연산 및 개념 추론 훈련을 극대화해야 합니다.'
      }
    ],
    gpaStrategy: [
      {
        title: '내신 사탐런(과탐 기피) 절대 금지',
        desc: '수능에서 학생의 과탐 역량을 측정할 수 없게 된 서울대, 연고대, 카이스트 등 주요 이공계 대학은 고2~3 학생부의 물리·화학·생명 이수 여부를 정시/수시 모두에서 결정적 평가 잣대로 삼습니다.'
      },
      {
        title: '이공계열 필수 권장과목 정면 이수',
        desc: '점수 따기 쉽다고 과탐을 피하고 사탐이나 쉬운 과목만 들으면, 내신 평점이 높아도 전공적합성 평가에서 치명적인 불이익을 받고 불합격할 위험이 매우 높습니다.'
      },
      {
        title: '수능최저 기준 맞춤형 대학 라인업',
        desc: '통합사회와 통합과학 모두를 반영하는 대학이 대다수이므로, 어느 한 과목도 버리지 않는 균형 잡힌 6장 수시 지원 카드를 설계해야 합니다.'
      }
    ],
    counselStrategy: [
      {
        title: '학부모 상담 핵심',
        desc: '"어머님, 2028 대입 개편 첫 세대인 현 고2 학생들은 수능에서 사탐으로 도망칠 수 없습니다. 수능 통합과학을 완벽히 잡고, 3학년 내신에서도 물리학/화학을 당당히 이수해야 상위권 공대에 합격합니다."'
      },
      {
        title: '학생 면담 핵심',
        desc: '사탐런의 달콤한 유혹에 흔들리지 말고, 목표 대학의 필수 권장 이수 과목표를 함께 보며 3학년 수강 신청 과목을 정밀 재점검합니다.'
      }
    ]
  },
  grade1: {
    gradeTitle: '예비 고2 / 현 고1 (2029학년도 대입 - 개편 안착 세대)',
    systemLabel: '2028 개편 수능 체제 + 고교 5등급제 성취평가 적용 세대',
    csatStrategy: [
      {
        title: '고1 통합사회·통합과학 수능 직결 학습',
        desc: '1학년 때 배운 통합사회와 통합과학이 고3 수능 당일까지 등급을 결정합니다. 1학년 개념을 단순 내신용으로 끝내지 않고 수능형 문제 풀이로 확장해야 합니다.'
      },
      {
        title: '공통과목 수능 기출 유형 조기 체화',
        desc: '선택과목이 없어진 만큼, 공통국어와 공통수학에서 출제되는 신경향 융합 문제를 조기에 접하며 탄탄한 기본기를 구축해야 합니다.'
      }
    ],
    gpaStrategy: [
      {
        title: '2학년 진로선택·융합선택 과목 설계',
        desc: '희망 전공에 직결되는 핵심 과학 과목(물리학, 화학, 생명과학)과 일반수학 과목을 교육과정 편성표에서 위계에 맞게 철저히 선택 이수합니다.'
      },
      {
        title: '내신 5등급제 상위 10%(1등급) 사수',
        desc: '1등급 비율이 10%로 확대된 만큼, 상위권 주요대 합격을 위해서는 지원 전공 관련 교과목 1등급 확보가 필수적입니다.'
      }
    ],
    counselStrategy: [
      {
        title: '과목 선택 상담',
        desc: '내신 등급 유불리만 따져 사탐으로 도망치는 우를 범하지 않도록, 전공별 필수 과목을 정면 돌파하도록 격려합니다.'
      }
    ]
  },
  middle3: {
    gradeTitle: '예비 고1 / 현 중3 (2030학년도 대입 - 고교학점제 전면 완성 세대)',
    systemLabel: '2028 개편 수능 전면 적용 & 고교학점제 성취평가제 전면화',
    csatStrategy: [
      {
        title: '중3 겨울방학 통합과학 4대 파트 완결',
        desc: '고1 3월 학평부터 수능 범위가 시작됩니다. 방학 중 역학 시스템, 화학 결합, 유전 정보, 지구 환경 등 핵심 킬러 파트를 사전 완결해야 합니다.'
      },
      {
        title: '서술형·문해력 중심 수능 독해 훈련',
        desc: '단순 암기가 아닌 지문 분석력과 서술 능력이 고교 내신과 수능 모두에서 등급을 가릅니다.'
      }
    ],
    gpaStrategy: [
      {
        title: '고교 선택 시 학교별 교육과정 편제표 필수 확인',
        desc: '진학할 고등학교가 본인의 희망 전공(컴퓨터, 반도체, 의약 등)에 필요한 심화 탐구 과목을 정상적으로 개설해 주는지 학교알리미에서 사전 확인해야 합니다.'
      },
      {
        title: '고1 1학기 첫 내신 총력전',
        desc: '5등급제에서는 1학년 내신에서 미끄러지면 만회가 어렵습니다. 입학 직후 첫 중간고사에서 1등급을 쟁취하는 것이 최우선 목표입니다.'
      }
    ],
    counselStrategy: [
      {
        title: '고입 설명회 활용',
        desc: '학부모님들께 "포곡고등학교는 2028 개편 체제에 맞춘 다양한 탐구·심화 교과목이 탄탄하게 개설되어 있어 학생부 경쟁력에서 압도적으로 유리하다"는 점을 강조합니다.'
      }
    ]
  }
}

const currentTargetData = computed(() => {
  return targetDetails[activeGrade.value] || targetDetails.grade2
})

// 학년별 3대 핵심 전략 카드 목록 (수능, 내신&학생부, 상담 코칭)
const gradeStrategyCards = computed(() => [
  {
    type: 'csat',
    title: '수능(CSAT) 대비 전략',
    icon: '📝',
    color: 'indigo',
    borderClass: 'border-indigo-100',
    bgClass: 'bg-indigo-50/40',
    titleClass: 'text-indigo-950',
    badgeClass: 'bg-indigo-600 text-white',
    items: currentTargetData.value.csatStrategy || []
  },
  {
    type: 'gpa',
    title: '내신 & 학생부 설계 전략',
    icon: '📚',
    color: 'amber',
    borderClass: 'border-amber-100',
    bgClass: 'bg-amber-50/40',
    titleClass: 'text-amber-950',
    badgeClass: 'bg-amber-600 text-white',
    items: currentTargetData.value.gpaStrategy || []
  },
  {
    type: 'counsel',
    title: '교사 상담 코칭 가이드',
    icon: '💬',
    color: 'emerald',
    borderClass: 'border-emerald-100',
    bgClass: 'bg-emerald-50/40',
    titleClass: 'text-emerald-950',
    badgeClass: 'bg-emerald-600 text-white',
    items: currentTargetData.value.counselStrategy || []
  }
])

const faqList = [
  {
    question: '2028 수능은 탐구 선택과목이 없는데, 과학이나 사회 학원 선행을 어떻게 시켜야 하나요?',
    summary: '고1 통합과학·통합사회가 곧 수능 과목이므로 1학년 내신 집중이 곧 수능 대비입니다.',
    answer: `2028 수능부터는 물리학, 생명과학 같은 2~3학년 개별 선택과목이 수능 시험지에서 완전히 사라집니다. 수능 탐구 영역은 오직 고등학교 1학년 공통과목인 '통합사회'와 '통합과학'에서만 출제됩니다.\n\n따라서 굳이 중3~고1 시기에 무리해서 고2 선택과목(물리학/화학 수능 인강 등)을 미리 선행할 필요가 전혀 없습니다. 대신 고1 과정의 통합과학(특히 학생들이 어려워하는 역학과 에너지, 화학 결합과 물질 변화)과 통합사회를 완벽하게 마스터하는 것이 곧 1학년 내신 1등급과 고3 수능 만점을 동시에 잡는 가장 확실한 길입니다.`
  },
  {
    question: '내신 5등급제에서는 등급 잘 나오는 과목만 골라 들으면 안 되나요? 물리학 안 들었다고 대학이 떨어뜨리나요?',
    summary: '네, 상위권 이공계열은 물리학/화학 미이수 시 서류평가에서 치명적인 불이익을 받습니다.',
    answer: `절대 안 됩니다. 서울대, 연세대, 고려대, 성균관대 등 주요 대학은 이미 2028 대입 전형 예고를 통해 '전공 연계 핵심 권장 과목'을 강력히 반영하겠다고 공표했습니다.\n\n수능에서 학생의 과탐 실력을 측정할 수 없기 때문에, 대학 입학사정관들은 학생부의 2~3학년 과목 이수 이력을 돋보기로 들여다봅니다. 공대 지망생이 점수 따기 쉬운 생명과학·지구과학 계열만 골라 듣고 2022 개정 핵심 과목인 '물리학'이나 '역학과 에너지', '미적분Ⅱ'를 이수하지 않았다면, 내신 평점이 아무리 높아도 전공적합성 및 학업역량 평가에서 최하 등급을 받고 불합격할 확률이 매우 높습니다.`
  },
  {
    question: '수학에서 심화수학(미적분Ⅱ + 기하)이 수능에서 빠졌는데, 학교 수업에서도 안 들어도 되나요?',
    summary: '수능에서는 빠졌지만, 자연계열 학생부 종합전형 및 수시 교과 정성평가에서는 필수입니다.',
    answer: `교육부 발표대로 수능 시험에서는 심화수학이 출제되지 않습니다. 그러나 이것은 수능 수험 부담을 줄여주기 위한 조치일 뿐, 대학에서 배우지 않고 와도 된다는 뜻이 결코 아닙니다.\n\n공학, 자연과학, 의약학, 경제학 등 고도의 수학적 해석력이 필요한 학과에서는 고등학교에서 '미적분Ⅱ'와 '기하'를 이수했는지를 학생부 서류평가의 핵심 잣대로 삼습니다. 수능에 안 나온다고 이 과목들을 이수하지 않고 입학하면 대학교 1학년 공학수학이나 미적분학 수업을 전혀 따라갈 수 없습니다.`
  },
  {
    question: '2028 수능 통합사회·통합과학 시험 난이도는 고1 수준으로 쉽게 출제될까요?',
    summary: '기본 개념은 고1 수준이지만, 변별력을 위해 융합형 추론 및 복합 자료해석 문항이 대거 출제됩니다.',
    answer: `교육과정평가원의 예시 문항을 보면, 교과서의 지식 암기형 문항보다는 과학적 탐구 실험 설계, 일상생활 복합 문제 해결, 사회·과학 융합 자료 해석 등 수능 특유의 고난도 추론 문항이 출제됩니다.\n\n특히 모든 인문계·자연계 수험생 40만 명이 동일한 시험지로 경쟁하므로, 상위 4%(1등급)와 상위 11%(2등급)를 가르기 위해 지문 길이가 길고 매력적인 오답이 포함된 까다로운 준킬러 문항이 3~4문항 반드시 배치됩니다. '고1 수준이니 대충 해도 되겠지'라고 방심하면 2~3등급으로 밀려 수능 최저를 맞추지 못하게 됩니다.`
  },
  {
    question: '2028 체제에서 수시 수능 최저학력기준 맞추기가 전보다 훨씬 어려워진다는데 사실인가요?',
    summary: '네, 사실입니다. 기존의 사탐 1과목 우회 전략이 불가능해져 실질 충족률이 떨어집니다.',
    answer: `정확한 지적이십니다. 지금까지 일반고 수험생들의 대표적인 수시 최저 충족 비결은 "자신 없는 과목은 과감히 버리고, 사탐 1과목에 집중 투자해 2등급을 받아내는 전략(사탐런)"이었습니다.\n\n하지만 2028부터는 통합사회와 통합과학 두 과목을 모두 치러야 하며, 대학들은 두 과목 평균 또는 각각의 등급을 요구할 것입니다. 즉, 문과 학생은 통합과학을, 이과 학생은 통합사회를 피할 수 없기 때문에 한쪽 영역에 약점이 있는 학생은 과거보다 수능 최저를 충족하기가 훨씬 까다로워집니다.`
  }
]

function toggleFaq(idx) {
  if (openedFaqIndex.value === idx) {
    openedFaqIndex.value = -1
  } else {
    openedFaqIndex.value = idx
  }
}

function copyFaqScript(qa) {
  const text = `[질문] ${qa.question}\n\n[핵심 요약] ${qa.summary}\n\n[상세 상담 답변]\n${qa.answer}`
  navigator.clipboard.writeText(text).then(() => {
    alert('질문 및 상담 답변 스크립트가 클립보드에 복사되었습니다. 상담 메모나 학부모 메시지에 활용하세요.')
  }).catch(() => {
    alert('복사에 실패했습니다. 텍스트를 직접 복사해 주세요.')
  })
}

function copyCounselSummary() {
  const el = document.getElementById('counsel-preview-card')
  if (!el) return
  const text = el.innerText
  navigator.clipboard.writeText(text).then(() => {
    alert('상담 요약지 내용이 클립보드에 복사되었습니다!')
  }).catch(() => {
    alert('복사에 실패했습니다.')
  })
}

function printCounselCard() {
  window.print()
}
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  #counsel-preview-card, #counsel-preview-card * {
    visibility: visible;
  }
  #counsel-preview-card {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: none;
    box-shadow: none;
  }
}
</style>

