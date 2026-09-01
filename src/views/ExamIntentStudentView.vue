<template>
  <div class="ei-student-root">
    <!-- 헤더 -->
    <header class="ei-header">
      <div class="ei-header-inner">
        <div class="ei-header-left">
          <div class="ei-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z"/>
              <path d="M6 9.01V9"/>
            </svg>
          </div>
          <div class="ei-header-titles">
            <span class="ei-school-tag">{{ schoolName }}</span>
            <h1 class="ei-page-title">수능응시 · 수시/정시 원서접수계획 등록</h1>
          </div>
        </div>
        <div class="ei-header-right">
          <button @click="$router.push('/select-system')" class="ei-btn-ghost">🏠 포털</button>
          <button @click="handleLogout" class="ei-btn-ghost">로그아웃</button>
        </div>
      </div>
      <!-- 학생 정보 바 -->
      <div class="ei-student-bar">
        <span class="ei-student-name">{{ auth.studentName }}</span>
        <span class="ei-student-info">{{ auth.grade || 3 }}학년 {{ auth.classNo }}반 {{ auth.seqNo }}번 ({{ auth.studentCode }})</span>
      </div>
    </header>

    <!-- 로딩 -->
    <div v-if="loading" class="ei-loading">
      <div class="ei-spinner"></div>
      <p>데이터를 불러오는 중입니다...</p>
    </div>

    <!-- 이미 등록 완료된 경우: 완료 뷰 또는 빠른 수정 뷰 -->
    <div v-else-if="isCompleted" class="ei-container">
      <!-- 1. 등록 완료 대시보드 카드 (isEditing === false) -->
      <div v-if="!isEditing" class="ei-completed-card">
        <div class="ei-completed-icon">✅</div>
        <h2 class="ei-completed-title">응시/원서접수 의향 등록 완료</h2>
        <p class="ei-completed-date">{{ formatDate(survey.confirmed_at) }}에 등록되었습니다.</p>

        <div v-if="survey.history_count > 0" class="ei-history-badge-bar">
          <span class="ei-history-count-badge">🔄 총 {{ survey.history_count }}회 수정됨</span>
          <span class="text-xs text-slate-500">최근 수정: {{ formatDate(survey.last_modified_at) }}</span>
        </div>

        <div class="ei-completed-summary">
          <!-- 1. 수능 -->
          <div class="ei-summary-row">
            <span class="ei-summary-label">수능 응시</span>
            <span :class="['ei-summary-badge', survey.csat_intent === 'TAKE' ? 'badge-blue' : 'badge-red']">
              {{ survey.csat_intent === 'TAKE' ? '✔ 응시' : '✖ 미응시' }}
            </span>
          </div>
          <div v-if="survey.csat_intent === 'NO_TAKE'" class="ei-summary-reason">
            사유: {{ survey.csat_no_take_reason || '-' }}
          </div>

          <!-- 2. (일반대/과기원) 수시 -->
          <div class="ei-summary-row">
            <span class="ei-summary-label">(일반대·과기원) 수시</span>
            <span :class="['ei-summary-badge', (survey.susi_general_intent || survey.susi_intent) === 'APPLY' ? 'badge-blue' : 'badge-red']">
              {{ (survey.susi_general_intent || survey.susi_intent) === 'APPLY' ? '✔ 접수 예정' : '✖ 미접수' }}
            </span>
          </div>
          <div v-if="(survey.susi_general_intent || survey.susi_intent) === 'NO_APPLY'" class="ei-summary-reason">
            사유: {{ survey.susi_general_no_reason || survey.susi_no_apply_reason || '-' }}
          </div>

          <!-- 3. (일반대/과기원) 정시 -->
          <div class="ei-summary-row">
            <span class="ei-summary-label">(일반대·과기원) 정시</span>
            <span :class="['ei-summary-badge', (survey.jungsi_general_intent || survey.jungsi_intent || 'APPLY') === 'APPLY' ? 'badge-blue' : 'badge-red']">
              {{ (survey.jungsi_general_intent || survey.jungsi_intent || 'APPLY') === 'APPLY' ? '✔ 접수 예정' : '✖ 미접수' }}
            </span>
          </div>
          <div v-if="(survey.jungsi_general_intent || survey.jungsi_intent) === 'NO_APPLY'" class="ei-summary-reason">
            사유: {{ survey.jungsi_general_no_reason || survey.jungsi_no_reason || '-' }}
          </div>

          <!-- 4. (전문대) 수시 -->
          <div class="ei-summary-row">
            <span class="ei-summary-label">(전문대) 수시</span>
            <span :class="['ei-summary-badge', (survey.susi_college_intent || 'APPLY') === 'APPLY' ? 'badge-blue' : 'badge-red']">
              {{ (survey.susi_college_intent || 'APPLY') === 'APPLY' ? '✔ 접수 예정' : '✖ 미접수' }}
            </span>
          </div>
          <div v-if="survey.susi_college_intent === 'NO_APPLY'" class="ei-summary-reason">
            사유: {{ survey.susi_college_no_reason || '-' }}
          </div>

          <!-- 5. (전문대) 정시 -->
          <div class="ei-summary-row">
            <span class="ei-summary-label">(전문대) 정시</span>
            <span :class="['ei-summary-badge', (survey.jungsi_college_intent || 'APPLY') === 'APPLY' ? 'badge-blue' : 'badge-red']">
              {{ (survey.jungsi_college_intent || 'APPLY') === 'APPLY' ? '✔ 접수 예정' : '✖ 미접수' }}
            </span>
          </div>
          <div v-if="survey.jungsi_college_intent === 'NO_APPLY'" class="ei-summary-reason">
            사유: {{ survey.jungsi_college_no_reason || '-' }}
          </div>
        </div>

        <!-- 확인서 출력 버튼 -->
        <div class="ei-print-actions">
          <button v-if="survey.csat_intent === 'NO_TAKE'" @click="printCsatForm" class="ei-btn-print ei-btn-print-csat">
            🖨️ 수능 미응시 확인서 출력
          </button>
          <button v-if="hasAnyNoApply" @click="printSusiForm" class="ei-btn-print ei-btn-print-susi">
            🖨️ 대입 원서 미접수 확인서 출력 (통합 1장)
          </button>
        </div>

        <!-- 수정 모드 진입 버튼 -->
        <button @click="startEditMode" class="ei-btn-edit">
          ✏️ 등록 계획 변경/수정하기
        </button>

        <!-- 변경 이력 아코디언 -->
        <div v-if="survey.change_logs && survey.change_logs.length > 0" class="ei-history-section">
          <button @click="showHistory = !showHistory" class="ei-history-toggle-btn">
            <span>⏱️ 나의 변경 이력 ({{ survey.change_logs.length }}건)</span>
            <span>{{ showHistory ? '▲ 닫기' : '▼ 보기' }}</span>
          </button>

          <div v-if="showHistory" class="ei-history-list">
            <div v-for="(log, idx) in survey.change_logs" :key="idx" class="ei-history-item">
              <div class="ei-history-item-header">
                <span class="ei-history-actor">{{ log.actor_name || '학생 본인' }}</span>
                <span class="ei-history-time">{{ formatDate(log.timestamp) }}</span>
              </div>
              <div v-if="log.type === 'INITIAL'" class="text-xs text-emerald-600 font-bold">
                🎉 {{ log.summary || '최초 등록 완료' }}
              </div>
              <div v-else class="ei-history-changes">
                <div v-for="(c, cIdx) in log.changes" :key="cIdx" class="ei-history-change-row">
                  <span class="font-bold text-slate-700">[{{ c.field_name }}]</span>
                  <span class="text-slate-400 line-through">{{ c.from_label || c.from }}</span>
                  <span class="text-indigo-600 font-bold">➔ {{ c.to_label || c.to }}</span>
                  <span v-if="c.reason" class="text-xs text-slate-500">({{ c.reason }})</span>
                </div>
              </div>
              <div v-if="log.memo" class="text-xs text-slate-500 mt-1 italic">
                사유: {{ log.memo }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 한눈에 보는 빠른 수정 폼 (isEditing === true) -->
      <div v-else class="ei-edit-card">
        <div class="ei-edit-header">
          <h2 class="ei-edit-title">✏️ 의향 조사 내용 수정</h2>
          <p class="ei-edit-desc">각 항목의 버튼을 선택하여 변경 후 [수정 내용 저장]을 눌러주세요. 수정 이력은 관리자/담임교사에게 기록됩니다.</p>
        </div>

        <!-- 1) 수능 응시 토글 -->
        <div class="ei-edit-box">
          <div class="ei-edit-box-header">
            <span class="ei-edit-box-num">1</span>
            <span class="ei-edit-box-title">수능(대학수학능력시험) 응시</span>
          </div>
          <div class="ei-toggle-group">
            <button
              type="button"
              @click="form.csat_intent = 'TAKE'"
              :class="['ei-toggle-btn', { active: form.csat_intent === 'TAKE' }]"
            >
              ✔ 응시합니다
            </button>
            <button
              type="button"
              @click="form.csat_intent = 'NO_TAKE'"
              :class="['ei-toggle-btn', 'btn-no', { active: form.csat_intent === 'NO_TAKE' }]"
            >
              ✖ 미응시합니다
            </button>
          </div>
          <div v-if="form.csat_intent === 'NO_TAKE'" class="ei-edit-reason-area">
            <div class="ei-reason-chips">
              <button type="button" v-for="r in csatReasons" :key="r" @click="form.csat_no_take_reason = r"
                :class="['ei-chip', { active: form.csat_no_take_reason === r }]">{{ r }}</button>
            </div>
            <input
              v-if="form.csat_no_take_reason === '기타'"
              v-model="form.csat_no_take_reason_detail"
              type="text"
              class="ei-input mt-2"
              placeholder="기타 미응시 사유 입력"
            />
          </div>
        </div>

        <!-- 2) (일반대·과기원) 수시 토글 -->
        <div class="ei-edit-box">
          <div class="ei-edit-box-header">
            <span class="ei-edit-box-num">2</span>
            <span class="ei-edit-box-title">(일반대 · 과기원) 수시 원서접수</span>
          </div>
          <div class="ei-toggle-group">
            <button
              type="button"
              @click="form.susi_general_intent = 'APPLY'"
              :class="['ei-toggle-btn', { active: form.susi_general_intent === 'APPLY' }]"
            >
              ✔ 접수합니다
            </button>
            <button
              type="button"
              @click="form.susi_general_intent = 'NO_APPLY'"
              :class="['ei-toggle-btn', 'btn-no', { active: form.susi_general_intent === 'NO_APPLY' }]"
            >
              ✖ 미접수합니다
            </button>
          </div>
          <div v-if="form.susi_general_intent === 'NO_APPLY'" class="ei-edit-reason-area">
            <div class="ei-reason-chips">
              <button type="button" v-for="r in applyReasons" :key="r" @click="form.susi_general_no_reason = r"
                :class="['ei-chip', { active: form.susi_general_no_reason === r }]">{{ r }}</button>
            </div>
            <input
              v-if="form.susi_general_no_reason === '기타'"
              v-model="form.susi_general_no_reason_detail"
              type="text"
              class="ei-input mt-2"
              placeholder="기타 미접수 사유 입력"
            />
          </div>
        </div>

        <!-- 3) (일반대·과기원) 정시 토글 -->
        <div class="ei-edit-box">
          <div class="ei-edit-box-header">
            <span class="ei-edit-box-num">3</span>
            <span class="ei-edit-box-title">(일반대 · 과기원) 정시 원서접수</span>
          </div>
          <div class="ei-toggle-group">
            <button
              type="button"
              @click="form.jungsi_general_intent = 'APPLY'"
              :class="['ei-toggle-btn', { active: form.jungsi_general_intent === 'APPLY' }]"
            >
              ✔ 접수합니다
            </button>
            <button
              type="button"
              @click="form.jungsi_general_intent = 'NO_APPLY'"
              :class="['ei-toggle-btn', 'btn-no', { active: form.jungsi_general_intent === 'NO_APPLY' }]"
            >
              ✖ 미접수합니다
            </button>
          </div>
          <div v-if="form.jungsi_general_intent === 'NO_APPLY'" class="ei-edit-reason-area">
            <div class="ei-reason-chips">
              <button type="button" v-for="r in generalJungsiReasons" :key="r" @click="form.jungsi_general_no_reason = r"
                :class="['ei-chip', { active: form.jungsi_general_no_reason === r }]">{{ r }}</button>
            </div>
            <input
              v-if="form.jungsi_general_no_reason === '기타'"
              v-model="form.jungsi_general_no_reason_detail"
              type="text"
              class="ei-input mt-2"
              placeholder="기타 미접수 사유 입력"
            />
          </div>
        </div>

        <!-- 4) (전문대) 수시 토글 -->
        <div class="ei-edit-box">
          <div class="ei-edit-box-header">
            <span class="ei-edit-box-num">4</span>
            <span class="ei-edit-box-title">(전문대) 수시 원서접수</span>
          </div>
          <div class="ei-toggle-group">
            <button
              type="button"
              @click="form.susi_college_intent = 'APPLY'"
              :class="['ei-toggle-btn', { active: form.susi_college_intent === 'APPLY' }]"
            >
              ✔ 접수합니다
            </button>
            <button
              type="button"
              @click="form.susi_college_intent = 'NO_APPLY'"
              :class="['ei-toggle-btn', 'btn-no', { active: form.susi_college_intent === 'NO_APPLY' }]"
            >
              ✖ 미접수합니다
            </button>
          </div>
          <div v-if="form.susi_college_intent === 'NO_APPLY'" class="ei-edit-reason-area">
            <div class="ei-reason-chips">
              <button type="button" v-for="r in collegeApplyReasons" :key="r" @click="form.susi_college_no_reason = r"
                :class="['ei-chip', { active: form.susi_college_no_reason === r }]">{{ r }}</button>
            </div>
            <input
              v-if="form.susi_college_no_reason === '기타'"
              v-model="form.susi_college_no_reason_detail"
              type="text"
              class="ei-input mt-2"
              placeholder="기타 미접수 사유 입력"
            />
          </div>
        </div>

        <!-- 5) (전문대) 정시 토글 -->
        <div class="ei-edit-box">
          <div class="ei-edit-box-header">
            <span class="ei-edit-box-num">5</span>
            <span class="ei-edit-box-title">(전문대) 정시 원서접수</span>
          </div>
          <div class="ei-toggle-group">
            <button
              type="button"
              @click="form.jungsi_college_intent = 'APPLY'"
              :class="['ei-toggle-btn', { active: form.jungsi_college_intent === 'APPLY' }]"
            >
              ✔ 접수합니다
            </button>
            <button
              type="button"
              @click="form.jungsi_college_intent = 'NO_APPLY'"
              :class="['ei-toggle-btn', 'btn-no', { active: form.jungsi_college_intent === 'NO_APPLY' }]"
            >
              ✖ 미접수합니다
            </button>
          </div>
          <div v-if="form.jungsi_college_intent === 'NO_APPLY'" class="ei-edit-reason-area">
            <div class="ei-reason-chips">
              <button type="button" v-for="r in collegeJungsiReasons" :key="r" @click="form.jungsi_college_no_reason = r"
                :class="['ei-chip', { active: form.jungsi_college_no_reason === r }]">{{ r }}</button>
            </div>
            <input
              v-if="form.jungsi_college_no_reason === '기타'"
              v-model="form.jungsi_college_no_reason_detail"
              type="text"
              class="ei-input mt-2"
              placeholder="기타 미접수 사유 입력"
            />
          </div>
        </div>

        <!-- 수정 사유 메모 -->
        <div class="ei-field mt-4">
          <label class="ei-label">변경 사유 메모 (선택 사항)</label>
          <input type="text" v-model="form.edit_memo" class="ei-input" placeholder="계획 변경 사유를 간략히 입력해 주세요 (예: 진로 변경으로 인한 미응시 전환 등)" />
        </div>

        <!-- 수정 저장 액션 버튼 -->
        <div class="ei-edit-actions">
          <button @click="cancelEditMode" class="ei-btn-secondary">취소</button>
          <button @click="saveEditSurvey" :disabled="submitting" class="ei-btn-primary">
            {{ submitting ? '저장 중...' : '💾 변경 사항 저장' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 최초 등록 위저드 (아직 한 번도 등록 안 한 학생) -->
    <div v-else class="ei-container">
      <!-- 진행 스텝 표시 (총 7단계) -->
      <div class="ei-steps">
        <div v-for="s in 7" :key="s" :class="['ei-step', { active: step >= s, current: step === s }]">
          <div class="ei-step-dot">{{ s }}</div>
          <span class="ei-step-label">{{ stepLabels[s - 1] }}</span>
        </div>
      </div>

      <!-- Step 1: 수능 응시 여부 -->
      <div v-if="step === 1" class="ei-step-content">
        <h2 class="ei-step-title">📝 1. 수능(대학수학능력시험) 응시 여부</h2>
        <p class="ei-step-desc">2027학년도 대학수학능력시험에 응시하시나요?</p>

        <div class="ei-choice-grid">
          <button
            @click="form.csat_intent = 'TAKE'"
            :class="['ei-choice-card', { selected: form.csat_intent === 'TAKE' }]"
          >
            <span class="ei-choice-icon">✅</span>
            <span class="ei-choice-text">수능 응시합니다</span>
            <span class="ei-choice-sub">수능에 접수하여 시험에 응시합니다.</span>
          </button>
          <button
            @click="form.csat_intent = 'NO_TAKE'"
            :class="['ei-choice-card', 'card-red', { selected: form.csat_intent === 'NO_TAKE' }]"
          >
            <span class="ei-choice-icon">❌</span>
            <span class="ei-choice-text">수능 미응시합니다</span>
            <span class="ei-choice-sub">수능에 응시하지 않겠습니다.</span>
          </button>
        </div>

        <!-- 미응시 사유 (미응시 선택 시) -->
        <div v-if="form.csat_intent === 'NO_TAKE'" class="ei-reason-section">
          <label class="ei-label">수능 미응시 사유를 선택해 주세요</label>
          <div class="ei-reason-chips">
            <button v-for="r in csatReasons" :key="r" @click="form.csat_no_take_reason = r"
              :class="['ei-chip', { active: form.csat_no_take_reason === r }]">{{ r }}</button>
          </div>
          <textarea
            v-if="form.csat_no_take_reason === '기타'"
            v-model="form.csat_no_take_reason_detail"
            class="ei-textarea"
            placeholder="기타 사유를 입력해 주세요..."
            rows="2"
          ></textarea>
        </div>

        <div class="ei-nav-buttons">
          <button @click="cancelEditing" v-if="isEditing" class="ei-btn-secondary">취소</button>
          <button @click="goStep(2)" :disabled="!form.csat_intent" class="ei-btn-primary">다음 →</button>
        </div>
      </div>

      <!-- Step 2: (일반대 · 과기원) 수시 접수 여부 -->
      <div v-if="step === 2" class="ei-step-content">
        <h2 class="ei-step-title">📋 2. (일반대 · 과기원) 수시원서 접수 여부</h2>
        <p class="ei-step-desc">4년제 일반대학 및 과학기술원(KAIST, UNIST 등) 수시모집에 원서를 접수하시나요?</p>

        <div class="ei-choice-grid">
          <button
            @click="form.susi_general_intent = 'APPLY'"
            :class="['ei-choice-card', { selected: form.susi_general_intent === 'APPLY' }]"
          >
            <span class="ei-choice-icon">✅</span>
            <span class="ei-choice-text">수시 접수합니다</span>
            <span class="ei-choice-sub">일반대/과기원 수시원서를 접수할 예정입니다.</span>
          </button>
          <button
            @click="form.susi_general_intent = 'NO_APPLY'"
            :class="['ei-choice-card', 'card-red', { selected: form.susi_general_intent === 'NO_APPLY' }]"
          >
            <span class="ei-choice-icon">❌</span>
            <span class="ei-choice-text">수시 미접수합니다</span>
            <span class="ei-choice-sub">일반대/과기원 수시원서를 접수하지 않겠습니다.</span>
          </button>
        </div>

        <div v-if="form.susi_general_intent === 'NO_APPLY'" class="ei-reason-section">
          <label class="ei-label">미접수 사유를 선택해 주세요</label>
          <div class="ei-reason-chips">
            <button v-for="r in applyReasons" :key="r" @click="form.susi_general_no_reason = r"
              :class="['ei-chip', { active: form.susi_general_no_reason === r }]">{{ r }}</button>
          </div>
          <textarea
            v-if="form.susi_general_no_reason === '기타'"
            v-model="form.susi_general_no_reason_detail"
            class="ei-textarea"
            placeholder="기타 사유를 입력해 주세요..."
            rows="2"
          ></textarea>
        </div>

        <div class="ei-nav-buttons">
          <button @click="goStep(1)" class="ei-btn-secondary">← 이전</button>
          <button @click="goStep(3)" :disabled="!form.susi_general_intent" class="ei-btn-primary">다음 →</button>
        </div>
      </div>

      <!-- Step 3: (일반대 · 과기원) 정시 접수 여부 -->
      <div v-if="step === 3" class="ei-step-content">
        <h2 class="ei-step-title">🎯 3. (일반대 · 과기원) 정시원서 접수 여부</h2>
        <p class="ei-step-desc">4년제 일반대학 및 과학기술원 정시모집(가/나/다군)에 원서를 접수할 예정인가요?</p>

        <div class="ei-choice-grid">
          <button
            @click="form.jungsi_general_intent = 'APPLY'"
            :class="['ei-choice-card', { selected: form.jungsi_general_intent === 'APPLY' }]"
          >
            <span class="ei-choice-icon">✅</span>
            <span class="ei-choice-text">정시 접수합니다</span>
            <span class="ei-choice-sub">일반대/과기원 정시모집 원서를 접수할 예정입니다.</span>
          </button>
          <button
            @click="form.jungsi_general_intent = 'NO_APPLY'"
            :class="['ei-choice-card', 'card-red', { selected: form.jungsi_general_intent === 'NO_APPLY' }]"
          >
            <span class="ei-choice-icon">❌</span>
            <span class="ei-choice-text">정시 미접수합니다</span>
            <span class="ei-choice-sub">일반대/과기원 정시원서를 접수하지 않겠습니다.</span>
          </button>
        </div>

        <div v-if="form.jungsi_general_intent === 'NO_APPLY'" class="ei-reason-section">
          <label class="ei-label">미접수 사유를 선택해 주세요</label>
          <div class="ei-reason-chips">
            <button v-for="r in generalJungsiReasons" :key="r" @click="form.jungsi_general_no_reason = r"
              :class="['ei-chip', { active: form.jungsi_general_no_reason === r }]">{{ r }}</button>
          </div>
          <textarea
            v-if="form.jungsi_general_no_reason === '기타'"
            v-model="form.jungsi_general_no_reason_detail"
            class="ei-textarea"
            placeholder="기타 사유를 입력해 주세요..."
            rows="2"
          ></textarea>
        </div>

        <div class="ei-nav-buttons">
          <button @click="goStep(2)" class="ei-btn-secondary">← 이전</button>
          <button @click="goStep(4)" :disabled="!form.jungsi_general_intent" class="ei-btn-primary">다음 →</button>
        </div>
      </div>

      <!-- Step 4: (전문대) 수시 접수 여부 -->
      <div v-if="step === 4" class="ei-step-content">
        <h2 class="ei-step-title">🏫 4. (전문대) 수시원서 접수 여부</h2>
        <p class="ei-step-desc">전문대학 수시모집(1차/2차)에 원서를 접수하시나요?</p>

        <div class="ei-choice-grid">
          <button
            @click="form.susi_college_intent = 'APPLY'"
            :class="['ei-choice-card', { selected: form.susi_college_intent === 'APPLY' }]"
          >
            <span class="ei-choice-icon">✅</span>
            <span class="ei-choice-text">전문대 수시 접수합니다</span>
            <span class="ei-choice-sub">전문대학 수시모집 원서를 접수할 예정입니다.</span>
          </button>
          <button
            @click="form.susi_college_intent = 'NO_APPLY'"
            :class="['ei-choice-card', 'card-red', { selected: form.susi_college_intent === 'NO_APPLY' }]"
          >
            <span class="ei-choice-icon">❌</span>
            <span class="ei-choice-text">전문대 수시 미접수합니다</span>
            <span class="ei-choice-sub">전문대학 수시원서를 접수하지 않겠습니다.</span>
          </button>
        </div>

        <div v-if="form.susi_college_intent === 'NO_APPLY'" class="ei-reason-section">
          <label class="ei-label">미접수 사유를 선택해 주세요</label>
          <div class="ei-reason-chips">
            <button v-for="r in collegeApplyReasons" :key="r" @click="form.susi_college_no_reason = r"
              :class="['ei-chip', { active: form.susi_college_no_reason === r }]">{{ r }}</button>
          </div>
          <textarea
            v-if="form.susi_college_no_reason === '기타'"
            v-model="form.susi_college_no_reason_detail"
            class="ei-textarea"
            placeholder="기타 사유를 입력해 주세요..."
            rows="2"
          ></textarea>
        </div>

        <div class="ei-nav-buttons">
          <button @click="goStep(3)" class="ei-btn-secondary">← 이전</button>
          <button @click="goStep(5)" :disabled="!form.susi_college_intent" class="ei-btn-primary">다음 →</button>
        </div>
      </div>

      <!-- Step 5: (전문대) 정시 접수 여부 -->
      <div v-if="step === 5" class="ei-step-content">
        <h2 class="ei-step-title">🏢 5. (전문대) 정시원서 접수 여부</h2>
        <p class="ei-step-desc">전문대학 정시모집에 원서를 접수할 예정인가요?</p>

        <div class="ei-choice-grid">
          <button
            @click="form.jungsi_college_intent = 'APPLY'"
            :class="['ei-choice-card', { selected: form.jungsi_college_intent === 'APPLY' }]"
          >
            <span class="ei-choice-icon">✅</span>
            <span class="ei-choice-text">전문대 정시 접수합니다</span>
            <span class="ei-choice-sub">전문대학 정시모집 원서를 접수할 예정입니다.</span>
          </button>
          <button
            @click="form.jungsi_college_intent = 'NO_APPLY'"
            :class="['ei-choice-card', 'card-red', { selected: form.jungsi_college_intent === 'NO_APPLY' }]"
          >
            <span class="ei-choice-icon">❌</span>
            <span class="ei-choice-text">전문대 정시 미접수합니다</span>
            <span class="ei-choice-sub">전문대학 정시원서를 접수하지 않겠습니다.</span>
          </button>
        </div>

        <div v-if="form.jungsi_college_intent === 'NO_APPLY'" class="ei-reason-section">
          <label class="ei-label">미접수 사유를 선택해 주세요</label>
          <div class="ei-reason-chips">
            <button v-for="r in collegeJungsiReasons" :key="r" @click="form.jungsi_college_no_reason = r"
              :class="['ei-chip', { active: form.jungsi_college_no_reason === r }]">{{ r }}</button>
          </div>
          <textarea
            v-if="form.jungsi_college_no_reason === '기타'"
            v-model="form.jungsi_college_no_reason_detail"
            class="ei-textarea"
            placeholder="기타 사유를 입력해 주세요..."
            rows="2"
          ></textarea>
        </div>

        <div class="ei-nav-buttons">
          <button @click="goStep(4)" class="ei-btn-secondary">← 이전</button>
          <button @click="goStep(6)" :disabled="!form.jungsi_college_intent" class="ei-btn-primary">다음 →</button>
        </div>
      </div>

      <!-- Step 6: 전자 서명 -->
      <div v-if="step === 6" class="ei-step-content">
        <h2 class="ei-step-title">✍️ 6. 전자 서명</h2>
        <p class="ei-step-desc">학생 및 보호자의 서명을 입력해 주세요. (종이 수기 서명을 원하시면 건너뛸 수 있습니다.)</p>

        <!-- 보호자 성명 -->
        <div class="ei-field">
          <label class="ei-label">보호자 성명</label>
          <input type="text" v-model="form.parent_name" class="ei-input" placeholder="보호자 성명을 입력해 주세요" />
        </div>

        <!-- 학생 서명 -->
        <div class="ei-sig-section">
          <div class="ei-sig-header">
            <span class="ei-sig-title">학생 서명</span>
            <button @click="clearCanvas('student')" class="ei-btn-clear">지우기</button>
          </div>
          <canvas
            ref="studentCanvasRef"
            class="ei-sig-canvas"
            @mousedown="startDraw($event, 'student')"
            @mousemove="draw($event, 'student')"
            @mouseup="endDraw('student')"
            @mouseleave="endDraw('student')"
            @touchstart.prevent="startDrawTouch($event, 'student')"
            @touchmove.prevent="drawTouch($event, 'student')"
            @touchend="endDraw('student')"
          ></canvas>
        </div>

        <!-- 보호자 서명 -->
        <div class="ei-sig-section">
          <div class="ei-sig-header">
            <span class="ei-sig-title">보호자 서명</span>
            <button @click="clearCanvas('parent')" class="ei-btn-clear">지우기</button>
          </div>
          <canvas
            ref="parentCanvasRef"
            class="ei-sig-canvas"
            @mousedown="startDraw($event, 'parent')"
            @mousemove="draw($event, 'parent')"
            @mouseup="endDraw('parent')"
            @mouseleave="endDraw('parent')"
            @touchstart.prevent="startDrawTouch($event, 'parent')"
            @touchmove.prevent="drawTouch($event, 'parent')"
            @touchend="endDraw('parent')"
          ></canvas>
        </div>

        <div class="ei-nav-buttons">
          <button @click="goStep(5)" class="ei-btn-secondary">← 이전</button>
          <button @click="goStep(7)" class="ei-btn-primary">다음 →</button>
        </div>
      </div>

      <!-- Step 7: 확인 및 제출 -->
      <div v-if="step === 7" class="ei-step-content">
        <h2 class="ei-step-title">📄 7. 등록 내용 최종 확인</h2>
        <p class="ei-step-desc">아래 내용을 확인한 후 제출해 주세요.</p>

        <div class="ei-confirm-card">
          <!-- 수능 -->
          <div class="ei-confirm-row">
            <span class="ei-confirm-label">수능 응시</span>
            <span :class="['ei-summary-badge', form.csat_intent === 'TAKE' ? 'badge-blue' : 'badge-red']">
              {{ form.csat_intent === 'TAKE' ? '✔ 응시' : '✖ 미응시' }}
            </span>
          </div>
          <div v-if="form.csat_intent === 'NO_TAKE'" class="ei-confirm-reason">
            사유: {{ finalCsatReason }}
          </div>

          <!-- (일반대/과기원) 수시 -->
          <div class="ei-confirm-row">
            <span class="ei-confirm-label">(일반대·과기원) 수시</span>
            <span :class="['ei-summary-badge', form.susi_general_intent === 'APPLY' ? 'badge-blue' : 'badge-red']">
              {{ form.susi_general_intent === 'APPLY' ? '✔ 접수 예정' : '✖ 미접수' }}
            </span>
          </div>
          <div v-if="form.susi_general_intent === 'NO_APPLY'" class="ei-confirm-reason">
            사유: {{ finalGenSusiReason }}
          </div>

          <!-- (일반대/과기원) 정시 -->
          <div class="ei-confirm-row">
            <span class="ei-confirm-label">(일반대·과기원) 정시</span>
            <span :class="['ei-summary-badge', form.jungsi_general_intent === 'APPLY' ? 'badge-blue' : 'badge-red']">
              {{ form.jungsi_general_intent === 'APPLY' ? '✔ 접수 예정' : '✖ 미접수' }}
            </span>
          </div>
          <div v-if="form.jungsi_general_intent === 'NO_APPLY'" class="ei-confirm-reason">
            사유: {{ finalGenJungsiReason }}
          </div>

          <!-- (전문대) 수시 -->
          <div class="ei-confirm-row">
            <span class="ei-confirm-label">(전문대) 수시</span>
            <span :class="['ei-summary-badge', form.susi_college_intent === 'APPLY' ? 'badge-blue' : 'badge-red']">
              {{ form.susi_college_intent === 'APPLY' ? '✔ 접수 예정' : '✖ 미접수' }}
            </span>
          </div>
          <div v-if="form.susi_college_intent === 'NO_APPLY'" class="ei-confirm-reason">
            사유: {{ finalColSusiReason }}
          </div>

          <!-- (전문대) 정시 -->
          <div class="ei-confirm-row">
            <span class="ei-confirm-label">(전문대) 정시</span>
            <span :class="['ei-summary-badge', form.jungsi_college_intent === 'APPLY' ? 'badge-blue' : 'badge-red']">
              {{ form.jungsi_college_intent === 'APPLY' ? '✔ 접수 예정' : '✖ 미접수' }}
            </span>
          </div>
          <div v-if="form.jungsi_college_intent === 'NO_APPLY'" class="ei-confirm-reason">
            사유: {{ finalColJungsiReason }}
          </div>

          <div class="ei-confirm-row">
            <span class="ei-confirm-label">보호자</span>
            <span class="ei-confirm-value">{{ form.parent_name || '(미입력)' }}</span>
          </div>
          <div class="ei-confirm-row">
            <span class="ei-confirm-label">학생 서명</span>
            <span class="ei-confirm-value">{{ studentSigData ? '✔ 입력됨' : '미입력 (종이 제출)' }}</span>
          </div>
          <div class="ei-confirm-row">
            <span class="ei-confirm-label">보호자 서명</span>
            <span class="ei-confirm-value">{{ parentSigData ? '✔ 입력됨' : '미입력 (종이 제출)' }}</span>
          </div>
        </div>

        <div class="ei-nav-buttons">
          <button @click="goStep(6)" class="ei-btn-secondary">← 이전</button>
          <button @click="submitSurvey" :disabled="submitting" class="ei-btn-submit">
            {{ submitting ? '저장 중...' : '✅ 최종 등록 제출' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { schoolName, fetchSchoolName } from '../utils/schoolConfig'
import { getMyIntentSurvey, upsertIntentSurvey, getStudentIdByCode } from '../api/examIntentApi'
import { printCsatNoTakeForm, printSusiNoApplyForm } from '../utils/printTemplates'
import { dialog } from '../components/common/dialog'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(true)
const step = ref(1)
const isCompleted = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const survey = ref(null)

const stepLabels = ['수능', '일반대 수시', '일반대 정시', '전문대 수시', '전문대 정시', '서명', '확인']

const csatReasons = ['수시 파이터', '기타']
const applyReasons = ['전문대 수시만 접수', '정시 파이터', '기타']
const generalJungsiReasons = ['수시 파이터', '전문대 정시만 지원', '기타']
const collegeApplyReasons = ['일반대 수시만 지원', '정시 파이터', '기타']
const collegeJungsiReasons = ['수시 파이터', '일반대 정시만 지원', '기타']

const form = reactive({
  csat_intent: null,
  csat_no_take_reason: null,
  csat_no_take_reason_detail: '',
  susi_general_intent: null,
  susi_general_no_reason: null,
  susi_general_no_reason_detail: '',
  jungsi_general_intent: null,
  jungsi_general_no_reason: null,
  jungsi_general_no_reason_detail: '',
  susi_college_intent: null,
  susi_college_no_reason: null,
  susi_college_no_reason_detail: '',
  jungsi_college_intent: null,
  jungsi_college_no_reason: null,
  jungsi_college_no_reason_detail: '',
  parent_name: '',
  edit_memo: ''
})

// 서명 캔버스 refs
const studentCanvasRef = ref(null)
const parentCanvasRef = ref(null)
const isDrawing = ref({ student: false, parent: false })
const studentSigData = ref(null)
const parentSigData = ref(null)

const finalCsatReason = computed(() => {
  if (form.csat_no_take_reason === '기타') return form.csat_no_take_reason_detail || '기타'
  return form.csat_no_take_reason || ''
})

const finalGenSusiReason = computed(() => {
  if (form.susi_general_no_reason === '기타') return form.susi_general_no_reason_detail || '기타'
  return form.susi_general_no_reason || ''
})

const finalGenJungsiReason = computed(() => {
  if (form.jungsi_general_no_reason === '기타') return form.jungsi_general_no_reason_detail || '기타'
  return form.jungsi_general_no_reason || ''
})

const finalColSusiReason = computed(() => {
  if (form.susi_college_no_reason === '기타') return form.susi_college_no_reason_detail || '기타'
  return form.susi_college_no_reason || ''
})

const finalColJungsiReason = computed(() => {
  if (form.jungsi_college_no_reason === '기타') return form.jungsi_college_no_reason_detail || '기타'
  return form.jungsi_college_no_reason || ''
})

// 원서 미접수 항목이 1개라도 있는지 여부
const hasAnyNoApply = computed(() => {
  if (!survey.value) return false
  const genSusi = survey.value.susi_general_intent || survey.value.susi_intent || 'APPLY'
  const genJung = survey.value.jungsi_general_intent || survey.value.jungsi_intent || 'APPLY'
  const colSusi = survey.value.susi_college_intent || 'APPLY'
  const colJung = survey.value.jungsi_college_intent || 'APPLY'
  return genSusi === 'NO_APPLY' || genJung === 'NO_APPLY' || colSusi === 'NO_APPLY' || colJung === 'NO_APPLY'
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function goStep(s) {
  step.value = s
  window.scrollTo({ top: 0, behavior: 'smooth' })
  if (s === 6) {
    nextTick(() => {
      initCanvas('student')
      initCanvas('parent')
    })
  }
}

function cancelEditing() {
  isEditing.value = false
  step.value = 1
}

// ===== 서명 캔버스 =====
function getCanvas(type) {
  return type === 'student' ? studentCanvasRef.value : parentCanvasRef.value
}

function initCanvas(type) {
  const canvas = getCanvas(type)
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * 2
  canvas.height = rect.height * 2
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // 기존 서명 복원
  const existingSig = type === 'student' ? studentSigData.value : parentSigData.value
  if (existingSig) {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, rect.width, rect.height)
    }
    img.src = existingSig
  }
}

function clearCanvas(type) {
  const canvas = getCanvas(type)
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (type === 'student') studentSigData.value = null
  else parentSigData.value = null
}

function getPos(e, canvas) {
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function startDraw(e, type) {
  isDrawing.value[type] = true
  const canvas = getCanvas(type)
  const ctx = canvas.getContext('2d')
  const pos = getPos(e, canvas)
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
}

function draw(e, type) {
  if (!isDrawing.value[type]) return
  const canvas = getCanvas(type)
  const ctx = canvas.getContext('2d')
  const pos = getPos(e, canvas)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
}

function endDraw(type) {
  if (!isDrawing.value[type]) return
  isDrawing.value[type] = false
  saveCanvasData(type)
}

function startDrawTouch(e, type) {
  const touch = e.touches[0]
  const canvas = getCanvas(type)
  const rect = canvas.getBoundingClientRect()
  isDrawing.value[type] = true
  const ctx = canvas.getContext('2d')
  ctx.beginPath()
  ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top)
}

function drawTouch(e, type) {
  if (!isDrawing.value[type]) return
  const touch = e.touches[0]
  const canvas = getCanvas(type)
  const ctx = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()
  ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top)
  ctx.stroke()
}

function saveCanvasData(type) {
  const canvas = getCanvas(type)
  if (!canvas) return
  const dataUrl = canvas.toDataURL('image/png')
  if (type === 'student') studentSigData.value = dataUrl
  else parentSigData.value = dataUrl
}

const showHistory = ref(false)

function startEditMode() {
  isEditing.value = true
  // 기존 등록 내용으로 form 세팅
  if (survey.value) {
    form.csat_intent = survey.value.csat_intent || 'TAKE'
    form.csat_no_take_reason = survey.value.csat_no_take_reason || null
    form.csat_no_take_reason_detail = survey.value.csat_no_take_reason || ''

    form.susi_general_intent = survey.value.susi_general_intent || survey.value.susi_intent || 'APPLY'
    form.susi_general_no_reason = survey.value.susi_general_no_reason || survey.value.susi_no_apply_reason || null
    form.susi_general_no_reason_detail = survey.value.susi_general_no_reason || survey.value.susi_no_apply_reason || ''

    form.jungsi_general_intent = survey.value.jungsi_general_intent || survey.value.jungsi_intent || 'APPLY'
    form.jungsi_general_no_reason = survey.value.jungsi_general_no_reason || survey.value.jungsi_no_reason || null
    form.jungsi_general_no_reason_detail = survey.value.jungsi_general_no_reason || survey.value.jungsi_no_reason || ''

    form.susi_college_intent = survey.value.susi_college_intent || 'APPLY'
    form.susi_college_no_reason = survey.value.susi_college_no_reason || null
    form.susi_college_no_reason_detail = survey.value.susi_college_no_reason || ''

    form.jungsi_college_intent = survey.value.jungsi_college_intent || 'APPLY'
    form.jungsi_college_no_reason = survey.value.jungsi_college_no_reason || null
    form.jungsi_college_no_reason_detail = survey.value.jungsi_college_no_reason || ''

    form.parent_name = survey.value.parent_name || ''
    form.edit_memo = ''
  }
}

function cancelEditMode() {
  isEditing.value = false
}

async function saveEditSurvey() {
  submitting.value = true
  try {
    const studentId = await getStudentIdByCode(auth.studentCode)

    const payload = {
      student_id: studentId,
      student_code: auth.studentCode,
      csat_intent: form.csat_intent,
      csat_no_take_reason: form.csat_intent === 'NO_TAKE' ? finalCsatReason.value : null,
      susi_general_intent: form.susi_general_intent,
      susi_general_no_reason: form.susi_general_intent === 'NO_APPLY' ? finalGenSusiReason.value : null,
      jungsi_general_intent: form.jungsi_general_intent,
      jungsi_general_no_reason: form.jungsi_general_intent === 'NO_APPLY' ? finalGenJungsiReason.value : null,
      susi_college_intent: form.susi_college_intent,
      susi_college_no_reason: form.susi_college_intent === 'NO_APPLY' ? finalColSusiReason.value : null,
      jungsi_college_intent: form.jungsi_college_intent,
      jungsi_college_no_reason: form.jungsi_college_intent === 'NO_APPLY' ? finalColJungsiReason.value : null,
      student_signature: studentSigData.value || survey.value?.student_signature,
      parent_signature: parentSigData.value || survey.value?.parent_signature,
      parent_name: form.parent_name || survey.value?.parent_name || null,
      memo: form.edit_memo || '학생 본인에 의한 계획 수정'
    }

    const result = await upsertIntentSurvey(payload, { name: auth.studentName, role: 'student' })
    survey.value = result
    isCompleted.value = true
    isEditing.value = false

    await dialog.alert({ title: '✅ 수정 완료', message: '의향 조사 변경 사항이 안전하게 저장되었습니다.' })
  } catch (e) {
    console.error('saveEditSurvey error:', e)
    await dialog.alert({ title: '오류', message: '수정 중 오류가 발생했습니다: ' + (e.message || e) })
  } finally {
    submitting.value = false
  }
}

// ===== 제출 (최초 등록) =====
async function submitSurvey() {
  submitting.value = true
  try {
    const studentId = await getStudentIdByCode(auth.studentCode)

    const payload = {
      student_id: studentId,
      student_code: auth.studentCode,
      csat_intent: form.csat_intent,
      csat_no_take_reason: form.csat_intent === 'NO_TAKE' ? finalCsatReason.value : null,
      susi_general_intent: form.susi_general_intent,
      susi_general_no_reason: form.susi_general_intent === 'NO_APPLY' ? finalGenSusiReason.value : null,
      jungsi_general_intent: form.jungsi_general_intent,
      jungsi_general_no_reason: form.jungsi_general_intent === 'NO_APPLY' ? finalGenJungsiReason.value : null,
      susi_college_intent: form.susi_college_intent,
      susi_college_no_reason: form.susi_college_intent === 'NO_APPLY' ? finalColSusiReason.value : null,
      jungsi_college_intent: form.jungsi_college_intent,
      jungsi_college_no_reason: form.jungsi_college_intent === 'NO_APPLY' ? finalColJungsiReason.value : null,
      student_signature: studentSigData.value,
      parent_signature: parentSigData.value,
      parent_name: form.parent_name || null
    }

    const result = await upsertIntentSurvey(payload, { name: auth.studentName, role: 'student' })
    survey.value = result
    isCompleted.value = true
    isEditing.value = false
    step.value = 1
    await dialog.alert({ title: '✅ 등록 완료', message: '수능 및 대입 원서접수 의향이 성공적으로 등록되었습니다.' })
  } catch (e) {
    console.error('submitSurvey error:', e)
    await dialog.alert({ title: '등록 오류', message: '등록 중 오류가 발생했습니다: ' + (e.message || e) })
  } finally {
    submitting.value = false
  }
}

// ===== 인쇄 =====
function printCsatForm() {
  const student = {
    name: auth.studentName,
    grade: auth.grade,
    class_no: auth.classNo,
    student_no: auth.seqNo,
    student_code: auth.studentCode
  }
  printCsatNoTakeForm(student, survey.value)
}

function printSusiForm() {
  const student = {
    name: auth.studentName,
    grade: auth.grade,
    class_no: auth.classNo,
    student_no: auth.seqNo,
    student_code: auth.studentCode
  }
  printSusiNoApplyForm(student, survey.value)
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

onMounted(async () => {
  fetchSchoolName()
  loading.value = true
  try {
    const data = await getMyIntentSurvey(auth.studentCode)
    if (data && data.confirmed_at) {
      survey.value = data
      isCompleted.value = true
      // form에도 로드
      form.csat_intent = data.csat_intent || 'TAKE'
      form.csat_no_take_reason = data.csat_no_take_reason || null
      form.susi_general_intent = data.susi_general_intent || data.susi_intent || 'APPLY'
      form.susi_general_no_reason = data.susi_general_no_reason || data.susi_no_apply_reason || null
      form.jungsi_general_intent = data.jungsi_general_intent || data.jungsi_intent || 'APPLY'
      form.jungsi_general_no_reason = data.jungsi_general_no_reason || data.jungsi_no_reason || null
      form.susi_college_intent = data.susi_college_intent || 'APPLY'
      form.susi_college_no_reason = data.susi_college_no_reason || null
      form.jungsi_college_intent = data.jungsi_college_intent || 'APPLY'
      form.jungsi_college_no_reason = data.jungsi_college_no_reason || null
      form.parent_name = data.parent_name || ''
      studentSigData.value = data.student_signature || null
      parentSigData.value = data.parent_signature || null
    }
  } catch (e) {
    console.warn('Failed to load intent survey:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ===== Mobile-First Exam Intent Student View ===== */
.ei-student-root {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8ecf4 100%);
  font-family: 'Pretendard', -apple-system, sans-serif;
  color: #1e293b;
  -webkit-font-smoothing: antialiased;
}

/* Header */
.ei-header {
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(148,163,184,0.2);
  position: sticky;
  top: 0;
  z-index: 50;
}
.ei-header-inner {
  max-width: 640px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ei-header-left { display: flex; align-items: center; gap: 10px; }
.ei-logo {
  width: 38px; height: 38px; border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  color: white; box-shadow: 0 2px 8px rgba(99,102,241,0.3);
}
.ei-header-titles { display: flex; flex-direction: column; }
.ei-school-tag { font-size: 10px; font-weight: 800; color: #6366f1; letter-spacing: 0.03em; }
.ei-page-title { font-size: 15px; font-weight: 800; color: #1e293b; margin: 0; }
.ei-header-right { display: flex; gap: 6px; }
.ei-btn-ghost {
  font-size: 12px; font-weight: 700; color: #64748b;
  background: #f1f5f9; border: 1px solid #e2e8f0;
  padding: 6px 12px; border-radius: 8px; cursor: pointer;
  transition: all 0.2s;
}
.ei-btn-ghost:hover { background: #e2e8f0; color: #1e293b; }

.ei-student-bar {
  max-width: 640px; margin: 0 auto;
  padding: 8px 20px 12px; display: flex; align-items: center; gap: 8px;
}
.ei-student-name { font-size: 14px; font-weight: 800; color: #334155; }
.ei-student-info { font-size: 12px; font-weight: 600; color: #94a3b8; }

/* Loading */
.ei-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 20px; gap: 16px;
}
.ei-spinner {
  width: 36px; height: 36px;
  border: 3px solid #e2e8f0; border-top-color: #6366f1;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.ei-loading p { font-size: 14px; color: #94a3b8; font-weight: 600; }

/* Container */
.ei-container {
  max-width: 640px; margin: 0 auto; padding: 20px;
}

/* Steps indicator */
.ei-steps {
  display: flex; gap: 4px; margin-bottom: 24px;
  padding: 0 4px;
}
.ei-step {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.ei-step-dot {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800;
  background: #e2e8f0; color: #94a3b8;
  transition: all 0.3s;
}
.ei-step.active .ei-step-dot { background: #6366f1; color: white; box-shadow: 0 2px 8px rgba(99,102,241,0.3); }
.ei-step.current .ei-step-dot { transform: scale(1.15); }
.ei-step-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-align: center; }
.ei-step.active .ei-step-label { color: #6366f1; }

/* Step content */
.ei-step-content {
  background: white; border-radius: 20px;
  padding: 28px 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  border: 1px solid rgba(148,163,184,0.15);
}
.ei-step-title { font-size: 20px; font-weight: 800; color: #1e293b; margin: 0 0 6px; }
.ei-step-desc { font-size: 14px; color: #64748b; font-weight: 500; margin: 0 0 24px; line-height: 1.5; }

/* Choice cards */
.ei-choice-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.ei-choice-card {
  display: flex; flex-direction: column; gap: 4px;
  padding: 20px; border-radius: 16px; cursor: pointer;
  border: 2px solid #e2e8f0; background: #fafbfc;
  transition: all 0.25s; text-align: left;
  -webkit-tap-highlight-color: transparent;
}
.ei-choice-card:hover { border-color: #6366f1; background: #f0f0ff; }
.ei-choice-card.selected {
  border-color: #6366f1; background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  box-shadow: 0 2px 12px rgba(99,102,241,0.15);
}
.ei-choice-card.card-red:hover { border-color: #ef4444; background: #fff5f5; }
.ei-choice-card.card-red.selected {
  border-color: #ef4444; background: linear-gradient(135deg, #fef2f2, #fee2e2);
  box-shadow: 0 2px 12px rgba(239,68,68,0.15);
}
.ei-choice-icon { font-size: 28px; }
.ei-choice-text { font-size: 16px; font-weight: 800; color: #1e293b; }
.ei-choice-sub { font-size: 12px; font-weight: 500; color: #94a3b8; }

/* Reason section */
.ei-reason-section {
  background: #f8fafc; border-radius: 14px; padding: 16px;
  border: 1px solid #e2e8f0; margin-bottom: 16px;
}
.ei-label { font-size: 13px; font-weight: 700; color: #475569; display: block; margin-bottom: 10px; }
.ei-reason-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.ei-chip {
  padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 700;
  background: white; border: 1.5px solid #e2e8f0; color: #475569;
  cursor: pointer; transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.ei-chip.active {
  background: #6366f1; color: white; border-color: #6366f1;
  box-shadow: 0 2px 8px rgba(99,102,241,0.25);
}
.ei-textarea {
  width: 100%; border: 1.5px solid #e2e8f0; border-radius: 12px;
  padding: 12px; font-size: 14px; font-family: inherit; resize: none;
  outline: none; transition: border-color 0.2s;
}
.ei-textarea:focus { border-color: #6366f1; }

/* Nav buttons */
.ei-nav-buttons {
  display: flex; gap: 10px; margin-top: 24px;
}
.ei-btn-primary {
  flex: 1; padding: 14px; border-radius: 14px; font-size: 15px; font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
  border: none; cursor: pointer; transition: all 0.25s;
  box-shadow: 0 2px 12px rgba(99,102,241,0.3);
}
.ei-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99,102,241,0.4); }
.ei-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.ei-btn-secondary {
  flex: 0.5; padding: 14px; border-radius: 14px; font-size: 15px; font-weight: 700;
  background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;
  cursor: pointer; transition: all 0.2s;
}
.ei-btn-secondary:hover { background: #e2e8f0; }
.ei-btn-submit {
  flex: 1; padding: 16px; border-radius: 14px; font-size: 16px; font-weight: 800;
  background: linear-gradient(135deg, #059669, #10b981); color: white;
  border: none; cursor: pointer; transition: all 0.25s;
  box-shadow: 0 2px 12px rgba(5,150,105,0.3);
}
.ei-btn-submit:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(5,150,105,0.4); }
.ei-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* Signature */
.ei-field { margin-bottom: 20px; }
.ei-input {
  width: 100%; padding: 12px 16px; border: 1.5px solid #e2e8f0;
  border-radius: 12px; font-size: 15px; font-family: inherit;
  outline: none; transition: border-color 0.2s;
}
.ei-input:focus { border-color: #6366f1; }
.ei-sig-section { margin-bottom: 20px; }
.ei-sig-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
}
.ei-sig-title { font-size: 14px; font-weight: 700; color: #334155; }
.ei-btn-clear {
  font-size: 12px; font-weight: 700; color: #ef4444;
  background: #fef2f2; border: 1px solid #fecaca; padding: 4px 12px;
  border-radius: 8px; cursor: pointer;
}
.ei-sig-canvas {
  width: 100%; height: 140px; border: 2px dashed #cbd5e1;
  border-radius: 14px; background: white; cursor: crosshair;
  touch-action: none;
}

/* Confirm card */
.ei-confirm-card {
  background: #f8fafc; border-radius: 16px; padding: 20px;
  border: 1px solid #e2e8f0; margin-bottom: 8px;
}
.ei-confirm-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0; border-bottom: 1px solid #e2e8f0;
}
.ei-confirm-row:last-child { border-bottom: none; }
.ei-confirm-label { font-size: 14px; font-weight: 700; color: #475569; }
.ei-confirm-value { font-size: 14px; font-weight: 600; color: #64748b; }
.ei-confirm-reason { font-size: 12px; color: #94a3b8; padding: 4px 0 8px 8px; }

/* Completed view */
.ei-completed-card {
  background: white; border-radius: 24px; padding: 36px 28px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06); text-align: center;
  border: 1px solid rgba(148,163,184,0.15);
}
.ei-completed-icon { font-size: 56px; margin-bottom: 12px; }
.ei-completed-title { font-size: 22px; font-weight: 800; color: #1e293b; margin: 0 0 6px; }
.ei-completed-date { font-size: 13px; color: #94a3b8; font-weight: 600; margin: 0 0 24px; }
.ei-completed-summary {
  background: #f8fafc; border-radius: 16px; padding: 16px 20px;
  text-align: left; margin-bottom: 24px; border: 1px solid #e2e8f0;
}
.ei-summary-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 0;
}
.ei-summary-label { font-size: 14px; font-weight: 700; color: #475569; }
.ei-summary-badge {
  font-size: 13px; font-weight: 800; padding: 4px 12px; border-radius: 20px;
}
.badge-blue { background: #eef2ff; color: #4f46e5; }
.badge-red { background: #fef2f2; color: #dc2626; }
.ei-summary-reason { font-size: 12px; color: #94a3b8; padding: 0 0 6px 4px; }

.ei-print-actions { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.ei-btn-print {
  width: 100%; padding: 14px; border-radius: 14px; font-size: 14px; font-weight: 800;
  border: none; cursor: pointer; transition: all 0.2s;
}
.ei-btn-print-csat { background: linear-gradient(135deg, #f97316, #ef4444); color: white; }
.ei-btn-print-susi { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; }
.ei-btn-edit {
  width: 100%; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 700;
  background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;
  cursor: pointer; transition: all 0.2s;
}
.ei-btn-edit:hover { background: #e2e8f0; }

/* History Badge & Accordion */
.ei-history-badge-bar {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin-bottom: 16px; flex-wrap: wrap;
}
.ei-history-count-badge {
  background: #ede9fe; color: #6d28d9; font-size: 12px; font-weight: 800;
  padding: 3px 10px; border-radius: 20px; border: 1px solid #ddd6fe;
}
.ei-history-section {
  margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: left;
}
.ei-history-toggle-btn {
  width: 100%; display: flex; justify-content: space-between; align-items: center;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 10px 14px; font-size: 13px; font-weight: 700; color: #475569;
  cursor: pointer; transition: all 0.2s;
}
.ei-history-toggle-btn:hover { background: #f1f5f9; }
.ei-history-list {
  margin-top: 10px; display: flex; flex-direction: column; gap: 8px;
}
.ei-history-item {
  background: #f8fafc; border-radius: 10px; padding: 12px; border: 1px solid #e2e8f0;
}
.ei-history-item-header {
  display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px;
}
.ei-history-actor { font-weight: 800; color: #475569; }
.ei-history-time { color: #94a3b8; }
.ei-history-changes {
  display: flex; flex-direction: column; gap: 4px; font-size: 12px;
}
.ei-history-change-row {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}

/* Edit Card View */
.ei-edit-card {
  background: white; border-radius: 24px; padding: 28px 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  border: 1px solid rgba(148,163,184,0.15);
}
.ei-edit-header { margin-bottom: 24px; }
.ei-edit-title { font-size: 20px; font-weight: 800; color: #1e293b; margin: 0 0 6px; }
.ei-edit-desc { font-size: 13px; color: #64748b; font-weight: 500; margin: 0; line-height: 1.5; }

.ei-edit-box {
  background: #f8fafc; border-radius: 16px; padding: 16px;
  border: 1.5px solid #e2e8f0; margin-bottom: 16px;
}
.ei-edit-box-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.ei-edit-box-num {
  width: 22px; height: 22px; border-radius: 50%; background: #6366f1; color: white;
  display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800;
}
.ei-edit-box-title { font-size: 14px; font-weight: 800; color: #1e293b; }

.ei-toggle-group {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.ei-toggle-btn {
  padding: 12px 14px; border-radius: 12px; font-size: 13px; font-weight: 800;
  background: white; border: 1.5px solid #e2e8f0; color: #64748b;
  cursor: pointer; transition: all 0.2s; -webkit-tap-highlight-color: transparent;
}
.ei-toggle-btn:hover { border-color: #6366f1; background: #f8fafc; }
.ei-toggle-btn.active {
  background: #6366f1; color: white; border-color: #6366f1;
  box-shadow: 0 2px 8px rgba(99,102,241,0.25);
}
.ei-toggle-btn.btn-no.active {
  background: #ef4444; color: white; border-color: #ef4444;
  box-shadow: 0 2px 8px rgba(239,68,68,0.25);
}
.ei-edit-reason-area {
  margin-top: 12px; padding-top: 12px; border-top: 1px dashed #cbd5e1;
}

.ei-edit-actions {
  display: flex; gap: 10px; margin-top: 24px;
}

/* Responsive */
@media (max-width: 480px) {
  .ei-container { padding: 16px; }
  .ei-step-content { padding: 22px 18px; border-radius: 16px; }
  .ei-step-title { font-size: 17px; }
  .ei-choice-card { padding: 16px; }
  .ei-btn-ghost { padding: 5px 8px; font-size: 11px; }
}
</style>
