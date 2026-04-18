import { PageShell } from "../_components/PageShell";
import { LoginClient } from "./LoginClient";

export default function LoginPage() {
  return (
    <PageShell title="ログイン" subtitle="メールアドレスとパスワードでログインできます。">
      <LoginClient />
    </PageShell>
  );
}

