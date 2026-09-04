<template>
  <div style="padding: 2rem 2.5rem;">

    <!-- 페이지 헤더 -->
    <div class="mb-6">
      <p class="text-base mb-1" style="color: #94a3b8;">관리자</p>
      <h1 class="text-2xl font-semibold" style="color: #1e293b; margin: 0;">개요</h1>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="text-base text-center" style="padding: 60px 0; color: #94a3b8;">
      불러오는 중…
    </div>

    <!-- 오류 -->
    <div v-else-if="error" class="rounded-xl text-base"
      style="padding: 16px 20px; background: #fef2f2; color: #ef4444;">
      {{ error }}
    </div>

    <!-- 본문 -->
    <div v-else-if="data" class="flex flex-col gap-4">

      <!-- ① 앱 정보 -->
      <div class="rounded-xl flex flex-wrap items-center justify-between gap-4" style="padding: 20px 24px; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);">
        <div>
          <p class="text-xl font-bold" style="color: #0f172a; margin: 0;">학교장추천전형 시스템</p>
        </div>
        <div class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-slate-600 font-semibold">
          <span>📅 <strong>2027 수시 원서 접수 기간</strong>:</span>
          <span class="font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">{{ susiApplyPeriodDisplay }}</span>
        </div>
      </div>

      <!-- 라운드 시작 전 준비 체크리스트 -->
      <div v-if="!data.round && checklist" class="rounded-xl"
           style="padding: 20px 24px; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);">
        <SectionLabel title="첫 번째 추천 선발 시작 전 준비 체크리스트" />

        <div class="flex flex-col gap-2">
          <div
              v-for="item in checklist"
              :key="item.key"
              class="flex items-center gap-3 rounded-lg flex-wrap"
              style="padding: 12px 16px;"
              :style="{ background: item.count > 0 ? '#f0fdf4' : '#fef2f2' }"
          >
            <CheckCircle2 v-if="item.count > 0" :size="20" style="color: #16a34a;" class="shrink-0" />
            <XCircle v-else :size="20" style="color: #ef4444;" class="shrink-0" />
            <div class="min-w-0">
              <p class="text-base font-semibold" style="margin: 0;"
                 :style="{ color: item.count > 0 ? '#15803d' : '#b91c1c' }">
                {{ item.label }}
                <span class="font-normal">— {{ item.count > 0 ? `${item.count}${item.unit} 등록됨` : '아직 등록되지 않음' }}</span>
              </p>
              <p class="text-base" style="margin: 2px 0 0; color: #94a3b8;">{{ item.desc }}</p>
            </div>
            <button
                v-if="item.count === 0"
                class="flex items-center gap-1 text-base font-medium rounded-lg ml-auto shrink-0"
                style="padding: 7px 14px; border: none; background: #2563eb; color: white; cursor: pointer;"
                @click="setActiveTab(item.tab)"
            >설정하러 가기 <ArrowRight :size="15" /></button>
            <button
                v-else
                class="flex items-center gap-1 text-base rounded-lg ml-auto shrink-0"
                style="padding: 7px 14px; border: 1px solid #e2e8f0; background: white; color: #64748b; cursor: pointer;"
                @click="setActiveTab(item.tab)"
            >보기 <ArrowRight :size="15" /></button>
          </div>
        </div>

        <!-- 전부 완료 시 -->
        <div v-if="allReady" class="flex items-center gap-3 rounded-lg mt-3 flex-wrap"
             style="padding: 12px 16px; background: #eff6ff; border: 1px solid #bfdbfe;">
          <p class="text-base font-semibold" style="margin: 0; color: #1d4ed8;">
            모든 준비가 끝났습니다. 이제 첫 번째 추천 선발을 개시하여 담임교사의 입력을 시작할 수 있습니다.
          </p>
          <button
              class="flex items-center gap-1 text-base font-semibold rounded-lg ml-auto shrink-0"
              style="padding: 7px 14px; border: none; background: #2563eb; color: white; cursor: pointer;"
              @click="setActiveTab('rounds')"
          >추천 선발 관리로 이동 <ArrowRight :size="15" /></button>
        </div>
      </div>

      <HelpBox
          v-if="helpBox"
          :key="helpBox.key"
          :storage-key="helpBox.key"
          :title="helpBox.title"
          :intro="helpBox.intro"
          :items="helpBox.items"
      />

      <!-- ③ 현재 라운드 및 차수 선택 -->
      <div class="rounded-xl" style="padding: 20px 24px; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);">
        <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
          <SectionLabel title="추천 선발 현황" />

          <!-- 다차수일 때 차수 선택 탭 버튼 -->
          <div v-if="totalRounds > 1" class="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 flex-wrap">
            <button
              v-for="rId in totalRounds"
              :key="rId"
              type="button"
              @click="handleSelectRound(rId)"
              class="px-3.5 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer border-none flex items-center gap-1.5"
              :class="currentViewingRoundId === rId
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 bg-transparent'"
            >
              <span>{{ rId }}차 선발</span>
              <span
                class="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                :style="getRoundBadgeStyle(rId)"
              >
                {{ getRoundStatusText(rId) }}
              </span>
            </button>
          </div>
        </div>

        <div v-if="data.round" class="flex items-center gap-3 flex-wrap">
          <span class="text-3xl font-bold" style="color: #1e293b;">
            {{ totalRounds === 1 ? '추천 선발' : `${data.round.id}차 추천 선발` }}
          </span>
          <span
            class="text-base font-semibold"
            style="padding: 4px 14px; border-radius: 999px;"
            :style="effectiveRoundStatus === 'OPEN'
              ? { background: '#dcfce7', color: '#15803d' }
              : effectiveRoundStatus === 'FINALIZED'
              ? { background: '#f3e8ff', color: '#7e22ce' }
              : effectiveRoundStatus === 'CLOSED'
              ? { background: '#dbeafe', color: '#1d4ed8' }
              : { background: '#fef9c3', color: '#a16207' }"
          >
            {{ roundStatusLabel(effectiveRoundStatus) }}
          </span>
          <span v-if="data.round.opened_at" class="text-base ml-auto" style="color: #94a3b8;">
            접수 시작일 {{ data.round.opened_at.slice(0, 10) }}
          </span>
        </div>
        <div v-else class="flex items-center justify-between">
          <p class="text-base" style="color: #94a3b8;">조회된 추천 선발 데이터가 없습니다.</p>
        </div>
      </div>

      <!-- ④ 학급별 지원자 현황 (라운드 있을 때만) -->
      <template v-if="data.round">
        <div class="rounded-xl overflow-hidden flex flex-col" style="min-height: 200px; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);">
          <div class="flex items-center justify-between flex-wrap gap-2" style="padding: 20px 24px 0;">
            <SectionLabel :title="totalRounds === 1 ? '학급별 지원자 현황' : `${currentViewingRoundId}차 추천 선발 · 학급별 지원자 현황`" />
            <div class="flex items-center gap-2 mb-4 flex-wrap">
              <span class="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-full border border-blue-100 flex items-center gap-1">
                💡 학급 행을 클릭하면 지원자 상세 명단을 확인할 수 있습니다
              </span>
              <button
                class="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer border-none disabled:opacity-50"
                title="전체 학급의 지원자 대장을 반별로 자동 분할하여 일괄 인쇄합니다"
                :disabled="allClassesPrintLoading"
                @click="handlePrintAllClasses(true)"
              >
                <RefreshCw v-if="allClassesPrintLoading" :size="13" class="animate-spin text-white" />
                <Printer v-else :size="13" />
                <span>{{ allClassesPrintLoading ? '전체 데이터 불러오는 중…' : '전체 학급 대장 일괄 인쇄' }}</span>
              </button>
            </div>
          </div>

          <div v-if="data.classes.length === 0" class="flex-1 flex items-center justify-center text-base" style="color: #94a3b8;">
            등록된 학급이 없습니다.
          </div>

          <div v-else class="flex flex-col lg:flex-row gap-6" style="padding: 0 24px 20px;">
            <!-- 요약 카드 (lg 미만: 표 위에 가로 배치 / lg 이상: 표 오른쪽에 세로 배치) -->
            <div class="flex flex-col md:flex-row lg:flex-col gap-3 lg:justify-center lg:order-last" style="min-width: 140px;">
              <div class="flex-1 lg:flex-none rounded-xl text-center" style="padding: 16px; background: #f8fafc;">
                <p class="text-2xl font-bold" style="color: #1e293b;">{{ totalApplicants }}명</p>
                <p class="text-base mt-0.5" style="color: #94a3b8;">총 지원자</p>
              </div>
              <div class="flex-1 lg:flex-none rounded-xl text-center"
                :style="zeroClassCount > 0
                  ? { padding: '16px', background: '#fef2f2' }
                  : { padding: '16px', background: '#f0fdf4' }"
              >
                <p class="text-2xl font-bold" :style="zeroClassCount > 0 ? { color: '#ef4444' } : { color: '#16a34a' }">
                  {{ zeroClassCount }}개
                </p>
                <p class="text-base mt-0.5" :style="zeroClassCount > 0 ? { color: '#f87171' } : { color: '#4ade80' }">
                  미입력 학급
                </p>
              </div>
            </div>

            <!-- 테이블 -->
            <div class="flex-1 rounded-xl overflow-hidden" style="border: 1px solid #e2e8f0;">
              <div class="overflow-x-auto">
              <table class="w-full" style="border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th class="text-base font-semibold text-left" style="padding: 14px 20px; color: #475569;">학급</th>
                    <th class="text-base font-semibold text-left" style="padding: 14px 20px; color: #475569;">담임</th>
                    <th class="text-base font-semibold text-right" style="padding: 14px 20px; color: #475569;">지원자 수</th>
                    <th class="text-base font-semibold text-center w-20" style="padding: 14px 16px; color: #475569;">인쇄</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="c in data.classes"
                    :key="`${c.grade}-${c.class_no}`"
                    style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;"
                    :style="c.submitted === 0 ? { background: '#fef2f2' } : {}"
                    class="hover:bg-blue-50/70 cursor-pointer group"
                    @click="openClassDetailModal(c)"
                  >
                    <td class="text-base font-semibold flex items-center gap-1.5" style="padding: 14px 20px; color: #1e293b;">
                      <span class="group-hover:text-blue-600 transition-colors">{{ c.grade }}학년 {{ c.class_no }}반</span>
                      <ArrowRight :size="14" class="text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5" />
                    </td>
                    <td class="text-base" style="padding: 14px 20px; color: #475569;">
                      {{ c.teacher_name ?? '—' }}
                    </td>
                    <td class="text-base text-right" style="padding: 14px 20px;">
                      <span v-if="c.submitted === 0" class="flex items-center justify-end gap-1 font-bold" style="color: #ef4444;">
                        <AlertTriangle :size="16" />
                        0명
                      </span>
                      <span v-else class="font-semibold group-hover:text-blue-600" style="color: #1e293b;">{{ c.submitted }}명</span>
                    </td>
                    <td class="text-center" style="padding: 14px 16px;" @click.stop>
                      <button
                        class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 hover:text-blue-600 text-slate-500 transition-all shadow-sm cursor-pointer"
                        :title="`${c.grade}학년 ${c.class_no}반 지원현황 인쇄`"
                        :disabled="directPrintLoadingKey === `${c.grade}-${c.class_no}-false`"
                        @click="handleDirectPrintClass(c, false, $event)"
                      >
                        <RefreshCw v-if="directPrintLoadingKey === `${c.grade}-${c.class_no}-false`" :size="15" class="animate-spin text-blue-500" />
                        <Printer v-else :size="15" />
                      </button>
                    </td>
                  </tr>
                  <!-- 졸업생 행 -->
                  <tr
                    v-if="data.graduated"
                    style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;"
                    :style="data.graduated.submitted === 0 ? { background: '#fef2f2' } : {}"
                    class="hover:bg-blue-50/70 cursor-pointer group"
                    @click="openClassDetailModal(data.graduated, true)"
                  >
                    <td class="text-base font-semibold flex items-center gap-1.5" style="padding: 14px 20px; color: #1e293b;">
                      <span class="group-hover:text-blue-600 transition-colors">졸업생 담당</span>
                      <ArrowRight :size="14" class="text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5" />
                    </td>
                    <td class="text-base" style="padding: 14px 20px; color: #475569;">{{ data.graduated.teacher_name ?? '관리자' }}</td>
                    <td class="text-base text-right" style="padding: 14px 20px;">
                      <span v-if="data.graduated.submitted === 0" class="flex items-center justify-end gap-1 font-bold" style="color: #ef4444;">
                        <AlertTriangle :size="16" />
                        0명
                      </span>
                      <span v-else class="font-semibold group-hover:text-blue-600" style="color: #1e293b;">{{ data.graduated.submitted }}명</span>
                    </td>
                    <td class="text-center" style="padding: 14px 16px;" @click.stop>
                      <button
                        class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 hover:text-blue-600 text-slate-500 transition-all shadow-sm cursor-pointer"
                        title="졸업생 지원현황 인쇄"
                        :disabled="directPrintLoadingKey === `0-0-true`"
                        @click="handleDirectPrintClass(data.graduated, true, $event)"
                      >
                        <RefreshCw v-if="directPrintLoadingKey === `0-0-true`" :size="15" class="animate-spin text-blue-500" />
                        <Printer v-else :size="15" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </div>

        <!-- ⑤ 모집단위별 지원 현황 -->
        <div class="rounded-xl overflow-hidden flex flex-col" style="min-height: 200px; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);">
          <div style="padding: 20px 24px 0;">
            <SectionLabel :title="totalRounds === 1 ? '모집단위별 지원 현황' : '이번 추천 선발 · 모집단위별 지원 현황'" />
          </div>

          <div v-if="!data.universities || data.universities.length === 0" class="flex-1 flex items-center justify-center text-base" style="color: #94a3b8;">
            등록된 대학·모집단위가 없습니다.
          </div>

          <div v-else class="rounded-xl overflow-hidden" style="margin: 0 24px 20px; border: 1px solid #e2e8f0;">
            <div class="overflow-x-auto">
            <table class="w-full" style="border-collapse: collapse;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <th style="width: 70px; min-width: 70px; padding: 14px 12px; text-align: center;"></th>
                  <th class="text-base font-semibold text-left" style="padding: 14px 20px; color: #475569;">모집단위</th>
                  <th class="text-base font-semibold text-left" style="padding: 14px 20px; color: #475569;">지원자 / 정원</th>
                  <th class="text-base font-semibold text-right" style="padding: 14px 20px; color: #475569;">현황</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="univ in data.universities" :key="univ.univ_id">
                  <!-- 대학 헤더 행 -->
                  <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <td colspan="4" style="padding: 12px 20px;">
                      <span class="text-base font-bold" style="color: #1e293b;">{{ univ.univ_name }}</span>
                      <span v-if="univ.total_quota !== null" class="text-base ml-3" style="color: #64748b;">
                        총 정원 {{ univ.total_quota }}명
                        <template v-if="totalRounds > 1 && data.round && data.round.id > 1">
                          <span class="text-xs text-slate-500 font-medium ml-1.5">
                            (이전 확정 {{ univ.prior_total_used || 0 }}명 / 이번 잔여 {{ univ.available_total_quota != null ? univ.available_total_quota + '명' : '제한없음' }})
                          </span>
                        </template>
                      </span>
                      <span v-if="univ.tracks.length === 0" class="text-base ml-3" style="color: #94a3b8;">
                        (모집단위 없음)
                      </span>
                    </td>
                  </tr>
                  <!-- 모집단위 행 -->
                  <tr
                    v-for="track in univ.tracks"
                    :key="track.track_id"
                    class="hover:bg-slate-50"
                    style="border-bottom: 1px solid #f1f5f9; transition: background 0.1s;"
                  >
                    <!-- 파이 차트 or 무제한 표시 -->
                    <td style="padding: 14px 12px; width: 70px; min-width: 70px; text-align: center;">
                      <template v-if="getTrackEffectiveQuota(track) != null">
                        <MiniPie
                          v-if="getTrackEffectiveQuota(track) > 0"
                          :filled="track.applicants || 0"
                          :total="getTrackEffectiveQuota(track)"
                          :size="20"
                        />
                        <span v-else class="text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 whitespace-nowrap inline-block">
                          0명
                        </span>
                      </template>
                      <span v-else class="text-base font-semibold" style="color: #94a3b8;">∞</span>
                    </td>
                    <!-- 모집단위명 -->
                    <td class="text-base" style="padding: 14px 20px; color: #1e293b;">{{ track.track_name }}</td>
                    <!-- 지원자/정원 -->
                    <td class="text-base tabular-nums" style="padding: 14px 20px;">
                      <template v-if="track.unit_quota !== null">
                        <!-- 2차 이상일 때 (이전 차수 확정 인원 반영) -->
                        <template v-if="totalRounds > 1 && data.round && data.round.id > 1">
                          <span class="font-semibold"
                            :style="(getTrackEffectiveQuota(track) === 0 || track.applicants >= getTrackEffectiveQuota(track)) ? { color: '#ef4444' } : { color: '#1e293b' }">
                            {{ track.applicants }}
                          </span>
                          <span style="color: #cbd5e1;"> / </span>
                          <span style="color: #475569;">
                            {{ getTrackEffectiveQuota(track) }}명
                            <span class="text-xs text-slate-400 font-normal ml-1">
                              (총 {{ track.unit_quota }}명<template v-if="track.prior_used > 0">, 기확정 {{ track.prior_used }}명</template>)
                            </span>
                          </span>
                        </template>
                        <!-- 1차 또는 단일 차수일 때 -->
                        <template v-else>
                          <span class="font-semibold"
                            :style="track.applicants >= track.unit_quota ? { color: '#ef4444' } : { color: '#1e293b' }">
                            {{ track.applicants }}
                          </span>
                          <span style="color: #cbd5e1;"> / </span>
                          <span style="color: #475569;">{{ track.unit_quota }}명</span>
                        </template>
                      </template>
                      <span v-else class="font-semibold" style="color: #1e293b;">{{ track.applicants }}명</span>
                    </td>
                    <!-- 현황 배지 -->
                    <td class="text-right" style="padding: 14px 20px;">
                      <template v-if="track.unit_quota !== null">
                        <!-- 2차 이상일 때 -->
                        <template v-if="totalRounds > 1 && data.round && data.round.id > 1">
                          <span v-if="getTrackEffectiveQuota(track) === 0 && track.applicants > 0"
                            class="text-base font-semibold"
                            style="padding: 3px 12px; border-radius: 999px; background: #fef2f2; color: #ef4444;">
                            마감 ({{ track.applicants }}명 초과)
                          </span>
                          <span v-else-if="getTrackEffectiveQuota(track) === 0"
                            class="text-base font-semibold"
                            style="padding: 3px 12px; border-radius: 999px; background: #fef2f2; color: #ef4444;">
                            마감 (이전 선발 확정)
                          </span>
                          <span v-else-if="track.applicants >= getTrackEffectiveQuota(track)"
                            class="text-base font-semibold"
                            style="padding: 3px 12px; border-radius: 999px; background: #fef2f2; color: #ef4444;">
                            마감
                          </span>
                          <span v-else-if="track.applicants === 0"
                            class="text-base font-semibold"
                            style="padding: 3px 12px; border-radius: 999px; background: #f1f5f9; color: #64748b;">
                            미지원 ({{ getTrackEffectiveQuota(track) }}자리 남음)
                          </span>
                          <span v-else class="text-base" style="color: #64748b;">
                            {{ getTrackEffectiveQuota(track) - track.applicants }}자리 남음
                          </span>
                        </template>
                        <!-- 1차 또는 단일 차수일 때 -->
                        <template v-else>
                          <span v-if="track.applicants >= track.unit_quota"
                            class="text-base font-semibold"
                            style="padding: 3px 12px; border-radius: 999px; background: #fef2f2; color: #ef4444;">
                            마감
                          </span>
                          <span v-else-if="track.applicants === 0"
                            class="text-base font-semibold"
                            style="padding: 3px 12px; border-radius: 999px; background: #f1f5f9; color: #64748b;">
                            미지원
                          </span>
                          <span v-else class="text-base" style="color: #64748b;">
                            {{ track.unit_quota - track.applicants }}자리 남음
                          </span>
                        </template>
                      </template>
                      <span v-else
                        class="text-base font-semibold"
                        style="padding: 3px 12px; border-radius: 999px; background: #f1f5f9; color: #64748b;">
                        무제한
                      </span>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </template>

      <!-- ⑥ 전체 누적 통계 (항상 표시) -->
      <div class="rounded-xl" style="padding: 20px 24px; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);">
        <SectionLabel title="전체 누적 통계" />
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div v-for="stat in allTimeStats" :key="stat.label"
            class="rounded-xl text-center flex flex-col justify-center"
            style="padding: 18px 12px; background: #f8fafc;">
            <p class="text-xl sm:text-2xl font-bold" style="color: #1e293b;" :title="stat.value">{{ stat.value }}</p>
            <p class="text-base mt-0.5" style="color: #94a3b8;">{{ stat.label }}</p>
          </div>
        </div>
      </div>

    </div>

    <!-- ── 학급별 지원자 현황 상세 모달 ── -->
    <Teleport to="body">
      <div
        v-if="classModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);"
        @click.self="classModalOpen = false"
        @keydown.escape="classModalOpen = false"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-4xl max-h-[88vh] border border-slate-200"
        >
          <!-- 모달 헤더 -->
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shadow-sm">
                <Users :size="20" />
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-lg font-bold text-slate-800 m-0">
                    <template v-if="selectedClass?.isGraduated">졸업생 지원자 현황</template>
                    <template v-else>{{ selectedClass?.grade }}학년 {{ selectedClass?.class_no }}반 지원자 현황</template>
                  </h2>
                  <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    {{ totalRounds === 1 ? '추천 선발' : `${data?.round?.id}차 추천 선발` }}
                  </span>
                  <span class="text-xs font-medium px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                    {{ selectedClass?.isGraduated ? `담당: ${selectedClass?.teacher_name ?? '관리자'}` : `담임: ${selectedClass?.teacher_name ?? '미배정'}` }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5 m-0">
                  해당 학급 학생들의 이번 차수 추천 지원 및 선발 현황을 확인합니다.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                title="학급 지원 현황 대장 인쇄 (A4 가로 양식)"
                @click="handlePrintClassRoster(false)"
              >
                <Printer :size="14" class="text-slate-600" />
                <span>현황 인쇄</span>
              </button>
              <button
                class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                @click="classModalOpen = false"
                title="닫기 (ESC)"
              >
                <X :size="20" />
              </button>
            </div>
          </div>

          <!-- 모달 상단 통계 카드 & 필터 바 -->
          <div class="px-6 py-3 bg-white border-b border-slate-100 flex flex-col gap-3">
            <!-- 요약 지표 -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div class="text-xs text-slate-400 font-medium">학급 인원</div>
                <div class="text-lg font-bold text-slate-800">{{ classStudents.length }}명</div>
              </div>
              <div class="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-center">
                <div class="text-xs text-blue-500 font-medium">지원 학생</div>
                <div class="text-lg font-bold text-blue-700">{{ classAppliedStudents.length }}명</div>
              </div>
              <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-center">
                <div class="text-xs text-amber-600 font-medium">미지원 학생</div>
                <div class="text-lg font-bold text-amber-700">{{ classUnappliedStudents.length }}명</div>
              </div>
              <div class="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
                <div class="text-xs text-indigo-500 font-medium">총 지원 건수</div>
                <div class="text-lg font-bold text-indigo-700">{{ totalClassAppsCount }}건</div>
              </div>
            </div>

            <!-- 필터 및 검색 툴바 -->
            <div class="flex items-center justify-between gap-3 flex-wrap pt-1">
              <!-- 필터 탭 -->
              <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  :class="classModalFilterTab === 'applied' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                  @click="classModalFilterTab = 'applied'"
                >
                  지원 학생 ({{ classAppliedStudents.length }})
                </button>
                <button
                  class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  :class="classModalFilterTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                  @click="classModalFilterTab = 'all'"
                >
                  전체 학생 ({{ classStudents.length }})
                </button>
                <button
                  class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  :class="classModalFilterTab === 'unapplied' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                  @click="classModalFilterTab = 'unapplied'"
                >
                  미지원 ({{ classUnappliedStudents.length }})
                </button>
              </div>

              <!-- 검색 인풋 -->
              <div class="relative flex-1 max-w-xs min-w-50">
                <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  v-model="classModalSearch"
                  type="text"
                  placeholder="이름, 학번, 대학명 검색..."
                  class="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                />
              </div>
            </div>
          </div>

          <!-- 모달 본문 (테이블) -->
          <div class="flex-1 overflow-y-auto min-h-65 max-h-[50vh] p-6 bg-slate-50/50">
            <!-- 로딩 중 -->
            <div v-if="classModalLoading" class="flex flex-col items-center justify-center py-16 text-slate-400">
              <RefreshCw :size="28" class="animate-spin text-blue-500 mb-2" />
              <p class="text-sm font-medium">학급 지원자 데이터를 불러오는 중입니다...</p>
            </div>

            <!-- 데이터 없음 -->
            <div v-else-if="filteredClassStudents.length === 0" class="flex flex-col items-center justify-center py-14 bg-white rounded-xl border border-slate-200 text-slate-400">
              <Users :size="36" class="text-slate-300 mb-2" />
              <p class="text-sm font-semibold text-slate-600 mb-1">
                <template v-if="classModalSearch">검색 조건에 맞는 학생이 없습니다.</template>
                <template v-else-if="classModalFilterTab === 'applied'">해당 학급에 지원한 학생이 없습니다.</template>
                <template v-else-if="classModalFilterTab === 'unapplied'">미지원 학생이 없습니다 (전원 지원 완료).</template>
                <template v-else>등록된 학생 데이터가 없습니다.</template>
              </p>
              <p class="text-xs text-slate-400">
                <template v-if="classModalSearch">다른 검색어로 다시 시도해 보세요.</template>
                <template v-else>담임교사가 입력을 진행하거나 학생 데이터를 먼저 등록해주세요.</template>
              </p>
            </div>

            <!-- 학생 목록 테이블 -->
            <div v-else class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-50/90 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                    <th class="py-3 px-4 w-14 text-center">번호</th>
                    <th class="py-3 px-4 w-24">학번</th>
                    <th class="py-3 px-4 w-28">이름</th>
                    <th class="py-3 px-4">지원 대학 및 모집단위</th>
                    <th class="py-3 px-4 w-24 text-right">전체내신</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-sm">
                  <tr
                    v-for="(s, sIdx) in filteredClassStudents"
                    :key="s.id"
                    class="hover:bg-slate-50/80 transition-colors"
                  >
                    <td class="py-3.5 px-4 text-center text-xs font-semibold text-slate-400">
                      {{ s.seq_no || sIdx + 1 }}
                    </td>
                    <td class="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {{ s.student_code || '—' }}
                    </td>
                    <td class="py-3.5 px-4 font-bold text-slate-800">
                      <div class="flex items-center gap-1.5">
                        <span>{{ s.name }}</span>
                        <span v-if="!s.is_enrolled" class="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded">졸업생</span>
                      </div>
                    </td>
                    <td class="py-3.5 px-4">
                      <!-- 지원 내역이 없을 때 -->
                      <div v-if="!s.apps || s.apps.length === 0" class="text-xs font-medium text-slate-400 flex items-center gap-1">
                        <span>미지원</span>
                      </div>

                      <!-- 지원 내역 목록 -->
                      <div v-else class="flex flex-col gap-1.5">
                        <div
                          v-for="(app, aIdx) in s.apps"
                          :key="`${app.student_id}-${app.univ_id || app.track_id}-${aIdx}`"
                          class="flex items-center gap-2 flex-wrap text-xs"
                        >
                          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                            지망 {{ aIdx + 1 }}
                          </span>
                          <span
                            v-if="totalRounds > 1 && (app.round || app.round_id)"
                            class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0"
                          >
                            {{ app.round || app.round_id }}차 지원
                          </span>
                          <span
                            class="font-semibold text-slate-800"
                            :class="{ 'line-through opacity-50': app.abandoned || app.excluded }"
                          >
                            {{ app.univ_name }} — {{ app.track_name }}
                            <span v-if="app.department_name" class="font-normal text-slate-500"> {{ app.department_name }}</span>
                          </span>

                          <!-- 상태 뱃지 -->
                          <span
                            v-if="app.abandoned"
                            class="font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded text-[10px]"
                          >
                            {{ totalRounds > 1 && (app.abandoned_round || app.round || app.round_id) ? `${app.abandoned_round || app.round || app.round_id}차 포기` : '포기됨' }}
                          </span>
                          <span
                            v-else-if="app.excluded"
                            class="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]"
                          >
                            {{ totalRounds > 1 && (app.round || app.round_id) ? `${app.round || app.round_id}차 미선발` : '미선발' }} ({{ app.excluded_reason || '제외' }})
                          </span>
                          <span
                            v-else-if="app.recommended"
                            class="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]"
                          >
                            {{ totalRounds > 1 && (app.recommended_round || app.round || app.round_id) ? `${app.recommended_round || app.round || app.round_id}차 선발(추천확정)` : '추천 확정' }}
                          </span>
                          <span
                            v-else-if="effectiveRoundStatus === 'FINALIZED'"
                            class="font-medium text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]"
                          >
                            {{ totalRounds > 1 && (app.round || app.round_id) ? `${app.round || app.round_id}차 미선발` : '미선발' }}
                          </span>
                          <span
                            v-else
                            class="font-medium text-blue-600 bg-blue-50/80 border border-blue-100 px-1.5 py-0.5 rounded text-[10px]"
                          >
                            접수 완료
                          </span>
                        </div>
                      </div>
                    </td>
                    <td class="py-3.5 px-4 text-right tabular-nums text-xs">
                      <span v-if="s.gpa_overall != null" class="font-semibold text-slate-700">
                        {{ Number(s.gpa_overall).toFixed(2) }}
                      </span>
                      <span v-else class="text-slate-300">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 모달 푸터 -->
          <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div class="text-xs text-slate-500">
              💡 지원자 추천 확정 및 상세 관리는 <strong class="text-slate-700">[학교장 추천 선발]</strong> 탭에서 수행할 수 있습니다.
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <button
                class="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                title="지원한 학생들만 인쇄"
                :disabled="classAppliedStudents.length === 0"
                @click="handlePrintClassRoster(true)"
              >
                <Printer :size="13" class="text-slate-600" />
                <span>지원자만 인쇄 ({{ classAppliedStudents.length }}명)</span>
              </button>
              <button
                class="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                title="학급 전체 학생 명단 및 지원 현황 인쇄"
                :disabled="classStudents.length === 0"
                @click="handlePrintClassRoster(false)"
              >
                <Printer :size="13" class="text-slate-600" />
                <span>전체 인쇄 (대장)</span>
              </button>
              <button
                class="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                @click="classModalOpen = false"
              >
                닫기
              </button>
              <button
                class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                @click="classModalOpen = false; setActiveTab('rounds')"
              >
                추천 선발 관리로 이동 <ArrowRight :size="13" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, h } from 'vue'
