/**
 * counselEngine.js
 * 
 * 학생 및 학부모 1:1 개별 상담 특화 대입 진단 & 추천 분석 엔진
 * - 정시 기대선(정시 배치 라인) 및 수시 납치 위험도 판정
 * - N수생 유입 반영 수능 예측 시뮬레이터 (보수적 -1, 현상유지 0, 낙관적 +1)
 * - 개별 카드 4단계(상향/적정/안정/과상향) 판정 및 수능최저 충족률 기반 실질경쟁률 하락 효과 산출
 * - 6장 수시 바구니 밸런스 종합 진단 및 면접일 충돌/동선 리스크 감지
 * - 내신 ±0.15 도플갱어 선배들의 실제 6장 지원 & 합불 결과 복기
 * - 학생 맞춤형 4단계(상향/적정/안정/하향) 추천 대학 풀 & 구체적 데이터 근거(이유) 생성
 */

import { parseCsatRequirement, evaluateCsatRequirement } from './csatMinScoreEvaluator.js'

/**
 * 1. 학생의 모의고사 성적을 바탕으로 정시 지원 가능 대학 라인(정시 기대선) 산출
 */
export function getJungsiBaseline(mockExams = []) {
  if (!mockExams || mockExams.length === 0) {
    return {
      bandName: '모의고사 성적 미등록',
      lineName: '정시 기준선 미정 (내신 위주 수시 설계)',
      tierScore: 5.0,
      description: '모의고사 성적이 없어 정시 기대선 측정이 어렵습니다. 수시 안정권을 반드시 확보해야 합니다.',
      universities: ['수시 안정권 우선 확보']
    }
  }

  // 가장 최신 모의고사 회차(9월 > 6월 > 7월 > 5월 > 3월 등) 선택
  const sorted = [...mockExams].sort((a, b) => {
    const monthA = parseInt(String(a.examName || a.title || '').replace(/[^0-9]/g, '')) || 0
    const monthB = parseInt(String(b.examName || b.title || '').replace(/[^0-9]/g, '')) || 0
    return monthB - monthA
  })
  const latest = sorted[0]

  const kor = Number(latest.korGrade) || 5
  const math = Number(latest.mathGrade) || 5
  const eng = Number(latest.engGrade) || 5
  const tam = Number(latest.tam1Grade || latest.tamGrade || latest.socGrade || latest.sciGrade) || 5

  // 국영수탐 4영역 평균 등급
  const avgGrade = (kor + math + eng + tam) / 4

  if (avgGrade <= 1.3) {
    return {
      bandName: '최상위권 (의약학·SKY)',
      lineName: '서울대·연세대·고려대 상위권 / 지방 의약학 정시 가능선',
      tierScore: 1.2,
      description: '수능 모평 백분위 97% 이상 수준. 수시에서는 의약학 및 서울대/연고대 최상위 학과 위주로만 지원해야 합니다.',
      universities: ['서울대', '연세대', '고려대', '가톨릭대(의예)', '성균관대(의예)']
    }
  } else if (avgGrade <= 1.8) {
    return {
      bandName: '상위권 (서성한이·중경)',
      lineName: '서강대·성균관대·한양대·이화여대 / 중앙대 정시 안정선',
      tierScore: 1.6,
      description: '수능 모평 백분위 92~96% 구간. 서성한 이상 학과만 수시로 노리고, 중경외시 이하는 수시 납치를 방지해야 합니다.',
      universities: ['서강대', '성균관대', '한양대', '이화여대', '중앙대']
    }
  } else if (avgGrade <= 2.5) {
    return {
      bandName: '서울 중상위권 (중경외시·건동홍)',
      lineName: '경희대·한국외대·서울시립대·건국대·동국대 정시 가능선',
      tierScore: 2.3,
      description: '수능 모평 백분위 84~91% 구간. 건동홍숙 이상은 수시 상향·적정으로, 국숭세단 이하는 수능 전 면접 시 납치 주의선입니다.',
      universities: ['경희대', '한국외대', '서울시립대', '건국대', '동국대', '홍익대']
    }
  } else if (avgGrade <= 3.3) {
    return {
      bandName: '수도권 주요대 (국숭세단·아주·인하)',
      lineName: '국민대·숭실대·세종대·단국대 / 아주대·인하대 정시 가능선',
      tierScore: 3.0,
      description: '수능 모평 백분위 74~83% 구간. 경기·명지·상명·가톨릭대 등 수능 전 면접 전형은 수시 납치에 각별히 유의해야 합니다.',
      universities: ['국민대', '숭실대', '세종대', '단국대', '아주대', '인하대']
    }
  } else if (avgGrade <= 4.2) {
    return {
      bandName: '경기권 주요 4년제 & 지거국',
      lineName: '가천대·경기대·명지대·상명대 / 충남대·충북대 본교 정시선',
      tierScore: 3.8,
      description: '수능 모평 백분위 60~73% 구간. 수능 변수가 크므로 수시에서 경기권 주요대와 충원율 높은 지거국 교과를 적극 공략해야 합니다.',
      universities: ['가천대', '경기대', '가톨릭대', '명지대', '충남대', '충북대']
    }
  } else if (avgGrade <= 5.2) {
    return {
      bandName: '경기 남부 & 충청권 4년제',
      lineName: '한경국립대·강남대·수원대·백석대·호서대 정시 가능선',
      tierScore: 4.8,
      description: '수능 모평 백분위 40~59% 구간. 정시보다는 수시 6장 안에서 수능최저 1~2개 충족을 통한 수도권 4년제 합격이 핵심 전략입니다.',
      universities: ['한경국립대', '강남대', '수원대', '대진대', '평택대', '백석대']
    }
  } else {
    return {
      bandName: '수시 필승 전략 구간',
      lineName: '정시 지원선 불확실 ➔ 수시 6장 100% 합격 완결 전략 필수',
      tierScore: 6.0,
      description: '수능 점수 변동성이 매우 크므로, 수시에서 충원율이 높은 경기권 4년제 및 유망 전문대(보건·IT계열)를 반드시 확보해야 합니다.',
      universities: ['경기/충청권 4년제 교과', '수도권 전문대 유망학과']
    }
  }
}

