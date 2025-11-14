<script setup lang="ts">
import { useModuleListScroll } from "~/composables/useModuleListScroll";
import { getModuleXp } from "~/utils/module-xp-values";
import { pythonFoundationsContent } from "~/utils/python-foundations-data";

definePageMeta({
  layout: "course",
  middleware: ["student-auth"],
});

const { hero, modules, capstone } = pythonFoundationsContent;
const { progress: courseProgressData } = useCourseProgress("python");
const { completedExternalIds, isModuleCompleted } = useCourseCompletions("python");
const courseProgressState = computed(() => courseProgressData.value);
const staticModuleXpTotal = modules.reduce(
  (sum, module) => sum + getModuleXp(module.difficulty),
  0
);

const heroProgressPercent = computed(
  () => courseProgressState.value?.completionPercent ?? hero.progressPercent
);
const courseEarnedXp = computed(() => courseProgressState.value?.earnedXp ?? 0);
const courseTotalXp = computed(
  () => courseProgressState.value?.totalXp ?? staticModuleXpTotal
);

const moduleXpValue = (difficulty: string) => getModuleXp(difficulty);
const activeModuleId = ref(modules[0]?.id ?? "");
// TODO: Persist the learner's last-opened module once progress sync lands.
const modulePanelId = `${pythonFoundationsContent.courseId}-module-panel`;
// TODO: Revisit panel id strategy when we support nested course slugs.

const {
  isModuleListOpen,
  moduleListInner,
  moduleListScroll,
  toggleModuleList,
} = useModuleListScroll({ visibleCount: 5 });

const activeModule = computed(() =>
  modules.find((module) => module.id === activeModuleId.value)
);

const onSelectModule = (moduleId: string) => {
  activeModuleId.value = moduleId;
};
</script>

