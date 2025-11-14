import { getModuleXp } from "~/utils/module-xp-values";
import {
  formatTierProgressLabel,
  getProgressToNextTier,
  getTierFromXp,
  type XPTier,
} from "~/utils/xp-tiers";
import { useServerSupabase } from "~/server/utils/supabase-client";

export type XpTransactionType = "module" | "course" | "daily" | "bonus" | "admin_adjustment";

export type AwardXpPayload = {
  userId: string;
  amount: number;
  type: XpTransactionType;
  sourceId?: number | null;
  description?: string | null;
};

export type AwardXpResult = {
  previousXp: number;
  newXp: number;
  delta: number;
  previousTier: XPTier;
  newTier: XPTier;
  tierChanged: boolean;
  tierProgressLabel: string;
  percent: number;
  xpIntoTier: number;
  xpNeededForNextTier: number | null;
  xpToNextTier: number;
  nextTier: XPTier | null;
};

export const calculateModuleXp = (difficulty: string | null | undefined) => {
  return getModuleXp(difficulty ?? undefined);
};

export const calculateBonusXp = (streakLength: number) => {
  if (!Number.isFinite(streakLength) || streakLength <= 0) {
    return 0;
  }

  if (streakLength >= 100) {
    return 250;
  }

  if (streakLength >= 30) {
    return 150;
  }

  if (streakLength >= 7) {
    return 75;
  }

  if (streakLength >= 3) {
    return 40;
  }

  return 20;
};

export const checkTierChange = (oldXp: number, newXp: number) => {
  const previousTier = getTierFromXp(oldXp);
  const newTier = getTierFromXp(newXp);
  return {
    previousTier,
    newTier,
    tierChanged: previousTier.name !== newTier.name,
  };
};

export const awardXp = async (payload: AwardXpPayload): Promise<AwardXpResult> => {
  const { userId, amount, type, sourceId = null, description = null } = payload;
  if (!userId) {
    throw new Error("awardXp requires a userId");
  }

  if (!Number.isFinite(amount)) {
    throw new Error("awardXp amount must be numeric");
  }

  if (amount === 0) {
    const tier = getTierFromXp(0);
    return {
      previousXp: 0,
      newXp: 0,
      delta: 0,
      previousTier: tier,
      newTier: tier,
      tierChanged: false,
      tierProgressLabel: formatTierProgressLabel(0),
    };
  }

  const supabase = useServerSupabase();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("xp_total")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Failed to fetch profile XP: ${profileError.message}`);
  }

  const previousXp = profile?.xp_total ?? 0;
  const newXp = Math.max(previousXp + amount, 0);

  const { previousTier, newTier, tierChanged } = checkTierChange(previousXp, newXp);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ 
      xp_total: newXp,
      current_tier: newTier.name,
    })
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(`Failed to update profile XP: ${updateError.message}`);
  }

  const { error: transactionError } = await supabase.from("xp_transactions").insert({
    user_id: userId,
    delta: amount,
    source: type,
    source_id: sourceId,
    note: description,
  });

  if (transactionError) {
    throw new Error(`Failed to record XP transaction: ${transactionError.message}`);
  }

  // Update leaderboard in real-time
  try {
    const { getCurrentSeason, updateUserLeaderboardEntry } = await import("~/server/utils/leaderboard-updater");
    const season = await getCurrentSeason();
    if (season) {
      await updateUserLeaderboardEntry({
        userId,
        seasonId: season.id,
      });
    }
  } catch (leaderboardError) {
    console.error("[xp-calculator] Failed to update leaderboard:", leaderboardError);
    // Don't fail the XP award if leaderboard update fails
  }

  const tierProgress = getProgressToNextTier(newXp);

  return {
    previousXp,
    newXp,
    delta: amount,
    previousTier,
    newTier,
    tierChanged,
    tierProgressLabel: formatTierProgressLabel(newXp),
    ...tierProgress,
  };
};
