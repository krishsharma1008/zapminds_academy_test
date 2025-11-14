import { computed, ref } from "vue";

export type CourseCompletionsResponse = {
  completedModuleIds: number[];
  completedExternalIds: string[];
};

export const useCourseCompletions = (courseSlug: string) => {
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
  const key = `course-completions:${courseSlug}`;
  const completedExternalIds = ref<string[]>([]);

  const { data, pending, refresh: refreshData, error } = useAsyncData(
    key,
    async () => {
      if (!courseSlug) {
        return { completedModuleIds: [], completedExternalIds: [] };
      }

      try {
        // Get the Supabase client to retrieve the access token
        const nuxtApp = useNuxtApp();
        const supabase = nuxtApp.$supabase as any;

        if (!supabase) {
          console.error("[course-completions] Supabase client not available");
          return { completedModuleIds: [], completedExternalIds: [] };
        }

        // Get the current session
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        if (!accessToken) {
          console.error("[course-completions] No access token available. User must be logged in.");
          return { completedModuleIds: [], completedExternalIds: [] };
        }

        const response = await $fetch<CourseCompletionsResponse>(
          `/api/courses/${dbSlug}/completions`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        completedExternalIds.value = response.completedExternalIds || [];
        return response;
      } catch (fetchError) {
        console.error(`[course-completions] Failed to load completions for '${courseSlug}'`, fetchError);
        return { completedModuleIds: [], completedExternalIds: [] };
      }
    },
    {
      default: () => ({ completedModuleIds: [], completedExternalIds: [] }),
      server: false,
      lazy: false,
    }
  );

  const isModuleCompleted = (externalId: string) => {
    return computed(() => completedExternalIds.value.includes(externalId));
  };

  // Add a refresh function that clears cache and refetches
  const refresh = async () => {
    clearNuxtData(key);
    await refreshData();
  };

  return {
    completedModuleIds: computed(() => data.value?.completedModuleIds ?? []),
    completedExternalIds: computed(() => data.value?.completedExternalIds ?? []),
    isModuleCompleted,
    pending,
    error,
    refresh,
  };
};

