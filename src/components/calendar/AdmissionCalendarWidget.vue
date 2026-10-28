<template>
  <div class="w-full space-y-8 no-print text-slate-800">

    <!-- 0. 대입 일정 섹션 상단 헤더 -->
    <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-slate-700/50">
      <!-- 배경 장식 글로우 -->
      <div class="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex items-center justify-between">
        <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5 m-0">
          <span>{{ calendarTitle }}</span>
        </h2>
      </div>
    </div>

    <!-- 0-1. 학생/학급 맞춤 대입일정 선택 바 (교사/관리자: 학급 및 학생 드롭다운 선택, 학생: 본인 맞춤 안내) -->
    <div
      v-if="auth.isStudent || ((auth.isTeacher || auth.isAdmin) && studentList.length > 0)"
      class="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <!-- 좌측: 모드 안내 타이틀 및 학생 정보 배지 -->
      <div class="flex flex-wrap items-center gap-2 sm:gap-3">
        <!-- 학생 모드일 때 (학생 로그인) -->
        <template v-if="auth.isStudent">
          <span class="px-3 py-1.5 rounded-xl text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 shadow-2xs">
            <span>👤</span>
            <span>{{ auth.studentName || '학생' }} 맞춤 대입일정</span>
          </span>
          <span class="text-xs text-slate-500 font-medium hidden sm:inline">
            (전체 학교 학사일정 + 본인 지원 대학 대입일정 표출)
          </span>
          <span v-if="activeStudentUniversities && activeStudentUniversities.length > 0" class="text-xs text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
            지원 대학 {{ activeStudentUniversities.length }}개교 연동
          </span>
        </template>

        <!-- 교사 / 관리자 모드일 때 -->
        <template v-else-if="auth.isTeacher || auth.isAdmin">
          <!-- 학급 선택 드롭다운 -->
          <div class="flex items-center gap-1.5">
            <label class="text-xs font-bold text-slate-600 shrink-0">학급:</label>
            <select
              v-model="selectedClass"
              @change="handleClassChange"
              class="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">전체 학급</option>
              <option v-for="cls in availableClasses" :key="cls" :value="cls">
                {{ cls }}반
              </option>
              <option value="GRAD">졸업생</option>
            </select>
          </div>

          <!-- 학생 선택 드롭다운 -->
          <div class="flex items-center gap-1.5">
            <label class="text-xs font-bold text-slate-600 shrink-0">학생:</label>
            <select
              v-model="selectedStudentId"
              class="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[130px]"
            >
              <option value="ALL">전체 학생</option>
              <option v-for="st in filteredStudentsForDropdown" :key="st.id" :value="st.id">
                [{{ st.student_code || `${st.class_no}반` }}] {{ st.name }}
              </option>
            </select>
          </div>

          <!-- 필터 적용 상태 뱃지 -->
          <div v-if="isStudentFilterActive && activeStudent" class="flex items-center gap-1.5">
            <span class="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
              ✨ {{ activeStudent.name }} (지원 대학 {{ (activeStudentUniversities || []).length }}개교)
            </span>
            <button
              @click="resetStudentFilter"
              class="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-200"
              title="전체 학생 일정으로 되돌리기"
            >
              전체 보기
            </button>
          </div>
        </template>


      </div>

      <!-- 우측: 등록된 지원 대학 툴팁/안내 -->
      <div v-if="isStudentFilterActive && activeStudentUniversities && activeStudentUniversities.length > 0" class="text-left md:text-right">
        <span class="text-[11px] text-slate-500 font-medium">
          지원 대학: <strong class="text-slate-800">{{ activeStudentUniversities.slice(0, 4).join(', ') }}{{ activeStudentUniversities.length > 4 ? ` 외 ${activeStudentUniversities.length - 4}개교` : '' }}</strong>
        </span>
      </div>
      <div v-else-if="isStudentFilterActive" class="text-left md:text-right">
        <span class="text-[11px] text-amber-600 font-medium">
          ※ 등록된 지원 대학이 없습니다. (학교 학사일정 및 전국 공통일정만 표시됩니다)
        </span>
      </div>
    </div>

    <!-- 1. 오늘의 입시일정 & 2. 주요 입시일정 (1:1 대칭 2열 그리드 배치) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- 1. 오늘의 입시일정 카드 (1/2 폭) -->
      <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <h3 class="text-base font-bold text-slate-900 m-0">오늘의 입시일정</h3>
          </div>
          <span class="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {{ todayFormatted }}
          </span>
        </div>

        <!-- 오늘 일정 목록 -->
        <div class="flex-1 space-y-3 overflow-y-auto max-h-[360px] pr-1">
          <!-- 0) 오늘의 학교 학사일정 -->
          <div v-if="todayAcademic.length > 0" class="space-y-1.5">
            <p class="text-[11px] font-bold text-sky-700 m-0 flex items-center gap-1">
              <span>🏫</span> 오늘 학교 학사일정 ({{ todayAcademic.length }}건)
            </p>
            <div
              v-for="(ac, idx) in todayAcademic"
              :key="idx"
              class="p-3 rounded-2xl bg-sky-50/90 border border-sky-200 text-xs text-sky-950 space-y-1"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="font-extrabold text-sky-950 text-xs whitespace-pre-line leading-relaxed">{{ ac.content }}</span>
                <span v-if="ac.hours" class="px-2 py-0.5 rounded-md bg-sky-200 text-sky-900 font-bold text-[10px] shrink-0">
                  {{ ac.hours }}시수
                </span>
              </div>
            </div>
          </div>

          <!-- 1) 오늘 진행 중인 주요일정 -->
          <div v-if="todayMajorEvents.length > 0" class="space-y-2">
            <p class="text-[11px] font-bold text-slate-600 m-0 flex items-center gap-1">
              <span>📌</span> 주요 입시일정
            </p>
            <div
              v-for="ev in todayMajorEvents"
              :key="ev.id"
              class="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs"
            >
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="font-extrabold text-emerald-900">{{ ev.title }}</span>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-200 text-emerald-950">
                  {{ ev.statusLabel }}
                </span>
              </div>
              <p class="text-[11px] text-emerald-800 m-0 leading-tight">
                기간: {{ ev.startDate }} ~ {{ ev.endDate }} {{ ev.time ? `(${ev.time})` : '' }}
              </p>
              <p v-if="ev.note" class="text-[11px] text-emerald-700/80 m-0 mt-1">
                비고: {{ ev.note }}
              </p>
            </div>
          </div>

          <!-- 2) 오늘 원서접수 마감 대학 (마감일인 경우) -->
          <div v-if="todayDeadlines.length > 0" class="space-y-1.5">
            <div class="flex items-center justify-between">
              <p class="text-[11px] font-bold text-rose-600 m-0 flex items-center gap-1">
                <span>⏰</span> 원서접수 마감 대학 ({{ todayDeadlines.length }}개교)
              </p>
              <button
                @click="openModalForDate(todayStr)"
                class="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                전체보기
              </button>
            </div>
            <div class="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1.5">
              <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                <span
                  v-for="(d, idx) in todayDeadlines.slice(0, 10)"
                  :key="idx"
                  class="px-2 py-1 rounded-lg bg-white border border-rose-200 text-[11px] font-bold shadow-2xs"
                >
                  {{ d.university }} <span class="text-rose-500 font-normal">({{ d.time }})</span>
                </span>
                <span v-if="todayDeadlines.length > 10" class="px-2 py-1 rounded-lg bg-rose-100 text-[11px] font-bold text-rose-700">
                  +{{ todayDeadlines.length - 10 }}개교 더보기
                </span>
              </div>
            </div>
          </div>

          <!-- 3) 오늘의 4년제 대학별 고사 -->
          <div v-if="todayFourYear && todayFourYear.items.length > 0" class="space-y-1.5">
            <div class="flex items-center justify-between">
              <p class="text-[11px] font-bold text-indigo-700 m-0 flex items-center gap-1">
                <span>🎓</span> 4년제 대학별 고사 ({{ todayFourYear.items.length }}건)
              </p>
              <button
                @click="openModalForDate(todayStr)"
                class="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                전체 {{ todayFourYear.items.length }}건 상세
              </button>
            </div>
            <div class="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950 space-y-2">
              <!-- 유형별 요약 태그 -->
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="(count, type) in todayFourYear.typeCounts"
                  :key="type"
                  class="px-2 py-0.5 rounded-md bg-indigo-200/80 text-indigo-900 text-[10px] font-black"
                >
                  {{ type }} {{ count }}건
                </span>
              </div>
              <ul class="text-[11px] space-y-1 m-0 p-0 list-none max-h-24 overflow-y-auto">
                <li
                  v-for="(item, idx) in todayFourYear.items.slice(0, 5)"
                  :key="idx"
                  class="truncate text-indigo-900 font-medium"
                >
                  • <strong class="font-bold">{{ item.university }}</strong>: [{{ item.type }}] {{ item.track }}
                </li>
              </ul>
              <div v-if="todayFourYear.items.length > 5" class="text-center pt-1 border-t border-indigo-200/50">
                <button
                  @click="openModalForDate(todayStr)"
                  class="text-[10px] font-bold text-indigo-700 hover:underline bg-transparent border-none cursor-pointer"
                >
                  외 {{ todayFourYear.items.length - 5 }}건 목록 확인하기 →
                </button>
              </div>
            </div>
          </div>

          <!-- 4) 오늘의 전문대 일정 -->
          <div v-if="todayJunior && todayJunior.items.length > 0" class="space-y-1.5">
            <div class="flex items-center justify-between">
              <p class="text-[11px] font-bold text-amber-700 m-0 flex items-center gap-1">
                <span>🏫</span> 전문대학 일정 ({{ todayJunior.items.length }}건)
              </p>
              <button
                @click="openModalForDate(todayStr)"
                class="text-[10px] font-bold text-amber-700 hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                상세보기
              </button>
            </div>
            <div class="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex flex-wrap gap-1">
              <span
                v-for="(count, type) in todayJunior.typeCounts"
                :key="type"
                class="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[10px] font-black"
              >
                {{ type }} {{ count }}건
              </span>
            </div>
          </div>

          <!-- 오늘 일정이 없을 때 -->
          <div
            v-if="todayMajorEvents.length === 0 && todayDeadlines.length === 0 && (!todayFourYear || todayFourYear.items.length === 0) && (!todayJunior || todayJunior.items.length === 0)"
            class="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200"
          >
            <span class="text-2xl mb-1 block">☕</span>
            <p class="text-xs font-bold text-slate-600 m-0">오늘은 예정된 대입 일정이 없습니다.</p>
            <p class="text-[11px] text-slate-400 mt-1 m-0">우측 주간 일정 또는 하단 월별 캘린더에서 다가오는 일정을 확인하세요.</p>
          </div>
        </div>
      </div>

      <!-- 2. 주요 입시일정 카드 (1/2 폭, 1:1 대칭 배치) -->
      <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div class="flex items-center gap-2">
            <span class="text-base">📌</span>
            <h3 class="text-base font-bold text-slate-900 m-0">주요 입시일정</h3>
            <span class="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
              전체 {{ allMajorScheduleList.length }}건
            </span>
          </div>

          <!-- 상태별 필터 탭 -->
          <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              @click="majorFilter = 'all'"
              :class="[
                'px-2.5 py-1 rounded-lg transition-all cursor-pointer border-none text-[11px] font-bold',
                majorFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800 bg-transparent'
              ]"
            >
              전체 ({{ allMajorScheduleList.length }})
            </button>
            <button
              type="button"
              @click="majorFilter = 'active'"
              :class="[
                'px-2.5 py-1 rounded-lg transition-all cursor-pointer border-none text-[11px] font-bold',
                majorFilter === 'active' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800 bg-transparent'
              ]"
            >
              진행·예정 ({{ majorActiveCount }})
            </button>
            <button
              type="button"
              @click="majorFilter = 'past'"
              :class="[
                'px-2.5 py-1 rounded-lg transition-all cursor-pointer border-none text-[11px] font-bold',
                majorFilter === 'past' ? 'bg-white text-slate-700 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800 bg-transparent'
              ]"
            >
              종료 ({{ majorPastCount }})
            </button>
          </div>
        </div>

        <!-- 주요 입시일정 전체 리스트 (스크롤) -->
        <div class="flex-1 space-y-2.5 overflow-y-auto max-h-[360px] pr-1.5">
          <div
            v-for="ev in filteredMajorScheduleList"
            :key="ev.id"
            @click="jumpToScheduleMonth(ev)"
            :class="[
              'p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer text-xs space-y-1.5 relative group',
              ev.isOngoing
                ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/20 shadow-2xs'
                : (ev.isUpcoming
                  ? 'bg-white hover:bg-blue-50/50 border-slate-200/90 hover:border-blue-300 shadow-2xs'
                  : 'bg-slate-50/70 border-slate-200/70 text-slate-500 opacity-80 hover:opacity-100')
            ]"
            title="클릭 시 해당 월 달력으로 이동 및 상세 보기"
          >
            <!-- 1행: 구분 태그 + 일정 명칭 + D-Day 배지 -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 min-w-0">
                <span
                  :class="[
                    'text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0',
                    ev.group === '일반대' ? 'bg-indigo-100 text-indigo-800' : (ev.group === '전문대' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200/80 text-slate-700')
                  ]"
                >
                  {{ ev.group }}
                </span>
                <span
                  :class="[
                    'font-black truncate text-xs sm:text-sm',
                    ev.isOngoing ? 'text-emerald-950 font-black' : (ev.isUpcoming ? 'text-slate-900' : 'text-slate-600')
                  ]"
                >
                  {{ ev.title }}
                </span>
              </div>

              <!-- D-Day 배지 -->
              <span
                :class="[
                  'text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 shadow-2xs whitespace-nowrap',
                  ev.isOngoing
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : (ev.isUpcoming ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600')
                ]"
              >
                {{ ev.dDayText }}
              </span>
            </div>

            <!-- 2행: 기간 및 시간 / 비고 / 달력 바로가기 안내 -->
            <div class="flex items-center justify-between gap-2 pt-0.5 text-[11px]">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span :class="ev.isOngoing ? 'text-emerald-800 font-bold' : (ev.isUpcoming ? 'text-slate-700 font-bold' : 'text-slate-400')">
                  📅 {{ ev.dateDisplay }} {{ ev.time ? `(${ev.time})` : '' }}
                </span>
                <span v-if="ev.note" :class="ev.isOngoing ? 'text-emerald-700/90' : 'text-slate-500'">
                  • {{ ev.note }}
                </span>
              </div>
              <span class="text-[10px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors shrink-0">
                달력 이동 ↗
              </span>
            </div>
          </div>

          <div
            v-if="filteredMajorScheduleList.length === 0"
            class="p-8 text-center text-xs text-slate-400 rounded-2xl bg-slate-50 border border-dashed border-slate-200"
          >
            해당 조건의 주요 입시일정이 없습니다.
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 월간 입시일정 (월별 캘린더 - 3단 그룹형 트랙) -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">

      <!-- 월간 헤더: 월 이동 + 12개월 퀵점프 버튼 + 범례 -->
      <div class="flex flex-col gap-4 pb-6 border-b border-slate-200">
        <!-- 상단 바: 좌측 네비게이션 (< 2026년 10월 > 이번달) & 우측 범례 -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <!-- 네비게이션: < 2026년 / 10월 > + 이번 달 -->
          <div class="flex items-center gap-2 sm:gap-3">
            <div class="flex items-center gap-1">
              <button
                @click="moveMonth(-1)"
                class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 transition-colors cursor-pointer shrink-0"
                title="이전 달"
              >
                ‹
              </button>
              <h3 class="text-center min-w-[70px] sm:min-w-[80px] m-0 px-1.5 leading-tight flex flex-col items-center justify-center">
                <span class="text-xs sm:text-sm font-bold text-slate-500 tracking-tight leading-none mb-1">{{ currentYear }}년</span>
                <span class="text-lg sm:text-2xl font-black text-slate-900 leading-none">{{ currentMonth }}월</span>
              </h3>
              <button
                @click="moveMonth(1)"
                class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 transition-colors cursor-pointer shrink-0"
                title="다음 달"
              >
                ›
              </button>
            </div>

            <button
              @click="jumpToToday"
              class="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              이번 달
            </button>
          </div>

          <!-- 3단 트랙 및 학사일정 범례 안내 -->
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-sky-500 shrink-0"></span>
              <span>🏫 학사일정</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-emerald-400 shrink-0"></span>
              <span>1단: 주요일정 (공통·원서)</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-indigo-500 shrink-0"></span>
              <span>2단: 4년제 (실기·면접·논술)</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-amber-500 shrink-0"></span>
              <span>3단: 전문대 일정</span>
            </div>
          </div>
        </div>

        <!-- 3월 ~ 차년도 2월 (총 12개월) 균등 너비 퀵점프 버튼 그리드 (5월, 8월 빈칸 포함 및 균일한 가로폭) -->
        <div class="w-full">
          <div class="grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-12 gap-1.5">
            <button
              v-for="qm in quickMonths"
              :key="qm.key"
              @click="setYearMonth(qm.year, qm.month)"
              :class="[
                'w-full h-[42px] px-1 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border flex flex-col items-center justify-center text-center',
                currentYear === qm.year && currentMonth === qm.month
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
              ]"
            >
              <span class="font-extrabold text-[11px] sm:text-xs leading-none whitespace-nowrap">{{ qm.label }}</span>
              <span class="text-[10px] opacity-70 whitespace-nowrap min-h-[14px] mt-0.5 flex items-center justify-center">
                {{ qm.desc || '\u00A0' }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- 요일 헤더 (일 ~ 토) -->
      <div class="grid grid-cols-7 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
        <div
          v-for="(w, idx) in ['일', '월', '화', '수', '목', '금', '토']"
          :key="w"
          :class="[
            'py-2.5 text-center text-xs font-black bg-slate-100',
            idx === 0 ? 'text-rose-600' : (idx === 6 ? 'text-blue-600' : 'text-slate-700')
          ]"
        >
          {{ w }}
        </div>
      </div>

      <!-- 캘린더 날짜 그리드 -->
      <div class="grid grid-cols-7 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
        <div
          v-for="cell in calendarCells"
          :key="cell.dateStr"
          @click="openModalForDate(cell.dateStr)"
          :class="[
            'p-1 sm:p-1.5 flex flex-col justify-start transition-all relative cursor-pointer select-none group',
            cell.isToday
              ? 'bg-sky-50/95 ring-2 ring-sky-400 border-2 border-sky-400 shadow-md z-10'
              : (cell.isCurrentMonth ? 'bg-white hover:bg-slate-50/80 border border-slate-200' : 'bg-slate-50/60 text-slate-400 border border-slate-200/70')
          ]"
          style="min-height: 232px;"
        >
          <!-- [Row 0] 날짜 번호 + 마감 배지 (고정 높이 22px) -->
          <div class="h-[22px] flex items-center justify-between mb-1 shrink-0 px-0.5">
            <div class="flex items-center gap-1.5">
              <span
                :class="[
                  'text-xs sm:text-sm font-extrabold w-6 h-6 flex items-center justify-center rounded-full leading-none',
                  cell.isToday ? 'bg-blue-600 text-white shadow-xs font-black' : '',
                  !cell.isToday && cell.dayOfWeek === 0 ? 'text-rose-600' : '',
                  !cell.isToday && cell.dayOfWeek === 6 ? 'text-blue-600' : '',
                  !cell.isToday && cell.dayOfWeek !== 0 && cell.dayOfWeek !== 6 && cell.isCurrentMonth ? 'text-slate-800' : ''
                ]"
              >
                {{ cell.dayNum }}
              </span>

              <!-- 오늘 태그 -->
              <span
                v-if="cell.isToday"
                class="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white leading-none shadow-2xs"
              >
                오늘
              </span>
            </div>

            <!-- 원서접수 마감 카운트 배지 -->
            <span
              v-if="cell.deadlineCount > 0"
              class="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200 animate-pulse"
              title="원서접수 마감 대학"
            >
              마감 {{ cell.deadlineCount }}개교
            </span>
          </div>

          <!-- ── 1-A. 학사일정 1행 (고정 높이 20px) ── -->
          <div class="h-[20px] mb-1 shrink-0 flex items-center overflow-hidden">
            <div
              v-if="cell.academicLines && cell.academicLines[0]"
              class="w-full h-full py-0.5 px-1.5 rounded text-[10px] sm:text-[11px] font-bold truncate flex items-center gap-1 border shadow-2xs"
              :class="cell.academicLines[0].badgeClass"
              :title="cell.academicSummary"
            >
              <span class="shrink-0">{{ cell.academicLines[0].icon }}</span>
              <span class="truncate">{{ cell.academicLines[0].text }}</span>
            </div>
            <div v-else class="w-full h-full"></div>
          </div>

          <!-- ── 1-B. 학사일정 2행 (고정 높이 20px) ── -->
          <div class="h-[20px] mb-1 shrink-0 flex items-center overflow-hidden">
            <div
              v-if="cell.academicLines && cell.academicLines[1]"
              class="w-full h-full py-0.5 px-1.5 rounded text-[10px] sm:text-[11px] font-bold truncate flex items-center gap-1 border shadow-2xs"
              :class="cell.academicLines[1].badgeClass"
              :title="cell.academicSummary"
            >
              <span class="shrink-0">{{ cell.academicLines[1].icon }}</span>
              <span class="truncate">{{ cell.academicLines[1].text }}</span>
            </div>
            <div v-else class="w-full h-full"></div>
          </div>

          <!-- ── 1-C. 학사일정 3행 (고정 높이 20px) ── -->
          <div class="h-[20px] mb-1 shrink-0 flex items-center overflow-hidden">
            <div
              v-if="cell.academicLines && cell.academicLines[2]"
              class="w-full h-full py-0.5 px-1.5 rounded text-[10px] sm:text-[11px] font-bold truncate flex items-center gap-1 border shadow-2xs"
              :class="cell.academicLines[2].badgeClass"
              :title="cell.academicSummary"
            >
              <span class="shrink-0">{{ cell.academicLines[2].icon }}</span>
              <span class="truncate">{{ cell.academicLines[2].text }}</span>
              <span v-if="cell.academicLines.length > 3" class="text-[9px] opacity-75 shrink-0 ml-auto">
                +{{ cell.academicLines.length - 3 }}
              </span>
            </div>
            <div v-else class="w-full h-full"></div>
          </div>

          <!-- ── 2. 주요일정 트랙 (항상 두 번째 줄, 고정 높이 22px) ── -->
          <div class="h-[22px] mb-1 shrink-0 flex items-center overflow-hidden">
            <template v-if="cell.majorRange">
              <!-- 시작일 또는 마감일: 텍스트 배지 (h-[20px]) -->
              <div
                v-if="cell.majorRange.isStart || cell.majorRange.isEnd"
                :class="[
                  'w-full h-[20px] px-1.5 text-[10px] sm:text-[11px] leading-tight font-extrabold flex items-center justify-between border shadow-2xs transition-all',
                  cell.majorRange.isStart ? 'rounded-l-md' : '',
                  cell.majorRange.isEnd ? 'rounded-r-md' : ''
                ]"
                :style="{
                  backgroundColor: cell.majorRange.palette.bg,
                  borderColor: cell.majorRange.palette.border,
                  color: cell.majorRange.palette.text
                }"
                :title="`${cell.majorRange.title} (${cell.majorRange.startDate} ~ ${cell.majorRange.endDate})`"
              >
                <!-- 시작일 텍스트 -->
                <span v-if="cell.majorRange.isStart" class="truncate font-black">
                  🟢 [시작] {{ cell.majorRange.title }}
                </span>
                <!-- 마감일 텍스트 -->
                <span v-else class="truncate font-black">
                  🔒 [마감] {{ cell.majorRange.title }} {{ cell.majorRange.time ? `(~${cell.majorRange.time})` : '' }}
                </span>
              </div>

              <!-- 중간 날짜: 절반 두께(10px)의 얇은 연속 기간 바 (차지하는 행 공간은 22px 유지) -->
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
                :title="`${cell.majorRange.title} (${cell.majorRange.startDate} ~ ${cell.majorRange.endDate})`"
              >
                <div
                  class="w-full h-[10px] border-y transition-all hover:brightness-95"
                  :style="{
                    backgroundColor: `${cell.majorRange.palette.bar}30`,
                    borderColor: cell.majorRange.palette.border
                  }"
                ></div>
              </div>
            </template>
            <template v-else-if="cell.singleMajorEvent">
              <!-- 단일일 주요일정 (수능 등) -->
              <div
                class="w-full h-full py-0.5 px-1.5 rounded-md text-[10px] sm:text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300 truncate flex items-center"
                :title="cell.singleMajorEvent.title"
              >
                🎯 {{ cell.singleMajorEvent.title }}
              </div>
            </template>
            <div v-else class="w-full h-full"></div>
          </div>

          <!-- ── 3. 4년제일정 [실기] 트랙 (항상 세 번째 줄, 고정 높이 20px) ── -->
          <div class="h-[20px] mb-1 shrink-0 flex items-center overflow-hidden">
            <div
              v-if="cell.fourYearData && cell.fourYearData.practicalCount > 0"
              class="w-full h-full py-0.5 px-1.5 rounded-md text-[10px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 truncate flex items-center justify-between"
              :title="`4년제 실기고사 총 ${cell.fourYearData.practicalCount}건`"
            >
              <span class="truncate">🟣 실기</span>
              <span class="text-[9px] font-black text-purple-700 shrink-0 ml-1">
                {{ cell.fourYearData.practicalCount }}건
              </span>
            </div>
            <div v-else class="w-full h-full"></div>
          </div>

          <!-- ── 4. 4년제일정 [면접] 트랙 (항상 네 번째 줄, 고정 높이 20px) ── -->
          <div class="h-[20px] mb-1 shrink-0 flex items-center overflow-hidden">
            <div
              v-if="cell.fourYearData && cell.fourYearData.interviewCount > 0"
              class="w-full h-full py-0.5 px-1.5 rounded-md text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 truncate flex items-center justify-between"
              :title="`4년제 면접고사 총 ${cell.fourYearData.interviewCount}건`"
            >
              <span class="truncate">🟣 면접</span>
              <span class="text-[9px] font-black text-indigo-700 shrink-0 ml-1">
                {{ cell.fourYearData.interviewCount }}건
              </span>
            </div>
            <div v-else class="w-full h-full"></div>
          </div>

          <!-- ── 5. 4년제일정 [기타/논술/합격] 트랙 (항상 다섯 번째 줄, 고정 높이 20px) ── -->
          <div class="h-[20px] mb-1 shrink-0 flex items-center overflow-hidden">
            <div
              v-if="cell.fourYearData && cell.fourYearData.otherCount > 0"
              class="w-full h-full py-0.5 px-1.5 rounded-md text-[10px] font-bold bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-200 truncate flex items-center justify-between"
              :title="cell.fourYearData.otherTitle"
            >
              <span class="truncate">🟣 {{ cell.fourYearData.otherLabel }}</span>
              <span class="text-[9px] font-black text-fuchsia-700 shrink-0 ml-1">
                {{ cell.fourYearData.otherCount }}건
              </span>
            </div>
            <div v-else class="w-full h-full"></div>
          </div>

          <!-- ── 6. 전문대일정 트랙 (항상 여섯 번째 줄, 고정 높이 22px) ── -->
          <div class="h-[22px] shrink-0 flex items-center overflow-hidden">
            <div
              v-if="cell.juniorData && cell.juniorData.items.length > 0"
              class="w-full h-full py-0.5 px-1.5 rounded-md text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 truncate flex items-center justify-between"
              :title="cell.juniorData.summaryTitle"
            >
              <span class="truncate">🟠 {{ cell.juniorData.compactSummary }}</span>
              <span class="text-[9px] font-black text-amber-700 shrink-0 ml-1">
                {{ cell.juniorData.items.length }}건
              </span>
            </div>
            <div v-else class="w-full h-full"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 날짜 클릭 상세 일정 모달 (팝오버 팝업) -->
    <div
      v-if="selectedDateModal"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      @click.self="selectedDateModal = null"
    >
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <!-- 모달 헤더 -->
        <div class="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📅</span>
            <div>
              <span class="text-xs text-blue-300 font-bold block">{{ activeModalCollegeYear }}학년도 대입 일정 상세</span>
              <h3 class="text-lg sm:text-xl font-black text-white m-0">
                {{ selectedDateModal.formattedLong }}
              </h3>
            </div>
          </div>
          <button
            @click="selectedDateModal = null"
            class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg cursor-pointer border-none"
          >
            ✕
          </button>
        </div>

        <!-- 모달 본문 (스크롤) -->
        <div class="p-6 space-y-6 overflow-y-auto flex-1">

          <!-- 학생 필터 적용 알림 배너 -->
          <div
            v-if="isStudentFilterActive && activeStudent"
            class="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-bold flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <span class="text-base">👤</span>
              <span><strong>{{ activeStudent.name }}</strong> 학생 지원 대학 맞춤 일정 표시 중</span>
            </div>
            <span class="text-[11px] font-extrabold text-blue-700 bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
              지원 대학 {{ (activeStudentUniversities || []).length }}개교
            </span>
          </div>

          <!-- 0) 학교 학사일정 섹션 -->
          <div v-if="selectedDateModal.academicItems && selectedDateModal.academicItems.length > 0">
            <h4 class="text-sm font-extrabold text-sky-900 mb-2 flex items-center gap-1.5">
              <span class="w-1.5 h-3.5 bg-sky-500 rounded-full"></span>
              학교 학사일정 (총 {{ selectedDateModal.academicItems.length }}건)
            </h4>
            <div class="space-y-2">
              <div
                v-for="(ac, idx) in selectedDateModal.academicItems"
                :key="idx"
                class="p-3.5 rounded-2xl bg-sky-50/90 border border-sky-200 text-xs text-sky-950 space-y-1.5"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="font-bold text-sm text-sky-950 whitespace-pre-line leading-relaxed">{{ ac.content }}</span>
                  <span v-if="ac.hours" class="px-2.5 py-0.5 rounded-md bg-sky-200 text-sky-900 font-extrabold text-[11px] shrink-0">
                    {{ ac.hours }}시간 수업
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 1) 주요일정 섹션 -->
          <div v-if="selectedDateModal.majorEvents.length > 0">
            <h4 class="text-sm font-extrabold text-slate-900 mb-2 flex items-center gap-1.5">
              <span class="w-1.5 h-3.5 bg-emerald-500 rounded-full"></span>
              주요 입시일정
            </h4>
            <div class="space-y-2">
              <div
                v-for="ev in selectedDateModal.majorEvents"
                :key="ev.id"
                class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold text-sm text-emerald-950">{{ ev.title }}</span>
                  <span class="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-black text-[11px]">
                    {{ ev.group }}
                  </span>
                </div>
                <p class="text-xs text-emerald-800 m-0">
                  기간: {{ ev.startDate }} ~ {{ ev.endDate }} {{ ev.time ? `(${ev.time})` : '' }}
                </p>
                <p v-if="ev.note" class="text-xs text-emerald-700 m-0 mt-1">
                  비고: {{ ev.note }}
                </p>
              </div>
            </div>
          </div>

          <!-- 2) 원서접수 마감 대학 섹션 -->
          <div v-if="selectedDateModal.deadlines.length > 0">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-extrabold text-rose-600 m-0 flex items-center gap-1.5">
                <span class="w-1.5 h-3.5 bg-rose-500 rounded-full"></span>
                원서접수 마감 대학 (총 {{ selectedDateModal.deadlines.length }}개교)
              </h4>
            </div>
            <div class="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 max-h-48 overflow-y-auto">
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div
                  v-for="(d, idx) in selectedDateModal.deadlines"
                  :key="idx"
                  class="p-2 bg-white rounded-xl border border-rose-200/80 text-xs shadow-2xs"
                >
                  <p class="font-bold text-slate-900 m-0 truncate">{{ d.university }}</p>
                  <p class="text-[11px] text-rose-600 font-extrabold m-0 mt-0.5">마감: {{ d.time }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 3) 4년제 대학별 고사 상세 리스트 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-extrabold text-indigo-900 m-0 flex items-center gap-1.5">
                <span class="w-1.5 h-3.5 bg-indigo-600 rounded-full"></span>
                4년제 대학별 고사 (총 {{ selectedDateModal.fourYearItems.length }}건)
              </h4>
              <!-- 검색창 -->
              <input
                v-if="selectedDateModal.fourYearItems.length > 5"
                v-model="modalFilterSearch"
                type="text"
                placeholder="대학명/전형 검색…"
                class="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              />
            </div>

            <div v-if="filteredFourYearItems.length > 0" class="border border-slate-200 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-slate-100 text-slate-700 sticky top-0 font-bold border-b border-slate-200 z-10 shadow-2xs">
                  <tr>
                    <th class="p-2.5 pl-3">구분</th>
                    <th class="p-2.5">대학명</th>
                    <th class="p-2.5">전형명</th>
                    <th class="p-2.5">시각/비고</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <template v-for="(item, idx) in filteredFourYearItems" :key="'fy_' + idx">
                    <tr class="hover:bg-slate-50 transition-colors">
                      <td class="p-2.5 pl-3 whitespace-nowrap">
                        <span class="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800">
                          {{ item.type }}
                        </span>
                      </td>
                      <td class="p-2.5 font-bold text-slate-900 whitespace-nowrap">
                        <button
                          v-if="canViewStudents"
                          @click="toggleRowAccordion(getItemRowKey(item, idx, 'fourYear'), item, 'univ')"
                          type="button"
                          class="inline-flex items-center gap-1.5 text-left font-bold text-indigo-950 hover:text-indigo-600 group cursor-pointer transition-colors bg-transparent border-none p-0"
                          :title="auth.isStudent ? '본인 지원 내역 확인' : '지원 학생 목록 보기 (대학 기준)'"
                        >
                          <span class="group-hover:underline underline-offset-2">{{ item.university }}</span>
                          <span
                            v-if="getApplicantCount(item, 'univ') > 0"
                            :class="[
                              'text-[10px] px-1.5 py-0.2 rounded-full font-extrabold flex items-center gap-0.5',
                              isRowExpanded(getItemRowKey(item, idx, 'fourYear'))
                                ? 'bg-indigo-600 text-white'
                                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            ]"
                          >
                            <span>👥</span>
                            <span>{{ getApplicantCount(item, 'univ') }}명</span>
                          </span>
                        </button>
                        <span v-else class="text-slate-900">{{ item.university }}</span>
                      </td>
                      <td class="p-2.5 text-slate-700">
                        <button
                          v-if="canViewStudents"
                          @click="toggleRowAccordion(getItemRowKey(item, idx, 'fourYear'), item, 'track')"
                          type="button"
                          class="inline-flex items-center gap-1.5 text-left text-slate-700 hover:text-indigo-600 group cursor-pointer transition-colors bg-transparent border-none p-0"
                          :title="auth.isStudent ? '본인 지원 전형 확인' : '이 전형 지원 학생만 필터링하여 보기'"
                        >
                          <span class="group-hover:underline underline-offset-2">{{ item.track || '-' }}</span>
                          <span
                            v-if="item.track && getApplicantCount(item, 'track') > 0 && getApplicantCount(item, 'track') !== getApplicantCount(item, 'univ')"
                            class="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 font-semibold"
                          >
                            {{ getApplicantCount(item, 'track') }}명
                          </span>
                        </button>
                        <span v-else>{{ item.track || '-' }}</span>
                      </td>
                      <td class="p-2.5 text-slate-500 text-[11px]">
                        <div class="flex items-center justify-between">
                          <span>{{ item.time ? `${item.time} ` : '' }}{{ item.note || '-' }}</span>
                          <!-- Expand toggle button -->
                          <button
                            v-if="canViewStudents && getApplicantCount(item, 'univ') > 0"
                            @click="toggleRowAccordion(getItemRowKey(item, idx, 'fourYear'), item, 'univ')"
                            type="button"
                            class="p-1 rounded hover:bg-slate-200/70 text-slate-400 hover:text-indigo-600 transition-colors ml-1 cursor-pointer border-none bg-transparent"
                            :title="isRowExpanded(getItemRowKey(item, idx, 'fourYear')) ? '접기' : '지원 학생 펼치기'"
                          >
                            <svg
                              :class="['w-3.5 h-3.5 transition-transform duration-200', isRowExpanded(getItemRowKey(item, idx, 'fourYear')) ? 'rotate-180 text-indigo-600' : '']"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    <!-- 4년제 아코디언 펼침 영역 -->
                    <tr v-if="isRowExpanded(getItemRowKey(item, idx, 'fourYear'))" class="bg-indigo-50/50">
                      <td colspan="4" class="p-3 border-t border-b border-indigo-100">
                        <div class="bg-white rounded-xl p-3 border border-indigo-100/90 shadow-2xs space-y-2.5">
                          <!-- Accordion Header: Filter Switcher & Role Badges -->
                          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <!-- Left: Target Info & Mode Buttons -->
                            <div class="flex flex-wrap items-center gap-1.5">
                              <span class="text-xs font-black text-indigo-950 flex items-center gap-1">
                                <span>🎓</span>
                                <span>{{ item.university }}</span>
                              </span>
                              <!-- Mode Switch Tabs -->
                              <div v-if="item.track && getApplicantCount(item, 'track') !== getApplicantCount(item, 'univ')" class="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px]">
                                <button
                                  @click="setRowExpandedMode(getItemRowKey(item, idx, 'fourYear'), 'univ')"
                                  :class="[
                                    'px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer border-none',
                                    getRowExpandedMode(getItemRowKey(item, idx, 'fourYear')) === 'univ' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900 bg-transparent'
                                  ]"
                                >
                                  대학 전체 ({{ getApplicantCount(item, 'univ') }}명)
                                </button>
                                <button
                                  @click="setRowExpandedMode(getItemRowKey(item, idx, 'fourYear'), 'track')"
                                  :class="[
                                    'px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer border-none',
                                    getRowExpandedMode(getItemRowKey(item, idx, 'fourYear')) === 'track' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900 bg-transparent'
                                  ]"
                                >
                                  해당 전형만 ({{ getApplicantCount(item, 'track') }}명)
                                </button>
                              </div>
                              <span v-else class="text-[11px] text-slate-500 font-medium">
                                (지원자 총 {{ getApplicantCount(item, 'univ') }}명)
                              </span>
                            </div>

                            <!-- Right: Role & Masking Control / Close -->
                            <div class="flex items-center gap-2">
                              <!-- Admin Mask Mode Toggle Button -->
                              <div v-if="auth.isAdmin" class="flex items-center gap-1">
                                <button
                                  @click="cycleAdminMaskMode"
                                  type="button"
                                  class="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                                  title="클릭하여 마스킹 단계 변경 (1단계: **동 / 2단계: 홍*동 / 3단계: 홍길동)"
                                >
                                  <span>{{ adminMaskMode === 0 ? '🔒' : (adminMaskMode === 1 ? '🔓' : '👁️') }}</span>
                                  <span>마스킹: {{ adminMaskMode === 0 ? '1단계(**동)' : (adminMaskMode === 1 ? '2단계(홍*동)' : '3단계(전체)') }}</span>
                                </button>
                              </div>
                              <!-- Teacher Info -->
                              <div v-else-if="auth.isTeacher" class="text-[10px] text-slate-500 font-medium flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                <span>🔒</span> 교사 모드 (이름 마스킹 보호)
                              </div>
                              <!-- Student Info -->
                              <div v-else-if="auth.isStudent" class="text-[10px] text-blue-700 font-bold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                <span>👤</span> 본인 지원 내역
                              </div>

                              <!-- Close Button -->
                              <button
                                @click="toggleRowAccordion(getItemRowKey(item, idx, 'fourYear'), item, 'univ')"
                                type="button"
                                class="text-[10px] text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100 cursor-pointer border-none bg-transparent"
                                title="접기"
                              >
                                ✕ 닫기
                              </button>
                            </div>
                          </div>

                          <!-- Accordion Body: Student List Table or Notice -->
                          <!-- Case 1: Student Role -->
                          <template v-if="auth.isStudent">
                            <div v-if="getVisibleStudents(item, getRowExpandedMode(getItemRowKey(item, idx, 'fourYear'))).length > 0" class="space-y-2">
                              <div
                                v-for="(myApp, mIdx) in getVisibleStudents(item, getRowExpandedMode(getItemRowKey(item, idx, 'fourYear')))"
                                :key="mIdx"
                                class="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                              >
                                <div class="space-y-0.5">
                                  <div class="flex items-center gap-2">
                                    <span class="font-extrabold text-blue-900 text-xs">👤 {{ myApp.name }} (본인)</span>
                                    <span class="text-[11px] text-blue-700 font-medium">3학년 {{ myApp.classNum }}반 {{ myApp.studentNum }}번</span>
                                  </div>
                                  <p class="m-0 text-slate-700 text-xs">
                                    모집단위: <strong class="text-slate-900">{{ myApp.dept || '-' }}</strong> 
                                    <span class="text-slate-400 mx-1">|</span>
                                    전형: <strong class="text-slate-900">{{ myApp.admissionDetailType || myApp.admissionMajorType || '-' }}</strong>
                                  </p>
                                </div>
                                <div class="shrink-0 text-right">
                                  <span class="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-600 text-white">
                                    {{ myApp.finalStage || myApp.stage1 || '원서 접수 완료' }}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div v-else class="p-3 text-center rounded-xl bg-slate-50 text-slate-500 text-xs">
                              <span>ℹ️</span> 회원님(본인)의 해당 대학/전형 지원 내역이 없습니다. (타 학생의 지원 정보는 보호를 위해 비공개됩니다)
                            </div>
                          </template>

                          <!-- Case 2: Teacher or Admin Role -->
                          <template v-else>
                            <div v-if="getVisibleStudents(item, getRowExpandedMode(getItemRowKey(item, idx, 'fourYear'))).length > 0" class="overflow-x-auto rounded-xl border border-indigo-200/70 bg-white shadow-2xs">
                              <table class="w-full text-left text-xs border-collapse">
                                <thead class="bg-indigo-50/70 text-indigo-950 font-bold border-b border-indigo-100">
                                  <tr>
                                    <th class="p-2 pl-3">학급/번호</th>
                                    <th class="p-2">이름</th>
                                    <th class="p-2">모집단위(학과)</th>
                                    <th class="p-2">지원 전형</th>
                                    <th class="p-2 text-center pr-3">전형결과</th>
                                  </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                  <tr 
                                    v-for="(stApp, sIdx) in getVisibleStudents(item, getRowExpandedMode(getItemRowKey(item, idx, 'fourYear')))" 
                                    :key="sIdx"
                                    class="hover:bg-slate-50/80 transition-colors"
                                  >
                                    <td class="p-2 pl-3 whitespace-nowrap text-slate-600 font-medium">
                                      <span v-if="stApp.isGraduate" class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">졸업생</span>
                                      <span v-else class="text-slate-700 font-bold">{{ stApp.classNum }}반 {{ stApp.studentNum }}번</span>
                                    </td>
                                    <td class="p-2 whitespace-nowrap font-bold text-slate-900">
                                      {{ getDisplayStudentName(stApp) }}
                                    </td>
                                    <td class="p-2 text-slate-800 font-medium">{{ stApp.dept || '-' }}</td>
                                    <td class="p-2 text-slate-600 text-[11px]">
                                      <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                        {{ stApp.admissionDetailType || stApp.admissionMajorType || '-' }}
                                      </span>
                                    </td>
                                    <td class="p-2 pr-3 text-center whitespace-nowrap">
                                      <span 
                                        v-if="stApp.stage1 || stApp.finalStage"
                                        :class="[
                                          'px-2 py-0.5 rounded-full text-[10px] font-extrabold',
                                          (stApp.stage1 === '합격' || stApp.finalStage === '합격' || String(stApp.finalStage).includes('최초합') || String(stApp.finalStage).includes('충원합'))
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : (stApp.stage1 === '불합격' || stApp.finalStage === '불합격')
                                              ? 'bg-rose-100 text-rose-800'
                                              : 'bg-indigo-100 text-indigo-800'
                                        ]"
                                      >
                                        {{ stApp.finalStage || stApp.stage1 }}
                                      </span>
                                      <span v-else class="text-slate-400 text-[11px]">-</span>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div v-else class="p-3 text-center rounded-xl bg-slate-50 text-slate-500 text-xs">
                              <span>ℹ️</span> 해당 조건에 맞는 지원 학생이 없습니다.
                              <span 
                                v-if="getRowExpandedMode(getItemRowKey(item, idx, 'fourYear')) === 'track' && getApplicantCount(item, 'univ') > 0" 
                                class="ml-1 text-indigo-600 font-bold cursor-pointer underline" 
                                @click="setRowExpandedMode(getItemRowKey(item, idx, 'fourYear'), 'univ')"
                              >
                                [이 대학 전체 지원자 ({{ getApplicantCount(item, 'univ') }}명) 보기]
                              </span>
                            </div>
                          </template>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
            <div v-else-if="selectedDateModal.fourYearItems.length > 0" class="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              검색 조건에 맞는 대학이 없습니다.
            </div>
            <div v-else class="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              해당 날짜에 등록된 4년제 대학별 고사 일정이 없습니다.
            </div>
          </div>

          <!-- 4) 전문대 일정 상세 리스트 -->
          <div v-if="selectedDateModal.juniorItems.length > 0">
            <h4 class="text-sm font-extrabold text-amber-900 mb-2 flex items-center gap-1.5">
              <span class="w-1.5 h-3.5 bg-amber-600 rounded-full"></span>
              전문대학 일정 (총 {{ selectedDateModal.juniorItems.length }}건)
            </h4>
            <div class="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-slate-100 text-slate-700 sticky top-0 font-bold border-b border-slate-200 z-10 shadow-2xs">
                  <tr>
                    <th class="p-2.5 pl-3">구분</th>
                    <th class="p-2.5">대학명</th>
                    <th class="p-2.5">모집시기</th>
                    <th class="p-2.5">비고</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <template v-for="(item, idx) in selectedDateModal.juniorItems" :key="'jr_' + idx">
                    <tr class="hover:bg-slate-50 transition-colors">
                      <td class="p-2.5 pl-3 whitespace-nowrap">
                        <span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800">
                          {{ item.type }}
                        </span>
                      </td>
                      <td class="p-2.5 font-bold text-slate-900 whitespace-nowrap">
                        <button
                          v-if="canViewStudents"
                          @click="toggleRowAccordion(getItemRowKey(item, idx, 'junior'), item, 'univ')"
                          type="button"
                          class="inline-flex items-center gap-1.5 text-left font-bold text-amber-950 hover:text-amber-600 group cursor-pointer transition-colors bg-transparent border-none p-0"
                          :title="auth.isStudent ? '본인 지원 내역 확인' : '지원 학생 목록 보기'"
                        >
                          <span class="group-hover:underline underline-offset-2">{{ item.university }}</span>
                          <span
                            v-if="getApplicantCount(item, 'univ') > 0"
                            :class="[
                              'text-[10px] px-1.5 py-0.2 rounded-full font-extrabold flex items-center gap-0.5',
                              isRowExpanded(getItemRowKey(item, idx, 'junior'))
                                ? 'bg-amber-600 text-white'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            ]"
                          >
                            <span>👥</span>
                            <span>{{ getApplicantCount(item, 'univ') }}명</span>
                          </span>
                        </button>
                        <span v-else class="text-slate-900">{{ item.university }}</span>
                      </td>
                      <td class="p-2.5 text-slate-700">{{ item.round }}</td>
                      <td class="p-2.5 text-slate-500 text-[11px]">
                        <div class="flex items-center justify-between">
                          <span>{{ item.note || '-' }}</span>
                          <button
                            v-if="canViewStudents && getApplicantCount(item, 'univ') > 0"
                            @click="toggleRowAccordion(getItemRowKey(item, idx, 'junior'), item, 'univ')"
                            type="button"
                            class="p-1 rounded hover:bg-slate-200/70 text-slate-400 hover:text-amber-700 transition-colors ml-1 cursor-pointer border-none bg-transparent"
                            :title="isRowExpanded(getItemRowKey(item, idx, 'junior')) ? '접기' : '지원 학생 펼치기'"
                          >
                            <svg
                              :class="['w-3.5 h-3.5 transition-transform duration-200', isRowExpanded(getItemRowKey(item, idx, 'junior')) ? 'rotate-180 text-amber-600' : '']"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    <!-- 전문대 아코디언 펼침 영역 -->
                    <tr v-if="isRowExpanded(getItemRowKey(item, idx, 'junior'))" class="bg-amber-50/50">
                      <td colspan="4" class="p-3 border-t border-b border-amber-100">
                        <div class="bg-white rounded-xl p-3 border border-amber-100/90 shadow-2xs space-y-2.5">
                          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span class="text-xs font-black text-amber-950 flex items-center gap-1">
                              <span>🎓</span>
                              <span>{{ item.university }} 지원 학생 (총 {{ getApplicantCount(item, 'univ') }}명)</span>
                            </span>
                            <div class="flex items-center gap-2">
                              <!-- Admin Masking toggle -->
                              <button
                                v-if="auth.isAdmin"
                                @click="cycleAdminMaskMode"
                                type="button"
                                class="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span>{{ adminMaskMode === 0 ? '🔒' : (adminMaskMode === 1 ? '🔓' : '👁️') }}</span>
                                <span>마스킹: {{ adminMaskMode === 0 ? '1단계' : (adminMaskMode === 1 ? '2단계' : '3단계') }}</span>
                              </button>
                              <button
                                @click="toggleRowAccordion(getItemRowKey(item, idx, 'junior'), item, 'univ')"
                                type="button"
                                class="text-[10px] text-slate-400 hover:text-slate-700 cursor-pointer border-none bg-transparent"
                              >
                                ✕ 닫기
                              </button>
                            </div>
                          </div>

                          <!-- 학생 역할 -->
                          <template v-if="auth.isStudent">
                            <div v-if="getVisibleStudents(item, 'univ').length > 0" class="space-y-1.5">
                              <div
                                v-for="(myApp, mIdx) in getVisibleStudents(item, 'univ')"
                                :key="mIdx"
                                class="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs flex justify-between items-center"
                              >
                                <div>
                                  <span class="font-extrabold text-amber-950">👤 {{ myApp.name }} (본인)</span>
                                  <span class="text-slate-600 ml-2">모집단위: {{ myApp.dept || '-' }}</span>
                                </div>
                                <span class="font-bold text-amber-800">{{ myApp.finalStage || '접수' }}</span>
                              </div>
                            </div>
                            <div v-else class="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                              회원님(본인)의 지원 내역이 없습니다.
                            </div>
                          </template>

                          <!-- 교사 / 관리자 역할 -->
                          <template v-else>
                            <div v-if="getVisibleStudents(item, 'univ').length > 0" class="overflow-x-auto rounded-xl border border-amber-200/60 bg-white">
                              <table class="w-full text-left text-xs border-collapse">
                                <thead class="bg-amber-50 text-amber-950 font-bold border-b border-amber-100">
                                  <tr>
                                    <th class="p-2 pl-3">학급/번호</th>
                                    <th class="p-2">이름</th>
                                    <th class="p-2">모집단위(학과)</th>
                                    <th class="p-2">전형결과</th>
                                  </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                  <tr v-for="(stApp, sIdx) in getVisibleStudents(item, 'univ')" :key="sIdx" class="hover:bg-slate-50">
                                    <td class="p-2 pl-3 whitespace-nowrap text-slate-600 font-medium">
                                      {{ stApp.isGraduate ? '졸업생' : `${stApp.classNum}반 ${stApp.studentNum}번` }}
                                    </td>
                                    <td class="p-2 font-bold text-slate-900 whitespace-nowrap">{{ getDisplayStudentName(stApp) }}</td>
                                    <td class="p-2 text-slate-800">{{ stApp.dept || '-' }}</td>
                                    <td class="p-2 text-slate-600">{{ stApp.finalStage || stApp.stage1 || '-' }}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div v-else class="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                              지원 학생 데이터가 없습니다.
                            </div>
                          </template>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- 모달 푸터 -->
        <div class="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            @click="selectedDateModal = null"
            class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer border-none"
          >
            닫기
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchAdmissionCalendarData } from '../../services/admissionCalendarService.js'
import defaultCalendarData from '../../data/admissionCalendarDefault.json'
import { useAuthStore } from '../../stores/auth.js'
import { supabase } from '../../utils/supabaseClient.js'
import { decryptText } from '../../utils/cryptoUtils.js'
import rawAppsData from '../../stat/data/applications.json'
import { 
  getApplicationsForAcademicYear, 
  maskName, 
  adminMaskMode, 
  cycleAdminMaskMode, 
  MASK_MODES 
} from '../../stat/composables/useStatData.js'

