<template>
  <div class="highschool-admission-container space-y-8 pb-16">
    <!-- Top Action & Navigation Floating Bar (화면 전용) -->
    <div class="sticky top-0 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 shadow-md no-print flex flex-wrap items-center justify-between gap-3">
      <!-- Quick Slide Links -->
      <div class="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs font-bold text-slate-600">
        <button
          v-for="(s, idx) in slideList"
          :key="s.id"
          @click="scrollToSlide(s.id)"
          :class="[
            'px-2.5 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer border-none flex items-center gap-1',
            activeSlideId === s.id ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          ]"
        >
          <span>{{ s.emoji }}</span>
          <span>{{ idx + 1 }}. {{ s.shortTitle }}</span>
        </button>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          @click="triggerPrint"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer border-none"
          title="A4 가로 방향 8페이지 설명회 자료 인쇄 또는 PDF 저장"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          <span>A4 가로 책자 인쇄 / PDF</span>
        </button>
      </div>
    </div>

    <!-- ========================================================================================= -->
    <!-- [SLIDE 1] 대문 & 인트로: 2028 대입 대격변, 왜 지금 '포곡고'인가? -->
    <!-- ========================================================================================= -->
    <section id="slide-1" class="presentation-slide a4-landscape-page bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden flex flex-col justify-between">
      <div class="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-32 -left-32 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Header & Badges -->
      <div class="relative z-10">
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <span class="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-xs">
            🎓 2026학년도 포곡고등학교 고입 설명회
          </span>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 border border-white/20">
            예비 고1(현 중3) 학생·학부모님을 위한 맞춤 나침반
          </span>
        </div>
        <h1 class="text-2xl sm:text-4xl font-black tracking-tight text-white m-0 leading-tight">
          2028 대입 대격변의 시대,<br />
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-sky-300 to-indigo-300">
            왜 가장 확실한 해답은 포곡고등학교인가?
          </span>
        </h1>
        <p class="text-xs sm:text-sm text-slate-300 mt-3 max-w-3xl leading-relaxed m-0">
          내신 5등급제 전환, 2028 통합형 수능, 고교학점제 전면 도입까지. 입시 판도가 완전히 바뀝니다.<br class="hidden sm:inline" />
          포곡고는 <strong>과학중점학교의 압도적 탐구 역량</strong>과 <strong>2027년 3월 혁신자치예비학교</strong>라는 강력한 날개를 달고 수시와 정시 모두에서 최상의 입시 경쟁력을 보장합니다.
        </p>
      </div>

      <!-- 4 Core Pillars -->
      <div class="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3.5 my-6">
        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
          <div class="text-2xl mb-1">🎯</div>
          <div class="text-xs font-bold text-amber-300">내신 5등급제 전환</div>
          <div class="text-base font-black text-white mt-0.5">1등급 10% 확대</div>
          <p class="text-[11px] text-slate-300 mt-1 m-0">포곡고에서 상위 10% 1등급 선점의 기회가 2.5배 넓어집니다.</p>
        </div>

        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
          <div class="text-2xl mb-1">🔬</div>
          <div class="text-xs font-bold text-sky-300">과학중점학교 지정</div>
          <div class="text-base font-black text-white mt-0.5">수·과학 45% 심화</div>
          <p class="text-[11px] text-slate-300 mt-1 m-0">이공계·의약학·과기원 학생부종합전형 평가 시 압도적 우위 확보.</p>
        </div>

        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
          <div class="text-2xl mb-1">🚀</div>
          <div class="text-xs font-bold text-emerald-300">혁신자치예비학교</div>
          <div class="text-base font-black text-white mt-0.5">2027.3 전격 개시</div>
          <p class="text-[11px] text-slate-300 mt-1 m-0">학생 주도 자치 역량 및 미래형 맞춤 진로 설계 특화 공립고.</p>
        </div>

        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
          <div class="text-2xl mb-1">🌲</div>
          <div class="text-xs font-bold text-purple-300">농어촌 & 비농어촌</div>
          <div class="text-base font-black text-white mt-0.5">투트랙 필승 전략</div>
          <p class="text-[11px] text-slate-300 mt-1 m-0">농어촌 대상자뿐 아니라 30~40% 비대상자도 학교장추천/학종 완벽 대비.</p>
        </div>
      </div>

      <!-- Bottom Banner Footnote -->
      <div class="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-slate-300">
        <span>📍 경기도 용인시 처인구 포곡읍 | 포곡고등학교 진로진학상담부</span>
        <span class="font-bold text-amber-300">SLIDE 01 / 08</span>
      </div>
    </section>

    <!-- ========================================================================================= -->
    <!-- [SLIDE 2] 2028 대입 개편안 완벽 해부 & 포곡고 유불리 진단 시뮬레이터 -->
    <!-- ========================================================================================= -->
    <section id="slide-2" class="presentation-slide a4-landscape-page bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <!-- Title Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-lg">📊</span>
              <span class="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                2028학년도 대입 개편 팩트체크
              </span>
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-1 m-0">
              내신 5등급제 개편 & 2028 통합수능, 포곡고가 완벽한 기회인 이유
            </h2>
          </div>
          <span class="text-xs font-bold text-slate-400">SLIDE 02 / 08</span>
        </div>

        <!-- 9등급 vs 5등급 구조 비교 그래프 & 인터랙티브 등급 유불리 분석 (좌우 배치) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
          <!-- Left (lg:col-span-7): 9등급 vs 5등급 높이 비교 그래프 -->
          <div class="lg:col-span-7 bg-slate-50/90 rounded-2xl p-4 border border-slate-200/90 flex flex-col justify-between shadow-xs">
            <div>
              <!-- Header -->
              <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 class="text-xs font-bold text-slate-800 flex items-center gap-1.5 m-0">
                  <span>⚖️</span>
                  <span>현행 9등급제 vs 2028 개편 5등급제 비율 높이 비교 그래프</span>
                </h3>
                <span class="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  🖱️ 블록에 마우스 오버 시 등급별 유불리 진단
                </span>
              </div>

              <!-- Quick Focus Selector Buttons -->
              <div class="flex flex-wrap items-center gap-1.5 mb-2.5 text-[11px]">
                <span class="text-slate-400 font-bold text-[10px] mr-0.5">핵심 쟁점 바로보기:</span>
                <button
                  type="button"
                  @click="selectedGradeKey = '5-1'"
                  :class="[
                    'px-2 py-0.5 rounded-md font-bold transition-all border cursor-pointer text-[11px]',
                    selectedGradeKey === '5-1' 
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs' 
                      : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                  ]"
                >
                  🏆 1등급 10% 확대 (2.7배)
                </button>
                <button
                  type="button"
                  @click="selectedGradeKey = '5-2'"
                  :class="[
                    'px-2 py-0.5 rounded-md font-bold transition-all border cursor-pointer text-[11px]',
                    selectedGradeKey === '5-2' 
                      ? 'bg-amber-600 text-white border-amber-700 shadow-2xs' 
                      : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                  ]"
                >
                  🚨 10~11% 경계선 리스크
                </button>
                <button
                  type="button"
                  @click="selectedGradeKey = '9-2'"
                  :class="[
                    'px-2 py-0.5 rounded-md font-bold transition-all border cursor-pointer text-[11px]',
                    selectedGradeKey === '9-2' 
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs' 
                      : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                  ]"
                >
                  ⚡ 9등급제 2등급의 분기
                </button>
              </div>

              <!-- Main Height Comparison Chart -->
              <div class="relative bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-xs">
                <!-- Column Labels -->
                <div class="grid grid-cols-12 gap-2 text-center text-xs font-black pb-2 mb-2.5 border-b border-slate-100">
                  <div class="col-span-5 text-slate-700 flex items-center justify-center gap-1.5">
                    <span class="text-xs sm:text-sm font-extrabold">현행 9등급제</span>
                    <span class="text-[10px] sm:text-xs font-medium text-slate-400">(상대 9단계)</span>
                  </div>
                  <div class="col-span-2 text-[10px] sm:text-xs text-slate-500 font-extrabold flex items-center justify-center">
                    누적 컷오프
                  </div>
                  <div class="col-span-5 text-indigo-700 flex items-center justify-center gap-1.5">
                    <span class="text-xs sm:text-sm font-extrabold">2028 개편 5등급제</span>
                    <span class="text-[10px] sm:text-xs font-medium text-indigo-400">(상대·절대 병기)</span>
                  </div>
                </div>

                <!-- Bars Container (여유 있는 높이 480px~520px 적용) -->
                <div class="relative grid grid-cols-12 gap-2 h-[480px] sm:h-[500px] select-none">
                  <!-- Left: 9-Grade Column (1~9 All Displayed) -->
                  <div class="col-span-5 flex flex-col h-full rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100/50 shadow-inner">
                    <div
                      v-for="item in nineGradeList"
                      :key="'9-' + item.grade"
                      @mouseenter="hoverGrade('9', item.grade)"
                      @click="selectGrade('9', item.grade)"
                      :style="{ height: item.span + '%' }"
                      :class="[
                        'w-full flex items-center justify-between px-2.5 sm:px-3 cursor-pointer transition-all duration-150 relative border-b border-white/20 last:border-b-0 overflow-hidden',
                        item.bgColor,
                        selectedGradeKey === '9-' + item.grade 
                          ? 'ring-2 ring-indigo-600 z-10 brightness-110 shadow-sm' 
                          : 'hover:brightness-105'
                      ]"
                    >
                      <!-- Left: Grade Title & Range indicator -->
                      <div class="flex items-center gap-1.5 min-w-0">
                        <span class="font-black text-xs sm:text-[13px] leading-none text-white drop-shadow-xs shrink-0">
                          {{ item.grade }}등급
                        </span>
                        <span class="text-[10px] text-white/80 font-mono hidden sm:inline shrink-0">
                          (↕{{ item.span }}%p)
                        </span>
                      </div>
                      <!-- Right: Cumulative Cut & Count -->
                      <div class="text-right text-[10px] sm:text-xs font-bold text-white/95 leading-none shrink-0 font-mono flex items-center gap-1">
                        <span>~{{ item.cumEnd }}%</span>
                        <span class="text-[10px] text-white/75 hidden md:inline">({{ item.count }}명)</span>
                      </div>
                    </div>
                  </div>

                  <!-- Center: Cutoff Comparison Bridge Line & Key Indicators (좌/우 분리 배치로 글자 겹침 해결) -->
                  <div class="col-span-2 relative flex flex-col justify-between py-0.5 text-center pointer-events-none">
                    <!-- 0% Line -->
                    <div class="absolute top-0 inset-x-0 border-t border-slate-300"></div>

                    <!-- 4% Marker (9등급 1등급 컷 - 좌측 배치) -->
                    <div class="absolute w-full flex items-center -translate-y-1/2 z-10" :style="{ top: '4%' }">
                      <div class="w-full border-t border-dashed border-emerald-400"></div>
                      <span class="absolute left-0.5 sm:left-1 bg-white px-1.5 py-0.5 text-[9px] font-black text-emerald-700 border border-emerald-300 rounded shadow-2xs">
                        4%
                      </span>
                    </div>

                    <!-- 10% Marker (5등급 1등급 컷 - 우측 배치) -->
                    <div class="absolute w-full flex items-center justify-end -translate-y-1/2 z-20" :style="{ top: '10%' }">
                      <div class="w-full border-t-2 border-indigo-600"></div>
                      <span class="absolute right-0.5 sm:right-1 bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[9px] font-black shadow-2xs">
                        10%
                      </span>
                    </div>

                    <!-- 11% Marker (9등급 2등급 컷 - 좌측 배치, 10%와 겹침 없이 좌/우 완벽 분리) -->
                    <div class="absolute w-full flex items-center -translate-y-1/2 z-20" :style="{ top: '11%' }">
                      <div class="w-full border-t-2 border-dashed border-amber-500"></div>
                      <span class="absolute left-0.5 sm:left-1 bg-amber-500 text-white px-1.5 py-0.5 text-[9px] font-black rounded shadow-2xs">
                        11%
                      </span>
                    </div>

                    <!-- 23% Marker (9등급 3등급 컷 - 좌측 배치) -->
                    <div class="absolute w-full flex items-center -translate-y-1/2 z-10" :style="{ top: '23%' }">
                      <div class="w-full border-t border-dashed border-sky-400"></div>
                      <span class="absolute left-0.5 sm:left-1 bg-white px-1.5 py-0.5 text-[9px] font-bold text-sky-700 border border-sky-300 rounded shadow-2xs">
                        23%
                      </span>
                    </div>

                    <!-- 34% Marker (5등급 2등급 컷 - 우측 배치) -->
                    <div class="absolute w-full flex items-center justify-end -translate-y-1/2 z-10" :style="{ top: '34%' }">
                      <div class="w-full border-t-2 border-indigo-500"></div>
                      <span class="absolute right-0.5 sm:right-1 bg-indigo-500 text-white px-1.5 py-0.5 text-[9px] font-black rounded shadow-2xs">
                        34%
                      </span>
                    </div>

                    <!-- 40% Marker (9등급 4등급 컷 - 좌측 배치) -->
                    <div class="absolute w-full flex items-center -translate-y-1/2 z-10" :style="{ top: '40%' }">
                      <div class="w-full border-t border-dashed border-slate-300"></div>
                      <span class="absolute left-0.5 sm:left-1 bg-white px-1.5 py-0.5 text-[9px] text-slate-600 border border-slate-300 rounded shadow-2xs">
                        40%
                      </span>
                    </div>

                    <!-- 66% Marker (5등급 3등급 컷 - 우측 배치) -->
                    <div class="absolute w-full flex items-center justify-end -translate-y-1/2 z-10" :style="{ top: '66%' }">
                      <div class="w-full border-t-2 border-indigo-400"></div>
                      <span class="absolute right-0.5 sm:right-1 bg-white text-indigo-700 border border-indigo-300 px-1.5 py-0.5 text-[9px] font-black rounded shadow-2xs">
                        66%
                      </span>
                    </div>

                    <!-- 90% Marker (5등급 4등급 컷 - 우측 배치) -->
                    <div class="absolute w-full flex items-center justify-end -translate-y-1/2 z-10" :style="{ top: '90%' }">
                      <div class="w-full border-t-2 border-slate-400"></div>
                      <span class="absolute right-0.5 sm:right-1 bg-white text-slate-700 border border-slate-300 px-1.5 py-0.5 text-[9px] font-bold rounded shadow-2xs">
                        90%
                      </span>
                    </div>

                    <!-- 100% Line -->
                    <div class="absolute bottom-0 inset-x-0 border-b border-slate-300"></div>
                  </div>

                  <!-- Right: 5-Grade Column (1~5 All Displayed) -->
                  <div class="col-span-5 flex flex-col h-full rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100/50 shadow-inner">
                    <div
                      v-for="item in fiveGradeList"
                      :key="'5-' + item.grade"
                      @mouseenter="hoverGrade('5', item.grade)"
                      @click="selectGrade('5', item.grade)"
                      :style="{ height: item.span + '%' }"
                      :class="[
                        'w-full flex items-center justify-between px-3 sm:px-4 cursor-pointer transition-all duration-150 relative border-b border-white/20 last:border-b-0 overflow-hidden',
                        item.bgColor,
                        selectedGradeKey === '5-' + item.grade 
                          ? 'ring-2 ring-indigo-600 z-10 brightness-110 shadow-sm' 
                          : 'hover:brightness-105'
                      ]"
                    >
                      <!-- Special Top border warning for Grade 2 (10~11% boundary) -->
                      <div v-if="item.grade === 2" class="absolute top-0 inset-x-0 h-1.5 bg-amber-400/90 z-20" title="10~11% 경계 위험선"></div>

                      <!-- Left: Grade Title & Arrow indicator (노란색 2.7배 확대 뱃지 제거 완료) -->
                      <div class="flex items-center gap-2 min-w-0">
                        <span class="font-black text-xs sm:text-sm leading-none text-white drop-shadow-xs shrink-0">
                          {{ item.grade }}등급
                        </span>
                        <span class="text-[10px] sm:text-[11px] text-white/80 font-mono hidden sm:inline shrink-0">
                          (↕{{ item.span }}%p)
                        </span>
                      </div>

                      <!-- Right: Cumulative Cut & Count -->
                      <div class="text-right text-xs sm:text-sm font-black text-white/95 leading-none shrink-0 font-mono flex items-center gap-1">
                        <span>~{{ item.cumEnd }}%</span>
                        <span class="text-[10px] sm:text-xs font-bold text-white/80 hidden md:inline">({{ item.count }}명)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Footer Scale Legend -->
                <div class="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 font-medium">
                  <div class="flex items-center gap-1.5">
                    <span class="inline-block w-2.5 h-2.5 bg-emerald-600 rounded-full"></span>
                    <span>1등급 컷 4% ➔ <strong class="text-emerald-700 font-black">10% 확대</strong></span>
                  </div>
                  <div class="flex items-center gap-1.5 text-amber-900 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                    <span>⚠️ 10~11%:</span>
                    <span>현행 2등급 ➔ <strong class="text-rose-700 underline underline-offset-2">개편 2등급 밀림 주의</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom Slide Anchor Footnote -->
            <div class="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
              <span>* 포곡고 1개 학년 약 334명 기준 등급별 인원 산출</span>
              <span class="font-bold text-slate-500">교육부 2028 개편안</span>
            </div>
          </div>

          <!-- Right (lg:col-span-5): 인터랙티브 등급 유불리 심층 분석 카드 (그래프와 나란히 좌우 배치) -->
          <div class="lg:col-span-5 bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/70 rounded-2xl p-4 sm:p-5 border border-indigo-200/80 flex flex-col justify-between shadow-xs">
            <div>
              <!-- Section Title & Live Indicator -->
              <div class="flex items-center justify-between pb-2 mb-3 border-b border-indigo-100">
                <div class="flex items-center gap-1.5">
                  <span class="text-sm">🔍</span>
                  <h3 class="text-xs sm:text-sm font-bold text-indigo-950 m-0">
                    선택 등급 심층 유불리 분석
                  </h3>
                </div>
                <span class="text-[10px] font-extrabold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-full shadow-2xs">
                  실시간 연동 진단
                </span>
              </div>

              <!-- Selected Grade Main Header -->
              <div class="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                <div class="flex flex-wrap items-center justify-between gap-1.5">
                  <div class="flex items-center gap-2">
                    <span class="text-sm sm:text-base font-black text-slate-900">{{ currentAnalysis.title }}</span>
                    <span class="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                      {{ currentAnalysis.range }}
                    </span>
                  </div>
                  <span :class="['text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border shadow-2xs', currentAnalysis.badgeClass]">
                    {{ currentAnalysis.badge }}
                  </span>
                </div>
                <div class="mt-1 text-[11px] text-slate-500 font-medium">
                  {{ currentAnalysis.rangeDetail }}
                </div>
              </div>

              <!-- Grade Mapping Comparison -->
              <div class="mt-3 text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2">
                <span class="font-bold text-indigo-900 shrink-0">🔄 등급 변동:</span>
                <span class="font-medium text-slate-800">{{ currentAnalysis.comparison }}</span>
              </div>

              <!-- Pros / Cons Section List -->
              <div class="mt-3 space-y-2.5">
                <div
                  v-for="(sec, sIdx) in currentAnalysis.sections"
                  :key="sIdx"
                  class="p-3 rounded-xl text-xs leading-relaxed shadow-2xs"
                  :class="[
                    sec.tagType === 'loss' ? 'bg-rose-50/80 border border-rose-200 text-rose-950' :
                    sec.tagType === 'win' ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-950' :
                    sec.tagType === 'danger' ? 'bg-amber-50/90 border-2 border-amber-400 text-amber-950 shadow-2xs' :
                    'bg-slate-50 border border-slate-200 text-slate-800'
                  ]"
                >
                  <div class="flex items-center justify-between gap-1 mb-1 font-bold">
                    <span class="flex items-center gap-1.5">
                      <span v-if="sec.tagType === 'loss'">📉</span>
                      <span v-else-if="sec.tagType === 'win'">🎉</span>
                      <span v-else-if="sec.tagType === 'danger'">🚨</span>
                      <span v-else>📌</span>
                      <span class="font-black">{{ sec.subtitle }}</span>
                    </span>
                    <span
                      class="text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 shadow-2xs"
                      :class="[
                        sec.tagType === 'loss' ? 'bg-rose-200 text-rose-900' :
                        sec.tagType === 'win' ? 'bg-emerald-200 text-emerald-900' :
                        sec.tagType === 'danger' ? 'bg-amber-400 text-amber-950' :
                        'bg-slate-200 text-slate-700'
                      ]"
                    >
                      {{ sec.tag }}
                    </span>
                  </div>
                  <p class="m-0 text-[11px] leading-relaxed opacity-95">{{ sec.desc }}</p>
                </div>
              </div>

              <!-- Core Advice / Caution Box -->
              <div class="mt-3 p-3 rounded-xl bg-white border border-indigo-200 shadow-2xs text-[11px] text-indigo-950 leading-relaxed">
                <strong class="text-indigo-800 flex items-center gap-1.5 mb-1 font-black text-xs">
                  <span>💡</span>
                  <span>{{ currentAnalysis.cautionTitle }}</span>
                </strong>
                <p class="m-0 text-[11px] text-slate-700 leading-relaxed">{{ currentAnalysis.cautionText }}</p>
              </div>
            </div>

            <!-- Interactive Guidance Footer -->
            <div class="mt-3 pt-2.5 border-t border-indigo-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>* 좌측 그래프의 등급 블록 클릭/호버 시 분석 전환</span>
              <span class="text-indigo-600 font-bold">포곡고 진학 맞춤 가이드</span>
            </div>
          </div>
        </div>

        <!-- [ROW 2]: 중3 내신 기반 2028 5등급제 진단기 (하단 배치로 좌우 균형 완성) -->
        <div class="mt-4 bg-gradient-to-r from-indigo-50/70 via-white to-sky-50/70 rounded-2xl p-4 border border-indigo-200/80 shadow-2xs">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div class="flex items-center gap-2">
              <span class="text-base">🧮</span>
              <h3 class="text-xs sm:text-sm font-bold text-indigo-950 m-0">
                중3 내신 기반 2028 5등급제 진단기
              </h3>
              <span class="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                체험형 시뮬레이터
              </span>
            </div>
            <span class="text-[11px] text-slate-500 hidden sm:inline">
              슬라이더를 움직여 중3 석차 백분율에 따른 포곡고 진학 시 예상 등급과 목표 대학군을 확인하세요
            </span>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
            <!-- Left: Slider (5 cols) -->
            <div class="lg:col-span-5 bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs space-y-1.5">
              <div class="flex items-center justify-between text-xs font-bold">
                <span class="text-slate-700">중학교 석차 백분율</span>
                <span class="text-indigo-600 text-sm font-black">상위 {{ simPercent }}%</span>
              </div>
              <input
                v-model.number="simPercent"
                type="range"
                min="1"
                max="50"
                step="1"
                class="w-full accent-indigo-600 cursor-pointer"
              />
              <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>상위 1% (최상위)</span>
                <span>상위 10%</span>
                <span>상위 25%</span>
                <span>상위 50%</span>
              </div>
            </div>

            <!-- Right: Results (7 cols) -->
            <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div class="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs space-y-1 flex flex-col justify-center">
                <div class="flex items-center justify-between">
                  <span class="text-slate-500 text-[11px]">2028 고교 예상 등급:</span>
                  <span :class="['px-2.5 py-0.5 rounded-md font-black text-xs text-white shadow-2xs', simResult.badgeClass]">
                    {{ simResult.gradeText }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-500 text-[11px]">포곡고 진학 시 예상 석차:</span>
                  <span class="font-bold text-slate-800">334명 중 약 {{ Math.max(1, Math.round(334 * (simPercent / 100))) }}등</span>
                </div>
                <div class="pt-1 border-t border-slate-100">
                  <span class="text-slate-500 text-[10px] block">대입 추천 목표 대학군:</span>
                  <span class="font-extrabold text-indigo-700 text-xs truncate block">{{ simResult.targetUniv }}</span>
                </div>
              </div>
              <div class="p-2.5 rounded-xl bg-indigo-600 text-white text-[11px] leading-relaxed flex flex-col justify-center shadow-2xs">
                <div>
                  <strong class="text-amber-300 block mb-0.5">📢 포곡고 전략 가이드</strong>
                  <span class="leading-snug block text-white/95">{{ simResult.advice }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Slide Footer -->
      <div class="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
        <span>교육부 2028 대입제도 개편 확정안 기준 (내신 5등급 절대평가·상대평가 병기, 수능 국수탐 공통 응시)</span>
        <span class="font-semibold text-slate-600">포곡고등학교</span>
      </div>
    </section>

    <!-- ========================================================================================= -->
    <!-- [SLIDE 3] 과학중점학교 & 2027 혁신자치예비학교 교육과정 로드맵 -->
    <!-- ========================================================================================= -->
    <section id="slide-3" class="presentation-slide a4-landscape-page bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <!-- Title Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-lg">🔬</span>
              <span class="text-xs font-extrabold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                학교의 비전 & 교육과정 혁신
              </span>
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-1 m-0">
              과학중점학교 × 2027 혁신자치예비학교, 학생의 진로를 입시 성과로!
            </h2>
          </div>
          <span class="text-xs font-bold text-slate-400">SLIDE 03 / 08</span>
        </div>

        <!-- 2 Big Engines Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <!-- Engine 1: 과학중점학교 -->
          <div class="bg-gradient-to-br from-sky-50/50 via-white to-blue-50/40 rounded-2xl p-4 sm:p-5 border border-sky-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="px-2.5 py-0.5 rounded-md text-xs font-black bg-sky-600 text-white">
                  현재 고1부터 전격 운영 중
                </span>
                <span class="text-xs font-bold text-sky-700">수·과학 이수비율 45%+</span>
              </div>
              <h3 class="text-base font-black text-slate-900 m-0">
                🧬 미래 이공계·의약학 인재의 산실 '과학중점과정'
              </h3>
              <p class="text-xs text-slate-600 mt-2 leading-relaxed m-0">
                일반계 고교의 한계를 뛰어넘어 과학고·자사고 수준의 심화 실험, R&E 탐구 과제, 고급 물/화/생/지를 이수합니다.
              </p>

              <div class="mt-3 space-y-2 text-xs">
                <div class="flex items-start gap-2">
                  <span class="text-sky-600 font-bold">✓</span>
                  <div>
                    <strong class="text-slate-800">물리·화학·생명과학·지구과학 전 과목 실험실 구축:</strong>
                    <span class="text-slate-600 text-[11px] block">첨단 MBL 센서 및 대학 연계 정밀 분석 장비 활용 실습</span>
                  </div>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-sky-600 font-bold">✓</span>
                  <div>
                    <strong class="text-slate-800">이공계·의약학 특화 학생부 세특 기록:</strong>
                    <span class="text-slate-600 text-[11px] block">설카포연고 및 과기원(GIST, UNIST, DGIST, KENTECH) 학종 적합도 최고점</span>
                  </div>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-sky-600 font-bold">✓</span>
                  <div>
                    <strong class="text-slate-800">수능 공통과학(2028 통합수능)의 완벽한 기반:</strong>
                    <span class="text-slate-600 text-[11px] block">심도 있는 과학 학습으로 2028 수능 통합과학 최저학력기준 1등급 선점</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-sky-100 flex items-center justify-between text-xs font-bold text-sky-800">
              <span>🎯 타겟 진로:</span>
              <span>AI/소프트웨어, 반도체, 바이오/의약학, 융합공학</span>
            </div>
          </div>

          <!-- Engine 2: 혁신자치예비학교 -->
          <div class="bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/40 rounded-2xl p-4 sm:p-5 border border-emerald-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="px-2.5 py-0.5 rounded-md text-xs font-black bg-emerald-600 text-white">
                  2027년 3월 전격 개시
                </span>
                <span class="text-xs font-bold text-emerald-700">미래형 자치·진로 학교</span>
              </div>
              <h3 class="text-base font-black text-slate-900 m-0">
                🌱 학생 주도 자치와 맞춤형 진로 '혁신자치예비학교'
              </h3>
              <p class="text-xs text-slate-600 mt-2 leading-relaxed m-0">
                수동적 주입식 교육에서 벗어나 학생이 스스로 진로 프로젝트와 자치 프로그램을 기획·운영하는 창의적 공립고 모델입니다.
              </p>

              <div class="mt-3 space-y-2 text-xs">
                <div class="flex items-start gap-2">
                  <span class="text-emerald-600 font-bold">✓</span>
                  <div>
                    <strong class="text-slate-800">학생 자치 주도 전공 탐색 프로젝트:</strong>
                    <span class="text-slate-600 text-[11px] block">스스로 문제를 정의하고 해결하는 탐구 보고서로 독창적 학생부 구축</span>
                  </div>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-emerald-600 font-bold">✓</span>
                  <div>
                    <strong class="text-slate-800">인문·사회·경영계열 특화 자치 아카데미:</strong>
                    <span class="text-slate-600 text-[11px] block">과중학교 내에서도 문과 계열 학생들이 소외되지 않는 자치 트랙 보장</span>
                  </div>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-emerald-600 font-bold">✓</span>
                  <div>
                    <strong class="text-slate-800">지역사회 연계 진로 멘토링:</strong>
                    <span class="text-slate-600 text-[11px] block">용인 반도체 클러스터 및 지역 공공기관 연계 현장 체험 프로그램</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-800">
              <span>🎯 타겟 진로:</span>
              <span>경영/경제, 미디어/어문, 공공정책/법학, 예술체육</span>
            </div>
          </div>
        </div>

        <!-- 3-Year Growth Timeline Bar -->
        <div class="mt-5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <div class="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <span>🚀</span>
            <span>포곡고 3개년 대입 로드맵: 1학년 입학부터 3학년 수시 합격까지</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div class="p-2.5 rounded-xl bg-white border border-slate-200">
              <span class="text-[10px] font-black text-indigo-600">1학년 [기초 & 전공 탐색]</span>
              <p class="font-bold text-slate-800 m-0 mt-1">공통과목 1등급 선점 & 과중 탐색</p>
              <p class="text-[11px] text-slate-500 m-0 mt-0.5">통합사회·통합과학 탄탄한 기초 확립 및 학생회·동아리 자치 활동 시작</p>
            </div>
            <div class="p-2.5 rounded-xl bg-white border border-slate-200">
              <span class="text-[10px] font-black text-sky-600">2학년 [심화 & 세특 차별화]</span>
              <p class="font-bold text-slate-800 m-0 mt-1">과중 심화실험 & 자치 프로젝트</p>
              <p class="text-[11px] text-slate-500 m-0 mt-0.5">수학·과학 심화과목 선택, 과제연구 보고서 완성 및 수능 최저 준비</p>
            </div>
            <div class="p-2.5 rounded-xl bg-white border border-slate-200">
              <span class="text-[10px] font-black text-emerald-600">3학년 [수시 완성 & 파이널]</span>
              <p class="font-bold text-slate-800 m-0 mt-1">1:1 맞춤형 6장 카드 포트폴리오</p>
              <p class="text-[11px] text-slate-500 m-0 mt-0.5">꼼스탯 대입 빅데이터 기반 모의면접, 학교장추천·농어촌·학종 황금비율 구성</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Slide Footer -->
      <div class="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
        <span>경기도교육청 과학중점학교 지정교 및 혁신자치예비학교 선정</span>
        <span class="font-semibold text-slate-600">포곡고등학교</span>
      </div>
    </section>

    <!-- ========================================================================================= -->
    <!-- [SLIDE 4] 용인시 처인구 내 고교 지형도 & 포곡고의 독보적 비교 우위 -->
    <!-- ========================================================================================= -->
    <section id="slide-4" class="presentation-slide a4-landscape-page bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <!-- Title Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-lg">🏫</span>
              <span class="text-xs font-extrabold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                지역 내 학교 비교 분석
              </span>
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-1 m-0">
              용인시 처인구 내 고교 지형도, 왜 포곡고가 가장 안정적인 선택인가?
            </h2>
          </div>
          <span class="text-xs font-bold text-slate-400">SLIDE 04 / 08</span>
        </div>

        <p class="text-xs text-slate-600 mt-2 max-w-3xl leading-relaxed m-0">
          고교 선택 시 가장 중요한 기준은 <strong>① 내신 산출의 안정성(학생 수 규모)</strong>, <strong>② 학교의 공식 교육과정 인증(과학중점)</strong>, 그리고 <strong>③ 대입 수시 지원 체계</strong>입니다. 처인구 타 고교와 객관적으로 비교해 드립니다.
        </p>

        <!-- Comparative Matrix Table -->
        <div class="overflow-x-auto mt-4">
          <table class="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th class="py-3 px-3">비교 영역</th>
                <th class="py-3 px-3 bg-indigo-50/80 text-indigo-900 font-black border-x border-indigo-200">포곡고등학교 (본교)</th>
                <th class="py-3 px-3 text-slate-600">처인구 소규모 일반고 A군</th>
                <th class="py-3 px-3 text-slate-600">타 읍면 대형 일반고 B군</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 font-medium">
              <!-- Row 1: 학생 수 & 내신 -->
              <tr class="hover:bg-slate-50/60">
                <td class="py-2.5 px-3 font-bold text-slate-900">
                  학생 규모 &<br />내신 등급 산출
                </td>
                <td class="py-2.5 px-3 bg-indigo-50/30 border-x border-indigo-200 font-bold text-indigo-950">
                  <span class="text-indigo-600 font-black">학년당 330여 명 (11학급)</span><br />
                  <span class="text-[11px] text-slate-600">5등급제 1등급 약 33명 확보로 내신 경쟁 부담 대폭 완화</span>
                </td>
                <td class="py-2.5 px-3 text-slate-600">
                  학년당 100~150명 내외<br />
                  <span class="text-[11px] text-slate-400">소수 인원으로 1등급 인원이 적어 한 문제 실수 시 치명적</span>
                </td>
                <td class="py-2.5 px-3 text-slate-600">
                  학년당 300~350명<br />
                  <span class="text-[11px] text-slate-400">인원은 유사하나 최상위권 경쟁 과열로 내신 따기 매우 빡빡함</span>
                </td>
              </tr>

              <!-- Row 2: 교육과정 인증 -->
              <tr class="hover:bg-slate-50/60">
                <td class="py-2.5 px-3 font-bold text-slate-900">
                  특화 교육과정<br />공식 지정
                </td>
                <td class="py-2.5 px-3 bg-indigo-50/30 border-x border-indigo-200 font-bold text-indigo-950">
                  <span class="text-sky-600 font-black">과학중점학교 + 혁신자치예비학교</span><br />
                  <span class="text-[11px] text-slate-600">교육청 공식 지정 및 연간 특별 예산 지원으로 최고 수준 프로그램</span>
                </td>
                <td class="py-2.5 px-3 text-slate-600">
                  일반 교육과정 위주<br />
                  <span class="text-[11px] text-slate-400">심화 과목 개설 수요 부족으로 선택폭 제한</span>
                </td>
                <td class="py-2.5 px-3 text-slate-600">
                  일반 인문계 교육과정<br />
                  <span class="text-[11px] text-slate-400">과중학교와 같은 특화 이수 트랙 부재</span>
                </td>
              </tr>

              <!-- Row 3: 농어촌 전형 적합도 -->
              <tr class="hover:bg-slate-50/60">
                <td class="py-2.5 px-3 font-bold text-slate-900">
                  농어촌 전형<br />환경 및 혜택
                </td>
                <td class="py-2.5 px-3 bg-indigo-50/30 border-x border-indigo-200 font-bold text-indigo-950">
                  <span class="text-emerald-600 font-black">포곡읍 소재 (농어촌 자격 인정)</span><br />
                  <span class="text-[11px] text-slate-600">중·고 6년 및 초중고 12년 전형 대상자 완벽 수혜</span>
                </td>
                <td class="py-2.5 px-3 text-slate-600">
                  농어촌 지역 해당<br />
                  <span class="text-[11px] text-slate-400">농어촌 자격은 동일하나 수시 실적 경험 부족</span>
                </td>
                <td class="py-2.5 px-3 text-slate-600">
                  일부 동지역 혼재<br />
                  <span class="text-[11px] text-slate-400">동지역 학교는 농어촌 전형 원천 불가</span>
                </td>
              </tr>

              <!-- Row 4: 진학 지도 시스템 -->
              <tr class="hover:bg-slate-50/60">
                <td class="py-2.5 px-3 bg-indigo-50/30 border-x border-indigo-200 font-bold text-indigo-950">
                  대입 통계 &<br />1:1 진학 상담
                </td>
                <td class="py-2.5 px-3 bg-indigo-50/30 border-x border-indigo-200 font-bold text-indigo-950">
                  <span class="text-purple-600 font-black">자체 빅데이터 시스템(꼼스탯) 구축</span><br />
                  <span class="text-[11px] text-slate-600">최근 5개년 7,000+건 지원 데이터 기반 감(感)이 아닌 팩트 상담</span>
                </td>
                <td class="py-2.5 px-3 text-slate-600">
                  교사 개인 역량에 의존<br />
                  <span class="text-[11px] text-slate-400">축적된 학교 데이터베이스 미흡</span>
                </td>
                <td class="py-2.5 px-3 text-slate-600">
                  상위권 학생 중심 편중<br />
                  <span class="text-[11px] text-slate-400">중위권 학생 개별 맞춤 상담 기회 부족</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cheoin-gu Choice Takeaway -->
        <div class="mt-4 p-3 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2">
            <span class="text-amber-400 text-base">⭐</span>
            <span>
              <strong>처인구 학부모님의 최선의 선택:</strong> 너무 적지도, 너무 치열하지도 않은 <strong>최적의 330명 규모</strong> + <strong>과학중점학교</strong> 타이틀의 조합!
            </span>
          </div>
          <span class="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black shrink-0 text-[11px]">
            내신 안정성 1위
          </span>
        </div>
      </div>

      <!-- Slide Footer -->
      <div class="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
        <span>용인시 처인구 고교 현황 및 학교알리미 공시자료 종합</span>
        <span class="font-semibold text-slate-600">포곡고등학교</span>
      </div>
    </section>

    <!-- ========================================================================================= -->
    <!-- [SLIDE 5] 농어촌 전형의 진실 & 비대상자(30~40%) 필승 전략 -->
    <!-- ========================================================================================= -->
    <section id="slide-5" class="presentation-slide a4-landscape-page bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <!-- Title Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-lg">🌲</span>
              <span class="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                전형 전략 심층 해부
              </span>
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-1 m-0">
              농어촌 전형의 위력 & [농어촌 비대상자 30~40%] 필승 성공 전략
            </h2>
          </div>
          <span class="text-xs font-bold text-slate-400">SLIDE 05 / 08</span>
        </div>

        <p class="text-xs text-slate-600 mt-2 max-w-3xl leading-relaxed m-0">
          많은 학부모님들께서 "농어촌 자격이 없으면 포곡고에 가서 손해를 보지 않을까?" 걱정하십니다.<br class="hidden sm:inline" />
          포곡고 재학생의 <strong>약 30~40%는 농어촌 전형 대상자가 아니며</strong>, 이 학생들은 다른 방식으로 최상위권 대입에 성공하고 있습니다.
        </p>

        <!-- Interactive Track Toggle Bar (화면 인터랙션) -->
        <div class="mt-4 flex items-center gap-2 no-print">
          <button
            type="button"
            @click="activeTrackTab = 'nonRural'"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-none flex items-center gap-1.5',
              activeTrackTab === 'nonRural' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
          >
            <span>🏢</span>
            <span>[필독!] 농어촌 비대상자(30~40%) 필승 전략</span>
          </button>
          <button
            type="button"
            @click="activeTrackTab = 'rural'"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-none flex items-center gap-1.5',
              activeTrackTab === 'rural' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
          >
            <span>🌲</span>
            <span>농어촌 자격 대상자(중고6년/초중고12년) 혜택</span>
          </button>
        </div>

        <!-- Track 1: Non-Rural Strategy (농어촌 비대상자 30~40% 전략) -->
        <div v-show="activeTrackTab === 'nonRural' || isPrinting" class="mt-4 p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 border border-indigo-200">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-black text-indigo-950 flex items-center gap-2 m-0">
              <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              농어촌 혜택이 없어도 포곡고가 압도적으로 유리한 3대 이유!
            </h3>
            <span class="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
              재학생의 30~40% 적용 트랙
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            <div class="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div class="text-indigo-600 font-black text-sm mb-1">01. 학교장 추천 (지역균형) 독점</div>
              <strong class="text-slate-900 block mb-1">인서울 주요 15개대 지균 전형</strong>
              <p class="text-[11px] text-slate-600 m-0 leading-relaxed">
                서울대 지균(2명), 고대 학교추천, 연대 추천형 등 주요 대학은 고교별 추천 인원을 제한합니다. 포곡고에서 안정된 1등급을 확보하면 농어촌 전형보다 상위권 대학 학교장추천을 우선 배정받습니다.
              </p>
            </div>

            <div class="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div class="text-sky-600 font-black text-sm mb-1">02. 과중 세특으로 일반 학종 돌파</div>
              <strong class="text-slate-900 block mb-1">자사·특목고와 경쟁하는 학생부</strong>
              <p class="text-[11px] text-slate-600 m-0 leading-relaxed">
                과학중점학교의 실험·탐구 교과 세특은 일반고 수준을 넘어섭니다. 서강대, 성균관대, 한양대, 이화여대 및 과기원 일반 학생부종합전형에서 농어촌 꼬리표 없이도 당당히 최종 합격합니다.
              </p>
            </div>

            <div class="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div class="text-emerald-600 font-black text-sm mb-1">03. 2028 1등급 선점의 교과 파워</div>
              <strong class="text-slate-900 block mb-1">10% 1등급 안착 후 수능 최저 충족</strong>
              <p class="text-[11px] text-slate-600 m-0 leading-relaxed">
                처인구 외곽 대형고나 분당/수지 학군지에서 3~4등급으로 밀려날 학생이 포곡고에서는 1~2등급을 안정적으로 선점하여 교과전형으로 인서울 명문대에 직행합니다.
              </p>
            </div>
          </div>
        </div>

        <!-- Track 2: Rural Benefit (농어촌 대상자 혜택) -->
        <div v-show="activeTrackTab === 'rural' || isPrinting" class="mt-4 p-5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 border border-amber-200">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-black text-amber-950 flex items-center gap-2 m-0">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              농어촌 자격 대상자(중고6년/초중고12년)의 막강한 프리미엄
            </h3>
            <span class="text-[11px] font-bold text-amber-700 bg-white px-2 py-0.5 rounded-md border border-amber-200">
              정원 외 특별전형 수혜
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            <div class="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <strong class="text-amber-900 block font-bold mb-1">실질 경쟁률 대폭 하락</strong>
              <p class="text-[11px] text-slate-600 m-0 leading-relaxed">
                일반 전형 경쟁률(15~25:1) 대비 농어촌 전형은 4~8:1 수준으로 1차 서류 통과 확률이 3배 이상 높습니다.
              </p>
            </div>
            <div class="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <strong class="text-amber-900 block font-bold mb-1">수시 합격선 0.5~1.0등급 완화</strong>
              <p class="text-[11px] text-slate-600 m-0 leading-relaxed">
                동일 대학·학과 기준 일반 학생보다 0.5~1등급 낮은 내신으로도 역전 합격이 빈번하게 발생합니다.
              </p>
            </div>
            <div class="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <strong class="text-amber-900 block font-bold mb-1">정시(수능)에서도 정원 외 선발</strong>
              <p class="text-[11px] text-slate-600 m-0 leading-relaxed">
                수시 불합격 시에도 정시 농어촌 특별전형으로 백분위 5~10점 낮은 점수로 상위권 대학 진학이 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Slide Footer -->
      <div class="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
        <span>농어촌학생 특별전형 지원 자격(유형1: 6년 / 유형2: 12년) 대입 요강 기준</span>
        <span class="font-semibold text-slate-600">포곡고등학교</span>
      </div>
    </section>

    <!-- ========================================================================================= -->
    <!-- [SLIDE 6] 실제 수시 대입 성과 (Data-Driven Fact) -->
    <!-- ========================================================================================= -->
    <section id="slide-6" class="presentation-slide a4-landscape-page bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <!-- Title Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-lg">🏆</span>
              <span class="text-xs font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                실제 대입 데이터 검증 (Fact-based)
              </span>
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-1 m-0">
              수치로 입증된 포곡고의 수시 경쟁력, 최상위권부터 수도권까지!
            </h2>
          </div>
          <span class="text-xs font-bold text-slate-400">SLIDE 06 / 08</span>
        </div>

        <!-- 4 Stat Highlight Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span class="text-[11px] font-bold text-slate-500">최상위 주요대/과기원 출원</span>
            <div class="text-2xl font-black text-rose-600 mt-0.5">101건</div>
            <span class="text-[10px] text-slate-400">설카포연고 + 서성한이 + 과기원</span>
          </div>

          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span class="text-[11px] font-bold text-slate-500">수도권 4년제 출원율</span>
            <div class="text-2xl font-black text-indigo-600 mt-0.5">61.4%</div>
            <span class="text-[10px] text-slate-400">서울 265건, 경기 550건, 인천 30건</span>
          </div>

          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span class="text-[11px] font-bold text-slate-500">과학기술원(과기원) 지원</span>
            <div class="text-2xl font-black text-sky-600 mt-0.5">24건</div>
            <span class="text-[10px] text-slate-400">GIST, UNIST, DGIST, KENTECH (평균 1.60)</span>
          </div>

          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span class="text-[11px] font-bold text-slate-500">1인당 수시 전략 출원</span>
            <div class="text-2xl font-black text-emerald-600 mt-0.5">5.59건</div>
            <span class="text-[10px] text-slate-400">246명 접수 (총 1,376건 수시 카드)</span>
          </div>
        </div>

        <!-- Major Target Universities Summary Table -->
        <div class="overflow-x-auto mt-4">
          <table class="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th class="py-2.5 px-3">목표 대학군</th>
                <th class="py-2.5 px-3">대상 대학 예시</th>
                <th class="py-2.5 px-3 text-center">지원 건수</th>
                <th class="py-2.5 px-3 text-center">지원자 평균 내신</th>
                <th class="py-2.5 px-3 text-slate-600">주요 전형 특징</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200/80 font-medium">
              <tr class="hover:bg-slate-50/70">
                <td class="py-2 px-3 font-bold text-indigo-700">설·카·포·연·고</td>
                <td class="py-2 px-3 text-slate-600">서울대, KAIST, 포항공대, 연세대, 고려대 (본교)</td>
                <td class="py-2 px-3 text-center font-black text-slate-900">33건</td>
                <td class="py-2 px-3 text-center font-bold text-indigo-600 font-mono">1.69등급</td>
                <td class="py-2 px-3 text-slate-500 text-[11px]">학교장추천 + 과학중점 심화 학종</td>
              </tr>
              <tr class="hover:bg-slate-50/70">
                <td class="py-2 px-3 font-bold text-indigo-700">서·성·한·이</td>
                <td class="py-2 px-3 text-slate-600">서강대, 성균관대, 한양대(서울), 이화여대</td>
                <td class="py-2 px-3 text-center font-black text-slate-900">44건</td>
                <td class="py-2 px-3 text-center font-bold text-indigo-600 font-mono">1.79등급</td>
                <td class="py-2 px-3 text-slate-500 text-[11px]">교과 지역균형 & 학생부종합 투트랙</td>
              </tr>
              <tr class="hover:bg-slate-50/70">
                <td class="py-2 px-3 font-bold text-sky-700">과기원 특화</td>
                <td class="py-2 px-3 text-slate-600">GIST, UNIST, DGIST, 한국에너지공대</td>
                <td class="py-2 px-3 text-center font-black text-slate-900">24건</td>
                <td class="py-2 px-3 text-center font-bold text-sky-600 font-mono">1.60등급</td>
                <td class="py-2 px-3 text-slate-500 text-[11px]">과학중점 실험 및 과제연구 세특 최적화</td>
              </tr>
              <tr class="hover:bg-slate-50/70">
                <td class="py-2 px-3 font-bold text-rose-700">의·치·한·약·수</td>
                <td class="py-2 px-3 text-slate-600">의예, 치의예, 한의예, 약학, 수의예</td>
                <td class="py-2 px-3 text-center font-black text-slate-900">1건</td>
                <td class="py-2 px-3 text-center font-bold text-rose-600 font-mono">1.52등급</td>
                <td class="py-2 px-3 text-slate-500 text-[11px]">상지대 한의예과 수시 출원</td>
              </tr>
              <tr class="hover:bg-slate-50/70">
                <td class="py-2 px-3 font-bold text-slate-800">수도권 주요 15개대</td>
                <td class="py-2 px-3 text-slate-600">중앙·경희·외대·시립·건국·동국·홍익·국민 등</td>
                <td class="py-2 px-3 text-center font-black text-slate-900">213건</td>
                <td class="py-2 px-3 text-center font-bold text-slate-700 font-mono">3.26등급</td>
                <td class="py-2 px-3 text-slate-500 text-[11px]">농어촌 정원 외 & 일반 학종 다수 출원</td>
              </tr>
              <tr class="hover:bg-slate-50/70">
                <td class="py-2 px-3 font-bold text-slate-800">경기권 거점/선호대</td>
                <td class="py-2 px-3 text-slate-600">아주·인하·경기·가천·강남·명지·수원·용인 등</td>
                <td class="py-2 px-3 text-center font-black text-slate-900">315건</td>
                <td class="py-2 px-3 text-center font-bold text-slate-700 font-mono">3.85등급</td>
                <td class="py-2 px-3 text-slate-500 text-[11px]">학생부교과 및 면접 전형 안정권 지원</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Slide Footer -->
      <div class="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
        <span>대교협 수시 원서접수 전수 데이터(1,376건) 집계 기준</span>
        <span class="font-semibold text-slate-600">포곡고등학교</span>
      </div>
    </section>

    <!-- ========================================================================================= -->
    <!-- [SLIDE 7] 중3 학부모가 가장 많이 묻는 질문 BEST 6 (인터랙티브 FAQ) -->
    <!-- ========================================================================================= -->
    <section id="slide-7" class="presentation-slide a4-landscape-page bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <!-- Title Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-lg">💬</span>
              <span class="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                중3 학부모 진로 Q&A
              </span>
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-1 m-0">
              중3 학부모님이 가장 궁금해하시는 질문 BEST 6
            </h2>
          </div>
          <span class="text-xs font-bold text-slate-400">SLIDE 07 / 08</span>
        </div>

        <!-- 6 FAQ Accordion Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
          <div
            v-for="(faq, i) in faqList"
            :key="i"
            @click="faq.isOpen = !faq.isOpen"
            class="p-4 rounded-2xl border transition-all duration-150 cursor-pointer text-left flex flex-col justify-between"
            :class="[
              faq.isOpen || isPrinting 
                ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-500/10' 
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
            ]"
          >
            <div>
              <div class="flex items-start justify-between gap-2">
                <h3 class="text-xs font-bold text-slate-900 flex items-start gap-1.5 m-0 leading-snug">
                  <span class="text-indigo-600 font-black shrink-0">Q{{ i + 1 }}.</span>
                  <span>{{ faq.q }}</span>
                </h3>
                <span class="text-slate-400 text-xs shrink-0 no-print">{{ faq.isOpen ? '▲' : '▼' }}</span>
              </div>

              <!-- Answer content (Always visible in print) -->
              <p
                v-show="faq.isOpen || isPrinting"
                class="text-[11px] text-slate-600 mt-2.5 m-0 leading-relaxed border-t border-slate-200/60 pt-2 animate-fade-in"
              >
                <strong class="text-indigo-700 block mb-0.5">답변:</strong>
                {{ faq.a }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Slide Footer -->
      <div class="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
        <span>설명회 현장 및 1:1 상담 다빈도 질의 기반 작성</span>
        <span class="font-semibold text-slate-600">포곡고등학교</span>
      </div>
    </section>

    <!-- ========================================================================================= -->
    <!-- [SLIDE 8] 고입 전형 일정 & 맞춤형 입학 상담 안내 -->
    <!-- ========================================================================================= -->
    <section id="slide-8" class="presentation-slide a4-landscape-page bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden flex flex-col justify-between">
      <div class="relative z-10">
        <div class="flex items-center justify-between pb-3 border-b border-white/15">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950">
              📝 고입 전형 & 입학 상담
            </span>
            <span class="text-xs font-bold text-indigo-200">2026학년도 신입생 모집</span>
          </div>
          <span class="text-xs font-bold text-amber-300">SLIDE 08 / 08</span>
        </div>

        <h2 class="text-2xl sm:text-3xl font-black text-white mt-3 m-0">
          포곡고등학교에서 시작될 자녀의 빛나는 3년,<br />
          <span class="text-amber-300">믿고 맡겨주시면 최고의 대입 결과로 증명하겠습니다.</span>
        </h2>

        <!-- Action Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <div class="text-amber-300 text-sm font-bold mb-1">📅 원서 접수 일정</div>
            <div class="text-sm font-black text-white">2025년 12월 초순 예정</div>
            <p class="text-[11px] text-slate-300 mt-1 m-0">
              경기도 고등학교 입학전형 기본계획에 따라 중학교 담임교사를 통한 온라인 원서 접수
            </p>
          </div>

          <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <div class="text-sky-300 text-sm font-bold mb-1">📞 1:1 개별 진학 상담</div>
            <div class="text-sm font-black text-white">진로진학상담부 운영</div>
            <p class="text-[11px] text-slate-300 mt-1 m-0">
              중학교 성적표 지참 시 포곡고 5등급제 예상 석차 및 맞춤형 진로 트랙 심층 상담 제공
            </p>
          </div>

          <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <div class="text-emerald-300 text-sm font-bold mb-1">📍 학교 위치 & 교통</div>
            <div class="text-sm font-black text-white">용인 에버라인 둔전역 인근</div>
            <p class="text-[11px] text-slate-300 mt-1 m-0">
              처인구 및 인근 지역 대중교통 노선 다수 운행, 안전하고 쾌적한 통학 환경
            </p>
          </div>
        </div>

        <!-- Final Message -->
        <div class="mt-6 p-4 rounded-2xl bg-white/15 border border-white/20 text-center">
          <p class="text-xs sm:text-sm text-amber-200 font-bold m-0">
            "포곡고등학교는 모든 학생의 꿈을 존중하며, 학생의 잠재력을 대학 입시에서 가장 빛나는 실적으로 완성합니다."
          </p>
        </div>
      </div>

      <!-- Slide Footer -->
      <div class="relative z-10 pt-4 border-t border-white/15 text-[11px] text-slate-300 flex items-center justify-between">
        <span>교무실 / 진학상담실 문의: 031-329-0100 (내선 진로진학상담부)</span>
        <span class="font-bold text-amber-400">포곡고등학교</span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Quick Slide Jump Navigation
const slideList = [
  { id: 'slide-1', shortTitle: '대입격변 인트로', emoji: '🚀' },
  { id: 'slide-2', shortTitle: '2028 개편 진단', emoji: '📊' },
  { id: 'slide-3', shortTitle: '과중·혁신 로드맵', emoji: '🔬' },
  { id: 'slide-4', shortTitle: '처인구 고교 비교', emoji: '🏫' },
  { id: 'slide-5', shortTitle: '농어촌&비대상 전략', emoji: '🌲' },
  { id: 'slide-6', shortTitle: '대입 성과 Fact', emoji: '🏆' },
  { id: 'slide-7', shortTitle: '학부모 Q&A', emoji: '💬' },
  { id: 'slide-8', shortTitle: '고입 일정 안내', emoji: '📝' }
]

const activeSlideId = ref('slide-1')
const isPrinting = ref(false)

function scrollToSlide(id) {
  activeSlideId.value = id
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function triggerPrint() {
  window.print()
}

// -------------------------------------------------------------
// [SLIDE 2] 9-Grade vs 5-Grade Height Comparison Data & Analysis
// -------------------------------------------------------------
const selectedGradeKey = ref('5-1')

function hoverGrade(system, grade) {
  selectedGradeKey.value = `${system}-${grade}`
}

function selectGrade(system, grade) {
  selectedGradeKey.value = `${system}-${grade}`
}

// 9등급제 높이 데이터 (1~9 All)
const nineGradeList = [
  { grade: 1, span: 4, cumEnd: 4, count: 13, bgColor: 'bg-emerald-600' },
  { grade: 2, span: 7, cumEnd: 11, count: 24, bgColor: 'bg-teal-600' },
  { grade: 3, span: 12, cumEnd: 23, count: 40, bgColor: 'bg-sky-600' },
  { grade: 4, span: 17, cumEnd: 40, count: 57, bgColor: 'bg-blue-600' },
  { grade: 5, span: 20, cumEnd: 60, count: 66, bgColor: 'bg-slate-500' },
  { grade: 6, span: 17, cumEnd: 77, count: 57, bgColor: 'bg-slate-600' },
  { grade: 7, span: 12, cumEnd: 89, count: 40, bgColor: 'bg-slate-700' },
  { grade: 8, span: 7, cumEnd: 96, count: 24, bgColor: 'bg-zinc-700' },
  { grade: 9, span: 4, cumEnd: 100, count: 13, bgColor: 'bg-zinc-800' }
]

// 2028 개편 5등급제 높이 데이터 (1~5 All)
const fiveGradeList = [
  { grade: 1, span: 10, cumEnd: 10, count: 33, bgColor: 'bg-gradient-to-r from-emerald-600 to-teal-700' },
  { grade: 2, span: 24, cumEnd: 34, count: 80, bgColor: 'bg-gradient-to-r from-indigo-600 to-violet-700' },
  { grade: 3, span: 32, cumEnd: 66, count: 107, bgColor: 'bg-gradient-to-r from-sky-600 to-blue-700' },
  { grade: 4, span: 24, cumEnd: 90, count: 80, bgColor: 'bg-gradient-to-r from-slate-500 to-slate-600' },
  { grade: 5, span: 10, cumEnd: 100, count: 33, bgColor: 'bg-gradient-to-r from-zinc-700 to-zinc-800' }
]

// 각 등급별 유불리 진단 & 필독 주의사항 맵
const gradeAnalysisMap = {
  // 5등급제 1등급 (0~10%)
  '5-1': {
    title: '2028 개편 5등급제 - 1등급',
    range: '상위 0% ~ 10%',
    rangeDetail: '포곡고 약 33명 (기존 12명 대비 2.7배 대폭 확대)',
    badge: '🏆 최대 수혜 & 최상위 변별력 격변',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    comparison: '현행 9등급제의 1등급(4%) + 2등급 상위(4~10%)가 하나로 통합',
    sections: [
      {
        subtitle: '🥇 상위 1~4% (최상위권 학생): 상대적 손해 체감 & 변별력 저하',
        tag: '상대적 불리감',
        tagType: 'loss',
        desc: '9등급제에서는 4%만의 독보적 1등급이었으나, 5등급제에서는 10%까지 모두 1등급을 받게 되므로 "내신 1등급" 타이틀의 희소성이 하락하여 상대적으로 손해를 보는 느낌을 받습니다.'
      },
      {
        subtitle: '🚀 상위 4~10% (상위권 학생): 최대 수혜! 명문대 수시 출원 문호 개방',
        tag: '최대 수혜',
        tagType: 'win',
        desc: '기존 9등급제에서는 아깝게 2등급(11% 이내)으로 밀려 서울 상위권 교과·추천전형 지원이 위축되었으나, 5등급제에서는 모두 "1등급"을 받아 SKY·의약학·주요 명문대 추천 전형 지원권에 안착합니다.'
      }
    ],
    cautionTitle: '1등급 학생이 반드시 유의하고 대비해야 할 핵심 포인트',
    cautionText: '대학들은 1등급이 10%로 흔해진 만큼 단순 내신 등급만으로 학생을 변별할 수 없습니다. ① 과학중점학교 실험·과제연구 등 심화 학생부 세특, ② 수능 최저학력기준(3합/4합) 충족, ③ 대학별 심층 면접이 실질 당락을 결정합니다. 포곡고의 과학중점 탐구 인프라와 수능최저 관리반이 최상위권의 필수 무기입니다.'
  },

  // 5등급제 2등급 (10~34%)
  '5-2': {
    title: '2028 개편 5등급제 - 2등급',
    range: '상위 10% ~ 34%',
    rangeDetail: '포곡고 약 80명 (누적 113명까지)',
    badge: '⚡ 10~11% 요주의 경계선 & 거대 통합',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    comparison: '9등급제의 2등급 끝(10~11%) + 3등급 전체(11~23%) + 4등급 초반(23~34%)',
    sections: [
      {
        subtitle: '🚨 상위 10~11% 학생 (가장 뼈아픈 요주의 위험 구간!)',
        tag: '치명적 위기',
        tagType: 'danger',
        desc: '9등급제였다면 분명 "2등급(11% 이내)"이었을 학생이, 5등급제 1등급 컷(10%)에 1~2문제 차이로 걸리지 못해 2등급으로 밀려납니다. 더욱이 5등급제 2등급은 상위 34%까지로 범위가 매우 넓어서, 대학 평가자에게 "실질적 9등급제 3등급(23%) 수준의 학생"과 도매금으로 묶여 취급받을 위험이 매우 높습니다!'
      },
      {
        subtitle: '📈 상위 11~23% 학생 (9등급제 3등급권): 2등급 표기 승격 효과',
        tag: '수혜',
        tagType: 'win',
        desc: '기존 9등급제 3등급이었던 학생들이 2등급으로 표기되면서 인서울 주요 15개대 학종 및 수도권 상위권 대학 교과·종합 지원 가시권에 안정적으로 안착합니다.'
      },
      {
        subtitle: '🎯 상위 23~34% 학생 (9등급제 4등급권): 수도권 주요대 도전권 확보',
        tag: '기회 확대',
        tagType: 'win',
        desc: '기존 4등급에서 2등급으로 통합되어 경기권 거점 국공립대 및 수도권 주요 4년제 대학 지원 경쟁력을 확보합니다.'
      }
    ],
    cautionTitle: '2등급 구간(특히 10~11% 경계선) 필독 주의사항',
    cautionText: '10~11% 경계선 학생은 1~2문제 실수 방지로 10% 이내(1등급) 진입을 1차 목표로 삼아야 합니다. 만약 2등급을 받더라도 생활기록부에 원점수와 성취도(A), 과목평균·표준편차가 병기되므로, 높은 원점수와 압도적인 전공 세특, 높은 수능최저로 "상위 2등급"임을 증명해내야 합니다.'
  },

  // 5등급제 3등급 (34~66%)
  '5-3': {
    title: '2028 개편 5등급제 - 3등급',
    range: '상위 34% ~ 66%',
    rangeDetail: '포곡고 약 107명 (누적 220명까지)',
    badge: '중위권 대통합 허리 구간',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    comparison: '9등급제의 4등급 중하위(34~40%) + 5등급 전체(40~60%) + 6등급 초반(60~66%)',
    sections: [
      {
        subtitle: '중위권 전체(34~66%)가 하나의 3등급으로 단일화',
        tag: '변별 축 이동',
        tagType: 'neutral',
        desc: '기존의 4등급, 5등급, 6등급 초반까지 전체 수험생의 32%가 하나의 3등급으로 묶이므로, 고교 내신 등급 숫자만으로는 변별력이 거의 사라집니다.'
      }
    ],
    cautionTitle: '3등급 학생의 진학 전략 주의사항',
    cautionText: '3등급 내에서는 등급 자체보다 과목별 원점수 관리와 비교과 스토리, 포곡고 특화 학교장추천 및 농어촌 전형, 약술형 논술 전형 등을 적극 결합하여 경기권 거점 4년제 및 국립대 진학을 전략적으로 공략해야 합니다.'
  },

  // 5등급제 4등급 (66~90%)
  '5-4': {
    title: '2028 개편 5등급제 - 4등급',
    range: '상위 66% ~ 90%',
    rangeDetail: '포곡고 약 80명 (누적 300명까지)',
    badge: '하위-중하위권 통합 구간',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    comparison: '9등급제의 6등급 중하위(66~77%) + 7등급 전체(77~89%) + 8등급 초반',
    sections: [
      {
        subtitle: '기존 6~7등급대가 4등급으로 통합',
        tag: '기본기 보강',
        tagType: 'neutral',
        desc: '고교 진학 후 교과 기초학력 보강과 진로 적성 탐색을 통해 상위 등급으로의 도약 기회를 마련합니다.'
      }
    ],
    cautionTitle: '4등급 학생의 진학 전략 주의사항',
    cautionText: '포곡고 맞춤형 진로 집중 상담을 통해 전공 실기/면접 위주 전형, 특성화 학과 또는 전문대 인기 유망 학과(보건·IT계열 등)를 타겟팅하여 취업 및 진로 경쟁력을 극대화합니다.'
  },

  // 5등급제 5등급 (90~100%)
  '5-5': {
    title: '2028 개편 5등급제 - 5등급',
    range: '상위 90% ~ 100%',
    rangeDetail: '포곡고 하위 약 34명',
    badge: '최하 등급 (하위 10%)',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    comparison: '현행 9등급제의 8등급 중후반 + 9등급 전체(96~100%)',
    sections: [
      {
        subtitle: '하위 10%에만 부여되는 5등급제 최하 등급',
        tag: '방어 필수',
        tagType: 'danger',
        desc: '9등급제 시절 8~9등급 수준의 극하위권만이 5등급을 받게 되므로 대입 수시 지원 시 치명적인 감점 요인이 될 수 있습니다.'
      }
    ],
    cautionTitle: '5등급 방지 필독 주의사항',
    cautionText: '학교 수업 충실도, 수행평가 성실 참여, 기본 출결 및 태도 관리만으로도 5등급을 피하고 4등급 이내로 쉽게 진입할 수 있으므로 기본 생활 습관 형성이 가장 중요합니다.'
  },

  // 9등급제 1등급 (0~4%)
  '9-1': {
    title: '현행 9등급제 - 1등급',
    range: '상위 0% ~ 4%',
    rangeDetail: '포곡고 약 13명 (초극상위권)',
    badge: '극소수 최상위권',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    comparison: '2028 개편 5등급제에서는 10%까지 확대된 1등급의 전반부에 해당',
    sections: [
      {
        subtitle: '5등급제 전환 시: 1등급 희소성 희석으로 상대적 손해감',
        tag: '변별력 약화',
        tagType: 'loss',
        desc: '과거에는 4%만의 독점적 상징이었으나, 2028 개편에서는 10%까지 모두 1등급을 받으므로 최상위권 학생들의 내신 희소성이 크게 낮아집니다.'
      }
    ],
    cautionTitle: '9등급제 1등급 수준 학생의 핵심 주의사항',
    cautionText: '내신 1등급 취득은 당연한 기본 조건이 되며, 서울대·의약학 등 초상위권 대학들은 심화 탐구 세특과 높은 수능 최저기준(3합 4~5 등)으로 실질 당락을 가르게 됩니다.'
  },

  // 9등급제 2등급 (4~11%)
  '9-2': {
    title: '현행 9등급제 - 2등급',
    range: '상위 4% ~ 11%',
    rangeDetail: '포곡고 약 24명 (누적 37명까지)',
    badge: '⚡ 명암이 극명하게 갈리는 분수령 구간',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    comparison: '4~10%는 5등급제 1등급으로 승격! / 10~11%는 5등급제 2등급으로 전락!',
    sections: [
      {
        subtitle: '🎉 4% ~ 10% 학생: 5등급제 1등급으로 전격 승격 (최대 수혜!)',
        tag: '최대 수혜',
        tagType: 'win',
        desc: '9등급제에서는 2등급이라는 아쉬운 타이틀로 인서울 상위권 교과 지원이 망설여졌으나, 5등급제에서는 당당히 "1등급"이 되어 주요 대학 교과/지균 지원이 대폭 가능해집니다.'
      },
      {
        subtitle: '⚠️ 10% ~ 11% 학생: 5등급제 2등급으로 밀려나 3등급 취급 위험 (최대 피해 우려!)',
        tag: '치명적 위기',
        tagType: 'danger',
        desc: '9등급제에서는 분명 2등급이었던 학생이, 5등급제에서는 1등급(10%)에 턱걸이하지 못하고 2등급(34%까지)으로 배정됩니다. 대학에서는 5등급제 2등급을 9등급제의 3등급(상위 23% 수준)과 같게 볼 가능성이 높아 실질적으로 등급이 강등되는 불이익을 겪게 됩니다.'
      }
    ],
    cautionTitle: '4~11% 구간 학생의 필독 주의사항',
    cautionText: '포곡고에서 1~2문제 실수 차이로 10% 컷오프(33등) 안팎이 결정됩니다. 10% 이내 진입을 철저히 준비해야 하며, 만약 10~11%에 머물더라도 세특과 원점수, 수능최저로 최상위 실력을 입증해야 합니다.'
  },

  // 9등급제 3등급 (11~23%)
  '9-3': {
    title: '현행 9등급제 - 3등급',
    range: '상위 11% ~ 23%',
    rangeDetail: '포곡고 약 40명 (누적 77명까지)',
    badge: '5등급제 2등급으로 상향 표기',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    comparison: '2028 개편 5등급제에서는 2등급(10~34%)의 중심부에 해당',
    sections: [
      {
        subtitle: '표기상 3등급에서 2등급으로 신분 상승 효과',
        tag: '기회 확대',
        tagType: 'win',
        desc: '기존 9등급제 3등급은 인서울 주요 15개대 교과 지원이 불가능에 가까웠으나, 5등급제 2등급으로 표기되면서 학종 및 수도권 거점대 합격 가능성이 대폭 상승합니다.'
      }
    ],
    cautionTitle: '9등급제 3등급 수준 학생의 주의사항',
    cautionText: '2등급 내에서도 중간 위치이므로 대학별 환산점수 및 수능 최저를 충족시켜 실질 경쟁력을 증명해야 인서울 및 수도권 선호 대학 합격이 보장됩니다.'
  },

  // 9등급제 4등급 (23~40%)
  '9-4': {
    title: '현행 9등급제 - 4등급',
    range: '상위 23% ~ 40%',
    rangeDetail: '포곡고 약 57명 (누적 134명까지)',
    badge: '2등급과 3등급으로 분기되는 구간',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    comparison: '23~34%는 5등급제 2등급 편입 / 34~40%는 5등급제 3등급 배정',
    sections: [
      {
        subtitle: '23~34% 학생은 2등급 편입 수혜, 34~40%는 3등급으로 분리',
        tag: '분기 구간',
        tagType: 'neutral',
        desc: '34% 컷을 기준으로 2등급과 3등급으로 나뉘므로, 34% 이내로 진입하여 2등급 타이틀을 선점하는 것이 매우 중요합니다.'
      }
    ],
    cautionTitle: '4등급 수준 학생의 주의사항',
    cautionText: '34% 이내로 들어와 5등급제 2등급을 확보하면 경기권 거점 대학 및 수도권 4년제 지원 시 매우 유리한 위치를 점할 수 있습니다.'
  },

  // 9등급제 5등급 (40~60%)
  '9-5': {
    title: '현행 9등급제 - 5등급',
    range: '상위 40% ~ 60%',
    rangeDetail: '포곡고 약 66명 (정중앙 20%)',
    badge: '5등급제 3등급 정중앙에 편입',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    comparison: '2028 개편 5등급제 3등급(34~66%)의 핵심 구간에 통합',
    sections: [
      {
        subtitle: '5등급제 3등급으로 표기 통합',
        tag: '통합',
        tagType: 'neutral',
        desc: '정규분포의 가장 두터운 중간층으로, 5등급제 3등급(34~66%) 안에 자연스럽게 수렴됩니다.'
      }
    ],
    cautionTitle: '5등급 수준 학생의 주의사항',
    cautionText: '내신 성적의 표기 변별력이 낮아지므로, 면접 비중이 높은 전형 또는 농어촌/지역인재 전형을 활용한 맞춤형 지원 전략이 유효합니다.'
  },

  // 9등급제 6등급 (60~77%)
  '9-6': {
    title: '현행 9등급제 - 6등급',
    range: '상위 60% ~ 77%',
    rangeDetail: '포곡고 약 57명',
    badge: '3등급 말단(60~66%) vs 4등급(66~77%)',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    comparison: '66% 기준으로 5등급제 3등급과 4등급으로 분리',
    sections: [
      {
        subtitle: '66% 경계선에 걸치는 구간',
        tag: '경계 구간',
        tagType: 'neutral',
        desc: '상위 66% 안으로 들어오면 3등급에 턱걸이할 수 있어 경기권 4년제 지원의 마지노선이 됩니다.'
      }
    ],
    cautionTitle: '6등급 수준 학생의 주의사항',
    cautionText: '66% 이내 진입을 통한 3등급 확보가 1차 목표입니다.'
  },

  // 9등급제 7등급 (77~89%)
  '9-7': {
    title: '현행 9등급제 - 7등급',
    range: '상위 77% ~ 89%',
    rangeDetail: '포곡고 약 40명',
    badge: '5등급제 4등급(66~90%)에 통합',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    comparison: '2028 5등급제 4등급(66~90%)에 안착',
    sections: [
      {
        subtitle: '7등급에서 4등급으로 표기 상향',
        tag: '표기 상향',
        tagType: 'neutral',
        desc: '7등급이라는 극단적 낙인이 사라지고 4등급으로 통합됩니다.'
      }
    ],
    cautionTitle: '7등급 수준 학생의 주의사항',
    cautionText: '실기/면접 위주 전형 또는 전문대 특성화 학과 전략이 유효합니다.'
  },

  // 9등급제 8등급 (89~96%)
  '9-8': {
    title: '현행 9등급제 - 8등급',
    range: '상위 89% ~ 96%',
    rangeDetail: '포곡고 약 24명',
    badge: '4등급 말단(89~90%) vs 5등급(90~96%)',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    comparison: '90% 기준으로 5등급제 4등급과 최하 5등급으로 갈림',
    sections: [
      {
        subtitle: '90% 컷오프를 지켜내야 하는 방어선',
        tag: '방어선',
        tagType: 'danger',
        desc: '90%를 넘어가면 5등급제 최하 등급인 5등급으로 떨어지게 됩니다.'
      }
    ],
    cautionTitle: '8등급 수준 학생의 주의사항',
    cautionText: '수업 및 수행평가 충실도로 90% 이내(4등급) 진입을 사수해야 합니다.'
  },

  // 9등급제 9등급 (96~100%)
  '9-9': {
    title: '현행 9등급제 - 9등급',
    range: '상위 96% ~ 100%',
    rangeDetail: '포곡고 하위 13명 (최하위 4%)',
    badge: '5등급제 5등급(하위 10%)에 흡수',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    comparison: '2028 5등급제의 최하 등급인 5등급에 편입',
    sections: [
      {
        subtitle: '최하 등급 구간',
        tag: '기초 관리',
        tagType: 'neutral',
        desc: '기초 학력과 출결 관리로 4등급 진입을 도모합니다.'
      }
    ],
    cautionTitle: '9등급 수준 학생의 주의사항',
    cautionText: '기본 출결과 수행평가 참여만으로도 성적 상승이 가능합니다.'
  }
}

const currentAnalysis = computed(() => {
  return gradeAnalysisMap[selectedGradeKey.value] || gradeAnalysisMap['5-1']
})
const simPercent = ref(15) // Default: Middle school top 15%

const simResult = computed(() => {
  const p = simPercent.value
  if (p <= 10) {
    return {
      gradeText: '1등급 (상위 10% 이내)',
      badgeClass: 'bg-emerald-600',
      targetUniv: '서울대, 연세대, 고려대, KAIST/과기원, 의약학계열',
      advice: '포곡고 입학 시 압도적인 최상위 1등급을 획득할 확률이 매우 높습니다. 과학중점학교 실험 세특과 결합하여 서울대 지균 및 SKY 학종을 최우선 목표로 공략할 수 있습니다.'
    }
  } else if (p <= 34) {
    return {
      gradeText: '2등급 (상위 11% ~ 34%)',
      badgeClass: 'bg-indigo-600',
      targetUniv: '서강대, 성균관대, 한양대, 중앙대, 경희대, 지거국 본교',
      advice: '기존 9등급제에서는 3등급권으로 분류되던 성적이지만, 2028 개편안에서는 당당한 2등급(34%)에 안착합니다. 주요 15개 대학 학생부교과/종합 전형의 핵심 합격 타겟권입니다.'
    }
  } else if (p <= 66) {
    return {
      gradeText: '3등급 (상위 35% ~ 66%)',
      badgeClass: 'bg-sky-600',
      targetUniv: '아주대, 인하대, 경기대, 가천대, 강남대, 지거국 본교',
      advice: '포곡고의 체계적인 진학 관리와 학교장추천/농어촌 전형을 병행하여 경기권 거점 대학 및 국립대 진학을 매우 안정적으로 완성할 수 있는 튼튼한 중위권입니다.'
    }
  } else {
    return {
      gradeText: '4등급대 이후',
      badgeClass: 'bg-slate-600',
      targetUniv: '경기·충청권 4년제 대학 및 특성화/실기 전형',
      advice: '고교 진학 후 교과 내신 역전 및 전공 특화 동아리 활동을 통해 수도권 4년제 진학을 목표로 1:1 맞춤 진로 컨설팅을 집중 지원합니다.'
    }
  }
})

// -------------------------------------------------------------
// Track Toggle State: Non-Rural (30~40%) vs Rural
// -------------------------------------------------------------
const activeTrackTab = ref('nonRural') // Default show Non-Rural 30~40% strategy

// -------------------------------------------------------------
// BEST 6 Parent FAQ State
// -------------------------------------------------------------
const faqList = ref([
  {
    q: '중학교 성적이 15~20% 정도인데, 포곡고에 오면 1등급을 받을 수 있을까요?',
    a: '충분히 가능합니다! 2028 대입 개편으로 1등급 비율이 상위 4%에서 상위 10%로 2.5배 확대됩니다. 포곡고는 학년당 약 330여 명의 넉넉한 학생 수를 보유하여 약 33명까지 1등급을 받습니다. 중학교 때 10~20%였던 학생이 포곡고에 와서 성실하게 학습 습관을 다지면 1등급에 안착하여 주요 명문대 수시 티켓을 선점할 수 있습니다.',
    isOpen: true
  },
  {
    q: '우리 아이는 농어촌 전형 자격이 전혀 없는데, 입학하면 불리하지 않나요?',
    a: '전혀 불리하지 않습니다! 포곡고 재학생의 약 30~40%는 농어촌 비대상자입니다. 이 학생들은 농어촌 대신 ① 학교장 추천(지역균형) 전형, ② 과학중점학교 심화 세특을 활용한 일반 학생부종합전형, ③ 우수한 교과 내신을 통한 인서울 주요 15개대 일반전형으로 진학합니다. 소규모 학교보다 학생 수가 많아 내신 등급 확보에 훨씬 유리합니다.',
    isOpen: true
  },
  {
    q: '과학중점학교면 인문·사회계열(문과)을 지망하는 학생은 소외되나요?',
    a: '그렇지 않습니다. 과학중점과정은 이공계를 희망하는 학생들의 집중 트랙이며, 인문·사회계열 학생들을 위한 인문·경상 진로 선택 과목과 자치 아카데미가 탄탄하게 분리 개설됩니다. 오히려 이과 최상위권 학생들이 과학중점반으로 분산되므로, 인문계열 학생들은 인문 교과 내신에서 최상위 등급을 더욱 안정적으로 점유할 수 있습니다.',
    isOpen: false
  },
  {
    q: '2028 통합수능(통합사회·통합과학) 대비와 수능 최저는 어떻게 준비하나요?',
    a: '포곡고는 과학중점학교로서 1학년 때부터 통합과학 및 과학 탐구 실험을 체계적으로 이수하여 통합과학 수능 대비의 최고 인프라를 갖추고 있습니다. 또한 방과후 수능 최저 대비반, EBS 연계 심화 자습 관리, 맞춤형 모의고사 피드백을 통해 수시 수능최저 충족률을 극대화합니다.',
    isOpen: false
  },
  {
    q: '고교학점제에서 우리 아이가 원하는 소인수 선택 과목이 잘 개설될까요?',
    a: '포곡고는 330여 명 규모의 대형 일반고이자 교육청 지정 과학중점학교이므로 학생들의 선택 과목 개설 역량이 처인구 최고 수준입니다. 고급물리학, 고급화학, 인공지능 기초, 심화영어 등 소인수 과목도 교육과정 클러스터 및 주문형 강좌를 통해 폭넓게 개설·운영됩니다.',
    isOpen: false
  },
  {
    q: '면학실(자습실) 환경과 야간 자율학습 관리는 어떻게 이루어지나요?',
    a: '최신 프리미엄 독서실형 면학실이 완비되어 있으며, 전문 지도 교사의 엄격한 출결 및 면학 관리 아래 야간 자율학습이 운영됩니다. 또한 자기주도학습 우수 학생을 위한 멘토링 프로그램과 인터넷 강의 시청용 전용 학습 공간이 함께 제공됩니다.',
    isOpen: false
  }
])
</script>

<style scoped>
/* Presentation Slide Styling */
.presentation-slide {
  scroll-margin-top: 80px;
}

/* ========================================================================= */
/* A4 Landscape Print Styles (A4 가로 8페이지 책자 인쇄 규격)                  */
/* ========================================================================= */
@media print {
  @page {
    size: A4 landscape;
    margin: 8mm 10mm;
  }

  /* Hide app navigation and headers */
  .no-print {
    display: none !important;
  }

  /* Force full opacity & clean rendering */
  body, html, #app {
    background: #ffffff !important;
    color: #000000 !important;
    font-size: 11pt !important;
  }

  .highschool-admission-container {
    padding: 0 !important;
    margin: 0 !important;
    gap: 0 !important;
  }

  .highschool-admission-container > * + * {
    margin-top: 0 !important;
  }

  /* Each slide becomes an exact A4 Landscape page */
  .a4-landscape-page {
    page-break-after: always !important;
    break-after: page !important;
    box-shadow: none !important;
    border: 1px solid #cbd5e1 !important;
    margin-bottom: 0 !important;
    min-height: 185mm !important;
    max-height: 195mm !important;
    padding: 10mm !important;
    border-radius: 12px !important;
  }

  /* Prevent background color clipping on modern browsers */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
