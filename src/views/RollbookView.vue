<template>
  <div class="flex h-screen overflow-hidden bg-slate-100 font-sans rollbook-root">

    <!-- 1. 좌측 사이드바 (전체 앱 테마와 일치, 인쇄 시 자동 숨김) -->
    <aside
      class="flex flex-col shrink-0 bg-white border-r border-slate-200 overflow-hidden transition-all duration-200 shadow-sm no-print select-none z-40"
      :style="{ width: collapsed ? '64px' : '240px' }"
    >
      <!-- 로고 & 시스템명 & 접기 버튼 -->
      <div class="flex items-center shrink-0 h-15 border-b border-slate-100 px-3 justify-between">
        <div v-if="!collapsed" class="flex items-center gap-2.5 whitespace-nowrap overflow-hidden">
          <div class="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <BookOpen :size="18" />
          </div>
          <div class="flex flex-col leading-tight">
            <span class="text-[11px] font-extrabold text-teal-600 tracking-tight">{{ schoolName }}</span>
            <span class="text-sm font-bold text-slate-900 truncate">선택교과 출석관리</span>
          </div>
        </div>
        <button
          @click="collapsed = !collapsed"
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
          :title="collapsed ? '사이드바 펼치기' : '사이드바 접기'"
        >
          <ChevronRight v-if="collapsed" :size="18" />
          <Menu v-else :size="18" />
        </button>
      </div>

      <!-- 메뉴 내비게이션 목록 (세로 배치 및 효율적 그룹화) -->
      <div class="flex-1 overflow-y-auto p-2 space-y-4">
        <!-- 그룹 1: 출석부 조회/체크 -->
        <div>
          <div v-if="!collapsed" class="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
            출석부 조회 / 체크
          </div>
          <div class="space-y-1">
            <button
              v-for="item in rollbookMenus"
              :key="item.key"
              :id="item.id"
              :data-view="item.key"
              @click="handleMenuClick(item.key)"
              :title="item.label + (item.sub ? ' (' + item.sub + ')' : '')"
              :class="[
                'nav-btn rb-sidebar-nav-btn w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150 cursor-pointer border-none text-left',
                activeView === item.key
                  ? 'active bg-teal-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium',
                collapsed ? 'justify-center px-0' : 'justify-start'
              ]"
            >
              <span class="text-base shrink-0">{{ item.icon }}</span>
              <span v-if="!collapsed" class="truncate flex-1">{{ item.label }}</span>
              <span
                v-if="!collapsed && item.sub"
                :class="[
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                  activeView === item.key
                    ? 'bg-teal-700/80 text-teal-100'
                    : (item.highlight ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500')
                ]"
              >
                {{ item.sub }}
              </span>
            </button>
          </div>
        </div>

        <!-- 그룹 2: 출결 관리 & 부가기능 -->
        <div>
          <div v-if="!collapsed" class="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
            출결 관리 &amp; 부가기능
          </div>
          <div class="space-y-1">
            <button
              v-for="item in serviceMenus"
              :key="item.key"
              :id="item.id"
              :data-view="item.key"
              @click="handleMenuClick(item.key)"
              :title="item.label + (item.sub ? ' (' + item.sub + ')' : '')"
              :class="[
                'nav-btn rb-sidebar-nav-btn w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150 cursor-pointer border-none text-left',
                activeView === item.key
                  ? 'active bg-teal-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium',
                collapsed ? 'justify-center px-0' : 'justify-start'
              ]"
            >
              <span class="text-base shrink-0">{{ item.icon }}</span>
              <span v-if="!collapsed" class="truncate flex-1">{{ item.label }}</span>
              <span
                v-if="!collapsed && item.sub"
                :class="[
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                  activeView === item.key
                    ? 'bg-teal-700/80 text-teal-100'
                    : (item.highlight ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500')
                ]"
              >
                {{ item.sub }}
              </span>
            </button>
          </div>
        </div>

        <!-- 빠른 실행 도구 (Quick Tools) -->
        <div>
          <div v-if="!collapsed" class="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
            빠른 실행 도구
          </div>
          <div class="space-y-1">
            <!-- 출석부 인쇄 버튼 -->
            <button
              id="printBtn"
              class="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 transition-all cursor-pointer shadow-2xs text-left"
              :class="collapsed ? 'justify-center px-0' : 'justify-start'"
              title="A4 가로 정밀 인쇄 (Ctrl+P)"
            >
              <span class="text-sm">🖨️</span>
              <span v-if="!collapsed" class="truncate font-medium">출석부 인쇄 (Ctrl+P)</span>
            </button>

            <!-- NEIS 마감 집계 버튼 -->
            <button
              id="neisReportBtn"
              class="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer"
              :class="collapsed ? 'justify-center px-0' : 'justify-start'"
              title="NEIS 월말 출결 마감용 학생별 누계표"
            >
              <span class="text-sm">📊</span>
              <span v-if="!collapsed" class="truncate">NEIS 마감 집계</span>
            </button>

            <!-- 시트 새로고침 버튼 -->
            <button
              id="refreshBtn"
              class="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer"
              :class="collapsed ? 'justify-center px-0' : 'justify-start'"
              title="구글 시트 실시간 데이터 새로고침"
            >
              <span class="text-sm refresh-icon">🔄</span>
              <span v-if="!collapsed" class="truncate">시트 새로고침</span>
            </button>

            <!-- GAS 연동 설정 버튼 -->
            <button
              id="gasSettingsBtn"
              class="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer border-none bg-transparent"
              :class="collapsed ? 'justify-center px-0' : 'justify-start'"
              title="구글 앱스 스크립트(GAS) Web App 주소 설정"
            >
              <span class="text-sm">⚙️</span>
              <span v-if="!collapsed" class="truncate">GAS 연동 설정</span>
            </button>

            <!-- 결석계 관리 바로가기 리스너 연결용 숨김 태그 -->
            <button id="absenceReportBtn" style="display: none;"></button>
          </div>
        </div>
      </div>

      <!-- 사이드바 하단: 사용자 정보 & 포털/로그아웃 -->
      <div class="p-3 border-t border-slate-200 bg-slate-50/50 flex flex-col gap-2 shrink-0">
        <div v-if="!collapsed" class="flex items-center gap-2 px-1">
          <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
            <User :size="16" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-slate-800 truncate m-0">{{ userName }}</p>
            <span class="text-[10px] font-semibold text-teal-600">{{ roleLabel }}</span>
          </div>
        </div>

        <button
          @click="goToPortal"
          class="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          title="대문(포털)으로 이동"
        >
          <Home :size="14" />
          <span v-if="!collapsed">포털 이동</span>
        </button>

        <button
          @click="handleLogout"
          class="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
        >
          <LogOut :size="14" />
          <span v-if="!collapsed">로그아웃</span>
        </button>
      </div>
    </aside>

    <!-- 2. 우측 메인 영역 -->
    <div class="flex-1 flex flex-col h-screen overflow-hidden rollbook-app" ref="rollbookContainer">
      <!-- 메인 상단 헤더 바 (인쇄 시 자동 숨김) -->
      <header class="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs z-30 no-print">
        <!-- 현재 화면 정보 -->
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-xl shrink-0">{{ currentViewInfo.icon }}</span>
          <div class="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
            <h2 class="text-sm sm:text-base font-bold text-slate-900 m-0 truncate">{{ currentViewInfo.label }}</h2>
            <span class="text-xs text-slate-400 font-medium hidden md:inline truncate">{{ currentViewInfo.desc }}</span>
          </div>
        </div>

        <!-- 우측 상태 지표 배지들 -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <div id="todayBadge" class="status-badge status-today">
            <span>📅</span> 오늘: 계산 중...
          </div>
          <div id="syncStatus" class="status-badge status-live">
            <span class="status-dot"></span>데이터 준비 중...
          </div>
          <div id="saveStatus" class="status-badge status-saved" style="display: none;">
            <span>☁️</span> <span id="saveStatusText">저장됨</span>
          </div>
        </div>
      </header>

      <!-- 본문 스크롤 영역 -->
      <div class="flex-1 overflow-x-auto overflow-y-auto bg-slate-50 relative min-w-0">
        <!-- 초보 교사용 직관 퀵 팁 가이드 (1줄 헤더 + 클릭 시 펼침/접힘) -->
        <div class="no-print mx-4 mt-2.5 mb-1 bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden transition-all duration-200">
          <button
            type="button"
            @click="isHelpOpen = !isHelpOpen"
            class="w-full flex items-center justify-between px-3.5 py-1.5 text-left bg-slate-50/70 hover:bg-slate-100/70 transition-colors cursor-pointer border-none"
            :title="isHelpOpen ? '도움말 닫기' : '도움말 펼치기 (클릭)'"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-sm shrink-0">💡</span>
              <span class="text-xs font-bold text-slate-800 truncate">출결 관리 및 결석계 연동 안내</span>
              <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/60 shrink-0">
                {{ isHelpOpen ? '도움말 접기 ▲' : '도움말 펼치기 ▼' }}
              </span>
            </div>
            <ChevronDown
              :size="15"
              class="text-slate-400 shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180': isHelpOpen }"
            />
          </button>

          <div
            v-show="isHelpOpen"
            class="px-4 py-2.5 text-xs text-slate-700 bg-white border-t border-slate-100 leading-relaxed space-y-1.5"
          >
            <div class="flex items-start gap-1.5">
              <span class="text-teal-600 font-bold shrink-0">•</span>
              <div>
                <strong class="text-slate-900 font-semibold">출결 입력:</strong>
                학생 셀을 <strong class="text-teal-700 font-semibold">좌클릭</strong>하면
                <span class="inline-flex items-center font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-medium">[빈칸(출석) → 병 → 인(생리) → 인(체험) → 인(경조사) → 인(전염병) → 미 → 기]</span>
                순으로 순환 변경됩니다. (<span class="text-slate-500 font-medium">Shift+클릭 시 역순</span>)
              </div>
            </div>
            <div class="flex items-start gap-1.5">
              <span class="text-teal-600 font-bold shrink-0">•</span>
              <div>
                <strong class="text-slate-900 font-semibold">결석계 인쇄:</strong>
                셀 <strong class="text-teal-700 font-semibold">우클릭</strong> 후
                <span class="inline-flex items-center text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-medium">[📑 출석부 기반 결석계 인쇄 / 확인]</span>을
                누르면 날짜와 사유가 자동 분석된 결석계 인쇄 모달이 열립니다.
              </div>
            </div>
            <div class="flex items-start gap-1.5">
              <span class="text-teal-600 font-bold shrink-0">•</span>
              <div>
                <strong class="text-slate-900 font-semibold">전교시 일괄 적용:</strong>
                셀 <strong class="text-teal-700 font-semibold">우클릭</strong> 후
                <span class="inline-flex items-center text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-medium">[⚡ 오늘 전 교시 일괄 적용]</span>을
                누르면 해당 학생의 오늘 전 교시 상태가 한 번에 변경됩니다.
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
                <!-- Dynamic Control Toolbar -->
        <section class="app-toolbar no-print" id="toolbarControls"></section>

        <!-- Main Output Area -->
        <main class="content-area" id="appOutput" role="main">
          <div class="empty-state">출석부 데이터를 불러오는 중입니다...</div>
        </main>


        <!-- Print Modal Dialog -->
        <div class="modal-backdrop no-print" id="printModal" style="display: none;">
          <div class="modal-dialog print-modal-dialog">
            <div class="modal-header">
              <div class="modal-title-group">
                <span class="modal-icon">🖨️</span>
                <div>
                  <h3 class="modal-title">출석부 맞춤 인쇄 설정</h3>
                  <p class="modal-desc">인쇄할 주차, 날짜 범위, 학급 및 이동반 교실을 선택하세요 (기본값: 일괄 인쇄).</p>
                </div>
              </div>
              <button type="button" class="modal-close-btn" id="closePrintModalBtn" title="닫기">&times;</button>
            </div>
            <div class="modal-body">
              <div class="modal-section">
                <label class="modal-label" for="printModalViewSelect">인쇄 대상 출석부:</label>
                <div class="modal-row">
                  <select id="printModalViewSelect" class="styled-select print-view-select">
                    <option value="homeroom">원적학급 주간 출석부 (1~11반)</option>
                    <option value="moving">이동수업 출석부 (1~12반 교실)</option>
                  </select>
                </div>
              </div>
              <div class="modal-section">
                <label class="modal-label" id="printModalPeriodLabel">주차 및 요일 범위:</label>
                <div class="modal-row" style="margin-bottom: 8px;">
                  <select id="printModalWeekSelect" class="styled-select"></select>
                </div>
                <div class="modal-row day-checkboxes-row" id="printModalDayCheckboxes"></div>
                <div id="printModalHomeroomDayNote" style="display: none; font-size: 12px; color: #64748b; padding: 4px 2px;">
                  ℹ️ 원적학급 주간 출석부는 선택한 주차의 월~금(5일간) 전 교시가 1장에 통합 인쇄됩니다.
                </div>
              </div>
              <div class="modal-section">
                <div class="modal-section-header">
                  <label class="modal-label" id="printModalTargetLabel">인쇄 대상 학급/교실 선택:</label>
                  <label class="check-label select-all-label">
                    <input type="checkbox" id="printModalSelectAllTargets" checked /> 전체 선택
                  </label>
                </div>
                <div class="modal-target-grid" id="printModalTargetGrid"></div>
              </div>
              <div class="print-estimate-card">
                <div class="estimate-icon">📄</div>
                <div class="estimate-info">
                  <div class="estimate-title">예상 인쇄 매수: <strong id="printModalPageCount">0장</strong> (A4 가로)</div>
                  <div class="estimate-desc" id="printModalSummary">선택된 학급과 날짜를 기반으로 자동 계산됩니다.</div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="cancelPrintModalBtn">취소</button>
              <button type="button" class="btn btn-primary" id="confirmPrintModalBtn">
                <span>🖨️</span> 인쇄 시작 (Ctrl+P)
              </button>
            </div>
          </div>
        </div>

        <!-- GAS Web App Settings Modal -->
        <div class="modal-backdrop no-print" id="gasSettingsModal" style="display: none;">
          <div class="modal-dialog">
            <div class="modal-header">
              <div class="modal-title-group">
                <span class="modal-icon">⚙️</span>
                <div>
                  <h3 class="modal-title">구글 앱스 스크립트(GAS) Web App 설정</h3>
                  <p class="modal-desc">'출결기록' 시트에 실시간 저장을 위한 웹 앱 주소를 등록합니다.</p>
                </div>
              </div>
              <button type="button" class="modal-close-btn" id="closeGasSettingsBtn" title="닫기">&times;</button>
            </div>
            <div class="modal-body">
              <div class="modal-section">
                <label class="modal-label" for="gasUrlInput">배포된 Web App URL:</label>
                <input type="url" id="gasUrlInput" class="styled-input" placeholder="https://script.google.com/macros/s/.../exec" />
                <div class="field-hint">
                  ※ 스프레드시트 [확장 프로그램] &gt; [Apps Script]에서 배포한 웹 앱 URL을 입력하세요.<br>
                  ※ 자세한 설치 방법은 <code>docs/apps_script_code.js</code>를 참고하세요.
                </div>
              </div>
              <div class="modal-section" style="margin-top: 15px;">
                <label class="modal-label" for="teacherAuthKeyInput">교사용 결석계 관리 인증 키:</label>
                <input type="text" id="teacherAuthKeyInput" class="styled-input" placeholder="teacher2026" />
                <div class="field-hint">
                  ※ 결석계 대장 조회 및 인쇄 페이지 접근 시 사용할 비밀 토큰입니다. (기본값: <code>teacher2026</code>)
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="cancelGasSettingsBtn">취소</button>
              <button type="button" class="btn btn-primary" id="saveGasSettingsBtn">저장하기</button>
            </div>
          </div>
        </div>

        <!-- NEIS Monthly Attendance Summary Report Modal -->
        <div class="modal-backdrop no-print" id="neisReportModal" style="display: none;">
          <div class="modal-dialog modal-xl">
            <div class="modal-header">
              <div class="modal-title-group">
                <span class="modal-icon">📊</span>
                <div>
                  <h3 class="modal-title">NEIS 월말 출결 마감 집계표</h3>
                  <p class="modal-desc">원적학급별 결석·지각·조퇴·결과 및 인정 4종 누계 내역을 산출합니다.</p>
                </div>
              </div>
              <button type="button" class="modal-close-btn" id="closeNeisReportBtn" title="닫기">&times;</button>
            </div>
            <div class="modal-body">
              <div class="neis-filter-bar">
                <div class="neis-filter-group">
                  <label for="neisBanSelect"><strong>학급:</strong></label>
                  <select id="neisBanSelect" class="styled-select"></select>
                </div>
                <div class="neis-filter-group">
                  <label for="neisMonthSelect"><strong>대상 월:</strong></label>
                  <select id="neisMonthSelect" class="styled-select"></select>
                </div>
                <div class="neis-summary-badges" id="neisSummaryBadges"></div>
              </div>
              <div class="neis-table-wrapper" id="neisTableContainer"></div>
            </div>
            <div class="modal-footer neis-footer">
              <div class="footer-left">
                <button type="button" class="btn btn-secondary" id="copyNeisClipboardBtn">📋 클립보드 복사 (엑셀용)</button>
                <button type="button" class="btn btn-secondary" id="downloadNeisCsvBtn">📥 CSV 다운로드</button>
                <button type="button" class="btn btn-secondary" id="printNeisReportBtn">🖨️ 집계표 인쇄</button>
              </div>
              <button type="button" class="btn btn-primary" id="closeNeisReportFooterBtn">닫기</button>
            </div>
          </div>
        </div>

        <!-- Attendance Context Menu (Right-Click) -->
        <div class="context-menu no-print" id="attendanceContextMenu" style="display: none;">
          <div class="context-menu-header" id="contextMenuTitle">학생 출결 관리</div>
          <div class="context-menu-section-label">✏️ 출결 상태 빠른 입력</div>
          <div class="context-menu-item" data-status=""><span class="status-indicator status-present-indicator"></span> 정상 출석 (빈값)</div>
          <div class="context-menu-item" data-status="병"><span class="status-indicator status-byeong-indicator">병</span> 질병 (병결·병지각)</div>
          <div class="context-menu-item" data-status="인(생리)"><span class="status-indicator status-in-indicator">인</span> 인정(생리통)</div>
          <div class="context-menu-item" data-status="인(체험)"><span class="status-indicator status-in-indicator">인</span> 인정(교외체험학습)</div>
          <div class="context-menu-item" data-status="인(경조사)"><span class="status-indicator status-in-indicator">인</span> 인정(경조사)</div>
          <div class="context-menu-item" data-status="인(전염병)"><span class="status-indicator status-in-indicator">인</span> 인정(법정 전염병)</div>
          <div class="context-menu-item" data-status="미"><span class="status-indicator status-mi-indicator">미</span> 미인정 (무단)</div>
          <div class="context-menu-item" data-status="기"><span class="status-indicator status-gita-indicator">기</span> 기타 결석</div>
          <div class="context-menu-divider"></div>
          <div class="context-menu-section-label">⚡ 업무 보조 및 서류</div>
          <div class="context-menu-item context-menu-action" id="applyAllPeriodsItem"><span>⚡</span> <strong>오늘 전 교시 일괄 적용</strong></div>
          <div class="context-menu-item context-menu-action" id="toggleDocSubmittedItem"><span>📎</span> <span id="docSubmittedText">증빙서류 제출 여부 토글</span></div>
          <div class="context-menu-divider"></div>
          <div class="context-menu-section-card">
            <div class="context-menu-section-label" style="color: #1d4ed8;">📑 결석계 공식 양식 연동</div>
            <div class="context-menu-item context-menu-action context-menu-highlight" id="generateAbsenceReportItem"><span>📑</span> <strong>출석부 기반 결석계 인쇄 / 확인</strong></div>
            <div class="context-menu-item context-menu-action" id="viewAbsenceReportPdfItem" style="display: none;"><span>📄</span> <span id="viewAbsenceReportPdfText" style="color: #4A86E8; font-weight: bold;">결석계 원본 PDF 보기</span></div>
          </div>
        </div>

        <!-- 출석부 기반 결석계 인쇄 및 확인 모달 -->
        <div class="modal-backdrop no-print" id="absenceQuickEditModal" style="display: none;">
          <div class="modal-dialog" style="max-width: 580px; background: #ffffff;">
            <div class="modal-header">
              <div class="modal-title-group">
                <span class="modal-icon">📑</span>
                <div>
                  <h3 class="modal-title" id="aqeModalTitle">출석부 기반 결석계 인쇄</h3>
                  <p class="modal-desc" id="aqeModalDesc">출석부 기록을 바탕으로 자동 분석된 결석계 내용입니다.</p>
                </div>
              </div>
              <button type="button" class="modal-close-btn" id="closeAqeModalBtn" title="닫기">&times;</button>
            </div>
            <div class="modal-body">
              <div style="background: #eef4ff; border: 1px solid #c9dafc; border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; font-size: 13px; color: #1a4299;">
                💡 <strong>출석부 자동 분석 완료:</strong> 필요 시 내용을 수정한 후 인쇄하실 수 있습니다.
              </div>
              <div id="aqeStreakNotice" style="display: none; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 9px 12px; margin-bottom: 12px; font-size: 12.5px; color: #15803d; line-height: 1.4;"></div>
              <div id="aqePrintModeWrap" style="display: none; background: #fff; border: 1.5px solid #3b82f6; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.08);">
                <div style="font-size: 12.5px; font-weight: 700; color: #1e40af; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                  <span>🖨️</span> <span>인쇄 방식 선택 (연속 출결 감지됨)</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 6px 8px; border-radius: 4px; background: #eff6ff;" id="aqeModeCombinedLabel">
                    <input type="radio" name="aqePrintMode" id="aqeModeCombined" value="combined" checked style="cursor: pointer; width: 16px; height: 16px;" />
                    <div>
                      <strong style="color: #1d4ed8;">날짜 범위를 묶어 1장으로 통합 인쇄 (권장)</strong>
                      <div style="font-size: 11.5px; color: #475569;" id="aqeModeCombinedDesc">예: 2026-09-21 ~ 2026-09-23 (3일간) → 1장 출력</div>
                    </div>
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 6px 8px; border-radius: 4px;" id="aqeModeIndividualLabel">
                    <input type="radio" name="aqePrintMode" id="aqeModeIndividual" value="individual" style="cursor: pointer; width: 16px; height: 16px;" />
                    <div>
                      <strong style="color: #334155;">각 날짜별로 1장씩 분할 인쇄</strong>
                      <div style="font-size: 11.5px; color: #475569;" id="aqeModeIndividualDesc">예: 각 일자별 1일간 → 총 N장 분할 출력</div>
                    </div>
                  </label>
                </div>
              </div>
              <div class="row" style="display: flex; gap: 10px; margin-bottom: 12px;">
                <div style="flex: 1;">
                  <label class="modal-label">학생 정보:</label>
                  <input type="text" id="aqeStudentInfo" class="styled-input" readonly style="background: #f8f9fa;" />
                </div>
                <div style="flex: 1;">
                  <label class="modal-label">출결 구분:</label>
                  <select id="aqeCat" class="styled-input">
                    <option value="결석">결석</option>
                    <option value="지각">지각</option>
                    <option value="조퇴">조퇴</option>
                    <option value="결과">결과</option>
                  </select>
                </div>
              </div>
              <div class="row" style="display: flex; gap: 10px; margin-bottom: 12px;">
                <div style="flex: 1;">
                  <label class="modal-label">출결 종류:</label>
                  <select id="aqeType" class="styled-input">
                    <option value="질병">질병</option>
                    <option value="생리통">생리통</option>
                    <option value="출석인정">출석인정</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div style="flex: 1;" id="aqeSubTypeWrap">
                  <label class="modal-label">인정 세부종류:</label>
                  <input type="text" id="aqeSubType" class="styled-input" placeholder="교외체험학습, 경조사, 전염병 등" />
                </div>
              </div>
              <div class="row" style="display: flex; gap: 10px; margin-bottom: 12px;">
                <div style="flex: 1;">
                  <label class="modal-label">시작일:</label>
                  <input type="date" id="aqeStartDate" class="styled-input" />
                </div>
                <div style="flex: 1;">
                  <label class="modal-label">종료일:</label>
                  <input type="date" id="aqeEndDate" class="styled-input" />
                </div>
              </div>
              <div class="row" style="display: flex; gap: 10px; margin-bottom: 12px;">
                <div style="flex: 1;">
                  <label class="modal-label">총 기간 표기:</label>
                  <input type="text" id="aqeTotalDays" class="styled-input" placeholder="예: 1일간, 3일간" />
                </div>
                <div style="flex: 1;">
                  <label class="modal-label">교시 범위 (지각·조퇴·결과):</label>
                  <input type="text" id="aqePeriods" class="styled-input" placeholder="예: 1교시 ~ 6교시" />
                </div>
              </div>
              <div style="margin-bottom: 12px;">
                <label class="modal-label">사유 상세:</label>
                <input type="text" id="aqeReason" class="styled-input" placeholder="사유를 입력하세요" />
              </div>
              <div style="margin-bottom: 12px;">
                <label class="modal-label">보호자 성명:</label>
                <input type="text" id="aqeParentName" class="styled-input" value="학부모" />
              </div>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <button type="button" class="btn btn-secondary" id="cancelAqeModalBtn">취소</button>
              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <a :href="printSheetUrl" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="구글 스프레드시트 공식 인쇄 양식 열기">
                  📑 인쇄 시트 원본
                </a>
                <button type="button" class="btn btn-primary" id="printAqeBtn">🖨️ 포곡고 공식 양식 즉시 인쇄</button>
              </div>
            </div>
          </div>
        </div>

        <!-- A4 결석계 브라우저 직접 인쇄 컨테이너 -->
        <div id="absencePrintSection" class="print-only" style="display: none;"></div>

        <!-- Loading Overlay -->
        <div class="loading-overlay" id="loadingOverlay" style="display: none;">
          <div class="spinner"></div>
          <div class="loading-text">구글 시트 데이터를 동기화하고 출석부를 생성하고 있습니다...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { schoolName, fetchSchoolName } from '../utils/schoolConfig'
