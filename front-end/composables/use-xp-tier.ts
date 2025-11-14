import type { Ref } from "vue";
import { computed, ref, watch } from "vue";
import {
  XP_TIERS,
  getProgressToNextTier,
  getTierFromXp,
  type XPTier,
} from "~/utils/xp-tiers";

export type TierProgress = {
  currentTier: XPTier;
  nextTier: XPTier | null;
  xpIntoTier: number;
  xpToNextTier: number;
  xpNeededForNextTier: number | null;
  percent: number;
};

export const createTierProgressState = (initialXp = 0) => ({
  xp: ref(initialXp),
});

export const useXpTier = (xpRef?: Ref<number>) => {
  const internalState = createTierProgressState(xpRef?.value ?? 0);
  const xp = xpRef ?? internalState.xp;

  const tier = computed(() => getTierFromXp(xp.value));
  const progress = computed(() => getProgressToNextTier(xp.value));

  const tierLabel = computed(() => {
    const current = tier.value;
    const next = progress.value.nextTier;
    if (!next) {
      return `${current.name} · Max tier reached`;
    }

    return `${current.name} · ${progress.value.xpToNextTier} XP to ${next.name}`;
  });

  const tierColor = computed(() => tier.value.color);
  const tierIcon = computed(() => tier.value.icon);

  const percentRounded = computed(() => Math.round(progress.value.percent * 100));

  const setXp = (value: number) => {
    xp.value = Math.max(value, 0);
  };

  if (xpRef) {
    watch(xpRef, (value) => {
      internalState.xp.value = value;
    });
  }

  return {
    xp,
    tier,
    progress,
    tierLabel,
    tierColor,
    tierIcon,
    percentRounded,
    setXp,
    availableTiers: XP_TIERS,
  };
};
