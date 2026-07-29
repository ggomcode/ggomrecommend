<template>
  <div class="py-8 px-4 sm:px-10 max-w-4xl">
    <!-- 페이지 헤더 -->
    <div class="mb-6">
      <p class="text-xs font-semibold mb-1 text-slate-500" style="color: #64748b; margin: 0 0 4px;">관리자</p>
      <h1 class="text-2xl font-bold text-slate-800" style="color: #1e293b; margin: 0;">시스템 설정</h1>
    </div>

    <div class="flex flex-col gap-6">
      <!-- 0. 학교 이름 설정 -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 class="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <span class="w-1 h-3 bg-blue-600 rounded-full"></span>
          학교 이름 설정
        </h2>
        <p class="text-xs text-slate-400 mb-4">
          시스템 헤더 및 메인 타이틀 상단에 표시될 학교 이름을 지정합니다. (미입력 시 기본값: '우리학교', '우리고' 입력 시 '우리고등학교'로 자동 변환 저장됩니다)
        </p>

        <form @submit.prevent="saveSchoolName" class="flex gap-3 max-w-md">
          <input
            v-model="inputSchoolName"
            type="text"
            placeholder="예: 우리고 또는 우리고등학교"
            class="flex-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-white"
          />
          <button
            type="submit"
            :disabled="schoolNameLoading"
            class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-4 cursor-pointer transition-colors whitespace-nowrap"
          >
            {{ schoolNameLoading ? '저장 중…' : '학교 이름 저장' }}
          </button>
        </form>
      </div>

      <!-- 1. 학급 수 설정 (디폴트 11반) -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 class="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <span class="w-1 h-3 bg-blue-600 rounded-full"></span>
          3학년 학급 수 설정 (기본 11반)
        </h2>
        <p class="text-xs text-slate-400 mb-4">교사 화면의 '조회 학급 선택' 드롭다운에 표시될 3학년 학급 수(반 개수)를 지정합니다.</p>

        <form @submit.prevent="saveClassCount" class="flex gap-3 max-w-sm">
          <div class="flex items-center gap-2 flex-1">
            <input
              v-model.number="classCount"
              type="number"
              min="1"
              max="30"
              required
              class="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-white"
            />
            <span class="text-sm text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap">반</span>
          </div>
          <button
            type="submit"
            :disabled="classCountLoading"
            class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-4 cursor-pointer transition-colors whitespace-nowrap"
          >
            {{ classCountLoading ? '저장 중…' : '학급 수 변경' }}
          </button>
        </form>
      </div>

      <!-- 2. 학생 가입 설정 -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 class="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <span class="w-1 h-3 bg-blue-600 rounded-full"></span>
          학생 회원가입 설정
        </h2>
        <p class="text-xs text-slate-400 mb-4">학생들이 가입할 때 인증을 위해 필요한 가입코드(registration code)를 지정합니다.</p>

        <form @submit.prevent="saveRegCode" class="flex gap-3 max-w-md">
          <input
            v-model="regCode"
            type="text"
            required
            placeholder="가입코드 입력"
            class="flex-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-white"
          />
          <button
            type="submit"
            :disabled="regCodeLoading"
            class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-4 cursor-pointer transition-colors whitespace-nowrap"
          >
            {{ regCodeLoading ? '변경 중…' : '변경 적용' }}
          </button>
        </form>
      </div>

      <!-- 3. AI OCR API 설정 (OpenAI GPT-4o-mini Vision) -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 class="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <span class="w-1 h-3 bg-blue-600 rounded-full"></span>
          AI OCR 연동 설정 (OpenAI API)
        </h2>
        <p class="text-xs text-slate-400 mb-4">제출된 포기원 등 PDF/이미지 양식을 판독할 OpenAI GPT-4o-mini Vision 분석기 API 키를 설정합니다.</p>

        <form @submit.prevent="saveOpenAIKey" class="flex gap-3 max-w-lg">
          <input
            v-model="openaiKey"
            type="password"
            required
            placeholder="sk-..."
            class="flex-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-white font-mono"
          />
          <button
            type="submit"
            :disabled="openaiLoading"
            class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-4 cursor-pointer transition-colors whitespace-nowrap"
          >
            {{ openaiLoading ? '저장 중…' : '저장 적용' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../utils/supabaseClient'
import { fetchSchoolName, setSchoolNameConfig } from '../../utils/schoolConfig'

const inputSchoolName = ref('')
const schoolNameLoading = ref(false)

const classCount = ref(11)
const classCountLoading = ref(false)

const regCode = ref('')
const regCodeLoading = ref(false)

const openaiKey = ref('')
const openaiLoading = ref(false)

async function loadConfig() {
  inputSchoolName.value = await fetchSchoolName()
  if (!supabase) return
  try {
    const { data: countData } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'class_count')
      .maybeSingle()
    if (countData && countData.value) {
      classCount.value = Number(countData.value) || 11
    }

    const { data: codeData } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'registration_code')
      .maybeSingle()
    if (codeData && codeData.value) {
      regCode.value = codeData.value
    }

    const { data: keyData } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'openai_api_key')
      .maybeSingle()
    if (keyData && keyData.value) {
      openaiKey.value = keyData.value
    }
  } catch (e) {
    console.error('Error loading config:', e)
  }
}

async function saveSchoolName() {
  schoolNameLoading.value = true
  try {
    const finalName = await setSchoolNameConfig(inputSchoolName.value)
    inputSchoolName.value = finalName
    alert(`학교 이름이 '${finalName}'(으)로 설정되었습니다.`)
  } catch (e) {
    console.error(e)
    alert('학교 이름 저장 도중 오류가 발생했습니다.')
  } finally {
    schoolNameLoading.value = false
  }
}

async function saveClassCount() {
  if (!supabase) return
  classCountLoading.value = true
  try {
    const { error } = await supabase
      .from('config')
      .upsert({ key: 'class_count', value: String(classCount.value) })

    if (error) throw error
    localStorage.setItem('pcm_class_count', String(classCount.value))
    alert(`3학년 학급 수가 ${classCount.value}반으로 변경되었습니다.`)
  } catch (e) {
    console.error(e)
    alert('학급 수 변경 도중 오류가 발생했습니다.')
  } finally {
    classCountLoading.value = false
  }
}

async function saveRegCode() {
  if (!supabase) return
  regCodeLoading.value = true
  try {
    const { error } = await supabase
      .from('config')
      .upsert({ key: 'registration_code', value: regCode.value })

    if (error) throw error
    alert('학생 가입코드가 변경되었습니다.')
  } catch (e) {
    console.error(e)
    alert('가입코드 변경 도중 오류가 발생했습니다.')
  } finally {
    regCodeLoading.value = false
  }
}

async function saveOpenAIKey() {
  if (!supabase) return
  openaiLoading.value = true
  try {
    const { error } = await supabase
      .from('config')
      .upsert({ key: 'openai_api_key', value: openaiKey.value })

    if (error) throw error
    alert('OpenAI API Key가 저장되었습니다.')
  } catch (e) {
    console.error(e)
    alert('OpenAI Key 저장 도중 오류가 발생했습니다.')
  } finally {
    openaiLoading.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>
