<template>
  <div class="univ-pass-count-widget bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs transition-all duration-300 print:p-0 print:border-none print:shadow-none print:m-0">
    <!-- 화면 전용 상단 헤더 & 인쇄 버튼 (인쇄 시 완전 숨김) -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 print:hidden">
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-1">
          <span>🏛️</span>
          <span>주요 대학 합격 실적 현황</span>
          <span class="text-indigo-300">|</span>
          <span class="text-slate-500 font-semibold">{{ selectedAcademicYear }}학년도 집계</span>
        </div>
        <h3 class="text-base sm:text-lg font-black text-slate-900 tracking-tight m-0">
          주요 대학 및 권역별 합격 인원 현황표
        </h3>
        <p class="text-xs text-slate-500 m-0 mt-0.5">
          단일 학생 기준 실제 최종 합격 인원(명) 집계표입니다. (중복 합격 포함 시 지원 건수 병기)
        </p>
      </div>

      <!-- Quick Metrics & Print Button -->
      <div class="flex items-center gap-2 self-start sm:self-center shrink-0">
        <div class="bg-indigo-50/70 border border-indigo-200/80 px-3 py-1.5 rounded-xl text-right">
          <span class="text-[10px] text-slate-500 font-medium block">총 합격 인원 (순수)</span>
          <span class="text-xs sm:text-sm font-black text-indigo-700 font-mono">
            {{ totalUniquePassedStudents }}명
            <span class="text-[10px] font-semibold text-slate-400">({{ totalPassedAppsCount }}건)</span>
          </span>
        </div>

        <button
          type="button"
          @click="handlePrint"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
          title="현황표 A4 인쇄 / PDF 저장"
        >
          <Printer class="w-3.5 h-3.5 text-slate-600" />
          <span>현황표 인쇄</span>
        </button>
      </div>
    </div>

    <!-- 🖨️ 인쇄 전용 공식 헤더 (화면에서는 숨김, 인쇄 시에만 제목 + 기본 정보 깔끔하게 출력) -->
    <div class="hidden print:block mb-3 border-b-2 border-black pb-2">
      <div class="flex items-center justify-between text-[11px] font-mono text-slate-700 mb-1">
        <span class="font-bold text-black">포곡고등학교 대입 진학 지도 시스템</span>
        <span>기준: {{ selectedAcademicYear }}학년도 대입 최종 합격 실적</span>
      </div>
      <div class="flex items-baseline justify-between mt-1">
        <h1 class="text-xl font-black text-black tracking-tight m-0">
          주요 대학 및 권역별 합격 인원 현황표
        </h1>
        <span class="text-xs font-mono font-bold text-black">
          총 합격 인원: {{ totalUniquePassedStudents }}명 (총 {{ totalPassedAppsCount }}건)
        </span>
      </div>
    </div>

    <!-- 1. 주요 대학 및 특수목적대 (31개 라인) -->
    <div class="mb-5 print:mb-4">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-indigo-600 print:hidden"></span>
          <h4 class="text-xs font-bold text-slate-700 m-0 print:text-xs print:font-black">
            주요 대학 및 특수목적대 (31개)
          </h4>
        </div>
        <span class="text-[11px] text-slate-400 font-mono print:hidden">
          합격 {{ majorGroupPassedStudentCount }}명 ({{ majorGroupPassedApplyCount }}건)
        </span>
      </div>

      <!-- Responsive fluid table grid (화면 폭에 따라 유동적 배치 & 인쇄용 최적화) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1.5 print:grid-cols-6 print:gap-px print:border print:border-black print:bg-black">
        <div
          v-for="target in MAJOR_TARGETS"
          :key="target.id"
          @click="openCategoryDetail(target)"
          :class="[
            'group rounded-xl border transition-all duration-150 flex flex-col justify-between overflow-hidden select-none',
            'print:rounded-none print:border-none print:bg-white',
            statsMap[target.id]?.studentCount > 0
              ? 'bg-white border-indigo-200 hover:border-indigo-400 hover:shadow-xs cursor-pointer'
              : 'bg-slate-50/70 border-slate-200/70 cursor-default opacity-85'
          ]"
        >
          <!-- Cell Top: University Name -->
          <div
            :class="[
              'px-2 py-1.5 text-center text-[11px] font-bold truncate border-b transition-colors',
              'print:bg-slate-100 print:text-black print:border-black print:py-1 print:text-[9.5px] print:whitespace-normal print:overflow-visible print:wrap-break-word print:leading-tight',
              target.id === 'MED'
                ? 'bg-rose-50 text-rose-800 border-rose-200 font-black'
                : statsMap[target.id]?.studentCount > 0
                  ? 'bg-indigo-50/60 text-slate-800 border-indigo-100 group-hover:bg-indigo-100/70'
                  : 'bg-slate-100/80 text-slate-600 border-slate-200'
            ]"
            :title="target.name"
          >
            {{ target.name }}
          </div>

          <!-- Cell Bottom: Pass Count (인원 수) -->
          <div class="p-2 sm:p-2.5 text-center flex flex-col items-center justify-center bg-white print:p-1.5">
            <div
              :class="[
                'font-mono text-sm sm:text-base font-black tracking-tight leading-none',
                'print:text-black print:text-xs',
                target.id === 'MED' && statsMap[target.id]?.studentCount > 0
                  ? 'text-rose-600'
                  : statsMap[target.id]?.studentCount > 0
                    ? 'text-indigo-700'
                    : 'text-slate-400 font-semibold text-xs sm:text-sm'
              ]"
            >
              {{ statsMap[target.id]?.studentCount || 0 }}명
            </div>

            <!-- Total application count badge (if distinct from student count) -->
            <div
              v-if="statsMap[target.id]?.applyCount > 0 && statsMap[target.id]?.applyCount !== statsMap[target.id]?.studentCount"
              class="text-[9px] font-mono text-slate-400 mt-0.5 print:text-[8px] print:text-slate-600"
            >
              ({{ statsMap[target.id]?.applyCount }}건)
            </div>
            <div
              v-else-if="statsMap[target.id]?.studentCount === 0"
              class="text-[9px] font-mono text-slate-300 mt-0.5 print:hidden"
            >
              -
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 그 밖의 대학 (지역별 묶음) -->
    <div class="pt-2 border-t border-slate-100 print:border-t print:border-black print:pt-2">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-600 print:hidden"></span>
          <h4 class="text-xs font-bold text-slate-700 m-0 print:text-xs print:font-black">
            그 밖의 대학 (권역별 집계)
          </h4>
        </div>
        <span class="text-[11px] text-slate-400 font-mono print:hidden">
          합격 {{ regionalGroupPassedStudentCount }}명 ({{ regionalGroupPassedApplyCount }}건)
        </span>
      </div>

      <!-- Regional fluid table grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 print:grid-cols-6 print:gap-px print:border print:border-black print:bg-black">
        <div
          v-for="target in REGIONAL_TARGETS"
          :key="target.id"
          @click="openCategoryDetail(target)"
          :class="[
            'group rounded-xl border transition-all duration-150 flex flex-col justify-between overflow-hidden select-none',
            'print:rounded-none print:border-none print:bg-white',
            statsMap[target.id]?.studentCount > 0
              ? 'bg-white border-emerald-200 hover:border-emerald-400 hover:shadow-xs cursor-pointer'
              : 'bg-slate-50/70 border-slate-200/70 cursor-default opacity-85'
          ]"
        >
          <!-- Regional Cell Top -->
          <div
            :class="[
              'px-2 py-1.5 text-center text-[11px] font-bold truncate border-b transition-colors',
              'print:bg-slate-100 print:text-black print:border-black print:py-1 print:text-[9.5px] print:whitespace-normal print:overflow-visible print:wrap-break-word print:leading-tight',
              statsMap[target.id]?.studentCount > 0
                ? 'bg-emerald-50/60 text-slate-800 border-emerald-100 group-hover:bg-emerald-100/70'
                : 'bg-slate-100/80 text-slate-600 border-slate-200'
            ]"
            :title="target.name"
          >
            {{ target.name }}
          </div>

          <!-- Regional Cell Bottom -->
          <div class="p-2 sm:p-2.5 text-center flex flex-col items-center justify-center bg-white print:p-1.5">
            <div
              :class="[
                'font-mono text-sm sm:text-base font-black tracking-tight leading-none',
                'print:text-black print:text-xs',
                statsMap[target.id]?.studentCount > 0
                  ? 'text-emerald-700'
                  : 'text-slate-400 font-semibold text-xs sm:text-sm'
              ]"
            >
              {{ statsMap[target.id]?.studentCount || 0 }}명
            </div>

            <div
              v-if="statsMap[target.id]?.applyCount > 0 && statsMap[target.id]?.applyCount !== statsMap[target.id]?.studentCount"
              class="text-[9px] font-mono text-slate-400 mt-0.5 print:text-[8px] print:text-slate-600"
            >
              ({{ statsMap[target.id]?.applyCount }}건)
            </div>
            <div
              v-else-if="statsMap[target.id]?.studentCount === 0"
              class="text-[9px] font-mono text-slate-300 mt-0.5 print:hidden"
            >
              -
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Print Footer note -->
    <div class="hidden print:flex print:mt-3 print:pt-2 print:border-t print:border-black text-[9px] text-slate-500 font-mono justify-between">
      <span>* 의치한약수 계열은 전공 기준 집계로 타 대학 합격 인원과 일부 중복 집계될 수 있습니다.</span>
      <span>출력일시: {{ printDateTime }}</span>
    </div>

    <!-- Click-to-view Detail Modal (Teleport to body) -->
    <Teleport to="body">
      <div
        v-if="selectedCategoryModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:hidden"
        @click.self="selectedCategoryModal = null"
      >
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col overflow-hidden">
          <!-- Modal Header -->
          <div class="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-1.5">
                <span>{{ selectedCategoryModal.isRegional ? '🗺️ 권역별 집계' : '🏛️ 대학별 집계' }}</span>
                <span>•</span>
                <span>{{ selectedAcademicYear }}학년도</span>
              </div>
              <h3 class="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
                <span>{{ selectedCategoryModal.name }}</span>
                <span class="text-sm font-black text-indigo-600 font-mono bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                  총 {{ selectedCategoryModal.studentCount }}명 합격 ({{ selectedCategoryModal.apps.length }}건)
                </span>
              </h3>
            </div>
            <button
              type="button"
              @click="selectedCategoryModal = null"
              class="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Modal Body: Student & Application List -->
          <div class="overflow-y-auto flex-1 py-4 pr-1">
            <div v-if="selectedCategoryModal.apps.length > 0" class="space-y-2">
              <div
                v-for="(app, idx) in selectedCategoryModal.apps"
                :key="idx"
                class="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-mono font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {{ app.grade || 3 }}학년 {{ app.classNum || '-' }}반 {{ app.studentNum || '-' }}번
                    </span>
                    <span class="font-bold text-slate-900">
                      {{ app.name || '학생' }}
                    </span>
                    <span class="text-slate-400 font-mono text-[11px]">
                      내신 {{ app.allSubjectGrade || app.mainSubjectGrade || '-' }}등급
                    </span>
                  </div>
                  <div class="text-slate-600 flex items-center gap-1.5 flex-wrap">
                    <span class="font-semibold text-indigo-900">{{ app.univName }}</span>
                    <span class="text-slate-300">•</span>
                    <span class="font-medium text-slate-800">{{ app.dept || '-' }}</span>
                    <span class="text-slate-300">•</span>
                    <span class="text-slate-500">{{ app.admissionType || app.admissionMajorType || '-' }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-md font-bold text-[11px]',
                      String(app.finalStage).includes('최초')
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    ]"
                  >
                    {{ app.finalStage || '합격' }}
                  </span>
                  <span
                    v-if="app.registerStatus === 'Y'"
                    class="px-2 py-0.5 rounded-md font-bold text-[11px] bg-emerald-100 text-emerald-800"
                  >
                    등록 완료
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-xs text-slate-400">
              해당 대학/권역에 합격한 학생 데이터가 없습니다.
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              @click="selectedCategoryModal = null"
              class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Printer } from 'lucide-vue-next'
