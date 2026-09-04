<template>
  <div class="flex flex-col h-full pt-4 pb-4 px-4 sm:px-10 overflow-hidden box-border">

    <!-- 페이지 헤더 -->
    <div class="shrink-0 flex items-start justify-between mb-3 flex-wrap gap-3">
      <div>
        <p class="text-base mb-0.5" style="color: #94a3b8;">관리자</p>
        <h1 class="text-2xl font-semibold" style="color: #1e293b; margin: 0;">대학 설정</h1>
      </div>
    </div>

    <!-- 직관적인 안내 가이드 카드 (고정 영역) -->
    <div class="shrink-0 mb-3 p-3 rounded-2xl flex items-center justify-between gap-4" style="background: #eff6ff; border: 1px solid #bfdbfe;">
      <div>
        <h2 class="text-sm font-bold" style="color: #1e3a8a; margin: 0;">대학별 추천전형 요강 구글 스프레드시트 동기화</h2>
        <p class="text-xs mt-0.5" style="color: #2563eb; margin: 2px 0 0;">
          구글 스프레드시트를 동기화하시면 지역, 대학명, 전형구분, 전형명, 인원제한, 졸업년도조건, 수능최저학력기준, 본교지원가능여부, 사전마감여부 9개 핵심 전형 정보가 자동으로 연동됩니다.
        </p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button
          @click="handleSyncGoogleSheet"
          :disabled="syncing"
          class="text-xs font-bold px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer shadow-sm border-none flex items-center gap-1.5 disabled:opacity-50"
        >
          <span>🔄 {{ syncing ? '동기화 진행 중…' : '추천 전형 동기화' }}</span>
        </button>
      </div>
    </div>

    <!-- 검색 및 액션 버튼 가로 바 -->
    <div class="shrink-0 flex items-center justify-between mb-3 flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <input
          v-model="regionalSearch"
          type="text"
          placeholder="대학명, 전형명, 지역 검색…"
          class="text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
          style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 14px; width: 260px; background: white;"
        />
        <span class="text-base" style="color: #64748b;">총 {{ filteredRegionalRecs.length }}건</span>
        <span v-if="filteredRegionalRecs.length > 0" class="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
          ↔️ 표를 좌우로 스크롤하여 9개 항목을 모두 확인하세요
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          v-if="regionalRecs.length > 0"
          class="text-base font-medium rounded-lg"
          style="padding: 7px 16px; border: 1px solid #86efac; background: #f0fdf4; color: #16a34a; cursor: pointer;"
          :disabled="saving"
          @click="downloadRegionalBackup"
        >
          📥 현재 데이터 백업 (엑셀)
        </button>
        <button
          v-if="regionalRecs.length > 0"
          class="text-base font-medium rounded-lg"
          style="padding: 7px 16px; border: 1px solid #fca5a5; background: #fef2f2; color: #dc2626; cursor: pointer;"
          :disabled="saving"
          @click="clearRegionalRecs"
        >
          🗑️ 데이터 전체 삭제
        </button>
      </div>
    </div>

      <p v-if="error" class="shrink-0 text-base mb-2" style="color: #ef4444;">{{ error }}</p>
      
      <!-- 엑셀 데이터 테이블 카드가 남은 전체 화면 높이를 100% 차지함 -->
      <div class="flex-1 min-h-0 flex flex-col rounded-xl overflow-hidden shadow-sm mb-1" style="background: white; border: 1px solid #e2e8f0;">
        <div v-if="regionalLoading" class="text-center py-16" style="color: #94a3b8;">
          학교장추천전형 데이터를 불러오는 중입니다…
        </div>

        <div v-else-if="filteredRegionalRecs.length === 0" class="text-center py-12 px-5">
          <div class="max-w-md mx-auto flex flex-col items-center justify-center">
            <div class="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100 shadow-sm" style="width: 64px; height: 64px; border-radius: 16px; background: #eff6ff; color: #2563eb; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <path d="M12 18v-6"/>
                <path d="m9 15 3-3 3 3"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold mb-1" style="color: #1e293b; margin: 0 0 6px;">등록된 학교장추천전형 정보가 없습니다</h3>
            <p class="text-xs mb-0" style="color: #64748b; line-height: 1.6;">
              상단 파란색 <strong>[추천 전형 동기화]</strong> 버튼으로 구글 스프레드시트를 동기화해 주세요.
            </p>
          </div>
        </div>

        <div v-else class="flex-1 min-h-0 flex flex-col overflow-x-auto rounded-xl border border-slate-200 shadow-sm" style="background: white;">
          <div class="flex-1 min-h-0 overflow-y-auto">
            <table class="w-full text-left" style="border-collapse: separate; border-spacing: 0; min-width: 1200px;">
              <thead class="sticky top-0 z-30" style="background: #f8fafc;">
                <tr>
                  <th style="position: sticky; left: 0; top: 0; z-index: 30; background: #f8fafc; padding: 12px 14px; width: 60px; min-width: 60px; max-width: 60px; text-align: center; color: #475569; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0;">No</th>
                  <th style="position: sticky; left: 60px; top: 0; z-index: 30; background: #f8fafc; padding: 12px 14px; width: 80px; min-width: 80px; max-width: 80px; color: #475569; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0;">지역</th>
                  <th style="position: sticky; left: 140px; top: 0; z-index: 30; background: #f8fafc; padding: 12px 14px; width: 160px; min-width: 160px; max-width: 160px; color: #475569; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0;">대학명</th>
                  <th style="padding: 12px 14px; width: 110px; color: #475569; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0;">전형구분</th>
                  <th style="padding: 12px 14px; width: 160px; color: #475569; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0;">전형명</th>
                  <th style="padding: 12px 14px; width: 110px; color: #475569; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0;">인원제한</th>
                  <th style="padding: 12px 14px; width: 150px; color: #475569; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0;">졸업년도조건</th>
                  <th style="padding: 12px 14px; width: 180px; color: #475569; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0;">수능최저학력기준</th>
                  <th style="padding: 12px 14px; width: 130px; color: #475569; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0;">본교지원가능여부</th>
                  <th style="padding: 12px 14px; width: 110px; color: #475569; border-bottom: 2px solid #cbd5e1;">사전마감여부</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="r in filteredRegionalRecs"
                  :key="r.id || r.seq_no"
                  class="hover:bg-slate-50 transition-colors group"
                >
                  <td class="text-center font-medium bg-white group-hover:bg-slate-50!" style="position: sticky; left: 0; z-index: 20; padding: 12px 14px; width: 60px; min-width: 60px; max-width: 60px; color: #64748b; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">{{ r.seq_no }}</td>
                  <td class="bg-white group-hover:bg-slate-50!" style="position: sticky; left: 60px; z-index: 20; padding: 12px 14px; width: 80px; min-width: 80px; max-width: 80px; color: #475569; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">{{ r.region }}</td>
                  <td class="font-bold bg-white group-hover:bg-slate-50! cursor-pointer text-blue-600 hover:underline" style="position: sticky; left: 140px; z-index: 20; padding: 12px 14px; width: 160px; min-width: 160px; max-width: 160px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;" @click="openEditRegionalModal(r)">{{ r.univ_name }}</td>
                  <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                    <span
                      v-if="getCategory(r) === '교과'"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200"
                    >
                      교과
                    </span>
                    <span
                      v-else-if="getCategory(r) === '종합'"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200"
                    >
                      종합
                    </span>
                    <span
                      v-else-if="getCategory(r)"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {{ getCategory(r) }}
                    </span>
                    <span v-else class="text-slate-400">-</span>
                  </td>
                  <td class="font-medium" style="padding: 12px 14px; color: #2563eb; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">{{ r.track_name }}</td>
                  <td style="padding: 12px 14px; color: #475569; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">{{ formatQuotaLimit(r.quota_limit) }}</td>
                  <td style="padding: 12px 14px; color: #475569; white-space: pre-line; word-break: keep-all; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">{{ r.grad_condition || '-' }}</td>
                  <td style="padding: 12px 14px; color: #1e293b; white-space: pre-line; word-break: keep-all; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;" class="font-medium">{{ r.csat_min || '-' }}</td>
                  <td style="padding: 12px 14px; color: #475569; white-space: pre-line; word-break: keep-all; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">{{ r.target_students || '-' }}</td>
                  <td style="padding: 12px 14px; color: #64748b; white-space: pre-line; word-break: keep-all; border-bottom: 1px solid #e2e8f0;">{{ r.remarks || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

  <!-- ── 1단계 추천전형 상세 보기 / 수정 모달 ────────────────────────────── -->
  <div v-if="editRegionalModal.open" class="fixed inset-0 flex items-center justify-center z-50" style="background: rgba(0,0,0,0.4);" @click.self="editRegionalModal.open = false">
    <div class="bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden" style="width: 640px; max-height: 88vh;">
      
      <!-- 헤더 -->
      <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <span class="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold">{{ editRegionalModal.form.region || '기타' }}</span>
          <div>
            <h3 class="text-lg font-bold text-slate-900" style="margin: 0;">{{ editRegionalModal.form.univ_name }}</h3>
            <p class="text-xs text-blue-600 font-semibold mt-0.5" style="margin: 2px 0 0;">{{ editRegionalModal.form.track_name }}</p>
          </div>
        </div>
        <button @click="editRegionalModal.open = false" class="text-slate-400 hover:text-slate-600 border-none bg-none text-xl cursor-pointer">✕</button>
      </div>

      <!-- 모달 본문: [1] 상세보기 모드 -->
      <div v-if="!editRegionalModal.isEditing" class="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
        <!-- 핵심 요약 카운터 카드 -->
        <div class="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <span class="text-slate-500 block mb-0.5 font-medium">전형구분</span>
            <span
              class="text-sm font-bold"
              :class="editRegionalModal.form.recruitment_quota === '종합' ? 'text-purple-700' : 'text-blue-700'"
            >
              {{ editRegionalModal.form.recruitment_quota || '미지정' }}
            </span>
          </div>
          <div>
            <span class="text-slate-500 block mb-0.5 font-medium">인원제한</span>
            <span class="text-sm font-bold text-blue-600">{{ formatQuotaLimit(editRegionalModal.form.quota_limit) || '없음' }}</span>
          </div>
          <div>
            <span class="text-slate-500 block mb-0.5 font-medium">졸업년도 조건</span>
            <span class="text-sm font-bold text-emerald-600">{{ editRegionalModal.form.grad_condition || '제한없음' }}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <span class="text-slate-500 block mb-0.5 font-medium">본교지원가능여부</span>
            <span class="text-sm font-bold text-slate-800">{{ editRegionalModal.form.target_students || '-' }}</span>
          </div>
          <div>
            <span class="text-slate-500 block mb-0.5 font-medium">사전마감여부</span>
            <span class="text-sm font-bold text-slate-800">{{ editRegionalModal.form.remarks || '-' }}</span>
          </div>
        </div>

        <div class="space-y-3 pt-1">
          <div class="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
            <span class="block font-bold text-amber-900 mb-1">⚡ 수능최저학력기준</span>
            <p class="text-amber-950 font-semibold whitespace-pre-line leading-relaxed m-0">{{ editRegionalModal.form.csat_min || '없음' }}</p>
          </div>
        </div>
      </div>

      <!-- 모달 본문: [2] 수정하기 모드 -->
      <div v-else class="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block font-bold text-slate-600 mb-1">지역</label>
            <input v-model="editRegionalModal.form.region" type="text" class="w-full p-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">대학명</label>
            <input v-model="editRegionalModal.form.univ_name" type="text" class="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900" />
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">전형구분</label>
            <select v-model="editRegionalModal.form.recruitment_quota" class="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-800">
              <option value="교과">교과 (학생부교과)</option>
              <option value="종합">종합 (학생부종합)</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">전형명</label>
            <input v-model="editRegionalModal.form.track_name" type="text" class="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold text-blue-600" />
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">인원제한</label>
            <input v-model="editRegionalModal.form.quota_limit" type="text" class="w-full p-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">졸업년도 조건</label>
            <input v-model="editRegionalModal.form.grad_condition" type="text" class="w-full p-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">본교지원가능여부</label>
            <input v-model="editRegionalModal.form.target_students" type="text" class="w-full p-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">사전마감여부</label>
            <input v-model="editRegionalModal.form.remarks" type="text" class="w-full p-2 border border-slate-300 rounded-lg text-sm" />
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-600 mb-1">수능최저학력기준</label>
          <textarea v-model="editRegionalModal.form.csat_min" rows="2" class="w-full p-2 border border-slate-300 rounded-lg text-sm font-medium"></textarea>
        </div>
      </div>

      <!-- 푸터 -->
      <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
        <template v-if="!editRegionalModal.isEditing">
          <button @click="editRegionalModal.open = false" class="px-5 py-2 border border-slate-300 bg-white text-slate-700 rounded-xl text-xs font-bold cursor-pointer">닫기</button>
          <button @click="editRegionalModal.isEditing = true" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer border-none flex items-center gap-1.5 shadow-sm">
            <span>✏️ 요강 정보 수정</span>
          </button>
        </template>
        <template v-else>
          <button @click="deleteRegionalRow" class="px-3.5 py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold border border-red-200 cursor-pointer">🗑️ 이 항목 삭제</button>
          <div class="flex gap-2">
            <button @click="editRegionalModal.isEditing = false" class="px-4 py-2 border border-slate-300 bg-white text-slate-600 rounded-lg text-xs font-bold cursor-pointer">취소</button>
            <button @click="saveEditRegionalRow" :disabled="editRegionalModal.saving" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer border-none">
              {{ editRegionalModal.saving ? '저장 중…' : '💾 변경사항 저장' }}
            </button>
          </div>
        </template>
      </div>

    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import { supabase } from '../../utils/supabaseClient.js'
import {
  getUniversities, createUniversity, updateUniversity, deleteUniversity,
  getUnivTracks, createTrack, updateTrack, deleteTrack,
  getQuotaStats, exportQuotaStats, getTrackRecommendedList,
  downloadUnivSettingsTemplate, exportUnivSettings, previewUnivSettings, importUnivSettings,
  blobErrMsg,
  getRegionalRecommendations, exportRegionalRecommendations, deleteRegionalRecommendations, importRegionalRecommendations, syncRegionalToUniversities,
  updateRegionalRecommendation, deleteSingleRegionalRecommendation,
  getDisclosureCount,
  syncPrincipalUnivsFromGoogleSheet,
} from '../../api/admin.js'
import HelpBox from '../common/HelpBox.vue'
import { dialog } from '../common/dialog.js'

const HELP = {
  title: '도움말 — 대학 설정',
  intro: '학생이 지원할 대학과 모집단위(예: 인문계열, 자연계열)를 등록하고, 학교장추천 가능 인원(정원)을 정하는 곳입니다.',
  items: [
    '"+ 대학 추가"로 대학을 만들고, 그 대학을 클릭한 뒤 "+ 모집단위 추가"로 모집단위를 등록하세요.',
    '정원 설정: 대학 전체 인원만 제한하는 대학이면 대학 정원만 입력하고 모집단위는 무제한으로 두세요. 모집단위별 인원 제한이 있으면 모집단위 정원을 입력하세요.',
    '"재학생 우선"을 켜면 추천 순위에서 재학생이 졸업생보다 항상 앞섭니다. 대학의 "재학생 우선"을 켜면 그 대학의 모든 모집단위도 함께 켜지고, 다시 끄면 모집단위도 함께 꺼집니다.',
    '대학은 끄고 특정 모집단위만 "재학생 우선"으로 둘 수 있습니다. 이 경우 그 모집단위 안에서만 재학생이 먼저 추천되며, 대학 전체 정원으로 인원을 줄일 때도 그 모집단위 내부 순서는 유지됩니다.',
    '라운드가 마감된 동안에는 "재학생 우선"을 바꿀 수 없습니다. 저장된 순위가 마감 시점 기준이라 설정만 바꾸면 순위와 어긋나기 때문입니다. 바꾸려면 라운드를 다시 열고 설정을 고친 뒤 다시 마감하세요. 정원 변경은 마감 중에도 가능합니다.',
    '표의 추천인원 숫자를 누르면 지금까지 그 모집단위로 추천 확정된 학생 목록을 볼 수 있습니다.',
    '"전형요소 - 기초 데이터"에서 "석차연명부" 버튼을 누르면 자동으로 대학별 모집단위도 추가됩니다.',
    '지역별 추천 전형 데이터를 바탕으로 대학 모집단위를 동기화하려면 "지역 전형 동기화" 버튼을 누르세요.',
  ],
}

// ── 정원 입력 서브컴포넌트 ────────────────────────────────────
const QuotaInput = defineComponent({
  props: {
    unlimited: Boolean,
    quota: { type: Number, default: 1 },
  },
  emits: ['update:unlimited', 'update:quota'],
  setup(props, { emit }) {
    return () => h('div', { class: 'flex items-center gap-2' }, [
      h('input', {
        type: 'checkbox',
        checked: props.unlimited,
        class: 'accent-blue-600 w-4 h-4',
        onChange: (e) => emit('update:unlimited', e.target.checked),
      }),
      h('span', { style: 'font-size: 16px; color: #475569; user-select: none;' }, '무제한'),
      !props.unlimited
        ? h('div', { class: 'flex items-center gap-1' }, [
            h('input', {
              type: 'number',
              value: props.quota,
              min: 1,
              style: 'width: 72px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 7px 10px; font-size: 16px;',
              onInput: (e) => emit('update:quota', parseInt(e.target.value) || 1),
            }),
            h('span', { style: 'font-size: 16px; color: #64748b;' }, '명'),
          ])
        : null,
    ])
  },
})

// ── 상태 ──────────────────────────────────────────────────────
const univs           = ref([])
const tracks          = ref([])
const error           = ref('')
const saving          = ref(false)
const syncing         = ref(false)
const downloading     = ref(false)
const disclosureCount = ref(null)  // 정보공시 재학생 수 (% 인원제한 환산용)

async function handleSyncGoogleSheet() {
  syncing.value = true
  try {
    let sheetId = ''
    if (supabase) {
      const { data } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'google_sheet_principal_id')
        .maybeSingle()
      if (data && data.value) sheetId = data.value.trim()
    }

    if (!sheetId) {
      await dialog.alert({
        title: '구글 스프레드시트 ID 필요',
        message: '학교장 추천전형 구글 스프레드시트 ID가 설정되어 있지 않습니다.\n\n[관리자 설정] 탭에서 "1) 학교장 추천자 선발 전형 구글 시트 ID"를 먼저 저장해 주세요.'
      })
      return
    }

    const res = await syncPrincipalUnivsFromGoogleSheet(sheetId)
    await dialog.alert({
      title: '추천 전형 구글 시트 동기화 완료',
      message: `총 ${res.count}건의 대학별 추천전형 요강 데이터가 DB에 연동되었습니다.`
    })
    await Promise.all([loadRegionalRecs(), loadUnivs(), loadQuotaStats()])
  } catch (err) {
    console.error('Failed to sync google sheet:', err)
    await dialog.alert({
      title: '동기화 실패',
      message: err.message || '구글 스프레드시트 연동 중 오류가 발생했습니다.'
    })
  } finally {
    syncing.value = false
  }
}

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

  // 퍼센트 판별: 0 < n < 1 소수(엑셀 raw) OR 명시적 % 기호
  if (!isNaN(num) && num > 0 && num < 1) {
    pct = num * 100  // 0.03 → 3
  } else {
    const pctMatch = str.match(/^(\d+(?:\.\d+)?)\s*%$/)
    if (pctMatch) pct = parseFloat(pctMatch[1])  // "3%" → 3
  }

  if (pct !== null) {
    const pctClean = parseFloat(pct.toPrecision(10))
    if (disclosureCount.value != null && disclosureCount.value > 0) {
      const count = Math.ceil(disclosureCount.value * pct / 100)
      return `${count} (${pctClean}%)`
    }
    // 정보공시 미설정: % 원문 그대로 표시
    return `${pctClean}%`
  }

  // 일반 텍스트 ("없음", "12명", "5" 등)
  return str
}

