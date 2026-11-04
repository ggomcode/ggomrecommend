const fs = require('fs');

// 1. src/views/RollbookView.vue
let rv = fs.readFileSync('src/views/RollbookView.vue', 'utf8');

// Insert loading overlay right after `<div class="flex-1 overflow-x-auto overflow-y-auto bg-slate-50 relative min-w-0">`
const targetContainer = `<div class="flex-1 overflow-x-auto overflow-y-auto bg-slate-50 relative min-w-0">`;
const overlayHtml = `<div class="flex-1 overflow-x-auto overflow-y-auto bg-slate-50 relative min-w-0">
        <!-- 화면 전환 로딩 표시기 (원반출석부 / 이동반출석부 전환 등) -->
        <transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
          <div
            v-if="isViewSwitching"
            class="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center z-50 p-4"
          >
            <div class="bg-white/95 rounded-2xl p-6 shadow-xl border border-slate-200/80 flex flex-col items-center gap-3 max-w-sm text-center">
              <div class="w-10 h-10 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
              <div>
                <p class="text-sm font-black text-slate-800 m-0">{{ viewSwitchingText }}</p>
                <p class="text-xs text-slate-500 m-0 mt-1">출석부 및 학생 출결 데이터를 생성하고 있습니다...</p>
              </div>
            </div>
          </div>
        </transition>`;

if (!rv.includes('isViewSwitching') && rv.includes(targetContainer)) {
  rv = rv.replace(targetContainer, overlayHtml);
}

// In script section of RollbookView.vue
const targetScript = `const activeView = ref('homeroom')
let appInstance = null`;

const replacementScript = `const activeView = ref('homeroom')
const isViewSwitching = ref(false)
const viewSwitchingText = ref('출석부 데이터를 불러오는 중입니다...')

const viewLabelMap = {
  homeroom: '원적학급 주간 출석부 데이터를 불러오는 중입니다...',
  moving: '이동수업 출석부 데이터를 불러오는 중입니다...',
  today: '오늘의 출결 현황을 불러오는 중입니다...',
  absence: '결석계 관리 데이터를 불러오는 중입니다...',
  lunch: '급식 캘린더를 불러오는 중입니다...',
  finder: '학생 검색 데이터를 준비 중입니다...'
}
let appInstance = null`;

if (!rv.includes('viewLabelMap') && rv.includes(targetScript)) {
  rv = rv.replace(targetScript, replacementScript);
}

const targetMenuClick = `function handleMenuClick(key) {
  activeView.value = key
  if (appInstance) {
    appInstance.switchView(key)
  }
}`;

const replacementMenuClick = `async function handleMenuClick(key) {
  if (activeView.value === key && !isViewSwitching.value) return
  activeView.value = key
  viewSwitchingText.value = viewLabelMap[key] || '출석부 데이터를 불러오는 중입니다...'
  isViewSwitching.value = true

  // UI 스피너가 먼저 즉시 렌더링되도록 1프레임 양보
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 40))

  try {
    if (appInstance) {
      await appInstance.switchView(key)
    }
  } finally {
    setTimeout(() => {
      isViewSwitching.value = false
    }, 80)
  }
}`;

if (rv.includes(targetMenuClick)) {
  rv = rv.replace(targetMenuClick, replacementMenuClick);
}

// In onMounted: hook into switchView
const targetAppInit = `    // switchView 가 app 내부에서 호출될 때 activeView 도 자동 동기화되도록 연동
    const originalSwitchView = appInstance.switchView.bind(appInstance)
    appInstance.switchView = (view) => {
      activeView.value = view
      return originalSwitchView(view)
    }`;

const replacementAppInit = `    // switchView 가 app 내부에서 호출될 때 activeView 및 로딩 상태 동기화
    const originalSwitchView = appInstance.switchView.bind(appInstance)
    appInstance.switchView = async (view) => {
      activeView.value = view
      viewSwitchingText.value = viewLabelMap[view] || '출석부 데이터를 불러오는 중입니다...'
      isViewSwitching.value = true
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 40))
      try {
        return await originalSwitchView(view)
      } finally {
        setTimeout(() => {
          isViewSwitching.value = false
        }, 80)
      }
    }`;

if (rv.includes(targetAppInit)) {
  rv = rv.replace(targetAppInit, replacementAppInit);
}

fs.writeFileSync('src/views/RollbookView.vue', rv, 'utf8');
console.log('RollbookView.vue patched successfully');

// 2. src/rollbook/app.js
let app = fs.readFileSync('src/rollbook/app.js', 'utf8');

