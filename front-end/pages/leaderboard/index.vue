<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useStudentAuth } from "~/composables/use-auth";
import { getTierByName } from "~/utils/xp-tiers";

const pageTitle = "Leaderboard – Zapminds Academy";

useSeoMeta({
  title: pageTitle,
  description:
    "Track Zapminds Academy rankings, seasonal badges, and mission awards. Earn XP from shipped projects, streaks, and quests.",
});

type LeaderboardPlayer = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  xp: number;
  weeklyXp: number;
  streak: number;
  projects: number;
  weeklyProjects: number;
  modules: number;
  moduleTarget: number;
  weeklyModules: number;
  badges: string[];
  trend: "up" | "down" | "steady";
  tier?: string;
  tier_icon?: string;
  rank?: number;
};

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  xp_total: number;
  tier: string;
  tier_icon: string;
  is_current_user?: boolean;
  avatar_url?: string;
}

interface LeaderboardResponse {
  season: {
    id: number;
    name: string;
    starts_at: string;
    ends_at: string | null;
  } | null;
  entries: LeaderboardEntry[];
  userEntry: LeaderboardEntry | null;
}

const { profile } = useStudentAuth();
const players = ref<LeaderboardPlayer[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Fetch leaderboard data from API
const fetchLeaderboard = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const { authFetch } = useApiClient();
    const response = await authFetch<LeaderboardResponse>("/api/leaderboard/current", {
      method: "GET",
    });

    // Map API data to UI format
    players.value = response.entries.map((entry) => {
      const initials = entry.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return {
        id: entry.user_id,
        name: entry.display_name,
        handle: `@${entry.display_name.toLowerCase().replace(/\s+/g, ".")}`,
        avatar: initials,
        xp: entry.xp_total,
        weeklyXp: entry.xp_weekly,
        streak: entry.streak,
        projects: 0, // TODO: Add project count to API
        weeklyProjects: 0, // TODO: Add weekly projects to API
        modules: entry.modules_completed,
        moduleTarget: 60,
        weeklyModules: entry.modules_weekly,
        badges: entry.badge_icon ? [entry.badge_icon] : [],
        trend: "steady" as const,
        tier: entry.tier,
        tier_icon: entry.tier_icon,
        rank: entry.rank,
      };
    });
  } catch (e: any) {
    error.value = e.data?.message || e.message || "Failed to load leaderboard.";
    console.error("Error fetching leaderboard:", e);
  } finally {
    isLoading.value = false;
  }
};

// Fetch on mount
onMounted(() => {
  fetchLeaderboard();
});

const leaderboardMode = ref<"overall" | "weekly">("overall");

const sortedPlayers = computed(() => {
  const list = [...players.value];
  if (leaderboardMode.value === "weekly") {
    return list.sort((a, b) => b.weeklyXp - a.weeklyXp);
  }

  return list.sort((a, b) => b.xp - a.xp);
});

const topThree = computed(() => sortedPlayers.value.slice(0, 3));
const contenders = computed(() => sortedPlayers.value.slice(3));

const currentPlayer = computed(() => {
  // If logged in, show the authenticated user's card
  if (profile.value?.user_id) {
    const userPlayer = sortedPlayers.value.find((player) => player.id === profile.value?.user_id);
    if (userPlayer) return userPlayer;
  }
  
  // Otherwise, show the #1 ranked player as a demo
  return sortedPlayers.value[0] || null;
});

const xpTarget = 2600;
const xpCompletion = computed(() => {
  if (!currentPlayer.value) return 0;
  return Math.min(1, currentPlayer.value.xp / xpTarget);
});

type Award = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

