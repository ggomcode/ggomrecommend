<template>
  <svg :width="size" :height="size" viewBox="0 0 40 40" style="display: inline-block; vertical-align: middle;">
    <circle cx="20" cy="20" r="17" fill="none" stroke="#e2e8f0" stroke-width="6" />
    <circle
      v-if="numFilled > 0"
      cx="20"
      cy="20"
      r="17"
      fill="none"
      :stroke="isFull ? '#ef4444' : '#2563eb'"
      stroke-width="6"
      :stroke-dasharray="`${arc} ${circ}`"
      :stroke-dashoffset="circ / 4"
      :stroke-linecap="isFull ? 'butt' : 'round'"
    />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  filled: { default: 0 },
  total:  { default: 0 },
  size:   { type: Number, default: 40 },
})

const R    = 17
const circ = 2 * Math.PI * R
const numFilled = computed(() => Number(props.filled) || 0)
const numTotal  = computed(() => Number(props.total) || 0)
const arc  = computed(() => (numTotal.value > 0 ? numFilled.value / numTotal.value : 0) * circ)
const isFull = computed(() => numFilled.value >= numTotal.value && numTotal.value > 0)
</script>

