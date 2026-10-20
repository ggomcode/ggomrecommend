<template>
  <div class="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col justify-between transition-colors">
    
    <!-- 상단 헤더 (라이트 모드 고정) -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div class="flex flex-col leading-tight">
            <span class="text-xs font-bold text-blue-600 tracking-wide">{{ schoolName }}</span>
            <h1 class="text-base font-bold text-slate-900 m-0">{{ displaySystemName }}</h1>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-bold text-slate-800 m-0">
              {{ userName }}
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full ml-1" :class="roleBadgeClass">
                {{ roleLabel }}
              </span>
            </p>
            <p v-if="userSubInfo" class="text-xs text-slate-500 font-semibold m-0 mt-0.5">{{ userSubInfo }}</p>
          </div>
          <button
            v-if="auth.isAdmin"
            @click="enterSystemSettings"
            class="text-xs font-bold text-slate-700 hover:text-white bg-slate-100 hover:bg-slate-800 px-3 py-2 rounded-lg transition-all cursor-pointer border border-slate-300 flex items-center gap-1.5 shadow-2xs"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>관리자 설정</span>
          </button>
          <button
            @click="handleLogout"
            class="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition-all cursor-pointer border border-slate-200"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>

    <!-- 로딩 중 화면 (자격 점검 완료 시까지 메인 제목 및 버튼 전면 숨김) -->
    <main v-if="isPortalLoading" class="max-w-5xl mx-auto px-6 py-24 flex-1 flex flex-col justify-center items-center">
      <div class="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
        <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-sm font-bold text-slate-700 m-0">추천 시스템 정보 및 학생 자격을 점검 중입니다...</p>
      </div>
    </main>

    <!-- 자격 점검 완료 후 메인 콘텐츠 전체 일괄 표출 -->
    <main v-else class="max-w-5xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center items-center">
      <div class="text-center max-w-2xl mb-12">
        <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold mb-3 border border-blue-200 shadow-2xs">
          <span>🏫 {{ schoolName }}</span>
          <span class="text-slate-300">|</span>
          <span>{{ displaySystemName }}</span>
        </div>
        <h2 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
          {{ displaySystemName }}
        </h2>
        <p class="text-base text-slate-600 leading-relaxed">
          {{ auth.isTeacher ? '선택교과 출석부 관리 및 담당 학급 진학 업무 시스템을 선택해 주세요.' : '이용하실 서비스를 아래에서 선택해 주세요.' }}
        </p>
      </div>

      <!-- 시스템 선택 카드 뷰 (관리자 설정 순서 연동) -->
      <div :class="['grid gap-6 sm:gap-7 w-full max-w-7xl', portalGridClass]">
        <template v-for="mod in sortedSuiteModules" :key="mod.id">
        
        <!-- 카드 1: 학교장 추천자 선발 시스템 (교사는 미노출) -->
        <div
          v-if="mod.id === 'principal' && isModuleVisible('principal')"
          @click="enterPrincipalSystem"
          :class="[
            'group relative bg-white rounded-3xl p-6 sm:p-7 border shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden',
            isStudentPrincipalLocked
              ? 'border-slate-300/80 bg-slate-50/90 opacity-60 grayscale-[35%] cursor-not-allowed hover:shadow-sm'
              : 'border-slate-200/80 hover:shadow-xl hover:border-blue-500 cursor-pointer'
          ]"
        >
          <div v-if="!isStudentPrincipalLocked" class="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

          <div>
            <div class="flex items-center justify-between gap-3 mb-6">
              <div
                :class="[
                  'w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-xs border',
                  isStudentPrincipalLocked
                    ? 'bg-slate-100 text-slate-400 border-slate-200'
                    : 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white'
                ]"
              >
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <span
                :class="[
                  '-mr-6 sm:-mr-7 pl-3.5 pr-5 sm:pr-6 py-1.5 rounded-l-full rounded-r-none text-xs font-bold shadow-xs whitespace-nowrap shrink-0 border-y border-l border-r-0',
                  isStudentPrincipalLocked || principalPeriodState === 'ALL_ENDED'
                    ? 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold'
                    : (principalPeriodState === 'OPEN'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : (principalPeriodState === 'DRAFT'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : (principalPeriodState === 'CLOSED'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200')))
                ]"
              >
                {{ isStudentPrincipalLocked ? '🔒 모든 선발일정 종료' : principalStatusText }}
              </span>
            </div>

            <div class="inline-block px-2.5 py-1 rounded-md text-xs font-extrabold bg-blue-100 text-blue-700 mb-3">
              전국 대입
            </div>

            <h3
              :class="[
                'text-xl sm:text-2xl font-bold transition-colors mb-3',
                isStudentPrincipalLocked ? 'text-slate-600' : 'text-slate-900 group-hover:text-blue-600'
              ]"
            >
              학교장 추천자 선발 시스템
            </h3>
            
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              주요 대학 학교장추천전형(지역균형) 신청서 제출, 대학별 정원 관리, 교내 석차 심의 및 최종 추천 확정을 관리합니다.
            </p>

            <!-- 학생 대상: 대문에 모든 선발일정 종료 안내 배너 명확히 표시 -->
            <div
              v-if="isStudentPrincipalLocked"
              class="mt-4 p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200/90 text-rose-800 text-xs font-semibold flex items-start gap-2.5 shadow-xs"
            >
              <span class="text-base shrink-0 leading-none">🔒</span>
              <div class="space-y-0.5">
                <p class="font-bold text-rose-900 m-0 text-xs leading-tight">모든 학교장 추천 선발일정이 종료되었습니다.</p>
                <p class="text-[11px] text-rose-700 m-0 font-normal leading-normal">
                  최종 차수의 선정 결과 공지 기간이 만료되어 학생의 추천 신청 및 시스템 접근이 제한됩니다.
                </p>
              </div>
            </div>
          </div>

          <div
            :class="[
              'mt-8 pt-6 border-t flex items-center justify-between text-sm font-bold',
              isStudentPrincipalLocked
                ? 'border-slate-200 text-slate-400'
                : 'border-slate-100 text-blue-600'
            ]"
          >
            <span>{{ isStudentPrincipalLocked ? '접근 불가 (선발 종료)' : '시스템 바로가기' }}</span>
            <svg class="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>

        <!-- 카드 2: 농어촌 전형 추천자 관리 시스템 (교사는 미노출) -->
        <div
          v-else-if="mod.id === 'rural' && isModuleVisible('rural')"
          @click="enterRuralSystem"
          :class="[
            'group relative bg-white rounded-3xl p-6 sm:p-7 border shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer',
            (!auth.isStudent || isRuralEligible)
              ? 'border-slate-200/80 hover:shadow-xl hover:border-emerald-500'
              : 'border-amber-300 bg-amber-50/40 opacity-70 hover:opacity-100 hover:border-amber-400'
          ]"
        >
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

          <div>
            <div class="flex items-center justify-between gap-3 mb-6">
              <div
                :class="[
                  'w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-xs border',
                  (!auth.isStudent || isRuralEligible)
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white'
                    : 'bg-amber-100 text-amber-700 border-amber-200'
                ]"
              >
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <span
                :class="[
                  '-mr-6 sm:-mr-7 pl-3.5 pr-5 sm:pr-6 py-1.5 rounded-l-full rounded-r-none text-xs font-bold shadow-xs whitespace-nowrap shrink-0 border-y border-l border-r-0',
                  (!auth.isStudent || isRuralEligible)
                    ? (isRuralSystemOpen
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : (ruralPeriodState === 'before' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'))
                    : 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
                ]"
              >
                <template v-if="auth.isStudent && !isRuralEligible">🔒 농어촌 자격 미달</template>
                <template v-else>{{ ruralStatusText }}</template>
              </span>
            </div>

            <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800 mb-3">
              <span>기회균형 포함</span>
            </div>

            <h3 class="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mb-3">
              농어촌 전형 추천자 관리 시스템
            </h3>
            
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              기회균형 내 농어촌 특별전형 자격 검증, 지원 희망자 배정 관리 및 거주 요건 이력을 통합 관리합니다.
            </p>
          </div>

          <div
            :class="[
              'mt-8 pt-6 border-t flex items-center justify-between text-sm font-bold',
              (!auth.isStudent || isRuralEligible)
                ? 'border-slate-100 text-emerald-600'
                : 'border-amber-200 text-amber-800 font-extrabold'
            ]"
          >
            <span>
              <template v-if="auth.isStudent && !isRuralEligible">⚠️ 자격 미확인 (진입 시 확인)</template>
              <template v-else>시스템 바로가기</template>
            </span>
            <svg class="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>

        <!-- 카드 3: 수능 미응시 및 수시 미접수 등록 시스템 (재학생/관리자만 표시, 교사/졸업생 미노출) -->
        <div
          v-else-if="mod.id === 'exam_intent' && isModuleVisible('exam_intent')"
          @click="enterExamIntentSystem"
          class="group relative bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-violet-500 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

          <div>
            <div class="flex items-center justify-between gap-3 mb-6">
              <div class="w-13 h-13 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300 shadow-xs border border-violet-100">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z"/>
                  <path d="M6 9.01V9"/>
                </svg>
              </div>
              <span class="-mr-6 sm:-mr-7 pl-3.5 pr-5 sm:pr-6 py-1.5 rounded-l-full rounded-r-none text-xs font-bold shadow-xs whitespace-nowrap shrink-0 bg-violet-100 text-violet-800 border-y border-l border-r-0 border-violet-200">
                재학생 전수 조사
              </span>
            </div>

            <div class="inline-block px-2.5 py-1 rounded-md text-xs font-extrabold bg-violet-100 text-violet-700 mb-3">
              진학 관리
            </div>

            <h3 class="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-violet-600 transition-colors mb-3">
              수능응시 · 수시/정시 원서접수계획 등록
            </h3>
            
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              수능 응시 여부 및 대학 수시·정시 원서접수 계획 자가 등록, 미응시/미접수 확인서 출력 및 수능 접수대장 대조 관리를 수행합니다.
            </p>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-violet-600">
            <span>시스템 바로가기</span>
            <svg class="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>

        <!-- 카드 4: 전문대학 학교장 추천 시스템 (교사는 미노출) -->
        <div
          v-else-if="mod.id === 'junior_college' && isModuleVisible('junior_college')"
          @click="enterJuniorCollegeSystem"
          class="group relative bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-indigo-500 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

          <div>
            <div class="flex items-center justify-between gap-3 mb-6">
              <div class="w-13 h-13 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-xs border border-indigo-100">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <span class="-mr-6 sm:-mr-7 pl-3.5 pr-5 sm:pr-6 py-1.5 rounded-l-full rounded-r-none text-xs font-bold shadow-xs whitespace-nowrap shrink-0 bg-indigo-100 text-indigo-800 border-y border-l border-r-0 border-indigo-200">
                직인 날인 즉시 발급
              </span>
            </div>

            <div class="inline-block px-2.5 py-1 rounded-md text-xs font-extrabold bg-indigo-100 text-indigo-700 mb-3">
              전문대학 전형
            </div>

            <h3 class="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-3">
              전문대학 학교장 추천
            </h3>
            
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              별도 교내 심의 없이 대학·학과·전형 수동 직접 입력 및 행정실 학교장 직인 날인용 추천서를 즉시 발급·출력합니다.
            </p>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-indigo-600">
            <span>시스템 바로가기</span>
            <svg class="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>

        <!-- 카드 6: 선택교과 출석관리 시스템 (교사, 관리자 전용) -->
        <div
          v-else-if="mod.id === 'rollbook' && isModuleVisible('rollbook')"
          @click="enterRollbookSystem"
          class="group relative bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-teal-500 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

          <div>
            <div class="flex items-center justify-between gap-3 mb-6">
              <div class="w-13 h-13 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shadow-xs border border-teal-100">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <span class="-mr-6 sm:-mr-7 pl-3.5 pr-5 sm:pr-6 py-1.5 rounded-l-full rounded-r-none text-xs font-bold shadow-xs whitespace-nowrap shrink-0 bg-teal-100 text-teal-800 border-y border-l border-r-0 border-teal-200">
                고3 이동수업 · 원적학급
              </span>
            </div>

            <div class="inline-block px-2.5 py-1 rounded-md text-xs font-extrabold bg-teal-100 text-teal-700 mb-3">
              출석 관리
            </div>

            <h3 class="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-teal-600 transition-colors mb-3">
              선택교과 출석관리
            </h3>
            
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              고등학교 3학년 선택교육과정 이동수업(1~12반) 및 원적학급(1~11반) 출석부 생성·인쇄, 결석계 대장 조회/인쇄, 급식 인원 캘린더, 학생 검색 시스템을 이용합니다.
            </p>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-teal-600">
            <span>시스템 바로가기</span>
            <svg class="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>

        <!-- 카드 7: 수시 지원 통계 분석 (교사, 관리자 전용 / 학생 미노출) -->
        <div
          v-else-if="mod.id === 'stat' && isModuleVisible('stat')"
          @click="enterStatSystem"
          class="group relative bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-indigo-500 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

          <div>
            <div class="flex items-center justify-between gap-3 mb-6">
              <div class="w-13 h-13 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-xs border border-indigo-100">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </div>
              <span class="-mr-6 sm:-mr-7 pl-3.5 pr-5 sm:pr-6 py-1.5 rounded-l-full rounded-r-none text-xs font-bold shadow-xs whitespace-nowrap shrink-0 bg-indigo-100 text-indigo-800 border-y border-l border-r-0 border-indigo-200">
                대교협 원자료 분석
              </span>
            </div>

            <div class="inline-block px-2.5 py-1 rounded-md text-xs font-extrabold bg-indigo-100 text-indigo-700 mb-3">
              진학 통계 대시보드
            </div>

            <h3 class="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-3">
              대입 통계 시스템
            </h3>
            
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              대교협 원자료 기반 수시·정시 지원 현황, 대학별·성적대별 출원 경향, 면접·대학별고사 일정 및 학생별 지원 카드를 다각도로 분석합니다.
            </p>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-indigo-600">
            <span v-if="isCheckingStat" class="inline-flex items-center gap-2 text-indigo-500 font-medium">
              <svg class="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              보안 인증 확인 중...
            </span>
            <span v-else>통계 대시보드 바로가기</span>
            <svg v-if="!isCheckingStat" class="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>

        </template>
      </div>
    </main>

    <!-- 🔐 대입 통계 시스템 보안 암호 입력 모달 -->
    <div
      v-if="showStatPasswordModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      @click.self="showStatPasswordModal = false"
    >
      <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900 m-0">대입 통계 시스템 보안 인증</h3>
            <p class="text-xs text-slate-500 m-0 mt-0.5">시스템 관리자 로그인 암호를 입력하세요</p>
          </div>
        </div>

        <div class="bg-indigo-50/60 border border-indigo-100/80 rounded-2xl p-3.5 text-xs text-slate-600 leading-relaxed">
          <p class="m-0 font-medium text-slate-700">
            🛡️ 본 통계 시스템의 원본 성적·입결 자료는 <strong>암호화되어 안전하게 보호받고 있습니다.</strong>
          </p>
          <p class="m-0 mt-1 text-slate-500 text-[11px]">
            안전한 복호화 및 열람을 위해 <strong>시스템 관리자 로그인 암호</strong>를 입력해 주세요.
          </p>
        </div>

        <form @submit.prevent="submitStatPassword" class="flex flex-col gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="stat-pw-input" class="text-xs font-bold text-slate-700">관리자 암호</label>
            <input
              id="stat-pw-input"
              ref="statPwInputRef"
              v-model="statInputPassword"
              type="password"
              placeholder="시스템 관리자 로그인 암호를 입력하세요"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
              :disabled="isVerifyingPassword"
              autofocus
            />
          </div>

          <p v-if="statPasswordError" class="text-xs font-bold text-rose-600 m-0 flex items-center gap-1.5">
            <span>⚠️</span>
            <span>{{ statPasswordError }}</span>
          </p>

          <div class="flex items-center justify-end gap-2.5 mt-2">
            <button
              type="button"
              @click="showStatPasswordModal = false"
              :disabled="isVerifyingPassword"
              class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              :disabled="isVerifyingPassword || !statInputPassword.trim()"
              class="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <svg v-if="isVerifyingPassword" class="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ isVerifyingPassword ? '인증 및 복호화 검증 중...' : '인증 및 입장' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 하단 푸터 -->
    <footer class="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
      <p>© {{ new Date().getFullYear() }} {{ schoolName }} {{ displaySystemName }}</p>
    </footer>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { schoolName, fetchSchoolName } from '../utils/schoolConfig'
