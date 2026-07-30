<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
    <!-- 네비게이션 바 -->
    <header class="bg-white dark:bg-slate-800 border-b border-slate-200/80 dark:border-slate-700/80 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90 dark:bg-slate-800/90">
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
                ({{ auth.isEnrolled ? `${auth.grade}학년 ${auth.classNo}반 ${auth.seqNo}번` : `${auth.gradYear}년 졸업생` }})
              </span>
            </p>
            <p class="text-xs text-slate-400 font-semibold">학번: {{ auth.studentCode }}</p>
          </div>
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

          <div v-else class="flex flex-col gap-4">
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
                  <span class="text-sm text-slate-400 dark:text-slate-500 ml-2">({{ ap.universities.track_name }} | {{ ap.department_name }})</span>
                </div>
                
                <!-- 추천 상태 배지 -->
                <div class="flex items-center gap-1.5">
                  <span v-if="ap.is_abandoned" class="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400">포기 완료</span>
                  <span v-else-if="ap.is_excluded" class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400" :title="'부적합 사유: ' + ap.excluded_reason">부적합 (원 {{ ap.original_rank }}위)</span>
                  <span v-else-if="ap.is_recommended" class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400">추천 확정</span>
                  <span v-else class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-500 dark:bg-amber-950/20 dark:text-amber-400">심의 대기</span>
                </div>
              </div>

              <!-- 요약 사항 -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <div><span class="text-slate-400">수능 최저:</span> {{ ap.universities.csat_min }}</div>
                <div><span class="text-slate-400">학부모명:</span> {{ ap.parent_name }}</div>
                <div><span class="text-slate-400">내신 총점:</span> <span class="font-semibold text-slate-700 dark:text-slate-300">{{ ap.manual_score ? ap.manual_score + '점' : '미입력' }}</span></div>
                <div class="text-right flex items-center justify-end gap-2">
                  <a v-if="ap.student_signature_url" :href="ap.student_signature_url" target="_blank" class="text-blue-500 hover:underline font-bold">서명 확인</a>
                  <button @click="handlePrint(ap)" class="text-blue-500 hover:underline bg-transparent border-none cursor-pointer p-0 text-xs font-bold">신청서 인쇄</button>
                </div>
              </div>

              <!-- 라운드가 OPEN 인 경우에만 지원 취소(삭제) 가능 -->
              <div v-if="ap.round_status === 'OPEN' && !ap.is_recommended" class="flex justify-end mt-3">
                <button
                  @click="handleCancelApplication(ap.id)"
                  :disabled="submitLoading"
                  class="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/30 transition-all cursor-pointer"
                >희망원 취소 (삭제)</button>
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
            관리자가 신규 추천 전형 라운드를 개시할 때까지 신청서를 제출할 수 없습니다.
          </div>

          <form v-else @submit.prevent="handleApply" class="flex flex-col gap-4">
            <div class="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 p-3 rounded-lg text-xs font-semibold flex justify-between items-center">
              <span>현재 접수 중: {{ currentRound }}차 추천 신청</span>
              <a
                href="/data/2027%ED%95%99%EB%85%84%EB%8F%84%20%ED%95%99%EA%B5%90%EC%9E%A5%EC%B6%94%EC%B2%9C%EC%A0%84%ED%98%95%20%EC%84%A0%EC%A0%95%20%EC%8B%A0%EC%B2%AD%EC%84%9C_%EC%96%91%EC%8B%9D.hwp"
                download
                class="text-blue-600 dark:text-blue-400 hover:underline font-bold text-[10px] cursor-pointer"
              >
                📝 신청서 양식 (HWP)
              </a>
            </div>

            <!-- 대학 및 전형 선택 -->
            <div>
              <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">지원 대학</label>
              <select
                v-model="selectedUnivId"
                required
                class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700 bg-white"
                style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
                @change="onUnivChange"
              >
                <option value="">대학 선택</option>
                <option v-for="u in availableUnivs" :key="u.id" :value="u.id">
                  {{ u.univ_name }} ({{ u.track_name }}) {{ u.grad_allowed ? '' : '[재학생 전용]' }}
                </option>
              </select>

              <!-- 전체 요강 보기 버튼 -->
              <div class="mt-1.5 text-right">
                <button
                  type="button"
                  @click="showRegionalModal = true"
                  class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline bg-transparent border-none cursor-pointer p-0"
                >
                  📖 2027 수도권 학교장추천전형 요강 전체보기
                </button>
              </div>

              <!-- 선택한 대학의 상세 요강 안내 카드 -->
              <div v-if="selectedUnivRegionalInfo.length > 0" class="mt-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-blue-200 dark:border-blue-900/40 text-xs space-y-2">
                <div v-for="info in selectedUnivRegionalInfo" :key="info.id || info.seq_no" class="space-y-1.5">
                  <div class="font-bold text-blue-700 dark:text-blue-300 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span>{{ info.univ_name }} - {{ info.track_name }}</span>
                    <span class="text-[11px] text-slate-500 font-normal">정원: {{ info.recruitment_quota || '—' }} (제한: {{ info.quota_limit || '—' }})</span>
                  </div>
                  <div v-if="info.csat_min"><strong class="text-slate-700 dark:text-slate-300">수능최저:</strong> <span class="whitespace-pre-line text-slate-600 dark:text-slate-400">{{ info.csat_min }}</span></div>
                  <div v-if="info.evaluation_method"><strong class="text-slate-700 dark:text-slate-300">전형방법:</strong> <span class="whitespace-pre-line text-slate-600 dark:text-slate-400">{{ info.evaluation_method }}</span></div>
                  <div v-if="info.grad_condition"><strong class="text-slate-700 dark:text-slate-300">졸업생조건:</strong> <span class="whitespace-pre-line text-slate-600 dark:text-slate-400">{{ info.grad_condition }}</span></div>
                  <div v-if="info.career_elective_method"><strong class="text-slate-700 dark:text-slate-300">진로선택과목:</strong> <span class="whitespace-pre-line text-slate-600 dark:text-slate-400">{{ info.career_elective_method }}</span></div>
                  <div v-if="info.remarks"><strong class="text-slate-700 dark:text-slate-300">비고:</strong> <span class="whitespace-pre-line text-slate-600 dark:text-slate-400">{{ info.remarks }}</span></div>
                </div>
              </div>
            </div>

            <!-- 지원학과 -->
            <div>
              <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">지원 모집단위 (학과)</label>
              <input
                v-model="departmentName"
                type="text"
                required
                placeholder="예: 컴퓨터공학과"
                class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
              />
            </div>

            <!-- 학부모 인적사항 -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">학부모 이름</label>
                <input
                  v-model="parentName"
                  type="text"
                  required
                  placeholder="예: 홍길동"
                  class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                  style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">학부모 연락처</label>
                <input
                  v-model="parentPhone"
                  type="text"
                  required
                  placeholder="010-0000-0000"
                  class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                  style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
                />
              </div>
            </div>

            <!-- 서명 패드 (Canvas) -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400">본인 및 보호자 연대 서명</label>
                <button type="button" @click="clearSignatures" class="text-xs text-rose-500 hover:underline cursor-pointer bg-transparent border-none">서명 초기화</button>
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
              :disabled="submitLoading"
              class="w-full text-sm font-bold disabled:opacity-40 transition-colors cursor-pointer"
              style="padding: 12px; border: none; border-radius: 8px; background: #2563eb; color: white; margin-top: 4px;"
            >{{ submitLoading ? '신청 제출 중…' : '신청서 제출하기' }}</button>
          </form>

          <p v-if="formError" class="text-xs font-semibold text-rose-500 mt-3 bg-rose-50 dark:bg-rose-950/20 p-2 rounded-lg border border-rose-100 dark:border-rose-900/30 text-center">{{ formError }}</p>
          <p v-if="formSuccess" class="text-xs font-semibold text-emerald-500 mt-3 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-center">{{ formSuccess }}</p>
        </div>
    <!-- 2027 수도권 학교장추천전형 요강 전체 보기 모달 -->
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
            <h3 class="text-base font-bold text-slate-800 dark:text-white">📖 2027학년도 수도권 학교장추천전형 (지역균형) 상세 모집요강</h3>
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
        <div class="overflow-auto flex-1 p-4">
          <table class="w-full text-left text-xs border-collapse" style="min-width: 1800px;">
            <thead class="sticky top-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
              <tr>
                <th class="p-2.5 w-12 text-center">No</th>
                <th class="p-2.5 w-20">지역</th>
                <th class="p-2.5 w-32">대학명</th>
                <th class="p-2.5 w-20">모집정원</th>
                <th class="p-2.5 w-32">전형명</th>
                <th class="p-2.5 w-28">인원제한</th>
                <th class="p-2.5 w-40">대상</th>
                <th class="p-2.5 w-32">졸업생조건</th>
                <th class="p-2.5 w-52">수능최저학력기준</th>
                <th class="p-2.5 w-48">전형방법</th>
                <th class="p-2.5 w-36">반영교과</th>
                <th class="p-2.5 w-32">반영지표</th>
                <th class="p-2.5 w-32">진로선택과목 반영</th>
                <th class="p-2.5 w-40">비고</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-if="filteredRegionalRecs.length === 0">
                <td colspan="14" class="text-center py-12 text-slate-400">
                  조건에 일치하는 추천전형 정보가 없습니다.
                </td>
              </tr>
              <tr v-else v-for="r in filteredRegionalRecs" :key="r.id || r.seq_no" class="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td class="p-2.5 text-center font-medium text-slate-400">{{ r.seq_no }}</td>
                <td class="p-2.5 text-slate-500">{{ r.region }}</td>
                <td class="p-2.5 font-bold text-slate-800 dark:text-slate-100">{{ r.univ_name }}</td>
                <td class="p-2.5 text-slate-600 dark:text-slate-400">{{ r.recruitment_quota }}</td>
                <td class="p-2.5 font-semibold text-blue-600 dark:text-blue-400">{{ r.track_name }}</td>
                <td class="p-2.5 text-slate-600 dark:text-slate-400">{{ r.quota_limit }}</td>
                <td class="p-2.5 text-slate-600 dark:text-slate-400 whitespace-pre-line">{{ r.target_students }}</td>
                <td class="p-2.5 text-slate-600 dark:text-slate-400 whitespace-pre-line">{{ r.grad_condition }}</td>
                <td class="p-2.5 font-medium text-slate-800 dark:text-slate-200 whitespace-pre-line">{{ r.csat_min }}</td>
                <td class="p-2.5 text-slate-600 dark:text-slate-400 whitespace-pre-line">{{ r.evaluation_method }}</td>
                <td class="p-2.5 text-slate-600 dark:text-slate-400 whitespace-pre-line">{{ r.reflected_subjects }}</td>
                <td class="p-2.5 text-slate-600 dark:text-slate-400">{{ r.reflected_indicators }}</td>
                <td class="p-2.5 text-slate-600 dark:text-slate-400 whitespace-pre-line">{{ r.career_elective_method }}</td>
                <td class="p-2.5 text-slate-500 whitespace-pre-line">{{ r.remarks }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button @click="showRegionalModal = false" class="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-200 rounded-lg cursor-pointer border-none">닫기</button>
        </div>
      </div>
    </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../utils/supabaseClient'
import { schoolName, fetchSchoolName } from '../utils/schoolConfig'
import { printApplicationForm } from '../utils/printTemplates'

const router = useRouter()
const auth = useAuthStore()

const myApplications = ref([])
const availableUnivs = ref([])
const currentRound = ref(null)

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

// 학생 서명 캔버스
const studentCanvasRef = ref(null)
let studentCtx = null
let studentDrawing = false

// 학부모 서명 캔버스
const parentCanvasRef = ref(null)
let parentCtx = null
let parentDrawing = false

// 수도권 학교장추천전형 (regional_recommendations) 데이터
const regionalRecs = ref([])
const showRegionalModal = ref(false)
const regionalSearch = ref('')

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

// 데이터 로드
async function loadData() {
  loading.value = true
  try {
    if (!supabase) return

    // 1. 로그인한 학생의 신청 내역 조회
    const { data: apps, error: err1 } = await supabase
      .from('applications')
      .select('*, universities(*)')
      .eq('student_id', auth.token ? (await supabase.auth.getUser()).data.user?.id : '')
      .order('created_at', { ascending: false })

    if (err1) throw err1

    // 각 신청 건의 라운드 마감상태를 알기 위해 timeline_rounds 정보 조인하여 가공
    const { data: rounds } = await supabase.from('timeline_rounds').select('*')
    const roundsMap = {}
    rounds?.forEach(r => {
      roundsMap[r.id] = r.status
    })

    myApplications.value = apps.map(ap => ({
      ...ap,
      round_status: roundsMap[ap.round] || 'OPEN'
    }))

    // 2. 지원 가능한 대학 목록 로드
    const { data: univs, error: err2 } = await supabase
      .from('universities')
      .select('*')
      .order('univ_name', { ascending: true })

    if (err2) throw err2
    
    // 졸업생 여부에 따라 필터링 (졸업생 비허용 대학인 경우 재학생만 가능)
    if (!auth.isEnrolled) {
      availableUnivs.value = univs.filter(u => u.grad_allowed)
    } else {
      availableUnivs.value = univs
    }

    // 3. 수도권 학교장추천전형 (regional_recommendations) 목록 로드
    const { data: regRecs } = await supabase
      .from('regional_recommendations')
      .select('*')
      .order('seq_no', { ascending: true })

    regionalRecs.value = regRecs || []

  } catch (e) {
    console.error('Error loading student data:', e)
  } finally {
    loading.value = false
  }
}

// 활성화(OPEN)된 라운드 조회
async function checkCurrentRound() {
  roundsLoading.value = true
  try {
    if (!supabase) return
    const { data, error } = await supabase
      .from('timeline_rounds')
      .select('*')
      .eq('status', 'OPEN')
      .order('id', { ascending: true })

    if (error) throw error
    
    // 진행중인 오픈 라운드가 있으면 가장 작은 차수 배정
    if (data && data.length > 0) {
      currentRound.value = data[0].id
    } else {
      currentRound.value = null
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
  if (!studentDrawing) return
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
  if (!studentDrawing) return
  const canvas = studentCanvasRef.value
  const rect = canvas.getBoundingClientRect()
  const touch = e.touches[0]
  const x = (touch.clientX - rect.left) * (canvas.width / rect.width)
  const y = (touch.clientY - rect.top) * (canvas.height / rect.height)
  studentCtx.lineTo(x, y)
  studentCtx.stroke()
}

function stopStudentDraw() {
  studentDrawing = false
  studentCtx.beginPath()
}

// 서명 그리기 로직 (학부모)
function initParentCanvas() {
  const canvas = parentCanvasRef.value
  if (!canvas) return
  parentCtx = canvas.getContext('2d')
  parentCtx.strokeStyle = '#0f172a'
  parentCtx.lineWidth = 2.5
  parentCtx.lineCap = 'round'
  parentCtx.lineJoin = 'round'
}

function startParentDraw(e) {
  parentDrawing = true
  parentDraw(e)
}

function parentDraw(e) {
  if (!parentDrawing) return
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
  if (!parentDrawing) return
  const canvas = parentCanvasRef.value
  const rect = canvas.getBoundingClientRect()
  const touch = e.touches[0]
  const x = (touch.clientX - rect.left) * (canvas.width / rect.width)
  const y = (touch.clientY - rect.top) * (canvas.height / rect.height)
  parentCtx.lineTo(x, y)
  parentCtx.stroke()
}

function stopParentDraw() {
  parentDrawing = false
  parentCtx.beginPath()
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

// 희망원 등록 제출
async function handleApply() {
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

  // 중복 신청 체크
  const isDuplicate = myApplications.value.some(
    ap => ap.univ_id === selectedUnivId.value && ap.round === currentRound.value && !ap.is_abandoned
  )
  if (isDuplicate) {
    formError.value = '해당 대학/전형에는 이미 접수된 신청서가 존재합니다.'
    return
  }

  submitLoading.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user.id

    // 1. 서명 파일 Storage 업로드
    const studentSigBlob = dataURLtoBlob(studentCanvasRef.value.toDataURL('image/png'))
    const parentSigBlob = dataURLtoBlob(parentCanvasRef.value.toDataURL('image/png'))

    const studentSigPath = `student_${userId}_r${currentRound.value}_u_${selectedUnivId.value}_student.png`
    const parentSigPath = `student_${userId}_r${currentRound.value}_u_${selectedUnivId.value}_parent.png`

    // 업로드 실행
    const { error: uploadErr1 } = await supabase.storage
      .from('signatures')
      .upload(studentSigPath, studentSigBlob, { contentType: 'image/png', upsert: true })
    if (uploadErr1) throw new Error('학생 서명 업로드에 실패했습니다.')

    const { error: uploadErr2 } = await supabase.storage
      .from('signatures')
      .upload(parentSigPath, parentSigBlob, { contentType: 'image/png', upsert: true })
    if (uploadErr2) throw new Error('학부모 서명 업로드에 실패했습니다.')

    // 퍼블릭 URL 획득
    const studentSigUrl = supabase.storage.from('signatures').getPublicUrl(studentSigPath).data.publicUrl
    const parentSigUrl = supabase.storage.from('signatures').getPublicUrl(parentSigPath).data.publicUrl

    // 2. applications 레코드 추가
    const { error: insertErr } = await supabase
      .from('applications')
      .insert({
        student_id: userId,
        univ_id: selectedUnivId.value,
        round: currentRound.value,
        department_name: departmentName.value,
        parent_name: parentName.value,
        parent_phone: parentPhone.value,
        student_signature_url: studentSigUrl
      })

    if (insertErr) {
      // 롤백용 스토리지 파일 삭제
      await supabase.storage.from('signatures').remove([studentSigPath, parentSigPath])
      throw insertErr
    }

    // 감사로그 기록
    try {
      await supabase.from('audit_logs').insert({
        actor_id: userId,
        action: 'APPLY',
        details: {
          univ_id: selectedUnivId.value,
          round: currentRound.value,
          department_name: departmentName.value
        }
      })
    } catch (e) {
      console.warn('감사 로그 작성 실패:', e)
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

// 신청 희망원 취소 (OPEN 라운드 전용)
async function handleCancelApplication(id) {
  if (!confirm('정말로 이 추천 희망원 신청을 취소하시겠습니까? 신청 내역과 서명 파일이 영구히 삭제됩니다.')) return
  
  submitLoading.value = true
  try {
    // 신청 건 조회하여 업로드된 서명 파일 경로 획득
    const ap = myApplications.value.find(item => item.id === id)
    if (!ap) return

    const { data: { user } } = await supabase.auth.getUser()
    const userId = user.id

    const studentSigPath = `student_${userId}_r${ap.round}_u_${ap.univ_id}_student.png`
    const parentSigPath = `student_${userId}_r${ap.round}_u_${ap.univ_id}_parent.png`

    // DB 삭제
    const { error: deleteErr } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)

    if (deleteErr) throw deleteErr

    // 스토리지 파일 삭제
    await supabase.storage.from('signatures').remove([studentSigPath, parentSigPath])

    // 감사로그 기록
    try {
      await supabase.from('audit_logs').insert({
        actor_id: userId,
        action: 'CANCEL_APPLICATION',
        details: {
          univ_id: ap.univ_id,
          round: ap.round,
          department_name: ap.department_name
        }
      })
    } catch (e) {
      console.warn('감사 로그 작성 실패:', e)
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

function handlePrint(ap) {
  const fullApp = {
    ...ap,
    name: auth.studentName,
    student_code: auth.studentCode
  }
  printApplicationForm(fullApp)
}

async function handleLogout() {
  await auth.logout()
}

onMounted(async () => {
  fetchSchoolName()
  await checkCurrentRound()
  await loadData()
  // Vue가 렌더링된 후 캔버스 초기화
  setTimeout(() => {
    initStudentCanvas()
    initParentCanvas()
  }, 300)
})
</script>
