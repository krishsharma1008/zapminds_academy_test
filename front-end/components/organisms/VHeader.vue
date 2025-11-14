<script lang="ts" setup>
import { UIElements } from "~/assets/static-data/ui-elements";

const { currentFeature } = useLevelExperience();

const header = useTemplateRef("header");

const { isVisible } = useIsVisible(header);
const { isAuthenticated } = useStudentAuth();

const portalRoute = computed(() =>
  isAuthenticated.value ? "/dashboard" : "/login"
);

const portalCtaLabel = computed(() =>
  isAuthenticated.value
    ? UIElements.auth.dashboardCta
    : UIElements.auth.primaryCta
);
</script>

<template>
  <header
    :class="[$style.root, isVisible && $style['root--is-visible']]"
    ref="header"
  >
    <div class="container">
      <div :class="$style.inner">
        <nav :class="$style.nav">
          <VHeaderSiteTitleLink />

          <NuxtLink :class="$style['portal-link']" :to="portalRoute">
            <span :class="$style['portal-link__label']">
              {{ UIElements.auth.portalLabel }}
            </span>
            <span :class="$style['portal-link__cta']">
              {{ portalCtaLabel }}
            </span>
          </NuxtLink>
        </nav>

        <div :class="$style.display">
          <ClientOnly>
            <Transition
              appear
              :enter-active-class="$style['header-element-enter-active']"
              :leave-active-class="$style['header-element-leave-active']"
              :enter-from-class="$style['header-element-enter-from']"
              :leave-to-class="$style['header-element-leave-to']"
            >
              <div :class="$style.palette" v-if="currentFeature >= 3">
                <VColorPaletteButton />
              </div>
            </Transition>

            <Transition
              appear
              :enter-active-class="$style['header-element-enter-active']"
              :leave-active-class="$style['header-element-leave-active']"
              :enter-from-class="$style['header-element-enter-from']"
              :leave-to-class="$style['header-element-leave-to']"
            >
              <div v-if="currentFeature >= 2" :class="$style['theme-switcher']">
                <VThemeSwitcher />
              </div>
            </Transition>
          </ClientOnly>

          <Transition
            appear
            :enter-active-class="$style['header-element-enter-active']"
            :leave-active-class="$style['header-element-leave-active']"
            :enter-from-class="$style['header-element-enter-from']"
            :leave-to-class="$style['header-element-leave-to']"
          >
            <div :class="$style['source-code']" v-show="currentFeature >= 1">
              <VSourceCodeLink />
            </div>
          </Transition>

          <ClientOnly>
            <div :class="$style.level">
              <VLevelManager />
            </div>
          </ClientOnly>
        </div>
      </div>
    </div>
  </header>
</template>

<style module lang="scss">
.root {
  position: fixed;
  z-index: 2;
  right: 0;
  left: 0;
  pointer-events: none;
}

.inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}

.nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-family: var(--display-font);
  text-transform: uppercase;
  flex-shrink: 1;

  transform: translate3d(0, -100%, 0);
  opacity: 0;
  transition: transform 0.35s ease(out-cubic), opacity 0.35s ease(in-quad);

  @media (prefers-reduced-motion) {
    transition: none !important;
  }

  .root--is-visible & {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}

.portal-link {
  pointer-events: auto;
  color: inherit;
  text-decoration: none;
  border: 1px solid var(--foreground-color);
  border-radius: 999px;
  padding: 0.4rem 1rem;
  display: inline-flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: 0.75rem;
  line-height: 1.1;
  letter-spacing: 0.08em;
  transition: transform 0.35s ease(out-cubic),
    background-color 0.35s ease(out-cubic), color 0.35s ease(out-cubic);

  @media (prefers-reduced-motion) {
    transition: none !important;
  }

  &:hover,
  &:focus-visible {
    transform: translate3d(0, -0.2rem, 0);
    background: var(--foreground-color);
    color: var(--background-color);
  }

  &__label {
    font-size: 0.6rem;
    opacity: 0.7;
    letter-spacing: 0.12em;
  }

  &__cta {
    font-size: 0.85rem;
  }

  @media screen and (max-width: 640px) {
    display: none;
  }
}

.display {
  display: flex;
  gap: 0 1rem;
  flex-shrink: 1;
}

.header-element-enter-active,
.header-element-leave-active {
  transform: translate3d(0, 0, 0);
  opacity: 1;

  transition: transform 0.35s ease(out-cubic), opacity 0.35s ease(in-quad);

  @media (prefers-reduced-motion) {
    transition: none !important;
  }
}

.header-element-enter-from,
.header-element-leave-to {
  transform: translate3d(0, -100%, 0);
  opacity: 0;
}

.palette {
  margin: 0 0.75rem 0 0;

  @media (prefers-reduced-motion) {
    transition: none !important;
  }
}

.theme-switcher {
  display: flex;
  align-items: center;

  @media (prefers-reduced-motion) {
    transition: none !important;
  }
}

.level {
  opacity: 0;
  transition: opacity 0.35s 0.15s ease(in-quad);

  @media (prefers-reduced-motion) {
    display: none;
    transition: none !important;
  }

  .root--is-visible & {
    opacity: 1;
  }
}
</style>
