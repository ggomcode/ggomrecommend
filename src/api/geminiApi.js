import { supabase } from '../utils/supabaseClient'

export const GEMINI_CONFIG_KEY = 'gemini_api_key'
export const GEMINI_LOCAL_KEY = 'pcm_gemini_api_key'
export const GEMINI_PRIMARY_MODEL = 'gemini-2.5-flash'
export const GEMINI_FALLBACK_MODEL = 'gemini-1.5-flash'
export const AI_GRADE_REPORT_PREFIX = 'ai_report_grade_comparison_'

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
export async function testGeminiApiKey(apiKey) {
  const key = apiKey || await getGeminiApiKey()
  if (!key) {
    return { success: false, error: 'API 키가 입력되지 않았습니다.' }
  }

  const testPayload = {
    contents: [
      {
        parts: [{ text: 'Respond with just "OK" if you can read this.' }]
      }
    ]
  }

  // 1차 시도: 2.5 Flash
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_PRIMARY_MODEL}:generateContent?key=${encodeURIComponent(key)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    })

    if (res.ok) {
      return { success: true, model: GEMINI_PRIMARY_MODEL }
    }

    // 404 모델 미지원 등의 경우 fallback 시도
    if (res.status === 404) {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FALLBACK_MODEL}:generateContent?key=${encodeURIComponent(key)}`
      const fbRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      })
      if (fbRes.ok) {
        return { success: true, model: GEMINI_FALLBACK_MODEL }
      }
      const fbErr = await fbRes.json().catch(() => ({}))
      return { success: false, error: fbErr?.error?.message || `HTTP ${fbRes.status}` }
    }

    const errJson = await res.json().catch(() => ({}))
    return { success: false, error: errJson?.error?.message || `HTTP ${res.status}` }
  } catch (err) {
    return { success: false, error: err.message || '네트워크 통신 오류' }
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
 * 6. Gemini API를 호출하여 학년별 학력 비교 심층 분석 리포트 생성
 */
export async function generateGradeLevelAiAnalysis(statsPayload, apiKey) {
  const key = apiKey || await getGeminiApiKey()
  if (!key) {
    throw new Error('Gemini API Key가 설정되어 있지 않습니다. 관리자 환경설정을 확인해 주세요.')
  }

  const systemInstruction = `
당신은 대한민국 경기도 용인시에 위치한 '포곡고등학교'의 20년 경력 진학지도 전문 수석교사입니다.
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

위 데이터를 바탕으로 수석교사의 관점에서 포곡고 학생들의 실제 성적 격차와 수시/수능최저 지도를 위한 구조화된 심층 분석 리포트 JSON을 작성해 주십시오.
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

  // 1차 시도: 2.5 Flash
  let targetModel = GEMINI_PRIMARY_MODEL
  let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  })

  // 404 모델 미지원 시 fallback 시도
  if (response.status === 404) {
    targetModel = GEMINI_FALLBACK_MODEL
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData?.error?.message || `Gemini API 호출 실패 (HTTP ${response.status})`)
  }

  const result = await response.json()
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
    model: targetModel,
    data: parsed
  }
}
