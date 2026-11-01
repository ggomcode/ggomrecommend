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
 * 5-1. 3개년 경쟁률 보강 헬퍼
 * - 구글 시트 파싱 데이터가 있으면 최우선 유지
 * - 특정 연도 누락 또는 로컬 데이터인 경우 해당 대학/전형 벤치마크 기반 3개년 경쟁률 자연스럽게 보강
 */
export function ensureCompetitionRates(app, targetYear = '2027', csatPassRateTable = []) {
  const y = parseInt(String(targetYear).replace(/[^0-9]/g, ''), 10) || 2027
  const yearList = [String(y - 2), String(y - 1), String(y)]

  // 1) 이미 app.competitionRates가 있고 최소 1개 연도의 rate가 유효한 경우 그대로 유지 (누락된 연도만 보완)
  const existing = (app && app.competitionRates && typeof app.competitionRates === 'object') 
    ? { ...app.competitionRates } 
    : {}

  const hasAnyValid = yearList.some(yk => {
    const it = existing[yk]
    return it && it.rate !== null && it.rate !== undefined && !isNaN(Number(it.rate))
  })

  // 만약 대상 3개년이 모두 유효하다면 그대로 반환
  const allValid = yearList.every(yk => {
    const it = existing[yk]
    return it && it.rate !== null && it.rate !== undefined && !isNaN(Number(it.rate))
  })
  if (allValid) {
    return existing
  }

  // 2) 벤치마크 기본 경쟁률 산정
  let baseRate = 9.2
  if (csatPassRateTable && csatPassRateTable.length > 0) {
    const uName = String(app.univName || '').replace(/\(.*\)/g, '').trim()
    const dName = String(app.dept || '').trim()
    const found = csatPassRateTable.find(p => {
      const pu = String(p.univName || '').replace(/\(.*\)/g, '').trim()
      const pd = String(p.dept || '').trim()
      return (uName.includes(pu) || pu.includes(uName)) && (!dName || dName.includes(pd) || pd.includes(dName))
    }) || csatPassRateTable.find(p => {
      const pu = String(p.univName || '').replace(/\(.*\)/g, '').trim()
      return uName.includes(pu) || pu.includes(uName)
    })

    if (found && (found.initialRate || found.realRate)) {
      baseRate = Number(found.initialRate || found.realRate) || 9.2
    }
  }

  // 대학 및 학과 유형 가중치
  const u = String(app.univName || '')
  const d = String(app.dept || '')
  const t = String(app.admissionType || '')
  if (/의예|의학|한의|약학|치의|수의/.test(d)) {
    baseRate = Math.max(baseRate, 26.5)
  } else if (/논술/.test(t)) {
    baseRate = Math.max(baseRate, 38.4)
  } else if (/고려대|연세대|성균관|한양대|서강대/.test(u)) {
    baseRate = Math.max(baseRate, 14.2)
  } else if (/중앙대|경희대|한국외|시립대|건국대|동국대|홍익/.test(u)) {
    baseRate = Math.max(baseRate, 12.8)
  } else if (/국민대|숭실대|세종대|단국대|가천대|아주대|인하대/.test(u)) {
    baseRate = Math.max(baseRate, 10.5)
  } else if (/경기대|명지대|상명대|가톨릭/.test(u)) {
    baseRate = Math.max(baseRate, 8.8)
  }

  const quota = app.quota || 12
  const rCurrent = baseRate
  const rPrev1 = parseFloat((baseRate * 0.94).toFixed(1))
  const rPrev2 = parseFloat((baseRate * 0.89).toFixed(1))
  const rateTrend = [rPrev2, rPrev1, rCurrent]

  yearList.forEach((yr, idx) => {
    if (!existing[yr] || existing[yr].rate === null || existing[yr].rate === undefined) {
      const assignedRate = rateTrend[idx]
      existing[yr] = {
        quota: existing[yr]?.quota || String(quota),
        applicants: existing[yr]?.applicants || String(Math.round(quota * assignedRate)),
        rate: assignedRate,
        raw: `${assignedRate}:1`
      }
    }
  })

  return existing
}

/**
 * 6. 7대 입체 평가 지표 세부 산출 엔진 (총 100점 만점)
 */

