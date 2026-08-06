<template>
  <div class="space-y-6">
    <!-- 자격 상태 자동 감지 알림 바 -->
    <div
      :class="[
        'p-5 rounded-xl border shadow-xs transition-all',
        isEligible
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-rose-50 border-rose-200 text-rose-950'
      ]"
    >
      <div class="flex items-start gap-3">
        <CheckCircle2 v-if="isEligible" class="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
        <AlertTriangle v-else class="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
        <div class="flex-1 space-y-1">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold m-0 flex items-center gap-2">
              {{ isEligible ? '농어촌 특별전형 자격 자동 검증: 적격 (지원 가능)' : '⚠️ 농어촌 특별전형 자격 유의 사항 (주의)' }}
            </h3>
            <span
              :class="[
                'px-2.5 py-0.5 rounded-full text-xs font-bold',
                isEligible ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-900'
              ]"
            >
              {{ ruralType === 'TYPE_2' ? '유형 II (12년)' : '유형 I (6년)' }}
            </span>
          </div>
          <p class="text-xs leading-relaxed opacity-90 m-0">
            {{ evalReport || '인적사항(주소) 및 학적 이력을 기반으로 자동 산출된 자격 판정 결과입니다.' }}
          </p>
          <div v-if="!isEligible" class="pt-2 border-t border-rose-200/80 mt-2 flex items-center gap-2">
            <input
              id="warningAck"
              v-model="warningAcknowledged"
              type="checkbox"
              class="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
            />
            <label for="warningAck" class="text-xs font-bold text-rose-800 cursor-pointer">
              자격 유의 사항을 확인하였으며, 소명 및 신청 작성을 계속 진행합니다.
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 6개 지망 선택 작성 폼 카드 -->
    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2 m-0">
            <FileSpreadsheet class="w-5 h-5 text-emerald-600" />
            2027학년도 대입 농어촌 전형 희망 지망 작성 (최대 6개)
          </h3>
          <p class="text-xs text-slate-500 mt-1 mb-0">
            구분, 메디컬, 대학, 학과(직접입력), 전형유형, 전형명을 선택하면 모집인원 및 수능최저가 자동으로 표시됩니다.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="openSignatureModal"
            class="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer transition-colors"
          >
            <PenTool class="w-4 h-4 text-slate-600" />
            학생/학부모 서명 등록
            <span v-if="studentSig && parentSig" class="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.5 rounded">완료</span>
          </button>
          <button
            @click="saveApplications"
            :disabled="saving"
            class="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer border-none disabled:opacity-50"
          >
            <Save class="w-4 h-4" />
            {{ saving ? '저장 중…' : '신청서 저장' }}
          </button>
          <button
            @click="triggerPrintConfirmation"
            class="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer border-none"
          >
            <Printer class="w-4 h-4" />
            농어촌 추천 확인서 인쇄 (A4)
          </button>
        </div>
      </div>

      <!-- 6개 지망 선택 카드 아코디언/목록 -->
      <div class="space-y-4">
        <div
          v-for="(app, idx) in choices"
          :key="idx"
          class="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200">
              {{ idx + 1 }}지망
            </span>
            <button
              v-if="app.univ_name || app.department"
              @click="clearChoice(idx)"
              class="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer bg-transparent border-none"
            >
              이 지망 초기화
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
            <!-- 1. 구분 (수시/정시) -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">구분</label>
              <select
                v-model="app.term_type"
                @change="onTermTypeChange(idx)"
                class="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="수시">수시</option>
                <option value="정시">정시</option>
              </select>
            </div>

            <!-- 2. 메디컬 -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">메디컬 구분</label>
              <select
                v-model="app.medical_type"
                @change="onMedicalTypeChange(idx)"
                class="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="없음">일반 학과</option>
                <option value="의">의대</option>
                <option value="치">치대</option>
                <option value="한">한의대</option>
                <option value="약">약대</option>
                <option value="수">수의대</option>
              </select>
            </div>

            <!-- 3. 대학명 (드롭다운) -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">대학 선택</label>
              <select
                v-model="app.univ_name"
                @change="onUnivChange(idx)"
                class="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900"
              >
                <option value="">-- 대학 선택 --</option>
                <option v-for="uName in getAvailableUnivs(app)" :key="uName" :value="uName">
                  {{ uName }}
                </option>
              </select>
            </div>

            <!-- 4. 학과명 (직접 입력) -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">학과(부) 입력</label>
              <input
                v-model="app.department"
                type="text"
                placeholder="예: 컴퓨터공학과"
                class="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <!-- 5. 전형 유형 -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">전형 유형</label>
              <select
                v-model="app.track_type"
                @change="onTrackTypeChange(idx)"
                class="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">-- 유형 선택 --</option>
                <option v-for="tType in getAvailableTrackTypes(app)" :key="tType" :value="tType">
                  {{ tType }}
                </option>
              </select>
            </div>

            <!-- 6. 전형명 -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">전형명 선택</label>
              <select
                v-model="app.track_name"
                @change="onTrackNameChange(idx)"
                class="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900"
              >
                <option value="">-- 전형명 선택 --</option>
                <option v-for="t in getAvailableTrackNames(app)" :key="t.id" :value="t.track_name">
                  {{ t.track_name }}
                </option>
              </select>
            </div>
          </div>

          <!-- 자동 채움 요강 상세 뷰 (모집인원, 전형방법, 수능최저, 비고) -->
          <div v-if="app.track_name" class="p-3 bg-white rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span class="text-slate-400 font-bold block">모집인원:</span>
              <span class="font-bold text-indigo-700">{{ app.recruitment_quota || '-' }}</span>
            </div>
            <div>
              <span class="text-slate-400 font-bold block">전형방법:</span>
              <span class="text-slate-700 truncate block" :title="app.eval_method">{{ app.eval_method || '-' }}</span>
            </div>
            <div>
              <span class="text-slate-400 font-bold block">수능최저:</span>
              <span class="text-slate-700 truncate block" :title="app.suneung_minimum">{{ app.suneung_minimum || '-' }}</span>
            </div>
            <div>
              <span class="text-slate-400 font-bold block">비고 (기회균형):</span>
              <span class="text-amber-800 font-semibold truncate block" :title="app.remarks">{{ app.remarks || '-' }}</span>
            </div>
          </div>
        </div>
      </div>
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
import { ref, computed, onMounted, nextTick } from 'vue';
import {
  FileSpreadsheet,
  PenTool,
  Save,
  Printer,
  CheckCircle2,
  AlertTriangle
} from 'lucide-vue-next';
import { useAuthStore } from '../../stores/auth';
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

