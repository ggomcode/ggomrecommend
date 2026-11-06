<template>
  <div class="py-8 px-4 sm:px-10 max-w-6xl mx-auto space-y-6">
    <!-- 1. 헤더 안내 배너 -->
    <div class="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-900/40">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
              1·2·3학년 전 학년 엑셀 등록
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
            대교협 상담프로그램에서 추출한 <strong>전교생 모의고사 엑셀 파일(.xlsx)</strong>을 업로드하여 1·2·3학년 전체 성적을 한 번에 등록합니다.<br class="hidden sm:inline" />
            1학년, 2학년, 3학년 모두 동일한 방식으로 등록되며, <code class="px-1.5 py-0.5 rounded bg-indigo-800/80 text-amber-300 font-mono font-bold">{{ targetSheetName }}</code> 시트에 학년별로 통합 분류 적재됩니다.
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
          <span>{{ isGuideOpen ? '가이드 접기' : '전체 가이드 펼쳐보기' }}</span>
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

          <!-- STEP 4: 본 시스템 등록 & 구글 시트 반영 -->
          <div class="bg-indigo-50/50 rounded-2xl p-4.5 border border-indigo-200 flex flex-col justify-between space-y-3 relative hover:border-indigo-400 transition-colors">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">4</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">최종 반영</span>
              </div>
              <h4 class="text-xs sm:text-sm font-black text-indigo-950 m-0">본 화면 업로드 & 반영</h4>
              <p class="text-[11.5px] text-indigo-950/80 m-0 leading-relaxed">
                다운로드받은 엑셀 파일(.xlsx)을 바로 아래 <strong>[드래그 & 드롭 영역]</strong>에 올려놓습니다.
              </p>
              <div class="p-2.5 rounded-lg bg-white border border-indigo-300 text-[11px] text-indigo-950 leading-snug shadow-2xs">
                <strong>👉 구글 시트 1초 반영:</strong><br />
                성적표가 파싱되면 상단의 <strong class="text-emerald-700">[구글 시트에 즉시 반영]</strong> 버튼을 누르고, 새 탭의 <code class="bg-indigo-50 px-1 font-bold text-indigo-800">{{ targetSheetName }}</code> 탭 <strong>A1 셀</strong>에서 <strong>Ctrl + V</strong> 누르면 끝!
              </div>
            </div>
            <div class="pt-2 text-[10.5px] text-indigo-700 border-t border-indigo-200 font-bold">
              ✓ 전교생 모의고사 DB 구축 완료!
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

        <!-- 1·2·3학년 공통 안내 및 FAQ 카드 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          <div class="rounded-xl p-3.5 bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 leading-relaxed space-y-1">
            <div class="font-black flex items-center gap-1.5 text-indigo-900">
              <span>📌</span>
              <span>1학년, 2학년, 3학년 모두 100% 동일합니다</span>
            </div>
            <p class="text-[11.5px] text-indigo-950/80 m-0">
              대교협 창 상단에서 <strong>1학년 / 2학년 / 3학년</strong> 중 해당하는 학년 라디오를 선택하고, 똑같이 <strong>[수능/모의 성적표 PDF 등록]</strong> ➔ <strong>[선택회차 입력내용 엑셀다운]</strong>을 받아 올리시면 됩니다.<br />
              시트에 적재된 후 <strong>[1학년 대입 분석]</strong>, <strong>[2학년 대입 분석]</strong>, <strong>[3학년 모의고사 분석]</strong> 메뉴에서 각 학년 데이터가 자동으로 정확하게 조회됩니다.
            </p>
          </div>

          <div class="rounded-xl p-3.5 bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 leading-relaxed space-y-1">
            <div class="font-black flex items-center gap-1.5 text-emerald-900">
              <span>✨</span>
              <span>왜 대교협 엑셀 방식을 사용하나요?</span>
            </div>
            <p class="text-[11.5px] text-emerald-950/80 m-0">
              일부 교육청 성적표 PDF는 벡터 선/드로잉으로 출력되어 웹 브라우저에서 텍스트 인식이 멈추거나 누락될 수 있습니다.<br />
              반면 대교협의 <strong>[선택회차 입력내용 엑셀다운]</strong>을 통하면 11개 반 전교생 300여 명의 점수가 <strong>오차 0%의 순수 숫자 엑셀로 일괄 추출</strong>되므로 가장 빠르고 안전합니다!
            </p>
          </div>
        </div>

      </div>
    </div>

    <!-- 3. 업로드 컨트롤 바 (학년 선택 + 엑셀 중심 드롭존) -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
      <!-- 3-1. 학년 선택 드롭다운 -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
          <span class="text-sm font-bold text-slate-800">성적일람표 응시 학년 선택</span>
          <span class="text-xs text-slate-400 font-normal">(*업로드할 파일의 해당 학년을 선택해 주세요)</span>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-600">대상 학년:</label>
          <div class="relative inline-block">
            <select
              v-model="selectedGrade"
              class="appearance-none pl-3 pr-8 py-1.5 bg-indigo-50/80 hover:bg-indigo-100/70 border border-indigo-200 rounded-xl text-xs font-black text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer transition-colors"
            >
              <option :value="3">3학년 (고3 / {{ autoAdmissionYear }} 대입)</option>
              <option :value="2">2학년 (고2 / {{ autoAcademicYear }} 학사)</option>
              <option :value="1">1학년 (고1 / {{ autoAcademicYear }} 학사)</option>
            </select>
            <ChevronDown class="w-4 h-4 text-indigo-700 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
          <span class="text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
            {{ selectedGrade }}학년 모드
          </span>
        </div>
      </div>

      <!-- 3-2. 엑셀 파일 중심 드래그앤드롭 영역 (Drag & Drop Zone) -->
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
          multiple
          accept=".xlsx,.xls,.csv,.pdf"
          class="hidden"
          @change="handleFileInputChange"
        />

        <div class="flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <div class="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
            <FileSpreadsheet :size="32" />
          </div>
          <div class="space-y-1">
            <div class="text-base font-black text-slate-800">
              대교협에서 다운로드한 <span class="text-emerald-700 underline underline-offset-4">모의고사 엑셀 파일(.xlsx)</span>을 올려주세요
            </div>
            <p class="text-xs text-slate-500 m-0">
              클릭하여 파일을 선택하거나, 이 영역으로 엑셀 파일을 드래그하여 끌어다 놓으세요.
            </p>
          </div>
          <div class="flex flex-wrap items-center justify-center gap-2 pt-1">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-[11.5px] font-bold text-emerald-800 shadow-2xs">
              <span>📗 추천</span>
              <span><strong>선택회차 입력내용 엑셀다운(.xlsx)</strong> 업로드 시 11개 반 전원 1초 즉시 반영</span>
            </div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-medium text-slate-600">
              <span>📄 반별 성적일람표 PDF 복수 등록도 지원</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 업로드된 파일 목록 & 파싱 진행 상황 -->
    <div v-if="fileList.length > 0" class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-600 rounded-full"></span>
            <h3 class="text-sm font-bold text-slate-800 m-0">
              업로드된 모의고사 파일 (총 {{ fileList.length }}개)
            </h3>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span class="text-emerald-700 font-bold">완료: {{ completedCount }}개</span>
            <span>•</span>
            <span v-if="parsingCount > 0" class="text-indigo-600 font-bold animate-pulse">분석 진행 중: {{ parsingCount }}개</span>
            <span v-else class="text-slate-400">대기/완료</span>
            <span v-if="errorCount > 0">•</span>
            <span v-if="errorCount > 0" class="text-rose-600 font-bold">실패: {{ errorCount }}개</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- 파싱 중 진행률 표시 -->
          <div v-if="parsingCount > 0" class="flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 font-bold">
            <RefreshCw class="w-3.5 h-3.5 animate-spin" />
            <span>순차 분석 중 ({{ completedCount }}/{{ fileList.length }})</span>
          </div>

          <button
            @click="clearAllFiles"
            class="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-colors border-none cursor-pointer"
          >
            전체 비우기
          </button>
        </div>
      </div>

      <!-- 진행률 바 -->
      <div v-if="fileList.length > 0" class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div
          class="h-full bg-linear-to-r from-emerald-500 to-indigo-500 transition-all duration-300"
          :style="{ width: `${fileList.length ? (completedCount / fileList.length) * 100 : 0}%` }"
        ></div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="(fItem, idx) in fileList"
          :key="fItem.id"
          class="p-3.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3"
          :class="[
            fItem.status === 'success' 
              ? 'bg-emerald-50/40 border-emerald-200' 
              : fItem.status === 'error'
              ? 'bg-rose-50/40 border-rose-200'
              : fItem.status === 'parsing'
              ? 'bg-indigo-50/40 border-indigo-200 shadow-xs'
              : 'bg-slate-50 border-slate-200 opacity-70'
          ]"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div 
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-xs shadow-2xs"
              :class="fItem.name.endsWith('.pdf') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'"
            >
              {{ fItem.name.endsWith('.pdf') ? 'PDF' : 'XLS' }}
            </div>
            <div class="truncate leading-tight">
              <div class="text-xs font-bold text-slate-800 truncate" :title="fItem.name">
                {{ fItem.name }}
              </div>
              <div class="text-[10.5px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                <span>{{ formatFileSize(fItem.size) }}</span>
                <span>•</span>
                <span class="font-bold text-indigo-700">{{ fItem.selectedGrade }}학년</span>
                <span v-if="fItem.parsedExamName">• {{ fItem.parsedExamName }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <!-- 파싱 중 스피너 -->
            <div v-if="fItem.status === 'parsing'" class="flex items-center gap-1 text-xs text-indigo-600 font-bold px-2 py-0.5 rounded bg-indigo-100/70">
              <RefreshCw class="w-3.5 h-3.5 animate-spin" />
              <span>분석 중…</span>
            </div>
            <!-- 성공 배지 -->
            <div v-else-if="fItem.status === 'success'" class="flex flex-col items-end">
              <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10.5px] font-bold">
                ✓ {{ fItem.students.length }}명 완료
              </span>
              <span v-if="fItem.parsedClass" class="text-[10px] text-slate-500 font-bold mt-0.5">
                {{ fItem.parsedClass }}반
              </span>
              <span v-else-if="fItem.students.length > 30" class="text-[10px] text-emerald-700 font-bold mt-0.5">
                전교생 일괄
              </span>
            </div>
            <!-- 실패 배지 -->
            <div v-else-if="fItem.status === 'error'" class="flex flex-col items-end">
              <span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold" :title="fItem.error">
                ⚠️ 실패 (재시도)
              </span>
            </div>
            <!-- 대기 배지 -->
            <div v-else class="text-[10.5px] text-slate-400 font-mono">
              대기 중
            </div>

            <!-- 개별 삭제 -->
            <button
              @click="removeFile(idx)"
              class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white border-none cursor-pointer transition-colors"
              title="파일 삭제"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. 통합 파싱 결과 미리보기 및 저장 액션 -->
    <div v-if="allParsedStudents.length > 0" class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
      <!-- 5-1. 구글 시트 반영 가이드 배너 -->
      <div class="rounded-xl p-4 bg-linear-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-base">📋</span>
            <span class="text-xs font-black text-slate-900">
              구글 시트 [{{ targetSheetName }}] 탭에 11개 반 데이터 즉시 반영
            </span>
          </div>
          <p class="text-[11.5px] text-slate-600 m-0 leading-relaxed">
            아래 <strong class="text-emerald-700">구글 시트에 즉시 반영</strong> 버튼을 누르면 11개 반 전체 성적이 <strong>클립보드에 자동 복사</strong>되고 <strong>구글 시트가 새 창으로 열립니다.</strong><br class="hidden sm:inline" />
            열린 시트의 <code class="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 font-mono font-bold">{{ targetSheetName }}</code> 탭 <strong>A1 셀</strong>을 클릭하고 <strong class="text-indigo-700 font-mono">Ctrl + V</strong>(붙여넣기)를 누르면 전교생 성적이 완성됩니다.
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

        <!-- 액션 서브 버튼 그룹 -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- 클립보드 복사 -->
          <button
            type="button"
            @click="copyToClipboard"
            class="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Copy :size="13" />
            <span>{{ copySuccess ? '복사 완료! ✓' : '시트 양식 TSV 복사' }}</span>
          </button>

          <!-- 엑셀(.xlsx) 다운로드 -->
          <button
            type="button"
            @click="exportParsedToExcel"
            class="px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet :size="14" class="text-emerald-600" />
            <span>{{ targetSheetName }} 전용 엑셀 다운로드</span>
          </button>
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
import { ref, computed } from 'vue'
import {
  UploadCloud,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  RefreshCw,
  ExternalLink
} from 'lucide-vue-next'
import * as XLSX from 'xlsx'
import {
  parseMockExamReportFile,
  convertStudentsToSheetRows,
  getTargetCollegeAdmissionYear,
  getAcademicSchoolYear,
  getTargetMockResultSheetName
} from '../../stat/utils/mockExamReportParser'
import { getKcueSheetId, buildSheetWebUrl, DEFAULT_KCUE_SHEET_ID } from '../../api/statApi'
import { dialog } from '../common/dialog'

