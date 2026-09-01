<template>
  <div class="py-8 px-4 sm:px-10 max-w-4xl">
    <!-- 페이지 헤더 -->
    <div class="mb-6">
      <p class="text-xs font-semibold mb-1 text-slate-500" style="color: #64748b; margin: 0 0 4px;">관리자</p>
      <h1 class="text-2xl font-bold text-slate-800" style="color: #1e293b; margin: 0;">시스템 설정</h1>
    </div>

    <div class="flex flex-col gap-6">
      <!-- 0. 학교 이름 설정 -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 class="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <span class="w-1 h-3 bg-blue-600 rounded-full"></span>
          학교 이름 설정
        </h2>
        <p class="text-xs text-slate-400 mb-4">
          시스템 헤더 및 메인 타이틀 상단에 표시될 학교 이름을 지정합니다.
        </p>
        <form @submit.prevent="saveSchoolName" class="flex gap-3 w-full">
          <input
            v-model="inputSchoolName"
            type="text"
            placeholder="예: 우리고 또는 우리고등학교"
            class="flex-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-white"
          />
          <button
            type="submit"
            :disabled="schoolNameLoading"
            class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-5 py-2.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            {{ schoolNameLoading ? "저장 중…" : "학교 이름 저장" }}
          </button>
        </form>
      </div>

      <!-- 1. 학급 수 설정 (디폴트 11반) -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 class="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <span class="w-1 h-3 bg-blue-600 rounded-full"></span>
          3학년 학급 수 설정 (기본 11반)
        </h2>
        <p class="text-xs text-slate-400 mb-4">교사 화면의 '조회 학급 선택' 드롭다운에 표시될 3학년 학급 수(반 개수)를 지정합니다.</p>

        <form @submit.prevent="saveClassCount" class="flex gap-3 w-full">
          <div class="flex items-center gap-2 flex-1">
            <input
              v-model.number="classCount"
              type="number"
              min="1"
              max="30"
              required
              class="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-white"
            />
            <span class="text-sm text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap">반</span>
          </div>
          <button
            type="submit"
            :disabled="classCountLoading"
            class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-5 py-2.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            {{ classCountLoading ? '저장 중…' : '학급 수 변경' }}
          </button>
        </form>
      </div>

      <!-- 1-2. 정보공시 재학생 수 설정 -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 class="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <span class="w-1 h-3 bg-blue-600 rounded-full"></span>
          정보공시 재학생 수 (% 인원제한 환산 기준)
        </h2>
        <p class="text-xs text-slate-400 mb-4">
          4월 1일 기준 학교 재학생 수(정보공시 자료)를 입력합니다.
          대학별 인원제한이 <strong>3%</strong>, <strong>11%</strong>처럼 퍼센트로 표시된 경우, 이 인원을 기준으로 계산합니다.<br>
          예: 재학생 수 325명, 인원제한 3% → 325 × 3% = 9.75 → <strong>10명</strong> (소수점 올림)
        </p>

        <form @submit.prevent="saveDisclosureCount" class="flex gap-3 w-full">
          <div class="flex items-center gap-2 flex-1">
            <input
              v-model.number="disclosureCount"
              type="number"
              min="1"
              max="9999"
              placeholder="예: 325"
              class="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-white"
            />
            <span class="text-sm text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap">명</span>
          </div>
          <button
            type="submit"
            :disabled="disclosureCountLoading"
            class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-5 py-2.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            {{ disclosureCountLoading ? '저장 중…' : '저장' }}
          </button>
        </form>
        <p v-if="disclosureCount" class="text-xs text-slate-500 mt-2">
          현재 설정: <strong class="text-blue-600">{{ disclosureCount }}명</strong>
        </p>
        <p v-else class="text-xs text-amber-600 mt-2">
          ⚠️ 미설정 상태입니다. % 인원제한이 있는 경우 무제한으로 처리됩니다.
        </p>

        <!-- % 인원 동기화 버튼 -->
        <div class="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p class="text-xs text-slate-500 m-0 flex-1">
            재학생 수를 저장한 후, 아래 버튼으로 <strong>대학별 % 인원을 실제 명수로 재계산</strong>하여
            대학 설정 탭과 결과 보고서에 <strong>10명 (3%)</strong> 형식으로 표시됩니다.
          </p>
          <button
            type="button"
            :disabled="syncLoading || !disclosureCount"
            @click="doSyncPercentQuotas"
            class="text-xs font-bold text-white border-none rounded-lg px-5 py-2.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            :class="syncLoading || !disclosureCount ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'"
          >
            {{ syncLoading ? '재계산 중…' : '🔄 % 인원 재계산 동기화' }}
          </button>
        </div>
        <p v-if="syncResult" class="text-xs mt-2 whitespace-pre-line" :class="syncResult.startsWith('❌') ? 'text-red-600' : 'text-emerald-700'">{{ syncResult }}</p>
      </div>


      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 class="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <span class="w-1 h-3 bg-blue-600 rounded-full"></span>
          학생 회원가입 설정
        </h2>
        <p class="text-xs text-slate-400 mb-4">학생들이 가입할 때 인증을 위해 필요한 가입코드(registration code)를 지정합니다.</p>

        <form @submit.prevent="saveRegCode" class="flex gap-3 w-full">
          <input
            v-model="regCode"
            type="text"
            required
            placeholder="가입코드 입력"
            class="flex-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-white"
          />
          <button
            type="submit"
            :disabled="regCodeLoading"
            class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-5 py-2.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            {{ regCodeLoading ? '변경 중…' : '변경 적용' }}
          </button>
        </form>
      </div>

      <!-- 3. AI OCR API 설정 (OpenAI GPT-4o-mini Vision) -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 class="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <span class="w-1 h-3 bg-blue-600 rounded-full"></span>
          AI OCR 연동 설정 (OpenAI API)
        </h2>
        <p class="text-xs text-slate-400 mb-4">제출된 포기원 등 PDF/이미지 양식을 판독할 OpenAI GPT-4o-mini Vision 분석기 API 키를 설정합니다.</p>

        <form @submit.prevent="saveOpenAIKey" class="flex gap-3 w-full">
          <input
            v-model="openaiKey"
            type="password"
            :placeholder="hasOpenAIKey ? '******************************' : 'sk-...'"
            class="flex-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-white font-mono"
          />
          <button
            type="submit"
            :disabled="openaiLoading"
            class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-5 py-2.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            {{ openaiLoading ? '저장 중…' : '저장 적용' }}
          </button>
        </form>
      </div>



      <!-- 3-3. 수시 원서 접수 마감일 설정 (포기원 제출 마감 기준) -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 class="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <span class="w-1 h-3 bg-blue-600 rounded-full"></span>
          📅 수시 원서 접수 마감일 설정 (추천 포기원 제출 마감 기준)
        </h2>
        <p class="text-xs text-slate-400 mb-4">
          학생들이 학교장추천전형 포기 신청서(포기원)를 제출할 수 있는 <strong>수시 원서 접수 마감일(마지막 날)</strong>을 지정합니다.<br>
          설정한 마감일 자정(23:59:59)까지 학생 화면에서 추천 포기 신청 버튼이 활성화됩니다.
        </p>

        <form @submit.prevent="saveSusiApplyPeriod" class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">접수 시작일:</span>
            <input
              v-model="susiApplyStartDate"
              type="date"
              required
              class="text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-white"
            />
          </div>

          <span class="text-slate-400 font-bold text-center hidden sm:inline">~</span>

          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">접수 마감일:</span>
            <input
              v-model="susiApplyEndDate"
              type="date"
              required
              class="text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            :disabled="susiPeriodLoading"
            class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-5 py-2.5 cursor-pointer transition-colors whitespace-nowrap sm:ml-auto shrink-0"
          >
            {{ susiPeriodLoading ? '저장 중…' : '기간 저장' }}
          </button>
        </form>

        <p v-if="susiApplyEndDate" class="text-xs text-slate-500 mt-3">
          현재 설정 마감일: <strong class="text-blue-600 dark:text-blue-400">{{ susiApplyStartDate ? `${susiApplyStartDate} ~ ` : '' }}{{ susiApplyEndDate }}</strong>
          <span v-if="susiPeriodStatus === 'ACTIVE'" class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            🟢 원서접수 진행 중 (마감 전)
          </span>
          <span v-else-if="susiPeriodStatus === 'WAITING'" class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            ⏳ 시작 전 (대기 중)
          </span>
          <span v-else class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            🔒 원서접수 마감 (접수 종료)
          </span>
        </p>
        <p v-else class="text-xs text-amber-600 mt-3">
          ⚠️ 수시 원서 접수 마감일이 설정되지 않았습니다. (미설정 시 수시접수가 상시 가능합니다)
        </p>
      </div>

      <!-- 3-4. 정시 원서 접수 일정 설정 (농어촌 추천 시스템 재오픈 기준) -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 class="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <span class="w-1 h-3 bg-emerald-600 rounded-full"></span>
          📅 정시 원서 접수 일정 설정 (농어촌 추천 시스템 재오픈 기준)
        </h2>
        <p class="text-xs text-slate-400 mb-4">
          정시 원서 접수 기간을 설정합니다. 설정된 <strong>정시 접수 시작일 15일 전부터 마감일까지</strong> 농어촌 추천 시스템이 자동으로 재오픈됩니다.
        </p>

        <form @submit.prevent="saveJungsiApplyPeriod" class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">정시 시작일:</span>
            <input
              v-model="jungsiApplyStartDate"
              type="date"
              class="text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800 dark:text-white"
            />
          </div>

          <span class="text-slate-400 font-bold text-center hidden sm:inline">~</span>

          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">정시 마감일:</span>
            <input
              v-model="jungsiApplyEndDate"
              type="date"
              class="text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            :disabled="jungsiPeriodLoading"
            class="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 border-none rounded-lg px-5 py-2.5 cursor-pointer transition-colors whitespace-nowrap sm:ml-auto shrink-0"
          >
            {{ jungsiPeriodLoading ? '저장 중…' : '기간 저장' }}
          </button>
        </form>

        <p v-if="jungsiApplyStartDate && jungsiApplyEndDate" class="text-xs text-slate-500 mt-3">
          현재 정시 일정: <strong class="text-emerald-600 dark:text-emerald-400">{{ jungsiApplyStartDate }} ~ {{ jungsiApplyEndDate }}</strong>
          <span class="ml-2 text-slate-400 text-[11px]">
            (시작일 15일 전인 {{ calculate15DaysBefore(jungsiApplyStartDate) }}부터 자동 오픈)
          </span>
        </p>
      </div>

      <!-- 3-5. 구글 스프레드시트 DB 연동 설정 -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 class="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <span class="w-1 h-3 bg-emerald-600 rounded-full"></span>
          구글 스프레드시트 DB 연동 설정
        </h2>
        <p class="text-xs text-slate-400 mb-4">
          구글 스프레드시트의 <strong>시트 ID</strong>(URL 중 <code>/d/<b>[시트ID]</b>/edit</code> 부분)를 등록하면, 엑셀 파일 없이도 구글 시트 데이터로 DB를 실시간 구성/동기화할 수 있습니다.<br>
          ※ 구글 시트 공유 설정이 <strong>'링크가 있는 모든 사용자에게 공개 (웹에 게시 또는 링크 보기 가능)'</strong>로 되어 있어야 합니다.
        </p>

        <div class="space-y-4">
          <!-- 1. 학교장 추천 전형 구글 시트 ID -->
          <div class="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-3">
            <label class="block text-xs font-bold text-slate-800 dark:text-slate-200">
              1) 학교장 추천자 선발 전형 구글 시트 ID 
            </label>
            <div class="flex gap-2">
              <input
                v-model="googleSheetPrincipalId"
                type="text"
                :placeholder="hasGoogleSheetPrincipalId ? '저장된 ID (마스킹됨)' : 'ID 입력 (예: 1BxiMVs...)'"
                class="flex-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800 dark:text-white"
              />
              <button
                @click="saveGoogleSheetPrincipalId"
                :disabled="googleSheetPrincipalLoading"
                class="text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg px-3.5 cursor-pointer transition-colors whitespace-nowrap"
              >
                {{ googleSheetPrincipalLoading ? '저장 중…' : 'ID 저장' }}
              </button>
              <button
                @click="syncGoogleSheetPrincipal"
                :disabled="syncPrincipalLoading || (!googleSheetPrincipalId.trim() && !realGoogleSheetPrincipalId)"
                class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 border-none rounded-lg px-4 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1"
              >
                <span>🔄</span>
                <span>{{ syncPrincipalLoading ? '동기화 중…' : '학교장 전형 DB 동기화' }}</span>
              </button>
            </div>
          </div>

          <!-- 2. 농어촌 및 기회균형 구글 시트 ID -->
          <div class="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-3">
            <label class="block text-xs font-bold text-slate-800 dark:text-slate-200">
              2) 농어촌 및 기회균형 전형 구글 시트 ID 
            </label>
            <div class="flex gap-2">
              <input
                v-model="googleSheetRuralId"
                type="text"
                :placeholder="hasGoogleSheetRuralId ? '저장된 ID (마스킹됨)' : 'ID 입력 (예: 1CyiNWs...)'"
                class="flex-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800 dark:text-white"
              />
              <button
                @click="saveGoogleSheetRuralId"
                :disabled="googleSheetRuralLoading"
                class="text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg px-3.5 cursor-pointer transition-colors whitespace-nowrap"
              >
                {{ googleSheetRuralLoading ? '저장 중…' : 'ID 저장' }}
              </button>
              <button
                @click="syncGoogleSheetRural"
                :disabled="syncRuralLoading || (!googleSheetRuralId.trim() && !realGoogleSheetRuralId)"
                class="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 border-none rounded-lg px-4 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1"
              >
                <span>🔄</span>
                <span>{{ syncRuralLoading ? '동기화 중…' : '농어촌 전형 DB 동기화' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. 전형요소 등록 후 세부 수정 허용 (테스트/수정 모드) -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
              <span class="w-1 h-3 bg-blue-600 rounded-full"></span>
              전형요소 등록 후 세부 수정 허용 (테스트/수정 모드)
            </h2>
            <p class="text-xs text-slate-400">
              전형요소를 생성한 후에도 이름, 만점 배점, 산출 방식, 탐색 방향 등 세부 옵션을 자유롭게 수정할 수 있도록 허용합니다. (테스트 기간 권장)
            </p>
          </div>
          <button
            type="button"
            @click="toggleAllowAreaEdit"
            :disabled="areaEditLoading"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            :class="allowAreaEdit ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              :class="allowAreaEdit ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>

      <!-- 4-2. 농어촌 전형 시스템 활성화 -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
              <span class="w-1 h-3 bg-emerald-600 rounded-full"></span>
              농어촌 전형 시스템 활성화
            </h2>
            <p class="text-xs text-slate-400">
              농어촌 전형 및 기회균형 전형 학생 선발을 위한 전용 시스템과 메뉴를 활성화합니다.
            </p>
          </div>
          <button
            type="button"
            @click="toggleEnableRuralSystem"
            :disabled="ruralSystemLoading"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            :class="enableRuralSystem ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              :class="enableRuralSystem ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>

      <!-- 4-3. 수능응시 · 수시/정시 원서접수계획 등록 시스템 활성화 -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
              <span class="w-1 h-3 bg-violet-600 rounded-full"></span>
              수능응시 · 수시/정시 원서접수계획 등록 시스템 활성화
            </h2>
            <p class="text-xs text-slate-400">
              재학생 대상 수능 응시 여부 및 대학 수시·정시 원서접수 계획 파악, 확인서 출력, 수능 접수대장 대조 시스템을 활성화합니다.
            </p>
          </div>
          <button
            type="button"
            @click="toggleEnableExamIntentSystem"
            :disabled="examIntentSystemLoading"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            :class="enableExamIntentSystem ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              :class="enableExamIntentSystem ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>

      <!-- 5. 데이터 초기화 설정 -->
      <div class="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-950/40 rounded-xl p-6 shadow-sm">
        <h2 class="text-base font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2">
          <span class="w-1 h-3 bg-rose-600 rounded-full"></span>
          ⚠️ 시스템 데이터 초기화 관리
        </h2>
        <p class="text-xs text-slate-400 mb-6">
          선택한 범위에 따라 데이터베이스 정보를 초기화합니다. 작업 완료 후에는 되돌릴 수 없으므로 신중히 진행해 주세요.
        </p>

        <div class="flex flex-col sm:flex-row gap-4">
          <!-- 지원 현황만 초기화 -->
          <div class="flex-1 border border-slate-100 dark:border-slate-700/60 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/10 flex flex-col justify-between">
            <div>
              <h3 class="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">지원 현황만 초기화</h3>
              <p class="text-[11px] text-slate-400 mb-4 leading-relaxed">
                학생들이 제출한 모든 지원 희망원 정보(추천 신청서, 업로드된 학생/보호자 서명 및 포기원 요청 등)만 깨끗이 삭제합니다. 대학 설정, 학생 기본 명부 등은 유지됩니다.
              </p>
            </div>
            <button
              type="button"
              :disabled="resetAppLoading"
              @click="resetApplicationsOnly"
              class="w-full text-xs font-bold text-rose-600 hover:text-white bg-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg py-2.5 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
            >
              {{ resetAppLoading ? '초기화 진행 중…' : '지원의사 현황 초기화' }}
            </button>
          </div>

          <!-- 전체 데이터 초기화 -->
          <div class="flex-1 border border-red-100 dark:border-red-950/40 rounded-lg p-4 bg-red-50/10 dark:bg-red-950/5 flex flex-col justify-between">
            <div>
              <h3 class="text-xs font-bold text-red-700 dark:text-red-300 mb-1">모든 설정 및 정보 초기화</h3>
              <p class="text-[11px] text-slate-400 mb-4 leading-relaxed">
                지원 현황(희망원)을 포함하여 등록된 전체 대학 설정, 지역 추천 정원 요강, 정보공시 재학생 수, 학생 명부 데이터베이스를 공장 출하 상태로 완전히 초기화합니다.
              </p>
            </div>
            <button
              type="button"
              :disabled="resetAllLoading"
              @click="resetAllSystemData"
              class="w-full text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 border-none rounded-lg py-2.5 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
            >
              {{ resetAllLoading ? '전체 초기화 진행 중…' : '모든 데이터 전체 초기화' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../utils/supabaseClient'
import { fetchSchoolName, setSchoolNameConfig } from '../../utils/schoolConfig'
import { getDisclosureCount, setDisclosureCount, syncRegionalToUniversities, syncPrincipalUnivsFromGoogleSheet } from '../../api/admin.js'
import { syncRuralTracksFromGoogleSheet } from '../../api/ruralApi.js'
import { dialog } from '../common/dialog.js'
import { useAuthStore } from '../../stores/auth'
import { clearAllApplicationStorage, clearAllRuralStorage } from '../../utils/storageUtils'

const auth = useAuthStore()

const googleSheetPrincipalId = ref('')
const realGoogleSheetPrincipalId = ref('')
const googleSheetPrincipalLoading = ref(false)
const syncPrincipalLoading = ref(false)

const googleSheetRuralId = ref('')
const realGoogleSheetRuralId = ref('')
const googleSheetRuralLoading = ref(false)
const syncRuralLoading = ref(false)

function maskGoogleSheetId(id) {
  if (!id) return ''
  const str = String(id).trim()
  if (!str) return ''
  if (str.includes('•')) return str
  if (str.length <= 8) {
    return str.slice(0, 2) + '••••••••' + str.slice(-2)
  }
  return str.slice(0, 4) + '••••••••••••••••' + str.slice(-4)
}

const inputSchoolName = ref('')
const schoolNameLoading = ref(false)

const resetAppLoading = ref(false)
const resetAllLoading = ref(false)

const classCount = ref(11)
const classCountLoading = ref(false)

const disclosureCount = ref(null)
const disclosureCountLoading = ref(false)
const syncLoading = ref(false)
const syncResult = ref('')

const regCode = ref('')
const regCodeLoading = ref(false)

const openaiKey = ref('')
const openaiLoading = ref(false)
const hasOpenAIKey = ref(false)

const hasGoogleSheetPrincipalId = ref(false)
const hasGoogleSheetRuralId = ref(false)

const allowAreaEdit = ref(false)
const areaEditLoading = ref(false)

const enableRuralSystem = ref(false)
const ruralSystemLoading = ref(false)

const enableExamIntentSystem = ref(localStorage.getItem('pcm_enable_exam_intent_system') !== 'false')
const examIntentSystemLoading = ref(false)

const susiApplyStartDate = ref('')
const susiApplyEndDate = ref('')
const susiPeriodLoading = ref(false)

const jungsiApplyStartDate = ref('')
const jungsiApplyEndDate = ref('')
const jungsiPeriodLoading = ref(false)

function calculate15DaysBefore(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  if (isNaN(d.getTime())) return ''
  d.setDate(d.getDate() - 15)
  return d.toISOString().split('T')[0]
}

function getStatusText(startDate, endDate) {
  if (!startDate || !endDate) return '미설정'
  const today = new Date().toISOString().split('T')[0]
  if (today < startDate) return '⏳ 시작 전 (대기 중)'
  if (today > endDate) return '🔴 기간 마감'
  return '🟢 원서접수 진행 중 (마감 전)'
}

const susiPeriodStatus = computed(() => {
  if (!susiApplyStartDate.value || !susiApplyEndDate.value) return 'UNSET'
  const today = new Date().toISOString().split('T')[0]
  if (today < susiApplyStartDate.value) return 'WAITING'
  if (today > susiApplyEndDate.value) return 'ENDED'
  return 'ACTIVE'
})

const isSusiPeriodActive = computed(() => susiPeriodStatus.value === 'ACTIVE')

async function loadConfig() {
  inputSchoolName.value = await fetchSchoolName()
  const localEdit = localStorage.getItem('pcm_allow_area_edit') === 'true'
  allowAreaEdit.value = localEdit
  disclosureCount.value = await getDisclosureCount()

  if (!supabase) return
  try {
    const { data: rows, error } = await supabase
      .from('config')
      .select('key, value')

    if (error) {
      console.error('Error fetching config batch:', error)
    }

    const configMap = {}
    if (rows && Array.isArray(rows)) {
      rows.forEach(r => {
        if (r && r.key) {
          const k = String(r.key).trim().toLowerCase()
          configMap[k] = r.value !== null && r.value !== undefined ? String(r.value).trim() : ''
        }
      })
    }

    if (configMap['class_count']) {
      classCount.value = Number(configMap['class_count']) || 11
    }
    if (configMap['registration_code']) {
      regCode.value = configMap['registration_code']
    }

    const dbOpenAIKey = configMap['openai_api_key'] || ''
    const envOpenAIKey = import.meta.env.VITE_OPENAI_API_KEY
    hasOpenAIKey.value = !!(dbOpenAIKey || (envOpenAIKey && String(envOpenAIKey).trim()))
    openaiKey.value = ''



    const dbPrincipalId = configMap['google_sheet_principal_id'] || ''
    realGoogleSheetPrincipalId.value = dbPrincipalId
    hasGoogleSheetPrincipalId.value = !!dbPrincipalId
    googleSheetPrincipalId.value = dbPrincipalId ? maskGoogleSheetId(dbPrincipalId) : ''

    const dbRuralId = configMap['google_sheet_rural_id'] || ''
    realGoogleSheetRuralId.value = dbRuralId
    hasGoogleSheetRuralId.value = !!dbRuralId
    googleSheetRuralId.value = dbRuralId ? maskGoogleSheetId(dbRuralId) : ''

    if (configMap['allow_area_edit']) {
      allowAreaEdit.value = configMap['allow_area_edit'] === 'true'
      localStorage.setItem('pcm_allow_area_edit', configMap['allow_area_edit'])
    }
    if (configMap['enable_rural_system']) {
      enableRuralSystem.value = configMap['enable_rural_system'] === 'true'
      localStorage.setItem('pcm_enable_rural_system', configMap['enable_rural_system'])
    }
    if (configMap['enable_exam_intent_system'] !== undefined) {
      enableExamIntentSystem.value = configMap['enable_exam_intent_system'] !== 'false'
      localStorage.setItem('pcm_enable_exam_intent_system', String(enableExamIntentSystem.value))
    } else {
      enableExamIntentSystem.value = true
      localStorage.setItem('pcm_enable_exam_intent_system', 'true')
    }

    susiApplyStartDate.value = configMap['susi_apply_start_date'] || ''
    susiApplyEndDate.value = configMap['susi_apply_end_date'] || ''
    jungsiApplyStartDate.value = configMap['jungsi_apply_start_date'] || ''
    jungsiApplyEndDate.value = configMap['jungsi_apply_end_date'] || ''
  } catch (e) {
    console.error('Error loading config:', e)
  }
}

async function saveGoogleSheetPrincipalId() {
  googleSheetPrincipalLoading.value = true
  try {
    if (supabase) {
      const inputVal = googleSheetPrincipalId.value.trim()
      let targetVal = inputVal
      if (inputVal.includes('•')) {
        targetVal = realGoogleSheetPrincipalId.value
      } else {
        realGoogleSheetPrincipalId.value = inputVal
      }

      const { error } = await supabase.from('config').upsert({ key: 'google_sheet_principal_id', value: targetVal }, { onConflict: 'key' })
      if (error) throw error

      hasGoogleSheetPrincipalId.value = !!targetVal
      googleSheetPrincipalId.value = targetVal ? maskGoogleSheetId(targetVal) : ''
      alert('학교장 추천전형 구글 스프레드시트 ID가 저장되었습니다.')
    }
  } catch (e) {
    console.error(e)
    alert('구글 시트 ID 저장 중 오류가 발생했습니다.')
  } finally {
    googleSheetPrincipalLoading.value = false
  }
}

async function saveGoogleSheetRuralId() {
  googleSheetRuralLoading.value = true
  try {
    if (supabase) {
      const inputVal = googleSheetRuralId.value.trim()
      let targetVal = inputVal
      if (inputVal.includes('•')) {
        targetVal = realGoogleSheetRuralId.value
      } else {
        realGoogleSheetRuralId.value = inputVal
      }

      const { error } = await supabase.from('config').upsert({ key: 'google_sheet_rural_id', value: targetVal }, { onConflict: 'key' })
      if (error) throw error

      hasGoogleSheetRuralId.value = !!targetVal
      googleSheetRuralId.value = targetVal ? maskGoogleSheetId(targetVal) : ''
      alert('농어촌 전형 구글 스프레드시트 ID가 저장되었습니다.')
    }
  } catch (e) {
    console.error(e)
    alert('구글 시트 ID 저장 중 오류가 발생했습니다.')
  } finally {
    googleSheetRuralLoading.value = false
  }
}

async function syncGoogleSheetPrincipal() {
  const inputVal = googleSheetPrincipalId.value.trim()
  let targetId = inputVal
  if (inputVal.includes('•') || !inputVal) {
    targetId = realGoogleSheetPrincipalId.value
  }

  if (!targetId) {
    alert('구글 스프레드시트 ID를 먼저 입력하고 저장해 주세요.')
    return
  }
  syncPrincipalLoading.value = true
  try {
    const res = await syncPrincipalUnivsFromGoogleSheet(targetId)
    alert(`학교장 추천전형 DB 동기화 완료! (총 ${res.count}건 파싱 및 업데이트됨)`)
  } catch (e) {
    console.error('Failed to sync principal sheet:', e)
    alert(`구글 시트 동기화 실패: ${e.message}`)
  } finally {
    syncPrincipalLoading.value = false
  }
}

async function syncGoogleSheetRural() {
  const inputVal = googleSheetRuralId.value.trim()
  let targetId = inputVal
  if (inputVal.includes('•') || !inputVal) {
    targetId = realGoogleSheetRuralId.value
  }

  if (!targetId) {
    alert('구글 스프레드시트 ID를 먼저 입력하고 저장해 주세요.')
    return
  }
  syncRuralLoading.value = true
  try {
    const inserted = await syncRuralTracksFromGoogleSheet(targetId)
    alert(`농어촌 및 기회균형 전형 DB 동기화 완료! (총 ${inserted.length}개 전형 저장됨)`)
  } catch (e) {
    console.error('Failed to sync rural sheet:', e)
    alert(`구글 시트 동기화 실패: ${e.message}`)
  } finally {
    syncRuralLoading.value = false
  }
}

async function saveJungsiApplyPeriod() {
  if (jungsiApplyStartDate.value && jungsiApplyEndDate.value && jungsiApplyStartDate.value > jungsiApplyEndDate.value) {
    alert('정시 시작일은 마감일보다 이전이어야 합니다.')
    return
  }
  jungsiPeriodLoading.value = true
  try {
    if (supabase) {
      const { error: err1 } = await supabase.from('config').upsert({ key: 'jungsi_apply_start_date', value: jungsiApplyStartDate.value }, { onConflict: 'key' })
      const { error: err2 } = await supabase.from('config').upsert({ key: 'jungsi_apply_end_date', value: jungsiApplyEndDate.value }, { onConflict: 'key' })
      if (err1) throw err1
      if (err2) throw err2
      alert('정시 원서 접수 일정이 저장되었습니다.')
    }
  } catch (e) {
    console.error(e)
    alert('정시 일정 저장 중 오류가 발생했습니다.')
  } finally {
    jungsiPeriodLoading.value = false
  }
}

async function saveSusiApplyPeriod() {
  if (susiApplyStartDate.value && susiApplyEndDate.value && susiApplyStartDate.value > susiApplyEndDate.value) {
    alert('시작일은 종료일보다 이전이어야 합니다.')
    return
  }
  susiPeriodLoading.value = true
  try {
    if (supabase) {
      const { error: err1 } = await supabase.from('config').upsert({ key: 'susi_apply_start_date', value: susiApplyStartDate.value }, { onConflict: 'key' })
      const { error: err2 } = await supabase.from('config').upsert({ key: 'susi_apply_end_date', value: susiApplyEndDate.value }, { onConflict: 'key' })
      if (err1) throw err1
      if (err2) throw err2
      alert('수시 원서 접수 기간이 설정되었습니다.')
    }
  } catch (e) {
    console.error(e)
    alert('기간 저장 중 오류가 발생했습니다.')
  } finally {
    susiPeriodLoading.value = false
  }
}

async function toggleAllowAreaEdit() {
  allowAreaEdit.value = !allowAreaEdit.value
  areaEditLoading.value = true
  localStorage.setItem('pcm_allow_area_edit', String(allowAreaEdit.value))
  if (supabase) {
    try {
      await supabase
        .from('config')
        .upsert({ key: 'allow_area_edit', value: String(allowAreaEdit.value) }, { onConflict: 'key' })
    } catch (e) {
      console.error(e)
    } finally {
      areaEditLoading.value = false
    }
  } else {
    areaEditLoading.value = false
  }
}

async function toggleEnableRuralSystem() {
  enableRuralSystem.value = !enableRuralSystem.value
  ruralSystemLoading.value = true
  localStorage.setItem('pcm_enable_rural_system', String(enableRuralSystem.value))
  if (supabase) {
    try {
      const { error } = await supabase
        .from('config')
        .upsert({ key: 'enable_rural_system', value: String(enableRuralSystem.value) }, { onConflict: 'key' })
      if (error) throw error
      alert(`농어촌 전형 시스템이 ${enableRuralSystem.value ? '활성화' : '비활성화'}되었습니다. 전체 화면을 새로고침하고 로그아웃합니다.`)
      await auth.logout()
      const baseUrl = import.meta.env.BASE_URL || '/'
      const targetPath = baseUrl.endsWith('/') ? `${baseUrl}login` : `${baseUrl}/login`
      window.location.href = targetPath
    } catch (e) {
      console.error(e)
      alert('농어촌 시스템 설정 저장 중 오류가 발생했습니다.')
    } finally {
      ruralSystemLoading.value = false
    }
  } else {
    ruralSystemLoading.value = false
  }
}

async function toggleEnableExamIntentSystem() {
  enableExamIntentSystem.value = !enableExamIntentSystem.value
  examIntentSystemLoading.value = true
  localStorage.setItem('pcm_enable_exam_intent_system', String(enableExamIntentSystem.value))
  if (supabase) {
    try {
      const { error } = await supabase
        .from('config')
        .upsert({ key: 'enable_exam_intent_system', value: String(enableExamIntentSystem.value) }, { onConflict: 'key' })
      if (error) throw error
      alert(`수능응시 · 수시/정시 원서접수계획 등록 시스템이 ${enableExamIntentSystem.value ? '활성화' : '비활성화'}되었습니다.`)
    } catch (e) {
      console.error(e)
      alert('설정 저장 중 오류가 발생했습니다.')
    } finally {
      examIntentSystemLoading.value = false
    }
  } else {
    examIntentSystemLoading.value = false
  }
}

async function saveSchoolName() {
  schoolNameLoading.value = true
  try {
    const finalName = await setSchoolNameConfig(inputSchoolName.value)
    inputSchoolName.value = finalName
    alert('학교 이름이 \'' + finalName + '\'(으)로 설정되었습니다.')
  } catch (e) {
    console.error(e)
    alert('학교 이름 저장 도중 오류가 발생했습니다.')
  } finally {
    schoolNameLoading.value = false
  }
}

async function saveClassCount() {
  if (!supabase) return
  classCountLoading.value = true
  try {
    const { error } = await supabase
      .from('config')
      .upsert({ key: 'class_count', value: String(classCount.value) })

    if (error) throw error
    localStorage.setItem('pcm_class_count', String(classCount.value))
    alert('3학년 학급 수가 ' + classCount.value + '반으로 변경되었습니다.')
  } catch (e) {
    console.error(e)
    alert('학급 수 변경 도중 오류가 발생했습니다.')
  } finally {
    classCountLoading.value = false
  }
}

async function saveDisclosureCount() {
  if (!disclosureCount.value || disclosureCount.value < 1) {
    dialog.alert('재학생 수를 1명 이상으로 입력해 주세요.')
    return
  }
  disclosureCountLoading.value = true
  try {
    await setDisclosureCount(disclosureCount.value)
    syncResult.value = ''
    dialog.alert(`정보공시 재학생 수가 ${disclosureCount.value}명으로 저장되었습니다.`)
  } catch (e) {
    console.error('saveDisclosureCount error:', e)
    dialog.alert(`저장 도중 오류가 발생했습니다: ${e.message || e}`)
  } finally {
    disclosureCountLoading.value = false
  }
}

async function doSyncPercentQuotas() {
  if (!disclosureCount.value || disclosureCount.value < 1) {
    alert('먼저 정보공시 재학생 수를 저장해 주세요.')
    return
  }
  syncLoading.value = true
  syncResult.value = ''
  try {
    const res = await syncRegionalToUniversities()
    const updated = res.updatedCount || 0
    const created = res.count || 0
    if (updated > 0 || created > 0) {
      syncResult.value = '✅ 완료: 신규 ' + created + '건 등록, 기존 ' + updated + '건 업데이트.\n대학 설정 탭과 결과 보고서를 새로고침하면 적용됩니다.'
    } else {
      syncResult.value = '업데이트할 항목이 없습니다. (엑셀 데이터가 없거나 이미 최신 상태)'
    }
    if (res.percentWarnings && res.percentWarnings.length > 0) {
      syncResult.value += '\n⚠️ 처리 안된 항목:\n' + res.percentWarnings.join('\n')
    }
  } catch (e) {
    syncResult.value = '❌ 오류: ' + (e.message || '동기화 중 오류 발생')
  } finally {
    syncLoading.value = false
  }
}
async function saveRegCode() {
  if (!supabase) return
  regCodeLoading.value = true
  try {
    const { error } = await supabase
      .from('config')
      .upsert({ key: 'registration_code', value: regCode.value })

    if (error) throw error
    alert('학생 가입코드가 변경되었습니다.')
  } catch (e) {
    console.error(e)
    alert('가입코드 변경 도중 오류가 발생했습니다.')
  } finally {
    regCodeLoading.value = false
  }
}

async function saveOpenAIKey() {
  if (!supabase) return
  openaiLoading.value = true
  try {
    const val = openaiKey.value.trim()
    const { error } = await supabase
      .from('config')
      .upsert({ key: 'openai_api_key', value: val }, { onConflict: 'key' })

    if (error) throw error
    hasOpenAIKey.value = !!val
    openaiKey.value = ''
    alert('OpenAI API Key가 저장되었습니다.')
  } catch (e) {
    console.error(e)
    alert('OpenAI Key 저장 도중 오류가 발생했습니다.')
  } finally {
    openaiLoading.value = false
  }
}



async function resetApplicationsOnly() {
  if (!supabase) return
  if (!(await dialog.confirm({
    title: '⚠️ 지원 현황 초기화 경고',
    message: '학생들이 제출한 모든 대입 학교장추천 희망서와 서명, 추천 확정 및 포기원 데이터가 영구 삭제됩니다. 계속하시겠습니까?',
    confirmText: '지원 현황만 초기화',
    level: 'danger',
    dangerNotice: '이 작업은 취소할 수 없습니다. 모든 학급의 학생 신청 목록 및 스토리지 서명/문서 파일이 완전 삭제됩니다.',
    finalConfirmText: '확인 및 삭제'
  }))) return

  resetAppLoading.value = true
  try {
    // 1. Supabase Storage 서명 및 보관 문서 파일 일괄 전면 삭제
    await clearAllApplicationStorage()

    // 2. DB applications 레코드 삭제
    const { error: appErr } = await supabase
      .from('applications')
      .delete()
      .gt('created_at', '1970-01-01')

    if (appErr) throw appErr

    try {
      const { data: rList1 } = await supabase.from('timeline_rounds').select('id')
      if (rList1 && rList1.length > 0) {
        for (const r of rList1) {
          try { await supabase.from('timeline_rounds').update({ status: 'DRAFT' }).eq('id', r.id) } catch {}
        }
      }
    } catch {}

    try {
      const userRes = await supabase.auth.getUser()
      if (userRes?.data?.user) {
        await supabase.from('audit_logs').insert({
          actor_id: userRes.data.user.id,
          action: 'RESET_APPLICATIONS_ONLY',
          details: { message: '교사용/학생용 지원 현황 데이터 및 서명/문서 스토리지 파일 일괄 삭제 초기화' }
        })
      }
    } catch {}

    alert('학생들의 지원 현황 및 서명 파일이 성공적으로 초기화되었습니다.')
  } catch (e) {
    console.error(e)
    alert(e.message || '지원 현황 초기화 작업 중 오류가 발생했습니다.')
  } finally {
    resetAppLoading.value = false
  }
}

async function resetAllSystemData() {
  if (!supabase) return
  if (!(await dialog.confirm({
    title: '🚨 시스템 전체 초기화 경고',
    message: '지원 현황을 포함한 대학 목록, 지역 정원 요강, 정보공시 재학생 설정 및 학생 마스터 DB, 서명 스토리지 파일 등 모든 데이터가 완전히 소멸됩니다. 정말로 공장 초기화를 진행하시겠습니까?',
    confirmText: '모든 데이터 초기화',
    level: 'danger',
    dangerNotice: '모든 데이터베이스 테이블과 서명 스토리지 파일이 완전히 초기화됩니다. 이 작업은 즉각 반영되며 절대 취소할 수 없습니다.',
    finalConfirmText: '공장 초기화 최종 확정'
  }))) return

  resetAllLoading.value = true
  try {
    // 1. 모든 Storage 버킷 (signatures, documents, rural_signatures) 파일 전면 삭제
    await clearAllApplicationStorage()
    await clearAllRuralStorage()

    // 2. 모든 DB 테이블 데이터 삭제
    await supabase.from('applications').delete().not('id', 'is', null)
    await supabase.from('universities').delete().not('id', 'is', null)
    await supabase.from('regional_recommendations').delete().not('id', 'is', null)
    await supabase.from('enrolled_students').delete().not('id', 'is', null)
    await supabase.from('config').update({ value: null }).neq('key', 'openai_api_key')
    try {
      const { data: rList2 } = await supabase.from('timeline_rounds').select('id')
      if (rList2 && rList2.length > 0) {
        for (const r of rList2) {
          try { await supabase.from('timeline_rounds').update({ status: 'DRAFT' }).eq('id', r.id) } catch {}
        }
      }
    } catch {}
    await supabase.from('audit_logs').delete().not('id', 'is', null)

    try {
      const userRes = await supabase.auth.getUser()
      if (userRes?.data?.user) {
        await supabase.from('audit_logs').insert({
          actor_id: userRes.data.user.id,
          action: 'RESET_ALL_SYSTEM_DATA',
          details: { message: '시스템 전체 데이터 공장 초기화 완료' }
        })
      }
    } catch {}

    disclosureCount.value = null
    classCount.value = 11
    inputSchoolName.value = '우리고등학교'
    
    alert('시스템의 모든 설정 및 데이터베이스 초기화가 완료되었습니다.')
    window.location.reload()
  } catch (e) {
    console.error(e)
    alert(e.message || '시스템 데이터 전체 초기화 작업 중 오류가 발생했습니다.')
  } finally {
    resetAllLoading.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>
