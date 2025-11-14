<template>
  <Teleport to="body">
    <div v-if="open" :class="$style.backdrop" @click.self="emit('close')">
      <div :class="$style.modal">
        <header :class="$style.header">
          <h2>Tier Up!</h2>
          <button type="button" :class="$style.close" @click="emit('close')">×</button>
        </header>

        <section :class="$style.body">
          <span :class="$style.icon">{{ tier.icon ?? "⭐" }}</span>
          <h3>{{ tier.name }}</h3>
          <p>{{ message }}</p>
        </section>

        <footer :class="$style.footer">
          <button type="button" @click="emit('close')">Continue</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  tier: { name: string; icon?: string; color?: string };
  message?: string;
}>();

const emit = defineEmits<{ (event: "close"): void }>();

const tier = computed(() => props.tier ?? { name: "New Tier" });
const message = computed(
  () =>
    props.message ?? `You just unlocked the ${tier.value.name} tier. Keep the streak alive to climb higher!`
);
const open = computed(() => props.open);
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
  width: min(480px, 92vw);
  border-radius: 20px;
  background: linear-gradient(160deg, rgba(21, 21, 38, 0.95), rgba(11, 12, 24, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 30px 70px rgba(10, 12, 28, 0.6);
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header h2 {
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.body {
  padding: 32px 28px;
  text-align: center;
  display: grid;
  gap: 16px;
}

.icon {
  font-size: 2.4rem;
}

.body h3 {
  font-size: 1.4rem;
  font-weight: 600;
}

.body p {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
}

.footer {
  padding: 16px 24px 24px;
}

.footer button {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  background: #4f8aff;
  color: #ffffff;
  font-weight: 600;
  letter-spacing: 0.06em;
  cursor: pointer;
}
</style>
