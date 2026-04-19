import { Suspense } from "react";
import { PageShell } from "../_components/PageShell";
import { PurchaseClient } from "./PurchaseClient";

export default function PurchasePage() {
  return (
    <PageShell
      title="閲覧権の購入"
      subtitle="大学ごとに面接落ちレポートの閲覧権を購入できます。お支払いは Stripe Checkout で安全に処理されます。"
    >
      <Suspense
        fallback={
          <div className="rounded-3xl bg-[color:var(--color-card)] p-8 ring-1 ring-white/10">
            <div className="h-4 w-48 rounded bg-white/10" />
          </div>
        }
      >
        <PurchaseClient />
      </Suspense>
    </PageShell>
  );
}