import { supabase } from '../../utils/supabaseClient.js'
import { Copy, Check, AlertTriangle, CheckCircle2, XCircle, ArrowRight, Users, X, Search, RefreshCw, Printer } from 'lucide-vue-next'
import { getOverview, getClasses, getStudents, getAreas, getUniversities, getApplications } from '../../api/admin.js'
import { roundStatusLabel } from '../../data/roundStatus.js'
import { fetchRoundSchedulesMap, computeRoundDisplayStatus } from '../../utils/roundSchedule.js'
import { printClassApplicationsReport, printAllClassesApplicationsReport } from '../../utils/printTemplates.js'
import MiniPie from './MiniPie.vue'
import HelpBox from '../common/HelpBox.vue'

// ── 섹션 레이블 헬퍼 컴포넌트 (인라인) ─────────────────────────
const SectionLabel = {
  props: ['title'],
  setup(props) {
    return () => h('div', { class: 'flex items-center gap-3 mb-4' }, [
      h('span', { class: 'text-base font-semibold', style: 'color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em;' }, props.title),
      h('div', { class: 'flex-1', style: 'height: 1px; background: #f1f5f9;' }),
    ])
  },
}

const setActiveTab = inject('setActiveTab', () => {})

// ── 상태 ──────────────────────────────────────────────────────
const data    = ref(null)
const loading = ref(true)
const error   = ref('')
const copied  = ref(false)

