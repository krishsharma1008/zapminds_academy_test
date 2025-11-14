import { useServerSupabase } from "~/server/utils/supabase-client";
import { getBadgeDefinitionByKey, ensureUserBadge } from "~/server/utils/badge-manager";

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

  const body = await readBody<{ badgeKey?: string }>(event);
  if (!body?.badgeKey) {
    throw createError({ statusCode: 400, statusMessage: "badgeKey is required" });
  }

  const definition = await getBadgeDefinitionByKey(body.badgeKey);
  if (!definition) {
    throw createError({ statusCode: 404, statusMessage: "Badge definition not found" });
  }

  await ensureUserBadge({ userId: authUser.user.id, badgeDefinitionId: definition.id });

  return {
    success: true,
    badge: definition,
  };
});
