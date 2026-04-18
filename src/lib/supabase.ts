import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
  const subscription = { unsubscribe: () => {} };
  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription } }),
      signUp: async () => ({ error: null }),
      signInWithPassword: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null } }),
      signOut: async () => ({ error: null }),
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
  browserClient = createClient(supabaseUrl, supabaseAnonKey) as SupabaseClient;
  return browserClient;
}

