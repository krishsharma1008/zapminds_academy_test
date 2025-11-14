import { useServerSupabase } from "~/server/utils/supabase-client";
import { getCurrentSeason, updateLeaderboardRankings } from "~/server/utils/leaderboard-updater";

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

  const profile = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", authUser.user.id)
    .maybeSingle();

  if (profile.error || profile.data?.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Admin privileges required" });
  }

  const body = await readBody<{ seasonId?: number } | null>(event);
  let seasonId = body?.seasonId ?? null;

  if (!seasonId) {
    const activeSeason = await getCurrentSeason();
    if (!activeSeason) {
      throw createError({ statusCode: 400, statusMessage: "No active leaderboard season found" });
    }
    seasonId = activeSeason.id;
  }

  const results = await updateLeaderboardRankings(seasonId);

  return {
    seasonId,
    updatedCount: results.length,
  };
});
