<script setup lang="ts">
import { useModuleListScroll } from "~/composables/useModuleListScroll";
import { getModuleXp } from "~/utils/module-xp-values";

type ModuleLite = {
  id: string;
  title: string;
  duration: string;
  difficulty: string;
};

const props = defineProps<{
  modules: ModuleLite[];
  activeId?: string;
  courseId?: string;
  visibleCount?: number;
  header?: string;
  subhead?: string;
  isModuleCompleted?: (moduleId: string) => { value: boolean };
}>();

const emit = defineEmits<{
  (e: "select", id: string): void;
}>();

const panelId = computed(
  () => `${props.courseId ?? "course"}-module-panel`
);

const { isModuleListOpen, moduleListInner, moduleListScroll, toggleModuleList } =
  useModuleListScroll({ visibleCount: props.visibleCount ?? 5 });

const onSelect = (id: string) => emit("select", id);

const moduleXpValue = (difficulty: string) => getModuleXp(difficulty);
</script>

<template>
  <aside :class="$style['module-rail']">
    <header :class="$style['module-rail__header']">
      <div>
        <p :class="$style['module-rail__eyebrow']">{{ props.header ?? 'Modules' }}</p>
        <p :class="$style['module-rail__subhead']">
          {{ props.subhead ?? `${props.modules.length} stops · stay curious` }}
        </p>
      </div>
      <button
        type="button"
        :class="$style['module-rail__toggle']"
        :aria-expanded="isModuleListOpen"
        :aria-controls="panelId"
        @click="toggleModuleList"
      >
        <span>{{ isModuleListOpen ? 'Hide' : 'Show' }}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 10L8 6L12 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </header>

    <div
      ref="moduleListInner"
      :id="panelId"
      :class="$style['module-rail__panel']"
      :aria-hidden="(!isModuleListOpen).toString()"
    >
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
            v-for="(module, index) in props.modules"
            :key="module.id"
            :class="[
              $style['module-card'],
              module.id === props.activeId && $style['module-card--active'],
              props.isModuleCompleted && props.isModuleCompleted(module.id).value && $style['module-card--completed'],
            ]"
            :aria-current="module.id === props.activeId ? 'true' : undefined"
          >
            <button type="button" :class="$style['module-card__action']" @click="onSelect(module.id)">
              <span :class="$style['module-card__number']">
                <span v-if="!props.isModuleCompleted || !props.isModuleCompleted(module.id).value">{{ (index + 1).toString().padStart(2, '0') }}</span>
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
                  <template v-if="props.isModuleCompleted && props.isModuleCompleted(module.id).value">
                    ✓ COMPLETED · +{{ moduleXpValue(module.difficulty) }} XP
                  </template>
                  <template v-else>
                    +{{ moduleXpValue(module.difficulty) }} XP ·
                    {{ module.id === props.activeId ? 'In progress' : 'Jump in' }}
                  </template>
                </span>
              </div>
              <span :class="$style['module-card__chevron']" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </button>
          </li>
        </ol>
      </div>
    </div>
  </aside>
</template>

<style module lang="scss">
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
    pointer-events: none;
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
    transition: border-color 0.25s ease, background 0.25s ease, color 0.25s ease;

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
    &[aria-hidden="true"] { pointer-events: none; }
  }

  &__scroll {
    overflow-y: auto;
    overflow-x: hidden;
    max-height: clamp(22rem, 55vh, 34rem);
    padding-right: 0.25rem;
    margin-right: -0.25rem;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-gutter: stable both-edges;
    scrollbar-color: color-mix(in srgb, var(--foreground-color) 30%, transparent) transparent;

    &::-webkit-scrollbar { width: 0.35rem; }
    &::-webkit-scrollbar-track { background: transparent; }
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

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 3 / 23;
    order: -1;
    margin-left: 0;
  }
}

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
    transition: transform 0.25s ease(out-cubic), border-color 0.25s ease(out-cubic), background 0.25s ease(out-cubic);

    &:before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(120deg, color-mix(in srgb, var(--foreground-color) 14%, transparent), transparent 70%);
      opacity: 0;
      transition: opacity 0.35s ease;
    }

    &:hover,
    &:focus-visible {
      transform: translate3d(0, -0.12rem, 0);
      border-color: color-mix(in srgb, var(--foreground-color) 35%, transparent);
    }

    &:hover:before,
    &:focus-visible:before { opacity: 0.4; }
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
    span { font-size: 1.1rem; }
    small { font-size: 0.55rem; letter-spacing: 0.3em; opacity: 0.5; }
  }

  &__body {
    display: grid;
    gap: 0.4rem;
    strong { font-family: var(--display-font); letter-spacing: 0.08em; font-size: 1.05rem; margin: 0; }
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

  &__status { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; opacity: 0.6; }

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
    &:before { opacity: 0.35; }
  }

  &--active .module-card__status { opacity: 1; }

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
</style>
