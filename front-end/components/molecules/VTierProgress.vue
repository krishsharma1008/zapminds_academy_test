<template>
  <div :class="$style.wrapper">
    <div :class="$style.header">
      <span :class="$style.tier">{{ tier }}</span>
      <span :class="$style.percent">{{ percent }}%</span>
    </div>
    <div :class="$style.track">
      <span :style="{ '--progress': percent / 100 }"></span>
    </div>
    <p v-if="note" :class="$style.note">{{ note }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  tier: string;
  percent: number;
  note?: string;
}>();

const percent = computed(() => Math.min(Math.max(props.percent ?? 0, 0), 100));
const tier = computed(() => props.tier ?? "Bronze");
const note = computed(() => props.note ?? "");
</script>

<style module>
.wrapper {
  display: grid;
  gap: 8px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tier {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.percent {
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.75);
}

.track {
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.track span {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #4f8aff, #6f4bff);
  transform-origin: left center;
  transform: scaleX(var(--progress));
  transition: transform 240ms ease;
}

.note {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}
</style>
