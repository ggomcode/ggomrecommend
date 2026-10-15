<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto no-print" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" @click="$emit('close')"></div>

    <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
      <div class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-slate-200">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-white font-bold text-lg">
              📊
            </div>
            <div>
              <h3 class="text-lg font-bold m-0 flex items-center gap-2">
                <span>학년도별 대교협 시트 ID 관리</span>
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200">
                  관리자 전용
                </span>
              </h3>
              <p class="text-xs text-slate-300 mt-1 m-0">
                각 학년도별 대교협 원서접수 구글 시트 ID를 입력하여 다개년 입결 및 성적 비교에 연계합니다.
              </p>
            </div>
          </div>
          <button 
            @click="$emit('close')" 
            class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 max-h-[72vh] overflow-y-auto space-y-4">
          <!-- Guide Alert -->
          <div class="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-950 flex items-start gap-2.5">
            <span class="text-base leading-none">💡</span>
            <div class="space-y-1">
              <p class="font-bold m-0">구글 시트 URL 전체 또는 ID를 그대로 붙여넣으세요.</p>
              <p class="text-slate-600 m-0">
                예: <code class="bg-indigo-100/70 px-1 py-0.5 rounded text-indigo-800">https://docs.google.com/spreadsheets/d/1U5Vnx2x.../edit</code> 입력 시 ID가 자동 추출되어 저장됩니다.
              </p>
            </div>
          </div>

          <!-- Academic Year List -->
          <div class="space-y-3">
            <div 
              v-for="year in yearList" 
              :key="year"
              class="p-4 rounded-xl border transition-all"
              :class="[
                year === activeCurrentYear 
                  ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20' 
                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
              ]"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-extrabold text-slate-900">{{ year }}학년도</span>
                  <span 
                    v-if="year === '2027'" 
                    class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                  >
                    기준 학년도
                  </span>
                  <span 
                    v-if="localMap[year]" 
                    class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"
                  >
                    <span>✓</span> 연결됨
                  </span>
                  <span 
                    v-else 
                    class="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200/80 text-slate-600"
                  >
                    미등록 (통계 기본값 사용)
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <a
                    v-if="localMap[year]"
                    :href="`https://docs.google.com/spreadsheets/d/${localMap[year]}/edit`"
                    target="_blank"
                    class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 no-underline"
                  >
                    <span>시트 열기</span>
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                  <button
                    v-if="year !== '2027' && year !== '2026' && year !== '2025'"
                    type="button"
                    @click="removeYear(year)"
                    class="text-xs text-rose-500 hover:text-rose-700 bg-transparent border-none cursor-pointer p-1"
                    title="해당 연도 설정 삭제"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <input 
                  type="text" 
                  v-model="localMap[year]"
                  placeholder="대교협 구글 스프레드시트 ID 또는 전체 URL"
                  class="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>

          <!-- Add custom year button -->
          <div class="pt-2 flex justify-start">
            <button
              type="button"
              @click="addNextYear"
              class="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>➕</span>
              <span>학년도 추가</span>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
          <span v-if="saveMessage" class="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>✓</span> {{ saveMessage }}
          </span>
          <span v-else class="text-xs text-slate-400">
            저장 시 Supabase 데이터베이스 및 브라우저에 즉시 동기화됩니다.
          </span>

          <div class="flex items-center space-x-2">
            <button 
              type="button"
              @click="$emit('close')" 
              class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              닫기
            </button>
            <button 
              type="button"
              @click="handleSave"
              :disabled="saving"
              class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-600/30 transition-all cursor-pointer border-none disabled:opacity-50"
            >
              {{ saving ? '저장 중…' : '설정 저장' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { getKcueYearSheets, saveKcueYearSheets, extractSheetId } from '../../api/statApi'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  activeCurrentYear: {
    type: String,
    default: '2027'
  }
})

const emit = defineEmits(['close', 'saved'])

const yearList = ref(['2027', '2026', '2025', '2024', '2023'])
const localMap = ref({})
const saving = ref(false)
const saveMessage = ref('')

async function loadData() {
  const map = await getKcueYearSheets()
  localMap.value = { ...map }
  
  // yearList 에 map의 모든 키 포함
  const keys = Object.keys(map).sort((a, b) => Number(b) - Number(a))
  keys.forEach(k => {
    if (!yearList.value.includes(k)) {
      yearList.value.push(k)
    }
  })
  yearList.value.sort((a, b) => Number(b) - Number(a))
}

onMounted(() => {
  loadData()
})

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    saveMessage.value = ''
    loadData()
  }
})

function addNextYear() {
  const currentMin = Math.min(...yearList.value.map(Number))
  const newYear = String(currentMin - 1)
  if (!yearList.value.includes(newYear)) {
    yearList.value.push(newYear)
    yearList.value.sort((a, b) => Number(b) - Number(a))
    localMap.value[newYear] = ''
  }
}

function removeYear(year) {
  yearList.value = yearList.value.filter(y => y !== year)
  delete localMap.value[year]
}

async function handleSave() {
  saving.value = true
  saveMessage.value = ''
  try {
    const clean = {}
    for (const [y, id] of Object.entries(localMap.value)) {
      clean[y] = extractSheetId(id)
    }
    await saveKcueYearSheets(clean)
    localMap.value = clean
    saveMessage.value = '저장되었습니다!'
    emit('saved', clean)
    setTimeout(() => {
      saveMessage.value = ''
      emit('close')
    }, 1000)
  } catch (e) {
    alert('저장 중 오류가 발생했습니다: ' + e.message)
  } finally {
    saving.value = false
  }
}
</script>