import { checkRuralSystemOpenStatus, getRuralEligibilityList } from '../api/ruralApi'
import { checkExamIntentSystemEnabled } from '../api/examIntentApi'
import { checkJuniorCollegeSystemEnabled } from '../api/juniorCollegeApi'
import { 
  isKcueStatSystemEnabled, 
  getKcueSheetId, 
  getStatSessionPassword, 
  setStatSessionPassword, 
  verifyStatSheetPassword,
  preloadStatCipher
} from '../api/statApi'
import { supabase } from '../utils/supabaseClient'
import { fetchRoundSchedulesMap, computeRoundDisplayStatus, parseKstDate } from '../utils/roundSchedule'
import { dialog } from '../components/common/dialog'
import {
  fetchLoginSystemName,
  loginSystemName,
  fetchSuiteModules,
  getModuleStatus,
  DEFAULT_SUITE_MODULES
} from '../api/suiteModulesApi.js'

const router = useRouter()
const auth = useAuthStore()

const principalPeriodState = ref('OPEN')
const principalStatusText = ref('🟢 접수 진행 중')
const isPrincipalAllEnded = ref(false)

const isStudentPrincipalLocked = computed(() => {
  return auth.isStudent && isPrincipalAllEnded.value
})

const isRuralSystemOpen = ref(true)
const isRuralSystemEnabled = ref(false)
const isExamIntentSystemEnabled = ref(localStorage.getItem('pcm_enable_exam_intent_system') !== 'false')
const isJuniorCollegeSystemEnabled = ref(localStorage.getItem('pcm_enable_junior_college_system') !== 'false')
const isStatSystemEnabled = ref(false)
const isPrincipalSystemEnabled = ref(true)
const isRollbookSystemEnabled = ref(true)
const suiteModules = ref(DEFAULT_SUITE_MODULES.map(m => ({ ...m })))

