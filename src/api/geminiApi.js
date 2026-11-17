import { supabase } from '../utils/supabaseClient'

export const GEMINI_CONFIG_KEY = 'gemini_api_key'
export const GEMINI_LOCAL_KEY = 'pcm_gemini_api_key'
export const GEMINI_MODEL_CONFIG_KEY = 'gemini_selected_model'
export const GEMINI_MODEL_LOCAL_KEY = 'pcm_gemini_selected_model'
export const GEMINI_DEFAULT_MODEL = 'gemini-3.8-flash'
export const GEMINI_PRIMARY_MODEL = 'gemini-3.8-flash'
export const GEMINI_FALLBACK_MODEL = 'gemini-3.7-flash'
export const AI_GRADE_REPORT_PREFIX = 'ai_report_grade_comparison_'
export const COMPREHENSIVE_AI_REPORT_PREFIX = 'ai_report_stat_comprehensive_'
export const STUDENT_COUNSEL_PREFIX = 'ai_counsel_student_'

/**
 * 404(미지원) 또는 503(High Demand 과부하) 발생 시 안전하게 우회할 직전 안정 모델 탐색
 */
export function getFallbackGeminiModel(currentModel) {
  if (currentModel === 'gemini-3.8-flash') return 'gemini-3.7-flash'
  if (currentModel === 'gemini-3.7-flash') return 'gemini-3.8-flash-lite'
  if (currentModel === 'gemini-3.8-flash-lite') return 'gemini-2.5-flash'
  if (currentModel === 'gemini-2.5-flash') return 'gemini-2.5-flash-lite'
  return 'gemini-3.8-flash-lite'
}

/**
 * 0. 현재 선택/저장된 Gemini AI 모델 조회 (Supabase config -> localStorage -> 기본값)
 */
export async function getSelectedGeminiModel() {
  let model = ''
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', GEMINI_MODEL_CONFIG_KEY)
        .maybeSingle()

      if (!error && data && data.value && String(data.value).trim()) {
        model = String(data.value).trim()
      }
    } catch (e) {
      console.warn('Supabase config에서 Gemini 모델 조회 실패 (로컬 스토리지 확인 중):', e)
    }
  }

  if (!model) {
    const localVal = localStorage.getItem(GEMINI_MODEL_LOCAL_KEY)
    if (localVal && localVal.trim()) {
      model = localVal.trim()
    }
  }

  // Google에서 지원 중단된 2.0 모델이 남아있는 경우 자동으로 최신 3.8로 보정
  if (!model || model.includes('gemini-2.0')) {
    model = GEMINI_DEFAULT_MODEL
  }

  localStorage.setItem(GEMINI_MODEL_LOCAL_KEY, model)
  return model
}

/**
 * 0-1. 선택된 Gemini AI 모델 저장 (Supabase config + localStorage)
 */
export async function saveSelectedGeminiModel(modelName) {
  const cleanModel = modelName ? String(modelName).trim() : GEMINI_DEFAULT_MODEL

  if (supabase) {
    try {
      const { error } = await supabase
        .from('config')
        .upsert({ key: GEMINI_MODEL_CONFIG_KEY, value: cleanModel }, { onConflict: 'key' })

      if (error) {
        console.error('Supabase Gemini 모델 저장 오류:', error)
      }
    } catch (e) {
      console.warn('Supabase Gemini 모델 저장 실패:', e)
    }
  }

  localStorage.setItem(GEMINI_MODEL_LOCAL_KEY, cleanModel)
  return cleanModel
}

/**
 * 최신 버전 vs 직전 버전 간의 토큰 소비 배율(추정) 산출
 * - 기본적으로 동일 Flash 제품군은 동일 프롬프트/JSON 규격에 대해 거의 1.0배 (동일 토큰)
 * - Thinking/Reasoning 등 사고 토큰이 대량 발생하는 특수 모델은 소비 배율을 반영
 */
export function estimateTokenConsumptionRatio(latest, prev) {
  if (!latest || !prev) return 1.0

  // 1. Thinking / Reasoning / CoT 모델 감지 시 (사고 토큰으로 인해 33% 이상 추가 소비 발생)
  const isLatestThinking = /thinking|reasoning|cot/i.test(latest.id || '')
  const isPrevThinking = /thinking|reasoning|cot/i.test(prev.id || '')
  if (isLatestThinking && !isPrevThinking) {
    return 1.6 // 사고 토큰으로 인해 약 60% 이상 추가 소비
  }

  // 2. 표준 Flash 세대 간 업그레이드는 동일 프롬프트/JSON 규격에서 토큰 소비량이 동일 (1.0배)
  return 1.0
}

/**
 * 0-2. Gemini API의 ModelService.ListModels 응답에서 요구조건 3대 모델 필터링 및 동적 디폴트 판정
 * 
 * [동적 기본 권장(Default) 판정 규칙]
 * - 최신 버전의 토큰 사용량이 직전 버전보다 33% 이상 높으면 -> 직전 버전(prevFlash)을 기본 권장으로 지정
 * - 토큰 사용량이 같거나 차이가 33% 이하이면 -> 최신 버전(latestFlash)을 기본 권장으로 지정
 * 
 * 1) 최신 Flash 버전
 * 2) 직전 Flash 버전
 * 3) 최신 Flash-Lite 버전
 */