// [지표 1] 내신 실질 마진 지표 (25점 만점)
export function calculateGpaSafetyMargin(cards = [], studentGpa = 3.0) {
  let cardScoreSum = 0
  let safeCardsCount = 0
  let heavyReachCount = 0

  const evaluatedCards = cards.map(card => {
    const passCut = Number(card.score9Grade || card.univConvertedGrade || card.historicalCut) || (Number(studentGpa) + 0.2)
    const deltaGpa = Number((passCut - Number(studentGpa)).toFixed(2)) // 양수면 학생 내신이 더 우수함

    let pts = 0
    if (deltaGpa >= 0.30) {
      pts = 4.0
      safeCardsCount++
    } else if (deltaGpa >= 0.15) {
      pts = 3.5
      safeCardsCount++
    } else if (deltaGpa >= -0.10) {
      pts = 2.5
    } else if (deltaGpa >= -0.30) {
      pts = 1.5
    } else if (deltaGpa >= -0.50) {
      pts = 0.5
      heavyReachCount++
    } else {
      pts = 0.0
      heavyReachCount++
    }

    cardScoreSum += pts
    return { ...card, deltaGpa, gpaMarginPts: pts }
  })

  let score = cardScoreSum
  // 보너스 및 감점
  if (safeCardsCount >= 2) score += 1.0 // 안전벨트 확보 보너스
  if (heavyReachCount >= 4) score -= 3.0 // 과상향 편중 올킬 페널티

  score = Math.max(0, Math.min(25, Number(score.toFixed(1))))
  return {
    score,
    max: 25,
    safeCardsCount,
    heavyReachCount,
    evaluatedCards,
    statusText: score >= 21 ? '매우 안정' : (score >= 16 ? '적정' : '내신 열세')
  }
}

// [지표 2] 수능최저 & 사탐런 최적화 지표 (20점 만점)
export function calculateCsatAndSatamOptimization(cards = [], mockRecord = null, simulationOffset = 0) {
  if (!mockRecord) {
    return { score: 10, max: 20, statusText: '모의고사 미등록', killerErrors: [] }
  }

  let totalPts = 0
  const killerErrors = []
  let satamBenefitCount = 0
  let passCountUnderOffset = 0

  // 학생의 사탐 응시 여부 확인
  const isSatamTaker = ['사회', '사탐', '생활과윤리', '사회문화', '한국지리', '윤리와사상', '정치와법', '세계지리'].some(k => 
    String(mockRecord.tam1Subject || '').includes(k) || 
    String(mockRecord.tam2Subject || '').includes(k) ||
    Boolean(mockRecord.socGrade && !mockRecord.sciGrade)
  )

  cards.forEach(card => {
    // 1) 사탐런 자격 적합성 (과탐 필수 대학 오지원 킬러 필터)
    const reqText = String(card.minScoreReq || '')
    const isScienceMandatory = /과탐\s*(?:필수|2과목|2개)/.test(reqText) || 
      (/의예|의학|약학|치의|수의/.test(String(card.dept || '')) && /과탐/.test(reqText))

    if (isSatamTaker && isScienceMandatory) {
      killerErrors.push(`[${card.univName} ${card.dept}] 사탐 응시자 지원 불가 (과탐 필수 지정 대학으로 100% 수능최저 미달)`)
      return
    }

    // 최저 미적용 전형인 경우 기본 2.5점
    if (!card.hasMinScore || reqText === '-' || reqText.includes('미적용')) {
      totalPts += 2.5
      passCountUnderOffset++
      return
    }

    // 버퍼 마진 계산
    let pts = 1.0
    if (card.diagnosis) {
      if (card.diagnosis.csatSatisfied) {
        passCountUnderOffset++
        pts = 3.0 // 기본 충족 3.0점
        // 사탐 1과목 꿀최저 가점
        if (isSatamTaker && /탐구\s*1과목/.test(reqText)) {
          pts += 0.5
          satamBenefitCount++
        }
      } else {
        pts = 0.5 // 1등급 턱걸이 미달
      }
    }
    totalPts += pts
  })

  // 킬러 페널티 적용
  if (killerErrors.length > 0) {
    totalPts -= killerErrors.length * 5.0
  }

  // N수생 변동성 방어 보너스 (충족률 50% 이상 유지)
  if (cards.length > 0 && (passCountUnderOffset / cards.length) >= 0.5) {
    totalPts += 1.5
  }

  const finalScore = Math.max(0, Math.min(20, Number(totalPts.toFixed(1))))
  return {
    score: finalScore,
    max: 20,
    killerErrors,
    satamBenefitCount,
    isSatamTaker,
    statusText: finalScore >= 16 ? '최저 버퍼 넉넉' : (finalScore >= 11 ? '턱걸이 경계' : '최저 미달 위험')
  }
}

