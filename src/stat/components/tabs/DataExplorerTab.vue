<template>
  <div class="space-y-5">
    <!-- Top Action Bar -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-sm font-bold text-slate-800">전체 지원 데이터 탐색기</h3>
        <p class="text-xs text-slate-400 mt-0.5">
          현재 필터 적용: <strong class="text-indigo-600">{{ filteredApplications.length }}</strong>건 (전체 {{ applications.length > 0 ? applications.length.toLocaleString() : '-' }}건 중)
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Rows per page selector -->
        <select 
          v-model="pageSize" 
          class="bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 px-3 py-1.5 focus:outline-none"
        >
          <option :value="20">20개씩 보기</option>
          <option :value="50">50개씩 보기</option>
          <option :value="100">100개씩 보기</option>
          <option :value="99999">전체 한 번에 보기</option>
        </select>

        <!-- Upload Custom File -->
        <label class="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs">
          <svg class="w-3.5 h-3.5 mr-1.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          새 엑셀/CSV 업로드
          <input type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="handleFileUpload" />
        </label>

        <!-- Export to Excel -->
        <button 
          @click="exportToExcel()"
          class="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs"
        >
          <svg class="w-3.5 h-3.5 mr-1.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          현재 데이터 엑셀 다운로드
        </button>
      </div>
    </div>

    <!-- Data Table Container -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-xs">
          <thead class="bg-slate-50/90 font-semibold text-slate-600">
            <tr>
              <th @click="setSort('id')" class="px-3 py-3 text-left cursor-pointer hover:bg-slate-100">
                연번 <span v-if="sortKey === 'id'">{{ sortAsc ? '▲' : '▼' }}</span>
              </th>
              <th @click="setSort('classNum')" class="px-3 py-3 text-left cursor-pointer hover:bg-slate-100">
                학급/번호 <span v-if="sortKey === 'classNum'">{{ sortAsc ? '▲' : '▼' }}</span>
              </th>
              <th @click="setSort('name')" class="px-3 py-3 text-left cursor-pointer hover:bg-slate-100">
                이름 <span v-if="sortKey === 'name'">{{ sortAsc ? '▲' : '▼' }}</span>
              </th>
              <th @click="setSort('univName')" class="px-3 py-3 text-left cursor-pointer hover:bg-slate-100">
                대학명 <span v-if="sortKey === 'univName'">{{ sortAsc ? '▲' : '▼' }}</span>
              </th>
              <th class="px-3 py-3 text-center">지역</th>
              <th class="px-3 py-3 text-left">모집단위 (학과)</th>
              <th class="px-3 py-3 text-left">전형명</th>
              <th class="px-3 py-3 text-center">계열</th>
              <th @click="setSort('allSubjectGrade')" class="px-3 py-3 text-center cursor-pointer hover:bg-slate-100">
                전교과 <span v-if="sortKey === 'allSubjectGrade'">{{ sortAsc ? '▲' : '▼' }}</span>
              </th>
              <th class="px-3 py-3 text-center">국영수사/과</th>
              <th class="px-3 py-3 text-center">환산점수</th>
              <th class="px-3 py-3 text-left">최저학력기준</th>
              <th class="px-3 py-3 text-center">일정 (면접/발표)</th>
              <th class="px-3 py-3 text-center">결과</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-for="app in paginatedRows" :key="app.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-3 py-2.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">{{ app.id }}</td>
              <td class="px-3 py-2.5 whitespace-nowrap font-medium text-slate-700">
                <span v-if="app.isGraduate || app.classNum === '졸업생'" class="inline-flex items-center text-amber-900 font-semibold">
                  <span class="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] mr-1 border border-amber-300">졸업</span>
                  {{ app.studentNum }}
                </span>
                <span v-else>
                  {{ app.classNum }}반 {{ app.studentNum }}번
                </span>
              </td>
              <td class="px-3 py-2.5 whitespace-nowrap font-bold text-slate-900">
                {{ maskName(app.name) }}
              </td>
              <td class="px-3 py-2.5 whitespace-nowrap font-semibold text-indigo-700">
                {{ app.univName }}
              </td>
              <td class="px-3 py-2.5 text-center whitespace-nowrap">
                <span :class="[
                  'px-1.5 py-0.5 rounded text-[10px] font-medium',
                  app.isMetro ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                ]">
                  {{ app.region }}
                </span>
              </td>
              <td class="px-3 py-2.5 font-medium text-slate-900">
                {{ app.dept }}
                <span v-if="app.quota" class="text-slate-400 text-[10px] ml-0.5 font-normal">({{ app.quota }}명)</span>
              </td>
              <td class="px-3 py-2.5">
                <div class="font-medium text-slate-800">{{ app.admissionDetailType || app.admissionMajorType }}</div>
                <div class="text-[10px] text-slate-400">{{ app.admissionType }}</div>
              </td>
              <td class="px-3 py-2.5 text-center whitespace-nowrap">
                <span :class="[
                  'px-1.5 py-0.5 rounded text-[10px] font-medium',
                  app.field === '자연' ? 'bg-indigo-50 text-indigo-700' :
                  app.field === '인문' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
                ]">
                  {{ app.field }}
                </span>
              </td>
              <td class="px-3 py-2.5 text-center font-bold text-slate-800 whitespace-nowrap">
                {{ formatGrade(app.allSubjectGrade) }}
              </td>
              <td class="px-3 py-2.5 text-center text-slate-600 whitespace-nowrap">
                {{ formatGrade(app.mainSubjectGrade) }}
              </td>
              <td class="px-3 py-2.5 text-center font-mono text-slate-500 text-[11px] whitespace-nowrap">
                {{ app.univConvertedScore ? Number(app.univConvertedScore).toFixed(1) : '-' }}
              </td>
              <td class="px-3 py-2.5 text-[11px] text-slate-500 max-w-[200px] truncate" :title="app.minScoreReq">
                {{ app.minScoreReq || '-' }}
              </td>
              <td class="px-3 py-2.5 text-center whitespace-nowrap text-[10px] text-slate-500">
                <div v-if="app.interviewDate" class="text-purple-600 font-semibold">면접 {{ app.interviewDate.slice(5) }}</div>
                <div v-if="app.finalAnnounceDate">발표 {{ app.finalAnnounceDate.slice(5, 10) }}</div>
                <div v-if="!app.interviewDate && !app.finalAnnounceDate">-</div>
              </td>
              <td class="px-3 py-2.5 text-center whitespace-nowrap">
                <span v-if="app.finalStage === '합격'" class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                  합격
                </span>
                <span v-else-if="app.finalStage === '불합격'" class="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-medium">
                  불합격
                </span>
                <span v-else class="text-slate-300">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Bar -->
      <div class="px-5 py-3 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          총 {{ sortedRows.length }}건 중 
          <span class="font-bold text-slate-800">{{ (currentPage - 1) * pageSize + 1 }}</span> ~ 
          <span class="font-bold text-slate-800">{{ Math.min(currentPage * pageSize, sortedRows.length) }}</span>번째 표시
        </div>

        <div class="flex items-center space-x-1">
          <button 
            @click="currentPage = Math.max(1, currentPage - 1)" 
            :disabled="currentPage === 1"
            class="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            이전
          </button>
          <span class="px-2 font-medium text-slate-700">
            {{ currentPage }} / {{ totalPages }} 페이지
          </span>
          <button 
            @click="currentPage = Math.min(totalPages, currentPage + 1)" 
            :disabled="currentPage === totalPages"
            class="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useData, maskName, formatGrade } from '../../composables/useStatData'
