import * as pdfjsLib from 'pdfjs-dist'

// Worker CDN 설정
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

/**
 * PDF 파일을 브라우저 캔버스를 이용해 JPEG Base64 이미지 리스트로 렌더링
 */
export async function convertPdfToImages(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const images = []

  // 처음 2페이지만 추출 (토큰 절약 및 속도 향상)
  const maxPages = Math.min(pdf.numPages, 2)
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.5 })

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width

    await page.render({ canvasContext: context, viewport }).promise
    images.push(canvas.toDataURL('image/jpeg', 0.85))
  }
  return images
}

/**
 * OpenAI Vision API를 이용하여 문서 이미지 분석 수행
 */
export async function analyzeDocumentWithAI(base64Images, apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API Key가 설정되지 않았습니다. 관리자 환경설정을 확인해 주세요.')
  }

  const contentArray = [
    {
      type: 'text',
      text: `이 문서는 고등학교의 대입 학교장추천전형 양식입니다. 
아래 이미지들을 분석하여 문재 유형과 주요 인적사항을 추출하세요.
반드시 아래 JSON 스키마 형식의 유효한 JSON 오브젝트만 반환하세요:
{
  "document_type": "포기원" | "신청서" | "기타",
  "student_name": "문서에 적힌 학생 이름 (없으면 null)",
  "student_code": "학번 (없으면 null)",
  "university": "대상 대학명 (없으면 null)",
  "is_signed": true | false (서명/날인란에 실제 서명이 완료되었는지 여부)
}`
    }
  ]

  base64Images.forEach(img => {
    contentArray.push({
      type: 'image_url',
      image_url: {
        url: img
      }
    })
  })

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: contentArray
        }
      ],
      max_tokens: 300,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenAI API 호출 실패: ${errText}`)
  }

  const data = await response.json()
  const reply = data.choices[0].message.content
  return JSON.parse(reply)
}
