<template>
  <Teleport to="body">
    <div v-if="open" :class="$style.backdrop" @click.self="emit('close')">
      <div :class="$style.modal">
        <header :class="$style.header">
          <h2>Badge Unlocked</h2>
          <button type="button" :class="$style.close" @click="emit('close')">×</button>
        </header>

        <section :class="$style.body">
          <span :class="$style.icon">{{ badge.badge_icon ?? "🏅" }}</span>
          <h3>{{ badge.badge_name }}</h3>
          <p>{{ badge.badge_description ?? "Incredible progress—keep going!" }}</p>
        </section>

        <footer :class="$style.footer">
          <button type="button" @click="emit('close')">Awesome!</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  badge: { badge_name: string; badge_description?: string | null; badge_icon?: string | null };
}>();

const badge = computed(() => props.badge ?? { badge_name: "New Badge" });
const open = computed(() => props.open);
const emit = defineEmits<{ (event: "close"): void }>();
</script>

<style module>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 16, 28, 0.7);
  display: grid;
  place-items: center;
  z-index: 1000;
}

.modal {
  width: min(420px, 92vw);
  border-radius: 20px;
  background: linear-gradient(150deg, rgba(28, 20, 41, 0.95), rgba(14, 16, 32, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 26px 60px rgba(9, 10, 20, 0.55);
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.close {
  background: transparent;
  border: none;
  font-size: 1.4rem;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.body {
  padding: 28px;
  text-align: center;
  display: grid;
  gap: 14px;
}

.icon {
  font-size: 2rem;
}

.body h3 {
  font-size: 1.3rem;
  font-weight: 600;
}

.body p {
  margin: 0;
  color: rgba(255, 255, 255, 0.75);
}

.footer {
  padding: 16px 24px 22px;
}

.footer button {
  width: 100%;
  padding: 12px 15px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-weight: 600;
  letter-spacing: 0.06em;
  cursor: pointer;
}
</style>
