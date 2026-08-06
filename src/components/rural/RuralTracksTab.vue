<template>
  <div class="space-y-4 flex-1 min-h-0 flex flex-col">
    <!-- 헤더 카드 -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs shrink-0">
      <div>
        <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2 m-0">
          <BookOpen class="w-6 h-6 text-emerald-600" />
          농어촌 및 기회균형 모집요강 전형 관리
        </h2>
        <p class="text-sm text-slate-500 mt-1 mb-0">
          관리자가 등록한 2027학년도 농어촌 및 기회균형(농어촌) 전형 모집요강 데이터베이스 목록입니다.
        </p>
      </div>

      <div v-if="auth.isAdmin || auth.isTeacher" class="flex items-center gap-2">
        <button
          v-if="auth.isAdmin"
          @click="handleSyncRuralGoogleSheet"
          :disabled="syncing"
          class="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer border-none disabled:opacity-50"
        >
          <RefreshCw :class="{ 'animate-spin': syncing }" class="w-4 h-4" />
          {{ syncing ? '동기화 중…' : '2027 농어촌 전형 동기화' }}
        </button>
      </div>
    </div>

    <!-- 검색 및 필터 바 -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
      <div class="flex flex-wrap items-center gap-3">
        <!-- 구분 (수시/정시) -->
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-slate-700 whitespace-nowrap">구분:</span>
          <select
            v-model="filterTerm"
            class="px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-w-40"
          >
            <option value="all">전체 (수시+정시)</option>
            <option value="수시">수시</option>
            <option value="정시">정시</option>
          </select>
        </div>

        <!-- 메디컬 여부 -->
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-slate-700 whitespace-nowrap">메디컬:</span>
          <select
            v-model="filterMedical"
            class="px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-w-32"
          >
            <option value="all">전체</option>
            <option value="의">의대</option>
            <option value="치">치대</option>
            <option value="한">한의대</option>
            <option value="약">약대</option>
            <option value="수">수의대</option>
            <option value="없음">일반 학과</option>
          </select>
        </div>

        <!-- 전형 유형 -->
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-slate-700 whitespace-nowrap">전형유형:</span>
          <select
            v-model="filterTrackType"
            class="px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-w-36"
          >
            <option value="all">전체</option>
            <option value="교과">학생부교과</option>
            <option value="종합">학생부종합</option>
            <option value="가">가군 (정시)</option>
            <option value="나">나군 (정시)</option>
            <option value="다">다군 (정시)</option>
          </select>
        </div>

        <!-- 검색어 (대학명/전형명) -->
        <div class="relative min-w-64 sm:min-w-72">
          <Search class="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="대학명, 전형명, 비고 검색…"
            class="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
          />
        </div>
      </div>

      <div class="text-slate-500 font-medium">
        총 <strong class="text-emerald-600 font-bold">{{ filteredTracks.length }}</strong>개 전형 등록됨
      </div>
    </div>

    <!-- 모집요강 테이블 -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden">
      <div class="flex-1 min-h-0 overflow-auto custom-scrollbar w-full">
        <table class="w-full text-left text-xs border-collapse" style="min-width: 1300px;">
          <thead class="sticky top-0 z-10 bg-slate-50">
            <tr class="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold whitespace-nowrap">
              <th class="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50" style="width: 75px; min-width: 75px;">구분</th>
              <th class="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50" style="width: 75px; min-width: 75px;">메디컬</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 85px; min-width: 85px;">지역</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 150px; min-width: 150px;">대학 (지역)</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 110px; min-width: 110px;">전형유형</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 170px; min-width: 170px;">전형명</th>
              <th class="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50" style="width: 85px; min-width: 85px;">모집인원</th>
              <th class="py-3 px-3.5 bg-slate-50" style="min-width: 220px;">전형방법</th>
              <th class="py-3 px-3.5 bg-slate-50" style="min-width: 220px;">수능최저</th>
              <th class="py-3 px-3.5 bg-slate-50" style="min-width: 180px;">비고 (기회균형)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="filteredTracks.length === 0">
              <td colspan="10" class="py-12 text-center text-slate-400">
                등록된 전형 모집요강 데이터가 없습니다. (상단 '2027 농어촌 전형 동기화' 버튼을 눌러주세요)
              </td>
            </tr>
            <tr
              v-for="track in filteredTracks"
              :key="track.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <!-- 구분 -->
              <td class="py-3 px-3.5 text-center whitespace-nowrap">
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[11px] font-extrabold whitespace-nowrap inline-block',
                    track.term_type === '수시' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                  ]"
                >
                  {{ track.term_type }}
                </span>
              </td>

              <!-- 메디컬 -->
              <td class="py-3 px-3.5 text-center whitespace-nowrap">
                <span
                  v-if="track.medical_type && track.medical_type !== '없음'"
                  class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 whitespace-nowrap inline-block"
                >
                  {{ track.medical_type }}
                </span>
                <span v-else class="text-slate-400">-</span>
              </td>

              <!-- 지역 -->
              <td class="py-3 px-3.5 font-semibold text-slate-700 whitespace-nowrap">{{ track.region || '-' }}</td>

              <!-- 대학 -->
              <td class="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">{{ track.univ_name }}</td>

              <!-- 전형유형 -->
              <td class="py-3 px-3.5 whitespace-nowrap">
                <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap inline-block">
                  {{ track.track_type }}
                </span>
              </td>

              <!-- 전형명 -->
              <td class="py-3 px-3.5 font-bold text-slate-800 whitespace-nowrap">{{ track.track_name }}</td>

              <!-- 모집인원 -->
              <td class="py-3 px-3.5 text-center font-bold text-indigo-600 whitespace-nowrap">{{ track.recruitment_quota || '-' }}</td>

              <!-- 전형방법 -->
              <td class="py-3 px-3.5 text-slate-700 max-w-xs truncate" :title="track.eval_method">
                {{ track.eval_method || '-' }}
              </td>

              <!-- 수능최저 -->
              <td class="py-3 px-3.5 text-slate-700 max-w-xs truncate" :title="track.suneung_minimum">
                {{ track.suneung_minimum || '-' }}
              </td>

              <!-- 비고 (기회균형) -->
              <td class="py-3 px-3.5 text-slate-600 max-w-xs truncate" :title="track.remarks">
                <span v-if="track.remarks" class="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 text-[11px] truncate inline-block max-w-xs">
                  {{ track.remarks }}
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
import { ref, computed, onMounted } from 'vue';
import { BookOpen, RefreshCw, Search } from 'lucide-vue-next';
import { useAuthStore } from '../../stores/auth';
import { getRuralTracks, syncRuralTracksFromGoogleSheet } from '../../api/ruralApi';
import { supabase } from '../../utils/supabaseClient';
import { dialog } from '../common/dialog';

