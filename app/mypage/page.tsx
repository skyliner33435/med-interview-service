import { PageShell } from "../_components/PageShell";
import { MypageClient } from "./MypageClient";

export default function MypagePage() {
  return (
    <PageShell title="マイページ" subtitle="ログイン状態の確認と、簡単な操作をまとめます。">
      <MypageClient />
    </PageShell>
  );
}

