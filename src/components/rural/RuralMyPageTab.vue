<template>
  <div class="space-y-6">
    <!-- 헤더 카드 -->
    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
      <div class="flex items-center gap-2">
        <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 font-bold">
          👤
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-900 m-0">학생 마이페이지</h2>
          <p class="text-xs text-slate-500 m-0">희망 대입 전형을 직접 설정하고 농어촌 전형 자격 확인 서약을 작성 관리합니다.</p>
        </div>
      </div>
    </div>

    <!-- 로딩 스켈레톤 카드 (DB 조회 완료 전 깜빡임 방지) -->
    <div v-if="loadingInfo" class="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-3 animate-pulse">
      <div class="w-8 h-8 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
        ⏳
      </div>
      <p class="text-xs font-bold text-slate-600 m-0">학생 마이페이지 대입 지원 전형 설정을 확인하는 중입니다…</p>
    </div>

    <template v-else>
      <!-- 1) 🎯 희망 대입 지원 전형 설정 / 변경 카드 -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
            🎯 희망 대입 지원 전형 설정 / 변경
          </h3>
          <button
            @click="savePreferences"
            :disabled="savingPref"
            class="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer border-none shadow-xs disabled:opacity-50"
          >
            {{ savingPref ? '저장 중…' : '전형 설정 저장하기' }}
          </button>
        </div>

        <p class="text-xs text-slate-600 leading-relaxed m-0">
          본인이 지원하고자 하는 대입 전형을 선택해 주세요. 농어촌 특별전형에 체크하시면 아래에 자격 검증 및 안내 서약 카드가 표시됩니다.
        </p>

        <div class="flex flex-wrap items-center gap-6 pt-1 text-sm font-semibold text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label class="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" v-model="prefApplySchoolRecommend" class="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
            학교장 추천 전형 지원
          </label>
          <label class="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" v-model="prefApplyRural" class="w-4 h-4 accent-emerald-600 rounded cursor-pointer" />
            농어촌 특별전형 지원
          </label>
        </div>

        <p v-if="prefMsg" class="text-xs font-bold text-emerald-600 m-0 pt-1">{{ prefMsg }}</p>
      </div>

    <!-- 2) 🌾 농어촌 특별전형 자격 검증 & 서약 카드 (농어촌 체크 시에만 표시!) -->
    <div
      v-if="prefApplyRural"
      :class="[
        'p-6 rounded-2xl border shadow-xs transition-all space-y-4',
        isEligible
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : 'bg-rose-50/70 border-rose-200 text-rose-950'
      ]"
    >
      <div class="flex items-start justify-between gap-3 border-b border-slate-200/60 pb-3">
        <div class="flex items-center gap-2.5">
          <CheckCircle2 v-if="isEligible" class="w-6 h-6 text-emerald-600 shrink-0" />
          <AlertTriangle v-else class="w-6 h-6 text-rose-600 shrink-0" />
          <div>
            <h3 class="text-base font-bold m-0 flex items-center gap-2">
              {{ isEligible ? '농어촌 특별전형 자격 자동 검증: 적격 (지원 가능)' : '⚠️ 농어촌 특별전형 자격 유의 사항 (주의)' }}
            </h3>
            <p class="text-xs opacity-90 m-0 mt-0.5">
              {{ evalReport || '인적사항(주소) 및 학적 이력을 기반으로 산출된 자격 판정 결과입니다.' }}
            </p>
          </div>
        </div>
        <span
          :class="[
            'px-3 py-1 rounded-full text-xs font-bold shrink-0',
            isEligible ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-900'
          ]"
        >
          {{ prefRuralType === '유형II' ? '유형 II (12년)' : '유형 I (6년)' }}
        </span>
      </div>

      <!-- 자격 서약 및 세부 유형 선택 -->
      <div class="space-y-3 bg-white/80 p-4 rounded-xl border border-slate-200/80 text-xs">
        <div class="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
          🌾 농어촌 전형 자격 요건 안내 & 서약
        </div>
        <div class="text-xs space-y-1 text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p class="m-0 font-semibold">• 유형 I (6년): 중·고등학교 6년 과정 이수 및 본인·부모 모두 읍·면 거주</p>
          <p class="m-0 font-semibold">• 유형 II (12년): 초·중·고등학교 12년 과정 이수 및 본인 읍·면 거주</p>
        </div>

        <div class="flex items-center gap-4 pt-1">
          <span class="font-bold text-slate-900">지원 세부 유형 선택:</span>
          <label class="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
            <input type="radio" v-model="prefRuralType" value="유형I" class="accent-emerald-600 cursor-pointer" />
            유형 I (6년)
          </label>
          <label class="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
            <input type="radio" v-model="prefRuralType" value="유형II" class="accent-emerald-600 cursor-pointer" />
            유형 II (12년)
          </label>
        </div>

        <div class="pt-2 border-t border-slate-200">
          <label class="flex items-start gap-2 cursor-pointer font-bold text-emerald-900">
            <input type="checkbox" v-model="prefRuralSelfCheck" class="w-4 h-4 accent-emerald-600 rounded mt-0.5 shrink-0 cursor-pointer" />
            <span class="leading-normal">본인은 위 농어촌 자격 기준을 직접 확인하였으며, 조건에 해당함을 동의합니다.</span>
          </label>
        </div>

        <div v-if="!isEligible" class="pt-2 border-t border-rose-200 flex items-center gap-2">
          <input
            id="warningAckMyPage"
            v-model="warningAcknowledged"
            type="checkbox"
            class="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
          />
          <label for="warningAckMyPage" class="text-xs font-bold text-rose-800 cursor-pointer">
            자격 유의 사항을 확인하였으며, 소명 및 신청 작성을 계속 진행합니다.
          </label>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../utils/supabaseClient';