// null = 아직 로드 전 또는 로드 실패(카드 숨김)
const readiness = ref(null)
const totalRounds = ref(3)

const susiApplyStartDate = ref('')
const susiApplyEndDate = ref('')

const susiApplyPeriodDisplay = computed(() => {
  if (!susiApplyStartDate.value || !susiApplyEndDate.value) return '미설정'
  return `${susiApplyStartDate.value} ~ ${susiApplyEndDate.value}`
})

async function loadTotalRounds() {
  const local = localStorage.getItem('total_rounds')
  if (local) {
    const n = parseInt(local, 10)
    if (n >= 1 && n <= 5) totalRounds.value = n
  }
  if (supabase) {
    try {
      const { data: configLimit } = await supabase.from('config').select('value').eq('key', 'total_rounds').maybeSingle()
      if (configLimit && configLimit.value) {
        const n = parseInt(configLimit.value, 10)
        if (n >= 1 && n <= 5) totalRounds.value = n
      }

      const { data: cfgStart } = await supabase.from('config').select('value').eq('key', 'susi_apply_start_date').maybeSingle()
      if (cfgStart?.value) susiApplyStartDate.value = cfgStart.value
      const { data: cfgEnd } = await supabase.from('config').select('value').eq('key', 'susi_apply_end_date').maybeSingle()
      if (cfgEnd?.value) susiApplyEndDate.value = cfgEnd.value
    } catch {}
  }
}

