<template>
  <div class="py-8 px-4 sm:px-10 max-w-6xl mx-auto space-y-6">
    <!-- 1. 헤더 안내 배너 -->
    <div class="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-900/40">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
              1·2·3학년 PDF/엑셀 성적일람표 등록
            </span>
            <span class="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[11px] font-mono font-bold">
              {{ autoAdmissionYear }}학년도 대입 연동
            </span>
          </div>
          <h1 class="text-xl sm:text-2xl font-black text-white m-0 tracking-tight flex items-center gap-2">
            <span>📊</span>
            <span>모의고사 성적일람표 등록</span>
          </h1>
          <p class="text-xs text-slate-300 mt-2 m-0 leading-relaxed max-w-2xl">
            <strong>1·2학년</strong>은 학급별 <strong>성적일람표 PDF(.pdf)</strong>를 업로드하면 자동 파싱(국/수 공통과목, 제1선택 사탐, 제2선택 과탐)되어 시트 규격으로 등록됩니다.<br class="hidden sm:inline" />
            <strong>3학년</strong>은 대교협 엑셀(.xlsx) 또는 성적일람표 PDF를 등록할 수 있으며, 모두 원본 시트의 <code class="px-1.5 py-0.5 rounded bg-indigo-800/80 text-amber-300 font-mono font-bold">{{ targetSheetName }}</code> 탭에 학년별로 안전하게 적재됩니다.
          </p>
        </div>

        <!-- 학년도 & 시트 배지 카드 -->
        <div class="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 shrink-0 text-right space-y-1">
          <div class="text-[11px] text-slate-300 font-medium">자동 분류 대상 시트 탭</div>
          <div class="text-base font-black text-amber-300 font-mono tracking-wide">
            {{ targetSheetName }}
          </div>
          <div class="text-[10px] text-indigo-200">
            고3: {{ autoAdmissionYear }}대입 | 고1·2: {{ autoAcademicYear }}학사
          </div>
        </div>
      </div>
    </div>

    <!-- 2. [아코디언 가이드] 모의고사 성적 등록 매뉴얼: PDF 저장 ➔ 대교협 등록 ➔ 엑셀 추출 ➔ 시트 반영 -->
    <div class="bg-white rounded-2xl shadow-sm border border-indigo-200/80 overflow-hidden transition-all duration-200">
      <!-- 아코디언 헤더 (클릭 시 접기/펼치기) -->
      <button
        type="button"
        @click="isGuideOpen = !isGuideOpen"
        class="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left bg-linear-to-r from-indigo-50/80 via-sky-50/60 to-white hover:bg-indigo-50 transition-colors border-none cursor-pointer"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <FileSpreadsheet :size="22" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10.5px] font-black tracking-wide">
                필독 가이드
              </span>
              <span class="text-xs sm:text-sm font-black text-slate-900">
                모의고사 성적 등록 매뉴얼: PDF 저장 ➔ 대교협 등록 ➔ 엑셀 추출 ➔ 시트 반영
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1 m-0 hidden sm:block">
              1) 성적통지시스템 PDF 저장 방법 ➔ 2) 대교협 프로그램에 PDF 업로드 ➔ 3) 대교협 엑셀 다운로드 ➔ 4) 본 시스템 등록 전 과정 안내
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0 text-indigo-700 font-bold text-xs bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs">
          <span>{{ isGuideOpen ? '가이드 접기' : '등록 가이드 펼치기' }}</span>
          <ChevronUp v-if="isGuideOpen" :size="18" />
          <ChevronDown v-else :size="18" />
        </div>
      </button>

      <!-- 아코디언 본문 -->
      <div v-show="isGuideOpen" class="p-5 sm:p-7 border-t border-indigo-100 bg-white space-y-7">
        
        <!-- 4단계 핵심 프로세스 카드 그리드 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- STEP 1: PDF 저장 -->
          <div class="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-200/90 flex flex-col justify-between space-y-3 relative hover:border-indigo-300 transition-colors">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-black flex items-center justify-center">1</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">출발 단계</span>
              </div>
              <h4 class="text-xs sm:text-sm font-black text-slate-900 m-0">성적일람표 PDF 저장</h4>
              <p class="text-[11.5px] text-slate-600 m-0 leading-relaxed">
                교육청 학평 성적처리시스템 또는 평가원 수능성적통지시스템에서 <strong>[학급별 성적일람표]</strong>를 조회합니다.
              </p>
              <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200/70 text-[11px] text-amber-900 leading-snug">
                <strong>💡 리포트 뷰어 저장 요령:</strong><br />
                화면에 '저장' 버튼이 없는 경우, 상단 <strong>[인쇄(프린터 모양)]</strong>를 누른 후 인쇄 대상을 <strong class="text-indigo-800">'PDF로 저장'</strong>으로 선택하여 파일로 저장하세요.
              </div>
            </div>
            <div class="pt-2 text-[10.5px] text-slate-500 border-t border-slate-200/60 font-mono">
              결과: 반별 .pdf 파일 확보
            </div>
          </div>

          <!-- STEP 2: 대교협 PDF 등록 -->
          <div class="bg-blue-50/50 rounded-2xl p-4.5 border border-blue-200 flex flex-col justify-between space-y-3 relative hover:border-blue-400 transition-colors">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">2</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">대교협 등록</span>
              </div>
              <h4 class="text-xs sm:text-sm font-black text-blue-950 m-0">대교협에 PDF 등록</h4>
              <p class="text-[11.5px] text-blue-950/80 m-0 leading-relaxed">
                대교협 프로그램 상단 메뉴 <strong>[학생자료입력/생성]</strong> ➔ <strong>[수능/모의고사 성적 DB 생성]</strong> 창으로 이동합니다.<br />
                해당 학년(1·2·3학년)과 시험 회차를 선택합니다.
              </p>
              <div class="p-2.5 rounded-lg bg-white border border-blue-300 text-[11px] text-blue-900 leading-snug shadow-2xs">
                <strong>👉 우측 상단 파란색 버튼 클릭:</strong><br />
                <span class="inline-block mt-1 px-2.5 py-1 rounded bg-blue-600 text-white font-black text-[11px]">
                  수능/모의 성적표 PDF 등록
                </span><br />
                <span class="text-[10px] text-slate-500 mt-1 block">STEP 1의 PDF를 등록하면 대교협이 전교생을 100% 오류 없이 DB화합니다.</span>
              </div>
            </div>
            <div class="pt-2 text-[10.5px] text-blue-700 border-t border-blue-200 font-bold">
              ✓ 대교협 자체 DB 생성 완료
            </div>
          </div>

          <!-- STEP 3: 대교협 엑셀 다운로드 -->
          <div class="bg-emerald-50/50 rounded-2xl p-4.5 border border-emerald-200 flex flex-col justify-between space-y-3 relative hover:border-emerald-400 transition-colors">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">3</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">엑셀 추출 (핵심)</span>
              </div>
              <h4 class="text-xs sm:text-sm font-black text-emerald-950 m-0">전교생 엑셀 다운로드</h4>
              <p class="text-[11.5px] text-emerald-950/80 m-0 leading-relaxed">
                PDF 등록이 끝나면, 바로 그 창의 우측 하단에 있는 초록색 엑셀 아이콘 버튼을 클릭합니다.
              </p>
              <div class="p-2.5 rounded-lg bg-white border border-emerald-400 text-[11px] text-emerald-950 leading-snug shadow-2xs">
                <strong>👉 우측 하단 주황 테두리 버튼 클릭:</strong><br />
                <span class="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded bg-white border-2 border-amber-500 text-slate-800 font-black text-[11px]">
                  <FileSpreadsheet :size="13" class="text-emerald-600" />
                  선택회차 입력내용 엑셀다운
                </span><br />
                <span class="text-[10px] text-emerald-700 font-medium mt-1 block">11개 반 전교생 300여 명의 성적이 담긴 .xlsx 파일이 컴퓨터로 다운로드됩니다.</span>
              </div>
            </div>
            <div class="pt-2 text-[10.5px] text-emerald-700 border-t border-emerald-200 font-bold">
              ✓ 통합 엑셀(.xlsx) 파일 확보
            </div>
          </div>

          <!-- STEP 4: 본 시스템 등록 & 구글 시트 원클릭 누적 반영 -->
          <div class="bg-indigo-50/50 rounded-2xl p-4.5 border border-indigo-200 flex flex-col justify-between space-y-3 relative hover:border-indigo-400 transition-colors">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">4</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">원클릭 반영</span>
              </div>
              <h4 class="text-xs sm:text-sm font-black text-indigo-950 m-0">회차 선택 및 시트 반영</h4>
              <p class="text-[11.5px] text-indigo-950/80 m-0 leading-relaxed">
                상단에서 <strong>[학년]</strong>과 <strong>[시험 회차]</strong>를 선택하고 대교협 엑셀(.xlsx)을 드롭 영역에 올립니다.
              </p>
              <div class="p-2.5 rounded-lg bg-white border border-indigo-300 text-[11px] text-indigo-950 leading-snug shadow-2xs space-y-1">
                <strong>👉 [구글 시트에 즉시 반영] 클릭:</strong>
                <div class="text-[10.5px] text-slate-700 leading-normal">
                  • <strong>첫 회차:</strong> 원본 시트 <code class="bg-indigo-50 px-1 font-bold text-indigo-800">{{ targetSheetName }}</code> 탭 3행부터 44개 컬럼 규격으로 전교생 적재<br />
                  • <strong>추가 회차(5월·6월·9월 등):</strong> 기존 성적을 덮어쓰지 않고 <strong>다음 행으로 자동 누적</strong> 및 회차별 자동 정렬!
                </div>
              </div>
            </div>
            <div class="pt-2 text-[10.5px] text-indigo-700 border-t border-indigo-200 font-bold">
              ✓ 회차별 자동 누적 DB 구축 완료!
            </div>
          </div>
        </div>

        <!-- 실제 대교협 상담프로그램 화면 목업 (UI Preview) -->
        <div class="rounded-2xl border border-slate-300 overflow-hidden shadow-xs bg-slate-100">
          <!-- 윈도우 타이틀바 -->
          <div class="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2 font-mono">
              <span class="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
              <span class="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span class="font-bold ml-1">대교협 대입상담프로그램 - [수능/모의고사 성적 DB 생성] 실제 화면 예시</span>
            </div>
            <span class="text-[10px] text-slate-300">💡 아래 두 버튼의 위치를 꼭 확인해 주세요!</span>
          </div>

          <!-- 목업 본체 (캡처 이미지 레이아웃 100% 재현) -->
          <div class="p-4 sm:p-5 bg-slate-50 flex flex-col md:flex-row gap-5 justify-between items-start">
            <!-- 좌측 옵션 영역 -->
            <div class="space-y-4 flex-1">
              <div class="flex items-center gap-3">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span class="text-sm font-bold text-slate-800">수능/모의고사 성적 DB 생성</span>
                <div class="flex items-center gap-3 ml-4 text-xs font-semibold text-slate-700">
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="mock_grade_demo" disabled /> 1학년
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="mock_grade_demo" disabled /> 2학년
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer font-bold text-blue-700">
                    <input type="radio" name="mock_grade_demo" checked disabled /> ● 3학년 (1·2학년도 동일)
                  </label>
                </div>
              </div>

              <!-- 모의고사 선택 바 -->
              <div class="bg-white p-3 rounded-lg border border-slate-300 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                <span class="font-bold text-slate-600 shrink-0">&gt; 모의고사 선택:</span>
                <div class="px-2.5 py-1 rounded bg-slate-100 border border-slate-300 font-mono font-bold text-slate-800 flex-1 truncate">
                  2026년 03월 - 서울특별시교육청_3학년 (또는 해당 연월 모의고사)
                </div>
              </div>

              <div class="text-[11px] text-rose-600 font-bold">
                ※ [대교협 모의고사 전송] 학생 개인 정보는 제외하고 성적만 전송됩니다.
              </div>
              <div class="text-[11px] text-slate-500 space-y-0.5">
                <div>- 응시하지 않은 영역은 해당 셀을 모두 빈칸으로 해야합니다.</div>
                <div>- 과목명은 엑셀 콤보박스에 나타나는 과목명과 일치해야 합니다.</div>
                <div>- .pdf 확장자만 업로드 가능합니다.</div>
              </div>
            </div>

            <!-- 우측 핵심 버튼 그룹 (실제 캡처 화면 1:1 배치) -->
            <div class="w-full md:w-72 bg-white p-3.5 rounded-xl border border-slate-300 space-y-2 shrink-0 shadow-xs">
              <div class="text-[10.5px] font-bold text-slate-500 pb-1 border-b border-slate-200">
                대교협 프로그램 우측 버튼 목록
              </div>
              
              <!-- 1. 대교협 전송 버튼 -->
              <button type="button" disabled class="w-full py-1.5 px-3 rounded bg-sky-700 text-white font-bold text-xs opacity-70 cursor-not-allowed">
                대교협 모의고사 전송
              </button>

              <!-- 2. [핵심 버튼 1] 수능/모의 성적표 PDF 등록 -->
              <div class="relative p-1.5 rounded-lg bg-blue-50 border-2 border-blue-500">
                <div class="w-full py-1.5 px-3 rounded bg-blue-600 text-white font-black text-xs text-center shadow-xs">
                  수능/모의 성적표 PDF 등록
                </div>
                <div class="mt-1 text-[10.5px] text-blue-900 font-black text-center">
                  👆 1단계: 여기를 눌러 PDF 등록!
                </div>
              </div>

              <!-- 3. 선택회차 삭제 등 -->
              <button type="button" disabled class="w-full py-1 px-3 rounded bg-rose-200 text-rose-800 font-semibold text-[11px] opacity-60 cursor-not-allowed">
                선택회차 삭제
              </button>

              <!-- 4. [핵심 버튼 2] 선택회차 입력내용 엑셀다운 -->
              <div class="relative p-1.5 rounded-lg bg-amber-50 border-2 border-amber-500 mt-2">
                <div class="w-full py-1.5 px-3 rounded bg-white border border-emerald-600 text-slate-900 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs">
                  <FileSpreadsheet :size="14" class="text-emerald-600" />
                  <span>선택회차 입력내용 엑셀다운</span>
                </div>
                <div class="mt-1 text-[10.5px] text-amber-950 font-black text-center">
                  👆 2단계: PDF 등록 후 여기를 눌러 엑셀 다운로드!
                </div>
              </div>

              <!-- 5. 보조 버튼들 -->
              <div class="space-y-1 pt-1 opacity-50">
                <div class="text-[10px] text-center text-slate-500 border rounded py-0.5">수능/모의 통합엑셀양식 받기</div>
                <div class="text-[10px] text-center text-slate-500 border rounded py-0.5">모의고사 가채점 양식 받기</div>
              </div>
            </div>
          </div>
        </div>

        <!-- [관리자 전용] 구글 시트 원클릭 자동 저장을 위한 최초 1회 연동 매뉴얼 -->
        <div class="rounded-2xl border-2 border-indigo-300 bg-linear-to-b from-indigo-50/70 via-white to-white p-5 sm:p-6 space-y-5 shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-200/80">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black shadow-xs">
                관리자 필수 안내
              </span>
              <h4 class="text-sm sm:text-base font-black text-slate-900 m-0">
                ⚡ 구글 시트 원클릭 자동 저장을 위한 최초 1회 연동 매뉴얼 (타 학교 보급 시 필수)
              </h4>
            </div>
            <span class="text-xs text-indigo-700 font-bold bg-white px-3 py-1 rounded-full border border-indigo-200 shadow-2xs">
              소요시간: 약 1분 (학교당 최초 1회만 진행)
            </span>
          </div>

          <div class="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-950 leading-relaxed">
            <strong>💡 왜 이 작업이 필요한가요?</strong><br />
            구글 시트는 외부 프로그램이 데이터를 무단 수정하지 못하도록 차단되어 있습니다. 학교 관리자께서 아래 <strong>3단계</strong>를 거쳐 '웹 수신 주소(Web App URL)'를 시스템에 한 번만 등록해 두시면, <strong>앞으로 다른 모든 교사들은 대교협 엑셀 올리고 [구글 시트에 즉시 반영] 버튼만 누르면 1초 만에 시트에 자동 적재</strong>됩니다! (복사·붙여넣기 0%)
          </div>

          <!-- 3단계 시각적 스텝 카드 그리드 -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- 1단계 -->
            <div class="bg-white rounded-xl p-4 border border-indigo-200 shadow-2xs space-y-2">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">1</span>
                <span class="text-xs font-black text-slate-900">구글 시트에서 Apps Script 열기</span>
              </div>
              <p class="text-[11.5px] text-slate-600 leading-relaxed m-0">
                학교 원본 구글 스프레드시트를 열고, 상단 메뉴 <strong>[확장 프로그램] ➔ [Apps Script]</strong>를 클릭하여 코드 편집기를 엽니다.
              </p>
            </div>

            <!-- 2단계 -->
            <div class="bg-white rounded-xl p-4 border border-indigo-200 shadow-2xs space-y-2">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">2</span>
                <span class="text-xs font-black text-slate-900">수신 코드 붙여넣고 저장</span>
              </div>
              <p class="text-[11.5px] text-slate-600 leading-relaxed m-0">
                아래에 제공된 <strong>수신 코드</strong>를 복사하여 코드 편집창 맨 아래에 붙여넣고 <strong>저장(Ctrl + S)</strong> 버튼을 누릅니다.
              </p>
            </div>

            <!-- 3단계 -->
            <div class="bg-white rounded-xl p-4 border border-indigo-200 shadow-2xs space-y-2">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">3</span>
                <span class="text-xs font-black text-slate-900">웹 앱 배포 및 URL 등록</span>
              </div>
              <p class="text-[11.5px] text-slate-600 leading-relaxed m-0">
                우측 상단 <strong>[배포] ➔ [새 배포] ➔ 톱니바퀴 [웹 앱]</strong> 선택 후, 액세스 권한을 <strong class="text-rose-600">'모든 사용자'</strong>로 설정하여 배포합니다. 생성된 URL을 본 시스템의 <strong>[관리자 설정] ➔ [환경설정]</strong>에 등록하면 끝!
              </p>
            </div>
          </div>

          <!-- 코드 복사 박스 -->
          <div class="rounded-xl border border-slate-300 bg-slate-900 text-slate-100 p-4 space-y-2.5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="text-amber-400 font-bold text-xs">📋 구글 시트 Apps Script에 추가할 수신 코드</span>
                <span class="text-[10px] text-slate-400">(2단계에서 붙여넣을 코드)</span>
              </div>
              <button
                type="button"
                @click="copyGasSnippet"
                class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold border-none cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
              >
                <Copy :size="13" />
                <span>{{ copiedGasSnippet ? '수신 코드 복사 완료! ✓' : '수신 코드 전체 복사' }}</span>
              </button>
            </div>

            <pre class="m-0 text-[11px] font-mono leading-relaxed bg-slate-950/90 p-3 rounded-lg border border-slate-800 text-emerald-400 overflow-x-auto max-h-44"><code>{{ gasSnippetCode }}</code></pre>
            
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10.5px] text-slate-400 pt-1 border-t border-slate-800">
              <div>💡 <strong>배포 시 필수 체크:</strong> '다음 사용자 계정으로 실행: <span class="text-amber-300 font-bold">나</span>', '액세스 권한: <span class="text-amber-300 font-bold">모든 사용자</span>'로 지정해야 웹 브라우저에서 차단 없이 직접 저장됩니다.</div>
              <router-link to="/admin" class="text-indigo-300 hover:text-white underline shrink-0 font-bold">
                ⚙️ [관리자 설정 ➔ 환경설정]에서 URL 등록하기 ➔
              </router-link>
            </div>
          </div>
        </div>

        <!-- 1·2·3학년 공통 안내 및 스마트 누적 FAQ 카드 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          <div class="rounded-xl p-3.5 bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 leading-relaxed space-y-1">
            <div class="font-black flex items-center gap-1.5 text-indigo-900">
              <span>📌</span>
              <span>1학년, 2학년, 3학년 모두 100% 동일</span>
            </div>
            <p class="text-[11.5px] text-indigo-950/80 m-0">
              대교협 창 상단에서 <strong>1학년 / 2학년 / 3학년</strong> 라디오를 선택하고, 똑같이 <strong>[수능/모의 성적표 PDF 등록]</strong> ➔ <strong>[선택회차 입력내용 엑셀다운]</strong>을 받아 올리시면 됩니다.
            </p>
          </div>

          <div class="rounded-xl p-3.5 bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 leading-relaxed space-y-1">
            <div class="font-black flex items-center gap-1.5 text-emerald-900">
              <span>✨</span>
              <span>회차별 자동 누적 & 중복 방지</span>
            </div>
            <p class="text-[11.5px] text-emerald-950/80 m-0">
              3월(3~266행), 5월(267행~) 등 여러 시험을 차례로 올리시면 덮어쓰기 없이 행이 차곡차곡 누적됩니다. 만약 동일 회차를 다시 올리면 해당 회차만 최신으로 안전하게 자동 갱신됩니다.
            </p>
          </div>

          <div class="rounded-xl p-3.5 bg-amber-50/70 border border-amber-200 text-xs text-amber-950 leading-relaxed space-y-1">
            <div class="font-black flex items-center gap-1.5 text-amber-900">
              <span>📊</span>
              <span>탐구 원점수 0점 및 빈 컬럼 안내</span>
            </div>
            <p class="text-[11.5px] text-amber-950/80 m-0">
              대교협 실채점 엑셀의 특성상 탐구 원점수가 0이거나 일부 컬럼이 비어 있을 수 있습니다. 모든 대입 분석 및 수능최저는 <strong>[등급·표준점수·백분위]</strong>로 계산되므로 분석에 오차가 전혀 없습니다.
            </p>
          </div>
        </div>

      </div>
    </div>

    <!-- 2-1. [SEN진학 전용] 시트 저장 모의고사 SEN진학용 엑셀 다운로드 카드 -->
    <div class="bg-linear-to-r from-emerald-50/90 via-teal-50/70 to-indigo-50/80 rounded-2xl p-5 sm:p-6 shadow-sm border border-emerald-200/90 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
              <Download :size="16" />
            </span>
            <h3 class="text-sm font-black text-slate-900 m-0">
              시트 저장 모의고사 SEN진학용 엑셀 다운로드
            </h3>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              29개 컬럼 표준
            </span>
          </div>
          <p class="text-xs text-slate-600 m-0">
            구글 시트(<code class="font-bold text-emerald-800">{{ targetSheetName }}</code> 탭 등)에 이미 저장된 모의고사 성적을 서울시교육청 SEN진학 양식(29개 컬럼, 1·2행 복합 헤더)으로 즉시 다운로드합니다.
          </p>
        </div>

        <button
          type="button"
          @click="loadExistingSheetData(true)"
          :disabled="isLoadingExistingSheetRecords"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 text-xs font-semibold border border-slate-200 shadow-2xs cursor-pointer transition-colors shrink-0 disabled:opacity-50"
          title="구글 시트 모의고사 데이터 최신 새로고침"
        >
          <RefreshCw :size="13" :class="{ 'animate-spin': isLoadingExistingSheetRecords }" />
          <span>시트 데이터 새로고침</span>
        </button>
      </div>

      <!-- 회차 선택 드롭다운 및 다운로드 버튼 바 -->
      <div class="flex flex-wrap items-center gap-3 pt-0.5">
        <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-200/90 shadow-2xs">
          <label class="text-xs font-bold text-slate-700 whitespace-nowrap">다운로드 회차:</label>
          <div class="relative inline-block min-w-52.5">
            <select
              v-model="selectedExistingExamMonth"
              :disabled="isLoadingExistingSheetRecords || existingExamMonthOptions.length === 0"
              class="w-full appearance-none pl-2.5 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer transition-colors disabled:opacity-50"
            >
              <option v-if="isLoadingExistingSheetRecords" :value="null">
                ⏳ 시트 데이터 조회 중...
              </option>
              <option v-else-if="existingExamMonthOptions.length === 0" :value="null">
                등록된 {{ selectedGrade }}학년 모의고사 데이터가 없습니다
              </option>
              <option
                v-for="opt in existingExamMonthOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
            <ChevronDown :size="14" class="text-slate-500 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <button
          type="button"
          @click="downloadExistingMonthSenExcel"
          :disabled="isLoadingExistingSheetRecords || !selectedExistingExamMonth"
          class="px-4 py-2 text-xs font-bold text-white bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl border-none cursor-pointer transition-all shadow-2xs hover:shadow flex items-center gap-2"
        >
          <FileSpreadsheet :size="15" />
          <span>SEN진학용 엑셀 다운로드</span>
        </button>

        <div v-if="currentSelectedExistingMonthInfo" class="flex items-center gap-2 text-xs text-slate-600 font-medium">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>저장 파일명:</span>
          <code class="px-2 py-0.5 rounded-md bg-white text-emerald-900 border border-emerald-300 font-mono font-bold shadow-2xs">
            {{ currentSelectedExistingMonthInfo.fileName }}
          </code>
        </div>
      </div>
    </div>

    <!-- 3. 업로드 컨트롤 바 (학년 선택 + 엑셀 중심 드롭존) -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
      <!-- 3-1. 학년 및 모의고사 회차(몇 월) 선택 바 (한 줄 깔끔 배치) -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div class="flex items-center gap-2 shrink-0">
          <span class="w-1.5 h-4 bg-indigo-600 rounded-full shrink-0"></span>
          <span class="text-sm font-bold text-slate-800 whitespace-nowrap">응시 회차 선택</span>
          <span class="text-xs text-slate-400 font-normal hidden lg:inline whitespace-nowrap">(*업로드할 학년과 회차)</span>
        </div>

        <div class="flex items-center gap-2 shrink-0 flex-nowrap">
          <!-- 대상 학년 선택 드롭다운 버튼 -->
          <div class="flex items-center gap-1 shrink-0">
            <label class="text-xs font-bold text-slate-600 whitespace-nowrap">학년:</label>
            <div class="relative inline-block">
              <select
                v-model="selectedGrade"
                class="appearance-none pl-2.5 pr-7 py-1.5 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer transition-colors whitespace-nowrap"
              >
                <option :value="3">3학년 (고3)</option>
                <option :value="2">2학년 (고2)</option>
                <option :value="1">1학년 (고1)</option>
              </select>
              <ChevronDown class="w-3.5 h-3.5 text-indigo-700 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <!-- 모의고사 회차(몇 월) 선택 드롭다운 버튼 -->
          <div class="flex items-center gap-1 shrink-0">
            <label class="text-xs font-bold text-slate-600 whitespace-nowrap">시험 회차:</label>
            <div class="relative inline-block">
              <select
                v-model="selectedExam"
                class="appearance-none pl-2.5 pr-7 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
              >
                <option v-for="exam in availableExamList" :key="exam.value" :value="exam.value">
                  {{ exam.value }}
                </option>
              </select>
              <ChevronDown class="w-3.5 h-3.5 text-emerald-700 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <!-- 선택 요약 배지 -->
          <span class="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white shadow-2xs whitespace-nowrap shrink-0">
            {{ selectedGrade }}학년 · {{ selectedExam }}
          </span>
        </div>
      </div>

      <!-- 3-2. 성적 파일(PDF 또는 엑셀) 드래그앤드롭 영역 (Drag & Drop Zone) -->
      <div
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleFileDrop"
        :class="[
          'relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all duration-200 cursor-pointer',
          isDragging 
            ? 'border-emerald-500 bg-emerald-50/60 scale-[1.005]' 
            : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 bg-slate-50/40'
        ]"
        @click="triggerFileInput"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept=".pdf,.xlsx,.xls,.csv"
          multiple
          class="hidden"
          @change="handleFileInputChange"
        />

        <div class="flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <div class="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
            <FileSpreadsheet :size="32" />
          </div>
          <div class="space-y-1">
            <div class="text-base font-black text-slate-800">
              <span class="text-indigo-700 font-black">[{{ selectedGrade }}학년 · {{ selectedExam }}]</span> 
              {{ selectedGrade === 3 ? '성적일람표 PDF 또는 대교협 엑셀 파일' : '학급별 성적일람표 PDF 파일' }}을 올려주세요
            </div>
            <p class="text-xs text-slate-500 m-0">
              {{ selectedGrade === 3 
                ? '대교협 전교생 엑셀(.xlsx) 1개 또는 반별 성적일람표 PDF(.pdf)를 업로드하여 구글 시트에 반영합니다.' 
                : '1·2학년은 반별 성적일람표 PDF(.pdf)를 한 번에 여러 개 선택(드래그)하여 전교생을 즉시 취합할 수 있습니다.' }}
            </p>
          </div>
          <div class="flex flex-wrap items-center justify-center gap-2 pt-1">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-[11.5px] font-bold text-emerald-800 shadow-2xs">
              <span>📄 PDF / 엑셀 다중 선택 지원</span>
              <span>1반, 2반... 여러 파일 동시 선택 시 전교생 자동 합산</span>
            </div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-medium text-slate-600">
              <span>클릭하여 파일 선택(Ctrl 다중 선택) 또는 드래그앤드롭</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 등록된 모의고사 파일 상태 -->
    <div v-if="fileList.length > 0" class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-4 bg-emerald-600 rounded-full"></span>
          <h3 class="text-sm font-bold text-slate-800 m-0">
            등록된 모의고사 성적 파일
          </h3>
          <span class="text-xs font-bold text-indigo-700 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200">
            {{ selectedGrade }}학년 · {{ selectedExam }}
          </span>
        </div>

        <button
          @click="clearAllFiles"
          class="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-colors border-none cursor-pointer"
        >
          파일 비우기
        </button>
      </div>

      <!-- 단일/다중 파일 상태 카드 목록 -->
      <div
        v-for="(fItem, fIndex) in fileList"
        :key="fItem.id"
        class="p-4 rounded-xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        :class="[
          fItem.status === 'success' 
            ? 'bg-emerald-50/40 border-emerald-200 shadow-xs' 
            : fItem.status === 'error'
            ? 'bg-rose-50/40 border-rose-200'
            : 'bg-indigo-50/40 border-indigo-200 shadow-xs'
        ]"
      >
        <div class="flex items-center gap-3.5 min-w-0">
          <div 
            class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-xs shadow-xs"
            :class="fItem.name.toLowerCase().endsWith('.pdf') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'"
          >
            {{ fItem.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'XLS' }}
          </div>
          <div class="truncate leading-tight space-y-1">
            <div class="text-sm font-bold text-slate-800 truncate" :title="fItem.name">
              {{ fItem.name }}
            </div>
            <div class="text-xs text-slate-500 flex items-center gap-2">
              <span>{{ formatFileSize(fItem.size) }}</span>
              <span>•</span>
              <span class="font-bold text-indigo-700">{{ fItem.selectedGrade }}학년</span>
              <span v-if="fItem.parsedClass">•</span>
              <span v-if="fItem.parsedClass" class="font-bold text-blue-700">{{ fItem.parsedClass }}반</span>
              <span>•</span>
              <span class="font-bold text-emerald-800">{{ fItem.parsedExamName }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <!-- 파싱 중 스피너 -->
          <div v-if="fItem.status === 'parsing'" class="flex items-center gap-2 text-xs text-indigo-600 font-bold px-3 py-1.5 rounded-lg bg-indigo-100">
            <RefreshCw class="w-4 h-4 animate-spin" />
            <span>분석 진행 중…</span>
          </div>

          <!-- 성공 배지 -->
          <div v-else-if="fItem.status === 'success'" class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs">
              ✓ {{ fItem.parsedClass ? `${fItem.parsedClass}반 ` : '' }}{{ fItem.students.length }}명 파싱 완료
            </span>
          </div>

          <!-- 실패 배지 -->
          <div v-else-if="fItem.status === 'error'" class="flex flex-col items-end">
            <span class="px-3 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold" :title="fItem.error">
              ⚠️ 파싱 실패: {{ fItem.error }}
            </span>
          </div>

          <!-- 개별 파일 삭제 -->
          <button
            @click="removeFile(fIndex)"
            class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white border-none cursor-pointer transition-colors"
            title="파일 삭제"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- 5. 통합 파싱 결과 미리보기 및 저장 액션 -->
    <div v-if="allParsedStudents.length > 0" class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
      <!-- 5-1. 구글 시트 반영 배너 (단일 반영 버튼만 깔끔하게 유지) -->
      <div class="rounded-xl p-4 bg-linear-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-base">📋</span>
            <span class="text-xs font-black text-slate-900">
              원본 구글 시트 [{{ targetSheetName }}] 탭에 44개 컬럼 규격(A~AR) 즉시 반영
            </span>
          </div>
          <p class="text-[11.5px] text-slate-600 m-0 leading-relaxed">
            아래 <strong class="text-emerald-700">구글 시트에 즉시 반영</strong> 버튼을 누르면 <strong>{{ selectedExam }} 전교생 {{ allParsedStudents.length }}명의 성적이 원본 구글 시트로 직접 전송</strong>됩니다.<br class="hidden sm:inline" />
            원본 시트의 <code class="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 font-mono font-bold">{{ targetSheetName }}</code> 탭 <strong>44개 컬럼 규격(A~AR)에 맞춰 회차별로 자동 적재(기존 회차 유지 및 누적)</strong>됩니다.
          </p>
        </div>

        <button
          type="button"
          @click="handleSaveToGoogleSheet"
          :disabled="isSavingToSheet"
          class="shrink-0 px-4 py-2.5 text-xs font-black text-white bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 rounded-xl border-none cursor-pointer transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <UploadCloud :size="15" />
          <span>{{ isSavingToSheet ? '구글 시트 반영 중…' : `구글 시트 [${targetSheetName}]에 즉시 반영` }}</span>
          <ExternalLink :size="13" class="opacity-80" />
        </button>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-600 rounded-full"></span>
            <h3 class="text-sm font-black text-slate-900 m-0">
              파싱 완료 학생 성적 미리보기 (총 {{ allParsedStudents.length }}명)
            </h3>
          </div>
          <p class="text-xs text-slate-400 mt-1 m-0">
            구글 시트 <code class="text-indigo-600 font-mono font-bold">{{ targetSheetName }}</code> 탭 규격에 100% 매핑된 명단입니다.
          </p>
        </div>
      </div>

      <!-- 미리보기 테이블 -->
      <div class="overflow-x-auto rounded-xl border border-slate-200 max-h-96 overflow-y-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead class="bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200 shadow-2xs">
            <tr>
              <th class="py-2.5 px-3">학년</th>
              <th class="py-2.5 px-3">반</th>
              <th class="py-2.5 px-3">번호</th>
              <th class="py-2.5 px-3">성명</th>
              <th class="py-2.5 px-3">시험명</th>
              <th class="py-2.5 px-3 bg-amber-50/70 text-amber-950">국어선택</th>
              <th class="py-2.5 px-3 bg-amber-50/70 text-amber-950">국어(등/표/백)</th>
              <th class="py-2.5 px-3 bg-blue-50/70 text-blue-950">수학선택</th>
              <th class="py-2.5 px-3 bg-blue-50/70 text-blue-950">수학(등/표/백)</th>
              <th class="py-2.5 px-3">영어</th>
              <th class="py-2.5 px-3">한국사</th>
              <th class="py-2.5 px-3 bg-purple-50/70 text-purple-950">탐구1(선택/등/표/백)</th>
              <th class="py-2.5 px-3 bg-purple-50/70 text-purple-950">탐구2(선택/등/표/백)</th>
              <th class="py-2.5 px-3">제2외국어</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr
              v-for="st in allParsedStudents"
              :key="st.studentKey"
              class="hover:bg-indigo-50/30 transition-colors"
            >
              <td class="py-2 px-3 font-mono font-bold text-slate-800">{{ st.grade }}</td>
              <td class="py-2 px-3 font-mono">{{ st.classNum }}반</td>
              <td class="py-2 px-3 font-mono text-slate-500">{{ st.studentNum }}</td>
              <td class="py-2 px-3 font-bold text-slate-900">{{ st.name }}</td>
              <td class="py-2 px-3 text-[11px] text-indigo-700 font-semibold">{{ st.examName }}</td>
              
              <!-- 국어 -->
              <td class="py-2 px-3 text-slate-600 bg-amber-50/20 text-[11px]">{{ st.korSubject || '-' }}</td>
              <td class="py-2 px-3 bg-amber-50/20 font-mono">
                <span class="font-bold text-amber-900">{{ st.korGrade || '-' }}등급</span>
                <span class="text-[10px] text-slate-400 ml-1">({{ st.korStandardScore || '-' }}/{{ st.korPercentile || '-' }})</span>
              </td>

              <!-- 수학 -->
              <td class="py-2 px-3 text-slate-600 bg-blue-50/20 text-[11px]">{{ st.mathSubject || '-' }}</td>
              <td class="py-2 px-3 bg-blue-50/20 font-mono">
                <span class="font-bold text-blue-900">{{ st.mathGrade || '-' }}등급</span>
                <span class="text-[10px] text-slate-400 ml-1">({{ st.mathStandardScore || '-' }}/{{ st.mathPercentile || '-' }})</span>
              </td>

              <!-- 영어/한국사 -->
              <td class="py-2 px-3 font-mono font-bold text-slate-800">{{ st.engGrade ? `${st.engGrade}등급` : '-' }}</td>
              <td class="py-2 px-3 font-mono font-bold text-slate-800">{{ st.histGrade ? `${st.histGrade}등급` : '-' }}</td>

              <!-- 탐구1 -->
              <td class="py-2 px-3 bg-purple-50/20 text-[11px]">
                <div class="font-semibold text-purple-950">{{ st.inquiry1 || '-' }}</div>
                <div class="font-mono text-[10.5px] text-purple-700">
                  {{ st.inq1Grade ? `${st.inq1Grade}등급` : '-' }}
                  <span class="text-[10px] text-slate-400">({{ st.inq1StandardScore || '-' }}/{{ st.inq1Percentile || '-' }})</span>
                </div>
              </td>

              <!-- 탐구2 -->
              <td class="py-2 px-3 bg-purple-50/20 text-[11px]">
                <div class="font-semibold text-purple-950">{{ st.inquiry2 || '-' }}</div>
                <div class="font-mono text-[10.5px] text-purple-700">
                  {{ st.inq2Grade ? `${st.inq2Grade}등급` : '-' }}
                  <span class="text-[10px] text-slate-400">({{ st.inq2StandardScore || '-' }}/{{ st.inq2Percentile || '-' }})</span>
                </div>
              </td>

              <!-- 제2외국어 -->
              <td class="py-2 px-3 text-slate-500 text-[11px]">
                <span v-if="st.secondLangSubject && st.secondLangSubject !== '-'">
                  {{ st.secondLangSubject }} ({{ st.secondLangGrade }}등급)
                </span>
                <span v-else class="text-slate-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  UploadCloud,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  RefreshCw,
  ExternalLink,
  Download
} from 'lucide-vue-next'
import * as XLSX from 'xlsx'
import {
  parseMockExamReportFile,
  convertStudentsToSheetRows,
  convertStudentsToSenExcelRows,
  extractMonthNum,
  getTargetCollegeAdmissionYear,
  getAcademicSchoolYear,
  getTargetMockResultSheetName
} from '../../stat/utils/mockExamReportParser'
import {
  getKcueSheetId,
  saveKcueSheetId,
  buildSheetWebUrl,
  DEFAULT_KCUE_SHEET_ID,
  getKcueGasUrl,
  saveKcueGasUrl,
  maskGasUrl,
  fetchAndParseKcueMockData,
  hasAnyMockScore,
} from '../../api/statApi'
import { dialog } from '../common/dialog'