const auth = useAuthStore()

const loading = ref(false)
const rawData = ref(defaultCalendarData)

// ── 학급 및 학생별 대입일정 맞춤 필터 상태 ────────────────────────
const selectedClass = ref('ALL') // 'ALL' | 1 | 2 ... | 'GRAD'
const selectedStudentId = ref('ALL') // 'ALL' | student id / student_code
const studentList = ref([])
const studentApplicationsMap = ref(new Map()) // studentKey or studentId -> Set of applied univ names
const isLoadingStudents = ref(false)

const availableClasses = computed(() => {
  const classes = new Set()
  studentList.value.forEach(s => {
    if (s.is_enrolled && s.class_no) {
      classes.add(Number(s.class_no))
    }
  })
  const sorted = Array.from(classes).sort((a, b) => a - b)
  return sorted.length > 0 ? sorted : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
})

const filteredStudentsForDropdown = computed(() => {
  if (selectedClass.value === 'ALL') {
    return studentList.value
  }
  if (selectedClass.value === 'GRAD') {
    return studentList.value.filter(s => !s.is_enrolled)
  }
  return studentList.value.filter(s => s.is_enrolled && Number(s.class_no) === Number(selectedClass.value))
})

function handleClassChange() {
  selectedStudentId.value = 'ALL'
}