// 현재 날짜 기준 대입/학사 학년도 자동 계산
const now = new Date()
const autoAdmissionYear = computed(() => getTargetCollegeAdmissionYear(now))
const autoAcademicYear = computed(() => getAcademicSchoolYear(now))
const targetSheetName = computed(() => getTargetMockResultSheetName(now))

const todayFormatted = computed(() => {
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`
})

// 가이드 아코디언 토글 (기본 펼침)
const isGuideOpen = ref(true)

// 선택 학년 (기본값: 3학년)
const selectedGrade = ref(3)

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
  const files = Array.from(e.target.files || [])
  if (files.length > 0) {
    addFilesToQueue(files)
  }
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function handleFileDrop(e) {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files || [])
  if (files.length > 0) {
    addFilesToQueue(files)
  }
}

/**
 * 다중 파일 큐 등록 및 순차 파싱
 * (대교협 모의고사 엑셀 .xlsx 최우선 1순위 파싱)
 */
async function addFilesToQueue(files) {
  const newItems = files.map(file => {
    return {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      selectedGrade: selectedGrade.value,
      status: 'pending', // pending, parsing, success, error
      error: '',
      students: [],
      parsedExamName: '',
      parsedClass: ''
    }
  })

  fileList.value.push(...newItems)

  for (const item of newItems) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('파일 처리 시간 초과 (7초)')), 7000)
      )
      await Promise.race([processFileItem(item), timeoutPromise])
    } catch (err) {
      console.error(`파일 ${item.name} 처리 중 예외:`, err)
      item.status = 'error'
      item.error = err.message || '처리 오류'
    }
  }
}

async function processFileItem(item) {
  item.status = 'parsing'
  try {
    const res = await parseMockExamReportFile(item.file, {
      defaultGrade: item.selectedGrade,
      uploadDate: now
    })

    if (!res.success) {
      item.status = 'error'
      item.error = res.error || '성적 데이터를 추출하지 못했습니다.'
      return
    }

    item.status = 'success'
    item.students = res.students
    item.parsedExamName = res.meta?.examName || ''
    item.parsedClass = res.meta?.classNum || ''
    if (res.meta?.grade) {
      item.selectedGrade = res.meta.grade
    }
  } catch (err) {
    console.error(`[Mock Parser] ${item.name} 파싱 실패:`, err)
    item.status = 'error'
    item.error = err.message || '파일 처리 중 오류가 발생했습니다.'
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
 * 엑셀(.xlsx) 파일로 내보내기
 */
function exportParsedToExcel() {
  if (allParsedStudents.value.length === 0) {
    dialog.alert('내보낼 학생 데이터가 없습니다.')
    return
  }

  const rows = convertStudentsToSheetRows(allParsedStudents.value)
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, targetSheetName.value)

  const fileName = `${targetSheetName.value}_성적일람표_${selectedGrade.value}학년_${todayFormatted.value.replace(/[\s년월]/g, '_')}.xlsx`
  XLSX.writeFile(wb, fileName)
}

/**
 * 구글 시트에 바로 붙여넣을 수 있는 탭 구분 텍스트(TSV) 클립보드 복사
 */
async function copyToClipboard() {
  if (allParsedStudents.value.length === 0) {
    dialog.alert('복사할 데이터가 없습니다.')
    return
  }

  const rows = convertStudentsToSheetRows(allParsedStudents.value)
  const tsvText = rows.map(r => r.join('\t')).join('\n')

  try {
    await navigator.clipboard.writeText(tsvText)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2500)
    dialog.alert(`총 ${allParsedStudents.value.length}명의 데이터가 클립보드에 복사되었습니다!\n구글 시트 '${targetSheetName.value}' 탭의 A1 셀에 붙여넣기(Ctrl+V)하세요.`)
  } catch (e) {
    dialog.alert('클립보드 복사 실패: ' + e.message)
  }
}

/**
 * 구글 시트 원본 '2027모의결과'에 즉시 반영 (클립보드 복사 + 구글 시트 자동 열기 + 백업 엑셀 다운)
 */
async function handleSaveToGoogleSheet() {
  if (allParsedStudents.value.length === 0) {
    dialog.alert('반영할 학생 데이터가 없습니다.')
    return
  }

  isSavingToSheet.value = true
  try {
    // 1. TSV 텍스트 클립보드 복사
    const rows = convertStudentsToSheetRows(allParsedStudents.value)
    const tsvText = rows.map(r => r.join('\t')).join('\n')
    await navigator.clipboard.writeText(tsvText)
    copySuccess.value = true

    // 2. 구글 시트 웹 URL 조회 및 새 탭 열기
    let sheetId = ''
    try {
      sheetId = await getKcueSheetId()
    } catch (_) {
      sheetId = DEFAULT_KCUE_SHEET_ID
    }
    const webUrl = buildSheetWebUrl(sheetId || DEFAULT_KCUE_SHEET_ID)
    window.open(webUrl, '_blank')

    // 3. 백업용 전용 엑셀 다운로드 병행
    exportParsedToExcel()

    // 4. GAS Web App URL이 있는 경우 백그라운드 자동 쓰기 시도
    const gasUrl = localStorage.getItem('ggom_gas_webapp_url')
    if (gasUrl) {
      try {
        fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveMockResults',
            sheetName: targetSheetName.value,
            rows
          })
        }).catch(e => console.warn('GAS 자동 전송 백그라운드 실패:', e))
      } catch (_) {}
    }

    // 5. 사용자 안내 다이얼로그
    dialog.alert(
      `📋 총 ${allParsedStudents.value.length}명(전교생)의 모의고사 성적이 클립보드에 복사되었습니다!\n\n` +
      `1. 새 탭으로 열린 구글 시트에서 [${targetSheetName.value}] 탭을 클릭하세요.\n` +
      `   (만약 탭이 없다면 시트 하단 '+'를 눌러 '${targetSheetName.value}' 탭을 생성하세요)\n` +
      `2. [A1] 셀을 클릭하고 [Ctrl + V]를 누르면 11개 반 전체 성적이 즉시 반영됩니다!\n\n` +
      `* 안전한 데이터 보관을 위해 '${targetSheetName.value}' 전용 엑셀 백업 파일도 함께 다운로드되었습니다.`
    )
  } catch (e) {
    dialog.alert('오류 발생: ' + e.message)
  } finally {
    isSavingToSheet.value = false
  }
}
</script>

<style scoped>
/* Scoped styles */
</style>