export function parseGeminiModelList(modelsList) {
  const contentModels = (modelsList || []).filter(m => {
    const methods = m.supportedGenerationMethods || []
    return methods.includes('generateContent')
  })

  const flashModels = []
  const liteModels = []

  for (const m of contentModels) {
    const rawId = (m.name || '').replace(/^models\//, '')
    const isLite = /lite|8b/i.test(rawId)
    const verMatch = rawId.match(/gemini-(\d+(?:\.\d+)?)/i)
    if (!verMatch) continue

    const verStr = verMatch[1] // '2.0', '2.5', '1.5' 등
    const verNum = parseFloat(verStr)
    const isCanonical = !/-exp|-preview|-001/i.test(rawId)

    const item = {
      id: rawId,
      versionStr: verStr,
      versionNum: verNum,
      displayName: m.displayName || rawId,
      isCanonical
    }

    if (isLite) {
      liteModels.push(item)
    } else if (/flash/i.test(rawId)) {
      flashModels.push(item)
    }
  }

  // 버전 내림차순 정렬 (정식 릴리스 우선, 짧은 ID 우선)
  const sortFn = (a, b) => {
    if (b.versionNum !== a.versionNum) return b.versionNum - a.versionNum
    if (a.isCanonical && !b.isCanonical) return -1
    if (!a.isCanonical && b.isCanonical) return 1
    return a.id.length - b.id.length
  }

  flashModels.sort(sortFn)
  liteModels.sort(sortFn)

  // 버전별 중복 제거
  const uniqueFlashByVersion = []
  const seenFlashVer = new Set()
  for (const fm of flashModels) {
    if (!seenFlashVer.has(fm.versionStr)) {
      seenFlashVer.add(fm.versionStr)
      uniqueFlashByVersion.push(fm)
    }
  }

  const uniqueLiteByVersion = []
  const seenLiteVer = new Set()
  for (const lm of liteModels) {
    if (!seenLiteVer.has(lm.versionStr)) {
      seenLiteVer.add(lm.versionStr)
      uniqueLiteByVersion.push(lm)
    }
  }

  // 1. 가장 최신버전의 flash버전
  const latestFlash = uniqueFlashByVersion[0] || null

  // 2. 가장 최신버전 직전의 flash버전 (2개 이상이면 index 1, 1개뿐이면 latestFlash)
  const prevFlash = uniqueFlashByVersion.length > 1 ? uniqueFlashByVersion[1] : latestFlash

  // 3. lite중에서 가장 최신버전의 flash-lite버전
  const latestLite = uniqueLiteByVersion[0] || null

  // 4. 최신 vs 직전 버전 동적 디폴트 판정 알고리즘:
  // - 최신 버전의 토큰 소비량이 직전 버전보다 33% 이상 높으면 -> 직전 버전(prevFlash)을 디폴트로 선택
  // - 토큰 소비량이 같거나 33% 미만 차이면 -> 최신 버전(latestFlash)을 디폴트로 선택
  const tokenRatio = estimateTokenConsumptionRatio(latestFlash, prevFlash)
  const isLatestOver33Percent = tokenRatio >= 1.33
  const defaultIsPrev = isLatestOver33Percent && prevFlash && prevFlash.id !== latestFlash?.id

  const results = []
  if (latestFlash) {
    results.push({
      role: 'latest_flash',
      isDefault: !defaultIsPrev,
      id: latestFlash.id,
      version: latestFlash.versionStr,
      label: !defaultIsPrev
        ? `Gemini ${latestFlash.versionStr} Flash (최신 / 기본 권장)`
        : `Gemini ${latestFlash.versionStr} Flash (최신)`
    })
  }
  if (prevFlash && (!latestFlash || prevFlash.id !== latestFlash.id)) {
    results.push({
      role: 'prev_flash',
      isDefault: defaultIsPrev,
      id: prevFlash.id,
      version: prevFlash.versionStr,
      label: defaultIsPrev
        ? `Gemini ${prevFlash.versionStr} Flash (직전 최신 / 기본 권장)`
        : `Gemini ${prevFlash.versionStr} Flash (직전 최신)`
    })
  }
  if (latestLite) {
    results.push({
      role: 'latest_lite',
      isDefault: false,
      id: latestLite.id,
      version: latestLite.versionStr,
      label: `Gemini ${latestLite.versionStr} Flash-Lite (최신 경량)`
    })
  }

  // 검색 결과가 비었을 때를 위한 안전 기본값
  if (results.length === 0) {
    results.push(
      { role: 'latest_flash', isDefault: true, id: 'gemini-3.8-flash', version: '3.8', label: 'Gemini 3.8 Flash (최신 / 기본 권장)' },
      { role: 'prev_flash', isDefault: false, id: 'gemini-3.7-flash', version: '3.7', label: 'Gemini 3.7 Flash (직전 최신)' },
      { role: 'latest_lite', isDefault: false, id: 'gemini-3.8-flash-lite', version: '3.8', label: 'Gemini 3.8 Flash-Lite (최신 경량)' }
    )
  }

  const defaultId = defaultIsPrev ? prevFlash.id : (latestFlash ? latestFlash.id : results[0].id)
  return {
    models: results,
    defaultModel: defaultId,
    tokenRatio
  }
}

/**
 * 0-3. 사용자의 API Key로 Google Generative Language API의 ModelService.ListModels 호출
 */
export async function fetchAvailableGeminiModels(apiKey) {
  const key = apiKey || await getGeminiApiKey()
  if (!key) {
    throw new Error('API Key가 입력되지 않았습니다.')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
  const res = await fetch(url)
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}))
    throw new Error(errJson?.error?.message || `HTTP ${res.status}: 모델 목록 조회 실패`)
  }

  const data = await res.json()
  return parseGeminiModelList(data.models || [])
}

/**
 * 1. Gemini API Key 조회 (Supabase config 우선 -> localStorage -> .env)
 */
export async function getGeminiApiKey() {
  let key = ''

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', GEMINI_CONFIG_KEY)
        .maybeSingle()

      if (!error && data && data.value && String(data.value).trim()) {
        key = String(data.value).trim()
        localStorage.setItem(GEMINI_LOCAL_KEY, key)
        return key
      }
    } catch (e) {
      console.warn('Supabase config에서 Gemini API Key 조회 실패 (로컬 스토리지 확인 중):', e)
    }
  }

  const localKey = localStorage.getItem(GEMINI_LOCAL_KEY)
  if (localKey && localKey.trim()) {
    return localKey.trim()
  }

  const envKey = import.meta.env.VITE_GEMINI_API_KEY
  if (envKey && String(envKey).trim()) {
    return String(envKey).trim()
  }

  return ''
}

/**
 * 2. Gemini API Key 저장 (Supabase config + localStorage)
 */
export async function saveGeminiApiKey(rawKey) {
  const cleanKey = rawKey ? String(rawKey).trim() : ''

  if (supabase) {
    const { error } = await supabase
      .from('config')
      .upsert({ key: GEMINI_CONFIG_KEY, value: cleanKey }, { onConflict: 'key' })

    if (error) {
      console.error('Supabase Gemini API Key 저장 오류:', error)
      throw error
    }
  }

  if (cleanKey) {
    localStorage.setItem(GEMINI_LOCAL_KEY, cleanKey)
  } else {
    localStorage.removeItem(GEMINI_LOCAL_KEY)
  }

  return cleanKey
}

/**
 * 3. Gemini API Key 연결 테스트 (Ping)
 */
export async function testGeminiApiKey(apiKey, modelName) {
  const key = apiKey || await getGeminiApiKey()
  if (!key) {
    return { success: false, error: 'API 키가 입력되지 않았습니다.' }
  }

  const targetModel = modelName || await getSelectedGeminiModel() || GEMINI_DEFAULT_MODEL
  const testPayload = {
    contents: [
      {
        parts: [{ text: 'OK' }]
      }
    ],
    generationConfig: {
      maxOutputTokens: 5,
      temperature: 0.1
    }
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${encodeURIComponent(key)}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000)

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        // 연결 테스트 성공 시 선택된 모델을 기본값으로 영구 저장
        await saveSelectedGeminiModel(targetModel).catch(e => console.warn(e))
        return { success: true, model: targetModel }
      }

      const errJson = await res.json().catch(() => ({}))
      let rawError = errJson?.error?.message || `HTTP ${res.status}`
      const isHighDemand = res.status === 503 || rawError.includes('high demand') || rawError.includes('overloaded')

      // High Demand 일시 과부하인 경우 1.5초 대기 후 즉시 1회 자동 재시도
      if (isHighDemand && attempt === 1) {
        await new Promise(r => setTimeout(r, 1500))
        continue
      }

      if (isHighDemand) {
        rawError = `Google 본사 서버 일시적 과부하 (${targetModel} High Demand). 글로벌 트래픽 급증으로 응답이 일시 지연 중입니다. 보통 1~2분 후 해소되거나, 드롭다운에서 안정적인 'Gemini 3.7 Flash' 모델을 선택해 주세요.`
      }
      return { success: false, error: rawError, model: targetModel }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Google API 응답 시간 초과 (12초)', model: targetModel }
      }
      if (attempt === 1) {
        await new Promise(r => setTimeout(r, 1500))
        continue
      }
      return { success: false, error: err.message || '네트워크 통신 오류', model: targetModel }
    }
  }
}

