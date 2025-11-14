<script setup lang="ts">
import { getModuleXp } from "~/utils/module-xp-values";
import { mcpCourseContent } from "~/utils/mcp-course-data";

definePageMeta({
  layout: "course",
  middleware: ["student-auth"],
});

const { hero, modules, capstone } = mcpCourseContent;
const { progress: courseProgressData } = useCourseProgress("mcp");
const { completedExternalIds, isModuleCompleted } = useCourseCompletions("mcp");
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
const activeModuleId = ref(modules[0]?.id ?? "");
// Panel handled by VModuleRail

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

        <VModuleRail
          :modules="modules"
          :active-id="activeModuleId"
          :course-id="mcpCourseContent.courseId"
          :is-module-completed="isModuleCompleted"
          @select="onSelectModule"
        />
      </div>
    </section>

    <section v-if="activeModule" :class="$style.module">
      <div class="container grid">
        <header :class="$style['module-header']">
          <div>
            <span :class="$style['module-duration-pill']">{{ activeModule.duration }}</span>
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
                  <NuxtLink :to="resource.url" target="_blank">{{ resource.label }}</NuxtLink>
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

.module-list {
  grid-column: 14 / 24;
  background: color-mix(in srgb, var(--background-color) 90%, transparent);
  border-radius: 1.75rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
  padding: 2rem;
  box-shadow: 0 25px 75px color-mix(in srgb, #000 18%, transparent);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-left: 1.5rem;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  &__header h2 {
    font-family: var(--display-font);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0;
  }

  &__toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.75rem;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--foreground-color) 18%, transparent);
    background: color-mix(in srgb, var(--foreground-color) 8%, transparent);
    color: inherit;
    cursor: pointer;
    font: inherit;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.7rem;
    transition: border-color 0.25s ease, background 0.25s ease;

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
    max-height: var(--module-scroll-height, clamp(20rem, 50vh, 32rem));
    padding-right: 0.25rem;
    scrollbar-width: thin;
    scrollbar-gutter: stable;
    scrollbar-color: color-mix(in srgb, var(--foreground-color) 35%, transparent)
      transparent;

    &::-webkit-scrollbar {
      width: 0.35rem;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--foreground-color) 35%, transparent);
      border-radius: 999px;
    }

    ol {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 1rem;
    }
  }

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 3 / 23;
    order: -1;
    margin-left: 0;
  }
}

.module-list--collapsed .module-list__toggle svg {
  transform: rotate(0deg);
}

.module-list__item {
  button {
    width: 100%;
    background: transparent;
    border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
    border-radius: 1.5rem;
    padding: 1rem 1.25rem;
    display: flex;
    gap: 1rem;
    text-align: left;
    color: inherit;
    font: inherit;
    cursor: pointer;
    transition: border-color 0.3s ease(out-cubic), transform 0.3s ease(out-cubic);

    &:hover,
    &:focus-visible {
      transform: translate3d(0, -0.15rem, 0);
      border-color: var(--foreground-color);
    }
  }

  &--is-active button {
    border-color: var(--foreground-color);
    background: color-mix(in srgb, var(--foreground-color) 12%, transparent);
  }
}

.module-index {
  font-family: var(--display-font);
  font-size: 1rem;
  letter-spacing: 0.1em;
}

.module-duration {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.7;
}

.module-difficulty {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.6;
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
