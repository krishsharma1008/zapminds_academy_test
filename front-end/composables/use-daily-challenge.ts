import { computed } from "vue";

export type DailyChallengeResponse = {
  challengeId: number | null;
  challengeDate: string | null;
  title: string;
  description: string | null;
  xpReward: number;
  streakBonusXp: number;
  totalAward: number;
  resetAt: string;
  completed: boolean;
  completedAt: string | null;
};

const defaultChallenge = (): DailyChallengeResponse => ({
  challengeId: null,
  challengeDate: null,
  title: "No challenge assigned",
  description: null,
  xpReward: 0,
  streakBonusXp: 0,
  totalAward: 0,
  resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  completed: false,
  completedAt: null,
});

export const useDailyChallenge = () => {
  const { authFetch } = useApiClient();
  
  const { data, pending, refresh, error } = useAsyncData("daily-challenge", async () => {
    try {
      const response = await authFetch<DailyChallengeResponse>("/api/daily-challenge", {
        method: "GET",
      });
      return response ?? defaultChallenge();
    } catch (fetchError) {
      console.error("[daily-challenge] Failed to load daily challenge", fetchError);
      return defaultChallenge();
    }
  }, {
    default: defaultChallenge,
    server: true,
    lazy: false,
  });

  const challenge = computed(() => data.value ?? defaultChallenge());

  const claimReward = async () => {
    if (challenge.value.completed) {
      return challenge.value;
    }

    try {
      const result = await authFetch<DailyChallengeResponse>("/api/daily-challenge/claim", {
        method: "POST",
        body: {
          challengeId: challenge.value.challengeId,
        },
      });
      if (result) {
        data.value = result;
      }
      await refresh();
      return result ?? challenge.value;
    } catch (claimError) {
      console.error("[daily-challenge] Failed to claim challenge", claimError);
      throw claimError;
    }
  };

  return {
    challenge,
    pending,
    error,
    refresh,
    claimReward,
  };
};
