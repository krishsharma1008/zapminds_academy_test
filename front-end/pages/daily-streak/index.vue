<script setup lang="ts">
import { computed, ref } from "vue";

definePageMeta({
  layout: "default",
  middleware: ["student-auth"],
});

const pageTitle = "Daily Streak Quest – Zapminds Academy";

useSeoMeta({
  title: pageTitle,
  description:
    "Keep your Zapminds streak alive by solving the daily quest, running the tests, and banking the XP popup.",
});

const streakStats = {
  day: 12,
  xpReward: 140,
  multiplier: 1.4,
  resetsIn: "05h 18m",
  timebox: "15 min sprint",
};

const challenge = {
  title: "Signal Surge Optimiser",
  summary:
    "Today's telemetry stream is spiking. Stabilise it so the academy can keep pumping XP boosts into your profile.",
  description:
    "Write `rally_combo(pulses, window)` to scan the stream of XP pulses and report the hottest contiguous burst. Guard invalid window sizes and keep it linear—our hype meter needs an instant answer.",
  constraints: [
    "Reject windows smaller than 1 or longer than the stream by raising `ValueError`.",
    "Use a sliding window or another linear-time approach—brute-force loops stall the combo.",
    "Return the highest contiguous total so the streak meter animates correctly.",
  ],
  tags: ["Sliding window", "Python lists", "Error handling"],
  tests: [
    {
      id: "default-window",
      title: "Pulse baseline",
      detail: "Find the hottest 3-beat combo from mixed energy.",
    },
    {
      id: "custom-window",
      title: "Extended sprint",
      detail: "Allow flexible window sizes without rebuilding the loop.",
    },
    {
      id: "invalid-window",
      title: "Guard rails",
      detail: "Reject stale data before it corrupts the streak.",
    },
  ],
};

