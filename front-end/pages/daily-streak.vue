<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useStudentAuth } from "~/composables/use-auth";

definePageMeta({
  layout: "default",
  middleware: ["student-auth"],
});

interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  claimedToday: boolean;
  canClaimToday: boolean;
  nextStreakDay: number;
  xpReward: number;
  timeUntilNextClaim: {
    hours: number;
    minutes: number;
    seconds: number;
  };
}

interface ClaimResult {
  success: boolean;
  streak: {
    current: number;
    longest: number;
    wasReset: boolean;
  };
  xpAwarded: number;
  xpResult: {
    newXpTotal: number;
    tierChanged: boolean;
    newTier: { name: string; icon: string } | null;
  };
  badges: {
    tierBadge: { name: string; icon: string } | null;
    streakBadge: { name: string; icon: string } | null;
  };
}

interface ChallengeTestMeta {
  id: string;
  title: string;
  detail: string;
}

interface MilestoneTier {
  days: number;
  icon: string;
  title: string;
  copy: string;
}

const { profile } = useStudentAuth();

const streakStatus = ref<StreakStatus | null>(null);
const isLoading = ref(true);
const isClaiming = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// Countdown timer state
const countdown = ref({ hours: 0, minutes: 0, seconds: 0 });
let countdownInterval: NodeJS.Timeout | null = null;

// Modal states
const showTierUpModal = ref(false);
const newTierInfo = ref<{ name: string; icon: string } | null>(null);
const showBadgeModal = ref(false);
const earnedBadgeInfo = ref<{ name: string; icon: string } | null>(null);
const showXpAnimation = ref(false);
const xpAwardAmount = ref(0);
const hasClearedChallenge = ref(false);

const studentName = computed(() => profile.value?.name ?? "Zapmind Student");

const countdownLabel = computed(() => {
  const hours = countdown.value.hours.toString().padStart(2, "0");
  const minutes = countdown.value.minutes.toString().padStart(2, "0");
  const seconds = countdown.value.seconds.toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
});

const challengeBrief = {
  title: "Signal Surge Optimiser",
  summary:
    "Stabilise the telemetry spikes before the streak meter resets. Patch the function, run the tests, and bank the XP.",
  description:
    "Write `rally_combo(pulses, window)` to scan the stream of XP pulses and report the hottest contiguous burst. Guard invalid window sizes and keep it linear so the hype meter stays real-time.",
  constraints: [
    "Reject windows smaller than 1 or longer than the stream by raising `ValueError`.",
    "Use a sliding window or another linear-time approach—brute-force scans eat the timer.",
    "Return the highest contiguous total so the streak meter animates correctly.",
  ],
  tags: ["Sliding window", "Python lists", "Error handling"],
  tests: [
    {
      id: "pulse-baseline",
      title: "Pulse baseline",
      detail: "Find the hottest 3-beat combo from mixed energy.",
    },
    {
      id: "extended-sprint",
      title: "Extended sprint",
      detail: "Allow flexible window sizes without rebuilding the loop.",
    },
    {
      id: "guard-rails",
      title: "Guard rails",
      detail: "Reject stale data before it corrupts the streak.",
    },
  ] as ChallengeTestMeta[],
};

const milestoneTiers: MilestoneTier[] = [
  {
    days: 3,
    icon: "🥉",
    title: "3-day consistency",
    copy: "Consistent Learner badge",
  },
  { days: 7, icon: "🥈", title: "Week warrior", copy: "Week Warrior badge" },
  {
    days: 30,
    icon: "🥇",
    title: "Monthly master",
    copy: "Monthly Master badge",
  },
  {
    days: 100,
    icon: "👑",
    title: "Century club",
    copy: "Century Champion badge",
  },
];

const exerciseBlueprint = {
  starterCode: `def rally_combo(pulses: list[int], window: int = 3) -> int:
    """Return the highest total of any contiguous block of length 'window'."""
    # TODO: validate the window and keep the hottest streak rolling.
    ...
`,
  hints: [
    "Validate that 'window' is positive and not longer than the stream before iterating.",
    "Compute the first window once, then slide by subtracting the value that drops out.",
    "Keep a running max so you never re-sum the same range.",
  ],
  tests: [
    {
      id: "default-window",
      description: "Returns the hottest 3-beat burst by default.",
      assertion: `
def __test__():
    return rally_combo([12, 8, 15, 6, 10]) == 35
__test__()
`,
      expected: "True",
    },
    {
      id: "custom-window",
      description: "Supports a custom window for extended sprints.",
      assertion: `
def __test__():
    return rally_combo([5, 14, 9, 22, 11, 6], 4) == 56
__test__()
`,
      expected: "True",
    },
    {
      id: "invalid-window",
      description: "Invalid windows raise ValueError before running.",
      assertion: `
def __test__():
    try:
        rally_combo([10, 4], 3)
    except ValueError:
        return True
    return False
__test__()
`,
      expected: "True",
    },
  ],
};

