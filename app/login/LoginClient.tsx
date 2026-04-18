"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function LoginClient() {
  const router = useRouter();
  const redirectTo = "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <div className="mb-5">
          <div className="text-lg font-semibold tracking-tight">ログイン</div>
          <div className="mt-2 text-sm text-[color:var(--color-muted)]">
            ログインすると購入・投稿などの機能が使えます。
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
              メールアドレス
            </div>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
              パスワード
            </div>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
              autoComplete="current-password"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[color:var(--color-accent)] px-6 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)] disabled:opacity-60"
          >
            {loading ? "ログイン中…" : "ログイン"}
          </button>
        </form>

        <div className="mt-5 text-sm text-[color:var(--color-muted)]">
          はじめてですか？{" "}
          <Link
            href="/signup"
            className="font-semibold text-[color:var(--color-accent-2)] hover:text-[color:var(--color-accent)]"
          >
            無料登録
          </Link>
        </div>
      </div>
    </div>
  );
}

