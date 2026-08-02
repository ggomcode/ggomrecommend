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

      <!-- 1-2. 정보공시 재학생 수 설정 -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 class="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <span class="w-1 h-3 bg-blue-600 rounded-full"></span>
          정보공시 재학생 수 (% 인원제한 환산 기준)
        </h2>
        <p class="text-xs text-slate-400 mb-4">
          4월 1일 기준 학교 재학생 수(정보공시 자료)를 입력합니다.
          대학별 인원제한이 <strong>3%</strong>, <strong>11%</strong>처럼 퍼센트로 표시된 경우, 이 인원을 기준으로 계산합니다.<br>
          예: 재학생 수 325명, 인원제한 3% → 325 × 3% = 9.75 → <strong>10명</strong> (소수점 올림)
        </p>

        <form @submit.prevent="saveDisclosureCount" class="flex gap-3 max-w-sm">
          <div class="flex items-center gap-2 flex-1">
            <input
              v-model.number="disclosureCount"
              type="number"
              min="1"
              max="9999"
              placeholder="예: 325"
              class="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-white"
            />
            <span class="text-sm text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap">명</span>
          </div>
          <button
            type="submit"
            :disabled="disclosureCountLoading"
            class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-4 cursor-pointer transition-colors whitespace-nowrap"
          >
            {{ disclosureCountLoading ? '저장 중…' : '저장' }}
          </button>
        </form>
        <p v-if="disclosureCount" class="text-xs text-slate-500 mt-2">
          현재 설정: <strong class="text-blue-600">{{ disclosureCount }}명</strong>
        </p>
        <p v-else class="text-xs text-amber-600 mt-2">
          ⚠️ 미설정 상태입니다. % 인원제한이 있는 경우 무제한으로 처리됩니다.
        </p>

        <!-- % 인원 동기화 버튼 -->
        <div class="mt-4 pt-4 border-t border-slate-100">
          <p class="text-xs text-slate-500 mb-2">
            재학생 수를 저장한 후, 아래 버튼으로 <strong>대학별 % 인원을 실제 명수로 재계산</strong>하여
            대학 설정 탭과 결과 보고서에 <strong>10명 (3%)</strong> 형식으로 표시됩니다.
          </p>
          <button
            type="button"
            :disabled="syncLoading || !disclosureCount"
            @click="doSyncPercentQuotas"
            class="text-xs font-bold text-white border-none rounded-lg px-4 py-2 cursor-pointer transition-colors"
            :class="syncLoading || !disclosureCount ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'"
          >
            {{ syncLoading ? '재계산 중…' : '🔄 % 인원 재계산 동기화' }}
          </button>
          <p v-if="syncResult" class="text-xs mt-2 whitespace-pre-line" :class="syncResult.startsWith('❌') ? 'text-red-600' : 'text-emerald-700'">{{ syncResult }}</p>
        </div>
      </div>


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

      <!-- 4. 전형요소 등록 후 세부 수정 허용 (테스트/수정 모드) -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
              <span class="w-1 h-3 bg-blue-600 rounded-full"></span>
              전형요소 등록 후 세부 수정 허용 (테스트/수정 모드)
            </h2>
            <p class="text-xs text-slate-400">
              전형요소를 생성한 후에도 이름, 만점 배점, 산출 방식, 탐색 방향 등 세부 옵션을 자유롭게 수정할 수 있도록 허용합니다. (테스트 기간 권장)
            </p>
          </div>
          <button
            type="button"
            @click="toggleAllowAreaEdit"
            :disabled="areaEditLoading"
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            :class="allowAreaEdit ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              :class="allowAreaEdit ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../utils/supabaseClient'
import { fetchSchoolName, setSchoolNameConfig } from '../../utils/schoolConfig'
import { getDisclosureCount, setDisclosureCount, syncRegionalToUniversities } from '../../api/admin.js'

