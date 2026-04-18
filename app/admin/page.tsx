import { PageShell } from "../_components/PageShell";
import { AdminClient } from "./AdminClient";

export default function AdminPage() {
  return (
    <PageShell
      title="管理画面"
      subtitle="投稿レポートの承認、大学データの管理、ユーザー一覧をまとめます。管理者以外はアクセスできません。"
    >
      <AdminClient />
    </PageShell>
  );
}