import { useData } from '../composables/useStatData'

const { filteredApplications, selectedAcademicYear } = useData()

// -------------------------------------------------------------
// 1. 합격 판정 헬퍼 (최초합격, 충원합격, 최종합격, 등록완료 포함)
// -------------------------------------------------------------
function isPass(app) {
  if (!app) return false
  const final = String(app.finalStage || '').trim()
  const reg = String(app.registerStatus || '').trim()
  if (final.includes('불합')) return false
  return final.includes('합격') || final.includes('충원') || final.includes('최초') || reg === 'Y'
}

function getStudentKey(app) {
  if (app.studentKey) return app.studentKey
  const c = app.classNum || ''
  const n = app.studentNum || ''
  const name = app.name || ''
  return `${c}-${n}_${name}`
}

// -------------------------------------------------------------
// 2. 의치한약수 계열 판정 헬퍼
// -------------------------------------------------------------
function isMedical(app) {
  const d = String(app.dept || '').trim()
  if (
    d.includes('스포츠의학') ||
    d.includes('식물의학') ||
    d.includes('바이오의약') ||
    d.includes('창의') ||
    d.includes('의약생명') ||
    d.includes('한약자원')
  ) {
    return false
  }
  return ['의예', '치의', '한의', '약학', '수의', '의학'].some(m => d.includes(m))
}

