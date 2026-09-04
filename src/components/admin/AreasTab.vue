<template>
  <div class="pt-8 pb-32 px-4 sm:px-10">

    <!-- 페이지 헤더 -->
    <div class="mb-5">
      <p class="text-base mb-1" style="color: #94a3b8;">관리자</p>
      <h1 class="text-2xl font-semibold" style="color: #1e293b; margin: 0;">추천순위 기준 설정</h1>
    </div>

    <HelpBox class="mb-5" storage-key="areas-main" :title="HELP_MAIN.title" :intro="HELP_MAIN.intro">
      <!-- 가로형 진행 단계 플로우 차트 (박스 및 화살표) -->
      <div class="mt-3">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          <!-- STEP 1 -->
          <div class="bg-white rounded-xl p-3.5 border border-blue-100 shadow-xs flex flex-col justify-between relative">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="px-2 py-0.5 rounded text-[11px] font-extrabold bg-blue-100 text-blue-700">STEP 1</span>
                <span class="text-[11px] text-slate-400 font-bold">항목 생성</span>
              </div>
              <h3 class="text-sm font-bold text-slate-800 m-0 mb-1.5 flex items-center gap-1.5">
                <span>➕</span> 전형요소 추가
              </h3>
              <p class="text-xs text-slate-600 m-0 leading-relaxed">
                좌측 <strong>"+ 전형요소 추가"</strong> 클릭 후 추천 템플릿(교과 내신, 출결, 봉사 등)을 골라 배점을 정합니다.
              </p>
            </div>
            <!-- 우측 화살표 (md 이상) -->
            <div class="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-blue-500 text-white items-center justify-center text-[11px] shadow-sm">
              ➔
            </div>
          </div>

          <!-- STEP 2 -->
          <div class="bg-white rounded-xl p-3.5 border border-indigo-100 shadow-xs flex flex-col justify-between relative">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="px-2 py-0.5 rounded text-[11px] font-extrabold bg-indigo-100 text-indigo-700">STEP 2</span>
                <span class="text-[11px] text-indigo-500 font-bold">내신 산출 방식</span>
              </div>
              <h3 class="text-sm font-bold text-slate-800 m-0 mb-1.5 flex items-center gap-1.5">
                <span>📊</span> 방식 선택 & 업로드
              </h3>
              <div class="space-y-1 text-xs">
                <div class="p-1.5 rounded bg-indigo-50/80 border border-indigo-100">
                  <strong class="text-indigo-900 block font-bold text-[11px]">A. 대교협/유니브 연명부 (추천)</strong>
                  <span class="text-[10.5px] text-slate-600 block mt-0.5 leading-tight">조회기준 [대학별 환산점수] → 엑셀 1회 일괄 반영</span>
                </div>
                <div class="p-1.5 rounded bg-slate-50 border border-slate-200/70">
                  <strong class="text-slate-800 block font-bold text-[11px]">B. 전교 공통 등급표</strong>
                  <span class="text-[10.5px] text-slate-500 block mt-0.5 leading-tight">조회기준 [기본 조회] → 점수표 + 학생등급 각각 등록</span>
                </div>
              </div>
            </div>
            <!-- 우측 화살표 (md 이상) -->
            <div class="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-indigo-500 text-white items-center justify-center text-[11px] shadow-sm">
              ➔
            </div>
          </div>

          <!-- STEP 3 -->
          <div class="bg-white rounded-xl p-3.5 border border-purple-100 shadow-xs flex flex-col justify-between relative">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="px-2 py-0.5 rounded text-[11px] font-extrabold bg-purple-100 text-purple-700">STEP 3</span>
                <span class="text-[11px] text-purple-500 font-bold">기준/데이터 입력</span>
              </div>
              <h3 class="text-sm font-bold text-slate-800 m-0 mb-1.5 flex items-center gap-1.5">
                <span>📝</span> 기준 등록 & 시뮬레이션
              </h3>
              <p class="text-xs text-slate-600 m-0 leading-relaxed mb-2">
                요소를 클릭하여 우측 탭에서 <strong>[점수 기준]</strong> 및 <strong>[기초 데이터]</strong>를 등록합니다.
              </p>
              <div class="bg-purple-50/80 p-1.5 rounded border border-purple-100 text-[11px] text-purple-800 leading-tight">
                💡 <strong>점수 계산 테스트</strong>로 실제 산출될 점수를 미리 확인 가능합니다.
              </div>
            </div>
            <!-- 우측 화살표 (md 이상) -->
            <div class="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-purple-500 text-white items-center justify-center text-[11px] shadow-sm">
              ➔
            </div>
          </div>

          <!-- STEP 4 -->
          <div class="bg-white rounded-xl p-3.5 border border-emerald-100 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="px-2 py-0.5 rounded text-[11px] font-extrabold bg-emerald-100 text-emerald-700">STEP 4</span>
                <span class="text-[11px] text-emerald-600 font-bold">최종 확인</span>
              </div>
              <h3 class="text-sm font-bold text-slate-800 m-0 mb-1.5 flex items-center gap-1.5">
                <span>✅</span> 총점 일치 확인
              </h3>
              <p class="text-xs text-slate-600 m-0 leading-relaxed">
                좌측 목록 하단의 <strong>배점 총점</strong>이 우리 학교 추천 규정의 총점과 정확히 일치하는지 확인합니다.
              </p>
            </div>
            <div class="mt-2 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200/60 text-center">
              준비 완료 후 추천 선발 진행 가능
            </div>
          </div>
        </div>

        <!-- 주의 알림 배너 -->
        <div class="mt-3 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
          <span class="text-base shrink-0">⚠️</span>
          <span><strong>주의:</strong> 첫 번째 추천 선발(1차)이 시작되거나 종료된 이후에는 전형요소 추가·수정·삭제가 엄격히 차단됩니다. 반드시 1차 라운드 오픈 전에 설정을 완료하세요.</span>
        </div>
      </div>
    </HelpBox>

    <HelpBox
      v-if="hasLockedRound"
      class="mb-5"
      storage-key="areas-locked"
      variant="warning"
      :title="HELP_LOCKED.title"
      :intro="HELP_LOCKED.intro"
      :items="HELP_LOCKED.items"
    />

    <div class="flex flex-col lg:flex-row lg:items-start gap-6">

      <!-- ── 좌측: 전형요소 목록 ────────────────────────────────── -->
      <div class="flex flex-col w-full lg:w-75">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold" style="color: #1e293b;">전형요소 목록</h2>
          <button
            class="text-base font-medium rounded-lg"
            style="padding: 7px 14px; border: none; background: #2563eb; color: white; cursor: pointer;"
            @click="openAddForm">+ 전형요소 추가</button>
        </div>

        <p v-if="error" class="text-base mb-4" style="color: #ef4444;">{{ error }}</p>

        <!-- 전형요소 카드 목록 -->
        <div class="flex flex-col gap-2">
          <div
            v-for="area in areas" :key="area.id"
            class="rounded-xl transition-all"
            :style="{
              background: 'white',
              border: editingAreaId === area.id ? '1px solid #fbbf24' : (selected?.id === area.id ? '1px solid #93c5fd' : '1px solid #e2e8f0'),
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            }"
          >
            <!-- 보기 모드 -->
            <template v-if="editingAreaId !== area.id">
              <div class="cursor-pointer" style="padding: 14px 16px;" @click="selectArea(area)">
                <p class="text-lg font-semibold" style="color: #1e293b; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ area.name }}</p>
                <p class="text-base" style="margin: 4px 0 0; color: #64748b;">
                  {{ calcTypeLabel(area.calc_type) }} · {{ lookupScopeLabel(area.lookup_scope) }}
                </p>
                <div class="flex gap-3">
                  <button class="text-base font-medium"
                          style="color: #2563eb; background: none; border: none; cursor: pointer; padding: 0;"
                          @click.stop="startEditArea(area)">편집</button>
                  <button class="text-base font-medium"
                          style="color: #ef4444; background: none; border: none; cursor: pointer; padding: 0;"
                          @click.stop="removeArea(area.id)">삭제</button>
                </div>
              </div>
            </template>
            <!-- 편집 모드 -->
            <template v-else>
              <div style="padding: 14px 16px; background: #fefce8; border-radius: 10px; border: 1px solid #fde047;">
                <div class="space-y-3">
                  <div>
                    <label class="block text-base font-medium mb-1.5" style="color: #64748b;">전형요소 이름</label>
                    <input v-model="editArea.name" type="text"
                      class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                      style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px; box-sizing: border-box;" />
                  </div>

                  <!-- 테스트 수정 모드 허용 시 세부 옵션 편집 가능 -->
                  <template v-if="allowAreaEdit">
                    <div>
                      <label class="block text-base font-medium mb-1.5" style="color: #64748b;">만점 배점 (점)</label>
                      <input v-model="editArea.max_score_display" type="number" step="any" min="0"
                        class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                        style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px; box-sizing: border-box;" />
                    </div>

                    <div>
                      <label class="block text-base font-medium mb-1.5" style="color: #64748b;">점수 산출 방식</label>
                      <select v-model="editArea.calc_type"
                        class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                        style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px; background: white;">
                        <option value="NUMERIC">수치형 입력 (기준표 기반 점수 산출)</option>
                        <option value="CATEGORY">선택형 입력 (활동/자격 환산 점수)</option>
                        <option value="MANUAL">점수 직접 입력 (교사/관리자 직접 수동 입력)</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-base font-medium mb-1.5" style="color: #64748b;">데이터 조회 기준</label>
                      <select v-model="editArea.lookup_scope"
                        class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                        style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px; background: white;">
                        <option value="SIMPLE">기본 조회 (전교 공통 단일 점수표)</option>
                        <option value="COMPOSITE">대학별 환산점수 조회 (대학/학과별 점수표)</option>
                      </select>
                    </div>

                    <div v-if="editArea.calc_type === 'NUMERIC'">
                      <label class="block text-base font-medium mb-1.5" style="color: #64748b;">구간 탐색 방향</label>
                      <select v-model="editArea.match_mode"
                        class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                        style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px; background: white;">
                        <option value="UPPER">▲ 이상 (기준값보다 크거나 같을 때 해당)</option>
                        <option value="LOWER">▼ 이하 (기준값보다 작거나 같을 때 해당)</option>
                        <option value="EXACT">〓 정확히 일치</option>
                      </select>
                    </div>

                    <div v-if="editArea.calc_type === 'CATEGORY'">
                      <label class="block text-base font-medium mb-1.5" style="color: #64748b;">복수 활동 처리 방식</label>
                      <select v-model="editArea.category_agg"
                        class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                        style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px; background: white;">
                        <option value="SUM">중복 선택 가능 (점수 합산)</option>
                        <option value="MAX">최대 1개만 인정 (최고점 반영)</option>
                      </select>
                    </div>
                  </template>

                  <!-- MANUAL은 단위가 항상 '점'(프로그램 강제)이므로 NUMERIC만 단위 입력 -->
                  <div v-if="editArea.calc_type === 'NUMERIC'">
                    <label class="block text-base font-medium mb-1.5" style="color: #64748b;">기준값 단위 <span style="color: #94a3b8;">(선택)</span></label>
                    <input v-model="editArea.unit" type="text" placeholder="예: 시간, 등급 (선택)"
                      class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                      style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px; box-sizing: border-box;" />
                  </div>
                  <div class="flex items-center gap-2 pt-1">
                    <input v-model="editArea.teacher_editable" type="checkbox"
                      :id="`edit-te-${area.id}`" class="accent-blue-600 w-4 h-4 rounded" />
                    <label :for="`edit-te-${area.id}`" class="text-base font-medium" style="color: #475569;">담임교사 입력 허용</label>
                  </div>
                  <p v-if="editError" class="text-base font-medium" style="color: #ef4444;">{{ editError }}</p>
                </div>
                <div class="flex gap-2 mt-4">
                  <button
                    class="text-base font-semibold rounded-lg"
                    style="padding: 8px 18px; border: none; background: #2563eb; color: white; cursor: pointer;"
                    @click="saveEdit">저장</button>
                  <button
                    class="text-base rounded-lg"
                    style="padding: 8px 18px; border: 1px solid #e2e8f0; background: white; color: #64748b; cursor: pointer;"
                    @click="cancelEdit">취소</button>
                </div>
              </div>
            </template>
          </div>
          <div v-if="areas.length === 0" class="text-base text-center" style="padding: 32px 0; color: #94a3b8;">
            등록된 전형요소 없음
          </div>
        </div>

        <!-- 총점 -->
        <div v-if="areas.length > 0"
          class="flex items-center justify-end gap-2 mt-3 text-base font-semibold"
          style="border-top: 1px solid #e2e8f0; color: #1e293b;">
          <span>총점</span>
          <span>{{ displayScore(totalMaxScore) }}점</span>
        </div>
      </div>

      <!-- ── 우측 패널: 추가 폼 or 전형요소 상세 ────────────────── -->
      <div class="flex-1 min-w-0">

        <!-- 전형요소 추가 폼 (템플릿 선택 카드 리스트) -->
        <div v-if="showAddForm" class="rounded-xl @container overflow-y-auto"
             style="padding: 20px 20px 40px 20px; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04); max-height: calc(100vh - 180px);">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-base font-semibold" style="color: #1e293b; margin: 0;">새 전형요소 추가</h3>
            <button class="text-base" style="color: #94a3b8; background: none; border: none; cursor: pointer;" @click="showAddForm = false">✕ 닫기</button>
          </div>

          <!-- ── 1. 기본 템플릿 ───────────────────────── -->
          <p class="text-base font-semibold mb-1" style="color: #1e293b;">템플릿을 선택하세요</p>
          <p class="text-base mb-4" style="color: #64748b;">
            아래 템플릿 버튼을 클릭하면 세부 설정 모달 팝업창이 열립니다.
          </p>

          <div class="grid grid-cols-1 @2xl:grid-cols-3 gap-3 mb-6">
            <div
              v-for="tpl in AREA_TEMPLATES" :key="tpl.id"
              class="template-btn rounded-xl text-left flex flex-col hover:border-blue-400 transition-all hover:shadow-md"
              style="padding: 16px; background: white; border: 1px solid #e2e8f0; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.06);"
              @click="applyTemplate(tpl)">
              <div class="flex items-center justify-between mb-1">
                <p class="text-base font-semibold" style="color: #1e293b; margin: 0;">{{ tpl.name }}</p>
                <span class="text-base font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">선택 →</span>
              </div>
              <p class="break-keep word-break-keep-all text-base" style="color: #64748b; margin: 0 0 8px; line-height: 1.5;">{{ tpl.description }}</p>
              <p class="break-keep word-break-keep-all text-base" style="color: #94a3b8; margin: 0 0 12px;">{{ tpl.hint }}</p>
              <button
                class="text-base mt-auto"
                style="padding: 0; border: none; background: none; color: #2563eb; cursor: pointer; text-align: left; text-decoration: underline; text-underline-offset: 2px;"
                :disabled="dlTemplateId === tpl.id"
                @click.stop="dlScoreTemplate(tpl)">
                {{ dlTemplateId === tpl.id ? '다운로드 중…' : '점수 기준 샘플 ↓' }}
              </button>
            </div>

            <!-- 커스텀 카드 -->
            <div
              class="template-btn rounded-xl flex flex-col justify-center items-center text-center p-4 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 cursor-pointer transition-all"
              @click="openCustomForm">
              <span class="text-xl mb-1">➕</span>
              <p class="text-base font-semibold text-slate-800 mb-1">직접 입력 (커스텀)</p>
              <p class="text-base text-slate-500">템플릿 없이 항목을 직접 설정합니다.</p>
            </div>
          </div>

          <!-- ── 유형 안내 (참고용) ──────────────────── -->
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />

          <p class="text-base font-semibold mb-3" style="color: #1e293b;">전형요소 유형 안내</p>

          <!-- 점수 산출 방식 -->
          <p class="text-base font-medium mb-2" style="color: #64748b;">점수 산출 방식</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div v-for="d in CALC_TYPE_DESCS" :key="d.key"
                 class="rounded-lg text-base"
                 style="padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0;">
              <p class="font-semibold" style="color: #1e293b; margin: 0 0 4px;">{{ d.label }}</p>
              <p style="color: #64748b; margin: 0; line-height: 1.5;">{{ d.desc }}</p>
            </div>
          </div>

          <!-- 데이터 조회 기준 -->
          <p class="text-base font-medium mb-2" style="color: #64748b;">데이터 조회 기준</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div v-for="d in LOOKUP_SCOPE_DESCS" :key="d.key"
                 class="rounded-lg text-base"
                 style="padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0;">
              <p class="font-semibold" style="color: #1e293b; margin: 0 0 4px;">{{ d.label }}</p>
              <p style="color: #64748b; margin: 0; line-height: 1.5;">{{ d.desc }}</p>
            </div>
          </div>
        </div>

        <!-- ── 전형요소 상세 ──────────────────────────────────── -->
        <div v-else-if="selected" class="overflow-y-auto pr-1" style="max-height: calc(100vh - 200px); padding-bottom: 80px;">

          <!-- 선택된 전형요소 헤더 -->
          <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-wrap">
              <h3 class="text-lg font-semibold" style="color: #1e293b; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ selected.name }}</h3>
              <span class="text-base font-medium shrink-0"
                style="padding: 3px 12px; background: #f1f5f9; color: #475569; border-radius: 999px;">{{ calcTypeLabel(selected.calc_type) }}</span>
              <span class="text-base font-medium shrink-0"
                style="padding: 3px 12px; background: #f1f5f9; color: #475569; border-radius: 999px;">{{ lookupScopeLabel(selected.lookup_scope) }}</span>
            </div>
          </div>

          <!-- 기본 정보 카드 -->
          <div class="rounded-xl mb-5"
            style="padding: 18px 20px; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);">
            <div class="flex flex-wrap gap-x-8 gap-y-2">
              <span class="text-base"><span class="font-medium mr-2" style="color: #94a3b8;">만점</span><span style="color: #1e293b;">{{ displayScore(selected.max_score) }}점</span></span>
              <span class="text-base"><span class="font-medium mr-2" style="color: #94a3b8;">조회 기준</span><span style="color: #1e293b;">{{ lookupScopeLabel(selected.lookup_scope) }}</span></span>
              <span class="text-base"><span class="font-medium mr-2" style="color: #94a3b8;">계산 유형</span><span style="color: #1e293b;">{{ calcTypeLabel(selected.calc_type) }}</span></span>
              <span v-if="selected.calc_type === 'NUMERIC'" class="text-base"><span class="font-medium mr-2" style="color: #94a3b8;">탐색 방향</span><span style="color: #1e293b;">{{ matchModeLabel(selected.match_mode) }}</span></span>
              <span v-if="selected.calc_type === 'CATEGORY'" class="text-base"><span class="font-medium mr-2" style="color: #94a3b8;">범주 집계</span><span style="color: #1e293b;">{{ categoryAggLabel(selected.category_agg) }}</span></span>
              <span class="text-base"><span class="font-medium mr-2" style="color: #94a3b8;">담임교사 입력</span><span style="color: #1e293b;">{{ selected.teacher_editable ? '허용' : '불가' }}</span></span>
            </div>
            <p class="text-base" style="color: #94a3b8; margin: 0; padding-top: 12px; border-top: 1px solid #f1f5f9;">
              전형요소 등록 후에는 이름과 담임교사 입력 허용 여부만 변경할 수 있습니다.
            </p>
          </div>

          <!-- 서브탭 -->
          <div class="flex mb-5" style="border-bottom: 1px solid #e2e8f0;">
            <button v-if="selected.calc_type !== 'MANUAL'"
              class="text-base font-medium transition-colors"
              style="padding: 10px 20px; border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px;"
              :style="{
                borderBottomColor: activeTab === 'score' ? '#2563eb' : 'transparent',
                color: activeTab === 'score' ? '#2563eb' : '#64748b',
                fontWeight: activeTab === 'score' ? '600' : '400',
              }"
              @click="activeTab = 'score'">점수 기준</button>
            <button v-if="selected.lookup_scope !== 'COMPOSITE' && selected.name !== '교과 내신'"
              class="text-base font-medium transition-colors"
              style="padding: 10px 20px; border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px;"
              :style="{
                borderBottomColor: activeTab === 'base' ? '#2563eb' : 'transparent',
                color: activeTab === 'base' ? '#2563eb' : '#64748b',
                fontWeight: activeTab === 'base' ? '600' : '400',
              }"
              @click="activeTab = 'base'">기초 데이터</button>
          </div>

          <!-- ── 점수 기준 탭 ──────────────────────────────── -->
          <div v-if="activeTab === 'score'">
            <!-- 교과 내신 전용 자동 반영 안내 카드 -->
            <div v-if="selected.name === '교과 내신'" class="p-6 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 shadow-sm space-y-3 mb-6">
              <div class="flex items-center gap-2.5">
                <span class="text-2xl">🎓</span>
                <h3 class="text-lg font-bold text-blue-950">교과 내신성적 자동 산출 안내</h3>
              </div>
              <p class="text-base leading-relaxed text-blue-900">
                전교생 교과 내신 성적(석차등급 및 대학별 환산점수)은 <strong>[학생 관리]</strong> 탭에서 올려주신 <strong>'유니브/대교협 석차연명부'</strong> 데이터가 100% 자동 연동됩니다.
              </p>
              <div class="p-3.5 rounded-xl bg-white/80 border border-blue-200 text-base space-y-1 text-slate-700">
                <p>✔️ <strong>추가 설정 불필요</strong>: 점수 기준표 엑셀을 따로 만들어 올리실 필요가 없습니다.</p>
                <p>✔️ <strong>자동 순위 산출</strong>: 유니브/대교협 엑셀의 석차등급(낮은 순) 및 대학별 내신 환산점수(높은 순) 그대로 추천 순위가 자동 계산됩니다.</p>
              </div>
            </div>

            <!-- 다른 전형 요소 점수 기준 설정 -->
            <template v-else>
              <HelpBox class="mb-4" storage-key="areas-score" :title="HELP_SCORE.title" :intro="HELP_SCORE.intro" :items="HELP_SCORE.items" />
              <!-- 양식 예시 -->
              <div class="rounded-xl mb-4"
                style="padding: 16px 18px; background: #eff6ff; border: 1px solid #bfdbfe;">
                <p class="text-base font-semibold mb-3" style="color: #1d4ed8;">양식 예시 — {{ scoreEx.desc }}</p>
                <div class="overflow-x-auto">
                  <table style="border-collapse: collapse;">
                    <thead>
                      <tr>
                        <th v-for="hd in scoreEx.headers" :key="hd"
                          class="text-base font-semibold text-left whitespace-nowrap"
                          style="padding: 8px 14px; background: #bfdbfe; border: 1px solid #93c5fd; color: #1d4ed8;">{{ hd }}</th>
                        <th style="background: transparent; padding: 8px 14px;"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, i) in scoreEx.rows" :key="i">
                        <td v-for="(cell, j) in row" :key="j"
                          class="text-base whitespace-nowrap"
                          style="padding: 7px 14px; border: 1px solid #bfdbfe; color: #1e293b;">{{ cell }}</td>
                        <td class="text-base whitespace-nowrap" style="padding: 7px 14px 7px 20px; color: #94a3b8;">{{ scoreEx.rowDescs[i] }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <p class="text-base mb-2" :class="selected.lookup_scope === 'COMPOSITE' ? 'mb-1' : 'mb-4'" style="color: #64748b;">
                기준값·점수는 실제 값으로 작성 (예: 1.25, 30.5 / 소수점 최대 5자리)
              </p>
              <p v-if="selected.lookup_scope === 'COMPOSITE'" class="text-base mb-4" style="color: #2563eb;">
                대학명·모집단위명을 비워두면 모든 대학에 공통 적용됩니다.
              </p>

              <ExcelPanel
                :area-id="selected.id"
                :calc-type="selected.calc_type"
                :area-name="selected.name"
                panel="score"
                @result="onScoreResult" />
              <ImportResultBox v-if="scoreResult" :result="scoreResult" class="mt-3" />
            </template>

            <!-- 점수 계산 테스트 카드 -->
            <ScoreDemoCard
              v-if="scorePage.rows.length > 0"
              class="mt-5"
              :area="selected"
              :rows="scorePage.rows"
              @highlight="onDemoHighlight" />

            <!-- 점수 기준 목록 -->
            <div v-if="selected.name !== '교과 내신'" class="mt-5 rounded-xl overflow-hidden"
              style="background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04); max-height: 400px; overflow-x: auto; overflow-y: auto;">
              <p v-if="scorePage.rows.length === 0" class="text-base text-center" style="padding: 32px; color: #94a3b8;">
                등록된 점수 기준 없음
              </p>
              <table v-else class="w-full" style="border-collapse: collapse; table-layout: fixed;" :style="selected.lookup_scope === 'COMPOSITE' ? 'min-width: 660px' : 'min-width: 300px'">
                <colgroup>
                  <template v-if="selected.lookup_scope === 'COMPOSITE'">
                    <col style="width: 140px;">
                    <col style="width: 100px;">
                    <col style="width: 160px;">
                    <col>
                  </template>
                  <template v-else>
                    <col>
                    <col>
                  </template>
                </colgroup>
                <thead style="position: sticky; top: 0; z-index: 1;">
                  <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th class="text-base font-semibold text-left" style="padding: 13px 18px; color: #475569;">
                      <template v-if="selected.calc_type === 'NUMERIC'">기준값<span v-if="selected.unit"> ({{ selected.unit }})</span></template>
                      <template v-else>범주</template>
                    </th>
                    <th class="text-base font-semibold text-left" style="padding: 13px 18px; color: #475569;">점수 (점)</th>
                    <template v-if="selected.lookup_scope === 'COMPOSITE'">
                      <th class="text-base font-semibold text-left" style="padding: 13px 18px; color: #475569;">대학명</th>
                      <th class="text-base font-semibold text-left" style="padding: 13px 18px; color: #475569;">모집단위명</th>
                    </template>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in scorePage.rows" :key="i"
                    :style="{
                      background: isDemoHighlighted(row) ? '#fefce8' : (i % 2 === 1 ? '#f8fafc' : 'white'),
                      borderBottom: '1px solid #f1f5f9',
                      fontWeight: isDemoHighlighted(row) ? '600' : '400',
                    }">
                    <td class="text-base" style="padding: 11px 18px; color: #1e293b;">
                      {{ selected.calc_type === 'NUMERIC' ? row.threshold : row.category }}
                    </td>
                    <td class="text-base" style="padding: 11px 18px; color: #1e293b;">{{ row.score }}</td>
                    <template v-if="selected.lookup_scope === 'COMPOSITE'">
                      <td class="text-base" style="padding: 11px 18px; color: #1e293b;">{{ row.univ_name }}</td>
                      <td class="text-base" style="padding: 11px 18px; color: #1e293b;">{{ row.track_name }}</td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="scorePage.total > 0" class="mt-4 flex items-center justify-center gap-4">
              <button
                class="text-base rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                style="padding: 8px 18px; border: 1px solid #e2e8f0; background: white; color: #475569; cursor: pointer;"
                :disabled="scorePage.page <= 1"
                @click="loadScoreRows(scorePage.page - 1)">&lt; 이전</button>
              <span class="text-base" style="color: #64748b;">
                {{ scorePage.page }} / {{ Math.ceil(scorePage.total / scorePage.per_page) }} 페이지
                (총 {{ scorePage.total }}행)
              </span>
              <button
                class="text-base rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                style="padding: 8px 18px; border: 1px solid #e2e8f0; background: white; color: #475569; cursor: pointer;"
                :disabled="scorePage.page >= Math.ceil(scorePage.total / scorePage.per_page)"
                @click="loadScoreRows(scorePage.page + 1)">다음 &gt;</button>
            </div>
          </div>

          <!-- ── 기초 데이터 탭 ──────────────────────────────── -->
          <div v-if="activeTab === 'base'">
            <div class="mb-4 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3" style="background: #f0f9ff; border: 1px solid #bae6fd; color: #0369a1;">
              <div class="flex items-center gap-2">
                <span class="text-xl">🎓</span>
                <span class="text-base font-semibold">전교생 내신성적 및 유니브/대교협 석차연명부 업로드는 왼쪽 메뉴의 <strong>[내신성적 관리]</strong> 탭에서 더욱 쉽게 등록하실 수 있습니다!</span>
              </div>
            </div>
            <HelpBox class="mb-4" storage-key="areas-base" :title="HELP_BASE.title" :intro="HELP_BASE.intro" :items="HELP_BASE.items" />
            <!-- 양식 예시 -->
            <div class="rounded-xl mb-4"
              style="padding: 16px 18px; background: #eff6ff; border: 1px solid #bfdbfe;">
              <p class="text-base font-semibold mb-3" style="color: #1d4ed8;">양식 예시 — {{ baseEx.desc }}</p>
              <div class="overflow-x-auto">
                <table style="border-collapse: collapse;">
                  <thead>
                    <tr>
                      <th v-for="hd in baseEx.headers" :key="hd"
                        class="text-base font-semibold text-left whitespace-nowrap"
                        style="padding: 8px 14px; background: #bfdbfe; border: 1px solid #93c5fd; color: #1d4ed8;">{{ hd }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, i) in baseEx.rows" :key="i">
                      <td v-for="(cell, j) in row" :key="j"
                        class="text-base whitespace-nowrap"
                        style="padding: 7px 14px; border: 1px solid #bfdbfe; color: #1e293b;">{{ cell }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p class="text-base mb-4" style="color: #64748b;">
              <template v-if="baseStudentType === 'enrolled'">학년·반·번호로 재학생을 찾아 값을 등록합니다.</template>
              <template v-else>학생코드로 졸업생을 찾아 값을 등록합니다.</template>
              소수점 최대 5자리까지 지원합니다.
            </p>

            <ExcelPanel
              :area-id="selected.id"
              :calc-type="selected.calc_type"
              :area-name="selected.name"
              panel="base"
              v-model:studentType="baseStudentType"
              @result="onBaseResult" />

            <div v-if="selected.lookup_scope === 'COMPOSITE'"
                 v-show="baseStudentType === 'enrolled'"
                 class="mt-3 flex flex-wrap gap-2">
              <label class="text-base font-semibold rounded-lg cursor-pointer flex items-center gap-1.5"
                style="padding: 9px 16px; border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8;">
                🏛️ 대교협 석차연명부 가져오기 (기본)
                <input type="file" accept=".xlsx,.xls" class="hidden" @change="onExternalFile('daegyo', $event)" />
              </label>
              <label class="text-base font-semibold rounded-lg cursor-pointer flex items-center gap-1.5"
                style="padding: 9px 16px; border: 1px solid #e2e8f0; background: white; color: #475569;">
                🎓 유니브 석차연명부 가져오기 (B~Q열 규격)
                <input type="file" accept=".xlsx,.xls" class="hidden" @change="onExternalFile('univ', $event)" />
              </label>
            </div>

            <!-- 잘못된 파일을 올렸을 때 되돌리는 방법.
                 석차연명부 가져오기는 파일에 있는 대학·모집단위를 자동 생성하므로 파일을
                 잘못 고르면 엉뚱한 모집단위가 남는다. 올바른 파일을 다시 올려도 그 모집단위는
                 지워지지 않아(다른 track_id로 들어간다) 여기서 정리 경로를 알려 준다. -->
            <div v-if="selected.lookup_scope === 'COMPOSITE'"
                 v-show="baseStudentType === 'enrolled'"
                 class="mt-3 rounded-lg text-base"
                 style="padding: 10px 14px; background: #fffbeb; border: 1px solid #fcd34d; color: #92400e;">
              석차연명부를 가져오면 파일에 들어 있는 <strong>대학·모집단위가 자동으로 생성</strong>됩니다.
              파일을 잘못 골랐다면 올바른 파일을 다시 올리는 것만으로는 지워지지 않으므로,
              <strong>대학 설정</strong> 탭에서 잘못 생긴 모집단위(또는 대학)를 삭제하십시오.
              삭제하면 <strong>거기에 딸린 기초 데이터도 함께 지워집니다.</strong>
              다만 그 모집단위에 <strong>지원 기록이 하나라도 있으면 삭제할 수 없으니
              라운드를 열기 전에 정리</strong>하십시오.
            </div>

            <ImportResultBox v-if="baseResult" :result="baseResult" class="mt-3" />

            <!-- 기초 데이터 목록 -->
            <div class="mt-5 rounded-xl overflow-hidden"
              style="background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04); max-height: 400px; overflow-x: auto; overflow-y: auto;">
              <p v-if="basePage.rows.length === 0" class="text-base text-center" style="padding: 32px; color: #94a3b8;">
                등록된 기초 데이터 없음
              </p>
              <table v-else class="w-full" style="border-collapse: collapse; table-layout: fixed;" :style="selected.lookup_scope === 'COMPOSITE' ? 'min-width: 680px' : 'min-width: 360px'">
                <colgroup>
                  <col style="width: 160px;">
                  <col style="width: 100px;">
                  <template v-if="selected.lookup_scope === 'COMPOSITE'">
                    <col style="width: 100px;">
                    <col style="width: 160px;">
                    <col>
                  </template>
                  <col v-else>
                </colgroup>
                <thead style="position: sticky; top: 0; z-index: 1;">
                  <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th class="text-base font-semibold text-left" style="padding: 13px 18px; color: #475569;">학생코드</th>
                    <th class="text-base font-semibold text-left" style="padding: 13px 18px; color: #475569;">이름</th>
                    <th class="text-base font-semibold text-left" style="padding: 13px 18px; color: #475569;">값</th>
                    <template v-if="selected.lookup_scope === 'COMPOSITE'">
                      <th class="text-base font-semibold text-left" style="padding: 13px 18px; color: #475569;">대학명</th>
                      <th class="text-base font-semibold text-left" style="padding: 13px 18px; color: #475569;">모집단위명</th>
                    </template>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in basePage.rows" :key="i"
                    :style="{ background: i % 2 === 1 ? '#f8fafc' : 'white', borderBottom: '1px solid #f1f5f9' }">
                    <td class="text-base font-mono" style="padding: 11px 18px; color: #475569;">{{ row.student_code }}</td>
                    <td class="text-base" style="padding: 11px 18px; color: #1e293b;">{{ row.name }}</td>
                    <td class="text-base" style="padding: 11px 18px; color: #1e293b;">{{ row.value }}</td>
                    <template v-if="selected.lookup_scope === 'COMPOSITE'">
                      <td class="text-base" style="padding: 11px 18px; color: #1e293b;">{{ row.univ_name }}</td>
                      <td class="text-base" style="padding: 11px 18px; color: #1e293b;">{{ row.track_name }}</td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="basePage.total > 0" class="mt-4 flex items-center justify-center gap-4">
              <button
                class="text-base rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                style="padding: 8px 18px; border: 1px solid #e2e8f0; background: white; color: #475569; cursor: pointer;"
                :disabled="basePage.page <= 1"
                @click="loadBaseRows(basePage.page - 1)">&lt; 이전</button>
              <span class="text-base" style="color: #64748b;">
                {{ basePage.page }} / {{ Math.ceil(basePage.total / basePage.per_page) }} 페이지
                (총 {{ basePage.total }}행)
              </span>
              <button
                class="text-base rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                style="padding: 8px 18px; border: 1px solid #e2e8f0; background: white; color: #475569; cursor: pointer;"
                :disabled="basePage.page >= Math.ceil(basePage.total / basePage.per_page)"
                @click="loadBaseRows(basePage.page + 1)">다음 &gt;</button>
            </div>
          </div>
        </div>

        <!-- 비어있는 상태 -->
        <div v-else class="flex items-center justify-center" style="height: 240px;">
          <p class="text-base text-center" style="color: #94a3b8;">
            왼쪽에서 전형요소를 선택하면<br class="hidden md:block" />학교장추천전형의 영역별 반영비율과 만점을 관리할 수 있습니다.
          </p>
        </div>

      </div>
      <!-- ── 우측 패널 끝 ─────────────────────────────────────── -->

    </div>
  </div>

  <!-- ── 외부 가져오기 모달 ────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="extModal.open"
         class="fixed inset-0 z-50 flex items-center justify-center"
         style="background: rgba(0,0,0,0.35);">
      <div class="bg-white flex flex-col"
        style="border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); width: 85vw; height: 85vh; max-height: 90vh; overflow-y: auto; padding: 1.75rem;">
        <h3 class="text-lg font-semibold mb-1" style="color: #1e293b;">{{ extModal.title }}</h3>
        <p class="text-base" :class="extModal.headerInfo ? 'mb-2' : 'mb-5'" style="color: #475569;">{{ extModal.fileName }}</p>
        <p v-if="extModal.headerInfo" class="text-base mb-5"
          style="color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; word-break: break-all;">
          {{ extModal.headerInfo }}
        </p>

        <div v-if="extModal.format !== 'univ'" class="space-y-4 mb-5">
          <div>
            <label class="block text-base font-medium mb-1.5" style="color: #64748b;">대학명 <span style="color: #ef4444;">*</span></label>
            <input v-model="extModal.univName" type="text"
              class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"
              placeholder="예: 서울대학교" />
          </div>
          <div>
            <label class="block text-base font-medium mb-1.5" style="color: #64748b;">모집단위명 <span style="color: #ef4444;">*</span></label>
            <div class="flex gap-2 mb-1.5">
              <button v-for="p in TRACK_PRESETS" :key="p" type="button"
                class="text-base rounded-lg"
                style="padding: 6px 14px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; cursor: pointer;"
                @click="extModal.trackName = p">{{ p }}</button>
            </div>
            <input v-model="extModal.trackName" type="text"
              class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"
              placeholder="예: 자연계열" />
          </div>
        </div>

        <div class="mb-5">
          <p class="text-base mb-2" style="color: #64748b;">
            미리보기 (상위 {{ extModal.preview.length }}행 / 총 {{ extModal.total }}행)
          </p>
          <div class="rounded-xl overflow-hidden" style="border: 1px solid #e2e8f0;">
            <div class="overflow-x-auto">
              <table class="w-full" style="border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th v-for="hd in (extModal.format === 'univ' ? ['학년','반','번호','이름','석차','석차등급'] : ['학번','이름', extModal.valueHeader])" :key="hd"
                      class="text-base font-semibold text-left whitespace-nowrap"
                      style="padding: 11px 16px; color: #475569;">{{ hd }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in extModal.preview" :key="i"
                    :style="{ background: i % 2 === 1 ? '#f8fafc' : 'white', borderBottom: '1px solid #f1f5f9' }">
                    <td v-for="(cell, j) in row" :key="j"
                      class="text-base whitespace-nowrap"
                      style="padding: 10px 16px; color: #1e293b;">{{ cell }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <p v-if="extModal.error" class="text-base mb-4" style="color: #ef4444;">{{ extModal.error }}</p>

        <div class="flex justify-end gap-2">
          <button
            class="text-base rounded-lg"
            style="padding: 10px 20px; border: 1px solid #e2e8f0; background: white; color: #64748b; cursor: pointer;"
            @click="closeExtModal">취소</button>
          <button
            class="text-base font-semibold rounded-lg disabled:opacity-50"
            style="padding: 10px 20px; border: none; background: #2563eb; color: white; cursor: pointer;"
            :disabled="extModal.importing || (extModal.format !== 'univ' && (!extModal.univName.trim() || !extModal.trackName.trim()))"
            @click="doExtImport">
            {{ extModal.importing ? '가져오는 중…' : '가져오기' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── 템플릿 세부 설정 모달 팝업 ────────────────────────── -->
  <Teleport to="body">
    <div v-if="modalAddModalOpen"
         class="fixed inset-0 z-50 flex items-center justify-center p-4"
         style="background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px);"
         @click.self="modalAddModalOpen = false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]" style="box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">

        <!-- 모달 헤더 -->
        <div class="px-6 py-4 flex items-center justify-between shrink-0" style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <div>
            <h3 class="text-lg font-bold" style="color: #0f172a; margin: 0;">{{ selectedTemplateName ? selectedTemplateName + ' 세부 설정' : '새 전형요소 추가' }}</h3>
            <p class="text-xs mt-0.5" style="color: #64748b; margin: 0;">전형요소 이름 및 점수 산출 세부 옵션을 설정하세요.</p>
          </div>
          <button @click="modalAddModalOpen = false" class="text-xl font-bold rounded-lg transition-colors" style="padding: 2px 10px; color: #94a3b8; background: none; border: none; cursor: pointer;">
            ✕
          </button>
        </div>

        <!-- 모달 본문 (스크롤) -->
        <div class="p-6 overflow-y-auto space-y-4 text-base" style="color: #334155;">
          <div>
            <label class="block font-medium mb-1.5" style="color: #475569;">전형요소 이름 <span style="color: #ef4444;">*</span></label>
            <input v-model="newArea.name" type="text"
                   class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                   style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 9px 12px; box-sizing: border-box;" />
          </div>

          <div>
            <label class="block font-medium mb-1.5" style="color: #475569;">만점(반영 비율) <span style="color: #ef4444;">*</span></label>
            <input v-model="newArea.max_score_display" type="number" step="0.00001"
                   class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                   style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 9px 12px; box-sizing: border-box;" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-medium mb-1.5" style="color: #475569;">점수 산출 방식 <span style="color: #ef4444;">*</span></label>
              <select v-model="newArea.calc_type"
                      class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 9px 12px; background: white;">
                <option value="NUMERIC">수치형 입력</option>
                <option value="CATEGORY">선택형 입력</option>
                <option value="MANUAL">점수 직접 입력</option>
              </select>
            </div>

            <div>
              <label class="block font-medium mb-1.5" style="color: #475569;">데이터 조회 기준 <span style="color: #ef4444;">*</span></label>
              <select v-model="newArea.lookup_scope"
                      class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 9px 12px; background: white;">
                <option value="SIMPLE">기본 조회</option>
                <option value="COMPOSITE">대학별 환산점수 조회</option>
              </select>
            </div>
          </div>

          <div v-if="newArea.calc_type === 'NUMERIC'">
            <label class="block font-medium mb-1.5" style="color: #475569;">구간 탐색 방향 <span style="color: #ef4444;">*</span></label>
            <select v-model="newArea.match_mode"
                    class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 9px 12px; background: white;">
              <option value="">선택하세요</option>
              <option value="UPPER">▲ 기준값 이상(클수록 만점)</option>
              <option value="LOWER">▼ 기준값 이하(작을수록 만점)</option>
              <option value="EXACT">〓 정확히 일치</option>
            </select>
          </div>

          <div v-if="newArea.calc_type === 'CATEGORY'">
            <label class="block font-medium mb-1.5" style="color: #475569;">복수 활동 처리 방식 <span style="color: #ef4444;">*</span></label>
            <select v-model="newArea.category_agg"
                    class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 9px 12px; background: white;">
              <option value="">선택하세요</option>
              <option value="SUM">중복 선택 가능 (점수 합산)</option>
              <option value="MAX">최대 1개만 인정 (최고점 반영)</option>
            </select>
          </div>

          <div v-if="newArea.calc_type === 'NUMERIC'">
            <label class="block font-medium mb-1.5" style="color: #475569;">기준값 단위 <span style="color: #94a3b8; font-size: 13px; font-weight: normal;">(선택)</span></label>
            <input v-model="newArea.unit" type="text" placeholder="예: 시간, 등급 (선택)"
                   class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                   style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 9px 12px; box-sizing: border-box;" />
          </div>

          <div class="flex items-center gap-2 pt-1">
            <input v-model="newArea.teacher_editable" type="checkbox" id="te_modal" class="accent-blue-600 w-4 h-4 rounded" />
            <label for="te_modal" class="cursor-pointer font-medium" style="color: #334155;">담임교사 입력 허용</label>
          </div>

          <div v-if="addError" class="rounded-lg text-base font-medium flex items-center gap-2" style="padding: 12px 14px; background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626;">
            <span>🚨</span> <span>{{ addError }}</span>
          </div>

          <div class="rounded-lg text-base" style="padding: 10px 14px; background: #fffbeb; border: 1px solid #fcd34d; color: #92400e;">
            ⚠ 전형요소 등록 후에는 이름과 담임교사 입력 허용 여부만 변경할 수 있습니다.
          </div>
        </div>

        <!-- 모달 푸터 -->
        <div class="px-6 py-4 flex items-center justify-end gap-2 shrink-0" style="background: #f8fafc; border-top: 1px solid #e2e8f0;">
          <button @click="modalAddModalOpen = false" class="text-base rounded-lg font-medium" style="padding: 8px 18px; border: 1px solid #cbd5e1; background: white; color: #475569; cursor: pointer;">
            취소
          </button>
          <button @click="addArea" class="text-base rounded-lg font-semibold disabled:opacity-50" style="padding: 8px 20px; border: none; background: #2563eb; color: white; cursor: pointer;" :disabled="savingArea">
            {{ savingArea ? '저장 중…' : '전형요소 저장' }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, defineComponent, h, computed } from 'vue'
import { supabase } from '../../utils/supabaseClient.js'
import {
  getAreas, createArea, updateArea, deleteArea, getRounds,
  downloadAreaScoreTemplate,
  downloadNumericTableTemplate, exportNumericTable, importNumericTable,
  downloadCategoryMapTemplate, exportCategoryMap, importCategoryMap,
  downloadBaseDataTemplate, exportBaseData, importBaseData,
  getNumericTableList, getCategoryMapList, getBaseDataList,
  previewDaegyoImport, importDaegyo, previewUnivImport, importUniv,
  blobErrMsg,
} from '../../api/admin.js'
import { getScoreExample, getBaseExample } from '../../data/areaSamples.js'
import HelpBox from '../common/HelpBox.vue'
import { dialog } from '../common/dialog.js'
import ScoreDemoCard from './ScoreDemoCard.vue'
import { isKeyMatched, formatScore } from '../../utils/scorePreviewShared.js'

// ── 도움말 문구 ────────────────────────────────────────────────
const HELP_MAIN = {
  title: '도움말 — 추천순위 기준 설정 (진행 가이드)',
  intro: '전형요소(교과 내신, 출결, 봉사 등)의 배점과 산출 방식을 아래 4단계 흐름에 따라 순서대로 설정할 수 있습니다.',
  items: [],
}

const HELP_LOCKED = {
  title: '지금은 전형요소를 수정할 수 없습니다',
  intro: '종료(입력 마감) 또는 마감된 라운드가 있어 전형요소 추가·수정·삭제와 점수 기준 업로드가 차단된 상태입니다. 이미 계산된 점수와 설정이 달라지는 것을 막기 위한 보호 장치입니다.',
  items: [
    '전형요소 목록과 등록된 점수 기준은 계속 볼 수 있습니다.',
    '학생별 기초 데이터의 등록·수정(가져오기)은 지금도 가능합니다.',
  ],
}

const HELP_SCORE = {
  title: '도움말 — 점수 기준',
  intro: '점수 기준은 "어떤 값이면 몇 점"을 정하는 표입니다. 아래 양식 예시와 같은 모양의 엑셀 파일을 올리면 됩니다.',
  items: [
    '"양식 다운로드"로 빈 양식을 받아 기준값(또는 범주)과 점수를 채운 뒤 "가져오기"로 업로드하세요.',
    { text: '가져오기를 하면 이 전형요소의 기존 점수 기준이 전부 새 파일 내용으로 교체됩니다.', warn: true },
  ],
}

const HELP_BASE = {
  title: '도움말 — 기초 데이터',
  intro: '기초 데이터는 학생별 실제 값(예: 교과 내신 점수, 결석 횟수, 봉사 시간)입니다. 점수는 이 값을 점수 기준과 대조해 자동으로 계산됩니다.',
  items: [
    '📌 [유니브/대교협 엑셀 활용] 대학별 내신 환산점수 엑셀 파일(석차연명부)이 있다면 상단의 [대교협 석차연명부 가져오기] 또는 [유니브 석차연명부 가져오기] 버튼으로 엑셀을 통째로 업로드하세요.',
    '재학생/졸업생을 선택하고 양식을 받아 학생별 값을 채워 업로드하셔도 됩니다.',
    '"담임교사 입력 허용"으로 설정된 전형요소는 담임교사가 지원자 등록 화면에서 직접 입력할 수도 있습니다. 관리자가 일괄 업로드해 두면 담임 화면에 미리 채워집니다.',
    '파일에 포함된 학생만 업데이트되고, 파일에 없는 학생의 기존 데이터는 그대로 유지됩니다.',
  ],
}

const hasLockedRound = ref(false)

async function loadRoundLockState() {
  try {
    const rounds = await getRounds()
    hasLockedRound.value = rounds.some(r => r.status === 'CLOSED' || r.status === 'FINALIZED')
  } catch {
    hasLockedRound.value = false // 조회 실패 시 경고 미표시 (백엔드 guard가 최종 방어선)
  }
}

// ── 전형요소 유형 안내 데이터 ────────────────────────────────────
const CALC_TYPE_DESCS = [
  {
    key: 'NUMERIC',
    label: '수치형 입력',
    desc: '기준값 범위에 따라 점수를 자동 산출합니다. 출결·성적·봉사 시간 등 연속적인 수치 데이터에 적합합니다.',
  },
  {
    key: 'CATEGORY',
    label: '선택형 입력',
    desc: '미리 정의한 범주에 해당하는 항목을 선택해 점수를 부여합니다. 자격증·수상·봉사 종류 등에 적합합니다.',
  },
  {
    key: 'MANUAL',
    label: '점수 직접 입력',
    desc: '담임교사 또는 관리자가 직접 점수를 입력합니다. 별도 기준표 없이 자유롭게 평가할 때 사용합니다.',
  },
]

const LOOKUP_SCOPE_DESCS = [
  {
    key: 'SIMPLE',
    label: '기본 조회',
    desc: '모든 대학의 모집단위에서 동일한 점수 기준표를 적용합니다. 대부분의 항목에 사용합니다.',
  },
  {
    key: 'COMPOSITE',
    label: '대학별 환산점수 조회',
    desc: '지원하는 대학·모집단위에 따라 서로 다른 기준표를 적용합니다. 대학별 환산 내신점수 반영 시 사용합니다.',
  },
]

// ── 기본 템플릿 데이터 ─────────────────────────────────────────
// 템플릿 추가·수정·삭제는 이 배열만 편집하면 됩니다.
const AREA_TEMPLATES = [
  {
    id: 'manual_univ_score',
    name: '대학별 환산점수 (직접 입력)',
    description: '동일 대학 지원자 경합 시 해당 대학의 성적 산출 기준에 따라 계산한 환산점수를 담임교사/관리자가 직접 입력합니다.',
    hint: '점수 직접 입력 · 대학별 기준 · 담임교사 입력 허용',
    defaults: {
      name: '대학별 환산점수',
      max_score_display: 100,
      calc_type: 'MANUAL',
      lookup_scope: 'COMPOSITE',
      match_mode: 'EXACT',
      category_agg: '',
      teacher_editable: true,
      unit: '점',
    },
  },
  {
    id: 'grade',
    name: '교과 내신',
    description: '대학별 내신 환산등급을 기준으로 점수를 산출합니다. 등록된 점수 기준과 정확히 일치하는 경우에만 점수가 부여됩니다.',
    hint: '수치형 입력 · 정확히 일치 · 대학별 환산점수 조회 · 담임교사 입력 불가',
    defaults: {
      name: '교과 내신',
      max_score_display: 100,
      calc_type: 'NUMERIC',
      lookup_scope: 'COMPOSITE',
      match_mode: 'EXACT',
      category_agg: '',
      teacher_editable: false,
      unit: '등급',
    },
  },
  {
    id: 'attendance',
    name: '출결',
    description: '미인정 출결에 따라 점수를 산출합니다. 미인정 횟수가 작을수록 배점이 높습니다.',
    hint: '수치형 입력 · 기준값 이하(작을수록 만점) · 기본 조회 · 담임교사 입력 허용',
    defaults: {
      name: '출결',
      max_score_display: 10,
      calc_type: 'NUMERIC',
      lookup_scope: 'SIMPLE',
      match_mode: 'LOWER',
      category_agg: '',
      teacher_editable: true,
      unit: '일',
    },
  },
  {
    id: 'volunteer',
    name: '봉사 활동',
    description: '누적 봉사시간에 따라 점수를 산출합니다. 봉사시간이 많을수록 배점이 높습니다.',
    hint: '수치형 입력 · 기준값 이상(클수록 만점) · 기본 조회 · 담임교사 입력 허용',
    defaults: {
      name: '봉사 활동',
      max_score_display: 5,
      calc_type: 'NUMERIC',
      lookup_scope: 'SIMPLE',
      match_mode: 'UPPER',
      category_agg: '',
      teacher_editable: true,
      unit: '시간',
    },
  },
  {
    id: 'award',
    name: '수상 실적',
    description: '수상 실적을 등록하고 가장 높은 점수 1건만 반영합니다.',
    hint: '선택형 입력 · 최대 1개만 인정 · 기본 조회 · 담임교사 입력 허용',
    defaults: {
      name: '수상 실적',
      max_score_display: 3,
      calc_type: 'CATEGORY',
      lookup_scope: 'SIMPLE',
      match_mode: '',
      category_agg: 'MAX',
      teacher_editable: true,
      unit: '',
    },
  },
  {
    id: 'extracurricular',
    name: '교내 활동',
    description: '교내 활동 실적을 등록하고 점수를 합산하여 반영합니다.',
    hint: '선택형 입력 · 중복 선택 가능 · 기본 조회 · 담임교사 입력 허용',
    defaults: {
      name: '교내 활동',
      max_score_display: 2,
      calc_type: 'CATEGORY',
      lookup_scope: 'SIMPLE',
      match_mode: '',
      category_agg: 'SUM',
      teacher_editable: true,
      unit: '',
    },
  },
  {
    id: 'penalty',
    name: '생활태도',
    description: '징계·학교폭력·선도처분 미이수 등 감점 사유를 복수 선택하면 각 항목의 점수(음수)가 합산됩니다. 만점은 0점이며 사유가 없으면 감점 없이 0점입니다.',
    hint: '선택형 입력 · 중복 선택 가능(합산) · 기본 조회 · 담임교사 입력 허용',
    defaults: {
      name: '생활태도',
      max_score_display: 0,
      calc_type: 'CATEGORY',
      lookup_scope: 'SIMPLE',
      match_mode: '',
      category_agg: 'SUM',
      teacher_editable: true,
      unit: '',
    },
  },
]

// ── 상태 ──────────────────────────────────────────────────────
const areas    = ref([])
const selected = ref(null)
const error    = ref('')
const activeTab   = ref('score')
const scoreResult = ref(null)
const baseResult  = ref(null)
const scorePage   = ref({ rows: [], total: 0, page: 1, per_page: 50 })
const basePage    = ref({ rows: [], total: 0, page: 1, per_page: 50 })

const showAddForm = ref(false)
const modalAddModalOpen = ref(false)
const selectedTemplateName = ref('')
const savingArea = ref(false)
const newArea = ref(defaultNewArea())
const addError = ref('')

const editingAreaId = ref(null)
const editArea = ref({ name: '', teacher_editable: false, unit: '' })
const editError = ref('')

function defaultNewArea() {
  return { name: '', max_score_display: '', calc_type: 'NUMERIC',
           lookup_scope: 'SIMPLE', teacher_editable: true,
           match_mode: '', category_agg: '', unit: '' }
}


const CALC_TYPE_LABELS    = { NUMERIC: '수치형 입력', CATEGORY: '선택형 입력', MANUAL: '점수 직접 입력' }
const LOOKUP_SCOPE_LABELS = { SIMPLE: '기본 조회', COMPOSITE: '대학별 환산점수 조회' }
const MATCH_MODE_LABELS   = { UPPER: '▲ 이상(클수록 만점)', LOWER: '▼ 이하(작을수록 만점)', EXACT: '정확히 일치' }
const CATEGORY_AGG_LABELS = { SUM: '중복 선택 가능(합산)', MAX: '최대 1개 선택(최고점)' }
function calcTypeLabel(v)    { return CALC_TYPE_LABELS[v]    ?? v }
function lookupScopeLabel(v) { return LOOKUP_SCOPE_LABELS[v] ?? v }
function matchModeLabel(v)   { return v ? (MATCH_MODE_LABELS[v]   ?? v) : '—' }
function categoryAggLabel(v) { return v ? (CATEGORY_AGG_LABELS[v] ?? v) : '—' }
const displayScore = formatScore  // 공유 포맷터로 통일 (두 곳이 갈라지지 않도록)

const totalMaxScore = computed(() => areas.value.reduce((sum, a) => sum + a.max_score, 0))

const baseStudentType = ref('enrolled')
watch(baseStudentType, () => loadBaseRows(1))

// ── 점수 계산 테스트 하이라이트 ───────────────────────────────────
const demoHighlight = ref({ matchedKeys: [], trackId: null })

function onDemoHighlight({ matchedKeys, trackId }) {
  demoHighlight.value = { matchedKeys, trackId }
}

function isDemoHighlighted(row) {
  const { matchedKeys, trackId } = demoHighlight.value
  if (!matchedKeys.length) return false
  const rowKey = selected.value?.calc_type === 'NUMERIC' ? row.threshold : row.category
  if (selected.value?.lookup_scope === 'COMPOSITE') {
    if (trackId === 0) {
      if (row.track_id != null) return false
    } else {
      const hasTrackRows = scorePage.value.rows.some(r => r.track_id === trackId)
      if (hasTrackRows) {
        if (row.track_id !== trackId) return false
      } else {
        if (row.track_id != null) return false
      }
    }
  }
  return isKeyMatched(selected.value?.calc_type, matchedKeys, rowKey)
}

const scoreEx = computed(() => selected.value ? getScoreExample(selected.value) : null)
const baseEx  = computed(() => selected.value ? getBaseExample(selected.value, baseStudentType.value) : null)

// ── 전형요소 목록 ─────────────────────────────────────────────────
async function load() {
  try {
    areas.value = await getAreas()
    if (areas.value && areas.value.length > 0 && !selected.value) {
      selectArea(areas.value[0])
    }
  } catch (e) { error.value = e.response?.data ?? e.message }
}

function selectArea(area) {
  selected.value = area
  activeTab.value = area.calc_type === 'MANUAL' ? 'base' : 'score'
  editingAreaId.value = null
  showAddForm.value = false

  scoreResult.value = null
  baseResult.value  = null
  demoHighlight.value = { matchedKeys: [], trackId: null }
  loadScoreRows(1)
  loadBaseRows(1)
}

async function loadScoreRows(page = 1) {
  const area = selected.value
  const empty = { rows: [], total: 0, page: 1, per_page: 50 }
  if (!area || area.calc_type === 'MANUAL') { scorePage.value = empty; return }
  try {
    const data = area.calc_type === 'CATEGORY'
      ? await getCategoryMapList(area.id, page, scorePage.value.per_page)
      : await getNumericTableList(area.id, page, scorePage.value.per_page)
    scorePage.value = data
  } catch { scorePage.value = empty }
}

async function loadBaseRows(page = 1) {
  if (!selected.value) { basePage.value = { rows: [], total: 0, page: 1, per_page: 50 }; return }
  try {
    const data = await getBaseDataList(selected.value.id, page, basePage.value.per_page, baseStudentType.value)
    basePage.value = data
  } catch { basePage.value = { rows: [], total: 0, page: 1, per_page: 50 } }
}

function onScoreResult(evt) { scoreResult.value = evt; loadScoreRows(1) }
function onBaseResult(evt)  { baseResult.value = evt;  loadBaseRows(1)  }

async function addArea() {
  addError.value = ''
  if (!newArea.value.name || !newArea.value.name.trim()) {
    addError.value = '전형요소 이름을 입력해주세요.'
    return
  }
  const maxScore = parseFloat(String(newArea.value.max_score_display).trim())
  if (isNaN(maxScore) || maxScore < 0) {
    addError.value = '만점: 0 이상의 숫자를 입력하세요.'
    return
  }
  if (newArea.value.calc_type === 'NUMERIC' && !newArea.value.match_mode) {
    addError.value = '구간 탐색 방향을 선택하세요.'
    return
  }
  if (newArea.value.calc_type === 'CATEGORY' && !newArea.value.category_agg) {
    addError.value = '복수 활동 처리 방식을 선택하세요.'
    return
  }
  const body = {
    name: newArea.value.name.trim(),
    max_score: maxScore,
    calc_type: newArea.value.calc_type,
    lookup_scope: newArea.value.lookup_scope,
    teacher_editable: newArea.value.teacher_editable,
    match_mode: newArea.value.match_mode || null,
    category_agg: newArea.value.category_agg || null,
    unit: newArea.value.calc_type === 'NUMERIC' ? (newArea.value.unit || null) : null,
  }
  savingArea.value = true
  try {
    const created = await createArea(body)
    modalAddModalOpen.value = false
    showAddForm.value = false
    await load()
    if (created && created.id) {
      selectArea(created)
    } else if (areas.value.length > 0) {
      const match = areas.value.find(a => a.name === body.name)
      if (match) selectArea(match)
    }
  } catch (e) {
    addError.value = e.response?.data?.detail ?? e.response?.data ?? e.message
  } finally {
    savingArea.value = false
  }
}

async function removeArea(id) {
  if (!(await dialog.confirm({
    title: '전형요소 삭제',
    message: '전형요소를 삭제하면 등록된 점수 기준과 기초 데이터도 함께 삭제됩니다. 계속할까요?',
    confirmText: '삭제',
    level: 'danger',
    dangerNotice: '삭제된 점수 기준과 기초 데이터는 복구할 수 없습니다.',
    finalConfirmText: '영구 삭제',
  }))) return
  try {
    await deleteArea(id)
    if (selected.value?.id === id) selected.value = null
    await load()
  } catch (e) { error.value = e.response?.data ?? e.message }
}

const allowAreaEdit = ref(false)

async function loadAreaEditConfig() {
  const localEdit = localStorage.getItem('pcm_allow_area_edit') === 'true'
  allowAreaEdit.value = localEdit
  if (!supabase) return
  try {
    const { data } = await supabase.from('config').select('value').eq('key', 'allow_area_edit').maybeSingle()
    if (data && data.value) {
      allowAreaEdit.value = data.value === 'true'
      localStorage.setItem('pcm_allow_area_edit', data.value)
    }
  } catch {}
}

function startEditArea(area) {
  editArea.value = {
    name: area.name,
    max_score_display: String(area.max_score ?? 100),
    calc_type: area.calc_type || 'NUMERIC',
    lookup_scope: area.lookup_scope || 'SIMPLE',
    match_mode: area.match_mode || '',
    category_agg: area.category_agg || '',
    teacher_editable: area.teacher_editable,
    unit: area.unit ?? ''
  }
  editError.value = ''
  editingAreaId.value = area.id
}

function cancelEdit() {
  editingAreaId.value = null
}

async function saveEdit() {
  editError.value = ''
  if (!editArea.value.name || !editArea.value.name.trim()) {
    editError.value = '전형요소 이름을 입력하세요.'
    return
  }
  const area = areas.value.find(a => a.id === editingAreaId.value)
  let maxScore = area?.max_score ?? 100
  if (allowAreaEdit.value && editArea.value.max_score_display) {
    const parsed = parseFloat(String(editArea.value.max_score_display).trim())
    if (!isNaN(parsed) && parsed >= 0) {
      maxScore = parsed
    }
  }

  const body = {
    name: editArea.value.name.trim(),
    teacher_editable: Boolean(editArea.value.teacher_editable),
    max_score: maxScore,
    calc_type: editArea.value.calc_type || area?.calc_type || 'NUMERIC',
    lookup_scope: editArea.value.lookup_scope || area?.lookup_scope || 'SIMPLE',
    match_mode: editArea.value.calc_type === 'NUMERIC' ? (editArea.value.match_mode || null) : null,
    category_agg: editArea.value.calc_type === 'CATEGORY' ? (editArea.value.category_agg || null) : null,
    unit: editArea.value.calc_type === 'NUMERIC' ? (editArea.value.unit || null) : null,
  }
  try {
    await updateArea(editingAreaId.value, body)
    const prevId = selected.value?.id
    await load()
    selected.value = prevId != null ? (areas.value.find(a => a.id === prevId) ?? null) : null
    editingAreaId.value = null
  } catch (e) {
    editError.value = e.response?.data?.detail ?? e.response?.data ?? e.message
  }
}

function openAddForm() {
  newArea.value = defaultNewArea()
  addError.value = ''
  editingAreaId.value = null
  showAddForm.value = true
}

function openCustomForm() {
  newArea.value = defaultNewArea()
  selectedTemplateName.value = '직접 입력 전형요소'
  addError.value = ''
  modalAddModalOpen.value = true
}

function applyTemplate(tpl) {
  newArea.value = { ...tpl.defaults }
  selectedTemplateName.value = tpl.name
  addError.value = ''
  modalAddModalOpen.value = true
}

const dlTemplateId = ref(null)

async function dlScoreTemplate(tpl) {
  if (dlTemplateId.value) return
  dlTemplateId.value = tpl.id
  try {
    const res = await downloadAreaScoreTemplate(tpl.id)
    saveBlob(res, `${tpl.name}_점수기준_샘플.xlsx`)
  } catch (e) {
    console.error(e)
    await dialog.alert({ title: '다운로드 실패', message: '샘플 파일을 불러오지 못했습니다. 아직 파일이 준비되지 않았을 수 있습니다.', level: 'error' })
  } finally {
    dlTemplateId.value = null
  }
}

// ── 외부 가져오기 모달 ────────────────────────────────────────────
// 모집단위명 빠른 입력 — 매번 손으로 치는 수고를 줄이는 단순 채우기 버튼
const TRACK_PRESETS = ['인문계열', '자연계열']

const extModal = ref({
  open: false, format: '', title: '', file: null, fileName: '',
  univName: '', trackName: '', valueHeader: '', headerInfo: '',
  preview: [], total: 0, importing: false, error: '',
})

async function onExternalFile(format, evt) {
  const file = evt.target.files?.[0]
  evt.target.value = ''
  if (!file) return
  try {
    const data = format === 'daegyo'
      ? await previewDaegyoImport(selected.value.id, file)
      : await previewUnivImport(selected.value.id, file)
    extModal.value = {
      open: true,
      format,
      title: format === 'daegyo' ? '대교협 석차연명부 가져오기' : '유니브 석차연명부 가져오기',
      file,
      fileName: file.name,
      univName: format === 'univ' ? '유니브' : data.univ_name,
      trackName: format === 'univ' ? '전학기 공통' : '',
      valueHeader: data.value_header,
      headerInfo: data.header_info,
      preview: data.preview,
      total: data.total,
      importing: false,
      error: '',
    }
  } catch (e) {
    await dialog.alert({ title: '가져오기 실패', message: e.response?.data ?? e.message ?? '파일 파싱 오류', level: 'error' })
  }
}

function closeExtModal() {
  extModal.value.open = false
}

async function doExtImport() {
  const m = extModal.value
  if (m.format !== 'univ' && !m.trackName.trim()) return
  m.importing = true
  m.error = ''
  try {
    const res = m.format === 'daegyo'
      ? await importDaegyo(selected.value.id, m.file, m.univName, m.trackName)
      : await importUniv(selected.value.id, m.file, m.univName, m.trackName)
    closeExtModal()
    onBaseResult(res.data)
  } catch (e) {
    const d = e.response?.data
    if (d != null && typeof d === 'object' && Array.isArray(d.errors)) {
      closeExtModal()
      onBaseResult(d)
    } else {
      m.error = typeof d === 'string' ? d : (e.message ?? '오류가 발생했습니다')
    }
  } finally {
    m.importing = false
  }
}

onMounted(() => { load(); loadRoundLockState(); loadAreaEditConfig() })

// ── 다운로드 헬퍼 ─────────────────────────────────────────────
function saveBlob(response, filename) {
  if (!response) return
  const data = response.data ?? response
  const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── ExcelPanel (인라인 컴포넌트) ──────────────────────────────
const ExcelPanel = defineComponent({
  props: {
    areaId:      { type: [Number, String], required: true },
    calcType:    { type: String, required: true },
    areaName:    { type: String, required: true },
    panel:       { type: String, required: true }, // 'score' | 'base'
    studentType: { type: String, default: 'enrolled' },
  },
  emits: ['result', 'update:studentType'],
  setup(props, { emit }) {
    const err = ref('')
    const uploading = ref(false)
    const downloading = ref(false)

    async function dlTemplate() {
      err.value = ''
      downloading.value = true
      try {
        if (props.panel === 'score') {
          const res = props.calcType === 'CATEGORY'
            ? await downloadCategoryMapTemplate(props.areaId)
            : await downloadNumericTableTemplate(props.areaId)
          saveBlob(res, props.calcType === 'CATEGORY'
            ? `${props.areaName}_category_map_template.xlsx`
            : `${props.areaName}_numeric_table_template.xlsx`)
        } else {
          const res = await downloadBaseDataTemplate(props.areaId, props.studentType)
          saveBlob(res, `${props.areaName}_base_data_${props.studentType}_template.xlsx`)
        }
      } catch (e) { err.value = await blobErrMsg(e) }
      finally { downloading.value = false }
    }

    async function dlExport() {
      err.value = ''
      downloading.value = true
      try {
        if (props.panel === 'score') {
          const res = props.calcType === 'CATEGORY'
            ? await exportCategoryMap(props.areaId)
            : await exportNumericTable(props.areaId)
          saveBlob(res, props.calcType === 'CATEGORY'
            ? `${props.areaName}_category_map.xlsx`
            : `${props.areaName}_numeric_table.xlsx`)
        } else {
          // 선택된 재학생/졸업생 탭 기준으로 import와 동일 헤더로 내보낸다 (수정 후 재업로드 가능)
          const res = await exportBaseData(props.areaId, props.studentType)
          saveBlob(res, `${props.areaName}_base_data_${props.studentType}.xlsx`)
        }
      } catch (e) { err.value = await blobErrMsg(e) }
      finally { downloading.value = false }
    }

    async function onFile(evt) {
      const file = evt.target.files?.[0]
      if (!file) return
      err.value = ''
      uploading.value = true
      try {
        let result
        if (props.panel === 'score') {
          result = props.calcType === 'CATEGORY'
            ? await importCategoryMap(props.areaId, file)
            : await importNumericTable(props.areaId, file)
        } else {
          result = await importBaseData(props.areaId, file, props.studentType)
        }
        emit('result', result)
      } catch (e) {
        const d = e.response?.data
        if (d != null && typeof d === 'object' && Array.isArray(d.errors)) {
          emit('result', d)
        } else {
          err.value = typeof d === 'string' ? d : (e.message ?? '오류가 발생했습니다')
        }
      }
      finally { uploading.value = false; evt.target.value = '' }
    }

    const btnStyle = 'padding: 9px 16px; border: 1px solid #e2e8f0; background: white; color: #475569; border-radius: 8px; font-size: 16px; cursor: pointer;'
    const uploadStyle = (up) => `padding: 9px 16px; border-radius: 8px; font-size: 16px; cursor: pointer; color: white; background: ${up ? '#94a3b8' : '#2563eb'};`

    return () => h('div', { class: 'space-y-2' }, [
      h('div', { class: 'flex flex-wrap gap-2 items-center' }, [

        // ── 기초 데이터: 재학생/졸업생 라디오
        ...(props.panel === 'base' ? [
          h('label', { style: 'display: flex; align-items: center; gap: 6px; font-size: 16px; cursor: pointer; color: #475569;' }, [
            h('input', {
              type: 'radio',
              name: `st-${props.areaId}`,
              checked: props.studentType === 'enrolled',
              class: 'accent-blue-600',
              onChange: () => emit('update:studentType', 'enrolled'),
            }),
            '재학생',
          ]),
          h('label', { style: 'display: flex; align-items: center; gap: 6px; font-size: 16px; cursor: pointer; color: #475569;' }, [
            h('input', {
              type: 'radio',
              name: `st-${props.areaId}`,
              checked: props.studentType === 'graduated',
              class: 'accent-blue-600',
              onChange: () => emit('update:studentType', 'graduated'),
            }),
            '졸업생',
          ]),
          h('span', { style: 'color: #cbd5e1; user-select: none;' }, '|'),
        ] : []),

        h('button', { style: btnStyle, disabled: downloading.value, onClick: dlTemplate },
        props.panel === "base"
            ? (props.studentType === 'enrolled'
                ? '재학생 양식 다운로드'
                : '졸업생 양식 다운로드')
            : '양식 다운로드'
        ),

        h('label', { style: uploadStyle(uploading.value) }, [
          uploading.value
              ? '가져오는 중…'
              : props.panel === 'base'
                  ? (props.studentType === 'enrolled'
                      ? '재학생 가져오기'
                      : '졸업생 가져오기')
                  : '가져오기',
          h('input', { type: 'file', accept: '.xlsx,.csv', style: 'display: none;', onChange: onFile }),
        ]),

        h('span', { style: 'color: #cbd5e1; user-select: none;' }, '|'),
        h('button', { style: btnStyle, disabled: downloading.value, onClick: dlExport }, '전체 목록 다운로드'),
      ]),
      h('p', { style: 'font-size: 16px; color: #92400e;' },
        props.panel === 'base'
          ? `※ 파일에 포함된 학생의 기초 데이터만 업데이트됩니다. 파일에 없는 학생의 데이터는 유지됩니다.`
          : '※ 가져오기 시 기존 점수 기준이 모두 교체됩니다.'),
      err.value ? h('p', { style: 'font-size: 16px; color: #ef4444;' }, err.value) : null,
    ])
  },
})

// ── ImportResultBox (인라인 컴포넌트) ──────────────────────────
const ImportResultBox = defineComponent({
  props: { result: Object },
  setup(props) {
    return () => {
      const r = props.result
      const hasErrors = r.errors?.length > 0
      const hasWarnings = r.warnings?.length > 0
      const bgStyle = hasErrors
        ? 'padding: 14px 18px; border-radius: 12px; border: 1px solid #fca5a5; background: #fef2f2;'
        : 'padding: 14px 18px; border-radius: 12px; border: 1px solid #86efac; background: #f0fdf4;'
      const titleColor = hasErrors ? '#991b1b' : '#15803d'
      const countStr = r.rows != null ? `${r.rows}건` : r.inserted != null ? `신규 ${r.inserted}명, 수정 ${r.updated}명` : ''
      return h('div', { style: bgStyle }, [
        h('p', { style: `font-size: 16px; font-weight: 600; margin: 0 0 4px; color: ${titleColor};` },
          hasErrors ? '오류 발생 — 가져오기 실패' : `완료 — ${countStr} 처리됨`),
        hasWarnings
          ? h('ul', { style: 'font-size: 16px; color: #15803d; padding-left: 20px; margin: 0;' },
              r.warnings.map((w, i) => h('li', { key: i }, w)))
          : null,
        hasErrors
          ? h('ul', { style: 'font-size: 16px; color: #991b1b; padding-left: 20px; margin: 0;' },
              r.errors.map((e, i) => h('li', { key: i }, e)))
          : null,
      ])
    }
  },
})
</script>

<style scoped>
.template-btn {
  transition: border-color 0.15s;
}
.template-btn:hover {
  border-color: #93c5fd !important;
}
</style>
