"use client";

import { useMemo, useState } from "react";
import type { InterviewFailReport, UnivType } from "../lib/sampleData";

type Region = InterviewFailReport["region"];

const REGIONS: Region[] = [
  "北海道",
  "東北",
  "関東",
  "中部",
  "近畿",
  "中国",
  "四国",
  "九州・沖縄",
];

const TYPES: UnivType[] = ["国立", "公立", "私立"];

type UniversityCardModel = {
  key: string;
  university: string;
  prefecture: string;
  region: Region;
  type: UnivType;
  reportCount: number;
  tags: string[];
};

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function buildUniversityCards(reports: InterviewFailReport[]): UniversityCardModel[] {
  const byUniv = new Map<string, InterviewFailReport[]>();
  for (const r of reports) {
    byUniv.set(r.university, [...(byUniv.get(r.university) ?? []), r]);
  }

  const cards: UniversityCardModel[] = [];
  for (const [university, items] of byUniv.entries()) {
    const head = items[0];
    cards.push({
      key: university,
      university,
      prefecture: head.prefecture,
      region: head.region,
      type: head.type,
      reportCount: items.length,
      tags: unique(items.flatMap((x) => x.tags)).slice(0, 6),
    });
  }

  cards.sort((a, b) => a.university.localeCompare(b.university, "ja"));
  return cards;
}

export function ReportsClient({ reports }: { reports: InterviewFailReport[] }) {
  const allCards = useMemo(() => buildUniversityCards(reports), [reports]);

  const prefectures = useMemo(() => {
    const xs = unique(allCards.map((c) => c.prefecture));
    xs.sort((a, b) => a.localeCompare(b, "ja"));
    return xs;
  }, [allCards]);

  const [typeFilter, setTypeFilter] = useState<UnivType | "">("");
  const [regionFilter, setRegionFilter] = useState<Region | "">("");
  const [prefFilter, setPrefFilter] = useState<string>("");
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const query = q.trim();
    return allCards.filter((c) => {
      if (typeFilter && c.type !== typeFilter) return false;
      if (regionFilter && c.region !== regionFilter) return false;
      if (prefFilter && c.prefecture !== prefFilter) return false;
      if (!query) return true;
      return (
        c.university.includes(query) ||
        c.prefecture.includes(query) ||
        c.tags.some((t) => t.includes(query))
      );
    });
  }, [allCards, prefFilter, q, regionFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[color:var(--color-card)] p-5 ring-1 ring-white/10 md:p-6">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="block">
            <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
              国立/公立/私立
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as UnivType | "")}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none ring-0 transition focus:border-[color:var(--color-accent)]/60"
            >
              <option value="">すべて</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
              地方
            </div>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value as Region | "")}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none ring-0 transition focus:border-[color:var(--color-accent)]/60"
            >
              <option value="">すべて</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
              都道府県
            </div>
            <select
              value={prefFilter}
              onChange={(e) => setPrefFilter(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none ring-0 transition focus:border-[color:var(--color-accent)]/60"
            >
              <option value="">すべて</option>
              {prefectures.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
              キーワード
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="大学名 / タグ / 都道府県"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--color-muted)]">
          <div>
            表示件数:{" "}
            <span className="font-semibold text-[color:var(--color-foreground)]">
              {visible.length}
            </span>
            <span className="text-[color:var(--color-muted)]"> / </span>
            {allCards.length}
          </div>
          <button
            type="button"
            onClick={() => {
              setTypeFilter("");
              setRegionFilter("");
              setPrefFilter("");
              setQ("");
            }}
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-sm font-semibold tracking-tight text-[color:var(--color-foreground)] transition hover:bg-white/10"
          >
            リセット
          </button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {visible.map((c) => (
          <div
            key={c.key}
            className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold tracking-tight">
                  {c.university}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-muted)]">
                  <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                    {c.type}
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                    {c.region}
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                    {c.prefecture}
                  </span>
                  <span className="rounded-full bg-[color:var(--color-accent)]/15 px-3 py-1 font-semibold text-[color:var(--color-accent)] ring-1 ring-[color:var(--color-accent)]/30">
                    レポート {c.reportCount}件
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  alert(
                    `（デモ）${c.university} のレポートを購入: ¥3,000\n\nStripe決済は後で実装します。`
                  )
                }
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-5 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)]"
              >
                購入する
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {c.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[color:var(--color-foreground)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

