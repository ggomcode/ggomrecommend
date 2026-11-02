import fs from 'fs';

let content = fs.readFileSync('src/components/teacher/ResultsTab.vue', 'utf8');

// 1. Tailwind class
content = content.replace('bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50', 'bg-linear-to-r from-emerald-50 via-teal-50 to-blue-50');

// 2. load() logic
const oldLoad = `async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await teacherGetResults()
    rounds.value  = data.rounds
    results.value = data.results
  } catch (e) {
    rounds.value  = []
    results.value = []
    loadError.value = e.response?.data ?? e.message ?? '오류가 발생했습니다'
  } finally {
    loading.value = false
  }
}`;

const newLoad = `async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await teacherGetResults()
    rounds.value  = data.rounds
    results.value = data.results

    if (!results.value || results.value.length === 0) {
      const kcueRes = buildTeacherResultsFromKcue(null, auth.classNo, auth.grade)
      rounds.value = kcueRes.rounds
      results.value = kcueRes.results
      isUsingKcueArchive.value = true
    } else {
      isUsingKcueArchive.value = false
    }
  } catch (e) {
    console.warn('교사 추천 결과 조회 실패, 2027 원장 아카이브로 폴백:', e)
    const kcueRes = buildTeacherResultsFromKcue(null, auth.classNo, auth.grade)
    rounds.value = kcueRes.rounds
    results.value = kcueRes.results
    isUsingKcueArchive.value = true
  } finally {
    loading.value = false
  }
}`;

if (content.includes(oldLoad.replace(/\n/g, '\r\n'))) {
  content = content.replace(oldLoad.replace(/\n/g, '\r\n'), newLoad.replace(/\n/g, '\r\n'));
} else if (content.includes(oldLoad)) {
  content = content.replace(oldLoad, newLoad);
}

fs.writeFileSync('src/components/teacher/ResultsTab.vue', content, 'utf8');
console.log('Successfully updated ResultsTab.vue!');