// 현재 날짜 기준 대입/학사 학년도 자동 계산
const now = new Date()
const autoAdmissionYear = computed(() => getTargetCollegeAdmissionYear(now))
const autoAcademicYear = computed(() => getAcademicSchoolYear(now))
const targetSheetName = computed(() => getTargetMockResultSheetName(now))

const todayFormatted = computed(() => {
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`
})

// 가이드 아코디언 토글 (기본 접힘)
const isGuideOpen = ref(false)

// Apps Script 수신 코드 복사 상태
const copiedGasSnippet = ref(false)
const gasSnippetCode = `/**
 * [모의고사 성적 원격 수신] 44개 컬럼 자동 적재 및 회차별 누적/자동 정렬 핸들러
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    status: 'online',
    message: '모의고사 성적 원격 수신 Web App이 정상 작동 중입니다.'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    let ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. 대상 스프레드시트 검증 및 매칭
    if (payload.spreadsheetId) {
      if (!ss || ss.getId() !== payload.spreadsheetId) {
        try {
          ss = SpreadsheetApp.openById(payload.spreadsheetId);
        } catch (openErr) {
          const currentName = ss ? ss.getName() : '알 수 없음';
          throw new Error('현재 Web App이 엉뚱한 구글 시트 [' + currentName + ']에 배포되어 있습니다.\\n반드시 원본 모의고사 시트(' + payload.spreadsheetId + ') 창에서 [확장 프로그램 > Apps Script]를 열고 배포해 주세요.');
        }
      }
    }

    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: '스프레드시트를 열 수 없습니다.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheetName = payload.sheetName || '2027모의결과';
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);

    const rows = payload.rows;
    if (!rows || rows.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: '데이터가 없습니다.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. 업로드할 회차(월) 번호 파악 (예: 3, 5, 6, 9 등)
    const targetMonth = payload.month != null ? Number(payload.month) : (rows[0] ? Number(rows[0][0]) : null);

    // 3. 기존 시트 데이터 확인 (1, 2행 복합 헤더 제외 3행부터)
    const lastRow = sheet.getLastRow();
    let combined = [];

    if (lastRow <= 2) {
      // 기존 데이터가 없으면 바로 신규 적재
      combined = rows;
    } else {
      // 기존 학생 데이터(3행 ~ lastRow) 읽기
      const existingData = sheet.getRange(3, 1, lastRow - 2, 44).getValues();

      // 기존 데이터 중 '월(A열)'이 업로드 대상 월과 다른 회차 데이터만 유지 (동일 월 재업로드 시 중복 방지 및 최신화)
      const otherMonthsData = existingData.filter(function(r) {
        if (!r || r[0] === null || r[0] === undefined) return false;
        const m = Number(String(r[0]).trim());
        return !isNaN(m) && m > 0 && (targetMonth == null || m !== targetMonth);
      });

      // 기존 타 회차 데이터 + 이번 회차 데이터 결합
      combined = otherMonthsData.concat(rows);
    }

    // 4. 모의고사 표준 정렬: 월(A열) 오름차순 -> 반(D열) 오름차순 -> 번호(E열) 오름차순
    combined.sort(function(a, b) {
      var mA = Number(a[0]) || 0, mB = Number(b[0]) || 0;
      if (mA !== mB) return mA - mB;
      var cA = Number(a[3]) || 0, cB = Number(b[3]) || 0;
      if (cA !== cB) return cA - cB;
      var nA = Number(a[4]) || 0, nB = Number(b[4]) || 0;
      return nA - nB;
    });

    // 5. 시트 행/열 확장
    const neededRows = 2 + combined.length;
    if (sheet.getMaxRows() < neededRows) {
      sheet.insertRowsAfter(sheet.getMaxRows(), neededRows - sheet.getMaxRows());
    }
    if (sheet.getMaxColumns() < 44) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), 44 - sheet.getMaxColumns());
    }

    // 6. 3행부터 깨끗하게 일괄 반영 (기존 잔여 행 클리어 포함)
    if (lastRow > 2) {
      const clearRows = Math.max(lastRow - 2, combined.length);
      sheet.getRange(3, 1, clearRows, 44).clearContent();
    }

    sheet.getRange(3, 1, combined.length, 44).setValues(combined);
    SpreadsheetApp.flush();

    // 이번 업로드된 회차의 실제 배치 시작행 및 종료행 계산
    let startRowForThisExam = 3;
    for (let i = 0; i < combined.length; i++) {
      if (Number(combined[i][0]) === targetMonth) {
        startRowForThisExam = 3 + i;
        break;
      }
    }
    const endRowForThisExam = startRowForThisExam + rows.length - 1;

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      count: rows.length,
      totalCount: combined.length,
      startRow: startRowForThisExam,
      endRow: endRowForThisExam,
      sheetName: sheetName,
      spreadsheetName: ss.getName(),
      spreadsheetId: ss.getId()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`

async function copyGasSnippet() {
  try {
    await navigator.clipboard.writeText(gasSnippetCode)
    copiedGasSnippet.value = true
    setTimeout(() => {
      copiedGasSnippet.value = false
    }, 2500)
    dialog.alert('📋 Apps Script 수신 코드가 클립보드에 복사되었습니다!\n구글 시트의 [확장 프로그램] > [Apps Script] 편집창 맨 아래에 붙여넣고 저장(Ctrl + S)하세요.')
  } catch (e) {
    dialog.alert('복사 실패: ' + e.message)
  }
}

// 등록된 Web App URL 및 시트 ID 상태
const configuredGasUrl = ref('')
const configuredSheetId = ref('')

onMounted(async () => {
  try {
    configuredGasUrl.value = await getKcueGasUrl()
    configuredSheetId.value = await getKcueSheetId()
  } catch (_) {}
  loadExistingSheetData()
})

async function promptChangeSheetId() {
  const current = configuredSheetId.value || DEFAULT_KCUE_SHEET_ID
  const input = window.prompt(
    '대교협 및 모의고사 성적 원본 구글 스프레드시트 ID를 입력해 주세요:\n\n' +
    '※ 주의: 암호화 배포용 시트 ID(1U5Vnx...)가 아니라, 원본 대교협 시트 ID(1hkgi-WKdbh...)를 입력하셔야 합니다.',
    current
  )
  if (input !== null && input.trim() !== current) {
    const saved = await saveKcueSheetId(input.trim())
    configuredSheetId.value = saved || DEFAULT_KCUE_SHEET_ID
    dialog.alert('✓ 대교협 원본 시트 ID가 성공적으로 저장되었습니다.')
  }
}

async function promptChangeGasUrl() {
  const current = configuredGasUrl.value || ''
  const input = window.prompt(
    '모의고사 성적 원격 자동 적재용 Web App URL을 입력해 주세요:\n\n' +
    '(구글 시트 [확장 프로그램] > [Apps Script]에서 웹 앱으로 배포한 URL)\n' +
    '※ 배포 시 반드시 [액세스 권한: 모든 사용자]로 배포해야 브라우저 보안 차단 없이 작동합니다.',
    current
  )
  if (input !== null && input.trim() !== current) {
    const saved = await saveKcueGasUrl(input.trim())
    configuredGasUrl.value = saved
    dialog.alert(
      saved 
        ? '✓ Web App URL이 성공적으로 저장되었습니다.\n[🔗 웹앱 응답 확인]을 눌러 정상 작동 여부를 확인해 보세요.' 
        : 'Web App URL이 초기화되었습니다.'
    )
  }
}

// 선택 학년 (기본값: 3학년)
const selectedGrade = ref(3)

// 구글 시트에 이미 저장된 모의고사 성적 (SEN진학 다운로드용) 상태
const existingMockRecords = ref([])
const isLoadingExistingSheetRecords = ref(false)
const selectedExistingExamMonth = ref(null)

const existingExamMonthOptions = computed(() => {
  const g = Number(selectedGrade.value) || 3
  const gradeRecords = existingMockRecords.value.filter(r => (Number(r.grade) || 3) === g)

  const monthMap = new Map()
  gradeRecords.forEach(r => {
    let m = r.monthOrder
    if (!m && r.examName) {
      const match = String(r.examName).match(/(10|[3-9]|11)/)
      if (match) m = Number(match[1])
    }
    if (!m) return

    // 학생 이름 및 실제 모의고사 응시 성적이 존재하는 실응시자(결시 제외)인지 확인
    if (!r.name) return
    if (!hasAnyMockScore(r)) return

    if (!monthMap.has(m)) {
      monthMap.set(m, {
        month: m,
        examName: r.examName || `${m}월 학평`,
        count: 0,
        students: []
      })
    }

    const info = monthMap.get(m)
    info.count++
    info.students.push(r)
  })

  // 월 내림차순 정렬 (최신 시험인 10월, 9월... 순으로 상단 배치)
  const sortedMonths = Array.from(monthMap.keys()).sort((a, b) => b - a)

  return sortedMonths.map(m => {
    const info = monthMap.get(m)
    const isMopyeong = [6, 9].includes(m)
    const typeLabel = isMopyeong ? '모평' : '학평'
    return {
      value: m,
      label: `${m}월 ${typeLabel} (실응시 ${info.count}명)`,
      month: m,
      count: info.count,
      students: info.students
    }
  })
})

const currentSelectedExistingMonthInfo = computed(() => {
  if (!selectedExistingExamMonth.value) return null
  const opt = existingExamMonthOptions.value.find(o => o.value === selectedExistingExamMonth.value)
  if (!opt) return null
  const gradeStr = `${selectedGrade.value || 3}학년`
  const monthStr = `${opt.month}월`
  return {
    ...opt,
    fileName: `SEN진학_${gradeStr}_${monthStr}.xlsx`
  }
})

// 옵션 목록 변경 시 (학년 전환 또는 로딩 완료 등) 자동 기본 선택
watch(existingExamMonthOptions, (newOpts) => {
  if (newOpts && newOpts.length > 0) {
    if (!selectedExistingExamMonth.value || !newOpts.some(o => o.value === selectedExistingExamMonth.value)) {
      selectedExistingExamMonth.value = newOpts[0].value
    }
  } else {
    selectedExistingExamMonth.value = null
  }
}, { immediate: true })

async function loadExistingSheetData(force = false) {
  isLoadingExistingSheetRecords.value = true
  try {
    const records = await fetchAndParseKcueMockData(null, null, null, force)
    existingMockRecords.value = Array.isArray(records) ? records : []
  } catch (err) {
    console.warn('[MockExamUploadTab] 구글 시트 모의고사 데이터 로드 실패:', err)
  } finally {
    isLoadingExistingSheetRecords.value = false
  }
}

// 선택된 학년 기준 대입 학년도 계산
const currentTargetAdmissionYear = computed(() => {
  const baseYear = autoAdmissionYear.value || '2027'
  if (selectedGrade.value === 3) return String(baseYear)
  if (selectedGrade.value === 2) return String(Number(baseYear) + 1)
  if (selectedGrade.value === 1) return String(Number(baseYear) + 2)
  return String(baseYear)
})

// 모의고사 회차 드롭다운 목록 (1·2학년 학평 일정 vs 3학년 모평/수능 일정 분기)
const availableExamList = computed(() => {
  const g = Number(selectedGrade.value) || 3
  if (g === 1 || g === 2) {
    return [
      { value: '3월 학평', label: '3월 학평' },
      { value: '6월 학평', label: '6월 학평' },
      { value: '9월 학평', label: '9월 학평' },
      { value: '10월 학평', label: '10월 학평' },
      { value: '11월 학평', label: '11월 학평' }
    ]
  }

  const is2028OrLater = Number(currentTargetAdmissionYear.value) >= 2028
  const mopyeongFall = is2028OrLater ? '8월 모평' : '9월 모평'

  return [
    { value: '3월 학평', label: '3월 학평' },
    { value: '5월 학평', label: '5월 학평' },
    { value: '6월 모평', label: '6월 모평' },
    { value: '7월 학평', label: '7월 학평' },
    { value: mopyeongFall, label: mopyeongFall },
    { value: '10월 학평', label: '10월 학평' },
    { value: '11월 수능', label: '11월 수능' }
  ]
})

// 선택된 모의고사 회차 (기본값: 3월 학평)
const selectedExam = ref('3월 학평')

// 학년 변경 시 또는 2028 대입 이상일 때 회차 유효성 자동 싱크
watch(availableExamList, (newList) => {
  const exists = newList.some(e => e.value === selectedExam.value)
  if (!exists) {
    if (selectedExam.value === '9월 모평') selectedExam.value = '8월 모평'
    else if (selectedExam.value === '8월 모평') selectedExam.value = '9월 모평'
    else selectedExam.value = newList[0]?.value || '3월 학평'
  }
})

// 드래그앤드롭 상태
const isDragging = ref(false)
const fileInputRef = ref(null)

// 업로드된 파일 상태 관리
const fileList = ref([])
const isSavingToSheet = ref(false)
const copySuccess = ref(false)

// 파일 상태 카운트
const completedCount = computed(() => fileList.value.filter(f => f.status === 'success').length)
const parsingCount = computed(() => fileList.value.filter(f => f.status === 'parsing').length)
const errorCount = computed(() => fileList.value.filter(f => f.status === 'error').length)

function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

function handleFileInputChange(e) {
  const files = e.target.files
  if (files && files.length > 0) {
    processIncomingFiles(Array.from(files))
  }
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function handleFileDrop(e) {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files && files.length > 0) {
    processIncomingFiles(Array.from(files))
  }
}

/**
 * 성적 파일(PDF 또는 엑셀) 단일/다중 등록 및 실시간 즉시 파싱
 * - 1, 2학년은 반별 성적일람표 PDF 여러 개를 한 번에 선택하여 전교생 자동 취합 가능
 * - 3학년은 대교협 엑셀 1개 또는 PDF 파일 여러 개 모두 지원
 */
async function processIncomingFiles(files) {
  if (!files || files.length === 0) return

  // 새 파일 목록 추가 (기존 파일이 있으면 덧붙임)
  for (const file of files) {
    const itemObj = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      selectedGrade: selectedGrade.value,
      selectedExam: selectedExam.value,
      status: 'parsing',
      error: '',
      students: [],
      parsedExamName: selectedExam.value,
      parsedClass: ''
    }

    fileList.value.push(itemObj)

    // 비동기 파싱 실행
    parseSingleItem(itemObj)
  }
}

async function parseSingleItem(targetItem) {
  try {
    // UI 스피너 즉각 노출을 위한 짧은 틱
    await new Promise(r => setTimeout(r, 50))

    const res = await parseMockExamReportFile(targetItem.file, {
      defaultGrade: targetItem.selectedGrade,
      examName: targetItem.selectedExam,
      uploadDate: now
    })

    if (!res || !res.success) {
      targetItem.status = 'error'
      targetItem.error = res?.error || '성적 데이터를 추출하지 못했습니다.'
    } else {
      targetItem.status = 'success'
      targetItem.students = res.students || []
      targetItem.parsedExamName = targetItem.selectedExam || res.meta?.examName || ''
      targetItem.parsedClass = res.meta?.classNum || ''
      if (res.meta?.grade) {
        targetItem.selectedGrade = res.meta.grade
      }
    }
  } catch (err) {
    console.error(`[Mock Parser] ${targetItem.name} 처리 오류:`, err)
    targetItem.status = 'error'
    targetItem.error = err.message || '파일 처리 중 오류가 발생했습니다.'
  }
}

function removeFile(index) {
  fileList.value.splice(index, 1)
}

function clearAllFiles() {
  fileList.value = []
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 모든 성공 파일의 학생 레코드 합산 (학년 -> 반 -> 번호 오름차순 정렬)
const allParsedStudents = computed(() => {
  const all = []
  for (const item of fileList.value) {
    if (item.status === 'success' && Array.isArray(item.students)) {
      all.push(...item.students)
    }
  }
  return all.sort((a, b) => {
    const gradeDiff = (Number(a.grade) || 0) - (Number(b.grade) || 0)
    if (gradeDiff !== 0) return gradeDiff
    const classDiff = (Number(a.classNum) || 0) - (Number(b.classNum) || 0)
    if (classDiff !== 0) return classDiff
    return (Number(a.studentNum) || 0) - (Number(b.studentNum) || 0)
  })
})

/**
 * 서울시교육청 SEN진학 양식(29개 컬럼 규격) 엑셀 파일 생성 및 브라우저 다운로드 공통 핸들러
 * 1·2행 복합 헤더(A~AC) 및 3행부터 학생 성적 데이터 출력
 * @param {Array} students 학생 성적 객체 배열
 * @param {number|string} grade 학년
 * @param {number|string} monthNum 응시 월
 */
function generateAndDownloadSenExcel(students = [], grade = 3, monthNum = null) {
  if (!students || students.length === 0) {
    dialog.alert('내보낼 학생 데이터가 없습니다.')
    return
  }

  // 복사본 정렬: 반 -> 번호 오름차순
  const sortedStudents = [...students].sort((a, b) => {
    const cA = Number(a.classNum) || 0
    const cB = Number(b.classNum) || 0
    if (cA !== cB) return cA - cB
    const nA = Number(a.studentNum) || 0
    const nB = Number(b.studentNum) || 0
    return nA - nB
  })

  const rows = convertStudentsToSenExcelRows(sortedStudents, grade)
  const ws = XLSX.utils.aoa_to_sheet(rows)

  // 1·2행 복합 헤더 셀 병합 (A~E 열 상하 병합, F~AC 과목별 좌우 병합)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // A1:A2 계열번호
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // B1:B2 학년
    { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // C1:C2 반
    { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } }, // D1:D2 번호
    { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } }, // E1:E2 이름
    { s: { r: 0, c: 5 }, e: { r: 0, c: 8 } }, // F1:I1 국어
    { s: { r: 0, c: 9 }, e: { r: 0, c: 12 } }, // J1:M1 수학
    { s: { r: 0, c: 13 }, e: { r: 0, c: 16 } }, // N1:Q1 영어
    { s: { r: 0, c: 17 }, e: { r: 0, c: 20 } }, // R1:U1 사회탐구
    { s: { r: 0, c: 21 }, e: { r: 0, c: 24 } }, // V1:Y1 과학탐구
    { s: { r: 0, c: 25 }, e: { r: 0, c: 28 } }  // Z1:AC1 한국사
  ]

  // 열 너비 지정 (가독성 최적화)
  ws['!cols'] = [
    { wch: 10 }, // A: 계열번호
    { wch: 7 },  // B: 학년
    { wch: 7 },  // C: 반
    { wch: 7 },  // D: 번호
    { wch: 11 }, // E: 이름
    // 국어 (원, 표, 백, 등)
    { wch: 8 }, { wch: 9 }, { wch: 8 }, { wch: 7 },
    // 수학 (원, 표, 백, 등)
    { wch: 8 }, { wch: 9 }, { wch: 8 }, { wch: 7 },
    // 영어 (원, 표, 백, 등)
    { wch: 8 }, { wch: 9 }, { wch: 8 }, { wch: 7 },
    // 사회탐구 (원, 표, 백, 등)
    { wch: 8 }, { wch: 9 }, { wch: 8 }, { wch: 7 },
    // 과학탐구 (원, 표, 백, 등)
    { wch: 8 }, { wch: 9 }, { wch: 8 }, { wch: 7 },
    // 한국사 (원, 표, 백, 등)
    { wch: 8 }, { wch: 9 }, { wch: 8 }, { wch: 7 }
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'SEN진학')

  const monthStr = monthNum ? `${monthNum}월` : '모의고사'
  const gradeStr = `${grade || 3}학년`
  const fileName = `SEN진학_${gradeStr}_${monthStr}.xlsx`

  XLSX.writeFile(wb, fileName)
}

