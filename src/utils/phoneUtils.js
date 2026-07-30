/**
 * 전화번호 끝 4자리 자동 0-Padding 및 정제 함수
 * @param {string|number} val - 엑셀 또는 입력창에서 전달받은 값 (예: 12, "123", "0123", "01012345678")
 * @returns {string} 4자리 문자열 (예: 12 -> "0012", 123 -> "0123", "01012345678" -> "5678")
 */
export function formatPhoneLast4(val) {
  if (val === null || val === undefined || val === '') return ''
  
  // 아포스트로피('), 따옴표 및 숫자가 아닌 모든 문자 제거
  let str = String(val).trim().replace(/['"`]/g, '').replace(/\D/g, '')
  if (!str) return ''

  // 4자리 초과 시 (전체 전화번호가 들어온 경우) 끝 4자리 추출
  if (str.length > 4) {
    str = str.slice(-4)
  }

  // 4자리 미만 시 앞에 '0'을 자동으로 붙여 4자리를 맞춤 (예: 12 -> "0012", 123 -> "0123")
  return str.padStart(4, '0')
}

/**
 * 전체 전화번호 0-Padding 자동 보정 및 정제 함수
 * - 맨 앞 아포스트로피(') 또는 따옴표 자동 제거
 * - 엑셀에서 숫자로 입력되어 맨 앞 '0'이 잘린 경우 (예: 1012345678 -> "01012345678") 자동 보정
 * @param {string|number} val 
 * @returns {string} 11자리 전체 전화번호
 */
export function cleanFullPhone(val) {
  if (val === null || val === undefined || val === '') return ''
  // 아포스트로피('), 따옴표 및 숫자가 아닌 모든 문자 제거
  let str = String(val).trim().replace(/['"`]/g, '').replace(/\D/g, '')
  if (!str) return ''

  // 엑셀에서 숫자로 입력되어 맨 앞 '0'이 빠진 경우 (예: 1012345678 -> "01012345678")
  if (str.length === 10 && str.startsWith('10')) {
    str = '0' + str
  }

  return str
}

/**
 * 전화번호 SHA-256 비가역 암호화(해싱) 함수 (DB 평문 노출 방지)
 * @param {string|number} val - 전화번호 (예: "010-1234-5678", 1012345678, "01012345678")
 * @returns {Promise<string>} SHA-256 해시 16진수 문자열
 */
export async function hashPhone(val) {
  if (val === null || val === undefined || val === '') return ''
  const clean = cleanFullPhone(val)
  if (!clean) return ''

  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder()
      const data = encoder.encode(clean)
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }
  } catch (e) {
    console.error('hashPhone error:', e)
  }
  return clean
}
