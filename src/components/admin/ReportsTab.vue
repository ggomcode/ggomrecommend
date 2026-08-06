<template>
  <div class="flex flex-col h-full overflow-hidden p-6" style="background: #f8fafc;">
    <!-- ── 상단 헤더 ────────────────────────────────────────── -->
    <div class="flex items-center justify-between shrink-0 mb-5">
      <div>
        <h1 class="text-2xl font-bold text-slate-900" style="margin: 0;">결과 보고서 및 프린트</h1>
        <p class="text-xs text-slate-500 mt-1" style="margin: 4px 0 0;">
          학업성적관리위원회 및 교내 보관용 학교장추천전형 대학별·학과별 추천 확정/대기 학생 명단 및 정원 현황 보고서입니다.
        </p>
      </div>

      <!-- 우측 액션 버튼들 -->
      <div class="flex items-center gap-3">
        <button
          class="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
          :disabled="loading"
          @click="loadData"
        >
          <span>🔄 데이터 새로고침</span>
        </button>
        <button
          class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors border-none"
          :disabled="downloading"
          @click="downloadExcel"
        >
          <span>📥 엑셀 내보내기</span>
        </button>
        <button
          class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors border-none"
          @click="printReport"
        >
          <span>🖨️ 보고서 인쇄 (PDF)</span>
        </button>
        <button
          class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors border-none"
          @click="printReportRecommendOnly"
        >
          <span>🖨️ 보고서 인쇄 (PDF, 추천 대학만)</span>
        </button>
      </div>
    </div>

    <!-- ── 인쇄 전용 영역 (Print Only View) ───────────────────── -->
    <div class="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="report-print-area">
      <!-- 보고서 헤더 (화면 & 인쇄 공통) -->
      <div class="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
        <div>
          <span class="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">{{ schoolName }}</span>
          <h2 class="text-xl font-black text-slate-900" style="margin: 0;">학교장추천전형 추천 명단</h2>
        </div>
        <!-- 결재란 (인쇄용) -->
        <div class="hidden print:block">
          <table style="border-collapse: collapse; text-align: center; font-size: 11px; margin: 0; width: auto; border: 1px solid #cbd5e1;">
            <tr>
              <th rowspan="2" style="padding: 4px 8px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: bold; font-size: 11px; line-height: 1.2; width: 28px;">결<br>재</th>
              <td style="padding: 4px 12px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: bold; width: 60px; font-size: 11px;">계</td>
              <td style="padding: 4px 12px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: bold; width: 60px; font-size: 11px;">부장</td>
              <td style="padding: 4px 12px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: bold; width: 60px; font-size: 11px;">교감</td>
              <td style="padding: 4px 12px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: bold; width: 60px; font-size: 11px;">교장</td>
            </tr>
            <tr>
              <td style="height: 48px; border: 1px solid #cbd5e1; min-width: 60px;"></td>
              <td style="height: 48px; border: 1px solid #cbd5e1; min-width: 60px;"></td>
              <td style="height: 48px; border: 1px solid #cbd5e1; min-width: 60px;"></td>
              <td style="height: 48px; border: 1px solid #cbd5e1; min-width: 60px;"></td>
            </tr>
          </table>
        </div>
      </div>

      <!-- 로딩 / 데이터 테이블 -->
      <div v-if="loading" class="flex-1 flex items-center justify-center p-12 text-slate-400 font-medium">
        보고서 데이터를 불러오는 중입니다…
      </div>

      <div v-else-if="!stats || stats.length === 0" class="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
        <p class="text-base font-bold text-slate-600 mb-1">등록된 정원 현황 및 추천 학생 데이터가 없습니다.</p>
        <p class="text-xs">대학 정원 설정 및 라운드 추천을 진행한 후 다시 확인해 주세요.</p>
      </div>

      <div v-else class="flex-1 min-h-0 overflow-y-auto p-6">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-100 text-slate-700 border-b-2 border-slate-300">
              <th class="p-3 font-bold w-10 text-center">No</th>
              <th class="p-3 font-bold whitespace-nowrap w-28">대학명</th>
              <th class="p-3 font-bold whitespace-nowrap">모집단위 (학과)</th>
              <th class="p-3 font-bold text-center w-24 whitespace-nowrap">추천 제한 정원</th>
              <th class="p-3 font-bold text-center w-22 whitespace-nowrap">추천 확정 인원</th>
              <th class="p-3 font-bold text-center w-14 whitespace-nowrap">(재학생)</th>
              <th class="p-3 font-bold text-center w-14 whitespace-nowrap">(졸업생)</th>
              <th class="p-3 font-bold text-left whitespace-nowrap" style="min-width: 260px;">추천 학생 (학번/성명)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="item in displayedStats" :key="item.no" class="hover:bg-slate-50/80 text-slate-700 transition-colors">
              <td class="p-3 text-center text-slate-500 font-medium">{{ item.no }}</td>
              <td class="p-3 font-bold text-slate-900 whitespace-nowrap w-28">
                <span class="text-sm font-extrabold text-blue-950">{{ item.univ_name }}</span>
              </td>
              <td class="p-3 font-bold text-slate-800 text-sm whitespace-nowrap">{{ item.track_name }}</td>
              <td class="p-3 text-center font-semibold text-slate-700">
                {{ formatQuotaDisplay(item.unit_quota, item.raw_quota_limit) }}
              </td>
              <td class="p-3 text-center font-extrabold text-blue-600">
                {{ item.unit_used > 0 ? item.unit_used + '명' : '-' }}
              </td>
              <td class="p-3 text-center font-semibold text-slate-700">
                {{ item.enrolled_used > 0 ? item.enrolled_used + '명' : '-' }}
              </td>
              <td class="p-3 text-center font-semibold text-slate-700">
                {{ item.grad_used > 0 ? item.grad_used + '명' : '-' }}
              </td>
              <td class="p-3 text-left font-medium text-slate-800 whitespace-nowrap" style="min-width: 260px;">
                <div v-if="item.students && item.students.length > 0" class="flex flex-col gap-0.5">
                  <div v-for="std in item.students" :key="std.student_code" class="whitespace-nowrap">
                    {{ std.student_code }} {{ std.name }} <span class="text-slate-500 font-normal text-[11px]">{{ std.suffix }}</span>
                  </div>
                </div>
                <span v-else class="text-slate-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 하단 선발 인원 통계 (상시 표시 및 인쇄 영역 포함) -->
        <div class="mt-6 border border-slate-200 rounded-xl bg-slate-50/50 p-4 text-xs font-semibold text-slate-700 flex justify-between items-center print:border-slate-300">
          <div class="flex items-center gap-1">
            <span class="text-xs font-bold text-slate-800">📊 학교장추천 선발 인원 통계</span>
          </div>
          <div class="flex gap-6 items-center">
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400">총 추천 확정:</span>
              <span class="text-sm font-extrabold text-blue-600">{{ totalRecommendedStats.total }}명</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400">재학생:</span>
              <span class="font-bold text-slate-800">{{ totalRecommendedStats.enrolled }}명</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400">졸업생:</span>
              <span class="font-bold text-slate-800">{{ totalRecommendedStats.grad }}명</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { getQuotaStats, exportQuotaStats, getDisclosureCount } from '../../api/admin.js'