function getCategory(r) {
  if (!r) return ''
  return String(r.recruitment_quota || r.track_type || '').trim()
}
const addingUniv      = ref(false)
const editingUnivId   = ref(null)
const addingTrack     = ref(false)
const editingTrackId  = ref(null)

const univForm  = ref(emptyUnivForm())
const trackForm = ref(emptyTrackForm())

const quotaStats = ref(null)

// ── 모달 상태 ─────────────────────────────────────────────────
const modal = ref({ open: false, trackName: '', entries: [], loading: false })

// ── 설정 가져오기(diff) 모달 상태 ─────────────────────────────
const settings = ref({
  open: false, loading: false, applying: false,
  fileName: '', file: null,
  errors: [], changes: [], unchangedCount: 0, closedLabels: [], hasBlocked: false,
  applyError: '',
})
const settingsBusy = computed(() => settings.value.loading || settings.value.applying)
const canApplySettings = computed(() =>
  !settings.value.loading && !settings.value.applying &&
  settings.value.errors.length === 0 && !settings.value.hasBlocked &&
  settings.value.changes.length > 0)

const selectedUniv = computed(() => univs.value.find(u => u.id === selectedUnivId.value) ?? null)
const univPrioritize = computed(() => !!(selectedUniv.value?.prioritize_enrolled))