// -------------------------------------------------------------
// 3. 주요 대학 목록 정의 (사용자 지정 31개 순서)
// -------------------------------------------------------------
const MAJOR_TARGETS = [
  {
    id: 'MED',
    name: '의치한약수',
    matcher: (app) => isMedical(app)
  },
  {
    id: 'SNU',
    name: '서울대',
    matcher: (app) => {
      const u = String(app.univName || '')
      if (u.includes('서울대') || u.includes('서울대학교')) {
        return !u.includes('남서울') && !u.includes('동서울') && !u.includes('시립') && !u.includes('과기') && !u.includes('여자') && !u.includes('여대')
      }
      return false
    }
  },
  {
    id: 'YONSEI',
    name: '연세대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return (u.includes('연세대') || u.includes('연세대학교')) && !u.includes('미래')
    }
  },
  {
    id: 'KOREA',
    name: '고려대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return (u.includes('고려대') || u.includes('고려대학교')) && !u.includes('세종')
    }
  },
  {
    id: 'KAIST',
    name: '카이스트',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('KAIST') || u.includes('한국과학기술원') || u.includes('카이스트')
    }
  },
  {
    id: 'POSTECH',
    name: '포스텍',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('POSTECH') || u.includes('포항공과대') || u.includes('포항공대') || u.includes('포스텍')
    }
  },
  {
    id: 'SOGANG',
    name: '서강대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('서강대') || u.includes('서강대학교')
    }
  },
  {
    id: 'SKKU',
    name: '성균관대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('성균관대') || u.includes('성균관대학교')
    }
  },
  {
    id: 'HANYANG',
    name: '한양대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return (u.includes('한양대') || u.includes('한양대학교')) && !u.includes('ERICA') && !u.includes('에리카')
    }
  },
  {
    id: 'EWHA',
    name: '이화여대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('이화여대') || u.includes('이화여자대')
    }
  },
  {
    id: 'TECH_GIST_ETC',
    name: '과기원(카이스트 제외)',
    matcher: (app) => {
      const u = String(app.univName || '')
      return ['GIST', '광주과학기술원', 'UNIST', '울산과학기술원', 'DGIST', '대구경북과학기술원', '한국에너지공과대', 'KENTECH'].some(k => u.includes(k))
    }
  },
  {
    id: 'CHUNGANG',
    name: '중앙대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('중앙대') || u.includes('중앙대학교')
    }
  },
  {
    id: 'KYUNGHEE',
    name: '경희대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('경희대') || u.includes('경희대학교')
    }
  },
  {
    id: 'HUFS',
    name: '한국외대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('한국외국어대') || u.includes('한국외대')
    }
  },
  {
    id: 'UOS',
    name: '서울시립대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('서울시립대') || u.includes('시립대')
    }
  },
  {
    id: 'KONKUK',
    name: '건국대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return (u.includes('건국대') || u.includes('건국대학교')) && !u.includes('글로컬')
    }
  },
  {
    id: 'DONGGUK',
    name: '동국대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return (u.includes('동국대') || u.includes('동국대학교')) && !u.includes('WISE') && !u.includes('와이즈') && !u.includes('경주')
    }
  },
  {
    id: 'HONGIK',
    name: '홍익대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return (u.includes('홍익대') || u.includes('홍익대학교')) && !u.includes('세종')
    }
  },
  {
    id: 'SOOKMYUNG',
    name: '숙명여대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('숙명여대') || u.includes('숙명여자대')
    }
  },
  {
    id: 'KOOKMIN',
    name: '국민대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('국민대') || u.includes('국민대학교')
    }
  },
  {
    id: 'SOONGSIL',
    name: '숭실대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('숭실대') || u.includes('숭실대학교')
    }
  },
  {
    id: 'SEJONG',
    name: '세종대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return (u.includes('세종대') || u.includes('세종대학교')) && !u.includes('고려대') && !u.includes('홍익대')
    }
  },
  {
    id: 'DANKOOK',
    name: '단국대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('단국대') || u.includes('단국대학교')
    }
  },
  {
    id: 'AJOU',
    name: '아주대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('아주대') || u.includes('아주대학교')
    }
  },
  {
    id: 'GACHON',
    name: '가천대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('가천대') || u.includes('가천대학교')
    }
  },
  {
    id: 'INHA',
    name: '인하대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('인하대') || u.includes('인하대학교')
    }
  },
  {
    id: 'HANYANG_ERICA',
    name: '한양대(에리카)',
    matcher: (app) => {
      const u = String(app.univName || '')
      return (u.includes('한양대') || u.includes('한양대학교')) && (u.includes('ERICA') || u.includes('에리카'))
    }
  },
  {
    id: 'KWANGWOON',
    name: '광운대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('광운대') || u.includes('광운대학교')
    }
  },
  {
    id: 'KNUE',
    name: '한국교원대',
    matcher: (app) => {
      const u = String(app.univName || '')
      return u.includes('한국교원대') || u.includes('교원대')
    }
  },
  {
    id: 'JIGEOGUK',
    name: '지방거점국립대(본교)',
    matcher: (app) => {
      const u = String(app.univName || '')
      const jigeogukMain = [
        '강원대학교(춘천)', '강원대(춘천)',
        '경북대학교(대구)', '경북대(대구)',
        '경상국립대학교(진주)', '경상국립대(진주)', '경상대(진주)',
        '부산대학교(부산)', '부산대(부산)',
        '전남대학교(광주)', '전남대(광주)',
        '전북대학교(전주)', '전북대(전주)',
        '제주대학교(제주)', '제주대(제주)',
        '충남대학교(대전)', '충남대(대전)',
        '충북대학교(청주)', '충북대(청주)'
      ]
      if (jigeogukMain.some(k => u.includes(k))) return true
      const jigeogukNames = ['강원대', '경북대', '경상국립대', '부산대', '전남대', '전북대', '제주대', '충남대', '충북대']
      return jigeogukNames.some(k => u.includes(k)) && !['삼척', '상주', '통영', '도계', '익산', '여수', '밀양'].some(c => u.includes(c))
    }
  },
  {
    id: 'GYODAE',
    name: '전국교대',
    matcher: (app) => {
      const u = String(app.univName || '')
      const gyodaeList = [
        '서울교육대', '서울교대', '경인교육대', '경인교대', '공주교육대', '공주교대',
        '광주교육대', '광주교대', '대구교육대', '대구교대', '부산교육대', '부산교대',
        '전주교육대', '전주교대', '진주교육대', '진주교대', '청주교육대', '청주교대', '춘천교육대', '춘천교대'
      ]
      return gyodaeList.some(k => u.includes(k)) || ((u.includes('교육대') || u.includes('교대')) && !u.includes('기술교육') && !u.includes('교원대'))
    }
  }
]

