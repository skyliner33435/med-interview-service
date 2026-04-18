"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { sampleReports } from "../lib/sampleData";

type InterviewFormat =
  | "個人面接"
  | "集団面接"
  | "MMI"
  | "グループ討論"
  | "その他";

const FORMATS: InterviewFormat[] = [
  "個人面接",
  "集団面接",
  "MMI",
  "グループ討論",
  "その他",
];

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

export function SubmitClient() {
  const router = useRouter();
  const universities = useMemo(() => {
    const xs = unique(sampleReports.map((r) => r.university));
    xs.sort((a, b) => a.localeCompare(b, "ja"));
    return xs;
  }, []);

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2, y - 3, y - 4].map(String);
  }, []);

  const [university, setUniversity] = useState(universities[0] ?? "");
  const [year, setYear] = useState(years[0]);
  const [format, setFormat] = useState<InterviewFormat>("個人面接");
  const [qa, setQa] = useState("");
  const [atmosphere, setAtmosphere] = useState("");
  const [scoreDisclosure, setScoreDisclosure] = useState("");
  const [improvement, setImprovement] = useState("");
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser((data.user as User | null) ?? null);
      setBooting(false);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = (userData.user as User | null) ?? null;

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      const payload = {
        university_name: university,
        year: Number(year),
        format,
        content: qa,
        atmosphere,
        score: scoreDisclosure || null,
        improvement: improvement || null,
        status: "pending",
        submitted_by: currentUser.id,
      };

      const { error: insertError } = await supabase.from("reports").insert(payload);
      if (insertError) throw insertError;

      alert("投稿を受け付けました。承認後に公開されます。");
      setQa("");
      setAtmosphere("");
      setScoreDisclosure("");
      setImprovement("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿に失敗しました。");
    } finally {
      setSending(false);
    }
  }

  if (booting) {
    return (
      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <div className="h-5 w-48 rounded bg-white/5" />
        <div className="mt-3 h-4 w-72 rounded bg-white/5" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <div className="text-sm text-[color:var(--color-muted)]">
          レポート投稿はログインが必要です。
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
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
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
              受験大学
            </div>
            <select
              required
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--color-accent)]/60"
            >
              {universities.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
              年度
            </div>
            <select
              required
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--color-accent)]/60"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
              面接形式
            </div>
            <select
              required
              value={format}
              onChange={(e) => setFormat(e.target.value as InterviewFormat)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--color-accent)]/60"
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <label className="block">
          <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
            質問と回答（複数OK）
          </div>
          <textarea
            required
            value={qa}
            onChange={(e) => setQa(e.target.value)}
            placeholder="例）\nQ: 志望理由は？\nA: ...\n\nQ: 失敗経験は？\nA: ..."
            rows={8}
            className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
          />
        </label>

        <label className="mt-4 block">
          <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
            雰囲気（圧迫/和やか 等）
          </div>
          <textarea
            value={atmosphere}
            onChange={(e) => setAtmosphere(e.target.value)}
            placeholder="例）穏やか。相槌多め。深掘りは志望理由と自己PRが中心。"
            rows={4}
            className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
          />
        </label>
      </div>

      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <label className="block">
          <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
            改善点・振り返り（任意）
          </div>
          <textarea
            value={improvement}
            onChange={(e) => setImprovement(e.target.value)}
            placeholder="例）結論→根拠→具体例の型を徹底し、大学別の志望理由を強化する。"
            rows={4}
            className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
          />
        </label>

        <label className="block">
          <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
            開示点数（任意）
          </div>
          <input
            value={scoreDisclosure}
            onChange={(e) => setScoreDisclosure(e.target.value)}
            placeholder="例）総合 82/100（面接 18/20）など"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
          />
        </label>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs leading-6 text-[color:var(--color-muted)]">
            ※ 投稿は承認待ち（pending）として保存されます。承認後に公開されます。
          </div>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex h-12 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-7 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)] disabled:opacity-60"
          >
            {sending ? "送信中…" : "送信する"}
          </button>
        </div>
      </div>
    </form>
  );
}

