import { supabase } from './supabaseClient'

export const DEFAULT_SCHEDULES = {
  1: {
    apply_start: '2026-08-19T09:00',
    apply_end: '2026-08-20T18:00',
    eval_start: '2026-08-21T09:00',
    eval_end: '2026-08-21T18:00',
    eval_date: '2026-08-21',
    announce_start: '2026-08-24T09:00',
    announce_end: '2026-08-25T18:00',
    announce_date: '2026-08-24'
  },
  2: {
    apply_start: '2026-08-26T09:00',
    apply_end: '2026-08-27T18:00',
    eval_start: '2026-08-28T09:00',
    eval_end: '2026-08-28T18:00',
    eval_date: '2026-08-28',
    announce_start: '2026-08-31T09:00',
    announce_end: '2026-09-01T18:00',
    announce_date: '2026-08-31'
  },
  3: {
    apply_start: '2026-09-02T09:00',
    apply_end: '2026-09-03T18:00',
    eval_start: '2026-09-04T09:00',
    eval_end: '2026-09-04T18:00',
    eval_date: '2026-09-04',
    announce_start: '2026-09-04T09:00',
    announce_end: '2026-09-05T18:00',
    announce_date: '2026-09-04'
  }
}

/**
 * 스케줄 객체의 필드를 표준화하고 날짜/시분초 및 하위 호환성을 보장합니다.
 */
export function normalizeSchedule(sched) {
  if (!sched) return null
  const s = { ...sched }

  // 1. 접수 기간
  if (s.apply_start && s.apply_start.length === 10) s.apply_start = `${s.apply_start}T09:00`
  if (s.apply_end && s.apply_end.length === 10) s.apply_end = `${s.apply_end}T18:00`

  // 2. 대상자 선정 협의일/기간 (eval_start, eval_end, eval_date)
  if (!s.eval_start && s.eval_date) {
    s.eval_start = s.eval_date.length === 10 ? `${s.eval_date}T09:00` : s.eval_date
  }
  if (!s.eval_end) {
    if (s.eval_start) s.eval_end = s.eval_start.length === 10 ? `${s.eval_start}T18:00` : s.eval_start
    else if (s.eval_date) s.eval_end = s.eval_date.length === 10 ? `${s.eval_date}T18:00` : s.eval_date
  }
  if (s.eval_start && s.eval_start.length === 10) s.eval_start = `${s.eval_start}T09:00`
  if (s.eval_end && s.eval_end.length === 10) s.eval_end = `${s.eval_end}T18:00`
  if (!s.eval_date && s.eval_start) {
    s.eval_date = s.eval_start.slice(0, 10)
  }

  // 3. 선정 결과 공지 기간 (announce_start, announce_end, announce_date)
  if (!s.announce_start && s.announce_date) {
    s.announce_start = s.announce_date.length === 10 ? `${s.announce_date}T09:00` : s.announce_date
  }
  if (!s.announce_end) {
    if (s.announce_start) s.announce_end = s.announce_start.length === 10 ? `${s.announce_start}T18:00` : s.announce_start
    else if (s.announce_date) s.announce_end = s.announce_date.length === 10 ? `${s.announce_date}T18:00` : s.announce_date
  }
  if (s.announce_start && s.announce_start.length === 10) s.announce_start = `${s.announce_start}T09:00`
  if (s.announce_end && s.announce_end.length === 10) s.announce_end = `${s.announce_end}T18:00`
  if (!s.announce_date && s.announce_start) {
    s.announce_date = s.announce_start.slice(0, 10)
  }

  return s
}

/**
 * 날짜+시간 문자열을 KST (Asia/Seoul, UTC+09:00) 기준으로 안전하게 Date 객체로 변환
 */
