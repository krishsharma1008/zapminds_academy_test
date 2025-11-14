<template>
  <transition name="xp-float">
    <span v-if="visible" :class="$style.badge">+{{ xp }} XP</span>
  </transition>
</template>

<script setup lang="ts">
const props = defineProps<{ xp: number; visible: boolean }>();

const xp = computed(() => Math.max(props.xp ?? 0, 0));
const visible = computed(() => props.visible);
</script>

<style module>
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(111, 75, 255, 0.95), rgba(79, 138, 255, 0.95));
  color: #ffffff;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  box-shadow: 0 12px 30px rgba(79, 138, 255, 0.4);
}

.xp-float-enter-active,
.xp-float-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.xp-float-enter-from,
.xp-float-leave-to {
  opacity: 0;
  transform: translateY(18px);
}

.xp-float-enter-to,
.xp-float-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
