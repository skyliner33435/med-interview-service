"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function AuthCta() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSignedIn(Boolean(data.session));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSignedIn(Boolean(session));
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (signedIn === null) {
    return (
      <div className="h-9 w-[92px] shrink-0 rounded-full bg-white/5 ring-1 ring-white/10 sm:h-10 sm:w-[108px]" />
    );
  }

  if (!signedIn) {
    return (
      <Link
        href="/signup"
        className="hidden h-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-3 text-xs font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)] sm:h-10 sm:px-4 sm:text-sm md:inline-flex"
      >
        無料登録
      </Link>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <Link
        href="/mypage"
        className="inline-flex h-9 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-3 text-xs font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)] sm:h-10 sm:px-4 sm:text-sm"
      >
        マイページ
      </Link>
      <button
        type="button"
        onClick={async () => {
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.signOut();
          setSignedIn(false);
          router.replace("/");
          router.refresh();
        }}
        className="inline-flex h-9 items-center justify-center rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold tracking-tight text-[color:var(--color-foreground)] transition hover:bg-white/10 sm:h-10 sm:px-4 sm:text-sm"
      >
        ログアウト
      </button>
    </div>
  );
}

