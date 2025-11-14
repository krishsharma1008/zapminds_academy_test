import { useServerSupabase } from "~/server/utils/supabase-client";
import { getCurrentSeason } from "~/server/utils/leaderboard-updater";
import { getTierByName } from "~/utils/xp-tiers";

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
  const params = event.context.params ?? {};
  const seasonParam = params.seasonId ?? "current";
  const token = extractBearerToken(getHeader(event, "authorization"));

  let requesterId: string | null = null;
  if (token) {
    const { data: authUser } = await supabase.auth.getUser(token);
    requesterId = authUser?.user?.id ?? null;
  }

  let seasonId: number | null = Number.isNaN(Number(seasonParam)) ? null : Number(seasonParam);

  if (seasonParam === "current" || seasonId === null) {
    const activeSeason = await getCurrentSeason();
    if (!activeSeason) {
      return {
        season: null,
        entries: [],
        userEntry: null,
      };
    }
    seasonId = activeSeason.id;
  }

  const { data: season, error: seasonError } = await supabase
    .from("leaderboard_seasons")
    .select("id, name, starts_at, ends_at")
    .eq("id", seasonId)
    .maybeSingle();

  if (seasonError || !season) {
    throw createError({ statusCode: 404, statusMessage: "Leaderboard season not found" });
  }

  // Fetch all profiles to get latest XP data
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, xp_total, current_tier")
    .order("xp_total", { ascending: false });

  if (profilesError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to load leaderboard entries: ${profilesError.message}`,
    });
  }

  // Rank profiles by XP
  const entries = (profiles ?? []).map((profile, index) => ({
    user_id: profile.user_id,
    rank: index + 1,
    xp_total: profile.xp_total ?? 0,
    tier: profile.current_tier ?? null,
  }));

  const userIds = entries?.map((entry) => entry.user_id) ?? [];
  const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();

  if (userIds.length) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", userIds);

    if (profilesError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to load leaderboard profiles: ${profilesError.message}`,
      });
    }

    for (const profile of profiles ?? []) {
      profileMap.set(profile.user_id, {
        display_name: profile.display_name ?? null,
        avatar_url: profile.avatar_url ?? null,
      });
    }
  }

  // Fetch streaks for all users
  const streakMap = new Map<string, number>();
  if (userIds.length) {
    const { data: streaksData, error: streaksError } = await supabase
      .from("streaks")
      .select("user_id, current_streak")
      .in("user_id", userIds);

    if (streaksError) {
      console.error("Failed to fetch streaks:", streaksError);
    }

    for (const streak of streaksData ?? []) {
      streakMap.set(streak.user_id, streak.current_streak ?? 0);
    }
  }

  // Fetch displayed badges for all users
  const badgeMap = new Map<string, string | null>();
  if (userIds.length) {
    const { data: badgesData, error: badgesError } = await supabase
      .from("user_badges")
      .select("user_id, badge_definitions:badge_definition_id(badge_icon)")
      .in("user_id", userIds)
      .eq("is_displayed", true);

    if (badgesError) {
      console.error("Failed to fetch badges:", badgesError);
    }

    for (const badge of badgesData ?? []) {
      if (badge.badge_definitions?.badge_icon) {
        badgeMap.set(badge.user_id, badge.badge_definitions.badge_icon);
      }
    }
  }

  // Calculate weekly XP from xp_transactions for the past 7 days
  const weeklyXpMap = new Map<string, number>();
  if (userIds.length) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: weeklyTransactions, error: weeklyError } = await supabase
      .from("xp_transactions")
      .select("user_id, delta")
      .in("user_id", userIds)
      .gte("created_at", sevenDaysAgo.toISOString());

    if (weeklyError) {
      console.error("Failed to fetch weekly XP:", weeklyError);
    }

    // Sum up weekly XP for each user
    for (const transaction of weeklyTransactions ?? []) {
      const current = weeklyXpMap.get(transaction.user_id) ?? 0;
      weeklyXpMap.set(transaction.user_id, current + (transaction.delta ?? 0));
    }
  }

  // Count total modules completed per user
  const modulesCompletedMap = new Map<string, number>();
  if (userIds.length) {
    const { data: completions, error: completionsError } = await supabase
      .from("module_completions")
      .select("user_id", { count: "exact" })
      .in("user_id", userIds);

    if (completionsError) {
      console.error("Failed to fetch module completions:", completionsError);
    }

    // Group completions by user and count
    const completionsByUser = new Map<string, number>();
    for (const completion of completions ?? []) {
      const current = completionsByUser.get(completion.user_id) ?? 0;
      completionsByUser.set(completion.user_id, current + 1);
    }

    // Transfer to modules map
    for (const [userId, count] of completionsByUser.entries()) {
      modulesCompletedMap.set(userId, count);
    }
  }

  // Calculate weekly modules completed (past 7 days)
  const weeklyModulesMap = new Map<string, number>();
  if (userIds.length) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: weeklyCompletions, error: weeklyCompletionsError } = await supabase
      .from("module_completions")
      .select("user_id")
      .in("user_id", userIds)
      .gte("completed_at", sevenDaysAgo.toISOString());

    if (weeklyCompletionsError) {
      console.error("Failed to fetch weekly completions:", weeklyCompletionsError);
    }

    // Count weekly completions per user
    for (const completion of weeklyCompletions ?? []) {
      const current = weeklyModulesMap.get(completion.user_id) ?? 0;
      weeklyModulesMap.set(completion.user_id, current + 1);
    }
  }

  const normalizedEntries = (entries ?? []).map((entry) => {
    const tier = getTierByName(entry.tier ?? "Bronze");
    return {
      user_id: entry.user_id,
      rank: entry.rank,
      xp_total: entry.xp_total,
      xp_weekly: weeklyXpMap.get(entry.user_id) ?? 0,
      modules_completed: modulesCompletedMap.get(entry.user_id) ?? 0,
      modules_weekly: weeklyModulesMap.get(entry.user_id) ?? 0,
      tier: entry.tier ?? "Bronze",
      tier_icon: tier?.icon ?? "🥉",
      display_name: profileMap.get(entry.user_id)?.display_name ?? "Unknown Student",
      avatar_url: profileMap.get(entry.user_id)?.avatar_url ?? null,
      is_current_user: requesterId === entry.user_id,
      streak: streakMap.get(entry.user_id) ?? 0,
      badge_icon: badgeMap.get(entry.user_id) ?? null,
    };
  });

  const userEntry = requesterId
    ? normalizedEntries.find((entry) => entry.user_id === requesterId) ?? null
    : null;

  return {
    season,
    entries: normalizedEntries,
    userEntry,
  };
});
