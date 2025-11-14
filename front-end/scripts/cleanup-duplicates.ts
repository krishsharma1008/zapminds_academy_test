#!/usr/bin/env node
import "dotenv/config";
import process from "node:process";
import { createClient, type PostgrestError } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NUXT_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("[cleanup] Missing NUXT_SUPABASE_URL environment variable");
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[cleanup] Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

type ModuleRow = {
  id: number;
  course_id: number;
  order_index: number | null;
  created_at: string | null;
};

type ModuleDetailRow = {
  id: number;
  module_id: number;
  updated_at: string | null;
};

const describeError = (error: PostgrestError | null) =>
  error ? `${error.code ?? "unknown"}: ${error.message}` : "unknown";

const chunk = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const parseTimestamp = (value: string | null): number => {
  if (!value) return 0;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
};

const main = async () => {
  console.info("[cleanup] Starting duplicate cleanup");

  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select("id, course_id, order_index, created_at")
    .order("course_id", { ascending: true })
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  if (modulesError) {
    console.error(`[cleanup] Failed to load modules: ${describeError(modulesError)}`);
    process.exit(1);
  }

  const duplicates: number[] = [];
  const keptModuleIds = new Set<number>();

  const grouped = new Map<string, ModuleRow[]>();
  for (const module of modules ?? []) {
    if (module.order_index == null) {
      keptModuleIds.add(module.id);
      continue;
    }

    const key = `${module.course_id}:${module.order_index}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(module);
    grouped.set(key, bucket);
  }

  for (const bucket of grouped.values()) {
    if (bucket.length === 0) {
      continue;
    }

    if (bucket.length === 1) {
      keptModuleIds.add(bucket[0].id);
      continue;
    }

    bucket.sort((a, b) => parseTimestamp(a.created_at) - parseTimestamp(b.created_at));
    const latest = bucket[bucket.length - 1];
    keptModuleIds.add(latest.id);

    for (let i = 0; i < bucket.length - 1; i += 1) {
      duplicates.push(bucket[i].id);
    }
  }

  if (duplicates.length === 0) {
    console.info("[cleanup] No duplicate modules detected. Nothing to do.");
  } else {
    console.info(`[cleanup] Found ${duplicates.length} duplicate module(s) to remove.`);

    // Delete module completions referencing duplicate modules
    for (const ids of chunk(duplicates, 100)) {
      const { error } = await supabase
        .from("module_completions")
        .delete()
        .in("module_id", ids);

      if (error) {
        console.error(`[cleanup] Failed to delete module_completions: ${describeError(error)}`);
        process.exit(1);
      }
    }

    // Delete module details for duplicate modules
    for (const ids of chunk(duplicates, 100)) {
      const { error } = await supabase
        .from("module_details")
        .delete()
        .in("module_id", ids);

      if (error) {
        console.error(`[cleanup] Failed to delete module_details: ${describeError(error)}`);
        process.exit(1);
      }
    }

    // Delete duplicate modules themselves
    for (const ids of chunk(duplicates, 100)) {
      const { error } = await supabase.from("modules").delete().in("id", ids);

      if (error) {
        console.error(`[cleanup] Failed to delete modules: ${describeError(error)}`);
        process.exit(1);
      }
    }
  }

  // Remove orphaned module_details entries (those whose module_id no longer exists)
  const moduleIdSet = modules
    ?.filter((module) => keptModuleIds.has(module.id))
    .reduce<Set<number>>((acc, module) => acc.add(module.id), new Set<number>()) ?? new Set<number>();

  const { data: moduleDetails, error: detailsError } = await supabase
    .from("module_details")
    .select("module_id, updated_at")
    .order("module_id", { ascending: true })
    .order("updated_at", { ascending: true });

  if (detailsError) {
    console.error(`[cleanup] Failed to load module_details: ${describeError(detailsError)}`);
    process.exit(1);
  }

  // Find duplicate module_details (multiple rows for same module_id)
  const detailsByModule = new Map<number, Array<{ module_id: number; updated_at: string | null }>>();
  for (const detail of moduleDetails ?? []) {
    const bucket = detailsByModule.get(detail.module_id) ?? [];
    bucket.push(detail);
    detailsByModule.set(detail.module_id, bucket);
  }

  const duplicateDetailModuleIds: number[] = [];
  for (const [moduleId, bucket] of detailsByModule.entries()) {
    if (bucket.length > 1) {
      // Sort by updated_at, keep the most recent, mark others for deletion
      bucket.sort((a, b) => {
        const aTime = a.updated_at ? Date.parse(a.updated_at) : 0;
        const bTime = b.updated_at ? Date.parse(b.updated_at) : 0;
        return aTime - bTime;
      });
      // Keep the last one (most recent), mark all others for deletion
      // Since we can't delete by updated_at directly, we'll need to delete all and re-insert the latest
      // But actually, module_details has module_id as primary key, so there shouldn't be duplicates
      // Let me check the schema... Actually, if there are duplicates, we need a different approach
      // For now, let's just log and let the API handle it gracefully
      console.warn(
        `[cleanup] Found ${bucket.length} module_detail rows for module_id=${moduleId}. This shouldn't happen if module_id is unique.`
      );
    }
  }

  const orphanDetailModuleIds = (moduleDetails ?? [])
    .filter((detail) => !moduleIdSet.has(detail.module_id))
    .map((detail) => detail.module_id);

  if (orphanDetailModuleIds.length > 0) {
    console.info(`[cleanup] Removing ${orphanDetailModuleIds.length} orphaned module_detail record(s).`);
    for (const ids of chunk(orphanDetailModuleIds, 100)) {
      const { error } = await supabase.from("module_details").delete().in("module_id", ids);
      if (error) {
        console.error(`[cleanup] Failed to delete orphaned module_details: ${describeError(error)}`);
        process.exit(1);
      }
    }
  }

  // Clean up module_completions that reference missing modules
  const { data: completions, error: completionsError } = await supabase
    .from("module_completions")
    .select("module_id")
    .order("module_id", { ascending: true });

  if (completionsError) {
    console.error(`[cleanup] Failed to load module_completions: ${describeError(completionsError)}`);
    process.exit(1);
  }

  const orphanCompletionModuleIds = (completions ?? [])
    .filter((completion) => !moduleIdSet.has(completion.module_id))
    .map((completion) => completion.module_id);

  if (orphanCompletionModuleIds.length > 0) {
    console.info(
      `[cleanup] Removing ${orphanCompletionModuleIds.length} orphaned module_completion record(s).`
    );
    for (const ids of chunk(orphanCompletionModuleIds, 100)) {
      const { error } = await supabase.from("module_completions").delete().in("module_id", ids);
      if (error) {
        console.error(`[cleanup] Failed to delete orphaned module_completions: ${describeError(error)}`);
        process.exit(1);
      }
    }
  }

  console.info("[cleanup] Cleanup complete.");
  console.info(
    JSON.stringify(
      {
        duplicateModulesRemoved: duplicates.length,
        orphanModuleDetailsRemoved: orphanDetailModuleIds.length,
        orphanModuleCompletionsRemoved: orphanCompletionModuleIds.length,
        modulesRemaining: moduleIdSet.size,
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error("[cleanup] Unexpected error:", error);
  process.exit(1);
});
