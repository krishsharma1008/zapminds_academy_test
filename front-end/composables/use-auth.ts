import { computed, onMounted, watch, type Ref } from "vue";
import type {
  Provider,
  Session,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";

type StudentAuthState = {
  isAuthenticated: boolean;
  email: string | null;
  name: string | null;
  user_id: string | null;
};

const cookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

const formatNameFromEmail = (email: string | null | undefined) => {
  const source = email || "student";
  const base = source.split("@")[0] || "Zapmind Student";

  return base
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
};

type SignInPayload = {
  email: string;
  password: string;
  remember?: boolean;
};

type SignUpPayload = {
  email: string;
  password: string;
  name?: string;
  metadata?: Record<string, unknown>;
};

const extractDisplayName = (user: User | null) => {
  if (!user) {
    return null;
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metadataNames = [
    "full_name",
    "name",
    "display_name",
    "preferred_name",
  ];

  for (const key of metadataNames) {
    const value = meta[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return formatNameFromEmail(user.email);
};

const applySessionToState = (
  target: StudentAuthState,
  session: Session | null
) => {
  if (!session?.user) {
    target.isAuthenticated = false;
    target.email = null;
    target.name = null;
    target.user_id = null;
    return;
  }

  const user = session.user;
  target.isAuthenticated = true;
  target.email = user.email ?? null;
  target.name = extractDisplayName(user);
  target.user_id = user.id;
};

const applyUserToState = (target: StudentAuthState, user: User | null) => {
  if (!user) {
    target.isAuthenticated = false;
    target.email = null;
    target.name = null;
    target.user_id = null;
    return;
  }

  target.isAuthenticated = true;
  target.email = user.email ?? null;
  target.name = extractDisplayName(user);
  target.user_id = user.id;
};

const ensureSupabaseAuthWatcher = (
  supabase: SupabaseClient | null,
  state: Ref<StudentAuthState>
) => {
  if (!process.client || !supabase) {
    return;
  }

  const isInitialised = useState<boolean>(
    "za-supabase-auth-initialised",
    () => false
  );

  if (isInitialised.value) {
    return;
  }

  isInitialised.value = true;

  supabase.auth.getSession().then(({ data }) => {
    applySessionToState(state.value, data.session ?? null);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    applySessionToState(state.value, session ?? null);
  });
};

const useSupabaseClientMaybe = (): SupabaseClient | null => {
  if (!process.client) {
    return null;
  }

  const nuxtApp = useNuxtApp();
  return (nuxtApp.$supabase as SupabaseClient | undefined) ?? null;
};

const getSupabaseClientOrThrow = () => {
  if (!process.client) {
    throw new Error("Supabase client can only be used on the client side.");
  }
  
  const client = useSupabaseClientMaybe();
  if (!client) {
    throw new Error("Supabase client is not initialised.");
  }
  return client;
};

const normalizeSupabaseError = (error: unknown) => {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (
    typeof error === "object" &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "Unexpected error. Please try again.";
};

export const useStudentAuth = () => {
  const cookie = useCookie<StudentAuthState>("za-student-auth", {
    ...cookieOptions,
    default: () => ({
      isAuthenticated: false,
      email: null,
      name: null,
      user_id: null,
    }),
  });

  const state = useState<StudentAuthState>("za-student-auth-state", () => ({
    isAuthenticated: cookie.value?.isAuthenticated ?? false,
    email: cookie.value?.email ?? null,
    name: cookie.value?.name ?? null,
    user_id: cookie.value?.user_id ?? null,
  }));

  if (process.client) {
    onMounted(() => {
      const supabase = useSupabaseClientMaybe();
      if (supabase) {
        ensureSupabaseAuthWatcher(supabase, state);
      }
    });
  }

  watch(
    state,
    (value) => {
      cookie.value = value;
    },
    { deep: true }
  );

  const setAuthenticatedUser = (user: User | null) => {
    const nextState: StudentAuthState = {
      isAuthenticated: false,
      email: null,
      name: null,
      user_id: null,
    };

    applyUserToState(nextState, user);
    state.value = nextState;
  };

  const signInWithPassword = async (payload: SignInPayload) => {
    const supabase = getSupabaseClientOrThrow();

    const { email, password } = payload;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      throw new Error(normalizeSupabaseError(error));
    }

    if (data?.user ?? data?.session?.user) {
      setAuthenticatedUser(data.user ?? data.session?.user ?? null);
    } else {
      await refreshSession();
    }

    return data;
  };

  const signUpWithPassword = async (payload: SignUpPayload) => {
    const supabase = getSupabaseClientOrThrow();

    const { email, password, name, metadata } = payload;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.client
          ? new URL("/dashboard", window.location.origin).href
          : undefined,
        data: {
          full_name: name ?? null,
          ...(metadata ?? {}),
        },
      },
    });

    if (error) {
      throw new Error(normalizeSupabaseError(error));
    }

    if (data?.user ?? data?.session?.user) {
      setAuthenticatedUser(data.user ?? data.session?.user ?? null);
      
      // Initialize user profile, streak, and add to leaderboard
      if (data?.session?.access_token) {
        try {
          await $fetch("/api/user/initialize", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
          });
        } catch (initError) {
          // Log but don't fail signup if initialization fails
          console.error("Failed to initialize user profile:", initError);
        }
      }
    }

    return data;
  };

  const signInWithProvider = async (provider: Provider) => {
    const supabase = getSupabaseClientOrThrow();

    const redirectTo = process.client
      ? new URL("/dashboard", window.location.origin).href
      : undefined;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      throw new Error(normalizeSupabaseError(error));
    }

    return data;
  };

  const signOut = async () => {
    const supabase = getSupabaseClientOrThrow();

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(normalizeSupabaseError(error));
    }

    state.value = {
      isAuthenticated: false,
      email: null,
      name: null,
      user_id: null,
    };
  };

  const refreshSession = async () => {
    const supabase = getSupabaseClientOrThrow();

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(normalizeSupabaseError(error));
    }

    applySessionToState(state.value, data.session ?? null);
    return data.session ?? null;
  };

  return {
    authState: state,
    isAuthenticated: computed(() => state.value.isAuthenticated),
    profile: computed(() => ({
      email: state.value.email,
      name: state.value.name,
      user_id: state.value.user_id,
    })),
    signInWithPassword,
    signUpWithPassword,
    signInWithProvider,
    signOut,
    refreshSession,
  };
};
