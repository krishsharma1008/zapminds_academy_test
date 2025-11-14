import { computed } from "vue";

export type CourseProgressResponse = {
  courseId: number;
  courseSlug: string;
  completedModules: number;
  totalModules: number;
  earnedXp: number;
  totalXp: number;
  completionPercent: number;
  nextModuleId: number | null;
  nextModuleSlug: string | null;
  nextModuleTitle: string | null;
};

const createDefaultCourseProgress = (courseSlug: string): CourseProgressResponse => ({
  courseId: 0,
  courseSlug,
  completedModules: 0,
  totalModules: 0,
  earnedXp: 0,
  totalXp: 0,
  completionPercent: 0,
  nextModuleId: null,
  nextModuleSlug: null,
  nextModuleTitle: null,
});

export const useCourseProgress = (courseSlug: string) => {
  // Map short slugs to database slugs
  const slugMapping: Record<string, string> = {
    'python': 'python',
    'machine-learning': 'machine-learning',
    'ml': 'machine-learning',
    'deep-learning': 'deep-learning',
    'dl': 'deep-learning',
    'llm-engineering': 'llm-engineering',
    'llm': 'llm-engineering',
    'rag': 'retrieval-augmented-generation',
    'mcp': 'model-context-protocol',
    'agentic-ai': 'agentic-ai',
    'agentic': 'agentic-ai',
  };

  const dbSlug = slugMapping[courseSlug] || courseSlug;
  const key = `course-progress:${courseSlug}`;

  const { data, pending, refresh: refreshData, error } = useAsyncData(key, async () => {
    if (!courseSlug) {
      return createDefaultCourseProgress(courseSlug);
    }

    try {
      // Get the Supabase client to retrieve the access token
      const nuxtApp = useNuxtApp();
      const supabase = nuxtApp.$supabase as any;
      
      if (!supabase) {
        console.error("[course-progress] Supabase client not available");
        return createDefaultCourseProgress(courseSlug);
      }

      // Get the current session
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        console.error("[course-progress] No access token available. User must be logged in.");
        return createDefaultCourseProgress(courseSlug);
      }

      const response = await $fetch<CourseProgressResponse>(`/api/courses/${dbSlug}/progress`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response ?? createDefaultCourseProgress(courseSlug);
    } catch (fetchError) {
      console.error(`[course-progress] Failed to load course '${courseSlug}'`, fetchError);
      return createDefaultCourseProgress(courseSlug);
    }
  }, {
    default: () => createDefaultCourseProgress(courseSlug),
    server: true,
    lazy: false,
  });

  const progress = computed(() => data.value ?? createDefaultCourseProgress(courseSlug));

  const remainingModules = computed(() =>
    Math.max(progress.value.totalModules - progress.value.completedModules, 0)
  );

  const remainingXp = computed(() =>
    Math.max(progress.value.totalXp - progress.value.earnedXp, 0)
  );

  // Add a refresh function that clears cache and refetches
  const refresh = async () => {
    clearNuxtData(key);
    await refreshData();
  };

  return {
    progress,
    remainingModules,
    remainingXp,
    pending,
    error,
    refresh,
  };
};