/**
 * 구글 시트에 이미 등록된 회차를 선택하여 SEN진학용 엑셀로 즉시 다운로드
 */
function downloadExistingMonthSenExcel() {
  if (!selectedExistingExamMonth.value) {
    dialog.alert('다운로드할 모의고사 회차를 선택해 주세요.')
    return
  }

  const opt = existingExamMonthOptions.value.find(o => o.value === selectedExistingExamMonth.value)
  if (!opt || !opt.students || opt.students.length === 0) {
    dialog.alert('선택한 회차의 학생 데이터가 없습니다.')
    return
  }

  generateAndDownloadSenExcel(opt.students, selectedGrade.value, opt.month)
}

/**
 * 엑셀(.xlsx) 파일로 내보내기 (1·2행 복합 헤더 포함 44개 컬럼 표준 엑셀)
 */
function exportParsedToExcel() {
  if (allParsedStudents.value.length === 0) {
    dialog.alert('내보낼 학생 데이터가 없습니다.')
    return
  }

  const rows = convertStudentsToSheetRows(allParsedStudents.value, {
    includeHeaders: true,
    defaultExamMonth: extractMonthNum(selectedExam.value)
  })
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, targetSheetName.value)

  const fileName = `${targetSheetName.value}_${selectedExam.value}_${selectedGrade.value}학년_${todayFormatted.value.replace(/[\s년월]/g, '_')}.xlsx`
  XLSX.writeFile(wb, fileName)
}

