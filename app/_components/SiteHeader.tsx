import Link from "next/link";
import { AuthCta } from "./AuthCta";

const nav = [
  { href: "/reports", label: "レポート一覧" },
  { href: "/purchase", label: "閲覧権購入" },
  { href: "/questions", label: "過去質問集" },
  { href: "/submit", label: "投稿" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[color:var(--color-background)]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 sm:gap-3"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color:var(--color-accent)]/15 ring-1 ring-[color:var(--color-accent)]/35">
            <span className="font-semibold tracking-tight text-[color:var(--color-accent)]">
              M
            </span>
          </div>
          <span className="whitespace-nowrap text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
            Medhack
          </span>
        </Link>

        <nav
          aria-label="メインメニュー"
          className="flex min-h-10 min-w-0 flex-1 items-center justify-end gap-x-2 overflow-x-auto overscroll-x-contain py-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-x-3 md:gap-x-5 [&::-webkit-scrollbar]:hidden"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 whitespace-nowrap text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] sm:text-sm"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="shrink-0 whitespace-nowrap text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] sm:text-sm"
          >
            ログイン
          </Link>
        </nav>

        <div className="flex shrink-0 items-center pl-1">
          <AuthCta />
        </div>
      </div>
    </header>
  );
}
