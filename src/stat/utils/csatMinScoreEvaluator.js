/**
 * csatMinScoreEvaluator.js
 * 
 * 대교협 대입 원서접수 원자료(P열: 최저학력기준)의 다양한 수능최저 문장을 파싱하고,
 * 학생의 모의고사/수능 성적(국어, 수학, 영어, 탐구1, 탐구2, 한국사)과 대조하여
 * 최저학력기준 충족 여부를 정밀 판정하는 엔진입니다.
 */

// 한글 수사를 아라비아 숫자로 변환 헬퍼 (예: "두개" -> 2, "세개" -> 3)
function normalizeKoreanNumbers(str) {
  return str
    .replace(/한개/g, '1개')
    .replace(/두개/g, '2개')
    .replace(/세개/g, '3개')
    .replace(/네개/g, '4개')
}

/**
 * 1. P열 수능최저기준 문자열 파싱 함수
 * @param {string} rawReq P열 원문 텍스트
 * @param {string} studentField 학생의 계열('인문'|'자연' 등, 옵션)
 * @returns {object|null} 구조화된 수능최저 규칙 객체 (최저가 없으면 null)
 */
export function parseCsatRequirement(rawReq, studentField = '공통') {
  let cleaned = rawReq
    .replace(/^\s*\*\s*수능최저기준\s*:\s*/i, '')
    .replace(/\[공통\]|\[인문\]|\[자연\]/g, ' ')
    .replace(/영역등급/g, '영역 등급')
    .replace(/[\r\n]+/g, ' ')
    .trim()

  if (!cleaned || cleaned === '-' || cleaned === '미적용' || /^(?:수능최저(?:학력)?기준\s*)?(?:없음|미적용|-)$/.test(cleaned)) {
    return null
  }

  cleaned = normalizeKoreanNumbers(cleaned)

  // 계열 구분이 명시되어 있는 경우 (∙ 인문계열 등 불릿/구분자가 있는 복합 요강만 분기)
  if (/∙\s*인문계열/.test(rawReq) && /∙\s*자연계열/.test(rawReq)) {
    if (studentField && (studentField.includes('자연') || studentField.includes('이과'))) {
      const natPart = cleaned.match(/∙\s*자연계열.*$/)
      if (natPart) cleaned = natPart[0]
    } else {
      const humPart = cleaned.match(/∙\s*인문계열.*?(?=∙\s*자연계열|$)/)
      if (humPart) cleaned = humPart[0]
    }
  }

  // 1) 한국사 기준 추출
  let historyMaxGrade = null
  let historyRequired = false
  const histMatch = cleaned.match(/한국사\s*([1-9])\s*등급\s*(?:이내)?/i) || 
                    cleaned.match(/\[한국사\s*([1-9])\s*등급\]/i) ||
                    cleaned.match(/한국사\s*등급\s*([1-9])\s*이내/i)
  if (histMatch) {
    historyMaxGrade = parseInt(histMatch[1], 10)
    historyRequired = true
  } else if (/한국사\s*(?:응시\s*필수|필수응시|응시|필수)/.test(cleaned)) {
    historyRequired = true
  }

  // 2) 영어 단독 기준 / 특례 추출
  let englishMaxGrade = null
  let englishBonus12 = false
  const engSoloMatch = cleaned.match(/영어\s*([1-9])\s*등급\s*이내/i)
  if (engSoloMatch) {
    englishMaxGrade = parseInt(engSoloMatch[1], 10)
  }
  if (/영어\s*(?:영역\s*)?[1,ㆍ\s]*2등급[은을]\s*(?:모두\s*|통합하여\s*)?1등급/i.test(cleaned)) {
    englishBonus12 = true
  }

  // 3) 수학 선택과목 특례 (미적분/기하 감산/상향 등급)
  let mathBonus = 0
  const mathBonusMatch = cleaned.match(/수학[^\n]*(?:미적분|기하)[^\n]*([1-2])등급\s*(?:감산|상향)/i)
  if (mathBonusMatch) {
    mathBonus = parseInt(mathBonusMatch[1], 10)
  }

  // 4) 탐구 반영 방식 판정
  let inquiryMode = 'TOP1' // 기본값: 상위 1과목
  if (/2개?\s*과목\s*(?:평균|모두|합)/i.test(cleaned) || /탐구\s*(?:영역)?\s*2과목/i.test(cleaned)) {
    if (/소수점\s*(?:이하\s*)?버림|소수점\s*절사/i.test(cleaned)) {
      inquiryMode = 'AVG2_FLOOR'
    } else {
      inquiryMode = 'AVG2' // 소수점 그대로 반영
    }
  } else if (/상위\s*1개?\s*과목|1과목|1개과목|1개\s*과목|상위\s*1/i.test(cleaned)) {
    inquiryMode = 'TOP1'
  }

  const requireScience = /과학탐구만\s*반영|과탐\s*(?:1과목\s*)?필수/i.test(cleaned)

  // 5) 특정 영역 필수 포함 여부
  let requireKorean = /국어\s*(?:영역\s*)?포함/i.test(cleaned)
  let requireMath = /수학\s*(?:과목\s*가운데\s*수학을\s*포함|필수\s*포함|필수|포함)/i.test(cleaned)
  let requireKorOrMath = /국어[,\s]*수학\s*중\s*1개\s*(?:과목|영역)\s*을?\s*포함/i.test(cleaned)

  // 6) 각 영역 등급 기준 (예: "3개 영역 각 3등급 이내")
  const eachMatch = cleaned.match(/([1-4])\s*개\s*(?:영역|과목)\s*각\s*([1-9])\s*등급\s*이내/)
  if (eachMatch) {
    return {
      raw: cleaned,
      isValid: true,
      isEachRule: true,
      needCount: parseInt(eachMatch[1], 10),
      eachAreaMaxGrade: parseInt(eachMatch[2], 10),
      historyMaxGrade,
      historyRequired,
      englishMaxGrade,
      summary: `${eachMatch[1]}개 영역 각 ${eachMatch[2]}등급 이내`
    }
  }

  // 7) 반영 영역 수 및 등급합 추출
  let needCount = 2
  let targetSum = null

  // (1) "3합 12", "2합 7", "상위 등급 3합 9" 형태
  const simpleSumMatch = cleaned.match(/([1-4])\s*합\s*([0-9]{1,2})\s*(?:등급)?\s*(?:이내)?/)
  if (simpleSumMatch) {
    needCount = parseInt(simpleSumMatch[1], 10)
    targetSum = parseInt(simpleSumMatch[2], 10)
  }

  // (2) 종합 등급합 정규식:
  // "2개 영역 등급의 합이 8등급 이내", "2개 영역 등급 합 6 이내", "2개 등급 합 5", "3개 영역 등급의 합이 7 이내", "2개 영역 합 7등급"
  if (!targetSum) {
    const areaSumMatch = cleaned.match(/([1-4])\s*개\s*(?:영역|과목)?\s*(?:의)?\s*(?:등급)?\s*(?:의)?\s*합[이산\s]*([0-9]{1,2})\s*(?:등급)?\s*(?:이내)?/)
    if (areaSumMatch) {
      needCount = parseInt(areaSumMatch[1], 10)
      targetSum = parseInt(areaSumMatch[2], 10)
    }
  }

  // (3) "상위 [N]개 (영역|과목) ... 합 [M]"
  if (!targetSum) {
    const topAreaMatch = cleaned.match(/상위\s*([1-4])\s*개\s*(?:영역|과목)[^\d]*합[^\d]*([0-9]{1,2})/)
    if (topAreaMatch) {
      needCount = parseInt(topAreaMatch[1], 10)
      targetSum = parseInt(topAreaMatch[2], 10)
    }
  }

  // (4) "1개 영역 [M]등급 이내", "1개 영역 등급 [M]이내"
  if (!targetSum) {
    const singleMatch = cleaned.match(/([1-4])\s*개\s*영역\s*(?:등급)?\s*([1-9])\s*(?:등급)?\s*이내/)
    if (singleMatch) {
      needCount = parseInt(singleMatch[1], 10)
      targetSum = parseInt(singleMatch[2], 10)
    }
  }

  // (5) "우수 1개 영역 [M]등급 이내"
  if (!targetSum) {
    const bestSingleMatch = cleaned.match(/우수\s*1\s*개\s*영역\s*([1-9])\s*등급/)
    if (bestSingleMatch) {
      needCount = 1
      targetSum = parseInt(bestSingleMatch[1], 10)
    }
  }

  // (6) "합산 [M]등급 이내", "합 [M]등급 이내"
  if (!targetSum) {
    const totalMatch = cleaned.match(/(?:합산|합)\s*([0-9]{1,2})\s*등급\s*이내/)
    if (totalMatch) {
      targetSum = parseInt(totalMatch[1], 10)
      const countMatch = cleaned.match(/([1-4])\s*개\s*(?:영역|과목)/)
      if (countMatch) needCount = parseInt(countMatch[1], 10)
    }
  }

  // (7) "[N]개의 등급 합이 [M]"
  if (!targetSum) {
    const altMatch = cleaned.match(/([1-4])\s*개의\s*등급\s*합이\s*([0-9]{1,2})/)
    if (altMatch) {
      needCount = parseInt(altMatch[1], 10)
      targetSum = parseInt(altMatch[2], 10)
    }
  }

  // (8) 4개 영역 등급의 합이 8 이내 (needCount: 4)
  if (!targetSum) {
    const fourAreaMatch = cleaned.match(/4개\s*영역\s*등급의\s*합이\s*([0-9]{1,2})\s*(?:등급)?\s*이내/)
    if (fourAreaMatch) {
      needCount = 4
      targetSum = parseInt(fourAreaMatch[1], 10)
    }
  }

  // (9) "3개 영역 등급 합이 ... 5등급 이내"
  if (!targetSum) {
    const branchedMatch = cleaned.match(/3개\s*영역\s*등급\s*합이[^\d]*([0-9]{1,2})\s*등급\s*이내/)
    if (branchedMatch) {
      needCount = 3
      targetSum = parseInt(branchedMatch[1], 10)
    }
  }

  if (!targetSum) {
    return {
      raw: cleaned,
      isValid: false,
      summary: cleaned
    }
  }

  let summary = `${needCount}개 영역 합 ${targetSum}등급 이내`
  if (historyMaxGrade) summary += ` (한국사 ${historyMaxGrade}등급)`
  if (requireKorean) summary += ` (국어 필수)`
  if (requireMath) summary += ` (수학 필수)`

  return {
    raw: cleaned,
    isValid: true,
    isEachRule: false,
    needCount,
    targetSum,
    inquiryMode,
    requireScience,
    requireKorean,
    requireMath,
    requireKorOrMath,
    historyMaxGrade,
    historyRequired,
    englishMaxGrade,
    englishBonus12,
    mathBonus,
    summary
  }
}

