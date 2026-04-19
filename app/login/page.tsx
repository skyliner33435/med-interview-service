import { Suspense } from "react";
import { PageShell } from "../_components/PageShell";
import { LoginClient } from "./LoginClient";

export default function LoginPage() {
  return (
    <PageShell title="ログイン" subtitle="メールアドレスとパスワードでログインできます。">
      <Suspense fallback={<div className="h-40 rounded-3xl bg-white/5 ring-1 ring-white/10" />}>
        <LoginClient />
      </Suspense>
    </PageShell>
  );
}