import { getRuralEligibilityList, updateStudentApplicationPreference } from '../../api/ruralApi';
import { CheckCircle2, AlertTriangle } from 'lucide-vue-next';

const router = useRouter();
const auth = useAuthStore();
const currentStudentDbId = ref(null);
const initialApplyRural = ref(null);

const prefApplySchoolRecommend = ref(true);
const prefApplyRural = ref(true);
const prefRuralType = ref('유형I');
const prefRuralSelfCheck = ref(false);
const loadingInfo = ref(true);
const savingPref = ref(false);
const prefMsg = ref('');

const isEligible = ref(false);
const evalReport = ref('');
const warningAcknowledged = ref(false);

onMounted(async () => {
  await loadMyInfo();
});

async function resolveStudentId() {
  if (currentStudentDbId.value) return currentStudentDbId.value;
  if (auth.userId) return auth.userId;
  if (auth.user?.id) return auth.user.id;

  if (supabase) {
    try {
      const { data: userAuth } = await supabase.auth.getUser();
      if (userAuth?.user?.id) return userAuth.user.id;
    } catch (e) {
      // ignore
    }
  }

  if (auth.studentCode && supabase) {
    try {
      const { data: s } = await supabase
        .from('enrolled_students')
        .select('id')
        .eq('student_code', auth.studentCode)
        .maybeSingle();
      if (s?.id) return s.id;
    } catch (e) {
      // ignore
    }
  }
  return null;
}

async function loadMyInfo() {
  loadingInfo.value = true;
  try {
    const studentId = await resolveStudentId();
    if (studentId) {
      currentStudentDbId.value = studentId;
      const eligibilityList = await getRuralEligibilityList();
      const myInfo = eligibilityList.find(s =>
        s.id === studentId ||
        s.user_id === studentId ||
        (auth.studentCode && String(s.student_code).trim() === String(auth.studentCode).trim())
      );

      if (myInfo) {
        currentStudentDbId.value = myInfo.id || studentId;
        prefApplySchoolRecommend.value = myInfo.apply_school_recommend !== false;
        
        const loadedApplyRural = myInfo.apply_rural !== undefined && myInfo.apply_rural !== null
          ? Boolean(myInfo.apply_rural)
          : true;
        
        prefApplyRural.value = loadedApplyRural;
        if (initialApplyRural.value === null) {
          initialApplyRural.value = loadedApplyRural;
        }

        prefRuralType.value = myInfo.rural_type || '유형I';
        prefRuralSelfCheck.value = Boolean(myInfo.rural_self_check);
        warningAcknowledged.value = Boolean(myInfo.rural_self_check);

        const elig = myInfo.eligibility;
        isEligible.value = Boolean(elig?.is_eligible || elig?.is_manual_approved);
        evalReport.value = elig?.evaluation_notes || '';
      } else {
        isEligible.value = false;
        evalReport.value = '학생 자격 정보 미등록 또는 미확인 상태입니다.';
      }
    }
  } catch (e) {
    console.error('Failed to load MyPage data:', e);
  } finally {
    loadingInfo.value = false;
  }
}

async function savePreferences() {
  savingPref.value = true;
  prefMsg.value = '';
  try {
    const studentId = await resolveStudentId();
    if (!studentId) throw new Error('학생 식별 ID를 찾을 수 없습니다. 다시 로그인해 주세요.');

    if (!prefApplySchoolRecommend.value && !prefApplyRural.value) {
      throw new Error('학교장 추천 전형 또는 농어촌 특별전형 중 최소 1개 이상을 선택해야 합니다.');
    }
    if (prefApplyRural.value) {
      if (!prefRuralSelfCheck.value) {
        throw new Error('농어촌 특별전형 선택 시 [자격 요건 직접 확인 동의]에 체크해 주세요.');
      }
      if (!warningAcknowledged.value) {
        throw new Error('농어촌 특별전형 선택 시 하단의 [자격 유의 사항 확인 동의]에도 동의(체크)해 주세요.');
      }
    }

    await updateStudentApplicationPreference(studentId, {
      applySchoolRecommend: prefApplySchoolRecommend.value,
      applyRural: prefApplyRural.value,
      ruralType: prefRuralType.value,
      ruralSelfCheck: prefRuralSelfCheck.value
    }, auth.studentCode);

    currentStudentDbId.value = studentId;

    if (initialApplyRural.value === true && prefApplyRural.value === false) {
      alert('농어촌 특별전형 지원이 취소되었습니다.\n권한 변경 적용을 위해 시스템에서 로그아웃됩니다.');
      await auth.logout();
      router.push('/login');
      return;
    }

    prefMsg.value = '✓ 희망 전형 지원 설정이 성공적으로 저장되었습니다.';
    await loadMyInfo();
  } catch (e) {
    alert(e.message || '전형 설정 저장 중 오류가 발생했습니다.');
  } finally {
    savingPref.value = false;
  }
}
</script>
