import { useServerSupabase } from "~/server/utils/supabase-client";
import { awardXp, calculateModuleXp } from "~/server/utils/xp-calculator";
import { checkAndAwardTierBadge } from "~/server/utils/badge-manager";

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

interface SubmitRequestBody {
  moduleId?: number | string;
  passed?: boolean;
  code?: string;
}

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

  const body = await readBody<SubmitRequestBody>(event);
  if (!body?.moduleId) {
    throw createError({ statusCode: 400, statusMessage: "moduleId is required" });
  }

  if (!body.passed) {
    return {
      awarded: false,
      reason: "Submission did not pass required tests.",
    };
  }

  const moduleIdentifier = body.moduleId;

  let moduleRow: { id: number; course_id: number; xp_value: number | null } | null = null;

  if (typeof moduleIdentifier === "number") {
    const { data, error } = await supabase
      .from("modules")
      .select("id, course_id, xp_value")
      .eq("id", moduleIdentifier)
      .maybeSingle();

    if (error) {
      throw createError({ statusCode: 500, statusMessage: `Failed to load module: ${error.message}` });
    }
    moduleRow = data;
  } else {
    // First find the module_details by external_id
    const { data: detailsData, error: detailsError } = await supabase
      .from("module_details")
      .select("module_id, course_id, external_id")
      .eq("external_id", moduleIdentifier)
      .limit(1);

    if (detailsError) {
      throw createError({ statusCode: 500, statusMessage: `Failed to load module details: ${detailsError.message}` });
    }

    if (!detailsData || detailsData.length === 0) {
      throw createError({ statusCode: 404, statusMessage: `Module not found for external_id: ${moduleIdentifier}` });
    }

    const moduleDetail = detailsData[0];

    // Now fetch the module data
    const { data: moduleData, error: moduleError } = await supabase
      .from("modules")
      .select("id, course_id, xp_value")
      .eq("id", moduleDetail.module_id)
      .maybeSingle();

    if (moduleError) {
      throw createError({ statusCode: 500, statusMessage: `Failed to load module: ${moduleError.message}` });
    }

    if (moduleData) {
      moduleRow = {
        id: moduleData.id,
        course_id: moduleData.course_id,
        xp_value: moduleData.xp_value,
      };
    }
  }

  if (!moduleRow) {
    throw createError({ statusCode: 404, statusMessage: "Module not found" });
  }

  const { data: moduleDetailRows, error: detailError } = await supabase
    .from("module_details")
    .select("difficulty, external_id, updated_at")
    .eq("module_id", moduleRow.id)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(2);

  if (detailError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to load module metadata: ${detailError.message}`,
    });
  }

  if (!moduleDetailRows || moduleDetailRows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "Module metadata missing" });
  }

  // If multiple rows found, use the most recent one (already ordered by updated_at desc)
  // Log a warning but don't fail - cleanup script can fix this later
  if (moduleDetailRows.length > 1) {
    console.warn(
      `[exercises/submit] Multiple module_detail rows found for module_id=${moduleRow.id}. Using most recent. Consider running cleanup script.`
    );
  }

  const moduleDetail = moduleDetailRows[0];

  const { data: existingCompletions, error: existingCompletionError } = await supabase
    .from("module_completions")
    .select("module_id, completed_at")
    .eq("user_id", authUser.user.id)
    .eq("module_id", moduleRow.id)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .limit(2);

  if (existingCompletionError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to check module completion status: ${existingCompletionError.message}`,
    });
  }

  // If multiple completion records found, use the most recent one (already ordered by completed_at desc)
  // Log a warning but don't fail - cleanup script can fix this later
  if ((existingCompletions ?? []).length > 1) {
    console.warn(
      `[exercises/submit] Multiple completion records found for user_id=${authUser.user.id}, module_id=${moduleRow.id}. Using most recent. Consider running cleanup script.`
    );
  }

  const alreadyCompleted = !!existingCompletions && existingCompletions.length > 0;

  const baseXp = moduleRow.xp_value ?? calculateModuleXp(moduleDetail.difficulty ?? null);

  let awardedXp = 0;
  let xpResult = null;
  let tierBadge = null;

  if (!alreadyCompleted) {
    awardedXp = baseXp;

    const { error: completionError } = await supabase.from("module_completions").insert({
      user_id: authUser.user.id,
      module_id: moduleRow.id,
      awarded_xp: awardedXp,
    });

    if (completionError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to record module completion: ${completionError.message}`,
      });
    }

    xpResult = await awardXp({
      userId: authUser.user.id,
      amount: awardedXp,
      type: "module",
      sourceId: moduleRow.id,
      description:
        typeof moduleIdentifier === "string"
          ? moduleIdentifier
          : moduleDetail.external_id ?? `module:${moduleRow.id}`,
    });

    if (xpResult.tierChanged) {
      tierBadge = await checkAndAwardTierBadge(authUser.user.id, xpResult.newTier.name);
    }
  }

  return {
    awarded: !alreadyCompleted,
    moduleId: moduleRow.id,
    xpAwarded: awardedXp,
    xpResult,
    tierBadge,
  };
});
