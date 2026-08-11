<template>
  <div
    class="fixed inset-0 flex items-center justify-center z-50 bg-black/40"
    style="backdrop-filter: blur(2px);"
    @keydown.escape.window="$emit('close')"
  >
    <div
      class="bg-white dark:bg-slate-800 flex flex-col rounded-2xl shadow-xl w-120 max-w-[90vw] overflow-hidden"
    >
      <!-- 헤더 -->
      <div class="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10">
        <div>
          <h3 class="text-sm font-bold text-slate-800 dark:text-white">
            {{ studentName }} — 전형 지원 정보 상세
          </h3>
          <p class="text-[10px] text-slate-400 font-medium">신청 내역 검토 및 추천 상태 처리</p>
        </div>
        <button
          class="text-lg leading-none text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
          @click="$emit('close')"
        >✕</button>
      </div>

      <!-- 본문 -->
      <div class="p-6 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
        <!-- 대학/전형 기본 요약 -->
        <div class="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200/60 dark:border-slate-700 space-y-2 text-xs">
          <div class="flex justify-between"><span class="text-slate-400 font-semibold">지원 대학:</span> <span class="font-bold text-slate-800 dark:text-white">{{ app.univ_name }}</span></div>
          <div class="flex justify-between"><span class="text-slate-400 font-semibold">지원 전형:</span> <span class="font-bold text-slate-800 dark:text-white">{{ app.track_name }}</span></div>
          <div class="flex justify-between"><span class="text-slate-400 font-semibold">지원 학과:</span> <span class="font-bold text-slate-800 dark:text-white">{{ app.department_name }}</span></div>
          <div class="flex justify-between"><span class="text-slate-400 font-semibold">성적 정보:</span> <span class="font-bold text-blue-600 dark:text-blue-400">{{ displayScoreText }}</span></div>
        </div>

        <!-- 추천 처리 상태 요약 -->
        <div
          class="rounded-xl border p-4 text-xs font-semibold"
          :class="app.abandoned ? 'bg-rose-50 border-rose-200 text-rose-800' : isAbandonRequested ? 'bg-rose-50 border-rose-200 border-dashed text-rose-800' : (app.excluded || app.is_excluded) ? 'bg-amber-50 border-amber-200 text-amber-900' : (app.recommended || app.is_recommended) ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'"
        >
          <div v-if="app.abandoned" class="space-y-1.5">
            <p>⚠️ <strong>추천 포기 완료 건:</strong> 이 지원서는 학생/학부모의 추천 포기 서신이 제출되어 반려 및 종료되었습니다.</p>
            <div v-if="docUrl || app.abandoned_doc_url" class="mt-2 text-right">
              <a :href="docUrl || app.abandoned_doc_url" target="_blank" class="text-rose-600 underline font-bold">📄 업로드된 포기원 문서 보기</a>
            </div>
          </div>
          <div v-else-if="isAbandonRequested" class="space-y-1.5">
            <p>⚠️ <strong>추천 포기 신청 대기 건:</strong> 학생이 추천 포기 신청서(포기원)를 작성 및 서명 제출했습니다. 관리자의 최종 승인 및 처리 대기 상태입니다.</p>
            <div v-if="app.scanned_doc_url" class="mt-2 text-right">
              <a :href="typeof app.scanned_doc_url === 'string' ? JSON.parse(app.scanned_doc_url).doc_url : app.scanned_doc_url.doc_url" target="_blank" class="text-rose-600 underline font-bold">📄 학생 제출 포기원 서류 보기</a>
            </div>
          </div>
          <div v-else-if="app.excluded || app.is_excluded">
            <p>⛔ <strong>추천 보류 (성적 미달):</strong> 현재 전학급 성적순 {{ app.univ_rank || 1 }}위로 대학교 추천 제한 인원({{ app.quota_limit ? app.quota_limit + '명' : '제한없음' }})을 초과하여 성적순 보류 상태입니다.</p>
          </div>
          <div v-else-if="app.recommended || app.is_recommended">
            <p>🎉 <strong>추천 대상:</strong> 현재 전학급 성적순 {{ app.univ_rank || 1 }}위로 대학교 추천 대상자(정원 {{ app.quota_limit ? app.quota_limit + '명' : '제한없음' }})로 지정되었습니다.</p>
          </div>
          <div v-else>
            <p>⏱️ <strong>추천 대기 상태:</strong> 담임교사의 추천 선택 대기 중입니다 (현재 전학급 성적순 {{ app.univ_rank || 1 }}위 / 정원 {{ app.quota_limit ? app.quota_limit + '명' : '제한없음' }}). 추천 대상 등록 시 실시간으로 추천 상태가 반영됩니다.</p>
          </div>
        </div>

        <!-- 💡 추천 여부 선택 패널 (추천 / 대기 전환) -->
        <div v-if="!app.abandoned && !isAbandonRequested" class="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-3 bg-slate-50/60 dark:bg-slate-900/30">
          <div>
            <h4 class="text-xs font-bold text-slate-800 dark:text-white m-0">추천 여부 선택</h4>
            <p class="text-[10px] text-slate-500 leading-normal mt-0.5 m-0">
              추천을 선택하면 전학급 대상 대학교별 추천 제한 인원에 따라 성적순(대학환산점수 우선, 석차등급 낮을수록 상위)으로 추천 대상자가 판정됩니다.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 mt-1">
            <button
              type="button"
              @click="handleSetRecommend(true)"
              :disabled="actionLoading"
              class="py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border"
              :class="(app.recommended || app.is_recommended) && !app.is_excluded && !app.excluded ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
            >
              👍 추천 대상 등록
            </button>

            <button
              type="button"
              @click="handleSetRecommend(false)"
              :disabled="actionLoading"
              class="py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border"
              :class="!app.recommended && !app.is_recommended && !app.is_excluded && !app.excluded ? 'bg-slate-700 text-white border-slate-700 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
            >
              ⏳ 대기 상태로 전환
            </button>
          </div>
        </div>

        <!-- 포기 처리 패널 (추천 확정된 상태에서 포기 처리 시 포기서류 PDF 업로드 필수) -->
        <div v-if="(app.recommended || app.is_recommended) && !app.abandoned && !isAbandonRequested" class="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-3">
          <div>
            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 m-0">추천 전형 포기 처리</h4>
            <p class="text-[10px] text-slate-400 leading-normal mt-0.5 m-0">학생이 추천을 포기할 경우, 포기원 양식 스캔 파일(PDF)을 필수 업로드하고 포기 처리를 완료하여 공석을 복구해야 합니다.</p>
          </div>
          
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-[10px] font-bold text-slate-500">포기원 PDF 서류 선택</label>
              <a
                :href="`${baseUrl}data/2027%ED%95%99%EB%85%84%EB%8F%84%20%ED%95%99%EA%B5%90%EC%9E%A5%EC%B6%94%EC%B2%9C%EC%A0%84%ED%98%95%20%EC%A7%80%EC%9B%90%20%ED%8F%AC%EA%B8%B0%EC%9B%90_%EC%96%91%EC%8B%9D.hwp`"
                download
                class="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
              >
                📝 포기원 양식 (HWP)
              </a>
            </div>
            <input
              type="file"
              accept=".pdf"
              @change="onFileSelected"
              class="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <!-- AI OCR 판독 알림 배너 -->
          <div v-if="ocrLoading" class="text-[10px] text-blue-600 font-semibold flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/20 p-2 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <span class="animate-spin inline-block w-3.5 h-3.5 border-2 border-blue-600/20 border-t-blue-600 rounded-full"></span>
            AI OCR 실시간 문서 정밀 판독 및 서명 확인 중…
          </div>
          <div v-else-if="ocrWarning" class="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 p-2.5 rounded-lg text-[10px] leading-relaxed whitespace-pre-line font-medium">
            ⚠️ <strong>AI OCR 판독 경고 (서류 불일치 가능성):</strong><br>
            {{ ocrWarning }}
          </div>
          <div v-else-if="file" class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
            ✓ AI OCR 판독 완료: 해당 학생의 서명이 날인된 정상 포기원 문서임이 자동 확인되었습니다.
          </div>

          <button
            type="button"
            @click="handleAbandon"
            :disabled="!file || actionLoading || ocrLoading"
            class="w-full text-xs font-bold py-2 border-none rounded-lg text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 cursor-pointer transition-colors"
          >
            {{ actionLoading ? '포기 처리 중…' : '포기원 제출 및 공석 반환' }}
          </button>
        </div>
      </div>

      <!-- 하단 일반 취소 및 닫기 버튼 -->
      <div class="flex items-center justify-end gap-2.5 p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-xs font-semibold text-slate-500 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
        >
          닫기
        </button>
        <!-- 추천 대기 상태(미확정)인 경우에만 즉시 지원 완전 삭제(취소) 가능 -->
        <button
          v-if="!app.recommended && !app.is_recommended && !app.abandoned"
          type="button"
          @click="onDelete"
          :disabled="actionLoading"
          class="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg cursor-pointer"
        >
          {{ actionLoading ? '취소 중...' : '지원 내역 삭제' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../utils/supabaseClient'
import {
  teacherAbandonApplication,
  teacherDeleteApplication,
  teacherSetRecommendationStatus
} from '../../api/teacher.js'
import { promoteNextEligibleStudent } from '../../api/admin.js'
import { convertPdfToImages, analyzeDocumentWithAI } from '../../utils/ocrParser.js'

const baseUrl = import.meta.env.BASE_URL || '/'

const props = defineProps({
  app: { type: Object, required: true },
  studentName: { type: String, required: true },
})
const emit = defineEmits(['close', 'deleted'])

const actionLoading = ref(false)
const ocrLoading = ref(false)
const ocrWarning = ref('')
const file = ref(null)
const docUrl = ref('')
const openaiKey = ref('')

const displayScoreText = computed(() => {
  const gpa = props.app.gpa_overall != null ? `${props.app.gpa_overall}등급` : '석차등급 미산출'
  const calc = props.app.univ_calc_score != null ? props.app.univ_calc_score : props.app.manual_score
  if (calc != null && calc !== '' && Number(calc) !== Number(props.app.gpa_overall)) {
    return `${gpa} (대학환산: ${calc}점)`
  }
  return gpa
})

const isAbandonRequested = computed(() => {
  if (!props.app.scanned_doc_url) return false
  try {
    const parsed = typeof props.app.scanned_doc_url === 'string' ? JSON.parse(props.app.scanned_doc_url) : props.app.scanned_doc_url
    return parsed && parsed.abandon_requested === true
  } catch {}
  return false
})

onMounted(async () => {
  if (supabase) {
    const { data } = await supabase.from('config').select('value').eq('key', 'openai_api_key').single()
    if (data) {
      openaiKey.value = data.value
    }
  }
})

async function handleSetRecommend(isRecommend) {
  actionLoading.value = true
  try {
    await teacherSetRecommendationStatus(
      props.app.student_id,
      props.app.track_id,
      props.app.round_id,
      isRecommend
    )
    emit('deleted')
    emit('close')
  } catch (e) {
    console.error(e)
    alert(e.message || '추천 상태 변경 도중 오류가 발생했습니다.')
  } finally {
    actionLoading.value = false
  }
}

async function onFileSelected(e) {
  const selected = e.target.files[0]
  if (selected && selected.type === 'application/pdf') {
    file.value = selected
    if (openaiKey.value) {
      await runOcrAnalysis(selected)
    }
  } else {
    alert('PDF 형식의 포기원 스캔 파일만 선택 가능합니다.')
    e.target.value = ''
    file.value = null
    ocrWarning.value = ''
  }
}

async function runOcrAnalysis(selectedFile) {
  ocrLoading.value = true
  ocrWarning.value = ''
  try {
    const images = await convertPdfToImages(selectedFile)
    const analysis = await analyzeDocumentWithAI(images, openaiKey.value)

    const nameMatch = analysis.student_name ? analysis.student_name.includes(props.studentName) : false
    const codeMatch = analysis.student_code ? String(analysis.student_code).includes(props.app.student_code) : false
    const isAbandonForm = analysis.document_type === '포기원'

    const warnings = []
    if (!isAbandonForm) {
      warnings.push('- 업로드된 문서가 "포기원" 양식이 아닌 것으로 판독되었습니다.')
    }
    if (!nameMatch) {
      warnings.push(`- 문서의 학생 이름(${analysis.student_name || '인식불가'})이 신청자 이름(${props.studentName})과 일치하지 않습니다.`)
    }
    if (!codeMatch) {
      warnings.push(`- 문서의 학번(${analysis.student_code || '인식불가'})이 신청자 학번(${props.app.student_code})과 일치하지 않습니다.`)
    }
    if (analysis.is_signed === false) {
      warnings.push('- 문서 내에 날인 혹은 자필 서명이 확인되지 않았습니다.')
    }

    if (warnings.length > 0) {
      ocrWarning.value = warnings.join('\n')
    }
  } catch (e) {
    console.error('OCR Validation failure: ', e)
  } finally {
    ocrLoading.value = false
  }
}

async function handleAbandon() {
  if (!file.value) return
  
  let confirmMsg = '정말로 이 지원자의 학교장추천 선정을 포기 처리하시겠습니까? 제출된 포기원 서류가 보관되고 정원 공석은 즉시 반환됩니다.'
  if (ocrWarning.value) {
    confirmMsg = `⚠️ AI 판독 경고가 존재합니다:\n${ocrWarning.value}\n\n정말로 이 파일로 포기 처리를 강행하시겠습니까?`
  }
  
  if (!confirm(confirmMsg)) return

  actionLoading.value = true
  try {
    const studentId = props.app.student_id
    const trackId = props.app.track_id
    const roundId = props.app.round_id

    const path = `abandoned_${studentId}_r${roundId}_u_${trackId}.pdf`
    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(path, file.value, { contentType: 'application/pdf', upsert: true })

    if (uploadErr) throw new Error('포기원 PDF 업로드에 실패했습니다: ' + uploadErr.message)

    const publicUrl = supabase.storage.from('documents').getPublicUrl(path).data.publicUrl
    docUrl.value = publicUrl

    await teacherAbandonApplication(studentId, trackId, roundId, publicUrl)

    // 차순위 승계 처리 수행
    let successionMsg = ''
    try {
      const nextStudent = await promoteNextEligibleStudent(trackId, roundId)
      if (nextStudent) {
        successionMsg = `\n\n🎉 [차순위 승계 알림]\n- 대학: ${nextStudent.univ_name} ${nextStudent.track_name}\n- 차순위 후보인 ${nextStudent.name} (${nextStudent.student_code}) 학생이 새롭게 추천 후보명단에 자동 등록되었습니다.`
      }
    } catch (e) {
      console.warn('Succession error:', e)
    }

    alert('포기 처리가 완료되었습니다.' + successionMsg)
    emit('deleted')
    emit('close')
  } catch (e) {
    console.error(e)
    alert(e.message || '포기 처리 도중 오류가 발생했습니다.')
  } finally {
    actionLoading.value = false
  }
}

async function onDelete() {
  if (!confirm('정말로 이 지원 신청을 완전 삭제하시겠습니까?')) return

  actionLoading.value = true
  try {
    await teacherDeleteApplication(props.app.student_id, props.app.track_id, props.app.round_id)
    alert('삭제되었습니다.')
    emit('deleted')
    emit('close')
  } catch (e) {
    console.error(e)
    alert('삭제 처리 중 오류가 발생했습니다.')
  } finally {
    actionLoading.value = false
  }
}
</script>