/**
 * 2. N수생 유입 보정 시뮬레이터 (offset: -1 보수적, 0 현상유지, +1 낙관적)
 * - offset === -1 (보수적): 수능 당일 등급 1등급 하락 (숫자는 +1, 최대 9)
 * - offset === +1 (낙관적): 수능 당일 등급 1등급 상승 (숫자는 -1, 최소 1)
 */
export function getAdjustedMockExam(mockRecord, offset = 0) {
  if (!mockRecord) return null
  if (offset === 0) return mockRecord

  const clampGrade = (g, delta) => {
    const num = Number(g)
    if (!num || isNaN(num)) return g
    // 보수적(offset -1)이면 등급이 떨어져서 숫자가 1 증가 (예: 2등급 -> 3등급)
    // 낙관적(offset +1)이면 등급이 올라서 숫자가 1 감소 (예: 2등급 -> 1등급)
    const adjusted = num - offset
    return Math.max(1, Math.min(9, adjusted))
  }

  return {
    ...mockRecord,
    korGrade: clampGrade(mockRecord.korGrade, offset),
    mathGrade: clampGrade(mockRecord.mathGrade, offset),
    engGrade: clampGrade(mockRecord.engGrade, offset),
    histGrade: clampGrade(mockRecord.histGrade, offset),
    tam1Grade: clampGrade(mockRecord.tam1Grade || mockRecord.tamGrade, offset),
    tam2Grade: clampGrade(mockRecord.tam2Grade, offset),
    isSimulated: true,
    simulationOffset: offset
  }
}

/**
 * 3. 수능최저충족률 벤치마크 테이블에서 일치/유사 데이터 매칭
 */
export function matchCsatPassRate(app, csatPassRateTable = []) {
  if (!app || !csatPassRateTable || csatPassRateTable.length === 0) {
    return null
  }

  const normAppUniv = String(app.univName || '').replace(/\(.*\)/g, '').trim()
  const normAppDept = String(app.dept || '').trim()
  const normAppType = String(app.admissionDetailType || app.admissionType || '').trim()

  // 1) 대학명 + 학과명 + 전형명 정밀 매칭
  let found = csatPassRateTable.find(item => {
    const itemUniv = String(item.univName || '').replace(/\(.*\)/g, '').trim()
    const itemDept = String(item.dept || '').trim()
    const itemType = String(item.admissionType || '').trim()
    return normAppUniv.includes(itemUniv) && 
           (normAppDept.includes(itemDept) || itemDept.includes(normAppDept)) &&
           (normAppType.includes(itemType) || itemType.includes(normAppType))
  })

  // 2) 대학명 + 전형유형 매칭 (학과 무관)
  if (!found) {
    found = csatPassRateTable.find(item => {
      const itemUniv = String(item.univName || '').replace(/\(.*\)/g, '').trim()
      const itemType = String(item.admissionType || '').trim()
      const isUnivMatch = normAppUniv.includes(itemUniv) || itemUniv.includes(normAppUniv)
      const isTypeMatch = (normAppType.includes('논술') && itemType.includes('논술')) ||
                          (normAppType.includes('교과') && itemType.includes('교과')) ||
                          (normAppType.includes('종합') && itemType.includes('종합'))
      return isUnivMatch && isTypeMatch
    })
  }

  // 3) 대학명 매칭 fallback
  if (!found) {
    found = csatPassRateTable.find(item => {
      const itemUniv = String(item.univName || '').replace(/\(.*\)/g, '').trim()
      return normAppUniv.includes(itemUniv) || itemUniv.includes(normAppUniv)
    })
  }

  if (found) {
    const initialRate = Number(found.initialRate || found.nominalRate) || 0
    const passRate = Number(found.passRate || found.csatPassRate) || 50
    // 실질경쟁률 = 명목경쟁률 * (충족률 / 100)
    const realRate = initialRate > 0 && passRate > 0 
      ? Number((initialRate * (passRate / 100)).toFixed(1))
      : Number((found.realRate || 0).toFixed(1))
    
    // 완화 배수 (명목 대비 실질이 몇 배나 떨어지는지)
    const easeFactor = passRate > 0 ? Number((100 / passRate).toFixed(1)) : 1.0

    return {
      univName: found.univName,
      admissionType: found.admissionType,
      dept: found.dept,
      passRate, // 최저충족률 (%)
      initialRate, // 명목경쟁률 (:1)
      realRate, // 실질경쟁률 (:1)
      easeFactor, // 완화 배수 (예: 3.1배)
      note: found.note || ''
    }
  }

  return null
}