const streakExercise = computed(() => ({
  ...exerciseBlueprint,
  moduleIdentifier: streakStatus.value?.nextStreakDay
    ? `daily-streak-${streakStatus.value.nextStreakDay}`
    : undefined,
  moduleDifficulty: "Intermediate",
  moduleTitle: "Daily streak quest",
  title: challengeBrief.title,
}));

const nextMilestone = computed(() => {
  if (!streakStatus.value) {
    return milestoneTiers[0];
  }
  const current = streakStatus.value.currentStreak;
  return (
    milestoneTiers.find((tier) => current < tier.days) ?? milestoneTiers[milestoneTiers.length - 1]
  );
});

const progressToNextMilestone = computed(() => {
  if (!streakStatus.value) {
    return 0;
  }

  const current = streakStatus.value.currentStreak;
  const tentativeTarget = nextMilestone.value?.days ?? current ?? 1;
  const target = tentativeTarget || 1;
  if (target === 0) {
    return 0;
  }

  return Math.min(current / target, 1);
});

const xpRewardDisplay = computed(() => streakStatus.value?.xpReward ?? 0);
const streakDayLabel = computed(() => streakStatus.value?.nextStreakDay ?? 1);

const workspaceStatusCopy = computed(() => {
  if (!streakStatus.value) {
    return "Fetching streak data...";
  }

  if (streakStatus.value.claimedToday) {
    return "Reward already claimed. Keep practicing in the editor to stay sharp.";
  }

  if (hasClearedChallenge.value) {
    return "Tests are green. Claim before the timer hits zero.";
  }

  return "Write your solution, run the tests, and light up the claim button.";
});

const isClaimDisabled = computed(() => {
  if (!streakStatus.value) {
    return true;
  }

  return (
    isClaiming.value ||
    !streakStatus.value.canClaimToday ||
    streakStatus.value.claimedToday
  );
});

const claimButtonLabel = computed(() => {
  if (!streakStatus.value) {
    return "Claim streak";
  }

  if (streakStatus.value.claimedToday) {
    return "Already claimed";
  }

  return isClaiming.value ? "Claiming..." : "Claim streak";
});

const handlePlaygroundSuccess = () => {
  if (streakStatus.value?.claimedToday) {
    return;
  }

  hasClearedChallenge.value = true;
  successMessage.value = "Tests passed! Claim now to bank the XP.";
};

const fetchStreakStatus = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const { authFetch } = useApiClient();
    const response = await authFetch<StreakStatus>("/api/daily-streak/status", {
      method: "GET",
    });
    streakStatus.value = response;
    countdown.value = response.timeUntilNextClaim;
    hasClearedChallenge.value = response.claimedToday;
  } catch (e: any) {
    error.value = e.data?.message || e.message || "Failed to load streak status.";
    console.error("Error fetching streak status:", e);
  } finally {
    isLoading.value = false;
  }
};

const claimStreak = async () => {
  if (isClaiming.value || !streakStatus.value?.canClaimToday) {
    return;
  }

  isClaiming.value = true;
  error.value = null;
  successMessage.value = null;

  try {
    const { authFetch } = useApiClient();
    const response = await authFetch<ClaimResult>("/api/daily-streak/claim", {
      method: "POST",
    });

    if (response.success) {
      // Show XP animation
      xpAwardAmount.value = response.xpAwarded;
      showXpAnimation.value = true;
      setTimeout(() => (showXpAnimation.value = false), 2000);

      // Update streak status
      if (streakStatus.value) {
        streakStatus.value.currentStreak = response.streak.current;
        streakStatus.value.longestStreak = response.streak.longest;
        streakStatus.value.claimedToday = true;
        streakStatus.value.canClaimToday = false;
        hasClearedChallenge.value = true;
      }

      // Show success message
      if (response.streak.wasReset) {
        successMessage.value = `Your streak was reset, but you're back on track! You earned ${response.xpAwarded} XP. Come back tomorrow to continue!`;
      } else {
        successMessage.value = `Streak claimed! You earned ${response.xpAwarded} XP. Day ${response.streak.current} complete!`;
      }

      // Check for tier change
      if (response.xpResult.tierChanged && response.xpResult.newTier) {
        newTierInfo.value = response.xpResult.newTier;
        showTierUpModal.value = true;
      }

      // Check for badges
      if (response.badges.streakBadge) {
        earnedBadgeInfo.value = response.badges.streakBadge;
        showBadgeModal.value = true;
      } else if (response.badges.tierBadge) {
        earnedBadgeInfo.value = response.badges.tierBadge;
        showBadgeModal.value = true;
      }
      
      // Invalidate user progress cache so dashboard updates
      clearNuxtData('user-progress');
      
      // Dispatch event to refresh dashboard if it's open
      if (import.meta.client) {
        window.dispatchEvent(new CustomEvent('xp-earned', {
          detail: { xpAwarded: response.xpAwarded }
        }));
      }
    }
  } catch (e: any) {
    error.value = e.data?.message || e.message || "Failed to claim streak.";
    console.error("Error claiming streak:", e);
  } finally {
    isClaiming.value = false;
  }
};

const startCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  countdownInterval = setInterval(() => {
    if (countdown.value.seconds > 0) {
      countdown.value.seconds--;
    } else if (countdown.value.minutes > 0) {
      countdown.value.minutes--;
      countdown.value.seconds = 59;
    } else if (countdown.value.hours > 0) {
      countdown.value.hours--;
      countdown.value.minutes = 59;
      countdown.value.seconds = 59;
    } else {
      // Countdown finished, refresh status
      fetchStreakStatus();
    }
  }, 1000);
};

onMounted(() => {
  fetchStreakStatus();
  startCountdown();
});

onBeforeUnmount(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});

const pageTitle = "Daily Streak – Zapminds Academy";
useSeoMeta({
  title: pageTitle,
  description: "Claim your daily streak and earn XP rewards at Zapminds Academy.",
});
</script>

<template>
  <div :class="$style.root">
    <section :class="$style.hero">
      <div class="container" :class="$style.heroShell">
        <header :class="$style.heroHeader">
          <p :class="$style.eyebrow">Daily streak quest</p>
          <h1>Ship today's streak</h1>
          <p>
            {{ studentName }}, keep your learning momentum alive by solving the code pulse before
            the timer resets.
          </p>
        </header>

        <div v-if="streakStatus" :class="$style.heroStats">
          <article :class="$style.statCard">
            <small>Current streak</small>
            <strong>
              {{ streakStatus.currentStreak }}
              <span>days</span>
            </strong>
          </article>
          <article :class="$style.statCard">
            <small>Longest streak</small>
            <strong>
              {{ streakStatus.longestStreak }}
              <span>days</span>
            </strong>
          </article>
          <article :class="$style.statCard">
            <small>Next reward</small>
            <strong>+{{ xpRewardDisplay }} XP</strong>
            <span>Day {{ streakDayLabel }}</span>
          </article>
          <article :class="[$style.statCard, $style.highlightCard]">
            <small>Reset timer</small>
            <strong>{{ countdownLabel }}</strong>
            <span>hh:mm:ss</span>
            <div :class="$style.progress">
              <span :style="{ width: `${Math.round(progressToNextMilestone * 100)}%` }" />
            </div>
            <p>
              Next badge: {{ nextMilestone.title }} ({{ nextMilestone.days }} days)
            </p>
          </article>
        </div>

        <div v-else :class="$style.heroPlaceholder">
          <p>Loading streak status…</p>
        </div>
      </div>
    </section>

    <section v-if="isLoading" :class="$style.stateCard">
      <div class="container">
        <p>Loading your streak workspace…</p>
      </div>
    </section>

    <section v-else-if="error && !streakStatus" :class="$style.stateCard">
      <div class="container">
        <p>{{ error }}</p>
        <button type="button" @click="fetchStreakStatus">Try again</button>
      </div>
    </section>

    <template v-else-if="streakStatus">
      <section :class="$style.workspace">
        <div class="container" :class="$style.workspaceGrid">
          <aside :class="$style.controlPanel">
            <div :class="$style.controlCard">
              <small>XP reward</small>
              <strong>+{{ xpRewardDisplay }} XP</strong>
              <p>Multiplier applies when you keep the streak alive.</p>
            </div>
            <div :class="$style.controlCard">
              <small>Reset timer</small>
              <strong>{{ countdownLabel }}</strong>
              <p>Claim before it hits zero.</p>
            </div>
            <div :class="$style.controlCard">
              <small>Status</small>
              <p>{{ workspaceStatusCopy }}</p>
            </div>

            <button
              type="button"
              :class="$style.claimButton"
              :disabled="isClaimDisabled"
              @click="claimStreak"
            >
              {{ claimButtonLabel }}
            </button>

            <p v-if="successMessage" :class="$style.successMessage">{{ successMessage }}</p>
            <p v-if="error" :class="$style.errorMessage">
              {{ error }}
            </p>
          </aside>

          <div :class="$style.editorPane">
            <div :class="$style.editorHeader">
              <div>
                <span>Today's challenge</span>
                <h2>{{ challengeBrief.title }}</h2>
                <p>{{ challengeBrief.summary }}</p>
              </div>
              <ul :class="$style.tagList">
                <li v-for="tag in challengeBrief.tags" :key="tag">{{ tag }}</li>
              </ul>
            </div>

            <div :class="$style.challengeMeta">
              <article>
                <h3>Constraints</h3>
                <ul>
                  <li v-for="constraint in challengeBrief.constraints" :key="constraint">
                    {{ constraint }}
                  </li>
                </ul>
              </article>

              <article>
                <h3>Test plan</h3>
                <ul>
                  <li v-for="test in challengeBrief.tests" :key="test.id">
                    <strong>{{ test.title }}</strong>
                    <p>{{ test.detail }}</p>
                  </li>
                </ul>
              </article>
            </div>

            <div :class="$style.playgroundWrap">
              <VCodePlayground
                :exercise="streakExercise"
                @all-tests-passed="handlePlaygroundSuccess"
              />
            </div>
          </div>
        </div>
      </section>

      <section :class="$style.milestones">
        <div class="container">
          <header>
            <span>Milestones</span>
            <h3>Badge roadmap</h3>
          </header>

          <ul>
            <li
              v-for="tier in milestoneTiers"
              :key="tier.days"
              :class="streakStatus.currentStreak >= tier.days ? $style.achieved : ''"
            >
              <strong>{{ tier.icon }}</strong>
              <div>
                <p>{{ tier.title }}</p>
                <span>{{ tier.days }} days — {{ tier.copy }}</span>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </template>

    <!-- Modals -->
    <VXpAwardAnimation v-if="showXpAnimation" :xp="xpAwardAmount" :visible="showXpAnimation" />
    <VTierUpModal
      v-if="showTierUpModal && newTierInfo"
      :open="showTierUpModal"
      :tier="newTierInfo"
      @close="showTierUpModal = false"
    />
    <VBadgeEarnedModal
      v-if="showBadgeModal && earnedBadgeInfo"
      :open="showBadgeModal"
      :badge="{
        badge_name: earnedBadgeInfo.name,
        badge_icon: earnedBadgeInfo.icon,
        badge_description: 'Amazing achievement! You earned a new badge.'
      }"
      @close="showBadgeModal = false"
    />
  </div>
