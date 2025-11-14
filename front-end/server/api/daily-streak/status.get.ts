import { defineEventHandler, createError, getHeader } from "h3";
import { useServerSupabase } from "~/server/utils/supabase-client";

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
 */
const calculateStreakXp = (streakDays: number): number => {
  const baseXp = 120;
  const bonusPerDay = 8;
  return baseXp + streakDays * bonusPerDay;
};

/**
 * Check if user has already claimed today
 */
const hasClaimedToday = (lastCompletedDate: string | null): boolean => {
  if (!lastCompletedDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastCompleted = new Date(lastCompletedDate);
  lastCompleted.setHours(0, 0, 0, 0);

  return lastCompleted.getTime() === today.getTime();
};

/**
 * Calculate time until next claim (midnight)
 */
const getTimeUntilNextClaim = (): {
  hours: number;
  minutes: number;
  seconds: number;
} => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
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

  // Initialize default streak if doesn't exist
  const currentStreak = streak?.current_streak ?? 0;
  const longestStreak = streak?.longest_streak ?? 0;
  const lastCompletedDate = streak?.last_completed_date ?? null;

  const claimedToday = hasClaimedToday(lastCompletedDate);
  const nextStreakDay = claimedToday ? currentStreak + 1 : currentStreak + 1;
  const xpReward = calculateStreakXp(nextStreakDay);
  const timeUntilNext = getTimeUntilNextClaim();

  return {
    currentStreak,
    longestStreak,
    lastCompletedDate,
    claimedToday,
    canClaimToday: !claimedToday,
    nextStreakDay,
    xpReward,
    timeUntilNextClaim: timeUntilNext,
  };
});

