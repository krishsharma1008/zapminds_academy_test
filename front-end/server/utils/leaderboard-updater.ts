import { useServerSupabase } from "~/server/utils/supabase-client";

export type LeaderboardSeason = {
  id: number;
  name: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
};

export type LeaderboardEntry = {
  season_id: number;
  user_id: string;
  rank: number;
  xp_total: number;
  tier: string | null;
  updated_at: string;
};

export const getCurrentSeason = async (): Promise<LeaderboardSeason | null> => {
  const supabase = useServerSupabase();
  const { data, error } = await supabase
    .from("leaderboard_seasons")
    .select("*")
    .eq("is_active", true)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch active season: ${error.message}`);
  }

  return data as LeaderboardSeason | null;
};

export const createNewSeason = async (payload: {
  name: string;
  startsAt: string;
  endsAt?: string | null;
  isActive?: boolean;
}): Promise<LeaderboardSeason> => {
  const supabase = useServerSupabase();
  const { name, startsAt, endsAt = null, isActive = true } = payload;

  if (isActive) {
    const { error: deactivateError } = await supabase
      .from("leaderboard_seasons")
      .update({ is_active: false })
      .eq("is_active", true);

    if (deactivateError) {
      throw new Error(`Failed to deactivate existing seasons: ${deactivateError.message}`);
    }
  }

  const { data, error } = await supabase
    .from("leaderboard_seasons")
    .insert({
      name,
      starts_at: startsAt,
      ends_at: endsAt,
      is_active: isActive,
    })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Failed to create leaderboard season: ${error?.message ?? "unknown"}`);
  }

  return data as LeaderboardSeason;
};

export const updateUserLeaderboardEntry = async (params: {
  userId: string;
  seasonId: number;
}) => {
  const supabase = useServerSupabase();
  const { userId, seasonId } = params;

  const profile = await supabase
    .from("profiles")
    .select("xp_total, current_tier")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile.error) {
    throw new Error(`Failed to fetch profile for leaderboard update: ${profile.error.message}`);
  }

  const xpTotal = profile.data?.xp_total ?? 0;
  const tier = profile.data?.current_tier ?? null;

  const { error } = await supabase.from("season_leaderboard_entries").upsert(
    {
      season_id: seasonId,
      user_id: userId,
      xp_total: xpTotal,
      tier,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "season_id,user_id" }
  );

  if (error) {
    throw new Error(`Failed to upsert leaderboard entry: ${error.message}`);
  }
};

export const updateLeaderboardRankings = async (seasonId: number) => {
  const supabase = useServerSupabase();

  const profiles = await supabase
    .from("profiles")
    .select("user_id, xp_total, current_tier")
    .gte("xp_total", 0);

  if (profiles.error) {
    throw new Error(`Failed to fetch profiles for leaderboard: ${profiles.error.message}`);
  }

  const sorted = [...(profiles.data ?? [])]
    .sort((a, b) => (b.xp_total ?? 0) - (a.xp_total ?? 0))
    .map((profile, index) => ({
      season_id: seasonId,
      user_id: profile.user_id,
      xp_total: profile.xp_total ?? 0,
      tier: profile.current_tier ?? null,
      rank: index + 1,
      updated_at: new Date().toISOString(),
    }));

  if (sorted.length === 0) {
    return [] as LeaderboardEntry[];
  }

  const { data, error } = await supabase
    .from("season_leaderboard_entries")
    .upsert(sorted, { onConflict: "season_id,user_id" })
    .select("season_id, user_id, rank, xp_total, tier, updated_at");

  if (error) {
    throw new Error(`Failed to upsert leaderboard entries: ${error.message}`);
  }

  return data as LeaderboardEntry[];
};