const selectedUnivStats = computed(() => {
  if (!quotaStats.value || !selectedUnivId.value) return null
  return quotaStats.value.univs.find(u => u.univ_id === selectedUnivId.value) ?? null
})

// 기존 tracks 목록에 통계(unit_used, by_round) 병합
const tracksWithStats = computed(() => {
  const statMap = {}
  if (selectedUnivStats.value) {
    for (const t of selectedUnivStats.value.tracks) {
      statMap[t.track_id] = t
    }
  }
  return tracks.value.map(t => ({
    ...t,
    unit_used: statMap[t.id]?.unit_used ?? 0,
    raw_quota_limit: statMap[t.id]?.raw_quota_limit ?? null,  // 원본 % 텍스트
    by_round:  statMap[t.id]?.by_round  ?? [],
  }))
})

// 모달에서 라운드별 그룹핑
const groupedByRound = computed(() => {
  const map = new Map()
  for (const e of modal.value.entries) {
    if (!map.has(e.round_id)) map.set(e.round_id, [])
    map.get(e.round_id).push(e)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([round_id, entries]) => ({ round_id, entries }))
})

function remainingLabel(used, quota) {
  if (quota == null) return '무제한'
  return Math.max(0, quota - used) + '명'
}

// ── 설정 diff: 대학별 그룹핑 + 배지 ───────────────────────────
const settingsGrouped = computed(() => {
  const map = new Map()
  for (const c of settings.value.changes) {
    if (!map.has(c.univ_name)) map.set(c.univ_name, [])
    map.get(c.univ_name).push(c)
  }
  return Array.from(map.entries()).map(([univ_name, rows]) => ({ univ_name, rows }))
})
function badgeLabel(c) {
  if (c.kind === 'cascade') return '자동'
  return c.op === 'create' ? '생성' : '변경'
}
function badgeColor(c) {
  if (c.blocked) return '#ef4444'
  if (c.kind === 'cascade') return '#7c3aed'
  return c.op === 'create' ? '#16a34a' : '#d97706'
}

