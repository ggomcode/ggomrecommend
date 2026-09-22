<template>
  <div class="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col justify-between transition-colors">
    
    <!-- 1. 상단 글로벌 헤더 -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <GraduationCap class="w-5 h-5" />
          </div>
          <div class="flex flex-col leading-tight">
            <span class="text-[11px] font-extrabold text-indigo-600 tracking-wide">{{ schoolName }}</span>
            <h1 class="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
              전문대학 학교장 추천
              <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hidden sm:inline-block">
                직인 발급 · 무심의 전형
              </span>
            </h1>
          </div>
        </div>

        <div class="flex items-center gap-3">
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
            @click="goToPortal"
            class="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
            title="대문(포털)으로 이동"
          >
            <Home class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">포털 이동</span>
          </button>

          <button
            @click="handleLogout"
            class="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-all cursor-pointer border border-slate-200"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>

    <!-- 2. 메인 콘텐츠 영역 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
      
      <!-- 안내 배너 -->
      <div class="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border border-indigo-100 flex items-start gap-3.5 shadow-2xs">
        <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <Info class="w-4 h-4" />
        </div>
        <div class="text-xs sm:text-sm text-slate-700 space-y-1">
          <p class="font-bold text-indigo-950 m-0 text-sm">
            전문대학 학교장 추천전형 신청 및 직인 날인 안내
          </p>
          <p class="m-0 text-slate-600 leading-relaxed text-xs">
            전문대학 학교장 추천은 별도의 교내 심의(석차 경쟁) 과정이 필요하지 않습니다. 
            지원하고자 하는 <strong>대학명, 학과(부)명, 전형명</strong>을 직접 수동 입력하여 신청서를 등록한 후, 
            <strong>[학교장 추천서 인쇄]</strong> 버튼으로 추천서를 출력하여 <strong>행정실에서 학교장 직인을 날인</strong>받으시기 바랍니다.
          </p>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- A. 학생 전용 화면 (auth.isStudent) -->
      <!-- ======================================================== -->
      <div v-if="auth.isStudent" class="space-y-6">
        
        <!-- 내 신청 현황 목록 및 신규 작성 카드 -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- 좌측: 신청 입력 폼 (5 cols) -->
          <div class="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h2 class="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
                  <PenTool class="w-4 h-4 text-indigo-600" />
                  {{ editingRecordId ? '전문대학 추천 신청 수정' : '전문대학 추천 신청 등록' }}
                </h2>
                <span v-if="editingRecordId" class="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  수정 모드
                </span>
              </div>

              <form @submit.prevent="handleSubmitStudentForm" class="space-y-4 text-left">
                <!-- 지원 대학명 (직접 입력) -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    지원 전문대학명 <span class="text-rose-500">*</span>
                  </label>
                  <input
                    v-model="form.univ_name"
                    type="text"
                    required
                    placeholder="예: 인하공업전문대학, 동양미래대학교 등"
                    class="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-900 font-medium"
                  />
                </div>

                <!-- 지원 학과(부)명 (직접 입력) -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    지원 학과(부)명 <span class="text-rose-500">*</span>
                  </label>
                  <input
                    v-model="form.department_name"
                    type="text"
                    required
                    placeholder="예: 컴퓨터정보과, 기계공학과, 항공운항과 등"
                    class="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-900 font-medium"
                  />
                </div>

                <!-- 지원 전형명 (직접 입력) -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    지원 전형명 <span class="text-rose-500">*</span>
                  </label>
                  <input
                    v-model="form.track_name"
                    type="text"
                    required
                    placeholder="예: 일반고 특별전형, 학교장추천전형 등"
                    class="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-900 font-medium"
                  />
                </div>

                <!-- 모집 시기 (선택) -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">
                    모집 시기 <span class="text-rose-500">*</span>
                  </label>
                  <div class="grid grid-cols-4 gap-2">
                    <button
                      v-for="term in termOptions"
                      :key="term"
                      type="button"
                      @click="form.admission_term = term"
                      :class="[
                        'py-2 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center',
                        form.admission_term === term
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      ]"
                    >
                      {{ term }}
                    </button>
                  </div>
                </div>

                <!-- 연락처 정보 -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">학생 연락처</label>
                    <input
                      v-model="form.student_phone"
                      type="tel"
                      placeholder="010-0000-0000"
                      class="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-900"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">보호자 연락처</label>
                    <input
                      v-model="form.parent_phone"
                      type="tel"
                      placeholder="010-0000-0000"
                      class="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-900"
                    />
                  </div>
                </div>

                <!-- 추천 사유 / 의견 -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-xs font-bold text-slate-700">추천 사유 및 종합의견</label>
                    <button
                      type="button"
                      @click="applyDefaultReason"
                      class="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold bg-transparent border-none cursor-pointer"
                    >
                      기본 문구 채우기
                    </button>
                  </div>
                  <textarea
                    v-model="form.recommendation_reason"
                    rows="3"
                    placeholder="위 학생은 품행이 단정하고 성실하며..."
                    class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-900 leading-relaxed resize-none"
                  ></textarea>
                </div>

                <div class="pt-2 flex items-center gap-2">
                  <button
                    v-if="editingRecordId"
                    type="button"
                    @click="cancelEdit"
                    class="w-1/3 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 cursor-pointer"
                  >
                    수정 취소
                  </button>
                  <button
                    type="submit"
                    :disabled="formSubmitting"
                    class="flex-1 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl border-none cursor-pointer transition-colors shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <Check class="w-4 h-4" />
                    {{ formSubmitting ? '저장 중…' : (editingRecordId ? '수정 내용 저장' : '전문대학 추천 신청 등록') }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- 우측: 내 신청 현황 목록 (7 cols) -->
          <div class="lg:col-span-7 space-y-4">
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <h2 class="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
                  <FileText class="w-4 h-4 text-indigo-600" />
                  내 전문대학 추천 신청 내역
                  <span class="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {{ myRecords.length }}건
                  </span>
                </h2>
                <!-- 전체 신청 확인서 일괄 인쇄 버튼 -->
                <button
                  v-if="myRecords.length > 0"
                  @click="handlePrintAllMyRecommendations"
                  class="text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-xl border-none cursor-pointer transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
                  title="등록된 모든 지원 전문대학 내역이 포함된 추천 신청 확인서 인쇄"
                >
                  <Printer class="w-3.5 h-3.5" />
                  전체 추천 신청 확인서 인쇄
                </button>
              </div>

              <!-- 로딩 상태 -->
              <div v-if="loading" class="py-12 text-center text-slate-400">
                <div class="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p class="text-xs font-medium m-0">신청 내역을 불러오는 중입니다...</p>
              </div>

              <!-- 신청 내역 없음 -->
              <div v-else-if="myRecords.length === 0" class="py-16 text-center text-slate-400 space-y-3">
                <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <GraduationCap class="w-6 h-6" />
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-600 m-0">등록된 전문대학 추천 신청 내역이 없습니다.</p>
                  <p class="text-xs text-slate-400 m-0 mt-1">왼쪽의 신청 폼에서 지원할 전문대학 정보를 입력해 주세요.</p>
                </div>
              </div>

              <!-- 신청 목록 카드 뷰 -->
              <div v-else class="space-y-3 pt-3">
                <div
                  v-for="(rec, idx) in myRecords"
                  :key="rec.id || idx"
                  class="p-4 rounded-xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-xs transition-all bg-white relative group"
                >
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                    <div>
                      <div class="flex items-center gap-2 mb-1">
                        <span class="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-100 text-indigo-800">
                          {{ rec.admission_term || '수시 1차' }}
                        </span>
                        <span class="text-xs text-slate-400 font-medium">
                          {{ rec.created_at ? rec.created_at.substring(0, 10) : '' }}
                        </span>
                      </div>
                      <h3 class="text-base font-extrabold text-slate-900 m-0">
                        {{ rec.univ_name }}
                        <span class="text-sm font-bold text-indigo-600 ml-1">· {{ rec.department_name }}</span>
                      </h3>
                    </div>

                    <!-- 추천 신청 확인서 인쇄 버튼 -->
                    <button
                      @click="handlePrintRecommendation(rec)"
                      class="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2 rounded-xl cursor-pointer transition-all shadow-2xs flex items-center justify-center gap-1.5 shrink-0"
                      title="내부결재 첨부용 추천 신청 확인서 인쇄"
                    >
                      <Printer class="w-3.5 h-3.5" />
                      신청 확인서 인쇄
                    </button>
                  </div>

                  <div class="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-600 space-y-1 mb-3">
                    <p class="m-0">
                      <strong class="text-slate-700">지원 전형:</strong> {{ rec.track_name }}
                    </p>
                    <p v-if="rec.recommendation_reason" class="m-0 text-slate-500 line-clamp-2">
                      <strong class="text-slate-700">추천 사유:</strong> {{ rec.recommendation_reason }}
                    </p>
                  </div>

                  <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div class="flex items-center gap-2">
                      <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <CheckCircle class="w-3 h-3 text-emerald-600" />
                        {{ rec.status === 'issued' ? '직인 날인 완료' : '확인서 출력 가능' }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        @click="startEdit(rec)"
                        class="text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-transparent border-none cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 class="w-3 h-3" /> 수정
                      </button>
                      <button
                        @click="handleDelete(rec.id)"
                        class="text-xs font-semibold text-rose-500 hover:text-rose-700 bg-transparent border-none cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 class="w-3 h-3" /> 삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 행정실 내부결재 절차 안내 팁 박스 -->
            <div class="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 text-xs flex items-start gap-3">
              <Stamp class="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div class="space-y-1">
                <p class="font-bold m-0 text-indigo-950">교내 내부결재 및 학교장 직인 날인 절차</p>
                <p class="m-0 text-indigo-900 leading-relaxed">
                  1. 위의 <strong>[전체 추천 신청 확인서 인쇄]</strong>를 클릭하여 확인서를 A4 용지에 출력합니다.<br>
                  2. 담임선생님께 제출하여 확인 서명(결재)을 득합니다.<br>
                  3. 학교장 추천 직인 날인을 위한 교내 내부결재 기안에 첨부문서로 사용되며, 결재 후 행정실에서 직인을 날인받습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ======================================================== -->
      <!-- B. 교사/관리자 전용 화면 (auth.isTeacher, auth.isAdmin) -->
      <!-- ======================================================== -->
      <div v-else class="space-y-6">
        
        <!-- 상단 통계 요약 카드 4종 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <p class="text-xs font-bold text-slate-500 m-0 mb-1">총 추천 신청 건수</p>
            <p class="text-2xl font-black text-slate-900 m-0">
              {{ allRecords.length }}<span class="text-sm font-semibold text-slate-500 ml-1">건</span>
            </p>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <p class="text-xs font-bold text-indigo-600 m-0 mb-1">수시 1차 신청</p>
            <p class="text-2xl font-black text-indigo-600 m-0">
              {{ countByTerm('수시 1차') }}<span class="text-sm font-semibold text-slate-500 ml-1">건</span>
            </p>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <p class="text-xs font-bold text-blue-600 m-0 mb-1">수시 2차 신청</p>
            <p class="text-2xl font-black text-blue-600 m-0">
              {{ countByTerm('수시 2차') }}<span class="text-sm font-semibold text-slate-500 ml-1">건</span>
            </p>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <p class="text-xs font-bold text-emerald-600 m-0 mb-1">정시 및 기타</p>
            <p class="text-2xl font-black text-emerald-600 m-0">
              {{ countByTerm('정시') + countByTerm('기타') }}<span class="text-sm font-semibold text-slate-500 ml-1">건</span>
            </p>
          </div>
        </div>

        <!-- 필터 및 액션 툴바 -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div class="flex flex-wrap items-center gap-2.5">
            <!-- 학급 필터 -->
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-slate-600">학급:</span>
              <select
                v-model="filterClass"
                @change="loadAdminData"
                class="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800"
              >
                <option value="all">전체 학급</option>
                <option v-for="c in classOptions" :key="c" :value="c">{{ c }}반</option>
                <option value="grad">졸업생</option>
              </select>
            </div>

            <!-- 모집시기 필터 -->
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-slate-600">모집시기:</span>
              <select
                v-model="filterTerm"
                @change="loadAdminData"
                class="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800"
              >
                <option value="all">전체 시기</option>
                <option v-for="t in termOptions" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>

            <!-- 검색 입력 -->
            <div class="relative min-w-[200px]">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="학생명, 학번, 대학명 검색"
                class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800"
              />
              <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <button
              @click="loadAdminData"
              class="text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg border border-slate-200 cursor-pointer"
              title="새로고침"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
            </button>
          </div>

          <!-- 주요 실행 버튼군 -->
          <div class="flex items-center gap-2 shrink-0">
            <button
              @click="openCreateModal"
              class="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Plus class="w-3.5 h-3.5" />
              학생 대리 등록
            </button>

            <button
              @click="handlePrintRoster"
              :disabled="filteredRecords.length === 0"
              class="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed border-none px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="추후 교내 내부결재 기안용 추천자 명단 대장 출력"
            >
              <Printer class="w-3.5 h-3.5" />
              내부결재용 대장 인쇄 ({{ filteredRecords.length }}건)
            </button>
          </div>
        </div>

        <!-- 현황 테이블 -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold">
                  <th class="py-3 px-3 text-center w-12">연번</th>
                  <th class="py-3 px-3 text-center w-20">학급·번호</th>
                  <th class="py-3 px-3 text-center w-16">학번</th>
                  <th class="py-3 px-3 w-20">성명</th>
                  <th class="py-3 px-3">지원 대학</th>
                  <th class="py-3 px-3">지원 학과(부)</th>
                  <th class="py-3 px-3">지원 전형명</th>
                  <th class="py-3 px-3 text-center w-20">모집시기</th>
                  <th class="py-3 px-3 text-center w-28">연락처</th>
                  <th class="py-3 px-3 text-center w-20">신청일</th>
                  <th class="py-3 px-3 text-center w-28">관리</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="loading">
                  <td colspan="11" class="py-12 text-center text-slate-400">
                    <div class="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    데이터 로딩 중...
                  </td>
                </tr>
                <tr v-else-if="filteredRecords.length === 0">
                  <td colspan="11" class="py-12 text-center text-slate-400">
                    조회된 전문대학 추천 신청 데이터가 없습니다.
                  </td>
                </tr>
                <tr
                  v-else
                  v-for="(r, idx) in filteredRecords"
                  :key="r.id || idx"
                  class="hover:bg-slate-50/80 transition-colors text-slate-800"
                >
                  <td class="py-3 px-3 text-center text-slate-400 font-medium">{{ idx + 1 }}</td>
                  <td class="py-3 px-3 text-center font-bold">
                    {{ r.is_enrolled !== false ? `${r.grade || 3}-${r.class_no || '-'}-${r.seq_no || '-'}` : `졸업(${r.grad_year || '-'})` }}
                  </td>
                  <td class="py-3 px-3 text-center text-slate-500 font-mono">{{ r.student_code || '-' }}</td>
                  <td class="py-3 px-3 font-bold text-slate-900">{{ r.student_name }}</td>
                  <td class="py-3 px-3 font-extrabold text-indigo-700">{{ r.univ_name }}</td>
                  <td class="py-3 px-3 font-semibold">{{ r.department_name }}</td>
                  <td class="py-3 px-3 text-slate-600">{{ r.track_name }}</td>
                  <td class="py-3 px-3 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {{ r.admission_term || '수시 1차' }}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">{{ r.student_phone || '-' }}</td>
                  <td class="py-3 px-3 text-center text-slate-400 text-[11px]">{{ r.created_at ? r.created_at.substring(0, 10) : '-' }}</td>
                  <td class="py-3 px-3 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <button
                        @click="handlePrintRecommendation(r)"
                        class="p-1 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                        title="추천서 인쇄"
                      >
                        <Printer class="w-3.5 h-3.5" />
                      </button>
                      <button
                        @click="openEditModal(r)"
                        class="p-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition-colors cursor-pointer"
                        title="수정"
                      >
                        <Edit3 class="w-3.5 h-3.5" />
                      </button>
                      <button
                        @click="handleDelete(r.id)"
                        class="p-1 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors cursor-pointer"
                        title="삭제"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </main>

    <!-- 3. 교사/관리자용 대리 등록 / 수정 모달 -->
    <div
      v-if="showAdminModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
            <PenTool class="w-4 h-4 text-indigo-600" />
            {{ modalRecordId ? '전문대학 추천 신청 수정' : '학생 대리 추천 신청 등록' }}
          </h3>
          <button
            @click="showAdminModal = false"
            class="text-slate-400 hover:text-slate-600 font-bold text-lg bg-transparent border-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent="handleSaveAdminModal" class="space-y-3.5 text-left text-xs">
          <!-- 학생 선택 (신규 등록 시) -->
          <div v-if="!modalRecordId" class="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label class="block font-bold text-slate-800">대상 학생 선택 <span class="text-rose-500">*</span></label>
            <div class="grid grid-cols-2 gap-2 mb-2">
              <select
                v-model="modalSelectedClass"
                @change="loadStudentsForModal"
                class="p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
              >
                <option value="all">전체 학생</option>
                <option v-for="c in classOptions" :key="c" :value="c">{{ c }}반</option>
                <option value="grad">졸업생</option>
              </select>
              <select
                v-model="modalSelectedStudentId"
                @change="onStudentSelectChanged"
                required
                class="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-indigo-900"
              >
                <option value="" disabled>-- 학생 선택 --</option>
                <option
                  v-for="st in availableStudents"
                  :key="st.id || st.student_code"
                  :value="st.id || st.student_code"
                >
                  {{ st.is_enrolled !== false ? `${st.class_no}반 ${st.seq_no}번 ${st.name} (${st.student_code})` : `졸업 ${st.name} (${st.student_code})` }}
                </option>
              </select>
            </div>
          </div>

          <!-- 학생 인적사항 표시 (수정 시) -->
          <div v-else class="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 font-bold">
            학생: {{ adminForm.student_name }} (학번: {{ adminForm.student_code }})
          </div>

          <!-- 대학/학과/전형 직접 입력 -->
          <div class="space-y-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">지원 전문대학명 <span class="text-rose-500">*</span></label>
              <input
                v-model="adminForm.univ_name"
                type="text"
                required
                placeholder="예: 인하공업전문대학, 동양미래대학교 등"
                class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-900 text-xs font-semibold"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">지원 학과(부)명 <span class="text-rose-500">*</span></label>
              <input
                v-model="adminForm.department_name"
                type="text"
                required
                placeholder="예: 컴퓨터정보과, 스마트기계공학과 등"
                class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-900 text-xs font-semibold"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">지원 전형명 <span class="text-rose-500">*</span></label>
              <input
                v-model="adminForm.track_name"
                type="text"
                required
                placeholder="예: 일반고 특별전형, 학교장추천전형 등"
                class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-900 text-xs font-semibold"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">모집 시기 <span class="text-rose-500">*</span></label>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="term in termOptions"
                  :key="term"
                  type="button"
                  @click="adminForm.admission_term = term"
                  :class="[
                    'py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center',
                    adminForm.admission_term === term
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  ]"
                >
                  {{ term }}
                </button>
              </div>
            </div>

            <!-- 연락처 -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-slate-700 mb-1">학생 연락처</label>
                <input
                  v-model="adminForm.student_phone"
                  type="tel"
                  placeholder="010-0000-0000"
                  class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">보호자 연락처</label>
                <input
                  v-model="adminForm.parent_phone"
                  type="tel"
                  placeholder="010-0000-0000"
                  class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <!-- 추천 사유 -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="font-bold text-slate-700">추천 사유</label>
                <button
                  type="button"
                  @click="applyAdminDefaultReason"
                  class="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold bg-transparent border-none cursor-pointer"
                >
                  기본 문구 적용
                </button>
              </div>
              <textarea
                v-model="adminForm.recommendation_reason"
                rows="3"
                class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs resize-none"
              ></textarea>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="showAdminModal = false"
              class="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              :disabled="adminSubmitting"
              class="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl border-none cursor-pointer transition-colors shadow-sm disabled:bg-slate-300"
            >
              {{ adminSubmitting ? '저장 중…' : '저장 완료' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 하단 푸터 -->
    <footer class="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
      <p class="m-0">© {{ new Date().getFullYear() }} {{ schoolName }} 전문대학 학교장 추천 관리 시스템</p>
    </footer>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { schoolName, fetchSchoolName } from '../utils/schoolConfig'
import { dialog } from '../components/common/dialog'
import {
  getMyJuniorCollegeRecommendations,
  getJuniorCollegeRecommendationsList,
  saveJuniorCollegeRecommendation,
  deleteJuniorCollegeRecommendation,
  fetchEnrolledStudentsForJC
} from '../api/juniorCollegeApi'
import {
  printJuniorCollegeRecommendationLetter,
  printJuniorCollegeRoster
} from '../utils/juniorCollegePrintHelper'
import {
  GraduationCap,
  PenTool,
  FileText,
  Printer,
  Check,
  CheckCircle,
  Edit3,
  Trash2,
  Info,
  Plus,
  RefreshCw,
  Search,
  Home,
  Stamp
} from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(false)
const formSubmitting = ref(false)
const adminSubmitting = ref(false)
const editingRecordId = ref(null)

const termOptions = ['수시 1차', '수시 2차', '정시', '기타']
const classOptions = Array.from({ length: 11 }, (_, i) => i + 1)

// 학생 폼 상태
const form = reactive({
  univ_name: '',
  department_name: '',
  track_name: '',
  admission_term: '수시 1차',
  student_phone: '',
  parent_phone: '',
  parent_name: '',
  recommendation_reason: '위 학생은 품행이 단정하고 학업에 충실하여 타의 모범이 되며, 해당 전공 분야에 대한 뚜렷한 진로 목표와 우수한 잠재력을 지니고 있어 귀 대학의 입학전형에 적합하다고 판단되므로 이에 적극 추천합니다.'
})

// 교사/관리자 모달 및 폼 상태
const showAdminModal = ref(false)
const modalRecordId = ref(null)
const modalSelectedClass = ref('all')
const modalSelectedStudentId = ref('')
const availableStudents = ref([])

const adminForm = reactive({
  student_id: null,
  student_name: '',
  student_code: '',
  grade: 3,
  class_no: null,
  seq_no: null,
  is_enrolled: true,
  grad_year: null,
  univ_name: '',
  department_name: '',
  track_name: '',
  admission_term: '수시 1차',
  student_phone: '',
  parent_phone: '',
  parent_name: '',
  recommendation_reason: '위 학생은 품행이 단정하고 학업에 충실하여 타의 모범이 되며, 해당 전공 분야에 대한 뚜렷한 진로 목표와 우수한 잠재력을 지니고 있어 귀 대학의 입학전형에 적합하다고 판단되므로 이에 적극 추천합니다.'
})

// 필터 상태
const filterClass = ref('all')
const filterTerm = ref('all')
const searchQuery = ref('')

const myRecords = ref([])
const allRecords = ref([])

// 사용자 정보 표시용 계산 속성
const userName = computed(() => {
  if (auth.isAdmin) return '관리자'
  if (auth.isTeacher) return auth.user?.user_metadata?.name || '선생님'
  if (auth.isStudent) return auth.studentName || '학생'
  return '사용자'
})

const roleLabel = computed(() => {
  if (auth.isAdmin) return '시스템 관리자'
  if (auth.isTeacher) return '교사'
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

// 교사/관리자용 필터된 목록
const filteredRecords = computed(() => {
  let list = allRecords.value
  if (searchQuery.value && searchQuery.value.trim()) {
    const s = searchQuery.value.trim().toLowerCase()
    list = list.filter(r => 
      (r.student_name && r.student_name.toLowerCase().includes(s)) ||
      (r.student_code && String(r.student_code).includes(s)) ||
      (r.univ_name && r.univ_name.toLowerCase().includes(s)) ||
      (r.department_name && r.department_name.toLowerCase().includes(s)) ||
      (r.track_name && r.track_name.toLowerCase().includes(s))
    )
  }
  return list
})

function countByTerm(term) {
  return allRecords.value.filter(r => r.admission_term === term).length
}

// ── 데이터 로드 함수 ─────────────────────────────────────
async function loadStudentData() {
  loading.value = true
  try {
    const sCode = auth.studentCode ? String(auth.studentCode).trim() : null
    const sId = auth.user?.id || auth.userId || auth.studentId
    myRecords.value = await getMyJuniorCollegeRecommendations(sCode, sId)

    // 학생 기본 연락처 프리필
    if (!form.student_phone && auth.phone) {
      form.student_phone = auth.phone
    }
  } catch (e) {
    console.warn('Failed to load student junior college records:', e)
  } finally {
    loading.value = false
  }
}

async function loadAdminData() {
  loading.value = true
  try {
    const filters = {
      classNo: filterClass.value,
      term: filterTerm.value
    }
    allRecords.value = await getJuniorCollegeRecommendationsList(filters)
  } catch (e) {
    console.warn('Failed to load admin junior college records:', e)
  } finally {
    loading.value = false
  }
}

// ── 학생 폼 핸들러 ───────────────────────────────────────
function applyDefaultReason() {
  form.recommendation_reason = '위 학생은 품행이 단정하고 학업에 충실하여 타의 모범이 되며, 해당 전공 분야에 대한 뚜렷한 진로 목표와 우수한 잠재력을 지니고 있어 귀 대학의 입학전형에 적합하다고 판단되므로 이에 적극 추천합니다.'
}

function startEdit(rec) {
  editingRecordId.value = rec.id
  form.univ_name = rec.univ_name
  form.department_name = rec.department_name
  form.track_name = rec.track_name
  form.admission_term = rec.admission_term || '수시 1차'
  form.student_phone = rec.student_phone || ''
  form.parent_phone = rec.parent_phone || ''
  form.parent_name = rec.parent_name || ''
  form.recommendation_reason = rec.recommendation_reason || ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editingRecordId.value = null
  resetStudentForm()
}

function resetStudentForm() {
  form.univ_name = ''
  form.department_name = ''
  form.track_name = ''
  form.admission_term = '수시 1차'
  form.recommendation_reason = '위 학생은 품행이 단정하고 학업에 충실하여 타의 모범이 되며, 해당 전공 분야에 대한 뚜렷한 진로 목표와 우수한 잠재력을 지니고 있어 귀 대학의 입학전형에 적합하다고 판단되므로 이에 적극 추천합니다.'
}

async function handleSubmitStudentForm() {
  formSubmitting.value = true
  try {
    const payload = {
      id: editingRecordId.value || undefined,
      student_id: auth.user?.id || auth.userId || auth.studentId,
      student_name: auth.studentName || '학생',
      student_code: String(auth.studentCode || '').trim(),
      grade: auth.grade || 3,
      class_no: auth.classNo || null,
      seq_no: auth.seqNo || null,
      is_enrolled: auth.isEnrolled !== false,
      grad_year: auth.gradYear || null,
      univ_name: form.univ_name,
      department_name: form.department_name,
      track_name: form.track_name,
      admission_term: form.admission_term,
      student_phone: form.student_phone,
      parent_phone: form.parent_phone,
      parent_name: form.parent_name,
      recommendation_reason: form.recommendation_reason
    }

    await saveJuniorCollegeRecommendation(payload)
    await dialog.alert({
      title: '신청 완료',
      message: editingRecordId.value
        ? '전문대학 학교장 추천 신청 내용이 성공적으로 수정되었습니다.'
        : '전문대학 학교장 추천 신청이 등록되었습니다!\n\n목록의 [학교장 추천서 인쇄] 버튼을 눌러 추천서를 출력하신 후 행정실에서 직인을 날인받으세요.',
      level: 'info'
    })

    editingRecordId.value = null
    resetStudentForm()
    await loadStudentData()
  } catch (e) {
    await dialog.alert({ title: '저장 실패', message: e.message || '저장 중 오류가 발생했습니다.' })
  } finally {
    formSubmitting.value = false
  }
}

async function handleDelete(id) {
  const confirmed = await dialog.confirm({
    title: '신청 삭제',
    message: '해당 전문대학 추천 신청 내역을 삭제하시겠습니까?',
    confirmText: '삭제',
    cancelText: '취소'
  })
  if (!confirmed) return

  try {
    await deleteJuniorCollegeRecommendation(id)
    if (auth.isStudent) {
      await loadStudentData()
    } else {
      await loadAdminData()
    }
  } catch (e) {
    await dialog.alert({ title: '삭제 실패', message: e.message || '삭제 중 오류가 발생했습니다.' })
  }
}

// ── 추천서 및 대장 인쇄 ──────────────────────────────────
function handlePrintRecommendation(record) {
  printJuniorCollegeRecommendationLetter(record)
}

function handlePrintAllMyRecommendations() {
  if (myRecords.value.length === 0) return
  const studentInfo = {
    student_name: auth.studentName || '학생',
    student_code: String(auth.studentCode || '').trim(),
    grade: auth.grade || 3,
    class_no: auth.classNo || null,
    seq_no: auth.seqNo || null,
    is_enrolled: auth.isEnrolled !== false,
    grad_year: auth.gradYear || null,
    student_phone: myRecords.value[0]?.student_phone || auth.phone || '',
    parent_phone: myRecords.value[0]?.parent_phone || '',
    parent_name: myRecords.value[0]?.parent_name || ''
  }
  printJuniorCollegeRecommendationLetter(myRecords.value, studentInfo)
}

function handlePrintRoster() {
  const filterLabel = filterClass.value === 'all' ? '전체 학급' : (filterClass.value === 'grad' ? '졸업생' : `${filterClass.value}반`)
  const termLabel = filterTerm.value === 'all' ? '전체 시기' : filterTerm.value

  printJuniorCollegeRoster(filteredRecords.value, {
    filterText: filterLabel,
    termText: termLabel
  })
}

// ── 교사/관리자 대리 등록 모달 ───────────────────────────
async function loadStudentsForModal() {
  availableStudents.value = await fetchEnrolledStudentsForJC(modalSelectedClass.value)
}

function onStudentSelectChanged() {
  const st = availableStudents.value.find(s => (s.id || s.student_code) === modalSelectedStudentId.value)
  if (st) {
    adminForm.student_id = st.id || null
    adminForm.student_name = st.name
    adminForm.student_code = String(st.student_code || '')
    adminForm.grade = st.grade || 3
    adminForm.class_no = st.class_no || null
    adminForm.seq_no = st.seq_no || null
    adminForm.is_enrolled = st.is_enrolled !== false
    adminForm.grad_year = st.grad_year || null
    adminForm.student_phone = st.phone || ''
    adminForm.parent_phone = st.emergency_phone || ''
  }
}

function applyAdminDefaultReason() {
  adminForm.recommendation_reason = '위 학생은 품행이 단정하고 학업에 충실하여 타의 모범이 되며, 해당 전공 분야에 대한 뚜렷한 진로 목표와 우수한 잠재력을 지니고 있어 귀 대학의 입학전형에 적합하다고 판단되므로 이에 적극 추천합니다.'
}

async function openCreateModal() {
  modalRecordId.value = null
  modalSelectedStudentId.value = ''
  adminForm.univ_name = ''
  adminForm.department_name = ''
  adminForm.track_name = ''
  adminForm.admission_term = '수시 1차'
  adminForm.student_phone = ''
  adminForm.parent_phone = ''
  applyAdminDefaultReason()

  await loadStudentsForModal()
  showAdminModal.value = true
}

function openEditModal(rec) {
  modalRecordId.value = rec.id
  adminForm.student_id = rec.student_id
  adminForm.student_name = rec.student_name
  adminForm.student_code = rec.student_code
  adminForm.grade = rec.grade
  adminForm.class_no = rec.class_no
  adminForm.seq_no = rec.seq_no
  adminForm.is_enrolled = rec.is_enrolled
  adminForm.grad_year = rec.grad_year
  adminForm.univ_name = rec.univ_name
  adminForm.department_name = rec.department_name
  adminForm.track_name = rec.track_name
  adminForm.admission_term = rec.admission_term || '수시 1차'
  adminForm.student_phone = rec.student_phone || ''
  adminForm.parent_phone = rec.parent_phone || ''
  adminForm.recommendation_reason = rec.recommendation_reason || ''
  showAdminModal.value = true
}

async function handleSaveAdminModal() {
  adminSubmitting.value = true
  try {
    if (!modalRecordId.value && !modalSelectedStudentId.value) {
      throw new Error('대상 학생을 선택해 주세요.')
    }
    const payload = {
      id: modalRecordId.value || undefined,
      ...adminForm
    }
    await saveJuniorCollegeRecommendation(payload)
    showAdminModal.value = false
    await loadAdminData()
    await dialog.alert({ title: '저장 완료', message: '추천 신청 정보가 성공적으로 저장되었습니다.' })
  } catch (e) {
    await dialog.alert({ title: '저장 실패', message: e.message || '저장 중 오류가 발생했습니다.' })
  } finally {
    adminSubmitting.value = false
  }
}

// ── 공통 네비게이션 ──────────────────────────────────────
function goToPortal() {
  router.push('/select-system')
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

onMounted(async () => {
  fetchSchoolName()
  if (auth.isStudent) {
    await loadStudentData()
  } else {
    // 교사의 경우 본인 담당 반으로 필터 기본값 설정
    if (auth.isTeacher && auth.teacherClass) {
      filterClass.value = String(auth.teacherClass)
    }
    await loadAdminData()
  }
})
</script>
