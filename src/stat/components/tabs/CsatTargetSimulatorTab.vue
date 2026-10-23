<template>
  <div class="space-y-6">
    <!-- 1. 상단 안내 및 학년도 컨트롤 배너 -->
    <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
      <!-- 배경 장식 그래픽 -->
      <div class="absolute -right-8 -bottom-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
      <div class="absolute right-20 -top-10 w-48 h-48 bg-blue-400/10 rounded-full blur-xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              <Sparkles :size="12" class="text-indigo-300" />
              <span>예비 고3 & 대입 상담 특화 사전 도구</span>
            </span>
            <span class="text-xs text-indigo-300/80 font-mono">
              총 {{ rawTableData.length.toLocaleString() }}개 전형·학과 수록
            </span>
          </div>
          <h2 class="text-xl sm:text-2xl font-black text-white m-0 tracking-tight flex items-center gap-2">
            <span>수능최저 탐색기 & 목표등급 진단 시뮬레이터</span>
          </h2>
          <p class="text-xs sm:text-sm text-indigo-200/90 mt-1.5 max-w-2xl leading-relaxed m-0">
            구글 시트의 <strong class="text-white underline decoration-indigo-400 underline-offset-2">{{ currentTargetYear }}수능최저</strong> 정규화 데이터를 기반으로, 학생의 모의고사 성적을 대조하여 충족 여부 및 목표 달성에 필요한 영역별 등급선을 실시간 진단합니다.
          </p>
        </div>

        <!-- 학년도 선택 & 새로고침 버튼 -->
        <div class="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/15 shrink-0 self-start md:self-auto">
          <div class="flex rounded-lg bg-black/20 p-0.5">
            <button
              v-for="yr in availableYears"
              :key="yr"
              @click="changeTargetYear(yr)"
              class="px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer border-none"
              :class="currentTargetYear === yr ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-200 hover:text-white bg-transparent'"
            >
              {{ yr }}학년도
            </button>
          </div>
          <button
            @click="reloadSheetData"
            :disabled="isLoadingCsatMinScore"
            class="px-2.5 py-1.5 text-xs font-bold rounded-lg text-white/90 hover:text-white bg-white/10 hover:bg-white/20 transition-all border-none cursor-pointer flex items-center gap-1.5"
            title="구글 시트 최신 데이터 다시 불러오기"
          >
            <RefreshCw :size="14" :class="{ 'animate-spin': isLoadingCsatMinScore }" />
            <span class="hidden sm:inline">새로고침</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 2. 학생 모의고사 성적 선택 및 가상 성적 조정 카드 -->
    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
      <div class="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
            <UserCheck :size="18" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-800 m-0">성적 기준 설정 (진단 대상)</h3>
            <p class="text-[11px] text-slate-500 m-0">우리 학교 학생 성적을 불러오거나, 예비 고3 상담용 가상 성적을 직접 조작하세요.</p>
          </div>
        </div>

        <!-- 모드 토글 (학생 선택 vs 직접 입력) -->
        <div class="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
          <button
            @click="scoreInputMode = 'student'"
            class="px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer flex items-center gap-1.5"
            :class="scoreInputMode === 'student' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-transparent'"
          >
            <Users :size="14" />
            <span>재학생 모의고사 선택</span>
          </button>
          <button
            @click="scoreInputMode = 'manual'"
            class="px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer flex items-center gap-1.5"
            :class="scoreInputMode === 'manual' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-transparent'"
          >
            <SlidersHorizontal :size="14" />
            <span>가상 등급 직접 조정 (예비고3)</span>
          </button>
        </div>
      </div>

      <div class="p-5 space-y-4">
        <!-- A. 학생 선택 모드 UI -->
        <div v-if="scoreInputMode === 'student'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1">학생 선택 (2027 모의가채점 연계)</label>
            <select
              v-model="selectedStudentKey"
              @change="onStudentChange"
              class="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">-- 학생을 선택하세요 --</option>
              <option v-for="s in studentOptionList" :key="s.key" :value="s.key">
                {{ s.label }} ({{ s.examCount }}회 응시)
              </option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1">기준 모의고사 회차</label>
            <select
              v-model="selectedExamName"
              @change="onExamChange"
              :disabled="!selectedStudentExams.length"
              class="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:bg-slate-100"
            >
              <option v-if="!selectedStudentExams.length" value="">학생을 먼저 선택하세요</option>
              <option v-for="e in selectedStudentExams" :key="e.examName" :value="e.examName">
                {{ e.examName }}
              </option>
            </select>
          </div>

          <div class="flex items-end">
            <button
              @click="clearStudentSelection"
              class="w-full text-xs font-bold px-3 py-2 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border-none cursor-pointer"
            >
              성적 초기화 / 미적용 상태로 전환
            </button>
          </div>
        </div>

        <!-- B. 과목별 등급 칩/배지 바 (현재 적용 중인 성적) -->
        <div class="bg-indigo-50/50 rounded-xl p-3.5 border border-indigo-100/80 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <span>🎯 적용 중인 모의 성적:</span>
            </span>
            <div class="flex flex-wrap items-center gap-1.5">
              <span 
                v-for="(sub, sKey) in subjectList" 
                :key="sKey"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border"
                :class="activeExamRecord[sKey] ? 'bg-white text-indigo-900 border-indigo-200 shadow-2xs' : 'bg-slate-100 text-slate-400 border-slate-200'"
              >
                <span class="text-[10px] text-slate-500 font-medium">{{ sub.name }}</span>
                <span :class="getGradeColorClass(activeExamRecord[sKey])">
                  {{ activeExamRecord[sKey] ? `${activeExamRecord[sKey]}등급` : '-' }}
                </span>
              </span>
            </div>
          </div>

          <div class="text-xs font-bold text-indigo-700 flex items-center gap-2">
            <span v-if="hasActiveScore" class="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
              <CheckCircle2 :size="12" /> 성적 대조 활성화됨
            </span>
            <span v-else class="text-slate-500 text-[11px]">
              (성적 미입력 시 전형별 최소 요구 등급선이 안내됩니다)
            </span>
          </div>
        </div>

        <!-- C. 수동 등급 조절 패널 (직접 입력 모드) -->
        <div v-if="scoreInputMode === 'manual'" class="pt-2 border-t border-slate-100">
          <p class="text-[11px] font-bold text-slate-500 mb-2.5">각 영역의 등급을 클릭하여 변경해보세요:</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div 
              v-for="(sub, sKey) in subjectList" 
              :key="sKey"
              class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center"
            >
              <div class="text-[11px] font-bold text-slate-600 mb-1.5">{{ sub.name }}</div>
              <select
                v-model.number="activeExamRecord[sKey]"
                class="w-full text-xs font-bold py-1 px-1 bg-white border border-slate-300 rounded-lg text-center focus:ring-1 focus:ring-indigo-500"
              >
                <option :value="null">미입력</option>
                <option v-for="g in 9" :key="g" :value="g">{{ g }}등급</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 대학/전형 필터 및 검색 컨트롤러 -->
    <div class="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <!-- 1) 지역 필터 -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 mb-1">지역</label>
          <select
            v-model="selectedRegion"
            class="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">전체 지역 ({{ filterMeta.regions.length }}개)</option>
            <option v-for="r in filterMeta.regions" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>

        <!-- 2) 전형 대분류 -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 mb-1">전형 구분</label>
          <select
            v-model="selectedBroadType"
            class="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">전체 전형 (교과·종합·논술·학추)</option>
            <option value="교과">교과 (교과100, 면접 등)</option>
            <option value="종합">종합 (학종 서류, 면접)</option>
            <option value="논술">논술전형</option>
            <option value="학추">학교장추천 (지역균형)</option>
          </select>
        </div>

        <!-- 3) 충족 상태 퀵 필터 (성적이 있을 때 유용) -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 mb-1">진단 상태 필터</label>
          <select
            v-model="selectedStatusFilter"
            class="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="ALL">전체 보기</option>
            <option value="SATISFIED">✅ 충족 완료된 전형만</option>
            <option value="GAP1">⚠️ 1등급 상향 시 충족 가능</option>
            <option value="DEFICIT">❌ 미충족 (추가 향상 필요)</option>
            <option value="NONE">수능최저 없음만</option>
            <option value="BOOKMARKED">⭐ 관심 담기한 전형만</option>
          </select>
        </div>

        <!-- 4) 대학명 검색 -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 mb-1">대학명 검색</label>
          <div class="relative">
            <input
              type="text"
              v-model="searchUnivKeyword"
              placeholder="예: 가천대, 서울대, 충북대"
              class="w-full text-xs font-medium pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <Search :size="14" class="absolute left-2.5 top-2.5 text-slate-400" />
          </div>
        </div>

        <!-- 5) 학과 키워드 검색 -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 mb-1">학과 / 모집단위 검색</label>
          <div class="relative">
            <input
              type="text"
              v-model="searchDeptKeyword"
              placeholder="예: 의예, 간호, 컴공, 경영"
              class="w-full text-xs font-medium pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <GraduationCap :size="14" class="absolute left-2.5 top-2.5 text-slate-400" />
          </div>
        </div>
      </div>

      <!-- 활성 필터 리셋 & 건수 요약 & 북마크 내보내기 -->
      <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-700">
            검색 결과: <strong class="text-indigo-600 font-mono">{{ filteredItems.length.toLocaleString() }}</strong>개 항목
          </span>
          <button
            v-if="hasActiveFilter"
            @click="resetFilters"
            class="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 transition-colors border-none cursor-pointer"
          >
            필터 초기화 ↺
          </button>
        </div>

        <div class="flex items-center gap-2">
          <!-- 뷰 모드 토글 (카드 vs 컴팩트 테이블) -->
          <div class="flex rounded-lg bg-slate-100 p-0.5">
            <button
              @click="viewMode = 'card'"
              class="px-2.5 py-1 text-[11px] font-bold rounded-md transition-all border-none cursor-pointer"
              :class="viewMode === 'card' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 bg-transparent'"
            >
              카드형
            </button>
            <button
              @click="viewMode = 'table'"
              class="px-2.5 py-1 text-[11px] font-bold rounded-md transition-all border-none cursor-pointer"
              :class="viewMode === 'table' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 bg-transparent'"
            >
              테이블형
            </button>
          </div>

          <!-- 관심 대학 클립보드 복사 -->
          <button
            v-if="bookmarkedItems.length > 0"
            @click="copyBookmarkedSummary"
            class="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all border-none cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Star :size="13" class="fill-white" />
            <span>상담 담기 목록 복사 ({{ bookmarkedItems.length }})</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 4. 로딩 중 / 에러 상태 -->
    <div v-if="isLoadingCsatMinScore" class="bg-white rounded-2xl border border-slate-200 py-20 text-center shadow-xs">
      <div class="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-3 text-indigo-600">
        <RefreshCw :size="24" class="animate-spin" />
      </div>
      <h4 class="text-sm font-bold text-slate-800 m-0">{{ currentTargetYear }}수능최저 시트 데이터를 불러오는 중...</h4>
      <p class="text-xs text-slate-500 mt-1 m-0">구글 스프레드시트의 실시간 평문 자료를 동기화하고 있습니다.</p>
    </div>

    <!-- 5. 데이터 없음 -->
    <div v-else-if="filteredItems.length === 0" class="bg-white rounded-2xl border border-slate-200 py-16 text-center shadow-xs">
      <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-2xl">
        🔍
      </div>
      <h4 class="text-sm font-bold text-slate-800 m-0">일치하는 수능최저 항목이 없습니다</h4>
      <p class="text-xs text-slate-500 mt-1 m-0">검색어 또는 지역/전형 필터를 변경해 보세요.</p>
      <button
        @click="resetFilters"
        class="mt-3 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors border-none cursor-pointer"
      >
        전체 항목 다시 보기
      </button>
    </div>

    <!-- 6-A. 카드 뷰 모드 (모바일 & 데스크탑 반응형) -->
    <div v-else-if="viewMode === 'card'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="item in pagedItems"
        :key="item.seq"
        class="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group"
        :class="{ 'ring-2 ring-amber-400/80 bg-amber-50/20': isBookmarked(item) }"
      >
        <!-- 상단: 지역, 대학명, 북마크 버튼 -->
        <div>
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {{ item.region }}
              </span>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold" :class="getBroadTypeBadgeClass(item.broadType)">
                {{ item.broadType }} · {{ item.detailType }}
              </span>
            </div>
            <!-- 북마크 별 아이콘 -->
            <button
              @click="toggleBookmark(item)"
              class="text-slate-300 hover:text-amber-500 p-1 transition-colors border-none bg-transparent cursor-pointer"
              :class="{ 'text-amber-500!': isBookmarked(item) }"
              :title="isBookmarked(item) ? '관심 목록에서 제거' : '상담 관심 목록에 담기'"
            >
              <Star :size="18" :class="{ 'fill-amber-400': isBookmarked(item) }" />
            </button>
          </div>

          <!-- 대학명 & 세세부전형 -->
          <h4 class="text-base font-black text-slate-900 m-0 tracking-tight leading-snug">
            {{ item.univName }}
          </h4>
          <div class="text-xs font-bold text-indigo-700 mt-1 flex items-center gap-1">
            <span>{{ item.subDetailType || '일반' }}</span>
          </div>

          <!-- 대상 학과/모집단위 -->
          <div class="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div class="text-[10px] font-bold text-slate-500 mb-0.5">대상 학부 / 학과</div>
            <div class="text-xs font-bold text-slate-800 break-words leading-relaxed">
              {{ item.dept || '전체' }}
            </div>
          </div>
        </div>

        <!-- 하단: 수능최저기준 & 진단 결과 & 코칭 팁 -->
        <div class="mt-4 pt-3.5 border-t border-slate-100 space-y-2.5">
          <!-- 수능최저학력기준 원문 -->
          <div>
            <div class="text-[10px] font-bold text-slate-400 mb-1">수능최저학력기준</div>
            <div class="text-xs font-bold text-slate-800 leading-normal p-2 rounded-lg bg-indigo-50/40 border border-indigo-100">
              {{ item.minScore }}
            </div>
          </div>

          <!-- 진단 뱃지 및 결과 상태 -->
          <div class="flex items-center justify-between gap-2 pt-1">
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border"
              :class="getStatusBadgeClass(item.analysis.badgeColor)"
            >
              <CheckCircle2 v-if="item.analysis.isSatisfied && item.analysis.hasRequirement" :size="13" />
              <AlertTriangle v-else-if="!item.analysis.isSatisfied && item.analysis.hasRequirement" :size="13" />
              <Info v-else :size="13" />
              <span>{{ item.analysis.statusBadge }}</span>
            </span>

            <span class="text-[11px] font-mono font-bold text-slate-500">
              {{ item.analysis.achievedSum ? `달성 합: ${item.analysis.achievedSum}` : '' }}
            </span>
          </div>

          <!-- 코칭 가이드 및 향상 시나리오 -->
          <div v-if="item.analysis.coachingNotes && item.analysis.coachingNotes.length" class="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 space-y-1">
            <div v-for="(note, nIdx) in item.analysis.coachingNotes" :key="nIdx" class="leading-relaxed">
              • {{ note }}
            </div>
            <!-- 단독 상향 가능 시나리오 강조 -->
            <div v-if="item.analysis.scenarios && item.analysis.scenarios.length" class="mt-1.5 pt-1.5 border-t border-slate-200/60 font-bold text-indigo-700">
              <span class="text-amber-600">💡 목표 달성 가이드:</span>
              <div v-for="(sc, scIdx) in item.analysis.scenarios" :key="scIdx" class="text-[11px] mt-0.5">
                ➔ {{ sc }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 6-B. 컴팩트 테이블 뷰 모드 -->
    <div v-else class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
              <th class="py-3 px-3 w-10 text-center">⭐</th>
              <th class="py-3 px-3 w-16">지역</th>
              <th class="py-3 px-4 w-44">대학명</th>
              <th class="py-3 px-3 w-28">전형 구분</th>
              <th class="py-3 px-3 w-36">세세부전형</th>
              <th class="py-3 px-4 w-60">학부 또는 학과</th>
              <th class="py-3 px-4 min-w-[200px]">수능최저학력기준</th>
              <th class="py-3 px-4 w-32 text-center">진단 상태</th>
              <th class="py-3 px-4 min-w-[220px]">상담 목표 가이드</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in pagedItems"
              :key="item.seq"
              class="hover:bg-slate-50/80 transition-colors"
              :class="{ 'bg-amber-50/20': isBookmarked(item) }"
            >
              <td class="py-2.5 px-3 text-center">
                <button
                  @click="toggleBookmark(item)"
                  class="text-slate-300 hover:text-amber-500 border-none bg-transparent cursor-pointer p-0.5"
                  :class="{ 'text-amber-500!': isBookmarked(item) }"
                >
                  <Star :size="16" :class="{ 'fill-amber-400': isBookmarked(item) }" />
                </button>
              </td>
              <td class="py-2.5 px-3 font-medium text-slate-500">{{ item.region }}</td>
              <td class="py-2.5 px-4 font-bold text-slate-900">{{ item.univName }}</td>
              <td class="py-2.5 px-3">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="getBroadTypeBadgeClass(item.broadType)">
                  {{ item.broadType }} · {{ item.detailType }}
                </span>
              </td>
              <td class="py-2.5 px-3 font-semibold text-indigo-700">{{ item.subDetailType || '일반' }}</td>
              <td class="py-2.5 px-4 font-medium text-slate-800 break-words">{{ item.dept }}</td>
              <td class="py-2.5 px-4 font-bold text-slate-800 break-words">{{ item.minScore }}</td>
              <td class="py-2.5 px-4 text-center">
                <span
                  class="inline-block px-2 py-0.5 rounded text-[11px] font-bold border"
                  :class="getStatusBadgeClass(item.analysis.badgeColor)"
                >
                  {{ item.analysis.statusBadge }}
                </span>
              </td>
              <td class="py-2.5 px-4 text-[11px] text-slate-600">
                <div v-if="item.analysis.scenarios && item.analysis.scenarios.length" class="font-bold text-indigo-700">
                  {{ item.analysis.scenarios[0] }}
                </div>
                <div v-else-if="item.analysis.coachingNotes && item.analysis.coachingNotes.length" class="text-slate-500">
                  {{ item.analysis.coachingNotes[0] }}
                </div>
                <div v-else class="text-slate-400">-</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 7. 페이지네이션 컨트롤 -->
    <div v-if="totalPages > 1" class="flex items-center justify-between gap-4 py-2 text-xs">
      <div class="text-slate-500">
        전체 {{ filteredItems.length.toLocaleString() }}건 중 
        <strong class="text-slate-800 font-mono">{{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredItems.length) }}</strong> 표시 중
      </div>

      <div class="flex items-center gap-1">
        <button
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
        >
          이전
        </button>

        <span class="px-3 py-1 font-bold text-slate-700">
          {{ currentPage }} / {{ totalPages }}
        </span>

        <button
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
        >
          다음
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { 
  useStatData, 
  loadCsatMinScoreData, 
  csatMinScoreTable, 
  isLoadingCsatMinScore,
  loadMockExamData,
  studentMockExamsMap
} from '../../composables/useStatData'
import { getCsatMinScoreFilterOptions } from '../../../api/statApi'
import { analyzeCsatTargetRequirement } from '../../utils/csatMinScoreEvaluator'
import {
  Sparkles,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  SlidersHorizontal,
  GraduationCap,
  Star,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-vue-next'

const { selectedAcademicYear } = useStatData()

// 1. 학년도 관리
const availableYears = ['2027', '2028']
const currentTargetYear = ref(selectedAcademicYear.value === '2028' ? '2028' : '2027')

// 2. 성적 모드: 'student' (재학생 선택) | 'manual' (직접 등급 조정)
const scoreInputMode = ref('manual')
const selectedStudentKey = ref('')
const selectedExamName = ref('')

// 가상 / 적용 성적 레코드
const activeExamRecord = reactive({
  korGrade: 3,
  mathGrade: 3,
  engGrade: 2,
  inq1Grade: 3,
  inq2Grade: 4,
  histGrade: 2
})

const subjectList = {
  korGrade: { name: '국어' },
  mathGrade: { name: '수학' },
  engGrade: { name: '영어' },
  inq1Grade: { name: '탐구1' },
  inq2Grade: { name: '탐구2' },
  histGrade: { name: '한국사' }
}

const hasActiveScore = computed(() => {
  return !!(activeExamRecord.korGrade || activeExamRecord.mathGrade || activeExamRecord.engGrade || activeExamRecord.inq1Grade)
})

// 3. 학생 목록 옵션 (모의고사 데이터 기반)
const studentOptionList = computed(() => {
  const list = []
  studentMockExamsMap.value.forEach((examList, key) => {
    if (examList && examList.length > 0) {
      const first = examList[0]
      const label = `${first.classNum || ''}반 ${first.studentNum || ''}번 ${first.name || '학생'}`
      list.push({ key, label, examCount: examList.length, exams: examList })
    }
  })
  return list.sort((a, b) => a.label.localeCompare(b.label, 'ko'))
})

const selectedStudentExams = computed(() => {
  if (!selectedStudentKey.value) return []
  return studentMockExamsMap.value.get(selectedStudentKey.value) || []
})

function onStudentChange() {
  if (!selectedStudentKey.value) {
    selectedExamName.value = ''
    return
  }
  const exams = selectedStudentExams.value
  if (exams.length > 0) {
    // 가장 최근 모의고사 회차 자동 선택
    selectedExamName.value = exams[exams.length - 1].examName
    applyStudentExam(exams[exams.length - 1])
  }
}

function onExamChange() {
  const exam = selectedStudentExams.value.find(e => e.examName === selectedExamName.value)
  if (exam) {
    applyStudentExam(exam)
  }
}

function applyStudentExam(exam) {
  activeExamRecord.korGrade = exam.korGrade || null
  activeExamRecord.mathGrade = exam.mathGrade || null
  activeExamRecord.engGrade = exam.engGrade || null
  activeExamRecord.inq1Grade = exam.inq1Grade || null
  activeExamRecord.inq2Grade = exam.inq2Grade || null
  activeExamRecord.histGrade = exam.histGrade || 2
}

function clearStudentSelection() {
  selectedStudentKey.value = ''
  selectedExamName.value = ''
  activeExamRecord.korGrade = null
  activeExamRecord.mathGrade = null
  activeExamRecord.engGrade = null
  activeExamRecord.inq1Grade = null
  activeExamRecord.inq2Grade = null
  activeExamRecord.histGrade = null
}

// 4. 필터 상태
const selectedRegion = ref('')
const selectedBroadType = ref('')
const selectedStatusFilter = ref('ALL')
const searchUnivKeyword = ref('')
const searchDeptKeyword = ref('')
const viewMode = ref('card') // 'card' | 'table'

const hasActiveFilter = computed(() => {
  return selectedRegion.value || selectedBroadType.value || selectedStatusFilter.value !== 'ALL' || searchUnivKeyword.value || searchDeptKeyword.value
})

function resetFilters() {
  selectedRegion.value = ''
  selectedBroadType.value = ''
  selectedStatusFilter.value = 'ALL'
  searchUnivKeyword.value = ''
  searchDeptKeyword.value = ''
  currentPage.value = 1
}

// 5. 수능최저 테이블 원본 및 분석 결합
const rawTableData = computed(() => csatMinScoreTable.value || [])

const filterMeta = computed(() => {
  return getCsatMinScoreFilterOptions(rawTableData.value)
})

// 분석 결과가 결합된 전체 항목
const analyzedItems = computed(() => {
  const currentExam = hasActiveScore.value ? activeExamRecord : null

  return rawTableData.value.map(item => {
    const analysis = analyzeCsatTargetRequirement(item.minScore, currentExam, '공통')
    return {
      ...item,
      analysis
    }
  })
})

// 필터링 적용된 목록
const filteredItems = computed(() => {
  return analyzedItems.value.filter(item => {
    // 1) 지역 필터
    if (selectedRegion.value && item.region !== selectedRegion.value) return false

    // 2) 전형 필터
    if (selectedBroadType.value && item.broadType !== selectedBroadType.value) return false

    // 3) 대학명 검색
    if (searchUnivKeyword.value) {
      const kw = searchUnivKeyword.value.trim().toLowerCase()
      if (!item.univName.toLowerCase().includes(kw)) return false
    }

    // 4) 학과 검색
    if (searchDeptKeyword.value) {
      const kw = searchDeptKeyword.value.trim().toLowerCase()
      if (!item.dept.toLowerCase().includes(kw)) return false
    }

    // 5) 상태 필터
    if (selectedStatusFilter.value === 'SATISFIED') {
      if (!item.analysis.isSatisfied || !item.analysis.hasRequirement) return false
    } else if (selectedStatusFilter.value === 'GAP1') {
      if (item.analysis.gap !== 1) return false
    } else if (selectedStatusFilter.value === 'DEFICIT') {
      if (item.analysis.isSatisfied || !item.analysis.hasRequirement) return false
    } else if (selectedStatusFilter.value === 'NONE') {
      if (item.analysis.hasRequirement) return false
    } else if (selectedStatusFilter.value === 'BOOKMARKED') {
      if (!isBookmarked(item)) return false
    }

    return true
  })
})

// 6. 페이지네이션
const currentPage = ref(1)
const pageSize = ref(18)

const totalPages = computed(() => {
  return Math.ceil(filteredItems.value.length / pageSize.value) || 1
})

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})

