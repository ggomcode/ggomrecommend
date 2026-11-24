<template>
  <div class="space-y-6">
    <!-- 🎯 고3 전국연합/모평 분석 & 사탐런 진단 위젯 (1. 내신 vs 모평 등급 비교 & 2. 사탐런 분석) -->
    <SatVsGpaStrategyWidget :visibleSections="['radar', 'satamRun']" />

    <!-- 🎓 3. 수능 가채점 분석 (또는 수능 결과 분석) 위젯 -->
    <CsatAnalysisWidget />
  </div>
</template>

<script setup>
import SatVsGpaStrategyWidget from '../SatVsGpaStrategyWidget.vue'
import CsatAnalysisWidget from '../CsatAnalysisWidget.vue'
</script>
