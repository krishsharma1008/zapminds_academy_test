<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";
import type { PortableTextBlock } from "@portabletext/types";

const props = defineProps<{
  title?: NonNullable<HomeQueryResult>["footerTitle"];
  siteTitle?: NonNullable<HomeQueryResult>["title"];
  description?: NonNullable<HomeQueryResult>["footerDescription"];
  socials?: NonNullable<HomeQueryResult>["socials"];
}>();

const credits = useTemplateRef("credits");
const { isVisible: isCreditsVisible } = useIsVisible(credits);

const { addFeaturePoints } = useLevelExperience();

watch(isCreditsVisible, () => {
  if (isCreditsVisible.value) {
    addFeaturePoints(1);
  }
});

const isGridHelperVisible = ref(false);
let hasGridBeenVisible = false;

const toggleGridHelper = () => {
  isGridHelperVisible.value = !isGridHelperVisible.value;

  if (!hasGridBeenVisible) {
    addFeaturePoints(3);
  }

  hasGridBeenVisible = true;
};

// ZapMinds footer description content formatted as PortableText blocks
const zapMindsFooter: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "zapminds-footer-1",
    style: "normal",
    children: [
      {
        _type: "span",
        _key: "zapminds-footer-1-1",
        text: "Thank you for exploring ZapMinds Academy! We're excited to share our journey of innovation and continuous learning with you.",
        marks: [],
      },
    ],
  },
  {
    _type: "block",
    _key: "zapminds-footer-2",
    style: "normal",
    children: [
      {
        _type: "span",
        _key: "zapminds-footer-2-1",
        text: "Interested in learning more about ZapMinds' innovative solutions? Want to explore our training programs? Ready to collaborate on your next breakthrough project?",
        marks: [],
      },
    ],
  },
  {
    _type: "block",
    _key: "zapminds-footer-3",
    style: "normal",
    markDefs: [
      {
        _type: "link",
        _key: "link-1",
        href: "https://zapcom.ai/",
      },
    ],
    children: [
      {
        _type: "span",
        _key: "zapminds-footer-3-1",
        text: "Visit ",
        marks: [],
      },
      {
        _type: "span",
        _key: "zapminds-footer-3-2",
        text: "zapcom.ai",
        marks: ["link-1"],
      },
      {
        _type: "span",
        _key: "zapminds-footer-3-3",
        text: " to discover how ZapMinds can help transform your ideas into reality and join us in building the future of technology.",
        marks: [],
      },
    ],
  },
];

// Use ZapMinds footer description instead of CMS content
const displayDescription = computed(() => zapMindsFooter);

// Override site title to show Zapminds
const displaySiteTitle = computed(() => "Zapminds");
</script>

<template>
  <footer :class="$style.root">
    <div :class="$style['top-separator']">
      <VCanvasSeparator :invert-colors="true" />
    </div>

    <div class="container grid">
      <h2 :class="$style.title" v-if="title">
        <VAnimatedTextByLetters :align="'center'" :label="title" />
      </h2>
    </div>

    <div :class="$style.content" class="container grid">
      <div :class="$style.description" v-if="displayDescription">
        <!-- @vue-ignore -->
        <VSanityBlock :content="displayDescription" />
      </div>

      <div
        :class="[
          $style.credit,
          isCreditsVisible && $style['credit--is-visible'],
        ]"
        ref="credits"
        @click="toggleGridHelper"
      >
        {{ new Date().getFullYear() }} - {{ displaySiteTitle }}
      </div>
    </div>

    <ClientOnly>
      <VGridHelper :is-visible="isGridHelperVisible" />
    </ClientOnly>
  </footer>
</template>

<style lang="scss" module>
.root {
  position: relative;
  padding: calc(var(--height-space) * 0.5) 0 3rem 0;
}

.top-separator {
  @include top-separator;
  top: 0;
}

.title {
  @include section-title;
  grid-column: 7 / 19;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 4 / 10;
  }

  @media screen and (orientation: portrait) {
    grid-column: 2 / 12;
  }
}

.content {
  margin-top: 3rem;
}

.description {
  grid-column: 3 / 10;
  padding: 3rem 0 0 0;
  font-size: 1.5rem;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 2 / 8;
  }

  @media screen and (max-aspect-ratio: 10 / 8) {
    font-size: 1.25rem;
    grid-column: 2 / 12;
  }
}

.socials {
  grid-column: 15 / 23;
  padding: 0;
  padding-top: 3rem;
  margin: 3rem 0;
  list-style: none;
  font-size: 1.25rem;
  text-align: right;
  font-family: var(--light-display-font);

  @media screen and (max-aspect-ratio: 12 / 8) {
    padding-top: 0;
    grid-column: 6 / 12;
  }

  @media screen and (max-aspect-ratio: 10 / 8) {
    grid-column: 2 / 12;
  }

  li {
    opacity: 0;

    @for $i from 1 through 10 {
      &:nth-child(#{$i}) {
        transition: opacity 0.5s calc(0.5s + #{$i * 0.1s}) ease(in-out-quad);
      }
    }

    @media (prefers-reduced-motion) {
      transition: none !important;
    }

    a {
      text-decoration: none;
      text-transform: uppercase;
      display: inline-block;
      backface-visibility: hidden;
      will-change: transform;

      transition: transform 0.35s ease(out-expo);

      @media (prefers-reduced-motion) {
        transition: none !important;
      }

      &:hover,
      &:focus-visible {
        transform: skew(-15deg, 0deg);
      }
    }
  }

  &--is-visible {
    li {
      opacity: 1;
    }
  }
}

.credit {
  margin-top: 3rem;
  grid-column: 1 / -1;
  text-align: center;
  font-size: var(--small-font-size);

  opacity: 0;
  transition: opacity 0.5s 0.5s ease(in-out-quad);

  @media (prefers-reduced-motion) {
    transition: none !important;
  }

  &--is-visible {
    opacity: 1;
  }
}
</style>
