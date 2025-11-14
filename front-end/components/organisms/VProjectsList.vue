<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";
import type { PortableTextBlock } from "@portabletext/types";

const props = defineProps<{
  title?: NonNullable<HomeQueryResult>["projectsTitle"];
  description?: NonNullable<HomeQueryResult>["projectsDescription"];
  projects?: NonNullable<HomeQueryResult>["projects"];
  recognition?: NonNullable<HomeQueryResult>["recognition"];
}>();

const projectsContainer = useTemplateRef("projects-container");
const { isVisible } = useIsVisible(projectsContainer);
const { addLevelPoints } = useLevelExperience();

watch(isVisible, () => {
  if (isVisible.value) {
    addLevelPoints(1);
  }
});

// Projects description content formatted as PortableText blocks
const projectsDescription: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "projects-desc-1",
    style: "normal",
    children: [
      {
        _type: "span",
        _key: "projects-desc-1-1",
        text: "Here's a small selection of some creative projects that we've had the chance to work on.",
        marks: [],
      },
    ],
  },
  {
    _type: "block",
    _key: "projects-desc-2",
    style: "normal",
    children: [
      {
        _type: "span",
        _key: "projects-desc-2-1",
        text: "Across all of them, innovation was a key focus, ensuring customer experience as well.",
        marks: [],
      },
    ],
  },
];

// Use new projects description instead of CMS content
const displayDescription = computed(() => projectsDescription);

// New project names from the table
const newProjectNames = [
  "Zack.AI",
  "AI Sentiment Analysis",
  "Traveler Experience Platform (B2G)",
  "ZapGenie",
  "AI Scrum Master",
  "Voyage.AI",
];

// Map projects to use new names and set all URLs to zapcom.ai
const displayProjects = computed(() => {
  if (!props.projects) return [];
  return props.projects.map((project, index) => ({
    ...project,
    title: newProjectNames[index] || project.title,
    url: "https://zapcom.ai/",
  }));
});
</script>

<template>
  <div :class="$style.root" ref="projects">
    <div :class="$style['top-separator']">
      <VCanvasSeparator :invert-colors="true" />
    </div>

    <div v-if="title" class="container grid">
      <h2 :class="$style.title">
        <VAnimatedTextByLetters :align="'center'" :label="title" />
      </h2>
    </div>

    <div :class="$style.projects">
      <div class="container grid">
        <div :class="$style.description" v-if="displayDescription">
          <!-- @vue-ignore -->
          <VSanityBlock :content="displayDescription" />
        </div>

        <ul
          :class="$style.list"
          v-if="displayProjects && displayProjects.length > 0"
          ref="projects-container"
          :style="{ '--nb-items': displayProjects.length }"
        >
          <li v-for="(project, i) in displayProjects" :key="i" ref="projects-items">
            <VProjectThumb :project="project" :index="i" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
.root {
  background: var(--bg-color);
  position: relative;
  margin: calc(var(--height-space) * 0.5) 0 0 0;
}

.title {
  @include section-title;
  grid-column: 7 / 19;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 3 / 11;
  }

  @media screen and (orientation: portrait) {
    grid-column: 2 / 12;
  }
}

.projects {
  position: relative;
  margin: 3rem 0 0 0;
}

.top-separator {
  @include top-separator;
  top: calc(var(--height-space) * -0.5);
}

.bottom-separator {
  @include bottom-separator;
}

.list {
  list-style: none;
  padding: 0;
  position: sticky;
  margin: 0;
  grid-column: 5 / 21;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 3 / 11;
  }

  @media screen and (orientation: portrait) {
    grid-column: 1 / -1;
  }
}

.description,
.recognition {
  @include right-column-text;
}
</style>
