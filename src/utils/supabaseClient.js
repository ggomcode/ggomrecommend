import { createClient } from '@supabase/supabase-js'

// 1. 환경 변수 또는 로컬 스토리지에서 로드
let url = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('pcm_supabase_url') || ''
let anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('pcm_supabase_anon_key') || ''

export const getSupabaseConfig = () => {
  return {
    url: import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('pcm_supabase_url') || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('pcm_supabase_anon_key') || ''
  }
}

export const setSupabaseConfig = (newUrl, newAnonKey) => {
  localStorage.setItem('pcm_supabase_url', newUrl)
  localStorage.setItem('pcm_supabase_anon_key', newAnonKey)
  const baseUrl = import.meta.env.BASE_URL || '/'
  const targetPath = baseUrl.endsWith('/') ? `${baseUrl}welcome` : `${baseUrl}/welcome`
  window.location.href = targetPath
}

// 클라이언트 인스턴스 생성
export const supabase = (url && anonKey) ? createClient(url, anonKey) : null
