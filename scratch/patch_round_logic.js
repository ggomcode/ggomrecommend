import fs from 'fs';

const adminFile = 'src/api/admin.js';
let adminCode = fs.readFileSync(adminFile, 'utf-8');

// Patch getCurrentRound in admin.js
const oldAdminGetCurrentRound = `  // 1. 현재 접수 중(OPEN)인 차수가 있으면 낮은 차수(1차 우선) 선택
  for (const r of rounds) {
    const sched = schedulesMap[r.id]
    if (computeRoundDisplayStatus(r, sched) === 'OPEN') return r
  }

  // 2. 접수 전(DRAFT) 상태인 차수가 있으면 가장 낮은 차수(1차) 선택
  for (const r of rounds) {
    const sched = schedulesMap[r.id]
    if (computeRoundDisplayStatus(r, sched) === 'DRAFT') return r
  }

  // 3. 심사 중(CLOSED)인 차수가 있으면 선택
  for (const r of rounds) {
    const sched = schedulesMap[r.id]
    if (computeRoundDisplayStatus(r, sched) === 'CLOSED') return r
  }

  // 4. 모두 FINALIZED이면 첫 차수(1차) 선택
  return rounds[0]`;

const newAdminGetCurrentRound = `  // 1. 현재 접수 중(OPEN)인 차수가 있으면 최우선 (낮은 차수 우선)
  for (const r of rounds) {
    const sched = schedulesMap[r.id]
    if (computeRoundDisplayStatus(r, sched) === 'OPEN') return r
  }

  // 2. 심사 중(CLOSED)인 차수가 있으면 선택
  for (const r of rounds) {
    const sched = schedulesMap[r.id]
    if (computeRoundDisplayStatus(r, sched) === 'CLOSED') return r
  }

  // 3. 최종 마감(FINALIZED)된 차수가 있는 경우: 이미 선발이 완료되어 데이터가 확정된 차수를 우선 선택
  //    (여러 개가 완료된 경우 가장 최근 완료 차수 반환)
  const finalizedRounds = rounds.filter(r => computeRoundDisplayStatus(r, schedulesMap[r.id]) === 'FINALIZED')
  if (finalizedRounds.length > 0) {
    return finalizedRounds[finalizedRounds.length - 1]
  }

  // 4. 아직 어떤 차수도 시작되지 않아 모두 접수 전(DRAFT)인 경우: 첫 차수(1차) 선택
  for (const r of rounds) {
    const sched = schedulesMap[r.id]
    if (computeRoundDisplayStatus(r, sched) === 'DRAFT') return r
  }

  return rounds[0]`;

function applyReplace(file, code, oldStr, newStr) {
  if (code.includes(oldStr)) {
    return code.replace(oldStr, newStr);
  }
  const oldCRLF = oldStr.replace(/\n/g, '\r\n');
  const newCRLF = newStr.replace(/\n/g, '\r\n');
  if (code.includes(oldCRLF)) {
    return code.replace(oldCRLF, newCRLF);
  }
  throw new Error(`Target string not found in ${file}`);
}

adminCode = applyReplace(adminFile, adminCode, oldAdminGetCurrentRound, newAdminGetCurrentRound);

// Also patch getOverview to prefer round with applications if targetRoundId is null
const oldOverviewRoundSelect = `  } else {
    round = await getCurrentRound()
  }`;

const newOverviewRoundSelect = `  } else {
    round = await getCurrentRound()
    // 만약 getCurrentRound()로 선택된 라운드에 지원서가 없고, 다른 라운드에 지원서가 있다면 데이터가 있는 라운드를 우선 선택
    if (round && allApps.length > 0 && !allApps.some(a => a.round === round.id)) {
      const roundWithApps = roundsList.find(r => allApps.some(a => a.round === r.id))
      if (roundWithApps) {
        round = roundWithApps
      }
    }
  }`;

adminCode = applyReplace(adminFile, adminCode, oldOverviewRoundSelect, newOverviewRoundSelect);
fs.writeFileSync(adminFile, adminCode, 'utf-8');
console.log('✅ Successfully patched src/api/admin.js');

// Patch teacher.js
const teacherFile = 'src/api/teacher.js';
let teacherCode = fs.readFileSync(teacherFile, 'utf-8');

teacherCode = applyReplace(teacherFile, teacherCode, oldAdminGetCurrentRound, newAdminGetCurrentRound);
fs.writeFileSync(teacherFile, teacherCode, 'utf-8');
console.log('✅ Successfully patched src/api/teacher.js');

