<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto no-print" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" @click="$emit('close')"></div>

    <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
      <div class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-slate-200">
        
        <!-- Header -->
        <div class="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-white font-bold text-lg">
              🎓
            </div>
            <div>
              <h3 class="text-lg font-bold m-0 flex items-center gap-2">
                <span>신학년도 진급 처리 및 학적 이관</span>
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200">
                  진급명렬 연동 엔진
                </span>
              </h3>
              <p class="text-xs text-slate-300 mt-1 m-0">
                구글 시트의 <code class="text-amber-300 font-mono font-bold">진급명렬</code> 탭 데이터를 기반으로 현 고2 학생을 3학년(2028 대입)으로 진급시키고 성적을 이관합니다.
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
          <!-- 진단 및 상태 요약 카드 -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
              <div class="text-[11px] font-bold text-indigo-700">진급명렬 등록 인원</div>
              <div class="text-2xl font-black text-indigo-950 font-mono mt-1">
                {{ promoList.length }}명
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">
                구글 시트 '진급명렬' 동기화
              </div>
            </div>

            <div class="p-4 rounded-xl border" :class="validation.isValid ? 'bg-emerald-50/70 border-emerald-200/80' : 'bg-rose-50/70 border-rose-200/80'">
              <div class="text-[11px] font-bold" :class="validation.isValid ? 'text-emerald-700' : 'text-rose-700'">
                신학번 중복 검증
              </div>
              <div class="text-2xl font-black font-mono mt-1" :class="validation.isValid ? 'text-emerald-950' : 'text-rose-950'">
                {{ validation.isValid ? '정상 (0건)' : `오류 ${validation.duplicateNewKeys.length}건` }}
              </div>
              <div class="text-[10px]" :class="validation.isValid ? 'text-emerald-600' : 'text-rose-600'">
                {{ validation.isValid ? '모든 신학번이 고유함' : '동일 반/번호 충돌 발견' }}
              </div>
            </div>

            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div class="text-[11px] font-bold text-slate-700">대입 목표 학년도</div>
              <div class="text-2xl font-black text-slate-900 font-mono mt-1">
                2028학년도
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">
                현 고2 ➔ 예비 고3 승격
              </div>
            </div>
          </div>

          <!-- 중복 오류 경고 박스 -->
          <div v-if="!validation.isValid" class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
            <div class="font-bold flex items-center gap-1.5">
              <span>⚠️</span>
              <span>신학번(신학년-신반-신번호) 중복 오류가 발견되었습니다. 시트에서 수정해 주세요:</span>
            </div>
            <ul class="list-disc pl-5 m-0 space-y-0.5">
              <li v-for="dup in validation.duplicateNewKeys" :key="dup.key">
                신학번 [{{ dup.key }}]: {{ dup.name }} 학생
              </li>
            </ul>
          </div>

          <!-- 진급 명렬 미리보기 테이블 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-slate-800 m-0 flex items-center gap-1.5">
                <span>📋</span>
                <span>진급 매핑 목록 미리보기</span>
              </h4>
              <button
                @click="loadPromotion"
                :disabled="isLoading"
                class="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border-none cursor-pointer transition-colors"
              >
                {{ isLoading ? '동기화 중…' : '🔄 시트에서 다시 읽기' }}
              </button>
            </div>

            <div class="overflow-x-auto rounded-xl border border-slate-200 max-h-72 overflow-y-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="bg-slate-50 text-slate-600 font-bold sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th class="py-2 px-3">이전 학사년도</th>
                    <th class="py-2 px-3">이전 학년·반·번호</th>
                    <th class="py-2 px-3">학생 성명</th>
                    <th class="py-2 px-3 text-center">➔</th>
                    <th class="py-2 px-3 text-indigo-700 font-black">진급 신학년도</th>
                    <th class="py-2 px-3 text-indigo-700 font-black">신학년·반·번호</th>
                    <th class="py-2 px-3">상태</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr v-if="promoList.length === 0">
                    <td colspan="7" class="py-8 text-center text-slate-400 font-sans">
                      '진급명렬' 시트에 등록된 데이터가 없습니다.<br />
                      시트에 학년도, 학년, 반, 번호, 이름, 신학년도, 신학년, 신반, 신번호를 작성해 주세요.
                    </td>
                  </tr>
                  <tr
                    v-for="(st, idx) in promoList"
                    :key="st.oldStudentKey + '_' + idx"
                    class="hover:bg-slate-50 transition-colors"
                  >
                    <td class="py-2 px-3 text-slate-500">{{ st.prevYear }}학년도</td>
                    <td class="py-2 px-3 text-slate-700">{{ st.prevGrade }}학년 {{ st.prevClass }}반 {{ st.prevNum }}번</td>
                    <td class="py-2 px-3 font-sans font-bold text-slate-900">{{ st.name }}</td>
                    <td class="py-2 px-3 text-center text-indigo-500 font-bold">➔</td>
                    <td class="py-2 px-3 text-indigo-700 font-bold">{{ st.newYear }}학년도</td>
                    <td class="py-2 px-3 text-indigo-900 font-black">{{ st.newGrade }}학년 {{ st.newClass }}반 {{ st.newNum }}번</td>
                    <td class="py-2 px-3">
                      <span class="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        정상 매칭
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
          <div class="text-[11px] text-slate-500">
            * 진급 실행 시 2028학년도 대입 모드에서 고2 모의고사 성적이 새 3학년 번호로 연결됩니다.
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
            >
              닫기
            </button>
            <button
              type="button"
              @click="applyPromotion"
              :disabled="promoList.length === 0 || !validation.isValid"
              class="px-4 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl border-none cursor-pointer transition-colors shadow-xs"
            >
              🌟 진급 매핑 실행 & 2028대입 연동
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchAndParsePromotionData } from '../../../api/statApi'
import { validatePromotionData } from '../../utils/promotionEngine'
import { dialog } from '../../../components/common/dialog'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'promoted'])

const isLoading = ref(false)
const promoList = ref([])

const validation = computed(() => {
  return validatePromotionData(promoList.value)
})

async function loadPromotion() {
  isLoading.value = true
  try {
    const list = await fetchAndParsePromotionData()
    promoList.value = list || []
  } catch (e) {
    console.warn('진급명렬 로드 실패:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadPromotion()
})

async function applyPromotion() {
  if (promoList.value.length === 0) {
    dialog.alert('진급명렬 데이터가 비어 있습니다.')
    return
  }

  const confirmed = await dialog.confirm(
    `총 ${promoList.value.length}명의 학생을 신학년도(2028 대입)로 진급 처리하고 모의고사 성적을 이관하시겠습니까?`
  )
  if (!confirmed) return

  dialog.alert(`진급 처리가 완료되었습니다!\n상단 학년도에서 '2028학년도'를 선택하면 진급된 학생들의 성적을 분석할 수 있습니다.`)
  emit('promoted', promoList.value)
  emit('close')
}
</script>