async function loadReadiness() {
  try {
    const [classes, studentPage, areas, univs] = await Promise.all([
      getClasses(),
      getStudents({ page: 1, per_page: 1 }),
      getAreas(),
      getUniversities(),
    ])
    readiness.value = {
      classes:  classes.filter(c => !(c.grade === 0 && c.class_no === 0)).length,
      students: studentPage.total,
      areas:    areas.length,
      univs:    univs.length,
    }
  } catch {
    readiness.value = null
  }
}

// ── 체크리스트 ────────────────────────────────────────────────
const checklist = computed(() => {
  if (!readiness.value) return null
  const r = readiness.value
  return [
    { key: 'classes',  label: '학급 현황',     desc: '담임교사 계정을 생성합니다',            count: r.classes,  unit: '개 학급', tab: 'classes' },
    { key: 'students', label: '학생 명단 등록', desc: '추천 대상 재학생·졸업생 명단을 입력합니다',      count: r.students, unit: '명',     tab: 'students' },
    { key: 'areas',    label: '추천순위 기준 설정',  desc: '학교장추천 선발을 위한 영역과 배점을 정합니다',             count: r.areas,    unit: '개 항목', tab: 'areas' },
    { key: 'univs',    label: '대학 설정',      desc: '지원할 대학·모집단위와 정원을 정합니다',  count: r.univs,    unit: '개 대학', tab: 'univs' },
  ]
})

