import type { SupabaseClient } from "@supabase/supabase-js";
import { ALL_UNIVERSITIES_ENTITLEMENT } from "./entitlements";

/**
 * Stripe Checkout / webhook で購入可能か。
 * `public.universities` に存在する大学名のみ許可（service role または anon いずれでも SELECT 可想定）。
 */
export async function isPurchasableUniversity(
  supabase: SupabaseClient,
  rawName: string | null | undefined
): Promise<boolean> {
  const name = rawName?.trim() ?? "";
  if (!name || name === ALL_UNIVERSITIES_ENTITLEMENT) return false;

  const { data, error } = await supabase
    .from("universities")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (error) {
    console.error("[universities] isPurchasableUniversity lookup failed", error);
    return false;
  }
  return Boolean(data);
}

/** 承認済みレポートが 1 件以上ある大学のみ閲覧権を購入可能にする */
export async function hasApprovedReportForUniversity(
  supabase: SupabaseClient,
  rawName: string | null | undefined
): Promise<boolean> {
  const name = rawName?.trim() ?? "";
  if (!name) return false;

  const { data, error } = await supabase.rpc("count_approved_reports_for_university", {
    p_name: name,
  });

  if (!error) {
    const n = typeof data === "number" ? data : Number(data);
    return Number.isFinite(n) && n > 0;
  }

  const { count, error: fallbackErr } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")
    .eq("university_name", name);

  if (fallbackErr) {
    console.error("[reports] hasApprovedReportForUniversity failed", error, fallbackErr);
    return false;
  }
  return (count ?? 0) > 0;
}