const awards = computed<Award[]>(() => {
  if (!currentPlayer.value) return [];
  const player = currentPlayer.value;
  const earned: Award[] = [];

  if (player.streak >= 10) {
    earned.push({
      id: "streak-legend",
      title: "Streak Legend",
      description: "Keep learning 10+ days in a row to activate bonus XP.",
      icon: "🔥",
    });
  }

  if (player.modules >= player.moduleTarget) {
    earned.push({
      id: "module-master",
      title: "Module Master",
      description: "Completed every module on this season’s roadmap.",
      icon: "🎯",
    });
  } else if (player.modules >= player.moduleTarget * 0.85) {
    earned.push({
      id: "closing-loop",
      title: "Closing the Loop",
      description: "You’re within reach of your module target—finish strong!",
      icon: "🚀",
    });
  }

  if (player.projects >= 10) {
    earned.push({
      id: "ship-champion",
      title: "Shipping Champion",
      description: "Delivered 10+ portfolio-ready projects.",
      icon: "🛠️",
    });
  }

  if (player.weeklyXp >= 350) {
    earned.push({
      id: "weekly-dominator",
      title: "Weekly Dominator",
      description: "Earned 350+ XP in a single week. The multiplier is live.",
      icon: "🏆",
    });
  }

  return earned;
});

const xpLabel = computed(() =>
  leaderboardMode.value === "weekly" ? "Weekly XP" : "Total XP"
);

const xpValue = (player: LeaderboardPlayer) =>
  leaderboardMode.value === "weekly" ? player.weeklyXp : player.xp;

const switchMode = (mode: "overall" | "weekly") => {
  leaderboardMode.value = mode;
};
</script>