const streakExercise = {
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

const isCelebrating = ref(false);
const hasClaimedReward = ref(false);
const celebrationMode = ref<"claim" | "victory">("claim");

const totalXp = computed(() =>
  Math.round(streakStats.xpReward * streakStats.multiplier)
);

const rewardCopy = computed(() =>
  hasClaimedReward.value
    ? "XP locked in — multiplier applied to your profile."
    : `Complete the tests to claim +${streakStats.xpReward} XP (${totalXp.value} with multiplier).`
);

const celebrationHeadline = computed(() =>
  celebrationMode.value === "claim"
    ? `+${streakStats.xpReward} XP ready`
    : "Combo maintained"
);

const celebrationSubhead = computed(() =>
  celebrationMode.value === "claim"
    ? `Multiplier cranks it to ${totalXp.value} XP. Cash it in before the timer resets.`
    : "Bonus already banked, but the hype meter loves the rerun."
);

const celebrationCta = computed(() =>
  celebrationMode.value === "claim" ? "Claim XP boost" : "Back to editor"
);

const handleQuestCompletion = () => {
  celebrationMode.value = hasClaimedReward.value ? "victory" : "claim";
  isCelebrating.value = true;
};

const dismissCelebration = () => {
  if (celebrationMode.value === "claim" && !hasClaimedReward.value) {
    hasClaimedReward.value = true;
  }
  isCelebrating.value = false;
};
</script>

<template>
  <div :class="$style.root">
    <section :class="$style.hero">
      <div class="container grid">
        <article :class="$style['hero-card']">
          <div :class="$style['hero-eyebrow']">
            <span>Daily streak</span>
            <span>Day {{ streakStats.day }}</span>
          </div>
          <h1>Signal Sprint</h1>
          <p>{{ challenge.summary }}</p>

          <div :class="$style['hero-stats']">
            <div>
              <small>Flame level</small>
              <strong>{{ streakStats.day }}</strong>
              <span>Keep shipping daily</span>
            </div>
            <div>
              <small>XP on deck</small>
              <strong>+{{ streakStats.xpReward }} XP</strong>
              <span>Multiplier ×{{ streakStats.multiplier }}</span>
            </div>
            <div>
              <small>Resets in</small>
              <strong>{{ streakStats.resetsIn }}</strong>
              <span>{{ streakStats.timebox }}</span>
            </div>
          </div>
        </article>

        <aside :class="$style['status-card']">
          <div>
            <span>Problem of the day</span>
            <h3>{{ challenge.title }}</h3>
            <p>{{ challenge.description }}</p>
          </div>

          <ul :class="$style['status-tags']">
            <li v-for="tag in challenge.tags" :key="tag">{{ tag }}</li>
          </ul>

          <div :class="$style['status-meter']" role="presentation">
            <span :style="{ '--progress': hasClaimedReward ? 1 : 0.35 }"></span>
          </div>

          <p :class="$style['status-copy']">
            {{ rewardCopy }}
          </p>
        </aside>
      </div>
    </section>

    <section :class="$style.challenge">
      <div class="container grid">
        <article :class="$style['challenge-brief']">
          <span>Quest detail</span>
          <h2>{{ challenge.title }}</h2>
          <p>{{ challenge.description }}</p>

          <ul>
            <li v-for="constraint in challenge.constraints" :key="constraint">
              {{ constraint }}
            </li>
          </ul>
        </article>

        <aside :class="$style['challenge-meta']">
          <div>
            <span>Timebox</span>
            <strong>{{ streakStats.timebox }}</strong>
          </div>
          <div>
            <span>XP burst</span>
            <strong>+{{ streakStats.xpReward }} XP</strong>
            <small>Up to {{ totalXp }} XP with streak bonus</small>
          </div>
          <div>
            <span>Test coverage</span>
            <ul>
              <li v-for="test in challenge.tests" :key="test.id">
                <strong>{{ test.title }}</strong>
                <p>{{ test.detail }}</p>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>

    <section :class="$style.playground">
      <div class="container grid">
        <div :class="$style['playground-shell']">
          <header :class="$style['playground-header']">
            <div>
              <span>Code arena</span>
              <h3>Ship the solution</h3>
            </div>
            <div :class="$style['playground-pill']">
              <span>{{ challenge.tests.length }} tests</span>
              <span>+{{ streakStats.xpReward }} XP</span>
            </div>
          </header>

          <VCodePlayground
            :exercise="streakExercise"
            @all-tests-passed="handleQuestCompletion"
          />
        </div>
      </div>
    </section>

    <div
      v-if="isCelebrating"
      :class="$style.celebration"
      role="dialog"
      aria-live="assertive"
      aria-label="Daily streak reward"
      @click.self="dismissCelebration"
    >
      <div :class="$style['celebration-card']">
        <span>🔥 Daily streak secured</span>
        <h3>{{ celebrationHeadline }}</h3>
        <p>{{ celebrationSubhead }}</p>
        <button type="button" @click="dismissCelebration">
          {{ celebrationCta }}
        </button>
      </div>

      <span
        v-for="particle in 6"
        :key="particle"
        :class="$style.confetti"
        :style="{ left: `${8 + particle * 12}%`, animationDelay: `${particle * -0.35}s` }"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<style module lang="scss">
.root {
  display: flex;
  flex-direction: column;
  gap: calc(var(--gutter-size) * 2);
  padding: calc(var(--gutter-size) * 2) 0 var(--height-space);
}

.hero {
  .container {
    row-gap: calc(var(--gutter-size) * 2);
  }
}

.hero-card {
  grid-column: 3 / 15;
  padding: 2.75rem;
  border-radius: 2rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, #1d1b26 70%, transparent), transparent),
    radial-gradient(circle at 15% 20%, color-mix(in srgb, var(--color-palette-3) 12%, transparent), transparent 60%);
  border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 35px 80px color-mix(in srgb, #000 35%, transparent);

  h1 {
    margin: 0;
    font-size: clamp(2.3rem, 4vw, 3.2rem);
    letter-spacing: 0.08em;
    font-family: var(--display-font);
  }

  p {
    margin: 0;
    max-width: 45ch;
    line-height: 1.6;
    opacity: 0.85;
  }
}

.hero-eyebrow {
  display: flex;
  justify-content: space-between;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 0.75rem;
  opacity: 0.75;
  font-family: var(--display-font);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 1rem;

  div {
    border: 1px solid color-mix(in srgb, var(--foreground-color) 15%, transparent);
    border-radius: 1.5rem;
    padding: 1.25rem;
    background: color-mix(in srgb, var(--background-color) 80%, transparent);
    display: grid;
    gap: 0.35rem;
  }

  small {
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.7;
  }

  strong {
    font-size: 2rem;
    letter-spacing: 0.04em;
    font-family: var(--display-font);
  }

  span {
    font-size: 0.85rem;
    opacity: 0.75;
  }
}

.status-card {
  grid-column: 16 / 23;
  border-radius: 2rem;
  padding: 2.25rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
  background:
    linear-gradient(150deg, color-mix(in srgb, #271d34 70%, transparent), transparent),
    radial-gradient(circle at 75% 10%, color-mix(in srgb, #ffdd55 12%, transparent), transparent 60%);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 35px 90px color-mix(in srgb, #000 30%, transparent);

  h3 {
    margin: 0.25rem 0;
    font-family: var(--display-font);
    letter-spacing: 0.08em;
  }

  p {
    margin: 0;
    opacity: 0.82;
    line-height: 1.6;
  }

  span {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.7;
  }
}

.status-tags {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;

  li {
    padding: 0.4rem 0.8rem;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--foreground-color) 18%, transparent);
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
}

.status-meter {
  width: 100%;
  height: 0.55rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--foreground-color) 12%, transparent);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    width: calc(var(--progress) * 100%);
    background: linear-gradient(90deg, #ff4d8c, #ffd454);
    transition: width 0.4s ease(out-cubic);
  }
}

.status-copy {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.8;
  line-height: 1.6;
}

.challenge {
  .container {
    row-gap: calc(var(--gutter-size));
  }
}

.challenge-brief {
  grid-column: 3 / 13;
  border-radius: 1.75rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
  padding: 2rem;
  background: color-mix(in srgb, var(--background-color) 94%, transparent);
  box-shadow: 0 20px 60px color-mix(in srgb, #000 20%, transparent);
  display: grid;
  gap: 1rem;

  span {
    font-size: 0.78rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.7;
  }

  h2 {
    margin: 0;
    font-family: var(--display-font);
    letter-spacing: 0.05em;
    font-size: 2rem;
  }

  p {
    margin: 0;
    line-height: 1.6;
    opacity: 0.85;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.65rem;

    li {
      position: relative;
      padding-left: 1.5rem;
      line-height: 1.5;
      opacity: 0.85;

      &:before {
        content: "•";
        position: absolute;
        left: 0;
        color: var(--color-palette-3);
      }
    }
  }
}

.challenge-meta {
  grid-column: 13 / 23;
  display: grid;
  gap: 1rem;
  border-radius: 1.75rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
  padding: 2rem;
  background: color-mix(in srgb, var(--background-color) 92%, transparent);

  > div {
    border-radius: 1.25rem;
    border: 1px solid color-mix(in srgb, var(--foreground-color) 10%, transparent);
    padding: 1.25rem;
    display: grid;
    gap: 0.4rem;
  }

  span {
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.7;
  }

  strong {
    font-size: 1.4rem;
    font-family: var(--display-font);
  }

  small {
    font-size: 0.8rem;
    opacity: 0.75;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.75rem;

    li {
      border-radius: 1rem;
      padding: 0.85rem;
      background: color-mix(in srgb, var(--background-color) 94%, transparent);
      border: 1px solid color-mix(in srgb, var(--foreground-color) 8%, transparent);

      strong {
        display: block;
        font-size: 0.9rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      p {
        margin: 0.3rem 0 0 0;
        font-size: 0.85rem;
        opacity: 0.8;
      }
    }
  }
}

.playground {
  .container {
    row-gap: calc(var(--gutter-size));
  }
}

.playground-shell {
  grid-column: 3 / 23;
  border-radius: 1.75rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
  padding: 2.5rem;
  background: color-mix(in srgb, var(--background-color) 96%, transparent);
  box-shadow: 0 25px 70px color-mix(in srgb, #000 22%, transparent);
  display: grid;
  gap: 1.5rem;
}

.playground-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;

  span {
    font-size: 0.78rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.7;
  }

  h3 {
    margin: 0.25rem 0 0;
    font-family: var(--display-font);
    letter-spacing: 0.08em;
  }
}

.playground-pill {
  display: inline-flex;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
  background: color-mix(in srgb, var(--foreground-color) 10%, transparent);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
}

.celebration {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, rgba(4, 4, 4, 0.9) 85%, transparent);
  backdrop-filter: blur(12px);
  display: grid;
  place-items: center;
  z-index: 999;
  animation: fade-in 0.3s ease both;
}

.celebration-card {
  position: relative;
  border-radius: 2rem;
  padding: 2.5rem;
  width: min(28rem, 90vw);
  text-align: center;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 15%, transparent);
  background:
    radial-gradient(circle at 50% 0%, color-mix(in srgb, #ffdd55 20%, transparent), transparent 60%),
    linear-gradient(160deg, #1b1320, #080808);
  box-shadow: 0 40px 120px color-mix(in srgb, #000 40%, transparent);
  display: grid;
  gap: 1rem;

  span {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.3em;
    opacity: 0.8;
  }

  h3 {
    margin: 0;
    font-size: 2.4rem;
    font-family: var(--display-font);
    letter-spacing: 0.08em;
  }

  p {
    margin: 0;
    opacity: 0.8;
    line-height: 1.6;
  }

  button {
    margin-top: 0.5rem;
    border: 0;
    border-radius: 999px;
    padding: 0.9rem 1.5rem;
    font-family: var(--display-font);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    cursor: pointer;
    background: linear-gradient(120deg, #ff4d8c, #ffd454);
    color: #050505;
    transition: transform 0.3s ease(out-cubic), box-shadow 0.3s ease(out-cubic);

    &:hover,
    &:focus-visible {
      transform: translateY(-0.15rem);
      box-shadow: 0 20px 40px color-mix(in srgb, #ff4d8c 35%, transparent);
    }
  }
}

.confetti {
  position: absolute;
  top: -5%;
  width: 0.5rem;
  height: 1.4rem;
  border-radius: 0.2rem;
  background: linear-gradient(180deg, #ffd966, #ff4d8c);
  left: 50%;
  animation: confetti-fall 4s linear infinite;
  opacity: 0.8;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-120%) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateY(140vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media screen and (max-width: 1200px) {
  .hero-card {
    grid-column: 2 / 22;
  }

  .status-card {
    grid-column: 2 / 22;
  }

  .challenge-brief,
  .challenge-meta,
  .playground-shell {
    grid-column: 2 / 24;
  }
}

@media screen and (max-width: 768px) {
  .hero-card,
  .status-card,
  .challenge-brief,
  .challenge-meta,
  .playground-shell {
    grid-column: 1 / -1;
    padding: 2rem;
  }

  .hero-eyebrow {
    flex-direction: column;
    gap: 0.2rem;
  }
}
</style>
