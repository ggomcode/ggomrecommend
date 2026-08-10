import { supabase } from './supabaseClient'

export const DEFAULT_SCHEDULES = {
  1: {
    apply_start: '2026-08-19',
    apply_end: '2026-08-20',
    eval_date: '2026-08-21',
    announce_date: '2026-08-24'
  },
  2: {
    apply_start: '2026-08-26',
    apply_end: '2026-08-27',
    eval_date: '2026-08-28',
    announce_date: '2026-08-31'
  },
  3: {
    apply_start: '2026-09-02',
    apply_end: '2026-09-03',
    eval_date: '2026-09-04',
    announce_date: '2026-09-04'
  }
}

export async function fetchRoundSchedulesMap() {
  let map = {}
  let existsInDb = false
  if (supabase) {
    try {
      const { data } = await supabase.from('config').select('value').eq('key', 'round_schedules_map').maybeSingle()
      if (data && data.value) {
        try {
          map = JSON.parse(data.value)
          existsInDb = true
        } catch {}
      }
    } catch {}
  }
  if (!existsInDb) {
    const local = typeof localStorage !== 'undefined' ? localStorage.getItem('round_schedules_map') : null
    if (local) {
      try {
        map = JSON.parse(local)
        existsInDb = true
      } catch {}
    }
  }
  return { ...DEFAULT_SCHEDULES, ...map }
}

export function computeRoundDisplayStatus(round, schedule) {
  if (!round) return 'DRAFT'

  if (!schedule || !schedule.apply_start || !schedule.apply_end) {
    return round.status || 'DRAFT'
  }

  // KST 오늘 날짜 YYYY-MM-DD
  const now = new Date()
  const todayStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })

  // 1. 접수 시작 전 (오늘 < apply_start) -> 아직 일정이 시작되지 않았으므로 무조건 DRAFT(접수 전 / 대기중)
  if (todayStr < schedule.apply_start) {
    return 'DRAFT'
  }

  // 2. 접수 진행중 (apply_start <= today <= apply_end)
  if (todayStr >= schedule.apply_start && todayStr <= schedule.apply_end) {
    return 'OPEN'
  }

  // 3. 접수 마감 후 (오늘 > apply_end) -> 관리자가 최종 마감(FINALIZED) 처리해둔 경우 유지
  if (round.status === 'FINALIZED') return 'FINALIZED'

  // 현재 한국 시간의 '시' 정보 (0~23)
  let curHour = 12
  try {
    const formatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: 'numeric',
      hour12: false
    })
    const parts = formatter.formatToParts(now)
    const hourPart = parts.find(p => p.type === 'hour')
    if (hourPart) curHour = parseInt(hourPart.value, 10)
  } catch {
    curHour = now.getHours()
  }

  // 1. 접수 전
  if (todayStr < schedule.apply_start) {
    return 'DRAFT'
  }

  // 2. 접수 진행중 (apply_start <= today <= apply_end)
  if (todayStr >= schedule.apply_start && todayStr <= schedule.apply_end) {
    return 'OPEN'
  }

  // 3. 접수 마감 후 (오늘 > apply_end)
  // 오늘 날짜가 발표일(announce_date) 당일인 경우
  if (schedule.announce_date && todayStr === schedule.announce_date) {
    // 만약 심사일과 발표일이 같거나 오늘인 경우 일과 시간 18시 이전은 '심사 진행중', 그 이후는 '최종 마감'
    if (curHour < 18) {
      return 'CLOSED' // 심사 진행중
    } else {
      return 'FINALIZED' // 최종 마감 (발표 후 마감)
    }
  }

  // 오늘 날짜가 발표일(announce_date)보다 이후인 경우
  if (schedule.announce_date && todayStr > schedule.announce_date) {
    return 'FINALIZED' // 최종 마감
  }

  // 그 외의 경우 (접수 마감일은 지났으나 아직 발표 전)
  return 'CLOSED' // 심사 진행중
}