const inputSchoolName = ref('')
const schoolNameLoading = ref(false)

const classCount = ref(11)
const classCountLoading = ref(false)

const disclosureCount = ref(null)
const disclosureCountLoading = ref(false)
const syncLoading = ref(false)
const syncResult = ref('')

const regCode = ref('')
const regCodeLoading = ref(false)

const openaiKey = ref('')
const openaiLoading = ref(false)

const allowAreaEdit = ref(false)
const areaEditLoading = ref(false)

async function loadConfig() {
  inputSchoolName.value = await fetchSchoolName()
  const localEdit = localStorage.getItem('pcm_allow_area_edit') === 'true'
  allowAreaEdit.value = localEdit
  // 정보공시 재학생 수 로드
  disclosureCount.value = await getDisclosureCount()
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

    const { data: editData } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'allow_area_edit')
      .maybeSingle()
    if (editData && editData.value) {
      allowAreaEdit.value = editData.value === 'true'
      localStorage.setItem('pcm_allow_area_edit', editData.value)
    }
  } catch (e) {
    console.error('Error loading config:', e)
  }
}

async function toggleAllowAreaEdit() {
  allowAreaEdit.value = !allowAreaEdit.value
  areaEditLoading.value = true
  localStorage.setItem('pcm_allow_area_edit', String(allowAreaEdit.value))
  if (supabase) {
    try {
      await supabase
        .from('config')
        .upsert({ key: 'allow_area_edit', value: String(allowAreaEdit.value) })
    } catch (e) {
      console.error(e)
    } finally {
      areaEditLoading.value = false
    }
  } else {
    areaEditLoading.value = false
  }
}

async function saveSchoolName() {
  schoolNameLoading.value = true
  try {
    const finalName = await setSchoolNameConfig(inputSchoolName.value)
    inputSchoolName.value = finalName
    alert('학교 이름이 \'' + finalName + '\'(으)로 설정되었습니다.')
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
    alert('3학년 학급 수가 ' + classCount.value + '반으로 변경되었습니다.')
  } catch (e) {
    console.error(e)
    alert('학급 수 변경 도중 오류가 발생했습니다.')
  } finally {
    classCountLoading.value = false
  }
}

async function saveDisclosureCount() {
  if (!disclosureCount.value || disclosureCount.value < 1) {
    alert('재학생 수를 1명 이상으로 입력해 주세요.')
    return
  }
  disclosureCountLoading.value = true
  try {
    await setDisclosureCount(disclosureCount.value)
    syncResult.value = ''
    alert(`정보공시 재학생 수가 ${disclosureCount.value}명으로 저장되었습니다.`)
  } catch (e) {
    console.error(e)
    alert('저장 도중 오류가 발생했습니다.')
  } finally {
    disclosureCountLoading.value = false
  }
}

async function doSyncPercentQuotas() {
  if (!disclosureCount.value || disclosureCount.value < 1) {
    alert('먼저 정보공시 재학생 수를 저장해 주세요.')
    return
  }
  syncLoading.value = true
  syncResult.value = ''
  try {
    const res = await syncRegionalToUniversities()
    const updated = res.updatedCount || 0
    const created = res.count || 0
    if (updated > 0 || created > 0) {
      syncResult.value = '✅ 완료: 신규 ' + created + '건 등록, 기존 ' + updated + '건 업데이트.\n대학 설정 탭과 결과 보고서를 새로고침하면 적용됩니다.'
    } else {
      syncResult.value = '업데이트할 항목이 없습니다. (엑셀 데이터가 없거나 이미 최신 상태)'
    }
    if (res.percentWarnings && res.percentWarnings.length > 0) {
      syncResult.value += '\n⚠️ 처리 안된 항목:\n' + res.percentWarnings.join('\n')
    }
  } catch (e) {
    syncResult.value = '❌ 오류: ' + (e.message || '동기화 중 오류 발생')
  } finally {
    syncLoading.value = false
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
