/**
 * API endpoint to fetch complete course content from database
 * Returns course metadata, modules with full details, and capstone
 */

import { useServerSupabase } from '~/server/utils/supabase-client';

const extractBearerToken = (authorizationHeader: string | undefined | null) => {
  if (!authorizationHeader) {
    return null;
  }

  const parts = authorizationHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }

  return null;
};

export default defineEventHandler(async (event) => {
  const supabase = useServerSupabase();
  const token = extractBearerToken(getHeader(event, 'authorization'));

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing bearer token' });
  }

  const { data: authUser, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authUser?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid authentication token' });
  }

  const params = event.context.params ?? {};
  const courseSlug = params.courseId;

  if (!courseSlug) {
    throw createError({ statusCode: 400, statusMessage: 'Course slug is required' });
  }

  try {
    // Fetch course by slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, slug, description')
      .eq('slug', courseSlug)
      .maybeSingle();

    if (courseError || !course) {
      throw createError({ statusCode: 404, statusMessage: 'Course not found' });
    }

    // Fetch all modules for this course with their details
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select(
        `
        id,
        title,
        order_index,
        xp_value,
        module_details(
          external_id,
          duration,
          difficulty,
          overview,
          learning_objectives,
          reading,
          code_concepts,
          exercise
        )
      `
      )
      .eq('course_id', course.id)
      .order('order_index', { ascending: true });

    if (modulesError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to load modules: ${modulesError.message}`,
      });
    }

    // Transform the response
    const transformedModules = (modules || [])
      .map((module: any) => {
        const details = module.module_details?.[0] || {};
        return {
          id: module.id,
          title: module.title,
          orderIndex: module.order_index,
          xpValue: module.xp_value,
          details: {
            externalId: details.external_id || `${courseSlug}-module-${module.id}`,
            duration: details.duration || '20 min',
            difficulty: details.difficulty || 'core',
            overview: details.overview || module.title,
            learningObjectives: details.learning_objectives || [],
            reading: details.reading || [],
            codeConcepts: details.code_concepts || [],
            exercise: details.exercise || {
              id: `exercise-${module.id}`,
              title: `${module.title} Exercise`,
              prompt: 'Complete this exercise to earn XP.',
              starterCode: '# TODO: Add starter code',
              hints: [],
              tests: [],
            },
          },
        };
      });

    return {
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
      },
      modules: transformedModules,
    };
  } catch (error: any) {
    console.error('[course content] Error:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch course content',
    });
  }
});