const allReady = computed(() => checklist.value?.every(item => item.count > 0) ?? false)

// ── 파생값 ────────────────────────────────────────────────────
const totalApplicants = computed(() => {
  const classSum = data.value?.classes?.reduce((s, c) => s + (c.submitted || c.count || 0), 0) ?? 0
  const gradSum  = data.value?.graduated?.submitted ?? 0
  return classSum + gradSum
})
const zeroClassCount = computed(() => {
  let count = data.value?.classes?.filter(c => (c.submitted ?? c.count ?? 0) === 0).length ?? 0
  if (data.value?.graduated && data.value.graduated.submitted === 0) count++
  return count
})
const unconfirmedCount = computed(() => {
  let count = data.value?.classes?.filter(c => !c.confirmed).length ?? 0
  if (data.value?.graduated && !data.value.graduated.confirmed) count++
  return count
})
const schedulesMap = ref({})
const selectedRoundId = ref(null)
const overviewLoading = ref(false)

const currentViewingRoundId = computed(() => {
  if (selectedRoundId.value) return selectedRoundId.value
  return data.value?.round?.id || 1
})

function getRoundInfo(rId) {
  const found = data.value?.all_rounds?.find(r => r.id === rId)
  return found || { id: rId, status: 'OPEN' }
}

function getRoundComputedStatus(rId) {
  const r = getRoundInfo(rId)
  const sched = schedulesMap.value[rId]
  return computeRoundDisplayStatus(r, sched)
}

