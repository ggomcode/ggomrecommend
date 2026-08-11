<template>
  <div style="padding: 2rem 2.5rem;">
    <!-- 페이지 헤더 -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <p class="text-base mb-1" style="color: #94a3b8;">관리자</p>
        <h1 class="text-2xl font-semibold" style="color: #1e293b; margin: 0;">학생 가입 승인 관리</h1>
      </div>
      <!-- 가입코드 간편 확인 카드 -->
      <div class="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm text-xs font-semibold text-blue-700">
        🔑 학생 배포 가입코드: <span class="bg-blue-600 text-white font-mono rounded px-1.5 py-0.5 text-xs">{{ regCode }}</span>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="text-base text-center" style="padding: 60px 0; color: #94a3b8;">
      불러오는 중…
    </div>

    <!-- 메인 컨텐츠 -->
    <div v-else class="flex flex-col gap-5">
      <!-- 상태 필터 탭 -->
      <div class="flex gap-2 p-1 bg-slate-100 border border-slate-200 rounded-xl max-w-md">
        <button
          v-for="s in ['all', 'pending', 'approved', 'rejected']"
          :key="s"
          @click="statusFilter = s"
          class="flex-1 text-xs font-bold py-1.5 rounded-lg border-none transition-all cursor-pointer whitespace-nowrap"
          :class="statusFilter === s ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 bg-transparent hover:text-slate-700'"
        >
          {{ statusLabel(s) }} ({{ filteredStudentsCount(s) }})
        </button>
      </div>

      <!-- 학생 목록 테이블 카드 -->
      <div class="rounded-xl overflow-hidden bg-white shadow-sm border border-slate-200/60">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="text-xs font-bold text-slate-500 p-4 text-left">구분</th>
              <th class="text-xs font-bold text-slate-500 p-4 text-left">학번</th>
              <th class="text-xs font-bold text-slate-500 p-4 text-left">이름</th>
              <th class="text-xs font-bold text-slate-500 p-4 text-left">연락처 끝 4자리</th>
              <th class="text-xs font-bold text-slate-500 p-4 text-left">졸업년도</th>
              <th class="text-xs font-bold text-slate-500 p-4 text-center">상태</th>
              <th class="text-xs font-bold text-slate-500 p-4 text-center">가입 처리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredStudents.length === 0">
              <td colspan="7" class="text-center text-sm py-16 text-slate-400">
                해당 필터에 속한 학생 가입 목록이 존재하지 않습니다.
              </td>
            </tr>
            <tr
              v-for="student in filteredStudents"
              :key="student.id"
              class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
            >
              <td class="p-4 text-xs font-bold text-slate-600">
                <span
                  class="px-2 py-0.5 rounded text-[10px]"
                  :class="student.is_enrolled ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'"
                >
                  {{ student.is_enrolled ? '재학생' : '졸업생' }}
                </span>
                <span v-if="student.class_no === 99" class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 ml-1">
                  🧪 테스트 99반
                </span>
              </td>
              <td class="p-4 text-sm font-semibold font-mono text-slate-800">{{ student.student_code }}</td>
              <td class="p-4 text-sm font-semibold text-slate-800">{{ student.name }}</td>
              <td class="p-4 text-sm font-mono text-slate-500">{{ student.phone_last4 }}</td>
              <td class="p-4 text-sm text-slate-600">
                {{ student.is_enrolled ? `${student.grade}학년 ${student.class_no}반 ${student.seq_no}번` : `${student.grad_year}년` }}
              </td>
              <td class="p-4 text-center">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-bold inline-block"
                  :class="{
                    'bg-amber-50 text-amber-600 border border-amber-200': student.status === 'pending',
                    'bg-emerald-50 text-emerald-600 border border-emerald-200': student.status === 'approved',
                    'bg-rose-50 text-rose-600 border border-rose-200': student.status === 'rejected'
                  }"
                >
                  {{ statusLabel(student.status) }}
                </span>
                <p v-if="student.status === 'rejected' && student.rejection_reason" class="text-[11px] text-rose-500 mt-1 max-w-xs mx-auto truncate" :title="student.rejection_reason">
                  사유: {{ student.rejection_reason }}
                </p>
              </td>
              <td class="p-4 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    v-if="student.status !== 'approved'"
                    @click="handleApprove(student)"
                    :disabled="processingId === student.id"
                    class="px-2.5 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
                  >
                    {{ processingId === student.id && processingAction === 'approve' ? '승인 중…' : '승인' }}
                  </button>

                  <button
                    v-if="student.status !== 'rejected'"
                    @click="openRejectModal(student)"
                    :disabled="processingId === student.id"
                    class="px-2.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
                  >
                    {{ processingId === student.id && processingAction === 'reject' ? '반려 중…' : '반려' }}
                  </button>

                  <button
                    @click="handleDelete(student)"
                    :disabled="processingId === student.id"
                    class="px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
                  >
                    {{ processingId === student.id && processingAction === 'delete' ? '삭제 중…' : '삭제' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 반려 사유 입력 모달 -->
    <div v-if="rejectingStudent" class="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-700">
        <h3 class="text-base font-bold text-slate-800 dark:text-white mb-1">학생 가입 신청 반려</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
          <strong>{{ rejectingStudent.name }}</strong> ({{ rejectingStudent.student_code }}) 학생의 가입을 반려합니다.<br>
          학생이 재로그인 시 사유를 확인하고 수정하여 재신청할 수 있도록 사유를 적어주세요.
        </p>

        <div class="mb-4">
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">반려 사유 입력</label>
          <textarea
            v-model="rejectionReasonInput"
            rows="3"
            placeholder="예: 학번/성명 불일치, 연락처 입력 오류, 재학생/졸업생 선택 오류 등"
            class="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-800 dark:text-white"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2">
          <button
            @click="cancelReject"
            class="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border-none cursor-pointer"
          >취소</button>
          <button
            @click="confirmReject"
            :disabled="!rejectionReasonInput.trim()"
            class="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 rounded-lg border-none cursor-pointer"
          >반려 완료</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../utils/supabaseClient'
import { teacherGetStudents } from '../../api/teacher'
import { deleteStudent, upsertClass } from '../../api/admin'
import { decryptText } from '../../utils/cryptoUtils'

const students = ref([])
const loading = ref(true)
const statusFilter = ref('all')
const regCode = ref('')

const processingId = ref(null)
const processingAction = ref(null)

const rejectingStudent = ref(null)
const rejectionReasonInput = ref('')

function statusLabel(s) {
  if (s === 'all') return '전체'
  if (s === 'pending') return '승인 대기'
  if (s === 'approved') return '승인'
  if (s === 'rejected') return '반려'
  return s
}

const filteredStudents = computed(() => {
  if (statusFilter.value === 'all') return students.value
  return students.value.filter(s => s.status === statusFilter.value)
})

function filteredStudentsCount(s) {
  if (s === 'all') return students.value.length
  return students.value.filter(item => item.status === s).length
}

async function loadRegCode() {
  if (!supabase) return
  try {
    const { data } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'registration_code')
      .maybeSingle()
    if (data && data.value) {
      regCode.value = data.value
    } else {
      regCode.value = ''
    }
  } catch (e) {
    console.error('Error loading regCode:', e)
    regCode.value = ''
  }
}

async function loadStudents() {
  loading.value = true
  try {
    if (!supabase) return
    const { data, error } = await supabase
      .from('enrolled_students')
      .select('*')
      .order('is_enrolled', { ascending: false })
      .order('grade', { ascending: true })
      .order('class_no', { ascending: true })
      .order('student_no', { ascending: true })
      .order('student_code', { ascending: true })

    if (error) throw error

    students.value = await Promise.all((data || []).map(async s => ({
      id: s.id,
      student_code: s.student_code || `${s.grade}${String(s.class_no).padStart(2, '0')}${String(s.student_no || s.seq_no).padStart(2, '0')}`,
      name: await decryptText(s.name),
      parent_name: await decryptText(s.parent_name),
      is_enrolled: s.is_enrolled !== false,
      grade: s.grade,
      class_no: s.class_no,
      seq_no: s.student_no || s.seq_no,
      phone_last4: s.student_phone_hash ? '****' : '0000',
      status: s.status || 'approved',
      rejection_reason: s.rejection_reason || null,
      grad_year: s.grad_year
    })))
  } catch (e) {
    console.error('Error loading students for approval:', e)
  } finally {
    loading.value = false
  }
}

async function handleApprove(student) {
  if (!supabase) return
  if (!confirm(`'${student.name}' (${student.student_code}) 학생의 가입을 승인하시겠습니까?`)) return

  processingId.value = student.id
  processingAction.value = 'approve'

  try {
    const { error } = await supabase
      .from('enrolled_students')
      .update({ status: 'approved', rejection_reason: null })
      .eq('id', student.id)

    if (error) throw error

    // 99반(테스트용) 학생 승인 시 3학년 99반 학급 자동 생성
    if (student.class_no === 99 || (student.student_code && student.student_code.substring(1, 3) === '99')) {
      try {
        await upsertClass(3, 99, { teacher_name: '3학년 99반 담임 (테스트)' })
      } catch (classErr) {
        console.warn('Auto create class 99 warning:', classErr)
      }
    }

    try {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        await supabase.from('audit_logs').insert({
          actor_id: data.user.id,
          action: 'APPROVE',
          details: { target_student_id: student.id, student_code: student.student_code }
        })
      }
    } catch (logErr) {}

    await loadStudents()
    alert(`'${student.name}' 학생의 가입이 승인되었습니다.`)
  } catch (e) {
    console.error(e)
    alert('승인 처리 중 오류가 발생했습니다.')
  } finally {
    processingId.value = null
    processingAction.value = null
  }
}