// ── 설정 양식/내보내기/가져오기 ───────────────────────────────
function saveSettingsBlob(response, fallback) {
  const url = URL.createObjectURL(new Blob([response.data]))
  const a = document.createElement('a')
  a.href = url; a.download = fallback; a.click()
  URL.revokeObjectURL(url)
}
async function dlSettingsTemplate() {
  try {
    const a = document.createElement('a')
    const baseUrl = import.meta.env.BASE_URL || '/'
    const targetDataPath = baseUrl.endsWith('/') ? `${baseUrl}data/` : `${baseUrl}/data/`
    a.href = encodeURI(`${targetDataPath}학교장추천전형_대학설정_양식.xlsx`)
    a.download = '학교장추천전형_대학설정_양식.xlsx'
    a.click()
  } catch (e) { error.value = await blobErrMsg(e) }
}
async function dlSettingsExport() {
  try { saveSettingsBlob(await exportUnivSettings(), 'univ_settings.xlsx') }
  catch (e) { error.value = await blobErrMsg(e) }
}

async function onSettingsFile(evt) {
  const file = evt.target.files?.[0]
  evt.target.value = '' // 같은 파일 재선택 허용
  if (!file) return
  error.value = ''
  settings.value = {
    open: true, loading: true, applying: false,
    fileName: file.name, file,
    errors: [], changes: [], unchangedCount: 0, closedLabels: [], hasBlocked: false,
    applyError: '',
  }
  try {
    const p = await previewUnivSettings(file)
    settings.value.errors = p.errors ?? []
    settings.value.changes = p.changes ?? []
    settings.value.unchangedCount = p.unchanged_count ?? 0
    settings.value.closedLabels = p.closed_round_labels ?? []
    settings.value.hasBlocked = !!p.has_blocked
  } catch (e) {
    settings.value.errors = [e.response?.data ?? e.message ?? '미리보기에 실패했습니다']
  } finally {
    settings.value.loading = false
  }
}

