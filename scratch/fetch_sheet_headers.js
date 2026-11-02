import fs from 'fs';

async function testFetchSheet() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  // 2027수시 시트의 1~3행 가져오기
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('2027수시')}&range=A1:DZ3`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log('Fetch status:', res.status);
    console.log('CSV text length:', text.length);
    const lines = text.split('\n');
    console.log('Total lines:', lines.length);
    if (lines.length > 0) {
      // CSV 파싱
      const headers = lines[0].split('","').map(s => s.replace(/^"|"$/g, ''));
      console.log('Total headers count:', headers.length);
      headers.forEach((h, i) => {
        // 열 알파벳 계산 (0=A, 82=CE, 121=DR)
        const colLetter = getColumnLetter(i + 1);
        if (i >= 78 && i <= 125) {
          console.log(`Col ${i+1} (${colLetter}): ${h}`);
        }
      });
    }
  } catch(e) {
    console.error('Fetch error:', e);
  }
}

function getColumnLetter(colIndex) {
  let temp, letter = '';
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIndex = (colIndex - temp - 1) / 26;
  }
  return letter;
}

testFetchSheet();