import { schoolName } from '../../utils/schoolConfig.js'
import { dialog } from '../common/dialog.js'
import { supabase } from '../../utils/supabaseClient.js'
import { decryptText } from '../../utils/cryptoUtils.js'
import { formatScore } from '../../utils/scorePreviewShared.js'

const loading = ref(false)
const downloading = ref(false)
const stats = ref([])
const disclosureCount = ref(null)
const recommendedList = ref([])
const studentMap = ref({})

/**
 * 표시용 인원 포맷 함수
 * raw_quota_limit이 %이면 '10명 (3%)' 형식, 아니면 '미지정' 또는 '무제한'
 */
function formatQuotaDisplay(unitQuota, rawQuotaLimit) {
  // raw에서 % 여부 판별
  if (rawQuotaLimit) {
    const str = String(rawQuotaLimit).trim()
    const num = parseFloat(str)
    let pct = null
    if (!isNaN(num) && num > 0 && num < 1) {
      pct = num * 100
    } else {
      const m = str.match(/^(\d+(?:\.\d+)?)\s*%$/)
      if (m) pct = parseFloat(m[1])
    }
    if (pct !== null) {
      const pctClean = parseFloat(pct.toPrecision(10))
      if (unitQuota != null && unitQuota > 0) {
        return `${unitQuota}명 (${pctClean}%)`
      }
      // disclosureCount 베이스 폴백 (다시 데이터 로드 시 자동 해결)
      if (disclosureCount.value) {
        const calc = Math.ceil(disclosureCount.value * pct / 100)
        return `${calc}명 (${pctClean}%)`
      }
      return `${pctClean}%`  // disclosureCount 미설정
    }
  }
  if (unitQuota != null) return `${unitQuota}명`
  return '무제한'
}