<template>
  <div :class="$style.root">
    <div :class="$style.backdrop"></div>

    <main class="container" :class="$style.content">
      <!-- Loading State -->
      <div v-if="isLoading" :class="$style.loading">
        <div :class="$style.spinner"></div>
        <p>Loading leaderboard...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" :class="$style.errorState">
        <h2>⚠️ Unable to Load Leaderboard</h2>
        <p>{{ error }}</p>
        <button type="button" :class="$style['hero-button']" @click="fetchLeaderboard">
          Try Again
        </button>
      </div>

      <!-- Main Content -->
      <template v-else>
        <section :class="$style.hero">
          <div :class="$style['hero-copy']">
            <span>{{ sortedPlayers.length }} contenders</span>
            <h1>Leaderboard</h1>
          <p>
            Track the Zapminds momentum. Earn XP from shipped projects, streak bonuses,
            and community quests. Toggle views to see weekly pushes or overall dominance.
          </p>

          <div :class="$style['mode-toggle']">
            <button
              type="button"
              :class="[
                $style['mode-toggle__button'],
                leaderboardMode === 'overall' && $style['mode-toggle__button--active'],
              ]"
              @click="switchMode('overall')"
            >
              Overall
            </button>
            <button
              type="button"
              :class="[
                $style['mode-toggle__button'],
                leaderboardMode === 'weekly' && $style['mode-toggle__button--active'],
              ]"
              @click="switchMode('weekly')"
            >
              Weekly
            </button>
            <span :class="$style['mode-toggle__glow']" :data-mode="leaderboardMode"></span>
          </div>

          <div :class="$style['hero-actions']">
            <button
              type="button"
              :class="$style['hero-button']"
              :disabled="isLoading"
              @click="fetchLeaderboard"
            >
              {{ isLoading ? 'Refreshing...' : 'Refresh Rankings' }}
            </button>
            <NuxtLink to="/" :class="$style['hero-button']">Back to dashboard</NuxtLink>
          </div>
        </div>

        <div v-if="currentPlayer" :class="$style['player-card']">
          <header>
            <span>{{ profile?.user_id === currentPlayer.id ? 'You' : '#1 Ranked' }}</span>
            <strong>{{ currentPlayer.name }}</strong>
            <small>{{ currentPlayer.handle }}</small>
          </header>

          <div :class="$style['player-stats']">
            <div>
              <span>{{ xpLabel }}</span>
              <strong>{{ xpValue(currentPlayer) }}</strong>
            </div>
            <div>
              <span>Streak</span>
              <strong>{{ currentPlayer.streak }} days</strong>
            </div>
            <div>
              <span>Modules</span>
              <strong>
                <!-- {{
                  leaderboardMode === "weekly"
                    ? currentPlayer.weeklyProjects
                    : currentPlayer.projects
                }} -->
                {{ currentPlayer.modules }}/60
              </strong>
            </div>
          </div>

          <div :class="$style['player-progress']">
            <span>Next tier: {{ xpTarget - currentPlayer.xp }} XP remaining</span>
            <span :style="{ '--progress': xpCompletion }"></span>
          </div>

          <ul :class="$style['player-badges']">
            <li v-for="badge in currentPlayer.badges" :key="badge">{{ badge }}</li>
          </ul>

          <div v-if="awards.length" :class="$style['player-awards']">
            <h4>Awards unlocked</h4>
            <ul>
              <li v-for="award in awards" :key="award.id">
                <span>{{ award.icon }}</span>
                <div>
                  <strong>{{ award.title }}</strong>
                  <p>{{ award.description }}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section :class="$style['podium']">
        <article
          v-for="(player, index) in topThree"
          :key="player.id"
          :class="[$style['podium-card'], $style[`podium-card--${index + 1}`]]"
        >
          <div :class="$style['podium-meta']">
            <span>#{{ index + 1 }}</span>
            <div>{{ player.avatar }}</div>
          </div>
          <h3>{{ player.name }}</h3>
          <p>{{ player.handle }}</p>
          <div :class="$style['podium-stats']">
            <div>
              <span>{{ xpLabel }}</span>
              <strong>{{ xpValue(player) }}</strong>
            </div>
            <div>
              <span>Streak</span>
              <strong>{{ player.streak }}d</strong>
            </div>
            <div>
              <span>Projects</span>
              <strong>
                {{ leaderboardMode === "weekly" ? player.weeklyProjects : player.projects }}
              </strong>
            </div>
          </div>
          <ul :class="$style['podium-badges']">
            <li v-for="badge in player.badges" :key="badge">{{ badge }}</li>
          </ul>
        </article>
      </section>

      <section :class="$style['table']">
        <header>
          <h2>Season progress</h2>
          <p>
            Ranking updates every hour. Earn XP from module mastery, shipped projects,
            and bonus quests. Keep your streak alive to activate the multiplier.
          </p>
        </header>

        <ul>
          <li
            v-for="player in contenders"
            :key="player.id"
            :class="[$style['table-row'], $style[`table-row--${player.trend}`]]"
          >
            <div :class="$style['table-rank']">
              <span>#{{ sortedPlayers.findIndex((p) => p.id === player.id) + 1 }}</span>
              <div>{{ player.avatar }}</div>
              <div>
                <strong>{{ player.name }}</strong>
                <small>{{ player.handle }}</small>
              </div>
            </div>

            <div :class="$style['table-xp']">
              <strong>{{ xpValue(player) }}</strong>
              <span>{{ xpLabel }}</span>
            </div>

            <div :class="$style['table-progress']">
              <span v-if="leaderboardMode === 'overall'">
                {{ player.modules }}/{{ player.moduleTarget }} modules
              </span>
              <span v-else>
                {{ player.weeklyModules }} modules this week
              </span>
              <span
                :style="{
                  '--progress':
                    leaderboardMode === 'overall'
                      ? Math.min(1, player.modules / player.moduleTarget)
                      : Math.min(1, player.weeklyModules / Math.max(1, player.moduleTarget / 4)),
                }"
              ></span>
            </div>

            <div :class="$style['table-streak']">
              <span>{{ player.streak }}d streak</span>
              <span v-if="leaderboardMode === 'overall'">
                {{ player.projects }} projects
              </span>
              <span v-else>
                {{ player.weeklyProjects }} projects this week
              </span>
            </div>
          </li>
        </ul>
      </section>
      </template>
    </main>
  </div>
</template>

<style module lang="scss">
.root {
  position: relative;
  min-height: 100vh;
  padding: calc(var(--height-space) * 0.2) 0 var(--height-space) 0;
  color: var(--foreground-color);
  overflow: hidden;
}

