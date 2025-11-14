/**
 * API endpoint to fetch user's enrolled courses with progress
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

  const userId = authUser.user.id;

  try {
    // Fetch user's enrolled courses
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('course_id, status, enrolled_at')
      .eq('user_id', userId);

    if (enrollmentsError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to load enrollments: ${enrollmentsError.message}`,
      });
    }

    if (!enrollments || enrollments.length === 0) {
      return { courses: [] };
    }

    const courseIds = enrollments.map((e) => e.course_id);

    // Fetch course details
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, slug, description, is_published')
      .in('id', courseIds);

    if (coursesError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to load courses: ${coursesError.message}`,
      });
    }

    // Fetch progress for each course
    const enrollmentMap = new Map(enrollments.map((e) => [e.course_id, e]));
    const coursesWithProgress = await Promise.all(
      (courses || []).map(async (course) => {
        // Get modules count
        const { count: totalModules } = await supabase
          .from('modules')
          .select('id', { count: 'exact' })
          .eq('course_id', course.id);

        // Get completed modules
        const { count: completedModules } = await supabase
          .from('module_completions')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .in(
            'module_id',
            (
              await supabase
                .from('modules')
                .select('id')
                .eq('course_id', course.id)
            ).data?.map((m: any) => m.id) || []
          );

        // Get total and earned XP
        const { data: moduleData } = await supabase
          .from('modules')
          .select('xp_value')
          .eq('course_id', course.id);

        const totalXp = (moduleData || []).reduce((sum: number, m: any) => sum + (m.xp_value || 0), 0);

        // Get earned XP from completions
        const { data: completions } = await supabase
          .from('module_completions')
          .select('awarded_xp')
          .eq('user_id', userId)
          .in(
            'module_id',
            moduleData?.map((m) => 0) || []
          ); // placeholder - would need module IDs

        const earnedXp = (completions || []).reduce((sum: number, c: any) => sum + (c.awarded_xp || 0), 0);

        const enrollment = enrollmentMap.get(course.id);
        const completionPercent = totalModules && totalModules > 0 ? Math.round((completedModules || 0) / totalModules * 100) : 0;

        return {
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          isPublished: course.is_published,
          progress: completionPercent,
          completedModules: completedModules || 0,
          totalModules: totalModules || 0,
          earnedXp,
          totalXpValue: totalXp,
          enrolledAt: enrollment?.enrolled_at,
          status: enrollment?.status || 'active',
        };
      })
    );

    return {
      courses: coursesWithProgress,
    };
  } catch (error: any) {
    console.error('[enrolled-courses] Error:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch enrolled courses',
    });
  }
});

