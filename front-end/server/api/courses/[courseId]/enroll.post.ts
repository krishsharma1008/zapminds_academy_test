/**
 * API endpoint to enroll user in a course
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
  const params = event.context.params ?? {};
  const courseSlug = params.courseId;

  if (!courseSlug) {
    throw createError({ statusCode: 400, statusMessage: 'Course slug is required' });
  }

  try {
    // Fetch course by slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', courseSlug)
      .maybeSingle();

    if (courseError || !course) {
      throw createError({ statusCode: 404, statusMessage: 'Course not found' });
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('user_id')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .maybeSingle();

    if (existingEnrollment) {
      return {
        success: true,
        enrolled: true,
        message: 'Already enrolled in this course',
      };
    }

    // Enroll user
    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: course.id,
        status: 'active',
      });

    if (enrollError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to enroll: ${enrollError.message}`,
      });
    }

    return {
      success: true,
      enrolled: true,
      message: 'Successfully enrolled in course',
      courseId: course.id,
    };
  } catch (error: any) {
    console.error('[enroll] Error:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to enroll in course',
    });
  }
});

