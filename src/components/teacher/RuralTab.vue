<template>
  <div class="space-y-6">
    <!-- 헤더 영역 -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div>
        <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 class="w-6 h-6 text-emerald-600" />
          농어촌 특별전형 추천자 자격 관리
        </h2>
        <p class="text-sm text-slate-500 mt-1">
          3학년 학생들의 6년 읍·면 재학 및 거주 요건 자동 검증 결과 및 수동 소명 자격 상태를 관리합니다.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="loadData"
          :disabled="loading"
          class="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw :class="{ 'animate-spin': loading }" class="w-4 h-4 text-slate-500" />
          새로고침
        </button>
      </div>
    </div>

    <!-- 데이터 로딩 중 표시 -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-200 shadow-sm">
      <RefreshCw class="w-8 h-8 text-emerald-600 animate-spin mb-3" />
      <p class="text-base font-semibold text-slate-700">학적 및 자격 검증 데이터를 불러오는 중입니다...</p>
      <p class="text-xs text-slate-400 mt-1">잠시만 기다려 주세요.</p>
    </div>

    <!-- 데이터 로딩 완료 후 표시 -->
    <div v-else class="space-y-6">
      <!-- 엑셀 파일 업로드 안내 배너 -->
      <div class="bg-linear-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
            <UploadCloud class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-900 m-0 flex items-center gap-1.5">
              📂 엑셀 파일 업로드 안내
            </h4>
            <p class="text-xs text-slate-600 mt-1 mb-0 leading-relaxed">
              3학년 인적사항(주소) 및 학적사항(학교) 엑셀 파일 업로드는 왼쪽 메뉴의 <strong class="text-indigo-700 font-bold">[⚙️ 환경설정]</strong> 메뉴에서 등록 및 파싱 검증을 진행해 주세요.
            </p>
          </div>
        </div>
      </div>

      <!-- 3학년 재학생 요약 통계 카운터 -->
      <div class="space-y-1.5">
        <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Users class="w-4 h-4 text-blue-600" />
          <span>3학년 재학생 현황</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <button
            type="button"
            @click="selectStatCard('enrolled', 'all')"
            :class="[
              'p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group',
              filterClass === 'enrolled' && filterStatus === 'all'
                ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/40 shadow-sm'
                : 'bg-white border-slate-200 shadow-xs hover:border-blue-300 hover:bg-slate-50/80 hover:shadow-xs'
            ]"
          >
            <div>
              <p class="text-xs font-medium text-slate-500 group-hover:text-blue-600 transition-colors">3학년 전체 대상 학생</p>
              <p class="text-2xl font-bold text-slate-900 mt-1">{{ grade3TotalCount }}명</p>
            </div>
            <div :class="['w-10 h-10 rounded-lg flex items-center justify-center transition-colors', filterClass === 'enrolled' && filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600']">
              <Users class="w-5 h-5" />
            </div>
          </button>

          <button
            type="button"
            @click="selectStatCard('enrolled', 'eligible')"
            :class="[
              'p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group',
              filterClass === 'enrolled' && filterStatus === 'eligible'
                ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/40 shadow-sm'
                : 'bg-white border-slate-200 shadow-xs hover:border-emerald-300 hover:bg-slate-50/80 hover:shadow-xs'
            ]"
          >
            <div>
              <p class="text-xs font-medium text-emerald-600">지원가능 (자동 적격)</p>
              <p class="text-2xl font-bold text-emerald-600 mt-1">{{ grade3EligibleCount }}명</p>
            </div>
            <div :class="['w-10 h-10 rounded-lg flex items-center justify-center transition-colors', filterClass === 'enrolled' && filterStatus === 'eligible' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100']">
              <CheckCircle2 class="w-5 h-5" />
            </div>
          </button>

          <button
            type="button"
            @click="selectStatCard('enrolled', 'ineligible')"
            :class="[
              'p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group',
              filterClass === 'enrolled' && filterStatus === 'ineligible'
                ? 'bg-rose-50/90 border-rose-500 ring-2 ring-rose-500/40 shadow-sm'
                : 'bg-white border-slate-200 shadow-xs hover:border-rose-300 hover:bg-slate-50/80 hover:shadow-xs'
            ]"
          >
            <div>
              <p class="text-xs font-medium text-rose-600">지원불가 (요건 미달)</p>
              <p class="text-2xl font-bold text-rose-600 mt-1">{{ grade3IneligibleCount }}명</p>
            </div>
            <div :class="['w-10 h-10 rounded-lg flex items-center justify-center transition-colors', filterClass === 'enrolled' && filterStatus === 'ineligible' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-100']">
              <XCircle class="w-5 h-5" />
            </div>
          </button>

          <button
            type="button"
            @click="selectStatCard('enrolled', 'manual')"
            :class="[
              'p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group',
              filterClass === 'enrolled' && filterStatus === 'manual'
                ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/40 shadow-sm'
                : 'bg-white border-slate-200 shadow-xs hover:border-amber-300 hover:bg-slate-50/80 hover:shadow-xs'
            ]"
          >
            <div>
              <p class="text-xs font-medium text-amber-600">수동 변경/소명 인정</p>
              <p class="text-2xl font-bold text-amber-600 mt-1">{{ grade3ManualApprovedCount }}명</p>
            </div>
            <div :class="['w-10 h-10 rounded-lg flex items-center justify-center transition-colors', filterClass === 'enrolled' && filterStatus === 'manual' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100']">
              <UserCheck class="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>

    <!-- 졸업생 요약 통계 카운터 (버튼화 필터) -->
    <div class="space-y-1.5">
      <div class="flex items-center gap-1.5 text-xs font-bold text-amber-900">
        <UserCheck class="w-4 h-4 text-amber-600" />
        <span>졸업생 현황</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <button
          type="button"
          @click="selectStatCard('graduated', 'all')"
          :class="[
            'p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group',
            filterClass === 'graduated' && filterStatus === 'all'
              ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-500/40 shadow-sm'
              : 'border-amber-200/70 bg-amber-50/20 shadow-xs hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-xs'
          ]"
        >
          <div>
            <p class="text-xs font-medium text-slate-500 group-hover:text-amber-700 transition-colors">졸업생 전체 대상 학생</p>
            <p class="text-2xl font-bold text-slate-900 mt-1">{{ gradTotalCount }}명</p>
          </div>
          <div :class="['w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-colors', filterClass === 'graduated' && filterStatus === 'all' ? 'bg-amber-600 text-white' : 'bg-amber-100/70 text-amber-700 group-hover:bg-amber-200/80']">
            🎓
          </div>
        </button>

        <button
          type="button"
          @click="selectStatCard('graduated', 'eligible')"
          :class="[
            'p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group',
            filterClass === 'graduated' && filterStatus === 'eligible'
              ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/40 shadow-sm'
              : 'bg-white border-slate-200 shadow-xs hover:border-emerald-300 hover:bg-slate-50/80 hover:shadow-xs'
          ]"
        >
          <div>
            <p class="text-xs font-medium text-emerald-600">지원가능 (자동 적격)</p>
            <p class="text-2xl font-bold text-emerald-600 mt-1">{{ gradEligibleCount }}명</p>
          </div>
          <div :class="['w-10 h-10 rounded-lg flex items-center justify-center transition-colors', filterClass === 'graduated' && filterStatus === 'eligible' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100']">
            <CheckCircle2 class="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          @click="selectStatCard('graduated', 'ineligible')"
          :class="[
            'p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group',
            filterClass === 'graduated' && filterStatus === 'ineligible'
              ? 'bg-rose-50/90 border-rose-500 ring-2 ring-rose-500/40 shadow-sm'
              : 'bg-white border-slate-200 shadow-xs hover:border-rose-300 hover:bg-slate-50/80 hover:shadow-xs'
          ]"
        >
          <div>
            <p class="text-xs font-medium text-rose-600">지원불가 (요건 미달)</p>
            <p class="text-2xl font-bold text-rose-600 mt-1">{{ gradIneligibleCount }}명</p>
          </div>
          <div :class="['w-10 h-10 rounded-lg flex items-center justify-center transition-colors', filterClass === 'graduated' && filterStatus === 'ineligible' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-100']">
            <XCircle class="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          @click="selectStatCard('graduated', 'manual')"
          :class="[
            'p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group',
            filterClass === 'graduated' && filterStatus === 'manual'
              ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/40 shadow-sm'
              : 'bg-white border-slate-200 shadow-xs hover:border-amber-300 hover:bg-slate-50/80 hover:shadow-xs'
          ]"
        >
          <div>
            <p class="text-xs font-medium text-amber-600">수동 변경/소명 인정</p>
            <p class="text-2xl font-bold text-amber-600 mt-1">{{ gradManualApprovedCount }}명</p>
          </div>
          <div :class="['w-10 h-10 rounded-lg flex items-center justify-center transition-colors', filterClass === 'graduated' && filterStatus === 'manual' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100']">
            <UserCheck class="w-5 h-5" />
          </div>
        </button>
      </div>
    </div>

    <!-- 데이터 테이블 및 검색/필터 바 -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div class="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <!-- 반 선택 필터 -->
          <select
            v-model="filterClass"
            class="px-3 py-1.5 pr-7 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
          >
            <option value="all">전체 학급 (1~11반 + 졸업생)</option>
            <option value="enrolled">3학년 재학생 전체 (1~11반)</option>
            <option v-for="c in 11" :key="c" :value="c">{{ c }}반</option>
            <option value="graduated">🎓 졸업생</option>
          </select>

          <!-- 자격 상태 필터 -->
          <select
            v-model="filterStatus"
            class="px-3 py-1.5 pr-7 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-44"
          >
            <option value="all">전체 상태 보기</option>
            <option value="eligible">지원가능 (적격)</option>
            <option value="ineligible">지원불가 (미달)</option>
            <option value="manual">수동 인정/변경자</option>
          </select>

          <!-- 필터 리셋 버튼 -->
          <button
            v-if="filterClass !== 'all' || filterStatus !== 'all' || searchQuery"
            @click="resetFilters"
            class="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
            title="필터 전체 초기화"
          >
            <span>🔄 전체보기</span>
          </button>
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span class="text-xs font-bold text-slate-500 shrink-0">
            조회: <strong class="text-blue-600 font-extrabold">{{ filteredList.length }}</strong>명
          </span>

          <!-- 학생 이름/학번 검색 -->
          <div class="relative w-full sm:w-64">
            <Search class="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="학생 이름 또는 학번 검색..."
              class="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- 테이블 목록 -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th class="py-3 px-3">구분</th>
              <th class="py-3 px-3">학번</th>
              <th class="py-3 px-3">이름</th>
              <th class="py-3 px-3 text-center">인적사항 (주소)</th>
              <th class="py-3 px-3 text-center">학적사항 (중/고교)</th>
              <th class="py-3 px-3 text-center">유형 I (6년)</th>
              <th class="py-3 px-3 text-center">유형 II (12년)</th>
              <th class="py-3 px-3 text-center">최종 자격 상태</th>
              <th class="py-3 px-3 text-center">소명/수정</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="filteredList.length === 0">
              <td colspan="9" class="py-8 text-center text-slate-400">
                조회된 농어촌 전형 대상 학생 데이터가 없습니다. (엑셀 파일 업로드 필요)
              </td>
            </tr>
            <tr
              v-for="item in filteredList"
              :key="item.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                <span v-if="item.is_separate_applicant || item.is_graduated || item.is_enrolled === false" class="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                  졸업생
                </span>
                <span v-else class="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                  재학생
                </span>
              </td>
              <td class="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{{ item.student_code || '-' }}</td>
              <td class="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">{{ item.name }}</td>
              
              <!-- 1) 인적사항 (주소 6년 읍면) 자격 -->
              <td class="py-3 px-3 text-center relative group">
                <span
                  v-if="item.addressInfo"
                  :title="`[인적사항] ${item.addressInfo.raw_address_text || ''}`"
                  :class="[
                    'px-2 py-0.5 rounded text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-all hover:scale-105 shadow-xs',
                    item.addressInfo.has_rural_address ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  ]"
                >
                  {{ item.addressInfo.has_rural_address ? '적격 (읍·면)' : '미달 (동지역)' }}
                </span>
                <span
                  v-else-if="isGrad(item)"
                  :title="`[인적사항] ${item.eligibility?.address_rural_valid ? '적격 (본인확인)' : '미달 (동지역)'}`"
                  :class="[
                    'px-2 py-0.5 rounded text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-all hover:scale-105 shadow-xs',
                    item.eligibility?.address_rural_valid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  ]"
                >
                  {{ item.eligibility?.address_rural_valid ? '적격 (본인확인)' : '미달 (동지역)' }}
                </span>
                <span v-else class="text-slate-400 cursor-pointer" title="인적사항(주소) 미등록">미등록</span>

                <!-- 인적사항 (주소) 호버 툴팁 카드 -->
                <div
                  class="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 hidden group-hover:block w-72 p-3 bg-slate-900 text-white rounded-lg shadow-2xl text-xs z-50 text-left pointer-events-none transition-all border border-slate-700"
                >
                  <div class="font-bold text-slate-200 mb-1.5 flex items-center gap-1.5 border-b border-slate-700 pb-1">
                    <span>🏠</span>
                    <span>인적사항 (주소 요건)</span>
                    <span
                      :class="[
                        'ml-auto text-[10px] px-1.5 py-0.5 rounded font-semibold',
                        (item.addressInfo?.has_rural_address || item.eligibility?.address_rural_valid) ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'
                      ]"
                    >
                      {{ (item.addressInfo?.has_rural_address || item.eligibility?.address_rural_valid) ? '읍·면 적격' : '동지역 미달' }}
                    </span>
                  </div>

                  <div v-if="item.addressInfo" class="space-y-1 text-slate-300">
                    <p class="font-mono text-[11px] text-slate-100 bg-slate-800 p-2 rounded border border-slate-700 break-keep leading-relaxed">
                      {{ item.addressInfo.raw_address_text || '등록된 주소 정보 없음' }}
                    </p>
                    <p v-if="item.addressInfo.notes" class="text-[10px] text-amber-400">
                      💡 {{ item.addressInfo.notes }}
                    </p>
                  </div>
                  <div v-else-if="isGrad(item)" class="text-slate-300 text-[11px]">
                    <p class="text-slate-300 font-semibold">🎓 졸업생 자가 확인 정보</p>
                    <p class="text-slate-400 text-[10px] mt-0.5">졸업생 지원자에 의해 직접 입력된 주소 자격입니다.</p>
                  </div>
                  <div v-else class="text-slate-400 text-[11px] bg-slate-800 p-2 rounded border border-slate-700">
                    ⚠️ 업로드된 주소 정보가 없습니다. (인적사항 엑셀 파일 업로드 필요)
                  </div>

                  <div class="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-slate-900"></div>
                </div>
              </td>
              
              <!-- 2) 학적사항 (학교 6년 중/고교) 자격 -->
              <td class="py-3 px-3 text-center relative group">
                <span
                  v-if="item.eligibility?.academic_rural_valid"
                  :title="`[학적사항] 적격 - ${item.academicRecords?.map(r => r.school_name).join(', ') || ''}`"
                  class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 cursor-pointer transition-all hover:scale-105 shadow-xs"
                >
                  {{ isGrad(item) ? '적격 (본인확인)' : '적격 (중·고교)' }}
                </span>
                <span
                  v-else-if="item.academicRecords && item.academicRecords.length > 0"
                  :title="`[학적사항] 미달 - ${item.academicRecords?.map(r => r.school_name).join(', ') || ''}`"
                  class="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1 cursor-pointer transition-all hover:scale-105 shadow-xs"
                >
                  미달
                </span>
                <span
                  v-else-if="isGrad(item)"
                  :title="`[학적사항] 미달 (본인확인)`"
                  class="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1 cursor-pointer transition-all hover:scale-105 shadow-xs"
                >
                  미달
                </span>
                <span v-else class="text-slate-400 cursor-pointer" title="학적사항(학교) 미등록">미등록</span>

                <!-- 학적사항 (학교) 호버 툴팁 카드 -->
                <div
                  class="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 hidden group-hover:block w-80 p-3 bg-slate-900 text-white rounded-lg shadow-2xl text-xs z-50 text-left pointer-events-none transition-all border border-slate-700"
                >
                  <div class="font-bold text-slate-200 mb-1.5 flex items-center gap-1.5 border-b border-slate-700 pb-1">
                    <span>🎓</span>
                    <span>학적 이력 및 출신 학교</span>
                    <span
                      :class="[
                        'ml-auto text-[10px] px-1.5 py-0.5 rounded font-semibold',
                        item.eligibility?.academic_rural_valid ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'
                      ]"
                    >
                      {{ item.eligibility?.academic_rural_valid ? '중·고교 적격' : '학적 미달' }}
                    </span>
                  </div>

                  <div v-if="item.academicRecords && item.academicRecords.length > 0" class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    <div
                      v-for="(rec, idx) in item.academicRecords"
                      :key="idx"
                      class="bg-slate-800 p-2 rounded border border-slate-700/80 text-[11px]"
                    >
                      <div class="flex items-center justify-between text-slate-200 font-semibold mb-1">
                        <span>🏫 {{ rec.school_name || '학교명 없음' }}</span>
                        <span
                          v-if="rec.rural_school_cache"
                          :class="[
                            'text-[10px] font-bold px-1.5 py-0.2 rounded',
                            rec.rural_school_cache.is_rural ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60'
                          ]"
                        >
                          {{ rec.rural_school_cache.is_rural ? '읍/면 소재' : '동지역 소재' }}
                        </span>
                      </div>
                      <p v-if="rec.rural_school_cache?.road_address || rec.rural_school_cache?.address" class="text-[10px] text-slate-400 break-keep">
                        📍 {{ rec.rural_school_cache.road_address || rec.rural_school_cache.address }}
                      </p>
                      <p v-if="rec.raw_record_text" class="text-[10px] text-slate-300 mt-1 border-t border-slate-700/50 pt-1">
                        📄 {{ rec.raw_record_text }}
                      </p>
                    </div>
                  </div>
                  <div v-else-if="isGrad(item)" class="text-slate-300 text-[11px]">
                    <p class="text-slate-300 font-semibold">🎓 졸업생 자가 확인 정보</p>
                    <p class="text-slate-400 text-[10px] mt-0.5">졸업생 지원자에 의해 직접 입력된 학적 자격입니다.</p>
                  </div>
                  <div v-else class="text-slate-400 text-[11px] bg-slate-800 p-2 rounded border border-slate-700">
                    ⚠️ 업로드된 학적 기록이 없습니다. (학적사항 엑셀 파일 업로드 필요)
                  </div>

                  <div class="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-slate-900"></div>
                </div>
              </td>

              <!-- 3) 유형 I (6년) 자격 (주소 & 학적 모두 충족) -->
              <td class="py-3 px-3 text-center relative group">
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-all hover:scale-105 shadow-xs',
                    item.eligibility?.is_type1_eligible ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  ]"
                >
                  {{ item.eligibility?.is_type1_eligible ? '적격 (6년)' : '미달' }}
                </span>

                <!-- 유형 I 호버 툴팁 -->
                <div
                  v-if="item.eligibility"
                  class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-2.5 bg-slate-900 text-white rounded-lg shadow-xl text-xs z-50 text-left pointer-events-none"
                >
                  <p class="font-bold text-slate-200 mb-1">📋 유형 I (6년) 요건</p>
                  <p class="text-[11px] text-slate-300">
                    인적사항(주소 6년): <strong :class="item.addressInfo?.has_rural_address || item.eligibility?.address_rural_valid ? 'text-emerald-400' : 'text-rose-400'">{{ (item.addressInfo?.has_rural_address || item.eligibility?.address_rural_valid) ? '적격' : '미달' }}</strong>
                  </p>
                  <p class="text-[11px] text-slate-300">
                    학적사항(중·고 6년): <strong :class="item.eligibility?.academic_rural_valid ? 'text-emerald-400' : 'text-rose-400'">{{ item.eligibility?.academic_rural_valid ? '적격' : '미달' }}</strong>
                  </p>
                  <div class="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900"></div>
                </div>
              </td>

              <!-- 4) 유형 II (12년) 자격 (교사 수동 판단) -->
              <td class="py-3 px-3 text-center">
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[11px] font-semibold',
                    item.eligibility?.is_type2_eligible ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-400'
                  ]"
                >
                  {{ item.eligibility?.is_type2_eligible ? (isGrad(item) ? '적격 (12년)' : '적격 (교사지정)') : '미확인 (수동)' }}
                </span>
              </td>

              <!-- 5) 최종 자격 상태 -->
              <td class="py-3 px-3 text-center relative group">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 shadow-sm cursor-pointer transition-all hover:scale-105',
                    item.eligibility?.is_type1_eligible
                      ? 'bg-emerald-500 text-white'
                      : (item.eligibility?.is_type2_eligible
                          ? 'bg-amber-500 text-white'
                          : (item.eligibility?.is_manual_approved ? 'bg-blue-600 text-white' : 'bg-rose-500 text-white'))
                  ]"
                >
                  <CheckCircle2 v-if="item.eligibility?.is_eligible || item.eligibility?.is_manual_approved" class="w-3.5 h-3.5" />
                  <XCircle v-else class="w-3.5 h-3.5" />
                  {{
                    item.eligibility?.is_type1_eligible
                      ? '유형I 지원가능'
                      : (item.eligibility?.is_type2_eligible
                          ? '유형II 지원가능'
                          : (item.eligibility?.is_manual_approved ? '수동승인 지원가능' : '지원불가'))
                  }}
                </span>
              </td>

              <!-- 소명/수동 수정 버튼 -->
              <td class="py-3 px-3 text-center">
                <button
                  @click="openManualModal(item)"
                  class="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors cursor-pointer"
                >
                  수정/소명
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 수동 인정/소명 관리 모달 -->
    <div v-if="showModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
        <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
          <UserCheck class="w-5 h-5 text-blue-600" />
          농어촌 전형 자격 상태 수동 수정 & 소명 (관리자 권한)
        </h3>

        <div v-if="selectedStudent" class="space-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p><strong class="text-slate-700">학생:</strong> {{ selectedStudent.name }} <span v-if="isGrad(selectedStudent)" class="text-amber-700 font-bold">(🎓 졸업생)</span><span v-else>(3학년 {{ selectedStudent.class_no }}반 {{ selectedStudent.seq_no }}번)</span></p>
          <p><strong class="text-slate-700">주소:</strong> {{ selectedStudent.addressInfo?.raw_address_text || (isGrad(selectedStudent) ? '졸업생 자가 등록 주소' : '미등록') }}</p>
          <p class="leading-relaxed"><strong class="text-slate-700">검증 리포트:</strong> {{ selectedStudent.eligibility?.evaluation_notes || '기록 없음' }}</p>
        </div>

        <!-- 1) 최종 자격 지정 -->
        <div class="space-y-2 border-t border-slate-100 pt-3">
          <label class="block text-xs font-bold text-slate-800">1. 관리자 최종 자격 판단 지정</label>
          <div class="space-y-1.5 text-xs">
            <label
              class="flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors"
              :class="modalForm.statusChoice === 'TYPE1' ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' : 'bg-white border-slate-200 text-slate-700'"
            >
              <input type="radio" value="TYPE1" v-model="modalForm.statusChoice" class="text-emerald-600" />
              <span>유형 I (6년 중·고 읍면 거주/재학) 지원가능 수동 인정</span>
            </label>
            <label
              class="flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors"
              :class="modalForm.statusChoice === 'TYPE2' ? 'bg-amber-50 border-amber-300 font-bold text-amber-900' : 'bg-white border-slate-200 text-slate-700'"
            >
              <input type="radio" value="TYPE2" v-model="modalForm.statusChoice" class="text-amber-600" />
              <span>유형 II (12년 전 교육과정 읍면 거주/재학) 지원가능 수동 지정</span>
            </label>
            <label
              class="flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors"
              :class="modalForm.statusChoice === 'INELIGIBLE' ? 'bg-rose-50 border-rose-300 font-bold text-rose-900' : 'bg-white border-slate-200 text-slate-700'"
            >
              <input type="radio" value="INELIGIBLE" v-model="modalForm.statusChoice" class="text-rose-600" />
              <span>지원불가 (요건 미달 / 부적격 처리)</span>
            </label>
            <label
              class="flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors"
              :class="modalForm.statusChoice === 'AUTO' ? 'bg-slate-50 border-slate-300 font-bold text-slate-900' : 'bg-white border-slate-200 text-slate-600'"
            >
              <input type="radio" value="AUTO" v-model="modalForm.statusChoice" class="text-slate-600" />
              <span>자동 검증 / 본인 확인 결과 기본값 유지</span>
            </label>
          </div>
        </div>

        <!-- 2) 사유 입력 -->
        <div class="space-y-1 border-t border-slate-100 pt-3">
          <label class="block text-xs font-bold text-slate-700">수정 사유 및 소명 내용</label>
          <textarea
            v-model="modalForm.reason"
            rows="3"
            placeholder="행정구역 변경, 졸업생 서류 확인, 이사 소명 등 수정 사유를 상세히 입력하세요."
            class="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            @click="showModal = false"
            class="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
          >
            취소
          </button>
          <button
            @click="saveManualApproval"
            :disabled="savingModal"
            class="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  Building2,
  UploadCloud,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  UserCheck,
  Search
} from 'lucide-vue-next';

