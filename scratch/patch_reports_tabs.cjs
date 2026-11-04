const fs = require('fs');

// ── 1. src/utils/recommendationKcueAdapter.js ───────────────────────────────
let rka = fs.readFileSync('src/utils/recommendationKcueAdapter.js', 'utf8');

const targetAbItem = `        kcueAbandonedList.push({
          id: \`kcue_ab_\${ap.id}\`,
          student_id: ap.student_id,
          student_code: code,
          name: ap.name,
          grade_type: isGrad ? '졸업생' : '재학생',`;

const replacementAbItem = `        let cNo = stInfo.class_no || ap.class_no;
        if (!cNo && code.length >= 5 && !isGrad) {
          const parsed = parseInt(code.substring(1, 3), 10);
          if (!isNaN(parsed) && parsed > 0) cNo = parsed;
        }

        kcueAbandonedList.push({
          id: \`kcue_ab_\${ap.id}\`,
          student_id: ap.student_id,
          student_code: code,
          class_no: isGrad ? null : cNo,
          is_graduated: isGrad,
          name: ap.name,
          grade_type: isGrad ? '졸업생' : '재학생',`;

if (rka.includes(targetAbItem)) {
  rka = rka.replace(targetAbItem, replacementAbItem);
  fs.writeFileSync('src/utils/recommendationKcueAdapter.js', rka, 'utf8');
  console.log('recommendationKcueAdapter.js patched successfully');
} else {
  console.log('targetAbItem not found in recommendationKcueAdapter.js');
}

// ── 2. src/components/teacher/ResultsTab.vue ────────────────────────────────
let rest = fs.readFileSync('src/components/teacher/ResultsTab.vue', 'utf8');

const targetTeacherBanner = `            <span class="px-2 py-0.5 rounded-full text-[11px] bg-blue-100 text-blue-900 border border-blue-200 font-bold">
              대입 학년도 종료일(2027.02.28)까지 상시 조회·인쇄 지원
            </span>
          </h4>
          <p class="text-xs text-emerald-900 m-0 mt-1 leading-relaxed">
            현재 2027 학교장 추천 선발은 모두 종료되었으나, 이번 대입 학년도가 종료될 때까지 교사가 우리 반 학생들의 추천 결과를 상시 확인하고 결과 보고서를 출력할 수 있도록 확정 원장 데이터를 제공합니다.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="text-xs font-bold text-emerald-800 bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-200">
          2027 대입 원장 연동
        </span>
      </div>`;

const replacementTeacherBanner = `          </h4>
        </div>
      </div>`;

if (rest.includes(targetTeacherBanner)) {
  rest = rest.replace(targetTeacherBanner, replacementTeacherBanner);
  fs.writeFileSync('src/components/teacher/ResultsTab.vue', rest, 'utf8');
  console.log('ResultsTab.vue patched successfully');
} else {
  console.log('targetTeacherBanner not found in ResultsTab.vue');
}

// ── 3. src/components/admin/ReportsTab.vue ──────────────────────────────────
let rep = fs.readFileSync('src/components/admin/ReportsTab.vue', 'utf8');

// 3-1. Banner texts removal
const targetAdminBanner = `              <span class="px-2 py-0.5 rounded-full text-[11px] bg-blue-100 text-blue-900 border border-blue-200 font-bold">
                대입 학년도 종료일(2027.02.28)까지 상시 조회·인쇄 지원
              </span>
            </h4>
            <p class="text-xs text-emerald-900 m-0 mt-1 leading-relaxed">
              현재 2027 학교장 추천 선발은 모두 종료되었으나, 이번 대입 학년도가 종료될 때까지 교사 및 관리자가 추천 명단 조회, 실시간 검색, 추천 대장 인쇄 및 엑셀 출력을 정상 이용할 수 있도록 확정 원장 데이터를 제공합니다.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-xs font-bold text-emerald-800 bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-200">
            2027 대입 원장 연동
          </span>
        </div>`;

const replacementAdminBanner = `            </h4>
          </div>
        </div>`;

if (rep.includes(targetAdminBanner)) {
  rep = rep.replace(targetAdminBanner, replacementAdminBanner);
} else {
  console.log('targetAdminBanner not found in ReportsTab.vue');
}

// 3-2. Empty state check
const targetEmptyState = `<div v-if="!flatStats || flatStats.length === 0" class="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
            <p class="text-base font-bold text-slate-600 mb-1">등록된 정원 현황 및 추천 학생 데이터가 없습니다.</p>
            <p class="text-xs">대학 정원 설정 및 학생 지원을 진행한 후 다시 확인해 주세요.</p>
          </div>`;

const replacementEmptyState = `<div v-if="!displayedStats || displayedStats.length === 0" class="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
            <p class="text-base font-bold text-slate-600 mb-1">
              {{ filterClass !== 'all' ? \`\${filterClass === 'grad' ? '졸업생' : filterClass + '반'}에 해당하는 추천 학생 데이터가 없습니다.\` : '등록된 정원 현황 및 추천 학생 데이터가 없습니다.' }}
            </p>
            <p class="text-xs">
              {{ filterClass !== 'all' ? '다른 학급을 선택하거나 전체를 선택해 주세요.' : '대학 정원 설정 및 학생 지원을 진행한 후 다시 확인해 주세요.' }}
            </p>
          </div>`;

