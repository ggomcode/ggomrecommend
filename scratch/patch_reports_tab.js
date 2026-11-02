import fs from 'fs';

let content = fs.readFileSync('src/components/admin/ReportsTab.vue', 'utf8');

// 1. applyKcueArchiveFallback 함수 정의
const helperFunc = `function applyKcueArchiveFallback(gMap = null) {
  const kcueData = buildReportsDataFromKcue()
  isUsingKcueArchive.value = true
  stats.value = kcueData.stats
  allApplicantsMap.value = kcueData.allApplicantsMap
  recommendedList.value = kcueData.recommendedList
  studentMap.value = kcueData.studentMap
  abandonedList.value = []
  roundsList.value = [{ id: 1, name: '1차 선발', status: 'FINALIZED' }]
  totalRounds.value = 1
  selectedRoundFilter.value = 'all'
  if (gMap && Object.keys(gMap).length > 0) {
    gradConditionMap.value = gMap
  }
}

async function loadData() {`;

content = content.replace('async function loadData() {', helperFunc);

// 2. loadData 내부 로직 보강
const targetLoadStart = `    stats.value = await getQuotaStats()
    if (supabase) {`;
const targetLoadStartCRLF = `    stats.value = await getQuotaStats()\r\n    if (supabase) {`;

const newLoadStart = `    if (!supabase) {
      applyKcueArchiveFallback()
      return
    }

    stats.value = await getQuotaStats()
    if (supabase) {`;

if (content.includes(targetLoadStartCRLF)) {
  content = content.replace(targetLoadStartCRLF, newLoadStart.replace(/\n/g, '\r\n'));
} else if (content.includes(targetLoadStart)) {
  content = content.replace(targetLoadStart, newLoadStart);
}

// 3. allApps 체크 부분
const targetAllApps = `const allApps = (allAppsRaw || []).filter(ap => !ap.is_abandoned)`;
const newAllApps = `const allApps = (allAppsRaw || []).filter(ap => !ap.is_abandoned)

      // 유효 추천 지원서가 없는 경우 (수시 추천 종료 후 아카이브 모드: 2027 원서접수 확정 원장 자동 연동)
      if (allApps.length === 0) {
        applyKcueArchiveFallback(gMap)
        return
      }

      isUsingKcueArchive.value = false`;

content = content.replace(targetAllApps, newAllApps.replace(/\n/g, content.includes('\r\n') ? '\r\n' : '\n'));

// 4. catch (e) 부분에 폴백
const targetCatch = `  } catch (e) {
    await dialog.alert({ title: '데이터 조회 실패', message: e.message || '보고서 데이터 조회 중 오류가 발생했습니다.' })
  } finally {`;
const targetCatchCRLF = targetCatch.replace(/\n/g, '\r\n');

const newCatch = `  } catch (e) {
    console.warn('보고서 데이터 조회 예외, 2027 원장 아카이브로 폴백:', e)
    applyKcueArchiveFallback()
  } finally {`;

if (content.includes(targetCatchCRLF)) {
  content = content.replace(targetCatchCRLF, newCatch.replace(/\n/g, '\r\n'));
} else if (content.includes(targetCatch)) {
  content = content.replace(targetCatch, newCatch);
}

// 5. downloadExcel 내보내기 연동
const targetDownload = `    const roundParam = selectedRoundFilter.value === 'all' ? null : Number(selectedRoundFilter.value)
    const blob = await exportQuotaStats(roundParam)`;
const targetDownloadCRLF = targetDownload.replace(/\n/g, '\r\n');

const newDownload = `    if (isUsingKcueArchive.value) {
      const blob = exportKcueQuotaStatsExcel(flatStats.value, roundStr)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = \`2027학년도_학교장추천전형_원서접수_확정명단_\${roundStr}_\${new Date().toISOString().slice(0, 10)}.xlsx\`
      a.click()
      window.URL.revokeObjectURL(url)
      return
    }

    const roundParam = selectedRoundFilter.value === 'all' ? null : Number(selectedRoundFilter.value)
    const blob = await exportQuotaStats(roundParam)`;

if (content.includes(targetDownloadCRLF)) {
  content = content.replace(targetDownloadCRLF, newDownload.replace(/\n/g, '\r\n'));
} else if (content.includes(targetDownload)) {
  content = content.replace(targetDownload, newDownload);
}

fs.writeFileSync('src/components/admin/ReportsTab.vue', content, 'utf8');
console.log('Successfully updated ReportsTab.vue!');