import { getRuralEligibilityList, updateRuralManualApproval } from '../../api/ruralApi';

const loading = ref(false);
const studentList = ref([]);
const filterClass = ref('all');
const filterStatus = ref('all');
const searchQuery = ref('');

const showModal = ref(false);
const selectedStudent = ref(null);
const savingModal = ref(false);
const modalForm = ref({
  statusChoice: 'AUTO',
  reason: ''
});

onMounted(() => {
  loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const list = await getRuralEligibilityList();
    studentList.value = list;
  } catch (e) {
    console.error('Failed to load rural eligibility list:', e);
  } finally {
    loading.value = false;
  }
}

// 3학년 재학생 통계
const isGrad = (s) => s.is_separate_applicant || s.is_graduated || s.is_enrolled === false;

const grade3List = computed(() => studentList.value.filter(s => !isGrad(s)));
const grade3TotalCount = computed(() => grade3List.value.length);
const grade3EligibleCount = computed(() => grade3List.value.filter(s => s.eligibility?.is_eligible || s.eligibility?.is_type1_eligible || s.eligibility?.is_type2_eligible || s.eligibility?.is_manual_approved).length);
const grade3IneligibleCount = computed(() => grade3List.value.filter(s => !s.eligibility?.is_eligible && !s.eligibility?.is_type1_eligible && !s.eligibility?.is_type2_eligible && !s.eligibility?.is_manual_approved).length);
const grade3ManualApprovedCount = computed(() => grade3List.value.filter(s => s.eligibility?.is_manual_approved || s.eligibility?.is_type2_eligible).length);