</template>

<style module lang="scss">
.root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: var(--height-space);
}

.hero {
  padding: 3rem 0 2rem;
  background:
    radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--color-palette-3) 15%, transparent), transparent 65%),
    radial-gradient(circle at 80% 0%, color-mix(in srgb, var(--color-palette-1) 18%, transparent), transparent 45%);
}

.heroShell {
  display: grid;
  gap: 2rem;
}

.heroHeader {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 60ch;

  h1 {
    margin: 0;
    font-size: clamp(2.5rem, 4vw, 3.4rem);
    letter-spacing: 0.05em;
  }

  p {
    margin: 0;
    opacity: 0.8;
    line-height: 1.5;
  }
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.8rem;
  opacity: 0.7;
}

.heroStats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 1rem;
}

.statCard {
  border: 1px solid color-mix(in srgb, var(--foreground-color) 15%, transparent);
  border-radius: 1.35rem;
  padding: 1.5rem;
  background: color-mix(in srgb, var(--background-color) 85%, transparent);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  small {
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.75rem;
    opacity: 0.65;
  }

  strong {
    font-size: 2.4rem;
    margin: 0;
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
  }

  span {
    font-size: 0.95rem;
    opacity: 0.75;
  }
}

.highlightCard {
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--color-palette-4) 20%, transparent), transparent),
    color-mix(in srgb, var(--background-color) 80%, transparent);
  box-shadow: 0 20px 50px color-mix(in srgb, #000 25%, transparent);
}

.progress {
  width: 100%;
  height: 0.35rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--foreground-color) 10%, transparent);
  overflow: hidden;
  margin: 0.4rem 0;

  span {
    display: block;
    height: 100%;
    background: var(--color-accent);
    transition: width 0.3s ease;
  }
}

