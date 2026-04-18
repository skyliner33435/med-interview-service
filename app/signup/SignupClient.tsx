"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function SignupClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      // Email confirmation may be required depending on Supabase settings.
      setDone(true);
      router.replace("/mypage");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <div className="mb-5">
          <div className="text-lg font-semibold tracking-tight">無料登録</div>
          <div className="mt-2 text-sm text-[color:var(--color-muted)]">
            投稿すると将来的に「全大学レポート閲覧無料」などの特典に紐づけられます。
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {done ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[color:var(--color-foreground)]">
            登録しました。メール確認が必要な場合は、受信箱をご確認ください。
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
              minLength={8}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
              placeholder="8文字以上"
              autoComplete="new-password"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[color:var(--color-accent)] px-6 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)] disabled:opacity-60"
          >
            {loading ? "登録中…" : "登録する"}
          </button>
        </form>

        <div className="mt-5 text-sm text-[color:var(--color-muted)]">
          すでにアカウントをお持ちですか？{" "}
          <Link
            href="/login"
            className="font-semibold text-[color:var(--color-accent-2)] hover:text-[color:var(--color-accent)]"
          >
            ログイン
          </Link>
        </div>
      </div>
    </div>
  );
}

