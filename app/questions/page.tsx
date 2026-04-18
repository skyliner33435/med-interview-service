import { PageShell } from "../_components/PageShell";
import { sampleUniversityQuestions } from "../lib/sampleData";
import { QuestionsClient } from "./QuestionsClient";

export default function QuestionsPage() {
  return (
    <PageShell
      title="過去質問集"
      subtitle="大学別の過去質問を、アコーディオンで開閉できます。無料・登録不要です。"
    >
      <QuestionsClient sets={sampleUniversityQuestions} />
    </PageShell>
  );
}