/**
 * 2. 학생의 단일 회차 모의고사 성적으로 수능최저 충족 여부 판정
 */
export function evaluateCsatRequirement(parsedRule, examRecord) {
  if (!parsedRule || !parsedRule.isValid || !examRecord) {
    return { evaluated: false, isSatisfied: false, detailText: '최저기준 없음 또는 판정 불가' }
  }

  const failReasons = []

  // 1. 한국사 요건 확인
  const hist = Number(examRecord.histGrade)
  if (parsedRule.historyMaxGrade) {
    if (!hist || isNaN(hist)) {
      failReasons.push(`한국사 누락`)
    } else if (hist > parsedRule.historyMaxGrade) {
      failReasons.push(`한국사 ${hist}등급 (기준: ${parsedRule.historyMaxGrade}등급 이내)`)
    }
  } else if (parsedRule.historyRequired && (!hist || isNaN(hist))) {
    failReasons.push(`한국사 미응시`)
  }

  // 2. 영어 단독 요건 확인
  const eng = Number(examRecord.engGrade)
  if (parsedRule.englishMaxGrade) {
    if (!eng || isNaN(eng)) {
      failReasons.push(`영어 성적 누락`)
    } else if (eng > parsedRule.englishMaxGrade) {
      failReasons.push(`영어 ${eng}등급 (기준: ${parsedRule.englishMaxGrade}등급 이내)`)
    }
  }

  // 3. 각 영역별 반영 등급 준비
  const availableAreas = []

  // (1) 국어
  const kor = Number(examRecord.korGrade)
  if (kor && !isNaN(kor) && kor >= 1 && kor <= 9) {
    availableAreas.push({ key: 'KOR', name: '국어', shortName: '국', grade: kor, rawGrade: kor })
  }

  // (2) 수학 (미적/기하 보정 적용)
  let math = Number(examRecord.mathGrade)
  if (math && !isNaN(math) && math >= 1 && math <= 9) {
    let effectiveMath = math
    const isNaturalMath = ['미적분', '미적', '기하'].some(s => String(examRecord.mathSubject || '').includes(s))
    if (parsedRule.mathBonus > 0 && isNaturalMath) {
      effectiveMath = Math.max(1, math - parsedRule.mathBonus)
    }
    availableAreas.push({ 
      key: 'MATH', 
      name: '수학', 
      shortName: '수', 
      grade: effectiveMath, 
      rawGrade: math,
      isBonusApplied: effectiveMath !== math 
    })
  }

  // (3) 영어 (1,2등급 동일 반영 보정 적용)
  if (eng && !isNaN(eng) && eng >= 1 && eng <= 9) {
    let effectiveEng = eng
    if (parsedRule.englishBonus12 && eng === 2) {
      effectiveEng = 1
    }
    availableAreas.push({ 
      key: 'ENG', 
      name: '영어', 
      shortName: '영', 
      grade: effectiveEng, 
      rawGrade: eng,
      isBonusApplied: effectiveEng !== eng 
    })
  }

  // (4) 탐구 영역 계산
  const inq1 = Number(examRecord.inq1Grade)
  const inq2 = Number(examRecord.inq2Grade)
  const validInq1 = inq1 && !isNaN(inq1) && inq1 >= 1 && inq1 <= 9
  const validInq2 = inq2 && !isNaN(inq2) && inq2 >= 1 && inq2 <= 9

  let finalInqGrade = null
  let inqDetailName = '탐구'

  if (validInq1 && validInq2) {
    if (parsedRule.inquiryMode === 'AVG2') {
      finalInqGrade = (inq1 + inq2) / 2
      inqDetailName = `탐(${finalInqGrade})`
    } else if (parsedRule.inquiryMode === 'AVG2_FLOOR') {
      finalInqGrade = Math.floor((inq1 + inq2) / 2)
      inqDetailName = `탐(절사${finalInqGrade})`
    } else {
      finalInqGrade = Math.min(inq1, inq2)
      inqDetailName = `탐(${finalInqGrade})`
    }
  } else if (validInq1) {
    finalInqGrade = inq1
    inqDetailName = `탐(${inq1})`
  } else if (validInq2) {
    finalInqGrade = inq2
    inqDetailName = `탐(${inq2})`
  }

  if (finalInqGrade !== null) {
    availableAreas.push({ 
      key: 'INQ', 
      name: '탐구', 
      shortName: '탐', 
      grade: finalInqGrade, 
      rawGrade: finalInqGrade,
      detailName: inqDetailName 
    })
  }

  const needCount = parsedRule.needCount || 2

  // 특수 케이스: "각 N등급 이내" 규칙인 경우
  if (parsedRule.isEachRule) {
    if (availableAreas.length === 0) {
      return {
        evaluated: true,
        status: 'NO_SCORE',
        isSatisfied: false,
        examName: examRecord.examName || '모의고사',
        targetSum: null,
        needCount,
        achievedSum: null,
        gap: null,
        usedSubjects: [],
        failReasons: ['모의고사 성적 미입력'],
        detailText: '성적 데이터 없음',
        summaryRule: parsedRule.summary
      }
    }
    const qualified = availableAreas.filter(a => a.grade <= parsedRule.eachAreaMaxGrade)
    const isSatisfied = qualified.length >= needCount && failReasons.length === 0
    const detail = qualified.slice(0, needCount).map(c => `${c.shortName}(${c.grade})`).join(', ')
    return {
      evaluated: true,
      status: isSatisfied ? 'SATISFIED' : (availableAreas.length < needCount ? 'INSUFFICIENT' : 'UNSATISFIED'),
      isSatisfied,
      examName: examRecord.examName || '모의고사',
      targetSum: null,
      needCount,
      achievedSum: null,
      gap: isSatisfied ? 0 : 1,
      usedSubjects: qualified.slice(0, needCount),
      failReasons,
      detailText: isSatisfied 
        ? `${detail} 각 ${parsedRule.eachAreaMaxGrade}등급 충족` 
        : `각 ${parsedRule.eachAreaMaxGrade}등급 이내 영역 부족 (${qualified.length}/${needCount})`,
      summaryRule: parsedRule.summary
    }
  }

  // 성적이 아예 없는 경우
  if (availableAreas.length === 0) {
    return {
      evaluated: true,
      status: 'NO_SCORE',
      isSatisfied: false,
      examName: examRecord.examName || '모의고사',
      targetSum: parsedRule.targetSum,
      needCount,
      achievedSum: null,
      gap: null,
      usedSubjects: [],
      failReasons: ['모의고사 성적 미입력'],
      detailText: '성적 데이터 없음 (미응시)',
      summaryRule: parsedRule.summary
    }
  }

  // 영역 수가 기준 필요 개수보다 적은 경우
  if (availableAreas.length < needCount) {
    failReasons.push(`응시 영역 부족 (${availableAreas.length}개 / 최소 ${needCount}개 필요)`)
    const subjectsSummary = availableAreas.map(c => `${c.shortName}(${c.grade})`).join(', ')
    return {
      evaluated: true,
      status: 'INSUFFICIENT',
      isSatisfied: false,
      examName: examRecord.examName || '모의고사',
      targetSum: parsedRule.targetSum,
      needCount,
      achievedSum: null,
      gap: null,
      usedSubjects: availableAreas,
      failReasons,
      detailText: `응시 과목 부족: ${subjectsSummary} (최소 ${needCount}개 영역 필요)`,
      summaryRule: parsedRule.summary
    }
  }

  // 4. 최우수 영역 조합 선택 (availableAreas.length >= needCount)
  let bestCombination = null
  let bestSum = Infinity

  function combine(arr, k) {
    if (k === 1) return arr.map(el => [el])
    const result = []
    arr.forEach((item, index) => {
      const rest = arr.slice(index + 1)
      const combos = combine(rest, k - 1)
      combos.forEach(c => result.push([item, ...c]))
    })
    return result
  }

  const combinations = combine(availableAreas, needCount)

  for (const combo of combinations) {
    if (parsedRule.requireKorean && !combo.some(c => c.key === 'KOR')) continue
    if (parsedRule.requireMath && !combo.some(c => c.key === 'MATH')) continue
    if (parsedRule.requireKorOrMath && !combo.some(c => c.key === 'KOR' || c.key === 'MATH')) continue

    const sum = combo.reduce((acc, c) => acc + c.grade, 0)
    if (sum < bestSum) {
      bestSum = sum
      bestCombination = combo
    }
  }

  if (!bestCombination && combinations.length > 0) {
    if (parsedRule.requireKorean) failReasons.push('국어 필수 조건 미충족')
    if (parsedRule.requireMath) failReasons.push('수학 필수 조건 미충족')
    if (parsedRule.requireKorOrMath) failReasons.push('국어/수학 포함 조건 미충족')
    bestCombination = combinations.sort((a, b) => {
      const sumA = a.reduce((acc, c) => acc + c.grade, 0)
      const sumB = b.reduce((acc, c) => acc + c.grade, 0)
      return sumA - sumB
    })[0]
    bestSum = bestCombination ? bestCombination.reduce((acc, c) => acc + c.grade, 0) : null
  }

  const targetSum = parsedRule.targetSum
  const hasBest = bestCombination && bestSum !== null && bestSum !== Infinity
  const isSumSatisfied = hasBest && targetSum ? bestSum <= targetSum : false

  if (hasBest && !isSumSatisfied && targetSum) {
    failReasons.push(`합산 ${bestSum} (기준: ${targetSum} 이내, ${bestSum - targetSum}등급 부족)`)
  }

  const isSatisfied = failReasons.length === 0 && isSumSatisfied

  let detailText = ''
  if (hasBest) {
    const formula = bestCombination.map(c => `${c.shortName}(${c.grade})`).join(' + ')
    detailText = `${formula} = ${bestSum} (기준: ${needCount}합 ${targetSum})`
  } else {
    detailText = `성적 불충분 (${failReasons.join(', ')})`
  }

  return {
    evaluated: true,
    status: isSatisfied ? 'SATISFIED' : 'UNSATISFIED',
    isSatisfied,
    examName: examRecord.examName || '모의고사',
    targetSum,
    needCount,
    achievedSum: hasBest ? bestSum : null,
    gap: (hasBest && targetSum) ? bestSum - targetSum : null,
    usedSubjects: bestCombination || [],
    failReasons,
    detailText,
    summaryRule: parsedRule.summary
  }
}

