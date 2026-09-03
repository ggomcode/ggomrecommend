import { supabase } from './supabaseClient'

/**
 * 1. 단일 지원서(application)에 첨부된 서명 및 문서 파일(스토리지)을 삭제합니다.
 */
export async function deleteApplicationStorageFiles(app) {
  if (!supabase || !app) return

  const pathsByBucket = {
    signatures: [],
    documents: []
  }

  function extractPath(url, bucketName) {
    if (!url || typeof url !== 'string') return
    if (url.startsWith('data:image') || url.startsWith('data:application')) return // Base64 인라인 서명 제외

    try {
      const bucketMarker = `/${bucketName}/`
      if (url.includes(bucketMarker)) {
        const parts = url.split(bucketMarker)
        if (parts.length > 1) {
          const rawPath = parts[1].split('?')[0]
          const decoded = decodeURIComponent(rawPath)
          if (decoded) pathsByBucket[bucketName].push(decoded)
        }
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        pathsByBucket[bucketName].push(url)
      }
    } catch (e) {
      console.warn(`Path extraction error for ${bucketName}:`, e)
    }
  }

  // 1) DB 컬럼에 기록된 파일 URL 추출
  extractPath(app.student_signature_url, 'signatures')
  extractPath(app.parent_signature_url, 'signatures')
  extractPath(app.abandoned_doc_url, 'documents')

  if (app.scanned_doc_url) {
    if (typeof app.scanned_doc_url === 'string' && app.scanned_doc_url.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(app.scanned_doc_url)
        if (parsed.doc_url) extractPath(parsed.doc_url, 'documents')
        if (parsed.student_signature_url) extractPath(parsed.student_signature_url, 'signatures')
        if (parsed.parent_signature_url) extractPath(parsed.parent_signature_url, 'signatures')
      } catch (e) {}
    } else {
      extractPath(app.scanned_doc_url, 'documents')
    }
  }

  // 2) 예측 가능한 파일명 패턴 추가 (fallback)
  const sid = app.student_id
  const rid = app.round || app.round_id
  const uid = app.univ_id || app.track_id
  const appId = app.id
  if (sid && rid && uid) {
    pathsByBucket.signatures.push(`student_${sid}_r${rid}_u_${uid}_student.png`)
    pathsByBucket.signatures.push(`student_${sid}_r${rid}_u_${uid}_parent.png`)
    pathsByBucket.signatures.push(`abandon_student_${sid}_r${rid}_u_${uid}.png`)
    pathsByBucket.signatures.push(`abandon_parent_${sid}_r${rid}_u_${uid}.png`)
    pathsByBucket.documents.push(`abandoned_${sid}_r${rid}_u_${uid}.pdf`)
  }

  // 3) Supabase Storage 실제 삭제 수행
  for (const [bucket, paths] of Object.entries(pathsByBucket)) {
    const uniquePaths = [...new Set(paths)].filter(Boolean)
    if (uniquePaths.length > 0) {
      try {
        await supabase.storage.from(bucket).remove(uniquePaths)
      } catch (e) {
        console.warn(`Failed to delete storage files in bucket '${bucket}':`, e)
      }
    }
  }
}

/**
 * 2. 특정 학생의 농어촌 전형 서명 정보(DB, 스토리지, localStorage) 삭제
 */
export async function deleteStudentRuralSignatures(studentId) {
  if (!studentId) return

  if (supabase) {
    // 1) DB 테이블 레코드 삭제
    try {
      await supabase.from('rural_signatures').delete().eq('student_id', studentId)
    } catch (e) {}

    // 2) 스토리지 버킷 파일 삭제
    const files = [
      `rural_sig_${studentId}_student.png`,
      `rural_sig_${studentId}_parent.png`
    ]
    try {
      await supabase.storage.from('rural_signatures').remove(files)
      await supabase.storage.from('signatures').remove(files)
    } catch (e) {}
  }

  // 3) 브라우저 localStorage 캐시 정리
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(`rural_sig_${studentId}`)
    } catch (e) {}
  }
}

/**
 * 3. 특정 Storage 버킷 내의 모든 파일 목록을 조회하여 완전 삭제(초기화)합니다.
 */
export async function emptyStorageBucket(bucketName) {
  if (!supabase) return
  try {
    const { data: files, error } = await supabase.storage.from(bucketName).list('', { limit: 1000 })
    if (error || !files || files.length === 0) return

    const pathsToDelete = []
    for (const f of files) {
      if (f.name) {
        pathsToDelete.push(f.name)
        // 하위 폴더가 존재하는 경우 서브 탐색
        if (!f.metadata) {
          const { data: subFiles } = await supabase.storage.from(bucketName).list(f.name, { limit: 1000 })
          if (subFiles && subFiles.length > 0) {
            subFiles.forEach(sf => pathsToDelete.push(`${f.name}/${sf.name}`))
          }
        }
      }
    }

    if (pathsToDelete.length > 0) {
      await supabase.storage.from(bucketName).remove(pathsToDelete)
    }
  } catch (e) {
    console.warn(`Failed to empty storage bucket '${bucketName}':`, e)
  }
}

/**
 * 4. 학교장추천전형 지원 현황 관련 모든 Storage 버킷 (signatures, documents) 일괄 삭제
 */
export async function clearAllApplicationStorage() {
  await emptyStorageBucket('signatures')
  await emptyStorageBucket('documents')
}

/**
 * 5. 농어촌 전형 관련 모든 Storage 버킷 (rural_signatures) 및 localStorage 캐시 일괄 삭제
 */
export async function clearAllRuralStorage() {
  await emptyStorageBucket('rural_signatures')
  await emptyStorageBucket('signatures')

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith('rural_sig_')) {
          keysToRemove.push(k)
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k))
    } catch (e) {}
  }
}