function resetStudentFilter() {
  selectedClass.value = 'ALL'
  selectedStudentId.value = 'ALL'
}

const activeStudent = computed(() => {
  if (auth.isStudent) {
    const found = studentList.value.find(s => 
      (auth.studentCode && s.student_code === auth.studentCode) ||
      (auth.studentName && s.name === auth.studentName) ||
      (auth.userId && s.id === auth.userId)
    )
    if (found) return found
    return {
      id: auth.studentCode || 'student',
      student_code: auth.studentCode || '',
      name: auth.studentName || '학생',
      grade: auth.grade || 3,
      class_no: auth.classNo || 1,
      seq_no: auth.seqNo || 1,
      is_enrolled: auth.isEnrolled !== false
    }
  }

  if (selectedStudentId.value && selectedStudentId.value !== 'ALL') {
    return studentList.value.find(s => s.id === selectedStudentId.value || s.student_code === selectedStudentId.value) || null
  }

  return null
})

const activeStudentUniversities = computed(() => {
  if (!activeStudent.value) return null
  const st = activeStudent.value
  const set = new Set()

  if (st.id && studentApplicationsMap.value.has(st.id)) {
    studentApplicationsMap.value.get(st.id).forEach(u => set.add(u))
  }
  if (st.student_code && studentApplicationsMap.value.has(st.student_code)) {
    studentApplicationsMap.value.get(st.student_code).forEach(u => set.add(u))
  }
  if (st.name && studentApplicationsMap.value.has(st.name)) {
    studentApplicationsMap.value.get(st.name).forEach(u => set.add(u))
  }

  return Array.from(set)
})

