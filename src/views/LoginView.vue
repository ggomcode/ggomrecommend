<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-slate-100 font-sans transition-colors duration-300">
    <div
      class="w-full bg-white shadow-xl border border-slate-200/80 transition-all duration-300 relative overflow-hidden"
      style="max-width: 460px; border-radius: 28px; padding: 2.25rem 2.25rem 2.5rem;"
    >
      <!-- Decorative background blur -->
      <div
        :class="[
          'absolute -top-24 -left-24 w-44 h-44 rounded-full blur-3xl transition-colors duration-500',
          activeTab === 'student' ? 'bg-blue-500/10' : (activeTab === 'graduate' ? 'bg-indigo-500/10' : 'bg-emerald-500/10')
        ]"
      ></div>
      <div
        :class="[
          'absolute -bottom-24 -right-24 w-44 h-44 rounded-full blur-3xl transition-colors duration-500',
          activeTab === 'student' ? 'bg-indigo-500/10' : (activeTab === 'graduate' ? 'bg-purple-500/10' : 'bg-teal-500/10')
        ]"
      ></div>

      <!-- 헤더 -->
      <div class="text-center mb-6 relative">
        <div
          :class="[
            'inline-flex items-center justify-center rounded-2xl mb-3 shadow-xs border transition-all duration-300',
            activeTab === 'student' ? 'bg-blue-50 text-blue-600 border-blue-100' : (activeTab === 'graduate' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100')
          ]"
          style="width: 56px; height: 56px;"
        >
          <GraduationCap v-if="activeTab === 'student'" class="w-7 h-7" />
          <School v-else-if="activeTab === 'graduate'" class="w-7 h-7" />
          <UserCheck v-else class="w-7 h-7" />
        </div>
        <p class="text-xs font-extrabold text-blue-600 mb-1.5 tracking-wide">{{ schoolName }}</p>
        <h1 class="text-slate-900 m-0 flex flex-col items-center justify-center gap-1 font-extrabold tracking-tight leading-snug">
          <span class="text-[15px] text-slate-900">학교장 추천자 선발 시스템</span>
          <template v-if="isRuralSystemEnabled && isExamIntentSystemEnabled">
            <span class="text-xs text-blue-600 font-bold leading-none my-0.5">및</span>
            <span class="text-[15px] text-slate-900">농어촌(기회균형) 전형 추천 등록 시스템</span>
            <span class="text-xs text-blue-600 font-bold leading-none my-0.5">및</span>
            <span class="text-[15px] text-slate-900">수능응시 · 수시/정시 원서접수계획 등록 시스템</span>
          </template>
          <template v-else-if="isRuralSystemEnabled">
            <span class="text-xs text-blue-600 font-bold leading-none my-0.5">및</span>
            <span class="text-[15px] text-slate-900">농어촌(기회균형) 전형 추천 등록 시스템</span>
          </template>
          <template v-else-if="isExamIntentSystemEnabled">
            <span class="text-xs text-blue-600 font-bold leading-none my-0.5">및</span>
            <span class="text-[15px] text-slate-900">수능응시 · 수시/정시 원서접수계획 등록 시스템</span>
          </template>
        </h1>
      </div>

      <!-- 3가지 역할 구분 탭 (재학생 / 졸업생 / 교사) -->
      <div v-if="!isSignUp" class="flex p-1.5 bg-slate-100/90 rounded-2xl mb-6 border border-slate-200/80">
        <button
          type="button"
          @click="switchTab('student')"
          :class="[
            'flex-1 py-2.5 px-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border-none',
            activeTab === 'student'
              ? 'bg-white text-blue-600 shadow-md font-extrabold'
              : 'text-slate-500 hover:text-slate-800 bg-transparent'
          ]"
        >
          <GraduationCap class="w-4 h-4" />
          재학생
        </button>

        <button
          type="button"
          @click="switchTab('graduate')"
          :class="[
            'flex-1 py-2.5 px-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border-none',
            activeTab === 'graduate'
              ? 'bg-white text-indigo-600 shadow-md font-extrabold'
              : 'text-slate-500 hover:text-slate-800 bg-transparent'
          ]"
        >
          <School class="w-4 h-4" />
          졸업생
        </button>

        <button
          type="button"
          @click="switchTab('teacher')"
          :class="[
            'flex-1 py-2.5 px-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border-none',
            activeTab === 'teacher'
              ? 'bg-white text-emerald-600 shadow-md font-extrabold'
              : 'text-slate-500 hover:text-slate-800 bg-transparent'
          ]"
        >
          <UserCheck class="w-4 h-4" />
          교사 / 관리자
        </button>
      </div>

      <!-- 1. 재학생 로그인 폼 -->
      <div v-if="!isSignUp && activeTab === 'student'">
        <form @submit.prevent="handleLogin" autocomplete="off" class="flex flex-col gap-4">
          <div>
            <label class="block text-xs font-bold mb-1.5 text-slate-700">학번 (5자리)</label>
            <div class="relative">
              <input
                v-model="loginStudentCode"
                type="text"
                required
                maxlength="5"
                pattern="\d{5}"
                autocomplete="off"
                placeholder="예: 30120 (5자리 학번 입력)"
                class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-800"
                style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; box-sizing: border-box;"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1.5 text-slate-700">비밀번호 또는 학생 연락처</label>
            <input
              v-model="loginPassword"
              type="password"
              required
              autocomplete="new-password"
              placeholder="비밀번호 또는 연락처(010...) 입력"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-800"
              style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; box-sizing: border-box;"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full text-sm font-bold disabled:opacity-40 hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
            style="padding: 12px; border: none; border-radius: 10px; background: #2563eb; color: white; margin-top: 4px;"
          >
            {{ loading ? '로그인 중…' : '재학생 로그인' }}
          </button>

          <div class="text-center mt-3">
            <button
              type="button"
              @click="openSignUpFor('student')"
              class="text-xs font-semibold text-slate-600 hover:text-blue-600 cursor-pointer bg-transparent border-none transition-colors"
            >
              비밀번호는 연락처를 사용하세요.
              <span class="text-blue-600 font-bold underline ml-1">연락처 수정</span>
            </button>
          </div>
        </form>
      </div>

      <!-- 2. 졸업생 로그인 폼 -->
      <div v-else-if="!isSignUp && activeTab === 'graduate'">
        <form @submit.prevent="handleLogin" autocomplete="off" class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-xs font-bold mb-1.5 text-slate-700">학번 (5자리)</label>
              <input
                v-model="loginStudentCode"
                type="text"
                required
                maxlength="5"
                pattern="\d{5}"
                autocomplete="off"
                placeholder="예: 30120"
                class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-slate-800"
                style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; box-sizing: border-box;"
              />
            </div>
            <div>
              <label class="block text-xs font-bold mb-1.5 text-slate-700">졸업 학년도</label>
              <input
                v-model.number="loginGradYear"
                type="number"
                required
                autocomplete="off"
                placeholder="예: 2026"
                class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-slate-800"
                style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; box-sizing: border-box;"
              />
            </div>
          </div>
          <p class="text-[11px] text-slate-500 mt-1 leading-normal" style="margin: 0;">
            💡 고3 재학 기간이 2025년 3월~2026년 1월이고 2026년 2월에 졸업한 경우 졸업학년도는 '2026'입니다.
          </p>

          <div>
            <label class="block text-xs font-bold mb-1.5 text-slate-700">비밀번호 또는 학생 연락처</label>
            <input
              v-model="loginPassword"
              type="password"
              required
              autocomplete="new-password"
              placeholder="비밀번호 또는 연락처(010...) 입력"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-slate-800"
              style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; box-sizing: border-box;"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full text-sm font-bold disabled:opacity-40 hover:bg-indigo-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
            style="padding: 12px; border: none; border-radius: 10px; background: #4f46e5; color: white; margin-top: 4px;"
          >
            {{ loading ? '로그인 중…' : '졸업생 로그인' }}
          </button>

          <div class="text-center mt-3">
            <button
              type="button"
              @click="openSignUpFor('graduate')"
              class="text-xs font-semibold text-slate-600 hover:text-indigo-600 cursor-pointer bg-transparent border-none transition-colors"
            >
              아직 계정이 없으신가요?
              <span class="text-indigo-600 font-bold underline ml-1">졸업생 회원가입 신청</span>
            </button>
          </div>
        </form>
      </div>

      <!-- 3. 교사 / 관리자 로그인 폼 -->
      <div v-else-if="!isSignUp && activeTab === 'teacher'">
        <form @submit.prevent="handleLogin" autocomplete="off" class="flex flex-col gap-4">
          <div>
            <label class="block text-xs font-bold mb-1.5 text-slate-700">교사 / 관리자 아이디</label>
            <input
              v-model="loginId"
              type="text"
              required
              autocomplete="off"
              placeholder="아이디 입력 (예: teacher)"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-slate-800"
              style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; box-sizing: border-box;"
            />
          </div>

          <div>
            <label class="block text-xs font-bold mb-1.5 text-slate-700">비밀번호</label>
            <input
              v-model="loginPassword"
              type="password"
              required
              autocomplete="new-password"
              placeholder="비밀번호 입력"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-slate-800"
              style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 11px 14px; box-sizing: border-box;"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full text-sm font-bold disabled:opacity-40 hover:bg-emerald-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
            style="padding: 12px; border: none; border-radius: 10px; background: #059669; color: white; margin-top: 4px;"
          >
            {{ loading ? '로그인 중…' : '교사 / 관리자 로그인' }}
          </button>
        </form>
      </div>

      <!-- 학생 회원가입 폼 -->
      <div v-else>
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
          <h2 class="text-base font-bold text-slate-900 m-0">
            {{ signupIsEnrolled ? '재학생 정보 수정' : '졸업생 회원가입 신청' }}
          </h2>
          <button
            type="button"
            @click="isSignUp = false"
            class="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border-none"
          >
            취소
          </button>
        </div>

        <form @submit.prevent="openConfirmModal" class="flex flex-col gap-3">
          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-600">학교 배포 가입코드</label>
            <input
              v-model="signupCode"
              type="text"
              required
              placeholder="학교에서 안내받은 가입코드를 입력하세요"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-800"
              style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-semibold mb-1 text-slate-600">구분</label>
              <select
                v-model="signupIsEnrolled"
                class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-800"
                style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
              >
                <option :value="true">재학생</option>
                <option :value="false">졸업생</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1 text-slate-600">학번 (5자리)</label>
              <input
                v-model="signupStudentCode"
                type="text"
                required
                placeholder="예: 30120"
                maxlength="5"
                pattern="\d{5}"
                class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-800"
                style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
              />
            </div>
          </div>

          <div v-if="!signupIsEnrolled">
            <label class="block text-xs font-semibold mb-1 text-slate-600">졸업 학년도</label>
            <input
              v-model.number="signupGradYear"
              type="number"
              required
              placeholder="예: 2026"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-800"
              style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
            />
            <p class="text-[11px] text-slate-400 mt-1 leading-normal" style="margin: 2px 0 0;">
              고3기간이 2025년 3월~2026년 1월이고, 2026년 2월에 졸업한 학생의 졸업학년도는 '2026'입니다.
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-600">이름</label>
            <input
              v-model="signupName"
              type="text"
              required
              placeholder="학생 이름 입력"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-800"
              style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-600">학생 전화번호 (로그인 비밀번호로 사용)</label>
            <input
              v-model="signupPhone"
              type="tel"
              required
              placeholder="01012345678 (- 없이 입력)"
              class="w-full text-sm focus:outline-none focus:ring-2 bg-white text-slate-800"
              :class="signupPhone.includes('-') ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:ring-blue-400'"
              style="border-radius: 8px; padding: 8px 12px; box-sizing: border-box; border-width: 1px; border-style: solid;"
            />
            <p v-if="signupPhone.includes('-')" class="text-xs text-rose-500 font-semibold mt-1" style="margin: 2px 0 0;">
              ⚠️ 하이픈('-')을 제외하고 숫자만 입력해 주세요 (예: 01012345678).
            </p>
            <p v-else class="text-xs text-slate-500 mt-1" style="margin: 2px 0 0;">* 이 전화번호가 추후 로그인 시 비밀번호가 됩니다.</p>
          </div>

          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-600">학부모 전화번호 (선택)</label>
            <input
              v-model="signupParentPhone"
              type="tel"
              placeholder="01087654321 (- 없이 입력)"
              class="w-full text-sm focus:outline-none focus:ring-2 bg-white text-slate-800 border-slate-300 focus:ring-blue-400"
              style="border-radius: 8px; padding: 8px 12px; box-sizing: border-box; border-width: 1px; border-style: solid;"
            />
          </div>

          <!-- 대입 지원 전형 선택 영역 (학교장 추천 / 농어촌 선택) -->
          <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2" style="margin-top: 6px;">
            <label class="block text-xs font-bold text-slate-800" style="margin: 0 0 4px;">
              🎯 희망 대입 지원 전형 선택
            </label>
            <div class="flex items-center gap-4 text-xs font-medium text-slate-700">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" v-model="signupApplySchoolRecommend" class="accent-blue-600 rounded cursor-pointer" />
                학교장 추천 전형
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" v-model="signupApplyRural" class="accent-emerald-600 rounded cursor-pointer" />
                농어촌 특별전형
              </label>
            </div>

            <!-- 농어촌 선택 시 펼쳐지는 자격 확인 서술 카드 -->
            <div v-if="signupApplyRural" class="p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-lg text-xs space-y-2 text-emerald-950 mt-2">
              <div class="font-bold text-emerald-800 flex items-center gap-1">
                🌾 농어촌 전형 자격 요건 안내
              </div>
              <div class="text-[11px] space-y-1 text-emerald-900 leading-relaxed bg-white/90 p-2 rounded border border-emerald-100">
                <p class="m-0 font-semibold">• 유형 I (6년): 중·고 6년 과정 이수 및 본인·부모 모두 읍·면 거주</p>
                <p class="m-0 font-semibold">• 유형 II (12년): 초·중·고 12년 과정 이수 및 본인 읍·면 거주</p>
              </div>

              <!-- 농어촌 유형 선택 -->
              <div class="space-y-1 pt-1">
                <label class="block font-bold text-emerald-900">지원 세부 유형 선택</label>
                <div class="flex gap-4">
                  <label class="flex items-center gap-1.5 cursor-pointer font-medium">
                    <input type="radio" v-model="signupRuralType" value="유형I" class="accent-emerald-600 cursor-pointer" />
                    유형 I (6년)
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer font-medium">
                    <input type="radio" v-model="signupRuralType" value="유형II" class="accent-emerald-600 cursor-pointer" />
                    유형 II (12년)
                  </label>
                </div>
              </div>

              <!-- 본인 확인 및 서약 동의 -->
              <div class="pt-1.5 border-t border-emerald-200/80">
                <label class="flex items-start gap-1.5 cursor-pointer font-bold text-emerald-900">
                  <input type="checkbox" v-model="signupRuralSelfCheck" class="accent-emerald-600 rounded mt-0.5 shrink-0 cursor-pointer" />
                  <span class="leading-normal">본인은 위 농어촌 자격 기준을 직접 확인하였으며, 조건에 해당함을 동의합니다.</span>
                </label>
              </div>
            </div>
          </div>

          <div class="p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-lg text-xs text-blue-700 space-y-1" style="margin-top: 6px;">
            <p class="font-bold flex items-center gap-1" style="margin: 0 0 2px;">
              🔒 개인정보 보호 및 보안 암호화 안내
            </p>
            <p class="leading-relaxed text-blue-600/90" style="margin: 0; font-size: 11px; line-height: 1.4;">
              가입 시 입력한 내용은 <strong>SHA-256 단방향 암호화 해시 및 AES-256 보안 알고리즘</strong>을 거쳐 저장됩니다. 원본 복호화가 불가능하므로 관리자를 포함한 그 누구도 조회하거나 알 수 없습니다.
            </p>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full text-sm font-bold disabled:opacity-40 transition-colors cursor-pointer hover:bg-blue-700"
            style="padding: 10px; border: none; border-radius: 8px; background: #2563eb; color: white; margin-top: 4px;"
          >{{ loading ? '검증 중…' : (signupIsEnrolled ? '정보 수정' : '가입 신청 완료하기') }}</button>

          <div class="text-center mt-3">
            <button
              type="button"
              @click="isSignUp = false"
              class="text-xs font-bold text-blue-600 underline hover:text-blue-700 cursor-pointer bg-transparent border-none transition-colors"
            >
              로그인하러 가기
            </button>
          </div>
        </form>
      </div>

      <!-- 가입 정보 최종 확인 팝업 모달 -->
      <div
        v-if="showConfirmModal"
        class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
        <div class="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-sm w-full space-y-4">
          <div class="text-center">
            <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-100">
              <CheckCircle class="w-6 h-6 text-blue-600" />
            </div>
            <h3 class="text-lg font-bold text-slate-900" style="margin: 0 0 4px;">가입 정보 최종 확인</h3>
            <p class="text-xs text-slate-500" style="margin: 0;">입력하신 가입 정보가 맞는지 확인해 주세요.</p>
          </div>

          <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm space-y-2.5">
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-500 font-semibold">구분</span>
              <span class="font-bold text-slate-800">
                {{ signupIsEnrolled ? '재학생' : `졸업생 (${signupGradYear}학년도)` }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-500 font-semibold">학번</span>
              <span class="font-bold text-blue-600 font-mono">
                {{ signupStudentCode }}
                <span class="text-xs font-normal text-slate-500 ml-1">
                  <template v-if="parseInt(signupStudentCode.substring(1, 3)) === 99">(테스트용 99반 {{ parseInt(signupStudentCode.substring(3, 5)) }}번)</template>
                  <template v-else>(3학년 {{ parseInt(signupStudentCode.substring(1, 3)) }}반 {{ parseInt(signupStudentCode.substring(3, 5)) }}번)</template>
                </span>
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-500 font-semibold">이름</span>
              <span class="font-bold text-slate-800">{{ signupName }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-500 font-semibold">전화번호 (로그인 비번)</span>
              <span class="font-bold text-slate-800 font-mono">{{ cleanPhoneInput }}</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-slate-200">
              <span class="text-xs text-slate-500 font-semibold">신청 희망 전형</span>
              <span class="font-bold text-slate-800 text-xs">
                <template v-if="signupApplySchoolRecommend && signupApplyRural">학교장추천 + 농어촌({{ signupRuralType }})</template>
                <template v-else-if="signupApplySchoolRecommend">학교장 추천 전형만</template>
                <template v-else-if="signupApplyRural">농어촌 특별전형만 ({{ signupRuralType }})</template>
              </span>
            </div>
          </div>

          <p class="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-center" style="margin: 0;">
            * 관리자의 가입 승인 완료 후 로그인이 가능합니다.
          </p>

          <div class="flex gap-2 pt-1">
            <button
              type="button"
              @click="showConfirmModal = false"
              class="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border-none"
            >
              수정하기
            </button>
            <button
              type="button"
              :disabled="loading"
              @click="confirmAndSignUp"
              class="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer border-none shadow-sm disabled:opacity-40"
            >
              {{ loading ? '가입 진행 중…' : '확인 및 가입 신청' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 메시지 배너 -->
      <div v-if="error" class="mt-4 p-3 rounded-lg border text-sm font-semibold text-center text-rose-600 bg-rose-50 border-rose-200">
        <p style="white-space: pre-line; margin: 0;">{{ typeof error === 'object' ? (error.message || '로그인 중 오류가 발생했습니다.') : error }}</p>
        <button
          v-if="isRejectedError"
          @click="openSignupWithCode"
          class="mt-2.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg border-none cursor-pointer transition-colors shadow-sm"
        >
          ✏️ 가입 정보 수정하여 재신청하기
        </button>
      </div>
      <p v-if="success" class="text-sm font-semibold text-center mt-4 text-emerald-600 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">{{ success }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { GraduationCap, School, UserCheck, CheckCircle } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { schoolName, fetchSchoolName } from '../utils/schoolConfig'
import { checkRuralSystemOpenStatus } from '../api/ruralApi.js'
import { checkExamIntentSystemEnabled } from '../api/examIntentApi.js'

const router = useRouter()
const auth = useAuthStore()

// 활성화된 역할 탭: 'student' (재학생), 'graduate' (졸업생), 'teacher' (교사/관리자)
const activeTab = ref('student')

const isRuralSystemEnabled = ref(localStorage.getItem('pcm_enable_rural_system') === 'true')
const isExamIntentSystemEnabled = ref(localStorage.getItem('pcm_enable_exam_intent_system') !== 'false')
const isSignUp = ref(false)
const loading = ref(false)
const error = ref(null)
const success = ref(null)
const showConfirmModal = ref(false)

const isRejectedError = ref(false)
const rejectedCode = ref('')

// 로그인 폼 입력값
const loginId = ref('')
const loginStudentCode = ref('')
const loginPassword = ref('')
const loginGradYear = ref(new Date().getFullYear())

// 학생 회원가입 입력값
const signupCode = ref('')
const signupIsEnrolled = ref(true)
const signupGradYear = ref(new Date().getFullYear())
const signupStudentCode = ref('')
const signupName = ref('')
const signupPhone = ref('')
const signupParentPhone = ref('')

// 대입 지원 전형 선택 상태
const signupApplySchoolRecommend = ref(true)
const signupApplyRural = ref(false)
const signupRuralType = ref('유형I')
const signupRuralSelfCheck = ref(false)

const cleanPhoneInput = computed(() => {
  return signupPhone.value.replace(/\D/g, '')
})

onMounted(async () => {
  fetchSchoolName()
  loginId.value = ''
  loginStudentCode.value = ''
  loginPassword.value = ''
  try {
    const status = await checkRuralSystemOpenStatus()
    isRuralSystemEnabled.value = status.isEnabled === true
  } catch (e) {}
  try {
    isExamIntentSystemEnabled.value = await checkExamIntentSystemEnabled()
  } catch (e) {}
})

function switchTab(tab) {
  activeTab.value = tab
  error.value = null
  success.value = null
  isRejectedError.value = false
  loginId.value = ''
  loginStudentCode.value = ''
  loginPassword.value = ''
}

function openSignUpFor(type) {
  if (type === 'graduate') {
    signupIsEnrolled.value = false
  } else {
    signupIsEnrolled.value = true
  }
  isSignUp.value = true
  error.value = null
  success.value = null
}

async function handleLogin() {
  error.value = null
  success.value = null
  isRejectedError.value = false
  rejectedCode.value = ''
  loading.value = true

  try {
    if (activeTab.value === 'teacher') {
      const id = loginId.value.trim()
      const pw = loginPassword.value
      if (!id) throw new Error('아이디를 입력해 주세요.')
      if (!pw) throw new Error('비밀번호를 입력해 주세요.')

      if (id === 'admin') {
        await auth.loginAdmin(id, pw)
      } else {
        await auth.loginTeacher(id, pw)
      }
    } else if (activeTab.value === 'graduate') {
      const code = loginStudentCode.value.trim()
      const pw = loginPassword.value
      if (!/^\d{5}$/.test(code)) {
        throw new Error('학번은 5자리 숫자여야 합니다 (예: 30120).')
      }
      if (!loginGradYear.value) {
        throw new Error('졸업 학년도를 입력해 주세요.')
      }
      const finalCode = `${loginGradYear.value}${code}`
      await auth.loginStudent(finalCode, pw, false)
    } else {
      // 재학생 (student)
      const code = loginStudentCode.value.trim()
      const pw = loginPassword.value
      if (!/^\d{5}$/.test(code)) {
        throw new Error('학번은 5자리 숫자여야 합니다 (예: 30120).')
      }
      await auth.loginStudent(code, pw, true)
    }
    router.push('/select-system')
  } catch (e) {
    error.value = e.message || '로그인에 실패했습니다.'
    if (e.isRejected) {
      isRejectedError.value = true
      rejectedCode.value = e.studentCode || loginStudentCode.value
    }
  } finally {
    loading.value = false
  }
}

function openSignupWithCode() {
  if (rejectedCode.value) {
    signupStudentCode.value = rejectedCode.value
    signupIsEnrolled.value = activeTab.value === 'student'
  }
  isSignUp.value = true
  error.value = null
  isRejectedError.value = false
}

// 1단계: 사전 입력 검증 후 최종 확인 모달 띄우기
function openConfirmModal() {
  error.value = null
  success.value = null

  if (signupPhone.value.includes('-')) {
    error.value = "전화번호에 하이픈('-')을 제외하고 숫자만 입력해 주세요 (예: 01012345678)."
    return
  }

  const cleanPhone = cleanPhoneInput.value
  if (!cleanPhone || cleanPhone.length < 10 || !cleanPhone.startsWith('010')) {
    error.value = '전화번호는 010으로 시작하는 10~11자리 숫자여야 합니다 (예: 01012345678).'
    return
  }

  if (!signupCode.value) {
    error.value = '가입코드를 입력해 주세요.'
    return
  }

  if (!/^\d{5}$/.test(signupStudentCode.value)) {
    error.value = '학번은 5자리 숫자여야 합니다 (예: 30120).'
    return
  }

  if (!signupName.value) {
    error.value = '이름을 입력해 주세요.'
    return
  }

  if (!signupApplySchoolRecommend.value && !signupApplyRural.value) {
    error.value = '학교장 추천 전형 또는 농어촌 특별전형 중 최소 1개 이상을 선택해 주세요.'
    return
  }

  if (signupApplyRural.value && !signupRuralSelfCheck.value) {
    error.value = '농어촌 특별전형 지원 자격 요건 직접 확인 동의에 체크해 주세요.'
    return
  }

  showConfirmModal.value = true
}

// 2단계: 모달에서 '확인 및 가입 신청' 클릭 시 실제 가입 수행
async function confirmAndSignUp() {
  loading.value = true
  error.value = null

  try {
    const res = await auth.signUpStudent({
      studentCode: signupStudentCode.value,
      name: signupName.value,
      phone: cleanPhoneInput.value,
      parentPhone: signupParentPhone.value,
      isEnrolled: signupIsEnrolled.value,
      gradYear: signupIsEnrolled.value ? null : signupGradYear.value,
      registrationCode: signupCode.value,
      applySchoolRecommend: signupApplySchoolRecommend.value,
      applyRural: signupApplyRural.value,
      ruralType: signupRuralType.value,
      ruralSelfCheck: signupRuralSelfCheck.value
    })
    
    showConfirmModal.value = false
    isSignUp.value = false
    activeTab.value = signupIsEnrolled.value ? 'student' : 'graduate'
    loginStudentCode.value = signupStudentCode.value
    loginPassword.value = cleanPhoneInput.value
    
    if (res?.isAutoApproved) {
      success.value = '기존 학생 명단과 확인되어 승인 처리되었습니다! 입력하신 전화번호로 로그인해 주세요.'
    } else {
      success.value = '회원가입 신청이 완료되었습니다! 관리자의 승인 후 로그인이 가능합니다.'
    }
    
    signupCode.value = ''
    signupStudentCode.value = ''
    signupName.value = ''
    signupPhone.value = ''
    signupParentPhone.value = ''
    signupApplySchoolRecommend.value = true
    signupApplyRural.value = false
    signupRuralType.value = '유형I'
    signupRuralSelfCheck.value = false
  } catch (e) {
    showConfirmModal.value = false
    error.value = e.message || '회원가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>