/**
 * 구글 시트에 바로 붙여넣을 수 있는 탭 구분 텍스트(TSV) 클립보드 복사
 * (1·2행 헤더를 제외하고 3행부터 붙여넣는 44개 컬럼 규격)
 */
async function copyToClipboard() {
  if (allParsedStudents.value.length === 0) {
    dialog.alert('복사할 데이터가 없습니다.')
    return
  }

  const rows = convertStudentsToSheetRows(allParsedStudents.value, {
    includeHeaders: false,
    defaultExamMonth: extractMonthNum(selectedExam.value)
  })
  const tsvText = rows.map(r => r.join('\t')).join('\n')

  try {
    await navigator.clipboard.writeText(tsvText)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2500)
    dialog.alert(
      `📋 총 ${allParsedStudents.value.length}명(전교생 ${selectedExam.value}) 데이터가 클립보드에 복사되었습니다!\n\n` +
      `구글 시트 '${targetSheetName.value}' 탭에서 아래 위치를 클릭하고 [Ctrl + V]로 붙여넣으세요:\n\n` +
      `• 첫 번째 시험(예: 3월)인 경우: [A3] 셀 클릭 후 붙여넣기\n` +
      `• 추가 회차(예: 5월, 6월 등)인 경우: 기존 데이터 바로 다음 빈 행(예: 3월이 266행까지 있다면 [A267] 셀) 클릭 후 붙여넣기\n\n` +
      `(1·2행 헤더를 보존하고 44개 컬럼(A~AR)에 정확하게 들어맞습니다)`
    )
  } catch (e) {
    dialog.alert('클립보드 복사 실패: ' + e.message)
  }
}