function closeSettings() {
  if (settings.value.applying) return
  settings.value.open = false
  settings.value.file = null
}

async function applySettings() {
  if (!canApplySettings.value || !settings.value.file) return
  settings.value.applying = true
  settings.value.applyError = ''
  try {
    await importUnivSettings(settings.value.file)
    settings.value.open = false
    settings.value.file = null
    await Promise.all([loadUnivs(), loadQuotaStats()])
    if (selectedUnivId.value) await loadTracks(selectedUnivId.value)
  } catch (e) {
    // import 가 preview 이후 상태 변화로 거부되면(422/409) 오류 목록을 그대로 보여준다
    const d = e.response?.data
    if (d && typeof d === 'object' && Array.isArray(d.errors) && d.errors.length) {
      settings.value.applyError = d.errors.join(' / ')
    } else {
      settings.value.applyError = typeof d === 'string' ? d : (e.message ?? '적용에 실패했습니다')
    }
  } finally {
    settings.value.applying = false
  }
}

// ── 통계 로드 ─────────────────────────────────────────────────
async function loadQuotaStats() {
  try {
    quotaStats.value = await getQuotaStats()
  } catch (_) {
    // 통계 로드 실패는 조용히 무시 (탭 자체를 막지 않음)
  }
}

// ── 내보내기 ──────────────────────────────────────────────────
async function doExportQuotaStats(all = false) {
  if (downloading.value) return
  downloading.value = true
  try {
    const res = await exportQuotaStats(all ? null : selectedUnivId.value)
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    a.download = all
      ? `전체_명단_정원현황_${date}.xlsx`
      : `${selectedUniv.value?.univ_name ?? '대학'}_명단_정원현황_${date}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    // blob 요청 오류 — response.data가 Blob이므로 blobErrMsg로 문자열화
    error.value = await blobErrMsg(e)
  } finally {
    downloading.value = false
  }
}

// ── 추천 확정 목록 모달 ───────────────────────────────────────
async function openRecommendedModal(track) {
  modal.value = { open: true, trackName: track.track_name, entries: [], loading: true }
  try {
    modal.value.entries = await getTrackRecommendedList(track.id)
  } catch (e) {
    error.value = e.response?.data ?? e.message
    modal.value.open = false
  } finally {
    modal.value.loading = false
  }
}

// ── 폼 초기값 ─────────────────────────────────────────────────
function emptyUnivForm() {
  return { univ_name: '', unlimited: true, total_quota: 1, prioritize_enrolled: true }
}
function emptyTrackForm() {
  return { track_name: '', unlimited: true, unit_quota: 1, prioritize_enrolled: false }
}
function univToForm(u) {
  return { univ_name: u.univ_name, unlimited: u.total_quota == null, total_quota: u.total_quota ?? 1, prioritize_enrolled: !!u.prioritize_enrolled }
}
function trackToForm(t) {
  return { track_name: t.track_name, unlimited: t.unit_quota == null, unit_quota: t.unit_quota ?? 1, prioritize_enrolled: !!t.prioritize_enrolled }
}
function univFormToBody(f) {
  return { univ_name: f.univ_name.trim(), total_quota: f.unlimited ? null : f.total_quota, prioritize_enrolled: f.prioritize_enrolled }
}
function trackFormToBody(f) {
  return { track_name: f.track_name.trim(), unit_quota: f.unlimited ? null : f.unit_quota, prioritize_enrolled: f.prioritize_enrolled }
}

// ── 로드 ──────────────────────────────────────────────────────
async function loadUnivs() {
  try { univs.value = await getUniversities() }
  catch (e) { error.value = e.response?.data ?? e.message }
}
async function loadTracks(univId) {
  try { tracks.value = await getUnivTracks(univId) }
  catch (e) { error.value = e.response?.data ?? e.message }
}

// ── 대학 선택 ─────────────────────────────────────────────────
function selectUniv(id) {
  if (selectedUnivId.value === id) return
  selectedUnivId.value = id
  editingTrackId.value = null
  addingTrack.value    = false
  tracks.value         = []
  loadTracks(id)
}

// ── 대학 CRUD ─────────────────────────────────────────────────
function startAddUniv() { univForm.value = emptyUnivForm(); editingUnivId.value = null; addingUniv.value = true }

async function saveAddUniv() {
  saving.value = true; error.value = ''
  try { await createUniversity(univFormToBody(univForm.value)); addingUniv.value = false; await loadUnivs() }
  catch (e) { error.value = e.response?.data ?? e.message }
  finally { saving.value = false }
}

function startEditUniv(u) { addingUniv.value = false; editingUnivId.value = u.id; univForm.value = univToForm(u) }

async function saveEditUniv(id) {
  const body = univFormToBody(univForm.value)
  const current = univs.value.find(u => u.id === id)
  // 대학 재학생 우선 값이 바뀌면 그 대학 모든 모집단위에 cascade 된다(양방향).
  // 실제로 값이 달라지는 모집단위가 있을 때만 확인 — 무변경엔 유령 확인을 띄우지 않는다.
  if (current && !!current.prioritize_enrolled !== body.prioritize_enrolled) {
    const uTracks = selectedUnivId.value === id ? tracks.value : await getUnivTracks(id)
    const changing = uTracks.filter(t => !!t.prioritize_enrolled !== body.prioritize_enrolled).length
    if (changing > 0) {
      const ok = await dialog.confirm({
        title: '재학생 우선 설정 변경',
        message: `이 대학의 모든 모집단위 재학생 우선 설정이 대학 설정값으로 통일됩니다.\n개별 지정한 모집단위 설정 ${changing}곳이 사라집니다.`,
        confirmText: '변경',
        level: 'warn',
      })
      if (!ok) return
    }
  }
  saving.value = true; error.value = ''
  try {
    await updateUniversity(id, body)
    editingUnivId.value = null
    await loadUnivs()
    if (selectedUnivId.value === id) await loadTracks(id)
  }
  catch (e) { error.value = e.response?.data ?? e.message }
  finally { saving.value = false }
}

async function removeUniv(id) {
  if (!(await dialog.confirm({
    title: '대학 삭제',
    message: '이 대학과 모든 모집단위를 삭제하시겠습니까?',
    confirmText: '삭제',
    level: 'danger',
    dangerNotice: '삭제된 대학·모집단위 정보는 복구할 수 없습니다. 이 대학과 연관된 기초 데이터(석차연명부 포함)도 함께 삭제됩니다.',
    finalConfirmText: '영구 삭제',
  }))) return
  saving.value = true; error.value = ''
  try {
    await deleteUniversity(id)
    if (selectedUnivId.value === id) { selectedUnivId.value = null; tracks.value = [] }
    await loadUnivs()
  } catch (e) { error.value = e.response?.data ?? e.message }
  finally { saving.value = false }
}

// ── 모집단위 CRUD ─────────────────────────────────────────────
function startAddTrack() {
  trackForm.value = emptyTrackForm()
  if (univPrioritize.value) trackForm.value.prioritize_enrolled = true
  editingTrackId.value = null
  addingTrack.value = true
}

async function saveAddTrack() {
  if (!selectedUnivId.value) return
  saving.value = true; error.value = ''
  try { await createTrack(selectedUnivId.value, trackFormToBody(trackForm.value)); addingTrack.value = false; await loadTracks(selectedUnivId.value) }
  catch (e) { error.value = e.response?.data ?? e.message }
  finally { saving.value = false }
}

function startEditTrack(t) {
  addingTrack.value = false
  editingTrackId.value = t.id
  trackForm.value = trackToForm(t)
  if (univPrioritize.value) trackForm.value.prioritize_enrolled = true
}

async function saveEditTrack(id) {
  saving.value = true; error.value = ''
  try { await updateTrack(id, trackFormToBody(trackForm.value)); editingTrackId.value = null; await loadTracks(selectedUnivId.value) }
  catch (e) { error.value = e.response?.data ?? e.message }
  finally { saving.value = false }
}

async function removeTrack(id) {
  if (!(await dialog.confirm({
    title: '모집단위 삭제',
    message: '이 모집단위를 삭제하시겠습니까?',
    confirmText: '삭제',
    level: 'danger',
    dangerNotice: '삭제된 모집단위 정보는 복구할 수 없습니다.',
    finalConfirmText: '영구 삭제',
  }))) return
  saving.value = true; error.value = ''
  try { await deleteTrack(id); await loadTracks(selectedUnivId.value) }
  catch (e) { error.value = e.response?.data ?? e.message }
  finally { saving.value = false }
}

// ── 수도권 학교장추천전형 (regional_recommendations) ──────────────
const subTab = ref('regional')
const regionalRecs = ref([])
const regionalLoading = ref(false)
const regionalSearch = ref('')

async function loadRegionalRecs() {
  regionalLoading.value = true
  try {
    regionalRecs.value = await getRegionalRecommendations()
  } catch (e) {
    error.value = e.message || '추천전형 정보 조회에 실패했습니다.'
  } finally {
    regionalLoading.value = false
  }
}

async function downloadRegionalBackup() {
  saving.value = true
  error.value = ''
  try {
    const blob = await exportRegionalRecommendations()
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `학교장추천전형요강_백업_${today}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    error.value = e.message || '백업 파일 생성 중 오류가 발생했습니다.'
  } finally {
    saving.value = false
  }
}

