import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { isAdminEmail } from "@/app/lib/adminConfig";

type Body = {
  reportId?: string;
  kind?: "approved" | "sendback";
  comment?: string;
};

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return "(invalid)";
  const safeLocal =
    local.length <= 2 ? "**" : `${local.slice(0, 2)}…${local.slice(-1)}`;
  return `${safeLocal}@${domain}`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(request: Request) {
  console.log(
    "[send-report-notification] POST invoked",
    new Date().toISOString()
  );

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const rawKey = process.env.RESEND_API_KEY?.trim() ?? "";
    console.log("[send-report-notification] RESEND_API_KEY check", {
      defined: rawKey.length > 0,
      length: rawKey.length,
      prefix: rawKey.length >= 4 ? `${rawKey.slice(0, 4)}…` : "(empty)",
    });

    if (!supabaseUrl || !anon) {
      return NextResponse.json(
        { error: "Supabase の環境変数が不足しています。" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn("[send-report-notification] missing Authorization bearer");
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }
    const jwt = authHeader.slice("Bearer ".length).trim();
    const supabaseAuth = createClient(supabaseUrl, anon);
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(jwt);
    if (userErr || !userData.user?.email || !isAdminEmail(userData.user.email)) {
      console.warn("[send-report-notification] forbidden", {
        userErr: userErr?.message,
        email: userData.user?.email ?? null,
      });
      return NextResponse.json({ error: "管理者のみ実行できます。" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Body;
    const reportId = body.reportId?.trim();
    const kind = body.kind;
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";

    console.log("[send-report-notification] request body ok", {
      reportId,
      kind,
      hasComment: Boolean(comment),
      adminEmail: userData.user.email,
    });

    if (!reportId || (kind !== "approved" && kind !== "sendback")) {
      return NextResponse.json({ error: "reportId と kind が必要です。" }, { status: 400 });
    }
    if (kind === "sendback" && !comment) {
      return NextResponse.json({ error: "差し戻しのコメントが必要です。" }, { status: 400 });
    }

    if (!serviceKey) {
      console.warn(
        "[send-report-notification] skip: SUPABASE_SERVICE_ROLE_KEY unset"
      );
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY が未設定のため投稿者メールを取得できません。",
          skipped: true,
        },
        { status: 503 }
      );
    }

    const svc = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: report, error: repErr } = await svc
      .from("reports")
      .select("id, submitted_by, university_name, status, admin_comment")
      .eq("id", reportId)
      .maybeSingle();

    if (repErr || !report) {
      console.warn("[send-report-notification] report not found", {
        reportId,
        repErr: repErr?.message,
      });
      return NextResponse.json(
        { error: repErr?.message ?? "レポートが見つかりません。" },
        { status: 404 }
      );
    }

    const row = report as {
      submitted_by: string | null;
      university_name: string;
      status: string;
      admin_comment: string | null;
    };

    const submitterId = row.submitted_by?.trim();
    if (!submitterId) {
      console.warn("[send-report-notification] skip: no submitted_by", {
        reportId,
      });
      return NextResponse.json(
        { ok: true, skipped: true, reason: "submitted_by がありません。" },
        { status: 200 }
      );
    }

    const { data: authUser, error: authUserErr } =
      await svc.auth.admin.getUserById(submitterId);

    if (authUserErr || !authUser?.user?.email) {
      console.warn("[send-report-notification] skip: no submitter email", {
        reportId,
        submitterId,
        authUserErr: authUserErr?.message,
      });
      return NextResponse.json(
        {
          ok: true,
          skipped: true,
          reason: authUserErr?.message ?? "投稿者のメールアドレスを取得できませんでした。",
        },
        { status: 200 }
      );
    }

    const submitterEmail = authUser.user.email;

    if (!rawKey) {
      console.warn("[send-report-notification] skip: RESEND_API_KEY empty");
      return NextResponse.json(
        {
          ok: true,
          skipped: true,
          reason: "RESEND_API_KEY が未設定のためメールを送信していません。",
        },
        { status: 200 }
      );
    }

    const reasonText =
      kind === "sendback"
        ? comment || row.admin_comment?.trim() || "（理由の記載なし）"
        : "";

    // ご指定のシンプルな送信形（検証用: to は固定。本文に実投稿者を記載）
    const resend = new Resend(rawKey);

    console.log("[send-report-notification] calling Resend.emails.send", {
      from: "onboarding@resend.dev",
      toFixed: "skyliner33435@gmail.com",
      submitterForInfo: maskEmail(submitterEmail),
      kind,
    });

    const sendResult =
      kind === "approved"
        ? await resend.emails.send({
            from: "onboarding@resend.dev",
            to: "skyliner33435@gmail.com",
            subject: "テスト",
            html: `<p>テストメールです（承認通知）。</p><p>投稿者（本来の宛先）: ${escapeHtml(submitterEmail)}</p><p>大学: ${escapeHtml(row.university_name)}</p>`,
          })
        : await resend.emails.send({
            from: "onboarding@resend.dev",
            to: "skyliner33435@gmail.com",
            subject: "テスト",
            html: `<p>テストメールです（差し戻し通知）。理由: ${escapeHtml(reasonText)}</p><p>投稿者（本来の宛先）: ${escapeHtml(submitterEmail)}</p><p>大学: ${escapeHtml(row.university_name)}</p>`,
          });

    if (sendResult.error) {
      console.error(
        "[send-report-notification] Resend error",
        kind,
        JSON.stringify(sendResult.error, null, 2)
      );
      return NextResponse.json(
        { error: sendResult.error.message },
        { status: 502 }
      );
    }

    const resendEmailId = sendResult.data?.id;
    if (!resendEmailId) {
      console.error("[send-report-notification] Resend returned no id", {
        kind,
        sendResult,
      });
      return NextResponse.json(
        { error: "Resend の応答にメール ID がありません。" },
        { status: 502 }
      );
    }

    console.log("[send-report-notification] Resend ok", {
      kind,
      resendEmailId,
    });

    return NextResponse.json({
      ok: true,
      emailed: true,
      resendEmailId,
      from: "onboarding@resend.dev",
    });
  } catch (e) {
    console.error("[send-report-notification]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "メール送信に失敗しました。" },
      { status: 500 }
    );
  }
}
