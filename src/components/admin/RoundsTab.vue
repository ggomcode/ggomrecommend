<template>
  <div class="py-8 px-4 sm:px-10">

    <!-- 페이지 헤더 -->
    <div class="mb-5 flex items-center justify-between">
      <div>
        <p class="text-base mb-1" style="color: #94a3b8;">관리자</p>
        <h1 @click="selected = null" class="text-2xl font-semibold cursor-pointer hover:text-blue-600 transition-colors" style="color: #1e293b; margin: 0;">학교장 추천 선발</h1>
      </div>
      <button
        v-if="selected"
        @click="selected = null"
        class="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 transition-all"
      >
        📅 전체 선발 목록보기
      </button>
    </div>



    <div class="w-full">
      <!-- 1) 기본 화면: 차수별 선발일정 전체 관리 대시보드 -->
      <div v-if="!selected" class="space-y-5">
        <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-800 m-0 flex items-center gap-2">
              <span>📅</span> 차수별 선발일정 전체 관리
            </h2>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <!-- 총 선발 회수 설정 -->
            <div class="flex items-center gap-2">
              <label class="text-xs font-semibold text-slate-500 whitespace-nowrap">총 선발 회수</label>
              <select
                v-model.number="totalRounds"
                @change="saveTotalRounds"
                class="text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                style="min-width: 110px;"
              >
                <option :value="1">1회 (단일)</option>
                <option :value="2">최대 2차</option>
                <option :value="3">최대 3차</option>
                <option :value="4">최대 4차</option>
                <option :value="5">최대 5차</option>
              </select>
            </div>
            <button
              class="text-xs font-bold px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-40"
              :disabled="loading"
              @click="handleOpenRound"
            >+ 차수 추가</button>
            <button @click="saveAllSchedules" class="text-xs font-bold px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer">
              💾 전체 일정 DB 저장
            </button>
          </div>
        </div>

          <!-- 차수별 일정 입력 카드 목록 -->
          <div class="grid grid-cols-1 gap-4">
            <div v-for="r in rounds" :key="r.id" class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-blue-300 transition-all space-y-4">
              <div class="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                <div class="flex items-center gap-3 flex-wrap">
                  <span class="text-base font-bold text-slate-900">{{ totalRounds === 1 ? '선발일정' : `${r.id}차 선발일정` }}</span>
                  <!-- 진행 상태 배지 (자동 동기화) -->
                  <div class="flex items-center gap-1.5">
                    <label class="text-xs text-slate-400 font-semibold">진행 상태:</label>
                    <span
                      class="text-xs font-bold px-3 py-1 rounded-full border shadow-sm transition-all flex items-center gap-1"
                      :style="getStatusStyle(getDisplayStatus(r))"
                    >
                      <span v-if="getDisplayStatus(r) === 'DRAFT'">⏳ 대기중</span>
                      <span v-else-if="getDisplayStatus(r) === 'OPEN'">🟢 진행중</span>
                      <span v-else-if="getDisplayStatus(r) === 'CLOSED'">🔵 종료</span>
                      <span v-else-if="getDisplayStatus(r) === 'FINALIZED'">🟣 마감</span>
                    </span>
                  </div>
                </div>
                <button
                  @click="selectRound(r)"
                  class="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-blue-200 flex items-center gap-1"
                >
                  🔍 지원 현황 및 추천 확정 보기 ➔
                </button>
              </div>

              <!-- 세부 일정(접수 / 협의 / 공지 기간) 입력 구역 -->
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
                <!-- 📅 희망자 접수 기간 -->
                <div class="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-bold text-slate-700">📅 희망자 접수 기간</label>
                    <button
                      type="button"
                      @click="setWorkingHours(getSchedule(r.id), 'apply')"
                      class="text-[10px] text-blue-600 hover:text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-semibold"
                      title="시작 09:00, 마감 18:00으로 자동 맞춤"
                    >
                      🕒 09~18시 설정
                    </button>
                  </div>
                  <div class="space-y-1">
                    <div class="flex items-center gap-1.5">
                      <span class="text-[11px] font-bold text-slate-400 w-8 shrink-0">시작</span>
                      <input
                        type="datetime-local"
                        v-model="getSchedule(r.id).apply_start"
                        class="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white text-slate-800"
                      />
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[11px] font-bold text-slate-400 w-8 shrink-0">마감</span>
                      <input
                        type="datetime-local"
                        v-model="getSchedule(r.id).apply_end"
                        class="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white text-slate-800"
                      />
                    </div>
                  </div>
                  <p class="text-[11px] font-bold text-blue-600 m-0 pt-0.5 break-all">
                    📌 {{ formatKoreanPeriod(getSchedule(r.id).apply_start, getSchedule(r.id).apply_end) }}
                  </p>
                </div>

                <!-- 🤝 대상자 선정 협의 기간 -->
                <div class="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-bold text-slate-700">🤝 대상자 선정 협의 기간</label>
                    <button
                      type="button"
                      @click="setWorkingHours(getSchedule(r.id), 'eval')"
                      class="text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-semibold"
                      title="시작 09:00, 종료 18:00으로 자동 맞춤"
                    >
                      🕒 09~18시 설정
                    </button>
                  </div>
                  <div class="space-y-1">
                    <div class="flex items-center gap-1.5">
                      <span class="text-[11px] font-bold text-slate-400 w-8 shrink-0">시작</span>
                      <input
                        type="datetime-local"
                        v-model="getSchedule(r.id).eval_start"
                        @change="syncEvalDate(getSchedule(r.id))"
                        class="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white text-slate-800"
                      />
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[11px] font-bold text-slate-400 w-8 shrink-0">종료</span>
                      <input
                        type="datetime-local"
                        v-model="getSchedule(r.id).eval_end"
                        @change="syncEvalDate(getSchedule(r.id))"
                        class="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white text-slate-800"
                      />
                    </div>
                  </div>
                  <p class="text-[11px] font-bold text-indigo-600 m-0 pt-0.5 break-all">
                    📌 {{ formatKoreanPeriod(getSchedule(r.id).eval_start, getSchedule(r.id).eval_end) }}
                  </p>
                </div>

                <!-- 📢 선정 결과 공지 기간 -->
                <div class="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-bold text-slate-700">📢 선정 결과 공지 기간</label>
                    <button
                      type="button"
                      @click="setWorkingHours(getSchedule(r.id), 'announce')"
                      class="text-[10px] text-purple-600 hover:text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 font-semibold"
                      title="시작 09:00, 종료 18:00으로 자동 맞춤"
                    >
                      🕒 09~18시 설정
                    </button>
                  </div>
                  <div class="space-y-1">
                    <div class="flex items-center gap-1.5">
                      <span class="text-[11px] font-bold text-slate-400 w-8 shrink-0">시작</span>
                      <input
                        type="datetime-local"
                        v-model="getSchedule(r.id).announce_start"
                        @change="syncAnnounceDate(getSchedule(r.id))"
                        class="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white text-slate-800"
                      />
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[11px] font-bold text-slate-400 w-8 shrink-0">종료</span>
                      <input
                        type="datetime-local"
                        v-model="getSchedule(r.id).announce_end"
                        @change="syncAnnounceDate(getSchedule(r.id))"
                        class="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white text-slate-800"
                      />
                    </div>
                  </div>
                  <p class="text-[11px] font-bold text-purple-600 m-0 pt-0.5 break-all">
                    📌 {{ formatKoreanPeriod(getSchedule(r.id).announce_start, getSchedule(r.id).announce_end) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2) 차수 선택 시: 지원자 현황 및 추천 확정 관리 화면 -->
        <template v-else>
          <div class="mb-4 flex items-center justify-between">
            <button
              @click="selected = null"
              class="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 transition-all"
            >
              ⬅️ 전체 선발 목록으로 돌아가기
            </button>
          </div>

          <div class="rounded-xl mb-5"
            style="padding: 18px 22px; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);">
            <div v-if="showAbandonOnly" class="flex flex-col gap-1">
              <span class="text-xl font-bold" style="color: #e11d48;">🚨 전체 차수 포기원 접수확인</span>
              <p class="text-xs text-slate-500 mt-1 m-0">전체 선발 차수에서 학생들이 신청한 추천 포기원 서류 제출 현황 및 이미 처리된 포기 학생 목록입니다. 각 학생을 선택해 등록된 포기원 PDF 서류를 검토하고 확정하십시오.</p>
            </div>
            <div v-else class="flex items-center gap-3 flex-wrap">
              <span class="text-xl font-bold" style="color: #1e293b;">{{ totalRounds === 1 ? '선발 현황' : `${selected.id}차 선발 현황` }}</span>
              <span
                  class="text-base font-semibold transition-all"
                  style="padding: 4px 14px; border: 1px solid; border-radius: 999px;"
                  :style="getStatusStyle(getDisplayStatus(selected))"
              >
                {{ roundStatusLabel(getDisplayStatus(selected)) }}</span>

              <!-- 상태 액션 버튼 -->
              <template v-if="getDisplayStatus(selected) === 'OPEN'">
                <button
                  class="text-base font-medium rounded-lg whitespace-nowrap disabled:opacity-40"
                  style="padding: 4px 14px; border: 1px solid #fca5a5; background: white; color: #ef4444; cursor: pointer;"
                  :disabled="roundActing"
                  @click="handleCloseRound(selected.id)"
                >종료하기</button>
              </template>
              <template v-else-if="getDisplayStatus(selected) === 'CLOSED'">
                <button
                  class="text-base font-medium rounded-lg whitespace-nowrap disabled:opacity-40"
                  style="padding: 4px 14px; border: 1px solid #e2e8f0; background: white; color: #64748b; cursor: pointer;"
                  :disabled="roundActing"
                  @click="handleReopenRound(selected.id)"
                >다시 열기</button>
                <button
                  class="text-base font-medium rounded-lg whitespace-nowrap disabled:opacity-40"
                  style="padding: 4px 14px; border: 1px solid #d8b4fe; background: white; color: #7c3aed; cursor: pointer;"
                  :disabled="roundActing"
                  @click="handleFinalizeRound(selected.id)"
                >마감하기</button>
              </template>

              <!-- 날짜 정보 (대기중일 때는 숨김) -->
              <div v-if="getDisplayStatus(selected) !== 'DRAFT'" class="w-full flex gap-1.5 items-center flex-wrap text-sm text-slate-400 mt-2 font-medium">
                <span>
                  🟢 접수 개시: {{ fmtDt(selected.opened_at) }}
                </span>
                <span v-if="selected.closed_at">
                  • 🔵 입력 종료: {{ fmtDt(selected.closed_at) }}
                </span>
                <span v-if="selected.finalized_at">
                  • 🟣 최종 마감: {{ fmtDt(selected.finalized_at) }}
                </span>
              </div>

              <!-- 📅 차수별 상세 선발 일정 편집 카드 -->
              <div class="w-full mt-3 pt-4 border-t border-slate-100">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-base font-semibold text-slate-800">📅 {{ totalRounds === 1 ? '선발 세부 일정 설정' : `${selected.id}차 선발 세부 일정 설정` }}</span>
                  <button @click="saveSchedule" class="text-xs font-semibold px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                    일정 저장
                  </button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <!-- 희망자 접수 기간 -->
                  <div class="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80 space-y-1">
                    <div class="flex items-center justify-between">
                      <label class="block text-xs font-bold text-slate-700">희망자 접수 기간</label>
                      <button
                        type="button"
                        @click="setWorkingHours(curSchedule, 'apply')"
                        class="text-[10px] text-blue-600 hover:text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-semibold"
                        title="시작 09:00, 마감 18:00으로 자동 맞춤"
                      >
                        🕒 09~18시
                      </button>
                    </div>
                    <div class="space-y-1">
                      <div class="flex items-center gap-1.5">
                        <span class="text-[11px] font-bold text-slate-400 w-8 shrink-0">시작</span>
                        <input type="datetime-local" v-model="curSchedule.apply_start"
                          class="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white font-medium text-slate-800" />
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-[11px] font-bold text-slate-400 w-8 shrink-0">마감</span>
                        <input type="datetime-local" v-model="curSchedule.apply_end"
                          class="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white font-medium text-slate-800" />
                      </div>
                    </div>
                    <p class="text-[10px] font-bold text-blue-600 m-0 pt-0.5 break-all">
                      📌 {{ formatKoreanPeriod(curSchedule.apply_start, curSchedule.apply_end) }}
                    </p>
                  </div>

                  <!-- 대상자 선정 협의 기간 -->
                  <div class="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80 space-y-1">
                    <div class="flex items-center justify-between">
                      <label class="block text-xs font-bold text-slate-700">대상자 선정 협의 기간</label>
                      <button
                        type="button"
                        @click="setWorkingHours(curSchedule, 'eval')"
                        class="text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-semibold"
                        title="시작 09:00, 종료 18:00으로 자동 맞춤"
                      >
                        🕒 09~18시
                      </button>
                    </div>
                    <div class="space-y-1">
                      <div class="flex items-center gap-1.5">
                        <span class="text-[11px] font-bold text-slate-400 w-8 shrink-0">시작</span>
                        <input type="datetime-local" v-model="curSchedule.eval_start"
                          @change="syncEvalDate(curSchedule)"
                          class="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white font-medium text-slate-800" />
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-[11px] font-bold text-slate-400 w-8 shrink-0">종료</span>
                        <input type="datetime-local" v-model="curSchedule.eval_end"
                          @change="syncEvalDate(curSchedule)"
                          class="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white font-medium text-slate-800" />
                      </div>
                    </div>
                    <p class="text-[10px] font-bold text-indigo-600 m-0 pt-0.5 break-all">
                      📌 {{ formatKoreanPeriod(curSchedule.eval_start, curSchedule.eval_end) }}
                    </p>
                  </div>

                  <!-- 선정 결과 공지 기간 -->
                  <div class="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80 space-y-1">
                    <div class="flex items-center justify-between">
                      <label class="block text-xs font-bold text-slate-700">선정 결과 공지 기간</label>
                      <button
                        type="button"
                        @click="setWorkingHours(curSchedule, 'announce')"
                        class="text-[10px] text-purple-600 hover:text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 font-semibold"
                        title="시작 09:00, 종료 18:00으로 자동 맞춤"
                      >
                        🕒 09~18시
                      </button>
                    </div>
                    <div class="space-y-1">
                      <div class="flex items-center gap-1.5">
                        <span class="text-[11px] font-bold text-slate-400 w-8 shrink-0">시작</span>
                        <input type="datetime-local" v-model="curSchedule.announce_start"
                          @change="syncAnnounceDate(curSchedule)"
                          class="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white font-medium text-slate-800" />
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-[11px] font-bold text-slate-400 w-8 shrink-0">종료</span>
                        <input type="datetime-local" v-model="curSchedule.announce_end"
                          @change="syncAnnounceDate(curSchedule)"
                          class="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white font-medium text-slate-800" />
                      </div>
                    </div>
                    <p class="text-[10px] font-bold text-purple-600 m-0 pt-0.5 break-all">
                      📌 {{ formatKoreanPeriod(curSchedule.announce_start, curSchedule.announce_end) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>


          <HelpBox
            v-if="helpBox && !showAbandonOnly"
            :key="helpBox.key"
            class="mb-5"
            :storage-key="helpBox.key"
            :title="helpBox.title"
            :intro="helpBox.intro"
            :items="helpBox.items"
          />

          <!-- ── 통합 추천 선발 및 결과 뷰 ──────────────── -->
          <div>
            <div class="mb-3">
              <div class="flex items-center gap-3 mb-3 flex-wrap">
                <select
                  v-model="selectedTrackId"
                  class="text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style="border: 1px solid #e2e8f0; padding: 9px 12px; color: #1e293b;"
                  @change="loadResults"
                >
                  <option value="">전체 대학</option>
                  <option v-for="t in tracksInRound" :key="t.id" :value="t.id">
                    {{ t.univ_name }} {{ t.track_name }}
                  </option>
                </select>
                <button
                  class="text-base font-medium rounded-lg whitespace-nowrap"
                  style="padding: 9px 16px; border: 1px solid #e2e8f0; background: white; color: #475569; cursor: pointer;"
                  @click="loadResults"
                >새로고침</button>
                <label class="flex items-center gap-2 text-base font-semibold cursor-pointer select-none bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2 rounded-xl shadow-sm">
                  <input type="checkbox" v-model="showAbandonOnly" class="rounded text-rose-600 focus:ring-rose-500" />
                  🚨 포기 신청 학생만 보기
                </label>
                <span style="color: #cbd5e1; user-select: none;">|</span>
                <button
                  v-if="selected.status === 'CLOSED'"
                  class="text-base font-semibold rounded-lg whitespace-nowrap disabled:opacity-40"
                  style="padding: 9px 16px; border: none; background: #d97706; color: white; cursor: pointer;"
                  :disabled="autoRecommendActing"
                  @click="handleAutoRecommend"
                >자동 추천 확정</button>
                <button
                  class="text-base font-medium rounded-lg whitespace-nowrap disabled:opacity-40"
                  style="padding: 9px 16px; border: none; background: #059669; color: white; cursor: pointer;"
                  :disabled="results.length === 0 || downloading"
                  @click="downloadExcel"
                >이 추천 선발 지원자 명단</button>
                <button
                  class="text-base font-medium rounded-lg whitespace-nowrap disabled:opacity-40"
                  style="padding: 9px 16px; border: none; background: #2563eb; color: white; cursor: pointer;"
                  :disabled="selected.status !== 'FINALIZED' || downloadingSummary"
                  @click="downloadSummary"
                >이 추천 선발 현황</button>
              </div>


            </div>

            <!-- 자동 추천 확정 결과 표시 -->
            <div v-if="autoRecommendResult" class="mb-5 rounded-xl" style="padding: 16px 20px; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);">
              <div v-if="autoRecommendScope" class="text-base mb-2" style="color: #64748b;">
                처리 범위: {{ autoRecommendScope }}
              </div>
              <div v-if="autoRecommendResult.confirmed.length > 0" class="text-base font-semibold mb-2" style="color: #15803d;">
                {{ autoRecommendResult.confirmed.length }}개 모집단위 {{ autoRecommendResult.confirmed.reduce((s, c) => s + c.count, 0) }}명 추천 확정
              </div>
              <div v-if="autoRecommendResult.confirmed.length === 0 && autoRecommendResult.manual.length === 0" class="text-base" style="color: #94a3b8;">
                자동 확정 대상 없음 (정원 소진 또는 후보 없음)
              </div>
              <div v-if="autoRecommendResult.manual.length > 0" class="rounded-lg mt-2" style="padding: 12px 16px; background: #fffbeb; border: 1px solid #fcd34d;">
                <p class="text-base font-semibold mb-2" style="color: #92400e;">수동 확인 필요</p>
                <div v-for="(m, i) in autoRecommendResult.manual" :key="i" class="text-base" style="color: #78350f;">
                  {{ m.univ_name }}<template v-if="m.track_name"> {{ m.track_name }}</template><template v-else> (대학 전체)</template> — {{ m.reason }}
                </div>
              </div>
            </div>

            <div v-if="Object.keys(resultsByView).length === 0" class="text-base text-center" style="padding: 48px 0; color: #94a3b8;">
              <template v-if="showAbandonOnly">포기 신청 대기 중인 학생이 없습니다.</template>
              <template v-else>결과가 없습니다. 점수 계산을 먼저 실행하세요.</template>
            </div>

            <div v-for="(group, key) in resultsByView" :key="key" class="mb-6">
              <div class="flex items-center gap-3 mb-3 flex-wrap">
                <h4 class="text-base font-semibold" style="color: #1e293b; margin: 0;">{{ key }}</h4>
                
                <!-- 모집단위별 보기일 때 -->
                <div v-if="rankView === 'track'" class="flex items-center gap-2.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex-wrap">
                  <span v-if="group.unitQuota != null" :class="group.results.length > group.unitQuota ? 'text-amber-700 font-bold' : 'text-emerald-700'">
                    🎯 모집단위: 지원 {{ group.results.length }}명 / 정원 {{ group.unitQuota }}명
                    <span v-if="group.unitQuota - group.results.length > 0" class="text-emerald-600 font-bold">({{ group.unitQuota - group.results.length }}자리 남음)</span>
                    <span v-else-if="group.unitQuota === group.results.length" class="text-slate-500 font-normal">(정원 충족)</span>
                    <span v-else class="text-rose-600 font-bold">({{ group.results.length - group.unitQuota }}명 초과)</span>
                  </span>
                  <span v-else class="text-slate-500">
                    🎯 모집단위: 지원 {{ group.results.length }}명 (정원 제한 없음)
                  </span>

                  <span class="text-slate-300">|</span>

                  <span v-if="group.totalQuota != null" :class="group.univAppliedCount > group.totalQuota ? 'text-indigo-800 font-bold' : 'text-indigo-700'">
                    🏫 대학 전체: 지원 {{ group.univAppliedCount }}명 / 정원 {{ group.totalQuota }}명
                    <span v-if="group.totalQuota - group.univAppliedCount > 0" class="text-indigo-600 font-bold">({{ group.totalQuota - group.univAppliedCount }}자리 남음)</span>
                    <span v-else-if="group.totalQuota === group.univAppliedCount" class="text-slate-500 font-normal">(정원 충족)</span>
                    <span v-else class="text-rose-600 font-bold">({{ group.univAppliedCount - group.totalQuota }}명 초과)</span>
                  </span>
                  <span v-else class="text-slate-500">
                    🏫 대학 전체: 지원 {{ group.univAppliedCount }}명 (정원 제한 없음)
                  </span>

                  <span class="text-slate-300">|</span>

                  <span :class="group.gradAllowed ? 'text-blue-600' : 'text-rose-600'">
                    🎓 졸업생: {{ group.gradAllowed ? '지원 허용' : '제한 (재학생 전용)' }}
                  </span>
                </div>

                <!-- 대학별 보기일 때 -->
                <div v-else class="flex items-center gap-2.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex-wrap">
                  <span v-if="group.totalQuota != null" :class="group.results.length > group.totalQuota ? 'text-indigo-800 font-bold' : 'text-indigo-700'">
                    🏫 대학 전체: 지원 {{ group.results.length }}명 / 정원 {{ group.totalQuota }}명
                    <span v-if="group.totalQuota - group.results.length > 0" class="text-indigo-600 font-bold">({{ group.totalQuota - group.results.length }}자리 남음)</span>
                    <span v-else-if="group.totalQuota === group.results.length" class="text-slate-500 font-normal">(정원 충족)</span>
                    <span v-else class="text-rose-600 font-bold">({{ group.results.length - group.totalQuota }}명 초과)</span>
                  </span>
                  <span v-else class="text-slate-500">
                    🏫 대학 전체: 지원 {{ group.results.length }}명 (정원 제한 없음)
                  </span>
                </div>
                <button
                  v-if="selected.status === 'CLOSED' && univAutoButtonKeys.has(key)"
                  class="text-base font-medium rounded-lg whitespace-nowrap disabled:opacity-40"
                  style="padding: 6px 14px; border: 1px solid #fcd34d; background: #fffbeb; color: #92400e; cursor: pointer;"
                  :disabled="autoRecommendActing"
                  @click="handleAutoRecommendUniv(group)"
                >{{ group.univName }} 전체 자동 추천</button>
              </div>
              <div class="rounded-xl overflow-hidden"
                style="background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);">
                <div class="overflow-x-auto">
                  <table style="border-collapse: collapse; table-layout: fixed; width: 100%; min-width: 1106px;">
                    <colgroup>
                      <col style="width: 36px;">
                      <col style="width: 70px;">
                      <col style="width: 140px;">
                      <col style="width: 100px;">
                      <col style="width: 90px;">
                      <col style="width: 190px;">
                      <col style="width: 90px;">
                      <col style="width: 120px;">
                      <col style="width: 110px;">
                      <col style="width: 160px;">
                    </colgroup>
                    <thead>
                      <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <th style="padding: 13px 8px;"></th>
                        <th class="text-base font-semibold text-center" style="padding: 13px 16px; color: #475569;">순위</th>
                        <th class="text-base font-semibold text-left" style="padding: 13px 18px; color: #475569;">학번/학생코드</th>
                        <th class="text-base font-semibold text-left" style="padding: 13px 18px; color: #475569;">학생 이름</th>
                        <th class="text-base font-semibold text-left" style="padding: 13px 18px; color: #475569;">구분</th>
                        <th class="text-base font-semibold text-left" style="padding: 13px 18px; color: #475569;">{{ rankView === 'track' ? '지원 학과' : '모집단위 · 지원 학과' }}</th>
                        <th class="text-base font-semibold text-left" style="padding: 13px 18px; color: #475569;">총점</th>
                        <th class="text-base font-semibold text-center" style="padding: 13px 18px; color: #475569;">추천</th>
                        <th class="text-base font-semibold text-center" style="padding: 13px 18px; color: #475569;">포기처리</th>
                        <th class="text-base font-semibold text-center" style="padding: 13px 18px; color: #475569;">미선발</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="r in group.results" :key="r.student_id">
                        <tr
                          class="cursor-pointer transition-colors"
                          :style="{
                            borderBottom: '1px solid #f1f5f9',
                            background:
                              selected.status === 'FINALIZED' && (r.abandoned || !r.recommended) ? '#fef2f2' :
                              selected.status === 'FINALIZED' && r.recommended && !r.abandoned ? '#f0fdf4' :
                              tieSet.has(`${r.student_id}-${r.track_id}`) ? '#fffbeb' :
                              undefined,
                          }"
                          @click="toggleRow(`${r.student_id}-${r.track_id}`)"
                        >
                          <td class="text-base text-center" style="padding: 12px 8px; color: #94a3b8; user-select: none;">
                            {{ expandedRows[`${r.student_id}-${r.track_id}`] ? '▼' : '▶' }}
                          </td>
                          <td class="text-base text-center" style="padding: 12px 16px; color: #475569;">
                            <template v-if="rankView === 'track'">
                              {{ group.unitQuota != null ? (r.track_rank ?? r.ranking ?? '-') : '-' }}
                            </template>
                            <template v-else>
                              {{ group.totalQuota != null ? (r.ranking ?? '-') : '-' }}
                            </template>
                          </td>
                          <td class="text-base" style="padding: 12px 18px; color: #475569; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <span v-if="r.is_enrolled">{{ r.grade }}학년 {{ r.class_no }}반 {{ r.seq_no }}번</span>
                            <span v-else class="font-mono">{{ r.student_code }}</span>
                          </td>
                          <td class="text-base font-medium" style="padding: 12px 18px; color: #1e293b; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <span v-if="showAbandonOnly" class="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 mr-1 border border-rose-200">
                              {{ r.abandoned_round || r.round || r.round_id || selected?.id }}차 포기
                            </span>
                            <span v-else-if="totalRounds > 1 && (r.round || r.round_id || selected?.id)" class="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 mr-1 border border-indigo-200">
                              {{ r.round || r.round_id || selected?.id }}차 지원
                            </span>
                            {{ r.name }}
                          </td>
                          <td style="padding: 12px 18px;">
                            <span class="text-base font-medium"
                              :style="{ color: r.is_enrolled ? '#16a34a' : '#94a3b8' }">
                              {{ r.is_enrolled ? '재학생' : '졸업생' }}
                            </span>
                          </td>
                          <td style="padding: 12px 18px; overflow: hidden;">
                            <template v-if="rankView === 'univ'">
                              <div class="text-base font-medium" style="color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ r.track_name }}</div>
                              <div class="text-base" style="color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ r.department_name }}</div>
                            </template>
                            <span v-else class="text-base" style="color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;">{{ r.department_name }}</span>
                          </td>
                          <td class="text-base text-left font-semibold" style="padding: 12px 18px; color: #1e293b;">
                             <template v-if="(rankView === 'track' ? group.unitQuota != null : group.totalQuota != null) && r.ranking != null">
                               {{ r.ranking }}위
                             </template>
                             ({{ r.manual_score != null && Number(r.manual_score) > 0 ? `${formatScore(r.manual_score)}점` : (r.gpa_overall != null ? `${Number(r.gpa_overall).toFixed(2)}등급` : '-') }})
                           </td>
                          <td class="text-center" style="padding: 12px 18px;" @click.stop>
                            <div class="flex flex-col items-center gap-1">
                            <span v-if="r.abandoned" class="text-base font-semibold" style="color: #ef4444;">
                              {{ totalRounds > 1 && (r.abandoned_round || r.round || r.round_id || selected?.id) ? `${r.abandoned_round || r.round || r.round_id || selected?.id}차 포기됨` : '포기됨' }}
                            </span>
                            <span v-else-if="isAbandonRequested(r)" class="text-base font-semibold text-rose-500" style="color: #f43f5e;">
                              {{ totalRounds > 1 && (r.abandoned_round || r.round || r.round_id || selected?.id) ? `${r.abandoned_round || r.round || r.round_id || selected?.id}차 포기신청` : '포기 신청중' }}
                            </span>
                            <template v-else-if="r.recommended">
                              <span class="text-base font-semibold" style="color: #16a34a;">
                                {{ totalRounds > 1 && (r.recommended_round || r.round || r.round_id || selected?.id) ? `${r.recommended_round || r.round || r.round_id || selected?.id}차 추천 확정됨` : '추천 확정됨' }}
                              </span>
                              <button
                                v-if="selected.status === 'CLOSED'"
                                class="text-base rounded-lg whitespace-nowrap"
                                style="padding: 3px 10px; border: 1px solid #fca5a5; background: white; color: #ef4444; cursor: pointer;"
                                @click="handleUnrecommend(r)"
                              >추천 취소</button>
                            </template>
                            <button
                              v-else-if="selected.status === 'CLOSED' && !r.excluded"
                              class="text-base font-semibold rounded-lg whitespace-nowrap disabled:opacity-40"
                              style="padding: 5px 12px; border: none; background: #16a34a; color: white; cursor: pointer;"
                              :disabled="resultActing"
                              @click="handleRecommend(r)"
                            >추천 확정</button>
                            <span v-else-if="selected.status === 'CLOSED' && r.excluded" style="color: #cbd5e1;">-</span>
                            <span v-else-if="selected.status === 'FINALIZED'" class="text-base font-semibold" style="color: #ef4444;">
                              {{ totalRounds > 1 && (r.round || r.round_id || selected?.id) ? `${r.round || r.round_id || selected?.id}차 미선발` : '미선발' }}
                            </span>
                            <span v-else class="text-base font-semibold" style="color: #94a3b8;">-</span>
                            </div>
                          </td>
                          <td class="text-center" style="padding: 12px 18px;" @click.stop>
                            <button
                              v-if="r.abandoned"
                              class="text-sm font-semibold rounded-lg whitespace-nowrap shadow-xs hover:bg-rose-100 transition-colors"
                              style="padding: 5px 12px; border: 1px solid #fda4af; background: #fff1f2; color: #e11d48; cursor: pointer;"
                              @click="handlePrintAbandon(r)"
                              title="포기원 서류 인쇄"
                            >📄 포기원 인쇄</button>
                            <button
                              v-else-if="isAbandonRequested(r)"
                              class="text-base font-semibold rounded-lg whitespace-nowrap"
                              style="padding: 5px 12px; border: none; background: #e11d48; color: white; cursor: pointer;"
                              @click="handleApproveAbandon(r)"
                            >포기 승인</button>
                            <button
                              v-else-if="r.recommended && !r.abandoned"
                              class="text-base rounded-lg whitespace-nowrap"
                              style="padding: 5px 12px; border: 1px solid #fca5a5; background: white; color: #ef4444; cursor: pointer;"
                              @click="handleAbandon(r)"
                            >포기하기</button>
                            <span v-else style="color: #cbd5e1;">-</span>
                          </td>
                          <td class="text-center" style="padding: 12px 18px;" @click.stop>
                            <div class="flex flex-col items-center gap-1">
                            <template v-if="r.excluded">
                              <span class="text-base font-semibold" :title="r.excluded_reason" style="color: #d97706;">
                                {{ totalRounds > 1 && (r.round || r.round_id || selected?.id) ? `${r.round || r.round_id || selected?.id}차 미선발` : '미선발' }}
                              </span>
                              <button
                                v-if="selected.status === 'CLOSED'"
                                class="text-base rounded-lg whitespace-nowrap disabled:opacity-40"
                                style="padding: 3px 10px; border: 1px solid #fcd34d; background: white; color: #92400e; cursor: pointer;"
                                :disabled="resultActing"
                                @click="handleClearExclusion(r)"
                              >미선발 해제</button>
                            </template>
                            <button
                              v-else-if="selected.status === 'CLOSED'"
                              class="text-base rounded-lg whitespace-nowrap"
                              style="padding: 5px 12px; border: 1px solid #fcd34d; background: white; color: #92400e; cursor: pointer;"
                              @click="startExclude(r)"
                            >미선발 처리</button>
                            <span v-else style="color: #cbd5e1;">-</span>
                            </div>
                          </td>
                        </tr>
                        <!-- 전형요소 점수 상세 및 차수 요약 -->
                        <tr v-if="expandedRows[`${r.student_id}-${r.track_id}`]"
                          style="border-bottom: 1px solid #f1f5f9; background: #f8fafc;">
                          <td colspan="10" style="padding: 14px 36px;">
                            <div class="flex flex-col gap-2">
                              <div v-if="totalRounds > 1" class="flex items-center gap-3 text-xs pb-2 border-b border-slate-200/80 flex-wrap">
                                <span class="font-bold text-slate-700">📌 차수 정보:</span>
                                <span class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                                  지원: {{ r.round || r.round_id || selected?.id }}차 지원
                                </span>
                                <span v-if="r.recommended" class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                  선발: {{ r.recommended_round || r.round || r.round_id || selected?.id }}차 추천 확정됨
                                </span>
                                <span v-else-if="r.abandoned" class="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                                  포기: {{ r.abandoned_round || r.round || r.round_id || selected?.id }}차 포기 처리됨
                                </span>
                                <span v-else-if="r.excluded" class="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                                  미선발: {{ r.round || r.round_id || selected?.id }}차 제외 ({{ r.excluded_reason || '사유 없음' }})
                                </span>
                                <span v-else-if="selected.status === 'FINALIZED'" class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                                  선발 결과: {{ r.round || r.round_id || selected?.id }}차 미선발
                                </span>
                              </div>
                              <div class="flex flex-wrap gap-x-6 gap-y-2">
                                <div v-for="area in areas" :key="area.id" class="flex items-center gap-2">
                                  <span class="text-base" style="color: #64748b;">{{ area.name }}</span>
                                  <span class="text-base font-semibold" style="color: #1e293b;">{{ getAreaScore(r, area.id) }}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

        </template>
      </div>
    </div>

  <!-- 미선발 처리 모달 -->
  <Teleport to="body">
    <div
      v-if="showExcludeModal"
      class="fixed inset-0 flex items-center justify-center"
      style="background: rgba(0,0,0,0.35); z-index: 60;"
      role="dialog"
      aria-modal="true"
      @keydown.escape="showExcludeModal = false"
    >
      <div
        class="bg-white flex flex-col"
        style="border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); width: 100%; max-width: 480px; margin: 0 16px; padding: 1.5rem 1.75rem;"
      >
        <h2 class="text-lg font-semibold mb-1" style="margin: 0; color: #92400e;">미선발 처리</h2>
        <p class="text-base mb-4" style="color: #475569;">
          <span class="font-semibold" style="color: #1e293b;">{{ excludeTarget?.name }}</span> 학생을 이번 추천 선발에서 미선발 처리합니다.
        </p>
        <label class="block text-base font-medium mb-1.5" style="color: #64748b;">미선발 사유 <span style="color: #ef4444;">*</span></label>
        <input
          v-model="excludeReasonDraft"
          type="text"
          placeholder="미선발 사유를 입력하세요"
          class="text-base w-full"
          style="border: 1px solid #fcd34d; border-radius: 8px; padding: 9px 12px; box-sizing: border-box; outline: none;"
          @keyup.enter="confirmExclude"
        />
        <div class="flex justify-end gap-2 mt-5">
          <button
            class="text-base rounded-lg whitespace-nowrap"
            style="padding: 9px 18px; border: 1px solid #e2e8f0; background: white; color: #64748b; cursor: pointer;"
            @click="showExcludeModal = false"
          >취소</button>
          <button
            class="text-base font-semibold rounded-lg whitespace-nowrap disabled:opacity-40"
            style="padding: 9px 18px; border: none; background: #d97706; color: white; cursor: pointer;"
            :disabled="!excludeReasonDraft.trim() || resultActing"
            @click="confirmExclude"
          >{{ resultActing ? '처리 중...' : '미선발 확정' }}</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 미결정 지원자 안내 모달 -->
  <Teleport to="body">
    <div
      v-if="showUndecidedModal"
      class="fixed inset-0 flex items-center justify-center"
      style="background: rgba(0,0,0,0.35); z-index: 60;"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="bg-white flex flex-col"
        style="border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); width: 100%; max-width: 680px; margin: 0 16px; padding: 1.5rem 1.75rem; max-height: 80vh;"
      >
        <h2 class="text-lg font-semibold mb-1" style="margin: 0; color: #b91c1c;">마감할 수 없습니다</h2>
        <p class="text-base mb-1" style="color: #475569; line-height: 1.6;">
          아래 지원자는 추천도 미선발도 결정되지 않았습니다.<br>
          각 지원자를 추천 확정하거나 미선발 처리한 후 다시 마감하세요.
        </p>
        <p class="text-base font-semibold mb-3" style="color: #1e293b;">총 {{ undecidedList.length }}명</p>
        <div class="overflow-y-auto" style="max-height: 380px;">
          <div class="overflow-x-auto">
            <table class="w-full min-w-max" style="border-collapse: collapse;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0;">
                  <th class="text-base font-semibold text-left" style="padding: 11px 16px; color: #475569; width: 110px;">학년/반</th>
                  <th class="text-base font-semibold text-left" style="padding: 11px 16px; color: #475569; width: 140px;">학번</th>
                  <th class="text-base font-semibold text-left" style="padding: 11px 16px; color: #475569; width: 100px;">이름</th>
                  <th class="text-base font-semibold text-left" style="padding: 11px 16px; color: #475569; width: 150px;">대학</th>
                  <th class="text-base font-semibold text-left" style="padding: 11px 16px; color: #475569; width: 150px;">모집단위</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="u in undecidedList"
                  :key="`${u.student_code}-${u.univ_name}-${u.track_name}`"
                  style="border-bottom: 1px solid #f1f5f9;"
                >
                  <td class="text-base" style="padding: 10px 16px; color: #475569;">{{ u.grade }}학년 {{ u.class_no }}반</td>
                  <td class="text-base font-mono" style="padding: 10px 16px; color: #475569;">{{ u.student_code }}</td>
                  <td class="text-base font-medium" style="padding: 10px 16px; color: #1e293b;">{{ u.student_name }}</td>
                  <td class="text-base" style="padding: 10px 16px; color: #1e293b;">{{ u.univ_name }}</td>
                  <td class="text-base" style="padding: 10px 16px; color: #475569;">{{ u.track_name }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="flex justify-end mt-5">
          <button
            class="text-base font-semibold rounded-lg"
            style="padding: 9px 20px; border: none; background: #2563eb; color: white; cursor: pointer;"
            @click="showUndecidedModal = false"
          >닫기</button>
        </div>
      </div>
    </div>
  </Teleport>
  <!-- 추천 포기 처리 모달 (스캔본 업로드 및 OCR 기능 지원) -->
  <Teleport to="body">
    <div
      v-if="showAdminAbandonModal"
      class="fixed inset-0 flex items-center justify-center bg-black/40"
      style="z-index: 60; backdrop-filter: blur(2px);"
      role="dialog"
      aria-modal="true"
      @keydown.escape="showAdminAbandonModal = false"
    >
      <div
        class="bg-white flex flex-col"
        style="border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); width: 100%; max-width: 480px; margin: 0 16px; padding: 1.5rem 1.75rem;"
      >
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 class="text-base font-bold text-slate-800 m-0">추천 전형 포기 처리</h3>
            <p class="text-[10px] text-slate-400 font-medium m-0 mt-0.5">포기원 PDF 서류를 등록하고 공석을 즉시 반환합니다.</p>
          </div>
          <button
            class="text-lg leading-none text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
            @click="showAdminAbandonModal = false"
          >✕</button>
        </div>

        <div class="space-y-4 text-xs font-semibold text-slate-700">
          <div class="rounded-xl bg-slate-50 p-4 border border-slate-200/60 space-y-2 text-xs">
            <div class="flex justify-between"><span class="text-slate-400 font-semibold">학생 이름:</span> <span class="font-bold text-slate-800">{{ abandonTarget?.name }}</span></div>
            <div class="flex justify-between"><span class="text-slate-400 font-semibold">지원 대학:</span> <span class="font-bold text-slate-800">{{ abandonTarget?.univ_name }}</span></div>
            <div class="flex justify-between"><span class="text-slate-400 font-semibold">지원 전형:</span> <span class="font-bold text-slate-800">{{ abandonTarget?.track_name }}</span></div>
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between mb-1">
              <label class="block text-[10px] font-bold text-slate-500">포기원 PDF 서류 선택 (선택 사항)</label>
              <a
                :href="`${baseUrl}data/2027%ED%95%99%EB%85%84%EB%8F%84%20%ED%95%99%EA%B5%90%EC%9E%A5%EC%B6%94%EC%B2%9C%EC%A0%84%ED%98%95%20%EC%A7%80%EC%9B%90%20%ED%8F%AC%EA%B8%B0%EC%9B%90_%EC%96%91%EC%8B%9D.hwp`"
                download
                class="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
              >
                📝 포기원 양식 (HWP)
              </a>
            </div>
            <input
              type="file"
              accept=".pdf"
              @change="onAbandonFileSelected"
              class="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <!-- AI OCR 판독 알림 배너 -->
          <div v-if="abandonOcrLoading" class="text-[10px] text-blue-600 font-semibold flex items-center gap-1.5 bg-blue-50 p-2 rounded-lg border border-blue-100">
            <span class="animate-spin inline-block w-3.5 h-3.5 border-2 border-blue-600/20 border-t-blue-600 rounded-full"></span>
            AI OCR 실시간 문서 정밀 판독 및 서명 확인 중…
          </div>
          <div v-else-if="abandonOcrWarning" class="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-lg text-[10px] leading-relaxed whitespace-pre-line font-medium">
            ⚠️ <strong>AI OCR 판독 경고 (서류 불일치 가능성):</strong><br>
            {{ abandonOcrWarning }}
          </div>
          <div v-else-if="abandonFile" class="text-[10px] text-emerald-600 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-100">
            ✓ AI OCR 판독 완료: 해당 학생의 서명이 날인된 정상 포기원 문서임이 자동 확인되었습니다.
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-5 border-t border-slate-100 pt-3">
          <button
            class="text-base rounded-lg whitespace-nowrap"
            style="padding: 9px 18px; border: 1px solid #e2e8f0; background: white; color: #64748b; cursor: pointer;"
            @click="showAdminAbandonModal = false"
          >취소</button>
          <button
            class="text-base font-semibold rounded-lg whitespace-nowrap disabled:opacity-40"
            style="padding: 9px 18px; border: none; background: #e11d48; color: white; cursor: pointer;"
            :disabled="resultActing || abandonOcrLoading"
            @click="confirmAbandon"
          >{{ resultActing ? '처리 중...' : (abandonFile ? '포기원 제출 및 확정' : '포기 확정') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, inject } from 'vue'
import { supabase } from '../../utils/supabaseClient.js'
import {
  getRounds, openRound, closeRound, reopenRound, finalizeRound,
  updateRoundStatus,
  calculateScores, getResults, recommendResult, unrecommendResult,
  getApplications, abandonApplication,
  excludeApplication, clearApplicationExclusion,
  getAreas,
  exportResultsExcel,
  exportRoundSummary,
  getQuotaStats,
  autoRecommend,
  autoRecommendUniv,
  blobErrMsg,
  getRoundConfirmationStatus,
  promoteNextEligibleStudent,
  repairCorruptedAbandonSignatures,
} from '../../api/admin.js'
import HelpBox from '../common/HelpBox.vue'
import { dialog } from '../common/dialog.js'
import { roundStatusLabel } from '../../data/roundStatus.js'
import {
  computeRoundDisplayStatus,
  DEFAULT_SCHEDULES,
  normalizeSchedule,
  formatKoreanDateTime,
  formatKoreanDateTimePeriod
} from '../../utils/roundSchedule.js'
import { formatScore } from '../../utils/scorePreviewShared.js'
import { convertPdfToImages, analyzeDocumentWithAI } from '../../utils/ocrParser.js'
import { printAbandonmentForm } from '../../utils/printTemplates.js'

const baseUrl = import.meta.env.BASE_URL || '/'

const HELP_EMPTY = {
  title: '도움말 — 첫 선발 차수 추가 전 확인하세요',
  intro: '선발 차수는 한 번의 추천 진행 단위입니다. 추천 선발을 추가하면 담임교사가 지원자를 등록할 수 있게 됩니다.',
  items: [
    '선발 차수를 추가하기 전에 학급, 학생 명단, 전형요소, 대학 설정이 모두 끝났는지 확인하세요.',
    { text: '특히 전형요소는 선발 차수가 종료된 뒤에는 수정할 수 없으니 반드시 먼저 완성하세요.', warn: true },
    '준비가 끝났으면 "+ 차수 추가"를 누르세요.',
  ],
}

function fmtDt(s) {
  if (!s) return ''
  const d = new Date(s)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const refreshSidebarRound = inject('refreshRound', () => {})
const showAbandonOnly = inject('showAbandonOnly', ref(false))

const rounds   = ref([])
const selected  = ref(null)
const loading   = ref(false)
const view      = ref('apps')
const totalRounds = ref(3) // 1~5, default 3

function formatKoreanDate(dateStr) {
  if (!dateStr) return '일정 미선택'
  return formatKoreanDateTime(dateStr, true)
}

function formatKoreanPeriod(startStr, endStr) {
  return formatKoreanDateTimePeriod(startStr, endStr)
}

function syncEvalDate(sched) {
  if (!sched) return
  if (sched.eval_start) {
    sched.eval_date = sched.eval_start.slice(0, 10)
  }
}

function syncAnnounceDate(sched) {
  if (!sched) return
  if (sched.announce_start) {
    sched.announce_date = sched.announce_start.slice(0, 10)
  }
}

function setWorkingHours(sched, type) {
  if (!sched) return
  const now = new Date()
  const todayStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })

  if (type === 'apply') {
    const startBase = (sched.apply_start || '').slice(0, 10) || todayStr
    const endBase = (sched.apply_end || '').slice(0, 10) || startBase
    sched.apply_start = `${startBase}T09:00`
    sched.apply_end = `${endBase}T18:00`
  } else if (type === 'eval') {
    const startBase = (sched.eval_start || '').slice(0, 10) || (sched.eval_date || '').slice(0, 10) || todayStr
    const endBase = (sched.eval_end || '').slice(0, 10) || startBase
    sched.eval_start = `${startBase}T09:00`
    sched.eval_end = `${endBase}T18:00`
    syncEvalDate(sched)
  } else if (type === 'announce') {
    const startBase = (sched.announce_start || '').slice(0, 10) || (sched.announce_date || '').slice(0, 10) || todayStr
    const endBase = (sched.announce_end || '').slice(0, 10) || startBase
    sched.announce_start = `${startBase}T09:00`
    sched.announce_end = `${endBase}T18:00`
    syncAnnounceDate(sched)
  }
}

function getStatusStyle(status) {
  if (status === 'OPEN') return { background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0' }
  if (status === 'CLOSED') return { background: '#dbeafe', color: '#1d4ed8', borderColor: '#bfdbfe' }
  if (status === 'FINALIZED') return { background: '#f3e8ff', color: '#7c3aed', borderColor: '#e9d5ff' }
  return { background: '#f1f5f9', color: '#64748b', borderColor: '#cbd5e1' }
}


async function onRoundStatusChange(r, newStatus) {
  let dbStatus = newStatus
  if (newStatus === 'DRAFT') {
    dbStatus = 'OPEN'
  }
  try {
    await updateRoundStatus(r.id, dbStatus)
    r.status = dbStatus
    await loadRounds()
    await refreshSidebarRound()
    await dialog.alert({ title: '상태 변경 완료', message: `${r.id}차 선발 상태가 [${roundStatusLabel(newStatus)}] (으)로 변경되었습니다.`, level: 'success' })
  } catch (e) {
    await dialog.alert({ title: '상태 변경 실패', message: e.message, level: 'error' })
  }
}

const schedulesMap = ref({})
const curSchedule = ref({
  apply_start: '',
  apply_end: '',
  eval_start: '',
  eval_end: '',
  eval_date: '',
  announce_start: '',
  announce_end: '',
  announce_date: ''
})

async function loadSchedules() {
  let map = {}
  let existsInDb = false
  if (supabase) {
    try {
      const { data } = await supabase.from('config').select('value').eq('key', 'round_schedules_map').maybeSingle()
      if (data && data.value) {
        try {
          map = JSON.parse(data.value)
          existsInDb = true
        } catch {}
      }
    } catch {}
  }
  if (!existsInDb) {
    const local = localStorage.getItem('round_schedules_map')
    if (local) {
      try {
        map = JSON.parse(local)
        existsInDb = true
      } catch {}
    }
  }

  // 만약 DB와 로컬 스토리지에 둘 다 데이터가 없는 상태라면 DEFAULT_SCHEDULES로 자동 생성
  if (!existsInDb && supabase) {
    try {
      await supabase.from('config').upsert({
        key: 'round_schedules_map',
        value: JSON.stringify(DEFAULT_SCHEDULES)
      }, { onConflict: 'key' })
    } catch (e) {
      console.error('Failed to auto-initialize round_schedules_map:', e)
    }
  }

  const merged = { ...DEFAULT_SCHEDULES, ...map }
  const normalized = {}
  for (const [k, v] of Object.entries(merged)) {
    normalized[k] = normalizeSchedule(v)
  }
  schedulesMap.value = normalized
  updateCurSchedule()
}

// ── 총 선발 회수 로드/저장 ─────────────────────────────
async function loadTotalRounds() {
  if (supabase) {
    try {
      const { data } = await supabase.from('config').select('value').eq('key', 'total_rounds').maybeSingle()
      if (data && data.value) {
        const n = parseInt(data.value, 10)
        if (n >= 1 && n <= 5) totalRounds.value = n
      }
    } catch {}
  }
  const local = localStorage.getItem('total_rounds')
  if (local) {
    const n = parseInt(local, 10)
    if (n >= 1 && n <= 5) totalRounds.value = n
  }
}

async function saveTotalRounds() {
  localStorage.setItem('total_rounds', String(totalRounds.value))
  if (supabase) {
    try {
      await supabase.from('config').upsert({ key: 'total_rounds', value: String(totalRounds.value) }, { onConflict: 'key' })
    } catch (e) { console.warn('total_rounds 저장 실패:', e) }
  }
  await loadRounds()
}

function updateCurSchedule() {
  if (!selected.value) return
  const id = selected.value.id
  const exist = schedulesMap.value[id] || DEFAULT_SCHEDULES[id]
  if (exist) {
    curSchedule.value = { ...normalizeSchedule(exist) }
  } else {
    curSchedule.value = {
      apply_start: '',
      apply_end: '',
      eval_start: '',
      eval_end: '',
      eval_date: '',
      announce_start: '',
      announce_end: '',
      announce_date: ''
    }
  }
}

watch(() => selected.value?.id, () => {
  updateCurSchedule()
})

function getSchedule(id) {
  if (!schedulesMap.value[id]) {
    const exist = DEFAULT_SCHEDULES[id] || {
      apply_start: '',
      apply_end: '',
      eval_start: '',
      eval_end: '',
      eval_date: '',
      announce_start: '',
      announce_end: '',
      announce_date: ''
    }
    schedulesMap.value[id] = { ...normalizeSchedule(exist) }
  }
  return schedulesMap.value[id]
}

async function saveAllSchedules() {
  // 모든 차수 스케줄 정규화 및 레거시 날짜 필드(eval_date, announce_date) 최신 동기화
  const toSave = {}
  for (const [k, v] of Object.entries(schedulesMap.value)) {
    const norm = normalizeSchedule(v)
    if (norm) {
      syncEvalDate(norm)
      syncAnnounceDate(norm)
      toSave[k] = norm
    }
  }
  schedulesMap.value = toSave

  localStorage.setItem('round_schedules_map', JSON.stringify(toSave))
  if (supabase) {
    try {
      await supabase.from('config').upsert({
        key: 'round_schedules_map',
        value: JSON.stringify(toSave)
      }, { onConflict: 'key' })
    } catch (e) {
      console.error(e)
    }
  }

  // 일정을 저장한 후 각 차수의 진행 상태를 날짜 기준에 맞게 강제 업데이트
  if (rounds.value.length > 0) {
    rounds.value = await syncRoundStatuses(rounds.value)
    await refreshSidebarRound()
  }

  await dialog.alert({ title: 'DB 저장 완료', message: '모든 선발 차수 일정(시분초 및 공지기간 포함)과 실시간 진행 상태가 DB에 정상 저장 및 동기화되었습니다.', level: 'success' })
}

async function saveSchedule() {
  if (!selected.value) return
  const id = selected.value.id
  syncEvalDate(curSchedule.value)
  syncAnnounceDate(curSchedule.value)
  schedulesMap.value[id] = { ...normalizeSchedule(curSchedule.value) }
  await saveAllSchedules()
}

const apps    = ref([])
const results = ref([])
const areas   = ref([])

const roundsLoadError    = ref('')
const roundActing        = ref(false)
// 결과 행 단위 조작(추천 확정/취소, 미선발 처리/해제) 공용 진행 플래그.
// 정원 마지막 한 자리에서 두 번 클릭하면 첫 요청은 성공하는데 두 번째가
// 자기 자신을 센 정원 카운트 때문에 409("정원이 이미 찼습니다")를 띄운다.
const resultActing       = ref(false)
const calcLoading        = ref(false)
const calcMsg            = ref(null)
const downloading        = ref(false)
const downloadingSummary = ref(false)
const expandedRows       = ref({})
const quotaStats         = ref(null)
const autoRecommendActing = ref(false)
const autoRecommendResult = ref(null)
const autoRecommendScope  = ref('')

const selectedTrackId   = ref('')
const allTracksInRound  = ref([])     // 필터와 무관한 전체 트랙 목록 (드롭다운용)
const confirmationStatus = ref(null)  // { classes: [...] } | null

const showExcludeModal   = ref(false)
const excludeTarget      = ref(null)   // ResultRow | null
const excludeReasonDraft = ref('')

const showUndecidedModal = ref(false)
const undecidedList      = ref([])

const showAdminAbandonModal = ref(false)
const abandonTarget      = ref(null)
const abandonFile        = ref(null)
const abandonOcrLoading  = ref(false)
const abandonOcrWarning  = ref('')
const openaiKey          = ref('')

function rowKey(r) { return `${r.student_id}-${r.track_id}` }

const hasOpenRound = computed(() => rounds.value.some(r => r.status === 'OPEN' || r.status === 'CLOSED'))

const canAddRound = computed(() => true)

const helpBox = computed(() => {
  if (!selected.value) return null
  const s = getDisplayStatus(selected.value)
  if (s === 'DRAFT') {
    return {
      key: 'rounds-draft',
      title: '도움말 — 접수 시작 전 (대기 중)',
      intro: '현재 선발 차수의 접수 시작 전 단계입니다.',
      items: [
        '설정된 희망자 접수 기간이 되면 자동으로 접수가 시작되어 담임교사가 지원자를 등록할 수 있게 됩니다.',
        '필요한 경우 세부 일정(접수 기간, 협의일, 공지일)을 확인하고 조율하세요.',
      ],
    }
  }
  if (s === 'OPEN') {
    return {
      key: 'rounds-open',
      title: '도움말 — 추천 선발 진행 중',
      intro: '담임교사들이 지원자를 등록하고 있는 단계입니다.',
      items: [
        '모든 담임의 입력이 끝나면 "종료하기"를 눌러 추천 선발을 종료하세요.',
        '추천 선발을 종료하면 담임 입력이 차단되고 모든 지원자의 점수가 자동 계산됩니다.',
        '추천 선발 종료할 때 기초 데이터가 누락되어 점수 계산을 할 수 없는 학생이 있으면 오류 목록이 표시되고 종료되지 않습니다. 해당 학생의 데이터를 채운 뒤 다시 시도하세요.',
      ],
    }
  }
  if (s === 'CLOSED') {
    return {
      key: 'rounds-closed',
      title: '도움말 — 추천 선발 및 확정',
      intro: '모든 지원자의 환산점수 및 석차등급이 계산되어 있습니다.',
      items: [
        '환산점수나 석차등급에 따라 순위와 총점이 실시간으로 반영됩니다.',
        '"자동 추천 확정"을 누르면 모든 모집단위에서 순위에 따라 잔여 정원까지 자동으로 확정됩니다.',
        '학생별로 "추천 확정", "추천 취소", "미선발 처리"를 직접 조작할 수 있습니다.',
        { text: '확정이 완료되면 위의 "마감하기"를 누르세요. 마감하면 결과가 담임교사에게 공개됩니다.', warn: true },
      ],
    }
  }
  return {
    key: 'rounds-finalized',
    title: '도움말 — 마감된 추천 선발',
    intro: '이 추천 선발은 마감되어 결과가 확정되었고 담임교사에게 공개되었습니다.',
    items: [
      '"이 추천 선발 지원자 명단"(지원 학생 전원의 결과)과 "이 추천 선발 현황"(모집단위별 지원·추천·포기·잔여석)을 엑셀로 내려받을 수 있습니다.',
      { text: '추천 확정 학생이 추천을 포기하면 "포기하기"를 눌러 처리하세요. 포기는 되돌릴 수 없습니다.', warn: true },
      '학생의 지원 포기 등으로 빈자리가 생겨 추가 추천이 필요하면 "+ 추천 선발 추가"로 다음 추천 선발을 시작하세요.',
    ],
  }
})

const appsByUniv = computed(() => {
  const map = {}
  for (const app of apps.value) {
    const key = app.univ_name
    if (!map[key]) map[key] = []
    map[key].push(app)
  }
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => {
      if (a.is_enrolled !== b.is_enrolled) return a.is_enrolled ? -1 : 1
      const code = (a.student_code ?? '').localeCompare(b.student_code ?? '')
      if (code !== 0) return code
      return a.track_name.localeCompare(b.track_name, 'ko')
    })
  }

  // 대학명 가나다순 정렬 객체 생성
  const sortedEntries = Object.entries(map).sort(([keyA], [keyB]) => {
    return keyA.localeCompare(keyB, 'ko')
  })
  const sortedMap = {}
  for (const [k, v] of sortedEntries) {
    sortedMap[k] = v
  }
  return sortedMap
})

function appTotalScore(app) {
  const r = results.value.find(r => r.student_id === app.student_id && r.track_id === app.track_id)
  const target = r || app

  const rankText = target?.ranking != null ? `${target.ranking}위` : (r?.ranking != null ? `${r.ranking}위` : '-')
  let scoreText = ''
  const manualScore = target?.manual_score ?? app?.manual_score
  const gpaOverall = target?.gpa_overall ?? app?.gpa_overall

  if (manualScore != null && Number(manualScore) > 0) {
    scoreText = `${formatScore(manualScore)}점`
  } else if (gpaOverall != null && !isNaN(Number(gpaOverall)) && Number(gpaOverall) > 0) {
    scoreText = `${Number(gpaOverall).toFixed(2)}등급`
  } else {
    scoreText = '-'
  }
  
  return `${rankText} (${scoreText})`
}

const tracksInRound = computed(() => allTracksInRound.value)

const trackQuotaMap = computed(() => {
  const map = {}
  if (!quotaStats.value) return map
  for (const u of quotaStats.value.univs) {
    for (const t of u.tracks) {
      map[t.track_id] = {
        univId: u.univ_id,
        univName: u.univ_name,
        unitQuota: t.unit_quota,
        unitUsed: t.unit_used,
        totalQuota: u.total_quota,
        totalUsed: u.total_used,
      }
    }
  }
  return map
})

const rankView = ref('track')

function hasPendingAbandon(r) {
  if (r.abandoned || r.is_abandoned) return true

  if (r.scanned_doc_url) {
    try {
      const parsed = typeof r.scanned_doc_url === 'string' ? JSON.parse(r.scanned_doc_url) : r.scanned_doc_url
      return parsed && parsed.abandon_requested === true
    } catch {}
  }
  return false
}

function isAbandonRequested(r) {
  if (r.abandoned || r.is_abandoned) return false
  if (r.scanned_doc_url) {
    try {
      const parsed = typeof r.scanned_doc_url === 'string' ? JSON.parse(r.scanned_doc_url) : r.scanned_doc_url
      return parsed && parsed.abandon_requested === true
    } catch {}
  }
  return false
}

function sortRoundApplicants(a, b) {
  // 1. 재학생 우선 (재학생 -> 졸업생)
  const aEnrolled = a.is_enrolled !== false
  const bEnrolled = b.is_enrolled !== false
  if (aEnrolled !== bEnrolled) return aEnrolled ? -1 : 1

  // 2. 재학생인 경우 학년, 반, 번호 순
  if (aEnrolled) {
    const gradeDiff = (Number(a.grade) || 0) - (Number(b.grade) || 0)
    if (gradeDiff !== 0) return gradeDiff
    const classDiff = (Number(a.class_no) || 0) - (Number(b.class_no) || 0)
    if (classDiff !== 0) return classDiff
    const seqDiff = (Number(a.seq_no) || 0) - (Number(b.seq_no) || 0)
    if (seqDiff !== 0) return seqDiff
  }

  // 3. 학번/코드 오름차순
  return String(a.student_code || '').localeCompare(String(b.student_code || ''), 'ko', { numeric: true })
}

const resultsByUniv = computed(() => {
  const map = {}
  const source = showAbandonOnly.value ? results.value.filter(hasPendingAbandon) : results.value
  
  // 대학별 전체 지원자 수 사전 집계
  const univAppCount = {}
  for (const r of results.value) {
    univAppCount[r.univ_name] = (univAppCount[r.univ_name] || 0) + 1
  }

  for (const r of source) {
    const key = `${r.univ_name} ${r.track_name}`
    if (!map[key]) {
      const q = trackQuotaMap.value[r.track_id]
      const unitQuota = q?.unitQuota ?? null
      const totalQuota = q?.totalQuota ?? null
      map[key] = {
        univId: q?.univId ?? null,
        univName: r.univ_name,
        trackName: r.track_name,
        trackId: r.track_id,
        unitQuota,
        totalQuota,
        unitUsed: q?.unitUsed ?? 0,
        totalUsed: q?.totalUsed ?? 0,
        remaining: unitQuota != null ? Math.max(0, unitQuota - (q?.unitUsed ?? 0)) : null,
        univRemaining: totalQuota != null ? Math.max(0, totalQuota - (q?.totalUsed ?? 0)) : null,
        univAppliedCount: univAppCount[r.univ_name] || 0,
        gradAllowed: r.grad_allowed,
        results: [],
      }
    }
    map[key].results.push(r)
  }

  // 각 그룹별 학번순 정렬 (재학생 -> 졸업생)
  for (const g of Object.values(map)) {
    g.results.sort(sortRoundApplicants)
  }

  // 대학명 가나다순 -> 모집단위명 가나다순으로 정렬된 정렬 객체 생성
  const sortedEntries = Object.entries(map).sort(([keyA, gA], [keyB, gB]) => {
    const uCmp = (gA.univName || '').localeCompare(gB.univName || '', 'ko')
    if (uCmp !== 0) return uCmp
    return (gA.trackName || '').localeCompare(gB.trackName || '', 'ko')
  })

  const sortedMap = {}
  for (const [k, v] of sortedEntries) {
    sortedMap[k] = v
  }
  return sortedMap
})

const resultsByUnivOnly = computed(() => {
  const map = {}
  const source = showAbandonOnly.value ? results.value.filter(hasPendingAbandon) : results.value
  for (const r of source) {
    const key = r.univ_name
    if (!map[key]) {
      const q = trackQuotaMap.value[r.track_id]
      const totalQuota = q?.totalQuota ?? null
      map[key] = {
        univId: q?.univId ?? null,
        univName: r.univ_name,
        totalQuota,
        totalUsed: q?.totalUsed ?? 0,
        univRemaining: totalQuota != null ? Math.max(0, totalQuota - (q?.totalUsed ?? 0)) : null,
        results: [],
      }
    }
    map[key].results.push(r)
  }
  for (const g of Object.values(map)) {
    g.results.sort(sortRoundApplicants)
  }

  // 대학명 가나다순 정렬 객체 생성
  const sortedEntries = Object.entries(map).sort(([keyA, gA], [keyB, gB]) => {
    return (gA.univName || '').localeCompare(gB.univName || '', 'ko')
  })

  const sortedMap = {}
  for (const [k, v] of sortedEntries) {
    sortedMap[k] = v
  }
  return sortedMap
})

const resultsByView = computed(() => rankView.value === 'track' ? resultsByUniv.value : resultsByUnivOnly.value)

// 대학별 자동 추천 버튼은 대학 단위 동작이다. 모집단위별 보기에서는 그룹이 모집단위마다
// 나뉘므로 각 대학의 첫 그룹에만 노출한다 — 같은 버튼이 모집단위 수만큼 반복되어
// "이 모집단위만 처리"로 오해되는 것을 막는다.
const univAutoButtonKeys = computed(() => {
  const seen = new Set()
  const keys = new Set()
  for (const [key, g] of Object.entries(resultsByView.value)) {
    if (g.univId == null || seen.has(g.univId)) continue
    seen.add(g.univId)
    keys.add(key)
  }
  return keys
})

const tieSet = computed(() => {
  const set = new Set()
  if (rankView.value === 'track') {
    const counts = {}
    for (const r of results.value) {
      if (r.track_rank == null) continue
      const k = `${r.track_id}-${r.round_id}-${r.track_rank}`
      if (!counts[k]) counts[k] = []
      counts[k].push(r)
    }
    for (const rows of Object.values(counts)) {
      if (rows.length > 1) for (const r of rows) set.add(`${r.student_id}-${r.track_id}`)
    }
  } else {
    const counts = {}
    for (const r of results.value) {
      if (r.ranking == null) continue
      const k = `${r.univ_name}-${r.round_id}-${r.ranking}`
      if (!counts[k]) counts[k] = []
      counts[k].push(r)
    }
    for (const rows of Object.values(counts)) {
      if (rows.length > 1) for (const r of rows) set.add(`${r.student_id}-${r.track_id}`)
    }
  }
  return set
})

function getAreaScore(r, areaId) {
  try {
    const detail = typeof r.score_detail === 'string'
      ? JSON.parse(r.score_detail)
      : r.score_detail
    const v = detail[String(areaId)]
    return v !== undefined ? formatScore(v) : '-'
  } catch {
    return '-'
  }
}

function getDisplayStatus(r) {
  if (!r) return 'DRAFT'
  const sched = schedulesMap.value[r.id] || DEFAULT_SCHEDULES[r.id]
  return computeRoundDisplayStatus(r, sched)
}

async function syncRoundStatuses(roundsList) {
  if (!supabase || !roundsList || roundsList.length === 0) return roundsList

  const updatedList = []
  for (const r of roundsList) {
    const sched = schedulesMap.value[r.id] || DEFAULT_SCHEDULES[r.id]
    const calculatedStatus = computeRoundDisplayStatus(r, sched)

    let dbStatus = calculatedStatus
    if (calculatedStatus === 'DRAFT') {
      dbStatus = 'OPEN'
    }

    if (r.status !== dbStatus) {
      try {
        await updateRoundStatus(r.id, dbStatus)
        updatedList.push({ ...r, status: dbStatus })
      } catch (e) {
        console.error(`차수 ${r.id} 진행상태 자동 동기화 실패:`, e)
        updatedList.push(r)
      }
    } else {
      updatedList.push(r)
    }
  }
  return updatedList
}

async function loadRounds() {
  roundsLoadError.value = ''
  try {
    const raw = await getRounds()
    const synced = await syncRoundStatuses(raw)
    // 총 선발 회수(totalRounds.value) 범위 내의 차수만 표시하도록 필터링
    rounds.value = synced.filter(r => r.id <= totalRounds.value)
  } catch (e) {
    rounds.value = []
    roundsLoadError.value = e.response?.data ?? e.message ?? '오류가 발생했습니다'
  }
}

function classLabel(c) {
  if (c.grade === 0 && c.class_no === 0) return '졸업생 담당'
  const base = `${c.grade}학년 ${c.class_no}반`
  return c.teacher_name ? `${base} (${c.teacher_name})` : base
}

async function loadConfirmationStatus() {
  if (!selected.value || getDisplayStatus(selected.value) !== 'OPEN') {
    confirmationStatus.value = null
    return
  }
  try {
    confirmationStatus.value = await getRoundConfirmationStatus(selected.value.id)
  } catch {
    confirmationStatus.value = null
  }
}

async function selectRound(r) {
  selected.value = r
  calcMsg.value = null
  autoRecommendResult.value = null
  autoRecommendScope.value = ''
  confirmationStatus.value = null
  selectedTrackId.value = ''
  allTracksInRound.value = []
  await Promise.all([loadApps(), loadResults(), loadAreas(), loadConfirmationStatus()])
}

async function loadApps() {
  if (!selected.value) return
  apps.value = await getApplications(selected.value.id)
}

async function loadResults() {
  if (!selected.value) return
  const roundId = showAbandonOnly.value ? null : selected.value.id
  ;[results.value, quotaStats.value] = await Promise.all([
    getResults(roundId, selectedTrackId.value || null),
    getQuotaStats(),
  ])
  // 필터 없이 전체 결과를 불러올 때만 드롭다운 목록 갱신
  if (!selectedTrackId.value) {
    const seen = new Set()
    const list = results.value
      .filter(r => { if (seen.has(r.track_id)) return false; seen.add(r.track_id); return true })
      .map(r => ({ id: r.track_id, univ_name: r.univ_name, track_name: r.track_name }))
    list.sort((a, b) => {
      const u = (a.univ_name || '').localeCompare(b.univ_name || '', 'ko')
      if (u !== 0) return u
      return (a.track_name || '').localeCompare(b.track_name || '', 'ko')
    })
    allTracksInRound.value = list
  }
  expandedRows.value = {}
}

function toggleRow(key) {
  const next = { ...expandedRows.value }
  if (next[key]) delete next[key]
  else next[key] = true
  expandedRows.value = next
}

async function loadAreas() {
  areas.value = await getAreas()
}

async function handleOpenRound() {
  if (!(await dialog.confirm({
    title: '선발 차수 추가',
    message: '새 선발 차수를 추가하시겠습니까?\n차수를 추가하면 담임교사의 지원 입력이 시작됩니다.',
    confirmText: '차수 추가',
  }))) return
  loading.value = true
  try {
    await openRound()
    await loadRounds()
    const open = rounds.value.find(r => r.status === 'OPEN')
    if (open) await selectRound(open)
    await refreshSidebarRound()
  } catch (e) {
    await dialog.alert({ title: '오류', message: e.response?.data || e.message, level: 'error' })
  } finally {
    loading.value = false
  }
}

async function handleCloseRound(id) {
  if (roundActing.value) return

  const closeMsg = '선발 차수를 종료하시겠습니까?\n담임교사의 입력이 차단되고, 모든 지원자의 점수가 계산됩니다.\n필요하면 "다시 열기"로 되돌릴 수 있습니다.'

  if (!(await dialog.confirm({
    title: '선발 차수 종료',
    message: closeMsg,
    confirmText: '종료하기',
    level: 'warn',
  }))) return
  roundActing.value = true
  try {
    await closeRound(id)
    await loadRounds()
    if (selected.value?.id === id) {
      const updated = rounds.value.find(r => r.id === id)
      if (updated) selected.value = updated
      await loadResults()
    }
    await refreshSidebarRound()
  } catch (e) {
    await dialog.alert({ title: '오류', message: e.response?.data || e.message, level: 'error' })
  } finally {
    roundActing.value = false
  }
}

async function handleReopenRound(id) {
  if (roundActing.value) return
  if (!(await dialog.confirm({
    title: '선발 차수 다시 열기',
    message: '선발 차수를 다시 여시겠습니까?\n지금까지 확정한 추천 표시가 모두 초기화됩니다.',
    confirmText: '다시 열기',
    level: 'warn',
  }))) return
  roundActing.value = true
  try {
    await reopenRound(id)
    await loadRounds()
    if (selected.value?.id === id) {
      const updated = rounds.value.find(r => r.id === id)
      if (updated) selected.value = updated
      await loadConfirmationStatus()
    }
    await refreshSidebarRound()
  } catch (e) {
    await dialog.alert({ title: '오류', message: e.response?.data || e.message, level: 'error' })
  } finally {
    roundActing.value = false
  }
}

async function handleFinalizeRound(id) {
  if (roundActing.value) return
  if (!(await dialog.confirm({
    title: '선발 차수 마감',
    message: '선발 차수를 마감하시겠습니까?\n추천 확정이 고정되고, 결과가 담임교사에게 공개됩니다.',
    confirmText: '마감하기',
    level: 'danger',
    dangerNotice: '한번 마감된 선발 차수는 절대로 되돌릴 수 없습니다.',
    finalConfirmText: '마감 확정',
  }))) return
  roundActing.value = true
  try {
    await finalizeRound(id)
    await loadRounds()
    if (selected.value?.id === id) {
      const updated = rounds.value.find(r => r.id === id)
      if (updated) selected.value = updated
    }
    await refreshSidebarRound()
  } catch (e) {
    const d = e.response?.data
    if (d != null && typeof d === 'object' && Array.isArray(d.undecided)) {
      if (d.undecided.length === 0) {
        await dialog.alert({ title: '마감할 수 없습니다', message: d.error ?? '미결정 지원자 오류가 발생했습니다', level: 'error' })
      } else {
        undecidedList.value = d.undecided
        showUndecidedModal.value = true
      }
    } else {
      await dialog.alert({ title: '마감할 수 없습니다', message: finalizeErrMsg(e), level: 'error' })
    }
  } finally {
    roundActing.value = false
  }
}

// finalize 422는 JSON 바디 {error, track_violations, univ_violations} — 위반 목록을 사람이 읽을 수 있게 펼친다
function finalizeErrMsg(e) {
  const d = e.response?.data
  if (d != null && typeof d === 'object' && (Array.isArray(d.track_violations) || Array.isArray(d.univ_violations))) {
    const lines = [d.error ?? '정원 초과로 라운드를 확정할 수 없습니다']
    for (const v of d.track_violations ?? []) {
      lines.push(`- ${v.univ_name} ${v.track_name}: 모집단위 정원 ${v.unit_quota}명, 추천 확정 ${v.total_recommended}명`)
    }
    for (const v of d.univ_violations ?? []) {
      lines.push(`- ${v.univ_name} (대학 전체): 정원 ${v.total_quota}명, 추천 확정 ${v.total_recommended}명`)
    }
    return lines.join('\n')
  }
  return typeof d === 'string' ? d : (e.message ?? '오류가 발생했습니다')
}

async function handleCalculate() {
  if (!selected.value) return
  const roundId = selected.value.id
  calcLoading.value = true
  calcMsg.value = null
  try {
    const res = await calculateScores(roundId)
    if (selected.value?.id !== roundId) return
    calcMsg.value = { ok: true, text: `점수 재계산 완료: ${res.calculated}건` }
    await loadResults()
  } catch (e) {
    calcMsg.value = { ok: false, text: e.response?.data || e.message }
  } finally {
    calcLoading.value = false
  }
}

function handleAbandon(app) {
  abandonTarget.value = app
  abandonFile.value = null
  abandonOcrWarning.value = ''
  abandonOcrLoading.value = false
  showAdminAbandonModal.value = true
}

async function onAbandonFileSelected(e) {
  const selectedFile = e.target.files[0]
  if (selectedFile && selectedFile.type === 'application/pdf') {
    abandonFile.value = selectedFile
    if (openaiKey.value) {
      await runAdminAbandonOcr(selectedFile)
    }
  } else {
    await dialog.alert({ title: '오류', message: 'PDF 형식의 포기원 스캔 파일만 선택 가능합니다.', level: 'error' })
    e.target.value = ''
    abandonFile.value = null
    abandonOcrWarning.value = ''
  }
}

async function runAdminAbandonOcr(selectedFile) {
  abandonOcrLoading.value = true
  abandonOcrWarning.value = ''
  try {
    const images = await convertPdfToImages(selectedFile)
    const analysis = await analyzeDocumentWithAI(images, openaiKey.value)

    const nameMatch = analysis.student_name ? analysis.student_name.includes(abandonTarget.value.name) : false
    const codeMatch = analysis.student_code ? String(analysis.student_code).includes(abandonTarget.value.student_code) : false
    const isAbandonForm = analysis.document_type === '포기원'

    const warnings = []
    if (!isAbandonForm) {
      warnings.push('- 업로드된 문서가 "포기원" 양식이 아닌 것으로 판독되었습니다.')
    }
    if (!nameMatch) {
      warnings.push(`- 문서의 학생 이름(${analysis.student_name || '인식불가'})이 신청자 이름(${abandonTarget.value.name})과 일치하지 않습니다.`)
    }
    if (!codeMatch) {
      warnings.push(`- 문서의 학번(${analysis.student_code || '인식불가'})이 신청자 학번(${abandonTarget.value.student_code})과 일치하지 않습니다.`)
    }
    if (analysis.is_signed === false) {
      warnings.push('- 문서 내에 날인 혹은 자필 서명이 확인되지 않았습니다.')
    }

    if (warnings.length > 0) {
      abandonOcrWarning.value = warnings.join('\n')
    }
  } catch (e) {
    console.error('OCR Validation failure: ', e)
  } finally {
    abandonOcrLoading.value = false
  }
}

async function confirmAbandon() {
  if (resultActing.value) return
  if (!abandonTarget.value) return

  let confirmMsg = '정말로 이 지원자의 학교장추천 선정을 포기 처리하시겠습니까? 정원 공석은 즉시 반환됩니다.'
  if (!abandonFile.value) {
    confirmMsg = '⚠️ 포기원 PDF 서류 파일이 등록되지 않았습니다.\n(서류 파일 없이 직권으로 포기 처리를 진행합니다.)\n\n정말로 이 지원자의 학교장추천 선정을 포기 처리하시겠습니까?'
  } else if (abandonOcrWarning.value) {
    confirmMsg = `⚠️ AI 판독 경고가 존재합니다:\n${abandonOcrWarning.value}\n\n정말로 이 파일로 포기 처리를 강행하시겠습니까?`
  }
  
  if (!(await dialog.confirm({
    title: '지원 포기 확정',
    message: confirmMsg,
    confirmText: '포기 확정',
    level: 'danger'
  }))) return

  resultActing.value = true
  try {
    const studentId = abandonTarget.value.student_id
    const trackId = abandonTarget.value.track_id
    const roundId = abandonTarget.value.round_id

    let publicUrl = null
    if (abandonFile.value) {
      const path = `abandoned_${studentId}_r${roundId}_u_${trackId}.pdf`
      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(path, abandonFile.value, { contentType: 'application/pdf', upsert: true })

      if (uploadErr) throw new Error('포기원 PDF 업로드에 실패했습니다: ' + uploadErr.message)
      publicUrl = supabase.storage.from('documents').getPublicUrl(path).data.publicUrl
    }

    await abandonApplication(studentId, trackId, roundId, publicUrl)

    // 차순위 승계 처리 수행
    let successionMsg = ''
    try {
      const nextStudent = await promoteNextEligibleStudent(trackId, roundId)
      if (nextStudent) {
        successionMsg = `\n\n🎉 [차순위 승계 알림]\n- 대학: ${nextStudent.univ_name} ${nextStudent.track_name}\n- 차순위 후보인 ${nextStudent.name} (${nextStudent.student_code}) 학생이 새롭게 추천 후보명단에 자동 등록되었습니다.`
      }
    } catch (e) {
      console.warn('Succession error:', e)
    }

    showAdminAbandonModal.value = false
    await Promise.all([loadApps(), loadResults()])
    await dialog.alert({ title: '성공', message: '포기 처리가 완료되었습니다.' + successionMsg, level: 'success' })
  } catch (e) {
    await dialog.alert({ title: '오류', message: e.message || '포기 처리 도중 오류가 발생했습니다.', level: 'error' })
  } finally {
    resultActing.value = false
  }
}

async function handleApproveAbandon(r) {
  let docUrl = null
  if (r.scanned_doc_url) {
    try {
      const parsed = typeof r.scanned_doc_url === 'string' ? JSON.parse(r.scanned_doc_url) : r.scanned_doc_url
      if (parsed && parsed.doc_url) {
        docUrl = parsed.doc_url
      }
    } catch {}
  }

  if (!(await dialog.confirm({
    title: '추천 포기 승인',
    message: `${r.name} 학생의 ${r.univ_name} ${r.track_name} 추천 포기 신청을 승인하시겠습니까?`,
    confirmText: '포기 승인',
    level: 'danger',
    dangerNotice: '승인하면 해당 추천 기회가 취소되며 공석이 반환됩니다. 이 작업은 되돌릴 수 없습니다.',
    finalConfirmText: '승인 확정',
  }))) return

  resultActing.value = true
  try {
    await abandonApplication(r.student_id, r.track_id, r.round_id, docUrl)

    // 차순위 승계 처리 수행
    let successionMsg = ''
    try {
      const nextStudent = await promoteNextEligibleStudent(r.track_id, r.round_id)
      if (nextStudent) {
        successionMsg = `\n\n🎉 [차순위 승계 알림]\n- 대학: ${nextStudent.univ_name} ${nextStudent.track_name}\n- 차순위 후보인 ${nextStudent.name} (${nextStudent.student_code}) 학생이 새롭게 추천 후보명단에 자동 등록되었습니다.`
      }
    } catch (e) {
      console.warn('Succession error:', e)
    }

    await Promise.all([loadApps(), loadResults()])
    await dialog.alert({ title: '성공', message: '포기 처리가 완료되었습니다.' + successionMsg, level: 'success' })
  } catch (e) {
    await dialog.alert({ title: '오류', message: e.message || '포기 처리 도중 오류가 발생했습니다.', level: 'error' })
  } finally {
    resultActing.value = false
  }
}

function handlePrintAbandon(r) {
  printAbandonmentForm(r)
}

function startExclude(r) {
  excludeTarget.value = r
  excludeReasonDraft.value = ''
  showExcludeModal.value = true
}

async function confirmExclude() {
  if (resultActing.value) return
  const r = excludeTarget.value
  if (!r) return
  const reason = excludeReasonDraft.value.trim()
  if (!reason) return
  resultActing.value = true
  try {
    await excludeApplication(r.student_id, r.track_id, r.round_id, reason)
    showExcludeModal.value = false
    await loadResults()
  } catch (e) {
    await dialog.alert({ title: '오류', message: e.response?.data || e.message, level: 'error' })
  } finally {
    resultActing.value = false
  }
}

async function handleClearExclusion(r) {
  if (resultActing.value) return
  if (!(await dialog.confirm({
    title: '미선발 해제',
    message: `${r.name} 학생의 미선발 처리를 해제하시겠습니까?`,
    confirmText: '해제',
    level: 'warn',
  }))) return
  resultActing.value = true
  try {
    await clearApplicationExclusion(r.student_id, r.track_id, r.round_id)
    await loadResults()
  } catch (e) {
    await dialog.alert({ title: '오류', message: e.response?.data || e.message, level: 'error' })
  } finally {
    resultActing.value = false
  }
}

async function downloadExcel() {
  if (!selected.value) return
  downloading.value = true
  try {
    const res = await exportResultsExcel(selected.value.id)
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `round_${selected.value.id}_applicants.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    await dialog.alert({ title: '다운로드 실패', message: await blobErrMsg(e), level: 'error' })
  } finally {
    downloading.value = false
  }
}

async function downloadSummary() {
  if (!selected.value) return
  downloadingSummary.value = true
  try {
    const res = await exportRoundSummary(selected.value.id)
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `round_${selected.value.id}_summary.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    await dialog.alert({ title: '다운로드 실패', message: await blobErrMsg(e), level: 'error' })
  } finally {
    downloadingSummary.value = false
  }
}

const AUTO_RECOMMEND_NOTE =
  '모집단위 정원까지 순위순으로 채운 뒤, 대학 정원이 있으면 대학 전체 순위로 상위까지만 남깁니다.\n'
  + '동점이 정원 경계를 가르는 지점은 자동 확정하지 않고 수동 확인 목록으로 알려드립니다.'

async function handleAutoRecommend() {
  if (!selected.value) return
  if (!(await dialog.confirm({
    title: '자동 추천 확정',
    message: `모든 대학에 대해 추천을 자동 확정할까요?\n${AUTO_RECOMMEND_NOTE}`,
    confirmText: '자동 확정',
  }))) return
  await runAutoRecommend(() => autoRecommend(selected.value.id), '전체 대학')
}

async function handleAutoRecommendUniv(group) {
  if (!selected.value || group.univId == null) return
  if (!(await dialog.confirm({
    title: '이 대학 자동 추천',
    message: `${group.univName}의 모집단위만 자동 확정할까요?\n${AUTO_RECOMMEND_NOTE}`,
    confirmText: '자동 확정',
  }))) return
  await runAutoRecommend(
    () => autoRecommendUniv(selected.value.id, group.univId),
    group.univName,
  )
}

async function runAutoRecommend(call, scopeLabel) {
  autoRecommendActing.value = true
  autoRecommendResult.value = null
  autoRecommendScope.value = ''
  try {
    const res = await call()
    autoRecommendResult.value = res
    autoRecommendScope.value = scopeLabel
    await loadResults()
  } catch (e) {
    await dialog.alert({ title: '오류', message: e.response?.data || e.message, level: 'error' })
  } finally {
    autoRecommendActing.value = false
  }
}

async function handleRecommend(r) {
  if (resultActing.value) return
  resultActing.value = true
  try {
    await recommendResult(r.student_id, r.track_id, r.round_id)
    await loadResults()
  } catch (e) {
    await dialog.alert({ title: '오류', message: e.response?.data || e.message, level: 'error' })
  } finally {
    resultActing.value = false
  }
}

async function handleUnrecommend(r) {
  if (resultActing.value) return
  if (!(await dialog.confirm({
    title: '추천 취소',
    message: `${r.name} 학생의 추천을 취소하시겠습니까?`,
    confirmText: '추천 취소',
    level: 'warn',
  }))) return
  resultActing.value = true
  try {
    await unrecommendResult(r.student_id, r.track_id, r.round_id)
    await loadResults()
  } catch (e) {
    await dialog.alert({ title: '오류', message: e.response?.data || e.message, level: 'error' })
  } finally {
    resultActing.value = false
  }
}

function getLatestReachedRound() {
  if (rounds.value.length === 0) return null
  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
  let latest = null
  for (const r of rounds.value) {
    const sched = schedulesMap.value[r.id] || DEFAULT_SCHEDULES[r.id]
    if (sched && sched.apply_start && todayStr >= sched.apply_start) {
      if (!latest || r.id > latest.id) {
        latest = r
      }
    }
  }
  return latest || rounds.value[0]
}

watch(showAbandonOnly, async () => {
  if (rounds.value.length > 0) {
    const targetRound = selected.value || getLatestReachedRound()
    if (targetRound) {
      await selectRound(targetRound)
    }
  }
})

onMounted(async () => {
  try {
    repairCorruptedAbandonSignatures().catch(() => {})
  } catch (e) {}
  await loadSchedules()
  await loadTotalRounds()
  await loadRounds()
  
  if (showAbandonOnly.value && rounds.value.length > 0) {
    const targetRound = getLatestReachedRound()
    if (targetRound) {
      await selectRound(targetRound)
    }
  }

  if (supabase) {
    try {
      const { data } = await supabase.from('config').select('value').eq('key', 'openai_api_key').single()
      if (data) {
        openaiKey.value = data.value
      }
    } catch (e) {}
  }
})
</script>
