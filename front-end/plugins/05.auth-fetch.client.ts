/**
 * Auth Fetch Plugin
 * Provides $authFetch method globally for authenticated API requests
 */

import { type FetchOptions } from "ofetch";

export default defineNuxtPlugin((nuxtApp) => {
  /**
   * Get the current Supabase auth token
   */
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const supabase = nuxtApp.$supabase as any;

      if (!supabase) {
        console.warn("[auth-fetch] Supabase client not available");
        return null;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    } catch (error) {
      console.error("[auth-fetch] Failed to get auth token:", error);
      return null;
    }
  };

  /**
   * Authenticated $fetch wrapper
   * Automatically includes Bearer token in Authorization header
   */
  const $authFetch = async <T = any>(
    url: string,
    options: FetchOptions<"json"> = {}
  ): Promise<T> => {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("No authentication token available. Please sign in.");
    }

    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };

    return $fetch<T>(url, {
      ...options,
      headers,
    });
  };

  return {
    provide: {
      authFetch: $authFetch,
    },
  };
});