// -------------------------------------------------------------
// 4. 그 밖의 대학 권역별 분류 정의 (사용자 지정 권역)
// -------------------------------------------------------------
function matchesAnyMajorTarget(app) {
  // 의치한약수(MED)를 제외한 30개 대학 중 하나에 해당하면 주요 대학으로 분류
  return MAJOR_TARGETS.slice(1).some(t => t.matcher(app))
}

const REGIONAL_TARGETS = [
  {
    id: 'REG_SEOUL',
    name: '서울권 (기타)',
    isRegional: true,
    matcher: (app) => {
      if (matchesAnyMajorTarget(app)) return false
      return String(app.region || '').trim() === '서울'
    }
  },
  {
    id: 'REG_GYEONGGI_INCHEON',
    name: '경기·인천권 (기타)',
    isRegional: true,
    matcher: (app) => {
      if (matchesAnyMajorTarget(app)) return false
      const r = String(app.region || '').trim()
      return r === '경기' || r === '인천'
    }
  },
  {
    id: 'REG_CHUNGCHEONG',
    name: '충청·대전·세종권',
    isRegional: true,
    matcher: (app) => {
      if (matchesAnyMajorTarget(app)) return false
      const r = String(app.region || '').trim()
      return ['충남', '충북', '대전', '세종'].includes(r)
    }
  },
  {
    id: 'REG_YEONGNAM',
    name: '영남권 (부·울·경/대경)',
    isRegional: true,
    matcher: (app) => {
      if (matchesAnyMajorTarget(app)) return false
      const r = String(app.region || '').trim()
      return ['대구', '경북', '부산', '울산', '경남'].includes(r)
    }
  },
  {
    id: 'REG_HONAM_JEJU',
    name: '호남·제주권',
    isRegional: true,
    matcher: (app) => {
      if (matchesAnyMajorTarget(app)) return false
      const r = String(app.region || '').trim()
      return ['광주', '전남', '전북', '제주'].includes(r)
    }
  },
  {
    id: 'REG_GANGWON',
    name: '강원권',
    isRegional: true,
    matcher: (app) => {
      if (matchesAnyMajorTarget(app)) return false
      return String(app.region || '').trim() === '강원'
    }
  }
]