.backdrop {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at -10% 0%, color-mix(in srgb, var(--accent-color, #ffd454) 32%, transparent) 0%, transparent 50%),
    radial-gradient(circle at 110% 20%, color-mix(in srgb, var(--color-palette-4, #6c5ce7) 28%, transparent) 0%, transparent 55%),
    radial-gradient(circle at 50% 120%, color-mix(in srgb, var(--color-palette-2, #0b66ff) 20%, transparent) 0%, transparent 60%);
  opacity: 0.6;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
}

.content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: calc(var(--height-space) * 0.6);
}

.hero {
  display: grid;
  gap: 2.5rem;
  margin-top: calc(var(--height-space) * 0.2);

  @media screen and (min-width: 1024px) {
    grid-template-columns: 1.1fr 0.9fr;
    align-items: stretch;
  }
}

.hero-copy {
  display: grid;
  gap: 1.4rem;

  span {
    font-size: 0.85rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.75;
  }

  h1 {
    @include section-title;
    transform: none;
    -webkit-text-stroke: 0;
    text-align: left;
    margin: 0;
  }

  p {
    font-size: 1.05rem;
    line-height: 1.7;
    opacity: 0.85;
    max-width: 55ch;
  }
}

// TODO: Unify this segmented control with a reusable toggle once the design system tokens solidify.
.mode-toggle {
  --toggle-height: clamp(1.75rem, 3.5vw, 2.2rem);
  --toggle-padding: 0.35rem;
  position: relative;
  display: inline-flex;
  align-items: stretch;
  padding: var(--toggle-padding);
  border-radius: calc(var(--toggle-height) + (var(--toggle-padding) * 2));
  border: 1px solid color-mix(in srgb, var(--foreground-color) 45%, transparent);
  background: radial-gradient(circle at 25% 20%, rgba(255, 255, 255, 0.14), transparent 60%),
    linear-gradient(120deg, rgba(35, 35, 35, 0.95), rgba(5, 5, 5, 0.82));
  box-shadow:
    inset 0 1px 16px rgba(255, 255, 255, 0.08),
    0 20px 55px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  width: fit-content;
  min-width: 0;
  isolation: isolate;

  &__button {
    position: relative;
    z-index: 1;
    padding: 0 calc(var(--toggle-height) * 0.85);
    border: none;
    border-radius: 999px;
    background: transparent;
    font-family: var(--display-font);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-size: clamp(0.58rem, 1vw, 0.78rem);
    font-weight: 650;
    color: color-mix(in srgb, var(--foreground-color) 70%, transparent);
    cursor: pointer;
    transition: color 0.25s ease, text-shadow 0.25s ease;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    outline: none;
    min-width: clamp(4.4rem, 14vw, 6rem);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);

    &:focus-visible {
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--foreground-color) 65%, transparent);
      border-radius: calc(999px - 2px);
    }

    &--active {
      color: color-mix(in srgb, var(--background-color) 95%, white 5%);
      text-shadow: 0 4px 14px rgba(0, 0, 0, 0.55);
    }
  }

  &__glow {
    position: absolute;
    top: var(--toggle-padding);
    left: var(--toggle-padding);
    height: calc(100% - (var(--toggle-padding) * 2));
    width: calc((100% - (var(--toggle-padding) * 2)) / 2);
    border-radius: 999px;
    background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--accent-color, #ffd454) 75%, white 10%),
        color-mix(in srgb, var(--foreground-color) 45%, transparent)
      ),
      radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.45), transparent 70%);
    box-shadow:
      inset 0 3px 24px rgba(255, 255, 255, 0.45),
      0 24px 55px rgba(0, 0, 0, 0.5);
    filter: saturate(1.15) brightness(1.08);
    transition: transform 0.35s cubic-bezier(0.33, 1, 0.68, 1);
    z-index: 0;

    &[data-mode="overall"] {
      transform: translateX(0);
    }

    &[data-mode="weekly"] {
      transform: translateX(100%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__glow,
    &__button {
      transition: none;
    }
  }
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.hero-button {
  // TODO: Pull these tokens into a shared button component once design system work starts.
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: clamp(0.55rem, 1.2vw, 0.75rem) clamp(1rem, 2.4vw, 1.25rem);
  border-radius: 999px;
  background: var(--foreground-color);
  color: var(--background-color);
  font-family: var(--display-font);
  font-size: clamp(0.68rem, 1.2vw, 0.85rem);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  width: fit-content;
  align-self: flex-start;

  &:hover,
  &:focus-visible {
    transform: translateY(-3px);
    box-shadow: 0 20px 45px color-mix(in srgb, var(--foreground-color) 24%, transparent);
  }
}

.hero-secondary {
  border: 1px solid color-mix(in srgb, var(--foreground-color) 22%, transparent);
  border-radius: 999px;
  padding: 0.8rem 1.4rem;
  background: transparent;
  color: inherit;
  font-family: var(--display-font);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.3s ease, border-color 0.3s ease;

  &:hover,
  &:focus-visible {
    transform: translateY(-2px);
    border-color: var(--foreground-color);
  }
}

.player-card {
  position: relative;
  border-radius: 2rem;
  padding: 2.5rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 14%, transparent);
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-palette-2, #0b66ff) 26%, transparent) 0%,
      color-mix(in srgb, var(--background-color) 86%, transparent) 60%
    );
  box-shadow: 0 30px 80px color-mix(in srgb, #000 30%, transparent);
  display: grid;
  gap: 1.5rem;
  overflow: hidden;
}

.player-card:before {
  content: "";
  position: absolute;
  inset: -30% 20% auto auto;
  width: 14rem;
  height: 14rem;
  background: radial-gradient(circle, color-mix(in srgb, #fff 80%, transparent) 0%, transparent 70%);
  opacity: 0.2;
  animation: pulseGlow 7s ease-in-out infinite;
}

.player-card header {
  display: grid;
  gap: 0.35rem;

  span {
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.75;
  }

  strong {
    font-family: var(--display-font);
    font-size: 1.6rem;
  }

  small {
    font-size: 0.9rem;
    opacity: 0.7;
  }
}

.player-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(6rem, 1fr));
  gap: 1.25rem;

  div {
    display: grid;
    gap: 0.35rem;

    span {
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.7;
    }

    strong {
      font-family: var(--display-font);
      font-size: 1.35rem;
    }
  }
}

.player-progress {
  display: grid;
  gap: 0.5rem;

  span:first-child {
    font-size: 0.8rem;
    opacity: 0.7;
  }

  span:last-child {
    display: block;
    height: 0.45rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--background-color) 70%, transparent);
    overflow: hidden;
    position: relative;

    &:after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(120deg, #ffd454 0%, #ff8c37 100%);
      transform-origin: left center;
      transform: scaleX(var(--progress));
      transition: transform 0.6s ease;
    }
  }
}

.player-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    padding: 0.35rem 0.9rem;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--foreground-color) 25%, transparent);
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
}