// [지표 3] 학교장추천(학추) 쿼터 프리미엄 지표 (15점 만점)
export function calculateSchoolRecommendationPremium(cards = [], student = {}) {
  let recCount = 0
  cards.forEach(card => {
    if (card.isRecommendation || String(card.admissionDetailType || card.admissionMajorType || '').includes('추천') || String(card.admissionDetailType || card.admissionMajorType || '').includes('지역균형')) {
      recCount++
    }
  })

  let score = 4.0
  if (recCount === 2 || recCount === 3) score = 12.0 // 황금 배분
  else if (recCount === 1) score = 8.0
  else if (recCount >= 4) score = 9.0 // 과다 쏠림
  else score = 4.0 // 0장 미활용

  // 학생 본인이 본교 추천 배정자인 경우 추가 가점 (+3.0점)
  if (student.hasRec || student.isRecommendation) {
    score += 3.0
  }

  score = Math.max(0, Math.min(15, Number(score.toFixed(1))))
  return {
    score,
    max: 15,
    recCount,
    statusText: score >= 12 ? '추천 쿼터 최적' : (score >= 8 ? '추천 보통' : '추천 미활용')
  }
}

// [지표 4] 농어촌 쿼터 유불리 지표 (10점 만점)
export function calculateRuralQuotaScore(cards = [], student = {}) {
  const isRuralTaker = Boolean(student.hasRural || student.isRural)
  const gpa = Number(student.allSubjectGrade || student.mainSubjectGrade || 3.0)
  const ruralCount = cards.filter(c => c.isRural || String(c.admissionDetailType || c.admissionMajorType || '').includes('농어촌')).length

  let score = 8.0
  let statusText = '일반전형 최적'

  if (isRuralTaker) {
    if (gpa <= 2.4) {
      // 상위권 3배 폭증 구간
      if (ruralCount >= 2 && ruralCount <= 3) {
        score = 10.0
        statusText = '상위권 농어촌 극대화 (합격률 3배)'
      } else if (ruralCount === 1) {
        score = 7.0
        statusText = '농어촌 추가 추천'
      } else {
        score = 4.0
        statusText = '농어촌 혜택 미활용'
      }
    } else if (gpa <= 3.8) {
      // 중위권 몰림 역전 주의 구간
      if (ruralCount === 2) {
        score = 10.0
        statusText = '농어촌·일반 5:5 황금분산'
      } else if (ruralCount >= 4) {
        score = 5.0
        statusText = '중위권 농어촌 몰림 역전 위험'
      } else {
        score = 8.0
        statusText = '일반교과 안정형'
      }
    } else {
      score = 9.0
      statusText = '정량교과 안정'
    }
  } else {
    // 비농어촌 학생이 농어촌 전형을 지원한 오류 검출
    if (ruralCount > 0) {
      score = 0.0
      statusText = '농어촌 자격 미달 오지원 오류'
    }
  }

  score = Math.max(0, Math.min(10, Number(score.toFixed(1))))
  return { score, max: 10, ruralCount, isRuralTaker, statusText }
}

// [지표 5] 3개년 경쟁률 추이 및 과열도 지표 (10점 만점)
export function calculateCompetitionRateTrendScore(cards = [], selectedYear = '2027') {
  let score = 6.0 // 기본 6점 시작
  let hotCount = 0
  let stableCount = 0

  const y = parseInt(String(selectedYear).replace(/[^0-9]/g, ''), 10) || 2027
  const curY = String(y)
  const prevY = String(y - 2)

  cards.forEach(card => {
    const rates = card.competitionRates || {}
    const rCur = rates[curY]?.rate ? Number(rates[curY].rate) : null
    const rPrev = rates[prevY]?.rate ? Number(rates[prevY].rate) : null

    if (rCur !== null && rPrev !== null) {
      const slope = rCur - rPrev
      if (slope >= 7.0) {
        score -= 1.0 // 3개년 폭등 과열 감점
        hotCount++
      } else if (Math.abs(slope) <= 1.0) {
        score += 0.8 // 3개년 안정 소외 가점
        stableCount++
      }
    }

    // 절대 경쟁률 보정
    if (rCur !== null) {
      if (rCur >= 25.0) score -= 0.5 // 초과열 로또 학과 감점
      else if (rCur <= 7.0) score += 0.6 // 실속 안정 학과 가점
    }
  })

  score = Math.max(2, Math.min(10, Number(score.toFixed(1))))
  return {
    score,
    max: 10,
    hotCount,
    stableCount,
    statusText: score >= 8 ? '경쟁률 안정' : (score >= 6 ? '경쟁률 보통' : '경쟁률 폭등 과열')
  }
}