watch([selectedRegion, selectedBroadType, selectedStatusFilter, searchUnivKeyword, searchDeptKeyword], () => {
  currentPage.value = 1
})

// 7. 관심 대학 북마크(⭐) 상태 관리
const bookmarkedKeys = ref(new Set())

function getBookmarkKey(item) {
  return `${item.univName}_${item.broadType}_${item.detailType}_${item.dept}`
}

function isBookmarked(item) {
  return bookmarkedKeys.value.has(getBookmarkKey(item))
}

function toggleBookmark(item) {
  const key = getBookmarkKey(item)
  if (bookmarkedKeys.value.has(key)) {
    bookmarkedKeys.value.delete(key)
  } else {
    bookmarkedKeys.value.add(key)
  }
}

const bookmarkedItems = computed(() => {
  return analyzedItems.value.filter(item => isBookmarked(item))
})

// 상담 담기 목록 클립보드 복사
function copyBookmarkedSummary() {
  if (bookmarkedItems.value.length === 0) return
  const lines = [
    `[🎓 ${currentTargetYear.value}학년도 수능최저 상담 희망 목록]`,
    `진단 기준 성적: 국(${activeExamRecord.korGrade || '-'}) 수(${activeExamRecord.mathGrade || '-'}) 영(${activeExamRecord.engGrade || '-'}) 탐1(${activeExamRecord.inq1Grade || '-'}) 탐2(${activeExamRecord.inq2Grade || '-'})`,
    '--------------------------------------------------'
  ]

  bookmarkedItems.value.forEach((b, idx) => {
    lines.push(`${idx + 1}. ${b.univName} [${b.broadType}·${b.detailType}]`)
    lines.push(`   - 학과: ${b.dept}`)
    lines.push(`   - 수능최저: ${b.minScore}`)
    lines.push(`   - 진단: ${b.analysis.statusBadge} (${b.analysis.detailText || b.analysis.targetGuideline})`)
    if (b.analysis.scenarios && b.analysis.scenarios.length) {
      lines.push(`   - 목표 가이드: ${b.analysis.scenarios[0]}`)
    }
    lines.push('')
  })

  navigator.clipboard.writeText(lines.join('\n'))
    .then(() => alert(`상담 희망 대학 ${bookmarkedItems.value.length}건이 클립보드에 복사되었습니다.\n학부모/학생 문자나 메신저에 붙여넣어 공유할 수 있습니다.`))
    .catch(() => alert('클립보드 복사에 실패했습니다.'))
}

