<template>
  <div class="space-y-6">
    <!-- 농어촌 특별전형 미체크 학생 안내 배너 -->
    <div
      v-if="!prefApplyRural"
      class="p-5 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 space-y-2"
    >
      <div class="flex items-center gap-2 font-bold text-sm">
        <span>⚠️ 농어촌 특별전형 희망 지원 미선택 안내</span>
      </div>
      <p class="text-xs text-amber-800 leading-relaxed m-0">
        현재 대입 지원 전형 설정에서 <strong>[농어촌 특별전형 지원]</strong>이 체크되어 있지 않습니다.<br />
        농어촌 특별전형 희망 지망을 작성하여 제출하시려면 <strong>[마이페이지]</strong> 메뉴로 이동하여 농어촌 전형 지원을 체크하고 자격 확인 서약을 완료해 주세요.
      </p>
    </div>

    <!-- 학추 스타일 2컬럼 레이아웃: 좌측(신청 내역 2col) / 우측(신청 폼 1col) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- [좌측 2컬럼]: 내 농어촌 전형 희망 신청 내역 -->
      <section class="lg:col-span-2 space-y-6">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 relative">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
                <span class="w-1.5 h-4 bg-emerald-600 rounded-full"></span>
                나의 농어촌 전형 추천 희망 신청 내역
              </h3>
              <p class="text-xs text-slate-500 m-0 mt-1">
                우측 신청 폼에서 지원할 농어촌 대학 및 전형을 선택하여 추가할 수 있습니다.
              </p>
            </div>

            <!-- 서명 상태 및 버튼 -->
            <div class="flex items-center gap-2 shrink-0">
              <button
                @click="openSignatureModal"
                class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl cursor-pointer transition-colors"
              >
                <PenTool class="w-4 h-4 text-slate-600" />
                서명 등록
                <span v-if="studentSig && parentSig" class="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.5 rounded">완료</span>
              </button>

              <button
                v-if="myApplications.length > 0"
                @click="triggerPrintConfirmation"
                class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer border-none"
              >
                <Printer class="w-4 h-4" />
                신청서 인쇄
              </button>
            </div>
          </div>

          <!-- 신청 내역이 없는 경우 -->
          <div v-if="myApplications.length === 0" class="py-16 text-center text-slate-400 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 space-y-2">
            <FileSpreadsheet class="mx-auto h-10 w-10 text-slate-300" />
            <p class="text-sm font-semibold text-slate-600 m-0">등록된 농어촌 희망 지망 신청이 없습니다.</p>
            <p class="text-xs text-slate-400 m-0">우측 폼을 작성하고 <strong>[+ 농어촌 희망 지망 추가]</strong> 버튼을 눌러 신청을 등록해 주세요.</p>
          </div>

          <!-- 신청한 지망 카드리스트 -->
          <div v-else class="space-y-3">
            <div
              v-for="(app, idx) in myApplications"
              :key="idx"
              class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2"
            >
              <div class="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {{ idx + 1 }}
                  </span>
                  <span class="font-bold text-slate-900 text-sm">{{ app.univ_name }}</span>
                  <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {{ app.department }}
                  </span>
                  <span v-if="app.medical_type !== '없음'" class="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                    {{ app.medical_type }}대
                  </span>
                  <span class="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {{ app.term_type || '수시' }}
                  </span>
                </div>

                <button
                  @click="removeApplication(idx)"
                  class="text-xs text-rose-600 hover:text-rose-800 font-bold bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Trash2 class="w-3.5 h-3.5" /> 삭제
                </button>
              </div>

              <!-- 세부 정보 -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <div>
                  <span class="text-slate-400 font-bold block">전형명:</span>
                  <span class="font-semibold text-slate-800">{{ app.track_name }}</span>
                </div>
                <div>
                  <span class="text-slate-400 font-bold block">모집인원:</span>
                  <span class="font-bold text-indigo-700">{{ app.recruitment_quota || '-' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 font-bold block">수능최저:</span>
                  <span class="text-slate-700 truncate block" :title="app.suneung_minimum">{{ app.suneung_minimum || '-' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 font-bold block">전형방법:</span>
                  <span class="text-slate-700 truncate block" :title="app.eval_method">{{ app.eval_method || '-' }}</span>
                </div>
              </div>

              <div v-if="app.remarks" class="text-xs text-amber-800 bg-amber-50/80 p-2 rounded-lg border border-amber-100">
                <span class="font-bold">비고 (기회균형):</span> {{ app.remarks }}
              </div>
            </div>
          </div>

          <!-- 하단 저장 안내 & 인쇄 정보 -->
          <div v-if="myApplications.length > 0" class="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500">총 {{ myApplications.length }}개 농어촌 지망 등록됨</span>
            <button
              @click="saveAllApplications(false)"
              :disabled="saving"
              class="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer border-none shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save class="w-4 h-4" />
              {{ saving ? '저장 중…' : '농어촌 지망 신청서 저장' }}
            </button>
          </div>
        </div>
      </section>

      <!-- [우측 1컬럼]: ➕ 농어촌 전형 희망 지망 신청 등록 폼 -->
      <section class="lg:col-span-1 space-y-6">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
              <Plus class="w-5 h-5 text-emerald-600" />
              농어촌 희망 지망 추가
            </h3>
            <p class="text-xs text-slate-500 m-0 mt-1">
              대학 및 전형을 선택한 후 하단 버튼을 눌러 신청 목록에 추가하세요.
            </p>
          </div>

          <!-- 폼 요소 -->
          <div class="space-y-3 text-xs">
            <!-- 1. 구분 -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">구분</label>
              <select v-model="formInput.term_type" @change="onFormTermTypeChange" class="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900">
                <option value="수시">수시</option>
                <option value="정시">정시</option>
              </select>
            </div>

            <!-- 3. 지원 대학 -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">지원 대학 선택 <span class="text-rose-500">*</span></label>
              <select v-model="formInput.univ_name" @change="onFormUnivChange" class="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900">
                <option value="">-- 대학 선택 --</option>
                <option v-for="u in availableFormUnivs" :key="u.value" :value="u.value">
                  {{ u.label }}
                </option>
              </select>
            </div>

            <!-- 4. 학과 입력 -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">학과(부) 직접 입력 <span class="text-rose-500">*</span></label>
              <input
                v-model="formInput.department"
                type="text"
                placeholder="예: 의예과, 컴퓨터공학과"
                class="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p v-if="detectedMedical !== '없음'" class="text-[11px] font-extrabold text-rose-600 mt-1 flex items-center gap-1">
                🏥 메디컬 계열 자동 인식: {{ detectedMedicalLabel }}
              </p>
            </div>

            <!-- 5. 전형 유형 -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">전형 유형</label>
              <select v-model="formInput.track_type" @change="onFormTrackTypeChange" class="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900">
                <option value="">-- 유형 선택 --</option>
                <option v-for="tType in availableFormTrackTypes" :key="tType" :value="tType">
                  {{ tType }}
                </option>
              </select>
            </div>

            <!-- 6. 전형명 -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">전형명 선택 <span class="text-rose-500">*</span></label>
              <select v-model="formInput.track_name" @change="onFormTrackNameChange" class="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900">
                <option value="">-- 전형명 선택 --</option>
                <option v-for="t in availableFormTrackNames" :key="t.id" :value="t.track_name">
                  {{ t.track_name }}
                </option>
              </select>
            </div>

            <!-- 요강 자동 미리보기 카드 -->
            <div v-if="formInput.track_name" class="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs space-y-1 text-slate-700">
              <div class="flex justify-between font-bold text-emerald-900 border-b border-emerald-200/60 pb-1">
                <span>모집인원:</span>
                <span class="text-indigo-700">{{ formInput.recruitment_quota || '-' }}</span>
              </div>
              <div class="pt-1"><span class="font-bold">수능최저:</span> {{ formInput.suneung_minimum || '-' }}</div>
              <div><span class="font-bold">전형방법:</span> {{ formInput.eval_method || '-' }}</div>
              <div v-if="formInput.remarks"><span class="font-bold text-amber-800">비고:</span> {{ formInput.remarks }}</div>
            </div>

            <button
              @click="addApplicationFromForm"
              :disabled="!prefApplyRural"
              :title="!prefApplyRural ? '마이페이지에서 농어촌 특별전형 지원을 체크해야 추가가 가능합니다.' : ''"
              class="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer border-none shadow-xs flex items-center justify-center gap-1.5"
            >
              <Plus class="w-4 h-4" />
              농어촌 희망 지망 목록에 추가
            </button>
          </div>
        </div>
      </section>

    </div>

    <!-- 서명 팝업 모달 -->
    <div v-if="showSigModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2 m-0">
          <PenTool class="w-5 h-5 text-emerald-600" />
          학생 및 학부모 서명 등록
        </h3>
        <p class="text-xs text-slate-500 m-0">
          아래 서명란에 마우스 또는 터치로 서명을 입력하세요. 인쇄물 하단에 포함됩니다.
        </p>

        <!-- 학생 서명 캔버스 -->
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>1. 지원 학생 서명</span>
            <button @click="clearStudentSig" class="text-slate-400 hover:text-slate-600 text-[11px]">서명 지우기</button>
          </div>
          <canvas
            ref="studentCanvasRef"
            width="420"
            height="100"
            class="w-full border border-slate-300 rounded-lg bg-slate-50 touch-none cursor-crosshair"
            @mousedown="startDrawing($event, 'student')"
            @mousemove="draw($event, 'student')"
            @mouseup="stopDrawing('student')"
            @mouseleave="stopDrawing('student')"
            @touchstart.prevent="startDrawingTouch($event, 'student')"
            @touchmove.prevent="drawTouch($event, 'student')"
            @touchend="stopDrawing('student')"
          ></canvas>
        </div>

        <!-- 학부모 서명 캔버스 -->
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>2. 학부모(보호자) 서명</span>
            <button @click="clearParentSig" class="text-slate-400 hover:text-slate-600 text-[11px]">서명 지우기</button>
          </div>
          <canvas
            ref="parentCanvasRef"
            width="420"
            height="100"
            class="w-full border border-slate-300 rounded-lg bg-slate-50 touch-none cursor-crosshair"
            @mousedown="startDrawing($event, 'parent')"
            @mousemove="draw($event, 'parent')"
            @mouseup="stopDrawing('parent')"
            @mouseleave="stopDrawing('parent')"
            @touchstart.prevent="startDrawingTouch($event, 'parent')"
            @touchmove.prevent="drawTouch($event, 'parent')"
            @touchend="stopDrawing('parent')"
          ></canvas>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            @click="showSigModal = false"
            class="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer border-none"
          >
            취소
          </button>
          <button
            @click="confirmSignatures"
            class="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer border-none"
          >
            서명 저장 완료
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import {
  FileSpreadsheet,
  PenTool,
  Save,
  Printer,
  Plus,
  Trash2
} from 'lucide-vue-next';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../utils/supabaseClient';
import {
  getRuralTracks,
  getStudentRuralApplications,
  saveStudentRuralApplications,
  getRuralEligibilityList
} from '../../api/ruralApi';
import { dialog } from '../common/dialog';
import { printRuralConfirmationDocument } from '../../utils/ruralPrintHelper';

const auth = useAuthStore();
const saving = ref(false);

const isEligible = ref(false);
const evalReport = ref('');
const warningAcknowledged = ref(false);

const currentStudentDbId = ref(null);
const prefApplySchoolRecommend = ref(true);
const prefApplyRural = ref(true);
const prefRuralType = ref('유형I');
const prefRuralSelfCheck = ref(false);

const allTracks = ref([]);
const myApplications = ref([]);

const formInput = ref({
  term_type: '수시',
  medical_type: '없음',
  univ_name: '',
  department: '',
  track_type: '',
  track_name: '',
  recruitment_quota: '',
  eval_method: '',
  suneung_minimum: '',
  remarks: '',
  region: ''
});

const studentSig = ref(null);
const parentSig = ref(null);
const showSigModal = ref(false);

const studentCanvasRef = ref(null);
const parentCanvasRef = ref(null);
const isDrawingStudent = ref(false);
const isDrawingParent = ref(false);

onMounted(async () => {
  await loadEligibilityAndTracks();
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

async function loadEligibilityAndTracks() {
  try {
    allTracks.value = await getRuralTracks();

    const studentId = await resolveStudentId();
    if (studentId) {
      const eligibilityList = await getRuralEligibilityList();
      const sCode = auth.studentCode ? String(auth.studentCode).trim() : null;

      const myInfo = eligibilityList.find(s =>
        s.id === studentId ||
        s.user_id === studentId ||
        (sCode && s.student_code && String(s.student_code).trim() === sCode)
      );

      if (myInfo) {
        currentStudentDbId.value = myInfo.id || studentId;
        prefApplySchoolRecommend.value = myInfo.apply_school_recommend !== false;
        prefApplyRural.value = myInfo.apply_rural !== undefined && myInfo.apply_rural !== null
          ? Boolean(myInfo.apply_rural)
          : true;
        prefRuralType.value = myInfo.rural_type || '유형I';
        prefRuralSelfCheck.value = Boolean(myInfo.rural_self_check);

        const elig = myInfo.eligibility;
        isEligible.value = Boolean(elig?.is_eligible || elig?.is_manual_approved);
        evalReport.value = elig?.evaluation_notes || '';
      } else {
        isEligible.value = false;
        evalReport.value = '학생 자격 정보 미등록 또는 미확인 상태입니다.';
      }

      // 내 기존 지망 신청 내역 로드
      const fetchId = currentStudentDbId.value || studentId;
      const savedApps = await getStudentRuralApplications(fetchId);
      if (savedApps && savedApps.length > 0) {
        myApplications.value = savedApps.map(sa => ({
          ...sa,
          term_type: sa.term_type || '수시',
          medical_type: sa.medical_type || '없음'
        }));

        if (savedApps[0].student_signature) studentSig.value = savedApps[0].student_signature;
        if (savedApps[0].parent_signature) parentSig.value = savedApps[0].parent_signature;
        if (savedApps[0].is_warning_acknowledged) warningAcknowledged.value = true;
      }
    }
  } catch (e) {
    console.error('Failed to load student rural apply data:', e);
  }
}

// 메디컬 자동 감지 헬퍼
function detectMedicalType(deptName) {
  if (!deptName) return '없음';
  const name = String(deptName).trim().replaceAll(' ', '');

  // 치대: 치대, 치의예, 치의예과, 치의학, 치의학과, 치의학전문대학원
  if (/치대|치의예|치의학|치의학과|치의학전문대학원/.test(name)) {
    return '치';
  }
  // 의대: 의예, 의예과, 의학, 의학과, 의대, 의학전문대학원 (단, 치의, 한의, 수의 제외)
  if (/의예|의학|의대|의학전문대학원/.test(name) && !/한의|수의|치의/.test(name)) {
    return '의';
  }
  // 한의대: 한의, 한의예, 한의예과
  if (/한의/.test(name)) {
    return '한';
  }
  // 약대: 약대, 약학, 약학과
  if (/약대|약학/.test(name)) {
    return '약';
  }
  // 수의대: 수의, 수의예, 수의예과, 수의학, 수의학과
  if (/수의/.test(name)) {
    return '수';
  }

  return '없음';
}

const medicalDisplayNames = {
  '의': '의예(학)과',
  '치': '치의예(학)과',
  '한': '한의예(학)과',
  '약': '약학과',
  '수': '수의예(학)과'
};

const detectedMedical = computed(() => {
  return detectMedicalType(formInput.value.department);
});

const detectedMedicalLabel = computed(() => {
  return medicalDisplayNames[detectedMedical.value] || '';
});

// 폼 드롭다운 필터링 헬퍼
const availableFormUnivs = computed(() => {
  if (!allTracks.value || allTracks.value.length === 0) return [];
  const targetTerm = (formInput.value.term_type || '수시').trim();

  const filtered = allTracks.value.filter(t => {
    if (!t.univ_name) return false;
    if (t.term_type && String(t.term_type).trim() !== targetTerm) return false;
    return true;
  });
  
  const baseList = filtered.length > 0 ? filtered : allTracks.value;
  
  const uniqueUnivsMap = new Map();
  baseList.forEach(t => {
    const uName = String(t.univ_name).trim();
    if (uName && !uniqueUnivsMap.has(uName)) {
      uniqueUnivsMap.set(uName, {
        univ_name: uName,
        region: String(t.region || '').trim()
      });
    }
  });

  const REGION_PRIORITY = { '서울': 1, '경기': 2, '인천': 3 };
  
  const sorted = Array.from(uniqueUnivsMap.values()).sort((a, b) => {
    const prioA = REGION_PRIORITY[a.region] ?? 999;
    const prioB = REGION_PRIORITY[b.region] ?? 999;
    
    if (prioA !== prioB) return prioA - prioB;
    if (a.region !== b.region) return a.region.localeCompare(b.region, 'ko');
    return a.univ_name.localeCompare(b.univ_name, 'ko');
  });

  return sorted.map(u => ({
    value: u.univ_name,
    label: u.region ? `(${u.region}) ${u.univ_name}` : u.univ_name
  }));
});

const availableFormTrackTypes = computed(() => {
  if (!formInput.value.univ_name) return [];
  const targetUniv = formInput.value.univ_name.trim();
  const targetTerm = (formInput.value.term_type || '수시').trim();
  const med = detectedMedical.value;

  const tracksForUniv = allTracks.value.filter(t =>
    t.univ_name && String(t.univ_name).trim() === targetUniv &&
    (!t.term_type || String(t.term_type).trim() === targetTerm)
  );

  let filtered = tracksForUniv;
  if (med !== '없음') {
    const medTracks = tracksForUniv.filter(t => t.medical_type === med);
    if (medTracks.length > 0) {
      filtered = medTracks;
    }
  } else {
    const genTracks = tracksForUniv.filter(t => !t.medical_type || t.medical_type === '없음');
    if (genTracks.length > 0) {
      filtered = genTracks;
    }
  }

  return Array.from(new Set(filtered.map(t => t.track_type).filter(Boolean)));
});

const availableFormTrackNames = computed(() => {
  if (!formInput.value.univ_name) return [];
  const targetUniv = formInput.value.univ_name.trim();
  const targetTerm = (formInput.value.term_type || '수시').trim();
  const targetType = formInput.value.track_type ? formInput.value.track_type.trim() : '';
  const med = detectedMedical.value;

  const tracksForUniv = allTracks.value.filter(t =>
    t.univ_name && String(t.univ_name).trim() === targetUniv &&
    (!t.term_type || String(t.term_type).trim() === targetTerm)
  );

  let filtered = tracksForUniv;
  if (med !== '없음') {
    const medTracks = tracksForUniv.filter(t => t.medical_type === med);
    if (medTracks.length > 0) filtered = medTracks;
  } else {
    const genTracks = tracksForUniv.filter(t => !t.medical_type || t.medical_type === '없음');
    if (genTracks.length > 0) filtered = genTracks;
  }

  if (targetType) {
    filtered = filtered.filter(t => t.track_type && String(t.track_type).trim() === targetType);
  }

  return filtered;
});

// 대학, 학과, 구분 변경 시 자동 전형 연동
watch([() => formInput.value.univ_name, () => formInput.value.department, () => formInput.value.term_type], () => {
  const validTypes = availableFormTrackTypes.value;
  if (validTypes.length === 1) {
    formInput.value.track_type = validTypes[0];
  } else if (validTypes.length > 0 && !validTypes.includes(formInput.value.track_type)) {
    formInput.value.track_type = validTypes[0];
  }
  
  const validTracks = availableFormTrackNames.value;
  if (validTracks.length === 1) {
    formInput.value.track_name = validTracks[0].track_name;
    onFormTrackNameChange();
  }
});

function onFormTermTypeChange() {
  formInput.value.univ_name = '';
  onFormUnivChange();
}

function onFormUnivChange() {
  formInput.value.track_type = '';
  formInput.value.track_name = '';
  formInput.value.recruitment_quota = '';
  formInput.value.eval_method = '';
  formInput.value.suneung_minimum = '';
  formInput.value.remarks = '';
}

function onFormTrackTypeChange() {
  formInput.value.track_name = '';
}

function onFormTrackNameChange() {
  const targetUniv = formInput.value.univ_name.trim();
  const targetTrack = formInput.value.track_name.trim();
  const targetTerm = (formInput.value.term_type || '수시').trim();
  const med = detectedMedical.value;

  const match = allTracks.value.find(t =>
    t.univ_name && String(t.univ_name).trim() === targetUniv &&
    t.track_name && String(t.track_name).trim() === targetTrack &&
    (!t.term_type || String(t.term_type).trim() === targetTerm) &&
    (med !== '없음' ? t.medical_type === med : (!t.medical_type || t.medical_type === '없음'))
  ) || allTracks.value.find(t =>
    t.univ_name && String(t.univ_name).trim() === targetUniv &&
    t.track_name && String(t.track_name).trim() === targetTrack
  );

  if (match) {
    formInput.value.track_type = match.track_type || '';
    formInput.value.recruitment_quota = match.recruitment_quota || '';
    formInput.value.eval_method = match.eval_method || '';
    formInput.value.suneung_minimum = match.suneung_minimum || '';
    formInput.value.remarks = match.remarks || '';
    formInput.value.region = match.region || '';
  }
}

async function addApplicationFromForm() {
  if (!formInput.value.univ_name || !formInput.value.department || !formInput.value.track_name) {
    await dialog.alert({
      title: '입력 확인',
      message: '지원 대학, 학과(부), 전형명을 모두 선택/입력해 주세요.'
    });
    return;
  }

  myApplications.value.push({
    ...formInput.value,
    medical_type: detectedMedical.value
  });

  // 폼 초기화
  formInput.value = {
    term_type: formInput.value.term_type,
    univ_name: '',
    department: '',
    track_type: '',
    track_name: '',
    recruitment_quota: '',
    eval_method: '',
    suneung_minimum: '',
    remarks: '',
    region: ''
  };

  await saveAllApplications(true);
}

function removeApplication(idx) {
  myApplications.value.splice(idx, 1);
  saveAllApplications(true);
}

async function saveAllApplications(silent = false) {
  if (!isEligible.value && !warningAcknowledged.value) {
    if (!silent) {
      await dialog.alert({
        title: '자격 유의 사항 확인 필요',
        message: '농어촌 자격 미달/유의 경고 상태입니다. 상단 자격 서약 확인 후 저장해 주세요.'
      });
    }
  }

  saving.value = true;
  try {
    const studentId = currentStudentDbId.value || auth.user?.id || auth.studentId;
    await saveStudentRuralApplications(studentId, myApplications.value, studentSig.value, parentSig.value);
    if (!silent) {
      await dialog.alert({
        title: '농어촌 추천 신청 저장 완료',
        message: `총 ${myApplications.value.length}개 지망 항목이 성공적으로 저장되었습니다.`
      });
    }
  } catch (err) {
    console.error('Failed to save rural applications:', err);
    if (!silent) {
      await dialog.alert({
        title: '저장 오류',
        message: '농어촌 신청서 저장 도중 오류가 발생했습니다.'
      });
    }
  } finally {
    saving.value = false;
  }
}

function openSignatureModal() {
  showSigModal.value = true;
  nextTick(() => {
    initCanvases();
  });
}

function initCanvases() {
  if (studentCanvasRef.value) {
    const ctx = studentCanvasRef.value.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a';
  }
  if (parentCanvasRef.value) {
    const ctx = parentCanvasRef.value.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a';
  }
}

function startDrawing(e, type) {
  const canvas = type === 'student' ? studentCanvasRef.value : parentCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  ctx.beginPath();
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  if (type === 'student') isDrawingStudent.value = true;
  else isDrawingParent.value = true;
}

function draw(e, type) {
  const isDrawing = type === 'student' ? isDrawingStudent.value : isDrawingParent.value;
  if (!isDrawing) return;
  const canvas = type === 'student' ? studentCanvasRef.value : parentCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  ctx.stroke();
}

function stopDrawing(type) {
  if (type === 'student') isDrawingStudent.value = false;
  else isDrawingParent.value = false;
}

function startDrawingTouch(e, type) {
  const touch = e.touches[0];
  if (!touch) return;
  const canvas = type === 'student' ? studentCanvasRef.value : parentCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  ctx.beginPath();
  ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  if (type === 'student') isDrawingStudent.value = true;
  else isDrawingParent.value = true;
}

function drawTouch(e, type) {
  const isDrawing = type === 'student' ? isDrawingStudent.value : isDrawingParent.value;
  if (!isDrawing) return;
  const touch = e.touches[0];
  if (!touch) return;
  const canvas = type === 'student' ? studentCanvasRef.value : parentCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
  ctx.stroke();
}

function clearStudentSig() {
  if (!studentCanvasRef.value) return;
  const ctx = studentCanvasRef.value.getContext('2d');
  ctx.clearRect(0, 0, studentCanvasRef.value.width, studentCanvasRef.value.height);
  studentSig.value = null;
}

function clearParentSig() {
  if (!parentCanvasRef.value) return;
  const ctx = parentCanvasRef.value.getContext('2d');
  ctx.clearRect(0, 0, parentCanvasRef.value.width, parentCanvasRef.value.height);
  parentSig.value = null;
}

async function confirmSignatures() {
  if (studentCanvasRef.value) {
    studentSig.value = studentCanvasRef.value.toDataURL();
  }
  if (parentCanvasRef.value) {
    parentSig.value = parentCanvasRef.value.toDataURL();
  }
  showSigModal.value = false;

  await saveAllApplications(true);

  await dialog.alert({
    title: '서명 저장 완료',
    message: '학생 및 학부모 서명이 성공적으로 반영되었습니다.'
  });
}

async function triggerPrintConfirmation() {
  try {
    const studentId = currentStudentDbId.value || auth.user?.id || auth.studentId;
    const eligibilityList = await getRuralEligibilityList();
    const myInfo = eligibilityList.find(s =>
      s.id === studentId ||
      s.user_id === studentId ||
      (auth.user?.id && (s.id === auth.user.id || s.user_id === auth.user.id)) ||
      (auth.studentCode && String(s.student_code).trim() === String(auth.studentCode).trim())
    );

    const studentName = auth.studentName || myInfo?.name || '학생';
    const studentCode = auth.studentCode || myInfo?.student_code || '';
    const isEnrolled = auth.isEnrolled ?? myInfo?.is_enrolled ?? true;
    const grade = auth.grade ?? myInfo?.grade ?? 3;
    const classNo = auth.classNo ?? myInfo?.class_no ?? '';
    const seqNo = auth.seqNo ?? myInfo?.seq_no ?? myInfo?.student_no ?? '';

    const validChoices = myApplications.value;

    printRuralConfirmationDocument({
      studentName,
      studentCode,
      isEnrolled,
      grade,
      classNo,
      seqNo,
      gradYear: auth.gradYear || 2026,
      ruralType: prefRuralType.value === '유형II' ? 'TYPE_2' : 'TYPE_1',
      choices: validChoices,
      studentSignature: studentSig.value,
      parentSignature: parentSig.value,
      isWarningAcknowledged: warningAcknowledged.value || prefRuralSelfCheck.value
    });
  } catch (e) {
    console.error('Failed to trigger print:', e);
    await dialog.alert({ title: '인쇄 오류', message: '신청서 인쇄 양식 생성 중 오류가 발생했습니다.' });
  }
}
</script>
