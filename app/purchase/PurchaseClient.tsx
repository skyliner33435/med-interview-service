"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const PRICE_JPY = 2000;

type UniversityRow = {
  name: string;
  prefecture: string;
  region: string;
  ownership: string;
};

const REGION_ORDER = [
  "北海道",
  "東北",
  "関東",
  "中部",
  "近畿",
  "中国",
  "四国",
  "九州",
] as const;

export function PurchaseClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [universities, setUniversities] = useState<UniversityRow[]>([]);
  const [approvedUniversityNames, setApprovedUniversityNames] = useState<
    Set<string>
  >(new Set());
  const [uniLoading, setUniLoading] = useState(true);
  const [uniError, setUniError] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    variant: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const preselect = searchParams.get("university")?.trim() ?? "";

  const groupedUniversities = useMemo(() => {
    const byRegion = new Map<string, UniversityRow[]>();
    for (const u of universities) {
      const list = byRegion.get(u.region) ?? [];
      list.push(u);
      byRegion.set(u.region, list);
    }
    const ordered: { region: string; items: UniversityRow[] }[] = [];
    const known = REGION_ORDER as readonly string[];
    for (const r of REGION_ORDER) {
      const items = byRegion.get(r);
      if (items?.length) ordered.push({ region: r, items });
    }
    for (const [region, items] of byRegion) {
      if (!known.includes(region)) {
        ordered.push({ region, items });
      }
    }
    return ordered;
  }, [universities]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getSession().then((res) => {
      const session = (res as { data: { session: Session | null } }).data.session;
      setUser((session?.user as User | null) ?? null);
      setBooting(false);
    });
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    setUniLoading(true);
    setUniError(null);
    void (async () => {
      const [uRes, rRes] = await Promise.all([
        supabase
          .from("universities")
          .select("name, prefecture, region, ownership")
          .order("region")
          .order("name"),
        supabase
          .from("reports")
          .select("university_name")
          .eq("status", "approved"),
      ]);

      if (uRes.error) {
        setUniError(uRes.error.message);
        setUniversities([]);
      } else {
        setUniversities((uRes.data as UniversityRow[]) ?? []);
      }

      if (rRes.error) {
        console.warn("[purchase] approved reports fetch", rRes.error);
        setApprovedUniversityNames(new Set());
      } else {
        const s = new Set<string>();
        for (const row of (rRes.data as { university_name: string | null }[]) ??
          []) {
          const n = row.university_name?.trim();
          if (n) s.add(n);
        }
        setApprovedUniversityNames(s);
      }

      setUniLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (searchParams.get("canceled") === "1") {
      setMessage({
        variant: "info",
        text: "決済がキャンセルされました。必要であれば再度お試しください。",
      });
    }
  }, [searchParams]);

  async function startCheckout(universityName: string) {
    setMessage(null);
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/purchase?university=${encodeURIComponent(universityName)}`)}`);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = (await supabase.auth.getSession()) as {
      data: { session: Session | null };
    };
    const token = sessionData.session?.access_token;
    if (!token) {
      setMessage({ variant: "error", text: "セッションが取得できません。再ログインしてください。" });
      return;
    }

    setCheckoutId(universityName);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ universityName }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok) {
        setMessage({
          variant: "error",
          text: payload.error ?? "Checkout の開始に失敗しました。",
        });
        return;
      }
      if (payload.url) {
        window.location.href = payload.url;
        return;
      }
      setMessage({ variant: "error", text: "Checkout URL が返りませんでした。" });
    } catch {
      setMessage({ variant: "error", text: "通信エラーが発生しました。" });
    } finally {
      setCheckoutId(null);
    }
  }

  if (booting) {
    return (
      <div className="rounded-3xl bg-[color:var(--color-card)] p-8 ring-1 ring-white/10">
        <div className="h-4 w-40 rounded bg-white/10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div
          className={[
            "rounded-2xl px-4 py-3 text-sm ring-1",
            message.variant === "error"
              ? "border border-red-500/30 bg-red-500/10 text-red-100 ring-red-500/20"
              : message.variant === "success"
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-50 ring-emerald-500/20"
                : "border border-white/15 bg-white/5 text-[color:var(--color-foreground)] ring-white/10",
          ].join(" ")}
        >
          {message.text}
        </div>
      ) : null}

      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10 md:p-8">
        <div className="text-lg font-semibold tracking-tight">大学別レポート閲覧権</div>
        <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
          1 大学あたり <span className="font-semibold text-[color:var(--color-foreground)]">¥{PRICE_JPY.toLocaleString("ja-JP")}</span>
          。決済完了後、レポート一覧でその大学の詳細レポートを閲覧できるようになります。
        </p>
        <p className="mt-2 text-xs leading-6 text-[color:var(--color-muted)]">
          表示大学は Supabase の <code className="text-[color:var(--color-foreground)]">universities</code>{" "}
          から取得しています。承認済み（
          <code className="text-[color:var(--color-foreground)]">approved</code>
          ）のレポートが 1 件以上ある大学のみ決済できます。
        </p>
        {!user ? (
          <p className="mt-4 text-sm text-[color:var(--color-muted)]">
            購入には{" "}
            <Link href="/login" className="font-semibold text-[color:var(--color-accent)] underline-offset-4 hover:underline">
              ログイン
            </Link>{" "}
            が必要です。
          </p>
        ) : null}
      </div>

      {uniLoading ? (
        <div className="rounded-3xl bg-[color:var(--color-card)] p-8 ring-1 ring-white/10">
          <div className="text-sm text-[color:var(--color-muted)]">大学一覧を読み込み中…</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-3xl bg-white/5 ring-1 ring-white/10" />
            ))}
          </div>
        </div>
      ) : uniError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          大学一覧の取得に失敗しました: {uniError}
        </div>
      ) : universities.length === 0 ? (
        <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-[color:var(--color-muted)]">
          登録された大学がありません。Supabase で{" "}
          <code className="text-[color:var(--color-foreground)]">supabase/sql/universities_table_and_seed.sql</code>{" "}
          を実行してください。
        </div>
      ) : (
        <div className="space-y-10">
          {groupedUniversities.map(({ region, items }) => (
            <section key={region} className="space-y-4">
              <h2 className="text-sm font-semibold tracking-tight text-[color:var(--color-muted)]">
                {region}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {items.map((u) => {
                  const busy = checkoutId === u.name;
                  const highlight = preselect && preselect === u.name;
                  const canPurchase = approvedUniversityNames.has(u.name);
                  return (
                    <div
                      key={u.name}
                      className={[
                        "rounded-3xl p-6 ring-1",
                        highlight
                          ? "bg-[color:var(--color-accent)]/10 ring-[color:var(--color-accent)]/40"
                          : "bg-[color:var(--color-card)] ring-white/10",
                      ].join(" ")}
                    >
                      <div className="text-lg font-semibold tracking-tight">{u.name}</div>
                      <div className="mt-2 text-sm text-[color:var(--color-muted)]">
                        {u.prefecture} ・ {u.region} ・ {u.ownership}
                      </div>
                      <div className="mt-2 text-sm text-[color:var(--color-muted)]">
                        閲覧権（1大学）: ¥{PRICE_JPY.toLocaleString("ja-JP")}
                      </div>
                      {canPurchase ? (
                        <button
                          type="button"
                          disabled={busy || checkoutId !== null}
                          onClick={() => void startCheckout(u.name)}
                          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-[color:var(--color-accent)] px-5 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)] disabled:opacity-60 md:w-auto"
                        >
                          {busy ? "処理中..." : "Stripe で決済する"}
                        </button>
                      ) : (
                        <div className="mt-5 space-y-2">
                          <p className="text-sm font-medium text-[color:var(--color-muted)]">
                            レポート準備中
                          </p>
                          <button
                            type="button"
                            disabled
                            className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-full bg-neutral-600 px-5 text-sm font-semibold tracking-tight text-neutral-300 opacity-80 md:w-auto"
                          >
                            Stripe で決済する
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="text-center text-sm text-[color:var(--color-muted)]">
        <Link href="/reports" className="text-[color:var(--color-accent)] underline-offset-4 hover:underline">
          レポート一覧へ戻る
        </Link>
      </div>
    </div>
  );
}