<template>
  <div :class="$style.root">
    <section :class="$style.hero">
      <div class="container grid">
        <div :class="$style['hero-copy']">
          <span :class="$style.kicker">{{ hero.kicker }}</span>
          <h1>{{ hero.headline }}</h1>
          <p>{{ hero.description }}</p>

          <div :class="$style.progress">
            <span>Course progress</span>
            <div>
              <span :style="{ '--progress': heroProgressPercent / 100 }"></span>
            </div>
            <strong>{{ heroProgressPercent }}%</strong>
            <p :class="$style['progress-xp']">
              {{ courseEarnedXp }} / {{ courseTotalXp }} XP earned
            </p>
          </div>
        </div>

        <aside
          :class="[
            $style['module-rail'],
            !isModuleListOpen && $style['module-rail--collapsed'],
          ]"
        >
          <header :class="$style['module-rail__header']">
            <div>
              <p :class="$style['module-rail__eyebrow']">Modules</p>
              <p :class="$style['module-rail__subhead']">
                {{ modules.length }} stops · stay curious
              </p>
            </div>
            <button
              type="button"
              :class="$style['module-rail__toggle']"
              :aria-expanded="isModuleListOpen"
              :aria-controls="modulePanelId"
              @click="toggleModuleList"
            >
              <span>{{ isModuleListOpen ? "Hide" : "Show" }}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 10L8 6L12 10"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </header>

          <div
            ref="moduleListInner"
            :id="modulePanelId"
            :class="$style['module-rail__panel']"
            :aria-hidden="!isModuleListOpen"
          >
            <!-- TODO: Slide in module filter pills once curriculum tags are finalised. -->
            <div
              ref="moduleListScroll"
              tabindex="0"
              :class="$style['module-rail__scroll']"
              data-lenis-prevent
              data-lenis-prevent-wheel
              data-lenis-prevent-touch
              @wheel.stop
              @touchmove.stop
            >
              <ol role="list" :class="$style['module-rail__list']">
                <li
                  v-for="(module, index) in modules"
                  :key="module.id"
                  :class="[
                    $style['module-card'],
                    module.id === activeModuleId && $style['module-card--active'],
                    isModuleCompleted(module.id).value && $style['module-card--completed'],
                  ]"
                >
                  <button
                    type="button"
                    :class="$style['module-card__action']"
                    @click="onSelectModule(module.id)"
                  >
                    <span :class="$style['module-card__number']">
                      <span v-if="!isModuleCompleted(module.id).value">{{ (index + 1).toString().padStart(2, '0') }}</span>
                      <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <small>module</small>
                    </span>

                    <div :class="$style['module-card__body']">
                      <div :class="$style['module-card__meta']">
                        <span>{{ module.duration.toUpperCase() }}</span>
                        <span>{{ module.difficulty.toUpperCase() }}</span>
                      </div>
                      <strong>{{ module.title }}</strong>
                      <span :class="$style['module-card__status']">
                        <template v-if="isModuleCompleted(module.id).value">
                          ✓ COMPLETED · +{{ moduleXpValue(module.difficulty) }} XP
                        </template>
                        <template v-else>
                          +{{ moduleXpValue(module.difficulty) }} XP ·
                          {{ module.id === activeModuleId ? "In progress" : "Jump in" }}
                        </template>
                      </span>
                    </div>

                    <span :class="$style['module-card__chevron']" aria-hidden="true">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.5 5L12.5 10L7.5 15"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                </li>
              </ol>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <section v-if="activeModule" :class="$style.module">
      <div class="container grid">
        <header :class="$style['module-header']">
          <div>
            <span :class="$style['module-duration-pill']">
              {{ activeModule.duration }}
            </span>
            <h2>{{ activeModule.title }}</h2>
          </div>

          <div :class="$style['module-overview']">
            <p>{{ activeModule.overview }}</p>

            <div :class="$style['module-pill-group']">
              <span v-for="concept in activeModule.codeConcepts" :key="concept">
                {{ concept }}
              </span>
            </div>
          </div>
        </header>

        <div :class="$style['module-content']">
          <header>
            <h3>Learning objectives</h3>
            <p>
              {{
                activeModule.learningObjectives
                  .map((objective) => objective.replace(/\.$/, ""))
                  .join(". ")
              }}.
            </p>
          </header>

          <div :class="$style['module-sections']">
            <section>
              <h4>Objectives detail</h4>
              <ul>
                <li v-for="objective in activeModule.learningObjectives" :key="objective">
                  {{ objective }}
                </li>
              </ul>
            </section>

            <section>
              <h4>Suggested reading</h4>
              <ul>
                <li v-for="resource in activeModule.reading" :key="resource.url">
                  <NuxtLink :to="resource.url" target="_blank">
                    {{ resource.label }}
                  </NuxtLink>
                </li>
              </ul>
            </section>
          </div>

          <section :class="$style['module-exercise']">
            <header>
              <h3>{{ activeModule.exercise.title }}</h3>
              <p>{{ activeModule.exercise.prompt }}</p>
            </header>

            <VCodePlayground
              :exercise="activeModule.exercise"
              :module-id="activeModule.id"
              :module-difficulty="activeModule.difficulty"
              :module-title="activeModule.title"
            />
          </section>
        </div>
      </div>
    </section>

    <section :class="$style.capstone">
      <div class="container grid">
        <header>
          <span>Capstone</span>
          <h2>{{ capstone.title }}</h2>
          <p>{{ capstone.summary }}</p>
        </header>

        <div :class="$style['capstone-checklist']">
          <div>
            <h3>Deliverables</h3>
            <ul>
              <li v-for="deliverable in capstone.deliverables" :key="deliverable">
                {{ deliverable }}
              </li>
            </ul>
          </div>
          <div>
            <h3>Checkpoints</h3>
            <ul>
              <li v-for="checkpoint in capstone.checkpoints" :key="checkpoint">
                {{ checkpoint }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style module lang="scss">
.root {
  display: flex;
  flex-direction: column;
  gap: calc(var(--height-space) * 0.7);
  padding-bottom: var(--height-space);
}

.hero {
  .container {
    align-items: start;
    row-gap: calc(var(--gutter-size) * 3);
  }
}

.hero-copy {
  grid-column: 3 / 15;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  h1 {
    @include section-title;
    transform: none;
    -webkit-text-stroke: 0;
    text-align: left;
    margin: 0;
  }

  p {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.65;
    opacity: 0.85;
    max-width: 58ch;
  }
}

.kicker {
  font-family: var(--display-font);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.75rem;
  opacity: 0.7;
}

.progress {
  display: grid;
  gap: 0.5rem;
  max-width: 22rem;

  span:first-child {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  div {
    width: 100%;
    height: 0.6rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--foreground-color) 15%, transparent);
    overflow: hidden;

    span {
      display: block;
      width: calc(var(--progress) * 100%);
      height: 100%;
      background: var(--foreground-color);
      transition: width 0.6s ease(out-cubic);
    }
  }

  strong {
    font-family: var(--display-font);
    letter-spacing: 0.1em;
    font-size: 1rem;
  }

  .progress-xp {
    font-size: 0.9rem;
    color: color-mix(in srgb, var(--foreground-color) 70%, transparent);
  }
}