if (rep.includes(targetEmptyState)) {
  rep = rep.replace(targetEmptyState, replacementEmptyState);
}

// 3-3. classNumbers definition
const targetClassNum = `const classNumbers = Array.from({ length: 11 }, (_, i) => i + 1)`;
const replacementClassNum = `const maxClassCount = computed(() => Number(localStorage.getItem('pcm_class_count')) || 11)
const classNumbers = computed(() => Array.from({ length: maxClassCount.value }, (_, i) => i + 1))`;

if (rep.includes(targetClassNum)) {
  rep = rep.replace(targetClassNum, replacementClassNum);
}

// 3-4. filteredAbandonedList with filterClass & searchQuery
const targetFilteredAbandoned = `const filteredAbandonedList = computed(() => {
  const curRound = selectedRoundFilter.value === 'all' ? null : Number(selectedRoundFilter.value)
  if (curRound === null || isNaN(curRound)) return abandonedList.value
  return abandonedList.value.filter(item => (item.abandoned_round != null ? item.abandoned_round : item.round) === curRound)
})`;

const replacementFilteredAbandoned = `const filteredAbandonedList = computed(() => {
  const curRound = selectedRoundFilter.value === 'all' ? null : Number(selectedRoundFilter.value)
  let list = abandonedList.value

  // 1. 차수 필터
  if (curRound !== null && !isNaN(curRound)) {
    list = list.filter(item => (item.abandoned_round != null ? item.abandoned_round : item.round) === curRound)
  }

  // 2. 학급 필터
  if (filterClass.value && filterClass.value !== 'all') {
    if (filterClass.value === 'grad') {
      list = list.filter(item => item.grade_type === '졸업생' || item.is_graduated)
    } else {
      const targetClass = Number(filterClass.value)
      list = list.filter(item => {
        if (item.grade_type === '졸업생' || item.is_graduated) return false
        const code = String(item.student_code || item.raw_app?.student_code || '')
        let c = item.class_no ?? item.raw_student?.class_no
        if (c == null && code.length >= 5) {
          const parsed = parseInt(code.substring(1, 3), 10)
          if (!isNaN(parsed) && parsed > 0) c = parsed
        }
        return c === targetClass
      })
    }
  }

  // 3. 검색어 필터
  const q = (searchQuery.value || '').trim().toLowerCase()
  if (q) {
    list = list.filter(item => {
      const uMatch = (item.univ_name || '').toLowerCase().includes(q)
      const tMatch = (item.track_name || '').toLowerCase().includes(q)
      const dMatch = (item.department_name || '').toLowerCase().includes(q)
      const nMatch = (item.name || '').toLowerCase().includes(q)
      const cMatch = (item.student_code || '').toLowerCase().includes(q)
      const rMatch = (item.reason || '').toLowerCase().includes(q)
      return uMatch || tMatch || dMatch || nMatch || cMatch || rMatch
    })
  }

  return list
})`;

if (rep.includes(targetFilteredAbandoned)) {
  rep = rep.replace(targetFilteredAbandoned, replacementFilteredAbandoned);
}

// 3-5. student item in studentsArray: attach is_graduated & class_no
const targetStudentMapInFlatStats = `        return {
          id: ap.id,
          student_id: ap.student_id,
          student_code: displayCode,
          raw_student_code: rawCode,
          name: ap.name,
          rank: ap.rank,
          score_text: ap.score_text,
          round: appRound,
          recommended_round: recRound,
          is_recommended: !!ap.is_recommended,
          grade_type: isGrad ? '졸업생' : '재학생',
          suffix: hasQuota ? \`(\${ap.rank}위, \${ap.score_text})\` : ''
        }`;

const replacementStudentMapInFlatStats = `        let stdClass = stInfo.class_no != null ? Number(stInfo.class_no) : (ap.class_no != null ? Number(ap.class_no) : null)
        if (!stdClass && rawCode.length >= 5 && !isGrad) {
          const parsed = parseInt(rawCode.substring(1, 3), 10)
          if (!isNaN(parsed) && parsed > 0) stdClass = parsed
        }
        return {
          id: ap.id,
          student_id: ap.student_id,
          student_code: displayCode,
          raw_student_code: rawCode,
          name: ap.name,
          rank: ap.rank,
          score_text: ap.score_text,
          round: appRound,
          recommended_round: recRound,
          is_recommended: !!ap.is_recommended,
          grade_type: isGrad ? '졸업생' : '재학생',
          is_graduated: isGrad,
          class_no: isGrad ? null : stdClass,
          suffix: hasQuota ? \`(\${ap.rank}위, \${ap.score_text})\` : ''
        }`;

if (rep.includes(targetStudentMapInFlatStats)) {
  rep = rep.replace(targetStudentMapInFlatStats, replacementStudentMapInFlatStats);
}

