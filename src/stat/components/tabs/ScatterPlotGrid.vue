<template>
  <div class="scatter-grid-wrapper select-none">
    <!-- Top Numbers Axis (1 to 9) -->
    <div class="grid-header-row flex items-end">
      <!-- Left corner (above university names) -->
      <div class="univ-col-header shrink-0"></div>

      <!-- Right axis numbers area (aligned with chart grid lines) -->
      <div class="plot-header-area flex-1 relative">
        <div 
          v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]" 
          :key="num"
          class="axis-num-label"
          :style="{ left: `${((num - 1) / 8) * 100}%` }"
        >
          {{ num }}
        </div>
      </div>
    </div>

    <!-- Main Chart Grid Box -->
    <div class="chart-outer-box flex">
      <!-- Left Column: 20 University Names -->
      <div class="univ-names-column shrink-0 flex flex-col">
        <div
          v-for="(univ, idx) in paddedUniversities"
          :key="idx"
          class="univ-row-label flex items-center justify-end"
          :class="{ 'has-border-bottom': idx < 19 }"
        >
          <div v-if="univ" class="univ-name-wrap">
            <span
              :class="[
                'univ-badge-text',
                isHighlighted(univ) ? 'highlighted-univ' : 'normal-univ'
              ]"
              :title="univ"
            >
              {{ univ }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right Column: 20 Chart Rows with Grid Lines & Markers -->
      <div class="chart-canvas-column flex-1 relative flex flex-col">
        <!-- Background Vertical Grid Lines (1 ~ 9 and halves) -->
        <div class="grid-lines-overlay absolute inset-0 pointer-events-none">
          <!-- Main integer vertical lines (1 to 9) -->
          <div
            v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
            :key="`vline-${num}`"
            class="v-line"
            :style="{ left: `${((num - 1) / 8) * 100}%` }"
          ></div>

          <!-- Half lines (1.5, 2.5, ... 8.5) -->
          <div
            v-for="half in [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5]"
            :key="`half-${half}`"
            class="v-line-half"
            :style="{ left: `${((half - 1) / 8) * 100}%` }"
          ></div>
        </div>

        <!-- 20 University Data Rows -->
        <div
          v-for="(univ, idx) in paddedUniversities"
          :key="idx"
          class="univ-plot-row relative flex items-center"
          :class="{ 'has-border-bottom': idx < 19 }"
        >
          <!-- Plot Points for this University -->
          <template v-if="univ && rowPointsMap[univ]">
            <div
              v-for="pt in rowPointsMap[univ]"
              :key="pt.id"
              class="marker-item"
              :class="[
                pt.markerType === 'pass' ? 'pass-marker' : (pt.markerType === 'stage1' ? 'stage1-marker' : 'fail-marker'),
                !isPrintMode ? 'cursor-pointer hover:z-20' : ''
              ]"
              :style="{
                left: `calc(${pt.leftPct}% + ${pt.pixelOffset}px)`
              }"
              @mouseenter="handleMouseEnter(pt, $event)"
              @mouseleave="handleMouseLeave"
            >
              <!-- Final Pass: Blue Filled Circle ● -->
              <span v-if="pt.markerType === 'pass'" class="dot-symbol pass-dot">●</span>
              <!-- Stage 1 Pass (when enabled): Emerald Green Filled Triangle ▲ -->
              <span v-else-if="pt.markerType === 'stage1'" class="triangle-symbol stage1-triangle">▲</span>
              <!-- Fail: Red/Coral Cross ✕ -->
              <span v-else class="cross-symbol">✕</span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { maskName } from '../../composables/useStatData'