// 8. 헬퍼 스타일 함수들
function getGradeColorClass(grade) {
  if (!grade) return 'text-slate-400'
  if (grade <= 2) return 'text-emerald-700 font-black'
  if (grade <= 4) return 'text-blue-700 font-bold'
  if (grade <= 6) return 'text-amber-700 font-medium'
  return 'text-rose-700 font-medium'
}

function getBroadTypeBadgeClass(broadType) {
  switch (broadType) {
    case '교과': return 'bg-blue-50 text-blue-700 border border-blue-200'
    case '종합': return 'bg-emerald-50 text-emerald-800 border border-emerald-200'
    case '논술': return 'bg-purple-50 text-purple-700 border border-purple-200'
    case '학추': return 'bg-amber-50 text-amber-800 border border-amber-200'
    default: return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
}

function getStatusBadgeClass(badgeColor) {
  switch (badgeColor) {
    case 'emerald': return 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
    case 'amber': return 'bg-amber-50 text-amber-800 border-amber-200 shadow-2xs font-black'
    case 'rose': return 'bg-rose-50 text-rose-800 border-rose-200 shadow-2xs font-black'
    case 'blue': return 'bg-blue-50 text-blue-800 border-blue-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

// 9. 데이터 로드 및 연도 전환
async function changeTargetYear(year) {
  currentTargetYear.value = year
  await loadCsatMinScoreData(year, false)
}

async function reloadSheetData() {
  await loadCsatMinScoreData(currentTargetYear.value, true)
}

onMounted(async () => {
  // 모의고사 성적 및 수능최저 시트 병렬 로드
  await Promise.allSettled([
    loadCsatMinScoreData(currentTargetYear.value, false),
    loadMockExamData(false)
  ])
})
</script>

<style scoped>
/* 커스텀 라운딩 및 스크롤바 최적화 */
</style>
