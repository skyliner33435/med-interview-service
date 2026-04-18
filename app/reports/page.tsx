import { PageShell } from "../_components/PageShell";
import { sampleReports } from "../lib/sampleData";
import { ReportsClient } from "./ReportsClient";

export default function ReportsPage() {
  return (
    <PageShell
      title="面接落ちレポート一覧"
      subtitle="大学別にカード表示。国立/公立/私立・地方・都道府県で絞り込みできます（デモのため一部モックデータ）。"
    >
      <ReportsClient reports={sampleReports} />
    </PageShell>
  );
}

