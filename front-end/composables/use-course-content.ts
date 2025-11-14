/**
 * Composable to fetch course content from database
 * Returns course metadata, modules, and capstone information
 */

import { useApiClient } from '~/composables/use-api-client';

export type CourseModule = {
  id: number;
  title: string;
  duration: string;
  difficulty: 'warmup' | 'core' | 'challenge' | 'lab';
  overview: string;
  learningObjectives: string[];
  reading: Array<{ label: string; url: string }>;
  codeConcepts: string[];
  exercise?: {
    id: string;
    title: string;
    prompt: string;
    starterCode: string;
    hints: string[];
    tests: Array<{
      id: string;
      description: string;
      assertion: string;
      expected: string;
    }>;
  };
  externalId: string;
};

export type CourseCapstone = {
  id: string;
  title: string;
  summary: string;
  deliverables: string[];
  checkpoints: string[];
};

export type CourseContent = {
  courseId: number;
  title: string;
  slug: string;
  hero: {
    headline: string;
    kicker: string;
    description: string;
    progressPercent: number;
  };
  modules: CourseModule[];
  capstone?: CourseCapstone;
};

export type CourseContentResponse = {
  course: {
    id: number;
    title: string;
    slug: string;
    description: string;
  };
  modules: Array<{
    id: number;
    title: string;
    orderIndex: number;
    xpValue: number;
    details: {
      externalId: string;
      duration: string;
      difficulty: string;
      overview: string;
      learningObjectives: string[];
      reading: Array<{ label: string; url: string }>;
      codeConcepts: string[];
      exercise: any;
    };
  }>;
};

export const useCourseContent = (courseSlug: string) => {
  const { authFetch } = useApiClient();

  // Map short slugs to database slugs
  const slugMapping: Record<string, string> = {
    'python': 'python',
    'machine-learning': 'machine-learning-systems',
    'ml': 'machine-learning-systems',
    'deep-learning': 'deep-learning-studio',
    'dl': 'deep-learning-studio',
    'llm-engineering': 'llm-engineering-lab',
    'llm': 'llm-engineering-lab',
    'rag': 'retrieval-augmented-generation',
    'mcp': 'model-context-protocol',
    'agentic-ai': 'agentic-ai-applications',
    'agentic': 'agentic-ai-applications',
  };

  const dbSlug = slugMapping[courseSlug] || courseSlug;

  const { data: contentData, pending, error, refresh } = useAsyncData(
    `course-content:${courseSlug}`,
    async () => {
      if (!courseSlug) {
        return null;
      }

      try {
        const response = await authFetch<CourseContentResponse>(
          `/api/courses/${dbSlug}/content`,
          {
            method: 'GET',
          }
        );

        // Transform API response to match component structure
        const modules: CourseModule[] = (response.modules || []).map((m) => ({
          id: m.id,
          title: m.title,
          duration: m.details.duration,
          difficulty: m.details.difficulty as CourseModule['difficulty'],
          overview: m.details.overview,
          learningObjectives: m.details.learningObjectives || [],
          reading: m.details.reading || [],
          codeConcepts: m.details.codeConcepts || [],
          exercise: m.details.exercise,
          externalId: m.details.externalId,
        }));

        const course = response.course;
        const heroDescription =
          course.description ||
          'Master this comprehensive course with hands-on modules and real-world projects.';

        const content: CourseContent = {
          courseId: course.id,
          title: course.title,
          slug: course.slug,
          hero: {
            headline: course.title,
            kicker: `${course.title} • Professional Development`,
            description: heroDescription,
            progressPercent: 0,
          },
          modules,
          capstone: {
            id: `${courseSlug}-capstone`,
            title: `${course.title} Capstone Project`,
            summary: `Complete a comprehensive capstone project that demonstrates your mastery of ${course.title} concepts.`,
            deliverables: [
              'Production-ready implementation',
              'Comprehensive documentation',
              'Test coverage and validation',
            ],
            checkpoints: [
              'Requirements & Design',
              'Implementation & Testing',
              'Documentation & Review',
              'Final Deployment',
            ],
          },
        };

        return content;
      } catch (fetchError) {
        console.error(`[course-content] Failed to load ${courseSlug}:`, fetchError);
        return null;
      }
    },
    {
      default: () => null,
      server: true,
      lazy: false,
    }
  );

  return {
    course: computed(() => contentData.value),
    modules: computed(() => contentData.value?.modules ?? []),
    capstone: computed(() => contentData.value?.capstone),
    pending: computed(() => pending.value),
    error: computed(() => error.value),
    refresh,
  };
};