.player-awards {
  display: grid;
  gap: 0.8rem;

  h4 {
    margin: 0;
    font-family: var(--display-font);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.8;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.6rem;
  }

  li {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.75rem;
    align-items: start;
    padding: 0.65rem 0.85rem;
    border-radius: 1rem;
    background: color-mix(in srgb, var(--background-color) 86%, transparent);
    border: 1px solid color-mix(in srgb, var(--foreground-color) 14%, transparent);

    span {
      font-size: 1.4rem;
    }

    strong {
      font-family: var(--display-font);
      font-size: 0.95rem;
    }

    p {
      margin: 0.15rem 0 0 0;
      font-size: 0.85rem;
      opacity: 0.75;
    }
  }
}

.podium {
  display: grid;
  gap: 1.5rem;

  @media screen and (min-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.podium-card {
  position: relative;
  border-radius: 2rem;
  padding: 2.2rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
  background: color-mix(in srgb, var(--background-color) 92%, transparent);
  box-shadow: 0 24px 70px color-mix(in srgb, #000 22%, transparent);
  display: grid;
  gap: 1.2rem;
  overflow: hidden;
  transform: translateY(0);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-6px);
  }
}

.podium-card--1 {
  background: linear-gradient(150deg, #ffd454 0%, color-mix(in srgb, var(--background-color) 80%, transparent) 45%);
}

.podium-card--2 {
  background: linear-gradient(150deg, #8ac6ff 0%, color-mix(in srgb, var(--background-color) 85%, transparent) 45%);
}

.podium-card--3 {
  background: linear-gradient(150deg, #a29bfe 0%, color-mix(in srgb, var(--background-color) 85%, transparent) 45%);
}

.podium-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;

  span {
    font-family: var(--display-font);
    font-size: 1.5rem;
  }

  div {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: color-mix(in srgb, var(--foreground-color) 14%, transparent);
    display: grid;
    place-items: center;
    font-family: var(--display-font);
    letter-spacing: 0.08em;
  }
}

.podium-card h3 {
  margin: 0;
  font-family: var(--display-font);
  font-size: 1.3rem;
}

.podium-card p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.7;
}

.podium-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.1rem;

  div {
    display: grid;
    gap: 0.25rem;

    span {
      font-size: 0.75rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      opacity: 0.7;
    }

    strong {
      font-family: var(--display-font);
      font-size: 1.15rem;
    }
  }
}

.podium-badges {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  li {
    padding: 0.3rem 0.8rem;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--foreground-color) 20%, transparent);
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
}