function getRoundStatusText(rId) {
  return roundStatusLabel(getRoundComputedStatus(rId))
}

function getRoundBadgeStyle(rId) {
  const st = getRoundComputedStatus(rId)
  if (st === 'OPEN') return { background: '#dcfce7', color: '#15803d' }
  if (st === 'FINALIZED') return { background: '#f3e8ff', color: '#7e22ce' }
  if (st === 'CLOSED') return { background: '#dbeafe', color: '#1d4ed8' }
  return { background: '#fef9c3', color: '#a16207' }
}

async function handleSelectRound(rId) {
  if (selectedRoundId.value === rId) return
  selectedRoundId.value = rId
  overviewLoading.value = true
  try {
    data.value = await getOverview(rId)
  } catch (e) {
    error.value = e.message || '차수 데이터를 불러오지 못했습니다.'
  } finally {
    overviewLoading.value = false
  }
}

function getTrackEffectiveQuota(track) {
  if (track.available_quota !== undefined && track.available_quota !== null) {
    return track.available_quota
  }
  return track.unit_quota
}

const effectiveRoundStatus = computed(() => {
  if (!data.value?.round) return 'DRAFT'
  const round = data.value.round
  const sched = schedulesMap.value[round.id]
  return computeRoundDisplayStatus(round, sched)
})

const helpBox = computed(() => {
  if (!data.value) return null
  const round = data.value.round
  if (!round) {
    if ((data.value.all_time?.total_rounds ?? 0) === 0) {
      return {
        key: 'overview-first',
        title: '도움말 — 처음 시작하기',
        intro: '이 화면은 시스템의 전체 현황을 한눈에 보여줍니다. 아직 진행 중인 추천 선발이 없습니다.',
        items: [
          '처음 사용하신다면 왼쪽 메뉴에서 [학급 현황] → [학생 관리] → [추천순위 기준 설정] → [대학 설정] 순서로 기초 정보를 먼저 입력하세요.',
          '준비가 끝나면 [학교장 추천 선발]에서 "+ 추천 선발 추가"를 눌러 담임교사의 입력을 시작할 수 있습니다.',
          '자세한 사용 방법은 왼쪽 아래 [매뉴얼] 메뉴에서 볼 수 있습니다.',
        ],
      }
    }
    return {
      key: 'overview-idle',
      title: '도움말 — 진행 중인 추천 선발 없음',
      intro: '이전 추천 선발은 모두 마감되었고, 지금은 진행 중인 추천 선발이 없습니다.',
      items: [
        '추가 추천이 필요하면 [학교장 추천 선발]에서 "+ 추천 선발 추가"로 다음 차수를 시작하세요.',
        '이전 추천 선발의 결과는 [학교장 추천 선발]에서 해당 차수를 선택해 다시 확인하거나 내려받을 수 있습니다.',
      ],
    }
  }

  const status = effectiveRoundStatus.value

  if (status === 'OPEN') {
    return {
      key: 'overview-open',
      title: '도움말 — 추천 선발 진행 중',
      intro: '지금은 담임교사들이 지원자를 등록하는 기간입니다.',
      items: [
        '아래 "학급별 지원자 현황"에서 학급별 입력 상황을 확인하세요. 빨간색으로 표시된 학급은 아직 지원자를 한 명도 등록하지 않은 학급입니다.',
        '담임교사들에게 웹 접속 주소를 안내해 주세요. 교사는 해당 주소로 접속하여 로그인합니다.',
        '모든 담임교사의 입력이 끝나면 [학교장 추천 선발]에서 "종료하기"를 눌러 입력을 마감하세요.',
      ],
    }
  }

  if (status === 'FINALIZED') {
    return {
      key: 'overview-finalized',
      title: '도움말 — 최종 마감된 추천 선발',
      intro: '추천 선발 및 추천 확정 절차가 모두 최종 마감되었습니다.',
      items: [
        '최종 마감된 추천 선발 결과는 [학교장 추천 선발] 메뉴 또는 [결과 보고서] 메뉴에서 조회 및 출력할 수 있습니다.',
        '새로운 차수의 선발을 개시하거나 설정을 변경하려면 [학교장 추천 선발] 메뉴로 이동하세요.',
      ],
    }
  }

  if (status === 'DRAFT') {
    return {
      key: 'overview-draft',
      title: '도움말 — 접수 시작 전 (대기 중)',
      intro: '추천 선발 접수 시작 전 상태입니다.',
      items: [
        '접수 시작일이 되면 자동으로 지원자 접수가 개시됩니다.',
        '일정을 변경하거나 조기 시작하려면 [학교장 추천 선발] 메뉴에서 관리하세요.',
      ],
    }
  }

  return {
    key: 'overview-closed',
    title: '도움말 — 입력 종료, 추천 확정 단계',
    intro: '담임교사 입력이 종료되었습니다. 이제 관리자가 추천자를 확정할 차례입니다.',
    items: [
      '[학교장 추천 선발]에서 이 차수를 선택한 뒤 [결과] 탭에서 "자동 추천 확정"을 누르거나 학생별로 "추천 확정"을 누르세요.',
      '추천 확정이 모두 끝나면 "마감하기"를 눌러 결과를 담임교사에게 공개하세요.',
      '입력을 다시 받아야 하면 "다시 열기"를 누르면 됩니다.',
    ],
  }
})

