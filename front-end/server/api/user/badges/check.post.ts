import { useServerSupabase } from "~/server/utils/supabase-client";
import {
  checkAndAwardTierBadge,
  checkAndAwardStreakBadge,
  checkAndAwardAchievementBadges,
} from "~/server/utils/badge-manager";

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

  const [{ data: profile }, { data: streak }] = await Promise.all([
    supabase
      .from("profiles")
      .select("xp_total, current_tier")
      .eq("user_id", authUser.user.id)
      .maybeSingle(),
    supabase
      .from("streaks")
      .select("current_streak")
      .eq("user_id", authUser.user.id)
      .maybeSingle(),
  ]);

  const newBadges = [] as ReturnType<typeof checkAndAwardAchievementBadges> extends Promise<infer T>
    ? T extends Array<infer U>
      ? U[]
      : never
    : never;

  if (profile?.current_tier) {
    const tierBadge = await checkAndAwardTierBadge(authUser.user.id, profile.current_tier);
    if (tierBadge) {
      newBadges.push(tierBadge);
    }
  }

  const streakLength = streak?.current_streak ?? 0;
  if (streakLength > 0) {
    const streakBadges = await checkAndAwardStreakBadge(authUser.user.id, streakLength);
    newBadges.push(...streakBadges);
  }

  const achievementBadges = await checkAndAwardAchievementBadges(authUser.user.id);
  newBadges.push(...achievementBadges);

  return {
    newlyAwarded: newBadges,
  };
});
