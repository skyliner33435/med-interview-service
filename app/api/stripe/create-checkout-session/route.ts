import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  hasApprovedReportForUniversity,
  isPurchasableUniversity,
} from "@/app/lib/purchasableUniversities";
import { getStripe } from "@/lib/stripe-server";

const PRICE_JPY = 2000;

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
    const supabase = createClient(supabaseUrl, anon);
    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "セッションが無効です。" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      universityName?: string;
    } | null;
    const universityName = body?.universityName?.trim() ?? "";
    if (
      !universityName ||
      !(await isPurchasableUniversity(supabase, universityName))
    ) {
      return NextResponse.json(
        { error: "購入対象の大学が不正です。" },
        { status: 400 }
      );
    }

    if (!(await hasApprovedReportForUniversity(supabase, universityName))) {
      return NextResponse.json(
        { error: "この大学は承認済みレポートがまだないため購入できません。" },
        { status: 400 }
      );
    }

    const origin =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "jpy",
            unit_amount: PRICE_JPY,
            product_data: {
              name: `面接レポート閲覧権（${universityName}）`,
              description:
                "該当大学の面接落ちレポートの詳細を閲覧できる権利です（アカウントに紐づきます）。",
            },
          },
        },
      ],
      success_url: `${origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/purchase?canceled=1`,
      metadata: {
        user_id: userData.user.id,
        university_name: universityName,
      },
      customer_email: userData.user.email ?? undefined,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout URL の生成に失敗しました。" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[create-checkout-session]", e);
    const message = e instanceof Error ? e.message : "Checkout の作成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