const allTimeStats = computed(() => {
  if (!data.value) return []
  const t = data.value.all_time || {}
  const roundsVal = totalRounds.value === 1 ? '완료' : `${t.progressed_rounds ?? t.total_rounds ?? 1}차`

  const applicantsVal = t.applicant_students != null && t.applicant_cases != null
    ? `${t.applicant_students}명 (${t.applicant_cases}건)`
    : `${t.total_applicants ?? 0}명`

  const confirmedVal = t.confirmed_students != null && t.confirmed_cases != null
    ? `${t.confirmed_students}명 (${t.confirmed_cases}건)`
    : `${t.confirmed ?? 0}명`

  const abandonedVal = t.abandoned_students != null && t.abandoned_cases != null
    ? `${t.abandoned_students}명 (${t.abandoned_cases}건)`
    : `${t.abandoned ?? 0}명`

  return [
    { label: '진행된 추천 선발',  value: roundsVal },
    { label: '누적 지원자',      value: applicantsVal },
    { label: '확정 추천자',      value: confirmedVal },
    { label: '포기자',           value: abandonedVal },
  ]
})

// ── 데이터 로드 ───────────────────────────────────────────────
onMounted(async () => {
  await loadTotalRounds()
  loadReadiness() // 개요 로드와 병렬 실행 — 실패해도 체크리스트 카드만 숨겨진다
  try {
    schedulesMap.value = await fetchRoundSchedulesMap()
    data.value = await getOverview()
    if (data.value?.round?.id) {
      selectedRoundId.value = data.value.round.id
    }
  } catch (e) {
    error.value = e.response?.data ?? e.message ?? '데이터를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
})

// ── 클립보드 복사 ─────────────────────────────────────────────
function handleCopy() {
  const url = `http://${data.value.server_addr}`
  const markCopied = () => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(markCopied)
  } else {
    const el = document.createElement('textarea')
    el.value = url
    el.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    markCopied()
  }
}

// ── 학급별 지원자 상세 모달 상태 및 로직 ───────────────────────
const classModalOpen = ref(false)
const classModalLoading = ref(false)
const selectedClass = ref(null)
const classStudents = ref([])
const classModalFilterTab = ref('applied') // 'applied' | 'all' | 'unapplied'
const classModalSearch = ref('')

async function openClassDetailModal(classObj, isGraduated = false) {
  selectedClass.value = {
    ...classObj,
    isGraduated: isGraduated || (classObj.grade === 0 && classObj.class_no === 0)
  }
  classModalOpen.value = true
  classModalLoading.value = true
  classModalFilterTab.value = (classObj.submitted > 0) ? 'applied' : 'all'
  classModalSearch.value = ''
  classStudents.value = []

  try {
    const isGrad = selectedClass.value.isGraduated
    const roundId = data.value?.round?.id

    const studentParams = {
      per_page: 300,
      page: 1,
    }
    if (isGrad) {
      studentParams.is_enrolled = 0
    } else {
      studentParams.is_enrolled = 1
      studentParams.grade = classObj.grade
      studentParams.class_no = classObj.class_no
    }

    const [studentsRes, appsRes] = await Promise.all([
      getStudents(studentParams),
      roundId ? getApplications(roundId) : Promise.resolve([])
    ])

    const allStudents = studentsRes?.rows || []
    const roundApps = appsRes || []

    const appsByStudentId = new Map()
    for (const app of roundApps) {
      if (!appsByStudentId.has(app.student_id)) {
        appsByStudentId.set(app.student_id, [])
      }
      appsByStudentId.get(app.student_id).push(app)
    }

    const mapped = allStudents.map(s => ({
      ...s,
      apps: appsByStudentId.get(s.id) || []
    }))

    // 혹시 enrolled_students에 누락되었으나 지원서에만 등록된 학생이 있는 경우 fallback 추가
    const knownStudentIds = new Set(allStudents.map(s => s.id))
    for (const app of roundApps) {
      const matchGrad = isGrad && (!app.is_enrolled || app.grade === 0)
      const matchClass = !isGrad && app.grade === classObj.grade && app.class_no === classObj.class_no
      if ((matchGrad || matchClass) && !knownStudentIds.has(app.student_id)) {
        knownStudentIds.add(app.student_id)
        mapped.push({
          id: app.student_id,
          student_code: app.student_code || '',
          name: app.name || '미명학생',
          grade: app.grade,
          class_no: app.class_no,
          seq_no: app.seq_no,
          is_enrolled: app.is_enrolled,
          gpa_overall: app.gpa_overall,
          apps: appsByStudentId.get(app.student_id) || [app]
        })
      }
    }

    mapped.sort((a, b) => {
      const noA = Number(a.seq_no) || 0
      const noB = Number(b.seq_no) || 0
      if (noA !== noB) return noA - noB
      return (a.student_code || '').localeCompare(b.student_code || '')
    })

    classStudents.value = mapped
  } catch (err) {
    console.error('Failed to load class detail:', err)
  } finally {
    classModalLoading.value = false
  }
}

const classAppliedStudents = computed(() => {
  return classStudents.value.filter(s => s.apps && s.apps.length > 0)
})

const classUnappliedStudents = computed(() => {
  return classStudents.value.filter(s => !s.apps || s.apps.length === 0)
})

const totalClassAppsCount = computed(() => {
  return classStudents.value.reduce((sum, s) => sum + (s.apps ? s.apps.length : 0), 0)
})

const filteredClassStudents = computed(() => {
  let list = classStudents.value
  if (classModalFilterTab.value === 'applied') {
    list = classAppliedStudents.value
  } else if (classModalFilterTab.value === 'unapplied') {
    list = classUnappliedStudents.value
  }

  const q = classModalSearch.value.trim().toLowerCase()
  if (!q) return list

  return list.filter(s => {
    const matchName = s.name?.toLowerCase().includes(q)
    const matchCode = s.student_code?.toLowerCase().includes(q)
    const matchApps = s.apps?.some(a =>
      a.univ_name?.toLowerCase().includes(q) ||
      a.track_name?.toLowerCase().includes(q) ||
      a.department_name?.toLowerCase().includes(q)
    )
    return matchName || matchCode || matchApps
  })
})