import { BookOpen, ChevronRight, ChevronDown, Menu, Home, LogOut, User } from 'lucide-vue-next'
import { SheetAPI } from '../rollbook/api.js'
import App from '../rollbook/app.js'
import '../rollbook/rollbook.css'

const router = useRouter()
const auth = useAuthStore()
const rollbookContainer = ref(null)
const collapsed = ref(false)
const isHelpOpen = ref(false)
const activeView = ref('homeroom')
let appInstance = null
const printSheetUrl = computed(() => SheetAPI.getPrintSheetUrl())

// 사이드바 메뉴 정의 (전체 테마와 일치하는 효율적 구조)
const rollbookMenus = [
  { key: 'homeroom', id: 'navHomeroomBtn', label: '원적학급 출석부', sub: '담임용', icon: '🏫', desc: '담임교사용 학급 출석부 (출석체크 및 결석계 연동)' },
  { key: 'moving', id: 'navMovingBtn', label: '이동수업 출석부', sub: '교과용', icon: '🏃', desc: '선택교과 교실별 학생 출결 체크' },
  { key: 'today', id: 'navTodayBtn', label: '오늘의 출결 현황', sub: '실시간', icon: '📢', desc: '전체 학급 실시간 출결 집계 및 조회' },
]

const serviceMenus = [
  { key: 'absence', id: 'navAbsenceBtn', label: '결석계 관리', sub: '대장·인쇄', highlight: true, icon: '📑', desc: '온라인 결석계 접수 대장 조회 및 A4 공식서식 인쇄' },
  { key: 'lunch', id: 'navLunchBtn', label: '급식 캘린더', sub: '', icon: '🍱', desc: '월간 급식 식단표 및 영양 정보' },
  { key: 'finder', id: 'navFinderBtn', label: '학생 검색', sub: '', icon: '🔍', desc: '학생 이동수업 반 및 시간표 빠른 검색' },
]