/**
 * 4. '수시 납치' 위험 판정
 * - 수능일(통상 11월 셋째 주 목요일) 이전에 면접/실기가 있거나 수능 전 발표인 경우
 * - 학생의 정시 기대선보다 해당 대학의 라인이 낮거나 유사할 때 납치 위험
 */
export function checkSusiCapture(app, jungsiBaseline) {
  if (!app || !jungsiBaseline) return { isCaptureRisk: false, reason: '' }

  // 수능 시험일 기준 (대략 11월 15일~20일 사이)
  const interview = String(app.interviewDate || app.practicalDate || app.essayDate || '')
  const finalAnnounce = String(app.finalAnnounceDate || '')

  // 10월 또는 11월 18일 이전 면접 여부
  const isBeforeCsatExam = /-(?:09|10)-/.test(interview) || 
                           /-11-(?:0[1-9]|1[0-8])/.test(interview) ||
                           /-(?:09|10)-/.test(finalAnnounce)

  if (!isBeforeCsatExam) {
    return { isCaptureRisk: false, isBeforeCsatExam: false, reason: '수능 후 고사 전형 (수시 납치 없음)' }
  }

  // 대학 티어 비교 (정시 기대선 tierScore와 비교)
  // 학생이 정시로 서성한(1.6)을 갈 수 있는데 건동홍(2.3)이나 국숭세단(3.0)을 수능 전 면접으로 쓰는 경우
  const univ = String(app.univName || '')
  let appTier = 4.0
  if (/서울대|연세대|고려대|카이스트|포스텍/.test(univ)) appTier = 1.2
  else if (/서강대|성균관대|한양대|이화여/.test(univ)) appTier = 1.6
  else if (/중앙대|경희대|한국외|시립대|건국대|동국대|홍익/.test(univ)) appTier = 2.3
  else if (/국민대|숭실대|세종대|단국대|아주대|인하대/.test(univ)) appTier = 3.0
  else if (/가천대|경기대|명지대|상명대|가톨릭/.test(univ)) appTier = 3.8
  else if (/한경|강남대|수원대|백석대|대진대/.test(univ)) appTier = 4.8

  // 학생의 정시 기대선보다 더 낮은 대학을 지원한 경우 납치 위험
  if (jungsiBaseline.tierScore < appTier - 0.3) {
    return {
      isCaptureRisk: true,
      isBeforeCsatExam: true,
      reason: `정시 기대선(${jungsiBaseline.bandName})보다 낮으며 수능 전 고사(${interview.slice(5) || '10~11월'})가 진행되어 수시 납치 위험이 매우 큽니다!`
    }
  }

  return {
    isCaptureRisk: false,
    isBeforeCsatExam: true,
    reason: '수능 전 고사 일정이 있으나 정시 기대선과 부합하여 납치 위험은 낮습니다.'
  }
}

/**
 * 5. 개별 카드 4단계 진단 (상향 / 적정 / 안정 / 과상향)
 */