// ── 학급 지원현황 인쇄 처리 ───────────────────────────────────
function handlePrintClassRoster(appliedOnly = false) {
  if (!selectedClass.value) return
  const isGrad = selectedClass.value.isGraduated
  const className = isGrad
    ? '졸업생'
    : `${selectedClass.value.grade}학년 ${selectedClass.value.class_no}반`
  const teacherName = selectedClass.value.teacher_name || (isGrad ? '관리자' : '')
  const roundTitle = totalRounds.value === 1 ? '추천 선발' : `${data.value?.round?.id || 1}차 추천 선발`
  const roundStatus = roundStatusLabel(effectiveRoundStatus.value)

  printClassApplicationsReport({
    className,
    teacherName,
    roundTitle,
    roundStatus,
    students: classStudents.value,
    appliedOnly
  })
}

const directPrintLoadingKey = ref(null)

async function handleDirectPrintClass(classObj, isGraduated = false, event) {
  if (event) event.stopPropagation()
  const key = isGraduated ? '0-0-true' : `${classObj.grade}-${classObj.class_no}-false`
  directPrintLoadingKey.value = key

  try {
    const isGrad = isGraduated || (classObj.grade === 0 && classObj.class_no === 0)
    const roundId = data.value?.round?.id

    const studentParams = {
      per_page: 300,
      page: 1,
    }
    if (isGrad) {
      studentParams.is_enrolled = 0
    } else {
      studentParams.is_enrolled = 1
      studentParams.grade = classObj.grade
      studentParams.class_no = classObj.class_no
    }

    const [studentsRes, appsRes] = await Promise.all([
      getStudents(studentParams),
      roundId ? getApplications(roundId) : Promise.resolve([])
    ])

    const allStudents = studentsRes?.rows || []
    const roundApps = appsRes || []

    const appsByStudentId = new Map()
    for (const app of roundApps) {
      if (!appsByStudentId.has(app.student_id)) {
        appsByStudentId.set(app.student_id, [])
      }
      appsByStudentId.get(app.student_id).push(app)
    }

    const mapped = allStudents.map(s => ({
      ...s,
      apps: appsByStudentId.get(s.id) || []
    }))

    const knownStudentIds = new Set(allStudents.map(s => s.id))
    for (const app of roundApps) {
      const matchGrad = isGrad && (!app.is_enrolled || app.grade === 0)
      const matchClass = !isGrad && app.grade === classObj.grade && app.class_no === classObj.class_no
      if ((matchGrad || matchClass) && !knownStudentIds.has(app.student_id)) {
        knownStudentIds.add(app.student_id)
        mapped.push({
          id: app.student_id,
          student_code: app.student_code || '',
          name: app.name || '미명학생',
          grade: app.grade,
          class_no: app.class_no,
          seq_no: app.seq_no,
          is_enrolled: app.is_enrolled,
          gpa_overall: app.gpa_overall,
          apps: appsByStudentId.get(app.student_id) || [app]
        })
      }
    }

    mapped.sort((a, b) => {
      const noA = Number(a.seq_no) || 0
      const noB = Number(b.seq_no) || 0
      if (noA !== noB) return noA - noB
      return (a.student_code || '').localeCompare(b.student_code || '')
    })

    const className = isGrad ? '졸업생' : `${classObj.grade}학년 ${classObj.class_no}반`
    const teacherName = classObj.teacher_name || (isGrad ? '관리자' : '')
    const roundTitle = totalRounds.value === 1 ? '추천 선발' : `${data.value?.round?.id || 1}차 추천 선발`
    const roundStatus = roundStatusLabel(effectiveRoundStatus.value)

    printClassApplicationsReport({
      className,
      teacherName,
      roundTitle,
      roundStatus,
      students: mapped,
      appliedOnly: true
    })
  } catch (err) {
    console.error('Failed to direct print:', err)
  } finally {
    directPrintLoadingKey.value = null
  }
}

// ── 전체 학급 일괄 인쇄 처리 ──────────────────────────────────
const allClassesPrintLoading = ref(false)

async function handlePrintAllClasses(appliedOnly = true) {
  if (!data.value?.classes) return
  allClassesPrintLoading.value = true

  try {
    const roundId = data.value?.round?.id
    const [studentsRes, appsRes] = await Promise.all([
      getStudents({ per_page: 2000, page: 1 }),
      roundId ? getApplications(roundId) : Promise.resolve([])
    ])

    const allStudents = studentsRes?.rows || []
    const roundApps = appsRes || []

    const appsByStudentId = new Map()
    for (const app of roundApps) {
      if (!appsByStudentId.has(app.student_id)) {
        appsByStudentId.set(app.student_id, [])
      }
      appsByStudentId.get(app.student_id).push(app)
    }

    const studentsWithApps = allStudents.map(s => ({
      ...s,
      apps: appsByStudentId.get(s.id) || []
    }))

    // 학급 목록 구성
    const classesData = []

    // 1. 일반 재학생 학급들
    for (const c of data.value.classes) {
      const classStudentsList = studentsWithApps.filter(s =>
        s.is_enrolled && Number(s.grade) === Number(c.grade) && Number(s.class_no) === Number(c.class_no)
      )

      classStudentsList.sort((a, b) => {
        const noA = Number(a.seq_no) || 0
        const noB = Number(b.seq_no) || 0
        if (noA !== noB) return noA - noB
        return (a.student_code || '').localeCompare(b.student_code || '')
      })

      classesData.push({
        className: `${c.grade}학년 ${c.class_no}반`,
        teacherName: c.teacher_name || '',
        students: classStudentsList
      })
    }

    // 2. 졸업생 학급
    if (data.value.graduated) {
      const gradStudentsList = studentsWithApps.filter(s =>
        !s.is_enrolled || s.grade === 0 || s.class_no === 0
      )

      gradStudentsList.sort((a, b) => {
        const noA = Number(a.seq_no) || 0
        const noB = Number(b.seq_no) || 0
        if (noA !== noB) return noA - noB
        return (a.student_code || '').localeCompare(b.student_code || '')
      })

      classesData.push({
        className: '졸업생',
        teacherName: data.value.graduated.teacher_name || '관리자',
        students: gradStudentsList
      })
    }

    const roundTitle = totalRounds.value === 1 ? '추천 선발' : `${data.value?.round?.id || 1}차 추천 선발`
    const roundStatus = roundStatusLabel(effectiveRoundStatus.value)

    printAllClassesApplicationsReport({
      classesData,
      roundTitle,
      roundStatus,
      appliedOnly
    })
  } catch (err) {
    console.error('Failed to batch print all classes:', err)
  } finally {
    allClassesPrintLoading.value = false
  }
}
</script>
