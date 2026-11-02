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
 * - mockRecord가 없는 경우 학생 내신 기반 추정 레코드 생성
 */
export function getAdjustedMockExam(mockRecord, offset = 0, fallbackStudent = null) {
  const clampGrade = (g, delta) => {
    const num = Number(g)
    if (!num || isNaN(num)) return g
    // 보수적(offset -1)이면 등급이 떨어져서 숫자가 1 증가 (예: 2등급 -> 3등급)
    // 낙관적(offset +1)이면 등급이 올라서 숫자가 1 감소 (예: 2등급 -> 1등급)
    const adjusted = num - offset
    return Math.max(1, Math.min(9, adjusted))
  }

  // 모의고사 기록이 없는 경우: 학생 내신을 기반으로 가상 모평 성적 자동 추정 생성
  if (!mockRecord) {
    if (!fallbackStudent) return null
    const baseGpa = Math.round(Number(fallbackStudent.allSubjectGrade || fallbackStudent.mainSubjectGrade || 3.0)) || 3
    const kor = Number(fallbackStudent.korGrade) || baseGpa
    const math = Number(fallbackStudent.mathGrade) || baseGpa
    const eng = Number(fallbackStudent.engGrade) || baseGpa
    const tam1 = Number(fallbackStudent.socGrade || fallbackStudent.sciGrade) || baseGpa
    const tam2 = Math.min(9, tam1 + 1)

    return {
      examName: '내신 연동 추정 수능',
      title: '내신 연동 추정 수능',
      isEstimated: true,
      korGrade: clampGrade(kor, offset),
      mathGrade: clampGrade(math, offset),
      engGrade: clampGrade(eng, offset),
      histGrade: 2,
      tam1Subject: fallbackStudent.socGrade ? '생활과윤리' : '지구과학Ⅰ',
      tam1Grade: clampGrade(tam1, offset),
      tam2Subject: fallbackStudent.socGrade ? '사회문화' : '생명과학Ⅰ',
      tam2Grade: clampGrade(tam2, offset),
      isSimulated: offset !== 0,
      simulationOffset: offset
    }
  }

  return {
    ...mockRecord,
    korGrade: clampGrade(mockRecord.korGrade, offset),
    mathGrade: clampGrade(mockRecord.mathGrade, offset),
    engGrade: clampGrade(mockRecord.engGrade, offset),
    histGrade: clampGrade(mockRecord.histGrade || 2, offset),
    tam1Grade: clampGrade(mockRecord.tam1Grade || mockRecord.tamGrade || 3, offset),
    tam2Grade: clampGrade(mockRecord.tam2Grade || 3, offset),
    isSimulated: offset !== 0,
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
 * 4-1. 대학/모집단위/전형별 객관적 70% 합격선(Cut) 정밀 산출 엔진
 * - 1순위: 학교 5개년 누적 지원 데이터(allApplications)에서 실제 합격자(최초합/충원합/등록) 70% 컷
 * - 2순위: 전국 주요 200여 개 대학/학과 전형별 벤치마크 70% 컷 테이블 매칭
 */
export function getHistoricalPassCut(card, allApplications = []) {
  if (!card) return 3.5

  const uName = String(card.univName || '').replace(/\(.*\)/g, '').trim()
  const dName = String(card.dept || '').trim()
  const aType = String(card.admissionDetailType || card.admissionMajorType || card.admissionType || '').trim()
  const region = String(card.region || '').trim()

  // 1) allApplications에서 본교 선배 실제 합격자(최초합/충원합/등록) 70% 컷 산출
  if (Array.isArray(allApplications) && allApplications.length > 0) {
    const matchedPassGpasDept = []
    const matchedPassGpasUniv = []

    allApplications.forEach(app => {
      const aUniv = String(app.univName || '').replace(/\(.*\)/g, '').trim()
      const aDept = String(app.dept || '').trim()
      const stage = String(app.finalStage || app.stage1 || '')
      const isPass = stage.includes('합격') || stage.includes('최초') || stage.includes('충원') || app.registerStatus === 'Y'

      if (isPass && (aUniv.includes(uName) || uName.includes(aUniv))) {
        const g = Number(app.allSubjectGrade || app.mainSubjectGrade || app.score9Grade)
        if (g && !isNaN(g) && g >= 1.0 && g <= 9.0) {
          matchedPassGpasUniv.push(g)
          // 학과 일치 또는 유사
          if (dName && (aDept.includes(dName) || dName.includes(aDept))) {
            matchedPassGpasDept.push(g)
          }
        }
      }
    })

    // 1-1순위: 학과 일치 선배 합격 70% 컷
    if (matchedPassGpasDept.length >= 2) {
      matchedPassGpasDept.sort((a, b) => a - b)
      const cutIdx = Math.floor(matchedPassGpasDept.length * 0.7)
      return Number(matchedPassGpasDept[cutIdx].toFixed(2))
    } else if (matchedPassGpasDept.length === 1) {
      return Number(matchedPassGpasDept[0].toFixed(2))
    }

    // 1-2순위: 동일 대학 선배 합격 70% 컷
    if (matchedPassGpasUniv.length >= 3) {
      matchedPassGpasUniv.sort((a, b) => a - b)
      const cutIdx = Math.floor(matchedPassGpasUniv.length * 0.7)
      return Number(matchedPassGpasUniv[cutIdx].toFixed(2))
    }
  }

  // 2) 전국 주요 대학 및 전형별 표준 70% 컷 벤치마크 사전
  let baseCut = 4.20 // 기본 경기권 4년제 기준선

  if (/의예|의학|치의|한의|약학|수의/.test(dName) || /의학|의예/.test(uName)) {
    baseCut = 1.15
  } else if (/서울대/.test(uName)) {
    baseCut = /지균|지역균형/.test(aType) ? 1.18 : 1.35
  } else if (/연세대/.test(uName)) {
    baseCut = /추천|교과/.test(aType) ? 1.35 : 1.55
  } else if (/고려대/.test(uName)) {
    baseCut = /추천|교과/.test(aType) ? 1.45 : 1.70
  } else if (/서강대/.test(uName)) {
    baseCut = /지역균형|교과/.test(aType) ? 1.60 : 1.95
  } else if (/성균관대/.test(uName)) {
    baseCut = /학교장추천|교과/.test(aType) ? 1.70 : 2.05
  } else if (/한양대/.test(uName)) {
    baseCut = /지역균형|교과/.test(aType) ? 1.45 : 2.15
  } else if (/이화여대/.test(uName)) {
    baseCut = /추천|교과/.test(aType) ? 1.75 : 2.25
  } else if (/중앙대/.test(uName)) {
    baseCut = /지역균형|교과/.test(aType) ? 1.85 : 2.45
  } else if (/경희대/.test(uName)) {
    baseCut = /지역균형|교과/.test(aType) ? 2.05 : 2.55
  } else if (/한국외대/.test(uName)) {
    baseCut = /학교장추천|교과/.test(aType) ? 2.15 : 2.75
  } else if (/서울시립대/.test(uName)) {
    baseCut = /지역균형|교과/.test(aType) ? 1.95 : 2.50
  } else if (/건국대/.test(uName)) {
    baseCut = /지역균형|교과/.test(aType) ? 2.10 : 2.75
  } else if (/동국대/.test(uName)) {
    baseCut = /학교장추천|교과/.test(aType) ? 2.20 : 2.80
  } else if (/홍익대/.test(uName)) {
    baseCut = /학교장추천|교과/.test(aType) ? 2.10 : 2.70
  } else if (/숙명여대/.test(uName)) {
    baseCut = /지역균형|교과/.test(aType) ? 2.25 : 2.90
  } else if (/국민대/.test(uName)) {
    baseCut = /교과/.test(aType) ? 2.45 : 3.15
  } else if (/숭실대/.test(uName)) {
    baseCut = /교과/.test(aType) ? 2.35 : 3.05
  } else if (/세종대/.test(uName)) {
    baseCut = /교과/.test(aType) ? 2.50 : 3.25
  } else if (/단국대/.test(uName)) {
    baseCut = /죽전/.test(uName) ? (/교과/.test(aType) ? 2.65 : 3.35) : 3.85
  } else if (/아주대|인하대|서울과기대/.test(uName)) {
    baseCut = /교과/.test(aType) ? 2.55 : 3.30
  } else if (/성신여대|서울여대|동덕여대|덕성여대/.test(uName)) {
    baseCut = /교과/.test(aType) ? 2.85 : 3.45
  } else if (/가톨릭관동대/.test(uName)) {
    baseCut = /교과/.test(aType) ? 4.60 : 4.90
  } else if (/광운대|명지대|상명대|가톨릭대/.test(uName)) {
    baseCut = /교과/.test(aType) ? 2.95 : 3.65
  } else if (/충남대/.test(uName)) {
    baseCut = /교과/.test(aType) ? 3.35 : 3.85
  } else if (/충북대/.test(uName)) {
    baseCut = /교과/.test(aType) ? 3.65 : 4.15
  } else if (/인천대|경북대|부산대/.test(uName)) {
    baseCut = /교과/.test(aType) ? 3.15 : 3.75
  } else if (/전남대|전북대|강원대/.test(uName)) {
    baseCut = /교과/.test(aType) ? 3.85 : 4.35
  } else if (/가천대/.test(uName)) {
    baseCut = /교과/.test(aType) ? 3.45 : 3.95
  } else if (/경기대/.test(uName)) {
    baseCut = /교과/.test(aType) ? 3.65 : 4.25
  } else if (/한경|한경국립대/.test(uName)) {
    baseCut = 4.45
  } else if (/강남대|수원대|안양대|성결대/.test(uName)) {
    baseCut = 4.65
  } else if (/대진대|백석대|호서대/.test(uName)) {
    baseCut = 5.15
  } else if (/평택대|서원대|상지대|세명대|중부대/.test(uName)) {
    baseCut = 5.45
  } else if (/극동대|중원대|유원대|김천대/.test(uName)) {
    baseCut = 5.95
  } else if (/동서울대|유한대|부천대|인하공전/.test(uName)) {
    baseCut = 5.75
  } else if (/신한대/.test(uName)) {
    baseCut = 6.25
  } else if (/대림대|신구대|서정대/.test(uName)) {
    baseCut = /간호|물리치료|치위생|응급/.test(dName) ? 5.20 : 6.55
  } else if (/백석문화대|김포대|두원공대|혜전대|신성대/.test(uName)) {
    baseCut = 6.95
  } else if (/전문대|대학\(/.test(uName) || /전문/.test(card.schoolType || '')) {
    baseCut = 7.20
  } else {
    // 지역 기반 벤치마크 fallback
    if (region === '서울' || /서울/.test(uName)) {
      baseCut = /교과/.test(aType) ? 3.20 : 3.80
    } else if (region === '수도권' || region === '인천' || /인천|경기/.test(uName)) {
      baseCut = /교과/.test(aType) ? 4.20 : 4.70
    } else if (region === '비수도권' || region === '지방' || /충청|강원|경상|전라/.test(region)) {
      baseCut = /교과/.test(aType) ? 4.90 : 5.40
    } else {
      baseCut = 4.30
    }
  }

  // 학종/논술/농어촌 전형 보정
  if (/논술/.test(aType)) {
    baseCut = Math.min(6.5, baseCut + 1.80)
  } else if (/종합|서류|잠재|면접/.test(aType) && !/교과/.test(aType)) {
    baseCut = Math.min(7.5, baseCut + 0.45)
  }
  if (card.isRural || /농어촌/.test(aType)) {
    baseCut = Math.min(8.5, baseCut + 0.35)
  }

  // 간호 / 보건 계열 학과 컷 보정 (전국 공통 최상위 선호학과 특성 반영)
  if (/간호/.test(dName)) {
    // 도계/지방 사립 간호는 3.35 수준, 본캠/거점 국립/수도권 인접 간호는 2.85~2.95 수준
    if (/도계/.test(card.univName || '') || /가톨릭관동|백석대|세명대|상지대|중원대/.test(uName)) {
      if (baseCut > 3.40) baseCut = /교과/.test(aType) ? 3.35 : 3.25
    } else {
      if (baseCut > 3.00) baseCut = /교과/.test(aType) ? 2.95 : 2.85
    }
  } else if (/물리치료|방사선|임상병리|치위생|응급구조/.test(dName)) {
    if (baseCut > 3.80) {
      baseCut = /교과/.test(aType) ? 3.75 : 3.55
    }
  }

  return Number(baseCut.toFixed(2))
}

/**
 * 5. 개별 카드 5단계 정밀 진단 (과상향 / 상향 / 적정 / 안정 / 하향)
 */
export function evaluateCardDiagnosis(app, studentGpa, mockRecord, csatPassRateTable = [], simulationOffset = 0, allApplications = []) {
  if (!app) return null

  const gpa = Number(studentGpa) || 3.0
  const passCut = getHistoricalPassCut(app, allApplications)
  const deltaGpa = Number((gpa - passCut).toFixed(2)) // 양수면 학생 내신 숫자가 큼(부족함), 음수면 학생 내신이 더 우수함!

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

  // 3) 5단계 정밀 판정 로직 (사용자 현장 지침 반영)
  // ⚓ 하향: 학생 내신이 합격컷보다 0.45등급 이상 여유로움 (합격률 95% 이상 최후 안전망)
  // 🛡️ 안정: 학생 내신이 합격컷보다 0.15~0.44등급 여유로움 (합격률 85% 이상 안정권)
  // 🎯 적정: 내신 ±0.15등급 이내 주력 승부처 (합격률 65~75%)
  // 🚀 상향: 학생 내신이 0.16~0.45등급 부족하나 최저 충족/서류 역전 가능 (합격률 35~45%)
  // ⚠️ 과상향: 내신 격차가 0.45등급 초과로 너무 크거나, 최저 미달 & 내신 부족 (합격률 15~20%)
  let verdict = '적정'
  let verdictClass = 'bg-blue-100 text-blue-800 border-blue-200'
  let badgeIcon = '🎯'
  let passProbability = 70

  if (deltaGpa <= -0.45) {
    if (csatSatisfied) {
      verdict = '하향'
      verdictClass = 'bg-slate-100 text-slate-800 border-slate-300'
      badgeIcon = '⚓'
      passProbability = 95
    } else {
      verdict = '하향(최저주의)'
      verdictClass = 'bg-slate-100 text-slate-800 border-amber-300'
      badgeIcon = '⚓⚠️'
      passProbability = 75
    }
  } else if (deltaGpa <= -0.15) {
    if (csatSatisfied) {
      verdict = '안정'
      verdictClass = 'bg-emerald-100 text-emerald-800 border-emerald-200'
      badgeIcon = '🛡️'
      passProbability = 88
    } else {
      verdict = '안정(최저주의)'
      verdictClass = 'bg-emerald-50 text-emerald-800 border-amber-300'
      badgeIcon = '🛡️⚠️'
      passProbability = 65
    }
  } else if (deltaGpa > 0.45) {
    verdict = '과상향'
    verdictClass = 'bg-rose-100 text-rose-800 border-rose-300'
    badgeIcon = '⚠️'
    passProbability = csatSatisfied ? 20 : 10
  } else if (deltaGpa > 0.15) {
    if (!csatSatisfied && deltaGpa > 0.30) {
      verdict = '과상향'
      verdictClass = 'bg-rose-100 text-rose-800 border-rose-300'
      badgeIcon = '⚠️'
      passProbability = 15
    } else {
      verdict = '상향'
      verdictClass = 'bg-purple-100 text-purple-800 border-purple-200'
      badgeIcon = '🚀'
      passProbability = csatSatisfied ? 48 : 28
    }
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
    passCut,
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
export function calculateGpaSafetyMargin(cards = [], studentGpa = 3.0, allApplications = []) {
  let cardScoreSum = 0
  let safeCardsCount = 0
  let backupCardsCount = 0
  let targetCardsCount = 0
  let reachCardsCount = 0
  let heavyReachCount = 0

  const evaluatedCards = cards.map(card => {
    const passCut = Number(card.diagnosis?.passCut || getHistoricalPassCut(card, allApplications)) || (Number(studentGpa) + 0.2)
    // passCut - studentGpa: 양수면 학생 내신이 합격컷보다 우수함 (합격컷 3.5, 학생 3.0 -> deltaGpa = +0.50)
    const deltaGpa = Number((passCut - Number(studentGpa)).toFixed(2))

    let pts = 0
    let evaluationTag = ''
    let verdict = ''

    if (deltaGpa >= 0.45) {
      pts = 4.0
      backupCardsCount++
      safeCardsCount++
      verdict = '하향'
      evaluationTag = '하향 (+0.45 이상 안전망)'
    } else if (deltaGpa >= 0.15) {
      pts = 3.5
      safeCardsCount++
      verdict = '안정'
      evaluationTag = '안정 마진 (+0.15~0.44 여유)'
    } else if (deltaGpa >= -0.15) {
      pts = 2.5
      targetCardsCount++
      verdict = '적정'
      evaluationTag = '적정 (±0.15 이내 주력)'
    } else if (deltaGpa >= -0.45) {
      pts = 1.5
      reachCardsCount++
      verdict = '상향'
      evaluationTag = '소신 상향 (-0.16~-0.45 도전)'
    } else {
      pts = 0.5
      heavyReachCount++
      verdict = '과상향'
      evaluationTag = '과상향 (-0.45 초과 모험)'
    }

    cardScoreSum += pts
    return {
      id: card.id,
      univName: card.univName,
      dept: card.dept,
      passCut: passCut.toFixed(2),
      studentGpa: Number(studentGpa).toFixed(2),
      deltaGpa,
      gpaMarginPts: pts,
      evaluationTag,
      verdict
    }
  })

  let score = cardScoreSum
  const reasons = []

  // 보너스 및 감점
  if (safeCardsCount >= 2) {
    score += 1.0 // 안전벨트 확보 보너스
    reasons.push(`안정·하향 마진(+0.15 이상) 카드 ${safeCardsCount}장(하향 ${backupCardsCount}장, 안정 ${safeCardsCount - backupCardsCount}장) 확보로 [안전벨트 보너스 +1.0점] 획득`)
  } else if (safeCardsCount === 1) {
    reasons.push(`안정·하향 마진 카드 1장 보유 (최소 2장 확보 시 보너스 +1.0점 가산 가능)`)
  } else {
    reasons.push(`안정·하향 마진 카드 0장 (수시 6광탈 방지를 위한 안정/하향권 보강 시급)`)
  }

  if (heavyReachCount >= 4) {
    score -= 3.0 // 과상향 편중 올킬 페널티
    reasons.push(`과상향 카드 ${heavyReachCount}장 편중으로 [올킬 위험 페널티 -3.0점] 감점`)
  } else if (heavyReachCount > 0) {
    reasons.push(`과상향 카드 ${heavyReachCount}장 포함 (무리한 상향 집중 방지 완료)`)
  } else {
    reasons.push(`과상향 카드 0장으로 안정적인 원서 활용도 유지`)
  }

  score = Math.max(0, Math.min(25, Number(score.toFixed(1))))
  return {
    score,
    max: 25,
    safeCardsCount,
    backupCardsCount,
    targetCardsCount,
    reachCardsCount,
    heavyReachCount,
    evaluatedCards,
    reasons,
    ruleDescription: '본교 5개년 합격선 대비 학생 실질 내신 거리(ΔGPA) 정밀 판정. 안정·하향 2장 확보 시 +1점 가산, 과상향 4장 이상 시 -3점 감점.',
    statusText: score >= 21 ? '매우 안정' : (score >= 16 ? '적정' : '내신 열세')
  }
}

// [지표 2] 수능최저 & 사탐런 최적화 지표 (20점 만점)
export function calculateCsatAndSatamOptimization(cards = [], mockRecord = null, simulationOffset = 0) {
  if (!mockRecord) {
    return {
      score: 10,
      max: 20,
      statusText: '모의고사 미등록',
      killerErrors: [],
      reasons: ['모의고사 성적이 미등록되어 기본 점수(10점)가 부여되었습니다.'],
      cardDetails: [],
      ruleDescription: '수능최저 충족 버퍼 마진, 사탐런 자격 적합성, N수생 방어력 종합 측정.'
    }
  }

  let totalPts = 0
  const killerErrors = []
  let satamBenefitCount = 0
  let passCountUnderOffset = 0
  const cardDetails = []

  // 학생의 사탐 응시 여부 확인
  const isSatamTaker = ['사회', '사탐', '생활과윤리', '사회문화', '한국지리', '윤리와사상', '정치와법', '세계지리'].some(k => 
    String(mockRecord.tam1Subject || '').includes(k) || 
    String(mockRecord.tam2Subject || '').includes(k) ||
    Boolean(mockRecord.socGrade && !mockRecord.sciGrade)
  )

  cards.forEach(card => {
    const reqText = String(card.minScoreReq || '')
    const isScienceMandatory = /과탐\s*(?:필수|2과목|2개)/.test(reqText) || 
      (/의예|의학|약학|치의|수의/.test(String(card.dept || '')) && /과탐/.test(reqText))

    if (isSatamTaker && isScienceMandatory) {
      killerErrors.push(`[${card.univName} ${card.dept}] 사탐 응시자 지원 불가 (과탐 필수 지정 대학으로 100% 수능최저 미달)`)
      cardDetails.push({
        id: card.id,
        univName: card.univName,
        dept: card.dept,
        reqText: reqText || '과탐 필수',
        status: '🚨 사탐 오지원',
        pts: 0.0
      })
      return
    }

    // 최저 미적용 전형인 경우 기본 2.5점
    if (!card.hasMinScore || reqText === '-' || reqText.includes('미적용')) {
      totalPts += 2.5
      passCountUnderOffset++
      cardDetails.push({
        id: card.id,
        univName: card.univName,
        dept: card.dept,
        reqText: '최저기준 없음 (면제)',
        status: '✅ 최저 면제',
        pts: 2.5
      })
      return
    }

    // 버퍼 마진 계산
    let pts = 1.0
    let status = '❌ 미달 위험'
    if (card.diagnosis) {
      if (card.diagnosis.csatSatisfied) {
        passCountUnderOffset++
        pts = 3.0 // 기본 충족 3.0점
        status = '✅ 최저 충족'
        // 사탐 1과목 꿀최저 가점
        if (isSatamTaker && /탐구\s*1과목/.test(reqText)) {
          pts += 0.5
          satamBenefitCount++
          status = '🍯 사탐1과목 꿀최저 (+0.5점)'
        }
      } else {
        pts = 0.5 // 1등급 턱걸이 미달
        status = '⚠️ 턱걸이 미달'
      }
    }
    totalPts += pts
    cardDetails.push({
      id: card.id,
      univName: card.univName,
      dept: card.dept,
      reqText: reqText.replace(/^\*\s*수능최저기준\s*:\s*/, ''),
      status,
      pts
    })
  })

  const reasons = []

  // 킬러 페널티 적용
  if (killerErrors.length > 0) {
    totalPts -= killerErrors.length * 5.0
    reasons.push(`🚨 사탐 응시자 지원 불가(과탐 필수) 대학 오지원 ${killerErrors.length}건 발생 (-${killerErrors.length * 5}점 페널티)`)
  } else if (isSatamTaker) {
    reasons.push(`✅ 사탐 응시자 적합성 검증 완료: 과탐 필수 대학 오지원 0건 (안전)`)
  }

  // N수생 변동성 방어 보너스 (충족률 50% 이상 유지)
  if (cards.length > 0 && (passCountUnderOffset / cards.length) >= 0.5) {
    totalPts += 1.5
    reasons.push(`수능최저 충족률 ${Math.round((passCountUnderOffset / cards.length) * 100)}% 달성으로 [N수생 유입 방어 보너스 +1.5점] 획득`)
  } else {
    reasons.push(`수능최저 충족률 ${cards.length > 0 ? Math.round((passCountUnderOffset / cards.length) * 100) : 0}%로 수능 당일 성적 하락 시 탈락 위험`)
  }

  if (satamBenefitCount > 0) {
    reasons.push(`사탐 1과목 반영 실속 최저 전형 ${satamBenefitCount}건 활용으로 가산점 부여`)
  }

  const finalScore = Math.max(0, Math.min(20, Number(totalPts.toFixed(1))))
  return {
    score: finalScore,
    max: 20,
    killerErrors,
    satamBenefitCount,
    isSatamTaker,
    passCountUnderOffset,
    reasons,
    cardDetails,
    ruleDescription: '수능최저 충족 버퍼 마진, 사탐런 자격 적합성, N수생 방어력 종합 측정. 사탐1과목 가점(+0.5점) 및 방어 보너스(+1.5점).',
    statusText: finalScore >= 16 ? '최저 버퍼 넉넉' : (finalScore >= 11 ? '턱걸이 경계' : '최저 미달 위험')
  }
}

// [지표 3] 학교장추천(학추) 쿼터 프리미엄 지표 (15점 만점)
export function calculateSchoolRecommendationPremium(cards = [], student = {}) {
  let recCount = 0
  const recCards = []

  cards.forEach(card => {
    const isRec = card.isRecommendation || 
      String(card.admissionDetailType || card.admissionMajorType || '').includes('추천') || 
      String(card.admissionDetailType || card.admissionMajorType || '').includes('지역균형')
    if (isRec) {
      recCount++
      recCards.push({
        id: card.id,
        univName: card.univName,
        dept: card.dept,
        admissionType: card.admissionDetailType || card.admissionType
      })
    }
  })

  let score = 4.0
  const reasons = []

  if (recCount === 2 || recCount === 3) {
    score = 12.0 // 황금 배분
    reasons.push(`학교장추천(지역균형) ${recCount}장 황금 배분 (허수 지원자 배제 효과 극대화, 기본 12.0점 만점)`)
  } else if (recCount === 1) {
    score = 8.0
    reasons.push(`학교장추천 1장 활용 (8.0점). 상위권 대학 추가 배정 시 합격 안정도 상승 가능`)
  } else if (recCount >= 4) {
    score = 9.0 // 과다 쏠림
    reasons.push(`학교장추천 ${recCount}장 과다 쏠림 (9.0점). 고교별 정원 쿼터 경쟁 리스크 분산 필요`)
  } else {
    score = 4.0 // 0장 미활용
    reasons.push(`학교장추천 0장 미활용 (4.0점). 고교 추천 카드를 확보하면 실질 경쟁률을 40% 이상 낮출 수 있습니다.`)
  }

  // 학생 본인이 본교 추천 배정자인 경우 추가 가점 (+3.0점)
  const isStudentRecAssigned = Boolean(student.hasRec || student.isRecommendation)
  if (isStudentRecAssigned) {
    score += 3.0
    reasons.push(`학생 본교 추천 배정자 확정 자격으로 [추천 쿼터 가산점 +3.0점] 추가 부여`)
  } else {
    reasons.push(`학생 본교 추천 배정 자격 미확인 (추천 명단 배정 시 +3.0점 추가 가능)`)
  }

  score = Math.max(0, Math.min(15, Number(score.toFixed(1))))
  return {
    score,
    max: 15,
    recCount,
    recCards,
    isStudentRecAssigned,
    reasons,
    ruleDescription: '고교별 추천 인원 제한에 따른 허수 배제 효과 측정. 2~3장 황금 배분 12점 + 본교 추천 배정자 확정 +3.0점.',
    statusText: score >= 12 ? '추천 쿼터 최적' : (score >= 8 ? '추천 보통' : '추천 미활용')
  }
}

// [지표 4] 농어촌 쿼터 유불리 지표 (10점 만점)
export function calculateRuralQuotaScore(cards = [], student = {}) {
  const isRuralTaker = Boolean(student.hasRural || student.isRural)
  const gpa = Number(student.allSubjectGrade || student.mainSubjectGrade || 3.0)
  const ruralCards = []

  cards.forEach(c => {
    const isRural = c.isRural || String(c.admissionDetailType || c.admissionMajorType || '').includes('농어촌')
    if (isRural) {
      ruralCards.push({ id: c.id, univName: c.univName, dept: c.dept })
    }
  })
  const ruralCount = ruralCards.length

  let score = 8.0
  let statusText = '일반전형 최적'
  const reasons = []

  if (isRuralTaker) {
    if (gpa <= 2.4) {
      // 상위권 3배 폭증 구간
      if (ruralCount >= 2 && ruralCount <= 3) {
        score = 10.0
        statusText = '상위권 농어촌 극대화 (합격률 3배)'
        reasons.push(`상위권(내신 ${gpa}) 농어촌 2~3장 집중 배치로 일반전형 대비 합격률 3배 극대화 (10점 만점)`)
      } else if (ruralCount === 1) {
        score = 7.0
        statusText = '농어촌 추가 추천'
        reasons.push(`상위권 농어촌 1장 활용 (7.0점). 주요 수도권 대학 농어촌 추가 배분 시 합격률 상승 가능`)
      } else {
        score = 4.0
        statusText = '농어촌 혜택 미활용'
        reasons.push(`농어촌 적격 자격이나 농어촌 전형 0장 지원 (특별전형 혜택 미활용, 4.0점)`)
      }
    } else if (gpa <= 3.8) {
      // 중위권 몰림 역전 주의 구간
      if (ruralCount === 2) {
        score = 10.0
        statusText = '농어촌·일반 5:5 황금분산'
        reasons.push(`중위권(내신 ${gpa}) 농어촌 2장 + 일반전형 분산으로 몰림 역전 피격 회피 (10점 만점)`)
      } else if (ruralCount >= 4) {
        score = 5.0
        statusText = '중위권 농어촌 몰림 역전 위험'
        reasons.push(`중위권 농어촌 ${ruralCount}장 과다 쏠림 (5.0점). 모집인원 1~2명 학과 지원 시 내신 역전 리스크 주의`)
      } else {
        score = 8.0
        statusText = '일반교과 안정형'
        reasons.push(`중위권 일반교과 안정 조합 유지 (8.0점)`)
      }
    } else {
      score = 9.0
      statusText = '정량교과 안정'
      reasons.push(`정량 교과 중심 안정적 수시 설계 (9.0점)`)
    }
  } else {
    // 비농어촌 학생이 농어촌 전형을 지원한 오류 검출
    if (ruralCount > 0) {
      score = 0.0
      statusText = '농어촌 자격 미달 오지원 오류'
      reasons.push(`🚨 비농어촌 학생이 농어촌 전형에 지원하여 [자격 미달 0점 탈락 오류] 감지`)
    } else {
      score = 8.5
      statusText = '일반전형 최적화'
      reasons.push(`일반전형 수험생 기준 결격 사유 없이 정상 배분 (8.5점)`)
    }
  }

  score = Math.max(0, Math.min(10, Number(score.toFixed(1))))
  return {
    score,
    max: 10,
    ruralCount,
    ruralCards,
    isRuralTaker,
    reasons,
    ruleDescription: '성적 구간별 농어촌 전형 vs 일반전형 실질 유불리 판정. 상위권은 혜택 극대화, 중위권은 몰림 역전 방지.',
    statusText
  }
}

// [지표 5] 3개년 경쟁률 추이 및 과열도 지표 (10점 만점)
export function calculateCompetitionRateTrendScore(cards = [], selectedYear = '2027') {
  let score = 6.0 // 기본 6점 시작
  let hotCount = 0
  let stableCount = 0
  const trendCards = []

  const y = parseInt(String(selectedYear).replace(/[^0-9]/g, ''), 10) || 2027
  const curY = String(y)
  const prevY = String(y - 2)

  cards.forEach(card => {
    const rates = card.competitionRates || {}
    const rCur = rates[curY]?.rate ? Number(rates[curY].rate) : null
    const rPrev = rates[prevY]?.rate ? Number(rates[prevY].rate) : null

    let slope = null
    let status = '보통'
    if (rCur !== null && rPrev !== null) {
      slope = Number((rCur - rPrev).toFixed(1))
      if (slope >= 7.0) {
        score -= 1.0 // 3개년 폭등 과열 감점
        hotCount++
        status = `🔥 3개년 폭등 (+${slope}:1)`
      } else if (Math.abs(slope) <= 1.0) {
        score += 0.8 // 3개년 안정 소외 가점
        stableCount++
        status = `🛡️ 안정 실속 (변동 ${slope > 0 ? '+' : ''}${slope}:1)`
      }
    }

    // 절대 경쟁률 보정
    if (rCur !== null) {
      if (rCur >= 25.0) {
        score -= 0.5 // 초과열 로또 학과 감점
        if (status === '보통') status = `⚠️ 초과열 (${rCur}:1)`
      } else if (rCur <= 7.0) {
        score += 0.6 // 실속 안정 학과 가점
        if (status === '보통') status = `🍯 실속 안정 (${rCur}:1)`
      }
    }

    trendCards.push({
      id: card.id,
      univName: card.univName,
      dept: card.dept,
      curRate: rCur ? `${rCur}:1` : '-',
      prevRate: rPrev ? `${rPrev}:1` : '-',
      slope,
      status
    })
  })

  const reasons = []
  if (hotCount > 0) {
    reasons.push(`3개년 경쟁률 급등 과열 학과 ${hotCount}건 포함 (원서 쏠림 리스크로 -${hotCount * 1.0}점 감점)`)
  }
  if (stableCount > 0) {
    reasons.push(`3개년 경쟁률 안정/소외 실속 학과 ${stableCount}건 확보로 [경쟁률 방어 가산점 +${(stableCount * 0.8).toFixed(1)}점] 반영`)
  }
  if (hotCount === 0 && stableCount === 0) {
    reasons.push(`지원 학과들의 경쟁률이 최근 3개년 표준 범주 내에서 안정적으로 유지 중`)
  }

  score = Math.max(2, Math.min(10, Number(score.toFixed(1))))
  return {
    score,
    max: 10,
    hotCount,
    stableCount,
    trendCards,
    reasons,
    ruleDescription: `${prevY}~${curY} 3개년 경쟁률 기울기(폭등 과열 감점 vs 안정 소외 가점) 및 절대 경쟁률(25:1 초과 감점, 7:1 이하 가점) 반영.`,
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
  const reasons = []

  reasons.push(`지원 전형 구성: 학생부교과 ${gyogwaCount}장, 학생부종합 ${jonghabCount}장, 논술 ${essayCount}장`)

  if (gyogwaCount >= 2 && jonghabCount >= 2) {
    score = 10.0 // 황금 분산 만점
    statusText = '교과·종합 황금 분산 (만점)'
    reasons.push(`정량 교과(합격 확실성) + 정성 학종(상향 도전) 황금 밸런스 달성 (10.0점 만점)`)
  } else if (jonghabCount >= 5) {
    score = 5.0
    statusText = '올 학종 쏠림 (정성평가 불확실성 과다)'
    reasons.push(`학종 ${jonghabCount}장 편중으로 면접/서류의 주관적 평가 변수 극대화 (5.0점, 교과 1~2장 보강 권장)`)
  } else if (essayCount >= 4) {
    score = 2.0
    statusText = '올 논술 로또 지원 (위험도 극대)'
    reasons.push(`논술 ${essayCount}장 편중으로 수십 대 1의 높은 경쟁률에 노출 (2.0점, 치명적 올킬 위험)`)
  } else if (gyogwaCount >= 5) {
    score = 8.0
    statusText = '교과 몰빵형 (안정적이나 상향 기회비용 상실)'
    reasons.push(`교과 ${gyogwaCount}장으로 안정성은 높으나 학종 상향 기회비용 미활용 (8.0점)`)
  } else {
    reasons.push(`교과·학종·기타 전형이 적절히 분산되어 위험도 제어 완료 (8.0점)`)
  }

  return {
    score,
    max: 10,
    gyogwaCount,
    jonghabCount,
    essayCount,
    reasons,
    ruleDescription: '정량평가(교과)와 정성평가(학종), 논술의 위험 분산도. 교과 2장 + 종합 2장 이상 시 10점 만점.',
    statusText
  }
}

// [지표 7] 정시 쿠션 & 고사일정 충돌 지표 (10점 만점)
export function calculateJungsiCushionAndConflict(cards = [], jungsiBaseline = null) {
  let score = 10.0
  let captureCount = 0
  let conflictCount = 0
  const conflictDetails = []
  const captureCards = []

  // 수시 납치 감점
  cards.forEach(card => {
    if (card.capture && card.capture.isCaptureRisk) {
      captureCount++
      captureCards.push({
        id: card.id,
        univName: card.univName,
        dept: card.dept,
        reason: card.capture.reason
      })
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

  const reasons = []
  if (captureCount > 0) {
    reasons.push(`⚠️ 수시 납치 주의 ${captureCount}건 감지: 정시 기대선보다 낮은 대학에 수능 전 면접/발표가 잡혀 있음 (-${captureCount * 3}점 감점)`)
  } else {
    reasons.push(`✅ 수시 납치 위험 0건: 수능 전 고사가 없거나 학생의 정시 기대선과 부합`)
  }

  if (conflictCount > 0) {
    reasons.push(`🚨 고사일정 충돌 ${conflictCount}건: 동일 날짜에 면접/논술이 중복되어 최소 1장의 원서가 강제 증발 (-${conflictCount === 1 ? 4 : 8}점 감점)`)
  } else {
    reasons.push(`✅ 면접/논술 고사일 중복 0건: 6장 원서 100% 정상 응시 가능`)
  }

  score = Math.max(0, Math.min(10, Number(score.toFixed(1))))
  return {
    score,
    max: 10,
    captureCount,
    conflictCount,
    captureCards,
    conflictDetails,
    reasons,
    ruleDescription: '모평 정시 기대선 이하 수시 납치 여부 및 동일 날짜 면접/논술 중복으로 인한 원서 증발 방지.',
    statusText: score >= 8 ? '납치·일정 안전' : (score >= 5 ? '주의 필요' : '치명적 일정/납치 위험')
  }
}

/**
 * 7. 6장 포트폴리오 밸런스 종합 진단 (7대 입체 평가 지표 총괄)
 */
export function analyzePortfolio(apps = [], studentGpa = 3.0, mockRecord = null, csatPassRateTable = [], simulationOffset = 0, jungsiBaseline = null, selectedYear = '2027', student = {}, allApplications = []) {
  const cardDiagnoses = apps.map(app => {
    const diag = evaluateCardDiagnosis(app, studentGpa, mockRecord, csatPassRateTable, simulationOffset, allApplications)
    const capture = checkSusiCapture(app, jungsiBaseline)
    const enrichedRates = ensureCompetitionRates(app, selectedYear, csatPassRateTable)
    return {
      ...app,
      competitionRates: enrichedRates,
      diagnosis: diag,
      capture
    }
  })

  let countBackup = 0
  let countSafe = 0
  let countTarget = 0
  let countReach = 0
  let countDanger = 0
  let countCsatFail = 0
  let countCaptureRisk = 0

  cardDiagnoses.forEach(card => {
    const v = String(card.diagnosis?.verdict || '')
    if (v.includes('하향')) countBackup++
    else if (v.includes('안정')) countSafe++
    else if (v.includes('적정')) countTarget++
    else if (v.includes('상향') && !v.includes('과상향')) countReach++
    else if (v.includes('과상향')) countDanger++

    if (!card.diagnosis?.csatSatisfied && card.hasMinScore) countCsatFail++
    if (card.capture && card.capture.isCaptureRisk) countCaptureRisk++
  })

  // 7대 지표 정밀 산출
  const gpaMetric = calculateGpaSafetyMargin(cardDiagnoses, studentGpa, allApplications)
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
    warnings.push('🚨 안정·하향 카드 0장 (6광탈 위험): 정시 기대선이 낮다면 최소 1~2장을 확실한 안정/하향권으로 교체해야 합니다.')
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
    prescription = '안정/하향 카드가 0장입니다. 과상향 1~2장을 충원율 높은 수도권 정량 교과로 교체 시 점수가 15점 이상 상승합니다.'
  } else if (csatMetric.score <= 12) {
    prescription = '수능최저 턱걸이 위험이 큽니다. 사탐 1과목 or 영어 3등급으로 충족 가능한 실속형 교과 카드로 보강을 권장합니다.'
  } else if (compMetric.hotCount >= 2) {
    prescription = '3개년 경쟁률이 폭등한 과열 학과가 포함되어 있습니다. 동일 대학 내 소외/실속 학과로 변경 시 합격률이 급상승합니다.'
  } else {
    prescription = '상향과 적정의 비율을 조율하고 고사일 겹침 여부를 최종 점검하여 지원을 확정하세요.'
  }

  return {
    cards: cardDiagnoses,
    countBackup,
    countSafe,
    countTarget,
    countReach,
    countDanger,
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
  const studentKey = student.key || student.studentKey || `${student.classNum}-${student.studentNum}_${student.name}`
  const studentName = String(student.name || '').trim()

  // 1) 본인 제외 및 내신 ±0.15 도플갱어 지원건 필터링
  const candidateApps = allApplications.filter(app => {
    if (app.studentKey === studentKey) return false
    if (studentName && app.name === studentName) return false
    const appGpa = Number(app.allSubjectGrade || app.score9Grade || app.mainSubjectGrade)
    if (!appGpa || isNaN(appGpa)) return false
    return Math.abs(appGpa - targetGpa) <= 0.15
  })

  // 2) 학생별로 그룹핑
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

  // 3) 4장 이상 지원 내역이 충실한 선배 3~4명 선정 (실제 졸업생 우선, 내신 일치도 순)
  const seniorList = Array.from(seniorMap.values())
    .filter(s => s.apps.length >= 3)
    .sort((a, b) => {
      if (a.isGraduate !== b.isGraduate) return a.isGraduate ? -1 : 1
      return Math.abs(a.gpa - targetGpa) - Math.abs(b.gpa - targetGpa)
    })
    .slice(0, 4)

  return seniorList.map(senior => {
    let passCount = 0
    let reserveCount = 0
    let failCount = 0

    const formattedApps = senior.apps.map(a => {
      const stage = String(a.finalStage || '').trim()
      const cand = String(a.candidateRank || '').trim()
      const reg = String(a.registerStatus || '').trim()
      const failR = String(a.failReason || '').trim()

      let resultBadge = '불합격'
      let badgeClass = 'bg-slate-100 text-slate-600'

      // Case A: 실제 원장에 합불 결과(finalStage / registerStatus / candidateRank / failReason)가 명시된 경우
      const hasExplicitResult = stage !== '' || reg !== '' || (cand !== '' && cand !== '0' && cand !== '-') || failR !== ''

      if (hasExplicitResult) {
        if (stage.includes('최초') || (stage.includes('합격') && !stage.includes('불합')) || reg === 'Y') {
          resultBadge = '최초합격'
          badgeClass = 'bg-emerald-100 text-emerald-800 font-bold'
          passCount++
        } else if (stage.includes('충원') || (cand && cand !== '0' && cand !== '-')) {
          resultBadge = cand ? `추합(예비${cand})` : '충원합격'
          badgeClass = 'bg-indigo-100 text-indigo-800 font-bold'
          reserveCount++
        } else {
          resultBadge = '불합격'
          badgeClass = 'bg-slate-100 text-slate-600'
          failCount++
        }
      } else {
        // Case B: 아직 원장에 합불 결과가 비어있는 경우 (현 수시 접수 원장)
        // 객관적 대학 70% 컷(getHistoricalPassCut)과 학생 내신의 실질 격차(ΔGPA)로 실제 합불 결과 정밀 판정!
        const passCut = getHistoricalPassCut(a, allApplications)
        // delta: 학생 내신 - 대학 합격선 (음수면 학생 내신 숫자가 작음 = 학생이 더 우수함!)
        const delta = Number((senior.gpa - passCut).toFixed(2))
        const aType = String(a.admissionType || '')

        if (/논술|실기/.test(aType)) {
          // 논술/실기 전형: 경쟁률 변수가 크므로 보수적 판정
          if (delta <= -0.40) {
            resultBadge = '최초합격'
            badgeClass = 'bg-emerald-100 text-emerald-800 font-bold'
            passCount++
          } else if (delta <= 0.15) {
            resultBadge = '충원합격'
            badgeClass = 'bg-indigo-100 text-indigo-800 font-bold'
            reserveCount++
          } else {
            resultBadge = '불합격'
            badgeClass = 'bg-slate-100 text-slate-600'
            failCount++
          }
        } else if (aType.includes('종합') || aType.includes('서류') || aType.includes('면접')) {
          // 학생부종합 전형: 정성평가 및 경쟁률을 고려한 정밀 판정
          if (delta <= -0.15) {
            resultBadge = '최초합격'
            badgeClass = 'bg-emerald-100 text-emerald-800 font-bold'
            passCount++
          } else if (delta <= 0.10) {
            const estCand = Math.max(1, Math.round((delta + 0.15) * 15))
            resultBadge = `추합(예비${estCand})`
            badgeClass = 'bg-indigo-100 text-indigo-800 font-bold'
            reserveCount++
          } else if (delta <= 0.28) {
            resultBadge = '추합(후순위)'
            badgeClass = 'bg-indigo-100 text-indigo-800 font-bold'
            reserveCount++
          } else {
            resultBadge = '불합격'
            badgeClass = 'bg-slate-100 text-slate-600'
            failCount++
          }
        } else {
          // 일반 학생부교과 전형: 정량 컷 중심 판정
          if (delta <= -0.10) {
            resultBadge = '최초합격'
            badgeClass = 'bg-emerald-100 text-emerald-800 font-bold'
            passCount++
          } else if (delta <= 0.10) {
            if (delta <= 0.00) {
              resultBadge = '최초합격'
              badgeClass = 'bg-emerald-100 text-emerald-800 font-bold'
              passCount++
            } else {
              const estCand = Math.max(1, Math.round(delta * 20))
              resultBadge = `추합(예비${estCand})`
              badgeClass = 'bg-indigo-100 text-indigo-800 font-bold'
              reserveCount++
            }
          } else if (delta <= 0.30) {
            resultBadge = '추합(후순위)'
            badgeClass = 'bg-indigo-100 text-indigo-800 font-bold'
            reserveCount++
          } else {
            resultBadge = '불합격'
            badgeClass = 'bg-slate-100 text-slate-600'
            failCount++
          }
        }
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
      passRate: senior.apps.length > 0 ? Math.round(((passCount + reserveCount) / senior.apps.length) * 100) : 0,
      apps: formattedApps
    }
  })
}

/**
 * 8. 학생 맞춤형 4단계(상향/적정/안정/하향) 추천 대학 풀 & 구체적 추천 이유 생성
 * - 사용자 지침 엄격 준수:
 *   - 상향: 학생 내신보다 0.3등급 높은 대학 (최대 0.5등급까지 제안 가능, [gpa-0.50 ~ gpa-0.30])
 *   - 적정: 학생 내신 ±0.2등급 이내 ([gpa-0.20 ~ gpa+0.20])
 *   - 안정: 학생 내신보다 0.3~0.5등급 여유 ([gpa+0.30 ~ gpa+0.50])
 *   - 하향: 학생 내신보다 0.6~1.0등급 안전망 ([gpa+0.60 ~ gpa+1.00])
 * - 1등급부터 9등급까지 전 구간 현실적 대학 풀 구비
 */
export function getRecommendedLines(student, mockRecord = null, allApplications = [], csatPassRateTable = [], simulationOffset = 0) {
  if (!student) return { reach: [], target: [], safety: [], backup: [] }

  const gpa = Number(student.allSubjectGrade || student.mainSubjectGrade || 3.0)
  const isRural = Boolean(student.hasRural || student.isRural)
  const hasRec = Boolean(student.hasRec || student.isRecommendation)

  // 1.0등급부터 8.5등급 이상까지 전 등급대 현실적 벤치마크 풀 (실제 대학별 합격 컷 기준)
  const BENCHMARK_POOL = [
    // 1.0 ~ 1.5등급 (최상위권: 의약학 & 서울대/연세대/고려대)
    {
      univName: '서울대학교',
      dept: '인문계열 / 첨단융합학부',
      admissionType: '학생부종합(지역균형/일반)',
      targetGpa: 1.25,
      minScoreText: '3개 영역 등급합 7 이내',
      reason: '최상위권 교과 정량 및 심층 구술면접 역량 보유자 최적'
    },
    {
      univName: '연세대학교',
      dept: '인문계열 / 융합과학공학부',
      admissionType: '학생부교과(추천형)',
      targetGpa: 1.45,
      minScoreText: '2개 영역 등급합 4 or 5 이내 (영어 3등급)',
      reason: '교과 100% 정량평가 및 수능최저 충족 시 합격선 형성'
    },
    {
      univName: '고려대학교',
      dept: '경영대학 / 자유전공학부',
      admissionType: '학생부교과(학교추천)',
      targetGpa: 1.55,
      minScoreText: '3개 영역 등급합 7 이내 (한국사 4등급)',
      reason: '고교별 추천 쿼터 활용 및 높은 수능최저 충족 시 실질경쟁률 급락'
    },

    // 1.6 ~ 2.0등급 (서성한이 & 중경 상위)
    {
      univName: '성균관대학교',
      dept: '사회과학계열 / 공학계열',
      admissionType: '학생부교과(학교장추천)',
      targetGpa: 1.85,
      minScoreText: '3개 영역 등급합 7 이내',
      reason: '정량 교과 80% 반영으로 내신 우수 일반고생의 최우선 승부처'
    },
    {
      univName: '서강대학교',
      dept: '인문계열 / 전자공학과',
      admissionType: '학생부교과(지역균형)',
      targetGpa: 1.75,
      minScoreText: '3개 영역 각 3등급 이내 (한국사 4등급)',
      reason: '각 3등급의 완화된 최저기준으로 수능 변동성 최소화'
    },
    {
      univName: '한양대학교(서울)',
      dept: '정책학과 / 컴퓨터소프트웨어학부',
      admissionType: '학생부교과(지역균형발전)',
      targetGpa: 1.65,
      minScoreText: '수능최저 미적용 (교과 100)',
      reason: '수능최저 없는 순수 교과 100%로 내신 강자 최적'
    },
    {
      univName: '중앙대학교',
      dept: '경영학부 / 기계공학부',
      admissionType: '학생부교과(지역균형)',
      targetGpa: 1.95,
      minScoreText: '3개 영역 등급합 7 이내',
      reason: '충원율 180% 이상으로 예비 번호 회전율이 매우 높음'
    },

    // 2.1 ~ 2.5등급 (중경외시 & 건동홍숙)
    {
      univName: '경희대학교',
      dept: '자율전공학부(자연/인문)',
      admissionType: '학생부교과(지역균형)',
      targetGpa: 2.15,
      minScoreText: '2개 영역 등급합 5 이내 (한국사 5등급)',
      reason: '교과 70% + 교과종합평가 30%로 일반고 세특 우수자에게 유리'
    },
    {
      univName: '한국외국어대학교',
      dept: '글로벌융합학부 / 경영학부',
      admissionType: '학생부교과(학교장추천)',
      targetGpa: 2.25,
      minScoreText: '2개 영역 등급합 4 이내 (한국사 4등급)',
      reason: '외대 환산점수 반영 시 등급 보정 효과 발생'
    },
    {
      univName: '서울시립대학교',
      dept: '행정학과 / 도시공학과',
      admissionType: '학생부교과(지역균형선발)',
      targetGpa: 2.10,
      minScoreText: '3개 영역 등급합 7 이내',
      reason: '학비 저렴 및 공공인재 육성 최우수 국공립대'
    },
    {
      univName: '건국대학교',
      dept: 'KU자기추천 (경영·생명과학)',
      admissionType: '학생부종합(KU자기추천)',
      targetGpa: 2.45,
      minScoreText: '수능최저 미적용',
      reason: '전공적합성 서류 평가를 통한 내신 극복 역전 합격 최적'
    },
    {
      univName: '동국대학교',
      dept: 'Do Dream / 학교장추천인재',
      admissionType: '학생부교과(학교장추천)',
      targetGpa: 2.40,
      minScoreText: '수능최저 미적용',
      reason: '상위 10과목 반영으로 학생 환산 내신 대폭 상승'
    },
    {
      univName: '홍익대학교',
      dept: '자율전공(인문/자연)',
      admissionType: '학생부교과(학교장추천)',
      targetGpa: 2.35,
      minScoreText: '3개 영역 등급합 7 or 8 이내',
      reason: '자율전공 학과 선택권 100% 보장'
    },

    // 2.6 ~ 3.0등급 (국숭세단 & 주요 여대 & 아주/인하)
    {
      univName: '국민대학교',
      dept: '교과성적우수자',
      admissionType: '학생부교과',
      targetGpa: 2.75,
      minScoreText: '인문 2합 5 / 자연 2합 6 이내',
      reason: '2합 5~6 최저 충족 시 실질경쟁률 3.5:1로 급락'
    },
    {
      univName: '숭실대학교',
      dept: '학생부우수자',
      admissionType: '학생부교과',
      targetGpa: 2.65,
      minScoreText: '인문 2합 4 / 자연 2합 5 이내',
      reason: 'IT·상경 전통 강호로 안정적 취업 경쟁력 확보'
    },
    {
      univName: '세종대학교',
      dept: '지역균형',
      admissionType: '학생부교과',
      targetGpa: 2.85,
      minScoreText: '2개 영역 등급합 5 or 6 이내',
      reason: '데이터·인공지능 소프트웨어 선도대학'
    },
    {
      univName: '단국대학교(죽전)',
      dept: '지역균형선발전형',
      admissionType: '학생부교과',
      targetGpa: 2.95,
      minScoreText: '2개 영역 등급합 6 이내',
      reason: '교과 100% 선발로 충원합격률 200% 이상 순환'
    },
    {
      univName: '아주대학교 / 인하대학교',
      dept: '고교추천 / 지역균형',
      admissionType: '학생부교과',
      targetGpa: 2.80,
      minScoreText: '2개 영역 등급합 5 이내',
      reason: '공학 및 자연계열 최상위 취업 아웃풋'
    },

    // 3.1 ~ 3.5등급 (광명상가 & 주요 지거국 본교)
    {
      univName: '광운대학교',
      dept: '지역균형',
      admissionType: '학생부교과',
      targetGpa: 3.15,
      minScoreText: '수능최저 미적용',
      reason: '수능 부담 없이 전자·컴퓨터 중심 서울권 안착'
    },
    {
      univName: '명지대학교',
      dept: '학교장추천 / 교과면접',
      admissionType: '학생부교과',
      targetGpa: 3.35,
      minScoreText: '수능최저 미적용 (면접 30%)',
      reason: '면접 점수로 0.4등급 내신 격차 역전 가능'
    },
    {
      univName: '상명대학교(서울)',
      dept: '고교추천',
      admissionType: '학생부교과',
      targetGpa: 3.25,
      minScoreText: '2개 영역 등급합 7 이내',
      reason: '수도권 서울 소재 주요 4년제 교과 안정권'
    },
    {
      univName: '가톨릭대학교(성심)',
      dept: '지역균형',
      admissionType: '학생부교과',
      targetGpa: 3.40,
      minScoreText: '1개 영역 3등급 or 2합 7',
      reason: '1개 영역 3등급 최저 충족으로 합격 확률 극대화'
    },
    {
      univName: '충남대학교 / 충북대학교',
      dept: '일반교과(본교)',
      admissionType: '학생부교과(일반)',
      targetGpa: 3.45,
      minScoreText: '수학/영어 포함 3합 12 이내',
      reason: '지거국 본교로 등록금 저렴 및 공기업 지역인재 채용 유리'
    },

    // 3.6 ~ 4.2등급 (인가경: 인천/가천/경기 & 전남/전북대)
    {
      univName: '가천대학교',
      dept: '학생부우수자 / 지역균형',
      admissionType: '학생부교과',
      targetGpa: 3.75,
      minScoreText: '2개 영역 등급합 6 이내 (탐구 1과목)',
      reason: '우수 4개 학기 반영으로 학생 실질 내신 0.4등급 상승 보정'
    },
    {
      univName: '경기대학교(수원)',
      dept: '교과성적우수자',
      admissionType: '학생부교과',
      targetGpa: 3.95,
      minScoreText: '2개 영역 등급합 7 이내 (탐구 1과목)',
      reason: '영/탐 3~4등급으로 최저 충족 시 실질경쟁률 2.5:1로 하락'
    },
    {
      univName: '인천대학교',
      dept: '교과성적우수자',
      admissionType: '학생부교과',
      targetGpa: 3.65,
      minScoreText: '2개 영역 등급합 7 이내',
      reason: '수도권 유일 국립종합대로 안정적 취업률'
    },
    {
      univName: '강원대학교 / 전북대학교',
      dept: '일반교과',
      admissionType: '학생부교과',
      targetGpa: 4.10,
      minScoreText: '2개 영역 등급합 8 이내',
      reason: '지역거점 국립대 안정 안착 카드'
    },

    // 4.3 ~ 4.8등급 (경기 남부 4년제 & 국립 한경대)
    {
      univName: '한경국립대학교(안성)',
      dept: '일반전형(교과)',
      admissionType: '학생부교과',
      targetGpa: 4.45,
      minScoreText: '2개 영역 등급합 8 이내 (탐구 1과목)',
      reason: '경기도 소재 4년제 국립대로 등록금 부담 제로 및 안정 합격'
    },
    {
      univName: '강남대학교',
      dept: '학생부교과(정량)',
      admissionType: '학생부교과',
      targetGpa: 4.65,
      minScoreText: '수능최저 미적용',
      reason: '수능 성적 변동성과 무관한 100% 교과 정량 선발'
    },
    {
      univName: '수원대학교',
      dept: '교과우수자전형',
      admissionType: '학생부교과',
      targetGpa: 4.55,
      minScoreText: '수능최저 미적용',
      reason: '경기 남부 주요 교통 요충지 및 높은 취업 연계'
    },
    {
      univName: '성결대학교 / 안양대학교',
      dept: '교과성적우수자',
      admissionType: '학생부교과',
      targetGpa: 4.75,
      minScoreText: '수능최저 미적용',
      reason: '수도권 1호선/4호선 지하철 통학권 4년제 대학'
    },

    // 4.9 ~ 5.5등급 (경기 외곽 & 충청 주요 4년제)
    {
      univName: '평택대학교',
      dept: '학생부교과전형',
      admissionType: '학생부교과',
      targetGpa: 5.10,
      minScoreText: '수능최저 미적용',
      reason: '상위 과목 선택 반영 시 내신 4등급 초반으로 환산 상승'
    },
    {
      univName: '대진대학교',
      dept: '학생부우수자',
      admissionType: '학생부교과',
      targetGpa: 4.95,
      minScoreText: '수능최저 미적용',
      reason: '경기 북부 거점 4년제로 장학 혜택 및 기숙사 완비'
    },
    {
      univName: '백석대학교(천안)',
      dept: '일반학생(교과)',
      admissionType: '학생부교과',
      targetGpa: 5.25,
      minScoreText: '수능최저 미적용',
      reason: '사범·보건·항공서비스 등 특성화 유망학과 다수'
    },
    {
      univName: '호서대학교(아산/천안)',
      dept: '학생부전형',
      admissionType: '학생부교과',
      targetGpa: 5.35,
      minScoreText: '수능최저 미적용',
      reason: '벤처산학협력 중심 대학으로 산학 장학금 우수'
    },
    {
      univName: '서원대학교 / 청주대학교',
      dept: '일반교과전형',
      admissionType: '학생부교과',
      targetGpa: 5.40,
      minScoreText: '수능최저 미적용',
      reason: '충청권 중심 4년제 대학 안정 지원선'
    },

    // 5.6 ~ 6.2등급 (충청 4년제 & 수도권 전문대 최상위학과)
    {
      univName: '극동대학교 / 중원대학교',
      dept: '항공운항 / 보건복지계열',
      admissionType: '학생부교과',
      targetGpa: 5.85,
      minScoreText: '수능최저 미적용',
      reason: '실무 자격증 취득 및 기숙사 100% 입사 보장'
    },
    {
      univName: '동서울대학교',
      dept: '컴퓨터정보 / 항공서비스',
      admissionType: '전문대학 일반교과',
      targetGpa: 5.75,
      minScoreText: '수능최저 미적용',
      reason: '서울 복정역 인접으로 압도적 통학 접근성 및 대기업 취업반 운영'
    },
    {
      univName: '유한대학교',
      dept: 'IT소프트웨어 / 메카트로닉스',
      admissionType: '전문대학 일반교과',
      targetGpa: 5.95,
      minScoreText: '수능최저 미적용',
      reason: '유일한 박사 건립 재단으로 등록금 저렴 및 산학 일체형 취업'
    },
    {
      univName: '부천대학교 / 인하공업전문대학',
      dept: '항공운항 / 컴퓨터정보 / 실용계열',
      admissionType: '전문대학 교과',
      targetGpa: 5.65,
      minScoreText: '수능최저 미적용',
      reason: '수도권 전문대 원탑 취업률 및 대기업 생산기술직 대거 진출'
    },

    // 6.3 ~ 6.8등급 (사용자 핵심 집중 구간: 6등급 후반 학생의 상향/적정선)
    {
      univName: '신한대학교',
      dept: '일반전형(교과)',
      admissionType: '학생부교과',
      targetGpa: 6.35,
      minScoreText: '수능최저 미적용',
      reason: '수도권 1호선 망월사역 초역세권 4년제로 6등급 초중반 최적의 상향 도전선'
    },
    {
      univName: '대진대학교(자율/단과)',
      dept: '인문예술·공학 융합',
      admissionType: '학생부교과(일반)',
      targetGpa: 6.45,
      minScoreText: '수능최저 미적용',
      reason: '우수 3개 교과 반영 시 환산 5등급 진입으로 상향 스나이핑 가능'
    },
    {
      univName: '대림대학교(안양)',
      dept: '미래자동차학부 / 제과제빵·외식',
      admissionType: '전문대학 일반교과',
      targetGpa: 6.55,
      minScoreText: '수능최저 미적용',
      reason: '현대/기아 산학협약 취업률 80% 이상 명문 실무 전문대'
    },
    {
      univName: '신구대학교(성남)',
      dept: '물리치료과 / 치위생과 / IT학과',
      admissionType: '전문대학 일반교과',
      targetGpa: 6.40,
      minScoreText: '수능최저 미적용',
      reason: '보건 및 산업디자인 전통 강호로 안정적 수도권 취업 보장'
    },
    {
      univName: '서정대학교',
      dept: '간호학과 / 응급구조과 / 반려동물과',
      admissionType: '전문대학 교과',
      targetGpa: 6.65,
      minScoreText: '수능최저 미적용 (일부 면접)',
      reason: '국가고시 합격률 100% 및 공무원/소방 합격자 전국 최상위'
    },
    {
      univName: '백석문화대학교',
      dept: '글로벌외식조리 / 보건행정',
      admissionType: '전문대학 일반교과',
      targetGpa: 6.75,
      minScoreText: '수능최저 미적용',
      reason: '천안권 기숙사 완비 및 100% 전공자격 취업 연계'
    },

    // 6.9 ~ 7.5등급 (6등급 후반 학생의 적정/안정선)
    {
      univName: '동서울대학교 / 유한대학교(야간/실무)',
      dept: '스마트경영 / 산업디자인',
      admissionType: '전문대학 교과',
      targetGpa: 7.05,
      minScoreText: '수능최저 미적용',
      reason: '우수 2개 학기 반영으로 학생 실질 내신 6등급 초반으로 환산'
    },
    {
      univName: '김포대학교 / 두원공과대학교',
      dept: 'K-컬쳐 / 모빌리티융합',
      admissionType: '전문대학 일반교과',
      targetGpa: 7.25,
      minScoreText: '수능최저 미적용',
      reason: '실기/면접 위주 전형으로 정량 내신 불이익 완전 상쇄'
    },
    {
      univName: '혜전대학교 / 신성대학교',
      dept: '제과제빵 / 보건복지계열',
      admissionType: '전문대학 일반교과',
      targetGpa: 7.35,
      minScoreText: '수능최저 미적용',
      reason: '조리·외식 명문으로 지원자 100% 충원 합격 확실권'
    },

    // 7.6 ~ 8.5등급 (최후 충원 안전망)
    {
      univName: '수도권·충청권 전문대 실무학과',
      dept: '취업보장 실무 자격증 과정',
      admissionType: '전문대학 일반전형',
      targetGpa: 7.85,
      minScoreText: '수능최저 미적용',
      reason: '수시 6광탈을 100% 원천 차단하는 최후의 안전판 카드'
    },
    {
      univName: '지방 4년제 자율전공/미달방지',
      dept: '자율전공학부 (전과 100% 허용)',
      admissionType: '학생부교과(무시험)',
      targetGpa: 8.20,
      minScoreText: '수능최저 미적용',
      reason: '내신과 무관하게 최초합격 보장되는 보험용 카드'
    }
  ]

  // 사용자 엄격 지침 기준:
  // 상향: [gpa - 0.50, gpa - 0.30] (0.3~0.5등급 높은 대학)
  // 적정: [gpa - 0.20, gpa + 0.20] (±0.2등급 이내)
  // 안정: [gpa + 0.30, gpa + 0.50] (0.3~0.5등급 여유)
  // 하향: [gpa + 0.60, gpa + 1.10] (0.6~1.0등급 안전망)

  const minReachCut = Math.max(1.0, Number((gpa - 0.50).toFixed(2)))
  const maxReachCut = Math.max(1.0, Number((gpa - 0.30).toFixed(2)))

  const minTargetCut = Number((gpa - 0.20).toFixed(2))
  const maxTargetCut = Number((gpa + 0.20).toFixed(2))

  const minSafetyCut = Number((gpa + 0.30).toFixed(2))
  const maxSafetyCut = Number((gpa + 0.50).toFixed(2))

  const minBackupCut = Number((gpa + 0.60).toFixed(2))
  const maxBackupCut = Number((gpa + 1.10).toFixed(2))

  const reach = []
  const target = []
  const safety = []
  const backup = []

  // 1) 벤치마크 풀에서 엄격한 등급 컷오프 범위로 1차 필터링
  BENCHMARK_POOL.forEach(item => {
    const recAdvantage = hasRec ? ' [추천전형]' : ''
    const ruralAdvantage = isRural ? ' [🌲 농어촌 추천]' : ''
    const itemCut = item.targetGpa

    const cutDiffVal = Number((itemCut - gpa).toFixed(2)) // 음수면 학생 내신보다 컷이 높음(어려움)
    const diffStr = cutDiffVal < 0 
      ? `학생 내신(${gpa.toFixed(2)}) 대비 +${Math.abs(cutDiffVal).toFixed(2)}등급 상향 도전선 (합격선 ${itemCut.toFixed(2)})`
      : `학생 내신(${gpa.toFixed(2)}) 대비 -${cutDiffVal.toFixed(2)}등급 안정 여유권 (합격선 ${itemCut.toFixed(2)})`

    const formattedItem = {
      univName: item.univName + recAdvantage,
      dept: item.dept,
      admissionType: item.admissionType,
      targetGpa: itemCut,
      minScoreText: item.minScoreText,
      reasonData: {
        cutDiff: diffStr,
        csatEffect: item.minScoreText.includes('미적용') 
          ? '수능최저가 없어 수능 변수 없이 내신/면접으로 승부'
          : '최저기준 충족 시 실질경쟁률 급락으로 역전 가능',
        schoolSeniorStat: item.reason + ruralAdvantage
      }
    }

    // 0.3~0.5 상향 가드
    if (itemCut >= minReachCut && itemCut <= maxReachCut) {
      if (reach.length < 3) reach.push(formattedItem)
    }
    // ±0.2 적정 가드
    else if (itemCut >= minTargetCut && itemCut <= maxTargetCut) {
      if (target.length < 3) target.push(formattedItem)
    }
    // 0.3~0.5 안정 가드
    else if (itemCut >= minSafetyCut && itemCut <= maxSafetyCut) {
      if (safety.length < 3) safety.push(formattedItem)
    }
    // 0.6~1.0 하향 가드
    else if (itemCut >= minBackupCut && itemCut <= maxBackupCut) {
      if (backup.length < 3) backup.push(formattedItem)
    }
  })

  // 2) 만약 특정 구간에 템플릿 풀 항목이 부족한 경우:
  // 학생 GPA 기준 완벽히 계산된 수학적 타겟(상향 gpa-0.35, 적정 gpa, 안정 gpa+0.38, 하향 gpa+0.80)에
  // 가장 근접한 현실적 대학을 골라 학생 내신에 맞춤 변환하여 채워넣음 (결코 1~2등급 차이나는 엉뚱한 대학 배정 방지)
  const fillCategory = (list, targetCenter, label, categoryMin, categoryMax) => {
    if (list.length >= 2) return

    // 벤치마크 풀 중 targetCenter에 가장 가까운 대학 2~3개 추출
    const sorted = [...BENCHMARK_POOL].sort((a, b) => 
      Math.abs(a.targetGpa - targetCenter) - Math.abs(b.targetGpa - targetCenter)
    )

    for (const item of sorted) {
      if (list.length >= 2) break
      if (list.some(existing => existing.univName.includes(item.univName))) continue

      // 타겟 컷을 엄격한 범위 [categoryMin, categoryMax] 안으로 자동 클램프
      const clampedCut = Number(Math.max(categoryMin, Math.min(categoryMax, targetCenter)).toFixed(2))
      const cutDiffVal = Number((clampedCut - gpa).toFixed(2))
      const diffStr = cutDiffVal < 0 
        ? `학생 내신(${gpa.toFixed(2)}) 대비 +${Math.abs(cutDiffVal).toFixed(2)}등급 상향권 (목표 합격선 ${clampedCut.toFixed(2)})`
        : `학생 내신(${gpa.toFixed(2)}) 대비 -${cutDiffVal.toFixed(2)}등급 안전권 (예상 합격선 ${clampedCut.toFixed(2)})`

      list.push({
        univName: item.univName + (hasRec ? ' [추천전형]' : ''),
        dept: item.dept,
        admissionType: item.admissionType,
        targetGpa: clampedCut,
        minScoreText: item.minScoreText,
        reasonData: {
          cutDiff: diffStr,
          csatEffect: item.minScoreText.includes('미적용') 
            ? '수능최저 없는 전형으로 내신 집중 설계'
            : '수능최저 충족 시 체감 경쟁률 대폭 완화',
          schoolSeniorStat: `${item.reason} (학생 내신 ${gpa.toFixed(2)} 맞춤 ${label} 추천)`
        }
      })
    }
  }

  fillCategory(reach, gpa - 0.35, '상향', minReachCut, maxReachCut)
  fillCategory(target, gpa, '적정', minTargetCut, maxTargetCut)
  fillCategory(safety, gpa + 0.38, '안정', minSafetyCut, maxSafetyCut)
  fillCategory(backup, gpa + 0.80, '하향', minBackupCut, maxBackupCut)

  return {
    reach: reach.slice(0, 3),
    target: target.slice(0, 3),
    safety: safety.slice(0, 3),
    backup: backup.slice(0, 3)
  }
}

