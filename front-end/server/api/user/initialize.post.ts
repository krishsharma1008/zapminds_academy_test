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

  const profilePayload = {
    user_id: userId,
    role: "student",
    display_name: authUser.user.user_metadata?.full_name ?? authUser.user.email ?? null,
    xp_total: 0,
    level: 1,
    current_tier: "Bronze",
  } as const;

  const { error: profileError, data: profileRows } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "user_id" })
    .select("user_id, display_name, xp_total, current_tier, level")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to initialize profile: ${profileError.message}`,
    });
  }

  const streakPayload = {
    user_id: userId,
    current_streak: 0,
    longest_streak: 0,
    last_completed_date: null,
  } as const;

  const { error: streakError, data: streakRow } = await supabase
    .from("streaks")
    .upsert(streakPayload, { onConflict: "user_id" })
    .select("user_id, current_streak, longest_streak, last_completed_date")
    .eq("user_id", userId)
    .maybeSingle();

  if (streakError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to initialize streak: ${streakError.message}`,
    });
  }

  // Add user to current leaderboard season
  try {
    // Get current active season
    const { data: season } = await supabase
      .from("leaderboard_seasons")
      .select("id")
      .is("ends_at", null)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (season) {
      // Get current rankings to determine the new rank
      const { data: existingEntries } = await supabase
        .from("season_leaderboard_entries")
        .select("rank")
        .eq("season_id", season.id)
        .order("rank", { ascending: false })
        .limit(1)
        .maybeSingle();

      const newRank = existingEntries ? existingEntries.rank + 1 : 1;

      // Insert the new user into the leaderboard
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
    // Don't fail initialization if leaderboard update fails
    console.error("Failed to add user to leaderboard:", leaderboardError);
  }

  return {
    profile: profileRows,
    streak: streakRow,
  };
});
