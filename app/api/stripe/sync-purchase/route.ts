import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  hasApprovedReportForUniversity,
  isPurchasableUniversity,
} from "@/app/lib/purchasableUniversities";
import { getStripe } from "@/lib/stripe-server";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anon) {
      return NextResponse.json(
        { error: "Supabase の環境変数が設定されていません。" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }
    const jwt = authHeader.slice("Bearer ".length).trim();
    const supabaseAuth = createClient(supabaseUrl, anon);
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(jwt);
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "セッションが無効です。" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      sessionId?: string;
    } | null;
    const sessionId = body?.sessionId?.trim() ?? "";
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId が必要です。" }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "決済が完了していないセッションです。" },
        { status: 400 }
      );
    }

    if (session.metadata?.user_id !== userData.user.id) {
      return NextResponse.json(
        { error: "この決済は別のアカウント向けです。" },
        { status: 403 }
      );
    }

    const universityName = session.metadata?.university_name?.trim() ?? "";
    if (
      !universityName ||
      !(await isPurchasableUniversity(supabaseAuth, universityName))
    ) {
      return NextResponse.json({ error: "決済メタデータが不正です。" }, { status: 400 });
    }

    if (!(await hasApprovedReportForUniversity(supabaseAuth, universityName))) {
      return NextResponse.json(
        { error: "この大学に承認済みレポートがないため閲覧権を付与できません。" },
        { status: 400 }
      );
    }

    const supabaseUser = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { error } = await supabaseUser
      .from("university_report_entitlements")
      .upsert(
        {
          user_id: userData.user.id,
          university_name: universityName,
        },
        { onConflict: "user_id,university_name" }
      );

    if (error) {
      console.error("[sync-purchase]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, universityName });
  } catch (e) {
    console.error("[sync-purchase]", e);
    const message =
      e instanceof Error ? e.message : "閲覧権の登録に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