const displaySystemName = computed(() => loginSystemName.value || '3학년 통합 학년업무 시스템')

function checkModuleScheduleAccess(moduleId) {
  if (auth.isAdmin) return true
  const mod = suiteModules.value.find(m => m.id === moduleId)
  if (!mod || mod.alwaysOpen) return true
  const status = getModuleStatus(mod)
  if (status.code === 'BEFORE') {
    dialog.alert({
      title: '오픈 예정 안내',
      message: `[${mod.name}]은(는) 아직 오픈 전입니다.\n\n운영 기간: ${mod.startAt ? mod.startAt.replace('T', ' ') : ''} ~ ${mod.endAt ? mod.endAt.replace('T', ' ') : ''}`,
      level: 'warn'
    })
    return false
  }
  if (status.code === 'ENDED') {
    dialog.alert({
      title: '일정 마감 안내',
      message: `[${mod.name}]의 운영 일정이 마감되었습니다.\n\n마감 일시: ${mod.endAt ? mod.endAt.replace('T', ' ') : ''}`,
      level: 'warn'
    })
    return false
  }
  return true
}
const activeRuralTerm = ref('수시')
const ruralClosedReason = ref('')
const ruralPeriodState = ref('open')
const ruralStatusText = ref('🟢 접수 진행 중 (수시)')
const isRuralEligible = ref(false)
const studentApplyRural = ref(true)
const isPortalLoading = ref(true)