/**
 * 4. Supabase DB에서 저장된 학년별 AI 분석 리포트 조회
 */
export async function fetchSavedGradeAnalysis(round, academicYear) {
  const storageKey = `${AI_GRADE_REPORT_PREFIX}${round}_${academicYear}`

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', storageKey)
        .maybeSingle()

      if (!error && data && data.value) {
        const parsed = JSON.parse(data.value)
        if (parsed && typeof parsed === 'object') {
          // 로컬 스토리지에 미러링 캐시
          try {
            localStorage.setItem(`pcm_${storageKey}`, data.value)
          } catch {}
          return parsed
        }
      }
    } catch (e) {
      console.warn('Supabase에서 AI 분석 리포트 조회 실패:', e)
    }
  }

  // 로컬 스토리지 백업 조회
  try {
    const localVal = localStorage.getItem(`pcm_${storageKey}`)
    if (localVal) {
      return JSON.parse(localVal)
    }
  } catch {}

  return null
}

/**
 * 5. Supabase DB에 학년별 AI 분석 리포트 영구 저장 (덮어쓰기)
 */
export async function saveGradeAnalysis(round, academicYear, reportData) {
  const storageKey = `${AI_GRADE_REPORT_PREFIX}${round}_${academicYear}`
  const jsonStr = JSON.stringify(reportData)

  if (supabase) {
    const { error } = await supabase
      .from('config')
      .upsert(
        { key: storageKey, value: jsonStr },
        { onConflict: 'key' }
      )

    if (error) {
      console.error('Supabase AI 분석 리포트 저장 실패:', error)
      throw error
    }
  }

  // 로컬 스토리지 백업 저장
  try {
    localStorage.setItem(`pcm_${storageKey}`, jsonStr)
  } catch {}

  return true
}

/**
 * Google Gemini API generateContent 호출 통합 함수 (지능형 재시도 및 다단계 자동 안전 폴백)
 * 
/**
 * Google Gemini API generateContent 호출 통합 함수 (3단계 지능형 자동 복구 로직)
 * 
 * 1) 1차 에러: 사용자에게 묻지 않고 1.5초 대기 후 동일 모델로 즉시 다시 진행 (1차 자동 재시도)
 * 2) 2차 에러: 묻지 않고 '직전 최신 모델'로 모델을 낮추어 자동 추가 진행 (2차 자동 강등 및 재시도)
 * 3) 3차 에러: 분석을 안전하게 종료하고, 멈춘 원인 설명 및 과부하 시 잠시 후 재시도/모델 강등 안내
 */
