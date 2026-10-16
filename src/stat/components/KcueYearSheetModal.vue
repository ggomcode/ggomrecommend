<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto no-print" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" @click="$emit('close')"></div>

    <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
      <div class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-3xl border border-slate-200">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-white font-bold text-lg">
              📑
            </div>
            <div>
              <h3 class="text-lg font-bold m-0 flex items-center gap-2">
                <span>대교협 통합 구글 시트 연동 관리</span>
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200">
                  단일 시트 · 탭별 통합 관리
                </span>
              </h3>
              <p class="text-xs text-slate-300 mt-1 m-0">
                시트 ID 하나로 모든 학년도(2027, 2026, 2025...)와 시기(수시, 정시, 통계)를 시트 탭으로 통합 관리합니다.
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
        <div class="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          
          <!-- 1. 단일 구글 시트 ID 설정 카드 -->
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-base">🔑</span>
                <span class="text-xs font-bold text-slate-800">
                  대교협 수시 지원 원자료 구글 시트 ID (관리자 설정 연동)
                </span>
              </div>
              <a
                v-if="sheetIdInput"
                :href="`https://docs.google.com/spreadsheets/d/${extractSheetId(sheetIdInput)}/edit`"
                target="_blank"
                class="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 no-underline"
              >
                <span>🔗 구글 시트 바로 열기</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>

            <div class="flex items-center gap-2">
              <input 
                type="text" 
                v-model="sheetIdInput"
                placeholder="구글 스프레드시트 ID 또는 전체 URL 붙여넣기"
                class="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <button
                type="button"
                @click="handleSaveSheetId"
                :disabled="saving"
                class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg border-none cursor-pointer whitespace-nowrap transition-colors"
              >
                {{ saving ? '저장 중…' : 'ID 저장' }}
              </button>
            </div>
            <p class="text-[11px] text-slate-500 m-0">
              ※ 관리자 시스템 설정 <strong>'3) 대교협 수시 지원 원자료 구글 시트 ID'</strong>와 100% 동일하게 동기화됩니다.
            </p>
          </div>

          <!-- 2. 시트 탭 목록 및 연동 상태 확인 -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-xs font-black text-slate-900 m-0 flex items-center gap-1.5">
                  <span>📑</span>
                  <span>단일 시트 내 권장 시트 탭 목록</span>
                </h4>
                <p class="text-[11px] text-slate-500 m-0 mt-0.5">
                  구글 스프레드시트 하단 탭 이름을 아래 명칭으로 생성하시면 시스템이 자동으로 해당 탭을 읽어옵니다.
                </p>
              </div>

              <!-- Filter Pills -->
              <div class="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  @click="selectedCategory = 'all'"
                  :class="selectedCategory === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'"
                  class="px-2 py-1 rounded border-none cursor-pointer transition-colors"
                >
                  전체 ({{ allTabs.length }})
                </button>
                <button
                  type="button"
                  @click="selectedCategory = 'susi'"
                  :class="selectedCategory === 'susi' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'"
                  class="px-2 py-1 rounded border-none cursor-pointer transition-colors"
                >
                  수시
                </button>
                <button
                  type="button"
                  @click="selectedCategory = 'jungsi'"
                  :class="selectedCategory === 'jungsi' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'"
                  class="px-2 py-1 rounded border-none cursor-pointer transition-colors"
                >
                  정시
                </button>
                <button
                  type="button"
                  @click="selectedCategory = 'stat'"
                  :class="selectedCategory === 'stat' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'"
                  class="px-2 py-1 rounded border-none cursor-pointer transition-colors"
                >
                  통계
                </button>
              </div>
            </div>

            <!-- Tab Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div 
                v-for="tab in filteredTabs" 
                :key="tab.key"
                class="p-3 rounded-xl border transition-all flex flex-col justify-between"
                :class="[
                  tab.year === activeCurrentYear && tab.category === 'susi'
                    ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                ]"
              >
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <div class="flex items-center gap-1.5">
                      <span 
                        @click="copyTabName(tab.key)" 
                        title="클릭하여 탭 이름 복사"
                        class="px-2 py-0.5 rounded-md font-mono text-xs font-black bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-800 cursor-pointer border border-slate-300 transition-colors flex items-center gap-1"
                      >
                        <span>{{ tab.key }}</span>
                        <span class="text-[10px] text-slate-400">📋</span>
                      </span>

                      <span 
                        v-if="tab.isDefault" 
                        class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                      >
                        기준 학년도
                      </span>

                      <span 
                        class="px-1.5 py-0.2 rounded text-[10px] font-bold"
                        :class="[
                          tab.category === 'susi' ? 'bg-blue-100 text-blue-800' :
                          tab.category === 'jungsi' ? 'bg-purple-100 text-purple-800' :
                          'bg-emerald-100 text-emerald-800'
                        ]"
                      >
                        {{ tab.type }}
                      </span>
                    </div>

                    <!-- Connection test button -->
                    <button
                      type="button"
                      @click="testTabConnection(tab.key)"
                      :disabled="testingTabs[tab.key]"
                      class="text-[11px] font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded px-2 py-0.5 cursor-pointer transition-colors"
                      title="구글 시트에 해당 탭이 정상 존재하는지 테스트합니다."
                    >
                      {{ testingTabs[tab.key] ? '테스트 중…' : '🔍 연동 테스트' }}
                    </button>
                  </div>

                  <p class="text-xs text-slate-600 m-0">
                    {{ tab.label }}
                  </p>
                </div>

                <!-- Test Result Badge -->
                <div v-if="tabResults[tab.key]" class="mt-2 pt-2 border-t border-slate-100 text-[11px]">
                  <span 
                    v-if="tabResults[tab.key].success"
                    class="font-bold text-emerald-600 flex items-center gap-1"
                  >
                    <span>✓</span> {{ tabResults[tab.key].message }}
                  </span>
                  <span 
                    v-else
                    class="font-bold text-rose-600 flex items-center gap-1"
                  >
                    <span>✕</span> {{ tabResults[tab.key].message }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. 사용 안내 & 주의사항 -->
          <div class="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-950 space-y-2">
            <div class="flex items-center gap-2 font-bold text-indigo-900">
              <span class="text-base">💡</span>
              <span>단일 구글 시트 탭 관리 가이드</span>
            </div>
            <ul class="list-disc list-inside space-y-1 text-slate-700 m-0 text-[11px] leading-relaxed">
              <li>
                <strong>구글 시트 공유 권한</strong>: 상단 <strong>[공유]</strong> 버튼에서 <code class="bg-indigo-100 px-1 py-0.2 rounded text-indigo-800 font-bold">링크가 있는 모든 사용자 - 뷰어</code>로 설정되어 있어야 데이터를 실시간으로 읽어올 수 있습니다.
              </li>
              <li>
                <strong>시트 탭 명칭</strong>: 띄어쓰기 없이 <code class="bg-indigo-100 px-1 py-0.2 rounded text-indigo-800 font-mono">2027수시</code>, <code class="bg-indigo-100 px-1 py-0.2 rounded text-indigo-800 font-mono">2026수시</code>, <code class="bg-indigo-100 px-1 py-0.2 rounded text-indigo-800 font-mono">2027통계</code> 등으로 탭 이름을 지정하세요. (위의 탭 이름을 클릭하면 바로 복사됩니다)
              </li>
              <li>
                <strong>원자료 형식</strong>: 대교협 수시 지원 원자료 엑셀의 헤더와 데이터를 그대로 해당 탭의 A1 셀부터 붙여넣으시면 됩니다.
              </li>
            </ul>
          </div>

        </div>

        <!-- Footer -->
        <div class="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
          <span v-if="saveMessage" class="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>✓</span> {{ saveMessage }}
          </span>
          <span v-else-if="copiedMessage" class="text-xs font-bold text-indigo-600 flex items-center gap-1">
            <span>📋</span> {{ copiedMessage }}
          </span>
          <span v-else class="text-xs text-slate-400">
            시트 ID 저장 시 Supabase 데이터베이스 및 브라우저에 즉시 동기화됩니다.
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
              @click="handleSaveSheetId"
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
import { ref, computed, watch, onMounted } from 'vue'
import { 
  getKcueSheetId, 
  saveKcueSheetId, 
  extractSheetId, 
  STANDARD_KCUE_TABS,
  testKcueSheetTabConnection 
} from '../../api/statApi'

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

const sheetIdInput = ref('')
const saving = ref(false)
const saveMessage = ref('')
const copiedMessage = ref('')
const selectedCategory = ref('all')

const allTabs = ref([...STANDARD_KCUE_TABS])
const testingTabs = ref({})
const tabResults = ref({})

const filteredTabs = computed(() => {
  if (selectedCategory.value === 'all') return allTabs.value
  return allTabs.value.filter(t => t.category === selectedCategory.value)
})

async function loadData() {
  const currentId = await getKcueSheetId()
  sheetIdInput.value = currentId || ''
}

onMounted(() => {
  loadData()
})

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    saveMessage.value = ''
    copiedMessage.value = ''
    loadData()
  }
})

