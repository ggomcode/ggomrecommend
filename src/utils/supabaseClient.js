import { createClient } from '@supabase/supabase-js'

// 1. 환경 변수에서 로드 시도
let url = import.meta.env.VITE_SUPABASE_URL || ''
let anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 2. 환경 변수가 없을 경우 localStorage에서 로드 시도 (런타임 동적 설정용)
if (!url) {
  url = localStorage.getItem('pcm_supabase_url') || ''
}
if (!anonKey) {
  anonKey = localStorage.getItem('pcm_supabase_anon_key') || ''
}

export const getSupabaseConfig = () => {
  return {
    url: localStorage.getItem('pcm_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: localStorage.getItem('pcm_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  }
}

export const setSupabaseConfig = (newUrl, newAnonKey) => {
  localStorage.setItem('pcm_supabase_url', newUrl)
  localStorage.setItem('pcm_supabase_anon_key', newAnonKey)
  const baseUrl = import.meta.env.BASE_URL || '/'
  const targetPath = baseUrl.endsWith('/') ? `${baseUrl}welcome` : `${baseUrl}/welcome`
  window.location.href = targetPath
}

// 클라이언트 인스턴스 생성 (설정이 유효한 경우에만)
export const supabase = url && anonKey ? createClient(url, anonKey) : null