function openRejectModal(student) {
  rejectingStudent.value = student
  rejectionReasonInput.value = student.rejection_reason || ''
}

function cancelReject() {
  rejectingStudent.value = null
  rejectionReasonInput.value = ''
}

async function confirmReject() {
  if (!rejectingStudent.value || !rejectionReasonInput.value.trim()) return

  const student = rejectingStudent.value
  const reason = rejectionReasonInput.value.trim()

  processingId.value = student.id
  processingAction.value = 'reject'

  try {
    const { error } = await supabase
      .from('enrolled_students')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', student.id)

    if (error) throw error

    try {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        await supabase.from('audit_logs').insert({
          actor_id: data.user.id,
          action: 'REJECT',
          details: { target_student_id: student.id, student_code: student.student_code, reason }
        })
      }
    } catch (logErr) {}

    rejectingStudent.value = null
    rejectionReasonInput.value = ''
    await loadStudents()
    alert(`'${student.name}' 학생의 가입이 반려되었습니다.`)
  } catch (e) {
    console.error(e)
    alert('반려 처리 중 오류가 발생했습니다.')
  } finally {
    processingId.value = null
    processingAction.value = null
  }
}

async function handleDelete(student) {
  if (!confirm(`'${student.name}' (${student.student_code}) 학생 계정을 완전히 삭제하시겠습니까?\n삭제 후 해당 학번으로 새 가입이 필요합니다.`)) return

  processingId.value = student.id
  processingAction.value = 'delete'

  try {
    await deleteStudent(student.id)
    await loadStudents()
    alert(`'${student.name}' 학생 계정이 삭제되었습니다.`)
  } catch (e) {
    console.error(e)
    alert('학생 삭제 처리 중 오류가 발생했습니다.')
  } finally {
    processingId.value = null
    processingAction.value = null
  }
}

onMounted(() => {
  loadRegCode()
  loadStudents()
})
</script>