// Update switchView in app.js
const targetAppSwitchView = `  switchView(view) {
    this.state.view = view;
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === view);
    });

    if (view === 'absence' && (!this.state.absenceRegistryRecords || this.state.absenceRegistryRecords.length === 0)) {
      this.loadAbsenceRegistryData();
    }

    this.updatePrintOrientation();
    this.pushHashState();
    this.renderControls();
    this.renderContent();
  }`;

const replacementAppSwitchView = `  async switchView(view) {
    this.state.view = view;
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === view);
    });

    const viewNames = {
      homeroom: '원적학급 주간 출석부 데이터를 불러오는 중입니다...',
      moving: '이동수업 교실별 출석부 데이터를 불러오는 중입니다...',
      today: '실시간 출결 현황을 불러오는 중입니다...',
      absence: '결석계 대장 접수 내역을 조회하고 있습니다...',
      lunch: '급식 캘린더 데이터를 불러오는 중입니다...',
      finder: '학생 검색 데이터를 준비 중입니다...'
    };

    this.showLoading(true, viewNames[view] || '출석부 데이터를 불러오는 중입니다...');
    // 브라우저가 로딩 스피너를 먼저 페인트할 수 있도록 지연 양보
    await new Promise(r => setTimeout(r, 40));

    try {
      if (view === 'absence' && (!this.state.absenceRegistryRecords || this.state.absenceRegistryRecords.length === 0)) {
        await this.loadAbsenceRegistryData();
      }

      this.updatePrintOrientation();
      this.pushHashState();
      this.renderControls();
      this.renderContent();
    } finally {
      this.showLoading(false);
    }
  }`;

if (app.includes(targetAppSwitchView)) {
  app = app.replace(targetAppSwitchView, replacementAppSwitchView);
}

// Update showLoading in app.js
const targetShowLoading = `  showLoading(show) {
    const el = document.getElementById('loadingOverlay');
    if (el) {
      el.style.display = show ? 'flex' : 'none';
    }
  }`;

const replacementShowLoading = `  showLoading(show, message) {
    const el = document.getElementById('loadingOverlay');
    if (el) {
      if (message) {
        const textEl = el.querySelector('.loading-text');
        if (textEl) textEl.textContent = message;
      }
      el.style.display = show ? 'flex' : 'none';
    }
  }`;

if (app.includes(targetShowLoading)) {
  app = app.replace(targetShowLoading, replacementShowLoading);
}

// Update roomSelect and banSelect in app.js
const targetRoomSelect = `    // Room select (이동수업 학급 드롭다운)
    const roomSelect = document.getElementById('roomSelect');
    if (roomSelect) {
      roomSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        this.state.selectedRooms = (val === 'all') ? [...this.allRooms] : [val];
        this.pushHashState();
        this.renderControls();
        this.renderContent();
      }, { signal });
    }

    // Ban select (원적학급 학급 드롭다운)
    const banSelect = document.getElementById('banSelect');
    if (banSelect) {
      banSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        this.state.selectedBans = (val === 'all') ? [...this.allBans] : [parseInt(val, 10)];
        this.pushHashState();
        this.renderControls();
        this.renderContent();
      }, { signal });
    }`;

const replacementRoomSelect = `    // Room select (이동수업 학급 드롭다운)
    const roomSelect = document.getElementById('roomSelect');
    if (roomSelect) {
      roomSelect.addEventListener('change', async (e) => {
        const val = e.target.value;
        const msg = val === 'all' ? '전체 학급 교실 출석부를 불러오는 중입니다...' : \`\${val} 교실 출석부를 불러오는 중입니다...\`;
        this.showLoading(true, msg);
        await new Promise(r => setTimeout(r, 20));
        try {
          this.state.selectedRooms = (val === 'all') ? [...this.allRooms] : [val];
          this.pushHashState();
          this.renderControls();
          this.renderContent();
        } finally {
          this.showLoading(false);
        }
      }, { signal });
    }

    // Ban select (원적학급 학급 드롭다운)
    const banSelect = document.getElementById('banSelect');
    if (banSelect) {
      banSelect.addEventListener('change', async (e) => {
        const val = e.target.value;
        const msg = val === 'all' ? '전체 학급 주간 출석부를 불러오는 중입니다...' : \`3학년 \${val}반 주간 출석부를 불러오는 중입니다...\`;
        this.showLoading(true, msg);
        await new Promise(r => setTimeout(r, 20));
        try {
          this.state.selectedBans = (val === 'all') ? [...this.allBans] : [parseInt(val, 10)];
          this.pushHashState();
          this.renderControls();
          this.renderContent();
        } finally {
          this.showLoading(false);
        }
      }, { signal });
    }`;

if (app.includes(targetRoomSelect)) {
  app = app.replace(targetRoomSelect, replacementRoomSelect);
}

fs.writeFileSync('src/rollbook/app.js', app, 'utf8');
console.log('src/rollbook/app.js patched successfully');

