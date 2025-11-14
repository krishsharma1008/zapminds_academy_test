import { useServerSupabase } from "~/server/utils/supabase-client";
import { getProgressToNextTier } from "~/utils/xp-tiers";

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
    throw createError({
      statusCode: 401,
      statusMessage: "Missing bearer token",
    });
  }

  const { data: authUser, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authUser?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid authentication token",
    });
  }

  const userId = authUser.user.id;

  const [{ data: profile, error: profileError }, { data: streak, error: streakError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("xp_total, current_tier, level, display_name")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("streaks")
      .select("current_streak, longest_streak, last_completed_date")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (profileError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to load profile: ${profileError.message}`,
    });
  }

  if (streakError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to load streak: ${streakError.message}`,
    });
  }

  // Auto-initialize profile and streak if they don't exist
  if (!profile || !streak) {
    const displayName = authUser.user.user_metadata?.full_name ?? authUser.user.email ?? "Student";
    
    // Create profile if missing
    if (!profile) {
      await supabase.from("profiles").upsert({
        user_id: userId,
        display_name: displayName,
        xp_total: 0,
        level: 1,
        current_tier: "Bronze",
        role: "student",
      }, { onConflict: "user_id" });
    }

    // Create streak if missing
    if (!streak) {
      await supabase.from("streaks").upsert({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_completed_date: null,
      }, { onConflict: "user_id" });
    }

    // Add user to leaderboard
    try {
      const { data: season } = await supabase
        .from("leaderboard_seasons")
        .select("id")
        .is("ends_at", null)
        .order("starts_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (season) {
        const { data: existingEntries } = await supabase
          .from("season_leaderboard_entries")
          .select("rank")
          .eq("season_id", season.id)
          .order("rank", { ascending: false })
          .limit(1)
          .maybeSingle();

        const newRank = existingEntries ? existingEntries.rank + 1 : 1;

        await supabase
          .from("season_leaderboard_entries")
          .upsert({
            season_id: season.id,
            user_id: userId,
            rank: newRank,
            xp_total: 0,
          }, { onConflict: "season_id,user_id" });
      }
    } catch (leaderboardError) {
      console.error("Failed to add user to leaderboard:", leaderboardError);
    }

    // Re-fetch the data after initialization
    const [{ data: newProfile }, { data: newStreak }] = await Promise.all([
      supabase
        .from("profiles")
        .select("xp_total, current_tier, level, display_name")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("streaks")
        .select("current_streak, longest_streak, last_completed_date")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    // Override with newly created data
    if (newProfile) {
      Object.assign(profile || {}, newProfile);
    }
    if (newStreak) {
      Object.assign(streak || {}, newStreak);
    }
  }

  const xpTotal = profile?.xp_total ?? 0;
  const tierProgress = getProgressToNextTier(xpTotal);

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const submissionsToday = await supabase
    .from("xp_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("source", "module")
    .gte("created_at", startOfDay.toISOString());

  const reviewQueueCount = 0; // Placeholder until review queue storage is implemented.

  const recentBadgesQuery = await supabase
    .from("user_badges")
    .select(
      `badge_definitions:badge_definition_id(badge_key, badge_name, badge_icon), earned_at`
    )
    .eq("user_id", userId)
    .order("earned_at", { ascending: false })
    .limit(5);

  if (recentBadgesQuery.error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to load badges: ${recentBadgesQuery.error.message}`,
    });
  }

  const recentBadges = (recentBadgesQuery.data ?? []).map((row) => ({
    badge_key: row.badge_definitions?.badge_key ?? "",
    badge_name: row.badge_definitions?.badge_name ?? "",
    badge_icon: row.badge_definitions?.badge_icon ?? null,
    earned_at: row.earned_at ?? null,
  }));

  return {
    xp: {
      total: xpTotal,
      tier: tierProgress.currentTier.name,
      nextTier: tierProgress.nextTier?.name ?? null,
      xpIntoTier: tierProgress.xpIntoTier,
      xpToNextTier: tierProgress.xpToNextTier,
      xpNeededForNextTier: tierProgress.xpNeededForNextTier,
      percentToNextTier: Math.round(tierProgress.percent * 100) / 100,
    },
    streak: {
      current: streak?.current_streak ?? 0,
      longest: streak?.longest_streak ?? 0,
      lastCompletedDate: streak?.last_completed_date ?? null,
    },
    submissionsToday: submissionsToday.count ?? 0,
    reviewQueueCount,
    recentBadges,
  };
});
