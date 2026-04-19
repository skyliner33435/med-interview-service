import { PageShell } from "@/app/_components/PageShell";
import { ReportDetailClient } from "./ReportDetailClient";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell
      title="レポート詳細"
      subtitle="閲覧権のある大学の承認済みレポートのみ表示されます。"
    >
      <ReportDetailClient reportId={id} />
    </PageShell>
  );
}