import * as XLSX from 'xlsx'

const { applications, filteredApplications, exportToExcel, loadCustomData } = useData()

const pageSize = ref(50)
const currentPage = ref(1)
const sortKey = ref('id')
const sortAsc = ref(true)

watch([pageSize, filteredApplications], () => {
  currentPage.value = 1
})

const setSort = (key) => {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = true
  }
}

const sortedRows = computed(() => {
  const rows = [...filteredApplications.value]
  rows.sort((a, b) => {
    let valA = a[sortKey.value]
    let valB = b[sortKey.value]

    if (valA === null || valA === undefined) valA = ''
    if (valB === null || valB === undefined) valB = ''

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc.value ? valA - valB : valB - valA
    }
    return sortAsc.value 
      ? String(valA).localeCompare(String(valB), 'ko') 
      : String(valB).localeCompare(String(valA), 'ko')
  })
  return rows
})

const totalPages = computed(() => {
  return Math.ceil(sortedRows.value.length / pageSize.value) || 1
})

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedRows.value.slice(start, start + pageSize.value)
})

// File upload handler (Excel or CSV)
const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (evt) => {
    try {
      const data = new Uint8Array(evt.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
      
      if (!rows || rows.length < 2) {
        alert('유효한 데이터 행이 없습니다.')
        return
      }

      // Check if row 0 is header
      const headerRow = rows[0].map(h => String(h || '').trim())
      const dataRows = rows.slice(1)
      const metroRegions = new Set(['서울', '경기', '인천'])

      const cleanNum = (val) => {
        if (!val || val === "'-" || val === '-') return null
        const num = parseFloat(String(val).replace(/'/g, ''))
        return isNaN(num) ? null : num
      }

      const parsedApps = dataRows.filter(r => r && r.length > 3 && (r[0] || r[3])).map((r, index) => {
        const rawClass = String(r[1] || '').trim()
        const isGraduate = rawClass === '졸업생' || rawClass.includes('졸업')
        const grade = isGraduate ? (parseInt(r[0], 10) || r[0]) : (parseInt(r[0], 10) || 3)
        const classNum = isGraduate ? '졸업생' : (parseInt(r[1], 10) || 1)
        const studentNum = isGraduate ? String(r[2] || '').trim() : (parseInt(r[2], 10) || 1)
        const name = r[3] || ''
        const region = r[5] || ''
        const admissionType = r[8] || ''
        const admissionMajorType = r[9] || ''
        const admissionDetailType = r[10] || ''
        const note = r[27] || ''

        const isRecommendation = admissionMajorType === '지역균형선발' || 
          admissionDetailType.includes('학교장') || 
          admissionDetailType.includes('지역균형') || 
          admissionDetailType.includes('추천')

        const isRural = admissionMajorType === '제1호_농어촌학생' || 
          admissionDetailType.includes('농어촌') || 
          admissionDetailType.includes('농·어촌')

        return {
          id: index + 1,
          grade,
          classNum,
          studentNum,
          name,
          studentKey: isGraduate ? `졸업생_${studentNum}_${name}` : `${classNum}-${studentNum}_${name}`,
          isGraduate,
          schoolType: r[4] || '일반대',
          region,
          univName: r[6] || '',
          period: r[7] || '수시',
          admissionType,
          admissionMajorType,
          admissionDetailType,
          field: r[11] || '',
          dept: r[12] || '',
          quota: cleanNum(r[13]),
          selectionMethod: r[14] || '',
          minScoreReq: r[15] ? String(r[15]).trim() : '',
          hasMinScore: r[15] && String(r[15]).length > 5 && !String(r[15]).includes('없음'),
          score9Grade: cleanNum(r[17]),
          univConvertedScore: cleanNum(r[19]),
          univConvertedGrade: cleanNum(r[20]),
          stage1: r[21] || '',
          finalStage: r[22] || '',
          failReason: r[23] || '',
          candidateRank: r[24] || '',
          registerStatus: r[26] || '',
          note,
          interviewDate: r[28] || '',
          practicalDate: r[29] || '',
          essayDate: r[30] || '',
          aptitudeDate: r[31] || '',
          finalAnnounceDate: r[32] || '',
          korGrade: cleanNum(r[33]),
          engGrade: cleanNum(r[34]),
          mathGrade: cleanNum(r[35]),
          socGrade: cleanNum(r[36]),
          sciGrade: cleanNum(r[37]),
          allSubjectGrade: cleanNum(r[38]),
          mainSubjectGrade: cleanNum(r[42]),
          koreanMathEnglish: cleanNum(r[46]),
          isRecommendation,
          isRural,
          isMetro: metroRegions.has(region)
        }
      })

      if (parsedApps.length > 0) {
        loadCustomData(parsedApps)
        const gradCount = parsedApps.filter(a => a.isGraduate).length
        alert(`총 ${parsedApps.length}건의 데이터를 성공적으로 반영하였습니다.${gradCount > 0 ? ` (졸업생 데이터: ${gradCount}건)` : ''}`)
      }
    } catch (err) {
      alert('파일을 파싱하는 중 오류가 발생했습니다: ' + err.message)
    }
  }
  reader.readAsArrayBuffer(file)
}
</script>