const userName = computed(() => {
  if (auth.isAdmin) return '관리자'
  if (auth.isTeacher) return auth.user?.user_metadata?.name || '선생님'
  if (auth.isStudent) return auth.studentName || '학생'
  return '사용자'
})

const roleLabel = computed(() => {
  if (auth.isAdmin) return '시스템 관리자'
  if (auth.isTeacher) return '교과 교사'
  if (auth.isStudent) return auth.isEnrolled ? '재학생' : '졸업생'
  return ''
})

const roleBadgeClass = computed(() => {
  if (auth.isAdmin) return 'bg-purple-100 text-purple-700'
  if (auth.isTeacher) return 'bg-emerald-100 text-emerald-700'
  return 'bg-blue-100 text-blue-700'
})

const userSubInfo = computed(() => {
  if (auth.isStudent) {
    if (!auth.isEnrolled) {
      return `${auth.gradYear || ''}년 졸업생 (${auth.studentCode})`
    }
    const codeStr = String(auth.studentCode || '')
    const displayGrade = auth.grade ?? (codeStr.length === 5 ? parseInt(codeStr.substring(0, 1)) : 3)
    const displayClass = auth.classNo ?? (codeStr.length === 5 ? parseInt(codeStr.substring(1, 3)) : '')
    return `${displayGrade}학년 ${displayClass}반 (${auth.studentCode})`
  }
  return null
})

