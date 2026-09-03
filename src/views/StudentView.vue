<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 font-sans transition-colors duration-300">
    <!-- 네비게이션 바 -->
    <header class="bg-white/90 border-b border-slate-200/80 sticky top-0 z-50 shadow-sm backdrop-blur-md">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div class="flex flex-col leading-tight">
            <span class="text-[11px] font-extrabold text-blue-600 tracking-tight">{{ schoolName }}</span>
            <h1 class="text-base font-bold text-slate-900 m-0">학교장 추천 전형 신청</h1>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-bold text-slate-700 dark:text-slate-200">
              {{ auth.studentName }} 
              <span class="text-xs font-medium text-slate-400 dark:text-slate-500">
                ({{ auth.isEnrolled ? `${auth.grade ?? (auth.studentCode?.length === 5 ? parseInt(auth.studentCode.substring(0, 1)) : 3)}학년 ${auth.classNo ?? (auth.studentCode?.length === 5 ? parseInt(auth.studentCode.substring(1, 3)) : '')}반 ${auth.seqNo ?? (auth.studentCode?.length === 5 ? parseInt(auth.studentCode.substring(3, 5)) : '')}번` : `${auth.gradYear}년 졸업생` }})
              </span>
            </p>
            <p class="text-xs text-slate-400 font-semibold">학번: {{ auth.studentCode }}</p>
          </div>
          <button
            @click="showMyPageModal = true"
            class="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
          >👤 마이페이지</button>
          <button
            @click="router.push('/select-system')"
            class="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 px-3.5 py-2 rounded-lg transition-all cursor-pointer"
          >🏠 포털 이동</button>
          <button
            @click="handleLogout"
            class="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-3.5 py-2 rounded-lg transition-all cursor-pointer"
          >로그아웃</button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 왼쪽: 내 신청 현황 -->
      <section class="lg:col-span-2 flex flex-col gap-6">

        <!-- 💡 학교장 추천전형 지원 안내 및 지원 전략 가이드 -->
        <div class="bg-linear-to-br from-blue-50 to-indigo-50/60 dark:from-slate-800 dark:to-slate-800/90 rounded-2xl p-5 border border-blue-200/80 dark:border-blue-900/40 shadow-sm space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold shadow-sm">💡</span>
              <h3 class="text-base font-bold text-slate-900 dark:text-white m-0">학교장 추천전형 지원 안내 및 전략 가이드</h3>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                📅 수시 원서 접수 기간: <strong class="text-blue-600 dark:text-blue-400">{{ susiApplyPeriodDisplay }}</strong>
              </span>
              <span class="text-xs font-extrabold text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                {{ totalRounds === 1 ? '★ 학교장 추천 선발 안내' : '★ 1차 추천 선발 적극 지원 유효' }}
              </span>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-blue-100 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
            <p class="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 text-xs m-0">
              <span class="text-sm">🎯</span> {{ totalRounds === 1 ? '학교장 추천 선발 신청 안내' : '1차 추천 선발 적극 지원의 법칙 (가장 중요)' }}
            </p>
            <p v-if="totalRounds === 1" class="leading-relaxed pl-5 text-slate-600 dark:text-slate-300 m-0">
              <strong>희망하시는 대학을 빠짐없이 미리 신청하시는 것이 가장 유리합니다!</strong><br />
              교내 심의 및 성적 기준에 따라 <strong>[추천 확정](합격)</strong>을 받은 학생의 자리는 100% 안전하게 확정 보호됩니다.
            </p>
            <p v-else class="leading-relaxed pl-5 text-slate-600 dark:text-slate-300 m-0">
              <strong>1차 추천 선발에 희망하는 대학을 빠짐없이 미리 신청하시는 것이 가장 유리합니다!</strong><br />
              1차 라운드에서 <strong>[추천 확정](합격)</strong>을 받은 학생의 자리는 2차 추천 선발이 열려 성적이 더 우수한 학생이 추가 지원하더라도 <strong>절대로 박탈되거나 취소되지 않으며 100% 안전하게 보호</strong>됩니다.
            </p>
          </div>

          <!-- 단일 선발(1회)인 경우 1개 안내 카드, 다차 선발인 경우 3개 카드 -->
          <div v-if="totalRounds === 1" class="grid grid-cols-1 gap-2.5 text-xs">
            <div class="p-3 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/50">
              <p class="font-bold text-slate-800 dark:text-slate-200 mb-1">1️⃣ 추천 희망자 접수 및 최종 선발</p>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0">
                주요 대학 추천 희망자 접수 및 교내 추천 심의 기준에 따라 최종 추천자를 확정합니다.
              </p>
            </div>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            <div class="p-3 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/50">
              <p class="font-bold text-slate-800 dark:text-slate-200 mb-1">1️⃣ 1차 추천 선발 (메인 선발)</p>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0">
                주요 대학 추천 희망자 접수 및 1차 추천자 확정 (합격자 기득권 완전 보장)
              </p>
            </div>
            <div class="p-3 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/50">
              <p class="font-bold text-slate-800 dark:text-slate-200 mb-1">2️⃣ 2차 추천 선발 (잔여 정원)</p>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0">
                1차 합격자를 제외한 <strong>남은 정원(잔여 T/O)</strong>에 대해서만 2차 신청자 간 성적순 경쟁
              </p>
            </div>
            <div class="p-3 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/50">
              <p class="font-bold text-slate-800 dark:text-slate-200 mb-1">3️⃣ 3차 추천 선발 (최종 선정)</p>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0">
                추가 모집 및 잔여 모집단위 최종 접수 및 마무리 선발
              </p>
            </div>
          </div>

          <div class="text-[11px] text-slate-500 dark:text-slate-400 pt-2 flex items-center justify-between border-t border-blue-100 dark:border-slate-700/50">
            <span v-if="totalRounds === 1">🛡️ <strong>포기자 발생 시</strong>: 확정된 학생이 포기서를 제출할 경우 수동/추가 조정을 거쳐 공석이 처리됩니다.</span>
            <span v-else>🛡️ <strong>포기자 발생 시</strong>: 1차 합격자가 포기서를 제출한 경우에만 해당 빈자리가 다음 차수 잔여 정원으로 이월됩니다.</span>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm relative overflow-hidden">
          <h2 class="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-600 rounded-full"></span>
            나의 추천 희망 신청서 내역
          </h2>

          <div v-if="loading" class="py-12 text-center text-slate-400">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500/20 border-t-blue-600 mb-2"></div>
            <p class="text-sm">데이터 불러오는 중…</p>
          </div>

          <div v-else-if="myApplications.length === 0" class="py-16 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <svg class="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-sm font-semibold">이번 학년도에 신청한 전형 내역이 없습니다.</p>
            <p class="text-xs mt-1 text-slate-400">우측 폼을 작성하여 추천 선정을 신청해 주세요.</p>
          </div>

          <!-- 통합 인쇄 버튼 (신청 내역이 있을 때만 표시) -->
          <div v-if="myApplications.length > 0" class="flex items-start justify-between gap-3 p-3 mb-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/30">
            <div class="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
              <strong>📄 신청서 인쇄 안내</strong><br>
              모든 추천 전형 신청을 완료한 후, 아래 버튼을 눌러 신청서를 1장으로 인쇄하여 제출하세요.
            </div>
            <button
              @click="handlePrint()"
              class="shrink-0 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg cursor-pointer border-none transition-all whitespace-nowrap"
            >🖨️ 신청서 인쇄</button>
          </div>

          <div v-else-if="!loading" class="py-0"></div>

          <div v-if="myApplications.length > 0" class="flex flex-col gap-4">
            <!-- 3회 추천 제한 안내 경고배너 -->
            <div v-if="myApplications.filter(ap => ap.is_recommended).length >= 3" class="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 p-4 rounded-xl text-xs font-semibold leading-relaxed flex gap-2">
              <span class="text-base">⚠️</span>
              <span>
                <strong>추천 한도 도달 안내:</strong> 경합 시 최대 3개까지만 학교장 추천 확정을 받을 수 있습니다. 
                현재 추천 완료 건수가 3건 이상이므로 추가 추천은 제한될 수 있습니다.
              </span>
            </div>

            <div v-for="ap in myApplications" :key="ap.id" class="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-blue-400 dark:hover:border-blue-500 transition-all bg-white dark:bg-slate-800">
              <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-2">
                    {{ ap.round }}차 접수
                  </span>
                  <strong class="text-base text-slate-800 dark:text-white">{{ ap.universities.univ_name }}</strong>
                  <span class="text-sm text-slate-400 dark:text-slate-500 ml-2">[{{ ap.universities.track_name }}] {{ ap.department_name }}</span>
                </div>
                
                <!-- 추천 상태 배지 -->
                <div class="flex items-center gap-1.5">
                  <span v-if="ap.is_abandoned" class="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400">{{ ap.abandoned_round || ap.round }}차 포기 완료</span>
                  <span v-else-if="getAbandonRequest(ap)" class="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400">⚠️ {{ ap.round }}차 포기 신청 접수중</span>
                  <span v-else-if="ap.is_excluded" class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400" :title="'부적합 사유: ' + ap.excluded_reason">{{ ap.round }}차 미선발 (원 {{ ap.original_rank }}위)</span>
                  <span v-else-if="ap.is_recommended" class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400">{{ ap.recommended_round || ap.round }}차 추천 확정</span>
                  <span v-else class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-500 dark:bg-amber-950/20 dark:text-amber-400">심의 대기</span>
                </div>
              </div>

              <!-- 요약 사항 -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <div><span class="text-slate-400">수능 최저:</span> {{ ap.universities.csat_min }}</div>
                <div><span class="text-slate-400">학부모명:</span> {{ ap.parent_name }}</div>
                <div><span class="text-slate-400">내신 총점:</span> <span class="font-semibold text-slate-700 dark:text-slate-300">{{ ap.manual_score ? ap.manual_score + '점' : '미입력' }}</span></div>
                <div class="text-right flex items-center justify-end gap-2 flex-wrap">
                  <a v-if="ap.student_signature_url" :href="ap.student_signature_url" target="_blank" class="text-blue-500 hover:underline font-bold whitespace-nowrap">학생 서명 확인</a>
                  <a v-if="ap.parent_signature_url || ap.student_signature_url" :href="ap.parent_signature_url || ap.student_signature_url" target="_blank" class="text-blue-500 hover:underline font-bold whitespace-nowrap">학부모 서명 확인</a>
                </div>
              </div>

              <!-- 추천 선발 접수 중인 경우에만 지원 취소(삭제) 가능 -->
              <div v-if="ap.round_status === 'OPEN' && !ap.is_recommended" class="flex justify-end mt-3">
                <button
                  @click="handleCancelApplication(ap.id)"
                  :disabled="submitLoading"
                  class="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/30 transition-all cursor-pointer"
                >희망원 취소 (삭제)</button>
              </div>

              <!-- 접수 기간 지난 후 추천확정된 건에 대해 포기 신청 지원 -->
              <div v-if="(ap.round_status === 'CLOSED' || ap.round_status === 'FINALIZED') && ap.is_recommended && !ap.is_abandoned" class="flex justify-end gap-2 mt-3 items-center">
                <template v-if="getAbandonRequest(ap)">
                  <span class="text-xs font-semibold text-rose-600 flex items-center gap-1 leading-tight">
                    ⚠️ 포기 신청 완료<br /><span class="text-rose-500">(학교 방문 후 인쇄한 포기원 서류를 직접 제출해야 합니다!)</span>
                  </span>
                  <button
                    @click="printAbandonForm(ap)"
                    class="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 transition-all cursor-pointer"
                  >📄 포기원 재출력</button>
                </template>
                <button
                  v-else
                  @click="openAbandonRequestModal(ap)"
                  :disabled="!isSusiApplyPeriodActive"
                  :class="isSusiApplyPeriodActive ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/10 cursor-pointer' : 'text-slate-400 bg-slate-100 opacity-60 cursor-not-allowed dark:bg-slate-800'"
                  class="text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/30 transition-all"
                  :title="!isSusiApplyPeriodActive ? `수시 원서 접수 기간(${susiApplyPeriodDisplay})에만 포기원을 신청할 수 있습니다.` : ''"
                >
                  {{ isSusiApplyPeriodActive ? '🚫 추천 포기 신청' : '🔒 추천 포기 신청 (접수 마감)' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 오른쪽: 신청 폼 양식 -->
      <section class="lg:col-span-1">
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm sticky top-24">
          <h2 class="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-600 rounded-full"></span>
            추천 희망서 제출
          </h2>

          <div v-if="roundsLoading" class="py-6 text-center text-slate-400">
            <p class="text-xs">현재 진행중인 신청 차수 확인 중…</p>
          </div>

          <div v-else-if="!currentRound" class="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 p-4 rounded-xl text-xs leading-relaxed text-center">
            🔒 <strong>현재 진행 중인 신청 차수가 없습니다.</strong><br>
            관리자가 신규 추천 추천 선발을 개시할 때까지 신청서를 제출할 수 없습니다.
          </div>

          <form v-else @submit.prevent="prepareApply" class="flex flex-col gap-4">
            <div
              class="p-3 rounded-lg text-xs font-semibold flex justify-between items-center transition-colors"
              :class="{
                'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30': currentRoundStatus === 'OPEN',
                'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30': currentRoundStatus === 'CLOSED',
                'bg-purple-50 dark:bg-purple-950/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-900/30': currentRoundStatus === 'FINALIZED',
                'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800': currentRoundStatus === 'DRAFT'
              }"
            >
              <span v-if="currentRoundStatus === 'OPEN'">
                🟢 현재 접수 중: {{ totalRounds === 1 ? '학교장 추천' : `${currentRound}차 추천` }} 신청
              </span>
              <span v-else-if="currentRoundStatus === 'CLOSED'">
                🔒 접수 마감: {{ totalRounds === 1 ? '학교장 추천' : `${currentRound}차 추천` }} 신청 접수가 마감되었습니다 (심사 진행 중)
              </span>
              <span v-else-if="currentRoundStatus === 'FINALIZED'">
                🔒 선발 마감: {{ totalRounds === 1 ? '학교장 추천' : `${currentRound}차 추천` }} 선발이 최종 마감되었습니다
              </span>
              <span v-else>
                ⏳ 접수 대기 중: {{ totalRounds === 1 ? '학교장 추천' : `${currentRound}차 추천` }} 신청 시작 전입니다
              </span>

              <!-- 추천서 HWP 양식 다운로드 링크 (임시 숨김 — 필요 시 v-if="true"로 변경 가능) -->
              <a
                v-if="false"
                :href="`${baseUrl}data/2027%ED%95%99%EB%85%84%EB%8F%84%20%ED%95%99%EA%B5%90%EC%9E%A5%EC%B6%94%EC%B2%9C%EC%A0%84%ED%98%95%20%EC%84%A0%EC%A0%95%20%EC%8B%A0%EC%B2%AD%EC%84%9C_%EC%96%91%EC%8B%9D.hwp`"
                download
                class="text-blue-600 dark:text-blue-400 hover:underline font-bold text-[10px] cursor-pointer whitespace-nowrap ml-2"
              >
                📝 신청서 양식 (HWP)
              </a>
            </div>

            <!-- 대학 및 전형 선택 -->
            <div>
              <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">지원 대학</label>
              <select
                v-model="selectedUnivId"
                :disabled="!isSubmissionActive"
                required
                class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700 bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
                @change="onUnivChange"
              >
                <option value="">대학 선택</option>
                <option v-for="u in availableUnivs" :key="u.id" :value="u.id" :disabled="u.is_exhausted">
                  {{ u.univ_name }} ({{ u.track_name }}) {{ u.grad_allowed ? '' : '[재학생 전용]' }}{{ u.is_exhausted ? ' [⚠️ 추천정원 마감 - 지원 불가]' : '' }}
                </option>
              </select>

              <!-- 전체 요강 보기 버튼 -->
              <div class="mt-1.5 text-right">
                <button
                  type="button"
                  @click="showRegionalModal = true"
                  class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline bg-transparent border-none cursor-pointer p-0"
                >
                  📖 2027 학교장추천전형 요강 전체보기
                </button>
              </div>

              <!-- 선택한 대학 지원 현황 및 제한 조건 검토 안내 카드 -->
              <div v-if="selectedUnivInfo" class="mt-3 p-3.5 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/40 text-xs space-y-2.5">
                <div class="flex items-center justify-between font-bold text-blue-900 dark:text-blue-300 border-b border-blue-200/60 dark:border-blue-900/40 pb-2">
                  <span class="flex items-center gap-1.5">
                    <span>📊</span>
                    <span>실시간 지원 현황 및 제출 요건</span>
                  </span>
                  <span class="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-extrabold">
                    접수 진행 가능
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <!-- 인원 제한 검토 -->
                  <div class="bg-white/90 dark:bg-slate-900/60 p-2.5 rounded-lg border border-blue-100 dark:border-slate-800">
                    <span class="block text-[10px] font-bold text-slate-400 mb-0.5">인원 제한 여부</span>
                    <span class="font-bold text-blue-700 dark:text-blue-400">
                      {{ (selectedUnivInfo.has_quota || selectedUnivInfo.quota_limit) ? formatQuotaLimit(selectedUnivInfo.quota_limit) : '제한 없음 (무)' }}
                    </span>
                  </div>

                  <!-- 졸업생 제한 검토 -->
                  <div class="bg-white/90 dark:bg-slate-900/60 p-2.5 rounded-lg border border-blue-100 dark:border-slate-800">
                    <span class="block text-[10px] font-bold text-slate-400 mb-0.5">졸업생 제한 조건</span>
                    <span class="font-bold text-slate-800 dark:text-slate-200">
                      {{ selectedUnivGradCondition }}
                    </span>
                  </div>
                </div>

                <!-- 실시간 신청 현황 (인원수) -->
                <div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/50">
                  <div class="flex items-center gap-2">
                    <span class="text-base">👥</span>
                    <div>
                      <p class="font-bold text-slate-800 dark:text-white m-0 text-xs">
                        현재 실시간 신청자 수:
                        <span class="text-blue-600 dark:text-blue-400 text-sm font-extrabold ml-1">{{ selectedUnivApplicantCount }}명</span>
                      </p>
                      <p class="text-[10px] text-slate-400 m-0 mt-0.5">
                        🔒 개인정보 보호를 위해 신원 정보는 비공개 처리되며 신청 인원수만 제공됩니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 선택한 대학의 상세 요강 안내 카드 -->
              <div v-if="selectedUnivRegionalInfo.length > 0" class="mt-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-blue-200 dark:border-blue-900/40 text-xs space-y-2">
                <div v-for="info in selectedUnivRegionalInfo" :key="info.id || info.seq_no" class="space-y-1.5">
                  <div class="font-bold text-blue-700 dark:text-blue-300 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span>{{ info.univ_name }} - {{ info.track_name }}</span>
                    <span class="text-[11px] text-slate-500 font-normal">구분: <span class="font-semibold text-blue-700 dark:text-blue-300">{{ getCategory(info) || '—' }}</span> (제한: {{ formatQuotaLimit(info.quota_limit) || '—' }})</span>
                  </div>
                  <div v-if="info.grad_condition"><strong class="text-slate-700 dark:text-slate-300">졸업년도조건:</strong> <span class="whitespace-pre-line text-slate-600 dark:text-slate-400">{{ info.grad_condition }}</span></div>
                  <div v-if="info.csat_min"><strong class="text-slate-700 dark:text-slate-300">수능최저:</strong> <span class="whitespace-pre-line text-slate-600 dark:text-slate-400">{{ info.csat_min }}</span></div>
                  <div v-if="info.target_students"><strong class="text-slate-700 dark:text-slate-300">본교지원가능여부:</strong> <span class="whitespace-pre-line text-slate-600 dark:text-slate-400">{{ info.target_students }}</span></div>
                  <div v-if="info.remarks"><strong class="text-slate-700 dark:text-slate-300">사전마감여부:</strong> <span class="whitespace-pre-line text-slate-600 dark:text-slate-400">{{ info.remarks }}</span></div>
                </div>
              </div>
            </div>

            <!-- 지원학과 -->
            <div>
              <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">지원 모집단위 (학과)</label>
              <input
                v-model="departmentName"
                :disabled="!isSubmissionActive"
                type="text"
                required
                placeholder="예: 컴퓨터공학과"
                class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
              />
            </div>

            <!-- 대학별 산출점수 입력 (선택) -->
            <div class="p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40">
              <label class="block text-xs font-bold mb-1 text-amber-800 dark:text-amber-300">대학별 내신 산출점수(선택)</label>
              <p class="text-[11px] text-rose-600 font-bold mb-2 leading-relaxed">※주의: 대학별 모집요강에 표시되어 있는 방법대로 산출점수를 계산하여 표기하되, 잘 모를 경우 빈칸으로 두세요.</p>
              <input
                v-model="univCalcScore"
                :disabled="!isSubmissionActive"
                type="number"
                step="0.01"
                min="0"
                placeholder="예: 2.75"
                class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-slate-900 dark:text-white dark:border-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                style="border: 1px solid #fcd34d; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
              />
            </div>

            <!-- 학부모 인적사항 -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">학부모 이름</label>
                <input
                  v-model="parentName"
                  :disabled="!isSubmissionActive"
                  type="text"
                  required
                  placeholder="예: 홍길동"
                  class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">학부모 연락처</label>
                <input
                  v-model="parentPhone"
                  :disabled="!isSubmissionActive"
                  type="text"
                  required
                  placeholder="010-0000-0000"
                  class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
                />
              </div>
            </div>

            <!-- 서명 패드 (Canvas) -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400">본인 및 보호자 연대 서명</label>
                <button type="button" @click="clearSignatures" :disabled="!isSubmissionActive" class="text-xs text-rose-500 hover:underline cursor-pointer bg-transparent border-none disabled:opacity-50 disabled:cursor-not-allowed">서명 초기화</button>
              </div>

              <!-- 학생 서명 -->
              <div class="mb-3">
                <span class="block text-xs text-slate-400 mb-1">학생 본인 서명</span>
                <canvas
                  ref="studentCanvasRef"
                  class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg cursor-crosshair"
                  height="100"
                  @mousedown="startStudentDraw"
                  @mousemove="studentDraw"
                  @mouseup="stopStudentDraw"
                  @mouseleave="stopStudentDraw"
                  @touchstart="startStudentTouch"
                  @touchmove="studentTouch"
                  @touchend="stopStudentDraw"
                ></canvas>
              </div>

              <!-- 학부모 서명 -->
              <div>
                <span class="block text-xs text-slate-400 mb-1">보호자 (학부모) 서명</span>
                <canvas
                  ref="parentCanvasRef"
                  class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg cursor-crosshair"
                  height="100"
                  @mousedown="startParentDraw"
                  @mousemove="parentDraw"
                  @mouseup="stopParentDraw"
                  @mouseleave="stopParentDraw"
                  @touchstart="startParentTouch"
                  @touchmove="parentTouch"
                  @touchend="stopParentDraw"
                ></canvas>
              </div>
            </div>

            <button
              type="submit"
              :disabled="submitLoading || !isSubmissionActive"
              class="w-full text-sm font-bold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              :style="{
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                background: isSubmissionActive ? '#2563eb' : '#94a3b8',
                color: 'white',
                marginTop: '4px'
              }"
            >
              {{ submitLoading ? '신청 제출 중…' : (isSubmissionActive ? '신청서 제출하기' : '🔒 현재는 추천 희망서 제출 기간이 아닙니다') }}
            </button>
          </form>

          <p v-if="formError" class="text-xs font-semibold text-rose-500 mt-3 bg-rose-50 dark:bg-rose-950/20 p-2 rounded-lg border border-rose-100 dark:border-rose-900/30 text-center">{{ formError }}</p>
          <p v-if="formSuccess" class="text-xs font-semibold text-emerald-500 mt-3 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-center">{{ formSuccess }}</p>
        </div>
    <!-- 2027 학교장추천전형 요강 전체 보기 모달 -->
    <div v-if="showRegionalModal"
      class="fixed inset-0 flex items-center justify-center z-50 p-4"
      style="background: rgba(0,0,0,0.5);"
      @click.self="showRegionalModal = false"
      @keydown.escape.window="showRegionalModal = false"
    >
      <div class="bg-white dark:bg-slate-800 flex flex-col rounded-2xl shadow-xl w-full max-w-5xl h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-700">
        <!-- 헤더 -->
        <div class="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 class="text-base font-bold text-slate-800 dark:text-white">📖 2027학년도 주요 대학 학교장추천전형 (지역균형) 상세 모집요강</h3>
            <p class="text-xs text-slate-400 mt-0.5">원하는 대학이나 계열명을 검색하여 수능최저기준 및 전형방법을 확인하세요.</p>
          </div>
          <button @click="showRegionalModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold bg-transparent border-none cursor-pointer">✕</button>
        </div>

        <!-- 검색바 -->
        <div class="p-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between gap-3">
          <input
            v-model="regionalSearch"
            type="text"
            placeholder="대학명, 전형명, 지역 검색…"
            class="text-xs w-64 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span class="text-xs text-slate-500 font-semibold">총 {{ filteredRegionalRecs.length }}건</span>
        </div>

        <!-- 본문 테이블 -->
        <div class="overflow-x-auto flex-1 p-4">
          <div class="overflow-y-auto h-full max-h-[calc(85vh-130px)]">
            <table class="w-full text-left text-xs" style="border-collapse: separate; border-spacing: 0; min-width: 1000px;">
            <thead class="sticky top-0 bg-slate-100 z-30 border-b border-slate-200 text-slate-600">
              <tr>
                <th class="p-2.5 w-12 text-center sticky left-0 top-0 z-30 bg-slate-100 border-b border-r border-slate-200" style="min-width: 48px; max-width: 48px;">No</th>
                <th class="p-2.5 w-20 sticky left-12 top-0 z-30 bg-slate-100 border-b border-r border-slate-200" style="min-width: 80px; max-width: 80px;">지역</th>
                <th class="p-2.5 w-32 sticky left-32 top-0 z-30 bg-slate-100 border-b border-r border-slate-200" style="min-width: 130px; max-width: 130px;">대학명</th>
                <th class="p-2.5 w-28 border-b border-r border-slate-200">전형구분</th>
                <th class="p-2.5 w-36 border-b border-r border-slate-200">전형명</th>
                <th class="p-2.5 w-28 border-b border-r border-slate-200">인원제한</th>
                <th class="p-2.5 w-32 border-b border-r border-slate-200">졸업년도조건</th>
                <th class="p-2.5 w-44 border-b border-r border-slate-200">수능최저학력기준</th>
                <th class="p-2.5 w-32 border-b border-r border-slate-200">본교지원가능여부</th>
                <th class="p-2.5 w-28 border-b border-slate-200">사전마감여부</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="filteredRegionalRecs.length === 0">
                <td colspan="10" class="text-center py-12 text-slate-400">
                  조건에 일치하는 추천전형 정보가 없습니다.
                </td>
              </tr>
              <tr v-else v-for="r in filteredRegionalRecs" :key="r.id || r.seq_no" class="hover:bg-slate-50 group">
                <td class="p-2.5 text-center font-medium text-slate-400 sticky left-0 z-20 bg-white group-hover:bg-slate-50! border-b border-b-slate-100 border-r border-r-slate-200" style="min-width: 48px; max-width: 48px;">{{ r.seq_no }}</td>
                <td class="p-2.5 text-slate-500 sticky left-12 z-20 bg-white group-hover:bg-slate-50! border-b border-b-slate-100 border-r border-r-slate-200" style="min-width: 80px; max-width: 80px;">{{ r.region }}</td>
                <td class="p-2.5 font-bold text-slate-800 sticky left-32 z-20 bg-white group-hover:bg-slate-50! border-b border-b-slate-100 border-r border-r-slate-200" style="min-width: 130px; max-width: 130px;">{{ r.univ_name }}</td>
                <td class="p-2.5 text-center">
                  <span
                    v-if="getCategory(r) === '교과'"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    교과
                  </span>
                  <span
                    v-else-if="getCategory(r) === '종합'"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                  >
                    종합
                  </span>
                  <span
                    v-else-if="getCategory(r)"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    {{ getCategory(r) }}
                  </span>
                  <span v-else class="text-slate-400">-</span>
                </td>
                <td class="p-2.5 font-semibold text-blue-600 dark:text-blue-400">{{ r.track_name }}</td>
                <td class="p-2.5 text-slate-600 dark:text-slate-400">{{ formatQuotaLimit(r.quota_limit) }}</td>
                <td class="p-2.5 text-slate-600 dark:text-slate-400 whitespace-pre-line">{{ r.grad_condition || '-' }}</td>
                <td class="p-2.5 font-medium text-slate-800 dark:text-slate-200 whitespace-pre-line">{{ r.csat_min || '-' }}</td>
                <td class="p-2.5 text-slate-600 dark:text-slate-400 whitespace-pre-line">{{ r.target_students || '-' }}</td>
                <td class="p-2.5 text-slate-500 whitespace-pre-line">{{ r.remarks || '-' }}</td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>

        <div class="p-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button @click="showRegionalModal = false" class="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-200 rounded-lg cursor-pointer border-none">닫기</button>
        </div>
      </div>
    </div>

    <!-- 📜 학교장추천 대상자 선정 서약 조항 동의 모달 -->
    <div
      v-if="showOathModal"
      class="fixed inset-0 flex items-center justify-center z-50 p-4"
      style="background: rgba(0,0,0,0.6);"
      @click.self="showOathModal = false"
    >
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">
        <!-- 헤더 -->
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <h3 class="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 m-0">
            📜 학교장추천 대상자 선정 서약 동의
          </h3>
          <button @click="showOathModal = false" class="text-slate-400 hover:text-slate-600 text-lg font-bold bg-transparent border-none cursor-pointer">✕</button>
        </div>

        <!-- 본문 -->
        <div class="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700 leading-relaxed text-justify space-y-2">
            <p class="font-bold text-slate-900 dark:text-white text-sm m-0 pb-1 border-b border-slate-200 dark:border-slate-700">
              ■ 학교장추천 대상자 선정 서약 조항
            </p>
            <p class="m-0 pt-1">
              본인은 2027학년도 대학수학능력시험 및 수시 모집에서 대입 학교장추천을 희망하여 신청서를 제출합니다.
            </p>
            <p class="m-0">
              본인은 학교의 학교장추천 심의위원회 규정을 준수하며, 경합이 발생하는 대학의 전형에 대해서는 학교 선발 우선순위 및 내신 성적 기준에 따른 공정한 심사 결과를 겸허히 수용할 것을 엄숙히 서약합니다.
            </p>
            <p class="m-0">
              아울러 추천이 확정된 이후 정당한 사유 없이 임의 포기하여 타 학생의 기회를 박탈하지 않도록 신중하게 행동할 것을 확인합니다.
            </p>
          </div>

          <!-- 동의 체크박스 -->
          <label class="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="agreedOath"
              class="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-blue-400 cursor-pointer"
            />
            <span class="text-xs font-bold text-blue-900 dark:text-blue-200">
              (필수) 위 학교장추천 대상자 선정 서약 조항 내용을 모두 확인하였으며 이에 동의합니다.
            </span>
          </label>
        </div>

        <!-- 하단 버튼 -->
        <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900/50">
          <button
            @click="showOathModal = false"
            class="px-4 py-2 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            취소
          </button>
          <button
            :disabled="!agreedOath || submitLoading"
            @click="confirmApply"
            class="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-sm transition-all cursor-pointer border-none"
          >
            {{ submitLoading ? '제출 중…' : '서약 동의 및 최종 제출' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 🖨️ 학교장추천 신청서 인쇄 모달 -->
    <div
      v-if="showHakchuPrintModal"
      class="fixed inset-0 flex items-center justify-center z-50 p-4"
      style="background: rgba(0,0,0,0.6);"
      @click.self="showHakchuPrintModal = false"
    >
      <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 border border-slate-200 dark:border-slate-700">
        <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mx-auto flex items-center justify-center shadow-xs">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
        </div>

        <div class="space-y-1.5 text-center">
          <h3 class="text-xl font-extrabold text-slate-900 dark:text-white m-0">
            학교장추천전형 신청서 인쇄
          </h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed m-0">
            인쇄물 서명란 아래에 표기될 학생 및 보호자 연락처를 확인해 주세요.
          </p>
        </div>

        <!-- 연락처 입력 폼 -->
        <div class="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-3 text-xs">
          <p class="font-extrabold text-slate-800 dark:text-slate-200 m-0 flex items-center gap-1.5 text-xs">
            📞 인쇄용 연락처 입력 (서명란 아래에 출력)
          </p>
          <div class="space-y-2.5">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">학생 연락처</label>
              <input
                v-model="hakchuStudentPhone"
                type="text"
                placeholder="예: 010-1234-5678"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">비상용 연락처 (학부모/보호자)</label>
              <input
                v-model="hakchuParentPhone"
                type="text"
                placeholder="예: 010-9876-5432"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button
            @click="showHakchuPrintModal = false"
            class="flex-1 py-3 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all cursor-pointer border border-slate-300 dark:border-slate-600"
          >
            취소
          </button>
          <button
            @click="executeHakchuPrint"
            class="flex-1 py-3 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md cursor-pointer border-none flex items-center justify-center gap-1.5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            인쇄하기
          </button>
        </div>
      </div>
    </div>
      </section>
    </main>
    <!-- 추천 포기 신청 모달 -->
    <div v-if="showAbandonModal"
      class="fixed inset-0 flex items-center justify-center z-50 p-4"
      style="background: rgba(0,0,0,0.5);"
    >
      <div class="bg-white dark:bg-slate-800 flex flex-col rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <!-- 헤더 -->
        <div class="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 class="text-base font-bold text-slate-800 dark:text-white m-0">🚫 학교장추천전형 추천 포기 신청</h3>
            <p class="text-xs text-slate-400 mt-0.5 m-0">추천 포기 사유를 작성하고 학생/보호자 연대 서명을 진행하세요.</p>
          </div>
          <button @click="closeAbandonModal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold bg-transparent border-none cursor-pointer">✕</button>
        </div>

        <!-- 본문 -->
        <div class="p-5 flex flex-col gap-4 overflow-y-auto max-h-[60vh] text-xs">
          <div class="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200/60 space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div class="flex justify-between"><span class="text-slate-400 font-semibold">포기 대상 대학:</span> <span class="font-bold text-slate-800 dark:text-white">{{ abandonTargetApp?.universities.univ_name }}</span></div>
            <div class="flex justify-between"><span class="text-slate-400 font-semibold">지원 전형:</span> <span class="font-bold text-slate-800 dark:text-white">{{ abandonTargetApp?.universities.track_name }}</span></div>
            <div class="flex justify-between"><span class="text-slate-400 font-semibold">지원 학과:</span> <span class="font-bold text-slate-800 dark:text-white">{{ abandonTargetApp?.department_name }}</span></div>
          </div>

          <!-- ⚠️ 재지원 불가 경고 안내 -->
          <div class="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-semibold leading-relaxed flex items-start gap-2.5">
            <span class="text-sm shrink-0">⚠️</span>
            <div>
              <strong class="text-rose-800 dark:text-rose-200">주의 (동일 전형 재지원 불가 안내)</strong><br />
              추천 포기 신청서를 제출하여 포기 처리되는 경우, <strong class="underline decoration-rose-400 font-extrabold text-rose-900 dark:text-rose-100">동일 대학의 동일 전형에는 다시 재지원할 수 없음</strong>을 유의하여 신청해 주세요.
            </div>
          </div>

          <!-- 포기사유 -->
          <div class="space-y-1">
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400">포기 사유 (상세) <span class="text-rose-500">*</span></label>
            <textarea
              v-model="abandonReason"
              required
              rows="3"
              placeholder="예: 다른 학교 지원을 위한 추천 포기 신청"
              class="w-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
            ></textarea>
          </div>

          <!-- 서명 영역 -->
          <div class="space-y-3">
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400">포기원 연대 서명</label>
              <button type="button" @click="clearAbandonSignatures" class="text-xs text-rose-500 hover:underline cursor-pointer bg-transparent border-none">서명 초기화</button>
            </div>

            <!-- 학생 서명 -->
            <div class="space-y-1">
              <span class="block text-[11px] text-slate-400">학생 본인 서명</span>
              <canvas
                ref="abandonStudentCanvasRef"
                class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg cursor-crosshair"
                height="100"
                @mousedown="startAbandonStudentDraw"
                @mousemove="abandonStudentDraw"
                @mouseup="stopAbandonStudentDraw"
                @mouseleave="stopAbandonStudentDraw"
                @touchstart="startAbandonStudentTouch"
                @touchmove="abandonStudentTouch"
                @touchend="stopAbandonStudentDraw"
              ></canvas>
            </div>

            <!-- 학부모 서명 -->
            <div class="space-y-1">
              <span class="block text-[11px] text-slate-400">보호자 (학부모) 서명</span>
              <canvas
                ref="abandonParentCanvasRef"
                class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg cursor-crosshair"
                height="100"
                @mousedown="startAbandonParentDraw"
                @mousemove="abandonParentDraw"
                @mouseup="stopAbandonParentDraw"
                @mouseleave="stopAbandonParentDraw"
                @touchstart="startAbandonParentTouch"
                @touchmove="abandonParentTouch"
                @touchend="stopAbandonParentDraw"
              ></canvas>
            </div>
          </div>
        </div>

        <!-- 푸터 -->
        <div class="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 flex justify-end gap-2">
          <button
            @click="closeAbandonModal"
            class="text-xs font-semibold text-slate-500 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer px-4 py-2"
          >취소</button>
          <button
            @click="openAbandonConfirm"
            :disabled="abandonSubmitLoading"
            class="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg border-none cursor-pointer px-4 py-2 disabled:opacity-50"
          >
            {{ abandonSubmitLoading ? '제출 중...' : '포기 서류 제출 및 출력' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ✅ 포기 최종 확인 모달 -->
    <div v-if="showAbandonConfirm"
      class="fixed inset-0 flex items-center justify-center z-60 p-4"
      style="background: rgba(0,0,0,0.65); backdrop-filter: blur(2px);"
    >
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-rose-300 dark:border-rose-700">
        <!-- 헤더 -->
        <div class="p-5 bg-rose-600 text-white">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🚨</span>
            <div>
              <h3 class="text-base font-extrabold m-0 leading-tight">최종 포기 확인</h3>
              <p class="text-xs text-rose-100 m-0 mt-0.5 font-normal">아래 내용을 반드시 확인하고 동의해 주세요.</p>
            </div>
          </div>
        </div>

        <!-- 본문 경고 -->
        <div class="p-5 flex flex-col gap-4">
          <div class="rounded-xl border-2 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-4 space-y-3 text-sm text-rose-800 dark:text-rose-200">
            <div class="flex items-start gap-2">
              <span class="text-base shrink-0 mt-0.5">⛔</span>
              <p class="m-0 leading-relaxed">
                <strong>포기는 절대 되돌릴 수 없습니다.</strong><br />
                포기 처리가 완료되면 취소가 불가능하며, 담임교사 및 관리자가 처리를 진행하게 됩니다.
              </p>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-base shrink-0 mt-0.5">🖨️</span>
              <p class="m-0 leading-relaxed">
                <strong>포기원은 반드시 직접 출력하여 학교에 제출해야 합니다.</strong><br />
                온라인 제출만으로는 효력이 없으며, 출력된 서류를 직접 학교에 제출해야 포기 처리가 완료됩니다.
              </p>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-base shrink-0 mt-0.5">🔒</span>
              <p class="m-0 leading-relaxed">
                <strong>동일 대학·동일 전형에는 재지원할 수 없습니다.</strong><br />
                포기 후에는 해당 대학의 해당 전형으로 다시 지원하는 것이 불가능합니다.
              </p>
            </div>
          </div>

          <!-- 동의 체크박스 -->
          <label class="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
            <input
              type="checkbox"
              v-model="abandonConfirmChecked"
              class="mt-0.5 h-4 w-4 accent-rose-600 shrink-0 cursor-pointer"
            />
            <span class="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
              위 내용을 모두 확인하였으며, 포기 신청이 되돌릴 수 없음에 동의합니다.
            </span>
          </label>
        </div>

        <!-- 버튼 -->
        <div class="px-5 pb-5 flex gap-3 justify-end">
          <button
            @click="closeAbandonConfirm"
            class="text-sm font-semibold text-slate-500 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer px-5 py-2.5"
          >취소 (돌아가기)</button>
          <button
            @click="submitAbandonRequest"
            :disabled="!abandonConfirmChecked || abandonSubmitLoading"
            class="text-sm font-extrabold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed rounded-lg border-none cursor-pointer px-5 py-2.5 transition-colors"
          >
            {{ abandonSubmitLoading ? '처리 중...' : '🚨 포기 확인 및 서류 출력' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 학생 마이페이지 모달 (학교장 추천 시스템에서 대입 희망 전형 설정/수정) -->
    <div
      v-if="showMyPageModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-slate-100 rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 class="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
            👤 학생 마이페이지 (대입 희망 전형 설정 및 자격 서약)
          </h3>
          <button
            @click="showMyPageModal = false"
            class="text-slate-400 hover:text-slate-600 font-bold text-xl bg-transparent border-none cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
        <Suspense>
          <RuralMyPageTab />
          <template #fallback>
            <div class="py-12 text-center text-slate-400">마이페이지 로딩 중...</div>
          </template>
        </Suspense>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const baseUrl = import.meta.env.BASE_URL || '/'

import RuralMyPageTab from '../components/rural/RuralMyPageTab.vue'
const showMyPageModal = ref(false)
import { supabase } from '../utils/supabaseClient'
import { schoolName, fetchSchoolName } from '../utils/schoolConfig'
import { printApplicationForm } from '../utils/printTemplates'
import { getDisclosureCount } from '../api/admin.js'
import { fetchRoundSchedulesMap, computeRoundDisplayStatus } from '../utils/roundSchedule'
import { deleteApplicationStorageFiles } from '../utils/storageUtils'
import { dialog } from '../components/common/dialog.js'
import { isUndecidedDepartment } from '../utils/departmentValidation.js'

const router = useRouter()
const auth = useAuthStore()

const myApplications = ref([])
const availableUnivs = ref([])
const totalRounds = ref(3)
const currentRound = ref(null)
const currentRoundStatus = ref('CLOSED')

const isSubmissionActive = computed(() => {
  return currentRound.value !== null && currentRoundStatus.value === 'OPEN'
})

const loading = ref(true)
const roundsLoading = ref(true)
const submitLoading = ref(false)

const formError = ref(null)
const formSuccess = ref(null)

// 폼 입력 필드
const selectedUnivId = ref('')
const departmentName = ref('')
const parentName = ref('')
const parentPhone = ref('')
const univCalcScore = ref('')

// 서약 동의 팝업 모달
const showOathModal = ref(false)
const agreedOath = ref(false)

// 학교장추천 신청서 인쇄 모달
const showHakchuPrintModal = ref(false)
const hakchuStudentPhone = ref('')
const hakchuParentPhone = ref('')

// 학생 서명 캔버스
const studentCanvasRef = ref(null)
let studentCtx = null
let studentDrawing = false

// 학부모 서명 캔버스
const parentCanvasRef = ref(null)
let parentCtx = null
let parentDrawing = false

// 추천 포기 신청 관련 상태 변수
const showAbandonModal = ref(false)
const abandonTargetApp = ref(null)
const abandonReason = ref('')
const abandonSubmitLoading = ref(false)
const showAbandonConfirm = ref(false)
const abandonConfirmChecked = ref(false)
const abandonStudentCanvasRef = ref(null)
const abandonParentCanvasRef = ref(null)

// 수시 원서 접수 기간 (포기원 제출 기간)
const susiApplyStartDate = ref('')
const susiApplyEndDate = ref('')

const isSusiApplyPeriodActive = computed(() => {
  if (!susiApplyEndDate.value) return true
  const today = new Date().toISOString().split('T')[0]
  return today <= susiApplyEndDate.value
})

const susiApplyPeriodDisplay = computed(() => {
  if (!susiApplyEndDate.value) return '상시 가능'
  if (susiApplyStartDate.value) return `${susiApplyStartDate.value} ~ ${susiApplyEndDate.value}`
  return `~ ${susiApplyEndDate.value} (마감)`
})

let abandonStudentCtx = null
let abandonParentCtx = null
let abandonStudentDrawing = false
let abandonParentDrawing = false

function getAbandonRequest(ap) {
  if (!ap.scanned_doc_url) return null
  try {
    const parsed = JSON.parse(ap.scanned_doc_url)
    if (parsed && parsed.abandon_requested) return parsed
  } catch {}
  return null
}

// 수도권 학교장추천전형 (regional_recommendations) 데이터
const regionalRecs = ref([])
const showRegionalModal = ref(false)
const regionalSearch = ref('')
const disclosureCount = ref(null)  // 정보공시 재학생 수 (% 인원제한 환산용)

/**
 * quota_limit 값을 표시용 문자열로 변환합니다.
 * - % 형태 ("3%", "0.03") → disclosureCount 설정 시: "10명 (3%)"
 *                         → 미설정 시: "3%" (원문 그대로)
 * - 일반 숫자/텍스트 → 그대로 반환
 */
function formatQuotaLimit(rawVal) {
  if (rawVal == null || rawVal === '') return ''
  const str = String(rawVal).trim()
  if (!str) return ''

  const num = parseFloat(str)
  let pct = null

  if (!isNaN(num) && num > 0 && num < 1) {
    pct = num * 100
  } else {
    const pctMatch = str.match(/^(\d+(?:\.\d+)?)\s*%$/)
    if (pctMatch) pct = parseFloat(pctMatch[1])
  }

  if (pct !== null) {
    const pctClean = parseFloat(pct.toPrecision(10))
    if (disclosureCount.value != null && disclosureCount.value > 0) {
      const count = Math.ceil(disclosureCount.value * pct / 100)
      return `${count}명 (${pctClean}%)`
    }
    return `${pctClean}%`
  }

  // 일반 텍스트
  return str
}

function getCategory(r) {
  if (!r) return ''
  return String(r.recruitment_quota || r.track_type || '').trim()
}
const getCategoryDisplay = getCategory

const selectedUnivRegionalInfo = computed(() => {
  if (!selectedUnivId.value) return []
  const univ = availableUnivs.value.find(u => u.id === selectedUnivId.value)
  if (!univ) return []
  return regionalRecs.value.filter(r => 
    r.univ_name && univ.univ_name && 
    (r.univ_name.trim().toLowerCase() === univ.univ_name.trim().toLowerCase() ||
     r.univ_name.trim().includes(univ.univ_name.trim()) ||
     univ.univ_name.trim().includes(r.univ_name.trim()))
  )
})

const filteredRegionalRecs = computed(() => {
  if (!regionalSearch.value.trim()) return regionalRecs.value
  const kw = regionalSearch.value.trim().toLowerCase()
  return regionalRecs.value.filter(r => 
    (r.univ_name && r.univ_name.toLowerCase().includes(kw)) ||
    (r.track_name && r.track_name.toLowerCase().includes(kw)) ||
    (r.region && r.region.toLowerCase().includes(kw))
  )
})

const applicantCountsMap = ref({})

const selectedUnivInfo = computed(() => {
  if (!selectedUnivId.value) return null
  return availableUnivs.value.find(u => u.id === selectedUnivId.value) || null
})

const selectedUnivApplicantCount = computed(() => {
  if (!selectedUnivId.value) return 0
  return applicantCountsMap.value[selectedUnivId.value] || 0
})

const selectedUnivGradCondition = computed(() => {
  if (!selectedUnivInfo.value) return ''
  if (selectedUnivInfo.value.grad_allowed === false) return '재학생 전용 (졸업생 지원 불가)'

  if (selectedUnivRegionalInfo.value && selectedUnivRegionalInfo.value.length > 0) {
    const rInfo = selectedUnivRegionalInfo.value.find(r => r.grad_condition)
    if (rInfo && rInfo.grad_condition) return rInfo.grad_condition
  }
  return selectedUnivInfo.value.grad_condition || '졸업생 지원 가능 (유)'
})

// 데이터 로드
async function loadData() {
  loading.value = true
  try {
    if (!supabase) return

    // 1. 사용자 ID 획득 (Auth 유저 또는 fallback 학생 세션)
    const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
    const userId = userData?.user?.id || (auth.token?.startsWith('student_') ? auth.token.split('_')[1] : null)

    if (userId) {
      const { data: apps, error: err1 } = await supabase
        .from('applications')
        .select('*, universities(*)')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })

      if (!err1 && apps) {
        const { data: rounds } = await supabase.from('timeline_rounds').select('*')
        const roundsMap = {}
        rounds?.forEach(r => {
          roundsMap[r.id] = r.status
        })

        myApplications.value = apps.map(ap => ({
          ...ap,
          round_status: roundsMap[ap.round] || 'OPEN'
        }))
      }
    }

    // 2. 수도권 학교장추천전형 (regional_recommendations) 목록 우선 로드
    const { data: regRecs } = await supabase
      .from('regional_recommendations')
      .select('*')
      .order('seq_no', { ascending: true })

    regionalRecs.value = regRecs || []

    // 3. 지원 가능한 대학 목록 로드 및 추천인원 마감 여부 집계
    const { data: univs, error: err2 } = await supabase
      .from('universities')
      .select('*')
      .order('univ_name', { ascending: true })

    // 이미 최종 확정(마감)된 라운드 ID 목록 조회
    const { data: finalizedRounds } = await supabase
      .from('timeline_rounds')
      .select('id')
      .eq('status', 'FINALIZED')

    const finalizedRoundIds = (finalizedRounds || []).map(r => r.id)

    // 최종 확정된 라운드에서 추천 확정된 건수만 조회
    let recommendedApps = []
    if (finalizedRoundIds.length > 0) {
      const { data: apps } = await supabase
        .from('applications')
        .select('univ_id')
        .eq('is_recommended', true)
        .eq('is_abandoned', false)
        .in('round', finalizedRoundIds)
      recommendedApps = apps || []
    }

    const recCounts = {}
    recommendedApps.forEach(ap => {
      recCounts[ap.univ_id] = (recCounts[ap.univ_id] || 0) + 1
    })

    function getQuotaLimitNumber(u) {
      if (!u.has_quota || !u.quota_limit) return null
      const str = String(u.quota_limit).trim()
      const num = parseFloat(str)
      let pct = null
      if (!isNaN(num) && num > 0 && num < 1) {
        pct = num * 100
      } else {
        const m = str.match(/^(\d+(?:\.\d+)?)\s*%$/)
        if (m) pct = parseFloat(m[1])
      }
      if (pct !== null) {
        if (disclosureCount.value) {
          return Math.ceil(disclosureCount.value * pct / 100)
        }
        return 9999
      }
      const mNum = str.match(/\d+/)
      return mNum ? parseInt(mNum[0], 10) : null
    }

    // 본교지원가능여부='X' 또는 사전마감여부='마감' 설정 대학 차단 검증
    function isBlockedByRegionalSpec(u, regList) {
      if (!u || !regList || regList.length === 0) return false
      const uUnivName = String(u.univ_name || '').trim().toLowerCase()
      const uTrackName = String(u.track_name || '').trim().toLowerCase()

      const matched = regList.filter(r => {
        const rUniv = String(r.univ_name || '').trim().toLowerCase()
        const rTrack = String(r.track_name || '').trim().toLowerCase()
        const univMatch = rUniv === uUnivName || rUniv.includes(uUnivName) || uUnivName.includes(rUniv)
        const trackMatch = !uTrackName || !rTrack || rTrack === uTrackName || rTrack.includes(uTrackName) || uTrackName.includes(rTrack)
        return univMatch && trackMatch
      })

      if (matched.length === 0) return false

      return matched.some(r => {
        const elig = String(r.target_students || '').trim()
        const remarks = String(r.remarks || '').trim()

        const isEligX = /[×Xx✕✖]|불가/.test(elig)
        const isPreClosed = remarks.includes('마감')

        return isEligX || isPreClosed
      })
    }

    if (!err2 && univs) {
      const enrichedUnivs = univs.map(u => {
        const limit = getQuotaLimitNumber(u)
        const used = recCounts[u.id] || 0
        const isExhausted = limit !== null && used >= limit
        return {
          ...u,
          is_exhausted: isExhausted,
          quota_used: used,
          quota_resolved_limit: limit
        }
      })

      // 본교지원가능여부 X 또는 사전마감인 항목 드롭다운 제외
      const validUnivs = enrichedUnivs.filter(u => !isBlockedByRegionalSpec(u, regRecs || []))

      if (!auth.isEnrolled) {
        availableUnivs.value = validUnivs.filter(u => u.grad_allowed)
      } else {
        availableUnivs.value = validUnivs
      }
    }

    // 3. 실시간 전체 신청 인원수 집계 (대학별 신청 건수)
    const { data: allActiveApps } = await supabase
      .from('applications')
      .select('univ_id')
      .eq('is_abandoned', false)

    if (allActiveApps) {
      const counts = {}
      allActiveApps.forEach(ap => {
        if (ap.univ_id) {
          counts[ap.univ_id] = (counts[ap.univ_id] || 0) + 1
        }
      })
      applicantCountsMap.value = counts
    }

    // 5. 수시 원서 접수 기간 로드 (포기원 제출 기간 제어용)
    const { data: cfgStart } = await supabase.from('config').select('value').eq('key', 'susi_apply_start_date').maybeSingle()
    if (cfgStart?.value) susiApplyStartDate.value = cfgStart.value

    const { data: cfgEnd } = await supabase.from('config').select('value').eq('key', 'susi_apply_end_date').maybeSingle()
    if (cfgEnd?.value) susiApplyEndDate.value = cfgEnd.value

  } catch (e) {
    console.error('Error loading student data:', e)
  } finally {
    loading.value = false
  }
}

// 활성화(OPEN)된 라운드 및 총 회수(totalRounds) 조회
async function checkCurrentRound() {
  roundsLoading.value = true
  try {
    // 1. total_rounds 설정 로드
    const localTotal = localStorage.getItem('total_rounds')
    if (localTotal) totalRounds.value = parseInt(localTotal, 10) || 3

    if (supabase) {
      const { data: cfg } = await supabase.from('config').select('value').eq('key', 'total_rounds').maybeSingle()
      if (cfg && cfg.value) {
        totalRounds.value = parseInt(cfg.value, 10) || 3
      }
    }

    if (!supabase) return

    // 2. 일정 맵 로드
    const schedulesMap = await fetchRoundSchedulesMap()

    // 3. timeline_rounds 데이터 로드
    const { data: roundsList, error } = await supabase
      .from('timeline_rounds')
      .select('*')
      .order('id', { ascending: true })

    if (error) throw error

    if (roundsList && roundsList.length > 0) {
      const processedRounds = roundsList.map(r => {
        const sched = schedulesMap[r.id]
        const dispStatus = computeRoundDisplayStatus(r, sched)
        return {
          ...r,
          computedStatus: dispStatus
        }
      })

      // 실시간 OPEN 상태인 라운드가 있는지 먼저 확인
      const openRound = processedRounds.find(r => r.computedStatus === 'OPEN')
      if (openRound) {
        currentRound.value = openRound.id
        currentRoundStatus.value = 'OPEN'
      } else {
        // OPEN인 라운드가 없다면, 접수 마감/종료(CLOSED, FINALIZED)된 라운드 중 가장 진행된 라운드 표시
        const closedOrFinalized = processedRounds.filter(r => r.computedStatus === 'CLOSED' || r.computedStatus === 'FINALIZED')
        if (closedOrFinalized.length > 0) {
          const lastClosed = closedOrFinalized[closedOrFinalized.length - 1]
          currentRound.value = lastClosed.id
          currentRoundStatus.value = lastClosed.computedStatus
        } else {
          // 대기(DRAFT) 상태
          currentRound.value = processedRounds[0].id
          currentRoundStatus.value = processedRounds[0].computedStatus
        }
      }
    } else {
      currentRound.value = null
      currentRoundStatus.value = 'CLOSED'
    }
  } catch (e) {
    console.error('Error checking active round:', e)
  } finally {
    roundsLoading.value = false
  }
}

function onUnivChange() {
  formError.value = null
}

// 서명 그리기 로직 (학생)
function initStudentCanvas() {
  const canvas = studentCanvasRef.value
  if (!canvas) return
  studentCtx = canvas.getContext('2d')
  studentCtx.strokeStyle = '#0f172a' // Dark slate color for pen
  studentCtx.lineWidth = 2.5
  studentCtx.lineCap = 'round'
  studentCtx.lineJoin = 'round'
}

function startStudentDraw(e) {
  studentDrawing = true
  studentDraw(e)
}

function studentDraw(e) {
  if (!studentDrawing || !studentCtx || !studentCanvasRef.value) return
  const canvas = studentCanvasRef.value
  const rect = canvas.getBoundingClientRect()
  const x = (e.clientX - rect.left) * (canvas.width / rect.width)
  const y = (e.clientY - rect.top) * (canvas.height / rect.height)
  studentCtx.lineTo(x, y)
  studentCtx.stroke()
}

function startStudentTouch(e) {
  e.preventDefault()
  studentDrawing = true
  studentTouch(e)
}

function studentTouch(e) {
  if (!studentDrawing || !studentCtx || !studentCanvasRef.value) return
  const canvas = studentCanvasRef.value
  const rect = canvas.getBoundingClientRect()
  const touch = e.touches[0]
  if (!touch) return
  const x = (touch.clientX - rect.left) * (canvas.width / rect.width)
  const y = (touch.clientY - rect.top) * (canvas.height / rect.height)
  studentCtx.lineTo(x, y)
  studentCtx.stroke()
}

function stopStudentDraw() {
  studentDrawing = false
  studentCtx?.beginPath()
}

// 서명 그리기 로직 (학부모)
function initParentCanvas() {
  const canvas = parentCanvasRef.value
  if (!canvas) return
  parentCtx = canvas.getContext('2d')
  if (parentCtx) {
    parentCtx.strokeStyle = '#0f172a'
    parentCtx.lineWidth = 2.5
    parentCtx.lineCap = 'round'
    parentCtx.lineJoin = 'round'
  }
}

function startParentDraw(e) {
  parentDrawing = true
  parentDraw(e)
}

function parentDraw(e) {
  if (!parentDrawing || !parentCtx || !parentCanvasRef.value) return
  const canvas = parentCanvasRef.value
  const rect = canvas.getBoundingClientRect()
  const x = (e.clientX - rect.left) * (canvas.width / rect.width)
  const y = (e.clientY - rect.top) * (canvas.height / rect.height)
  parentCtx.lineTo(x, y)
  parentCtx.stroke()
}

function startParentTouch(e) {
  e.preventDefault()
  parentDrawing = true
  parentTouch(e)
}

function parentTouch(e) {
  if (!parentDrawing || !parentCtx || !parentCanvasRef.value) return
  const canvas = parentCanvasRef.value
  const rect = canvas.getBoundingClientRect()
  const touch = e.touches[0]
  if (!touch) return
  const x = (touch.clientX - rect.left) * (canvas.width / rect.width)
  const y = (touch.clientY - rect.top) * (canvas.height / rect.height)
  parentCtx.lineTo(x, y)
  parentCtx.stroke()
}

function stopParentDraw() {
  parentDrawing = false
  parentCtx?.beginPath()
}

function clearSignatures() {
  if (studentCanvasRef.value) {
    studentCtx.clearRect(0, 0, studentCanvasRef.value.width, studentCanvasRef.value.height)
  }
  if (parentCanvasRef.value) {
    parentCtx.clearRect(0, 0, parentCanvasRef.value.width, parentCanvasRef.value.height)
  }
  formError.value = null
}

// Base64 DataURL을 Blob 객체로 변환
function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

// 캔버스가 비어있는지 체크
function isCanvasBlank(canvas) {
  if (!canvas) return true
  const blank = document.createElement('canvas')
  blank.width = canvas.width
  blank.height = canvas.height
  return canvas.toDataURL() === blank.toDataURL()
}

// 희망원 등록 사전 검증 및 서약 모달 오픈
function prepareApply() {
  formError.value = null
  formSuccess.value = null

  if (!isSubmissionActive.value) {
    formError.value = '현재는 추천 희망서 제출 기간이 아닙니다.'
    return
  }

  if (!selectedUnivId.value) {
    formError.value = '지원할 대학교를 선택해 주세요.'
    return
  }

  if (isCanvasBlank(studentCanvasRef.value) || isCanvasBlank(parentCanvasRef.value)) {
    formError.value = '학생 서명과 학부모 서명이 모두 필요합니다.'
    return
  }

  // 정원 마감 검증
  const selectedUniv = availableUnivs.value.find(u => u.id === selectedUnivId.value)
  if (selectedUniv && selectedUniv.is_exhausted) {
    formError.value = '해당 대학/전형은 추천 제한 정원이 이미 마감되어 더 이상 지원하실 수 없습니다.'
    return
  }

  // 중복 신청 체크
  const isDuplicate = myApplications.value.some(
    ap => ap.univ_id === selectedUnivId.value && ap.round === currentRound.value && !ap.is_abandoned
  )
  if (isDuplicate) {
    formError.value = '해당 대학/전형에는 이미 접수된 신청서가 존재합니다.'
    return
  }

  agreedOath.value = false
  showOathModal.value = true
}

async function confirmApply() {
  if (!agreedOath.value) return
  showOathModal.value = false
  await executeApply()
}

// 희망원 등록 제출 실행
async function executeApply() {
  formError.value = null
  formSuccess.value = null

  if (!selectedUnivId.value) {
    formError.value = '지원할 대학교를 선택해 주세요.'
    return
  }

  if (isCanvasBlank(studentCanvasRef.value) || isCanvasBlank(parentCanvasRef.value)) {
    formError.value = '학생 서명과 학부모 서명이 모두 필요합니다.'
    return
  }

  // 정원 마감 검증
  const selectedUniv = availableUnivs.value.find(u => u.id === selectedUnivId.value)
  if (selectedUniv && selectedUniv.is_exhausted) {
    formError.value = '해당 대학/전형은 추천 제한 정원이 이미 마감되어 더 이상 지원하실 수 없습니다.'
    return
  }

  // 중복 신청 체크
  const isDuplicate = myApplications.value.some(
    ap => ap.univ_id === selectedUnivId.value && ap.round === currentRound.value && !ap.is_abandoned
  )
  if (isDuplicate) {
    formError.value = '해당 대학/전형에는 이미 접수된 신청서가 존재합니다.'
    return
  }

  // 학과(학부) 미지정("상관없음", "미정", 공백 등) 검증 및 확인 팝업
  let finalDept = departmentName.value?.trim() || ''
  if (isUndecidedDepartment(finalDept)) {
    const inputDisplay = finalDept ? `"${finalDept}"` : '미입력(공백)'
    const proceed = await dialog.confirm({
      title: '지원 학과(모집단위) 미지정 확인',
      message: `지원 모집단위(학과/학부)가 명확히 지정되지 않았습니다.\n(입력값: ${inputDisplay})\n\n정확한 추천 선발 및 심사를 위해 학과명을 입력하는 것을 권장합니다.\n\n학과를 미지정한 상태("-" 처리)로 그대로 제출하시겠습니까?`,
      confirmText: '미지정("-"로 제출)',
      cancelText: '학과 다시 입력하기',
      level: 'warn',
    })

    if (!proceed) {
      return
    }
    finalDept = '-'
  }

  submitLoading.value = true
  try {
    const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
    const userId = userData?.user?.id || (auth.token?.startsWith('student_') ? auth.token.split('_')[1] : 'guest')

    // 1. 서명 파일 Storage 업로드 시도 (스토리지 버킷 미생성/권한 오류 시 Base64 DataURL 자동 폴백)
    const studentSigDataUrl = studentCanvasRef.value.toDataURL('image/png')
    const parentSigDataUrl = parentCanvasRef.value.toDataURL('image/png')

    const studentSigBlob = dataURLtoBlob(studentSigDataUrl)
    const parentSigBlob = dataURLtoBlob(parentSigDataUrl)

    const studentSigPath = `student_${userId}_r${currentRound.value}_u_${selectedUnivId.value}_student.png`
    const parentSigPath = `student_${userId}_r${currentRound.value}_u_${selectedUnivId.value}_parent.png`

    let studentSigUrl = studentSigDataUrl
    let parentSigUrl = parentSigDataUrl

    try {
      const { error: uploadErr1 } = await supabase.storage
        .from('signatures')
        .upload(studentSigPath, studentSigBlob, { contentType: 'image/png', upsert: true })

      if (!uploadErr1) {
        const publicRes1 = supabase.storage.from('signatures').getPublicUrl(studentSigPath)
        if (publicRes1?.data?.publicUrl) studentSigUrl = publicRes1.data.publicUrl
      }
    } catch (e) {
      console.warn('학생 서명 스토리지 업로드 실패 (Base64로 대체):', e)
    }

    try {
      const { error: uploadErr2 } = await supabase.storage
        .from('signatures')
        .upload(parentSigPath, parentSigBlob, { contentType: 'image/png', upsert: true })

      if (!uploadErr2) {
        const publicRes2 = supabase.storage.from('signatures').getPublicUrl(parentSigPath)
        if (publicRes2?.data?.publicUrl) parentSigUrl = publicRes2.data.publicUrl
      }
    } catch (e) {
      console.warn('학부모 서명 스토리지 업로드 실패 (Base64로 대체):', e)
    }

    // profiles FK 자동 생성은 학생 가입 시에만 처리 (auth.users가 없으면 FK 위반)
    // enrolled_students 기반 학생은 별도 profiles 생성 불필요

    // 3. applications 레코드 추가 (parent_signature_url 포함)
    const payload = {
      student_id: userId,
      univ_id: selectedUnivId.value,
      round: currentRound.value,
      department_name: finalDept,
      parent_name: parentName.value,
      parent_phone: parentPhone.value,
      student_signature_url: studentSigUrl,
      parent_signature_url: parentSigUrl,
      ...((!auth.isEnrolled && univCalcScore.value) ? { univ_calc_score: Number(univCalcScore.value) } : {})
    }

    let insertErr = null
    const { error: err } = await supabase.from('applications').insert(payload)
    if (err && err.message?.includes('parent_signature_url')) {
      delete payload.parent_signature_url
      const retry = await supabase.from('applications').insert(payload)
      insertErr = retry.error
    } else {
      insertErr = err
    }

    if (insertErr) {
      // 롤백용 스토리지 파일 삭제
      await supabase.storage.from('signatures').remove([studentSigPath, parentSigPath]).catch(() => {})
      throw insertErr
    }

    // 감사로그 기록
    try {
      const actorUuid = userData?.user?.id || null
      await supabase.from('audit_logs').insert({
        actor_id: actorUuid,
        action: 'APPLY',
        details: {
          student_code: auth.studentCode || userId,
          univ_id: selectedUnivId.value,
          round: currentRound.value,
          department_name: departmentName.value
        }
      })
    } catch (e) {
      console.warn('감사 로그 작성 스킵/실패:', e)
    }

    formSuccess.value = '추천 희망원이 성공적으로 제출되었습니다!'
    
    // 입력 폼 리셋
    selectedUnivId.value = ''
    departmentName.value = ''
    clearSignatures()
    
    // 내역 다시 로드
    await loadData()
  } catch (e) {
    console.error(e)
    formError.value = e.message || '신청서 제출 중 오류가 발생했습니다.'
  } finally {
    submitLoading.value = false
  }
}

// 신청 희망원 취소 (추천 선발 접수 중 전용)
async function handleCancelApplication(id) {
  if (!confirm('정말로 이 추천 희망원 신청을 취소하시겠습니까? 신청 내역과 서명 파일이 영구히 삭제됩니다.')) return
  
  submitLoading.value = true
  try {
    // 신청 건 조회하여 업로드된 서명 파일 경로 획득 및 스토리지 삭제
    const ap = myApplications.value.find(item => item.id === id)
    if (!ap) return

    const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
    const userId = userData?.user?.id || (auth.token?.startsWith('student_') ? auth.token.split('_')[1] : 'guest')

    // 서명 및 보관 파일 스토리지 완전 삭제 수행
    await deleteApplicationStorageFiles(ap)

    // DB 삭제
    const { error: deleteErr } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)

    if (deleteErr) throw deleteErr

    // 감사로그 기록
    try {
      const actorUuid = userData?.user?.id || null
      await supabase.from('audit_logs').insert({
        actor_id: actorUuid,
        action: 'CANCEL_APPLICATION',
        details: {
          student_code: auth.studentCode || userId,
          univ_id: ap.univ_id,
          round: ap.round,
          department_name: ap.department_name
        }
      })
    } catch (e) {
      console.warn('감사 로그 작성 스킵/실패:', e)
    }

    formSuccess.value = '신청이 취소되었습니다.'
    await loadData()
  } catch (e) {
    console.error(e)
    alert('취소 처리 중 오류가 발생했습니다.')
  } finally {
    submitLoading.value = false
  }
}

function handlePrint() {
  const firstAp = myApplications.value[0] || {}
  const cachedS = localStorage.getItem('print_student_phone') || auth.studentPhone || firstAp.student_phone || firstAp.phone || ''
  const cachedP = localStorage.getItem('print_parent_phone') || auth.parentPhone || firstAp.parent_phone || ''
  hakchuStudentPhone.value = cachedS
  hakchuParentPhone.value = cachedP
  showHakchuPrintModal.value = true
}

function executeHakchuPrint() {
  showHakchuPrintModal.value = false
  if (hakchuStudentPhone.value) {
    localStorage.setItem('print_student_phone', hakchuStudentPhone.value)
  }
  if (hakchuParentPhone.value) {
    localStorage.setItem('print_parent_phone', hakchuParentPhone.value)
  }

  const firstAp = myApplications.value[0] || {}
  const studentInfo = {
    name: auth.studentName || firstAp.name || '',
    student_code: auth.studentCode || firstAp.student_code || '',
    is_enrolled: auth.isEnrolled,
    grad_year: auth.gradYear || firstAp.grad_year,
    grade: auth.grade || firstAp.grade,
    class_no: auth.classNo || firstAp.class_no,
    seq_no: auth.seqNo || firstAp.seq_no,
    student_phone: hakchuStudentPhone.value || auth.studentPhone || firstAp.student_phone || '',
    parent_name: firstAp.parent_name || '',
    parent_phone: hakchuParentPhone.value || auth.parentPhone || firstAp.parent_phone || '',
    student_signature_url: firstAp.student_signature_url,
    parent_signature_url: firstAp.parent_signature_url
  }
  printApplicationForm(myApplications.value, studentInfo)
}

function openAbandonRequestModal(ap) {
  if (!isSusiApplyPeriodActive.value) {
    alert(`수시 원서 접수 마감일이 지나 추천 포기 신청이 마감되었습니다.\n(포기원 제출 가능 마감일: ${susiApplyEndDate.value})`)
    return
  }
  abandonTargetApp.value = ap
  abandonReason.value = ''
  showAbandonModal.value = true
  setTimeout(() => {
    initAbandonCanvases()
  }, 200)
}

function closeAbandonModal() {
  showAbandonModal.value = false
  showAbandonConfirm.value = false
  abandonConfirmChecked.value = false
  abandonTargetApp.value = null
  abandonReason.value = ''
}

function openAbandonConfirm() {
  abandonConfirmChecked.value = false
  showAbandonConfirm.value = true
}

function closeAbandonConfirm() {
  showAbandonConfirm.value = false
  abandonConfirmChecked.value = false
}

function initAbandonCanvases() {
  if (abandonStudentCanvasRef.value) {
    abandonStudentCtx = abandonStudentCanvasRef.value.getContext('2d')
    abandonStudentCtx.strokeStyle = '#0f172a'
    abandonStudentCtx.lineWidth = 2.5
    abandonStudentCtx.lineCap = 'round'
    abandonStudentCtx.lineJoin = 'round'
  }
  if (abandonParentCanvasRef.value) {
    abandonParentCtx = abandonParentCanvasRef.value.getContext('2d')
    abandonParentCtx.strokeStyle = '#0f172a'
    abandonParentCtx.lineWidth = 2.5
    abandonParentCtx.lineCap = 'round'
    abandonParentCtx.lineJoin = 'round'
  }
}

function clearAbandonSignatures() {
  if (abandonStudentCanvasRef.value && abandonStudentCtx) {
    abandonStudentCtx.clearRect(0, 0, abandonStudentCanvasRef.value.width, abandonStudentCanvasRef.value.height)
    abandonStudentCtx.beginPath()
  }
  if (abandonParentCanvasRef.value && abandonParentCtx) {
    abandonParentCtx.clearRect(0, 0, abandonParentCanvasRef.value.width, abandonParentCanvasRef.value.height)
    abandonParentCtx.beginPath()
  }
}

// 학생 드로잉
function startAbandonStudentDraw(e) {
  abandonStudentDrawing = true
  abandonStudentDraw(e)
}
function abandonStudentDraw(e) {
  if (!abandonStudentDrawing || !abandonStudentCtx || !abandonStudentCanvasRef.value) return
  const canvas = abandonStudentCanvasRef.value
  const rect = canvas.getBoundingClientRect()
  const x = (e.clientX - rect.left) * (canvas.width / rect.width)
  const y = (e.clientY - rect.top) * (canvas.height / rect.height)
  abandonStudentCtx.lineTo(x, y)
  abandonStudentCtx.stroke()
}
function stopAbandonStudentDraw() {
  abandonStudentDrawing = false
  abandonStudentCtx?.beginPath()
}
function startAbandonStudentTouch(e) {
  e.preventDefault()
  abandonStudentDrawing = true
  const touch = e.touches[0]
  if (!touch || !abandonStudentCtx || !abandonStudentCanvasRef.value) return
  const canvas = abandonStudentCanvasRef.value
  const rect = canvas.getBoundingClientRect()
  const x = (touch.clientX - rect.left) * (canvas.width / rect.width)
  const y = (touch.clientY - rect.top) * (canvas.height / rect.height)
  abandonStudentCtx.moveTo(x, y)
}
function abandonStudentTouch(e) {
  e.preventDefault()
  if (!abandonStudentDrawing || !abandonStudentCtx || !abandonStudentCanvasRef.value) return
  const touch = e.touches[0]
  if (!touch) return
  const canvas = abandonStudentCanvasRef.value
  const rect = canvas.getBoundingClientRect()
  const x = (touch.clientX - rect.left) * (canvas.width / rect.width)
  const y = (touch.clientY - rect.top) * (canvas.height / rect.height)
  abandonStudentCtx.lineTo(x, y)
  abandonStudentCtx.stroke()
}

// 보호자 드로잉
function startAbandonParentDraw(e) {
  abandonParentDrawing = true
  abandonParentDraw(e)
}
function abandonParentDraw(e) {
  if (!abandonParentDrawing || !abandonParentCtx || !abandonParentCanvasRef.value) return
  const canvas = abandonParentCanvasRef.value
  const rect = canvas.getBoundingClientRect()
  const x = (e.clientX - rect.left) * (canvas.width / rect.width)
  const y = (e.clientY - rect.top) * (canvas.height / rect.height)
  abandonParentCtx.lineTo(x, y)
  abandonParentCtx.stroke()
}
function stopAbandonParentDraw() {
  abandonParentDrawing = false
  abandonParentCtx?.beginPath()
}
function startAbandonParentTouch(e) {
  e.preventDefault()
  abandonParentDrawing = true
  const touch = e.touches[0]
  if (!touch || !abandonParentCtx || !abandonParentCanvasRef.value) return
  const canvas = abandonParentCanvasRef.value
  const rect = canvas.getBoundingClientRect()
  const x = (touch.clientX - rect.left) * (canvas.width / rect.width)
  const y = (touch.clientY - rect.top) * (canvas.height / rect.height)
  abandonParentCtx.moveTo(x, y)
}
function abandonParentTouch(e) {
  e.preventDefault()
  if (!abandonParentDrawing || !abandonParentCtx || !abandonParentCanvasRef.value) return
  const touch = e.touches[0]
  if (!touch) return
  const canvas = abandonParentCanvasRef.value
  const rect = canvas.getBoundingClientRect()
  const x = (touch.clientX - rect.left) * (canvas.width / rect.width)
  const y = (touch.clientY - rect.top) * (canvas.height / rect.height)
  abandonParentCtx.lineTo(x, y)
  abandonParentCtx.stroke()
}

async function submitAbandonRequest() {
  if (!abandonReason.value.trim()) {
    alert('포기 사유를 작성해 주세요.')
    return
  }
  if (isCanvasBlank(abandonStudentCanvasRef.value) || isCanvasBlank(abandonParentCanvasRef.value)) {
    alert('학생 및 보호자 서명이 모두 필요합니다.')
    return
  }

  abandonSubmitLoading.value = true
  try {
    const studentId = abandonTargetApp.value.student_id || auth.userId || (auth.token?.startsWith('student_') ? auth.token.split('_')[1] : 'student')
    const roundId = abandonTargetApp.value.round || abandonTargetApp.value.round_id || 1
    const univId = abandonTargetApp.value.univ_id || abandonTargetApp.value.track_id || 1
    const appId = abandonTargetApp.value.id || 'app'
    const timestamp = Date.now()

    const studentCanvas = abandonStudentCanvasRef.value
    const parentCanvas = abandonParentCanvasRef.value

    const studentSigBlob = await new Promise(resolve => studentCanvas.toBlob(resolve, 'image/png'))
    const parentSigBlob = await new Promise(resolve => parentCanvas.toBlob(resolve, 'image/png'))

    const stPath = `abandon_student_${studentId}_app_${appId}_${timestamp}.png`
    const paPath = `abandon_parent_${studentId}_app_${appId}_${timestamp}.png`

    await Promise.all([
      supabase.storage.from('signatures').upload(stPath, studentSigBlob, { contentType: 'image/png', upsert: true }),
      supabase.storage.from('signatures').upload(paPath, parentSigBlob, { contentType: 'image/png', upsert: true })
    ])

    const studentSigUrl = supabase.storage.from('signatures').getPublicUrl(stPath).data.publicUrl
    const parentSigUrl = supabase.storage.from('signatures').getPublicUrl(paPath).data.publicUrl

    const requestJson = {
      abandon_requested: true,
      abandon_reason: abandonReason.value,
      student_signature_url: studentSigUrl,
      parent_signature_url: parentSigUrl,
      requested_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('applications')
      .update({ scanned_doc_url: JSON.stringify(requestJson) })
      .eq('id', abandonTargetApp.value.id)

    if (error) throw error

    await loadData()

    const printApp = abandonTargetApp.value
    const targetSchoolFooter = getSchoolPrincipalFooterTitle()
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>2027학년도 대입 학교장추천전형 지원 포기원</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            * { box-sizing: border-box; }
            html, body {
              height: 100%;
              margin: 0;
              padding: 0;
              font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
              color: #111;
              line-height: 1.6;
            }
            .page {
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              height: 100%;
              min-height: 245mm;
              padding: 5mm 0;
              box-sizing: border-box;
            }
            .top-section {
              width: 100%;
            }
            .title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 35px; letter-spacing: 1px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .table th, .table td { border: 1px solid #000; padding: 10px 12px; text-align: left; font-size: 13px; }
            .table th { background: #f2f2f2; font-weight: bold; width: 25%; text-align: center; }
            .section-title { font-weight: bold; font-size: 14px; margin-top: 20px; margin-bottom: 8px; }
            .reason-box { border: 1px solid #000; padding: 15px; min-height: 130px; margin-bottom: 25px; font-size: 13px; white-space: pre-wrap; }
            .statement { font-size: 13px; line-height: 1.7; word-break: keep-all; margin-top: 15px; }
            .bottom-section {
              margin-top: auto;
              width: 100%;
              padding-bottom: 5mm;
            }
            .date { text-align: center; font-size: 15px; margin-bottom: 35px; }
            .signature-area { display: flex; justify-content: space-around; align-items: flex-start; margin-bottom: 40px; }
            .sig-box { text-align: center; width: 45%; font-size: 13.5px; }
            .sig-img { max-height: 75px; display: block; margin: 10px auto 0; }
            .footer { text-align: left; font-size: 20px; font-weight: bold; letter-spacing: 1px; padding-left: 5px; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="top-section">
              <div class="title">2027학년도 대입 학교장추천전형 지원 포기원</div>
              
              <div class="section-title">[신청인 인적사항]</div>
              <table class="table">
                <tr>
                  <th>학번/학생코드</th>
                  <td>${auth.studentCode}</td>
                  <th>성명</th>
                  <td>${auth.studentName}</td>
                </tr>
                <tr>
                  <th>지원 대학</th>
                  <td>${printApp.universities.univ_name}</td>
                  <th>지원 전형</th>
                  <td>${printApp.universities.track_name}</td>
                </tr>
                <tr>
                  <th>지원 학과</th>
                  <td colspan="3">${printApp.department_name}</td>
                </tr>
              </table>
              
              <div class="section-title">[포기 사유]</div>
              <div class="reason-box">${abandonReason.value}</div>
              
              <p class="statement">
                위 본인은 2027학년도 대입 학교장추천전형 선정과 관련하여 추천이 확정되었으나, 위의 사유로 인하여 학교장추천전형 지원 권한을 공식적으로 포기하고자 포기원을 제출합니다.
                아울러 추천 포기 처리가 완료되면 차순위 대기 학생에게 추천 기회가 승계됨을 확인합니다.
              </p>
            </div>
            
            <div class="bottom-section">
              <div class="date">${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              
              <div class="signature-area">
                <div class="sig-box">
                  <div>학생 본인: ${auth.studentName} (서명/날인)</div>
                  <img class="sig-img" src="${studentSigUrl}" />
                </div>
                <div class="sig-box">
                  <div>보호자(학부모): ${printApp.parent_name} (서명/날인)</div>
                  <img class="sig-img" src="${parentSigUrl}" />
                </div>
              </div>
              
              <div class="footer">${targetSchoolFooter}</div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          <\/script>
        </body>
      </html>
    `)
    printWindow.document.close()

    closeAbandonModal()
    alert('포기 신청서 등록이 완료되었습니다. 출력된 포기원을 학교 담임선생님께 제출해 주세요.')
  } catch (e) {
    console.error(e)
    alert(e.message || '포기 신청 도중 오류가 발생했습니다.')
  } finally {
    abandonSubmitLoading.value = false
  }
}

function getSchoolPrincipalFooterTitle() {
  const name = (schoolName.value || '').trim()
  if (!name || name === '우리학교' || name === '우리고등학교' || name === '학교명 미설정') {
    return '우리고등학교장 귀하'
  }
  if (name.endsWith('학교')) {
    return `${name}장 귀하`
  }
  if (name.endsWith('고')) {
    return `${name}등학교장 귀하`
  }
  if (!name.includes('학교')) {
    return `${name}고등학교장 귀하`
  }
  return `${name}장 귀하`
}

function printAbandonForm(ap) {
  const req = getAbandonRequest(ap)
  if (!req) return

  const targetSchoolFooter = getSchoolPrincipalFooterTitle()
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html>
      <head>
        <title>2027학년도 대입 학교장추천전형 지원 포기원</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          * { box-sizing: border-box; }
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
            color: #111;
            line-height: 1.6;
          }
          .page {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            min-height: 245mm;
            padding: 5mm 0;
            box-sizing: border-box;
          }
          .top-section {
            width: 100%;
          }
          .title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 35px; letter-spacing: 1px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .table th, .table td { border: 1px solid #000; padding: 10px 12px; text-align: left; font-size: 13px; }
          .table th { background: #f2f2f2; font-weight: bold; width: 25%; text-align: center; }
          .section-title { font-weight: bold; font-size: 14px; margin-top: 20px; margin-bottom: 8px; }
          .reason-box { border: 1px solid #000; padding: 15px; min-height: 130px; margin-bottom: 25px; font-size: 13px; white-space: pre-wrap; }
          .statement { font-size: 13px; line-height: 1.7; word-break: keep-all; margin-top: 15px; }
          .bottom-section {
            margin-top: auto;
            width: 100%;
            padding-bottom: 5mm;
          }
          .date { text-align: center; font-size: 15px; margin-bottom: 35px; }
          .signature-area { display: flex; justify-content: space-around; align-items: flex-start; margin-bottom: 40px; }
          .sig-box { text-align: center; width: 45%; font-size: 13.5px; }
          .sig-img { max-height: 75px; display: block; margin: 10px auto 0; }
          .footer { text-align: left; font-size: 20px; font-weight: bold; letter-spacing: 1px; padding-left: 5px; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="top-section">
            <div class="title">2027학년도 대입 학교장추천전형 지원 포기원</div>
            
            <div class="section-title">[신청인 인적사항]</div>
            <table class="table">
              <tr>
                <th>학번/학생코드</th>
                <td>${auth.studentCode}</td>
                <th>성명</th>
                <td>${auth.studentName}</td>
              </tr>
              <tr>
                <th>지원 대학</th>
                <td>${ap.universities.univ_name}</td>
                <th>지원 전형</th>
                <td>${ap.universities.track_name}</td>
              </tr>
              <tr>
                <th>지원 학과</th>
                <td colspan="3">${ap.department_name}</td>
              </tr>
            </table>
            
            <div class="section-title">[포기 사유]</div>
            <div class="reason-box">${req.abandon_reason}</div>
            
            <p class="statement">
              위 본인은 2027학년도 대입 학교장추천전형 선정과 관련하여 추천이 확정되었으나, 위의 사유로 인하여 학교장추천전형 지원 권한을 공식적으로 포기하고자 포기원을 제출합니다.
              아울러 추천 포기 처리가 완료되면 차순위 대기 학생에게 추천 기회가 승계됨을 확인합니다.
            </p>
          </div>
          
          <div class="bottom-section">
            <div class="date">${new Date(req.requested_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            
            <div class="signature-area">
              <div class="sig-box">
                <div>학생 본인: ${auth.studentName || ''} (서명/날인)</div>
                ${(() => {
                  const isValid = url => url && typeof url === 'string' && !url.includes('_undefined_')
                  const finalUrl = (isValid(req.student_signature_url) ? req.student_signature_url : null) || ap.student_signature_url || req.student_signature_url
                  return finalUrl ? `<img class="sig-img" src="${finalUrl}" />` : `<div style="height: 60px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 12px;">(서명/날인)</div>`
                })()}
              </div>
              <div class="sig-box">
                <div>보호자(학부모): ${ap.parent_name || '학부모'} (서명/날인)</div>
                ${(() => {
                  const isValid = url => url && typeof url === 'string' && !url.includes('_undefined_')
                  const finalUrl = (isValid(req.parent_signature_url) ? req.parent_signature_url : null) || ap.parent_signature_url || req.parent_signature_url
                  return finalUrl ? `<img class="sig-img" src="${finalUrl}" />` : `<div style="height: 60px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 12px;">(서명/날인)</div>`
                })()}
              </div>
            </div>
            
            <div class="footer">${targetSchoolFooter}</div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        <\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

async function handleLogout() {
  await auth.logout()
}

onMounted(async () => {
  fetchSchoolName()
  disclosureCount.value = await getDisclosureCount()
  await checkCurrentRound()
  await loadData()
  // Vue가 렌더링된 후 캔버스 초기화
  setTimeout(() => {
    initStudentCanvas()
    initParentCanvas()
  }, 300)
})
</script>