const allMenus = [...rollbookMenus, ...serviceMenus]

const currentViewInfo = computed(() => {
  return allMenus.find(m => m.key === activeView.value) || rollbookMenus[0]
})

function handleMenuClick(key) {
  activeView.value = key
  if (appInstance) {
    appInstance.switchView(key)
  }
}

const userName = computed(() => {
  if (auth.isAdmin) return '관리자'
  if (auth.isTeacher) return auth.user?.user_metadata?.name || '선생님'
  return '사용자'
})

const roleLabel = computed(() => {
  if (auth.isAdmin) return '시스템 관리자'
  if (auth.isTeacher) return '담임 교사'
  return ''
})

function goToPortal() {
  router.push('/select-system')
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

onMounted(async () => {
  fetchSchoolName()

  // Print timestamp auto-fill (원본 index.html의 인라인 스크립트)
  const beforePrintHandler = () => {
    const now = new Date()
    const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    document.querySelectorAll('.print-timestamp').forEach(el => {
      el.setAttribute('data-timestamp', ts)
    })
  }
  window.addEventListener('beforeprint', beforePrintHandler)
  window._rollbookBeforePrintHandler = beforePrintHandler

  // URL Hash 감지하여 activeView 동기화
  const syncHashToView = () => {
    const hash = window.location.hash
    if (hash.startsWith('#v=')) {
      const v = hash.replace('#v=', '').split('&')[0]
      if (v && allMenus.some(m => m.key === v)) {
        activeView.value = v
      }
    }
  }
  syncHashToView()
  window.addEventListener('hashchange', syncHashToView)
  window._rollbookHashHandler = syncHashToView

  // Rollbook App 초기화
  try {
    appInstance = new App()
    window.appInstance = appInstance

    // switchView 가 app 내부에서 호출될 때 activeView 도 자동 동기화되도록 연동
    const originalSwitchView = appInstance.switchView.bind(appInstance)
    appInstance.switchView = (view) => {
      activeView.value = view
      return originalSwitchView(view)
    }

    await appInstance.init()
    if (appInstance.state?.view) {
      activeView.value = appInstance.state.view
    }
  } catch (e) {
    console.error('Failed to initialize rollbook app:', e)
  }
})

onUnmounted(() => {
  // 리스너 정리
  if (window._rollbookBeforePrintHandler) {
    window.removeEventListener('beforeprint', window._rollbookBeforePrintHandler)
    delete window._rollbookBeforePrintHandler
  }
  if (window._rollbookHashHandler) {
    window.removeEventListener('hashchange', window._rollbookHashHandler)
    delete window._rollbookHashHandler
  }

  // 삽입된 인쇄 방향 스타일 및 클래스 정리
  const orientStyle = document.getElementById('printPageOrientationStyle')
  if (orientStyle) orientStyle.remove()
  document.body.classList.remove('printing-absence')

  // App 인스턴스 정리 (AbortController 등)
  if (appInstance && appInstance._globalAbort) {
    appInstance._globalAbort.abort()
  }
  if (window.appInstance === appInstance) {
    delete window.appInstance
  }
})
</script>

<style>
/* 사이드바 nav-btn 리셋 및 스타일 최적화 */
.rb-sidebar-nav-btn {
  text-decoration: none;
  font-family: inherit;
  outline: none;
}
.rb-sidebar-nav-btn:hover {
  background-color: #f8fafc !important;
  color: #0f172a !important;
}
.rb-sidebar-nav-btn.active {
  background-color: #0d9488 !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1) !important;
}
.rb-sidebar-nav-btn.active:hover {
  background-color: #0f766e !important;
  color: #ffffff !important;
}

/* rollbook-root 레이아웃 */
.rollbook-root {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* 상단 헤더 내 상태 뱃지 라이트 테마 조율 */
.rollbook-app .status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  padding: 3px 9px;
  border-radius: 9999px;
  font-weight: 600;
  border: 1px solid transparent;
}
.rollbook-app .status-today {
  background-color: #eff6ff;
  color: #1e3a8a;
  border-color: #bfdbfe;
}
.rollbook-app .status-today .badge-sub {
  font-size: 11.5px;
  color: #1d4ed8;
  font-weight: 700;
  margin-left: 4px;
}
.rollbook-app .status-live {
  background-color: #ecfdf5;
  color: #059669;
  border-color: #a7f3d0;
}
.rollbook-app .status-offline {
  background-color: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}
.rollbook-app .status-saved {
  background-color: #f0fdf4;
  color: #16a34a;
  border-color: #bbf7d0;
}
.rollbook-app .status-saving {
  background-color: #fefce8;
  color: #ca8a04;
  border-color: #fef08a;
}
.rollbook-app .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  display: inline-block;
}

/* rollbook.css 의 .app-header 와 .app-nav 가 있을 경우 숨김 처리 */
.app-header {
  display: none !important;
}
.app-nav {
  display: none !important;
}

/* 본문 콘텐츠 패딩 조율 */
.rollbook-app .content-area {
  padding: 12px 16px 32px;
}
.rollbook-app .app-toolbar {
  margin: 0 16px 12px;
}
</style>
