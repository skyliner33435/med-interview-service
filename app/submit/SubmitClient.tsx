"use client";

import { useMemo, useState } from "react";
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
  const [sending, setSending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      alert(
        `（デモ）投稿を受け付けました。\n\n大学: ${university}\n年度: ${year}\n形式: ${format}\n開示点数: ${scoreDisclosure || "未入力"}`
      );
      setQa("");
      setAtmosphere("");
      setScoreDisclosure("");
    } finally {
      setSending(false);
    }
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
            開示点数（任意）
          </div>
          <input
            value={scoreDisclosure}
            onChange={(e) => setScoreDisclosure(e.target.value)}
            placeholder="例）総合 82/100（面接 18/20）など"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
          />
        </label>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs leading-6 text-[color:var(--color-muted)]">
            ※ ここではデモとして送信結果をアラート表示します。実運用ではログイン必須・
            モデレーション・保存（DB）を追加します。
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

