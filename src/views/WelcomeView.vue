<template>
  <div class="min-h-screen flex items-center justify-center p-6" style="background: #eeecea;">
    <div
      class="w-full bg-white"
      style="max-width: 840px; border-radius: 20px; box-shadow: 0 8px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05); padding: 2.5rem;"
    >
      <!-- 헤더 -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center rounded-2xl mb-4"
          style="width: 56px; height: 56px; background: #eff6ff;"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold" style="color: #1e293b; margin: 0 0 6px;">학교장 추천자</h1>
        <p class="text-base" style="color: #94a3b8; margin: 0;">선발 관리 시스템</p>
      </div>

      <!-- 0단계: Supabase 연결 설정 -->
      <template v-if="!isSupabaseConfigured">
        <div
          class="rounded-xl text-base leading-relaxed mb-6"
          style="padding: 14px 16px; background: #fffbeb; border: 1px solid #fde68a; color: #78350f;"
        >
          <strong>Supabase 연결 설정 필요</strong><br>
          시스템 구동을 위한 Supabase URL과 Anon Key를 입력해 주세요. 이 정보는 브라우저의 로컬 스토리지에 안전하게 저장됩니다.
        </div>

        <form @submit.prevent="handleSaveSupabase" class="flex flex-col gap-4">
          <div>
            <label class="block text-base font-medium mb-1.5" style="color: #64748b;">SUPABASE URL</label>
            <input
              v-model="inputUrl"
              type="text"
              required
              placeholder="https://your-instance.supabase.co"
              class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"
            />
          </div>
          <div>
            <label class="block text-base font-medium mb-1.5" style="color: #64748b;">SUPABASE ANON KEY</label>
            <textarea
              v-model="inputAnonKey"
              required
              rows="3"
              placeholder="eyJhbGciOi..."
              class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"
            ></textarea>
          </div>

          <button
            type="submit"
            class="w-full text-base font-semibold"
            style="padding: 12px; border: none; border-radius: 10px; background: #2563eb; color: white; cursor: pointer; margin-top: 4px;"
          >연결 설정 저장 및 시작하기</button>
        </form>
      </template>

      <!-- 1단계: 이용 안내 동의 -->
      <template v-else-if="!agreed">
        <div
          class="rounded-xl text-base leading-relaxed mb-6"
          style="padding: 20px 22px; background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; line-height: 1.9;"
        >
          <p class="font-semibold mb-3" style="color: #1e293b;">프로그램 이용 안내</p>
          <p class="mb-3">
            본 프로그램은 학교장추천전형 선발 업무를 편리하게 지원하기 위한 <strong>보조 도구</strong>입니다.
          </p>
          <p class="mb-3">
            프로그램은 입력된 자료를 바탕으로 점수를 계산하고 결과를 정리해 드리지만,
            최종 선발 결과의 정확성 확인 및 공식 결정은 <strong>담당자의 검토와 판단</strong>을 통해 이루어져야 합니다.
          </p>
          <p>
            이 프로그램의 사용으로 인해 발생할 수 있는 결과에 대한 책임은 프로그램 개발자에게 있지 않으며,
            운용 및 결과 활용에 관한 책임은 <strong>사용 기관에 있음</strong>을 확인하여 주시기 바랍니다.
          </p>
        </div>

        <div
          class="rounded-xl text-base leading-relaxed mb-4"
          style="padding: 16px 20px; background: #fffbeb; border: 1px solid #fde68a; color: #78350f;"
        >
          <p class="font-semibold mb-1.5" style="color: #92400e;">라이선스 안내</p>
          <p>
            본 프로그램은 <strong>PolyForm Noncommercial 1.0.0</strong> 라이선스에 따라
            학교·교육청 등 <strong>비상업적 목적에 한해</strong> 무료로 사용할 수 있습니다.
            학원·유료 입시 컨설팅 등 영리 목적의 사교육 기관에서의 사용은 엄격히 금지됩니다.
          </p>
        </div>

        <label class="flex items-start gap-3 cursor-pointer mb-4">
          <input
            v-model="checked"
            type="checkbox"
            class="mt-1 shrink-0"
            style="width: 18px; height: 18px; accent-color: #2563eb; cursor: pointer;"
          />
          <span class="text-base" style="color: #334155;">위 내용을 확인하였으며, 이에 동의합니다.</span>
        </label>

        <button
          @click="agreed = true"
          :disabled="!checked"
          class="w-full text-base font-semibold disabled:opacity-40 transition-colors"
          style="padding: 12px; border: none; border-radius: 10px; background: #2563eb; color: white; cursor: pointer;"
        >
          동의하고 계속하기
        </button>
      </template>

      <!-- 2단계: 비밀번호 설정 -->
      <template v-else>
        <div
          class="rounded-xl text-base leading-relaxed mb-6"
          style="padding: 14px 16px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8;"
        >
          처음 실행되었습니다.<br>
          관리자(admin) 및 교사(teacher) 계정 정보를 설정해 주세요.
        </div>

        <form @submit.prevent="handleSetup" class="flex flex-col gap-4">
          <!-- 1. 관리자 정보 -->
          <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-3">
            <p class="font-bold text-slate-700" style="margin: 0;">1. 관리자 계정 설정</p>
            <div>
              <label class="block text-sm font-semibold mb-1 text-slate-500">관리자 아이디</label>
              <input
                v-model="adminId"
                type="text"
                required
                disabled
                class="w-full text-base bg-slate-100 cursor-not-allowed"
                style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1 text-slate-500">관리자 비밀번호 (8자 이상)</label>
              <input
                v-model="password"
                type="password"
                autocomplete="new-password"
                required
                minlength="8"
                placeholder="비밀번호 입력"
                class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1 text-slate-500">관리자 비밀번호 확인</label>
              <input
                v-model="confirm"
                type="password"
                autocomplete="new-password"
                required
                placeholder="비밀번호 재입력"
                class="w-full text-base focus:outline-none focus:ring-2"
                :class="confirm && password !== confirm ? 'focus:ring-red-400' : 'focus:ring-blue-400'"
                :style="{
                  border: confirm && password !== confirm ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                  borderRadius: '8px', padding: '10px 14px', boxSizing: 'border-box',
                }"
              />
              <p v-if="confirm && password !== confirm" class="text-sm mt-1" style="color: #ef4444; margin: 0;">
                비밀번호가 일치하지 않습니다.
              </p>
            </div>
          </div>

          <!-- 2. 교사 정보 -->
          <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-3">
            <p class="font-bold text-slate-700" style="margin: 0;">2. 교사 계정 설정</p>
            <div>
              <label class="block text-sm font-semibold mb-1 text-slate-500">교사 아이디</label>
              <input
                v-model="teacherId"
                type="text"
                required
                disabled
                class="w-full text-base bg-slate-100 cursor-not-allowed"
                style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1 text-slate-500">교사 비밀번호 (8자 이상)</label>
              <input
                v-model="teacherPassword"
                type="password"
                autocomplete="new-password"
                required
                minlength="8"
                placeholder="비밀번호 입력"
                class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1 text-slate-500">교사 비밀번호 확인</label>
              <input
                v-model="teacherConfirm"
                type="password"
                autocomplete="new-password"
                required
                placeholder="비밀번호 재입력"
                class="w-full text-base focus:outline-none focus:ring-2"
                :class="teacherConfirm && teacherPassword !== teacherConfirm ? 'focus:ring-red-400' : 'focus:ring-blue-400'"
                :style="{
                  border: teacherConfirm && teacherPassword !== teacherConfirm ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                  borderRadius: '8px', padding: '10px 14px', boxSizing: 'border-box',
                }"
              />
              <p v-if="teacherConfirm && teacherPassword !== teacherConfirm" class="text-sm mt-1" style="color: #ef4444; margin: 0;">
                비밀번호가 일치하지 않습니다.
              </p>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading || !canSubmit"
            class="w-full text-base font-semibold disabled:opacity-40 transition-colors"
            style="padding: 12px; border: none; border-radius: 10px; background: #2563eb; color: white; cursor: pointer; margin-top: 4px;"
          >{{ loading ? '설정 및 생성 중…' : '시작하기' }}</button>
        </form>

        <p v-if="error" class="text-base text-center mt-4" style="color: #ef4444;">{{ error }}</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase, setSupabaseConfig } from '../utils/supabaseClient'

