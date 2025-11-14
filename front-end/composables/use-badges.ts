import { computed } from "vue";

export type BadgeSummary = {
  id: number;
  badge_key: string;
  badge_name: string;
  badge_description: string | null;
  badge_icon: string | null;
  badge_category: string | null;
  earned_at: string | null;
  is_displayed: boolean;
};

export type BadgesResponse = {
  earned: BadgeSummary[];
  available: BadgeSummary[];
};

const defaultBadges = (): BadgesResponse => ({
  earned: [],
  available: [],
});

export const useBadges = () => {
  const { authFetch } = useApiClient();
  
  const { data, pending, refresh, error } = useAsyncData("user-badges", async () => {
    try {
      const response = await authFetch<BadgesResponse>("/api/user/badges", {
        method: "GET",
      });
      return response ?? defaultBadges();
    } catch (fetchError) {
      console.error("[badges] Failed to load badges", fetchError);
      return defaultBadges();
    }
  }, {
    default: defaultBadges,
    server: true,
    lazy: false,
  });

  const earned = computed(() => data.value?.earned ?? []);
  const available = computed(() => data.value?.available ?? []);

  const displayedBadge = computed(() => earned.value.find((badge) => badge.is_displayed) ?? null);

  const setDisplayedBadge = async (badgeKey: string | null) => {
    try {
      await authFetch("/api/user/badges/display", {
        method: "POST",
        body: { badgeKey },
      });
      await refresh();
    } catch (displayError) {
      console.error("[badges] Failed to update displayed badge", displayError);
    }
  };

  const awardBadge = async (badgeKey: string) => {
    try {
      await authFetch("/api/user/badges/award", {
        method: "POST",
        body: { badgeKey },
      });
      await refresh();
    } catch (awardError) {
      console.error("[badges] Failed to award badge", awardError);
    }
  };

  const checkForNewBadges = async () => {
    try {
      const response = await authFetch<BadgeSummary[]>("/api/user/badges/check", {
        method: "POST",
      });
      if (response?.length) {
        await refresh();
      }
      return response ?? [];
    } catch (checkError) {
      console.error("[badges] Failed to check for new badges", checkError);
      return [] as BadgeSummary[];
    }
  };

  return {
    earned,
    available,
    displayedBadge,
    pending,
    error,
    refresh,
    setDisplayedBadge,
    awardBadge,
    checkForNewBadges,
  };
};
