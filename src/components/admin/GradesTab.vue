<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <!-- 헤더 -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">내신성적 관리</h1>
        <p class="text-base text-slate-500 mt-1">
          유니브 또는 대교협 석차연명부 엑셀을 업로드하면 전교생 내신 등급이 즉시 연동됩니다.
        </p>
      </div>

      <!-- 상단 액션 버튼 그룹 -->
      <div class="flex flex-wrap items-center gap-2">
        <label class="text-base font-semibold rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-sm hover:shadow"
          style="padding: 10px 18px; border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8;">
          🎓 유니브 석차연명부 가져오기
          <input type="file" accept=".xlsx,.xls" class="hidden" @change="onExternalFile('univ', $event)" />
        </label>
        <label class="text-base font-semibold rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-sm hover:shadow"
          style="padding: 10px 18px; border: 1px solid #e2e8f0; background: white; color: #334155;">
          🏛️ 대교협 석차연명부 가져오기
          <input type="file" accept=".xlsx,.xls" class="hidden" @change="onExternalFile('daegyo', $event)" />
        </label>
      </div>
    </div>

    <!-- 도움말 안내 카드 -->
    <div class="rounded-2xl p-5" style="background: white; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div class="flex items-start gap-3">
        <span class="text-xl">💡</span>
        <div class="text-base text-slate-600 space-y-1.5">
          <p class="font-semibold text-slate-800">내신성적 업로드 및 관리 안내</p>
          <p>• <strong>유니브(Univ) 내신석차연명부 엑셀</strong>: B~D열(학년/반/번호), E열(이름), F열(석차), Q열(전학년 석차등급) 4행 규격 엑셀을 그대로 올리시면 됩니다.</p>
          <p>• <strong>개별 수정</strong>: 아래 테이블에서 학생별 석차등급 수치를 직접 수정하실 수도 있습니다.</p>
        </div>
      </div>
    </div>

    <!-- 검색 및 필터 바 -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white shadow-sm border border-slate-200">
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <select v-model="filterGrade" class="text-base rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">전체 학년</option>
          <option :value="3">3학년</option>
        </select>

        <select v-model="filterClass" class="text-base rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">전체 반</option>
          <option v-for="c in 15" :key="c" :value="c">{{ c }}반</option>
        </select>
      </div>

      <div class="relative w-full sm:w-72">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="이름 또는 학번 검색..."
          class="w-full text-base rounded-lg border border-slate-300 pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span class="absolute left-3 top-2.5 text-slate-400">🔍</span>
      </div>
    </div>

    <!-- 성적 명단 테이블 -->
    <div class="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-base">
              <th class="py-3.5 px-5">학번</th>
              <th class="py-3.5 px-5">학년</th>
              <th class="py-3.5 px-5">반</th>
              <th class="py-3.5 px-5">번호</th>
              <th class="py-3.5 px-5">이름</th>
              <th class="py-3.5 px-5">전학년 석차등급</th>
              <th class="py-3.5 px-5 text-right">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-base text-slate-800">
            <tr v-if="loading" class="text-center">
              <td colspan="7" class="py-12 text-slate-400">성적 데이터를 불러오는 중...</td>
            </tr>
            <tr v-else-if="filteredList.length === 0" class="text-center">
              <td colspan="7" class="py-12 text-slate-400">등록된 내신성적 데이터가 없습니다. 상단에서 유니브 석차연명부를 올려주세요.</td>
            </tr>
            <tr v-for="row in filteredList" :key="row.student_code" class="hover:bg-slate-50 transition-colors">
              <td class="py-3.5 px-5 font-mono font-semibold text-blue-600">{{ row.student_code }}</td>
              <td class="py-3.5 px-5">{{ row.grade }}학년</td>
              <td class="py-3.5 px-5">{{ row.class_no }}반</td>
              <td class="py-3.5 px-5">{{ row.student_no || row.seq_no }}번</td>
              <td class="py-3.5 px-5 font-medium text-slate-900">{{ row.name }}</td>
              <td class="py-3.5 px-5">
                <template v-if="editingCode === row.student_code">
                  <input
                    v-model="editVal"
                    type="number"
                    step="0.01"
                    class="w-24 px-2 py-1 border border-blue-400 rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    @keyup.enter="saveGrade(row)"
                  />
                </template>
                <template v-else>
                  <span class="inline-flex items-center px-2.5 py-1 rounded-md text-base font-semibold"
                    :class="row.value !== '-' && row.value != null ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-400'">
                    {{ row.value != null ? row.value : '-' }} 등급
                  </span>
                </template>
              </td>
              <td class="py-3.5 px-5 text-right">
                <template v-if="editingCode === row.student_code">
                  <button @click="saveGrade(row)" class="text-base text-blue-600 font-semibold px-2 py-1 rounded hover:bg-blue-50">저장</button>
                  <button @click="editingCode = null" class="text-base text-slate-400 px-2 py-1 rounded hover:bg-slate-100">취소</button>
                </template>
                <template v-else>
                  <button @click="startEdit(row)" class="text-base text-slate-600 hover:text-blue-600 font-medium px-2 py-1 rounded hover:bg-slate-100">
                    수정
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 외부 가져오기 미리보기 모달 -->
    <Teleport to="body">
      <div v-if="extModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px);">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div class="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-slate-50">
            <div>
              <h3 class="text-lg font-bold text-slate-900">{{ extModal.title }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ extModal.fileName }}</p>
            </div>
            <button @click="extModal.open = false" class="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
          </div>

          <div class="p-6 overflow-y-auto space-y-4">
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 text-base text-slate-600">
              {{ extModal.headerInfo }}
            </div>

            <div>
              <p class="text-base font-semibold text-slate-700 mb-2">미리보기 (상위 {{ extModal.preview.length }}행 / 총 {{ extModal.total }}행)</p>
              <div class="rounded-xl overflow-hidden border border-slate-200">
                <table class="w-full text-left text-base">
                  <thead class="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th v-for="hd in ['학년','반','번호','이름','석차','석차등급']" :key="hd" class="py-2.5 px-4">{{ hd }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="(r, i) in extModal.preview" :key="i" class="hover:bg-slate-50">
                      <td v-for="(c, j) in r" :key="j" class="py-2 px-4">{{ c }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
            <button @click="extModal.open = false" class="px-4 py-2 border border-slate-300 rounded-lg text-base text-slate-600 bg-white">취소</button>
            <button @click="confirmImport" class="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold text-base" :disabled="extModal.importing">
              {{ extModal.importing ? '가져오는 중...' : '성적 반영하기' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { previewUnivImport, importUniv, previewDaegyoImport, importDaegyo, getStudents } from '../../api/admin.js'
import { supabase } from '../../utils/supabaseClient.js'
import { dialog } from '../common/dialog.js'

const loading = ref(false)
const studentsList = ref([])
const gradesMap = ref({})

const filterGrade = ref('')
const filterClass = ref('')
const searchQuery = ref('')

const editingCode = ref(null)
const editVal = ref('')

const extModal = ref({
  open: false,
  format: '',
  title: '',
  file: null,
  fileName: '',
  headerInfo: '',
  preview: [],
  total: 0,
  importing: false
})

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const res = await getStudents({ per_page: 500 })
    studentsList.value = res.rows || []

    if (supabase) {
      const { data } = await supabase.from('config').select('value').eq('key', 'global_course_grades').maybeSingle()
      if (data && data.value) {
        try { gradesMap.value = JSON.parse(data.value) } catch {}
      } else {
        const local = localStorage.getItem('global_course_grades')
        if (local) try { gradesMap.value = JSON.parse(local) } catch {}
      }
    }
  } catch (e) {
    console.error('loadData error:', e)
  } finally {
    loading.value = false
  }
}

const filteredList = computed(() => {
  return studentsList.value
    .map(s => ({
      ...s,
      value: gradesMap.value[s.student_code] ?? null
    }))
    .filter(s => {
      if (filterGrade.value && Number(s.grade) !== Number(filterGrade.value)) return false
      if (filterClass.value && Number(s.class_no) !== Number(filterClass.value)) return false
      if (searchQuery.value) {
        const q = searchQuery.value.trim().toLowerCase()
        const codeMatch = s.student_code && s.student_code.toLowerCase().includes(q)
        const nameMatch = s.name && s.name.toLowerCase().includes(q)
        if (!codeMatch && !nameMatch) return false
      }
      return true
    })
})

function startEdit(row) {
  editingCode.value = row.student_code
  editVal.value = row.value != null ? row.value : ''
}

async function saveGrade(row) {
  const val = parseFloat(editVal.value)
  if (isNaN(val)) return
  gradesMap.value[row.student_code] = val
  editingCode.value = null

  if (supabase) {
    try {
      await supabase.from('config').upsert({
        key: 'global_course_grades',
        value: JSON.stringify(gradesMap.value)
      })
      localStorage.setItem('global_course_grades', JSON.stringify(gradesMap.value))
    } catch (e) {
      console.error('saveGrade error:', e)
    }
  }
}

async function onExternalFile(format, evt) {
  const file = evt.target.files?.[0]
  evt.target.value = ''
  if (!file) return
  try {
    const data = format === 'univ'
      ? await previewUnivImport(null, file)
      : await previewDaegyoImport(null, file)
    extModal.value = {
      open: true,
      format,
      title: format === 'univ' ? '유니브 석차연명부 가져오기' : '대교협 석차연명부 가져오기',
      file,
      fileName: file.name,
      headerInfo: data.header_info,
      preview: data.preview,
      total: data.total,
      importing: false
    }
  } catch (e) {
    await dialog.alert({ title: '가져오기 실패', message: e.message || '파일 파싱 오류', level: 'error' })
  }
}

async function confirmImport() {
  const m = extModal.value
  m.importing = true
  try {
    const res = m.format === 'univ'
      ? await importUniv(null, m.file)
      : await importDaegyo(null, m.file)
    const importedRows = res.data?.rows || []

    for (const r of importedRows) {
      if (r.student_code && r.value != null && r.value !== '-') {
        gradesMap.value[r.student_code] = r.value
      }
    }

    if (supabase) {
      await supabase.from('config').upsert({
        key: 'global_course_grades',
        value: JSON.stringify(gradesMap.value)
      })
      localStorage.setItem('global_course_grades', JSON.stringify(gradesMap.value))
    }

    extModal.value.open = false
    await dialog.alert({ title: '가져오기 완료', message: `${importedRows.length}명의 석차등급 성적이 정상 반영되었습니다!`, level: 'success' })
  } catch (e) {
    await dialog.alert({ title: '저장 실패', message: e.message || '성적 반영 중 오류 발생', level: 'error' })
  } finally {
    m.importing = false
  }
}
</script>