const flatStats = computed(() => {
  const list = []
  let index = 1
  for (const u of stats.value) {
    for (const t of (u.tracks || [])) {
      const trackApps = recommendedList.value.filter(ap => ap.univ_id === t.track_id)
      
      const hasQuota = t.unit_quota != null
      
      // 정원제한이 있는 경우 순위 오름차순, 없는 경우 학번 오름차순
      trackApps.sort((a, b) => {
        if (hasQuota) {
          return a.rank - b.rank
        } else {
          return a.student_code.localeCompare(b.student_code)
        }
      })

      const studentsArray = trackApps.map(ap => {
        return {
          student_code: ap.student_code,
          name: ap.name,
          suffix: hasQuota ? `(${ap.rank}위, ${ap.score_text})` : ''
        }
      })

      list.push({
        no: index++,
        univ_name: u.univ_name,
        region: u.region,
        track_name: t.track_name,
        track_id: t.track_id,
        unit_quota: t.unit_quota,
        raw_quota_limit: t.raw_quota_limit ?? null,
        unit_used: t.unit_used || 0,
        enrolled_used: t.enrolled_used || 0,
        grad_used: t.grad_used || 0,
        remaining_quota: t.unit_quota != null ? Math.max(0, t.unit_quota - (t.unit_used || 0)) : null,
        students: studentsArray
      })
    }
  }
  return list
})

const printOnlyWithRecommendations = ref(false)

const displayedStats = computed(() => {
  if (printOnlyWithRecommendations.value) {
    return flatStats.value
      .filter(item => item.unit_used > 0)
      .map((item, idx) => ({ ...item, no: idx + 1 }))
  }
  return flatStats.value
})

const totalRecommendedStats = computed(() => {
  let total = 0
  let enrolled = 0
  let grad = 0
  for (const item of flatStats.value) {
    total += item.unit_used
    enrolled += item.enrolled_used
    grad += item.grad_used
  }
  return { total, enrolled, grad }
})

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
})

