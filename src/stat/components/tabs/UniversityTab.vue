<template>
  <div class="space-y-6">
    <!-- 🎯 2단계: 대학 그룹별 전형 심층 분석 & 합격률 비교 위젯 (보고서 5~6페이지 통합) -->
    <UnivGroupPassRateWidget />

    <!-- Top Filter & Presets Bar -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <!-- Preset Pills -->
      <div class="flex flex-wrap items-center gap-1.5">
        <button 
          v-for="preset in presets" 
          :key="preset.id"
          @click="activePreset = preset.id"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer',
            activePreset === preset.id 
              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
          ]"
        >
          <span>{{ preset.label }}</span>
          <span class="ml-1 text-[11px] opacity-80">({{ getPresetCount(preset.id) }})</span>
        </button>
      </div>

      <!-- Search & Sort Controls -->
      <div class="flex items-center space-x-2">
        <div class="relative w-48 sm:w-60">
          <input 
            v-model="univSearch" 
            type="text" 
            placeholder="대학명 검색 (예: 가천, 연세...)" 
            class="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        <select 
          v-model="sortBy" 
          class="bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 px-3 py-1.5 focus:outline-none"
        >
          <option value="count">지원자 많은 순</option>
          <option value="name">대학 가나다순</option>
          <option value="gradeAsc">평균 내신 높은 순</option>
          <option value="gradeDesc">평균 내신 낮은 순</option>
        </select>
      </div>
    </div>

    <!-- TOP 15 Most Applied Universities Chart -->
    <div v-if="activePreset === 'all' && !univSearch" class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-sm font-bold text-slate-800">최다 지원 TOP 15 대학교</h2>
          <p class="text-xs text-slate-400">포곡고 학생들이 가장 많이 지원한 상위 15개 대학</p>
        </div>
        <span v-if="top1" class="text-xs font-medium text-slate-500">
          1위 {{ top1.name }} ({{ top1.count }}건)
        </span>
        <span v-else class="text-xs font-medium text-slate-400">
          -
        </span>
      </div>
      <div class="h-64">
        <Bar :data="topUnivChartData" :options="chartOptions" />
      </div>
    </div>

    <!-- Universities Table / Grid -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-slate-800 m-0">
            {{ getPresetTitle() }}
            <span class="text-xs font-normal text-slate-500 ml-1">총 {{ filteredUnivList.length }}개교</span>
          </h3>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-xs">
          <thead class="bg-slate-50 font-semibold text-slate-600">
            <tr>
              <th class="px-4 py-3 text-left">순위</th>
              <th class="px-4 py-3 text-left">대학명</th>
              <th class="px-4 py-3 text-center">지역</th>
              <th class="px-4 py-3 text-center">지원 건수</th>
              <th class="px-4 py-3 text-center">지원 학생</th>
              <th class="px-4 py-3 text-center">평균 내신</th>
              <th class="px-4 py-3 text-center">내신 범위(최고~최저)</th>
              <th class="px-4 py-3 text-center">학교장추천</th>
              <th class="px-4 py-3 text-center">농어촌</th>
              <th class="px-4 py-3 text-right">상세보기</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr 
              v-for="(u, idx) in filteredUnivList" 
              :key="u.name"
              @click="selectedUniv = u"
              class="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
            >
              <td class="px-4 py-3 whitespace-nowrap text-slate-400 font-medium">
                <span :class="[
                  'inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-bold',
                  idx < 3 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                ]">
                  {{ idx + 1 }}
                </span>
              </td>
              <td class="px-4 py-3 font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                <div class="flex items-center space-x-1.5">
                  <span>{{ u.name }}</span>
                  <span v-if="u.isTopTier" class="px-1.5 py-0.2 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200/60">
                    주요대
                  </span>
                  <span v-if="u.isMedical" class="px-1.5 py-0.2 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200/60 font-semibold" title="의·치·한·약·수 지원 건 포함">
                    의·약학
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-center whitespace-nowrap">
                <span :class="[
                  'px-2 py-0.5 rounded-full text-[11px] font-medium',
                  u.isMetro ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                ]">
                  {{ u.region }}
                </span>
              </td>
              <td class="px-4 py-3 text-center whitespace-nowrap">
                <span class="font-bold text-indigo-600 text-sm">{{ u.count }}</span>
                <span class="text-slate-400 text-[11px] ml-0.5">건</span>
              </td>
              <td class="px-4 py-3 text-center whitespace-nowrap text-slate-600">
                {{ u.uniqueStudents }}명
              </td>
              <td class="px-4 py-3 text-center whitespace-nowrap font-bold text-slate-800">
                <span :class="[
                  'px-2 py-0.5 rounded font-bold',
                  u.avgGradeNum <= 2.5 ? 'bg-emerald-50 text-emerald-700' :
                  u.avgGradeNum <= 4.0 ? 'bg-sky-50 text-sky-700' :
                  u.avgGradeNum <= 5.5 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                ]">
                  {{ u.avgGrade }}
                </span>
              </td>
              <td class="px-4 py-3 text-center whitespace-nowrap text-slate-500 font-mono text-[11px]">
                {{ u.bestGrade }} ~ {{ u.worstGrade }}
              </td>
              <td class="px-4 py-3 text-center whitespace-nowrap">
                <span v-if="u.recCount > 0" class="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold">
                  {{ u.recCount }}건
                </span>
                <span v-else class="text-slate-300">-</span>
              </td>
              <td class="px-4 py-3 text-center whitespace-nowrap">
                <span v-if="u.ruralCount > 0" class="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">
                  {{ u.ruralCount }}건
                </span>
                <span v-else class="text-slate-300">-</span>
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <button class="inline-flex items-center px-2 py-1 rounded text-[11px] font-medium text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  조회
                  <svg class="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- University Detail Modal -->
    <UnivDetailModal 
      v-if="selectedUniv" 
      :univ="selectedUniv" 
      @close="selectedUniv = null" 
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { useData, formatGrade } from '../../composables/useStatData'
import UnivDetailModal from '../StatUnivModal.vue'
import UnivGroupPassRateWidget from '../UnivGroupPassRateWidget.vue'