// 수능/수시 등록 시스템 카드 노출 여부 (시스템 활성화 && (재학생 + 교사 + 관리자만, 졸업생 미노출))
const showExamIntentCard = computed(() => {
  if (!isExamIntentSystemEnabled.value) return false
  if (auth.isAdmin || auth.isTeacher) return true
  if (auth.isStudent && auth.isEnrolled) return true
  return false
})

// 관리자 설정에서 지정된 순서대로 정렬된 모듈 목록
const sortedSuiteModules = computed(() => {
  return [...suiteModules.value].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
})

// 현재 접속 사용자의 그룹 식별 ('admin' | 'teacher' | 'student' | 'graduate')
const currentUserGroup = computed(() => {
  if (auth.isAdmin) return 'admin'
  if (auth.isTeacher) return 'teacher'
  if (auth.isStudent) {
    return auth.isEnrolled ? 'student' : 'graduate'
  }
  return 'student'
})

// 각 대문 카드가 현재 사용자 그룹에게 노출되는지 여부 판별
function isModuleVisible(moduleId) {
  const mod = suiteModules.value.find(m => m.id === moduleId)
  // 관리자 설정에서 숨김(isEnabled === false) 처리된 모듈은 관리자를 포함한 모든 사용자에게 미노출
  if (!mod || mod.isEnabled === false || mod.isEnabled === 'false') {
    return false
  }

  // 대상 그룹 권한 점검 (활성화된 모듈에 한해 현재 사용자 그룹에 노출 허용 여부 점검)
  if (Array.isArray(mod.targetRoles) && mod.targetRoles.length > 0) {
    if (!mod.targetRoles.includes(currentUserGroup.value)) {
      return false
    }
  } else {
    // 레거시 권한 규칙 fallback
    if (moduleId === 'principal' && auth.isTeacher) return false
    if (moduleId === 'rural' && auth.isTeacher) return false
    if (moduleId === 'exam_intent' && auth.isStudent && !auth.isEnrolled) return false
    if (moduleId === 'junior_college' && auth.isTeacher) return false
    if (moduleId === 'rollbook' && !auth.isAdmin && !auth.isTeacher) return false
    if (moduleId === 'stat' && !auth.isAdmin && !auth.isTeacher) return false
  }

  // 레거시 개별 비활성화 상태 추가 점검
  if (moduleId === 'rural' && !isRuralSystemEnabled.value) return false
  if (moduleId === 'exam_intent' && !isExamIntentSystemEnabled.value) return false
  if (moduleId === 'junior_college' && !isJuniorCollegeSystemEnabled.value) return false
  if (moduleId === 'stat' && !isStatSystemEnabled.value) return false

  return true
}

