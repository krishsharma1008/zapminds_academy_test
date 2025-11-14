#!/usr/bin/env node
import "dotenv/config";

import { seedCourse } from "./seed-course";
import { pythonFoundationsContent } from "../utils/python-foundations-data";
import { UIElements } from "../assets/static-data/ui-elements";

const main = async () => {
  await seedCourse(
    {
      slug: pythonFoundationsContent.courseId,
      legacySlugs: ["python-foundations"],
      title: "Python",
      description: pythonFoundationsContent.hero?.description ?? pythonFoundationsContent.title,
      hero: pythonFoundationsContent.hero,
      capstone: pythonFoundationsContent.capstone,
      modules: pythonFoundationsContent.modules,
    },
    {
      updateUiContent: true,
      uiElements: UIElements,
    }
  );
};

main().catch((error) => {
  console.error("[seed:python] Seed failed:", error);
  process.exit(1);
});