const isEligible = ref(true);
const ruralType = ref('TYPE_1');
const evalReport = ref('');
const warningAcknowledged = ref(false);

const allTracks = ref([]);
const choices = ref(Array.from({ length: 6 }, () => ({
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
  is_warning_acknowledged: false
})));

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

async function loadEligibilityAndTracks() {
  try {
    allTracks.value = await getRuralTracks();

    // 내 자격 조회
    const studentId = auth.user?.id || auth.studentId;
    if (studentId) {
      const eligibilityList = await getRuralEligibilityList();
      const myInfo = eligibilityList.find(s => s.id === studentId);
      if (myInfo) {
        const elig = myInfo.eligibility;
        isEligible.value = Boolean(elig?.is_eligible || elig?.is_manual_approved);
        ruralType.value = elig?.rural_type || 'TYPE_1';
        evalReport.value = elig?.evaluation_notes || '';
      }

      // 내 기존 지망 신청 내역 로드
      const savedApps = await getStudentRuralApplications(studentId);
      if (savedApps && savedApps.length > 0) {
        savedApps.forEach(sa => {
          const idx = sa.choice_number - 1;
          if (idx >= 0 && idx < 6) {
            choices.value[idx] = {
              ...sa,
              term_type: sa.term_type || '수시',
              medical_type: sa.medical_type || '없음'
            };
          }
        });
        if (savedApps[0].student_signature) studentSig.value = savedApps[0].student_signature;
        if (savedApps[0].parent_signature) parentSig.value = savedApps[0].parent_signature;
        if (savedApps[0].is_warning_acknowledged) warningAcknowledged.value = true;
      }
    }
  } catch (e) {
    console.error('Failed to load student rural apply data:', e);
  }
}

function getAvailableUnivs(app) {
  const filtered = allTracks.value.filter(t => {
    if (t.term_type !== app.term_type) return false;
    if (app.medical_type !== '없음' && t.medical_type !== app.medical_type) return false;
    if (app.medical_type === '없음' && t.medical_type && t.medical_type !== '없음') return false;
    return true;
  });
  return Array.from(new Set(filtered.map(t => t.univ_name)));
}

function getAvailableTrackTypes(app) {
  if (!app.univ_name) return [];
  const filtered = allTracks.value.filter(t => t.term_type === app.term_type && t.univ_name === app.univ_name);
  return Array.from(new Set(filtered.map(t => t.track_type)));
}

function getAvailableTrackNames(app) {
  if (!app.univ_name || !app.track_type) return [];
  return allTracks.value.filter(t => t.term_type === app.term_type && t.univ_name === app.univ_name && t.track_type === app.track_type);
}

function onTermTypeChange(idx) {
  const app = choices.value[idx];
  app.univ_name = '';
  app.track_type = '';
  app.track_name = '';
  app.recruitment_quota = '';
  app.eval_method = '';
  app.suneung_minimum = '';
  app.remarks = '';
}

function onMedicalTypeChange(idx) {
  onTermTypeChange(idx);
}