// 그리드 레이아웃 클래스 (실제 노출되는 카드 수에 따라 동적 그리드 조정)
const portalGridClass = computed(() => {
  let cardCount = 0
  if (isModuleVisible('principal')) cardCount++
  if (isModuleVisible('rural')) cardCount++
  if (isModuleVisible('exam_intent')) cardCount++
  if (isModuleVisible('junior_college')) cardCount++
  if (isModuleVisible('rollbook')) cardCount++
  if (isModuleVisible('stat')) cardCount++

  if (cardCount >= 6) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl'
  if (cardCount === 5) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 max-w-7xl'
  if (cardCount === 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl'
  if (cardCount === 3) return 'grid-cols-1 md:grid-cols-3 max-w-6xl'
  if (cardCount === 2) return 'grid-cols-1 md:grid-cols-2 max-w-4xl'
  return 'grid-cols-1 max-w-xl'
})

// 대입 통계 시스템 보안 암호 상태
const showStatPasswordModal = ref(false)
const statInputPassword = ref('')
const isVerifyingPassword = ref(false)
const statPasswordError = ref('')
const statPwInputRef = ref(null)
const isCheckingStat = ref(false)

async function enterStatSystem() {
  if (!checkModuleScheduleAccess("stat")) return
  if (!isStatSystemEnabled.value) {
    await dialog.alert({
      title: '자료 미등록 안내',
      message: '대교협 수시 지원 원자료 구글 시트 ID가 아직 등록되지 않았습니다. 관리자 시스템 설정에서 시트 ID를 먼저 입력해 주세요.',
      level: 'warn'
    })
    return
  }

  const existingPw = getStatSessionPassword()

  // 1. 세션에 암호가 아예 없는 경우: 비동기 지체 없이 즉시(0ms) 모달 오픈!
  if (!existingPw) {
    statPasswordError.value = ''
    statInputPassword.value = ''
    showStatPasswordModal.value = true
    return
  }

  // 2. 세션 암호가 있는 경우: 즉시 로딩 표시 및 초고속 사전 검증(캐시 우선)
  isCheckingStat.value = true
  try {
    const sheetId = await getKcueSheetId()
    const verifyRes = await verifyStatSheetPassword(sheetId, existingPw)
    if (verifyRes.success) {
      // ⭕ 일치: 정상 복호화 가능 -> 원클릭 즉시 입장!
      router.push('/stat')
      return
    }
    // ❌ 불일치: 세션 암호와 구글 시트 복호화 암호가 다름 -> 모달 오픈 및 안내
    statPasswordError.value = '시스템 로그인 암호와 구글 시트 복호화 암호가 일치하지 않습니다. 구글 시트 암호화에 사용한 암호를 입력해 주세요.'
    statInputPassword.value = ''
    showStatPasswordModal.value = true
  } catch (e) {
    statPasswordError.value = ''
    statInputPassword.value = ''
    showStatPasswordModal.value = true
  } finally {
    isCheckingStat.value = false
  }
}

async function submitStatPassword() {
  const pw = statInputPassword.value.trim()
  if (!pw) {
    statPasswordError.value = '암호를 입력해 주세요.'
    return
  }

  isVerifyingPassword.value = true
  statPasswordError.value = ''

  try {
    const sheetId = await getKcueSheetId()
    const verifyRes = await verifyStatSheetPassword(sheetId, pw)

    if (!verifyRes.success) {
      statPasswordError.value = verifyRes.message || '암호가 올바르지 않습니다. 다시 확인해 주세요.'
      isVerifyingPassword.value = false
      return
    }

    // ⭕ 인증 성공: 브라우저 세션에 저장하고 시스템 대문 통과
    setStatSessionPassword(pw)
    showStatPasswordModal.value = false
    router.push('/stat')
  } catch (err) {
    statPasswordError.value = '인증 중 오류가 발생했습니다: ' + (err.message || '')
  } finally {
    isVerifyingPassword.value = false
  }
}

function enterRollbookSystem() {
  if (!checkModuleScheduleAccess("rollbook")) return
  router.push('/rollbook')
}

async function enterPrincipalSystem() {
  if (!checkModuleScheduleAccess("principal")) return
  if (isStudentPrincipalLocked.value) {
    await dialog.alert({
      title: '선발일정 종료 안내',
      message: '모든 학교장 추천 선발일정(최종 선정결과 공지 기간)이 종료되어 학생은 더 이상 시스템에 접근하실 수 없습니다.',
      level: 'warn'
    })
    return
  }
  if (auth.isAdmin) router.push('/admin')
  else if (auth.isTeacher) router.push('/teacher')
  else if (auth.isStudent) router.push('/student')
  else router.push('/login')
}

function enterSystemSettings() {
  router.push('/system-settings')
}

async function enterJuniorCollegeSystem() {
  if (!checkModuleScheduleAccess("junior_college")) return
  if (isPortalLoading.value) return
  if (!isJuniorCollegeSystemEnabled.value) {
    await dialog.alert({ title: '시스템 이용 제한', message: '전문대학 학교장 추천 시스템이 현재 비활성화되어 있습니다.' })
    return
  }
  router.push('/junior-college')
}

async function enterExamIntentSystem() {
  if (!checkModuleScheduleAccess("exam_intent")) return
  if (isPortalLoading.value) return
  if (!isExamIntentSystemEnabled.value) {
    await dialog.alert({ title: '시스템 이용 제한', message: '수능응시 · 수시/정시 원서접수계획 등록 시스템이 현재 비활성화되어 있습니다.' })
    return
  }
  if (auth.isStudent) router.push('/exam-intent')
  else router.push('/exam-intent-manage')
}

async function enterRuralSystem() {
  if (!checkModuleScheduleAccess("rural")) return
  if (isPortalLoading.value) return
  if (!isRuralSystemEnabled.value) {
    await dialog.alert({ title: '시스템 이용 제한', message: '농어촌 전형 추천자 관리 시스템이 현재 비활성화되어 있습니다.' })
    return
  }

  // 농어촌 대상 자격 미달 학생인 경우 진입 확인 모달 표출
  if (auth.isStudent && !isRuralEligible.value) {
    const confirmed = await dialog.confirm({
      title: '⚠️ 농어촌 전형 자격 미확인 안내',
      message: '학생분의 농어촌 전형 자격 검증 결과 [농어촌 대상 자격 미달/미확인] 상태입니다.\n\n그래도 농어촌 추천자 관리 시스템에 진입하시겠습니까?',
      confirmText: '진입하기',
      cancelText: '취소'
    })
    if (confirmed) {
      router.push('/rural')
    }
    return
  }

  router.push('/rural')
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

async function loadPrincipalStatus() {
  try {
    let totalRounds = 3
    if (supabase) {
      const { data: cfg } = await supabase.from('config').select('value').eq('key', 'total_rounds').maybeSingle()
      if (cfg && cfg.value) totalRounds = parseInt(cfg.value, 10) || 3
    }
    const schedulesMap = await fetchRoundSchedulesMap()
    let roundsList = []
    if (supabase) {
      const { data, error } = await supabase
        .from('timeline_rounds')
        .select('*')
        .order('id', { ascending: true })
      if (!error && data && data.length > 0) {
        roundsList = data
      }
    }

    if (roundsList.length === 0) {
      for (let i = 1; i <= totalRounds; i++) {
        roundsList.push({ id: i, status: 'DRAFT' })
      }
    }

    const processedRounds = roundsList.map(r => {
      const sched = schedulesMap[r.id]
      const dispStatus = computeRoundDisplayStatus(r, sched)
      return {
        ...r,
        computedStatus: dispStatus
      }
    })

    // 0. 마지막 선발 차수의 선정 결과 공지일 기간이 종료되었는지 점검 (KST 기준)
    const lastRoundId = totalRounds
    const lastSched = schedulesMap[lastRoundId]
    const now = new Date()
    if (lastSched) {
      const announceTarget = lastSched.announce_end || lastSched.announce_date
      const announceEndDt = parseKstDate(announceTarget, true)
      if (announceEndDt && now > announceEndDt) {
        isPrincipalAllEnded.value = true
        principalPeriodState.value = 'ALL_ENDED'
        principalStatusText.value = '🔒 모든 선발일정 종료'
        return
      }
    }
    isPrincipalAllEnded.value = false

    // 1. 접수 진행 중인 라운드
    const openRound = processedRounds.find(r => r.computedStatus === 'OPEN')
    if (openRound) {
      principalPeriodState.value = 'OPEN'
      principalStatusText.value = totalRounds === 1 ? '🟢 접수 진행 중' : `🟢 접수 진행 중 (${openRound.id}차)`
      return
    }

    // 2. 심사 진행 중인 라운드
    const closedRound = processedRounds.find(r => r.computedStatus === 'CLOSED')
    if (closedRound) {
      principalPeriodState.value = 'CLOSED'
      principalStatusText.value = totalRounds === 1 ? '🟡 심사 진행 중' : `🟡 심사 진행 중 (${closedRound.id}차)`
      return
    }

    // 3. 접수 전(DRAFT) 상태인 라운드
    const draftRound = processedRounds.find(r => r.computedStatus === 'DRAFT')
    if (draftRound) {
      principalPeriodState.value = 'DRAFT'
      principalStatusText.value = totalRounds === 1 ? '⚪ 접수 전' : `⚪ 접수 전 (${draftRound.id}차)`
      return
    }

    // 4. 모든 라운드 마감(FINALIZED)
    const finalizedRounds = processedRounds.filter(r => r.computedStatus === 'FINALIZED')
    if (finalizedRounds.length === processedRounds.length) {
      principalPeriodState.value = 'FINALIZED'
      principalStatusText.value = '🔒 최종 마감'
      return
    }

    principalPeriodState.value = 'DRAFT'
    principalStatusText.value = '⚪ 접수 전'
  } catch (e) {
    console.warn('Failed to load principal status:', e)
    principalPeriodState.value = 'OPEN'
    principalStatusText.value = '🟢 접수 진행 중'
  }
}

onMounted(async () => {
  await fetchLoginSystemName()
  try {
    const mods = await fetchSuiteModules()
    if (mods && mods.length > 0) {
      suiteModules.value = mods
      const mPrincipal = mods.find(m => m.id === 'principal')
      if (mPrincipal) isPrincipalSystemEnabled.value = mPrincipal.isEnabled
      const mRural = mods.find(m => m.id === 'rural')
      if (mRural) isRuralSystemEnabled.value = mRural.isEnabled
      const mExam = mods.find(m => m.id === 'exam_intent')
      if (mExam) isExamIntentSystemEnabled.value = mExam.isEnabled
      const mJc = mods.find(m => m.id === 'junior_college')
      if (mJc) isJuniorCollegeSystemEnabled.value = mJc.isEnabled
      const mRollbook = mods.find(m => m.id === 'rollbook')
      if (mRollbook) isRollbookSystemEnabled.value = mRollbook.isEnabled
      const mStat = mods.find(m => m.id === 'stat')
      if (mStat) isStatSystemEnabled.value = mStat.isEnabled
    }
  } catch (e) {}
  fetchSchoolName()
  isPortalLoading.value = true
  try {
    await Promise.all([
      loadPrincipalStatus(),
      (async () => {
        const jcEnabled = await checkJuniorCollegeSystemEnabled()
        const mJc = suiteModules.value.find(m => m.id === 'junior_college')
        isJuniorCollegeSystemEnabled.value = mJc ? mJc.isEnabled : jcEnabled
      })(),
      (async () => {
        const examEnabled = await checkExamIntentSystemEnabled()
        const mExam = suiteModules.value.find(m => m.id === 'exam_intent')
        isExamIntentSystemEnabled.value = mExam ? mExam.isEnabled : examEnabled
      })(),
      (async () => {
        const statEnabled = await isKcueStatSystemEnabled()
        const mStat = suiteModules.value.find(m => m.id === 'stat')
        isStatSystemEnabled.value = mStat ? mStat.isEnabled : statEnabled
        if (isStatSystemEnabled.value) {
          try {
            const sheetId = await getKcueSheetId()
            if (sheetId) {
              preloadStatCipher(sheetId)
            }
          } catch (e) {}
        }
      })(),
      (async () => {
        const status = await checkRuralSystemOpenStatus()
        const mRural = suiteModules.value.find(m => m.id === 'rural')
        isRuralSystemEnabled.value = mRural ? mRural.isEnabled : (status.isEnabled === true)
        isRuralSystemOpen.value = status.isOpen
        activeRuralTerm.value = status.activeTerm
        ruralClosedReason.value = status.reason
        ruralPeriodState.value = status.periodState || 'open'
        ruralStatusText.value = status.statusText || '🟢 접수 진행 중 (수시)'

        if (auth.isStudent) {
          const studentId = auth.user?.id || auth.userId || auth.studentId
          const sCode = auth.studentCode ? String(auth.studentCode).trim() : null
          const list = await getRuralEligibilityList()
          const myInfo = list.find(s =>
            (studentId && (s.id === studentId || s.user_id === studentId)) ||
            (sCode && s.student_code && String(s.student_code).trim() === sCode)
          )

          if (myInfo) {
            const elig = myInfo.eligibility
            const isEligible = Boolean(myInfo.is_rural_eligible || elig?.is_eligible || elig?.is_manual_approved)
            isRuralEligible.value = isEligible
            studentApplyRural.value = isEligible
          } else {
            isRuralEligible.value = false
            studentApplyRural.value = false
          }
        } else {
          isRuralEligible.value = true
          studentApplyRural.value = true
        }
      })()
    ])
  } catch (e) {
    console.warn('Failed to load portal data:', e)
    isRuralEligible.value = false
  } finally {
    isPortalLoading.value = false
  }
})
</script>