// -------------------------------------------------------------
// 5. 통계 산출 (단일 학생 기준 고유 인원 수 & 지원 건수)
// -------------------------------------------------------------
const allPassedApps = computed(() => {
  return (filteredApplications.value || []).filter(isPass)
})

const totalUniquePassedStudents = computed(() => {
  const studentKeys = new Set(allPassedApps.value.map(getStudentKey))
  return studentKeys.size
})

const totalPassedAppsCount = computed(() => {
  return allPassedApps.value.length
})

const statsMap = computed(() => {
  const map = {}
  const passed = allPassedApps.value

  // 주요 31개 대학 매칭
  MAJOR_TARGETS.forEach(target => {
    const matchedApps = passed.filter(target.matcher)
    const studentKeys = new Set(matchedApps.map(getStudentKey))
    map[target.id] = {
      id: target.id,
      name: target.name,
      studentCount: studentKeys.size,
      applyCount: matchedApps.length,
      apps: matchedApps
    }
  })

  // 그 밖의 대학 권역별 매칭
  REGIONAL_TARGETS.forEach(target => {
    const matchedApps = passed.filter(target.matcher)
    const studentKeys = new Set(matchedApps.map(getStudentKey))
    map[target.id] = {
      id: target.id,
      name: target.name,
      studentCount: studentKeys.size,
      applyCount: matchedApps.length,
      apps: matchedApps
    }
  })

  return map
})