// 졸업생 통계 (농어촌 전형 지원을 체크한 졸업생만 잡히도록 필터링)
const gradList = computed(() => studentList.value.filter(s => isGrad(s) && s.apply_rural !== false));
const gradTotalCount = computed(() => gradList.value.length);
const gradEligibleCount = computed(() => gradList.value.filter(s => s.eligibility?.is_eligible || s.eligibility?.is_type1_eligible || s.eligibility?.is_type2_eligible || s.eligibility?.is_manual_approved).length);
const gradIneligibleCount = computed(() => gradList.value.filter(s => !s.eligibility?.is_eligible && !s.eligibility?.is_type1_eligible && !s.eligibility?.is_type2_eligible && !s.eligibility?.is_manual_approved).length);
const gradManualApprovedCount = computed(() => gradList.value.filter(s => s.eligibility?.is_manual_approved || s.eligibility?.is_type2_eligible).length);

function selectStatCard(scope, status) {
  if (filterClass.value === scope && filterStatus.value === status) {
    filterClass.value = 'all';
    filterStatus.value = 'all';
  } else {
    filterClass.value = scope;
    filterStatus.value = status;
  }
}

function resetFilters() {
  filterClass.value = 'all';
  filterStatus.value = 'all';
  searchQuery.value = '';
}

