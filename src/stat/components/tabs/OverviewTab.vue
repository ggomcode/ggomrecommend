<template>
  <div class="space-y-6">
    <!-- 🎯 고3 전국연합/모평 분석 & 사탐런 진단 위젯 -->
    <SatVsGpaStrategyWidget :visibleSections="['radar', 'satamRun']" />
  </div>
</template>

<script setup>
import SatVsGpaStrategyWidget from '../SatVsGpaStrategyWidget.vue'
</script>
