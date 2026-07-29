import { createClient } from '@supabase/supabase-js'

// 1. 환경 변수 또는 로컬 스토리지 또는 프로젝트 기본값에서 로드
let url = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('pcm_supabase_url') || 'https://jjcqhytsoexciupdfdjk.supabase.co'
let anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('pcm_supabase_anon_key') || ''

export const getSupabaseConfig = () => {
  return {
    url: localStorage.getItem('pcm_supabase_url') || import.meta.env.VITE_SUPABASE_URL || 'https://jjcqhytsoexciupdfdjk.supabase.co',
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

// 클라이언트 인스턴스 생성
export const supabase = url ? createClient(url, anonKey) : null