/**
 * 구글 시트 원본(1hkgi-W...) '2027모의결과'에 즉시 직접 반영 (Web App 원격 전송)
 */
async function handleSaveToGoogleSheet() {
  if (allParsedStudents.value.length === 0) {
    dialog.alert('반영할 학생 데이터가 없습니다.')
    return
  }

  // 1. 44개 컬럼 데이터 배열 생성 (1·2행 헤더 제외 3행부터 들어갈 학생 레코드)
  const examMonth = extractMonthNum(selectedExam.value)
  const rows = convertStudentsToSheetRows(allParsedStudents.value, {
    includeHeaders: false,
    defaultExamMonth: examMonth
  })

  // 2. Apps Script Web App URL 확인 (환경설정에서 동적 관리)
  let gasUrl = await getKcueGasUrl()
  configuredGasUrl.value = gasUrl
  let targetSheetId = await getKcueSheetId()
  configuredSheetId.value = targetSheetId

  // 배포용 암호화 시트(1U5Vnx...)가 등록되어 있는 경우 자동 교정 안내
  if (targetSheetId && targetSheetId.includes('1U5Vnx2x8gnXQlI3N4deyaurKxj-naZP0cRBb3lQnT4o')) {
    const shouldFix = window.confirm(
      '⚠️ [구글 시트 ID 확인 안내]\n\n' +
      '현재 시스템 환경설정에 등록된 시트 ID가 "배포용 암호화 시트(1U5Vnx...)"로 설정되어 있습니다.\n\n' +
      '모의고사 성적 원본 데이터는 "대교협 원본 시트(1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg)"의 [2027모의결과] 탭에 적재되어야 합니다.\n\n' +
      '대상 구글 시트를 "대교협 원본 시트(1hkgi-W...)"로 즉시 변경하여 저장하고 전송하시겠습니까?'
    )
    if (shouldFix) {
      targetSheetId = await saveKcueSheetId(DEFAULT_KCUE_SHEET_ID)
      configuredSheetId.value = targetSheetId
    }
  }

  if (!gasUrl) {
    const inputUrl = window.prompt(
      '구글 스프레드시트 배포 Web App URL이 아직 등록되지 않았습니다.\n\n' +
      '시트의 [확장 프로그램] > [Apps Script]에서 배포한 웹 앱 URL을 입력해 주세요:\n' +
      '(입력 시 관리자 환경설정에 자동 저장됩니다)'
    )
    if (!inputUrl || !inputUrl.trim()) {
      dialog.alert({
        title: 'Web App URL 미등록',
        message: 'Web App URL이 등록되지 않아 시트 전송이 취소되었습니다.\n(관리자 설정 > 환경설정 탭에서 등록하실 수 있습니다.)'
      })
      return
    }
    gasUrl = await saveKcueGasUrl(inputUrl.trim())
    configuredGasUrl.value = gasUrl
  }

  isSavingToSheet.value = true
  try {
    // 3. Google Apps Script Web App으로 직접 전송 (CORS 차단 방지를 위해 text/plain 전송)
    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveMockResults',
        spreadsheetId: targetSheetId,
        sheetName: targetSheetName.value,
        month: examMonth,
        examName: selectedExam.value,
        rows
      })
    })

    const resText = await res.text()
    let resJson = null
    try {
      resJson = JSON.parse(resText)
    } catch (_) {
      console.error('GAS 응답이 JSON이 아님 (HTML 반환):', resText)
      if (resText.includes('<html') || resText.includes('<!DOCTYPE')) {
        throw new Error('웹앱이 Google 로그인 화면 또는 에러 HTML을 반환했습니다.\n(Apps Script 배포 시 [액세스 권한: 모든 사용자]로 배포되었는지 확인해 주세요)')
      }
      throw new Error(`웹앱 응답 형식 오류: ${resText.slice(0, 100)}`)
    }

    if (resJson && resJson.success === true) {
      const savedSheetName = resJson.spreadsheetName || '구글 시트'
      const savedTab = resJson.sheetName || targetSheetName.value
      const isExpectedSheet = !resJson.spreadsheetId || resJson.spreadsheetId === targetSheetId
      const rowRangeInfo = (resJson.startRow && resJson.endRow)
        ? `• 이번 적재 위치: [${resJson.startRow}행 ~ ${resJson.endRow}행] (전체 누적: ${resJson.totalCount || resJson.count}명)\n`
        : `• 적재 완료: 전교생 ${resJson.count || allParsedStudents.value.length}명\n`

      await dialog.alert({
        title: '구글 시트 직접 반영 성공',
        message: `🎉 [구글 시트 직접 반영 성공!]\n\n` +
          `• 저장된 구글 시트: [${savedSheetName}]\n` +
          `• 저장된 시트 탭: [${savedTab}]\n` +
          `• 이번 적재 시험: [${selectedExam.value}] ${resJson.count || allParsedStudents.value.length}명\n` +
          rowRangeInfo +
          `• 컬럼 규격: 44개 컬럼(A열 '월' ~ AR열 '제2외국어 등급') 자동 누적 및 정렬 완료\n\n` +
          (isExpectedSheet ? '' : `⚠️ 주의: 등록된 Web App이 원본 모의고사 시트가 아닌 [${savedSheetName}] 파일에 배포되어 해당 파일의 [${savedTab}] 탭에 저장되었습니다.\n\n`)
      })
      // 구글 시트 저장 후 저장된 모의고사 목록 최신으로 자동 갱신
      loadExistingSheetData(true)
    } else {
      throw new Error(resJson?.error || '구글 시트 저장 응답 오류')
    }
  } catch (e) {
    console.error('GAS Web App 전송 오류:', e)

    let diagnoseMsg = ''
    if (e.message && e.message.includes('Failed to fetch')) {
      diagnoseMsg = 
        `\n\n🔍 [Failed to fetch 원인 진단 및 해결 방법]\n` +
        `1. Apps Script 배포 권한 확인:\n` +
        `   [배포] > [새 배포] 시 [액세스 권한]이 반드시 '모든 사용자(Anyone)'로 설정되어야 합니다.\n\n` +
        `2. 웹앱 URL 확인:\n` +
        `   [관리자 설정 ➔ 환경설정]의 "모의고사 성적 실시간 쓰기 연동용 GAS Web App URL"이 최신 Web App 주소인지 확인해 주세요.`
    }

    await dialog.alert({
      title: '구글 시트 직접 전송 실패',
      level: 'error',
      message: `⚠️ 구글 시트 직접 전송 중 오류가 발생했습니다.\n\n` +
        `오류 내용: ${e.message}` +
        diagnoseMsg
    })
  } finally {
    isSavingToSheet.value = false
  }
}
</script>

<style scoped>
/* Scoped styles */
</style>
