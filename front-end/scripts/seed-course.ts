#!/usr/bin/env node
import "dotenv/config";
import process from "node:process";
import crypto from "node:crypto";
import { createClient, type User } from "@supabase/supabase-js";

import { getModuleXp } from "../utils/module-xp-values";

export type Serializable =
  | string
  | number
  | boolean
  | null
  | Serializable[]
  | { [key: string]: Serializable }
  | { __kind: "function"; source: string };

const SUPABASE_URL = process.env.NUXT_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("[seed] Missing NUXT_SUPABASE_URL environment variable");
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[seed] Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const logStep = (slug: string, message: string) => {
  console.info(`[seed:${slug}] ${message}`);
};

const describeError = (error: unknown) => {
  if (!error) return "Unknown error";
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
};

const fatal = (slug: string, error: unknown, context?: string): never => {
  const details = describeError(error);
  console.error(`[seed:${slug}] ${context ?? "Seed failed"}: ${details}`);
  if (error instanceof Error) {
    throw error;
  }
  throw new Error(details);
};

const chunk = <T,>(items: T[], size: number): T[][] => {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
};

export interface CourseModuleInput {
  id: string;
  title: string;
  duration: string;
  difficulty: string;
  overview: string;
  learningObjectives: string[];
  reading: Array<{ label: string; url: string }>;
  codeConcepts: string[];
  exercise: unknown;
}

export interface CourseSeedInput {
  slug: string;
  legacySlugs?: string[];
  title: string;
  description: string;
  hero: unknown;
  capstone: unknown;
  modules: CourseModuleInput[];
}

export interface SeedCourseOptions {
  updateUiContent?: boolean;
  uiElements?: unknown;
}

const SYSTEM_USER_EMAIL = process.env.SEED_SYSTEM_EMAIL;
const SYSTEM_USER_NAME = process.env.SEED_SYSTEM_NAME ;

const findSystemUser = async (): Promise<User | null> => {
  const existing = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (existing.error) {
    fatal("core", existing.error, "Failed to list existing users");
  }

  const normalizedTarget = SYSTEM_USER_EMAIL.toLowerCase();

  return (
    existing.data?.users?.find((user) => user.email?.toLowerCase() === normalizedTarget) ?? null
  );
};

const ensureSystemUser = async (slug: string): Promise<User> => {
  logStep(slug, `Ensuring service user '${SYSTEM_USER_EMAIL}' exists`);

  const existing = await findSystemUser();
  if (existing) {
    return existing;
  }

  const password = crypto.randomBytes(24).toString("hex");

  const created = await supabase.auth.admin.createUser({
    email: SYSTEM_USER_EMAIL,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: SYSTEM_USER_NAME,
      role: "admin",
      source: "seed-script",
    },
  });

  if (created.error) {
    if ((created.error as { status?: number } | null)?.status === 422) {
      const fallback = await findSystemUser();
      if (fallback) {
        logStep(slug, "Service user already exists, reusing existing account");
        return fallback;
      }
    }

    fatal(slug, created.error, "Failed to create system user");
  }

  if (!created.data?.user) {
    fatal(slug, new Error("Admin createUser returned no user payload"), "Failed to create system user");
  }

  logStep(slug, "Created new service user account");
  return created.data.user;
};

const ensureSystemProfile = async (slug: string, user: User) => {
  const profilePayload = {
    user_id: user.id,
    role: "admin",
    display_name: SYSTEM_USER_NAME,
  } as const;

  const result = await supabase.from("profiles").upsert(profilePayload, {
    onConflict: "user_id",
  });

  if (result.error) {
    fatal(slug, result.error, "Failed to upsert admin profile");
  }
};

const upsertCourse = async (slug: string, user: User, data: CourseSeedInput) => {
  const fetchBySlug = async (targetSlug: string) =>
    supabase.from("courses").select("id, slug").eq("slug", targetSlug).maybeSingle();

  let courseRecord: { id: number; slug: string } | null = null;

  const primary = await fetchBySlug(data.slug);
  if (primary.error) {
    fatal(slug, primary.error, "Failed to load course");
  }

  if (primary.data) {
    courseRecord = primary.data;
  }

  if (!courseRecord && data.legacySlugs?.length) {
    for (const legacySlug of data.legacySlugs) {
      const legacy = await fetchBySlug(legacySlug);
      if (legacy.error) {
        fatal(slug, legacy.error, `Failed to load legacy course slug '${legacySlug}'`);
      }

      if (legacy.data) {
        logStep(slug, `Found existing course under legacy slug '${legacySlug}'. Updating in place.`);
        courseRecord = legacy.data;
        break;
      }
    }
  }

  if (!courseRecord) {
    const inserted = await supabase
      .from("courses")
      .insert({
        title: data.title,
        description: data.description,
        is_published: true,
        created_by: user.id,
      })
      .select("id, slug")
      .single();

    if (inserted.error || !inserted.data) {
      fatal(slug, inserted.error ?? new Error("Course insert returned no data"), "Failed to create course");
    }

    logStep(slug, `Course '${inserted.data.slug}' created (id=${inserted.data.id})`);
    return inserted.data;
  }

  const updated = await supabase
    .from("courses")
    .update({
      title: data.title,
      description: data.description,
      is_published: true,
    })
    .eq("id", courseRecord.id)
    .select("id, slug")
    .single();

  if (updated.error || !updated.data) {
    fatal(slug, updated.error ?? new Error("Course update returned no data"), "Failed to update course");
  }

  logStep(slug, `Course '${updated.data.slug}' updated (id=${updated.data.id})`);
  return updated.data;
};