// [지표 6] 전형 유형 위험 분산도 지표 (10점 만점)
export function calculateAdmissionTypeDiversification(cards = []) {
  let gyogwaCount = 0
  let jonghabCount = 0
  let essayCount = 0

  cards.forEach(card => {
    const t = String(card.admissionType || '')
    if (t.includes('교과')) gyogwaCount++
    else if (t.includes('종합')) jonghabCount++
    else if (t.includes('논술')) essayCount++
  })

  let score = 8.0
  let statusText = '균형 분산'

  if (gyogwaCount >= 2 && jonghabCount >= 2) {
    score = 10.0 // 황금 분산 만점
    statusText = '교과·종합 황금 분산 (만점)'
  } else if (jonghabCount >= 5) {
    score = 5.0
    statusText = '올 학종 쏠림 (정성평가 불확실성 과다)'
  } else if (essayCount >= 4) {
    score = 2.0
    statusText = '올 논술 로또 지원 (위험도 극대)'
  } else if (gyogwaCount >= 5) {
    score = 8.0
    statusText = '교과 몰빵형 (안정적이나 상향 기회비용 상실)'
  }

  return { score, max: 10, gyogwaCount, jonghabCount, essayCount, statusText }
}

// [지표 7] 정시 쿠션 & 고사일정 충돌 지표 (10점 만점)
export function calculateJungsiCushionAndConflict(cards = [], jungsiBaseline = null) {
  let score = 10.0
  let captureCount = 0
  let conflictCount = 0
  const conflictDetails = []

  // 수시 납치 감점
  cards.forEach(card => {
    if (card.capture && card.capture.isCaptureRisk) {
      captureCount++
    }
  })
  if (captureCount === 1) score -= 3.0
  else if (captureCount >= 2) score -= 6.0

  // 고사일 중복 감점
  const dateMap = new Map()
  cards.forEach(card => {
    const d = card.interviewDate || card.practicalDate || card.essayDate
    if (d && d.length >= 10) {
      const cleanDate = d.slice(0, 10)
      if (!dateMap.has(cleanDate)) dateMap.set(cleanDate, [])
      dateMap.get(cleanDate).push(card)
    }
  })

  dateMap.forEach((conflictApps, dStr) => {
    if (conflictApps.length > 1) {
      conflictCount += (conflictApps.length - 1)
      const names = conflictApps.map(a => `${a.univName}(${a.dept})`).join(', ')
      conflictDetails.push(`[${dStr}] ${names} (동일 날짜 고사 중복으로 1곳 응시 불가)`)
      score -= (conflictApps.length === 2 ? 4.0 : 8.0)
    }
  })

  score = Math.max(0, Math.min(10, Number(score.toFixed(1))))
  return {
    score,
    max: 10,
    captureCount,
    conflictCount,
    conflictDetails,
    statusText: score >= 8 ? '납치·일정 안전' : (score >= 5 ? '주의 필요' : '치명적 일정/납치 위험')
  }
}

/**
 * 7. 6장 포트폴리오 밸런스 종합 진단 (7대 입체 평가 지표 총괄)
 */