const { filteredApplications } = useData()

const activePreset = ref('all')
const univSearch = ref('')
const sortBy = ref('count')
const selectedUniv = ref(null)

const presets = [
  { id: 'all', label: '전체 대학' },
  { id: 'topTier', label: '🌟 설카포연고서성한이/과기원' },
  { id: 'medical', label: '🩺 의치한약수' },
  { id: 'flagship', label: '🏛️ 거점국립대' },
  { id: 'metro', label: '🏙️ 수도권 대학' }
]

const topTierTargetUnivs = [
  '서울대학교(서울)', '포항공과대학교(포항)', '연세대학교(서울)', '고려대학교(서울)',
  '서강대학교(서울)', '성균관대학교(서울)', '성균관대학교(수원)', '한양대학교(서울)',
  '이화여자대학교(서울)', '한국과학기술원', '울산과학기술원', '대구경북과학기술원',
  '광주과학기술원', '한국에너지공과대학교'
]

function checkIsTopTier(univName) {
  if (!univName) return false
  if (topTierTargetUnivs.includes(univName)) return true
  const baseNames = ['서울대학교', '포항공과대학교', '서강대학교', '이화여자대학교', '한국과학기술원', '울산과학기술원', '대구경북과학기술원', '광주과학기술원', '한국에너지공과대학교']
  if (baseNames.some(b => univName.startsWith(b))) return true
  if (univName.startsWith('연세대학교') && !univName.includes('미래') && !univName.includes('원주')) return true
  if (univName.startsWith('고려대학교') && !univName.includes('세종')) return true
  if (univName.startsWith('한양대학교') && !univName.includes('ERICA')) return true
  if (univName.startsWith('성균관대학교')) return true
  return false
}

function isMedicalDept(dept) {
  if (!dept) return false

  // 1. 비면허/자연과학/유사 전공 배제 (약과학, 창의, 바이오, 신약, 스포츠의학, 식물의학, 공학, 의료행정, 치료 등)
  if (
    dept.includes('약과학') ||
    dept.includes('창의') ||
    dept.includes('바이오') ||
    dept.includes('신약') ||
    dept.includes('스포츠') ||
    dept.includes('식물') ||
    dept.includes('공학') ||
    dept.includes('융합') ||
    dept.includes('보건') ||
    dept.includes('행정') ||
    dept.includes('의료') ||
    dept.includes('치료') ||
    dept.includes('치위생') ||
    dept.includes('치기공') ||
    dept.includes('임상') ||
    dept.includes('의류')
  ) {
    return false
  }

  // 2. 의예·의학, 치의예·치의학, 한의예·한의학, 수의예·수의학
  if (
    dept.includes('의예') ||
    dept === '의학과' ||
    dept.startsWith('의학과') ||
    dept.includes('치의예') ||
    dept.includes('치의학') ||
    dept.includes('한의예') ||
    dept.includes('한의학') ||
    dept.includes('수의예') ||
    dept.includes('수의학')
  ) {
    return true
  }

  // 3. 약학과, 약학부, 제약학과, 한약학과 (약사 및 한약사 보건의료인 면허 과정)
  if (
    dept === '약학과' ||
    dept.startsWith('약학과') ||
    dept === '약학부' ||
    dept.startsWith('약학부') ||
    dept === '제약학과' ||
    dept.startsWith('제약학과') ||
    dept === '한약학과' ||
    dept.startsWith('한약학과') ||
    dept.includes('한약학과')
  ) {
    return true
  }

  return false
}