function onUnivChange(idx) {
  const app = choices.value[idx];
  app.track_type = '';
  app.track_name = '';
  app.recruitment_quota = '';
  app.eval_method = '';
  app.suneung_minimum = '';
  app.remarks = '';
}

function onTrackTypeChange(idx) {
  const app = choices.value[idx];
  app.track_name = '';
  app.recruitment_quota = '';
  app.eval_method = '';
  app.suneung_minimum = '';
  app.remarks = '';
}

function onTrackNameChange(idx) {
  const app = choices.value[idx];
  const matched = allTracks.value.find(t =>
    t.term_type === app.term_type &&
    t.univ_name === app.univ_name &&
    t.track_type === app.track_type &&
    t.track_name === app.track_name
  );
  if (matched) {
    app.track_id = matched.id;
    app.recruitment_quota = matched.recruitment_quota || '';
    app.eval_method = matched.eval_method || '';
    app.suneung_minimum = matched.suneung_minimum || '';
    app.remarks = matched.remarks || '';
  }
}

function clearChoice(idx) {
  choices.value[idx] = {
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
    is_warning_acknowledged: false
  };
}

async function saveApplications() {
  if (!isEligible.value && !warningAcknowledged.value) {
    await dialog.alert({
      title: '자격 유의 사항 확인 필요',
      message: '농어촌 자격 미달/유의 경고 상태입니다. 상단 경고 박스의 "자격 유의 사항을 확인하였으며 신청 작성을 계속 진행합니다" 체크박스에 동의 후 저장해 주세요.'
    });
    return;
  }

  const validChoices = choices.value.filter(c => c.univ_name && c.department && c.track_name);
  if (validChoices.length === 0) {
    await dialog.alert({
      title: '지망 항목 입력 필요',
      message: '적어도 1개 이상의 지망 항목(대학명, 학과, 전형명)을 완전하게 작성해 주세요.'
    });
    return;
  }

  saving.value = true;
  try {
    const studentId = auth.user?.id || auth.studentId;
    const filledApps = choices.value
      .filter(c => c.univ_name && c.department && c.track_name)
      .map(c => ({
        ...c,
        is_warning_acknowledged: warningAcknowledged.value
      }));

    await saveStudentRuralApplications(studentId, filledApps, studentSig.value, parentSig.value);

    await dialog.alert({
      title: '농어촌 추천 신청 저장 완료',
      message: `총 ${filledApps.length}개 지망 항목 및 서명이 성공적으로 저장되었습니다.`
    });
  } catch (err) {
    console.error('Failed to save rural applications:', err);
    await dialog.alert({
      title: '저장 오류',
      message: '농어촌 신청서 저장 도중 오류가 발생했습니다.'
    });
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

function startDrawingTouch(e, type) {
  const touch = e.touches[0];
  startDrawing({ clientX: touch.clientX, clientY: touch.clientY }, type);
}

function drawTouch(e, type) {
  const touch = e.touches[0];
  draw({ clientX: touch.clientX, clientY: touch.clientY }, type);
}

function stopDrawing(type) {
  if (type === 'student') isDrawingStudent.value = false;
  else isDrawingParent.value = false;
}

function clearStudentSig() {
  if (studentCanvasRef.value) {
    const ctx = studentCanvasRef.value.getContext('2d');
    ctx.clearRect(0, 0, studentCanvasRef.value.width, studentCanvasRef.value.height);
  }
  studentSig.value = null;
}

function clearParentSig() {
  if (parentCanvasRef.value) {
    const ctx = parentCanvasRef.value.getContext('2d');
    ctx.clearRect(0, 0, parentCanvasRef.value.width, parentCanvasRef.value.height);
  }
  parentSig.value = null;
}

function confirmSignatures() {
  if (studentCanvasRef.value) {
    studentSig.value = studentCanvasRef.value.toDataURL();
  }
  if (parentCanvasRef.value) {
    parentSig.value = parentCanvasRef.value.toDataURL();
  }
  showSigModal.value = false;
}

async function triggerPrintConfirmation() {
  const validChoices = choices.value.filter(c => c.univ_name && c.department && c.track_name);
  if (validChoices.length === 0) {
    await dialog.alert({
      title: '인쇄 불가',
      message: '작성된 농어촌 전형 지망 항목이 없습니다. 지망을 먼저 작성해 주세요.'
    });
    return;
  }

  await dialog.alert({
    title: '인쇄 안내',
    message: '2027학년도 대입 농어촌 전형 추천 확인서 인쇄 후 담임선생님께 제출하여 주시기 바랍니다.'
  });

  const studentInfo = {
    name: auth.studentName || auth.user?.user_metadata?.name || '학생',
    studentCode: auth.studentCode || '',
    classNo: auth.classNo || 1,
    seqNo: auth.seqNo || 1
  };

  printRuralConfirmationDocument(studentInfo, validChoices, studentSig.value, parentSig.value);
}
</script>
