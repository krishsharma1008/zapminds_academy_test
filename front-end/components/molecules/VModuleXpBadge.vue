<template>
  <span :class="[$style.badge, status && $style[`badge--${status}`]]">
    +{{ xp }} XP
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  xp: number;
  status?: "default" | "completed" | "locked";
}>();

const xp = computed(() => Math.max(props.xp ?? 0, 0));
const status = computed(() => props.status ?? "default");
</script>

<style module>
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(79, 138, 255, 0.12);
  color: #9cc4ff;
  border: 1px solid rgba(79, 138, 255, 0.25);
}

.badge--completed {
  background: rgba(88, 230, 164, 0.14);
  color: #a4fbc5;
  border-color: rgba(88, 230, 164, 0.3);
}

.badge--locked {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.45);
  border-color: rgba(255, 255, 255, 0.18);
}
</style>
