import { PageShell } from "../_components/PageShell";
import { SignupClient } from "./SignupClient";

export default function SignupPage() {
  return (
    <PageShell
      title="無料登録"
      subtitle="メールアドレスとパスワードで登録できます。"
    >
      <SignupClient />
    </PageShell>
  );
}

