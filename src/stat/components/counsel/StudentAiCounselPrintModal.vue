<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
    <div class="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 print:shadow-none print:max-w-none print:w-full print:max-h-none print:border-none print:rounded-none">
      
      <!-- Top Modal Bar (인쇄 시 숨김) -->
      <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
        <div class="flex items-center space-x-2.5">
          <span class="text-xl">🖨️</span>
          <div>
            <h3 class="text-sm font-bold m-0 text-white">학부모 상담용 1:1 맞춤 대입 심층 리포트 (A4 인쇄 규격)</h3>
            <p class="text-[11px] text-slate-300 m-0">상담 테이블 브리핑 및 학부모 귀가 지참용 고품질 인쇄 출력물</p>
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
      <div class="p-6 sm:p-8 overflow-y-auto print:p-0 print:overflow-visible text-slate-800 font-sans leading-normal print-page">
        
        <!-- Document Header -->
        <div class="border-b-2 border-slate-900 pb-3 mb-4 flex items-end justify-between">
          <div>
            <div class="text-[11px] font-extrabold text-indigo-700 tracking-wider uppercase mb-1 flex items-center gap-1.5">
              <span>{{ displaySchoolName }}</span>
              <span>•</span>
              <span>{{ academicYear }}학년도 대입 수시모집 1:1 진학 상담 리포트</span>
            </div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
              학생 맞춤 대입 진단 & 수시 6장 황금 나침반
            </h1>
            <p class="text-[11px] text-slate-500 m-0 mt-0.5">
              20년 경력 수석교사진 관점 AI 심층 분석 & 교사 상담 처방전
            </p>
          </div>
          <div class="text-right text-[11px] text-slate-500 shrink-0">
            <div>상담일자: <strong>{{ todayStr }}</strong></div>
            <div v-if="analyzedAt">AI 분석일시: {{ analyzedAt }}</div>
            <div class="mt-0.5 text-slate-700 font-bold">진로진학상담부 / 담임교사 확인 (인)</div>
          </div>
        </div>

        <!-- Section 1: 학생 기본 정보 & 성적 프로필 요약 -->
        <div class="bg-slate-50 border border-slate-300 rounded-xl p-3.5 mb-4 text-xs">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 pb-2 border-b border-slate-200">
            <div><span class="text-slate-500">학생:</span> <strong class="text-slate-900 text-sm">{{ student?.maskedName || student?.name }}</strong> ({{ student?.classStr || `${student?.classNum}반` }})</div>
            <div><span class="text-slate-500">전과목 내신:</span> <strong class="text-blue-700 font-black text-sm">{{ Number(student?.gpa || 0).toFixed(2) }}등급</strong></div>
            <div>
              <span class="text-slate-500">모평 국수평균:</span> 
              <strong class="text-slate-800 font-bold">{{ korMathAvg }}등급</strong>
              <span class="text-slate-400 text-[10px] ml-1">(영 {{ student?.engGrade || '-' }} / 탐 {{ student?.socGrade || student?.sciGrade || '-' }})</span>
            </div>
            <div>
              <span class="text-slate-500">지원 자격:</span> 
              <strong class="text-emerald-800 font-bold">{{ student?.isRural ? '🌲 농어촌 가능' : '일반고 대상' }}</strong>
              <span v-if="isOpportunityStudent" class="text-indigo-700 font-bold ml-1">· 기균 자격</span>
            </div>
          </div>

          <!-- 모의고사 성적 추이 (있는 경우) -->
          <div v-if="latestMock" class="flex flex-wrap items-center justify-between text-[11px] gap-2 pt-0.5">
            <div class="text-slate-600">
              <span class="font-bold text-slate-800">최근 모평 성적({{ latestMock.examName }}):</span>
              국어 <strong class="text-slate-900">{{ latestMock.korGrade || '-' }}등급</strong> | 
              수학 <strong class="text-slate-900">{{ latestMock.mathGrade || '-' }}등급</strong> | 
              영어 <strong class="text-slate-900">{{ latestMock.engGrade || '-' }}등급</strong> | 
              탐구1 <strong class="text-slate-900">{{ latestMock.inq1Grade || '-' }}등급</strong>
              <span v-if="latestMock.inq2Grade">/ 탐구2 <strong class="text-slate-900">{{ latestMock.inq2Grade }}등급</strong></span>
              (한국사 {{ latestMock.histGrade || '-' }})
            </div>
            <div class="text-[10px] text-slate-500 font-mono">
              ※ 등급 해석: 1등급(최상위) ~ 9등급(최하위)
            </div>
          </div>
        </div>

        <!-- Section 2: 수시 6장 지망 포트폴리오 테이블 -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-1.5">
            <h4 class="text-xs font-black text-slate-900 m-0 flex items-center gap-1.5">
              <span>📋</span>
              <span>수시 6장 지망 카드 포트폴리오</span>
            </h4>
            <span class="text-[11px] font-bold text-indigo-700">
              등록 카드: 총 {{ applications.length }}장
            </span>
          </div>

          <table v-if="applications.length > 0" class="w-full text-left border-collapse text-[11px] border border-slate-300 rounded-lg overflow-hidden">
            <thead>
              <tr class="bg-slate-100 text-slate-700 border-b border-slate-300 text-[10px] font-bold">
                <th class="p-2 text-center w-8">#</th>
                <th class="p-2 w-36">대학교</th>
                <th class="p-2 w-36">모집단위 (학과)</th>
                <th class="p-2 w-28">전형 유형</th>
                <th class="p-2">수능최저기준 / 세부전형</th>
                <th class="p-2 text-center w-20">결과</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="(app, idx) in applications.slice(0, 6)" :key="idx" class="hover:bg-slate-50">
                <td class="p-2 text-center font-mono font-bold text-slate-500">{{ idx + 1 }}</td>
                <td class="p-2 font-bold text-slate-900">{{ app.univName }}</td>
                <td class="p-2 text-indigo-900 font-semibold">{{ app.dept }}</td>
                <td class="p-2 text-slate-700">
                  <span class="px-1.5 py-0.5 rounded bg-slate-200/80 text-[10px] font-bold mr-1">
                    {{ app.admissionType }}
                  </span>
                  <span v-if="app.isRural" class="text-amber-800 font-bold text-[10px]">[농어촌]</span>
                </td>
                <td class="p-2 text-slate-600 text-[10.5px]">
                  <div class="line-clamp-1">{{ app.minScoreReq || app.admissionDetailType || '최저기준 없음' }}</div>
                </td>
                <td class="p-2 text-center font-bold text-[10.5px]">
                  <span v-if="app.finalStage || app.stage1" class="text-emerald-700">
                    {{ app.finalStage || app.stage1 }}
                  </span>
                  <span v-else class="text-slate-400">지망</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="text-center py-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
            등록된 수시 지원 카드가 없습니다. (내신 및 모평 기반 추천 라인 적용)
          </div>
        </div>

        <!-- Section 3: Gemini AI 1:1 심층 상담 리포트 본문 -->
        <div v-if="report" class="space-y-3 mb-4">
          <!-- 1) 대입 경쟁력 종합 진단 -->
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs">
            <div class="font-black text-indigo-950 mb-1 flex items-center gap-1.5 text-xs">
              <span>🌟</span>
              <span>1. 대입 경쟁력 종합 진단 브리핑</span>
            </div>
            <p class="text-slate-800 leading-relaxed m-0 whitespace-pre-line text-[11.5px]">
              {{ report.summary }}
            </p>
          </div>

          <!-- 2) 수시 6장 바구니 구성 진단 (상향/적정/안정) -->
          <div class="p-3.5 rounded-xl bg-white border border-slate-300 text-xs space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                <span>🧺</span>
                <span>2. 수시 6장 바구니 구성 진단 (상향/적정/안정)</span>
              </span>
              <span v-if="report.basketDiagnosis?.status" class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold text-[10.5px]">
                진단 판정: {{ report.basketDiagnosis.status }}
              </span>
            </div>
            <p v-if="report.basketDiagnosis?.balanceComment" class="text-slate-700 leading-relaxed m-0 text-[11px]">
              {{ report.basketDiagnosis.balanceComment }}
            </p>

            <div class="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div class="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <span class="font-bold text-emerald-900 block mb-0.5">💪 핵심 강점 & 승부 포인트:</span>
                <ul class="text-emerald-950 space-y-0.5 pl-3.5 list-disc m-0">
                  <li v-for="(s, i) in (report.basketDiagnosis?.strengths || [])" :key="i">{{ s }}</li>
                </ul>
              </div>
              <div class="p-2 rounded-lg bg-rose-50/70 border border-rose-200">
                <span class="font-bold text-rose-900 block mb-0.5">⚠️ 주의점 & 탈락 위험 요소:</span>
                <ul class="text-rose-950 space-y-0.5 pl-3.5 list-disc m-0">
                  <li v-for="(r, i) in (report.basketDiagnosis?.risks || [])" :key="i">{{ r }}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 3) 수능최저 & 전략 과목 처방 + 특별전형 조언 (2컬럼) -->
          <div class="grid grid-cols-2 gap-2.5 text-xs">
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-300 space-y-1">
              <div class="font-black text-slate-900 flex items-center gap-1 text-[11.5px]">
                <span>🎯</span>
                <span>3. 수능최저 충족 역량 & 전략 과목</span>
              </div>
              <p class="text-slate-700 m-0 text-[11px] leading-snug">
                {{ report.csatStrategy?.overallFeasibility }}
              </p>
              <div v-if="report.csatStrategy?.recommendedSubjects?.length" class="text-[10.5px] pt-1">
                <strong class="text-indigo-800">집중 과목:</strong> {{ report.csatStrategy.recommendedSubjects.join(', ') }}
              </div>
              <div v-if="report.csatStrategy?.actionPlan" class="text-[10.5px] text-slate-600 pt-0.5">
                <span class="font-semibold text-slate-800">실행 로드맵:</span> {{ report.csatStrategy.actionPlan }}
              </div>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 border border-slate-300 space-y-1">
              <div class="font-black text-slate-900 flex items-center gap-1 text-[11.5px]">
                <span>🌲</span>
                <span>4. 농어촌 및 특별전형 전략</span>
              </div>
              <div class="text-[11px] text-emerald-900">
                <strong>농어촌 조언:</strong> {{ report.specialTrackAdvice?.ruralAdvice || '해당 없음' }}
              </div>
              <div class="text-[11px] text-blue-900 pt-1">
                <strong>기회균형 조언:</strong> {{ report.specialTrackAdvice?.opportunityAdvice || '해당 없음' }}
              </div>
            </div>
          </div>

          <!-- 4) 교사용 1:1 상담 브리핑 스크립트 핵심 요약 -->
          <div v-if="report.counselScript?.length" class="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 text-xs">
            <div class="font-black text-indigo-950 mb-1 flex items-center gap-1.5 text-[11.5px]">
              <span>🗣️</span>
              <span>5. 학부모·학생 상담 핵심 조언 (진학지도 권고사항)</span>
            </div>
            <div class="space-y-1 text-[11px] text-slate-800">
              <div v-for="(ment, i) in report.counselScript" :key="i" class="flex items-start gap-1.5">
                <span class="font-bold text-indigo-700 shrink-0">{{ i + 1 }}.</span>
                <span>{{ ment }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 4: 담임·진학지도 교사 상담 관찰 메모 및 특이사항 -->
        <div class="border border-slate-300 rounded-xl p-3 text-xs bg-white mb-4">
          <div class="font-black text-slate-900 mb-1 flex items-center gap-1.5">
            <span>📝</span>
            <span>담임·진학지도 교사 상담 관찰 메모 및 향후 지도 계획</span>
          </div>
          <div v-if="teacherMemo && teacherMemo.trim()" class="text-slate-800 text-[11.5px] leading-relaxed whitespace-pre-line min-h-[48px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            {{ teacherMemo }}
          </div>
          <div v-else class="text-slate-400 italic text-[11px] min-h-[48px] flex items-center justify-center border border-dashed border-slate-200 rounded-lg">
            (상담 시 담임교사 수기 메모 또는 시스템 저장 메모 영역)
          </div>
        </div>

        <!-- Document Footer -->
        <div class="pt-3 border-t-2 border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
          <div>
            {{ displaySchoolName }} 진로진학상담부 대입 상담 솔루션
          </div>
          <div class="font-bold text-slate-700">
            학생·학부모 대입 상담 확인용 출력물
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { schoolName } from '../../../utils/schoolConfig'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  academicYear: { type: String, default: '2027' },
  student: { type: Object, default: null },
  applications: { type: Array, default: () => [] },
  latestMock: { type: Object, default: null },
  report: { type: Object, default: null },
  teacherMemo: { type: String, default: '' },
  analyzedAt: { type: String, default: '' }
})

defineEmits(['close'])

const displaySchoolName = computed(() => (schoolName.value && schoolName.value !== '우리학교') ? schoolName.value : '우리 학교')

const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
})

const korMathAvg = computed(() => {
  const k = Number(props.student?.korGrade || 5)
  const m = Number(props.student?.mathGrade || 5)
  return ((k + m) / 2).toFixed(1)
})

const isOpportunityStudent = computed(() => {
  return props.applications?.some(a => a.isOpportunity) || false
})

function triggerPrint() {
  window.print()
}
</script>

<style scoped>
@media print {
  @page {
    size: A4 portrait;
    margin: 10mm 10mm 10mm 10mm;
  }
  body {
    background: white !important;
    color: black !important;
  }
  .print-page {
    padding: 0 !important;
    overflow: visible !important;
  }
}
</style>