const router = useRouter()
const auth = useAuthStore()

const isSupabaseConfigured = ref(!!supabase)
const inputUrl = ref(localStorage.getItem('pcm_supabase_url') || '')
const inputAnonKey = ref(localStorage.getItem('pcm_supabase_anon_key') || '')

const agreed = ref(false)
const checked = ref(false)

const adminId = ref('admin')
const password = ref('')
const confirm = ref('')

const teacherId = ref('teacher')
const teacherPassword = ref('')
const teacherConfirm = ref('')

const loading = ref(false)
const error = ref(null)

const canSubmit = computed(
  () => adminId.value.trim().length > 0 &&
        password.value.length >= 8 &&
        password.value === confirm.value &&
        teacherId.value.trim().length > 0 &&
        teacherPassword.value.length >= 8 &&
        teacherPassword.value === teacherConfirm.value
)

function handleSaveSupabase() {
  if (!inputUrl.value.trim() || !inputAnonKey.value.trim()) {
    error.value = 'URL과 API 키를 입력해 주세요.'
    return
  }
  setSupabaseConfig(inputUrl.value.trim(), inputAnonKey.value.trim())
}

async function handleSetup() {
  if (!canSubmit.value) return
  error.value = null
  loading.value = true
  try {
    // 1. 관리자 계정 가입 및 로그인 완료
    await auth.loginAdmin(adminId.value.trim(), password.value)
    
    // 2. 통합 교사(teacher) 계정 생성을 위한 RPC 원격 호출 실행
    const { error: rpcErr } = await supabase.rpc('create_unified_teacher_account', {
      p_password: teacherPassword.value
    })
    
    if (rpcErr) throw rpcErr

    router.push('/admin')
  } catch (e) {
    error.value = e.message || e.response?.data || '설정에 실패했습니다. 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}
</script>