export async function callGeminiGenerateContent(key, initialModel, requestBody, onProgress = null) {
  // 지원 중단된 구형 2.0 모델이 인입되면 최신 기본 모델로 자동 교체
  const selectedModel = (!initialModel || initialModel.includes('gemini-2.0')) 
    ? GEMINI_DEFAULT_MODEL 
    : initialModel

  const prevModel = getFallbackGeminiModel(selectedModel)

  const stages = [
    {
      stageName: '선택 모델',
      model: selectedModel,
      maxAttempts: 2,
      retryMessage: `선택 모델(${selectedModel}) 일시 지연 발생: 묻지 않고 즉시 다시 진행합니다... (1차 자동 재시도)`
    },
    {
      stageName: '직전 최신 모델',
      model: prevModel,
      maxAttempts: 2,
      switchMessage: `선택 모델 일시 과부하: 묻지 않고 직전 최신 모델(${prevModel})로 낮추어 자동 추가 진행합니다... (2차 모델 강등)`,
      retryMessage: `직전 모델(${prevModel}) 일시 지연: 1.5초 후 재시도합니다...`
    }
  ]

  let lastError = null

  for (let s = 0; s < stages.length; s++) {
    const stage = stages[s]
    const currentModel = stage.model

    if (s > 0 && stage.switchMessage) {
      console.warn(`[geminiApi] ${stage.switchMessage}`)
      onProgress?.(stage.switchMessage)
      await new Promise(r => setTimeout(r, 1500))
    }

    for (let attempt = 1; attempt <= stage.maxAttempts; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${encodeURIComponent(key)}`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        if (res.ok) {
          const data = await res.json()
          return { data, usedModel: currentModel }
        }

        const errData = await res.json().catch(() => ({}))
        const status = res.status
        const errMsg = errData?.error?.message || `HTTP ${status}`
        const isHighDemand = status === 503 || errMsg.includes('high demand') || errMsg.includes('overloaded') || errMsg.includes('spikes in demand')
        const isRateLimit = status === 429
        const isNotFound = status === 404
        const isDeprecated = errMsg.includes('no longer available') || errMsg.includes('deprecated')

        lastError = new Error(errMsg)

        // 잘못된 API 키인 경우 즉시 중단 (재시도 불필요)
        if (status === 400 && errMsg.includes('API_KEY_INVALID')) {
          throw new Error('등록된 Gemini API Key가 유효하지 않습니다. 관리자 환경설정에서 API 키를 다시 확인해 주세요.')
        }

        // 미지원(404) 또는 서비스 종료 모델인 경우 즉시 다음 단계(직전 모델)로 이동
        if (isNotFound || isDeprecated) {
          console.warn(`[geminiApi] ${currentModel} 모델 미지원 또는 지원종료. 직전 모델로 자동 전환합니다.`)
          break
        }

        // 1차 실패 시(동일 모델 내 재시도): 묻지 않고 1.5초 대기 후 다시 진행
        if (attempt === 1) {
          if (stage.retryMessage) {
            console.warn(`[geminiApi] ${stage.retryMessage}`)
            onProgress?.(stage.retryMessage)
          }
          await new Promise(r => setTimeout(r, 1500))
          continue
        }

        // 2회차 실패: 다음 단계(직전 모델 강등)로 전환
        console.warn(`[geminiApi] ${stage.stageName}(${currentModel}) 2회 호출 실패. 다음 단계로 전환합니다.`)
        break
      } catch (networkErr) {
        if (networkErr.message?.includes('유효하지 않습니다')) {
          throw networkErr
        }
        lastError = networkErr
        if (attempt === 1) {
          if (stage.retryMessage) {
            onProgress?.(stage.retryMessage)
          }
          await new Promise(r => setTimeout(r, 1500))
          continue
        }
        break
      }
    }
  }

  // 3차 에러: 모든 모델(선택 모델 + 직전 최신 모델) 호출 실패 시 분석 종료 및 원인/처방 안내
  const finalMsg = lastError?.message || '알 수 없는 서버 오류'
  const isHighDemand = finalMsg.includes('high demand') || 
                       finalMsg.includes('503') || 
                       finalMsg.includes('overloaded') || 
                       finalMsg.includes('spikes in demand')

  if (isHighDemand) {
    throw new Error(
      `[AI 분석 일시 중단 안내: Google AI 서버 과부하]\n` +
      `선택하신 모델(${selectedModel})과 직전 최신 모델(${prevModel})로 자동 재시도 및 모델 강등 호출을 진행하였으나, 현재 Google Gemini 본사 서버에 일시적인 트래픽 과부하(High Demand)가 지속되고 있습니다.\n\n` +
      `📌 해결 방법 안내:\n` +
      `1. 일시적 과부하 스파이크는 보통 1~2분 내에 자동 해소되므로, 잠시 후에 다시 분석 버튼을 눌러주시면 정상 처리됩니다.\n` +
      `2. 즉시 분석이 필요하신 경우, 관리자 [환경설정] > [Gemini AI 설정]에서 모델 버전을 'Gemini 3.7 Flash' 또는 'Gemini 3.8 Flash-Lite' 등 하위/경량 모델로 낮추어 진행해 주시기 바랍니다.`
    )
  }

  if (finalMsg.includes('429') || finalMsg.includes('호출 한도') || finalMsg.includes('quota') || finalMsg.includes('RESOURCE_EXHAUSTED')) {
    throw new Error(
      `[AI 분석 일시 중단 안내: 분당 호출 한도 초과]\n` +
      `Google Gemini API의 무료 분당 요청 한도(15 RPM)를 초과하여 분석이 중단되었습니다.\n\n` +
      `📌 해결 방법 안내:\n` +
      `약 30초~1분 정도 대기하신 후 다시 시도해 주시기 바랍니다.`
    )
  }

  throw new Error(
    `[AI 분석 중단 안내: 서버 통신 실패]\n` +
    `선택 모델(${selectedModel}) 및 직전 모델(${prevModel}) 호출 중 오류가 발생하여 분석을 종료했습니다.\n` +
    `원인: ${finalMsg}\n\n` +
    `📌 해결 방법 안내:\n` +
    `잠시 후 다시 시도하시거나, 관리자 환경설정에서 API 키 및 모델 선택 상태를 확인해 주세요.`
  )
}

/**
 * 6. Gemini API를 호출하여 학년별 학력 비교 심층 분석 리포트 생성
 */
export async function generateGradeLevelAiAnalysis(statsPayload, apiKey, onProgress = null) {
  const key = apiKey || await getGeminiApiKey()
  if (!key) {
    throw new Error('Gemini API Key가 설정되어 있지 않습니다. 관리자 환경설정을 확인해 주세요.')
  }

  const systemInstruction = `
당신은 대한민국 경기도 용인시에 위치한 '포곡고등학교'의 공교육 대입 리더교사이자 진학지도 전문 연구위원 교사입니다. 데이터 분석에 기반한 혁신적이고 감각적인 입시 분석력을 갖추고 있습니다.
제공된 실제 전국연합학력평가/모의평가 성적 데이터를 분석하여 학년별 학력 진단과 진학 지도 처방을 작성해야 합니다.

[절대 불변의 분석 원칙 - 엄격 준수]
1. 한국 고등학교 내신 및 수능 등급은 1등급이 최상위(최우수)이고 9등급이 최하위(가장 취약)입니다.
   - 숫자가 작을수록 성적이 우수합니다. (예: 5.06등급은 5.55등급보다 훨씬 우수함)
   - 이 규칙을 절대 거꾸로 해석하거나 숫자가 크다고 우수하다고 표현하지 마십시오.
2. 절대로 없는 사실이나 가짜 수치를 지어내지 마십시오.
   - 전달된 JSON 데이터의 실제 등급 수치, 응시 인원, 고3 대비 격차 수치만을 정확히 인용하십시오.
   - 데이터가 없는 영역이나 학년은 단정적으로 평가하지 말고 '데이터 미실시' 또는 '추후 확인 필요'로 기재하십시오.
3. 포곡고등학교의 실질적인 수능최저 충족 및 수시·정시 지도 관점에서 현실적이고 실행 가능한 지도 처방을 작성하십시오.
   - 비현실적인 희망고문(예: 중하위권 등급으로 최상위 의약학계열 합격 운운)은 절대 금지합니다.
   - 고3의 강세 영역을 바탕으로 한 수능최저 충족 조합, 1·2학년의 고3 대비 학력 격차 극복을 위한 과목별 기초 클리닉 로드맵을 제시하십시오.

[출력 형식 - 순수 JSON만 반환]
반드시 마크다운 코드블록 없이 다음 JSON 구조에 정확히 맞춰서 응답하십시오.
{
  "gradeCards": {
    "3": {
      "statusTitle": "한 줄 종합 위상 요약 (예: 전체 학력 압도적 1위 👑)",
      "statusDesc": "고3의 종합 성적 특성 및 저학년 대비 우위 요약 (실제 등급 수치 인용)",
      "strengthTitle": "가장 두드러진 최우수 강세 영역명",
      "strengthDesc": "해당 영역의 우수성 및 수능최저 기여도 설명",
      "weaknessTitle": "상대적 보완 필요 영역명",
      "weaknessDesc": "실전 수능 대비 취약 영역 보완점 설명",
      "actionDesc": "고3 학생 맞춤형 수시/수능최저 최종 지도 처방"
    },
    "2": {
      "statusTitle": "한 줄 종합 위상 요약 (예: 종합 2위 🥈 (고3 대비 격차 분석))",
      "statusDesc": "고2의 종합 성적 및 고3과의 격차 진단",
      "strengthTitle": "고1 대비 또는 자체 선방 영역명",
      "strengthDesc": "해당 영역의 상대적 위치 설명",
      "weaknessTitle": "고3 대비 최대 격차 취약 영역명",
      "weaknessDesc": "고3 대비 벌어진 등급 격차 및 위기 요인 설명",
      "actionDesc": "고2 학생의 고3 수준 도약을 위한 집중 학습 처방"
    },
    "1": {
      "statusTitle": "한 줄 종합 위상 요약 (예: 종합 3위 🥉 (고3 대비 격차 분석))",
      "statusDesc": "고1의 종합 성적 및 기초 학력 상태 진단",
      "strengthTitle": "자체 선방 영역명",
      "strengthDesc": "상대적으로 기초가 잡힌 영역 설명",
      "weaknessTitle": "고3 대비 최대 격차 취약 영역명",
      "weaknessDesc": "고3 대비 기초 학력 격차가 큰 영역 설명",
      "actionDesc": "고1 학생의 수능/모의고사 기초 체력 확립을 위한 클리닉 처방"
    }
  },
  "roadmap": {
    "g1": {
      "title": "1학년: 기초 학력 보강 & 핵심 역량 확립",
      "bullets": [
        "첫 번째 실행 전략 (실제 취약 영역 격차 극복)",
        "두 번째 실행 전략 (문해력 및 기초 다지기)",
        "세 번째 실행 전략 (향후 수능 체제 대비)"
      ]
    },
    "g2": {
      "title": "2학년: 고3 수준 도약 & 전략 과목 완성",
      "bullets": [
        "첫 번째 실행 전략 (고3 대비 최대 격차 과목 집중 보강)",
        "두 번째 실행 전략 (수능최저 충족 전략 과목 조기 완성)",
        "세 번째 실행 전략 (교과 내신 및 수시 포트폴리오 관리)"
      ]
    },
    "g3": {
      "title": "3학년: 수능최저 충족률 극대화 & 수시 6장 전략",
      "bullets": [
        "첫 번째 실행 전략 (전 영역 우위 유지 및 실전 감각 완성)",
        "두 번째 실행 전략 (전략적 수능최저 2합/3합 타겟팅)",
        "세 번째 실행 전략 (수시 6장 지원 포트폴리오 최적화)"
      ]
    }
  }
}
`

  const userPrompt = `
다음은 포곡고등학교의 ${statsPayload.roundLabel} (대입연도: ${statsPayload.academicYear}학년도) 전국연합학력평가/모의평가 실제 학년별 성적 집계 데이터입니다.

[집계 통계 데이터]
${JSON.stringify(statsPayload, null, 2)}

위 데이터를 바탕으로 공교육 대입 리더교사의 관점에서 포곡고 학생들의 실제 성적 격차와 수시/수능최저 지도를 위한 구조화된 심층 분석 리포트 JSON을 작성해 주십시오.
`

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }]
      }
    ],
    generationConfig: {
      temperature: 0.2, // 환각 억제 및 수치 일치성을 위해 낮은 온도 설정
      topP: 0.8,
      responseMimeType: 'application/json'
    }
  }

  // 지능형 재시도 및 자동 다단계 폴백 호출
  const targetModel = await getSelectedGeminiModel() || GEMINI_DEFAULT_MODEL
  const { data: result, usedModel } = await callGeminiGenerateContent(key, targetModel, requestBody, onProgress)

  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) {
    throw new Error('Gemini API로부터 응답 텍스트를 수신하지 못했습니다.')
  }

  // 마크다운 코드블록 정제
  let cleanedText = rawText.trim()
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }

  const parsed = JSON.parse(cleanedText)
  if (!parsed.gradeCards || !parsed.roadmap) {
    throw new Error('Gemini 응답 형식이 올바르지 않습니다 (gradeCards 또는 roadmap 누락).')
  }

  return {
    success: true,
    model: usedModel || targetModel,
    data: parsed
  }
}

/**
 * 7. Supabase DB에서 대입통계시스템 전체 AI 심층 분석 리포트 조회
 */
export async function fetchComprehensiveAiReport(academicYear) {
  const yr = String(academicYear || '2027')
  const storageKey = `${COMPREHENSIVE_AI_REPORT_PREFIX}${yr}`

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', storageKey)
        .maybeSingle()

      if (!error && data && data.value) {
        const parsed = JSON.parse(data.value)
        if (parsed && typeof parsed === 'object') {
          try {
            localStorage.setItem(`pcm_${storageKey}`, data.value)
          } catch {}
          return parsed
        }
      }
    } catch (e) {
      console.warn(`[geminiApi] Supabase에서 전체 AI 분석 리포트(${yr}) 조회 실패:`, e)
    }
  }

  // 로컬 스토리지 백업 조회
  try {
    const localVal = localStorage.getItem(`pcm_${storageKey}`)
    if (localVal) {
      return JSON.parse(localVal)
    }
  } catch {}

  return null
}

/**
 * 8. Supabase DB에 대입통계시스템 전체 AI 심층 분석 리포트 영구 저장 (덮어쓰기)
 */
export async function saveComprehensiveAiReport(academicYear, reportData) {
  const yr = String(academicYear || '2027')
  const storageKey = `${COMPREHENSIVE_AI_REPORT_PREFIX}${yr}`
  const jsonStr = JSON.stringify(reportData)

  if (supabase) {
    const { error } = await supabase
      .from('config')
      .upsert(
        { key: storageKey, value: jsonStr },
        { onConflict: 'key' }
      )

    if (error) {
      console.error(`[geminiApi] Supabase 전체 AI 분석 리포트(${yr}) 저장 실패:`, error)
      throw error
    }

    // 학년별 성적 비교 탭 호환성을 위해 ai_report_grade_comparison_10_11_${yr} 에도 동시 반영
    if (reportData.gradeComparison) {
      const legacyPayload = {
        analyzedAt: reportData.analyzedAt,
        analyzedBy: '시스템 관리자 (전체 대입통계 AI 분석 연동)',
        model: reportData.model,
        round: '10_11',
        academicYear: yr,
        gradeCards: reportData.gradeComparison.gradeCards || {},
        roadmap: reportData.gradeComparison.roadmap || {}
      }
      try {
        await supabase
          .from('config')
          .upsert(
            { key: `${AI_GRADE_REPORT_PREFIX}10_11_${yr}`, value: JSON.stringify(legacyPayload) },
            { onConflict: 'key' }
          )
      } catch (err) {
        console.warn('[geminiApi] 하위 호환 학년별 AI 분석 키 저장 실패:', err)
      }
    }
  }

  // 로컬 스토리지 백업 저장
  try {
    localStorage.setItem(`pcm_${storageKey}`, jsonStr)
  } catch {}

  return true
}

/**
 * 9. Gemini API를 호출하여 대입통계시스템 전체 심층 분석 리포트 일괄 생성
 */
export async function generateComprehensiveAiStatReport(apiKey, academicYear, statsPayload, onProgress = null) {
  const key = apiKey || await getGeminiApiKey()
  if (!key) {
    throw new Error('Google Gemini API Key가 설정되어 있지 않습니다. 관리자 환경설정을 확인해 주세요.')
  }

  const yr = String(academicYear || '2027')
  const sName = statsPayload.schoolName || '우리고등학교'

  const systemInstruction = `
당신은 대한민국 고등학교 공교육 대입 리더교사 그룹의 진학지도 전문 연구위원이자 대입 통계 분석 최고 권위자입니다. 다년간의 진학 지도 노하우와 함께, 급변하는 최신 입시 트렌드와 복잡한 입시 전형을 데이터에 근거해 예리하고 감각적으로 꿰뚫어 보는 최고의 공교육 입시 분석가입니다.
제공된 대입 수시 지원 실제 결과 데이터와 전국연합학력평가/모의평가 성적 데이터를 종합 진단하여, 학교 전체 구성원(교사, 학생, 학부모)이 공유할 수 있는 권위 있고 신뢰도 높은 '대입 통계 시스템 전체 심층 분석 리포트'를 작성해야 합니다.

[절대 불변의 분석 원칙 - 엄격 준수]
1. 한국 고등학교 내신 및 수능 등급 체계: 1등급이 최상위(최우수), 9등급이 최하위(가장 취약)입니다.
   - 숫자가 작을수록 성적이 우수합니다 (예: 2.15등급은 3.40등급보다 우수).
   - 등급 숫자가 크다고 우수하다고 해석하는 환각을 절대 일으키지 마십시오.
2. 사실 일치성 및 수치 검증:
   - 절대로 없는 가짜 합격 건수나 지어낸 수치를 인용하지 마십시오.
   - 전달받은 JSON의 실제 지원 건수, 합격률, 등급 수치만을 정확히 인용하십시오.
   - 데이터가 없는 항목은 "데이터 미등록/추후 분석 필요"로 솔직하게 표기하십시오.
3. 실질적이고 실행 가능한 진학 지도 처방:
   - 비현실적인 희망고문 대신, 학생부교과/종합/농어촌/기회균형 전형의 실증적 유불리와 수능최저 충족 전략(영어·탐구 2합 중심)을 현실적으로 처방하십시오.
   - 고3의 입결 성과를 토대로 고2·고1의 학력 보강 로드맵을 구체적으로 제시하십시오.

[출력 형식 - 순수 JSON만 반환, 마크다운 코드블록 없이 순수 JSON 문자열만 출력]
{
  "overallSummary": "대입 수시 지원 및 전국연합/모의평가 성적 종합 총평 (3~4문장으로 우리 학교의 전체 합격률, 전형별 우위, 과목별 학력 지형을 명확하고 힘있게 요약)",
  "strategyCards": [
    {
      "num": 1,
      "badge": "내신 중심 교과 우세",
      "title": "등급에 관계없이 학생부교과 전형이 일관되게 유리합니다",
      "summary": "우리 학교의 실제 수시 결과에 비추어 볼 때 주요 등급대에서 교과 전형 합격률이 종합 전형을 앞섭니다.",
      "details": [
        "1.0 ~ 1.9등급: 서울권 대학 주요 타깃 (교과 추천 적극 활용)",
        "2.0 ~ 2.9등급: 서울 하위권 대학 & 지거국 본교 & 수도권 주요대학",
        "3.0 ~ 3.9등급: 수도권 대학 & 지방 중위권 대학 (정량 교과 중심 안정 지원)",
        "충실한 학생부 관리 시 종합 전형으로 0.5등급 내외 보완 합격 가능"
      ]
    },
    {
      "num": 2,
      "badge": "농어촌·기회균형 양면성",
      "title": "상위권은 농어촌이 절대 유리, 중하위권은 경쟁 치열성을 경계",
      "summary": "1~2등급대 상위권은 농어촌 전형 합격률이 일반전형 대비 확연히 우세하나, 중하위권은 지원 몰림 현상으로 역전이 발생할 수 있습니다.",
      "details": [
        "상위권(내신 1~2등급대): 상위권 대학 농어촌+기회균형 전형 적극 추천 (일반전형 대비 뚜렷한 합격률 우위)",
        "중하위권(내신 3등급 이하): 중위권 학생들의 농어촌 집중 몰림 현상으로 컷이 비정상적으로 상승할 위험 상존",
        "수도권 주요대의 경우 일반 교과 전형의 충원 합격률이 더 유리할 수 있으므로 병행 지원이 안전"
      ]
    },
    {
      "num": 3,
      "badge": "수능최저 마법",
      "title": "수능 최저학력기준을 맞추면 실질 경쟁률이 급락하는 마법",
      "summary": "겉보기 경쟁률이 높아 보여도 수능최저를 충족하는 순간 실질 경쟁률이 대폭 낮아집니다.",
      "details": [
        "최초 외형 경쟁률 대비 최저 충족 실질 경쟁률의 급락 실증",
        "수능최저 충족 시 경쟁자의 50~60% 이상이 자동 탈락하므로 내신 0.5~1.0등급을 극복하는 강력한 역전 발판",
        "충원합격까지 감안하면 3~4등급대 학생도 수도권 및 거점 국립대 실질 합격선에 진입"
      ]
    },
    {
      "num": 4,
      "badge": "수능의 진짜 목적",
      "title": "수능은 정시 파이터를 위한 것이 아니라, 수시 최저를 위한 전략 무기",
      "summary": "고3 재학생의 정시 합격권 진입은 제한적이므로, 수능 공부의 실질 목표는 수시 최저 충족이어야 합니다.",
      "details": [
        "수능 4영역 정시 올인이 아닌 영어(절대평가) 및 전략 탐구 1과목 등 2합/3합 집중 타겟팅",
        "사탐런(과탐→사탐) 및 전략 과목 조기 완성의 중요성",
        "수능 당일까지 학습 집중력 유지 처방"
      ]
    },
    {
      "num": 5,
      "badge": "정시 지원 기준선",
      "title": "수시 원서 접수 전까지 정시로 갈 수 있는 대학 라인을 확정하십시오",
      "summary": "모평 백분위 기준으로 정시 진학 가능선을 냉정하게 알고 수시 6장을 써야 납치를 막을 수 있습니다.",
      "details": [
        "6월/9월 모평 백분위 기준으로 정시 지원 가능 대학을 객관적으로 산출",
        "정시 가능권 미만 대학의 수시 지원을 차단하는 수시 납치 방지선 설정",
        "상향/적정/안정 6장 카드의 전략적 배분"
      ]
    }
  ],
  "groupInsights": {
    "ALL": "전체 주요대 통합 합격률 및 전형별 종합 패턴 분석",
    "SKYSSHE": "SKY 및 서성한 라인 입결 분석 코멘트 (실제 합격률, 교과vs종합, 농어촌, 최저 영향 등 실제 수치 인용)",
    "JKYSKDHS": "중경외시 및 건동홍숙 라인 입결 분석 코멘트",
    "KSSDAGIEK": "국숭세단/아주/인하/경기/가천 라인 입결 분석 코멘트",
    "JIGEOK_EDU": "거점국립대 및 교대 라인 입결 분석 코멘트",
    "SPECIAL": "특수목적대 및 이공계특성화대 입결 분석 코멘트"
  },
  "bandInsights": {
    "ALL": "수시 전체 지원자의 등급 분포 및 전형 선택 총평",
    "1": "1등급대 (1.0~1.9등급) 입결 핵심 인사이트 (서울 주요대 및 교과/종합/최저 합격 패턴)",
    "2": "2등급대 (2.0~2.9등급) 입결 핵심 인사이트 (수도권 상위권 및 지거국 합격 분석)",
    "3": "3등급대 (3.0~3.9등급) 입결 핵심 인사이트 (수도권 4년제 교과 안정 지원 및 종합 보완)",
    "4": "4등급대 (4.0~4.9등급) 입결 핵심 인사이트 (수능최저 충족 및 틈새 전형 도약 분석)",
    "5": "5등급대 (5.0~5.9등급) 입결 핵심 인사이트 (정량 교과 및 전문대 유망학과 전략)",
    "6": "6등급대 (6.0~6.9등급) 입결 핵심 인사이트 (적성 및 실기/전문대 맞춤형 전략)",
    "7_9": "7~9등급대 입결 핵심 인사이트 (전문대 및 진로 맞춤형 학과 진학 지도)"
  },
  "gradeComparison": {
    "radarBalanceCommentary": "고3 대비 고2·고1의 국수영탐 5개 영역 방사형 학력 밸런스 총평",
    "gradeCards": {
      "3": {
        "statusTitle": "고3 종합 위상 요약 (예: 전체 학력 압도적 1위 👑)",
        "statusDesc": "고3 종합 성적 및 저학년 대비 우위 요약 (실제 등급 수치 인용)",
        "strengthTitle": "최우수 강세 영역명",
        "strengthDesc": "해당 영역 우수성 및 수능최저 기여도",
        "weaknessTitle": "보완 필요 영역명",
        "weaknessDesc": "실전 수능 대비 보완점",
        "actionDesc": "고3 수시/수능최저 최종 지도 처방"
      },
      "2": {
        "statusTitle": "고2 종합 위상 요약 (예: 종합 2위 🥈 (고3 대비 격차 분석))",
        "statusDesc": "고2 종합 성적 및 고3 대비 격차 진단",
        "strengthTitle": "상대적 선방 영역명",
        "strengthDesc": "해당 영역 설명",
        "weaknessTitle": "고3 대비 최대 격차 취약 영역명",
        "weaknessDesc": "고3 대비 격차 및 위기 요인",
        "actionDesc": "고2 집중 학습 처방"
      },
      "1": {
        "statusTitle": "고1 종합 위상 요약 (예: 종합 3위 🥉 (고3 대비 격차 분석))",
        "statusDesc": "고1 종합 성적 및 기초 학력 진단",
        "strengthTitle": "자체 선방 영역명",
        "strengthDesc": "기초가 잡힌 영역 설명",
        "weaknessTitle": "고3 대비 최대 격차 취약 영역명",
        "weaknessDesc": "기초 학력 격차가 큰 영역 설명",
        "actionDesc": "고1 기초 클리닉 처방"
      }
    },
    "roadmap": {
      "g1": {
        "title": "1학년: 기초 학력 보강 & 핵심 역량 확립",
        "bullets": [
          "첫 번째 실행 전략 (실제 취약 영역 격차 극복)",
          "두 번째 실행 전략 (문해력 및 기초 다지기)",
          "세 번째 실행 전략 (향후 수능 체제 대비)"
        ]
      },
      "g2": {
        "title": "2학년: 고3 수준 도약 & 전략 과목 완성",
        "bullets": [
          "첫 번째 실행 전략 (고3 대비 최대 격차 과목 집중 보강)",
          "두 번째 실행 전략 (수능최저 충족 전략 과목 조기 완성)",
          "세 번째 실행 전략 (교과 내신 및 수시 포트폴리오 관리)"
        ]
      },
      "g3": {
        "title": "3학년: 수능최저 충족률 극대화 & 수시 6장 전략",
        "bullets": [
          "첫 번째 실행 전략 (전 영역 우위 유지 및 실전 감각 완성)",
          "두 번째 실행 전략 (전략적 수능최저 2합/3합 타겟팅)",
          "세 번째 실행 전략 (수시 6장 지원 포트폴리오 최적화)"
        ]
      }
    }
  }
}
`

  const userPrompt = `
다음은 ${sName}의 ${yr}학년도 대입 수시 지원 결과 빅데이터 및 전국연합학력평가/모의평가 성적 집계 데이터입니다.

[대입 통계 전체 집계 데이터]
${JSON.stringify(statsPayload, null, 2)}

위 데이터를 바탕으로 공교육 대입 리더교사 그룹의 객관적이고 감각적인 분석 관점에서 ${sName} 학생들의 실제 수시 지원 성과, 등급대별 유불리, 대학 그룹별 분석, 고3 대비 고2·고1의 학력 격차를 총망라한 구조화된 전체 AI 심층 분석 리포트 JSON을 작성해 주십시오.
`

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      responseMimeType: 'application/json'
    }
  }

  // 지능형 재시도 및 자동 다단계 폴백 호출
  const targetModel = await getSelectedGeminiModel() || GEMINI_DEFAULT_MODEL
  const { data: result, usedModel } = await callGeminiGenerateContent(key, targetModel, requestBody, onProgress)

  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) {
    throw new Error('Gemini API로부터 응답 텍스트를 수신하지 못했습니다.')
  }

  let cleanedText = rawText.trim()
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }

  const parsed = JSON.parse(cleanedText)
  if (!parsed.overallSummary || !parsed.strategyCards || !parsed.groupInsights || !parsed.bandInsights) {
    throw new Error('Gemini 응답 구조가 불완전합니다 (overallSummary, strategyCards, groupInsights, bandInsights 중 일부 누락).')
  }

  const nowStr = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  return {
    success: true,
    model: usedModel || targetModel,
    data: {
      academicYear: yr,
      analyzedAt: nowStr,
      schoolName: sName,
      model: usedModel || targetModel,
      ...parsed
    }
  }
}

/**
 * 10. Supabase DB에서 특정 학생의 맞춤형 AI 상담 리포트 조회
 */
export async function fetchStudentAiCounsel(academicYear, studentKey) {
  if (!studentKey) return null
  const yr = String(academicYear || '2027')
  const storageKey = `${STUDENT_COUNSEL_PREFIX}${yr}_${studentKey}`

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', storageKey)
        .maybeSingle()

      if (!error && data && data.value) {
        const parsed = JSON.parse(data.value)
        if (parsed && typeof parsed === 'object') {
          try {
            localStorage.setItem(`pcm_${storageKey}`, data.value)
          } catch {}
          return parsed
        }
      }
    } catch (e) {
      console.warn(`[geminiApi] Supabase 학생 AI 상담 리포트(${storageKey}) 조회 실패:`, e)
    }
  }

  // 로컬 스토리지 백업 조회
  try {
    const localVal = localStorage.getItem(`pcm_${storageKey}`)
    if (localVal) {
      return JSON.parse(localVal)
    }
  } catch {}

  return null
}

/**
 * 11. Supabase DB에 특정 학생의 맞춤형 AI 상담 리포트 영구 저장 (덮어쓰기)
 */
export async function saveStudentAiCounsel(academicYear, studentKey, reportData) {
  if (!studentKey) return false
  const yr = String(academicYear || '2027')
  const storageKey = `${STUDENT_COUNSEL_PREFIX}${yr}_${studentKey}`
  const jsonStr = JSON.stringify(reportData)

  // 1. 로컬 스토리지에 무조건 먼저 안전 저장 (DB/네트워크 오류 시에도 생성된 결과 보존)
  try {
    localStorage.setItem(`pcm_${storageKey}`, jsonStr)
  } catch (e) {
    console.warn('[geminiApi] localStorage 백업 저장 실패:', e)
  }

  // 2. Supabase DB 영구 저장
  if (supabase) {
    try {
      const { error } = await supabase
        .from('config')
        .upsert(
          { key: storageKey, value: jsonStr },
          { onConflict: 'key' }
        )

      if (error) {
        console.warn(`[geminiApi] Supabase 학생 AI 상담 리포트(${storageKey}) 저장 경고:`, error)
      }
    } catch (dbErr) {
      console.warn(`[geminiApi] Supabase 연결 예외:`, dbErr)
    }
  }

  return true
}

/**
 * 12. Gemini API를 호출하여 특정 학생 1:1 맞춤 대입 심층 상담 리포트 생성
 * ※ 엄격한 개인정보보호: 학생 실명, 주민번호, 학번 등 개인식별정보(PII)는 절대 전달되지 않음
 */
export async function generateStudentIndividualAiCounsel(apiKey, academicYear, anonymizedPayload, onProgress = null) {
  const key = apiKey || await getGeminiApiKey()
  if (!key) {
    throw new Error('Google Gemini API Key가 설정되어 있지 않습니다. 관리자 환경설정을 확인해 주세요.')
  }

  const yr = String(academicYear || '2027')

  const systemInstruction = `
당신은 대한민국 일반계 고등학교 공교육 대입 리더교사 그룹의 진학지도 전문 연구위원 교사입니다. 풍부한 진학 지도 경험은 물론, 경력의 길고 짧음을 떠나 최신 대입 전형 변화와 전형별 유불리를 데이터에 기반해 감각적이고 날카롭게 꿰뚫어 보는 혁신적인 입시 분석력을 갖춘 공교육 대입 전문가입니다.
제공된 학생의 내신 성적, 모의고사 성적 추이, 수시 6장 지망/지원 현황, 특별전형(농어촌/기회균형) 자격 요건을 정밀 진단하여, 학생과 학부모에게 실질적인 합격 가능성을 극대화할 수 있는 심층 맞춤 진학 상담 리포트를 작성해야 합니다.

[절대 불변의 분석 원칙 - 엄격 준수]
1. 등급 해석: 1등급이 최상위(최우수), 9등급이 최하위(가장 취약)입니다. 숫자가 작을수록 우수합니다 (예: 2.15등급은 3.40등급보다 우수).
2. 사실 일치성: 제공된 실제 내신과 모의고사 성적, 지망 대학 목록만을 바탕으로 냉정하고 객관적으로 분석하십시오. 절대로 지어낸 가짜 대학이나 허위 합격선을 언급하지 마십시오.
3. 현실적 지도: 비현실적인 희망고문을 배제하고, 수시 납치 방지선(정시 기대선 대비 수시 하향 지원 경계), 수능최저 충족을 위한 전략 과목(영어, 탐구 등) 집중 처방, 6장 수시 바구니의 안정/적정/상향 밸런스를 구체적으로 제시하십시오.
4. 개인정보 보호: 전달받은 데이터에는 어떠한 개인 식별자(실명 등)도 포함되어 있지 않으며, 출력 리포트에서도 학생을 지칭할 때 '학생' 또는 '해당 학생'으로 표현하십시오.
5. 수시 지망 미등록 대응: 수시 지망 카드(applications)가 비어있는 경우, 학생의 내신과 모평 성적 추이를 바탕으로 추천하는 현실적인 대학 라인 및 수시 6장 바구니 권장 조합(상향 2장, 적정 2장, 안정 2장)을 직접 구체적으로 설계해 주십시오.

[출력 형식 - 순수 JSON만 반환, 마크다운 코드블록 없이 순수 JSON 문자열만 출력]
{
  "summary": "학생의 전반적인 대입 경쟁력 및 현재 위치 종합 요약 (2~3문장으로 내신, 모평, 수시 조합의 핵심을 힘있게 브리핑)",
  "basketDiagnosis": {
    "status": "적정 분산형 | 상향 집중형 | 안정 편중형 | 재조정 필요형 중 택1",
    "balanceComment": "지원 대학 6장의 상향/적정/안정 밸런스 및 정시 기대선 대비 수시 납치 위험도 진단",
    "strengths": [
      "1번째 강점 (예: 내신 대비 교과 추천 적극 활용, 특정 학과 정량 우위 등)",
      "2번째 강점"
    ],
    "risks": [
      "1번째 주의점 또는 위험요소 (예: 수능최저 미충족 시 전원 탈락 위험, 상향 편중에 따른 올킬 위험 등)",
      "2번째 주의점"
    ]
  },
  "csatStrategy": {
    "overallFeasibility": "수능최저 충족 가능성 평가 및 정시 기대선 종합 진단",
    "recommendedSubjects": [
      "1순위 전략 과목 (예: 영어 2등급 절대 사수)",
      "2순위 전략 과목 (예: 탐구 사회문화 2등급 완성)"
    ],
    "actionPlan": "수능 당일까지의 과목별 구체적 등급 방어 및 집중 처방"
  },
  "specialTrackAdvice": {
    "ruralAdvice": "농어촌 전형 활용 조언 (해당자: 일반전형 대비 유불리 및 중위권 컷 상승 주의점 / 비해당자: 해당 없음 기재)",
    "opportunityAdvice": "기회균형 전형 활용 조언 (해당자: 기균 전형 실익 / 비해당자: 해당 없음 기재)"
  },
  "counselScript": [
    "상담 시 교사가 학생 및 학부모에게 직접 전달할 1번째 핵심 조언 멘트",
    "2번째 구체적 지원 전략 및 수능최저 준비 멘트",
    "3번째 수시 6장 최종 조합 및 멘탈 관리 당부 멘트"
  ]
}
`

  const userPrompt = `
다음은 ${yr}학년도 대입을 준비하는 학생의 가명화된 실제 성적 및 수시 지원 현황 데이터입니다.

[학생 학업 및 수시 지원 데이터]
${JSON.stringify(anonymizedPayload, null, 2)}

위 데이터를 바탕으로 공교육 대입 리더교사의 감각적이고 객관적인 데이터 분석 관점에서 학생의 합격률을 극대화하고 실질적인 나침반이 될 수 있는 1:1 맞춤 심층 진학 상담 리포트 JSON을 작성해 주십시오.
`

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      responseMimeType: 'application/json'
    }
  }

  // 지능형 재시도 및 자동 다단계 폴백 호출
  const targetModel = await getSelectedGeminiModel() || GEMINI_DEFAULT_MODEL
  const { data: result, usedModel } = await callGeminiGenerateContent(key, targetModel, requestBody, onProgress)

  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) {
    throw new Error('Gemini API로부터 응답 텍스트를 수신하지 못했습니다.')
  }

  let cleanedText = rawText.trim()
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }

  const parsed = JSON.parse(cleanedText)
  if (!parsed.summary || !parsed.basketDiagnosis || !parsed.csatStrategy || !parsed.counselScript) {
    throw new Error('Gemini 응답 구조가 불완전합니다 (summary, basketDiagnosis, csatStrategy, counselScript 중 일부 누락).')
  }

  const nowStr = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  return {
    success: true,
    model: usedModel || targetModel,
    data: {
      academicYear: yr,
      analyzedAt: nowStr,
      model: usedModel || targetModel,
      report: parsed
    }
  }
}

/**
 * 13. 특정 학생의 교사 상담 메모 저장 (Supabase config + localStorage)
 * AI 리포트 재호출 없이 기존 리포트 객체에 teacherMemo만 안전하게 병합/갱신
 */
export async function saveStudentTeacherMemo(academicYear, studentKey, memoText) {
  if (!studentKey) return false
  const yr = String(academicYear || '2027')

  // 기존 리포트 조회
  const existing = await fetchStudentAiCounsel(yr, studentKey)
  const toSave = existing || {
    academicYear: yr,
    analyzedAt: new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }),
    model: 'Gemini',
    report: null
  }

  toSave.teacherMemo = String(memoText || '')
  toSave.memoUpdatedAt = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  await saveStudentAiCounsel(yr, studentKey, toSave)
  return toSave
}
