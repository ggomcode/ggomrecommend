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
          <p class="text-base font-semibold" style="color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; margin: 0 0 4px;">
            Teacher Utility Kit
          </p>
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

      <!-- ③ 현재 라운드 -->
      <div class="rounded-xl" style="padding: 20px 24px; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);">
        <SectionLabel title="현재 추천 선발" />
        <div v-if="data.round" class="flex items-center gap-3 flex-wrap">
          <span class="text-3xl font-bold" style="color: #1e293b;">{{ totalRounds === 1 ? '추천 선발' : `${data.round.id}차 추천 선발` }}</span>
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
          <span v-if="data.round.opened_at" class="text-base ml-auto" style="color: #94a3b8;">접수 시작일 {{ data.round.opened_at.slice(0, 10) }}</span>
        </div>
        <div v-else class="flex items-center justify-between">
          <p class="text-base" style="color: #94a3b8;">현재 진행 중인 추천 선발이 없습니다.</p>
        </div>
      </div>

      <!-- ④ 학급별 지원자 현황 (라운드 있을 때만) -->
      <template v-if="data.round">
        <div class="rounded-xl overflow-hidden flex flex-col" style="min-height: 200px; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);">
          <div style="padding: 20px 24px 0;">
            <SectionLabel :title="totalRounds === 1 ? '학급별 지원자 현황' : '이번 추천 선발 · 학급별 지원자 현황'" />
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
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="c in data.classes"
                    :key="`${c.grade}-${c.class_no}`"
                    style="border-bottom: 1px solid #f1f5f9; transition: background 0.1s;"
                    :style="c.submitted === 0 ? { background: '#fef2f2' } : {}"
                    class="hover:bg-slate-50"
                  >
                    <td class="text-base font-semibold" style="padding: 14px 20px; color: #1e293b;">
                      {{ c.grade }}학년 {{ c.class_no }}반
                    </td>
                    <td class="text-base" style="padding: 14px 20px; color: #475569;">
                      {{ c.teacher_name ?? '—' }}
                    </td>
                    <td class="text-base text-right" style="padding: 14px 20px;">
                      <span v-if="c.submitted === 0" class="flex items-center justify-end gap-1 font-bold" style="color: #ef4444;">
                        <AlertTriangle :size="16" />
                        0명
                      </span>
                      <span v-else class="font-semibold" style="color: #1e293b;">{{ c.submitted }}명</span>
                    </td>
                  </tr>
                  <!-- 졸업생 행 -->
                  <tr
                    v-if="data.graduated"
                    style="border-bottom: 1px solid #f1f5f9; transition: background 0.1s;"
                    :style="data.graduated.submitted === 0 ? { background: '#fef2f2' } : {}"
                    class="hover:bg-slate-50"
                  >
                    <td class="text-base font-semibold" style="padding: 14px 20px; color: #1e293b;">졸업생 담당</td>
                    <td class="text-base" style="padding: 14px 20px; color: #475569;">{{ data.graduated.teacher_name ?? '관리자' }}</td>
                    <td class="text-base text-right" style="padding: 14px 20px;">
                      <span v-if="data.graduated.submitted === 0" class="flex items-center justify-end gap-1 font-bold" style="color: #ef4444;">
                        <AlertTriangle :size="16" />
                        0명
                      </span>
                      <span v-else class="font-semibold" style="color: #1e293b;">{{ data.graduated.submitted }}명</span>
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
                  <th style="width: 48px; padding: 14px 20px;"></th>
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
                    <td style="padding: 14px 20px 14px 28px;">
                      <MiniPie
                        v-if="track.unit_quota != null"
                        :filled="track.applicants || 0"
                        :total="track.unit_quota || 0"
                        :size="20"
                      />
                      <span v-else class="text-base font-semibold" style="color: #94a3b8;">∞</span>
                    </td>
                    <!-- 모집단위명 -->
                    <td class="text-base" style="padding: 14px 20px; color: #1e293b;">{{ track.track_name }}</td>
                    <!-- 지원자/정원 -->
                    <td class="text-base tabular-nums" style="padding: 14px 20px;">
                      <span v-if="track.unit_quota !== null">
                        <span class="font-semibold"
                          :style="track.applicants >= track.unit_quota ? { color: '#ef4444' } : { color: '#1e293b' }">
                          {{ track.applicants }}
                        </span>
                        <span style="color: #cbd5e1;"> / </span>
                        <span style="color: #475569;">{{ track.unit_quota }}명</span>
                      </span>
                      <span v-else class="font-semibold" style="color: #1e293b;">{{ track.applicants }}명</span>
                    </td>
                    <!-- 현황 배지 -->
                    <td class="text-right" style="padding: 14px 20px;">
                      <template v-if="track.unit_quota !== null">
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
            class="rounded-xl text-center"
            style="padding: 18px 12px; background: #f8fafc;">
            <p class="text-2xl font-bold" style="color: #1e293b;">{{ stat.value }}</p>
            <p class="text-base mt-0.5" style="color: #94a3b8;">{{ stat.label }}</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, h } from 'vue'
import { supabase } from '../../utils/supabaseClient.js'
import { Copy, Check, AlertTriangle, CheckCircle2, XCircle, ArrowRight } from 'lucide-vue-next'
import { getOverview, getClasses, getStudents, getAreas, getUniversities } from '../../api/admin.js'
import { roundStatusLabel } from '../../data/roundStatus.js'
import { fetchRoundSchedulesMap, computeRoundDisplayStatus } from '../../utils/roundSchedule.js'
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
  return [
    { label: '진행된 추천 선발',  value: totalRounds.value === 1 ? '완료' : `${t.total_rounds ?? 0}차` },
    { label: '누적 지원자',  value: `${t.total_applicants ?? 0}명` },
    { label: '확정 추천자',  value: `${t.confirmed ?? 0}명` },
    { label: '포기자',       value: `${t.abandoned ?? 0}명` },
  ]
})

// ── 데이터 로드 ───────────────────────────────────────────────
onMounted(async () => {
  await loadTotalRounds()
  loadReadiness() // 개요 로드와 병렬 실행 — 실패해도 체크리스트 카드만 숨겨진다
  try {
    schedulesMap.value = await fetchRoundSchedulesMap()
    data.value = await getOverview()
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
</script>
