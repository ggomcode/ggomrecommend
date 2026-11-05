import fs from 'fs'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'

async function testParseMoe() {
  const p2 = 'C:/Users/user/.gemini/antigravity/brain/3e8fd8f6-1214-436a-9b6b-9deec8f72cce/.user_uploaded/media_1793855848557_d0ceccdf.pdf'
  const data = new Uint8Array(fs.readFileSync(p2))
  const doc = await pdfjsLib.getDocument({ data }).promise

  const page = await doc.getPage(1)
  const textContent = await page.getTextContent()

  // 1. 단어/토큰 재조립
  // Y좌표 클러스터링
  const items = textContent.items.map(it => ({
    str: it.str,
    x: it.transform[4],
    y: it.transform[5],
    w: it.width,
    h: it.height
  }))

  items.sort((a, b) => b.y - a.y || a.x - b.x)

  const lines = []
  let curLine = []
  let curY = null

  for (const it of items) {
    if (!it.str.trim()) continue
    if (curY === null || Math.abs(it.y - curY) > 4) {
      if (curLine.length > 0) {
        curLine.sort((a, b) => a.x - b.x)
        lines.push(curLine)
      }
      curLine = [it]
      curY = it.y
    } else {
      curLine.push(it)
    }
  }
  if (curLine.length > 0) {
    curLine.sort((a, b) => a.x - b.x)
    lines.push(curLine)
  }

  // 글자 이어붙이기
  const textLines = lines.map(line => {
    // x좌표 거리에 따라 공백 여부 판단
    let lineStr = ''
    let prevX = null
    let prevW = 0
    for (const it of line) {
      if (prevX !== null) {
        const gap = it.x - (prevX + prevW)
        if (gap > 4) lineStr += ' '
      }
      lineStr += it.str
      prevX = it.x
      prevW = it.w
    }
    return lineStr.trim()
  })

  console.log('--- Assembled Text Lines ---')
  textLines.slice(0, 20).forEach((l, idx) => console.log(`${idx}: ${l}`))

  // 학생 행 매칭 정규식: 번호 성명 국어선택 ...
  // 예: "5 김나연 화법과 작문 107 46 56.36 5 확률과 통계 100 54 48.83 5 5 3 세계사 63 1 81.81 3 사회·문화 59 21 76.13 3 - -"
  const studentLineRegex = /^(\d{1,2})\s+([가-힣]{2,4})\s+(.+)$/

  const students = []
  for (const tl of textLines) {
    const match = tl.match(studentLineRegex)
    if (match) {
      const num = parseInt(match[1], 10)
      const name = match[2]
      const rest = match[3]
      console.log(`\nMatched Student: [${num}번] ${name} -> rest: "${rest}"`)

      // 토큰 분해
      // 국어: 화법과 작문 또는 언어와 매체
      // 수학: 확률과 통계 또는 미적분 또는 기하
      // 영어(등급): 숫자
      // 한국사(등급): 숫자
      // 탐구1: 과목명 표점 석차 백분위 등급
      // 탐구2: 과목명 표점 석차 백분위 등급
      const tokens = rest.split(/\s+/)
      console.log('Tokens:', tokens)
    }
  }
}

testParseMoe().catch(console.error)

