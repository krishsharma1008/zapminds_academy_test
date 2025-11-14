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
    throw createError({ statusCode: 401, statusMessage: "Missing bearer token" });
  }

  const { data: authUser, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authUser?.user) {
    throw createError({ statusCode: 401, statusMessage: "Invalid authentication token" });
  }

  const userId = authUser.user.id;
  const params = event.context.params ?? {};
  const courseSlug = params.courseId;

  if (!courseSlug) {
    throw createError({ statusCode: 400, statusMessage: "Course identifier is required." });
  }

  // Get the course
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, slug")
    .eq("slug", courseSlug)
    .maybeSingle();

  if (courseError || !course) {
    throw createError({ statusCode: 404, statusMessage: "Course not found" });
  }

  // Get all modules for this course
  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", course.id);

  if (modulesError) {
    throw createError({ statusCode: 500, statusMessage: `Failed to load modules: ${modulesError.message}` });
  }

  const moduleIds = (modules ?? []).map((module) => module.id);

  if (moduleIds.length === 0) {
    return { completedModuleIds: [], completedExternalIds: [] };
  }

  // Get completed modules
  const { data: completions, error: completionsError } = await supabase
    .from("module_completions")
    .select("module_id")
    .eq("user_id", userId)
    .in("module_id", moduleIds);

  if (completionsError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to load completions: ${completionsError.message}`,
    });
  }

  const completedModuleIds = (completions ?? []).map((c) => c.module_id);

  // Get external IDs for completed modules
  const { data: details, error: detailsError } = await supabase
    .from("module_details")
    .select("module_id, external_id")
    .in("module_id", completedModuleIds);

  if (detailsError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to load module details: ${detailsError.message}`,
    });
  }

  const completedExternalIds = (details ?? [])
    .filter((d) => d.external_id)
    .map((d) => d.external_id as string);

  return {
    completedModuleIds,
    completedExternalIds,
  };
});