// 3-6. displayedStats & totalRecommendedStats
const targetDisplayedStats = `const displayedStats = computed(() => {
  if (printOnlyWithRecommendations.value) {
    return flatStats.value
      .filter(item => item.unit_used > 0 || item.total_applied > 0)
      .map((item, idx) => ({ ...item, no: idx + 1 }))
  }
  return flatStats.value
})`;

const replacementDisplayedStats = `const displayedStats = computed(() => {
  const isClassFilterActive = filterClass.value && filterClass.value !== 'all'
  const q = (searchQuery.value || '').trim().toLowerCase()
  const targetClass = isClassFilterActive && filterClass.value !== 'grad' ? Number(filterClass.value) : null

  let baseList = flatStats.value

  const result = []

  for (const item of baseList) {
    // 1. 해당 트랙 내 학생들을 학급 필터 및 검색어에 맞춰 선별
    const matchedStudents = (item.students || []).filter(std => {
      // 1-1. 학급 필터
      if (isClassFilterActive) {
        if (filterClass.value === 'grad') {
          if (!std.is_graduated && std.grade_type !== '졸업생') return false
        } else {
          if (std.is_graduated || std.grade_type === '졸업생') return false
          if (std.class_no !== targetClass) return false
        }
      }
      // 1-2. 검색어 필터
      if (q) {
        const uMatch = (item.univ_name || '').toLowerCase().includes(q)
        const tMatch = (item.track_name || '').toLowerCase().includes(q)
        const dMatch = (item.display_track_name || '').toLowerCase().includes(q)
        const sNameMatch = (std.name || '').toLowerCase().includes(q)
        const sCodeMatch = (std.student_code || '').toLowerCase().includes(q) || (std.raw_student_code || '').toLowerCase().includes(q)
        if (!uMatch && !tMatch && !dMatch && !sNameMatch && !sCodeMatch) return false
      }
      return true
    })

    // 2. 대학명/전형명 자체 매칭 여부
    const trackTextMatches = q ? (
      (item.univ_name || '').toLowerCase().includes(q) ||
      (item.track_name || '').toLowerCase().includes(q) ||
      (item.display_track_name || '').toLowerCase().includes(q)
    ) : true

    // 3. 행(row) 표출 여부 결정
    // - 학급 필터가 활성화된 경우: 해당 학급 학생이 존재하는 전형만 표출
    // - 학급 필터가 전체('all')이고 검색어가 있는 경우: 전형명 매칭이거나 학생 매칭인 경우 표출
    // - 인쇄 전용(printOnlyWithRecommendations)인 경우: 추천자가 있는 전형만 표출
    if (isClassFilterActive) {
      if (matchedStudents.length === 0) continue
    } else if (q) {
      if (!trackTextMatches && matchedStudents.length === 0) continue
    } else if (printOnlyWithRecommendations.value) {
      if (item.unit_used === 0 && item.total_applied === 0) continue
    }

    const enrolledMatched = matchedStudents.filter(s => !s.is_graduated && s.grade_type !== '졸업생').length
    const gradMatched = matchedStudents.filter(s => s.is_graduated || s.grade_type === '졸업생').length

    result.push({
      ...item,
      students: matchedStudents,
      unit_used: isClassFilterActive ? matchedStudents.length : item.unit_used,
      enrolled_used: isClassFilterActive ? enrolledMatched : item.enrolled_used,
      grad_used: isClassFilterActive ? gradMatched : item.grad_used
    })
  }

  // 순번 No 재할당
  return result.map((item, idx) => ({
    ...item,
    no: idx + 1
  }))
})`;

if (rep.includes(targetDisplayedStats)) {
  rep = rep.replace(targetDisplayedStats, replacementDisplayedStats);
}

// 3-7. totalRecommendedStats using displayedStats.value
const targetTotalRecommended = `  for (const item of flatStats.value) {`;
const replacementTotalRecommended = `  for (const item of displayedStats.value) {`;

if (rep.includes(targetTotalRecommended)) {
  rep = rep.replace(targetTotalRecommended, replacementTotalRecommended);
}

// 3-8. Print title with class label
const targetPrintTitle = `<h2 class="print-doc-title">
            학교장추천전형 추천 명단 및 정원 현황
            <span class="print-doc-subtitle-round">{{ roundLabelText }}</span>
          </h2>`;

const replacementPrintTitle = `<h2 class="print-doc-title">
            학교장추천전형 추천 명단 및 정원 현황
            <span v-if="filterClass && filterClass !== 'all'" class="text-blue-700 text-sm ml-1 font-extrabold">
              [{{ filterClass === 'grad' ? '졸업생' : filterClass + '반' }}]
            </span>
            <span class="print-doc-subtitle-round">{{ roundLabelText }}</span>
          </h2>`;

if (rep.includes(targetPrintTitle)) {
  rep = rep.replace(targetPrintTitle, replacementPrintTitle);
}

fs.writeFileSync('src/components/admin/ReportsTab.vue', rep, 'utf8');
console.log('ReportsTab.vue patched successfully');