/* TODO: Extract module-rail tokens into the global theme map once finalised. */
.module-rail {
  grid-column: 1 / 24;
  background: color-mix(in srgb, var(--background-color) 90%, transparent);
  border-radius: 2rem;
  padding: 2.25rem;
  box-shadow: 0 25px 75px color-mix(in srgb, #000 22%, transparent);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-left: 3rem;
  position: relative;
  isolation: isolate;
  overflow: hidden;

  &:before {
    content: "";
    position: absolute;
    inset: 1.25rem;
    border-radius: 2rem;
    background: radial-gradient(
      circle at 15% 25%,
      color-mix(in srgb, var(--foreground-color) 6%, transparent),
      transparent 60%
    );
    opacity: 0.7;
    z-index: -1;
    pointer-events: none; // ensure decorative layer never blocks scrolling/hover
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  &__eyebrow {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 0.75rem;
    font-family: var(--display-font);
    opacity: 0.7;
  }

  &__subhead {
    margin: 0.15rem 0 0;
    font-size: 0.85rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0.55;
  }

  &__toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.55rem 0.9rem;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--foreground-color) 18%, transparent);
    background: color-mix(in srgb, var(--foreground-color) 8%, transparent);
    color: inherit;
    cursor: pointer;
    font: inherit;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-size: 0.7rem;
    transition: border-color 0.25s ease, background 0.25s ease,
      color 0.25s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--foreground-color);
      background: color-mix(in srgb, var(--foreground-color) 14%, transparent);
    }

    svg {
      width: 0.85rem;
      height: 0.85rem;
      transition: transform 0.25s ease;
      transform: rotate(180deg);
    }
  }

  &__panel {
    display: grid;
    gap: 1rem;
    overflow: hidden;
    height: auto;
    opacity: 1;
    transition: height 0.35s ease, opacity 0.35s ease;

    &[aria-hidden="true"] {
      pointer-events: none;
    }
  }

  &__scroll {
    overflow-y: auto;
    overflow-x: hidden;
    max-height: clamp(22rem, 55vh, 34rem);
    padding-right: 0.25rem;
    margin-right: -0.25rem;
    -webkit-overflow-scrolling: touch; // smooth scroll on iOS/macOS
    overscroll-behavior: contain; // prevent page scroll hijack when at edges
    scrollbar-width: thin;
    scrollbar-gutter: stable both-edges;
    scrollbar-color: color-mix(in srgb, var(--foreground-color) 30%, transparent)
      transparent;

    &::-webkit-scrollbar {
      width: 0.35rem;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--foreground-color) 30%, transparent);
      border-radius: 999px;
    }
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 1rem;
  }

  &--collapsed &__toggle svg {
    transform: rotate(0deg);
  }

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 3 / 23;
    order: -1;
    margin-left: 0;
  }
}

