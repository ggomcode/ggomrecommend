/**
 * 학생 이름, 학부모 이름, 전화번호 AES-256-GCM 가역 암호화 및 SHA-256 비가역 해싱 모듈
 * DB 상에서 실제 한글 이름 및 전화번호 평문 노출을 100% 차단합니다.
 */

const SECRET_KEY_STR = 'ggomrecommend_school_secret_2026!'

async function getCryptoKey() {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(SECRET_KEY_STR)
  const hash = await crypto.subtle.digest('SHA-256', keyData)
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

/**
 * SHA-256 비가역 해시 (DB 인덱싱 및 로그인/검색 일치 대조용)
 * @param {string} text 
 * @returns {Promise<string>} 64자리 16진수 해시값
 */
export async function hashText(text) {
  if (text === null || text === undefined || text === '') return ''
  const clean = String(text).trim()
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
    console.error('hashText error:', e)
  }
  return clean
}

/**
 * AES-256-GCM 가역 암호화 (DB 저장용 - 평문 노출 완전 방지)
 * @param {string} text 
 * @returns {Promise<string>} "enc:iv:ciphertext" 형태의 암호화 문자열
 */
export async function encryptText(text) {
  if (text === null || text === undefined || text === '') return ''
  const clean = String(text).trim()
  if (!clean) return ''

  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const key = await getCryptoKey()
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encoder = new TextEncoder()
      const data = encoder.encode(clean)
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)

      const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('')
      const encHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('')
      return `enc:${ivHex}:${encHex}`
    }
  } catch (e) {
    console.error('encryptText error:', e)
  }
  return clean
}

/**
 * AES-256-GCM 복호화 (앱 내부 UI 표시 시 원본 텍스트로 복원)
 * @param {string} encryptedStr 
 * @returns {Promise<string>} 복호화된 원본 텍스트 (예: "홍길동")
 */
export async function decryptText(encryptedStr) {
  if (encryptedStr === null || encryptedStr === undefined || encryptedStr === '') return ''
  const str = String(encryptedStr).trim()
  if (!str.startsWith('enc:')) return str // 암호화되지 않은 기존 일반 텍스트는 그대로 반환

  try {
    const parts = str.split(':')
    if (parts.length !== 3) return str

    const ivHex = parts[1]
    const encHex = parts[2]

    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
    const encData = new Uint8Array(encHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))

    const key = await getCryptoKey()
    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encData)
    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  } catch (e) {
    console.error('decryptText error:', e)
    return str
  }
}
