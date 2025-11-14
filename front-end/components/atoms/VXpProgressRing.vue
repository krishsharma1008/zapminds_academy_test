<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  currentXp: number;
  maxXp: number;
  size?: number;
  strokeWidth?: number;
  tierColor?: string;
  showLabel?: boolean;
}>();

const size = computed(() => props.size || 120);
const strokeWidth = computed(() => props.strokeWidth || 8);
const radius = computed(() => (size.value - strokeWidth.value) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const progress = computed(() => Math.min(props.currentXp / props.maxXp, 1));
const dashOffset = computed(() => circumference.value * (1 - progress.value));
const percentage = computed(() => Math.round(progress.value * 100));
const tierColor = computed(() => props.tierColor || "var(--color-accent)");
</script>

<template>
  <div :class="$style.root" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" :class="$style.svg">
      <!-- Background circle -->
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        :class="$style.circleBackground"
        :stroke-width="strokeWidth"
      />
      
      <!-- Progress circle -->
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        :class="$style.circleProgress"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        :style="{ stroke: tierColor }"
      />
    </svg>

    <!-- Center label -->
    <div v-if="showLabel" :class="$style.label">
      <span :class="$style.percentage">{{ percentage }}%</span>
      <span :class="$style.xpText">{{ currentXp }} / {{ maxXp }}</span>
    </div>
  </div>
</template>

<style module lang="scss">
.root {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.svg {
  transform: rotate(-90deg);
}

.circleBackground {
  fill: none;
  stroke: color-mix(in srgb, var(--foreground-color) 10%, transparent);
  stroke-linecap: round;
}

.circleProgress {
  fill: none;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.6s ease-out;
  filter: drop-shadow(0 0 4px currentColor);
}

.label {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.2rem;
}

.percentage {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--foreground-color);
  line-height: 1;
}

.xpText {
  font-size: 0.7rem;
  opacity: 0.6;
  line-height: 1;
}
</style>