async function onRegionalFile(evt) {
  const file = evt.target.files?.[0]
  evt.target.value = ''
  if (!file) return
  saving.value = true
  error.value = ''
  try {
    const res = await importRegionalRecommendations(file)
    await loadRegionalRecs()

    // 엑셀 업로드 후 universities 테이블 자동 동기화 (결과 보고서 연동)
    let syncRes = null
    try { syncRes = await syncRegionalToUniversities() } catch (_) {}
    await loadUnivs()

    let msg = `총 ${res.count}건의 학교장추천전형 정보가 성공적으로 등록되었습니다.`
    if (syncRes) {
      msg += `\n\n✅ 대학 설정 및 결과 보고서가 자동으로 동기화되었습니다. (${syncRes.count}개 대학/전형)`
    }
    await dialog.alert({ title: '업로드 완료', message: msg })
  } catch (e) {
    error.value = e.message || '엑셀 가져오기 중 오류가 발생했습니다.'
  } finally {
    saving.value = false
  }
}

async function doSyncRegionalToUnivs() {
  saving.value = true
  error.value = ''
  try {
    const res = await syncRegionalToUniversities()
    await loadUnivs()

    let msg = `1단계 엑셀 요강 데이터(인원제한, 지원대상, 졸업생 조건)를 바탕으로 총 ${res.count}개 대학/전형 정원 정보가 2단계 추천 목록에 성공적으로 생성 및 동기화되었습니다.`

    if (res.updatedCount > 0) {
      msg += `\n✅ 기존 항목 중 % 인원제한 또는 0명으로 잘못 저장된 ${res.updatedCount}건의 정원이 현재 정보공시 재학생 수 기준으로 재계산되어 업데이트되었습니다.`
    }

    if (res.percentWarnings && res.percentWarnings.length > 0) {
      msg += `\n\n⚠️ 인원제한이 %로 표시된 항목 ${res.percentWarnings.length}건이 무제한으로 처리되었습니다.\n환경설정에서 [정보공시 재학생 수]를 입력한 후 다시 동기화하면 정확한 인원이 산정됩니다.\n\n해당 항목:\n` + res.percentWarnings.join('\n')
    }

    await dialog.alert({
      title: '자동 생성 완료',
      message: msg,
    })
  } catch (e) {
    error.value = e.message || '동기화 중 오류가 발생했습니다.'
  } finally {
    saving.value = false
  }
}