export function parseKstDate(str, isEnd = false) {
  if (!str) return null
  let s = String(str).trim().replace(' ', 'T')
  if (s.length === 10) {
    s += isEnd ? 'T23:59:59' : 'T00:00:00'
  } else if (s.length === 16) {
    s += isEnd ? ':59' : ':00'
  }
  // 타임존 식별자가 없으면 한국 표준시(+09:00) 명시
  if (!s.includes('+') && !s.includes('Z') && !s.endsWith('z')) {
    s += '+09:00'
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

/**
 * 날짜+시간 문자열(YYYY-MM-DDTHH:mm 또는 YYYY-MM-DD)을 KST 기준으로 한국어 형식 포맷팅
 * 예: 2026.08.19.(수) 09:00 (KST 기준)
 */
export function formatKoreanDateTime(dateTimeStr, showTime = true) {
  if (!dateTimeStr) return ''
  try {
    const d = parseKstDate(dateTimeStr, false)
    if (!d) return dateTimeStr

    const hasTime = dateTimeStr.includes('T') || dateTimeStr.includes(' ')

    // KST(Asia/Seoul) 기준 날짜/시간 포맷터
    const dFmt = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

    const parts = dFmt.formatToParts(d)
    const getVal = type => parts.find(p => p.type === type)?.value || ''

    const year = getVal('year')
    const month = getVal('month')
    const day = getVal('day')
    const weekday = getVal('weekday')
    const hour = getVal('hour')
    const minute = getVal('minute')

    const baseDate = `${year}.${month}.${day}.(${weekday})`
    if (!showTime || !hasTime) return baseDate

    return `${baseDate} ${hour}:${minute}`
  } catch {
    return dateTimeStr
  }
}

/**
 * 시작~종료 일시 기간을 KST 기준으로 보기 좋게 포맷팅
 * 같은 날인 경우: 2026.08.19.(수) 09:00 ~ 18:00
 * 다른 날인 경우: 2026.08.19.(수) 09:00 ~ 2026.08.20.(목) 18:00
 */
/**
 * 시작~종료 일시 기간을 KST 기준으로 보기 좋게 포맷팅
 * 같은 날인 경우: 2026.08.19.(수) 09:00 ~ 18:00
 * 다른 날인 경우: 2026.08.19.(수) 09:00 ~ 2026.08.20.(목) 18:00
 */
export function formatKoreanDateTimePeriod(startStr, endStr) {
  if (!startStr && !endStr) return '일정 미선택'
  if (startStr && !endStr) return `${formatKoreanDateTime(startStr)} ~`
  if (!startStr && endStr) return `~ ${formatKoreanDateTime(endStr)}`

  const startFormatted = formatKoreanDateTime(startStr)
  const endFormatted = formatKoreanDateTime(endStr)

  // 시작일과 종료일이 동일한 날짜인지 KST 기준으로 확인
  const startD = parseKstDate(startStr, false)
  const endD = parseKstDate(endStr, false)

  if (startD && endD && startStr.includes('T') && endStr.includes('T')) {
    const startDayStr = startD.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
    const endDayStr = endD.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })

    if (startDayStr === endDayStr) {
      try {
        const parts = new Intl.DateTimeFormat('ko-KR', {
          timeZone: 'Asia/Seoul',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).formatToParts(endD)
        const endH = parts.find(p => p.type === 'hour')?.value || ''
        const endM = parts.find(p => p.type === 'minute')?.value || ''
        return `${startFormatted} ~ ${endH}:${endM}`
      } catch {}
    }
  }

  return `${startFormatted} ~ ${endFormatted}`
}

/**
 * 시간을 제외하고 순수 날짜+요일만 포맷팅 (학생 화면용)
 * 예: 2026.08.21.(금)
 */
export function formatKoreanDateOnly(dateTimeStr) {
  return formatKoreanDateTime(dateTimeStr, false)
}

/**
 * 시작~종료 기간을 시간 없이 날짜만으로 포맷팅 (학생 화면 협의일/공지일용)
 * 같은 날인 경우: 2026.08.21.(금)
 * 다른 날인 경우: 2026.08.24.(월) ~ 2026.08.25.(화)
 */
export function formatKoreanDateOnlyPeriod(startStr, endStr) {
  if (!startStr && !endStr) return '일정 미선택'
  const startOnly = formatKoreanDateOnly(startStr)
  const endOnly = formatKoreanDateOnly(endStr)

  if (startOnly && !endOnly) return startOnly
  if (!startOnly && endOnly) return endOnly

  // 시작일과 종료일이 같은 날짜면 단일 날짜로 깔끔하게 표시
  const startD = parseKstDate(startStr, false)
  const endD = parseKstDate(endStr, false)
  if (startD && endD) {
    const startDayStr = startD.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
    const endDayStr = endD.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
    if (startDayStr === endDayStr) {
      return startOnly
    }
  }

  return `${startOnly} ~ ${endOnly}`
}

/**
 * 학생에게 보여지는 일정 형식으로 객체 변환:
 * - 희망자 접수 기간: 시간 포함 (마감 시간 엄수)
 * - 대상자 선정 협의일: 시간 미포함 (날짜만)
 * - 선정결과 공지일: 시간 미포함 (날짜만)
 */
export function formatScheduleForStudent(sched) {
  if (!sched) {
    return {
      applyPeriod: '일정 미선택',
      evalPeriod: '일정 미선택',
      announcePeriod: '일정 미선택'
    }
  }
  const s = normalizeSchedule(sched)
  return {
    applyPeriod: formatKoreanDateTimePeriod(s.apply_start, s.apply_end),
    evalPeriod: formatKoreanDateOnlyPeriod(s.eval_start, s.eval_end),
    announcePeriod: formatKoreanDateOnlyPeriod(s.announce_start, s.announce_end)
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
  const merged = { ...DEFAULT_SCHEDULES, ...map }
  // 모든 라운드 스케줄 객체 정규화 적용
  const normalizedMap = {}
  for (const [k, v] of Object.entries(merged)) {
    normalizedMap[k] = normalizeSchedule(v)
  }
  return normalizedMap
}

export function computeRoundDisplayStatus(round, rawSchedule) {
  if (!round) return 'DRAFT'

  const schedule = normalizeSchedule(rawSchedule)
  if (!schedule || !schedule.apply_start || !schedule.apply_end) {
    return round.status || 'DRAFT'
  }

  const now = new Date()
  const startDt = parseKstDate(schedule.apply_start, false)
  const endDt = parseKstDate(schedule.apply_end, true)

  // 1. 접수 시작 전 (KST 기준) -> 무조건 DRAFT(대기중)
  if (startDt && now < startDt) {
    return 'DRAFT'
  }

  // 2. 접수 진행중 (KST 기준: apply_start <= now <= apply_end) -> OPEN
  if (startDt && endDt && now >= startDt && now <= endDt) {
    return 'OPEN'
  }

  // 3. 접수 마감 후: 관리자가 명시적으로 최종 마감(FINALIZED)해 둔 경우 유지
  if (round.status === 'FINALIZED') return 'FINALIZED'

  // 4. 공지 기간에 따른 자동 상태 전이 (KST 기준)
  const announceEndDt = parseKstDate(schedule.announce_end || schedule.announce_date, true)
  if (announceEndDt && now > announceEndDt) {
    return 'FINALIZED' // 공지 기간까지 모두 종료된 경우 최종 마감
  }

  // 5. 그 외 (접수 마감 후 ~ 공지 종료 전) -> CLOSED (심사/선정/결과공지 진행중)
  return 'CLOSED'
}
