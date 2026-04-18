import { PageShell } from "../_components/PageShell";
import { SubmitClient } from "./SubmitClient";

export default function SubmitPage() {
  return (
    <PageShell
      title="レポート投稿"
      subtitle="受験大学・年度・面接形式・質問と回答・雰囲気・開示点数を入力して送信してください。"
    >
      <SubmitClient />
    </PageShell>
  );
}

