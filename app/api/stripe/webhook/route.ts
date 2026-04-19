import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import {
  hasApprovedReportForUniversity,
  isPurchasableUniversity,
} from "@/app/lib/purchasableUniversities";
import { getStripe } from "@/lib/stripe-server";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("[stripe webhook] STRIPE_WEBHOOK_SECRET 未設定のため受信をスキップします。");
    return NextResponse.json({ received: true, skipped: true });
  }

  const rawBody = await request.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "stripe-signature がありません。" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "署名の検証に失敗しました。" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      const userId = session.metadata?.user_id;
      const universityName = session.metadata?.university_name?.trim();
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!userId || !universityName || !supabaseUrl) {
        // メタデータ不足時は何もしない
      } else if (serviceKey) {
        const admin = createClient(supabaseUrl, serviceKey);
        const purchasable =
          (await isPurchasableUniversity(admin, universityName)) &&
          (await hasApprovedReportForUniversity(admin, universityName));
        if (purchasable) {
          const { error } = await admin.from("university_report_entitlements").upsert(
            {
              user_id: userId,
              university_name: universityName,
            },
            { onConflict: "user_id,university_name" }
          );
          if (error) {
            console.error("[stripe webhook] upsert failed", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
        }
      } else if (anon) {
        const pub = createClient(supabaseUrl, anon);
        const purchasable =
          (await isPurchasableUniversity(pub, universityName)) &&
          (await hasApprovedReportForUniversity(pub, universityName));
        if (purchasable) {
          console.warn(
            "[stripe webhook] SUPABASE_SERVICE_ROLE_KEY 未設定のため DB 同期をスキップ（/purchase/success の sync で反映）。"
          );
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
