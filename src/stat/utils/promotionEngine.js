/**
 * 진급명렬 기반 학생 매칭 및 학적/성적 이관 엔진
 * 
 * 구글 시트 '진급명렬' 탭 구조:
 * A: 학년도 (예: 2026)
 * B: 학년   (예: 2)
 * C: 반     (예: 1)
 * D: 번호   (예: 5)
 * E: 이름   (예: 김나연)
 * F: 신학년도 (예: 2027)
 * G: 신학년 (예: 3)
 * H: 신반   (예: 2)
 * I: 신번호 (예: 7)
 * J: 이름   (예: 김나연)
 */

/**
 * 진급명렬 원본 행 목록으로부터 양방향 매핑 인덱스 빌드
 * @param {Array} rawPromotionRows 
 * @returns {{ oldKeyToNew: Map, newKeyToOld: Map, promotionList: Array }}
 */
export function buildPromotionIndex(rawPromotionRows = []) {
  const oldKeyToNew = new Map()
  const newKeyToOld = new Map()
  const promotionList = []

  if (!Array.isArray(rawPromotionRows)) {
    return { oldKeyToNew, newKeyToOld, promotionList }
  }

  for (const row of rawPromotionRows) {
    if (!row) continue

    const prevYear = String(row.prevYear || row['학년도'] || '').trim()
    const prevGrade = Number(row.prevGrade || row['학년']) || 2
    const prevClass = String(row.prevClass || row['반'] || '').trim()
    const prevNum = Number(row.prevNum || row['번호']) || 0
    
    // E열 '이름'과 J열 '신이름' 처리 (개명자 지원)
    const oldName = String(row.name || row['이전이름'] || row['이름'] || '').trim()
    const newName = String(row.newName || row['신이름'] || row['새이름'] || oldName).trim()
    const name = oldName || newName

    const newYear = String(row.newYear || row['신학년도'] || '').trim()
    const newGrade = Number(row.newGrade || row['신학년']) || 3
    const newClass = String(row.newClass || row['신반'] || '').trim()
    const newNum = Number(row.newNum || row['신번호']) || 0

    if (!name || !prevClass || !newClass) continue

    // 표준 고유 식별자 키
    // 1) 반-번호_이름
    const oldStudentKey = `${prevClass}-${prevNum}_${oldName}`
    const newStudentKey = `${newClass}-${newNum}_${newName}`

    // 2) 학년-반-번호_이름 (전체 유니크)
    const oldFullKey = `${prevGrade}-${prevClass}-${prevNum}_${oldName}`
    const newFullKey = `${newGrade}-${newClass}-${newNum}_${newName}`

    const item = {
      prevYear,
      prevGrade,
      prevClass,
      prevNum,
      name,
      newYear,
      newGrade,
      newClass,
      newNum,
      oldStudentKey,
      newStudentKey,
      oldFullKey,
      newFullKey
    }

    promotionList.push(item)

    // 인덱스 등록
    oldKeyToNew.set(oldStudentKey, item)
    oldKeyToNew.set(oldFullKey, item)

    newKeyToOld.set(newStudentKey, item)
    newKeyToOld.set(newFullKey, item)
  }

  return {
    oldKeyToNew,
    newKeyToOld,
    promotionList
  }
}

/**
 * 신학년도(2028 대입 등) 모드에서 이전 학년도 모의고사 성적을 진급된 신학번으로 이관 매핑
 * @param {Array} previousMockRecords 이전 학년도 모의고사 기록 배열
 * @param {Map} newKeyToOld 신학번 -> 이전학번 역방향 매핑 인덱스
 * @param {Map} oldKeyToNew 이전학번 -> 신학번 정방향 매핑 인덱스
 * @returns {Array} 진급 후 신학번으로 보정/연계된 모의고사 레코드 배열
 */
export function mapMockRecordsToPromotedStudents(previousMockRecords = [], oldKeyToNew = new Map()) {
  if (!Array.isArray(previousMockRecords) || oldKeyToNew.size === 0) {
    return previousMockRecords
  }

  return previousMockRecords.map(record => {
    const key = record.studentKey // 예: '1-5_김나연'
    const fullKey = `${record.grade || 2}-${record.classNum}-${record.studentNum}_${record.name}`

    const promoInfo = oldKeyToNew.get(key) || oldKeyToNew.get(fullKey)
    if (!promoInfo) {
      return record
    }

    // 진급 정보가 존재하는 경우 신학번과 신학년 정보를 보완/연결
    return {
      ...record,
      originalGrade: record.grade,
      originalClassNum: record.classNum,
      originalStudentNum: record.studentNum,
      originalStudentKey: record.studentKey,
      // 진급된 신학번으로 프로젝션
      grade: promoInfo.newGrade,
      classNum: promoInfo.newClass,
      studentNum: promoInfo.newNum,
      studentKey: promoInfo.newStudentKey,
      isPromotedRecord: true,
      promotionMeta: promoInfo
    }
  })
}

/**
 * 진급명렬 유효성 검사 및 통계 진단
 * - 중복 신학번(동일 반/번호 충돌) 검출
 * - 미진급 학생(자퇴/전출 등) 검출
 */
export function validatePromotionData(promotionList = []) {
  const duplicateNewKeys = []
  const seenNewKeys = new Set()

  for (const item of promotionList) {
    const key = `${item.newGrade}-${item.newClass}-${item.newNum}`
    if (seenNewKeys.has(key)) {
      duplicateNewKeys.push({ key, name: item.name })
    } else {
      seenNewKeys.add(key)
    }
  }

  return {
    isValid: duplicateNewKeys.length === 0,
    totalCount: promotionList.length,
    duplicateNewKeys,
    warningMessage: duplicateNewKeys.length > 0 
      ? `신학번에 중복된 번호가 ${duplicateNewKeys.length}건 발견되었습니다.` 
      : null
  }
}

