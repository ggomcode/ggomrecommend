import fs from 'fs';

async function listAllTabs() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  // HTML 메타데이터에서 탭 목록 파싱
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
  try {
    const res = await fetch(url);
    const html = await res.text();
    // 시트 이름들을 정규식으로 찾기
    const matches = html.match(/"name":"([^"]+)"/g);
    console.log('Matches:', matches ? matches.slice(0, 20) : 'none');
  } catch(e) {
    console.error('Error:', e);
  }
}

listAllTabs();

