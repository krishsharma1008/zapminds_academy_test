#!/usr/bin/env node
import "dotenv/config";

import { seedCourse, type SeedCourseOptions } from "./seed-course";
import { pythonFoundationsContent } from "../utils/python-foundations-data";
import { machineLearningSystemsContent } from "../utils/machine-learning-systems-data";
import { deepLearningStudioContent } from "../utils/deep-learning-studio-data";
import { llmEngineeringCourseContent } from "../utils/llm-engineering-data";
import { ragCourseContent } from "../utils/rag-course-data";
import { mcpCourseContent } from "../utils/mcp-course-data";
import { agenticAiCourseContent } from "../utils/agentic-ai-course-data";
import { UIElements } from "../assets/static-data/ui-elements";

const COURSES = [
  {
    content: pythonFoundationsContent,
    options: {
      updateUiContent: true,
      uiElements: UIElements,
    } satisfies SeedCourseOptions,
  },
  {
    content: machineLearningSystemsContent,
  },
  {
    content: deepLearningStudioContent,
  },
  {
    content: llmEngineeringCourseContent,
  },
  {
    content: ragCourseContent,
  },
  {
    content: mcpCourseContent,
  },
  {
    content: agenticAiCourseContent,
  },
] as const;

const main = async () => {
  for (const entry of COURSES) {
    const { content, options } = entry;

    await seedCourse(
      {
        slug: content.courseId,
        title: content.title,
        description: content.hero?.description ?? content.title,
        hero: content.hero,
        capstone: content.capstone,
        modules: content.modules,
      },
      options
    );
  }
};

main().catch((error) => {
  console.error("[seed:all] Seed failed:", error);
  process.exit(1);
});
