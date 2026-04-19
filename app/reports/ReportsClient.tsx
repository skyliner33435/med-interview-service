"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ALL_UNIVERSITIES_ENTITLEMENT } from "@/app/lib/entitlements";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type ReportSummary = {
  id: string;
  university_name: string;
  report_year: number;
  format: string;
};

type UniversityRow = {
  name: string;
  prefecture: string;
  region: string;
  ownership: string;
};

const REGIONS = [
  "北海道",
  "東北",
  "関東",
  "中部",
  "近畿",
  "中国",
  "四国",
  "九州",
] as const;

const OWNERSHIP_OPTIONS = ["国立", "公立", "私立"] as const;

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function hasUniversityAccess(
  entitled: Set<string>,
  universityName: string
) {
  return (
    entitled.has(ALL_UNIVERSITIES_ENTITLEMENT) ||
    entitled.has(universityName)
  );
}

export function ReportsClient() {
  const [summaries, setSummaries] = useState<ReportSummary[]>([]);
  const [universities, setUniversities] = useState<UniversityRow[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  const [entitledUniversities, setEntitledUniversities] = useState<Set<string>>(
    () => new Set()
  );
  const [entitlementsBoot, setEntitlementsBoot] = useState(true);

  const [ownershipFilter, setOwnershipFilter] = useState<
    (typeof OWNERSHIP_OPTIONS)[number] | ""
  >("");
  const [regionFilter, setRegionFilter] = useState<(typeof REGIONS)[number] | "">(
    ""
  );
  const [prefFilter, setPrefFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [formatFilter, setFormatFilter] = useState<string>("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;
    setListLoading(true);
    setListError(null);

    void Promise.all([
      supabase.rpc("approved_reports_public_list"),
      supabase
        .from("universities")
        .select("name, prefecture, region, ownership")
        .order("region")
        .order("name"),
    ]).then(([rpcRes, uniRes]) => {
      if (cancelled) return;
      if (rpcRes.error) {
        setListError(rpcRes.error.message);
        setSummaries([]);
      } else {
        setListError(null);
        setSummaries((rpcRes.data as ReportSummary[] | null) ?? []);
      }
      if (uniRes.error) {
        console.warn("[reports] universities for filters", uniRes.error.message);
        setUniversities([]);
      } else {
        setUniversities((uniRes.data as UniversityRow[]) ?? []);
      }
      setListLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user as User | null;
      if (!user) {
        if (!cancelled) {
          setEntitledUniversities(new Set());
          setEntitlementsBoot(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("university_report_entitlements")
        .select("university_name");

      if (error) {
        console.warn("[reports] entitlements fetch skipped", error.message);
        if (!cancelled) {
          setEntitledUniversities(new Set());
          setEntitlementsBoot(false);
        }
        return;
      }

      const rows = (data ?? []) as { university_name: string }[];
      const names = new Set<string>(rows.map((row) => row.university_name));
      if (!cancelled) {
        setEntitledUniversities(names);
        setEntitlementsBoot(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const uniByName = useMemo(() => {
    const m = new Map<string, UniversityRow>();
    for (const u of universities) m.set(u.name, u);
    return m;
  }, [universities]);

  const yearOptions = useMemo(() => {
    const ys = unique(summaries.map((s) => String(s.report_year))).sort(
      (a, b) => Number(b) - Number(a)
    );
    return ys;
  }, [summaries]);

  const formatOptions = useMemo(() => {
    return unique(summaries.map((s) => s.format)).sort((a, b) =>
      a.localeCompare(b, "ja")
    );
  }, [summaries]);

  const prefectures = useMemo(() => {
    const xs = unique(universities.map((u) => u.prefecture));
    xs.sort((a, b) => a.localeCompare(b, "ja"));
    return xs;
  }, [universities]);

  const filteredSummaries = useMemo(() => {
    const query = q.trim();
    return summaries.filter((s) => {
      const meta = uniByName.get(s.university_name);
      if (ownershipFilter && meta?.ownership !== ownershipFilter) return false;
      if (regionFilter && meta?.region !== regionFilter) return false;
      if (prefFilter && meta?.prefecture !== prefFilter) return false;
      if (yearFilter && String(s.report_year) !== yearFilter) return false;
      if (formatFilter && s.format !== formatFilter) return false;
      if (!query) return true;
      return (
        s.university_name.includes(query) ||
        s.format.includes(query) ||
        Boolean(meta?.prefecture.includes(query)) ||
        Boolean(meta?.region.includes(query))
      );
    });
  }, [
    summaries,
    uniByName,
    ownershipFilter,
    regionFilter,
    prefFilter,
    yearFilter,
    formatFilter,
    q,
  ]);

  const grouped = useMemo(() => {
    const m = new Map<string, ReportSummary[]>();
    for (const s of filteredSummaries) {
      const k = s.university_name;
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    const keys = Array.from(m.keys()).sort((a, b) => a.localeCompare(b, "ja"));
    return keys.map((university_name) => ({
      university_name,
      rows: m.get(university_name)!,
      meta: uniByName.get(university_name),
    }));
  }, [filteredSummaries, uniByName]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[color:var(--color-card)] p-5 ring-1 ring-white/10 md:p-6">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <label className="block">
            <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
              国立/公立/私立
            </div>
            <select
              value={ownershipFilter}
              onChange={(e) =>
                setOwnershipFilter(
                  e.target.value as (typeof OWNERSHIP_OPTIONS)[number] | ""
                )
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none ring-0 transition focus:border-[color:var(--color-accent)]/60"
            >
              <option value="">すべて</option>
              {OWNERSHIP_OPTIONS.map((t) => (
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
              onChange={(e) =>
                setRegionFilter(e.target.value as (typeof REGIONS)[number] | "")
              }
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
              年度
            </div>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none ring-0 transition focus:border-[color:var(--color-accent)]/60"
            >
              <option value="">すべて</option>
              {yearOptions.map((y) => (
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
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none ring-0 transition focus:border-[color:var(--color-accent)]/60"
            >
              <option value="">すべて</option>
              {formatOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
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
              placeholder="大学名など"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--color-muted)]">
          <div>
            表示:{" "}
            <span className="font-semibold text-[color:var(--color-foreground)]">
              {filteredSummaries.length}
            </span>
            <span className="text-[color:var(--color-muted)]"> / </span>
            {summaries.length} 件
          </div>
          <button
            type="button"
            onClick={() => {
              setOwnershipFilter("");
              setRegionFilter("");
              setPrefFilter("");
              setYearFilter("");
              setFormatFilter("");
              setQ("");
            }}
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-sm font-semibold tracking-tight text-[color:var(--color-foreground)] transition hover:bg-white/10"
          >
            リセット
          </button>
        </div>
      </div>

      {listError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          レポート一覧の取得に失敗しました: {listError}
          <div className="mt-2 text-xs text-red-200/80">
            Supabase で{" "}
            <code className="text-[color:var(--color-foreground)]">
              reports_entitled_read_and_list_rpc.sql
            </code>{" "}
            を実行済みか確認してください。
          </div>
        </div>
      ) : null}

      {!entitlementsBoot && entitledUniversities.has(ALL_UNIVERSITIES_ENTITLEMENT) ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50 ring-1 ring-emerald-500/20">
          全大学のレポート閲覧権があります。すべてのレポートを閲覧できます。
        </div>
      ) : null}

      {listLoading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-3xl bg-white/5 ring-1 ring-white/10"
            />
          ))}
        </div>
      ) : summaries.length === 0 && !listError ? (
        <div className="rounded-3xl bg-[color:var(--color-card)] p-8 text-center text-sm text-[color:var(--color-muted)] ring-1 ring-white/10">
          承認済みのレポートがまだありません。
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => {
            const access = hasUniversityAccess(
              entitledUniversities,
              group.university_name
            );
            return (
              <section
                key={group.university_name}
                className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      {group.university_name}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-[color:var(--color-muted)]">
                      {group.meta ? (
                        <>
                          <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                            {group.meta.ownership}
                          </span>
                          <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                            {group.meta.region}
                          </span>
                          <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                            {group.meta.prefecture}
                          </span>
                        </>
                      ) : (
                        <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                          大学マスタ未登録
                        </span>
                      )}
                      {!entitlementsBoot ? (
                        access ? (
                          <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-semibold text-emerald-200 ring-1 ring-emerald-500/25">
                            {entitledUniversities.has(ALL_UNIVERSITIES_ENTITLEMENT)
                              ? "全大学閲覧"
                              : "閲覧権あり"}
                          </span>
                        ) : (
                          <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                            閲覧権なし
                          </span>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>

                <ul className="mt-4 space-y-4">
                  {group.rows.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="text-sm font-semibold text-[color:var(--color-foreground)]">
                            {row.university_name}
                          </div>
                          <div className="text-xs text-[color:var(--color-muted)]">
                            年度{" "}
                            <span className="font-medium text-[color:var(--color-foreground)]">
                              {row.report_year}
                            </span>
                            {" · "}
                            面接形式{" "}
                            <span className="font-medium text-[color:var(--color-foreground)]">
                              {row.format}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {entitlementsBoot ? (
                            <div className="h-10 w-36 rounded-full bg-white/5 ring-1 ring-white/10" />
                          ) : access ? (
                            <Link
                              href={`/reports/${row.id}`}
                              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[color:var(--color-accent)] px-6 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)] sm:w-auto"
                            >
                              レポートを見る
                            </Link>
                          ) : (
                            <Link
                              href={`/purchase?university=${encodeURIComponent(row.university_name)}`}
                              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[color:var(--color-accent)] px-6 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)] sm:w-auto"
                            >
                              閲覧権を購入する
                            </Link>
                          )}
                        </div>
                      </div>

                      {!entitlementsBoot && !access ? (
                        <div className="relative mt-4 overflow-hidden rounded-2xl border border-dashed border-white/15 bg-black/20 p-4">
                          <div className="pointer-events-none select-none space-y-2 blur-sm">
                            <div className="h-3 max-w-md rounded bg-white/20" />
                            <div className="h-3 max-w-xl rounded bg-white/15" />
                            <div className="h-3 max-w-lg rounded bg-white/15" />
                            <div className="h-3 max-w-sm rounded bg-white/20" />
                          </div>
                          <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-xs font-medium text-white/80">
                            レポート本文は閲覧権購入後に閲覧できます
                          </p>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
