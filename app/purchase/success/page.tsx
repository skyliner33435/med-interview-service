import { Suspense } from "react";
import { PageShell } from "../../_components/PageShell";
import { SuccessClient } from "./SuccessClient";

export default function PurchaseSuccessPage() {
  return (
    <PageShell
      title="決済完了"
      subtitle="Stripe Checkout 後の処理です。閲覧権をアカウントに反映します。"
    >
      <Suspense
        fallback={
          <div className="rounded-3xl bg-[color:var(--color-card)] p-8 ring-1 ring-white/10">
            <div className="h-4 w-56 rounded bg-white/10" />
          </div>
        }
      >
        <SuccessClient />
      </Suspense>
    </PageShell>
  );
}