const majorGroupPassedStudentCount = computed(() => {
  // 의치한약수 제외 30개 주요대학의 순수 합격 학생 수
  const majorPassedApps = allPassedApps.value.filter(matchesAnyMajorTarget)
  return new Set(majorPassedApps.map(getStudentKey)).size
})

const majorGroupPassedApplyCount = computed(() => {
  return allPassedApps.value.filter(matchesAnyMajorTarget).length
})

const regionalGroupPassedStudentCount = computed(() => {
  const regionalApps = allPassedApps.value.filter(a => !matchesAnyMajorTarget(a))
  return new Set(regionalApps.map(getStudentKey)).size
})

const regionalGroupPassedApplyCount = computed(() => {
  return allPassedApps.value.filter(a => !matchesAnyMajorTarget(a)).length
})

// -------------------------------------------------------------
// 6. 클릭 상세 모달 상태
// -------------------------------------------------------------
const selectedCategoryModal = ref(null)

function openCategoryDetail(target) {
  const stat = statsMap.value[target.id]
  if (!stat || stat.studentCount === 0) return
  selectedCategoryModal.value = {
    ...stat,
    isRegional: target.isRegional || false
  }
}

// -------------------------------------------------------------
// 7. 인쇄 핸들러
// -------------------------------------------------------------
const printDateTime = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
})

function handlePrint() {
  window.print()
}
</script>

<style scoped>
@media print {
  @page {
    size: A4 portrait !important;
    margin: 8mm 10mm !important;
  }
  /* Hide interactive web chrome during print */
  :global(body) {
    background: #fff !important;
    color: #000 !important;
    font-size: 10pt !important;
  }
  :global(nav),
  :global(header),
  :global(aside),
  :global(.no-print) {
    display: none !important;
  }
  .univ-pass-count-widget {
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    width: 100% !important;
    max-width: 100% !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
</style>

