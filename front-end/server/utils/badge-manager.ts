import { useServerSupabase } from "~/server/utils/supabase-client";

export type BadgeCategory = "tier" | "streak" | "achievement" | "special";

export type BadgeDefinition = {
  id: number;
  badge_key: string;
  badge_name: string;
  badge_description: string | null;
  badge_icon: string | null;
  badge_category: BadgeCategory | null;
  unlock_criteria: Record<string, unknown> | null;
};

export type UserBadge = {
  id: number;
  badge_definition_id: number;
  earned_at: string;
  is_displayed: boolean;
  definition: BadgeDefinition;
};

const TIER_BADGE_KEY_BY_NAME: Record<string, string> = {
  Bronze: "bronze_tier",
  Silver: "silver_tier",
  Gold: "gold_tier",
  Platinum: "platinum_tier",
  Diamond: "diamond_tier",
  Master: "master_tier",
  Grandmaster: "grandmaster_tier",
};

const STREAK_BADGE_THRESHOLDS: Record<number, string> = {
  3: "streak_3",
  7: "streak_7",
  30: "streak_30",
  100: "streak_100",
};

export const getBadgeDefinitionByKey = async (badgeKey: string) => {
  const supabase = useServerSupabase();
  const { data, error } = await supabase
    .from("badge_definitions")
    .select("*")
    .eq("badge_key", badgeKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch badge definition '${badgeKey}': ${error.message}`);
  }

  return data as BadgeDefinition | null;
};

export const ensureUserBadge = async (params: {
  userId: string;
  badgeDefinitionId: number;
  markDisplayed?: boolean;
}) => {
  const { userId, badgeDefinitionId, markDisplayed = false } = params;
  const supabase = useServerSupabase();

  const existing = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_definition_id", badgeDefinitionId)
    .maybeSingle();

  if (existing.error && existing.error.code !== "PGRST116") {
    throw new Error(`Failed to check existing badge: ${existing.error.message}`);
  }

  if (existing.data) {
    return existing.data.id;
  }

  const { data, error } = await supabase
    .from("user_badges")
    .insert({
      user_id: userId,
      badge_definition_id: badgeDefinitionId,
      is_displayed: markDisplayed,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to insert user badge: ${error.message}`);
  }

  return data?.id ?? null;
};

export const checkAndAwardTierBadge = async (userId: string, tierName: string) => {
  const badgeKey = TIER_BADGE_KEY_BY_NAME[tierName];
  if (!badgeKey) {
    return null;
  }

  const definition = await getBadgeDefinitionByKey(badgeKey);
  if (!definition) {
    return null;
  }

  await ensureUserBadge({ userId, badgeDefinitionId: definition.id });
  return definition;
};

export const checkAndAwardStreakBadge = async (userId: string, streakLength: number) => {
  const earnedBadges: BadgeDefinition[] = [];
  const thresholds = Object.keys(STREAK_BADGE_THRESHOLDS)
    .map((value) => Number(value))
    .sort((a, b) => a - b);

  for (const threshold of thresholds) {
    if (streakLength < threshold) {
      continue;
    }

    const badgeKey = STREAK_BADGE_THRESHOLDS[threshold];
    const definition = await getBadgeDefinitionByKey(badgeKey);
    if (!definition) {
      continue;
    }

    await ensureUserBadge({ userId, badgeDefinitionId: definition.id });
    earnedBadges.push(definition);
  }

  return earnedBadges;
};

export const checkAndAwardAchievementBadges = async (userId: string) => {
  // Placeholder for future achievement logic (e.g., complete 10 modules, 5 daily challenges, etc.)
  // Returns an empty array for now to keep API surface consistent.
  return [] as BadgeDefinition[];
};

export const getUserBadges = async (userId: string): Promise<UserBadge[]> => {
  const supabase = useServerSupabase();
  const { data, error } = await supabase
    .from("user_badges")
    .select(
      `id, badge_definition_id, earned_at, is_displayed,
       badge_definitions:badge_definition_id(
         id, badge_key, badge_name, badge_description, badge_icon, badge_category, unlock_criteria
       )`
    )
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user badges: ${error.message}`);
  }

  return (
    data ?? []
  ).map((row: any) => ({
    id: row.id,
    badge_definition_id: row.badge_definition_id,
    earned_at: row.earned_at,
    is_displayed: row.is_displayed,
    definition: row.badge_definitions as BadgeDefinition,
  }));
};

export const getAvailableBadges = async (userId: string): Promise<BadgeDefinition[]> => {
  const supabase = useServerSupabase();

  const userBadges = await supabase
    .from("user_badges")
    .select("badge_definition_id")
    .eq("user_id", userId);

  if (userBadges.error) {
    throw new Error(`Failed to fetch user badge ids: ${userBadges.error.message}`);
  }

  const ownedIds = new Set((userBadges.data ?? []).map((row) => row.badge_definition_id));

  const { data, error } = await supabase.from("badge_definitions").select("*");

  if (error) {
    throw new Error(`Failed to fetch badge definitions: ${error.message}`);
  }

  return (data ?? []).filter((definition) => !ownedIds.has(definition.id)) as BadgeDefinition[];
};
