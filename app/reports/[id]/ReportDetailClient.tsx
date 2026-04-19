"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export type ReportDetailRow = {
  id: string;
  university_name: string;
  year: number;
  format: string;
  content: string | null;
  atmosphere: string | null;
  score: string | null;
  improvement: string | null;
  image_url: string | null;
  status: string;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
      <h2 className="text-sm font-semibold tracking-tight text-[color:var(--color-accent)]">
        {title}
      </h2>
      <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[color:var(--color-foreground)]">
        {children}
      </div>
    </section>
  );
}

export function ReportDetailClient({ reportId }: { reportId: string }) {
  const [row, setRow] = useState<ReportDetailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;
    setLoading(true);
    setDenied(false);

    void (async () => {
      const { data, error } = await supabase
        .from("reports")
        .select(
          "id, university_name, year, format, content, atmosphere, score, improvement, image_url, status"
        )
        .eq("id", reportId)
        .maybeSingle();

      if (cancelled) return;
      setLoading(false);

      if (error || !data) {
        setDenied(true);
        setRow(null);
        return;
      }

      setRow(data as ReportDetailRow);
    })();

    return () => {
      cancelled = true;
    };
  }, [reportId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/10" />
        <div className="h-64 animate-pulse rounded-3xl bg-white/5 ring-1 ring-white/10" />
      </div>
    );
  }

  if (denied || !row) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[color:var(--color-card)] p-8 ring-1 ring-white/10">
        <p className="text-sm leading-7 text-[color:var(--color-muted)]">
          このレポートを閲覧する権限がありません。該当大学の閲覧権を購入するか、ログイン状態を確認してください。
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/reports"
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold text-[color:var(--color-foreground)] transition hover:bg-white/10"
          >
            レポート一覧へ
          </Link>
          <Link
            href="/purchase"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-6 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)]"
          >
            閲覧権を購入する
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold text-[color:var(--color-foreground)] transition hover:bg-white/10"
          >
            ログイン
          </Link>
        </div>
      </div>
    );
  }

  const textOrDash = (v: string | null | undefined) =>
    v && v.trim() ? v : "（未記入）";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <div className="text-xs font-semibold text-[color:var(--color-muted)]">
          レポート概要
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {row.university_name}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--color-muted)]">
          <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
            年度 {row.year}
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
            {row.format}
          </span>
        </div>
      </div>

      <Section title="質問">{textOrDash(row.content)}</Section>

      <Section title="深掘り">{textOrDash(row.atmosphere)}</Section>

      <Section title="落ちポイント">{textOrDash(row.score)}</Section>

      <Section title="改善案">{textOrDash(row.improvement)}</Section>

      {row.image_url ? (
        <section className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
          <h2 className="text-sm font-semibold tracking-tight text-[color:var(--color-accent)]">
            得点開示（画像）
          </h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={row.image_url}
              alt="得点開示の資料"
              className="max-h-[min(70vh,720px)] w-full object-contain"
            />
          </div>
        </section>
      ) : null}

      <div className="flex justify-center">
        <Link
          href="/reports"
          className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold text-[color:var(--color-foreground)] transition hover:bg-white/10"
        >
          レポート一覧へ戻る
        </Link>
      </div>
    </div>
  );
}
