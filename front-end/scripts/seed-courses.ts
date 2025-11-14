/**
 * Seed all course data into Supabase
 * Reads TypeScript course data files and migrates to database
 * Usage: npx tsx scripts/seed-courses.ts
 */

import { createClient } from '@supabase/supabase-js';
import { mcpCourseContent } from '~/utils/mcp-course-data';
import { ragCourseContent } from '~/utils/rag-course-data';
import { agenticAiCourseContent } from '~/utils/agentic-ai-course-data';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

type CourseContent = typeof mcpCourseContent;

const courseMap = new Map<string, { id: number; content: CourseContent }>([
  ['mcp', { id: 10, content: mcpCourseContent }],
  ['rag', { id: 9, content: ragCourseContent }],
  ['agentic-ai', { id: 11, content: agenticAiCourseContent }],
]);

async function seedCourse(courseSlug: string, courseId: number, courseContent: CourseContent) {
  console.log(`\n📚 Seeding course: ${courseSlug}`);
  
  try {
    // Get all modules for this course
    const { data: existingModules, error: modulesError } = await supabase
      .from('modules')
      .select('id, order_index')
      .eq('course_id', courseId)
      .order('order_index');

    if (modulesError) {
      console.error(`  ❌ Failed to fetch modules: ${modulesError.message}`);
      return;
    }

    const modulesByIndex = new Map(
      (existingModules || []).map((m) => [m.order_index, m.id])
    );

    // Seed module details for each module
    let seededCount = 0;
    for (const module of courseContent.modules) {
      const orderIndex = courseContent.modules.indexOf(module) + 1;
      const moduleId = modulesByIndex.get(orderIndex);

      if (!moduleId) {
        console.warn(`  ⚠️  Module at index ${orderIndex} not found`);
        continue;
      }

      // Map TypeScript xp values to database
      const xpByDifficulty: Record<string, number> = {
        core: 100,
        warmup: 50,
        challenge: 200,
        lab: 200,
      };
      const xpValue = xpByDifficulty[module.difficulty] || 100;

      // Format exercise for database
      const exercise = {
        id: module.exercise.id,
        title: module.exercise.title,
        prompt: module.exercise.prompt,
        starterCode: module.exercise.starterCode,
        hints: module.exercise.hints,
        tests: module.exercise.tests.map((test) => ({
          id: test.id,
          description: test.description,
          assertion: test.assertion,
          expected: test.expected || 'True',
        })),
      };

      // Upsert module_details
      const { error: detailsError } = await supabase
        .from('module_details')
        .upsert({
          module_id: moduleId,
          course_id: courseId,
          external_id: module.id,
          duration: module.duration,
          difficulty: module.difficulty,
          overview: module.overview,
          learning_objectives: module.learningObjectives,
          reading: module.reading,
          code_concepts: module.codeConcepts,
          exercise: exercise,
        });

      if (detailsError) {
        console.error(`  ❌ Failed to seed module ${module.title}: ${detailsError.message}`);
      } else {
        seededCount++;
      }
    }

    console.log(`  ✅ Seeded ${seededCount}/${courseContent.modules.length} modules`);
  } catch (error) {
    console.error(`  ❌ Error seeding ${courseSlug}:`, error);
  }
}

async function main() {
  console.log('🚀 Starting course seed migration...');

  for (const [slug, { id, content }] of courseMap) {
    await seedCourse(slug, id, content);
  }

  console.log('\n✨ Course seed migration complete!');
}

main().catch(console.error);
