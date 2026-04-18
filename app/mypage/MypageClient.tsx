"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function MypageClient() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function logout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <div className="h-5 w-48 rounded bg-white/5" />
        <div className="mt-3 h-4 w-64 rounded bg-white/5" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <div className="text-sm text-[color:var(--color-muted)]">
          ログインが必要です。
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login?redirect=/mypage"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-6 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)]"
          >
            ログインへ
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold tracking-tight text-[color:var(--color-foreground)] transition hover:bg-white/10"
          >
            無料登録
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <div className="text-sm text-[color:var(--color-muted)]">
          ログイン中のアカウント
        </div>
        <div className="mt-2 text-lg font-semibold tracking-tight">{email}</div>
      </div>

      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <div className="text-sm text-[color:var(--color-muted)]">
          次にできること（デモ）
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/submit"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-6 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)]"
          >
            レポート投稿へ
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold tracking-tight text-[color:var(--color-foreground)] transition hover:bg-white/10"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}

