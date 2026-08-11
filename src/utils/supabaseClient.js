import { createClient } from '@supabase/supabase-js'

const TARGET_SUPABASE_URL = 'https://nreuoyectuvgskgabdni.supabase.co'
const TARGET_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZXVveWVjdHV2Z3NrZ2FiZG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTEyNjgsImV4cCI6MjEwMTk2NzI2OH0.S-NCeTsjSEIjsTy9MiTQAxY9ga9YZ1006F_9U64FX-Y'

// 1. 환경 변수 또는 로컬 스토리지 또는 프로젝트 기본값에서 로드
let url = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('pcm_supabase_url') || TARGET_SUPABASE_URL
let anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('pcm_supabase_anon_key') || TARGET_SUPABASE_ANON_KEY

export const getSupabaseConfig = () => {
  return {
    url: localStorage.getItem('pcm_supabase_url') || import.meta.env.VITE_SUPABASE_URL || TARGET_SUPABASE_URL,
    anonKey: localStorage.getItem('pcm_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || TARGET_SUPABASE_ANON_KEY
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