const props = defineProps({
  universities: {
    type: Array,
    default: () => []
  },
  applications: {
    type: Array,
    default: () => []
  },
  isPrintMode: {
    type: Boolean,
    default: false
  },
  isPrivacyMasked: {
    type: Boolean,
    default: false
  },
  showStage1Pass: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['point-hover'])

// Always pad universities to exactly 20 rows to keep identical page proportions
const paddedUniversities = computed(() => {
  const list = [...props.universities]
  while (list.length < 20) {
    list.push(null)
  }
  return list
})

// Highlight target universities (as identified in the official PDF)
const HIGHLIGHT_SET = new Set([
  '가천대학교(성남)',
  '강남대학교(용인)',
  '건국대학교(서울)',
  '경기대학교(수원)',
  '경희대학교(국제)',
  '경희대학교(서울)',
  '고려대학교(서울)',
  '국립공주대학교(공주)',
  '국립한국교통대학교(의왕)',
  '단국대학교(죽전)',
  '동국대학교(서울)',
  '명지대학교(용인)',
  '백석대학교(천안)',
  '서강대학교(서울)',
  '서울대학교(서울)',
  '서울시립대학교(서울)',
  '성균관대학교(서울)',
  '성균관대학교(수원)',
  '세종대학교(서울)',
  '수원대학교(수원)',
  '숙명여자대학교(서울)',
  '숭실대학교(서울)',
  '아주대학교(수원)',
  '연세대학교(서울)',
  '용인대학교(용인)',
  '이화여자대학교(서울)',
  '전남대학교(광주)',
  '전주교육대학교(전주)',
  '중앙대학교(서울)',
  '청주교육대학교(청주)',
  '춘천교육대학교(춘천)',
  '한경국립대학교(안성)',
  '한국공학대학교(시흥)',
  '한국에너지공과대학교',
  '한국외국어대학교(용인) - 글로벌캠퍼스',
  '한국외국어대학교(용인)',
  '한양대학교(ERICA)',
  '한양대학교(서울)',
  '홍익대학교(서울)',
  '홍익대학교(세종)'
])

function isHighlighted(univName) {
  if (!univName) return false
  if (HIGHLIGHT_SET.has(univName)) return true
  // Fuzzy match for minor naming differences
  for (const target of HIGHLIGHT_SET) {
    if (univName.startsWith(target) || target.startsWith(univName)) {
      return true
    }
  }
  return false
}

// Compute points for each university with micro-jitter for overlapping identical grades
const rowPointsMap = computed(() => {
  const map = {}
  if (!props.applications || props.applications.length === 0) return map

  // Filter applications for current university list
  const activeUnivSet = new Set(props.universities.filter(Boolean))

  // Group applications by university
  for (const app of props.applications) {
    const uName = (app.univName || '').trim()
    if (!activeUnivSet.has(uName)) continue

    // Extract Grade
    const rawGrade = app.allSubjectGrade || app.score9Grade || app.mainSubjectGrade
    if (rawGrade == null || isNaN(rawGrade)) continue
    const grade = Number(rawGrade)
    if (grade < 1.0 || grade > 9.0) continue

    // Determine Stage 1 Pass & Final Pass / Fail
    const s1 = String(app.stage1 || '').trim()
    const isStage1Passed = (s1.includes('합격') || s1.includes('통과')) && !s1.includes('불합')

    const finalRes = String(app.finalStage || '').trim()
    const isFinalPass = (finalRes.includes('합격') || finalRes.includes('충원') || finalRes.includes('최초') || app.registerStatus === 'Y') && !finalRes.includes('불합')

    let markerType = 'fail'
    let isPass = false
    let isStage1Pass = false
    let resultText = ''
    let resultBadge = ''

    if (isFinalPass) {
      markerType = 'pass'
      isPass = true
      resultText = app.registerStatus === 'Y' ? '최종합격(등록)' : (finalRes || '최종합격')
      resultBadge = '최종합격'
    } else if (isStage1Passed) {
      isStage1Pass = true
      markerType = props.showStage1Pass ? 'stage1' : 'fail'
      resultText = finalRes ? `1차합격 후 ${finalRes}` : '1차합격 (최종불합격)'
      resultBadge = '1차합격'
    } else {
      markerType = 'fail'
      resultText = finalRes || s1 || '불합격'
      resultBadge = '불합격'
    }

    if (!map[uName]) map[uName] = []

    // Calculate left percentage: 1.0 -> 0%, 9.0 -> 100%
    const leftPct = ((grade - 1.0) / 8.0) * 100

    map[uName].push({
      id: app.id || `${uName}_${grade}_${Math.random()}`,
      univName: uName,
      grade,
      leftPct,
      isPass,
      isStage1Pass,
      markerType,
      resultText,
      resultBadge,
      stage1: s1,
      finalStage: finalRes,
      dept: app.dept,
      admissionMajorType: app.admissionMajorType,
      admissionDetailType: app.admissionDetailType,
      studentName: app.name,
      classNum: app.classNum,
      studentNum: app.studentNum,
      registerStatus: app.registerStatus,
      candidateRank: app.candidateRank,
      pixelOffset: 0
    })
  }

  // Calculate micro-offset for identical / very close points on the same university row
  for (const uName of Object.keys(map)) {
    const list = map[uName]
    // Sort primarily by grade, secondarily by marker precedence (pass -> stage1 -> fail)
    const markerOrder = { pass: 1, stage1: 2, fail: 3 }
    list.sort((a, b) => a.grade - b.grade || ((markerOrder[a.markerType] || 3) - (markerOrder[b.markerType] || 3)))

    // Cluster points within 0.03 grade diff
    const clusters = []
    let currentCluster = []

    for (let i = 0; i < list.length; i++) {
      const pt = list[i]
      if (currentCluster.length === 0) {
        currentCluster.push(pt)
      } else {
        const prev = currentCluster[currentCluster.length - 1]
        if (Math.abs(pt.grade - prev.grade) <= 0.02) {
          currentCluster.push(pt)
        } else {
          clusters.push(currentCluster)
          currentCluster = [pt]
        }
      }
    }
    if (currentCluster.length > 0) clusters.push(currentCluster)

    // Apply symmetrical offsets: [0], [-3, 3], [-5, 0, 5], etc.
    for (const cluster of clusters) {
      if (cluster.length === 1) {
        cluster[0].pixelOffset = 0
      } else {
        const n = cluster.length
        const step = 4 // 4px spacing between identical grade markers
        const start = -((n - 1) * step) / 2
        for (let j = 0; j < n; j++) {
          cluster[j].pixelOffset = start + j * step
        }
      }
    }
  }

  return map
})

function handleMouseEnter(pt, event) {
  if (props.isPrintMode) return
  emit('point-hover', {
    ...pt,
    studentName: maskName(pt.studentName),
    clientX: event.clientX,
    clientY: event.clientY
  })
}

function handleMouseLeave() {
  if (props.isPrintMode) return
  emit('point-hover', null)
}
</script>

<style scoped>
.scatter-grid-wrapper {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Pretendard", sans-serif;
}

/* Header Row with 1 ~ 9 Axis numbers */
.grid-header-row {
  height: 26px;
  margin-bottom: 2px;
}

.univ-col-header {
  width: 175px;
}

.plot-header-area {
  height: 100%;
}

.axis-num-label {
  position: absolute;
  bottom: 2px;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

/* Outer Chart Box */
.chart-outer-box {
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
}

/* University Names Column */
.univ-names-column {
  width: 175px;
  border-right: 1px solid #cbd5e1;
  background-color: #ffffff;
}

.univ-row-label {
  height: 27px;
  padding-right: 8px;
  box-sizing: border-box;
}

.has-border-bottom {
  border-bottom: 1px solid #e2e8f0;
}

.univ-name-wrap {
  display: flex;
  justify-content: flex-end;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.univ-badge-text {
  font-size: 10.5px;
  line-height: 1.2;
  white-space: nowrap;
}

.normal-univ {
  color: #334155;
  font-weight: 500;
}

.highlighted-univ {
  background-color: #ffe4e6;
  color: #9f1239;
  font-weight: 700;
  padding: 1.5px 5px;
  border-radius: 4px;
  letter-spacing: -0.2px;
}

/* Canvas Area */
.chart-canvas-column {
  background-color: #ffffff;
  overflow: hidden;
}

.univ-plot-row {
  height: 27px;
  position: relative;
  box-sizing: border-box;
}

/* Vertical Grid Lines */
.v-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: #e2e8f0;
  transform: translateX(-0.5px);
}

.v-line-half {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  border-left: 1px dotted #f1f5f9;
  transform: translateX(-0.5px);
}

/* Plot Markers */
.marker-item {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s ease;
  user-select: none;
}

.pass-marker {
  z-index: 3;
}

.stage1-marker {
  z-index: 2;
}

.fail-marker {
  z-index: 1;
}

/* Dots: Blue Filled Circle ● */
.dot-symbol {
  font-size: 13px;
  line-height: 1;
  text-shadow: 0 0 1px rgba(255, 255, 255, 0.9);
}

.pass-dot {
  color: #2563eb;
}

/* Stage 1 Triangle: Emerald Green Filled Triangle ▲ */
.triangle-symbol {
  font-size: 11px;
  line-height: 1;
  text-shadow: 0 0 1px rgba(255, 255, 255, 0.9);
}

.stage1-triangle {
  color: #059669;
}

/* Fail Cross: Red ✕ */
.cross-symbol {
  font-size: 11px;
  font-weight: 800;
  color: #e11d48;
  line-height: 1;
  text-shadow: 0 0 1px rgba(255, 255, 255, 0.9);
}

/* Print Exact Rendering */
@media print {
  .chart-outer-box {
    border: 1px solid #94a3b8 !important;
  }
  .univ-names-column {
    border-right: 1px solid #94a3b8 !important;
  }
  .has-border-bottom {
    border-bottom: 1px solid #cbd5e1 !important;
  }
  .v-line {
    background-color: #cbd5e1 !important;
  }
  .v-line-half {
    border-left: 1px dotted #e2e8f0 !important;
  }
  .highlighted-univ {
    background-color: #ffe4e6 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .pass-dot {
    color: #1d4ed8 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .stage1-triangle {
    color: #047857 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .cross-symbol {
    color: #be123c !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
