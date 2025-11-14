export type XPTier = {
  name: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Master" | "Grandmaster";
  minXp: number;
  maxXp: number | null;
  color: string;
  icon: string;
  order: number;
};

export const XP_TIERS: readonly XPTier[] = [
  { name: "Bronze", minXp: 0, maxXp: 999, color: "#CD7F32", icon: "🥉", order: 1 },
  { name: "Silver", minXp: 1000, maxXp: 2999, color: "#C0C0C0", icon: "🥈", order: 2 },
  { name: "Gold", minXp: 3000, maxXp: 6999, color: "#FFD700", icon: "🥇", order: 3 },
  { name: "Platinum", minXp: 7000, maxXp: 14999, color: "#E5E4E2", icon: "💎", order: 4 },
  { name: "Diamond", minXp: 15000, maxXp: 29999, color: "#B9F2FF", icon: "💠", order: 5 },
  { name: "Master", minXp: 30000, maxXp: 59999, color: "#9D00FF", icon: "👑", order: 6 },
  { name: "Grandmaster", minXp: 60000, maxXp: null, color: "#FF00FF", icon: "⭐", order: 7 },
] as const;

const DESCENDING_TIERS = [...XP_TIERS].sort((a, b) => b.minXp - a.minXp);

const DEFAULT_TIER = XP_TIERS[0];

export const getTierFromXp = (xp: number): XPTier => {
  if (!Number.isFinite(xp) || xp < 0) {
    return DEFAULT_TIER;
  }

  return (
    DESCENDING_TIERS.find((tier) => {
      const meetsMin = xp >= tier.minXp;
      const belowMax = tier.maxXp == null || xp <= tier.maxXp;
      return meetsMin && belowMax;
    }) ?? DEFAULT_TIER
  );
};

export const getNextTier = (currentXp: number): XPTier | null => {
  const currentTier = getTierFromXp(currentXp);
  const nextIndex = XP_TIERS.findIndex((tier) => tier.name === currentTier.name) + 1;
  return XP_TIERS[nextIndex] ?? null;
};

export const getProgressToNextTier = (currentXp: number) => {
  const currentTier = getTierFromXp(currentXp);
  const nextTier = getNextTier(currentXp);

  if (!nextTier) {
    return {
      percent: 1,
      currentXp: Math.max(currentXp, currentTier.minXp),
      currentTier,
      nextTier: null,
      xpIntoTier: Math.max(currentXp - currentTier.minXp, 0),
      xpNeededForNextTier: null,
      xpToNextTier: 0,
    } as const;
  }

  const xpIntoTier = Math.max(currentXp - currentTier.minXp, 0);
  const tierSpan = (nextTier.minXp ?? currentTier.maxXp ?? currentTier.minXp) - currentTier.minXp;
  const xpToNextTier = Math.max(nextTier.minXp - currentXp, 0);
  const percent = tierSpan > 0 ? Math.min(xpIntoTier / tierSpan, 1) : 1;

  return {
    percent,
    currentXp: Math.max(currentXp, currentTier.minXp),
    currentTier,
    nextTier,
    xpIntoTier,
    xpNeededForNextTier: tierSpan,
    xpToNextTier,
  } as const;
};

export const formatTierProgressLabel = (currentXp: number): string => {
  const { currentTier, nextTier, xpToNextTier } = getProgressToNextTier(currentXp);

  if (!nextTier) {
    return `${currentTier.name} (Max Tier)`;
  }

  return `${currentTier.name} · ${xpToNextTier} XP to ${nextTier.name}`;
};

export const getTierByName = (tierName: string): XPTier | undefined => {
  return XP_TIERS.find((tier) => tier.name === tierName);
};