const auth = useAuthStore();
const loading = ref(false);
const syncing = ref(false);

const tracksList = ref([]);
const filterTerm = ref('all');
const filterMedical = ref('all');
const filterTrackType = ref('all');
const searchQuery = ref('');

onMounted(() => {
  loadTracks();
});

async function loadTracks() {
  loading.value = true;
  try {
    const list = await getRuralTracks();
    tracksList.value = list;
  } catch (e) {
    console.error('Failed to load rural tracks:', e);
  } finally {
    loading.value = false;
  }
}

async function handleSyncRuralGoogleSheet() {
  syncing.value = true;
  try {
    let sheetId = '';
    if (supabase) {
      const { data } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'google_sheet_rural_id')
        .maybeSingle();
      if (data && data.value) sheetId = data.value.trim();
    }

    if (!sheetId) {
      await dialog.alert({
        title: '구글 스프레드시트 ID 필요',
        message: '농어촌 및 기회균형 전형 구글 스프레드시트 ID가 설정되어 있지 않습니다.\n\n[관리자 설정] 탭에서 "2) 농어촌 및 기회균형 전형 구글 시트 ID"를 먼저 저장해 주세요.'
      });
      return;
    }

    const inserted = await syncRuralTracksFromGoogleSheet(sheetId);
    await dialog.alert({
      title: '농어촌 전형 구글 시트 동기화 완료',
      message: `2027학년도 농어촌 및 기회균형 전형 총 ${inserted.length}개 전형 데이터가 DB에 연동되었습니다.`
    });
    await loadTracks();
  } catch (err) {
    console.error('Failed to sync rural google sheet:', err);
    await dialog.alert({
      title: '동기화 실패',
      message: err.message || '농어촌 전형 구글 시트 동기화 중 오류가 발생했습니다.'
    });
  } finally {
    syncing.value = false;
  }
}

const filteredTracks = computed(() => {
  return tracksList.value.filter(t => {
    if (filterTerm.value !== 'all' && t.term_type !== filterTerm.value) return false;
    if (filterMedical.value !== 'all') {
      if (filterMedical.value === '없음' && t.medical_type && t.medical_type !== '없음') return false;
      if (filterMedical.value !== '없음' && t.medical_type !== filterMedical.value) return false;
    }
    if (filterTrackType.value !== 'all' && !t.track_type?.includes(filterTrackType.value)) return false;

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchUniv = t.univ_name?.toLowerCase().includes(q);
      const matchTrack = t.track_name?.toLowerCase().includes(q);
      const matchRemark = t.remarks?.toLowerCase().includes(q);
      if (!matchUniv && !matchTrack && !matchRemark) return false;
    }

    return true;
  });
});
</script>

<style scoped>
.custom-scrollbar {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.custom-scrollbar::-webkit-scrollbar {
  height: 10px;
  display: block;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #e2e8f0;
  border-radius: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #64748b;
  border-radius: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
</style>
