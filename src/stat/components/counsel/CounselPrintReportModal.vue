<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
    <div class="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 print:shadow-none print:max-w-none print:w-full print:max-h-none print:border-none print:rounded-none">
      
      <!-- Top Modal Bar (인쇄 시 숨김) -->
      <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
        <div class="flex items-center space-x-2.5">
          <span class="text-xl">🖨️</span>
          <div>
            <h3 class="text-sm font-bold m-0 text-white">학부모 상담용 수시 6장 최종 리포트 (A4 1장 규격)</h3>
            <p class="text-[11px] text-slate-300 m-0">상담 테이블 브리핑 및 학부모 귀가 지참용 인쇄 출력물</p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button
            type="button"
            @click="triggerPrint"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer border-none"
          >
            <span>인쇄하기 (Ctrl+P)</span>
          </button>
          <button
            type="button"
            @click="$emit('close')"
            class="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <!-- Printable Report Content Body -->
      <div class="p-6 sm:p-8 overflow-y-auto print:p-2 print:overflow-visible text-slate-800 font-sans leading-normal">
        
        <!-- Document Header -->
        <div class="border-b-2 border-slate-900 pb-3 mb-4 flex items-end justify-between">
          <div>
            <div class="text-[11px] font-extrabold text-indigo-700 tracking-wider uppercase mb-1">
              {{ currentYear }}학년도 대입 수시모집 1:1 진학 상담 리포트
            </div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              수시 6장 포트폴리오 진단 및 합격 나침반
            </h1>
          </div>
          <div class="text-right text-[11px] text-slate-500">
            <div>상담일자: <strong>{{ todayStr }}</strong></div>
            <div>진학지도실 / 담임교사 확인</div>
          </div>
        </div>

        <!-- Section 1: 학생 기본 정보 & 성적 프로필 요약 -->
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-xs">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 pb-2 border-b border-slate-200/80">
            <div><span class="text-slate-400">성명:</span> <strong class="text-slate-900">{{ student.name }}</strong> ({{ student.classNum }}반 {{ student.studentNum }}번)</div>
            <div><span class="text-slate-400">전교과 내신:</span> <strong class="text-indigo-700 font-bold">{{ student.allSubjectGrade ? Number(student.allSubjectGrade).toFixed(2) : '-' }}등급</strong></div>
            <div><span class="text-slate-400">국영수사/과:</span> <strong class="text-sky-700 font-bold">{{ student.mainSubjectGrade ? Number(student.mainSubjectGrade).toFixed(2) : '-' }}등급</strong></div>
            <div><span class="text-slate-400">지원 자격:</span> <strong class="text-purple-700">{{ student.hasRural ? '🌲 농어촌' : (student.hasRec ? '⭐ 학교장추천' : '일반고') }}</strong></div>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-2">
            <div class="text-slate-600">
              <span class="font-bold text-slate-700">모의고사 성적 추이:</span>
              국어 <strong class="text-slate-800">{{ latestMock.korGrade || '-' }}</strong> | 
              수학 <strong class="text-slate-800">{{ latestMock.mathGrade || '-' }}</strong> | 
              영어 <strong class="text-slate-800">{{ latestMock.engGrade || '-' }}</strong> | 
              탐구 <strong class="text-slate-800">{{ latestMock.tam1Grade || latestMock.tamGrade || '-' }}</strong>
              (한국사 {{ latestMock.histGrade || '-' }})
            </div>
            <div class="bg-indigo-50 text-indigo-900 px-2 py-0.5 rounded border border-indigo-200 font-bold shrink-0">
              정시 기대선: {{ jungsiBaseline.lineName }}
            </div>
          </div>
        </div>

        <!-- Section 2: 6장 카드 데이터 기반 심층 진단표 -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-1.5">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wide m-0 flex items-center space-x-1.5">
              <span>📋</span>
              <span>수시 6장 지원 카드 정밀 판정 및 경쟁률 분석</span>
            </h4>
            <div class="text-[11px] font-semibold text-slate-500">
              포트폴리오 안전도: <strong class="text-indigo-600 font-black">{{ portfolioAnalysis.safetyScore }}점</strong> ({{ portfolioAnalysis.balanceType }})
            </div>
          </div>

          <table class="w-full text-left border-collapse text-[11px] border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr class="bg-slate-100 text-slate-700 border-b border-slate-200 text-[10px] uppercase font-bold">
                <th class="p-2 text-center w-8">#</th>
                <th class="p-2">대학명 / 학과</th>
                <th class="p-2">전형유형</th>
                <th class="p-2">수능최저기준</th>
                <th class="p-2 text-center">최저충족</th>
                <th class="p-2 text-center">실질경쟁률</th>
                <th class="p-2 text-center w-14">판정</th>
                <th class="p-2 text-center w-20">합의주체</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr 
                v-for="(card, idx) in portfolioAnalysis.cards" 
                :key="card.id"
                class="hover:bg-slate-50/80"
              >
                <td class="p-2 text-center font-bold text-slate-500">{{ idx + 1 }}</td>
                <td class="p-2 font-bold text-slate-900">
                  {{ card.univName }}
                  <div class="text-[10px] text-indigo-600 font-normal">{{ card.dept }}</div>
                  <div v-if="card.capture && card.capture.isCaptureRisk" class="text-[9px] text-rose-600 font-bold">
                    ⚠️ 수시납치 주의
                  </div>
                </td>
                <td class="p-2 text-slate-600 text-[10px]">
                  {{ card.admissionDetailType || card.admissionType }}
                </td>
                <td class="p-2 text-slate-500 text-[10px] max-w-[140px] truncate" :title="card.minScoreReq">
                  {{ card.minScoreReq && card.minScoreReq !== '-' ? card.minScoreReq.replace(/^\*\s*수능최저기준\s*:\s*/, '') : '최저 없음' }}
                </td>
                <td class="p-2 text-center font-bold">
                  <span v-if="!card.hasMinScore" class="text-slate-400">면제</span>
                  <span v-else-if="card.diagnosis.csatSatisfied" class="text-emerald-700">충족 ({{ card.diagnosis.passProbability }}%)</span>
                  <span v-else class="text-rose-600 font-bold">미달 위험</span>
                </td>
                <td class="p-2 text-center text-[10px]">
                  <span v-if="card.diagnosis.passRateInfo">
                    <strong class="text-indigo-700">{{ card.diagnosis.passRateInfo.realRate }}:1</strong>
                    <span class="text-slate-400 block text-[9px]">({{ card.diagnosis.passRateInfo.easeFactor }}배 완화)</span>
                  </span>
                  <span v-else class="text-slate-400">-</span>
                </td>
                <td class="p-2 text-center">
                  <span :class="['px-1.5 py-0.5 rounded text-[10px] font-bold border', card.diagnosis.verdictClass]">
                    {{ card.diagnosis.verdict }}
                  </span>
                </td>
                <td class="p-2 text-center text-[10px] text-slate-500 font-medium">
                  {{ cardAgreements[card.id] || '담임추천' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Section 3: 위험 경고 & 고사일 충돌 알림 -->
        <div v-if="portfolioAnalysis.warnings.length > 0" class="bg-rose-50/80 border border-rose-200 rounded-xl p-2.5 mb-4 text-xs text-rose-900">
          <div class="font-bold flex items-center space-x-1 mb-1">
            <span>🚨</span>
            <span>진학지도 안전벨트 점검 사항:</span>
          </div>
          <ul class="m-0 pl-4 space-y-0.5 text-[11px] leading-tight">
            <li v-for="(w, wIdx) in portfolioAnalysis.warnings" :key="wIdx">{{ w }}</li>
          </ul>
        </div>

        <!-- Section 4: 데이터 기반 맞춤형 보완 추천 대학 (상향/적정/안정 3선) -->
        <div class="mb-4">
          <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5 flex items-center space-x-1.5">
            <span>💡</span>
            <span>데이터 기반 추천 보완 라인 (상향 / 적정 / 안정)</span>
          </h4>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <!-- 상향 -->
            <div class="bg-purple-50/70 border border-purple-200 rounded-xl p-2.5">
              <div class="text-[10px] font-bold text-purple-700 uppercase">🚀 상향 스나이핑 (최저 역전)</div>
              <div class="font-bold text-slate-900 mt-1">{{ recommendations.reach[0]?.univName || '고려대/성균관대' }}</div>
              <div class="text-[10px] text-purple-900 mt-0.5">{{ recommendations.reach[0]?.dept || '주요학과' }}</div>
              <div class="text-[9px] text-slate-500 mt-1 leading-snug">
                {{ recommendations.reach[0]?.reasonData?.csatEffect || '최저 충족 시 실질경쟁률 급락' }}
              </div>
            </div>

            <!-- 적정 -->
            <div class="bg-blue-50/70 border border-blue-200 rounded-xl p-2.5">
              <div class="text-[10px] font-bold text-blue-700 uppercase">🎯 적정 승부처 (합격 유력)</div>
              <div class="font-bold text-slate-900 mt-1">{{ recommendations.target[0]?.univName || '경희대/동국대' }}</div>
              <div class="text-[10px] text-blue-900 mt-0.5">{{ recommendations.target[0]?.dept || '주요학과' }}</div>
              <div class="text-[9px] text-slate-500 mt-1 leading-snug">
                {{ recommendations.target[0]?.reasonData?.cutDiff || '내신 70% 컷 부합' }}
              </div>
            </div>

            <!-- 안정 -->
            <div class="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5">
              <div class="text-[10px] font-bold text-emerald-700 uppercase">🛡️ 합격 확보 (안전 벨트)</div>
              <div class="font-bold text-slate-900 mt-1">{{ recommendations.safety[0]?.univName || '단국대/한경국립대' }}</div>
              <div class="text-[10px] text-emerald-900 mt-0.5">{{ recommendations.safety[0]?.dept || '주요학과' }}</div>
              <div class="text-[9px] text-slate-500 mt-1 leading-snug">
                {{ recommendations.safety[0]?.reasonData?.cutDiff || '본교 선배 전원 합격선' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Section 5: 담임교사 종합 의견 및 서명란 -->
        <div class="border border-slate-300 rounded-xl p-3 bg-white text-xs">
          <div class="font-bold text-slate-900 mb-1 flex items-center justify-between">
            <span>📝 담임교사 상담 종합 소견</span>
            <span class="text-[10px] text-slate-400 font-normal">학생 및 학부모 확인용</span>
          </div>
          <div class="text-[11px] text-slate-700 leading-relaxed min-h-[44px] whitespace-pre-wrap">
            {{ counselMemo || '학생의 내신 강점과 모의고사 최저 충족력을 분석한 결과, 상향 2장으로 도전하고 안정 2장을 확보하여 6광탈을 방지하는 균형 잡힌 지원 전략을 강력히 권고합니다.' }}
          </div>
          <div class="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div>3학년 {{ student.classNum }}반 담임교사: __________________ (인)</div>
            <div>학부모 성명: __________________ (인)</div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  student: { type: Object, required: true },
  latestMock: { type: Object, default: () => ({}) },
  portfolioAnalysis: { type: Object, required: true },
  jungsiBaseline: { type: Object, required: true },
  recommendations: { type: Object, required: true },
  cardAgreements: { type: Object, default: () => ({}) },
  counselMemo: { type: String, default: '' },
  currentYear: { type: String, default: '2027' }
})

defineEmits(['close'])

const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
})

function triggerPrint() {
  window.print()
}
</script>

<style scoped>
@media print {
  /* 인쇄 전용 CSS */
  body {
    background: white !important;
    color: black !important;
  }
  @page {
    size: A4 portrait;
    margin: 10mm;
  }
}
</style>