async function clearRegionalRecs() {
  if (!(await dialog.confirm({
    title: '전형 정보 전체 삭제',
    message: '등록된 학교장추천전형 엑셀 정보 및 대학 설정, 결과 보고서 데이터를 모두 초기화하시겠습니까?',
    confirmText: '전체 삭제',
    level: 'danger',
  }))) return
  saving.value = true
  try {
    await deleteRegionalRecommendations()
    await loadRegionalRecs()
    await loadUnivs()  // universities 테이블도 초기화됐으므로 대학 설정 목록 갱신
  } catch (e) {
    error.value = e.message || '삭제 중 오류가 발생했습니다.'
  } finally {
    saving.value = false
  }
}

// ── 1단계 요강 정보 수동 수정 모달 ──────────────────────────────
const editRegionalModal = ref({
  open: false,
  isEditing: false,
  saving: false,
  form: {
    id: '',
    region: '',
    univ_name: '',
    recruitment_quota: '',
    track_name: '',
    quota_limit: '',
    target_students: '',
    grad_condition: '',
    csat_min: '',
    evaluation_method: '',
    reflected_subjects: '',
    reflected_indicators: '',
    course_unit_reflection: '',
    grade_ratio: '',
    grad_semesters: '',
    career_elective_method: '',
    remarks: '',
  }
})

