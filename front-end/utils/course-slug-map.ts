export const COURSE_SLUGS = {
  python: "Python",
  "machine-learning": "Machine Learning",
  "deep-learning": "Deep Learning",
  "llm-engineering": "LLM Engineering",
  rag: "RAG",
  mcp: "MCP",
  "agentic-ai": "Agentic AI",
} as const;

export type CourseSlug = keyof typeof COURSE_SLUGS;

export const getCourseTitle = (slug: CourseSlug): string => {
  return COURSE_SLUGS[slug] ?? slug;
};

export const isValidCourseSlug = (slug: string): slug is CourseSlug => {
  return slug in COURSE_SLUGS;
};

export const COURSE_SLUG_LIST: CourseSlug[] = Object.keys(COURSE_SLUGS) as CourseSlug[];