const isStudentFilterActive = computed(() => {
  return activeStudent.value !== null
})

const ALIAS_MAP = {
  '인하공전': '인하공업',
  '동양미래': '동양미래',
  '명지전문': '명지전문',
  '한양여대': '한양여자',
  '숭의여대': '숭의여자',
  '배화여대': '배화여자',
  '카이스트': 'KAIST',
  '지스트': 'GIST',
  '유니스트': 'UNIST',
  '디지스트': 'DGIST',
  '켄텍': '한국에너지공과'
}

function cleanUniName(name) {
  let s = String(name || '').trim()
  for (const [alias, real] of Object.entries(ALIAS_MAP)) {
    if (s.includes(alias)) {
      s = s.replace(alias, real)
    }
  }
  return s
    .replace(/\([^)]*\)/g, '')
    .replace(/대학교|전문대학|전문대|대학|대$/g, '')
    .replace(/[\s\-_]/g, '')
    .trim()
}

function isUniversityMatch(eventUni, appliedUnivList) {
  if (!eventUni || !appliedUnivList || appliedUnivList.length === 0) return false
  const cleanEvent = cleanUniName(eventUni)
  if (!cleanEvent) return false

  for (const appUni of appliedUnivList) {
    const cleanApp = cleanUniName(appUni)
    if (!cleanApp) continue
    if (cleanEvent === cleanApp) return true
    if (cleanEvent.length >= 2 && cleanApp.length >= 2) {
      if (cleanEvent.includes(cleanApp) || cleanApp.includes(cleanEvent)) {
        return true
      }
    }
  }
  return false
}

