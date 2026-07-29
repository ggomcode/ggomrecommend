<template>
  <div style="padding: 2rem 2.5rem;">
    <!-- 페이지 헤더 -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <p class="text-base mb-1" style="color: #94a3b8;">담임교사</p>
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
      <div class="flex gap-2 p-1 bg-slate-100 border border-slate-200 rounded-xl max-w-sm">
        <button
          v-for="s in ['pending', 'approved', 'rejected']"
          :key="s"
          @click="statusFilter = s"
          class="flex-1 text-xs font-bold py-1.5 rounded-lg border-none transition-all cursor-pointer"
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
              <th class="text-xs font-bold text-slate-500 p-4 text-left">학년/반/번호 (졸업년도)</th>
              <th class="text-xs font-bold text-slate-500 p-4 text-center">신청일</th>
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
              </td>
              <td class="p-4 text-sm font-semibold font-mono text-slate-800">{{ student.student_code }}</td>
              <td class="p-4 text-sm font-semibold text-slate-800">{{ student.name }}</td>
              <td class="p-4 text-sm font-mono text-slate-500">{{ student.phone_last4 }}</td>
              <td class="p-4 text-sm text-slate-600">
                {{ student.is_enrolled ? `${student.grade}학년 ${student.class_no}반 ${student.seq_no}번` : `${student.grad_year}년 졸업생` }}
              </td>
              <td class="p-4 text-xs text-slate-400 text-center font-mono">
                {{ new Date(student.created_at).toLocaleDateString() }}
              </td>
              <td class="p-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button
                    v-if="student.status !== 'approved'"
                    @click="updateStatus(student.id, 'approved')"
                    class="px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg cursor-pointer transition-colors"
                  >승인</button>
                  <button
                    v-if="student.status !== 'rejected'"
                    @click="updateStatus(student.id, 'rejected')"
                    class="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg cursor-pointer transition-colors"
                  >반려</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../utils/supabaseClient'

const students = ref([])
const loading = ref(true)
const statusFilter = ref('pending')
const regCode = ref('school2026!')

function statusLabel(s) {
  if (s === 'pending') return '승인 대기'
  if (s === 'approved') return '승인 완료'
  return '반려 대기'
}

const filteredStudents = computed(() => {
  return students.value.filter(s => s.status === statusFilter.value)
})

function filteredStudentsCount(s) {
  return students.value.filter(item => item.status === s).length
}

// 가입코드 조회
async function loadRegCode() {
  if (!supabase) return
  const { data } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'registration_code')
    .single()
  if (data) {
    regCode.value = data.value
  }
}

// 학생 리스트 로드
async function loadStudents() {
  loading.value = true
  try {
    if (!supabase) return
    
    // 교사의 담당 학급 획득하여 해당 반 학생들만 조회 가능
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    let query = supabase.from('profiles').select('*').eq('role', 'student')
    
    // 졸업생 담당 교사는 졸업생만, 그 외에는 자기 학급만
    if (profile.grade !== 0) {
      query = query.eq('grade', profile.grade).eq('class_no', profile.class_no).eq('is_enrolled', true)
    } else {
      query = query.eq('is_enrolled', false)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    students.value = data || []
  } catch (e) {
    console.error('Error loading students for approval:', e)
  } finally {
    loading.value = false
  }
}

// 학생 승인 상태 변경
async function updateStatus(studentId, newStatus) {
  if (!supabase) return
  const actionLabel = newStatus === 'approved' ? '승인' : '반려'
  if (!confirm(`해당 학생의 가입을 ${actionLabel}하시겠습니까?`)) return

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', studentId)

    if (error) throw error

    // 감사로그
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: newStatus === 'approved' ? 'APPROVE' : 'REJECT',
      details: { target_student_id: studentId }
    })

    // 리스트 리로드
    await loadStudents()
  } catch (e) {
    console.error(e)
    alert('승인 처리 중 오류가 발생했습니다.')
  }
}

onMounted(() => {
  loadRegCode()
  loadStudents()
})
</script>
