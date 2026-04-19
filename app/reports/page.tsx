import { PageShell } from "../_components/PageShell";
import { sampleReports } from "../lib/sampleData";
import { ReportsClient } from "./ReportsClient";

export default function ReportsPage() {
  return (
    <PageShell
      title="面接落ちレポート一覧"
      subtitle="大学別にカード表示。閲覧権（¥2,000/大学）を購入すると、その大学の面接落ちレポート詳細が表示されます。"
    >
      <ReportsClient reports={sampleReports} />
    </PageShell>
  );
}

