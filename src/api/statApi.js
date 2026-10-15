import { supabase } from '../utils/supabaseClient'

export const KCUE_SHEET_KEY = 'google_sheet_kcue_id'
export const KCUE_YEAR_SHEETS_KEY = 'kcue_year_sheets'

export const DEFAULT_KCUE_YEAR_SHEETS = {
  '2027': '1U5Vnx2x8gnXQlI3N4deyaurKxj-naZP0cRBb3lQnT4o',
  '2026': '',
  '2025': '',
  '2024': '',
  '2023': ''
}

export function extractSheetId(input) {
  if (!input) return ''
  const trimmed = String(input).trim()
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/)
  if (match) return match[1]
  return trimmed
}

/**
 * 기본/현재 단일 시트 ID 조회 (기존 호환성 유지)
 */
export async function getKcueSheetId() {
  const cached = localStorage.getItem(`pcm_${KCUE_SHEET_KEY}`)
  let sheetId = cached ? cached.trim() : ''

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', KCUE_SHEET_KEY)
        .maybeSingle()

      if (!error) {
        if (data && data.value != null && String(data.value).trim()) {
          sheetId = String(data.value).trim()
          localStorage.setItem(`pcm_${KCUE_SHEET_KEY}`, sheetId)
        } else if (data && !data.value) {
          sheetId = ''
          localStorage.removeItem(`pcm_${KCUE_SHEET_KEY}`)
        }
      }
    } catch (e) {
      console.warn('Failed to fetch KCUE sheet config:', e)
    }
  }

  return sheetId || DEFAULT_KCUE_YEAR_SHEETS['2027']
}

export async function isKcueStatSystemEnabled() {
  const sheetId = await getKcueSheetId()
  return !!sheetId && sheetId.length > 0
}

export async function saveKcueSheetId(id) {
  const cleanId = extractSheetId(id)
  if (supabase) {
    const { error } = await supabase
      .from('config')
      .upsert({ key: KCUE_SHEET_KEY, value: cleanId }, { onConflict: 'key' })
    if (error) throw error
  }
  if (cleanId) {
    localStorage.setItem(`pcm_${KCUE_SHEET_KEY}`, cleanId)
  } else {
    localStorage.removeItem(`pcm_${KCUE_SHEET_KEY}`)
  }
  return cleanId
}

/**
 * 학년도별 대교협 구글 시트 ID 맵 조회
 */
export async function getKcueYearSheets() {
  let result = { ...DEFAULT_KCUE_YEAR_SHEETS }
  
  const localCached = localStorage.getItem(`pcm_${KCUE_YEAR_SHEETS_KEY}`)
  if (localCached) {
    try {
      result = { ...result, ...JSON.parse(localCached) }
    } catch (e) {}
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', KCUE_YEAR_SHEETS_KEY)
        .maybeSingle()

      if (!error && data && data.value) {
        let parsed = null
        if (typeof data.value === 'object') {
          parsed = data.value
        } else {
          try {
            parsed = JSON.parse(data.value)
          } catch (e) {}
        }
        if (parsed && typeof parsed === 'object') {
          result = { ...result, ...parsed }
          localStorage.setItem(`pcm_${KCUE_YEAR_SHEETS_KEY}`, JSON.stringify(result))
        }
      }
    } catch (e) {
      console.warn('Failed to fetch KCUE year sheets config:', e)
    }
  }

  // 2027 기본값이 비어있다면 단일 키 값 사용
  if (!result['2027']) {
    const defaultSingle = await getKcueSheetId()
    if (defaultSingle) result['2027'] = defaultSingle
  }

  return result
}

/**
 * 학년도별 대교협 구글 시트 ID 맵 저장
 */
export async function saveKcueYearSheets(sheetsMap) {
  if (!sheetsMap || typeof sheetsMap !== 'object') return
  
  // Clean IDs
  const cleanMap = {}
  for (const [year, rawId] of Object.entries(sheetsMap)) {
    cleanMap[year] = extractSheetId(rawId)
  }

  const jsonStr = JSON.stringify(cleanMap)
  localStorage.setItem(`pcm_${KCUE_YEAR_SHEETS_KEY}`, jsonStr)

  if (cleanMap['2027']) {
    localStorage.setItem(`pcm_${KCUE_SHEET_KEY}`, cleanMap['2027'])
  }

  if (supabase) {
    try {
      await supabase
        .from('config')
        .upsert([
          { key: KCUE_YEAR_SHEETS_KEY, value: jsonStr },
          { key: KCUE_SHEET_KEY, value: cleanMap['2027'] || '' }
        ], { onConflict: 'key' })
    } catch (e) {
      console.error('Failed to save KCUE year sheets to Supabase:', e)
      throw e
    }
  }

  return cleanMap
}
