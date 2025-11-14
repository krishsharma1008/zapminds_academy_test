import { defineEventHandler, createError, getHeader } from "h3";
import { useServerSupabase } from "~/server/utils/supabase-client";
import { awardXp } from "~/server/utils/xp-calculator";
import { checkAndAwardTierBadge } from "~/server/utils/badge-manager";

const extractBearerToken = (authorizationHeader: string | undefined | null) => {
  if (!authorizationHeader) {
    return null;
  }
  const parts = authorizationHeader.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }
  return null;
};

/**
 * Calculate XP reward for daily streak
 * Base: 120 XP
 * Bonus: +8 XP per streak day
 * Example: Day 5 = 120 + (5 * 8) = 160 XP
 */
const calculateStreakXp = (streakDays: number): number => {
  const baseXp = 120;
  const bonusPerDay = 8;
  return baseXp + streakDays * bonusPerDay;
};

/**
 * Check if user can claim today's streak
 * User can claim if:
 * - They haven't claimed today yet
 * - Their last claim was yesterday (to maintain streak) or earlier
 */
const canClaimToday = (lastCompletedDate: string | null): boolean => {
  if (!lastCompletedDate) {
    return true; // First time claiming
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastCompleted = new Date(lastCompletedDate);
  lastCompleted.setHours(0, 0, 0, 0);

  // Check if already claimed today
  if (lastCompleted.getTime() === today.getTime()) {
    return false;
  }

  return true;
};

/**
 * Calculate new streak count
 * - If last claim was yesterday: increment streak
 * - If last claim was today: no change (shouldn't happen due to canClaimToday check)
 * - If last claim was 2+ days ago: reset to 1
 */
const calculateNewStreak = (
  currentStreak: number,
  lastCompletedDate: string | null
): number => {
  if (!lastCompletedDate) {
    return 1; // First streak
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastCompleted = new Date(lastCompletedDate);
  lastCompleted.setHours(0, 0, 0, 0);

  // If last completed was yesterday, increment streak
  if (lastCompleted.getTime() === yesterday.getTime()) {
    return currentStreak + 1;
  }

  // If last completed was today (shouldn't happen), return current
  if (lastCompleted.getTime() === today.getTime()) {
    return currentStreak;
  }

  // Otherwise, streak was broken - reset to 1
  return 1;
};

export default defineEventHandler(async (event) => {
  const supabase = useServerSupabase();
  const token = extractBearerToken(getHeader(event, "authorization"));

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "Missing bearer token" });
  }

  const { data: authUser, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authUser?.user) {
    throw createError({ statusCode: 401, statusMessage: "Invalid authentication token" });
  }

  const userId = authUser.user.id;

  // Fetch current streak data
  const { data: streak, error: streakError } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (streakError) {
    console.error("Error fetching streak:", streakError);
    throw createError({ statusCode: 500, statusMessage: "Failed to fetch streak data" });
  }

  // Initialize streak if doesn't exist
  if (!streak) {
    const { data: newStreak, error: createError } = await supabase
      .from("streaks")
      .insert({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_completed_date: null,
      })
      .select("*")
      .single();

    if (createError || !newStreak) {
      console.error("Error creating streak:", createError);
      throw createError({ statusCode: 500, statusMessage: "Failed to initialize streak" });
    }

    // Use the newly created streak
    return claimStreak(supabase, userId, newStreak);
  }

  // Check if user can claim today
  if (!canClaimToday(streak.last_completed_date)) {
    throw createError({
      statusCode: 400,
      statusMessage: "You've already claimed your daily streak today. Come back tomorrow!",
    });
  }

  return claimStreak(supabase, userId, streak);
});

async function claimStreak(
  supabase: any,
  userId: string,
  streak: {
    current_streak: number;
    longest_streak: number;
    last_completed_date: string | null;
  }
) {
  // Calculate new streak
  const newStreakCount = calculateNewStreak(
    streak.current_streak,
    streak.last_completed_date
  );
  const newLongestStreak = Math.max(newStreakCount, streak.longest_streak);

  // Calculate XP reward
  const xpReward = calculateStreakXp(newStreakCount);

  // Update streak record
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  const { error: updateError } = await supabase
    .from("streaks")
    .update({
      current_streak: newStreakCount,
      longest_streak: newLongestStreak,
      last_completed_date: today,
    })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Error updating streak:", updateError);
    throw createError({ statusCode: 500, statusMessage: "Failed to update streak" });
  }

  // Award XP
  const xpResult = await awardXp({
    userId,
    amount: xpReward,
    type: "daily",
    description: `Daily streak day ${newStreakCount}`,
  });

  // Check for tier badge
  let tierBadge = null;
  if (xpResult.tierChanged) {
    tierBadge = await checkAndAwardTierBadge(userId, xpResult.newTier.name);
  }

  // Check for streak milestone badges
  const streakBadge = await checkStreakMilestoneBadge(supabase, userId, newStreakCount);

  return {
    success: true,
    streak: {
      current: newStreakCount,
      longest: newLongestStreak,
      wasReset: newStreakCount === 1 && streak.current_streak > 1,
    },
    xpAwarded: xpReward,
    xpResult: {
      newXpTotal: xpResult.newXpTotal,
      tierChanged: xpResult.tierChanged,
      newTier: xpResult.tierChanged
        ? {
            name: xpResult.newTier.name,
            icon: xpResult.newTier.icon,
          }
        : null,
    },
    badges: {
      tierBadge,
      streakBadge,
    },
  };
}

/**
 * Check if user earned a streak milestone badge
 * Milestones: 3, 7, 30, 100 days
 */
async function checkStreakMilestoneBadge(
  supabase: any,
  userId: string,
  streakCount: number
) {
  const milestones = [3, 7, 30, 100];
  const milestone = milestones.find((m) => m === streakCount);

  if (!milestone) {
    return null; // Not a milestone day
  }

  const badgeKey = `streak_${milestone}_days`;

  // Check if badge definition exists
  const { data: badgeDef, error: defError } = await supabase
    .from("badge_definitions")
    .select("*")
    .eq("badge_key", badgeKey)
    .maybeSingle();

  if (defError || !badgeDef) {
    console.warn(`[StreakBadge] Badge definition for ${badgeKey} not found.`);
    return null;
  }

  // Check if user already has this badge
  const { data: existingBadge, error: existingError } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_definition_id", badgeDef.id)
    .maybeSingle();

  if (existingError) {
    console.error("[StreakBadge] Error checking existing badge:", existingError);
    return null;
  }

  if (existingBadge) {
    return null; // User already has this badge
  }

  // Award the badge
  const { error: awardError } = await supabase.from("user_badges").insert({
    user_id: userId,
    badge_definition_id: badgeDef.id,
    is_displayed: true,
  });

  if (awardError) {
    console.error("[StreakBadge] Error awarding badge:", awardError);
    return null;
  }

  return {
    name: badgeDef.badge_name,
    icon: badgeDef.badge_icon,
  };
}

