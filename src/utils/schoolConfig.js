import { ref } from 'vue'
import { supabase } from './supabaseClient'

const initialCached = localStorage.getItem('pcm_school_name')
export const schoolName = ref((!initialCached || initialCached === '우리학교') ? '우리고등학교' : initialCached)

export function normalizeSchoolName(input) {
  const unwrapped = input && typeof input === 'object' && 'value' in input ? input.value : input
  let name = String(unwrapped || '').trim()
  if (!name || name === '우리학교') return '우리고등학교'
  if (name.endsWith('고') && !name.endsWith('고등학교')) {
    name = name.slice(0, -1) + '고등학교'
  }
  return name
}

export function formatSchoolPrincipalTitle(rawInput) {
  const unwrapped = rawInput && typeof rawInput === 'object' && 'value' in rawInput ? rawInput.value : rawInput
  let name = String(unwrapped || '').trim()
  if (!name || name === '우리학교' || name === '우리고등학교') {
    return '우리고등학교장 귀하'
  }

  if (name.endsWith('귀하')) return name
  if (name.endsWith('고등학교장')) return `${name} 귀하`
  if (name.endsWith('고등학교')) return `${name}장 귀하`
  if (name.endsWith('고')) return `${name.slice(0, -1)}고등학교장 귀하`
  if (name.endsWith('학교')) return `${name}장 귀하`

  return `${name}고등학교장 귀하`
}

export async function fetchSchoolName() {
  const cached = localStorage.getItem('pcm_school_name')
  if (cached && cached !== '우리학교') {
    schoolName.value = cached
  } else {
    schoolName.value = '우리고등학교'
  }

  if (!supabase) return schoolName.value

  try {
    const { data } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'school_name')
      .maybeSingle()

    if (data && data.value) {
      const val = normalizeSchoolName(data.value)
      schoolName.value = val
      localStorage.setItem('pcm_school_name', val)
    } else if (!cached || cached === '우리학교') {
      schoolName.value = '우리고등학교'
      localStorage.setItem('pcm_school_name', '우리고등학교')
    }
  } catch (e) {
    console.warn('Failed to fetch school name config:', e)
  }

  return schoolName.value
}

export async function setSchoolNameConfig(nameInput) {
  const finalName = normalizeSchoolName(nameInput)
  schoolName.value = finalName
  localStorage.setItem('pcm_school_name', finalName)

  if (supabase) {
    const { error } = await supabase
      .from('config')
      .upsert({ key: 'school_name', value: finalName })
    if (error) throw error
  }

  return finalName
}