/**
 * 3. 예비 고3 및 대입 수능최저 상담을 위한 목표 등급선 및 향상 가이드 분석기
 * @param {string} rawReq 수능최저 문장
 * @param {object|null} examRecord 모의고사/가상 성적 객체 { korGrade, mathGrade, engGrade, inq1Grade, inq2Grade, histGrade }
 * @param {string} studentField 계열 ('인문' | '자연' 등)
 * @returns {object} 목표 진단 및 상담 가이드 정보
 */
export function analyzeCsatTargetRequirement(rawReq, examRecord = null, studentField = '공통') {
  const parsed = parseCsatRequirement(rawReq, studentField)

  // 최저가 없는 경우
  if (!parsed) {
    return {
      hasRequirement: false,
      isSatisfied: true,
      statusBadge: '최저없음',
      badgeColor: 'gray',
      rawReq: rawReq || '최저없음',
      targetGuideline: '수능최저학력기준 없음 (수능 성적 미반영)',
      coachingNotes: ['수능 최저기준이 없는 전형으로, 학생부/면접/논술 자체 평가에 집중할 수 있습니다.'],
      scenarios: []
    }
  }

  // 기준 일반 요약 및 성적 미입력 시 평균 요구 등급 가이드
  let guidelineText = ''
  if (parsed.targetSum && parsed.needCount) {
    const avg = (parsed.targetSum / parsed.needCount).toFixed(1)
    guidelineText = `${parsed.needCount}개 영역 합 ${parsed.targetSum} 이내 (반영 영역 평균 ${avg}등급 이내 권장)`
  } else if (parsed.eachMaxGrade && parsed.eachCount) {
    guidelineText = `${parsed.eachCount}개 영역 각 ${parsed.eachMaxGrade}등급 이내`
  } else {
    guidelineText = parsed.summary || rawReq
  }

  // 학생 성적이 주어진 경우 정밀 대조 및 갭 분석
  if (examRecord && (examRecord.korGrade || examRecord.mathGrade || examRecord.engGrade || examRecord.inq1Grade)) {
    const evalResult = evaluateCsatRequirement(parsed, examRecord)
    
    if (evalResult.isSatisfied) {
      return {
        hasRequirement: true,
        isSatisfied: true,
        statusBadge: '충족완료',
        badgeColor: 'emerald',
        gap: 0,
        rawReq,
        ruleSummary: parsed.summary,
        targetGuideline: guidelineText,
        achievedSum: evalResult.achievedSum,
        targetSum: evalResult.targetSum,
        detailText: evalResult.detailText,
        coachingNotes: [
          `현재 모의고사 성적으로 충족하고 있습니다 (${evalResult.detailText}).`,
          `실제 수능까지 현 등급대를 유지할 수 있도록 안정적인 학습 리듬을 유지하세요.`
        ],
        scenarios: []
      }
    }

    // 불충족 시 갭 및 향상 시나리오 분석
    const gap = evalResult.gap || 1
    const badgeText = gap <= 1 ? '1등급 부족' : `${gap}등급 부족`
    const badgeColor = gap <= 1 ? 'amber' : 'rose'

    const scenarios = []
    const notes = []

    // 반영 대상 과목 중 향상 가능한 과목 탐색
    const candidates = []
    if (examRecord.korGrade && examRecord.korGrade > 1) {
      candidates.push({ subject: '국어', current: examRecord.korGrade, maxGain: examRecord.korGrade - 1 })
    }
    if (examRecord.mathGrade && examRecord.mathGrade > 1) {
      candidates.push({ subject: '수학', current: examRecord.mathGrade, maxGain: examRecord.mathGrade - 1 })
    }
    if (examRecord.engGrade && examRecord.engGrade > 1) {
      candidates.push({ subject: '영어', current: examRecord.engGrade, maxGain: examRecord.engGrade - 1 })
    }
    if (examRecord.inq1Grade && examRecord.inq1Grade > 1) {
      candidates.push({ subject: '탐구1', current: examRecord.inq1Grade, maxGain: examRecord.inq1Grade - 1 })
    }
    if (examRecord.inq2Grade && examRecord.inq2Grade > 1) {
      candidates.push({ subject: '탐구2', current: examRecord.inq2Grade, maxGain: examRecord.inq2Grade - 1 })
    }

    // 단일 과목 상향으로 충족 가능한 케이스
    candidates.forEach(c => {
      if (c.maxGain >= gap) {
        const targetGrade = c.current - gap
        scenarios.push(`${c.subject} 영역: ${c.current}등급 ➔ ${targetGrade}등급 달성 시 단독 충족 가능`)
      }
    })

    if (scenarios.length === 0 && candidates.length >= 2) {
      scenarios.push(`2개 이상 영역에서 총 ${gap}등급 합산 상향 필요 (예: ${candidates[0].subject} 1등급 + ${candidates[1].subject} ${Math.max(1, gap - 1)}등급)`)
    }

    notes.push(`현재 성적: ${evalResult.detailText}`)
    notes.push(`최저 기준 달성을 위해 총 ${gap}등급 상향이 필요합니다.`)

    return {
      hasRequirement: true,
      isSatisfied: false,
      statusBadge: badgeText,
      badgeColor,
      gap,
      rawReq,
      ruleSummary: parsed.summary,
      targetGuideline: guidelineText,
      achievedSum: evalResult.achievedSum,
      targetSum: evalResult.targetSum,
      failReasons: evalResult.failReasons,
      detailText: evalResult.detailText,
      coachingNotes: notes,
      scenarios
    }
  }

  // 성적이 아직 없는 예비 고3의 목표 제시용
  return {
    hasRequirement: true,
    isSatisfied: false,
    statusBadge: '목표설정 필요',
    badgeColor: 'blue',
    gap: null,
    rawReq,
    ruleSummary: parsed.summary,
    targetGuideline: guidelineText,
    coachingNotes: [
      `이 전형에 지원하기 위해서는 ${guidelineText}을(를) 달성해야 합니다.`,
      `학생의 강점 영역(국/수/영/탐) 중 최소 ${parsed.needCount || 2}개 영역을 집중 공략하는 학습 전략이 필요합니다.`
    ],
    scenarios: []
  }
}