async function loadData() {
  loading.value = true
  try {
    stats.value = await getQuotaStats()
    if (supabase) {
      // 1. 순위 계산을 위해 포기하지 않은 모든 지원서 및 학생 데이터 로드
      const [{ data: allApps }, { data: students }] = await Promise.all([
        supabase.from('applications').select('*').eq('is_abandoned', false),
        supabase.from('enrolled_students').select('id, name, student_code, gpa_overall')
      ])

      const studentMapLocal = {}
      for (const s of (students || [])) {
        const decName = await decryptText(s.name)
        studentMapLocal[s.id] = {
          id: s.id,
          name: decName,
          student_code: s.student_code,
          gpa_overall: s.gpa_overall
        }
      }
      studentMap.value = studentMapLocal

      // 2. 각 라운드별 & 대학(univ_id)별 지원서를 그룹화하여 석차 계산
      const grouped = {}
      allApps?.forEach(ap => {
        const key = `${ap.univ_id}-${ap.round}`
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(ap)
      })

      const rankMap = {}
      Object.keys(grouped).forEach(key => {
        const list = grouped[key]
        list.sort((a, b) => {
          const stA = studentMapLocal[a.student_id] || {}
          const stB = studentMapLocal[b.student_id] || {}

          const scoreA = a.univ_calc_score != null ? Number(a.univ_calc_score) : (a.manual_score != null ? Number(a.manual_score) : null)
          const scoreB = b.univ_calc_score != null ? Number(b.univ_calc_score) : (b.manual_score != null ? Number(b.manual_score) : null)

          if (scoreA !== null && scoreB !== null && scoreA !== scoreB) {
            return scoreB - scoreA
          }

          const gpaA = stA.gpa_overall != null ? Number(stA.gpa_overall) : 99
          const gpaB = stB.gpa_overall != null ? Number(stB.gpa_overall) : 99

          if (gpaA !== gpaB) {
            return gpaA - gpaB
          }

          return 0
        })

        list.forEach((ap, idx) => {
          rankMap[ap.id] = idx + 1
        })
      })

      // 3. 추천 확정된 지원서 목록만 필터링하여 순위 및 환산점수/석차등급 텍스트 세팅
      const recommendedApps = allApps?.filter(ap => ap.is_recommended) || []
      recommendedList.value = recommendedApps.map(ap => {
        const s = studentMapLocal[ap.student_id] || {}
        const rank = rankMap[ap.id] || 1

        const scoreVal = ap.univ_calc_score != null ? ap.univ_calc_score : ap.manual_score
        let scoreText = ''
        if (scoreVal != null && Number(scoreVal) > 0) {
          scoreText = `${formatScore(scoreVal)}점`
        } else if (s.gpa_overall != null && Number(s.gpa_overall) > 0) {
          scoreText = `${Number(s.gpa_overall).toFixed(2)}등급`
        } else {
          scoreText = '-'
        }

        return {
          id: ap.id,
          student_id: ap.student_id,
          univ_id: ap.univ_id,
          round: ap.round,
          student_code: s.student_code || '',
          name: s.name || '',
          rank: rank,
          score_text: scoreText
        }
      })
    }
  } catch (e) {
    await dialog.alert({ title: '데이터 조회 실패', message: e.message || '보고서 데이터 조회 중 오류가 발생했습니다.' })
  } finally {
    loading.value = false
  }
}

async function downloadExcel() {
  downloading.value = true
  try {
    const blob = await exportQuotaStats(true)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `학교장추천전형_추천명단_및_정원소진현황_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    await dialog.alert({ title: '내보내기 실패', message: e.message || '엑셀 다운로드 중 오류가 발생했습니다.' })
  } finally {
    downloading.value = false
  }
}

function printReport() {
  printOnlyWithRecommendations.value = false
  window.print()
}

async function printReportRecommendOnly() {
  printOnlyWithRecommendations.value = true
  await nextTick()
  window.print()
}

onMounted(async () => {
  disclosureCount.value = await getDisclosureCount()
  loadData()
  window.addEventListener('afterprint', () => {
    printOnlyWithRecommendations.value = false
  })
})
</script>

<style>
@media print {
  @page {
    size: A4 landscape;
    margin: 10mm;
  }
  /* 사이드바 및 인쇄에 불필요한 버튼/레이아웃 완전 숨김 */
  aside,
  button,
  .no-print {
    display: none !important;
  }
  body * {
    visibility: hidden;
  }
  #report-print-area, #report-print-area * {
    visibility: visible;
  }
  #report-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100% !important;
    border: none !important;
    box-shadow: none !important;
  }
}
</style>