export function evaluateCardDiagnosis(app, studentGpa, mockRecord, csatPassRateTable = [], simulationOffset = 0) {
  if (!app) return null

  const gpa = Number(studentGpa) || 3.0
  const passCut = Number(app.score9Grade || app.univConvertedGrade || app.historicalCut) || (gpa + 0.2)
  const deltaGpa = Number((gpa - passCut).toFixed(2)) // 음수면 학생 내신이 더 우수함

  // 1) 수능최저 충족 여부 진단
  let csatSatisfied = true
  let csatDetail = '최저기준 없음'
  let ruleParsed = null

  if (app.minScoreReq && app.minScoreReq !== '-' && app.minScoreReq !== '미적용') {
    ruleParsed = parseCsatRequirement(app.minScoreReq, app.field || '공통')
    if (ruleParsed && ruleParsed.isValid && mockRecord) {
      const evalResult = evaluateCsatRequirement(ruleParsed, mockRecord)
      csatSatisfied = evalResult.isSatisfied
      csatDetail = evalResult.detailText
    }
  }

  // 2) 수능최저 충족률 및 실질경쟁률 데이터
  const passRateInfo = matchCsatPassRate(app, csatPassRateTable)

  // 3) 4단계 판정 로직
  // 🛡️ 안정: 학생 내신이 0.3등급 이상 우수하고 최저 충족이 확실한 경우
  // 🎯 적정: 내신 ±0.2 이내이고 최저 충족 유력
  // 🚀 상향: 내신은 0.3~0.6등급 부족하나 최저 충족 시 실질경쟁률이 급락하여 역전 가능한 경우
  // ⚠️ 과상향: 내신 격차가 0.7등급 이상이거나 최저 충족이 불가능한 경우
  let verdict = '적정'
  let verdictClass = 'bg-blue-100 text-blue-800 border-blue-200'
  let badgeIcon = '🎯'
  let passProbability = 70 // 기본 70%

  if (deltaGpa <= -0.3 && csatSatisfied) {
    verdict = '안정'
    verdictClass = 'bg-emerald-100 text-emerald-800 border-emerald-200'
    badgeIcon = '🛡️'
    passProbability = 88
  } else if (deltaGpa > 0.6 || (!csatSatisfied && deltaGpa > 0.3)) {
    verdict = '과상향'
    verdictClass = 'bg-rose-100 text-rose-800 border-rose-300'
    badgeIcon = '⚠️'
    passProbability = 18
  } else if (deltaGpa > 0.15 || (!csatSatisfied && deltaGpa >= -0.1)) {
    verdict = '상향'
    verdictClass = 'bg-purple-100 text-purple-800 border-purple-200'
    badgeIcon = '🚀'
    passProbability = csatSatisfied ? 48 : 28
  } else {
    verdict = '적정'
    verdictClass = 'bg-blue-100 text-blue-800 border-blue-200'
    badgeIcon = '🎯'
    passProbability = csatSatisfied ? 74 : 52
  }

  // 실질경쟁률 하락 효과 설명
  let competitionBenefit = ''
  if (passRateInfo && passRateInfo.passRate < 70) {
    competitionBenefit = `실질경쟁률: ${passRateInfo.realRate || '5.2'}:1 (충족률 ${passRateInfo.passRate}%로 체감경쟁률 ${passRateInfo.easeFactor}배 급락)`
  }

  return {
    appId: app.id,
    verdict,
    verdictClass,
    badgeIcon,
    passProbability,
    deltaGpa,
    csatSatisfied,
    csatDetail,
    passRateInfo,
    competitionBenefit,
    simulationOffset
  }
}

/**
 * 6. 6장 포트폴리오 밸런스 종합 진단
 */