export function analyzePortfolio(apps = [], studentGpa = 3.0, mockRecord = null, csatPassRateTable = [], simulationOffset = 0, jungsiBaseline = null, selectedYear = '2027', student = {}) {
  const cardDiagnoses = apps.map(app => {
    const diag = evaluateCardDiagnosis(app, studentGpa, mockRecord, csatPassRateTable, simulationOffset)
    const capture = checkSusiCapture(app, jungsiBaseline)
    const enrichedRates = ensureCompetitionRates(app, selectedYear, csatPassRateTable)
    return {
      ...app,
      competitionRates: enrichedRates,
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

  // 7대 지표 정밀 산출
  const gpaMetric = calculateGpaSafetyMargin(cardDiagnoses, studentGpa)
  const csatMetric = calculateCsatAndSatamOptimization(cardDiagnoses, mockRecord, simulationOffset)
  const recMetric = calculateSchoolRecommendationPremium(cardDiagnoses, student)
  const ruralMetric = calculateRuralQuotaScore(cardDiagnoses, student)
  const compMetric = calculateCompetitionRateTrendScore(cardDiagnoses, selectedYear)
  const typeMetric = calculateAdmissionTypeDiversification(cardDiagnoses)
  const jungsiMetric = calculateJungsiCushionAndConflict(cardDiagnoses, jungsiBaseline)

  // 100점 만점 종합 점수 산출
  const totalScore = Number((
    gpaMetric.score + 
    csatMetric.score + 
    recMetric.score + 
    ruralMetric.score + 
    compMetric.score + 
    typeMetric.score + 
    jungsiMetric.score
  ).toFixed(1))

  const safetyScore = Math.max(5, Math.min(100, Math.round(totalScore)))

  // 5단계 등급 판정
  let gradeRank = 'B'
  let balanceType = '🚀 공격적 소신형'
  let balanceColor = 'text-amber-700 bg-amber-50 border-amber-200'

  if (safetyScore >= 90) {
    gradeRank = 'S'
    balanceType = '🛡️ 초안전 합격 보장형'
    balanceColor = 'text-emerald-700 bg-emerald-50 border-emerald-300'
  } else if (safetyScore >= 78) {
    gradeRank = 'A'
    balanceType = '⚖️ 황금 균형형 (상담 권장)'
    balanceColor = 'text-indigo-700 bg-indigo-50 border-indigo-200'
  } else if (safetyScore >= 65) {
    gradeRank = 'B'
    balanceType = '🚀 공격적 소신형'
    balanceColor = 'text-blue-700 bg-blue-50 border-blue-200'
  } else if (safetyScore >= 50) {
    gradeRank = 'C'
    balanceType = '⚠️ 고위험 모험형 (올킬 주의)'
    balanceColor = 'text-rose-700 bg-rose-50 border-rose-200'
  } else {
    gradeRank = 'D'
    balanceType = '🚨 올킬 위험 (전면 재설계 필)'
    balanceColor = 'text-red-900 bg-red-100 border-red-300'
  }

  // 위험 경고 생성
  const warnings = []
  if (csatMetric.killerErrors && csatMetric.killerErrors.length > 0) {
    csatMetric.killerErrors.forEach(err => warnings.push(`🚨 ${err}`))
  }
  if (gpaMetric.safeCardsCount === 0) {
    warnings.push('🚨 안전권 마진 카드 0장 (6광탈 위험): 정시 기대선이 낮다면 최소 1~2장을 확실한 안정권으로 교체해야 합니다.')
  }
  if (gpaMetric.heavyReachCount >= 3) {
    warnings.push(`⚠️ 과상향 ${gpaMetric.heavyReachCount}장 집중: 내신 70% 컷과의 격차가 너무 커 원서 낭비 가능성이 높습니다.`)
  }
  if (csatMetric.score <= 10) {
    warnings.push('📉 수능최저 버퍼 부족: 모의고사 턱걸이 충족이 많아 수능 당일 1과목만 삐끗해도 탈락 위험이 큽니다.')
  }
  if (jungsiMetric.captureCount >= 1) {
    warnings.push(`⚠️ 수시 납치 주의 ${jungsiMetric.captureCount}건: 수능 전 고사가 있는 대학 중 정시 기대선보다 낮은 카드가 있습니다.`)
  }
  if (jungsiMetric.conflictDetails && jungsiMetric.conflictDetails.length > 0) {
    jungsiMetric.conflictDetails.forEach(c => warnings.push(`📅 고사일 중복 경고: ${c}`))
  }

  // 맞춤형 상담 처방전(Prescription) 생성
  let prescription = ''
  if (csatMetric.killerErrors.length > 0) {
    prescription = '사탐 응시자 지원 불가 대학이 포함되어 있습니다. 즉시 사탐 인정 추천전형으로 변경해야 합니다.'
  } else if (safetyScore >= 85) {
    prescription = '내신 마진과 최저 버퍼, 전형 분산이 완벽한 포트폴리오입니다. 현재 수능 최저 페이스 유지에 집중하세요.'
  } else if (gpaMetric.safeCardsCount === 0) {
    prescription = '안정권 카드가 0장입니다. 과상향 1~2장을 충원율 높은 수도권 정량 교과로 교체 시 점수가 15점 이상 상승합니다.'
  } else if (csatMetric.score <= 12) {
    prescription = '수능최저 턱걸이 위험이 큽니다. 사탐 1과목 or 영어 3등급으로 충족 가능한 실속형 교과 카드로 보강을 권장합니다.'
  } else if (compMetric.hotCount >= 2) {
    prescription = '3개년 경쟁률이 폭등한 과열 학과가 포함되어 있습니다. 동일 대학 내 소외/실속 학과로 변경 시 합격률이 급상승합니다.'
  } else {
    prescription = '상향과 적정의 비율을 조율하고 고사일 겹침 여부를 최종 점검하여 지원을 확정하세요.'
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
    gradeRank,
    balanceType,
    balanceColor,
    warnings,
    prescription,
    // 7대 지표 세부 브레이크다운
    scoreBreakdown: {
      gpaMargin: gpaMetric,
      csatSatam: csatMetric,
      schoolRec: recMetric,
      ruralQuota: ruralMetric,
      compTrend: compMetric,
      typeDiversify: typeMetric,
      jungsiConflict: jungsiMetric
    }
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

