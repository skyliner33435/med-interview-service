"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function SuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id")?.trim() ?? "";

  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"working" | "ok" | "error">("working");
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getSession().then((res) => {
      const session = (res as { data: { session: Session | null } }).data.session;
      setUser((session?.user as User | null) ?? null);
    });
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setDetail("session_id がありません。");
      return;
    }

    let cancelled = false;

    async function run() {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = (await supabase.auth.getSession()) as {
        data: { session: Session | null };
      };
      const token = sessionData.session?.access_token;
      if (!token) {
        if (!cancelled) {
          setStatus("error");
          setDetail("ログインが必要です。");
        }
        return;
      }

      const res = await fetch("/api/stripe/sync-purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        universityName?: string;
        error?: string;
      };

      if (cancelled) return;

      if (!res.ok) {
        setStatus("error");
        setDetail(payload.error ?? "閲覧権の登録に失敗しました。");
        return;
      }

      setStatus("ok");
      setDetail(
        payload.universityName
          ? `「${payload.universityName}」の閲覧権を付与しました。`
          : "閲覧権を付与しました。"
      );
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="rounded-3xl bg-[color:var(--color-card)] p-8 ring-1 ring-white/10">
        <p className="text-sm text-red-100">無効なリンクです。</p>
        <Link
          href="/purchase"
          className="mt-4 inline-block text-sm font-semibold text-[color:var(--color-accent)] underline-offset-4 hover:underline"
        >
          購入ページへ
        </Link>
      </div>
    );
  }

  if (!user && status === "error" && detail === "ログインが必要です。") {
    return (
      <div className="rounded-3xl bg-[color:var(--color-card)] p-8 ring-1 ring-white/10">
        <p className="text-sm text-[color:var(--color-muted)]">
          閲覧権をアカウントに紐づけるにはログインが必要です。
        </p>
        <button
          type="button"
          onClick={() =>
            router.push(
              `/login?next=${encodeURIComponent(`/purchase/success?session_id=${encodeURIComponent(sessionId)}`)}`
            )
          }
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-6 text-sm font-semibold text-[#1a2744]"
        >
          ログインする
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-[color:var(--color-card)] p-8 ring-1 ring-white/10">
      {status === "working" ? (
        <p className="text-sm text-[color:var(--color-muted)]">決済結果を確認しています…</p>
      ) : status === "ok" ? (
        <div className="space-y-3">
          <p className="text-lg font-semibold text-emerald-200">成功</p>
          <p className="text-sm leading-7 text-[color:var(--color-foreground)]">{detail}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-lg font-semibold text-red-200">失敗</p>
          <p className="text-sm text-red-100">{detail}</p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/reports"
          className="inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-6 text-sm font-semibold text-[#1a2744]"
        >
          レポート一覧へ
        </Link>
        <Link
          href="/purchase"
          className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold text-[color:var(--color-foreground)]"
        >
          購入ページへ
        </Link>
      </div>
    </div>
  );
}