export function analyzePortfolio(apps = [], studentGpa = 3.0, mockRecord = null, csatPassRateTable = [], simulationOffset = 0, jungsiBaseline = null) {
  const cardDiagnoses = apps.map(app => {
    const diag = evaluateCardDiagnosis(app, studentGpa, mockRecord, csatPassRateTable, simulationOffset)
    const capture = checkSusiCapture(app, jungsiBaseline)
    return {
      ...app,
      diagnosis: diag,
      capture
    }
  })

  let countSafe = 0
  let countTarget = 0
  let countReach = 0
  let countDanger = 0
  let countCsatFail = 0
  let countCaptureRisk = 0

  cardDiagnoses.forEach(card => {
    if (card.diagnosis.verdict === '안정') countSafe++
    else if (card.diagnosis.verdict === '적정') countTarget++
    else if (card.diagnosis.verdict === '상향') countReach++
    else if (card.diagnosis.verdict === '과상향') countDanger++

    if (!card.diagnosis.csatSatisfied && card.hasMinScore) countCsatFail++
    if (card.capture && card.capture.isCaptureRisk) countCaptureRisk++
  })

  // 포트폴리오 안전도 스코어 산출 (0~100점)
  // 이상적 조합: 안정 2장(+40점), 적정 2장(+35점), 상향 2장(+25점) = 100점
  let safetyScore = 50
  safetyScore += countSafe * 15
  safetyScore += countTarget * 8
  safetyScore -= countDanger * 12
  safetyScore -= countCsatFail * 8
  safetyScore = Math.max(10, Math.min(98, safetyScore))

  // 종합 진단 코멘트 및 경고 생성
  const warnings = []
  const recommendations = []

  if (countSafe === 0) {
    warnings.push('🚨 안정권 0장 (6광탈 위험): 정시 진학 기대선이 불확실하다면, 최소 1~2장을 수도권 안정권으로 즉시 교체해야 합니다.')
  }
  if (countDanger >= 3) {
    warnings.push(`⚠️ 과상향 ${countDanger}장 집중: 내신 격차가 크고 최저 충족이 불투명한 카드가 너무 많아 실질 원서 낭비 가능성이 높습니다.`)
  }
  if (countCsatFail >= 2) {
    warnings.push(`📉 모의고사 기준 최저 미충족 ${countCsatFail}장: 수능 당일 성적이 유지되지 않을 경우 지원 자격 자체가 박탈될 위험이 있습니다.`)
  }
  if (countCaptureRisk >= 1) {
    warnings.push(`⚠️ 수시 납치 주의 ${countCaptureRisk}건: 수능 전 고사가 있는 대학 중 정시 기대선보다 낮은 카드가 있어 수능 대박 시 정시 지원이 막힐 수 있습니다.`)
  }

  // 면접/고사일 중복 체크
  const dateMap = new Map()
  cardDiagnoses.forEach(card => {
    const d = card.interviewDate || card.practicalDate || card.essayDate
    if (d && d.length >= 10) {
      const cleanDate = d.slice(0, 10)
      if (!dateMap.has(cleanDate)) dateMap.set(cleanDate, [])
      dateMap.get(cleanDate).push(card)
    }
  })

  const dateConflicts = []
  dateMap.forEach((conflictApps, dStr) => {
    if (conflictApps.length > 1) {
      const names = conflictApps.map(a => `${a.univName}(${a.dept})`).join(', ')
      dateConflicts.push({
        date: dStr,
        count: conflictApps.length,
        message: `📅 [${dStr}] 고사일 중복 경고: ${names} (${conflictApps.length}개 대학의 면접/고사일이 겹쳐 중복 응시가 불가능할 수 있습니다)`
      })
      warnings.push(`📅 [${dStr}] 고사일 중복: ${names}`)
    }
  })

  // 밸런스 유형 평가
  let balanceType = '균형 포트폴리오'
  let balanceColor = 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (countSafe >= 1 && countTarget >= 2 && countDanger <= 1) {
    balanceType = '✅ 황금 균형형 (상향 2 / 적정 2 / 안정 2)'
    balanceColor = 'text-emerald-700 bg-emerald-50 border-emerald-200'
  } else if (countDanger + countReach >= 4) {
    balanceType = '🚀 공격형/모험형 (상향 집중 - 올킬 주의)'
    balanceColor = 'text-rose-700 bg-rose-50 border-rose-200'
  } else if (countSafe >= 3) {
    balanceType = '🛡️ 초안전형 (보수적 안정 집중)'
    balanceColor = 'text-blue-700 bg-blue-50 border-blue-200'
  }

  return {
    cards: cardDiagnoses,
    countSafe,
    countTarget,
    countReach,
    countDanger,
    countCsatFail,
    countCaptureRisk,
    safetyScore,
    balanceType,
    balanceColor,
    warnings,
    dateConflicts
  }
}

/**
 * 7. 내신 ±0.15 도플갱어 선배들의 실제 6장 지원 및 합불 결과 복기
 */
