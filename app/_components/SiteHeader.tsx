import Link from "next/link";

const nav = [
  { href: "/reports", label: "レポート一覧" },
  { href: "/questions", label: "過去質問集" },
  { href: "/submit", label: "投稿" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[color:var(--color-background)]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--color-accent)]/15 ring-1 ring-[color:var(--color-accent)]/35">
            <span className="font-semibold tracking-tight text-[color:var(--color-accent)]">
              医
            </span>
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">医学部面接レポート</div>
            <div className="text-xs text-[color:var(--color-muted)]">
              受験者の実例で、面接を勝ちにいく。
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-[color:var(--color-muted)] md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-[color:var(--color-foreground)]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            className="hover:text-[color:var(--color-foreground)]"
            href="/login"
          >
            ログイン
          </Link>
        </nav>

        <Link
          href="/questions"
          className="inline-flex h-10 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-4 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)]"
        >
          無料で過去質問を見る
        </Link>
      </div>
    </header>
  );
}

