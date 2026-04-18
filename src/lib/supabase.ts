import { createClient } from "@supabase/supabase-js";

type AuthLike = {
  getSession: () => Promise<{ data: { session: unknown | null } }>;
  onAuthStateChange: (
    cb: (event: string, session: unknown | null) => void
  ) => { data: { subscription: { unsubscribe: () => void } } };
  signUp: (args: {
    email: string;
    password: string;
  }) => Promise<{ error: Error | null }>;
  signInWithPassword: (args: {
    email: string;
    password: string;
  }) => Promise<{ error: Error | null }>;
  getUser: () => Promise<{ data: { user: { email?: string | null } | null } }>;
  signOut: () => Promise<{ error: Error | null }>;
};

export type SupabaseBrowserClientLike = {
  auth: AuthLike;
};

let browserClient: SupabaseBrowserClientLike | null = null;

function createStubClient(): SupabaseBrowserClientLike {
  const missingEnvError = new Error(
    "Supabase env is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
  const subscription = { unsubscribe: () => {} };
  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription } }),
      signUp: async () => ({ error: missingEnvError }),
      signInWithPassword: async () => ({ error: missingEnvError }),
      getUser: async () => ({ data: { user: null } }),
      signOut: async () => ({ error: missingEnvError }),
    },
  };
}

export function getSupabaseBrowserClient(): SupabaseBrowserClientLike {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    browserClient = createStubClient();
    return browserClient;
  }

  // Use a real client when env vars exist.
  browserClient = createClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

