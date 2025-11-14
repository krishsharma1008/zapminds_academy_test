/**
 * API Client Utility
 * Automatically attaches authentication token to API requests
 */

import { type FetchOptions } from "ofetch";

/**
 * Get the current Supabase auth token
 */
const getAuthToken = async (): Promise<string | null> => {
  if (!process.client) {
    return null;
  }

  try {
    const nuxtApp = useNuxtApp();
    const supabase = nuxtApp.$supabase;

    if (!supabase) {
      console.warn("[api-client] Supabase client not available");
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch (error) {
    console.error("[api-client] Failed to get auth token:", error);
    return null;
  }
};

/**
 * Authenticated $fetch wrapper
 * Automatically includes Bearer token in Authorization header
 */
export const $authFetch = async <T = any>(
  url: string,
  options: FetchOptions<"json"> = {}
): Promise<T> => {
  const token = await getAuthToken();

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return $fetch<T>(url, {
    ...options,
    headers,
  });
};

/**
 * Check if user is authenticated and has a valid session
 */
export const checkAuth = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return token !== null;
};