const syncModules = async (slug: string, courseId: number, modules: CourseModuleInput[]) => {
  logStep(slug, "Refreshing modules for course");

  const purge = await supabase.from("modules").delete().eq("course_id", courseId);
  if (purge.error) {
    fatal(slug, purge.error, "Failed to delete existing modules");
  }

  if (modules.length === 0) {
    logStep(slug, "No modules provided. Skipping module insert.");
    return [] as Array<{ id: number; order_index: number }>;
  }

  const moduleRows = modules.map((module, index) => ({
    course_id: courseId,
    title: module.title,
    order_index: index + 1,
    xp_value: getModuleXp(module.difficulty ?? null),
    is_required: true,
    content_url: `course/${slug}/modules/${module.id}`,
  }));

  const inserted = await supabase
    .from("modules")
    .insert(moduleRows)
    .select("id, order_index")
    .order("order_index", { ascending: true });

  if (inserted.error || !inserted.data) {
    fatal(slug, inserted.error ?? new Error("Module insert returned no rows"), "Failed to insert modules");
  }

  logStep(slug, `Inserted ${inserted.data.length} modules`);
  return inserted.data;
};

const syncModuleDetails = async (
  slug: string,
  courseId: number,
  modules: CourseModuleInput[],
  inserted: Array<{ id: number; order_index: number }>
) => {
  if (modules.length === 0) {
    return;
  }

  logStep(slug, "Upserting module details payload");

  const moduleByOrderIndex = new Map<number, { id: number; order_index: number }>();
  for (const row of inserted) {
    moduleByOrderIndex.set(row.order_index, row);
  }

  const detailsPayload = modules.map((module, index) => {
    const orderIndex = index + 1;
    const row = moduleByOrderIndex.get(orderIndex);

    if (!row) {
      fatal(slug, new Error(`Missing inserted module row for order_index=${orderIndex}`));
    }

    return {
      module_id: row.id,
      course_id: courseId,
      external_id: module.id,
      duration: module.duration,
      difficulty: module.difficulty,
      overview: module.overview,
      learning_objectives: module.learningObjectives,
      reading: module.reading,
      code_concepts: module.codeConcepts,
      exercise: module.exercise,
      updated_at: new Date().toISOString(),
    };
  });

  const upserted = await supabase.from("module_details").upsert(detailsPayload, {
    onConflict: "module_id",
  });

  if (upserted.error) {
    fatal(slug, upserted.error, "Failed to upsert module details");
  }

  logStep(slug, `Module details stored for ${detailsPayload.length} modules`);
};

const syncCourseContent = async (slug: string, courseId: number, data: CourseSeedInput) => {
  logStep(slug, "Upserting course-level content");

  const payload = {
    course_id: courseId,
    course_slug: data.slug,
    hero: data.hero,
    capstone: data.capstone,
    updated_at: new Date().toISOString(),
  };

  const result = await supabase.from("course_content").upsert(payload, {
    onConflict: "course_id",
  });

  if (result.error) {
    fatal(slug, result.error, "Failed to upsert course content");
  }
};

const serializeUIValue = (value: unknown): Serializable => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "function") {
    return {
      __kind: "function",
      source: value.toString(),
    };
  }

  if (Array.isArray(value)) {
    return value.map((entry) => serializeUIValue(entry));
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, Serializable>>(
      (acc, [key, entry]) => {
        acc[key] = serializeUIValue(entry);
        return acc;
      },
      {}
    );
  }

  return {
    __kind: "unknown",
    source: String(value),
  };
};

const syncUiContent = async (slug: string, uiElements: unknown) => {
  logStep(slug, "Upserting UI content payload");

  const serialized = serializeUIValue(uiElements);
  const payload = {
    id: "ui-elements",
    payload: serialized,
    updated_at: new Date().toISOString(),
  };

  const result = await supabase.from("ui_content").upsert(payload, {
    onConflict: "id",
  });

  if (result.error) {
    fatal(slug, result.error, "Failed to upsert UI content payload");
  }
};

export const seedCourse = async (courseData: CourseSeedInput, options?: SeedCourseOptions) => {
  const slug = courseData.slug;
  logStep(slug, "Starting course seed");

  const systemUser = await ensureSystemUser(slug);
  await ensureSystemProfile(slug, systemUser);

  const course = await upsertCourse(slug, systemUser, courseData);
  const insertedModules = await syncModules(slug, course.id, courseData.modules);
  await syncModuleDetails(slug, course.id, courseData.modules, insertedModules);
  await syncCourseContent(slug, course.id, courseData);

  if (options?.updateUiContent && options.uiElements) {
    await syncUiContent(slug, options.uiElements);
  }

  logStep(slug, "Seed run completed successfully");
};