async function loadStudentsAndApplications() {
  isLoadingStudents.value = true
  try {
    const list = []
    const appsMap = new Map()

    // 1. enrolled_students 조회 (Supabase)
    if (supabase) {
      try {
        const { data: enrolledData, error } = await supabase
          .from('enrolled_students')
          .select('id, student_code, name, grade, class_no, student_no, seq_no, is_enrolled')
          .order('is_enrolled', { ascending: false })
          .order('grade', { ascending: true })
          .order('class_no', { ascending: true })
          .order('student_no', { ascending: true })

        if (!error && enrolledData && enrolledData.length > 0) {
          for (const s of enrolledData) {
            const decName = await decryptText(s.name)
            list.push({
              id: s.id,
              student_code: s.student_code || '',
              name: decName || '이름 없음',
              grade: s.grade || 3,
              class_no: s.class_no || 1,
              seq_no: s.student_no || s.seq_no || 1,
              is_enrolled: s.is_enrolled !== false
            })
          }
        }
      } catch (e) {
        console.warn('Failed to load enrolled_students from Supabase:', e)
      }
    }

    // 2. stat applications.json 보강 (동적 import)
    try {
      const statModule = await import('../../stat/data/applications.json')
      const rawApps = statModule.default || []
      
      if (list.length === 0 && rawApps.length > 0) {
        const seen = new Set()
        for (const a of rawApps) {
          const key = `${a.grade || 3}-${a.classNum || 1}-${a.studentNum || 1}_${a.name}`
          if (!seen.has(key)) {
            seen.add(key)
            const sCode = `${a.grade || 3}${String(a.classNum || 1).padStart(2, '0')}${String(a.studentNum || 1).padStart(2, '0')}`
            list.push({
              id: sCode,
              student_code: sCode,
              name: a.name,
              grade: a.grade || 3,
              class_no: a.classNum || 1,
              seq_no: a.studentNum || 1,
              is_enrolled: !a.isGraduate
            })
          }
        }
      }

      for (const a of rawApps) {
        if (!a.name || !a.univName) continue
        const sKey = a.name
        if (!appsMap.has(sKey)) appsMap.set(sKey, new Set())
        appsMap.get(sKey).add(a.univName)
      }
    } catch (e) {
      console.warn('Stat applications loading skipped or error:', e)
    }

    // 3. Supabase 추천 시스템 지원 데이터 결합
    if (supabase) {
      try {
        const [{ data: apps }, { data: rurals }, { data: juniors }] = await Promise.all([
          supabase.from('applications').select('student_id, universities(univ_name)'),
          supabase.from('rural_applications').select('student_id, univ_name'),
          supabase.from('junior_college_recommendations').select('student_id, student_code, university_name')
        ])

        if (apps) {
          for (const ap of apps) {
            const uName = ap.universities?.univ_name
            if (ap.student_id && uName) {
              if (!appsMap.has(ap.student_id)) appsMap.set(ap.student_id, new Set())
              appsMap.get(ap.student_id).add(uName)
            }
          }
        }

        if (rurals) {
          for (const ru of rurals) {
            if (ru.student_id && ru.univ_name) {
              if (!appsMap.has(ru.student_id)) appsMap.set(ru.student_id, new Set())
              appsMap.get(ru.student_id).add(ru.univ_name)
            }
          }
        }

        if (juniors) {
          for (const jn of juniors) {
            if (jn.university_name) {
              if (jn.student_id) {
                if (!appsMap.has(jn.student_id)) appsMap.set(jn.student_id, new Set())
                appsMap.get(jn.student_id).add(jn.university_name)
              }
              if (jn.student_code) {
                if (!appsMap.has(jn.student_code)) appsMap.set(jn.student_code, new Set())
                appsMap.get(jn.student_code).add(jn.university_name)
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load application tables from Supabase:', e)
      }
    }

    studentList.value = list
    studentApplicationsMap.value = appsMap

    // 4. 학생으로 로그인된 경우 본인으로 자동 초기화
    if (auth.isStudent) {
      if (auth.classNo) selectedClass.value = auth.classNo
      const matched = list.find(s => 
        (auth.studentCode && s.student_code === auth.studentCode) ||
        (auth.studentName && s.name === auth.studentName) ||
        (auth.userId && s.id === auth.userId)
      )
      if (matched) {
        selectedStudentId.value = matched.id
      } else {
        selectedStudentId.value = auth.studentCode || auth.studentName || 'STUDENT'
      }
    }
  } catch (err) {
    console.error('loadStudentsAndApplications error:', err)
  } finally {
    isLoadingStudents.value = false
  }
}

// 캘린더 네비게이션 상태 (기본 2026년 9월 또는 현재 시점)
const now = new Date()
// 만약 현재 연도가 2026~2027 범위 밖이면 대입 메인 기간인 2026년 9월 기본 표시
const initYear = (now.getFullYear() === 2026 || now.getFullYear() === 2027) ? now.getFullYear() : 2026
const initMonth = (now.getFullYear() === 2026 || now.getFullYear() === 2027) ? (now.getMonth() + 1) : 9

const currentYear = ref(initYear)
const currentMonth = ref(initMonth)

// 현재 화면에 표시 중인 연/월 기준 학년도 및 대입 학년도 계산
const activeViewSchoolYear = computed(() => {
  const y = currentYear.value
  const m = currentMonth.value
  return m >= 3 ? y : y - 1
})
const activeViewCollegeYear = computed(() => activeViewSchoolYear.value + 1)

// 오늘 날짜 기준 현 학년도 및 대입 학년도 동적 계산 (3월 1일 ~ 이듬해 2월 말일 기준)
const schoolAcademicYear = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  return m >= 3 ? y : y - 1
})
const collegeAdmissionYear = computed(() => schoolAcademicYear.value + 1)
const calendarTitle = computed(() => `${activeViewSchoolYear.value}학년도 학사일정 & ${activeViewCollegeYear.value}대입 캘린더`)

/**
 * 캘린더 날짜(YYYY-MM-DD) 기준 대입 학년도 계산
 * 한국 학사일정: 3월 1일 ~ 이듬해 2월 말일이 동일 고3 대입학년도에 해당 (예: 2026.03 ~ 2027.02 -> 2027학년도 대입)
 */
function getCollegeAdmissionYearFromDate(dateStr) {
  if (!dateStr) return '2027'
  const parts = String(dateStr).split('-')
  if (parts.length < 2) return '2027'
  const y = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (isNaN(y) || isNaN(m)) return '2027'
  const schoolYear = m >= 3 ? y : y - 1
  return String(schoolYear + 1)
}

// 캘린더 전용 학년도별 대입 지원 데이터 캐시 (기본 2027학년도 원자료 탑재)
// 종합 대시보드(StatView)의 연도 필터 변경에 영향을 받지 않고 독립 관리됨
const calendarYearApplicationsMap = ref({
  '2027': rawAppsData || []
})
const currentModalAdmissionYear = ref('2027')


// 오늘 날짜 문자열
const todayStr = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${date}`
})

const todayFormatted = computed(() => {
  const d = new Date()
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
})

// 3월 ~ 차년도 2월 (총 12개월) 균등 퀵점프 리스트 (5월, 8월 빈칸 포함)
const quickMonths = computed(() => {
  const y1 = schoolAcademicYear.value
  const y2 = collegeAdmissionYear.value
  const s1 = String(y1).slice(2)
  const s2 = String(y2).slice(2)

  return [
    { key: `${y1}-03`, year: y1, month: 3, label: `${s1}년 3월`, desc: '개학·학평' },
    { key: `${y1}-04`, year: y1, month: 4, label: `${s1}년 4월`, desc: '1차지필' },
    { key: `${y1}-05`, year: y1, month: 5, label: `${s1}년 5월`, desc: '' },
    { key: `${y1}-06`, year: y1, month: 6, label: `${s1}년 6월`, desc: '모평·2차' },
    { key: `${y1}-07`, year: y1, month: 7, label: `${s1}년 7월`, desc: '방학식' },
    { key: `${y1}-08`, year: y1, month: 8, label: `${s1}년 8월`, desc: '' },
    { key: `${y1}-09`, year: y1, month: 9, label: `${s1}년 9월`, desc: '수시원서·모평' },
    { key: `${y1}-10`, year: y1, month: 10, label: `${s1}년 10월`, desc: '면접·1차' },
    { key: `${y1}-11`, year: y1, month: 11, label: `${s1}년 11월`, desc: '수능·2차원서' },
    { key: `${y1}-12`, year: y1, month: 12, label: `${s1}년 12월`, desc: '합격·등록' },
    { key: `${y2}-01`, year: y2, month: 1, label: `${s2}년 1월`, desc: '정시·졸업' },
    { key: `${y2}-02`, year: y2, month: 2, label: `${s2}년 2월`, desc: '정시발표·등록' },
  ]
})

const currentYearMonthLabel = computed(() => {
  return `${currentYear.value}년 ${currentMonth.value}월`
})

// ── 데이터 로딩 ───────────────────────────────────────────────
async function refreshData(force = false) {
  loading.value = true
  try {
    const res = await fetchAdmissionCalendarData({ forceRefresh: force })
    if (res && res.academicByDate && Object.keys(res.academicByDate).length > 0) {
      rawData.value = res
    }
  } catch (err) {
    console.error('Admission data fetch failed:', err)
  } finally {
    loading.value = false
  }
}

// ── 네비게이션 제어 함수 ──────────────────────────────────────
function moveMonth(delta) {
  let m = currentMonth.value + delta
  let y = currentYear.value
  if (m < 1) {
    m = 12
    y -= 1
  } else if (m > 12) {
    m = 1
    y += 1
  }
  currentYear.value = y
  currentMonth.value = m
}

function setYearMonth(y, m) {
  currentYear.value = y
  currentMonth.value = m
}

function jumpToToday() {
  const d = new Date()
  currentYear.value = d.getFullYear()
  currentMonth.value = d.getMonth() + 1
}



// ── 주요 입시일정 (한눈에 전체 보기 & 필터 & 달력 연동) ───────
const majorFilter = ref('all')

const allMajorScheduleList = computed(() => {
  if (!rawData.value?.majorList) return []
  const today = todayStr.value
  const todayDate = new Date(today)

  return rawData.value.majorList.map((item) => {
    const isOngoing = item.startDate <= today && today <= item.endDate
    const isUpcoming = today < item.startDate
    const isPast = today > item.endDate

    let dDayText = ''
    let dDayNumber = 0
    let status = 'upcoming'

    if (isOngoing) {
      status = 'ongoing'
      const endD = new Date(item.endDate)
      const diffToEnd = Math.ceil((endD.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffToEnd === 0) {
        dDayText = '오늘 마감'
      } else {
        dDayText = `진행중 (마감 D-${diffToEnd})`
      }
    } else if (isUpcoming) {
      status = 'upcoming'
      const startD = new Date(item.startDate)
      dDayNumber = Math.ceil((startD.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
      dDayText = dDayNumber === 0 ? 'D-DAY' : `D-${dDayNumber}`
    } else {
      status = 'past'
      const endD = new Date(item.endDate)
      const diffPast = Math.ceil((todayDate.getTime() - endD.getTime()) / (1000 * 60 * 60 * 24))
      dDayText = `종료 (D+${diffPast})`
    }

    let dateDisplay = ''
    if (item.startDate === item.endDate) {
      dateDisplay = item.startDate.replace(/-/g, '.')
    } else {
      dateDisplay = `${item.startDate.replace(/-/g, '.')} ~ ${item.endDate.replace(/-/g, '.')}`
    }

    return {
      ...item,
      status,
      isOngoing,
      isUpcoming,
      isPast,
      dDayText,
      dateDisplay
    }
  })
})

const filteredMajorScheduleList = computed(() => {
  const list = allMajorScheduleList.value
  if (majorFilter.value === 'active') {
    return list.filter(item => item.isOngoing || item.isUpcoming)
  }
  if (majorFilter.value === 'past') {
    return list.filter(item => item.isPast)
  }
  return list
})

const majorActiveCount = computed(() => {
  return allMajorScheduleList.value.filter(item => item.isOngoing || item.isUpcoming).length
})

const majorPastCount = computed(() => {
  return allMajorScheduleList.value.filter(item => item.isPast).length
})

function jumpToScheduleMonth(item) {
  if (!item.startDate) return
  const parts = item.startDate.split('-')
  if (parts.length >= 2) {
    currentYear.value = parseInt(parts[0], 10)
    currentMonth.value = parseInt(parts[1], 10)
    openModalForDate(item.startDate)
  }
}

// ── 오늘의 입시일정 계산 ──────────────────────────────────────
const todayAcademic = computed(() => {
  if (!rawData.value?.academicByDate) return []
  return rawData.value.academicByDate[todayStr.value] || []
})

const todayMajorEvents = computed(() => {
  if (!rawData.value?.majorList) return []
  const t = todayStr.value
  return rawData.value.majorList
    .filter(ev => ev.startDate <= t && t <= ev.endDate)
    .map(ev => {
      let statusLabel = '진행 중'
      if (t === ev.startDate) statusLabel = '오늘 시작'
      else if (t === ev.endDate) statusLabel = '오늘 마감'
      return { ...ev, statusLabel }
    })
})

const todayDeadlines = computed(() => {
  if (!rawData.value?.deadlineByDate) return []
  const list = rawData.value.deadlineByDate[todayStr.value] || []
  if (isStudentFilterActive.value && activeStudentUniversities.value) {
    return list.filter(d => isUniversityMatch(d.university, activeStudentUniversities.value))
  }
  return list
})

const todayFourYear = computed(() => {
  if (!rawData.value?.fourYearByDate) return null
  const fy = rawData.value.fourYearByDate[todayStr.value]
  if (!fy || !fy.items) return null
  if (!isStudentFilterActive.value || !activeStudentUniversities.value) return fy

  const filteredItems = fy.items.filter(it => isUniversityMatch(it.university, activeStudentUniversities.value))
  if (filteredItems.length === 0) return null

  const typeCounts = {}
  filteredItems.forEach(it => {
    typeCounts[it.type] = (typeCounts[it.type] || 0) + 1
  })
  return {
    ...fy,
    items: filteredItems,
    typeCounts
  }
})

const todayJunior = computed(() => {
  if (!rawData.value?.juniorByDate) return null
  const jn = rawData.value.juniorByDate[todayStr.value]
  if (!jn || !jn.items) return null
  if (!isStudentFilterActive.value || !activeStudentUniversities.value) return jn

  const filteredItems = jn.items.filter(it => isUniversityMatch(it.university, activeStudentUniversities.value))
  if (filteredItems.length === 0) return null

  const typeCounts = {}
  filteredItems.forEach(it => {
    typeCounts[it.type] = (typeCounts[it.type] || 0) + 1
  })
  return {
    ...jn,
    items: filteredItems,
    typeCounts
  }
})

// ── 월간 캘린더 그리드 셀 계산 (일 ~ 토) ──────────────────────
const calendarCells = computed(() => {
  const y = currentYear.value
  const m = currentMonth.value

  const firstDayOfMonth = new Date(y, m - 1, 1)
  const lastDayOfMonth = new Date(y, m, 0)

  const startDayOfWeek = firstDayOfMonth.getDay() // 0(일) ~ 6(토)
  const totalDays = lastDayOfMonth.getDate()

  const cells = []

  // 1. 이전 달 날짜들 채우기
  const prevMonthLastDay = new Date(y, m - 1, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const pDay = prevMonthLastDay - i
    const prevDate = new Date(y, m - 2, pDay)
    cells.push(createCalendarCell(prevDate, false))
  }

  // 2. 이번 달 날짜들
  for (let d = 1; d <= totalDays; d++) {
    const curDate = new Date(y, m - 1, d)
    cells.push(createCalendarCell(curDate, true))
  }

  // 3. 다음 달 날짜들 채우기 (총 35 또는 42개 셀로 맞춤)
  const remainder = cells.length % 7
  if (remainder !== 0) {
    const needed = 7 - remainder
    for (let d = 1; d <= needed; d++) {
      const nextDate = new Date(y, m, d)
      cells.push(createCalendarCell(nextDate, false))
    }
  }

  return cells
})

function createCalendarCell(dateObj, isCurrentMonth) {
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  const dateStr = `${y}-${m}-${d}`

  const isToday = dateStr === todayStr.value
  const dayOfWeek = dateObj.getDay()

  // 학사일정 추출 및 개별 라인별 분리 (3줄 시트 내용 각각 1줄씩 표시)
  const academicList = rawData.value?.academicByDate?.[dateStr] || []
  const academicLines = []
  let academicSummary = ''

  if (academicList.length > 0) {
    academicSummary = academicList.map(a => `${a.content}${a.hours ? ` (${a.hours}시수)` : ''}`).join('\n')

    academicList.forEach(a => {
      if (!a.content) return
      const splitLines = a.content.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      splitLines.forEach(line => {
        let badgeClass = 'bg-sky-100/90 text-sky-950 border-sky-300 font-bold'
        let icon = '🏫'

        if (line.includes('시험') || line.includes('지필')) {
          badgeClass = 'bg-rose-100 text-rose-950 border-rose-300 font-black'
          icon = '📝'
        } else if (line.includes('모의') || line.includes('연합') || line.includes('평가')) {
          badgeClass = 'bg-purple-100 text-purple-950 border-purple-300 font-black'
          icon = '📊'
        } else if (line.includes('휴업') || line.includes('공휴일') || line.includes('방학') || line.includes('신정') || line.includes('추석') || line.includes('한글날') || line.includes('성탄절')) {
          badgeClass = 'bg-amber-100 text-amber-950 border-amber-300 font-black'
          icon = '🚩'
        } else if (line.includes('입학') || line.includes('개학') || line.includes('졸업') || line.includes('종업') || line.includes('수능')) {
          badgeClass = 'bg-emerald-100 text-emerald-950 border-emerald-300 font-black'
          icon = '🎓'
        }

        academicLines.push({
          text: line,
          badgeClass,
          icon
        })
      })
    })
  }

  // Track 1: 기간 주요일정 연결 여부 파악
  let majorRange = null
  let singleMajorEvent = null

  if (rawData.value?.rangeEvents) {
    // 다일 기간 일정 중 현재 일자에 해당하는 이벤트 탐색
    const matchedRange = rawData.value.rangeEvents.find(
      ev => ev.isMultiDay && ev.startDate <= dateStr && dateStr <= ev.endDate
    )
    if (matchedRange) {
      majorRange = {
        ...matchedRange,
        isStart: matchedRange.startDate === dateStr,
        isEnd: matchedRange.endDate === dateStr
      }
    } else {
      // 단일일 주요일정 탐색
      const singleEv = rawData.value.rangeEvents.find(
        ev => !ev.isMultiDay && ev.startDate === dateStr
      )
      if (singleEv) {
        singleMajorEvent = singleEv
      }
    }
  }

  // 원서접수 마감 대학 수
  let deadlineList = rawData.value?.deadlineByDate?.[dateStr] || []
  if (isStudentFilterActive.value && activeStudentUniversities.value) {
    deadlineList = deadlineList.filter(d => isUniversityMatch(d.university, activeStudentUniversities.value))
  }

  // Track 2: 4년제 일정 데이터 (실기 / 면접 / 기타 별도 분리)
  let fourYearData = null
  const fy = rawData.value?.fourYearByDate?.[dateStr]
  if (fy && fy.items.length > 0) {
    let items = fy.items
    if (isStudentFilterActive.value && activeStudentUniversities.value) {
      items = items.filter(it => isUniversityMatch(it.university, activeStudentUniversities.value))
    }

    if (items.length > 0) {
      const typeCounts = {}
      items.forEach(it => {
        typeCounts[it.type] = (typeCounts[it.type] || 0) + 1
      })

      const practicalCount = typeCounts['실기'] || 0
      const interviewCount = typeCounts['면접'] || 0

      // 실기, 면접 외의 기타 유형들 (논술, 1단계합격, 최종합격 등)
      const otherEntries = Object.entries(typeCounts).filter(
        ([type]) => type !== '실기' && type !== '면접'
      )
      const otherCount = otherEntries.reduce((sum, [, cnt]) => sum + cnt, 0)
      const otherLabel = otherEntries.map(([type, cnt]) => `${type} ${cnt}`).slice(0, 2).join(' · ')
      const otherTitle = items
        .filter(it => it.type !== '실기' && it.type !== '면접')
        .map(it => `${it.university}(${it.type})`)
        .slice(0, 8)
        .join(', ')

      fourYearData = {
        items,
        typeCounts,
        practicalCount,
        interviewCount,
        otherCount,
        otherLabel: otherLabel || '기타',
        otherTitle,
        summaryTitle: items.map(it => `${it.university}(${it.type})`).slice(0, 8).join(', ')
      }
    }
  }

  // Track 3: 전문대 일정 데이터
  let juniorData = null
  const jn = rawData.value?.juniorByDate?.[dateStr]
  if (jn && jn.items.length > 0) {
    let items = jn.items
    if (isStudentFilterActive.value && activeStudentUniversities.value) {
      items = items.filter(it => isUniversityMatch(it.university, activeStudentUniversities.value))
    }

    if (items.length > 0) {
      const typeCounts = {}
      items.forEach(it => {
        typeCounts[it.type] = (typeCounts[it.type] || 0) + 1
      })

      const topTypes = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([type, cnt]) => `${type} ${cnt}`)
        .slice(0, 2)
        .join(' · ')

      juniorData = {
        items,
        typeCounts,
        compactSummary: topTypes,
        summaryTitle: items.map(it => `${it.university}(${it.type})`).slice(0, 8).join(', ')
      }
    }
  }

  return {
    dateStr,
    dayNum: dateObj.getDate(),
    dayOfWeek,
    isToday,
    isCurrentMonth,
    academicList,
    academicLines,
    academicSummary,
    majorRange,
    singleMajorEvent,
    deadlineCount: deadlineList.length,
    fourYearData,
    juniorData
  }
}

// ── 날짜 상세 모달 제어 ───────────────────────────────────────
const selectedDateModal = ref(null)
const modalFilterSearch = ref('')

function openModalForDate(dateStr) {
  if (!dateStr) return
  const parts = dateStr.split('-')
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const formattedLong = `${parts[0]}년 ${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일 (${days[d.getDay()]}요일)`

  // 선택한 날짜에 해당하는 대입 학년도 자동 결정 및 전용 지원자 데이터 준비
  const targetYear = getCollegeAdmissionYearFromDate(dateStr)
  currentModalAdmissionYear.value = targetYear

  // 해당 학년도 데이터가 캐시에 없다면 비동기로 로드 (종합 대시보드 상태와 완전 격리)
  if (!calendarYearApplicationsMap.value[targetYear]) {
    getApplicationsForAcademicYear(targetYear).then(data => {
      if (data && data.length > 0) {
        calendarYearApplicationsMap.value[targetYear] = data
      }
    }).catch(e => {
      console.warn(`[Calendar] Failed to load applications for ${targetYear}:`, e)
    })
  }

  // 해당 날짜 학사일정
  const academicItems = rawData.value?.academicByDate?.[dateStr] || []

  // 해당 날짜 주요일정
  const majorEvents = (rawData.value?.majorList || []).filter(
    ev => ev.startDate <= dateStr && dateStr <= ev.endDate
  )

  // 원서접수 마감 대학
  let deadlines = rawData.value?.deadlineByDate?.[dateStr] || []

  // 4년제 일정 목록
  let fourYearItems = rawData.value?.fourYearByDate?.[dateStr]?.items || []

  // 전문대 일정 목록
  let juniorItems = rawData.value?.juniorByDate?.[dateStr]?.items || []

  if (isStudentFilterActive.value && activeStudentUniversities.value) {
    deadlines = deadlines.filter(d => isUniversityMatch(d.university, activeStudentUniversities.value))
    fourYearItems = fourYearItems.filter(it => isUniversityMatch(it.university, activeStudentUniversities.value))
    juniorItems = juniorItems.filter(it => isUniversityMatch(it.university, activeStudentUniversities.value))
  }

  modalFilterSearch.value = ''
  expandedRows.value = {}
  selectedDateModal.value = {
    dateStr,
    formattedLong,
    academicItems,
    majorEvents,
    deadlines,
    fourYearItems,
    juniorItems
  }
}

const filteredFourYearItems = computed(() => {
  if (!selectedDateModal.value) return []
  const items = selectedDateModal.value.fourYearItems
  const q = modalFilterSearch.value.trim().toLowerCase()
  if (!q) return items
  return items.filter(it =>
    it.university.toLowerCase().includes(q) ||
    it.type.toLowerCase().includes(q) ||
    it.track.toLowerCase().includes(q) ||
    (it.note && it.note.toLowerCase().includes(q))
  )
})

// ── 모달 내 대학별/전형별 지원 학생 인라인 아코디언 상태 및 로직 ──
const activeModalCollegeYear = computed(() => {
  if (!selectedDateModal.value?.dateStr) return currentModalAdmissionYear.value || '2027'
  return getCollegeAdmissionYearFromDate(selectedDateModal.value.dateStr)
})

const allApplications = computed(() => {
  const targetYear = activeModalCollegeYear.value || currentModalAdmissionYear.value || '2027'
  return calendarYearApplicationsMap.value[targetYear] || calendarYearApplicationsMap.value['2027'] || rawAppsData || []
})

const canViewStudents = computed(() => {
  return auth.isAdmin || auth.isTeacher || auth.isStudent
})

const expandedRows = ref({}) // key -> { mode: 'univ' | 'track' }

function getItemRowKey(item, idx, type = 'fourYear') {
  return `${type}_${idx}_${item.university}`
}

function isRowExpanded(key) {
  return !!expandedRows.value[key]
}

function getRowExpandedMode(key) {
  return expandedRows.value[key]?.mode || 'univ'
}

function setRowExpandedMode(key, mode) {
  if (expandedRows.value[key]) {
    expandedRows.value[key].mode = mode
  }
}

function toggleRowAccordion(key, item, preferredMode = 'univ') {
  if (!canViewStudents.value) return
  if (expandedRows.value[key]) {
    if (expandedRows.value[key].mode === preferredMode) {
      delete expandedRows.value[key]
      expandedRows.value = { ...expandedRows.value }
    } else {
      expandedRows.value[key].mode = preferredMode
      expandedRows.value = { ...expandedRows.value }
    }
  } else {
    expandedRows.value = {
      ...expandedRows.value,
      [key]: { mode: preferredMode }
    }
  }
}

function getApplicantsForItem(item, mode = 'univ') {
  if (!item || !item.university) return []
  const list = allApplications.value || []
  
  // 1. 대학명 매칭
  const uniMatched = list.filter(app => isUniversityMatch(item.university, [app.univName]))
  
  if (mode === 'univ') {
    return uniMatched
  }
  
  // 2. 전형명 매칭
  if (!item.track) return uniMatched
  const cleanTrack = item.track.trim().replace(/[\s\-_()\/,]/g, '').toLowerCase()
  if (cleanTrack === '수시전체' || cleanTrack === '전체' || cleanTrack === '수시') {
    return uniMatched
  }
  
  const keywords = item.track
    .split(/[\/,\(\)\s+]/)
    .map(k => k.trim())
    .filter(k => k.length >= 2 && !['전형', '수시', '학생부', '1단계', '2단계'].includes(k))
    
  const trackMatched = uniMatched.filter(app => {
    const detail = (app.admissionDetailType || '').replace(/[\s\-_()\/,]/g, '').toLowerCase()
    const major = (app.admissionMajorType || '').replace(/[\s\-_()\/,]/g, '').toLowerCase()
    const dept = (app.dept || '').replace(/[\s\-_()\/,]/g, '').toLowerCase()
    
    if (detail && (detail.includes(cleanTrack) || cleanTrack.includes(detail))) return true
    if (major && (major.includes(cleanTrack) || cleanTrack.includes(major))) return true
    if (dept && cleanTrack.includes(dept)) return true
    
    for (const kw of keywords) {
      const lkw = kw.toLowerCase()
      if (detail.includes(lkw) || major.includes(lkw) || dept.includes(lkw)) {
        return true
      }
    }
    return false
  })
  
  return trackMatched
}

function getVisibleStudents(item, mode = 'univ') {
  if (!canViewStudents.value) return []
  
  let applicants = getApplicantsForItem(item, mode)
  
  // 학생 로그인: 본인 지원 내역만 철저히 격리
  if (auth.isStudent) {
    return applicants.filter(app => {
      if (auth.studentCode && (app.studentCode === auth.studentCode || app.studentKey?.startsWith(auth.studentCode))) return true
      if (auth.studentName && app.name === auth.studentName) {
        if (auth.classNo && app.classNum) {
          return Number(auth.classNo) === Number(app.classNum)
        }
        return true
      }
      return false
    })
  }
  
  // 교사 / 관리자: 상단 학급 및 학생 필터가 지정되어 있다면 적용
  if (selectedClass.value && selectedClass.value !== 'ALL') {
    if (selectedClass.value === 'GRAD') {
      applicants = applicants.filter(a => a.isGraduate)
    } else {
      applicants = applicants.filter(a => !a.isGraduate && Number(a.classNum) === Number(selectedClass.value))
    }
  }
  
  if (selectedStudentId.value && selectedStudentId.value !== 'ALL') {
    applicants = applicants.filter(a => 
      a.studentCode === selectedStudentId.value || 
      a.name === selectedStudentId.value ||
      a.studentKey === selectedStudentId.value
    )
  }
  
  // 반, 번호 순 정렬
  return applicants.slice().sort((a, b) => {
    if (a.classNum !== b.classNum) return (a.classNum || 0) - (b.classNum || 0)
    return (a.studentNum || 0) - (b.studentNum || 0)
  })
}

function getApplicantCount(item, mode = 'univ') {
  if (!canViewStudents.value) return 0
  return getVisibleStudents(item, mode).length
}

function getDisplayStudentName(app) {
  if (!app) return ''
  if (auth.isStudent) {
    return `${app.name} (본인)`
  }
  if (auth.isTeacher) {
    // 교사는 항상 마스킹 보호
    return maskName(app.name, MASK_MODES.LAST_ONLY)
  }
  if (auth.isAdmin) {
    // 관리자는 관리자 마스킹 단계 연동
    return maskName(app.name, adminMaskMode.value)
  }
  return maskName(app.name)
}

defineExpose({
  refreshData,
  loading
})

onMounted(() => {
  refreshData()
  loadStudentsAndApplications()
  // 2027학년도 정규화 데이터 백그라운드 동기화 (구글시트 세션 인증 시)
  getApplicationsForAcademicYear('2027').then(data => {
    if (data && data.length > 0) {
      calendarYearApplicationsMap.value['2027'] = data
    }
  }).catch(() => {})
})
</script>

<style scoped>
/* 캘린더 부드러운 스크롤 */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
