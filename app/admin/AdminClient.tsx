"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { isAdminEmail } from "@/app/lib/adminConfig";
import { ALL_UNIVERSITIES_ENTITLEMENT } from "@/app/lib/entitlements";
import {
  seedUniversities,
  seedUsers,
  type AdminUniversity,
  type AdminUser,
} from "./adminSampleData";

type TabKey = "reports" | "universities" | "users";

function isAdmin(user: User | null) {
  return isAdminEmail(user?.email ?? null);
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

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "pending"
      ? "承認待ち"
      : status === "approved"
        ? "承認済み"
        : status === "rejected"
          ? "差し戻し"
          : status === "published"
            ? "公開済み（旧）"
            : status;
  const className =
    status === "pending"
      ? "rounded-full bg-[color:var(--color-accent)]/15 px-3 py-1 font-semibold text-[color:var(--color-accent)] ring-1 ring-[color:var(--color-accent)]/25"
      : status === "approved" || status === "published"
        ? "rounded-full bg-emerald-500/15 px-3 py-1 font-semibold text-emerald-200 ring-1 ring-emerald-500/25"
        : status === "rejected"
          ? "rounded-full bg-white/5 px-3 py-1 font-semibold text-[color:var(--color-muted)] ring-1 ring-white/10"
          : "rounded-full bg-white/5 px-3 py-1 font-semibold text-[color:var(--color-foreground)] ring-1 ring-white/10";
  return <span className={className}>{label}</span>;
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
      status: "pending" | "approved" | "rejected" | "published";
      submitted_by: string | null;
      admin_comment: string | null;
      image_url: string | null;
    }[]
  >([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [reportActionId, setReportActionId] = useState<string | null>(null);
  const [sendbackForId, setSendbackForId] = useState<string | null>(null);
  const [sendbackDraft, setSendbackDraft] = useState("");
  const [reportsFeedback, setReportsFeedback] = useState<{
    variant: "success" | "error";
    text: string;
  } | null>(null);
  const [universities, setUniversities] =
    useState<AdminUniversity[]>(seedUniversities);
  const [users] = useState<AdminUser[]>(seedUsers);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    // getUser / getSession を多重に叩かない（auth ロック競合を避ける）。
    // 同一 SPA 内でログイン後に遷移してきた場合も getSession で十分。
    void supabase.auth.getSession().then((res) => {
      if (cancelled) return;
      const session = (res as { data: { session: Session | null } }).data
        .session;
      setUser((session?.user as User | null) ?? null);
      setBooting(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      const s = session as Session | null;
      setUser((s?.user as User | null) ?? null);
      setBooting(false);
    });

    return () => {
      cancelled = true;
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

  async function loadReports(opts?: { silent?: boolean }) {
    const silent = Boolean(opts?.silent);
    setReportsError(null);
    if (!silent) setReportsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      console.log("[admin.reports] load start", {
        adminEmail: user?.email ?? null,
        adminUid: user?.id ?? null,
      });

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        const errObj = error as unknown as Record<string, unknown>;
        console.error("[admin.reports] select error (full)", {
          message: error.message,
          code: errObj.code,
          details: errObj.details,
          hint: errObj.hint,
          raw: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        });
        throw error;
      }

      let rows = data ?? [];

      if (rows.length === 0 && user?.id) {
        const seedPayload = {
          university_name: "（自動シード）テスト大学",
          year: new Date().getFullYear(),
          format: "個人面接" as const,
          content: "管理画面初回表示時に 0 件だったため自動投入したテスト行です。",
          atmosphere: "落ち着いて説明を聞いてもらえました。",
          score: null as string | null,
          improvement: null as string | null,
          status: "pending" as const,
          submitted_by: user.id,
          image_url: null as string | null,
        };
        const { error: seedError } = await supabase
          .from("reports")
          .insert(seedPayload);
        if (seedError) {
          console.warn("[admin.reports] auto-seed insert skipped", {
            message: seedError.message,
            code: (seedError as { code?: string }).code,
            details: (seedError as { details?: string }).details,
            hint: (seedError as { hint?: string }).hint,
          });
        } else {
          console.log("[admin.reports] auto-seed: inserted 1 test row");
          const { data: again, error: againError } = await supabase
            .from("reports")
            .select("*")
            .order("created_at", { ascending: false });
          if (againError) {
            console.warn("[admin.reports] refetch after seed failed", againError);
          } else {
            rows = again ?? [];
          }
        }
      }

      console.log("[admin.reports] select success", {
        rowCount: rows.length,
        firstRowKeys: rows[0] ? Object.keys(rows[0] as object) : [],
        firstRowSample: rows[0] ?? null,
        allRows: rows,
      });

      if (rows.length === 0) {
        console.warn(
          "[admin.reports] 0 rows — テーブルが空か、RLS で参照できないか、自動シードの INSERT が拒否されています。supabase/sql/reports_rls_and_seed.sql を確認してください。"
        );
      }

      setReports(rows as typeof reports);
    } catch (err) {
      console.error("[admin.reports] failed (catch)", err);
      setReportsError(
        err instanceof Error ? err.message : "レポート取得に失敗しました。"
      );
    } finally {
      if (!silent) setReportsLoading(false);
    }
  }

  async function notifyReportEmail(
    reportId: string,
    kind: "approved" | "sendback",
    comment?: string
  ): Promise<{ ok: boolean; message?: string; skippedReason?: string }> {
    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = (await supabase.auth.getSession()) as {
      data: { session: Session | null };
    };
    const token = sessionData.session?.access_token;
    if (!token) {
      return { ok: false, message: "セッションが無いため通知メールを送れません。" };
    }
    console.log("[notifyReportEmail] calling /api/admin/send-report-notification", {
      reportId,
      kind,
    });
    let res: Response;
    try {
      res = await fetch("/api/admin/send-report-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportId,
          kind,
          ...(kind === "sendback" && comment ? { comment } : {}),
        }),
      });
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "通知メール送信に失敗しました。",
      };
    }
    let j: Record<string, unknown> = {};
    try {
      j = (await res.json()) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
    if (!res.ok) {
      console.warn("[notifyReportEmail] HTTP error", {
        status: res.status,
        body: j,
      });
      if (j.skipped === true && typeof j.error === "string") {
        return { ok: true, skippedReason: j.error };
      }
      return {
        ok: false,
        message: typeof j.error === "string" ? j.error : res.statusText,
      };
    }
    if (j.skipped === true) {
      console.warn("[notifyReportEmail] skipped", j);
      return {
        ok: true,
        skippedReason:
          typeof j.reason === "string" ? j.reason : "通知をスキップしました。",
      };
    }
    if (j.resendEmailId) {
      console.log("[notifyReportEmail] Resend queued", {
        resendEmailId: j.resendEmailId,
        from: j.from,
      });
    }
    return { ok: true };
  }

  async function updateReportStatus(reportId: string) {
    setReportsFeedback(null);
    setReportActionId(reportId);
    try {
      const supabase = getSupabaseBrowserClient();

      // 画面 state は古いことがあるため、必ず DB から投稿者を取得する
      const { data: metaRow, error: metaErr } = await supabase
        .from("reports")
        .select("submitted_by")
        .eq("id", reportId)
        .maybeSingle();

      if (metaErr) {
        setReportsFeedback({
          variant: "error",
          text: metaErr.message || "レポート情報の取得に失敗しました。",
        });
        return;
      }

      const rawSubmitter = (metaRow as { submitted_by?: unknown } | null)
        ?.submitted_by;
      const submitterId =
        rawSubmitter !== null &&
        rawSubmitter !== undefined &&
        String(rawSubmitter).trim() !== ""
          ? String(rawSubmitter).trim()
          : null;

      console.log("[admin.approve] before status update", {
        reportId,
        submitterId,
        metaRow,
      });

      const { error } = await supabase
        .from("reports")
        .update({ status: "approved" })
        .eq("id", reportId);

      if (error) {
        setReportsFeedback({
          variant: "error",
          text: error.message || "更新に失敗しました。",
        });
        return;
      }

      if (submitterId) {
        const { error: entError } = await supabase
          .from("university_report_entitlements")
          .upsert(
            {
              user_id: submitterId,
              university_name: ALL_UNIVERSITIES_ENTITLEMENT,
            },
            { onConflict: "user_id,university_name" }
          );

        console.log("[admin.approve] entitlement upsert", {
          submitterId,
          university_name: ALL_UNIVERSITIES_ENTITLEMENT,
          entError,
        });

        if (entError) {
          setReportsFeedback({
            variant: "error",
            text: `レポートは承認しましたが、投稿者への全大学閲覧権の付与に失敗しました: ${entError.message}`,
          });
          await loadReports({ silent: true });
          return;
        }
      }

      const mail = await notifyReportEmail(reportId, "approved");
      let mailSuffix = "";
      if (!mail.ok) {
        mailSuffix = ` ${mail.message ?? "通知メール送信に失敗しました。"}`;
      } else if (mail.skippedReason) {
        mailSuffix = `（${mail.skippedReason}）`;
      }

      if (!submitterId) {
        setReportsFeedback({
          variant: "success",
          text: `承認しました（submitted_by が空のため閲覧権は付与していません）。一覧を更新しました。${mailSuffix}`.trim(),
        });
      } else {
        setReportsFeedback({
          variant: "success",
          text: `承認しました。投稿者に全大学の閲覧権を付与しました。一覧を更新しました。${mailSuffix}`.trim(),
        });
      }
      await loadReports({ silent: true });
    } catch (e) {
      setReportsFeedback({
        variant: "error",
        text:
          e instanceof Error ? e.message : "更新処理中にエラーが発生しました。",
      });
    } finally {
      setReportActionId(null);
    }
  }

  async function submitSendback(reportId: string) {
    const text = sendbackDraft.trim();
    if (!text) {
      setReportsFeedback({
        variant: "error",
        text: "差し戻しのコメントを入力してください。",
      });
      return;
    }
    setReportsFeedback(null);
    setReportActionId(reportId);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("reports")
        .update({ status: "rejected", admin_comment: text })
        .eq("id", reportId);

      if (error) {
        setReportsFeedback({
          variant: "error",
          text: error.message || "差し戻しの更新に失敗しました。",
        });
        return;
      }

      const mail = await notifyReportEmail(reportId, "sendback", text);
      let mailSuffix = "";
      if (!mail.ok) {
        mailSuffix = ` ${mail.message ?? "通知メール送信に失敗しました。"}`;
      } else if (mail.skippedReason) {
        mailSuffix = `（${mail.skippedReason}）`;
      }

      setReportsFeedback({
        variant: "success",
        text: `差し戻しました。ステータスとコメントを保存しました。${mailSuffix}`.trim(),
      });
      setSendbackForId(null);
      setSendbackDraft("");
      await loadReports({ silent: true });
    } catch (e) {
      setReportsFeedback({
        variant: "error",
        text:
          e instanceof Error ? e.message : "差し戻し処理中にエラーが発生しました。",
      });
    } finally {
      setReportActionId(null);
    }
  }

  useEffect(() => {
    if (booting || !user || !allowed) return;
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booting, user?.id, allowed]);

  useEffect(() => {
    if (!previewImageUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewImageUrl(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewImageUrl]);

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
              レポート
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
                    レポート一覧
                  </div>
                  <div className="mt-2 text-sm text-[color:var(--color-muted)]">
                    Supabase の <code className="text-[color:var(--color-foreground)]">reports</code>{" "}
                    テーブルから全件取得しています。コンソールに{" "}
                    <code className="text-[color:var(--color-foreground)]">[admin.reports] fetched</code>{" "}
                    が出ればレスポンス確認できます。
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-[color:var(--color-muted)]">
                    {reports.length} 件
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadReports()}
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
              {reportsFeedback ? (
                <div
                  className={[
                    "mt-4 rounded-2xl px-4 py-3 text-sm ring-1",
                    reportsFeedback.variant === "success"
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-50 ring-emerald-500/20"
                      : "border border-red-500/30 bg-red-500/10 text-red-100 ring-red-500/20",
                  ].join(" ")}
                >
                  {reportsFeedback.text}
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
                        <StatusBadge status={r.status} />
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
                      {r.status === "rejected" && r.admin_comment ? (
                        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-[color:var(--color-foreground)]">
                          <span className="font-semibold text-[color:var(--color-muted)]">
                            差し戻しコメント:{" "}
                          </span>
                          {r.admin_comment}
                        </div>
                      ) : null}
                      {r.image_url ? (
                        <div className="mt-4">
                          <div className="text-xs font-semibold text-[color:var(--color-muted)]">
                            添付画像
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImageUrl(r.image_url ?? null)
                            }
                            className="group mt-2 block overflow-hidden rounded-2xl border border-white/10 ring-1 ring-white/10 transition hover:border-[color:var(--color-accent)]/40 hover:ring-[color:var(--color-accent)]/25"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={r.image_url}
                              alt=""
                              className="max-h-48 w-full bg-black/20 object-contain transition group-hover:opacity-95"
                            />
                          </button>
                          <div className="mt-1 text-xs text-[color:var(--color-muted)]">
                            クリックで拡大表示
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {r.status === "pending" ? (
                        <>
                          <button
                            type="button"
                            disabled={
                              reportActionId !== null || sendbackForId !== null
                            }
                            onClick={() => void updateReportStatus(r.id)}
                            className="inline-flex h-11 min-w-[8.5rem] items-center justify-center rounded-full bg-[color:var(--color-accent)] px-5 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)] disabled:opacity-60"
                          >
                            {reportActionId === r.id ? "処理中..." : "承認"}
                          </button>
                          <button
                            type="button"
                            disabled={
                              reportActionId !== null || sendbackForId !== null
                            }
                            onClick={() => {
                              setReportsFeedback(null);
                              setSendbackForId(r.id);
                              setSendbackDraft("");
                            }}
                            className="inline-flex h-11 min-w-[8.5rem] items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-semibold tracking-tight text-[color:var(--color-foreground)] transition hover:bg-white/10 disabled:opacity-60"
                          >
                            差し戻し
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {sendbackForId === r.id ? (
                    <div className="mt-5 rounded-2xl border border-[color:var(--color-accent)]/25 bg-[color:var(--color-accent)]/5 p-4 ring-1 ring-[color:var(--color-accent)]/15">
                      <div className="text-sm font-semibold text-[color:var(--color-foreground)]">
                        差し戻しコメント
                      </div>
                      <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                        投稿者にメールで送信されます。必須です。
                      </p>
                      <textarea
                        value={sendbackDraft}
                        onChange={(e) => setSendbackDraft(e.target.value)}
                        rows={4}
                        className="mt-3 w-full resize-y rounded-2xl border border-white/15 bg-[color:var(--color-background)] px-4 py-3 text-sm text-[color:var(--color-foreground)] outline-none ring-0 placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)]/50"
                        placeholder="差し戻しの理由を具体的に書いてください。"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={reportActionId !== null}
                          onClick={() => void submitSendback(r.id)}
                          className="inline-flex h-10 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-5 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)] disabled:opacity-60"
                        >
                          {reportActionId === r.id ? "送信中…" : "送信"}
                        </button>
                        <button
                          type="button"
                          disabled={reportActionId !== null}
                          onClick={() => {
                            setSendbackForId(null);
                            setSendbackDraft("");
                          }}
                          className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-semibold tracking-tight text-[color:var(--color-foreground)] transition hover:bg-white/10 disabled:opacity-60"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}

            {!reportsLoading && !reportsError && reports.length === 0 ? (
              <div className="rounded-3xl bg-[color:var(--color-card)] p-10 text-center ring-1 ring-white/10">
                <div className="text-lg font-semibold tracking-tight">
                  レポートはありません
                </div>
                <div className="mt-2 text-sm text-[color:var(--color-muted)]">
                  投稿がまだ無いか、RLSの設定により取得できていない可能性があります。
                </div>
                <button
                  type="button"
                  onClick={() => void loadReports()}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-semibold tracking-tight text-[color:var(--color-foreground)] transition hover:bg-white/10"
                >
                  もう一度取得する
                </button>
              </div>
            ) : null}
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

      {previewImageUrl ? (
        <button
          type="button"
          aria-label="画像プレビューを閉じる"
          className="fixed inset-0 z-[100] flex cursor-default items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImageUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImageUrl}
            alt=""
            className="max-h-[92vh] max-w-full rounded-xl object-contain shadow-2xl ring-1 ring-white/20"
          />
        </button>
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

