<template>
  <div class="space-y-6">
    <!-- Action Bar (Hidden when printing) -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between no-print">
      <div>
        <h3 class="text-sm font-bold text-slate-800">A4 공식 수시 지원 통계 보고서 양식</h3>
        <p class="text-xs text-slate-400 mt-0.5">교무회의, 부장단 회의 및 학교장 결재 보고용 인쇄 최적화 서식입니다.</p>
      </div>

      <div class="flex items-center space-x-2">
        <button 
          @click="window.print()"
          class="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          이 양식 그대로 인쇄 / PDF 저장
        </button>
      </div>
    </div>

    <!-- Official Printable A4 Document Sheet -->
    <div class="bg-white rounded-2xl border border-slate-300 shadow-lg max-w-4xl mx-auto p-8 sm:p-12 text-slate-900 print:shadow-none print:border-none print:p-0 print-break-inside-avoid">
      <!-- Document Header -->
      <div class="text-center pb-6 border-b-2 border-slate-900">
        <div class="text-xs text-slate-500 font-semibold tracking-wider">포곡고등학교 진로진학상담부</div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-900">
          {{ selectedAcademicYear }}학년도 대입 수시모집 지원 통계 보고서
        </h1>
        <div class="text-xs text-slate-600 mt-2 flex items-center justify-center space-x-4">
          <span><strong>대상:</strong> 3학년 재학생 (총 {{ officialStats?.totalStudents != null ? officialStats.totalStudents + '명' : '-' }})</span>
          <span>•</span>
          <span><strong>기준일:</strong> 2026년 대교협 수시 원서접수 마감</span>
          <span>•</span>
          <span><strong>자료출처:</strong> 대교협 수시 원서접수 데이터베이스</span>
        </div>
      </div>

      <!-- Section 1: Summary Table -->
      <div class="mt-8">
        <h2 class="text-sm font-bold text-slate-900 mb-2 flex items-center">
          <span class="w-2 h-2 bg-slate-900 rounded-full mr-2"></span>
          1. 수시 지원 총괄 현황
        </h2>
        <table class="w-full border-collapse border border-slate-400 text-xs">
          <thead>
            <tr class="bg-slate-100 text-center font-bold text-slate-800">
              <th class="border border-slate-300 p-2">재학생 총원</th>
              <th class="border border-slate-300 p-2">수시 접수자</th>
              <th class="border border-slate-300 p-2">접수 비율</th>
              <th class="border border-slate-300 p-2">총 지원 건수</th>
              <th class="border border-slate-300 p-2">1인당 평균 지원</th>
              <th class="border border-slate-300 p-2">학교장추천 지원</th>
              <th class="border border-slate-300 p-2">농어촌 지원</th>
            </tr>
          </thead>
          <tbody class="text-center">
            <tr>
              <td class="border border-slate-300 p-2.5 font-bold">{{ officialStats?.totalStudents != null ? officialStats.totalStudents + '명' : '-' }}</td>
              <td class="border border-slate-300 p-2.5 font-bold text-indigo-700">{{ officialStats?.applicantStudents != null ? officialStats.applicantStudents + '명' : '-' }}</td>
              <td class="border border-slate-300 p-2.5 font-bold text-indigo-700">{{ officialStats?.applicantRate != null ? officialStats.applicantRate + '%' : '-' }}</td>
              <td class="border border-slate-300 p-2.5 font-bold text-sky-700">{{ officialStats?.totalApplications != null ? officialStats.totalApplications.toLocaleString() + '건' : '-' }}</td>
              <td class="border border-slate-300 p-2.5 font-bold">{{ officialStats?.avgApplicationsPerStudent != null ? officialStats.avgApplicationsPerStudent + '건' : '-' }}</td>
              <td class="border border-slate-300 p-2.5">
                <template v-if="officialStats?.recommendation?.applications != null">
                  {{ officialStats.recommendation.applications }}건
                  <span class="text-[10px] text-slate-500 block">({{ officialStats.recommendation.students }}명 / {{ officialStats.recommendation.studentRate }}%)</span>
                </template>
                <template v-else>-</template>
              </td>
              <td class="border border-slate-300 p-2.5">
                <template v-if="officialStats?.rural?.applications != null">
                  {{ officialStats.rural.applications }}건
                  <span class="text-[10px] text-slate-500 block">({{ officialStats.rural.applicantStudents }}명 / {{ officialStats.rural.applicantRate }}%)</span>
                </template>
                <template v-else>-</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section 2: Regional Distribution Table -->
      <div class="mt-8">
        <h2 class="text-sm font-bold text-slate-900 mb-2 flex items-center">
          <span class="w-2 h-2 bg-slate-900 rounded-full mr-2"></span>
          2. 지역별 수시 지원 분포 (수도권 vs 비수도권)
        </h2>
        <div class="grid grid-cols-2 gap-4 mb-2 text-xs">
          <div class="p-2.5 bg-slate-50 border border-slate-300 rounded text-center">
            수도권 (서울/경기/인천): <strong class="text-indigo-800">{{ officialStats?.metroBreakdown?.metro?.count != null ? officialStats.metroBreakdown.metro.count + '건' : '-' }}</strong> ({{ officialStats?.metroBreakdown?.metro?.rate != null ? officialStats.metroBreakdown.metro.rate + '%' : '-' }})
          </div>
          <div class="p-2.5 bg-slate-50 border border-slate-300 rounded text-center">
            비수도권 지역: <strong class="text-slate-800">{{ officialStats?.metroBreakdown?.nonMetro?.count != null ? officialStats.metroBreakdown.nonMetro.count + '건' : '-' }}</strong> ({{ officialStats?.metroBreakdown?.nonMetro?.rate != null ? officialStats.metroBreakdown.nonMetro.rate + '%' : '-' }})
          </div>
        </div>

        <table class="w-full border-collapse border border-slate-400 text-xs">
          <thead>
            <tr class="bg-slate-100 text-center font-bold text-slate-800">
              <th v-for="r in (officialStats?.regionalBreakdown || []).slice(0, 9)" :key="r.region" class="border border-slate-300 p-1.5">
                {{ r.region }}
              </th>
            </tr>
          </thead>
          <tbody class="text-center">
            <tr>
              <td v-for="r in (officialStats?.regionalBreakdown || []).slice(0, 9)" :key="r.region" class="border border-slate-300 p-2 font-medium">
                <div>{{ r.count }}건</div>
                <div class="text-[10px] text-slate-500">({{ r.rate }}%)</div>
              </td>
            </tr>
          </tbody>
        </table>

        <table class="w-full border-collapse border border-slate-400 text-xs mt-1">
          <thead>
            <tr class="bg-slate-100 text-center font-bold text-slate-800">
              <th v-for="r in (officialStats?.regionalBreakdown || []).slice(9)" :key="r.region" class="border border-slate-300 p-1.5">
                {{ r.region }}
              </th>
              <th class="border border-slate-300 p-1.5 bg-slate-200">총계</th>
            </tr>
          </thead>
          <tbody class="text-center">
            <tr>
              <td v-for="r in (officialStats?.regionalBreakdown || []).slice(9)" :key="r.region" class="border border-slate-300 p-2 font-medium">
                <div>{{ r.count }}건</div>
                <div class="text-[10px] text-slate-500">({{ r.rate }}%)</div>
              </td>
              <td class="border border-slate-300 p-2 font-bold bg-slate-100">
                {{ officialStats?.totalApplications != null ? officialStats.totalApplications.toLocaleString() + '건 (100%)' : '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section 3: Class by Class Table -->
      <div class="mt-8">
        <h2 class="text-sm font-bold text-slate-900 mb-2 flex items-center">
          <span class="w-2 h-2 bg-slate-900 rounded-full mr-2"></span>
          3. 학급별(1반 ~ 11반) 수시 지원 현황
        </h2>
        <table class="w-full border-collapse border border-slate-400 text-xs text-center">
          <thead>
            <tr class="bg-slate-100 font-bold text-slate-800">
              <th class="border border-slate-300 p-1.5">학급</th>
              <th v-for="c in 11" :key="c" class="border border-slate-300 p-1.5">{{ c }}반</th>
              <th v-if="hasGraduates" class="border border-slate-300 p-1.5 bg-amber-50 text-amber-900">졸업생</th>
              <th class="border border-slate-300 p-1.5 bg-slate-200">합계</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-slate-300 p-1.5 font-bold bg-slate-50">지원건수</td>
              <td v-for="c in 11" :key="c" class="border border-slate-300 p-1.5">
                {{ getClassCount(c) }}
              </td>
              <td v-if="hasGraduates" class="border border-slate-300 p-1.5 font-bold text-amber-900">
                {{ getGraduateCount() }}
              </td>
              <td class="border border-slate-300 p-1.5 font-bold bg-slate-100">{{ applications.length }}</td>
            </tr>
            <tr>
              <td class="border border-slate-300 p-1.5 font-bold bg-slate-50">지원학생</td>
              <td v-for="c in 11" :key="c" class="border border-slate-300 p-1.5 text-slate-600">
                {{ getClassStudents(c) }}
              </td>
              <td v-if="hasGraduates" class="border border-slate-300 p-1.5 font-bold text-amber-900">
                {{ getGraduateStudents() }}
              </td>
              <td class="border border-slate-300 p-1.5 font-bold bg-slate-100">{{ totalUniqueStudents }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section 4: Key Targets & Notable Universities -->
      <div class="mt-8">
        <h2 class="text-sm font-bold text-slate-900 mb-2 flex items-center">
          <span class="w-2 h-2 bg-slate-900 rounded-full mr-2"></span>
          4. 최다 지원 상위 10개 대학 및 특수 목적 대학군
        </h2>
        <div class="grid grid-cols-2 gap-4 text-xs">
          <!-- Top Applied -->
          <div class="border border-slate-300 p-3 rounded">
            <div class="font-bold border-b border-slate-200 pb-1 mb-2 text-indigo-900">최다 출원 대학 TOP 10</div>
            <ol class="space-y-1 list-decimal list-inside text-slate-700">
              <li>한경국립대: <strong>56건</strong></li>
              <li>백석대: <strong>40건</strong></li>
              <li>경기대(수원): <strong>36건</strong></li>
              <li>강남대: <strong>36건</strong></li>
              <li>가천대(성남): <strong>34건</strong></li>
              <li>한국외대(용인): <strong>29건</strong></li>
              <li>수원대: <strong>26건</strong></li>
              <li>명지대(용인): <strong>25건</strong></li>
              <li>남서울대: <strong>23건</strong></li>
              <li>용인대 / 평택대: <strong>각 22건</strong></li>
            </ol>
          </div>

          <!-- Special Target Groups -->
          <div class="border border-slate-300 p-3 rounded flex flex-col justify-between">
            <div>
              <div class="font-bold border-b border-slate-200 pb-1 mb-2 text-indigo-900">주요대 및 과기원 지원 현황</div>
              <ul class="space-y-1.5 text-slate-700">
                <li>• <strong>설포연고서성한이 & 4대 과기원:</strong> 총 <strong class="text-indigo-700">101건</strong> 출원</li>
                <li>• <strong>메디컬 계열:</strong> 상지대 한의예과 <strong class="text-indigo-700">1건</strong></li>
                <li>• <strong>거점 국립대학교:</strong> 총 <strong class="text-indigo-700">65건</strong> 출원</li>
                <li>• <strong>학교장추천 선정자:</strong> 65명 전원 지원 완료 (195건)</li>
              </ul>
            </div>
            <div class="mt-3 p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-500">
              * 세부 학생별 합격자 통계는 1단계 및 최종 발표 이후 업데이트 예정입니다.
            </div>
          </div>
        </div>
      </div>

      <!-- Signoff Footer -->
      <div class="mt-12 pt-6 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500">
        <div>보고자: 3학년 진학부장 및 담임교사 협의체</div>
        <div class="font-bold text-slate-800 text-sm">포곡고등학교장 귀하</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from '../../composables/useStatData'

const { officialStats, applications, selectedAcademicYear } = useData()
const window = globalThis.window

const hasGraduates = computed(() => {
  return applications.value.some(a => a.isGraduate || a.classNum === '졸업생')
})

const getGraduateCount = () => {
  return applications.value.filter(a => a.isGraduate || a.classNum === '졸업생').length
}

const getGraduateStudents = () => {
  const set = new Set(applications.value.filter(a => a.isGraduate || a.classNum === '졸업생').map(a => a.studentKey))
  return set.size
}

const totalUniqueStudents = computed(() => {
  const set = new Set(applications.value.map(a => a.studentKey))
  return set.size
})

const getClassCount = (classNum) => {
  return applications.value.filter(a => a.classNum === classNum).length
}

const getClassStudents = (classNum) => {
  const set = new Set(applications.value.filter(a => a.classNum === classNum).map(a => a.studentKey))
  return set.size
}
</script>
