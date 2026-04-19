import { PageShell } from "../_components/PageShell";
import { ReportsClient } from "./ReportsClient";

export default function ReportsPage() {
  return (
    <PageShell
      title="面接落ちレポート一覧"
      subtitle="大学ごとに承認済みレポートを表示します。閲覧権（¥2,000/大学）を購入すると、該当大学のレポート詳細を閲覧できます。"
    >
      <ReportsClient />
    </PageShell>
  );
}

