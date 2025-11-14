<template>
  <div :class="$style.wrapper">
    <section :class="$style.section">
      <header>
        <h3>Earned Badges</h3>
        <span>{{ earned.length }}</span>
      </header>
      <ul :class="$style.grid">
        <li v-for="badge in earned" :key="badge.badge_key" :class="$style.badge">
          <span :class="$style.icon">{{ badge.badge_icon ?? "★" }}</span>
          <div>
            <strong>{{ badge.badge_name }}</strong>
            <small>{{ formatDate(badge.earned_at) }}</small>
          </div>
        </li>
        <li v-if="!earned.length" :class="$style.empty">No badges earned yet.</li>
      </ul>
    </section>

    <section :class="$style.section">
      <header>
        <h3>Available</h3>
        <span>{{ available.length }}</span>
      </header>
      <ul :class="$style.grid">
        <li v-for="badge in available" :key="badge.badge_key" :class="[$style.badge, $style.locked]">
          <span :class="$style.icon">🔒</span>
          <div>
            <strong>{{ badge.badge_name }}</strong>
            <small>{{ badge.badge_description }}</small>
          </div>
        </li>
        <li v-if="!available.length" :class="$style.empty">All badges unlocked!</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  earned: Array<{ badge_key: string; badge_name: string; badge_icon: string | null; earned_at: string | null }>;
  available: Array<{ badge_key: string; badge_name: string; badge_description: string | null }>;
}>();

const earned = computed(() => props.earned ?? []);
const available = computed(() => props.available ?? []);

const formatDate = (value: string | null) => {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleDateString();
};
</script>

<style module>
.wrapper {
  display: grid;
  gap: 24px;
}

.section header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section h3 {
  font-size: 1rem;
  font-weight: 600;
}

.section span {
  color: rgba(255, 255, 255, 0.6);
}

.grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

.badge {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.badge strong {
  display: block;
  color: #ffffff;
}

.badge small {
  display: block;
  color: rgba(255, 255, 255, 0.55);
}

.badge.locked {
  opacity: 0.65;
}

.icon {
  font-size: 1.5rem;
}

.empty {
  padding: 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}
</style>
