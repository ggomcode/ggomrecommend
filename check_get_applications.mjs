import { createClient } from '@supabase/supabase-js'

const url = 'https://jjcqhytsoexciupdfdjk.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqY3FoeXRzb2V4Y2l1cGRmZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTE1OTEsImV4cCI6MjEwMDg2NzU5MX0.Ug2tlSPQkysxloS__k1LQ5Es0NnQfDlNQNCeFGzn9g0'

const supabase = createClient(url, anonKey)

async function testNewGetResults(roundId, trackId) {
  try {
    let query = supabase
      .from('applications')
      .select('*')
      .eq('round', roundId)

    if (trackId) {
      query = query.eq('univ_id', trackId)
    }

    const { data: apps, error } = await query
    if (error) throw error
    if (!apps || apps.length === 0) return []

    const safeSelect = async (table) => {
      try {
        const { data } = await supabase.from(table).select('*')
        return { data: data || [] }
      } catch (e) {
        return { data: [] }
      }
    }

    const [{ data: univs }, { data: regRecs }, { data: enrolledList }, { data: profList }] = await Promise.all([
      safeSelect('universities'),
      safeSelect('regional_recommendations'),
      safeSelect('enrolled_students'),
      safeSelect('profiles')
    ])

    const univsMap = {}
    univs?.forEach(u => { univsMap[u.id] = u })
    regRecs?.forEach(r => {
      if (!univsMap[r.id]) {
        univsMap[r.id] = { univ_name: r.univ_name, track_name: r.track_name }
      }
    })

    const enrolledMap = {}
    enrolledList?.forEach(e => {
      if (e.id) enrolledMap[e.id] = e
      if (e.user_id) enrolledMap[e.user_id] = e
      if (e.student_code) enrolledMap[e.student_code] = e
    })

    const profMap = {}
    profList?.forEach(p => {
      if (p.id) profMap[p.id] = p
      if (p.student_code) profMap[p.student_code] = p
    })

    const enrichedApps = await Promise.all(apps.map(async ap => {
      const es = enrolledMap[ap.student_id] || {}
      const prof = profMap[ap.student_id] || {}
      const u = univsMap[ap.univ_id] || {}

      const rawName = es.name || prof.name || ap.name || '학생'
      let studentName = rawName

      const profiles = {
        student_code: es.student_code || prof.student_code || ap.student_code || '',
        name: studentName,
        grade: es.grade || prof.grade || 3,
        class_no: es.class_no || prof.class_no || null,
        seq_no: es.student_no || es.seq_no || prof.seq_no || null,
        is_enrolled: es.is_enrolled !== undefined ? es.is_enrolled !== false : (prof.is_enrolled !== false)
      }

      const universities = {
        univ_name: u.univ_name || ap.univ_name || '대학 미지정',
        track_name: u.track_name || ap.track_name || '학교장추천전형'
      }

      return {
        ...ap,
        profiles,
        universities
      }
    }))

    // 1. 대학 전체 순위 계산 (같은 대학 이름으로 묶음)
    const univGrouped = {}
    enrichedApps.forEach(ap => {
      const uName = ap.universities.univ_name
      if (!univGrouped[uName]) univGrouped[uName] = []
      univGrouped[uName].push(ap)
    })

    const univRanks = {} // mapping key: student_id + '_' + track_id -> rank
    Object.keys(univGrouped).forEach(uName => {
      const groupApps = univGrouped[uName]
      // 정렬
      groupApps.sort((a, b) => {
        if (a.profiles.is_enrolled !== b.profiles.is_enrolled) {
          return a.profiles.is_enrolled ? -1 : 1
        }
        const scoreA = Number(a.manual_score || 0)
        const scoreB = Number(b.manual_score || 0)
        if (scoreB !== scoreA) return scoreB - scoreA
        return a.profiles.student_code.localeCompare(b.profiles.student_code)
      })

      let rank = 1
      let skipCount = 0
      let prevScore = null
      let prevEnrolled = null

      groupApps.forEach((ap, idx) => {
        const currentScore = Number(ap.manual_score || 0)
        const currentEnrolled = ap.profiles.is_enrolled

        if (idx > 0) {
          if (currentScore === prevScore && currentEnrolled === prevEnrolled) {
            skipCount++
          } else {
            rank += skipCount + 1
            skipCount = 0
          }
        }

        prevScore = currentScore
        prevEnrolled = currentEnrolled
        univRanks[`${ap.student_id}_${ap.univ_id}`] = rank
      })
    })

    // 2. 모집단위별 순위 계산
    const trackGrouped = {}
    enrichedApps.forEach(ap => {
      const key = `${ap.univ_id}-${ap.round}`
      if (!trackGrouped[key]) trackGrouped[key] = []
      trackGrouped[key].push(ap)
    })

    const results = []
    Object.keys(trackGrouped).forEach(key => {
      const groupApps = trackGrouped[key]

      groupApps.sort((a, b) => {
        if (a.profiles.is_enrolled !== b.profiles.is_enrolled) {
          return a.profiles.is_enrolled ? -1 : 1
        }
        const scoreA = Number(a.manual_score || 0)
        const scoreB = Number(b.manual_score || 0)
        if (scoreB !== scoreA) return scoreB - scoreA
        return a.profiles.student_code.localeCompare(b.profiles.student_code)
      })

      let rank = 1
      let skipCount = 0
      let prevScore = null
      let prevEnrolled = null

      groupApps.forEach((ap, idx) => {
        const currentScore = Number(ap.manual_score || 0)
        const currentEnrolled = ap.profiles.is_enrolled

        if (idx > 0) {
          if (currentScore === prevScore && currentEnrolled === prevEnrolled) {
            skipCount++
          } else {
            rank += skipCount + 1
            skipCount = 0
          }
        }

        prevScore = currentScore
        prevEnrolled = currentEnrolled

        let finalRank = rank
        
        // 대학 전체 순위 가져오기
        const univRank = univRanks[`${ap.student_id}_${ap.univ_id}`] || rank

        results.push({
          student_id: ap.student_id,
          track_id: ap.univ_id,
          round_id: ap.round,
          total_score: currentScore,
          score_detail: {},
          ranking: univRank, // 대학 전체 순위
          track_rank: finalRank, // 모집단위별 순위
          recommended: ap.is_recommended,
          abandoned: ap.is_abandoned,
          excluded: ap.is_excluded,
          excluded_reason: ap.excluded_reason,
          student_code: ap.profiles.student_code,
          name: ap.profiles.name,
          grade: ap.profiles.grade,
          class_no: ap.profiles.class_no,
          seq_no: ap.profiles.seq_no,
          is_enrolled: ap.profiles.is_enrolled,
          univ_name: ap.universities.univ_name,
          track_name: ap.universities.track_name,
          department_name: ap.department_name
        })
      })
    })

    return results
  } catch (err) {
    console.error('getResults unexpected error:', err)
    return []
  }
}

async function run() {
  const res = await testNewGetResults(1)
  console.log('Result:', res)
}
run()
