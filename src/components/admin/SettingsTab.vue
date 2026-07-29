<template>
  <div class="py-8 px-4 sm:px-10 max-w-4xl">
    <!-- 페이지 헤더 -->
    <div class="mb-6">
      <p class="text-xs font-semibold mb-1 text-slate-400">관리자</p>
      <h1 class="text-2xl font-semibold text-slate-800 dark:text-white" style="margin: 0;">시스템 설정</h1>
    </div>

    <div class="flex flex-col gap-6">
      <!-- 1. 학생 가입 설정 -->
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
            class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-4 cursor-pointer transition-colors"
          >
            {{ regCodeLoading ? '변경 중…' : '변경 적용' }}
          </button>
        </form>
      </div>

      <!-- 2. AI OCR API 설정 (OpenAI GPT-4o-mini Vision) -->
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
            class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-4 cursor-pointer transition-colors"
          >
            {{ openaiLoading ? '저장 중…' : '저장 적용' }}
          </button>
        </form>
      </div>

      <!-- 3. Supabase 데이터베이스 연결 정보 설정 (localStorage 캐싱) -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 class="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <span class="w-1 h-3 bg-blue-600 rounded-full"></span>
          Supabase 데이터베이스 연결 설정
        </h2>
        <p class="text-xs text-slate-400 mb-4">본 LAN 웹애플리케이션의 클라이언트와 백엔드 DB 연결을 수행하는 Supabase Credentials 정보입니다. 변경 시 브라우저 세션에 저장됩니다.</p>

        <form @submit.prevent="saveSupabaseCredentials" class="space-y-4 max-w-xl">
          <div>
            <label class="block text-xs font-bold text-slate-400 mb-1">SUPABASE URL</label>
            <input
              v-model="supabaseUrl"
              type="text"
              required
              placeholder="https://your-instance.supabase.co"
              class="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 mb-1">SUPABASE ANON KEY</label>
            <textarea
              v-model="supabaseAnonKey"
              required
              rows="3"
              placeholder="eyJhbGciOi..."
              class="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none font-mono"
            ></textarea>
          </div>

          <div class="flex gap-2">
            <button
              type="submit"
              class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-4 py-2 cursor-pointer transition-colors"
            >
              Credentials 저장 및 새로고침
            </button>
            <button
              type="button"
              @click="clearSupabaseCredentials"
              class="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 border-none rounded-lg px-4 py-2 cursor-pointer transition-colors"
            >
              기본 빌드 설정으로 초기화
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../utils/supabaseClient'

const regCode = ref('')
const regCodeLoading = ref(false)

const openaiKey = ref('')
const openaiLoading = ref(false)

const supabaseUrl = ref('')
const supabaseAnonKey = ref('')

async function loadConfig() {
  if (!supabase) return
  try {
    const { data: codeData } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'registration_code')
      .single()
    if (codeData) {
      regCode.value = codeData.value
    }

    const { data: keyData } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'openai_api_key')
      .single()
    if (keyData) {
      openaiKey.value = keyData.value
    }
  } catch (e) {
    console.error('Error loading config:', e)
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

function loadSupabaseCredentials() {
  supabaseUrl.value = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL || ''
  supabaseAnonKey.value = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
}

function saveSupabaseCredentials() {
  localStorage.setItem('supabase_url', supabaseUrl.value)
  localStorage.setItem('supabase_anon_key', supabaseAnonKey.value)
  alert('설정이 저장되었습니다. 새 Credentials로 재부팅을 시작합니다.')
  window.location.reload()
}

function clearSupabaseCredentials() {
  localStorage.removeItem('supabase_url')
  localStorage.removeItem('supabase_anon_key')
  alert('로컬 설정이 삭제되었습니다. 빌드 타임 환경설정(env) 파일의 기본값으로 환원하고 재부팅합니다.')
  window.location.reload()
}

onMounted(() => {
  loadConfig()
  loadSupabaseCredentials()
})
</script>
