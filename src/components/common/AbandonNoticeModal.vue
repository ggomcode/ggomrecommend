<template>
  <div v-if="show && abandonList.length > 0" class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgba(0,0,0,0.65); backdrop-filter: blur(2px);">
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-rose-200 dark:border-rose-900/60 animate-in fade-in zoom-in duration-200">
      <!-- 헤더 -->
      <div class="p-5 bg-linear-to-r from-rose-500 to-rose-600 text-white flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">🚨</span>
          <div>
            <h3 class="text-base font-bold m-0 leading-tight">신규 추천 포기 신청서(포기원) 접수</h3>
            <p class="text-xs text-rose-100 m-0 mt-0.5 font-normal">학생이 제출한 포기원이 접수되었습니다. (총 {{ abandonList.length }}건)</p>
          </div>
        </div>
        <button @click="close" class="text-rose-100 hover:text-white text-xl font-bold bg-transparent border-none cursor-pointer">✕</button>
      </div>

      <!-- 본문 목록 -->
      <div class="p-5 max-h-[60vh] overflow-y-auto space-y-3">
        <div
          v-for="item in abandonList"
          :key="item.id"
          class="p-3.5 bg-rose-50/60 dark:bg-slate-900/80 rounded-xl border border-rose-200/80 dark:border-rose-900/40 text-xs space-y-1.5"
        >
          <div class="flex items-center justify-between font-bold text-slate-800 dark:text-white">
            <span class="text-sm text-rose-600 dark:text-rose-400">
              👤 {{ item.student_name }}
              <span class="text-xs text-slate-500 font-normal ml-1">
                ({{ item.grade ? `${item.grade}학년 ${item.class_no}반 ${item.seq_no}번` : item.student_code }})
              </span>
            </span>
            <span class="text-[10px] text-slate-400 font-normal">{{ formatDate(item.requested_at) }}</span>
          </div>

          <div class="flex flex-col gap-1 text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <div>
              <span class="text-slate-400 font-semibold">포기 대상:</span>
              <strong class="ml-1 text-slate-900 dark:text-white">{{ item.univ_name }} - {{ item.track_name }}</strong>
              <span v-if="item.department_name" class="text-slate-500"> ({{ item.department_name }})</span>
            </div>
            <div>
              <span class="text-slate-400 font-semibold">포기 사유:</span>
              <span class="ml-1 text-rose-700 dark:text-rose-300 font-medium whitespace-pre-line">{{ item.abandon_reason }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 푸터 버튼 -->
      <div class="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
        <button
          @click="close"
          class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          확인 (닫기)
        </button>
        <button
          @click="goNavigate"
          class="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 border-none rounded-lg cursor-pointer shadow-sm"
        >
          📋 포기 심사 / 결과 관리로 이동
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../utils/supabaseClient'

const props = defineProps({
  userRole: {
    type: String,
    default: 'teacher'
  }
})

const emit = defineEmits(['close', 'navigate'])

const show = ref(false)
const abandonList = ref([])

function formatDate(raw) {
  if (!raw) return ''
  try {
    const d = new Date(raw)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return raw
  }
}

async function checkPendingAbandons() {
  if (!supabase) return
  try {
    const { data: apps, error } = await supabase
      .from('applications')
      .select(`
        id,
        department_name,
        scanned_doc_url,
        is_abandoned,
        created_at,
        profiles (
          id,
          name,
          student_code,
          grade,
          class_no,
          seq_no
        ),
        universities (
          id,
          univ_name,
          track_name
        )
      `)
      .eq('is_abandoned', false)
      .not('scanned_doc_url', 'is', null)

    if (error || !apps) return

    const list = []
    apps.forEach(ap => {
      if (ap.scanned_doc_url) {
        try {
          const parsed = JSON.parse(ap.scanned_doc_url)
          if (parsed && parsed.abandon_requested === true) {
            list.push({
              id: ap.id,
              student_name: ap.profiles?.name || '학생',
              student_code: ap.profiles?.student_code || '',
              grade: ap.profiles?.grade,
              class_no: ap.profiles?.class_no,
              seq_no: ap.profiles?.seq_no,
              univ_name: ap.universities?.univ_name || '',
              track_name: ap.universities?.track_name || '',
              department_name: ap.department_name || '',
              abandon_reason: parsed.abandon_reason || '사유 미기재',
              requested_at: parsed.requested_at || ap.created_at
            })
          }
        } catch {}
      }
    })

    abandonList.value = list
    if (list.length > 0) {
      show.value = true
    }
  } catch (e) {
    console.error('Error in AbandonNoticeModal:', e)
  }
}

function close() {
  show.value = false
  emit('close')
}

function goNavigate() {
  show.value = false
  emit('navigate')
}

onMounted(checkPendingAbandons)
</script>