const filteredList = computed(() => {
  const result = studentList.value.filter(item => {
    // 반 필터
    if (filterClass.value === 'graduated') {
      if (!isGrad(item) || item.apply_rural === false) return false;
    } else if (filterClass.value === 'enrolled') {
      if (isGrad(item)) return false;
    } else if (filterClass.value !== 'all') {
      if (isGrad(item)) return false;
      if (item.class_no !== Number(filterClass.value)) return false;
    } else {
      // 'all' 전체 보기일 때도 농어촌 미지원 졸업생은 통계 기준과 동일하게 제외
      if (isGrad(item) && item.apply_rural === false) return false;
    }
    // 상태 필터
    const isEligible = item.eligibility?.is_eligible || item.eligibility?.is_type1_eligible || item.eligibility?.is_type2_eligible || item.eligibility?.is_manual_approved;
    if (filterStatus.value === 'eligible' && !isEligible) {
      return false;
    }
    if (filterStatus.value === 'ineligible' && isEligible) {
      return false;
    }
    if (filterStatus.value === 'manual' && !item.eligibility?.is_manual_approved && !item.eligibility?.is_type2_eligible) {
      return false;
    }
    // 검색어
    if (searchQuery.value) {
      const q = searchQuery.value.trim().toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCode = (item.student_code || '').toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  // 재학생 우선, 학번 오름차순 정렬
  return result.sort((a, b) => {
    const gradA = isGrad(a) ? 1 : 0;
    const gradB = isGrad(b) ? 1 : 0;
    if (gradA !== gradB) {
      return gradA - gradB;
    }

    const codeA = String(a.student_code || (a.class_no ? `3${String(a.class_no).padStart(2, '0')}${String(a.seq_no || a.student_no || 0).padStart(2, '0')}` : '99999'));
    const codeB = String(b.student_code || (b.class_no ? `3${String(b.class_no).padStart(2, '0')}${String(b.seq_no || b.student_no || 0).padStart(2, '0')}` : '99999'));

    return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
  });
});

function openManualModal(item) {
  selectedStudent.value = item;
  let choice = 'AUTO';
  if (item.eligibility?.is_type2_eligible) {
    choice = 'TYPE2';
  } else if (item.eligibility?.is_type1_eligible || item.eligibility?.is_manual_approved) {
    choice = 'TYPE1';
  } else if (item.eligibility?.is_eligible === false && item.eligibility?.is_manual_approved) {
    choice = 'INELIGIBLE';
  }

  modalForm.value = {
    statusChoice: choice,
    reason: item.eligibility?.manual_reason || ''
  };
  showModal.value = true;
}

async function saveManualApproval() {
  if (!selectedStudent.value) return;
  savingModal.value = true;

  try {
    const choice = modalForm.value.statusChoice;
    const isManualApproved = choice === 'TYPE1';
    const isType2Eligible = choice === 'TYPE2';
    const overrideIneligible = choice === 'INELIGIBLE';

    await updateRuralManualApproval(
      selectedStudent.value.id,
      isManualApproved,
      isType2Eligible,
      modalForm.value.reason,
      overrideIneligible
    );
    showModal.value = false;
    await loadData();
  } catch (e) {
    console.error('Failed to update manual approval:', e);
    alert('소명 및 수동 인정 저장에 실패했습니다.');
  } finally {
    savingModal.value = false;
  }
}
</script>
