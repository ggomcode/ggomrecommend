import fs from 'fs';
import * as XLSX from 'xlsx';

// 1. 현재 구글 시트의 2027수시 1,400개 데이터 행 가져오기
async function runFullMatchForCurrentSheet() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('2027수시')}`;
  const res = await fetch(url);
  const text = await res.text();
  const wbCurrent = XLSX.read(text, { type: 'string' });
  const sheetCurrent = wbCurrent.Sheets[wbCurrent.SheetNames[0]];
  const currentRows = XLSX.utils.sheet_to_json(sheetCurrent, { header: 1, defval: '' });

  console.log('Current rows count:', currentRows.length);
  const headers = currentRows[0];
  const dataRows = currentRows.slice(1);
  console.log('Data rows count:', dataRows.length);

  // 2. 기존 1,376건 매칭 완료 마스터 로드
  const masterPath = 'D:/Cloud/git/ggomcode/ggomrate/2027_대교협_수시경쟁률_매칭완료.xlsx';
  const masterBuf = fs.readFileSync(masterPath);
  const wbMaster = XLSX.read(masterBuf, { type: 'buffer' });
  const sMaster = wbMaster.Sheets['대교협_3개년_경쟁률_매칭'];
  const masterRows = XLSX.utils.sheet_to_json(sMaster, { header: 1, defval: '' });

  const mCEIdx = 57;
  const masterMap = new Map();

  for (let i = 1; i < masterRows.length; i++) {
    const r = masterRows[i];
    const ban = String(r[1] || '').trim();
    const num = String(r[2] || '').trim();
    const name = String(r[3] || '').trim();
    const univ = String(r[6] || '').trim();
    const tType = String(r[8] || '').trim();
    const tDetail = String(r[10] || '').trim();
    const dept = String(r[12] || '').trim();

    const fullKey = `${ban}_${num}_${name}_${univ}_${tType}_${tDetail}_${dept}`.replace(/[\r\n\s]+/g, '');
    const subKey = `${ban}_${num}_${name}_${univ}_${dept}`.replace(/[\r\n\s]+/g, '');
    const vals = r.slice(mCEIdx, mCEIdx + 40);

    masterMap.set(fullKey, vals);
    if (!masterMap.has(subKey)) masterMap.set(subKey, vals);
  }

  console.log('Master map loaded keys:', masterMap.size);

  // 3. 현재 1,400개 행과 매칭
  const resultCEtoDR = [];
  let generalMatchCount = 0;
  let juniorCollegeCount = 0;
  let otherNewCount = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    const ban = String(r[1] || '').trim();
    const num = String(r[2] || '').trim();
    const name = String(r[3] || '').trim();
    const schoolType = String(r[4] || '').trim();
    const univ = String(r[6] || '').trim();
    const tType = String(r[8] || '').trim();
    const tDetail = String(r[10] || '').trim();
    const dept = String(r[12] || '').trim();

    const fullKey = `${ban}_${num}_${name}_${univ}_${tType}_${tDetail}_${dept}`.replace(/[\r\n\s]+/g, '');
    const subKey = `${ban}_${num}_${name}_${univ}_${dept}`.replace(/[\r\n\s]+/g, '');

    if (masterMap.has(fullKey)) {
      resultCEtoDR.push(masterMap.get(fullKey));
      generalMatchCount++;
    } else if (masterMap.has(subKey)) {
      resultCEtoDR.push(masterMap.get(subKey));
      generalMatchCount++;
    } else {
      // 신규 추가 행 (전문대 등)
      const isJunior = schoolType.includes('전문') || univ.includes('전문대') || univ.includes('전문대학');
      const row = new Array(40).fill('-');
      row[0] = isJunior ? '전문대학' : (schoolType || '4년제대학');
      row[1] = isJunior ? '전문대 접수' : '신규 접수';
      row[2] = tDetail || tType || '수시전형';
      row[3] = dept;
      row[4] = r[13] ? String(r[13]) : '-'; // 모집인원
      row[5] = r[13] ? Number(r[13]) || '' : '';
      row[6] = ''; // 지원인원
      row[7] = '-';
      row[8] = '';
      row[9] = '단독선발';
      row[10] = '-';
      row[11] = '-';
      row[12] = '';
      row[13] = '';

      resultCEtoDR.push(row);
      if (isJunior) {
        juniorCollegeCount++;
      } else {
        otherNewCount++;
      }
    }
  }

  console.log(`Matching result:`);
  console.log(`- General matched: ${generalMatchCount}`);
  console.log(`- Junior college auto-filled: ${juniorCollegeCount}`);
  console.log(`- Other new: ${otherNewCount}`);
  console.log(`- Total output rows: ${resultCEtoDR.length}`);

  // 4. CE2:DR 붙여넣기용 엑셀 및 TSV(탭 구분 텍스트) 생성
  // TSV로 만들면 구글 시트 CE2 셀 찍고 Ctrl+V 누르면 1초 만에 쏙 들어감!
  const ceHeaders = masterRows[0].slice(mCEIdx, mCEIdx + 40);
  
  // TSV 생성 (클립보드 붙여넣기용)
  const tsvLines = resultCEtoDR.map(row => row.map(c => String(c == null ? '' : c).replace(/\t/g, ' ')).join('\t'));
  const tsvContent = tsvLines.join('\r\n');
  fs.writeFileSync('scratch/2027수시_CE_DR_붙여넣기자료.txt', tsvContent, 'utf8');
  console.log('Saved TSV: scratch/2027수시_CE_DR_붙여넣기자료.txt');

  // XLSX 생성
  const outWb = XLSX.utils.book_new();
  const outSheet = XLSX.utils.aoa_to_sheet([ceHeaders, ...resultCEtoDR]);
  XLSX.utils.book_append_sheet(outWb, outSheet, 'CE_DR_매칭자료');
  XLSX.writeFile(outWb, 'scratch/2027수시_CE_DR_매칭자료_1400건.xlsx');
  console.log('Saved XLSX: scratch/2027수시_CE_DR_매칭자료_1400건.xlsx');
}

runFullMatchForCurrentSheet();

