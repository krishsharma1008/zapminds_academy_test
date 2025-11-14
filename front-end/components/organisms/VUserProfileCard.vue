<script setup lang="ts">
import { ref, computed } from "vue";
import { getTierByName } from "~/utils/xp-tiers";

interface UserProfile {
  userId: string;
  displayName: string;
  xpTotal: number;
  currentTier: string;
  currentStreak: number;
  longestStreak: number;
  completedModules: number;
  badges: Array<{
    badgeName: string;
    badgeIcon: string;
    earnedAt: string;
  }>;
}

const props = defineProps<{
  profile: UserProfile;
  isExpanded?: boolean;
}>();

const emit = defineEmits<{
  (event: "toggle"): void;
  (event: "close"): void;
}>();

const isExpanded = ref(props.isExpanded || false);

const tier = computed(() => getTierByName(props.profile.currentTier));
const recentBadges = computed(() => props.profile.badges.slice(0, 3));

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
  emit("toggle");
};
</script>

<template>
  <div :class="[$style.root, isExpanded && $style.expanded]">
    <button
      type="button"
      :class="$style.header"
      @click="toggleExpanded"
      :aria-expanded="isExpanded"
    >
      <div :class="$style.headerContent">
        <div :class="$style.avatar">
          <span>{{ profile.displayName.charAt(0).toUpperCase() }}</span>
        </div>
        <div :class="$style.headerInfo">
          <strong :class="$style.name">{{ profile.displayName }}</strong>
          <VTierBadge v-if="tier" :tier-name="tier.name" size="small" />
        </div>
      </div>
      <svg
        :class="[$style.chevron, isExpanded && $style.chevronExpanded]"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <div v-if="isExpanded" :class="$style.content">
      <!-- Stats Grid -->
      <div :class="$style.stats">
        <div :class="$style.stat">
          <span :class="$style.statLabel">Total XP</span>
          <strong :class="$style.statValue">{{ profile.xpTotal }}</strong>
        </div>
        <div :class="$style.stat">
          <span :class="$style.statLabel">Current Streak</span>
          <strong :class="$style.statValue">{{ profile.currentStreak }} days</strong>
        </div>
        <div :class="$style.stat">
          <span :class="$style.statLabel">Longest Streak</span>
          <strong :class="$style.statValue">{{ profile.longestStreak }} days</strong>
        </div>
        <div :class="$style.stat">
          <span :class="$style.statLabel">Modules Completed</span>
          <strong :class="$style.statValue">{{ profile.completedModules }}</strong>
        </div>
      </div>

      <!-- Recent Badges -->
      <div v-if="recentBadges.length" :class="$style.badges">
        <h4 :class="$style.badgesTitle">Recent Badges</h4>
        <ul :class="$style.badgesList">
          <li v-for="badge in recentBadges" :key="badge.badgeName" :class="$style.badgeItem">
            <span :class="$style.badgeIcon">{{ badge.badgeIcon }}</span>
            <div :class="$style.badgeInfo">
              <strong>{{ badge.badgeName }}</strong>
              <small>{{ new Date(badge.earnedAt).toLocaleDateString() }}</small>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
.root {
  background: color-mix(in srgb, var(--background-color) 95%, transparent);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: var(--shadow-elevation-low);
  transition: all 0.3s ease;

  &.expanded {
    box-shadow: var(--shadow-elevation-medium);
  }
}

.header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: color-mix(in srgb, var(--background-color) 90%, transparent);
  }
}

.headerContent {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-accent) 70%, black) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-accent-contrast);
  flex-shrink: 0;
}

.headerInfo {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

.name {
  font-size: 1.1rem;
  color: var(--foreground-color);
}

.chevron {
  transition: transform 0.3s ease;
  opacity: 0.6;
  flex-shrink: 0;

  &.chevronExpanded {
    transform: rotate(180deg);
  }
}

.content {
  padding: 0 1rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.75rem;
  background: color-mix(in srgb, var(--background-color) 85%, transparent);
  border-radius: 0.6rem;
}

.statLabel {
  font-size: 0.8rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.statValue {
  font-size: 1.2rem;
  color: var(--color-accent);
}

.badges {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.badgesTitle {
  font-size: 0.9rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
  margin: 0;
}

.badgesList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.badgeItem {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: color-mix(in srgb, var(--background-color) 85%, transparent);
  border-radius: 0.6rem;
}

.badgeIcon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}

.badgeInfo {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  strong {
    font-size: 0.9rem;
  }

  small {
    font-size: 0.75rem;
    opacity: 0.6;
  }
}
</style>