function openEditRegionalModal(r) {
  editRegionalModal.value = {
    open: true,
    isEditing: false,
    saving: false,
    form: {
      id: r.id,
      region: r.region || '',
      univ_name: r.univ_name || '',
      recruitment_quota: r.recruitment_quota || '',
      track_name: r.track_name || '',
      quota_limit: r.quota_limit || '',
      target_students: r.target_students || '',
      grad_condition: r.grad_condition || '',
      csat_min: r.csat_min || '',
      evaluation_method: r.evaluation_method || '',
      reflected_subjects: r.reflected_subjects || '',
      reflected_indicators: r.reflected_indicators || '',
      course_unit_reflection: r.course_unit_reflection || '',
      grade_ratio: r.grade_ratio || '',
      grad_semesters: r.grad_semesters || '',
      career_elective_method: r.career_elective_method || '',
      remarks: r.remarks || '',
    }
  }
}

async function saveEditRegionalRow() {
  const f = editRegionalModal.value.form
  if (!f.univ_name || !f.track_name) {
    await dialog.alert({ title: '입력 오류', message: '대학명과 전형명은 필수 입력 항목입니다.' })
    return
  }
  editRegionalModal.value.saving = true
  try {
    await updateRegionalRecommendation(f.id, f)
    await syncRegionalToUniversities()
    await Promise.all([loadRegionalRecs(), loadUnivs(), loadQuotaStats()])
    editRegionalModal.value.isEditing = false
    await dialog.alert({ title: '수정 완료', message: `${f.univ_name} (${f.track_name}) 정보가 성공적으로 수정되었습니다.` })
  } catch (e) {
    await dialog.alert({ title: '수정 실패', message: e.message || '정보 수정 중 오류가 발생했습니다. DB 권한을 확인해 주세요.' })
  } finally {
    editRegionalModal.value.saving = false
  }
}

async function deleteRegionalRow() {
  const f = editRegionalModal.value.form
  if (!(await dialog.confirm({
    title: '항목 삭제',
    message: `${f.univ_name} (${f.track_name}) 항목을 삭제하시겠습니까?`,
    confirmText: '삭제',
    level: 'danger'
  }))) return

  editRegionalModal.value.saving = true
  try {
    await deleteSingleRegionalRecommendation(f.id)
    await loadRegionalRecs()
    editRegionalModal.value.open = false
  } catch (e) {
    await dialog.alert({ title: '삭제 실패', message: e.message || '항목 삭제 중 오류가 발생했습니다.' })
  } finally {
    editRegionalModal.value.saving = false
  }
}

const filteredRegionalRecs = computed(() => {
  if (!regionalSearch.value.trim()) return regionalRecs.value
  const kw = regionalSearch.value.trim().toLowerCase()
  return regionalRecs.value.filter(r =>
    (r.univ_name && r.univ_name.toLowerCase().includes(kw)) ||
    (r.track_name && r.track_name.toLowerCase().includes(kw)) ||
    (r.region && r.region.toLowerCase().includes(kw))
  )
})

onMounted(async () => {
  loadUnivs()
  loadQuotaStats()
  loadRegionalRecs()
  disclosureCount.value = await getDisclosureCount()
})
</script>