.heroPlaceholder {
  border-radius: 1.35rem;
  border: 1px dashed color-mix(in srgb, var(--foreground-color) 20%, transparent);
  padding: 2rem;
  text-align: center;
  opacity: 0.8;
}

.stateCard {
  padding: 1.5rem 0 0;

  .container {
    border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
    border-radius: 1.5rem;
    padding: 1.5rem;
    text-align: center;
    display: grid;
    gap: 1rem;
  }

  button {
    justify-self: center;
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    border: 0;
    border-radius: 999px;
    padding: 0.75rem 1.75rem;
    cursor: pointer;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
}

.workspace {
  padding: 1rem 0 0;
}

.workspaceGrid {
  display: grid;
  grid-template-columns: minmax(16rem, 22rem) minmax(0, 1fr);
  gap: 2rem;
  align-items: flex-start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.controlPanel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: sticky;
  top: 1.5rem;
}

.controlCard {
  border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
  border-radius: 1.2rem;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--background-color) 92%, transparent);
  display: grid;
  gap: 0.4rem;

  small {
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.7rem;
    opacity: 0.7;
  }

  strong {
    font-size: 1.8rem;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
    opacity: 0.8;
  }
}

.claimButton {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  border: 0;
  border-radius: 1rem;
  padding: 0.95rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 20px 45px color-mix(in srgb, var(--color-accent) 35%, transparent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.successMessage,
.errorMessage {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.successMessage {
  color: var(--color-success);
}

.errorMessage {
  color: var(--color-danger);
}

.editorPane {
  border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
  border-radius: 2rem;
  padding: 2rem;
  background:
    linear-gradient(145deg, color-mix(in srgb, var(--background-color) 85%, transparent), transparent),
    radial-gradient(circle at 80% 15%, color-mix(in srgb, var(--color-palette-2) 12%, transparent), transparent 60%);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 30px 90px color-mix(in srgb, #000 35%, transparent);

  @media (max-width: 640px) {
    padding: 1.5rem;
  }
}

.editorHeader {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: space-between;

  span {
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-size: 0.75rem;
    opacity: 0.7;
  }

  h2 {
    margin: 0.35rem 0;
    font-size: clamp(1.75rem, 3vw, 2.4rem);
    letter-spacing: 0.05em;
  }

  p {
    margin: 0;
    opacity: 0.8;
    max-width: 50ch;
  }
}

.tagList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: flex-start;

  li {
    display: inline-flex;
    align-items: center;
    border: 1px solid color-mix(in srgb, var(--foreground-color) 15%, transparent);
    border-radius: 999px;
    padding: 0.35rem 0.9rem;
    font-size: 0.8rem;
    opacity: 0.9;
    background: color-mix(in srgb, var(--background-color) 92%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, #fff 6%, transparent);
  }
}

.challengeMeta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;

  article {
    border: 1px solid color-mix(in srgb, var(--foreground-color) 10%, transparent);
    border-radius: 1.25rem;
    padding: 1.25rem;
    background: color-mix(in srgb, var(--background-color) 92%, transparent);

    h3 {
      margin: 0 0 0.8rem 0;
      font-size: 1rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.65rem;
    }

    li {
      font-size: 0.95rem;
      line-height: 1.4;
      opacity: 0.85;
    }

    strong {
      display: block;
      margin-bottom: 0.2rem;
    }

    p {
      margin: 0;
      opacity: 0.75;
    }
  }
}

.playgroundWrap {
  border: 1px solid color-mix(in srgb, var(--foreground-color) 10%, transparent);
  border-radius: 1.5rem;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--background-color) 98%, transparent);
}

.milestones {
  padding: 1rem 0 3rem 0;

  header {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    span {
      text-transform: uppercase;
      letter-spacing: 0.15em;
      font-size: 0.7rem;
      opacity: 0.7;
    }

    h3 {
      margin: 0;
    }
  }

  ul {
    list-style: none;
    margin: 1.5rem 0 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }

  li {
    border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
    border-radius: 1.25rem;
    padding: 1rem 1.25rem;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.75rem;
    align-items: center;
    opacity: 0.65;
    transition: opacity 0.2s ease, border-color 0.2s ease;

    strong {
      font-size: 1.5rem;
    }

    p {
      margin: 0;
      font-weight: 600;
    }

    span {
      font-size: 0.85rem;
      opacity: 0.75;
    }
  }
}

.achieved {
  opacity: 1;
  border-color: color-mix(in srgb, var(--color-success) 40%, transparent);
  box-shadow: 0 15px 45px color-mix(in srgb, var(--color-success) 25%, transparent);
}
</style>
