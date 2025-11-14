/**
 * API Client Composable
 * Provides authenticated fetch methods with automatic token injection
 */

import { type FetchOptions } from "ofetch";

/**
 * Get the current Supabase client safely
 */
const useSupabaseClient = () => {
  if (!import.meta.client) {
    return null;
  }

  try {
    const nuxtApp = useNuxtApp();
    return (nuxtApp.$supabase as any) ?? null;
  } catch {
    return null;
  }
};

/**
 * Get the current auth token from Supabase
 */
const getAuthToken = async (): Promise<string | null> => {
  if (!import.meta.client) {
    return null;
  }

  try {
    const supabase = useSupabaseClient();
    if (!supabase) {
      return null;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch (error) {
    console.error("[api-client] Failed to get auth token:", error);
    return null;
  }
};

/**
 * Composable for authenticated API requests
 */
export const useApiClient = () => {
  /**
   * Authenticated fetch - automatically includes Bearer token
   */
  const authFetch = async <T = any>(
    url: string,
    options: FetchOptions<"json"> = {}
  ): Promise<T> => {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Authentication required. Please sign in.");
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

  /**
   * Check if user has a valid auth token
   */
  const hasAuth = async (): Promise<boolean> => {
    const token = await getAuthToken();
    return token !== null;
  };

  return {
    authFetch,
    hasAuth,
  };
};

