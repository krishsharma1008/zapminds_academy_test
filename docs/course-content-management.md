# Course Content Management Guide

## Overview

This guide explains how to manage course content in the Zapminds Academy system. All course data is stored in Supabase and fetched via API endpoints at runtime.

## Database Tables

### `courses`
Main course records with metadata.

```sql
CREATE TABLE courses (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT GENERATED,
  description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Fields:**
- `id`: Unique course identifier
- `title`: Course name (e.g., "Machine Learning Systems")
- `slug`: Auto-generated URL-friendly identifier (e.g., "machine-learning-systems")
- `description`: Course overview and learning outcomes
- `is_published`: Whether course is visible to students
- `created_by`: Admin user who created the course

### `modules`
Module records within each course.

```sql
CREATE TABLE modules (
  id BIGINT PRIMARY KEY,
  course_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  xp_value INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  content_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);
```

**Fields:**
- `id`: Unique module identifier
- `course_id`: Parent course
- `title`: Module name (e.g., "Feature Engineering Essentials")
- `order_index`: Position in course (1, 2, 3...)
- `xp_value`: XP awarded on completion (50, 100, 200)
- `is_required`: Whether module is mandatory
- `content_url`: Optional external content link

### `module_details`
Full module content including exercises and learning materials.

```sql
CREATE TABLE module_details (
  module_id BIGINT PRIMARY KEY,
  course_id BIGINT NOT NULL,
  external_id TEXT NOT NULL,
  duration TEXT,
  difficulty TEXT,
  overview TEXT,
  learning_objectives JSONB,
  reading JSONB,
  code_concepts TEXT[],
  exercise JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (module_id) REFERENCES modules(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);
```

**Fields:**
- `external_id`: URL-safe identifier for exercises (e.g., "ml-feature-engineering")
- `difficulty`: "warmup", "core", "challenge", or "lab"
- `overview`: 1-2 sentence description of what students learn
- `learning_objectives`: JSON array of bullet points
- `reading`: JSON array of `{label, url}` resources
- `code_concepts`: Array of programming concepts covered
- `exercise`: Full exercise structure with tests (see below)

### Exercise Structure

The `exercise` JSONB field contains:

```json
{
  "id": "exercise-unique-id",
  "title": "Exercise Title",
  "prompt": "What should the student build?",
  "starterCode": "# Initial code template",
  "hints": ["Hint 1", "Hint 2"],
  "tests": [
    {
      "id": "test-1",
      "description": "What this test validates",
      "assertion": "Python code that runs the test",
      "expected": "True"
    }
  ]
}
```

### `module_completions`
Tracks user progress.

```sql
CREATE TABLE module_completions (
  user_id UUID NOT NULL,
  module_id BIGINT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  awarded_xp INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, module_id),
  FOREIGN KEY (user_id) REFERENCES auth.users(id),
  FOREIGN KEY (module_id) REFERENCES modules(id)
);
```

### `enrollments`
Tracks which users are enrolled in which courses.

```sql
CREATE TABLE enrollments (
  user_id UUID NOT NULL,
  course_id BIGINT NOT NULL,
  status TEXT DEFAULT 'active',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (user_id, course_id),
  FOREIGN KEY (user_id) REFERENCES auth.users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);
```

## Adding a New Course

### Step 1: Create Course Record

```sql
INSERT INTO courses (title, description, is_published, created_by)
VALUES (
  'Course Title',
  'Course description and learning outcomes',
  false,
  'creator-user-id'::uuid
);
```

The `slug` is auto-generated from the title.

### Step 2: Create Modules

```sql
INSERT INTO modules (course_id, title, order_index, xp_value, is_required)
VALUES 
  (COURSE_ID, 'Module 1 Title', 1, 100, true),
  (COURSE_ID, 'Module 2 Title', 2, 100, true),
  (COURSE_ID, 'Module 3 Title', 3, 200, true);
```

**XP Values Guidelines:**
- Warmup/Core: 50-100 XP
- Challenge: 150-200 XP
- Lab: 200+ XP

### Step 3: Add Module Details

```sql
INSERT INTO module_details 
(module_id, course_id, external_id, duration, difficulty, overview, 
 learning_objectives, reading, code_concepts, exercise)
