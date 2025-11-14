import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface SupabaseClientCache {
  public?: SupabaseClient;
  service?: SupabaseClient;
}

declare global {
  // eslint-disable-next-line no-var
  var __zapmindsSupabaseClients: SupabaseClientCache | undefined;
}

const getCache = (): SupabaseClientCache => {
  if (!globalThis.__zapmindsSupabaseClients) {
    globalThis.__zapmindsSupabaseClients = {};
  }

  return globalThis.__zapmindsSupabaseClients;
};

const resolveConfig = () => {
  const config = useRuntimeConfig();
  const url = config.public?.supabase?.url;
  const anonKey = config.public?.supabase?.anonKey;
  const serviceRoleKey = config.supabase?.serviceRoleKey;

  if (!url) {
    console.error("Missing Supabase URL. Set NUXT_SUPABASE_URL in your environment.");
    throw new Error("Supabase URL is not configured");
  }

  if (!anonKey) {
    console.error(
      "Missing Supabase anon key. Set NUXT_SUPABASE_ANON_KEY in your environment."
    );
    throw new Error("Supabase anon key is not configured");
  }

  return { url, anonKey, serviceRoleKey } as const;
};

const createPublicClient = (): SupabaseClient => {
  const { url, anonKey } = resolveConfig();

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

const createServiceClient = (): SupabaseClient => {
  const { url, serviceRoleKey } = resolveConfig();

  if (!serviceRoleKey) {
    console.error(
      "Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY in your server environment."
    );
    throw new Error("Supabase service role key is not configured");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

export const getSupabasePublicClient = (): SupabaseClient => {
  const cache = getCache();

  if (!cache.public) {
    cache.public = createPublicClient();
  }

  return cache.public;
};

export const getSupabaseServiceClient = (): SupabaseClient => {
  const cache = getCache();

  if (!cache.service) {
    cache.service = createServiceClient();
  }

  return cache.service;
};

// Alias for backward compatibility
export const useServerSupabase = getSupabaseServiceClient;