async function handleSaveSheetId() {
  saving.value = true
  saveMessage.value = ''
  try {
    const cleanId = extractSheetId(sheetIdInput.value)
    await saveKcueSheetId(cleanId)
    sheetIdInput.value = cleanId
    saveMessage.value = cleanId ? '시트 ID가 저장되었습니다.' : '시트 ID가 초기화되었습니다.'
    emit('saved', cleanId)
    setTimeout(() => {
      saveMessage.value = ''
    }, 2500)
  } catch (e) {
    alert('저장 중 오류가 발생했습니다: ' + e.message)
  } finally {
    saving.value = false
  }
}

function copyTabName(tabKey) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(tabKey).then(() => {
      copiedMessage.value = `'${tabKey}' 탭 명칭이 클립보드에 복사되었습니다!`
      setTimeout(() => {
        copiedMessage.value = ''
      }, 2000)
    })
  }
}

async function testTabConnection(tabKey) {
  const targetId = extractSheetId(sheetIdInput.value)
  if (!targetId) {
    alert('구글 시트 ID를 먼저 입력해 주세요.')
    return
  }

  testingTabs.value[tabKey] = true
  tabResults.value[tabKey] = null

  try {
    const result = await testKcueSheetTabConnection(targetId, tabKey)
    tabResults.value[tabKey] = result
  } catch (e) {
    tabResults.value[tabKey] = { success: false, message: e.message }
  } finally {
    testingTabs.value[tabKey] = false
  }
}
</script>