/* TODO: Replace the module-card accent gradient with difficulty-based hues. */
.module-card {
  list-style: none;

  &__action {
    width: 100%;
    border-radius: 1.85rem;
    border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
    background: color-mix(in srgb, var(--background-color) 96%, transparent);
    padding: 1.15rem 1.5rem;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 1.25rem;
    position: relative;
    overflow: hidden;
    text-align: left;
    color: inherit;
    font: inherit;
    cursor: pointer;
    transition: transform 0.25s ease(out-cubic),
      border-color 0.25s ease(out-cubic),
      background 0.25s ease(out-cubic);

    &:before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(
        120deg,
        color-mix(in srgb, var(--foreground-color) 14%, transparent),
        transparent 70%
      );
      opacity: 0;
      transition: opacity 0.35s ease;
    }

    &:hover,
    &:focus-visible {
      transform: translate3d(0, -0.12rem, 0);
      border-color: color-mix(
        in srgb,
        var(--foreground-color) 35%,
        transparent
      );
    }

    &:hover:before,
    &:focus-visible:before {
      opacity: 0.4;
    }
  }

  &__number {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-transform: uppercase;
    font-family: var(--display-font);
    letter-spacing: 0.18em;
    gap: 0.15rem;

    span {
      font-size: 1.1rem;
    }

    small {
      font-size: 0.55rem;
      letter-spacing: 0.3em;
      opacity: 0.5;
    }
  }

  &__body {
    display: grid;
    gap: 0.4rem;

    strong {
      font-family: var(--display-font);
      letter-spacing: 0.08em;
      font-size: 1.05rem;
      margin: 0;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.72rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.65;
  }

  &__status {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    opacity: 0.6;
  }

  &__chevron {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--foreground-color) 15%, transparent);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--foreground-color) 6%, transparent);
  }

  &--active .module-card__action {
    border-color: var(--foreground-color);
    background: color-mix(in srgb, var(--foreground-color) 10%, transparent);

    &:before {
      opacity: 0.35;
    }
  }

  &--active .module-card__status {
    opacity: 1;
  }

  &--completed .module-card__action {
    border-color: color-mix(in srgb, #10b981 50%, transparent);
    background: color-mix(in srgb, #10b981 8%, transparent);

    &:before {
      background: linear-gradient(120deg, color-mix(in srgb, #10b981 18%, transparent), transparent 70%);
      opacity: 0.5;
    }
  }

  &--completed .module-card__number {
    color: #10b981;
    
    svg {
      stroke: #10b981;
    }
  }

  &--completed .module-card__status {
    color: #10b981;
    opacity: 1;
    font-weight: 600;
  }
}

.module {
  .container {
    row-gap: calc(var(--gutter-size) * 2);
  }
}

.module-header {
  grid-column: 3 / 23;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 2rem;

  h2 {
    margin: 0;
    font-family: var(--display-font);
    font-size: 2.5rem;
    letter-spacing: 0.05em;
  }
}

.module-duration-pill {
  display: inline-flex;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 18%, transparent);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
}

.module-overview {
  max-width: 48ch;
  display: grid;
  gap: 1rem;

  p {
    margin: 0;
    font-size: 1rem;
    line-height: 1.6;
    opacity: 0.85;
  }
}

.module-pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  span {
    border-radius: 999px;
    padding: 0.35rem 0.8rem;
    background: color-mix(in srgb, var(--foreground-color) 12%, transparent);
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
}

.module-content {
  grid-column: 3 / 23;
  display: grid;
  gap: 2rem;

  header {
    display: grid;
    gap: 0.75rem;

    h3 {
      font-family: var(--display-font);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-size: 1rem;
      margin: 0;
    }

    p {
      margin: 0;
      line-height: 1.65;
      opacity: 0.85;
      max-width: 70ch;
    }
  }
}

.module-sections {
  display: grid;
  gap: 1.75rem;

  @media screen and (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }

  section {
    display: grid;
    gap: 0.75rem;
  }

  h4 {
    font-family: var(--display-font);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 0.95rem;
    margin: 0;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.5rem;

    li {
      position: relative;
      padding-left: 1.25rem;
      line-height: 1.5;
      opacity: 0.8;

      &:before {
        content: "•";
        position: absolute;
        left: 0;
        color: var(--foreground-color);
      }
    }
  }
}

.module-exercise {
  background: color-mix(in srgb, var(--background-color) 94%, transparent);
  border-radius: 1.75rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
  padding: 2rem;
  display: grid;
  gap: 1.25rem;
  box-shadow: 0 20px 60px color-mix(in srgb, #000 20%, transparent);

  header {
    display: grid;
    gap: 0.75rem;

    h3 {
      margin: 0;
      font-family: var(--display-font);
      letter-spacing: 0.08em;
    }

    p {
      margin: 0;
      font-size: 0.95rem;
      opacity: 0.8;
      line-height: 1.6;
    }
  }
}

.capstone {
  .container {
    row-gap: calc(var(--gutter-size) * 2);
  }

  header {
    grid-column: 3 / 11;
    display: grid;
    gap: 0.75rem;

    span {
      font-family: var(--display-font);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-size: 0.8rem;
      opacity: 0.7;
    }

    h2 {
      margin: 0;
      font-family: var(--display-font);
      font-size: 2.3rem;
      letter-spacing: 0.05em;
    }

    p {
      margin: 0;
      opacity: 0.8;
      line-height: 1.6;
    }
  }
}

.capstone-checklist {
  grid-column: 11 / 23;
  display: grid;
  gap: 1.5rem;
  background: color-mix(in srgb, var(--background-color) 94%, transparent);
  border-radius: 1.75rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
  padding: 2rem;

  h3 {
    font-family: var(--display-font);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.9rem;
    margin: 0 0 0.6rem 0;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.5rem;

    li {
      opacity: 0.8;
      line-height: 1.5;
    }
  }
}
</style>