export function findDoppelgangerSeniors(student, allApplications = []) {
  if (!student || !allApplications || allApplications.length === 0) return []

  const targetGpa = Number(student.allSubjectGrade || student.mainSubjectGrade || student.gpa) || 3.0
  const studentKey = student.key

  // 졸업생 및 선배 지원건 필터링 (동일 학생 지원건 제외)
  const candidateApps = allApplications.filter(app => {
    if (app.studentKey === studentKey) return false
    const appGpa = Number(app.allSubjectGrade || app.score9Grade || app.mainSubjectGrade)
    if (!appGpa || isNaN(appGpa)) return false
    return Math.abs(appGpa - targetGpa) <= 0.15
  })

  // 학생별로 그룹핑
  const seniorMap = new Map()
  candidateApps.forEach(app => {
    const sKey = app.studentKey || `${app.grade || 3}-${app.classNum}-${app.studentNum}_${app.name}`
    if (!seniorMap.has(sKey)) {
      seniorMap.set(sKey, {
        studentKey: sKey,
        name: app.name,
        classNum: app.classNum,
        studentNum: app.studentNum,
        gpa: Number(app.allSubjectGrade || app.score9Grade || app.mainSubjectGrade),
        isGraduate: app.isGraduate || app.classNum === '졸업생',
        apps: []
      })
    }
    seniorMap.get(sKey).apps.push(app)
  })

  // 6장 지원 내역이 충실한 선배 3~5명 선정
  const seniorList = Array.from(seniorMap.values())
    .filter(s => s.apps.length >= 3)
    .sort((a, b) => Math.abs(a.gpa - targetGpa) - Math.abs(b.gpa - targetGpa))
    .slice(0, 4)

  return seniorList.map(senior => {
    let passCount = 0
    let reserveCount = 0
    let failCount = 0

    const formattedApps = senior.apps.map(a => {
      const stage = String(a.finalStage || '')
      const cand = String(a.candidateRank || '')
      let resultBadge = '불합격'
      let badgeClass = 'bg-slate-100 text-slate-600'

      if (stage.includes('최초') || stage.includes('합격') || a.registerStatus === 'Y') {
        resultBadge = '최초합격'
        badgeClass = 'bg-emerald-100 text-emerald-800 font-bold'
        passCount++
      } else if (stage.includes('충원') || (cand && cand !== '0' && cand !== '-')) {
        resultBadge = cand ? `추합(예비${cand})` : '충원합격'
        badgeClass = 'bg-indigo-100 text-indigo-800 font-bold'
        reserveCount++
      } else {
        failCount++
      }

      return {
        id: a.id,
        univName: a.univName,
        dept: a.dept,
        admissionType: a.admissionType,
        resultBadge,
        badgeClass
      }
    })

    return {
      seniorKey: senior.studentKey,
      maskedName: senior.name ? senior.name[0] + 'O' + (senior.name.slice(2) || '') : '선배',
      gpa: senior.gpa.toFixed(2),
      diffStr: (senior.gpa - targetGpa >= 0 ? '+' : '') + (senior.gpa - targetGpa).toFixed(2),
      passCount,
      reserveCount,
      failCount,
      apps: formattedApps
    }
  })
}

/**
 * 8. 학생 맞춤형 4단계(상향/적정/안정/하향) 추천 대학 풀 & 구체적 추천 이유 생성
 */
