<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";
import type { PortableTextBlock } from "@portabletext/types";

const props = defineProps<{
  intro?: NonNullable<HomeQueryResult>["intro"];
}>();

const skipGame = useTemplateRef("skip-game");
const { isVisible } = useIsVisible(skipGame);

// ZapMinds content formatted as PortableText blocks
const zapMindsIntro: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "zapminds-1",
    style: "normal",
    children: [
      {
        _type: "span",
        _key: "zapminds-1-1",
        text: "ZapMinds is ZapCom's internal innovation and research catalyst - engineered to drive future-readiness, market leadership, and sustained revenue growth. We focus on delivering Innovation-as-a-Service (InaaS) and Results-as-a-Service (RaaS) through emerging technologies like GenAI, Agentic AI, and next-gen data platforms. We don't just explore the future - we build it.",
        marks: [],
      },
    ],
  },
  {
    _type: "block",
    _key: "zapminds-2",
    style: "normal",
    children: [
      {
        _type: "span",
        _key: "zapminds-2-1",
        text: "ZapMinds identifies frontier opportunities and transforms them into structured Proofs of Concept (PoCs), Minimum Viable Products (MVPs), and scalable solution frameworks. Whether it's solving tomorrow's problems today or co-creating breakthrough ideas with our clients, ZapMinds is where ZapCom's boldest innovations come to life.",
        marks: [],
      },
    ],
  },
  {
    _type: "block",
    _key: "zapminds-academy-1",
    style: "normal",
    children: [
      {
        _type: "span",
        _key: "zapminds-academy-1-1",
        text: "ZapMinds Academy is a ZapMinds initiative dedicated to continuous learning and professional growth. We believe that the journey of innovation never stops, and neither should the pursuit of knowledge. Through comprehensive training programs, hands-on workshops, and cutting-edge curriculum, ZapMinds Academy empowers individuals and teams to stay ahead of the curve in an ever-evolving technological landscape. Our mission is to upskill professionals at every level, ensuring that learning becomes a continuous, integrated part of your career journey. Whether you're exploring emerging technologies, mastering new frameworks, or diving deep into specialized domains, ZapMinds Academy provides the resources, mentorship, and community support you need to thrive.",
        marks: [],
      },
    ],
  },
];

// Use ZapMinds content instead of CMS content
const displayIntro = computed(() => zapMindsIntro);
</script>

<template>
  <div :class="$style.root" class="container grid">
    <VSectionCounter :section="1" :class="$style['section-counter']" />
    <div :class="$style.intro" v-if="displayIntro">
      <!-- @vue-ignore -->
      <VSanityBlock :content="displayIntro" />

      <div
        ref="skip-game"
        :class="[
          $style['skip-game'],
          isVisible && $style['skip-game--is-visible'],
        ]"
      >
        <VSkipGame />
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.root {
  position: relative;
  z-index: 1;
}

.intro {
  @include left-column-text;
}

.skip-game {
  font-size: 1rem;
  margin-top: 3rem;

  opacity: 0;
  transition: opacity 0.5s 0.5s ease(in-quad);

  &--is-visible {
    opacity: 1;
  }

  @media (prefers-reduced-motion) {
    transition: none;
  }
}

.section-counter {
  inset: 3rem var(--gutter-size);
}
</style>