.table {
  display: grid;
  gap: 1.75rem;
  margin-bottom: calc(var(--height-space) * 0.4);

  header {
    display: grid;
    gap: 0.75rem;

    h2 {
      margin: 0;
      font-family: var(--display-font);
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    p {
      margin: 0;
      font-size: 0.95rem;
      opacity: 0.75;
      max-width: 60ch;
    }
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 1.1rem;
  }
}

.table-row {
  border-radius: 1.6rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 10%, transparent);
  background: color-mix(in srgb, var(--background-color) 94%, transparent);
  padding: 1.4rem 1.75rem;
  display: grid;
  gap: 1.3rem;
  align-items: center;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  @media screen and (min-width: 1024px) {
    grid-template-columns: 2fr 1fr 2fr 1fr;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 15px 45px color-mix(in srgb, #000 18%, transparent);
  }
}

.table-row--up {
  border-color: color-mix(in srgb, #1dd1a1 40%, transparent);
}

.table-row--down {
  border-color: color-mix(in srgb, #ff6b6b 32%, transparent);
}

.table-rank {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 0.75rem;
  align-items: center;

  span {
    font-family: var(--display-font);
    font-size: 1.15rem;
  }

  div:nth-child(2) {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    background: color-mix(in srgb, var(--foreground-color) 12%, transparent);
    display: grid;
    place-items: center;
    font-family: var(--display-font);
    letter-spacing: 0.08em;
  }

  div:nth-child(3) {
    display: grid;
    gap: 0.25rem;

    strong {
      font-family: var(--display-font);
    }

    small {
      opacity: 0.65;
      font-size: 0.8rem;
    }
  }
}

.table-xp {
  display: grid;
  gap: 0.2rem;

  strong {
    font-family: var(--display-font);
    font-size: 1.2rem;
  }

  span {
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    opacity: 0.65;
    text-transform: uppercase;
  }
}

.table-progress {
  display: grid;
  gap: 0.45rem;

  span:first-child {
    font-size: 0.8rem;
    opacity: 0.7;
  }

  span:last-child {
    display: block;
    height: 0.4rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--foreground-color) 12%, transparent);
    overflow: hidden;
    position: relative;

    &:after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(120deg, #1dd1a1 0%, #10ac84 100%);
      transform-origin: left center;
      transform: scaleX(var(--progress));
      transition: transform 0.5s ease;
    }
  }
}

.table-streak {
  display: grid;
  gap: 0.25rem;
  font-size: 0.85rem;
  opacity: 0.75;
}

@keyframes pulseGlow {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(1);
  }

  50% {
    opacity: 0.35;
    transform: scale(1.1);
  }
}

.loading,
.errorState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  min-height: 60vh;
  text-align: center;
  padding: 3rem 1rem;

  h2 {
    font-family: var(--display-font);
    font-size: 1.8rem;
    margin: 0;
  }

  p {
    font-size: 1.1rem;
    opacity: 0.8;
    max-width: 50ch;
    margin: 0;
  }
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid color-mix(in srgb, var(--foreground-color) 20%, transparent);
  border-top-color: var(--foreground-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
