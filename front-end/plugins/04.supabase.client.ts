import { createClient, type SupabaseClient } from "@supabase/supabase-js";

declare module "#app" {
  interface NuxtApp {
    $supabase: SupabaseClient;
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $supabase: SupabaseClient;
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  
  // Access the supabase config from public runtime config
  const supabaseConfig = config.public.supabase as { url?: string; anonKey?: string } | undefined;
  const supabaseUrl = supabaseConfig?.url;
  const supabaseAnonKey = supabaseConfig?.anonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[supabase] Missing configuration. Ensure NUXT_SUPABASE_URL and NUXT_SUPABASE_ANON_KEY are set.",
      { supabaseUrl, supabaseAnonKey }
    );
    // Return empty provide to prevent undefined errors
    return {
      provide: {
        supabase: null,
      },
    };
  }

  console.log("[supabase] Initializing client with URL:", supabaseUrl);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  console.log("[supabase] Client initialized successfully");

  return {
    provide: {
      supabase,
    },
  };
});

