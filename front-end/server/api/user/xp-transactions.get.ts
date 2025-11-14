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
  const limit = Number(getQuery(event).limit ?? 50);
  const offset = Number(getQuery(event).offset ?? 0);

  const token = extractBearerToken(getHeader(event, "authorization"));
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "Missing bearer token" });
  }

  const { data: authUser, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authUser?.user) {
    throw createError({ statusCode: 401, statusMessage: "Invalid authentication token" });
  }

  const { data, error, count } = await supabase
    .from("xp_transactions")
    .select("id, delta, source, source_id, note, created_at", { count: "exact" })
    .eq("user_id", authUser.user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Failed to load XP transactions: ${error.message}` });
  }

  return {
    total: count ?? 0,
    limit,
    offset,
    transactions: data ?? [],
  };
});
