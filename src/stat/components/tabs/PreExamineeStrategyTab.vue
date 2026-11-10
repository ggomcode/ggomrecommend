<template>
  <div class="space-y-6">
    <!-- 1. 상단 히어로 배너 -->
    <div class="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
      <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-10 -top-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-bold flex items-center gap-1.5">
              <span>🧭</span>
              <span>2027·2028·2029 진학 나침반</span>
            </span>
            <span class="px-3 py-1 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30 text-xs font-bold">
              2028 대입 개편 종합 분석
            </span>
            <span class="px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-xs font-mono font-bold">
              상담 현장 즉시 활용
            </span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-black text-white m-0 tracking-tight leading-snug">
            2028 대입 개편 & 예비 수험생 진학 지도 전략
          </h1>
          <p class="text-xs sm:text-sm text-slate-300 m-0 max-w-3xl leading-relaxed">
            2028 수능의 <strong>선택과목 폐지</strong> 및 <strong>통합사회·통합과학 전원 필수 응시</strong>에 따라 현행의 '수능 사탐런'은 제도적으로 사라집니다. 그러나 사탐런이 증명한 <strong>학생들의 실리적 생존 심리와 과탐 기피 현상</strong>은 2028 체제에서 새로운 대입 변수로 전이됩니다. 본 탭에서는 그 핵심 시사점과 학년별 맞춤 전략을 체계적으로 제공합니다.
          </p>
        </div>

        <!-- 빠른 요약 배지 카드 -->
        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0 lg:w-72 space-y-2 text-right">
          <div class="text-[11px] text-slate-300 font-medium">대입 체제 핵심 지형 변화</div>
          <div class="text-base font-black text-amber-300">
            수능 탐구 공통화 ➔ 학생부 과탐 정밀 평가
          </div>
          <div class="text-[11px] text-indigo-200 leading-tight">
            내신 사탐런(과탐 기피) 경계령 & 수능최저 체감 난이도 급상승
          </div>
        </div>
      </div>

      <!-- 타겟 학년 탭 버튼 -->
      <div class="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-2">
        <span class="text-xs font-bold text-slate-400 mr-1">대상 학년별 보기:</span>
        <button
          v-for="target in gradeTargets"
          :key="target.id"
          type="button"
          @click="activeGrade = target.id"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeGrade === target.id
              ? 'bg-amber-400 text-slate-950 font-black shadow-md scale-102'
              : 'bg-white/10 text-white hover:bg-white/20'
          ]"
        >
          <span>{{ target.icon }}</span>
          <span>{{ target.label }}</span>
          <span class="text-[10px] opacity-80">({{ target.year }}대입)</span>
        </button>
      </div>
    </div>

    <!-- 2. 핵심 분석: 사탐런(71.9%)이 2028 대입에 던지는 4대 심층 시사점 -->
    <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 class="text-lg sm:text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <span>💡</span>
            <span>'사탐런(과탐 기피)' 현상이 2028 대입에 던지는 4대 시사점</span>
          </h2>
          <p class="text-xs text-slate-500 m-0 mt-1">
            수능 시험지에서 선택과목은 사라지지만, 수험생들의 '고효율 생존 본능'은 고교 교육과정과 학생부로 전이됩니다.
          </p>
        </div>
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200 text-xs font-black shrink-0">
          <span>🔥</span>
          <span>진학 교사 핵심 브리핑 포인트</span>
        </span>
      </div>

      <!-- 4대 시사점 카드 그리드 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <!-- 시사점 1 -->
        <div class="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 hover:border-indigo-300 transition-all space-y-2.5">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center font-mono">01</span>
            <h3 class="text-sm font-black text-slate-900 m-0">수능 사탐런 ➔ 고교 내신의 '과탐 기피(내신 사탐런)'로 전이</h3>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed m-0">
            학생들이 사탐런을 감행한 본질은 사회가 좋아서가 아니라 <strong>과탐의 극심한 학습량과 의대생·N수생에 의한 등급 분쇄 공포</strong> 때문이었습니다.
            2028 수능에서는 수능 과목을 피할 수 없게 되자, 역으로 <strong>고2~3 내신에서 성적 따기 쉬운 과목만 찾고 물리·화학 등 핵심 과탐을 기피하는 '내신 사탐런'</strong> 현상이 심화될 위험이 큽니다.
          </p>
          <div class="p-2.5 rounded-xl bg-white border border-rose-100 text-[11px] text-rose-900 font-medium">
            ⚠️ <strong>지도 경계령:</strong> 내신 5등급제 상대평가에서 불리할까 봐 이공계 핵심 과목을 회피하면, 대입 서류평가에서 치명적인 불이익을 받게 됩니다.
          </div>
        </div>

        <!-- 시사점 2 -->
        <div class="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 hover:border-indigo-300 transition-all space-y-2.5">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center font-mono">02</span>
            <h3 class="text-sm font-black text-slate-900 m-0">대학의 필연적 반격: 학생부(과탐 이수·세특) 정밀 평가</h3>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed m-0">
            2028 수능 탐구가 1학년 수준의 공통과목(통합과학·통합사회)으로 축소되면, <strong>상위권 이공계 대학(서울대, 연고대, 카이스트 등)은 수능 성적표만으로 이과 역량을 검증할 수 없습니다.</strong>
            따라서 <strong>정시에서도 학생부 교과평가(정성평가)를 전면 도입</strong>하고, 수시 학종에서 <strong>고2~3 물리/화학/미적분II/기하 이수 여부</strong>를 절대적 당락 요소로 반영합니다.
          </p>
          <div class="p-2.5 rounded-xl bg-white border border-indigo-100 text-[11px] text-indigo-900 font-medium">
            🎯 <strong>진학 팩트:</strong> "수능 탐구가 쉬워진 만큼, 대학은 고교 3년간 학생이 어떤 과목에 과감히 도전했는지를 매섭게 검증합니다."
          </div>
        </div>

        <!-- 시사점 3 -->
        <div class="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 hover:border-indigo-300 transition-all space-y-2.5">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center font-mono">03</span>
            <h3 class="text-sm font-black text-slate-900 m-0">수시 수능 최저학력기준의 '체감 난이도 급상승'</h3>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed m-0">
            기존 일반고의 주효한 전략은 "과탐은 놔두고 사문·생윤 1과목을 집중 공략해 2등급을 따서 수시 최저(2합5, 3합7)를 맞추는 것"이었습니다.
            그러나 2028에는 <strong>[통합사회 1과목 + 통합과학 1과목]</strong>이 고정되어 우회로가 차단됩니다.
            문과생에게는 <code>통합과학</code>이, 이과생에게는 1문항 실수로 등급이 추락하는 <code>통합사회</code>가 최저 미충족의 거대한 덫이 됩니다.
          </p>
          <div class="p-2.5 rounded-xl bg-white border border-amber-100 text-[11px] text-amber-950 font-medium">
            📊 <strong>충격 예측:</strong> 편법성 1과목 몰입이 불가능해져, 일반고 학생들의 실질 수능 최저 충족률이 전반적으로 하락할 전망입니다.
          </div>
        </div>

        <!-- 시사점 4 -->
        <div class="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 hover:border-indigo-300 transition-all space-y-2.5">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center font-mono">04</span>
            <h3 class="text-sm font-black text-slate-900 m-0">고1 통합사회·통합과학의 위상 '수능 코어 과목' 격상</h3>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed m-0">
            과거 통합사회·통합과학은 1학년 때 지나가는 교양·내신 과목으로 여겨졌습니다.
            그러나 2028 체제에서는 <strong>고3 수능 당일까지 수능 성적표의 절반을 차지하는 메인 수능 과목</strong>으로 격상됩니다.
            1학년 1학기 첫 시험부터 수능 실전 연계형 사고력을 길러두지 않으면 고3 때 다시 1학년 교과서를 뒤적여야 하는 촌극이 빚어집니다.
          </p>
          <div class="p-2.5 rounded-xl bg-white border border-emerald-100 text-[11px] text-emerald-950 font-medium">
            🚀 <strong>현장 대응:</strong> 고1 단계의 통사·통과를 "고3 수능 직결 과목"으로 프레이밍하여 조기 학습 몰입도를 높여야 합니다.
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 학년별 맞춤 입시 로드맵 (고2 vs 고1 vs 중3) -->
    <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 class="text-lg sm:text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <span>🎯</span>
            <span>학년별 맞춤 진학 지도 가이드: {{ currentTargetData.gradeTitle }}</span>
          </h2>
          <p class="text-xs text-slate-500 m-0 mt-1">
            적용 대입 제도: <strong>{{ currentTargetData.systemLabel }}</strong> (입시 로드맵 및 상담 액션 플랜)
          </p>
        </div>
        <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            v-for="target in gradeTargets"
            :key="target.id"
            type="button"
            @click="activeGrade = target.id"
            :class="[
              'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeGrade === target.id ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            {{ target.shortLabel }}
          </button>
        </div>
      </div>

      <!-- 선택된 학년의 3단 상세 전략 카드 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- 카드 1: 수능 전략 -->
        <div class="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-3">
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-indigo-600 text-white text-xs">📝</span>
            <h4 class="text-sm font-black text-indigo-950 m-0">수능(CSAT) 대비 전략</h4>
          </div>
          <ul class="text-xs text-slate-700 space-y-2 list-disc list-inside pl-1 leading-relaxed">
            <li v-for="(item, idx) in currentTargetData.csatStrategy" :key="idx">
              <span class="font-bold text-slate-900">{{ item.title }}:</span> {{ item.desc }}
            </li>
          </ul>
        </div>

        <!-- 카드 2: 내신 & 학생부 전략 -->
        <div class="p-5 rounded-2xl border border-amber-100 bg-amber-50/40 space-y-3">
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-amber-600 text-white text-xs">📚</span>
            <h4 class="text-sm font-black text-amber-950 m-0">내신 & 학생부 설계 전략</h4>
          </div>
          <ul class="text-xs text-slate-700 space-y-2 list-disc list-inside pl-1 leading-relaxed">
            <li v-for="(item, idx) in currentTargetData.gpaStrategy" :key="idx">
              <span class="font-bold text-slate-900">{{ item.title }}:</span> {{ item.desc }}
            </li>
          </ul>
        </div>

        <!-- 카드 3: 진학 상담 지도 팁 -->
        <div class="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 space-y-3">
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-emerald-600 text-white text-xs">💬</span>
            <h4 class="text-sm font-black text-emerald-950 m-0">교사 상담 코칭 가이드</h4>
          </div>
          <ul class="text-xs text-slate-700 space-y-2 list-disc list-inside pl-1 leading-relaxed">
            <li v-for="(item, idx) in currentTargetData.counselStrategy" :key="idx">
              <span class="font-bold text-slate-900">{{ item.title }}:</span> {{ item.desc }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 추천 과목 이수 매트릭스 (2028 체제 전용 안내) -->
      <div v-if="activeGrade !== 'grade2'" class="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-xs sm:text-sm font-black text-amber-300 m-0 flex items-center gap-2">
            <span>🛡️</span>
            <span>2028 개편 체제 핵심 전공별 필수 권장 이수 과목 가이드</span>
          </h4>
          <span class="text-[11px] text-slate-400">서울대·주요 15개대 발표안 기준</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div class="p-3 rounded-xl bg-white/10 space-y-1">
            <div class="font-bold text-emerald-300">컴퓨터·전기전자·기계공학</div>
            <div class="text-[11px] text-slate-300">미적분Ⅱ, 기하, 물리학, 화학 필수</div>
            <div class="text-[10px] text-slate-400">※ 물리학 미이수 시 서류 평가 치명적 감점</div>
          </div>
          <div class="p-3 rounded-xl bg-white/10 space-y-1">
            <div class="font-bold text-sky-300">의약학·생명공학·화학계열</div>
            <div class="text-[11px] text-slate-300">미적분Ⅱ, 화학, 생명과학 필수</div>
            <div class="text-[10px] text-slate-400">※ 실험·탐구 연계 심화과목 적극 이수</div>
          </div>
          <div class="p-3 rounded-xl bg-white/10 space-y-1">
            <div class="font-bold text-rose-300">경영·경제·사회과학계열</div>
            <div class="text-[11px] text-slate-300">대수, 미적분Ⅰ, 확률과 통계, 경제</div>
            <div class="text-[10px] text-slate-400">※ 수리적 분석력 및 데이터 활용 세특 필수</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 학부모 & 학생 실전 상담 Q&A 아코디언 -->
    <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 class="text-lg sm:text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <span>❓</span>
            <span>상담 현장에서 학부모·학생이 가장 많이 묻는 핵심 질문 TOP 5</span>
          </h2>
          <p class="text-xs text-slate-500 m-0 mt-1">
            질문을 클릭하면 상담 현장에서 바로 인용할 수 있는 전문가 표준 답변을 확인하실 수 있습니다.
          </p>
        </div>
        <span class="text-xs font-bold text-slate-400 font-mono">Q&A 총 5문항</span>
      </div>

      <div class="space-y-2.5">
        <div
          v-for="(qa, idx) in faqList"
          :key="idx"
          class="border border-slate-200 rounded-2xl overflow-hidden transition-all"
        >
          <button
            type="button"
            @click="toggleFaq(idx)"
            class="w-full p-4 text-left flex items-center justify-between gap-3 bg-slate-50/70 hover:bg-slate-100/80 transition-colors cursor-pointer border-none"
          >
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0 font-mono">
                Q{{ idx + 1 }}
              </span>
              <span class="text-xs sm:text-sm font-black text-slate-900">
                {{ qa.question }}
              </span>
            </div>
            <span class="text-slate-400 text-xs shrink-0">
              {{ openedFaqIndex === idx ? '▲ 접기' : '▼ 답변 보기' }}
            </span>
          </button>

          <div
            v-if="openedFaqIndex === idx"
            class="p-4 sm:p-5 bg-white border-t border-slate-200 text-xs text-slate-700 leading-relaxed space-y-3"
          >
            <div class="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 font-bold">
              💬 <strong>상담 핵심 한 줄 요약:</strong> {{ qa.summary }}
            </div>
            <p class="m-0 text-slate-600 leading-relaxed whitespace-pre-line">
              {{ qa.answer }}
            </p>
            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                @click="copyFaqScript(qa)"
                class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>📋</span>
                <span>답변 스크립트 복사</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. 1:1 상담용 맞춤 요약 스크립트 생성 및 인쇄 도구 -->
    <div class="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-md space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-base sm:text-lg font-black text-white m-0 flex items-center gap-2">
            <span>🖨️</span>
            <span>1:1 진학 상담용 맞춤 요약 카드 출력 도구</span>
          </h3>
          <p class="text-xs text-slate-300 m-0 mt-0.5">
            학생·학부모 상담 시 출력하거나 알림톡/문자로 발송할 수 있는 맞춤형 전략 요약지를 즉시 생성합니다.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="copyCounselSummary"
            class="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📋</span>
            <span>전략 요약 복사</span>
          </button>
          <button
            type="button"
            @click="printCounselCard"
            class="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span>🖨️</span>
            <span>상담 자료 인쇄</span>
          </button>
        </div>
      </div>

      <!-- 상담 요약 프리뷰 박스 -->
      <div id="counsel-preview-card" class="bg-white text-slate-900 p-5 rounded-2xl shadow-inner text-xs space-y-3 font-sans">
        <div class="flex items-center justify-between border-b pb-2.5 border-slate-200">
          <div class="font-black text-sm text-indigo-950">
            [포곡고등학교] {{ currentTargetData.gradeTitle }} 진학 지도 상담 핵심 전략 요약지
          </div>
          <span class="text-[11px] text-slate-500 font-mono">{{ new Date().toLocaleDateString('ko-KR') }} 발행</span>
        </div>

        <div class="space-y-1.5 text-slate-700 leading-relaxed">
          <p class="m-0"><strong>■ 대상 학년 및 제도:</strong> {{ currentTargetData.gradeTitle }} ({{ currentTargetData.systemLabel }})</p>
          <p class="m-0"><strong>■ 수능 대비 핵심:</strong> {{ currentTargetData.csatStrategy[0]?.desc }}</p>
          <p class="m-0"><strong>■ 학생부/내신 핵심:</strong> {{ currentTargetData.gpaStrategy[0]?.desc }}</p>
          <p class="m-0"><strong>■ 사탐런 시사점 반영:</strong> 2028 수능 공통화에 따라 고교 내신 단계의 과탐 이수 여부가 대입 당락의 핵심 변수로 작용하므로, 이공계 지망 시 절대 핵심 과탐(물리·화학)을 기피하지 말 것.</p>
        </div>

        <div class="pt-2 border-t border-dashed border-slate-200 text-[11px] text-slate-500 flex justify-between items-center">
          <span>지도 교사 소견: 수능 최저학력기준 조기 안착 및 전공 연계 위계성 과목 철저 이수 권고</span>
          <span class="font-bold text-indigo-700">진학상담실</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const activeGrade = ref('grade1') // 'grade2' (2027) | 'grade1' (2028) | 'middle3' (2029)
const openedFaqIndex = ref(0)

const gradeTargets = [
  { id: 'grade1', label: '예비 고2 (현 고1)', shortLabel: '고1 (2028)', year: '2028', icon: '🚀' },
  { id: 'grade2', label: '예비 고3 (현 고2)', shortLabel: '고2 (2027)', year: '2027', icon: '⚡' },
  { id: 'middle3', label: '예비 고1 (현 중3)', shortLabel: '중3 (2029)', year: '2029', icon: '🌱' }
]

const targetDetails = {
  grade1: {
    gradeTitle: '예비 고2 / 현 고1 (2028학년도 대입 개편 첫 세대)',
    systemLabel: '2028 개편 수능(통합사회·과학 공통) & 내신 5등급제 적용',
    csatStrategy: [
      {
        title: '통합사회·통합과학 수능 만점 전략',
        desc: '탐구가 1학년 공통과목으로 전환되므로, 만점자가 다수 발생하여 1문항 실수로 2등급으로 추락하는 초접전이 예상됩니다. 고1 개념을 고3까지 반복 복습해야 합니다.'
      },
      {
        title: '통합과학이 문과생의 수능 최저 킬러',
        desc: '문과 지망생도 과학탐구를 피할 수 없습니다. 수능 최저 충족을 위해 1학년 통합과학의 물리·화학 파트를 조기에 완성해야 합니다.'
      },
      {
        title: '공통수학(대수·미적Ⅰ·확통)의 변별력 확대',
        desc: '심화수학(미적Ⅱ·기하)이 수능에서 제외되면서, 공통수학 전 범위에서 까다로운 킬러/준킬러 문항이 출제될 가능성이 매우 높습니다.'
      }
    ],
    gpaStrategy: [
      {
        title: '내신 사탐런(과탐 기피) 절대 금지',
        desc: '수능에서 과탐 실력을 볼 수 없게 된 서울대, 연고대 등은 고2~3 학생부에서 물리·화학을 이수했는지를 정시/수시 모두에서 필수 검증합니다.'
      },
      {
        title: '내신 5등급제 1등급(10%) 사수',
        desc: '내신 1등급 비율이 4%에서 10%로 대폭 확대되므로, 상위권 대학 지원을 위해서는 주요 전공 과목 1등급 확보가 기본 디폴트가 됩니다.'
      },
      {
        title: '진로선택·융합선택 과목 세특 심화',
        desc: '단순 지필평가 점수뿐만 아니라, 실험, 보고서, 프로젝트 등 세특 기록의 전공 연계 깊이가 수시 학종의 합불을 가릅니다.'
      }
    ],
    counselStrategy: [
      {
        title: '학부모 상담 시',
        desc: '"수능에서 과탐이 없어졌다고 과학 공부를 줄이면 상위권 공대 합격이 불가능합니다. 2~3학년 때 물리학, 화학을 정면돌파하도록 지도해주세요"라고 설득합니다.'
      },
      {
        title: '학생 면담 시',
        desc: '사탐런의 유혹에 흔들리지 말고, 자신이 희망하는 학과의 대학별 필수 권장 과목표를 보여주며 교육과정 이수 계획표를 직접 점검하게 합니다.'
      }
    ]
  },
  grade2: {
    gradeTitle: '예비 고3 / 현 고2 (2027학년도 대입 - 현행 수능 마지막 세대)',
    systemLabel: '현행 수능(문·이과 선택형) & 내신 9등급제 마지막 적용',
    csatStrategy: [
      {
        title: '사탐런 전략의 적극적 활용',
        desc: '자연계열 학생이라도 과탐 등급 방어가 불안하다면, 주요 대학의 과탐 필수 폐지 추세에 맞춰 사탐 1~2과목 전향으로 수능 최저 충족 확률을 극대화할 수 있습니다.'
      },
      {
        title: '대학별 과탐 가산점 영향력 사전 계산',
        desc: '일부 상위권 대학(서울대, 연세대 등)의 과탐 3~5% 가산점이 사탐 백분위 상승분으로 역전 가능한지 정밀 시뮬레이션 후 과목을 확정해야 합니다.'
      },
      {
        title: '수학 미적분 고득점 표준점수 사수',
        desc: '탐구를 사탐으로 돌리더라도, 수학에서 미적분을 고수해야 표점 우위를 점하고 자연계 및 상경계 교차지원에서 유리한 고지를 점합니다.'
      }
    ],
    gpaStrategy: [
      {
        title: '3학년 1학기 내신 총력전',
        desc: '현행 9등급제 체제의 마지막 세대이므로, 3학년 1학기 진로선택 A등급 확보 및 석차등급 과목 등급 방어가 수시의 승패를 결정합니다.'
      },
      {
        title: '수능최저 기준 맞춤형 대학 라인업',
        desc: '사탐 1과목 반영 대학과 2과목 평균 반영 대학을 구분하여 6장 수시 지원 카드를 입체적으로 설계해야 합니다.'
      }
    ],
    counselStrategy: [
      {
        title: '사탐런 상담 기준',
        desc: '현재 과탐이 4등급 이하이고 수시 학생부교과/종합에서 수능 최저 충족이 절실한 학생에게는 조기 사탐 전향(사문/생윤 등)을 강력 추천합니다.'
      }
    ]
  },
  middle3: {
    gradeTitle: '예비 고1 / 현 중3 (2029학년도 대입 - 고교학점제 전면 세대)',
    systemLabel: '2028 개편 수능 전면 적용 & 고교학점제 성취평가제 전면화',
    csatStrategy: [
      {
        title: '중3 겨울방학 통합과학·통합사회 기초 선행',
        desc: '고1 3월 모의고사부터 통사·통과가 수능 범위에 포함되므로, 방학 중 고1 통합과학 4대 파트(역학, 화학결합, 유전, 지구시스템)를 미리 정리해야 합니다.'
      },
      {
        title: '국어·수학 공통과목 독해력 및 연산 기본기',
        desc: '선택과목이 없어진 만큼, 고교 공통과목(공통수학1·2, 공통국어1·2)의 깊이 있는 서술형·사고력 문항 훈련이 필수적입니다.'
      }
    ],
    gpaStrategy: [
      {
        title: '고교 선택 시 교육과정 편성표 사전 확인',
        desc: '자신이 지망할 고등학교가 희망 전공에 필요한 심화 과목(물리학Ⅱ, 인공지능수학 등)을 개설해 주는지 입학 전 반드시 학교알리미에서 확인해야 합니다.'
      },
      {
        title: '1학년 내신 첫 학기 승부',
        desc: '5등급제에서는 1학년 내신에서 1등급(10%)을 놓치면 2~3학년 때 만회하기가 이전 9등급제보다 구조적으로 훨씬 어렵습니다.'
      }
    ],
    counselStrategy: [
      {
        title: '고입 설명회 활용',
        desc: '학부모님들께 "포곡고등학교는 2028 개편 체제에 맞춘 다양한 탐구·심화 교과목이 탄탄하게 개설되어 있어 학생부 경쟁력에서 압도적으로 유리하다"는 점을 강조합니다.'
      }
    ]
  }
}

const currentTargetData = computed(() => {
  return targetDetails[activeGrade.value] || targetDetails.grade1
})

const faqList = [
  {
    question: '2028 수능은 탐구 선택과목이 없는데, 과학이나 사회 학원 선행을 어떻게 시켜야 하나요?',
    summary: '고1 통합과학·통합사회가 곧 수능 과목이므로 1학년 내신 집중이 곧 수능 대비입니다.',
    answer: `2028 수능부터는 물리학Ⅰ, 생명과학Ⅰ 같은 개별 선택과목이 수능 시험지에서 완전히 사라집니다. 수능 탐구 영역은 오직 고등학교 1학년 공통과목인 '통합사회'와 '통합과학'에서만 출제됩니다.\n\n따라서 굳이 중3~고1 시기에 무리해서 고2 선택과목(물리/화학 수능 인강 등)을 미리 선행할 필요가 전혀 없습니다. 대신 고1 과정의 통합과학(특히 학생들이 어려워하는 역학 시스템과 화학 변화)과 통합사회를 완벽하게 마스터하는 것이 곧 1학년 내신 1등급과 고3 수능 만점을 동시에 잡는 가장 확실한 길입니다.`
  },
  {
    question: '내신 5등급제에서는 등급 잘 나오는 과목만 골라 들으면 안 되나요? 물리학 안 들었다고 대학이 떨어뜨리나요?',
    summary: '네, 상위권 이공계열은 물리학/화학 미이수 시 서류평가에서 치명적인 불이익을 받습니다.',
    answer: `절대 안 됩니다. 서울대, 연세대, 고려대, 성균관대 등 주요 대학은 이미 2028 대입 전형 예고를 통해 '전공 연계 핵심 권장 과목'을 강력히 반영하겠다고 공표했습니다.\n\n수능에서 학생의 과탐 실력을 측정할 수 없기 때문에, 대학 입학사정관들은 학생부의 2~3학년 과목 이수 이력을 돋보기로 들여다봅니다. 공대 지망생이 점수 따기 쉬운 과목만 찾아 듣고 '물리학'이나 '미적분Ⅱ'를 이수하지 않았다면, 내신 평점이 아무리 높아도 전공적합성 및 학업역량 평가에서 최하 등급을 받고 불합격할 확률이 매우 높습니다.`
  },
  {
    question: '수학에서 심화수학(미적분Ⅱ + 기하)이 수능에서 빠졌는데, 학교 수업에서도 안 들어도 되나요?',
    summary: '수능에서는 빠졌지만, 자연계열 학생부 종합전형 및 수시 교과 정성평가에서는 필수입니다.',
    answer: `교육부 발표대로 수능 시험에서는 심화수학이 출제되지 않습니다. 그러나 이것은 수능 수험 부담을 줄여주기 위한 조치일 뿐, 대학에서 배우지 않고 와도 된다는 뜻이 결코 아닙니다.\n\n공학, 자연과학, 의약학, 경제학 등 고도의 수학적 해석력이 필요한 학과에서는 고등학교에서 '미적분Ⅱ'와 '기하'를 이수했는지를 학생부 서류평가의 핵심 잣대로 삼습니다. 수능에 안 나온다고 이 과목들을 이수하지 않고 입학하면 대학교 1학년 공학수학이나 미적분학 수업을 전혀 따라갈 수 없습니다.`
  },
  {
    question: '2028 수능 통합사회·통합과학 시험 난이도는 고1 수준으로 쉽게 출제될까요?',
    summary: '기본 개념은 고1 수준이지만, 변별력을 위해 융합형 추론 및 복합 자료해석 문항이 대거 출제됩니다.',
    answer: `교육과정평가원의 예시 문항을 보면, 교과서의 지식 암기형 문항보다는 과학적 탐구 실험 설계, 일상생활 복합 문제 해결, 사회·과학 융합 자료 해석 등 수능 특유의 고난도 추론 문항이 출제됩니다.\n\n특히 모든 인문계·자연계 수험생 40만 명이 동일한 시험지로 경쟁하므로, 상위 4%(1등급)와 상위 11%(2등급)를 가르기 위해 지문 길이가 길고 매력적인 오답이 포함된 까다로운 준킬러 문항이 3~4문항 반드시 배치됩니다. '고1 수준이니 대충 해도 되겠지'라고 방심하면 2~3등급으로 밀려 수능 최저를 맞추지 못하게 됩니다.`
  },
  {
    question: '2028 체제에서 수시 수능 최저학력기준 맞추기가 전보다 훨씬 어려워진다는데 사실인가요?',
    summary: '네, 사실입니다. 기존의 사탐 1과목 우회 전략이 불가능해져 실질 충족률이 떨어집니다.',
    answer: `정확한 지적이십니다. 지금까지 일반고 수험생들의 대표적인 수시 최저 충족 비결은 "자신 없는 과목은 과감히 버리고, 사탐 1과목에 집중 투자해 2등급을 받아내는 전략(사탐런)"이었습니다.\n\n하지만 2028부터는 통합사회와 통합과학 두 과목을 모두 치러야 하며, 대학들은 두 과목 평균 또는 각각의 등급을 요구할 것입니다. 즉, 문과 학생은 통합과학을, 이과 학생은 통합사회를 피할 수 없기 때문에 한쪽 영역에 약점이 있는 학생은 과거보다 수능 최저를 충족하기가 훨씬 까다로워집니다.`
  }
]

function toggleFaq(idx) {
  if (openedFaqIndex.value === idx) {
    openedFaqIndex.value = -1
  } else {
    openedFaqIndex.value = idx
  }
}

function copyFaqScript(qa) {
  const text = `[질문] ${qa.question}\n\n[핵심 요약] ${qa.summary}\n\n[상세 상담 답변]\n${qa.answer}`
  navigator.clipboard.writeText(text).then(() => {
    alert('질문 및 상담 답변 스크립트가 클립보드에 복사되었습니다. 상담 메모나 학부모 메시지에 활용하세요.')
  }).catch(() => {
    alert('복사에 실패했습니다. 텍스트를 직접 복사해 주세요.')
  })
}

function copyCounselSummary() {
  const el = document.getElementById('counsel-preview-card')
  if (!el) return
  const text = el.innerText
  navigator.clipboard.writeText(text).then(() => {
    alert('상담 요약지 내용이 클립보드에 복사되었습니다!')
  }).catch(() => {
    alert('복사에 실패했습니다.')
  })
}

function printCounselCard() {
  window.print()
}
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  #counsel-preview-card, #counsel-preview-card * {
    visibility: visible;
  }
  #counsel-preview-card {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: none;
    box-shadow: none;
  }
}
</style>
