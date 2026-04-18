"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  seedUniversities,
  seedUsers,
  type AdminUniversity,
  type AdminUser,
} from "./adminSampleData";

type TabKey = "reports" | "universities" | "users";

function isAdmin(user: User | null) {
  // TEMP (client-side only):
  // Lock down admin access to a single email until server-side protection is added.
  const allow = ["skyliner33435@gmail.com"];

  if (!user) return false;
  if (user.email && allow.includes(user.email)) return true;
  return false;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[color:var(--color-foreground)]">
      {children}
    </span>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold tracking-tight transition ring-1",
        active
          ? "bg-[color:var(--color-accent)] text-[#1a2744] ring-[color:var(--color-accent)]/40"
          : "bg-white/5 text-[color:var(--color-foreground)] ring-white/10 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function AdminClient() {
  const router = useRouter();

  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<TabKey>("reports");

  const [reports, setReports] = useState<
    {
      id: string;
      created_at: string;
      university_name: string;
      year: number;
      format: string;
      atmosphere: string | null;
      score: string | null;
      improvement: string | null;
      status: "pending" | "published" | "rejected";
      submitted_by: string | null;
    }[]
  >([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [universities, setUniversities] =
    useState<AdminUniversity[]>(seedUniversities);
  const [users] = useState<AdminUser[]>(seedUsers);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser((data.user as User | null) ?? null);
      setBooting(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      const { data } = await supabase.auth.getUser();
      setUser((data.user as User | null) ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const allowed = useMemo(() => isAdmin(user), [user]);

  useEffect(() => {
    if (booting) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!allowed) {
      router.replace("/");
    }
  }, [allowed, booting, router, user]);

  async function loadPendingReports() {
    setReportsError(null);
    setReportsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("reports")
        .select(
          "id, created_at, university_name, year, format, atmosphere, score, improvement, status, submitted_by"
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReports((data ?? []) as any);
    } catch (err) {
      setReportsError(
        err instanceof Error ? err.message : "レポート取得に失敗しました。"
      );
    } finally {
      setReportsLoading(false);
    }
  }

  useEffect(() => {
    if (booting || !user || !allowed) return;
    loadPendingReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booting, user?.id, allowed]);

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
          管理画面はログインが必要です。
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <div className="text-sm text-[color:var(--color-muted)]">
          管理者権限がありません。
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[color:var(--color-card)] p-5 ring-1 ring-white/10 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-[color:var(--color-muted)]">管理者</div>
            <div className="mt-1 font-semibold tracking-tight">
              {user.email ?? "（メール不明）"}
            </div>
            <div className="mt-2 text-xs text-[color:var(--color-muted)]">
              ※ 現段階はモックデータでの管理UIです（後でSupabaseテーブルに接続できます）。
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <TabButton active={tab === "reports"} onClick={() => setTab("reports")}>
              レポート承認
            </TabButton>
            <TabButton
              active={tab === "universities"}
              onClick={() => setTab("universities")}
            >
              大学データ
            </TabButton>
            <TabButton active={tab === "users"} onClick={() => setTab("users")}>
              ユーザー
            </TabButton>
          </div>
        </div>
      </div>

      {tab === "reports" ? (
        <section className="space-y-4">
          <div className="grid gap-5">
            <div className="rounded-3xl bg-[color:var(--color-card)] p-5 ring-1 ring-white/10 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-semibold tracking-tight">
                    承認待ちレポート
                  </div>
                  <div className="mt-2 text-sm text-[color:var(--color-muted)]">
                    status が pending のものだけを表示しています。
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-[color:var(--color-muted)]">
                    {reports.length} 件
                  </div>
                  <button
                    type="button"
                    onClick={loadPendingReports}
                    disabled={reportsLoading}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-sm font-semibold tracking-tight text-[color:var(--color-foreground)] transition hover:bg-white/10 disabled:opacity-60"
                  >
                    {reportsLoading ? "更新中…" : "更新"}
                  </button>
                </div>
              </div>
              {reportsError ? (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {reportsError}
                </div>
              ) : null}
            </div>

            {reports.map((r) => (
                <div
                  key={r.id}
                  className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-lg font-semibold tracking-tight">
                        {r.university_name}（{r.year}）
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[color:var(--color-muted)]">
                        <Pill>{r.format}</Pill>
                        <Pill>投稿日 {new Date(r.created_at).toLocaleString()}</Pill>
                        <span className="rounded-full bg-[color:var(--color-accent)]/15 px-3 py-1 font-semibold text-[color:var(--color-accent)] ring-1 ring-[color:var(--color-accent)]/25">
                          承認待ち
                        </span>
                      </div>

                      <div className="mt-4 text-sm leading-7 text-[color:var(--color-foreground)]">
                        {r.atmosphere ?? "（雰囲気の記載なし）"}
                      </div>
                      {r.score ? (
                        <div className="mt-2 text-xs text-[color:var(--color-muted)]">
                          開示点数: {r.score}
                        </div>
                      ) : null}
                      {r.improvement ? (
                        <div className="mt-3 text-xs leading-6 text-[color:var(--color-muted)]">
                          改善点: {r.improvement}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const supabase = getSupabaseBrowserClient();
                          const { error } = await supabase
                            .from("reports")
                            .update({ status: "published" })
                            .eq("id", r.id);
                          if (error) {
                            alert(error.message);
                            return;
                          }
                          setReports((xs) => xs.filter((x) => x.id !== r.id));
                        }}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-5 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)]"
                      >
                        承認
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const supabase = getSupabaseBrowserClient();
                          const { error } = await supabase
                            .from("reports")
                            .update({ status: "rejected" })
                            .eq("id", r.id);
                          if (error) {
                            alert(error.message);
                            return;
                          }
                          setReports((xs) => xs.filter((x) => x.id !== r.id));
                        }}
                        className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-semibold tracking-tight text-[color:var(--color-foreground)] transition hover:bg-white/10"
                      >
                        却下
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ) : null}

      {tab === "universities" ? (
        <UniversitiesPanel
          universities={universities}
          setUniversities={setUniversities}
        />
      ) : null}

      {tab === "users" ? (
        <section className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="text-lg font-semibold tracking-tight">ユーザー一覧</div>
              <div className="mt-2 text-sm text-[color:var(--color-muted)]">
                ※ Supabaseの管理API（service role）が必要なため、現段階はモック表示です。
              </div>
            </div>
            <div className="text-sm text-[color:var(--color-muted)]">
              {users.length} users
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs text-[color:var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-white/10">
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                          u.role === "admin"
                            ? "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)] ring-[color:var(--color-accent)]/25"
                            : "bg-white/5 text-[color:var(--color-foreground)] ring-white/10",
                        ].join(" ")}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[color:var(--color-muted)]">
                      {u.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function UniversitiesPanel({
  universities,
  setUniversities,
}: {
  universities: AdminUniversity[];
  setUniversities: React.Dispatch<React.SetStateAction<AdminUniversity[]>>;
}) {
  const [editing, setEditing] = useState<AdminUniversity | null>(null);

  const [name, setName] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [region, setRegion] = useState<AdminUniversity["region"]>("関東");
  const [type, setType] = useState<AdminUniversity["type"]>("国立");

  function resetForm() {
    setEditing(null);
    setName("");
    setPrefecture("");
    setRegion("関東");
    setType("国立");
  }

  function startEdit(u: AdminUniversity) {
    setEditing(u);
    setName(u.name);
    setPrefecture(u.prefecture);
    setRegion(u.region);
    setType(u.type);
  }

  function upsert() {
    if (!name.trim()) return;
    if (!prefecture.trim()) return;

    if (editing) {
      setUniversities((xs) =>
        xs.map((x) =>
          x.id === editing.id
            ? { ...x, name: name.trim(), prefecture: prefecture.trim(), region, type }
            : x
        )
      );
      resetForm();
      return;
    }

    const id = `univ_${Math.random().toString(36).slice(2, 9)}`;
    setUniversities((xs) => [
      { id, name: name.trim(), prefecture: prefecture.trim(), region, type },
      ...xs,
    ]);
    resetForm();
  }

  return (
    <section className="space-y-5">
      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-lg font-semibold tracking-tight">大学データ</div>
            <div className="mt-2 text-sm text-[color:var(--color-muted)]">
              追加・編集ができます（現段階はモック、後でSupabaseに保存可能）。
            </div>
          </div>
          <div className="text-sm text-[color:var(--color-muted)]">
            {universities.length} universities
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <label className="block md:col-span-2">
            <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
              大学名
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例）○○大学"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
              都道府県
            </div>
            <input
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              placeholder="例）東京都"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
              地方 / 種別
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select
                value={region}
                onChange={(e) =>
                  setRegion(e.target.value as AdminUniversity["region"])
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--color-accent)]/60"
              >
                {[
                  "北海道",
                  "東北",
                  "関東",
                  "中部",
                  "近畿",
                  "中国",
                  "四国",
                  "九州・沖縄",
                ].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as AdminUniversity["type"])
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--color-accent)]/60"
              >
                {["国立", "公立", "私立"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={upsert}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-5 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)]"
          >
            {editing ? "更新する" : "追加する"}
          </button>
          {editing ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-semibold tracking-tight text-[color:var(--color-foreground)] transition hover:bg-white/10"
            >
              キャンセル
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-[color:var(--color-card)] ring-1 ring-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs text-[color:var(--color-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">大学名</th>
              <th className="px-4 py-3 font-semibold">種別</th>
              <th className="px-4 py-3 font-semibold">地方</th>
              <th className="px-4 py-3 font-semibold">都道府県</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {universities
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name, "ja"))
              .map((u) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-semibold tracking-tight">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--color-muted)]">
                    {u.type}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--color-muted)]">
                    {u.region}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--color-muted)]">
                    {u.prefecture}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => startEdit(u)}
                      className="inline-flex h-9 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-xs font-semibold tracking-tight text-[color:var(--color-foreground)] transition hover:bg-white/10"
                    >
                      編集
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