VALUES (
  MODULE_ID,
  COURSE_ID,
  'course-module-1',
  '20 min',
  'core',
  'Learn the fundamentals of module topic.',
  '["Objective 1", "Objective 2", "Objective 3"]'::jsonb,
  '[{"label": "Reading Title", "url": "https://..."}]'::jsonb,
  ARRAY['concept1', 'concept2'],
  '{
    "id": "exercise-1",
    "title": "Exercise Title",
    "prompt": "Implement function that...",
    "starterCode": "def my_function():\n    # TODO",
    "hints": ["Tip 1", "Tip 2"],
    "tests": [
      {
        "id": "test-1",
        "description": "Tests basic functionality",
        "assertion": "def test():\n    return my_function() == expected\ntest()",
        "expected": "True"
      }
    ]
  }'::jsonb
);
```

## API Endpoints

### Get Course Content

```
GET /api/courses/[courseSlug]/content
Authorization: Bearer <token>
```

Returns:
- Course metadata
- All modules with full details
- Sorted by order_index

### Get User's Enrolled Courses

```
GET /api/user/enrolled-courses
Authorization: Bearer <token>
```

Returns:
- List of courses user is enrolled in
- Progress % for each course
- Completed/total modules
- Earned/total XP

### Enroll in Course

```
POST /api/courses/[courseSlug]/enroll
Authorization: Bearer <token>
```

Returns:
- Success status
- Course ID

## Composables

### `useCourseContent(slug)`

```typescript
const { course, modules, capstone, pending, error, refresh } = 
  useCourseContent('machine-learning-systems');
```

Fetches complete course data from database.

### `useCourseProgress(slug)`

```typescript
const { progress, pending, error, refresh } = 
  useCourseProgress('machine-learning-systems');
```

Returns:
- `completedModules`: Number of completed modules
- `totalModules`: Total modules in course
- `earnedXp`: XP earned in course
- `totalXp`: Total possible XP
- `completionPercent`: Progress percentage

### `useCourseCompletions(slug)`

```typescript
const { completedExternalIds, isModuleCompleted, pending, error } = 
  useCourseCompletions('machine-learning-systems');
```

Returns which modules are completed by current user.

## Best Practices

### Difficulty Levels
- **Warmup** (50 XP): Introduction, review, easy problems
- **Core** (100 XP): Main concepts, standard problems
- **Challenge** (150-200 XP): Complex problems, multiple concepts
- **Lab** (200+ XP): Projects, extended exercises

### Exercise Design
1. Keep prompt clear and concise (1-2 sentences)
2. Provide starter code to scaffold solution
3. Include 2-3 helpful hints
4. Write 2-4 test cases covering main scenarios
5. Test assertions should use assertions, not print statements
6. Start code with language-specific docstrings

### Learning Objectives
- Write 3-5 objectives per module
- Use action verbs: "Implement", "Understand", "Build", "Master"
- Be specific about what students will learn
- Order from fundamental to advanced

### Module Duration Estimates
- 10-15 min: Quick review, simple concepts
- 15-20 min: Standard module with exercise
- 20-25 min: Complex topic with multiple concepts
- 25+ min: Advanced topic or multi-part exercise

## Maintenance

### Updating Module Content

```sql
UPDATE module_details
SET 
  overview = 'Updated description',
  exercise = '...'::jsonb,
  updated_at = now()
WHERE module_id = MODULE_ID;
```

### Publishing a Course

```sql
UPDATE courses
SET is_published = true
WHERE slug = 'course-slug';
```

### Checking Progress

```sql
-- How many students completed each module
SELECT 
  md.title,
  COUNT(DISTINCT mc.user_id) as completed_by_users
FROM modules m
JOIN module_details md ON m.id = md.module_id
LEFT JOIN module_completions mc ON m.id = mc.module_id
WHERE m.course_id = COURSE_ID
GROUP BY md.title
ORDER BY m.order_index;
```

## XP & Progression System

XP is awarded when users complete module exercises. The system automatically:
1. Awards XP based on module.xp_value
2. Updates user profile xp_total
3. Checks for tier upgrades
4. Updates leaderboard rankings
5. Records XP transaction for analytics

See `server/utils/xp-calculator.ts` for implementation details.

## Troubleshooting

### Course not appearing
- Check `is_published = true`
- Verify user is enrolled via `enrollments` table
- Check course slug matches URL

### Modules not loading
- Verify modules exist for course_id
- Check `order_index` is sequential from 1
- Verify module_details exists for each module

### Exercise not showing
- Check `module_details.exercise` is valid JSON
- Verify `exercise.tests` array has at least 1 test
- Check test `assertion` is valid Python code

### XP not updating
- Check `module_completions` record created
- Verify `xp_transactions` table has entry
- Check `profiles.xp_total` incremented

