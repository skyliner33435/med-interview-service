import { createClient } from "@supabase/supabase-js";

type AuthLike = {
  getSession: () => Promise<{
    data: { session: { user: unknown | null } | null };
    error: Error | null;
  }>;
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
  from: (table: string) => any;
  /** PostgrestFilterBuilder を返すため戻り値は any（.then で data/error を取得） */
  rpc: (...args: unknown[]) => any;
  /** createClient の storage。型は簡略化（アップロード等で利用） */
  storage: any;
};

let browserClient: SupabaseBrowserClientLike | null = null;

/** Browser: Web Locks + React Strict Mode で orphaned lock 警告が出るため、同一タブ内の直列化のみ行う。 */
const browserAuthLock = async <R,>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => await fn();

function createStubClient(): SupabaseBrowserClientLike {
  const missingEnvError = new Error(
    "Supabase env is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
  const subscription = { unsubscribe: () => {} };

  const builder: any = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") {
          // Allow: await supabase.from(...).select(...).eq(...).order(...)
          return (resolve: (v: any) => void) =>
            resolve({ data: null, error: missingEnvError });
        }
        return () => builder;
      },
    }
  );

  const storageFrom = () => ({
    upload: async () => ({ error: missingEnvError }),
    getPublicUrl: () => ({ data: { publicUrl: "" } }),
  });

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription } }),
      signUp: async () => ({ error: missingEnvError }),
      signInWithPassword: async () => ({ error: missingEnvError }),
      getUser: async () => ({ data: { user: null } }),
      signOut: async () => ({ error: missingEnvError }),
    },
    from: () => builder,
    rpc: async () => ({ data: null, error: missingEnvError }),
    storage: { from: storageFrom },
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
  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      lock: browserAuthLock,
    },
  }) as unknown as SupabaseBrowserClientLike;
  return browserClient;
}

