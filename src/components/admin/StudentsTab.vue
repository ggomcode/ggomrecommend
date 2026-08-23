<template>
  <div class="py-8 px-4 sm:px-10">

    <!-- 페이지 헤더 -->
    <div class="mb-6 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-base mb-1" style="color: #94a3b8;">관리자</p>
          <h1 class="text-2xl font-semibold" style="color: #1e293b; margin: 0;">학생 관리</h1>
        </div>
        <button
          class="flex items-center gap-1.5 text-xs font-semibold rounded-xl border shadow-sm hover:shadow transition-all"
          style="padding: 8px 14px; border: 1px solid #cbd5e1; background: white; color: #475569; cursor: pointer;"
          :disabled="downloading"
          @click="dlAll"
        >
          📥 전체 학생목록 다운로드 (Excel)
        </button>
      </div>

      <!-- 액션 버튼 구역: 2개 라인 구성 -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <!-- 라인 1: 1. 재학생 관리 -->
        <div class="flex items-center flex-wrap gap-3">
          <span class="text-sm font-bold text-slate-800 mr-1">
            1. 재학생 관리
          </span>
          <button
            class="flex items-center gap-1.5 text-xs font-bold rounded-xl border shadow-sm hover:shadow transition-all"
            style="padding: 8px 14px; border: 1px solid #cbd5e1; background: white; color: #334155; cursor: pointer;"
            @click="downloadStudentRosterTemplate"
          >
            📋 명렬표 양식 다운로드
          </button>
          <label
            class="text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow transition-all"
            style="padding: 8px 14px; border: 1px solid #c084fc; background: #faf5ff; color: #7e22ce;"
          >
            📥 명렬표 업로드
            <input type="file" accept=".xlsx,.xls" class="hidden" @change="onExternalFile('roster', $event)" />
          </label>
          <button
            class="flex items-center gap-1.5 text-xs font-bold rounded-xl disabled:opacity-40 shadow-sm hover:shadow transition-all"
            style="padding: 8px 14px; background: #16a34a; color: white; cursor: pointer;"
            :disabled="showAddForm"
            @click="openAddForm"
          >
            + 학생 추가
          </button>
        </div>

        <div class="border-t border-slate-100"></div>

        <!-- 라인 2: 2. 석차연명부 가져오기 + 우측 초기화 버튼 -->
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center flex-wrap gap-3">
            <span class="text-sm font-bold text-slate-800 mr-1">
              2. 석차연명부 가져오기
            </span>
            <label
              class="text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow transition-all"
              style="padding: 8px 14px; border: 1px solid #e2e8f0; background: white; color: #334155;"
            >
              🏛️ 대교협
              <input type="file" accept=".xlsx,.xls" class="hidden" @change="onExternalFile('daegyo', $event)" />
            </label>
            <label
              class="text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow transition-all"
              style="padding: 8px 14px; border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8;"
            >
              🎓 유니브
              <input type="file" accept=".xlsx,.xls" class="hidden" @change="onExternalFile('univ', $event)" />
            </label>
            <span class="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              💡 대교협 또는 유니브 석차연명부 중 1개만 업로드하세요
            </span>
          </div>

          <!-- 오른쪽 끝 정렬: 명단·성적 전체 초기화 -->
          <button
            class="flex items-center gap-1.5 text-xs font-bold rounded-xl disabled:opacity-40 shadow-sm transition-all ml-auto"
            style="padding: 8px 14px; border: 1px solid #fca5a5; background: #fef2f2; color: #dc2626; cursor: pointer;"
            :disabled="resetting"
            @click="handleResetAll"
          >
            🗑️ 명단·성적 전체 초기화
          </button>
        </div>
      </div>
    </div>

    <HelpBox class="mb-4" storage-key="students" :title="HELP.title" :intro="HELP.intro" :items="HELP.items" />

    <!-- 학생 추가 폼 -->
    <div v-if="showAddForm" class="mb-5 rounded-xl"
      style="padding: 20px 22px; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);">
      <h3 class="text-lg font-semibold mb-4" style="color: #1e293b;">새 학생 추가</h3>

      <!-- 재학생/졸업생 선택 -->
      <div class="flex gap-4 mb-4">
        <label class="flex items-center gap-1.5 text-base cursor-pointer" style="color: #475569;">
          <input type="radio" v-model="addType" value="enrolled" class="accent-blue-600" />
          재학생
        </label>
        <label class="flex items-center gap-1.5 text-base cursor-pointer" style="color: #475569;">
          <input type="radio" v-model="addType" value="graduated" class="accent-blue-600" />
          졸업생
        </label>
      </div>

      <!-- 재학생 필드 -->
      <div v-if="addType === 'enrolled'" class="flex gap-4 items-end flex-wrap">
        <div>
          <label class="block text-base font-medium mb-1.5" style="color: #64748b;">학년</label>
          <input v-model.number="addForm.grade" type="number" min="1" max="3"
            class="text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            style="width: 72px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px;"
            placeholder="3" />
        </div>
        <div>
          <label class="block text-base font-medium mb-1.5" style="color: #64748b;">반</label>
          <input v-model.number="addForm.class_no" type="number" min="1"
            class="text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            style="width: 72px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px;"
            placeholder="2" />
        </div>
        <div>
          <label class="block text-base font-medium mb-1.5" style="color: #64748b;">번호</label>
          <input v-model.number="addForm.seq_no" type="number" min="1"
            class="text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            style="width: 72px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px;"
            placeholder="15" />
        </div>
        <div>
          <label class="block text-base font-medium mb-1.5" style="color: #64748b;">이름</label>
          <input v-model="addForm.name" type="text"
            class="text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            style="width: 130px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px;"
            placeholder="홍길동" />
        </div>
        <div>
          <label class="block text-base font-medium mb-1.5" style="color: #64748b;">학생 전화번호</label>
          <input v-model="addForm.student_phone" type="text"
            class="text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            style="width: 140px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px;"
            placeholder="01012345678" />
        </div>
        <div>
          <label class="block text-base font-medium mb-1.5" style="color: #64748b;">학부모 전화번호</label>
          <input v-model="addForm.parent_phone" type="text"
            class="text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            style="width: 140px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px;"
            placeholder="01087654321" @keydown.enter="submitAdd" />
        </div>
        <div class="flex gap-2">
          <button
            class="text-base font-semibold rounded-lg disabled:opacity-40"
            style="padding: 9px 20px; border: none; background: #2563eb; color: white; cursor: pointer;"
            :disabled="addSaving" @click="submitAdd"
          >{{ addSaving ? '저장 중…' : '저장' }}</button>
          <button
            class="text-base rounded-lg"
            style="padding: 9px 20px; border: 1px solid #e2e8f0; background: white; color: #64748b; cursor: pointer;"
            @click="cancelAdd"
          >취소</button>
        </div>
      </div>

      <!-- 졸업생 필드 -->
      <div v-else class="flex gap-4 items-end flex-wrap">
        <div>
          <label class="block text-base font-medium mb-1.5" style="color: #64748b;">졸업연도</label>
          <input v-model.number="addForm.grad_year" type="number"
            class="text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            style="width: 90px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px;"
            placeholder="2024" />
        </div>
        <div>
          <label class="block text-base font-medium mb-1.5" style="color: #64748b;">학번 (5자리)</label>
          <input v-model="addForm.student_code" type="text"
            class="text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            style="width: 110px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px;"
            placeholder="30105" />
        </div>
        <div>
          <label class="block text-base font-medium mb-1.5" style="color: #64748b;">이름</label>
          <input v-model="addForm.name" type="text"
            class="text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            style="width: 130px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px;"
            placeholder="김철수" />
        </div>
        <div>
          <label class="block text-base font-medium mb-1.5" style="color: #64748b;">학생 전화번호</label>
          <input v-model="addForm.student_phone" type="text"
            class="text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            style="width: 140px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px;"
            placeholder="01012345678" />
        </div>
        <div>
          <label class="block text-base font-medium mb-1.5" style="color: #64748b;">학부모 전화번호</label>
          <input v-model="addForm.parent_phone" type="text"
            class="text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            style="width: 140px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px;"
            placeholder="01087654321" @keydown.enter="submitAdd" />
        </div>
        <div class="flex gap-2">
          <button
            class="text-base font-semibold rounded-lg disabled:opacity-40"
            style="padding: 9px 20px; border: none; background: #2563eb; color: white; cursor: pointer;"
            :disabled="addSaving" @click="submitAdd"
          >{{ addSaving ? '저장 중…' : '저장' }}</button>
          <button
            class="text-base rounded-lg"
            style="padding: 9px 20px; border: 1px solid #e2e8f0; background: white; color: #64748b; cursor: pointer;"
            @click="cancelAdd"
          >취소</button>
        </div>
      </div>

      <p v-if="addError" class="text-base mt-3" style="color: #ef4444;">{{ addError }}</p>
    </div>

    <!-- 업로드 결과 -->
    <div v-if="result" class="mb-5 rounded-xl text-base"
      :style="{
        padding: '14px 18px',
        border: result.errors?.length ? '1px solid #fca5a5' : '1px solid #86efac',
        background: result.errors?.length ? '#fef2f2' : '#f0fdf4',
        color: result.errors?.length ? '#991b1b' : '#15803d',
      }">
      <p class="font-semibold mb-1">
        [{{ result.label }}]
        {{ result.errors?.length
          ? '오류 발생 — 가져오기 실패'
          : `가져오기 완료 (${result.count != null ? result.count + '명' : `신규 ${result.inserted || 0}명, 수정 ${result.updated || 0}명`})` }}
      </p>
      <ul v-if="result.errors?.length" class="list-disc list-inside space-y-0.5">
        <li v-for="(e, i) in result.errors" :key="i">{{ e }}</li>
      </ul>
    </div>

    <p v-if="error" class="text-base mb-3" style="color: #ef4444;">{{ error }}</p>

    <!-- 필터 및 세부 성적 보기 체크박스 -->
    <div class="rounded-xl mb-4 flex flex-wrap gap-3 items-center px-4.5 py-3.5 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.04)]">

      <select v-model="filterEnrolled"
              class="text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 border border-slate-200 py-2 pl-3 pr-8 text-slate-800 bg-white">
        <option :value="null">전체 유형</option>
        <option :value="1">재학생</option>
        <option :value="0">졸업생</option>
      </select>

      <select v-model.number="filterGrade"
              class="text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 border border-slate-200 py-2 pl-3 pr-8 text-slate-800 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="filterEnrolled === 0"
              @change="filterClass = null">
        <option v-if="filterEnrolled === 0" :value="null">졸업생</option>
        <template v-else>
          <option :value="null">전체 학년</option>
          <option v-for="g in gradeOptions.grades" :key="g" :value="g">{{ g }}학년</option>
        </template>
      </select>

      <select v-model.number="filterClass"
              class="text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 border border-slate-200 py-2 pl-3 pr-8 text-slate-800 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="filterEnrolled === 0">
        <option v-if="filterEnrolled === 0" :value="null">졸업생 학급</option>
        <template v-else>
          <option :value="null">전체 반</option>
          <option v-for="c in availableClasses" :key="c" :value="c">{{ c }}반</option>
        </template>
      </select>

      <button
          class="text-base font-medium rounded-lg px-4.5 py-2 bg-[#2563eb] text-white hover:bg-blue-700 transition-colors"
          @click="loadStudents()">조회</button>

      <!-- 학기별 성적 세부 보기 체크박스 -->
      <label class="flex items-center gap-2 cursor-pointer ml-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
        <input type="checkbox" v-model="showDetailedGrades" class="w-4 h-4 accent-blue-600 rounded" />
        <span class="text-base font-semibold text-slate-700">학기별 성적 세부 보기</span>
      </label>

      <span class="ml-auto text-base font-medium text-slate-500">총 {{ studentPage?.total || 0 }}명</span>
    </div>

    <!-- 학생 목록 테이블 -->
    <div class="rounded-xl overflow-hidden"
      style="background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);">
      <div class="overflow-x-auto">
        <table class="w-full text-left" style="border-collapse: collapse; min-width: 850px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <th class="text-base font-semibold" style="padding: 14px 16px; color: #475569;">학번</th>
              <th class="text-base font-semibold" style="padding: 14px 16px; color: #475569;">이름</th>
              <th class="text-base font-semibold" style="padding: 14px 16px; color: #475569;">구분</th>
              <th class="text-base font-semibold" style="padding: 14px 16px; color: #475569;">학년/반/번호</th>

              <!-- 세부 보기 미체크 시 -> 전학년 석차등급 단일 표시 -->
              <template v-if="!showDetailedGrades">
                <th class="text-base font-semibold" style="padding: 14px 16px; color: #475569;">전학년 석차등급</th>
              </template>

              <!-- 세부 보기 체크 시 -> 1-1 ~ 3-2 학기별 성적 컬럼 확장 -->
              <template v-else>
                <th class="text-xs font-bold text-center" style="padding: 10px 8px; color: #475569; background: #eff6ff;">1-1</th>
                <th class="text-xs font-bold text-center" style="padding: 10px 8px; color: #475569; background: #eff6ff;">1-2</th>
                <th class="text-xs font-bold text-center" style="padding: 10px 8px; color: #1d4ed8; background: #dbeafe;">1전학기</th>
                <th class="text-xs font-bold text-center" style="padding: 10px 8px; color: #475569; background: #eff6ff;">2-1</th>
                <th class="text-xs font-bold text-center" style="padding: 10px 8px; color: #475569; background: #eff6ff;">2-2</th>
                <th class="text-xs font-bold text-center" style="padding: 10px 8px; color: #1d4ed8; background: #dbeafe;">2전학기</th>
                <th class="text-xs font-bold text-center" style="padding: 10px 8px; color: #475569; background: #eff6ff;">3-1</th>
                <th class="text-xs font-bold text-center" style="padding: 10px 8px; color: #475569; background: #eff6ff;">3-2</th>
                <th class="text-xs font-bold text-center" style="padding: 10px 8px; color: #1d4ed8; background: #dbeafe;">3전학기</th>
                <th class="text-xs font-bold text-center" style="padding: 10px 8px; color: #b45309; background: #fef3c7;">전학년</th>
              </template>

              <th class="text-base font-semibold text-center" style="padding: 14px 16px; color: #475569;">관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in (studentPage?.rows || [])" :key="s.id"
              class="hover:bg-slate-50"
              style="border-bottom: 1px solid #f1f5f9; transition: background 0.1s;">
              <td class="text-base font-mono font-semibold" style="padding: 12px 16px; color: #2563eb;">{{ s.student_code }}</td>
              <td class="text-base font-medium" style="padding: 12px 16px; color: #1e293b;">{{ s.name }}</td>
              <td style="padding: 12px 16px;">
                <span class="text-base font-medium" :style="{ color: s.is_enrolled ? '#2563eb' : '#94a3b8' }">
                  {{ s.is_enrolled ? '재학' : '졸업' }}
                </span>
              </td>
              <td class="text-base" style="padding: 12px 16px; color: #475569;">
                {{ s.grade ? `${s.grade}학년 ${s.class_no}반 ${s.seq_no || s.student_no}번` : (s.grad_year ? `${s.grad_year}년 졸업` : '-') }}
              </td>

              <!-- 기본 모드: 전학년 등급 -->
              <template v-if="!showDetailedGrades">
                <td style="padding: 12px 16px;">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-md text-base font-semibold"
                    :class="(s.gpa_overall != null || gradesMap[s.student_code] != null) ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-400'">
                    {{ s.gpa_overall != null ? s.gpa_overall + ' 등급' : (gradesMap[s.student_code] != null ? gradesMap[s.student_code] + ' 등급' : '-') }}
                  </span>
                </td>
              </template>

              <!-- 학기별 상세 모드 -->
              <template v-else>
                <td class="text-xs text-center font-mono" style="padding: 10px 4px; background: #f8fafc;">{{ s.gpa_1_1 || gradesDetailMap[s.student_code]?.gpa_1_1 || '-' }}</td>
                <td class="text-xs text-center font-mono" style="padding: 10px 4px; background: #f8fafc;">{{ s.gpa_1_2 || gradesDetailMap[s.student_code]?.gpa_1_2 || '-' }}</td>
                <td class="text-xs text-center font-mono font-bold text-blue-700" style="padding: 10px 4px; background: #eff6ff;">{{ s.gpa_1_all || gradesDetailMap[s.student_code]?.gpa_1_all || '-' }}</td>
                <td class="text-xs text-center font-mono" style="padding: 10px 4px; background: #f8fafc;">{{ s.gpa_2_1 || gradesDetailMap[s.student_code]?.gpa_2_1 || '-' }}</td>
                <td class="text-xs text-center font-mono" style="padding: 10px 4px; background: #f8fafc;">{{ s.gpa_2_2 || gradesDetailMap[s.student_code]?.gpa_2_2 || '-' }}</td>
                <td class="text-xs text-center font-mono font-bold text-blue-700" style="padding: 10px 4px; background: #eff6ff;">{{ s.gpa_2_all || gradesDetailMap[s.student_code]?.gpa_2_all || '-' }}</td>
                <td class="text-xs text-center font-mono" style="padding: 10px 4px; background: #f8fafc;">{{ s.gpa_3_1 || gradesDetailMap[s.student_code]?.gpa_3_1 || '-' }}</td>
                <td class="text-xs text-center font-mono" style="padding: 10px 4px; background: #f8fafc;">{{ s.gpa_3_2 || gradesDetailMap[s.student_code]?.gpa_3_2 || '-' }}</td>
                <td class="text-xs text-center font-mono font-bold text-blue-700" style="padding: 10px 4px; background: #eff6ff;">{{ s.gpa_3_all || gradesDetailMap[s.student_code]?.gpa_3_all || '-' }}</td>
                <td class="text-xs text-center font-mono font-bold text-amber-800" style="padding: 10px 4px; background: #fef3c7;">{{ s.gpa_overall != null ? s.gpa_overall : (gradesMap[s.student_code] != null ? gradesMap[s.student_code] : (gradesDetailMap[s.student_code]?.value || '-')) }}</td>
              </template>

              <td class="text-center" style="padding: 12px 16px;">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    class="text-base font-medium rounded-lg whitespace-nowrap"
                    style="padding: 5px 12px; border: 1px solid #cbd5e1; background: white; color: #334155; cursor: pointer;"
                    @click="openEditModal(s)"
                  >수정</button>
                  <button
                    class="text-base font-medium rounded-lg whitespace-nowrap"
                    style="padding: 5px 12px; border: 1px solid #fca5a5; background: white; color: #ef4444; cursor: pointer;"
                    @click="remove(s)"
                  >삭제</button>
                </div>
              </td>
            </tr>
            <tr v-if="!studentPage?.rows || studentPage.rows.length === 0">
              <td :colspan="showDetailedGrades ? 14 : 6" class="text-base text-center" style="padding: 48px 20px; color: #94a3b8;">
                등록된 학생 데이터가 없습니다. 상단에서 유니브 석차연명부 엑셀을 업로드하시면 전교생 명단과 내신성적이 일괄 반영됩니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 페이지 내비게이션 -->
    <div v-if="studentPage?.total > 0" class="mt-4 flex items-center justify-center gap-4">
      <button
        class="text-base rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        style="padding: 8px 18px; border: 1px solid #e2e8f0; background: white; color: #475569; cursor: pointer;"
        :disabled="(studentPage?.page || 1) <= 1"
        @click="loadStudents((studentPage?.page || 1) - 1)"
      >&lt; 이전</button>
      <span class="text-base" style="color: #64748b;">
        {{ studentPage?.page || 1 }} / {{ Math.ceil((studentPage?.total || 0) / (studentPage?.per_page || 100)) }} 페이지
        (총 {{ studentPage?.total || 0 }}명)
      </span>
      <button
        class="text-base rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        style="padding: 8px 18px; border: 1px solid #e2e8f0; background: white; color: #475569; cursor: pointer;"
        :disabled="(studentPage?.page || 1) >= Math.ceil((studentPage?.total || 0) / (studentPage?.per_page || 100))"
        @click="loadStudents((studentPage?.page || 1) + 1)"
      >다음 &gt;</button>
    </div>

    <!-- 외부 가져오기 미리보기 모달 -->
    <Teleport to="body">
      <div v-if="extModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px);">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div class="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-slate-50">
            <div>
              <h3 class="text-lg font-bold text-slate-900">{{ extModal.title }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ extModal.fileName }}</p>
            </div>
            <button @click="extModal.open = false" class="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
          </div>

          <div class="p-6 overflow-y-auto space-y-4">
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 text-base text-slate-600">
              {{ extModal.headerInfo }}
            </div>

            <div>
              <p class="text-base font-semibold text-slate-700 mb-2">미리보기 (상위 {{ extModal.preview.length }}행 / 총 {{ extModal.total }}행)</p>
              <div class="rounded-xl overflow-hidden border border-slate-200">
                <table class="w-full text-left text-base">
                  <thead class="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th v-for="hd in ['학년','반','번호','이름','석차','석차등급']" :key="hd" class="py-2.5 px-4">{{ hd }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="(r, i) in extModal.preview" :key="i" class="hover:bg-slate-50">
                      <td v-for="(c, j) in r" :key="j" class="py-2 px-4">{{ c }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
            <button @click="extModal.open = false" class="px-4 py-2 border border-slate-300 rounded-lg text-base text-slate-600 bg-white">취소</button>
            <button @click="confirmImport" class="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold text-base" :disabled="extModal.importing">
              {{ extModal.importing ? '가져오는 중...' : '학생 명단 및 성적 반영하기' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 학생 정보 수정 모달 -->
    <Teleport to="body">
      <div v-if="editModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px);">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          <div class="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-slate-50">
            <div>
              <h3 class="text-lg font-bold text-slate-900">학생 정보 수정</h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ editModal.name }} ({{ editModal.student_code }})</p>
            </div>
            <button @click="editModal.open = false" class="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
          </div>

          <div class="p-6 overflow-y-auto space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">학번 (학생코드)</label>
                <input v-model="editModal.student_code" type="text" class="w-full text-base border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">이름</label>
                <input v-model="editModal.name" type="text" class="w-full text-base border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none" />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">학년</label>
                <input v-model.number="editModal.grade" type="number" min="1" max="3" class="w-full text-base border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">반</label>
                <input v-model.number="editModal.class_no" type="number" min="1" class="w-full text-base border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">번호</label>
                <input v-model.number="editModal.seq_no" type="number" min="1" class="w-full text-base border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">전학년 석차등급</label>
              <input v-model="editModal.gpa_overall" type="text" placeholder="예: 1.85" class="w-full text-base border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none font-semibold text-blue-700" />
            </div>

            <div class="border-t border-slate-200 pt-3">
              <p class="text-xs font-bold text-slate-700 mb-2">학기별 석차등급 상세</p>
              <div class="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label class="block font-medium text-slate-600 mb-1">1-1</label>
                  <input v-model="editModal.gpa_1_1" type="text" class="w-full border border-slate-300 rounded p-1.5 text-center font-mono text-base" />
                </div>
                <div>
                  <label class="block font-medium text-slate-600 mb-1">1-2</label>
                  <input v-model="editModal.gpa_1_2" type="text" class="w-full border border-slate-300 rounded p-1.5 text-center font-mono text-base" />
                </div>
                <div>
                  <label class="block font-bold text-blue-700 mb-1">1전학기</label>
                  <input v-model="editModal.gpa_1_all" type="text" class="w-full border border-blue-300 bg-blue-50/50 rounded p-1.5 text-center font-mono text-base font-bold text-blue-700" />
                </div>
                <div>
                  <label class="block font-medium text-slate-600 mb-1">2-1</label>
                  <input v-model="editModal.gpa_2_1" type="text" class="w-full border border-slate-300 rounded p-1.5 text-center font-mono text-base" />
                </div>
                <div>
                  <label class="block font-medium text-slate-600 mb-1">2-2</label>
                  <input v-model="editModal.gpa_2_2" type="text" class="w-full border border-slate-300 rounded p-1.5 text-center font-mono text-base" />
                </div>
                <div>
                  <label class="block font-bold text-blue-700 mb-1">2전학기</label>
                  <input v-model="editModal.gpa_2_all" type="text" class="w-full border border-blue-300 bg-blue-50/50 rounded p-1.5 text-center font-mono text-base font-bold text-blue-700" />
                </div>
                <div>
                  <label class="block font-medium text-slate-600 mb-1">3-1</label>
                  <input v-model="editModal.gpa_3_1" type="text" class="w-full border border-slate-300 rounded p-1.5 text-center font-mono text-base" />
                </div>
                <div>
                  <label class="block font-medium text-slate-600 mb-1">3-2</label>
                  <input v-model="editModal.gpa_3_2" type="text" class="w-full border border-slate-300 rounded p-1.5 text-center font-mono text-base" />
                </div>
                <div>
                  <label class="block font-bold text-blue-700 mb-1">3전학기</label>
                  <input v-model="editModal.gpa_3_all" type="text" class="w-full border border-blue-300 bg-blue-50/50 rounded p-1.5 text-center font-mono text-base font-bold text-blue-700" />
                </div>
              </div>
            </div>

            <p v-if="editModal.error" class="text-sm text-red-500 font-medium">{{ editModal.error }}</p>
          </div>

          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
            <button @click="editModal.open = false" class="px-4 py-2 border border-slate-300 rounded-lg text-base text-slate-600 bg-white">취소</button>
            <button @click="saveEditModal" class="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold text-base" :disabled="editModal.saving">
              {{ editModal.saving ? '저장 중...' : '저장' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  getStudents,
  getStudentGradeOptions,
  exportStudents,
  downloadEnrolledTemplate,
  importEnrolled,
  importEnrolledStudents,
  downloadGraduatedTemplate,
  importGraduated,
  addEnrolledStudent,
  addGraduatedStudent,
  updateStudent,
  deleteStudent,
  blobErrMsg,
  previewUnivImport,
  importUniv,
  previewDaegyoImport,
  importDaegyo,
  previewStudentRosterImport,
  importStudentRosterExcel,
  downloadStudentRosterTemplate,
  resetAllStudentAndGradeData
} from '../../api/admin.js'
import { supabase } from '../../utils/supabaseClient.js'
import HelpBox from '../common/HelpBox.vue'
import { dialog } from '../common/dialog.js'

const HELP = {
  title: '도움말 — 학생 관리',
  intro: '전교생 명단과 내신성적을 손쉽게 등록·관리하는 곳입니다.',
  items: [
    '📌 [가장 쉬운 사용법] 상단의 "🎓 유니브 석차연명부 가져오기" 버튼으로 엑셀을 올리시면 전교생 명단과 학기별/전학년 내신 성적이 한 번에 자동 등록됩니다.',
    '재학생/졸업생 선택 후 "양식 다운로드"로 받은 엑셀 파일에 학생 명단을 채워 "가져오기"로 업로드할 수도 있습니다.',
    '"☑ 학기별 성적 세부 보기" 체크박스를 선택하면 각 학기별 석차등급(1-1, 1-2, 2-1...)을 상세히 확인하실 수 있습니다.',
  ],
}

const studentPage = ref({ rows: [], total: 0, page: 1, per_page: 100 })
const error = ref('')
const result = ref(null)
const resetting = ref(false)

async function handleResetAll() {
  if (!(await dialog.confirm({
    title: '🚨 학생 명단 및 성적 전체 초기화 (Truncate)',
    message: '등록된 전교생 학적 명단(enrolled_students)과 학기별 내신 성적 데이터가 전체 삭제됩니다. 정말 초기화하시겠습니까?',
    confirmText: '전체 초기화',
    level: 'danger',
    dangerNotice: '이 작업은 복구할 수 없으며, 저장된 모든 학생 명단과 성적이 영구적으로 지워집니다.',
    finalConfirmText: '영구 초기화',
  }))) return

  resetting.value = true
  try {
    await resetAllStudentAndGradeData()
    gradesMap.value = {}
    gradesDetailMap.value = {}
    await Promise.all([loadStudents(), loadGradeOptions()])
    await dialog.alert({ title: '초기화 완료', message: '전교생 학적 명단 및 성적 데이터가 깨끗하게 초기화되었습니다.', level: 'success' })
  } catch (e) {
    await dialog.alert({ title: '초기화 실패', message: e.message || '초기화 중 오류가 발생했습니다.', level: 'error' })
  } finally {
    resetting.value = false
  }
}
const filterEnrolled = ref(null)   // null=전체, 1=재학생, 0=졸업생
const filterGrade = ref(null)
const filterClass = ref(null)
const gradeOptions = ref({ grades: [], by_grade: {} })
const downloading = ref(false)
const uploading = ref(false)
const studentType = ref('enrolled')

const showDetailedGrades = ref(false)
const gradesMap = ref({})
const gradesDetailMap = ref({})

const extModal = ref({
  open: false, format: '', title: '', file: null, fileName: '',
  headerInfo: '', preview: [], total: 0, importing: false
})

const editModal = ref({
  open: false, saving: false, error: '', id: null,
  student_code: '', name: '', is_enrolled: true,
  grade: null, class_no: null, seq_no: null, grad_year: null,
  gpa_overall: '', gpa_1_1: '', gpa_1_2: '', gpa_1_all: '',
  gpa_2_1: '', gpa_2_2: '', gpa_2_all: '', gpa_3_1: '', gpa_3_2: '', gpa_3_all: ''
})

function openEditModal(s) {
  editModal.value = {
    open: true,
    saving: false,
    error: '',
    id: s.id,
    student_code: s.student_code || '',
    name: s.name || '',
    is_enrolled: s.is_enrolled !== false,
    grade: s.grade || null,
    class_no: s.class_no || null,
    seq_no: s.seq_no || s.student_no || null,
    grad_year: s.grad_year || null,
    gpa_overall: s.gpa_overall ?? gradesMap.value[s.student_code] ?? '',
    gpa_1_1: s.gpa_1_1 || gradesDetailMap.value[s.student_code]?.gpa_1_1 || '',
    gpa_1_2: s.gpa_1_2 || gradesDetailMap.value[s.student_code]?.gpa_1_2 || '',
    gpa_1_all: s.gpa_1_all || gradesDetailMap.value[s.student_code]?.gpa_1_all || '',
    gpa_2_1: s.gpa_2_1 || gradesDetailMap.value[s.student_code]?.gpa_2_1 || '',
    gpa_2_2: s.gpa_2_2 || gradesDetailMap.value[s.student_code]?.gpa_2_2 || '',
    gpa_2_all: s.gpa_2_all || gradesDetailMap.value[s.student_code]?.gpa_2_all || '',
    gpa_3_1: s.gpa_3_1 || gradesDetailMap.value[s.student_code]?.gpa_3_1 || '',
    gpa_3_2: s.gpa_3_2 || gradesDetailMap.value[s.student_code]?.gpa_3_2 || '',
    gpa_3_all: s.gpa_3_all || gradesDetailMap.value[s.student_code]?.gpa_3_all || ''
  }
}

async function saveEditModal() {
  const m = editModal.value
  m.error = ''
  m.saving = true
  try {
    await updateStudent(m.id, {
      student_code: m.student_code,
      name: m.name,
      is_enrolled: m.is_enrolled,
      grade: m.grade,
      class_no: m.class_no,
      seq_no: m.seq_no,
      grad_year: m.grad_year,
      gpa_overall: m.gpa_overall !== '' && m.gpa_overall !== null ? parseFloat(m.gpa_overall) : null,
      gpa_1_1: m.gpa_1_1,
      gpa_1_2: m.gpa_1_2,
      gpa_1_all: m.gpa_1_all,
      gpa_2_1: m.gpa_2_1,
      gpa_2_2: m.gpa_2_2,
      gpa_2_all: m.gpa_2_all,
      gpa_3_1: m.gpa_3_1,
      gpa_3_2: m.gpa_3_2,
      gpa_3_all: m.gpa_3_all
    })

    // 로컬 성적 맵도 갱신
    if (m.student_code) {
      if (m.gpa_overall) gradesMap.value[m.student_code] = m.gpa_overall
      gradesDetailMap.value[m.student_code] = {
        gpa_1_1: m.gpa_1_1 || '-',
        gpa_1_2: m.gpa_1_2 || '-',
        gpa_1_all: m.gpa_1_all || '-',
        gpa_2_1: m.gpa_2_1 || '-',
        gpa_2_2: m.gpa_2_2 || '-',
        gpa_2_all: m.gpa_2_all || '-',
        gpa_3_1: m.gpa_3_1 || '-',
        gpa_3_2: m.gpa_3_2 || '-',
        gpa_3_all: m.gpa_3_all || '-',
        value: m.gpa_overall || '-'
      }
    }

    editModal.value.open = false
    await loadStudents(studentPage.value.page)
    await loadGradeOptions()
    await dialog.alert({ title: '수정 완료', message: '학생 정보가 성공적으로 수정되었습니다.', level: 'success' })
  } catch (e) {
    m.error = e.message || '수정 중 오류가 발생했습니다.'
  } finally {
    m.saving = false
  }
}

async function loadGradesConfig() {
  if (!supabase) return
  try {
    const { data: gData } = await supabase.from('config').select('value').eq('key', 'global_course_grades').maybeSingle()
    if (gData && gData.value) {
      try { gradesMap.value = JSON.parse(gData.value) } catch {}
    } else {
      const local = localStorage.getItem('global_course_grades')
      if (local) try { gradesMap.value = JSON.parse(local) } catch {}
    }

    const { data: dData } = await supabase.from('config').select('value').eq('key', 'global_course_grades_detail').maybeSingle()
    if (dData && dData.value) {
      try { gradesDetailMap.value = JSON.parse(dData.value) } catch {}
    } else {
      const local = localStorage.getItem('global_course_grades_detail')
      if (local) try { gradesDetailMap.value = JSON.parse(local) } catch {}
    }
  } catch (e) {
    console.error(e)
  }
}

async function onExternalFile(format, evt) {
  const file = evt.target.files?.[0]
  evt.target.value = ''
  if (!file) return
  try {
    if (format === 'roster') {
      uploading.value = true
      const res = await importStudentRosterExcel(file)
      await loadGradesConfig()
      await Promise.all([loadStudents(), loadGradeOptions()])
      uploading.value = false
      await dialog.alert({
        title: '가져오기 완료',
        message: `총 ${res.count || 0}명의 재학생 명단 및 암호화 해시 데이터가 성공적으로 반영되었습니다!`,
        level: 'success'
      })
      return
    }

    let data
    if (format === 'univ') {
      data = await previewUnivImport(null, file)
    } else if (format === 'daegyo') {
      data = await previewDaegyoImport(null, file)
    }

    const titleMap = {
      univ: '유니브 석차연명부 가져오기',
      daegyo: '대교협 석차연명부 가져오기'
    }

    extModal.value = {
      open: true,
      format,
      title: titleMap[format] || '엑셀 데이터 가져오기',
      file,
      fileName: file.name,
      headerInfo: data.header_info,
      preview: data.preview,
      total: data.total,
      importing: false
    }
  } catch (e) {
    uploading.value = false
    await dialog.alert({ title: '가져오기 실패', message: e.message || '파일 파싱 오류', level: 'error' })
  }
}

async function confirmImport() {
  const m = extModal.value
  m.importing = true
  try {
    if (m.format === 'univ') {
      await importUniv(null, m.file)
    } else if (m.format === 'daegyo') {
      await importDaegyo(null, m.file)
    } else if (m.format === 'roster') {
      await importStudentRosterExcel(m.file)
    }
    extModal.value.open = false
    await loadGradesConfig()
    await Promise.all([loadStudents(), loadGradeOptions()])
    await dialog.alert({ title: '가져오기 완료', message: `전교생 학적 명단 및 암호화 해시 데이터가 성공적으로 등록/업데이트되었습니다!`, level: 'success' })
  } catch (e) {
    await dialog.alert({ title: '저장 실패', message: e.message || '데이터 반영 중 오류 발생', level: 'error' })
  } finally {
    m.importing = false
  }
}

// ── 개별 추가 폼 ────────────────────────────────────────────────
const showAddForm = ref(false)
const addType = ref('enrolled')
const addForm = ref({ name: '', grade: null, class_no: null, seq_no: null, student_code: '', grad_year: null, student_phone: '', parent_phone: '' })
const addError = ref('')
const addSaving = ref(false)

function openAddForm() {
  addType.value = studentType.value
  addForm.value = { name: '', grade: null, class_no: null, seq_no: null, student_code: '', grad_year: null, student_phone: '', parent_phone: '' }
  addError.value = ''
  showAddForm.value = true
}

function cancelAdd() {
  showAddForm.value = false
  addForm.value = { name: '', grade: null, class_no: null, seq_no: null, student_code: '', grad_year: null, student_phone: '', parent_phone: '' }
  addError.value = ''
}

async function submitAdd() {
  addError.value = ''
  addSaving.value = true
  try {
    if (addType.value === 'enrolled') {
      const { grade, class_no, seq_no, name, student_phone, parent_phone } = addForm.value
      if (!grade || !class_no || !seq_no || !name?.trim()) {
        addError.value = '학년, 반, 번호, 이름을 모두 입력하세요.'
        return
      }
      await addEnrolledStudent({ grade, class_no, seq_no, name: name.trim(), student_phone, parent_phone })
    } else {
      const { student_code, name, grad_year, student_phone, parent_phone } = addForm.value
      if (!grad_year || !student_code?.trim() || !name?.trim()) {
        addError.value = '졸업연도, 학번, 이름을 모두 입력하세요.'
        return
      }
      await addGraduatedStudent({ grad_year, student_code: student_code.trim(), name: name.trim(), student_phone, parent_phone })
    }
    cancelAdd()
    await Promise.all([loadStudents(), loadGradeOptions()])
  } catch (e) {
    addError.value = e.response?.data ?? e.message ?? '오류가 발생했습니다'
  } finally {
    addSaving.value = false
  }
}

// 선택 학년에 따라 드롭다운에 표시할 반 목록
const availableClasses = computed(() => {
  const byGrade = gradeOptions.value?.by_grade
  if (!byGrade) return []
  if (!filterGrade.value) {
    const all = new Set()
    Object.values(byGrade).forEach(arr => Array.isArray(arr) && arr.forEach(c => all.add(c)))
    return [...all].sort((a, b) => a - b)
  }
  return byGrade[String(filterGrade.value)] ?? []
})

// 졸업생 선택 시 학년·반 필터 초기화
watch(filterEnrolled, (val) => {
  if (val === 0) {
    filterGrade.value = null
    filterClass.value = null
  }
})

async function loadStudents(page = 1) {
  error.value = ''
  try {
    const params = { page, per_page: studentPage.value.per_page }
    if (filterGrade.value)              params.grade = filterGrade.value
    if (filterClass.value)              params.class_no = filterClass.value
    if (filterEnrolled.value !== null)  params.is_enrolled = filterEnrolled.value
    studentPage.value = await getStudents(params)
  } catch (e) {
    error.value = e.response?.data ?? e.message
  }
}

async function loadGradeOptions() {
  try {
    gradeOptions.value = await getStudentGradeOptions()
  } catch { /* 실패해도 빈 목록으로 동작 */ }
}

function saveBlob(response, fallback) {
  const filename = fallback
  const url = URL.createObjectURL(new Blob([response.data]))
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

async function runImport(apiFn, label, evt) {
  const file = evt.target.files?.[0]
  if (!file) return
  error.value = ''
  result.value = null
  uploading.value = true
  try {
    const data = await apiFn(file)
    result.value = { label, ...data }
    await Promise.all([loadStudents(), loadGradeOptions()])
  } catch (e) {
    const d = e.response?.data
    if (d != null && typeof d === 'object' && Array.isArray(d.errors)) {
      result.value = { label, ...d }
    } else {
      error.value = typeof d === 'string' ? d : (e.message ?? '오류가 발생했습니다')
    }
  } finally {
    uploading.value = false
    evt.target.value = ''
  }
}

async function remove(s) {
  const label = `${s.name}(${s.student_code})`
  if (!(await dialog.confirm({
    title: '학생 삭제',
    message: `${label} 학생을 삭제하시겠습니까?`,
    confirmText: '삭제',
    level: 'danger',
    dangerNotice: '삭제된 학생 정보는 복구할 수 없습니다.',
    finalConfirmText: '영구 삭제',
  }))) return
  error.value = ''
  try {
    await deleteStudent(s.id)
    await loadStudents(studentPage.value.page)
  } catch (e) {
    error.value = e.response?.data ?? e.message
  }
}

async function dlGraduatedTemplate() {
  downloading.value = true
  try {
    saveBlob(await downloadGraduatedTemplate(), '졸업생_명단_등록_양식.xlsx')
  } catch (e) { error.value = await blobErrMsg(e) }
  finally { downloading.value = false }
}

function onImportGraduatedFile(evt) {
  runImport(importGraduated, '졸업생', evt)
}

async function dlAll() {
  downloading.value = true
  try { saveBlob(await exportStudents(), 'students_all.xlsx') }
  catch (e) { error.value = await blobErrMsg(e) }
  finally { downloading.value = false }
}

onMounted(() => {
  loadGradeOptions()
  loadStudents()
  loadGradesConfig()
})
</script>