const flagshipNames = [
  '강원대학교', '충북대학교', '충남대학교', '경북대학교', '부산대학교',
  '전북대학교', '전남대학교', '제주대학교', '경상국립대학교'
]

// Aggregate applications by university
const aggregatedUnivs = computed(() => {
  const map = new Map()

  filteredApplications.value.forEach(app => {
    const name = app.univName
    if (!map.has(name)) {
      map.set(name, {
        name,
        region: app.region,
        isMetro: app.isMetro,
        apps: [],
        uniqueStudentsSet: new Set(),
        recCount: 0,
        ruralCount: 0,
        isTopTier: checkIsTopTier(name),
        isMedical: false
      })
    }
    const item = map.get(name)
    item.apps.push(app)
    item.uniqueStudentsSet.add(app.studentKey)
    if (app.isRecommendation) item.recCount++
    if (app.isRural) item.ruralCount++
    if (isMedicalDept(app.dept)) {
      item.isMedical = true
    }
  })

  return Array.from(map.values()).map(u => {
    const validGrades = u.apps.map(a => a.allSubjectGrade).filter(g => g !== null && g > 0)
    const avgGradeNum = validGrades.length > 0 
      ? validGrades.reduce((a, b) => a + b, 0) / validGrades.length 
      : 99.0
    const bestGrade = validGrades.length > 0 ? Math.min(...validGrades).toFixed(2) : '-'
    const worstGrade = validGrades.length > 0 ? Math.max(...validGrades).toFixed(2) : '-'

    return {
      ...u,
      count: u.apps.length,
      uniqueStudents: u.uniqueStudentsSet.size,
      avgGradeNum,
      avgGrade: avgGradeNum !== 99.0 ? avgGradeNum.toFixed(2) : '-',
      bestGrade,
      worstGrade
    }
  })
})

const getPresetCount = (presetId) => {
  if (presetId === 'all') return aggregatedUnivs.value.length
  if (presetId === 'topTier') return aggregatedUnivs.value.filter(u => u.isTopTier).length
  if (presetId === 'medical') return aggregatedUnivs.value.filter(u => u.isMedical).length
  if (presetId === 'flagship') return aggregatedUnivs.value.filter(u => flagshipNames.some(f => u.name.includes(f.replace('대학교', '')))).length
  if (presetId === 'metro') return aggregatedUnivs.value.filter(u => u.isMetro).length
  return 0
}

const getPresetTitle = () => {
  const p = presets.find(x => x.id === activePreset.value)
  return p ? p.label : '대학 목록'
}

const filteredUnivList = computed(() => {
  let list = aggregatedUnivs.value

  // Preset filter
  if (activePreset.value === 'topTier') {
    list = list.filter(u => u.isTopTier)
  } else if (activePreset.value === 'medical') {
    list = list.filter(u => u.isMedical)
  } else if (activePreset.value === 'flagship') {
    list = list.filter(u => flagshipNames.some(f => u.name.includes(f.replace('대학교', ''))))
  } else if (activePreset.value === 'metro') {
    list = list.filter(u => u.isMetro)
  }

  // Keyword filter
  if (univSearch.value.trim()) {
    const kw = univSearch.value.trim().toLowerCase()
    list = list.filter(u => u.name.toLowerCase().includes(kw))
  }

  // Sort
  if (sortBy.value === 'count') {
    list.sort((a, b) => b.count - a.count)
  } else if (sortBy.value === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  } else if (sortBy.value === 'gradeAsc') {
    list.sort((a, b) => a.avgGradeNum - b.avgGradeNum)
  } else if (sortBy.value === 'gradeDesc') {
    list.sort((a, b) => b.avgGradeNum - a.avgGradeNum)
  }

  return list
})

// Top 15 Chart
const top1 = computed(() => {
  const sorted = [...aggregatedUnivs.value].sort((a, b) => b.count - a.count)
  return sorted.length > 0 ? sorted[0] : null
})

const topUnivChartData = computed(() => {
  const top15 = [...aggregatedUnivs.value].sort((a, b) => b.count - a.count).slice(0, 15)
  return {
    labels: top15.map(u => u.name.replace(/대학교|\(.*\)/g, '')),
    datasets: [
      {
        label: '지원 건수',
        data: top15.map(u => u.count),
        backgroundColor: '#6366f1',
        borderRadius: 6
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Pretendard', size: 10 } } },
    x: { grid: { display: false }, ticks: { font: { family: 'Pretendard', size: 11 } } }
  }
}
</script>