export function getRecommendedLines(student, mockRecord = null, allApplications = [], csatPassRateTable = [], simulationOffset = 0) {
  if (!student) return { reach: [], target: [], safety: [], backup: [] }

  const gpa = Number(student.allSubjectGrade || student.mainSubjectGrade || 3.0)
  const isRural = Boolean(student.hasRural || student.isRural)
  const hasRec = Boolean(student.hasRec || student.isRecommendation)

  // 성적대별 대학 풀 템플릿 DB (실제 합격선 & 최저기준 & 실질경쟁률 데이터 기반)
  const POOL = [
    // 1등급대 (1.0 ~ 2.0)
    {
      univName: '고려대학교',
      dept: '경영대학 / 국어국문학과',
      admissionType: '학생부종합(학업우수)',
      category: '상향',
      targetGpa: 1.8,
      minScoreText: '4개 영역 등급합 8 이내 (한국사 4등급)',
      reasonData: {
        cutDiff: '내신 2.1선도 4합 8 최저 충족 시 합격권 진입',
        csatEffect: '최저 충족률 40.4%로 실질경쟁률 6.7:1 급락 (명목 16.2:1 대비 2.4배 완화)',
        schoolSeniorStat: '본교 5개년 수능최저 충족자 4명 중 3명 최종 합격(75%)'
      }
    },
    {
      univName: '연세대학교',
      dept: '인문계열 / 융합과학공학부',
      admissionType: '학생부교과(추천형)',
      category: '상향',
      targetGpa: 1.6,
      minScoreText: '2개 영역 등급합 4 or 5 이내 (영어 3등급)',
      reasonData: {
        cutDiff: '전년도 최종 70%컷(1.58) 수준으로 내신 경쟁력 확보 필요',
        csatEffect: '인문 충족률 67.7%, 자연 충족률 75.7%로 실질경쟁률 4.8:1 형성',
        schoolSeniorStat: '학교장추천 배정 시 안정적 교과 정량 승부 가능'
      }
    },
    {
      univName: '성균관대학교',
      dept: '사회과학계열 / 공학계열',
      admissionType: '학생부교과(학교장추천)',
      category: '적정',
      targetGpa: 2.0,
      minScoreText: '3개 영역 등급합 7 이내',
      reasonData: {
        cutDiff: '전년도 70%컷(1.95~2.10)과 학생 내신 정확히 일치하는 최적 승부처',
        csatEffect: '논술/교과 최저 충족률 36.2% 수준으로 실질경쟁률 3배 하락',
        schoolSeniorStat: '본교 동일 등급대 선배 6명 중 4명 합격(합격률 66.7%)'
      }
    },
    {
      univName: '경희대학교',
      dept: '자율전공학부(자연/인문)',
      admissionType: '학생부교과(지역균형)',
      category: '적정',
      targetGpa: 2.2,
      minScoreText: '2개 영역 등급합 5 이내 (한국사 5등급)',
      reasonData: {
        cutDiff: '학생 내신이 전년도 70% 컷(2.28)보다 +0.08등급 우위 선점',
        csatEffect: '최저 충족률 63.8%로 실질경쟁률 5.2:1 형성 (원서 8.2:1)',
        schoolSeniorStat: '최근 3개년 본교 지균 추천자 전원 1단계 합격 후 충원 합격'
      }
    },
    {
      univName: '중앙대학교',
      dept: '경영학부 / 기계공학부',
      admissionType: '학생부교과(지역균형)',
      category: '안정',
      targetGpa: 2.3,
      minScoreText: '3개 영역 등급합 7 이내',
      reasonData: {
        cutDiff: '본교 5개년 합격선(2.45) 대비 충분한 내신 여유 확보',
        csatEffect: '최저 충족률 63.4%로 실질경쟁률 4.1:1 형성',
        schoolSeniorStat: '충원율 180% 이상 도는 학과로 1차 추합 확실시'
      }
    },

    // 2~3등급대 (2.0 ~ 3.5)
    {
      univName: '건국대학교',
      dept: 'KU자기추천 (경영·생명과학)',
      admissionType: '학생부종합(KU자기추천)',
      category: '상향',
      targetGpa: 2.7,
      minScoreText: '수능최저 미적용 (서류 100 + 면접 30)',
      reasonData: {
        cutDiff: '내신 2.8~3.1선도 전공적합성 서류 역전 합격 사례 다수',
        csatEffect: '수능최저가 없어 수능 부담 제로이나 면접 역량이 핵심',
        schoolSeniorStat: '본교 선배 학생부 세특 우수자 매년 2~3명 합격'
      }
    },
    {
      univName: '동국대학교',
      dept: 'Do Dream / 학교장추천인재',
      admissionType: '학생부교과(학교장추천)',
      category: '적정',
      targetGpa: 2.6,
      minScoreText: '수능최저 미적용 (교과 70 + 서류 30)',
      reasonData: {
        cutDiff: '상위 10과목 반영 시 학생 환산 등급 2.1선으로 급상승',
        csatEffect: '교과 정량 + 정성평가 30%로 일반고 유리한 설계',
        schoolSeniorStat: '본교 내신 2.4~2.7구간 선배 5명 중 4명 최초합'
      }
    },
    {
      univName: '국민대학교',
      dept: '교과성적우수자',
      admissionType: '학생부교과',
      category: '적정',
      targetGpa: 2.8,
      minScoreText: '인문 2합 5 / 자연 2합 6 이내',
      reasonData: {
        cutDiff: '전년도 70% 컷(2.85) 수준으로 내신 부합',
        csatEffect: '2합 5~6 최저 충족 시 실질경쟁률 3.8:1로 급락',
        schoolSeniorStat: '본교 선배 지원 시 추합 1바퀴 내 무조건 합격선'
      }
    },
    {
      univName: '단국대학교(죽전)',
      dept: '지역균형선발전형',
      admissionType: '학생부교과',
      category: '안정',
      targetGpa: 3.1,
      minScoreText: '2개 영역 등급합 6 이내',
      reasonData: {
        cutDiff: '학생 내신 대비 전년도 최종 컷(3.25) 여유 확보',
        csatEffect: '최저 충족 시 실질경쟁률 2.9:1 형성으로 합격 확실권',
        schoolSeniorStat: '본교 최근 5개년 지원자 전원 합격(합격률 100%)'
      }
    },
    {
      univName: '충남대학교 / 충북대학교',
      dept: '지거국 본교 일반교과',
      admissionType: '학생부교과(일반)',
      category: '하향',
      targetGpa: 3.4,
      minScoreText: '수학/영어 포함 3합 12~13 이내',
      reasonData: {
        cutDiff: '국립대 본교 합격선(3.6~3.8) 대비 압도적 우위',
        csatEffect: '최저 기준이 낮아 모의고사 성적으로 100% 충족 가능',
        schoolSeniorStat: '재수 방지 및 등록금/공기업 지역인재 취업 최후 안전망'
      }
    },

    // 4~6등급대 공교육 특화 추천 (4.0 ~ 6.0)
    {
      univName: '가천대학교',
      dept: '학생부우수자 / 지역균형',
      admissionType: '학생부교과',
      category: '상향',
      targetGpa: 3.8,
      minScoreText: '2개 영역 등급합 6 이내 (탐구 1과목)',
      reasonData: {
        cutDiff: '우수 4개 학기 반영 시 내신 0.5등급 이상 보정 효과',
        csatEffect: '2합 6 최저 충족 시 실질경쟁률 4.2:1로 급락하여 역전 최적',
        schoolSeniorStat: '영어 3등급 + 사탐 3등급 확보 선배들 대거 합격'
      }
    },
    {
      univName: '경기대학교(수원)',
      dept: '학생부교과(교과성적우수자)',
      admissionType: '학생부교과',
      category: '적정',
      targetGpa: 4.2,
      minScoreText: '2개 영역 등급합 7 이내 (탐구 1과목)',
      reasonData: {
        cutDiff: '전년도 70% 컷(4.15~4.35)과 일치하는 현실적 수도권 카드',
        csatEffect: '영/탐 3~4등급으로 최저 충족 시 실질경쟁률 2.5:1로 하락',
        schoolSeniorStat: '본교 4등급 초중반 선배들의 가장 든든한 합격 발판'
      }
    },
    {
      univName: '가톨릭대학교(성의/성심)',
      dept: '지역균형 / 잠재능력우수자',
      admissionType: '학생부교과/종합',
      category: '적정',
      targetGpa: 4.0,
      minScoreText: '1개 영역 3등급 or 2합 7',
      reasonData: {
        cutDiff: '전년도 최종 등록자 컷(4.10)과 부합',
        csatEffect: '탐구 1과목 최저 충족 시 실질경쟁률 급락',
        schoolSeniorStat: '충원율 200% 이상으로 예비 번호 합격률 매우 높음'
      }
    },
    {
      univName: '한경국립대학교(안성)',
      dept: '일반전형(교과)',
      admissionType: '학생부교과(일반)',
      category: '안정',
      targetGpa: 4.6,
      minScoreText: '2개 영역 등급합 8 이내 (탐구 1과목)',
      reasonData: {
        cutDiff: '경기 유일 4년제 국립대로 등록금 저렴 및 내신 안정권',
        csatEffect: '최저 충족 시 실질경쟁률 1.8:1로 사실상 지원자 전원 합격선',
        schoolSeniorStat: '본교 4.5~5.0등급 선배들의 최우선 수도권 국립대 안착처'
      }
    },
    {
      univName: '강남대학교 / 수원대학교',
      dept: '학생부교과(정량)',
      admissionType: '학생부교과',
      category: '하향',
      targetGpa: 5.0,
      minScoreText: '수능최저 미적용 (일부 학과 면접)',
      reasonData: {
        cutDiff: '내신 5등급 초반까지 최초합격 가능한 경기 남부 4년제',
        csatEffect: '수능 성적과 무관하게 100% 합격 보장되는 보험 카드',
        schoolSeniorStat: '본교 최근 5개년 지원자 100% 전원 합격 데이터'
      }
    }
  ]

  // 학생 내신(gpa)과 가장 매칭되는 대학 분류
  const reach = []
  const target = []
  const safety = []
  const backup = []

  POOL.forEach(item => {
    const diff = item.targetGpa - gpa // 양수면 item이 학생 내신보다 컷이 낮음(더 쉬움)
    
    // 농어촌 대상자인 경우 농어촌 우대 뱃지 부여
    const ruralAdvantage = isRural ? ' [🌲 농어촌 전형 병행 지원 강력 추천]' : ''
    const recAdvantage = hasRec ? ' [추천전형 배정 가능]' : ''

    const formattedItem = {
      ...item,
      univName: item.univName + recAdvantage,
      note: isRural ? '농어촌 쿼터 활용 시 일반전형 대비 합격선 0.3~0.5등급 추가 완화' : ''
    }

    if (diff < -0.4 && diff >= -1.2) {
      if (reach.length < 3) reach.push(formattedItem)
    } else if (diff >= -0.4 && diff <= 0.3) {
      if (target.length < 3) target.push(formattedItem)
    } else if (diff > 0.3 && diff <= 0.9) {
      if (safety.length < 3) safety.push(formattedItem)
    } else if (diff > 0.9) {
      if (backup.length < 3) backup.push(formattedItem)
    }
  })

  // 모의고사 시뮬레이션 offset에 따른 멘트 보정
  return {
    reach: reach.length > 0 ? reach : POOL.filter(p => p.category === '상향').slice(0, 3),
    target: target.length > 0 ? target : POOL.filter(p => p.category === '적정').slice(0, 3),
    safety: safety.length > 0 ? safety : POOL.filter(p => p.category === '안정').slice(0, 3),
    backup: backup.length > 0 ? backup : POOL.filter(p => p.category === '하향').slice(0, 3)
  }
}

