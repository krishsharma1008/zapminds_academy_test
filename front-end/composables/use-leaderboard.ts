import { computed, ref } from "vue";

export type LeaderboardView = "overall" | "weekly";

export type LeaderboardEntryResponse = {
  user_id: string;
  display_name: string | null;
  xp_total: number;
  xp_weekly: number;
  modules_completed: number;
  modules_weekly: number;
  tier: string | null;
  rank: number;
  streak: number;
  badge_icon: string | null;
};

export type LeaderboardResponse = {
  season: {
    id: number;
    name: string;
    starts_at: string;
    ends_at: string | null;
  } | null;
  entries: LeaderboardEntryResponse[];
  userEntry: LeaderboardEntryResponse | null;
};

const defaultLeaderboard = (): LeaderboardResponse => ({
  season: null,
  entries: [],
  userEntry: null,
});

export const useLeaderboard = (initialView: LeaderboardView = "overall") => {
  const { authFetch } = useApiClient();
  const view = ref<LeaderboardView>(initialView);

  const { data, pending, refresh, error } = useAsyncData(
    () => `leaderboard:${view.value}`,
    async () => {
      try {
        const response = await authFetch<LeaderboardResponse>("/api/leaderboard/current", {
          method: "GET",
          query: {
            view: view.value,
          },
        });
        return response ?? defaultLeaderboard();
      } catch (fetchError) {
        console.error("[leaderboard] Failed to load leaderboard", fetchError);
        return defaultLeaderboard();
      }
    },
    {
      default: defaultLeaderboard,
      server: true,
      lazy: false,
      watch: [view],
    }
  );

  const leaderboard = computed(() => data.value ?? defaultLeaderboard());

  const setView = async (nextView: LeaderboardView) => {
    if (view.value === nextView) {
      return;
    }
    view.value = nextView;
    await refresh();
  };

  const entries = computed(() => leaderboard.value.entries);
  const userEntry = computed(() => leaderboard.value.userEntry);

  return {
    view,
    entries,
    userEntry,
    season: computed(() => leaderboard.value.season),
    pending,
    error,
    refresh,
    setView,
  };
};
